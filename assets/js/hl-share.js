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

/* ═══ 儲存圖片 ═══ */
window.saveResultImage=function(){
  var el=document.getElementById('quizResult')
        ||document.getElementById('result-area')
        ||document.getElementById('ra')
        ||document.getElementById('readingDisplay')
        ||document.getElementById('result')
        ||document.getElementById('storyDisplay')
        ||document.querySelector('.quiz-result.active');
  if(!el){alert('請先完成測驗');return;}
  if(typeof html2canvas==='undefined'){alert('圖片功能載入中，請稍後再試');return;}

  /* 載入提示 */
  var toast=document.createElement('div');
  toast.textContent='🎨 正在生成圖片⋯';
  toast.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'
    +'background:rgba(13,9,23,0.97);color:#f8dfa5;padding:16px 28px;'
    +'border-radius:12px;font-size:0.9rem;z-index:99999;'
    +'border:1px solid rgba(248,223,165,0.3);pointer-events:none';
  document.body.appendChild(toast);

  html2canvas(el,{
    scale:2,
    useCORS:true,
    allowTaint:true,
    backgroundColor:'#0d0917',
    logging:false,
    imageTimeout:0,
    removeContainer:true,
    onclone:function(doc,clone){
      /* 強制給截圖元素一個不透明深色底 */
      clone.style.cssText+=(clone.style.cssText?';':'')
        +'background:#0d0917!important;'
        +'padding:28px 24px!important;'
        +'border-radius:20px!important;'
        +'max-width:600px!important;'
        +'margin:0!important;'
        +'box-sizing:border-box!important;';

      /* 移除 backdrop-filter（html2canvas 不支援） */
      var all=clone.querySelectorAll('*');
      for(var i=0;i<all.length;i++){
        var cs=all[i].style;
        if(cs.backdropFilter||cs.webkitBackdropFilter){
          cs.backdropFilter='none';
          cs.webkitBackdropFilter='none';
        }
      }
      var st=doc.createElement('style');
      st.textContent='*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}';
      doc.head.appendChild(st);

      /* 品牌浮水印（金字） */
      var wm=doc.createElement('div');
      wm.style.cssText='text-align:center;padding:18px 0 6px;'
        +'font-size:11px;color:rgba(248,223,165,0.7);'
        +'letter-spacing:2.5px;font-family:sans-serif;';
      wm.textContent='✦ 馥靈之鑰 Hour Light ✦ hourlightkey.com';
      clone.appendChild(wm);
    }
  }).then(function(canvas){
    document.body.removeChild(toast);
    var title=document.title.replace(/[|｜].*/,'').trim().replace(/\s+/g,'_');
    var link=document.createElement('a');
    link.download='馥靈之鑰_'+title+'_'+new Date().toLocaleDateString('sv-SE')+'.png';
    link.href=canvas.toDataURL('image/png');
    link.click();
  }).catch(function(e){
    document.body.removeChild(toast);
    console.warn('html2canvas error:',e);
    alert('圖片生成失敗，請改用複製文字功能');
  });
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
