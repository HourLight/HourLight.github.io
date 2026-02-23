/**
 * 馥靈之鑰價格數據模組
 * Hour Light Pricing Data Module
 * © 2026 馥靈之鑰國際有限公司 - 商業機密
 * 
 * 警告：本檔案包含商業機密內容
 * 未經授權複製、修改或散布將追究法律責任
 */

(function(global) {
  'use strict';
  
  // 防止直接存取的驗證 token
  const _authKey = 'HL_PRICE_2026';
  let _authorized = false;
  
  // 數據混淆函數
  const _decode = function(encoded) {
    return atob(encoded);
  };
  
  // 編碼後的價格數據（Base64）
  // 這樣在原始碼中就不會直接看到價格
  const _encodedData = {
    // 主要服務價格
    services: {
      // 年度深度轉化
      annual: 'OTgsMDAw',           
      annualMonthly: 'MTYsMzMz',    
      // 三次深度
      triple: 'MzYsODAw',           
      tripleAvg: 'MTIsMjY3',        
      // 企業專案
      enterprise: 'MTgsODAw',       
      // 深度覺醒
      awakening: 'MTIsODAw',        
      awakeningPromo: 'OSw4MDA=',   
      // 馥靈深潛
      deepDive: 'MTgsODAw',         
      // 初次體驗
      trial: 'Niw4MDA=',            
      // 優惠方案
      promoTriple: 'MjksODAw',      
      promoSingle: 'Niw2MDA=',      
      // 塔羅小方案
      tarotSmall: 'Myw2MDA=',       
      // 輕量服務
      light3: 'ODAw',
    },
    // 塔羅牌價格
    tarot: {
      card1: 'MzAw',      
      card3: 'NjAw',      
      card5: 'OTAw',      
      card7: 'MSwyMDA=',  
      card9: 'MSw1MDA=',  
    }
  };
  
  // 解碼並格式化價格
  const _formatPrice = function(encoded, prefix = 'NT$ ') {
    try {
      const decoded = _decode(encoded);
      return prefix + decoded;
    } catch (e) {
      return '請洽詢';
    }
  };
  
  // 價格 API
  const HLPricing = {
    version: '1.0.0',
    
    // 初始化驗證
    init: function(key) {
      if (key === _authKey) {
        _authorized = true;
        return true;
      }
      console.warn('HLPricing: 無效的存取金鑰');
      return false;
    },
    
    // 取得服務價格
    getServicePrice: function(serviceKey) {
      if (!_authorized) return null;
      const encoded = _encodedData.services[serviceKey];
      if (!encoded) return null;
      return _formatPrice(encoded);
    },
    
    // 取得塔羅價格
    getTarotPrice: function(cardCount) {
      if (!_authorized) return null;
      const key = 'card' + cardCount;
      const encoded = _encodedData.tarot[key];
      if (!encoded) return null;
      return _decode(encoded);
    },
    
    // 取得所有塔羅價格（用於渲染表格）
    getAllTarotPrices: function() {
      if (!_authorized) return null;
      return {
        1: { price: _decode(_encodedData.tarot.card1), desc: '當下訊息、YES/NO 傾向' },
        3: { price: _decode(_encodedData.tarot.card3), desc: '過去×現在×走向' },
        5: { price: _decode(_encodedData.tarot.card5), desc: '關鍵因素×行動建議' },
        7: { price: _decode(_encodedData.tarot.card7), desc: '深層結構掃描' },
        9: { price: _decode(_encodedData.tarot.card9), desc: '整體佈局與資源配置' }
      };
    },
    
    // 渲染服務價格到指定元素
    renderServicePrices: function() {
      if (!_authorized) return;
      
      // 找到所有需要填入價格的元素
      const priceElements = document.querySelectorAll('[data-price-key]');
      priceElements.forEach(el => {
        const key = el.getAttribute('data-price-key');
        const price = this.getServicePrice(key);
        if (price) {
          el.textContent = price;
        }
      });
      
      // 處理帶有 data-price-raw 的元素（不帶 NT$ 前綴）
      const rawElements = document.querySelectorAll('[data-price-raw]');
      rawElements.forEach(el => {
        const key = el.getAttribute('data-price-raw');
        const encoded = _encodedData.services[key];
        if (encoded) {
          el.textContent = _decode(encoded);
        }
      });
    },
    
    // 渲染塔羅價格表
    renderTarotPriceTable: function(containerId) {
      if (!_authorized) return;
      
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const prices = this.getAllTarotPrices();
      if (!prices) return;
      
      let html = `
        <table>
          <thead><tr><th>張數</th><th>價格（NT$）</th><th>用途速記</th></tr></thead>
          <tbody>
      `;
      
      Object.keys(prices).forEach(count => {
        const data = prices[count];
        html += `<tr><td>${count} 張</td><td>${data.price}</td><td>${data.desc}</td></tr>`;
      });
      
      html += '</tbody></table>';
      container.innerHTML = html;
    }
  };
  
  // 凍結物件防止修改
  Object.freeze(HLPricing);
  
  // 掛載到全域
  global.HLPricing = HLPricing;
  
})(typeof window !== 'undefined' ? window : this);
