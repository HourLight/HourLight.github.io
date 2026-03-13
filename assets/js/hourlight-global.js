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

  // ==================== 浮動 LINE 聊聊按鈕 ====================
  (function initFloatingLine(){
    // 排除後台頁面
    var path = location.pathname;
    if(path.indexOf('admin') !== -1 || path.indexOf('app.html') !== -1) return;

    var btn = document.createElement('a');
    btn.href = 'https://lin.ee/OQDB5t6';
    btn.target = '_blank';
    btn.rel = 'noopener';
    btn.setAttribute('aria-label', 'LINE 聊聊');
    btn.className = 'hl-floating-line';
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 5.89 2 10.54c0 2.82 1.67 5.33 4.28 6.96-.15.54-.53 2.01-.6 2.32-.1.4.14.4.3.29.12-.08 1.89-1.28 2.66-1.8.86.13 1.76.2 2.68.2h.68c5.52 0 10-3.89 10-8.54C22 5.89 17.52 2 12 2z"/></svg><span>LINE 聊聊</span>';

    // 樣式
    var s = btn.style;
    s.position = 'fixed';
    s.bottom = '90px';
    s.right = '20px';
    s.zIndex = '9990';
    s.display = 'flex';
    s.alignItems = 'center';
    s.gap = '8px';
    s.padding = '12px 18px';
    s.borderRadius = '50px';
    s.background = 'linear-gradient(135deg,#d4a853,#c49a40)';
    s.color = '#1a0e00';
    s.fontFamily = 'var(--sans,"Noto Serif TC",sans-serif)';
    s.fontSize = '0.82rem';
    s.fontWeight = '500';
    s.letterSpacing = '1px';
    s.textDecoration = 'none';
    s.boxShadow = '0 4px 20px rgba(212,168,83,.35)';
    s.transition = 'all .3s ease';
    s.opacity = '0';
    s.transform = 'translateY(20px)';

    btn.onmouseenter = function(){ s.boxShadow='0 6px 28px rgba(212,168,83,.5)'; s.transform='translateY(-2px)'; };
    btn.onmouseleave = function(){ s.boxShadow='0 4px 20px rgba(212,168,83,.35)'; s.transform='translateY(0)'; };

    document.body.appendChild(btn);
    setTimeout(function(){ s.opacity='1'; s.transform='translateY(0)'; }, 800);
  })();

})();
