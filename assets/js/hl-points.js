/**
 * 馥靈之鑰 隱藏點數系統 hl-points.js v1.0
 * 2026/3/25
 *
 * 點數賺法：
 *   - 抽完牌 → 滑到底出現彩蛋
 *   - 測驗完成 → 結果頁滑到底彩蛋
 *   - 城堡解鎖房間 → hlCastle 自動觸發
 *   - 特定頁面滑到底（命盤引擎/合盤）彩蛋
 *   - 每天第一次登入彩蛋
 *   - 連續使用 3 天以上彩蛋
 *
 * 折抵：1點 = NT$10，折抵解讀服務
 *
 * Firestore: users/{uid}/points → { total, log:[{ts,src,pts}] }
 * localStorage: hl_points_local (未登入暫存，登入後合併)
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'hl_pts_v1';
  var SHOWN_KEY   = 'hl_pts_shown_';  // + today key 防重複彈出

  // 取今日 key
  function dayKey(){
    var d = new Date(Date.now() + 8*3600000);
    return d.getUTCFullYear()+'-'+(d.getUTCMonth()+1)+'-'+d.getUTCDate();
  }

  // 讀本地點數
  function getLocal(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"total":0,"log":[]}'); }
    catch(e){ return {total:0,log:[]}; }
  }
  function saveLocal(d){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }catch(e){}
  }

  // 彩蛋彈出動畫
  function showEgg(pts, msg, cb){
    if(document.getElementById('hl-pts-egg')) return;
    var el = document.createElement('div');
    el.id = 'hl-pts-egg';
    el.style.cssText =
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);'
      +'background:linear-gradient(135deg,#1a1028,#0d0917);color:#f8dfa5;'
      +'padding:16px 28px;border-radius:20px;z-index:9999;font-family:inherit;'
      +'border:1.5px solid rgba(248,223,165,0.3);box-shadow:0 8px 32px rgba(0,0,0,.4);'
      +'text-align:center;min-width:220px;max-width:320px;'
      +'transition:all .4s cubic-bezier(.16,1,.3,1);opacity:0;pointer-events:auto;';
    el.innerHTML =
      '<div style="font-size:1.8rem;margin-bottom:6px">✨</div>'
      +'<div style="font-size:.8rem;letter-spacing:2px;color:rgba(248,223,165,.6);margin-bottom:4px">隱藏驚喜！</div>'
      +'<div style="font-size:1.3rem;font-weight:700;color:#f8dfa5;margin-bottom:4px">+'+ pts +' 靈感點</div>'
      +'<div style="font-size:.82rem;color:rgba(255,255,255,.65);line-height:1.6;margin-bottom:12px">'+(msg||'')+'</div>'
      +'<button onclick="this.parentElement.remove()" style="background:rgba(248,223,165,.12);border:1px solid rgba(248,223,165,.2);border-radius:10px;padding:6px 20px;color:#f8dfa5;font-size:.8rem;cursor:pointer;font-family:inherit">收下 🎁</button>';
    document.body.appendChild(el);
    setTimeout(function(){ el.style.opacity='1'; el.style.transform='translateX(-50%) translateY(0)'; }, 50);
    setTimeout(function(){ if(el.parentElement){el.style.opacity='0'; setTimeout(function(){el.remove();},400);} }, 6000);
    if(cb) cb();
  }

  // 寫點數到 Firestore（登入狀態）
  function syncToFirestore(uid, pts, src){
    if(typeof firebase==='undefined' || !firebase.firestore) return;
    var db = firebase.firestore();
    var ref = db.collection('users').doc(uid).collection('points').doc('total');
    ref.get().then(function(doc){
      var cur = doc.exists ? (doc.data().total||0) : 0;
      var log = doc.exists ? (doc.data().log||[]) : [];
      log.push({ts:Date.now(), src:src, pts:pts});
      if(log.length>50) log=log.slice(-50);
      ref.set({total:cur+pts, log:log, updatedAt:Date.now()}, {merge:true});
    }).catch(function(){});
  }

  // 核心：賺點
  function earn(pts, src, msg){
    var showKey = SHOWN_KEY + src + '_' + dayKey();
    // 同一來源每天只彈一次
    if(localStorage.getItem(showKey)) return false;
    localStorage.setItem(showKey, '1');

    var d = getLocal();
    d.total += pts;
    d.log.push({ts:Date.now(), src:src, pts:pts});
    if(d.log.length>100) d.log=d.log.slice(-100);
    saveLocal(d);

    showEgg(pts, msg);

    // 同步 Firestore
    if(typeof firebase!=='undefined' && firebase.auth){
      var user = firebase.auth().currentUser;
      if(user) syncToFirestore(user.uid, pts, src);
    }
    return true;
  }

  // 公開 API
  window.HLPOINTS = {
    earn: earn,
    getTotal: function(){
      var d = getLocal();
      // 嘗試讀 Firestore
      return d.total;
    },
    getLog: function(){ return getLocal().log; },

    // 抽牌完成彩蛋（頁面滑到底觸發）
    triggerDrawEgg: function(){
      earn(2, 'draw_scroll', '把這張牌收進心裡\n積累覺察，慢慢就會看到答案。');
    },
    // 測驗完成彩蛋
    triggerQuizEgg: function(quizName){
      earn(3, 'quiz_'+quizName, '完成「'+quizName+'」\n覺察自己，本身就是一種能力。');
    },
    // 命盤引擎滑底彩蛋
    triggerEngineEgg: function(){
      earn(5, 'engine_scroll', '您的命盤是一份座標\n不是命定，是方向。');
    },
    // 城堡解鎖彩蛋（由 castle-game.html 呼叫）
    triggerCastleEgg: function(roomName){
      earn(5, 'castle_'+roomName, '「'+roomName+'」的門已打開\n每個房間都藏著一個版本的您。');
    },
    // 首次登入當日彩蛋
    triggerLoginEgg: function(){
      earn(1, 'daily_login', '今天也來了 ✦\n習慣覺察的人，生命會越來越清晰。');
    },
    // 合盤滑底彩蛋
    triggerMatchEgg: function(){
      earn(5, 'match_scroll', '兩個人的命盤放在一起\n看見的是彼此的功課，不是對錯。');
    }
  };

  // 自動偵測城堡解鎖
  var _origComplete = null;
  document.addEventListener('DOMContentLoaded', function(){
    if(typeof hlCastle !== 'undefined' && hlCastle.completeRoom){
      _origComplete = hlCastle.completeRoom.bind(hlCastle);
      hlCastle.completeRoom = function(roomId){
        var result = _origComplete(roomId);
        if(result !== false){
          var room = (typeof ROOMS !== 'undefined') ?
            ROOMS.find(function(r){return r.id===roomId;}) : null;
          HLPOINTS.triggerCastleEgg(room ? room.name : roomId);
        }
        return result;
      };
    }
  });

})();
