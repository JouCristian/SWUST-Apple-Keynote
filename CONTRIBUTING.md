# Contributing

Use an issue or pull request to describe the presentation problem, audience, minimal reproduction, expected behavior and browser/viewport. Keep topics factual and examples independently redistributable. Do not add generated QA history, machine paths, credentials, external media or browser caches.

## Work locally

Install Python 3.10+, Node.js, an installed Chrome channel, then `python -m pip install -r requirements-dev.txt` and `npm install`. Open built HTML directly for offline review. Editable content lives in `assets/`; shared runtime in `assets/templates/core/`. Rebuild `dist/` with `python -B scripts/build-all.py` after source changes. Never fix a generated dist file alone.

## Verify the change

Run `python -B scripts/validate-skill.py .`, rebuild all, and run the generic gate on changed outputs. Shared runtime changes also need the following commands (append `--channel chrome --modules node_modules` to Node commands):

```sh
node scripts/showcase-regression.cjs --modules node_modules
node scripts/regression.cjs --modules node_modules
node scripts/showcase-visual-fixtures.cjs --modules node_modules
node scripts/universal-regression.cjs --modules node_modules
python -B scripts/hygiene-regression.py
python -B scripts/refresh-scaffold.py
```

The seeded detector fixture deliberately has visual FAIL/ERROR cases; its regression assertions must PASS. New decks use `validate-browser.cjs`, not hardcoded Showcase assertions. Preserve REVIEW and browser-unavailable results. Check intermediate frames, event-time state, reversal/reset during settlement, reduced motion, keyboard and offline isolation; inspect actual screenshots at three supported viewports. [Validation details](references/validation.md) explain the evidence boundary.

## Authorship and review

Contribute only work you have the right to license under this repository's MIT terms. Include attribution and exact redistribution terms for any proposed dependency or asset; discuss incompatible terms before adding files. React Bits components and ports must not be copied into this repository. A URL or similar visual effect is not a license grant. Do not add Apple/SWUST marks, commercial fonts or third-party deck images without permission.

Keep a PR focused, explain the user-visible behavior and relevant test evidence, and update affected references/capability labels. Experimental material must not silently become stable. No remote publication is performed by the packaging scripts.
