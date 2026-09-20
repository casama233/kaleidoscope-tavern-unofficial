export const C7_PAGES = [
  {
    "id": "kaleidoscope_tavern:c7_status",
    "title": {
      "zh_TW": "C7 功能與實機狀態",
      "zh_CN": "C7 功能与实机状态",
      "en_US": "C7 feature and engine status"
    },
    "body": {
      "zh_TW": "C7 已接入沙發/吧檯/桌連接、酒櫃與展示架內容保存、大小黑板、野生葡萄生成適配、燃燒瓶、30 tick 下方空瓶自動接酒，以及七項原先待辦的專屬效果。Long Reach 仍沒有等價的穩定 Bedrock 玩家交互距離 API，因此不以其他效果冒充。原生長按已接事件和診斷，但此環境沒有 Minecraft 客戶端，不能標成實機確認。",
      "zh_CN": "C7 已接入沙发/吧台/桌连接、酒柜与展示架内容保存、大小黑板、野生葡萄生成适配、燃烧瓶、30 tick 下方空瓶自动接酒，以及七项原先待办的专属效果。Long Reach 仍没有等价的稳定 Bedrock 玩家交互距离 API，因此不以其他效果冒充。原生长按已接事件和诊断，但此环境没有 Minecraft 客户端，不能标成实机确认。",
      "en_US": "C7 connects sofas/counters/tables, source-sized display storage, chalkboards, a wild-grape worldgen adapter, Molotovs, source-style 30-tick tap extraction, and seven formerly pending custom effects. Long Reach remains pending because this build has no source-equivalent stable per-player interaction-range primitive. Native hold/release is wired and probed but not engine-confirmed here."
    },
    "source": "kaleidoscope_tavern",
    "recipeIds": []
  },
  {
    "id": "kaleidoscope_tavern:c7_decor",
    "title": {
      "zh_TW": "連接家具與展示庫存",
      "zh_CN": "连接家具与展示库存",
      "en_US": "Connected furniture and display storage"
    },
    "body": {
      "zh_TW": "沙發跨顏色自動連接並提供原生座位；吧檯和桌依鄰接切換原作形狀。酒櫃/玻璃酒櫃各2個瓶位、酒窖櫃9、傾斜架3、圓架6、Holder 1、杯架4；存入的是實際物品資料，畫面 helper 只負責顯示。所有座高、碰撞與 client helper 仍需遊戲驗收。",
      "zh_CN": "沙发跨颜色自动连接并提供原生座位；吧台和桌依邻接切换原作形状。酒柜/玻璃酒柜各2个瓶位、酒窖柜9、倾斜架3、圆架6、Holder 1、杯架4；存入的是实际物品数据，画面 helper 只负责显示。所有座高、碰撞与 client helper 仍需游戏验收。",
      "en_US": "Sofas connect across colors and expose a native seat; counters and tables select source connection shapes. Bar/glass cabinets hold 2 bottles, cellar cabinet 9, tilted rack 3, circular rack 6, holder 1 and glassware holder 4. Real item records are authoritative; helpers only render them. Engine seat/collision/renderer acceptance remains pending."
    },
    "source": "kaleidoscope_tavern",
    "recipeIds": []
  },
  {
    "id": "kaleidoscope_tavern:c7_chalkboard",
    "title": {
      "zh_TW": "黑板文字",
      "zh_CN": "黑板文字",
      "en_US": "Chalkboard text"
    },
    "body": {
      "zh_TW": "小黑板1×2，最多350字；三個空白同向小黑板可合成3×2大黑板，最多1500字。支援左/中/右對齊、16色染料、螢光墨/普通墨和蜂蠟鎖定；8格外編輯鎖會解除。文字世界顯示目前採 helper/nameTag 適配，不是 Java 字體渲染器的1:1替代。",
      "zh_CN": "小黑板1×2，最多350字；三个空白同向小黑板可合成3×2大黑板，最多1500字。支持左/中/右对齐、16色染料、荧光墨/普通墨和蜂蜡锁定；8格外编辑锁会解除。文字世界显示目前采用 helper/nameTag 适配，不是 Java 字体渲染器的1:1替代。",
      "en_US": "Small boards are 1x2 / 350 characters; three blank aligned boards can merge into a 3x2 / 1500-character large board. Left/center/right alignment, 16 dyes, glow/normal ink, wax and an 8-block edit lock are implemented. World text currently uses a helper/nameTag adapter rather than Java font-renderer parity."
    },
    "source": "kaleidoscope_tavern",
    "recipeIds": []
  },
  {
    "id": "kaleidoscope_tavern:c7_tap_molotov",
    "title": {
      "zh_TW": "30 tick 酒嘴與燃燒瓶",
      "zh_CN": "30 tick 龙头与燃烧瓶",
      "en_US": "30-tick tap and Molotov"
    },
    "body": {
      "zh_TW": "在酒嘴下方放置酒館空瓶、酒嘴後方連接有成品的酒桶。開啟後30 tick 才結算，前5 tick 顯示滴液；中途來源/空瓶/revision改變會取消。熔岩酒桶配方現在會產燃燒瓶。燃燒瓶按住至少10 tick 後投擲，落點半徑3必定嘗試點火，外延2格按來源機率衰減。西瓜、蜂巢/蜂箱、龍首與熔岩煉藥鍋也可作後方來源；分別產西瓜汁、蜂蜜瓶、龍息瓶與燃燒瓶。紅石自動開酒嘴與水煉藥鍋輸出仍屬後續差異。",
      "zh_CN": "在龙头下方放置酒馆空瓶、龙头后方连接有成品的酒桶。开启后30 tick 才结算，前5 tick显示滴液；中途来源/空瓶/revision改变会取消。熔岩酒桶配方现在会产燃烧瓶。燃烧瓶按住至少10 tick后投掷，落点半径3必定尝试点火，外延2格按来源概率衰减。西瓜、蜂巢/蜂箱、龙首与熔岩炼药锅也可作后方来源；分别产西瓜汁、蜂蜜瓶、龙息瓶与燃烧瓶。红石自动开龙头与水炼药锅输出仍属后续差异。",
      "en_US": "Place a Tavern empty bottle below the tap and a product barrel behind it. Extraction commits at 30 ticks; only the first 5 ticks drip. Source/destination/revision conflicts cancel. The lava-barrel Molotov recipe is active. Hold Molotov use at least 10 ticks to throw; the source radius-3 plus outer-2 ignition probability is adapted. Melon, bee nest/beehive, dragon head and lava cauldron are also supported as rear sources, producing watermelon juice, honey bottle, dragon breath and Molotov respectively. Redstone activation and water-cauldron output remain gaps."
    },
    "source": "kaleidoscope_tavern",
    "recipeIds": [
      "kaleidoscope_tavern:molotov"
    ]
  },
  {
    "id": "kaleidoscope_tavern:c7_native_probe",
    "title": {
      "zh_TW": "原生長按與手持校準",
      "zh_CN": "原生长按与手持校准",
      "en_US": "Native hold and hand calibration"
    },
    "body": {
      "zh_TW": "執行 /function kt_c7_native_probe 後會顯示雪克杯 native start/release/cancel 計數及杯嘴 locator。實際按住/鬆手後再次執行：start/release 有增加才算該客戶端事件有進入。這只是診斷；手腕仍標 NOT_CALIBRATED，需在 Steve/Alex、第一/第三人稱與手機實機截圖後調 data/hand-calibration.json。",
      "zh_CN": "执行 /function kt_c7_native_probe 后会显示雪克杯 native start/release/cancel 计数及杯嘴 locator。实际按住/松手后再次执行：start/release 有增加才算该客户端事件有进入。这只是诊断；手腕仍标 NOT_CALIBRATED，需在 Steve/Alex、第一/第三人称与手机实机截图后调 data/hand-calibration.json。",
      "en_US": "Run /function kt_c7_native_probe before and after a real hold/release. Increases in native start/release counters prove the client reached the wired events. This is diagnostics, not automatic certification. Wrist remains NOT_CALIBRATED until Steve/Alex, first/third-person and touch screenshots are used to tune data/hand-calibration.json."
    },
    "source": "kaleidoscope_tavern",
    "recipeIds": []
  }
];
