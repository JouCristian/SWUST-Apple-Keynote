# From content to visual decisions

Input may be a theme, Markdown, a document, a prior HTML, or an outline. The agent first extracts goal, audience, time budget, chapters, terms, claims, evidence, commands, prerequisites, formulas/code, conclusions, temporal/spatial/causal relationships, demo opportunities, and uncertainty. Attach a source/provenance field to factual claims. Ask only when missing information blocks an accurate presentation; otherwise declare a reasonable assumption.

Create a storyboard before rendering. Reorganize material around what the audience should understand or do. Keep conditions and command parameters on the slide or in a clearly connected step, rather than deleting them for minimalism. Move narrative explanation to separately managed WHY/ACTION/RESULT/NEXT notes. Long content becomes multiple beats; never blindly shrink a document into a slide.

| Content | First candidate | Useful interaction |
|---|---|---|
| central claim | cinematic type | none |
| concept | minimal definition + one object | reveal detail |
| two options | split comparison | segmented choice |
| terminal operation | terminal + expected result | copy / step |
| files | explorer | expand folder |
| process | directional diagram | previous / next / reset |
| time | timeline | milestone selection |
| state | finite-state diagram | only valid transitions |
| data | labeled native chart | parameter / filter if meaningful |
| layered architecture | spatial overview | focus submodule / back |
| code | walkthrough or diff | line/step selection |
| causality | source-to-result composition | causal parameter |
| summary | system map | jump back to concepts |

These are candidates, not a one-to-one classifier. Choose based on the relation the audience needs to see. A list of departments may need open columns; a CPU pipeline may need one stable five-stage path. A product launch may need one large result figure with provenance, not a terminal.

Transition planning: overview→detail uses shared identity; process uses a stable direction; cause→effect moves attention between related objects; timeline grows; architecture focuses and returns; new chapter resets. For jumps from a directory use a quiet reset unless a clear relationship exists. Store both preceding and following relationships; reverse uses the inverse of the forward relationship.

The renderer consumes agent-authored structured content. It does not automatically infer truth, narrative, or visual taste. Review the resulting storyboard before the build. The bundled `demo/storyboard.json` records why six new Git slides use different layouts and which objects persist.
