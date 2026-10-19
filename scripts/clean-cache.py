"""Remove Python caches only inside this Skill; never touches global browser/runtime caches."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
removed=[]
for p in list(root.rglob('*')):
    if p.is_file() and (p.suffix in {'.pyc','.pyo'} or '__pycache__' in p.relative_to(root).parts):
        assert p.resolve().is_relative_to(root);removed.append(p.relative_to(root).as_posix());p.unlink()
for p in sorted(root.rglob('__pycache__'),key=lambda p:len(p.parts),reverse=True):
    assert p.resolve().is_relative_to(root)
    if not any(p.iterdir()):p.rmdir()
print('Removed local cache files:',len(removed))
