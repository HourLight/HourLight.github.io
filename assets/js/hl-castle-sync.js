/**
 * 馥靈之鑰 城堡雲端存檔系統 v1.0
 * 確保玩家進度永遠不會消失
 *
 * 邏輯：
 * 1. 登入時：從 Firebase 讀取雲端存檔
 * 2. 跟 localStorage 比較，取較新/較完整的
 * 3. 合併後同時寫入 localStorage 和 Firebase
 * 4. 之後每次 localStorage 變動，自動同步到 Firebase
 * 5. 離線時正常玩（存 localStorage），上線後自動同步
 *
 * iOS Safari 安全措施：
 * - 所有 localStorage 呼叫都在 try/catch 中
 * - 不覆寫 localStorage.setItem（iOS Safari 可能凍結）
 * - 用 polling + Storage event 偵測變更
 * - 登入時永遠先讀雲端（iOS PWA 7天閒置會清 localStorage）
 * - 寫入前檢查大小不超過 4MB
 *
 * Firestore path: users/{uid}/castle_save/state
 */
(function(){
  'use strict';

  // ═══ 設定 ═══
  var SYNC_KEYS = [
    'hl_castle_v3',
    'hl_castle_diary',
    'hl_materials_v1',
    'hl_room_decor_v2',
    'hl_pets_v1'
  ];
  var FIRESTORE_COL  = 'castle_save';
  var FIRESTORE_DOC  = 'state';
  var DEBOUNCE_MS    = 3000;
  var POLL_MS        = 2000;   // polling 間隔
  var TOAST_MS       = 1500;
  var MAX_BYTES      = 4 * 1024 * 1024; // 4MB 安全上限

  var _syncTimer   = null;
  var _dirty       = false;
  var _syncing     = false;
  var _ready       = false;
  var _userId      = null;
  var _snapshot    = {};       // 上次已知的 localStorage 快照（用於偵測變更）
  var _pollTimer   = null;
  var _lsAvailable = null;     // localStorage 是否可用

  // ═══ localStorage 可用性檢查 ═══
  function isLsAvailable(){
    if(_lsAvailable !== null) return _lsAvailable;
    try{
      var t = '__hl_test__';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      _lsAvailable = true;
    }catch(e){
      _lsAvailable = false;
    }
    return _lsAvailable;
  }

  // ═══ 安全 localStorage 操作 ═══
  function safeGetItem(key){
    if(!isLsAvailable()) return null;
    try{ return localStorage.getItem(key); }catch(e){ return null; }
  }

  function safeSetItem(key, value){
    if(!isLsAvailable()) return false;
    try{
      localStorage.setItem(key, value);
      return true;
    }catch(e){
      // QuotaExceededError 或 iOS private mode
      return false;
    }
  }

  // ═══ Firebase 工具 ═══
  function getDb(){
    try{
      if(typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length && firebase.firestore){
        return firebase.firestore();
      }
    }catch(e){}
    return null;
  }

  function getUser(){
    try{
      if(typeof firebase !== 'undefined' && firebase.auth){
        return firebase.auth().currentUser;
      }
    }catch(e){}
    return null;
  }

  function docRef(uid){
    var db = getDb();
    if(!db || !uid) return null;
    return db.collection('users').doc(uid).collection(FIRESTORE_COL).doc(FIRESTORE_DOC);
  }

  function now(){ return new Date().toISOString(); }

  // ═══ Toast ═══
  function showSyncToast(){
    try{
      var existing = document.getElementById('hlSyncToast');
      if(existing) existing.remove();

      var el = document.createElement('div');
      el.id = 'hlSyncToast';
      el.textContent = '\u2601\ufe0f \u5df2\u540c\u6b65';
      el.style.cssText = 'position:fixed;bottom:70px;right:16px;background:rgba(30,20,50,0.92);' +
        'color:#f8dfa5;padding:6px 14px;border-radius:20px;font-size:13px;z-index:99999;' +
        'opacity:0;transition:opacity 0.3s;pointer-events:none;border:1px solid rgba(248,223,165,0.3);';
      document.body.appendChild(el);

      requestAnimationFrame(function(){
        el.style.opacity = '1';
        setTimeout(function(){
          el.style.opacity = '0';
          setTimeout(function(){ if(el.parentNode) el.remove(); }, 400);
        }, TOAST_MS);
      });
    }catch(e){}
  }

  // ═══ 讀取本地所有城堡資料 ═══
  function readAllLocal(){
    var result = {};
    for(var i = 0; i < SYNC_KEYS.length; i++){
      result[SYNC_KEYS[i]] = safeGetItem(SYNC_KEYS[i]);
    }
    return result;
  }

  // ═══ 寫入本地（標記來源避免迴圈） ═══
  var _writingFromSync = false;
  function writeLocalFromSync(key, value){
    _writingFromSync = true;
    try{
      if(value === null || value === undefined){
        if(isLsAvailable()) localStorage.removeItem(key);
      } else {
        safeSetItem(key, value);
      }
    }catch(e){}
    _writingFromSync = false;
    // 更新快照
    _snapshot[key] = value;
  }

  // ═══ 大小檢查 ═══
  function totalSyncSize(data){
    var size = 0;
    for(var i = 0; i < SYNC_KEYS.length; i++){
      var v = data[SYNC_KEYS[i]];
      if(v) size += v.length * 2; // UTF-16
    }
    return size;
  }

  // ═══ 合併邏輯（核心：永遠不丟進度） ═══

  function safeParse(str){
    if(!str) return null;
    try{ return JSON.parse(str); }catch(e){ return null; }
  }

  // --- 城堡鑰匙狀態合併 ---
  function mergeCastle(localStr, cloudStr){
    var local = safeParse(localStr);
    var cloud = safeParse(cloudStr);
    if(!local && !cloud) return null;
    if(!local) return cloudStr;
    if(!cloud) return localStr;

    var merged = {};

    // 數值型：取較大
    var numKeys = ['points','streak','totalRooms','shareCount','redeemCount','totalDays'];
    for(var i = 0; i < numKeys.length; i++){
      var nk = numKeys[i];
      merged[nk] = Math.max(local[nk] || 0, cloud[nk] || 0);
    }

    // 日期型：取較新
    var dateKeys = ['lastDate','lastVisit'];
    for(var j = 0; j < dateKeys.length; j++){
      var dk = dateKeys[j];
      merged[dk] = (local[dk] || '') > (cloud[dk] || '') ? local[dk] : cloud[dk];
    }

    // 陣列型：聯集
    merged.unlockedRooms  = arrayUnion(local.unlockedRooms, cloud.unlockedRooms);
    merged.achievements   = arrayUnion(local.achievements, cloud.achievements);
    merged.completedRooms = arrayUnion(local.completedRooms, cloud.completedRooms);

    // redeemHistory / coupons：依 code/id 去重聯集
    merged.redeemHistory = dedupeByKey(local.redeemHistory, cloud.redeemHistory, 'code');
    merged.coupons       = dedupeByKey(local.coupons, cloud.coupons, 'code');

    // daily：取完成房間較多的那邊
    var ld = local.daily || {}, cd = cloud.daily || {};
    var ldCount = countDone(ld), cdCount = countDone(cd);
    merged.daily = ldCount >= cdCount ? ld : cd;

    // KV 型：合併取較大值
    merged.milestones  = mergeKVMax(local.milestones, cloud.milestones);
    merged.castleBonus = mergeKVMax(local.castleBonus, cloud.castleBonus);

    // 未列舉的欄位：cloud 優先、local 補充
    copyRemaining(merged, cloud, local);

    return JSON.stringify(merged);
  }

  function countDone(daily){
    var n = 0;
    for(var k in daily){ if(daily[k] === 'done') n++; }
    return n;
  }

  // --- 材料庫存合併 ---
  function mergeMaterials(localStr, cloudStr){
    var local = safeParse(localStr);
    var cloud = safeParse(cloudStr);
    if(!local && !cloud) return null;
    if(!local) return cloudStr;
    if(!cloud) return localStr;

    var merged = {};

    // inventory：每個材料取較大數量
    merged.inventory = mergeKVMax(local.inventory, cloud.inventory);

    // furniture：聯集（依 id 去重）
    merged.furniture = mergeArrayById(local.furniture, cloud.furniture);

    // dailyDrops：合併取較大
    merged.dailyDrops = mergeKVMax(local.dailyDrops, cloud.dailyDrops);

    // totalDrops：取較大
    merged.totalDrops = Math.max(local.totalDrops || 0, cloud.totalDrops || 0);

    copyRemaining(merged, cloud, local);

    return JSON.stringify(merged);
  }

  // --- 房間裝飾合併 ---
  function mergeDecor(localStr, cloudStr){
    var local = safeParse(localStr);
    var cloud = safeParse(cloudStr);
    if(!local && !cloud) return null;
    if(!local) return cloudStr;
    if(!cloud) return localStr;

    var merged = {};
    var seen = {};
    var allRooms = Object.keys(local).concat(Object.keys(cloud));
    for(var i = 0; i < allRooms.length; i++){
      var rm = allRooms[i];
      if(seen[rm]) continue;
      seen[rm] = true;

      var lr = local[rm] || {};
      var cr = cloud[rm] || {};

      // 合併每個 zone：有傢具的優先保留
      merged[rm] = {};
      var zoneKeys = {};
      var lk = Object.keys(lr), ck = Object.keys(cr);
      for(var a = 0; a < lk.length; a++) zoneKeys[lk[a]] = true;
      for(var b = 0; b < ck.length; b++) zoneKeys[ck[b]] = true;
      for(var z in zoneKeys){
        // 有值的優先；兩邊都有就保留 local（玩家最近操作）
        if(lr[z]) merged[rm][z] = lr[z];
        else if(cr[z]) merged[rm][z] = cr[z];
      }
    }

    return JSON.stringify(merged);
  }

  // --- 寵物狀態合併 ---
  function mergePets(localStr, cloudStr){
    var local = safeParse(localStr);
    var cloud = safeParse(cloudStr);
    if(!local && !cloud) return null;
    if(!local) return cloudStr;
    if(!cloud) return localStr;

    var merged = {};

    // 數值型
    var nums = ['lightLevel','totalFeeds','totalPlays'];
    for(var i = 0; i < nums.length; i++){
      merged[nums[i]] = Math.max(local[nums[i]] || 0, cloud[nums[i]] || 0);
    }

    // 布林型：只要任一為 true 就 true
    var bools = ['firstFeedDone','firstPlayDone','firstFurnitureDone'];
    for(var j = 0; j < bools.length; j++){
      merged[bools[j]] = !!(local[bools[j]] || cloud[bools[j]]);
    }

    // cats：聯集
    merged.cats = mergeArrayById(local.cats, cloud.cats);

    // petMoods：KV 合併
    merged.petMoods = mergeKVMax(local.petMoods, cloud.petMoods);
    merged.moods    = mergeKVMax(local.moods, cloud.moods);

    // zodiac / birthYear：有值優先
    merged.zodiac    = local.zodiac || cloud.zodiac;
    merged.birthYear = local.birthYear || cloud.birthYear;

    copyRemaining(merged, cloud, local);

    return JSON.stringify(merged);
  }

  // --- 日記合併（陣列，去重保留全部） ---
  function mergeDiary(localStr, cloudStr){
    var local = safeParse(localStr);
    var cloud = safeParse(cloudStr);
    if(!Array.isArray(local)) local = [];
    if(!Array.isArray(cloud)) cloud = [];
    if(local.length === 0 && cloud.length === 0) return null;

    var seen = {};
    var merged = [];
    var all = local.concat(cloud);
    for(var i = 0; i < all.length; i++){
      var entry = all[i];
      if(!entry) continue;
      var key = (entry.date || '') + '|' + (entry.roomId || '') + '|' + (entry.question || '').substring(0, 30);
      if(!seen[key]){
        seen[key] = true;
        merged.push(entry);
      }
    }

    // 按日期排序（新的在前）
    merged.sort(function(a, b){
      return (b.date || '') > (a.date || '') ? 1 : (b.date || '') < (a.date || '') ? -1 : 0;
    });

    // 上限 90 筆（跟 hl-castle-key.js 一致）
    if(merged.length > 90) merged = merged.slice(0, 90);

    return JSON.stringify(merged);
  }

  // ═══ 合併工具函數 ═══

  function arrayUnion(a, b){
    var arr = (a || []).concat(b || []);
    var seen = {};
    var result = [];
    for(var i = 0; i < arr.length; i++){
      var v = arr[i];
      if(v != null && !seen[v]){
        seen[v] = true;
        result.push(v);
      }
    }
    return result;
  }

  function mergeArrayById(a, b){
    var arr = (a || []).concat(b || []);
    var seen = {};
    var result = [];
    for(var i = 0; i < arr.length; i++){
      var item = arr[i];
      if(!item) continue;
      var id = item.id || item.furnitureId || JSON.stringify(item);
      if(!seen[id]){
        seen[id] = true;
        result.push(item);
      }
    }
    return result;
  }

  function mergeKVMax(a, b){
    var result = {};
    a = a || {};
    b = b || {};
    var seen = {};
    var allKeys = Object.keys(a).concat(Object.keys(b));
    for(var i = 0; i < allKeys.length; i++){
      var k = allKeys[i];
      if(seen[k]) continue;
      seen[k] = true;
      var va = a[k], vb = b[k];
      if(va === undefined){ result[k] = vb; continue; }
      if(vb === undefined){ result[k] = va; continue; }
      if(typeof va === 'number' && typeof vb === 'number'){
        result[k] = Math.max(va, vb);
      } else {
        result[k] = va > vb ? va : vb;
      }
    }
    return result;
  }

  function dedupeByKey(a, b, keyProp){
    var arr = (a || []).concat(b || []);
    var seen = {};
    var result = [];
    for(var i = 0; i < arr.length; i++){
      var item = arr[i];
      if(!item) continue;
      var k = item[keyProp] || item.id || JSON.stringify(item);
      if(!seen[k]){
        seen[k] = true;
        result.push(item);
      }
    }
    return result;
  }

  function copyRemaining(merged, primary, secondary){
    var sources = [primary, secondary];
    for(var s = 0; s < sources.length; s++){
      var src = sources[s];
      if(!src) continue;
      var keys = Object.keys(src);
      for(var i = 0; i < keys.length; i++){
        if(merged[keys[i]] === undefined){
          merged[keys[i]] = src[keys[i]];
        }
      }
    }
  }

  // 選擇正確的合併函數
  function mergeByKey(key, localStr, cloudStr){
    switch(key){
      case 'hl_castle_v3':     return mergeCastle(localStr, cloudStr);
      case 'hl_castle_diary':  return mergeDiary(localStr, cloudStr);
      case 'hl_materials_v1':  return mergeMaterials(localStr, cloudStr);
      case 'hl_room_decor_v2': return mergeDecor(localStr, cloudStr);
      case 'hl_pets_v1':       return mergePets(localStr, cloudStr);
      default:
        // 未知 key：取較長的
        if(!localStr) return cloudStr;
        if(!cloudStr) return localStr;
        return (localStr.length >= cloudStr.length) ? localStr : cloudStr;
    }
  }

  // ═══ 雲端讀取 ═══
  function loadFromCloud(callback){
    var user = getUser();
    if(!user){ callback(null); return; }

    var ref = docRef(user.uid);
    if(!ref){ callback(null); return; }

    ref.get().then(function(doc){
      callback(doc.exists ? doc.data() : null);
    }).catch(function(err){
      console.warn('[castle-sync] cloud load error:', err);
      callback(null);
    });
  }

  // ═══ 雲端寫入（fire-and-forget） ═══
  function syncToCloud(){
    if(_syncing) return;
    var user = getUser();
    if(!user) return;

    var ref = docRef(user.uid);
    if(!ref) return;

    _syncing = true;
    _dirty = false;

    var localData = readAllLocal();

    // 大小檢查
    if(totalSyncSize(localData) > MAX_BYTES){
      console.warn('[castle-sync] data too large, skipping sync');
      _syncing = false;
      return;
    }

    var payload = {
      lastSyncAt: now(),
      version: 1
    };
    for(var i = 0; i < SYNC_KEYS.length; i++){
      payload[SYNC_KEYS[i]] = localData[SYNC_KEYS[i]] || null;
    }

    ref.set(payload, { merge: true }).then(function(){
      _syncing = false;
      showSyncToast();
      if(_dirty) scheduleSyncToCloud();
    }).catch(function(err){
      console.warn('[castle-sync] cloud write error:', err);
      _syncing = false;
      if(_dirty) scheduleSyncToCloud();
    });
  }

  // ═══ 排程同步（防抖） ═══
  function scheduleSyncToCloud(){
    _dirty = true;
    if(_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(function(){
      _syncTimer = null;
      syncToCloud();
    }, DEBOUNCE_MS);
  }

  // ═══ Polling：偵測 localStorage 變更 ═══
  // 不覆寫 localStorage.setItem（iOS Safari 相容性問題），改用 polling
  function takeSnapshot(){
    var snap = {};
    for(var i = 0; i < SYNC_KEYS.length; i++){
      snap[SYNC_KEYS[i]] = safeGetItem(SYNC_KEYS[i]);
    }
    return snap;
  }

  function hasChanged(oldSnap, newSnap){
    for(var i = 0; i < SYNC_KEYS.length; i++){
      var k = SYNC_KEYS[i];
      if(oldSnap[k] !== newSnap[k]) return true;
    }
    return false;
  }

  function startPolling(){
    if(_pollTimer) return;
    _snapshot = takeSnapshot();
    _pollTimer = setInterval(function(){
      if(!_ready || !_userId) return;
      var current = takeSnapshot();
      if(hasChanged(_snapshot, current)){
        _snapshot = current;
        scheduleSyncToCloud();
      }
    }, POLL_MS);
  }

  function stopPolling(){
    if(_pollTimer){
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  }

  // 也監聽 storage event（跨 tab 同步）
  try{
    window.addEventListener('storage', function(e){
      if(!_ready || !_userId) return;
      if(SYNC_KEYS.indexOf(e.key) !== -1){
        _snapshot[e.key] = e.newValue;
        scheduleSyncToCloud();
      }
    });
  }catch(e){}

  // ═══ 登入時：讀取雲端 + 合併 + 寫回雙邊 ═══
  function onLogin(user){
    if(!user || !user.uid) return;
    _userId = user.uid;

    // 永遠先讀雲端（iOS PWA 可能已清除 localStorage）
    loadFromCloud(function(cloudData){
      var localData = readAllLocal();
      var hasChanges = false;

      if(cloudData){
        for(var i = 0; i < SYNC_KEYS.length; i++){
          var key = SYNC_KEYS[i];
          var localVal = localData[key] || null;
          var cloudVal = cloudData[key] || null;

          if(!localVal && !cloudVal) continue;

          var merged = mergeByKey(key, localVal, cloudVal);

          // 寫回 localStorage
          if(merged && merged !== localVal){
            writeLocalFromSync(key, merged);
            hasChanges = true;
          }
        }
      }

      _ready = true;

      // 更新快照
      _snapshot = takeSnapshot();

      // 推一次到雲端
      syncToCloud();

      // 啟動 polling
      startPolling();

      // 通知各模組重新讀取
      if(hasChanges){
        notifyModulesReload();
      }
    });
  }

  // ═══ 登出 ═══
  function onLogout(){
    if(_userId && _dirty){
      // 最後推一次
      try{ syncToCloud(); }catch(e){}
    }
    _userId = null;
    _ready = false;
    stopPolling();
  }

  // ═══ 通知模組重新載入 ═══
  function notifyModulesReload(){
    // 自訂事件
    try{
      window.dispatchEvent(new CustomEvent('hlCastleSyncMerged', {
        detail: { keys: SYNC_KEYS }
      }));
    }catch(e){}

    // hlCastle 有 reload 方法
    try{
      if(window.hlCastle && typeof window.hlCastle.reload === 'function'){
        window.hlCastle.reload();
      }
    }catch(e){}

    // 其他模組沒有 reload，但它們的函數每次都從 localStorage 重新讀取，
    // 所以 localStorage 更新後下次呼叫就會拿到新資料。
    // 如果頁面上有已渲染的 UI，刷新一次即可。
  }

  // ═══ 監聽 Firebase Auth ═══
  function initAuthListener(){
    try{
      if(typeof firebase === 'undefined' || !firebase.auth) return false;
      firebase.auth().onAuthStateChanged(function(user){
        if(user){
          onLogin(user);
        } else {
          onLogout();
        }
      });
      return true;
    }catch(e){
      return false;
    }
  }

  // Firebase 可能還沒初始化，等一下再試
  var _initTries = 0;
  var _initTimer = setInterval(function(){
    _initTries++;
    if(_initTries > 40){
      clearInterval(_initTimer);
      return;
    }
    if(initAuthListener()){
      clearInterval(_initTimer);
    }
  }, 250);

  // ═══ 頁面關閉前 ═══
  try{
    window.addEventListener('beforeunload', function(){
      if(!_dirty || !_userId) return;
      if(_syncTimer){
        clearTimeout(_syncTimer);
        _syncTimer = null;
      }
      try{ syncToCloud(); }catch(e){}
    });
  }catch(e){}

  // ═══ 從背景回到前台 ═══
  try{
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'visible' && _ready && _userId){
        // 回到前台，立刻檢查
        var current = takeSnapshot();
        if(hasChanged(_snapshot, current)){
          _snapshot = current;
          scheduleSyncToCloud();
        }
      }
    });
  }catch(e){}

  // ═══ 對外 API（除錯用） ═══
  window.hlCastleSync = {
    syncNow: function(){ syncToCloud(); },
    getStatus: function(){
      return {
        ready: _ready,
        dirty: _dirty,
        syncing: _syncing,
        userId: _userId,
        lsAvailable: isLsAvailable(),
        keys: SYNC_KEYS
      };
    },
    forceMerge: function(){
      if(!_userId) return 'Not logged in';
      onLogin(getUser());
      return 'Merge triggered';
    }
  };

})();
