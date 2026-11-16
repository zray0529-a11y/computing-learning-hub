import {readFileSync,writeFileSync,mkdirSync,realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Marked} from '../site-src/vendor/marked.mjs';
import {escapeHtml,headingSlug,resolveLink} from '../site-src/core.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('site-src/catalog.json'));
const diagrams=JSON.parse(read('site-src/diagrams.json'));
const known=new Set(catalog.documents.map(d=>d.path));
if(known.size!==catalog.documents.length) throw new Error('Duplicate document in public catalog');
const plain=html=>html.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const digest=text=>createHash('sha256').update(text).digest('hex');
const documents=[];

for(const entry of catalog.documents) {
  const actual=realpathSync(path.join(root,entry.path));
  if(!actual.startsWith(root)||/(^|\/)(learning|\.git|tmp)(\/|$)|\.local\.md$/.test(entry.path)) throw new Error('Not a public source: '+entry.path);
  const source=read(entry.path);
  const headings=[];
  let html;
  if(entry.kind) {
    html='<h1 id="'+headingSlug(entry.title)+'">'+escapeHtml(entry.title)+'</h1><div class="code-block"><div class="code-label">'+(entry.kind==='code'?'Python':'原文')+'<button type="button" data-copy-code>复制</button></div><pre tabindex="0"><code>'+escapeHtml(source)+'</code></pre></div>';
    headings.push({id:headingSlug(entry.title),text:entry.title,depth:1});
  } else {
    const ids=new Map();
    const parser=new Marked({gfm:true,breaks:false});
    parser.use({renderer:{
      heading({tokens,depth}) {
        const content=this.parser.parseInline(tokens);
        const text=plain(content);
        const base=headingSlug(text);
        const count=ids.get(base)||0;
        ids.set(base,count+1);
        const id=base+(count?'-'+count:'');
        headings.push({id,text,depth});
        return '<h'+depth+' id="'+escapeHtml(id)+'">'+content+'</h'+depth+'>\n';
      },
      link({href,tokens}) {
        const content=this.parser.parseInline(tokens);
        const resolved=resolveLink(entry.path,href,known);
        if(!resolved) throw new Error('Unpublished or unsafe link in '+entry.path+': '+href);
        return '<a href="'+escapeHtml(resolved)+'"'+(resolved.startsWith('#')?'':' target="_blank" rel="noopener noreferrer"')+'>'+content+'</a>';
      },
      image() { throw new Error('Add image assets explicitly before including them in the offline reader'); },
      html({text}) {
        return text.replace(/<[^>]*>/g,tag=>/^<\/?(?:details|summary)\s*>$|^<br\s*\/?>$/i.test(tag)?tag:escapeHtml(tag));
      },
      code({text,lang}) {
        if((lang||'').trim()==='mermaid') {
          const item=diagrams[digest(text.trim())];
          if(!item||item.source!==text.trim()) throw new Error('Diagram changed; run python3 -B scripts/render-diagrams.py: '+entry.path);
          return '<figure class="diagram">'+item.svg+'<figcaption>关系与过程示意</figcaption></figure><details><summary>查看图表源代码</summary><pre><code>'+escapeHtml(text)+'</code></pre></details>';
        }
        return '<div class="code-block"><div class="code-label"><span>'+escapeHtml(lang||'输出 / 示例')+'</span><button type="button" data-copy-code>复制</button></div><pre tabindex="0"><code>'+escapeHtml(text)+'</code></pre></div>';
      }
    }});
    html=parser.parse(source).replace(/<table>/g,'<div class="table-wrap" tabindex="0" role="region" aria-label="可横向滚动的表格"><table>').replace(/<\/table>/g,'</table></div>');
  }
  const text=plain(html).replace(/\s+/g,' ').trim();
  documents.push({...entry,html,text,source,headings,minutes:Math.max(1,Math.ceil(source.replace(/\s/g,'').length/650))});
}

// Validate actual generated links and fragments before publishing.
const byPath=new Map(documents.map(doc=>[doc.path,doc]));
for(const doc of documents) for(const match of doc.html.matchAll(/href="(#doc=[^"]+)"/g)) {
  const route=new URLSearchParams(match[1].slice(1).replace(/&amp;/g,'&'));
  const target=byPath.get(route.get('doc'));
  if(!target) throw new Error('Missing bundled document: '+match[1]);
  if(route.has('section')&&!target.headings.some(h=>h.id===route.get('section'))) throw new Error('Missing heading: '+doc.path+' -> '+match[1]);
}
const core=read('site-src/core.mjs').replace(/^export /gm,'');
const app=read('site-src/app.js');
const css=read('site-src/styles.css');
const version=digest(JSON.stringify(documents)+core+app+css).slice(0,12);
const data={version,groups:catalog.groups,documents,repo:'https://github.com/zray0529-a11y/computing-learning-hub'};
const json=JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const html=read('site-src/template.html')
  .replace('/* STYLES */',()=>css)
  .replace('<!-- KNOWLEDGE_DATA -->',()=>'<script id="knowledge-data" type="application/json">'+json+'</script>')
  .replace('/* APP_SCRIPT */',()=>core+'\n'+app);
if(/<script[^>]+src=|<link[^>]+(?:stylesheet|preload)/i.test(html)) throw new Error('External runtime asset defeats offline delivery');
mkdirSync(path.join(root,'_site'),{recursive:true});
writeFileSync(path.join(root,'_site/index.html'),html);
writeFileSync(path.join(root,'_site/.nojekyll'),'');
console.log(JSON.stringify({documents:documents.length,chapters:14,architectureTopics:4,inlineDiagrams:Object.keys(diagrams).length,bytes:Buffer.byteLength(html),version}));
