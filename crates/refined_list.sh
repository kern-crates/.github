#!/bin/bash

set -eoux pipefail

# Avoid inconsistent collation order
export LC_ALL=C

# Extract user/repo from .gitmodules
cat arceos-crates/.gitmodules starry-crates/.gitmodules axvisor-crates/.gitmodules driver-crates/.gitmodules |
  awk -F'=' '/url = https:\/\/github\.com\// {
    sub(/.*github\.com\//, ""); # 去掉域名及之前的内容
    sub(/\.git$/, "");          # 去掉结尾的 .git（如果存在）
    print
  }' | sort | uniq >refined_list.txt

# Add extra repos.
echo "arceos-org/arceos" >>refined_list.txt
echo "asterinas/asterinas" >>refined_list.txt
