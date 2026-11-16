import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {validateAtlas,atlasFilteredNodes,atlasNeighbors,atlasReadState,atlasViewModel} from '../site-src/atlas-core.mjs';
import {bundleThree} from '../scripts/bundle-three.mjs';
import {atlasCategories,atlasNodes,atlasEdges,atlasScenarios} from '../site-src/atlas-data.mjs';
import {atlasHistory} from '../site-src/atlas-history.mjs';

const fixture={
 categories:[{id:'foundation',label:'基础',color:'#ffffff',summary:'基础'},{id:'intelligence',label:'智能',color:'#ffffff',summary:'智能'}],
 nodes:[{id:'database',label:'数据库',category:'foundation',chapter:'db.md',summary:'保存和查询数据',concrete:'资料柜',shape:'database'}, {id:'rag',label:'检索增强生成 RAG',category:'intelligence',chapter:'rag.md',summary:'带着证据回答',concrete:'先找资料再答题',shape:'document'}, {id:'llm',label:'语言模型 LLM',category:'intelligence',chapter:'rag.md',summary:'根据上下文生成文本',concrete:'文本生成器',shape:'brain'}],
 edges:[{from:'rag',to:'database',type:'uses',why:'检索可能从数据库读取资料'},{from:'rag',to:'llm',type:'uses',why:'让模型在证据上下文中生成回答'}],
 scenarios:[{id:'rag',title:'查资料回答',subtitle:'一个过程',summary:'检索与生成',boundary:'不保证正确',steps:[{title:'查资料',body:'找相关证据',nodes:['database','rag']},{title:'写回答',body:'检查引用',nodes:['rag','llm']}]}],
 history:[{id:'relational',year:1970,dateLabel:'1970',title:'关系模型',problem:'数据独立性',contribution:'关系模型',connection:'学习数据库',nodes:['database'],sources:[{title:'原始论文',url:'https://example.org/paper'}]},{id:'rag-paper',year:2020,dateLabel:'2020',title:'RAG论文',problem:'外部知识',contribution:'结合检索生成',connection:'理解RAG',nodes:['rag','llm'],sources:[{title:'原始论文',url:'https://example.org/rag'}]}]
};

test('graph validation rejects broken concepts, chapter links, relation semantics and unsourced history',()=>{
 assert.doesNotThrow(()=>validateAtlas(fixture,new Set(['db.md','rag.md'])));
 for(const change of [a=>a.edges[0].to='missing',a=>a.nodes[0].chapter='private.md',a=>a.edges[0].type='made-up',a=>a.history[0].sources=[],a=>a.history[0].sources[0].url='javascript:bad',a=>a.scenarios[0].steps[0].nodes=['missing'],a=>a.nodes.push({...a.nodes[0]})]){
  const a=structuredClone(fixture);change(a);assert.throws(()=>validateAtlas(a,new Set(['db.md','rag.md'])));
 }
});

test('concept search combines category and case-insensitive all-term search without inventing matches',()=>{
 assert.deepEqual(atlasFilteredNodes(fixture,{query:'rAg'}).map(n=>n.id),['rag']);
 assert.deepEqual(atlasFilteredNodes(fixture,{query:'数据',category:'intelligence'}),[]);
 assert.deepEqual(atlasFilteredNodes(fixture,{category:'intelligence'}).map(n=>n.id),['rag','llm']);
 assert.deepEqual(atlasFilteredNodes(fixture,{query:'未知概念'}),[]);
 assert.deepEqual(new Set(atlasNeighbors(fixture,'rag')),new Set(['database','llm']));
});

test('deep links restore a valid mode, concept, scenario step and historical event; malformed inputs stay bounded',()=>{
 const state=atlasReadState(new URLSearchParams('atlas&mode=scenario&scenario=rag&step=1&node=llm'),fixture);
 assert.equal(state.mode,'scenario');assert.equal(state.step,1);assert.equal(state.selectedId,'llm');
 const damaged=atlasReadState(new URLSearchParams('atlas&mode=evil&node=missing&scenario=oops&step=10000&event=oops'),fixture);
 assert.equal(damaged.mode,'graph');assert.ok(fixture.nodes.some(n=>n.id===damaged.selectedId));assert.equal(damaged.scenarioId,'rag');assert.equal(damaged.step,1);assert.equal(damaged.eventId,'relational');
});

test('scenario emphasis follows the current step and graph filtering never highlights absent nodes',()=>{
 let state=atlasReadState(new URLSearchParams('atlas&mode=scenario&scenario=rag&step=1'),fixture);
 let view=atlasViewModel(fixture,state);
 assert.deepEqual(view.focusIds,['rag','llm']);assert.deepEqual(view.visibleIds,['database','rag','llm']);
 state={...state,mode:'graph',query:'database',category:'all',selectedId:'rag'};
 view=atlasViewModel(fixture,state);
 assert.deepEqual(view.visibleIds,['database']);assert.deepEqual(view.focusIds,[]);
 state={...state,mode:'history',eventId:'rag-paper'};
 view=atlasViewModel(fixture,state);assert.deepEqual(view.focusIds,['rag','llm']);
});

test('unqualified history and scenario links select a concept from the current event or step',()=>{
 assert.equal(atlasReadState(new URLSearchParams('atlas&mode=history'),fixture).selectedId,'database');
 assert.equal(atlasReadState(new URLSearchParams('atlas&mode=scenario'),fixture).selectedId,'database');
 assert.equal(atlasReadState(new URLSearchParams('atlas&mode=history&node=unknown'),fixture).selectedId,'database');
 assert.equal(atlasReadState(new URLSearchParams('atlas&mode=history&event=rag-paper'),fixture).selectedId,'rag');
});

test('the real atlas links all eighteen core chapters with no isolated concepts and sourced events',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../site-src/catalog.json',import.meta.url),'utf8'));
 const atlas={categories:atlasCategories,nodes:atlasNodes,edges:atlasEdges,scenarios:atlasScenarios,history:atlasHistory};
 assert.doesNotThrow(()=>validateAtlas(atlas,new Set(catalog.documents.map(d=>d.path))));
 assert.equal(atlas.nodes.length,39);assert.equal(atlas.edges.length,68);assert.equal(atlas.history.length,16);
 const chapters=new Set(atlas.nodes.map(n=>n.chapter));
 for(const doc of catalog.documents.filter(d=>d.number&&(d.group==='chapters'||d.group==='architecture')))assert.ok(chapters.has(doc.path));
 for(const node of atlas.nodes)assert.ok(atlasNeighbors(atlas,node.id).length>0,node.id+' must connect to the map');
 for(const scenario of atlas.scenarios)assert.equal(scenario.steps.length,6);
});

test('pinned Three.js and OrbitControls run as a self-contained classic script with usable math exports',()=>{
 const source=bundleThree();
 const context={console,URL,AbortController};context.globalThis=context;
 try{vm.runInNewContext(source,context,{timeout:10000});}catch(error){throw new Error('Three.js runtime: '+error.message);}
 assert.equal(context.KnowledgeThree.REVISION,'180');
 assert.equal(typeof context.KnowledgeThree.WebGLRenderer,'function');
 assert.equal(typeof context.KnowledgeThree.OrbitControls,'function');
 assert.equal(typeof context.KnowledgeThree.SVGRenderer,'function');
 assert.equal(typeof context.KnowledgeThree.Projector,'function');
 assert.equal(new context.KnowledgeThree.Vector3(3,4,0).length(),5);
 assert.doesNotMatch(source,/<\/script/i,'Bundling must not prematurely close the inline script');
});
