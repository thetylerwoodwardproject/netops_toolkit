#!/bin/sh
# Install dev.tools.tylerwoodward.me's vhost and header snippet on this box.
#
#   sh /var/www/dev.tools.tylerwoodward.me/deploy/tylerwoodward.me/install-vhost.sh
#
# Run as tyler; it calls sudo itself. Gets a certificate first if there is
# none, backs up anything it replaces to ~/www-archive, rolls back if
# nginx -t fails, and checks the live headers after the reload.
set -eu

HOST=dev.tools.tylerwoodward.me
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
VHOST=/etc/nginx/sites-available/$HOST
ENABLED=/etc/nginx/sites-enabled/$HOST
SNIPPET=/etc/nginx/snippets/twp-headers-tools-astro.conf
ARCHIVE=/home/tyler/www-archive
STAMP=$(date +%Y%m%d-%H%M%S)

[ "$(id -un)" = tyler ] || { echo "run this as tyler, without sudo" >&2; exit 1; }
[ -L /var/www/$HOST/dist ] || { echo "no dist yet: run tools/publish in /var/www/$HOST first" >&2; exit 1; }

sudo -v

if [ ! -f /etc/letsencrypt/live/$HOST/fullchain.pem ]; then
  echo "==> Getting a certificate for $HOST"
  sudo certbot certonly --nginx -d "$HOST"
fi

echo "==> Backing up anything this replaces"
sudo mkdir -p "$ARCHIVE"
for f in "$VHOST" "$SNIPPET"; do
  [ -f "$f" ] && sudo cp -p "$f" "$ARCHIVE/nginx-$(basename "$f")-$STAMP"
done

restore() {
  for f in "$VHOST" "$SNIPPET"; do
    b="$ARCHIVE/nginx-$(basename "$f")-$STAMP"
    if [ -f "$b" ]; then sudo install -m 644 "$b" "$f"; else sudo rm -f "$f"; fi
  done
  [ -f "$VHOST" ] || sudo rm -f "$ENABLED"
}

echo "==> Installing and checking"
sudo install -m 644 "$HERE/twp-headers-tools-astro.conf" "$SNIPPET"
sudo install -m 644 "$HERE/$HOST.conf" "$VHOST"
sudo ln -sfn "$VHOST" "$ENABLED"
if ! sudo nginx -t; then
  restore
  echo "ABORTED: nginx -t failed; restored the previous files. Nothing was reloaded." >&2
  exit 1
fi
sudo systemctl reload nginx

# systemctl reload returns before the old workers retire.
for _ in 1 2 3 4 5 6 7 8 9 10; do
  curl -sI "https://$HOST/" | grep -qi '^content-security-policy:' && break
  sleep 1
done

echo "==> Checking headers"
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
if curl -sI "https://$HOST$asset" | grep -qi '^cache-control:.*immutable'; then
  echo "PASS  $asset (immutable)"
else
  echo "FAIL  $asset is not cached immutable"
  failed=1
fi
code=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://$HOST/ip/")
[ "$code" = "301 https://$HOST/ip-checker/" ] && echo "PASS  /ip/ -> /ip-checker/" || { echo "FAIL  /ip/ gave $code"; failed=1; }

[ "$failed" -eq 0 ] && echo "Done." || { echo "Header check FAILED; the backups are in $ARCHIVE (*-$STAMP)."; exit 1; }
