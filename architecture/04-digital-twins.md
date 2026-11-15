# 04 数字孪生与建筑运维：把建筑对象连接到可信的状态

[分类导航](README.md) · [上一篇：GIS 与坐标](03-gis-and-context.md)

> 房间、测点、读数和时效阈值均为虚构教学数据；本文实验不连接或控制真实设备。

## 学习目标

- 分清建筑对象、测点、时序记录和界面显示各自的职责。
- 解释重复消息、乱序到达和过期观测怎样影响“当前状态”。
- 为每个显示值保留来源、单位、时间和质量说明。

## 对照计算机章节

| 本篇问题 | 计算机机制 | 建议先读 |
| --- | --- | --- |
| 哪个点描述哪个房间 | 键、关系和图查询 | [07 数据库](../docs/chapters/07-databases.md) |
| 数据怎样从设备到服务 | 请求、连接和通信边界 | [06 网络](../docs/chapters/06-networks.md) |
| 重复和乱序怎样处理 | 幂等、事件时间和状态更新 | [09 分布式系统](../docs/chapters/09-distributed-systems.md) |
| 状态是否值得信任 | 权限、审计和可观测性 | [13 安全与可靠性](../docs/chapters/13-security-and-reliability.md) |
| 状态怎样回到空间对象 | 空间、语义和实时证据 | [14 空间系统](../docs/chapters/14-spatial-systems.md) |

## 机制一：显示模型、语义关系和观测分别管理

本篇从一个最小任务理解数字孪生：为虚构建筑中的房间显示最近有效观测。
三维形体帮助定位，语义关系说明对象之间的含义，时序记录保存随时间变化的数据。
将三者连接起来，需要明确对象标识和对应关系，而不只是让界面动起来。

Brick 用实体与关系描述建筑中的设备、空间及测点等概念。[1]
其中 `Point` 表示数据点，可能对应传感、设定、命令或计算结果，不等于传感器外壳。[1]

| 关系 | 回答什么问题 | 教学示意 |
| --- | --- | --- |
| `hasPart` | 什么构成了什么？ | 楼层包含房间 |
| `hasLocation` | 设备在什么位置？ | 控制器位于设备间 |
| `hasPoint` | 对象关联哪些数据点？ | 房间关联温度测点 |
| `feeds` | 介质沿哪个方向供应？ | 上游设备向下游设备供给空气 |

这些关系含义不同；设备放在哪个房间，不能直接推出它服务哪个房间。[1]
建筑模型中的对象标识、运维资产编号和时序数据库的序列标识，也应有显式映射。
若设备替换或空间用途改变，应更新映射及其适用时间，避免新读数挂到旧对象上。

## 机制二：关系描述与时序值可以分开存储

Brick 的时序引用记录某个数据点在外部数据库中的标识及存放位置。[2]
这让语义模型回答“应读取哪条序列”，而时序存储回答“那条序列在某时刻的值是什么”。
`ref:hasExternalReference` 还可以连接外部系统中的其他表示。[3]
这种连接描述不自动证明观测准确，也不替系统决定数据保留和更新策略。

可以把一次观测的最小记录写成：测点标识、事件标识、观测时间、数值、单位和质量。
到达时间另行保存，用来研究延迟；不能用它替代观测实际发生的时间。
以下实验约定所有时间都使用带 UTC 偏移的格式，所有数值都表示摄氏温度。

## 机制三：“最近收到”不一定是“最近发生”

网络重试可能让同一事件到达两次，网络延迟也可能让旧事件晚于新事件到达。
可先按事件标识去重，再按观测时间选择用于当前显示的记录。
旧事件仍可能对历史分析有用；不更新当前显示，不代表应该删除历史记录。

新鲜、过期、没有数据和测量无效应分别表达；缺失值不能显示成零。
本例用 4 分钟作为人为设置的演示时效阈值，不是运行标准或舒适度标准。
真实阈值需要结合采样周期、业务用途和允许延迟确定，并随结果一起解释。

## 最小实验：重放重复与乱序观测

输入顺序代表到达顺序：`e2` 比 `e3` 晚到，但实际发生得更早。
`e3` 重复一次；第二个测点只有旧数据，第三个测点没有数据。
运行前预测每个房间最终显示的状态。

```python
from datetime import datetime

point_to_room = {"point-A": "room-A", "point-B": "room-B", "point-C": "room-C"}
events = [
    ("e1", "point-A", "2024-01-01T09:00:00+00:00", 21.0),
    ("e3", "point-A", "2024-01-01T09:03:00+00:00", 23.0),
    ("e2", "point-A", "2024-01-01T09:01:00+00:00", 22.0),
    ("e3", "point-A", "2024-01-01T09:03:00+00:00", 23.0),
    ("e4", "point-B", "2024-01-01T08:50:00+00:00", 20.0),
]
now = datetime.fromisoformat("2024-01-01T09:05:00+00:00")
seen, latest = set(), {}
duplicates = 0
for event_id, point, stamp, value in events:
    if event_id in seen:
        duplicates += 1
        continue
    seen.add(event_id)
    observed = datetime.fromisoformat(stamp)
    assert point in point_to_room and observed <= now
    if point not in latest or observed > latest[point][0]:
        latest[point] = (observed, value)
print(f"duplicates={duplicates}")
for point, room in sorted(point_to_room.items()):
    if point not in latest:
        print(f"{room}: status=no_data")
        continue
    observed, value = latest[point]
    age_min = (now - observed).total_seconds() / 60
    status = "fresh" if age_min <= 4 else "stale"
    print(f"{room}: {value:.1f} degC age_min={age_min:.0f} status={status}")
```

确切预期输出：

```text
duplicates=1
room-A: 23.0 degC age_min=2 status=fresh
room-B: 20.0 degC age_min=15 status=stale
room-C: status=no_data
```

程序保留 `e3` 的 23.0，较晚到达的 `e2` 不会把它改回 22.0。
`stale` 表示观测过旧，不表示设备一定损坏；`fresh` 也不等于测量值一定准确。
实验假定每个事件编号标识唯一的逻辑事件，重传载荷一致，且时钟可信。
相同编号但载荷不同应拒收或隔离；同一时间戳的不同事件在本例保留先到者，真实系统须明确冲突策略。

## 从状态展示继续走向运维

先让每个值能追溯到测点、单位、时间和质量，再加入趋势、告警和工单关联。
告警应保留触发依据、持续时间与解除条件，避免一次噪声直接变成确定结论。
实际控制还涉及授权、设备边界和反馈确认；状态显示成功不能替代控制链路验证。
这几项是本篇提出的系统设计检查方向，实验仅完成内存中的观测去重和状态选择。

## 闭卷问题

1. 为什么设备所在的房间，不一定就是其数据所描述或服务的房间？
2. 为什么按消息到达顺序直接覆盖当前值，会得到错误的“最新状态”？
3. 一个读数仍在时效阈值内，为什么不能据此认定它准确？

<details>
<summary>展开参考答案</summary>

1. 物理位置、组成、服务拓扑和测点关联是不同关系，需要分别建立，不能互相替代。
2. 旧观测可能因延迟更晚到达；应在明确时钟和冲突规则后按观测时间更新，并处理重复。
3. 新鲜只说明时间接近，还可能存在传感器故障、单位错误、错误关联或质量无效等情况。

</details>

## 来源与范围

查阅日期：2026-11-15。实际核查下列 Brick 官方文档，未安装 Brick 工具、连接时序数据库或操作设备。

1. [Brick：Relationships](https://docs.brickschema.org/brick/relationships.html)：实体类别，`hasPart`、`hasLocation`、`hasPoint`、`feeds` 及逆关系的含义。
2. [Brick：Timeseries Storage](https://docs.brickschema.org/metadata/timeseries-storage.html)：`ref:TimeseriesReference`、序列标识与外部数据库引用。
3. [Brick：External Representation](https://docs.brickschema.org/metadata/external-representations.html)：Point 与外部表示之间的 `ref:hasExternalReference`。

去重、时效判断及房间映射为原创教学逻辑，不是 Brick 的完整实现或运行控制规范。
