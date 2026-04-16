
// ═══ 命理計算 ═══
var profileData = null;
var selectedTheme = 'wealth';
var selectedN = 1; // 一次一張，保留變數避免影響其他舊參考
var selectedDevice = 'phone';
var selectedStyle = 'auto';
var selectedAspect = '9:16';   // 預設手機 9:16
var selectedTargetSize = { w:1080, h:1920 };  // 真實輸出尺寸

// 各裝置的螢幕比例選項（label/ratio/真實尺寸）
var ASPECT_OPTIONS = {
  phone: [
    { id:'9:16',  label:'9:16',  hint:'一般手機',     w:1080, h:1920 },
    { id:'9:19.5',label:'9:19.5',hint:'iPhone 系列',  w:1170, h:2532 },
    { id:'9:21',  label:'9:21',  hint:'窄長螢幕',     w:1080, h:2520 }
  ],
  desktop: [
    { id:'16:9',  label:'16:9',  hint:'多數螢幕',     w:1920, h:1080 },
    { id:'16:10', label:'16:10', hint:'MacBook',     w:1920, h:1200 },
    { id:'21:9',  label:'21:9',  hint:'超寬曲面',     w:2560, h:1080 },
    { id:'4:3',   label:'4:3',   hint:'iPad/舊螢幕',  w:2048, h:1536 }
  ]
};

function renderAspectSelector(){
  var box = document.getElementById('aspectSelector');
  if(!box) return;
  var opts = ASPECT_OPTIONS[selectedDevice] || ASPECT_OPTIONS.phone;
  var html = '';
  for (var i = 0; i < opts.length; i++) {
    var o = opts[i];
    var active = (o.id === selectedAspect) ? ' active' : '';
    html += '<button type="button" class="ww-aspect-btn' + active + '" data-aspect="' + o.id + '" '
         + 'data-w="' + o.w + '" data-h="' + o.h + '" '
         + 'onclick="selectAspect(this)" '
         + 'style="padding:10px 14px;border-radius:12px;border:1px solid rgba(248,223,165,.25);'
         + 'background:rgba(248,223,165,.04);color:rgba(248,223,165,.85);font-family:inherit;'
         + 'font-size:.82rem;cursor:pointer;transition:all .25s;display:flex;flex-direction:column;'
         + 'align-items:center;gap:2px;min-width:88px">'
         + '<span style="font-weight:600;letter-spacing:.04em">' + o.label + '</span>'
         + '<span style="font-size:.66rem;opacity:.7">' + o.hint + '</span>'
         + '<span style="font-size:.62rem;opacity:.55;margin-top:1px">' + o.w + '×' + o.h + '</span>'
         + '</button>';
  }
  box.innerHTML = html;
  // 確保 selectedAspect 是該裝置的合法值；不是就重設為第一個
  var ids = opts.map(function(o){return o.id;});
  if (ids.indexOf(selectedAspect) < 0) {
    selectedAspect = opts[0].id;
    selectedTargetSize = { w: opts[0].w, h: opts[0].h };
    // 重新渲染以反映 active
    renderAspectSelector();
  }
}

function selectAspect(el){
  document.querySelectorAll('#aspectSelector .ww-aspect-btn').forEach(function(b){
    b.classList.remove('active');
    b.style.background = 'rgba(248,223,165,.04)';
    b.style.borderColor = 'rgba(248,223,165,.25)';
  });
  el.classList.add('active');
  el.style.background = 'rgba(248,223,165,.18)';
  el.style.borderColor = 'rgba(248,223,165,.6)';
  selectedAspect = el.dataset.aspect;
  selectedTargetSize = { w: parseInt(el.dataset.w, 10), h: parseInt(el.dataset.h, 10) };
}

function selectTheme(el){
  document.querySelectorAll('#themeSelector .ww-theme-rich').forEach(function(t){t.classList.remove('active')});
  el.classList.add('active');
  selectedTheme = el.dataset.theme;
}

function selectDevice(el){
  document.querySelectorAll('#deviceSelector .ww-device-card').forEach(function(t){t.classList.remove('active')});
  el.classList.add('active');
  selectedDevice = el.dataset.device;
  // 切換裝置時，重設比例為該裝置的第一個
  var opts = ASPECT_OPTIONS[selectedDevice] || ASPECT_OPTIONS.phone;
  selectedAspect = opts[0].id;
  selectedTargetSize = { w: opts[0].w, h: opts[0].h };
  renderAspectSelector();
}

// ═══ Canvas 客戶端裁切：把 AI 出圖裁成使用者選的真實比例 ═══
function cropImageToAspect(imageUrl, targetW, targetH){
  return new Promise(function(resolve, reject){
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function(){
      try {
        var srcW = img.naturalWidth, srcH = img.naturalHeight;
        var srcRatio = srcW / srcH;
        var dstRatio = targetW / targetH;
        var sx, sy, sw, sh;
        if (srcRatio > dstRatio) {
          // 來源比目標寬 → 裁切左右
          sh = srcH;
          sw = srcH * dstRatio;
          sx = (srcW - sw) / 2;
          sy = 0;
        } else {
          // 來源比目標窄 → 裁切上下
          sw = srcW;
          sh = srcW / dstRatio;
          sx = 0;
          sy = (srcH - sh) / 2;
        }
        var canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        // 用 PNG 保留品質
        canvas.toBlob(function(blob){
          if (!blob) { resolve(imageUrl); return; }
          var reader = new FileReader();
          reader.onload = function(){ resolve(reader.result); };
          reader.onerror = function(){ resolve(imageUrl); };
          reader.readAsDataURL(blob);
        }, 'image/png', 0.95);
      } catch(e) {
        console.warn('crop failed:', e);
        resolve(imageUrl);
      }
    };
    img.onerror = function(){ resolve(imageUrl); };
    img.src = imageUrl;
  });
}

function selectPlan(el){
  document.querySelectorAll('.ww-price-card').forEach(function(c){c.classList.remove('active')});
  el.classList.add('active');
  selectedN = parseInt(el.dataset.n);
}

function selectGender(el){
  document.querySelectorAll('#genderSelector .ww-theme').forEach(function(t){t.classList.remove('active')});
  el.classList.add('active');
}

function selectStyle(el){
  document.querySelectorAll('#styleSelector .ww-theme-rich').forEach(function(t){t.classList.remove('active')});
  el.classList.add('active');
  selectedStyle = el.dataset.style || 'auto';
}

// ═══ 城市座標表（用於占星上升星座計算）═══
var CITY_COORDS = {
  taipei:    { lat:25.03, lon:121.57, label:'台北市' },
  newtaipei: { lat:25.01, lon:121.46, label:'新北市' },
  taoyuan:   { lat:24.99, lon:121.30, label:'桃園市' },
  hsinchu:   { lat:24.81, lon:120.97, label:'新竹' },
  keelung:   { lat:25.13, lon:121.74, label:'基隆市' },
  yilan:     { lat:24.76, lon:121.75, label:'宜蘭縣' },
  miaoli:    { lat:24.56, lon:120.82, label:'苗栗縣' },
  taichung:  { lat:24.15, lon:120.68, label:'台中市' },
  changhua:  { lat:24.08, lon:120.54, label:'彰化縣' },
  nantou:    { lat:23.91, lon:120.69, label:'南投縣' },
  yunlin:    { lat:23.71, lon:120.43, label:'雲林縣' },
  chiayi:    { lat:23.48, lon:120.45, label:'嘉義' },
  tainan:    { lat:22.99, lon:120.21, label:'台南市' },
  kaohsiung: { lat:22.63, lon:120.30, label:'高雄市' },
  pingtung:  { lat:22.67, lon:120.49, label:'屏東縣' },
  hualien:   { lat:23.99, lon:121.60, label:'花蓮縣' },
  taitung:   { lat:22.75, lon:121.15, label:'台東縣' },
  penghu:    { lat:23.57, lon:119.58, label:'澎湖縣' },
  kinmen:    { lat:24.43, lon:118.32, label:'金門縣' },
  matsu:     { lat:26.16, lon:119.95, label:'連江縣（馬祖）' },
  hk:        { lat:22.30, lon:114.17, label:'香港' },
  macau:     { lat:22.20, lon:113.55, label:'澳門' },
  sg:        { lat:1.35,  lon:103.82, label:'新加坡' },
  my:        { lat:3.14,  lon:101.69, label:'馬來西亞（吉隆坡）' },
  cn:        { lat:31.23, lon:121.47, label:'中國大陸（上海）' },
  jp:        { lat:35.68, lon:139.69, label:'日本（東京）' },
  us:        { lat:34.05, lon:-118.24, label:'美國（洛杉磯）' },
  other:     { lat:24.0,  lon:121.0,  label:'其他（採台灣中部座標）' }
};

// ═══════════════════════════════════════════════════════════════
// ▼▼▼ 命理計算：直接引用 destiny-engine.html 的精準函式（禁止寫近似）▼▼▼
// 來源：destiny-engine.html line 1263-1371（calcPlacidus / ephLookup）+ 1796+（calcMaya）
// ═══════════════════════════════════════════════════════════════

// SIGNS — 與 destiny-engine.html line 1266 完全一致（不加「座」字以對齊）
var WW_SIGNS = ['牡羊座','金牛座','雙子座','巨蟹座','獅子座','處女座','天秤座','天蠍座','射手座','摩羯座','水瓶座','雙魚座'];
var WW_SIGNS_RAW = ['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚']; // 對齊 destiny-engine 內部
var P_ORDER = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','node','chiron'];

// EPH 星曆延遲載入（4MB，跟 destiny-engine 共用同一份檔案）
var WW_EPH = null;
var WW_EPH_LOADING = false;
function loadEphemeris() {
  return new Promise(function(resolve, reject) {
    if (WW_EPH) { resolve(WW_EPH); return; }
    if (WW_EPH_LOADING) {
      var iv = setInterval(function() { if (WW_EPH) { clearInterval(iv); resolve(WW_EPH); } }, 200);
      return;
    }
    WW_EPH_LOADING = true;
    fetch('js/ephemeris-1920-2060.json')
      .then(function(r) { return r.json(); })
      .then(function(d) { WW_EPH = d; WW_EPH_LOADING = false; resolve(d); })
      .catch(function(e) { WW_EPH_LOADING = false; reject(e); });
  });
}

// ═══ ephLookup — 1:1 從 destiny-engine.html line 1287 移植 ═══
function wwEphLookup(Y, M, D, H, min) {
  if (!WW_EPH) return null;
  var utcH = (H || 0) - 8 + (min || 0) / 60;
  var uD = D, uM = M, uY = Y;
  if (utcH < 0) { utcH += 24; uD--; }
  if (utcH >= 24) { utcH -= 24; uD++; }
  var key = String(uY).padStart(4, '0') + String(uM).padStart(2, '0') + String(uD).padStart(2, '0');
  var row = WW_EPH[key];
  if (!row) return null;
  var nd = new Date(uY, uM - 1, uD + 1);
  var nk = String(nd.getFullYear()).padStart(4, '0') + String(nd.getMonth() + 1).padStart(2, '0') + String(nd.getDate()).padStart(2, '0');
  var nr = WW_EPH[nk];
  var frac = utcH / 24;
  var result = {};
  for (var i = 0; i < P_ORDER.length; i++) {
    var lon0 = row[i], lon1 = nr ? nr[i] : lon0;
    var diff = lon1 - lon0;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    var lon = lon0 + diff * frac;
    if (lon < 0) lon += 360;
    if (lon >= 360) lon -= 360;
    var si = Math.floor(lon / 30);
    var deg = lon - si * 30;
    var retro = diff < 0;
    result[P_ORDER[i]] = { lon: lon, sign: WW_SIGNS_RAW[si], deg: Math.floor(deg), min: Math.round((deg % 1) * 60), retro: retro, si: si };
  }
  return result;
}

// ═══ calcPlacidus — 1:1 從 destiny-engine.html line 1332 移植 ═══
function wwCalcPlacidus(lat, geo_lon, jd_val) {
  var T = (jd_val - 2451545.0) / 36525;
  var GMST = (280.46061837 + 360.98564736629 * (jd_val - 2451545.0) + 0.000387933 * T * T) % 360;
  if (GMST < 0) GMST += 360;
  var RAMC = (GMST + geo_lon) % 360;
  var eps = 23.4393 - 0.013 * T;
  var er = eps * Math.PI / 180, lr = lat * Math.PI / 180;
  var ramc_r = RAMC * Math.PI / 180;
  var asc_val = (Math.atan2(-Math.cos(ramc_r), Math.sin(ramc_r) * Math.cos(er) + Math.tan(lr) * Math.sin(er)) * 180 / Math.PI + 180) % 360;
  var mc_val = (Math.atan2(Math.sin(ramc_r), Math.cos(ramc_r) * Math.cos(er)) * 180 / Math.PI + 360) % 360;
  return { asc: asc_val, mc: mc_val, RAMC: RAMC };
}

// 從黃經算星座（含「座」字版本，給 UI 顯示用）
function lonToSign(lon) {
  var si = Math.floor(((lon % 360) + 360) % 360 / 30);
  return WW_SIGNS[si];
}

// ═══ calcMaya — 1:1 從 destiny-engine.html line 1796 移植（base 1993/7/26 + 閏日修正 + Kin 144）═══
var WW_M_SEAL = ['紅龍','白風','藍夜','黃種子','紅蛇','白世界橋','藍手','黃星星','紅月','白狗','藍猴','黃人','紅天行者','白巫師','藍鷹','黃戰士','紅地球','白鏡','藍風暴','黃太陽'];
var WW_M_TONE = ['磁性的','月亮的','電力的','自我存在的','超頻的','韻律的','共鳴的','銀河的','太陽的','行星的','光譜的','水晶的','宇宙的'];

function wwCalcMaya(Y, M, D) {
  var base = new Date(1993, 6, 26), tgt = new Date(Y, M - 1, D);
  var diff = Math.floor((tgt - base) / 86400000);
  function cntLeap(y1, m1, d1, y2, m2, d2) {
    var c = 0, d = new Date(y1, m1 - 1, d1), e = new Date(y2, m2 - 1, d2);
    while (d < e) { if (d.getMonth() == 1 && d.getDate() == 29) c++; d.setDate(d.getDate() + 1); }
    return c;
  }
  var leaps = diff >= 0 ? cntLeap(1993, 7, 26, Y, M, D) : -cntLeap(Y, M, D, 1993, 7, 26);
  var disp = diff - leaps;
  var kin = (((144 - 1 + disp) % 260) + 260) % 260 + 1;
  var tone = ((kin - 1) % 13) + 1;
  var seal = (kin - 1) % 20;
  return {
    kin: kin,
    toneNum: tone,
    sealNum: seal,
    tone: WW_M_TONE[tone - 1],
    seal: WW_M_SEAL[seal],
    label: WW_M_TONE[tone - 1] + WW_M_SEAL[seal] + '（Kin ' + kin + '）'
  };
}

// 西曆 → Julian Day（與 destiny-engine 同公式）
function wwJulianDay(Y, M, D, hLocal, mLocal) {
  var utcH = (hLocal || 0) - 8 + (mLocal || 0) / 60;
  return 367 * Y - Math.floor(7 * (Y + Math.floor((M + 9) / 12)) / 4) + Math.floor(275 * M / 9) + D + 1721013.5 + utcH / 24;
}

// ═══════════════════════════════════════════════════════════════
// ▼▼▼ 33 套命理系統函式（1:1 從 destiny-engine.html 移植）▼▼▼
// ═══════════════════════════════════════════════════════════════

// ⑪ 九星氣學（destiny-engine line 2092-2107）
var WW_NSK=[null,{n:'一白水星',e:'水',ba:'坎',d:'北',t:'獨立深沉、洞察力強',ar:'佛手柑、薰衣草'},{n:'二黑土星',e:'土',ba:'坤',d:'西南',t:'包容踏實、照顧型',ar:'岩蘭草、檀香'},{n:'三碧木星',e:'木',ba:'震',d:'東',t:'衝勁十足、開創者',ar:'迷迭香、尤加利'},{n:'四綠木星',e:'木',ba:'巽',d:'東南',t:'溫和善溝通',ar:'天竺葵、快樂鼠尾草'},{n:'五黃土星',e:'土',ba:'中宮',d:'中央',t:'九星之王、掌控者',ar:'乳香、沒藥'},{n:'六白金星',e:'金',ba:'乾',d:'西北',t:'高貴自律、完美主義',ar:'茶樹、松針'},{n:'七赤金星',e:'金',ba:'兌',d:'西',t:'魅力口才、享樂主義',ar:'玫瑰、依蘭'},{n:'八白土星',e:'土',ba:'艮',d:'東北',t:'穩重內斂、大器晚成',ar:'雪松、廣藿香'},{n:'九紫火星',e:'火',ba:'離',d:'南',t:'熱情閃耀、直覺強',ar:'甜橙、肉桂'}];
var WW_NSK_E4=[1,3,4,9],WW_NSK_SMT=[[2,4],[3,6],[4,5],[5,6],[6,6],[7,7],[8,8],[9,8],[10,8],[11,7],[12,7],[1,6]];
var WW_NSK_MT={A:[8,7,6,5,4,3,2,1,9,8,7,6],B:[5,4,3,2,1,9,8,7,6,5,4,3],C:[2,1,9,8,7,6,5,4,3,2,1,9]};
function wwNskDS(n){while(n>9){var s=0;String(n).split('').forEach(function(d){s+=+d});n=s}return n}
function wwCalcNSK(Y,M,D){
  var aY=(M<2||(M===2&&D<4))?Y-1:Y;
  var ys=11-wwNskDS(aY);if(ys>9)ys-=9;if(ys<=0)ys+=9;
  var mi=-1;for(var i=WW_NSK_SMT.length-1;i>=0;i--){if(M>WW_NSK_SMT[i][0]||(M===WW_NSK_SMT[i][0]&&D>=WW_NSK_SMT[i][1])){mi=i;break}}
  if(mi<0)mi=11;
  var grp=([1,4,7].indexOf(ys)>=0)?'A':([3,6,9].indexOf(ys)>=0)?'B':'C';
  var ms=WW_NSK_MT[grp][mi];
  return{ys:ys,ms:ms,star:WW_NSK[ys]};
}

// ⑫ 生日色彩（destiny-engine line 2109-2116）
var WW_CLR={1:{n:'紅',h:'#DC3545',ck:'海底輪',t:'開創力、領導力'},2:{n:'橘',h:'#FD7E14',ck:'臍輪',t:'連結力、感受力'},3:{n:'黃',h:'#FFC107',ck:'太陽神經叢',t:'表達力、陽光感染力'},4:{n:'綠',h:'#28A745',ck:'心輪',t:'穩定力、自然平衡者'},5:{n:'藍',h:'#007BFF',ck:'喉輪',t:'自由、變化、冒險'},6:{n:'靛',h:'#6610F2',ck:'眉心輪',t:'責任感、洞察力'},7:{n:'紫',h:'#9B59B6',ck:'頂輪',t:'神秘內省、靈性追尋'},8:{n:'玫瑰金',h:'#B76E79',ck:'心輪高階',t:'豐盛、物質掌控者'},9:{n:'白金',h:'#E8E0D4',ck:'全脈輪',t:'完成、慈悲智慧'},11:{n:'銀白',h:'#C0C0C0',ck:'眉心+頂輪',t:'大師數·直覺通道'},22:{n:'金',h:'#FFD700',ck:'太陽+頂輪',t:'大師數·建造大師'}};
function wwClrR(n){while(n>9&&n!==11&&n!==22&&n!==33){var s=0;String(n).split('').forEach(function(d){s+=+d});n=s}if(n===33)n=6;return n}
function wwClrRS(n){while(n>9){var s=0;String(n).split('').forEach(function(d){s+=+d});n=s}return n}
function wwCalcColor(Y,M,D){
  var ln=wwClrR(wwClrR(Y)+wwClrR(M)+wwClrR(D));
  return{ln:ln,mc:WW_CLR[ln]||WW_CLR[wwClrRS(ln)]};
}

// ⑰ 宿曜占星（destiny-engine line 2204-2220）
function wwCalcXiuYao(year,month,day){
  var a=Math.floor((14-month)/12),y=year+4800-a,m=month+12*a-3;
  var jd=day+Math.floor((153*m+2)/5)+y*365+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
  var XIU=['角','亢','氐','房','心','尾','箕','斗','牛','女','虛','危','室','壁','奎','婁','胃','昴','畢','觜','參','井','鬼','柳','星','張','翼','軫'];
  var PALACE=['東方青龍','東方青龍','東方青龍','東方青龍','東方青龍','東方青龍','東方青龍','北方玄武','北方玄武','北方玄武','北方玄武','北方玄武','北方玄武','北方玄武','西方白虎','西方白虎','西方白虎','西方白虎','西方白虎','西方白虎','西方白虎','南方朱雀','南方朱雀','南方朱雀','南方朱雀','南方朱雀','南方朱雀','南方朱雀'];
  var GUARD=['蛟','龍','貉','兔','狐','虎','豹','獬','牛','蝠','鼠','燕','豬','貐','狼','狗','雉','雞','烏','猴','猿','井','羊','馬','鹿','蛇','蚓','蛟'];
  var REF_JD=2451545,REF_XIU=10;
  var idx=((jd-REF_JD)%28+28+REF_XIU)%28;
  return{idx:idx,name:XIU[idx],palace:PALACE[idx],guard:GUARD[idx]};
}

// ⑳ 彩虹數字（destiny-engine line 2419-2473）— 簡化只保留統計與箭頭
function wwCalcRainbow(year,month,day){
  var dateStr=String(year)+String(month).padStart(2,'0')+String(day).padStart(2,'0');
  var allD=dateStr.split('').map(Number);
  var cs=allD.reduce(function(a,b){return a+b},0);
  while(cs>9&&cs!==11&&cs!==22&&cs!==33){var sd=String(cs).split('').map(Number);allD=allD.concat(sd);cs=sd.reduce(function(a,b){return a+b},0)}
  String(cs).split('').map(Number).forEach(function(d){allD.push(d)});
  var counts={1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0};
  allD.forEach(function(d){if(d>0&&d<=9)counts[d]++});
  var ARROWS=[
    {nums:[1,2,3],name:'心靈箭'},{nums:[4,5,6],name:'意志箭'},{nums:[7,8,9],name:'智識箭'},
    {nums:[1,4,7],name:'行動箭'},{nums:[2,5,8],name:'決心箭'},{nums:[3,6,9],name:'智慧箭'},
    {nums:[1,5,9],name:'決斷箭'},{nums:[3,5,7],name:'靈性箭'}
  ];
  var activeArrows=[];
  ARROWS.forEach(function(a){if(a.nums.every(function(n){return counts[n]>0}))activeArrows.push(a.name)});
  var missing=Object.keys(counts).filter(function(k){return counts[k]===0}).map(Number);
  return{counts:counts,activeArrows:activeArrows,missing:missing,centerNum:cs};
}

// ㉑ 撲克牌命理（destiny-engine line 2476-2615）— 完整查表 1:1
function wwCalcCardology(month,day){
  var BDAY={'1-1':'AS','1-2':'2H','1-3':'2D','1-4':'7H','1-5':'3H','1-6':'JC','1-7':'9H','1-8':'QC','1-9':'10H','1-10':'JH','1-11':'QH','1-12':'KH','1-13':'8D','1-14':'6D','1-15':'2C','1-16':'9S','1-17':'5C','1-18':'6S','1-19':'7D','1-20':'AD','1-21':'10D','1-22':'QS','1-23':'4D','1-24':'JS','1-25':'5D','1-26':'KC','1-27':'3C','1-28':'9C','1-29':'AH','1-30':'AC','1-31':'KD','2-1':'5H','2-2':'2S','2-3':'10C','2-4':'3D','2-5':'JD','2-6':'8H','2-7':'4H','2-8':'7C','2-9':'QD','2-10':'8C','2-11':'8S','2-12':'3S','2-13':'7S','2-14':'4C','2-15':'KS','2-16':'6C','2-17':'6H','2-18':'5S','2-19':'4S','2-20':'9D','2-21':'10S','2-22':'AH','2-23':'AC','2-24':'KD','2-25':'5H','2-26':'2S','2-27':'10C','2-28':'3D','2-29':'JD','3-1':'JD','3-2':'8H','3-3':'4H','3-4':'7C','3-5':'QD','3-6':'8C','3-7':'8S','3-8':'3S','3-9':'7S','3-10':'4C','3-11':'KS','3-12':'6C','3-13':'6H','3-14':'5S','3-15':'4S','3-16':'9D','3-17':'10S','3-18':'AH','3-19':'AC','3-20':'KD','3-21':'5H','3-22':'2S','3-23':'10C','3-24':'3D','3-25':'JD','3-26':'8H','3-27':'4H','3-28':'7C','3-29':'QD','3-30':'8C','3-31':'8S','4-1':'3S','4-2':'7S','4-3':'4C','4-4':'KS','4-5':'6C','4-6':'6H','4-7':'5S','4-8':'4S','4-9':'9D','4-10':'10S','4-11':'AH','4-12':'AC','4-13':'KD','4-14':'5H','4-15':'2S','4-16':'10C','4-17':'3D','4-18':'JD','4-19':'8H','4-20':'4H','4-21':'7C','4-22':'QD','4-23':'8C','4-24':'8S','4-25':'3S','4-26':'7S','4-27':'4C','4-28':'KS','4-29':'6C','4-30':'6H','5-1':'5S','5-2':'4S','5-3':'9D','5-4':'10S','5-5':'AH','5-6':'AC','5-7':'KD','5-8':'5H','5-9':'2S','5-10':'10C','5-11':'3D','5-12':'JD','5-13':'8H','5-14':'4H','5-15':'7C','5-16':'QD','5-17':'8C','5-18':'8S','5-19':'3S','5-20':'7S','5-21':'4C','5-22':'KS','5-23':'6C','5-24':'6H','5-25':'5S','5-26':'4S','5-27':'9D','5-28':'10S','5-29':'AH','5-30':'AC','5-31':'KD','6-1':'5H','6-2':'2S','6-3':'10C','6-4':'3D','6-5':'JD','6-6':'8H','6-7':'4H','6-8':'7C','6-9':'QD','6-10':'8C','6-11':'8S','6-12':'3S','6-13':'7S','6-14':'4C','6-15':'KS','6-16':'6C','6-17':'6H','6-18':'5S','6-19':'4S','6-20':'9D','6-21':'10S','6-22':'AH','6-23':'AC','6-24':'KD','6-25':'5H','6-26':'2S','6-27':'10C','6-28':'3D','6-29':'JD','6-30':'8H','7-1':'4H','7-2':'7C','7-3':'QD','7-4':'8C','7-5':'8S','7-6':'3S','7-7':'7S','7-8':'4C','7-9':'KS','7-10':'6C','7-11':'6H','7-12':'5S','7-13':'4S','7-14':'9D','7-15':'10S','7-16':'AH','7-17':'AC','7-18':'KD','7-19':'5H','7-20':'2S','7-21':'10C','7-22':'3D','7-23':'JD','7-24':'8H','7-25':'4H','7-26':'7C','7-27':'QD','7-28':'8C','7-29':'8S','7-30':'3S','7-31':'7S','8-1':'4C','8-2':'KS','8-3':'6C','8-4':'6H','8-5':'5S','8-6':'4S','8-7':'9D','8-8':'10S','8-9':'AH','8-10':'AC','8-11':'KD','8-12':'5H','8-13':'2S','8-14':'10C','8-15':'3D','8-16':'JD','8-17':'8H','8-18':'4H','8-19':'7C','8-20':'QD','8-21':'8C','8-22':'8S','8-23':'3S','8-24':'7S','8-25':'4C','8-26':'KS','8-27':'6C','8-28':'6H','8-29':'5S','8-30':'4S','8-31':'9D','9-1':'10S','9-2':'AH','9-3':'AC','9-4':'KD','9-5':'5H','9-6':'2S','9-7':'10C','9-8':'3D','9-9':'JD','9-10':'8H','9-11':'4H','9-12':'7C','9-13':'QD','9-14':'8C','9-15':'8S','9-16':'3S','9-17':'7S','9-18':'4C','9-19':'KS','9-20':'6C','9-21':'6H','9-22':'5S','9-23':'4S','9-24':'9D','9-25':'10S','9-26':'AH','9-27':'AC','9-28':'KD','9-29':'5H','9-30':'2S','10-1':'10C','10-2':'3D','10-3':'JD','10-4':'8H','10-5':'4H','10-6':'7C','10-7':'QD','10-8':'8C','10-9':'8S','10-10':'3S','10-11':'7S','10-12':'4C','10-13':'KS','10-14':'6C','10-15':'6H','10-16':'5S','10-17':'4S','10-18':'9D','10-19':'10S','10-20':'AH','10-21':'AC','10-22':'KD','10-23':'5H','10-24':'2S','10-25':'10C','10-26':'3D','10-27':'JD','10-28':'8H','10-29':'4H','10-30':'7C','10-31':'QD','11-1':'8C','11-2':'8S','11-3':'3S','11-4':'7S','11-5':'4C','11-6':'KS','11-7':'6C','11-8':'6H','11-9':'5S','11-10':'4S','11-11':'9D','11-12':'10S','11-13':'AH','11-14':'AC','11-15':'KD','11-16':'5H','11-17':'2S','11-18':'10C','11-19':'3D','11-20':'JD','11-21':'8H','11-22':'4H','11-23':'7C','11-24':'QD','11-25':'8C','11-26':'8S','11-27':'3S','11-28':'7S','11-29':'4C','11-30':'KS','12-1':'6C','12-2':'6H','12-3':'5S','12-4':'4S','12-5':'9D','12-6':'10S','12-7':'AH','12-8':'AC','12-9':'KD','12-10':'5H','12-11':'2S','12-12':'10C','12-13':'3D','12-14':'JD','12-15':'8H','12-16':'4H','12-17':'7C','12-18':'QD','12-19':'8C','12-20':'8S','12-21':'3S','12-22':'7S','12-23':'4C','12-24':'KS','12-25':'6C','12-26':'6H','12-27':'5S','12-28':'4S','12-29':'9D','12-30':'10S','12-31':'AS'};
  var SUIT_NAMES={'H':'♥ 紅心','C':'♣ 梅花','D':'♦ 方塊','S':'♠ 黑桃'};
  var SUIT_ELEMENT={'H':'火·情感','C':'土·行動','D':'氣·思維','S':'水·轉化'};
  var key=month+'-'+day;
  var code=BDAY[key]||'AH';
  var suit=code.slice(-1);
  var val=code.slice(0,-1);
  var suitSymbol=suit==='H'?'♥':suit==='C'?'♣':suit==='D'?'♦':'♠';
  return{code:code,display:val+suitSymbol,suitName:SUIT_NAMES[suit]||suit,suitElement:SUIT_ELEMENT[suit]||''};
}

// ㉒ 居爾特樹曆（destiny-engine line 2617+ — 簡化版只保留樹名）
function wwCalcCelticTree(month,day){
  var TREES=[
    {name:'白樺',start:[12,24],end:[1,20]},{name:'花楸',start:[1,21],end:[2,17]},
    {name:'梣樹',start:[2,18],end:[3,17]},{name:'赤楊',start:[3,18],end:[4,14]},
    {name:'柳樹',start:[4,15],end:[5,12]},{name:'山楂',start:[5,13],end:[6,9]},
    {name:'橡樹',start:[6,10],end:[7,7]},{name:'冬青',start:[7,8],end:[8,4]},
    {name:'榛樹',start:[8,5],end:[9,1]},{name:'葡萄藤',start:[9,2],end:[9,29]},
    {name:'常春藤',start:[9,30],end:[10,27]},{name:'蘆葦',start:[10,28],end:[11,24]},
    {name:'接骨木',start:[11,25],end:[12,23]}
  ];
  for(var i=0;i<TREES.length;i++){
    var t=TREES[i],s=t.start,e=t.end,inRange;
    if(s[0]<e[0]){inRange=(month===s[0]&&day>=s[1])||(month===e[0]&&day<=e[1])||(month>s[0]&&month<e[0])}
    else{inRange=(month===s[0]&&day>=s[1])||(month===e[0]&&day<=e[1])}
    if(inRange)return t;
  }
  return TREES[0];
}

// ═══ 數字化簡（生命靈數）═══
function reduceNum(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce(function(a, b) { return a + parseInt(b); }, 0);
  }
  return n;
}

// ═══ 馥靈秘碼 H/O/U/R 四主數 ═══
function calcFulingHOUR(lunarMonth, lunarDay, Y, M, D, hourBlockNum) {
  var H = reduceNum(lunarMonth + lunarDay);
  var O = reduceNum(reduceNum(Y) + reduceNum(M) + reduceNum(D));
  var U = hourBlockNum ? reduceNum(hourBlockNum) : null;
  var R = reduceNum(H + O + (U || 0));
  return { H: H, O: O, U: U, R: R };
}

// ═══ 八字四柱 → 完整五行統計 ═══
function bgWuxingMap() {
  return {
    '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土',
    '庚':'金','辛':'金','壬':'水','癸':'水',
    '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火',
    '午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'
  };
}

function calcBaziWuxing(year, month, day, hour, minute, sect) {
  if (typeof Solar === 'undefined') return null;
  try {
    var solar = Solar.fromYmdHms(year, month, day, hour || 12, minute || 0, 0);
    var lunar = solar.getLunar();
    var ec = lunar.getEightChar();
    if (sect) ec.setSect(sect);
    var pillars = {
      year:  { gan: ec.getYearGan(),  zhi: ec.getYearZhi(),  full: ec.getYear()  },
      month: { gan: ec.getMonthGan(), zhi: ec.getMonthZhi(), full: ec.getMonth() },
      day:   { gan: ec.getDayGan(),   zhi: ec.getDayZhi(),   full: ec.getDay()   }
    };
    if (hour !== null && hour !== undefined) {
      pillars.hour = { gan: ec.getTimeGan(), zhi: ec.getTimeZhi(), full: ec.getTime() };
    }
    var wxMap = bgWuxingMap();
    var stat = { 木:0, 火:0, 土:0, 金:0, 水:0 };
    Object.keys(pillars).forEach(function(k) {
      var p = pillars[k];
      if (wxMap[p.gan]) stat[wxMap[p.gan]]++;
      if (wxMap[p.zhi]) stat[wxMap[p.zhi]]++;
    });
    var sortedWx = Object.keys(stat).sort(function(a, b) { return stat[b] - stat[a]; });
    var dominant = sortedWx[0];
    var missing = Object.keys(stat).filter(function(k) { return stat[k] === 0; });
    var dayMaster = pillars.day.gan;
    var dayMasterWx = wxMap[dayMaster];
    return {
      pillars: pillars,
      stat: stat,
      dominant: dominant,
      missing: missing,
      dayMaster: dayMaster,
      dayMasterWx: dayMasterWx,
      lunarMonth: Math.abs(lunar.getMonth()),
      lunarDay: lunar.getDay(),
      isLeapMonth: lunar.getMonth() < 0,
      yearGz: lunar.getYearGan() + lunar.getYearZhi()
    };
  } catch(e) {
    console.error('八字計算失敗', e);
    return null;
  }
}

function rd(n){
  while(n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce(function(a,b){return a + parseInt(b)},0);
  }
  return n;
}

function getWuxing(year,month,day){
  // 天干五行
  var tg = ['庚金','辛金','壬水','癸水','甲木','乙木','丙火','丁火','戊土','己土'];
  var dz = ['申金','酉金','戌土','亥水','子水','丑土','寅木','卯木','辰土','巳火','午火','未土'];
  var tgIdx = (year - 4) % 10;
  var dzIdx = (year - 4) % 12;
  var yearTg = tg[tgIdx];
  var yearDz = dz[dzIdx];
  var yearWx = yearTg.slice(1);
  // 生命靈數五行
  var lpn = rd(rd(year) + rd(month) + rd(day));
  var numWx = {1:'水',2:'火',3:'木',4:'金',5:'土',6:'金',7:'水',8:'土',9:'火',11:'木',22:'土',33:'火'};
  return {
    yearTg: yearTg.slice(0,1),
    yearDz: yearDz.slice(0,1),
    yearWx: yearWx,
    numWx: numWx[lpn] || '土',
    lifePathNum: lpn,
    tgFull: yearTg,
    dzFull: yearDz
  };
}

function getLuckyColors(wx, theme){
  var base = {
    '金': {primary:'#F5F5F5',secondary:'#FFD700',accent:'#C0C0C0',name:'白金'},
    '木': {primary:'#2E7D32',secondary:'#66BB6A',accent:'#A5D6A7',name:'翠綠'},
    '水': {primary:'#0D47A1',secondary:'#42A5F5',accent:'#90CAF9',name:'深藍'},
    '火': {primary:'#B71C1C',secondary:'#EF5350',accent:'#FF8A80',name:'紫紅'},
    '土': {primary:'#795548',secondary:'#D7CCC8',accent:'#FFCC80',name:'琥珀棕'}
  };
  return base[wx] || base['土'];
}

function getZodiac(year){
  var animals = ['鼠','牛','虎','兔','龍','蛇','馬','羊','猴','雞','狗','豬'];
  return animals[(year - 4) % 12];
}

function getLuckyNum(lpn){
  var map = {1:[1,5,7],2:[2,4,8],3:[3,6,9],4:[1,4,6],5:[2,5,9],6:[3,6,8],7:[1,4,7],8:[2,5,8],9:[3,6,9],11:[1,2,4],22:[2,4,8],33:[3,6,9]};
  return map[lpn] || [1,5,9];
}

// ═══ 時辰下拉備用值 → 中段時間（用於只選時辰沒填精確時間的情境）═══
var HOUR_BLOCK_TO_HMS = {
  zaozi: { h:0,  m:30, num:1,  name:'早子時' },
  chou:  { h:2,  m:0,  num:2,  name:'丑時'  },
  yin:   { h:4,  m:0,  num:3,  name:'寅時'  },
  mao:   { h:6,  m:0,  num:4,  name:'卯時'  },
  chen:  { h:8,  m:0,  num:5,  name:'辰時'  },
  si:    { h:10, m:0,  num:6,  name:'巳時'  },
  wu:    { h:12, m:0,  num:7,  name:'午時'  },
  wei:   { h:14, m:0,  num:8,  name:'未時'  },
  shen:  { h:16, m:0,  num:9,  name:'申時'  },
  you:   { h:18, m:0,  num:10, name:'酉時'  },
  xu:    { h:20, m:0,  num:11, name:'戌時'  },
  hai:   { h:22, m:0,  num:12, name:'亥時'  },
  wanzi: { h:23, m:30, num:1,  name:'晚子時' }
};

// 從精確時間反推時辰
function hourToBlock(h) {
  if (h === 0) return HOUR_BLOCK_TO_HMS.zaozi;
  if (h >= 1 && h <= 2) return HOUR_BLOCK_TO_HMS.chou;
  if (h >= 3 && h <= 4) return HOUR_BLOCK_TO_HMS.yin;
  if (h >= 5 && h <= 6) return HOUR_BLOCK_TO_HMS.mao;
  if (h >= 7 && h <= 8) return HOUR_BLOCK_TO_HMS.chen;
  if (h >= 9 && h <= 10) return HOUR_BLOCK_TO_HMS.si;
  if (h >= 11 && h <= 12) return HOUR_BLOCK_TO_HMS.wu;
  if (h >= 13 && h <= 14) return HOUR_BLOCK_TO_HMS.wei;
  if (h >= 15 && h <= 16) return HOUR_BLOCK_TO_HMS.shen;
  if (h >= 17 && h <= 18) return HOUR_BLOCK_TO_HMS.you;
  if (h >= 19 && h <= 20) return HOUR_BLOCK_TO_HMS.xu;
  if (h >= 21 && h <= 22) return HOUR_BLOCK_TO_HMS.hai;
  if (h === 23) return HOUR_BLOCK_TO_HMS.wanzi;
  return HOUR_BLOCK_TO_HMS.wu;
}

// ═══ ④ 人類圖（閘門表 + 計算函式，1:1 校準 js/destiny-calc.js calcHumanDesign，使用 WW_EPH）═══
var GATE_TABLE=[[358.25,25],[3.875,17],[9.5,21],[15.125,51],[20.75,42],[26.375,3],[32.0,27],[37.625,24],[43.25,2],[48.875,23],[54.5,8],[60.125,20],[65.75,16],[71.375,35],[77.0,45],[82.625,12],[88.25,15],[93.875,52],[99.5,39],[105.125,53],[110.75,62],[116.375,56],[122.0,31],[127.625,33],[133.25,7],[138.875,4],[144.5,29],[150.125,59],[155.75,40],[161.375,64],[167.0,47],[172.625,6],[178.25,46],[183.875,18],[189.5,48],[195.125,57],[200.75,32],[206.375,50],[212.0,28],[217.625,44],[223.25,1],[228.875,43],[234.5,14],[240.125,34],[245.75,9],[251.375,5],[257.0,26],[262.625,11],[268.25,10],[273.875,58],[279.5,38],[285.125,54],[290.75,61],[296.375,60],[302.0,41],[307.625,19],[313.25,13],[318.875,49],[324.5,30],[330.125,55],[335.75,37],[341.375,63],[347.0,22],[352.625,36]];
function lonToGate(lon){lon=((lon%360)+360)%360;for(var i=GATE_TABLE.length-1;i>=0;i--){if(lon>=GATE_TABLE[i][0]){var gate=GATE_TABLE[i][1],dist=lon-GATE_TABLE[i][0];return{gate:gate,line:Math.min(Math.floor(dist/0.9375)+1,6)};}}var dist=lon-GATE_TABLE[63][0]+360;return{gate:GATE_TABLE[63][1],line:Math.min(Math.floor(dist/0.9375)+1,6)};}
var HD_CHANNELS={'1-8':'靈感','2-14':'方向','3-60':'突變','4-63':'邏輯','5-15':'韻律','6-59':'親密','7-31':'Alpha','9-52':'專注','10-20':'覺醒','10-34':'探索','10-57':'完美','11-56':'好奇','12-22':'開放','13-33':'浪子','16-48':'才華','17-62':'接受','18-58':'批判','19-49':'綜合','20-34':'魅力','20-57':'腦波','21-45':'金錢','23-43':'架構','24-61':'覺察','25-51':'發起','26-44':'投降','27-50':'保存','28-38':'困頓掙扎','29-46':'發現','30-41':'夢想','32-54':'轉化','34-57':'力量','35-36':'無常','37-40':'社群','39-55':'情緒','42-53':'成熟','47-64':'抽象'};
var HD_CENTERS={head:[61,63,64],ajna:[47,24,4,17,43,11],throat:[62,23,56,35,12,45,33,8,31,20,16],g:[46,2,15,10,25,1,13,7],sacral:[5,14,29,59,9,3,42,27,34],spleen:[48,57,44,50,32,28,18],solar:[6,37,22,36,49,55,30],ego:[21,40,26,51],root:[53,60,52,19,39,41,58,38,54]};
var HD_CENTER_NAMES={head:'頭頂',ajna:'阿賈那',throat:'喉嚨',g:'G中心',sacral:'薦骨',spleen:'脾',solar:'情緒',ego:'意志力',root:'根部'};
function wwCalcHumanDesign(planets,Y,M,D,H,min){
  if(!planets||!WW_EPH)return null;
  var pGates={},dGates={};
  var pNames=['太陽','地球','月亮','北交點','南交點','水星','金星','火星','木星','土星','天王星','海王星','冥王星'];
  var pKeys=['sun','earth','moon','node','snode','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  pKeys.forEach(function(k,i){
    var lon=k=='earth'?(planets.sun.lon+180)%360:k=='snode'?planets.snode.lon:planets[k]?planets[k].lon:0;
    var g=lonToGate(lon);pGates[pNames[i]]=g.gate+'.'+g.line;
  });
  var targetSun=(planets.sun.lon-88+360)%360;
  var utcH=H-8+(min||0)/60;
  var bd=new Date(Date.UTC(Y,M-1,D));bd.setUTCDate(bd.getUTCDate()-100);
  var bestDiff=999,bestDate=null,bestFrac=0;
  for(var di=0;di<30;di++){
    var cd=new Date(bd.getTime()+di*86400000);
    var ck=String(cd.getUTCFullYear()).padStart(4,'0')+String(cd.getUTCMonth()+1).padStart(2,'0')+String(cd.getUTCDate()).padStart(2,'0');
    var nd2=new Date(cd.getTime()+86400000);
    var nk=String(nd2.getUTCFullYear()).padStart(4,'0')+String(nd2.getUTCMonth()+1).padStart(2,'0')+String(nd2.getUTCDate()).padStart(2,'0');
    if(!WW_EPH[ck]||!WW_EPH[nk])continue;
    for(var hi=0;hi<96;hi++){
      var frac=hi/96;var v1=WW_EPH[ck][0],v2=WW_EPH[nk][0];var dd=v2-v1;if(dd>180)dd-=360;if(dd<-180)dd+=360;
      var sun=(v1+dd*frac+360)%360;var df=targetSun-sun;if(df>180)df-=360;if(df<-180)df+=360;
      if(Math.abs(df)<Math.abs(bestDiff)){bestDiff=df;bestDate={ck:ck,nk:nk};bestFrac=frac;}
    }
  }
  if(bestDate&&WW_EPH[bestDate.ck]&&WW_EPH[bestDate.nk]){
    pKeys.forEach(function(k,i){
      var pidx={'sun':0,'moon':1,'mercury':2,'venus':3,'mars':4,'jupiter':5,'saturn':6,'uranus':7,'neptune':8,'pluto':9,'node':11,'earth':-1,'snode':-2}[k];
      var lon;
      if(pidx==-1){var v1=WW_EPH[bestDate.ck][0],v2=WW_EPH[bestDate.nk][0];var dd=v2-v1;if(dd>180)dd-=360;if(dd<-180)dd+=360;lon=((v1+dd*bestFrac+360)%360+180)%360;}
      else if(pidx==-2){var v1=WW_EPH[bestDate.ck][11],v2=WW_EPH[bestDate.nk][11];var dd=v2-v1;if(dd>180)dd-=360;if(dd<-180)dd+=360;lon=((v1+dd*bestFrac+360)%360+180)%360;}
      else{var v1=WW_EPH[bestDate.ck][pidx],v2=WW_EPH[bestDate.nk][pidx];var dd=v2-v1;if(dd>180)dd-=360;if(dd<-180)dd+=360;lon=(v1+dd*bestFrac+360)%360;}
      var g=lonToGate(lon);dGates[pNames[i]]=g.gate+'.'+g.line;
    });
  }
  var dSunLon=targetSun;
  var allGates=new Set();
  for(var k in pGates)allGates.add(parseInt(pGates[k]));
  for(var k in dGates)allGates.add(parseInt(dGates[k]));
  var channels=[];
  for(var ch in HD_CHANNELS){var parts=ch.split('-');if(allGates.has(parseInt(parts[0]))&&allGates.has(parseInt(parts[1]))){channels.push({gates:ch,name:HD_CHANNELS[ch]});}}
  var defC=[],undefC=[];
  for(var c in HD_CENTERS){
    var hasChannel=false;
    channels.forEach(function(ch){var ps=ch.gates.split('-').map(Number);ps.forEach(function(g){if(HD_CENTERS[c].indexOf(g)>=0)hasChannel=true;});});
    (hasChannel?defC:undefC).push(HD_CENTER_NAMES[c]);
  }
  var _cg={};for(var _cc in HD_CENTERS)_cg[_cc]=[];
  channels.forEach(function(ch){
    var ps=ch.gates.split('-').map(Number);var inv=[];
    for(var _cc in HD_CENTERS){var found=false;ps.forEach(function(g){if(HD_CENTERS[_cc].indexOf(g)>=0)found=true;});if(found&&inv.indexOf(_cc)<0)inv.push(_cc);}
    for(var ii=0;ii<inv.length;ii++)for(var jj=ii+1;jj<inv.length;jj++){
      if(_cg[inv[ii]].indexOf(inv[jj])<0)_cg[inv[ii]].push(inv[jj]);
      if(_cg[inv[jj]].indexOf(inv[ii])<0)_cg[inv[jj]].push(inv[ii]);
    }
  });
  function _m2t(){
    var MM=['薦骨','情緒','意志力','根部'];
    for(var mi=0;mi<MM.length;mi++){
      if(defC.indexOf(MM[mi])<0)continue;
      var startKey='';for(var _k in HD_CENTER_NAMES)if(HD_CENTER_NAMES[_k]===MM[mi])startKey=_k;
      if(!startKey)continue;
      var vis={},q=[startKey];vis[startKey]=true;
      while(q.length>0){var cur=q.shift();if(cur==='throat')return true;(_cg[cur]||[]).forEach(function(nb){if(!vis[nb]){vis[nb]=true;q.push(nb);}});}
    }
    return false;
  }
  var type='投射者',strategy='等待邀請',authority='',nst='苦澀';
  var hasSacral=defC.indexOf('薦骨')>=0,_hasM2T=_m2t();
  if(hasSacral&&_hasM2T){type='顯示生產者';strategy='等待回應（聽肚子），然後告知';nst='挫敗/憤怒';}
  else if(hasSacral){type='生產者';strategy='等待回應';nst='挫敗';}
  else if(!hasSacral&&_hasM2T){type='顯示者';strategy='告知';nst='憤怒';}
  else if(defC.length<=1){type='反映者';strategy='等待月循環';nst='失望';}
  if(defC.indexOf('情緒')>=0)authority='情緒權威';
  else if(defC.indexOf('薦骨')>=0)authority='薦骨權威';
  else if(defC.indexOf('脾')>=0)authority='脾權威';
  else if(defC.indexOf('意志力')>=0)authority='意志力權威';
  else if(defC.indexOf('G中心')>=0)authority='G中心權威';
  else authority='外在權威';
  var sunG=lonToGate(planets.sun.lon),dSunG=lonToGate(dSunLon);
  var hdProfile=sunG.line+'/'+dSunG.line;
  var _defKeys=[];for(var _dk in HD_CENTERS){if(defC.indexOf(HD_CENTER_NAMES[_dk])>=0)_defKeys.push(_dk);}
  var _vis2={},_comps=0;
  _defKeys.forEach(function(c){if(_vis2[c])return;_comps++;var q=[c];while(q.length){var cur=q.shift();if(_vis2[cur])return;_vis2[cur]=true;(_cg[cur]||[]).forEach(function(nb){if(!_vis2[nb]&&_defKeys.indexOf(nb)>=0)q.push(nb);});}});
  var defType=_comps<=1?(_defKeys.length===0?'無定義':'單一定義'):_comps===2?'二分人':_comps===3?'三分人':'四分人';
  var _MO=[41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60];
  var _mp={};_MO.forEach(function(g,i){_mp[g]=i;});
  function _opp(g){return _MO[(_mp[g]+32)%64];}
  var _QS=[[13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24],[2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33],[7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44],[1,43,14,34,9,5,26,11,10,58,38,54,61,60,41,19]];
  var _RN=['人面獅身','解釋','感染','精神','計畫','意識','統治','伊甸園','愛之器皿','服務','張力','滲透','馬雅','律法','意外','四方之路'];
  var _JN={1:'自我表達',2:'引導',3:'突變',4:'公式化',5:'習慣',6:'命運',7:'互動',8:'貢獻',9:'馴服',10:'行為',11:'觀念',12:'表達',13:'傾聽',14:'力量技巧',15:'極端',16:'實驗',17:'意見',18:'修正',19:'需求',20:'當下',21:'掌控',22:'優雅',23:'同化',24:'合理化',25:'天真',26:'詭計師',27:'照顧',28:'冒險',29:'承諾',30:'命運之火',31:'影響',32:'保存',33:'退隱',34:'力量',35:'經驗',36:'危機',37:'交易',38:'對立',39:'挑釁',40:'否認',41:'幻想',42:'完成',43:'洞見',44:'警覺',45:'擁有',46:'緣分',47:'壓迫',48:'深度',49:'原則',50:'價值',51:'震驚',52:'靜止',53:'開始',54:'企圖心',55:'情緒',56:'刺激',57:'直覺',58:'活力',59:'親密',60:'限制',61:'思考',62:'細節',63:'懷疑',64:'困惑'};
  var _LA=['面具','革命','對抗','二元性','遷移','循環','校準','飛行','預防','需求','奉獻','努力','限制','希望','分心','轉世'];
  var _LB=['面具','告知','不確定','勤勉','遷移','分離','校準','教育','預防','需求','奉獻','努力','限制','闡明','意外','精煉'];
  var crossFull='';
  (function(){
    var ps=sunG.gate,qi=-1,pos=-1;
    for(var q=0;q<4;q++){var idx=_QS[q].indexOf(ps);if(idx>=0){qi=q;pos=idx;break;}}
    if(qi<0){crossFull=ps+'/'+_opp(ps)+' | '+dSunG.gate+'/'+_opp(dSunG.gate);return;}
    var pe=_opp(ps),ds=dSunG.gate,de=_opp(ds),gs=ps+'/'+pe+' | '+ds+'/'+de,v=qi+1;
    var ln=parseInt(String(hdProfile).split('/')[0])||0;
    if(ln>=1&&ln<=3)crossFull='右角度交叉之'+_RN[pos]+v+' ('+gs+')';
    else if(ln===4)crossFull='並列交叉之'+(_JN[ps]||'')+' ('+gs+')';
    else{var nm=(qi===0||qi===2)?_LA[pos]:_LB[pos];crossFull='左角度交叉之'+nm+((qi<=1)?1:2)+' ('+gs+')';}
  })();
  return{type:type,strategy:strategy,authority:authority,profile:hdProfile,nst:nst,channels:channels,defC:defC,undefC:undefC,pGates:pGates,dGates:dGates,defType:defType,crossFull:crossFull};
}

async function calculateProfile(){
  var y = parseInt(document.getElementById('yearInput').value);
  var m = parseInt(document.getElementById('monthInput').value);
  var d = parseInt(document.getElementById('dayInput').value);
  if(!y||!m||!d||y<1920||y>2026||m<1||m>12||d<1||d>31){showToast('請輸入完整的出生日期');return;}

  // ── 時間 / 時辰處理 ──
  var timeStr = (document.getElementById('timeInput').value || '').trim();
  var hourBlockId = (document.getElementById('hourBlockSelect') ? document.getElementById('hourBlockSelect').value : '');
  var hasPreciseTime = !!timeStr;
  var hasHourInfo = false;
  var hour = null, minute = null, hourBlock = null;

  if (hasPreciseTime) {
    var parts = timeStr.split(':');
    hour = parseInt(parts[0]);
    minute = parseInt(parts[1] || '0');
    hourBlock = hourToBlock(hour);
    hasHourInfo = true;
  } else if (hourBlockId && HOUR_BLOCK_TO_HMS[hourBlockId]) {
    hourBlock = HOUR_BLOCK_TO_HMS[hourBlockId];
    hour = hourBlock.h;
    minute = hourBlock.m;
    hasHourInfo = true;
  }

  // ── 性別 / 出生地 ──
  var genderEl = document.querySelector('#genderSelector .ww-theme.active');
  var gender = genderEl ? (genderEl.dataset.gender || '') : '';
  var cityKey = document.getElementById('cityInput').value || '';
  var cityInfo = cityKey ? CITY_COORDS[cityKey] : null;

  // ── 載入星曆（destiny-engine 同款）── 4MB 首次有延遲，之後 cache 命中
  var btn = document.querySelector('button[onclick="calculateProfile()"]');
  var btnOriginalText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '⏳ 載入星曆計算中...'; }
  try {
    await loadEphemeris();
  } catch (e) {
    console.warn('星曆載入失敗，占星將略過', e);
  }
  if (btn) { btn.disabled = false; btn.textContent = btnOriginalText; }

  // ── 八字四柱 + 完整五行統計（使用 lunar-javascript，與 destiny-engine / fuling-mima 同款）──
  var bazi = calcBaziWuxing(y, m, d, hour !== null ? hour : 12, minute !== null ? minute : 0, hasHourInfo ? 2 : 2);
  var dominantWx, missingWx, baziStat, dayMaster, dayMasterWx, lunarMonth, lunarDay, isLeapMonth, yearGz;
  if (bazi) {
    dominantWx = bazi.dominant;
    missingWx = bazi.missing;
    baziStat = bazi.stat;
    dayMaster = bazi.dayMaster;
    dayMasterWx = bazi.dayMasterWx;
    lunarMonth = bazi.lunarMonth;
    lunarDay = bazi.lunarDay;
    isLeapMonth = bazi.isLeapMonth;
    yearGz = bazi.yearGz;
  } else {
    // lunar.min.js 沒載入時的 fallback
    var fallback = getWuxing(y, m, d);
    dominantWx = fallback.yearWx;
    missingWx = ['金','木','水','火','土'].filter(function(w){ return w !== fallback.yearWx && w !== fallback.numWx; });
    baziStat = null;
    dayMaster = fallback.tgFull;
    dayMasterWx = fallback.yearWx;
    lunarMonth = 0;
    lunarDay = 0;
    isLeapMonth = false;
    yearGz = fallback.tgFull + fallback.dzFull;
  }

  // ── 馥靈秘碼 H/O/U/R ──
  var fuling = (lunarMonth && lunarDay) ? calcFulingHOUR(lunarMonth, lunarDay, y, m, d, hourBlock ? hourBlock.num : null) : null;

  // ── 西洋占星（使用 destiny-engine 同款 ephLookup + calcPlacidus）──
  var sunSign = null, sunSignFull = null, moonSign = null, risingSign = null;
  // 太陽星座：用中午 12:00 取，避免時間差影響（destiny-engine 也是這樣）
  var ephAtNoon = WW_EPH ? wwEphLookup(y, m, d, 12, 0) : null;
  if (ephAtNoon && ephAtNoon.sun) {
    sunSign = ephAtNoon.sun.sign + '座'; // ephLookup 回傳不含「座」字，補上
    sunSignFull = sunSign;
  }
  // 月亮星座：需要精確時間
  if (hasHourInfo && WW_EPH) {
    var ephAtBirth = wwEphLookup(y, m, d, hour, minute || 0);
    if (ephAtBirth && ephAtBirth.moon) moonSign = ephAtBirth.moon.sign + '座';
  }
  // 上升星座：需要精確時間 + 出生地座標
  if (hasHourInfo && cityInfo) {
    var jd = wwJulianDay(y, m, d, hour, minute || 0);
    var houses = wwCalcPlacidus(cityInfo.lat, cityInfo.lon, jd);
    if (houses && houses.asc !== undefined) {
      risingSign = lonToSign(houses.asc);
    }
  }

  // ── 馬雅曆（使用 destiny-engine 同款 calcMaya）──
  var maya = wwCalcMaya(y, m, d);

  // ── 33 套命理：簡單日期函式（destiny-engine 1:1 移植）──
  var nsk = wwCalcNSK(y, m, d);          // ⑪ 九星氣學
  var birthColor = wwCalcColor(y, m, d); // ⑫ 生日色彩
  var xiuyao = wwCalcXiuYao(y, m, d);    // ⑰ 宿曜占星
  var rainbow = wwCalcRainbow(y, m, d);  // ⑳ 彩虹數字
  var cardology = wwCalcCardology(m, d); // ㉑ 撲克牌命理
  var celtic = wwCalcCelticTree(m, d);   // ㉒ 居爾特樹曆

  // ── ④ 人類圖（1:1 校準 destiny-calc.js，使用 WW_EPH）──
  var humanDesign = null;
  if (WW_EPH) {
    var ephForHD = hasHourInfo ? wwEphLookup(y, m, d, hour, minute || 0) : wwEphLookup(y, m, d, 12, 0);
    if (ephForHD) humanDesign = wwCalcHumanDesign(ephForHD, y, m, d, hasHourInfo ? hour : 12, hasHourInfo ? (minute || 0) : 0);
  }

  // ── 生命靈數 / 生肖 ──
  var lifePathNum = reduceNum(reduceNum(y) + reduceNum(m) + reduceNum(d));
  var zodiac = getZodiac(y);
  var colors = getLuckyColors(dominantWx, selectedTheme);
  var luckyNums = getLuckyNum(lifePathNum);

  // ── 三角生命密碼（簡化主數）──
  var triNum = reduceNum(parseInt(String(y).split('').join('')) + m + d);

  profileData = {
    year: y, month: m, day: d,
    lunarMonth: lunarMonth,
    lunarDay: lunarDay,
    isLeapMonth: isLeapMonth,
    yearGz: yearGz,
    hour: hour, minute: minute,
    hourBlockName: hourBlock ? hourBlock.name : null,
    hasPreciseTime: hasPreciseTime,
    hasHourInfo: hasHourInfo,
    gender: gender,
    cityKey: cityKey,
    cityLabel: cityInfo ? cityInfo.label : null,
    cityLat: cityInfo ? cityInfo.lat : null,
    cityLon: cityInfo ? cityInfo.lon : null,
    bazi: bazi,
    dayMaster: dayMaster,
    dayMasterWx: dayMasterWx,
    baziStat: baziStat,
    dominantWx: dominantWx,
    missingWx: missingWx,
    lifePathNum: lifePathNum,
    triNum: triNum,
    zodiac: zodiac,
    colors: colors,
    luckyNums: luckyNums,
    fuling: fuling,
    sunSign: sunSign,
    moonSign: moonSign,
    risingSign: risingSign,
    maya: maya,
    nsk: nsk,
    birthColor: birthColor,
    xiuyao: xiuyao,
    rainbow: rainbow,
    cardology: cardology,
    celtic: celtic,
    humanDesign: humanDesign
  };

  // ═══ 補齊 33 套命理（用 destiny-calc.js 既有函式，不自編）═══
  // ② 紫微斗數（完整命宮/財帛/官祿主星）
  try {
    if (typeof calcZiwei === 'function' && yearGz && hasHourInfo) {
      var TG_STR = '甲乙丙丁戊己庚辛壬癸';
      var DZ_STR = '子丑寅卯辰巳午未申酉戌亥';
      var ytI = TG_STR.indexOf(yearGz.charAt(0));
      var yzI = DZ_STR.indexOf(yearGz.charAt(1));
      if (ytI >= 0 && yzI >= 0 && lunarMonth > 0 && lunarDay > 0) {
        var hzI = hour !== null ? (hour === 23 ? 0 : Math.floor((hour + 1) / 2) % 12) : 6;
        profileData.ziwei = calcZiwei(lunarMonth, lunarDay, ytI, yzI, hzI, gender || 'F');
      }
    }
  } catch (e) { console.warn('紫微補算失敗：', e.message); }

  // ⑤ 七政四餘（需要完整行星資料）
  try {
    if (typeof calcQizheng === 'function' && WW_EPH && hasHourInfo) {
      var planetsForQi = wwEphLookup(y, m, d, hour, minute || 0);
      if (planetsForQi) profileData.qizheng = calcQizheng(planetsForQi, y, m, d);
    }
  } catch (e) { console.warn('七政補算失敗：', e.message); }

  // ⑭ 吠陀占星（月宿 + 行星位置）
  try {
    if (typeof calcVedic === 'function' && WW_EPH && hasHourInfo) {
      var planetsForVedic = wwEphLookup(y, m, d, hour, minute || 0);
      if (planetsForVedic) profileData.vedic = calcVedic(planetsForVedic, y, m, d);
    }
  } catch (e) { console.warn('吠陀補算失敗：', e.message); }

  // ⑯ 卡巴拉生命之樹（需要太陽黃經）
  try {
    if (typeof calcBML === 'function') {
      profileData.kabbalah = calcBML(y, m, d);
    }
  } catch (e) { console.warn('卡巴拉補算失敗：', e.message); }

  // ⑩ 大六壬
  try {
    if (typeof calcLiuren === 'function' && bazi && bazi.dayMaster && hasHourInfo) {
      var TG_L = '甲乙丙丁戊己庚辛壬癸';
      var DZ_L = '子丑寅卯辰巳午未申酉戌亥';
      var dayGanIdx = TG_L.indexOf(bazi.dayMaster);
      // bazi.dayGz 應該有值，但為了保險再從 dayMaster 推
      var dayPillarGz = bazi.pillars && bazi.pillars.day ? bazi.pillars.day.full : (bazi.dayGz || '');
      var dayZhiIdx = dayPillarGz.length >= 2 ? DZ_L.indexOf(dayPillarGz.charAt(1)) : -1;
      var hzIForLiu = hour === 23 ? 0 : Math.floor((hour + 1) / 2) % 12;
      if (dayGanIdx >= 0 && dayZhiIdx >= 0 && lunarMonth > 0) {
        profileData.liuren = calcLiuren(lunarMonth, hzIForLiu, dayGanIdx, dayZhiIdx);
      }
    }
  } catch (e) { console.warn('大六壬補算失敗：', e.message); }

  // ⑨ 三角密碼完整版（覆蓋前面簡化的 triNum）
  try {
    if (typeof calcTri === 'function') {
      var triFull = calcTri(y, m, d);
      if (triFull) {
        profileData.triangleFull = triFull;
        profileData.triNum = triFull.O || profileData.triNum;  // O 是中心合數
      }
    }
  } catch (e) { console.warn('三角密碼補算失敗：', e.message); }

  // ⑮ 姓名解碼（如果用戶填了姓名欄，呼叫 destiny-calc.js getStroke 算五格）
  try {
    var nameInput = (document.getElementById('userNameInput') || {}).value || '';
    nameInput = nameInput.trim();
    if (nameInput && typeof getStroke === 'function') {
      var strokes = [];
      for (var ni = 0; ni < nameInput.length; ni++) {
        strokes.push(getStroke(nameInput.charAt(ni)) || 0);
      }
      var total = strokes.reduce(function(a,b){ return a+b; }, 0);
      // 簡化：姓名五格（天/人/地/外/總）—— 這裡只存 total + strokes 給後端
      profileData.name = nameInput;
      profileData.nameStrokes = strokes;
      profileData.nameTotal = total;
      // 天格（姓 + 1）
      if (strokes.length >= 1) profileData.nameTianGe = strokes[0] + 1;
      // 人格（姓 + 名1）
      if (strokes.length >= 2) profileData.nameRenGe = strokes[0] + strokes[1];
      // 地格（名全）
      if (strokes.length >= 2) profileData.nameDiGe = strokes.slice(1).reduce(function(a,b){return a+b;},0);
    }
  } catch (e) { console.warn('姓名解碼補算失敗：', e.message); }

  // 渲染量身打造的命理座標卡
  var grid = document.getElementById('profileGrid');
  var cards = [];
  if (sunSign) cards.push('<div class="ww-profile-item"><div class="label">太陽星座</div><div class="value">' + sunSign + '</div></div>');
  if (moonSign) cards.push('<div class="ww-profile-item"><div class="label">月亮星座</div><div class="value">' + moonSign + '</div></div>');
  if (risingSign) cards.push('<div class="ww-profile-item"><div class="label">上升星座</div><div class="value">' + risingSign + '</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">生肖</div><div class="value">' + zodiac + '</div></div>');
  if (lunarMonth) cards.push('<div class="ww-profile-item"><div class="label">農曆生日</div><div class="value" style="font-size:.92rem">' + (isLeapMonth ? '閏' : '') + lunarMonth + '/' + lunarDay + '</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">年柱</div><div class="value">' + yearGz + '</div></div>');
  if (bazi && hasHourInfo) {
    cards.push('<div class="ww-profile-item"><div class="label">日主天干</div><div class="value">' + dayMaster + '（' + dayMasterWx + '）</div></div>');
  }
  cards.push('<div class="ww-profile-item"><div class="label">主要五行</div><div class="value">' + dominantWx + '</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">需補五行</div><div class="value">' + (missingWx.length ? missingWx.join('、') : '均衡') + '</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">幸運色系</div><div class="value" style="color:' + colors.secondary + '">' + colors.name + '</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">生命靈數</div><div class="value">' + lifePathNum + '</div></div>');
  if (fuling) {
    cards.push('<div class="ww-profile-item"><div class="label">馥靈 H 癒數</div><div class="value">' + fuling.H + '</div></div>');
    cards.push('<div class="ww-profile-item"><div class="label">馥靈 O 識數</div><div class="value">' + fuling.O + '</div></div>');
    if (fuling.U) cards.push('<div class="ww-profile-item"><div class="label">馥靈 U 鑰數</div><div class="value">' + fuling.U + '</div></div>');
    cards.push('<div class="ww-profile-item"><div class="label">馥靈 R 行數</div><div class="value">' + fuling.R + '</div></div>');
  }
  cards.push('<div class="ww-profile-item"><div class="label">馬雅圖騰</div><div class="value" style="font-size:.88rem">' + maya.tone + '・' + maya.seal + '</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">⑪ 九星氣學</div><div class="value" style="font-size:.85rem">' + nsk.star.n + '</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">⑫ 生日色彩</div><div class="value" style="color:' + birthColor.mc.h + ';font-size:.92rem">' + birthColor.mc.n + '・' + birthColor.mc.ck + '</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">⑰ 宿曜星宿</div><div class="value" style="font-size:.88rem">' + xiuyao.name + '宿（' + xiuyao.guard + '）</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">⑳ 彩虹中心數</div><div class="value">' + rainbow.centerNum + '</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">㉑ 撲克生命牌</div><div class="value" style="font-size:1.05rem">' + cardology.display + '</div></div>');
  cards.push('<div class="ww-profile-item"><div class="label">㉒ 居爾特樹</div><div class="value" style="font-size:.92rem">' + celtic.name + '</div></div>');
  if (humanDesign) {
    cards.push('<div class="ww-profile-item"><div class="label">④ 人類圖類型</div><div class="value" style="font-size:.9rem">' + humanDesign.type + '</div></div>');
    cards.push('<div class="ww-profile-item"><div class="label">人生角色</div><div class="value">' + humanDesign.profile + '</div></div>');
    if (humanDesign.authority) cards.push('<div class="ww-profile-item"><div class="label">內在權威</div><div class="value" style="font-size:.82rem">' + humanDesign.authority + '</div></div>');
    if (humanDesign.channels && humanDesign.channels.length) cards.push('<div class="ww-profile-item"><div class="label">活化通道</div><div class="value" style="font-size:.78rem">' + humanDesign.channels.map(function(c){return c.name;}).join('、') + '</div></div>');
  }
  cards.push('<div class="ww-profile-item"><div class="label">幸運數字</div><div class="value">' + luckyNums.join('、') + '</div></div>');
  if (cityInfo) cards.push('<div class="ww-profile-item"><div class="label">出生地</div><div class="value" style="font-size:.88rem">' + cityInfo.label + '</div></div>');
  if (hourBlock) cards.push('<div class="ww-profile-item"><div class="label">出生時辰</div><div class="value" style="font-size:.88rem">' + hourBlock.name + '</div></div>');

  grid.innerHTML = cards.join('');

  // 顯示完整 33 套系統清單（讓客人看到我們算進去的系統列表）
  var sysListEl = document.getElementById('systemList');
  if (sysListEl) sysListEl.style.display = 'block';

  document.getElementById('profileSection').classList.add('show');
  document.getElementById('profileSection').scrollIntoView({behavior:'smooth',block:'start'});
  if(window.HL_track) HL_track('tool_calculate',{toolId:'wealth-wallpaper',toolName:'能量桌布'});
}

// ═══ 會員桌布額度 ═══
var WALLPAPER_QUOTA = { free: 0, plus: 1, pro: 3 };

async function checkMemberQuota(){
  try {
    if(typeof firebase === 'undefined' || !firebase.auth) return null;
    var user = firebase.auth().currentUser;
    if(!user) return null;
    var db = firebase.firestore();
    var userDoc = await db.collection('users').doc(user.uid).get();
    if(!userDoc.exists) return null;
    var data = userDoc.data();
    var plan = data.plan || 'free';

    // ① 月贈額度（訂閱會員，優先消耗有效期限較短的）
    var monthlyQuota = WALLPAPER_QUOTA[plan] || 0;
    if(monthlyQuota > 0){
      var now = new Date();
      var monthKey = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
      var qDoc = await db.collection('users').doc(user.uid).collection('wallpaper_quota').doc(monthKey).get();
      var used = qDoc.exists ? (qDoc.data().count || 0) : 0;
      var remaining = Math.max(0, monthlyQuota - used);
      if(remaining > 0) return { plan:plan, quota:monthlyQuota, used:used, remaining:remaining, uid:user.uid, monthKey:monthKey, isBonus:false };
    }

    // ② 購買代碼（wallpaper_bonus，永不過期）
    var bonus = (data.wallpaper_bonus || 0);
    if(bonus > 0) return { plan:plan, quota:bonus, used:0, remaining:bonus, uid:user.uid, monthKey:null, isBonus:true };

    return null;
  } catch(e){ return null; }
}

async function useMemberQuota(info){
  try {
    var db = firebase.firestore();
    if(info.isBonus){
      await db.collection('users').doc(info.uid).set({
        wallpaper_bonus: firebase.firestore.FieldValue.increment(-1)
      }, { merge: true });
    } else {
      var ref = db.collection('users').doc(info.uid).collection('wallpaper_quota').doc(info.monthKey);
      await ref.set({ count: (info.used + 1), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
  } catch(e){}
}

// ═══ 代碼兌換：把 $199/$399/$599 代碼換成 wallpaper_bonus（2026/04/16 逸君要求）═══
// 規則：
//   $199 代碼（n=3 reading 或 n=1 wallpaper）→ 加 1 張桌布
//   $399 代碼（n=5 reading 或 n=3 wallpaper）→ 加 3 張桌布
//   $599 代碼（n=7 reading 或 n=6 wallpaper）→ 加 6 張桌布
//   $999 代碼（n=12 wallpaper）→ 加 12 張桌布
function _wpCodeToQuota(codeData){
  var amount = Number(codeData.amount || 0);
  if (amount === 999) return 12;
  if (amount === 599) return 6;
  if (amount === 399) return 3;
  if (amount === 199) return 1;
  // 沒存 amount，用 n 推斷（reading service 的 n=3/5/7 對應 199/399/599）
  var n = Number(codeData.n || codeData.spreads || 0);
  if (n === 12) return 12;
  if (n === 7 || n === 6) return 6;
  if (n === 5 || n === 3) return (n === 3 ? 1 : 3);
  if (n === 1) return 1;
  return 1; // fallback 至少給 1 張
}

async function redeemWallpaperCode(){
  var input = document.getElementById('wpCodeInput');
  var msg = document.getElementById('wpCodeMsg');
  var btn = document.getElementById('wpCodeBtn');
  var code = (input.value || '').trim().toUpperCase();
  if (!code) { showWpMsg('請輸入代碼', '#ff8a8a'); return; }

  if (typeof firebase === 'undefined' || !firebase.firestore) { showWpMsg('系統未就緒，請稍後再試', '#ff8a8a'); return; }
  var user = firebase.auth().currentUser;
  if (!user) { showWpMsg('請先登入會員才能兌換代碼', '#ff8a8a'); return; }

  btn.disabled = true; btn.textContent = '驗證中⋯';
  try {
    var db = firebase.firestore();
    var codeDoc = await db.collection('reading_codes').doc(code).get();
    if (!codeDoc.exists) { showWpMsg('代碼無效，請確認輸入是否正確', '#ff8a8a'); return; }
    var cd = codeDoc.data();
    if (cd.used) { showWpMsg('此代碼已使用過', '#ff8a8a'); return; }

    var wallpapers = _wpCodeToQuota(cd);

    // 加到 wallpaper_bonus + mark used
    var userRef = db.collection('users').doc(user.uid);
    await Promise.all([
      userRef.set({ wallpaper_bonus: firebase.firestore.FieldValue.increment(wallpapers) }, { merge: true }),
      db.collection('reading_codes').doc(code).update({
        used: true,
        usedAt: firebase.firestore.FieldValue.serverTimestamp(),
        usedBy: user.uid,
        usedByEmail: user.email || '',
        usedFor: 'wallpaper',
        wallpapersGranted: wallpapers
      })
    ]);

    showWpMsg('✨ 兌換成功！已加入 ' + wallpapers + ' 張桌布額度（剩餘會顯示在下方）', '#7dd4a0');
    input.value = '';
    // 刷新 quota chip
    if (typeof checkMemberQuota === 'function') {
      checkMemberQuota().then(function(info){
        var chip = document.getElementById('quotaChip');
        if (chip && info) {
          chip.textContent = '🎟️ 目前可用：' + info.remaining + ' 張桌布';
          chip.style.display = 'inline-block';
        }
      });
    }
  } catch(e) {
    showWpMsg('兌換失敗：' + (e.message || '請稍後再試'), '#ff8a8a');
  } finally {
    btn.disabled = false; btn.textContent = '✨ 兌換';
  }
}

function showWpMsg(text, color){
  var msg = document.getElementById('wpCodeMsg');
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = color || '#f8dfa5';
  msg.style.display = 'block';
}
window.redeemWallpaperCode = redeemWallpaperCode;

// ═══ 生成桌布（一次一張）═══
async function generateWallpaper(){
  if(!profileData){showToast('請先計算命理座標');return;}

  // 一次一張：先查會員額度
  var memberInfo = await checkMemberQuota();
  if(memberInfo && memberInfo.remaining > 0){
    var toastMsg = memberInfo.isBonus
      ? '使用代碼（剩餘 ' + (memberInfo.remaining - 1) + ' 張）'
      : '使用本月贈送額度（剩餘 ' + (memberInfo.remaining - 1) + ' 張）';
    showToast(toastMsg);
    await useMemberQuota(memberInfo);
    doGenerate();
    return;
  }

  // 觸發付費牆（序號兌換 或 PAYUNi 線上付款）
  if(typeof hlPaywall !== 'undefined'){
    hlPaywall.show({
      n: 1,
      priceMap: {1:199, 3:399, 6:599, 12:999},
      serviceName: '馥靈蘊福桌布',
      productCategory: 'wallpaper',
      deferConsume: true,
      onProceed: function(){ doGenerate(); }
    });
    return;
  }
  doGenerate();
}

// 取得當前登入會員資料（uid + email + name）
function getCurrentMember(){
  try {
    if(typeof firebase === 'undefined' || !firebase.auth) return {};
    var u = firebase.auth().currentUser;
    if(!u) return {};
    return { uid: u.uid || '', email: u.email || '', name: u.displayName || '' };
  } catch(e) { return {}; }
}

// ═══ 請求通知權限（在 generate 前先問）═══
function ensureNotificationPermission(){
  try {
    if (!('Notification' in window)) return Promise.resolve('unsupported');
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return Promise.resolve(Notification.permission);
    }
    return Notification.requestPermission();
  } catch(e) { return Promise.resolve('error'); }
}

// ═══ 生成完成後通知（網頁不在前景時用）═══
function fireCompletionNotification(successCount, total){
  try {
    // 1. 桌面通知
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      var n = new Notification('🌟 馥靈蘊福桌布生成完成', {
        body: '成功生成 ' + successCount + ' / ' + total + ' 張，請回到頁面查看',
        icon: '/LOGO-1.png',
        badge: '/LOGO-1.png',
        tag: 'wallpaper-done',
        requireInteraction: true
      });
      n.onclick = function(){ window.focus(); n.close(); };
    }
    // 2. 標題閃爍提示（document.hidden 時）
    if (document.hidden) {
      var orig = document.title;
      var blinkCount = 0;
      var blinkInterval = setInterval(function(){
        document.title = blinkCount % 2 === 0 ? '✅ 桌布生成完成！' : orig;
        blinkCount++;
        if (blinkCount > 20 || !document.hidden) { clearInterval(blinkInterval); document.title = orig; }
      }, 800);
      var onVisible = function(){
        if (!document.hidden) { clearInterval(blinkInterval); document.title = orig; document.removeEventListener('visibilitychange', onVisible); }
      };
      document.addEventListener('visibilitychange', onVisible);
    }
    // 3. 鈴聲（簡單 beep，不下載音檔）
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    } catch(_) {}
  } catch(e) { console.warn('通知失敗', e); }
}

// ═══ 並發池：同時跑 N 個 task 的工作池 ═══
async function runWithConcurrency(tasks, concurrency, onEachDone){
  var results = new Array(tasks.length);
  var idx = 0;
  var doneCount = 0;
  async function worker(){
    while (true) {
      var myIdx = idx++;
      if (myIdx >= tasks.length) return;
      try {
        var r = await tasks[myIdx]();
        results[myIdx] = r;
      } catch(e) {
        results[myIdx] = { error: e };
      }
      doneCount++;
      if (onEachDone) onEachDone(doneCount, tasks.length, results[myIdx], myIdx);
    }
  }
  var workers = [];
  for (var w = 0; w < Math.min(concurrency, tasks.length); w++) workers.push(worker());
  await Promise.all(workers);
  return results;
}

async function doGenerate(){
  // 先請求通知權限
  ensureNotificationPermission();

  var loading = document.getElementById('loadingSection');
  var result = document.getElementById('resultSection');
  result.classList.remove('show');
  loading.classList.add('show');
  loading.scrollIntoView({behavior:'smooth',block:'start'});

  var themeNames = {wealth:'招財豐盛',love:'愛情桃花',career:'事業貴人',protection:'護佑平安',luck:'幸運轉運'};
  var container = document.getElementById('imagesContainer');
  container.innerHTML = '';

  var member = getCurrentMember();
  var startTime = Date.now();

  // ─── 一次一張：建立單一 placeholder ───
  var slot = document.createElement('div');
  slot.className = 'ww-img-wrap' + (selectedDevice === 'desktop' ? ' desktop' : '');
  slot.style.minHeight = selectedDevice === 'desktop' ? '160px' : '320px';
  slot.style.background = 'linear-gradient(135deg,rgba(248,223,165,.06),rgba(248,223,165,.02))';
  slot.style.display = 'flex';
  slot.style.alignItems = 'center';
  slot.style.justifyContent = 'center';
  slot.innerHTML = '<div style="text-align:center;color:rgba(248,223,165,.7);font-size:.85rem"><div style="font-size:1.4rem;margin-bottom:6px">🎨</div>生成中⋯<br>大約需要 30-60 秒</div>';
  container.appendChild(slot);

  var prog = document.getElementById('loadingProgress');
  if (prog) prog.textContent = '生成中⋯約需 30-60 秒';

  var ok = false;
  var resultData = null;
  try {
    var resp = await fetch('https://app.hourlightkey.com/api/reading-services?type=wallpaper', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        profile: profileData,
        theme: selectedTheme,
        variant: 0,
        index: 0,
        total: 1,
        tier: 'basic',
        device: selectedDevice,
        aspect: selectedAspect,
        targetW: selectedTargetSize.w,
        targetH: selectedTargetSize.h,
        styleCategory: selectedStyle,
        unlockCode: window._lastUsedUnlockCode || '',
        consumeCode: true,
        uid: member.uid || '',
        email: member.email || '',
        name: member.name || ''
      })
    });
    resultData = await resp.json();
    if (resultData.success && resultData.imageUrl) {
      var displayUrl = resultData.imageUrl;
      try {
        var croppedUrl = await cropImageToAspect(resultData.imageUrl, selectedTargetSize.w, selectedTargetSize.h);
        if (croppedUrl) displayUrl = croppedUrl;
      } catch(cropErr) { console.warn('crop fallback to original:', cropErr); }

      var labelText = themeNames[selectedTheme] + ' · ' + selectedTargetSize.w + '×' + selectedTargetSize.h;
      var dlName = 'fuling-wallpaper-' + selectedTheme + '-' + selectedAspect.replace(':','x') + '.png';
      slot.style.minHeight = '';
      slot.style.background = '';
      slot.style.display = '';
      slot.innerHTML = '<img src="' + displayUrl + '" alt="馥靈蘊福桌布 - ' + themeNames[selectedTheme] + '" loading="lazy">' +
        '<div class="ww-img-label">' + labelText + '</div>' +
        '<a href="' + displayUrl + '" download="' + dlName + '" '
        + 'style="position:absolute;top:8px;right:8px;padding:6px 12px;border-radius:999px;'
        + 'background:rgba(10,7,20,.78);color:#f8dfa5;font-size:.72rem;text-decoration:none;'
        + 'border:1px solid rgba(248,223,165,.35);font-weight:600;letter-spacing:.04em">⬇ 下載</a>';
      ok = true;
    } else {
      slot.innerHTML = '<div style="text-align:center;color:#ff8a8a;font-size:.85rem;padding:20px"><div style="font-size:1.4rem;margin-bottom:6px">⚠️</div>生成失敗<br><span style="font-size:.74rem;color:rgba(255,200,200,.7)">' + (resultData.error || '請稍後再試') + '</span><br><br><span style="font-size:.78rem;color:#f8dfa5">您的代碼還沒被消耗，可以重試</span></div>';
    }
  } catch(e) {
    slot.innerHTML = '<div style="text-align:center;color:#ff8a8a;font-size:.85rem;padding:20px"><div style="font-size:1.4rem;margin-bottom:6px">⚠️</div>連線失敗<br><span style="font-size:.74rem">' + e.message + '</span><br><br><span style="font-size:.78rem;color:#f8dfa5">您的代碼還沒被消耗，可以重試</span></div>';
  }

  loading.classList.remove('show');

  if (ok) {
    document.getElementById('resultTitle').textContent = profileData.zodiac + '年生・靈數 ' + profileData.lifePathNum + '・馥靈蘊福桌布';
    var deliv = document.getElementById('deliveryNotice');
    if (deliv) {
      if (resultData.emailSent && resultData.emailTo) {
        deliv.innerHTML = '📬 已自動寄送到 <b style="color:#f8dfa5">' + resultData.emailTo + '</b><br><span style="font-size:.78rem;color:rgba(255,255,255,.55)">這封信就是您的存檔證明，請保留以便日後重新下載</span>';
        deliv.style.display = 'block';
      } else if (member.uid && member.email) {
        deliv.innerHTML = '⚠️ 桌布已生成，但寄信暫時失敗。<br><span style="font-size:.78rem;color:rgba(255,255,255,.55)">請先長按儲存，並聯繫客服補寄</span>';
        deliv.style.display = 'block';
      } else {
        deliv.innerHTML = '💡 建議登入會員後再生成，系統會自動把桌布寄到您的信箱存檔，避免遺失';
        deliv.style.display = 'block';
      }
    }
    result.classList.add('show');
    result.scrollIntoView({behavior:'smooth',block:'start'});
    if (window.HL_track) HL_track('wallpaper_generated', { toolId:'wealth-wallpaper', theme:selectedTheme, n:1, emailSent:resultData.emailSent ? 1 : 0 });
    fireCompletionNotification(1, 1);
  } else {
    showToast('生成失敗，您的代碼還可以重試');
  }
}

function resetAll(){
  document.getElementById('resultSection').classList.remove('show');
  document.getElementById('profileSection').scrollIntoView({behavior:'smooth',block:'start'});
}

function showToast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show')},2200)}

// ═══ 解讀代碼兌換桌布額度 ═══
async function redeemReadingCode(){
  var input = document.getElementById('wwRedeemInput');
  var msgEl = document.getElementById('wwRedeemMsg');
  var code = (input.value || '').trim().toUpperCase();
  if(!code){ msgEl.style.color='#ff8a8a'; msgEl.textContent='請輸入代碼'; return; }

  // 需要登入
  var user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
  if(!user){
    msgEl.style.color='#f8dfa5';
    msgEl.textContent='請先登入會員再兌換';
    setTimeout(function(){ location.href='app.html?redirect='+encodeURIComponent(location.href.split('?')[0]); }, 1200);
    return;
  }

  msgEl.style.color='rgba(249,240,229,.6)';
  msgEl.textContent='驗證中⋯⋯';

  try {
    var db = firebase.firestore();
    var codeDoc = await db.collection('reading_codes').doc(code).get();

    if(!codeDoc.exists){
      msgEl.style.color='#ff8a8a'; msgEl.textContent='代碼無效，請確認輸入是否正確'; return;
    }
    var codeData = codeDoc.data();
    if(codeData.used){
      msgEl.style.color='#ff8a8a'; msgEl.textContent='此代碼已使用過，無法再次兌換'; return;
    }

    // 張數 → 桌布額度對照（199→1, 399→3, 599→6）
    var n = codeData.n || codeData.spreads || 3;
    var creditsMap = {3:1, 5:3, 7:6};
    var credits = creditsMap[n] || 1;
    var priceLabel = n===3?'199':n===5?'399':'599';

    // 批次寫：標記代碼已用 + 加入 wallpaper_bonus
    var batch = db.batch();
    batch.update(db.collection('reading_codes').doc(code), {
      used: true,
      usedAt: firebase.firestore.FieldValue.serverTimestamp(),
      usedBy: user.uid,
      usedByEmail: user.email || '',
      usedFor: 'wallpaper'
    });
    batch.set(db.collection('users').doc(user.uid), {
      wallpaper_bonus: firebase.firestore.FieldValue.increment(credits)
    }, { merge: true });
    await batch.commit();

    input.value = '';
    msgEl.style.color='#a8e6a8';
    msgEl.textContent='兌換成功！已加入 ' + credits + ' 張桌布額度（' + priceLabel + ' 代碼）';
    showToast('兌換成功，已加入 ' + credits + ' 張桌布額度');

    // 重新整理會員額度顯示
    if(typeof checkMemberQuota === 'function') checkMemberQuota().then(function(info){
      var bar = document.getElementById('memberBalanceBar');
      if(bar && info){ bar.style.display='block'; bar.textContent='目前剩餘 '+(info.remaining)+' 張桌布額度'; }
    });
  } catch(e){
    msgEl.style.color='#ff8a8a'; msgEl.textContent='兌換失敗，請稍後再試（'+e.message+')';
  }
}

// 購買桌布代碼（直接 PAYUNi 結帳）
function buyWallpaperCredits(n){
  var priceMap = {1:199, 3:399, 6:599, 12:999};
  var price = priceMap[n];
  if(!price) return;
  var u = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
  if(!u){
    showToast('請先登入會員才能購買代碼');
    setTimeout(function(){ location.href = 'app.html?redirect=' + encodeURIComponent(location.href.split('?')[0]); }, 1200);
    return;
  }
  function doPay(){
    HLPayment.pay({
      productId:   'wallpaper-' + n,
      productName: '馥靈蘊福桌布代碼 × ' + n,
      amount:      price,
      userId:      u.uid,
      userEmail:   u.email || '',
      returnUrl:   location.href.split('?')[0]
    });
  }
  if(typeof HLPayment !== 'undefined'){ doPay(); return; }
  var s = document.createElement('script');
  s.src = 'assets/js/hl-payment.js';
  s.onload = doPay;
  s.onerror = function(){ showToast('付款模組載入失敗，請重試'); };
  document.head.appendChild(s);
}

// PAYUNi 付款返回處理
(function(){
  var params = new URLSearchParams(location.search);
  if(params.get('payment') !== 'success') return;
  params.delete('payment'); params.delete('order'); params.delete('code');
  history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params.toString() : ''));
  setTimeout(function(){
    showToast('代碼購買成功！已加入您的帳戶，可以開始生成桌布');
    setTimeout(function(){ refreshQuotaChip(); refreshBalanceBar(); }, 1500);
  }, 400);
})();

// 更新頂部餘額條
async function refreshBalanceBar(){
  var bar = document.getElementById('memberBalanceBar');
  if(!bar) return;
  var info = await checkMemberQuota();
  if(!info){ bar.style.display='none'; return; }
  var planLabel = info.plan === 'pro' ? '馥靈大師' : (info.plan === 'plus' ? '馥靈鑰友' : '');
  var sourceLabel = info.isBonus ? '代碼餘額' : (planLabel ? planLabel + '月贈' : '代碼餘額');
  bar.style.display = 'block';
  bar.innerHTML = '✨ 目前可用代碼：<b style="color:#fff;font-size:1.1rem">' + info.remaining + '</b> 張（' + sourceLabel + '）';
}

// 會員額度即時顯示
async function refreshQuotaChip(){
  var chip = document.getElementById('quotaChip');
  if(!chip) return;
  var info = await checkMemberQuota();
  if(!info){ chip.classList.remove('show'); return; }
  var planName = info.plan === 'pro' ? '馥靈大師' : (info.plan === 'plus' ? '馥靈鑰友' : '');
  var sourceTag = info.isBonus ? '購買代碼' : (planName ? planName + '月贈' : '代碼');
  if(info.remaining > 0){
    chip.innerHTML = '✨ ' + sourceTag + '剩餘 <b style="color:#fff">' + info.remaining + '</b> 張可用';
  } else {
    chip.innerHTML = '⚠️ ' + (planName || '您的') + '代碼已用完，可在上方購買補充';
  }
  chip.classList.add('show');
}

// 等 Firebase auth 準備好再查
(function waitAuth(){
  if(typeof firebase === 'undefined' || !firebase.auth){ setTimeout(waitAuth, 500); return; }
  firebase.auth().onAuthStateChanged(function(user){ if(user){ refreshQuotaChip(); refreshBalanceBar(); } });
})();

// 初始化螢幕比例選擇器（預設手機 9:16）
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', renderAspectSelector);
} else {
  renderAspectSelector();
}

// ═══ 使用者真實回饋 ═══
async function loadWallpaperFeedback(){
  var listEl = document.getElementById('wallpaperFeedbackList');
  if(!listEl) return;
  try {
    if(typeof firebase === 'undefined' || !firebase.firestore){
      listEl.innerHTML = '';
      return;
    }
    var snap = await firebase.firestore().collection('wallpaper_feedback')
      .where('status','==','approved')
      .orderBy('createdAt','desc')
      .limit(6).get();
    if(snap.empty){
      listEl.innerHTML = '<div style="text-align:center;color:rgba(248,223,165,.45);font-size:.84rem;padding:14px 8px;line-height:1.8">還沒有公開的使用者回饋。<br>第一個分享真實體驗的人，就是您 ✨</div>';
      return;
    }
    var html = '';
    snap.forEach(function(doc){
      var d = doc.data();
      var name = d.name || '匿名馥靈夥伴';
      var role = d.role ? '・' + d.role : '';
      var text = (d.text || '').replace(/[<>]/g,'');
      html += '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(248,223,165,.12);border-radius:12px;padding:14px 16px;margin-bottom:10px">'
        + '<div style="font-size:.9rem;color:rgba(244,240,235,.85);line-height:1.85;margin-bottom:8px">' + text + '</div>'
        + '<div style="font-size:.78rem;color:rgba(248,223,165,.55)">— ' + name + role + '</div>'
        + '</div>';
    });
    listEl.innerHTML = html;
  } catch(e){
    console.warn('Load feedback error:', e);
    listEl.innerHTML = '';
  }
}

window.submitWallpaperFeedback = async function(){
  var textEl = document.getElementById('feedbackText');
  var nameEl = document.getElementById('feedbackName');
  var roleEl = document.getElementById('feedbackRole');
  var resultEl = document.getElementById('feedbackResult');
  var text = (textEl.value || '').trim();
  var name = (nameEl.value || '').trim();
  var role = (roleEl.value || '').trim();

  if(!text || text.length < 10){
    resultEl.style.color = '#ff8a8a';
    resultEl.textContent = '請寫下至少 10 個字的真實感受';
    return;
  }
  if(!name){
    resultEl.style.color = '#ff8a8a';
    resultEl.textContent = '請填一個暱稱（可以是英文字母）';
    return;
  }
  resultEl.style.color = 'rgba(248,223,165,.7)';
  resultEl.textContent = '送出中⋯';
  try {
    if(typeof firebase === 'undefined' || !firebase.firestore) throw new Error('系統載入中，請稍後');
    var user = firebase.auth().currentUser;
    await firebase.firestore().collection('wallpaper_feedback').add({
      text: text,
      name: name,
      role: role,
      status: 'pending',
      uid: user ? user.uid : 'guest',
      email: user ? (user.email || '') : '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    resultEl.style.color = '#34a853';
    resultEl.textContent = '✅ 收到！審核後會顯示在頁面上，謝謝您的真實分享 💛';
    textEl.value = '';
    nameEl.value = '';
    roleEl.value = '';
  } catch(e){
    resultEl.style.color = '#ff8a8a';
    resultEl.textContent = '送出失敗：' + (e.message || '請稍後再試');
  }
};

// 載入回饋
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(loadWallpaperFeedback, 1500); });
} else {
  setTimeout(loadWallpaperFeedback, 1500);
}
