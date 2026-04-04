/**
 * 馥靈之鑰 結果分享模組 v2.0
 * 通用於所有測驗/計算器頁面
 * 功能：截圖儲存、完整文字複製、LINE 分享
 *
 * 使用方式：在結果按鈕區放入：
 *   <button onclick="saveResultImage()">📥 儲存圖片</button>
 *   <button onclick="copyResult()">📋 複製結果</button>
 *   <button onclick="shareToLine()">💬 分享到 LINE</button>
 *
 * 依賴：html2canvas（自動載入）
 */
(function(){
  if(typeof html2canvas==='undefined'){
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(s);
  }
})();

/* ═══ 儲存圖片 v3.0（純 DOM 分享卡，不依賴 html2canvas）═══ */
window.saveResultImage=function(){
  var el=document.getElementById('quizResult')
        ||document.getElementById('result-area')
        ||document.getElementById('ra')
        ||document.getElementById('readingDisplay')
        ||document.getElementById('result')
        ||document.getElementById('storyDisplay')
        ||document.querySelector('.quiz-result.active');
  if(!el){alert('請先完成測驗');return;}

  /* 自動偵測深色/淺色主題 */
  var isLight = (function(){
    var bg = getComputedStyle(document.body).backgroundColor;
    if(!bg || bg === 'transparent') return false;
    var m = bg.match(/\d+/g);
    if(!m || m.length < 3) return false;
    return (+m[0] + +m[1] + +m[2]) / 3 > 128;
  })();

  /* 擷取結果文字 */
  var title = document.title.replace(/[|｜].*/,'').trim();
  var resultTitle = '';
  var resultDesc = '';
  var resultIcon = '';

  // 嘗試從結果元素中擷取關鍵資訊
  var h2 = el.querySelector('h2,h3,.result-title,.gauge-label,strong');
  if(h2) resultTitle = h2.textContent.trim();
  var desc = el.querySelector('.result-section-content,p,.result-desc,.desc');
  if(desc) resultDesc = desc.textContent.trim().substring(0, 120) + (desc.textContent.length > 120 ? '...' : '');
  var icon = el.querySelector('.quiz-hero-icon,.result-icon,.gauge-number');
  if(icon) resultIcon = icon.textContent.trim();
  if(!resultIcon) resultIcon = '✦';

  // 分數（如果有的話）
  var scoreEl = el.querySelector('.gauge-number,.score-number,.ocean-score');
  var scoreText = scoreEl ? scoreEl.textContent.trim() : '';

  /* 建立品牌分享卡（純 CSS，不依賴截圖） */
  var cardBg = isLight
    ? 'linear-gradient(135deg,#fdf7f0 0%,#f5e6d0 100%)'
    : 'linear-gradient(135deg,#0d0917 0%,#1a1030 100%)';
  var cardText = isLight ? '#3a2a1a' : '#f8dfa5';
  var cardSub = isLight ? '#8b7a60' : 'rgba(248,223,165,.6)';
  var cardBorder = isLight ? 'rgba(184,146,42,.25)' : 'rgba(248,223,165,.2)';
  var cardAccent = isLight ? '#b8922a' : '#f8dfa5';

  var overlay = document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;overflow-y:auto;-webkit-tap-highlight-color:transparent';

  var cardHtml = '<div id="hlShareCard" style="'
    +'width:320px;max-width:90%;background:'+cardBg+';'
    +'border:1.5px solid '+cardBorder+';border-radius:20px;'
    +'padding:32px 24px;text-align:center;'
    +'box-shadow:0 16px 48px rgba(0,0,0,.3);'
    +'">'
    +'<div style="font-size:3rem;margin-bottom:12px;filter:drop-shadow(0 2px 8px rgba(0,0,0,.15))">'+resultIcon+'</div>'
    +'<div style="font-size:.72rem;letter-spacing:2px;color:'+cardSub+';margin-bottom:8px;text-transform:uppercase">'+title+'</div>'
    +'<div style="font-size:1.3rem;font-weight:700;color:'+cardText+';margin-bottom:8px;line-height:1.4">'+resultTitle+'</div>'
    +(scoreText ? '<div style="font-size:2.5rem;font-weight:800;color:'+cardAccent+';margin-bottom:8px">'+scoreText+'</div>' : '')
    +(resultDesc ? '<div style="font-size:.82rem;color:'+cardSub+';line-height:1.7;margin-bottom:16px;text-align:left">'+resultDesc+'</div>' : '')
    +'<div style="height:1px;background:'+cardBorder+';margin:12px 0"></div>'
    +'<div style="font-size:.68rem;color:'+cardSub+';letter-spacing:1.5px;margin-top:8px">✦ 馥靈之鑰 Hour Light ✦</div>'
    +'<div style="font-size:.6rem;color:'+cardSub+';opacity:.7;margin-top:4px">hourlightkey.com</div>'
    +'</div>';

  overlay.innerHTML =
    '<div style="color:#f8dfa5;font-size:.92rem;margin-bottom:16px;text-align:center">長按卡片 → 截圖分享 📸</div>'
    + cardHtml
    + '<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center">'
    + '<button onclick="hlShareCopyText()" style="padding:10px 20px;border-radius:50px;background:rgba(248,223,165,.15);border:1px solid rgba(248,223,165,.3);color:#f8dfa5;font-size:.82rem;cursor:pointer;font-family:inherit;min-height:44px">📋 複製文字</button>'
    + '<button onclick="hlShareToLine()" style="padding:10px 20px;border-radius:50px;background:rgba(248,223,165,.15);border:1px solid rgba(248,223,165,.3);color:#f8dfa5;font-size:.82rem;cursor:pointer;font-family:inherit;min-height:44px">💬 分享 LINE</button>'
    + '<button onclick="this.closest(\'[style]\').remove()" style="padding:10px 20px;border-radius:50px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:.82rem;cursor:pointer;font-family:inherit;min-height:44px">關閉</button>'
    + '</div>';

  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);

  /* 嘗試用 html2canvas 生成真正的圖片（背景執行，成功才顯示） */
  if(typeof html2canvas !== 'undefined'){
    var card = document.getElementById('hlShareCard');
    if(card){
      setTimeout(function(){
        html2canvas(card,{scale:2,backgroundColor:isLight?'#fdf7f0':'#0d0917',logging:false,useCORS:true}).then(function(canvas){
          var img = document.createElement('img');
          img.src = canvas.toDataURL('image/png');
          img.style.cssText='max-width:90%;max-height:50vh;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5);margin-top:12px;display:block';
          var hint = overlay.querySelector('div');
          if(hint) hint.textContent = '長按圖片 → 儲存到相簿 → 分享 IG 限動 💜';
          card.parentNode.insertBefore(img, card.nextSibling);
          card.style.display = 'none';
        }).catch(function(){});
      }, 300);
    }
  }
};

/* ═══ 複製完整結果 ═══ */
window.copyResult=function(){
  var el=document.getElementById('quizResult')
        ||document.getElementById('result-area')
        ||document.getElementById('ra')
        ||document.getElementById('readingDisplay')
        ||document.getElementById('result')
        ||document.getElementById('storyDisplay')
        ||document.querySelector('.quiz-result.active');
  if(!el){alert('請先完成測驗');return;}

  var title=document.title.replace(/[|｜].*/,'').trim();
  var url=location.href.split('?')[0];

  var hero=el.querySelector('.result-hero-title,.rh-type,.result-title,.witch-name,.past-life-title,.result-combo-name');
  var sub=el.querySelector('.result-hero-sub,.rh-sub,.result-sub,.witch-sub,.result-subtitle');
  var sections=el.querySelectorAll('.result-section,.result-block,.aroma-landing');

  var lines=['【'+title+'】'];
  if(hero) lines.push('\n✦ '+hero.textContent.trim());
  if(sub)  lines.push(sub.textContent.trim());

  if(sections.length){
    sections.forEach(function(s){
      var t=s.querySelector('.result-section-title,.rb-title,.al-label');
      var c=s.querySelector('.result-section-content,.rb-content,.al-text');
      if(t&&c) lines.push('\n► '+t.textContent.trim()+'\n'+c.textContent.trim());
      else if(c) lines.push('\n'+c.textContent.trim());
    });
  }

  if(!hero&&!sub&&sections.length===0){
    var raw=el.textContent.replace(/\s+/g,' ').trim();
    raw=raw.replace(/複製結果|儲存圖片|分享到 LINE|重新測驗|再測一次/g,'').trim();
    lines.push('\n'+raw);
  }

  lines.push('\n🔗 '+url);
  var text=lines.join('\n');
  if(window._resultText&&window._resultText.length>150) text=window._resultText;

  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){
      alert('已複製完整結果！去貼給你的好朋友 ✨');
    }).catch(function(){fallbackCopy(text);});
  }else{
    fallbackCopy(text);
  }
};

function fallbackCopy(text){
  var ta=document.createElement('textarea');
  ta.value=text;ta.style.cssText='position:fixed;top:-9999px';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');alert('已複製完整結果！✨');}
  catch(e){alert('複製失敗，請手動選取結果文字');}
  document.body.removeChild(ta);
}

/* ═══ 分享到 LINE ═══ */
window.shareToLine=function(){
  var el=document.getElementById('quizResult')
        ||document.getElementById('result-area')
        ||document.getElementById('ra')
        ||document.getElementById('readingDisplay')
        ||document.getElementById('result')
        ||document.getElementById('storyDisplay')
        ||document.querySelector('.quiz-result.active');
  if(!el) return;
  var title=document.title.replace(/[|｜].*/,'').trim();
  var url=location.href.split('?')[0];
  var hero=el.querySelector('.result-hero-title,.rh-type,.result-title,.witch-name,.past-life-title,.result-combo-name');
  var sub=el.querySelector('.result-hero-sub,.rh-sub,.result-sub');
  var t='【'+title+'】';
  if(hero) t+='\n✦ '+hero.textContent.trim();
  if(sub)  t+='\n'+sub.textContent.trim();
  window.open('https://social-plugins.line.me/lineit/share?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(t),'_blank');
};

/* ═══ 分享到 Threads（複製文字，不放連結）═══ */
window.shareToThreads=function(){
  var el=document.getElementById('quizResult')
        ||document.getElementById('result-area')
        ||document.getElementById('ra')
        ||document.getElementById('readingDisplay')
        ||document.getElementById('result')
        ||document.getElementById('storyDisplay')
        ||document.querySelector('.quiz-result.active');
  if(!el) return;
  var title=document.title.replace(/[|｜].*/,'').trim();
  var hero=el.querySelector('.result-hero-title,.rh-type,.result-title,.witch-name,.past-life-title,.result-combo-name,.archetype-name');
  var sub=el.querySelector('.result-hero-sub,.rh-sub,.result-sub,.core-line');
  // 抓更多洞察內容
  var insight=el.querySelector('.result-insight,.result-body,.palmInsight,.result-desc,.analysis-text,.hl-bestie-opener,.report-text,.result-section-content');
  var gift=el.querySelector('.hiddenGift,.gift-shadow-text,.result-gift,.result-strength');
  var shadow=el.querySelector('.shadowSide,.result-shadow,.result-weakness');

  var openers=['好啦我承認我又在玩心理測驗了','被推坑測了這個，結果準到我不敢看','半夜測這個差點哭出來','朋友叫我測的，結果比算命還準'];
  var opener=openers[Math.floor(Math.random()*openers.length)];
  var t=opener+' 🔮\n\n';
  if(hero) t+='我的結果是「'+hero.textContent.trim()+'」\n\n';
  if(sub) t+='「'+sub.textContent.trim()+'」\n\n';
  // 加入洞察段落（截取前 80 字）
  if(insight){
    var insightText=insight.textContent.trim().replace(/\s+/g,' ');
    if(insightText.length>80) insightText=insightText.substring(0,80)+'⋯';
    if(insightText) t+=insightText+'\n\n';
  }
  // 加入天賦或陰影（如果有）
  if(gift){
    var giftText=gift.textContent.trim();
    if(giftText.length>50) giftText=giftText.substring(0,50)+'⋯';
    if(giftText) t+='隱藏天賦：'+giftText+'\n';
  }
  if(shadow){
    var shadowText=shadow.textContent.trim();
    if(shadowText.length>50) shadowText=shadowText.substring(0,50)+'⋯';
    if(shadowText) t+='要小心的：'+shadowText+'\n';
  }
  t+='\n你也來測測看，保證被戳到 💜\n\n';
  t+='#馥靈之鑰 #'+title.replace(/[｜|].*$/,'').trim()+' #心理測驗';
  try{
    navigator.clipboard.writeText(t).then(function(){
      var btn=event&&event.target;
      if(btn){btn.textContent='✅ 已複製！貼到 Threads 發文';setTimeout(function(){btn.innerHTML='🧵 分享到 Threads';},3000);}
    });
  }catch(e){
    var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    alert('已複製！貼到 Threads 發文');
  }
};
