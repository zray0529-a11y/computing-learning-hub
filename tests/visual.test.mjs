import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bitValue, transactionState, retrievalExample, resolveReadingMode, validateLesson} from '../site-src/visual-core.mjs';

test('four binary switches have their actual positional values',()=>{
  assert.equal(bitValue([0,1,0,1]),5);
  assert.equal(bitValue([0,0,0,0]),0);
  assert.equal(bitValue([1,1,1,1]),15);
  for(let n=0;n<16;n++) assert.equal(bitValue([8,4,2,1].map(w=>Number(Boolean(n&w)))),n);
  assert.throws(()=>bitValue([1,2,0,1]));
});

test('transaction failure discards the uncommitted new row, never the prior committed row',()=>{
  const start=transactionState('failure',0);
  assert.deepEqual(start.committed,[{id:'e1',state:'low'}]);
  const staged=transactionState('failure',1);
  assert.deepEqual(staged.pending,[{id:'e2',state:'high'}]);
  assert.deepEqual(staged.committed,start.committed);
  const failed=transactionState('failure',2);
  assert.equal(failed.error,true);
  const rolled=transactionState('failure',3);
  assert.deepEqual(rolled.committed,start.committed);
  assert.deepEqual(rolled.pending,[]);
  assert.equal(rolled.status,'已回滚');
  const success=transactionState('success',3);
  assert.deepEqual(success.committed.map(row=>row.id),['e1','e2','e3']);
  assert.equal(success.status,'已提交');
  assert.deepEqual(transactionState('failure',0),start,'resetting must restore the same pristine example');
});

test('retrieval illustration shows its evidence and does not present absent evidence as a fact',()=>{
  assert.equal(retrievalExample(false).evidence.length,0);
  assert.match(retrievalExample(false).answer,/无法确定/);
  assert.equal(retrievalExample(true).evidence.length,1);
  assert.match(retrievalExample(true).answer,/17:00/);
  assert.match(retrievalExample(true).note,/模拟/);
});

test('visual mode never hides a linked original heading or search result',()=>{
  assert.equal(resolveReadingMode(new URLSearchParams(),true),'visual');
  assert.equal(resolveReadingMode(new URLSearchParams('view=full'),true),'full');
  assert.equal(resolveReadingMode(new URLSearchParams('section=事务真正保证什么'),true),'full');
  assert.equal(resolveReadingMode(new URLSearchParams('section=visual-check'),true),'visual');
  assert.equal(resolveReadingMode(new URLSearchParams('resume=1'),true,'full'),'full');
  assert.equal(resolveReadingMode(new URLSearchParams(),false),'full');
});

test('lesson validation rejects broken focus targets, unsafe SVG and ambiguous answers',()=>{
  const fixture={path:'a.md',title:'问题',intro:'解释',diagramLabel:'说明',svg:'<svg viewBox="0 0 800 420"><g data-node="a"><rect x="10" y="10" width="20" height="20"/></g></svg>',steps:[{title:'一',body:'说明',focus:['a']},{title:'二',body:'说明',focus:['a']},{title:'三',body:'说明',focus:['a']}],misconception:{wrong:'误区',right:'纠正'},check:{prompt:'问题',options:[{text:'一',correct:true,feedback:'对'},{text:'二',correct:false,feedback:'错'},{text:'三',correct:false,feedback:'错'}]},related:[]};
  const known=new Set(['a.md']);
  assert.doesNotThrow(()=>validateLesson(fixture,known));
  const badFocus=structuredClone(fixture);badFocus.steps[0].focus=['missing'];
  assert.throws(()=>validateLesson(badFocus,known),/focus/);
  const unsafe=structuredClone(fixture);unsafe.svg='<svg><image href="https://example.test/a.png"/></svg>';
  assert.throws(()=>validateLesson(unsafe,known),/SVG/);
  const ambiguous=structuredClone(fixture);ambiguous.check.options[1].correct=true;
  assert.throws(()=>validateLesson(ambiguous,known),/correct/);
});

test('the actual offline build includes all eighteen visual topics and the original sources',()=>{
  const html=readFileSync(new URL('../_site/index.html',import.meta.url),'utf8');
  const data=JSON.parse(html.match(/<script id="knowledge-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  const topics=data.documents.filter(d=>d.number&&(d.group==='chapters'||d.group==='architecture'));
  assert.equal(topics.length,18);
  const known=new Set(data.documents.map(d=>d.path));
  for(const doc of topics){
    assert.ok(doc.visual,'Missing visual lesson for '+doc.path);
    validateLesson(doc.visual,known);
    assert.ok(doc.html.includes('<h1'),'Full original lesson must remain present');
  }
  assert.match(html,/data-bit=/);
  assert.match(html,/data-transaction-next/);
  assert.match(html,/data-retrieval=/);
  assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+(?:stylesheet|preload)/i);
});
