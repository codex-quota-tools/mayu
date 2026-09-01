#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
version="$(node -p "require('${repo_root}/package.json').version")"
ref="${1:-HEAD}"
output_dir="${2:-${repo_root}/release}"
archive_name="mayu-source-v${version}"
archive_path="${output_dir}/${archive_name}.zip"
checksum_path="${archive_path}.sha256"

mkdir -p "${output_dir}"
git -C "${repo_root}" archive \
  --format=zip \
  -9 \
  --prefix="${archive_name}/" \
  --output="${archive_path}" \
  "${ref}"

unzip -tq "${archive_path}"
(
  cd "${output_dir}"
  shasum -a 256 "$(basename "${archive_path}")" > "$(basename "${checksum_path}")"
)

printf '%s\n' "${archive_path}" "${checksum_path}"
