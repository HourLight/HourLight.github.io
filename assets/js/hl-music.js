/* ============================================
   馥靈之鑰 Hour Light
   背景音樂控制模組 v2.0
   三首宇宙氛圍原創音樂・依頁面自動切換
   ============================================ */

(function() {
  'use strict';

  /* ---- 音樂檔案對照表 ---- */
  var BASE = 'https://hourlightkey.com/music/';
  var TRACKS = {
    cosmos:   BASE + '70bpm.mp3',   // 宇宙搖籃：溫暖 pad + 鋼琴，官網主旋律
    stardust: BASE + '65bpm.mp3',   // 星河漫步：有旋律線，互動工具陪伴
    thekey:   BASE + '60bpm.mp3'    // 鑰匙的召喚：品牌辨識度最高，敘事感
  };

  /* ---- 頁面→音軌分配 ---- */
  var PAGE_MAP = {
    // 鑰匙的召喚（故事・深度・品牌核心）
    'yichun':            'thekey',
    'founder':           'thekey',
    'brand-story':       'thekey',
    'brand':             'thekey',
    'worldview':         'thekey',
    'hourlight-system':  'thekey',
    'hourlight-core':    'thekey',
    'hourlight-hour':    'thekey',
    'hour-ideology':     'thekey',
    'book':              'thekey',
    'Bookpreview':       'thekey',
    'Fulingpreview':     'thekey',
    'AIpreview':         'thekey',
    'music':             'thekey',
    'gps':               'thekey',
    'gps-system':        'thekey',

    // 星河漫步（互動工具・計算器・抽牌）
    'fuling-mima':           'stardust',
    'draw-hl':               'stardust',
    'draw-light':            'stardust',
    'draw-spa':              'stardust',
    'draw-nail':             'stardust',
    'draw-body':             'stardust',
    'tarot':                 'stardust',
    'tarot-draw':            'stardust',
    'tarot-widget':          'stardust',
    'lifepath-calculator':   'stardust',
    'numerology-calculator': 'stardust',
    'rainbow-calculator':    'stardust',
    'maya-calculator':       'stardust',
    'quantum-numerology':    'stardust',
    'rainbow-bridge':        'stardust',
    'digital-energy-analyzer': 'stardust',
    'scent-navigator':       'stardust',
    'maslow-frequency':      'stardust'
  };
  // 其餘所有頁面 → cosmos（宇宙搖籃）

  /* ---- 設定 ---- */
  var DEFAULT_VOLUME = 0.25;
  var FADE_MS = 2000;

  /* ---- 判斷當前頁面 ---- */
  function getPageKey() {
    var path = window.location.pathname;
    var file = path.split('/').pop().replace('.html', '');
    if (!file || file === '') file = 'index';
    return file;
  }

  function getTrackUrl() {
    var key = getPageKey();
    var track = PAGE_MAP[key] || 'cosmos';
    return TRACKS[track];
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

    var btn = document.createElement('button');
    btn.id = 'hlMusicToggle';
    btn.className = 'hl-music-toggle';
    btn.setAttribute('aria-label', '背景音樂開關');
    btn.setAttribute('title', '點擊播放宇宙氛圍音樂');
    btn.innerHTML = '<span class="hl-music-icon">♪</span>';
    btn.onclick = toggleMusic;
    document.body.appendChild(btn);

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
        console.log('播放需要使用者互動:', err);
      });
    } else {
      fadeOut(audio, function() { audio.pause(); });
      btn.innerHTML = '<span class="hl-music-icon">♪</span>';
      btn.classList.remove('playing');
      btn.setAttribute('title', '點擊播放宇宙氛圍音樂');
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
