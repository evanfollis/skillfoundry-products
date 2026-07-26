#!/bin/sh
set -eu

node_binary=/opt/workspace/runtime/toolchains/node-v24.18.0-linux-x64/bin/node
expected_version=v24.18.0
expected_sha256=41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c

if [ ! -x "$node_binary" ]; then
  echo "Preflight Node runtime is missing or not executable: $node_binary" >&2
  exit 1
fi

actual_version=$("$node_binary" --version)
if [ "$actual_version" != "$expected_version" ]; then
  echo "Preflight Node runtime version mismatch: expected $expected_version, got $actual_version" >&2
  exit 1
fi

actual_sha256=$(/usr/bin/sha256sum "$node_binary")
actual_sha256=${actual_sha256%% *}
if [ "$actual_sha256" != "$expected_sha256" ]; then
  echo "Preflight Node runtime checksum mismatch" >&2
  exit 1
fi
