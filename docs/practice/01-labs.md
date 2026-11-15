# 六个离线最小实验

需要普通电脑上的 Python 3，且提供 sqlite3；不需要网络、密钥、GPU 或第三方安装包。
[lab.py](lab.py)只处理代码内的虚构小数据；数据库位于内存，默认运行不写用户文件。
先预测，再运行，再展开答案；每次只改一处，用自己的话解释行为变化。
“故意出错、修复、迁移”由读者在自己的练习副本中完成；运行参考脚本后，还应通过独立变式检验理解。
每位学习者可复制[进度模板](../06-progress-and-review.md)到本地，按[学习方法](../03-learning-method.md)记录自己的证据、评分与帮助程度。

入口：[练习索引](index.md) · [贯穿验收项目](02-capstone.md) · [专栏首页](../index.md)

## 运行方式

在本目录打开终端，运行以下命令；如果系统使用 python 或 py -3，请相应替换 python3。

~~~bash
python3 lab.py
python3 lab.py --lesson 1
python3 lab.py --lesson all
python3 lab.py --help
~~~

默认依次运行 1—6；单项选择可用 1、2、3、4、5、6，结果相互独立。
输出采用 JSON 形式，布尔值显示为 true／false；具体函数名可以在脚本中查找。
故意出错时使用自己的练习副本，保留正确参考；不要连接真实服务或把示例数据当真实观察。
实验 1—2 有完整示范，3—4 逐渐减少提示，5—6 要先自行提出规则和验收方式。

## 实验 1：字段解析、编码与条件

关联：[信息与表示](../chapters/01-computation.md)、[程序](../chapters/03-programming.md)。
输入含“东门”以及四台设备；online 分别为 true、false、字符串“false”和缺失值。

1. **先预测**：字符串“false”是否是布尔值？“东门”的字符数和 UTF-8 字节数是否相同？
2. **运行**：python3 lab.py --lesson 1；观察 lesson1 中的解析、类型检查和筛选。
3. **预期**：先写下有效设备、在线设备，再展开。

<details>
<summary>核对输出与解释</summary>

~~~text
label_chars = 2
label_utf8_bytes = 6
roundtrip = true
online_ids = ["cam-a"]
invalid_ids = ["cam-c", "cam-d"]
~~~

这里“东门”是两个字符，在 UTF-8 中占六个字节；这不是所有文本的通用倍数。
cam-c 的字符串值不能替代布尔值，cam-d 缺字段；两者都不进入在线筛选。
</details>

4. **故意出错**：去掉严格布尔类型检查，直接按 row.get("online") 的真假筛选，预测 cam-c 的变化。
5. **修复**：恢复类型检查；解释为什么直接使用 bool("false") 不能完成正确的数据转换。
6. **迁移题**：增加 online 为 0、null 和 true 的记录，自己确定数据契约，再预测哪些被接收。

## 实验 2：字典索引、去重与身份冲突

关联：[算法与数据结构](../chapters/04-algorithms.md)。
输入依次为 e1、完全相同的 e1 重发、e2；另有一组“同 event_id、不同 state”的冲突数据。

1. **先预测**：收到三条记录是否必须产生三次效果？同一编号的两种内容应选择哪一个？
2. **运行**：python3 lab.py --lesson 2；查看 build_index 的键和重复分支。
3. **预期**：区分“接收条数”和“唯一有效事件数”。

<details>
<summary>核对输出与解释</summary>

~~~text
event_ids = ["e1", "e2"]
effect_count = 2
duplicates_ignored = 1
id_conflicts = 1
conflict_result = {"reason": "no_fresh_observation", "status": "unknown"}
~~~

effect_count 只表示本内存模型中保留的唯一有效记录数，不代表真实业务已执行两次。
相同 ID 的不同内容会被隔离为 None，不静默覆盖；没有可用观察时返回 unknown。
</details>

4. **故意出错**：把“效果数”改为输入记录条数；说明为什么重发会把统计变成 3。
5. **修复**：按 event_id 去重，并检查相同 ID 的内容一致性；避免仅用实体编号去重而丢失不同时间的事件。
6. **迁移题**：让 e1 重发三次，再加入 e3；独立预测效果数，并解释进程重启后本内存方案的局限。

## 实验 3：SQLite 参数化与事务回滚

关联：[数据库](../chapters/07-databases.md)。
先提交 e1；随后在同一事务中插入 e2，再插入冲突的 e1，触发主键约束。

1. **先预测**：回滚之后 e1 与 e2 各自是否存在？查询文本包含 SQL 片段时应如何处理？
2. **运行**：python3 lab.py --lesson 3；本实验使用 :memory: 和显式 BEGIN／COMMIT／ROLLBACK。
3. **预期**：先画出事务边界，再核对数据库结果。

<details>
<summary>核对输出与解释</summary>

~~~text
transaction_rolled_back = true
row_count = 1
normal_query = ["e1"]
injection_text_query = []
~~~

e1 在事务前已提交，所以保留；e2 属于失败事务，所以撤销。
查询使用 ? 占位符传值，包含引号的文本作为数据匹配，没有变成查询结构。
</details>

4. **故意出错**：把 e2 的插入移到 BEGIN 之前；再次运行，观察为什么回滚成功仍会剩下两条记录。
5. **修复**：把需要一起成功或失败的操作放进同一个事务，并继续使用参数绑定。
6. **迁移题**：设计“设备记录与初始事件必须同时写入”的最小事务；自行说明每一步失败时保留什么。

## 实验 4：重复、乱序与事件时间

关联：[分布式系统](../chapters/09-distributed-systems.md)。
统一模拟 now=1000、TTL=600；时间为同一模拟时钟的整数秒，事件有效年龄为 0—600 秒，包含端点。

1. **先预测**：观察时间 399、400、900、1001 哪些有效？较晚到达的旧事件应覆盖新事件吗？
2. **运行**：python3 lab.py --lesson 4；不读取电脑当前时间，也不混入日期或时区。
3. **预期**：检查状态字段、观察时间和证据编号，不只看一个状态词。

<details>
<summary>核对输出与解释</summary>

~~~text
duplicates_ignored = 1
invalid_events = 1
zone-a = {"as_of": 1000, "evidence_ids": ["e2"], "observed_at": 900, "observed_state": "occupied", "status": "observed"}
zone-old = {"reason": "no_fresh_observation", "status": "unknown"}
zone-future = {"reason": "no_fresh_observation", "status": "unknown"}
zone-missing = {"reason": "no_fresh_observation", "status": "unknown"}
zone-edge = {"as_of": 1000, "evidence_ids": ["e-edge"], "observed_at": 400, "observed_state": "clear", "status": "observed"}
zone-conflict = {"evidence_ids": ["e-c1", "e-c2"], "reason": "conflicting_observations", "status": "unknown"}
~~~

observed 只表示“按本规则选出的最近有效模拟观察”，不是此刻物理世界的真实状态。
缺失时间的数据先被拒收；同一最新时刻出现矛盾观察也返回 unknown。
</details>

4. **故意出错**：把时间条件改成只检查 age <= TTL，去掉 age >= 0；预测未来事件怎样混入结果。
5. **修复**：恢复上下界，同时按 observed_at 选最近记录；不要按列表末尾或到达顺序选状态。
6. **迁移题**：把模拟 now 改成 1501，独立预测哪些证据过期；说明 TTL 是策略选择，不是事实可靠性的保证。

## 实验 5：关键词检索与时间、实体过滤

关联：[LLM 与 RAG](../chapters/11-llm-and-rag.md)。
这是确定性关键词匹配，不计算 embedding，不调用模型，也不评测真实 RAG 的质量。

1. **先预测**：命中一条包含 clear 的旧资料，是否足以回答“最近有效观察是什么”？
2. **运行**：python3 lab.py --lesson 5；先检查授权、实体和时间过滤，再做字符串匹配。
3. **预期**：分别记录“资料命中”和“状态选择”的结果。

<details>
<summary>核对输出与解释</summary>

~~~text
fresh = {"hits": ["e2"], "status": "matches"}
stale = {"hits": [], "status": "unknown"}
future = {"hits": [], "status": "unknown"}
denied = {"hits": [], "status": "denied"}
wrong_entity = {"hits": [], "status": "unknown"}
older_matches = {"hits": ["e1", "e0"], "status": "matches"}
latest_observed_state = "occupied"
~~~

e1、e0 仍在有效时间窗内，且命中 clear；但它们比 e2 更早，所以不能替代最近观察。
没有命中并不表示实体是 clear；越权请求返回 denied 和空结果，不返回 受保护事件内容。
</details>

4. **故意出错**：在练习副本的 fresh_rows 中去掉实体筛选；预测 wrong_entity 为什么可能收到别的区域的事件。
5. **修复**：恢复实体约束，确认授权在检索前检查；解释“请求实体有权限”为什么不足以保护未过滤的结果集。
6. **迁移题**：自己添加一个新实体与两种关键词，验证不会串实体；设计一题“找不到资料”的回答规则。

## 实验 6：预算、权限和证据检查

关联：[Agent](../chapters/12-agents.md)、[安全与可靠性](../chapters/13-security-and-reliability.md)。
这是确定性工作流模拟；没有 LLM、真实工具执行或自主 Agent 能力验证，成功结果也只是待复核建议。

1. **先预测**：预算为 2，前 1 次或前 3 次模拟超时，各尝试几次？有答案但无证据能否通过？
2. **运行**：python3 lab.py --lesson 6；先自行找出授权、重试、证据检查和停止分支。
3. **预期**：用 attempts、status 和 reason 核对每条路径。

<details>
<summary>核对输出与解释</summary>

~~~text
retry_then_success = {"attempts": 2, "evidence_ids": ["e2"], "observed_at": 900, "observed_state": "occupied", "proposal": "review_observation", "status": "ready_for_review"}
retry_stops = {"attempts": 2, "reason": "budget_exhausted", "status": "unknown"}
missing_evidence = {"attempts": 1, "reason": "insufficient_evidence", "status": "unknown"}
missing_observation = {"attempts": 1, "reason": "no_fresh_observation", "status": "unknown"}
denied = {"attempts": 0, "status": "denied"}
zero_budget = {"attempts": 0, "reason": "budget_exhausted", "status": "unknown"}
~~~

权限失败在访问数据前返回；证据缺失或不匹配时不给建议；只有模拟超时进入预算内重试。
ready_for_review 表示建议可供复核，不代表真实动作执行成功。
</details>

4. **故意出错**：在副本中跳过 evidence_ok 的拒绝分支；观察 missing_evidence 是否错误地获得 ready_for_review。
5. **修复**：恢复证据检查；自行补一种“证据 ID 存在但属于另一实体”的检查思路。
6. **迁移题**：只用纸面规则设计一个需要人工确认的后续动作，写出权限、证据、幂等键与停止条件，不调用真实服务。

## 复盘与依据

完成一个实验后，在自己的本地记录中保留预测、实际结果、错误原因、修正理由和独立变式的结果。
跨实验验收见[贯穿项目](02-capstone.md)；方法依据见[学习机制与研究边界](../03-learning-method.md)。
技术参考为 Python 官方 [JSON](https://docs.python.org/3/library/json.html)、[SQLite 参数绑定与事务](https://docs.python.org/3/library/sqlite3.html)、[argparse](https://docs.python.org/3/library/argparse.html) 文档，2026-11-15 核对。
