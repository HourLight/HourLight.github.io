/**
 * 馥靈之鑰 ｜ 完整會員權益彈窗 v1.0
 *
 * 用法：
 *   <script src="assets/js/hl-benefits-modal.js"></script>
 *   任何元素呼叫 HLBenefits.open() 即可開啟彈窗
 *   範例：<a href="#" onclick="HLBenefits.open();return false">查看完整會員權益</a>
 *
 * 內容單一來源（SSOT），避免三份價目表 + pricing.html 各自維護不同步。
 * 若價格／規則調整，只改這支檔案。
 */
(function(){
  'use strict';

  if (window.HLBenefits) return; // 已載入

  var STYLE = ''
    + '.hlbf-overlay{position:fixed;inset:0;background:rgba(5,3,10,.85);backdrop-filter:blur(4px);'
    + '  display:none;align-items:center;justify-content:center;z-index:99999;padding:20px;'
    + '  font-family:"Noto Sans TC","Noto Serif TC",sans-serif}'
    + '.hlbf-overlay.show{display:flex;animation:hlbf-fade .25s ease}'
    + '@keyframes hlbf-fade{from{opacity:0}to{opacity:1}}'
    + '.hlbf-modal{background:#0c0716;color:#f4f0eb;border:1px solid rgba(233,194,125,.25);'
    + '  border-radius:14px;max-width:780px;width:100%;max-height:88vh;overflow-y:auto;'
    + '  padding:30px 34px;box-shadow:0 20px 60px rgba(0,0,0,.6);position:relative;'
    + '  -webkit-overflow-scrolling:touch}'
    + '.hlbf-close{position:absolute;top:14px;right:18px;background:none;border:none;'
    + '  color:rgba(244,240,235,.7);font-size:1.6rem;cursor:pointer;line-height:1;'
    + '  padding:6px 12px;border-radius:6px;transition:all .2s}'
    + '.hlbf-close:hover{background:rgba(255,255,255,.08);color:#f8dfa5}'
    + '.hlbf-modal h2{font-family:"Noto Serif TC",serif;font-size:1.25rem;color:#f8dfa5;'
    + '  font-weight:500;letter-spacing:3px;margin:0 0 6px;text-align:center}'
    + '.hlbf-sub{font-size:.78rem;color:rgba(244,240,235,.6);text-align:center;'
    + '  margin-bottom:22px;letter-spacing:1px}'
    + '.hlbf-sect{font-family:"Noto Serif TC",serif;font-size:.92rem;color:#f8dfa5;'
    + '  margin:20px 0 10px;letter-spacing:1.5px;padding-bottom:8px;'
    + '  border-bottom:1px solid rgba(233,194,125,.15)}'
    + '.hlbf-sect:first-of-type{margin-top:0}'
    + '.hlbf-table{width:100%;border-collapse:collapse;font-size:.8rem}'
    + '.hlbf-table th{background:rgba(233,194,125,.08);color:#f8dfa5;font-weight:500;'
    + '  padding:9px 10px;text-align:left;border-bottom:1px solid rgba(233,194,125,.18);'
    + '  letter-spacing:.5px;font-size:.76rem}'
    + '.hlbf-table th.c{text-align:center;width:24%}'
    + '.hlbf-table td{padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.05);'
    + '  color:#f4f0eb;line-height:1.55}'
    + '.hlbf-table td.c{text-align:center;color:#e9c27d;font-weight:500}'
    + '.hlbf-table tr:hover td{background:rgba(255,255,255,.02)}'
    + '.hlbf-note{font-size:.74rem;color:rgba(244,240,235,.7);line-height:1.7;'
    + '  padding:10px 14px;background:rgba(233,194,125,.04);'
    + '  border-left:2px solid rgba(233,194,125,.3);margin-top:12px;border-radius:0 4px 4px 0}'
    + '.hlbf-note strong{color:#e9c27d}'
    + '.hlbf-cta{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:22px}'
    + '.hlbf-cta a{display:inline-block;padding:11px 22px;background:rgba(233,194,125,.12);'
    + '  border:1px solid rgba(233,194,125,.4);color:#f8dfa5;text-decoration:none;'
    + '  font-size:.82rem;letter-spacing:1px;border-radius:6px;transition:all .2s}'
    + '.hlbf-cta a:hover{background:rgba(233,194,125,.2);border-color:rgba(233,194,125,.7)}'
    + '.hlbf-cta a.primary{background:#e9c27d;color:#0c0716;border-color:#e9c27d}'
    + '.hlbf-cta a.primary:hover{background:#f8dfa5}'
    + '@media(max-width:600px){.hlbf-modal{padding:24px 20px}.hlbf-table{font-size:.74rem}'
    + '  .hlbf-table th,.hlbf-table td{padding:7px 6px}}';

  var HTML = ''
    + '<button class="hlbf-close" aria-label="關閉" onclick="HLBenefits.close()">×</button>'
    + '<h2>馥靈之鑰 完整會員權益</h2>'
    + '<div class="hlbf-sub">所有權益清單 ｜ 2026 年 4 月版</div>'

    + '<div class="hlbf-sect">📌 三種會員等級</div>'
    + '<table class="hlbf-table">'
    + '<thead><tr><th>項目</th><th class="c">免費會員</th><th class="c">馥靈鑰友<br>$399/月</th><th class="c">馥靈大師<br>$999/月</th></tr></thead>'
    + '<tbody>'
    + '<tr><td>AI 深度解讀指令<br><span style="font-size:.7rem;color:rgba(244,240,235,.55)">命盤、合盤、紫微等 34+ 工具</span></td><td class="c">3 次/天</td><td class="c">12 次/天</td><td class="c">無限</td></tr>'
    + '<tr><td>占卜工具計次<br><span style="font-size:.7rem;color:rgba(244,240,235,.55)">塔羅、易經、天使、骨牌、夢境、鏡像、季節等</span></td><td class="c">3 次/天<br><span style="font-size:.66rem">每工具獨立</span></td><td class="c">12 次/天<br><span style="font-size:.66rem">每工具獨立</span></td><td class="c">無限</td></tr>'
    + '<tr><td>33 套合盤系統</td><td class="c">前 5 套</td><td class="c">後半段解鎖</td><td class="c">全套 33 合盤</td></tr>'
    + '<tr><td>每月贈送 3 張牌 AI 解讀</td><td class="c">—</td><td class="c">3 次</td><td class="c">10 次</td></tr>'
    + '<tr><td>每月贈送 $500 解牌抵用券</td><td class="c">—</td><td class="c">—</td><td class="c">2 張</td></tr>'
    + '</tbody></table>'

    + '<div class="hlbf-sect">🎁 永遠免費（不限會員等級）</div>'
    + '<table class="hlbf-table">'
    + '<tbody>'
    + '<tr><td>33 大命理系統計算（八字、紫微、占星、人類圖、馥靈秘碼等）</td><td class="c">免費 ｜ 不限次</td></tr>'
    + '<tr><td>100+ 心理測驗（MBTI、九型、依附型態、富命覺醒等）</td><td class="c">免費 ｜ 不限次</td></tr>'
    + '<tr><td>馥靈智慧牌抽牌（130 張原創牌卡）</td><td class="c">免費 ｜ 不限次</td></tr>'
    + '<tr><td>1 張牌靜態解讀（含牌義、精油對應、覺察提示）</td><td class="c">免費 ｜ 不限次</td></tr>'
    + '<tr><td>命理資料複製（複製到其他 AI 工具用）</td><td class="c">免費 ｜ 不限次</td></tr>'
    + '</tbody></table>'

    + '<div class="hlbf-sect">💳 計次付費（不需訂閱）</div>'
    + '<table class="hlbf-table">'
    + '<tbody>'
    + '<tr><td>馥靈智慧牌 3 張 AI 深度解讀</td><td class="c">NT$ 199</td></tr>'
    + '<tr><td>馥靈智慧牌 5 張 AI 深度解讀</td><td class="c">NT$ 399</td></tr>'
    + '<tr><td>馥靈智慧牌 7 張 AI 深度解讀</td><td class="c">NT$ 599</td></tr>'
    + '<tr><td>寵物溝通 / 家族覺察 AI（3/5/7 張）</td><td class="c">199 / 399 / 599</td></tr>'
    + '<tr><td>SPA 處方箋 / 美甲指尖能量（3/5/9 張）</td><td class="c">600 / 900 / 1,200</td></tr>'
    + '<tr><td>元辰宮 / 阿卡西 AI 解讀</td><td class="c">NT$ 599</td></tr>'
    + '<tr><td>小馥前世故事 AI</td><td class="c">NT$ 399</td></tr>'
    + '<tr><td>姓名 AI 分析</td><td class="c">NT$ 199</td></tr>'
    + '<tr><td>加購 AI 解讀指令 10 次（永久有效不歸零）</td><td class="c">NT$ 199</td></tr>'
    + '</tbody></table>'

    + '<div class="hlbf-note">'
    + '<strong>計次規則</strong><br>'
    + '• AI 深度解讀指令與占卜工具計次每日 UTC+8 00:00 自動歸零，沒用完不累計。<br>'
    + '• 占卜工具每個獨立計次：例如塔羅 12 次/天 + 易經 12 次/天，互不影響。<br>'
    + '• 加購 10 次永久有效，每日配額用完才扣，不會搶用免費額度。'
    + '</div>'

    + '<div class="hlbf-note">'
    + '<strong>訂閱與退款</strong><br>'
    + '• 付款後自動開通 30 天，到期自動恢復免費方案 — 不綁自動扣款，不續就停。<br>'
    + '• 訂閱付款後若尚未開通，可申請全額退款；AI 報告交付後恕不退費。<br>'
    + '• 大師方案的 $500 抵用券可用於 3/5/7 張 AI 解讀或寵物 / 家族 / SPA / 美甲解讀。'
    + '</div>'

    + '<div class="hlbf-cta">'
    + '<a href="https://lin.ee/RdQBFAN" target="_blank" rel="noopener" class="primary">💬 LINE 開通會員</a>'
    + '<a href="pricing.html">查看完整價目</a>'
    + '<a href="member-dashboard.html">會員中心</a>'
    + '</div>';

  var overlay, modal;

  function init(){
    if (overlay) return;
    var s = document.createElement('style');
    s.textContent = STYLE;
    document.head.appendChild(s);

    overlay = document.createElement('div');
    overlay.className = 'hlbf-overlay';
    overlay.addEventListener('click', function(e){
      if (e.target === overlay) close();
    });

    modal = document.createElement('div');
    modal.className = 'hlbf-modal';
    modal.innerHTML = HTML;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && overlay.classList.contains('show')) close();
    });
  }

  function open(){
    init();
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function close(){
    if (!overlay) return;
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  window.HLBenefits = { open: open, close: close };

  // 自動初始化以避免首次點擊延遲
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
