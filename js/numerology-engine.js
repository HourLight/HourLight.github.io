// ============================================
// 生命靈數計算引擎 v1.0
// 馥靈之鑰 Hour Light
// ============================================

// 化簡函式（保留大師數 11/22/33）
function reduce(n, keepMaster = true) {
  while (n > 9) {
    if (keepMaster && (n === 11 || n === 22 || n === 33)) return n;
    n = String(n).split('').reduce((s, d) => s + parseInt(d), 0);
  }
  return n;
}

// 純化簡（不保留大師數）
function reduceSimple(n) {
  return reduce(n, false);
}

// 數字拆解加總
function digitSum(n) {
  return String(n).split('').reduce((s, d) => s + parseInt(d), 0);
}

function calculateLifeNumbers(year, month, day) {
  // 年份數
  const yearSum = digitSum(year);
  const yearNum = reduce(yearSum);
  
  // 月份數
  const monthNum = reduce(month);
  
  // 日期數
  const dayNum = reduce(day);
  
  // 天賦數（日期原始數字）
  const talentNum = day;
  
  // 生命路徑數
  const lifePathRaw = reduce(year) + reduce(month) + reduce(day);
  // 注意：標準算法是年月日各自先化簡再加總
  // 但也有流派是全部數字直接加。這裡用逐步化簡法
  const lifePath = reduce(lifePathRaw);
  
  // 先天數排列
  const allDigits = String(year) + String(month).padStart(2, '0') + String(day).padStart(2, '0');
  const sortedDigits = allDigits.split('').sort().join('');
  
  // 空缺數字
  const presentDigits = new Set(allDigits.split('').map(Number));
  const missingDigits = [];
  for (let i = 1; i <= 9; i++) {
    if (!presentDigits.has(i)) missingDigits.push(i);
  }
  
  // 後天數（全部數字逐位加總化簡）
  const allSum = allDigits.split('').reduce((s, d) => s + parseInt(d), 0);
  const laterNum = reduce(allSum);
  
  // 中年數 = 月份數 + 日期數
  const midLifeNum = reduce(monthNum + dayNum);
  
  // 老年數 = 月份數 + 年份數
  const lateLifeNum = reduce(monthNum + yearNum);
  
  // 個人年（當前年份）
  const currentYear = new Date().getFullYear();
  const personalYearRaw = reduce(month) + reduce(day) + reduce(currentYear);
  const personalYear = reduce(personalYearRaw);
  
  // 生命階段
  const baseAge = 36 - lifePath;
  const stages = {
    first: { start: 0, end: baseAge, num: monthNum },
    second: { start: baseAge + 1, end: baseAge + 27, num: dayNum },
    third: { start: baseAge + 28, end: null, num: yearNum }
  };
  
  // 挑戰數
  const challenge1 = Math.abs(monthNum - dayNum);
  const challenge2 = Math.abs(dayNum - yearNum);
  const challengeMain = Math.abs(challenge1 - challenge2);
  
  // 高峰數
  const pinnacle1 = reduce(monthNum + dayNum);
  const pinnacle2 = reduce(dayNum + yearNum);
  const pinnacle3 = reduce(pinnacle1 + pinnacle2);
  const pinnacle4 = reduce(monthNum + yearNum);
  
  const pinnacles = {
    first: { start: 0, end: baseAge, num: pinnacle1 },
    second: { start: baseAge + 1, end: baseAge + 9, num: pinnacle2 },
    third: { start: baseAge + 10, end: baseAge + 18, num: pinnacle3 },
    fourth: { start: baseAge + 19, end: null, num: pinnacle4 }
  };
  
  return {
    yearNum, monthNum, dayNum, talentNum, lifePath,
    sortedDigits, missingDigits, laterNum,
    midLifeNum, lateLifeNum,
    personalYear, currentYear,
    stages, 
    challenges: { first: challenge1, second: challenge2, main: challengeMain },
    pinnacles,
    baseAge
  };
}

// ============================================
// 測試驗證
// ============================================

console.log('='.repeat(60));
console.log('驗證 1：王逸君 1976/02/05');
console.log('='.repeat(60));
const r1 = calculateLifeNumbers(1976, 2, 5);
console.log(`年份數：${r1.yearNum}（1+9+7+6=23→2+3=5）→ ${r1.yearNum === 5 ? '✅' : '❌'}`);
console.log(`月份數：${r1.monthNum} → ${r1.monthNum === 2 ? '✅' : '❌'}`);
console.log(`日期數：${r1.dayNum} → ${r1.dayNum === 5 ? '✅' : '❌'}`);
console.log(`天賦數：${r1.talentNum} → ${r1.talentNum === 5 ? '✅' : '❌'}`);
console.log(`生命數：${r1.lifePath}（5+2+5=12→3）→ ${r1.lifePath === 3 ? '✅' : '❌'}`);
console.log(`先天數：${r1.sortedDigits} → ${r1.sortedDigits === '00125679' ? '✅' : '❌'}`);
console.log(`空缺數：${r1.missingDigits.join(',')} → ${r1.missingDigits.join(',') === '3,4,8' ? '✅' : '❌'}`);

console.log('');
console.log('='.repeat(60));
console.log('驗證 2：鄭博清 1974/11/04');
console.log('='.repeat(60));
const r2 = calculateLifeNumbers(1974, 11, 4);
console.log(`年份數：${r2.yearNum}（1+9+7+4=21→3）→ ${r2.yearNum === 3 ? '✅' : '❌'}`);
console.log(`月份數：${r2.monthNum}（11保留）→ ${r2.monthNum === 11 ? '✅' : '❌'}`);
console.log(`日期數：${r2.dayNum} → ${r2.dayNum === 4 ? '✅' : '❌'}`);
console.log(`生命數：${r2.lifePath}（3+11+4=18→9）`);
// 生命數：3+2+4=9（11化簡為2）或 3+11+4=18→9？都是9
console.log(`先天數：${r2.sortedDigits}`);
console.log(`空缺數：${r2.missingDigits.join(',')}`);

// 驗證生命階段
console.log('');
console.log(`王逸君生命階段基準年齡：36-${r1.lifePath}=${r1.baseAge}歲`);
console.log(`  第一階段 0-${r1.stages.first.end}歲：${r1.stages.first.num}`);
console.log(`  第二階段 ${r1.stages.second.start}-${r1.stages.second.end}歲：${r1.stages.second.num}`);
console.log(`  第三階段 ${r1.stages.third.start}歲後：${r1.stages.third.num}`);
