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

/* ═══ 儲存圖片 v5.0（Canvas + Web Share API，業界標準做法）═══ */
/* 參考：https://benkaiser.dev/sharing-images-using-the-web-share-api/ */
/* 參考：https://web.dev/patterns/files/share-files */
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
  var scoreEl=el.querySelector('.gauge-number,.score-number');
  var scoreText=scoreEl?scoreEl.textContent.trim():'';

  /* 偵測深淺色 */
  var isLight=(function(){var bg=getComputedStyle(document.body).backgroundColor;if(!bg||bg==='transparent')return false;var m=bg.match(/\d+/g);return m&&m.length>=3&&(+m[0]+ +m[1]+ +m[2])/3>128;})();

  /* Canvas 手繪分享卡 */
  var W=640,H=Math.min(820,400+(resultDesc?160:0)+(scoreText?80:0));
  var canvas=document.createElement('canvas');
  canvas.width=W;canvas.height=H;
  var ctx=canvas.getContext('2d');

  // 背景
  ctx.fillStyle=isLight?'#fdf7f0':'#0d0917';
  ctx.fillRect(0,0,W,H);
  var grad=ctx.createLinearGradient(0,0,W,H);
  if(isLight){grad.addColorStop(0,'rgba(245,230,208,0.5)');grad.addColorStop(1,'rgba(240,220,200,0.3)');}
  else{grad.addColorStop(0,'rgba(26,16,48,0.5)');grad.addColorStop(1,'rgba(13,9,23,0.3)');}
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);

  // 邊框
  ctx.strokeStyle=isLight?'rgba(184,146,42,0.25)':'rgba(248,223,165,0.15)';
  ctx.lineWidth=2;ctx.strokeRect(8,8,W-16,H-16);

  ctx.textAlign='center';

  // 測驗名稱（小字）
  ctx.font='600 15px sans-serif';
  ctx.fillStyle=isLight?'#8b7a60':'rgba(248,223,165,0.45)';
  ctx.fillText(title,W/2,60);

  // 結果標題（大字）
  ctx.font='bold 30px serif';
  ctx.fillStyle=isLight?'#3a2a1a':'#f8dfa5';
  var titleLines=_hlWrapText(ctx,resultTitle,W-80);
  var ty=110;
  titleLines.forEach(function(line){ctx.fillText(line,W/2,ty);ty+=40;});

  // 分數
  if(scoreText){
    ctx.font='bold 56px serif';
    ctx.fillStyle=isLight?'#b8922a':'#f8dfa5';
    ctx.fillText(scoreText,W/2,ty+40);ty+=70;
  }

  // 描述
  if(resultDesc){
    ctx.font='17px sans-serif';
    ctx.fillStyle=isLight?'#6b5e52':'rgba(248,223,165,0.55)';
    var descLines=_hlWrapText(ctx,resultDesc,W-100);
    ty+=10;descLines.forEach(function(line){ctx.fillText(line,W/2,ty);ty+=26;});
  }

  // 品牌浮水印
  ctx.font='13px sans-serif';
  ctx.fillStyle=isLight?'rgba(139,105,20,0.5)':'rgba(248,223,165,0.4)';
  ctx.fillText('馥靈之鑰 Hour Light  hourlightkey.com',W/2,H-30);

  /* 嘗試用 Web Share API 直接分享圖片（iOS Safari 15+ 原生支援） */
  canvas.toBlob(function(blob){
    if(!blob){_hlFallbackShowImage(canvas);return;}

    var file=new File([blob],'hourlight-result.png',{type:'image/png'});
    var shareData={files:[file],title:title,text:resultTitle+' - '+title+' | hourlightkey.com'};

    if(navigator.canShare&&navigator.canShare(shareData)){
      navigator.share(shareData).catch(function(){
        // 用戶取消分享或不支援，fallback 顯示圖片
        _hlFallbackShowImage(canvas);
      });
    }else{
      // 不支援 Web Share API（桌面瀏覽器等），fallback
      _hlFallbackShowImage(canvas);
    }
  },'image/png');
};

/* Fallback：直接顯示圖片讓用戶長按儲存或下載 */
function _hlFallbackShowImage(canvas){
  var dataUrl=canvas.toDataURL('image/png');
  var isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
  if(!isIOS){
    // 桌面：直接下載
    var link=document.createElement('a');
    link.download='hourlight-result.png';link.href=dataUrl;link.click();
    return;
  }
  // iOS：顯示圖片讓用戶長按儲存
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;-webkit-tap-highlight-color:transparent';
  overlay.innerHTML=
    '<div style="color:#f8dfa5;font-size:.92rem;margin-bottom:14px;text-align:center">長按圖片 → 儲存到相簿 📸</div>'
    +'<img src="'+dataUrl+'" style="max-width:90%;max-height:65vh;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.5)">'
    +'<button onclick="this.parentElement.remove()" style="margin-top:16px;padding:12px 32px;border-radius:50px;background:rgba(248,223,165,.15);border:1px solid rgba(248,223,165,.3);color:#f8dfa5;font-size:.88rem;cursor:pointer;font-family:inherit;min-height:44px">關閉</button>';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  document.body.appendChild(overlay);
}

/* Canvas 文字換行 */
function _hlWrapText(ctx,text,maxW){
  var lines=[];var line='';
  for(var i=0;i<text.length;i++){
    var test=line+text[i];
    if(ctx.measureText(test).width>maxW&&line.length>0){lines.push(line);line=text[i];}
    else{line=test;}
  }
  if(line)lines.push(line);
  return lines.slice(0,4);
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
