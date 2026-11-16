# 计算机与智能系统开放学习库

**从0与1到Agent：14章计算机基础、可运行实验、高效学习方法，以及建筑与空间专业的4个分类专题。**

**[打开图解学习网页](https://zray0529-a11y.github.io/computing-learning-hub/)** · 18 张机制图、分步高亮、即时自测，以及二进制、事务和检索证据的 3 个互动演示。每章可切换到完整教材；保留中文全文搜索、收藏与已读标记。网页右上角可下载包含图解和交互的完整离线版，阅读记录仅保存在自己的浏览器。详见[网页与离线使用说明](docs/10-website.md)。

**[探索 Three.js 知识地图](https://zray0529-a11y.github.io/computing-learning-hub/#atlas)** · 39 个概念与 68 条有解释的关系，三个虚构协作场景，以及附原始来源的 16 个历史坐标。可旋转、点选、筛选，再返回对应章节；支持列表阅读，三维运行时随离线版打包。

**[查看 Agent 前沿更新](https://zray0529-a11y.github.io/computing-learning-hub/#frontier)** · Anthropic、DeepSeek 等官方进展，逐条查看新增能力、教学例子、可用状态与原始来源。配套[前沿机制补充章](docs/15-agent-frontier.md)，区分正式能力、研究原型与实验演示。通过 [AIHOT](https://aihot.news/) 发现消息线索，再核对官方原文并整理为知识卡。手机图解支持逐卡学习和底部前后翻页；完整教材继续保留。

这份中文学习资料面向计算机初学者，也适合希望理解数字工具与智能系统的建筑、规划和空间专业读者。目标是能解释机制、读懂程序、检查结果，并把知识迁移到小项目中。

## 从哪里开始

| 需要 | 入口 |
|---|---|
| 先看全貌 | [知识总览](docs/00-overview.md) · [历史与概念地图](docs/02-history-and-map.md) |
| 系统补基础 | [14章课程目录](docs/chapters/index.md) · [12周建议计划](docs/04-learning-plan.md) |
| 从建筑专业切入 | [BIM、参数化、GIS、数字孪生](architecture/README.md) |
| 学得更扎实 | [教回、检索、间隔与练习方法](docs/03-learning-method.md) |
| 直接动手 | [六个离线实验](docs/practice/01-labs.md) · [贯穿项目](docs/practice/02-capstone.md) |
| 查一个概念 | [术语表](docs/07-glossary.md) · [问题路由](docs/05-question-routing.md) |
| 记录自己的进展 | [使用说明](docs/06-progress-and-review.md) · [空白模板](templates/learning-progress.md) |

## 14章计算机基础

| 基础层 | 章节 |
|---|---|
| 表示与计算 | [01 计算、逻辑与信息](docs/chapters/01-computation.md)、[02 硬件与存储](docs/chapters/02-hardware.md) |
| 程序与算法 | [03 编程与接口](docs/chapters/03-programming.md)、[04 数据结构与算法](docs/chapters/04-algorithms.md) |
| 运行与通信 | [05 操作系统](docs/chapters/05-operating-systems.md)、[06 网络与Web](docs/chapters/06-networks.md) |
| 数据与工程 | [07 数据库](docs/chapters/07-databases.md)、[08 软件工程](docs/chapters/08-software-engineering.md)、[09 分布式系统](docs/chapters/09-distributed-systems.md) |
| 学习与智能 | [10 数学与机器学习](docs/chapters/10-math-and-ml.md)、[11 LLM与RAG](docs/chapters/11-llm-and-rag.md)、[12 Agent](docs/chapters/12-agents.md) |
| 可靠性与空间 | [13 安全与可靠性](docs/chapters/13-security-and-reliability.md)、[14 空间与数字孪生](docs/chapters/14-spatial-systems.md) |

每章包含机制解释、类比边界、最小实验、闭卷问题与参考来源。术语和历史帮助组织理解，解释、操作与迁移提供学习证据。

## 建筑与空间专业分类

| 分类 | 主要问题 |
|---|---|
| [BIM与工程数据](architecture/01-bim-and-data.md) | 构件怎样拥有稳定身份、属性、单位和空间关系？ |
| [参数化设计与生成式建模](architecture/02-parametric-design.md) | 怎样把几何规则、参数与约束写成可重复的过程？ |
| [GIS与场地分析](architecture/03-gis-and-context.md) | 坐标、单位和空间查询怎样影响场地分析？ |
| [数字孪生与建筑运维](architecture/04-digital-twins.md) | 模型、设备、观察与时间怎样组成可追溯的状态？ |

建筑专题用于练习计算机方法；示例采用虚构数据，不代替真实工程的规范审查、专项计算或现场验收。

## 运行第一个实验

下载或克隆仓库，在仓库根目录打开终端。需要带`sqlite3`模块的Python 3；参考验证环境为Python 3.12，示例只使用标准库。

```bash
python3 docs/practice/lab.py --lesson 1
python3 docs/practice/lab.py
```

第一条运行单个实验，第二条运行全部六个实验。不需要GPU、模型密钥或第三方包；脚本使用模拟时间和内存数据库。

运行前先写下预测，运行后核对输出，再改变一处输入检验理解。完整步骤和折叠答案在[实验说明](docs/practice/01-labs.md)。

## 用AI助教一起学

向能够读取仓库的助教提供本页或相关章节，然后说明需要查词、解释、动手还是诊断。例如：“按这份教材解释数据库事务，先给一个建筑构件数据的例子，再让我预测回滚后的结果。”

[问答规则](docs/05-question-routing.md)说明如何按需读取、核对来源和提供分层提示；[AGENTS.md](AGENTS.md)供支持仓库规则的工具读取。仓库本身不部署模型，也不自动把全部教材加载进每次对话。

## 内容维护与复用

- [完整文档索引](docs/index.md)：查看全部学习、来源与验证文件。
- [技术史常见误区](docs/01-source-review.md)：查证年份、定义和适用条件。
- [来源与维护](docs/09-sources-and-maintenance.md)：区分事实、研究结果和教学设计。
- [验证记录](docs/08-acceptance.md)：查看实际运行范围与限制。
- [贡献指南](CONTRIBUTING.md)：报告问题、修正文档或补充可验证的教学例子。

**文档采用CC BY 4.0，原创示例代码采用MIT。** 分享和改编时保留对应许可与出处，注明文档修改；具体范围及第三方材料例外见[NOTICE.md](NOTICE.md)、[文档许可](LICENSE-DOCS)和[代码许可](LICENSE)。
