import chalk from "chalk";
import * as query from "./query.ts";

export type UserRepo = {
  user: string,
  repo: string,
  isArchived?: boolean,
}

export type OwnedRepo = {
  owned: UserRepo,
  non_owned: null | UserRepo,
}

export function to_string(user_repo: UserRepo) {
  return `${user_repo.user}/${user_repo.repo}`;
}

export function gen_owned_repos(owner: string, q: query.RepositoryOwner): OwnedRepo[] {
  const repos = q.repositories.nodes.map(repo => {
    const owned = { user: owner, repo: repo.name, isArchived: repo.isArchived };
    const non_owned = repo.parent && {
      user: repo.parent.owner.login,
      repo: repo.parent.name,
      isArchived: repo.parent.isArchived,
    };
    return { owned, non_owned }
  });
  repos.sort((a, b) => to_string(a.owned).localeCompare(to_string(b.owned)));
  return repos;
}

// If parent repo is not archived, while the org repo is, warn against it.
export function check_archived(repos: OwnedRepo[]) {
  for (const repo of repos) {
    if (repo.owned.isArchived) {
      if (repo.non_owned && !repo.non_owned.isArchived) {
        console.log(chalk.magentaBright(`The parent ${to_string(repo.non_owned)} is not archived, but itself ${to_string(repo.owned)} is archived.`));
      } else {
        console.log(chalk.magenta(`${to_string(repo.owned)} is archived.`));
      }
    }
  }
}
