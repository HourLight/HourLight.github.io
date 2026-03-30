/**
 * hl-invite.js — 馥靈之鑰城堡推薦獎勵系統 v2.0
 *
 * 邏輯：
 *   分享 → 朋友帶 ?invite=UID 進入 → 完成任一工具 → 推薦人獎勵
 *   獎勵累計：每邀請 1 位完成探索 → 推薦人獲得 24 小時大師體驗（可累加，上限 30 天）
 *
 * v2.0 防刷升級：
 *   1. 帳號年齡門檻：受邀者帳號必須建立超過 24 小時才算有效
 *   2. 裝置指紋：同一裝置不同帳號只算一次（localStorage 記錄）
 *   3. 速率限制：同一推薦人每 24 小時最多收到 5 個新邀請（防爆刷）
 *   4. 自邀保護：UID 相同不算
 *
 * Firestore 結構：
 *   referral_rewards/{inviterUid}
 *     total_invited: number
 *     bonus_hours: number
 *     bonus_expires: timestamp
 *     invited_uids: array          已完成的受邀者 UID
 *     daily_count: number          今日已收到的邀請數（防速刷）
 *     daily_reset: timestamp       daily_count 的重置時間
 *     updated_at: timestamp
 *
 * 安裝：firebase-config.js 之後、hl-gate.js 之前
 */
(function(){
  'use strict';

  var STORAGE_INVITER  = 'hl_inviter_uid';
  var STORAGE_DEVICE   = 'hl_device_invited'; // 本裝置是否已被計算過
  var EXPIRY_DAYS      = 90;
  var HOURS_PER_INVITE = 24;
  var MAX_BONUS_HOURS  = 720;   // 上限 30 天
  var MAX_DAILY_INVITE = 5;     // 每位推薦人每天最多收 5 個
  var MIN_ACCOUNT_AGE_MS = 24 * 3600 * 1000; // 帳號需滿 24 小時

  // ── 1. 捕獲邀請參數 ──
  (function captureInvite(){
    var p = new URLSearchParams(window.location.search);
    var inv = p.get('invite');
    if(inv && inv.length > 5){
      var exp = Date.now() + EXPIRY_DAYS * 86400000;
      localStorage.setItem(STORAGE_INVITER, JSON.stringify({uid: inv, exp: exp}));
    }
  })();

  // ── 2. 取得邀請人 UID ──
  function getInviterUid(){
    var raw = localStorage.getItem(STORAGE_INVITER);
    if(!raw) return null;
    try{
      var obj = JSON.parse(raw);
      if(obj.exp < Date.now()){ localStorage.removeItem(STORAGE_INVITER); return null; }
      return obj.uid;
    }catch(e){ return null; }
  }

  // ── 3. 裝置指紋：本裝置是否已被推薦人計算過 ──
  function isDeviceAlreadyCounted(inviterUid){
    var raw = localStorage.getItem(STORAGE_DEVICE);
    if(!raw) return false;
    try{
      var map = JSON.parse(raw);
      return !!map[inviterUid];
    }catch(e){ return false; }
  }

  function markDeviceCounted(inviterUid){
    var raw = localStorage.getItem(STORAGE_DEVICE);
    var map = {};
    try{ if(raw) map = JSON.parse(raw); }catch(e){}
    map[inviterUid] = Date.now();
    localStorage.setItem(STORAGE_DEVICE, JSON.stringify(map));
  }

  // ── 4. 記錄受邀者完成，給推薦人獎勵 ──
  function recordInviteComplete(myUid, myCreatedAt){
    var inviterUid = getInviterUid();
    if(!inviterUid || inviterUid === myUid) return;

    // 裝置已計算過 → 跳過
    if(isDeviceAlreadyCounted(inviterUid)) return;

    // 帳號年齡不足 24 小時 → 跳過（防小號）
    if(myCreatedAt && (Date.now() - myCreatedAt) < MIN_ACCOUNT_AGE_MS) return;

    try{
      var db = firebase.firestore();
      var ref = db.doc('referral_rewards/' + inviterUid);
      db.runTransaction(function(tx){
        return tx.get(ref).then(function(doc){
          var data = doc.exists ? doc.data() : {
            total_invited:0, bonus_hours:0,
            invited_uids:[], bonus_expires:null,
            daily_count:0, daily_reset:null
          };

          // UID 重複 → 跳過
          var uids = data.invited_uids || [];
          if(uids.indexOf(myUid) >= 0) return;

          // 每日速率限制（同一推薦人每天最多 MAX_DAILY_INVITE 個）
          var now = Date.now();
          var dailyReset = data.daily_reset ?
            (data.daily_reset.toMillis ? data.daily_reset.toMillis() : new Date(data.daily_reset).getTime()) : 0;
          var dailyCount = (now - dailyReset < 86400000) ? (data.daily_count || 0) : 0;
          if(dailyCount >= MAX_DAILY_INVITE) return;

          uids.push(myUid);
          var newHours = Math.min(MAX_BONUS_HOURS, (data.bonus_hours || 0) + HOURS_PER_INVITE);
          var currentExp = data.bonus_expires ?
            (data.bonus_expires.toMillis ? data.bonus_expires.toMillis() : new Date(data.bonus_expires).getTime()) : now;
          var baseTime = Math.max(now, currentExp);
          var newExp = baseTime + HOURS_PER_INVITE * 3600000;

          tx.set(ref, {
            total_invited: (data.total_invited || 0) + 1,
            bonus_hours: newHours,
            bonus_expires: new Date(newExp),
            invited_uids: uids,
            daily_count: dailyCount + 1,
            daily_reset: dailyReset > 0 && (now - dailyReset < 86400000)
              ? data.daily_reset
              : new Date(now),
            updated_at: new Date()
          }, {merge: true});
        });
      }).then(function(){
        markDeviceCounted(inviterUid);
        localStorage.removeItem(STORAGE_INVITER);
      }).catch(function(e){
        console.warn('hl-invite: transaction failed', e);
      });
    }catch(e){}
  }

  // ── 5. 套用推薦獎勵 ──
  function applyInviteBonus(uid, originalPlan, callback){
    try{
      var db = firebase.firestore();
      db.doc('referral_rewards/' + uid).get().then(function(doc){
        if(!doc.exists){ callback(originalPlan); return; }
        var data = doc.data();
        var exp = data.bonus_expires;
        var expMs = exp ? (exp.toMillis ? exp.toMillis() : new Date(exp).getTime()) : 0;
        if(expMs > Date.now() && (originalPlan === 'free' || originalPlan === 'plus')){
          callback('pro');
        } else {
          callback(originalPlan);
        }
      }).catch(function(){ callback(originalPlan); });
    }catch(e){ callback(originalPlan); }
  }

  // ── 6. 產生分享連結 ──
  function generateShareLink(uid){
    return 'https://hourlightkey.com/castle-game.html?invite=' + uid;
  }

  // ── 7. 查詢獎勵狀態 ──
  function getRewardStatus(uid, callback){
    try{
      var db = firebase.firestore();
      db.doc('referral_rewards/' + uid).get().then(function(doc){
        if(!doc.exists){ callback(null); return; }
        var data = doc.data();
        var exp = data.bonus_expires;
        var expMs = exp ? (exp.toMillis ? exp.toMillis() : new Date(exp).getTime()) : 0;
        var remaining = expMs - Date.now();
        callback({
          total_invited: data.total_invited || 0,
          active: remaining > 0,
          remaining_hours: remaining > 0 ? Math.ceil(remaining / 3600000) : 0,
          expires_at: expMs
        });
      }).catch(function(){ callback(null); });
    }catch(e){ callback(null); }
  }

  // ── 8. 公開 API ──
  window.hlInvite = {
    getInviterUid:    getInviterUid,
    recordComplete:   recordInviteComplete,
    applyBonus:       applyInviteBonus,
    generateLink:     generateShareLink,
    getRewardStatus:  getRewardStatus,
    HOURS_PER_INVITE: HOURS_PER_INVITE
  };

  // ── 9. 自動攔截 HL_track ──
  var _invitePatched = false;
  function patchForInvite(){
    if(_invitePatched || !window.HL_track) return;
    var orig = window.HL_track;
    window.HL_track = function(eventType, detail){
      orig(eventType, detail);
      var completeEvents = ['quiz_complete','calculator_complete','draw_complete',
                            'oracle_complete','castle_complete','calc_complete',
                            'match_complete','pet_reading_complete'];
      if(completeEvents.indexOf(eventType) >= 0){
        try{
          var auth = firebase.auth();
          var user = auth.currentUser;
          if(!user) return;
          // 取帳號建立時間（Firebase metadata.creationTime）
          var createdAt = user.metadata && user.metadata.creationTime
            ? new Date(user.metadata.creationTime).getTime()
            : 0;
          recordInviteComplete(user.uid, createdAt);
        }catch(e){}
      }
    };
    _invitePatched = true;
  }

  var _pi = setInterval(function(){
    if(window.HL_track){ patchForInvite(); clearInterval(_pi); }
  }, 500);
  setTimeout(function(){ clearInterval(_pi); }, 30000);

})();
