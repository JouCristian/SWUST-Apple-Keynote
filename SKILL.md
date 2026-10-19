---
name: swust-apple-keynote
description: Create and refine Apple Keynote-inspired interactive HTML slide decks from topics, documents, or Markdown. Use for technical teaching, product presentations, content-aware motion, and SWUST visual storytelling with offline single-file delivery.
---

# SWUST Apple Keynote

Create an understandable presentation before choreographing it. Keep editable source separate from the offline sharing artifact. This is an HTML presentation skill; do not silently substitute a website or PPTX.

## Start from the content

1. Inspect the user's material and existing project. Identify audience, objective, duration, facts, source provenance, prerequisites, and missing evidence. Preserve current user choices. Historical examples provide design, not current names, dates, counts, or claims.
2. Read [content mapping](references/content-mapping.md) and [slide grammar](references/slide-grammar.md). Write a `storyboard.json` before coding: one communicative goal per slide, content relationship, primary object, layout, interaction, transition intent, and shared IDs. The agent makes semantic judgments; the renderer does not pretend to understand arbitrary prose.
3. Read [design system](references/design-system.md). Choose a coherent light/dark rhythm by chapter. Use typography, diagrams, and spacing before adding containers. Do not reduce required technical content to fit: split it or reveal steps. Define content-safe motion bounds, paired control colors and centered-control geometry before implementation; these enter the Visual Quality Gate below.

## Choose only the needed depth

- For provenance or matching a supplied deck, read [provenance](references/provenance.md); inspect authorized user-supplied material without modifying the originals.
- For motion, read [motion system](references/motion-system.md). Use Bézier for authored entrances; use a stateful Spring for direct manipulation and repeated retargeting. Preserve object identity and spatial direction. Design the result settlement as well as the main action: meaningful line/color/emphasis changes must interpolate, and replacement state text must fade out/in or crossfade rather than snap. Commit logical state at the correct event; keep visual settlement interruptible and immediate under reset/static/reduced motion.
- For glass, read [glass materials](references/glass-materials.md). Choose Stable Frosted, explicit-texture SVG Optical, or conditional WebGL Advanced honestly. Optical material needs an observable backdrop and real pixel-change validation. Never imply that WebGL automatically samples DOM. Advanced refraction is optional and must degrade.
- For controls, diagrams, terminal demos, and notes, read [interaction patterns](references/interaction-patterns.md).
- For maintaining or demonstrating the Skill itself, read the [capability matrix](references/capability-matrix.md). Use `assets/showcase/` as the maintained Living Showcase, not a universal deck layout. Its manifest maps each scene to actual specifications, implementation and browser evidence; retain Experimental labels where appropriate.
- Before implementation and delivery, read [engineering](references/engineering.md), [validation](references/validation.md) and [universal quality](references/universal-quality.md). The universal gate runs on every newly generated HTML PPT, not just the Skill Showcase.
- For the reasoning behind rules, read [research sources](references/research-sources.md). Numeric motion tokens here are local engineering choices, not Apple specifications.

## Build

`<skill>` means the directory containing this file. Create a new editable project without overwriting existing work:

```text
python "<skill>/scripts/scaffold.py" "<new-project>"
```

The scaffold supplies a minimal starter, the component runtime, and separate data/notes. Replace its starter content using the storyboard. Reuse or extend the components in `assets/templates/core/`; they are examples with real behavior, not a fixed slide count or mandatory layout. Use native HTML/CSS/JS/SVG and system fonts by default. Add libraries only when their concrete benefit outweighs the dependency.

Use the reusable `settlement.js` APIs (`mountText`, `mountVisual`, `Settlement`) for event-driven result feedback, and the semantic relation names exposed by `SceneMotion`. Preparation → Main Action → Semantic Commit → Visual Settlement → Stable State separates real logic from cosmetic completion. See [motion system](references/motion-system.md) for APIs and interruption ownership. Do not rebuild a second animation scheduler around these components.

Use `data-shared` only for the same logical object. A persistent overlay preserves its DOM identity between scenes; children must not teleport independently of their parent. Never use a random transition picker. Reverse navigation restores a preview state; it does not claim to reverse a real Git command or other external action.

Default 1920 × 1080 canvas, equal scale, visible focus, keyboard navigation, directory, notes, fullscreen, reset, projection note lock, and reduced motion. Keep component keys ahead of page keys. Disable hidden-page activity. Terminal code is displayed/copied, never executed. Label illustrative outputs and schematic diagrams. Real screenshots remain authentic; crop via presentation layout and keep full originals accessible.

## Validate and deliver

Apply the **Visual Quality Gate** during design, implementation and browser acceptance: (1) paired interactive contrast, (2) readable text on its actual composite, (3) spatial collision prevention through intermediate frames, (4) geometric alignment, (5) continuous motion and result settlement, (6) real material fidelity, (7) responsive safe bounds, (8) keyboard/reduced-motion accessibility, (9) bounded rendering performance. Every new deck follows content analysis → storyboard → implementation → build → universal browser gate → fix definite failures → rerun → deliver HTML and quality report. Do not wait for a user to request layout checks. ERROR is unexecuted/failed detection, REVIEW requires human judgment, SKIP is inapplicable, and none may be advertised as automatic PASS. Shared-core changes additionally require the 15-page/legacy regression fixtures and `showcase-visual-fixtures.cjs`.

```text
python "<skill>/scripts/build.py" "<project>/index.html" "<project>/share.html"
node "<skill>/scripts/validate-browser.cjs" --input "<project>/share.html" --report "<project>/qa/quality-report.json" --config "<project>/quality.config.json" --channel chrome --modules "<node_modules>"
```

Discover installed runtime paths in the current environment; do not bake a machine's path into generated projects. Also inspect screenshots, verify technical state transitions, and exercise the deck at 1920×1080, 1366×768, and 960×640. Inspect the frames after an action completes, including historical-line de-emphasis, text replacement, and result feedback; final screenshots alone cannot establish a smooth settlement. The bundled full regression suite covers the playground and demo; adapt custom assertions when adding new component behavior. Passing syntax checks alone is not visual or performance verification.

Deliver the offline single HTML, editable sources, notes, controls and the explainable quality report, including remaining REVIEW items. Add state/overlap/alignment declarations for nonstandard components rather than inserting their IDs into the universal engine. Validate the share HTML in isolation with network disabled. Explain missing assets or untested browsers precisely. Do not claim 60fps, universal aesthetic quality or optical accuracy without measurements. Publish externally only when requested. For distributing the Skill, use `package.py --slim`, stage safe copies, scan privacy, and verify the extracted ZIP before release. See [distribution](references/distribution.md).

## Design invariants

Clarity over decoration. Continuity over transition count. Stateful physics for direct manipulation. Motion expresses meaning. Stable spatial relationships. Useful interaction. Performance proportionate to value. Understand the content before choosing its form.

For extending this skill, use [maintenance and usage](README.md). No global skill or Codex configuration is changed by this package.
