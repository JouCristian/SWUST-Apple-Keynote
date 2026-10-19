# Glass materials · public v1.0.0

Glass belongs primarily to floating controls and material teaching. Dense content needs a stable surface. Preserve contrast over the worst actual background. These are web implementations, not native Apple compositor behavior or physically exact optics.

| Level | Real mechanism | Input / fallback |
|---|---|---|
| Stable Frosted | alpha fill, backdrop blur/saturation, rim and shadow | CSS backdrop; no blur support → opaque readable fill |
| Optical Glass | SVG feImage, edge-normal feDisplacementMap, separate RGB branches, Gaussian blur, rim | readable Canvas/Image and registered source rectangle; missing/unsupported input → Frosted Fallback |
| Advanced Refraction | WebGL shader samples supplied texture with edge-normal displacement, RGB offsets and bounded multi-tap blur | texture + WebGL compile/upload + ≤1,000,000 sample pixels; missing input/context failure/loss → Frosted Fallback |

## Mechanism comparison and provenance

The legacy `.glass-enhanced:after` distorts only a decorative highlight; `mountLight` moves a gradient. `mountRefraction(canvas,status)` refracts its own procedural circular scene. These examples retain approximation labels. They do not sample the displayed material backdrop and cannot establish coherent background refraction.

React Bits GlassSurface was inspected from its official repository on 2026-10-17: map images, separate RGB displacement/recombination, and a newer WebGL path accepting a registered Canvas/Image/Video backdrop. CSS `backdrop-filter:url(...)` has cross-engine limits; a parsed property is not proof of displacement. The current license is MIT + Commons Clause, restricting redistribution of components themselves, including ported bundles. See [license audit](../audit/LICENSE-AUDIT.md) for source URLs, hashes and license record. No third-party component source is shipped in this Skill.

We retain and extend the existing native engine. Rim/light/fallback/lifecycle behavior can be reused; actual input sampling requires a new SVG image/filter pipeline and textured shader. Our Optical branch filters an explicit registered image rather than relying on SVG URL backdrop-filter. It does not capture arbitrary live DOM. Advanced also samples explicit input; WebGL cannot magically access full page pixels.

## Native API

Load `glass.css`, `spring.js`, then `refraction.js`. `K.createGlassBackdrop(w,h)` creates the self-authored calibration Canvas. `K.mountGlass(surface,{backdrop,rect,status,mode,forceFallback})` preserves foreground children and returns:

- `setMode('stable'|'optical'|'advanced')`, `set({distortion,blur,aberration,opacity,rim})`.
- `renderer`: actual SVG / WebGL / Frosted Fallback; `available`: Advanced capability.
- `stats`: bounded draw count/CPU submission samples (not GPU or FPS proof).
- `setBackdrop(null)`: explicit missing-input test. Remount/restore the page to recreate Advanced input.
- `destroy()`: remove observers/listeners, resources and optical layers while retaining original content.

`rect:{x,y,w,h}` uses the texture coordinate system. Align backdrop and panel in the same percentages/scale. Moving/resizing a panel requires updating that registration or remounting; automatic DOM screenshotting is deliberately absent. The rounded-rectangle signed-distance map has a smooth finite edge band and neutral center; normalization removes the 8-bit center bias. RGB offsets are tunable rather than a moving rainbow. Foreground text is never displaced or blurred.

Rendering occurs only on input/resize/mode change, with no persistent RAF. Pointer movement changes a faint highlight and is disabled by reduced motion. `.opaque` and supported `prefers-reduced-transparency` select opaque fallback. Reduced motion preserves semantic output. In the busy optical test, a near-opaque text patch provides stable reading contrast.

## Acceptance and boundaries

Use Showcase 04 or `dist/glass-material-lab.html`: colored thin lines, grid and hard boundaries expose displacement. Capture each actual renderer and parameter extremes. Compare actual cropped image pixels, neutral center vs edge, composed text contrast, missing input, context failure/loss and opaque modes. Distortion/aberration are disabled in Showcase Stable; the shared Lab sliders also drive the two optical samples. Stable opacity uses a continuous readable alpha mapping without a dead range. Do not advertise effects the renderer cannot provide.

Chrome/Edge versions and outcomes are recorded in QA. Unavailable Firefox/WebKit engines remain untested. SVG/blur are raster costs; shader upload/readback has overhead. The pixel cap is a guardrail, not a benchmark. Report measured submission/readback and RAF intervals with hardware limitations and zero idle redraws. Never claim universal 60fps or physical optical accuracy. Real dynamic backdrops require caller-managed texture refresh/remounting; the teaching backdrop is static.
