import { Octokit } from "octokit";
import { log } from "node:console";
import { writeFileSync } from "node:fs";
import * as query from "./query.ts";
import { gen_output, sync_or_fork } from "./gh.ts";
import { gen_owned_repos } from "./types.ts";
import { read_exclude_list, read_sync_list } from "./read_list.ts";

async function main() {

  const exclude_list = read_exclude_list();
  log("exclude_list", exclude_list);

  const sync_list = read_sync_list();
  log("sync_list", sync_list);

  const octokit = new Octokit({ auth: query.gh_token() });

  const {
    viewer: { login },
  } = await octokit.graphql<{
    viewer: { login: string }
  }>(`{ viewer { login } }`);
  log("login:", login);

  const owner = "kern-crates";
  const { repositoryOwner } = await octokit.graphql.paginate<query.Repos>(
    query.repos, { login: owner }
  );

  const owned_repos = gen_owned_repos(owner, repositoryOwner);

  const repos = sync_or_fork(sync_list, owned_repos, owner);

  const output = gen_output(repos, owned_repos, exclude_list);
  log("\nrepo_list.length =", output.repo_list.length);

  writeFileSync("repo_list.json", JSON.stringify(output.repo_list, null, 2));
  writeFileSync("os-checker_config.json", JSON.stringify(output.os_checker_config, null, 2));
  writeFileSync("repo_list_raw.json", JSON.stringify({ sync_list, exclude_list, owner, owned_repos }, null, 2));

}

main().then(() => log("\nMain thread done."));
