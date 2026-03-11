/**
 * 馥靈之鑰 Hour Light - 效能優化模組
 * 版本：v1.0
 * 功能：
 * 1. 圖片延遲載入觀察器
 * 2. 視差滾動效果
 * 3. 動畫觸發觀察器
 * 4. 字型載入優化
 */

(function() {
  'use strict';

  // ==================== 配置 ====================
  const CONFIG = {
    lazyLoadMargin: '200px',      // 提前載入距離
    animationMargin: '50px',      // 動畫觸發距離
    debounceDelay: 100            // 防抖延遲
  };

  // ==================== 圖片延遲載入 ====================
  function initLazyLoad() {
    // 如果瀏覽器原生支援 lazy loading，就讓瀏覽器處理
    if ('loading' in HTMLImageElement.prototype) {
      // 瀏覽器原生支援，不需要 JS 處理
      return;
    }

    // 使用 Intersection Observer 作為 fallback
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if (lazyImages.length === 0) return;

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // 載入圖片
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // 載入 srcset
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: CONFIG.lazyLoadMargin
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // ==================== 動畫觸發觀察器 ====================
  function initAnimationObserver() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    if (animatedElements.length === 0) return;

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const animation = el.dataset.animate || 'fadeIn';
          const delay = el.dataset.animateDelay || '0';
          
          el.style.animationDelay = delay + 'ms';
          el.classList.add('animate-' + animation, 'animated');
          
          animationObserver.unobserve(el);
        }
      });
    }, {
      rootMargin: CONFIG.animationMargin,
      threshold: 0.1
    });

    animatedElements.forEach(el => animationObserver.observe(el));
  }

  // ==================== 平滑滾動連結 ====================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        
        // 跳過空連結或 # 連結
        if (targetId === '#' || targetId === '') return;
        
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // 更新 URL hash
          history.pushState(null, null, targetId);
        }
      });
    });
  }

  // ==================== 字型載入狀態 ====================
  function initFontLoadingOptimization() {
    // 檢測字型是否已載入
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    } else {
      // Fallback：直接標記
      document.body.classList.add('fonts-loaded');
    }
  }

  // ==================== 防抖函數 ====================
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ==================== 頁面效能監控（開發用） ====================
  function logPerformance() {
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
          
                                      }, 0);
      });
    }
  }

  // ==================== 初始化 ====================
  function init() {
    // DOM 載入完成後執行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initLazyLoad();
        initAnimationObserver();
        initSmoothScroll();
        initFontLoadingOptimization();
      });
    } else {
      initLazyLoad();
      initAnimationObserver();
      initSmoothScroll();
      initFontLoadingOptimization();
    }
    
    // 開發環境下輸出效能報告
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      logPerformance();
    }
  }

  // 執行初始化
  init();

  // 暴露到全域（供外部使用）
  window.HLPerformance = {
    initLazyLoad,
    initAnimationObserver,
    debounce
  };

})();
