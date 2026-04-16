/**
 * 馥靈之鑰 城堡房間｜史詩意義文案（馥靈馥語）v1.0
 * ─────────────────────────────────────
 * 每房一句，讓「玩」升級為「儀式」。Octalysis 第一動力：史詩意義。
 * 用法：castle-room-*.html 在 </body> 前加 <script src="assets/js/hl-castle-epic.js"></script>
 * 模組自動讀取該頁的 ROOM_ID 變數，對照 EPIC_COPY 注入文案。
 */
(function(){
  'use strict';

  // 21 房馥靈馥語（每句都經品牌聖經 self-check）
  var EPIC_COPY = {
    // H 身心校準
    mirror:    '這面鏡子照得不是外表。你每次眨一下眼，它就記得你。',
    music:     '這裡沒有樂譜。只有你的呼吸、你的節奏、你怎麼過今天的步伐。',
    heal:      '不是沒在流血才進得來。是你願意看見流血的地方，才進得來。',
    harmony:   '外面太吵，這裡的安靜不是空的。是留著位置，等你把自己接回來。',

    // O 智慧辨識
    treasure:  '你以為寶藏要用挖的。其實是你願意承認它一直都在。',
    library:   '這裡的書沒有標題。每一本都是你還沒讀懂的自己。',
    own:       '門很重。但鎖一直在你手上，不是別人的。',

    // U 潛能解鎖
    key:       '鑰匙不是找到就能進。是你願意說「我可以」的那一刻才轉得開。',
    alchemy:   '這裡不是把石頭變金子。是把你以為沒用的，變成你要的。',
    unlock:    '不是你還不夠，是你還沒允許自己去要。',

    // R 行動進化
    throne:    '不是等別人讓位，是你自己走上來。每一階都算數。',
    rise:      '上去的路不是直線。是你走歪了，又自己調回來的那條。',

    // LIGHT 五能量
    love:      '這裡的愛沒有交換。你先給自己一次，世界才認得。',
    intuition: '閉上眼睛比睜開還準。因為你的身體早就知道。',
    ground:    '扎根不是變重。是你終於知道自己腳底下踩的是什麼。',
    transform: '蛻變不是變成別人。是你敢脫下那個不是你的皮。',

    // X 秘境
    dream:     '夢不是預言，也不是廢話。是白天沒說完的那句話。',
    garden:    '你種下的每一件事，都在這裡開。慢一點也沒關係。',
    tower:     '站得夠高才看得見你走過的路。原來那麼遠了。',
    kitchen:   '火候不是技巧，是你願意為自己花的時間。',
    secret:    '這條路不在地圖上。只有願意誠實的人走得進來。'
  };

  // 取得當前房間 ID
  var roomId = (typeof ROOM_ID !== 'undefined') ? ROOM_ID : null;
  if (!roomId || !EPIC_COPY[roomId]) return;

  // 注入 CSS（only once）
  if (!document.getElementById('hl-castle-epic-style')) {
    var css = document.createElement('style');
    css.id = 'hl-castle-epic-style';
    css.textContent = [
      '.hl-room-epic{',
      '  margin:14px 18px 0;',
      '  padding:16px 20px;',
      '  border-left:2px solid rgba(200,134,42,.35);',
      '  background:linear-gradient(90deg,rgba(200,134,42,.04),transparent 80%);',
      '  font-family:"LXGW WenKai TC","Noto Serif TC",serif;',
      '  font-size:.95rem;',
      '  line-height:2;',
      '  color:var(--warm2,#6b4a30);',
      '  letter-spacing:.03em;',
      '  border-radius:0 10px 10px 0;',
      '  position:relative;',
      '  opacity:0;',
      '  transform:translateX(-6px);',
      '  animation:hlEpicFade .9s cubic-bezier(.4,0,.2,1) .35s forwards;',
      '}',
      '.hl-room-epic::before{',
      '  content:"";',
      '  position:absolute;left:-2px;top:0;height:100%;width:2px;',
      '  background:linear-gradient(180deg,rgba(200,134,42,0),rgba(200,134,42,.8) 50%,rgba(200,134,42,0));',
      '  opacity:.6;',
      '}',
      '@keyframes hlEpicFade{to{opacity:1;transform:translateX(0)}}',
      // 深色主題自動適配
      'body:not([class*="light"]) .hl-room-epic{',
      '  color:rgba(244,240,235,.78);',
      '  background:linear-gradient(90deg,rgba(248,223,165,.06),transparent 80%);',
      '  border-left-color:rgba(248,223,165,.4);',
      '}'
    ].join('\n');
    document.head.appendChild(css);
  }

  // 注入 HTML
  function inject(){
    // 防重入
    if (document.querySelector('.hl-room-epic')) return;

    var epic = document.createElement('div');
    epic.className = 'hl-room-epic';
    epic.setAttribute('role', 'doc-epigraph');
    epic.textContent = EPIC_COPY[roomId];

    // 放置策略（優先順序）：
    // 1. .servant-greeting 之後
    // 2. .room-header 之後
    // 3. .topbar 之後（body 第一個可見 section）
    var anchor = document.querySelector('.servant-greeting')
              || document.querySelector('.room-header')
              || document.querySelector('.topbar');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(epic, anchor.nextSibling);
    } else {
      document.body.insertBefore(epic, document.body.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
