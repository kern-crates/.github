# Kernel crates that can be used in multiple Rust OSes

[模块发布方式与需求](/profile/module_requirement.md)

[模块列表](https://kern-crates.github.io/.github/)

[添加仓库到 kern-crates 组织](/profile/fork_list.md)

<!--

**Here are some ideas to get you started:**

🙋‍♀️ A short introduction - what is your organization all about?
🌈 Contribution guidelines - how can the community get involved?
👩‍💻 Useful resources - where can the community find your docs? Is there anything else the community should know?
🍿 Fun facts - what does your team eat for breakfast?
🧙 Remember, you can do mighty things with the power of [Markdown](https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
-->

## 规范模块要求

对于一个模块来说，我们希望它拥有：

- 规范的文档
- 良好的代码风格
- 尽量完备的测试
- 清晰易懂的引导说明

对上述内容，我们的要求如下：

### 文档规范

我们引入的模块绝大部分由 Rust 编写，此时通过`rustdoc`进行文档的检查和生成。

- 文档的规范详见：[如何写文档 - rustdoc 手册 中文版](https://rustwiki.org/zh-CN/rustdoc/how-to-write-documentation.html)

- 文档检查和生成指令详见：[doc.yml](https://github.com/kern-crates/.github/templates/.github/workflows/doc.yml)

  > 注意：为了检查是否存在缺失文档与链接，我们引入了`RUSTDOCFLAGS: -D rustdoc::broken_intra_doc_links -D missing-docs`

- 关于 README.md 的撰写可见 [README.md](https://github.com/Starry-OS/kernel-elf-parser/blob/main/README.md)



### 良好的代码风格

关于代码风格的检查器有较多类型，对于 Rust 模块来说，我们默认使用`rustfmt`和`clippy`进行规范性和代码风格测试。测试指令详见：[ci.yml](https://github.com/kern-crates/.github/blob/main/templates/.github/workflows/ci.yml#L6)。



### 尽量完备的测试

完备的测试指的是尽可能提高测试的覆盖率，涉及更多代码、更多边界情况。我们讨论如下情况的测试：

- 用户态测试：即单元测试，覆盖基本的测试情况
- 内核态测试：对于一些需要运行在内核态下的 crate，如 virtio、page_table 等，需要额外编写相关的内核态测例，并且起一个简单的 qemu 进行测试，可以参见：[virtio-driver](https://github.com/rcore-os/virtio-drivers/blob/master/.github/workflows/main.yml)
- 内核集成测试：内核集成测试仅当内核本体更新的时候会在自身仓库触发测试，从而保证集成测试不会冗余，因此不在模块仓库的 CI 中涉及

因此为了保证基本的测试覆盖，我们需要对于每一个模块编写各自的单元测试或集成测试，测试最基本的内容。

- 测试规范详见：[测试 - 通过例子学 Rust 中文版](https://rustwiki.org/zh-CN/rust-by-example/testing.html)
- 测试指令详见：[ci.yml](https://github.com/kern-crates/.github/blob/main/templates/.github/workflows/ci.yml#L26https://github.com/kern-crates/.github/blob/main/templates/.github/workflows/ci.yml#L26)


### 清晰易懂的引导说明

由于 kern-crates、os-checker 等平台会集中收集各个 crate 并且组织成为一张列表，因此我们需要对仓库进行简单的说明。

简要的说明包括对仓库的说明(about)、文档链接等信息，以及清晰的 README。


### demo

以下为做的较为完善的模块的 demo，供参考：

- [kspin]([arceos-org/kspin](https://github.com/arceos-org/kspin/))：包含了完整的文档、单元测试、CI 流程，但是暂未携带内核态测试
- [elf_parser_rs](https://github.com/Azure-stars/elf_parser_rs)：简单的 ELF 分析工具，不需要加入内核态测试
- [virtio-driver](https://github.com/rcore-os/virtio-drivers)：携带内核态测试

### Templates

以下为 crates 仓库建设时可能用到的相关模板，供参考：
- [CICD](../templates/.github/workflows)
- [gitignore](../templates/.gitignore)
