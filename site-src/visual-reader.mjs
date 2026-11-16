import {escapeHtml} from './core.mjs';
import {bitValue,transactionState,retrievalExample} from './visual-core.mjs';

const vEsc=escapeHtml;
const visualRoute=path=>'#doc='+encodeURIComponent(path);

export function scopedDiagram(svg,prefix) {
  return svg.replace(/\bid=(["'])([^"']+)\1/g,(_,quote,id)=>'id='+quote+prefix+'-'+id+quote)
    .replace(/url\(#([^)]+)\)/g,(_,id)=>'url(#'+prefix+'-'+id+')');
}

function visualLab(kind) {
  if(kind==='bits')return '<section class="mini-lab" id="visual-lab"><div class="visual-section-label">动手试一下 · 二进制</div><h2>拨动开关，数字会怎样变？</h2><p>亮起的位置计入总数；熄灭的位置贡献 0。</p><div class="bit-switches">'+[8,4,2,1].map((weight,index)=>'<button type="button" data-bit="'+index+'" aria-pressed="'+Boolean([0,1,0,1][index])+'" aria-label="位权 '+weight+'，当前 '+[0,1,0,1][index]+'"><span class="bit-weight">位权 '+weight+'</span><strong>'+[0,1,0,1][index]+'</strong><span class="bit-state">'+([0,1,0,1][index]?'计入':'不计入')+'</span></button>').join('')+'</div><div class="bit-equation" aria-live="polite"><span id="bit-equation">0 × 8 + 1 × 4 + 0 × 2 + 1 × 1</span><span>=</span><strong id="bit-value">5</strong></div><p class="lab-boundary">这里演示 4 位无符号整数，范围 0–15；文字、小数和负数需要另外约定编码。</p></section>';
  if(kind==='transaction')return '<section class="mini-lab" id="visual-lab"><div class="visual-section-label">动手试一下 · 事务</div><h2>第二步失败，第一步还算数吗？</h2><p>同一个事务新增两行，看看提交和回滚的区别。</p><div class="lab-options" role="group" aria-label="选择事务情境"><button type="button" data-transaction="failure" aria-pressed="true">制造主键冲突</button><button type="button" data-transaction="success" aria-pressed="false">两次写入都成功</button></div><div id="transaction-board"></div><div class="transaction-status" id="transaction-status" role="status" aria-live="polite"><strong></strong><span></span></div><div class="lab-controls"><button type="button" class="secondary-button" data-transaction-reset>重置</button><span id="transaction-progress"></span><button type="button" class="primary-button" data-transaction-next>下一步 →</button></div><p class="lab-boundary">简化状态演示，与本章 SQLite 实验对应；未连接真实数据库，也未模拟并发隔离。</p></section>';
  if(kind==='retrieval')return '<section class="mini-lab" id="visual-lab"><div class="visual-section-label">动手试一下 · 证据与回答</div><h2>把资料给它，回答应该发生什么变化？</h2><div class="sample-question">问题：样例展馆周二几点闭馆？</div><div class="lab-options" role="group" aria-label="是否提供检索资料"><button type="button" data-retrieval="no" aria-pressed="true">没有相关资料</button><button type="button" data-retrieval="yes" aria-pressed="false">提供相关资料</button></div><div id="retrieval-board" aria-live="polite"></div></section>';
  return '';
}

export function renderVisualLesson(doc,byPath) {
  const lesson=doc.visual;
  const related=lesson.related.map(path=>byPath.get(path)).filter(Boolean);
  return '<article class="visual-reader" id="visual-reader">'+
    '<header class="visual-heading"><div class="visual-section-label">'+vEsc(doc.number||'')+' / 图解 '+vEsc(doc.title)+'</div><h1>'+vEsc(lesson.title)+'</h1><p>'+vEsc(lesson.intro)+'</p></header>'+
    '<section class="explainer" id="visual-explainer" aria-label="图解与分步讲解"><div class="diagram-toolbar"><span><i class="legend-dot"></i>总览关系，再一步步看</span><button type="button" data-zoom-diagram aria-label="放大本章图解">↗ 放大图解</button></div><div class="diagram-viewport" id="diagram-surface" tabindex="0" aria-label="可横向查看的图解">'+scopedDiagram(lesson.svg,'main')+'</div><p class="diagram-pan-hint">图解可左右滑动，也可以点击“放大图解”。</p><div class="step-tabs" role="group" aria-label="选择图解步骤"><button type="button" data-visual-step="-1" aria-pressed="true">总览</button>'+lesson.steps.map((step,index)=>'<button type="button" data-visual-step="'+index+'" aria-pressed="false"><span>'+String(index+1).padStart(2,'0')+'</span>'+vEsc(step.title)+'</button>').join('')+'</div><div class="step-explanation" aria-live="polite"><div><span id="lesson-step-count">全图</span><h2 id="lesson-step-title">先看它们怎样联系</h2><p id="lesson-step-body">'+vEsc(lesson.diagramLabel)+'</p></div><div class="step-arrows"><button type="button" data-step-back disabled aria-label="上一步">←</button><button type="button" data-step-next aria-label="下一步">→</button></div></div></section>'+
    visualLab(lesson.lab)+
    (lesson.analogy?'<section class="analogy-panel"><div><span class="visual-section-label">换个熟悉的角度</span><h2>'+vEsc(lesson.analogy.title)+'</h2><p>'+vEsc(lesson.analogy.body)+'</p></div><div class="analogy-limit"><span>这个类比到哪里为止？</span><p>'+vEsc(lesson.analogy.limit)+'</p></div></section>':'')+
    '<section class="misconception-panel" id="visual-boundary"><h2>这里最容易想错</h2><div><span class="misconception-wrong">容易误解：'+vEsc(lesson.misconception.wrong)+'</span><p>'+vEsc(lesson.misconception.right)+'</p></div></section>'+
    '<section class="visual-check" id="visual-check"><div class="visual-section-label">先预测，再看解释</div><h2>'+vEsc(lesson.check.prompt)+'</h2><div class="check-options">'+lesson.check.options.map((option,index)=>'<button type="button" data-visual-answer="'+index+'" aria-pressed="false"><span class="option-letter">'+String.fromCharCode(65+index)+'</span><span>'+vEsc(option.text)+'</span></button>').join('')+'</div><div class="check-feedback" aria-live="polite" id="visual-feedback">选一个答案，看看自己是否理解了图中的关系。</div></section>'+
    '<section class="visual-next" id="visual-next"><div><span class="visual-section-label">继续连接知识</span><h2>把这张图，接到下一张</h2></div><div class="related-visuals">'+related.map(other=>'<a href="'+visualRoute(other.path)+'"><span>'+vEsc(other.title)+'</span><span aria-hidden="true">↗</span></a>').join('')+'</div><a class="full-text-link" href="'+visualRoute(doc.path)+'&view=full">深入完整教材：更多概念、代码实验与参考来源 →</a><p class="visual-source-note">图解提炼自本章公开教材，只展开一个核心机制。详细论述和参考资料在完整教材中。</p></section>'+
    '<dialog class="diagram-dialog" id="diagram-zoom" aria-label="放大图解"><div class="zoom-header"><strong>'+vEsc(doc.title)+'</strong><button type="button" data-close-zoom aria-label="关闭放大图解">✕</button></div><div class="zoom-canvas" tabindex="0">'+scopedDiagram(lesson.svg,'zoom')+'</div><p>'+vEsc(lesson.diagramLabel)+'</p></dialog></article>';
}

export function bindVisualReader(root,lesson) {
  let step=-1;
  const bits=[0,1,0,1];
  let transactionBranch='failure',transactionStep=0;
  function updateStep(next) {
    step=Math.max(-1,Math.min(lesson.steps.length-1,next));
    const item=lesson.steps[step];
    root.querySelectorAll('[data-visual-step]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.visualStep)===step)));
    root.querySelectorAll('#diagram-surface [data-node]').forEach(node=>{
      const focused=item?.focus.includes(node.dataset.node);
      node.classList.toggle('is-focus',Boolean(focused));
      node.classList.toggle('is-muted',Boolean(item&&!focused));
    });
    root.querySelector('#lesson-step-count').textContent=item?'步骤 '+(step+1)+' / '+lesson.steps.length:'全图';
    root.querySelector('#lesson-step-title').textContent=item?item.title:'先看它们怎样联系';
    root.querySelector('#lesson-step-body').textContent=item?item.body:lesson.diagramLabel;
    root.querySelector('[data-step-back]').disabled=step===-1;
    root.querySelector('[data-step-next]').disabled=step===lesson.steps.length-1;
  }
  function updateBits() {
    root.querySelectorAll('[data-bit]').forEach((button,index)=>{
      button.setAttribute('aria-pressed',String(Boolean(bits[index])));
      button.setAttribute('aria-label','位权 '+[8,4,2,1][index]+'，当前 '+bits[index]);
      button.querySelector('strong').textContent=bits[index];
      button.querySelector('.bit-state').textContent=bits[index]?'计入':'不计入';
    });
    root.querySelector('#bit-equation').textContent=bits.map((bit,index)=>bit+' × '+[8,4,2,1][index]).join(' + ');
    root.querySelector('#bit-value').textContent=bitValue(bits);
  }
  function rowTable(rows,empty) {
    return rows.length?'<table><thead><tr><th>id</th><th>state</th></tr></thead><tbody>'+rows.map(row=>'<tr><td>'+vEsc(row.id)+'</td><td>'+vEsc(row.state)+'</td></tr>').join('')+'</tbody></table>':'<div class="tx-empty">'+empty+'</div>';
  }
  function updateTransaction() {
    const example=transactionState(transactionBranch,transactionStep);
    root.querySelectorAll('[data-transaction]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.transaction===transactionBranch)));
    root.querySelector('#transaction-board').innerHTML='<div class="transaction-columns"><div class="tx-table"><h3>已提交的记录</h3>'+rowTable(example.committed,'暂无记录')+'</div><div class="tx-link" aria-hidden="true">'+(transactionStep===3?(transactionBranch==='success'?'←':'×'):'＋')+'</div><div class="tx-table tx-pending"><h3>本次准备新增</h3>'+rowTable(example.pending,transactionStep===3?'本次事务已结束':'等待第一步写入')+'</div></div>';
    const status=root.querySelector('#transaction-status');
    status.classList.toggle('has-error',example.error);
    status.querySelector('strong').textContent=example.status;
    status.querySelector('span').textContent=example.message;
    root.querySelector('#transaction-progress').textContent='步骤 '+transactionStep+' / 3';
    root.querySelector('[data-transaction-next]').disabled=transactionStep===3;
    root.querySelector('[data-transaction-next]').textContent=transactionStep===3?'演示完成':transactionStep===2?(transactionBranch==='success'?'提交 →':'回滚 →'):'下一步 →';
  }
  function updateRetrieval(enabled) {
    const example=retrievalExample(enabled);
    root.querySelectorAll('[data-retrieval]').forEach(button=>button.setAttribute('aria-pressed',String((button.dataset.retrieval==='yes')===enabled)));
    root.querySelector('#retrieval-board').innerHTML='<div class="retrieval-evidence"><span>交给模型的资料</span><p>'+vEsc(example.evidence[0]||'没有提供相关公告。')+'</p></div><div class="retrieval-answer"><span>有证据约束的回答示例</span><p>'+vEsc(example.answer)+'</p></div><p class="lab-boundary">'+vEsc(example.note)+'</p>';
  }
  if(lesson.lab==='transaction')updateTransaction();
  if(lesson.lab==='retrieval')updateRetrieval(false);
  const zoom=root.querySelector('#diagram-zoom');
  zoom.addEventListener('click',event=>{if(event.target===zoom){const bounds=zoom.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)zoom.close();}});
  root.addEventListener('click',event=>{
    const stepButton=event.target.closest('[data-visual-step]');if(stepButton)updateStep(Number(stepButton.dataset.visualStep));
    if(event.target.closest('[data-step-back]'))updateStep(step-1);
    if(event.target.closest('[data-step-next]'))updateStep(step+1);
    if(event.target.closest('[data-zoom-diagram]'))zoom.showModal();
    if(event.target.closest('[data-close-zoom]'))zoom.close();
    const bit=event.target.closest('[data-bit]');if(bit){const index=Number(bit.dataset.bit);bits[index]=1-bits[index];updateBits();}
    const transaction=event.target.closest('[data-transaction]');if(transaction){transactionBranch=transaction.dataset.transaction;transactionStep=0;updateTransaction();}
    if(event.target.closest('[data-transaction-next]')){transactionStep=Math.min(3,transactionStep+1);updateTransaction();}
    if(event.target.closest('[data-transaction-reset]')){transactionStep=0;updateTransaction();}
    const retrieval=event.target.closest('[data-retrieval]');if(retrieval)updateRetrieval(retrieval.dataset.retrieval==='yes');
    const answer=event.target.closest('[data-visual-answer]');
    if(answer){
      const index=Number(answer.dataset.visualAnswer),option=lesson.check.options[index];
      root.querySelectorAll('[data-visual-answer]').forEach(button=>{button.setAttribute('aria-pressed',String(button===answer));button.classList.remove('answer-correct','answer-retry');});
      answer.classList.add(option.correct?'answer-correct':'answer-retry');
      const feedback=root.querySelector('#visual-feedback');
      feedback.classList.toggle('correct',option.correct);feedback.classList.toggle('retry',!option.correct);
      feedback.textContent=(option.correct?'✓ 你抓住了关键。':'再想一步。')+' '+option.feedback;
    }
  });
}

export function renderVisualCard(doc,index) {
  return '<a class="visual-course-card" href="'+visualRoute(doc.path)+'"><div class="lesson-thumb" aria-hidden="true">'+scopedDiagram(doc.visual.svg,'thumb-'+index)+'</div><div class="visual-card-copy"><span>'+vEsc(doc.number)+' · '+vEsc(doc.title)+'</span><h3>'+vEsc(doc.visual.title)+'</h3><div class="visual-card-footer"><small>'+doc.visual.steps.length+' 步图解'+(doc.visual.lab?' · 可动手演示':'')+'</small><b aria-hidden="true">↗</b></div></div></a>';
}

export function renderKnowledgeAtlas(chapters,topics) {
  const groups=[
    {number:'01',title:'表示与计算',question:'信息怎样变成可处理的东西？',tone:'blue',items:chapters.slice(0,4)},
    {number:'02',title:'程序与系统',question:'一个操作，怎样被可靠地完成？',tone:'green',items:chapters.slice(4,9)},
    {number:'03',title:'数据与智能',question:'模型和智能体，分别做了什么？',tone:'purple',items:chapters.slice(9,14)},
    {number:'04',title:'空间与应用',question:'怎样把计算机方法用到空间里？',tone:'orange',items:topics}
  ];
  return '<section class="knowledge-atlas" id="knowledge-atlas" aria-labelledby="atlas-title"><div class="section-heading"><div><span class="visual-section-label">先找到你想弄懂的问题</span><h2 id="atlas-title">一张知识地图，四个入口</h2></div><span class="atlas-note">每个知识点都能点开看图</span></div><div class="atlas-lanes">'+groups.map(group=>'<div class="atlas-lane tone-'+group.tone+'"><header><span>'+group.number+'</span><h3>'+group.title+'</h3></header><p>'+group.question+'</p><div class="atlas-nodes">'+group.items.map(doc=>'<a href="'+visualRoute(doc.path)+'">'+vEsc(doc.title)+'<span aria-hidden="true">↗</span></a>').join('')+'</div></div>').join('')+'</div></section>';
}

export function bindHomeBinary(root) {
  if (!root) return;
  const bits=[0,1,0,1], weights=[8,4,2,1];
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-hero-bit]');
    if (!button || !root.contains(button)) return;
    const index=Number(button.dataset.heroBit);
    if (!Number.isInteger(index) || index<0 || index>3) return;
    bits[index]=1-bits[index];
    button.setAttribute('aria-pressed',String(Boolean(bits[index])));
    button.setAttribute('aria-label','位权 '+weights[index]+'，当前 '+bits[index]);
    button.querySelector('strong').textContent=bits[index];
    button.querySelector('span').textContent=bits[index]?'计入':'不计入';
    root.querySelector('[data-hero-flow="'+index+'"]').classList.toggle('svg-edge-flow',Boolean(bits[index]));
    const value=bitValue(bits);
    root.querySelector('#hero-bit-equation').textContent=bits.map((bit,i)=>bit*weights[i]).join(' + ')+' = '+value;
    root.querySelector('#hero-bit-caption').textContent=bits.join('')+' 表示 '+value+' · 4 位无符号整数：0–15';
  });
}

export function renderVisualHome(data,state) {
  const chapters=data.documents.filter(doc=>doc.group==='chapters'&&doc.number);
  const topics=data.documents.filter(doc=>doc.group==='architecture'&&doc.number);
  const resume=data.documents.find(doc=>doc.path===state.last);
  const picks=[chapters[0],chapters[6],chapters[10]];
  const heroDiagram='<div class="hero-binary" id="home-binary"><p class="hero-binary-intro">四个开关，16 种组合 · 点击 0 / 1 试试看</p><div class="hero-bit-grid" role="group" aria-label="四位二进制开关">'+[8,4,2,1].map((weight,index)=>{
    const on=index===1||index===3;
    return '<div class="hero-bit-column"><span class="hero-bit-weight">位权 '+weight+'</span><button class="hero-bit" type="button" data-hero-bit="'+index+'" aria-pressed="'+on+'" aria-label="位权 '+weight+'，当前 '+(on?1:0)+'"><strong>'+(on?1:0)+'</strong><span>'+(on?'计入':'不计入')+'</span></button></div>';
  }).join('')+'</div><svg class="hero-binary-lines" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="var(--v-line)" stroke-width="1.5">'+[50,150,250,350].map((x,index)=>'<path data-hero-flow="'+index+'" d="M'+x+' 0v22"'+(index===1||index===3?' class="svg-edge-flow"':'')+'/>').join('')+'<path d="M50 22h300M200 22v18" pathLength="1" class="svg-edge-draw"/></g></svg><output class="hero-binary-equation" id="hero-bit-equation" aria-live="polite" aria-atomic="true">0 + 4 + 0 + 1 = 5</output><span class="hero-visual-caption" id="hero-bit-caption">0101 表示 5 · 4 位无符号整数：0–15</span></div>';
  return '<div class="home-wrap visual-home"><section class="visual-home-hero"><div><div class="section-eyebrow"><span class="status-dot"></span> 计算机知识库 · 图解版</div><h1>先看懂一张图，<br>再弄懂一个<em>概念。</em></h1><p>跟着箭头看过程，拨动开关试结果。<br>从具体问题出发，一步步连接抽象知识。</p><div class="hero-buttons"><a class="primary-button" href="'+visualRoute(chapters[0].path)+'">从第一张图开始 <span aria-hidden="true">→</span></a><button type="button" class="text-link" data-jump-atlas>浏览知识地图 ↓</button></div></div><div class="hero-visual"><div class="hero-visual-top"><span>01 / 看得见的二进制</span><span>就在这里动手试 ↘</span></div>'+heroDiagram+'<a class="hero-chapter-link" href="'+visualRoute(chapters[0].path)+'">进入第 01 章，理解它为什么成立 →</a></div></section><div class="visual-home-strip"><span><strong>18</strong> 张机制图解</span><span><strong>3</strong> 个互动演示</span><span>分步看懂 · 即时自测</span><span>完整教材 · 支持离线</span></div>'+
    (resume?'<a class="visual-resume" href="'+visualRoute(resume.path)+'&resume=1"><span>接着上次的思路</span><strong>'+vEsc(resume.title)+'</strong><span>继续阅读 →</span></a>':'')+
    '<section class="atlas-home-entry" aria-labelledby="atlas-entry-title"><div><span class="visual-section-label">新 · 让知识之间的联系看得见</span><h2 id="atlas-entry-title">走进一个有来路的知识世界。</h2><p>39 个概念，68 条连接。用 Three.js 旋转观察，<br>看它们怎样协作，也看它们为什么逐渐出现。</p><div class="atlas-entry-links"><a href="#atlas">探索关系图谱 →</a><a href="#atlas&mode=scenario">跟着场景走一遍 →</a><a href="#atlas&mode=history">沿时间线回看 →</a></div></div><svg viewBox="0 0 250 155" role="img" aria-label="以连线连接芯片、数据、模型与建筑的知识地图入口示意"><g fill="none" stroke="#91b3a0" stroke-width="1.5"><path d="M45 105 100 45 170 50 212 106 145 125ZM100 45 145 125M45 105 170 50M170 50 145 125"/></g><g stroke-width="2"><rect x="28" y="88" width="34" height="29" rx="6" fill="#d8e9dc" stroke="#6d987d"/><path d="M34 96h22v13H34Z" fill="#78a88a"/><rect x="85" y="29" width="31" height="31" rx="6" fill="#e5e1f4" stroke="#9d8bb5"/><circle cx="169" cy="49" r="19" fill="#dae6f6" stroke="#7c9fc5"/><path d="M136 105h22v31h-22ZM195 89h27v32h-27Z" fill="#f2e7d2" stroke="#b6a271"/></g><g fill="#42604d" font-size="11" text-anchor="middle"><text x="45" y="136">计算</text><text x="99" y="19">智能</text><text x="169" y="20">系统</text><text x="211" y="141">空间</text></g></svg></section>'+
    renderKnowledgeAtlas(chapters,topics)+
    '<section aria-labelledby="start-visually"><div class="section-heading"><div><span class="visual-section-label">不用急着读完，从一个问题开始</span><h2 id="start-visually">这三个概念，可以亲手试出来</h2></div></div><div class="visual-card-grid">'+picks.map((doc,index)=>renderVisualCard(doc,'pick-'+index)).join('')+'</div></section>'+
    '<section aria-labelledby="space-visually"><div class="section-heading"><div><span class="visual-section-label">把计算机方法带回空间问题</span><h2 id="space-visually">从构件、网格与坐标，看建筑专题</h2></div></div><div class="visual-card-grid architecture-visual-grid">'+topics.map((doc,index)=>renderVisualCard(doc,'space-'+index)).join('')+'</div></section>'+
    '<section class="visual-study-footer"><div><span class="visual-section-label">看懂只是第一步</span><h2>说出来，做一次，过几天再想一遍。</h2><p>图解帮你建立关系；完整教材和实验帮你核对细节。</p></div><div><a href="'+visualRoute('docs/03-learning-method.md')+'">怎样真正学会 ↗</a><a href="'+visualRoute('docs/04-learning-plan.md')+'">12 周学习计划 ↗</a><a href="'+visualRoute('docs/practice/01-labs.md')+'">六个动手实验 ↗</a></div></section><p class="home-note">阅读位置、收藏和已读标记保存在当前浏览器，不跨设备同步。'+(location.protocol==='file:'?' 你正在使用离线文件。':'')+'</p></div>';
}
