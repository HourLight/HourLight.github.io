/**
 * 馥靈之鑰 AI 即時解讀模組 v2.0
 * 
 * 通用模組：自動偵測頁面上的「複製 AI 指令」按鈕，在旁邊加上「AI 即時解讀」。
 * 支援三種常見寫法：
 *   A) id="copyAIBtn" + window.aiTxt
 *   B) onclick="copyAI()" + window._ai
 *   C) onclick="copyAIPrompt()" + 函數內組裝
 */
(function(){
  'use strict';
  var API_URL = 'https://app.hourlightkey.com/api/ai-reading';

  function init(){
    // 找所有可能的「複製 AI」按鈕
    var target = document.getElementById('copyAIBtn')
      || document.querySelector('[onclick*="copyAI"]')
      || document.querySelector('[onclick*="copyAIPrompt"]')
      || document.querySelector('button.cp-main[onclick*="copyResult"]');

    if (!target) return;

    // 建立 AI 即時解讀按鈕
    var btn = document.createElement('button');
    btn.id = 'hlAIReadBtn';
    btn.innerHTML = '🤖 AI 即時深度解讀';
    btn.style.cssText = 'display:inline-flex;align-items:center;gap:8px;padding:12px 24px;'
      + 'background:linear-gradient(135deg,rgba(233,194,125,.18),rgba(92,58,99,.12));'
      + 'border:1.5px solid rgba(233,194,125,.45);border-radius:12px;color:#f8dfa5;'
      + 'font-size:.92rem;cursor:pointer;font-family:inherit;letter-spacing:.08em;'
      + 'transition:all .3s;margin:8px;';
    btn.onmouseenter = function(){ this.style.borderColor='rgba(233,194,125,.7)';this.style.background='linear-gradient(135deg,rgba(233,194,125,.25),rgba(92,58,99,.18))'; };
    btn.onmouseleave = function(){ this.style.borderColor='rgba(233,194,125,.45)';this.style.background='linear-gradient(135deg,rgba(233,194,125,.18),rgba(92,58,99,.12))'; };

    // 插入按鈕
    target.parentNode.insertBefore(btn, target.nextSibling);

    // 建立結果容器
    var box = document.createElement('div');
    box.id = 'hlAIResult';
    box.style.cssText = 'display:none;margin:24px 0;';
    box.innerHTML = '<div id="hlAIBox" style="background:rgba(233,194,125,.03);border:1px solid rgba(233,194,125,.1);'
      + 'border-radius:16px;padding:28px 24px;line-height:2.3;white-space:pre-wrap;font-size:.87rem;'
      + 'color:#f0e8d8;font-family:\'LXGW WenKai TC\',\'Noto Serif TC\',serif;max-height:80vh;overflow-y:auto"></div>'
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:16px">'
      + '<button onclick="window._hlCopyResult()" style="padding:10px 20px;background:none;border:1px solid rgba(233,194,125,.2);'
      + 'border-radius:50px;color:#f8dfa5;font-size:.9rem;cursor:pointer;font-family:inherit">📋 複製解讀結果</button>'
      + '<a href="https://lin.ee/RdQBFAN" target="_blank" rel="noopener" style="padding:10px 20px;'
      + 'background:none;border:1px solid rgba(233,194,125,.2);border-radius:50px;color:#f8dfa5;'
      + 'font-size:.9rem;text-decoration:none;font-family:inherit">💬 預約覺察師深度陪伴</a></div>';

    // 找位置插入
    var container = target.closest('.ai-box') || target.closest('.ff-actions') || target.closest('.hl-v2-btn-row') || target.closest('.btn-row') || target.parentNode;
    if (container && container.parentNode) {
      container.parentNode.insertBefore(box, container.nextSibling);
    } else {
      target.parentNode.appendChild(box);
    }

    // 動畫 CSS
    if (!document.getElementById('hlAICSS')){
      var s=document.createElement('style');s.id='hlAICSS';
      s.textContent='@keyframes hlAIB{0%,100%{transform:scale(.8);opacity:.3}50%{transform:scale(1.2);opacity:.7}}';
      document.head.appendChild(s);
    }

    btn.onclick = function(){ doReading(btn); };
  }

  // 取得 AI prompt（支援多種命名）
  function getPrompt(){
    // 方式 A: window.aiTxt（draw-hl 等）
    if (typeof window.aiTxt === 'string' && window.aiTxt.length > 50) return window.aiTxt;
    // 方式 B: window._ai（bazi, astro, ziwei 等）
    if (typeof window._ai === 'string' && window._ai.length > 50) return window._ai;
    // 方式 C: window._aiPrompt（部分頁面）
    if (typeof window._aiPrompt === 'string' && window._aiPrompt.length > 50) return window._aiPrompt;
    // 方式 D: 從頁面上的 <pre> 抓 AI 指令
    var pres = document.querySelectorAll('pre[id^="ai"]');
    for (var i=0; i<pres.length; i++){
      if (pres[i].textContent.length > 100) return pres[i].textContent;
    }
    // 方式 E: 找最長的 AI 指令 pre
    var allPre = document.querySelectorAll('.ai-box pre, .ff-ai-prompt pre, #aiPromptBox');
    for (var j=0; j<allPre.length; j++){
      if (allPre[j].textContent.length > 100) return allPre[j].textContent;
    }
    return '';
  }

  async function doReading(btn){
    var prompt = getPrompt();
    if (!prompt || prompt.length < 50){
      alert('請先完成計算或抽牌，再使用 AI 解讀。');
      return;
    }

    btn.disabled=true; btn.textContent='🔮 解讀中，請稍候...'; btn.style.opacity='.5';
    var rd=document.getElementById('hlAIResult');
    var rb=document.getElementById('hlAIBox');
    if (!rd || !rb) return;
    rd.style.display='block';
    rb.innerHTML='<div style="text-align:center;color:#fad5d3;font-family:\'LXGW WenKai TC\',serif;line-height:2.4">'
      +'<div style="width:40px;height:40px;border-radius:50%;border:1px solid rgba(240,181,179,.2);margin:0 auto 16px;animation:hlAIB 4s ease-in-out infinite"></div>'
      +'正在為你整合解讀中⋯⋯<br>大約需要 30-60 秒</div>';
    rd.scrollIntoView({behavior:'smooth',block:'center'});

    try{
      var pageName=(location.pathname.split('/').pop()||'').replace('.html','');
      var res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt,spread:pageName})});
      if (!res.ok) throw new Error('API error: ' + res.status);
      var data=await res.json();
      rb.textContent=data.reading||data.error||'解讀過程發生問題，請重試或聯繫 LINE 客服。';
      if(typeof window.HL_track==='function') window.HL_track('ai_reading_complete',{tool:pageName});
    }catch(e){
      rb.textContent='連線過程發生問題。請確認網路連線後重試，或直接聯繫 LINE 客服。';
    }
    btn.textContent='✅ 解讀完成';btn.style.opacity='1';
    setTimeout(function(){btn.disabled=false;btn.textContent='🤖 AI 即時深度解讀';},5000);
  }

  window._hlCopyResult=function(){
    var t=document.getElementById('hlAIBox');
    if(!t)return;
    navigator.clipboard.writeText(t.textContent).then(function(){
      var b=document.querySelector('#hlAIResult button');
      if(b){b.textContent='✅ 已複製';setTimeout(function(){b.textContent='📋 複製解讀結果';},2000);}
    });
  };

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(init,1500);});}
  else{setTimeout(init,1500);}
})();
