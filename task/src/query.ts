/**
 * `GH_TOKEN` used for API query and gh CLI.
*/
export function gh_token() {
  const token = process.env.GH_TOKEN;
  if (!token) {
    throw new Error("请设置和提供 GH_TOKEN，比如 `GH_TOKEN: ${{ secrets.GH_TOKEN }}`");
  }
  return token;
}

export const repos = `query ($login: String!, $num: Int = 100, $cursor: String) {
  repositoryOwner(login: $login) {
    repositories(first: $num, after: $cursor) {
      totalCount
      nodes {
        name
        parent {
          owner { login }
          name
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

export type Repos = {
  repositoryOwner: RepositoryOwner
};

export type RepositoryOwner = {
  repositories: {
    totalCount: number,
    nodes: {
      name: string,
      parent: null | { owner: { login: string }, name: string }
    }[]
  }
}

