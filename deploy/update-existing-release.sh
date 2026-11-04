#!/usr/bin/env bash
set -euo pipefail

: "${ARTIFACT_URL:?}" "${ARTIFACT_SHA:?}" "${SOURCE_REV:?}" "${EXPECTED_PREVIOUS:?}"
[[ "$SOURCE_REV" =~ ^[0-9a-f]{40}$ && "$EXPECTED_PREVIOUS" =~ ^[0-9a-f]{40}$ ]]
[[ "$ARTIFACT_SHA" =~ ^[0-9a-f]{64}$ ]]

host=storybook.35-76-143-76.sslip.io
site=/opt/sillytavern-local/caddy/config/sites/storybook-3d
config=/opt/sillytavern-local/caddy/Caddyfile
release="$site/releases/$SOURCE_REV"
previous="releases/$EXPECTED_PREVIOUS"

exec 9>"$site/.storybook-release.lock"
flock -n 9
[[ "$(readlink "$site/current")" = "$previous" ]]
test -s "$site/$previous/public/index.html"
grep -Fq "$host {" "$config"
grep -Fq 'root * /config/sites/storybook-3d/current/public' "$config"

work=$(mktemp -d "$site/releases/.incoming.XXXXXX")
switched=0
cleanup() {
    result=$?
    if [[ "$result" != 0 && "$switched" == 1 ]]; then
        ln -s "$previous" "$work/rollback"
        mv -Tf "$work/rollback" "$site/current"
        printf 'Rolled back to %s\n' "$previous" >&2
    fi
    rm -rf -- "$work"
    exit "$result"
}
trap cleanup EXIT

curl --fail --silent --show-error --max-time 90 "$ARTIFACT_URL" -o "$work/site.tar.gz"
printf '%s  %s\n' "$ARTIFACT_SHA" "$work/site.tar.gz" | sha256sum --check --status
mkdir "$work/stage"
tar -xzf "$work/site.tar.gz" --no-same-owner -C "$work/stage"
test -s "$work/stage/public/index.html"
test "$(cat "$work/stage/REVISION")" = "$SOURCE_REV"
(cd "$work/stage" && sha256sum --check --status SHA256SUMS)

if [[ -d "$release" ]]; then
    cmp "$work/stage/SHA256SUMS" "$release/SHA256SUMS"
    (cd "$release" && sha256sum --check --status SHA256SUMS)
else
    chmod -R a+rX "$work/stage"
    mv -T "$work/stage" "$release"
fi

ln -s "releases/$SOURCE_REV" "$work/current"
mv -Tf "$work/current" "$site/current"
switched=1
# Check the HTTPS response from the existing Caddy process before committing.
curl --fail --silent --show-error --max-time 20 --noproxy '*' --resolve "$host:443:127.0.0.1" "https://$host/" \
    | cmp - "$release/public/index.html"
printf 'RELEASE=%s\nPREVIOUS=%s\n' "$SOURCE_REV" "$EXPECTED_PREVIOUS"
docker inspect --format '{{.Name}} {{.State.StartedAt}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' caddy sillytavern
