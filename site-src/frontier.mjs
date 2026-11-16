import {escapeHtml} from './core.mjs';

const frontierEsc=escapeHtml;
const frontierStatuses=new Set(['released','preview','research','standard','experimental']);
const frontierChapter='#doc=docs%2F15-agent-frontier.md';
const frontierSteps=[
  {title:'明确目标',short:'先约定怎样算完成',body:'把愿望变成可以检查的结果。目标、允许操作的范围和停止条件要一起交代。',example:'教学例：让学习网页在手机上能翻卡阅读；按钮不挡正文，旧章节仍然能打开。'},
  {title:'规划与分工',short:'拆开能独立推进的工作',body:'主智能体维护任务关系，合适时把独立任务交给子智能体。存在依赖的步骤仍需按顺序完成。',example:'教学例：一个助手调整排版，另一个核对资料，最后把结果集成到同一网站。'},
  {title:'调用工具',short:'行动会产生可观察结果',body:'智能体通过文件、代码、搜索或界面工具采取行动，再读取工具返回。说“已经完成”本身不构成完成证据。',example:'教学例：修改网页后运行构建；命令报错就读取错误，不能把命令已发出当作已成功。'},
  {title:'验证与修正',short:'把产物对照验收标准',body:'检查真实产物、测试结果和来源。若不满足目标，回到合适步骤修正；需要人的判断时明确提出。',example:'教学例：自动测试通过之后，还要看看手机页面是否遮字、按钮能否点击。'},
  {title:'保存与交付',short:'留下状态，交付可查看的结果',body:'记录必要的进度与证据，方便后续继续。任务记录、检索记忆和模型权重是不同的东西。',example:'教学例：保存代码版本和部署链接，下次从这份记录继续，而非凭聊天印象重新猜。'}
];

export function validateFrontier(feed,known) {
  const fail=message=>{throw new Error('Frontier: '+message);};
  const day=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
  if(feed?.schemaVersion!==1||!day(feed.checkedAt)||!day(feed.updatedAt)||feed.updatedAt>feed.checkedAt||feed.checkedAt>new Date().toISOString().slice(0,10))fail('Invalid verification dates');
  if(!['manual','scheduled'].includes(feed.updatePolicy?.mode)||(feed.updatePolicy.mode==='scheduled'&&(typeof feed.updatePolicy.scheduleLabel!=='string'||!feed.updatePolicy.scheduleLabel.trim()||feed.updatePolicy.scheduleLabel.length>100)))fail('Invalid update policy');
  if(!Array.isArray(feed.entries)||!feed.entries.length||feed.entries.length>80)fail('Expected 1–80 update cards');
  const ids=new Set();
  for(const entry of feed.entries) {
    if(!/^[a-z][a-z0-9-]*$/.test(entry.id)||ids.has(entry.id))fail('Invalid or duplicate card ID');
    ids.add(entry.id);
    if(!day(entry.date)||entry.date>feed.checkedAt)fail('Card date exceeds verification date');
    if(!['公告','首次提交','生效','核验'].includes(entry.dateLabel)||!frontierStatuses.has(entry.status))fail('Unknown date or availability status');
    for(const key of ['vendor','statusLabel','title','summary','mechanism','example','boundary'])if(typeof entry[key]!=='string'||!entry[key].trim()||entry[key].length>1200)fail('Missing or oversized '+key);
    if(!Array.isArray(entry.sources)||!entry.sources.length)fail('Every claim needs its original source');
    for(const source of entry.sources) {
      let url;try{url=new URL(source.url);}catch{fail('Invalid source URL');}
      if(url.protocol!=='https:'||url.username||url.password||typeof source.label!=='string'||!source.label.trim())fail('Source must be a labeled public HTTPS URL');
    }
    if(!Array.isArray(entry.related)||entry.related.some(path=>!known.has(path)))fail('Unknown linked chapter');
  }
}

export function frontierEntries(feed,vendor='all') {
  return feed.entries.filter(entry=>vendor==='all'||entry.vendor===vendor).sort((a,b)=>Number(a.dateLabel==='核验')-Number(b.dateLabel==='核验')||b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}

export function frontierSelection(feed,params=new URLSearchParams()) {
  const requested=params.get('vendor');
  const vendor=feed.entries.some(entry=>entry.vendor===requested)?requested:'all';
  const entries=frontierEntries(feed,vendor);
  const id=entries.some(entry=>entry.id===params.get('entry'))?params.get('entry'):entries[0]?.id;
  return {vendor,id};
}

export function frontierFreshness(feed,today=new Date().toISOString().slice(0,10)) {
  const ageDays=Math.max(0,Math.floor((Date.parse(today)-Date.parse(feed.checkedAt))/86400000));
  return {ageDays,stale:ageDays>7};
}

function frontierCard(entry,byPath) {
  const related=entry.related.map(path=>byPath.get(path)).filter(Boolean);
  return '<article class="frontier-card" aria-labelledby="frontier-card-title"><div class="frontier-card-meta"><span>'+frontierEsc(entry.vendor)+'</span><time datetime="'+entry.date+'">'+entry.date+' · '+entry.dateLabel+'</time><span class="frontier-status status-'+entry.status+'">'+frontierEsc(entry.statusLabel)+'</span></div><h2 id="frontier-card-title" tabindex="-1">'+frontierEsc(entry.title)+'</h2><p class="frontier-summary">'+frontierEsc(entry.summary)+'</p><div class="frontier-example"><span>想具体一点 · 教学例</span><p>'+frontierEsc(entry.example)+'</p></div><p class="frontier-boundary"><strong>目前的边界</strong>'+frontierEsc(entry.boundary)+'</p><details class="frontier-evidence"><summary>展开机制与原始来源</summary><p>'+frontierEsc(entry.mechanism)+'</p><ul>'+entry.sources.map(source=>'<li><a href="'+frontierEsc(source.url)+'" target="_blank" rel="noopener noreferrer">'+frontierEsc(source.label)+' ↗</a></li>').join('')+'</ul>'+(related.length?'<div class="frontier-related"><span>连接已学知识</span>'+related.map(doc=>'<a href="#doc='+encodeURIComponent(doc.path)+'">'+frontierEsc(doc.title)+' →</a>').join('')+'</div>':'')+'</details></article>';
}

function frontierMechanism(index=0) {
  const step=frontierSteps[index];
  return '<div class="frontier-loop" role="group" aria-label="探索智能体工作过程">'+frontierSteps.map((item,i)=>'<button type="button" data-frontier-step="'+i+'" aria-pressed="'+(i===index)+'"><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+item.title+'</strong><small>'+item.short+'</small></button>').join('')+'</div><article class="frontier-mechanism-card" aria-live="polite"><span class="visual-section-label">'+(index+1)+' / '+frontierSteps.length+' · 教学归纳</span><h2>'+step.title+'</h2><p>'+step.body+'</p><div class="frontier-example"><span>贯穿同一个任务</span><p>'+step.example+'</p></div></article><p class="frontier-loop-note">检查不通过，就回到规划或执行；上下文、记忆与权限贯穿整个过程。这张图用于理解共同机制，不代表厂商未公开的内部架构。</p><a class="full-text-link" href="'+frontierChapter+'">读补充章：能力、边界与三个自测问题 →</a>';
}

export function renderFrontierPage(feed,byPath,params=new URLSearchParams()) {
  const selection=frontierSelection(feed,params),entries=frontierEntries(feed,selection.vendor);
  const index=entries.findIndex(entry=>entry.id===selection.id);
  const mechanism=params.get('view')==='mechanism';
  const freshness=frontierFreshness(feed);
  const policy=feed.updatePolicy.mode==='scheduled'?'已安排'+frontierEsc(feed.updatePolicy.scheduleLabel)+'核查，有新内容时发布。':'按已核验资料发布。';
  return '<div class="home-wrap frontier-page" id="frontier-page"><header class="frontier-heading"><span class="visual-section-label">知识库补充 · 持续跟进</span><h1>Agent 前沿，<em>一条条看懂。</em></h1><p>先看发生了什么，再理解它怎样工作。</p><div class="frontier-freshness'+(freshness.stale?' is-stale':'')+'"><span>资料核验至 <time datetime="'+feed.checkedAt+'">'+feed.checkedAt+'</time></span><button class="small-action" type="button" data-frontier-refresh>刷新已发布内容 ↻</button></div><p class="frontier-policy">'+policy+' 页面展示已发布的核验快照，非秒级新闻推送。'+(freshness.stale?' 最近记录已超过 7 天，当前状态请复核原始来源。':'')+'</p><p class="frontier-discovery"><a href="https://aihot.news/" target="_blank" rel="noopener noreferrer">AIHOT 消息线索 ↗</a><span>知识卡经官方原文核验后收录。</span></p></header><div class="frontier-tabs" role="group" aria-label="选择前沿阅读方式"><button type="button" data-frontier-tab="updates" aria-pressed="'+!mechanism+'">最新进展</button><button type="button" data-frontier-tab="mechanism" aria-pressed="'+mechanism+'">Agent 怎样工作</button><a href="'+frontierChapter+'">完整补充章 ↗</a></div><section class="frontier-panel" data-frontier-panel="updates"'+(mechanism?' hidden':'')+' aria-label="Agent 更新卡片"><div class="frontier-toolbar"><label>关注对象 <select id="frontier-vendor"><option value="all">全部</option>'+[...new Set(feed.entries.map(entry=>entry.vendor))].sort().map(vendor=>'<option value="'+frontierEsc(vendor)+'"'+(vendor===selection.vendor?' selected':'')+'>'+frontierEsc(vendor)+'</option>').join('')+'</select></label><span data-frontier-count role="status">第 '+(index+1)+' / '+entries.length+' 条</span></div><div id="frontier-card-slot">'+frontierCard(entries[index],byPath)+'</div><nav class="frontier-pagination" aria-label="翻阅前沿更新"><button type="button" class="secondary-button" data-frontier-prev'+(index===0?' disabled':'')+'>← 上一条</button><a href="'+frontierChapter+'">回到机制</a><button type="button" class="primary-button" data-frontier-next'+(index===entries.length-1?' disabled':'')+'>下一条 →</button></nav><details class="frontier-index"><summary>本期全部条目 · '+feed.entries.length+'</summary><p>按公告、变更生效或首次提交时间排列；仅有核验日期的能力放在后面。</p><div>'+frontierEntries(feed).map(entry=>'<button type="button" data-frontier-entry="'+entry.id+'"><span>'+entry.date+' · '+entry.dateLabel+'</span><strong>'+frontierEsc(entry.title)+'</strong><small>'+frontierEsc(entry.statusLabel)+'</small></button>').join('')+'</div></details></section><section class="frontier-panel" data-frontier-panel="mechanism"'+(!mechanism?' hidden':'')+' aria-label="智能体工作机制">'+frontierMechanism()+'</section></div>';
}

export function bindFrontierPage(root,feed,byPath,params=new URLSearchParams()) {
  const win=root.ownerDocument.defaultView;
  let {vendor,id}=frontierSelection(feed,params),view=params.get('view')==='mechanism'?'mechanism':'updates';
  function remember() {
    const query=new URLSearchParams();query.set('frontier','');
    if(vendor!=='all')query.set('vendor',vendor);
    if(id)query.set('entry',id);
    if(view==='mechanism')query.set('view',view);
    win.history.replaceState(null,'','#'+query.toString());
  }
  function paint(focus=false) {
    const entries=frontierEntries(feed,vendor);let index=entries.findIndex(entry=>entry.id===id);
    if(index<0)index=0;id=entries[index].id;
    root.querySelector('#frontier-card-slot').innerHTML=frontierCard(entries[index],byPath);
    root.querySelector('[data-frontier-count]').textContent='第 '+(index+1)+' / '+entries.length+' 条';
    root.querySelector('[data-frontier-prev]').disabled=index===0;
    root.querySelector('[data-frontier-next]').disabled=index===entries.length-1;
    root.querySelector('#frontier-vendor').value=vendor;
    remember();
    if(focus)root.querySelector('#frontier-card-title').focus({preventScroll:true});
    root.querySelector('.frontier-toolbar').scrollIntoView({block:'start',behavior:'instant'});
  }
  function switchView(next) {
    view=next;
    root.querySelectorAll('[data-frontier-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.frontierTab===view)));
    root.querySelectorAll('[data-frontier-panel]').forEach(panel=>{panel.hidden=panel.dataset.frontierPanel!==view;});
    remember();
  }
  function click(event) {
    if(event.target.closest('[data-frontier-refresh]')){win.location.reload();return;}
    const tab=event.target.closest('[data-frontier-tab]');if(tab){switchView(tab.dataset.frontierTab);return;}
    const item=event.target.closest('[data-frontier-entry]');if(item){vendor='all';id=item.dataset.frontierEntry;paint(true);return;}
    const previous=event.target.closest('[data-frontier-prev]'),next=event.target.closest('[data-frontier-next]');
    if(previous||next) {const entries=frontierEntries(feed,vendor),index=entries.findIndex(entry=>entry.id===id);id=entries[Math.max(0,Math.min(entries.length-1,index+(next?1:-1)))].id;paint();return;}
    const step=event.target.closest('[data-frontier-step]');if(step){const index=Number(step.dataset.frontierStep);root.querySelector('[data-frontier-panel="mechanism"]').innerHTML=frontierMechanism(index);root.querySelector('[data-frontier-step="'+index+'"]').focus({preventScroll:true});}
  }
  function change(event) {if(event.target.id==='frontier-vendor'){vendor=event.target.value;id=frontierEntries(feed,vendor)[0].id;paint();}}
  root.addEventListener('click',click);root.addEventListener('change',change);
  if(win.location.protocol==='file:'){const button=root.querySelector('[data-frontier-refresh]');button.disabled=true;button.textContent='当前为离线快照';}
  return ()=>{root.removeEventListener('click',click);root.removeEventListener('change',change);};
}
