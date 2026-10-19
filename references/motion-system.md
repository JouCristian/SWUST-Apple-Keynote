# Motion system

## State, not queues

`Spring` stores position x, velocity v, target, stiffness k, damping c and mass m. Acceleration is `(-k*(x-target)-c*v)/m`. Integration uses small bounded substeps. `retarget()` changes target without resetting x or v. `jump()` is reserved for direct pointer tracking/reset/reduced motion; release passes measured pointer velocity into the same state. Settling requires both displacement and speed to be small, then stops RAF. Damping ratio `c/(2*sqrt(k*m))` explains oscillatory (<1), critical (=1), and overdamped (>1) behavior.

Default k=210, c=28, m=1 is a restrained starting point, not an Apple setting. Valid playground ranges k=50–500, c=5–60, m=0.5–3. Bound dt and substep to avoid large jumps after backgrounding. Cancel pointer capture and zero stale gesture velocity after interruption. On hidden documents settle active springs and stop callbacks; do not integrate hidden elapsed time on resume.

`SceneMotion` manages a stable list of slides and per-slide opacity/x/y/scale springs. Idle → Entering / Exiting → Active; a new request changes targets immediately and records Interrupted before returning to Entering. No navigation lock and no timeout queue. At rest only the target slide remains visible and accessible. Reverse retargets the same states. Shared objects live in a persistent overlay; their x/y/width/height/radius/opacity spring values survive scene changes. Offscreen placeholders reserve layout and accessibility descriptions.

Outgoing text alpha settles faster than incoming spatial movement (local k=600, c=45 for exit alpha). This reduces overlapping headings while a shared object crosses the frame. Opacity clamps to [0,1]; position/velocity remain continuous internally on reversal.

## Authored easing

**Spatial Collision Prevention:** declare a motion track separate from persistent explanatory text. `mountMorph` clamps rendered width/x to the host even if spring state overshoots; the same state/velocity still retargets continuously. Never compare logical offsets to viewport rectangles. Sample viewport-space rectangles each RAF through expand, reversal, burst and return at all target viewports. A safe endpoint does not prove a safe path. `morph-control-slot` keeps the original compact-height header stable while content reveals below; measure it rather than repositioning a button with a top offset. Morph button wording reuses `mountText` for result continuity.

| Function | Starting duration | Curve |
|---|---|---|
| Press | 90–160 ms | immediate compressed state, smooth release |
| Hover | 150–280 ms | emphasized out |
| Reveal | 250–450 ms | cubic-bezier(.16,1,.3,1) |
| Expand/collapse | 350–650 ms | Spring for retargetable surfaces |
| Slide | 550–900 ms target feel | Spring or cubic-bezier(.22,1,.36,1) |
| Chapter | 900–1400 ms authored pacing | staged content, not input blocking |

`cubic-bezier(.65,0,.35,1)` for deliberate symmetric travel; linear for sampled time/physical step interpolation only. No `transition: all`. Spring time is measured by settling, not forced to match a Bézier duration. Overshoot is mainly for direct interaction; never bounce paragraph text repeatedly.

## Semantic transition vocabulary

All names below are supported recipe names in `SceneMotion`; use a small subset per deck.

| Recipe | Relationship / action | Mechanism |
|---|---|---|
| soft-fade | unrelated concepts | short opacity change |
| cross-dissolve | comparison or same scope | overlapping opacity |
| shared | overview → same object detail | persistent shared object changes bounds |
| morph | same identity, changed container | position, size and corner continuity |
| push-in | enter a subsystem | incoming scale 0.92 → 1, outgoing moves closer |
| pull-back | return to overview | reverse scale relationship |
| spatial-slide | sequential step | stable horizontal direction |
| focus-shift | transfer attention | small depth/opacity change, no text blur |
| camera-pan | neighboring space | larger horizontal translation |
| camera-zoom | change system scale | centered scale transform |
| stagger | ordered explanation | children reveal with capped delays |
| path-draw | edge/flow emerges | SVG dash offset + node state |
| parallax | actual layer relationship | foreground/background unequal travel |
| scene-reset | chapter boundary | settle and dissolve into new spatial frame |
| reverse | explicit back intent | reverse the prior spatial recipe |

Set recipes in storyboard relationships, not by slide number or Math.random. Overview/detail needs matching shared IDs; without them fall back to a scale/fade, and do not call it a shared-object transition. Morph changes rectangular surface geometry; it is not arbitrary SVG path topology interpolation.

## SVG information growth

One stable path DOM node; normalized progress p drives `stroke-dashoffset = length*(1-p)`. Nodes appear when progress reaches them. Previous/next/reset change p target, so reversal draws back continuously. State descriptions must update consistently. A return to a prior illustrative state is labeled preview/replay, not command undo.

## Completion and result settlement

Treat a semantic action as preparation → main action → result settlement. Drawing an edge or moving an object is not the whole transition. Audit what changes when it ends: historical edges receding, arrowheads, label emphasis, node border/status color, replaced text, completion captions, and control availability. In normal motion mode, visible result changes should settle continuously rather than use an instantaneous class/text swap. Do not add effects to unchanged content.

- **Graphic continuity:** interpolate stroke/fill/color/opacity for the elements carrying the same meaning. An edge shaft, its arrowhead, and its label should recede together. Do not animate only the shaft and leave an abruptly changing arrowhead or caption. Declare specific CSS transition properties; never `transition: all`. Short fades or color transitions around 180–360 ms are a local starting range, not a required timing or Apple specification.
- **Replacement text:** transition the old and new visible text using a brief fade-out/in or a controlled crossfade in reserved bounds. Retain one accessible current value; visual outgoing copies are `aria-hidden`. Keep text sharp and the reading baseline stable. Avoid typewriter effects, repeated paragraph bouncing, or label reflow. Mere `textContent` assignment without visual continuity is insufficient for a meaningful in-place state change.
- **Semantic timing:** update the logical model, accessibility value, and control validity at the true event (e.g. packet arrival), independently of the cosmetic fade. The result must not be announced before the event or delayed until an animation callback. A completion fade must not prolong the simulated process, imply that the protocol is still in transit, or block the next action.
- **Interruption:** retarget colors from their rendered value; text transitions must cancel/replace only their own visual layers and end at the latest value. Bound outgoing layers and prevent stale completion callbacks from restoring old text. Reversal also settles emphasis smoothly. No accumulating timeouts or navigation lock.
- **Immediate modes:** reset, static/reduced motion, and hidden-document handling settle both the main action and all result feedback. Remove outgoing ghosts and stop pending visual work. Stable readable default styles must already describe the latest value when WAAPI is unavailable or cancelled.

For a process/state scene, record its completion trigger and resulting graphic/text changes in the storyboard. Validate the completion interval in the browser: confirm actual intermediate colors/opacity, the correct final state, interruption during the fade, and immediate reduced-motion/reset behavior. Merely finding a CSS `transition` declaration does not prove that it executes.

## Cancellation ownership

Components own listeners, springs and WAAPI animations. Retarget an existing animation or cancel only that component's old animation. Cleanup transient layers and remove persistent fill effects after finish. Page hidden, static mode, reduced-motion and reset settle immediately. Do not use stale completion callbacks to hide a newly active page. Timing and spring parameters are locally defined engineering choices derived from principles in [research](research-sources.md).

## Reusable implementation · 1.1

The event model is **Preparation → Main Action → Semantic Commit → Visual Settlement → Stable State**. Semantic Commit is an event, not an artificial delay. `arrival.js` demonstrates the complete cycle using the existing Spring scheduler; Before and After travel the same distance with the same parameters and commit at the same arrival threshold. Before deliberately settles instantly for comparison; After uses the shared feedback implementation.

Load classic scripts in order: `spring.js` → `motion.js` → `settlement.js` → `components.js` → optional `arrival.js` → `runtime.js`. The scaffold and maintained artifacts already use this order.

- `K.mountText(element)` returns `{set(value,{instant}), settle(), destroy(), active}`. It commits one accessible `data-value`/aria-label immediately, crossfades two fixed aria-hidden visual layers, and never queues obsolete content callbacks. Repeated replacement takes the dominant currently rendered outgoing layer; it does not promise arbitrary glyph morphing. Cancellation falls back to readable final CSS.
- `K.mountVisual(root, bindings, {initial})` binds a single existing Spring to numeric opacity or RGB colors. A binding is `{elements:[shaft,arrow], property:'stroke', from:'#007aff', to:'#9dbde3'}`. `set(progress,{instant})` retargets the same state/velocity; `settle()` and `destroy()` clean up. Color inputs are explicit `#RRGGBB` or RGB arrays. This is visual interpolation, not optical simulation.
- `new K.Settlement({root,text,bindings,initial,onCommit})` composes text and graphics. `commit(value,{label,emphasis,instant})` updates the semantic value and callback synchronously; `phase` reports visual settlement or stable state. `reset()` immediately restores the initial value; `settle()` keeps the latest value. No domain callback waits for a fade.
- `K.mountArrivalComparison(host)` in `arrival.js` provides real `play / interrupt / reverse / reset / settle / destroy` behavior. It is used unchanged by the Showcase and Playground. Reverse is a preview; its example is an abstract event, not a TCP simulator.
- `K.settleFeedback(root?)` settles only feedback owned by that subtree, or all feedback when omitted. `feedbackStats()` is a lifecycle diagnostic, not a memory or FPS benchmark. Page hiding and reduced/static mode settle owners. A scene change settles outgoing feedback before changing context.

`SceneMotion.go(index, relation, instant)` accepts `overview-detail`, `detail-overview`, `process-next`, `focus-transfer`, `chapter-boundary`. They map to distinct existing camera behaviors: push-in, pull-back, directional slide, lateral focus shift and restrained scene reset. Shared geometry remains in one persistent node. `data-shared-opacity` lowers a contextual object's weight without removing its identity. Scene rest now includes both scene and shared-object springs. Incoming headings reveal more slowly than outgoing headings fade, keeping the reading focus clear under reversal.

Each SceneMotion root is marked `data-scene-root`. Shared anchors and heading alpha belong to their nearest scene root; an outer presentation must not collect anchors or text owned by a nested camera study. This prevents duplicate shared objects, tiny text ghosts and competing opacity writers. Test rendered instance counts as well as persistent node references when nesting scenes.

`mountDrag` maps pointer coordinates through the actual logical-canvas scale. `mountMorph.reset()` jumps to the compact state, and `mountPath` now gives nodes a continuous opacity response near their progress boundary. `K.setReducedMotion(on)` provides an explicit local preference while continuing to respect the system preference.
