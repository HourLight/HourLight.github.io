/**
 * 馥靈之鑰 音效系統 v1.0
 * assets/js/hl-sound.js
 *
 * 使用 Web Audio API，不依賴外部檔案
 * 所有音效用程式碼合成（不需要下載 mp3）
 *
 * API:
 *   HLSound.click()          — 按鈕點擊（短促 beep）
 *   HLSound.success()        — 任務完成（上行和弦）
 *   HLSound.drop_common()    — 普通掉落（柔和鈴聲）
 *   HLSound.drop_rare()      — 稀有掉落（掃頻閃爍）
 *   HLSound.drop_legendary() — 傳說掉落（戲劇性揭示）
 *   HLSound.error()          — 錯誤提示（下行音）
 *   HLSound.unlock()         — 解鎖成功（上行號角）
 *   HLSound.muted            — 靜音開關（存 localStorage）
 *   HLSound.toggleMute()     — 切換靜音
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'hl_sound_muted';
  var _ctx = null;
  var _muted = false;

  // 讀取靜音狀態
  try { _muted = localStorage.getItem(STORAGE_KEY) === '1'; } catch(e){}

  function getCtx(){
    if(_ctx) return _ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if(AC) _ctx = new AC();
    } catch(e){}
    return _ctx;
  }

  // 恢復被暫停的 AudioContext（iOS Safari 需要用戶互動後才能播放）
  function resumeCtx(){
    var ctx = getCtx();
    if(ctx && ctx.state === 'suspended'){
      ctx.resume().catch(function(){});
    }
    return ctx;
  }

  // 檢查背景音樂是否在播放（尊重 hl-music.js）
  function respectMusic(){
    // 不阻止音效，只是降低音量
    if(window.hlMusic && hlMusic.isPlaying && hlMusic.isPlaying()) return 0.3;
    return 0.5;
  }

  function playTone(freq, duration, type, gainVal, startDelay){
    if(_muted) return;
    var ctx = resumeCtx();
    if(!ctx) return;
    var vol = gainVal * respectMusic();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime + (startDelay || 0));
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (startDelay || 0) + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + (startDelay || 0));
    osc.stop(ctx.currentTime + (startDelay || 0) + duration);
  }

  function playSweep(startFreq, endFreq, duration, type, gainVal, startDelay){
    if(_muted) return;
    var ctx = resumeCtx();
    if(!ctx) return;
    var vol = gainVal * respectMusic();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    var t0 = ctx.currentTime + (startDelay || 0);
    osc.frequency.setValueAtTime(startFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  var HLSound = {
    get muted(){ return _muted; },
    set muted(v){
      _muted = !!v;
      try { localStorage.setItem(STORAGE_KEY, _muted ? '1' : '0'); } catch(e){}
    },

    toggleMute: function(){
      HLSound.muted = !_muted;
      return _muted;
    },

    // 按鈕點擊：短促 800Hz beep, 50ms
    click: function(){
      playTone(800, 0.05, 'sine', 0.3);
    },

    // 任務完成：上行 C-E-G 和弦, 300ms
    success: function(){
      playTone(523, 0.3, 'sine', 0.25, 0);      // C5
      playTone(659, 0.25, 'sine', 0.2, 0.08);    // E5
      playTone(784, 0.22, 'sine', 0.2, 0.16);    // G5
    },

    // 普通掉落：柔和鈴聲, 200ms
    drop_common: function(){
      playTone(1047, 0.12, 'sine', 0.15, 0);     // C6
      playTone(1319, 0.15, 'sine', 0.12, 0.06);  // E6
    },

    // 稀有掉落：掃頻閃爍 400→1200Hz, 400ms
    drop_rare: function(){
      playSweep(400, 1200, 0.4, 'sine', 0.25);
      playTone(1200, 0.15, 'triangle', 0.15, 0.35);
    },

    // 傳說掉落：戲劇性低→高掃頻 + 和弦, 800ms
    drop_legendary: function(){
      playSweep(150, 600, 0.4, 'sawtooth', 0.15);
      playSweep(300, 1200, 0.5, 'sine', 0.2, 0.3);
      playTone(784, 0.3, 'sine', 0.2, 0.6);      // G5
      playTone(988, 0.3, 'sine', 0.18, 0.65);     // B5
      playTone(1175, 0.35, 'sine', 0.15, 0.7);    // D6
    },

    // 錯誤：下行音, 200ms
    error: function(){
      playTone(400, 0.12, 'square', 0.15, 0);
      playTone(300, 0.15, 'square', 0.12, 0.08);
    },

    // 解鎖：上行號角, 500ms
    unlock: function(){
      playTone(523, 0.15, 'triangle', 0.2, 0);     // C5
      playTone(659, 0.15, 'triangle', 0.2, 0.1);    // E5
      playTone(784, 0.15, 'triangle', 0.2, 0.2);    // G5
      playTone(1047, 0.25, 'triangle', 0.25, 0.3);  // C6
    }
  };

  window.HLSound = HLSound;

  // 首次用戶互動時啟用 AudioContext（iOS Safari 要求）
  function onFirstInteraction(){
    resumeCtx();
    document.removeEventListener('touchstart', onFirstInteraction);
    document.removeEventListener('click', onFirstInteraction);
  }
  document.addEventListener('touchstart', onFirstInteraction, {passive:true});
  document.addEventListener('click', onFirstInteraction, {passive:true});

})();
