"""Create an editable presentation without overwriting a nonempty directory."""
from pathlib import Path
import argparse, shutil

def scaffold(destination):
    target=Path(destination).resolve();skill=Path(__file__).resolve().parents[1]
    if target.exists() and (not target.is_dir() or any(target.iterdir())):
        raise SystemExit('Refusing to overwrite a nonempty destination')
    target.mkdir(parents=True,exist_ok=True)
    shutil.copytree(skill/'assets/templates/core',target/'core')
    for file in (skill/'assets/templates/starter').iterdir():
        shutil.copy2(file,target/file.name)
    entry=target/'index.html'
    entry.write_text(entry.read_text(encoding='utf-8').replace('../core/','core/'),encoding='utf-8')
    print(f'Created editable presentation: {target}')

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('destination');scaffold(ap.parse_args().destination)
