# 01 建筑数据、BIM 与 IFC：先分清对象，再处理模型

[分类导航](README.md) · [下一篇：参数化几何](02-parametric-design.md)

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

一个对象可以同时具有标识、类型、名称、属性和几何表达。
名称用于阅读，标识用于关联；两堵墙同名，并不意味着它们是同一对象。
IFC 中继承 `IfcRoot` 的实体具有 `GlobalId`；并非所有底层资源实体都继承它。[1]

| 信息 | 回答的问题 | 容易出现的错误 |
| --- | --- | --- |
| 对象标识 | 这是哪一个对象？ | 按名称合并，误把两堵墙合成一堵 |
| IFC 类型 | 它是什么类别？ | 从颜色或图层名称猜类型 |
| 几何表达 | 它在哪里、是什么形状？ | 看到相同形状就认定属性也相同 |
| 属性和数量 | 它有哪些描述和数值？ | 把缺失值当作零 |

文件中的 STEP 实例编号与 `GlobalId` 是不同的查询入口。
IfcOpenShell 分别提供 `by_id`、`by_guid` 和按类别查询的 `by_type`。[4]
跨文件追踪还要约定导出时怎样保留标识；单有字段名，不能保证版本间稳定对应。

## 机制二：关系本身也是数据

“墙位于某层”和“楼层属于某建筑”是两种关系。
IFC 的 `IfcRelContainedInSpatialStructure` 表达构件的主要空间容纳关系；
空间结构的分解层级使用 `IfcRelAggregates`，不能混成同一个关系。[2]

主要容纳关系具有单一归属约束，而空间引用可以关联多个空间结构元素。
因此，一个跨层构件可能有一个主要容纳位置，同时在其他楼层被引用。[2]
这也说明：仅凭几何相交，无法推断数据中已声明的所有空间关系。

对于自己的表格，可把对象放在一张表、关联放在另一张表，再通过标识连接。
检查关联时，既要找“指向不存在对象”的引用，也要检查任务要求的必填关系是否缺失。
这些检查相当于数据库中的参照完整性；它们不要求先绘制三维场景。

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
assert set(contained) == set(ids), "missing or unknown object reference"
assert set(contained.values()) <= storeys, "unknown storey reference"
counts = Counter(contained.values())
wall_lengths = {storey: 0.0 for storey in storeys}
for item in elements:
    assert item["unit"] in scale_to_m, "unknown unit"
    if item["kind"] == "IfcWall":
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

先检查文件声明的 schema，再选择适合该版本的类型和属性读取方法。
IfcOpenShell 的官方入门页展示了 `model.schema`、对象查询及 `get_psets`。[4]
读取属性集合只是取得数据；还要核实字段含义、单位、缺失值和类型属性的来源。
最后抽取少量对象，把原模型、关联表和汇总结果逐项对照，定位信息在哪一步丢失。

## 闭卷问题

1. 为什么不能用墙的名称作为合并两个构件清单的唯一依据？
2. 一个构件跨越两层，能否因此断言它有两个主要空间容纳关系？
3. 把实验中 `3000 mm` 的单位直接改成 `m`，为什么程序仍可能正常运行？

<details>
<summary>展开参考答案</summary>

1. 名称可能重复，也可能修改；应使用约定的稳定标识，并核对版本和来源。
2. 不能。主要容纳与多处空间引用不同；跨层几何不能直接推出关系的表达方式。
3. 数字与单位在语法上都有效，语义却错了；需要来源核查和合理性检查发现这类错误。

</details>

## 来源与范围

查阅日期：2026-11-15。buildingSMART 资料限定为 IFC 4.3.2.0 正式发布页；查阅了下列定义和属性，未审阅整个标准。

1. [buildingSMART：IfcRoot](https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/IfcRoot.htm)：实体继承范围、标识和名称属性。
2. [buildingSMART：IfcRelContainedInSpatialStructure](https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/IfcRelContainedInSpatialStructure.htm)：主要容纳、空间引用及空间层级分解的区别。
3. [buildingSMART：IfcUnitAssignment](https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/IfcUnitAssignment.htm)：项目默认单位和局部单位说明。
4. [IfcOpenShell：Hello, world!](https://docs.ifcopenshell.org/ifcopenshell-python/hello_world.html)：schema、标识/类型查询和属性集合读取示例；未安装或运行 IfcOpenShell。

实验只验证对象关联、筛选和单位换算；不验证 IFC 文件完整性、几何正确性或工程交付要求。
