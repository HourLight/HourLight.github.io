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

/* ═══ 儲存圖片 v4.0（Canvas API 手繪分享卡，不依賴 html2canvas）═══ */
window.saveResultImage=function(){
  var el=document.getElementById('quizResult')
        ||document.getElementById('result-area')
        ||document.getElementById('ra')
        ||document.getElementById('readingDisplay')
        ||document.getElementById('result')
        ||document.getElementById('storyDisplay')
        ||document.querySelector('.quiz-result.active');
  if(!el){alert('請先完成測驗');return;}

  /* 擷取結果資訊 */
  var title=document.title.replace(/[|｜].*/,'').trim();
  var h2=el.querySelector('h2,h3,.result-title,.result-hero-title,.rh-type,.gauge-label,strong');
  var resultTitle=h2?h2.textContent.trim():'你的結果';
  var desc=el.querySelector('.result-section-content,.result-hero-sub,.rh-sub,p,.result-desc');
  var resultDesc=desc?desc.textContent.trim().substring(0,100):'';
  var iconEl=el.querySelector('.quiz-hero-icon,.result-icon');
  var resultIcon=iconEl?iconEl.textContent.trim():'✦';
  var scoreEl=el.querySelector('.gauge-number,.score-number');
  var scoreText=scoreEl?scoreEl.textContent.trim():'';

  /* 偵測深淺色主題 */
  var isLight=(function(){var bg=getComputedStyle(document.body).backgroundColor;if(!bg||bg==='transparent')return false;var m=bg.match(/\d+/g);return m&&m.length>=3&&(+m[0]+ +m[1]+ +m[2])/3>128;})();

  /* Canvas 手繪分享卡 */
  var W=640,H=820;
  var canvas=document.createElement('canvas');
  canvas.width=W;canvas.height=H;
  var ctx=canvas.getContext('2d');

  // 背景漸層
  var grad=ctx.createLinearGradient(0,0,W,H);
  if(isLight){grad.addColorStop(0,'#fdf7f0');grad.addColorStop(1,'#f0e0c8');}
  else{grad.addColorStop(0,'#0d0917');grad.addColorStop(1,'#1a1030');}
  ctx.fillStyle=grad;
  ctx.beginPath();
  ctx.roundRect(0,0,W,H,32);
  ctx.fill();

  // 邊框
  ctx.strokeStyle=isLight?'rgba(184,146,42,0.3)':'rgba(248,223,165,0.2)';
  ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(4,4,W-8,H-8,28);ctx.stroke();

  // Icon
  ctx.font='72px serif';
  ctx.textAlign='center';
  ctx.fillStyle=isLight?'#3a2a1a':'#f8dfa5';
  ctx.fillText(resultIcon,W/2,120);

  // 測驗名稱
  ctx.font='16px sans-serif';
  ctx.fillStyle=isLight?'#8b7a60':'rgba(248,223,165,0.5)';
  ctx.fillText(title,W/2,170);

  // 結果標題
  ctx.font='bold 32px serif';
  ctx.fillStyle=isLight?'#3a2a1a':'#f8dfa5';
  var titleLines=wrapText(ctx,resultTitle,W-80);
  var ty=220;
  titleLines.forEach(function(line){ctx.fillText(line,W/2,ty);ty+=42;});

  // 分數（如果有）
  if(scoreText){
    ctx.font='bold 64px serif';
    ctx.fillStyle=isLight?'#b8922a':'#f8dfa5';
    ctx.fillText(scoreText,W/2,ty+50);
    ty+=80;
  }

  // 描述
  if(resultDesc){
    ctx.font='18px sans-serif';
    ctx.fillStyle=isLight?'#6b5e52':'rgba(248,223,165,0.6)';
    var descLines=wrapText(ctx,resultDesc,W-100);
    ty+=20;
    descLines.forEach(function(line){ctx.fillText(line,W/2,ty);ty+=28;});
  }

  // 分隔線
  ty+=20;
  ctx.strokeStyle=isLight?'rgba(184,146,42,0.2)':'rgba(248,223,165,0.15)';
  ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(80,ty);ctx.lineTo(W-80,ty);ctx.stroke();

  // 品牌浮水印
  ctx.font='14px sans-serif';
  ctx.fillStyle=isLight?'rgba(139,105,20,0.6)':'rgba(248,223,165,0.5)';
  ctx.fillText('✦ 馥靈之鑰 Hour Light ✦',W/2,H-60);
  ctx.font='12px sans-serif';
  ctx.fillStyle=isLight?'rgba(139,105,20,0.4)':'rgba(248,223,165,0.3)';
  ctx.fillText('hourlightkey.com',W/2,H-38);

  /* 顯示結果 */
  var dataUrl=canvas.toDataURL('image/png');
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;overflow-y:auto;-webkit-tap-highlight-color:transparent';
  overlay.innerHTML=
    '<div style="color:#f8dfa5;font-size:.92rem;margin-bottom:14px;text-align:center">長按圖片 → 儲存到相簿 📸</div>'
    +'<img src="'+dataUrl+'" style="max-width:90%;max-height:65vh;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.5)">'
    +'<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center">'
    +'<button onclick="copyResult()" style="padding:10px 20px;border-radius:50px;background:rgba(248,223,165,.15);border:1px solid rgba(248,223,165,.3);color:#f8dfa5;font-size:.82rem;cursor:pointer;font-family:inherit;min-height:44px">📋 複製文字</button>'
    +'<button onclick="shareToLine()" style="padding:10px 20px;border-radius:50px;background:rgba(248,223,165,.15);border:1px solid rgba(248,223,165,.3);color:#f8dfa5;font-size:.82rem;cursor:pointer;font-family:inherit;min-height:44px">💬 LINE</button>'
    +'<button onclick="this.closest(\'div[style]\').remove()" style="padding:10px 20px;border-radius:50px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:.82rem;cursor:pointer;font-family:inherit;min-height:44px">關閉</button>'
    +'</div>';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  document.body.appendChild(overlay);
};

/* Canvas 文字換行工具 */
function wrapText(ctx,text,maxW){
  var lines=[];var line='';
  for(var i=0;i<text.length;i++){
    var test=line+text[i];
    if(ctx.measureText(test).width>maxW&&line.length>0){lines.push(line);line=text[i];}
    else{line=test;}
  }
  if(line)lines.push(line);
  return lines.slice(0,4); // 最多4行
}

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
