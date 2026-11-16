# Visual lesson authoring contract

Each module exports `export const lessons = [...]` and contains original, source-grounded Chinese teaching content. One object per assigned chapter:

```js
{
 path: 'docs/chapters/01-computation.md',
 title: '四个开关，怎样表示一个数字？', // a concrete short question
 intro: 'One sentence that answers the question, not an abstract slogan.',
 diagramLabel: 'Describe the diagram for screen readers, including relationships.',
 svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" role="img" aria-label="...">...</svg>',
 steps: [ { title: 'Short step', body: 'Up to 70 Chinese characters explaining what changes or relates.', focus: ['unique-node-key'] } ],
 analogy: { title: 'Optional analogy title', body: 'The actual correspondence, up to 70 characters.', limit: 'Where the analogy stops, up to 70 characters.' },
 misconception: { wrong: 'A common mistaken inference, short.', right: 'The correction, up to 90 characters.' },
 check: { prompt: 'One transfer/prediction question', options: [ {text:'Answer',correct:true,feedback:'Explain why'}, {text:'Distractor',correct:false,feedback:'Specific correction'}, {text:'Distractor',correct:false,feedback:'Specific correction'} ] },
 related: ['docs/chapters/02-hardware.md'],
 lab: 'bits' // optional, only first computation='bits', database='transaction', LLM/RAG='retrieval'
}
```

3 or 4 steps; exactly 3 options and exactly one correct. Read the assigned existing chapter fully. Claims must remain within its teaching scope and cite its same source context via the full-text link the reader provides. No personal/company/project facts.

## Diagram design

- These are mechanism diagrams, NOT just 4 boxes of prose or stock pictures. Draw memory cells, array positions, physical component silhouettes, tables, queues, coordinate axes, model/datum relationships as relevant. Keep each diagram visually different where the mechanism differs.
- Use width 800, height 400–460. Keep all marks between x=16..784 and y=16..height-16. Main text >=21px, annotations >=17px. At most 14 Chinese characters on a main line, 22 on a small line. Avoid overlap; put labels on multiple lines via text/tspan where useful.
- Use `<g data-node="key" class="v-node">...</g>` around independently highlighted units. Steps focus only existing keys. Everything remains visible in overview. Do not assign interactive semantics to SVG; buttons outside control focus.
- Allowed tags: svg,g,rect,path,line,polyline,polygon,circle,ellipse,text,tspan,defs,marker,title,desc. No scripts/styles/events/href/image/use/foreignObject/external assets. Marker ids must have a unique chapter prefix. Use direct fill/stroke or CSS classes below; avoid SVG filters and gradients.
- Shared CSS classes: `v-box` neutral surface box; `v-green`, `v-blue`, `v-orange`, `v-purple` tinted fills and strokes; `v-label` 22px semibold fill text; `v-small` 18px fill muted; `v-tiny` 17px fill muted; `v-big` 36px semibold fill text; `v-mono` 20px monospace fill text; `v-line` stroke neutral 2 no fill; `v-dashed` dashed neutral line; `v-arrow` neutral 2px no fill. Text classes define fill only as indicated. For contrasting text use v-label. Set x,y,text-anchor on each text explicitly.
- Explicit fill='none' for strokes/circuits. Use rounded corners 10–18, ample whitespace, no decorative images. Shape color classes are overridden safely for dark theme.
- Use marker-end='url(#PREFIX-arrow)' if needed, define it in the same SVG with `<marker id="PREFIX-arrow" ...><path ... fill="currentColor"/></marker>`. Or draw an explicit arrowhead polygon.
- No build/test/frontend edits. Only edit your assigned module. Do not commit: root integrates and commits together. Return lesson paths, main diagram ideas, any concerns.
