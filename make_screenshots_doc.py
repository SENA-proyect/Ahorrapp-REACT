from pathlib import Path
from PIL import Image
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from zipfile import ZipFile

base = Path(r'C:\Ahorrapp-REACT')
src = Path(r'C:\Users\User\AppData\Local\Temp')
old = base / 'Continuidad_AhorrApp_AWS_PostgreSQL.docx'
media_dir = base / 'qa-capturas-migracion' / 'media_all'
media_dir.mkdir(parents=True, exist_ok=True)
items=[]
with ZipFile(old) as z:
    names=sorted([n for n in z.namelist() if n.startswith('word/media/') and n.lower().endswith('.png')], key=lambda x:int(Path(x).stem.replace('image','')))
    for n in names:
        dest=media_dir/Path(n).name
        dest.write_bytes(z.read(n)); items.append(dest)
recent=sorted(src.glob('codex-clipboard-*.png'), key=lambda p:p.stat().st_mtime)
# Last five retained screen captures in this chat are from the AWS migration/deployment session.
items.extend(recent[-5:])

doc=Document(); sec=doc.sections[0]
sec.top_margin=Inches(.45); sec.bottom_margin=Inches(.45); sec.left_margin=Inches(.55); sec.right_margin=Inches(.55)
sec.page_width=Inches(8.5); sec.page_height=Inches(11)
for i,path in enumerate(items,1):
    if i>1: doc.add_page_break()
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(3)
    r=p.add_run(f'Captura {i}'); r.bold=True; r.font.size=Pt(9)
    with Image.open(path) as im: w,h=im.size
    scale=min(7.35/w,9.7/h)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(0)
    p.add_run().add_picture(str(path),width=Inches(w*scale),height=Inches(h*scale))
out=base/'Capturas_Migracion_AhorrApp.docx'; doc.save(out)
print(f'CREATED {out} screenshots={len(items)}')
