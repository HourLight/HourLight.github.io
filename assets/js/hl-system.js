/**
 * 馥靈之鑰系統初始化
 * Hour Light System Initializer
 * © 2026 馥靈之鑰國際有限公司
 * 
 * 使用方式：
 * 在頁面載入後呼叫 HLSystem.init() 初始化所有模組
 */

(function(global) {
  'use strict';
  
  // === 系統金鑰（內部使用） ===
  var _dk = function(s) { return atob(s); };
  var _KEYS = {
    core: _dk('SExfQ09SRV8yMDI2'),
    calc: _dk('SExfQ0FMQ18yMDI2'),
    card: _dk('SExfQ0FSRF8yMDI2')
  };
  
  // === 初始化狀態 ===
  const _status = {
    core: false,
    calc: false,
    card: false
  };
  
  // === 公開 API ===
  const HLSystem = {
    version: '2.0.0',
    
    /**
     * 初始化所有模組
     * @param {Object} options - 設定選項
     * @param {boolean} options.loadCards - 是否載入牌卡模組
     * @param {Function} callback - 完成回呼
     */
    init: function(options, callback) {
      options = options || {};
      const loadCards = options.loadCards !== false;
      
      // 初始化核心數據模組
      if (typeof HLCore !== 'undefined') {
        _status.core = HLCore.init(_KEYS.core);
        if (_status.core) {
          console.log('✓ HLCore 初始化成功');
        }
      } else {
        console.warn('HLCore 模組未載入');
      }
      
      // 初始化計算引擎
      if (typeof HLCalc !== 'undefined') {
        _status.calc = HLCalc.init(_KEYS.calc);
        if (_status.calc) {
          console.log('✓ HLCalc 初始化成功');
        }
      } else {
        console.warn('HLCalc 模組未載入');
      }
      
      // 初始化牌卡系統
      if (loadCards && typeof HLCards !== 'undefined') {
        HLCards.init(_KEYS.card, function(success) {
          _status.card = success;
          if (success) {
            console.log('✓ HLCards 初始化成功');
          }
          if (callback) callback(HLSystem.getStatus());
        });
      } else {
        if (callback) callback(HLSystem.getStatus());
      }
      
      return this;
    },
    
    /**
     * 取得初始化狀態
     */
    getStatus: function() {
      return {
        core: _status.core,
        calc: _status.calc,
        card: _status.card,
        ready: _status.core && _status.calc
      };
    },
    
    /**
     * 檢查是否就緒
     */
    isReady: function() {
      return _status.core && _status.calc;
    },
    
    /**
     * 快速計算命盤
     * @param {Object} birthData - 出生資料
     */
    calculateChart: function(birthData) {
      if (!this.isReady()) {
        console.error('系統尚未初始化');
        return null;
      }
      
      // 使用計算引擎
      const chart = HLCalc.calculateFullChart(birthData);
      
      // 補充數據解讀
      if (chart && _status.core) {
        // H 數解讀
        chart.hour.hData = HLCore.getNumberData(HLCalc.getBaseNum(chart.hour.h));
        // O 數解讀
        chart.hour.oData = HLCore.getNumberData(HLCalc.getBaseNum(chart.hour.o));
        // U 數解讀
        if (chart.hour.u) {
          chart.hour.uData = HLCore.getNumberData(chart.hour.u);
        }
        // R 數解讀
        chart.hour.rData = HLCore.getNumberData(HLCalc.getBaseNum(chart.hour.r));
        
        // 宮位解讀
        chart.palaceData = {};
        for (let i = 1; i <= 12; i++) {
          chart.palaceData[i] = {
            palace: HLCore.getPalaceData(i),
            number: HLCore.getNumberData(chart.palaces[i])
          };
        }
      }
      
      return chart;
    },
    
    /**
     * 計算流年運勢
     */
    calculateYearFortune: function(rNum, year) {
      if (!this.isReady()) return null;
      
      const fortune = HLCalc.calculateYearFortune(rNum, year);
      if (fortune && _status.core) {
        fortune.themeData = HLCore.getYearTheme(fortune.personalYear);
        fortune.numberData = HLCore.getNumberData(fortune.personalYear);
      }
      
      return fortune;
    },
    
    /**
     * 計算大運時間軸
     */
    calculateLifeFortunes: function(rNum, birthYear) {
      if (!this.isReady()) return null;
      
      const fortunes = HLCalc.calculateLifeFortunes(rNum, birthYear);
      if (fortunes && _status.core) {
        fortunes.forEach(function(f, i) {
          f.themeData = HLCore.getFortuneTheme(i + 1);
          f.numberData = HLCore.getNumberData(f.num);
        });
      }
      
      return fortunes;
    },
    
    /**
     * 抽牌
     */
    drawCard: function(options) {
      if (!_status.card) {
        console.error('牌卡系統尚未初始化');
        return null;
      }
      
      options = options || {};
      
      if (options.count) {
        return HLCards.drawMultipleCards(options.count);
      } else if (options.number) {
        return HLCards.drawByNumber(options.number);
      } else if (options.spread === 'three') {
        return HLCards.drawThreeCardSpread();
      } else {
        return HLCards.drawSingleCard();
      }
    },
    
    /**
     * 取得數字解讀
     */
    getNumberData: function(num) {
      if (!_status.core) return null;
      return HLCore.getNumberData(num);
    },
    
    /**
     * 取得宮位解讀
     */
    getPalaceData: function(palace) {
      if (!_status.core) return null;
      return HLCore.getPalaceData(palace);
    }
  };
  
  // 凍結物件
  Object.freeze(HLSystem);
  
  // 掛載到全域
  global.HLSystem = HLSystem;
  
  // 自動初始化（當 DOM 載入完成）
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
      // 如果頁面有設定自動初始化
      if (document.body.getAttribute('data-hl-auto-init') === 'true') {
        HLSystem.init();
      }
    });
  }
  
})(typeof window !== 'undefined' ? window : this);
