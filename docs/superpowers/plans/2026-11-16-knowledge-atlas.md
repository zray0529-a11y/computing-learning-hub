# Knowledge atlas implementation plan

- [x] Verify and vendor official Three.js r180 runtime and OrbitControls with license and reproducible packaging.
- [x] Author and validate concept relationships, concrete scenarios and sourced historical anchors in parallel.
- [x] Implement on-demand Three.js scene and accessible HTML explorer with three modes.
- [x] Add navigation, homepage entry, route cleanup and offline build integration.
- [x] Check graph integrity, sourced dates, meaningful filtering, script syntax and existing reader regressions.
- [x] Independently review runtime and teaching semantics; fix material findings.
- [x] Publish to the authorized GitHub Pages site with expected-head guard, verify workflow and live behavior.

Local verification: 19 Node tests passed; public curriculum verifier passed with no errors (19 snippets, 6 labs, 13 invariants, 335 local links). Independent content review corrected the concurrency definition and clarified twin scenario design wording. Independent runtime review corrected mode-specific initial selection, keyboard focus restoration and detail panel scroll reset. Full inline script compiles; upstream Three.js hashes and offline wrapper exports are verified. Renderer CPU geometry/lifecycle checks passed.

Live verification: GitHub Pages build/deploy succeeded. The available browser could not create WebGL 2, so an official same-version SVGRenderer/Projector fallback was added. The actual browser now renders the Three.js graph, scenarios and history. Native pointer dragging changed the projected geometry; zoom, reset, model-label selection, concept filtering, scenario steps, timeline keyboard navigation, list/3D switching, keyboard focus preservation and returning to chapter diagrams were checked. Actual hardware WebGL rendering and mobile hardware touch input were not exercised in this environment. The real Three.js geometry, SVG renderer, Projector and OrbitControls also passed a CPU harness with pointer events and disposal checks; this is separate from GPU verification.
