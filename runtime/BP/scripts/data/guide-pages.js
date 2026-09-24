const page=(name,cn,tw,en,body)=>({id:'kaleidoscope_tavern:'+name,title:{zh_CN:cn,zh_TW:tw,en_US:en},body,source:'kaleidoscope_tavern',recipeIds:[]});
export const GUIDE_PAGES=[
 page('welcome','酒馆指南','酒館指南','Tavern Guide',{
  zh_CN:'按目录查阅种植采收、压榨果汁、酒桶配方、鸡尾酒、品质效果、收纳和装饰。酒桶酒、鸡尾酒与品质效果都按名称分别列出。',
  zh_TW:'依目錄查閱種植採收、壓榨果汁、酒桶配方、雞尾酒、品質效果、收納與裝飾。酒桶酒、雞尾酒與品質效果都依名稱分別列出。',
  en_US:'Browse growing and harvest, juice pressing, barrel recipes, cocktails, quality effects, storage and decor. Barrel drinks, cocktails and their quality effects each have separate named entries.'
 }),
 page('first_brew','從水果到成酒','從水果到成酒','From fruit to drink',{
  zh_CN:'1. 在森林、平原或草甸的橡树与白桦树叶下找到野生葡萄藤，打破取得葡萄藤，再把三株葡萄藤竖向合成八个藤架。\n2. 在藤架上种葡萄藤；藤架正下方的方块决定果实种类：土壤类长普通葡萄，冰雪类长冰葡萄，下界岩或岩浆块长金葡萄。成熟后用剪刀采收。\n3. 将水果放入果盆，跳上去踩踏。同种水果成功踩踏八次可得到一桶果汁；空桶可以取出果汁。\n4. 完整酒桶装满四桶同种果汁后，按配方加入材料。潜行并空手合上桶盖开始熟成。\n5. 用空瓶对酒桶旁的酒嘴装瓶。品质一也可以饮用，但请先查看对应酒款的效果。',
  zh_TW:'1. 在森林、平原或草甸的橡木與樺木樹葉下找到野生葡萄藤，打破取得葡萄藤，再把三株葡萄藤豎向合成八個藤架。\n2. 在藤架上種葡萄藤；藤架正下方的方塊決定果實種類：土壤類長普通葡萄，冰雪類長冰葡萄，地獄石或岩漿塊長金葡萄。成熟後用剪刀採收。\n3. 水果放入果盆後，玩家跳上去踩踏。同種水果成功踩踏八次可得到一桶果汁；空桶可取出果汁。\n4. 完整酒桶裝滿四桶同種果汁後，按配方加入材料。潛行並空手合上桶蓋開始熟成。\n5. 用空瓶對酒桶旁的酒嘴裝瓶。品質一也能飲用，飲用前可先查看該酒款的效果。',
  en_US:'1. Find wild grapevines under oak or birch leaves in forests, plains or meadows and break them to collect grapevines; arrange three grapevines vertically to make eight trellises.\n2. Plant grapevines on the trellis. The block directly below the trellis determines the fruit: soil grows regular grapes, ice or snow grows ice grapes, and Nether stone or magma grows gold grapes. Shear ripe fruit.\n3. Put fruit in a fruit basket and jump on it. Eight successful presses of one fruit make a bucket of juice; collect it with an empty bucket.\n4. Fill a complete barrel with four buckets of one juice, add the recipe ingredients, then sneak and use an empty hand to close the lid and begin aging.\n5. Fill an empty bottle at a tap beside the barrel. Quality 1 is drinkable; check the drink’s effect entry first.'
 }),
 page('quality','酒桶熟成與產量','酒桶熟成與產量','Aging and yield',{
  zh_CN:'每升一个品质约需熟成两分钟，最高为品质六；酒桶只有在所在区块载入时才会熟成。没有配料的配方产出十六瓶；有配料时按最少的一种材料数量决定产量，每种材料最多存放十六份。装满酒桶却不符合配方时会得到醋。每瓶都保留自己的品质。',
  zh_TW:'每升一個品質約需熟成兩分鐘，最高為品質六；酒桶只會在所在區塊載入時熟成。無配料的配方產出十六瓶；有配料時依數量最少的材料決定產量，每種材料最多存放十六份。裝滿酒桶卻不符合配方時會得到醋。每瓶酒都保留自己的品質。',
  en_US:'Each quality step takes about two minutes of game time, up to quality 6. A barrel ages while its chunk is loaded. Ingredient-free recipes yield 16 bottles; recipes with ingredients yield the smallest ingredient count, with up to 16 of each ingredient. A full barrel with no matching recipe makes vinegar. Every bottle keeps its own quality.'
 }),
 page('mixology','雪克杯與雞尾酒','雪克杯與雞尾酒','Shaker and cocktails',{
  zh_CN:'将雪克杯放在方块上，把配方所需的三种材料逐一加入空槽；酒类基酒需要达到品质四。用空手拿起装好材料的雪克杯，按住使用开始摇酒，再依提示松手。命中配方时机才会得到对应鸡尾酒，其他时机会得到特调或神秘鸡尾酒。将空杯放在方块上，再手持雪克杯对空杯倒酒。潜行使用可取消摇酒。',
  zh_TW:'將雪克杯放在方塊上，把配方所需的三種材料逐一加入空槽；酒類基酒須達品質四。用空手拿起裝好材料的雪克杯，按住使用開始搖酒，再依提示鬆手。命中配方時機才會調出對應雞尾酒，其他時機會調成特調或神秘雞尾酒。將空杯放在方塊上，再手持雪克杯對空杯倒酒。潛行使用可取消搖酒。',
  en_US:'Place the shaker on a block and add the three recipe ingredients, one per slot. A Tavern drink used as a base must be quality 4 or better. Use an empty hand to pick up the loaded shaker, hold use to shake, and release when prompted. Only the recipe timing makes its named cocktail; other timings make a signature or mystery cocktail. Place an empty glass and use the held shaker on it to pour. Sneak-use cancels a shake.'
 }),
 page('storage','收納酒瓶與家具','收納酒瓶與家具','Bottle storage and furniture',{
  zh_CN:'酒瓶架和酒柜可以存放酒瓶。用空手从单个展示取回最近放入的瓶子；破坏整组展示会取回全部酒瓶和各自品质。果汁桶、酒桶只有内容物清空后才能拆除。放置家具后可空手互动取回；椅凳、沙发可供玩家乘坐。',
  zh_TW:'酒瓶架與酒櫃可收納酒瓶。用空手從單個展示取回最近放入的酒瓶；破壞整組展示會取回全部酒瓶及各自品質。果汁桶、酒桶須清空內容物後才能拆除。家具放置後可空手互動取回；椅凳與沙發可供玩家乘坐。',
  en_US:'Bottle racks and cabinets store bottles. Use an empty hand to retrieve the newest bottle from a display; breaking the display returns every bottle at its original quality. Empty a juice tub or barrel before dismantling it. Furniture can be recovered by interacting with an empty hand; stools and sofas provide seats.'
 }),
 page('cultivation','藤架與葡萄採收','藤架與葡萄採收','Trellises and grape harvest',{
  zh_CN:'葡萄藤种在藤架上，藤架正下方的方块决定果实种类：土壤类生长普通葡萄，冰或雪方块生长冰葡萄，下界岩或岩浆块生长金葡萄。葡萄成熟后用剪刀采收，可得到三颗对应葡萄；有机会额外得到青提。骨粉可帮助藤蔓生长。蜂巢可为藤架上蜡，斧头可以刮除蜡层。森林、平原与草甸的橡树和白桦树叶下会自然生成野生葡萄藤；藤架可在浸水状态下种植并生长。',
  zh_TW:'葡萄藤種在藤架上，藤架下方的地面決定果實種類：泥土類生長普通葡萄，冰或雪方塊生長冰葡萄，地獄石或岩漿塊生長金葡萄。葡萄成熟後用剪刀採收，可得到三顆對應葡萄；也有機會額外取得青提。骨粉可幫助藤蔓生長。蜂巢可為藤架上蠟，斧頭可以刮除蠟層。森林、平原與草甸的橡木和樺木樹葉下會自然生成野生葡萄藤；藤架可在浸水狀態下栽種與生長。',
  en_US:'Plant grapevines on trellises. The ground below determines the fruit: dirt-type soil grows regular grapes, ice or snow grows ice grapes, and Nether stone or magma grows gold grapes. Shear ripe fruit to collect three matching grapes, with a chance of extra green grapes. Bone meal helps growth. Honeycomb waxes a trellis; an axe removes the wax. Wild grapevines can generate naturally under oak and birch leaves in forests, plains and meadows; trellises can be planted and grow while waterlogged.'
 }),
 page('bottle_display','酒瓶展示','酒瓶展示','Bottle displays',{
  zh_CN:'潜行并手持酒瓶对方块表面使用，可以摆放酒瓶；同款酒瓶会优先叠放在现有展示上。手持同款酒再对展示使用，可继续添加，即使品质不同也会分别保留。空手互动取回最近放入的一瓶；破坏展示可取回整组。三款酒的展示最多放三瓶，其余酒款最多四瓶。',
  zh_TW:'潛行並手持酒瓶對方塊表面使用，可擺放酒瓶；同款酒瓶會優先疊放在現有展示上。手持同款酒對展示使用，可繼續添加，即使品質不同也會分別保留。空手互動取回最近放入的一瓶；破壞展示可取回整組。三款酒的展示最多放三瓶，其餘酒款最多四瓶。',
  en_US:'Sneak-use a drink on a block face to place it; a matching drink stacks on an existing display first. Use another bottle of the same drink on the display to add it, even at a different quality. Empty-hand interaction retrieves the newest bottle; breaking the display returns the full stack. Three drink types hold up to three bottles; the others hold up to four.'
 }),
 page('availability','目前可用內容','目前可用內容','Available features',{
  zh_CN:'本指南列出的酒桶配方、果汁压榨、鸡尾酒、酒瓶收纳、座椅、灯饰、挂画、香薰和文字看板均可在酒馆中使用。森林会自然生成野生葡萄藤，葡萄藤也可在浸水藤架上生长。',
  zh_TW:'本指南列出的酒桶配方、果汁壓榨、雞尾酒、酒瓶收納、座椅、燈飾、掛畫、香薰與文字看板皆可在酒館中使用。森林會自然生成野生葡萄藤，葡萄藤也可在浸水藤架上生長。',
  en_US:'Barrel recipes, juice pressing, cocktails, bottle storage, seats, lights, paintings, incense and writing boards listed in this guide are available in the Tavern. Wild grapevines can generate in forests and grow on waterlogged trellises.'
 })
];
