#!/usr/bin/env python3
"""Stage only public static publication files for GitHub Pages."""
from pathlib import Path
import shutil

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'_site'
PUBLIC_DIRS=('assets','map','data','briefs','institutions','methodology','markets','compare','coverage','updates')
PUBLIC_FILES=('index.html','METHODOLOGY.md')
ALLOWED={'.geojson','.html','.css','.js','.mjs','.json','.csv','.md','.svg','.png','.jpg','.webp','.ico','.woff2','.txt'}

def package(root=ROOT):
    out=root/'_site'
    if not (root/'index.html').is_file(): raise SystemExit('Cannot stage: reader index.html is missing')
    if out.exists(): shutil.rmtree(out)
    out.mkdir()
    for name in PUBLIC_FILES:
        source=root/name
        if source.exists(): shutil.copy2(source,out/name)
    for name in PUBLIC_DIRS:
        source=root/name
        if not source.exists(): continue
        for p in source.rglob('*'):
            if p.is_file() and not p.is_symlink() and p.suffix.lower() in ALLOWED and not any(x.startswith('.') for x in p.relative_to(source).parts):
                dest=out/p.relative_to(root)
                dest.parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(p,dest)
    (out/'.nojekyll').write_text('')
    return out

if __name__=='__main__':
    print(package())
