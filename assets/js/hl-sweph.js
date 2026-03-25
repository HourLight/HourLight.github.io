/**
 * 馥靈之鑰 Swiss Ephemeris WASM 共用模組 v1.0
 * 
 * 用法：
 *   await hlSweph.init();
 *   var sun = hlSweph.calcPlanet(Y,M,D,H, hlSweph.SE_SUN);
 *   // sun = { lon: 度數, lat, dist, lonSpd, precision }
 *   
 *   var moon = hlSweph.calcSidereal(Y,M,D,H, hlSweph.SE_MOON);
 *   // 恆星黃道（Lahiri歲差校正）
 */
(function(){
  'use strict';
  var swe = null;
  var ready = false;
  var loading = false;
  var CDN = 'https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js';

  // Swiss Ephemeris 天體常數
  var BODIES = {
    SE_SUN:0, SE_MOON:1, SE_MERCURY:2, SE_VENUS:3, SE_MARS:4,
    SE_JUPITER:5, SE_SATURN:6, SE_URANUS:7, SE_NEPTUNE:8, SE_PLUTO:9,
    SE_MEAN_NODE:10, SE_TRUE_NODE:11, SE_MEAN_APOG:12, SE_OSCU_APOG:13,
    SE_CHIRON:15, SE_PHOLUS:16, SE_CERES:17, SE_PALLAS:18,
    SE_JUNO:19, SE_VESTA:20
  };

  async function init(){
    if(ready) return true;
    if(loading) {
      // 等待其他頁面的載入完成
      return new Promise(function(res){
        var check = setInterval(function(){
          if(ready||!loading){clearInterval(check);res(ready);}
        },100);
        setTimeout(function(){clearInterval(check);res(false);},10000);
      });
    }
    loading = true;
    try{
      var mod = await import(CDN);
      var SwissEph = mod.default;
      swe = new SwissEph();
      await swe.initSwissEph();
      ready = true;
      loading = false;
      console.log('[hlSweph] Swiss Ephemeris WASM loaded ✓');
      return true;
    }catch(e){
      loading = false;
      console.warn('[hlSweph] WASM unavailable:', e.message);
      return false;
    }
  }

  // 回傳黃道經度（tropical，不做歲差校正）
  function calcPlanet(y,m,d,h, body){
    if(!ready||!swe) return null;
    try{
      var jd = swe.julday(y,m,d,h||0);
      var r = swe.calc_ut(jd, body, 256); // SEFLG_SPEED=256
      return {lon:((r[0]%360)+360)%360, lat:r[1], dist:r[2], lonSpd:r[3], precision:'swiss-ephemeris'};
    }catch(e){
      console.warn('[hlSweph] calc error body='+body+':', e.message);
      return null;
    }
  }

  // 回傳恆星黃道經度（sidereal, Lahiri）
  function calcSidereal(y,m,d,h, body){
    if(!ready||!swe) return null;
    try{
      swe.set_sid_mode(swe.SE_SIDM_LAHIRI,0,0);
      var jd = swe.julday(y,m,d,h||0);
      var flags = 0x00040000 | 256; // SEFLG_SIDEREAL | SEFLG_SPEED
      var r = swe.calc_ut(jd, body, flags);
      return {lon:((r[0]%360)+360)%360, lat:r[1], dist:r[2], lonSpd:r[3], precision:'swiss-ephemeris-sidereal'};
    }catch(e){
      console.warn('[hlSweph] sidereal calc error:', e.message);
      return null;
    }
  }

  // 所有主要天體一次算完（tropical）
  function calcAll(y,m,d,h){
    var result = {};
    var names = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
    var ids = [0,1,2,3,4,5,6,7,8,9];
    for(var i=0;i<ids.length;i++){
      result[names[i]] = calcPlanet(y,m,d,h,ids[i]);
    }
    // 特殊天體
    result.chiron = calcPlanet(y,m,d,h,15);
    result.lilith = calcPlanet(y,m,d,h,12); // Mean Apogee = Black Moon Lilith
    result.trueNode = calcPlanet(y,m,d,h,11);
    result.meanNode = calcPlanet(y,m,d,h,10);
    return result;
  }

  window.hlSweph = {
    init: init,
    calcPlanet: calcPlanet,
    calcSidereal: calcSidereal,
    calcAll: calcAll,
    isReady: function(){return ready;},
    SE_SUN:0, SE_MOON:1, SE_MERCURY:2, SE_VENUS:3, SE_MARS:4,
    SE_JUPITER:5, SE_SATURN:6, SE_URANUS:7, SE_NEPTUNE:8, SE_PLUTO:9,
    SE_MEAN_NODE:10, SE_TRUE_NODE:11, SE_MEAN_APOG:12, SE_CHIRON:15
  };
})();
