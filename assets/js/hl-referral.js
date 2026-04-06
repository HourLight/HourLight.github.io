/**
 * hl-referral.js — 馥靈之鑰推薦碼系統 v3.0
 *
 * v3.0 新增：
 * ► 所有註冊用戶自動產生推薦碼（email前4字 + 隨機4碼）
 * ► 用戶推薦儀表板（我的推薦碼、推薦人數、獎勵）
 * ► 雙向獎勵：推薦人得1天大師體驗（上限30天）、新用戶得48小時大師體驗
 * ► URL推薦追蹤強化：記錄著陸頁面+時間戳
 * ► 社群分享整合：LINE分享+複製連結+Toast提示
 * ► renderReferralWidget() — 在會員頁面渲染推薦區塊
 *
 * v2.0 功能保留：
 * ► 二層分潤系統：第一層 10%、第二層 5%
 * ► recordCommission() — 每筆交易自動計算並記錄分潤
 * ► queryCommissions() — 查詢合作夥伴累計分潤
 * ► Firestore commissions 集合追蹤每筆分潤明細
 *
 * Firestore 結構（v3.0 新增）：
 *   users/{uid}/my_referral_code: string（用戶專屬推薦碼）
 *   users/{uid}/referral_stats: { referred_count, rewards_earned }
 *   users/{uid}/aiBonus: number（AI解讀獎勵次數）
 *   referral_events/{auto}: { referrer_code, referrer_uid, new_uid, landing_page, timestamp }
 *
 * © 2026 馥靈之鑰 Hour Light — 王逸君
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'hl_referral_code';
  var STORAGE_DATE_KEY = 'hl_referral_captured_at';
  var STORAGE_LANDING_KEY = 'hl_referral_landing';
  var EXPIRY_DAYS = 90;

  // ═══════════════════════════════════════
  // 1. 捕獲 ?ref= 參數（強化版：含著陸頁面）
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
          localStorage.setItem(STORAGE_LANDING_KEY, JSON.stringify({
            code: code,
            landing_page: window.location.pathname,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || ''
          }));
          // 記錄推薦來源 IP（防自推自）
          fetchClientIP().then(function(ip) {
            if (ip) localStorage.setItem('hl_referral_ip', ip);
          });
        }

        cleanUrlParams();
      }
    } catch(e) { void 0; }
  }

  /**
   * 取得用戶 IP（用於防自推自比對）
   */
  function fetchClientIP() {
    return fetch('https://api.ipify.org?format=json')
      .then(function(r) { return r.json(); })
      .then(function(d) { return d.ip || null; })
      .catch(function() { return null; });
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
      localStorage.removeItem(STORAGE_LANDING_KEY);
      return null;
    }
    return localStorage.getItem(STORAGE_KEY);
  }

  function getReferralLanding() {
    try {
      var raw = localStorage.getItem(STORAGE_LANDING_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  // ═══════════════════════════════════════
  // 3. 自動產生用戶推薦碼
  // ═══════════════════════════════════════

  function generateUserCode(email) {
    if (!email) return 'USER' + randomDigits(4);
    // 取 email @ 前的前4個英數字元，過濾掉容易混淆的字元
    var prefix = email.split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 4)
      .toUpperCase();
    if (prefix.length < 2) prefix = 'HL';
    // 避免混淆字元：O/0, I/1/L
    return prefix + randomDigits(4);
  }

  function randomDigits(n) {
    var chars = '23456789';  // 排除 0 和 1（容易跟 O/I 混淆）
    var result = '';
    for (var i = 0; i < n; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 確保用戶有推薦碼，沒有就自動產生
   * @param {string} uid
   * @param {string} email
   * @returns {Promise<string>} 用戶的推薦碼
   */
  function ensureUserReferralCode(uid, email) {
    if (!uid) return Promise.resolve(null);
    try {
      var db = firebase.firestore();
      return db.collection('users').doc(uid).get()
        .then(function(doc) {
          if (doc.exists && doc.data().my_referral_code) {
            return doc.data().my_referral_code;
          }
          // 產生新碼並確認唯一性
          var newCode = generateUserCode(email);
          return checkCodeUnique(newCode).then(function(unique) {
            if (!unique) newCode = generateUserCode(email);  // 重試一次
            return db.collection('users').doc(uid).set({
              my_referral_code: newCode,
              referral_stats: { referred_count: 0, rewards_earned: 0 }
            }, { merge: true }).then(function() {
              return newCode;
            });
          });
        })
        .catch(function(err) {
          console.warn('[hl-referral] ensureUserReferralCode error:', err.message);
          return null;
        });
    } catch(err) {
      return Promise.resolve(null);
    }
  }

  function checkCodeUnique(code) {
    try {
      var db = firebase.firestore();
      return db.collection('users')
        .where('my_referral_code', '==', code)
        .limit(1)
        .get()
        .then(function(snap) { return snap.empty; })
        .catch(function() { return true; });
    } catch(e) {
      return Promise.resolve(true);
    }
  }

  // ═══════════════════════════════════════
  // 4. 註冊時寫入推薦碼 + 雙向獎勵
  // ═══════════════════════════════════════

  function bindReferralToUser(uid, email) {
    var code = getReferralCode();
    if (!code || !uid) return Promise.resolve(false);

    try {
      var db = firebase.firestore();
      var landing = getReferralLanding();

      // 先查是否已綁過推薦碼
      return db.collection('users').doc(uid).get()
        .then(function(userDoc) {
          if (userDoc.exists && userDoc.data().referral_code) {
            return false;  // 已經綁過了
          }

          // 查詢推薦碼來源（先查 partners，再查一般用戶）
          return findReferrer(code).then(function(referrer) {
            if (!referrer) return false;

            var batch = db.batch();

            // 1. 寫入新用戶的推薦來源 + 送1天大師體驗
            var userRef = db.collection('users').doc(uid);
            var newUserExpiry = new Date();
            newUserExpiry.setDate(newUserExpiry.getDate() + 2); // 新用戶送48小時（2天）
            batch.set(userRef, {
              referral_code: code,
              referral_date: firebase.firestore.FieldValue.serverTimestamp(),
              referral_premium_until: newUserExpiry.toISOString()  // 新用戶1天大師體驗
            }, { merge: true });

            // 2. 推薦人獎勵：延遲3天發放 + 同IP警示（不阻擋）
            if (referrer.type === 'user' && referrer.uid) {
              var refIP = localStorage.getItem('hl_referral_ip') || '';
              fetchClientIP().then(function(newUserIP) {
                var sameIP = (refIP && newUserIP && refIP === newUserIP);
                if (sameIP) {
                  console.warn('[hl-referral] Same IP detected — flagged for review');
                }
                // 建立待啟用獎勵（3天後自動發放）
                var activateDate = new Date();
                activateDate.setDate(activateDate.getDate() + 3);
                db.collection('users').doc(referrer.uid).collection('pending_rewards').add({
                  type: 'referral',
                  new_uid: uid,
                  new_email: email || '',
                  days: 1,
                  activate_after: activateDate.toISOString(),
                  activated: false,
                  same_ip: sameIP,
                  ref_ip: refIP || '',
                  new_ip: newUserIP || '',
                  created_at: firebase.firestore.FieldValue.serverTimestamp()
                }).then(function() {
                  db.collection('users').doc(referrer.uid).update({
                    'referral_stats.referred_count': firebase.firestore.FieldValue.increment(1)
                  }).catch(function(){});
                }).catch(function(){});
              }).catch(function(){});
            }

            // 3. 如果是 partner 推薦，更新 partner 計數 + 送天數
            if (referrer.type === 'partner' && referrer.partnerId) {
              var partnerRef = db.collection('partners').doc(referrer.partnerId);
              batch.update(partnerRef, {
                total_referrals: firebase.firestore.FieldValue.increment(1)
              });
            }

            // 4. 記錄推薦事件
            var eventRef = db.collection('referral_events').doc();
            batch.set(eventRef, {
              referrer_code: code,
              referrer_uid: referrer.uid || null,
              referrer_type: referrer.type,
              new_uid: uid,
              new_email: email || '',
              landing_page: landing ? landing.landing_page : '',
              referrer_url: landing ? landing.referrer : '',
              created_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            return batch.commit().then(function() {
              localStorage.removeItem(STORAGE_KEY);
              localStorage.removeItem(STORAGE_DATE_KEY);
              localStorage.removeItem(STORAGE_LANDING_KEY);
              return true;
            });
          });
        })
        .catch(function(err) {
          console.warn('[hl-referral] bindReferralToUser error:', err.message);
          return false;
        });
    } catch (err) {
      return Promise.resolve(false);
    }
  }

  /**
   * 找到推薦碼的來源（partner 或一般用戶）
   */
  function findReferrer(code) {
    try {
      var db = firebase.firestore();
      // 先查 partners
      return db.collection('partners')
        .where('referral_code', '==', code)
        .where('status', '==', 'active')
        .limit(1)
        .get()
        .then(function(partnerSnap) {
          if (!partnerSnap.empty) {
            var doc = partnerSnap.docs[0];
            return { type: 'partner', uid: null, partnerId: doc.id };
          }
          // 再查一般用戶
          return db.collection('users')
            .where('my_referral_code', '==', code)
            .limit(1)
            .get()
            .then(function(userSnap) {
              if (!userSnap.empty) {
                return { type: 'user', uid: userSnap.docs[0].id, partnerId: null };
              }
              return null;
            });
        })
        .catch(function() { return null; });
    } catch(e) {
      return Promise.resolve(null);
    }
  }

  // ═══════════════════════════════════════
  // 4.5 待啟用獎勵自動發放（3天後）
  // ═══════════════════════════════════════

  function checkPendingRewards(uid) {
    if (!uid) return;
    try {
      var db = firebase.firestore();
      var now = new Date().toISOString();
      db.collection('users').doc(uid).collection('pending_rewards')
        .where('activated', '==', false)
        .get()
        .then(function(snap) {
          if (snap.empty) return;
          snap.forEach(function(doc) {
            var d = doc.data();
            if (d.activate_after && d.activate_after <= now) {
              // 已過3天，啟用獎勵
              db.collection('users').doc(uid).get().then(function(userDoc) {
                var userData = userDoc.exists ? userDoc.data() : {};
                var totalRewards = (userData.referral_stats && userData.referral_stats.rewards_earned) || 0;
                if (totalRewards >= 30) {
                  // 已達上限，標記為跳過
                  doc.ref.update({ activated: true, skipped: true });
                  return;
                }
                var currentNow = new Date();
                var currentExpiry = userData.referral_premium_until ? new Date(userData.referral_premium_until) : currentNow;
                if (currentExpiry < currentNow) currentExpiry = currentNow;
                currentExpiry.setDate(currentExpiry.getDate() + (d.days || 1));
                db.collection('users').doc(uid).update({
                  referral_premium_until: currentExpiry.toISOString(),
                  'referral_stats.rewards_earned': firebase.firestore.FieldValue.increment(1)
                }).then(function() {
                  doc.ref.update({ activated: true, activated_at: new Date().toISOString() });
                  // 彈出感謝通知
                  showRewardToast('🎁 您推薦的朋友已註冊滿3天，您獲得1天大師體驗獎勵！');
                }).catch(function(){});
              }).catch(function(){});
            }
          });
        })
        .catch(function(){});
    } catch(e) { void 0; }
  }

  // ═══════════════════════════════════════
  // 5. 付款完成頁：顯示對應覺察師聯繫方式
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
  // 6. 推薦碼自動填入
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
  // 7. 工具函數
  // ═══════════════════════════════════════

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ═══════════════════════════════════════
  // 8. 管理員：查詢與統計
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

  /**
   * 管理員：取得推薦系統全局統計
   */
  function getGlobalReferralStats() {
    try {
      var db = firebase.firestore();
      var stats = {
        totalCodes: 0,
        totalPartnerCodes: 0,
        totalUserCodes: 0,
        totalReferralEvents: 0,
        topReferrers: [],
        recentEvents: []
      };

      return Promise.all([
        // 統計 partner 推薦碼
        db.collection('partners').get().then(function(snap) {
          stats.totalPartnerCodes = snap.size;
          snap.forEach(function(doc) {
            var d = doc.data();
            stats.topReferrers.push({
              code: d.referral_code || doc.id,
              name: d.name || '-',
              type: 'partner',
              count: d.total_referrals || 0
            });
          });
        }),
        // 統計用戶推薦碼（有推薦碼且有推薦人的）
        db.collection('users').where('my_referral_code', '!=', '').get().then(function(snap) {
          stats.totalUserCodes = snap.size;
          snap.forEach(function(doc) {
            var d = doc.data();
            var rs = d.referral_stats || {};
            if (rs.referred_count > 0) {
              stats.topReferrers.push({
                code: d.my_referral_code,
                name: d.displayName || d.email || doc.id,
                type: 'user',
                count: rs.referred_count || 0
              });
            }
          });
        }).catch(function() { /* index might not exist yet */ }),
        // 最近推薦事件
        db.collection('referral_events').orderBy('created_at', 'desc').limit(20).get().then(function(snap) {
          stats.totalReferralEvents = snap.size;
          snap.forEach(function(doc) {
            stats.recentEvents.push(Object.assign({ _id: doc.id }, doc.data()));
          });
        }).catch(function() { /* collection might not exist yet */ })
      ]).then(function() {
        stats.totalCodes = stats.totalPartnerCodes + stats.totalUserCodes;
        // 排序 top referrers
        stats.topReferrers.sort(function(a, b) { return b.count - a.count; });
        stats.topReferrers = stats.topReferrers.slice(0, 10);
        return stats;
      }).catch(function() { return stats; });
    } catch(err) {
      return Promise.resolve({ totalCodes: 0, totalPartnerCodes: 0, totalUserCodes: 0, totalReferralEvents: 0, topReferrers: [], recentEvents: [] });
    }
  }

  // ═══════════════════════════════════════
  // 9. 二層分潤系統
  // ═══════════════════════════════════════

  var FIXED_COST_RATE = 0.10;
  var TIER1_RATE = 0.10;
  var TIER2_RATE = 0.05;

  function recordCommission(order) {
    if (!order || !order.amount || !order.buyerUid) {
      return Promise.resolve({ success: false, reason: 'missing_order_data' });
    }

    try {
      var db = firebase.firestore();

      return db.collection('users').doc(order.buyerUid).get()
        .then(function(userDoc) {
          if (!userDoc.exists || !userDoc.data().referral_code) {
            return { success: false, reason: 'no_referral' };
          }
          var refCode = userDoc.data().referral_code;

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

          var netAmount = order.amount * (1 - FIXED_COST_RATE);
          var tier1Commission = Math.round(netAmount * TIER1_RATE);
          var batch = db.batch();

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

          if (tier1.parent_strategist) {
            return db.collection('partners').doc(tier1.parent_strategist).get()
              .then(function(tier2Doc) {
                if (tier2Doc.exists && tier2Doc.data().status === 'active') {
                  var tier2 = tier2Doc.data();
                  var tier2Commission = Math.round(netAmount * TIER2_RATE);

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
  // 10. 社群分享工具
  // ═══════════════════════════════════════

  function getShareUrl(code) {
    return 'https://hourlightkey.com/?ref=' + encodeURIComponent(code);
  }

  function getShareTextForLINE(code) {
    var url = getShareUrl(code);
    return '我在用馥靈之鑰，33套命理系統+130張智慧牌卡，您也來試試 👉 ' + url;
  }

  function shareToLINE(code) {
    var text = getShareTextForLINE(code);
    var lineUrl = 'https://line.me/R/share?text=' + encodeURIComponent(text);
    window.open(lineUrl, '_blank', 'noopener');
  }

  function copyToClipboard(text, toastMsg) {
    toastMsg = toastMsg || '已複製';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        showToast(toastMsg);
      }).catch(function() {
        fallbackCopy(text, toastMsg);
      });
    } else {
      fallbackCopy(text, toastMsg);
    }
  }

  function fallbackCopy(text, toastMsg) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast(toastMsg); }
    catch(e) { showToast('複製失敗，請手動複製'); }
    document.body.removeChild(ta);
  }

  function showRewardToast(msg) {
    var overlay = document.createElement('div');
    overlay.id = 'hl-reward-toast';
    overlay.innerHTML = '<div style="background:linear-gradient(160deg,rgba(15,10,25,.98),rgba(25,18,38,.95));'
      + 'border:1px solid rgba(233,194,125,.3);border-radius:18px;padding:24px 28px;max-width:360px;width:90%;'
      + 'text-align:center;box-shadow:0 16px 60px rgba(0,0,0,.5);animation:hlToastIn .4s ease">'
      + '<div style="font-size:1.1rem;margin-bottom:10px">' + msg + '</div>'
      + '<div style="font-size:.78rem;color:rgba(249,240,229,.5);line-height:1.6;margin-bottom:16px">'
      + '感謝您的分享，讓更多人認識自己的力量。'
      + '</div>'
      + '<button onclick="this.closest(\'#hl-reward-toast\').remove()" style="'
      + 'padding:10px 28px;border:none;border-radius:999px;background:linear-gradient(135deg,#f8dfa5,#ecd098);'
      + 'color:#1a1008;font-size:.85rem;cursor:pointer;font-family:inherit">收到，謝謝 ✨</button>'
      + '</div>';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;'
      + 'justify-content:center;background:rgba(5,3,10,.6);animation:hlToastIn .3s ease';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  function showToast(msg) {
    var existing = document.getElementById('hl-ref-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'hl-ref-toast';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);'
      + 'background:rgba(30,25,45,.92);color:#f0d48a;padding:12px 28px;border-radius:24px;'
      + 'font-size:.88rem;z-index:99999;pointer-events:none;'
      + 'animation:hlToastIn .3s ease;box-shadow:0 4px 16px rgba(0,0,0,.25);'
      + 'font-family:"Noto Sans TC",-apple-system,sans-serif';
    document.body.appendChild(toast);

    setTimeout(function() {
      toast.style.transition = 'opacity .3s';
      toast.style.opacity = '0';
      setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
  }

  // ═══════════════════════════════════════
  // 11. 會員頁面推薦區塊渲染
  // ═══════════════════════════════════════

  /**
   * 在指定容器渲染「我的推薦」區塊
   * @param {string} containerId - 容器 DOM ID
   * @param {object} opts - { theme: 'light'|'dark' }
   */
  function renderReferralWidget(containerId, opts) {
    var container = document.getElementById(containerId);
    if (!container) return;
    opts = opts || {};
    var isLight = opts.theme === 'light';

    try {
      var user = firebase.auth().currentUser;
      if (!user) {
        container.innerHTML = '';
        return;
      }

      var db = firebase.firestore();
      ensureUserReferralCode(user.uid, user.email).then(function(code) {
        if (!code) {
          container.innerHTML = '';
          return;
        }

        return db.collection('users').doc(user.uid).get().then(function(doc) {
          var data = doc.exists ? doc.data() : {};
          var stats = data.referral_stats || { referred_count: 0, rewards_earned: 0 };
          var shareUrl = getShareUrl(code);

          var cardBg = isLight ? '#ffffff' : 'radial-gradient(ellipse at top,rgba(240,212,138,.06),transparent 60%),rgba(255,255,255,.02)';
          var cardBorder = isLight ? '1px solid #e8ddd0' : '1px solid rgba(240,212,138,.2)';
          var titleColor = isLight ? '#b8922a' : '#f0d48a';
          var textColor = isLight ? '#2d2418' : 'rgba(244,240,235,.85)';
          var mutedColor = isLight ? '#7a6a58' : 'rgba(244,240,235,.55)';
          var codeBg = isLight ? 'rgba(184,146,42,.08)' : 'rgba(240,212,138,.08)';
          var btnBg = isLight ? 'linear-gradient(135deg,#b8922a,#a6841f)' : 'linear-gradient(135deg,#c9a044,#f0d48a)';
          var btnColor = isLight ? '#fff' : '#0a0714';
          var outlineBorder = isLight ? '1px solid #b8922a' : '1px solid rgba(240,212,138,.3)';
          var outlineColor = isLight ? '#b8922a' : '#f0d48a';
          var outlineBg = isLight ? 'transparent' : 'rgba(240,212,138,.05)';

          var html = '<div style="background:' + cardBg + ';border:' + cardBorder + ';border-radius:14px;padding:22px;margin-bottom:16px">'
            + '<div style="font-size:.95rem;letter-spacing:.12em;color:' + mutedColor + ';margin-bottom:14px;text-transform:uppercase">我的推薦</div>'

            // 推薦碼顯示
            + '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">'
            + '<div style="background:' + codeBg + ';border:1px dashed ' + titleColor + ';border-radius:10px;padding:10px 22px;text-align:center">'
            + '<div style="font-size:.72rem;color:' + mutedColor + ';margin-bottom:4px">我的推薦碼</div>'
            + '<div style="font-family:monospace;font-size:1.3rem;font-weight:700;color:' + titleColor + ';letter-spacing:.15em">' + escapeHtml(code) + '</div>'
            + '</div>'
            + '</div>'

            // 統計
            + '<div style="display:flex;justify-content:center;gap:24px;margin-bottom:18px;text-align:center">'
            + '<div>'
            + '<div style="font-size:1.3rem;font-weight:600;color:' + textColor + '">' + (stats.referred_count || 0) + '</div>'
            + '<div style="font-size:.78rem;color:' + mutedColor + '">推薦人數</div>'
            + '</div>'
            + '<div>'
            + '<div style="font-size:1.3rem;font-weight:600;color:' + textColor + '">' + Math.min(stats.referred_count || 0, 30) + ' 天</div>'
            + '<div style="font-size:.78rem;color:' + mutedColor + '">大師體驗天數</div>'
            + '</div>'
            + '</div>'

            // 按鈕列
            + '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'
            + '<button onclick="window.hlReferral.copyLink(\'' + escapeHtml(code) + '\')" style="'
            + 'display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:24px;border:none;cursor:pointer;'
            + 'background:' + btnBg + ';color:' + btnColor + ';font-size:.85rem;font-weight:600;'
            + 'font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent'
            + '">📋 複製推薦連結</button>'
            + '<button onclick="window.hlReferral.shareToLINE(\'' + escapeHtml(code) + '\')" style="'
            + 'display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:24px;cursor:pointer;'
            + 'background:' + outlineBg + ';color:' + outlineColor + ';border:' + outlineBorder + ';font-size:.85rem;font-weight:600;'
            + 'font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent'
            + '">💬 分享到 LINE</button>'
            + '</div>'

            // 提示文字
            + '<div style="text-align:center;margin-top:14px;font-size:.78rem;color:' + mutedColor + ';line-height:1.7">'
            + '朋友透過您的連結註冊，立即獲得48小時大師體驗。<br>'
            + '朋友註冊3天後，您也會獲得1天大師體驗獎勵（上限30天）。'
            + '</div>'

            + '</div>';

          container.innerHTML = html;
        });
      }).catch(function() {
        container.innerHTML = '';
      });
    } catch(e) {
      container.innerHTML = '';
    }
  }

  function copyLink(code) {
    copyToClipboard(getShareUrl(code), '✓ 推薦連結已複製');
  }

  function copyCode(code) {
    copyToClipboard(code, '✓ 推薦碼已複製');
  }

  // ═══════════════════════════════════════
  // 注入 Toast 動畫 CSS
  // ═══════════════════════════════════════
  (function injectStyles() {
    if (document.getElementById('hl-ref-styles')) return;
    var style = document.createElement('style');
    style.id = 'hl-ref-styles';
    style.textContent = '@keyframes hlToastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
    document.head.appendChild(style);
  })();

  // ═══════════════════════════════════════
  // 初始化
  // ═══════════════════════════════════════

  captureReferralCode();

  // 登入用戶自動檢查待啟用獎勵
  try {
    if (window.firebase && firebase.auth) {
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) checkPendingRewards(user.uid);
      });
    }
  } catch(e) { void 0; }

  window.hlReferral = {
    getCode: getReferralCode,
    getLanding: getReferralLanding,
    bindToUser: bindReferralToUser,
    showPartnerContact: showPartnerContact,
    autoFillInput: autoFillReferralInput,
    queryUsers: queryReferralUsers,
    recordCommission: recordCommission,
    queryCommissions: queryCommissions,
    queryCommissionSummary: queryCommissionSummary,
    ensureUserCode: ensureUserReferralCode,
    generateCode: generateUserCode,
    getGlobalStats: getGlobalReferralStats,
    renderWidget: renderReferralWidget,
    checkPending: checkPendingRewards,
    shareToLINE: shareToLINE,
    copyLink: copyLink,
    copyCode: copyCode,
    getShareUrl: getShareUrl,
    showToast: showToast,
    FIXED_COST_RATE: FIXED_COST_RATE,
    TIER1_RATE: TIER1_RATE,
    TIER2_RATE: TIER2_RATE,
    VERSION: '3.1.0'
  };

})();
