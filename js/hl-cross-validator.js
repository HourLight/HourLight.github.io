/**
 * 馥靈之鑰 CrossValidator 交叉驗證引擎 v1.0
 * js/hl-cross-validator.js
 *
 * 所有占卜工具共用的多系統交叉驗證模組。
 * 核心邏輯：多套獨立系統指向同一個答案 = 最強訊號。
 *
 * 使用方式：
 *   var result = HLCross.validate([
 *     { system:'八字日主', element:'fire', themes:['career','action'], confidence:0.9 },
 *     { system:'節氣能量', element:'fire', themes:['action'], confidence:0.7 },
 *     { system:'易經卦象', element:'wood', themes:['growth','career'], confidence:0.85 }
 *   ]);
 *   // result.agreementText = "2/3 系統交叉驗證"
 *   // result.signalStrength = "多數共識"
 *   // result.dominantElement = "fire"
 *   // result.confidenceScore = 78
 *
 * 依賴：無（獨立模組）
 */
(function(){
'use strict';

// ═══ 五行定義 ═══
var ELEMENTS = ['wood','fire','earth','metal','water'];

var ELEMENT_CN = {
  wood:'木', fire:'火', earth:'土', metal:'金', water:'水'
};

// ═══ 五行相生相剋 ═══
// 相生：木→火→土→金→水→木
var GENERATE = { wood:'fire', fire:'earth', earth:'metal', metal:'water', water:'wood' };
// 相剋：木→土→水→火→金→木
var OVERCOME = { wood:'earth', earth:'water', water:'fire', fire:'metal', metal:'wood' };

// ═══ 五行關係判定 ═══
function getRelation(elA, elB) {
  if (elA === elB) return { type:'比', label:'比和', score:70, desc:'同類相助，力量加倍' };
  if (GENERATE[elA] === elB) return { type:'洩', label:'我生', score:60, desc:'你在付出能量支持對方' };
  if (GENERATE[elB] === elA) return { type:'生', label:'生我', score:90, desc:'有力量在滋養你' };
  if (OVERCOME[elA] === elB) return { type:'財', label:'我剋', score:80, desc:'你有主導的能力' };
  if (OVERCOME[elB] === elA) return { type:'殺', label:'剋我', score:40, desc:'這裡有壓力和考驗' };
  return { type:'?', label:'未知', score:50, desc:'' };
}

// ═══ 天干→五行 ═══
var STEM_ELEMENT = {
  '甲':'wood','乙':'wood','丙':'fire','丁':'fire',
  '戊':'earth','己':'earth','庚':'metal','辛':'metal',
  '壬':'water','癸':'water'
};

// ═══ 數字→五行（馥靈系統）═══
var NUMBER_ELEMENT = {
  1:'metal', 2:'water', 3:'fire', 4:'wood', 5:'earth',
  6:'metal', 7:'water', 8:'fire', 9:'wood'
};

// ═══ 24 節氣→五行 ═══
var TERM_ELEMENT = {
  '立春':'wood','雨水':'wood','驚蟄':'wood','春分':'wood','清明':'wood',
  '穀雨':'earth',
  '立夏':'fire','小滿':'fire','芒種':'fire','夏至':'fire','小暑':'fire',
  '大暑':'earth',
  '立秋':'metal','處暑':'metal','白露':'metal','秋分':'metal','寒露':'metal',
  '霜降':'earth',
  '立冬':'water','小雪':'water','大雪':'water','冬至':'water','小寒':'water',
  '大寒':'earth'
};

// ═══ 八卦→五行 ═══
var TRIGRAM_ELEMENT = {
  '乾':'metal','兌':'metal','離':'fire',
  '震':'wood','巽':'wood','坎':'water',
  '艮':'earth','坤':'earth'
};

// ═══ 精油×五行×經絡×情緒 ═══
var ELEMENT_OIL = {
  wood: {
    primary:['尤加利','茶樹','絲柏'],
    secondary:['松針','杜松漿果','佛手柑'],
    keyword:'疏通、生長、向上',
    bodyArea:'肝膽經絡',
    emotion:'憤怒→創造力',
    sceneHint:'想像剛走進一片清晨的森林，那個清新的氣息'
  },
  fire: {
    primary:['甜橙','肉桂','薑'],
    secondary:['迷迭香','黑胡椒','玫瑰天竺葵'],
    keyword:'溫暖、熱情、行動',
    bodyArea:'心與小腸經絡',
    emotion:'焦慮→喜悅',
    sceneHint:'想像剛剝開一顆橘子，那個溫暖明亮的香氣撲面而來'
  },
  earth: {
    primary:['廣藿香','岩蘭草','檀香'],
    secondary:['安息香','沒藥','甜茴香'],
    keyword:'穩定、紮根、消化',
    bodyArea:'脾胃經絡',
    emotion:'擔憂→安定',
    sceneHint:'想像赤腳踩在溫暖的泥土上，那個踏實的觸感'
  },
  metal: {
    primary:['乳香','沒藥','迷迭香'],
    secondary:['白千層','綠花白千層','月桂'],
    keyword:'收斂、清理、放手',
    bodyArea:'肺與大腸經絡',
    emotion:'悲傷→平靜',
    sceneHint:'想像教堂裡的乳香煙霧，那個讓人安靜下來的氣味'
  },
  water: {
    primary:['薰衣草','洋甘菊','依蘭'],
    secondary:['快樂鼠尾草','橙花','茉莉'],
    keyword:'流動、智慧、深層',
    bodyArea:'腎與膀胱經絡',
    emotion:'恐懼→信任',
    sceneHint:'想像薰衣草田在微風中搖擺，那個讓全身放鬆的香氣'
  }
};

// ═══ 數字→精油 ═══
var NUMBER_OIL = {
  1:'茶樹（獨立、開創）', 2:'洋甘菊（柔和、合作）',
  3:'甜橙（表達、創造）', 4:'絲柏（結構、安全）',
  5:'廣藿香（自由、平衡）', 6:'玫瑰天竺葵（責任、愛）',
  7:'乳香（真理、深度）', 8:'迷迭香（豐盛、力量）',
  9:'薰衣草（大愛、放下）'
};

// ═══ 主題標籤 ═══
var THEME_CN = {
  career:'事業', relationship:'關係', family:'家庭',
  wealth:'財富', health:'健康', creativity:'創造力',
  knowledge:'智慧', fame:'聲譽', benefactor:'貴人',
  self:'自我', transformation:'蛻變', stagnation:'停滯',
  action:'行動', rest:'休息', conflict:'衝突',
  love:'愛', healing:'身心校準', growth:'成長'
};

// ═══ 交叉驗證核心函數 ═══
function validate(readings) {
  if (!readings || readings.length === 0) {
    return { totalSystems:0, agreements:0, confidenceScore:0, signalStrength:'無資料' };
  }

  // Step 1: 統計主題票數（加權）
  var themeVotes = {};
  var elementVotes = {};

  for (var i = 0; i < readings.length; i++) {
    var r = readings[i];
    var conf = r.confidence || 0.5;

    // 元素票
    if (r.element) {
      elementVotes[r.element] = (elementVotes[r.element] || 0) + conf;
    }

    // 主題票
    if (r.themes) {
      for (var j = 0; j < r.themes.length; j++) {
        var t = r.themes[j];
        themeVotes[t] = (themeVotes[t] || 0) + conf;
      }
    }
  }

  // Step 2: 找出最強主題和元素
  var dominantTheme = _maxKey(themeVotes);
  var dominantElement = _maxKey(elementVotes);

  // Step 3: 計算同意數
  var agreements = 0;
  var supporting = [];
  var conflicting = [];

  for (var k = 0; k < readings.length; k++) {
    var rd = readings[k];
    var agrees = false;

    if (dominantElement && rd.element === dominantElement) agrees = true;
    if (dominantTheme && rd.themes && rd.themes.indexOf(dominantTheme) >= 0) agrees = true;

    if (agrees) {
      agreements++;
      supporting.push(rd.system);
    } else {
      conflicting.push(rd.system);
    }
  }

  // Step 4: 計算信心分數
  var rawScore = (agreements / readings.length) * 100;
  var elementAgree = 0;
  for (var m = 0; m < readings.length; m++) {
    if (readings[m].element === dominantElement) elementAgree++;
  }
  var elementBonus = (elementAgree / readings.length) * 15;
  var confidenceScore = Math.min(100, Math.round(rawScore + elementBonus));

  // Step 5: 訊號強度標籤
  var ratio = agreements / readings.length;
  var signalStrength, signalDesc;
  if (ratio >= 0.8) {
    signalStrength = '三星連線';
    signalDesc = '多套獨立系統不約而同指向同一個答案，這個訊號值得認真看。';
  } else if (ratio >= 0.6) {
    signalStrength = '多數共識';
    signalDesc = '大部分系統指向同一個方向，少數持不同意見。方向大致明確。';
  } else if (ratio >= 0.4) {
    signalStrength = '方向浮現';
    signalDesc = '幾套系統開始浮現共同主題，但還沒有壓倒性的共識。';
  } else {
    signalStrength = '分歧訊號';
    signalDesc = '各系統各說各話。這不代表沒有答案，而是情況比較複雜，需要從多角度思考。';
  }

  return {
    totalSystems: readings.length,
    agreements: agreements,
    dominantTheme: dominantTheme,
    dominantThemeCN: THEME_CN[dominantTheme] || dominantTheme,
    dominantElement: dominantElement,
    dominantElementCN: ELEMENT_CN[dominantElement] || dominantElement,
    elementVotes: elementVotes,
    themeVotes: themeVotes,
    confidenceScore: confidenceScore,
    signalStrength: signalStrength,
    signalDesc: signalDesc,
    agreementText: agreements + '/' + readings.length + ' 系統交叉驗證',
    supportingSystems: supporting,
    conflictingSystems: conflicting,
    oil: ELEMENT_OIL[dominantElement] || null
  };
}

// ═══ 生成交叉驗證 HTML 顯示區塊 ═══
function renderHTML(result, readings) {
  if (!result || result.totalSystems === 0) return '';

  var stars = result.signalStrength === '三星連線' ? '⭐⭐⭐' :
              result.signalStrength === '多數共識' ? '⭐⭐' :
              result.signalStrength === '方向浮現' ? '⭐' : '';

  var html = '<div class="hl-cross-result" style="background:rgba(184,146,42,.06);border:1px solid rgba(184,146,42,.2);border-radius:16px;padding:24px 20px;margin:20px 0">';
  html += '<div style="font-size:.88rem;letter-spacing:2px;color:#8b6914;margin-bottom:12px">🔮 交叉驗證結果：' + result.agreementText + '</div>';
  html += '<div style="font-size:1.1rem;font-weight:500;color:#2a1f0e;margin-bottom:4px">' + result.signalStrength + ' ' + stars + '</div>';
  html += '<div style="font-size:.88rem;color:#5a4a30;margin-bottom:16px;line-height:1.7">' + result.signalDesc + '</div>';

  // 逐條列出
  if (readings && readings.length > 0) {
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    for (var i = 0; i < readings.length; i++) {
      var r = readings[i];
      var isAgree = result.supportingSystems.indexOf(r.system) >= 0;
      var icon = isAgree ? '✓' : '✗';
      var color = isAgree ? '#1a8a4a' : '#c04040';
      var elCN = ELEMENT_CN[r.element] || r.element;
      html += '<div style="display:flex;align-items:center;gap:8px;font-size:.85rem">';
      html += '<span style="color:' + color + ';font-weight:600;min-width:16px">' + icon + '</span>';
      html += '<span style="color:#2a1f0e">' + r.system + '</span>';
      html += '<span style="color:#8b7a60">→ ' + elCN + '</span>';
      if (!isAgree) html += '<span style="color:#c04040;font-size:.78rem">（分歧）</span>';
      html += '</div>';
    }
    html += '</div>';
  }

  // 主導元素精油建議
  if (result.oil) {
    html += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(184,146,42,.12)">';
    html += '<div style="font-size:.85rem;color:#8b6914;margin-bottom:6px">🌿 認知芳療建議（' + result.dominantElementCN + '）</div>';
    html += '<div style="font-size:.88rem;color:#5a4a30;line-height:1.7">' + result.oil.sceneHint + '</div>';
    html += '<div style="font-size:.82rem;color:#8b7a60;margin-top:4px">' + result.oil.primary.join('、') + '｜' + result.oil.keyword + '</div>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// ═══ 工具函數 ═══
function _maxKey(obj) {
  var maxK = null, maxV = -1;
  for (var k in obj) {
    if (obj.hasOwnProperty(k) && obj[k] > maxV) { maxV = obj[k]; maxK = k; }
  }
  return maxK;
}

function reduceDigit(n) {
  n = Math.abs(Math.floor(n));
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    var s = 0; var str = String(n);
    for (var i = 0; i < str.length; i++) s += parseInt(str[i]);
    n = s;
  }
  return n;
}

function reduceDigitPure(n) {
  n = Math.abs(Math.floor(n));
  while (n > 9) {
    var s = 0; var str = String(n);
    for (var i = 0; i < str.length; i++) s += parseInt(str[i]);
    n = s;
  }
  return n;
}

// ═══ 公開 API ═══
window.HLCross = {
  validate: validate,
  renderHTML: renderHTML,
  getRelation: getRelation,
  ELEMENTS: ELEMENTS,
  ELEMENT_CN: ELEMENT_CN,
  ELEMENT_OIL: ELEMENT_OIL,
  STEM_ELEMENT: STEM_ELEMENT,
  NUMBER_ELEMENT: NUMBER_ELEMENT,
  NUMBER_OIL: NUMBER_OIL,
  TERM_ELEMENT: TERM_ELEMENT,
  TRIGRAM_ELEMENT: TRIGRAM_ELEMENT,
  THEME_CN: THEME_CN,
  GENERATE: GENERATE,
  OVERCOME: OVERCOME,
  rd: reduceDigit,
  rdp: reduceDigitPure
};

})();
