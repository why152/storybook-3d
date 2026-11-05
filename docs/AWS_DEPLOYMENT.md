# Storybook on the existing Tokyo EC2 server

Public letter edition: https://storybook.35-76-143-76.sslip.io/?story=letter

The server already routes this hostname through Caddy to
`/config/sites/storybook-3d/current/public`. On the host, `current` lives under
`/opt/sillytavern-local/caddy/config/sites/storybook-3d`. Use the existing
`sillytavern-admin` profile and SSM instance `i-0b300790a7ff20cd9` in
`ap-northeast-1`. Check the instance and current link before publishing.

Build with `npm run build` for the root deployment. Run lint, types, asset and
actor checks and both Playwright browser suites. Stage only `dist` under
`public/`, with `REVISION` and `SHA256SUMS` alongside it in the release archive.
Use a private encrypted temporary S3 transfer and a short-lived signed URL.
Keep the transfer URL and credentials out of source, reports and console output.

Run [update-existing-release.sh](../deploy/update-existing-release.sh) on the
instance with `ARTIFACT_URL`, `ARTIFACT_SHA`, `SOURCE_REV` and
`EXPECTED_PREVIOUS`. The script verifies the archive and expected current
version, switches only the Storybook symlink and compares the HTTPS response
with the new index. It restores the previous link if the post-switch check
fails. Caddy config and shared services stay untouched. Delete the temporary
transfer after the command completes.

Verify the actual public URL with the deployed browser suite or a focused
live smoke test plus the complete local suite on the same assets. Record the
release revision, previous revision, command result, browser evidence and
physical-device verification status. If a later live check fails, under the
same lock atomically restore `current` to the verified previous release.
