/**
 * hl-datepicker.js · 全站 <input type="date"> 自動轉三下拉
 * ─────────────────────────────────────────────────
 * 根因：原生 date picker 桌面版選年份 UX 極差（要點很多次），
 *       iOS Safari 在深色 / 淺色主題切換下還有文字看不見的問題。
 *
 * 解法：頁面載入時自動把所有 <input type="date"> 替換成三個 <select>
 *       （年 / 月 / 日），原 input 變 hidden 保留 value 同步，
 *       任何 JS 讀取 .value 都能正常拿到 YYYY-MM-DD。
 *
 * 使用方式：頁面載入 hl-bottomnav.js 即可（會自動注入此模組）。
 *           或直接 <script src="assets/js/hl-datepicker.js"></script>
 *
 * 排除：已經手動做成三下拉的頁面（有 id="birthYear" 等 sibling）自動跳過。
 */
(function(){
  'use strict';

  var MIN_YEAR = 1900;
  var MAX_YEAR = new Date().getFullYear();

  // 樣式一次注入
  function injectStyle(){
    if (document.getElementById('hldp-style')) return;
    var s = document.createElement('style');
    s.id = 'hldp-style';
    s.textContent = ''
      + '.hldp-wrap{display:flex;gap:6px;align-items:center;flex-wrap:nowrap}'
      + '.hldp-wrap select{flex:1;min-width:0;padding:10px 8px;border:1px solid #ddd7cd;border-radius:8px;background:#fff;color:#1a1714;font-size:16px;font-family:inherit;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'><path fill=\'none\' stroke=\'%238b6f4e\' stroke-width=\'1.5\' d=\'M1 1l4 4 4-4\'/></svg>");background-repeat:no-repeat;background-position:right 8px center;padding-right:24px}'
      + '.hldp-wrap select:focus{outline:none;border-color:#8b6f4e}'
      + '.hldp-wrap select.hldp-y{flex:2}'
      + '@media(max-width:600px){.hldp-wrap select{font-size:16px;padding:12px 8px}}';
    document.head.appendChild(s);
  }

  function pad2(n){ n = String(n); return n.length < 2 ? '0' + n : n; }

  function daysInMonth(y, m){
    if (!y || !m) return 31;
    return new Date(+y, +m, 0).getDate();
  }

  // 把 <input type="date"> 轉成三下拉
  function convert(input){
    // 已處理過
    if (input.dataset.hldpDone) return;
    input.dataset.hldpDone = '1';

    // 不轉：min-width 很小的（可能隱藏在某處的 hidden pattern）
    // 或 已有 disabled / display:none 的不碰，避免亂動 admin UI
    if (input.disabled) return;

    // 父層若已有 hldp-wrap（可能被改過）略過
    if (input.parentNode.classList && input.parentNode.classList.contains('hldp-wrap')) return;

    // 收集現值
    var currentVal = input.value || ''; // YYYY-MM-DD 或空
    var parts = currentVal.split('-');
    var curY = parts[0] || '';
    var curM = parts[1] ? String(+parts[1]) : '';
    var curD = parts[2] ? String(+parts[2]) : '';

    // 建三下拉
    var wrap = document.createElement('div');
    wrap.className = 'hldp-wrap';

    var sy = document.createElement('select');
    sy.className = 'hldp-y';
    sy.setAttribute('aria-label', '出生年');
    sy.innerHTML = '<option value="">年</option>';
    for (var y = MAX_YEAR; y >= MIN_YEAR; y--){
      var sel = (String(y) === curY) ? ' selected' : '';
      sy.innerHTML += '<option value="' + y + '"' + sel + '>' + y + '</option>';
    }

    var sm = document.createElement('select');
    sm.setAttribute('aria-label', '出生月');
    sm.innerHTML = '<option value="">月</option>';
    for (var m = 1; m <= 12; m++){
      var sel2 = (String(m) === curM) ? ' selected' : '';
      sm.innerHTML += '<option value="' + m + '"' + sel2 + '>' + m + '</option>';
    }

    var sd = document.createElement('select');
    sd.setAttribute('aria-label', '出生日');
    sd.innerHTML = '<option value="">日</option>';
    var maxD = daysInMonth(curY, curM);
    for (var d = 1; d <= maxD; d++){
      var sel3 = (String(d) === curD) ? ' selected' : '';
      sd.innerHTML += '<option value="' + d + '"' + sel3 + '>' + d + '</option>';
    }

    wrap.appendChild(sy);
    wrap.appendChild(sm);
    wrap.appendChild(sd);

    // 把原 input 改為 hidden 保留在 DOM，讓 form submit / JS .value 能拿到
    // 沿用 input 的 id / name
    input.type = 'hidden';
    // 插在 input 前面
    input.parentNode.insertBefore(wrap, input);

    function updateInputValue(){
      var y = sy.value, m = sm.value, d = sd.value;
      if (y && m && d){
        input.value = y + '-' + pad2(m) + '-' + pad2(d);
      } else {
        input.value = '';
      }
      // 觸發 input change event 讓原綁定的監聽器還能跑
      try { input.dispatchEvent(new Event('change', { bubbles: true })); } catch(e){}
      try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch(e){}
    }

    // 月/年變時重建日的 option（避免 2月30日）
    function rebuildDays(){
      var oldD = sd.value;
      var max = daysInMonth(sy.value, sm.value);
      sd.innerHTML = '<option value="">日</option>';
      for (var d = 1; d <= max; d++){
        var selX = (String(d) === oldD) ? ' selected' : '';
        sd.innerHTML += '<option value="' + d + '"' + selX + '>' + d + '</option>';
      }
    }

    sy.addEventListener('change', function(){ rebuildDays(); updateInputValue(); });
    sm.addEventListener('change', function(){ rebuildDays(); updateInputValue(); });
    sd.addEventListener('change', updateInputValue);
  }

  function scan(){
    injectStyle();
    var nodes = document.querySelectorAll('input[type="date"]');
    nodes.forEach(convert);
  }

  // 執行
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  // 動態插入的 date input 也處理（MutationObserver）
  if (window.MutationObserver){
    var mo = new MutationObserver(function(mutations){
      for (var i = 0; i < mutations.length; i++){
        var added = mutations[i].addedNodes;
        if (!added) continue;
        for (var j = 0; j < added.length; j++){
          var node = added[j];
          if (node.nodeType !== 1) continue;
          if (node.matches && node.matches('input[type="date"]')) convert(node);
          var inner = node.querySelectorAll ? node.querySelectorAll('input[type="date"]') : null;
          if (inner) inner.forEach(convert);
        }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  // 對外 API
  window.hlDatePicker = { scan: scan, convert: convert };
})();
