#!/bin/sh
# Checks formatting and validates every Terraform root without touching remote state.
set -eu

cd "$(dirname "$0")/.."

export TF_PLUGIN_CACHE_DIR="${TF_PLUGIN_CACHE_DIR:-$HOME/.terraform.d/plugin-cache}"
mkdir -p "$TF_PLUGIN_CACHE_DIR"

# A data dir apart from the real one, so a root already initialized with the S3 backend
# validates without AWS credentials.
export TF_DATA_DIR=.terraform/validate

terraform fmt -check -recursive

for root in bootstrap global envs/*/*; do
  [ -f "$root/main.tf" ] || continue
  echo "validate $root"
  terraform -chdir="$root" init -backend=false -input=false -no-color >/dev/null
  terraform -chdir="$root" validate -no-color
done
