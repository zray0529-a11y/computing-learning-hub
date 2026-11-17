# 01 建筑数据、BIM 与 IFC：先分清对象，再处理模型

[分类导航](README.md) · [下一篇：参数化几何](02-parametric-design.md)

图解中的两堵墙都可以叫“外墙”，但 `wall-A` 与 `wall-B` 是两件对象。墙 A 的长度写成 `3000 mm`，换成米是 `3 m`；一条明确的关联把它连到一层 `level-A`。如果导出清单时只保留名称和数字，就可能把两堵墙误合并，或把毫米当成米。本篇从这三个可以核对的细节理解模型数据。

> 本文使用虚构构件和楼层，仅作教学示意；实验表格不是有效的 IFC 文件。

## 学习目标

- 区分对象身份、显示名称、几何形状和属性。
- 能用关系连接构件与楼层，并在聚合前处理单位。
- 能说明“可以打开模型”和“数据满足任务要求”的区别。

## 对照计算机章节

| 本篇问题 | 计算机机制 | 建议先读 |
| --- | --- | --- |
| 怎样表达一堵墙 | 类型、属性、对象 | [03 编程](../docs/chapters/03-programming.md) |
| 怎样连接墙与楼层 | 主键、外键、查询 | [07 数据库](../docs/chapters/07-databases.md) |
| 怎样找相关构件 | 图与邻接关系 | [04 算法](../docs/chapters/04-algorithms.md) |
| 怎样检验一次导出 | 输入契约、版本、验证 | [08 软件工程](../docs/chapters/08-software-engineering.md) |

## 机制一：身份、名称和形状分别回答不同问题

BIM（建筑信息模型）把工程对象与几何、属性和关系一起组织起来；IFC（Industry Foundation Classes，行业基础类）是交换这类数据的开放标准。
可以先想成“构件卡片加关联清单”：每张卡片有身份，卡片之间还写明关系。
这只是阅读入口；IFC 定义了数据结构与规则，并不等于一张纯文本表。
同一数据模型可以采用不同的序列化方式（把数据写成文件的编码规则），例如常见的 IFC-SPF 文本与 XML（用标签组织数据的文本格式）。
STEP 是产品数据交换的一组标准；IFC-SPF 使用其中的文本编码规则保存一条条实例和引用。[5]

像两本同名书各有馆藏号，名称便于人阅读，标识用于区分和关联对象。
一个对象可以同时具有标识、类型、名称、属性和几何表达，各自回答不同问题。

| 信息 | 回答的问题 | 容易出现的错误 |
| --- | --- | --- |
| 对象标识 | 这是哪一个对象？ | 按名称合并，误把两堵墙合成一堵 |
| IFC 类型 | 它是什么类别？ | 从颜色或图层名称猜类型 |
| 几何表达 | 它在哪里、是什么形状？ | 看到相同形状就认定属性也相同 |
| 属性和数量 | 它有哪些描述和数值？ | 把缺失值当作零 |

读 IFC 时会遇到 `IfcRoot`，可先理解为给一类实体提供公共字段的“根类”；继承它的实体具有 `GlobalId`（全局唯一标识）等字段。
构件、关系等可使用这些公共字段，但并非所有底层资源实体都继承 `IfcRoot`。[1]

还要分清两种看起来都像“编号”的东西：

| 编号 | 表达什么 | 使用边界 |
| --- | --- | --- |
| STEP 实例编号，如 `#101` | IFC-SPF 文件内某个实例的本地标识，其他记录可用它引用该实例 | 不是文本的第 101 行，也不是跨文件身份；另一份文件的 `#101` 可以是别的对象 |
| `GlobalId` | 给继承 `IfcRoot` 的实体分配的全局唯一标识 | 用于支持身份关联；跨版本保留仍取决于建模、复制和导出规则，不能承诺永远不变 |

IfcOpenShell 是读取、操作 IFC 的工具库，其 `by_id` 按 STEP 实例编号查找，`by_guid` 按 `GlobalId` 查找，`by_type` 按类别查找。[4][6]
因此，跨文件追踪要核对标识、来源和版本，并确认导出工具如何保留原对象身份。馆藏号类比的边界也在这里：有标识字段，不会自动保证整条导出链都正确保留它。

## 机制二：关系本身也是数据

现在给图中的一层再加一扇虚构的门 `door-A`。仅从门的坐标看它与楼层相交，仍不能知道清单里把它归在哪一层；需要单独写一条“门归属于一层”的关系记录。
长名字 `IfcRelContainedInSpatialStructure` 就是在表达这种**主要空间容纳关系**：`Rel` 表示关系，后半段表示被容纳在空间结构中。[2]

| 记录中的角色 | 本例内容 | 如何读懂 |
| --- | --- | --- |
| 被关联的构件 `RelatedElements` | 门 `door-A`，类别为 `IfcDoor` | 哪些构件被容纳？ |
| 容纳它的空间 `RelatingStructure` | 一层 `level-A`，类别为 `IfcBuildingStorey` | 容纳在哪个空间结构元素中？ |
| 关系记录本身 | 一条 `IfcRelContainedInSpatialStructure` 记录 | 把上面两端明确连接起来 |

这里用教学标识解释关系，不是可直接复制进 IFC 文件的语法。图中墙 A 连到一层也使用相同思路。
“构件位于某层”和“楼层组成某建筑”是不同关系；后者使用 `IfcRelAggregates`（整体与组成部分的分解关系）。[2]

主要容纳关系具有单一归属约束，而空间引用可以关联多个空间结构元素。
因此，一个跨层构件可能有一个主要容纳位置，同时在其他楼层被引用。[2]
这也说明：仅凭几何相交，无法推断数据中已声明的所有空间关系。

对于自己的表格，可把对象放在一张表、关联放在另一张表，再通过标识连接。
检查关联时，既要找“指向不存在对象”的引用，也要检查任务要求的必填关系是否缺失。
这就是参照完整性检查：关联引用的对象必须确实存在；“每个构件必须有关联”则是另外声明的完整性要求。
它们不要求先绘制三维场景，也不能替代几何检查。

## 机制三：数值离不开单位和口径

`3000` 只是数字；只有知道它是毫米，才能与 `4.5` 米相加。
IFC 的项目单位提供默认解释，某些量也可以明确使用自己的单位。[3]
属性缺失、数值为零和不适用应分别记录，不应在清洗时悄悄合并。

即使单位相同，计算口径也可能不同，例如轴线长度与净长不能直接混用。
因此，导出清单宜保留对象标识、类别、来源字段、单位和版本信息。
以下实验只汇总假设给定的墙长，不模拟几何提量或工程量计量规则。

## 最小实验：关联楼层，并统一长度单位

运行前预测：一层有几件构件？其中墙的总长度是多少？
`id` 是教学用标识，不是 IFC 编码规则要求的 `GlobalId`。
把整段代码保存为任意 `.py` 文件，使用 Python 3 运行即可。

```python
from collections import Counter

elements = [
    {"id": "wall-A", "kind": "IfcWall", "length": 3000, "unit": "mm"},
    {"id": "wall-B", "kind": "IfcWall", "length": 4.5, "unit": "m"},
    {"id": "door-A", "kind": "IfcDoor", "length": 900, "unit": "mm"},
]
storeys = {"level-A", "level-B"}
contained = {"wall-A": "level-A", "wall-B": "level-B", "door-A": "level-A"}
scale_to_m = {"mm": 0.001, "m": 1.0}
ids = [item["id"] for item in elements]
assert len(ids) == len(set(ids)), "duplicate object id"
# 本实验约定每件构件都有且只有一个主要楼层，并检查两端引用存在。
assert set(contained) == set(ids), "missing or unknown object reference"
assert set(contained.values()) <= storeys, "unknown storey reference"
counts = Counter(contained.values())
wall_lengths = {storey: 0.0 for storey in storeys}
for item in elements:
    assert item["unit"] in scale_to_m, "unknown unit"
    if item["kind"] == "IfcWall":
        # 先按原始单位换成米，再加入该楼层的墙长汇总。
        wall_lengths[contained[item["id"]]] += item["length"] * scale_to_m[item["unit"]]
print(f"objects={len(elements)}")
for storey in sorted(storeys):
    print(f"{storey}: objects={counts[storey]} wall_length_m={wall_lengths[storey]:.2f}")
```

确切预期输出：

```text
objects=3
level-A: objects=2 wall_length_m=3.00
level-B: objects=1 wall_length_m=4.50
```

门计入对象数量，但没有计入墙长；筛选条件与聚合条件分别决定结果。
代码要求每个对象恰有一条楼层关联，这是本实验的数据契约，严于通用 IFC 的可选情况。
字典不能保存重复键；真实导入时，应在构建字典之前检查原始关联记录有无重复。

## 如何把实验迁移到专业数据

先检查文件声明的 schema（规定类型、属性及其约束的数据结构版本），再选择适合该版本的读取方法。
IfcOpenShell 的官方入门页展示了 `model.schema`、对象查询及 `get_psets`。[4]
读取属性集合只是取得数据；还要核实字段含义、单位、缺失值和类型属性的来源。
最后抽取少量对象，把原模型、关联表和汇总结果逐项对照，定位信息在哪一步丢失。

## 闭卷问题

1. 为什么不能用墙的名称作为合并两个构件清单的唯一依据？
2. 一个构件跨越两层，能否因此断言它有两个主要空间容纳关系？
3. 把实验中 `3000 mm` 的单位直接改成 `m`，为什么程序仍可能正常运行？
4. 两次导出的 `#101` 一样，是否足以证明是同一件门？

<details>
<summary>展开参考答案</summary>

1. 名称可能重复，也可能修改；应使用约定的稳定标识，并核对版本和来源。
2. 不能。主要容纳与多处空间引用不同；跨层几何不能直接推出关系的表达方式。
3. 数字与单位在语法上都有效，语义却错了；需要来源核查和合理性检查发现这类错误。
4. 不足。它是各自文件内的 STEP 实例编号，并非跨文件身份；应核对约定保留的 `GlobalId`、来源与版本，必要时查看导出映射。

</details>

## 来源与范围

原有标准定义核查日期为2026-11-15，范围为 IFC 4.3.2.0 正式发布页中的下列定义和属性，未审阅整个标准。2026-11-17补查了格式说明与 IfcOpenShell 文档；`IfcRoot` 和单位定义通过搜索索引中的官方发布页内容复核，发布页直接访问返回403。空间容纳关系另与官方发布版的 [Spatial Structure 概念页](https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/concepts/Object_Connectivity/Spatial_Structure/content.html)交叉核对，没有把搜索返回的开发草案当作发布版。

1. [buildingSMART：IfcRoot](https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/IfcRoot.htm)：实体继承范围、标识和名称属性。
2. [buildingSMART：IfcRelContainedInSpatialStructure](https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/IfcRelContainedInSpatialStructure.htm)：主要容纳、空间引用及空间层级分解的区别。
3. [buildingSMART：IfcUnitAssignment](https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/IfcUnitAssignment.htm)：项目默认单位和局部单位说明。
4. [IfcOpenShell：Hello, world!](https://docs.ifcopenshell.org/ifcopenshell-python/hello_world.html)：schema、标识/类型查询和属性集合读取示例；未安装或运行 IfcOpenShell。
5. [buildingSMART：IFC Formats](https://technical.buildingsmart.org/standards/ifc/ifc-formats/)：IFC-SPF、XML等编码方式及其所用标准；本轮读取官方搜索索引内容。
6. [IfcOpenShell：entity_instance](https://docs.ifcopenshell.org/autoapi/ifcopenshell/entity_instance/index.html)：STEP 数字标识与实体属性；配合入门页区分实例编号和 `GlobalId`。

实验只验证对象关联、筛选和单位换算；不验证 IFC 文件完整性、几何正确性或工程交付要求。
