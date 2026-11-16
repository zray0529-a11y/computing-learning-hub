# Three.js r180

Upstream: https://github.com/mrdoob/three.js/releases/tag/r180 (published 2025-09-03).

The five source files are unmodified copies retrieved from the official `r180` tag. `scripts/bundle-three.mjs` verifies upstream Git blob hashes and only wraps module imports/exports into a single classic script for offline HTML delivery. It does not change renderer or control logic. Full MIT license: `LICENSE-three.md`; also embedded into the generated HTML.

| Local file | Upstream path | Git blob SHA |
|---|---|---|
| three.core.min.js | build/three.core.min.js | 70c40977daa0f6e1e312c6b58e9bfe49cb5a87a4 |
| three.module.min.js | build/three.module.min.js | 20d3c112761a519c7780a5ccc9f72a40937fa83b |
| OrbitControls.js | examples/jsm/controls/OrbitControls.js | eea26706dae735dade19367026185f6e68f5cf55 |
| Projector.js | examples/jsm/renderers/Projector.js | 2d3882984412fc266e2e71d47308335a4eac8552 |
| SVGRenderer.js | examples/jsm/renderers/SVGRenderer.js | 87f0c08acd67b81ea0c485ff9e322bd0ac25b97b |

Documentation: https://threejs.org/docs/pages/WebGLRenderer , https://threejs.org/docs/pages/OrbitControls and https://threejs.org/docs/pages/SVGRenderer . The primary renderer uses WebGL 2. When a graphics context is unavailable, the same Three.js geometry and camera can use the SVG renderer. A text/list view remains available for accessibility and when both graphics paths fail.
