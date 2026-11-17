// Original visual teaching examples; full-text chapters retain their source context.
export const lessons = [
  {
    path: 'architecture/01-bim-and-data.md',
    title: '两堵同名的墙，为什么不是一个对象？',
    intro: '几何描述墙的形状，标识区分对象，属性与显式关系说明它是什么、属于哪里。',
    diagramLabel: '两堵同名墙有不同标识；墙A的属性保存3000毫米，主要容纳关系指向一层；换算后墙长为3米。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440" role="img" aria-label="墙的几何、身份、属性与楼层关系分开表达">
      <title>同名墙仍有不同身份</title>
      <g data-node="bim-geometry" class="v-node">
        <text x="186" y="42" text-anchor="middle" class="v-label">形状帮助定位</text>
        <polygon points="45,246 239,246 302,205 108,205" class="v-box"/>
        <polygon points="64,222 144,222 144,115 64,115" class="v-blue"/>
        <polygon points="144,115 163,102 163,209 144,222" class="v-blue"/>
        <polygon points="64,115 83,102 163,102 144,115" class="v-blue"/>
        <polygon points="194,222 274,222 274,115 194,115" class="v-purple"/>
        <polygon points="274,115 293,102 293,209 274,222" class="v-purple"/>
        <polygon points="194,115 213,102 293,102 274,115" class="v-purple"/>
        <text x="104" y="153" text-anchor="middle" class="v-label">墙 A</text>
        <text x="234" y="153" text-anchor="middle" class="v-label">墙 B</text>
        <text x="170" y="281" text-anchor="middle" class="v-small">两件都可名叫“外墙”</text>
      </g>
      <g data-node="bim-identity" class="v-node">
        <rect x="337" y="64" width="422" height="78" rx="12" class="v-blue"/>
        <text x="358" y="94" text-anchor="start" class="v-label">对象标识分别保存</text>
        <text x="358" y="123" text-anchor="start" class="v-mono">wall-A ≠ wall-B</text>
        <path d="M293 122 L327 103" class="v-line" fill="none"/>
      </g>
      <g data-node="bim-properties" class="v-node">
        <rect x="337" y="160" width="422" height="112" rx="12" class="v-box"/>
        <text x="358" y="191" text-anchor="start" class="v-label">wall-A 的属性</text>
        <text x="358" y="223" text-anchor="start" class="v-mono">类型 IfcWall</text>
        <text x="358" y="253" text-anchor="start" class="v-mono">长度 3000 mm → 3 m</text>
      </g>
      <g data-node="bim-relation" class="v-node">
        <rect x="52" y="326" width="176" height="66" rx="12" class="v-blue"/>
        <text x="140" y="367" text-anchor="middle" class="v-mono">wall-A</text>
        <line x1="228" y1="359" x2="545" y2="359" class="v-line"/>
        <polygon points="545,359 531,351 531,367" fill="currentColor"/>
        <text x="388" y="336" text-anchor="middle" class="v-small">主要空间容纳</text>
        <rect x="554" y="326" width="205" height="66" rx="12" class="v-green"/>
        <text x="656" y="367" text-anchor="middle" class="v-label">一层 level-A</text>
        <text x="400" y="422" text-anchor="middle" class="v-small">关系靠标识连接，不能只凭几何相交猜测</text>
      </g>
    </svg>`,
    steps: [
      { title: '先分清两件墙', body: '墙A与墙B可以同名、同形；几何表达不替代对象身份。', focus: ['bim-geometry', 'bim-identity'] },
      { title: '属性带着单位', body: '3000毫米换成3米后才可与米制长度汇总；缺失值也不能当作零。', focus: ['bim-properties'] },
      { title: '用关系连到楼层', body: '主要容纳关系把标识连到楼层；跨层形状不等于有两个主要归属。', focus: ['bim-relation'] }
    ],
    analogy: { title: '像书名与馆藏号', body: '同名书可有多个馆藏号；墙名便于阅读，标识用于区分和关联。', limit: '跨文件追踪还须约定标识保留规则；有标识字段不保证版本间稳定。' },
    misconception: { wrong: '模型能打开，数据就满足任务。', right: '能显示几何只验证了一部分；还须检查对象身份、必填关系、单位、缺失值与来源。' },
    check: { prompt: '两份清单各有一条名为“外墙”的记录，怎样判断是否为同一构件？', options: [
      { text: '核对约定标识、来源和版本', correct: true, feedback: '名称可重复；约定的稳定标识结合来源与版本，才支持可靠关联。' },
      { text: '名称相同就直接合并', correct: false, feedback: '不同对象可以同名，按名称合并会丢失构件。' },
      { text: '长度相同就直接合并', correct: false, feedback: '长度是属性，不是身份；两堵独立的墙也可能等长。' }
    ] },
    related: ['docs/chapters/07-databases.md', 'architecture/02-parametric-design.md']
  },
  {
    path: 'architecture/02-parametric-design.md',
    title: '改窗宽后，一排窗怎样重新排布？',
    intro: '用参数计算几何起点，再按总跨度约束过滤候选，最后在允许的候选中按目标排序。',
    diagramLabel: '五个等宽窗沿12000毫米基线排列，宽2100毫米，间隙300毫米，两端各150毫米；六个等宽窗的候选越界。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440" role="img" aria-label="窗宽、间隔与数量共同决定一排窗的跨度">
      <title>一排窗的计算规则</title>
      <g data-node="param-input" class="v-node">
        <text x="40" y="40" text-anchor="start" class="v-label">教学参数（单位：毫米）</text>
        <text x="40" y="74" text-anchor="start" class="v-mono">n=5   w=2100   g=300   L=12000</text>
      </g>
      <g data-node="param-geometry" class="v-node">
        <rect x="49" y="103" width="702" height="155" rx="10" class="v-box"/>
        <rect x="58" y="121" width="123" height="116" class="v-blue"/>
        <path d="M119 121 V237 M58 179 H181" class="v-line" fill="none"/>
        <rect x="198" y="121" width="123" height="116" class="v-blue"/>
        <path d="M259 121 V237 M198 179 H321" class="v-line" fill="none"/>
        <rect x="338" y="121" width="123" height="116" class="v-blue"/>
        <path d="M399 121 V237 M338 179 H461" class="v-line" fill="none"/>
        <rect x="478" y="121" width="123" height="116" class="v-blue"/>
        <path d="M539 121 V237 M478 179 H601" class="v-line" fill="none"/>
        <rect x="618" y="121" width="123" height="116" class="v-blue"/>
        <path d="M679 121 V237 M618 179 H741" class="v-line" fill="none"/>
        <text x="120" y="162" text-anchor="middle" class="v-small">宽 w</text>
        <line x1="181" y1="110" x2="198" y2="110" class="v-line"/>
        <text x="191" y="98" text-anchor="middle" class="v-tiny">g</text>
        <path d="M58 265 V285 M58 277 H741 M741 265 V285" class="v-line" fill="none"/>
        <text x="400" y="307" text-anchor="middle" class="v-mono">跨度 = n×w + (n−1)×g = 11700</text>
      </g>
      <g data-node="param-constraint" class="v-node">
        <text x="42" y="342" text-anchor="start" class="v-label">约束：跨度 ≤ 12000</text>
        <rect x="42" y="358" width="66" height="32" class="v-orange"/>
        <rect x="120" y="358" width="66" height="32" class="v-orange"/>
        <rect x="198" y="358" width="66" height="32" class="v-orange"/>
        <rect x="276" y="358" width="66" height="32" class="v-orange"/>
        <rect x="354" y="358" width="66" height="32" class="v-orange"/>
        <rect x="432" y="358" width="66" height="32" class="v-orange"/>
        <line x1="428" y1="350" x2="428" y2="400" class="v-dashed"/>
        <text x="42" y="421" text-anchor="start" class="v-small">6个同宽窗：14100，越界</text>
      </g>
      <g data-node="param-objective" class="v-node">
        <rect x="529" y="327" width="226" height="95" rx="12" class="v-green"/>
        <text x="642" y="356" text-anchor="middle" class="v-label">允许后再排序</text>
        <text x="642" y="385" text-anchor="middle" class="v-small">余量300，两端各150</text>
        <text x="642" y="411" text-anchor="middle" class="v-tiny">仅比较给定候选</text>
      </g>
    </svg>`,
    steps: [
      { title: '让位置依赖参数', body: '第i个窗的起点为首端余量加i×(宽度＋间隔)，i从0开始。', focus: ['param-input', 'param-geometry'] },
      { title: '先判是否越界', body: '5个窗占11700毫米，6个同宽窗占14100毫米；后者被12000毫米边界过滤。', focus: ['param-constraint', 'param-geometry'] },
      { title: '再比较允许候选', body: '本例优先减少余量，再优先较少构件；最好只针对已枚举的候选集合。', focus: ['param-objective'] }
    ],
    analogy: { title: '像按配方批量制作', body: '参数像用量，计算规则像步骤；改输入后，依赖它的几何结果随之重算。', limit: '规则可重复不代表设计优秀；采光、结构等性能要另设指标并验证。' },
    misconception: { wrong: '参数化生成就会自动找到最优设计。', right: '生成、约束过滤和目标排序是不同步骤；有限候选中的最好结果不证明全局最优。' },
    check: { prompt: '有2个宽度、3个高度，若规定“全部组合”，会生成几组尺寸？', options: [
      { text: '6组', correct: true, feedback: '每个宽度分别搭配3个高度，共2×3＝6组。配对规则决定结果数量。' },
      { text: '2组', correct: false, feedback: '2组是逐项取可配对部分的结果；题目规定的是全部组合。' },
      { text: '5组', correct: false, feedback: '2＋3只数了输入项目；一组尺寸必须同时有一个宽度和一个高度。' }
    ] },
    related: ['docs/chapters/03-programming.md', 'docs/chapters/10-math-and-ml.md', 'architecture/03-gis-and-context.md']
  },
  {
    path: 'architecture/03-gis-and-context.md',
    title: '模型移到场地，为什么不能只改坐标标签？',
    intro: '先确定坐标基准、轴向和单位，再计算变换；改参考标识本身不会改变坐标数值。',
    diagramLabel: '左侧4米乘3米局部矩形经逆时针90度旋转和平移后成为蓝色模型图层；右图独立的虚构查询矩形为x在98到102米、y在201到203米，P为99、202位于内部，Q为103、203.5位于外部。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-label="局部矩形变换到统一坐标，再与查询区域比较">
      <title>先解释坐标，再变换和叠加</title>
      <g data-node="gis-local" class="v-node">
        <text x="178" y="39" text-anchor="middle" class="v-label">局部模型：先换单位</text>
        <path d="M77 237 V86 M77 237 H303" class="v-line" fill="none"/>
        <polygon points="77,80 71,93 83,93" fill="currentColor"/>
        <polygon points="309,237 296,231 296,243" fill="currentColor"/>
        <rect x="77" y="117" width="160" height="120" class="v-blue"/>
        <text x="157" y="170" text-anchor="middle" class="v-label">4 × 3 m</text>
        <text x="157" y="201" text-anchor="middle" class="v-small">边长已除以1000</text>
        <text x="57" y="85" text-anchor="middle" class="v-small">y</text>
        <text x="314" y="261" text-anchor="middle" class="v-small">x</text>
        <text x="77" y="265" text-anchor="middle" class="v-tiny">(0,0)</text>
      </g>
      <g data-node="gis-transform" class="v-node">
        <path d="M331 164 H421" class="v-line" fill="none"/>
        <polygon points="426,164 411,156 411,172" fill="currentColor"/>
        <text x="377" y="116" text-anchor="middle" class="v-small">旋转90°</text>
        <text x="377" y="143" text-anchor="middle" class="v-small">再平移</text>
        <text x="377" y="202" text-anchor="middle" class="v-mono">x′=100−y</text>
        <text x="377" y="231" text-anchor="middle" class="v-mono">y′=200+x</text>
      </g>
      <g data-node="gis-layers" class="v-node">
        <text x="620" y="39" text-anchor="middle" class="v-label">统一局部目标坐标</text>
        <path d="M465 286 V72 M465 286 H759" class="v-line" fill="none"/>
        <text x="449" y="79" text-anchor="middle" class="v-small">y</text>
        <text x="763" y="309" text-anchor="middle" class="v-small">x</text>
        <rect x="520" y="97" width="114" height="152" class="v-blue"/>
        <circle cx="634" cy="249" r="5" fill="currentColor"/>
        <text x="636" y="275" text-anchor="middle" class="v-tiny">(100,200) m</text>
        <text x="577" y="89" text-anchor="middle" class="v-tiny">模型图层</text>
      </g>
      <g data-node="gis-query" class="v-node">
        <rect x="558" y="135" width="152" height="76" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="7 5"/>
        <circle cx="596" cy="173" r="8" class="v-green"/>
        <text x="610" y="180" text-anchor="start" class="v-label">P</text>
        <circle cx="748" cy="116" r="8" class="v-orange"/>
        <text x="762" y="123" text-anchor="start" class="v-label">Q</text>
        <text x="670" y="200" text-anchor="middle" class="v-tiny">查询区</text>
        <text x="620" y="337" text-anchor="middle" class="v-small">按区域查点：P在内，Q在外</text>
      </g>
      <text x="40" y="371" text-anchor="start" class="v-label">核对变换：面积仍为12 m²，对角线仍为5 m</text>
      <text x="40" y="406" text-anchor="start" class="v-small">这是局部刚体变换示意，不是地理投影转换</text>
      <text x="40" y="433" text-anchor="start" class="v-small">图层先统一坐标含义，再检查空间关系；高程另行核对</text>
    </svg>`,
    steps: [
      { title: '数值必须有解释', body: '先说明原点、轴向和单位；4000毫米应换算成4米，不能只改单位标签。', focus: ['gis-local'] },
      { title: '变换重新算坐标', body: '先换成米，再旋转90°并平移；这次局部刚体变换保留长度与面积。', focus: ['gis-transform', 'gis-layers'] },
      { title: '统一后再叠加查询', body: '查询矩形x为98到102米、y为201到203米。P=(99,202)在内部，Q=(103,203.5)在外；边界点是否算入，另需约定规则。', focus: ['gis-layers', 'gis-query'] },
      { title: '检查不止一个角点', body: '用多个控制点核对方向、距离和位置；平面重合还不能证明高程正确。', focus: ['gis-local', 'gis-layers'] }
    ],
    analogy: { title: '像把两张透明图叠在一起', body: '先对齐比例、方向和基准，再比较图上的对象；图层对应不同来源的空间数据。', limit: '地理参考系统还涉及投影、轴顺序与高程；屏幕上拖到重合不能替代变换定义。' },
    misconception: { wrong: '给图层设目标参考标识，就完成了转换。', right: '设置参考标识只补充坐标的解释；坐标转换须依据正确的源、目标定义重新计算数值。' },
    check: { prompt: '4000×3000毫米的矩形，只把单位标签改成米，面积数值会怎样？', options: [
      { text: '仍是12000000，解释却错了', correct: true, feedback: '坐标数值没有缩小，平面面积计算数值也不变；正确米制面积应为12平方米。' },
      { text: '自动变成12平方米', correct: false, feedback: '标签不会计算换算；必须把两个坐标方向的毫米数值都除以1000。' },
      { text: '变成12000平方米', correct: false, feedback: '面积涉及两个长度方向；正确换算因子是1000²，不是1000。' }
    ] },
    related: ['docs/chapters/14-spatial-systems.md', 'docs/chapters/10-math-and-ml.md', 'architecture/04-digital-twins.md']
  },
  {
    path: 'architecture/04-digital-twins.md',
    title: '最后收到的读数，就是房间最新状态吗？',
    intro: '将房间映射到测点，按事件标识去重并按观测时间选值，再显示时间、单位与时效状态。',
    diagramLabel: '虚构房间A映射到测点A；到达顺序为9点3分事件、9点1分旧事件、重复事件，旧值和重复值不覆盖当前23摄氏度；9点5分时观测年龄2分钟。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-label="空间对象连接测点，再从乱序事件中选择最近观测">
      <title>静态形体需要连接有时间的观测</title>
      <g data-node="twin-object" class="v-node">
        <text x="142" y="40" text-anchor="middle" class="v-label">空间对象</text>
        <polygon points="38,157 164,157 236,110 110,110" class="v-box"/>
        <polygon points="38,157 164,157 164,263 38,263" class="v-blue"/>
        <polygon points="164,157 236,110 236,216 164,263" class="v-blue"/>
        <path d="M72 263 V204 H111 V263" class="v-line" fill="none"/>
        <text x="99" y="185" text-anchor="middle" class="v-label">房间 A</text>
        <text x="142" y="299" text-anchor="middle" class="v-small">形体本身没有读数时间</text>
      </g>
      <g data-node="twin-mapping" class="v-node">
        <line x1="241" y1="191" x2="332" y2="191" class="v-line"/>
        <polygon points="335,191 321,183 321,199" fill="currentColor"/>
        <text x="286" y="172" text-anchor="middle" class="v-tiny">关联测点</text>
        <rect x="342" y="131" width="179" height="116" rx="12" class="v-purple"/>
        <text x="431" y="166" text-anchor="middle" class="v-label">测点 A</text>
        <text x="431" y="198" text-anchor="middle" class="v-small">温度序列</text>
        <text x="431" y="228" text-anchor="middle" class="v-tiny">显式标识映射</text>
      </g>
      <g data-node="twin-events" class="v-node">
        <text x="650" y="40" text-anchor="middle" class="v-label">按到达顺序排队</text>
        <rect x="554" y="62" width="216" height="63" rx="10" class="v-green"/>
        <text x="662" y="88" text-anchor="middle" class="v-mono">e3 09:03 23°C</text>
        <text x="662" y="113" text-anchor="middle" class="v-tiny">当前最近观测</text>
        <line x1="662" y1="125" x2="662" y2="142" class="v-line"/>
        <rect x="554" y="145" width="216" height="63" rx="10" class="v-orange"/>
        <text x="662" y="171" text-anchor="middle" class="v-mono">e2 09:01 22°C</text>
        <text x="662" y="196" text-anchor="middle" class="v-tiny">晚到的旧观测</text>
        <line x1="662" y1="208" x2="662" y2="225" class="v-line"/>
        <rect x="554" y="228" width="216" height="63" rx="10" class="v-box"/>
        <text x="662" y="254" text-anchor="middle" class="v-mono">e3 09:03 23°C</text>
        <text x="662" y="279" text-anchor="middle" class="v-tiny">同事件重传：去重</text>
      </g>
      <g data-node="twin-state" class="v-node">
        <rect x="38" y="331" width="732" height="95" rx="12" class="v-green"/>
        <text x="60" y="365" text-anchor="start" class="v-label">09:05查看：房间 A 显示23°C</text>
        <text x="60" y="397" text-anchor="start" class="v-small">观测09:03 · 年龄2分钟 · 演示阈值4分钟 → 新鲜</text>
        <text x="651" y="365" text-anchor="middle" class="v-small">保留来源与质量</text>
        <text x="651" y="397" text-anchor="middle" class="v-tiny">新鲜不保证准确</text>
      </g>
    </svg>`,
    steps: [
      { title: '从房间找到测点', body: '形体用于定位，显式关系指向温度测点，再由测点找到对应的时序记录。', focus: ['twin-object', 'twin-mapping'] },
      { title: '区分两种时间', body: 'e2虽然晚到，观测时间却早于e3；不能按到达顺序直接覆盖当前值。', focus: ['twin-events'] },
      { title: '重传不算新观测', body: '相同事件标识且载荷一致的e3只处理一次；旧观测仍可用于历史分析。', focus: ['twin-events'] },
      { title: '状态带着时间解释', body: '09:05时观测年龄2分钟，在演示阈值内；过期、无数据和无效应分别显示。', focus: ['twin-state'] }
    ],
    analogy: { title: '像有拍摄时间的照片', body: '最后传来的照片不一定拍得最晚；消息到达时间与观测发生时间也不同。', limit: '系统还须处理重复事件、时钟可信度、相同时间冲突和观测质量。' },
    misconception: { wrong: '给三维模型加上跳动数字，就是可信状态。', right: '每个显示值应可追溯到对象、测点、单位、观测时间与质量；新鲜也不保证测量准确。' },
    check: { prompt: '当前显示09:03的23°C，随后收到09:01的22°C，应怎样处理？', options: [
      { text: '当前仍显示23°C，旧记录可留作历史', correct: true, feedback: '按观测时间选最近值，迟到旧观测不覆盖当前状态，但仍可能有历史价值。' },
      { text: '立即显示22°C，因为它最后到达', correct: false, feedback: '到达晚可能由网络延迟造成，并不代表观测发生得更晚。' },
      { text: '取平均值22.5°C作为最新温度', correct: false, feedback: '平均值是另一个计算结果，不能冒充最近一次实际观测。' }
    ] },
    related: ['docs/chapters/09-distributed-systems.md', 'docs/chapters/14-spatial-systems.md', 'architecture/01-bim-and-data.md']
  }
];
