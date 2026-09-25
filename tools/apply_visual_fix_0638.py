#!/usr/bin/env python3
"""One-time 0.6.37 -> 0.6.38 source correction. Not run by normal packaging.

Use only on the isolated visual-fix branch/clean checkout. Writes canonical
runtime assets, then normal checks/build consume those exact checked-in files.
No player/world data, item identifiers, UUIDs or public dependency is migrated.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image
from refresh_cocktail_icons import main as refresh_icons
from refresh_visual_compat import audit

ROOT=Path(__file__).resolve().parents[1]
RT=ROOT/'runtime'
RP=RT/'RP'

def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))
def save(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def replace(path,before,after):
    text=path.read_text(encoding='utf-8')
    assert text.count(before)==1,(path,'source changed; manual review required',before)
    path.write_text(text.replace(before,after),encoding='utf-8')

def capture_masks():
    entries=[]
    for p in sorted(RP.rglob('*.texture_set.json')):
        d=read(p)['minecraft:texture_set'];mer=d.get('metalness_emissive_roughness')
        if not isinstance(mer,str) or d['color']=='empty_glassware':continue
        image=Image.open(p.parent/(d['color']+'.png')).convert('RGBA')
        data=Image.open(p.parent/(mer+'.png')).convert('RGB')
        assert image.size==data.size
        runs=[]
        for i,(pixel,m) in enumerate(zip(image.getdata(),data.getdata())):
            if not (pixel[3] and m[1]>0):continue
            if runs and runs[-1][0]+runs[-1][1]==i:runs[-1][1]+=1
            else:runs.append([i,1])
        cap=24 if 'glow_berries_juice' in d['color'] else 32 if d['color']=='glassware_holder' else 48 if d['color']=='molotov' else 40
        entries.append({'texture':str((p.parent/d['color']).relative_to(RP)),'size':list(image.size),'rgba_sha256':hashlib.sha256(image.tobytes()).hexdigest(),'emissive':cap,'runs':runs})
    assert len(entries)==27,('unexpected baseline emission maps',len(entries))
    save(ROOT/'data/pbr-emission-masks.json',{'schema':1,'source':'0.6.37 existing emission masks, excluding the erroneously glowing empty glassware. RGBA hash prevents accidentally applying masks to changed art. Values are conservative unverified-in-client tuning.','masks':entries})

def main():
    config=read(ROOT/'release.json');assert config['version']=='0.6.37','Apply only once to the reviewed 0.6.37 source'
    for side in ('BP','RP'):assert read(RT/side/'manifest.json')['header']['version']==[0,6,37]
    capture_masks()
    refresh_icons()
    audit(write=True)
    save(ROOT/'docs/VISUAL-MATERIAL-AUDIT-0.6.38.json',audit())
    core=RT/'BP/scripts/core';adapter=RT/'BP/scripts/bedrock'
    replace(core/'custom-effects.js','timed_source_status_camera_unavailable','bounded_rotational_camera_feedback_adapter')
    p=adapter/'custom-effects.js'
    text=p.read_text();text="import {TIPSY_ID} from '../core/tipsy-visual.js';\nimport {pulseTipsyVisual,forgetTipsyVisual,pruneTipsyVisuals,tipsyVisualDiagnostics} from './tipsy-visual.js';\n"+text;p.write_text(text)
    replace(p,'errors:[],supported:CUSTOM_IMPLEMENTED','tipsyVisual:tipsyVisualDiagnostics,errors:[],supported:CUSTOM_IMPLEMENTED')
    replace(p,'export function clearCustomEffects(p){write(','export function clearCustomEffects(p){forgetTipsyVisual(p.id);write(')
    replace(p,'  if(!nextState.entries.length){',"  pulseTipsyVisual(p,activeStatus(nextState,TIPSY_ID));\n  if(!nextState.entries.length){")
    replace(p,' const players=world.getAllPlayers();const seen=new Set(players.map(p=>p.id));',' const players=world.getAllPlayers();const seen=new Set(players.map(p=>p.id));pruneTipsyVisuals(seen);')
    replace(p,'world.afterEvents.playerSpawn.subscribe(e=>{tracks.delete','world.afterEvents.playerSpawn.subscribe(e=>{forgetTipsyVisual(e.player.id);tracks.delete')
    replace(p,'world.afterEvents.playerLeave.subscribe(e=>{const t=','world.afterEvents.playerLeave.subscribe(e=>{forgetTipsyVisual(e.playerId);const t=')
    names=read(ROOT/'data/native-effect-names.json')
    for col,locale in enumerate(('en_US','zh_CN','zh_TW')):
        p=RP/'texts'/f'{locale}.lang';text=p.read_text(encoding='utf-8')
        keys={line.split('=',1)[0] for line in text.splitlines() if '=' in line and not line.startswith('#')}
        missing=[f'effect.minecraft.{key}={values[col]}' for key,values in names.items() if f'effect.minecraft.{key}' not in keys]
        text=text.rstrip()+'\n\n## Native effect aliases for shared drink lore (0.6.38)\n'+'\n'.join(missing)+'\n';p.write_text(text,encoding='utf-8')
    p=core/'quality-tooltip.js'
    replace(p,'export function qualityBottleLore(item){','export function qualityBottleLore(item,legacyLevels=false){')
    replace(p,"const level=entry.amplifier>0?` ${['','I','II','III','IV'][entry.amplifier]??entry.amplifier+1}`:'';","const levels=legacyLevels?['','I','II','III','IV']:['I','II','III','IV','V','VI','VII','VIII','IX','X'];\n  const level=entry.amplifier>0?` ${levels[entry.amplifier]??entry.amplifier+1}`:'';")
    with p.open('a',encoding='utf-8') as f:f.write("\n// Upgrade only lore exactly produced by our former formatter; never erase custom lore.\nexport function isLegacyManagedQualityBottleLore(item){\n const expected=qualityBottleLore(item,true);if(!expected)return false;\n try{const raw=typeof item.getRawLore==='function'?item.getRawLore():undefined;return Array.isArray(raw)&&canonical(raw)===canonical(expected);}catch{return false;}\n}\n")
    p=adapter/'quality-tooltip.js'
    replace(p,'qualityBottleLore,isManagedQualityBottleLore}','qualityBottleLore,isManagedQualityBottleLore,isLegacyManagedQualityBottleLore}')
    replace(p,'||(stack.getLore?.().length??0)>0','||((stack.getLore?.().length??0)>0&&!isLegacyManagedQualityBottleLore(stack))')
    for side in ('BP','RP'):
        p=RT/side/'manifest.json';data=read(p);data['header']['version']=[0,6,38]
        for row in data['modules']:row['version']=[0,6,38]
        for row in data.get('dependencies',[]):
            if row.get('version')==[0,6,37]:row['version']=[0,6,38]
        save(p,data)
    p=RT/'BP/scripts/main.js';p.write_text(p.read_text().replace('0.6.37','0.6.38'))
    config['version']='0.6.38';config['client_visual_acceptance']='pending';save(ROOT/'release.json',config)
    package=read(ROOT/'package.json');package['version']='0.6.38';save(ROOT/'package.json',package)
    p=ROOT/'tools/check_release.py'
    replace(p,"assert item_atlas['kt_c3_signature_cocktail']['textures']=='textures/kaleidoscope_tavern_jar/item/signature_cocktail'","assert item_atlas['kt_c3_signature_cocktail']['textures']=='textures/kt_runtime/signature/icon_default'")
    replace(p,"assert mask.getbbox()==(5,8,11,12),'Signature tint must cover only the Java liquid layer'","assert sum(a>0 for a in mask.getchannel('A').getdata())==75,'Dyed icon must include the full glass AND liquid'")
    replace(p,"subprocess.run(['node',str(ROOT/'tools/check_guide.mjs')],cwd=ROOT,check=True)","subprocess.run(['node',str(ROOT/'tools/check_guide.mjs')],cwd=ROOT,check=True)\nsubprocess.run([sys.executable,str(ROOT/'tools/check_visuals.py')],cwd=ROOT,check=True)")
    # Keep the last published download link at 0.6.37; don't invent a release tag.
    for filename in ('README.md','README.zh-TW.md'):
        p=ROOT/filename;text=p.read_text(encoding='utf-8')
        text=text.replace('docs/RELEASE-NOTES-0.6.37.md','docs/RELEASE-NOTES-0.6.38.md')
        text=text.replace('**Current public beta: 0.6.37-beta.1.**','**Visual-fix candidate: 0.6.38-beta.1 (not yet client-accepted).**')
        text=text.replace('目前為 **0.6.37-beta.1 公開測試版**。','目前分支為 **0.6.38-beta.1 視覺修復候選版，尚待遊戲客戶端驗收**。')
        text=text.replace('Python 3.12+ and Node.js 22+ are sufficient; no Python or npm packages are required.','Requires Python 3.12+, Node.js 22+, and Pillow 11.3.0 for image validation.')
        text=text.replace('需要 Python 3.12+、Node.js 22+；無額外套件依賴。','需要 Python 3.12+、Node.js 22+，以及影像檢查套件 Pillow 11.3.0。')
        text=text.replace('```sh\npython3 tools/check_release.py','```sh\npython3 -m pip install Pillow==11.3.0\npython3 tools/check_release.py')
        text=text.replace('1,658','1,684')
        text=text.replace('The public beta has static resource/script/language checks and a successful BDS 1.26.51.1 load with Cookery 1.0.6.','This candidate is checked statically. BDS 1.26.51.1 load evidence belongs to 0.6.37, not this revision; neither BDS nor real-client validation is claimed for 0.6.38.')
        text=text.replace('Known differences include the unavailable custom effects Slightly Tipsy, Grass Stealth and Long Reach.','Slightly Tipsy now has bounded rotational camera feedback (not the exact Java roll waveform); the existing gameplay adapters retain their documented cross-edition limitations.')
        text=text.replace('[Download the public beta]','[Last published beta (0.6.37; not this candidate)]')
        text=text.replace('已完成靜態資源、腳本、多語言檢查及 BDS 1.26.51.1 載入檢查；Android 實際畫面與各裝置相容性仍由公開測試收集回饋。','0.6.38 以靜態檢查驗證；既有 BDS 1.26.51.1 載入紀錄屬於 0.6.37，不代表本版已通過 BDS 或客戶端實測。')
        text=text.replace('[下載 0.6.37-beta.1 公開測試包]','[上一個已發布版本 0.6.37-beta.1（不是本候選版）]')
        p.write_text(text,encoding='utf-8')
    print('Materialized 0.6.38 canonical source. Run release checks before committing/building.')

if __name__=='__main__':main()
