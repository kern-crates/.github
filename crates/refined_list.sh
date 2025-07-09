# Avoid inconsistent collation order
export LC_ALL=C

# Extract user/repo from .gitmodules
cat arceos-crates/.gitmodules starry-crates/.gitmodules axvisor-crates/.gitmodules driver-crates/.gitmodules |
  grep -oP 'url = https:\/\/github\.com\/\K([^\/]+\/[^\/]+?)(?=\.git|\/|$)' |
  sort | uniq >refined_list.txt
