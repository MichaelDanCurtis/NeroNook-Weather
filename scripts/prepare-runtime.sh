#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
version=v22.23.0
archive="node-${version}-darwin-arm64.tar.gz"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
curl --fail --silent --show-error --location "https://nodejs.org/dist/${version}/SHASUMS256.txt" -o "$work/SHASUMS256.txt"
curl --fail --silent --show-error --location "https://nodejs.org/dist/${version}/${archive}" -o "$work/$archive"
(cd "$work"; awk -v file="$archive" '$2 == file' SHASUMS256.txt > selected.sha; test -s selected.sha; shasum -a 256 -c selected.sha; tar -xzf "$archive")
mkdir -p Runtime
cp "$work/node-${version}-darwin-arm64/bin/node" Runtime/node
cp "$work/node-${version}-darwin-arm64/LICENSE" Runtime/NODE-LICENSE
