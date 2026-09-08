"""Inspect synthetic validation PDFs and render contact sheets; never use on private resumes for publication."""
import json
from pathlib import Path
import subprocess
import pdfplumber
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'data/validation/pdf'
output=ROOT/'data/validation/rendered';output.mkdir(parents=True,exist_ok=True)
report=[];images=[]
for pdf in sorted(source.glob('*.pdf')):
    with pdfplumber.open(pdf) as document:
        for index,page in enumerate(document.pages,1):
            bad=[c for c in page.chars if c['x0'] < -1 or c['x1']>page.width+1 or c['top'] < -1 or c['bottom']>page.height+1]
            report.append({'template':pdf.stem,'page':index,'characters':len(page.chars),'out_of_bounds':len(bad)})
    prefix=output/pdf.stem
    subprocess.run(['pdftoppm','-scale-to','1000','-png',str(pdf),str(prefix)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    images.extend((pdf.stem,p) for p in sorted(output.glob(pdf.stem+'-*.png')))
for offset in range(0,len(images),6):
    batch=images[offset:offset+6];sheet=Image.new('RGB',(1200,((len(batch)+2)//3)*610),'#e7e9e2');draw=ImageDraw.Draw(sheet)
    for i,(name,path) in enumerate(batch):
        picture=Image.open(path).convert('RGB');picture.thumbnail((380,565));x=(i%3)*400+10;y=(i//3)*610+28;sheet.paste(picture,(x,y));draw.text((x,y-20),path.stem,fill='#24392b')
    sheet.save(output/f'contact-{offset//6+1}.png')
(output/'glyph-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'pages':len(report),'out_of_bounds':sum(r['out_of_bounds'] for r in report),'sheets':(len(images)+5)//6}))
