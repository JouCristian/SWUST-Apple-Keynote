"""Distribution privacy hygiene. No source files are mutated; raw values are never reported."""
from pathlib import Path
import re,json,hashlib

TEXT={'.json','.md','.txt','.html','.css','.js','.cjs','.py','.yaml','.yml','.toml'}
DATA=re.compile(r'data:[^,\s]{1,100};base64,[A-Za-z0-9+/=\r\n]+')
ABS=re.compile(r'(?<![\w])(?:'+'file:'+'///'+r'(?:[a-z]:)?|[a-z]:[\\/]|/(?:home|users|tmp|private/var)/)[^\r\n"\'`<>|\]\}]*',re.I)
SECRET=re.compile(r'(?:\b(?:sk-(?:proj-|svcacct-)?|ghp_|github_pat_)[A-Za-z0-9_-]{20,}|\bAKIA[A-Z0-9]{16}\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|password)\s*[:=]\s*["\'][^"\'\s]{12,}["\'])',re.I)

def masked(text):
    return DATA.sub('[EMBEDDED_MEDIA]',text)

def scan(root):
    root=Path(root);findings=[]
    for p in sorted(root.rglob('*')):
        if not p.is_file() or p.suffix.lower() not in TEXT:continue
        text=masked(p.read_text(encoding='utf-8',errors='replace'))
        for kind,pattern in [('absolute-path',ABS),('secret-pattern',SECRET)]:
            for m in pattern.finditer(text):
                findings.append({'path':p.relative_to(root).as_posix(),'line':text.count('\n',0,m.start())+1,'kind':kind,'fingerprint':hashlib.sha256(m.group().encode()).hexdigest()[:12]})
    return findings

def sanitize_text(text,source_root):
    # Mask data URIs first: random base64 can resemble a temporary-directory prefix.
    blobs=[]
    def hide(m):blobs.append(m.group());return f'__MEDIA_BLOB_{len(blobs)-1}__'
    text=DATA.sub(hide,text)
    roots={str(Path(source_root).resolve()),Path(source_root).resolve().as_posix()}
    for root in roots:
        if text.startswith(root+'\\') or text.startswith(root+'/'):text=text[len(root)+1:].replace('\\','/')
        else:text=text.replace(root+'\\','').replace(root+'/','')
    text=ABS.sub('[ENV:EXTERNAL_PATH]',text)
    for i,value in enumerate(blobs):text=text.replace(f'__MEDIA_BLOB_{i}__',value)
    return text

def sanitize_tree(root,source_root):
    root=Path(root);changes=[]
    for p in sorted(root.rglob('*')):
        if not p.is_file() or p.suffix.lower() not in TEXT:continue
        before=p.read_bytes();text=before.decode('utf-8')
        if p.suffix=='.json':
            data=json.loads(text)
            def walk(v):
                if isinstance(v,dict):return {k:walk(x) for k,x in v.items()}
                if isinstance(v,list):return [walk(x) for x in v]
                return sanitize_text(v,source_root) if isinstance(v,str) else v
            updated=walk(data)
            if updated!=data:text=json.dumps(updated,ensure_ascii=False,indent=2)+'\n'
        else:text=sanitize_text(text,source_root)
        after=text.encode('utf-8')
        if after!=before:
            p.write_bytes(after);changes.append({'path':p.relative_to(root).as_posix(),'originalSha256':hashlib.sha256(before).hexdigest(),'distributedSha256':hashlib.sha256(after).hexdigest()})
    return changes

if __name__=='__main__':
    import argparse
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('root');ap.add_argument('--report',required=True);args=ap.parse_args()
    findings=scan(args.root);Path(args.report).write_text(json.dumps({'scope':'UTF-8 text; embedded base64 skipped; binary pixels/OCR not assessed','findings':findings,'status':'FAIL' if findings else 'PASS'},indent=2),encoding='utf-8');print('Privacy findings:',len(findings));raise SystemExit(bool(findings))
