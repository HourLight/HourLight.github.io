/**
 * 馥靈之鑰計算引擎（加密版）
 * Hour Light Calculation Engine - Protected
 * © 2026 馥靈之鑰國際有限公司 - 商業機密
 * 
 * ⚠️ 本檔案包含專有演算法，受著作權法保護
 * 未經授權複製、修改、反編譯或散布將追究法律責任
 * Unauthorized copying, modification, decompilation or distribution is prohibited.
 */

(function(global) {
  'use strict';
  
  var _KEY = 'HL_CALC_2026';
  var _ready = false;
  var _engine = null;
  
  // 編碼計算核心
  var _d = [
    'CmNvbnN0IF9pc01OID0gZnVuY3Rpb24obikgeyByZXR1cm4gbiA9PT0gMTEgfHwgbiA9PT0gMjIg',
    'fHwgbiA9PT0gMzM7IH07CmNvbnN0IF9yVFMgPSBmdW5jdGlvbihuKSB7IHdoaWxlIChuID4gOSkg',
    'eyBuID0gU3RyaW5nKG4pLnNwbGl0KCcnKS5yZWR1Y2UoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4g',
    'cGFyc2VJbnQoYSkgKyBwYXJzZUludChiKTsgfSwgMCk7IH0gcmV0dXJuIG47IH07CmNvbnN0IF9y',
    'TiA9IGZ1bmN0aW9uKG4pIHsgaWYgKF9pc01OKG4pKSByZXR1cm4gbjsgd2hpbGUgKG4gPiA5KSB7',
    'IG4gPSBTdHJpbmcobikuc3BsaXQoJycpLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7IHJldHVybiBw',
    'YXJzZUludChhKSArIHBhcnNlSW50KGIpOyB9LCAwKTsgaWYgKF9pc01OKG4pKSByZXR1cm4gbjsg',
    'fSByZXR1cm4gbjsgfTsKY29uc3QgX2dCTiA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIF9pc01OKG4p',
    'ID8gbiA6IF9yVFMobik7IH07CmNvbnN0IF9IT1VSX01BUCA9IHsnemknOntuOiflrZDmmYInLHQ6',
    'JzIzOjAwLTAxOjAwJyx2OjF9LCdjaG91Jzp7bjon5LiR5pmCJyx0OicwMTowMC0wMzowMCcsdjoy',
    'fSwneWluJzp7bjon5a+F5pmCJyx0OicwMzowMC0wNTowMCcsdjozfSwnbWFvJzp7bjon5Y2v5pmC',
    'Jyx0OicwNTowMC0wNzowMCcsdjo0fSwnY2hlbic6e246J+i+sOaZgicsdDonMDc6MDAtMDk6MDAn',
    'LHY6NX0sJ3NpJzp7bjon5bez5pmCJyx0OicwOTowMC0xMTowMCcsdjo2fSwnd3UnOntuOifljYjm',
    'mYInLHQ6JzExOjAwLTEzOjAwJyx2Ojd9LCd3ZWknOntuOifmnKrmmYInLHQ6JzEzOjAwLTE1OjAw',
    'Jyx2Ojh9LCdzaGVuJzp7bjon55Sz5pmCJyx0OicxNTowMC0xNzowMCcsdjo5fSwneW91Jzp7bjon',
    '6YWJ5pmCJyx0OicxNzowMC0xOTowMCcsdjoxMH0sJ3h1Jzp7bjon5oiM5pmCJyx0OicxOTowMC0y',
    'MTowMCcsdjoxMX0sJ2hhaSc6e246J+S6peaZgicsdDonMjE6MDAtMjM6MDAnLHY6MTJ9LCd1bmtu',
    'b3duJzp7bjon5pyq55+lJyx0OicnLHY6MH19Owpjb25zdCBfZ0hEID0gZnVuY3Rpb24oaWQpIHsg',
    'cmV0dXJuIF9IT1VSX01BUFtpZF0gfHwgX0hPVVJfTUFQWyd1bmtub3duJ107IH07CmNvbnN0IF9j',
    'YWxjSE9VUiA9IGZ1bmN0aW9uKGRhdGEpIHsgY29uc3R7eWVhcixtb250aCxkYXksbHVuYXJNb250',
    'aCxsdW5hckRheSxob3VySWR9PWRhdGE7IGNvbnN0IGhvdXJEYXRhPV9nSEQoaG91cklkKTsgY29u',
    'c3QgaG91clZhbHVlPWhvdXJEYXRhLnY7IGxldCB1TnVtPTA7IGlmKGhvdXJWYWx1ZT4wKXtpZiho',
    'b3VyVmFsdWU9PT0xMSl1TnVtPTExO2Vsc2UgaWYoaG91clZhbHVlPT09MTApdU51bT0xO2Vsc2Ug',
    'aWYoaG91clZhbHVlPT09MTIpdU51bT0zO2Vsc2UgdU51bT1ob3VyVmFsdWU7fSBjb25zdCBoTnVt',
    'PV9yTihwYXJzZUludChsdW5hck1vbnRoKStwYXJzZUludChsdW5hckRheSkpOyBjb25zdCBvTnVt',
    'UmF3PVN0cmluZyh5ZWFyKStTdHJpbmcobW9udGgpLnBhZFN0YXJ0KDIsJzAnKStTdHJpbmcoZGF5',
    'KS5wYWRTdGFydCgyLCcwJyk7IGNvbnN0IG9OdW09X3JOKG9OdW1SYXcuc3BsaXQoJycpLnJlZHVj',
    'ZShmdW5jdGlvbihhLGIpe3JldHVybiBwYXJzZUludChhKStwYXJzZUludChiKTt9LDApKTsgY29u',
    'c3Qgck51bT11TnVtP19yTihoTnVtK29OdW0rdU51bSk6X3JOKGhOdW0rb051bSk7IHJldHVybnto',
    'OmhOdW0sbzpvTnVtLHU6dU51bSxyOnJOdW0saG91ckRhdGE6aG91ckRhdGF9OyB9Owpjb25zdCBf',
    'Y2FsY0xJR0hUID0gZnVuY3Rpb24oZGF0YSxob3VyKSB7IGNvbnN0e3llYXIsbHVuYXJNb250aCxs',
    'dW5hckRheSxob3VySWR9PWRhdGE7IGNvbnN0IHVOdW09aG91ci51OyBjb25zdCBsTnVtPXBhcnNl',
    'SW50KGx1bmFyTW9udGgpPjk/X3JOKHBhcnNlSW50KGx1bmFyTW9udGgpKTpwYXJzZUludChsdW5h',
    'ck1vbnRoKTsgY29uc3QgaU51bT11TnVtfHw1OyBjb25zdCBnTnVtPV9yTihTdHJpbmcoeWVhciku',
    'c3BsaXQoJycpLnJlZHVjZShmdW5jdGlvbihhLGIpe3JldHVybiBwYXJzZUludChhKStwYXJzZUlu',
    'dChiKTt9LDApKTsgY29uc3QgaEVuZXJneU51bT1wYXJzZUludChsdW5hckRheSk+OT9fck4ocGFy',
    'c2VJbnQobHVuYXJEYXkpKTpwYXJzZUludChsdW5hckRheSk7IGNvbnN0IHROdW09X3JOKGxOdW0r',
    'aU51bStnTnVtK2hFbmVyZ3lOdW0pOyByZXR1cm57bDpsTnVtLGk6aU51bSxnOmdOdW0saDpoRW5l',
    'cmd5TnVtLHQ6dE51bX07IH07CmNvbnN0IF9jYWxjUGFsYWNlcyA9IGZ1bmN0aW9uKGRhdGEsaG91',
    'cixsaWdodCkgeyBjb25zdHt5ZWFyLG1vbnRoLGRheSxsdW5hck1vbnRoLGx1bmFyRGF5fT1kYXRh',
    'OyBjb25zdHtoOmhOdW0sbzpvTnVtLHU6dU51bSxyOnJOdW19PWhvdXI7IGNvbnN0e2w6bE51bSxp',
    'OmlOdW0sZzpnTnVtLGg6aEVuZXJneU51bX09bGlnaHQ7IGNvbnN0IHllYXJTdHI9U3RyaW5nKHll',
    'YXIpOyBjb25zdCBsYXN0VHdvPXBhcnNlSW50KHllYXJTdHIuc2xpY2UoLTIpKTsgY29uc3QgcDJO',
    'dW09X3JOKE1hdGguZmxvb3IobGFzdFR3by8xMCkrKGxhc3RUd28lMTApKTsgY29uc3QgcDNOdW09',
    'cGFyc2VJbnQobW9udGgpPT09MTE/MTE6X3JOKHBhcnNlSW50KG1vbnRoKSk7IGNvbnN0IHA0TnVt',
    'PVsxMSwyMl0uaW5jbHVkZXMocGFyc2VJbnQoZGF5KSk/cGFyc2VJbnQoZGF5KTpfck4ocGFyc2VJ',
    'bnQoZGF5KSk7IGNvbnN0IHA1TnVtPXBhcnNlSW50KGx1bmFyTW9udGgpPT09MTE/MTE6bE51bTsg',
    'Y29uc3QgcDZOdW09WzExLDIyXS5pbmNsdWRlcyhwYXJzZUludChsdW5hckRheSkpP3BhcnNlSW50',
    'KGx1bmFyRGF5KTpoRW5lcmd5TnVtOyBjb25zdCBwOU51bT1wYXJzZUludCh5ZWFyU3RyLmNoYXJB',
    'dCh5ZWFyU3RyLmxlbmd0aC0zKSl8fDk7IHJldHVybnsxOl9nQk4oaE51bSksMjpwMk51bSwzOnAz',
    'TnVtLDQ6cDROdW0sNTpwNU51bSw2OnA2TnVtLDc6X2dCTihvTnVtKSw4OmdOdW0sOTpwOU51bSwx',
    'MDp1TnVtfHw1LDExOmxpZ2h0LnQsMTI6X2dCTihyTnVtKX07IH07CmNvbnN0IF9jYWxjQnJpZGdl',
    'cyA9IGZ1bmN0aW9uKGhvdXIpIHsgY29uc3R7aDpoTnVtLG86b051bSx1OnVOdW0scjpyTnVtfT1o',
    'b3VyOyByZXR1cm57aG86TWF0aC5hYnMoX2dCTihoTnVtKS1fZ0JOKG9OdW0pKSxvdTp1TnVtP01h',
    'dGguYWJzKF9nQk4ob051bSktdU51bSk6MCx1cjp1TnVtP01hdGguYWJzKHVOdW0tX2dCTihyTnVt',
    'KSk6MH07IH07CmNvbnN0IF9hbmFseXplTnVtYmVycyA9IGZ1bmN0aW9uKGhvdXIscGFsYWNlcykg',
    'eyBjb25zdHtoOmhOdW0sbzpvTnVtLHU6dU51bSxyOnJOdW19PWhvdXI7IGNvbnN0IG51bWJlckNv',
    'dW50PXt9OyBmb3IobGV0IGk9MTtpPD05O2krKyludW1iZXJDb3VudFtpXT0wOyBudW1iZXJDb3Vu',
    'dFsxMV09MDtudW1iZXJDb3VudFsyMl09MDtudW1iZXJDb3VudFszM109MDsgW2hOdW0sb051bSxy',
    'TnVtXS5mb3JFYWNoKGZ1bmN0aW9uKG51bSl7aWYoX2lzTU4obnVtKSl7bnVtYmVyQ291bnRbbnVt',
    'XSsrO31lbHNle2NvbnN0IHI9X3JUUyhudW0pO2lmKHI+PTEmJnI8PTkpbnVtYmVyQ291bnRbcl0r',
    'Kzt9fSk7IE9iamVjdC52YWx1ZXMocGFsYWNlcykuZm9yRWFjaChmdW5jdGlvbihudW0pe2lmKF9p',
    'c01OKG51bSkpe251bWJlckNvdW50W251bV0rKzt9ZWxzZXtjb25zdCByPV9yVFMobnVtKTtpZihy',
    'Pj0xJiZyPD05KW51bWJlckNvdW50W3JdKys7fX0pOyBjb25zdCBoYXNNYXN0ZXJOdW1iZXJzPV9p',
    'c01OKGhOdW0pfHxfaXNNTihvTnVtKXx8X2lzTU4ock51bSl8fF9pc01OKHVOdW0pOyBjb25zdCBt',
    'YXN0ZXJOdW1iZXJzTGlzdD1baE51bSxvTnVtLHVOdW0sck51bV0uZmlsdGVyKF9pc01OKTsgcmV0',
    'dXJue251bWJlckNvdW50Om51bWJlckNvdW50LG1pc3NpbmdOdW1iZXJzOk9iamVjdC5lbnRyaWVz',
    'KG51bWJlckNvdW50KS5maWx0ZXIoZnVuY3Rpb24oZSl7cmV0dXJuIGVbMV09PT0wJiZwYXJzZUlu',
    'dChlWzBdKTw9OTt9KS5tYXAoZnVuY3Rpb24oZSl7cmV0dXJuIHBhcnNlSW50KGVbMF0pO30pLGV4',
    'Y2Vzc051bWJlcnM6T2JqZWN0LmVudHJpZXMobnVtYmVyQ291bnQpLmZpbHRlcihmdW5jdGlvbihl',
    'KXtyZXR1cm4gZVsxXT49Mzt9KS5tYXAoZnVuY3Rpb24oZSl7cmV0dXJuIHBhcnNlSW50KGVbMF0p',
    'O30pLGhhc01hc3Rlck51bWJlcnM6aGFzTWFzdGVyTnVtYmVycyxtYXN0ZXJOdW1iZXJzTGlzdDpt',
    'YXN0ZXJOdW1iZXJzTGlzdH07IH07CmNvbnN0IF9jYWxjWWVhckZvcnR1bmUgPSBmdW5jdGlvbihy',
    'TnVtLHllYXIpIHsgY29uc3QgdW5pdmVyc2VZZWFyPV9yTihTdHJpbmcoeWVhcikuc3BsaXQoJycp',
    'LnJlZHVjZShmdW5jdGlvbihhLGIpe3JldHVybiBwYXJzZUludChhKStwYXJzZUludChiKTt9LDAp',
    'KTsgY29uc3QgcGVyc29uYWxZZWFyPV9yTihfZ0JOKHJOdW0pK3VuaXZlcnNlWWVhcik7IHJldHVy',
    'bnt1bml2ZXJzZVllYXI6dW5pdmVyc2VZZWFyLHBlcnNvbmFsWWVhcjpwZXJzb25hbFllYXJ9OyB9',
    'Owpjb25zdCBfY2FsY0xpZmVGb3J0dW5lcyA9IGZ1bmN0aW9uKHJOdW0sYmlydGhZZWFyKSB7IGNv',
    'bnN0IGN1cnJlbnRZZWFyPW5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKTsgY29uc3QgYWdlPWN1cnJl',
    'bnRZZWFyLWJpcnRoWWVhcjsgY29uc3QgYmFzZVI9X2dCTihyTnVtKTsgY29uc3QgZm9ydHVuZXM9',
    'W107IGZvcihsZXQgaT0xO2k8PTg7aSsrKXtjb25zdCBzdGFydEFnZT0oaS0xKSoxMCsxO2NvbnN0',
    'IGZvcnR1bmVOdW09X3JOKGJhc2VSK2kpO2NvbnN0IGlzQ3VycmVudD1hZ2U+PXN0YXJ0QWdlJiYo',
    'aT09PTh8fGFnZTw9aSoxMCk7Zm9ydHVuZXMucHVzaCh7cGVyaW9kOmksc3RhcnRZZWFyOmJpcnRo',
    'WWVhcitzdGFydEFnZS0xLGVuZFllYXI6aT09PTg/J+KInic6YmlydGhZZWFyK2kqMTAtMSxudW06',
    'Zm9ydHVuZU51bSxpc0N1cnJlbnQ6aXNDdXJyZW50LGlzTWFzdGVyOl9pc01OKGZvcnR1bmVOdW0p',
    'fSk7fSByZXR1cm4gZm9ydHVuZXM7IH07CmNvbnN0IF9jYWxjQ29tcGF0aWJpbGl0eSA9IGZ1bmN0',
    'aW9uKHBlcnNvbjEscGVyc29uMikgeyBjb25zdCByMT1fZ0JOKHBlcnNvbjEucik7Y29uc3QgcjI9',
    'X2dCTihwZXJzb24yLnIpOyBjb25zdCBkaWZmPU1hdGguYWJzKHIxLXIyKTsgbGV0IGNvbXBhdGli',
    'aWxpdHk9MDsgaWYoZGlmZj09PTApY29tcGF0aWJpbGl0eT0xMDA7ZWxzZSBpZihkaWZmPT09MXx8',
    'ZGlmZj09PTgpY29tcGF0aWJpbGl0eT04NTtlbHNlIGlmKGRpZmY9PT0yfHxkaWZmPT09Nyljb21w',
    'YXRpYmlsaXR5PTc1O2Vsc2UgaWYoZGlmZj09PTN8fGRpZmY9PT02KWNvbXBhdGliaWxpdHk9NjU7',
    'ZWxzZSBpZihkaWZmPT09NHx8ZGlmZj09PTUpY29tcGF0aWJpbGl0eT01NTsgY29uc3QgaDE9X2dC',
    'TihwZXJzb24xLmgpO2NvbnN0IGgyPV9nQk4ocGVyc29uMi5oKTtjb25zdCBoQ29tcGF0PWgxK2gy',
    'PT09MTA/J2hpZ2gnOidub3JtYWwnOyBjb25zdCBvMT1fZ0JOKHBlcnNvbjEubyk7Y29uc3QgbzI9',
    'X2dCTihwZXJzb24yLm8pO2NvbnN0IG9Db21wYXQ9bzErbzI9PT0xMD8naGlnaCc6J25vcm1hbCc7',
    'IHJldHVybntjb21wYXRpYmlsaXR5OmNvbXBhdGliaWxpdHksZGlmZmVyZW5jZTpkaWZmLGVuZXJn',
    'eU1hdGNoOntoOmhDb21wYXQsbzpvQ29tcGF0fSxzdWdnZXN0aW9uOmNvbXBhdGliaWxpdHk+PTc1',
    'PydoYXJtb25pb3VzJzpjb21wYXRpYmlsaXR5Pj01NT8nbGVhcm5pbmcnOidjaGFsbGVuZ2luZyd9',
    'OyB9OwpyZXR1cm57X2lzTU4sX3JUUyxfck4sX2dCTixfZ0hELF9jYWxjSE9VUixfY2FsY0xJR0hU',
    'LF9jYWxjUGFsYWNlcyxfY2FsY0JyaWRnZXMsX2FuYWx5emVOdW1iZXJzLF9jYWxjWWVhckZvcnR1',
    'bmUsX2NhbGNMaWZlRm9ydHVuZXMsX2NhbGNDb21wYXRpYmlsaXR5fTsK'
  ];
  
  // 解碼並初始化引擎（UTF-8 安全）
  function _decodeUTF8(encoded) {
    var binary = atob(encoded);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  function _init() {
    try {
      var _s = _d.join('');
      var _b = _decodeUTF8(_s);
      var _f = new Function(_b);
      _engine = _f();
    } catch(e) {
      console.error('Engine initialization failed');
    }
  }
  
  var HLCalc = {
    version: '2.1.0',
    
    init: function(key) {
      if (key === _KEY) {
        if (!_engine) _init();
        _ready = !!_engine;
        return _ready;
      }
      console.warn('HLCalc: Invalid access key');
      return false;
    },
    
    isMasterNumber: function(n) { return _ready && _engine ? _engine._isMN(n) : null; },
    reduceNumber: function(n) { return _ready && _engine ? _engine._rN(n) : null; },
    reduceToSingle: function(n) { return _ready && _engine ? _engine._rTS(n) : null; },
    getBaseNum: function(n) { return _ready && _engine ? _engine._gBN(n) : null; },
    getHourData: function(id) { return _ready && _engine ? _engine._gHD(id) : null; },
    
    calculateFullChart: function(data) {
      if (!_ready || !_engine) return null;
      var hour = _engine._calcHOUR(data);
      var light = _engine._calcLIGHT(data, hour);
      var palaces = _engine._calcPalaces(data, hour, light);
      var bridges = _engine._calcBridges(hour);
      var balanceNum = Math.round((_engine._gBN(hour.h) + _engine._gBN(hour.o)) / 2);
      var analysis = _engine._analyzeNumbers(hour, palaces);
      return { inputData: data, hour: hour, light: light, palaces: palaces, bridges: bridges, balanceNum: balanceNum, analysis: analysis };
    },
    
    calculateYearFortune: function(rNum, year) { return _ready && _engine ? _engine._calcYearFortune(rNum, year) : null; },
    calculateLifeFortunes: function(rNum, birthYear) { return _ready && _engine ? _engine._calcLifeFortunes(rNum, birthYear) : null; },
    calculateCompatibility: function(person1, person2) { return _ready && _engine ? _engine._calcCompatibility(person1, person2) : null; }
  };
  
  Object.freeze(HLCalc);
  Object.defineProperty(global, 'HLCalc', { value: HLCalc, writable: false, configurable: false });
  
})(typeof window !== 'undefined' ? window : this);
