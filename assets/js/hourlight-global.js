/* ======================================================
   馥靈之鑰 Hour Light - JavaScript 元件庫
   版本：v2.0
   ====================================================== */

(function() {
  'use strict';

  // ==================== 頁面載入動畫 ====================
  document.addEventListener('DOMContentLoaded', function() {
    // 為 body 加上動畫 class
    document.body.classList.add('hl-page-transition');
    
    // 初始化所有功能
    initScrollAnimations();
    initNavToggle();
    initMusicPlayer();
    initSmoothScroll();
    initFloatDraw();
    initGuideNav();
  });

  // ==================== 滾動動畫觀察器 ====================
  function initScrollAnimations() {
    // 支援新舊兩種 class 名稱
    const animatedElements = document.querySelectorAll('.hl-fade-in-up, .fade-in-up');
    
    if (animatedElements.length === 0) return;
    
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // 可選：只執行一次後取消觀察
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    animatedElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // ==================== 手機版導航切換 ====================
  function initNavToggle() {
    const toggle = document.querySelector('.hl-nav-toggle');
    const navLinks = document.querySelector('.hl-nav-links');
    
    if (!toggle || !navLinks) return;
    
    toggle.addEventListener('click', function() {
      navLinks.classList.toggle('is-open');
      toggle.classList.toggle('is-active');
      
      // 更新 ARIA 屬性
      const isOpen = navLinks.classList.contains('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
    
    // 點擊連結後關閉選單
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navLinks.classList.remove('is-open');
        toggle.classList.remove('is-active');
      });
    });
  }

  // ==================== 背景音樂播放器 ====================
  function initMusicPlayer() {
    const musicToggle = document.getElementById('musicToggle');
    const bgMusic = document.getElementById('bgMusic');
    
    if (!musicToggle) return;
    
    // 如果沒有音樂元素，創建一個
    let audioElement = bgMusic;
    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = 'bgMusic';
      audioElement.loop = true;
      audioElement.src = 'https://hourlightkey.com/432Hz.mp3';
      document.body.appendChild(audioElement);
    }
    
    // 移除可能的 inline onclick 避免雙重觸發
    if (musicToggle.hasAttribute('onclick')) {
      musicToggle.removeAttribute('onclick');
    }
    
    // 統一由 addEventListener 綁定
    musicToggle.addEventListener('click', function() {
      toggleBgMusic();
    });
  }

  // 全域音樂切換函數
  window.toggleBgMusic = function() {
    const audio = document.getElementById('bgMusic');
    const btn = document.getElementById('musicToggle');
    
    if (!audio || !btn) return;
    
    if (audio.paused) {
      audio.volume = 0.3;
      audio.play().then(function() {
        btn.textContent = '🔊';
        btn.classList.add('playing');
      }).catch(function(error) {
        console.log('Audio playback failed:', error);
      });
    } else {
      audio.pause();
      btn.textContent = '🔇';
      btn.classList.remove('playing');
    }
  };

  // ==================== 平滑滾動 ====================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ==================== 工具函數 ====================
  
  // 延遲執行
  window.hlDebounce = function(func, wait) {
    let timeout;
    return function executedFunction() {
      const later = function() {
        clearTimeout(timeout);
        func.apply(this, arguments);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 節流執行
  window.hlThrottle = function(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
        }, limit);
      }
    };
  };

  // ==================== 回到頂部 ====================
  window.hlScrollToTop = function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // ==================== 浮動免費抽牌按鈕（左下角）====================
  function initFloatDraw() {
    // 如果當前頁面就是抽牌頁，不顯示
    var path = window.location.pathname;
    if (path.indexOf('draw-hl') !== -1 || path.indexOf('draw-light') !== -1 || path.indexOf('draw-body') !== -1 || path.indexOf('draw-nail') !== -1 || path.indexOf('draw-spa') !== -1 || path.indexOf('draw-manual') !== -1 || path.indexOf('tarot') !== -1) return;
    // 排除工具頁和隱私頁
    if (path.indexOf('admin') !== -1 || path.indexOf('privacy') !== -1 || path.indexOf('terms') !== -1 || path.indexOf('sitemap') !== -1) return;

    var btn = document.createElement('a');
    btn.href = 'draw-hl.html';
    btn.className = 'hl-float-draw';
    btn.innerHTML = '<span class="hl-float-draw-icon">🔮</span><span class="hl-float-draw-text">免費抽牌</span>';
    document.body.appendChild(btn);
  }

  // ==================== 快速分流導覽 ====================
  function initGuideNav() {
    var path = window.location.pathname;
    if (path.indexOf('admin') !== -1 || path.indexOf('privacy') !== -1 || path.indexOf('terms') !== -1) return;

    // FAB 按鈕
    var fab = document.createElement('button');
    fab.className = 'hl-guide-fab';
    fab.innerHTML = '🧭';
    fab.title = '不知道看什麼？';
    fab.setAttribute('aria-label', '快速導覽');
    document.body.appendChild(fab);

    // 彈窗
    var overlay = document.createElement('div');
    overlay.className = 'hl-guide-overlay';
    overlay.innerHTML = '<div class="hl-guide-modal">'
      + '<button class="hl-guide-close" aria-label="關閉">&times;</button>'
      + '<div class="hl-guide-title">不知道看什麼？</div>'
      + '<div class="hl-guide-subtitle">選一個最像你現在狀態的選項 ✨</div>'
      + '<div class="hl-guide-grid">'

      + '<a href="draw-hl.html" class="hl-guide-item">'
      + '<div class="hl-guide-item-icon">🔮</div>'
      + '<div class="hl-guide-item-text"><h3>想抽一張牌試試</h3><p>免費體驗，1 分鐘看見自己</p></div></a>'

      + '<a href="services.html" class="hl-guide-item">'
      + '<div class="hl-guide-item-icon">💡</div>'
      + '<div class="hl-guide-item-text"><h3>想了解有什麼服務</h3><p>一對一解讀、課程、企業方案一次看</p></div></a>'

      + '<a href="fuling-mima.html" class="hl-guide-item">'
      + '<div class="hl-guide-item-icon">🔢</div>'
      + '<div class="hl-guide-item-text"><h3>想算算自己的數字</h3><p>輸入生日，看你的 H.O.U.R. 密碼</p></div></a>'

      + '<a href="hour-training.html" class="hl-guide-item">'
      + '<div class="hl-guide-item-icon">🌿</div>'
      + '<div class="hl-guide-item-text"><h3>我想學這套方法</h3><p>美業人的情緒陪伴變現之路</p></div></a>'

      + '<a href="book.html" class="hl-guide-item">'
      + '<div class="hl-guide-item-icon">📖</div>'
      + '<div class="hl-guide-item-text"><h3>想先自己讀讀看</h3><p>三本書，從故事到實戰</p></div></a>'

      + '<a href="https://lin.ee/OQDB5t6" target="_blank" rel="noopener" class="hl-guide-item">'
      + '<div class="hl-guide-item-icon">💬</div>'
      + '<div class="hl-guide-item-text"><h3>直接問本人最快</h3><p>LINE 聊聊，不推銷、不尷尬</p></div></a>'

      + '</div>'
      + '<div class="hl-guide-footer"><a href="hourlight-sitemap.html">📋 查看完整網站地圖</a></div>'
      + '</div>';
    document.body.appendChild(overlay);

    // 事件
    fab.addEventListener('click', function() {
      overlay.classList.add('is-open');
    });
    overlay.querySelector('.hl-guide-close').addEventListener('click', function() {
      overlay.classList.remove('is-open');
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('is-open');
    });
    // ESC 關閉
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        overlay.classList.remove('is-open');
      }
    });
  }

})();
