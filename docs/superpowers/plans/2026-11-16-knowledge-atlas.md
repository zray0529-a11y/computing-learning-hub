# Knowledge atlas implementation plan

- [x] Verify and vendor official Three.js r180 runtime and OrbitControls with license and reproducible packaging.
- [x] Author and validate concept relationships, concrete scenarios and sourced historical anchors in parallel.
- [x] Implement on-demand Three.js scene and accessible HTML explorer with three modes.
- [x] Add navigation, homepage entry, route cleanup and offline build integration.
- [x] Check graph integrity, sourced dates, meaningful filtering, script syntax and existing reader regressions.
- [x] Independently review runtime and teaching semantics; fix material findings.
- [ ] Publish to the authorized GitHub Pages site with expected-head guard, verify workflow and live behavior.

Local verification: 19 Node tests passed; public curriculum verifier passed with no errors (19 snippets, 6 labs, 13 invariants, 335 local links). Independent content review corrected the concurrency definition and clarified twin scenario design wording. Independent runtime review corrected mode-specific initial selection, keyboard focus restoration and detail panel scroll reset. Full inline script compiles; upstream Three.js hashes and offline wrapper exports are verified. Renderer CPU geometry/lifecycle checks passed. Local Chromium launch was blocked by the environment's socket restriction, so actual GPU/OrbitControls visual verification remains for the live browser after deployment.
