# Capability matrix / 1.0.0

Source: `assets/showcase/capability-manifest.json`. Verified means the stated Chrome behavioral/layout scope, not all browsers. Advanced explicit-texture refraction remains Experimental.

| Page | Capability / principle | Specification | Core implementation | Interaction / expected result | Status |
|---|---|---|---|---|---|
| 01 [meaning](../assets/showcase/index.html#1) | Object identity gives motion meaning | [design-system](design-system.md) | [motion.js](../assets/templates/core/motion.js) | focus shared object / Object relocates continuously | Verified |
| 02 [content](../assets/showcase/index.html#2) | Content relationship selects composition | [content-mapping](content-mapping.md) | [components.js](../assets/templates/core/components.js) | three content modes / Concept, process and comparison use different layouts | Verified |
| 03 [clarity](../assets/showcase/index.html#3) | Hierarchy reduces reading effort | [design-system](design-system.md) | [components.js](../assets/templates/core/components.js) | before/after / Same facts remain readable with deliberate hierarchy | Verified |
| 04 [material](../assets/showcase/index.html#4) | Material separates controls from content | [glass-materials](glass-materials.md) | [refraction.js](../assets/templates/core/refraction.js), [components.js](../assets/templates/core/components.js) | five optical parameters / real SVG and conditional textured WebGL | Experimental |
| 05 [physics](../assets/showcase/index.html#5) | Direct manipulation preserves velocity | [motion-system](motion-system.md) | [spring.js](../assets/templates/core/spring.js), [components.js](../assets/templates/core/components.js) | drag/release/k/c/m / Actual damping and trajectory change | Verified |
| 06 [timing](../assets/showcase/index.html#6) | Authored time and stateful physics differ | [motion-system](motion-system.md) | [spring.js](../assets/templates/core/spring.js), [motion.js](../assets/templates/core/motion.js) | replay and bezier controls / Equal displacement; distinct trajectories | Verified |
| 07 [identity](../assets/showcase/index.html#7) | One object survives expansion | [motion-system](motion-system.md) | [components.js](../assets/templates/core/components.js) | expand/reverse / DOM identity, position, size and radius persist | Verified |
| 08 [camera](../assets/showcase/index.html#8) | Content relationships choose camera behavior | [motion-system](motion-system.md) | [motion.js](../assets/templates/core/motion.js) | four semantic relationships / Distinct shared geometry/focus/chapter behavior | Verified |
| 09 [growth](../assets/showcase/index.html#9) | Visible growth explains order | [interaction-patterns](interaction-patterns.md) | [components.js](../assets/templates/core/components.js) | next/previous/reset / Stable SVG grows and reverses | Verified |
| 10 [settlement](../assets/showcase/index.html#10) | Semantic event and visual settlement are separate | [motion-system](motion-system.md) | [settlement.js](../assets/templates/core/settlement.js), [arrival.js](../assets/templates/core/arrival.js) | replay/interrupt/reverse/reset / After interpolates line/head/text/result after commit | Verified |
| 11 [response](../assets/showcase/index.html#11) | Feedback belongs to the action | [interaction-patterns](interaction-patterns.md) | [components.js](../assets/templates/core/components.js), [settlement.js](../assets/templates/core/settlement.js) | press/segment/slider/capsule/card / Each control produces immediate meaningful feedback | Verified |
| 12 [state](../assets/showcase/index.html#12) | Only valid edges change the model | [interaction-patterns](interaction-patterns.md) | [components.js](../assets/templates/core/components.js), [settlement.js](../assets/templates/core/settlement.js) | ready/start/complete/reset / Illegal actions rejected; visual feedback follows model | Verified |
| 13 [pressure](../assets/showcase/index.html#13) | Newest intent retargets the same state | [motion-system](motion-system.md) | [spring.js](../assets/templates/core/spring.js) | four targets and bounded burst / Position/velocity continuous; no queue | Verified |
| 14 [access](../assets/showcase/index.html#14) | Accessibility is an operating mode | [engineering](engineering.md) | [spring.js](../assets/templates/core/spring.js), [runtime.js](../assets/templates/core/runtime.js), [settlement.js](../assets/templates/core/settlement.js) | reduced/static/opaque/sample / Correct stable state without decorative work | Verified |
| 15 [evolve](../assets/showcase/index.html#15) | Capabilities evolve through evidence | [validation](validation.md) | [components.js](../assets/templates/core/components.js) | replay workflow/revisit / A six-stage workflow connects evidence back to design | Verified |

## Incremental update loop

1. Snapshot the current sources and record protected-original hashes.
2. Match changed core/specification files against the manifest to identify affected scenes.
3. Change the implementation, its deterministic example and the relevant regression assertion together.
4. Build all four offline artifacts; keep old coverage and add behavior evidence for changed capability.
5. Promote only verified scope; preserve Experimental labels. The release report rejects stale artifact hashes.
6. Inspect motion and result settlement manually, then record a concrete next improvement.

Human review: [manual guide](manual-visual-review.md). Current evidence is regenerated under ignored `qa/`: `swust-keynote-showcase-quality.json`, `showcase/behavior-report.json`, `showcase/legacy-layout/report.json` and `visual-quality/report.json`. The compact public record is [acceptance](../audit/ACCEPTANCE.md).
