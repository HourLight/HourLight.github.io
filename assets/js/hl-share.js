/**
 * 馥靈之鑰 結果分享模組 v3.0
 * 通用於所有測驗/計算器頁面
 * 功能：精緻 Canvas 分享卡、完整文字複製、LINE 分享、Threads 分享
 *
 * 使用方式：在結果按鈕區放入：
 *   <button onclick="saveResultImage()">📥 儲存圖片</button>
 *   <button onclick="copyResult()">📋 複製結果</button>
 *   <button onclick="shareToLine()">💬 分享到 LINE</button>
 *   <button onclick="shareToThreads()">🧵 分享到 Threads</button>
 *
 * v3.0 升級：Retina 解析度、漸層背景、裝飾邊框、圓形分數儀表、
 *           動態高度、個性標籤、品牌 Logo 區、更好的中文換行
 */

/* ═══ 儲存圖片 v6.0（Premium Canvas 分享卡）═══ */
window.saveResultImage=function(){
  var el=document.getElementById('quizResult')
        ||document.getElementById('result-area')
        ||document.getElementById('ra')
        ||document.getElementById('readingDisplay')
        ||document.getElementById('result')
        ||document.getElementById('storyDisplay')
        ||document.querySelector('.quiz-result.active');
  if(!el){alert('請先完成測驗');return;}

  /* ── 擷取結果資訊 ── */
  var title=document.title.replace(/[|｜].*/,'').trim();
  var h2=el.querySelector('h2,h3,.result-title,.result-hero-title,.rh-type,.result-combo-name,.gauge-label,strong');
  var resultTitle=h2?h2.textContent.trim():'你的結果';
  var iconEl=el.querySelector('.result-hero-icon,.ss-icon,.hl-title-icon');
  var resultEmoji=iconEl?iconEl.textContent.trim():'✦';
  var desc=el.querySelector('.result-section-content,.result-hero-sub,.rh-sub,.result-subtitle,p,.result-desc');
  var resultDesc=desc?desc.textContent.trim().substring(0,120):'';
  var scoreEl=el.querySelector('.gauge-number,.score-number');
  var scoreText=scoreEl?scoreEl.textContent.trim():'';
  var subEl=el.querySelector('.result-subtitle,.result-hero-sub,.rh-sub');
  var subText=subEl?subEl.textContent.trim():'';

  /* 擷取個性標籤 */
  var tags=[];
  var tagEls=el.querySelectorAll('.ss-tag,.hl-title-tag-value,.result-tag,.personality-tag');
  tagEls.forEach(function(t){var v=t.textContent.trim();if(v&&v.length<20&&tags.length<4)tags.push(v);});

  /* 擷取維度分數（ocean bars） */
  var dims=[];
  var dimEls=el.querySelectorAll('.ocean-item');
  dimEls.forEach(function(d){
    var label=d.querySelector('.ocean-label');
    var score=d.querySelector('.ocean-score');
    if(label&&score){
      var pct=parseInt(score.textContent);
      if(!isNaN(pct))dims.push({label:label.textContent.trim().replace(/[*]/g,''),pct:pct});
    }
  });
  dims=dims.slice(0,5);

  /* 擷取金句 */
  var quoteEl=el.querySelector('.hl-title-quote,.ss-quote');
  var quoteText=quoteEl?quoteEl.textContent.trim().replace(/[「」]/g,''):'';
  if(quoteText.length>60)quoteText=quoteText.substring(0,58)+'⋯';

  /* ── 偵測深淺色 ── */
  var isLight=(function(){var bg=getComputedStyle(document.body).backgroundColor;if(!bg||bg==='transparent')return false;var m=bg.match(/\d+/g);return m&&m.length>=3&&(+m[0]+ +m[1]+ +m[2])/3>128;})();

  /* ── 計算動態高度 ── */
  var SCALE=2; // Retina
  var W=640;
  var contentH=120; // top padding + quiz name
  contentH+=60; // emoji
  contentH+=50*Math.ceil(resultTitle.length/16); // result title
  if(subText)contentH+=36;
  if(scoreText)contentH+=120; // circular gauge
  if(dims.length>0)contentH+=24+dims.length*32+16;
  if(resultDesc)contentH+=28*Math.ceil(resultDesc.length/28)+20;
  if(tags.length>0)contentH+=50;
  if(quoteText)contentH+=50;
  contentH+=80; // brand footer
  var H=Math.max(480,Math.min(960,contentH));

  /* ── Canvas 建立（Retina 2x）── */
  var canvas=document.createElement('canvas');
  canvas.width=W*SCALE;canvas.height=H*SCALE;
  canvas.style.width=W+'px';canvas.style.height=H+'px';
  var ctx=canvas.getContext('2d');
  ctx.scale(SCALE,SCALE);

  /* ── 背景漸層 ── */
  if(isLight){
    var bgGrad=ctx.createLinearGradient(0,0,W,H);
    bgGrad.addColorStop(0,'#fdf8f0');
    bgGrad.addColorStop(0.5,'#f8edd8');
    bgGrad.addColorStop(1,'#faf2e6');
    ctx.fillStyle=bgGrad;
  }else{
    var bgGrad=ctx.createLinearGradient(0,0,W*0.3,H);
    bgGrad.addColorStop(0,'#0f0a1e');
    bgGrad.addColorStop(0.4,'#120d24');
    bgGrad.addColorStop(1,'#0a0714');
    ctx.fillStyle=bgGrad;
  }
  ctx.fillRect(0,0,W,H);

  /* ── 裝飾光暈 ── */
  var glow=ctx.createRadialGradient(W/2,H*0.35,0,W/2,H*0.35,W*0.6);
  if(isLight){
    glow.addColorStop(0,'rgba(232,196,110,0.12)');
    glow.addColorStop(1,'rgba(232,196,110,0)');
  }else{
    glow.addColorStop(0,'rgba(248,223,165,0.06)');
    glow.addColorStop(1,'rgba(248,223,165,0)');
  }
  ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);

  /* ── 裝飾紋理（菱形網點）── */
  ctx.save();
  ctx.globalAlpha=isLight?0.03:0.02;
  ctx.strokeStyle=isLight?'#b8922a':'#f8dfa5';
  ctx.lineWidth=0.5;
  for(var dx=0;dx<W;dx+=40){
    for(var dy=0;dy<H;dy+=40){
      ctx.beginPath();
      ctx.moveTo(dx,dy-3);ctx.lineTo(dx+3,dy);ctx.lineTo(dx,dy+3);ctx.lineTo(dx-3,dy);
      ctx.closePath();ctx.stroke();
    }
  }
  ctx.restore();

  /* ── 圓角裁切（整張卡圓角效果）── */
  // 先畫外邊框裝飾
  var borderColor=isLight?'rgba(184,146,42,0.3)':'rgba(248,223,165,0.18)';
  var innerBorderColor=isLight?'rgba(184,146,42,0.12)':'rgba(248,223,165,0.08)';

  // 外框
  _hlRoundRect(ctx,6,6,W-12,H-12,12);
  ctx.strokeStyle=borderColor;ctx.lineWidth=1.5;ctx.stroke();

  // 內框
  _hlRoundRect(ctx,14,14,W-28,H-28,8);
  ctx.strokeStyle=innerBorderColor;ctx.lineWidth=0.8;ctx.stroke();

  /* ── 四角裝飾 ── */
  var ornColor=isLight?'rgba(184,146,42,0.35)':'rgba(248,223,165,0.22)';
  _hlDrawCornerOrnament(ctx,22,22,ornColor,1);       // 左上
  _hlDrawCornerOrnament(ctx,W-22,22,ornColor,2);     // 右上
  _hlDrawCornerOrnament(ctx,22,H-22,ornColor,3);     // 左下
  _hlDrawCornerOrnament(ctx,W-22,H-22,ornColor,4);   // 右下

  /* ── 內容繪製 ── */
  ctx.textAlign='center';
  var y=52;

  // 測驗名稱（小字，上方）
  ctx.font='500 13px "Noto Serif TC",serif';
  ctx.fillStyle=isLight?'rgba(139,122,96,0.7)':'rgba(248,223,165,0.4)';
  ctx.fillText('✦  '+title+'  ✦',W/2,y);
  y+=10;

  // 分隔細線
  ctx.beginPath();
  ctx.moveTo(W/2-60,y);ctx.lineTo(W/2+60,y);
  ctx.strokeStyle=isLight?'rgba(184,146,42,0.2)':'rgba(248,223,165,0.12)';
  ctx.lineWidth=0.8;ctx.stroke();
  y+=30;

  // Emoji 圖示（大）
  ctx.font='44px sans-serif';
  ctx.fillText(resultEmoji,W/2,y+10);
  y+=50;

  // 結果標題（大字）
  ctx.font='bold 28px "Noto Serif TC",serif';
  ctx.fillStyle=isLight?'#3a2a1a':'#f8dfa5';
  var titleLines=_hlWrapText(ctx,resultTitle,W-100);
  titleLines.forEach(function(line){ctx.fillText(line,W/2,y);y+=38;});

  // 副標題
  if(subText){
    ctx.font='16px "Noto Serif TC",serif';
    ctx.fillStyle=isLight?'rgba(100,80,55,0.7)':'rgba(248,223,165,0.55)';
    var subLines=_hlWrapText(ctx,subText,W-120);
    subLines.slice(0,2).forEach(function(line){ctx.fillText(line,W/2,y);y+=24;});
    y+=8;
  }

  // 圓形分數儀表
  if(scoreText){
    y+=10;
    var gaugeX=W/2,gaugeY=y+42,gaugeR=38;
    var scoreVal=parseInt(scoreText);
    var scoreRatio=(!isNaN(scoreVal)&&scoreVal<=100)?scoreVal/100:0.75;

    // 底圈
    ctx.beginPath();
    ctx.arc(gaugeX,gaugeY,gaugeR,-Math.PI*0.75,Math.PI*0.75);
    ctx.strokeStyle=isLight?'rgba(184,146,42,0.15)':'rgba(248,223,165,0.1)';
    ctx.lineWidth=6;ctx.lineCap='round';ctx.stroke();

    // 分數弧
    var startAngle=-Math.PI*0.75;
    var endAngle=startAngle+(Math.PI*1.5)*scoreRatio;
    ctx.beginPath();
    ctx.arc(gaugeX,gaugeY,gaugeR,startAngle,endAngle);
    var arcGrad=ctx.createLinearGradient(gaugeX-gaugeR,gaugeY,gaugeX+gaugeR,gaugeY);
    if(isLight){arcGrad.addColorStop(0,'#b8922a');arcGrad.addColorStop(1,'#d4a832');}
    else{arcGrad.addColorStop(0,'#e9c27d');arcGrad.addColorStop(1,'#f8dfa5');}
    ctx.strokeStyle=arcGrad;ctx.lineWidth=6;ctx.lineCap='round';ctx.stroke();

    // 分數文字
    ctx.font='bold 26px "Noto Serif TC",serif';
    ctx.fillStyle=isLight?'#b8922a':'#f8dfa5';
    ctx.fillText(scoreText,gaugeX,gaugeY+9);

    y+=100;
  }

  // 維度長條圖
  if(dims.length>0){
    y+=4;
    var barStartX=80,barEndX=W-80,barW=barEndX-barStartX;
    ctx.textAlign='left';
    dims.forEach(function(d){
      // 標籤
      ctx.font='13px sans-serif';
      ctx.fillStyle=isLight?'rgba(100,80,55,0.7)':'rgba(248,223,165,0.5)';
      var dimLabel=d.label.length>12?d.label.substring(0,12)+'⋯':d.label;
      ctx.fillText(dimLabel,barStartX,y);

      // 百分比
      ctx.textAlign='right';
      ctx.fillText(d.pct+'%',barEndX,y);
      ctx.textAlign='left';

      // 長條底
      y+=6;
      _hlRoundRect(ctx,barStartX,y,barW,8,4);
      ctx.fillStyle=isLight?'rgba(184,146,42,0.1)':'rgba(248,223,165,0.06)';
      ctx.fill();

      // 長條填充
      var fillW=Math.max(8,barW*(d.pct/100));
      var barGrad=ctx.createLinearGradient(barStartX,y,barStartX+fillW,y);
      if(isLight){barGrad.addColorStop(0,'#d4a832');barGrad.addColorStop(1,'#b8922a');}
      else{barGrad.addColorStop(0,'#e9c27d');barGrad.addColorStop(1,'#f8dfa5');}
      _hlRoundRect(ctx,barStartX,y,fillW,8,4);
      ctx.fillStyle=barGrad;ctx.fill();

      y+=22;
    });
    y+=8;
  }

  ctx.textAlign='center';

  // 描述文字
  if(resultDesc){
    y+=4;
    ctx.font='15px sans-serif';
    ctx.fillStyle=isLight?'rgba(100,80,55,0.65)':'rgba(248,223,165,0.45)';
    var descLines=_hlWrapText(ctx,resultDesc,W-100);
    descLines.forEach(function(line){ctx.fillText(line,W/2,y);y+=24;});
    y+=4;
  }

  // 個性標籤
  if(tags.length>0){
    y+=8;
    var tagStr=tags.join(' · ');
    ctx.font='13px sans-serif';
    var tagW=ctx.measureText(tagStr).width+32;
    var tagX=W/2-tagW/2;

    // 標籤底框
    _hlRoundRect(ctx,tagX,y-14,tagW,26,13);
    ctx.fillStyle=isLight?'rgba(184,146,42,0.08)':'rgba(248,223,165,0.06)';
    ctx.fill();
    _hlRoundRect(ctx,tagX,y-14,tagW,26,13);
    ctx.strokeStyle=isLight?'rgba(184,146,42,0.2)':'rgba(248,223,165,0.12)';
    ctx.lineWidth=0.8;ctx.stroke();

    ctx.fillStyle=isLight?'rgba(139,105,20,0.65)':'rgba(248,223,165,0.55)';
    ctx.fillText(tagStr,W/2,y+2);
    y+=30;
  }

  // 金句
  if(quoteText){
    y+=4;
    ctx.font='italic 14px "Noto Serif TC",serif';
    ctx.fillStyle=isLight?'rgba(139,105,20,0.5)':'rgba(248,223,165,0.35)';
    var qLines=_hlWrapText(ctx,'「'+quoteText+'」',W-100);
    qLines.slice(0,2).forEach(function(line){ctx.fillText(line,W/2,y);y+=22;});
  }

  /* ── 品牌區塊（底部）── */
  var footerY=H-55;

  // 分隔線
  ctx.beginPath();
  ctx.moveTo(W/2-100,footerY);ctx.lineTo(W/2-8,footerY);
  ctx.moveTo(W/2+8,footerY);ctx.lineTo(W/2+100,footerY);
  ctx.strokeStyle=isLight?'rgba(184,146,42,0.2)':'rgba(248,223,165,0.12)';
  ctx.lineWidth=0.8;ctx.stroke();

  // 中間小鑽石
  ctx.fillStyle=isLight?'rgba(184,146,42,0.3)':'rgba(248,223,165,0.2)';
  ctx.beginPath();
  ctx.moveTo(W/2,footerY-4);ctx.lineTo(W/2+4,footerY);ctx.lineTo(W/2,footerY+4);ctx.lineTo(W/2-4,footerY);
  ctx.closePath();ctx.fill();

  // 品牌名
  footerY+=22;
  ctx.font='600 14px "Noto Serif TC",serif';
  ctx.fillStyle=isLight?'rgba(139,105,20,0.6)':'rgba(248,223,165,0.45)';
  ctx.fillText('馥靈之鑰 Hour Light',W/2,footerY);

  // 網址
  footerY+=18;
  ctx.font='12px sans-serif';
  ctx.fillStyle=isLight?'rgba(139,105,20,0.4)':'rgba(248,223,165,0.3)';
  ctx.fillText('hourlightkey.com  ✦  讀懂自己，活對人生',W/2,footerY);

  /* ── Web Share API 分享或 Fallback ── */
  canvas.toBlob(function(blob){
    if(!blob){_hlFallbackShowImage(canvas);return;}

    var file=new File([blob],'hourlight-result.png',{type:'image/png'});
    var shareData={files:[file],title:title,text:resultTitle+' - '+title+' | hourlightkey.com'};

    if(navigator.canShare&&navigator.canShare(shareData)){
      navigator.share(shareData).catch(function(){
        _hlFallbackShowImage(canvas);
      });
    }else{
      _hlFallbackShowImage(canvas);
    }
  },'image/png');
};

/* ── 圓角矩形輔助 ── */
function _hlRoundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

/* ── 四角裝飾繪製 ── */
function _hlDrawCornerOrnament(ctx,cx,cy,color,corner){
  ctx.save();
  ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.lineCap='round';
  var L=16; // arm length
  var S=6;  // small tick

  // corner: 1=TL, 2=TR, 3=BL, 4=BR
  var dx=(corner===1||corner===3)?1:-1;
  var dy=(corner===1||corner===2)?1:-1;

  // L-shaped bracket
  ctx.beginPath();
  ctx.moveTo(cx,cy+dy*L);
  ctx.lineTo(cx,cy);
  ctx.lineTo(cx+dx*L,cy);
  ctx.stroke();

  // Small diamond at corner point
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(cx,cy-3);ctx.lineTo(cx+3,cy);ctx.lineTo(cx,cy+3);ctx.lineTo(cx-3,cy);
  ctx.closePath();ctx.fill();

  // Small tick marks
  ctx.beginPath();
  ctx.moveTo(cx+dx*S,cy+dy*2);ctx.lineTo(cx+dx*S,cy+dy*S);
  ctx.stroke();

  ctx.restore();
}

/* ── Fallback：直接顯示圖片讓用戶長按儲存或下載 ── */
function _hlFallbackShowImage(canvas){
  var dataUrl=canvas.toDataURL('image/png');
  var isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
  if(!isIOS){
    var link=document.createElement('a');
    link.download='hourlight-result.png';link.href=dataUrl;link.click();
    return;
  }
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;-webkit-tap-highlight-color:transparent';
  overlay.innerHTML=
    '<div style="color:#f8dfa5;font-size:.92rem;margin-bottom:14px;text-align:center">長按圖片 → 儲存到相簿 📸</div>'
    +'<img src="'+dataUrl+'" style="max-width:90%;max-height:65vh;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.5)">'
    +'<button onclick="this.parentElement.remove()" style="margin-top:16px;padding:12px 32px;border-radius:50px;background:rgba(248,223,165,.15);border:1px solid rgba(248,223,165,.3);color:#f8dfa5;font-size:.88rem;cursor:pointer;font-family:inherit;min-height:44px">關閉</button>';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  document.body.appendChild(overlay);
}

/* ── Canvas 文字換行（改良版，處理長中文） ── */
function _hlWrapText(ctx,text,maxW){
  if(!text)return[];
  var lines=[];var line='';
  // 中文斷行：逐字元，遇到標點不放行首
  var noBOL='，。、！？；：）」』】》〉～…—';
  for(var i=0;i<text.length;i++){
    var ch=text[i];
    var test=line+ch;
    if(ctx.measureText(test).width>maxW&&line.length>0){
      // 檢查下一個字是否為不可放行首的標點
      if(i+1<text.length&&noBOL.indexOf(text[i+1])>=0){
        line+=ch;continue;
      }
      lines.push(line);line=ch;
    }else{
      line=test;
    }
  }
  if(line)lines.push(line);
  return lines.slice(0,5);
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
  // 手機用 line:// 協議喚起 APP，電腦 fallback 網頁版
  var lineMsg = t + '\n🔗 ' + url;
  var lineAppUrl = 'https://line.me/R/share?text=' + encodeURIComponent(lineMsg);
  window.open(lineAppUrl, '_blank');
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
  var insight=el.querySelector('.result-insight,.result-body,.palmInsight,.result-desc,.analysis-text,.hl-bestie-opener,.report-text,.result-section-content');
  var gift=el.querySelector('.hiddenGift,.gift-shadow-text,.result-gift,.result-strength');
  var shadow=el.querySelector('.shadowSide,.result-shadow,.result-weakness');

  var openers=[
    '好啦我承認我又在玩心理測驗了',
    '被推坑測了這個，結果準到我不敢看',
    '半夜測這個差點哭出來',
    '朋友叫我測的，結果比算命還準',
    '剛測完這個，有點被說中的感覺',
    '本來不信的，結果看完沉默了三秒',
    '這個測驗讓我重新認識了自己',
    '分享一下我的測驗結果，太準了吧',
    '做完這個測驗突然理解了很多事',
    '推薦大家測這個，會看見自己沒注意到的地方',
    '每次做完心理測驗都覺得被偷看日記',
    '這個測驗我做了三次，每次結果都一樣'
  ];
  var opener=openers[Math.floor(Math.random()*openers.length)];
  var t=opener+' 🔮\n\n';

  // 結果類型
  if(hero){
    var heroText=hero.textContent.trim();
    t+='我的結果是「'+heroText+'」\n';
  }
  if(sub){
    var subT=sub.textContent.trim();
    if(subT)t+='「'+subT+'」\n';
  }
  t+='\n';

  // 洞察段落（截取前 80 字）
  if(insight){
    var insightText=insight.textContent.trim().replace(/\s+/g,' ');
    if(insightText.length>80)insightText=insightText.substring(0,80)+'⋯';
    if(insightText)t+=insightText+'\n\n';
  }
  // 天賦或陰影
  if(gift){
    var giftText=gift.textContent.trim();
    if(giftText.length>50)giftText=giftText.substring(0,50)+'⋯';
    if(giftText)t+='隱藏天賦：'+giftText+'\n';
  }
  if(shadow){
    var shadowText=shadow.textContent.trim();
    if(shadowText.length>50)shadowText=shadowText.substring(0,50)+'⋯';
    if(shadowText)t+='要小心的：'+shadowText+'\n';
  }
  t+='\n你也來測測看，保證被戳到 💜\n\n';

  // 動態 hashtags
  var cleanTitle=title.replace(/[｜|].*$/,'').replace(/[\s\-]/g,'').trim();
  var hashtags='#馥靈之鑰 #'+cleanTitle+' #心理測驗';
  // 根據測驗類型追加標籤
  var url=location.href.toLowerCase();
  if(url.indexOf('shadow')>=0||url.indexOf('dark')>=0)hashtags+=' #影子人格 #自我覺察';
  else if(url.indexOf('love')>=0||url.indexOf('attach')>=0||url.indexOf('relationship')>=0)hashtags+=' #愛情 #感情測驗';
  else if(url.indexOf('career')>=0||url.indexOf('riasec')>=0||url.indexOf('strengths')>=0)hashtags+=' #職場 #天賦探索';
  else if(url.indexOf('stress')>=0||url.indexOf('burnout')>=0||url.indexOf('anxiety')>=0)hashtags+=' #壓力管理 #身心覺察';
  else if(url.indexOf('grit')>=0||url.indexOf('eq')>=0||url.indexOf('resilience')>=0)hashtags+=' #心理韌性 #成長';
  else if(url.indexOf('mbti')>=0||url.indexOf('ocean')>=0||url.indexOf('disc')>=0)hashtags+=' #人格測驗 #了解自己';
  else if(url.indexOf('oil')>=0||url.indexOf('aroma')>=0||url.indexOf('scent')>=0)hashtags+=' #精油 #芳療';
  else hashtags+=' #自我覺察 #了解自己';
  t+=hashtags;

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
