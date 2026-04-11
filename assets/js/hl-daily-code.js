/* hl-daily-code.js — 馥靈流日數（秘碼日曆）v1.0
   自執行模組，嵌入 app.html / member-dashboard.html
   容器 ID: dailyCodeContainer
   依賴: Lunar（lunar.min.js）或自動 fallback 簡易農曆
   © 2026 馥靈之鑰 Hour Light */
(function(){
'use strict';

/* ── 數字對應資料 ── */
var CODE_DATA = {
  1: {
    keyword: '開始 / 獨立',
    suggestions: ['啟動新計畫', '獨處充電', '寫下目標'],
    caution: '不要太固執',
    oil: '迷迭香'
  },
  2: {
    keyword: '合作 / 敏感',
    suggestions: ['溝通協調', '傾聽他人', '修復關係'],
    caution: '不要過度配合',
    oil: '薰衣草'
  },
  3: {
    keyword: '創意 / 表達',
    suggestions: ['做創意工作', '說出心裡話', '嘗試新事物'],
    caution: '不要三分鐘熱度',
    oil: '葡萄柚'
  },
  4: {
    keyword: '穩定 / 建構',
    suggestions: ['整理環境', '處理文件', '打好基礎'],
    caution: '不要太死板',
    oil: '雪松'
  },
  5: {
    keyword: '自由 / 變化',
    suggestions: ['打破常規', '出門走走', '學新東西'],
    caution: '不要太散漫',
    oil: '薄荷'
  },
  6: {
    keyword: '和諧 / 責任',
    suggestions: ['照顧家人', '處理財務', '美化空間'],
    caution: '不要管太多',
    oil: '玫瑰'
  },
  7: {
    keyword: '內省 / 分析',
    suggestions: ['靜心冥想', '讀書研究', '獨處思考'],
    caution: '不要想太多',
    oil: '乳香'
  },
  8: {
    keyword: '力量 / 執行',
    suggestions: ['談判簽約', '處理金錢', '展現領導力'],
    caution: '不要太強勢',
    oil: '黑胡椒'
  },
  9: {
    keyword: '完成 / 智慧',
    suggestions: ['收尾結案', '放下執念', '幫助他人'],
    caution: '不要太感傷',
    oil: '檀香'
  }
};

/* ── 取得農曆月日 ── */
function getLunarMonthDay() {
  // 優先用 lunar.min.js
  if (typeof Lunar !== 'undefined' && Lunar.fromDate) {
    try {
      var lunar = Lunar.fromDate(new Date());
      return { month: lunar.getMonth(), day: lunar.getDay() };
    } catch(e) { /* fallback */ }
  }
  // fallback: 用 Solar 轉 Lunar
  if (typeof Solar !== 'undefined' && Solar.fromDate) {
    try {
      var solar = Solar.fromDate(new Date());
      var l = solar.getLunar();
      return { month: l.getMonth(), day: l.getDay() };
    } catch(e) { /* fallback */ }
  }
  // 最後 fallback: 近似值（不精確，僅作保底）
  return null;
}

/* ── 縮減到 1-9 ── */
function reduceToSingle(n) {
  while (n > 9) {
    var sum = 0;
    var s = String(n);
    for (var i = 0; i < s.length; i++) {
      sum += parseInt(s[i], 10);
    }
    n = sum;
  }
  return n || 9;
}

/* ── 計算流日數 ── */
function calcDailyCode(month, day) {
  // 農曆月 + 農曆日各位數字相加，縮減到 1-9
  var digits = String(Math.abs(month)) + String(day);
  var sum = 0;
  for (var i = 0; i < digits.length; i++) {
    sum += parseInt(digits[i], 10);
  }
  return reduceToSingle(sum);
}

/* ── 農曆月份中文 ── */
var LUNAR_MONTHS = ['','正','二','三','四','五','六','七','八','九','十','冬','臘'];

/* ── 注入 CSS ── */
var css = '\
@keyframes dc-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}\
.dc-card{background:#fffcf7;border:1px solid #e8ddd0;border-radius:16px;overflow:hidden;margin-bottom:20px;font-family:"LXGW WenKai TC","Noto Serif TC",serif;animation:dc-fadein .5s ease}\
.dc-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 0}\
.dc-title{font-size:.92rem;font-weight:600;color:#2d2418}\
.dc-lunar-date{font-size:.78rem;color:#9a8a74}\
.dc-body{padding:16px 24px 20px;display:flex;gap:20px;align-items:flex-start}\
.dc-num-col{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:6px}\
.dc-num{width:72px;height:72px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(135deg,#f8dfa5,#e9c27d);color:#2d2418;font-size:2rem;font-weight:700;box-shadow:0 4px 16px rgba(201,160,96,.25)}\
.dc-keyword{font-size:.82rem;color:#7a6a58;text-align:center;white-space:nowrap}\
.dc-info-col{flex:1;min-width:0}\
.dc-section{margin-bottom:12px}\
.dc-section:last-child{margin-bottom:0}\
.dc-label{font-size:.76rem;color:#9a8a74;margin-bottom:4px}\
.dc-suggest-list{list-style:none;padding:0;margin:0}\
.dc-suggest-list li{font-size:.88rem;color:#2d2418;line-height:1.7;padding-left:14px;position:relative}\
.dc-suggest-list li::before{content:"\\25B8";position:absolute;left:0;color:#c9a060;font-size:.72rem;top:3px}\
.dc-caution{font-size:.88rem;color:#96725a;line-height:1.7;padding:8px 12px;background:rgba(196,154,64,.06);border-radius:8px;border-left:3px solid #d4a853}\
.dc-oil{font-size:.86rem;color:#7a6a58;line-height:1.6}\
.dc-oil-name{color:#2d2418;font-weight:500}\
.dc-fallback{padding:20px 24px;font-size:.88rem;color:#9a8a74;text-align:center}\
@media(max-width:480px){\
  .dc-body{flex-direction:column;align-items:center;gap:14px}\
  .dc-num-col{flex-direction:row;gap:12px}\
  .dc-header{padding:16px 16px 0}\
  .dc-body{padding:14px 16px 16px}\
}\
';
var sty = document.createElement('style');
sty.textContent = css;
document.head.appendChild(sty);

/* ── 渲染 ── */
function render(container) {
  var ld = getLunarMonthDay();
  if (!ld) {
    container.innerHTML = '<div class="dc-card"><div class="dc-fallback">農曆日曆載入中，請稍候再試</div></div>';
    return;
  }

  var code = calcDailyCode(ld.month, ld.day);
  var data = CODE_DATA[code];
  var monthName = LUNAR_MONTHS[Math.abs(ld.month)] || (Math.abs(ld.month) + '');
  var lunarLabel = '農曆' + (ld.month < 0 ? '閏' : '') + monthName + '月' + ld.day + '日';

  var html = '<div class="dc-card">';

  // 標題
  html += '<div class="dc-header">';
  html += '<div class="dc-title">今日馥靈流日數</div>';
  html += '<div class="dc-lunar-date">' + lunarLabel + '</div>';
  html += '</div>';

  // 主體
  html += '<div class="dc-body">';

  // 左欄：數字
  html += '<div class="dc-num-col">';
  html += '<div class="dc-num">' + code + '</div>';
  html += '<div class="dc-keyword">' + data.keyword + '</div>';
  html += '</div>';

  // 右欄：內容
  html += '<div class="dc-info-col">';

  // 適合做什麼
  html += '<div class="dc-section"><div class="dc-label">今天適合</div>';
  html += '<ul class="dc-suggest-list">';
  for (var i = 0; i < data.suggestions.length; i++) {
    html += '<li>' + data.suggestions[i] + '</li>';
  }
  html += '</ul></div>';

  // 注意
  html += '<div class="dc-section"><div class="dc-caution">';
  html += '留意：' + data.caution;
  html += '</div></div>';

  // 推薦精油
  html += '<div class="dc-section"><div class="dc-oil">';
  html += '推薦精油：<span class="dc-oil-name">' + data.oil + '</span>';
  html += '</div></div>';

  html += '</div>'; // info-col
  html += '</div>'; // body
  html += '</div>'; // card

  container.innerHTML = html;
}

/* ── 初始化 ── */
function init() {
  var container = document.getElementById('dailyCodeContainer');
  if (!container) return;
  render(container);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
