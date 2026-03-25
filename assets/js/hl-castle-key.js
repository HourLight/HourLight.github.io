/**
 * 馥靈之鑰 內在城堡鑰匙系統 v1.0
 * assets/js/hl-castle-key.js
 *
 * 點數：永久累積，不歸零
 * 鑰匙：每天 00:00（UTC+8）歸零，重新分配任務
 * 每天 3 扇門免費，分享 +1
 *
 * 用法：
 *   hlCastle.giveKey('mirror')        // 測驗/工具完成時呼叫
 *   hlCastle.hasKey('mirror')          // 城堡頁檢查
 *   hlCastle.addPoints(10)             // 加點（永久）
 *   hlCastle.getState()                // 取得完整狀態
 *   hlCastle.getTodayTask('mirror')    // 取得該房間今天的鑰匙任務
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'hl_castle_v2';

  // ═══ 鑰匙任務池 ═══
  // 每個任務：{ type, label, hint, url }
  // type: 'quiz','draw','engine','fuyu','mima','share','gift'
  var TASK_POOL = [
    {type:'draw', label:'抽一張牌', hint:'抽一張牌，帶一份覺察回來。', url:'draw-hl.html?castle=1'},
    {type:'draw', label:'抽一張輕盈牌', hint:'抽一張馥靈輕盈牌，聽聽直覺的聲音。', url:'draw-light.html?castle=1'},
    {type:'engine', label:'算一套命盤', hint:'去命盤引擎找到您的座標。', url:'destiny-engine.html?castle=1'},
    {type:'fuyu', label:'卜一卦', hint:'去馥靈馥語問一個問題。', url:'fuling-fuyu.html?castle=1'},
    {type:'mima', label:'算馥靈秘碼', hint:'去馥靈秘碼看看您的四主數。', url:'fuling-mima.html?castle=1'},
    {type:'share', label:'分享給朋友', hint:'送一份覺察給一個您在意的人。', url:'_share'},
    {type:'gift', label:'送一張牌', hint:'幫朋友抽一張牌，把祝福送出去。', url:'draw-hl.html?gift=1&castle=1'},
    // 測驗類（依現有頁面）
    {type:'quiz', label:'花卉人格測驗', hint:'看看您像哪朵花？', url:'quiz-flower.html?castle=1'},
    {type:'quiz', label:'依附風格測驗', hint:'您在關係裡是什麼模式？', url:'quiz-attachment.html?castle=1'},
    {type:'quiz', label:'EQ 情緒智商', hint:'測測您的情緒智慧。', url:'quiz-eq.html?castle=1'},
    {type:'quiz', label:'HSP 高敏感', hint:'您是高敏感族嗎？', url:'quiz-hsp.html?castle=1'},
    {type:'quiz', label:'MBTI 人格', hint:'您是哪種人格類型？', url:'quiz-mbti.html?castle=1'},
    {type:'quiz', label:'九型人格', hint:'找到您的九型原型。', url:'quiz-enneagram.html?castle=1'},
    {type:'quiz', label:'Big Five 五大特質', hint:'五個維度看您的性格。', url:'quiz-bigfive.html?castle=1'},
    {type:'quiz', label:'DISC 行為風格', hint:'您在團隊裡扮演什麼角色？', url:'quiz-disc.html?castle=1'},
    {type:'quiz', label:'界限感測驗', hint:'您的界限是太硬還是太軟？', url:'quiz-boundary.html?castle=1'},
    {type:'quiz', label:'冒牌者症候群', hint:'您有沒有覺得自己是假的？', url:'quiz-impostor.html?castle=1'},
    {type:'quiz', label:'內在小孩測驗', hint:'您的內在小孩幾歲了？', url:'quiz-innerchild.html?castle=1'},
    {type:'quiz', label:'壓力指數', hint:'最近的壓力有多大？', url:'quiz-stress.html?castle=1'},
    {type:'quiz', label:'恆毅力測驗', hint:'您能撐多久？', url:'quiz-grit.html?castle=1'},
    {type:'quiz', label:'自我疼惜測驗', hint:'您對自己夠溫柔嗎？', url:'quiz-selfcompassion.html?castle=1'},
    {type:'quiz', label:'身體覺察測驗', hint:'您的身體在說什麼？', url:'quiz-somatic.html?castle=1'},
    {type:'quiz', label:'情緒覺察測驗', hint:'此刻的情緒是什麼顏色？', url:'quiz-emotion.html?castle=1'},
    {type:'quiz', label:'VIA 性格優勢', hint:'您的24項優勢裡最亮的是哪一個？', url:'quiz-via.html?castle=1'},
    {type:'quiz', label:'愛的語言', hint:'您怎麼表達愛？', url:'quiz-lovelang.html?castle=1'},
    {type:'quiz', label:'人格原型測驗', hint:'您是哪一種原型角色？', url:'quiz-archetype.html?castle=1'},
    {type:'quiz', label:'精油人格', hint:'哪支精油最像您？', url:'quiz-aroma.html?castle=1'},
    {type:'quiz', label:'蓋洛普優勢', hint:'您的天賦在哪裡？', url:'quiz-strengths.html?castle=1'},
    {type:'quiz', label:'RIASEC 職業', hint:'您適合什麼工作？', url:'quiz-riasec.html?castle=1'},
    // 新測驗（預留，頁面做好後自動生效）
    {type:'quiz', label:'PDP 動物性格', hint:'您是老虎還是無尾熊？', url:'quiz-pdp.html?castle=1'},
    {type:'quiz', label:'完美主義測驗', hint:'您的完美主義有多強？', url:'quiz-perfectionism.html?castle=1'},
    {type:'quiz', label:'拖延症 6 型', hint:'您的拖延是哪一種？', url:'quiz-procrastinate.html?castle=1'},
    {type:'quiz', label:'職業倦怠量表', hint:'您燒到什麼程度了？', url:'quiz-burnout.html?castle=1'},
    {type:'quiz', label:'假性外向者', hint:'您是真外向還是在演？', url:'quiz-pseudo-extrovert.html?castle=1'},
    {type:'quiz', label:'夢境心理測驗', hint:'您的夢在告訴您什麼？', url:'quiz-dream.html?castle=1'},
    {type:'quiz', label:'自尊量表', hint:'您怎麼看待自己？', url:'quiz-selfesteem.html?castle=1'},
    {type:'quiz', label:'社交焦慮測驗', hint:'社交場合讓您緊張嗎？', url:'quiz-social-anxiety.html?castle=1'},
    {type:'quiz', label:'左右腦偏好', hint:'您是理性腦還是直覺腦？', url:'quiz-brain.html?castle=1'}
  ];

  // 12 個房間 ID
  var ROOM_IDS = ['mirror','treasure','key','throne','love','intuition','ground','harmony','transform','dream','garden','tower'];

  // 房間的詩意提示（門上的文字）
  var ROOM_HINTS = {
    mirror:   '這面鏡子只為認識自己的人敞開。',
    treasure: '寶庫的門認得出懂得自己價值的人。',
    key:      '密室的鑰匙藏在您還沒探索過的地方。',
    throne:   '王座只為敢坐上去的人準備。',
    love:     '愛之殿需要您先愛自己一次。',
    intuition:'直覺閣等待一個願意閉眼的人。',
    ground:   '磐石的力量來自知道自己站在哪裡。',
    harmony:  '和諧苑歡迎願意看見關係的人。',
    transform:'蛻變室只讓脫下面具的人進入。',
    dream:    '夢境走廊的門在意識放鬆時才會現形。',
    garden:   '花園裡的花是您親手種的。',
    tower:    '瞭望塔在最高處等您。'
  };

  // ═══ 今天的日期 key（UTC+8）═══
  function todayKey(){
    var now = new Date();
    var tw = new Date(now.getTime() + 8 * 3600000);
    return tw.getUTCFullYear() + '-' + String(tw.getUTCMonth()+1).padStart(2,'0') + '-' + String(tw.getUTCDate()).padStart(2,'0');
  }

  // ═══ 確定性隨機（用日期當種子，同一天同一結果）═══
  function seededShuffle(arr, seed){
    var s = 0;
    for(var i=0;i<seed.length;i++) s = ((s << 5) - s) + seed.charCodeAt(i);
    var a = arr.slice();
    for(var i=a.length-1;i>0;i--){
      s = (s * 16807 + 0) % 2147483647;
      var j = Math.abs(s) % (i+1);
      var t=a[i];a[i]=a[j];a[j]=t;
    }
    return a;
  }

  // ═══ 載入狀態 ═══
  function loadState(){
    var def = {points:0, streak:1, totalRooms:0, daily:{}, lastDate:''};
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return def;
      var d = JSON.parse(raw);
      var today = todayKey();

      // 點數永久
      def.points = d.points || 0;
      def.totalRooms = d.totalRooms || 0;

      // 連續天數
      var yesterday = (function(){
        var y = new Date(new Date().getTime() + 8*3600000 - 86400000);
        return y.getUTCFullYear()+'-'+String(y.getUTCMonth()+1).padStart(2,'0')+'-'+String(y.getUTCDate()).padStart(2,'0');
      })();

      if(d.lastDate === today){
        def.streak = d.streak || 1;
        def.daily = d.daily || {};
      } else if(d.lastDate === yesterday){
        def.streak = (d.streak || 0) + 1;
        def.daily = {}; // 新的一天，鑰匙歸零
      } else {
        def.streak = 1;
        def.daily = {};
      }
      def.lastDate = d.lastDate;
      return def;
    }catch(e){return def;}
  }

  function saveState(st){
    st.lastDate = todayKey();
    try{localStorage.setItem(STORAGE_KEY, JSON.stringify(st));}catch(e){}
  }

  // ═══ 每日任務分配（確定性：同一天同一組合）═══
  function getTodayTasks(){
    var today = todayKey();
    var shuffled = seededShuffle(TASK_POOL, today + '_castle');
    var tasks = {};
    ROOM_IDS.forEach(function(rid, i){
      tasks[rid] = shuffled[i % shuffled.length];
    });
    return tasks;
  }

  // ═══ 公開 API ═══
  var state = loadState();
  var todayTasks = getTodayTasks();

  window.hlCastle = {
    // 取得完整狀態
    getState: function(){
      return {
        points: state.points,           // 永久點數
        streak: state.streak,           // 連續天數
        totalRooms: state.totalRooms,   // 歷史總開門次數
        daily: state.daily,             // 今天的鑰匙和開門紀錄
        todayOpened: Object.keys(state.daily).filter(function(k){return state.daily[k]==='done'}).length,
        maxDaily: 3 + (state.daily._bonusDoors || 0)  // 3 + 分享獎勵
      };
    },

    // 這個房間今天有鑰匙了嗎？
    hasKey: function(roomId){
      return state.daily[roomId] === 'key' || state.daily[roomId] === 'done';
    },

    // 這個房間今天已完成謎語了嗎？
    isDone: function(roomId){
      return state.daily[roomId] === 'done';
    },

    // 今天還能開幾扇門？
    canOpen: function(){
      var opened = Object.keys(state.daily).filter(function(k){return state.daily[k]==='done'}).length;
      var max = 3 + (state.daily._bonusDoors || 0);
      return opened < max;
    },

    // 給鑰匙（測驗/工具完成時呼叫）
    giveKey: function(roomId){
      if(!roomId) return false;
      // 檢查是否是今天分配到這個房間的任務類型
      // 或者任何完成都算（寬鬆模式，先上線再調）
      if(state.daily[roomId] !== 'done'){
        state.daily[roomId] = 'key';
        saveState(state);
      }
      return true;
    },

    // 從 URL 參數自動發鑰匙（測驗頁呼叫）
    autoGiveFromUrl: function(){
      var params = new URLSearchParams(window.location.search);
      if(params.get('castle') !== '1') return;
      // 找出今天哪個房間的任務指向這個頁面
      var currentPage = window.location.pathname.split('/').pop().split('?')[0];
      ROOM_IDS.forEach(function(rid){
        var task = todayTasks[rid];
        if(task && task.url && task.url.indexOf(currentPage) > -1){
          if(state.daily[rid] !== 'done'){
            state.daily[rid] = 'key';
            saveState(state);
          }
        }
      });
    },

    // 完成房間謎語（城堡頁呼叫）
    completeRoom: function(roomId){
      if(!this.hasKey(roomId)) return false;
      if(!this.canOpen()) return false;
      state.daily[roomId] = 'done';
      state.points += 2 + (state.streak > 1 ? 2 : 0);
      state.totalRooms = (state.totalRooms || 0) + 1;
      saveState(state);
      return true;
    },

    // 加點（永久）
    addPoints: function(n){
      state.points += (n || 0);
      saveState(state);
    },

    // 分享獎勵：+3 點 + 今天多開 1 扇門
    shareBonus: function(){
      state.points += 2;
      state.daily._bonusDoors = (state.daily._bonusDoors || 0) + 1;
      saveState(state);
    },

    // 取得某房間今天的任務
    getTodayTask: function(roomId){
      return todayTasks[roomId] || null;
    },

    // 取得房間的詩意提示
    getRoomHint: function(roomId){
      return ROOM_HINTS[roomId] || '';
    },

    // 重新載入（切換日期後）
    reload: function(){
      state = loadState();
      todayTasks = getTodayTasks();
    }
  };

  // 頁面載入時自動偵測 castle 參數
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      window.hlCastle.autoGiveFromUrl();
    });
  } else {
    window.hlCastle.autoGiveFromUrl();
  }

})();
