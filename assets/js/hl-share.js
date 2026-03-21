/**
 * 馥靈之鑰 結果分享模組 v1.0
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
  // 自動載入 html2canvas
  if(typeof html2canvas==='undefined'){
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(s);
  }
})();

/* ═══ 儲存圖片 ═══ */
window.saveResultImage=function(){
  var el=document.getElementById('quizResult')||document.getElementById('result-area')||document.querySelector('.quiz-result.active');
  if(!el){alert('請先完成測驗');return;}
  if(typeof html2canvas==='undefined'){alert('圖片功能載入中，請稍後再試');return;}
  
  // 顯示載入提示
  var toast=document.createElement('div');
  toast.textContent='🎨 正在生成圖片⋯';
  toast.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(26,16,48,0.95);color:#f8dfa5;padding:16px 28px;border-radius:12px;font-size:0.9rem;z-index:99999;border:1px solid rgba(248,223,165,0.3)';
  document.body.appendChild(toast);
  
  // 截圖設定
  html2canvas(el,{
    scale:2,
    useCORS:true,
    backgroundColor:'#faf5eb',
    logging:false,
    onclone:function(doc){
      // 在截圖版本加上品牌浮水印
      var clone=doc.getElementById(el.id)||doc.querySelector('.quiz-result.active');
      if(clone){
        var wm=doc.createElement('div');
        wm.style.cssText='text-align:center;padding:16px 0 8px;font-size:12px;color:#b8a080;letter-spacing:2px;';
        wm.textContent='✦ 馥靈之鑰 Hour Light ✦ hourlightkey.com';
        clone.appendChild(wm);
      }
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
    alert('圖片生成失敗，請改用複製文字功能');
    console.warn(e);
  });
};

/* ═══ 複製完整結果 ═══ */
window.copyResult=function(){
  var el=document.getElementById('quizResult')||document.getElementById('result-area')||document.querySelector('.quiz-result.active');
  if(!el){alert('請先完成測驗');return;}
  
  var title=document.title.replace(/[|｜].*/,'').trim();
  var url=location.href.split('?')[0];
  
  // 抓主結果
  var hero=el.querySelector('.result-hero-title,.rh-type,.result-title,.witch-name,.past-life-title');
  var sub=el.querySelector('.result-hero-sub,.rh-sub,.result-sub,.witch-sub');
  
  // 抓各區塊（不限字數）
  var sections=el.querySelectorAll('.result-section,.result-block,.aroma-landing');
  
  var lines=['【'+title+'】'];
  if(hero) lines.push('\n✦ '+hero.textContent.trim());
  if(sub) lines.push(sub.textContent.trim());
  
  if(sections.length){
    sections.forEach(function(s){
      var t=s.querySelector('.result-section-title,.rb-title,.al-label');
      var c=s.querySelector('.result-section-content,.rb-content,.al-text');
      if(t&&c) lines.push('\n► '+t.textContent.trim()+'\n'+c.textContent.trim());
      else if(c) lines.push('\n'+c.textContent.trim());
    });
  }
  
  // 如果沒抓到結構化內容，取整段文字
  if(!hero&&!sub&&sections.length===0){
    var raw=el.textContent.replace(/\s+/g,' ').trim();
    // 移除按鈕文字
    raw=raw.replace(/複製結果|儲存圖片|分享到 LINE|重新測驗|再測一次/g,'').trim();
    lines.push('\n'+raw);
  }
  
  lines.push('\n🔗 '+url);
  
  var text=lines.join('\n');
  // 如果頁面有自訂的完整結果文字，優先用
  if(window._resultText&&window._resultText.length>150) text=window._resultText;
  
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){
      alert('已複製完整結果！去貼給你的好朋友 ✨');
    }).catch(function(){
      fallbackCopy(text);
    });
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
  var el=document.getElementById('quizResult')||document.getElementById('result-area')||document.querySelector('.quiz-result.active');
  if(!el) return;
  var title=document.title.replace(/[|｜].*/,'').trim();
  var url=location.href.split('?')[0];
  var hero=el.querySelector('.result-hero-title,.rh-type,.result-title,.witch-name,.past-life-title');
  var sub=el.querySelector('.result-hero-sub,.rh-sub,.result-sub');
  var t='【'+title+'】';
  if(hero) t+='\n✦ '+hero.textContent.trim();
  if(sub) t+='\n'+sub.textContent.trim();
  window.open('https://social-plugins.line.me/lineit/share?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(t),'_blank');
};
