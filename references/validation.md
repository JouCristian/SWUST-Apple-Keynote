# Validation protocol

Run syntax and manifest validation, then build, then browser tests, then inspect screenshots. A report is evidence for the named artifact and browser only. `scripts/validate-skill.py` requires PyYAML and Node; browser scripts require Playwright plus an installed browser. The presentation itself has no dependencies.

1. Manifest: actual YAML parser, canonical skill name, description, reference links, HTML/CSS resource paths, Node JS syntax. Original external file existence is optional on another machine; bundled hashes remain mandatory.
2. Generic deck: isolated single HTML, network offline, all slides entered, 1920×1080/1366×768/960×640 screenshots, text overflow, keyboard, directory/notes, projection lock, rapid navigation, reduced motion, errors and unexpected requests.
3. Package regression: live spring parameter effects, release/retarget continuity, pointer tracking/cancel, convergence, hidden-page inactivity, persistent shared DOM, all scene recipes, segmented keys, reversible path, capsule reset, valid state transitions, terminal copy success/failure, missing image fallback, shader failure fallback, technical Git state relationships, build/scaffold execution.
4. Manual image review: heading wrapping, reading order, negative space, safe margins, graph labels, hidden object remnants, code readability. Automated rectangle checks are not a substitute. Inspect motion at intermediate states too, not only static endpoints. Include the result-settlement interval after the principal motion: edge/arrow/label de-emphasis, replacement state text, completion captions, and control feedback must not snap in normal mode. Sample rendered intermediate colors or opacity for changed behavior; verify synchronized related graphics, immediate correct semantic state, bounded outgoing text, and the latest value after reversal/reset during settlement. Static/reduced motion and page hiding must leave no pending result animation.
5. Bound claims: note tested Chrome version and viewport set in reports. Actual projector performance, Safari/Firefox and system-level assistive technology require separate runs. Inspect reduction mode and material fallbacks without claiming their appearance is identical to native Apple implementations.

For new generated decks, use `validate-browser.cjs`. `regression.cjs` has domain-specific assertions for the supplied demo/playground, so extend it when core behavior changes; do not present those checks as validation of unrelated content. For an arbitrary source document, separately verify facts and task completeness.

For the Living Showcase, additionally run `scripts/showcase-regression.cjs` after `build-all.py`. It checks each manifest scene through actual controls, physical parameter influence and scaled dragging, equal timing distances, shared DOM/child identity and intermediate geometry, semantic camera mappings, SVG reversal, event-time commit, synchronized shaft/arrow interpolation, old/new text and result opacity, finite burst interruption, legal state-machine edges, reduced/static mode and idle lifecycle. Preserve existing regression coverage rather than replacing it with the Showcase suite.

Keep artifact SHA256 in browser reports. `scripts/release-report.py` joins the generic layout report, per-scene behavioral report, legacy regression, Skill validation and public artifact hashes; stale or incomplete evidence must not promote a capability to Verified. Inspect the contact sheet plus dynamic intermediate screenshots. Advanced explicit-texture refraction remains Experimental even when its availability/fallback behavior passes in Chrome. See [manual visual review](manual-visual-review.md) for human acceptance.

## Visual Quality Gate (required during generation)

Define safe tracks, color pairs and centered-control metrics at storyboard/design time; verify during implementation and again against built offline HTML. Shared-core changes require `showcase-visual-fixtures.cjs`, all 15 Showcase behaviors and legacy regressions. Adapt assertions for unrelated decks: a Showcase pass is not domain-fact validation.

| Gate | Browser evidence |
|---|---|
| Interactive Contrast | five computed states, real foreground/background pairs; ≥4.5 normal / ≥3 large; opacity ancestors and actual composite screenshots |
| Text Readability | busy/translucent worst background; sharp text and stable reading surface |
| Spatial Collision | same-coordinate RAF rectangles, reverse/burst and saved middle frames |
| Geometric Alignment | compact outer gaps and expanded header gaps; ≤2 logical px asymmetry; hover/press stability |
| Motion Continuity | DOM identity, retarget velocity, completion graphics/text interpolation; immediate reset/reduction |
| Material Fidelity | real renderer, parameter pixel differences, neutral center vs displaced edge; fallback |
| Responsive Safety | 1920×1080, 1366×768, 960×640; safe frames and scaling stress |
| Accessibility | visible focus/keyboard priority, reduced motion, opaque preference and current semantic value |
| Rendering Performance | finite drawing, zero idle redraws; measured RAF/submission/readback with limitations |

Run `node "<skill>/scripts/showcase-visual-fixtures.cjs" --channel chrome --modules "<node_modules>"` (Playwright + pngjs). Optional installed Edge/Firefox/WebKit attempts are recorded individually; unavailable engines remain untested. CDP metrics model 125%/150% zoom through the CSS viewport/device-pixel relationship and assert stage bounds/collision; this is not browser-chrome UI automation. Human browser zoom/projector review remains necessary.

Keep Before/After and intermediate screenshots with baseline version/hash. `release-report.py` rejects stale visual-quality hashes and absent required checks before packaging.

## Universal acceptance is the default from public

Every new deck must use `validate-browser.cjs --input share.html --report quality-report.json` (add `--config` for its own navigation/state semantics). This invokes the ID-independent `visual-quality.cjs` core and all nine gates. See [the configuration/status contract](universal-quality.md). `showcase-visual-fixtures.cjs` is a specialized regression, not evidence for unrelated decks. Disabled contrast is recorded separately; gradients/backdrops/unknown overlays return REVIEW without verified pixel evidence. Definitive failures must be fixed and rechecked before delivery.

Use `universal-regression.cjs` to run the intentionally flawed sensor fixture; its quality report is expected FAIL but its classifier regression must PASS. Correct normal pages/nested cards, known defects, uncertain gradient and detector-error semantics are all checked; this seeded test is not universal precision/recall. Use `hygiene-regression.py` for synthetic path/token and inventory-corruption checks. [Distribution verification](distribution.md) runs against extracted actual ZIP bytes.
