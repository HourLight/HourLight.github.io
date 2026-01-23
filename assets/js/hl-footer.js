/* ============================================
   馥靈之鑰 Hour Light
   精緻版 Footer JS - 展開收合控制
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.querySelector('.hl-footer-toggle');
  const details = document.querySelector('.hl-footer-details');
  
  if (toggleBtn && details) {
    toggleBtn.addEventListener('click', function() {
      toggleBtn.classList.toggle('active');
      details.classList.toggle('open');
      
      // 更新按鈕文字
      const textSpan = toggleBtn.querySelector('.hl-footer-toggle-text');
      if (textSpan) {
        textSpan.textContent = details.classList.contains('open') ? '收合聲明' : '查看聲明';
      }
    });
  }
});
