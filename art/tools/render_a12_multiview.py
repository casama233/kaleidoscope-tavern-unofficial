"""Four camera views of each derived inspection assembly; NOT Minecraft screenshots."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
from render_preview import decode_geo,all_faces,raster
from render_a12_preview import raster_blend
ROOT=Path(__file__).resolve().parents[1]

def main():
 rows=[r for r in json.loads((ROOT/'asset-conversion.json').read_text())['models']if r.get('batch')=='A12'and r.get('derived_assembly')]
 p=ROOT/'previews';f=Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
 font=lambda n:ImageFont.truetype(str(f),n)if f.exists()else ImageFont.load_default(size=n)
 sheet=Image.new('RGB',(1560,1920),(17,27,35));d=ImageDraw.Draw(sheet)
 d.text((32,20),'A12 / 完整組合四向檢查',font=font(33),fill=(238,225,202))
 d.text((32,73),'原作下段 + 上段平移 16 像素。離線投影，非 Minecraft 引擎驗收。',font=font(20),fill=(174,195,204))
 cameras=[('正面',0,0),('背面',180,0),('側面',90,18),('俯視',35,75)];evidence=[]
 for ri,row in enumerate(rows):
  faces=all_faces(decode_geo(json.loads((ROOT/row['geometry']).read_text())))
  texture=Image.open(ROOT/'RP/textures/kaleidoscope_tavern'/f'{row["texture"]}.png')
  for ci,(label,yaw,pitch)in enumerate(cameras):
   x=32+ci*382;y=122+ri*348
   d.rounded_rectangle((x,y,x+361,y+328),12,fill=(28,43,52))
   render=raster_blend(faces,texture,size=288,yaw=yaw,pitch=pitch)if row['render_method']=='blend'else raster(faces,texture,size=288,yaw=yaw,pitch=pitch,cull=True)
   raw=render.getchannel('A');pixels=sum(raw.histogram()[1:])
   evidence.append({'asset':row['id'],'camera':label,'yaw_degrees':yaw,'pitch_degrees':pitch,'visible_pixels':pixels,'nonempty':pixels>20})
   sheet.paste(render,(x+36,y+3),render)
   d.text((x+12,y+289),row['title_zh'].split('・')[0]+' / '+label,font=font(18),fill=(238,225,202))
 d.text((32,1880),'Kaleidoscope Official Production Team / CC BY-NC-SA 4.0 | 原尺寸與原圖保留，鏡頭自動取景。',font=font(17),fill=(174,195,204))
 sheet.save(p/'A12-assembly-four-views.png')
 report={'scope':'offline projected views of exported assemblies only','views':evidence,'engine':'NOT_RUN','nonempty_views':sum(x['nonempty']for x in evidence)}
 (ROOT/'docs/A12-MULTIVIEW.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 if report['nonempty_views']!=20:raise RuntimeError('One inspection view is unexpectedly blank')
if __name__=='__main__':main()
