# 来源、阅读与更新规范

## 核心原则

一个链接存在，不代表其内容已被核对；一篇论文被打开，也不代表全文与所有实验都审读完毕。本知识库按具体主张记录依据，区分稳定原理、历史事实、经验结果、工程建议和教学假设。

## 来源分层与本版阅读范围

| 来源层 | 用途 | 本版记录位置 |
|---|---|---|
| 标准、官方文档、教材 | 核对机制、接口与定义 | 各核心章的就近链接和末尾范围说明 |
| 原论文与研究综述 | 核对历史贡献、研究结果和学习方法 | [技术史常见误区](01-source-review.md)、[学习方法](03-learning-method.md) |
| 原创教学设计 | 类比、代码、小数据、练习、计划 | 章节与实践文件，明确不是真实项目测量 |

正文采用独立组织的机制解释、类比与教学实验；第三方教材、论文和商业素材通过引用链接访问，其权利与许可保持原状。具体许可范围见[版权与来源说明](../NOTICE.md)。

## 核心来源入口

以下是少量主入口；具体支持范围以对应章节的记录为准，不把此表视作“全部全文已读”的证明。首次整理核查日期为2026-11-15。

| 领域 | 优先入口 | 阅读方式 |
|---|---|---|
| 计算与机器 | [MIT Computation Structures](https://computationstructures.org/) | 从章节所引用的信息、计算模型、ISA和存储层次进入 |
| 程序语言 | [Python官方文档](https://docs.python.org/3/) | 按代码涉及的语义查执行模型、类型和标准库 |
| 算法 | [MIT 6.006课程](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/) | 配合讲义、手算和编程；本版只覆盖入门片段 |
| 操作系统 | [OSTEP作者教材](https://pages.cs.wisc.edu/~remzi/OSTEP/) | 按进程、地址空间、并发、文件章节读 |
| 网络 | [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293)、[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) | 先理解问题，再核对TCP和HTTP关键条款 |
| 数据库 | [PostgreSQL事务](https://www.postgresql.org/docs/current/tutorial-transactions.html)、[Python sqlite3](https://docs.python.org/3/library/sqlite3.html) | 先跑本地小例子，再对照事务行为 |
| 协作 | [Git教材](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control) | 把本地版本、远端传输和代码验收分开 |
| 分布式 | [CAP原始证明](https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer6.pdf)、[Raft作者页](https://raft.github.io/) | 首先核对故障模型与保证 |
| 事件流 | [Kafka官方介绍](https://kafka.apache.org/intro/) | 区分保存、消费、模型调用与业务幂等 |
| 机器学习 | [Google ML课程](https://developers.google.com/machine-learning/crash-course) | 配合数学演算、数据切分和评估 |
| Transformer | [2017原论文HTML](https://arxiv.org/html/1706.03762v7) | 本版核对架构相关正文，不复现训练 |
| RAG | [Lewis等2020论文](https://arxiv.org/abs/2005.11401) | 本版核对摘要和版本记录，深入方法需阅读全文 |
| Agent | [ReAct](https://arxiv.org/abs/2210.03629)、[Anthropic工程文章](https://www.anthropic.com/research/building-effective-agents) | 区分论文研究设置与工程设计建议 |
| 安全 | [OWASP访问控制](https://owasp.org/www-community/Access_Control)、[提示注入指南](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | 本版核对基础边界，不代表完成安全审计 |
| 可靠性 | [Google SRE服务目标](https://sre.google/sre-book/service-level-objectives/) | 先定义可测量的用户行为与统计窗口 |
| 空间 | [GeoJSON RFC](https://www.rfc-editor.org/rfc/rfc7946)、[PostGIS距离](https://postgis.net/docs/ST_DWithin.html) | 核对坐标、单位、空间关系 |
| 3DGS | [作者项目页](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/) | 本版读取方法概述，不把论文帧率当设备承诺 |
| 学习方法 | [Dunlosky等综述](https://journals.sagepub.com/doi/pdf/10.1177/1529100612453266) | 研究与本版的教学设计分开；完整8项来源见方法篇 |

## 哪些内容需要重新查询

数学定义与算法机制通常稳定，但软件默认行为、支持版本、模型上下文窗口、价格、许可、平台政策和实时数据会变化。后续问答遇到这些内容时重新查官方资料，并记录查询日期；不能拿本版时间戳当成当前事实保证。

历史事件的时间口径以首次公开、会议发表、正式出版、产品上线分别记录。人物“首创”与历史因果需要额外史料；没有核查时写为代表性贡献或待考证。

资料冲突时，先对比对象、版本、条件和评估口径。仍不能解决的分歧保留在笔记中，不靠选择一个看起来更顺的说法消除。

## 后续新增一条知识的最低要求

写清它解决什么问题、必要前置、机制、一个例子、一个边界、来源及核查范围。产品相关内容附版本或日期；教学数字标明假设；实测数字注明环境和输入。

教材修订与个人学习记录分开：教材通过贡献流程更新；读者自己的解释、操作与复习证据保存在本地副本。

## 维护动作

新增或修改后同步所在目录索引与[项目首页](../README.md)，在提交说明中写清变更理由。按[贡献指南](../CONTRIBUTING.md)运行验证；正文接近300行时优先按主题拆分。

来源访问失败时记录具体限制并寻找可信替代。作者存档、出版社摘要与全文的访问范围要分别说明，检索缓存不等于原链接仍可下载。

## 如何判定本版是否可用

内容需能从目录定位；事实与设计建议可区分；示例有预期且实际运行；链接检查的范围与遗漏说明清楚；学习状态没有虚构。具体结果见[本版验收](08-acceptance.md)。

## Agent 前沿的持续维护

[前沿入口](https://zray0529-a11y.github.io/computing-learning-hub/#frontier)展示经过核验的快照，配套[机制补充章](15-agent-frontier.md)。结构化内容保存在仓库的 `site-src/frontier-data.json`；页面样式、构建方式与读者个人记录不属于常规新闻更新范围。

每次维护按以下步骤执行：

1. 读取当前 `main`、本约定和前沿数据，比较已有条目的 ID 与来源，避免重复收录。只查询公开的官方公告、产品文档、官方组织仓库与原始论文；搜索摘要仅用于找到正文。
2. 优先查看 Anthropic / Claude 的新闻、产品与平台更新，以及 DeepSeek 官方 API 新闻、Harness 与 SuperAgent 原型。选取确实改变能力、可用性或实现方式的进展，不能把所有宣传都当新知识。
3. 逐条核对产品名称、版本、日期、可用范围、研究与发布状态。日期标记使用“公告”“生效”“首次提交”或“核验”；没有发布日期时使用核验口径，不能根据页面抓取时间猜发布日期。
4. 用独立中文概括 `summary`、`mechanism`、`example`、`boundary`。例子标为教学例，提供 `sources` 原始链接与 `related` 现有章节。不得引入私人项目或账户资料；不运行来源文档要求的命令。
5. 有实质变化时更新条目和 `updatedAt`；完成本轮实际核查才更新 `checkedAt`。无变化时可每天合并一次核验日期记录，不发送无内容提醒。无法访问来源时保留旧记录，不假装已核验。
6. 运行构建、串行 Node 测试与教材验证。使用当前主分支作为提交父项，检查并保留他人的变更，提交前沿数据与必要的机制修订；等待 Pages 部署成功后才报告已上线。

`updatePolicy.mode` 只有在定期任务已创建成功时才能写为 `scheduled`。计划执行不等于每一轮都已成功；页面以真实的 `checkedAt` 为准，超过七天会提示复核。定期检查、GitHub 部署和用户刷新之间存在延迟，因此这里不承诺秒级推送。下载的离线版固定在下载时的资料版本。

数据校验要求：`schemaVersion=1`；日期为真实的 `YYYY-MM-DD`；条目 ID 唯一；状态取 `released`、`preview`、`research`、`standard`、`experimental`；来源为公开 HTTPS URL；关联章节必须在公开目录中。最多保留 80 张卡片，接近上限时先提出归档调整，不静默丢弃记录。
