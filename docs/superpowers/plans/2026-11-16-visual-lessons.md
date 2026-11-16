# Visual Lessons Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Independent content authoring is delegated in disjoint files.

**Goal:** Replace text-first entry points with useful diagrams and small interactive explanations for all 18 core topics.

**Architecture:** Extend the existing dependency-free single-file reader with bundled lesson data, an inline visual renderer, and a visual/full reading mode. Keep existing source content, search, routes, progress and offline delivery.

**Tech Stack:** JavaScript, SVG, CSS, Node built-in test runner; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-visual-lessons-design.md`

## Global Constraints

- 14 foundation chapters and 4 architecture topics each receive a subject-specific diagram.
- All resources and interaction code remain inside the offline HTML file.
- Public source only; no personal records, private projects or external runtime assets.
- Existing source fragments and search links must open readable full content.
- No new dependencies; preserve the current GitHub Pages URL and deploy workflow.

## Review Focus

- SVG text and arrows must fit their geometry, including light/dark and narrow screens.
- Steps reference actual diagram groups and represent an accurate process or relationship.
- Mode switching and fragment navigation must not hide the destination.
- Repeated interactions, reopening a topic and malformed local state must not break rendering.
- Downloading from a modified view must still export a pristine public template.

## Tasks

- [x] Author foundations, systems and architecture lesson modules using the shared content contract; review against existing chapters.
- [x] Add build-time coverage and SVG validation, learning interaction functions and focused regression tests. Observe failing tests before implementation.
- [x] Integrate diagram-first reading, the visual home atlas, focus steps, prediction feedback and three working demonstrations.
- [x] Preserve full text routing, search, offline export, reading controls and accessible keyboard behavior.
- [x] Run the Node tests and original Python curriculum verifier; independently review the change.
- [ ] Publish with a branch-head lease, verify GitHub build/deploy and exercise live reading and interactions.

## Progress

Implementation started from clean local commit `94c48b8`; remote `main` is `f56f63b6a1415654b4cd18d5a578569f1be827d6`. Isolated feature branch: `feat/visual-lessons`. User asked for this reversible published-site improvement; design choices are implementation judgments stated in the conversation.

Local verification: 12 Node tests passed; the original curriculum verifier reported 19 snippets, 6 labs, 13 invariants, 335 links and no errors. Independent runtime and teaching reviews completed; corrected reduced-motion scrolling, persistent live announcements, 3:4 coordinate scaling, window dimension bounds and crossing authorization arrows. Browser acceptance follows deployment.
