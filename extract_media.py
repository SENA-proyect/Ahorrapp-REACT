from zipfile import ZipFile
from pathlib import Path
from PIL import Image, ImageDraw
p=Path(r'C:\Ahorrapp-REACT\Continuidad_AhorrApp_AWS_PostgreSQL.docx')
out=Path(r'C:\Ahorrapp-REACT\qa-capturas-migracion\prev_media')
out.mkdir(exist_ok=True)
with ZipFile(p) as z:
 names=[n for n in z.namelist() if n.startswith('word/media/') and n.lower().endswith('.png')]
 for i,n in enumerate(names,1): (out/f'{i}.png').write_bytes(z.read(n))
thumbs=[]
for i,f in enumerate(sorted(out.glob('*.png'), key=lambda f:int(f.stem)),1):
 im=Image.open(f).convert('RGB'); im.thumbnail((400,260)); can=Image.new('RGB',(420,300),'white'); can.paste(im,((420-im.width)//2,25)); ImageDraw.Draw(can).text((6,5),f'Old doc image {i}',fill='black'); thumbs.append(can)
sheet=Image.new('RGB',(420*2,300*((len(thumbs)+1)//2)),'#ccc')
for i,im in enumerate(thumbs): sheet.paste(im,((i%2)*420,(i//2)*300))
sheet.save(out/'sheet.png')
