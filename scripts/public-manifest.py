"""Record actual public files; excludes self and private/generated roots."""
from pathlib import Path
import sys,json,hashlib
sys.dont_write_bytecode=True
root=Path(__file__).resolve().parents[1]
policy=json.loads((root/'scripts/distribution-policy.json').read_text(encoding='utf-8'))
def selected():
    files=[]
    for p in sorted(root.rglob('*')):
        if not p.is_file():continue
        rel=p.relative_to(root);name=rel.as_posix()
        if name=='audit/file-manifest.json':continue
        if any(x in rel.parts for x in policy['excludedParts']) or p.suffix in policy['excludedSuffixes']:continue
        if name not in policy['rootFiles'] and not any(name.startswith(x+'/') for x in policy['commonRoots']):continue
        files.append({'path':name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    return files
target=root/'audit/file-manifest.json'
if '--check' in sys.argv:
    assert json.loads(target.read_text(encoding='utf-8'))['files']==selected(),'Public file manifest is stale'
    print('Public file manifest exact.')
else:
    files=selected();target.write_text(json.dumps({'schema':1,'scope':'Public repository and slim profile; excludes self, .git, qa, caches and external tools','files':files},indent=2),encoding='utf-8');print('Public manifest files:',len(files))
