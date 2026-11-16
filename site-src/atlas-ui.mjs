import {escapeHtml} from './core.mjs';
import {atlasRelationLabels,atlasFilteredNodes,atlasReadState,atlasViewModel} from './atlas-core.mjs';
import {createAtlasScene} from './atlas-scene.mjs';

const aEsc=escapeHtml;
const aDocLink=(path,view='visual')=>'#doc='+encodeURIComponent(path)+'&view='+view;

export function renderAtlasPage(atlas) {
 return '<div class="atlas-page" id="atlas-explorer"><header class="atlas-hero"><div><span class="section-eyebrow"><span class="status-dot"></span> THREE.JS · 知识之间的连接</span><h1>知识之间，<em>原来这样相连。</em></h1><p>看关系，跟着一个场景走一遍，再回到它的发展来路。<br>点一个模型，从“知道名词”走向“理解它为什么有用”。</p></div><div class="atlas-hero-count"><strong>'+atlas.nodes.length+'</strong><span>个概念 · '+atlas.edges.length+' 条连接<br>连接全部 18 个图解章节</span></div></header>'+
 '<nav class="atlas-mode-nav" aria-label="知识地图的三个视角"><button type="button" data-atlas-mode="graph" data-focus-key="mode-graph" aria-pressed="true"><span>01</span><strong>关系图谱</strong><small>它和谁有关？</small></button><button type="button" data-atlas-mode="scenario" data-focus-key="mode-scenario" aria-pressed="false"><span>02</span><strong>协作场景</strong><small>它们怎样一起做事？</small></button><button type="button" data-atlas-mode="history" data-focus-key="mode-history" aria-pressed="false"><span>03</span><strong>历史沿革</strong><small>它为何逐渐出现？</small></button></nav>'+
 '<div class="atlas-explore-tools"><label class="atlas-query-field" data-atlas-graph-tool><span>找一个概念</span><input type="search" id="atlas-query" placeholder="例如：RAG、数据库、坐标" autocomplete="off"></label><label data-atlas-graph-tool><span>知识分区</span><select id="atlas-category"><option value="all">全部分区</option>'+atlas.categories.map(c=>'<option value="'+aEsc(c.id)+'">'+aEsc(c.label)+'</option>').join('')+'</select></label><label class="atlas-select-field"><span>直接选择知识点</span><select id="atlas-node-select"></select></label></div>'+
 '<section class="atlas-context" id="atlas-context" aria-label="当前探索方式"></section>'+
 '<div class="atlas-view-grid"><div class="atlas-main-view"><section class="atlas-scene-card" aria-label="可交互知识地图"><div class="atlas-scene-heading"><div><span class="atlas-live-dot" aria-hidden="true"></span><strong id="atlas-scene-title">关系图谱</strong><span id="atlas-scene-meta"></span></div><div class="atlas-camera-tools"><button type="button" data-atlas-camera="in" aria-label="放大三维视图" title="放大">＋</button><button type="button" data-atlas-camera="out" aria-label="缩小三维视图" title="缩小">−</button><button type="button" data-atlas-camera="reset">复位</button><button type="button" id="atlas-view-toggle" data-focus-key="view-toggle" aria-pressed="false">列表视图</button></div></div><p class="atlas-fallback-note" id="atlas-fallback-note" role="status" hidden></p><div class="atlas-stage" id="atlas-stage" aria-label="拖动旋转、滚轮缩放，点击模型查看知识点"></div><div class="atlas-flat" id="atlas-flat" hidden></div><div class="atlas-scene-footer"><span id="atlas-interaction-help">拖动旋转 · 滚轮缩放 · 点击模型看关联</span><span>模型是辨认线索，位置不代表难度</span></div></section><section class="atlas-story-card" id="atlas-story" aria-live="polite"></section></div><aside class="atlas-detail" id="atlas-detail" aria-label="知识点与关系说明"></aside></div>'+
 '<section class="atlas-reading-guide"><div><span class="visual-section-label">读图的三个约定</span><h2>看清一条线，比记住一个名词更有用。</h2></div><div><p><b>箭头要连着解释看。</b>“理解基础”从基础指向后续概念；“用到”从使用者指向所用机制；“共同协作”不表示先后。</p><p><b>模型是类比。</b>数据库画成资料柜、模型画成网络，只帮助辨认；准确机制与适用边界写在说明里。</p><p><b>时间早晚不等于学习先后。</b>时间线选取代表性论文或事件，附原始资料；它不是完整技术史，也不是所有发明的唯一日期。</p></div></section><p class="atlas-announcement visually-hidden" id="atlas-announcement" role="status" aria-live="polite"></p></div>';
}

export function bindAtlasPage(root,atlas,byPath,params) {
 const state=atlasReadState(params,atlas);
 const nodes=new Map(atlas.nodes.map(n=>[n.id,n]));
 const categories=new Map(atlas.categories.map(c=>[c.id,c]));
 const stage=root.querySelector('#atlas-stage'),detail=root.querySelector('#atlas-detail'),context=root.querySelector('#atlas-context'),story=root.querySelector('#atlas-story'),flat=root.querySelector('#atlas-flat');
 const query=root.querySelector('#atlas-query'),category=root.querySelector('#atlas-category'),select=root.querySelector('#atlas-node-select'),announcement=root.querySelector('#atlas-announcement');
 let scene=null,disposed=false,errorMessage='',lastAnnouncement='',paintedSelectedId=null;
 const getScenario=()=>atlas.scenarios.find(s=>s.id===state.scenarioId)||atlas.scenarios[0];
 const getEvent=()=>atlas.history.find(h=>h.id===state.eventId)||atlas.history[0];
 const nodeButton=(id,extra='')=>{const n=nodes.get(id);return n?'<button type="button" class="atlas-concept-chip'+(id===state.selectedId?' is-current':'')+'" data-atlas-node="'+aEsc(id)+'" data-focus-key="'+aEsc(extra+'node-'+id)+'"><i style="--node-color:'+categories.get(n.category).color+'"></i>'+aEsc(n.label)+'</button>':'';};

 function syncURL(){
  const p=new URLSearchParams();p.set('mode',state.mode);if(state.selectedId)p.set('node',state.selectedId);
  if(state.mode==='scenario'){p.set('scenario',state.scenarioId);p.set('step',String(state.step));}
  if(state.mode==='history')p.set('event',state.eventId);
  try{history.replaceState(null,'','#atlas&'+p.toString());}catch{/* Local-file policies may disallow replaceState. */}
 }

 function renderContext(){
  if(state.mode==='graph')return '<div class="atlas-legend">'+atlas.categories.map(c=>'<span><i style="background:'+c.color+'"></i>'+aEsc(c.label)+'</span>').join('')+'<p>选中概念后，亮起的是它的直接关联；其余概念保留位置。</p></div>';
  if(state.mode==='scenario'){
   const s=getScenario();
   return '<div class="atlas-scenario-picker" aria-label="选择协作场景">'+atlas.scenarios.map((item,i)=>'<button type="button" data-atlas-scenario="'+item.id+'" data-focus-key="scenario-'+item.id+'" aria-pressed="'+(item.id===s.id)+'"><span>场景 0'+(i+1)+'</span><strong>'+aEsc(item.title)+'</strong><small>'+aEsc(item.subtitle)+'</small></button>').join('')+'</div><p class="atlas-context-intro">'+aEsc(s.summary)+'</p><div class="atlas-step-track" aria-label="场景步骤">'+s.steps.map((step,i)=>'<button type="button" data-atlas-step="'+i+'" data-focus-key="step-'+i+'" aria-pressed="'+(i===state.step)+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+aEsc(step.title)+'</button>').join('')+'</div>';
  }
  const event=getEvent(),index=atlas.history.indexOf(event);
  return '<div class="atlas-history-intro"><div><strong>沿着“问题怎样改变”看技术发展</strong><p>这些年份标记代表性文献或事件。不同分支并行发展，先出现不等于必须先学。</p></div><span>'+atlas.history.length+' 个历史坐标</span></div><div class="atlas-history-track" aria-label="选择历史事件">'+atlas.history.map(h=>'<button type="button" data-atlas-event="'+h.id+'" data-focus-key="event-'+h.id+'" aria-pressed="'+(h.id===event.id)+'"><b>'+h.year+'</b><span>'+aEsc(h.title)+'</span></button>').join('')+'</div><div class="atlas-time-scrubber"><label for="atlas-time-range">拖动看发展阶段</label><input id="atlas-time-range" type="range" min="0" max="'+(atlas.history.length-1)+'" value="'+index+'" aria-valuetext="'+aEsc(event.dateLabel+' '+event.title)+'" data-focus-key="history-range"><output for="atlas-time-range">'+aEsc(event.dateLabel)+'</output></div>';
 }

 function renderStory(){
  if(state.mode==='graph'){
   const n=nodes.get(state.selectedId);
   return '<span class="visual-section-label">先问一个具体问题</span><h2>'+(n?'“'+aEsc(n.label)+'”为什么不是孤立的？':'换个词，继续找一个连接。')+'</h2><p>'+(n?'点右侧的关联概念，沿着解释继续走；也可以切到“协作场景”，看它怎样参与一件具体的事。':'没有匹配到概念。试试“数据”“模型”或“坐标”，也可以把分区切回全部。')+'</p><div class="atlas-quick-start">'+['rag','database','twin','cpu'].filter(id=>nodes.has(id)).map(id=>nodeButton(id,'quick-')).join('')+'</div>';
  }
  if(state.mode==='scenario'){
   const s=getScenario(),step=s.steps[state.step];
   return '<div class="atlas-story-eyebrow"><span class="visual-section-label">当前步骤 '+(state.step+1)+' / '+s.steps.length+'</span><div><button type="button" class="atlas-text-button" data-atlas-step="'+(state.step-1)+'" data-focus-key="step-prev"'+(state.step===0?' disabled':'')+'>← 上一步</button><button type="button" class="atlas-text-button" data-atlas-step="'+(state.step+1)+'" data-focus-key="step-next"'+(state.step===s.steps.length-1?' disabled':'')+'>下一步 →</button></div></div><h2>'+aEsc(step.title)+'</h2><p>'+aEsc(step.body)+'</p><div class="atlas-story-nodes">'+step.nodes.map(id=>nodeButton(id,'story-')).join('')+'</div><p class="atlas-boundary"><b>这个例子的边界</b>'+aEsc(s.boundary)+'</p>';
  }
  const h=getEvent();
  return '<span class="visual-section-label">'+aEsc(h.dateLabel)+' · 代表性文献 / 事件</span><h2>'+aEsc(h.title)+'</h2><dl class="atlas-history-explanation"><div><dt>当时的问题</dt><dd>'+aEsc(h.problem)+'</dd></div><div><dt>这一步带来什么</dt><dd>'+aEsc(h.contribution)+'</dd></div><div><dt>与今天所学的连接</dt><dd>'+aEsc(h.connection)+'</dd></div></dl><div class="atlas-story-nodes">'+h.nodes.map(id=>nodeButton(id,'history-')).join('')+'</div><div class="atlas-history-sources"><b>核对原始资料</b>'+h.sources.map(s=>'<a href="'+aEsc(s.url)+'" target="_blank" rel="noopener noreferrer">'+aEsc(s.title)+' ↗</a>').join('')+'</div>';
 }

 function renderDetail(){
  const n=nodes.get(state.selectedId);
  if(!n)return '<span class="visual-section-label">知识点说明</span><h2>没有匹配的概念</h2><p>清空搜索或选择其他分区后，关系说明会出现在这里。</p><button type="button" class="atlas-primary-link" data-atlas-clear>清空筛选</button>';
  const c=categories.get(n.category),doc=byPath.get(n.chapter),relations=atlas.edges.filter(e=>e.from===n.id||e.to===n.id);
  return '<div class="atlas-detail-category" style="--node-color:'+c.color+'"><i></i>'+aEsc(c.label)+'</div><h2>'+aEsc(n.label)+'</h2><p class="atlas-definition">'+aEsc(n.summary)+'</p><div class="atlas-concrete"><span>把它想具体一点</span><p>'+aEsc(n.concrete)+'</p></div><div class="atlas-chapter-links"><a class="atlas-primary-link" href="'+aDocLink(n.chapter)+'">去看对应图解 <span>↗</span></a><a href="'+aDocLink(n.chapter,'full')+'">阅读完整教材：'+aEsc(doc?.title||n.label)+' ↗</a></div><div class="atlas-detail-relations"><h3>和它直接相连 <span>'+relations.length+'</span></h3><p class="atlas-relations-help">箭头按文字解释阅读；基础关系是学习建议。</p>'+relations.map(e=>{
   const outgoing=e.from===n.id,other=nodes.get(outgoing?e.to:e.from);
   const phrase=e.type==='foundation'?(outgoing?'有助于理解':'理解它的基础'):e.type==='uses'?(outgoing?'它会用到':'被它用到'):'共同协作';
   return '<div class="atlas-relation"><span class="atlas-relation-type '+e.type+'">'+phrase+'</span><button type="button" data-atlas-node="'+other.id+'" data-focus-key="relation-'+other.id+'">'+aEsc(other.label)+' <span aria-hidden="true">↗</span></button><p>'+aEsc(e.why)+'</p></div>';
  }).join('')+'</div>'+(state.mode!=='graph'?'<button type="button" class="atlas-text-button atlas-return-graph" data-atlas-mode="graph">在关系图谱里查看它 →</button>':'');
 }

 function paint(preserveTimeline=false){
  if(disposed)return;
  const active=document.activeElement,wasInside=root.contains(active),focusKey=wasInside?active.getAttribute('data-focus-key'):null;
  let view=atlasViewModel(atlas,state);
  if(!view.visibleIds.includes(state.selectedId)){
   state.selectedId=view.focusIds[0]||view.visibleIds[0]||'';view=atlasViewModel(atlas,state);
  }
  root.dataset.atlasMode=state.mode;
  root.querySelectorAll('[data-atlas-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.atlasMode===state.mode)));
  root.querySelectorAll('[data-atlas-graph-tool]').forEach(el=>el.hidden=state.mode!=='graph');
  query.value=state.query;category.value=state.category;
  select.innerHTML=view.visibleIds.map(id=>'<option value="'+id+'"'+(id===state.selectedId?' selected':'')+'>'+aEsc(nodes.get(id).label)+'</option>').join('')||( '<option value="">没有匹配的概念</option>');
  select.disabled=!view.visibleIds.length;
  const oldTrack=context.querySelector('.atlas-history-track,.atlas-step-track'),oldScroll=oldTrack?.scrollLeft||0;
  if(!preserveTimeline)context.innerHTML=renderContext();
  else {
   const h=getEvent(),range=context.querySelector('#atlas-time-range');
   if(range){range.value=String(atlas.history.indexOf(h));range.setAttribute('aria-valuetext',h.dateLabel+' '+h.title);context.querySelector('output').textContent=h.dateLabel;}
   context.querySelectorAll('[data-atlas-event]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.atlasEvent===h.id)));
  }
  const newTrack=context.querySelector('.atlas-history-track,.atlas-step-track');
  if(newTrack){newTrack.scrollLeft=oldScroll;const chosen=newTrack.querySelector('[aria-pressed=true]');if(chosen){const left=chosen.offsetLeft-newTrack.offsetLeft;if(left<newTrack.scrollLeft||left+chosen.offsetWidth>newTrack.scrollLeft+newTrack.clientWidth)newTrack.scrollLeft=Math.max(0,left-newTrack.clientWidth/2+chosen.offsetWidth/2);}}
  story.innerHTML=renderStory();detail.innerHTML=renderDetail();
  const detailTitle=detail.querySelector('h2');if(detailTitle)detailTitle.tabIndex=-1;
  if(paintedSelectedId!==state.selectedId)detail.scrollTop=0;
  paintedSelectedId=state.selectedId;
  stage.hidden=state.listView;flat.hidden=!state.listView;
  if(state.listView)flat.innerHTML='<div class="atlas-flat-intro"><b>同一张地图，换一种读法</b><p>点击概念查看解释与关系。场景的当前步骤、历史事件关联的概念会高亮。</p></div><div class="atlas-flat-grid">'+view.visibleIds.map(id=>{const n=nodes.get(id),c=categories.get(n.category);return '<button type="button" class="atlas-flat-node'+(id===state.selectedId?' is-selected':'')+(view.focusIds.includes(id)?' is-focused':'')+'" data-atlas-node="'+id+'" data-focus-key="flat-'+id+'" style="--node-color:'+c.color+'"><span>'+aEsc(c.label)+'</span><strong>'+aEsc(n.label)+'</strong><small>'+aEsc(n.summary)+'</small></button>';}).join('')+'</div>';
  const fallback=root.querySelector('#atlas-fallback-note');fallback.hidden=!errorMessage;fallback.textContent=errorMessage?errorMessage+' 已切换为列表阅读。':'';
  const toggle=root.querySelector('#atlas-view-toggle');toggle.textContent=state.listView?'切换 3D':'列表视图';toggle.setAttribute('aria-pressed',String(state.listView));toggle.disabled=Boolean(errorMessage);
  root.querySelectorAll('[data-atlas-camera]').forEach(b=>b.disabled=state.listView||Boolean(errorMessage));
  root.querySelector('#atlas-interaction-help').textContent=state.listView?'点击卡片或使用上方选择框，查看关系':'拖动旋转 · 滚轮缩放 · 点击模型看关联';
  root.querySelector('#atlas-scene-title').textContent={graph:'关系图谱',scenario:'协作场景',history:'历史沿革'}[state.mode];
  const lightweight=stage.querySelector('.atlas-scene')?.dataset.renderer==='svg';
  root.querySelector('#atlas-scene-meta').textContent=view.visibleIds.length+' 个概念'+(state.mode==='graph'?' · '+view.focusIds.length+' 个正在关联':'')+(lightweight?' · 轻量 3D':'');
  if(scene&&!state.listView)scene.update(view);
  syncURL();
  const text=state.mode==='scenario'?'步骤 '+(state.step+1)+'：'+getScenario().steps[state.step].title:state.mode==='history'?getEvent().dateLabel+'，'+getEvent().title:(nodes.get(state.selectedId)?.label||'没有匹配的概念')+'，'+view.visibleIds.length+' 个匹配概念';
  if(text!==lastAnnouncement){announcement.textContent=text;lastAnnouncement=text;}
  const replacement=focusKey?[...root.querySelectorAll('[data-focus-key]')].find(el=>el.getAttribute('data-focus-key')===focusKey):null;
  if(replacement&&!replacement.disabled&&replacement!==active)replacement.focus({preventScroll:true});
  else if(wasInside&&!active.isConnected)(detailTitle||select).focus({preventScroll:true});
 }

 function selectNode(id){
  if(!nodes.has(id))return;
  state.selectedId=id;
  if(state.mode==='graph'&&!atlasFilteredNodes(atlas,state).some(n=>n.id===id)){state.query='';state.category='all';}
  // A related concept outside a scenario/history is explored on the whole map.
  if(state.mode!=='graph'&&!atlasViewModel(atlas,state).visibleIds.includes(id))state.mode='graph';
  paint();
  if(!state.listView&&!errorMessage)scene?.focus(id);
 }
 function onClick(event){
  const button=event.target.closest('button');if(!button||!root.contains(button)||button.disabled)return;
  if(button.hasAttribute('data-atlas-node')){selectNode(button.dataset.atlasNode);return;}
  if(button.hasAttribute('data-atlas-mode')){
   state.mode=button.dataset.atlasMode;state.query='';state.category='all';
   if(state.mode==='scenario')state.selectedId=getScenario().steps[state.step].nodes[0];
   if(state.mode==='history')state.selectedId=getEvent().nodes[0];
   paint();return;
  }
  if(button.hasAttribute('data-atlas-scenario')){state.scenarioId=button.dataset.atlasScenario;state.step=0;state.selectedId=getScenario().steps[0].nodes[0];paint();return;}
  if(button.hasAttribute('data-atlas-step')){state.step=Math.max(0,Math.min(getScenario().steps.length-1,Number(button.dataset.atlasStep)));state.selectedId=getScenario().steps[state.step].nodes[0];paint();return;}
  if(button.hasAttribute('data-atlas-event')){state.eventId=button.dataset.atlasEvent;state.selectedId=getEvent().nodes[0];paint();return;}
  if(button.hasAttribute('data-atlas-clear')){state.query='';state.category='all';paint();query.focus();return;}
  if(button.id==='atlas-view-toggle'){state.listView=!state.listView;paint();return;}
  if(button.hasAttribute('data-atlas-camera')){const action=button.dataset.atlasCamera;if(action==='reset')scene?.reset();else scene?.zoom(action==='in'?0.82:1.22);}
 }
 function onInput(event){
  if(event.target===query){state.query=query.value;paint();}
  if(event.target.id==='atlas-time-range'){const h=atlas.history[Number(event.target.value)];if(h){state.eventId=h.id;state.selectedId=h.nodes[0];paint(true);}}
 }
 function onChange(event){
  if(event.target===category){state.category=category.value;paint();}
  if(event.target===select)selectNode(select.value);
 }
 root.addEventListener('click',onClick);root.addEventListener('input',onInput);root.addEventListener('change',onChange);
 scene=createAtlasScene(stage,{atlas,onSelect:selectNode,onError:message=>{errorMessage=String(message||'WebGL2 unavailable');state.listView=true;queueMicrotask(paint);}});
 paint();
 return ()=>{disposed=true;root.removeEventListener('click',onClick);root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);scene?.dispose();scene=null;};
}
