# Research log · 2026-10-17

The sources below were opened during creation. Video transcripts were used; no Apple media or fonts were downloaded or redistributed. HIG's motion page returned only its JavaScript shell to the retrieval tool, so detailed principles here rely on the accessible official WWDC transcripts. There is no claim of full HIG compliance.

## Apple official principles (paraphrased)

| Official source | What was actually established | Applied decision |
|---|---|---|
| [Designing Fluid Interfaces, WWDC18 / 803](https://developer.apple.com/videos/play/wwdc2018/803/) | Immediate response, interruption/redirection and direct manipulation matter beyond frame rate | No navigation lock; pointer follows input; release continues motion |
| [Animate with springs, WWDC23 / 10158](https://developer.apple.com/videos/play/wwdc2023/10158/) | Preserve position and velocity through gestures and retargeting; spring motion need not bounce | Stateful x/v solver; restrained damping; live k/c/m controls |
| [Meet Liquid Glass, WWDC25 / 219](https://developer.apple.com/videos/play/wwdc2025/219/) | Material belongs chiefly to floating navigation; avoid stacked glass; readability/adaptation and accessibility are fundamental | Opaque content, limited glass control layers, reduced/opaque modes |
| [Get to know the new design system, WWDC25 / 356](https://developer.apple.com/videos/play/wwdc2025/356/) | Concentric corners, consistent geometry, content-focused hierarchy and relationships between surfaces | Inner radius follows outer radius minus inset; detail remains linked to source |
| [Build a SwiftUI app with the new design, WWDC25 / 323](https://developer.apple.com/videos/play/wwdc2025/323/) | Native frameworks supply behaviors; toolbar/tab and scroll-edge structures need adaptation | Web implementation must explicitly implement behavior and fallback; cannot claim SwiftUI parity |
| [Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | Page located; full body unavailable through retrieval | Retained as a future reference, not cited for unobserved detailed rules |

## Patterns inferred from demonstrations

These are our interpretations, not quotations or universal Apple requirements: keep visual identity while a surface expands; slow the last part of a focus move; allow immediate retargeting during long visible movement; preserve spatial direction when returning to context; prefer restrained layer separation over arbitrary 3D rotation. These become optional scene recipes according to content relationships.

## Web and skill engineering sources

- [MDN Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API): timeline control and animation objects; this package tracks and cancels owned animations.
- [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API): transition snapshots are useful but platform support needs detection. This runtime uses a persistent overlay + Spring instead; it works without View Transitions, avoiding a second untested rendering path.
- [MDN easing-function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function): cubic Bézier describes progress; it does not maintain gesture velocity.
- [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events): unified input, capture and cancellation; used for drag/release rather than isolated mouse handlers.
- [web.dev animation performance](https://web.dev/articles/animations-guide): prefer transform/opacity and inspect expensive paint/layout. Small shared containers animate width/height deliberately; measure that cost, avoid full-screen blur.
- [Agent Skills specification](https://agentskills.io/specification): required SKILL.md metadata, naming and progressive disclosure. Used for name/description plus references/assets/scripts.
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills): project Skill discovery and user installation are separate scopes. Place the canonical Skill directory under `.agents/skills/` and follow the host agent's discovery instructions. Discovery behavior depends on the host and is separate from the package resource checks.

## Locally defined engineering choices

1920×1080, typography sizes, spacing, `.16,1,.3,1` / `.22,1,.36,1` / `.65,0,.35,1`, k=210/c=28/m=1, durations, state thresholds, the 15 recipe names and the 3 material tiers are package choices. Do not label them “Apple's official parameters.” CSS glass is an approximation; procedural Shader refraction is a restricted demonstration, not the native Liquid Glass material or arbitrary DOM refraction.

60fps is an optimization target. Automated headless screenshots and RAF samples establish behavior in one environment, not projector hardware performance. Recheck official sources when browser support or platform guidance materially changes.
