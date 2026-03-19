// ══════════════════════════════════════════
// 馥靈之鑰｜hl-aroma-fx.js v1.0
// 全站香氣渲染視覺效果
// 精油分子粒子 + 觸碰擴散 + 氣味漣漪
// ══════════════════════════════════════════
(function(){
'use strict';

// ── 偵測效能，低端裝置不跑 ──
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
if(isLowEnd) return; // 低端裝置跳過

// ── 設定 ──
var PARTICLE_COUNT = isMobile ? 12 : 22;
var RIPPLE_LIFE = 1200; // ms

// ── 精油色彩調色盤（真實精油萃取色）──
var AROMA_COLORS = [
  'rgba(248,223,165,',  // 乳香金
  'rgba(200,170,210,',  // 薰衣草紫
  'rgba(180,220,180,',  // 茶樹綠
  'rgba(255,200,180,',  // 玫瑰粉
  'rgba(255,210,140,',  // 甜橙橘
  'rgba(210,190,160,',  // 檀香棕
  'rgba(180,200,220,',  // 尤加利藍
  'rgba(220,200,170,',  // 廣藿香土
];

// ══════ 1. 精油分子粒子 ══════
var canvas = document.createElement('canvas');
canvas.id = 'hl-aroma-canvas';
canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;opacity:.4';
document.body.appendChild(canvas);
var ctx = canvas.getContext('2d');

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// 粒子
var particles = [];
function Particle(){
  this.reset();
}
Particle.prototype.reset = function(){
  this.x = Math.random() * canvas.width;
  this.y = Math.random() * canvas.height;
  this.size = Math.random() * 2.5 + 0.8;
  this.speedX = (Math.random() - 0.5) * 0.3;
  this.speedY = -Math.random() * 0.4 - 0.1; // 向上飄（像蒸氣）
  this.opacity = Math.random() * 0.4 + 0.1;
  this.fadeSpeed = Math.random() * 0.003 + 0.001;
  this.color = AROMA_COLORS[Math.floor(Math.random() * AROMA_COLORS.length)];
  this.life = Math.random() * 200 + 100;
  this.age = 0;
  // 微微搖擺（像氣味分子擴散）
  this.wobbleSpeed = Math.random() * 0.02 + 0.01;
  this.wobbleAmp = Math.random() * 1.5 + 0.5;
  this.wobbleOffset = Math.random() * Math.PI * 2;
};
Particle.prototype.update = function(){
  this.age++;
  this.x += this.speedX + Math.sin(this.age * this.wobbleSpeed + this.wobbleOffset) * this.wobbleAmp * 0.1;
  this.y += this.speedY;
  // 生命週期：淡入→維持→淡出
  var lifeRatio = this.age / this.life;
  if(lifeRatio < 0.2) this.currentOpacity = this.opacity * (lifeRatio / 0.2);
  else if(lifeRatio > 0.7) this.currentOpacity = this.opacity * (1 - (lifeRatio - 0.7) / 0.3);
  else this.currentOpacity = this.opacity;

  if(this.age > this.life || this.y < -20 || this.x < -20 || this.x > canvas.width + 20){
    this.reset();
    this.y = canvas.height + 10; // 從底部重生
  }
};
Particle.prototype.draw = function(){
  if(this.currentOpacity <= 0) return;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
  ctx.fillStyle = this.color + this.currentOpacity + ')';
  ctx.fill();
  // 光暈
  if(this.size > 1.5){
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fillStyle = this.color + (this.currentOpacity * 0.15) + ')';
    ctx.fill();
  }
};

for(var i = 0; i < PARTICLE_COUNT; i++){
  particles.push(new Particle());
}

// ══════ 2. 觸碰擴散漣漪 ══════
var ripples = [];
function addRipple(x, y){
  if(ripples.length > 5) return; // 限制同時漣漪數
  ripples.push({
    x: x, y: y,
    born: Date.now(),
    color: AROMA_COLORS[Math.floor(Math.random() * AROMA_COLORS.length)],
    maxRadius: 60 + Math.random() * 40
  });
}

// 滑鼠移動（桌面）— 節流
var lastRipple = 0;
document.addEventListener('mousemove', function(e){
  var now = Date.now();
  if(now - lastRipple < 800) return;
  lastRipple = now;
  // 只在背景區域觸發，不在按鈕/連結上
  if(e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
  addRipple(e.clientX, e.clientY);
});

// 觸控（手機）
document.addEventListener('touchstart', function(e){
  if(e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
  var t = e.touches[0];
  addRipple(t.clientX, t.clientY);
}, {passive: true});

// ══════ 3. 動畫循環 ══════
var animId;
var isVisible = true;

function animate(){
  if(!isVisible){animId = requestAnimationFrame(animate); return;}
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 粒子
  for(var i = 0; i < particles.length; i++){
    particles[i].update();
    particles[i].draw();
  }

  // 漣漪
  var now = Date.now();
  for(var j = ripples.length - 1; j >= 0; j--){
    var r = ripples[j];
    var age = now - r.born;
    if(age > RIPPLE_LIFE){
      ripples.splice(j, 1);
      continue;
    }
    var progress = age / RIPPLE_LIFE;
    var radius = r.maxRadius * progress;
    var opacity = 0.3 * (1 - progress);

    // 外環
    ctx.beginPath();
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = r.color + opacity + ')';
    ctx.lineWidth = 1.5 * (1 - progress);
    ctx.stroke();

    // 內環（稍微延遲）
    if(progress > 0.1){
      var innerProgress = (progress - 0.1) / 0.9;
      var innerRadius = r.maxRadius * 0.6 * innerProgress;
      ctx.beginPath();
      ctx.arc(r.x, r.y, innerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color + (opacity * 0.5) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 擴散小粒子
    if(progress < 0.5){
      for(var k = 0; k < 3; k++){
        var angle = (k / 3) * Math.PI * 2 + progress * 4;
        var px = r.x + radius * 0.8 * Math.cos(angle);
        var py = r.y + radius * 0.8 * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = r.color + (opacity * 0.8) + ')';
        ctx.fill();
      }
    }
  }

  animId = requestAnimationFrame(animate);
}

// ══════ 4. 頁面可見性控制（省電）══════
document.addEventListener('visibilitychange', function(){
  isVisible = !document.hidden;
});

// ══════ 5. 頁面載入時的「開瓶」擴散 ══════
setTimeout(function(){
  var cx = canvas.width / 2;
  var cy = canvas.height * 0.4;
  addRipple(cx, cy);
  setTimeout(function(){ addRipple(cx - 30, cy + 20); }, 200);
  setTimeout(function(){ addRipple(cx + 40, cy - 10); }, 400);
}, 1000);

// 啟動
animate();

})();
