import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { headingSlug, resolveLink, searchDocuments, restoreProgress } from '../site-src/core.mjs';

const paths = new Set(['README.md', 'docs/03-learning-method.md', 'docs/07-glossary.md', 'docs/chapters/07-databases.md', 'LICENSE', 'docs/practice/lab.py']);

test('chapter relative links resolve inside the reader, including repository subpaths', () => {
  assert.equal(resolveLink('docs/chapters/07-databases.md', '../07-glossary.md', paths), '#doc=docs%2F07-glossary.md');
  assert.equal(resolveLink('README.md', 'LICENSE', paths), '#doc=LICENSE');
  assert.equal(resolveLink('docs/chapters/07-databases.md', '../../docs/practice/lab.py', paths), '#doc=docs%2Fpractice%2Flab.py');
});

test('Chinese heading fragments retain the actual target and remove punctuation', () => {
  assert.equal(headingSlug('12. 研究来源与阅读边界'), '12-研究来源与阅读边界');
  assert.equal(headingSlug('分类导航'), '分类导航');
  const route = resolveLink('docs/04-learning-plan.md', '03-learning-method.md#12-研究来源与阅读边界', paths);
  const parsed = new URLSearchParams(route.slice(1));
  assert.equal(parsed.get('doc'), 'docs/03-learning-method.md');
  assert.equal(parsed.get('section'), '12-研究来源与阅读边界');
});

test('unpublished paths and unsafe URL schemes cannot become navigation targets', () => {
  assert.equal(resolveLink('README.md', 'learning/private.local.md', paths), null);
  assert.equal(resolveLink('README.md', '../README.md', paths), null);
  assert.equal(resolveLink('README.md', 'javascript:alert(1)', paths), null);
  assert.equal(resolveLink('README.md', 'data:text/html,example', paths), null);
  assert.equal(resolveLink('README.md', 'https://developer.mozilla.org/', paths), 'https://developer.mozilla.org/');
});

const searchFixture = [
  {path:'db',title:'数据库',text:'事务回滚会撤销这一次未提交的修改。',group:'chapters'},
  {path:'rag',title:'LLM 与 RAG',text:'检索增强生成先检索，再检查证据。',group:'chapters'},
  {path:'bim',title:'建筑数据',text:'给构件设置唯一标识。',group:'architecture'}
];
test('Chinese body matches are searchable without word-separating spaces', () => {
  assert.deepEqual(searchDocuments(searchFixture, '事务回滚').map(x=>x.path), ['db']);
  assert.deepEqual(searchDocuments(searchFixture, '检索 证据').map(x=>x.path), ['rag']);
  assert.deepEqual(searchDocuments(searchFixture, 'rAg').map(x=>x.path), ['rag']);
  assert.deepEqual(searchDocuments(searchFixture, '不存在的概念'), []);
  assert.deepEqual(searchDocuments(searchFixture, '   '), []);
});

test('damaged storage and unknown document IDs do not break the reader', () => {
  assert.deepEqual(restoreProgress('{bad json', paths).read, []);
  assert.deepEqual(restoreProgress('null', paths).bookmarks, []);
  const state=restoreProgress(JSON.stringify({read:['README.md','secret',null],bookmarks:['docs/07-glossary.md'],last:'secret',positions:{'README.md':0.5,'docs/07-glossary.md':8},theme:'evil'}),paths);
  assert.deepEqual(state.read,['README.md']);
  assert.deepEqual(state.bookmarks,['docs/07-glossary.md']);
  assert.equal(state.last,null);
  assert.equal(state.positions['README.md'],0.5);
  assert.equal(state.positions['docs/07-glossary.md'],1);
  assert.equal(state.theme,'dark');
  assert.equal(restoreProgress(null,paths).theme,'dark');
  assert.equal(restoreProgress(JSON.stringify({theme:'light'}),paths).theme,'light');
  assert.equal(restoreProgress(JSON.stringify({theme:'dark'}),paths).theme,'dark');
  assert.deepEqual(restoreProgress(null,paths).cards,{});
  assert.deepEqual(restoreProgress(JSON.stringify({cards:{'README.md':'step-2','secret':'check','docs/07-glossary.md':'<script>'}}),paths).cards,{'README.md':'step-2'});
});

test('the built reader preserves all lessons, folded answers, diagrams and local targets', () => {
  const build=spawnSync(process.execPath,['scripts/build-site.mjs'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});
  assert.equal(build.status,0,'The reader must build successfully: '+build.stderr);
  const html=readFileSync(new URL('../_site/index.html',import.meta.url),'utf8');
  const match=html.match(/<script id="knowledge-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(match,'The complete curriculum must be embedded for offline use');
  const data=JSON.parse(match[1]);
  assert.equal(data.documents.filter(d=>d.group==='chapters'&&d.number).length,14);
  assert.equal(data.documents.filter(d=>d.group==='architecture'&&d.number).length,4);
  assert.equal(data.documents.reduce((n,d)=>n+(d.html.match(/aria-label="教材流程图"/g)||[]).length,0),3);
  const byPath=new Map(data.documents.map(d=>[d.path,d]));
  for(const doc of data.documents) {
    assert.equal(doc.source,readFileSync(new URL('../'+doc.path,import.meta.url),'utf8'),'Source must remain complete: '+doc.path);
    const sourceFolds=(doc.source.match(/^<details>\s*$/gm)||[]).length;
    const diagramFolds=(doc.source.match(/^(?:```|~~~)mermaid\s*$/gm)||[]).length;
    assert.equal((doc.html.match(/<details>/g)||[]).length,sourceFolds+diagramFolds,'Every source fold and diagram-source fold must survive: '+doc.path);
    assert.equal((doc.html.match(/<\/details>/g)||[]).length,sourceFolds+diagramFolds,'Folded content must close within its document: '+doc.path);
    for(const link of doc.html.matchAll(/href="(#doc=[^"]+)"/g)) {
      const route=new URLSearchParams(link[1].slice(1).replace(/&amp;/g,'&'));
      const target=byPath.get(route.get('doc'));
      assert.ok(target,'Internal link must reach a bundled document: '+link[1]);
      if(route.has('section')) assert.ok(target.headings.some(h=>h.id===route.get('section')),'Heading must exist: '+link[1]);
    }
  }
  assert.equal(/<script[^>]+src=|<link[^>]+(?:stylesheet|preload)|<img[^>]+src="https?:/.test(html),false,'Offline reading must not require external assets');
  assert.ok(byPath.get('docs/practice/01-labs.md').html.includes('<summary>'),'Folded answers must remain usable');
  assert.ok(byPath.get('docs/07-glossary.md').html.includes('class="table-wrap"'),'Wide tables need their own scroll container');
});
