/**
 * 馥靈之鑰 功能頁統一登入守衛 + 使用追蹤 v3.0
 * 支援八層身分系統，動態讀取 Firestore 權限矩陣
 *
 * 用法：在功能頁 </body> 前加入：
 *   <script src="assets/js/firebase-config.js"></script>
 *   <script src="assets/js/hl-auth-gate.js"
 *     data-tool="draw-hl"
 *     data-tool-name="馥靈抽牌"
 *     data-tool-name-en="HL Card Draw"
 *     data-tool-type="draw">
 *   </script>
 */
(function () {
  'use strict';

  var thisScript = document.currentScript ||
    (function(){ var s=document.getElementsByTagName('script'); return s[s.length-1]; })();

  var TOOL_ID      = thisScript.getAttribute('data-tool')         || location.pathname.replace(/.*\//,'').replace('.html','');
  var TOOL_NAME    = thisScript.getAttribute('data-tool-name')     || document.title;
  var TOOL_NAME_EN = thisScript.getAttribute('data-tool-name-en')  || TOOL_NAME;
  var TOOL_TYPE    = thisScript.getAttribute('data-tool-type')     || 'tool';

  // ── 角色定義（從 firebase-config.js 讀取，fallback 在地）──
  function getRoles()  { return (typeof HL_ROLES  !== 'undefined') ? HL_ROLES  : {}; }
  function getDefaultPerms() { return (typeof HL_DEFAULT_PERMISSIONS !== 'undefined') ? HL_DEFAULT_PERMISSIONS : {}; }

  // ── 雙語文字 ──
  var T = {
    zh: {
      wall_title:  '這裡是會員工具',
      wall_sub:    '免費加入就能使用',
      wall_desc1:  '這個工具只開放給馥靈之鑰會員使用。',
      wall_desc2:  '免費加入，不需信用卡。',
      wall_login:  '🔑 我已有帳號',
      wall_join:   '✨ 免費加入',
      wall_back:   '← 回官網',
      wall_free:   '✦ 免費加入 · 不需信用卡 ✦',
      no_perm_title: '此功能尚未對你的身分開放',
      no_perm_desc:  '你目前的身分是「',
      no_perm_desc2: '」，這個工具暫時沒有開放使用。\n如果你覺得這是個錯誤，請聯絡我們。',
      no_perm_line:  '💬 聯繫馥靈之鑰',
      no_perm_back:  '← 回首頁',
    },
    en: {
      wall_title:  'Member Tool',
      wall_sub:    'Free to join — unlock all tools',
      wall_desc1:  'This tool is available to Hour Light members.',
      wall_desc2:  'Joining is free. No credit card needed.',
      wall_login:  '🔑 Sign In',
      wall_join:   '✨ Join Free',
      wall_back:   '← Back to Home',
      wall_free:   '✦ Free · No credit card required ✦',
      no_perm_title: 'This tool isn\'t available for your role yet',
      no_perm_desc:  'Your current role is "',
      no_perm_desc2: '". This tool isn\'t open to you yet.\nIf you think this is a mistake, please contact us.',
      no_perm_line:  '💬 Contact Hour Light',
      no_perm_back:  '← Back to Home',
    }
  };

  function getLang() {
    try { return (localStorage.getItem('hl-lang')==='en' || document.body.classList.contains('lang-en')) ? 'en' : 'zh'; }
    catch(e){ return 'zh'; }
  }
  function t(k){ var l=getLang(); return (T[l]&&T[l][k])||T.zh[k]||k; }

  var auth, db, _userRole = null, _permMatrix = null;

  // ── 啟動 ──
  function init() {
    if (typeof firebase === 'undefined') {
      var tries=0, timer=setInterval(function(){
        tries++;
        if (typeof firebase !== 'undefined') { clearInterval(timer); boot(); }
        else if (tries > 30) { clearInterval(timer); unlockPage(); injectGuestBadge(); }
      }, 300);
    } else { boot(); }
  }

  function boot() {
    if (!window.FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey==='YOUR_API_KEY') {
      unlockPage(); injectGuestBadge(); return;
    }
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db   = firebase.firestore();

    // ── freeAccess 快速通道：標記免費的工具直接放行，不查矩陣 ──
    var toolDef = (typeof HL_TOOL_PERMISSIONS !== 'undefined') ? HL_TOOL_PERMISSIONS[TOOL_ID] : null;
    var isFreeAccess = toolDef && toolDef.freeAccess === true;

    if (isFreeAccess) {
      unlockPage();
      // 仍偵聽登入狀態：有登入顯示會員 badge，沒登入顯示訪客 badge
      auth.onAuthStateChanged(function(user){
        if (user) { onLoggedIn(user); }
        else       { injectGuestBadge(); }
      });
      return;
    }

    // 先載入權限矩陣（快取），再偵聽登入狀態
    loadPermMatrix().then(function(){ 
      auth.onAuthStateChanged(function(user){
        if (user) { onLoggedIn(user); }
        else       { lockPage(); showLoginWall(); }
      });
    });
  }

  // ── 從 Firestore 載入管理員設定的權限矩陣 ──
  async function loadPermMatrix() {
    _permMatrix = getDefaultPerms(); // 先用預設值
    if (!db) return;
    try {
      var snap = await db.doc('system/permissions').get();
      if (snap.exists) _permMatrix = snap.data();
    } catch(e) {}
  }

  // ── 已登入 ──
  async function onLoggedIn(user) {
    // 取得用戶角色
    var role = 'guest';
    try {
      // 管理員 Email 硬設定
      var adminEmails = (typeof HL_ROLES !== 'undefined' && HL_ROLES.admin) ? HL_ROLES.admin.emails : ['judyanee@gmail.com','info@hourlightkey.com'];
      // 特殊貴賓 Email 硬設定（media curator 等級，無後台權限）
      var vipEmails = (typeof HL_ROLES !== 'undefined' && HL_ROLES.vip_guest && HL_ROLES.vip_guest.emails)
        ? HL_ROLES.vip_guest.emails
        : ['maxinerong17@gmail.com','candywang5266@gmail.com','bird548888@gmail.com','hyukhae8611@gmail.com'];

      if (adminEmails.includes(user.email)) {
        role = 'admin';
      } else if (vipEmails.includes(user.email)) {
        role = 'vip_guest';
      } else {
        var snap = await db.doc('users/'+user.uid).get();
        role = (snap.exists && snap.data().role) ? snap.data().role : 'guest';
      }
    } catch(e) {}
    _userRole = role;

    // 檢查此工具對此角色是否開放
    var allowed = checkPermission(role, TOOL_ID);
    if (!allowed) {
      lockPage();
      showNoPermWall(role);
      return;
    }

    // 通過 → 解鎖頁面
    unlockPage();
    injectMemberBadge(user, role);
    trackUsage(user, role, 'page_enter', { page: TOOL_ID });

    // 暴露給頁面內的追蹤呼叫
    window.HL_track = function(eventType, detail) {
      trackUsage(user, role, eventType, detail||{});
    };
    window.HL_userRole = role;
    window.HL_userId   = user.uid;
    
    // 相容舊版 HLMember
    if (!window.HLMember) {
      window.HLMember = {
        auth: auth, db: db,
        getCurrentUser: function(){ return auth.currentUser; },
        recordDraw: function(cards, spread){
          return trackUsage(user, role, 'draw_complete',{
            cards: Array.isArray(cards)?cards.join(','):cards, spread: spread||'1張'
          });
        },
        recordQuiz: function(qName, result){
          return trackUsage(user, role, 'quiz_complete',{ quizName:qName, result:result });
        }
      };
    }
  }

  // ── 權限檢查 ──
  function checkPermission(role, toolId) {
    var roles = getRoles();
    var roleInfo = roles[role];
    if (!roleInfo) return false;
    // 管理員和設定了 unlimitedAll 的角色直接通過
    if (roleInfo.unlimitedAll || roleInfo.canAccessAdmin) return true;
    // 從矩陣查
    if (_permMatrix && _permMatrix[role] && _permMatrix[role][toolId] !== undefined) {
      return !!_permMatrix[role][toolId];
    }
    // fallback 預設值
    var def = getDefaultPerms();
    if (def[role] && def[role][toolId] !== undefined) return !!def[role][toolId];
    return false;
  }

  // ── 頁面鎖定 ──
  function lockPage() {
    if (document.getElementById('hl-lock-overlay')) return;
    var o = document.createElement('div');
    o.id = 'hl-lock-overlay';
    o.style.cssText = 'position:fixed;inset:0;z-index:99980;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);background:rgba(2,1,6,0.4);pointer-events:none;';
    document.body.appendChild(o);
  }
  function unlockPage() {
    var o = document.getElementById('hl-lock-overlay');
    if (o) o.remove();
    var w = document.getElementById('hl-auth-wall');
    if (w) w.remove();
    var n = document.getElementById('hl-noperm-wall');
    if (n) n.remove();
  }

  // ── 登入牆 ──
  function showLoginWall() {
    if (document.getElementById('hl-auth-wall')) return;
    var wall = document.createElement('div');
    wall.id = 'hl-auth-wall';
    wall.style.cssText = 'position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;';
    wall.innerHTML = AUTH_WALL_CSS + buildLoginWallHTML();
    document.body.appendChild(wall);
    applyCurrLang(wall);
  }

  function buildLoginWallHTML() {
    return [
      '<div class="aw-box">',
      '<div class="aw-icon">🔑</div>',
      '<div class="aw-title"><span class="zh">',t('wall_title'),'</span><span class="en" style="display:none">',T.en.wall_title,'</span></div>',
      '<div class="aw-sub"><span class="zh">',t('wall_sub'),'</span><span class="en" style="display:none">',T.en.wall_sub,'</span></div>',
      '<div class="aw-chip">',TOOL_NAME,(TOOL_NAME_EN&&TOOL_NAME_EN!==TOOL_NAME?' · '+TOOL_NAME_EN:''),'</div>',
      '<div class="aw-desc"><span class="zh">',T.zh.wall_desc1,'<br>',T.zh.wall_desc2,'</span><span class="en" style="display:none">',T.en.wall_desc1,'<br>',T.en.wall_desc2,'</span></div>',
      '<div class="aw-btns">',
        '<button class="aw-btn-login" onclick="location.href=\'member-login.html?redirect=\'+encodeURIComponent(location.href)">',
          '<span class="zh">',T.zh.wall_login,'</span><span class="en" style="display:none">',T.en.wall_login,'</span>',
        '</button>',
        '<button class="aw-btn-reg" onclick="location.href=\'member-login.html?mode=register&redirect=\'+encodeURIComponent(location.href)">',
          '<span class="zh">',T.zh.wall_join,'</span><span class="en" style="display:none">',T.en.wall_join,'</span>',
        '</button>',
      '</div>',
      '<button class="aw-back" onclick="location.href=\'index.html\'">',
        '<span class="zh">',T.zh.wall_back,'</span><span class="en" style="display:none">',T.en.wall_back,'</span>',
      '</button>',
      '<div class="aw-free"><span class="zh">',T.zh.wall_free,'</span><span class="en" style="display:none">',T.en.wall_free,'</span></div>',
      '</div>'
    ].join('');
  }

  // ── 無權限牆 ──
  function showNoPermWall(role) {
    if (document.getElementById('hl-noperm-wall')) return;
    var roles = getRoles();
    var roleInfo = roles[role] || { name: role, icon: '?', color: '#888' };
    var wall = document.createElement('div');
    wall.id = 'hl-noperm-wall';
    wall.style.cssText = 'position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;background:rgba(2,1,6,0.92);backdrop-filter:blur(10px);';
    wall.innerHTML = AUTH_WALL_CSS + [
      '<div class="aw-box">',
      '<div class="aw-icon">',roleInfo.icon,'</div>',
      '<div class="aw-title"><span class="zh">',T.zh.no_perm_title,'</span><span class="en" style="display:none">',T.en.no_perm_title,'</span></div>',
      '<div class="aw-chip" style="background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);">',TOOL_NAME,'</div>',
      '<div class="aw-desc">',
        '<span class="zh">',T.zh.no_perm_desc,'<strong>',roleInfo.name,'</strong>',T.zh.no_perm_desc2,'</span>',
        '<span class="en" style="display:none">',T.en.no_perm_desc,'<strong>',roleInfo.nameEn||roleInfo.name,'</strong>',T.en.no_perm_desc2,'</span>',
      '</div>',
      '<div class="aw-btns">',
        '<a class="aw-btn-login" href="https://lin.ee/OQDB5t6" target="_blank">',
          '<span class="zh">',T.zh.no_perm_line,'</span><span class="en" style="display:none">',T.en.no_perm_line,'</span>',
        '</a>',
        '<a class="aw-btn-reg" href="index.html">',
          '<span class="zh">',T.zh.no_perm_back,'</span><span class="en" style="display:none">',T.en.no_perm_back,'</span>',
        '</a>',
      '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(wall);
    applyCurrLang(wall);
  }

  var AUTH_WALL_CSS = [
    '<style>',
    '#hl-auth-wall,#hl-noperm-wall{background:radial-gradient(ellipse at center,rgba(12,7,26,0.97),rgba(2,1,6,0.99));}',
    '.aw-box{width:min(460px,92vw);background:radial-gradient(ellipse at top,rgba(233,194,125,0.1),transparent 55%),rgba(7,4,18,0.99);border:1px solid rgba(233,194,125,0.28);border-radius:24px;padding:48px 32px 36px;text-align:center;box-shadow:0 40px 80px rgba(0,0,0,0.8);}',
    '.aw-icon{font-size:3rem;margin-bottom:14px;animation:aw-float 3s ease-in-out infinite;}',
    '@keyframes aw-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
    '.aw-title{font-family:"Noto Serif TC",serif;font-size:1.5rem;font-weight:400;color:#e9c27d;letter-spacing:2px;margin-bottom:6px;}',
    '.aw-sub{font-size:0.78rem;color:rgba(233,194,125,0.45);letter-spacing:3px;text-transform:uppercase;margin-bottom:18px;}',
    '.aw-chip{display:inline-block;padding:5px 16px;background:rgba(233,194,125,0.07);border:1px solid rgba(233,194,125,0.18);border-radius:999px;font-size:0.78rem;color:rgba(233,194,125,0.65);letter-spacing:1px;margin-bottom:20px;}',
    '.aw-desc{font-size:0.88rem;color:rgba(193,177,156,0.65);line-height:1.9;margin-bottom:26px;white-space:pre-line;}',
    '.aw-btns{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}',
    '.aw-btn-login{padding:14px;border-radius:999px;background:linear-gradient(135deg,#e9c27d,#cda86e);color:#1a1008;font-size:0.9rem;font-weight:700;letter-spacing:1px;border:none;cursor:pointer;font-family:inherit;text-decoration:none;display:flex;align-items:center;justify-content:center;transition:opacity .2s;}',
    '.aw-btn-login:hover{opacity:.86}',
    '.aw-btn-reg{padding:14px;border-radius:999px;background:rgba(233,194,125,0.06);border:1px solid rgba(233,194,125,0.28);color:#e9c27d;font-size:0.9rem;letter-spacing:1px;cursor:pointer;font-family:inherit;text-decoration:none;display:flex;align-items:center;justify-content:center;transition:background .2s;}',
    '.aw-btn-reg:hover{background:rgba(233,194,125,0.12)}',
    '.aw-back{background:none;border:none;color:rgba(193,177,156,0.35);font-size:0.76rem;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:color .2s;margin-bottom:10px;display:block;}',
    '.aw-back:hover{color:rgba(193,177,156,0.75)}',
    '.aw-free{font-size:0.68rem;color:rgba(233,194,125,0.28);letter-spacing:1.5px;margin-top:6px;}',
    '</style>'
  ].join('');

  // ── 會員 Badge（左上角）──
  function injectMemberBadge(user, role) {
    if (document.getElementById('hl-member-badge')) return;
    var roles    = getRoles();
    var roleInfo = roles[role] || { name: role, icon: '👑', badge: 'linear-gradient(135deg,#e9c27d,#cda86e)', badgeText: '#1a1008' };
    var name     = user.displayName || user.email.split('@')[0];
    var badge    = document.createElement('a');
    badge.id     = 'hl-member-badge';
    badge.href   = 'member-dashboard.html';
    badge.title  = '前往我的城堡';
    badge.style.cssText = [
      'position:fixed;top:18px;left:18px;z-index:9001;',
      'display:flex;align-items:center;gap:8px;',
      'padding:7px 14px 7px 8px;border-radius:999px;',
      'background:rgba(5,3,10,0.9);border:1px solid rgba(233,194,125,0.3);',
      'text-decoration:none;font-size:0.8rem;',
      'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);',
      'transition:all .3s;font-family:inherit;',
      'box-shadow:0 4px 16px rgba(0,0,0,0.4);',
    ].join('');
    var roleChip = '<span style="padding:2px 8px;border-radius:999px;background:'+roleInfo.badge+';color:'+roleInfo.badgeText+';font-size:0.65rem;letter-spacing:0.5px;white-space:nowrap;">'+roleInfo.icon+' '+escHtml(roleInfo.name)+'</span>';
    var avatarHtml = user.photoURL
      ? '<img src="'+user.photoURL+'" style="width:24px;height:24px;border-radius:50%;object-fit:cover;" alt="">'
      : '<span style="width:24px;height:24px;border-radius:50%;background:rgba(233,194,125,0.2);display:flex;align-items:center;justify-content:center;font-size:0.75rem;">'+roleInfo.icon+'</span>';
    badge.innerHTML = avatarHtml + roleChip;
    badge.addEventListener('mouseover', function(){ badge.style.borderColor='rgba(233,194,125,0.6)'; });
    badge.addEventListener('mouseout',  function(){ badge.style.borderColor='rgba(233,194,125,0.3)'; });
    document.body.appendChild(badge);
  }

  // ── 訪客 Badge ──
  function injectGuestBadge() {
    if (document.getElementById('hl-member-badge')) return;
    var b = document.createElement('a');
    b.id   = 'hl-member-badge';
    b.href = 'member-login.html';
    b.style.cssText = 'position:fixed;top:18px;left:18px;z-index:9001;display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:rgba(5,3,10,0.7);border:1px solid rgba(233,194,125,0.18);color:rgba(233,194,125,0.65);text-decoration:none;font-size:0.8rem;backdrop-filter:blur(12px);font-family:inherit;';
    b.innerHTML = '<span>🔑</span><span class="zh">登入</span><span class="en" style="display:none">Sign In</span>';
    document.body.appendChild(b);
    applyCurrLang(b);
  }

  // ── 使用追蹤 → Firestore ──
  function trackUsage(user, role, eventType, detail) {
    if (!db || !user) return Promise.resolve();
    var payload = {
      uid: user.uid, email: user.email, role: role,
      toolId: TOOL_ID, toolName: TOOL_NAME, toolType: TOOL_TYPE,
      eventType: eventType, detail: detail||{},
      url: window.location.href,
      ts:  firebase.firestore.FieldValue.serverTimestamp()
    };
    var globalWrite = db.collection('events').add(payload).catch(function(){});

    if (eventType === 'page_enter') return globalWrite;

    var histPayload = {
      type:      TOOL_TYPE==='draw'?'draw':TOOL_TYPE==='quiz'?'quiz':TOOL_TYPE==='calculator'?'calc':'tool',
      title:     TOOL_NAME + (detail.spread?'（'+detail.spread+'）':''),
      detail:    fmtDetail(detail),
      toolId:    TOOL_ID, page: TOOL_NAME,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      tags:      [TOOL_TYPE, TOOL_ID, role]
    };
    var userWrite = db.collection('users/'+user.uid+'/history').add(histPayload).catch(function(){});
    var counters  = { totalPageViews: firebase.firestore.FieldValue.increment(1), lastSeen: firebase.firestore.FieldValue.serverTimestamp() };
    if (TOOL_TYPE==='draw')        counters.totalDraws    = firebase.firestore.FieldValue.increment(1);
    if (TOOL_TYPE==='quiz')        counters.totalQuizzes  = firebase.firestore.FieldValue.increment(1);
    if (TOOL_TYPE==='calculator')  counters.totalCalcs    = firebase.firestore.FieldValue.increment(1);
    db.doc('users/'+user.uid).set(counters,{merge:true}).catch(function(){});
    return Promise.all([globalWrite, userWrite]);
  }

  function fmtDetail(d) {
    if (!d) return '';
    if (typeof d==='string') return d;
    var p=[];
    if (d.cards)    p.push('牌：'+d.cards);
    if (d.spread)   p.push(d.spread);
    if (d.result)   p.push('結果：'+d.result);
    if (d.quizName) p.push(d.quizName);
    return p.join(' ｜ ')||JSON.stringify(d).substring(0,100);
  }

  function applyCurrLang(el) {
    var isEn = getLang()==='en';
    el.querySelectorAll('.zh').forEach(function(n){ n.style.display=isEn?'none':''; });
    el.querySelectorAll('.en').forEach(function(n){ n.style.display=isEn?'':'none'; });
    new MutationObserver(function(){
      var e = document.body.classList.contains('lang-en');
      el.querySelectorAll('.zh').forEach(function(n){ n.style.display=e?'none':''; });
      el.querySelectorAll('.en').forEach(function(n){ n.style.display=e?'':'none'; });
    }).observe(document.body,{attributes:true,attributeFilter:['class']});
  }
  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  if (document.readyState==='loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
