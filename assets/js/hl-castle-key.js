/**
 * 馥靈之鑰 內在城堡鑰匙系統 v2.0
 * assets/js/hl-castle-key.js
 *
 * v2.0 新增：
 *   - 點數兌換機制（50pt→AI解讀/100pt→深潛測驗/200pt→合盤試用）
 *   - 成就系統（7種勳章）
 *   - 城堡卡資料（截圖分享用）
 *   - 入口敘事支援（新用戶漸進解鎖）
 *   - 城堡日記（每次謎語自動記錄）
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'hl_castle_v3';
  var DIARY_KEY   = 'hl_castle_diary';

  var ACHIEVEMENTS = [
    {id:'first_key',    icon:'🗝️', name:'初入城堡',   desc:'第一次推開城堡的門',       cond:function(s){return s.totalRooms>=1;}},
    {id:'week_streak',  icon:'🔥', name:'鑰匙守護者', desc:'連續 7 天回來',             cond:function(s){return s.streak>=7;}},
    {id:'all_rooms',    icon:'👑', name:'城堡之主',   desc:'12 個房間全部解鎖一次',     cond:function(s){return s.totalRooms>=12;}},
    {id:'share_x10',    icon:'🌟', name:'傳播者',     desc:'分享城堡 10 次',            cond:function(s){return(s.shareCount||0)>=10;}},
    {id:'month_streak', icon:'💎', name:'探索大師',   desc:'連續 30 天探索城堡',        cond:function(s){return s.streak>=30;}},
    {id:'pts_100',      icon:'✨', name:'光的收藏者', desc:'累積 100 點靈感',           cond:function(s){return s.points>=100;}},
    {id:'redeem_first', icon:'🎁', name:'兌換者',     desc:'第一次用靈感點數兌換',      cond:function(s){return(s.redeemCount||0)>=1;}}
  ];

  var REDEEM_ITEMS = [
    {id:'ai_read',   cost:50,  icon:'🤖', name:'AI 解讀指令 1 次',  desc:'在任何命理工具使用一次深度解讀', action:'add_ai_quota'},
    {id:'deep_quiz', cost:100, icon:'🔮', name:'深潛測驗解鎖',      desc:'解鎖任一深潛覺察測驗完整版',    action:'unlock_deep_quiz'},
    {id:'match_try', cost:200, icon:'💞', name:'合盤試用 1 次',     desc:'解鎖合盤引擎試用一次',           action:'unlock_match'}
  ];

  var TASK_POOL = [
    {type:'draw',   label:'抽一張牌',       hint:'抽一張牌，帶一份覺察回來。',          url:'draw-hl.html?castle=1'},
    {type:'draw',   label:'抽一張輕盈牌',   hint:'抽一張馥靈輕盈牌，聽聽直覺的聲音。', url:'draw-light.html?castle=1'},
    {type:'engine', label:'算一套命盤',     hint:'去命盤引擎找到您的座標。',            url:'destiny-engine.html?castle=1'},
    {type:'fuyu',   label:'卜一卦',         hint:'去馥靈馥語問一個問題。',              url:'fuling-fuyu.html?castle=1'},
    {type:'mima',   label:'算馥靈秘碼',     hint:'去馥靈秘碼看看您的四主數。',         url:'fuling-mima.html?castle=1'},
    {type:'share',  label:'分享給朋友',     hint:'送一份覺察給一個您在意的人。',       url:'_share'},
    {type:'quiz',   label:'依附風格測驗',   hint:'您在關係裡是什麼模式？',             url:'quiz-attachment.html?castle=1'},
    {type:'quiz',   label:'EQ 情緒智商',   hint:'測測您的情緒智慧。',                 url:'quiz-eq.html?castle=1'},
    {type:'quiz',   label:'HSP 高敏感',    hint:'您是高敏感族嗎？',                   url:'quiz-hsp.html?castle=1'},
    {type:'quiz',   label:'MBTI 人格',     hint:'您是哪種人格類型？',                 url:'quiz-mbti.html?castle=1'},
    {type:'quiz',   label:'九型人格',       hint:'找到您的九型原型。',                 url:'quiz-enneagram.html?castle=1'},
    {type:'quiz',   label:'Big Five 五大', hint:'五個維度看您的性格。',               url:'quiz-bigfive.html?castle=1'},
    {type:'quiz',   label:'DISC 行為風格', hint:'您在團隊裡扮演什麼角色？',           url:'quiz-disc.html?castle=1'},
    {type:'quiz',   label:'界限感測驗',     hint:'您的界限是太硬還是太軟？',           url:'quiz-boundary.html?castle=1'},
    {type:'quiz',   label:'冒牌者症候群',   hint:'您有沒有覺得自己是假的？',           url:'quiz-impostor.html?castle=1'},
    {type:'quiz',   label:'內在小孩測驗',   hint:'您的內在小孩幾歲了？',               url:'quiz-innerchild.html?castle=1'},
    {type:'quiz',   label:'壓力指數',       hint:'最近的壓力有多大？',                 url:'quiz-stress.html?castle=1'},
    {type:'quiz',   label:'恆毅力測驗',     hint:'您能撐多久？',                       url:'quiz-grit.html?castle=1'},
    {type:'quiz',   label:'自我疼惜測驗',   hint:'您對自己夠溫柔嗎？',                 url:'quiz-selfcompassion.html?castle=1'},
    {type:'quiz',   label:'身體覺察測驗',   hint:'您的身體在說什麼？',                 url:'quiz-somatic.html?castle=1'},
    {type:'quiz',   label:'自我導航測驗',   hint:'此刻的情緒是什麼顏色？',             url:'quiz-emotion.html?castle=1'},
    {type:'quiz',   label:'VIA 性格優勢',  hint:'您的24項優勢裡最亮的是哪一個？',     url:'quiz-via.html?castle=1'},
    {type:'quiz',   label:'愛的語言',       hint:'您怎麼表達愛？',                     url:'quiz-lovelang.html?castle=1'},
    {type:'quiz',   label:'人格原型測驗',   hint:'您是哪一種原型角色？',               url:'quiz-archetype.html?castle=1'},
    {type:'quiz',   label:'精油人格',       hint:'哪支精油最像您？',                   url:'quiz-aroma.html?castle=1'},
    {type:'quiz',   label:'天賦優勢',       hint:'您的天賦在哪裡？',                   url:'quiz-strengths.html?castle=1'},
    {type:'quiz',   label:'RIASEC 職業',   hint:'您適合什麼工作？',                   url:'quiz-riasec.html?castle=1'},
    {type:'quiz',   label:'完美主義測驗',   hint:'您的完美主義有多強？',               url:'quiz-perfectionism.html?castle=1'},
    {type:'quiz',   label:'拖延症 6 型',   hint:'您的拖延是哪一種？',                 url:'quiz-procrastinate.html?castle=1'},
    {type:'quiz',   label:'職業倦怠量表',   hint:'您燒到什麼程度了？',                 url:'quiz-burnout.html?castle=1'},
    {type:'quiz',   label:'假性外向者',     hint:'您是真外向還是在演？',               url:'quiz-pseudo-extrovert.html?castle=1'},
    {type:'quiz',   label:'夢境心理測驗',   hint:'您的夢在告訴您什麼？',               url:'quiz-dream.html?castle=1'},
    {type:'quiz',   label:'自尊量表',       hint:'您怎麼看待自己？',                   url:'quiz-selfesteem.html?castle=1'},
    {type:'quiz',   label:'花卉人格測驗',   hint:'看看您像哪朵花？',                   url:'quiz-flower.html?castle=1'},
    {type:'quiz',   label:'左右腦偏好',     hint:'您是理性腦還是直覺腦？',             url:'quiz-brain.html?castle=1'}
  ];

  var ROOM_IDS = ['mirror','treasure','key','throne','love','intuition','ground','harmony','transform','dream','garden','tower'];

  // 新用戶漸進解鎖順序：每完成一個房間就多開一扇
  var UNLOCK_STAGES = [
    ['mirror'],
    ['mirror','treasure'],
    ['mirror','treasure','key'],
    ['mirror','treasure','key','throne'],
    ['mirror','treasure','key','throne','love'],
    ['mirror','treasure','key','throne','love','intuition'],
    ['mirror','treasure','key','throne','love','intuition','ground'],
    ['mirror','treasure','key','throne','love','intuition','ground','harmony'],
    ['mirror','treasure','key','throne','love','intuition','ground','harmony','transform'],
    ['mirror','treasure','key','throne','love','intuition','ground','harmony','transform','dream'],
    ['mirror','treasure','key','throne','love','intuition','ground','harmony','transform','dream','garden'],
    ROOM_IDS
  ];

  var ROOM_HINTS = {
    mirror:'這面鏡子只為認識自己的人敞開。',
    treasure:'寶庫的門認得出懂得自己價值的人。',
    key:'密室的鑰匙藏在您還沒探索過的地方。',
    throne:'王座只為敢坐上去的人準備。',
    love:'愛之殿需要您先愛自己一次。',
    intuition:'直覺閣等待一個願意閉眼的人。',
    ground:'磐石的力量來自知道自己站在哪裡。',
    harmony:'和諧苑歡迎願意看見關係的人。',
    transform:'蛻變室只讓脫下面具的人進入。',
    dream:'夢境走廊的門在意識放鬆時才會現形。',
    garden:'花園裡的花是您親手種的。',
    tower:'瞭望塔在最高處等您。'
  };

  // 12 位僕人系統
  var SERVANTS = {
    mirror: {name:'鏡靈', emoji:'🪞', personality:'安靜、誠實、有時毒舌', greeting:['今天，你敢看自己嗎？','鏡子不會說謊。你準備好了嗎？','有些真相，看見了就回不去了。']},
    treasure: {name:'寶庫者', emoji:'💎', personality:'慷慨、溫暖、偶爾神秘', greeting:['你知道自己有多珍貴嗎？','寶藏不在遠方，在你忽略的地方。','今天，打開一個你一直沒勇氣看的抽屜。']},
    key: {name:'鑰匙守', emoji:'🔑', personality:'沉穩、耐心、話不多', greeting:['每一把鑰匙都對應一個勇氣。','今天你想打開哪一扇門？','不急。鑰匙會在你準備好的時候出現。']},
    throne: {name:'王座侍', emoji:'👑', personality:'莊重、鼓勵、有力量', greeting:['王座等的不是完美的人，是願意負責的人。','今天，為自己做一個決定。','你的人生，你說了算。']},
    garden: {name:'花園精靈', emoji:'🌿', personality:'溫柔、療癒、愛說故事', greeting:['今天澆了水嗎？我說的是你自己。','花開不是為了誰，是因為時候到了。','慢慢來，花園不趕時間。']},
    library: {name:'書靈', emoji:'📚', personality:'博學、幽默、愛引經據典', greeting:['答案都在書裡，但你得先問對問題。','今天讀了什麼？哪怕一句話也好。','知識是最輕的行李，也是最重的武器。']},
    alchemy: {name:'煉金使', emoji:'⚗️', personality:'神秘、直覺、一針見血', greeting:['痛苦不是敵人，是原料。','今天，你想把什麼煉成什麼？','最好的煉金術，是把經歷變成智慧。']},
    music: {name:'音律仙', emoji:'🎵', personality:'浪漫、感性、容易感動', greeting:['你有多久沒聽見自己的聲音了？','今天，讓自己發出一個不完美的音符。','音樂不需要完美，需要真實。']},
    dream: {name:'夢行者', emoji:'🌙', personality:'朦朧、詩意、若即若離', greeting:['昨晚的夢，你還記得嗎？','潛意識在跟你說話，安靜一點就聽見了。','夢是另一個你寫的信。']},
    tower: {name:'星占師', emoji:'⭐', personality:'冷靜、宏觀、話帶哲理', greeting:['站高一點看，困境就小了。','今天的星象說：適合放慢腳步。','看清方向比走得快重要。']},
    kitchen: {name:'灶神', emoji:'🍳', personality:'務實、溫暖、愛碎念', greeting:['吃飽了嗎？吃好了嗎？','身體是靈魂的房子，要好好餵它。','今天為自己煮一頓飯，不為別人。']},
    secret: {name:'暗道守', emoji:'🚪', personality:'低調、深沉、守口如瓶', greeting:['有些路只有你自己能走。','暗處不一定危險，有時候是安全。','今天，面對一個你一直逃避的事。']}
  };

  function getServantGreeting(roomId){
    var s = SERVANTS[roomId];
    if(!s) return null;
    var dk = todayKey();
    var hash = 0;
    for(var i=0;i<dk.length;i++) hash=((hash<<5)-hash)+dk.charCodeAt(i);
    var idx = Math.abs(hash) % s.greeting.length;
    return {name:s.name, emoji:s.emoji, personality:s.personality, greeting:s.greeting[idx]};
  }

  var ROOM_NAMES = {
    mirror:'鏡之廳',treasure:'價值寶庫',key:'解鎖密室',throne:'啟程塔',
    love:'愛之殿',intuition:'直覺閣',ground:'磐石廳',harmony:'和諧苑',
    transform:'蛻變室',dream:'夢境走廊',garden:'記憶花園',tower:'瞭望塔'
  };

  var ROOM_ICONS = {
    mirror:'🪞',treasure:'💎',key:'🔑',throne:'👑',love:'💕',
    intuition:'🔮',ground:'🏔️',harmony:'🌿',transform:'🦋',
    dream:'🌙',garden:'🌸',tower:'🔭'
  };

  var UNLOCK_MSGS = {
    treasure:'🎉 鏡之廳探索完成！<br>價值寶庫的門悄悄打開了。',
    key:'🎉 連探兩房！解鎖密室正在等您。',
    throne:'🎉 H.O.U.R. 四塔全開！<br>L.I.G.H.T. 五房間接著解鎖。',
    love:'✨ 愛之殿已開啟。',
    intuition:'✨ 直覺閣已開啟。',
    ground:'✨ 磐石廳已開啟。',
    harmony:'✨ 和諧苑已開啟。',
    transform:'🌟 L.I.G.H.T. 五房全開！<br>最後三個秘境正在現身…',
    dream:'🌙 夢境走廊已開啟。',
    garden:'🌸 記憶花園已開啟。',
    tower:'🔭 城堡最高處，瞭望塔，等您了。'
  };

  function todayKey(){
    var tw=new Date(new Date().getTime()+8*3600000);
    return tw.getUTCFullYear()+'-'+String(tw.getUTCMonth()+1).padStart(2,'0')+'-'+String(tw.getUTCDate()).padStart(2,'0');
  }

  function seededShuffle(arr,seed){
    var s=0;for(var i=0;i<seed.length;i++)s=((s<<5)-s)+seed.charCodeAt(i);
    var a=arr.slice();
    for(var i=a.length-1;i>0;i--){s=(s*16807+0)%2147483647;var j=Math.abs(s)%(i+1);var t=a[i];a[i]=a[j];a[j]=t;}
    return a;
  }

  function loadState(){
    var def={points:0,streak:1,totalRooms:0,daily:{},lastDate:'',
             unlockedRooms:['mirror'],achievements:[],shareCount:0,
             redeemCount:0,redeemHistory:[],milestones:{},castleBonus:{}};
    try{
      var raw=localStorage.getItem(STORAGE_KEY);
      if(!raw)return def;
      var d=JSON.parse(raw);
      var today=todayKey();
      var yest=(function(){var y=new Date(new Date().getTime()+8*3600000-86400000);
        return y.getUTCFullYear()+'-'+String(y.getUTCMonth()+1).padStart(2,'0')+'-'+String(y.getUTCDate()).padStart(2,'0');})();
      def.points=d.points||0;def.totalRooms=d.totalRooms||0;
      def.shareCount=d.shareCount||0;def.redeemCount=d.redeemCount||0;
      def.redeemHistory=d.redeemHistory||[];def.milestones=d.milestones||{};
      def.achievements=d.achievements||[];def.castleBonus=d.castleBonus||{};
      def.unlockedRooms=(d.unlockedRooms&&d.unlockedRooms.length)?d.unlockedRooms:ROOM_IDS.slice();
      if(d.lastDate===today){def.streak=d.streak||1;def.daily=d.daily||{};}
      else if(d.lastDate===yest){def.streak=(d.streak||0)+1;def.daily={};}
      else{def.streak=1;def.daily={};}
      def.lastDate=d.lastDate;return def;
    }catch(e){return def;}
  }

  function saveState(st){st.lastDate=todayKey();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(st));}catch(e){}}

  function loadDiary(){try{var r=localStorage.getItem(DIARY_KEY);return r?JSON.parse(r):[];}catch(e){return[];}}

  function appendDiary(roomId,question,answer,insight){
    var d=loadDiary();
    d.unshift({date:todayKey(),roomId:roomId,
      roomName:ROOM_NAMES[roomId]||roomId,roomIcon:ROOM_ICONS[roomId]||'🏰',
      question:question||'',answer:answer||'',
      insight:(insight||'').replace(/<[^>]*>/g,'').substring(0,80)});
    if(d.length>90)d=d.slice(0,90);
    try{localStorage.setItem(DIARY_KEY,JSON.stringify(d));}catch(e){}
  }

  function checkAch(st){
    var newOnes=[];
    ACHIEVEMENTS.forEach(function(a){
      if(st.achievements.indexOf(a.id)===-1&&a.cond(st)){st.achievements.push(a.id);newOnes.push(a);}
    });
    return newOnes;
  }

  var state=loadState();
  var todayTasks=getTodayTasks();

  function getTodayTasks(){
    var s=seededShuffle(TASK_POOL,todayKey()+'_castle');
    var t={};ROOM_IDS.forEach(function(r,i){t[r]=s[i%s.length];});return t;
  }

  window.hlCastle={
    getState:function(){
      return{points:state.points,streak:state.streak,totalRooms:state.totalRooms,
             daily:state.daily,shareCount:state.shareCount,redeemCount:state.redeemCount,
             achievements:state.achievements,unlockedRooms:state.unlockedRooms,
             todayOpened:Object.keys(state.daily).filter(function(k){return state.daily[k]==='done';}).length,
             maxDaily:3+(state.daily._bonusDoors||0)};
    },
    hasKey:function(r){return state.daily[r]==='key'||state.daily[r]==='done';},
    isDone:function(r){return state.daily[r]==='done';},
    isUnlocked:function(r){return state.unlockedRooms.indexOf(r)>-1;},
    canOpen:function(){
      var o=Object.keys(state.daily).filter(function(k){return state.daily[k]==='done';}).length;
      return o<(3+(state.daily._bonusDoors||0));
    },
    giveKey:function(r){
      if(!r)return false;
      if(state.daily[r]!=='done'){state.daily[r]='key';saveState(state);}
      return true;
    },
    autoGiveFromUrl:function(){
      var p=new URLSearchParams(window.location.search);
      if(p.get('castle')!=='1')return;
      var pg=window.location.pathname.split('/').pop().split('?')[0];
      ROOM_IDS.forEach(function(r){
        var t=todayTasks[r];
        if(t&&t.url&&t.url.indexOf(pg)>-1&&state.daily[r]!=='done'){state.daily[r]='key';saveState(state);}
      });
    },
    completeRoom:function(roomId,question,answer,insight){
      if(!this.hasKey(roomId))return{ok:false,reason:'no_key'};
      if(!this.canOpen())return{ok:false,reason:'daily_full'};
      state.daily[roomId]='done';
      var pts=2;
      if(state.streak>1)pts+=2;
      var first=!state.milestones[roomId];
      if(first){pts+=5;state.milestones[roomId]=true;}
      state.points+=pts;
      state.totalRooms=(state.totalRooms||0)+1;
      if(question&&answer)appendDiary(roomId,question,answer,insight||'');
      // 敘事解鎖
      var stage=UNLOCK_STAGES[Math.min(state.totalRooms,UNLOCK_STAGES.length-1)];
      var newUnlocked=[];
      stage.forEach(function(r){if(state.unlockedRooms.indexOf(r)===-1){state.unlockedRooms.push(r);newUnlocked.push(r);}});
      var newAch=checkAch(state);
      saveState(state);
      return{ok:true,ptsEarned:pts,isFirstEver:first,newlyUnlocked:newUnlocked,
             newAchievements:newAch,
             unlockMsg:newUnlocked.length?UNLOCK_MSGS[newUnlocked[newUnlocked.length-1]]:null};
    },
    addPoints:function(n){state.points+=(n||0);saveState(state);},
    shareBonus:function(){
      state.points+=2;state.shareCount=(state.shareCount||0)+1;
      state.daily._bonusDoors=(state.daily._bonusDoors||0)+1;
      var na=checkAch(state);saveState(state);return{newAchievements:na};
    },
    redeem:function(itemId){
      var item=REDEEM_ITEMS.filter(function(i){return i.id===itemId;})[0];
      if(!item)return{ok:false,reason:'not_found'};
      if(state.points<item.cost)return{ok:false,reason:'not_enough',need:item.cost-state.points};
      state.points-=item.cost;
      state.redeemCount=(state.redeemCount||0)+1;
      state.redeemHistory=(state.redeemHistory||[]);
      state.redeemHistory.unshift({item:itemId,cost:item.cost,date:todayKey()});
      state.castleBonus=state.castleBonus||{};
      if(item.action==='add_ai_quota')state.castleBonus.aiQuota=(state.castleBonus.aiQuota||0)+1;
      else if(item.action==='unlock_deep_quiz')state.castleBonus.deepQuizUnlock=(state.castleBonus.deepQuizUnlock||0)+1;
      else if(item.action==='unlock_match')state.castleBonus.matchTry=(state.castleBonus.matchTry||0)+1;
      var na=checkAch(state);saveState(state);
      return{ok:true,item:item,newAchievements:na};
    },
    getRedeemItems:function(){
      return REDEEM_ITEMS.map(function(i){return Object.assign({},i,{canAfford:state.points>=i.cost});});
    },
    getAllAchievements:function(){
      return ACHIEVEMENTS.map(function(a){return Object.assign({},a,{unlocked:state.achievements.indexOf(a.id)>-1});});
    },
    getCastleCard:function(roomId,insightText){
      return{roomIcon:ROOM_ICONS[roomId]||'🏰',roomName:ROOM_NAMES[roomId]||'城堡',
             insight:insightText||'',streak:state.streak,points:state.points,
             date:todayKey(),totalDays:state.totalRooms};
    },
    getDiary:function(limit){var d=loadDiary();return limit?d.slice(0,limit):d;},
    getTodayTask:function(r){return todayTasks[r]||null;},
    getRoomHint:function(r){return ROOM_HINTS[r]||'';},
    getVisibleRooms:function(){return state.unlockedRooms.slice();},
    getCastleBonus:function(){return state.castleBonus||{};},
    getServant:function(roomId){return getServantGreeting(roomId);},
    getServants:function(){return SERVANTS;},
    reload:function(){state=loadState();todayTasks=getTodayTasks();}
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){window.hlCastle.autoGiveFromUrl();});
  }else{window.hlCastle.autoGiveFromUrl();}

  /* ── 城堡任務回程 Banner ──────────────────────────────
   * 偵測 ?castle=1 → 結果區出現時自動注入「帶著鑰匙回城堡」按鈕
   * 支援三種結果區結構：
   *   1. .quiz-result.active   (39 頁)
   *   2. #quizResult.active    (9 頁)
   *   3. #ra                   (1 頁)
   * ─────────────────────────────────────────────────── */
  (function(){
    var p=new URLSearchParams(window.location.search);
    if(p.get('castle')!=='1') return;

    var injected=false;

    function injectBanner(){
      if(injected) return;
      // 找已顯示的結果區（涵蓋測驗/抽牌/占卜/馥靈頁面）
      var el=document.querySelector([
        '.quiz-result.active',
        '#quizResult.active',
        '#ra:not(:empty)',
        '#aromaResult:not([style*="display: none"]):not([style*="display:none"])',
        '#readingBox:not([style*="display: none"]):not([style*="display:none"]):not(:empty)',
        '#spreadResult:not([style*="display: none"]):not([style*="display:none"])',
        '#aiResultBlock:not([style*="display: none"]):not([style*="display:none"])',
        '#fuyu-today:not([style*="display: none"]):not([style*="display:none"])',
        '#fuyu-oil:not([style*="display: none"]):not([style*="display:none"])'
      ].join(','));
      if(!el || !el.offsetParent) return; // 還沒顯示
      if(el.querySelector('.hl-castle-return')) return; // 已注入

      injected=true;

      var banner=document.createElement('div');
      banner.className='hl-castle-return';
      banner.style.cssText=[
        'margin:0 0 20px 0',
        'padding:18px 20px',
        'background:linear-gradient(135deg,rgba(92,58,99,0.85),rgba(29,17,51,0.95))',
        'border:1px solid rgba(233,194,125,0.45)',
        'border-radius:18px',
        'text-align:center',
        'animation:hlCastlePopIn .5s cubic-bezier(.16,1,.3,1) both'
      ].join(';');

      banner.innerHTML=
        '<div style="font-size:1.5rem;margin-bottom:6px">🗝️</div>'+
        '<div style="font-size:.92rem;color:#f8dfa5;font-weight:600;margin-bottom:4px;letter-spacing:.5px">鑰匙已拿到！</div>'+
        '<div style="font-size:.8rem;color:rgba(249,240,229,.7);margin-bottom:14px">帶著這份覺察，回城堡開啟今天的房間</div>'+
        '<a href="castle-game.html" style="'+[
          'display:inline-block',
          'padding:11px 28px',
          'background:linear-gradient(135deg,#b8922a,#e9c27d)',
          'color:#1a0f2e',
          'border-radius:999px',
          'font-size:.92rem',
          'font-weight:700',
          'text-decoration:none',
          'letter-spacing:.5px',
          'transition:all .25s'
        ].join(';')+'">🏰 回到城堡</a>';

      // 插到結果區最前面
      el.insertBefore(banner, el.firstChild);

      // 注入動畫 keyframe（只注一次）
      if(!document.getElementById('hl-castle-anim')){
        var st=document.createElement('style');
        st.id='hl-castle-anim';
        st.textContent='@keyframes hlCastlePopIn{from{opacity:0;transform:translateY(-12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}';
        document.head.appendChild(st);
      }

      // 自動滾到 banner
      setTimeout(function(){
        banner.scrollIntoView({behavior:'smooth',block:'nearest'});
      },300);
    }

    // MutationObserver 監聽結果區 class 變化
    var observer=new MutationObserver(function(){injectBanner();});
    function startObserve(){
      var targets=[
        document.querySelector('.quiz-result'),
        document.getElementById('quizResult'),
        document.getElementById('ra'),
        document.getElementById('aromaResult'),
        document.getElementById('readingBox'),
        document.getElementById('spreadResult'),
        document.getElementById('aiResultBlock'),
        document.getElementById('fuyu-today'),
        document.getElementById('fuyu-oil')
      ].filter(Boolean);
      targets.forEach(function(t){
        observer.observe(t,{attributes:true,childList:true,subtree:false,attributeFilter:['class','style']});
      });
      // 也輪詢一次（防止已顯示但 observer 來不及）
      injectBanner();
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',function(){
        setTimeout(startObserve,200);
      });
    }else{
      setTimeout(startObserve,200);
    }
    // 定時補漏（有些頁面 JS 很晚才渲染結果）
    var poll=setInterval(function(){
      injectBanner();
      if(injected) clearInterval(poll);
    },800);
    setTimeout(function(){clearInterval(poll);},60000);
  })();
})();
