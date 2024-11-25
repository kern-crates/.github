import chalk from 'chalk';
import { log } from "node:console";
import * as query from "./query.ts";
import { execSync } from "node:child_process";

export type UserRepo = {
  user: string,
  repo: string,
}

function to_string(user_repo: UserRepo) {
  return `${user_repo.user}/${user_repo.repo}`;
}

export type OwnedRepo = {
  owned: UserRepo,
  non_owned: null | UserRepo,
}

export function gen_owned_repos(owner: string, repos: query.RepositoryOwner): OwnedRepo[] {
  return repos.repositories.nodes.map(repo => {
    const owned = { user: owner, repo: repo.name };
    const non_owned = repo.parent && { user: repo.parent.owner.login, repo: repo.parent.name };
    return { owned, non_owned }
  });
}

/**
 * any non_owned matches against repo_in_sync_list => need syncing
 * all non_owned don't match against repo_in_sync_list: UserRepo => need forking
 *
 * 返回值为一个字符串数组，它为 kern-crates 组织中的所有仓库名称，按照 `user/repo` 格式，但注意：
 * 1. 当仓库是 forked 产生的，那么仓库名称指向父仓库，而不是 kern-crates
 * 2. 该列表排除了来自 exclude_list.txt 中的仓库；由于上一条，对于 forked 仓库，exclude_list 应指定为它的父仓库
 */
export function sync_or_fork(sync_list: UserRepo[], exclude_list: UserRepo[], owned_repos: OwnedRepo[], owner: string) {
  const non_onwed = owned_repos.map(val => val.non_owned);
  let repos: string[] = [];

  for (const outer of sync_list) {
    const repo_name = to_string(outer);
    const pos = non_onwed.findIndex(val => val?.user === outer.user && val.repo === outer.repo);

    if (pos === -1) {
      // need forking
      if (do_fork(owner, outer, repo_name)) {
        repos.push(repo_name);
      } else {
        throw new Error(chalk.bgRed(`${repo_name} is not forked.`));
      }
    } else {
      // need syncing
      if (do_sync(owned_repos[pos].owned, repo_name)) {
        repos.push(repo_name);
      } else {
        throw new Error(chalk.bgRed(`${repo_name} is not synced.`));
      }
    }
  }

  // 如何处理不在 sync_list 中的 forked 仓库？
  // 当前不处理这些未在 sync_list 的 forked 仓库，以防止父仓库清空或者删除等操作造成备份仓库失效。
  // sync_list 存在的意义就是同步仓库，当第一次同步该仓库时，fork 它到 kern-crates。
  // 如果仓库不再处于 sync_list，那么有理由认为处于某种原因不 sync 它 —— 因此不处理是合理的。
  // 如果意外把一个仓库从 sync_list 中移除了，把它添加回 sync_list 即可。

  // generate source repo list
  for (const repo of owned_repos) {
    if (repo.non_owned) {
      repos.push(to_string(repo.non_owned));
    } else {
      repos.push(to_string(repo.owned));
    }
  }

  let set = new Set(repos);

  // remove repos from exclude_list
  for (const exclude of exclude_list) {
    set.delete(to_string(exclude));
  }

  return [...set].sort();
}

function do_sync(owned: UserRepo, target: string) {
  // Sync remote fork from its parent
  // src: https://cli.github.com/manual/gh_repo_sync
  const cmd = `gh repo sync ${owned.user}/${owned.repo}`;
  return do_(cmd, target);
}

function do_fork(owner: string, outer: UserRepo, target: string) {
  // gh repo fork non_owned --org kern-crates --default-branch-only
  // src: https://cli.github.com/manual/gh_repo_fork
  const cmd = `gh repo fork ${outer.user}/${outer.repo} --org ${owner} --default-branch-only`;
  return do_(cmd, target);
}

// gh CLI writes data to TTY but not to pipe, so even if we get output from terminal,
// nothing is captured in the callback.
//
// But we can use inherit stdio to capture the gh output.
//
// We use execSync on purpose, in case that APIs are sending too fast to hit the Github limit.
function do_(cmd: string, target: string) {
  let success = true;
  console.time(cmd);

  if (process.env.EXECUTE === "true") {
    log(chalk.yellow(`\n[real exec] [${target}] ${cmd}`));

    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      success = false;
      let err: any = error;
      handleExecOutput(cmd, err, err.stdout, err.stderr);
    }

  } else {
    log(chalk.gray(`\n[fake exec] [${target}] ${cmd}`));
  }

  console.timeEnd(cmd);
  return success;
}

function handleExecOutput(cmd: string, error: any, stdout: string, stderr: string) {
  if (stdout) { log(`${cmd} [stdout]: ${stdout}`); }
  if (error) {
    console.error(chalk.bgRed(`${cmd} 执行出错:\n`) + chalk.red(`${stderr}`));
  } else if (stderr) {
    console.error(`${cmd} [stderr]: ${stderr}`);
  }
}
