/**
 * 馥靈之鑰牌卡系統
 * Hour Light Card System
 * © 2026 馥靈之鑰國際有限公司 - 商業機密
 * 
 * 警告：本檔案包含商業機密內容
 * 130張牌卡對應解讀為品牌核心資產
 */

(function(global) {
  'use strict';
  
  const _KEY = 'HL_CARD_2026';
  let _ready = false;
  let _cardData = null;
  
  // === 牌組結構（不含解讀內容） ===
  const _DECK_STRUCTURE = {
    spiritual: {
      count: 22,
      name: '靈性占卜卡',
      description: '22張靈性原型卡，對應生命旅程的重要課題'
    },
    aroma: {
      count: 108,
      name: '芳香能量卡',
      description: '108張芳香能量卡，結合精油與情緒調頻'
    }
  };
  
  // === 數字對應分類（公開資訊） ===
  const _NUMBER_CATEGORIES = {
    1: { theme: '領導、開創與決策頻率', shadow: '拖延症、思而不動' },
    2: { theme: '協調、平衡與感知頻率', shadow: '依賴、不信任自己' },
    3: { theme: '表達、創造與樂觀頻率', shadow: '虎頭蛇尾、逃避' },
    4: { theme: '穩定、建設與務實頻率', shadow: '僵化、恐懼改變' },
    5: { theme: '自由、變化與冒險頻率', shadow: '焦躁、逃避承諾' },
    6: { theme: '愛、責任與服務頻率', shadow: '控制、過度付出' },
    7: { theme: '內省、智慧與靈性頻率', shadow: '疏離、過度分析' },
    8: { theme: '權力、豐盛與影響頻率', shadow: '控制、工作狂' },
    9: { theme: '慈悲、智慧與完成頻率', shadow: '理想化、脫節' }
  };
  
  // === 牌卡載入器 ===
  const _loadCards = function(callback) {
    // 從外部 JSON 動態載入（保護內容不直接嵌入）
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/cards-encrypted.json', true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            _cardData = JSON.parse(xhr.responseText);
            if (callback) callback(true);
          } catch (e) {
            console.error('牌卡數據解析失敗');
            if (callback) callback(false);
          }
        } else {
          // 備用：使用內建基礎數據
          _cardData = _getBasicCardData();
          if (callback) callback(true);
        }
      }
    };
    xhr.send();
  };
  
  // === 基礎牌卡數據（用於備用/展示） ===
  const _getBasicCardData = function() {
    return {
      loaded: true,
      cards: [
        // 這裡只放最基本的展示用資料
        // 完整解讀內容存放於加密的外部檔案
        { id: 1, name: '王者權威', type: 'spiritual', number: 1 },
        { id: 2, name: '靈魂契約', type: 'spiritual', number: 2 },
        { id: 3, name: '創意火焰', type: 'spiritual', number: 3 },
        { id: 4, name: '穩固根基', type: 'spiritual', number: 4 },
        { id: 5, name: '自由之風', type: 'spiritual', number: 5 },
        { id: 6, name: '愛的守護', type: 'spiritual', number: 6 },
        { id: 7, name: '靈性覺醒', type: 'spiritual', number: 7 },
        { id: 8, name: '豐盛權杖', type: 'spiritual', number: 8 },
        { id: 9, name: '智慧圓滿', type: 'spiritual', number: 9 }
        // ... 完整 130 張牌卡資料需從加密檔案載入
      ]
    };
  };
  
  // === 隨機抽牌演算法 ===
  const _shuffleArray = function(array) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // === 根據數字篩選牌卡 ===
  const _getCardsByNumber = function(number) {
    if (!_cardData || !_cardData.cards) return [];
    return _cardData.cards.filter(function(card) {
      return card.number === number;
    });
  };
  
  // === 公開 API ===
  const HLCards = {
    version: '2.0.0',
    
    // 初始化
    init: function(key, callback) {
      if (key === _KEY) {
        _ready = true;
        _loadCards(callback);
        return true;
      }
      console.warn('HLCards: 無效的存取金鑰');
      return false;
    },
    
    // 檢查是否就緒
    isReady: function() {
      return _ready && _cardData !== null;
    },
    
    // 取得牌組資訊
    getDeckInfo: function() {
      return _ready ? _DECK_STRUCTURE : null;
    },
    
    // 取得數字分類
    getNumberCategory: function(number) {
      return _ready ? _NUMBER_CATEGORIES[number] : null;
    },
    
    // 抽取單張牌
    drawSingleCard: function() {
      if (!this.isReady()) return null;
      const cards = _cardData.cards;
      const index = Math.floor(Math.random() * cards.length);
      return cards[index];
    },
    
    // 抽取多張牌
    drawMultipleCards: function(count) {
      if (!this.isReady()) return null;
      if (count > _cardData.cards.length) count = _cardData.cards.length;
      
      const shuffled = _shuffleArray(_cardData.cards);
      return shuffled.slice(0, count);
    },
    
    // 根據數字抽牌
    drawByNumber: function(number) {
      if (!this.isReady()) return null;
      const filtered = _getCardsByNumber(number);
      if (filtered.length === 0) return null;
      
      const index = Math.floor(Math.random() * filtered.length);
      return filtered[index];
    },
    
    // 三牌陣（過去-現在-未來）
    drawThreeCardSpread: function() {
      if (!this.isReady()) return null;
      const cards = this.drawMultipleCards(3);
      return {
        past: cards[0],
        present: cards[1],
        future: cards[2]
      };
    },
    
    // 取得牌卡詳細資訊（需要驗證）
    getCardDetail: function(cardId) {
      if (!this.isReady()) return null;
      
      const card = _cardData.cards.find(function(c) {
        return c.id === cardId;
      });
      
      if (!card) return null;
      
      // 返回不含核心解讀的基本資訊
      // 核心解讀需要額外的 API 呼叫
      return {
        id: card.id,
        name: card.name,
        type: card.type,
        number: card.number,
        // reading 欄位需要額外權限
        hasReading: !!card.reading
      };
    },
    
    // 取得牌卡解讀（需要額外授權）
    getCardReading: function(cardId, authToken) {
      if (!this.isReady()) return null;
      
      // 此處可加入伺服器端驗證
      // 確保只有授權用戶可以取得完整解讀
      
      const card = _cardData.cards.find(function(c) {
        return c.id === cardId;
      });
      
      if (!card || !card.reading) return null;
      
      return {
        id: card.id,
        name: card.name,
        reading: card.reading,
        frequencyMessage: card.frequencyMessage,
        useCase: card.useCase
      };
    }
  };
  
  // 凍結物件
  Object.freeze(HLCards);
  
  // 掛載到全域
  global.HLCards = HLCards;
  
})(typeof window !== 'undefined' ? window : this);
