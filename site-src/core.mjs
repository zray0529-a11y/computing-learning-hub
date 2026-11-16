export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

export function headingSlug(text) {
  return String(text).toLowerCase().trim().replace(/[^\p{L}\p{N}\p{M}_\s-]/gu, '').replace(/\s/g, '-');
}

export function resolveLink(sourcePath, href, knownPaths) {
  const raw = String(href || '').trim();
  if (/^(https?:\/\/|mailto:)/i.test(raw)) return raw;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//') || raw.startsWith('/')) return null;
  const hashIndex = raw.indexOf('#');
  let path = hashIndex < 0 ? raw : raw.slice(0, hashIndex);
  let anchor = hashIndex < 0 ? '' : raw.slice(hashIndex + 1);
  try { path = decodeURIComponent(path); anchor = decodeURIComponent(anchor); } catch { return null; }
  if (path.includes('?') || path.includes('\\')) return null;
  let target = sourcePath;
  if (path) {
    const parts = sourcePath.split('/').slice(0, -1);
    for (const part of path.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') { if (!parts.length) return null; parts.pop(); }
      else parts.push(part);
    }
    target = parts.join('/');
  }
  if (!knownPaths.has(target)) return null;
  return '#doc=' + encodeURIComponent(target) + (anchor ? '&section=' + encodeURIComponent(anchor) : '');
}

export function searchDocuments(documents, query) {
  const terms = String(query).normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const found = [];
  for (const doc of documents) {
    const title = doc.title.normalize('NFKC').toLowerCase();
    const body = doc.text.normalize('NFKC').toLowerCase();
    if (!terms.every(term => (title + '\n' + body).includes(term))) continue;
    const score = terms.reduce((n,term)=>n+(title.includes(term)?100:0)+(body.includes(term)?5:0),0);
    const position = Math.max(0, body.indexOf(terms.find(term=>body.includes(term)) || terms[0]));
    const start = Math.max(0, position - 34);
    const excerpt = (start ? '…' : '') + doc.text.slice(start, start+150).replace(/\s+/g,' ') + (start+150<doc.text.length?'…':'');
    found.push({path:doc.path,title:doc.title,group:doc.group,score,excerpt});
  }
  return found.sort((a,b)=>b.score-a.score);
}

export function restoreProgress(raw, knownPaths) {
  const fresh = {read:[],bookmarks:[],last:null,positions:{},views:{},cards:{},theme:'dark'};
  let parsed;
  try { parsed=JSON.parse(raw); } catch { return fresh; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fresh;
  for (const key of ['read','bookmarks']) {
    if (Array.isArray(parsed[key])) fresh[key]=[...new Set(parsed[key].filter(path=>typeof path==='string'&&knownPaths.has(path)))];
  }
  if (knownPaths.has(parsed.last)) fresh.last=parsed.last;
  if (parsed.theme==='dark'||parsed.theme==='light') fresh.theme=parsed.theme;
  if (parsed.positions && typeof parsed.positions==='object' && !Array.isArray(parsed.positions)) {
    for (const [path,fraction] of Object.entries(parsed.positions)) {
      if (knownPaths.has(path) && typeof fraction==='number' && Number.isFinite(fraction)) fresh.positions[path]=Math.max(0,Math.min(1,fraction));
    }
  }
  if(parsed.views&&typeof parsed.views==='object'&&!Array.isArray(parsed.views)) {
    for(const [path,view] of Object.entries(parsed.views))if(knownPaths.has(path)&&['visual','full'].includes(view))fresh.views[path]=view;
  }
  if(parsed.cards&&typeof parsed.cards==='object'&&!Array.isArray(parsed.cards)) {
    for(const [path,card] of Object.entries(parsed.cards))if(knownPaths.has(path)&&typeof card==='string'&&/^(?:overview|step-\d{1,2}|practice|analogy|boundary|check|next)$/.test(card))fresh.cards[path]=card;
  }
  return fresh;
}
