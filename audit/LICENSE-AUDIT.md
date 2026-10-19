# License and provenance audit — public v1.0.0 candidate

Date: 2026-10-19. Decision: **no unresolved redistribution blocker identified in the selected public files**. Original-work MIT authorization was explicitly confirmed by the rights holder. This is an engineering provenance review of the available sources, not a legal opinion or a guarantee about unknown provenance.

## Scope and decisions

| Scope | Finding | Decision |
|---|---|---|
| Skill and reference instructions | Authored project guidance; research is cited, not bundled documentation | MIT original text |
| Core, starter, Showcase, playground, Git and glass demos | Native authored HTML/CSS/JS/SVG, system font references, procedural textures | MIT original code and diagrams |
| Python/CJS tools and seeded fixture | Authored build/test infrastructure; dependencies resolved externally | MIT original code; separate tool terms |
| Four dist HTML files | Regenerated from the selected audited sources; no remote runtime | Same source terms |
| New README PNGs | Browser captures of authored public Showcase; no desktop chrome or third-party imagery | MIT authored screenshots |
| Original historical decks, photos and research downloads | Not needed for public operation; redistribution provenance not assumed | Excluded from repo and ZIP |
| React Bits GlassSurface | MIT + Commons Clause, restricted component redistribution | Upstream source/ports excluded |

Every actual public file is enumerated and SHA256-addressed in `file-manifest.json`. The license applies to authored material, not trademark rights or arbitrary future user assets. Review new material independently.

## React Bits comparison

The research snapshot was inspected against official GlassSurface JSX/CSS and LICENSE.md. Reference URLs: [JSX](https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Components/GlassSurface/GlassSurface.jsx), [CSS](https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Components/GlassSurface/GlassSurface.css), [license](https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md). Recorded SHA256:

- JSX: `d435562be2930a98270e3ff5881402a301f84813b06f0603ed353af12a9c96b3`
- CSS: `90cfc3ad54ad7aa92bb2b700696e2d9f2d8704162ba1b94ebf0b6f8dcecc4e61`
- License: `f4c33af6739191537738662d223b68d77bc226f4b57ea883e16481d8cc5c73c9`

The retained implementation is native, independently authored project code: analytic rounded-rectangle signed-distance edge normals, DOM APIs, WebGL1 and five-tap blur. The inspected upstream uses React hooks, arbitrary-shape/image distance-transform processing, WebGL2/textureLod and a different sampling/frame architecture. Source comparison found no identical line over 100 characters. The longest identical token run (38 tokens) was generic repeated WebGL texture-parameter setup, not component logic. These metrics support manual architecture/provenance review; they do not by themselves establish copyright clearance. No React dependency, upstream JSX/CSS or literal component port is shipped. Advanced optics stay Experimental for capability reasons.

## Privacy and dependency boundary

Local absolute paths, known token patterns, caches and generated QA history are excluded or blocked by the staged privacy scanner. Its scan is UTF-8 text based; it does not certify binary OCR. The only distributed raster assets are newly captured browser-only screenshots, visually inspected separately. No vendored third-party runtime is present. PyYAML/Playwright/pngjs metadata licenses were checked in the installed test environment; their packages and transitive dependencies are not copied. See [notices](../THIRD_PARTY_NOTICES.md).
