/**
 * 馥靈之鑰 內在城堡｜房間傢具拖放裝飾系統 v2.0
 * assets/js/hl-castle-decor-v2.js
 *
 * 取代 hl-castle-room-decor.js（v1.0 只顯示小卡片）
 * 支援拖放擺放傢具到 4x3 格子，iOS/Android 觸控優先
 *
 * 依賴：hl-castle-material.js（hlMaterial.getFurniture）
 * 用法：
 *   HLDecor.init(containerEl)    // 綁定房間圖容器
 *   HLDecor.loadRoom(roomId)     // 載入房間傢具配置
 *   HLDecor.openPanel()          // 開啟傢具庫面板
 *
 * localStorage key: hl_room_decor_v2
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'hl_room_decor_v2';
  var GRID_COLS = 4;
  var GRID_ROWS = 3;
  var TOTAL_ZONES = GRID_COLS * GRID_ROWS;

  // ── 稀有度色系 ──
  var RARITY_COLORS = {
    common:    { border:'rgba(160,140,110,.5)',  bg:'rgba(160,140,110,.08)', glow:'rgba(160,140,110,.3)' },
    rare:      { border:'rgba(100,160,220,.6)',  bg:'rgba(100,160,220,.1)',  glow:'rgba(100,160,220,.4)' },
    legendary: { border:'rgba(240,165,0,.6)',    bg:'rgba(240,165,0,.12)',   glow:'rgba(240,165,0,.5)'   }
  };

  // ── 狀態 ──
  var _container = null;   // room image container element
  var _currentRoom = null; // current room ID
  var _zones = {};         // { roomId: { 0: furnitureId|null, 1: ..., 11: ... } }
  var _panelEl = null;     // bottom drawer element
  var _overlayEl = null;   // grid overlay on room image
  var _dragState = null;   // active drag info
  var _selectedItem = null;// tapped inventory item (tap-then-place mode)
  var _panelOpen = false;
  var _styleInjected = false;

  // ══════════════════════════════════════
  //  CSS injection
  // ══════════════════════════════════════
  function injectStyles(){
    if(_styleInjected) return;
    _styleInjected = true;
    var css = document.createElement('style');
    css.id = 'hl-decor-v2-css';
    css.textContent = '\n\
/* ── Decor v2 Panel (bottom drawer) ── */\n\
.decor-panel{position:fixed;bottom:0;left:0;right:0;z-index:900;\n\
  background:linear-gradient(180deg,rgba(255,248,238,.98),rgba(253,243,230,.98));\n\
  border-top:1.5px solid rgba(200,134,42,.2);\n\
  border-radius:20px 20px 0 0;\n\
  box-shadow:0 -8px 30px rgba(0,0,0,.1);\n\
  -webkit-transform:translateY(100%);transform:translateY(100%);\n\
  transition:-webkit-transform .35s cubic-bezier(.4,.8,.6,1);transition:transform .35s cubic-bezier(.4,.8,.6,1);\n\
  font-family:"Noto Serif TC",serif;\n\
  max-height:55vh;overflow:hidden;display:flex;flex-direction:column}\n\
.decor-panel.open{-webkit-transform:translateY(0);transform:translateY(0)}\n\
\n\
.decor-panel-handle{width:40px;height:4px;border-radius:2px;background:rgba(0,0,0,.12);\n\
  margin:10px auto 6px;flex-shrink:0}\n\
\n\
.decor-panel-header{display:flex;align-items:center;justify-content:space-between;\n\
  padding:4px 18px 10px;flex-shrink:0}\n\
.decor-panel-title{font-size:.92rem;font-weight:700;color:#3e2a1a}\n\
.decor-panel-close{background:none;border:none;font-size:1.3rem;color:#3e2a1a;\n\
  cursor:pointer;padding:4px 8px;min-width:44px;min-height:44px;\n\
  display:flex;align-items:center;justify-content:center}\n\
\n\
.decor-inv-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;\n\
  padding:0 14px 20px;flex:1}\n\
.decor-inv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}\n\
.decor-inv-item{display:flex;flex-direction:column;align-items:center;\n\
  padding:12px 6px;border-radius:14px;border:1.5px solid rgba(0,0,0,.06);\n\
  background:rgba(255,255,255,.7);cursor:grab;-webkit-user-select:none;user-select:none;\n\
  touch-action:none;transition:border-color .2s,box-shadow .2s,transform .15s;min-height:80px;position:relative}\n\
.decor-inv-item.selected{border-color:rgba(240,165,0,.6);\n\
  box-shadow:0 0 12px rgba(240,165,0,.25);-webkit-transform:scale(1.04);transform:scale(1.04)}\n\
.decor-inv-item.placed{opacity:.4;pointer-events:none}\n\
.decor-inv-icon{font-size:1.6rem;margin-bottom:4px;pointer-events:none}\n\
.decor-inv-name{font-size:.68rem;color:#3e2a1a;text-align:center;line-height:1.3;\n\
  pointer-events:none;word-break:break-all}\n\
.decor-inv-empty{grid-column:1/-1;text-align:center;padding:30px 0;\n\
  font-size:.85rem;color:rgba(62,42,26,.45);line-height:1.7}\n\
\n\
/* ── Grid Overlay on Room Image ── */\n\
.decor-grid-overlay{position:absolute;top:0;left:0;right:0;bottom:0;z-index:10;\n\
  display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);\n\
  pointer-events:none;opacity:0;transition:opacity .3s}\n\
.decor-grid-overlay.active{pointer-events:auto;opacity:1}\n\
\n\
.decor-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;\n\
  border:1px dashed rgba(200,134,42,.15);transition:background .2s,border-color .2s,box-shadow .2s}\n\
.decor-zone.hover-valid{background:rgba(240,165,0,.12);border-color:rgba(240,165,0,.5);\n\
  box-shadow:inset 0 0 20px rgba(240,165,0,.15)}\n\
.decor-zone.hover-invalid{background:rgba(230,57,70,.08);border-color:rgba(230,57,70,.3)}\n\
.decor-zone.occupied .decor-zone-dot{display:block}\n\
.decor-zone-dot{display:none;width:6px;height:6px;border-radius:50%;\n\
  background:rgba(200,134,42,.3);position:absolute;bottom:4px;right:4px}\n\
\n\
/* ── Placed Furniture on Grid ── */\n\
.decor-placed{display:flex;flex-direction:column;align-items:center;justify-content:center;\n\
  cursor:pointer;-webkit-user-select:none;user-select:none;touch-action:none;\n\
  position:relative;width:100%;height:100%}\n\
.decor-placed-icon{font-size:1.4rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,.15));\n\
  transition:-webkit-transform .3s;transition:transform .3s}\n\
.decor-placed-label{font-size:.55rem;color:#3e2a1a;background:rgba(255,248,238,.85);\n\
  padding:1px 5px;border-radius:6px;margin-top:2px;white-space:nowrap;\n\
  max-width:100%;overflow:hidden;text-overflow:ellipsis}\n\
.decor-placed .decor-remove-btn{display:none;position:absolute;top:-6px;right:-6px;\n\
  width:22px;height:22px;border-radius:50%;background:rgba(230,57,70,.85);color:#fff;\n\
  border:none;font-size:.7rem;cursor:pointer;align-items:center;justify-content:center;\n\
  z-index:5;line-height:1}\n\
.decor-placed.selected-placed .decor-remove-btn{display:flex}\n\
\n\
/* ── Drag Ghost ── */\n\
.decor-drag-ghost{position:fixed;z-index:9999;pointer-events:none;\n\
  font-size:2rem;opacity:.85;transition:-webkit-transform 50ms ease-out;transition:transform 50ms ease-out;\n\
  filter:drop-shadow(0 4px 12px rgba(200,134,42,.4))}\n\
\n\
/* ── Toast ── */\n\
.decor-toast{position:fixed;top:50%;left:50%;z-index:9999;\n\
  -webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);\n\
  background:rgba(62,42,26,.88);color:#fff;padding:12px 24px;border-radius:14px;\n\
  font-size:.85rem;font-family:"Noto Serif TC",serif;\n\
  opacity:0;transition:opacity .3s;pointer-events:none}\n\
.decor-toast.show{opacity:1}\n\
\n\
/* ── Animations ── */\n\
@-webkit-keyframes decorBounceIn{0%{-webkit-transform:scale(0);transform:scale(0);opacity:0}\n\
  70%{-webkit-transform:scale(1.12);transform:scale(1.12);opacity:1}\n\
  100%{-webkit-transform:scale(1);transform:scale(1)}}\n\
@keyframes decorBounceIn{0%{transform:scale(0);opacity:0}\n\
  70%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}\n\
@-webkit-keyframes decorFadeOut{to{-webkit-transform:scale(.5);transform:scale(.5);opacity:0}}\n\
@keyframes decorFadeOut{to{transform:scale(.5);opacity:0}}\n\
@-webkit-keyframes decorShake{0%,100%{-webkit-transform:translateX(0);transform:translateX(0)}\n\
  20%{-webkit-transform:translateX(-8px);transform:translateX(-8px)}\n\
  40%{-webkit-transform:translateX(8px);transform:translateX(8px)}\n\
  60%{-webkit-transform:translateX(-5px);transform:translateX(-5px)}\n\
  80%{-webkit-transform:translateX(5px);transform:translateX(5px)}}\n\
@keyframes decorShake{0%,100%{transform:translateX(0)}\n\
  20%{transform:translateX(-8px)}40%{transform:translateX(8px)}\n\
  60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}\n\
\n\
.decor-bounce-in{-webkit-animation:decorBounceIn .3s cubic-bezier(.34,1.56,.64,1) forwards;\n\
  animation:decorBounceIn .3s cubic-bezier(.34,1.56,.64,1) forwards}\n\
.decor-fade-out{-webkit-animation:decorFadeOut .2s ease forwards;\n\
  animation:decorFadeOut .2s ease forwards}\n\
.decor-shake{-webkit-animation:decorShake .4s ease;\n\
  animation:decorShake .4s ease}\n\
\n\
/* ── 裝飾按鈕 ── */\n\
.decor-open-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;\n\
  background:linear-gradient(135deg,rgba(240,165,0,.1),rgba(200,134,42,.06));\n\
  border:1.5px solid rgba(240,165,0,.3);border-radius:12px;\n\
  font-size:.82rem;font-weight:600;color:#b8860b;cursor:pointer;\n\
  font-family:"Noto Serif TC",serif;transition:all .2s;min-height:44px}\n\
.decor-open-btn:active{-webkit-transform:scale(.97);transform:scale(.97);\n\
  background:linear-gradient(135deg,rgba(240,165,0,.18),rgba(200,134,42,.1))}\n\
\n\
/* ── Reset button ── */\n\
.decor-reset-btn{background:none;border:none;font-size:.72rem;color:rgba(62,42,26,.4);\n\
  cursor:pointer;padding:4px 8px;text-decoration:underline}\n\
';
    document.head.appendChild(css);
  }

  // ══════════════════════════════════════
  //  Storage
  // ══════════════════════════════════════
  function loadAll(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw) _zones = JSON.parse(raw);
    }catch(e){ _zones = {}; }
  }

  function saveAll(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(_zones)); }catch(e){}
  }

  function getZones(roomId){
    if(!_zones[roomId]){
      _zones[roomId] = {};
      for(var i=0;i<TOTAL_ZONES;i++) _zones[roomId][i] = null;
    }
    return _zones[roomId];
  }

  // ══════════════════════════════════════
  //  Inventory
  // ══════════════════════════════════════
  function getInventory(){
    if(window.hlMaterial && typeof hlMaterial.getFurniture === 'function'){
      return hlMaterial.getFurniture().filter(function(f){ return !!f; });
    }
    // Fallback: read localStorage directly
    try{
      var raw = localStorage.getItem('hl_materials_v1');
      if(!raw) return [];
      var data = JSON.parse(raw);
      var ids = data.furniture || [];
      return ids.map(function(id){
        return { id:id, name:id, icon:'✨', rarity:'common' };
      });
    }catch(e){ return []; }
  }

  function getPlacedIds(roomId){
    var z = getZones(roomId);
    var ids = [];
    for(var k in z){ if(z[k]) ids.push(z[k]); }
    return ids;
  }

  // ══════════════════════════════════════
  //  Toast
  // ══════════════════════════════════════
  var _toastEl = null;
  var _toastTimer = null;

  function showToast(msg){
    if(!_toastEl){
      _toastEl = document.createElement('div');
      _toastEl.className = 'decor-toast';
      document.body.appendChild(_toastEl);
    }
    _toastEl.textContent = msg;
    _toastEl.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function(){ _toastEl.classList.remove('show'); }, 1800);
  }

  // ══════════════════════════════════════
  //  Grid Overlay (on room image)
  // ══════════════════════════════════════
  function createGridOverlay(){
    if(_overlayEl) _overlayEl.remove();
    _overlayEl = document.createElement('div');
    _overlayEl.className = 'decor-grid-overlay';

    for(var i=0;i<TOTAL_ZONES;i++){
      var zone = document.createElement('div');
      zone.className = 'decor-zone';
      zone.setAttribute('data-zone', i);
      zone.style.position = 'relative';
      // Zone dot indicator
      var dot = document.createElement('div');
      dot.className = 'decor-zone-dot';
      zone.appendChild(dot);
      _overlayEl.appendChild(zone);
    }
    return _overlayEl;
  }

  function attachOverlay(){
    if(!_container) return;
    // Ensure container has relative position for absolute overlay
    var cs = window.getComputedStyle(_container);
    if(cs.position === 'static') _container.style.position = 'relative';
    _container.appendChild(createGridOverlay());
  }

  function showGrid(){
    if(_overlayEl) _overlayEl.classList.add('active');
  }

  function hideGrid(){
    if(_overlayEl) _overlayEl.classList.remove('active');
    // Deselect any placed items
    var sel = _container ? _container.querySelectorAll('.selected-placed') : [];
    for(var i=0;i<sel.length;i++) sel[i].classList.remove('selected-placed');
  }

  // ══════════════════════════════════════
  //  Render placed furniture
  // ══════════════════════════════════════
  function renderPlaced(){
    if(!_overlayEl || !_currentRoom) return;
    var zones = getZones(_currentRoom);
    var inv = getInventory();
    var invMap = {};
    inv.forEach(function(f){ invMap[f.id] = f; });

    var zoneEls = _overlayEl.querySelectorAll('.decor-zone');
    for(var i=0;i<zoneEls.length;i++){
      var el = zoneEls[i];
      var zIdx = parseInt(el.getAttribute('data-zone'));
      var fId = zones[zIdx];
      // Clear existing placed item
      var existing = el.querySelector('.decor-placed');
      if(existing) existing.remove();

      el.classList.remove('occupied');

      if(fId && invMap[fId]){
        el.classList.add('occupied');
        var f = invMap[fId];
        var placed = document.createElement('div');
        placed.className = 'decor-placed decor-bounce-in';
        placed.setAttribute('data-fid', fId);
        placed.setAttribute('data-zone', zIdx);
        placed.innerHTML = '<span class="decor-placed-icon">' + (f.icon||'✨') + '</span>'
          + '<span class="decor-placed-label">' + (f.name||fId) + '</span>'
          + '<button class="decor-remove-btn" aria-label="移除">✕</button>';

        // Touch/click handlers for placed items
        (function(placedEl, furnitureId, zoneIdx){
          // Tap to select / show remove button
          placedEl.addEventListener('click', function(e){
            e.stopPropagation();
            // If remove button clicked
            if(e.target.classList.contains('decor-remove-btn')){
              removeFurniture(zoneIdx);
              return;
            }
            // Toggle selection
            var wasSelected = placedEl.classList.contains('selected-placed');
            // Deselect all others
            var others = _overlayEl.querySelectorAll('.selected-placed');
            for(var j=0;j<others.length;j++) others[j].classList.remove('selected-placed');
            if(!wasSelected) placedEl.classList.add('selected-placed');
          });

          // Drag to reposition placed item
          addDragHandlers(placedEl, function onDragStart(){
            // Remove from current zone temporarily
            var z = getZones(_currentRoom);
            z[zoneIdx] = null;
            return { id:furnitureId, sourceZone:zoneIdx, isReposition:true };
          }, function onDragEnd(info, targetZone){
            var z = getZones(_currentRoom);
            if(targetZone !== null && targetZone !== undefined){
              if(z[targetZone] && targetZone !== zoneIdx){
                // Occupied, put back
                z[zoneIdx] = furnitureId;
                showToast('這裡已經有傢具了');
                playSound('error');
                shakeZone(targetZone);
              } else {
                z[targetZone] = furnitureId;
                playSound('click');
              }
            } else {
              // Dropped outside grid - put back
              z[zoneIdx] = furnitureId;
            }
            saveAll();
            renderPlaced();
            updateInventoryPanel();
          });
        })(placed, fId, zIdx);

        el.appendChild(placed);
      }
    }
  }

  function removeFurniture(zoneIdx){
    if(!_currentRoom) return;
    var z = getZones(_currentRoom);
    var fId = z[zoneIdx];
    if(!fId) return;

    // Animate out
    var zoneEl = _overlayEl.querySelectorAll('.decor-zone')[zoneIdx];
    var placedEl = zoneEl ? zoneEl.querySelector('.decor-placed') : null;
    if(placedEl){
      placedEl.classList.remove('decor-bounce-in');
      placedEl.classList.add('decor-fade-out');
      setTimeout(function(){
        z[zoneIdx] = null;
        saveAll();
        renderPlaced();
        updateInventoryPanel();
      }, 200);
    } else {
      z[zoneIdx] = null;
      saveAll();
      renderPlaced();
      updateInventoryPanel();
    }
    playSound('click');
    showToast('已移除 ✓');
  }

  function shakeZone(zIdx){
    var zoneEls = _overlayEl.querySelectorAll('.decor-zone');
    if(zoneEls[zIdx]){
      zoneEls[zIdx].classList.add('decor-shake');
      setTimeout(function(){ zoneEls[zIdx].classList.remove('decor-shake'); }, 400);
    }
  }

  // ══════════════════════════════════════
  //  Drag & Drop (touch + mouse)
  // ══════════════════════════════════════
  var _ghostEl = null;

  function createGhost(icon){
    if(_ghostEl) _ghostEl.remove();
    _ghostEl = document.createElement('div');
    _ghostEl.className = 'decor-drag-ghost';
    _ghostEl.textContent = icon || '✨';
    _ghostEl.style.display = 'none';
    document.body.appendChild(_ghostEl);
    return _ghostEl;
  }

  function moveGhost(x, y){
    if(!_ghostEl) return;
    _ghostEl.style.display = 'block';
    _ghostEl.style.left = (x - 20) + 'px';
    _ghostEl.style.top = (y - 20) + 'px';
  }

  function removeGhost(){
    if(_ghostEl){ _ghostEl.remove(); _ghostEl = null; }
  }

  function getZoneFromPoint(x, y){
    if(!_overlayEl) return null;
    var zones = _overlayEl.querySelectorAll('.decor-zone');
    for(var i=0;i<zones.length;i++){
      var rect = zones[i].getBoundingClientRect();
      if(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom){
        return parseInt(zones[i].getAttribute('data-zone'));
      }
    }
    return null;
  }

  function clearZoneHovers(){
    if(!_overlayEl) return;
    var zones = _overlayEl.querySelectorAll('.decor-zone');
    for(var i=0;i<zones.length;i++){
      zones[i].classList.remove('hover-valid', 'hover-invalid');
    }
  }

  function addDragHandlers(el, onStart, onEnd){
    var dragInfo = null;
    var isDragging = false;
    var startX, startY;
    var longPressTimer = null;
    var DRAG_THRESHOLD = 8;

    function beginDrag(x, y, e){
      isDragging = true;
      dragInfo = onStart();
      if(!dragInfo) { isDragging = false; return; }

      var furniture = getFurnitureById(dragInfo.id);
      createGhost(furniture ? furniture.icon : '✨');
      moveGhost(x, y);
      showGrid();

      // Prevent scroll
      document.body.style.overflow = 'hidden';
    }

    function handleMove(x, y){
      if(!isDragging) return;
      moveGhost(x, y);

      // Highlight zone under cursor
      clearZoneHovers();
      var zIdx = getZoneFromPoint(x, y);
      if(zIdx !== null){
        var z = getZones(_currentRoom);
        var zoneEls = _overlayEl.querySelectorAll('.decor-zone');
        if(z[zIdx] && !(dragInfo.isReposition && dragInfo.sourceZone === zIdx)){
          zoneEls[zIdx].classList.add('hover-invalid');
        } else {
          zoneEls[zIdx].classList.add('hover-valid');
        }
      }
    }

    function endDrag(x, y){
      if(!isDragging) return;
      isDragging = false;
      document.body.style.overflow = '';

      clearZoneHovers();
      removeGhost();

      var zIdx = getZoneFromPoint(x, y);
      onEnd(dragInfo, zIdx);
      dragInfo = null;

      // Keep grid visible if panel is open
      if(!_panelOpen) hideGrid();
    }

    // ── Touch events ──
    el.addEventListener('touchstart', function(e){
      if(e.touches.length !== 1) return;
      var touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      isDragging = false;

      // Long press to start drag
      longPressTimer = setTimeout(function(){
        beginDrag(startX, startY, e);
      }, 300);
    }, {passive:false});

    el.addEventListener('touchmove', function(e){
      if(e.touches.length !== 1) return;
      var touch = e.touches[0];
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;

      if(!isDragging && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)){
        clearTimeout(longPressTimer);
        beginDrag(touch.clientX, touch.clientY, e);
      }

      if(isDragging){
        e.preventDefault();
        handleMove(touch.clientX, touch.clientY);
      }
    }, {passive:false});

    el.addEventListener('touchend', function(e){
      clearTimeout(longPressTimer);
      if(isDragging){
        var touch = e.changedTouches[0];
        endDrag(touch.clientX, touch.clientY);
      }
    });

    el.addEventListener('touchcancel', function(){
      clearTimeout(longPressTimer);
      if(isDragging){
        isDragging = false;
        document.body.style.overflow = '';
        clearZoneHovers();
        removeGhost();
        if(dragInfo && dragInfo.isReposition){
          var z = getZones(_currentRoom);
          z[dragInfo.sourceZone] = dragInfo.id;
          saveAll();
          renderPlaced();
        }
        dragInfo = null;
      }
    });

    // ── Mouse events ──
    el.addEventListener('mousedown', function(e){
      if(e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;

      function onMouseMove(ev){
        var dx = ev.clientX - startX;
        var dy = ev.clientY - startY;
        if(!isDragging && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)){
          beginDrag(ev.clientX, ev.clientY, ev);
        }
        if(isDragging){
          ev.preventDefault();
          handleMove(ev.clientX, ev.clientY);
        }
      }

      function onMouseUp(ev){
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if(isDragging){
          endDrag(ev.clientX, ev.clientY);
        }
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  // ══════════════════════════════════════
  //  Inventory Panel (bottom drawer)
  // ══════════════════════════════════════
  function createPanel(){
    if(_panelEl) return _panelEl;

    _panelEl = document.createElement('div');
    _panelEl.className = 'decor-panel';
    _panelEl.innerHTML = '<div class="decor-panel-handle"></div>'
      + '<div class="decor-panel-header">'
      + '  <span class="decor-panel-title">🛋️ 我的傢具</span>'
      + '  <div style="display:flex;align-items:center;gap:8px">'
      + '    <button class="decor-reset-btn" id="decorResetBtn">清空房間</button>'
      + '    <button class="decor-panel-close" id="decorCloseBtn">✕</button>'
      + '  </div>'
      + '</div>'
      + '<div class="decor-inv-scroll">'
      + '  <div class="decor-inv-grid" id="decorInvGrid"></div>'
      + '</div>';

    document.body.appendChild(_panelEl);

    // Close button
    _panelEl.querySelector('#decorCloseBtn').addEventListener('click', function(){
      closePanel();
    });

    // Reset button
    _panelEl.querySelector('#decorResetBtn').addEventListener('click', function(){
      if(!_currentRoom) return;
      _zones[_currentRoom] = {};
      for(var i=0;i<TOTAL_ZONES;i++) _zones[_currentRoom][i] = null;
      saveAll();
      renderPlaced();
      updateInventoryPanel();
      showToast('已清空房間 ✓');
    });

    // Handle swipe down to close
    var panelStartY = 0;
    _panelEl.addEventListener('touchstart', function(e){
      if(e.target.closest('.decor-inv-item')) return; // Don't interfere with item drag
      panelStartY = e.touches[0].clientY;
    }, {passive:true});
    _panelEl.addEventListener('touchmove', function(e){
      if(e.target.closest('.decor-inv-item')) return;
    }, {passive:true});
    _panelEl.addEventListener('touchend', function(e){
      if(e.target.closest('.decor-inv-item')) return;
      var dy = e.changedTouches[0].clientY - panelStartY;
      if(dy > 60) closePanel();
    });

    return _panelEl;
  }

  function updateInventoryPanel(){
    if(!_panelEl) return;
    var grid = _panelEl.querySelector('#decorInvGrid');
    if(!grid) return;

    var inv = getInventory();
    var placedIds = _currentRoom ? getPlacedIds(_currentRoom) : [];

    if(!inv.length){
      grid.innerHTML = '<div class="decor-inv-empty">還沒有傢具<br><span style="font-size:.75rem;margin-top:6px;display:inline-block">去精品店合成材料吧</span></div>';
      return;
    }

    grid.innerHTML = '';

    inv.forEach(function(f){
      if(!f || !f.id) return;
      var isPlaced = placedIds.indexOf(f.id) > -1;
      var rarity = f.rarity || (RARITY_COLORS[f.rarity] ? f.rarity : 'common');
      var colors = RARITY_COLORS[rarity] || RARITY_COLORS.common;

      var item = document.createElement('div');
      item.className = 'decor-inv-item' + (isPlaced ? ' placed' : '');
      item.setAttribute('data-fid', f.id);
      item.style.borderColor = colors.border;
      item.style.background = colors.bg;
      item.innerHTML = '<span class="decor-inv-icon">' + (f.icon||'✨') + '</span>'
        + '<span class="decor-inv-name">' + (f.name||f.id) + '</span>';

      if(!isPlaced){
        // Tap to select
        item.addEventListener('click', function(e){
          e.stopPropagation();
          var wasSelected = item.classList.contains('selected');
          // Deselect all
          var all = grid.querySelectorAll('.decor-inv-item');
          for(var i=0;i<all.length;i++) all[i].classList.remove('selected');

          if(!wasSelected){
            item.classList.add('selected');
            _selectedItem = f;
            showGrid();
            showToast('點擊房間格子放置傢具');
          } else {
            _selectedItem = null;
            hideGrid();
          }
        });

        // Drag from inventory
        addDragHandlers(item, function(){
          _selectedItem = null;
          // Deselect all items visually
          var all = grid.querySelectorAll('.decor-inv-item');
          for(var i=0;i<all.length;i++) all[i].classList.remove('selected');
          return { id:f.id, isReposition:false };
        }, function(info, targetZone){
          if(targetZone === null || targetZone === undefined){
            // Dropped outside
            return;
          }
          placeFurniture(info.id, targetZone);
        });
      }

      grid.appendChild(item);
    });
  }

  function placeFurniture(fId, zoneIdx){
    if(!_currentRoom) return;
    var z = getZones(_currentRoom);

    // Check if already placed in this room
    for(var k in z){
      if(z[k] === fId){
        showToast('這件傢具已經擺在房間裡了');
        playSound('error');
        shakeZone(zoneIdx);
        return;
      }
    }

    // Check if zone occupied
    if(z[zoneIdx]){
      showToast('這裡已經有傢具了');
      playSound('error');
      shakeZone(zoneIdx);
      return;
    }

    z[zoneIdx] = fId;
    saveAll();
    renderPlaced();
    updateInventoryPanel();
    playSound('click');
  }

  // Zone click handler (for tap-to-place mode)
  function handleZoneClick(e){
    var zoneEl = e.target.closest('.decor-zone');
    if(!zoneEl) return;
    if(e.target.closest('.decor-placed')) return; // Let placed item handler deal with it

    var zIdx = parseInt(zoneEl.getAttribute('data-zone'));
    if(_selectedItem){
      placeFurniture(_selectedItem.id, zIdx);
      _selectedItem = null;
      // Deselect in panel
      if(_panelEl){
        var items = _panelEl.querySelectorAll('.decor-inv-item');
        for(var i=0;i<items.length;i++) items[i].classList.remove('selected');
      }
    }
  }

  // ══════════════════════════════════════
  //  Helpers
  // ══════════════════════════════════════
  function getFurnitureById(id){
    var inv = getInventory();
    for(var i=0;i<inv.length;i++){
      if(inv[i].id === id) return inv[i];
    }
    return null;
  }

  function playSound(type){
    if(!window.HLSound) return;
    if(type === 'click' && HLSound.click) HLSound.click();
    else if(type === 'error' && HLSound.error) HLSound.error();
    else if(type === 'success' && HLSound.success) HLSound.success();
  }

  // ══════════════════════════════════════
  //  Public API
  // ══════════════════════════════════════
  function init(containerEl){
    if(!containerEl) return;
    injectStyles();
    loadAll();
    _container = containerEl;
    attachOverlay();

    // Click on grid zones for tap-to-place
    if(_overlayEl){
      _overlayEl.addEventListener('click', handleZoneClick);
    }
  }

  function loadRoom(roomId){
    _currentRoom = roomId;
    if(!_zones[roomId]){
      _zones[roomId] = {};
      for(var i=0;i<TOTAL_ZONES;i++) _zones[roomId][i] = null;
    }
    renderPlaced();
    if(_panelOpen) updateInventoryPanel();
  }

  function saveRoom(roomId){
    saveAll();
  }

  function openPanel(){
    injectStyles();
    createPanel();
    updateInventoryPanel();
    _panelOpen = true;
    // Force reflow before adding open class
    _panelEl.offsetHeight;
    _panelEl.classList.add('open');
    showGrid();
  }

  function closePanel(){
    _panelOpen = false;
    _selectedItem = null;
    if(_panelEl) _panelEl.classList.remove('open');
    hideGrid();
  }

  function reset(roomId){
    var rid = roomId || _currentRoom;
    if(!rid) return;
    _zones[rid] = {};
    for(var i=0;i<TOTAL_ZONES;i++) _zones[rid][i] = null;
    saveAll();
    renderPlaced();
    if(_panelOpen) updateInventoryPanel();
  }

  window.HLDecor = {
    init:         init,
    loadRoom:     loadRoom,
    saveRoom:     saveRoom,
    getInventory: getInventory,
    openPanel:    openPanel,
    closePanel:   closePanel,
    reset:        reset
  };

})();
