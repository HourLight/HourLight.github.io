/* ============================================
   馥靈之鑰 Hour Light
   背景音樂控制模組 v3.0
   Endless Little Stars・八音盒單曲循環
   ============================================ */

(function() {
  'use strict';

  /* ---- 音樂檔案 ---- */
  var MUSIC_URL = 'https://hourlightkey.com/music/Endless_Little_Stars.mp3';

  /* ---- 設定 ---- */
  var DEFAULT_VOLUME = 0.12;   // 輕柔不干擾，睡著也不反感
  var FADE_MS = 8000;          // 8 秒慢慢浮現

  function getTrackUrl() {
    return MUSIC_URL;
  }

  /* ---- 初始化 ---- */
  document.addEventListener('DOMContentLoaded', function() {
    initBgMusic();
  });

  function initBgMusic() {
    if (document.getElementById('hlBgMusic')) return;

    var audio = document.createElement('audio');
    audio.id = 'hlBgMusic';
    audio.loop = true;
    audio.volume = 0;
    audio.preload = 'none';
    audio.src = getTrackUrl();
    document.body.appendChild(audio);

    // 若底部導航啟用則不建立浮動按鈕
    var btn;
    if (!window.HLBottomNavActive) {
      btn = document.createElement('button');
      btn.id = 'hlMusicToggle';
      btn.className = 'hl-music-toggle';
      btn.setAttribute('aria-label', '背景音樂開關');
      btn.setAttribute('title', '點擊播放背景音樂 ✦');
      btn.innerHTML = '<span class="hl-music-icon">♪</span>';
      btn.onclick = toggleMusic;
      document.body.appendChild(btn);
    } else {
      btn = document.createElement('button');
      btn.id = 'hlMusicToggle';
      btn.style.display = 'none';
      document.body.appendChild(btn);
    }
    restorePlayState(audio, btn);
  }

  /* ---- 淡入 ---- */
  function fadeIn(audio) {
    audio.volume = 0;
    var target = DEFAULT_VOLUME;
    var step = target / (FADE_MS / 50);
    var timer = setInterval(function() {
      var v = audio.volume + step;
      if (v >= target) { audio.volume = target; clearInterval(timer); }
      else { audio.volume = v; }
    }, 50);
  }

  /* ---- 淡出 ---- */
  function fadeOut(audio, cb) {
    var step = audio.volume / (800 / 50);
    var timer = setInterval(function() {
      var v = audio.volume - step;
      if (v <= 0.01) { audio.volume = 0; clearInterval(timer); if (cb) cb(); }
      else { audio.volume = v; }
    }, 50);
  }

  /* ---- 播放/暫停 ---- */
  function toggleMusic() {
    var audio = document.getElementById('hlBgMusic');
    var btn = document.getElementById('hlMusicToggle');
    if (!audio || !btn) return;

    if (audio.paused) {
      audio.play().then(function() {
        fadeIn(audio);
        btn.innerHTML = '<span class="hl-music-icon playing-icon">♪</span>';
        btn.classList.add('playing');
        btn.setAttribute('title', '點擊暫停音樂');
        try { localStorage.setItem('hlMusicPlaying', 'true'); } catch(e) {}
      }).catch(function(err) {
        console.warn('播放需要使用者互動:', err);
      });
    } else {
      fadeOut(audio, function() { audio.pause(); });
      btn.innerHTML = '<span class="hl-music-icon">♪</span>';
      btn.classList.remove('playing');
      btn.setAttribute('title', '點擊播放背景音樂 ✦');
      try { localStorage.setItem('hlMusicPlaying', 'false'); } catch(e) {}
    }
  }

  /* ---- 恢復狀態 ---- */
  function restorePlayState(audio, btn) {
    try {
      if (localStorage.getItem('hlMusicPlaying') === 'true') {
        audio.play().then(function() {
          fadeIn(audio);
          btn.innerHTML = '<span class="hl-music-icon playing-icon">♪</span>';
          btn.classList.add('playing');
          btn.setAttribute('title', '點擊暫停音樂');
        }).catch(function() {
          btn.innerHTML = '<span class="hl-music-icon">♪</span>';
          btn.classList.remove('playing');
        });
      }
    } catch(e) {}
  }

  window.hlToggleMusic = toggleMusic;
})();
