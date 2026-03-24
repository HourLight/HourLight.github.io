/**
 * hl-referral.js — 馥靈之鑰推薦碼系統 v1.1
 * 
 * v1.1 修正：
 * ► LINE 連結改為正確的官方 lin.ee/RdQBFAN
 * ► UI 全面改為深色主題（對齊官網正式版）
 * ► 移除綠色 WhatsApp 按鈕，改為金色系
 * ► Firestore 欄位統一用 plan（對齊 hl-ai-gate.js）
 * ► 對外文案用「您」不用「你」
 *
 * 功能：
 * 1. 任何頁面帶 ?ref=XXXX → 捕獲並存入 localStorage
 * 2. 用戶註冊時 → 將推薦碼寫入 Firestore users/{uid}
 * 3. 付款完成頁 → 根據推薦碼顯示對應覺察師的 LINE/WhatsApp
 * 4. 合作者後台 → 可查看自己帶來的用戶數（未來擴充）
 *
 * 安裝：在全站 JS 尾部加入（firebase-config.js 之後、hl-gate.js 之前）
 * <script src="assets/js/hl-referral.js?v=日期"></script>
 *
 * Firestore 結構（新增欄位）：
 *   users/{uid}/referral_code: string
 *   users/{uid}/referral_date: timestamp
 *
 * Firestore 新增 collection：
 *   partners/{partnerId}
 *     name: string
 *     referral_code: string（唯一）
 *     role: 'companion' | 'strategist'
 *     parent_strategist: string（partner_id，可為空）
 *     line_url: string
 *     line_qr: string（圖片網址）
 *     whatsapp_url: string
 *     contact_type: 'line' | 'whatsapp' | 'both'
 *     bank_account: string
 *     status: 'active' | 'paused' | 'terminated'
 *     split_platform: number（0.30）
 *     split_ai: number（0.40）
 *     created_at: timestamp
 *
 * © 2026 馥靈之鑰 Hour Light — 王逸君
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'hl_referral_code';
  var STORAGE_DATE_KEY = 'hl_referral_captured_at';
  var EXPIRY_DAYS = 90;

  // ═══════════════════════════════════════
  // 1. 捕獲 ?ref= 參數
  // ═══════════════════════════════════════

  function captureReferralCode() {
    try {
      var params = new URLSearchParams(window.location.search);
      var ref = params.get('ref') || params.get('REF') || params.get('Ref');

      if (ref && ref.trim()) {
        var code = ref.trim().toUpperCase();
        var existing = localStorage.getItem(STORAGE_KEY);

        if (!existing) {
          localStorage.setItem(STORAGE_KEY, code);
          localStorage.setItem(STORAGE_DATE_KEY, new Date().toISOString());
        }

        cleanUrlParams();
      }
    } catch(e) { void 0; }
  }

  function cleanUrlParams() {
    try {
      var url = new URL(window.location);
      url.searchParams.delete('ref');
      url.searchParams.delete('REF');
      url.searchParams.delete('Ref');
      if (url.toString() !== window.location.toString()) {
        window.history.replaceState({}, '', url);
      }
    } catch(e) { void 0; }
  }

  function isReferralExpired() {
    var capturedAt = localStorage.getItem(STORAGE_DATE_KEY);
    if (!capturedAt) return true;
    var diff = Date.now() - new Date(capturedAt).getTime();
    return diff > EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  }

  // ═══════════════════════════════════════
  // 2. 取得當前推薦碼
  // ═══════════════════════════════════════

  function getReferralCode() {
    if (isReferralExpired()) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_DATE_KEY);
      return null;
    }
    return localStorage.getItem(STORAGE_KEY);
  }

  // ═══════════════════════════════════════
  // 3. 註冊時寫入 Firestore
  // ═══════════════════════════════════════

  function bindReferralToUser(uid) {
    var code = getReferralCode();
    if (!code || !uid) return Promise.resolve(false);

    try {
      var db = firebase.firestore();

      return db.collection('partners')
        .where('referral_code', '==', code)
        .where('status', '==', 'active')
        .limit(1)
        .get()
        .then(function(partnerSnap) {
          if (partnerSnap.empty) {
            return false;
          }
          return db.collection('users').doc(uid).get();
        })
        .then(function(result) {
          if (result === false) return false;
          if (result.exists && result.data().referral_code) {
            return false;
          }
          return db.collection('users').doc(uid).set({
            referral_code: code,
            referral_date: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        })
        .then(function(result) {
          if (result === false) return false;
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_DATE_KEY);
          return true;
        })
        .catch(function(err) {
          return false;
        });
    } catch (err) {
      return Promise.resolve(false);
    }
  }

  // ═══════════════════════════════════════
  // 4. 付款完成頁：顯示對應覺察師聯繫方式
  // ═══════════════════════════════════════

  function showPartnerContact(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    try {
      var db = firebase.firestore();
      var user = firebase.auth().currentUser;

      if (!user) {
        showDefaultContact(container);
        return;
      }

      db.collection('users').doc(user.uid).get()
        .then(function(userDoc) {
          var refCode = userDoc.exists ? userDoc.data().referral_code : null;
          if (!refCode) {
            showDefaultContact(container);
            return;
          }
          return db.collection('partners')
            .where('referral_code', '==', refCode)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        })
        .then(function(partnerSnap) {
          if (!partnerSnap || partnerSnap.empty) {
            showDefaultContact(container);
            return;
          }
          var partner = partnerSnap.docs[0].data();
          showPartnerInfo(container, partner);
        })
        .catch(function() {
          showDefaultContact(container);
        });
    } catch (err) {
      showDefaultContact(container);
    }
  }

  // ── 深色主題 UI（對齊官網正式版）──

  function showPartnerInfo(container, partner) {
    var contactType = partner.contact_type || 'line';
    var html = ''
      + '<div style="'
      + 'background:radial-gradient(ellipse at top,rgba(240,212,138,.06),transparent 60%),rgba(255,255,255,.02);'
      + 'border:1px solid rgba(240,212,138,.2);'
      + 'border-radius:16px;'
      + 'padding:28px 22px;'
      + 'text-align:center;'
      + 'margin:20px 0;'
      + '">'
      + '<p style="color:rgba(244,240,235,.7);font-size:.88rem;margin-bottom:8px;">'
      + '付款已完成，請將付款資料與牌卡內容傳送給您的專屬覺察師：'
      + '</p>'
      + '<p style="font-family:\'Noto Serif TC\',serif;color:#f0d48a;font-size:1.2rem;font-weight:700;letter-spacing:.12em;margin-bottom:16px;">'
      + escapeHtml(partner.name)
      + '</p>';

    // LINE 按鈕（金色系）
    if ((contactType === 'line' || contactType === 'both') && partner.line_url) {
      html += ''
        + '<a href="' + escapeHtml(partner.line_url) + '" target="_blank" rel="noopener"'
        + ' style="'
        + 'display:inline-block;'
        + 'background:linear-gradient(135deg,#c9a044,#f0d48a);'
        + 'color:#0a0714;'
        + 'padding:12px 32px;'
        + 'border-radius:30px;'
        + 'text-decoration:none;'
        + 'font-size:.92rem;'
        + 'font-weight:700;'
        + 'letter-spacing:.08em;'
        + 'margin:6px;'
        + '">'
        + '💬 加入 LINE 聯繫'
        + '</a>';
    }

    // WhatsApp 按鈕（金色外框，不用綠色）
    if ((contactType === 'whatsapp' || contactType === 'both') && partner.whatsapp_url) {
      html += ''
        + '<a href="' + escapeHtml(partner.whatsapp_url) + '" target="_blank" rel="noopener"'
        + ' style="'
        + 'display:inline-block;'
        + 'padding:12px 32px;'
        + 'border-radius:30px;'
        + 'border:1px solid rgba(240,212,138,.3);'
        + 'background:rgba(240,212,138,.08);'
        + 'color:#f0d48a;'
        + 'text-decoration:none;'
        + 'font-size:.92rem;'
        + 'font-weight:700;'
        + 'letter-spacing:.08em;'
        + 'margin:6px;'
        + '">'
        + '💬 WhatsApp 聯繫'
        + '</a>';
    }

    // LINE QR Code
    if (partner.line_qr) {
      html += ''
        + '<div style="margin-top:16px;">'
        + '<img src="' + escapeHtml(partner.line_qr) + '" alt="QR Code"'
        + ' style="width:150px;height:150px;border-radius:8px;border:1px solid rgba(240,212,138,.2);">'
        + '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function showDefaultContact(container) {
    container.innerHTML = ''
      + '<div style="'
      + 'background:radial-gradient(ellipse at top,rgba(240,212,138,.06),transparent 60%),rgba(255,255,255,.02);'
      + 'border:1px solid rgba(240,212,138,.2);'
      + 'border-radius:16px;'
      + 'padding:28px 22px;'
      + 'text-align:center;'
      + 'margin:20px 0;'
      + '">'
      + '<p style="color:rgba(244,240,235,.7);font-size:.88rem;margin-bottom:8px;">'
      + '付款已完成，請將付款資料與牌卡內容傳送至：'
      + '</p>'
      + '<p style="font-family:\'Noto Serif TC\',serif;color:#f0d48a;font-size:1.2rem;font-weight:700;letter-spacing:.12em;margin-bottom:16px;">'
      + '馥靈之鑰覺察服務'
      + '</p>'
      + '<a href="https://lin.ee/RdQBFAN" target="_blank" rel="noopener"'
      + ' style="'
      + 'display:inline-block;'
      + 'background:linear-gradient(135deg,#c9a044,#f0d48a);'
      + 'color:#0a0714;'
      + 'padding:12px 32px;'
      + 'border-radius:30px;'
      + 'text-decoration:none;'
      + 'font-size:.92rem;'
      + 'font-weight:700;'
      + 'letter-spacing:.08em;'
      + '">'
      + '💬 加入 LINE 聯繫'
      + '</a>'
      + '</div>';
  }

  // ═══════════════════════════════════════
  // 5. 註冊頁面：自動填入推薦碼欄位
  // ═══════════════════════════════════════

  function autoFillReferralInput(inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;

    var code = getReferralCode();
    if (code) {
      input.value = code;
      input.readOnly = true;
      input.style.backgroundColor = '#141020';
      input.style.color = '#f0d48a';
      input.style.borderColor = 'rgba(240,212,138,.3)';
      var hint = document.createElement('small');
      hint.style.cssText = 'color:rgba(240,212,138,.7);display:block;margin-top:4px;font-size:.78rem';
      hint.textContent = '✓ 推薦碼已自動帶入';
      if (input.parentNode) input.parentNode.appendChild(hint);
    }
  }

  // ═══════════════════════════════════════
  // 6. 工具函數
  // ═══════════════════════════════════════

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ═══════════════════════════════════════
  // 7. 管理員：分潤報表查詢（未來擴充）
  // ═══════════════════════════════════════

  function queryReferralUsers(refCode) {
    try {
      var db = firebase.firestore();
      return db.collection('users')
        .where('referral_code', '==', refCode)
        .get()
        .then(function(snap) {
          return snap.docs.map(function(doc) {
            return {
              uid: doc.id,
              email: doc.data().email || '',
              referral_date: doc.data().referral_date,
              plan: doc.data().plan || 'free'
            };
          });
        })
        .catch(function() { return []; });
    } catch (err) {
      return Promise.resolve([]);
    }
  }

  // ═══════════════════════════════════════
  // 初始化
  // ═══════════════════════════════════════

  captureReferralCode();

  window.hlReferral = {
    getCode: getReferralCode,
    bindToUser: bindReferralToUser,
    showPartnerContact: showPartnerContact,
    autoFillInput: autoFillReferralInput,
    queryUsers: queryReferralUsers,
    VERSION: '1.1.0'
  };

})();
