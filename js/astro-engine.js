// ============================================
// 西洋占星計算引擎 v1.0
// 使用 Moshier Ephemeris（精度 < 1角秒）
// 馥靈之鑰 Hour Light
// ============================================

const ephemeris = require('ephemeris');

const ZODIAC_SIGNS = ['牡羊座','金牛座','雙子座','巨蟹座','獅子座','處女座','天秤座','天蠍座','射手座','魔羯座','水瓶座','雙魚座'];
const ZODIAC_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ELEMENTS = ['火','土','風','水','火','土','風','水','火','土','風','水'];
const MODALITIES = ['開創','固定','變動','開創','固定','變動','開創','固定','變動','開創','固定','變動'];
const POLARITIES = ['陽','陰','陽','陰','陽','陰','陽','陰','陽','陰','陽','陰'];

function degToSign(deg) {
  const normalDeg = ((deg % 360) + 360) % 360;
  const signIdx = Math.floor(normalDeg / 30);
  const signDeg = Math.floor(normalDeg % 30);
  const signMin = Math.floor((normalDeg % 1) * 60);
  return {
    signIndex: signIdx,
    sign: ZODIAC_SIGNS[signIdx],
    signEN: ZODIAC_EN[signIdx],
    degree: signDeg,
    minute: signMin,
    totalDeg: normalDeg,
    element: ELEMENTS[signIdx],
    modality: MODALITIES[signIdx],
    polarity: POLARITIES[signIdx],
    display: `${ZODIAC_SIGNS[signIdx]}${signDeg}°${String(signMin).padStart(2,'0')}'`
  };
}

function calculateAstrology(year, month, day, hour, minute, lat, lng) {
  // 轉換為儒略日（需要UT時間）
  // 台灣時間 = UTC+8
  const utHour = hour - 8 + minute / 60;
  let utDay = day;
  let utMonth = month;
  let utYear = year;
  if (utHour < 0) {
    utDay -= 1;
    // 簡化處理，不處理跨月
  }
  
  // ephemeris計算
  const result = ephemeris.getAllPlanets(utYear, utMonth, utDay, utHour < 0 ? utHour + 24 : utHour, lat, lng, 0);
  
  // 提取行星位置
  const planets = {};
  const planetMap = {
    'sun': '太陽', 'moon': '月亮', 'mercury': '水星', 'venus': '金星',
    'mars': '火星', 'jupiter': '木星', 'saturn': '土星',
    'uranus': '天王星', 'neptune': '海王星', 'pluto': '冥王星'
  };
  
  for (const [key, name] of Object.entries(planetMap)) {
    if (result.observed && result.observed[key]) {
      const p = result.observed[key];
      const lon = p.apparentLongitudeDd || p.longitudeDd || p.apparentLongitudeDms30 || 0;
      // 嘗試不同的屬性名稱
      let longitude = 0;
      if (typeof p.apparentLongitudeDd === 'number') longitude = p.apparentLongitudeDd;
      else if (typeof p.apparentLongitudeDms30 === 'string') {
        // 解析 "15 Aquarius 48'12\"" 格式
      }
      
      planets[name] = {
        ...degToSign(longitude),
        longitude: longitude,
        isRetrograde: p.isRetrograde || false
      };
    }
  }
  
  return { planets, raw: result };
}

// ============================================
// 測試
// ============================================

console.log('='.repeat(60));
console.log('測試 ephemeris 資料結構');
console.log('='.repeat(60));

// 王逸君：1976/02/05 19:47 台灣桃園 (lat 24.99, lng 121.31)
// 需要UTC時間：19:47 - 8h = 11:47 UTC
const date = new Date(Date.UTC(1976, 1, 5, 11, 47, 0)); // month is 0-indexed
const result = ephemeris.getAllPlanets(date, 121.31, 24.99, 0);

// 看看資料結構
console.log('Available keys:', Object.keys(result));
if (result.observed) {
  console.log('Observed keys:', Object.keys(result.observed));
  // 查看太陽的資料結構
  if (result.observed.sun) {
    console.log('Sun data:', JSON.stringify(result.observed.sun, null, 2));
  }
}
