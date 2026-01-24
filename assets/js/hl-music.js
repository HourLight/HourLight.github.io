/* ============================================
   馥靈之鑰 Hour Light
   背景音樂控制模組 v1.0
   432Hz 療癒音樂
   ============================================ */

(function() {
  'use strict';
  
  // 音樂檔案 URL
  const MUSIC_URL = 'https://hourlight.github.io/432Hz.mp3';
  
  // 預設音量（0-1）
  const DEFAULT_VOLUME = 0.3;
  
  // 等待 DOM 載入完成
  document.addEventListener('DOMContentLoaded', function() {
    initBgMusic();
  });
  
  function initBgMusic() {
    // 檢查是否已經存在（避免重複初始化）
    if (document.getElementById('hlBgMusic')) return;
    
    // 建立 audio 元素
    const audio = document.createElement('audio');
    audio.id = 'hlBgMusic';
    audio.loop = true;
    audio.volume = DEFAULT_VOLUME;
    audio.innerHTML = '<source src="' + MUSIC_URL + '" type="audio/mpeg">';
    document.body.appendChild(audio);
    
    // 建立控制按鈕
    const btn = document.createElement('button');
    btn.id = 'hlMusicToggle';
    btn.className = 'hl-music-toggle';
    btn.setAttribute('aria-label', '背景音樂開關');
    btn.setAttribute('title', '點擊播放 432Hz 療癒音樂');
    btn.textContent = '🔇';
    btn.onclick = toggleMusic;
    document.body.appendChild(btn);
    
    // 從 localStorage 恢復播放狀態
    restorePlayState(audio, btn);
  }
  
  function toggleMusic() {
    const audio = document.getElementById('hlBgMusic');
    const btn = document.getElementById('hlMusicToggle');
    
    if (!audio || !btn) return;
    
    if (audio.paused) {
      // 播放
      audio.play().then(function() {
        btn.textContent = '🔊';
        btn.classList.add('playing');
        btn.setAttribute('title', '點擊暫停音樂');
        // 記住播放狀態
        try {
          localStorage.setItem('hlMusicPlaying', 'true');
        } catch(e) {}
      }).catch(function(err) {
        console.log('音樂播放需要使用者互動:', err);
      });
    } else {
      // 暫停
      audio.pause();
      btn.textContent = '🔇';
      btn.classList.remove('playing');
      btn.setAttribute('title', '點擊播放 432Hz 療癒音樂');
      // 記住暫停狀態
      try {
        localStorage.setItem('hlMusicPlaying', 'false');
      } catch(e) {}
    }
  }
  
  function restorePlayState(audio, btn) {
    try {
      const wasPlaying = localStorage.getItem('hlMusicPlaying');
      if (wasPlaying === 'true') {
        // 嘗試自動播放（可能被瀏覽器阻擋）
        audio.play().then(function() {
          btn.textContent = '🔊';
          btn.classList.add('playing');
          btn.setAttribute('title', '點擊暫停音樂');
        }).catch(function() {
          // 自動播放被阻擋，保持靜音狀態
          btn.textContent = '🔇';
          btn.classList.remove('playing');
        });
      }
    } catch(e) {}
  }
  
  // 暴露全域函數供 onclick 使用
  window.hlToggleMusic = toggleMusic;
  
})();
