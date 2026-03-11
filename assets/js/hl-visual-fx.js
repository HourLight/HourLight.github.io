/* ═══════════════════════════════════════
   hl-visual-fx.js — 馥靈共用視覺特效引擎
   粒子、揭示、交錯動畫、光暈
   ═══════════════════════════════════════ */
(function(){
'use strict';
window.HLFX = {};

/* ── 粒子系統 ── */
HLFX.particles = function(opts){
  opts = opts || {};
  var color = opts.color || 'rgba(233,194,125,0.6)';
  var count = opts.count || 40;
  var duration = opts.duration || 3000;
  var spread = opts.spread || 'radial'; // radial | rain | float

  var canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas active';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var particles = [];
  var cx = canvas.width/2, cy = canvas.height/2;

  for (var i=0;i<count;i++){
    var angle = Math.random()*Math.PI*2;
    var speed = 1 + Math.random()*3;
    var size = 1 + Math.random()*3;
    var life = 0.5 + Math.random()*0.5;
    var p = {
      x: spread==='rain' ? Math.random()*canvas.width : cx,
      y: spread==='rain' ? -Math.random()*100 : cy,
      vx: spread==='rain' ? (Math.random()-0.5)*0.5 : Math.cos(angle)*speed,
      vy: spread==='rain' ? 1+Math.random()*2 : Math.sin(angle)*speed,
      size: size,
      alpha: life,
      decay: life / (duration/16),
      color: color
    };
    if (spread==='float'){
      p.x = Math.random()*canvas.width;
      p.y = Math.random()*canvas.height;
      p.vx = (Math.random()-0.5)*0.3;
      p.vy = -0.2-Math.random()*0.5;
      p.decay *= 0.5;
    }
    particles.push(p);
  }

  var start = Date.now();
  function draw(){
    if (Date.now()-start > duration){
      canvas.style.opacity = '0';
      setTimeout(function(){ if(canvas.parentNode) canvas.parentNode.removeChild(canvas); }, 1500);
      return;
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(function(p){
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fillStyle = p.color.replace(/[\d.]+\)$/,p.alpha+')');
      ctx.fill();
      // glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size*3, 0, Math.PI*2);
      ctx.fillStyle = p.color.replace(/[\d.]+\)$/,(p.alpha*0.15)+')');
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
};

/* ── 交錯淡入（Intersection Observer 版）── */
HLFX.stagger = function(selector, delay){
  delay = delay || 120;
  var els = document.querySelectorAll(selector || '.fx-stagger');
  if (!els.length) return;

  if ('IntersectionObserver' in window){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          var idx = Array.prototype.indexOf.call(els, e.target);
          setTimeout(function(){ e.target.classList.add('visible'); }, idx * delay);
          obs.unobserve(e.target);
        }
      });
    }, {threshold:0.15});
    els.forEach(function(el){ obs.observe(el); });
  } else {
    els.forEach(function(el,i){
      setTimeout(function(){ el.classList.add('visible'); }, i*delay);
    });
  }
};

/* ── 數字翻轉動畫 ── */
HLFX.countUp = function(el, target, duration){
  duration = duration || 800;
  var start = Date.now();
  var from = 0;
  function tick(){
    var elapsed = Date.now()-start;
    var progress = Math.min(elapsed/duration, 1);
    var eased = 1 - Math.pow(1-progress, 3); // ease-out cubic
    var current = Math.round(from + (target-from) * eased);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(tick);
  }
  tick();
};

/* ── 圓形揭示 ── */
HLFX.circleReveal = function(el, delay){
  el.classList.add('fx-circle-reveal');
  setTimeout(function(){ el.classList.add('open'); }, delay || 100);
};

/* ── 光暈脈衝 ── */
HLFX.glowPulse = function(el, color){
  el.style.setProperty('--fx-color', color || 'rgba(233,194,125,.3)');
  el.classList.add('fx-glow','pulse');
  setTimeout(function(){ el.classList.remove('pulse'); }, 4000);
};

/* ── 結果卡片逐一入場 ── */
HLFX.revealCards = function(selector, delay){
  delay = delay || 200;
  var cards = document.querySelectorAll(selector || '.fx-card-enter');
  cards.forEach(function(card, i){
    setTimeout(function(){ card.classList.add('show'); }, i * delay);
  });
};

/* ── 背景色彩漸變 ── */
HLFX.ambientShift = function(color1, color2){
  document.body.style.transition = 'background 2s ease';
  document.body.style.background = 'radial-gradient(ellipse at 30% 30%,'+color1+',transparent 55%),'
    +'radial-gradient(ellipse at 70% 70%,'+color2+',transparent 50%),#05030a';
};

/* ── 文字逐字出現 ── */
HLFX.typewrite = function(el, speed){
  speed = speed || 40;
  var text = el.textContent;
  el.innerHTML = '';
  el.classList.add('fx-typewrite');
  text.split('').forEach(function(ch, i){
    var span = document.createElement('span');
    span.className = 'fx-char';
    span.textContent = ch;
    span.style.animationDelay = (i * speed) + 'ms';
    el.appendChild(span);
  });
};

/* ── 震動回饋（有支援的裝置）── */
HLFX.haptic = function(pattern){
  if (navigator.vibrate) navigator.vibrate(pattern || [30]);
};

/* ── 綜合揭示特效（一鍵觸發）── */
HLFX.reveal = function(opts){
  opts = opts || {};
  var color = opts.color || 'rgba(233,194,125,0.5)';
  var particleType = opts.particles || 'radial';

  // 1. 粒子爆發
  HLFX.particles({ color:color, count:opts.count||50, spread:particleType, duration:opts.duration||3000 });

  // 2. 震動
  HLFX.haptic(opts.haptic || [30,50,30]);

  // 3. 交錯入場
  setTimeout(function(){
    HLFX.stagger('.fx-stagger', opts.staggerDelay || 150);
    HLFX.revealCards('.fx-card-enter', opts.cardDelay || 250);
  }, 300);
};

})();
