# Universal Visual Quality · 1.3

Run the browser gate on every newly generated offline HTML before delivery. Fix FAIL findings, rerun, and deliver REVIEW items for human assessment. ERROR means a detector/action did not execute successfully. SKIP means no applicable component was declared; it is not a pass. The seeded acceptance fixture intentionally fails and must be run through `universal-regression.cjs` to verify its expected classifications.

```text
node "<skill>/scripts/validate-browser.cjs" --input "<project>/share.html" --report "<project>/qa/quality-report.json" --modules "<node_modules>" --channel chrome
node "<skill>/scripts/validate-browser.cjs" --input "<project>/share.html" --report "<project>/qa/quality-report.json" --config "<project>/quality.config.json" --modules "<node_modules>"
```

Legacy positional `input.html output-directory` is still supported and runs the universal gate. Exit is nonzero for FAIL/ERROR; `--strict-review` also blocks on REVIEW. An overall REVIEW must not be advertised as automatic PASS.

## Page adapters and states

Auto-detects Keynote `deck` runtime, `[data-qa-page]`, `.stage > .scene`, `.slides > section`, `.slide`, then a single document body. For other runtimes declare JSON `pages` and `navigation`: `function` with dotted function name, `hash` with `{index}` pattern/offset, `click` with next/previous/reset selectors, or `reveal` with optional activeClass. Reveal is only a semantic preview and cannot prove real page navigation. Explicit selectors that match nothing produce ERROR.

```json
{
  "pages": "[data-qa-page]",
  "navigation": {"type":"function", "function":"lesson.go"},
  "viewports": [[1920,1080],[1366,768],[960,640]],
  "minFontSize": 24,
  "minControlFontSize": 12,
  "allowOverlap": [{"a":".diagram-label", "b":".diagram-node", "reason":"authored label inside node"}],
  "alignments": [{"container":".status-slot", "child":"button", "axis":"y", "tolerance":2}],
  "states": [{"name":"reverse-reset", "page":0,
    "actions":[{"type":"click","selector":"[data-expand]"},{"type":"wait","ms":80},{"type":"click","selector":"[data-reset]"}],
    "expect":[{"selector":"[data-expand]","attribute":"aria-expanded","value":"false"}]}]
}
```

Actions support click/press/fill/wait/navigate/call (dotted function with args). Only explicit manifest actions activate business controls. Default hover/focus/active checks cancel pointer release outside the page. Supply reverse/reset and semantic expectations for nonstandard motion. RAF samples check declared moving objects against their tracks; perceptual continuity remains REVIEW. `resourceMode:"adjacent"` or `--adjacent` allows editable local companions; default isolates one HTML with network offline and catches missing dependencies.

## Semantic declarations

- `data-qa-page`: page discovery. `data-qa-control`, `data-qa-text`, `data-qa-card`: nonstandard component roles.
- `data-qa-collision="deny"` on both independent elements: overlap is a definite FAIL. Other unknown sibling/card overlaps are REVIEW. Parent/child, content within a card, SVG internals, dialogs and declared intentional overlays are excluded.
- `data-qa-allow-overlap`: explicit intended overlay region. Prefer a narrow region and record why in the config. Do not use this to silence genuine collisions.
- `data-qa-align="x|y|both"`, `data-qa-align-child`, `data-qa-tolerance`: measure actual geometry normalized by the container's logical scale.
- `data-qa-track` + `data-qa-moving`: sample motion-safe bounds in each observed RAF.
- `data-qa-lines`: explicit line budget; `data-qa-unoccluded="true"`: require a clear center hit-test. `data-qa-truncate`: intentional truncation remains REVIEW.
- `data-renderer` / `data-qa-material`, `data-qa-background`: material status/input checks. Actual optical pixel comparisons and GPU fallback need project-specific fixtures, not a blanket aesthetic boolean.
- `data-qa-ignore`: author-declared exclusion; scope narrowly and explain in project notes.

## What results mean

Flat CSS foreground/background layers can be composited reliably; ordinary text uses 4.5:1, large text 3:1. Group opacity, gradients/images, filters, glass and overlapping image/vector pixels are REVIEW unless independently sampled. Disabled readability is recorded without mechanically enforcing the enabled AA threshold. Font thresholds below projection guidance are REVIEW; certain clipping/overflow, explicit geometric collision, failed state expectation, missing label/resource and runtime errors are FAIL. Tool/config errors remain ERROR, never PASS.

The report records page/state/viewport/selector/gate/status/actual/threshold/suggestion and screenshot. Control state values are computed in that real state; its screenshot is a default page overview unless a dedicated state is configured. Motion tracks store sample counts and any violations; screenshots are not a proof of unobserved frames. Continuous ambient animation, unmeasured custom RAF, scene rhythm, cinematic polish, glass aesthetics, screen-reader behavior and long-term resource growth still need human/device profiling. No universal FPS claim is made.

The core has no Showcase IDs. `showcase-regression.cjs`, `showcase-visual-fixtures.cjs`, `regression.cjs` and `legacy-layout.cjs` own the specific 15-page/physics/glass/shared/settlement/Git examples. The standard generation command always invokes `visual-quality.cjs` through the universal runner, independently of these fixtures.
