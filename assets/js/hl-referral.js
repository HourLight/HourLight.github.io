/**
 * hl-referral.js — 馥靈之鑰推薦碼系統 v2.0
 *
 * v2.0 新增：
 * ► 二層分潤系統：第一層 10%、第二層 5%
 * ► recordCommission() — 每筆交易自動計算並記錄分潤
 * ► queryCommissions() — 查詢合作夥伴累計分潤
 * ► Firestore commissions 集合追蹤每筆分潤明細
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
 * 4. 交易完成時 → 自動計算二層分潤並寫入 commissions 集合
 * 5. 合作者後台 → 可查看自己帶來的用戶數與累計分潤
 *
 * 安裝：在全站 JS 尾部加入（firebase-config.js 之後、hl-gate.js 之前）
 * <script src="assets/js/hl-referral.js?v=日期"></script>
 *
 * Firestore 結構（新增欄位）：
 *   users/{uid}/referral_code: string
 *   users/{uid}/referral_date: timestamp
 *
 * Firestore collections：
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
 *     split_tier1: number（0.10 = 10%）
 *     split_tier2: number（0.05 = 5%）
 *     total_commission: number（累計分潤金額）
 *     total_referrals: number（累計推薦人數）
 *     created_at: timestamp
 *
 *   commissions/{autoId}
 *     order_id: string（訂單編號）
 *     order_amount: number（訂單金額）
 *     buyer_uid: string（購買者 UID）
 *     buyer_email: string
 *     tier: number（1 或 2）
 *     partner_id: string（分潤對象的 partner doc ID）
 *     partner_name: string
 *     partner_code: string（推薦碼）
 *     rate: number（0.10 或 0.05）
 *     amount: number（分潤金額）
 *     status: 'pending' | 'paid' | 'cancelled'
 *     created_at: timestamp
 *     paid_at: timestamp（可為空）
 *     source_service: string（來源服務，如 'draw-hl'、'nail-course'）
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
  // 7. 管理員：分潤報表查詢
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
  // 8. 二層分潤系統
  // ═══════════════════════════════════════
  //
  // 計算邏輯：
  //   訂單金額 → 先扣除 10% 固定成本 → 淨額
  //   第一層：直接推薦人拿淨額的 10%
  //   第二層：推薦人的上線拿淨額的 5%
  //
  // 範例：訂單 $1,000
  //   固定成本：$1,000 × 10% = $100
  //   淨額：$1,000 - $100 = $900
  //   第一層分潤：$900 × 10% = $90（直接推薦人）
  //   第二層分潤：$900 × 5% = $45（推薦人的上線）

  var FIXED_COST_RATE = 0.10;   // 10% 固定成本
  var TIER1_RATE = 0.10;         // 第一層 10%
  var TIER2_RATE = 0.05;         // 第二層 5%

  /**
   * 記錄分潤（交易完成時呼叫）
   * @param {object} order - 訂單資訊
   *   order.id       - 訂單編號
   *   order.amount   - 訂單金額（NT$）
   *   order.buyerUid - 購買者 UID
   *   order.buyerEmail - 購買者 email
   *   order.service  - 來源服務（如 'draw-hl'、'nail-course'）
   * @returns {Promise<object>} 分潤結果
   */
  function recordCommission(order) {
    if (!order || !order.amount || !order.buyerUid) {
      return Promise.resolve({ success: false, reason: 'missing_order_data' });
    }

    try {
      var db = firebase.firestore();

      // 1. 查詢購買者的推薦碼
      return db.collection('users').doc(order.buyerUid).get()
        .then(function(userDoc) {
          if (!userDoc.exists || !userDoc.data().referral_code) {
            return { success: false, reason: 'no_referral' };
          }
          var refCode = userDoc.data().referral_code;

          // 2. 查詢第一層合作夥伴
          return db.collection('partners')
            .where('referral_code', '==', refCode)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        })
        .then(function(result) {
          if (result.success === false) return result;

          if (result.empty) {
            return { success: false, reason: 'partner_not_found' };
          }

          var tier1Doc = result.docs[0];
          var tier1 = tier1Doc.data();
          var tier1Id = tier1Doc.id;

          // 計算淨額（扣除固定成本）
          var netAmount = order.amount * (1 - FIXED_COST_RATE);

          // 第一層分潤
          var tier1Commission = Math.round(netAmount * TIER1_RATE);
          var batch = db.batch();

          // 寫入第一層分潤記錄
          var comm1Ref = db.collection('commissions').doc();
          batch.set(comm1Ref, {
            order_id: order.id || '',
            order_amount: order.amount,
            net_amount: netAmount,
            buyer_uid: order.buyerUid,
            buyer_email: order.buyerEmail || '',
            tier: 1,
            partner_id: tier1Id,
            partner_name: tier1.name || '',
            partner_code: tier1.referral_code || '',
            rate: TIER1_RATE,
            amount: tier1Commission,
            status: 'pending',
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            paid_at: null,
            source_service: order.service || ''
          });

          // 更新第一層合作夥伴累計
          var tier1PartnerRef = db.collection('partners').doc(tier1Id);
          batch.update(tier1PartnerRef, {
            total_commission: firebase.firestore.FieldValue.increment(tier1Commission),
            total_referrals: firebase.firestore.FieldValue.increment(1)
          });

          var resultInfo = {
            success: true,
            tier1: { partnerId: tier1Id, name: tier1.name, amount: tier1Commission },
            tier2: null
          };

          // 3. 檢查是否有第二層（推薦人的上線）
          if (tier1.parent_strategist) {
            return db.collection('partners').doc(tier1.parent_strategist).get()
              .then(function(tier2Doc) {
                if (tier2Doc.exists && tier2Doc.data().status === 'active') {
                  var tier2 = tier2Doc.data();
                  var tier2Commission = Math.round(netAmount * TIER2_RATE);

                  // 寫入第二層分潤記錄
                  var comm2Ref = db.collection('commissions').doc();
                  batch.set(comm2Ref, {
                    order_id: order.id || '',
                    order_amount: order.amount,
                    net_amount: netAmount,
                    buyer_uid: order.buyerUid,
                    buyer_email: order.buyerEmail || '',
                    tier: 2,
                    partner_id: tier1.parent_strategist,
                    partner_name: tier2.name || '',
                    partner_code: tier2.referral_code || '',
                    rate: TIER2_RATE,
                    amount: tier2Commission,
                    status: 'pending',
                    created_at: firebase.firestore.FieldValue.serverTimestamp(),
                    paid_at: null,
                    source_service: order.service || ''
                  });

                  // 更新第二層合作夥伴累計
                  var tier2PartnerRef = db.collection('partners').doc(tier1.parent_strategist);
                  batch.update(tier2PartnerRef, {
                    total_commission: firebase.firestore.FieldValue.increment(tier2Commission)
                  });

                  resultInfo.tier2 = {
                    partnerId: tier1.parent_strategist,
                    name: tier2.name,
                    amount: tier2Commission
                  };
                }

                return batch.commit().then(function() { return resultInfo; });
              });
          }

          return batch.commit().then(function() { return resultInfo; });
        })
        .catch(function(err) {
          console.warn('[hl-referral] recordCommission error:', err.message);
          return { success: false, reason: 'error', error: err.message };
        });
    } catch (err) {
      console.warn('[hl-referral] recordCommission error:', err.message);
      return Promise.resolve({ success: false, reason: 'error', error: err.message });
    }
  }

  /**
   * 查詢合作夥伴的分潤明細
   * @param {string} partnerId - 合作夥伴的 Firestore doc ID
   * @param {object} opts - 選項
   *   opts.status  - 篩選狀態（'pending'/'paid'/'cancelled'）
   *   opts.limit   - 筆數上限（預設 50）
   * @returns {Promise<array>} 分潤記錄陣列
   */
  function queryCommissions(partnerId, opts) {
    opts = opts || {};
    try {
      var db = firebase.firestore();
      var query = db.collection('commissions')
        .where('partner_id', '==', partnerId)
        .orderBy('created_at', 'desc')
        .limit(opts.limit || 50);

      if (opts.status) {
        query = query.where('status', '==', opts.status);
      }

      return query.get()
        .then(function(snap) {
          var results = [];
          snap.forEach(function(doc) {
            var d = doc.data();
            d._id = doc.id;
            results.push(d);
          });
          return results;
        })
        .catch(function() { return []; });
    } catch (err) {
      return Promise.resolve([]);
    }
  }

  /**
   * 查詢合作夥伴的分潤摘要
   * @param {string} partnerId
   * @returns {Promise<object>} { totalPending, totalPaid, count }
   */
  function queryCommissionSummary(partnerId) {
    try {
      var db = firebase.firestore();
      return db.collection('commissions')
        .where('partner_id', '==', partnerId)
        .get()
        .then(function(snap) {
          var totalPending = 0;
          var totalPaid = 0;
          var count = 0;
          snap.forEach(function(doc) {
            var d = doc.data();
            count++;
            if (d.status === 'pending') totalPending += (d.amount || 0);
            if (d.status === 'paid') totalPaid += (d.amount || 0);
          });
          return { totalPending: totalPending, totalPaid: totalPaid, count: count };
        })
        .catch(function() { return { totalPending: 0, totalPaid: 0, count: 0 }; });
    } catch (err) {
      return Promise.resolve({ totalPending: 0, totalPaid: 0, count: 0 });
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
    recordCommission: recordCommission,
    queryCommissions: queryCommissions,
    queryCommissionSummary: queryCommissionSummary,
    FIXED_COST_RATE: FIXED_COST_RATE,
    TIER1_RATE: TIER1_RATE,
    TIER2_RATE: TIER2_RATE,
    VERSION: '2.0.0'
  };

})();
