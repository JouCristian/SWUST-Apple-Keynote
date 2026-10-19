"""Content-addressed inventory; self and the release aggregation output are explicitly excluded."""
from pathlib import Path
import hashlib,json
EXCLUDE={'qa/file-inventory.json','qa/release-report.json','package-manifest.json'}
def selected(root):
    return sorted(p for p in Path(root).rglob('*') if p.is_file() and p.relative_to(root).as_posix() not in EXCLUDE and not any(x in p.relative_to(root).parts for x in ['__pycache__','.git','node_modules','.venv','.cache']) and p.suffix not in {'.pyc','.pyo','.zip'})
def entries(root):return [{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in selected(root)]
def write(root):
    root=Path(root);p=root/'qa/file-inventory.json';p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps({'schema':2,'scope':'all non-cache/non-ZIP files except declared self/aggregation outputs','excluded':sorted(EXCLUDE),'files':entries(root)},ensure_ascii=False,indent=2),encoding='utf-8')
def verify(root):
    root=Path(root);record=json.loads((root/'qa/file-inventory.json').read_text(encoding='utf-8'));actual={x['path']:x for x in entries(root)};expected={x['path']:x for x in record['files']}
    return {'missing':sorted(expected.keys()-actual.keys()),'unlisted':sorted(actual.keys()-expected.keys()),'mismatch':[n for n in expected.keys()&actual.keys() if expected[n]!=actual[n]]}
if __name__=='__main__':
    import argparse
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('root');ap.add_argument('--check',action='store_true');args=ap.parse_args()
    if args.check:
        result=verify(args.root);print(json.dumps(result));raise SystemExit(any(result.values()))
    write(args.root);print('Inventory written.')
