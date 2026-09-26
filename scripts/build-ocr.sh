#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
source="$root/assets/ocr.swift"
output="$root/assets/ocr-tool"

if [[ ! -f "$source" ]]; then
  echo "缺少 $source" >&2
  exit 1
fi

if [[ -f "$output" && "$output" -nt "$source" ]]; then
  exit 0
fi

if ! command -v swiftc >/dev/null 2>&1; then
  echo "没有找到 swiftc。安装 Xcode 命令行工具后再构建截图识别工具：xcode-select --install" >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
built=()

compile() {
  local target="$1"
  local dest="$2"
  if swiftc -O -target "$target" "$source" -o "$dest"; then
    built+=("$dest")
  fi
}

compile "arm64-apple-macosx13.0" "$tmp/arm64"
compile "x86_64-apple-macosx13.0" "$tmp/x64"

if [[ ${#built[@]} -eq 0 ]]; then
  echo "文字识别工具编译失败。" >&2
  exit 1
fi

mkdir -p "$(dirname "$output")"
if [[ ${#built[@]} -eq 1 ]]; then
  cp "${built[0]}" "$output"
else
  lipo -create -output "$output" "${built[@]}"
fi

chmod +x "$output"
codesign --force --sign - "$output" >/dev/null
echo "$output"
