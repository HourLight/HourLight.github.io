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
      desc: '放在學院塔，解鎖後僕人可以在這裡幫你整理洞見。',
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
    }
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
    nature_event: 999,   // 節氣活動不限（限時掉落）
    inner_realm: 1,      // 深宮材料每天最多1次
    member_plus: 2,      // 鑰友材料每天最多2次（登入+測驗）
    member_pro: 2        // 大師材料每天最多2次（登入+抽牌）
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

    // 觸發 hl-castle-key 點數（掉到稀有材料加點）
    if(window.hlCastle){
      if(item.rarity === 'rare')      window.hlCastle.addPoints(3);
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

  // ═══ 掉落動畫 v2.0（手遊級開箱體驗）═══
  function showDropToast(item){
    var isLegendary = item.rarity === 'legendary';
    var isRare = item.rarity === 'rare';

    // 觸覺回饋
    if(navigator.vibrate) navigator.vibrate(isLegendary ? [30,50,30] : isRare ? [20,30] : 10);

    // ── 傳說級：全屏光效 + 中央揭示 ──
    if(isLegendary){
      showLegendaryDrop(item);
      return;
    }

    // ── 稀有級：稍大的滑入卡片 + 光暈 ──
    if(isRare){
      showRareDrop(item);
      return;
    }

    // ── 普通：右下角滑入 ──
    var t = document.createElement('div');
    t.style.cssText = [
      'position:fixed;bottom:90px;right:16px;z-index:9999',
      'background:linear-gradient(135deg,#FFF8F0,#FFE8D6)',
      'color:#5a3c22;padding:12px 18px;border-radius:16px',
      'font-size:13px;font-family:Noto Serif TC,serif',
      'box-shadow:0 6px 24px rgba(0,0,0,.15)',
      'opacity:0;transform:translateX(30px) scale(.9)',
      'transition:all .4s cubic-bezier(.16,1,.3,1);pointer-events:none',
      'max-width:220px'
    ].join(';');
    t.innerHTML = '<span style="font-size:20px;vertical-align:middle">' + item.icon + '</span> <strong>' + item.name + '</strong>' +
      '<br><span style="font-size:11px;opacity:.6">' + item.zone + '</span>';
    document.body.appendChild(t);
    setTimeout(function(){ t.style.opacity='1'; t.style.transform='translateX(0) scale(1)'; }, 30);
    setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateX(20px) scale(.9)'; setTimeout(function(){ t.remove(); }, 400); }, 2400);
  }

  // ── 稀有掉落：底部滑入大卡 + 藍色光暈 ──
  function showRareDrop(item){
    var t = document.createElement('div');
    t.style.cssText = [
      'position:fixed;bottom:90px;left:50%;z-index:9999',
      'transform:translateX(-50%) translateY(40px) scale(.85)',
      'background:linear-gradient(135deg,#1a2a4a,#223366)',
      'color:#88bbee;padding:16px 24px;border-radius:18px',
      'font-size:14px;font-family:Noto Serif TC,serif',
      'box-shadow:0 0 30px rgba(85,136,204,.3),0 8px 32px rgba(0,0,0,.25)',
      'border:1.5px solid rgba(85,136,204,.4)',
      'opacity:0;transition:all .5s cubic-bezier(.16,1,.3,1);pointer-events:none',
      'text-align:center;min-width:200px;max-width:280px'
    ].join(';');
    t.innerHTML = '<div style="font-size:32px;margin-bottom:4px;filter:drop-shadow(0 2px 8px rgba(85,136,204,.5))">' + item.icon + '</div>' +
      '<div style="font-weight:700;font-size:15px">' + item.name + '</div>' +
      '<div style="font-size:11px;opacity:.6;margin-top:2px">✧ 稀有材料 · ' + item.zone + '</div>';
    document.body.appendChild(t);

    // 光粒子
    for(var i=0;i<8;i++){
      var p = document.createElement('div');
      var angle = (i/8)*360, rad = angle*Math.PI/180;
      p.style.cssText = 'position:fixed;bottom:140px;left:50%;width:4px;height:4px;border-radius:50%;' +
        'background:#88bbee;z-index:9999;pointer-events:none;opacity:0;' +
        'animation:_rareSpark .8s '+(0.2+i*0.05)+'s ease forwards';
      p.style.setProperty('--sx', Math.cos(rad)*50+'px');
      p.style.setProperty('--sy', Math.sin(rad)*50+'px');
      document.body.appendChild(p);
      setTimeout(function(pp){ return function(){ pp.remove(); }; }(p), 1200);
    }

    setTimeout(function(){ t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0) scale(1)'; }, 30);
    setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(-10px) scale(.95)'; setTimeout(function(){ t.remove(); }, 500); }, 3200);
  }

  // ── 傳說掉落：全屏光爆 + 金色揭示 ──
  function showLegendaryDrop(item){
    // 全屏遮罩
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(10,6,20,.85);' +
      'display:flex;align-items:center;justify-content:center;flex-direction:column;' +
      'opacity:0;transition:opacity .3s;pointer-events:none';

    // 光球
    var orb = document.createElement('div');
    orb.style.cssText = 'width:80px;height:80px;border-radius:50%;' +
      'background:radial-gradient(circle,#f8dfa5,#d4a040,transparent);' +
      'animation:_legOrb 1.5s ease-in-out;opacity:0';

    // 圖標
    var icon = document.createElement('div');
    icon.style.cssText = 'font-size:64px;opacity:0;position:absolute;' +
      'filter:drop-shadow(0 6px 24px rgba(212,160,64,.6));' +
      'animation:_legIcon .5s 1.5s ease forwards';
    icon.textContent = item.icon;

    // 名字
    var name = document.createElement('div');
    name.style.cssText = 'font-size:18px;font-weight:700;color:#f8dfa5;opacity:0;' +
      'font-family:Noto Serif TC,serif;margin-top:14px;text-align:center;' +
      'animation:_legText .4s 1.9s ease forwards';
    name.innerHTML = item.name + '<br><span style="font-size:12px;color:rgba(248,223,165,.6)">✦ 傳說材料 · ' + item.zone + '</span>';

    // 金色碎屑
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
        '@keyframes _legOrb{0%{transform:scale(.2) rotate(0);opacity:0}25%{opacity:1;transform:scale(.7) rotate(90deg)}80%{opacity:1;transform:scale(1.3) rotate(300deg)}100%{transform:scale(3) rotate(360deg);opacity:0}}',
        '@keyframes _legIcon{0%{opacity:0;transform:scale(2.5)}60%{transform:scale(.85)}100%{opacity:1;transform:scale(1)}}',
        '@keyframes _legText{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
        '@keyframes _legConf{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--cx),var(--cy)) rotate(var(--cr))}}',
        '@keyframes _rareSpark{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(0)}}'
      ].join('\n');
      document.head.appendChild(style);
    }

    setTimeout(function(){ overlay.style.opacity='1'; }, 30);
    // 3.5秒後淡出
    setTimeout(function(){
      overlay.style.opacity='0';
      setTimeout(function(){ overlay.remove(); }, 400);
    }, 3500);
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
    showToast:    showDropToast,
    MATERIAL_DEFS: MATERIAL_DEFS,
    RECIPES:      RECIPES
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
