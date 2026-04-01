// ═══════════════════════════════════════
// 馥靈之鑰 · 美業合作商代碼系統 hl-biz-code.js
// 在付款牆之前提供「輸入合作代碼」的選項
// 代碼驗證通過 → 跳過付款牆 → 扣合作商月額度
// 代碼無效或額度用完 → 回到 C 端付款牆
// © 2026 Hour Light International
// ═══════════════════════════════════════

window.hlBizCode = (function(){
  'use strict';

  var db = null;
  function getDB(){
    if(db) return db;
    try{ db = firebase.firestore(); }catch(e){}
    return db;
  }

  // ── 顯示代碼輸入介面 ──
  function showCodeInput(config){
    var old = document.getElementById('hlBizCodeOverlay');
    if(old) old.remove();

    var serviceName = config.serviceName || '智慧解讀';
    var spread = config.n || 0;
    var priceMap = config.priceMap || {};
    var price = priceMap[spread] || 0;
    var onSuccess = config.onSuccess; // API 呼叫回調
    var pageType = config.pageType || 'nail'; // nail or spa

    var overlay = document.createElement('div');
    overlay.id = 'hlBizCodeOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(10,6,18,.92);display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto';

    overlay.innerHTML =
      '<div style="max-width:440px;width:100%;background:rgba(20,16,32,.95);border:1px solid rgba(240,212,138,.2);border-radius:20px;padding:28px 24px;max-height:90vh;overflow-y:auto">' +

        '<div style="text-align:center;margin-bottom:20px">' +
          '<div style="font-size:2rem;margin-bottom:8px">🤝</div>' +
          '<div style="font-size:1.1rem;font-weight:700;color:#f0d48a">' + serviceName + '</div>' +
          '<div style="font-size:.82rem;color:rgba(255,255,255,.45);margin-top:4px">' + spread + ' 張牌卡智慧解讀｜NT$ ' + price.toLocaleString() + '</div>' +
        '</div>' +

        // 合作代碼輸入
        '<div style="margin-bottom:18px">' +
          '<div style="font-size:.88rem;color:rgba(255,255,255,.7);margin-bottom:8px;font-weight:700">🏪 美業合作夥伴？</div>' +
          '<div style="font-size:.78rem;color:rgba(255,255,255,.4);margin-bottom:10px;line-height:1.7">如果您的美甲師/SPA 師提供了合作代碼，請輸入：</div>' +
          '<div style="display:flex;gap:8px">' +
            '<input type="text" id="bizCodeInput" placeholder="輸入合作代碼" maxlength="12" style="flex:1;padding:12px 14px;border-radius:10px;border:1px solid rgba(240,212,138,.25);background:#141020;color:#f0d48a;font-size:.95rem;font-family:monospace;letter-spacing:.1em;text-transform:uppercase;outline:none" autocomplete="off"/>' +
            '<button id="bizCodeBtn" onclick="hlBizCode.verify()" style="padding:12px 18px;border-radius:10px;border:none;background:linear-gradient(135deg,#f0d48a,#e9c27d);color:#1a1520;font-size:.88rem;font-weight:700;cursor:pointer;white-space:nowrap">驗證</button>' +
          '</div>' +
          '<div id="bizCodeMsg" style="font-size:.78rem;margin-top:6px;min-height:20px"></div>' +
        '</div>' +

        // 分隔線
        '<div style="display:flex;align-items:center;gap:12px;margin:16px 0">' +
          '<div style="flex:1;height:1px;background:rgba(255,255,255,.08)"></div>' +
          '<span style="font-size:.75rem;color:rgba(255,255,255,.3)">或</span>' +
          '<div style="flex:1;height:1px;background:rgba(255,255,255,.08)"></div>' +
        '</div>' +

        // C 端付款
        '<div style="text-align:center;margin-bottom:14px">' +
          '<div style="font-size:.85rem;color:rgba(255,255,255,.5);margin-bottom:12px">一般顧客付款</div>' +
          '<button onclick="hlBizCode.goPaywall()" style="padding:12px 28px;border-radius:12px;font-size:.9rem;font-weight:700;color:#1a1520;background:linear-gradient(135deg,#f0d48a,#e9c27d);border:none;cursor:pointer;letter-spacing:.04em">💳 NT$ ' + price.toLocaleString() + ' 付款解鎖</button>' +
        '</div>' +

        // 關閉
        '<div style="text-align:center;margin-top:12px">' +
          '<button onclick="hlBizCode.close()" style="padding:8px 20px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.4);font-size:.82rem;cursor:pointer">← 返回</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // 儲存 config 供後續使用
    window._hlBizConfig = config;

    // Enter 鍵觸發驗證
    var inp = document.getElementById('bizCodeInput');
    if(inp) inp.addEventListener('keydown', function(e){ if(e.key==='Enter') hlBizCode.verify(); });
    if(inp) inp.focus();
  }

  // ── 驗證代碼 ──
  async function verify(){
    var inp = document.getElementById('bizCodeInput');
    var msg = document.getElementById('bizCodeMsg');
    var btn = document.getElementById('bizCodeBtn');
    if(!inp||!msg||!btn) return;

    var code = inp.value.trim().toUpperCase();
    if(!code || code.length < 4){
      msg.style.color = '#d93025';
      msg.textContent = '請輸入合作代碼';
      return;
    }

    // ✅ Master Code：管理員/VIP 永久通行碼，跳過所有驗證
    if(code === 'ASDF2258'){
      msg.style.color = '#4caf50';
      msg.textContent = '✦ VIP 通行碼驗證通過';
      btn.disabled = true; btn.textContent = '✓ 通過';
      window._hlBizVerified = true;
      setTimeout(function(){
        hlBizCode.close();
        var cfg = window._hlBizConfig;
        if(cfg && cfg.onSuccess) cfg.onSuccess();
      }, 600);
      return;
    }

    // ✅ 愚人節促銷碼（4/6 到期）
    var _BIZ_PROMO = {
      'FOOL199': {n:3, expires:'2026-04-07T23:59:59+08:00'},
      'FOOL399': {n:5, expires:'2026-04-07T23:59:59+08:00'},
      'FOOL599': {n:7, expires:'2026-04-07T23:59:59+08:00'}
    };
    if(_BIZ_PROMO[code]){
      var _bp = _BIZ_PROMO[code];
      var _bNow = new Date(), _bExp = new Date(_bp.expires);
      if(_bNow >= _bExp){ msg.style.color='#d93025'; msg.textContent='此兌換券已過期（4/6 截止）'; return; }
      var cfg = window._hlBizConfig;
      if(cfg && cfg.n && _bp.n !== cfg.n){ msg.style.color='#d93025'; msg.textContent='此兌換券適用於 '+_bp.n+' 張解讀，您目前選了 '+cfg.n+' 張'; return; }
      var _bKey = 'hl_promo_' + code;
      if(localStorage.getItem(_bKey)){ msg.style.color='#d93025'; msg.textContent='此兌換券已使用過（每人限用一次）'; return; }
      localStorage.setItem(_bKey, Date.now());
      try{var _bdb=getDB();var _bu=firebase.auth().currentUser;
        if(_bdb)_bdb.collection('promo_redemptions').add({code:code,n:(cfg&&cfg.n)||0,source:'biz-code',uid:_bu?_bu.uid:'guest',email:_bu?_bu.email:'',ts:firebase.firestore.FieldValue.serverTimestamp()});
      }catch(e){}
      msg.style.color = '#4caf50';
      msg.textContent = '✦ 愚人節兌換券驗證通過！';
      btn.disabled = true; btn.textContent = '✓ 通過';
      setTimeout(function(){
        hlBizCode.close();
        var cfg = window._hlBizConfig;
        if(cfg && cfg.onSuccess) cfg.onSuccess();
      }, 600);
      return;
    }

    btn.disabled = true;
    btn.textContent = '驗證中⋯';
    msg.style.color = 'rgba(255,255,255,.4)';
    msg.textContent = '正在驗證⋯';

    var firestore = getDB();
    if(!firestore){
      msg.style.color = '#d93025';
      msg.textContent = '系統錯誤，請使用付款方式';
      btn.disabled = false; btn.textContent = '驗證';
      return;
    }

    try{
      // 查找代碼
      var snap = await firestore.collectionGroup('biz_codes')
        .where('code','==',code)
        .where('used','==',false)
        .limit(1).get();

      if(snap.empty){
        msg.style.color = '#d93025';
        msg.textContent = '代碼無效或已使用。請確認後重試，或選擇付款。';
        btn.disabled = false; btn.textContent = '驗證';
        return;
      }

      var codeDoc = snap.docs[0];
      var codeData = codeDoc.data();
      var partnerId = codeDoc.ref.parent.parent.id;

      // 檢查合作商狀態和額度
      var partnerDoc = await firestore.collection('biz_partners').doc(partnerId).get();
      if(!partnerDoc.exists || !partnerDoc.data().active){
        msg.style.color = '#d93025';
        msg.textContent = '此合作商已停用。請選擇付款方式。';
        btn.disabled = false; btn.textContent = '驗證';
        return;
      }

      var partner = partnerDoc.data();
      var quota = partner.monthlyQuota || 50;
      var used = partner.usedThisMonth || 0;
      var allowedSpread = partner.allowedSpread || 3;

      // 張數限制：合作商方案限定張數
      var cfg = window._hlBizConfig;
      if(cfg && cfg.n && cfg.n > allowedSpread){
        msg.style.color = '#e8a040';
        msg.textContent = '此合作方案僅支援 ' + allowedSpread + ' 張牌解讀。' + cfg.n + ' 張請選擇付款。';
        btn.disabled = false; btn.textContent = '驗證';
        return;
      }

      // 檢查是否需要重置月額度
      var now = new Date();
      var resetDate = partner.quotaResetDate ? partner.quotaResetDate.toDate ? partner.quotaResetDate.toDate() : new Date(partner.quotaResetDate) : null;
      if(resetDate && now >= resetDate){
        // 已過重置日期，重置額度
        used = 0;
      }

      if(used >= quota){
        msg.style.color = '#e8a040';
        msg.textContent = '合作商本月額度已用完。請選擇付款方式。';
        btn.disabled = false; btn.textContent = '驗證';
        return;
      }

      // ✅ 代碼有效、額度充足 → 標記使用 + 扣額度
      var batch = firestore.batch();

      // 標記代碼已使用
      batch.update(codeDoc.ref, {
        used: true,
        usedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 扣合作商額度
      var updateData = {
        usedThisMonth: firebase.firestore.FieldValue.increment(1)
      };
      // 如果剛重置，先設為 1
      if(resetDate && now >= resetDate){
        var nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        updateData.usedThisMonth = 1;
        updateData.quotaResetDate = nextMonth;
      }
      batch.update(partnerDoc.ref, updateData);

      await batch.commit();

      // 成功！
      msg.style.color = '#34a853';
      msg.textContent = '✅ 代碼驗證通過！' + (partner.shopName || '合作夥伴') + '（' + allowedSpread + '張方案，剩餘 ' + (quota - used - 1) + ' 次）';

      // 1.5 秒後關閉 overlay 並觸發 API
      setTimeout(function(){
        hlBizCode.close();
        var cfg = window._hlBizConfig;
        if(cfg && cfg.onSuccess){
          cfg.onSuccess();
        }
      }, 1500);

    }catch(e){
      console.error('biz code verify error:', e);
      msg.style.color = '#d93025';
      msg.textContent = '驗證過程出錯，請重試或選擇付款方式。';
      btn.disabled = false; btn.textContent = '驗證';
    }
  }

  // ── 切換到 C 端付款牆 ──
  function goPaywall(){
    hlBizCode.close();
    var cfg = window._hlBizConfig;
    if(cfg && typeof hlPaywall !== 'undefined'){
      hlPaywall.show({
        n: cfg.n,
        priceMap: cfg.priceMap,
        serviceName: cfg.serviceName,
        onProceed: cfg.onSuccess
      });
    }
  }

  // ── 關閉 ──
  function closeOverlay(){
    var el = document.getElementById('hlBizCodeOverlay');
    if(el) el.remove();
    document.body.style.overflow = '';
  }

  return {
    show: showCodeInput,
    verify: verify,
    goPaywall: goPaywall,
    close: closeOverlay
  };
})();
