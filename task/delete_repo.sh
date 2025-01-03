repo=kern-crates/Starry-Old-
end=11
for i in $(seq 1 $end); do
  echo deleting $repo${i}
  # gh repo delete $repo$i --yes
done
