"""Bundle local classic-script HTML into one offline HTML. Standard library only.
Intentionally rejects modules, CSS imports, external resources and dynamic fetch.
Do not use this as a general JavaScript dependency compiler.
"""
from pathlib import Path
from html.parser import HTMLParser
import argparse, base64, mimetypes, re


def local_path(base, url):
    if re.match(r'^[a-zA-Z][\w+.-]*:', url) or url.startswith('//'):
        raise ValueError(f'External resource is not bundled: {url[:120]}')
    path = (base / url.split('#')[0].split('?')[0]).resolve()
    if not path.is_file():
        raise FileNotFoundError(path)
    return path


def data_url(path):
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def inline_css(path):
    css = path.read_text(encoding='utf-8')
    if re.search(r'@import\b', css):
        raise ValueError('Resolve CSS @import before bundling')
    def replace(m):
        url=m.group(1).strip().strip('\'"')
        if url.startswith(('data:', '#')): return m.group(0)
        return f'url("{data_url(local_path(path.parent,url))}")'
    return re.sub(r'url\((.*?)\)', replace, css)


class Bundle(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source=source; self.output=[]; self.skip_script=False

    def handle_starttag(self, tag, pairs):
        attrs=dict(pairs)
        if tag=='link' and attrs.get('rel')=='stylesheet':
            self.output.append('<style>\n'+inline_css(local_path(self.source.parent,attrs['href']))+'\n</style>')
        elif tag=='script' and attrs.get('src'):
            if attrs.get('type')=='module': raise ValueError('Use a module bundler before this tool')
            js=local_path(self.source.parent,attrs['src']).read_text(encoding='utf-8')
            if re.search(r'\bfetch\s*\(|\bimport\s*\(',js): raise ValueError('Dynamic dependencies need explicit embedding')
            # These templates place classic scripts at body end in dependency order.
            if 'defer' in attrs or 'async' in attrs: raise ValueError('Place scripts at body end before bundling')
            self.output.append('<script>\n'+js.replace('</script','<\\/script')+'\n</script>');self.skip_script=True
        elif tag in ('img','source','video','audio'):
            if 'srcset' in attrs: raise ValueError('Normalize srcset before bundling')
            text=self.get_starttag_text()
            for key in ('src','poster'):
                url=attrs.get(key)
                if url and not url.startswith('data:'):
                    text=text.replace(url,data_url(local_path(self.source.parent,url)))
            self.output.append(text)
        else:self.output.append(self.get_starttag_text())

    def handle_endtag(self,tag):
        if tag=='script' and self.skip_script:self.skip_script=False
        else:self.output.append(f'</{tag}>')
    def handle_data(self,data):
        if not self.skip_script:self.output.append(data)
    def handle_decl(self,decl):self.output.append('<!'+decl+'>')
    def handle_entityref(self,name):self.output.append('&'+name+';')
    def handle_charref(self,name):self.output.append('&#'+name+';')
    def handle_comment(self,data):self.output.append('<!--'+data+'-->')


def build(source,destination):
    source=Path(source).resolve();destination=Path(destination).resolve()
    if source==destination:raise ValueError('Refusing to overwrite source HTML')
    parser=Bundle(source);parser.feed(source.read_text(encoding='utf-8'));parser.close()
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(''.join(parser.output),encoding='utf-8')
    print(f'Built {destination.name}: {destination.stat().st_size:,} bytes')


if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('source');ap.add_argument('destination');args=ap.parse_args();build(args.source,args.destination)
