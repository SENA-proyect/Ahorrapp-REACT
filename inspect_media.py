from zipfile import ZipFile
from pathlib import Path
p=Path(r'C:\Ahorrapp-REACT\Continuidad_AhorrApp_AWS_PostgreSQL.docx')
with ZipFile(p) as z:
 imgs=[n for n in z.namelist() if n.startswith('word/media/')]
 print('media count',len(imgs))
 for n in imgs: print(n,z.getinfo(n).file_size)
