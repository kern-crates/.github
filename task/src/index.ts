import { Octokit } from "octokit";
import { log } from "node:console";
import { writeFileSync } from "node:fs";
import * as query from "./query.ts";
import { archive, fork, gen_output, sync } from "./gh.ts";
import { check_archived, gen_owned_repos, to_string } from "./types.ts";
import { read_refined_list } from "./read_list.ts";

async function main() {

  const refined_list = read_refined_list();
  log("refined_list", refined_list);

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
  fork(refined_list, non_owned, org);

  const archived = archive(owned_repos);
  // update archived state for org
  owned_repos.forEach((repo, idx) => {
    if (archived.has(to_string(repo.owned)))
      owned_repos[idx].owned.isArchived = true;
  });

  const output = gen_output(owned_repos, []);
  log("\nrepo_list.length =", output.repo_list.length);

  writeFileSync("os-checker_config-full.json", JSON.stringify(output.os_checker_config, null, 2));

  let out: { [key: string]: {} } = {};
  for (const repo of refined_list) {
    // os-checker_config filters out archived repos
    const name = to_string(repo);
    if (output.os_checker_config[name]) out[name] = [];
  }
  writeFileSync("os-checker_config.json", JSON.stringify(out, null, 2));
}

main().then(() => log("\nMain thread done."));
