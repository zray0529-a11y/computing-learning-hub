// Representative publications and records checked on 2026-11-16.
// Years anchor the stated receipt/publication/report event, not an exclusive
// invention claim. `connection` contains our teaching links, not claims that
// adjacency in this timeline establishes historical influence.
// Scope: publication metadata, abstracts, and the relevant mechanism sections;
// no claim of exhaustive historical review or replication of experiments.
export const atlasHistory = [
  {
    id: 'turing-computation', year: 1936,
    dateLabel: '1936 收稿 · 1937 刊行',
    title: '图灵：把“按规则计算”写清楚',
    problem: '怎样精确定义一种可以机械执行的方法，并判断是否所有数学问题都有这种方法？',
    contribution: '图灵用有限状态、读写符号和纸带描述计算，讨论通用机器，并证明判定问题的限制。这里的机器是数学模型。',
    connection: '学习时追踪一张状态转移表，再连接程序与算法；“可以计算”与“在时间预算内算完”仍是两个问题。',
    nodes: ['computation', 'algorithm', 'program', 'complexity'],
    sources: [
      { title: '原论文重印：机器描述与通用机器', url: 'https://theory.stanford.edu/~trevisan/cs172-07/turing36.pdf' },
      { title: '出版社记录：1936 收稿、1937 出版', url: 'https://academic.oup.com/plms/article-abstract/s2-42/1/230/1491926' }
    ]
  },
  {
    id: 'shannon-switching', year: 1938,
    dateLabel: '1938-12 · 期刊论文',
    title: '开关电路也能做符号运算',
    problem: '许多继电器与开关连在一起，怎样判断功能是否相同，并找到更简洁的接线？',
    contribution: '香农的论文以符号方法分析继电器与开关网络，研究等价变换，以及如何构造满足给定条件的电路。',
    connection: '学习时把开关的通断映射成两种状态，为串联与并联列真值表，再连接逻辑门；这只是理解芯片的一层。',
    nodes: ['bits', 'logic', 'cpu'],
    sources: [
      { title: 'IEEE：A Symbolic Analysis of Relay and Switching Circuits', url: 'https://ieeexplore.ieee.org/abstract/document/5057767/' }
    ]
  },
  {
    id: 'edvac-report', year: 1945,
    dateLabel: '1945-06-30 · 报告日期',
    title: 'EDVAC 报告：组织执行与存储',
    problem: '一台自动计算机器需要怎样组织运算、控制、存储与输入输出，才能连续执行一项任务？',
    contribution: '这份署名冯·诺依曼的设计报告描述各功能部件，并讨论把运算指令与数据存放在存储器中的方案。',
    connection: '学习时追踪“取指令—读数据—运算—写回”，把程序、CPU 与内存连起来；报告日期不等于整套思想由一人首次发明。',
    nodes: ['program', 'cpu', 'memory'],
    sources: [
      { title: 'EDVAC 原报告校订重印：日期与第 2 节', url: 'https://comp.anu.edu.au/courses/comp6310/Papers/1945/von%20Neumann/The%20First%20Draft%20Report%20on.pdf' },
      { title: '史密森尼馆藏：1945 年原报告记录', url: 'https://www.si.edu/object/first-draft-report-edvac-john-von-neumann%3Asiris_sil_538961' }
    ]
  },
  {
    id: 'shannon-information', year: 1948,
    dateLabel: '1948-07 · 论文上篇',
    title: '通信中的不确定性可以度量',
    problem: '消息有不同出现概率，传输又有噪声，怎样讨论编码效率与可靠传输的限制？',
    contribution: '香农用概率与对数定义信息熵，并分析信源、编码和信道；衡量消息的不确定性与理解消息的意义分开。',
    connection: '学习时比较等概率与偏斜概率的消息，再连接比特、概率和网络；文件字节数与信息熵不能直接画等号。',
    nodes: ['bits', 'probability', 'network'],
    sources: [
      { title: 'A Mathematical Theory of Communication：1948 年上篇扫描', url: 'https://academicweb.nd.edu/~powers/ame.20231/shannon1948a.pdf' }
    ]
  },
  {
    id: 'sketchpad', year: 1963,
    dateLabel: '1963-01 · 博士论文',
    title: 'Sketchpad：图形带着关系一起改变',
    problem: '在屏幕上移动一个点，怎样让相连的线与指定的平行等关系继续成立？',
    contribution: '萨瑟兰的 Sketchpad 通过光笔交互绘图，保存拓扑连接、可复用图形与几何约束，并调整图形以满足条件。',
    connection: '学习时比较“保存像素”与“保存点、线、关系”，连接图形学、数据结构和参数化；约束满足仍不等于工程设计合格。',
    nodes: ['graphics', 'data-structure', 'parametric', 'coordinates'],
    sources: [
      { title: 'MIT：1963 年 Sketchpad 博士论文记录', url: 'https://dspace.mit.edu/handle/1721.1/14979' },
      { title: '剑桥重印原论文：交互、拓扑与约束摘要', url: 'https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-574.html' }
    ]
  },
  {
    id: 'codd-relational', year: 1970,
    dateLabel: '1970-06 · CACM 论文',
    title: '关系模型：数据逻辑与存储方式分离',
    problem: '数据的物理组织改变后，能否让查询者与多数应用程序仍按原来的逻辑使用它？',
    contribution: '科德以关系组织数据，讨论规范形式和关系操作，把数据表示独立性、冗余与一致性作为明确问题。',
    connection: '学习时把构件与楼层分成关联的表，再区分查询含义与索引等实现；关系模型本身不是完整的数据库产品。',
    nodes: ['database', 'abstraction', 'index', 'data-structure'],
    sources: [
      { title: 'IBM Research：Codd 1970 论文日期与摘要', url: 'https://research.ibm.com/publications/a-relational-model-of-data-for-large-shared-data-banks' }
    ]
  },
  {
    id: 'parnas-modules', year: 1972,
    dateLabel: '1972-12 · CACM 论文',
    title: '模块围绕易变的设计决策划分',
    problem: '程序已经拆成几个文件，为什么一次存储格式修改仍会波及许多地方？',
    contribution: '帕纳斯比较不同模块划分，提出把可能改变的设计决策隐藏在模块内部，通过接口限制其他模块对细节的依赖。',
    connection: '学习时让调用者只用保存与查询接口，再尝试更换存储实现；接口必须说清输入、输出和错误，不能只留下函数名。',
    nodes: ['abstraction', 'api', 'program'],
    sources: [
      { title: '麦克马斯特大学：论文元数据与摘要', url: 'https://experts.mcmaster.ca/scholarly-works/2169027' },
      { title: '原论文教学转录：模块划分例子与准则', url: 'https://www.cs.lafayette.edu/~gexia/cs301/resources/parnas.html' }
    ]
  },
  {
    id: 'cerf-kahn-internetworking', year: 1974,
    dateLabel: '1974-05 · 协议论文',
    title: '不同分组网络之间怎样通信？',
    problem: '网络的分组大小与传输条件各不相同，跨网通信又会丢失、乱序，端点怎样交换数据？',
    contribution: '瑟夫与卡恩提出网络互联协议，讨论网关、序号、流量控制和端到端错误检查，处理跨网络的进程间通信。',
    connection: '学习时画出两台主机与中间网络，再分清传输确认和业务完成；这篇早期方案不等于今天的全部 TCP/IP 标准。',
    nodes: ['network', 'process', 'distributed'],
    sources: [
      { title: 'Cerf 与 Kahn 原论文：IEEE 1974 年 5 月', url: 'https://ethw.org/w/images/3/36/Ref1_A_Protocol_for_Packet_Network_Intercommunication_Cerf-Kahn_1974.pdf' }
    ]
  },
  {
    id: 'unix-paper', year: 1974,
    dateLabel: '1974-07 · CACM 论文',
    title: 'Unix：进程、文件与工具协作',
    problem: '多人使用同一台机器时，怎样组织文件、运行程序，并让不同工具交换数据？',
    contribution: '里奇与汤普森的论文描述 Unix 的层次文件系统、兼容的文件与设备及进程间输入输出，以及用户命令接口。',
    connection: '学习时追踪一个命令如何启动进程、打开文件并连接另一个程序；这里锚定论文发表，Unix 的早期系统在此前已运行。',
    nodes: ['os', 'process', 'filesystem', 'program'],
    sources: [
      { title: '1974 年 CACM 原论文电子重排：日期与机制', url: 'https://www.cs.utexas.edu/~witchel/380L/papers/ritchie74cacm-unix.pdf' }
    ]
  },
  {
    id: 'building-description-system', year: 1974,
    dateLabel: '1974-09 · BDS 研究报告',
    title: '建筑可以按构件与属性保存',
    problem: '同一建筑信息散落在多张图纸里，修改与提取材料信息都要重复核对，怎样减少这种割裂？',
    contribution: '伊士曼等人的 Building Description System 报告把建筑视为部件的空间组合，描述图形编辑、出图和按材料等属性整理数据。',
    connection: '学习时把一面墙看成几何、身份与属性的集合，连接 BIM 和数据库；这是理解对象化建模的历史实例，不是今天 BIM 全部流程。',
    nodes: ['bim', 'graphics', 'database'],
    sources: [
      { title: 'CMU 原研究报告：ERIC 扫描档案', url: 'https://files.eric.ed.gov/fulltext/ED113833.pdf' }
    ]
  },
  {
    id: 'backprop-representations', year: 1986,
    dateLabel: '1986-10-09 · Nature 论文',
    title: '从输出误差调整内部表示',
    problem: '多层网络里，内部单元没有直接给定的正确答案，怎样调整它们的连接权重？',
    contribution: '鲁梅尔哈特、辛顿与威廉斯展示反向传播学习：按输出误差调整权重，使隐藏单元形成有助于任务的表示。',
    connection: '学习时沿计算图追踪损失如何影响参数，再比较训练误差与未见样本表现；该论文是代表性展示，不作为算法的唯一发明起点。',
    nodes: ['ml', 'vector', 'algorithm'],
    sources: [
      { title: 'Nature：论文日期与摘要', url: 'https://www.nature.com/articles/323533a0' },
      { title: '作者存档：Learning Representations by Back-propagating Errors', url: 'https://www.cs.toronto.edu/~hinton/absps/naturebp.pdf' }
    ]
  },
  {
    id: 'web-proposal', year: 1989,
    dateLabel: '1989-03 · 信息管理提案',
    title: '用超链接连接不断变化的信息',
    problem: '组织与项目持续变化，资料虽然存在，却因人员更替、系统分散和固定目录而难以找到。',
    contribution: '伯纳斯-李在 CERN 的提案提出分布式超文本系统，用节点与链接表达资料和对象之间的多种关系。',
    connection: '学习时区分链接标识的资源、HTTP 请求与底层网络；1989 年是提案时间，不能把它写成浏览器和全部 Web 协议均已完成。',
    nodes: ['http', 'network', 'data-structure'],
    sources: [
      { title: 'W3C 保存的原提案：1989 年与 1990 年版本', url: 'https://www.w3.org/History/1989/proposal.html' },
      { title: 'W3C：1989 提案与后续实现的时间区分', url: 'https://www.w3.org/webat25/about/history' }
    ]
  },
  {
    id: 'web-search', year: 1998,
    dateLabel: '1998 · Web 搜索论文',
    title: '搜索需要抓取、索引与排序一起工作',
    problem: '网页数量不断增长，只靠目录和关键词匹配，怎样找到更有用的结果并承担大量查询？',
    contribution: '布林与佩奇描述 Google 搜索原型，将抓取、索引、锚文本与 PageRank 等链接信号组织成一个可运行系统。',
    connection: '学习时分清“已收录”“能召回”和“排在前面”，再进入 RAG 的证据检索；链接排序信号不能直接证明页面内容真实。',
    nodes: ['retrieval', 'index', 'algorithm', 'network'],
    sources: [
      { title: 'Google Research：1998 年论文记录与摘要', url: 'https://research.google/pubs/the-anatomy-of-a-large-scale-hypertextual-web-search-engine/' },
      { title: '原论文扫描：索引、锚文本与 PageRank', url: 'https://snap.stanford.edu/class/cs224w-readings/Brin98Anatomy.pdf' }
    ]
  },
  {
    id: 'digital-twin-paradigm', year: 2012,
    dateLabel: '2012-04 · 航空数字孪生论文',
    title: '让仿真模型持续对应一台真实设备',
    problem: '同类设备也会经历不同载荷与维护过程，怎样让模型反映某台设备的实际经历，而非只用一般性的统计假设？',
    contribution: '格莱斯根与斯塔格尔提出把高保真仿真、机载健康监测、维护历史与机队资料结合的数字孪生方案。',
    connection: '迁移到建筑学习时，先对齐设备身份、观察时间和模型状态，再谈预测；这篇航空方案论文不是建筑运维效果的验证，也不宣称概念始于此年。',
    nodes: ['twin', 'observability', 'bim', 'coordinates'],
    sources: [
      { title: 'NASA NTRS：The Digital Twin Paradigm，2012', url: 'https://ntrs.nasa.gov/citations/20120008178' }
    ]
  },
  {
    id: 'transformer', year: 2017,
    dateLabel: '2017-06-12 · 首版预印本',
    title: 'Transformer：用注意力组合序列信息',
    problem: '处理序列时，怎样建立位置之间的联系，同时减少循环结构带来的逐步计算限制？',
    contribution: 'Vaswani 等人提出 Transformer，把注意力、前馈网络与位置信息组合起来，并在机器翻译任务中检验这种架构。',
    connection: '学习时从向量如何相互加权进入语言模型；训练中可以并行处理多个位置，不代表自回归文本能一次生成完，也不代表答案可信。',
    nodes: ['vector', 'ml', 'transformer', 'llm'],
    sources: [
      { title: 'arXiv：Attention Is All You Need 与首版日期', url: 'https://arxiv.org/abs/1706.03762' },
      { title: '原论文现行 HTML：第 3 节架构', url: 'https://arxiv.org/html/1706.03762v7' }
    ]
  },
  {
    id: 'retrieval-augmented-generation', year: 2020,
    dateLabel: '2020-05-22 · 首版预印本',
    title: 'RAG：检索到的资料参与生成',
    problem: '知识只存于模型参数时，更新与追溯来源都很困难，生成过程怎样利用可检索的外部资料？',
    contribution: 'Lewis 等人研究检索增强生成，将预训练序列到序列模型与维基百科稠密向量索引结合，并评测知识密集型任务。',
    connection: '学习时分别检查检索候选、提供给模型的证据与最终回答；组合检索和生成仍需核对出处，不能自动保证正确，也不等于必须使用 Agent。',
    nodes: ['retrieval', 'vector', 'index', 'llm', 'rag', 'agent'],
    sources: [
      { title: 'Lewis 等：RAG 原论文摘要与版本记录', url: 'https://arxiv.org/abs/2005.11401' }
    ]
  }
];
