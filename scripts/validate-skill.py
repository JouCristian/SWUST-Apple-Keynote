"""Validate manifest YAML, reference links, local HTML/CSS assets, JS syntax and exemplar hashes."""
from pathlib import Path
from html.parser import HTMLParser
import argparse,hashlib,json,re,subprocess,tempfile
try:
    import yaml
except ImportError:
    raise SystemExit('Install PyYAML in the validation environment: python -m pip install PyYAML')

def validate(root):
    errors=[];root=Path(root).resolve();text=(root/'SKILL.md').read_text(encoding='utf-8')
    profile=json.loads((root/'distribution-profile.json').read_text(encoding='utf-8')) if (root/'distribution-profile.json').exists() else {'mode':'workspace'}
    parts=text.split('---',2)
    try:meta=yaml.safe_load(parts[1])
    except Exception as e:errors.append(f'YAML: {e}');meta={}
    if meta.get('name')!='swust-apple-keynote':errors.append('Incorrect canonical Skill name')
    if not isinstance(meta.get('description'),str) or len(meta['description'])<40:errors.append('Description missing or too vague')
    def check(base,url):
        if url.startswith(('#','data:','http:','https:','mailto:','javascript:')):return
        if any(x in url for x in ['<','{','*']):return
        candidate=base/url.split('#')[0].split('?')[0]
        if not candidate.exists():errors.append(f'Missing path: {candidate.relative_to(root) if candidate.is_relative_to(root) else candidate}')
    for p in [root/'SKILL.md',root/'README.md',root/'README.zh-CN.md',root/'CONTRIBUTING.md',root/'THIRD_PARTY_NOTICES.md',*root.glob('references/*.md'),*root.glob('audit/*.md')]:
        if not p.exists():errors.append(f'Missing {p.name}');continue
        for url in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
            check(p.parent,url.strip('<>'))
    class Resources(HTMLParser):
        def __init__(self):
            super().__init__();self.in_script=False;self.script=[];self.scripts=[]
        def handle_starttag(self,tag,pairs):
            a=dict(pairs)
            if tag=='script' and not a.get('src') and a.get('type','text/javascript') in ['text/javascript','application/javascript','module']:
                self.in_script=True;self.script=[]
            if tag in ['img','script','source','audio','video'] and a.get('src'):check(self.base,a['src'])
            if tag=='link' and a.get('rel')=='stylesheet':check(self.base,a['href'])
        def handle_data(self,data):
            if self.in_script:self.script.append(data)
        def handle_endtag(self,tag):
            if tag=='script' and self.in_script:
                self.scripts.append(''.join(self.script));self.in_script=False
    html_count=0
    inline_hashes=set()
    for p in root.rglob('*.html'):
        if any(x in p.relative_to(root).parts for x in ['qa','node_modules','.git','.venv']):continue
        parser=Resources();parser.base=p.parent;parser.feed(p.read_text(encoding='utf-8'));html_count+=1
        for js in parser.scripts:
            digest=hashlib.sha256(js.encode()).hexdigest()
            if digest in inline_hashes:continue
            inline_hashes.add(digest)
            result=subprocess.run(['node','--check','-'],input=js,capture_output=True,text=True,encoding='utf-8')
            if result.returncode:errors.append(str(p.relative_to(root))+': '+result.stderr)
    for p in root.rglob('*.css'):
        if any(x in p.relative_to(root).parts for x in ['qa','node_modules','.git','.venv']):continue
        for url in re.findall(r'url\((.*?)\)',p.read_text(encoding='utf-8')):check(p.parent,url.strip('"\''))
    js_count=0
    for p in [*root.rglob('*.js'),*root.rglob('*.cjs')]:
        if any(x in p.relative_to(root).parts for x in ['qa','node_modules','.git']):continue
        result=subprocess.run(['node','--check',str(p)],capture_output=True,text=True,encoding='utf-8');js_count+=1
        if result.returncode:errors.append(result.stderr)
    required=['assets/playground/index.html','assets/demo/index.html','assets/showcase/index.html','assets/glass/index.html','references/provenance.md','references/research-sources.md','LICENSE','README.zh-CN.md','THIRD_PARTY_NOTICES.md','CONTRIBUTING.md']
    for file in required:
        if not (root/file).is_file():errors.append('Missing required '+file)
    report={'manifest':meta,'htmlCount':html_count,'jsCount':js_count,'uniqueInlineScripts':len(inline_hashes),'errors':errors}
    (root/'qa').mkdir(exist_ok=True);(root/'qa/skill-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return not errors

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('root',nargs='?',default=str(Path(__file__).resolve().parents[1]));raise SystemExit(0 if validate(ap.parse_args().root) else 1)
