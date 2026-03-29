/**
 * hl-invite.js — 馥靈之鑰城堡推薦獎勵系統 v1.0
 *
 * 邏輯：
 *   分享 → 朋友帶 ?invite=UID 進入 → 完成任一工具 → 推薦人獎勵
 *   獎勵累計：
 *     1位朋友完成探索 → 推薦人獲得 24小時大師體驗
 *     每多1位         → 再疊加 24小時（可累加到30天）
 *
 * Firestore 結構：
 *   referral_rewards/{inviterUid}
 *     total_invited: number      已邀請完成人數
 *     bonus_hours: number        剩餘大師獎勵小時數
 *     bonus_expires: timestamp   到期時間
 *     invited_uids: array        已完成的受邀者 UID（防重複）
 *     updated_at: timestamp
 *
 * 安裝：firebase-config.js 之後、hl-gate.js 之前
 * <script src="assets/js/hl-invite.js"></script>
 */
(function(){
  'use strict';

  var STORAGE_INVITER = 'hl_inviter_uid'; // 誰邀請我
  var STORAGE_MY_UID  = 'hl_my_uid_cache';
  var HOURS_PER_INVITE = 24; // 每邀請1位得24小時大師
  var MAX_BONUS_HOURS  = 720; // 上限30天

  // ── 1. 捕獲邀請參數 ──
  (function captureInvite(){
    var p = new URLSearchParams(window.location.search);
    var inv = p.get('invite');
    if(inv && inv.length > 5){
      // 存90天
      var exp = Date.now() + 90 * 86400000;
      localStorage.setItem(STORAGE_INVITER, JSON.stringify({uid: inv, exp: exp}));
    }
  })();

  // ── 2. 取得當前邀請人 ──
  function getInviterUid(){
    var raw = localStorage.getItem(STORAGE_INVITER);
    if(!raw) return null;
    try{
      var obj = JSON.parse(raw);
      if(obj.exp < Date.now()){ localStorage.removeItem(STORAGE_INVITER); return null; }
      return obj.uid;
    }catch(e){ return null; }
  }

  // ── 3. 工具完成後：記錄受邀者完成，給推薦人獎勵 ──
  function recordInviteComplete(myUid){
    var inviterUid = getInviterUid();
    if(!inviterUid || inviterUid === myUid) return; // 不能自己邀自己
    try{
      var db = firebase.firestore();
      var ref = db.doc('referral_rewards/' + inviterUid);
      db.runTransaction(function(tx){
        return tx.get(ref).then(function(doc){
          var data = doc.exists ? doc.data() : {
            total_invited: 0, bonus_hours: 0,
            invited_uids: [], bonus_expires: null
          };
          // 防重複
          var uids = data.invited_uids || [];
          if(uids.indexOf(myUid) >= 0) return;
          uids.push(myUid);

          var newHours = Math.min(MAX_BONUS_HOURS, (data.bonus_hours || 0) + HOURS_PER_INVITE);
          // 延長到期時間（從現在起算）
          var now = Date.now();
          var currentExp = data.bonus_expires ? (data.bonus_expires.toMillis ? data.bonus_expires.toMillis() : data.bonus_expires) : now;
          var baseTime = Math.max(now, currentExp); // 疊加，不縮短
          var newExp = baseTime + HOURS_PER_INVITE * 3600000;

          tx.set(ref, {
            total_invited: (data.total_invited || 0) + 1,
            bonus_hours: newHours,
            bonus_expires: new Date(newExp),
            invited_uids: uids,
            updated_at: new Date()
          }, {merge: true});
        });
      }).then(function(){
        // 移除邀請記錄（只算一次）
        localStorage.removeItem(STORAGE_INVITER);
      }).catch(function(e){
        console.warn('hl-invite: transaction failed', e);
      });
    }catch(e){}
  }

  // ── 4. 檢查並套用推薦獎勵（注入 hl-ai-gate 的 getUserPlan）──
  function applyInviteBonus(uid, originalPlan, callback){
    try{
      var db = firebase.firestore();
      db.doc('referral_rewards/' + uid).get().then(function(doc){
        if(!doc.exists){ callback(originalPlan); return; }
        var data = doc.data();
        var exp = data.bonus_expires;
        var expMs = exp ? (exp.toMillis ? exp.toMillis() : new Date(exp).getTime()) : 0;
        if(expMs > Date.now() && (originalPlan === 'free' || originalPlan === 'plus')){
          // 有效推薦獎勵 → 暫時升為 pro
          callback('pro');
        } else {
          callback(originalPlan);
        }
      }).catch(function(){ callback(originalPlan); });
    }catch(e){ callback(originalPlan); }
  }

  // ── 5. 產生分享連結 ──
  function generateShareLink(uid){
    var base = 'https://hourlightkey.com/castle-game.html';
    return base + '?invite=' + uid;
  }

  // ── 6. 取得獎勵剩餘狀態 ──
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

  // ── 7. 公開 API ──
  window.hlInvite = {
    getInviterUid:    getInviterUid,
    recordComplete:   recordInviteComplete,
    applyBonus:       applyInviteBonus,
    generateLink:     generateShareLink,
    getRewardStatus:  getRewardStatus,
    HOURS_PER_INVITE: HOURS_PER_INVITE
  };

  // ── 8. 自動觸發：用戶完成任意工具後記錄 ──
  // 攔截 HL_track，有邀請人時記錄
  var _invitePatched = false;
  function patchForInvite(){
    if(_invitePatched || !window.HL_track) return;
    var orig = window.HL_track;
    window.HL_track = function(eventType, detail){
      orig(eventType, detail);
      // 任意完成事件都算
      var completeEvents = ['quiz_complete','calculator_complete','draw_complete',
                            'oracle_complete','castle_complete','calc_complete',
                            'match_complete','pet_reading_complete'];
      if(completeEvents.indexOf(eventType) >= 0){
        try{
          var auth = firebase.auth();
          if(auth.currentUser){
            recordInviteComplete(auth.currentUser.uid);
          }
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
