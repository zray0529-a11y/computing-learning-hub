# Pages Reader Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement the following tasks, then obtain one independent code review. Steps use checkbox syntax for tracking.

**Goal:** Publish the existing public curriculum as a responsive, searchable website with a complete downloadable offline reader.

**Architecture:** Explicit catalog selects the public source documents. A Node.js build using a vendored, licensed Markdown parser embeds rendered HTML and source text in one self-contained page. GitHub Pages receives the generated artifact through GitHub Actions.

**Tech Stack:** HTML, CSS, browser JavaScript, Node.js 22+, vendored marked 17.0.5, existing Python verification.

**Spec:** [Reader design](../specs/2026-11-16-pages-reader-design.md).

## Global Constraints

- Preserve the existing public teaching content and license boundaries.
- Include no personal information or private learning records in published files.
- No CDN, external fonts, paid services, database, or runtime model API.
- Support project subpaths, direct hash links, and downloaded file URLs.
- Only an explicit catalog may add content to the reader.

## Review Focus

- Relative links and Chinese heading fragments must reach their actual targets.
- All twenty-five folded answers and three diagrams must survive rendering.
- Body-only Chinese matches must be searchable without spaces.
- Denied or malformed local storage must not prevent reading.
- Offline export must include all content and no personal reading state.

## Task 1: Build the reader

**Files:** `site-src/catalog.json`, `site-src/core.mjs`, `site-src/app.js`, `site-src/styles.css`, `site-src/template.html`, `site-src/diagrams.json`, `site-src/vendor/marked.mjs`, `site-src/vendor/LICENSE-marked.md`, `scripts/build-site.mjs`, `tests/site.test.mjs`.

**Interfaces:** `resolveLink(sourcePath, href, knownPaths)` returns an internal hash route or safe external URL; `headingSlug(text)` returns a GitHub-compatible anchor; `searchDocuments(documents, query)` returns ranked matching documents. Build output embeds documents with `path`, `title`, `group`, `html`, `text`, `source`, and `headings`.

- [ ] Add focused tests for path normalization, actual Chinese fragments, body search, and malformed progress; observe missing behavior.
- [ ] Implement the catalog, renderer, self-contained responsive UI and offline download.
- [ ] Run `node --test tests/site.test.mjs`, `node scripts/build-site.mjs`, and `python3 -B scripts/verify.py`; all must pass.
- [ ] Inspect actual rendering, navigation, search, and narrow-screen overflow in the browser.

## Task 2: Publish and verify

**Files:** `.github/workflows/pages.yml`, `README.md`, `NOTICE.md`, `docs/index.md`, `docs/10-website.md`.

- [ ] Add the automatic build/deploy workflow and concise website maintenance instructions.
- [ ] Obtain an independent review; fix defects that block reading, content integrity, or publication.
- [ ] Upload a verified commit based on the current remote head, preserving all remote files.
- [ ] Enable Pages with the correct source, confirm deployment status, and open the live site.
- [ ] Deliver the verified website URL and explain online versus offline use.
