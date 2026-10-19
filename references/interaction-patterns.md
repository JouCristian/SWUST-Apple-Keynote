# Interaction contracts

| Component | Required behavior | Implementation / semantics |
|---|---|---|
| Interactive card | hover, press, reversible detail | `mountMorph`; persistent content node; aria-expanded |
| Segmented control | moving selection + selected state | `mountSegments`; radio group and arrow-key handling |
| Slider | updates actual state during input | native range; labeled output; keyboard preserved |
| Stepper | previous, next, reset | bounded logical index, disabled bounds |
| Diagram | selectable nodes, explanatory text | button nodes + textual state; stable edges |
| Capsule | compact status ↔ detail | `mountMorph`; same DOM, anchored rectangle springs |
| Terminal | syntax distinction, pure-text copy, expected output | `terminal`; display-only, failure text if clipboard denied |
| State machine | only valid edges; deterministic reset | `StateMachine`; invalid action rejected, no fabricated transition |

Cards and capsules use the same geometric helper but different scale and purpose. Avoid turning every paragraph into an interactive card. Drag object uses Pointer Events, pointer capture, real-time coordinate mapping, release velocity, cancellation and keyboard left/right/Home. SharedElementTester demonstrates a small object growing into a detail surface and returning while retaining its DOM node.

Flow diagrams show causal state changes. Git `add` copies a snapshot; worktree remains. Editing after add changes only worktree. Commit creates history from index; index does not become empty. A pointer labeled HEAD normally points to the branch, the branch to a commit. Branch switch changes HEAD, not the previous branch's location. Push transfers objects and updates the remote branch; it does not make local history disappear. Simplified object IDs are explicitly schematic.

Terminal commands are never run by this runtime. Preserve line breaks and avoid copying `$` prompts. Destructive real commands need their own task-appropriate handling; do not add live execution to teaching widgets. Demonstration text is not verified command output. Supply prerequisites and expected outcome alongside code.

Keyboard priority: open modal → focused component/editable field → page navigation. Space activates a focused button; range arrows adjust the range; radio arrows change selection; text fields preserve typing. Only unhandled events reach global arrows/Space/Shift+Space. Esc closes top modal before fullscreen. Dialog uses native focus containment and restores focus. All hidden slides are inert and aria-hidden.

Notes are separate structured WHY/ACTION/RESULT/NEXT data. N opens notes in the current window, never secretly on an independent display. P locks notes for projection; fullscreen closes notes. T directory, F fullscreen, R current interaction reset, B static, Home/End boundaries. Controls use viewport pixel sizes so small-window preview remains operable.

All interactive components need explicit reset, accessible names and visible state. Missing images show purpose, expected ratio and file name; they do not fabricate evidence. Advanced effect failure must leave the underlying content and controls usable.

For in-place state replacement, use `mountText` or `Settlement` rather than rewriting visible text without feedback. Keep continuous measurements (slider values, position/velocity) direct and readable instead of crossfading every sampled number. Semantic model and button validity update at the true event. Completion color, labels and results then settle independently. Reset must clear outgoing text and pending visual work. Disabled segmented options are skipped; optional Advanced Refraction becomes unavailable after context loss and returns to Stable.

Controls inherit the five-state palette in `tokens.css`; never fade a complete button to show emphasis. Animate a separate halo/rim so glyph contrast stays intact. Sliders must alter the taught rendering, verified with actual image differences. Advanced reports the actual renderer or fallback reason. Focus remains visible and segment keys retain priority over page keys.

Morphs reserve a safe track and a compact-height centered header slot using shared dimensions. Expanded details stay below that slot; unrelated notes occupy another grid column. Check geometry while reversing. Semantic aria attributes update immediately; button wording crossfades independently.
