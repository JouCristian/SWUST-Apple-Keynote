"""Check the public manifest without mutating files or loading release scripts."""
from pathlib import Path
import json,hashlib
def check_public_manifest(root):
    root=Path(root);record=json.loads((root/'audit/file-manifest.json').read_text(encoding='utf-8'))
    policy=json.loads((root/'scripts/distribution-policy.json').read_text(encoding='utf-8'))
    actual=set()
    for p in root.rglob('*'):
        if not p.is_file():continue
        rel=p.relative_to(root);name=rel.as_posix()
        if name=='audit/file-manifest.json':continue
        if any(x in rel.parts for x in policy['excludedParts']) or p.suffix in policy['excludedSuffixes']:continue
        if name in policy['rootFiles'] or any(name.startswith(x+'/') for x in policy['commonRoots']):actual.add(name)
    if actual!={x['path'] for x in record['files']}:raise RuntimeError('Public file manifest membership differs')
    for item in record['files']:
        p=root/item['path']
        if not p.is_file() or p.stat().st_size!=item['bytes'] or hashlib.sha256(p.read_bytes()).hexdigest()!=item['sha256']:
            raise RuntimeError('Stale public file manifest: '+item['path'])
