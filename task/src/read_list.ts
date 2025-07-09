import { to_string, type UserRepo } from "./types.ts";
import { readFileSync } from "node:fs";

/** 
 * Returns path to `fork_list.txt`, or `fork_list_test.txt` if `TEST` is set.
 * */
function fork_list_txt() {
  return (process.env.TEST === "true") ? "test/fork_list_test.txt" : "../fork_list.txt";
}

function cmp(a: UserRepo, b: UserRepo): number {
  if (a.user < b.user) return -1;
  if (a.user > b.user) return 1;
  // a.user == b.user
  if (a.repo < b.repo) return -1;
  if (a.repo > b.repo) return 1;
  // a is the same as b
  return 0;
}

function read_list(path: string): UserRepo[] {
  const lines = readFileSync(path, { encoding: "utf-8" }).trim().split("\n");
  return lines.map(line => {
    const [user, repo] = line.split("/").map(word => word.trim());
    if (!user) { throw new Error(`No user in \`${line}\`.`); }
    if (!repo) { throw new Error(`No repo in \`${line}\`.`); }
    return { user, repo };
  }).sort(cmp);
}

export function read_refined_list(): UserRepo[] {
  return read_list("../crates/refined_list.txt");
}

export function read_fork_list(): UserRepo[] {
  return read_list(fork_list_txt());
}

export function read_exclude_list(): UserRepo[] {
  return read_list("../exclude_list.txt");
}

export function read_maintain_list(): Set<string> {
  return new Set(read_list("../maintain_list.txt").map(to_string));
}
