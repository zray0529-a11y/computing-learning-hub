// Original diagrams and teaching summaries, grounded in the linked chapter text.
const picture = (prefix, label, content, height = 420) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${height}" role="img" aria-label="${label}"><title>${label}</title><defs><marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 Z" fill="currentColor"/></marker></defs>${content}</svg>`;
const text = (x, y, value, cls = 'v-label', anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${value}</text>`;
const arrow = (prefix, path) => `<path d="${path}" class="v-arrow" fill="none" marker-end="url(#${prefix}-arrow)"/>`;
const node = (key, content) => `<g data-node="${key}" class="v-node">${content}</g>`;
const cell = (x, y, width, height, cls = 'v-box') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" class="${cls}"/>`;

export const lessons = [
  {
    path: 'docs/chapters/01-computation.md',
    title: '四个开关，怎样表示十三？',
    intro: '约定按无符号二进制读数后，把开启位置的位权相加，1101 就表示十三。',
    diagramLabel: '四个位从左到右为一、一、零、一，对应位权八、四、二、一；开启的位贡献八、四和一，相加得到十三。',
    svg: picture('f01', '四个比特按位权相加得到十三', `
      ${text(400, 44, '约定：四位无符号整数')}
      ${node('switches', [1, 1, 0, 1].map((value, i) => {
        const x = 66 + i * 180;
        return `${cell(x, 78, 128, 95, value ? 'v-green' : 'v-box')}${text(x + 64, 116, value ? '开启' : '关闭', 'v-small')}<circle cx="${x + (value ? 89 : 39)}" cy="147" r="15" class="${value ? 'v-green' : 'v-box'}"/>${text(x + 64, 218, value, 'v-big')}`;
      }).join(''))}
      ${node('weights', [8, 4, 2, 1].map((value, i) => {
        const x = 130 + i * 180;
        return `${text(x, 255, `× ${value}`, 'v-label')}${text(x, 283, `位权 ${value}`, 'v-small')}`;
      }).join(''))}
      ${node('sum', `${cell(135, 316, 530, 62, 'v-blue')}${text(400, 357, '8 + 4 + 0 + 1 = 13', 'v-big')}`)}
      ${text(400, 405, '四位共有 2 × 2 × 2 × 2 = 16 种组合', 'v-small')}
    `, 440),
    steps: [
      { title: '先读两个状态', body: '每个开关只区分 0 与 1。四个位置各有两种选择，共有十六种组合。', focus: ['switches'] },
      { title: '给位置约定位权', body: '从右向左的位权是 1、2、4、8。每一位的贡献等于该位的值乘位权。', focus: ['switches', 'weights'] },
      { title: '把贡献相加', body: '1101 的贡献是 8、4、0、1，总和是 13；若改成开关清单，含义就不同。', focus: ['weights', 'sum'] },
    ],
    analogy: { title: '开关与编码', body: '开和关对应两个可区分状态，多个开关的组合对应一段比特编码。', limit: '真实硬件可用电压区间、电荷等承载比特；0、1 不等于固定电压。' },
    misconception: { wrong: '只要看到 1101，就知道它的含义。', right: '这里先约定了无符号整数格式。同一串比特也能表示四个独立开关；解释还需要格式与上下文。' },
    check: { prompt: '要用等长编码区分十七种状态，最少需要几位？', options: [
      { text: '五位', correct: true, feedback: '四位只有十六种组合，五位有三十二种，才够区分十七种状态。' },
      { text: '四位', correct: false, feedback: '四位可表示整数 0 到 15，共十六种状态，少于十七种。' },
      { text: '十七位', correct: false, feedback: '每增加一位，组合数翻倍；无需为每种状态单独安排一位。' },
    ] },
    related: ['docs/chapters/02-hardware.md', 'docs/chapters/03-programming.md'],
    lab: 'bits',
  },
  {
    path: 'docs/chapters/02-hardware.md',
    title: 'CPU 算之前，数据从哪里来？',
    intro: '持久存储保存内容，主存承载运行中的程序与数据，CPU 取得指令和操作数后执行计算。',
    diagramLabel: '从左侧持久存储向中间主存加载程序和数据，主存向右侧 CPU 提供指令与数据；结果回到主存，再按需要保存到持久存储。图中省略缓存与设备控制器。',
    svg: picture('f02', '持久存储、主存与 CPU 之间的数据路径', `
      ${text(400, 43, '先搬数据，再执行指令')}
      ${node('disk', `${cell(36, 108, 200, 178, 'v-orange')}<ellipse cx="136" cy="149" rx="67" ry="21" class="v-orange"/><path d="M 69 149 V 209 C 69 237 203 237 203 209 V 149" class="v-line" fill="none"/>${text(136, 267, '持久存储')}${text(136, 322, '断电后保留内容', 'v-small')}`)}
      ${node('ram', `${cell(300, 108, 200, 178, 'v-blue')}${text(400, 144, '主存 RAM')}${[0, 1, 2].map(i => `${cell(319 + i * 54, 170, 45, 43, 'v-box')}`).join('')}${text(400, 257, '程序 + 数据', 'v-label')}`)}
      ${node('cpu', `<path d="M 576 132 H 561 M 576 168 H 561 M 576 204 H 561 M 576 240 H 561 M 754 132 H 769 M 754 168 H 769 M 754 204 H 769 M 754 240 H 769" class="v-line" fill="none"/>${cell(576, 108, 178, 178, 'v-purple')}${text(665, 144, 'CPU')}${cell(598, 162, 134, 48, 'v-box')}${text(665, 194, '寄存器', 'v-label')}${text(665, 257, '取指 · 运算', 'v-label')}`)}
      ${arrow('f02', 'M 239 190 H 293')}${text(266, 97, '加载', 'v-small')}
      ${arrow('f02', 'M 503 190 H 554')}${text(533, 97, '读取', 'v-small')}
      ${node('save', `${arrow('f02', 'M 665 292 V 350 H 400 V 292')}${text(550, 377, '结果先回主存', 'v-small')}${arrow('f02', 'M 300 350 H 52 V 292')}${text(218, 377, '按需保存', 'v-small')}`)}
      ${text(400, 416, '简化路径：省略缓存与设备控制器', 'v-tiny')}
    `, 440),
    steps: [
      { title: '长期保存', body: '程序和原始数据可保存在 SSD 等持久存储中；这与正在使用的主存是两类资源。', focus: ['disk'] },
      { title: '准备运行', body: '加载把需要的内容带到主存。主存承载运行中的程序和数据，不等于硬盘剩余空间。', focus: ['disk', 'ram'] },
      { title: '取得并计算', body: 'CPU 取得指令和操作数，借助寄存器完成运算；真实机器还有缓存等存储层次。', focus: ['ram', 'cpu'] },
      { title: '把结果保存', body: '结果可以回到主存，再写入持久存储。性能要检查整条路径，包括等待与数据搬运。', focus: ['save', 'ram', 'disk'] },
    ],
    analogy: { title: '工作台与仓库', body: '寄存器像手边材料，主存像周转区，持久存储像仓库；运算需要材料先到位。', limit: '数据可以复制，缓存还按硬件规则管理；这张图没有画出全部物理通路。' },
    misconception: { wrong: '硬盘空闲很多，运行内存一定够。', right: '两者承担不同任务。主存不足仍可能导致频繁搬移数据；只增加持久存储容量不能直接消除这种等待。' },
    check: { prompt: '串行流程为解码 20 ms、推理 80 ms、保存 20 ms。只把推理加速十倍，总耗时是多少？', options: [
      { text: '48 ms', correct: true, feedback: '推理变为 8 ms，加上不变的 20 + 20 ms，共 48 ms；假设没有新增开销。' },
      { text: '12 ms', correct: false, feedback: '只有推理部分加速十倍，解码与保存并没有一起加速。' },
      { text: '8 ms', correct: false, feedback: '8 ms 只是新的推理时间，还必须加上两段各 20 ms 的工作。' },
    ] },
    related: ['docs/chapters/01-computation.md', 'docs/chapters/05-operating-systems.md'],
  },
  {
    path: 'docs/chapters/03-programming.md',
    title: '函数返回了 True，告警就发出了吗？',
    intro: '判断函数可以只返回结果；发送告警是另一个动作，由调用者按契约决定。',
    diagramLabel: '左侧三个以秒计的参数进入中间判断函数，计算一百三十一减一百是否大于三十，返回 True；返回值再交给调用者，由调用者决定是否发送告警。',
    svg: picture('f03', '判断函数的输入、返回值与外部动作边界', `
      ${text(400, 43, '判断规则与发送动作分开')}
      ${node('inputs', `${cell(30, 96, 196, 198, 'v-blue')}${text(128, 132, '输入（单位：秒）')}${text(128, 179, 'last_seen = 100', 'v-mono')}${text(128, 220, 'now = 131', 'v-mono')}${text(128, 261, 'limit = 30', 'v-mono')}`)}
      ${node('rule', `<rect x="279" y="87" width="264" height="216" rx="16" class="v-dashed" fill="none"/>${text(411, 127, '函数边界')}${text(411, 170, 'is_stale(...)', 'v-mono')}${text(411, 217, '131 − 100 > 30', 'v-mono')}${text(411, 263, '只计算判断', 'v-small')}`)}
      ${arrow('f03', 'M 230 194 H 272')}
      ${node('result', `${cell(600, 132, 170, 105, 'v-green')}${text(685, 170, '返回值')}${text(685, 215, 'True', 'v-big')}`)}
      ${arrow('f03', 'M 547 194 H 593')}
      ${node('action', `${arrow('f03', 'M 685 243 V 341 H 549')}${cell(250, 321, 292, 74, 'v-orange')}${text(396, 352, '调用者决定发送告警')}${text(396, 381, '外部动作需另行执行', 'v-small')}`)}
    `),
    steps: [
      { title: '固定输入和单位', body: '把上次心跳、当前时间和阈值都传入函数，约定单位为秒，结果才容易独立预测。', focus: ['inputs'] },
      { title: '执行明确条件', body: '规则是 now − last_seen > limit。这里 31 大于 30；恰好 30 则返回 False。', focus: ['inputs', 'rule'] },
      { title: '读取返回值', body: 'True 只回答“是否过期”。这个函数没有发送告警，也没有修改数据库。', focus: ['rule', 'result'] },
      { title: '再决定外部动作', body: '调用者可按判断发送告警，另行处理权限、网络失败与重试；这些行为也需要契约。', focus: ['result', 'action'] },
    ],
    analogy: { title: '专业接口', body: '函数参数和结果像专业间约定的尺寸与条件；内部做法可以改变，接口仍须兑现。', limit: '机器不会补全含糊的口头约定；单位、边界值和失败方式需要写清。' },
    misconception: { wrong: '函数名写着告警规则，调用后就已发送告警。', right: '函数名不保证副作用。要看契约与实现：本例只返回布尔值，发送动作属于调用者的另一步操作。' },
    check: { prompt: '保持图中的规则，把 now 改成 130，函数会返回什么？', options: [
      { text: 'False', correct: true, feedback: '130 − 100 = 30，不满足“大于 30”；边界上的等号不能忽略。' },
      { text: 'True', correct: false, feedback: '本例使用 >，不是 ≥；恰好达到阈值还不算过期。' },
      { text: '自动发送告警', correct: false, feedback: '这个函数只计算并返回布尔值，发送行为不在函数中。' },
    ] },
    related: ['docs/chapters/01-computation.md', 'docs/chapters/06-networks.md'],
  },
  {
    path: 'docs/chapters/04-algorithms.md',
    title: '二分查找为什么敢排除一半？',
    intro: '有序数组让中间值两侧的大小关系可预测，因此可以排除不可能包含目标的一侧。',
    diagramLabel: '目标是二十一；有序数组为二、五、八、十三、二十一、三十四、五十五，下标零到六。先比较中间的十三，保留右侧三项；再比较三十四，保留左侧的二十一，最终找到下标四。',
    svg: picture('f04', '在有序数组中二分查找二十一', `
      ${text(400, 41, '目标：21；数组已按升序排列')}
      ${[2, 5, 8, 13, 21, 34, 55].map((value, i) => node(`a${i}`, `${text(108 + i * 96, 85, `下标 ${i}`, 'v-tiny')}${cell(64 + i * 96, 100, 88, 65, i === 3 ? 'v-orange' : 'v-box')}${text(108 + i * 96, 144, value, 'v-big')}`)).join('')}
      ${node('right-range', `<path d="M 448 180 V 194 H 728 V 180" class="v-line" fill="none"/>${text(588, 222, '21 > 13，保留右侧', 'v-small')}`)}
      ${node('discard', `<path d="M 64 180 V 194 H 440 V 180" class="v-dashed" fill="none"/>${text(252, 224, '这四项都不可能是 21', 'v-small')}`)}
      ${[21, 34, 55].map((value, i) => node(`b${i}`, `${cell(448 + i * 96, 248, 88, 65, i === 1 ? 'v-orange' : 'v-blue')}${text(492 + i * 96, 292, value, 'v-big')}`)).join('')}
      ${node('found', `${arrow('f04', 'M 492 318 V 346 H 406')}${cell(64, 327, 335, 75, 'v-green')}${text(232, 358, '21 = 21，找到下标 4')}${text(232, 387, '目标仍在保留范围内', 'v-small')}`)}
      ${text(600, 351, '21 小于中间值 34', 'v-small')}
      ${text(600, 381, '保留左侧的 21', 'v-small')}
    `),
    steps: [
      { title: '先确认有序', body: '数组按升序排列，且可有效访问中间位置。这些前提让二分排除成为可靠推理。', focus: ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6'] },
      { title: '比较中间值 13', body: '21 大于 13；13 及它左边的值都更小，所以只保留右边的 21、34、55。', focus: ['a3', 'right-range', 'discard'] },
      { title: '再比较中间值 34', body: '在剩余三项中，21 小于中间的 34，因此只保留其左边的 21。', focus: ['b0', 'b1', 'b2'] },
      { title: '缩到目标位置', body: '最后比较 21 与目标相等，得到原数组下标 4；每轮都保留可能包含目标的范围。', focus: ['b0', 'found'] },
    ],
    analogy: { title: '按号找图纸', body: '图纸先按编号排好，检查中间编号后，就能判断应继续翻前半还是后半。', limit: '先排序与维护顺序也有成本；若只查询一次，直接扫描可能更合算。' },
    misconception: { wrong: '任何清单都能直接二分查找。', right: '若清单无序，中间元素的大小无法约束两侧，排除一半可能扔掉目标。有序性是这里的正确性前提。' },
    check: { prompt: '在同一数组中查找 8，第一次与中间值 13 比较后，应保留哪些值？', options: [
      { text: '2、5、8', correct: true, feedback: '8 小于 13；有序性保证 13 及右侧更大的值都不是目标。' },
      { text: '21、34、55', correct: false, feedback: '这些值都大于 13，更不可能等于目标 8；应保留左侧。' },
      { text: '只保留 5', correct: false, feedback: '第一次比较只知道目标在左侧，不能据此只保留左侧的中间项。' },
    ] },
    related: ['docs/chapters/03-programming.md', 'docs/chapters/07-databases.md'],
  },
  {
    path: 'docs/chapters/05-operating-systems.md',
    title: '任务在等读取时，CPU 做什么？',
    intro: '等待 I/O 的任务可以阻塞，操作系统把 CPU 交给其他就绪任务；读取完成后仍要等待调度。',
    diagramLabel: '任务可处于就绪、运行或阻塞状态。调度使就绪任务进入运行，时间片结束使运行任务回到就绪，等待读取使任务阻塞，读取完成使阻塞任务回到就绪。下方单核时间线中 A、B、A、C 交替占用 CPU。',
    svg: picture('f05', '单核心上任务状态转换与交替执行', `
      ${text(400, 38, '同一任务的三种状态')}
      ${arrow('f05', 'M 400 137 V 88 H 145 V 137')}${text(272, 76, '时间片结束', 'v-small')}
      ${node('ready', `${cell(45, 143, 200, 110, 'v-blue')}${text(145, 182, '就绪')}${text(145, 221, '能运行，等轮到', 'v-small')}`)}
      ${node('running', `${cell(300, 143, 200, 110, 'v-green')}${text(400, 182, '运行')}${text(400, 221, '正在使用 CPU', 'v-small')}`)}
      ${node('blocked', `${cell(555, 143, 200, 110, 'v-orange')}${text(655, 182, '阻塞')}${text(655, 221, '等读取等事件', 'v-small')}`)}
      ${arrow('f05', 'M 248 199 H 293')}${text(272, 130, '调度', 'v-small')}
      ${arrow('f05', 'M 503 199 H 548')}${text(528, 130, '等待读取', 'v-small')}
      ${arrow('f05', 'M 655 258 V 285 H 145 V 258')}${text(400, 312, '读取完成 → 回到就绪', 'v-small')}
      ${node('timeline', `${text(65, 351, '单核', 'v-small')}${['A', 'B', 'A', 'C'].map((value, i) => `${cell(112 + i * 158, 326, 152, 48, i % 2 ? 'v-purple' : 'v-green')}${text(188 + i * 158, 358, value, 'v-label')}`).join('')}${arrow('f05', 'M 112 391 H 744')}${text(400, 418, '时间向右：交替推进，不是同时计算', 'v-small')}`)}
    `, 440),
    steps: [
      { title: '就绪不等于正在跑', body: '就绪任务已经具备运行条件，但还要被调度选中，才能在这个核心上执行。', focus: ['ready', 'running'] },
      { title: '等数据时让出核心', body: '发起需要等待的读取后，任务可能阻塞。调度器可让其他就绪任务使用 CPU。', focus: ['running', 'blocked'] },
      { title: '完成后先回就绪', body: '读取完成让等待者重新能运行，不代表它立即取得 CPU；仍须等待调度。', focus: ['blocked', 'ready'] },
      { title: '分清并发与并行', body: '时间线仅示意单核交替执行。切换需保存与恢复状态；创建更多线程不保证加速。', focus: ['timeline'] },
    ],
    analogy: { title: '共用一台设备', body: '就绪像准备好但排队，运行像正在使用设备，阻塞像还在等材料到齐。', limit: '真实调度策略会权衡响应、公平与吞吐；本图没有规定具体的排队策略。' },
    misconception: { wrong: '读取完成，任务就立刻继续计算。', right: '完成事件通常先让任务回到就绪状态。若核心正在执行其他任务，它仍要等调度；完成等待与获得 CPU 是两步。' },
    check: { prompt: '单核上 A 正在等磁盘，B 已就绪。下面哪种情况可能发生？', options: [
      { text: 'B 使用 CPU，A 保持阻塞', correct: true, feedback: '等待 I/O 不必占住核心；操作系统可让其他就绪任务推进。' },
      { text: 'A 必须一直占用 CPU 等磁盘', correct: false, feedback: '阻塞机制允许 A 等事件，让核心执行其他就绪任务。' },
      { text: 'A 和 B 在这个核心上同时计算', correct: false, feedback: '图中是单核心模型，任务可交替推进，不能据此称为同时计算。' },
    ] },
    related: ['docs/chapters/02-hardware.md', 'docs/chapters/06-networks.md'],
  },
  {
    path: 'docs/chapters/06-networks.md',
    title: '输入网址后，怎样拿到网页内容？',
    intro: '以访问虚构的 https://learn.example/rooms 为例：先找地址，再建立传输与加密保护，最后按 HTTP 交换请求和响应。',
    diagramLabel: '四个环节顺时针排列：DNS把learn.example解析为IP地址；TCP建立可靠有序的字节传输；TLS核对服务器身份并保护通信；HTTP用GET /rooms请求资源并读取状态码与内容。图示为新建HTTP/1.1或HTTP/2 HTTPS连接的概念流程。',
    svg: picture('f06', '访问一个HTTPS网址时的四种协议职责', `
      ${text(400, 35, 'learn.example/rooms', 'v-mono')}
      ${node('dns', `${cell(35, 65, 330, 132, 'v-blue')}${text(200, 101, '① DNS：查地址')}${text(200, 139, 'learn.example → IP 地址', 'v-small')}${text(200, 175, '不查 /rooms，也不下载网页', 'v-small')}`)}
      ${arrow('f06', 'M 375 131 H 425')}
      ${node('tcp', `${cell(435, 65, 330, 132, 'v-purple')}${text(600, 101, '② TCP：建立连接')}${text(600, 139, '按顺序交付字节', 'v-small')}${text(600, 175, '丢失可补传，不是独占专线', 'v-small')}`)}
      ${arrow('f06', 'M 600 207 V 242')}
      ${node('tls', `${cell(435, 252, 330, 132, 'v-green')}${text(600, 288, '③ TLS：保护通信')}${text(600, 326, '核对服务器身份', 'v-small')}${text(600, 362, '加密、防篡改', 'v-small')}`)}
      ${arrow('f06', 'M 425 318 H 375')}
      ${node('http', `${cell(35, 252, 330, 132, 'v-orange')}${text(200, 288, '④ HTTP：交换消息')}${text(200, 326, 'GET /rooms', 'v-mono')}${text(200, 362, '状态码＋响应内容', 'v-small')}`)}
      ${text(400, 423, '概念顺序：新建 HTTP/1.1 或 HTTP/2 的 HTTPS 连接', 'v-tiny')}
    `, 440),
    steps: [
      { title: 'DNS：先问服务器在哪里', body: 'DNS是域名查询规则。浏览器为learn.example查找IP地址；网址中的/rooms是资源路径，不交给DNS查。缓存命中时可复用已有结果。', focus: ['dns'] },
      { title: 'TCP：建立字节传输连接', body: 'TCP负责在这个连接内按顺序交付字节，并处理丢失后的补传。它像连续水流，不保留应用消息的边界，也不会为你独占一条线路。', focus: ['tcp'] },
      { title: 'TLS：给通信加保护', body: '这个示例在TCP之上核对服务器身份并建立加密保护。TLS保护传输内容，但不能证明网页内容真实，或替应用决定用户权限。', focus: ['tls'] },
      { title: 'HTTP：说清请求和响应', body: '浏览器按HTTP约定发出GET /rooms，服务器返回状态码和内容。HTTP解释消息的含义；真正的访问还可能复用连接，并继续请求图片等资源。', focus: ['http'] },
    ],
    analogy: { title: '查地址、运输、保护、读公文', body: 'DNS像查门牌；TCP像按序传递材料；TLS像核验收件方并保护运输；HTTP像约定申请单和回函的格式。', limit: '这不是四个物理关卡。缓存和连接复用会省去部分步骤；HTTP/3使用基于UDP的QUIC，不走这条TCP路径。' },
    misconception: { wrong: 'DNS查到了地址，就已经拿到网页；加密后内容也一定真实。', right: 'DNS负责找地址，HTTP负责请求与响应的含义，TLS保护通信。找到服务器、保护传输、验证业务内容，是不同任务。' },
    check: { prompt: '访问https://learn.example/rooms时，域名与资源路径分别由谁解释？', options: [
      { text: 'DNS查learn.example的地址，HTTP请求/rooms资源。', correct: true, feedback: '域名用来定位服务，路径用来标识服务里的资源；这正是两层不同的职责。' },
      { text: 'DNS直接查出/rooms的页面内容。', correct: false, feedback: 'DNS不负责下载页面。地址找到之后，还要按应用协议请求内容。' },
      { text: 'TCP负责解释/rooms是哪一间房。', correct: false, feedback: 'TCP交付字节，不理解房间或资源路径的业务含义。' },
    ] },
    related: ['docs/chapters/03-programming.md', 'docs/chapters/09-distributed-systems.md'],
  },
  {
    path: 'docs/chapters/07-databases.md',
    title: '第二次插入失败，第一次为什么也消失？',
    intro: '同一事务内的多步写入一起提交或回退；后一步触发失败并回滚时，前一步未提交的插入也会撤销。',
    diagramLabel: '单实体教学简表起初只有主键 e1、状态 low。一个事务先插入 e2、high，再尝试插入重复主键 e1、medium，触发异常并回滚。回滚后表内仍只有原来的 e1、low。',
    svg: picture('f07', '重复主键触发同一事务整体回滚', `
      ${text(400, 40, '同一事务：两步一起回退')}
      ${node('before', `${text(173, 75, '原表（已提交）')}${cell(35, 88, 276, 114, 'v-blue')}<path d="M 35 141 H 311 M 164 88 V 202" class="v-line" fill="none"/>${text(100, 123, 'id 主键')}${text(238, 123, 'state')}${text(100, 181, 'e1', 'v-mono')}${text(238, 181, 'low', 'v-mono')}`)}
      <rect x="374" y="87" width="394" height="188" rx="16" class="v-dashed" fill="none"/>
      ${text(571, 75, '一个事务内')}
      ${node('first', `${cell(393, 104, 355, 65, 'v-green')}${text(571, 132, '① 插入 e2 / high', 'v-label')}${text(571, 158, '暂未提交', 'v-small')}`)}
      ${node('second', `${cell(393, 185, 355, 73, 'v-orange')}${text(571, 216, '② 插入 e1 / medium', 'v-label')}${text(571, 245, '重复主键 → 异常', 'v-small')}`)}
      ${node('rollback', `${arrow('f07', 'M 571 282 V 348 H 323')}${text(674, 310, '回滚整个事务', 'v-small')}`)}
      ${node('after', `${text(173, 293, '回滚后')}${cell(35, 306, 276, 114, 'v-green')}<path d="M 35 359 H 311 M 164 306 V 420" class="v-line" fill="none"/>${text(100, 341, 'id 主键')}${text(238, 341, 'state')}${text(100, 399, 'e1', 'v-mono')}${text(238, 399, 'low', 'v-mono')}`)}
      ${text(561, 388, 'e2 也撤销；原记录保留', 'v-small')}
      ${text(400, 438, '为突出回滚，使用单实体判断的简化表', 'v-tiny')}
    `, 460),
    steps: [
      { title: '原记录先已提交', body: '原表已有 e1 / low。开始一个新事务后，第一步插入 e2 / high，但尚未提交。', focus: ['before', 'first'] },
      { title: '后一步违反主键', body: '第二步再插入 e1，违反主键唯一约束；本章示例捕获异常，并由事务上下文执行回滚。', focus: ['before', 'second'] },
      { title: '撤销整个新事务', body: '回滚撤销本次事务里的两步写入；e2 虽然先插入，也没有作为成功结果保留下来。', focus: ['first', 'second', 'rollback'] },
      { title: '核对最终表', body: '查询只剩原先已提交的 e1 / low。若 e2 在另一个事务中已提交，这次回滚不会撤销它。', focus: ['before', 'after'] },
    ],
    analogy: { title: '一组台账修改', body: '事务把约定范围内的多条数据库更新视为一组，检查未通过时退回这一组修改。', limit: '范围之外已发出的短信等外部动作，不会随数据库回滚自动撤回。' },
    misconception: { wrong: '事务成功提交，就证明记录符合现实。', right: '事务可维护已声明的约束与业务不变量，但错误的实体匹配也可能完整提交。数据真实性还要靠证据与业务校验。' },
    check: { prompt: '若先在独立事务中插入 e2 并提交，再在新事务中插入重复主键 e1，第二个事务回滚后还有什么？', options: [
      { text: 'e1 / low 和 e2 / high', correct: true, feedback: 'e2 已在先前事务提交；第二个事务的回滚只撤销其自身未提交的变化。' },
      { text: '只有 e1 / low', correct: false, feedback: '这只有在 e2 与失败插入属于同一未提交事务时才符合原例；题中 e2 已单独提交。' },
      { text: 'e1 / medium 和 e2 / high', correct: false, feedback: '插入重复主键失败，不会自动把原来的 e1 / low 改成 medium。' },
    ] },
    related: ['docs/chapters/04-algorithms.md', 'docs/chapters/09-distributed-systems.md'],
    lab: 'transaction',
  },
];
