#!/usr/bin/env bash
set -euo pipefail

: "${ARTIFACT_URL:?}" "${ARTIFACT_SHA:?}" "${SOURCE_REV:?}" "${CADDY_SHA:?}"
[[ "$SOURCE_REV" =~ ^[a-f0-9]{40}$ ]]
[[ "$ARTIFACT_SHA" =~ ^[a-f0-9]{64}$ ]]
[[ "$CADDY_SHA" =~ ^[a-f0-9]{64}$ ]]

site=/opt/sillytavern-local/caddy/config/sites/storybook-3d
config=/opt/sillytavern-local/caddy/Caddyfile
release="$site/releases/$SOURCE_REV"
work=$(mktemp -d /var/tmp/storybook-release.XXXXXX)
previous=''
config_changed=0
link_changed=0

cleanup() {
    result=$?
    if [ "$result" -ne 0 ]; then
        if [ "$link_changed" -eq 1 ]; then
            if [ -n "$previous" ]; then
                ln -s "$previous" "$site/current.rollback"
                mv -Tf "$site/current.rollback" "$site/current"
            else
                rm -f "$site/current"
            fi
        fi
        if [ "$config_changed" -eq 1 ]; then
            cat "$site/Caddyfile.before-$SOURCE_REV" > "$config"
            docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
        fi
    fi
    rm -rf "$work"
    exit "$result"
}
trap cleanup EXIT

printf '%s  %s\n' "$CADDY_SHA" "$config" | sha256sum -c -
[ ! -e "$release" ]
curl --fail --silent --show-error --max-time 90 "$ARTIFACT_URL" -o "$work/site.tar.gz"
printf '%s  %s\n' "$ARTIFACT_SHA" "$work/site.tar.gz" | sha256sum -c -
mkdir -p "$release"
tar -xzf "$work/site.tar.gz" --no-same-owner -C "$release"
(cd "$release" && sha256sum -c SHA256SUMS)
test -s "$release/public/index.html"
test "$(cat "$release/REVISION")" = "$SOURCE_REV"
chmod -R a+rX "$release"

if [ -L "$site/current" ]; then previous=$(readlink "$site/current"); fi
[ ! -e "$site/current.next" ]
ln -s "releases/$SOURCE_REV" "$site/current.next"
mv -Tf "$site/current.next" "$site/current"
link_changed=1

if ! grep -Fq 'storybook.35-76-143-76.sslip.io {' "$config"; then
    printf '%s  %s\n' "$CADDY_SHA" "$config" | sha256sum -c -
    cp -p "$config" "$site/Caddyfile.before-$SOURCE_REV"
    config_changed=1
    printf '\n' >> "$config"
    cat "$release/Caddyfile.site" >> "$config"
else
    grep -Fq 'root * /config/sites/storybook-3d/current/public' "$config"
fi

docker exec caddy test -s /config/sites/storybook-3d/current/public/index.html
docker exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
if [ "$config_changed" -eq 1 ]; then
    docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
fi
printf 'RELEASE=%s\n' "$SOURCE_REV"
docker inspect --format '{{.Name}} {{.State.StartedAt}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' caddy sillytavern
