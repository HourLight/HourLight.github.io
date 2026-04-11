/**
 * 馥靈之鑰 內在城堡｜寵物系統 v1.0
 * assets/js/hl-castle-pets.js
 *
 * 架構：
 *   第一層：元辰動物（對應生肖，只有一隻，根據農曆生日自動判斷）
 *   第二層：貓咪（不在生肖中，可養多隻，各有花色個性）
 *   第三層：宮燈精靈「光光」（城堡守護，固定配置）
 *
 * 依賴：hl-castle-key.js（hlCastle）、hl-castle-material.js（hlMaterial）
 * localStorage key：hl_pets_v1
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'hl_pets_v1';

  // ═══ 元辰動物定義（12生肖 + 龍）═══
  var ZODIAC_PETS = {
    rat:    { id:'rat',    icon:'🐭', name:'靈靈', zodiac:'鼠', energy:'靈活，善找機會',
              voice:'碎嘴，快速',
              quotes:['那條路你沒注意，但我看見了。','有一個辦法你還沒試過。要聽嗎？','今天的困難，換個角度看，它有一個縫。','佛手柑的香氣讓前額葉活躍，你想清楚了嗎？有時候聞一聞就夠了。'] },
    ox:     { id:'ox',    icon:'🐮', name:'穩穩', zodiac:'牛', energy:'踏實，一步一步',
              voice:'慢，但每句算數',
              quotes:['就一步。今天做了嗎？','不快沒關係，走了就是走了。','你扛著很多。放一樣下來試試。'] },
    tiger:  { id:'tiger', icon:'🐯', name:'燦燦', zodiac:'虎', energy:'行動，力量',
              voice:'直接，不囉嗦',
              quotes:['你的力量一直在，別壓著。','想了就去做，等的成本比失敗高。','今天有沒有做一件讓自己驕傲的事？'] },
    rabbit: { id:'rabbit',icon:'🐰', name:'小白', zodiac:'兔', energy:'溫柔，感受力強',
              voice:'輕聲，帶問句',
              quotes:['你有好好休息嗎？','你感覺到的，都是真的。','今天有人讓你覺得溫暖嗎？'] },
    dragon: { id:'dragon',icon:'🐉', name:'賦賦', zodiac:'龍', energy:'沉默中的巨大能量',
              voice:'話少，每句都重',
              quotes:['你已經有足夠的力量了。','那個等待不是浪費，是在準備。','你的天賦不需要每天證明。'],
              special: true, // 只給屬龍的人，非屬龍用戶不顯示
              growthStory: ['剛出生，還是一條小蜥蜴。','翅膀芽長出來了，要飛的日子不遠了。','賦賦展翅，守護整座城堡。'] },
    snake:  { id:'snake', icon:'🐍', name:'微微', zodiac:'蛇', energy:'直覺，看穿假象',
              voice:'精準，不多解釋',
              quotes:['那個不舒服的感覺，它在說什麼？','你的直覺沒有騙你。','有些事情不用說清楚，你懂的。'] },
    horse:  { id:'horse', icon:'🐴', name:'奔奔', zodiac:'馬', energy:'自由，需要方向',
              voice:'奔放，問大問題',
              quotes:['你現在做的，是你真正想做的嗎？','停下來不是放棄，是找方向。','自由不是沒有目標，是知道為什麼走。'] },
    goat:   { id:'goat',  icon:'🐑', name:'雲雲', zodiac:'羊', energy:'溫和，藝術感',
              voice:'輕柔，帶美感',
              quotes:['今天有沒有讓自己看一樣美的東西？','柔軟不是軟弱，是一種選擇。','你創造的東西，有沒有讓你自己喜歡？'] },
    monkey: { id:'monkey',icon:'🐒', name:'跳跳', zodiac:'猴', energy:'好奇，什麼都想試',
              voice:'跳躍，充滿能量',
              quotes:['今天學了什麼新的嗎？哪怕很小。','好奇心是你最好的武器。','那個看起來很難的，試了才知道。'] },
    rooster:{ id:'rooster',icon:'🐓', name:'早早', zodiac:'雞', energy:'有條理，要求高',
              voice:'認真，有點嚴',
              quotes:['做了很多，但有沒有誇過自己？','條理不是束縛，是讓你走得更遠。','今天哪件事做得比昨天好？'] },
    dog:    { id:'dog',   icon:'🐶', name:'橘子', zodiac:'狗', energy:'忠誠，重情',
              voice:'溫暖，有點黏',
              quotes:['你付出很多。讓自己被照顧一次。','你在嗎？我在這裡。','今天有沒有人讓你覺得被愛？','薰衣草的芳樟醇對應「允許被愛」的能力，你讓自己被照顧了嗎？'] },
    pig:    { id:'pig',   icon:'🐷', name:'圓圓', zodiac:'豬', energy:'豐盛，相信好事',
              voice:'樂觀，看小事',
              quotes:['今天有沒有一件讓你覺得還不錯的事？','豐盛是一種練習，從注意小事開始。','好事正在來的路上。','甜橙精油裡的d-檸檬烯在幾分鐘內就能提升多巴胺，豐盛感有時候從氣味開始。'] }
  };

  // 農曆年份對應生肖（1900-2050）
  var ZODIAC_YEARS = {
    rat:[1900,1912,1924,1936,1948,1960,1972,1984,1996,2008,2020,2032,2044],
    ox:[1901,1913,1925,1937,1949,1961,1973,1985,1997,2009,2021,2033,2045],
    tiger:[1902,1914,1926,1938,1950,1962,1974,1986,1998,2010,2022,2034,2046],
    rabbit:[1903,1915,1927,1939,1951,1963,1975,1987,1999,2011,2023,2035,2047],
    dragon:[1904,1916,1928,1940,1952,1964,1976,1988,2000,2012,2024,2036,2048],
    snake:[1905,1917,1929,1941,1953,1965,1977,1989,2001,2013,2025,2037,2049],
    horse:[1906,1918,1930,1942,1954,1966,1978,1990,2002,2014,2026,2038,2050],
    goat:[1907,1919,1931,1943,1955,1967,1979,1991,2003,2015,2027,2039],
    monkey:[1908,1920,1932,1944,1956,1968,1980,1992,2004,2016,2028,2040],
    rooster:[1909,1921,1933,1945,1957,1969,1981,1993,2005,2017,2029,2041],
    dog:[1910,1922,1934,1946,1958,1970,1982,1994,2006,2018,2030,2042],
    pig:[1911,1923,1935,1947,1959,1971,1983,1995,2007,2019,2031,2043]
  };

  // ═══ 貓咪定義（8種花色）═══
  var CATS = [
    { id:'fuyun',   name:'浮雲', color:'布偶貓',  icon:'🐱', emoji:'🫧',
      desc:'白底灰斑，深藍眼。最冷靜，坐在哪裡就成為那裡的主人。',
      room:'鏡之廳',
      quote:'你有沒有試過，什麼都不做，只是坐著？我每天都在做。',
      unlockCond:'完成覺察殿任意 10 道測驗',
      unlockKey:'quiz_count_10',
      tier:'free' },
    { id:'keke',    name:'可可', color:'暹羅貓',  icon:'🐈', emoji:'🐾',
      desc:'奶油底，耳鼻四肢深棕。話最多，但每句都有意思。',
      room:'瞭望塔',
      quote:'你今天說了很多，但有沒有說到你真正想說的？',
      unlockCond:'連續 7 天完成城堡謎語',
      unlockKey:'streak_7',
      tier:'free' },
    { id:'yuanyuan',name:'圓圓', color:'摺耳貓',  icon:'😺', emoji:'🌀',
      desc:'灰藍色，耳朵往前折。最黏人，你不在時最難過。',
      room:'愛之殿',
      quote:'你回來了。我等了你一整天。',
      unlockCond:'分享城堡卡 5 次',
      unlockKey:'share_count_5',
      tier:'free' },
    { id:'xiaoma',  name:'小馬', color:'賓士貓',  icon:'🐈‍⬛', emoji:'🖤',
      desc:'黑白花色，白色鬍鬚。有自己的規矩，但對你破例。',
      room:'解鎖密室',
      quote:'你說要改變的那件事，你是說真的嗎？我想看你做到。',
      unlockCond:'完成蛻變室謎語 5 次',
      unlockKey:'transform_5',
      tier:'plus' },
    { id:'panghu',  name:'胖虎', color:'橘貓',    icon:'🧡', emoji:'🧡',
      desc:'橘色虎斑，肚子白白的。食慾驚人，對生活充滿熱情。',
      room:'記憶花園',
      quote:'今天有沒有好好吃一餐？',
      unlockCond:'合成第一件傢具',
      unlockKey:'first_furniture',
      tier:'free' },
    { id:'qiqi',    name:'七七', color:'花貓',    icon:'🎀', emoji:'🌈',
      desc:'黑白橘三色，每個用戶的花紋隨機。最隨性，每天狀態不一樣。',
      room:'不固定',
      quote:'今天是新的一天。不需要跟昨天一樣。',
      unlockCond:'完成全套 L.I.G.H.T. 五個房間',
      unlockKey:'light_complete',
      tier:'plus' },
    { id:'hupo',    name:'琥珀', color:'玳瑁貓',  icon:'🐾', emoji:'🍂',
      desc:'黑橘棕三色混合。溫柔但有主見，不喜歡被打擾。',
      room:'和諧苑',
      quote:'你是不是又在照顧別人、忘了照顧自己？',
      unlockCond:'完成自我疼惜測驗',
      unlockKey:'selfcompassion_done',
      tier:'plus' },
    { id:'xuegao',  name:'雪糕', color:'白貓',    icon:'🤍', emoji:'❄️',
      desc:'純白，異瞳（一藍一金）。最安靜，眼神最深。',
      room:'夢境走廊',
      quote:'你知道嗎，你其實已經知道答案了。',
      unlockCond:'完成城堡全 12 個房間各至少一次',
      unlockKey:'all_rooms_once',
      tier:'pro' },
    { id:'doudou',  name:'豆豆', color:'虎斑貓',  icon:'🐱', emoji:'⚡',
      desc:'灰色虎斑，額頭有M字花紋。精力充沛，最愛在房間之間跑來跑去。',
      room:'王座廳',
      quote:'你今天做了什麼讓自己往前走了一步？',
      unlockCond:'完成 H.O.U.R. 四個房間',
      unlockKey:'hour_complete',
      tier:'free' }
  ];

  // ═══ 工具函數 ═══
  function todayKey(){
    var tw = new Date(new Date().getTime() + 8*3600000);
    return tw.getUTCFullYear() + '-' +
      String(tw.getUTCMonth()+1).padStart(2,'0') + '-' +
      String(tw.getUTCDate()).padStart(2,'0');
  }

  // 推算生肖（使用農曆年份精確計算）
  function getZodiacFromYear(birthYear){
    // 嘗試用 lunar.js 精確取得農曆年的生肖
    // 注意：只有年份時，假設生日在農曆新年之後（大部分人適用）
    // 真正精確需要完整生日，但年份已能覆蓋90%+的情況
    try {
      if(typeof Solar !== 'undefined'){
        // 用該年 3 月 1 日（一定在農曆新年之後）取得該年的農曆年份
        var lunar = Solar.fromYmd(birthYear, 3, 1).getLunar();
        var lunarYear = lunar.getYear();
        // 農曆年份對應生肖（用12地支）
        var zhiAnimals = ['rat','ox','tiger','rabbit','dragon','snake','horse','goat','monkey','rooster','dog','pig'];
        return zhiAnimals[(lunarYear - 4) % 12];
      }
    } catch(e) {}
    // fallback：查表
    for(var zodiac in ZODIAC_YEARS){
      if(ZODIAC_YEARS[zodiac].indexOf(birthYear) > -1) return zodiac;
    }
    // 最終回退：用12年週期
    var base = 2000;
    var cycle = ['dragon','snake','horse','goat','monkey','rooster','dog','pig','rat','ox','tiger','rabbit'];
    return cycle[((birthYear - base) % 12 + 12) % 12];
  }

  // 根據用戶資料判斷是否屬龍
  function isDragon(birthYear){ return getZodiacFromYear(birthYear) === 'dragon'; }

  // ═══ 狀態管理 ═══
  function loadPets(){
    var def = {
      zodiac: null,           // 元辰動物 id
      birthYear: null,        // 用戶出生年份
      ownedCats: [],          // 已解鎖的貓咪 id 陣列
      petMoods: {},           // { petId: { mood:0-100, lastFed:'' } }
      lightLevel: 80,         // 光光亮度 0-100
      lastVisit: '',          // 最後回訪日期
      streakDays: 0,          // 連續天數（從 hlCastle 同步）
      totalExplore: 0,        // 總探索次數
      unlockedConditions: {}, // 記錄已達成的解鎖條件 { key: true }
      firstFurnitureDone: false
    };
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return def;
      return Object.assign(def, JSON.parse(raw));
    }catch(e){ return def; }
  }

  function savePets(state){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  }

  // ═══ 初始化：設定元辰動物 ═══
  function initZodiac(birthYear){
    var state = loadPets();
    if(state.zodiac && state.birthYear === birthYear) return state.zodiac;
    var zodiac = getZodiacFromYear(birthYear);
    state.zodiac = zodiac;
    state.birthYear = birthYear;
    // 初始化情緒值
    if(!state.petMoods[zodiac]) state.petMoods[zodiac] = { mood:70, lastFed:'' };
    savePets(state);
    return zodiac;
  }

  // ═══ 每日更新（頁面載入時執行）═══
  function dailyUpdate(){
    var state = loadPets();
    var today = todayKey();
    if(state.lastVisit === today) return;

    // 同步連續天數
    if(window.hlCastle) state.streakDays = hlCastle.getState().streak;

    // 光光亮度：每天沒來 -10，回來 +20
    var lastDate = state.lastVisit;
    if(lastDate){
      var daysDiff = Math.round((new Date(today) - new Date(lastDate)) / 86400000);
      if(daysDiff >= 2) state.lightLevel = Math.max(10, state.lightLevel - (daysDiff - 1) * 10);
    }
    state.lightLevel = Math.min(100, state.lightLevel + 20);

    // 寵物情緒：每天未餵 -5，在城堡互動自動 +10
    Object.keys(state.petMoods).forEach(function(pid){
      var m = state.petMoods[pid];
      if(m.lastFed !== today){
        m.mood = Math.max(20, (m.mood || 60) - 5);
      }
    });

    // 貓咪解鎖條件檢查
    checkUnlockConditions(state);

    state.lastVisit = today;
    savePets(state);
  }

  // ═══ 解鎖條件檢查 ═══
  function checkUnlockConditions(state){
    if(!window.hlCastle || !window.hlMaterial) return;
    var castleState = hlCastle.getState();
    var diary = hlCastle.getDiary(999);

    // streak_7
    if(castleState.streak >= 7) state.unlockedConditions['streak_7'] = true;
    // share_count_5
    if((castleState.shareCount||0) >= 5) state.unlockedConditions['share_count_5'] = true;
    // quiz_count_10：從日記統計
    var quizCount = diary.filter(function(d){ return d.roomId === 'mirror'||d.roomId === 'treasure'; }).length;
    if(castleState.totalRooms >= 10 || quizCount >= 10) state.unlockedConditions['quiz_count_10'] = true;
    // first_furniture
    var furniture = hlMaterial.getFurniture();
    if(furniture.length > 0) state.unlockedConditions['first_furniture'] = true;
    // hour_complete（H.O.U.R. 四房各完成一次）
    var hourRooms = ['mirror','treasure','key','throne'];
    var hourDone = hourRooms.every(function(r){ return milestones[r]; });
    if(hourDone) state.unlockedConditions['hour_complete'] = true;
    // light_complete（L.I.G.H.T. 五房各完成一次）
    var lightRooms = ['love','intuition','ground','harmony','transform'];
    var milestones = castleState.milestones || {};
    var lightDone = lightRooms.every(function(r){ return milestones[r]; });
    if(lightDone) state.unlockedConditions['light_complete'] = true;
    // all_rooms_once（12房各至少一次）
    var allRooms = ['mirror','treasure','key','throne','love','intuition','ground','harmony','transform','dream','garden','tower'];
    var allDone = allRooms.every(function(r){ return milestones[r]; });
    if(allDone) state.unlockedConditions['all_rooms_once'] = true;
    // transform_5：從日記統計
    var transformCount = diary.filter(function(d){ return d.roomId === 'transform'; }).length;
    if(transformCount >= 5) state.unlockedConditions['transform_5'] = true;
    // selfcompassion_done：從材料推算（完成相關測驗會有材料）
    var inv = hlMaterial.getInventory();
    if(inv['insight_feather'] && inv['insight_feather'].count >= 5) state.unlockedConditions['selfcompassion_done'] = true;
  }

  // ═══ 今日語錄（每日固定一句，用日期當種子）═══
  function getTodayQuote(petId){
    var pet = ZODIAC_PETS[petId] || CATS.find(function(c){ return c.id===petId; });
    if(!pet || !pet.quotes) return '';
    var today = todayKey();
    var seed = 0;
    for(var i=0;i<today.length;i++) seed = ((seed<<5)-seed) + today.charCodeAt(i);
    seed = Math.abs(seed);
    return pet.quotes[seed % pet.quotes.length];
  }

  // ═══ 餵食（用材料給情緒值）═══
  function feedPet(petId, materialId){
    var state = loadPets();
    var today = todayKey();
    var mood = state.petMoods[petId] || { mood:60, lastFed:'' };

    // 每天只能餵一次
    if(mood.lastFed === today) return { ok:false, reason:'already_fed' };

    // 消耗材料
    if(materialId && window.hlMaterial){
      var inv = hlMaterial.getInventory();
      var matState = JSON.parse(localStorage.getItem('hl_materials_v1')||'{}');
      if(!matState.inventory || !matState.inventory[materialId] || matState.inventory[materialId] <= 0){
        return { ok:false, reason:'no_material' };
      }
      matState.inventory[materialId]--;
      localStorage.setItem('hl_materials_v1', JSON.stringify(matState));
    }

    mood.mood = Math.min(100, (mood.mood||60) + 15);
    mood.lastFed = today;
    state.petMoods[petId] = mood;
    state.lightLevel = Math.min(100, state.lightLevel + 5);
    savePets(state);

    return { ok:true, newMood: mood.mood };
  }

  // ═══ 公開 API ═══
  window.hlPets = {

    // 設定元辰動物（用戶登入後呼叫）
    initZodiac: initZodiac,

    // 每日更新
    dailyUpdate: dailyUpdate,

    // 取得元辰動物
    getZodiacPet: function(){
      var state = loadPets();
      if(!state.zodiac) return null;
      var def = ZODIAC_PETS[state.zodiac];
      if(!def) return null;
      var mood = state.petMoods[state.zodiac] || { mood:60 };
      return Object.assign({}, def, {
        mood: mood.mood,
        quote: getTodayQuote(state.zodiac),
        stage: getStage(state)
      });
    },

    // 取得龍「賦賦」（只有屬龍的人才有）
    getDragon: function(){
      var state = loadPets();
      if(!isDragon(state.birthYear)) return null;
      var def = ZODIAC_PETS['dragon'];
      var mood = state.petMoods['dragon'] || { mood:70 };
      var stage = getStage(state);
      return Object.assign({}, def, {
        mood: mood.mood,
        quote: getTodayQuote('dragon'),
        stage: stage,
        storyText: def.growthStory[Math.min(stage, def.growthStory.length-1)]
      });
    },

    // 取得貓咪清單（含解鎖狀態）
    getCats: function(){
      var state = loadPets();
      return CATS.map(function(cat){
        var unlocked = state.unlockedConditions[cat.unlockKey] || state.ownedCats.indexOf(cat.id) > -1;
        var mood = state.petMoods[cat.id] || { mood:60 };
        return Object.assign({}, cat, {
          unlocked: unlocked,
          mood: unlocked ? mood.mood : 0,
          quote: unlocked ? getTodayQuote(cat.id) : null
        });
      });
    },

    // 解鎖貓咪（管理員手動解鎖用）
    unlockCat: function(catId){
      var state = loadPets();
      if(state.ownedCats.indexOf(catId) === -1) state.ownedCats.push(catId);
      if(!state.petMoods[catId]) state.petMoods[catId] = { mood:70, lastFed:'' };
      savePets(state);
    },

    // 餵食
    feedPet: feedPet,

    // 取得光光狀態
    getLightLevel: function(){
      var state = loadPets();
      return state.lightLevel;
    },

    // 取得某隻寵物今日語錄
    getQuote: getTodayQuote,

    // 取得用戶生肖
    getZodiacId: function(){ return loadPets().zodiac; },

    // 強制重新檢查解鎖條件
    recheckUnlock: function(){
      var state = loadPets();
      checkUnlockConditions(state);
      savePets(state);
    },

    // 全部資料（除錯用）
    getState: function(){ return loadPets(); },

    // 常量
    ZODIAC_PETS: ZODIAC_PETS,
    CATS: CATS
  };

  // ── 成長階段判斷 ──
  function getStage(state){
    if(state.streakDays >= 30) return 2;    // 成年
    if((state.totalRooms||0) >= 20) return 1; // 少年
    return 0;                                  // 幼年
  }

  // 頁面載入時執行每日更新
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', dailyUpdate);
  } else {
    dailyUpdate();
  }

})();
