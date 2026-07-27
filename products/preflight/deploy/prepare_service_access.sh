#!/bin/sh
# Prepare the two dedicated Preflight identities' exact read/write surfaces.
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "prepare_service_access: root is required" >&2
  exit 1
fi

for identity in preflight preflight-watcher; do
  if ! getent passwd "$identity" >/dev/null; then
    echo "prepare_service_access: missing system identity: $identity" >&2
    exit 1
  fi
done

toolchains_dir=/opt/workspace/runtime/toolchains
dist_dir=/opt/workspace/projects/skillfoundry/skillfoundry-products/products/preflight/dist
alerts_dir=/opt/workspace/runtime/.alerts
alert_log="$alerts_dir/preflight-real-user.log"

test -x "$toolchains_dir/node-v24.18.0-linux-x64/bin/node"
test -f "$dist_dir/serve.js"
install -d -m 0755 "$alerts_dir"
touch "$alert_log"

# The gateway may traverse the non-listable toolchain vault to the exact pinned
# Node directory and may read only the built application tree.
setfacl -m u:preflight:--x "$toolchains_dir"
find "$dist_dir" -type d -exec setfacl -m u:preflight:r-x,d:u:preflight:r-x {} +
find "$dist_dir" -type f -exec setfacl -m u:preflight:r-- {} +

# The watcher owns exactly its append-only operational output file.
chown preflight-watcher:preflight-watcher "$alert_log"
chmod 0600 "$alert_log"
