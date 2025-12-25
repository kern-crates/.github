import chalk from "chalk";
import { log } from "console";
import { execSync } from "child_process";
import { OwnedRepo, UserRepo, to_string } from "./types.ts";
import { read_maintain_list } from "./read_list.ts";

export type Output = {
  repo_list: string[],
  os_checker_config: { [key: string]: {} },
};

// Scan item from fork_list, if it's not found in non_onwed repos, do the fork.
export function fork(fork_list: UserRepo[], non_owned: Set<string>, org: string) {
  for (const outer of fork_list) {
    const repo_name = to_string(outer);

    if (!non_owned.has(repo_name)) {
      if (do_fork(org, outer, repo_name)) {
        log(chalk.whiteBright(chalk.bgRed(`${repo_name} is added to kern-crates org.`)));
      } else {
        throw_err(`${repo_name} is not forked.`);
      }
    }
  }
}

// Sync all non_onwed repos.
export function sync(repos: OwnedRepo[]) {
  // Repos that are forked to kern-crates as well as modified in kern-crates, 
  // especially with HEAD diverging from parent repos.
  const maintain = read_maintain_list();

  for (const repo of repos) {
    // skip owned repos or archived repo
    if (repo.non_owned === null || repo.non_owned.isArchived === true) continue;

    const parent = to_string(repo.non_owned);
    if (do_sync(repo.owned, parent)) {
      log(`${parent} synced.`);
    } else if (maintain.has(parent)) {
      log(`${parent} is not synced, but maintained by kern-crates.`);
    } else {
      throw_err(`${parent} is not synced.`);
    }
  }
}

/// Archive repos that are archived as parent.
// Returns a set of newly archived repos.
export function archive(repos: OwnedRepo[]): Set<string> {
  let archived = new Set<string>();
  for (const repo of repos) {
    if (repo.non_owned?.isArchived) {
      const repo_name = to_string(repo.owned);
      if (do_archive(repo.owned, to_string(repo.non_owned))) {
        archived.add(repo_name);
        log(chalk.magenta(`${repo_name} archived.`));
      } else {
        throw_err(`${repo_name} is not archived.`);
      }
    }
  }
  return archived;
}

/**
 * 返回值：
 *
 * repo_list 为一个字符串数组，它为 kern-crates 组织中的所有仓库名称，按照 `user/repo` 格式，但注意：
 * 1. 当仓库是 forked 产生的，那么仓库名称指向父仓库，而不是 kern-crates
 * 2. 该列表排除了来自 exclude_list.txt 中的仓库；由于上一条，对于 forked 仓库，exclude_list 应指定为它的父仓库
 * 3. 当 org 内的仓库状态是 archived，也不会放入 repo_list
 *
 * os_checker_config 是一个 object，为 os-checker 所需的 JSON 配置文件。
 */
export function gen_output(owned_repos: OwnedRepo[], exclude_list: UserRepo[]): Output {
  let repos = [];
  // generate source repo list
  for (const repo of owned_repos) {
    if (repo.owned.isArchived) continue;

    if (repo.non_owned) {
      repos.push(to_string(repo.non_owned));
    } else {
      repos.push(to_string(repo.owned));
    }
  }

  let set = new Set(repos);

  // remove repos from exclude_list
  for (const exclude of exclude_list)
    set.delete(to_string(exclude));

  const repo_list = [...set].sort();

  // generate os-checker config 
  let config: { [key: string]: {}; } = {};
  for (const repo of repo_list) config[repo] = {};

  return { repo_list, os_checker_config: config };
}

function do_archive(repo: UserRepo, target: string) {
  // Archive the repo.
  // src: https://cli.github.com/manual/gh_repo_archive

  // It won't err to call this multiple times.
  // To unarchive, click setting tab on the webpage to make it.
  const cmd = `gh repo archive -y ${repo.user}/${repo.repo}`;
  return do_(cmd, target);
}

function do_sync(repo: UserRepo, target: string) {
  // Sync remote fork from its parent
  // src: https://cli.github.com/manual/gh_repo_sync
  const cmd = `gh repo sync ${repo.user}/${repo.repo} --force`;
  return do_(cmd, target);
}

function do_fork(org: string, outer: UserRepo, target: string) {
  // gh repo fork non_owned --org kern-crates --default-branch-only
  // src: https://cli.github.com/manual/gh_repo_fork

  // This produces duplicated repo.
  // $ gh repo fork os-checker/test-rename-old --org kern-crates --default-branch-only
  // ✓ Created fork kern-crates/test-rename-new-2
  // ? Would you like to clone the fork? (y/N)
  //
  // This errs.
  // $ gh repo fork os-checker/test-rename-old --fork-name test-rename-old --org kern-crates --default-branch-only
  // failed to fork: HTTP 403: Name already exists on this account (https://api.github.com/repositories/917460658/forks)

  const cmd = `gh repo fork ${outer.user}/${outer.repo} --fork-name ${outer.repo} --org ${org} --default-branch-only`;
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

declare global {
  var has_error: number;
}

function throw_err(err: string) {
  global.has_error += 1;
  console.error(chalk.whiteBright(chalk.bgRed(err)));
}
