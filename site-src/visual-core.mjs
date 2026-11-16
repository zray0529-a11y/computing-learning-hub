export function bitValue(bits) {
  if(!Array.isArray(bits)||bits.length!==4||bits.some(bit=>bit!==0&&bit!==1)) throw new Error('Use four binary bits');
  return bits.reduce((value,bit,index)=>value+bit*2**(3-index),0);
}

export function transactionState(branch,step) {
  if(!['failure','success'].includes(branch)||!Number.isInteger(step)||step<0||step>3) throw new Error('Invalid transaction step');
  const original=[{id:'e1',state:'low'}];
  let committed=original.map(row=>({...row}));
  let pending=step>=1?[{id:'e2',state:'high'}]:[];
  if(branch==='success'&&step>=2)pending.push({id:'e3',state:'medium'});
  if(step===3){if(branch==='success')committed=committed.concat(pending);pending=[];}
  const status=step===3?(branch==='success'?'已提交':'已回滚'):step===2&&branch==='failure'?'主键冲突':step===0?'事务开始':'尚未提交';
  const messages=branch==='success'?[
    '先保留已经提交的 e1。接下来的改动属于一个新事务。',
    '加入 e2，但还没有提交。这里单独展示本事务准备新增的行。',
    '再加入新的 e3，两条记录都通过主键约束。',
    '一起提交 e2 和 e3。原来已经提交的 e1 也保留。'
  ]:[
    '先保留已经提交的 e1。接下来的改动属于一个新事务。',
    '加入 e2，但还没有提交。若后续步骤失败，这条新记录也需要撤销。',
    '再次插入 e1，违反主键唯一约束。本例将让异常触发整个事务回滚。',
    '撤销本次未提交的 e2。事务开始前已提交的 e1 不受影响。'
  ];
  return {committed,pending,status,error:branch==='failure'&&step===2,message:messages[step]};
}

export function retrievalExample(withEvidence) {
  return {
    evidence:withEvidence?['[1] 样例展馆开放说明：周二至周日 09:00–17:00；周一闭馆。']:[],
    answer:withEvidence?'样例资料写明：周二 17:00 闭馆。[1] 实际出行前还应确认公告日期与临时调整。':'没有可核对的开放时间资料，目前无法确定。应先查找有效公告。',
    note:'教学模拟，未调用模型：展示有无证据时，回答应该怎样约束；真实模型仍可能误读资料。'
  };
}

export function resolveReadingMode(params,hasLesson,savedView) {
  if(!hasLesson)return 'full';
  const section=params.get('section');
  if(section&&!section.startsWith('visual-'))return 'full';
  if(params.get('view')==='full')return 'full';
  if(params.get('view')==='visual')return 'visual';
  if(params.has('resume')&&savedView==='full')return 'full';
  return 'visual';
}

export function validateLesson(lesson,known) {
  const fail=message=>{throw new Error((lesson?.path||'lesson')+': '+message);};
  if(!lesson||!known.has(lesson.path))fail('Unknown public lesson');
  for(const key of ['title','intro','diagramLabel','svg'])if(typeof lesson[key]!=='string'||!lesson[key].trim())fail('Missing '+key);
  const tags=new Set(['svg','g','rect','path','line','polyline','polygon','circle','ellipse','text','tspan','defs','marker','title','desc']);
  if(!/^<svg\b/.test(lesson.svg)||!/<\/svg>$/.test(lesson.svg)||!/(?:viewBox)=["']0 0 800 (?:400|4[1-6]0)["']/.test(lesson.svg))fail('Invalid SVG viewBox');
  if(/\s(?:on\w+|href|xlink:href|style)\s*=|(?:https?:|data:|javascript:)|<!/i.test(lesson.svg.replace(/xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/g,'')))fail('Unsafe SVG content');
  for(const match of lesson.svg.matchAll(/<\/?([\w:-]+)/g))if(!tags.has(match[1]))fail('Unsafe SVG tag '+match[1]);
  const ids=[...lesson.svg.matchAll(/\sdata-node=["']([^"']+)["']/g)].map(m=>m[1]);
  if(!ids.length||new Set(ids).size!==ids.length)fail('Invalid SVG node keys');
  const defs=[...lesson.svg.matchAll(/\sid=["']([^"']+)["']/g)].map(m=>m[1]);
  if(new Set(defs).size!==defs.length)fail('Duplicate SVG ids');
  for(const match of lesson.svg.matchAll(/url\(([^)]+)\)/g))if(!match[1].startsWith('#')||!defs.includes(match[1].slice(1)))fail('Invalid SVG reference');
  if(!Array.isArray(lesson.steps)||lesson.steps.length<3||lesson.steps.length>4)fail('Use 3–4 explanatory steps');
  for(const step of lesson.steps){
    if(!step.title||!step.body)fail('Missing step explanation');
    if(!Array.isArray(step.focus)||!step.focus.length||step.focus.some(id=>!ids.includes(id)))fail('Invalid step focus');
  }
  const options=lesson.check?.options;
  if(!lesson.check?.prompt||!Array.isArray(options)||options.length!==3||options.filter(o=>o.correct===true).length!==1)fail('Exactly one correct option is required');
  if(options.some(o=>!o.text||!o.feedback||typeof o.correct!=='boolean'))fail('Incomplete prediction feedback');
  if(!lesson.misconception?.wrong||!lesson.misconception?.right)fail('Missing misconception boundary');
  if(!Array.isArray(lesson.related)||lesson.related.some(p=>!known.has(p)))fail('Unknown related lesson');
  if(lesson.lab&&!['bits','transaction','retrieval'].includes(lesson.lab))fail('Unknown interactive demonstration');
}
