from PIL import Image,ImageDraw
from pathlib import Path
p=Path(r'C:\Ahorrapp-REACT\qa-capturas-migracion')
files=sorted(p.glob('allpage-*.png'),key=lambda x:int(x.stem.split('-')[1]))
thumbs=[]
for i,f in enumerate(files,1):
 im=Image.open(f).convert('RGB'); im.thumbnail((220,300)); c=Image.new('RGB',(240,325),'white'); c.paste(im,((240-im.width)//2,18)); ImageDraw.Draw(c).text((5,3),f'Page {i}',fill='black'); thumbs.append(c)
sheet=Image.new('RGB',(240*5,325*((len(thumbs)+4)//5)),'#ccc')
for i,im in enumerate(thumbs): sheet.paste(im,((i%5)*240,(i//5)*325))
sheet.save(p/'all-contact-sheet.png')
print(len(files))
