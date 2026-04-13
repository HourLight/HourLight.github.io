/**
 * 馥靈之鑰 Firebase 設定檔
 * 專案：hourlight-key
 */

var FIREBASE_CONFIG = {
  apiKey: "AIzaSyAbVr_CtMw1d8b1RBGuJ27tQsZFRwyzpvM",
  authDomain: "hourlight-key.firebaseapp.com",
  projectId: "hourlight-key",
  storageBucket: "hourlight-key.firebasestorage.app",
  messagingSenderId: "797772820371",
  appId: "1:797772820371:web:bc12f805bd1b2d8a124266",
  measurementId: "G-1PQYBM206R"
};

// ═══════════════════════════════════════════════════════════
//  馥靈之鑰 八層身分系統 v2.0
//  由馥靈管理員在後台統一調整各身分的工具開放權限
// ═══════════════════════════════════════════════════════════

var HL_ROLES = {

  // ── 層級 1：最高權限 ──
  admin: {
    level:   1,
    name:    '馥靈管理員',
    nameEn:  'HL Administrator',
    icon:    '⚜️',
    color:   '#fff0a0',
    badge:   'linear-gradient(135deg,#fff0a0,#f8dfa5)',
    badgeText: '#1a1008',
    desc:    '系統最高權限，可調整所有會員身分與功能開放',
    // 管理員 email 改由 Firestore 動態查詢，不在前端暴露
    // emails: → 請改用 Firestore /config/roles 集合
    canAccessAdmin: true,
    unlimitedAll:   true,
    canManageRoles: true,
    canViewAllData: true,
    canExportData:  true,
  },

  // ── 層級 2：策展總監 ──
  curator: {
    level:   2,
    name:    '馥靈策展總監',
    nameEn:  'HL Curator Director',
    icon:    '🎨',
    color:   '#e0b8ff',
    badge:   'linear-gradient(135deg,#c890f0,#9060d0)',
    badgeText: '#fff',
    desc:    '負責品牌內容策劃，可閱覽全站資料、使用所有工具、無需配額',
    canAccessAdmin: true,
    unlimitedAll:   true,
    canManageRoles: false,
    canViewAllData: true,
    canExportData:  true,
  },

  // ── 層級 3：覺察導師 ──
  mentor: {
    level:   3,
    name:    '馥靈覺察導師',
    nameEn:  'HL Awareness Mentor',
    icon:    '🌟',
    color:   '#ffd080',
    badge:   'linear-gradient(135deg,#f8dfa5,#ecd098)',
    badgeText: '#1a1008',
    desc:    '認證導師，使用所有工具不限次數，可查看學員使用記錄',
    canAccessAdmin: false,
    unlimitedAll:   true,
    canViewStudentData: true,
    canExportData:  false,
  },

  // ── 層級 4：覺察師 ──
  practitioner: {
    level:   4,
    name:    '馥靈覺察師',
    nameEn:  'HL Awareness Practitioner',
    icon:    '✦',
    color:   '#a0d8c0',
    badge:   'linear-gradient(135deg,#60c0a0,#3a9080)',
    badgeText: '#fff',
    desc:    '進階使用者，所有工具不限次數，覺察記錄長期保存',
    unlimitedAll: true,
  },

  // ── 層級 5：高階會員 ──
  premium: {
    level:   5,
    name:    '馥靈高階會員',
    nameEn:  'HL Premium Member',
    icon:    '💎',
    color:   '#90c8ff',
    badge:   'linear-gradient(135deg,#6090e0,#4060c0)',
    badgeText: '#fff',
    desc:    '付費高階方案，工具不限次數，解析記錄無上限',
    unlimitedAll: true,
    drawLimit: 9999,
    analysisLimit: 9999,
    price: 999,
  },

  // ── 層級 6：一般會員 ──
  member: {
    level:   6,
    name:    '馥靈會員',
    nameEn:  'HL Member',
    icon:    '🔑',
    color:   '#e8d090',
    badge:   'linear-gradient(135deg,#e8d090,#d8be80)',
    badgeText: '#fff',
    desc:    '標準付費方案，每月 30 次完整牌陣，解析記錄 30 筆',
    drawLimit: 30,
    analysisLimit: 30,
    price: 299,
  },

  // ── 層級 7：免費訪客 ──
  guest: {
    level:   7,
    name:    '馥靈訪客',
    nameEn:  'HL Guest',
    icon:    '🌱',
    color:   '#888',
    badge:   'linear-gradient(135deg,#555,#333)',
    badgeText: '#ccc',
    desc:    '免費帳號，每月 3 次完整牌陣，基本功能可用',
    drawLimit: 3,
    analysisLimit: 3,
    price: 0,
  },

  // ── 層級 8：眷屬（特殊身分）──
  // ── 層級 8：特殊貴賓（媲美策展總監，無後台管理權）──
  vip_guest: {
    level:     2,  // 同策展總監等級，所有工具暢行無阻
    name:      '馥靈特殊貴賓',
    nameEn:    'HL VIP Guest',
    icon:      '🌸',
    color:     '#ffb0c8',
    badge:     'linear-gradient(135deg,#f080a0,#c06080)',
    badgeText: '#fff',
    desc:      '特殊貴賓身分（逸君的家人與特別指定者），享有與策展總監同等的工具使用權，所有頁面暢行無阻',
    // 貴賓 email 改由 Firestore 動態查詢，不在前端暴露
    // emails: → 請改用 Firestore /config/roles 集合
    canAccessAdmin: false,
    unlimitedAll:   true,
    canManageRoles: false,
    canViewAllData: false,
    canExportData:  false,
    isVipGuest:     true,
    drawLimit:      9999,
    analysisLimit:  9999,
  },
};

// ─────────────────────────────────────────────────────────────
//  所有可控制的工具功能（管理員可逐一開關每個身分的存取）
// ─────────────────────────────────────────────────────────────
var HL_TOOL_PERMISSIONS = {
  // 抽牌工具
  'draw-hl':              { name: '馥靈牌陣抽牌',    type: 'draw',       en: 'HL Card Spread',   freeAccess: true  },
  'draw-light':           { name: '馥靈單牌抽牌',    type: 'draw',       en: 'Single Draw',       freeAccess: true  },
  'draw-spa':             { name: 'SPA 抽牌',         type: 'draw',       en: 'SPA Draw',           freeAccess: false },
  'draw-nail':             { name: '指尖能量覺察',     type: 'draw',       en: 'Nail Reading',       freeAccess: true },
  'pet-reading':           { name: '寵物溝通',         type: 'draw',       en: 'Pet Reading',        freeAccess: false },
  'draw-family':           { name: '家族星圖',         type: 'draw',       en: 'Family Reading',     freeAccess: false },
  'family-reading':        { name: '家族覺察',         type: 'draw',       en: 'Family Free',        freeAccess: false },
  'tarot-draw':           { name: '塔羅抽牌',         type: 'draw',       en: 'Tarot Draw',         freeAccess: false },
  'tarot':                { name: '塔羅牌庫',         type: 'explore',    en: 'Tarot Library',      freeAccess: false },
  // 計算工具
  'fuling-mima':          { name: '馥靈秘碼',         type: 'calculator', en: 'Blueprint Code',     freeAccess: true  },
  'destiny-engine':       { name: '命盤運算引擎',    type: 'calculator', en: 'Destiny Engine',     freeAccess: true  },
  'maslow-frequency':     { name: '馬斯洛節律',       type: 'calculator', en: 'Maslow Freq',        freeAccess: false },
  'lifepath-calculator':  { name: '生命路徑計算',    type: 'calculator', en: 'Life Path',           freeAccess: false },
  'numerology-calculator':{ name: '生命靈數計算',    type: 'calculator', en: 'Numerology',          freeAccess: false },
  'rainbow-calculator':   { name: '彩虹數字計算',    type: 'calculator', en: 'Rainbow',             freeAccess: false },
  'maya-calculator':      { name: '瑪雅曆法計算',    type: 'calculator', en: 'Maya',                freeAccess: false },
  'digital-energy-analyzer':{ name: '數位能量分析',  type: 'calculator', en: 'Digital Energy',      freeAccess: false },
  'scent-navigator':      { name: '香氣導航',         type: 'explore',    en: 'Scent Nav',           freeAccess: false },
  'quantum-numerology':   { name: '量子數字學',       type: 'calculator', en: 'Quantum Num',         freeAccess: false },
  // 測驗工具（全部免費開放，引流用）
  'quiz-mbti':            { name: 'MBTI 測驗',         type: 'quiz',       en: 'MBTI',                freeAccess: true  },
  'quiz-disc':            { name: 'DISC 測驗',         type: 'quiz',       en: 'DISC',                freeAccess: true  },
  'quiz-bigfive':         { name: '大五人格測驗',    type: 'quiz',       en: 'Big Five',            freeAccess: true  },
  'quiz-enneagram':       { name: '九型人格測驗',    type: 'quiz',       en: 'Enneagram',           freeAccess: true  },
  'quiz-bloodtype':       { name: '血型測驗',         type: 'quiz',       en: 'Blood Type',          freeAccess: true  },
  // 高階專屬工具（馥靈輕盈系列）
  'abundance':            { name: '馥靈輕盈系統',    type: 'premium',    en: 'Abundance System',    freeAccess: false },
};

// ─────────────────────────────────────────────────────────────
//  預設權限矩陣
//  freeAccess:true  = 免費訪客可用
//  否則依等級決定
//  馥靈輕盈（abundance*）= 高階會員（Lv.5）以上才開放
// ─────────────────────────────────────────────────────────────
var HL_DEFAULT_PERMISSIONS = (function(){
  var matrix = {};
  var roles  = Object.keys(HL_ROLES);
  var tools  = Object.keys(HL_TOOL_PERMISSIONS);

  // 高階專屬工具清單
  var PREMIUM_ONLY = ['abundance'];
  // 免費引流工具清單（從 freeAccess:true 自動產生）
  var FREE_TOOLS = Object.entries(HL_TOOL_PERMISSIONS)
    .filter(function(e){ return e[1].freeAccess; })
    .map(function(e){ return e[0]; });

  roles.forEach(function(role) {
    matrix[role] = {};
    var lvl = HL_ROLES[role].level;
    tools.forEach(function(tool) {

      // 高階專屬：只有 premium（Lv.5）以上才開
      if (PREMIUM_ONLY.includes(tool)) {
        matrix[role][tool] = (lvl <= 5);
        return;
      }

      // unlimitedAll 或等級 ≤ 5（含特殊貴賓 Lv.2）：全開
      if (HL_ROLES[role].unlimitedAll || lvl <= 5) {
        matrix[role][tool] = true;
        return;
      }

      // member（Lv.6）：不開量子數字學，其餘開
      if (role === 'member') {
        matrix[role][tool] = !['quantum-numerology'].includes(tool);
        return;
      }

      // guest（Lv.7）：只開 freeAccess 工具
      if (role === 'guest') {
        matrix[role][tool] = FREE_TOOLS.includes(tool);
        return;
      }

      matrix[role][tool] = false;
    });
  });
  return matrix;
})();

// 向後相容：保留 MEMBER_PLANS 給舊的 dashboard 使用
// 新代碼請改用 HL_ROLES
var MEMBER_PLANS = {
  free: {
    name: "馥靈訪客",
    nameEn: "Guest",
    price: 0,
    color: "#888888",
    icon: "🌱",
    features: ["9 個核心免費工具", "牌卡抽牌不限次", "馥靈秘碼每月 3 次", "基礎命理計算"],
    drawLimit: 3,
    analysisLimit: 3
  },
  basic: {
    name: "馥靈會員",
    nameEn: "Member",
    price: 299,
    color: "#c8a252",
    icon: "🔑",
    features: ["全站工具無限使用", "每月 30 次完整解析", "歷史足跡紀錄", "生日月可加購限定禮"],
    drawLimit: 9999,
    analysisLimit: 30
  },
  pro: {
    name: "馥靈高階會員",
    nameEn: "Premium",
    price: 999,
    color: "#f8dfa5",
    icon: "💎",
    features: ["一切會員功能", "無限次完整解析", "馥靈輕盈系列專屬", "生日月加購限定禮", "未來 AI 解讀優先體驗"],
    drawLimit: 9999,
    analysisLimit: 9999
  }
};

/**
 * 會員到期自動降級
 * 每次頁面載入時檢查 planExpiry，過期就自動降回 free
 * v2：到期前先檢查 prevPlan，若有未到期的原方案就還原（避免試用蓋掉付費方案）
 */
(function(){
  if(typeof firebase==='undefined') return;
  function checkExpiry(){
    try{
      if(!firebase.apps||!firebase.apps.length) return;
      firebase.auth().onAuthStateChanged(function(user){
        if(!user) return;
        var db=firebase.firestore();
        db.doc('users/'+user.uid).get().then(function(doc){
          if(!doc.exists) return;
          var d=doc.data();
          if(!d.plan||d.plan==='free') return;
          if(!d.planExpiry) return;
          if(d.planExpiry==='permanent') return;
          var expiry=d.planExpiry;
          if(expiry.toDate) expiry=expiry.toDate();
          else if(typeof expiry==='string') expiry=new Date(expiry);
          if(!(expiry instanceof Date)||isNaN(expiry)) return;
          if(new Date()>expiry){
            // ─── 先檢查是否有未到期的原方案可以還原（小花事件 patch）───
            if(d.prevPlan && d.prevPlan!=='free' && d.prevPlanExpiry){
              var prevValid=false;
              if(d.prevPlanExpiry==='permanent'){
                prevValid=true;
              }else{
                var prevExp=d.prevPlanExpiry;
                if(prevExp.toDate) prevExp=prevExp.toDate();
                else if(typeof prevExp==='string') prevExp=new Date(prevExp);
                if(prevExp instanceof Date && !isNaN(prevExp) && prevExp>new Date()){
                  prevValid=true;
                }
              }
              if(prevValid){
                db.doc('users/'+user.uid).update({
                  plan:d.prevPlan,
                  planExpiry:d.prevPlanExpiry,
                  prevPlan:firebase.firestore.FieldValue.delete(),
                  prevPlanExpiry:firebase.firestore.FieldValue.delete(),
                  prevPlanSavedAt:firebase.firestore.FieldValue.delete(),
                  isTrial:firebase.firestore.FieldValue.delete(),
                  planRestoredAt:firebase.firestore.FieldValue.serverTimestamp(),
                  planRestoredFrom:d.plan
                }).catch(function(){});
                return;
              }
            }
            // 沒有原方案可還原 → 降回 free
            db.doc('users/'+user.uid).update({
              plan:'free',
              planExpiredAt:firebase.firestore.FieldValue.serverTimestamp(),
              planExpiredFrom:d.plan,
              isTrial:firebase.firestore.FieldValue.delete()
            }).catch(function(){});
          }
        }).catch(function(){});
      });
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(checkExpiry,2000);});
  else setTimeout(checkExpiry,2000);
})();

// ═══════════════════════════════════════════════════════════
//  Firestore 集合存取函數 (修復 castle-game.html 錯誤)
// ═══════════════════════════════════════════════════════════

/**
 * 取得 Firestore 集合的便利函數
 * 修復 castle-game.html 中 "getFirestoreCollections is not defined" 錯誤
 */
function getFirestoreCollections() {
  try {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
      console.warn('Firebase 尚未初始化');
      return null;
    }

    var db = firebase.firestore();
    return {
      users: db.collection('users'),
      castleData: db.collection('castleData'),
      rooms: db.collection('rooms'),
      events: db.collection('events'),
      readings: db.collection('readings')
    };
  } catch (error) {
    console.error('getFirestoreCollections 錯誤:', error);
    return null;
  }
}
