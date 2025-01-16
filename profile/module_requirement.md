# 模块发布要求

## 发布方式

如果您想让您的模块发布在 `kern-crates` 组织中，且可以被组织列表识别，需要进行如下检查：

- 如果您希望让您的仓库被直接镜像到 `kern-crates` 上，请向 [管理仓库](https://github.com/kern-crates/.github) 提起 PR，在 [fork_list] 文件中加入您的仓库信息，相关格式可以参考该文件内的其他仓库。
- 如果您希望从 `kern-crates` 删除镜像仓库，请向 [管理仓库](https://github.com/kern-crates/.github) 提起 PR，从 [fork_list] 删除您的仓库信息，管理员确认应该删除之后，将人工从 kern-crates 组织删除该仓库。

[fork_list]: https://github.com/kern-crates/.github/blob/main/fork_list.txt

**注意：目前默认抓取的是 Github 上的仓库，如果有 Gitee 等其他需求，请自行利用 CICD 等方式同步到 Github 上。**

## 仓库推荐配置

注意：README.json 不再需要，也不再推荐编写。

只需维护好每个库的 Cargo.toml 中的 `[package]` 信息，尤其是以下 [被 os-checker 读取](https://os-checker.github.io/book/WebUI/home.html) 的字段
* documentation：URL of the package documentation
* homepage：URL of the package homepage
* categories：Categories of the package
* keywords：Keywords for the package
* description： A description of the package
* authors：The authors of the package
* 字段含义或其他字段见 [Cargo Book](https://doc.rust-lang.org/cargo/reference/manifest.html)

