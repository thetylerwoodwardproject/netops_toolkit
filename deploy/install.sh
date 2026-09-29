#!/usr/bin/env bash
# Install NetOps Toolkit on a Debian or Ubuntu server.
#
#   curl -fsSL https://raw.githubusercontent.com/thetylerwoodwardproject/netops_toolkit/main/deploy/install.sh | sudo bash
#
# With a domain, it also sets up Caddy as the reverse proxy, with HTTPS from
# Let's Encrypt (point the domain's DNS at this server and open ports 80 and 443 first):
#
#   curl -fsSL .../deploy/install.sh | sudo bash -s -- --domain tools.example.com
#
# Options:
#   --domain NAME   your domain; installs Caddy in front of the toolkit
#   --proxy caddy|none
#                   caddy (the default when --domain is given) or none: the
#                   toolkit serves itself over plain HTTP
#   --port N        port the toolkit listens on (default 4321 with Caddy, 80 without)
#   --dir PATH      where to install (default /opt/netops-toolkit)
#   --ref BRANCH    branch or tag to install (default main)
#   --repo URL      git repository to install from
#
# Run it again to upgrade: it pulls, rebuilds, and swaps the new build in
# without downtime. Your toolkit.config.local.ts is never touched.
set -euo pipefail

REPO=https://github.com/thetylerwoodwardproject/netops_toolkit.git
REF=main
DIR=/opt/netops-toolkit
DOMAIN=
PROXY=
PORT=
SERVICE_USER=netops
SERVICE=netops-toolkit

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf 'Error: %s\n' "$*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case $1 in
    --domain) DOMAIN=${2:?--domain needs a value}; shift 2 ;;
    --proxy) PROXY=${2:?--proxy needs a value}; shift 2 ;;
    --port) PORT=${2:?--port needs a value}; shift 2 ;;
    --dir) DIR=${2:?--dir needs a value}; shift 2 ;;
    --ref) REF=${2:?--ref needs a value}; shift 2 ;;
    --repo) REPO=${2:?--repo needs a value}; shift 2 ;;
    -h | --help) sed -n '2,/^set -e/p' "$0" | sed '$d; s/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown option: $1 (try --help)" ;;
  esac
done

[ "$(id -u)" -eq 0 ] || die "run as root: curl ... | sudo bash"
command -v apt-get >/dev/null || die "this installer supports Debian and Ubuntu (apt). On anything else, use Docker."
command -v systemctl >/dev/null || die "systemd is required. On anything else, use Docker."

[ -n "$PROXY" ] || { [ -n "$DOMAIN" ] && PROXY=caddy || PROXY=none; }
case $PROXY in caddy | none) ;; *) die "--proxy must be caddy or none" ;; esac
[ "$PROXY" != caddy ] || [ -n "$DOMAIN" ] || die "--proxy caddy needs --domain"
if [ -z "$PORT" ]; then [ "$PROXY" = caddy ] && PORT=4321 || PORT=80; fi
case $PORT in '' | *[!0-9]*) die "--port must be a number" ;; esac
# Behind Caddy the toolkit stays on localhost; on its own it is the public server.
if [ "$PROXY" = caddy ]; then HOST=127.0.0.1; else HOST=0.0.0.0; fi
case $DOMAIN in *[!A-Za-z0-9.-]*) die "--domain looks wrong: $DOMAIN" ;; esac

export DEBIAN_FRONTEND=noninteractive

say "Installing prerequisites"
apt-get update -qq
apt-get install -y -qq curl ca-certificates git >/dev/null

# Node 22.12 or newer.
node_ok() { command -v node >/dev/null && node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)'; }
if ! node_ok; then
  say "Installing Node.js 22 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
node_ok || die "Node.js 22.12 or newer is required (found $(node -v 2>/dev/null || echo none))"

say "Creating the $SERVICE_USER user and $DIR"
id "$SERVICE_USER" >/dev/null 2>&1 ||
  useradd --system --home-dir "$DIR" --shell /usr/sbin/nologin "$SERVICE_USER"
mkdir -p "$DIR"
chown "$SERVICE_USER": "$DIR"

as_service() { runuser -u "$SERVICE_USER" -- "$@"; }

if [ -d "$DIR/.git" ]; then
  say "Updating to $REF"
  as_service git -C "$DIR" fetch --quiet --tags origin
  as_service git -C "$DIR" checkout --quiet "$REF"
  # A branch is fast-forwarded; a tag has nothing to pull.
  as_service git -C "$DIR" pull --quiet --ff-only 2>/dev/null || true
else
  say "Downloading NetOps Toolkit"
  [ -z "$(ls -A "$DIR")" ] || die "$DIR exists and is not empty (choose another with --dir)"
  as_service git clone --quiet --branch "$REF" "$REPO" "$DIR"
fi

if [ -n "$DOMAIN" ] && [ ! -e "$DIR/toolkit.config.local.ts" ]; then
  as_service tee "$DIR/toolkit.config.local.ts" >/dev/null <<CONF
import { defineLocalToolkit } from './src/lib/toolkit-schema';

export default defineLocalToolkit({
  site: 'https://$DOMAIN',
});
CONF
fi

say "Building (this takes a minute or two)"
cd "$DIR"
as_service npm ci --no-audit --no-fund --loglevel=error
as_service tools/publish

say "Setting up the $SERVICE service"
cat >"/etc/systemd/system/$SERVICE.service" <<UNIT
[Unit]
Description=NetOps Toolkit
After=network.target

[Service]
User=$SERVICE_USER
WorkingDirectory=$DIR
Environment=HOST=$HOST PORT=$PORT
ExecStart=$(command -v node) tools/serve.mjs dist
Restart=on-failure
AmbientCapabilities=CAP_NET_BIND_SERVICE
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null 2>&1
systemctl restart "$SERVICE"

if [ "$PROXY" = caddy ]; then
  say "Setting up Caddy for $DOMAIN"
  if ! command -v caddy >/dev/null; then
    apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https gpg >/dev/null
    curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key |
      gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
      >/etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
    apt-get install -y -qq caddy >/dev/null
  fi
  # Our site lives in its own file. An existing Caddyfile is kept, with one
  # import line added if it does not already pull in conf.d.
  mkdir -p /etc/caddy/conf.d
  cat >/etc/caddy/conf.d/$SERVICE.caddy <<CADDY
$DOMAIN {
	encode zstd gzip
	header Strict-Transport-Security "max-age=31536000"
	reverse_proxy 127.0.0.1:$PORT
}
CADDY
  if ! grep -qs 'import .*conf\.d' /etc/caddy/Caddyfile; then
    [ ! -s /etc/caddy/Caddyfile ] || cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak.$(date +%Y%m%d%H%M%S)"
    printf '\nimport /etc/caddy/conf.d/*.caddy\n' >>/etc/caddy/Caddyfile
  fi
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 ||
    die "Caddy rejected its config; see /etc/caddy/conf.d/$SERVICE.caddy"
  systemctl enable caddy >/dev/null 2>&1
  systemctl reload caddy 2>/dev/null || systemctl restart caddy
fi

say "Checking it is up"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  curl -fsS -o /dev/null "http://127.0.0.1:$PORT/" 2>/dev/null && ok=1 && break
  sleep 1
done
[ "${ok:-}" = 1 ] || die "the service did not answer; see: journalctl -u $SERVICE -n 50"

if [ "$PROXY" = caddy ]; then
  URL=https://$DOMAIN/
else
  URL=http://$(hostname -I 2>/dev/null | awk '{print $1}')$([ "$PORT" = 80 ] || printf ':%s' "$PORT")/
fi
printf '\nNetOps Toolkit is running: %s\n' "$URL"
[ "$PROXY" != caddy ] || printf 'Caddy fetches the certificate on the first visit; give it a few seconds.\n'
printf 'Customize it in %s/toolkit.config.local.ts, then run this installer again.\n' "$DIR"
