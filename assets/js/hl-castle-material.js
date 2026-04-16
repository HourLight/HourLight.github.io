/**
 * 馥靈之鑰 內在城堡｜全站材料掉落系統 v1.0
 * assets/js/hl-castle-material.js
 *
 * 使用方式：
 *   在任何頁面的 hl-tracker.js 之後載入此模組即可自動運作。
 *   不需要改各頁面，改 hl-tracker.js 呼叫一次就全站生效。
 *
 *   頁面內手動觸發：
 *     window.HL_dropMaterial('quiz')           // 完成測驗
 *     window.HL_dropMaterial('calculator')     // 完成計算
 *     window.HL_dropMaterial('draw')           // 完成抽牌
 *     window.HL_dropMaterial('oracle')         // 完成占卜
 *     window.HL_dropMaterial('castle_riddle')  // 完成城堡謎語（城堡專用）
 *
 * 材料稀有度：
 *   common（普通）/ rare（稀有）/ legendary（傳說）
 *
 * 材料庫存在 localStorage: hl_materials_v1
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'hl_materials_v1';

  // ═══ 材料定義表 ═══
  // 每個 zone（區域）對應一批材料，各有稀有度和掉落權重
  var MATERIAL_DEFS = {

    // 覺察殿（quiz 測驗類）
    quiz: [
      { id:'insight_feather',  name:'洞見羽毛',   icon:'🪶', rarity:'common',    weight:50, zone:'覺察殿' },
      { id:'emotion_color',    name:'情緒色彩',   icon:'🎨', rarity:'common',    weight:40, zone:'覺察殿' },
      { id:'mirror_truth',     name:'鏡中真相',   icon:'🪞', rarity:'rare',      weight:8,  zone:'覺察殿' },
      { id:'psyche_crystal',   name:'心靈水晶',   icon:'💎', rarity:'rare',      weight:7,  zone:'覺察殿' },
      { id:'awareness_seal',   name:'覺察印記',   icon:'✴️', rarity:'legendary', weight:1,  zone:'覺察殿' }
    ],

    // 星象塔（calculator 命理計算類）
    calculator: [
      { id:'star_shard',       name:'星辰碎片',   icon:'✨', rarity:'common',    weight:50, zone:'星象塔' },
      { id:'chart_ink',        name:'命盤墨跡',   icon:'📜', rarity:'common',    weight:40, zone:'星象塔' },
      { id:'wuxing_crystal',   name:'五行晶石',   icon:'🔮', rarity:'rare',      weight:8,  zone:'星象塔' },
      { id:'time_fragment',    name:'時辰碎片',   icon:'⏳', rarity:'rare',      weight:6,  zone:'星象塔' },
      { id:'destiny_core',     name:'天命核心',   icon:'🌌', rarity:'legendary', weight:1,  zone:'星象塔', note:'需逐套完成各系統，33合1不計入' }
    ],

    // 神諭廳（draw 抽牌類 + oracle 占卜類）
    draw: [
      { id:'vision_shadow',    name:'靈視殘影',   icon:'🌫️', rarity:'common',    weight:45, zone:'神諭廳' },
      { id:'hexagram_mark',    name:'卦象印記',   icon:'☯️', rarity:'common',    weight:40, zone:'神諭廳' },
      { id:'oil_spirit',       name:'玫瑰精魄',   icon:'🌿', rarity:'rare',      weight:10, zone:'神諭廳' },
      { id:'angel_feather',    name:'橙花羽翼',   icon:'🕊️', rarity:'rare',      weight:8,  zone:'神諭廳' },
      { id:'oracle_essence',   name:'沒藥精髓',   icon:'🔯', rarity:'legendary', weight:1,  zone:'神諭廳' }
  ],

  // 牌卡DNA區（draw-hl 抽到特定類型的牌才掉落）
  draw_dna: [
    { id:'awareness_card_dna', name:'覺察牌碎片',  icon:'🃏', rarity:'common',    weight:60, zone:'牌卡殿' },
    { id:'oil_card_dna',       name:'精油牌印記',  icon:'🌺', rarity:'rare',      weight:35, zone:'牌卡殿' },
    { id:'full_spread_seal',   name:'完整牌陣印',  icon:'⭐', rarity:'legendary', weight:5,  zone:'牌卡殿' }
  ],

  // 大自然元素（季節/節氣特定時間才掉落，平常不掉）
  nature_event: [
    { id:'spring_blossom',   name:'春分花瓣',   icon:'🌸', rarity:'rare',      weight:100, zone:'季節庭院' },
    { id:'summer_thunder',   name:'夏至雷光',   icon:'⚡', rarity:'rare',      weight:100, zone:'季節庭院' },
    { id:'autumn_maple',     name:'秋分楓葉',   icon:'🍁', rarity:'rare',      weight:100, zone:'季節庭院' },
    { id:'winter_solstice',  name:'冬至寒梅',   icon:'❄️', rarity:'legendary', weight:100, zone:'季節庭院' }
  ],

  // 元辰宮原型材料（內在城堡深層，特定條件掉落，不明說來源）
  inner_realm: [
    { id:'palace_light',   name:'宮燈碎光',   icon:'🏮', rarity:'rare',      weight:60, zone:'內在深宮' },
    { id:'flower_spirit',  name:'花靈露珠',   icon:'🌼', rarity:'rare',      weight:35, zone:'內在深宮' },
    { id:'realm_key',      name:'深宮鑰匙',   icon:'🗝️', rarity:'legendary', weight:5,  zone:'內在深宮' }
  ],

  oracle: [
      { id:'vision_shadow',    name:'靈視殘影',   icon:'🌫️', rarity:'common',    weight:45, zone:'神諭廳' },
      { id:'hexagram_mark',    name:'卦象印記',   icon:'☯️', rarity:'common',    weight:40, zone:'神諭廳' },
      { id:'oil_spirit',       name:'玫瑰精魄',   icon:'🌿', rarity:'rare',      weight:10, zone:'神諭廳' },
      { id:'oracle_essence',   name:'沒藥精髓',   icon:'🔯', rarity:'legendary', weight:2,  zone:'神諭廳' }
    ],

    // 城堡專屬（castle_riddle 城堡謎語）
    castle_riddle: [
      { id:'moonlight_shard',  name:'月光碎片',   icon:'🌙', rarity:'common',    weight:40, zone:'城堡主堡' },
      { id:'midnight_silence', name:'乳香低語',   icon:'🕯️', rarity:'common',    weight:35, zone:'城堡主堡' },
      { id:'honest_mirror',    name:'誠實碎鏡',   icon:'🔑', rarity:'rare',      weight:15, zone:'城堡主堡' },
      { id:'dawn_dew',         name:'薰衣草晨露',   icon:'💧', rarity:'rare',      weight:8,  zone:'城堡主堡' },
      { id:'castle_key_core',  name:'城堡鑰芯',   icon:'🗝️', rarity:'legendary', weight:2,  zone:'城堡主堡' }
    ],

    // 學院塔（course 課程類）
    course: [
      { id:'heritage_candle',  name:'乳香傳承',   icon:'🕯️', rarity:'rare',      weight:60, zone:'學院塔' },
      { id:'master_seal',      name:'師者印章',   icon:'📚', rarity:'rare',      weight:30, zone:'學院塔' },
      { id:'wisdom_tome',      name:'智慧典籍',   icon:'📖', rarity:'legendary', weight:10, zone:'學院塔' }
    ],

    // 商會廣場（購課/諮詢，由後台手動觸發）
    commerce: [
      { id:'trust_scroll',     name:'信任之契',   icon:'📋', rarity:'rare',      weight:50, zone:'商會廣場' },
      { id:'gold_key_shard',   name:'金鑰碎片',   icon:'🔶', rarity:'legendary', weight:50, zone:'商會廣場' }
    ],

    // 品牌馥靈馥語
    brand: [
      { id:'fuyu_ink',         name:'馥語墨滴',   icon:'🖋️', rarity:'common',    weight:60, zone:'馥語書房' },
      { id:'scent_memory',     name:'氣味記憶',   icon:'🌸', rarity:'rare',      weight:40, zone:'馥語書房' }
    ],

    // 夢境殿（dream-decoder、castle-room-dream）
    dream: [
      { id:'dream_fragment',  name:'夢境碎片',   icon:'🌙', rarity:'common',    weight:50, zone:'夢境殿' },
      { id:'sleep_mist',      name:'安眠霧氣',   icon:'💨', rarity:'common',    weight:35, zone:'夢境殿' },
      { id:'lucid_crystal',   name:'清醒水晶',   icon:'🔷', rarity:'rare',      weight:12, zone:'夢境殿' },
      { id:'dream_key',       name:'夢境之鑰',   icon:'🗝️', rarity:'epic',      weight:2,  zone:'夢境殿' },
      { id:'subconsious_orb', name:'潛識球核',   icon:'🫧', rarity:'legendary', weight:1,  zone:'夢境殿' }
    ],

    // 和諧苑（castle-room-harmony）
    harmony: [
      { id:'harmony_petal',   name:'和諧花瓣',   icon:'🌸', rarity:'common',    weight:55, zone:'和諧苑' },
      { id:'bond_thread',     name:'羈絆絲線',   icon:'🧵', rarity:'common',    weight:35, zone:'和諧苑' },
      { id:'heart_mirror',    name:'心鏡碎片',   icon:'💞', rarity:'rare',      weight:8,  zone:'和諧苑' },
      { id:'resonance_gem',   name:'共鳴寶石',   icon:'💎', rarity:'epic',      weight:1,  zone:'和諧苑' }
    ],

    // 音樂廳（castle-room-music）
    music_room: [
      { id:'chord_fragment',  name:'和弦碎片',   icon:'🎵', rarity:'common',    weight:55, zone:'音樂廳' },
      { id:'lyric_ink',       name:'樂章墨滴',   icon:'🎶', rarity:'common',    weight:35, zone:'音樂廳' },
      { id:'resonance_note',  name:'共鳴音符',   icon:'🎼', rarity:'rare',      weight:8,  zone:'音樂廳' },
      { id:'soulful_tone',    name:'靈魂音調',   icon:'🎹', rarity:'epic',      weight:2,  zone:'音樂廳' }
    ],

    // 廚房（castle-room-kitchen）
    kitchen_room: [
      { id:'herb_essence',    name:'香草精華',   icon:'🌿', rarity:'common',    weight:55, zone:'廚房' },
      { id:'nourish_glow',    name:'滋養靈光',   icon:'✨', rarity:'common',    weight:35, zone:'廚房' },
      { id:'elixir_drop',     name:'靈藥液滴',   icon:'🧪', rarity:'rare',      weight:8,  zone:'廚房' },
      { id:'primal_spice',    name:'原初香料',   icon:'🫙', rarity:'epic',      weight:2,  zone:'廚房' }
    ],

    // 煉金室（castle-room-alchemy）
    alchemy_room: [
      { id:'alchemy_bubble',  name:'煉金泡泡',   icon:'⚗️', rarity:'common',    weight:50, zone:'煉金室' },
      { id:'transform_dust',  name:'轉化塵埃',   icon:'🌟', rarity:'common',    weight:35, zone:'煉金室' },
      { id:'catalyst_stone',  name:'催化石晶',   icon:'🔵', rarity:'rare',      weight:12, zone:'煉金室' },
      { id:'prime_matter',    name:'原質精素',   icon:'🌀', rarity:'epic',      weight:2,  zone:'煉金室' },
      { id:'philosopher_core',name:'賢者之核',   icon:'⚜️', rarity:'legendary', weight:1,  zone:'煉金室' }
    ],

    // 蛻變室（castle-room-transform）
    transform_room: [
      { id:'chrysalis_dust',  name:'蛹化之粉',   icon:'🦋', rarity:'common',    weight:50, zone:'蛻變室' },
      { id:'rebirth_dew',     name:'重生露珠',   icon:'💧', rarity:'rare',      weight:40, zone:'蛻變室' },
      { id:'phoenix_ash',     name:'鳳凰灰燼',   icon:'🔥', rarity:'epic',      weight:8,  zone:'蛻變室' },
      { id:'evolution_seal',  name:'進化印記',   icon:'🌈', rarity:'legendary', weight:2,  zone:'蛻變室' }
    ],

    // 直覺廳（castle-room-intuition）
    intuition_room: [
      { id:'instinct_spark',  name:'本能火花',   icon:'⚡', rarity:'common',    weight:55, zone:'直覺廳' },
      { id:'sixth_sense',     name:'第六感碎片', icon:'🔮', rarity:'rare',      weight:35, zone:'直覺廳' },
      { id:'precog_crystal',  name:'先知水晶',   icon:'🫧', rarity:'epic',      weight:8,  zone:'直覺廳' },
      { id:'oracle_heart',    name:'神諭心核',   icon:'💗', rarity:'legendary', weight:2,  zone:'直覺廳' }
    ],

    // 愛情室（castle-room-love）
    love_room: [
      { id:'rose_petal_gold', name:'金玫瑰花瓣', icon:'🌹', rarity:'common',    weight:50, zone:'愛情室' },
      { id:'love_thread',     name:'愛之絲線',   icon:'💝', rarity:'rare',      weight:40, zone:'愛情室' },
      { id:'twin_flame',      name:'雙生火焰',   icon:'🕯️', rarity:'epic',      weight:8,  zone:'愛情室' },
      { id:'eternal_bloom',   name:'永恆之花',   icon:'💐', rarity:'legendary', weight:2,  zone:'愛情室' }
    ],

    // 光明殿（castle-light.html）
    light_room: [
      { id:'photon_shard',    name:'光子碎片',   icon:'☀️', rarity:'common',    weight:55, zone:'光明殿' },
      { id:'clarity_beam',    name:'澄明光束',   icon:'🌤️', rarity:'rare',      weight:35, zone:'光明殿' },
      { id:'radiance_core',   name:'輝光核心',   icon:'💫', rarity:'epic',      weight:8,  zone:'光明殿' },
      { id:'dawn_crystal',    name:'黎明水晶',   icon:'🌅', rarity:'legendary', weight:2,  zone:'光明殿' }
    ],

    // 知識學苑（knowledge 閱讀知識頁完畢掉落）
    knowledge: [
      { id:'moonlight_shard',  name:'月光碎片',   icon:'🌙', rarity:'common',    weight:60, zone:'知識學苑' },
      { id:'wisdom_scroll',    name:'智慧卷軸',   icon:'📜', rarity:'rare',      weight:30, zone:'知識學苑' },
      { id:'starlight_page',   name:'星光書頁',   icon:'✨', rarity:'legendary', weight:10, zone:'知識學苑' }
    ],

    // ── 鑰友專屬材料（plus 以上）──
    member_plus: [
      { id:'key_friend_seal',  name:'鑰友印記',   icon:'🔑', rarity:'rare',      weight:50, zone:'會員殿堂', memberOnly:'plus', dropHint:'每日登入自動掉落' },
      { id:'awareness_crystal',name:'覺察水晶',   icon:'💎', rarity:'rare',      weight:40, zone:'會員殿堂', memberOnly:'plus', dropHint:'完成測驗時額外掉落' },
      { id:'moonlight_essence',name:'月光精華',    icon:'🌙', rarity:'legendary', weight:10, zone:'會員殿堂', memberOnly:'plus', dropHint:'每月 1 號自動獲得' }
    ],

    // ── 大師專屬材料（pro）──
    member_pro: [
      { id:'master_star',      name:'大師之星',   icon:'👑', rarity:'legendary', weight:60, zone:'大師寶庫', memberOnly:'pro', dropHint:'每日登入自動掉落' },
      { id:'fuling_essence',   name:'馥靈精髓',   icon:'✨', rarity:'legendary', weight:40, zone:'大師寶庫', memberOnly:'pro', dropHint:'完成抽牌解讀時掉落' }
    ],

    // H.O.U.R. 四階段房間材料
    // 勇氣殿（H 身心校準）
    heal_room: [
      { id:'courage_spark',    name:'勇氣火花',   icon:'🔥', rarity:'common',    weight:50, zone:'勇氣殿' },
      { id:'heal_dew',         name:'癒合露珠',   icon:'💧', rarity:'common',    weight:35, zone:'勇氣殿' },
      { id:'worth_crystal',    name:'自我價值晶石', icon:'💎', rarity:'rare',    weight:12, zone:'勇氣殿' },
      { id:'root_flame',       name:'根源之焰',   icon:'🕯️', rarity:'epic',      weight:2,  zone:'勇氣殿' },
      { id:'heal_seal',        name:'校準印記',   icon:'✴️', rarity:'legendary', weight:1,  zone:'勇氣殿' }
    ],

    // 心門宮（O 智慧辨識）
    own_room: [
      { id:'heart_petal',      name:'心門花瓣',   icon:'🌸', rarity:'common',    weight:50, zone:'心門宮' },
      { id:'wisdom_drop',      name:'智慧液滴',   icon:'🫧', rarity:'common',    weight:35, zone:'心門宮' },
      { id:'discern_lens',     name:'辨識透鏡',   icon:'🔮', rarity:'rare',      weight:12, zone:'心門宮' },
      { id:'gate_key',         name:'心門之鑰',   icon:'🗝️', rarity:'epic',      weight:2,  zone:'心門宮' },
      { id:'own_seal',         name:'識我印記',   icon:'🌀', rarity:'legendary', weight:1,  zone:'心門宮' }
    ],

    // 志氣殿（U 潛能解鎖）
    unlock_room: [
      { id:'potential_seed',   name:'潛能種子',   icon:'🌱', rarity:'common',    weight:50, zone:'志氣殿' },
      { id:'unlock_spark',     name:'解鎖火花',   icon:'⚡', rarity:'common',    weight:35, zone:'志氣殿' },
      { id:'ambition_stone',   name:'志氣石晶',   icon:'🏅', rarity:'rare',      weight:12, zone:'志氣殿' },
      { id:'unlock_key',       name:'潛能鑰匙',   icon:'🔑', rarity:'epic',      weight:2,  zone:'志氣殿' },
      { id:'unlock_seal',      name:'解鎖印記',   icon:'🌟', rarity:'legendary', weight:1,  zone:'志氣殿' }
    ],

    // 平衡室（R 行動進化）
    rise_room: [
      { id:'action_dust',      name:'行動塵埃',   icon:'✨', rarity:'common',    weight:50, zone:'平衡室' },
      { id:'balance_thread',   name:'平衡絲線',   icon:'🧵', rarity:'common',    weight:35, zone:'平衡室' },
      { id:'rise_compass',     name:'行動羅盤',   icon:'🧭', rarity:'rare',      weight:12, zone:'平衡室' },
      { id:'evolution_core',   name:'進化核心',   icon:'🌈', rarity:'epic',      weight:2,  zone:'平衡室' },
      { id:'rise_seal',        name:'進化印記',   icon:'🦋', rarity:'legendary', weight:1,  zone:'平衡室' }
    ],

    // 全站被動掉落（瀏覽任意頁面自然觸發）
    passive_browse: [
      { id:'moonlight_shard',  name:'月光碎片',   icon:'🌙', rarity:'common',    weight:55, zone:'城堡漫步' },
      { id:'insight_feather',  name:'洞見羽毛',   icon:'🪶', rarity:'common',    weight:30, zone:'城堡漫步' },
      { id:'star_shard',       name:'星辰碎片',   icon:'✨', rarity:'rare',      weight:12, zone:'城堡漫步' },
      { id:'oracle_essence',   name:'沒藥精髓',   icon:'🔯', rarity:'legendary', weight:3,  zone:'城堡漫步' }
    ]
  };

  // ═══ 合成配方（材料 → 傢具）═══
  var RECIPES = [
    {
      id: 'reflection_lamp',
      name: '自省燈',
      icon: '🪔',
      desc: '放在城堡書桌上，幫你看清楚自己。',
      ingredients: { honest_mirror: 1, moonlight_shard: 2, insight_feather: 1 },
      zone: '鏡之廳傢具'
    },
    {
      id: 'star_compass',
      name: '星命羅盤',
      icon: '🧭',
      desc: '掛在星象塔入口，記錄你算過的命盤。',
      ingredients: { star_shard: 3, time_fragment: 1, chart_ink: 2 },
      zone: '星象塔傢具'
    },
    {
      id: 'oracle_table',
      name: '神諭占卜台',
      icon: '🔮',
      desc: '放在神諭廳中央，每次占卜後散發光芒。',
      ingredients: { vision_shadow: 2, hexagram_mark: 2, oil_spirit: 1 },
      zone: '神諭廳傢具'
    },
    {
      id: 'aroma_pillow',
      name: '芳療靠枕',
      icon: '🛋️',
      desc: '放在任何房間，讓寵物最喜歡靠在上面。',
      ingredients: { oil_spirit: 2, dawn_dew: 1, emotion_color: 1 },
      zone: '通用傢具'
    },
    {
      id: 'castle_almanac',
      name: '城堡年鑑',
      icon: '📕',
      desc: '最稀有的傢具。記錄你在城堡的所有故事。需要跨區域探索才能合成。',
      ingredients: { destiny_core: 1, oracle_essence: 1, awareness_seal: 1 },
      zone: '傳說傢具'
    },
    {
      id: 'moonlight_fountain',
      name: '月光噴泉',
      icon: '⛲',
      desc: '放在城堡庭院，吸引寵物每天來喝水。',
      ingredients: { moonlight_shard: 3, dawn_dew: 2, angel_feather: 1 },
      zone: '庭院傢具'
    },
    {
      id: 'wisdom_desk',
      name: '智慧書桌',
      icon: '🗂️',
      desc: '放在學院塔，解鎖後小馥可以在這裡幫你整理洞見。',
      ingredients: { wisdom_tome: 1, heritage_candle: 2, chart_ink: 2 },
      zone: '學院塔傢具'
    },
    // ── 鑰友專屬傢具 ──
    {
      id: 'awareness_mirror',
      name: '覺察之鏡',
      icon: '🔮',
      desc: '這面鏡子不照外表，照的是你不敢看的那一面。',
      ingredients: { key_friend_seal: 3, awareness_crystal: 2, moonlight_essence: 1 },
      zone: '會員殿堂傢具',
      memberOnly: 'plus'
    },
    // ── 大師專屬傢具 ──
    {
      id: 'fuling_crown',
      name: '馥靈之冠',
      icon: '🌟',
      desc: '戴上它的人不是成為了國王，是終於承認自己一直都是。',
      ingredients: { master_star: 3, fuling_essence: 2, destiny_core: 1 },
      zone: '大師寶庫傢具',
      memberOnly: 'pro'
    },
    // ── 付費解讀專屬傢具 ──
    {
      id: 'nine_palace_seal',
      name: '九宮全觀印',
      icon: '🏛️',
      desc: '九個方位，九種視角。你看到的世界，從此不再只有正面。',
      ingredients: { nine_palace_mark: 1, oracle_essence: 1, star_shard: 3 },
      zone: '九宮傢具',
      paidOnly: 9
    },
    {
      id: 'matrix_core_altar',
      name: '馥靈矩陣祭壇',
      icon: '⚛️',
      desc: '矩陣的核心不在交叉點上。在你願意承認「我不知道」的那個瞬間。',
      ingredients: { matrix_core: 1, destiny_core: 1, oracle_essence: 1 },
      zone: '矩陣傢具',
      paidOnly: 21
    },
    {
      id: 'castle_throne',
      name: '城堡王座',
      icon: '👑',
      desc: '坐上去的那一刻你會發現——椅子一直都在，只是你以前覺得自己不配坐。這是全城堡最稀有的傢具。',
      ingredients: { calibration_key: 1, matrix_core: 1, nine_palace_mark: 1 },
      zone: '傳說王座',
      paidOnly: 28
    },

    // Tier 1 入門傢具（常見材料合成）
    {
      id: 'dream_lamp',
      name: '夢境小夜燈',
      icon: '🌙',
      desc: '放在床頭，讓你進入深夜時有一點光不那麼孤單。',
      ingredients: { dream_fragment: 2, sleep_mist: 1 },
      zone: '夢境殿傢具',
      tier: 1
    },
    {
      id: 'harmony_cushion',
      name: '和諧坐墊',
      icon: '🪷',
      desc: '坐下去的那一刻，那些糾結的關係好像就稍微鬆了一點。',
      ingredients: { harmony_petal: 3, bond_thread: 1 },
      zone: '和諧苑傢具',
      tier: 1
    },
    {
      id: 'music_stool',
      name: '旋律琴凳',
      icon: '🎹',
      desc: '坐在上面不需要會彈什麼，只需要聽。',
      ingredients: { chord_fragment: 2, lyric_ink: 1 },
      zone: '音樂廳傢具',
      tier: 1
    },
    {
      id: 'herb_rack',
      name: '香草收納架',
      icon: '🌿',
      desc: '廚房的角落，每一格都是一個你記得的味道。',
      ingredients: { herb_essence: 2, nourish_glow: 2 },
      zone: '廚房傢具',
      tier: 1
    },
    {
      id: 'alchemy_stool',
      name: '煉金高腳椅',
      icon: '⚗️',
      desc: '坐在煉金台前，等待一個還沒命名的東西慢慢成形。',
      ingredients: { alchemy_bubble: 3, transform_dust: 1 },
      zone: '煉金室傢具',
      tier: 1
    },
    {
      id: 'butterfly_frame',
      name: '蛻變標本框',
      icon: '🦋',
      desc: '那個從前的自己，不是要被丟掉，是值得被好好放著。',
      ingredients: { chrysalis_dust: 3, rebirth_dew: 1 },
      zone: '蛻變室傢具',
      tier: 1
    },
    {
      id: 'intuition_candle',
      name: '直覺燭光',
      icon: '🕯️',
      desc: '點上它的時候，你聽到的那個聲音，通常是對的。',
      ingredients: { instinct_spark: 2, insight_feather: 2 },
      zone: '直覺廳傢具',
      tier: 1
    },
    {
      id: 'rose_vase',
      name: '愛情玫瑰瓶',
      icon: '🌹',
      desc: '不是等人送你的，是你自己放在那裡提醒自己：值得被愛。',
      ingredients: { rose_petal_gold: 3, harmony_petal: 1 },
      zone: '愛情室傢具',
      tier: 1
    },
    {
      id: 'light_crystal_ball',
      name: '光明水晶球',
      icon: '🔮',
      desc: '放在窗邊，陽光折射的那一下，你就知道今天會沒事的。',
      ingredients: { photon_shard: 3, clarity_beam: 1 },
      zone: '光明殿傢具',
      tier: 1
    },
    {
      id: 'parchment_scroll',
      name: '覺察卷軸架',
      icon: '📜',
      desc: '把你這段時間的洞見都捲起來放好，哪天需要的時候翻出來看。',
      ingredients: { insight_feather: 2, chart_ink: 2 },
      zone: '覺察殿傢具',
      tier: 1
    },

    // Tier 2 進階傢具（普通+稀有材料）
    {
      id: 'starlight_armchair',
      name: '星光靠椅',
      icon: '🪑',
      desc: '坐在上面的人，好像都會開始想起自己是誰。',
      ingredients: { star_shard: 2, wuxing_crystal: 1, insight_feather: 2 },
      zone: '星象塔傢具',
      tier: 2
    },
    {
      id: 'mirror_wardrobe',
      name: '真實衣櫃',
      icon: '🪞',
      desc: '不是照你穿什麼，是照你還沒穿上的那個樣子。',
      ingredients: { mirror_truth: 1, honest_mirror: 1, moonlight_shard: 2 },
      zone: '鏡之廳傢具',
      tier: 2
    },
    {
      id: 'garden_lantern',
      name: '花園石燈',
      icon: '🏮',
      desc: '每晚點亮，讓夜裡走進來的東西都知道這裡有人。',
      ingredients: { angel_feather: 1, harmony_petal: 3, dawn_dew: 1 },
      zone: '庭院傢具',
      tier: 2
    },
    {
      id: 'dream_curtain',
      name: '夢境流紗簾',
      icon: '✨',
      desc: '半透明的，隔著它看出去，現實好像也多了一點神話感。',
      ingredients: { lucid_crystal: 1, dream_fragment: 3, sleep_mist: 2 },
      zone: '夢境殿傢具',
      tier: 2
    },
    {
      id: 'alchemy_cauldron_deco',
      name: '展示用煉金爐',
      icon: '🪄',
      desc: '不是真的要用，是放在那裡讓你記得：你轉化過很多東西了。',
      ingredients: { catalyst_stone: 1, alchemy_bubble: 3, transform_dust: 2 },
      zone: '煉金室傢具',
      tier: 2
    },
    {
      id: 'wisdom_lantern',
      name: '智慧書燈',
      icon: '📖',
      desc: '讀到忘了時間，這盞燈會讓你記得——有些東西不是一晚上能讀完的。',
      ingredients: { wisdom_scroll: 1, chart_ink: 2, moonlight_shard: 1 },
      zone: '學院塔傢具',
      tier: 2
    },
    {
      id: 'key_display',
      name: '鑰匙展示板',
      icon: '🗝️',
      desc: '每一把鑰匙都是你打開過的一扇門的證明。',
      ingredients: { honest_mirror: 1, castle_key_core: 1, star_shard: 2 },
      zone: '城堡入口傢具',
      tier: 2
    },
    {
      id: 'music_shelf',
      name: '音樂收藏架',
      icon: '🎵',
      desc: '那些讓你哭過、笑過、突然想起某個人的歌，都在這裡。',
      ingredients: { resonance_note: 1, chord_fragment: 3, lyric_ink: 2 },
      zone: '音樂廳傢具',
      tier: 2
    },
    {
      id: 'love_window',
      name: '愛情窗框',
      icon: '💝',
      desc: '有時候不是關係不好，是你看出去的角度需要換一個。',
      ingredients: { love_thread: 1, rose_petal_gold: 2, bond_thread: 2 },
      zone: '愛情室傢具',
      tier: 2
    },
    {
      id: 'intuition_board',
      name: '直覺靈感板',
      icon: '🧠',
      desc: '那些說不清楚但就是對的感覺，可以先釘在這裡。',
      ingredients: { sixth_sense: 1, instinct_spark: 3, insight_feather: 1 },
      zone: '直覺廳傢具',
      tier: 2
    },

    // Tier 3 精緻傢具（稀有+史詩材料）
    {
      id: 'transform_altar',
      name: '蛻變祭台',
      icon: '🔥',
      desc: '這是你獻祭「舊的自己」的地方。不是失去，是更新。',
      ingredients: { phoenix_ash: 1, evolution_seal: 1, rebirth_dew: 2 },
      zone: '蛻變室傢具',
      tier: 3
    },
    {
      id: 'harmony_harp',
      name: '和聲豎琴',
      icon: '🎶',
      desc: '這種樂器需要兩隻手，就像真正的關係需要兩個人。',
      ingredients: { resonance_gem: 1, soulful_tone: 1, bond_thread: 3 },
      zone: '和諧苑傢具',
      tier: 3
    },
    {
      id: 'dream_telescope',
      name: '夢境望遠鏡',
      icon: '🔭',
      desc: '有時候你看不清楚的，用這個角度會好一點。',
      ingredients: { subconsious_orb: 1, lucid_crystal: 2, sleep_mist: 3 },
      zone: '夢境殿傢具',
      tier: 3
    },
    {
      id: 'kitchen_oven',
      name: '靈糧窯爐',
      icon: '🫙',
      desc: '滋養自己是一種技能，不是一種奢侈。',
      ingredients: { primal_spice: 1, elixir_drop: 2, herb_essence: 3 },
      zone: '廚房傢具',
      tier: 3
    },
    {
      id: 'light_prism',
      name: '光明稜鏡架',
      icon: '🌈',
      desc: '光進去只有一道白，出來是七種顏色。你也是這樣的。',
      ingredients: { radiance_core: 1, clarity_beam: 2, photon_shard: 3 },
      zone: '光明殿傢具',
      tier: 3
    },
    {
      id: 'intuition_mirror',
      name: '直覺感知鏡',
      icon: '🫧',
      desc: '不是照外表的，是照那些你快說出口又吞回去的話。',
      ingredients: { precog_crystal: 1, oracle_heart: 1, sixth_sense: 2 },
      zone: '直覺廳傢具',
      tier: 3
    },
    {
      id: 'love_altar',
      name: '愛情供桌',
      icon: '💐',
      desc: '供的不是神，是你對關係這件事還保留的那一點點相信。',
      ingredients: { eternal_bloom: 1, twin_flame: 1, love_thread: 2 },
      zone: '愛情室傢具',
      tier: 3
    },
    {
      id: 'star_map_wall',
      name: '命盤星圖牆',
      icon: '🌌',
      desc: '你的命盤不是天花板，是地圖。地圖是告訴你從哪裡出發的。',
      ingredients: { time_fragment: 2, wuxing_crystal: 2, star_shard: 4 },
      zone: '星象塔傢具',
      tier: 3
    },

    // Tier 4 豪華傢具（史詩+傳說材料）
    {
      id: 'oracle_throne_cushion',
      name: '神諭水晶座',
      icon: '💎',
      desc: '坐在上面的人，問題本身會開始變得更清楚。',
      ingredients: { oracle_essence: 1, oracle_heart: 1, vision_shadow: 3 },
      zone: '神諭廳傢具',
      tier: 4
    },
    {
      id: 'alchemy_grand_table',
      name: '大師煉金大桌',
      icon: '⚜️',
      desc: '這張桌子見過太多的「不可能」變成「居然真的可以」。',
      ingredients: { philosopher_core: 1, prime_matter: 1, catalyst_stone: 2 },
      zone: '煉金室傢具',
      tier: 4
    },
    {
      id: 'transform_phoenix',
      name: '蛻變鳳凰雕像',
      icon: '🦅',
      desc: '每次看到它，你都會記得——你已經在火裡待過了，出來了。',
      ingredients: { evolution_seal: 1, phoenix_ash: 2, destiny_core: 1 },
      zone: '蛻變室傢具',
      tier: 4
    },
    {
      id: 'dream_bed',
      name: '清醒夢大床',
      icon: '🛏️',
      desc: '躺在上面你會知道：夢裡你是誰，醒來你就是誰。',
      ingredients: { subconsious_orb: 1, dream_key: 1, lucid_crystal: 2 },
      zone: '夢境殿傢具',
      tier: 4
    },
    {
      id: 'light_crown_shelf',
      name: '光冠陳列台',
      icon: '👑',
      desc: '這裡擺的不是你贏來的，是你一直都有、只是忘了戴上去的。',
      ingredients: { dawn_crystal: 1, radiance_core: 2, photon_shard: 4 },
      zone: '光明殿傢具',
      tier: 4
    },

    // Tier 5 傳說傢具（多件傳說材料）
    {
      id: 'castle_origin_stone',
      name: '城堡原石',
      icon: '🪨',
      desc: '城堡最初的模樣就是這塊石頭。什麼都還不是，但一切都在。',
      ingredients: { destiny_core: 1, awareness_seal: 1, oracle_essence: 1, evolution_seal: 1 },
      zone: '傳說傢具',
      tier: 5
    },
    {
      id: 'eternal_hourglass',
      name: '永恆沙漏',
      icon: '⏳',
      desc: '沙子不是在流逝，是在累積。你一直在進行中。',
      ingredients: { time_fragment: 3, destiny_core: 1, philosopher_core: 1 },
      zone: '傳說傢具',
      tier: 5
    },
    {
      id: 'inner_map',
      name: '內在全境地圖',
      icon: '🗺️',
      desc: '這張地圖不是外面的世界，是你自己。到最後你才知道，它有多大。',
      ingredients: { oracle_heart: 1, precog_crystal: 2, dawn_crystal: 1, awareness_seal: 1 },
      zone: '傳說傢具',
      tier: 5
    },

    // H.O.U.R. 四殿 Tier 1 傢具
    {
      id: 'heal_candle',
      name: '校準蠟燭',
      icon: '🕯️',
      desc: '點上它不是為了照亮別人，是為了看清楚自己站在哪裡。',
      ingredients: { courage_spark: 2, heal_dew: 1 },
      zone: '勇氣殿傢具',
      tier: 1
    },
    {
      id: 'heart_chair',
      name: '心門小椅',
      icon: '🪑',
      desc: '坐在這裡的人，容易說出一些平時說不出口的話。',
      ingredients: { heart_petal: 3, wisdom_drop: 1 },
      zone: '心門宮傢具',
      tier: 1
    },
    {
      id: 'unlock_jar',
      name: '潛能封存罐',
      icon: '🫙',
      desc: '不是把潛能裝進去，是把「我不配」裝進去。蓋上蓋子，放到角落。',
      ingredients: { potential_seed: 3, unlock_spark: 1 },
      zone: '志氣殿傢具',
      tier: 1
    },
    {
      id: 'rise_compass',
      name: '行動指南針',
      icon: '🧭',
      desc: '指南針不告訴你要去哪裡，只告訴你你在哪個方向上。起點就夠了。',
      ingredients: { action_dust: 3, balance_thread: 1 },
      zone: '平衡室傢具',
      tier: 1
    },

    // H.O.U.R. 四殿 Tier 2 傢具（稀有材料）
    {
      id: 'worth_mirror',
      name: '自我價值之鏡',
      icon: '🪞',
      desc: '這面鏡子只看得見你「夠好」的部分。不是假的，是真的只照那個角度。',
      ingredients: { worth_crystal: 1, courage_spark: 3, heal_dew: 2 },
      zone: '勇氣殿傢具',
      tier: 2
    },
    {
      id: 'wisdom_gate_scroll',
      name: '識我智慧卷',
      icon: '📜',
      desc: '展開來什麼都沒寫。你要看什麼，就寫什麼。這才是真正的智慧辨識。',
      ingredients: { discern_lens: 1, heart_petal: 3, wisdom_drop: 2 },
      zone: '心門宮傢具',
      tier: 2
    },
    {
      id: 'potential_lantern',
      name: '潛能引路燈',
      icon: '🏮',
      desc: '你以為它在照亮前方的路。其實它在照亮你走過的路——讓你知道你能走到這裡。',
      ingredients: { ambition_stone: 1, potential_seed: 3, unlock_spark: 2 },
      zone: '志氣殿傢具',
      tier: 2
    },
    {
      id: 'balance_scale',
      name: '行動天平',
      icon: '⚖️',
      desc: '不是用來判斷對錯，是用來問自己：「這個決定，我可以對得起自己嗎？」',
      ingredients: { rise_compass: 1, action_dust: 3, balance_thread: 2 },
      zone: '平衡室傢具',
      tier: 2
    }
  ];

  // ═══ 付費解讀專屬材料 ═══
  MATERIAL_DEFS.paid_reading = [
    { id:'nine_palace_mark',  name:'九宮全觀印記',   icon:'🏛️', rarity:'legendary', weight:100, zone:'付費殿堂', paidOnly:9,  dropHint:'購買9張牌陣AI解讀掉落' },
    { id:'season_fragment',   name:'季節限定碎片',   icon:'🌺', rarity:'legendary', weight:100, zone:'付費殿堂', paidOnly:12, dropHint:'購買12張牌陣AI解讀掉落' },
    { id:'matrix_core',       name:'馥靈矩陣核心',   icon:'⚛️', rarity:'legendary', weight:100, zone:'付費殿堂', paidOnly:21, dropHint:'購買21張牌陣AI解讀掉落' },
    { id:'calibration_key',   name:'完整校準之鑰',   icon:'🔐', rarity:'legendary', weight:100, zone:'付費殿堂', paidOnly:28, dropHint:'購買28張牌陣AI解讀掉落' },
    { id:'paid_rare_shard',   name:'深度解讀碎片',   icon:'💠', rarity:'rare',      weight:100, zone:'付費殿堂', dropHint:'購買AI解讀掉落' },
    { id:'paid_common_glow',  name:'解讀餘暉',       icon:'🌅', rarity:'common',    weight:100, zone:'付費殿堂', dropHint:'購買AI解讀掉落' }
  ];

  // ═══ 每日掉落限制（防刷）═══
  var DAILY_LIMITS = {
    quiz: 5,         // 每天最多從測驗掉 5 次
    calculator: 4,   // 每天最多從命理掉 4 次
    draw: 3,         // 每天最多從抽牌掉 3 次
    oracle: 3,
    castle_riddle: 3, // 城堡謎語每天最多 3 次（對應每天開 3 房）
    course: 1,
    commerce: 999,   // 購課不限
    brand: 2,
    draw_dna: 2,         // 牌卡DNA每天最多2次
    knowledge: 5,        // 知識頁每天最多掉5次月光碎片
    nature_event: 999,   // 節氣活動不限（限時掉落）
    inner_realm: 1,      // 深宮材料每天最多1次
    member_plus: 2,      // 鑰友材料每天最多2次（登入+測驗）
    member_pro: 2,       // 大師材料每天最多2次（登入+抽牌）
    dream: 3,
    harmony: 3,
    music_room: 2,
    kitchen_room: 2,
    alchemy_room: 2,
    transform_room: 2,
    intuition_room: 2,
    love_room: 2,
    light_room: 2
  };

  // ═══ 工具函數 ═══
  function todayKey(){
    var tw = new Date(new Date().getTime() + 8*3600000);
    return tw.getUTCFullYear() + '-' +
      String(tw.getUTCMonth()+1).padStart(2,'0') + '-' +
      String(tw.getUTCDate()).padStart(2,'0');
  }

  function seededRandom(seed){
    var s = seed;
    return function(){
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  // 加權隨機選一個材料
  function pickMaterial(pool){
    var total = pool.reduce(function(sum, m){ return sum + m.weight; }, 0);
    var rand = Math.random() * total;
    var acc = 0;
    for(var i=0; i<pool.length; i++){
      acc += pool[i].weight;
      if(rand < acc) return pool[i];
    }
    return pool[pool.length-1];
  }

  // ═══ 狀態管理 ═══
  function loadMaterials(){
    var def = { inventory:{}, furniture:[], dailyDrops:{}, totalDrops:0 };
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return def;
      var d = JSON.parse(raw);
      return {
        inventory:  d.inventory  || {},
        furniture:  d.furniture  || [],
        dailyDrops: d.dailyDrops || {},
        totalDrops: d.totalDrops || 0
      };
    }catch(e){ return def; }
  }

  function saveMaterials(state){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  }

  // ═══ 核心：掉落材料 ═══
  function dropMaterial(toolType, forceItem){
    var state = loadMaterials();
    var today = todayKey();
    var dailyKey = today + '_' + toolType;
    var dropped = state.dailyDrops[dailyKey] || 0;
    var limit = DAILY_LIMITS[toolType] || 3;

    // 今日已達上限
    if(dropped >= limit){
      return { ok:false, reason:'daily_limit', limit:limit };
    }

    // 取材料池
    var pool = MATERIAL_DEFS[toolType];
    if(!pool || !pool.length){
      return { ok:false, reason:'no_pool' };
    }

    var item = forceItem || pickMaterial(pool);

    // 加入庫存
    state.inventory[item.id] = (state.inventory[item.id] || 0) + 1;
    state.dailyDrops[dailyKey] = dropped + 1;
    state.totalDrops = (state.totalDrops || 0) + 1;

    saveMaterials(state);

    // 回報材料掉落事件
    reportCastleEvent('material_drop', {
      material: item.name, materialId: item.id,
      rarity: item.rarity, zone: item.zone
    });

    // 觸發 hl-castle-key 點數（掉到稀有材料加點）
    if(window.hlCastle){
      if(item.rarity === 'rare')      window.hlCastle.addPoints(3);
      if(item.rarity === 'epic')      window.hlCastle.addPoints(6);
      if(item.rarity === 'legendary') window.hlCastle.addPoints(10);
    }

    return { ok:true, item:item, newCount: state.inventory[item.id] };
  }

  // ═══ 合成傢具 ═══
  function craftFurniture(recipeId){
    var recipe = RECIPES.filter(function(r){ return r.id === recipeId; })[0];
    if(!recipe) return { ok:false, reason:'not_found' };

    // 會員專屬配方檢查
    if(recipe.memberOnly && !planAtLeast(_cachedPlan, recipe.memberOnly)){
      return { ok:false, reason:'member_required', required: recipe.memberOnly };
    }

    var state = loadMaterials();

    // 檢查材料是否足夠
    var missing = [];
    Object.keys(recipe.ingredients).forEach(function(matId){
      var need = recipe.ingredients[matId];
      var have = state.inventory[matId] || 0;
      if(have < need) missing.push({ id:matId, need:need, have:have });
    });

    if(missing.length > 0) return { ok:false, reason:'missing_materials', missing:missing };

    // 扣除材料
    Object.keys(recipe.ingredients).forEach(function(matId){
      state.inventory[matId] -= recipe.ingredients[matId];
    });

    // 加入傢具
    if(state.furniture.indexOf(recipeId) === -1){
      state.furniture.push(recipeId);
    }

    saveMaterials(state);

    // 成就加點
    if(window.hlCastle) window.hlCastle.addPoints(20);

    return { ok:true, recipe:recipe };
  }

  // ═══ 天命核心：逐套命理完成追蹤 ═══
  // 33合1命盤引擎（destiny-engine.html）不計入
  // 必須逐套完成，每套各算一次
  var DESTINY_TOOLS = [
    'bazi-calculator','ziwei-calculator','astro-calculator','hd-calculator',
    'maya-calculator','kabbalah','lifepath-calculator','numerology-calculator',
    'triangle-calculator','fuling-mima','nine-star-ki','cardology',
    'liuren','liuren-oracle','taiyi','tieban','meihua-yishu','yijing-oracle',
    'qimen-dunjia','vedic-jyotish','nakshatra','korean-saju','qizheng-calculator',
    'gene-keys','color-energy','rainbow-number','phone-oracle','name-oracle',
    'celtic-tree','chiron-lilith','helo-lishu','wuyin-wuwei','wuyun-liuqi'
  ]; // 共 33 套，destiny-engine 和 destiny-match 不在列表內

  function recordDestinyComplete(toolId){
    // 記錄某套命理系統完成（排除33合1）
    if(toolId === 'destiny-engine' || toolId === 'destiny-match') return;
    if(DESTINY_TOOLS.indexOf(toolId) === -1) return;
    var state = loadMaterials();
    state.completedDestiny = state.completedDestiny || {};
    state.completedDestiny[toolId] = true;
    var completedCount = Object.keys(state.completedDestiny).length;
    // 達成33套 → 掉落天命核心
    if(completedCount >= 33 && !state.inventory['destiny_core']){
      state.inventory['destiny_core'] = (state.inventory['destiny_core'] || 0) + 1;
      saveMaterials(state);
      showDropToast({ id:'destiny_core', name:'天命核心', icon:'🌌', rarity:'legendary', zone:'星象塔' });
      return true;
    }
    saveMaterials(state);
    return false;
  }

  function getDestinyProgress(){
    var state = loadMaterials();
    var completed = state.completedDestiny || {};
    return {
      completed: Object.keys(completed).length,
      total: DESTINY_TOOLS.length,
      list: completed
    };
  }

    // ═══ 查詢 ═══
  function getInventory(){
    var state = loadMaterials();
    // 補上材料定義資訊
    var result = {};
    Object.keys(state.inventory).forEach(function(id){
      var count = state.inventory[id];
      if(count <= 0) return;
      // 找材料定義
      var def = null;
      Object.values(MATERIAL_DEFS).forEach(function(pool){
        pool.forEach(function(m){ if(m.id === id) def = m; });
      });
      result[id] = Object.assign({}, def || { id:id, name:id, icon:'📦', rarity:'common', zone:'' }, { count:count });
    });
    return result;
  }

  function getFurniture(){
    var state = loadMaterials();
    return state.furniture.map(function(id){
      return RECIPES.filter(function(r){ return r.id === id; })[0];
    }).filter(Boolean);
  }

  function getRecipes(){
    var state = loadMaterials();
    var inv = state.inventory;
    return RECIPES.map(function(recipe){
      var canCraft = true;
      var ingredients = Object.keys(recipe.ingredients).map(function(matId){
        var need = recipe.ingredients[matId];
        var have = inv[matId] || 0;
        if(have < need) canCraft = false;
        // 找材料名稱
        var def = null;
        Object.values(MATERIAL_DEFS).forEach(function(pool){
          pool.forEach(function(m){ if(m.id === matId) def = m; });
        });
        return { id:matId, name: def ? def.name : matId, icon: def ? def.icon : '📦', rarity: def ? def.rarity : 'common', need:need, have:have };
      });
      return Object.assign({}, recipe, {
        canCraft: canCraft,
        owned: state.furniture.indexOf(recipe.id) > -1,
        ingredientList: ingredients
      });
    });
  }

  function getDailyRemaining(toolType){
    var state = loadMaterials();
    var today = todayKey();
    var dropped = state.dailyDrops[today + '_' + toolType] || 0;
    var limit = DAILY_LIMITS[toolType] || 3;
    return Math.max(0, limit - dropped);
  }

  function getAllMaterialDefs(){ return MATERIAL_DEFS; }
  function getAllRecipes(){ return RECIPES; }

  // ═══ 掉落動畫 v3.0（3-tier 手遊級體驗 + 音效）═══
  function showDropToast(item){
    var isLegendary = item.rarity === 'legendary';
    var isRare = item.rarity === 'rare';

    // 觸覺回饋（稀有/傳說加強）
    if(isRare || isLegendary){
      if(navigator.vibrate) navigator.vibrate([15,30,15]);
    } else {
      if(navigator.vibrate) navigator.vibrate(10);
    }

    // 音效
    if(window.HLSound){
      if(isLegendary) HLSound.drop_legendary();
      else if(isRare) HLSound.drop_rare();
      else HLSound.drop_common();
    }

    // ── 傳說級：全屏金光爆炸 + 2秒戲劇性揭示 ──
    if(isLegendary){
      showLegendaryDrop(item);
      return;
    }

    // ── 稀有級：紫色光暈 + 粒子擴散 + 輕微震動 ──
    if(isRare){
      showRareDrop(item);
      return;
    }

    // ── 普通：溫和金色微光，從底部滑入 ──
    var t = document.createElement('div');
    t.style.cssText = [
      'position:fixed;bottom:90px;right:16px;z-index:9999',
      'background:linear-gradient(135deg,#FFF8F0,#FFE8D6)',
      'color:#5a3c22;padding:12px 18px;border-radius:16px',
      'font-size:13px;font-family:Noto Serif TC,serif',
      'box-shadow:0 6px 24px rgba(200,134,42,.2),0 0 12px rgba(233,194,125,.15)',
      'opacity:0;transform:translateY(20px) scale(.9)',
      'transition:all .4s cubic-bezier(.16,1,.3,1);pointer-events:none',
      'max-width:220px;border:1px solid rgba(233,194,125,.25)'
    ].join(';');
    // Golden sparkle particle
    t.innerHTML = '<div style="display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:22px;filter:drop-shadow(0 2px 4px rgba(200,134,42,.3))">' + item.icon + '</span>' +
      '<div><strong>' + item.name + '</strong>' +
      '<br><span style="font-size:11px;opacity:.6">' + item.zone + '</span></div></div>';
    document.body.appendChild(t);
    setTimeout(function(){ t.style.opacity='1'; t.style.transform='translateY(0) scale(1)'; }, 30);
    setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateY(-10px) scale(.95)'; setTimeout(function(){ t.remove(); }, 400); }, 2400);
  }

  // ── 稀有掉落：紫色光暈爆發 + 粒子擴散 + 輕微螢幕震動 ──
  function showRareDrop(item){
    var t = document.createElement('div');
    t.style.cssText = [
      'position:fixed;bottom:90px;left:50%;z-index:9999',
      'transform:translateX(-50%) translateY(40px) scale(.85)',
      'background:linear-gradient(135deg,#2a1a4a,#3a2266)',
      'color:#c8a8ee;padding:18px 26px;border-radius:18px',
      'font-size:14px;font-family:Noto Serif TC,serif',
      'box-shadow:0 0 40px rgba(160,124,220,.35),0 8px 32px rgba(0,0,0,.25)',
      'border:1.5px solid rgba(160,124,220,.45)',
      'opacity:0;transition:all .5s cubic-bezier(.16,1,.3,1);pointer-events:none',
      'text-align:center;min-width:220px;max-width:300px'
    ].join(';');
    t.innerHTML = '<div style="font-size:36px;margin-bottom:6px;filter:drop-shadow(0 2px 12px rgba(160,124,220,.6))">' + item.icon + '</div>' +
      '<div style="font-weight:700;font-size:16px;color:#e0ccff">' + item.name + '</div>' +
      '<div style="font-size:11px;opacity:.55;margin-top:3px">✧ 稀有材料 · ' + item.zone + '</div>';
    document.body.appendChild(t);

    // 紫色光粒子向外擴散
    for(var i=0;i<12;i++){
      var p = document.createElement('div');
      var angle = (i/12)*360, rad = angle*Math.PI/180;
      var dist = 40 + Math.random()*40;
      p.style.cssText = 'position:fixed;bottom:140px;left:50%;width:'+(3+Math.random()*4)+'px;height:'+(3+Math.random()*4)+'px;border-radius:50%;' +
        'background:rgba(160,124,220,'+(0.6+Math.random()*0.4)+');z-index:9999;pointer-events:none;opacity:0;' +
        'animation:_rareSpark .9s '+(0.15+i*0.04)+'s ease forwards';
      p.style.setProperty('--sx', Math.cos(rad)*dist+'px');
      p.style.setProperty('--sy', Math.sin(rad)*dist+'px');
      document.body.appendChild(p);
      setTimeout(function(pp){ return function(){ pp.remove(); }; }(p), 1400);
    }

    // 輕微螢幕震動效果
    document.body.style.transition = 'transform 60ms ease';
    document.body.style.transform = 'translateX(2px)';
    setTimeout(function(){ document.body.style.transform = 'translateX(-2px)'; }, 60);
    setTimeout(function(){ document.body.style.transform = 'translateX(1px)'; }, 120);
    setTimeout(function(){ document.body.style.transform = ''; document.body.style.transition = ''; }, 180);

    setTimeout(function(){ t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0) scale(1)'; }, 30);
    setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(-12px) scale(.95)'; setTimeout(function(){ t.remove(); }, 500); }, 3200);
  }

  // ── 傳說掉落：全屏金光爆炸 + 粒子雨 + 2秒戲劇性揭示 + 放大動畫 ──
  function showLegendaryDrop(item){
    // 全屏遮罩
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(10,6,20,.88);' +
      'display:flex;align-items:center;justify-content:center;flex-direction:column;' +
      'opacity:0;transition:opacity .4s;pointer-events:none;overflow:hidden';

    // 全屏金光閃爆（初始閃光）
    var flash = document.createElement('div');
    flash.style.cssText = 'position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(248,223,165,.6),transparent 70%);' +
      'opacity:0;animation:_legFlash 1.2s .3s ease-out forwards;pointer-events:none';

    // 光球（旋轉聚能）
    var orb = document.createElement('div');
    orb.style.cssText = 'width:90px;height:90px;border-radius:50%;' +
      'background:radial-gradient(circle,#f8dfa5 0%,#d4a040 40%,transparent 70%);' +
      'animation:_legOrb 1.8s ease-in-out;opacity:0;' +
      'box-shadow:0 0 60px rgba(248,223,165,.5),0 0 120px rgba(212,160,64,.3)';

    // 圖標（2秒延遲後揭示，scale 動畫）
    var icon = document.createElement('div');
    icon.style.cssText = 'font-size:72px;opacity:0;position:absolute;' +
      'filter:drop-shadow(0 8px 32px rgba(212,160,64,.7));' +
      'animation:_legIcon .6s 1.8s ease forwards';
    icon.textContent = item.icon;

    // 名字（金色漸層文字）
    var name = document.createElement('div');
    name.style.cssText = 'font-size:20px;font-weight:700;color:#f8dfa5;opacity:0;' +
      'font-family:Noto Serif TC,serif;margin-top:16px;text-align:center;' +
      'animation:_legText .5s 2.2s ease forwards;' +
      'text-shadow:0 2px 12px rgba(212,160,64,.4)';
    name.innerHTML = item.name + '<br><span style="font-size:13px;color:rgba(248,223,165,.55)">✦ 傳說材料 · ' + item.zone + '</span>';

    // 金色粒子雨（從上方落下）
    var rainContainer = document.createElement('div');
    rainContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
    var rainColors = ['#f8dfa5','#d4a040','#FFD166','#e9c27d','#c8862a','#fff0a0'];
    for(var r=0;r<40;r++){
      var rain = document.createElement('div');
      var rSize = 3 + Math.random()*6;
      var rLeft = Math.random()*100;
      var rDelay = 1.6 + Math.random()*1.5;
      var rDur = 1.5 + Math.random()*2;
      var rRot = Math.random()*720;
      rain.style.cssText = 'position:absolute;top:-10px;left:'+rLeft+'%;' +
        'width:'+rSize+'px;height:'+rSize+'px;' +
        'border-radius:'+(Math.random()>.5?'50%':'2px')+';' +
        'background:'+rainColors[r%rainColors.length]+';' +
        'opacity:0;animation:_legRain '+rDur+'s '+rDelay+'s ease forwards;' +
        '--rot:'+rRot+'deg';
      rainContainer.appendChild(rain);
    }

    // 金色碎屑（從中心爆開）
    var confetti = document.createElement('div');
    confetti.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
    var colors = ['#f8dfa5','#d4a040','#FFD166','#e9c27d','#c8862a'];
    for(var i=0;i<30;i++){
      var c = document.createElement('div');
      var cx=(Math.random()-0.5)*300, cy=-(50+Math.random()*200), cr=Math.random()*720;
      c.style.cssText = 'position:absolute;left:50%;top:50%;width:'+(4+Math.random()*6)+'px;height:'+(4+Math.random()*6)+'px;' +
        'border-radius:'+(Math.random()>.5?'50%':'2px')+';background:'+colors[i%colors.length]+';' +
        'opacity:0;animation:_legConf 1.2s '+(1.4+Math.random()*0.4)+'s ease forwards;' +
        '--cx:'+cx+'px;--cy:'+cy+'px;--cr:'+cr+'deg';
      confetti.appendChild(c);
    }

    overlay.appendChild(flash);
    overlay.appendChild(rainContainer);
    overlay.appendChild(orb);
    overlay.appendChild(icon);
    overlay.appendChild(name);
    overlay.appendChild(confetti);
    document.body.appendChild(overlay);

    // 注入 keyframes（只注入一次）
    if(!document.getElementById('_legDropCSS')){
      var style = document.createElement('style');
      style.id = '_legDropCSS';
      style.textContent = [
        '@keyframes _legOrb{0%{transform:scale(.2) rotate(0);opacity:0}25%{opacity:1;transform:scale(.7) rotate(90deg)}80%{opacity:1;transform:scale(1.3) rotate(300deg)}100%{transform:scale(3.5) rotate(360deg);opacity:0}}',
        '@keyframes _legIcon{0%{opacity:0;transform:scale(3)}50%{transform:scale(.8)}70%{transform:scale(1.1)}100%{opacity:1;transform:scale(1)}}',
        '@keyframes _legText{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}',
        '@keyframes _legConf{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--cx),var(--cy)) rotate(var(--cr))}}',
        '@keyframes _legFlash{0%{opacity:0;transform:scale(1)}20%{opacity:.8}100%{opacity:0;transform:scale(2)}}',
        '@keyframes _legRain{0%{opacity:.9;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(100vh) rotate(var(--rot,360deg))}}',
        '@keyframes _rareSpark{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(0)}}'
      ].join('\n');
      document.head.appendChild(style);
    }

    setTimeout(function(){ overlay.style.opacity='1'; }, 30);
    // 4秒後淡出（extended for dramatic reveal）
    setTimeout(function(){
      overlay.style.opacity='0';
      setTimeout(function(){ overlay.remove(); }, 500);
    }, 4000);
  }

  // ═══ 付費解讀盲盒掉落系統 ═══
  // n = 抽幾張牌 (3/5/7/9/12/21/28)
  // 回傳掉落的材料陣列（前端做盲盒開箱動畫用）
  function dropPaidReadingMaterials(n){
    var drops = [];
    var inv = getInventory();
    var paidDefs = MATERIAL_DEFS.paid_reading || [];

    // 通用材料掉落
    var commonDef = paidDefs.find(function(d){ return d.id === 'paid_common_glow'; });
    var rareDef = paidDefs.find(function(d){ return d.id === 'paid_rare_shard'; });

    // 根據張數決定掉落（機率刻意壓低，增加收集慾望）
    // 每個盲盒固定 4 格，部分格子可能是「空」（增加懸念）
    var boxCount = 4; // 固定4個盲盒

    if(n >= 3){
      // 普通 ×1-2（65%機率各格）
      for(var i=0;i<2;i++) if(commonDef && Math.random() < 0.65) drops.push(commonDef);
    }
    if(n >= 5){
      // 稀有 ×1（30%機率）+ 普通 ×1
      if(commonDef) drops.push(commonDef);
      if(rareDef && Math.random() < 0.30) drops.push(rareDef);
    }
    if(n >= 7){
      // 稀有 ×1（55%）+ 稀有 ×1（25%）
      if(rareDef && Math.random() < 0.55) drops.push(rareDef);
      if(rareDef && Math.random() < 0.25) drops.push(rareDef);
    }
    if(n >= 9){
      // 九宮全觀印記（20%機率，不是每次都有！）
      var nineP = paidDefs.find(function(d){ return d.id === 'nine_palace_mark'; });
      if(nineP && Math.random() < 0.20) drops.push(nineP);
      if(rareDef && Math.random() < 0.45) drops.push(rareDef);
    }
    if(n >= 12){
      // 季節限定碎片（15%機率）
      var season = paidDefs.find(function(d){ return d.id === 'season_fragment'; });
      if(season && Math.random() < 0.15) drops.push(season);
      if(rareDef) drops.push(rareDef);
    }
    if(n >= 21){
      // 馥靈矩陣核心（10%機率！非常稀有）
      var matrix = paidDefs.find(function(d){ return d.id === 'matrix_core'; });
      if(matrix && Math.random() < 0.10) drops.push(matrix);
      if(rareDef) drops.push(rareDef);
    }
    if(n >= 28){
      // 完整校準之鑰（5%機率！極稀有，要買非常多次才能集齊）
      var calKey = paidDefs.find(function(d){ return d.id === 'calibration_key'; });
      if(calKey && Math.random() < 0.05) drops.push(calKey);
      if(rareDef) drops.push(rareDef);
    }

    // 補到至少 2 個（保底普通材料，不會空手而歸）
    while(drops.length < 2 && commonDef) drops.push(commonDef);
    // 最多 boxCount 個
    if(drops.length > boxCount) drops = drops.slice(0, boxCount);

    // 實際加入庫存
    drops.forEach(function(d){
      inv[d.id] = (inv[d.id] || 0) + 1;
    });
    saveInventory(inv);

    return drops;
  }

  // ═══ 盲盒開箱動畫（全屏，一個一個揭示）═══
  function showBlindBoxReveal(drops, callback){
    if(!drops || !drops.length){ if(callback) callback(); return; }

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(10,6,20,.92);' +
      'display:flex;align-items:center;justify-content:center;flex-direction:column;' +
      'opacity:0;transition:opacity .4s;font-family:Noto Serif TC,serif';

    // 標題
    var title = document.createElement('div');
    title.style.cssText = 'font-size:1.2rem;font-weight:700;color:#f8dfa5;margin-bottom:24px;text-align:center;' +
      'opacity:0;animation:_legText .4s .3s ease forwards';
    title.textContent = '✦ 盲盒開啟 ✦';

    // 盲盒容器
    var boxArea = document.createElement('div');
    boxArea.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:340px;padding:0 20px';

    // 每個材料先顯示為「？」盲盒
    drops.forEach(function(drop, idx){
      var box = document.createElement('div');
      box.style.cssText = 'width:72px;height:88px;border-radius:14px;display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:all .4s;' +
        'opacity:0;animation:_legText .3s '+(0.5+idx*0.15)+'s ease forwards;' +
        'background:linear-gradient(135deg,rgba(60,40,20,.9),rgba(80,50,25,.8));' +
        'border:2px solid rgba(212,160,64,.3);box-shadow:0 4px 16px rgba(0,0,0,.3);' +
        'position:relative;overflow:hidden';

      // 問號
      var qmark = document.createElement('div');
      qmark.style.cssText = 'font-size:2rem;color:rgba(248,223,165,.5);animation:_legOrb 2s ease-in-out infinite;filter:none';
      qmark.textContent = '❓';
      qmark.style.animation = 'none';

      // 光效遮罩
      var shine = document.createElement('div');
      shine.style.cssText = 'position:absolute;inset:0;background:linear-gradient(135deg,transparent,rgba(248,223,165,.1),transparent);' +
        'animation:_shimBox 2s ease-in-out infinite;pointer-events:none';

      box.appendChild(qmark);
      box.appendChild(shine);
      box.dataset.idx = idx;

      // 點擊揭示
      box.onclick = function(){
        if(box.dataset.revealed) return;
        box.dataset.revealed = '1';
        if(navigator.vibrate) navigator.vibrate(drop.rarity === 'legendary' ? [30,50,30] : 15);

        // 揭示動畫
        var rarityBg = drop.rarity === 'legendary' ? 'linear-gradient(135deg,rgba(60,40,10,.95),rgba(90,60,15,.9))' :
                       drop.rarity === 'rare' ? 'linear-gradient(135deg,rgba(20,40,70,.95),rgba(30,50,90,.9))' :
                       'linear-gradient(135deg,rgba(40,30,50,.9),rgba(50,35,60,.85))';
        var rarityBorder = drop.rarity === 'legendary' ? 'rgba(248,223,165,.6)' :
                           drop.rarity === 'rare' ? 'rgba(85,136,204,.5)' : 'rgba(200,180,220,.3)';
        var rarityLabel = drop.rarity === 'legendary' ? '✦ 傳說' : drop.rarity === 'rare' ? '✧ 稀有' : '';

        box.style.background = rarityBg;
        box.style.borderColor = rarityBorder;
        box.style.transform = 'scale(1.1)';
        if(drop.rarity === 'legendary') box.style.boxShadow = '0 0 30px rgba(248,223,165,.4),0 8px 24px rgba(0,0,0,.3)';
        setTimeout(function(){ box.style.transform = 'scale(1)'; }, 200);

        box.innerHTML = '<div style="font-size:1.8rem;filter:drop-shadow(0 2px 8px rgba(0,0,0,.4))">' + drop.icon + '</div>' +
          '<div style="font-size:.62rem;color:' + (drop.rarity === 'legendary' ? '#f8dfa5' : drop.rarity === 'rare' ? '#88bbee' : '#c8b8d8') +
          ';font-weight:700;text-align:center;line-height:1.2;padding:0 4px">' + drop.name + '</div>' +
          (rarityLabel ? '<div style="font-size:.5rem;color:rgba(248,223,165,.6)">' + rarityLabel + '</div>' : '');

        // 檢查是否全部揭示完
        var allRevealed = true;
        boxArea.querySelectorAll('[data-idx]').forEach(function(b){ if(!b.dataset.revealed) allRevealed = false; });
        if(allRevealed){
          setTimeout(function(){
            var closeBtn = document.createElement('button');
            closeBtn.style.cssText = 'margin-top:24px;padding:12px 36px;background:linear-gradient(135deg,#d4a040,#b87a20);' +
              'color:#fff;border:none;border-radius:20px;font-family:inherit;font-size:.92rem;font-weight:700;' +
              'cursor:pointer;min-height:48px;opacity:0;animation:_legText .3s ease forwards';
            closeBtn.textContent = '收下這份覺察';
            closeBtn.onclick = function(){
              overlay.style.opacity = '0';
              setTimeout(function(){ overlay.remove(); if(callback) callback(); }, 400);
            };
            overlay.appendChild(closeBtn);
          }, 600);
        }
      };

      boxArea.appendChild(box);
    });

    overlay.appendChild(title);
    overlay.appendChild(boxArea);
    document.body.appendChild(overlay);

    // 注入盲盒專用 keyframe
    if(!document.getElementById('_blindBoxCSS')){
      var s = document.createElement('style');
      s.id = '_blindBoxCSS';
      s.textContent = '@keyframes _shimBox{0%,100%{opacity:.3;transform:translateX(-100%)}50%{opacity:.6;transform:translateX(100%)}}';
      document.head.appendChild(s);
    }

    setTimeout(function(){ overlay.style.opacity = '1'; }, 30);
  }

  // ═══ Firestore 事件回報（非阻塞） ═══
  function reportCastleEvent(type, data) {
    try {
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
        var user = firebase.auth().currentUser;
        if (user) {
          firebase.firestore().collection('events').add({
            uid: user.uid,
            type: 'castle_' + type,
            data: data || {},
            ts: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
          }).catch(function(){});
        }
      }
    } catch(e) {}
  }

  // ═══ 公開 API ═══
  window.hlMaterial = {
    drop:         dropMaterial,
    craft:        craftFurniture,
    getInventory: getInventory,
    getFurniture: getFurniture,
    getRecipes:   getRecipes,
    getDailyRemaining: getDailyRemaining,
    getAllDefs:    getAllMaterialDefs,
    getAllRecipes: getAllRecipes,
    recordDestinyComplete: recordDestinyComplete,
    getDestinyProgress: getDestinyProgress,
    DESTINY_TOOLS: DESTINY_TOOLS,
    reportCastleEvent: reportCastleEvent,
    showToast:    showDropToast,
    dropPaidReading: dropPaidReadingMaterials,
    showBlindBox: showBlindBoxReveal,
    MATERIAL_DEFS: MATERIAL_DEFS,
    RECIPES:      RECIPES,
    exchangePointsForMaterial: function(rarityTier) {
      // rarityTier: 'rare' (50 pts) or 'epic' (200 pts)
      var cost = rarityTier === 'epic' ? 200 : 50;
      if(!window.hlCastle || typeof hlCastle.getPoints !== 'function') return { ok:false, reason:'no_points_system' };
      var currentPts = hlCastle.getPoints();
      if(currentPts < cost) return { ok:false, reason:'insufficient_points', have:currentPts, need:cost };

      // Pick random material of that rarity
      var allMats = [];
      Object.values(MATERIAL_DEFS).forEach(function(pool){
        pool.forEach(function(m){ if(m.rarity === rarityTier) allMats.push(m); });
      });
      if(!allMats.length) return { ok:false, reason:'no_materials' };
      var mat = allMats[Math.floor(Math.random() * allMats.length)];

      // Deduct points
      hlCastle.addPoints(-cost);

      // Add material
      var state = loadMaterials();
      state.inventory[mat.id] = (state.inventory[mat.id] || 0) + 1;
      saveMaterials(state);

      return { ok:true, item:mat };
    }
  };

  // ═══ 自動整合 HL_track ═══
  // 攔截 hl-tracker.js 的 HL_track，完成事件自動掉材料
  var _origHLTrack = window.HL_track;
  function patchHLTrack(){
    if(window.HL_track && window.HL_track !== _patchedTrack){
      _origHLTrack = window.HL_track;
      window.HL_track = _patchedTrack;
    }
  }

  function _patchedTrack(eventType, detail){
    // 呼叫原始追蹤
    if(_origHLTrack) _origHLTrack(eventType, detail);

    // 根據事件類型決定掉材料的 toolType
    var toolTypeMap = {
      quiz_complete:         'quiz',
      draw_complete:         'draw',
      calculator_complete:   'calculator',
      calc_complete:         'calculator',       // destiny-engine.html 用這個名稱
      oracle_complete:       'oracle',
      castle_complete:       'castle_riddle',
      match_complete:        'calculator',       // destiny-match.html 合盤完成
      pet_reading_complete:  'draw',             // pet-reading.html 寵物占卜
      course_view:           'course',
      brand_interact:        'brand'
    };
    // 追蹤逐套命理完成（天命核心條件）
    if(eventType === 'calculator_complete' && detail && detail.toolId){
      recordDestinyComplete(detail.toolId);
    }

    var matType = toolTypeMap[eventType];
    if(!matType) return;

    var result = dropMaterial(matType);
    if(result.ok) showDropToast(result.item);

    // 會員額外掉落檢查
    checkMemberBonusDrop(matType);
  }

  // 等 HL_track 準備好後再 patch
  var _patchInterval = setInterval(function(){
    if(window.HL_track){
      patchHLTrack();
      clearInterval(_patchInterval);
    }
  }, 300);

  // 也提供直接呼叫的版本
  window.HL_dropMaterial = function(toolType){
    var result = dropMaterial(toolType);
    if(result.ok) showDropToast(result.item);
    return result;
  };

  // ═══ 節氣活動系統 ═══
  // 每年四個節氣各有限定材料，當天進入城堡自動掉落一次
  var SEASONAL_EVENTS = [
    // [月, 日範圍起, 日範圍止, 材料id]
    { month:3,  dayFrom:19, dayTo:22, matId:'spring_blossom',  name:'春分' },
    { month:6,  dayFrom:20, dayTo:23, matId:'summer_thunder',  name:'夏至' },
    { month:9,  dayFrom:22, dayTo:25, matId:'autumn_maple',    name:'秋分' },
    { month:12, dayFrom:21, dayTo:24, matId:'winter_solstice', name:'冬至' }
  ];

  function checkSeasonalDrop(){
    // 用 UTC+8 當天日期
    var tw = new Date(new Date().getTime() + 8*3600000);
    var m = tw.getUTCMonth() + 1; // 1-12
    var d = tw.getUTCDate();
    var today = todayKey();
    var state = loadMaterials();

    SEASONAL_EVENTS.forEach(function(ev){
      if(m !== ev.month) return;
      if(d < ev.dayFrom || d > ev.dayTo) return;
      // 今天已掉過就跳過
      var key = today + '_seasonal_' + ev.matId;
      if(state.dailyDrops[key]) return;

      // 掉落節氣材料
      var pool = MATERIAL_DEFS['nature_event'];
      var mat = pool.filter(function(m){ return m.id === ev.matId; })[0];
      if(!mat) return;
      state.inventory[mat.id] = (state.inventory[mat.id] || 0) + 1;
      state.dailyDrops[key] = 1;
      if(window.hlCastle) window.hlCastle.addPoints(5); // 節氣加 5 點
      saveMaterials(state);
      // 特別顯示節氣 toast
      showDropToast(Object.assign({}, mat, { name: ev.name + '｜' + mat.name }));
    });
  }

  // 頁面載入時執行節氣檢查
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', checkSeasonalDrop);
  } else {
    setTimeout(checkSeasonalDrop, 1000); // 等其他系統載入完畢
  }

  // 公開節氣檢查（方便測試）
  window.HL_checkSeasonal = checkSeasonalDrop;

  // ═══ Sonnet 4 災後補償機制 ═══
  // 2026-04-14 因 Sonnet 4 誤改 localStorage 導致部分用戶材料損失
  // 這個函數偵測「曾經使用過城堡（streak/totalRooms > 0）但 inventory 空」的用戶
  // 一次性補償 8 個普通材料 + 2 個稀有材料（足夠做 2 次煉金交換）
  // 用 localStorage flag 確保只執行一次
  function sonnet4CompensationCheck(){
    try{
      var FLAG_KEY = 'hl_sonnet4_compensated';
      // 已補過就不再執行
      if(localStorage.getItem(FLAG_KEY) === 'true') return;

      // 讀城堡狀態，判斷是否曾經使用過
      var castleRaw = localStorage.getItem('hl_castle_v1');
      if(!castleRaw) return; // 沒城堡 state 代表新用戶，跳過
      var castleState;
      try { castleState = JSON.parse(castleRaw); } catch(e){ return; }
      var hasHistory = (castleState.streak > 0) ||
                       (castleState.totalRooms > 0) ||
                       (castleState.totalPoints > 0) ||
                       (castleState.diary && castleState.diary.length > 0);
      if(!hasHistory) return; // 沒用過城堡，不補

      // 檢查 inventory 狀態
      var matState = loadMaterials();
      var commonCount = 0;
      Object.keys(matState.inventory).forEach(function(id){
        // 找材料定義
        Object.values(MATERIAL_DEFS).forEach(function(pool){
          pool.forEach(function(m){
            if(m.id === id && m.rarity === 'common'){
              commonCount += matState.inventory[id] || 0;
            }
          });
        });
      });

      // 如果有充足材料，不補
      if(commonCount >= 5) {
        localStorage.setItem(FLAG_KEY, 'true'); // 也記為已處理，避免每次都掃
        return;
      }

      // ── 開始補償：選 8 個不同的普通材料 + 2 個稀有 ──
      var commonPool = [];
      var rarePool = [];
      Object.keys(MATERIAL_DEFS).forEach(function(zone){
        MATERIAL_DEFS[zone].forEach(function(m){
          if(m.rarity === 'common') commonPool.push(m);
          else if(m.rarity === 'rare') rarePool.push(m);
        });
      });

      var compensated = [];
      // 補 8 個普通材料（隨機抽取）
      for(var i = 0; i < 8 && commonPool.length > 0; i++){
        var pick = commonPool[Math.floor(Math.random() * commonPool.length)];
        matState.inventory[pick.id] = (matState.inventory[pick.id] || 0) + 1;
        compensated.push(pick);
      }
      // 補 2 個稀有材料（作為額外補償）
      for(var j = 0; j < 2 && rarePool.length > 0; j++){
        var rpick = rarePool[Math.floor(Math.random() * rarePool.length)];
        matState.inventory[rpick.id] = (matState.inventory[rpick.id] || 0) + 1;
        compensated.push(rpick);
      }

      saveMaterials(matState);
      localStorage.setItem(FLAG_KEY, 'true');

      // 顯示補償通知 toast（3 秒後）
      setTimeout(function(){
        var div = document.createElement('div');
        div.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);'+
          'background:linear-gradient(135deg,#2a1a3e,#1a0f2e);color:#f8dfa5;'+
          'padding:16px 24px;border:1.5px solid #f8dfa5;border-radius:16px;'+
          'box-shadow:0 8px 32px rgba(0,0,0,.6);z-index:9999;max-width:320px;'+
          'font-size:.85rem;line-height:1.7;text-align:center';
        div.innerHTML = '✦ 城堡整修完成 ✦<br>' +
          '<span style="font-size:.8rem;color:rgba(248,223,165,.85)">系統送你 10 個材料作為補償<br>可以直接拿去煉金交換</span>' +
          '<div style="margin-top:10px;font-size:1.2rem">📦 × 8 &nbsp; ✨ × 2</div>';
        document.body.appendChild(div);
        setTimeout(function(){ div.style.transition='opacity .5s'; div.style.opacity='0'; setTimeout(function(){div.remove();}, 500); }, 6000);
      }, 3000);

      // Log to console for debugging
      console.log('[Sonnet4Compensation] 已補發 10 個材料:', compensated.map(function(m){return m.name;}).join('、'));

    } catch(e) {
      console.error('[Sonnet4Compensation] 補償失敗:', e);
    }
  }

  // 頁面載入時執行災後補償檢查（延後 2 秒，等其他 state 載入完畢）
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(sonnet4CompensationCheck, 2000);
    });
  } else {
    setTimeout(sonnet4CompensationCheck, 2000);
  }

  // 公開補償檢查（方便測試或手動觸發）
  window.HL_sonnet4Compensate = sonnet4CompensationCheck;

  // ═══ 會員等級偵測 ═══
  // 優先讀 Firebase（透過 hl-ai-gate.js 同邏輯），fallback localStorage
  function getMemberPlan(cb){
    // 1. 檢查促銷試用（和 hl-ai-gate 一致）
    try{
      var trialUntil = localStorage.getItem('hl_promo_trial_until');
      if(trialUntil && new Date() < new Date(trialUntil)){
        cb('pro'); return;
      }
    }catch(e){}

    // 2. Firebase
    try{
      if(typeof firebase !== 'undefined' && firebase.auth){
        var user = firebase.auth().currentUser;
        if(user){
          firebase.firestore().collection('users').doc(user.uid).get().then(function(doc){
            var data = doc.exists ? doc.data() : {};
            cb(data.plan || 'free');
          }).catch(function(){ cb(_localPlan()); });
          return;
        }
      }
    }catch(e){}

    // 3. localStorage fallback
    cb(_localPlan());
  }

  function _localPlan(){
    try{
      var raw = localStorage.getItem('hl_user_plan');
      if(raw) return raw;
    }catch(e){}
    return 'free';
  }

  // 同步版（快取）：給 UI 快速判斷用
  var _cachedPlan = 'free';
  function refreshCachedPlan(){
    getMemberPlan(function(p){ _cachedPlan = p; });
  }
  function getCachedPlan(){ return _cachedPlan; }

  // 判斷：plan 是否 >= 指定等級
  function planAtLeast(plan, required){
    var rank = { 'free':0, 'plus':1, 'pro':2 };
    return (rank[plan] || 0) >= (rank[required] || 0);
  }

  // ═══ 會員每日登入自動掉落 ═══
  function checkMemberDailyDrop(){
    getMemberPlan(function(plan){
      _cachedPlan = plan;
      if(plan === 'free') return;

      var state = loadMaterials();
      var today = todayKey();

      // 鑰友（plus）以上：每日掉落鑰友印記
      if(planAtLeast(plan, 'plus')){
        var plusKey = today + '_member_daily_plus';
        if(!state.dailyDrops[plusKey]){
          var seal = MATERIAL_DEFS['member_plus'][0]; // 鑰友印記
          state.inventory[seal.id] = (state.inventory[seal.id] || 0) + 1;
          state.dailyDrops[plusKey] = 1;
          saveMaterials(state);
          showDropToast(Object.assign({}, seal, { name: '🔑 ' + seal.name + '（鑰友專屬）' }));
        }
      }

      // 大師（pro）：每日額外掉落大師之星
      if(plan === 'pro'){
        var proKey = today + '_member_daily_pro';
        if(!state.dailyDrops[proKey]){
          var star = MATERIAL_DEFS['member_pro'][0]; // 大師之星
          state.inventory[star.id] = (state.inventory[star.id] || 0) + 1;
          state.dailyDrops[proKey] = 1;
          saveMaterials(state);
          setTimeout(function(){
            showDropToast(Object.assign({}, star, { name: '👑 ' + star.name + '（大師專屬）' }));
          }, 3200); // 錯開鑰友 toast
        }
      }

      // 每月 1 號：鑰友以上獲得月光精華
      var tw = new Date(new Date().getTime() + 8*3600000);
      if(tw.getUTCDate() === 1 && planAtLeast(plan, 'plus')){
        var monthKey = today + '_member_monthly';
        if(!state.dailyDrops[monthKey]){
          state = loadMaterials(); // 重新讀取（前面可能改過）
          var moonEss = MATERIAL_DEFS['member_plus'][2]; // 月光精華
          state.inventory[moonEss.id] = (state.inventory[moonEss.id] || 0) + 1;
          state.dailyDrops[monthKey] = 1;
          saveMaterials(state);
          setTimeout(function(){
            showDropToast(Object.assign({}, moonEss, { name: '🌙 ' + moonEss.name + '（每月限定）' }));
          }, 6400);
        }
      }
    });
  }

  // ═══ 會員額外掉落：測驗完成 → 覺察水晶（plus+），抽牌完成 → 馥靈精髓（pro）═══
  function checkMemberBonusDrop(eventType){
    var plan = _cachedPlan;

    // 鑰友以上 + 完成測驗 → 額外掉落覺察水晶
    if(eventType === 'quiz' && planAtLeast(plan, 'plus')){
      var crystal = MATERIAL_DEFS['member_plus'][1]; // 覺察水晶
      var result = dropMaterial('member_plus', crystal);
      if(result.ok){
        setTimeout(function(){
          showDropToast(Object.assign({}, crystal, { name: '💎 ' + crystal.name + '（鑰友專屬）' }));
        }, 3200);
      }
    }

    // 大師 + 完成抽牌解讀 → 額外掉落馥靈精髓
    if(eventType === 'draw' && plan === 'pro'){
      var essence = MATERIAL_DEFS['member_pro'][1]; // 馥靈精髓
      var result2 = dropMaterial('member_pro', essence);
      if(result2.ok){
        setTimeout(function(){
          showDropToast(Object.assign({}, essence, { name: '✨ ' + essence.name + '（大師專屬）' }));
        }, 3200);
      }
    }
  }

  // 頁面載入時執行會員掉落檢查（等 Firebase 就緒）
  function initMemberDrops(){
    setTimeout(checkMemberDailyDrop, 2000);
    refreshCachedPlan();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initMemberDrops);
  } else {
    setTimeout(initMemberDrops, 2000);
  }

  // ═══ 擴充公開 API ═══
  window.hlMaterial.getMemberPlan    = getMemberPlan;
  window.hlMaterial.getCachedPlan    = getCachedPlan;
  window.hlMaterial.planAtLeast      = planAtLeast;
  window.hlMaterial.refreshCachedPlan = refreshCachedPlan;
  window.hlMaterial.checkMemberBonusDrop = checkMemberBonusDrop;

})();
