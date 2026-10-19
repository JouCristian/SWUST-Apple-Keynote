# Visual grammar and tokens

## Canvas, hierarchy, rhythm

Use a 1920×1080 logical canvas and `min(viewportWidth/1920, viewportHeight/1080)` scaling. Keep an approximately 112 px content margin and 120 px bottom safe zone. The frame may letterbox; it must not crop content. Small screens are previews, not a substitute for a readable projector. Controls live at viewport size so targets remain usable.

The supplied source decks establish large Chinese headings, open columns, fine separators, restrained blue, meaningful dark chapter beats, and technical diagrams. Their values are a starting point, not an Apple compliance certificate.

| Token | Light Keynote | Dark Keynote | Spatial Glass |
|---|---|---|---|
| background | #F5F5F7 | #101114 | #E9EEF5 |
| surface | #FFFFFF | #1D2026 | opaque content, translucent controls |
| primary | #1D1D1F | #F5F5F7 | #1D1D1F |
| secondary | #626269 | #B5B7BF | #525967 |
| accent | #007AFF | #72B6FF | #006BD6 |
| divider | #D9DBE1 | #3D424B | #C8D0DB |

`--accent` is a graphic accent. Use darker `--link: #005FC7` for small text on light backgrounds. Evaluate actual contrast rather than assuming all blue text is accessible. Prefer 4.5:1 for body and 3:1 for large text; controls need discernible boundaries and visible focus.

Typical logical sizes: cinematic title 130–180; slide title 72–88; concept 46–64; body 30–36; code 28–34; captions 24–27. Do not shrink body below the readable range to fit a document. Keep line length moderate, Chinese punctuation intact, and code wrapping explicit. English tracking can tighten slightly at display sizes; do not apply aggressive negative tracking to dense Chinese paragraphs.

System stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei UI", sans-serif`; code: `ui-monospace, "Cascadia Code", Consolas, monospace`. No bundled proprietary Apple fonts or system icons.

Spacing scale 8/16/24/32/48/64/96/112. Editorial grid 12 columns; align labels, diagrams and headings to it. Round surfaces 24–32; inset corners approximate `max(0, parentRadius - padding)`. Capsules use half their height. These are web design tokens, not official private metrics.

## Choosing a composition

Apply Interactive Contrast Integrity, Spatial Collision Prevention and Geometric Alignment Precision below before choosing the final component geometry.

- One conclusion: cinematic typography, one supporting visual.
- Two alternatives: open split comparison with matched baselines.
- Process: directional flow; invariant objects keep their positions.
- Evidence: image area plus concise annotation; full original on click.
- Architecture: overview with focusable submodules and a path back.
- Dense instructions: terminal / code walkthrough, concise expected result and notes.

Alternate density according to the story: opener → explanation → operation → consolidation. Use dark mode for a reason such as a chapter or result. Avoid random theme changes, filler quotes, decorative bento grids, three-card repetition, meaningless devices, continuous ambient motion, or gradients behind every heading.

## System metaphors

Commands → Terminal; files → Finder-style explorer; choices → segmented control; numeric parameters → slider/stepper; hierarchy → sidebar/navigation stack; detail → sheet/inspector; status → compact capsule; revision → diff; quantitative relationships → properly labeled charts. Metaphors are optional. A repository does not need an iPhone frame. Traffic lights belong only to a relevant window metaphor. Use simple self-authored SVG marks, not Apple logos.

Glass, optical refraction, specular highlights, soft lighting and elevation are material decisions; read [glass materials](glass-materials.md). Cinematic typography, negative space, editorial grid and focus are composition decisions. Do not substitute the former for the latter.

## Interactive Contrast Integrity

Pair foreground/background for default, hover, focus-visible, active and disabled. Normal text requires ≥4.5:1, large text ≥3:1. `tokens.css` owns primary pairs (#005FCC / white, #004FAE / white hover/focus, #00418F / white pressed); secondary controls pair pale blue with dark blue. A more-specific generic hover must not override only one member. Keep transition midpoints readable: deep-blue-to-deep-blue avoids low-contrast simultaneous text/background inversion. Meaningful updates must also settle smoothly.

Never lower the opacity of a whole text-bearing control for emphasis/disabled state: choose explicit muted colors or animate a separate halo. Evaluate alpha over the actual worst background; declared RGBA alone is insufficient. Inspect composed pixels and visible focus.

## Spatial Collision Prevention / Geometric Alignment Precision

Give expansion its own measured track and keep explanatory text outside it. Validate compact, middle, expanded, reverse and rapid retarget states. Compare `getBoundingClientRect()` in viewport coordinates; normalize only for logical pixel tolerances. Do not hide collisions with z-index or smaller type. Spring overshoot cannot cross content-safe bounds.

Shared local tokens: `--control-height:56px`, `--inner-pad:16px`, `--control-pad-x:22px`, `--capsule-height:90px`. A morph owns a header slot of its compact height; flex centers the control with equal borders and zero margin. Expanded details appear below the same header. The button stays centered in its header, rather than in the entire expanded document. Top/bottom gap difference must be ≤2 logical CSS px after equal-scale projection. Hover/focus/press cannot change padding or baseline; centered press scaling changes both gaps equally. These are local engineering tokens, not Apple metrics.
