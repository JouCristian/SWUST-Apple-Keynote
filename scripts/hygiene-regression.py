"""Exercise privacy, inventory and failure semantics with synthetic inputs; never real secrets."""
from pathlib import Path
import sys,tempfile,json,subprocess
sys.dont_write_bytecode=True
from privacy import sanitize_tree,scan
from inventory import write,verify

def run():
    checks={}
    with tempfile.TemporaryDirectory(prefix='keynote-hygiene-') as temp:
        r=Path(temp);outside='C:'+ '/'+'Users/'+'fixture/cache/browser'
        linux='/'+'home/'+'fixture/tmp/file';mac='/'+'Users/'+'fixture/Library/file'
        (r/'report.json').write_text(json.dumps({'project':str(r/'source.html'),'external':outside,'linux':linux,'mac':mac}),encoding='utf-8')
        original=(r/'report.json').read_bytes();checks['findPaths']=len(scan(r))==4
        sanitize_tree(r,r);result=json.loads((r/'report.json').read_text());checks['relativeProjectPath']=result['project']=='source.html';checks['externalEnvironmentLabel']=result['external']=='[ENV:EXTERNAL_PATH]' and '..' not in result['external'];checks['crossPlatformRedaction']=result['linux']==result['mac']=='[ENV:EXTERNAL_PATH]';checks['rescanClean']=not scan(r)
        (r/'secret.txt').write_text('sk-'+'proj-'+'A'*32);checks['secretDetectedWithoutValue']=any(x['kind']=='secret-pattern' for x in scan(r)) and all('value' not in x for x in scan(r));(r/'secret.txt').unlink()
        (r/'embedded.html').write_text('data:image/png;base64,ABC/'+'tMp/'+'ABC==');checks['base64NotAPath']=not scan(r)
        write(r);checks['inventoryExact']=not any(verify(r).values());(r/'report.json').write_text('{}');checks['inventoryDetectsChangedBytes']=bool(verify(r)['mismatch']);(r/'new.txt').write_text('new');checks['inventoryDetectsUnlisted']=bool(verify(r)['unlisted']);(r/'embedded.html').unlink();checks['inventoryDetectsMissing']=bool(verify(r)['missing'])
    out=Path(__file__).resolve().parents[1]/'qa/hygiene-regression.json';out.write_text(json.dumps({'checks':checks,'status':'PASS' if all(checks.values()) else 'FAIL','scope':'synthetic Windows/Linux/macOS paths; token pattern and inventory corruption cases'},indent=2),encoding='utf-8');print(json.dumps(checks));assert all(checks.values())
if __name__=='__main__':run()
