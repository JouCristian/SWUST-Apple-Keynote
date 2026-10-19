"""Rebuild the original two artifacts and the maintained Living Showcase."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import json
from build import build
root=Path(__file__).resolve().parents[1]
showcase=root/'assets/showcase'
if (showcase/'index.html').exists():
    version=json.loads((root/'version.json').read_text(encoding='utf-8'))
    manifest=json.loads((showcase/'capability-manifest.json').read_text(encoding='utf-8'))
    (showcase/'capabilities.js').write_text('globalThis.keynoteRelease='+json.dumps(version,ensure_ascii=False)+';\nglobalThis.labCapabilities='+json.dumps(manifest,ensure_ascii=False)+';\n',encoding='utf-8')
build(root/'assets/playground/index.html',root/'dist/motion-playground.html')
build(root/'assets/demo/index.html',root/'dist/inside-a-git-commit.html')
if (showcase/'index.html').exists():
    build(showcase/'index.html',root/'dist/swust-keynote-showcase.html')
build(root/'assets/glass/index.html',root/'dist/glass-material-lab.html')
p=root/'dist/motion-playground.html'
p.write_text(p.read_text(encoding='utf-8').replace('href="../demo/index.html"','href="inside-a-git-commit.html"').replace('href="../showcase/index.html"','href="swust-keynote-showcase.html"'),encoding='utf-8')
