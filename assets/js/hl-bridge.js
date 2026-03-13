/* ═══════════════════════════════════════
   hl-bridge.js — 馥靈轉化橋接模組
   
   所有工具的結果頁都引用這個模組。
   它不是廣告——它是「你看見座標之後的下一步」。
   
   像精油擴香：不是噴在臉上，是整個空間都是。
   ═══════════════════════════════════════ */
(function(){
'use strict';

// ── 轉化橋文案庫 ──
// 根據工具類型和結果狀態，選擇最自然的橋接語
var BRIDGES = {

  // 看見座標之後
  mirror: [
    '你剛才看見的，是你此刻的座標——你站在哪裡、面朝哪個方向。但地圖不會幫你走路。',
    '座標清楚了。接下來的問題是：你打算往哪裡走？',
    '知道自己站在哪裡，是最難的第一步。你已經完成了。'
  ],

  // 引向牌卡（輕觸）
  card_light: [
    '如果你想聽聽這個座標上，風往哪邊吹——試試抽一張牌。',
    '數字告訴你「你是什麼」，牌卡告訴你「現在可以怎麼做」。',
    '130 張牌卡不是算命——是你站在這個座標上時，大自然給你的一封短信。'
  ],

  // 引向一對一（深度）
  session_deep: [
    '有些座標，自己看得見，但走不出去——不是你不夠強，是你需要一個人幫你換個角度看。',
    '工具能照出你的輪廓，但輪廓裡的紋理，需要有人陪你慢慢看。',
    '如果你看完之後覺得「對，但然後呢？」——那個「然後」，就是一對一調頻在做的事。'
  ],

  // 引向課程（專業）
  course_pro: [
    '你剛才做的這件事，其實是一門專業技能。學會了，你就能幫身邊的人做同樣的事。',
    '從「被看見」到「能幫人看見」——這中間的距離，只有一套系統。'
  ],

  // 收尾賦能
  empower: [
    '鑰匙是我遞給你的，但城堡是你的，門是你自己開的。',
    '不管你接下來選什麼——繼續探索、找人聊聊、或就此打住——你已經比五分鐘前的自己更清楚了。',
    '這個座標不會消失。隨時回來看，它會告訴你：你走了多遠。'
  ]
};

// ── 隨機選一句 ──
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ── 生成轉化橋 HTML ──
// type: 'calc'(命理計算) | 'quiz'(心理測驗) | 'draw'(抽牌) | 'guide'(觀想引導)
// intensity: 'light'(輕觸) | 'medium'(中度) | 'deep'(深度)
window.HLBridge = function(type, intensity){
  type = type || 'calc';
  intensity = intensity || 'medium';

  var mirror = pick(BRIDGES.mirror);
  var cardLine = pick(BRIDGES.card_light);
  var sessionLine = pick(BRIDGES.session_deep);
  var empower = pick(BRIDGES.empower);

  // 根據工具類型調整
  var mainCTA, secondCTA;
  if (type === 'draw') {
    // 抽牌工具：已經用了牌卡，引向一對一
    mainCTA = { text:'想要更深的解讀？', btn:'預約一對一調頻', url:'services.html' };
    secondCTA = { text:'或者，先從書開始', btn:'看看這本書', url:'book.html' };
  } else if (type === 'quiz') {
    // 心理測驗：引向牌卡體驗
    mainCTA = { text:'測驗看見的是輪廓，牌卡看見的是紋理', btn:'抽一張，聽聽自己的聲音', url:'draw-hl.html' };
    secondCTA = { text:'想要有人陪你解讀', btn:'LINE 聊聊', url:'https://lin.ee/p5tBihbe' };
  } else if (type === 'guide') {
    // 觀想引導：引向一對一（最深層需求）
    mainCTA = { text:'觀想是鑰匙，但有些門需要有人陪你推開', btn:'了解一對一調頻', url:'services.html' };
    secondCTA = { text:'或者，用牌卡繼續跟自己對話', btn:'馥靈牌卡', url:'draw-hl.html' };
  } else {
    // 命理計算（預設）：引向牌卡
    mainCTA = { text:cardLine, btn:'抽一張牌，聽聽自己的聲音', url:'draw-hl.html' };
    secondCTA = { text:sessionLine, btn:'了解一對一調頻', url:'services.html' };
  }

  // 輕觸模式：只顯示一個按鈕
  if (intensity === 'light') {
    return '<div class="hl-bridge hl-bridge-light">'
      +'<div class="hlb-text">'+mirror+'</div>'
      +'<a href="'+mainCTA.url+'" class="hlb-btn">'+mainCTA.btn+' →</a>'
      +'</div>';
  }

  // 深度模式：完整橋接
  if (intensity === 'deep') {
    return '<div class="hl-bridge hl-bridge-deep">'
      +'<div class="hlb-eyebrow">✦ 座標之後</div>'
      +'<div class="hlb-text">'+mirror+'</div>'
      +'<div class="hlb-divider"></div>'
      +'<div class="hlb-cta-row">'
      +'<a href="'+mainCTA.url+'" class="hlb-btn hlb-btn-main">'+mainCTA.btn+'</a>'
      +'<a href="'+secondCTA.url+'" class="hlb-btn hlb-btn-sub">'+secondCTA.btn+'</a>'
      +'</div>'
      +'<div class="hlb-empower">'+empower+'</div>'
      +'</div>';
  }

  // 中度（預設）
  return '<div class="hl-bridge">'
    +'<div class="hlb-text">'+mirror+'</div>'
    +'<div class="hlb-cta-row">'
    +'<a href="'+mainCTA.url+'" class="hlb-btn hlb-btn-main">'+mainCTA.btn+'</a>'
    +'<a href="'+secondCTA.url+'" class="hlb-btn hlb-btn-sub">'+secondCTA.btn+'</a>'
    +'</div>'
    +'<div class="hlb-empower">'+empower+'</div>'
    +'</div>';
};

// ── 自動注入到指定容器 ──
window.HLBridge.inject = function(containerId, type, intensity){
  var el = document.getElementById(containerId);
  if(el) el.innerHTML = HLBridge(type, intensity);
};

})();
