/**
 * 馥靈之鑰 全站頂部導航 v1.0
 * 自動注入 sticky header，有 site-header/hl-header/ff-topbar 的頁面自動跳過
 * 使用：在 <body> 後或 </body> 前加 <script src="assets/js/hl-topnav.js"></script>
 */
(function(){
  'use strict';

  // 跳過已有頂部導航的頁面
  if (document.querySelector('.site-header, .hl-header, .ff-topbar, #hl-top-nav, header[class*="header"]')) return;

  // 跳過管理/登入頁
  var page = (location.pathname.split('/').pop()||'index.html').split('?')[0];
  var SKIP = ['admin-dashboard.html','member-login.html','member-dashboard.html','app.html'];
  if (SKIP.indexOf(page) > -1) return;

  // CSS
  var css = document.createElement('style');
  css.textContent = `
#hl-top-nav{
  position:sticky;top:0;z-index:9998;
  background:rgba(6,4,14,.92);
  backdrop-filter:blur(18px) saturate(140%);
  -webkit-backdrop-filter:blur(18px) saturate(140%);
  border-bottom:1px solid rgba(240,212,138,.08);
  padding:0 20px;height:52px;
  display:flex;align-items:center;justify-content:space-between;
  box-shadow:0 2px 16px rgba(0,0,0,.3);
  font-family:'Noto Serif TC','Cormorant Garamond',serif;
}
#hl-top-nav a{text-decoration:none;transition:all .25s cubic-bezier(.4,0,.2,1)}
.htn-logo{display:flex;align-items:center;gap:8px;color:#f0d48a;font-size:.92rem;letter-spacing:.12em;font-weight:500;white-space:nowrap;flex-shrink:0}
.htn-logo img{width:28px;height:28px;border-radius:50%;object-fit:cover}
.htn-links{display:flex;align-items:center;gap:6px}
.htn-link{color:rgba(244,240,235,.65);font-size:.72rem;letter-spacing:.06em;padding:6px 10px;border-radius:16px;border:1px solid transparent;white-space:nowrap}
.htn-link:hover{color:#f0d48a;border-color:rgba(240,212,138,.15);background:rgba(240,212,138,.04)}
.htn-link.active{color:#f0d48a;border-color:rgba(240,212,138,.2);background:rgba(240,212,138,.06)}
.htn-menu-btn{display:none;background:none;border:none;color:rgba(244,240,235,.7);cursor:pointer;padding:8px;font-size:1.2rem}
.htn-dropdown{display:none;position:fixed;top:52px;right:0;left:0;z-index:9997;
  background:rgba(6,4,14,.97);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border-bottom:1px solid rgba(240,212,138,.1);padding:12px 16px;
  max-height:70vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.5)}
.htn-dropdown.show{display:block;animation:htnDown .25s ease}
@keyframes htnDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
.htn-dropdown a{display:block;color:rgba(244,240,235,.75);font-size:.85rem;padding:13px 14px;border-radius:10px;text-decoration:none;letter-spacing:.05em;transition:all .2s;min-height:44px;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.htn-dropdown a:hover,.htn-dropdown a.active{color:#f0d48a;background:rgba(240,212,138,.05)}
.htn-dropdown .htn-group{font-size:.7rem;color:rgba(200,188,170,.4);letter-spacing:.12em;padding:14px 14px 6px;text-transform:uppercase}
@media(max-width:768px){
  .htn-links{display:none}
  .htn-menu-btn{display:block}
}
`;
  document.head.appendChild(css);

  // NAV DATA — 上方放品牌 + 關於（逸君 2026/04/10 指示）
  var NAV = [
    {group:'關於', items:[
      {label:'首頁', href:'index.html'},
      {label:'服務項目', href:'services.html'},
      {label:'服務價目', href:'pricing.html'},
      {label:'線上預約', href:'booking.html'},
      {label:'創辦人', href:'founder.html'},
      {label:'著作', href:'book.html'},
    ]},
    {group:'功能', items:[
      {label:'命盤引擎', href:'destiny-engine.html'},
      {label:'智慧抽牌', href:'draw-hl.html'},
      {label:'覺察測驗', href:'quiz-hub.html'},
      {label:'合盤配對', href:'destiny-match.html'},
      {label:'馥靈秘碼', href:'fuling-mima.html'},
      {label:'內在城堡', href:'castle-hub.html'},
    ]},
    {group:'知識學苑', items:[
      {label:'知識學苑', href:'knowledge-hub.html'},
      {label:'芳療園地', href:'aroma-garden.html'},
      {label:'十四經絡', href:'meridian-guide.html'},
      {label:'七脈輪', href:'chakra-guide.html'},
      {label:'五行芳療', href:'five-elements-guide.html'},
      {label:'九紫離火運', href:'nine-purple-fire-guide.html'},
      {label:'水晶覺察', href:'crystal-guide.html'},
      {label:'護膚科學', href:'skincare-science.html'},
      {label:'靈氣入門', href:'reiki-guide.html'},
      {label:'調香入門', href:'blending-guide.html'},
      {label:'NAHA講義', href:'naha-study-guide.html'},
      {label:'國際認證', href:'certification-guide.html'},
      {label:'網站地圖', href:'hourlight-sitemap.html'},
    ]}
  ];

  // Quick links for desktop
  var QUICK = [
    {label:'首頁', href:'index.html'},
    {label:'命盤引擎', href:'destiny-engine.html'},
    {label:'合盤', href:'destiny-match.html'},
    {label:'馥靈秘碼', href:'fuling-mima.html'},
    {label:'抽牌', href:'draw-hl.html'},
    {label:'測驗', href:'quiz-hub.html'},
    {label:'地圖', href:'hourlight-sitemap.html'},
  ];

  // Build
  var nav = document.createElement('div');
  nav.id = 'hl-top-nav';

  // Logo
  var logo = document.createElement('a');
  logo.className = 'htn-logo';
  logo.href = 'index.html';
  logo.innerHTML = '<img src="/LOGO-1.png" alt="" loading="lazy"><span class="htn-logo-text">馥靈之鑰</span>';
  nav.appendChild(logo);

  // Desktop links
  var links = document.createElement('div');
  links.className = 'htn-links';
  QUICK.forEach(function(q){
    var a = document.createElement('a');
    a.className = 'htn-link' + (q.href === page ? ' active' : '');
    a.href = q.href;
    a.textContent = q.label;
    links.appendChild(a);
  });
  nav.appendChild(links);

  // Mobile menu button
  var menuBtn = document.createElement('button');
  menuBtn.className = 'htn-menu-btn';
  menuBtn.innerHTML = '☰';
  menuBtn.setAttribute('aria-label','選單');
  nav.appendChild(menuBtn);

  // Dropdown (mobile)
  var dropdown = document.createElement('div');
  dropdown.className = 'htn-dropdown';
  NAV.forEach(function(group){
    var g = document.createElement('div');
    g.className = 'htn-group';
    g.textContent = group.group;
    dropdown.appendChild(g);
    group.items.forEach(function(item){
      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      if (item.href === page) a.className = 'active';
      dropdown.appendChild(a);
    });
  });

  // Insert nav at top of body
  document.body.insertBefore(nav, document.body.firstChild);
  document.body.appendChild(dropdown);

  // Toggle
  var isOpen = false;
  menuBtn.onclick = function(){
    isOpen = !isOpen;
    dropdown.classList.toggle('show', isOpen);
    menuBtn.innerHTML = isOpen ? '✕' : '☰';
  };

  // Close on link click
  dropdown.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ dropdown.classList.remove('show'); menuBtn.innerHTML='☰'; isOpen=false; });
  });

  // Close on outside click
  document.addEventListener('click', function(e){
    if (isOpen && !dropdown.contains(e.target) && e.target !== menuBtn){
      dropdown.classList.remove('show'); menuBtn.innerHTML='☰'; isOpen=false;
    }
  });

})();

// 全站圖片載入失敗防護（隱藏破圖，避免白屏破版）
(function(){
  function guardImgs(root){
    (root || document).querySelectorAll('img:not([data-hl-guard])').forEach(function(img){
      img.setAttribute('data-hl-guard','1');
      if(!img.hasAttribute('onerror')){
        img.addEventListener('error', function(){ this.style.display='none'; });
      }
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', function(){ guardImgs(); });
  } else {
    guardImgs();
  }
  // 動態插入的圖片也能覆蓋
  if(window.MutationObserver){
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        m.addedNodes.forEach(function(n){
          if(n.nodeType===1){
            if(n.tagName==='IMG') guardImgs(n.parentElement);
            else if(n.querySelectorAll) guardImgs(n);
          }
        });
      });
    }).observe(document.body||document.documentElement,{childList:true,subtree:true});
  }
})();
