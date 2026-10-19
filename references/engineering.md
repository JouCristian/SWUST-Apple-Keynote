# Engineering contracts

## Source and delivery

Use classic scripts at body end for reliable `file://` playback. Modules or fetch-loaded JSON require an appropriate bundler or server; do not pretend they are offline simply because files exist. `core/` separates spring, motion, components, presentation navigation, material study, and tokens. Deck text/layout/notes are independent. The final sharing artifact is built, not hand-maintained.

`scripts/build.py source/index.html destination/share.html` embeds CSS, static CSS URLs, classic scripts, and image/media src. Rejects CSS imports, modules, async/defer scripts and dynamic fetch/import to avoid false offline promises. Resolve dependencies first. It intentionally leaves ordinary anchors intact; those are optional navigation, not render dependencies. The standalone playground's cross-link to the other demo only works when both outputs are shipped together with rewritten links; build the two bundled pages using the commands in README.

`build-all.py` now builds Playground, Git Demo and `dist/swust-keynote-showcase.html`, and prepares the Showcase classic-script metadata from `version.json` plus `assets/showcase/capability-manifest.json`. Those JSON files are editable source data, not runtime fetch dependencies. The four dist files (including Glass Material Lab) are independently offline; their optional cross-links require neighboring files. `settlement.js` owns result feedback, `arrival.js` is a reusable demonstration component, and both reuse the Spring scheduler.

Public demos and core are authored project material; only system font references and authored SVG are distributed. User-supplied assets require their own redistribution review.

## Runtime layers

- Spring scheduler: one RAF, only active springs; small integration steps; retarget keeps velocity; settle stops scheduling.
- Scene controller: each slide has x/y/scale/alpha state. Old completion cannot hide a new target. Persistent shared registry maps semantic IDs to one node.
- Components: own springs and reset APIs. Use persistent SVG nodes for paths. Destroy detached component resources when replacing an entire deck.
- Navigation: native dialogs, accessible labels, event priority, explicit projection lock. No global wheel interception; scrolling in the playground remains normal.
- Rendering: final readable static state exists independently of WAAPI; absent animation API loses decoration only.

No intervals or infinite background animation. On document hide, settle springs and cancel WAAPI. Leaving an active diagram page settles its progress. Runtime projection view scales content equally; UI controls stay in viewport pixels. Fullscreen is user initiated and failure is reported.

## Performance and accessibility

Animate transforms/opacity where possible. Small morph containers use width/height so text stays legible, accepting local layout work; do not generalize to a whole scrolling app. Shared overlay has no pointer targets or duplicate accessibility text. Source anchors retain text descriptions. Active slide is accessible immediately; other slides inert. Focus is removed from outgoing slides; native dialogs restore their opener.

Reduced-motion and B/static set state without travel, including springs. Keep logical step text in reduced mode. Support keyboard-operated drag, segmented controls, native sliders and bounded steps. Missing image handler preserves a textual placeholder. A WebGL context failure/loss leaves a Stable material fallback; no business content depends on the Shader.

One-shot frame sampling is not a GPU benchmark. For an actual target device, capture a browser Performance trace, inspect long frames, paint and layer count; compare with glass disabled. A stable idle active-spring count is a lifecycle check, not a heap-memory measurement. Do not claim zero memory leaks without longer profiling.

## Extension contract

Before animating, declare paired colors, explicit motion-safe bounds and compact/header/control dimensions. Keep foreground/control opacity at 1; decorative layers may be translucent. Flex-center controls within the compact-height morph slot, never an unexplained top adjustment. Clamp rendered spring geometry to the motion host while retaining internal velocity. Keep notes outside that host.

`glass.css` and extended `refraction.js` add explicit-texture optics without removing the legacy procedural study. `build-all.py` also emits `glass-material-lab.html`. SVG samples a registered image; WebGL uploads a supplied Canvas/Image. Neither captures arbitrary DOM. Failure/loss of input or WebGL leaves Frosted fallback. Browser states, pixel changes, RAF collision samples and normalized gap measurements live in `qa/visual-quality/`, tied to artifact hashes.

Adding layout: keep domain CSS and content outside core, add storyboard metadata, then use shared IDs/recipe only when appropriate. Adding state component: model valid transitions, reset, keyboard and static state first, then motion. Adding recipe: implement both forward and reverse, retarget existing state, add regression and a playground example. Version any public API changes and regenerate dist artifacts. Do not patch historical example source to match the new engine.

## public distribution and universal gate

Use [distribution contracts](distribution.md) for staged public slim packaging, privacy, exact inventory and current scaffold checks. New generated decks always run [Universal Visual Quality](universal-quality.md); fixed-ID examples belong exclusively to case fixtures. Engine errors are ERROR; inconclusive visuals are REVIEW; neither is an automatic PASS.
