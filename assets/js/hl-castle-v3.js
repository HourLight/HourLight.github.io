/**
 * 馥靈之鑰 · 城堡中樞系統 v3.0
 * castle-hub.html 專用 — 完全獨立於既有 hl-castle-*.js（v1/v2 保留運作）
 *
 * 資料路徑：Firestore users/{uid}/castle_save/state
 * 新欄位（不動既有欄位）：
 *   - cv3_room_lv     : { roomId: level }  房間等級 1-99
 *   - cv3_room_xp     : { roomId: xp }     房間經驗
 *   - cv3_lord_lv     : number              城堡主等級 1-200
 *   - cv3_lord_xp     : number              城堡主經驗
 *   - cv3_quests_daily: { date: [...] }    今日任務
 *   - cv3_quests_week : { weekIso: [...] } 本週任務
 *   - cv3_events_done : [eventId...]       已觸發過的事件
 *   - cv3_servant_mood: { roomId: mood }   僕人心情
 *   - cv3_furniture_t : { id: tier }       傢具進階階段
 *
 * 所有類別前綴 cv3-（CSS）/ cv3_（資料）避免與 v1/v2 衝突
 * © 2026 Hour Light International
 */

(function(){
  'use strict';

  // ═══════════════════════════════════════
  // 12 房間定義（H.O.U.R. × L.I.G.H.T. × 秘境三塊）
  // ═══════════════════════════════════════
  var ROOMS = [
    // H.O.U.R. 四塔
    { id:'mirror',    name:'鏡之廳',   zone:'H', emoji:'🪞', gold:'#f8dfa5',
      desc:'自省與覺察', tools:['akashic-reading.html','past-life.html','name-oracle.html','mirror-oracle.html'],
      servantId:'mirror', primaryMaterial:'誠實碎鏡' },
    { id:'treasure',  name:'價值寶庫', zone:'H', emoji:'💎', gold:'#e9c27d',
      desc:'認識自身價值', tools:['fortune-wealth.html','quiz-value.html','triangle-calculator.html'],
      servantId:'treasure', primaryMaterial:'天命核心' },
    { id:'key',       name:'解鎖密室', zone:'O', emoji:'🔑', gold:'#d4a853',
      desc:'探索內在限制', tools:['quiz-shadow.html','quiz-inner-child.html','chiron-lilith.html'],
      servantId:'key', primaryMaterial:'覺察印記' },
    { id:'throne',    name:'啟程塔',   zone:'R', emoji:'👑', gold:'#b8922a',
      desc:'決策與行動', tools:['destiny-engine.html','destiny-match.html','abundance-prayer-pro.html'],
      servantId:'throne', primaryMaterial:'星辰碎片' },

    // L.I.G.H.T. 五殿
    { id:'love',      name:'愛之殿',   zone:'L', emoji:'💕', gold:'#d6a7c7',
      desc:'關係與連結', tools:['quiz-love-language.html','quiz-attachment.html','destiny-match.html'],
      servantId:'love', primaryMaterial:'玫瑰精魄' },
    { id:'intuition', name:'直覺閣',   zone:'I', emoji:'🔮', gold:'#a07cdc',
      desc:'內在聲音', tools:['draw-hl.html','yijing-oracle.html','angel-oracle.html','tarot-draw.html'],
      servantId:'intuition', primaryMaterial:'靈視殘影' },
    { id:'ground',    name:'磐石廳',   zone:'G', emoji:'🏔️', gold:'#8a6d1f',
      desc:'身體與扎根', tools:['bazi.html','ziwei.html','massage-guide.html','aroma-garden.html'],
      servantId:'ground', primaryMaterial:'五行晶石' },
    { id:'harmony',   name:'和諧苑',   zone:'H', emoji:'🌿', gold:'#7aab6d',
      desc:'平衡與流動', tools:['knowledge-hub.html','aromatherapy-science.html','blending-guide.html'],
      servantId:'harmony', primaryMaterial:'薰衣草晨露' },
    { id:'transform', name:'蛻變室',   zone:'T', emoji:'🦋', gold:'#c97a6d',
      desc:'改變與超越', tools:['hour-training.html','course-slides/index.html','witch-power.html'],
      servantId:'transform', primaryMaterial:'馥靈精髓' },

    // 三秘境（最後解鎖）
    { id:'dream',     name:'夢境走廊', zone:'秘境', emoji:'🌙', gold:'#6d7acc',
      desc:'潛意識對話', tools:['dream-decoder.html','quiz-dream.html','projection-cards.html'],
      servantId:'dream', primaryMaterial:'月光精華' },
    { id:'garden',    name:'記憶花園', zone:'秘境', emoji:'🌸', gold:'#d6a7c7',
      desc:'懷舊與療癒', tools:['yuan-chen-reading.html','quiz-family.html','season-oracle.html'],
      servantId:'garden', primaryMaterial:'橙花羽翼' },
    { id:'tower',     name:'瞭望塔',   zone:'秘境', emoji:'🔭', gold:'#f8dfa5',
      desc:'俯瞰全局', tools:['birthday-gift.html','member-dashboard.html'],
      servantId:'tower', primaryMaterial:'九宮全觀印記' },
  ];

  // ═══════════════════════════════════════
  // 房間升級成本表（Lv.N → Lv.N+1 需要多少材料）
  // ═══════════════════════════════════════
  function roomUpgradeCost(currentLv){
    if (currentLv >= 99) return null; // 封頂
    var base = currentLv;
    // 階段性設計
    if (currentLv < 10) return { common: base+1, rare: 0, legendary: 0, xp_needed: currentLv*10 };
    if (currentLv < 20) return { common: 10, rare: 2, legendary: 0, xp_needed: currentLv*15 };
    if (currentLv < 40) return { common: 15, rare: 5, legendary: 1, xp_needed: currentLv*20 };
    if (currentLv < 70) return { common: 25, rare: 10, legendary: 3, xp_needed: currentLv*30 };
    // 71-99 跨階
    return { common: 40, rare: 20, legendary: 6, xp_needed: currentLv*50 };
  }

  // ═══════════════════════════════════════
  // 城堡主等級經驗表（Lv.1-200）
  // ═══════════════════════════════════════
  function lordXpToNextLv(currentLv){
    if (currentLv >= 200) return null;
    // 經驗值公式：100 × lv × 1.05^lv
    return Math.floor(100 * currentLv * Math.pow(1.05, currentLv/10));
  }

  // ═══════════════════════════════════════
  // 城堡主稱號（依等級）
  // ═══════════════════════════════════════
  function lordTitle(lv){
    if (lv < 10) return '城堡訪客';
    if (lv < 25) return '城堡學徒';
    if (lv < 50) return '鑰友';
    if (lv < 80) return '持鑰者';
    if (lv < 120) return '守護人';
    if (lv < 170) return '馥靈夥伴';
    return '馥靈君主';
  }

  // ═══════════════════════════════════════
  // 二十四節氣（依當前日期判斷）
  // ═══════════════════════════════════════
  var SOLAR_TERMS = [
    { name:'立春', date:[2,4] }, { name:'雨水', date:[2,19] },
    { name:'驚蟄', date:[3,6] }, { name:'春分', date:[3,21] },
    { name:'清明', date:[4,5] }, { name:'穀雨', date:[4,20] },
    { name:'立夏', date:[5,6] }, { name:'小滿', date:[5,21] },
    { name:'芒種', date:[6,6] }, { name:'夏至', date:[6,21] },
    { name:'小暑', date:[7,7] }, { name:'大暑', date:[7,23] },
    { name:'立秋', date:[8,8] }, { name:'處暑', date:[8,23] },
    { name:'白露', date:[9,8] }, { name:'秋分', date:[9,23] },
    { name:'寒露', date:[10,8] }, { name:'霜降', date:[10,23] },
    { name:'立冬', date:[11,7] }, { name:'小雪', date:[11,22] },
    { name:'大雪', date:[12,7] }, { name:'冬至', date:[12,22] },
    { name:'小寒', date:[1,6] }, { name:'大寒', date:[1,20] }
  ];
  function getCurrentSolarTerm(d){
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    var current = SOLAR_TERMS[23]; // 預設大寒
    for (var i = 0; i < SOLAR_TERMS.length; i++) {
      var t = SOLAR_TERMS[i];
      if (m > t.date[0] || (m === t.date[0] && day >= t.date[1])) current = t;
    }
    return current;
  }

  // ═══════════════════════════════════════
  // 一日五時段（視覺切換用）
  // ═══════════════════════════════════════
  function getDayPhase(d){
    d = d || new Date();
    var h = d.getHours();
    if (h >= 5 && h < 8) return { id:'dawn', name:'清晨', mood:'柔和金光', bg_hue:40, bg_sat:30 };
    if (h >= 8 && h < 17) return { id:'day', name:'白晝', mood:'明亮溫暖', bg_hue:50, bg_sat:25 };
    if (h >= 17 && h < 19) return { id:'dusk', name:'黃昏', mood:'橘紅魔幻', bg_hue:20, bg_sat:40 };
    if (h >= 19 && h < 23) return { id:'night', name:'夜晚', mood:'深藍星空', bg_hue:240, bg_sat:30 };
    return { id:'midnight', name:'深夜', mood:'紫霧月光', bg_hue:270, bg_sat:25 };
  }

  // ═══════════════════════════════════════
  // 隨機事件池結構（完整 100+ 事件在 Phase 3 補）
  // ═══════════════════════════════════════
  // 格式：{ id, roomId, weight, minLv, conditions, text, rewards, choices }
  var EVENT_POOL_SEEDS = [
    // 鏡之廳（sample 3 個）
    { id:'mirror_fog',     roomId:'mirror',    weight:10, minLv:1,
      text:'鏡面結了一層霧。你伸手擦拭，看見鏡中的自己笑了一下。',
      rewards:{ xp:10, material:{common:'誠實碎鏡'} } },
    { id:'mirror_older',   roomId:'mirror',    weight:5,  minLv:5,
      text:'鏡中出現 10 年後的自己，正在做一件你現在還不敢做的事。',
      rewards:{ xp:25, material:{rare:'時辰碎片'} } },
    { id:'mirror_broken',  roomId:'mirror',    weight:3,  minLv:15,
      text:'鏡子裂了。僕人說：「有時候破碎才能真的看見。」',
      rewards:{ xp:50, material:{legendary:'沒藥精髓'} } },

    // 價值寶庫（sample 2 個）
    { id:'treasure_coin',  roomId:'treasure',  weight:10, minLv:1,
      text:'寶庫角落掉了一枚金幣，上面刻著你的名字縮寫。',
      rewards:{ xp:10, material:{common:'星辰碎片'} } },
    { id:'treasure_chest', roomId:'treasure',  weight:4,  minLv:10,
      text:'一個從未見過的寶箱自動打開。裡面是一封給你的信，署名「未來的你」。',
      rewards:{ xp:30, material:{rare:'命盤墨跡'} } },

    // 其他 10 房間後續補
    // TODO: Phase 3 補滿 100+ 事件
  ];

  // ═══════════════════════════════════════
  // 僕人心情系統（每房間 5 種心情）
  // ═══════════════════════════════════════
  var SERVANT_MOODS = [
    { id:'bright',    name:'明朗', chance:30, xpBonus:1.2 },
    { id:'calm',      name:'平靜', chance:30, xpBonus:1.0 },
    { id:'pensive',   name:'沉思', chance:20, xpBonus:1.1, materialBonus:{rare:0.1} },
    { id:'playful',   name:'俏皮', chance:15, xpBonus:1.3, materialBonus:{common:0.3} },
    { id:'melancholy',name:'憂愁', chance:5,  xpBonus:0.9, materialBonus:{legendary:0.05} }
  ];
  // 每日決定各房間僕人心情
  function rollDailyMoods(seedStr){
    // 用日期 + uid 作為 seed，保證一天內同一玩家看到的心情固定
    var moods = {};
    ROOMS.forEach(function(room, idx){
      var seedNum = 0;
      for (var i=0; i<seedStr.length; i++) seedNum += seedStr.charCodeAt(i);
      var roll = (seedNum + idx * 97) % 100;
      var cumChance = 0;
      for (var j = 0; j < SERVANT_MOODS.length; j++) {
        cumChance += SERVANT_MOODS[j].chance;
        if (roll < cumChance) { moods[room.id] = SERVANT_MOODS[j].id; break; }
      }
      if (!moods[room.id]) moods[room.id] = 'calm';
    });
    return moods;
  }

  // ═══════════════════════════════════════
  // 每日任務池（Phase 3 補完整 100+）
  // ═══════════════════════════════════════
  var DAILY_QUEST_POOL = [
    { id:'visit3rooms',  text:'今日探訪 3 個不同房間',        target:3, type:'room_visit',    reward:{ xp:50, points:5 } },
    { id:'draw5cards',   text:'抽 5 張馥靈牌',                target:5, type:'draw_card',     reward:{ xp:50, points:5 } },
    { id:'quiz1',        text:'完成 1 個心理測驗',            target:1, type:'quiz_complete', reward:{ xp:30, points:3 } },
    { id:'destiny_run',  text:'計算一次命盤（任一工具）',    target:1, type:'destiny',        reward:{ xp:40, points:4 } },
    { id:'furniture1',   text:'合成 1 件傢具',                target:1, type:'furniture',     reward:{ xp:60, points:6 } },
    { id:'event3',       text:'觸發 3 個房間事件',            target:3, type:'event',         reward:{ xp:45, points:5 } },
    { id:'feed_pet',     text:'餵食寵物 1 次',                target:1, type:'pet_feed',      reward:{ xp:30, points:3 } },
    { id:'share_castle', text:'分享你的城堡給朋友',           target:1, type:'share',         reward:{ xp:100, points:15 } },
    // TODO: Phase 3 補到 30+ 個任務
  ];
  function pickDailyQuests(seedStr, count){
    count = count || 3;
    var shuffled = DAILY_QUEST_POOL.slice();
    var seedNum = 0;
    for (var i=0; i<seedStr.length; i++) seedNum += seedStr.charCodeAt(i);
    // 簡易 seed shuffle
    for (var i = shuffled.length-1; i > 0; i--) {
      var j = (seedNum + i*13) % (i+1);
      var t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
    }
    return shuffled.slice(0, count).map(function(q){
      return Object.assign({}, q, { progress: 0, done: false });
    });
  }

  // ═══════════════════════════════════════
  // 點數 → 材料兌換所
  // ═══════════════════════════════════════
  var MATERIAL_EXCHANGE = {
    common:     { cost: 30,  dailyLimit: 3, label: '1 個 Common 材料（可自選）' },
    rare:       { cost: 80,  dailyLimit: 2, label: '1 個 Rare 材料' },
    legendary:  { cost: 200, dailyLimit: 1, label: '1 個 Legendary 材料' }
  };

  // ═══════════════════════════════════════
  // 對外 API
  // ═══════════════════════════════════════
  window.HLCastleV3 = {
    // 資料
    ROOMS: ROOMS,
    SERVANT_MOODS: SERVANT_MOODS,
    DAILY_QUEST_POOL: DAILY_QUEST_POOL,
    EVENT_POOL_SEEDS: EVENT_POOL_SEEDS,
    MATERIAL_EXCHANGE: MATERIAL_EXCHANGE,
    SOLAR_TERMS: SOLAR_TERMS,

    // 計算
    roomUpgradeCost: roomUpgradeCost,
    lordXpToNextLv: lordXpToNextLv,
    lordTitle: lordTitle,
    getCurrentSolarTerm: getCurrentSolarTerm,
    getDayPhase: getDayPhase,

    // 每日循環
    rollDailyMoods: rollDailyMoods,
    pickDailyQuests: pickDailyQuests,

    // Util：取得房間定義
    getRoom: function(id){
      for (var i = 0; i < ROOMS.length; i++) {
        if (ROOMS[i].id === id) return ROOMS[i];
      }
      return null;
    },

    // 版本資訊
    version: '3.0.0-skeleton',
  };

})();
