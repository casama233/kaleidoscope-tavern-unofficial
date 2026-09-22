// Player-facing Tavern chapter for Cookery Guidebook Extension API v1.
// Cookery v1 mechanics are fallback text; localized titles/categories use names/text below.
export const COOKERY_GUIDE_PAYLOAD={
  api:1,
  id:'kaleidoscope_tavern:tavern',
  version:'0.6.0',
  order:250,
  icon:'textures/kaleidoscope_tavern_jar/item/wine',
  titleKey:'title',
  introKey:'intro',
  allKey:'all',
  selectKey:'select',
  backKey:'back',
  languageNoteKey:'language_note',
  showAll:false,
  showIds:false,
  showKinds:false,
  showCategoryOnEntry:false,
  categories:[
    {id:'brewing',labelKey:'brewing',fallback:'Brewing basics',icon:'textures/kaleidoscope_tavern_jar/item/grape'},
    {id:'mixology',labelKey:'mixology',fallback:'Mixology & effects',icon:'textures/kaleidoscope_tavern_jar/item/shaker'},
    {id:'tavern',labelKey:'tavern',fallback:'Tavern equipment',icon:'textures/kaleidoscope_tavern_jar/item/holder'}
  ],
  entries:[
    {id:'kaleidoscope_tavern:guide_grapes',category:'brewing',icon:'textures/kaleidoscope_tavern_jar/item/grapevine',kinds:[],mechanics:[
      '葡萄藤種在藤架上；下方泥土類、冰雪類、地獄石類會分別得到普通、冰、金葡萄藤。',
      '成熟葡萄可用剪刀採收；青提是採收副產物，不是第四種葡萄藤。'
    ]},
    {id:'kaleidoscope_tavern:guide_pressing',category:'brewing',icon:'textures/kaleidoscope_tavern_jar/item/grape_bucket',kinds:[],mechanics:[
      '把水果投入壓榨桶後跳踩；每 8 次有效壓榨累積 1000 mB 果汁。',
      '手持空桶取出果汁，再把同種果汁灌入完整酒桶。'
    ]},
    {id:'kaleidoscope_tavern:guide_barrel',category:'brewing',icon:'textures/kaleidoscope_tavern_jar/item/barrel',kinds:[],mechanics:[
      '完整酒桶需要 4000 mB 同種液體；部分酒不加原料，其他酒在滿桶後投入配方原料。',
      '潛行空手關蓋後開始熟成。品質由 Q1 提升至 Q6；品質越高，下一級需要的時間越長。'
    ]},
    {id:'kaleidoscope_tavern:guide_tap',category:'brewing',icon:'textures/kaleidoscope_tavern_jar/item/tap',kinds:[],mechanics:[
      '在酒桶旁使用酒嘴；手持空酒瓶對酒嘴取酒，成品會保留當前品質。',
      'Q1 也能飲用，但低品質酒可能帶來負面效果。'
    ]},
    {id:'kaleidoscope_tavern:guide_bottle_display',category:'brewing',icon:'textures/kaleidoscope_tavern_jar/item/empty_bottle',kinds:[],mechanics:[
      '品質酒瓶遵循原作 DrinkBlockItem：同種已擺酒先嘗試疊放；否則潛行使用才按點擊面放置，非潛行維持飲用。',
      '同種酒可疊放且每瓶保留自己的 Q1–Q6 品質；空手取回最後一瓶，破壞則取回整組。'
    ]},
    {id:'kaleidoscope_tavern:guide_shaker',category:'mixology',icon:'textures/kaleidoscope_tavern_jar/item/shaker',kinds:[],mechanics:[
      '雪克杯遵循原作 BlockItem：可直接按點擊面放置；空手點已放雪克杯會把其材料／成品完整拿回。酒館基酒需 Q4 或以上。',
      '手持雪克杯完成投料後按住使用並在合適時間鬆手；有成品的雪克杯對已放置空杯使用會直接倒入。'
    ]},
    {id:'kaleidoscope_tavern:guide_cocktails',category:'mixology',icon:'textures/kaleidoscope_tavern_jar/item/mojito',kinds:[],mechanics:[
      '固定雞尾酒由三槽顏色／材料組合決定；89–98 tick 是固定配方判定窗口。',
      '特調會保存三份原料的品質與效果資料；空酒杯是普通 BlockItem 可直接放置，裝有雞尾酒的杯子則非潛行飲用、潛行放置。'
    ]},
    {id:'kaleidoscope_tavern:guide_quality_effects',category:'mixology',icon:'textures/kaleidoscope_tavern_jar/item/wine',kinds:[],mechanics:[
      '品質酒的效果按 Q1–Q6 分級；效果時長、強度與機率以原作資料為準。',
      '原生 Minecraft 效果直接套用；酒館專屬效果逐項適配，不用無關 buff 冒充。'
    ]},
    {id:'kaleidoscope_tavern:guide_racks',category:'tavern',icon:'textures/kaleidoscope_tavern_jar/item/holder',kinds:[],mechanics:[
      'Holder、斜置酒架、環形酒架、吧台酒櫃與窖藏酒櫃都能保存原本的精確酒瓶品質。',
      '交互順序跟隨 Java：非潛行先讓酒架／酒櫃處理槽位；只有方塊回傳 PASS 才繼續手持 BlockItem 放置。潛行且手持物品時會略過方塊互動，直接嘗試放置。'
    ]},
    {id:'kaleidoscope_tavern:guide_furniture',category:'tavern',icon:'textures/kt_runtime/icons/blue_bar_stool',kinds:[],mechanics:[
      '沙發、桌子與吧台會依相鄰方塊自動連接；高腳凳可空手坐下，潛行離座。',
      '家具遵循 Java BlockItem 順序：普通方塊面可直接放置；點到可互動家具時先執行家具互動，潛行且手持物品才略過該互動並嘗試貼面放置。回收設備使用正常破壞流程。'
    ]},
    {id:'kaleidoscope_tavern:guide_lighting',category:'tavern',icon:'textures/kt_runtime/icons/string_lights_colorless',kinds:[],mechanics:[
      '彩燈有無色與 16 種染色款，可用染料更換外觀；同色不重複消耗染料。',
      '鐘形、藍色與黃色吊燈是上下兩格結構；拆除任一部分會按完整結構安全回收。'
    ]},
    {id:'kaleidoscope_tavern:guide_art',category:'tavern',icon:'textures/kt_derived/a17/icon_tartaric_acid_painting',kinds:[],mechanics:[
      '掛畫可依原作附著在牆面、地面或天花板，並保留對應朝向。',
      '酒館裝飾在創造欄統一收納到「森羅物語：酒館裝飾」，不再散落成大量獨立小群組。'
    ]}
  ],
  names:{
    zh_CN:{
      'kaleidoscope_tavern:guide_grapes':'葡萄与藤架','kaleidoscope_tavern:guide_pressing':'压榨果汁','kaleidoscope_tavern:guide_barrel':'酒桶与熟成','kaleidoscope_tavern:guide_tap':'酒嘴与取酒','kaleidoscope_tavern:guide_bottle_display':'摆放酒瓶',
      'kaleidoscope_tavern:guide_shaker':'雪克杯','kaleidoscope_tavern:guide_cocktails':'鸡尾酒与特调','kaleidoscope_tavern:guide_quality_effects':'品质与酒效',
      'kaleidoscope_tavern:guide_racks':'酒架与酒柜','kaleidoscope_tavern:guide_furniture':'家具与座位','kaleidoscope_tavern:guide_lighting':'彩灯与吊灯','kaleidoscope_tavern:guide_art':'挂画与装饰'
    },
    zh_TW:{
      'kaleidoscope_tavern:guide_grapes':'葡萄與藤架','kaleidoscope_tavern:guide_pressing':'壓榨果汁','kaleidoscope_tavern:guide_barrel':'酒桶與熟成','kaleidoscope_tavern:guide_tap':'酒嘴與取酒','kaleidoscope_tavern:guide_bottle_display':'擺放酒瓶',
      'kaleidoscope_tavern:guide_shaker':'雪克杯','kaleidoscope_tavern:guide_cocktails':'雞尾酒與特調','kaleidoscope_tavern:guide_quality_effects':'品質與酒效',
      'kaleidoscope_tavern:guide_racks':'酒架與酒櫃','kaleidoscope_tavern:guide_furniture':'家具與座位','kaleidoscope_tavern:guide_lighting':'彩燈與吊燈','kaleidoscope_tavern:guide_art':'掛畫與裝飾'
    },
    en_US:{
      'kaleidoscope_tavern:guide_grapes':'Grapes & trellises','kaleidoscope_tavern:guide_pressing':'Pressing juice','kaleidoscope_tavern:guide_barrel':'Barrels & aging','kaleidoscope_tavern:guide_tap':'Tap & bottling','kaleidoscope_tavern:guide_bottle_display':'Bottle displays',
      'kaleidoscope_tavern:guide_shaker':'Shaker','kaleidoscope_tavern:guide_cocktails':'Cocktails & signatures','kaleidoscope_tavern:guide_quality_effects':'Quality & drink effects',
      'kaleidoscope_tavern:guide_racks':'Racks & cabinets','kaleidoscope_tavern:guide_furniture':'Furniture & seating','kaleidoscope_tavern:guide_lighting':'String & pendant lights','kaleidoscope_tavern:guide_art':'Paintings & decor'
    }
  },
  text:{
    zh_CN:{title:'森罗物语：酒馆',intro:'从种葡萄、酿酒和调酒，到酒馆设备与装饰的玩法指南。',all:'全部条目',select:'选择一个主题。',back:'返回',language_note:'酒款品质、设备槽位和效果请按对应条目查看。',brewing:'酿酒入门',mixology:'调酒与酒效',tavern:'酒馆设备'},
    zh_TW:{title:'森羅物語：酒館',intro:'從種葡萄、釀酒和調酒，到酒館設備與裝飾的玩法指南。',all:'全部條目',select:'選擇一個主題。',back:'返回',language_note:'酒款品質、設備槽位和效果請按對應條目查看。',brewing:'釀酒入門',mixology:'調酒與酒效',tavern:'酒館設備'},
    en_US:{title:'Kaleidoscope Tavern',intro:'A guide to grapes, brewing, mixology, Tavern equipment and decor.',all:'All entries',select:'Choose a topic.',back:'Back',language_note:'See each entry for quality, slot and effect details.',brewing:'Brewing basics',mixology:'Mixology & effects',tavern:'Tavern equipment'}
  }
};

const GUIDE_LOCALES=['zh_CN','zh_TW','en_US'];
const copy=v=>JSON.parse(JSON.stringify(v));
const firstText=(m,fallback)=>m?.zh_TW??m?.zh_CN??m?.en_US??Object.values(m??{})[0]??fallback;
function addLocalizedName(payload,id,map,fallback){
 for(const lc of GUIDE_LOCALES)payload.names[lc][id]=map?.[lc]??map?.en_US??map?.zh_TW??map?.zh_CN??fallback;
}
function recipeMechanics(recipe){
 const alts=x=>(x??[]).map(slot=>slot.join(' / ')).join(' + ')||'—';
 if(recipe.kind==='pressing')return [`Input: ${(recipe.input??[]).join(' / ')}`,`→ ${recipe.fluid} ${recipe.amount} mB`];
 if(recipe.kind==='shaker')return [`Shaker: ${alts(recipe.ingredients)}`,`→ ${recipe.output?.item??recipe.id}`,`Carrier: ${recipe.carrier??'kaleidoscope_tavern:empty_glassware'}`];
 const output=recipe.output?.item??recipe.output?.byQuality?.join(' / ')??recipe.id;
 return [`${recipe.fluid} × 4000 mB`,`Ingredients: ${alts(recipe.ingredients)}`,`→ ${output}`,`Carrier: ${recipe.carrier??'kaleidoscope_tavern:empty_bottle'}`];
}
/**
 * Project Tavern extension pages/auto-generated recipe pages into the one Cookery
 * family guide. The registry remains Tavern-owned because barrel/shaker semantics
 * are Tavern-specific; only player-facing navigation/rendering is delegated.
 */
export function buildCookeryGuidePayload(registry){
 const payload=copy(COOKERY_GUIDE_PAYLOAD);
 payload.categories.push({id:'extensions',labelKey:'extensions',fallback:'Tavern add-ons',icon:'textures/kaleidoscope_tavern_jar/item/empty_bottle'});
 payload.text.zh_CN.extensions='酒馆附属';payload.text.zh_TW.extensions='酒館附屬';payload.text.en_US.extensions='Tavern add-ons';
 if(!registry)return payload;
 const sources=new Set((registry.list?.()??[]).map(x=>x.source));
 const pages=(registry.allPages?.()??[]).filter(x=>sources.has(x.source));
 const recipes=(registry.allRecipes?.()??[]).filter(x=>sources.has(x.source));
 for(const page of pages){
  const primary=firstText(page.body,page.id),english=page.body?.en_US;
  const mechanics=[primary];if(english&&english!==primary)mechanics.push(english);
  payload.entries.push({id:page.id,category:'extensions',icon:page.icon??'textures/kaleidoscope_tavern_jar/item/empty_bottle',kinds:[],mechanics});
  addLocalizedName(payload,page.id,page.title,page.id);
 }
 for(const recipe of recipes){
  payload.entries.push({id:recipe.id,category:'extensions',icon:'textures/kaleidoscope_tavern_jar/item/empty_bottle',kinds:[recipe.kind],mechanics:recipeMechanics(recipe)});
  addLocalizedName(payload,recipe.id,recipe.title,recipe.id);
 }
 return payload;
}
