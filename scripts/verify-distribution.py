"""Extract and execute the actual ZIP in isolation; audit manifests and privacy before execution."""
from pathlib import Path
import sys,json,zipfile,tempfile,hashlib,subprocess
sys.dont_write_bytecode=True
from privacy import scan,sanitize_text
from inventory import verify as verify_inventory

def verify(archive,modules,channel,report):
    archive=Path(archive);checks={};artifacts={};log=[]
    with tempfile.TemporaryDirectory(prefix='keynote-package-check-') as temp:
        base=Path(temp).resolve();install=base/'.agents/skills';install.mkdir(parents=True)
        with zipfile.ZipFile(archive) as z:
            assert z.testzip() is None;checks['crc']=True
            for name in z.namelist():
                target=(install/name).resolve();assert target.is_relative_to(install),'Unsafe ZIP member'
            z.extractall(install)
        root=install/'swust-apple-keynote';manifest=json.loads((root/'package-manifest.json').read_text(encoding='utf-8'));mode=manifest['mode']
        expected={x['path']:x for x in manifest['files']};actual={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
        assert actual==set(expected)|{'package-manifest.json'}
        for n,item in expected.items():
            p=root/n;assert p.stat().st_size==item['bytes'];assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256']
        checks['manifestAndSHA256']=True;checks['noCache']=not any('__pycache__'in n or n.endswith(('.pyc','.zip')) for n in actual);assert checks['noCache']
        from public_manifest_check import check_public_manifest
        check_public_manifest(root);checks['publicRepositoryHashes']=True
        assert not any(verify_inventory(root).values());checks['stagedInventoryExact']=True
        findings=scan(root);assert not findings;checks['archivePrivacy']=True
        def run(arguments,expected_codes=(0,)):
            p=subprocess.run(arguments,cwd=base,capture_output=True,text=True,encoding='utf-8',errors='replace');log.append({'tool':Path(arguments[0]).name,'commandRole':Path(arguments[2] if arguments[1]=='-B' else arguments[1]).name,'exitCode':p.returncode,'output':sanitize_text(p.stdout[-1000:]+p.stderr[-1000:],root)});assert p.returncode in expected_codes,log[-1]
        run([sys.executable,'-B',str(root/'scripts/validate-skill.py'),str(root)]);checks['skillResources']=True;checks['canonicalSkillInstall']=root.relative_to(base).as_posix()=='.agents/skills/swust-apple-keynote'
        run([sys.executable,'-B',str(root/'scripts/build-all.py')]);checks['buildAll']=True
        # A fresh normal topic is generated from the shipped scaffold, with no Showcase DOM.
        project=base/'fresh-sensor-deck';run([sys.executable,'-B',str(root/'scripts/scaffold.py'),str(project)])
        p=project/'slides.js';text=p.read_text(encoding='utf-8').replace('把复杂的内容，讲清楚。','温度数据，形成一次采样。').replace('建立关系，再添加动效。','校验读数，再判断阈值。');p.write_text(text,encoding='utf-8')
        run([sys.executable,'-B',str(root/'scripts/build.py'),str(project/'index.html'),str(project/'share.html')]);checks['newTopicScaffoldBuild']=True
        common=['--channel',channel,'--modules',modules]
        run(['node',str(root/'scripts/validate-browser.cjs'),'--input',str(project/'share.html'),'--report',str(base/'fresh-quality.json'),*common]);quality=json.loads((base/'fresh-quality.json').read_text(encoding='utf-8'));assert quality['status'] not in ['FAIL','ERROR'];checks['freshUniversalRuntime']=True;artifacts['freshQuality']={'status':quality['status'],'gates':quality['gates']}
        # Original archive already scanned; new output reports must also avoid temp paths.
        fresh=findings+scan(root)
        checks['postExecutionPrivacy']=not fresh
        if fresh:raise AssertionError('Execution produced private paths; distribution reporting needs redaction')
        result={'archive':archive.name,'mode':mode,'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'checks':checks,'artifacts':artifacts,'log':log,'status':'PASS' if all(checks.values()) else 'FAIL'}
    Path(report).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'mode':mode,'status':result['status'],'checks':checks}))
if __name__=='__main__':
    import argparse
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('archive');ap.add_argument('--modules',required=True);ap.add_argument('--channel',default='chrome');ap.add_argument('--report',required=True);a=ap.parse_args();verify(a.archive,a.modules,a.channel,a.report)
