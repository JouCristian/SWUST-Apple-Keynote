"""Regenerate current scaffold only; preserve historical copies separately."""
from pathlib import Path
import sys,shutil,subprocess,json,hashlib
sys.dont_write_bytecode=True
root=Path(__file__).resolve().parents[1]
target=(root/'qa/scaffold').resolve()
assert target==root/'qa/scaffold' and target.is_relative_to(root/'qa')
if target.exists():shutil.rmtree(target)
subprocess.run([sys.executable,'-B',str(root/'scripts/scaffold.py'),str(target/'project')],check=True)
subprocess.run([sys.executable,'-B',str(root/'scripts/build.py'),str(target/'project/index.html'),str(target/'share.html')],check=True)
files=[]
for p in (root/'assets/templates/core').iterdir():
    if not p.is_file():continue
    q=target/'project/core'/p.name
    assert p.read_bytes()==q.read_bytes()
    files.append({'name':p.name,'sha256':hashlib.sha256(q.read_bytes()).hexdigest()})
(target/'dependencies.json').write_text(json.dumps({'role':'current generated scaffold','coreFiles':files,'shareSha256':hashlib.sha256((target/'share.html').read_bytes()).hexdigest()},indent=2),encoding='utf-8')
print('Current scaffold generated; all core bytes match.')
