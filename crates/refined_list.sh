#!/bin/bash

set -eoux pipefail

# Avoid inconsistent collation order
export LC_ALL=C

# Extract user/repo from .gitmodules
cat arceos-crates/.gitmodules starry-crates/.gitmodules axvisor-crates/.gitmodules driver-crates/.gitmodules |
  awk -F'=' '/url = https:\/\/github\.com\// {
    match($2, /https:\/\/github\.com\/([^\/]+\/[^\/]+?)(?=\.git|\/|$)/, arr);
    if (arr[1] != "arceos-hypervisor/axcpu") {
        print arr[1]
    }
  }' | sort | uniq >refined_list.txt

# Add extra repos.
echo "arceos-org/arceos" >>refined_list.txt
echo "asterinas/asterinas" >>refined_list.txt
