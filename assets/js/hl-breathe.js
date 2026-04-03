/**
 * hl-breathe.js - 馥靈之鑰 深呼吸靜心過渡模組
 * 在抽牌前插入 8 秒呼吸動畫，幫助提問者靜心
 * 用法：在 goScene 跳到抽牌場景前，呼叫 hlBreathe(callback)
 */
(function(){
  // 注入 CSS
  var style=document.createElement('style');
  style.textContent=`
.hl-breathe-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;
  background:radial-gradient(ellipse at center,rgba(10,6,20,.92),rgba(5,3,10,.97));
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  opacity:0;transition:opacity .6s;pointer-events:none;}
.hl-breathe-overlay.active{opacity:1;pointer-events:auto;}
.hl-breathe-circle{width:120px;height:120px;border-radius:50%;
  border:2px solid rgba(248,223,165,.3);
  box-shadow:0 0 40px rgba(248,223,165,.08),inset 0 0 30px rgba(248,223,165,.05);
  animation:hlBreathePulse 4s ease-in-out infinite;}
.hl-breathe-text{margin-top:28px;font-size:.95rem;color:rgba(248,223,165,.7);
  letter-spacing:2px;font-family:var(--kai,'LXGW WenKai TC',serif);
  animation:hlBreatheFade 4s ease-in-out infinite;}
.hl-breathe-hint{margin-top:12px;font-size:.78rem;color:rgba(255,255,255,.3);
  letter-spacing:1px;}
@keyframes hlBreathePulse{
  0%,100%{transform:scale(.7);opacity:.4;box-shadow:0 0 20px rgba(248,223,165,.05)}
  50%{transform:scale(1.15);opacity:.9;box-shadow:0 0 60px rgba(248,223,165,.15)}}
@keyframes hlBreatheFade{
  0%,100%{opacity:.4}50%{opacity:1}}
`;
  document.head.appendChild(style);

  // 建立 overlay DOM
  var overlay=document.createElement('div');
  overlay.className='hl-breathe-overlay';
  overlay.innerHTML='<div class="hl-breathe-circle"></div>'+
    '<div class="hl-breathe-text">深呼吸</div>'+
    '<div class="hl-breathe-hint">靜心片刻，準備聆聽</div>';
  document.body.appendChild(overlay);

  /**
   * 顯示呼吸動畫，結束後執行 callback
   * @param {Function} cb - 動畫結束後的回調
   * @param {number} [duration=8000] - 持續毫秒數（預設 8 秒）
   */
  window.hlBreathe=function(cb,duration){
    duration=duration||8000;
    overlay.classList.add('active');
    // 切換文字：吸→吐
    var textEl=overlay.querySelector('.hl-breathe-text');
    var msgs=['深呼吸','慢慢吐氣','再一次，吸','輕輕吐'];
    var idx=0;
    textEl.textContent=msgs[0];
    var msgTimer=setInterval(function(){
      idx=(idx+1)%msgs.length;
      textEl.textContent=msgs[idx];
    },2000);
    setTimeout(function(){
      clearInterval(msgTimer);
      overlay.classList.remove('active');
      setTimeout(function(){if(cb)cb();},600);
    },duration);
  };
})();
