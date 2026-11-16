import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFrontier,frontierEntries,frontierSelection,frontierFreshness,renderFrontierPage} from '../site-src/frontier.mjs';

const known=new Set(['docs/chapters/12-agents.md']);
const entry={id:'release',date:'2026-11-13',dateLabel:'公告',vendor:'DeepSeek',status:'released',statusLabel:'已发布',title:'新版工具调用',summary:'发生了什么',mechanism:'如何运作',example:'虚构例子',boundary:'适用边界',sources:[{label:'官方公告',url:'https://api-docs.deepseek.com/zh-cn/news/'}],related:[...known]};
const feed=()=>({schemaVersion:1,checkedAt:'2026-11-16',updatedAt:'2026-11-16',updatePolicy:{mode:'manual'},entries:[structuredClone(entry)]});

test('frontier publishing requires dated, sourced claims and real chapter links',()=>{
  assert.doesNotThrow(()=>validateFrontier(feed(),known));
  for(const mutate of [
    f=>f.entries[0].sources=[],
    f=>f.entries[0].sources[0].url='javascript:alert(1)',
    f=>f.entries[0].date='2026-11-17',
    f=>f.entries[0].related=['private.md'],
    f=>f.entries.push(structuredClone(f.entries[0])),
    f=>f.entries[0].status='unverified-hype',
    f=>f.checkedAt='2026-02-31'
  ]) { const f=feed();mutate(f);assert.throws(()=>validateFrontier(f,known)); }
});

test('frontier filtering and links stay bounded without treating a check date as a new release',()=>{
  const f=feed();
  f.entries.unshift({...structuredClone(entry),id:'checked',date:'2026-11-16',dateLabel:'核验',vendor:'Anthropic',status:'preview'});
  assert.equal(frontierEntries(f)[0].id,'release');
  assert.deepEqual(frontierEntries(f,'Anthropic').map(x=>x.id),['checked']);
  assert.deepEqual(frontierSelection(f,new URLSearchParams('vendor=missing&entry=missing')),{vendor:'all',id:'release'});
  assert.deepEqual(frontierSelection(f,new URLSearchParams('vendor=Anthropic&entry=release')),{vendor:'Anthropic',id:'checked'});
  assert.equal(frontierFreshness(f,'2026-11-24').stale,true);
  assert.equal(frontierFreshness(f,'2026-11-16').stale,false);
});

test('frontier cards escape sourced text and expose the date, status and original source',()=>{
  const f=feed();f.entries[0].title='<img src=x onerror=alert(1)>';
  const html=renderFrontierPage(f,new Map());
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.equal(html.includes('<img src=x'),false);
  assert.ok(html.includes('2026-11-13'));
  assert.ok(html.includes('已发布'));
  assert.ok(html.includes('https://api-docs.deepseek.com/zh-cn/news/'));
});
