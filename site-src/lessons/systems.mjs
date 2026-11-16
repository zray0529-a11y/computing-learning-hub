const svg = (id, label, body, height = 440) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${height}" role="img" aria-label="${label}"><title>${label}</title><defs><marker id="${id}-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="currentColor"/></marker></defs>${body}</svg>`;
const arrow = (id, d, dashed = false) => `<path d="${d}" class="${dashed ? 'v-dashed' : 'v-arrow'}" fill="none" marker-end="url(#${id}-arrow)"/>`;
const text = (x, y, value, cls = 'v-label', anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${value}</text>`;
const node = (key, body) => `<g data-node="${key}" class="v-node">${body}</g>`;
const box = (x, y, w, h, cls = 'v-box') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" class="${cls}"/>`;

export const lessons = [
  {
    path: 'docs/chapters/08-software-engineering.md',
    title: '改完代码，怎样知道可以发布？',
    intro: '先把需求写成可检查的规则，再追踪修改、验证结果和发布后的实际行为。',
    diagramLabel: '顺时针闭环：时间契约指导版本修改，边界测试检查修改，发布后观测再反馈需求；提交和发布是不同步骤。',
    svg: svg('s08', '从时间契约到修改、测试、发布与反馈的闭环', `
      ${node('s08-contract', `${box(50, 35, 290, 150, 'v-blue')}${text(195, 68, '① 写清时间契约')}<line x1="90" y1="112" x2="300" y2="112" class="v-line"/><circle cx="110" cy="112" r="7" class="v-orange"/><circle cx="150" cy="112" r="7" class="v-green"/><circle cx="260" cy="112" r="7" class="v-green"/><circle cx="300" cy="112" r="7" class="v-orange"/>${text(110, 143, '−1', 'v-mono')}${text(150, 143, '0', 'v-mono')}${text(260, 143, '600', 'v-mono')}${text(300, 143, '601', 'v-mono')}${text(195, 172, '示例：年龄 0–600 秒才有效', 'v-small')}`)}
      ${arrow('s08', 'M350 108 H435')}
      ${node('s08-revision', `${box(450, 35, 300, 150, 'v-purple')}${text(600, 68, '② 保存可追踪的修改')}${text(475, 108, '− age ≤ 600', 'v-mono', 'start')}${text(475, 142, '+ 0 ≤ age ≤ 600', 'v-mono', 'start')}${text(600, 172, '提交记录：修正未来时间', 'v-small')}`)}
      ${arrow('s08', 'M600 195 V245')}
      ${node('s08-tests', `${box(450, 260, 300, 145, 'v-green')}${text(600, 292, '③ 用输入检查实际行为')}${text(475, 328, '未来 −1秒 → 无效', 'v-small', 'start')}${text(475, 359, '边界 600秒 → 有效', 'v-small', 'start')}${text(475, 390, '过期 601秒 → 无效', 'v-small', 'start')}`)}
      ${arrow('s08', 'M440 332 H355')}
      ${node('s08-release', `${box(50, 260, 290, 145, 'v-orange')}${text(195, 292, '④ 发布并观察结果')}${box(75, 312, 95, 47)}${text(122, 343, 'v2', 'v-mono')}${arrow('s08', 'M180 335 H205')}${box(220, 312, 95, 47)}${text(267, 343, '环境', 'v-label')}${text(195, 390, '记录错误、延迟与恢复条件', 'v-small')}`)}
      ${arrow('s08', 'M195 248 V198')}${text(91, 224, '反馈', 'v-small')}${text(395, 215, '验证与版本各有用途', 'v-small')}
    `),
    steps: [
      { title: '把“最新”变成规则', body: '先约定缺失、未来时间和过期输入的行为；图中的600秒只是教学参数。', focus: ['s08-contract'] },
      { title: '修改留下原因', body: '增加年龄下界能挡住未来时间；提交记录保存这次变化，但不证明程序正确。', focus: ['s08-revision'] },
      { title: '检查能暴露错误的输入', body: '未来、边界和过期输入分别验证不同条件；还要按风险检查模块间的配合。', focus: ['s08-tests'] },
      { title: '到环境中继续核对', body: '发布要追踪代码、配置和数据版本；实际观测与恢复条件仍需检查。', focus: ['s08-release'] },
    ],
    analogy: { title: '像图纸变更与验收', body: '版本记录对应变更单，输入输出契约对应提资条件，测试对应针对条件的验收。', limit: '软件还会遇到并发、异常输入和环境组合；图纸看起来完整不能替代运行验证。' },
    misconception: { wrong: 'push成功，功能就验收通过了。', right: 'push只说明远端收到版本。还要检查具体行为、验证结果和实际部署状态；数据迁移也未必能随代码回退。' },
    check: {
      prompt: '旧实现只判断 age ≤ 600。哪个输入最直接暴露它遗漏的规则？',
      options: [
        { text: '观察时间比现在晚1秒。', correct: true, feedback: '此时age为−1，旧实现会误判有效，直接暴露缺少年龄下界的问题。' },
        { text: '观察发生在现在之前100秒。', correct: false, feedback: '100秒在有效范围内，新旧实现都会通过，无法暴露这次错误。' },
        { text: '再次push同一份代码。', correct: false, feedback: '版本传输没有检查时间判断的实际输出，不能替代失败输入。' },
      ],
    },
    related: ['docs/chapters/03-programming.md', 'docs/chapters/09-distributed-systems.md', 'docs/chapters/13-security-and-reliability.md'],
  },
  {
    path: 'docs/chapters/09-distributed-systems.md',
    title: '请求超时，为什么仍可能已经成功？',
    intro: '服务可能已保存结果，只是响应没有回来；重试需要识别同一业务操作，避免重复效果。',
    diagramLabel: '时间从上向下：客户端发送K1请求，服务保存工单7但响应丢失；客户端超时后重发K1，服务查到已有结果并返回工单7。',
    svg: svg('s09', '超时后的重试与稳定幂等键', `
      ${text(110, 40, '客户端')}${text(405, 40, '服务')}${text(675, 40, '结果存储')}
      <line x1="110" y1="60" x2="110" y2="405" class="v-dashed"/><line x1="405" y1="60" x2="405" y2="405" class="v-dashed"/><line x1="675" y1="60" x2="675" y2="405" class="v-dashed"/>
      ${node('s09-request', `${arrow('s09', 'M115 98 H395')}${text(255, 85, '创建工单，键 K1', 'v-small')}${arrow('s09', 'M410 148 H665')}${text(540, 135, '保存 K1 → 工单7', 'v-small')}${box(613, 160, 125, 42, 'v-green')}${text(675, 188, '已保存', 'v-small')}`)}
      ${node('s09-timeout', `${arrow('s09', 'M400 219 H220', true)}<path d="M190 207 L210 231 M210 207 L190 231" class="v-line" fill="none"/>${text(293, 206, '响应丢失', 'v-small')}${box(35, 237, 150, 42, 'v-orange')}${text(110, 265, '等待超时', 'v-small')}`)}
      ${node('s09-retry', `${arrow('s09', 'M115 306 H395')}${text(255, 293, '重试仍带 K1', 'v-small')}`)}
      ${node('s09-dedup', `${arrow('s09', 'M410 344 H665')}${text(540, 331, '按 K1 查已有结果', 'v-small')}${arrow('s09', 'M670 376 H415')}${arrow('s09', 'M400 405 H120')}${text(255, 392, '返回同一个工单7', 'v-small')}`)}
    `),
    steps: [
      { title: '服务可能已完成', body: '请求到达后，服务保存K1对应的工单7。这里业务效果已经发生。', focus: ['s09-request'] },
      { title: '超时只说明没等到响应', body: '客户端不知道是请求没到、执行失败，还是成功后的响应丢失；图中展示第三种。', focus: ['s09-timeout'] },
      { title: '重试保留业务身份', body: '同一次创建操作重试仍使用K1；换成新键可能被当成另一笔操作。', focus: ['s09-retry'] },
      { title: '查结果而非再创建', body: '接收方可靠保存键与结果，识别重复请求。具体持久化、并发和事务边界需另行设计。', focus: ['s09-dedup'] },
    ],
    analogy: { title: '邮件没回复，现场可能已做', body: '客户端像发交接邮件的人，服务像施工单位；未收到回信不能证明现场没有执行。', limit: '自动系统会高频重试、重复和乱序，需要可检查的身份与处理规则，不能只靠人工习惯。' },
    misconception: { wrong: '超时就说明失败，直接重新创建就行。', right: '超时不能区分结果。应查询业务状态或使用可靠的幂等机制；消息系统的功能也不自动覆盖任意外部动作。' },
    check: {
      prompt: '第一次创建已成功但响应丢失。重试换用新键K2，最需要警惕什么？',
      options: [
        { text: '服务可能把它当作另一笔创建，产生两张工单。', correct: true, feedback: '幂等键要稳定标识同一业务操作。换键使原来的去重记录无法直接匹配。' },
        { text: '换键会自动撤销第一次创建。', correct: false, feedback: '新键不具有撤销语义；第一次已保存的结果仍可能存在。' },
        { text: '只要用了队列，就能保证任意动作只发生一次。', correct: false, feedback: '队列的处理语义不能自动覆盖外部写库、发送通知等动作的事务边界。' },
      ],
    },
    related: ['docs/chapters/06-networks.md', 'docs/chapters/07-databases.md', 'docs/chapters/13-security-and-reliability.md'],
  },
  {
    path: 'docs/chapters/10-math-and-ml.md',
    title: '训练和使用模型，究竟改变了什么？',
    intro: '训练用样本误差调整参数；推理用已选定的参数计算新输入，评估则要保留独立数据。',
    diagramLabel: '上方训练、验证和测试集分工；中间训练样本经过w乘x得到误差，反馈更新w；下方新输入经过固定参数得到预测，不画参数更新回路。',
    svg: svg('s10', '数据切分、训练参数更新与推理计算', `
      ${node('s10-split', `${box(35, 25, 225, 88, 'v-blue')}${text(147, 57, '训练集')}${text(147, 91, '调整参数', 'v-small')}${box(288, 25, 225, 88, 'v-purple')}${text(400, 57, '验证集')}${text(400, 91, '选择模型与阈值', 'v-small')}${box(540, 25, 225, 88, 'v-orange')}${text(652, 57, '测试集')}${text(652, 91, '选择完成后评估', 'v-small')}`)}
      ${node('s10-train', `${arrow('s10', 'M147 119 V148')}${box(35, 160, 225, 85, 'v-blue')}${text(147, 192, '训练样本')}${text(147, 225, 'x = 2，y = 6', 'v-mono')}${arrow('s10', 'M270 202 H315')}${box(328, 160, 170, 85, 'v-purple')}${text(413, 192, '预测 w × x')}${text(413, 225, 'w = 1', 'v-mono')}`)}
      ${node('s10-update', `${arrow('s10', 'M508 202 H552')}${box(565, 160, 200, 85, 'v-orange')}${text(665, 192, '对比目标 y')}${text(665, 225, '损失 = 16', 'v-mono')}${arrow('s10', 'M665 252 V277 H413 V252')}${text(534, 306, '示例一步更新：w → 2.6', 'v-small')}`)}
      ${node('s10-infer', `${box(35, 335, 225, 78, 'v-green')}${text(147, 368, '新的输入')}${text(147, 398, '不拿目标值调参数', 'v-small')}${arrow('s10', 'M270 374 H315')}${box(328, 335, 170, 78, 'v-purple')}${text(413, 368, '固定参数')}${text(413, 398, '计算输出', 'v-small')}${arrow('s10', 'M508 374 H552')}${box(565, 335, 200, 78, 'v-green')}${text(665, 368, '预测结果')}${text(665, 398, '仍需独立评估', 'v-small')}`)}
    `),
    steps: [
      { title: '先分清数据职责', body: '训练集调参数，验证集选方案，测试集留到选择完成后评估；切分应匹配部署目标。', focus: ['s10-split'] },
      { title: '训练先计算误差', body: '示例用w×x预测。w为1、x为2时预测2，与目标6的平方误差为16。', focus: ['s10-train'] },
      { title: '利用梯度更新参数', body: '本例学习率0.1，一步把w改为2.6；单样本损失下降不证明新样本也有效。', focus: ['s10-update'] },
      { title: '推理使用已定参数', body: '新输入经过模型得到预测，通常不会因多问一次而更新权重；业务表现另行验证。', focus: ['s10-infer'] },
    ],
    analogy: { title: '练习题与独立考题', body: '训练像利用练习误差调整做法，验证像挑选方案，测试像用保留题目检查表现。', limit: '模型按统计目标调参数，并非以人的方式理解题意；相似题泄漏会让成绩虚高。' },
    misconception: { wrong: '训练分数很高，就能处理任何新场景。', right: '训练表现反映拟合情况。相机、时段或天气变化都可能影响泛化；近重复帧进入测试集还会让分数虚高。' },
    check: {
      prompt: '目标是推广到新相机。把同一相机同一时段的近重复帧随机拆进训练与测试，会有什么风险？',
      options: [
        { text: '测试过于相似，可能高估对新相机的表现。', correct: true, feedback: '测试应匹配未见相机这一目标；按相机分组比近重复帧混分更能检验这个问题。' },
        { text: '测试帧越相似，越能证明模型理解所有地点。', correct: false, feedback: '近重复样本缩小了评估覆盖，不能支持对新地点的泛化判断。' },
        { text: '只要训练损失下降，就不再需要测试。', correct: false, feedback: '训练损失与未见样本表现、漏报成本等是不同证据。' },
      ],
    },
    related: ['docs/chapters/04-algorithms.md', 'docs/chapters/11-llm-and-rag.md', 'docs/chapters/14-spatial-systems.md'],
  },
  {
    path: 'docs/chapters/11-llm-and-rag.md',
    title: '检索到相似文字，就能作为回答证据吗？',
    intro: '相似度只帮助找候选；还要核对对象、时间、权限和断言，再把有效材料交给模型。',
    diagramLabel: '问题与资料索引进入检索，候选中旧材料相似度更高但被过滤；有效证据进入模型上下文，再生成带出处回答，本次调用通常不改模型权重。',
    svg: svg('s11', 'RAG检索候选、过滤证据与生成回答', `
      ${node('s11-retrieve', `${box(35, 40, 200, 85, 'v-blue')}${text(135, 73, '问题')}${text(135, 107, '东门现在怎样？', 'v-small')}${arrow('s11', 'M245 82 H270')}${box(285, 40, 215, 155, 'v-purple')}${text(392, 73, '召回候选')}${text(392, 112, '0.98　旧资料', 'v-mono')}${text(392, 151, '0.91　当前记录', 'v-mono')}${text(392, 181, '相似 ≠ 可用', 'v-small')}<rect x="45" y="246" width="180" height="132" rx="12" class="v-box"/><rect x="35" y="235" width="180" height="132" rx="12" class="v-box"/>${text(125, 271, '资料与出处')}${text(125, 306, '切分、建立索引', 'v-small')}<line x1="60" y1="328" x2="185" y2="328" class="v-line"/><line x1="60" y1="347" x2="155" y2="347" class="v-line"/>${arrow('s11', 'M235 308 H258 V163 H275')}`)}
      ${arrow('s11', 'M510 115 H540')}
      ${node('s11-filter', `${box(550, 40, 215, 155, 'v-green')}${text(657, 73, '核对证据条件')}${text(657, 107, '对象／时间／权限', 'v-small')}${text(657, 144, '旧资料：排除', 'v-small')}${text(657, 178, '有效记录：保留', 'v-small')}`)}
      ${arrow('s11', 'M657 205 V245')}${text(713, 230, '放入上下文', 'v-small')}
      ${node('s11-generate', `${box(550, 260, 215, 140, 'v-purple')}${text(657, 295, '模型处理材料')}<circle cx="595" cy="330" r="10" class="v-blue"/><circle cx="657" cy="330" r="10" class="v-blue"/><circle cx="719" cy="330" r="10" class="v-blue"/><line x1="605" y1="330" x2="647" y2="330" class="v-line"/><line x1="667" y1="330" x2="709" y2="330" class="v-line"/>${text(657, 378, '通常不改模型权重', 'v-small')}`)}
      ${arrow('s11', 'M540 330 H510')}
      ${node('s11-answer', `${box(285, 260, 215, 140, 'v-orange')}${text(392, 295, '回答＋出处')}${text(392, 332, '断言逐条对证据', 'v-small')}${text(392, 369, '证据不足说未知', 'v-small')}`)}
    `),
    steps: [
      { title: '召回只是产生候选', body: '问题从索引找相关片段，片段保留出处；相似分数高不等于能支持当前问题。', focus: ['s11-retrieve'] },
      { title: '筛选适用材料', body: '检查是不是同一对象、同一时间和版本，并限制到用户可访问的资料范围。', focus: ['s11-filter'] },
      { title: '检索改变本次上下文', body: '有效材料放进本次调用。RAG通常不改模型权重，这与训练或微调不同。', focus: ['s11-generate'] },
      { title: '让断言找到证据', body: '引用应支持对应结论；没有当前证据时报告未知，不能把旧记录改写成实时事实。', focus: ['s11-answer'] },
    ],
    analogy: { title: '资料室与解释资料的人', body: '索引像资料室目录，检索找到相关页，模型用交来的材料组织回答。', limit: '目录可能找错、资料可能过期、解释可能越界；流畅表达不能替代来源核对。' },
    misconception: { wrong: '新文档进了知识库，模型就学进权重了。', right: '文档需要实际被读取或检索，才可能进入调用上下文。RAG通常改变可用材料，微调才调整模型参数。' },
    check: {
      prompt: '“昨天的东门设计说明”相似度0.98，“今天的东门观察”相似度0.91。用户问现在怎样，应怎么处理？',
      options: [
        { text: '核对观察的对象、时间、权限和内容，再判断能否支持回答。', correct: true, feedback: '相似度负责找候选。是否能回答当前状态，要检查证据适用性及它实际支持的断言。' },
        { text: '直接采用0.98那份，因为分数最高。', correct: false, feedback: '设计说明可能不提供当前观察；相似度高不能弥补时间和主题不匹配。' },
        { text: '两份都入库后，模型权重自然会更新。', correct: false, feedback: '入库和本次检索不等于训练；模型参数通常不会因此自动改变。' },
      ],
    },
    related: ['docs/chapters/07-databases.md', 'docs/chapters/10-math-and-ml.md', 'docs/chapters/13-security-and-reliability.md'],
    lab: 'retrieval',
  },
  {
    path: 'docs/chapters/12-agents.md',
    title: 'Agent提出动作后，谁来限制和验收？',
    intro: '模型可以选择下一步，但执行系统要检查权限与预算，并用实际观察决定继续还是停止。',
    diagramLabel: '任务与允许范围进入动作选择，动作经过执行权限检查才调用工具；工具观察回到选择环节，预算用尽或证据不足时停止并报告已知与阻碍。',
    svg: svg('s12', '受权限和预算约束的Agent行动反馈循环', `
      ${node('s12-task', `${box(35, 45, 215, 120, 'v-blue')}${text(142, 79, '任务与允许范围')}${text(142, 115, '可查哪些资料？', 'v-small')}${text(142, 148, '最多尝试几次？', 'v-small')}`)}
      ${arrow('s12', 'M260 105 H300')}
      ${node('s12-choice', `<polygon points="390,48 475,105 390,162 305,105" class="v-purple"/>${text(390, 99, '选择动作')}${text(390, 128, '依据当前证据', 'v-tiny')}`)}
      ${arrow('s12', 'M485 105 H535')}
      ${node('s12-action', `${box(550, 45, 215, 120, 'v-orange')}${text(657, 79, '执行系统检查')}${text(657, 115, '动作＋资源权限', 'v-small')}${text(657, 148, '参数与工具契约', 'v-small')}${arrow('s12', 'M657 175 V250')}${text(703, 217, '允许后执行', 'v-small')}${box(550, 265, 215, 100, 'v-green')}${text(657, 301, '工具实际执行')}${text(657, 340, '返回结果或错误', 'v-small')}`)}
      ${arrow('s12', 'M540 315 H515')}
      ${node('s12-feedback', `${box(300, 265, 205, 100, 'v-blue')}${text(402, 301, '校验并保存观察')}${text(402, 340, '证据是否支持目标', 'v-small')}${arrow('s12', 'M390 255 V172')}${text(427, 211, '未达上限', 'v-small')}${arrow('s12', 'M290 315 H260')}${box(35, 265, 215, 100, 'v-orange')}${text(142, 301, '停止并报告')}${text(142, 340, '已知／未知／阻碍', 'v-small')}${text(260, 247, '达到停止条件', 'v-small')}`)}
      ${text(400, 411, '提出动作 → 获准 → 执行 → 核实，四者要区分', 'v-small')}
    `),
    steps: [
      { title: '把允许范围写在前面', body: '目标、可访问资源和尝试上限先明确；稳定步骤也可以用固定工作流实现。', focus: ['s12-task'] },
      { title: '模型选择下一步', body: '证据不足时可以提出查询动作，但计划或动作提议还不是实际执行结果。', focus: ['s12-choice'] },
      { title: '权限在执行处生效', body: '执行系统校验动作、资源和参数；只在提示词里写“不要越权”不足以完成权限控制。', focus: ['s12-action'] },
      { title: '拿观察决定继续或停', body: '校验并保存结果；到达预算或终止条件就停止，缺证据时报告未知与阻碍。', focus: ['s12-feedback'] },
    ],
    analogy: { title: '分工与验收', body: '动作选择像提出下一项工作，工具像执行单元，反馈像带证据的交接与验收。', limit: 'Agent没有天然的专业资质；角色名称和长计划不能证明权限、执行或业务成功。' },
    misconception: { wrong: '工具显示成功，就能宣布目标完成。', right: '工具成功只描述一次调用结果。还要核对任务目标、实际状态、证据有效性和必要验证；计划不等于执行。' },
    check: {
      prompt: '最多查两次。两次返回都有state却没有evidence，应该怎样结束？',
      options: [
        { text: '停止，报告缺少可核实证据，状态保持未知。', correct: true, feedback: 'state字段本身不满足证据要求；预算已到，不能无限调用或把无证据的值当作已确认事实。' },
        { text: '采用第二次state，因为更新一次更可靠。', correct: false, feedback: '调用顺序不能替代来源证据，第二次同样没有满足证据契约。' },
        { text: '一直查到工具给出想要的答案。', correct: false, feedback: '这破坏了预算与终止条件，也不能保证后续返回的证据有效。' },
      ],
    },
    related: ['docs/chapters/08-software-engineering.md', 'docs/chapters/09-distributed-systems.md', 'docs/chapters/13-security-and-reliability.md'],
  },
  {
    path: 'docs/chapters/13-security-and-reliability.md',
    title: '文档说“删除资料”，系统就应该照做吗？',
    intro: '外部文字只能作为材料；可信身份、动作和资源权限必须由执行系统分别检查。',
    diagramLabel: '左侧外部文档和用户请求跨越信任边界进入服务端；文档只能形成待检查的动作提议，可信身份进入认证，再由授权检查动作和资源，允许后访问资源并记录审计。',
    svg: svg('s13', '外部材料、可信身份和服务端权限边界', `
      <rect x="285" y="20" width="495" height="390" rx="16" class="v-dashed" fill="none"/>${text(305, 44, '服务端执行边界', 'v-small', 'start')}
      ${node('s13-material', `${box(35, 65, 210, 120, 'v-orange')}${text(140, 99, '外部文档')}${text(140, 137, '“删除全部资料”', 'v-small')}${text(140, 169, '文字本身没有授权', 'v-small')}${arrow('s13', 'M250 125 H310')}${box(320, 65, 190, 120)}${text(415, 99, '读取材料')}${text(415, 137, '只形成动作提议', 'v-small')}${text(415, 169, '不能自行提权', 'v-small')}${arrow('s13', 'M415 195 V235 H525 V300 H540')}${text(433, 222, '提议仍需检查', 'v-small')}`)}
      ${node('s13-identity', `${box(35, 285, 210, 90, 'v-blue')}${text(140, 319, '用户请求')}${text(140, 354, '携带会话身份', 'v-small')}${arrow('s13', 'M250 330 H310')}${box(320, 285, 190, 90, 'v-blue')}${text(415, 319, '认证：你是谁')}${text(415, 354, '身份来源要可信', 'v-small')}`)}
      ${arrow('s13', 'M515 330 H540')}
      ${node('s13-policy', `${box(550, 285, 210, 90, 'v-purple')}${text(655, 319, '授权：可做什么')}${text(655, 354, '同时检查动作与资源', 'v-small')}${arrow('s13', 'M735 275 V195')}${text(706, 276, '允许', 'v-small')}`)}
      ${node('s13-resource', `${box(550, 65, 210, 120, 'v-green')}${text(655, 99, '受保护资源')}${text(655, 137, '只开放获准范围', 'v-small')}${text(655, 169, '拒绝越界读写', 'v-small')}${arrow('s13', 'M600 190 V200')}${box(550, 210, 170, 44)}${text(635, 238, '审计：谁做了什么', 'v-small')}`)}
    `),
    steps: [
      { title: '识别资料与授权的边界', body: '网页、文档和工具返回可提供事实，其中的命令不会自动变成用户授权。', focus: ['s13-material'] },
      { title: '认证建立可信身份', body: '不能相信调用者随意填的role字段；登录只解决“你是谁”，不解决所有权限。', focus: ['s13-identity'] },
      { title: '授权检查动作和对象', body: '既要检查允许读还是写，也要检查允许访问哪个实体；后端执行检查才有效。', focus: ['s13-policy'] },
      { title: '限制访问并留下必要证据', body: '按最小权限访问资源，审计记录身份、动作和结果；安全与数据新鲜度仍需分别验证。', focus: ['s13-resource'] },
    ],
    analogy: { title: '未经签认的变更便条', body: '外部文档像现场收到的便条，内容可以核查，但不能直接当作正式变更授权。', limit: '计算机会自动把文字接到工具动作，约束必须在执行链路生效，不能只靠阅读者警惕。' },
    misconception: { wrong: '用户登录了，文档要求的动作就都可以执行。', right: '认证不等于授权。每个动作和资源都要检查；外部材料也不能提供新权限，加密无法修复错误授权。' },
    check: {
      prompt: '某身份只允许read_state，资源只含gate-a。它请求读取private-gate，应怎么处理？',
      options: [
        { text: '拒绝，因为资源不在授权范围内。', correct: true, feedback: '动作允许和资源允许必须同时成立；会读状态不表示能读取所有对象。' },
        { text: '允许，因为read_state本来就是只读。', correct: false, feedback: '只读也可能泄露资料，资源范围仍必须检查。' },
        { text: '先把内容交给模型，再让它不要泄露。', correct: false, feedback: '检索应先限制到有权访问的材料；事后提示不能代替访问控制。' },
      ],
    },
    related: ['docs/chapters/06-networks.md', 'docs/chapters/11-llm-and-rag.md', 'docs/chapters/12-agents.md'],
  },
  {
    path: 'docs/chapters/14-spatial-systems.md',
    title: '三维模型里的门，为什么还不知道现在能否通行？',
    intro: '坐标描述位置，模型描述外观，稳定ID关联实体；当前状态还需要带时间和来源的有效观察。',
    diagramLabel: '左侧米制局部坐标中东门位于3、4，几何直线距离为5米；坐标连接到gate-east实体和门的外观，实体关联采集与入库时间不同的观察；最新观察过期后当前视图显示未知。',
    svg: svg('s14', '坐标、门的模型、实体身份与时效观察分别连接', `
      ${node('s14-coordinates', `${text(170, 42, '局部坐标／米')}<path d="M75 320 H290 M90 335 V65" class="v-line" fill="none"/><polygon points="290,320 280,315 280,325" fill="currentColor"/><polygon points="90,65 85,75 95,75" fill="currentColor"/>${text(296, 349, 'x', 'v-mono')}${text(70, 72, 'y', 'v-mono')}${text(70, 350, '0', 'v-mono')}<path d="M90 160 H210 V320" class="v-dashed" fill="none"/><path d="M90 320 L210 160" class="v-arrow" fill="none"/><circle cx="90" cy="320" r="6" class="v-blue"/><circle cx="210" cy="160" r="8" class="v-green"/>${text(233, 141, '东门 (3,4)', 'v-small')}${text(210, 348, '3', 'v-mono')}${text(67, 166, '4', 'v-mono')}${text(132, 232, '5米', 'v-small')}${text(170, 387, '直线近，不代表道路可达', 'v-small')}`)}
      ${arrow('s14', 'M225 160 H330 V154 H350')}
      ${node('s14-entity', `${box(360, 65, 185, 180, 'v-purple')}${text(452, 98, '实体 gate-east', 'v-small')}<path d="M415 198 V123 H490 V198 M427 198 V135 H478 V198" class="v-line" fill="none"/><circle cx="467" cy="168" r="3" fill="currentColor"/>${text(452, 229, '外观 ≠ 实时状态', 'v-small')}`)}
      ${arrow('s14', 'M550 150 H565')}
      ${node('s14-observation', `${box(575, 65, 190, 180, 'v-blue')}${text(670, 98, '同一实体的观察', 'v-small')}${text(670, 133, '采集 10:12', 'v-mono')}${text(670, 166, '入库 10:14', 'v-mono')}${text(670, 199, '状态：人少', 'v-small')}${text(670, 229, '来源／证据：demo', 'v-tiny')}`)}
      ${arrow('s14', 'M670 255 V280')}
      ${node('s14-current', `${box(360, 295, 405, 110, 'v-orange')}${text(562, 330, '现在 10:25：观察已过13分钟', 'v-small')}${text(562, 368, '示例有效期10分钟 → 未知')}${text(562, 394, '按采集时间判断，不靠外观猜测', 'v-tiny')}`)}
    `),
    steps: [
      { title: '坐标先声明参考系与单位', body: '图中采用局部米制坐标，(3,4)距原点5米；这只计算几何距离，不证明路可走。', focus: ['s14-coordinates'] },
      { title: '外观连接稳定实体身份', body: '门的模型表示外观，gate-east用于关联实体资料；逼真外观不会自动给出入口语义或通行状态。', focus: ['s14-entity'] },
      { title: '观察保留时间和出处', body: '同一实体可追加多次观察，采集时间与入库时间不同；来源和证据用于追溯。', focus: ['s14-observation'] },
      { title: '当前状态由规则计算', body: '示例按采集时间和10分钟有效期计算。最新观察也可能过期，此时显示未知。', focus: ['s14-current'] },
    ],
    analogy: { title: '总图、构件台账与巡检单', body: '坐标像总图定位，实体ID像构件编号，观察像带时间与出处的巡检单。', limit: '坐标转换、投影和传感器标定还有误差；旧巡检单与逼真模型都不能自动证明当前状态。' },
    misconception: { wrong: '三维场景很真实，就能直接导航和判断当前人流。', right: '外观、测量精度、入口语义、可通行拓扑与实时状态需要分别验证。生成补全也不能替代现场采集证据。' },
    check: {
      prompt: '东门直线距离5米，西门8米，但东门隔着围墙。只用坐标选东门，缺了什么？',
      options: [
        { text: '可通行道路拓扑、入口状态和路线代价。', correct: true, feedback: '直线距离没有表达围墙或通路。推荐可达路线还需要连接关系、开放状态与代价。' },
        { text: '更逼真的门材质，换材质就能确定可达。', correct: false, feedback: '渲染外观不提供道路连通或入口开放的证据。' },
        { text: '把坐标数字改得更精确，就不需要道路图。', correct: false, feedback: '位置精度不能替代拓扑：两点位置很准，也仍可能被围墙隔开。' },
      ],
    },
    related: ['docs/chapters/04-algorithms.md', 'docs/chapters/07-databases.md', 'docs/chapters/08-software-engineering.md'],
  },
];
