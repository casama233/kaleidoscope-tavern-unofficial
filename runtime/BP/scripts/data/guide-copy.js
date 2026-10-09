/** Player instructions shared by both guide entrances. Recipe/effect data stay
 * in their existing records; this file explains only the current interactions. */
import {furnitureItem} from '../core/furniture.js';
import {SANDWICH_BOARDS,FLOWER_BOARD_TRANSFORMS} from '../core/boards.js';
import {GUIDE_NATIVE_NAMES,guideItemName} from './guide-native-names.js';

const NS='kaleidoscope_tavern:',LOCALES=['zh_CN','zh_TW','en_US'];
// Reviewed guide-only adaptation of four registered AMW items. See
// docs/GUIDE-EDITORIAL.md for source hashes; producer recipes/effects stay intact.
const AMW_COPY={
 'amw:kirsch':{category:'barrel',names:['樱桃白兰地','櫻桃白蘭地','Kirsch'],rows:[
  ['缓降放慢坠落，抗性减少受到的伤害，适合登高探索；熟成可延长这两种酒效。','緩速下降放慢墜落，抗性減少受到的傷害，適合登高探索；熟成可延長這兩種酒效。','Slow Falling slows your descent and Resistance reduces incoming damage, useful when exploring high places. Aging extends both effects.'],
  ['品质 1 即可装瓶，取走后不再熟成。品质 4 起可作白色调酒材料；饮用或倒入雪克杯都会归还空瓶。','品質 1 即可裝瓶，取走後不再熟成。品質 4 起可作白色調酒材料；飲用或倒入雪克杯都會歸還空瓶。','Bottle it from Quality 1; bottled drinks stop aging. From Quality 4, it works as a white shaker ingredient. Drinking or pouring it into a shaker returns the empty bottle.']
 ]},
 'amw:kriek':{category:'barrel',names:['比利时酸啤酒','比利時酸啤酒','Kriek'],rows:[
  ['再生逐渐恢复生命，速度方便赶路；品质 5 起获得速度 II，品质 6 获得再生 II。','再生逐漸恢復生命，速度方便趕路；品質 5 起獲得速度 II，品質 6 獲得再生 II。','Regeneration restores health over time, while Speed helps you travel. Speed reaches level II at Quality 5; Regeneration reaches level II at Quality 6.'],
  ['品质 1 即可装瓶，取走后不再熟成。品质 4 起可作红色调酒材料；饮用或倒入雪克杯都会归还空瓶。','品質 1 即可裝瓶，取走後不再熟成。品質 4 起可作紅色調酒材料；飲用或倒入雪克杯都會歸還空瓶。','Bottle it from Quality 1; bottled drinks stop aging. From Quality 4, it works as a red shaker ingredient. Drinking or pouring it into a shaker returns the empty bottle.']
 ]},
 'amw:sour_cherry':{category:'plants',names:['酸樱桃','酸櫻桃','Sour Cherry'],rows:[
  ['在寒冷地区寻找酸樱桃树，采收叶片下方深红色的成熟果簇。未成熟的果实不能采摘。','在寒冷地區尋找酸櫻桃樹，採收葉片下方深紅色的成熟果簇。未成熟的果實不能採摘。','Find sour cherry trees in cold regions and harvest the ripe red clusters beneath their leaves. Unripe fruit cannot be harvested.'],
  ['采收会移除果簇；保留上方叶片及下方空位，便能再次长果并逐渐成熟。采下的酸樱桃可压成果汁酿酒。','採收會移除果簇；保留上方葉片及下方空位，便能再次長果並逐漸成熟。採下的酸櫻桃可壓成果汁釀酒。','Harvesting removes the fruit cluster. Keep the leaves above and the space beneath clear so new fruit can grow and ripen. Press the harvested cherries into juice for brewing.']
 ]},
 'amw:sour_cherry_bucket':{category:'juices',names:['酸樱桃汁桶','酸櫻桃汁桶','Sour Cherry Juice Bucket'],rows:[
  ['酸樱桃汁用于酿造樱桃白兰地和比利时酸啤酒。按制作方法压榨酸樱桃，满桶后用空桶收集。','酸櫻桃汁用於釀造櫻桃白蘭地和比利時酸啤酒。按製作方法壓榨酸櫻桃，滿桶後用空桶收集。','Sour cherry juice is the brewing fluid for Kirsch and Kriek. Press the cherries as shown in the preparation, then collect a full bucket with an empty bucket.'],
  ['把汁桶带到开盖的酒桶投料；液体量、原料和熟成时间见各酒款的制作方法。','把汁桶帶到開蓋的酒桶投料；液體量、原料和熟成時間見各酒款的製作方法。','Add the juice to an open barrel. Each drink’s preparation lists its fluid amount, ingredients and aging time.']
 ]}
};

export function applyReviewedAddonGuideCopy(payload){
 for(const entry of payload.entries){
  const reviewed=AMW_COPY[entry.id];if(!reviewed)continue;
  entry.category=reviewed.category;
  copyRows(entry,reviewed.rows);
  const short=entry.id.slice(4),aliases=[entry.id,'amw:guide_'+short];
  if(short==='kirsch'||short==='kriek')aliases.push('amw:brew_'+short,...Array.from({length:5},(_,i)=>entry.id+'_q'+(i+2)));
  LOCALES.forEach((locale,index)=>{
   for(const alias of aliases)if(alias===entry.id||Object.prototype.hasOwnProperty.call(payload.names[locale],alias))payload.names[locale][alias]=reviewed.names[index];
  });
 }
 return payload;
}

// Each row is one paragraph, in Simplified Chinese, Traditional Chinese, English.
const COPY={
 barrel:[
  ['酒桶用于酿酒与熟成，放置需要 3×3×3 空间。空手操作桶顶开盖；开盖后，对顶部中央加入四桶同种配方液体，再放原料。','酒桶用來釀酒與熟成，放置需要 3×3×3 空間。空手操作桶頂開蓋；開蓋後，對頂部中央加入四桶同種配方液體，再放原料。','A barrel brews and ages drinks. Leave a clear 3×3×3 space. Use the lid with an empty hand to open it; add four buckets of the recipe fluid, then ingredients, through the top center.'],
  ['各类原料尽量等量：开始酿造会消耗全部原料，产量取最少的一类。无额外原料的配方通常产出 16 瓶。开盖时空手点中央，可退回最后放入的一组原料。','各類原料盡量等量：開始釀造會消耗全部原料，產量取最少的一類。無額外原料的配方通常產出 16 瓶。開蓋時空手點中央，可退回最後放入的一組原料。','Keep ingredient stacks equal: brewing consumes every ingredient and yields the smallest stack count. Recipes without extra ingredients usually yield 16 bottles. While open, use the top center with an empty hand to recover the last ingredient stack.'],
  ['空手点桶顶边缘关盖。出现品质 1 成品后便可取酒；成品未取空前，桶盖无法打开。留在桶里的酒会继续熟成，取走后品质不再提高。','空手點桶頂邊緣關蓋。出現品質 1 成品後便可取酒；成品未取空前，桶蓋無法打開。留在桶裡的酒會繼續熟成，取走後品質不再提高。','Use the lid edge with an empty hand to close it. Once Quality 1 appears, the drink is ready to bottle. The lid stays locked until the batch is emptied. Drinks keep aging in the barrel; bottled drinks stop aging.'],
  ['酒嘴装在酒桶正面中央的孔口；在酒嘴正下方摆空酒瓶，开启酒嘴，约 1.5 秒后取回成酒。','酒嘴裝在酒桶正面中央的孔口；在酒嘴正下方擺空酒瓶，開啟酒嘴，約 1.5 秒後取回成酒。','Fit a tap to the central hole on the barrel front. Place an empty bottle directly below the tap, open it, and collect the drink after about 1.5 seconds.'],
  ['通常每次升品质分别需要约 2、4、6、8、10 分钟，品质 1 到 6 合计约 30 分钟；各酒款以配方时间为准。熟成只在区块加载时推进。拆桶会失去剩余液体，搬走前先取空。','通常每次升品質分別需要約 2、4、6、8、10 分鐘，品質 1 到 6 合計約 30 分鐘；各酒款以配方時間為準。熟成只在區塊載入時推進。拆桶會失去剩餘液體，搬走前先取空。','Typical aging stages take about 2, 4, 6, 8 and 10 minutes: roughly 30 minutes from Quality 1 to 6. Check each recipe for its timing. Aging advances in loaded chunks only. Empty the barrel before moving it; dismantling loses any remaining fluid.']
 ],
 tap:[
  ['酒嘴用于接取酒桶成品。装在酒桶正面中央的孔口，在正下方摆放配方要求的空容器。品质 1 就能装瓶。','酒嘴用來接取酒桶成品。裝在酒桶正面中央的孔口，在正下方擺放配方要求的空容器。品質 1 就能裝瓶。','A tap bottles barrel products. Fit it to the central hole on the barrel front and place the recipe’s empty container directly below. Quality 1 is already ready to bottle.'],
  ['操作酒嘴开启，约 1.5 秒后取回成品；再次操作可中止接取，红石信号由无变有也能开启。每次开启接取一份。','操作酒嘴開啟，約 1.5 秒後取回成品；再次操作可中止接取，紅石訊號由無變有也能開啟。每次開啟接取一份。','Use the tap to open it and collect one product after about 1.5 seconds. Use it again to cancel; a rising redstone signal can also open it. Each opening dispenses one product.'],
  ['也可装在西瓜、装有液体的炼药锅等来源旁，接取内容取决于来源与下方容器。','也可裝在西瓜、裝有液體的鍋釜等來源旁，接取內容取決於來源與下方容器。','It also works beside sources such as melons and filled cauldrons. The source and container below determine what you collect.']
 ],
 pressing_tub:[
  ['把同种配方水果放入压榨桶，在桶上跳跃压榨。每份压出 125 mB，八份凑满一桶后，用空桶收集果汁。','把同種配方水果放入壓榨桶，在桶上跳躍壓榨。每份壓出 125 mB，八份湊滿一桶後，用空桶收集果汁。','Add a stack of one recipe fruit and jump on the pressing tub. Each fruit produces 125 mB; eight fruits fill a bucket. Use an empty bucket to collect the juice.'],
  ['空手可逐个退回水果，潜行空手可一次退回整组。满桶后停止耗料；错误原料会在压榨时弹出。','空手可逐個退回水果，潛行空手可一次退回整組。滿桶後停止耗料；錯誤原料會在壓榨時彈出。','Use an empty hand to take back one fruit, or sneak-use to recover the stack. A full tub stops consuming fruit; unsuitable ingredients are ejected when pressed.'],
  ['拆桶会退回桶和水果，剩余果汁不会保留。','拆桶會退回桶和水果，剩餘果汁不會保留。','Breaking the tub returns it and its fruit, but loses any remaining juice.']
 ],
 shaker:[
  ['放下雪克杯，按鸡尾酒配方的三槽条件各投入一份材料，顺序不限。有品质等级的瓶装酒须达品质 4。','放下雪克杯，按雞尾酒配方的三槽條件各投入一份材料，順序不限。有品質等級的瓶裝酒須達品質 4。','Place the shaker and add one ingredient for each of the recipe’s three conditions, in any order. Bottled drinks with quality stages must be Quality 4 or higher.'],
  ['空手拿起雪克杯，对空按住使用摇酒，依提示在配方时机松手；其他时机可能调出特调或神秘鸡尾酒。','空手拿起雪克杯，對空按住使用搖酒，依提示在配方時機鬆手；其他時機可能調出特調或神秘雞尾酒。','Pick up the shaker with an empty hand. Hold use while aiming into air, then release at the recipe prompt. Other timings can make a signature or mystery cocktail.'],
  ['太早松手会取消，材料保留，可以重新摇酒。完成后，对摆好的空鸡尾酒杯使用雪克杯倒出成品，再空手取杯。','太早鬆手會取消，材料保留，可以重新搖酒。完成後，對擺好的空雞尾酒杯使用雪克杯倒出成品，再空手取杯。','Releasing too early cancels the shake and keeps the ingredients for another try. Pour the finished mix into a placed empty glass, then collect the glass with an empty hand.'],
  ['主手握杯，潜行并对空挥手会清空；材料与成品都会丢弃，不会退回。已有成品时，须先倒出或清空才能再调酒。','主手握杯，潛行並對空揮手會清空；材料與成品都會丟棄，不會退回。已有成品時，須先倒出或清空才能再調酒。','To empty it, hold the shaker in your main hand, sneak and swing into air. This discards both ingredients and the result without a refund. Pour or empty a finished mix before mixing again.']
 ],
 guide_grapes:[
  ['先在森林、平原或草甸的树叶下寻找野生葡萄藤，破坏取得藤蔓。三个葡萄藤直排可合成八个藤架，记得另留藤蔓种植。','先在森林、平原或草甸的樹葉下尋找野生葡萄藤，破壞取得藤蔓。三個葡萄藤直排可合成八個藤架，記得另留藤蔓種植。','Find wild grapevines beneath leaves in forests, plains or meadows, and break them to obtain vines. Three vines in a vertical line craft eight trellises; keep another vine for planting.'],
  ['种下时，藤架紧贴下方的方块决定品种：泥土类为普通葡萄，冰雪类为冰葡萄，下界岩或岩浆块为金葡萄。种下后移走这个方块，为果实留空。','種下時，藤架緊貼下方的方塊決定品種：泥土類為普通葡萄，冰雪類為冰葡萄，下界岩或岩漿塊為金葡萄。種下後移走這個方塊，為果實留空。','The block directly beneath the trellis chooses the variety when planted: dirt-type blocks for regular grapes, ice or snow for ice grapes, netherrack or magma for gold grapes. Remove that block after planting to leave space for fruit.'],
  ['藤蔓先向相邻裸藤架延伸，无处延伸时才向下结果；骨粉可催长。用蜜脾给裸藤架上蜡可阻止延伸，用斧头除蜡。','藤蔓先向相鄰裸藤架延伸，無處延伸時才向下結果；骨粉可催長。用蜂巢為裸藤架上蠟可阻止延伸，用斧頭除蠟。','Vines spread onto neighboring bare trellises before fruiting downward. Bone meal speeds growth. Wax a bare trellis with honeycomb to stop spreading onto it; use an axe to remove the wax.'],
  ['成熟果实用剪刀采收可得三个主果，也有机会得到青提。剪葡萄藤则会移除藤蔓和果实、退回藤蔓，留下裸藤架。','成熟果實用剪刀採收可得三個主果，也有機會得到青提。剪葡萄藤則會移除藤蔓和果實、退回藤蔓，留下裸藤架。','Shear ripe fruit for three grapes and a chance of bonus green grapes. Shearing the vine instead removes it and its fruit, returns the vine, and leaves the bare trellis.']
 ],
 green_grape:[
  ['青提是采收普通、冰或金葡萄时偶尔得到的副产物，没有独立藤蔓，不能直接种植。剪刀采收成熟果实可获得更多主果，并有机会得到青提。','青提是採收普通、冰或金葡萄時偶爾得到的副產物，沒有獨立藤蔓，不能直接種植。剪刀採收成熟果實可獲得更多主果，並有機會得到青提。','Green grapes are an occasional bonus from harvesting regular, ice or gold grapes. They have no vine of their own and cannot be planted. Use shears on ripe fruit for a larger harvest and a chance of green grapes.']
 ],
 empty_bottle:[
  ['空酒瓶摆在酒嘴正下方，用于接取酒桶成品或其他来源的液体；开启酒嘴后等候装满，空手取回。','空酒瓶擺在酒嘴正下方，用來接取酒桶成品或其他來源的液體；開啟酒嘴後等候裝滿，空手取回。','Place an empty bottle directly beneath a tap to collect barrel drinks or liquids from other sources. Open the tap, wait for it to fill, then collect it with an empty hand.'],
  ['装满的酒瓶普通使用会饮用，潜行使用可摆放；对同种摆放的酒使用可叠放。空手逐瓶取回，品质各自保留。','裝滿的酒瓶普通使用會飲用，潛行使用可擺放；對同種擺放的酒使用可疊放。空手逐瓶取回，品質各自保留。','Normal use drinks a filled bottle; sneak-use places it. Use it on a display of the same drink to stack bottles. Collect them one at a time with an empty hand; each keeps its quality.']
 ],
 empty_glassware:[
  ['把空鸡尾酒杯摆下，再用装有成品的雪克杯对它倒酒；空手取回酒杯。满杯普通使用饮用，潜行使用可摆放。','把空雞尾酒杯擺下，再用裝有成品的雪克杯對它倒酒；空手取回酒杯。滿杯普通使用飲用，潛行使用可擺放。','Place an empty glass and use a shaker with a finished mix on it to pour. Collect the glass with an empty hand. Normal use drinks a filled glass; sneak-use places it.'],
  ['玻璃器皿架只收空杯；点选空槽放入，空手点同槽取回。','玻璃器皿架只收空杯；點選空槽放入，空手點同槽取回。','A glassware holder stores empty glasses only. Use a glass on an empty slot to insert it, and use that slot with an empty hand to retrieve it.']
 ],
 stepladder:[
  ['放置需要上下两格空间。靠近梯身时，跳跃向上攀、潜行向下攀；破坏任一半会回收整座人字梯。','放置需要上下兩格空間。靠近梯身時，跳躍向上攀、潛行向下攀；破壞任一半會回收整座人字梯。','Leave two vertical blocks of space for the stepladder. While beside it, jump to climb up and sneak to climb down. Breaking either half recovers the whole ladder.']
 ],
 glassware_holder:[
  ['杯架有四格，只收空鸡尾酒杯。对准空格投入，空手点同格取回；破坏会退回架子和全部空杯。','杯架有四格，只收空雞尾酒杯。對準空格投入，空手點同格取回；破壞會退回架子和全部空杯。','The holder has four slots for empty glasses. Use a glass on an empty slot to insert it, or use an occupied slot with an empty hand to retrieve it. Breaking returns the holder and all glasses.']
 ],
 holder:[
  ['单瓶架只收一瓶适合架型的酒、空酒瓶、燃烧瓶或西瓜汁；部分瓶型无法放入。手持瓶子点架子存放，空手取回，品质保留。','單瓶架只收一瓶適合架型的酒、空酒瓶、燃燒瓶或西瓜汁；部分瓶型無法放入。手持瓶子點架子存放，空手取回，品質保留。','This holder stores one compatible drink, empty bottle, Molotov or watermelon juice; some bottle shapes do not fit. Use a bottle to insert it, or an empty hand to retrieve it with its quality intact.'],
  ['红石信号由无变有时会发射存放的成品，空瓶不会发射。破坏会退回架子和瓶子。','紅石訊號由無變有時會發射存放的成品，空瓶不會發射。破壞會退回架子和瓶子。','A rising redstone signal launches the stored product; empty bottles are not launched. Breaking returns the holder and its bottle.']
 ],
 tilted_rack:[
  ['斜酒架有左、中、右三格。对准空格放入瓶子，空手点同格取回，品质保留；白兰地与佳酿红酒的宽瓶不适合此架。','斜酒架有左、中、右三格。對準空格放入瓶子，空手點同格取回，品質保留；白蘭地與佳釀紅酒的寬瓶不適合此架。','The tilted rack has left, center and right slots. Use a bottle on an empty slot to insert it; use that slot with an empty hand to retrieve it with its quality intact. Wide Brandy and Carignan bottles do not fit.'],
  ['红石信号由无变有时会随机发射一份成品，空瓶不会发射。破坏会退回架子和全部瓶子。','紅石訊號由無變有時會隨機發射一份成品，空瓶不會發射。破壞會退回架子和全部瓶子。','A rising redstone signal launches one random stored product; empty bottles are not launched. Breaking returns the rack and all bottles.']
 ],
 circular_rack:[
  ['圆形酒架有六格，按圆周位置选槽。手持瓶子点空槽放入，空手点同槽取回，品质保留；可收纳宽瓶。','圓形酒架有六格，按圓周位置選槽。手持瓶子點空槽放入，空手點同槽取回，品質保留；可收納寬瓶。','The circular rack has six slots around its rim and accepts wide bottles. Use a bottle on an empty slot to insert it; use that slot with an empty hand to retrieve it with its quality intact.'],
  ['红石信号由无变有时会随机发射一份成品，空瓶不会发射。破坏会退回架子和全部瓶子。','紅石訊號由無變有時會隨機發射一份成品，空瓶不會發射。破壞會退回架子和全部瓶子。','A rising redstone signal launches one random stored product; empty bottles are not launched. Breaking returns the rack and all bottles.']
 ],
 cellar_cabinet:[
  ['酒窖柜正面有九格，只收适合单瓶架的瓶型，也可存空瓶、燃烧瓶和西瓜汁。对准正面空格投入，空手点同格取回，品质保留。','酒窖櫃正面有九格，只收適合單瓶架的瓶型，也可存空瓶、燃燒瓶和西瓜汁。對準正面空格投入，空手點同格取回，品質保留。','The cellar cabinet has nine front slots and accepts the same bottle shapes as the single holder, including empty bottles, Molotovs and watermelon juice. Use a bottle on an empty front slot to insert it; use that slot with an empty hand to retrieve it with its quality intact.'],
  ['相邻同朝向酒柜可连成一排。红石信号由无变有时会随机发射一份成品，空瓶不会发射；破坏会退回柜子和全部瓶子。','相鄰同朝向酒櫃可連成一排。紅石訊號由無變有時會隨機發射一份成品，空瓶不會發射；破壞會退回櫃子和全部瓶子。','Matching adjacent cabinets join into a row. A rising redstone signal launches one random stored product; empty bottles are not launched. Breaking returns the cabinet and all bottles.']
 ],
 bar_cabinet:[
  ['吧台柜正面有左右两格。手持瓶子点空侧放入，空手取回，品质保留；白兰地或佳酿红酒的宽瓶会独占整个柜子。','吧檯櫃正面有左右兩格。手持瓶子點空側放入，空手取回，品質保留；白蘭地或佳釀紅酒的寬瓶會獨佔整個櫃子。','The bar cabinet has left and right front slots. Use a bottle on an empty side to insert it, or an empty hand to retrieve it with its quality intact. A wide Brandy or Carignan bottle occupies the whole cabinet.'],
  ['同款同朝向柜子可连接。没有红石发射功能；破坏会退回柜子和全部瓶子。','同款同朝向櫃子可連接。沒有紅石發射功能；破壞會退回櫃子和全部瓶子。','Matching adjacent cabinets join together. This cabinet has no redstone launch function. Breaking returns the cabinet and all bottles.']
 ],
 molotov:[
  ['燃烧瓶是投掷物，不能饮用。对空按住使用至少半秒，松手投出；落点周围会起火。','燃燒瓶是投擲物，不能飲用。對空按住使用至少半秒，鬆手投出；落點周圍會起火。','A Molotov is an incendiary projectile. Hold use into air for at least half a second, then release to throw. It starts fires around its impact.'],
  ['除酒桶配方外，也可在装有岩浆的炼药锅旁装酒嘴，下方摆空酒瓶接取。对方块使用可摆放，空手取回。','除酒桶配方外，也可在裝有熔岩的鍋釜旁裝酒嘴，下方擺空酒瓶接取。對方塊使用可擺放，空手取回。','Besides its barrel recipe, a tap on a lava cauldron can fill an empty bottle placed below it. Use on a block to place it; collect it with an empty hand.'],
  ['可收纳在瓶架、斜酒架、圆形酒架与酒柜；具有红石发射功能的架子或柜子会将它作为燃烧弹发射。','可收納在瓶架、斜酒架、圓形酒架與酒櫃；具有紅石發射功能的架子或櫃子會將它作為燃燒彈發射。','Bottle holders, racks and cabinets can store it. Fixtures with a redstone launch function throw it as an incendiary projectile.']
 ],
 signature_cocktail:[
  ['用三份有效材料，在特调时机松手，再倒入摆好的空鸡尾酒杯。它的颜色与酒效随材料组合变化；尝试搭配不同基酒。','用三份有效材料，在特調時機鬆手，再倒入擺好的空雞尾酒杯。它的顏色與酒效隨材料組合變化；嘗試搭配不同基酒。','Mix three valid ingredients, release at the signature prompt, then pour into a placed empty glass. Its color and effects depend on your ingredients; experiment with different bases.'],
  ['相同酒效可延长持续时间。查看成品说明了解这杯特调的效果。','相同酒效可延長持續時間。查看成品說明了解這杯特調的效果。','Matching effects can last longer. Check the finished glass’s description for its effects.']
 ],
 mystery_cocktail:[
  ['在配方与特调时机以外完成摇酒，会得到神秘鸡尾酒。倒入摆好的空鸡尾酒杯后，空手取回；它的饮用结果留待你发现。','在配方與特調時機以外完成搖酒，會得到神秘雞尾酒。倒入擺好的空雞尾酒杯後，空手取回；它的飲用結果留待你發現。','Finish shaking outside the recipe and signature prompts to make a mystery cocktail. Pour it into a placed empty glass and collect it with an empty hand. Discover its effects by trying it.']
 ]
};
const FURNITURE={
 stool:[['空手点高脚凳坐下，潜行离座。每张凳子供一人乘坐；搬走前先离座，破坏可回收。','空手點高腳凳坐下，潛行離座。每張凳子供一人乘坐；搬走前先離座，破壞可回收。','Use the stool with an empty hand to sit; sneak to stand. Each stool seats one person. Stand before moving it, then break it to recover it.']],
 sofa:[['沙发会与相邻同朝向沙发连接。空手点座位坐下，潜行离座；破坏会回收沙发，并让乘客离座。','沙發會與相鄰同朝向沙發連接。空手點座位坐下，潛行離座；破壞會回收沙發，並讓乘客離座。','Adjacent sofas facing the same direction connect. Use a seat with an empty hand to sit; sneak to stand. Breaking recovers the sofa and dismounts any rider.']],
 table:[['相邻桌子会连接成宽桌面，可作为摆设表面。破坏一张桌子可取回，邻桌会重新连接。','相鄰桌子會連接成寬桌面，可作為擺設表面。破壞一張桌子可取回，鄰桌會重新連接。','Adjacent tables connect into a wider display surface. Break one table to recover it; the remaining tables update their connections.']],
 bar_counter:[['相邻同朝向吧台会连接成一排，可在台面摆放酒瓶或酒杯。破坏可取回单个吧台。','相鄰同朝向吧檯會連接成一排，可在檯面擺放酒瓶或酒杯。破壞可取回單個吧檯。','Adjacent counters facing the same direction join into a row for displaying bottles and glasses. Break a counter to recover it.']],
 light:[['串灯用于照明。手持染料对灯使用可改色；换色消耗一份，同色不消耗。破坏可取回。','串燈用來照明。手持染料對燈使用可改色；換色消耗一份，同色不消耗。破壞可取回。','String lights provide illumination. Use dye on a light to recolor it; changing color consumes one dye, while matching dye is kept. Break it to recover it.']],
 pendant_lamp:[['吊灯占上下两格，放置前留出空间。破坏任一半会回收整盏灯。','吊燈佔上下兩格，放置前留出空間。破壞任一半會回收整盞燈。','Pendant lamps occupy two vertical blocks; leave room before placing them. Breaking either half recovers the whole lamp.']],
 painting:[['对墙面、地面或天花板放置，方向随放置面与朝向决定。破坏会退回这幅画作。','對牆面、地面或天花板放置，方向隨放置面與朝向決定。破壞會退回這幅畫作。','Place this painting on a wall, floor or ceiling; its orientation follows the clicked face and your facing. Breaking returns the same painting.']]
};
const VINE_START={
 grape:['种下葡萄藤时，藤架紧贴下方放泥土类方块，可得到普通葡萄。','種下葡萄藤時，藤架緊貼下方放泥土類方塊，可得到普通葡萄。','Plant a grapevine with a dirt-type block directly below the trellis to grow regular grapes.'],
 ice_grape:['种下葡萄藤时，藤架紧贴下方放冰、浮冰、蓝冰或雪块，可得到冰葡萄。','種下葡萄藤時，藤架緊貼下方放冰、浮冰、藍冰或雪塊，可得到冰葡萄。','Plant a grapevine with ice, packed ice, blue ice or a snow block directly below the trellis to grow ice grapes.'],
 gold_grape:['种下葡萄藤时，藤架紧贴下方放下界岩或岩浆块，可得到金葡萄。','種下葡萄藤時，藤架緊貼下方放地獄岩或岩漿塊，可得到金葡萄。','Plant a grapevine with netherrack or a magma block directly below the trellis to grow gold grapes.']
};
const BOARD_STYLE=[
 ['空手操作可编辑文字与对齐；输入反斜线加 n 换行，长行会自动折行。文字过长时须修改后再保存，原文字不会被截断。','空手操作可編輯文字與對齊；輸入反斜線加 n 換行，長行會自動折行。文字過長時須修改後再儲存，原文字不會被截斷。','Use an empty hand to edit text and alignment. Type a backslash followed by n for a new line; long lines wrap. If the text does not fit, revise it before saving; existing text is kept.'],
 ['染料改变文字颜色，荧光墨囊开启荧光、墨囊关闭荧光。蜜脾锁定文字、颜色与对齐；仍可更换立式告示牌的花饰。','染料改變文字顏色，螢光墨囊開啟螢光、墨囊關閉螢光。蜂巢鎖定文字、顏色與對齊；仍可更換立式告示牌的花飾。','Dye changes text color; glow ink enables glowing text and ink disables it. Honeycomb locks text, color and alignment. A sandwich board’s floral style can still be changed.']
];
const INCENSE_ROWS=[
 ['放置香薰后操作可点燃或熄灭；红石信号由无变有时点燃，由有变无时熄灭。','放置香薰後操作可點燃或熄滅；紅石訊號由無變有時點燃，由有變無時熄滅。','Use placed incense to light or extinguish it. A rising redstone signal lights it; a falling signal extinguishes it.'],
 ['点燃后会伤害附近亡灵，濒死的僵尸村民会开始转化。不同香薰有各自的粒子气氛。','點燃後會傷害附近亡靈，瀕死的殭屍村民會開始轉化。不同香薰有各自的粒子氣氛。','Lit incense harms nearby undead and starts converting zombie villagers near death. Each incense has its own particle ambience.']
];

function copyRows(entry,rows){
 entry.mechanicsByLocale=Object.fromEntries(LOCALES.map((lc,i)=>[lc,rows.map(row=>row[i])]));
 entry.mechanics=entry.mechanicsByLocale.zh_TW;
}
function boardRows(entry,payload){
 if(entry.id===NS+'chalkboard')return [
  ['黑板占上下两格。三块空白、同朝向的单黑板紧邻放置，且放置时不潜行，会合并成宽黑板；破坏任一块会拆下整组。','黑板佔上下兩格。三塊空白、同朝向的單黑板緊鄰放置，且放置時不潛行，會合併成寬黑板；破壞任一塊會拆下整組。','A chalkboard occupies two vertical blocks. Three adjacent blank boards with the same facing merge into a wide board when placed without sneaking. Breaking any panel dismantles the whole assembly.'],
  ['单黑板最多 11 行，每行约 10 个半角或 7 个全角字；混排还受字宽限制。宽黑板同为 11 行，可写更长的行。','單黑板最多 11 行，每行約 10 個半角或 7 個全角字；混排還受字寬限制。寬黑板同為 11 行，可寫更長的行。','Both sizes have 11 lines. A small board fits at most 10 halfwidth or 7 fullwidth characters per line, also limited by glyph width. A wide board fits longer lines.'],
  BOARD_STYLE[0],
  ['染料改变文字颜色，荧光墨囊开启荧光、墨囊关闭荧光。蜜脾锁定文字、颜色与对齐。','染料改變文字顏色，螢光墨囊開啟螢光、墨囊關閉螢光。蜂巢鎖定文字、顏色與對齊。','Dye changes text color; glow ink enables glowing text and ink disables it. Honeycomb locks text, color and alignment.']
 ];
 const rows=[
  ['立式告示牌占上下两格，最多 8 行，行长受牌面宽度限制。','立式告示牌佔上下兩格，最多 8 行，行長受牌面寬度限制。','A sandwich board occupies two vertical blocks and fits up to 8 lines; line length depends on the board’s width.'],
  ...BOARD_STYLE
 ];
 const options=Object.entries(FLOWER_BOARD_TRANSFORMS).filter(([,target])=>target===entry.id).map(([item])=>item);
 if(options.length)rows.push(LOCALES.map(lc=>{
  const names=options.map(item=>guideItemName(payload,lc,item)).join(lc==='en_US'?', ':'、');
  return lc==='en_US'?`Use ${names} on another sandwich board to change it to this style. One item is consumed; the text is kept.`:lc==='zh_CN'?`用${names}操作其他立式告示牌可换成此款；消耗一份，原文字保留。`:`用${names}操作其他立式告示牌可換成此款；消耗一份，原文字保留。`;
 }));
 return rows;
}

export function applyTavernGuideCopy(payload){
 for(const lc of LOCALES)Object.assign(payload.names[lc],GUIDE_NATIVE_NAMES[lc]);
 for(const entry of payload.entries){
  if(!entry.id.startsWith(NS))continue;
  const short=entry.id.slice(NS.length);
  let rows=COPY[short];
  if(short==='glass_bar_cabinet')rows=COPY.bar_cabinet.map(row=>row.map((line,i)=>i===0?line.replace('吧台柜','玻璃吧台柜'):i===1?line.replace('吧檯櫃','玻璃吧檯櫃'):line.replace('bar cabinet','glass bar cabinet')));
  if(VINE_START[short])rows=[VINE_START[short],
   ['种下后移走下方选种方块，为果实留空。藤蔓先向空藤架延伸，再向下结果；骨粉可催长。','種下後移走下方選種方塊，為果實留空。藤蔓先向空藤架延伸，再向下結果；骨粉可催長。','After planting, remove the block below to leave room for fruit. Vines spread to bare trellises before fruiting downward; bone meal speeds growth.'],
   ['用剪刀采收成熟果实，可得三个主果，也有机会得到青提。','用剪刀採收成熟果實，可得三個主果，也有機會得到青提。','Use shears on ripe fruit for three grapes and a chance of bonus green grapes.']
  ];
  if(short.startsWith('pressing/'))rows=[
   ['在压榨桶中把对应水果压成一桶果汁，供酒桶配方使用；液体量与水果份数见制作方法。','在壓榨桶中把對應水果壓成一桶果汁，供酒桶配方使用；液體量與水果份數見製作方法。','Press the listed fruit into a bucket of juice for barrel recipes. The preparation lists its fluid amount and fruit count.'],
   ['压满一桶后用空桶收集，再带到酒桶酿造。','壓滿一桶後用空桶收集，再帶到酒桶釀造。','Once the tub holds a full bucket, collect it with an empty bucket and take it to the barrel.']
  ];
  if(short==='watermelon_juice')rows=[
   ['在西瓜旁装酒嘴，正下方摆空酒瓶，开启酒嘴接取西瓜汁。它不经过酒桶熟成，没有酒的品质等级。','在西瓜旁裝酒嘴，正下方擺空酒瓶，開啟酒嘴接取西瓜汁。它不經過酒桶熟成，沒有酒的品質等級。','Fit a tap to a melon, place an empty bottle directly beneath it and open the tap to collect watermelon juice. It has no aging or drink-quality stages.'],
   ['普通使用饮用，饮用后退回空酒瓶；潜行使用可摆放，空手取回。','普通使用飲用，飲用後退回空酒瓶；潛行使用可擺放，空手取回。','Normal use drinks it and returns an empty bottle. Sneak-use places it; collect it with an empty hand.']
  ];
  const furniture=furnitureItem(entry.id);
  if(!rows&&furniture)rows=FURNITURE[furniture.kind];
  if(entry.id===NS+'chalkboard'||SANDWICH_BOARDS.includes(entry.id))rows=boardRows(entry,payload);
  if(entry.category==='incenses')rows=INCENSE_ROWS;
  if(rows)copyRows(entry,rows);
 }
 return payload;
}
