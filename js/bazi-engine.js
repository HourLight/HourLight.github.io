// ============================================
// 八字排盤計算引擎 v1.0
// 馥靈之鑰 Hour Light
// ============================================

// === 基礎常量 ===
const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const WU_XING_GAN = ['木','木','火','火','土','土','金','金','水','水']; // 天干五行
const YIN_YANG_GAN = ['陽','陰','陽','陰','陽','陰','陽','陰','陽','陰']; // 天干陰陽

// 六十甲子
const SIXTY_JZ = [];
for (let i = 0; i < 60; i++) {
  SIXTY_JZ.push(TIAN_GAN[i % 10] + DI_ZHI[i % 12]);
}

// 納音五行對照表（每兩組一個納音）
const NA_YIN = [
  '海中金','海中金','爐中火','爐中火','大林木','大林木',
  '路旁土','路旁土','劍鋒金','劍鋒金','山頭火','山頭火',
  '澗下水','澗下水','城頭土','城頭土','白蠟金','白蠟金',
  '楊柳木','楊柳木','泉中水','泉中水','屋上土','屋上土',
  '霹靂火','霹靂火','松柏木','松柏木','長流水','長流水',
  '沙中金','沙中金','山下火','山下火','平地木','平地木',
  '壁上土','壁上土','金箔金','金箔金','覆燈火','覆燈火',
  '天河水','天河水','大驛土','大驛土','釵環金','釵環金',
  '桑柘木','桑柘木','大溪水','大溪水','沙中土','沙中土',
  '天上火','天上火','石榴木','石榴木','大海水','大海水'
];

// 地支藏干對照表
const CANG_GAN = {
  '子': [['癸','本氣']],
  '丑': [['己','本氣'],['辛','中氣'],['癸','餘氣']],
  '寅': [['甲','本氣'],['丙','中氣'],['戊','餘氣']],
  '卯': [['乙','本氣']],
  '辰': [['戊','本氣'],['乙','中氣'],['癸','餘氣']],
  '巳': [['丙','本氣'],['庚','中氣'],['戊','餘氣']],
  '午': [['丁','本氣'],['己','中氣']],
  '未': [['己','本氣'],['丁','中氣'],['乙','餘氣']],
  '申': [['庚','本氣'],['壬','中氣'],['戊','餘氣']],
  '酉': [['辛','本氣']],
  '戌': [['戊','本氣'],['辛','中氣'],['丁','餘氣']],
  '亥': [['壬','本氣'],['甲','中氣']]
};

// 十神對照表（完整100組）
// key = 日主index, value = 對應每個天干的十神
const SHI_SHEN_TABLE = {
  0: ['比肩','劫財','食神','傷官','偏財','正財','七殺','正官','偏印','正印'], // 甲
  1: ['劫財','比肩','傷官','食神','正財','偏財','正官','七殺','正印','偏印'], // 乙
  2: ['偏印','正印','比肩','劫財','食神','傷官','偏財','正財','七殺','正官'], // 丙
  3: ['正印','偏印','劫財','比肩','傷官','食神','正財','偏財','正官','七殺'], // 丁
  4: ['七殺','正官','偏印','正印','比肩','劫財','食神','傷官','偏財','正財'], // 戊
  5: ['正官','七殺','正印','偏印','劫財','比肩','傷官','食神','正財','偏財'], // 己
  6: ['偏財','正財','七殺','正官','偏印','正印','比肩','劫財','食神','傷官'], // 庚
  7: ['正財','偏財','正官','七殺','正印','偏印','劫財','比肩','傷官','食神'], // 辛
  8: ['食神','傷官','偏財','正財','七殺','正官','偏印','正印','比肩','劫財'], // 壬
  9: ['傷官','食神','正財','偏財','正官','七殺','正印','偏印','劫財','比肩']  // 癸
};

// === 儒略日計算 ===
function calcJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// === 日柱計算 ===
// 基準點：2000年1月7日 = 甲子日 (JDN=2451551, 六十甲子index=0)
// 驗證：多個來源確認2000-01-07為甲子日
const JDN_JIAZI_REF = 2451551; // 2000-01-07 甲子日

function getDayPillar(year, month, day) {
  const jdn = calcJDN(year, month, day);
  let idx = ((jdn - JDN_JIAZI_REF) % 60 + 60) % 60;
  return {
    index: idx,
    ganZhi: SIXTY_JZ[idx],
    gan: TIAN_GAN[idx % 10],
    zhi: DI_ZHI[idx % 12],
    ganIndex: idx % 10,
    zhiIndex: idx % 12,
    naYin: NA_YIN[idx],
    jdn: jdn
  };
}

// === 節氣計算（簡化版，用已知數據表） ===
// 立春日期表（1970-2030年的立春精確到日）
const LI_CHUN_DATES = {
  1970: [2,4], 1971: [2,4], 1972: [2,5], 1973: [2,4], 1974: [2,4],
  1975: [2,4], 1976: [2,5], 1977: [2,4], 1978: [2,4], 1979: [2,4],
  1980: [2,5], 1981: [2,4], 1982: [2,4], 1983: [2,4], 1984: [2,4],
  1985: [2,4], 1986: [2,4], 1987: [2,4], 1988: [2,4], 1989: [2,4],
  1990: [2,4], 1991: [2,4], 1992: [2,4], 1993: [2,4], 1994: [2,4],
  1995: [2,4], 1996: [2,4], 1997: [2,4], 1998: [2,4], 1999: [2,4],
  2000: [2,4], 2001: [2,4], 2002: [2,4], 2003: [2,4], 2004: [2,4],
  2005: [2,4], 2006: [2,4], 2007: [2,4], 2008: [2,4], 2009: [2,4],
  2010: [2,4], 2011: [2,4], 2012: [2,4], 2013: [2,4], 2014: [2,4],
  2015: [2,4], 2016: [2,4], 2017: [2,3], 2018: [2,4], 2019: [2,4],
  2020: [2,4], 2021: [2,3], 2022: [2,4], 2023: [2,4], 2024: [2,4],
  2025: [2,3], 2026: [2,4], 2027: [2,4], 2028: [2,4], 2029: [2,3],
  2030: [2,4]
};

// 月節氣（節，非氣）的近似日期
// 寅月=立春(2/4) 卯月=驚蟄(3/6) 辰月=清明(4/5) 巳月=立夏(5/6)
// 午月=芒種(6/6) 未月=小暑(7/7) 申月=立秋(8/7) 酉月=白露(9/8)
// 戌月=寒露(10/8) 亥月=立冬(11/7) 子月=大雪(12/7) 丑月=小寒(1/6)
const JIE_QI_APPROX = [
  { month: 1, day: 6, zhiIndex: 1 },   // 小寒 → 丑月
  { month: 2, day: 4, zhiIndex: 2 },   // 立春 → 寅月
  { month: 3, day: 6, zhiIndex: 3 },   // 驚蟄 → 卯月
  { month: 4, day: 5, zhiIndex: 4 },   // 清明 → 辰月
  { month: 5, day: 6, zhiIndex: 5 },   // 立夏 → 巳月
  { month: 6, day: 6, zhiIndex: 6 },   // 芒種 → 午月
  { month: 7, day: 7, zhiIndex: 7 },   // 小暑 → 未月
  { month: 8, day: 7, zhiIndex: 8 },   // 立秋 → 申月
  { month: 9, day: 8, zhiIndex: 9 },   // 白露 → 酉月
  { month: 10, day: 8, zhiIndex: 10 }, // 寒露 → 戌月
  { month: 11, day: 7, zhiIndex: 11 }, // 立冬 → 亥月
  { month: 12, day: 7, zhiIndex: 0 },  // 大雪 → 子月
];

// === 年柱計算 ===
function getYearPillar(year, month, day) {
  // 以立春為界，立春前算上一年
  const lc = LI_CHUN_DATES[year] || [2, 4];
  let effectiveYear = year;
  if (month < lc[0] || (month === lc[0] && day < lc[1])) {
    effectiveYear = year - 1;
  }
  // 天干：(年份 - 4) % 10  甲=0
  // 地支：(年份 - 4) % 12  子=0
  const ganIdx = ((effectiveYear - 4) % 10 + 10) % 10;
  const zhiIdx = ((effectiveYear - 4) % 12 + 12) % 12;
  const idx60 = findSixtyIdx(ganIdx, zhiIdx);
  return {
    index60: idx60,
    ganZhi: SIXTY_JZ[idx60],
    gan: TIAN_GAN[ganIdx],
    zhi: DI_ZHI[zhiIdx],
    ganIndex: ganIdx,
    zhiIndex: zhiIdx,
    naYin: NA_YIN[idx60],
    effectiveYear: effectiveYear
  };
}

function findSixtyIdx(ganIdx, zhiIdx) {
  // 在六十甲子中找到天干index和地支index對應的位置
  for (let i = 0; i < 60; i++) {
    if (i % 10 === ganIdx && i % 12 === zhiIdx) return i;
  }
  return 0;
}

// === 月柱計算 ===
function getMonthPillar(year, month, day, yearGanIdx) {
  // 確定月支（以節氣為界）
  let monthZhiIdx = 2; // 預設寅月
  
  // 找出當前日期屬於哪個節氣月
  for (let i = JIE_QI_APPROX.length - 1; i >= 0; i--) {
    const jq = JIE_QI_APPROX[i];
    if (month > jq.month || (month === jq.month && day >= jq.day)) {
      monthZhiIdx = jq.zhiIndex;
      break;
    }
  }
  
  // 處理跨年：如果月份是1月且在小寒前，則屬於上一年的子月
  if (month === 1 && day < 6) {
    monthZhiIdx = 0; // 子月，但要用上一年的年干
  }
  
  // 五虎遁月：根據年干確定月干
  // 甲己年起丙寅，乙庚年起戊寅，丙辛年起庚寅，丁壬年起壬寅，戊癸年起甲寅
  const yearGanGroup = yearGanIdx % 5; // 0=甲己, 1=乙庚, 2=丙辛, 3=丁壬, 4=戊癸
  const startGan = [2, 4, 6, 8, 0][yearGanGroup]; // 寅月起始天干index
  
  // 從寅月開始算偏移
  const offset = ((monthZhiIdx - 2) + 12) % 12;
  const monthGanIdx = (startGan + offset) % 10;
  
  const idx60 = findSixtyIdx(monthGanIdx, monthZhiIdx);
  return {
    index60: idx60,
    ganZhi: SIXTY_JZ[idx60],
    gan: TIAN_GAN[monthGanIdx],
    zhi: DI_ZHI[monthZhiIdx],
    ganIndex: monthGanIdx,
    zhiIndex: monthZhiIdx,
    naYin: NA_YIN[idx60]
  };
}

// === 時柱計算 ===
function getHourPillar(hour, minute, dayGanIdx) {
  // 確定時辰地支
  const totalMinutes = hour * 60 + minute;
  let hourZhiIdx;
  if (totalMinutes >= 1380 || totalMinutes < 60) hourZhiIdx = 0;       // 子 23:00-01:00
  else if (totalMinutes < 180) hourZhiIdx = 1;  // 丑 01:00-03:00
  else if (totalMinutes < 300) hourZhiIdx = 2;  // 寅 03:00-05:00
  else if (totalMinutes < 420) hourZhiIdx = 3;  // 卯 05:00-07:00
  else if (totalMinutes < 540) hourZhiIdx = 4;  // 辰 07:00-09:00
  else if (totalMinutes < 660) hourZhiIdx = 5;  // 巳 09:00-11:00
  else if (totalMinutes < 780) hourZhiIdx = 6;  // 午 11:00-13:00
  else if (totalMinutes < 900) hourZhiIdx = 7;  // 未 13:00-15:00
  else if (totalMinutes < 1020) hourZhiIdx = 8; // 申 15:00-17:00
  else if (totalMinutes < 1140) hourZhiIdx = 9; // 酉 17:00-19:00
  else if (totalMinutes < 1260) hourZhiIdx = 10; // 戌 19:00-21:00
  else hourZhiIdx = 11; // 亥 21:00-23:00
  
  // 五鼠遁時：根據日干確定時干
  // 甲己日起甲子，乙庚日起丙子，丙辛日起戊子，丁壬日起庚子，戊癸日起壬子
  const dayGanGroup = dayGanIdx % 5;
  const startGan = [0, 2, 4, 6, 8][dayGanGroup]; // 子時起始天干index
  const hourGanIdx = (startGan + hourZhiIdx) % 10;
  
  const idx60 = findSixtyIdx(hourGanIdx, hourZhiIdx);
  return {
    index60: idx60,
    ganZhi: SIXTY_JZ[idx60],
    gan: TIAN_GAN[hourGanIdx],
    zhi: DI_ZHI[hourZhiIdx],
    ganIndex: hourGanIdx,
    zhiIndex: hourZhiIdx,
    naYin: NA_YIN[idx60],
    shiChen: DI_ZHI[hourZhiIdx] + '時'
  };
}

// === 十神計算 ===
function getShiShen(dayGanIdx, targetGanIdx) {
  return SHI_SHEN_TABLE[dayGanIdx][targetGanIdx];
}

// === 完整八字排盤 ===
function calculateBaZi(year, month, day, hour, minute, gender) {
  const yearP = getYearPillar(year, month, day);
  const monthP = getMonthPillar(year, month, day, yearP.ganIndex);
  const dayP = getDayPillar(year, month, day);
  const hourP = (hour !== undefined && hour !== null) 
    ? getHourPillar(hour, minute || 0, dayP.ganIndex) 
    : null;
  
  const result = {
    yearPillar: yearP,
    monthPillar: monthP,
    dayPillar: dayP,
    hourPillar: hourP,
    dayMaster: dayP.gan,
    dayMasterIndex: dayP.ganIndex,
    dayMasterWuXing: WU_XING_GAN[dayP.ganIndex],
    dayMasterYinYang: YIN_YANG_GAN[dayP.ganIndex]
  };
  
  // 計算十神
  result.shiShen = {
    yearGan: getShiShen(dayP.ganIndex, yearP.ganIndex),
    monthGan: getShiShen(dayP.ganIndex, monthP.ganIndex),
    hourGan: hourP ? getShiShen(dayP.ganIndex, hourP.ganIndex) : null
  };
  
  // 計算藏干十神
  result.cangGan = {
    yearZhi: CANG_GAN[yearP.zhi].map(([gan, type]) => ({
      gan, type, shiShen: getShiShen(dayP.ganIndex, TIAN_GAN.indexOf(gan))
    })),
    monthZhi: CANG_GAN[monthP.zhi].map(([gan, type]) => ({
      gan, type, shiShen: getShiShen(dayP.ganIndex, TIAN_GAN.indexOf(gan))
    })),
    dayZhi: CANG_GAN[dayP.zhi].map(([gan, type]) => ({
      gan, type, shiShen: getShiShen(dayP.ganIndex, TIAN_GAN.indexOf(gan))
    })),
    hourZhi: hourP ? CANG_GAN[hourP.zhi].map(([gan, type]) => ({
      gan, type, shiShen: getShiShen(dayP.ganIndex, TIAN_GAN.indexOf(gan))
    })) : null
  };
  
  return result;
}

// === 格式化輸出 ===
function formatBaZi(result) {
  let output = [];
  output.push('【八字四柱】');
  output.push(`► 年柱：${result.yearPillar.ganZhi}（納音：${result.yearPillar.naYin}）`);
  output.push(`► 月柱：${result.monthPillar.ganZhi}（納音：${result.monthPillar.naYin}）`);
  output.push(`► 日柱：${result.dayPillar.ganZhi}（納音：${result.dayPillar.naYin}）→ 日主：${result.dayMaster}${result.dayMasterWuXing}（${result.dayMasterYinYang}）`);
  if (result.hourPillar) {
    output.push(`► 時柱：${result.hourPillar.ganZhi}（納音：${result.hourPillar.naYin}）`);
  } else {
    output.push('► 時柱：需出生時間');
  }
  
  output.push('');
  output.push('【地支藏干】');
  output.push(`► 年支${result.yearPillar.zhi}藏：${result.cangGan.yearZhi.map(c => `${c.gan}（${c.type}）`).join(' ')}`);
  output.push(`► 月支${result.monthPillar.zhi}藏：${result.cangGan.monthZhi.map(c => `${c.gan}（${c.type}）`).join(' ')}`);
  output.push(`► 日支${result.dayPillar.zhi}藏：${result.cangGan.dayZhi.map(c => `${c.gan}（${c.type}）`).join(' ')}`);
  if (result.cangGan.hourZhi) {
    output.push(`► 時支${result.hourPillar.zhi}藏：${result.cangGan.hourZhi.map(c => `${c.gan}（${c.type}）`).join(' ')}`);
  }
  
  output.push('');
  output.push('【十神結構】');
  output.push(`► 年干 ${result.yearPillar.gan}：${result.shiShen.yearGan}`);
  output.push(`► 年支藏干：${result.cangGan.yearZhi.map(c => `${c.gan}=${c.shiShen}（${c.type}）`).join(' ')}`);
  output.push(`► 月干 ${result.monthPillar.gan}：${result.shiShen.monthGan}`);
  output.push(`► 月支藏干：${result.cangGan.monthZhi.map(c => `${c.gan}=${c.shiShen}（${c.type}）`).join(' ')}`);
  output.push(`► 日支藏干：${result.cangGan.dayZhi.map(c => `${c.gan}=${c.shiShen}（${c.type}）`).join(' ')}`);
  if (result.hourPillar) {
    output.push(`► 時干 ${result.hourPillar.gan}：${result.shiShen.hourGan}`);
    output.push(`► 時支藏干：${result.cangGan.hourZhi.map(c => `${c.gan}=${c.shiShen}（${c.type}）`).join(' ')}`);
  }
  
  return output.join('\n');
}

// ============================================
// 測試驗證
// ============================================

console.log('='.repeat(60));
console.log('驗證 1：王逸君 1976/02/05 19:47（戌時）');
console.log('正確答案：年丙辰 月庚寅 日丁亥 時庚戌');
console.log('='.repeat(60));
const yijun = calculateBaZi(1976, 2, 5, 19, 47, 'F');
console.log(formatBaZi(yijun));
console.log('');
console.log(`驗證結果：年${yijun.yearPillar.ganZhi} 月${yijun.monthPillar.ganZhi} 日${yijun.dayPillar.ganZhi} 時${yijun.hourPillar.ganZhi}`);
const yijunExpect = '丙辰 庚寅 丁亥 庚戌';
const yijunActual = `${yijun.yearPillar.ganZhi} ${yijun.monthPillar.ganZhi} ${yijun.dayPillar.ganZhi} ${yijun.hourPillar.ganZhi}`;
console.log(`期望：${yijunExpect}`);
console.log(`實際：${yijunActual}`);
console.log(yijunActual === yijunExpect ? '✅ 完全正確！' : '❌ 有誤！需修正');

console.log('');
console.log('='.repeat(60));
console.log('驗證 2：鄭博清 1974/11/04 19:47（戌時）');
console.log('正確答案：年甲寅 月甲戌 日己酉 時甲戌');
console.log('='.repeat(60));
const boqing = calculateBaZi(1974, 11, 4, 19, 47, 'M');
console.log(formatBaZi(boqing));
console.log('');
console.log(`驗證結果：年${boqing.yearPillar.ganZhi} 月${boqing.monthPillar.ganZhi} 日${boqing.dayPillar.ganZhi} 時${boqing.hourPillar.ganZhi}`);
const boqingExpect = '甲寅 甲戌 己酉 甲戌';
const boqingActual = `${boqing.yearPillar.ganZhi} ${boqing.monthPillar.ganZhi} ${boqing.dayPillar.ganZhi} ${boqing.hourPillar.ganZhi}`;
console.log(`期望：${boqingExpect}`);
console.log(`實際：${boqingActual}`);
console.log(boqingActual === boqingExpect ? '✅ 完全正確！' : '❌ 有誤！需修正');

// 十神驗算
console.log('');
console.log('='.repeat(60));
console.log('十神驗算（博清 日主己土）');
console.log('='.repeat(60));
console.log(`年干甲：${boqing.shiShen.yearGan}（應為正官）→ ${boqing.shiShen.yearGan === '正官' ? '✅' : '❌'}`);
console.log(`月干甲：${boqing.shiShen.monthGan}（應為正官）→ ${boqing.shiShen.monthGan === '正官' ? '✅' : '❌'}`);
console.log(`時干甲：${boqing.shiShen.hourGan}（應為正官）→ ${boqing.shiShen.hourGan === '正官' ? '✅' : '❌'}`);

// 驗證己土日主的幾個關鍵十神
const jiTuTests = [
  ['甲', '正官'], ['乙', '七殺'], ['丙', '正印'], ['丁', '偏印'],
  ['戊', '劫財'], ['己', '比肩'], ['庚', '傷官'], ['辛', '食神'],
  ['壬', '正財'], ['癸', '偏財']
];
console.log('\n己土十神完整驗證：');
jiTuTests.forEach(([gan, expected]) => {
  const actual = getShiShen(5, TIAN_GAN.indexOf(gan)); // 己=5
  console.log(`  ${gan} → ${actual}（應為${expected}）→ ${actual === expected ? '✅' : '❌'}`);
});
