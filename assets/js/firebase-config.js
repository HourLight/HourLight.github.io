/**
 * 馥靈之鑰 Firebase 設定檔
 * 專案：hourlight-key
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAbVr_CtMw1d8b1RBGuJ27tQsZFRwyzpvM",
  authDomain: "hourlight-key.firebaseapp.com",
  projectId: "hourlight-key",
  storageBucket: "hourlight-key.firebasestorage.app",
  messagingSenderId: "797772820371",
  appId: "1:797772820371:web:bc12f805bd1b2d8a124266",
  measurementId: "G-1PQYBM206R"
};

// 會員方案定義
const MEMBER_PLANS = {
  free: {
    name: "覺察旅人",
    nameEn: "Explorer",
    price: 0,
    color: "#888",
    icon: "🌱",
    features: ["免費工具無限使用", "基本牌卡解讀", "每月3次解析記錄"],
    drawLimit: 3,
    analysisLimit: 3
  },
  basic: {
    name: "覺察學員",
    nameEn: "Student",
    price: 299,
    color: "#c0a060",
    icon: "🔑",
    features: ["所有免費功能", "無限牌卡解讀", "每月30次解析記錄", "歷史足跡保存"],
    drawLimit: 999,
    analysisLimit: 30
  },
  pro: {
    name: "覺察修練者",
    nameEn: "Practitioner",
    price: 999,
    color: "#e9c27d",
    icon: "✨",
    features: ["所有學員功能", "無限解析記錄", "對話紀錄上傳", "優先客服"],
    drawLimit: 999,
    analysisLimit: 999
  },
  vip: {
    name: "馥靈夥伴",
    nameEn: "Partner",
    price: 3999,
    color: "#f0d090",
    icon: "👑",
    features: ["所有修練者功能", "每月1次1對1諮詢", "專屬能量月報", "課程折扣20%"],
    drawLimit: 999,
    analysisLimit: 999,
    consulting: 1
  },
  elite: {
    name: "馥靈傳承者",
    nameEn: "Inheritor",
    price: 9999,
    color: "#fff0c0",
    icon: "🏰",
    features: ["所有夥伴功能", "每月3次1對1諮詢", "授權導師資格", "年度靜心工作坊"],
    drawLimit: 999,
    analysisLimit: 999,
    consulting: 3
  }
};
