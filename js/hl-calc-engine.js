/**
 * 馥靈之鑰計算引擎
 * Hour Light Calculation Engine
 * © 2026 馥靈之鑰國際有限公司 - 商業機密
 * 
 * 警告：本檔案包含專有演算法
 * 未經授權複製、修改或散布將追究法律責任
 */

(function(global) {
  'use strict';
  
  // 驗證金鑰
  const _KEY = 'HL_CALC_2026';
  let _initialized = false;
  
  // === 核心計算函數（混淆處理） ===
  
  // 判斷大師數字
  const _isMN = function(n) {
    return n === 11 || n === 22 || n === 33;
  };
  
  // 縮減至單數（不保留大師數）
  const _rTS = function(n) {
    while (n > 9) {
      n = String(n).split('').reduce(function(a, b) {
        return parseInt(a) + parseInt(b);
      }, 0);
    }
    return n;
  };
  
  // 縮減數字（保留大師數）
  const _rN = function(n) {
    if (_isMN(n)) return n;
    while (n > 9) {
      n = String(n).split('').reduce(function(a, b) {
        return parseInt(a) + parseInt(b);
      }, 0);
      if (_isMN(n)) return n;
    }
    return n;
  };
  
  // 取得基礎數
  const _gBN = function(n) {
    return _isMN(n) ? n : _rTS(n);
  };
  
  // 時辰數據映射
  const _HOUR_MAP = {
    'zi': { n: '子時', t: '23:00-01:00', v: 1 },
    'chou': { n: '丑時', t: '01:00-03:00', v: 2 },
    'yin': { n: '寅時', t: '03:00-05:00', v: 3 },
    'mao': { n: '卯時', t: '05:00-07:00', v: 4 },
    'chen': { n: '辰時', t: '07:00-09:00', v: 5 },
    'si': { n: '巳時', t: '09:00-11:00', v: 6 },
    'wu': { n: '午時', t: '11:00-13:00', v: 7 },
    'wei': { n: '未時', t: '13:00-15:00', v: 8 },
    'shen': { n: '申時', t: '15:00-17:00', v: 9 },
    'you': { n: '酉時', t: '17:00-19:00', v: 10 },
    'xu': { n: '戌時', t: '19:00-21:00', v: 11 },
    'hai': { n: '亥時', t: '21:00-23:00', v: 12 },
    'unknown': { n: '未知', t: '', v: 0 }
  };
  
  // 取得時辰數據
  const _gHD = function(id) {
    return _HOUR_MAP[id] || _HOUR_MAP['unknown'];
  };
  
  // === H.O.U.R. 核心計算 ===
  const _calcHOUR = function(data) {
    const { year, month, day, lunarMonth, lunarDay, hourId } = data;
    
    // 時辰處理
    const hourData = _gHD(hourId);
    const hourValue = hourData.v;
    
    // U 數計算
    let uNum = 0;
    if (hourValue > 0) {
      if (hourValue === 11) uNum = 11;
      else if (hourValue === 10) uNum = 1;
      else if (hourValue === 12) uNum = 3;
      else uNum = hourValue;
    }
    
    // H 數：農曆月 + 農曆日
    const hNum = _rN(parseInt(lunarMonth) + parseInt(lunarDay));
    
    // O 數：西曆年月日相加
    const oNumRaw = String(year) + String(month).padStart(2, '0') + String(day).padStart(2, '0');
    const oNum = _rN(oNumRaw.split('').reduce(function(a, b) {
      return parseInt(a) + parseInt(b);
    }, 0));
    
    // R 數：H + O + U
    const rNum = uNum ? _rN(hNum + oNum + uNum) : _rN(hNum + oNum);
    
    return {
      h: hNum,
      o: oNum,
      u: uNum,
      r: rNum,
      hourData: hourData
    };
  };
  
  // === L.I.G.H.T. 計算 ===
  const _calcLIGHT = function(data, hour) {
    const { year, lunarMonth, lunarDay, hourId } = data;
    const hourData = _gHD(hourId);
    const uNum = hour.u;
    
    // L 數：農曆月
    const lNum = parseInt(lunarMonth) > 9 ? _rN(parseInt(lunarMonth)) : parseInt(lunarMonth);
    
    // I 數：時辰（無則預設 5）
    const iNum = uNum || 5;
    
    // G 數：西曆年份相加
    const gNum = _rN(String(year).split('').reduce(function(a, b) {
      return parseInt(a) + parseInt(b);
    }, 0));
    
    // H 數：農曆日
    const hEnergyNum = parseInt(lunarDay) > 9 ? _rN(parseInt(lunarDay)) : parseInt(lunarDay);
    
    // T 數：L + I + G + H
    const tNum = _rN(lNum + iNum + gNum + hEnergyNum);
    
    return {
      l: lNum,
      i: iNum,
      g: gNum,
      h: hEnergyNum,
      t: tNum
    };
  };
  
  // === 12 宮位計算 ===
  const _calcPalaces = function(data, hour, light) {
    const { year, month, day, lunarMonth, lunarDay } = data;
    const { h: hNum, o: oNum, u: uNum, r: rNum } = hour;
    const { l: lNum, i: iNum, g: gNum, h: hEnergyNum } = light;
    
    const yearStr = String(year);
    const lastTwo = parseInt(yearStr.slice(-2));
    
    // 各宮位計算
    const p2Num = _rN(Math.floor(lastTwo / 10) + (lastTwo % 10));
    const p3Num = parseInt(month) === 11 ? 11 : _rN(parseInt(month));
    const p4Num = [11, 22].includes(parseInt(day)) ? parseInt(day) : _rN(parseInt(day));
    const p5Num = parseInt(lunarMonth) === 11 ? 11 : lNum;
    const p6Num = [11, 22].includes(parseInt(lunarDay)) ? parseInt(lunarDay) : hEnergyNum;
    const p9Num = parseInt(yearStr.charAt(yearStr.length - 3)) || 9;
    
    return {
      1: _gBN(hNum),
      2: p2Num,
      3: p3Num,
      4: p4Num,
      5: p5Num,
      6: p6Num,
      7: _gBN(oNum),
      8: gNum,
      9: p9Num,
      10: uNum || 5,
      11: light.t,
      12: _gBN(rNum)
    };
  };
  
  // === 橋接數計算 ===
  const _calcBridges = function(hour) {
    const { h: hNum, o: oNum, u: uNum, r: rNum } = hour;
    
    return {
      ho: Math.abs(_gBN(hNum) - _gBN(oNum)),
      ou: uNum ? Math.abs(_gBN(oNum) - uNum) : 0,
      ur: uNum ? Math.abs(uNum - _gBN(rNum)) : 0
    };
  };
  
  // === 數字分析 ===
  const _analyzeNumbers = function(hour, palaces) {
    const { h: hNum, o: oNum, u: uNum, r: rNum } = hour;
    
    // 統計各數字出現次數
    const numberCount = {};
    for (let i = 1; i <= 9; i++) numberCount[i] = 0;
    numberCount[11] = 0;
    numberCount[22] = 0;
    numberCount[33] = 0;
    
    // 統計主數字
    [hNum, oNum, rNum].forEach(function(num) {
      if (_isMN(num)) {
        numberCount[num]++;
      } else {
        const r = _rTS(num);
        if (r >= 1 && r <= 9) numberCount[r]++;
      }
    });
    
    // 統計宮位數字
    Object.values(palaces).forEach(function(num) {
      if (_isMN(num)) {
        numberCount[num]++;
      } else {
        const r = _rTS(num);
        if (r >= 1 && r <= 9) numberCount[r]++;
      }
    });
    
    // 分析
    const hasMasterNumbers = _isMN(hNum) || _isMN(oNum) || _isMN(rNum) || _isMN(uNum);
    const masterNumbersList = [hNum, oNum, uNum, rNum].filter(_isMN);
    
    return {
      numberCount: numberCount,
      missingNumbers: Object.entries(numberCount)
        .filter(function(e) { return e[1] === 0 && parseInt(e[0]) <= 9; })
        .map(function(e) { return parseInt(e[0]); }),
      excessNumbers: Object.entries(numberCount)
        .filter(function(e) { return e[1] >= 3; })
        .map(function(e) { return parseInt(e[0]); }),
      hasMasterNumbers: hasMasterNumbers,
      masterNumbersList: masterNumbersList
    };
  };
  
  // === 流年計算 ===
  const _calcYearFortune = function(rNum, year) {
    const universeYear = _rN(String(year).split('').reduce(function(a, b) {
      return parseInt(a) + parseInt(b);
    }, 0));
    const personalYear = _rN(_gBN(rNum) + universeYear);
    
    return {
      universeYear: universeYear,
      personalYear: personalYear
    };
  };
  
  // === 大運計算 ===
  const _calcLifeFortunes = function(rNum, birthYear) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const baseR = _gBN(rNum);
    const fortunes = [];
    
    for (let i = 1; i <= 8; i++) {
      const startAge = (i - 1) * 10 + 1;
      const fortuneNum = _rN(baseR + i);
      const isCurrent = age >= startAge && (i === 8 || age <= i * 10);
      
      fortunes.push({
        period: i,
        startYear: birthYear + startAge - 1,
        endYear: i === 8 ? '∞' : birthYear + i * 10 - 1,
        num: fortuneNum,
        isCurrent: isCurrent,
        isMaster: _isMN(fortuneNum)
      });
    }
    
    return fortunes;
  };
  
  // === 合盤計算 ===
  const _calcCompatibility = function(person1, person2) {
    const r1 = _gBN(person1.r);
    const r2 = _gBN(person2.r);
    
    // 相容度計算
    const diff = Math.abs(r1 - r2);
    let compatibility = 0;
    
    if (diff === 0) compatibility = 100;
    else if (diff === 1 || diff === 8) compatibility = 85;
    else if (diff === 2 || diff === 7) compatibility = 75;
    else if (diff === 3 || diff === 6) compatibility = 65;
    else if (diff === 4 || diff === 5) compatibility = 55;
    
    // 能量互補分析
    const h1 = _gBN(person1.h);
    const h2 = _gBN(person2.h);
    const hCompat = h1 + h2 === 10 ? 'high' : 'normal';
    
    const o1 = _gBN(person1.o);
    const o2 = _gBN(person2.o);
    const oCompat = o1 + o2 === 10 ? 'high' : 'normal';
    
    return {
      compatibility: compatibility,
      difference: diff,
      energyMatch: {
        h: hCompat,
        o: oCompat
      },
      suggestion: compatibility >= 75 ? 'harmonious' : compatibility >= 55 ? 'learning' : 'challenging'
    };
  };
  
  // === 公開 API ===
  const HLCalc = {
    version: '2.0.0',
    _ready: false,
    
    // 初始化
    init: function(key) {
      if (key === _KEY) {
        this._ready = true;
        _initialized = true;
        return true;
      }
      console.warn('HLCalc: 無效的存取金鑰');
      return false;
    },
    
    // 工具函數
    isMasterNumber: function(n) {
      return this._ready ? _isMN(n) : null;
    },
    
    reduceNumber: function(n) {
      return this._ready ? _rN(n) : null;
    },
    
    reduceToSingle: function(n) {
      return this._ready ? _rTS(n) : null;
    },
    
    getBaseNum: function(n) {
      return this._ready ? _gBN(n) : null;
    },
    
    getHourData: function(id) {
      return this._ready ? _gHD(id) : null;
    },
    
    // 完整命盤計算
    calculateFullChart: function(data) {
      if (!this._ready) return null;
      
      // H.O.U.R. 計算
      const hour = _calcHOUR(data);
      
      // L.I.G.H.T. 計算
      const light = _calcLIGHT(data, hour);
      
      // 12 宮位
      const palaces = _calcPalaces(data, hour, light);
      
      // 橋接數
      const bridges = _calcBridges(hour);
      
      // 平衡數
      const balanceNum = Math.round((_gBN(hour.h) + _gBN(hour.o)) / 2);
      
      // 數字分析
      const analysis = _analyzeNumbers(hour, palaces);
      
      return {
        inputData: data,
        hour: hour,
        light: light,
        palaces: palaces,
        bridges: bridges,
        balanceNum: balanceNum,
        analysis: analysis
      };
    },
    
    // 流年計算
    calculateYearFortune: function(rNum, year) {
      return this._ready ? _calcYearFortune(rNum, year) : null;
    },
    
    // 大運計算
    calculateLifeFortunes: function(rNum, birthYear) {
      return this._ready ? _calcLifeFortunes(rNum, birthYear) : null;
    },
    
    // 合盤計算
    calculateCompatibility: function(person1, person2) {
      return this._ready ? _calcCompatibility(person1, person2) : null;
    }
  };
  
  // 凍結物件
  Object.freeze(HLCalc);
  
  // 掛載到全域
  global.HLCalc = HLCalc;
  
})(typeof window !== 'undefined' ? window : this);
