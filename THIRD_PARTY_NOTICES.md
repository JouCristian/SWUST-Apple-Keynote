# Third-party notices

The MIT grant in LICENSE covers the authorized original work in this repository. It does not relicense development tools, external references, trademarks or future user-supplied content.

## Distributed material

No third-party runtime, component source, font, photograph, logo, browser binary or npm/Python dependency is vendored. Diagrams and procedural textures are authored in native SVG/Canvas; screenshots in `docs/screenshots/` are fresh captures of those demos. Built HTML contains the same authored runtime. System font stacks name installed fonts without distributing font files.

## React Bits research — not distributed

[React Bits GlassSurface](https://www.reactbits.dev/components/glass-surface) and the [official repository](https://github.com/DavidHDev/react-bits) were inspected as technical research. The inspected [license](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md) is **MIT + Commons Clause**, with restrictions on component/bundle/port redistribution. It is not treated as ordinary MIT. No GlassSurface JSX, CSS, license snapshot, component port or research download is included in this repository or ZIP.

The retained native `refraction.js` uses its own analytic rounded-rectangle displacement map, native DOM lifecycle, WebGL1 shaders and five-tap sampling. It is not a React wrapper or translation of GlassSurface. Generic SVG displacement, RGB channel separation and WebGL texture setup are mechanisms, not a grant to copy upstream expression. See [the audit](audit/LICENSE-AUDIT.md) for the comparison and its limits.

## Development tools — installed separately

| Tool | Tested version | Upstream license | Role |
|---|---|---|---|
| [PyYAML](https://github.com/yaml/pyyaml) | 6.0.3 | MIT | YAML/frontmatter checks |
| [Playwright](https://github.com/microsoft/playwright) | 1.62.1 | Apache-2.0 | Browser automation |
| [pngjs](https://github.com/pngjs/pngjs) | 7.0.0 | MIT | PNG pixel comparison |
| [Python](https://docs.python.org/3/license.html) | 3.10+ required | PSF terms and included notices | Build and packaging tools |
| [Node.js](https://github.com/nodejs/node/blob/main/LICENSE) | installed separately | MIT and included third-party notices | Development scripts |

These tools and browser engines are not redistributed. Their complete notices accompany their upstream installations. Chrome and Edge are separately installed proprietary browser products; optional Firefox/WebKit checks depend on separately obtained engines. External documentation links confer no rights over that documentation. Apple/Keynote/SWUST and other marks remain with their respective owners; this project claims no affiliation or endorsement.
