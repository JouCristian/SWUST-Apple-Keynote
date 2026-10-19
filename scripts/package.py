"""Build an explicit, staged, privacy-scanned public slim distribution."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import argparse,zipfile,json,hashlib,tempfile,shutil,re
from privacy import sanitize_tree,scan
from inventory import write as inventory_write

def package(destination,mode='slim'):
    root=Path(__file__).resolve().parents[1];destination=Path(destination).resolve()
    if destination.is_relative_to(root):raise ValueError('Archive must be outside the Skill')
    policy=json.loads((root/'scripts/distribution-policy.json').read_text(encoding='utf-8'))
    rights=json.loads((root/'audit/license-audit.json').read_text(encoding='utf-8'))
    if rights['status']!='CLEAR' or rights['blockers']:raise RuntimeError('Unresolved license blockers prevent distribution')
    from public_manifest_check import check_public_manifest
    check_public_manifest(root)
    assert mode=='slim';roots=policy['commonRoots']
    chosen=[];excluded=[]
    for p in sorted(root.rglob('*')):
        if not p.is_file():continue
        name=p.relative_to(root).as_posix();allowed=name in policy['rootFiles'] or any(name.startswith(x+'/') for x in roots)
        reason='not in profile allowlist'
        if any(x in p.relative_to(root).parts for x in policy['excludedParts']) or p.suffix.lower() in policy['excludedSuffixes']:allowed=False;reason='cache/archive/temporary exclusion'
        if name in ['qa/file-inventory.json','package-manifest.json','distribution-profile.json']:allowed=False;reason='regenerated for staged content'
        (chosen if allowed else excluded).append(p if allowed else {'path':name,'reason':reason,'bytes':p.stat().st_size})
    destination.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='keynote-distribution-') as temp:
        stage=Path(temp)/'swust-apple-keynote';stage.mkdir()
        for p in chosen:
            q=stage/p.relative_to(root);q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)
        changes=sanitize_tree(stage,root)
        profile={'schema':1,'mode':mode,'optionalArchiveRoots':[]}
        (stage/'distribution-profile.json').write_text(json.dumps(profile,indent=2),encoding='utf-8')
        findings=scan(stage)
        report={'mode':mode,'status':'FAIL' if findings else 'PASS','scope':'all UTF-8 distribution text, embedded base64 excluded; binary visual content/OCR not assessed','findings':findings,'sanitizedCopies':changes,'excludedCount':len(excluded),'originalSourceFilesMutated':False}
        safe=stage/'qa/privacy-report.json';safe.parent.mkdir(exist_ok=True);safe.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        if findings:raise RuntimeError(f'Privacy gate blocked distribution: {len(findings)} findings (values suppressed)')
        inventory_write(stage)
        entries=[{'path':p.relative_to(stage).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(stage.rglob('*')) if p.is_file()]
        manifest={'schema':1,'mode':mode,'version':json.loads((stage/'version.json').read_text())['version'],'selfExcluded':'package-manifest.json','files':entries}
        (stage/'package-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
        assert not scan(stage),'Generated manifest/privacy report introduced private content'
        with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
            for p in sorted(stage.rglob('*')):
                if p.is_file():z.write(p,'swust-apple-keynote/'+p.relative_to(stage).as_posix())
    # Inspect actual archive bytes, not only staging; full independent execution is handled by verify-distribution.py.
    with zipfile.ZipFile(destination) as z:
        assert z.testzip() is None
        for item in manifest['files']:assert hashlib.sha256(z.read('swust-apple-keynote/'+item['path'])).hexdigest()==item['sha256']
    receipt={'mode':mode,'archive':destination.name,'bytes':destination.stat().st_size,'sha256':hashlib.sha256(destination.read_bytes()).hexdigest(),'files':len(entries)+1,'privacy':'PASS','crc':'PASS'}
    destination.with_suffix('.receipt.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8');print(json.dumps(receipt))
    return receipt

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('destination');group=parser.add_mutually_exclusive_group();group.add_argument('--slim',action='store_true');args=parser.parse_args();package(args.destination,'slim')
