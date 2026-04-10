/* ═══════════════════════════════════════════════════════════
   馥靈之鑰 Course Slides Engine v1.0
   鍵盤/觸控/滑鼠 投影片控制
   ═══════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  let current = 0;
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;
  const progress = document.querySelector('.slide-progress');
  const pageInfo = document.querySelector('.page-info');
  const sidebar = document.querySelector('.slide-sidebar');
  const sidebarItems = document.querySelectorAll('.sidebar-item');

  function goTo(n) {
    if (n < 0 || n >= total) return;
    slides[current].classList.remove('active');
    current = n;
    slides[current].classList.add('active');
    updateUI();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function updateUI() {
    if (progress) progress.style.width = ((current + 1) / total * 100) + '%';
    if (pageInfo) pageInfo.textContent = (current + 1) + ' / ' + total;
    sidebarItems.forEach(function(item, i) {
      item.classList.toggle('current', i === current);
    });
  }

  // Keyboard
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    if (e.key === 'End') { e.preventDefault(); goTo(total - 1); }
    if (e.key === 'Escape' && sidebar) { sidebar.classList.remove('open'); }
    if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
  });

  // Touch swipe
  let touchStartX = 0;
  let touchStartY = 0;
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next(); else prev();
    }
  }, { passive: true });

  // Click on right/left half
  document.addEventListener('click', function(e) {
    if (e.target.closest('.slide-nav, .slide-sidebar, .sidebar-toggle, .fullscreen-btn, button, a')) return;
    if (e.clientX > window.innerWidth * 0.6) next();
    else if (e.clientX < window.innerWidth * 0.4) prev();
  });

  // Nav buttons
  var btnPrev = document.querySelector('.nav-prev');
  var btnNext = document.querySelector('.nav-next');
  if (btnPrev) btnPrev.addEventListener('click', function(e) { e.stopPropagation(); prev(); });
  if (btnNext) btnNext.addEventListener('click', function(e) { e.stopPropagation(); next(); });

  // Sidebar toggle
  var sidebarBtn = document.querySelector('.sidebar-toggle');
  if (sidebarBtn && sidebar) {
    sidebarBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });
  }

  // Sidebar item click
  sidebarItems.forEach(function(item, i) {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      goTo(i);
      if (sidebar) sidebar.classList.remove('open');
    });
  });

  // Fullscreen
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function(){});
    } else {
      document.exitFullscreen();
    }
  }
  var fsBtn = document.querySelector('.fullscreen-btn');
  if (fsBtn) fsBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleFullscreen(); });

  // Init
  if (slides.length > 0) {
    slides[0].classList.add('active');
    updateUI();
  }
})();
