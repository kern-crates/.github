import { Octokit } from "octokit";
import { log } from "node:console";
import { writeFileSync } from "node:fs";
import * as query from "./query.ts";
import { archive, fork, gen_output, sync } from "./gh.ts";
import { check_archived, gen_owned_repos, to_string } from "./types.ts";
import { read_exclude_list, read_fork_list as read_fork_list } from "./read_list.ts";

async function main() {

  const exclude_list = read_exclude_list();
  log("exclude_list", exclude_list);

  const fork_list = read_fork_list();
  log("fork_list", fork_list);

  const octokit = new Octokit({ auth: query.gh_token() });

  const {
    viewer: { login },
  } = await octokit.graphql<{
    viewer: { login: string }
  }>(`{ viewer { login } }`);
  log("login:", login);

  const org = "kern-crates";
  const { repositoryOwner } = await octokit.graphql.paginate<query.Repos>(
    query.repos, { login: org }
  );

  const owned_repos = gen_owned_repos(org, repositoryOwner);
  check_archived(owned_repos);

  sync(owned_repos);

  const non_owned = new Set(
    owned_repos.map(val => val.non_owned).filter(x => x !== null).map(to_string)
  );
  fork(fork_list, non_owned, org);

  const archived = archive(owned_repos);
  // update archived state for org
  owned_repos.forEach((repo, idx) => {
    if (archived.has(to_string(repo.owned)))
      owned_repos[idx].owned.isArchived = true;
  });

  const output = gen_output(owned_repos, exclude_list);
  log("\nrepo_list.length =", output.repo_list.length);

  // writeFileSync("repo_list.json", JSON.stringify(output.repo_list, null, 2));
  writeFileSync("os-checker_config.json", JSON.stringify(output.os_checker_config, null, 2));
  writeFileSync("repo_list_raw.json", JSON.stringify({ fork_list, exclude_list, owner: org, owned_repos }, null, 2));

}

main().then(() => log("\nMain thread done."));
