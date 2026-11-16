(() => {
  'use strict';
  // Capture the public template before inserting any device-local reading state.
  const pristineHtml='<!doctype html>\n'+document.documentElement.outerHTML;
  const data=JSON.parse(document.getElementById('knowledge-data').textContent);
  const docs=data.documents;
  const byPath=new Map(docs.map(doc=>[doc.path,doc]));
  const known=new Set(byPath.keys());
  const groups=new Map(data.groups.map(group=>[group.id,group.label]));
  const chapters=docs.filter(doc=>doc.group==='chapters'&&doc.number);
  const topics=docs.filter(doc=>doc.group==='architecture'&&doc.number);
  const storageKey='computing-learning-hub.reader.v1';
  let memoryOnly=false;
  let stored=null;
  try { stored=localStorage.getItem(storageKey); } catch { memoryOnly=true; }
  const state=restoreProgress(stored,known);
  let activeDoc=null;
  let restoring=false;
  let scrollTimer=null;
  let toastTimer=null;
  let tocObserver=null;
  const content=document.getElementById('content');
  const dialog=document.getElementById('search-dialog');
  const searchInput=document.getElementById('search-input');
  const icons={
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUp:'<path d="M7 17 17 7M7 7h10v10"/>',
    home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    bookmark:'<path d="M6 3h12v18l-6-4-6 4Z"/>',
    book:'<path d="M3 4h6a4 4 0 0 1 3 1.4A4 4 0 0 1 15 4h6v15h-6a4 4 0 0 0-3 1.4A4 4 0 0 0 9 19H3Z"/><path d="M12 5.4v15"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
    layers:'<path d="m3 7 9-4 9 4-9 4ZM3 12l9 4 9-4M3 17l9 4 9-4"/>',
    flask:'<path d="M9 3h6M10 3v6l-6 10a1.4 1.4 0 0 0 1.3 2h13.4a1.4 1.4 0 0 0 1.3-2L14 9V3M7 15h10"/>',
    library:'<path d="M4 4h4v16H4ZM10 4h4v16h-4ZM17 4l4 15-3 1-4-15Z"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.5"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    moon:'<path d="M20.5 13.4A8.6 8.6 0 0 1 10.6 3.5a8.8 8.8 0 1 0 9.9 9.9Z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    download:'<path d="M12 3v12M7 10l5 5 5-5M4 16v5h16v-5"/>',
    github:'<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-2.8c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.3 4a5 5 0 0 0-.1-3s-1.2-.4-4 1.5a14 14 0 0 0-7 0C5.4.6 4.2 1 4.2 1a5 5 0 0 0-.1 3A5.4 5.4 0 0 0 2.6 8.2c0 5.4 3.5 6.6 6.8 7a3.5 3.5 0 0 0-1 2.8v4"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    building:'<path d="M4 21V7l8-4v18M12 9h8v12M2 21h20M7 9h1M7 13h1M7 17h1M15 12h2M15 16h2"/>',
    nodes:'<rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="15" width="6" height="6" rx="1"/><rect x="2" y="15" width="6" height="6" rx="1"/><path d="M5 9v6M8 6h6a5 5 0 0 1 5 5v4M8 18h8"/>',
    map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16M15 5v16"/>',
    cube:'<path d="m12 2 9 5v10l-9 5-9-5V7ZM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5"/>',
    spark:'<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3ZM20 2v4M18 4h4"/>',
    shield:'<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6Z"/><path d="m8 12 3 3 5-6"/>'
  };
  const icon=(name,cls='')=>'<svg class="'+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[name]||icons.book)+'</svg>';
  const route=(path,section='')=>'#doc='+encodeURIComponent(path)+(section?'&section='+encodeURIComponent(section):'');
  const esc=escapeHtml;
  function hydrateIcons(root=document) { root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);}); }
  function save() {
    try {localStorage.setItem(storageKey,JSON.stringify(state));}
    catch {memoryOnly=true;}
  }
  function toast(message) {
    clearTimeout(toastTimer);
    const el=document.getElementById('toast');
    el.textContent=message;el.classList.add('visible');
    toastTimer=setTimeout(()=>el.classList.remove('visible'),3200);
  }
  function setTheme() {
    document.documentElement.dataset.theme=state.theme;
    const toggle=document.getElementById('theme-toggle');
    toggle.innerHTML=icon(state.theme==='dark'?'sun':'moon');
    toggle.setAttribute('aria-label',state.theme==='dark'?'切换为浅色主题':'切换为深色主题');
  }
  function renderNav() {
    document.getElementById('course-nav').innerHTML=data.groups.map(group=>{
      const links=docs.filter(doc=>doc.group===group.id&&!doc.hidden).map(doc=>
        '<a class="nav-link'+(activeDoc===doc.path?' active':'')+'" href="'+route(doc.path)+'"'+(activeDoc===doc.path?' aria-current="page"':'')+'>'+
        (doc.number?'<span class="nav-number">'+doc.number+'</span>':'')+
        '<span>'+esc(doc.title)+'</span>'+(state.read.includes(doc.path)?'<span class="nav-read" aria-label="已读">✓</span>':'')+'</a>').join('');
      return '<section class="nav-group"><h2 class="nav-group-heading">'+icon(group.icon)+esc(group.label)+'</h2>'+links+'</section>';
    }).join('');
    const home=document.querySelector('a.home-nav');
    home.classList.toggle('active',!activeDoc&&location.hash!=='#bookmarks');
    if(!activeDoc&&location.hash!=='#bookmarks')home.setAttribute('aria-current','page');else home.removeAttribute('aria-current');
    document.getElementById('bookmark-count').textContent=state.bookmarks.length;
    document.getElementById('show-bookmarks').classList.toggle('active',location.hash==='#bookmarks');
  }
  function courseRow(doc) {
    const read=state.read.includes(doc.path);
    return '<a class="course-row'+(read?' read':'')+'" href="'+route(doc.path)+'"><span class="course-index">'+(read?'✓':esc(doc.number||'↗'))+'</span><div class="course-body"><h3 class="course-title">'+esc(doc.title)+'</h3><p class="course-description">'+esc(doc.description||groups.get(doc.group)||'')+'</p></div>'+icon('arrow','course-arrow')+'</a>';
  }
  function renderHome() {
    document.title='计算机学习知识库 · 从理解到实践';
    document.getElementById('breadcrumb-current').textContent='学习首页';
    const resume=byPath.get(state.last);
    const first=chapters[0];
    const readCount=chapters.filter(doc=>state.read.includes(doc.path)).length;
    const preview=[['01','表示与计算','让信息成为可以处理的数据',chapters[0].path],['02','程序与系统','理解软件怎样运行与协作',chapters[2].path],['03','数据与智能','从存储、检索到模型与 Agent',chapters[6].path],['04','空间与应用','把知识带回真实问题',topics[0].path]];
    content.innerHTML='<div class="home-wrap">'+
      '<section class="home-hero"><div class="hero-text"><div class="section-eyebrow"><span class="status-dot"></span> 从 0 与 1，到 AGENT</div><h1>把计算机知识，<br>变成<em>能用的能力。</em></h1><p class="hero-description">一份从基础到应用的开放学习指南。<br>理解原理，动手验证，再用自己的话讲清楚。</p><div class="hero-buttons"><a class="primary-button" href="'+route(first.path)+'">开始学习'+icon('arrow')+'</a><a class="text-link" href="'+route('docs/02-history-and-map.md')+'">先看看知识地图'+icon('arrowUp')+'</a></div></div>'+
      '<div class="path-preview"><div class="path-preview-title">一条清晰的学习路径</div><div class="path-steps">'+preview.map(p=>'<a class="path-step" href="'+route(p[3])+'"><span class="path-step-circle">'+p[0]+'</span><span><strong>'+p[1]+'</strong><small>'+p[2]+'</small></span></a>').join('')+'</div></div></section>'+
      '<div class="hero-stats"><div class="stat"><strong>14</strong><span>基础课程</span></div><div class="stat"><strong>04</strong><span>建筑与空间专题</span></div><div class="stat"><strong>06</strong><span>动手实验</span></div><div class="stat"><strong>12</strong><span>周建议计划</span></div></div>'+
      '<section aria-labelledby="today-title"><div class="section-heading"><div><h2 id="today-title">今天，从哪里开始？</h2><p>按顺序打基础，也可以从一个问题切入。</p></div></div><div class="quick-grid">'+
      '<a class="quick-card featured" href="'+route(resume?resume.path:first.path)+(resume?'&resume=1':'')+'"><div class="quick-card-icon">'+icon(resume?'clock':'book')+'<span>'+(resume?'继续阅读':'第一次来')+'</span></div><h3>'+esc(resume?resume.title:'从第一章开始')+'</h3><p>'+(resume?'回到上次停下的位置，接着往下学。':'从一个最小实验，认识计算、逻辑与信息。')+'</p>'+icon('arrow','quick-card-arrow')+'</a>'+
      '<button class="quick-card" type="button" data-search><div class="quick-card-icon">'+icon('search')+'<span>随时查阅</span></div><h3>查一个概念</h3><p>API、数据库、RAG…<br>从全库正文找到解释。</p>'+icon('arrow','quick-card-arrow')+'</button>'+
      '<a class="quick-card" href="'+route('docs/04-learning-plan.md')+'"><div class="quick-card-icon">'+icon('compass')+'<span>循序渐进</span></div><h3>跟着 12 周计划学</h3><p>每周一个重点，<br>把理解变成可验证的进步。</p>'+icon('arrow','quick-card-arrow')+'</a></div></section>'+
      '<section aria-labelledby="courses-title"><div class="section-heading"><div><h2 id="courses-title">计算机基础</h2><p>从底层原理到智能系统，逐步连接你的知识。</p></div><span class="section-kicker">已读 '+readCount+' / 14</span></div><div class="course-grid">'+chapters.map(courseRow).join('')+'</div></section>'+
      '<section aria-labelledby="architecture-title"><div class="section-heading"><div><h2 id="architecture-title">在建筑与空间中应用</h2><p>用熟悉的专业问题，练习新的计算机方法。</p></div><a class="text-link" href="'+route('architecture/README.md')+'">专题导读'+icon('arrow')+'</a></div><div class="architecture-grid">'+topics.map((doc,i)=>'<a class="architecture-card" href="'+route(doc.path)+'"><div class="architecture-icon">'+icon(['building','nodes','map','cube'][i])+'</div><h3>'+esc(doc.title)+'</h3><p>'+esc(doc.description)+'</p></a>').join('')+'</div></section>'+
      '<section class="method-banner">'+icon('spark')+'<div><h3>读懂之后，再向前一步。</h3><p>闭卷回忆 → 用自己的话解释 → 动手验证 → 间隔复习。<br>让“看过了”，慢慢变成“能做出来”。</p></div><a class="text-link" href="'+route('docs/03-learning-method.md')+'">学习方法'+icon('arrow')+'</a></section>'+
      '<p class="home-note">'+icon('shield')+'阅读位置、收藏和已读标记只保存在当前浏览器；“已读”不代表已掌握。'+(location.protocol==='file:'?' 你正在使用离线文件。':'')+'</p></div>';
  }
  function tocMarkup(doc) {
    return doc.headings.filter(h=>h.depth===2||h.depth===3).map(h=>'<a class="toc-link depth-'+h.depth+'" href="'+route(doc.path,h.id)+'" data-heading="'+esc(h.id)+'">'+esc(h.text)+'</a>').join('');
  }
  function renderDocument(doc) {
    document.title=doc.title+' · 计算机学习知识库';
    document.getElementById('breadcrumb-current').textContent=doc.title;
    const read=state.read.includes(doc.path);
    const bookmarked=state.bookmarks.includes(doc.path);
    const siblings=docs.filter(d=>d.group===doc.group&&!d.hidden&&(doc.number?d.number:true));
    const current=siblings.findIndex(d=>d.path===doc.path);
    const previous=current>0?siblings[current-1]:null;
    const next=current>=0?siblings[current+1]:null;
    const toc=tocMarkup(doc);
    content.innerHTML='<div class="reading-layout"><div class="reading-main">'+
      '<div class="article-tools"><div class="article-category">'+esc(groups.get(doc.group))+'<span class="article-minutes">约 '+doc.minutes+' 分钟 · 可离线阅读</span></div><div class="article-actions">'+
      '<button type="button" class="small-action'+(bookmarked?' selected':'')+'" id="bookmark-page" aria-pressed="'+bookmarked+'">'+icon('bookmark')+(bookmarked?'已收藏':'收藏')+'</button>'+
      '<button type="button" class="small-action'+(read?' selected':'')+'" id="mark-read" aria-pressed="'+read+'">'+icon('check')+(read?'已读':'标记已读')+'</button></div></div>'+
      (toc?'<details class="mobile-toc"><summary>本页目录</summary>'+toc+'</details>':'')+
      '<article class="prose" id="article">'+doc.html+'</article>'+
      '<div class="article-end"><div class="article-end-top"><p>试着合上页面，用自己的话讲清一个要点。</p><button class="secondary-button" type="button" data-mark-read>'+icon('check')+(read?'已标记读过':'标记本篇已读')+'</button></div>'+
      '<div class="page-neighbors">'+(previous?'<a class="page-neighbor" href="'+route(previous.path)+'"><small>← 上一篇</small><strong>'+esc(previous.title)+'</strong></a>':'<span></span>')+(next?'<a class="page-neighbor next" href="'+route(next.path)+'"><small>下一篇 →</small><strong>'+esc(next.title)+'</strong></a>':'<a class="page-neighbor next" href="#home"><small>回到学习首页 →</small><strong>继续探索知识库</strong></a>')+'</div>'+
      '<div class="reading-source"><button type="button" data-download-source>下载本页'+(doc.path.endsWith('.md')?' Markdown':'原文')+'</button><a href="'+data.repo+'/blob/main/'+doc.path.split('/').map(encodeURIComponent).join('/')+'" target="_blank" rel="noopener noreferrer">在 GitHub 查看源文件 ↗</a><span>内容来源与许可见页脚</span></div></div></div>'+
      (toc?'<aside class="reading-toc" aria-label="本页目录"><h2 class="toc-title">本页目录</h2>'+toc+'</aside>':'')+'</div>';
    if(tocObserver)tocObserver.disconnect();
    if('IntersectionObserver' in window) {
      tocObserver=new IntersectionObserver(entries=>{
        const visible=entries.filter(entry=>entry.isIntersecting);
        if(!visible.length)return;
        const id=visible[0].target.id;
        content.querySelectorAll('.toc-link').forEach(link=>link.classList.toggle('current',link.dataset.heading===id));
      },{rootMargin:'-85px 0px -60% 0px'});
      content.querySelectorAll('.prose h2,.prose h3').forEach(heading=>tocObserver.observe(heading));
    }
  }
  function renderBookmarks() {
    document.title='我的收藏 · 计算机学习知识库';
    document.getElementById('breadcrumb-current').textContent='我的收藏';
    const saved=state.bookmarks.map(path=>byPath.get(path)).filter(Boolean);
    content.innerHTML='<div class="home-wrap"><div class="section-eyebrow">留给下一次深入阅读</div><div class="section-heading"><div><h2>我的收藏</h2><p>仅保存在当前浏览器，不上传，也不跨设备同步。</p></div><span class="section-kicker">'+saved.length+' 篇</span></div>'+
      (saved.length?'<div class="course-grid">'+saved.map(courseRow).join('')+'</div>':'<div class="empty-state"><h2>先收藏一个想弄懂的问题</h2><p>阅读章节时，点击右上角“收藏”，就可以在这里再次找到它。</p><a class="primary-button" href="#home">浏览课程'+icon('arrow')+'</a></div>')+'</div>';
  }
  function rememberPosition() {
    if(!activeDoc||restoring)return;
    const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    state.positions[activeDoc]=Math.max(0,Math.min(1,window.scrollY/max));
    save();
  }
  function closeMenu() {
    document.body.classList.remove('nav-open');
    document.getElementById('menu-shade').hidden=true;
    document.getElementById('open-menu').setAttribute('aria-expanded','false');
    document.querySelector('.workspace').inert=false;
  }
  function renderRoute() {
    clearTimeout(scrollTimer);
    rememberPosition();
    closeMenu();
    if(dialog.open)dialog.close();
    const raw=location.hash.slice(1);
    const params=new URLSearchParams(raw);
    const requested=params.get('doc');
    const doc=byPath.get(requested);
    activeDoc=doc?doc.path:null;
    restoring=true;
    if(doc) {
      state.last=doc.path;save();renderDocument(doc);
    } else if(raw==='bookmarks')renderBookmarks();
    else if(requested) {
      document.getElementById('breadcrumb-current').textContent='未找到章节';
      content.innerHTML='<div class="home-wrap"><div class="empty-state"><h2>没有找到这个章节</h2><p>链接可能已发生变化，可以从目录重新进入。</p><a class="primary-button" href="#home">回到首页</a></div></div>';
    } else renderHome();
    renderNav();
    requestAnimationFrame(()=>{
      const section=params.get('section');
      const target=section?document.getElementById(section):null;
      if(target)target.scrollIntoView({behavior:'instant',block:'start'});
      else if(doc&&params.has('resume'))window.scrollTo({top:(state.positions[doc.path]||0)*Math.max(0,document.documentElement.scrollHeight-innerHeight),behavior:'instant'});
      else window.scrollTo({top:0,behavior:'instant'});
      requestAnimationFrame(()=>{restoring=false;});
    });
  }
  function updateReadingButtons() {
    const read=state.read.includes(activeDoc);
    const bookmarked=state.bookmarks.includes(activeDoc);
    const bookmark=document.getElementById('bookmark-page');
    const readButton=document.getElementById('mark-read');
    if(bookmark){bookmark.classList.toggle('selected',bookmarked);bookmark.setAttribute('aria-pressed',String(bookmarked));bookmark.innerHTML=icon('bookmark')+(bookmarked?'已收藏':'收藏');}
    if(readButton){readButton.classList.toggle('selected',read);readButton.setAttribute('aria-pressed',String(read));readButton.innerHTML=icon('check')+(read?'已读':'标记已读');}
    const bottom=content.querySelector('[data-mark-read]');
    if(bottom)bottom.innerHTML=icon('check')+(read?'已标记读过':'标记本篇已读');
    renderNav();
  }
  function toggleLocalList(key) {
    if(!activeDoc)return;
    const list=state[key];
    const index=list.indexOf(activeDoc);
    if(index<0)list.push(activeDoc);else list.splice(index,1);
    save();updateReadingButtons();
    const verb=key==='bookmarks'?'收藏':'已读标记';
    toast((index<0?'已保存':'已取消')+verb+(memoryOnly?' · 当前浏览器无法持久保存，仅本次有效':' · 仅保存在当前浏览器'));
  }
  function highlight(text,query) {
    const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if(!terms.length)return esc(text);
    const lower=text.toLowerCase();
    const positions=[];
    for(const term of terms) {
      let from=0;
      while(from<lower.length) {
        const at=lower.indexOf(term,from);if(at<0)break;
        positions.push([at,at+term.length]);from=at+term.length;
      }
    }
    positions.sort((a,b)=>a[0]-b[0]);
    let result='',cursor=0;
    for(const [start,end] of positions) {
      if(start<cursor)continue;
      result+=esc(text.slice(cursor,start))+'<mark>'+esc(text.slice(start,end))+'</mark>';cursor=end;
    }
    return result+esc(text.slice(cursor));
  }
  function search() {
    const query=searchInput.value;
    const results=document.getElementById('search-results');
    const status=document.getElementById('search-status');
    if(!query.trim()) {
      status.textContent='输入关键词，搜索全部教材正文';
      results.innerHTML='<div class="search-suggestions">可以从这些词开始<br>'+['API','数据库','RAG','坐标','间隔练习','参数化'].map(term=>'<button type="button" data-query="'+term+'">'+term+'</button>').join('')+'</div>';return;
    }
    const matches=searchDocuments(docs,query);
    status.textContent=matches.length?'找到 '+matches.length+' 篇相关内容'+(matches.length>30?' · 显示前 30 篇':''):'没有找到结果，试试更短的关键词或英文缩写';
    results.innerHTML=matches.slice(0,30).map(result=>'<a class="search-result" href="'+route(result.path)+'"><small>'+esc(groups.get(result.group))+'</small><h3>'+highlight(result.title,query)+'</h3><p>'+highlight(result.excerpt,query)+'</p></a>').join('');
  }
  function openSearch() {
    closeMenu();
    searchInput.value='';
    search();
    if(!dialog.open)dialog.showModal();
    searchInput.focus();
  }
  function download(filename,text,type) {
    const blob=new Blob([text],{type:type||'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;anchor.download=filename;document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  document.getElementById('offline-download').addEventListener('click',()=>{
    download('computing-learning-hub-offline.html',pristineHtml,'text/html;charset=utf-8');
    toast('已开始下载完整离线版 · 外部参考链接仍需联网');
  });
  document.getElementById('theme-toggle').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';setTheme();save();});
  document.getElementById('open-search').addEventListener('click',openSearch);
  document.getElementById('close-search').addEventListener('click',()=>dialog.close());
  document.getElementById('show-bookmarks').addEventListener('click',()=>{location.hash='bookmarks';closeMenu();});
  document.getElementById('open-menu').addEventListener('click',()=>{
    document.body.classList.add('nav-open');
    document.getElementById('menu-shade').hidden=false;
    document.getElementById('open-menu').setAttribute('aria-expanded','true');
    document.querySelector('.workspace').inert=true;
    document.getElementById('close-menu').focus();
  });
  document.getElementById('close-menu').addEventListener('click',()=>{closeMenu();document.getElementById('open-menu').focus();});
  document.getElementById('menu-shade').addEventListener('click',closeMenu);
  document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();document.getElementById('main').focus();});
  searchInput.addEventListener('input',search);
  searchInput.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){const first=document.querySelector('.search-result');if(first){event.preventDefault();first.focus();}}
    if(event.key==='Enter'){const first=document.querySelector('.search-result');if(first){event.preventDefault();first.click();}}
  });
  dialog.addEventListener('click',event=>{
    if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}
    const suggestion=event.target.closest('[data-query]');
    if(suggestion){searchInput.value=suggestion.dataset.query;search();searchInput.focus();}
    if(event.target.closest('.search-result'))dialog.close();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){if(document.body.classList.contains('nav-open')){closeMenu();document.getElementById('open-menu').focus();}return;}
    const editing=event.target.matches('input,textarea,[contenteditable="true"]');
    if((event.key==='/'&&!editing)||((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k')){event.preventDefault();openSearch();}
    if(event.key==='Tab'&&document.body.classList.contains('nav-open')) {
      const elements=[...document.getElementById('sidebar').querySelectorAll('a,button')].filter(el=>el.getClientRects().length);
      const first=elements[0],last=elements[elements.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  content.addEventListener('click',async event=>{
    if(event.target.closest('[data-search]'))openSearch();
    if(event.target.closest('#bookmark-page'))toggleLocalList('bookmarks');
    if(event.target.closest('#mark-read,[data-mark-read]'))toggleLocalList('read');
    if(event.target.closest('[data-download-source]')&&activeDoc){const doc=byPath.get(activeDoc);download(doc.path.split('/').pop(),doc.source);toast('已下载本页原文');}
    const copy=event.target.closest('[data-copy-code]');
    if(copy) {
      const code=copy.closest('.code-block').querySelector('code').textContent;
      try {
        if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(code);
        else {
          const box=document.createElement('textarea');box.value=code;box.style.position='fixed';box.style.opacity='0';document.body.append(box);box.select();
          const copied=document.execCommand('copy');box.remove();if(!copied)throw new Error('Unavailable');
        }
        toast('代码已复制');
      } catch {toast('当前浏览器不允许自动复制，请选中代码手动复制');}
    }
    const local=event.target.closest('a[href^="#doc="]');
    if(local) {const parent=local.closest('.mobile-toc');if(parent)parent.open=false;}
  });
  window.addEventListener('hashchange',renderRoute);
  window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(rememberPosition,350);},{passive:true});
  window.addEventListener('pagehide',rememberPosition);
  window.addEventListener('resize',()=>{if(innerWidth>760&&document.body.classList.contains('nav-open'))closeMenu();});
  hydrateIcons();setTheme();renderRoute();
})();
