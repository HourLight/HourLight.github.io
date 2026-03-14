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

  // ==================== 浮動 LINE 聊聊按鈕（已移除，改用小馥客服）====================

})();
