/**
 * 馥靈之鑰 內在城堡｜房間傢具視覺化 v1.0
 * assets/js/hl-castle-room-decor.js
 *
 * 自動偵測當前房間頁面，檢查 localStorage 中已合成的傢具，
 * 如果該房間有對應傢具，在房間場景底部顯示一張微光小卡片。
 *
 * 依賴：hl-castle-material.js（hlMaterial）
 * 用法：在各 castle-room-*.html 載入此 JS 即可，無需額外設定。
 */
(function(){
  'use strict';

  // ── 傢具 → 房間對照表 ──
  // key = 房間 slug（從 URL castle-room-{slug}.html 擷取）
  // value = 該房間可能出現的傢具 id 陣列
  var FURNITURE_ROOM_MAP = {
    'mirror':       ['reflection_lamp', 'mirror_wardrobe', 'intuition_mirror'],
    'alchemy':      ['alchemy_stool', 'alchemy_cauldron_deco', 'alchemy_grand_table'],
    'dream':        ['dream_lamp', 'dream_curtain', 'dream_telescope', 'dream_bed'],
    'garden':       ['moonlight_fountain', 'garden_lantern', 'rose_vase'],
    'key':          ['key_display'],
    'kitchen':      ['herb_rack', 'kitchen_oven'],
    'library':      ['wisdom_desk', 'wisdom_lantern', 'parchment_scroll'],
    'music':        ['music_stool', 'music_shelf', 'harmony_harp'],
    'secret':       ['castle_almanac', 'parchment_scroll'],
    'star':         ['star_compass', 'starlight_armchair', 'star_map_wall'],
    'throne':       ['castle_throne', 'light_crown_shelf'],
    'treasure':     ['oracle_table', 'oracle_throne_cushion'],
    'ground':       ['reflection_lamp', 'harmony_cushion', 'light_crystal_ball'],
    'harmony':      ['harmony_cushion', 'harmony_harp', 'love_window'],
    'love':         ['rose_vase', 'love_window', 'love_altar'],
    'intuition':    ['intuition_candle', 'intuition_board', 'intuition_mirror'],
    'transform':    ['butterfly_frame', 'transform_altar', 'transform_phoenix'],
    'light':        ['light_crystal_ball', 'light_prism', 'light_crown_shelf']
  };

  // ── 傢具顯示名稱 & icon（備用，萬一 hlMaterial 還沒載入）──
  var FURNITURE_NAMES = {
    'reflection_lamp':    { name:'自省燈',     icon:'🪔' },
    'star_compass':       { name:'星命羅盤',   icon:'🧭' },
    'oracle_table':       { name:'神諭占卜台', icon:'🔮' },
    'aroma_pillow':       { name:'芳療靠枕',   icon:'🛋️' },
    'castle_almanac':     { name:'城堡年鑑',   icon:'📕' },
    'moonlight_fountain': { name:'月光噴泉',   icon:'⛲' },
    'wisdom_desk':        { name:'智慧書桌',   icon:'🗂️' }
  };

  // 芳療靠枕是通用傢具，放在任何房間都可以顯示
  var UNIVERSAL_FURNITURE = ['aroma_pillow'];

  function getRoomSlug(){
    var path = window.location.pathname;
    var match = path.match(/castle-room-([a-z]+)\.html/);
    if(match) return match[1];
    // 也嘗試從 data-tool 屬性取得
    var tracker = document.querySelector('script[data-tool^="castle-room-"]');
    if(tracker){
      var tool = tracker.getAttribute('data-tool');
      return tool.replace('castle-room-','');
    }
    return null;
  }

  function getOwnedFurniture(){
    // 優先用 hlMaterial API
    if(window.hlMaterial && typeof hlMaterial.getFurniture === 'function'){
      return hlMaterial.getFurniture();
    }
    // 回退：直接讀 localStorage
    try{
      var raw = localStorage.getItem('hl_materials_v1');
      if(!raw) return [];
      var data = JSON.parse(raw);
      var ids = data.furniture || [];
      return ids.map(function(id){
        return FURNITURE_NAMES[id] ? { id:id, name:FURNITURE_NAMES[id].name, icon:FURNITURE_NAMES[id].icon } : { id:id, name:id, icon:'✨' };
      });
    }catch(e){ return []; }
  }

  function injectStyles(){
    if(document.getElementById('hl-room-decor-style')) return;
    var style = document.createElement('style');
    style.id = 'hl-room-decor-style';
    style.textContent = [
      '.room-decor-card{',
      '  position:fixed;bottom:68px;left:50%;transform:translateX(-50%);',
      '  z-index:150;',
      '  background:linear-gradient(135deg,rgba(253,246,239,.96),rgba(247,237,226,.96));',
      '  border:1.5px solid rgba(200,134,42,.25);',
      '  border-radius:16px;',
      '  padding:10px 20px;',
      '  display:flex;align-items:center;gap:10px;',
      '  box-shadow:0 4px 20px rgba(200,134,42,.15);',
      '  font-family:"Noto Serif TC",serif;',
      '  font-size:.8rem;color:#3e2a1a;',
      '  animation:decorCardIn .6s cubic-bezier(.34,1.56,.64,1) forwards;',
      '  max-width:calc(100vw - 32px);',
      '}',
      '.room-decor-card .decor-icon{',
      '  font-size:1.4rem;',
      '  animation:decorGlow 2.5s ease-in-out infinite;',
      '  filter:drop-shadow(0 0 6px rgba(200,134,42,.4));',
      '}',
      '.room-decor-card .decor-text{',
      '  line-height:1.5;',
      '}',
      '.room-decor-card .decor-name{',
      '  font-weight:700;color:#c8862a;',
      '}',
      '@keyframes decorCardIn{',
      '  from{opacity:0;transform:translateX(-50%) translateY(20px)}',
      '  to{opacity:1;transform:translateX(-50%) translateY(0)}',
      '}',
      '@keyframes decorGlow{',
      '  0%,100%{filter:drop-shadow(0 0 4px rgba(200,134,42,.3));transform:scale(1)}',
      '  50%{filter:drop-shadow(0 0 12px rgba(200,134,42,.6));transform:scale(1.08)}',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function renderDecorCard(furnitureList){
    // 只顯示第一件（避免堆疊）
    var f = furnitureList[0];
    if(!f) return;

    injectStyles();

    var card = document.createElement('div');
    card.className = 'room-decor-card';
    card.innerHTML =
      '<span class="decor-icon">' + (f.icon || '✨') + '</span>' +
      '<span class="decor-text">你的<span class="decor-name">' + f.name + '</span>正在這個房間發光</span>';

    document.body.appendChild(card);
  }

  function getRoomStarCount(slug) {
    var state;
    try {
      var raw = localStorage.getItem('hl_materials_v1');
      state = raw ? JSON.parse(raw) : {};
    } catch(e) { state = {}; }
    var owned = state.furniture || [];
    var roomFurnitureIds = FURNITURE_ROOM_MAP[slug] || [];
    var universalOwned = UNIVERSAL_FURNITURE.filter(function(id){ return owned.indexOf(id) > -1; });
    var roomOwned = roomFurnitureIds.filter(function(id){ return owned.indexOf(id) > -1; });
    var total = roomOwned.length + universalOwned.length;
    // Stars: 1 per piece, max 5
    return Math.min(5, total);
  }

  function renderRoomStars(slug) {
    var stars = getRoomStarCount(slug);
    if(stars === 0) return; // nothing to show
    var existing = document.getElementById('hl-room-stars');
    if(existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'hl-room-stars';
    el.style.cssText = 'position:fixed;top:58px;right:12px;z-index:201;display:flex;gap:2px;align-items:center;background:rgba(253,246,239,.92);border:1px solid rgba(200,134,42,.25);border-radius:20px;padding:4px 10px;font-size:.75rem;color:#c8862a;font-family:"Noto Serif TC",serif;box-shadow:0 2px 8px rgba(200,134,42,.12);pointer-events:none;';
    var starStr = '';
    for(var i=0;i<5;i++) starStr += (i<stars ? '★' : '☆');
    el.innerHTML = starStr;
    document.body.appendChild(el);
  }

  function init(){
    var slug = getRoomSlug();
    if(!slug) return;

    var roomFurnitureIds = FURNITURE_ROOM_MAP[slug] || [];
    // 加入通用傢具
    var checkIds = roomFurnitureIds.concat(UNIVERSAL_FURNITURE);

    if(checkIds.length === 0) return;

    var owned = getOwnedFurniture();
    if(!owned || owned.length === 0) return;

    var ownedIds = owned.map(function(f){ return f.id; });

    // 找出這個房間有的傢具
    var matched = [];
    checkIds.forEach(function(id){
      if(ownedIds.indexOf(id) > -1){
        var f = owned.filter(function(o){ return o.id === id; })[0];
        if(f) matched.push(f);
      }
    });

    if(matched.length > 0){
      renderDecorCard(matched);
    }
    renderRoomStars(slug);
  }

  // 等 DOM + hlMaterial 都準備好
  function waitAndInit(){
    var tries = 0;
    var check = setInterval(function(){
      tries++;
      if(window.hlMaterial || tries > 30){
        clearInterval(check);
        init();
      }
    }, 150);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', waitAndInit);
  } else {
    waitAndInit();
  }

})();
