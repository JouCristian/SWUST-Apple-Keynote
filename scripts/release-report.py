"""Aggregate current public candidate evidence; never publish remotely."""
from pathlib import Path
import sys,json,hashlib,subprocess
sys.dont_write_bytecode=True
root=Path(__file__).resolve().parents[1]
read=lambda n:json.loads((root/n).read_text(encoding='utf-8'))
sha=lambda n:hashlib.sha256((root/n).read_bytes()).hexdigest()
checks={};quality={}
subprocess.run([sys.executable,'-B',str(root/'scripts/public-manifest.py'),'--check'],check=True)
checks['publicFileManifest']=True
assert not read('qa/skill-report.json')['errors'];checks['skillResources']=True
assert read('qa/privacy-report.json')['status']=='PASS';checks['privacy']=True
assert (root/'LICENSE').read_text().startswith('MIT License');checks['mitLicensePresent']=True
rights=read('audit/license-audit.json');assert rights['status']=='CLEAR' and not rights['blockers'];checks['licenseAuditClear']=True
for name in ['hygiene-regression.json','universal-acceptance/regression-report.json']:
    r=read('qa/'+name);assert r['status']=='PASS' and all(r['checks'].values());checks[name]=True
for name in ['showcase/behavior-report.json','regression/report.json','visual-quality/report.json','showcase/legacy-layout/report.json']:
    r=read('qa/'+name);assert all(r['checks'].values()) and not r.get('errors') and not r.get('unexpected') and not r.get('warnings')
    if r.get('artifactSha256'):assert r['artifactSha256']==sha('dist/'+r.get('artifact',r.get('file','swust-keynote-showcase.html')))
    for n,digest in r.get('artifactHashes',{}).items():assert sha('dist/'+n)==digest
    checks[name]=True
engine={n:sha('scripts/'+n) for n in ['visual-quality.cjs','validate-browser.cjs']}
for name in ['swust-keynote-showcase','motion-playground','inside-a-git-commit','glass-material-lab']:
    r=read('qa/'+name+'-quality.json');assert r['status'] not in ['FAIL','ERROR'];assert r['artifactSha256']==sha('dist/'+name+'.html');assert r['engineHashes']==engine
    quality[name]={'status':r['status'],'gates':r['gates']}
checks['fourOfflineUniversalRuns']=True
deps=read('qa/scaffold/dependencies.json');r=read('qa/scaffold/quality-report.json')
assert r['status'] not in ['FAIL','ERROR'] and r['artifactSha256']==deps['shareSha256']==sha('qa/scaffold/share.html') and r['engineHashes']==engine
for f in deps['coreFiles']:assert sha('assets/templates/core/'+f['name'])==sha('qa/scaffold/project/core/'+f['name'])==f['sha256']
checks['currentScaffold']=True
archive=read('qa/archive-verification.json');assert archive['status']=='PASS' and all(archive['checks'].values());checks['independentZipInstall']=True
result={'version':'1.0.0','publication':'NOT_PUBLISHED','engineeringStatus':'PASS','visualQuality':quality,'checks':checks,'archive':{'name':archive['archive'],'sha256':archive['archiveSha256']},'limitations':['REVIEW remains manual; no universal aesthetic or performance claim','Firefox/WebKit unavailable in this environment; Edge material smoke only','No GitHub remote, push, tag or Release performed']}
(root/'qa/release-report.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result,indent=2))
