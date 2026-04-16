/**
 * 馥靈之鑰 獎勵視覺特效模組 v1.0
 * ─────────────────────────────────────
 * 提供：confetti 粒子、里程碑彈窗、連續簽到獎牌、兌換慶祝動畫
 * 目的：讓城堡獎勵有「看得見的儀式感」，而不只是 Firestore 數字悄悄 +1
 *
 * 公開 API：
 *   hlRewardFX.confetti(opts)           — 金色粒子噴發（3 秒）
 *   hlRewardFX.milestone(opts)          — 里程碑彈窗（50/100/200 點）
 *   hlRewardFX.streakBadge(days)        — 連續簽到獎牌
 *   hlRewardFX.redeemCelebration(item)  — 兌換成功慶祝動畫
 *   hlRewardFX.levelUp(from, to)        — 主角升級提示
 */
(function(){
  'use strict';

  // 防重入：同一 milestone 一天只觸發一次
  var TRIGGERED_KEY = 'hl_reward_fx_triggered_' + (new Date().toISOString().slice(0,10));
  function wasTriggered(id){
    try {
      var d = JSON.parse(localStorage.getItem(TRIGGERED_KEY) || '{}');
      return !!d[id];
    } catch(_) { return false; }
  }
  function markTriggered(id){
    try {
      var d = JSON.parse(localStorage.getItem(TRIGGERED_KEY) || '{}');
      d[id] = 1;
      localStorage.setItem(TRIGGERED_KEY, JSON.stringify(d));
    } catch(_) {}
  }

  // ═════════════════════════════════════════════════
  // Confetti 粒子噴發
  // ═════════════════════════════════════════════════
  var CONFETTI_COLORS = ['#f8dfa5','#e9c27d','#b8922a','#a07cdc','#d6a7c7','#ffffff'];

  function confetti(opts){
    opts = opts || {};
    var count = opts.count || 80;
    var origin = opts.origin || { x: 0.5, y: 0.4 };  // 0-1 比例
    var duration = opts.duration || 3200;

    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10001;overflow:hidden';
    document.body.appendChild(wrap);

    var vw = window.innerWidth, vh = window.innerHeight;
    var cx = vw * origin.x, cy = vh * origin.y;

    for (var i = 0; i < count; i++){
      var p = document.createElement('div');
      var size = 6 + Math.random() * 8;
      var color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      var shape = Math.random() > 0.5 ? '50%' : '2px';  // 圓形 or 方形
      var angle = Math.random() * Math.PI * 2;
      var velocity = 150 + Math.random() * 350;
      var dx = Math.cos(angle) * velocity;
      var dy = Math.sin(angle) * velocity - 200;  // 偏上
      var rot = (Math.random() - 0.5) * 720;
      p.style.cssText =
        'position:absolute;left:' + cx + 'px;top:' + cy + 'px;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'background:' + color + ';border-radius:' + shape + ';' +
        'opacity:0;transform:translate(-50%,-50%);' +
        'will-change:transform,opacity;';
      wrap.appendChild(p);
      // 觸發動畫（下一 frame 啟動）
      (function(el, dx, dy, rot, delay){
        setTimeout(function(){
          el.style.transition = 'transform ' + duration + 'ms cubic-bezier(.16,.87,.5,1), opacity ' + duration + 'ms ease-out';
          el.style.opacity = '1';
          el.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + (dy + 400) + 'px)) rotate(' + rot + 'deg)';
        }, delay);
      })(p, dx, dy, rot, i * 8);
    }

    setTimeout(function(){ wrap.remove(); }, duration + 300);
  }

  // ═════════════════════════════════════════════════
  // 里程碑彈窗（50/100/200 點等）
  // ═════════════════════════════════════════════════
  var MILESTONE_STYLES = {
    50:  { title:'突破 50 點｜覺察初開',  subtitle:'你已經跨出第一步，城堡記得你', color:'#b8922a', icon:'✨' },
    100: { title:'累積 100 點｜光的收藏者', subtitle:'這份覺察的重量，配得上一頂自己的星冠', color:'#a07cdc', icon:'⭐' },
    200: { title:'達成 200 點｜探索大師',  subtitle:'去兌換吧，城堡裡的好東西都在等你', color:'#f8dfa5', icon:'💎' },
    300: { title:'越過 300 點｜稀有收集者', subtitle:'你的靈感池深得可以映出整座月亮', color:'#d6a7c7', icon:'🔮' },
    500: { title:'抵達 500 點｜傳說行者', subtitle:'很少有人走到這裡，你是城堡的老朋友了', color:'#ff9d6c', icon:'👑' }
  };

  function milestone(opts){
    opts = opts || {};
    var points = opts.points;
    var id = 'milestone_' + points;
    if (wasTriggered(id)) return;
    markTriggered(id);

    var cfg = MILESTONE_STYLES[points] || { title:'累積 ' + points + ' 點', subtitle:'繼續前進', color:'#b8922a', icon:'✨' };

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle at center,rgba(0,0,0,.55) 0%,rgba(0,0,0,.75) 100%);z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .35s;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';

    var card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(160deg,#2a1f4c 0%,#1a1533 100%);border:1.5px solid ' + cfg.color + ';border-radius:24px;padding:36px 32px;max-width:380px;width:86%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 40px ' + cfg.color + '55;transform:scale(.88);transition:transform .4s cubic-bezier(.4,0,.2,1);font-family:"Noto Serif TC",serif;color:#fff';
    card.innerHTML =
      '<div style="font-size:3.2rem;margin-bottom:14px;filter:drop-shadow(0 4px 16px ' + cfg.color + '99)">' + cfg.icon + '</div>' +
      '<div style="font-size:1.2rem;font-weight:600;letter-spacing:.06em;color:' + cfg.color + ';margin-bottom:10px">' + cfg.title + '</div>' +
      '<div style="font-size:.88rem;color:rgba(255,255,255,.75);line-height:1.8;margin-bottom:22px;font-family:\'LXGW WenKai TC\',serif">' + cfg.subtitle + '</div>' +
      '<button type="button" style="background:linear-gradient(135deg,' + cfg.color + ',' + cfg.color + 'dd);color:#fff;border:none;border-radius:999px;padding:11px 28px;font-size:.92rem;letter-spacing:.08em;cursor:pointer;font-family:inherit;font-weight:500">收下這份光</button>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    requestAnimationFrame(function(){
      overlay.style.opacity = '1';
      card.style.transform = 'scale(1)';
    });

    // 粒子配合
    confetti({ count: 100, origin: { x: 0.5, y: 0.42 }, duration: 3200 });

    // 音效（若有）
    try {
      if (window.HLSound && HLSound.drop_legendary) HLSound.drop_legendary();
      else if (window.HLSound && HLSound.drop_rare) HLSound.drop_rare();
    } catch(_) {}

    // 關閉
    function close(){
      overlay.style.opacity = '0';
      card.style.transform = 'scale(.9)';
      setTimeout(function(){ overlay.remove(); }, 400);
    }
    card.querySelector('button').addEventListener('click', close);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
    setTimeout(close, 7000);
  }

  // ═════════════════════════════════════════════════
  // 連續簽到獎牌（每 7 天一次）
  // ═════════════════════════════════════════════════
  function streakBadge(days){
    if (!days || days < 2) return;
    // 只在 7/14/30/60/90/180/365 天觸發
    var TARGETS = [7, 14, 30, 60, 90, 180, 365];
    if (TARGETS.indexOf(days) === -1) return;
    var id = 'streak_' + days;
    if (wasTriggered(id)) return;
    markTriggered(id);

    var LABELS = {
      7:   { title:'連續 7 天｜習慣點亮', desc:'一週，你都有回來。城堡記得你每一步' },
      14:  { title:'連續 14 天｜穩定節奏', desc:'覺察變成呼吸，城堡與你同頻' },
      30:  { title:'連續 30 天｜月圓之旅', desc:'走過一整個月相，你就是自己的導航員' },
      60:  { title:'連續 60 天｜雙月合光', desc:'不只是習慣，是選擇。選擇面對自己' },
      90:  { title:'連續 90 天｜季節切換', desc:'跨季節的覺察旅人，城堡為你留了專屬位置' },
      180: { title:'連續 180 天｜半年修行', desc:'很多人來又走，你一直在。這本身就是答案' },
      365: { title:'連續 365 天｜一年四季', desc:'你已經是城堡的靈魂之一了' }
    };
    var cfg = LABELS[days] || { title:'連續 ' + days + ' 天', desc:'你的堅持，城堡都看見了' };

    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10000;padding:18px 24px 16px;border-radius:18px;background:linear-gradient(135deg,rgba(42,31,76,.96),rgba(90,60,140,.96));color:#fff;font-family:"Noto Serif TC",serif;box-shadow:0 14px 40px rgba(0,0,0,.35),0 0 30px rgba(160,124,220,.4);border:1px solid rgba(248,223,165,.35);min-width:280px;text-align:center;opacity:0;transition:all .5s cubic-bezier(.4,0,.2,1)';
    toast.innerHTML =
      '<div style="font-size:2rem;margin-bottom:6px">🔥</div>' +
      '<div style="font-size:1rem;color:#f8dfa5;font-weight:600;letter-spacing:.04em;margin-bottom:6px">' + cfg.title + '</div>' +
      '<div style="font-size:.78rem;color:rgba(255,255,255,.75);line-height:1.55;font-family:\'LXGW WenKai TC\',serif">' + cfg.desc + '</div>';
    document.body.appendChild(toast);

    requestAnimationFrame(function(){
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%,8px)';
    });
    confetti({ count: 60, origin: { x: 0.5, y: 0.15 }, duration: 2600 });
    try { if (window.HLSound && HLSound.drop_rare) HLSound.drop_rare(); } catch(_){}

    setTimeout(function(){
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%,-12px)';
      setTimeout(function(){ toast.remove(); }, 500);
    }, 5500);
  }

  // ═════════════════════════════════════════════════
  // 兌換成功慶祝動畫
  // ═════════════════════════════════════════════════
  function redeemCelebration(item){
    item = item || {};
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle,rgba(248,223,165,.15),rgba(0,0,0,.7));z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .4s;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)';
    var card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(140deg,#3a2a5c,#1a1533);border:1.5px solid #f8dfa5;border-radius:22px;padding:32px 28px;max-width:360px;width:88%;text-align:center;color:#fff;font-family:"Noto Serif TC",serif;transform:scale(.85) rotate(-2deg);transition:transform .5s cubic-bezier(.34,1.56,.64,1);box-shadow:0 28px 80px rgba(0,0,0,.7),0 0 40px rgba(248,223,165,.3)';
    card.innerHTML =
      '<div style="font-size:3.8rem;margin-bottom:10px;animation:rewardFxRing 1.8s ease-in-out infinite">🎁</div>' +
      '<div style="font-size:.7rem;letter-spacing:.22em;color:#f8dfa5;margin-bottom:8px;text-transform:uppercase">兌換成功</div>' +
      '<div style="font-size:1.15rem;font-weight:600;color:#fff;margin-bottom:10px">' + (item.name || '好禮已收下') + '</div>' +
      '<div style="font-size:.82rem;color:rgba(255,255,255,.7);line-height:1.7;font-family:\'LXGW WenKai TC\',serif">' + (item.desc || '帶著這份力量，繼續你的探索') + '</div>' +
      '<button type="button" style="margin-top:20px;background:linear-gradient(135deg,#f8dfa5,#b8922a);color:#2a1f4c;border:none;border-radius:999px;padding:10px 24px;font-size:.88rem;letter-spacing:.08em;cursor:pointer;font-family:inherit;font-weight:600">繼續</button>';
    overlay.appendChild(card);
    var style = document.createElement('style');
    style.textContent = '@keyframes rewardFxRing{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}';
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    requestAnimationFrame(function(){
      overlay.style.opacity = '1';
      card.style.transform = 'scale(1) rotate(0)';
    });
    confetti({ count: 120, origin: { x: 0.5, y: 0.45 }, duration: 3500 });
    try { if (window.HLSound && HLSound.drop_legendary) HLSound.drop_legendary(); } catch(_){}

    function close(){
      overlay.style.opacity = '0';
      card.style.transform = 'scale(.9)';
      setTimeout(function(){ overlay.remove(); }, 400);
    }
    card.querySelector('button').addEventListener('click', close);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
    setTimeout(close, 8000);
  }

  // ═════════════════════════════════════════════════
  // 主角升級提示
  // ═════════════════════════════════════════════════
  function levelUp(from, to){
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.7);z-index:10000;padding:24px 32px;border-radius:20px;background:linear-gradient(135deg,#f8dfa5,#e9c27d);color:#2a1f4c;font-family:"Noto Serif TC",serif;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.4);opacity:0;transition:all .5s cubic-bezier(.34,1.56,.64,1)';
    toast.innerHTML =
      '<div style="font-size:.72rem;letter-spacing:.22em;margin-bottom:6px;text-transform:uppercase">Level Up</div>' +
      '<div style="font-size:1.8rem;font-weight:700;letter-spacing:.06em">Lv ' + from + ' → Lv ' + to + '</div>';
    document.body.appendChild(toast);
    requestAnimationFrame(function(){
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%,-50%) scale(1)';
    });
    confetti({ count: 70, origin: { x: 0.5, y: 0.5 }, duration: 2600 });
    try { if (window.HLSound && HLSound.drop_rare) HLSound.drop_rare(); } catch(_){}
    setTimeout(function(){
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%,-50%) scale(.85)';
      setTimeout(function(){ toast.remove(); }, 500);
    }, 3000);
  }

  // 公開 API
  window.hlRewardFX = {
    confetti: confetti,
    milestone: milestone,
    streakBadge: streakBadge,
    redeemCelebration: redeemCelebration,
    levelUp: levelUp
  };
})();
