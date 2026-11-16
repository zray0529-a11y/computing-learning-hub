export const atlasRelationLabels={foundation:'理解基础',uses:'用到',collaboration:'共同协作'};

export function validateAtlas(atlas,known) {
 const fail=message=>{throw new Error('Knowledge atlas: '+message);};
 const nonempty=value=>typeof value==='string'&&value.trim().length>0;
 for(const key of ['categories','nodes','edges','scenarios','history'])if(!Array.isArray(atlas[key])||!atlas[key].length)fail('empty '+key);
 const categoryIds=new Set();
 for(const c of atlas.categories){if(!nonempty(c.id)||categoryIds.has(c.id)||!nonempty(c.label)||!/^#[0-9a-f]{6}$/i.test(c.color))fail('invalid category');categoryIds.add(c.id);}
 const ids=new Set(),shapes=new Set(['chip','stack','network','database','cube','building','document','brain','shield']);
 for(const node of atlas.nodes){
  if(!/^[a-z][a-z0-9-]*$/.test(node.id)||ids.has(node.id))fail('duplicate/invalid node '+node.id);
  if(!categoryIds.has(node.category)||!known.has(node.chapter)||!shapes.has(node.shape))fail('invalid category/chapter/shape '+node.id);
  for(const field of ['label','summary','concrete'])if(!nonempty(node[field]))fail('missing '+field+' on '+node.id);
  ids.add(node.id);
 }
 const edges=new Set();
 for(const edge of atlas.edges){
  const key=[edge.from,edge.to,edge.type].join('|');
  if(!ids.has(edge.from)||!ids.has(edge.to)||edge.from===edge.to||!(edge.type in atlasRelationLabels)||!nonempty(edge.why)||edges.has(key))fail('invalid edge '+key);
  edges.add(key);
 }
 const scenarioIds=new Set();
 for(const scenario of atlas.scenarios){
  if(!nonempty(scenario.id)||scenarioIds.has(scenario.id))fail('duplicate/invalid scenario');scenarioIds.add(scenario.id);
  for(const field of ['title','subtitle','summary','boundary'])if(!nonempty(scenario[field]))fail('missing scenario '+field);
  if(!Array.isArray(scenario.steps)||scenario.steps.length<2)fail('scenario needs steps');
  for(const step of scenario.steps)if(!nonempty(step.title)||!nonempty(step.body)||!Array.isArray(step.nodes)||!step.nodes.length||step.nodes.some(id=>!ids.has(id)))fail('invalid scenario step '+scenario.id);
 }
 let previous=-Infinity;const eventIds=new Set();
 for(const event of atlas.history){
  if(!nonempty(event.id)||eventIds.has(event.id)||!Number.isInteger(event.year)||event.year<previous)fail('history order/id');eventIds.add(event.id);previous=event.year;
  for(const field of ['dateLabel','title','problem','contribution','connection'])if(!nonempty(event[field]))fail('missing historical '+field+' on '+event.id);
  if(!Array.isArray(event.nodes)||!event.nodes.length||event.nodes.some(id=>!ids.has(id)))fail('unknown history node '+event.id);
  if(!Array.isArray(event.sources)||!event.sources.length)fail('unsourced history '+event.id);
  for(const source of event.sources){let url;try{url=new URL(source.url);}catch{fail('invalid source URL');}if(url.protocol!=='https:'||!nonempty(source.title))fail('unsafe/unnamed source');}
 }
 return true;
}

export function atlasFilteredNodes(atlas,{query='',category='all'}={}) {
 const terms=String(query).toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 return atlas.nodes.filter(node=>(category==='all'||node.category===category)&&terms.every(term=>(node.id+' '+node.label+' '+node.summary+' '+node.concrete).toLocaleLowerCase().includes(term)));
}

export function atlasNeighbors(atlas,id) {
 return [...new Set(atlas.edges.flatMap(edge=>edge.from===id?[edge.to]:edge.to===id?[edge.from]:[]))];
}

export function atlasReadState(params,atlas) {
 const mode=['graph','scenario','history'].includes(params.get('mode'))?params.get('mode'):'graph';
 const scenario=atlas.scenarios.find(s=>s.id===params.get('scenario'))||atlas.scenarios[0];
 const stepNumber=Number(params.get('step')||0);
 const step=Number.isFinite(stepNumber)?Math.max(0,Math.min(scenario.steps.length-1,Math.trunc(stepNumber))):0;
 const event=atlas.history.find(h=>h.id===params.get('event'))||atlas.history[0];
 const fallbackId=mode==='history'?event.nodes[0]:mode==='scenario'?scenario.steps[step].nodes[0]:(atlas.nodes.find(n=>n.id==='rag')||atlas.nodes[0]).id;
 const selectedId=atlas.nodes.some(n=>n.id===params.get('node'))?params.get('node'):fallbackId;
 return {mode,selectedId,scenarioId:scenario.id,step,eventId:event.id,query:'',category:'all',listView:false};
}

export function atlasViewModel(atlas,state) {
 if(state.mode==='scenario'){
  const scenario=atlas.scenarios.find(s=>s.id===state.scenarioId)||atlas.scenarios[0];
  const step=Math.max(0,Math.min(scenario.steps.length-1,state.step));
  return {...state,step,visibleIds:[...new Set(scenario.steps.flatMap(s=>s.nodes))],focusIds:[...scenario.steps[step].nodes]};
 }
 if(state.mode==='history'){
  const event=atlas.history.find(h=>h.id===state.eventId)||atlas.history[0];
  return {...state,visibleIds:[...new Set(atlas.history.flatMap(h=>h.nodes))],focusIds:[...event.nodes]};
 }
 const visibleIds=atlasFilteredNodes(atlas,state).map(n=>n.id);
 const focusIds=visibleIds.includes(state.selectedId)?[state.selectedId,...atlasNeighbors(atlas,state.selectedId).filter(id=>visibleIds.includes(id))]:[];
 return {...state,visibleIds,focusIds};
}
