// ============================================
// 人類圖計算引擎 v2.0（正確 Rave Mandala）
// 馥靈之鑰 Hour Light
// ============================================
const ephem = require('ephemeris');

// === 正確的 Gate-黃道度數對照表 ===
// 來源：多個官方HD認證網站交叉驗證
// 格式：[起始黃道經度, Gate號碼]
// 每個Gate佔5°37'30" = 5.625°
const GATE_TABLE = [
  [358.25, 25],  // 358°15' Pisces → 3°52'30" Aries
  [3.875, 17],   // 3°52'30" → 9°30'00" Aries
  [9.5, 21],     // 9°30'00" → 15°07'30" Aries
  [15.125, 51],  // 15°07'30" → 20°45'00" Aries
  [20.75, 42],   // 20°45'00" → 26°22'30" Aries
  [26.375, 3],   // 26°22'30" Aries → 2°00'00" Taurus
  [32.0, 27],    // 2°00' → 7°37'30" Taurus
  [37.625, 24],  // 7°37'30" → 13°15'00" Taurus
  [43.25, 2],    // 13°15' → 18°52'30" Taurus
  [48.875, 23],  // 18°52'30" → 24°30'00" Taurus
  [54.5, 8],     // 24°30' Taurus → 0°07'30" Gemini
  [60.125, 20],  // 0°07'30" → 5°45'00" Gemini
  [65.75, 16],   // 5°45' → 11°22'30" Gemini
  [71.375, 35],  // 11°22'30" → 17°00'00" Gemini
  [77.0, 45],    // 17°00' → 22°37'30" Gemini
  [82.625, 12],  // 22°37'30" → 28°15'00" Gemini
  [88.25, 15],   // 28°15' Gemini → 3°52'30" Cancer
  [93.875, 52],  // 3°52'30" → 9°30'00" Cancer
  [99.5, 39],    // 9°30' → 15°07'30" Cancer
  [105.125, 53], // 15°07'30" → 20°45'00" Cancer
  [110.75, 62],  // 20°45' → 26°22'30" Cancer
  [116.375, 56], // 26°22'30" Cancer → 2°00'00" Leo
  [122.0, 31],   // 2°00' → 7°37'30" Leo
  [127.625, 33], // 7°37'30" → 13°15'00" Leo
  [133.25, 7],   // 13°15' → 18°52'30" Leo
  [138.875, 4],  // 18°52'30" → 24°30'00" Leo
  [144.5, 29],   // 24°30' Leo → 0°07'30" Virgo
  [150.125, 59], // 0°07'30" → 5°45'00" Virgo
  [155.75, 40],  // 5°45' → 11°22'30" Virgo
  [161.375, 64], // 11°22'30" → 17°00'00" Virgo
  [167.0, 47],   // 17°00' → 22°37'30" Virgo
  [172.625, 6],  // 22°37'30" → 28°15'00" Virgo
  [178.25, 46],  // 28°15' Virgo → 3°52'30" Libra
  [183.875, 18], // 3°52'30" → 9°30'00" Libra
  [189.5, 48],   // 9°30' → 15°07'30" Libra
  [195.125, 57], // 15°07'30" → 20°45'00" Libra
  [200.75, 32],  // 20°45' → 26°22'30" Libra
  [206.375, 50], // 26°22'30" Libra → 2°00'00" Scorpio
  [212.0, 28],   // 2°00' → 7°37'30" Scorpio
  [217.625, 44], // 7°37'30" → 13°15'00" Scorpio
  [223.25, 1],   // 13°15' → 18°52'30" Scorpio
  [228.875, 43], // 18°52'30" → 24°30'00" Scorpio
  [234.5, 14],   // 24°30' Scorpio → 0°07'30" Sagittarius
  [240.125, 34], // 0°07'30" → 5°45'00" Sagittarius
  [245.75, 9],   // 5°45' → 11°22'30" Sagittarius
  [251.375, 5],  // 11°22'30" → 17°00'00" Sagittarius
  [257.0, 26],   // 17°00' → 22°37'30" Sagittarius
  [262.625, 11], // 22°37'30" → 28°15'00" Sagittarius
  [268.25, 10],  // 28°15' Sagittarius → 3°52'30" Capricorn
  [273.875, 58], // 3°52'30" → 9°30'00" Capricorn
  [279.5, 38],   // 9°30' → 15°07'30" Capricorn
  [285.125, 54], // 15°07'30" → 20°45'00" Capricorn
  [290.75, 61],  // 20°45' → 26°22'30" Capricorn
  [296.375, 60], // 26°22'30" Capricorn → 2°00'00" Aquarius
  [302.0, 41],   // 2°00' → 7°37'30" Aquarius
  [307.625, 19], // 7°37'30" → 13°15'00" Aquarius
  [313.25, 13],  // 13°15' → 18°52'30" Aquarius
  [318.875, 49], // 18°52'30" → 24°30'00" Aquarius
  [324.5, 30],   // 24°30' Aquarius → 0°07'30" Pisces
  [330.125, 55], // 0°07'30" → 5°45'00" Pisces
  [335.75, 37],  // 5°45' → 11°22'30" Pisces
  [341.375, 63], // 11°22'30" → 17°00'00" Pisces
  [347.0, 22],   // 17°00' → 22°37'30" Pisces
  [352.625, 36], // 22°37'30" → 28°15'00" Pisces
];
// Gate 25 wraps: 358°15' → 3°52'30"

function getGateLine(eclipticLon) {
  const lon = ((eclipticLon % 360) + 360) % 360;
  let gate = 25; // default (wraps around)
  for (let i = GATE_TABLE.length - 1; i >= 0; i--) {
    if (lon >= GATE_TABLE[i][0]) {
      gate = GATE_TABLE[i][1];
      // 計算Line
      const startDeg = GATE_TABLE[i][0];
      const posInGate = lon - startDeg;
      const line = Math.min(Math.floor(posInGate / 0.9375) + 1, 6);
      return { gate, line, eclipticLon: lon };
    }
  }
  // lon < 3.875 → Gate 25 (wraps)
  const posInGate = lon - 358.25 + 360;
  const line = Math.min(Math.floor(((posInGate % 360)) / 0.9375) + 1, 6);
  return { gate: 25, line, eclipticLon: lon };
}

// === Gate → 能量中心 對照表 ===
const GATE_CENTER = {
  64:'頭頂', 61:'頭頂', 63:'頭頂',
  47:'阿賈那', 24:'阿賈那', 4:'阿賈那', 17:'阿賈那', 43:'阿賈那', 11:'阿賈那',
  62:'喉嚨', 23:'喉嚨', 56:'喉嚨', 35:'喉嚨', 12:'喉嚨', 45:'喉嚨', 33:'喉嚨', 8:'喉嚨', 31:'喉嚨', 20:'喉嚨', 16:'喉嚨',
  7:'G中心', 1:'G中心', 13:'G中心', 25:'G中心', 46:'G中心', 2:'G中心', 15:'G中心', 10:'G中心',
  21:'意志力', 40:'意志力', 26:'意志力', 51:'意志力',
  36:'情緒', 22:'情緒', 37:'情緒', 6:'情緒', 49:'情緒', 55:'情緒', 30:'情緒',
  5:'薦骨', 14:'薦骨', 29:'薦骨', 59:'薦骨', 9:'薦骨', 3:'薦骨', 42:'薦骨', 27:'薦骨', 34:'薦骨',
  48:'脾', 57:'脾', 44:'脾', 50:'脾', 32:'脾', 28:'脾', 18:'脾',
  58:'根部', 38:'根部', 54:'根部', 53:'根部', 60:'根部', 52:'根部', 19:'根部', 39:'根部', 41:'根部'
};

// === 通道列表（36條）===
const CHANNEL_LIST = [
  [1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],
  [10,20],[10,34],[10,57],[11,56],[12,22],[13,33],[16,48],
  [17,62],[18,58],[19,49],[20,34],[20,57],[21,45],[23,43],
  [24,61],[25,51],[26,44],[27,50],[28,38],[29,46],[30,41],
  [32,54],[34,57],[35,36],[37,40],[39,55],[42,53],[47,64]
];

// === 設計水晶：出生前太陽回退88° ===
function calcDesignDate(birthDate, sunLon, lon, lat) {
  const approxDays = 88 / 0.9856;
  const msPerDay = 86400000;
  let designDate = new Date(birthDate.getTime() - approxDays * msPerDay);
  const targetLon = ((sunLon - 88) % 360 + 360) % 360;
  
  for (let iter = 0; iter < 30; iter++) {
    const r = ephem.getAllPlanets(designDate, lon, lat, 0);
    const curLon = r.observed.sun.apparentLongitudeDd;
    let diff = targetLon - curLon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 0.001) break;
    designDate = new Date(designDate.getTime() + (diff / 0.9856) * msPerDay);
  }
  return designDate;
}

// === 類型判定（BFS路徑搜索）===
function determineType(definedCenters, definedChannels) {
  const hasSacral = definedCenters.has('薦骨');
  const motorCenters = new Set(['薦骨','情緒','意志力','根部']);
  
  if (definedCenters.size === 0) return '反映者';
  
  // BFS: 從每個motor中心找是否能到喉嚨
  function canReachThroat(startCenter) {
    const visited = new Set([startCenter]);
    const queue = [startCenter];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur === '喉嚨') return true;
      for (const [g1, g2] of definedChannels) {
        const c1 = GATE_CENTER[g1], c2 = GATE_CENTER[g2];
        if (c1 === cur && !visited.has(c2)) { visited.add(c2); queue.push(c2); }
        if (c2 === cur && !visited.has(c1)) { visited.add(c1); queue.push(c1); }
      }
    }
    return false;
  }
  
  const anyMotorToThroat = [...definedCenters].some(c => motorCenters.has(c) && canReachThroat(c));
  
  if (!hasSacral && !anyMotorToThroat) return '投射者';
  if (!hasSacral && anyMotorToThroat) return '顯示者';
  if (hasSacral && canReachThroat('薦骨')) return '顯示生產者';
  if (hasSacral) return '生產者';
  return '投射者';
}

// === 定義類型（連通分量分析）===
function getDefinition(definedCenters, definedChannels) {
  if (definedCenters.size === 0) return '無定義';
  
  // 建立鄰接表
  const adj = {};
  for (const c of definedCenters) adj[c] = new Set();
  for (const [g1, g2] of definedChannels) {
    const c1 = GATE_CENTER[g1], c2 = GATE_CENTER[g2];
    if (adj[c1]) adj[c1].add(c2);
    if (adj[c2]) adj[c2].add(c1);
  }
  
  // BFS找連通分量
  const visited = new Set();
  let components = 0;
  for (const c of definedCenters) {
    if (!visited.has(c)) {
      components++;
      const queue = [c];
      visited.add(c);
      while (queue.length > 0) {
        const cur = queue.shift();
        for (const nb of (adj[cur] || [])) {
          if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
        }
      }
    }
  }
  
  return ['','單一定義','二分人','三分人','四分人'][components] || components + '分人';
}

// === 內在權威 ===
function determineAuthority(definedCenters, type) {
  if (definedCenters.has('情緒')) return '情緒權威';
  if (definedCenters.has('薦骨') && type !== '顯示者') return '薦骨權威';
  if (definedCenters.has('脾')) return '直覺（脾）權威';
  if (definedCenters.has('意志力')) return '意志力（自我顯現）權威';
  if (definedCenters.has('G中心')) return 'G中心（自我投射）權威';
  if (definedCenters.has('阿賈那')) return '環境（心智投射）權威';
  return '月循環（無內在權威）';
}

// === 完整計算 ===
function calculateHD(year, month, day, hour, minute, lon, lat) {
  const birthUTC = new Date(Date.UTC(year, month-1, day, hour-8, minute, 0));
  
  const PLANETS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const ZH = ['太陽','地球','月亮','北交點','南交點','水星','金星','火星','木星','土星','天王星','海王星','冥王星'];
  
  // 北交點計算（Mean Node）
  function calcNorthNode(dateObj) {
    const jd = 2440587.5 + dateObj.getTime() / 86400000;
    const T = (jd - 2451545.0) / 36525.0;
    // Mean ascending node of the Moon
    let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T*T + T*T*T / 450000;
    return ((omega % 360) + 360) % 360;
  }
  
  // 個性水晶
  const pR = ephem.getAllPlanets(birthUTC, lon, lat, 0);
  const pGates = {};
  for (let i = 0; i < PLANETS.length; i++) {
    const l = pR.observed[PLANETS[i]].apparentLongitudeDd;
    pGates[PLANETS[i]] = getGateLine(l);
  }
  // Earth = Sun + 180°
  pGates['earth'] = getGateLine((pR.observed.sun.apparentLongitudeDd + 180) % 360);
  // North Node & South Node
  const pNorthNode = calcNorthNode(birthUTC);
  pGates['northnode'] = getGateLine(pNorthNode);
  pGates['southnode'] = getGateLine((pNorthNode + 180) % 360);
  
  // 設計水晶
  const birthSunLon = pR.observed.sun.apparentLongitudeDd;
  const designDate = calcDesignDate(birthUTC, birthSunLon, lon, lat);
  const dR = ephem.getAllPlanets(designDate, lon, lat, 0);
  const dGates = {};
  for (let i = 0; i < PLANETS.length; i++) {
    const l = dR.observed[PLANETS[i]].apparentLongitudeDd;
    dGates[PLANETS[i]] = getGateLine(l);
  }
  dGates['earth'] = getGateLine((dR.observed.sun.apparentLongitudeDd + 180) % 360);
  const dNorthNode = calcNorthNode(designDate);
  dGates['northnode'] = getGateLine(dNorthNode);
  dGates['southnode'] = getGateLine((dNorthNode + 180) % 360);
  
  // Profile = 個性太陽Line / 設計太陽Line
  const profile = pGates['sun'].line + '/' + dGates['sun'].line;
  
  // 所有被啟動的Gate
  const activeGates = new Set();
  const allPKeys = [...PLANETS, 'earth', 'northnode', 'southnode'];
  for (const k of allPKeys) {
    if (pGates[k]) activeGates.add(pGates[k].gate);
    if (dGates[k]) activeGates.add(dGates[k].gate);
  }
  
  // 定義通道
  const definedChannels = CHANNEL_LIST.filter(([g1,g2]) => activeGates.has(g1) && activeGates.has(g2));
  
  // 定義中心
  const definedCenters = new Set();
  for (const [g1,g2] of definedChannels) {
    definedCenters.add(GATE_CENTER[g1]);
    definedCenters.add(GATE_CENTER[g2]);
  }
  
  const type = determineType(definedCenters, definedChannels);
  const authority = determineAuthority(definedCenters, type);
  const definition = getDefinition(definedCenters, definedChannels);
  
  const STRATEGY = {'顯示者':'告知','生產者':'等待回應','顯示生產者':'等待回應','投射者':'等待邀請','反映者':'等待月循環'};
  const NOT_SELF = {'顯示者':'憤怒','生產者':'挫敗感','顯示生產者':'挫敗感','投射者':'苦澀','反映者':'失望'};
  
  // 輪迴交叉
  const pSunGate = pGates['sun'].gate;
  const pEarthGate = pGates['earth'].gate;
  const dSunGate = dGates['sun'].gate;
  const dEarthGate = dGates['earth'].gate;
  const pLine = pGates['sun'].line;
  let angleType = '並列';
  if (pLine <= 3) angleType = '右角度';
  else if (pLine >= 5) angleType = '左角度';
  
  return {
    type, authority, profile, definition,
    strategy: STRATEGY[type],
    notSelf: NOT_SELF[type],
    cross: { pSun: pSunGate, pEarth: pEarthGate, dSun: dSunGate, dEarth: dEarthGate, angleType },
    personalityGates: pGates,
    designGates: dGates,
    definedChannels,
    definedCenters: [...definedCenters],
    activeGates: [...activeGates].sort((a,b)=>a-b),
    designDate
  };
}

// ============================================
// 驗證
// ============================================
console.log('='.repeat(60));
console.log('驗證：王逸君 1976/02/05 19:47 桃園');
console.log('正確：顯示生產者、3/5、薦骨權威、二分人');
console.log('通道：5-15、14-2、42-53、34-20');
console.log('輪迴交叉：13/7 | 1/2（右角度，人面獅身）');
console.log('='.repeat(60));

const yj = calculateHD(1976, 2, 5, 19, 47, 121.3, 25.0);
console.log(`類型：${yj.type} → ${yj.type === '顯示生產者' ? '✅' : '❌'}`);
console.log(`角色：${yj.profile} → ${yj.profile === '3/5' ? '✅' : '❌'}`);
console.log(`權威：${yj.authority} → ${yj.authority === '薦骨權威' ? '✅' : '❌'}`);
console.log(`定義：${yj.definition} → ${yj.definition === '二分人' ? '✅' : '❌'}`);
console.log(`策略：${yj.strategy}`);
console.log(`非自己：${yj.notSelf}`);
console.log(`輪迴交叉：${yj.cross.pSun}/${yj.cross.pEarth} | ${yj.cross.dSun}/${yj.cross.dEarth}（${yj.cross.angleType}）`);
console.log(`  → 個性太陽13、地球7 → ${yj.cross.pSun===13 && yj.cross.pEarth===7 ? '✅' : '❌'}`);

console.log('');
console.log('已定義通道：');
yj.definedChannels.forEach(ch => console.log(`  ${ch[0]}-${ch[1]}`));
const expectedCh = [[5,15],[2,14],[42,53],[20,34]];
const chSet = new Set(yj.definedChannels.map(c => c.sort((a,b)=>a-b).join('-')));
console.log(`  5-15 → ${chSet.has('5-15') ? '✅' : '❌'}`);
console.log(`  2-14 → ${chSet.has('2-14') ? '✅' : '❌'}`);
console.log(`  42-53 → ${chSet.has('42-53') ? '✅' : '❌'}`);
console.log(`  20-34 → ${chSet.has('20-34') ? '✅' : '❌'}`);

console.log('');
console.log('已定義中心：', yj.definedCenters.join(', '));
console.log('所有啟動Gate：', yj.activeGates.join(', '));

console.log('');
console.log('--- 個性水晶（黑色）---');
const pKeys = ['sun','earth','northnode','southnode','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
const pNames = ['太陽','地球','北交點','南交點','月亮','水星','金星','火星','木星','土星','天王星','海王星','冥王星'];
for (let i = 0; i < pKeys.length; i++) {
  const g = yj.personalityGates[pKeys[i]];
  if (g) console.log(`  ${pNames[i]}: Gate ${g.gate}.${g.line}`);
}

console.log('');
console.log('--- 設計水晶（紅色）---');
for (let i = 0; i < pKeys.length; i++) {
  const g = yj.designGates[pKeys[i]];
  if (g) console.log(`  ${pNames[i]}: Gate ${g.gate}.${g.line}`);
}
