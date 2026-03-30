/**
 * 馥靈之鑰 AI深度解讀指令計次門控 v3.0
 *
 * 收費邏輯（逸君確認 2026/3/24）：
 * ► 免費（不計次）：命理資料複製、寄信、馥靈抽牌
 * ► 每日計次：AI深度解讀指令的複製（單人/雙人/完整版/塔羅都算）
 * ► 每日午夜 00:00 (UTC+8) 自動歸零，沒用完不累計
 *
 * 每日限額：
 *   free  → 每天 3 次
 *   plus  → 每天 10 次（3免費+7付費，$399/月）
 *   pro   → 無上限（$999/月）
 *
 * 次數加購：
 *   10 次 / $199，存在 users/{uid}.aiBonus
 *   永久有效不歸零，每日配額用完才扣加購次數
 *
 * Firestore 結構：
 *   users/{uid}/ai_daily/{YYYY-MM-DD} → { count: N, lastUsed: timestamp }
 *   users/{uid} → { aiBonus: N }  ← 加購次數（永久）
 *
 * 啟用時間：2026/03/26 00:00 (UTC+8)
 */
(function(){
  'use strict';
  var GATE_START_TIME = new Date('2026-03-25T16:00:00Z').getTime();
  var DAILY_LIMITS = { 'free': 3, 'plus': 10, 'pro': Infinity };

  function getDayKey(){
    var now=new Date();var twMs=now.getTime()+8*3600000;var tw=new Date(twMs);
    return tw.getUTCFullYear()+'-'+String(tw.getUTCMonth()+1).padStart(2,'0')+'-'+String(tw.getUTCDate()).padStart(2,'0');
  }
  function getHoursUntilReset(){
    var now=new Date();var twMs=now.getTime()+8*3600000;var tw=new Date(twMs);
    return 24-tw.getUTCHours();
  }
  function isGateActive(){ return Date.now()>=GATE_START_TIME; }
  function getUser(){
    try{if(typeof firebase!=='undefined'&&firebase.auth)return firebase.auth().currentUser;}catch(e){}return null;
  }
  function getUserPlan(uid,cb){
    try{firebase.firestore().collection('users').doc(uid).get().then(function(doc){
      var data=doc.exists?doc.data():{};
      var plan=data.plan||'free';
      var bonus=data.aiBonus||0;
      // 檢查推薦邀請獎勵（有效期內升為 pro）
      if(window.hlInvite){
        hlInvite.applyBonus(uid, plan, function(finalPlan){
          cb(finalPlan, bonus);
        });
      } else {
        cb(plan, bonus);
      }
    }).catch(function(){cb('free',0);});}catch(e){cb('free',0);}
  }
  function getDailyUsage(uid,cb){
    var dk=getDayKey();
    try{firebase.firestore().collection('users').doc(uid).collection('ai_daily').doc(dk).get().then(function(doc){cb(doc.exists?(doc.data().count||0):0);}).catch(function(){cb(0);});}catch(e){cb(0);}
  }
  function recordUsage(uid,usedBonus){
    var dk=getDayKey();
    try{
      firebase.firestore().collection('users').doc(uid).collection('ai_daily').doc(dk).set({count:firebase.firestore.FieldValue.increment(1),lastUsed:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      if(usedBonus){
        firebase.firestore().collection('users').doc(uid).update({aiBonus:firebase.firestore.FieldValue.increment(-1)});
      }
    }catch(e){}
  }

  window.hlAIGateCheck=function(callback){
    if(!isGateActive()){if(callback)callback();return;}
    var user=getUser();
    if(!user){showLoginPrompt();return;}
    getUserPlan(user.uid,function(plan,bonus){
      var limit=DAILY_LIMITS[plan]||DAILY_LIMITS['free'];
      if(limit===Infinity){recordUsage(user.uid,false);if(callback)callback();return;}
      getDailyUsage(user.uid,function(count){
        if(count<limit){
          recordUsage(user.uid,false);
          if(callback)callback();
          showRemainingHint(count+1,limit,bonus);
        } else if(bonus>0){
          recordUsage(user.uid,true);
          if(callback)callback();
          showBonusHint(bonus-1);
        } else {
          showUpgradeModal(plan,count,limit,bonus);
        }
      });
    });
  };

  window.HL_checkQuota=window.hlAIGateCheck;

  function showLoginPrompt(){
    var old=document.getElementById('hl-ai-login-prompt');if(old)old.remove();
    var m=document.createElement('div');m.id='hl-ai-login-prompt';
    m.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(8px)';
    m.innerHTML='<div style="max-width:400px;padding:32px 24px;background:#0a0612;border:1px solid rgba(240,212,138,.2);border-radius:20px;text-align:center;color:#f0e8d8">'
      +'<div style="font-size:2rem;margin-bottom:12px">🔑</div>'
      +'<div style="font-size:1rem;color:#f0d48a;font-weight:700;margin-bottom:8px">登入即可使用AI深度解讀指令</div>'
      +'<div style="font-size:.85rem;color:rgba(255,255,255,.6);line-height:1.8;margin-bottom:16px">免費會員每天 3 次AI深度解讀指令，登入後立即開始。</div>'
      +'<a href="member-login.html" style="display:block;padding:14px;background:linear-gradient(135deg,#c9a044,#f0d48a);color:#0a0612;font-weight:700;border-radius:12px;text-decoration:none;margin-bottom:10px">🔑 免費註冊 / 登入</a>'
      +'<button onclick="this.closest(\'#hl-ai-login-prompt\').remove()" style="display:block;width:100%;padding:10px;background:transparent;border:1px solid rgba(240,212,138,.2);border-radius:10px;color:rgba(255,255,255,.5);font-size:.85rem;cursor:pointer">← 返回</button></div>';
    m.addEventListener('click',function(e){if(e.target===m)m.remove();});
    document.body.appendChild(m);
  }

  function showRemainingHint(used,limit,bonus){
    var remaining=limit-used;if(remaining>3)return;
    var old=document.getElementById('hl-ai-hint');if(old)old.remove();
    var el=document.createElement('div');el.id='hl-ai-hint';
    el.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(10,6,18,.92);border:1px solid rgba(240,212,138,.25);color:#f0d48a;padding:8px 18px;border-radius:20px;font-size:.8rem;z-index:99998;pointer-events:none;opacity:1;transition:opacity .5s';
    var txt='今日剩餘 '+remaining+' 次';
    if(bonus>0) txt+='（加購餘 '+bonus+' 次）';
    el.textContent=txt;
    document.body.appendChild(el);
    setTimeout(function(){el.style.opacity='0';},2500);
    setTimeout(function(){el.remove();},3200);
  }

  function showBonusHint(remaining){
    var old=document.getElementById('hl-ai-hint');if(old)old.remove();
    var el=document.createElement('div');el.id='hl-ai-hint';
    el.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(10,6,18,.92);border:1px solid rgba(240,212,138,.25);color:#f0d48a;padding:8px 18px;border-radius:20px;font-size:.8rem;z-index:99998;pointer-events:none;opacity:1;transition:opacity .5s';
    el.textContent='今日配額已用完，使用加購次數（剩餘 '+remaining+' 次）';
    document.body.appendChild(el);
    setTimeout(function(){el.style.opacity='0';},3000);
    setTimeout(function(){el.remove();},3800);
  }

  function showUpgradeModal(plan,used,limit,bonus){
    var old=document.getElementById('hl-ai-upgrade-modal');if(old)old.remove();
    var m=document.createElement('div');m.id='hl-ai-upgrade-modal';
    m.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(8px)';
    var pn=plan==='free'?'免費會員':'馥靈鑰友';
    var np=plan==='free'?'馥靈鑰友（$399/月，每天10次）':'馥靈大師（$999/月，無限次）';
    var hr=getHoursUntilReset();
    m.innerHTML='<div style="max-width:420px;padding:32px 24px;background:#0a0612;border:1px solid rgba(240,212,138,.2);border-radius:20px;text-align:center;color:#f0e8d8;max-height:90vh;overflow-y:auto">'
      +'<div style="font-size:2rem;margin-bottom:12px">🔒</div>'
      +'<div style="font-size:1rem;color:#f0d48a;font-weight:700;margin-bottom:8px">今日次數已用完</div>'
      +'<div style="font-size:.85rem;color:rgba(255,255,255,.6);line-height:1.8;margin-bottom:16px">'
      +'您的 '+pn+' 方案每天可使用 '+limit+' 次AI深度解讀指令。<br>'
      +'今日已使用 '+used+' 次。約 '+hr+' 小時後（午夜 00:00）自動歸零。</div>'
      +'<div style="text-align:left;font-size:.82rem;color:rgba(255,255,255,.5);line-height:2;margin-bottom:16px;padding:14px 16px;border-radius:12px;background:rgba(240,212,138,.04);border:1px solid rgba(240,212,138,.1)">'
      +'<div style="color:rgba(240,212,138,.8);font-weight:700;margin-bottom:8px">📋 方案一覽</div>'
      +'► 免費會員：每天 3 次（午夜歸零）<br>'
      +'► 馥靈鑰友 $399/月：每天 10 次（午夜歸零）<br>'
      +'► 馥靈大師 $999/月：無限次<br>'
      +'<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(240,212,138,.08)">'
      +'🎯 次數加購：10 次 / $199（永久有效，不歸零）</div>'
      +'<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(240,212,138,.08)">'
      +'次數用途：塔羅抽牌、命盤測算等所有複製給 AI 的解讀框架<br>以上皆不影響：命理資料複製（免費不限次）、寄信（免費不限次）、馥靈抽牌（1張免費）</div></div>'
      +'<a href="pricing.html" style="display:block;padding:14px;background:linear-gradient(135deg,#c9a044,#f0d48a);color:#0a0612;font-weight:700;border-radius:12px;text-decoration:none;margin-bottom:10px">✦ 升級方案 / 加購次數</a>'
      +'<button onclick="this.closest(\'#hl-ai-upgrade-modal\').remove()" style="display:block;width:100%;padding:10px;background:transparent;border:1px solid rgba(240,212,138,.2);border-radius:10px;color:rgba(255,255,255,.5);font-size:.85rem;cursor:pointer">明天再來</button></div>';
    m.addEventListener('click',function(e){if(e.target===m)m.remove();});
    document.body.appendChild(m);
  }

  window.HL_AI_GATE_ACTIVE=isGateActive();
  window.HL_AI_DAILY_LIMITS=DAILY_LIMITS;
})();

(function(){
  'use strict';
  window.addEventListener('load',function(){
    if(typeof window.copyText==='function'){
      var _orig=window.copyText;
      window.copyText=function(){var a=arguments;var s=this;hlAIGateCheck(function(){_orig.apply(s,a);});};
    }
    if(typeof window.copyAI==='function'){
      var _origAI=window.copyAI;
      window.copyAI=function(){var a=arguments;var s=this;hlAIGateCheck(function(){_origAI.apply(s,a);});};
    }
  });
})();
