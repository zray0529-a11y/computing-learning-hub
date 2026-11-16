# Interactive knowledge atlas contract

The existing public reader gains `#atlas` with three views: graph, scenarios, history. Everything remains in the downloadable HTML. Public fictional examples only. No external runtime requests, accounts or analytics.

## Data

`atlas-data.mjs` exports `atlasCategories`, `atlasNodes`, `atlasEdges`, `atlasScenarios`.

- Category: `{id, label, color, summary}`. IDs: foundation, systems, intelligence, spatial.
- Node: `{id, label, category, chapter, summary, concrete, shape}`. `chapter` is an existing catalog path. `shape`: chip, stack, network, database, cube, building, document, brain, shield.
- Edge: `{from, to, type, why}`. `foundation`: from is a helpful learning foundation for to (not an absolute prerequisite); `uses`: from uses to; `collaboration`: cooperate, not dependency. `why` explains the specific relationship in Chinese.
- Scenario: `{id, title, subtitle, summary, boundary, steps:[{title, body, nodes:[id,...]}]}`. IDs: web, rag, twin. Every step uses existing node IDs. The node order is the narrative order, not necessarily a network protocol trace. Three fictional scenarios, 5–6 steps each.
- Fixed node IDs (39): bits, logic, computation, cpu, memory, program, abstraction, algorithm, data-structure, complexity, os, process, filesystem, network, http, api, database, index, transaction, git, testing, distributed, consistency, probability, vector, ml, transformer, llm, retrieval, rag, agent, security, observability, coordinates, graphics, bim, parametric, gis, twin.

`atlas-history.mjs` exports `atlasHistory`: array of `{id, year, dateLabel, title, problem, contribution, connection, nodes:[id,...], sources:[{title,url}]}`. Chronological, 14–18 verified representative events, using primary or institutional original records. Dates anchor a publication/event, not exclusive invention claims. Cover foundational computing, systems/network/database, intelligence and spatial modeling. Date label may distinguish receipt/publication year. No unsourced historical influence claims.

## Three.js renderer

`atlas-scene.mjs` exports `createAtlasScene(host,{atlas,onSelect,onError})`. `atlas` contains `{categories,nodes,edges,scenarios,history}`. `onSelect(id)` selects a concept. Three.js r180 + OrbitControls will be available synchronously as `window.KnowledgeThree`, with all exports combined. No external imports in this module. Do not access it until function invocation.

Returns `{update(view),reset(),zoom(factor),dispose()}`. `update` takes `{mode:'graph'|'scenario'|'history', selectedId, visibleIds:[id,...], focusIds:[id,...], scenarioId, step:number, eventId}`. In graph mode visibleIds is filtered nodes, focusIds selected+neighbors. In scenario mode, arrange the union of scenario nodes as concrete recognizable models, highlight current step's focusIds. In history mode arrange all currently visibleIds in a readable spatial timeline; selected event nodes are focusIds. Renderer may use eventId and atlas.history for labels/milestones. `zoom(factor)` factor <1 zooms in; >1 zooms out.

Host is `.atlas-stage`, position:relative, with a definite responsive height. Renderer creates a canvas + projected HTML labels/buttons in its own wrapper. CSS classes `atlas-scene`, `atlas-node-label`, `is-selected`, `is-focused`, `is-muted`, `atlas-district-label` are available. Labels must be clickable and legible; avoid rendering 39 overlapping labels by hiding nonfocus labels when a concept is selected. HTML list outside scene is the equivalent accessible full navigation.

Three.js scene must show actual spatial geometry and directional edges where meaningful; stable positions, render on demand, no automatic spin, DPR≤1.5, resize handling, bounded orbit/pan/zoom, reset view. Distinct concrete geometries for chips, database cylinders, stacks, network hubs, buildings. `onError(message)` is called for missing WebGL2/context loss and UI switches to readable list. Free all geometries/materials/controls/events/observers on dispose and remove only renderer-owned elements. Catch startup error and return a safe no-op controller. Respect reduced motion (no automatic motion at all is fine).

Compatibility extension after observed browser limitation: if WebGL 2 is unavailable, use the official same-version SVGRenderer + Projector with the same scene, camera and OrbitControls, with Lambert materials and lower mesh subdivision. Mark renderer-owned wrapper `data-renderer="svg"` or `"webgl"`. Only both-path failures trigger onError and automatic text/list fallback. Both rendering modules are vendored and embedded offline.

Root owns UI, CSS, build integration, vendor files and tests. Content agents own only assigned data files. Renderer agent owns only atlas-scene.mjs. Do not change other owned files.
