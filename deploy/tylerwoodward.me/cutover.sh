#!/bin/sh
# Replace the old single-script tools.tylerwoodward.me with this Astro site.
#
#   sh /var/www/dev.tools.tylerwoodward.me/deploy/tylerwoodward.me/cutover.sh --dry-run
#   sh /var/www/dev.tools.tylerwoodward.me/deploy/tylerwoodward.me/cutover.sh
#
# Run as tyler; it calls sudo itself (/var/www is root-owned). The new site is
# cloned, built and verified in a staging directory first, so nothing live
# changes until that works. Then the docroot is swapped, the vhost installed
# and nginx reloaded, with the same checks install-vhost.sh makes. Everything
# replaced goes to ~/www-archive, and any failure puts the old site back.
#
# Rollback after a successful run: move the archived directory back and
# restore nginx-tools.tylerwoodward.me-<stamp> and nginx-twp-headers-tools.conf-<stamp>
# from ~/www-archive (the script prints the stamp).
set -eu

HOST=tools.tylerwoodward.me
DEV=/var/www/dev.tools.tylerwoodward.me
LIVE=/var/www/$HOST
STAGE=/var/www/$HOST.new
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
VHOST=/etc/nginx/sites-available/$HOST
ENABLED=/etc/nginx/sites-enabled/$HOST
SNIPPET=/etc/nginx/snippets/twp-headers-tools-astro.conf
OLD_SNIPPET=/etc/nginx/snippets/twp-headers-tools.conf
ARCHIVE=/home/tyler/www-archive
STAMP=$(date +%Y%m%d-%H%M%S)
OLD_SITE=$ARCHIVE/$HOST-pre-astro-$STAMP

DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1
say() { echo "==> $*"; }
run() { if [ "$DRY" = 1 ]; then echo "    [dry-run] $*"; else "$@"; fi; }

[ "$(id -un)" = tyler ] || { echo "run this as tyler, without sudo" >&2; exit 1; }

say "Preflight"
[ -L $DEV/dist ] || { echo "dev has no dist: run tools/publish in $DEV first" >&2; exit 1; }
[ -d $LIVE/.git ] || { echo "$LIVE is not the old git checkout; already cut over?" >&2; exit 1; }
[ -L $LIVE/dist ] && { echo "$LIVE already has a dist symlink: already cut over" >&2; exit 1; }
[ ! -e $STAGE ] || { echo "$STAGE exists from an earlier run: look at it, then remove it" >&2; exit 1; }
[ -z "$(git -C $DEV status --porcelain)" ] || { echo "dev has uncommitted changes; commit or stash them" >&2; exit 1; }
[ "$(git -C $DEV rev-parse --abbrev-ref HEAD)" = main ] || { echo "dev is not on main" >&2; exit 1; }
[ -f /etc/letsencrypt/live/$HOST/fullchain.pem ] || [ "$DRY" = 1 ] || sudo test -f /etc/letsencrypt/live/$HOST/fullchain.pem \
  || { echo "no certificate for $HOST" >&2; exit 1; }
[ -z "$(git -C $LIVE status --porcelain)" ] || echo "note: the old site has uncommitted changes; they are archived as they are"
echo "    new site: $(git -C $DEV log --oneline -1)"
echo "    old site: $(git -C $LIVE log --oneline -1)"

[ "$DRY" = 1 ] || sudo -v

say "Staging the new site in $STAGE (nothing live changes yet)"
run sudo mkdir "$STAGE"
run sudo chown tyler:tyler "$STAGE"
run git clone -q "$DEV" "$STAGE"
if [ "$DRY" = 0 ]; then
  sed "s#'../../src/lib/toolkit-schema'#'./src/lib/toolkit-schema'#" "$HERE/toolkit.config.prod.ts" > "$STAGE/toolkit.config.local.ts"
fi
if [ "$DRY" = 0 ]; then
  (cd "$STAGE" && npm ci --no-audit --no-fund >/dev/null && tools/publish)
else
  echo "    [dry-run] (cd $STAGE && npm ci && tools/publish)"
fi
[ "$DRY" = 1 ] || [ -L "$STAGE/dist" ] || { echo "staged build failed; $STAGE left for inspection" >&2; exit 1; }
if [ "$DRY" = 0 ] && grep -rq "dev\.tools\.tylerwoodward\.me" "$STAGE/dist/"; then
  echo "staged build mentions the dev host; $STAGE left for inspection" >&2; exit 1
fi
if [ "$DRY" = 0 ] && grep -q "Disallow: /$" "$STAGE/dist/robots.txt"; then
  echo "staged build refuses indexing (robots.txt); $STAGE left for inspection" >&2; exit 1
fi

say "Backing up the nginx files this replaces"
run sudo mkdir -p "$ARCHIVE"
for f in "$VHOST" "$SNIPPET" "$OLD_SNIPPET"; do
  if [ -f "$f" ]; then run sudo cp -p "$f" "$ARCHIVE/nginx-$(basename "$f")-$STAMP"; fi
done

restore() {
  echo "!! Putting the old site back" >&2
  [ -d "$OLD_SITE" ] && { [ -d "$LIVE" ] && sudo mv "$LIVE" "$STAGE.failed-$STAMP"; sudo mv "$OLD_SITE" "$LIVE"; }
  for f in "$VHOST" "$SNIPPET"; do
    b="$ARCHIVE/nginx-$(basename "$f")-$STAMP"
    if [ -f "$b" ]; then sudo install -m 644 "$b" "$f"; else sudo rm -f "$f"; fi
  done
  sudo nginx -t && sudo systemctl reload nginx
}

say "Installing the vhost and testing the config before anything moves"
run sudo install -m 644 "$HERE/twp-headers-tools-astro.conf" "$SNIPPET"
run sudo install -m 644 "$HERE/$HOST.conf" "$VHOST"
run sudo ln -sfn "$VHOST" "$ENABLED"
if [ "$DRY" = 0 ] && ! sudo nginx -t; then
  restore
  echo "ABORTED: nginx -t failed; restored the previous nginx files. The old site is untouched." >&2
  exit 1
fi

say "Swapping the docroot (old site goes to $OLD_SITE)"
run sudo mv "$LIVE" "$OLD_SITE"
run sudo mv "$STAGE" "$LIVE"
run sudo systemctl reload nginx

if [ "$DRY" = 1 ]; then
  say "Then: check headers on / /subnet-calc/ /theme.css /nope/, /_astro/ immutable, /ip/ redirect;"
  say "retire $OLD_SNIPPET if no vhost includes it (grep -R). Dry run finished; nothing changed."
  exit 0
fi

# systemctl reload returns before the old workers retire.
for _ in 1 2 3 4 5 6 7 8 9 10; do
  curl -sI "https://$HOST/" | grep -qi '^content-security-policy:.*script-src .self.;' && break
  sleep 1
done

say "Checking the live site"
failed=0
for path in / /subnet-calc/ /theme.css /nope/; do
  h=$(curl -s -o /dev/null -D - "https://$HOST$path" | tr -d '\r')
  csp=$(printf '%s\n' "$h" | grep -ci "^content-security-policy:.*script-src 'self';")
  hsts=$(printf '%s\n' "$h" | grep -ci '^strict-transport-security:')
  cc=$(printf '%s\n' "$h" | grep -ci '^cache-control:')
  if [ "$csp" = 1 ] && [ "$hsts" = 1 ] && [ "$cc" = 1 ]; then
    echo "PASS  $path"
  else
    echo "FAIL  $path (CSP=$csp HSTS=$hsts Cache-Control=$cc, want 1/1/1)"
    failed=1
  fi
done
asset=$(curl -s "https://$HOST/" | grep -o '/_astro/[^"]*\.css' | head -1)
if [ -n "$asset" ] && curl -sI "https://$HOST$asset" | grep -qi '^cache-control:.*immutable'; then
  echo "PASS  $asset (immutable)"
else
  echo "FAIL  /_astro/ css is not cached immutable"
  failed=1
fi
code=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://$HOST/ip/")
[ "$code" = "301 https://$HOST/ip-checker/" ] && echo "PASS  /ip/ -> /ip-checker/" || { echo "FAIL  /ip/ gave $code"; failed=1; }
curl -s "https://$HOST/robots.txt" | grep -q "Disallow: /$" && { echo "FAIL  robots.txt refuses indexing"; failed=1; } || echo "PASS  robots.txt allows indexing"
curl -s "https://$HOST/" | grep -q "dev\.tools\.tylerwoodward\.me" && { echo "FAIL  home page links to the dev host"; failed=1; } || echo "PASS  no dev host in the home page"

if [ "$failed" -ne 0 ]; then
  restore
  echo "Checks FAILED; the old site is back. The new build is in $STAGE.failed-$STAMP." >&2
  exit 1
fi

say "Retiring the old header snippet if nothing includes it"
# Only real include lines count: the new snippet's header comment names the old one.
INCLUDERS=$(sudo grep -REl "^[[:space:]]*include[[:space:]]+(snippets/)?twp-headers-tools\.conf" /etc/nginx/ 2>/dev/null || true)
if [ -n "$INCLUDERS" ]; then
  echo "    still included somewhere; left in place:"
  echo "$INCLUDERS" | sed 's/^/      /'
else
  sudo mv "$OLD_SNIPPET" "$ARCHIVE/twp-headers-tools.conf-retired-$STAMP"
  echo "    moved to $ARCHIVE/twp-headers-tools.conf-retired-$STAMP"
fi

say "Done. $HOST is the Astro site. The old site is in $OLD_SITE."
echo "Deploy later with: cd $LIVE && git pull --ff-only && tools/publish"
