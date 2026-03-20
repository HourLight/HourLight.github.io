/**
 * 馥靈之鑰 · 二十四大命盤計算核心 (共用模組)
 * 提取自 destiny-engine.html · 不含 UI 渲染邏輯
 * © 2026 Hour Light International
 */
var S2T_MAP={'财':'財','伤':'傷','杀':'殺','临':'臨','养':'養','带':'帶','头':'頭','驿':'驛','杨':'楊','蜡':'蠟','绝':'絕','钗':'釵','钏':'釧','长':'長','炉':'爐','帝旺':'帝旺','剑锋金':'劍鋒金','涧下水':'澗下水','霹雳火':'霹靂火','复灯火':'覆燈火','大海水':'大海水','泉中水':'泉中水','天河水':'天河水','平地木':'平地木','壁上土':'壁上土','沙中金':'沙中金','山下火':'山下火','佛灯火':'覆燈火','钗环金':'釵環金'};
function s2t(str){if(!str)return str;var r=str;for(var s in S2T_MAP)r=r.split(s).join(S2T_MAP[s]);return r}

var EPH = null; // 星曆資料（延遲載入）
var EPH_LOADING = false;
var TG='甲乙丙丁戊己庚辛壬癸', DZ='子丑寅卯辰巳午未申酉戌亥';
var SIGNS=['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'];
var P_ORDER=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','node','chiron'];
var P_NAMES=['太陽','月亮','水星','金星','火星','木星','土星','天王星','海王星','冥王星','北交點','凱龍星'];

function loadEphemeris(){
  return new Promise(function(resolve, reject){
    if(EPH){resolve(EPH);return}
    if(EPH_LOADING){
      var iv=setInterval(function(){if(EPH){clearInterval(iv);resolve(EPH)}},200);
      return;
    }
    EPH_LOADING=true;
    document.getElementById('loadMsg').textContent='正在載入星曆資料庫（約4MB）...';
    fetch('js/ephemeris-1920-2060.json')
      .then(function(r){return r.json()})
      .then(function(d){EPH=d;EPH_LOADING=false;document.getElementById('loadMsg').textContent='';resolve(d)})
      .catch(function(e){EPH_LOADING=false;document.getElementById('loadMsg').textContent='星曆載入失敗，占星/人類圖/七政四餘將無法計算';reject(e)});
  });
}

// ═══ 星曆查詢工具 ═══
function ephLookup(Y,M,D,H,min){
  if(!EPH)return null;
  // 轉UTC（台灣UTC+8）
  var utcH=(H||0)-8+(min||0)/60;
  var uD=D,uM=M,uY=Y;
  if(utcH<0){utcH+=24;uD--}
  if(utcH>=24){utcH-=24;uD++}
  var key=String(uY).padStart(4,'0')+String(uM).padStart(2,'0')+String(uD).padStart(2,'0');
  var row=EPH[key];
  if(!row)return null;
  var nd=new Date(uY,uM-1,uD+1);
  var nk=String(nd.getFullYear()).padStart(4,'0')+String(nd.getMonth()+1).padStart(2,'0')+String(nd.getDate()).padStart(2,'0');
  var nr=EPH[nk];
  var frac=utcH/24;
  var result={};
  for(var i=0;i<P_ORDER.length;i++){
    var lon0=row[i], lon1=nr?nr[i]:lon0;
    // 處理跨0度情況
    var diff=lon1-lon0;
    if(diff>180)diff-=360;
    if(diff<-180)diff+=360;
    var lon=lon0+diff*frac;
    if(lon<0)lon+=360;
    if(lon>=360)lon-=360;
    var si=Math.floor(lon/30);
    var deg=lon-si*30;
    var retro=diff<0;
    result[P_ORDER[i]]={lon:lon,sign:SIGNS[si],deg:Math.floor(deg),min:Math.round((deg%1)*60),retro:retro,si:si};
  }
  // 南交點
  var nn=result.node;
  var snLon=(nn.lon+180)%360;
  var snSi=Math.floor(snLon/30);
  result.snode={lon:snLon,sign:SIGNS[snSi],deg:Math.floor(snLon-snSi*30),min:Math.round(((snLon-snSi*30)%1)*60),retro:false,si:snSi};
  // 月孛（Mean Apogee，中國傳統定義）
  // 公式：L = 263.353° + 4069.0137° × T（T=儒略世紀）
  var jd2=367*Y-Math.floor(7*(Y+Math.floor((M+9)/12))/4)+Math.floor(275*M/9)+D+1721013.5+((H||0)-8+(min||0)/60)/24;
  var T2=(jd2-2451545.0)/36525;
  var apogLon=((263.353+4069.0137*T2)%360+360)%360;
  var apogSi=Math.floor(apogLon/30);
  result.apog={lon:apogLon,sign:SIGNS[apogSi],deg:Math.floor(apogLon-apogSi*30),min:Math.round(((apogLon-apogSi*30)%1)*60)};
  return result;
}

// ═══ 占星：正確Placidus宮位系統 ═══
function calcPlacidus(lat,geo_lon,jd_val){
  var T=(jd_val-2451545.0)/36525;
  var GMST=(280.46061837+360.98564736629*(jd_val-2451545.0)+0.000387933*T*T)%360;
  if(GMST<0)GMST+=360;
  var RAMC=(GMST+geo_lon)%360;
  var eps=23.4393-0.013*T;
  var er=eps*Math.PI/180, lr=lat*Math.PI/180;
  var ramc_r=RAMC*Math.PI/180;
  // ASC
  var asc_val=(Math.atan2(-Math.cos(ramc_r),Math.sin(ramc_r)*Math.cos(er)+Math.tan(lr)*Math.sin(er))*180/Math.PI+180)%360;
  // MC
  var mc_val=(Math.atan2(Math.sin(ramc_r),Math.cos(ramc_r)*Math.cos(er))*180/Math.PI+360)%360;

  function ecl_to_dec(lon_deg){return Math.asin(Math.sin(er)*Math.sin(lon_deg*Math.PI/180))*180/Math.PI}
  function ra_dec_to_ecl(ra_d,dec_d){var ra=ra_d*Math.PI/180,dec=dec_d*Math.PI/180;return(Math.atan2(Math.sin(ra)*Math.cos(er)+Math.tan(dec)*Math.sin(er),Math.cos(ra))*180/Math.PI+360)%360}

  function placCusp(frac,above){
    var lam;
    if(above){lam=(mc_val+frac*((asc_val-mc_val+360)%360))%360}
    else{var ic=(mc_val+180)%360;lam=(asc_val+frac*((ic-asc_val+360)%360))%360}
    for(var it=0;it<100;it++){
      var dec=ecl_to_dec(lam),dec_r=dec*Math.PI/180;
      var arg=-Math.tan(lr)*Math.tan(dec_r);arg=Math.max(-1,Math.min(1,arg));
      var DSA=Math.acos(arg)*180/Math.PI;
      var target_ra;
      if(above){target_ra=(RAMC+frac*DSA)%360}
      else{target_ra=(RAMC+DSA+frac*(180-DSA))%360}
      var new_lam=ra_dec_to_ecl(target_ra,dec);
      var df=Math.abs(new_lam-lam);if(df>180)df=360-df;
      if(df<0.0001)break;
      lam=new_lam;
    }
    return lam;
  }

  var c11=placCusp(1/3,true),c12=placCusp(2/3,true);
  var c2=placCusp(1/3,false),c3=placCusp(2/3,false);
  var cusps=[asc_val,c2,c3,(mc_val+180)%360,(c11+180)%360,(c12+180)%360,(asc_val+180)%360,(c2+180)%360,(c3+180)%360,mc_val,c11,c12];
  return{asc:asc_val,mc:mc_val,cusps:cusps,RAMC:RAMC};
}

function degToSignStr(lon){var si=Math.floor(((lon%360)+360)%360/30);var d=((lon%360)+360)%360-si*30;return SIGNS[si]+Math.floor(d)+'°'+Math.round((d%1)*60)+"'"}
function planetHouse(plon,cusps){
  plon=((plon%360)+360)%360;
  for(var i=0;i<12;i++){var c1=cusps[i],c2=cusps[(i+1)%12];
    if(c2<c1){if(plon>=c1||plon<c2)return i+1}
    else{if(plon>=c1&&plon<c2)return i+1}}
  return 1;
}

// ═══ 相位計算 ═══
var ASP_TYPES=[{name:'合相',angle:0,orb:8,sym:'☌'},{name:'對分相',angle:180,orb:8,sym:'☍'},{name:'三分相',angle:120,orb:8,sym:'△'},{name:'四分相',angle:90,orb:7,sym:'□'},{name:'六分相',angle:60,orb:6,sym:'⚹'},{name:'八分之三相',angle:135,orb:2,sym:'⚼'},{name:'十二分之五相',angle:150,orb:2,sym:'⚻'}];

function calcAspects(pData){
  var keys=Object.keys(pData);
  var aspects=[];
  for(var i=0;i<keys.length;i++){
    for(var j=i+1;j<keys.length;j++){
      var d=Math.abs(pData[keys[i]].lon-pData[keys[j]].lon);
      if(d>180)d=360-d;
      for(var a=0;a<ASP_TYPES.length;a++){
        var diff=Math.abs(d-ASP_TYPES[a].angle);
        if(diff<=ASP_TYPES[a].orb){
          aspects.push({p1:keys[i],p2:keys[j],type:ASP_TYPES[a].name,sym:ASP_TYPES[a].sym,angle:ASP_TYPES[a].angle,orb:Math.round(diff*10)/10});
          break;
        }
      }
    }
  }
  return aspects;
}

// ═══ 格局偵測 ═══
function detectPatterns(aspects,pData){
  var patterns=[];
  var trines=aspects.filter(function(a){return a.type=='三分相'});
  var squares=aspects.filter(function(a){return a.type=='四分相'});
  var oppos=aspects.filter(function(a){return a.type=='對分相'});
  // 大三角：三個行星互成三分相
  for(var i=0;i<trines.length;i++){for(var j=i+1;j<trines.length;j++){
    var ps=new Set([trines[i].p1,trines[i].p2,trines[j].p1,trines[j].p2]);
    if(ps.size==3){var arr=Array.from(ps);
      var third=trines.filter(function(t){return(t.p1==arr[0]&&t.p2==arr[2])||(t.p1==arr[2]&&t.p2==arr[0])||(t.p1==arr[1]&&t.p2==arr[2])||(t.p1==arr[2]&&t.p2==arr[1])});
      if(third.length>0)patterns.push({type:'大三角',planets:arr.join('～')})
    }
  }}
  // T三角：兩個行星對分，第三個同時四分兩者
  for(var i=0;i<oppos.length;i++){var o=oppos[i];
    for(var k=0;k<squares.length;k++){var s1=squares[k];
      if(s1.p1==o.p1||s1.p2==o.p1||s1.p1==o.p2||s1.p2==o.p2){
        var apex=(s1.p1!=o.p1&&s1.p1!=o.p2)?s1.p1:s1.p2;
        var base1=(s1.p1==apex)?s1.p2:s1.p1;
        if(base1==o.p1||base1==o.p2){
          var base2=(base1==o.p1)?o.p2:o.p1;
          var hasOther=squares.filter(function(s){return(s.p1==apex&&s.p2==base2)||(s.p1==base2&&s.p2==apex)});
          if(hasOther.length>0)patterns.push({type:'T三角',planets:apex+'～'+base1+'～'+base2})
        }
      }
    }
  }
  // 去重
  var seen={};var unique=[];
  patterns.forEach(function(p){var k=p.type+p.planets.split('～').sort().join('');if(!seen[k]){seen[k]=1;unique.push(p)}});
  return unique;
}

// ═══ 統計：元素/模式/陰陽 ═══
var SIGN_ELEMENT={牡羊:'火',金牛:'土',雙子:'風',巨蟹:'水',獅子:'火',處女:'土',天秤:'風',天蠍:'水',射手:'火',摩羯:'土',水瓶:'風',雙魚:'水'};
var SIGN_MODE={牡羊:'開創',金牛:'固定',雙子:'變動',巨蟹:'開創',獅子:'固定',處女:'變動',天秤:'開創',天蠍:'固定',射手:'變動',摩羯:'開創',水瓶:'固定',雙魚:'變動'};
var SIGN_POLAR={牡羊:'陽',金牛:'陰',雙子:'陽',巨蟹:'陰',獅子:'陽',處女:'陰',天秤:'陽',天蠍:'陰',射手:'陽',摩羯:'陰',水瓶:'陽',雙魚:'陰'};

// 宮位守護星
var SIGN_RULER={牡羊:'火星',金牛:'金星',雙子:'水星',巨蟹:'月亮',獅子:'太陽',處女:'水星',天秤:'金星',天蠍:'冥王星',射手:'木星',摩羯:'土星',水瓶:'天王星',雙魚:'海王星'};

// ═══ ② 紫微斗數引擎（全展開版 已驗證）═══
var GN=['命宮','兄弟宮','夫妻宮','子女宮','財帛宮','疾厄宮','遷移宮','交友宮','事業宮','田宅宮','福德宮','父母宮'];
var SIHUA={甲:{祿:'廉貞',權:'破軍',科:'武曲',忌:'太陽'},乙:{祿:'天機',權:'天梁',科:'紫微',忌:'太陰'},丙:{祿:'天同',權:'天機',科:'文昌',忌:'廉貞'},丁:{祿:'太陰',權:'天同',科:'天機',忌:'巨門'},戊:{祿:'貪狼',權:'太陰',科:'右弼',忌:'天機'},己:{祿:'武曲',權:'貪狼',科:'天梁',忌:'文曲'},庚:{祿:'太陽',權:'武曲',科:'太陰',忌:'天同'},辛:{祿:'巨門',權:'太陽',科:'文曲',忌:'文昌'},壬:{祿:'天梁',權:'紫微',科:'左輔',忌:'武曲'},癸:{祿:'破軍',權:'巨門',科:'太陰',忌:'貪狼'}};
var BRT={紫微:['旺','廟','廟','旺','旺','得','廟','旺','廟','旺','得','旺'],天機:['廟','得','廟','旺','平','旺','廟','得','廟','旺','陷','旺'],太陽:['廟','旺','廟','旺','廟','旺','旺','得','得','陷','陷','陷'],武曲:['旺','廟','利','廟','旺','得','旺','廟','利','廟','旺','利'],天同:['平','陷','旺','陷','得','廟','陷','陷','旺','陷','得','廟'],廉貞:['平','廟','得','陷','旺','平','廟','得','廟','陷','旺','平'],天府:['廟','旺','廟','得','廟','旺','旺','得','旺','旺','廟','得'],太陰:['廟','廟','陷','陷','陷','陷','陷','旺','旺','廟','廟','廟'],貪狼:['旺','廟','平','廟','得','陷','旺','廟','平','廟','得','陷'],巨門:['旺','廟','廟','旺','得','陷','旺','廟','廟','旺','得','陷'],天相:['廟','廟','得','陷','廟','旺','廟','廟','得','陷','廟','旺'],天梁:['廟','旺','廟','陷','旺','廟','旺','廟','廟','陷','旺','廟'],七殺:['旺','廟','廟','旺','廟','得','旺','廟','廟','旺','廟','得'],破軍:['旺','廟','陷','陷','旺','陷','旺','廟','陷','陷','旺','陷']};
var ZWT={2:{1:1,2:2,3:2,4:3,5:3,6:4,7:4,8:5,9:5,10:6,11:6,12:7,13:7,14:8,15:8,16:9,17:9,18:10,19:10,20:11,21:11,22:0,23:0,24:1,25:1,26:2,27:2,28:3,29:3,30:4},3:{1:4,2:1,3:2,4:5,5:2,6:3,7:6,8:3,9:4,10:7,11:4,12:5,13:8,14:5,15:6,16:9,17:6,18:7,19:10,20:7,21:8,22:11,23:8,24:9,25:0,26:9,27:10,28:1,29:10,30:11},4:{1:11,2:4,3:1,4:2,5:0,6:5,7:2,8:3,9:1,10:6,11:3,12:4,13:2,14:7,15:4,16:5,17:3,18:8,19:5,20:6,21:4,22:9,23:6,24:7,25:5,26:10,27:7,28:8,29:6,30:11},5:{1:6,2:11,3:4,4:1,5:2,6:7,7:0,8:5,9:2,10:3,11:8,12:1,13:6,14:3,15:4,16:9,17:2,18:7,19:4,20:5,21:10,22:3,23:8,24:5,25:6,26:11,27:4,28:9,29:6,30:7},6:{1:9,2:6,3:11,4:4,5:1,6:2,7:10,8:7,9:0,10:5,11:2,12:3,13:11,14:8,15:1,16:6,17:3,18:4,19:0,20:9,21:2,22:7,23:4,24:5,25:1,26:10,27:3,28:8,29:5,30:6}};
var ZWT_B={2:{1:1,2:2,3:2,4:3,5:3,6:4,7:4,8:5,9:5,10:6,11:6,12:7,13:7,14:8,15:8,16:9,17:9,18:10,19:10,20:11,21:11,22:0,23:0,24:1,25:1,26:2,27:2,28:3,29:3,30:4},3:{1:4,2:1,3:2,4:5,5:2,6:3,7:6,8:3,9:4,10:7,11:4,12:5,13:8,14:5,15:6,16:9,17:6,18:7,19:10,20:7,21:8,22:11,23:8,24:9,25:0,26:9,27:10,28:1,29:10,30:11},4:{1:11,2:4,3:1,4:2,5:0,6:5,7:2,8:3,9:1,10:6,11:3,12:4,13:2,14:7,15:4,16:5,17:3,18:8,19:5,20:6,21:4,22:9,23:6,24:7,25:5,26:10,27:7,28:8,29:6,30:11},5:{1:6,2:11,3:4,4:1,5:2,6:7,7:0,8:5,9:2,10:3,11:8,12:1,13:6,14:3,15:4,16:9,17:2,18:7,19:4,20:5,21:10,22:3,23:8,24:5,25:6,26:11,27:4,28:9,29:6,30:7},6:{1:9,2:6,3:11,4:4,5:1,6:2,7:10,8:7,9:0,10:5,11:2,12:3,13:11,14:8,15:1,16:6,17:3,18:4,19:0,20:9,21:2,22:7,23:4,24:5,25:1,26:10,27:3,28:8,29:5,30:6}};;
var _zwt_scheme='windada';
function getZWT(ju,ld){return(_zwt_scheme==='cece'?ZWT_B:ZWT)[ju][ld]||4;}
var NY60=['海中金','海中金','爐中火','爐中火','大林木','大林木','路旁土','路旁土','劍鋒金','劍鋒金','山頭火','山頭火','澗下水','澗下水','城頭土','城頭土','白蠟金','白蠟金','楊柳木','楊柳木','泉中水','泉中水','屋上土','屋上土','霹靂火','霹靂火','松柏木','松柏木','長流水','長流水','沙中金','沙中金','山下火','山下火','平地木','平地木','壁上土','壁上土','金箔金','金箔金','覆燈火','覆燈火','天河水','天河水','大驛土','大驛土','釵環金','釵環金','桑柘木','桑柘木','大溪水','大溪水','沙中土','沙中土','天上火','天上火','石榴木','石榴木','大海水','大海水'];
var LUCUN={0:2,1:3,2:5,3:6,4:5,5:6,6:8,7:9,8:11,9:0};
var WENCHANG={0:5,1:6,2:8,3:9,4:8,5:9,6:11,7:10,8:0,9:0};
var WENQU={0:9,1:8,2:6,3:5,4:6,5:5,6:4,7:3,8:2,9:1};
var TIANKUI={0:1,1:0,2:11,3:11,4:1,5:0,6:1,7:6,8:3,9:3};
var TIANYUE={0:7,1:8,2:9,3:9,4:7,5:8,6:7,7:2,8:5,9:5};
var TIANMA_T={0:8,4:8,8:8,2:2,6:2,10:2,5:11,9:11,1:11,11:5,3:5,7:5};
var HX_B={2:1,6:1,10:1,8:2,0:2,4:2,5:3,9:3,1:3,11:9,3:9,7:9};
var LX_B={2:3,6:3,10:3,8:10,0:10,4:10,5:10,9:10,1:10,11:10,3:10,7:10};
var MINGZHU=['貪狼','巨門','祿存','文曲','廉貞','武曲','破軍','武曲','廉貞','文曲','祿存','巨門'];
var SHENZHU=['火星','天相','天梁','天同','文昌','天機','火星','天相','天梁','天同','文昌','天機'];
var CS12=['長生','沐浴','冠帶','臨官','帝旺','衰','病','死','墓','絕','胎','養'];
var CS_START={2:8,3:11,4:5,5:8,6:2};
var BS12=['博士','力士','青龍','小耗','將軍','奏書','飛廉','喜神','病符','大耗','伏兵','官府'];

function calcZiwei(lm,ld,ytI,yzI,hzI,gen){
  var ming=((lm+1-hzI)%12+24)%12;
  var shen=(lm+1+hzI)%12;
  function gTG(zi){var bm=[2,4,6,8,0,2,4,6,8,0];return(bm[ytI]+((zi-2)%12+12)%12)%10}
  var mTG=gTG(ming);
  var juN=0,juS='';
  for(var i=0;i<60;i++){
    if(i%10==mTG&&i%12==ming){
      var ny=NY60[i],wx=ny[ny.length-1];
      juN={金:4,木:3,水:2,火:6,土:5}[wx];juS=wx+['','','二','三','四','五','六'][juN]+'局';break;
    }
  }
  var zwP=getZWT(juN,ld);
  var tfP=((4-zwP)%12+12)%12;
  var pal={};for(var i=0;i<12;i++)pal[i]={ms:[],sh:[],lj:[],ls:[],lm:[],za:[],cs:'',bs:'',jl:false,xk:false};
  var ZWG={紫微:0,天機:-1,太陽:-3,武曲:-4,天同:-5,廉貞:4};
  for(var s in ZWG){var p=((zwP+ZWG[s])%12+12)%12;pal[p].ms.push({n:s,b:BRT[s][p]})}
  var TFG={天府:0,太陰:1,貪狼:2,巨門:3,天相:4,天梁:5,七殺:6,破軍:10};
  for(var s in TFG){var p=(tfP+TFG[s])%12;pal[p].ms.push({n:s,b:BRT[s][p]})}
  var ytg=TG[ytI],sh4=SIHUA[ytg];
  for(var ht in sh4){var sn=sh4[ht];for(var i=0;i<12;i++){pal[i].ms.forEach(function(s){if(s.n==sn){s.h=ht;pal[i].sh.push('化'+ht)}})}}
  var ljP={文昌:WENCHANG[ytI],文曲:WENQU[ytI],左輔:(lm+3)%12,右弼:((11-lm)%12+12)%12,天魁:TIANKUI[ytI],天鉞:TIANYUE[ytI]};
  for(var n in ljP){pal[ljP[n]].lj.push(n);for(var ht in sh4)if(sh4[ht]==n)pal[ljP[n]].sh.push('化'+ht+'('+n+')')}
  var lcP=LUCUN[ytI];pal[lcP].lm.push('祿存');
  var tmP=TIANMA_T[yzI];if(tmP!=null)pal[tmP].lm.push('天馬');
  var lsP={擎羊:(lcP+1)%12,陀羅:((lcP-1)%12+12)%12,火星:(HX_B[yzI]+hzI)%12,鈴星:(LX_B[yzI]+hzI)%12,地空:((11-hzI)%12+12)%12,地劫:(11+hzI)%12};
  for(var n in lsP)pal[lsP[n]].ls.push(n);
  // 雜曜
  var zaL=[['紅鸞',((3-yzI)%12+12)%12],['天喜',((9-yzI)%12+12)%12],['天刑',(9+yzI)%12],['天姚',(1+yzI)%12],['天哭',(6+yzI)%12],['天虛',((6-yzI)%12+12)%12],['咸池',[9,9,3,3,9,6,3,0,9,6,3,0][yzI]],['解神',(yzI+8)%12],['蜚廉',[8,9,10,5,6,7,2,3,4,11,0,1][yzI]],['破碎',[5,9,1,5,9,1,5,9,1,5,9,1][yzI]],['大耗',(yzI+6)%12],['天傷',(yzI+7)%12],['天使',(yzI+7+6)%12],['龍池',(4+yzI)%12],['鳳閣',((10-yzI)%12+12)%12]];
  zaL.forEach(function(z){pal[z[1]].za.push(z[0])});
  // 長生 博士
  var yY=ytI%2==0,gY=(yY&&gen=='F')||(!yY&&gen=='M');
  var csS=CS_START[juN]||8;
  for(var i=0;i<12;i++){
    pal[i].cs=CS12[gY?((i-csS)%12+12)%12:((csS-i)%12+12)%12];
    var bsY=(yY&&gen=='M')||(!yY&&gen=='F');
    pal[i].bs=BS12[bsY?((i-lcP)%12+12)%12:((lcP-i)%12+12)%12];
  }
  // 截路
  for(var i=0;i<12;i++){var gt=gTG(i),jl=[[8,9],[6,7],[4,5],[2,3],[0,1],[8,9],[6,7],[4,5],[2,3],[0,1]][gt];if(jl&&jl.indexOf(i)>=0)pal[i].jl=true}
  // 大限
  var dxFwd=(yY&&gen=='M')||(!yY&&gen=='F');
  var dx=[];
  for(var i=0;i<12;i++){var sa=juN+i*10,gI=dxFwd?(ming+i)%12:((ming-i)%12+12)%12;dx.push({a:sa+'-'+(sa+9),g:gI})}
  function gName(tI){return GN[((ming-tI)%12+12)%12]}
  var palaces=[];
  for(var i=0;i<12;i++){var gn=gName(i),gtI=gTG(i),gtN=TG[gtI],dxA='';dx.forEach(function(d){if(d.g==i)dxA=d.a});var gsh=SIHUA[gtN];palaces.push({idx:i,name:gn,tg:gtN,dz:DZ[i],dx:dxA,ms:pal[i].ms,sh:pal[i].sh,lj:pal[i].lj,ls:pal[i].ls,lm:pal[i].lm,za:pal[i].za,cs:pal[i].cs,bs:pal[i].bs,jl:pal[i].jl,xk:pal[i].xk,gsh:gsh})}
  return{ming:ming,shen:shen,shGN:gName(shen),juS:juS,juN:juN,mzhu:MINGZHU[ming],szhu:SHENZHU[yzI],sh4:sh4,zwP:zwP,tfP:tfP,palaces:palaces,dx:dx}
}

// ═══ ④ 人類圖（閘門表 + 通道表）═══
// 閘門表（已驗證版：起始黃經→閘門號，來自humandesign-v4-verified.py）
var GATE_TABLE=[[358.25,25],[3.875,17],[9.5,21],[15.125,51],[20.75,42],[26.375,3],[32.0,27],[37.625,24],[43.25,2],[48.875,23],[54.5,8],[60.125,20],[65.75,16],[71.375,35],[77.0,45],[82.625,12],[88.25,15],[93.875,52],[99.5,39],[105.125,53],[110.75,62],[116.375,56],[122.0,31],[127.625,33],[133.25,7],[138.875,4],[144.5,29],[150.125,59],[155.75,40],[161.375,64],[167.0,47],[172.625,6],[178.25,46],[183.875,18],[189.5,48],[195.125,57],[200.75,32],[206.375,50],[212.0,28],[217.625,44],[223.25,1],[228.875,43],[234.5,14],[240.125,34],[245.75,9],[251.375,5],[257.0,26],[262.625,11],[268.25,10],[273.875,58],[279.5,38],[285.125,54],[290.75,61],[296.375,60],[302.0,41],[307.625,19],[313.25,13],[318.875,49],[324.5,30],[330.125,55],[335.75,37],[341.375,63],[347.0,22],[352.625,36]];

function lonToGate(lon){
  lon=((lon%360)+360)%360;
  for(var i=GATE_TABLE.length-1;i>=0;i--){
    if(lon>=GATE_TABLE[i][0]){
      var gate=GATE_TABLE[i][1],dist=lon-GATE_TABLE[i][0];
      return{gate:gate,line:Math.min(Math.floor(dist/0.9375)+1,6)};
    }
  }
  var dist=lon-GATE_TABLE[63][0]+360;
  return{gate:GATE_TABLE[63][1],line:Math.min(Math.floor(dist/0.9375)+1,6)};
}

var HD_CHANNELS={
  '1-8':'靈感','2-14':'方向','3-60':'突變','4-63':'邏輯','5-15':'韻律','6-59':'親密','7-31':'Alpha',
  '9-52':'專注','10-20':'覺醒','10-34':'探索','10-57':'完美','11-56':'好奇','12-22':'開放',
  '13-33':'浪子','16-48':'才華','17-62':'接受','18-58':'批判','19-49':'綜合','20-34':'魅力',
  '20-57':'腦波','21-45':'金錢','23-43':'架構','24-61':'覺察','25-51':'發起','26-44':'投降',
  '27-50':'保存','28-38':'困頓掙扎','29-46':'發現','30-41':'夢想','32-54':'轉化',
  '34-57':'力量','35-36':'無常','37-40':'社群','39-55':'情緒','42-53':'成熟','47-64':'抽象'
};

var HD_CENTERS={
  head:[61,63,64],ajna:[47,24,4,17,43,11],throat:[62,23,56,35,12,45,33,8,31,20,16],
  g:[46,2,15,10,25,1,13,7],sacral:[5,14,29,59,9,3,42,27,34],
  spleen:[48,57,44,50,32,28,18],solar:[6,37,22,36,49,55,30],
  ego:[21,40,26,51],root:[53,60,52,19,39,41,58,38,54]
};
var HD_CENTER_NAMES={head:'頭頂',ajna:'阿賈那',throat:'喉嚨',g:'G中心',sacral:'薦骨',spleen:'脾',solar:'情緒',ego:'意志力',root:'根部'};

function calcHumanDesign(planets,Y,M,D,H,min){
  if(!planets||!EPH)return null;
  var pGates={},dGates={};
  var pNames=['太陽','地球','月亮','北交點','南交點','水星','金星','火星','木星','土星','天王星','海王星','冥王星'];
  var pKeys=['sun','earth','moon','node','snode','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  pKeys.forEach(function(k,i){
    var lon=k=='earth'?(planets.sun.lon+180)%360:k=='snode'?planets.snode.lon:planets[k]?planets[k].lon:0;
    var g=lonToGate(lon);
    pGates[pNames[i]]=g.gate+'.'+g.line;
  });
  // ── 設計水晶：精確找到太陽退回88度的日期 ──
  var targetSun=(planets.sun.lon-88+360)%360;
  var utcH=H-8+(min||0)/60; // 台灣UTC+8
  var bd=new Date(Date.UTC(Y,M-1,D));
  bd.setUTCDate(bd.getUTCDate()-89);
  var bestDiff=999,bestDate=null,bestFrac=0;
  for(var di=0;di<10;di++){
    var cd=new Date(bd.getTime()+di*86400000);
    var ck=String(cd.getUTCFullYear()).padStart(4,'0')+String(cd.getUTCMonth()+1).padStart(2,'0')+String(cd.getUTCDate()).padStart(2,'0');
    var nd2=new Date(cd.getTime()+86400000);
    var nk=String(nd2.getUTCFullYear()).padStart(4,'0')+String(nd2.getUTCMonth()+1).padStart(2,'0')+String(nd2.getUTCDate()).padStart(2,'0');
    if(!EPH[ck]||!EPH[nk])continue;
    for(var hi=0;hi<96;hi++){
      var frac=hi/96;
      var v1=EPH[ck][0],v2=EPH[nk][0];
      var dd=v2-v1;if(dd>180)dd-=360;if(dd<-180)dd+=360;
      var sun=(v1+dd*frac+360)%360;
      var df=targetSun-sun;if(df>180)df-=360;if(df<-180)df+=360;
      if(Math.abs(df)<Math.abs(bestDiff)){bestDiff=df;bestDate={ck:ck,nk:nk};bestFrac=frac}
    }
  }
  // 用精確設計日期查所有行星
  if(bestDate&&EPH[bestDate.ck]&&EPH[bestDate.nk]){
    pKeys.forEach(function(k,i){
      var pidx={'sun':0,'moon':1,'mercury':2,'venus':3,'mars':4,'jupiter':5,'saturn':6,'uranus':7,'neptune':8,'pluto':9,'node':10,'earth':-1,'snode':-2}[k];
      var lon;
      if(pidx==-1){var si=0;var v1=EPH[bestDate.ck][0],v2=EPH[bestDate.nk][0];var dd=v2-v1;if(dd>180)dd-=360;if(dd<-180)dd+=360;lon=((v1+dd*bestFrac+360)%360+180)%360}
      else if(pidx==-2){var v1=EPH[bestDate.ck][10],v2=EPH[bestDate.nk][10];var dd=v2-v1;if(dd>180)dd-=360;if(dd<-180)dd+=360;lon=((v1+dd*bestFrac+360)%360+180)%360}
      else{var v1=EPH[bestDate.ck][pidx],v2=EPH[bestDate.nk][pidx];var dd=v2-v1;if(dd>180)dd-=360;if(dd<-180)dd+=360;lon=(v1+dd*bestFrac+360)%360}
      var g=lonToGate(lon);
      dGates[pNames[i]]=g.gate+'.'+g.line;
    });
  }
  var dSunLon=targetSun;
  // 找通道
  var allGates=new Set();
  for(var k in pGates)allGates.add(parseInt(pGates[k]));
  for(var k in dGates)allGates.add(parseInt(dGates[k]));
  var channels=[];
  for(var ch in HD_CHANNELS){
    var parts=ch.split('-');
    if(allGates.has(parseInt(parts[0]))&&allGates.has(parseInt(parts[1]))){
      channels.push({gates:ch,name:HD_CHANNELS[ch]});
    }
  }
  // 已定義中心
  var defC=[],undefC=[];
  for(var c in HD_CENTERS){
    var hasChannel=false;
    channels.forEach(function(ch){
      var ps=ch.gates.split('-').map(Number);
      ps.forEach(function(g){if(HD_CENTERS[c].indexOf(g)>=0)hasChannel=true});
    });
    (hasChannel?defC:undefC).push(HD_CENTER_NAMES[c]);
  }
  // 類型判斷（v2：BFS連通性檢查）
  var _cg={};for(var _cc in HD_CENTERS)_cg[_cc]=[];
  channels.forEach(function(ch){
    var ps=ch.gates.split('-').map(Number);var inv=[];
    for(var _cc in HD_CENTERS){var found=false;ps.forEach(function(g){if(HD_CENTERS[_cc].indexOf(g)>=0)found=true});if(found&&inv.indexOf(_cc)<0)inv.push(_cc)}
    for(var ii=0;ii<inv.length;ii++)for(var jj=ii+1;jj<inv.length;jj++){
      if(_cg[inv[ii]].indexOf(inv[jj])<0)_cg[inv[ii]].push(inv[jj]);
      if(_cg[inv[jj]].indexOf(inv[ii])<0)_cg[inv[jj]].push(inv[ii]);
    }
  });
  function _m2t(){
    var MM=['薦骨','情緒','意志力','根部'];
    for(var mi=0;mi<MM.length;mi++){
      if(defC.indexOf(MM[mi])<0)continue;
      // 反查key
      var startKey='';for(var _k in HD_CENTER_NAMES)if(HD_CENTER_NAMES[_k]===MM[mi])startKey=_k;
      if(!startKey)continue;
      var vis={},q=[startKey];vis[startKey]=true;
      while(q.length>0){var cur=q.shift();if(cur==='throat')return true;(_cg[cur]||[]).forEach(function(nb){if(!vis[nb]){vis[nb]=true;q.push(nb)}})}
    }
    return false;
  }
  var type='投射者',strategy='等待邀請',authority='',nst='苦澀';
  var hasSacral=defC.indexOf('薦骨')>=0;
  var _hasM2T=_m2t();
  if(hasSacral&&_hasM2T){type='顯示生產者';strategy='等待回應（聽肚子），然後告知';nst='挫敗/憤怒'}
  else if(hasSacral){type='生產者';strategy='等待回應（不主動發起，等事情來找你，用肚子回答）';nst='挫敗'}
  else if(!hasSacral&&_hasM2T){type='顯示者';strategy='告知';nst='憤怒'}
  else if(defC.length<=1){type='反映者';strategy='等待月循環';nst='失望'}
  // 內在權威
  if(defC.indexOf('情緒')>=0)authority='情緒權威';
  else if(defC.indexOf('薦骨')>=0)authority='薦骨權威（聽肚子的第一反應：嗯哼=YES，嗯⋯=NO）';
  else if(defC.indexOf('脾')>=0)authority='脾權威';
  else if(defC.indexOf('意志力')>=0)authority='意志力權威';
  else if(defC.indexOf('G中心')>=0)authority='G中心權威';
  else authority='外在權威';
  // 人生角色
  var sunG=lonToGate(planets.sun.lon);
  var dSunG=lonToGate(dSunLon);
  var profile=sunG.line+'/'+dSunG.line;
  return{type:type,strategy:strategy,authority:authority,profile:profile,nst:nst,channels:channels,defC:defC,undefC:undefC,pGates:pGates,dGates:dGates};
}

// ═══ 袁天罡稱骨算命 ═══
var BONE_YEAR={'甲子':12,'乙丑':9,'丙寅':6,'丁卯':7,'戊辰':12,'己巳':5,'庚午':9,'辛未':8,'壬申':7,'癸酉':8,'甲戌':15,'乙亥':9,'丙子':16,'丁丑':8,'戊寅':8,'己卯':19,'庚辰':12,'辛巳':6,'壬午':8,'癸未':7,'甲申':5,'乙酉':15,'丙戌':6,'丁亥':16,'戊子':15,'己丑':7,'庚寅':9,'辛卯':12,'壬辰':10,'癸巳':7,'甲午':15,'乙未':6,'丙申':5,'丁酉':14,'戊戌':14,'己亥':9,'庚子':7,'辛丑':7,'壬寅':9,'癸卯':12,'甲辰':8,'乙巳':7,'丙午':13,'丁未':5,'戊申':14,'己酉':5,'庚戌':9,'辛亥':17,'壬子':5,'癸丑':7,'甲寅':12,'乙卯':8,'丙辰':8,'丁巳':6,'戊午':19,'己未':6,'庚申':8,'辛酉':16,'壬戌':10,'癸亥':7};
var BONE_MONTH={1:6,2:7,3:18,4:9,5:5,6:16,7:9,8:15,9:18,10:8,11:9,12:5};
var BONE_DAY={1:5,2:10,3:8,4:15,5:16,6:15,7:8,8:16,9:8,10:16,11:9,12:17,13:8,14:17,15:10,16:8,17:9,18:18,19:5,20:15,21:10,22:9,23:8,24:9,25:15,26:18,27:7,28:8,29:16,30:6};
var BONE_HOUR={0:16,1:6,2:7,3:10,4:9,5:16,6:10,7:8,8:8,9:9,10:9,11:6};
var BONE_TEXT={20:'此命勞碌一生窮，每逢困難事重重',21:'短命非業謂極度挑戰，平生災難事重重',22:'身寒骨冷苦伶仃，此命推來行乞人',23:'此命推來骨肉輕，求謀做事事難成',24:'此命推來福祿無，門庭困苦總難榮',25:'此命推來祖業微，門庭營度似稀奇',26:'平生衣祿苦中求，獨自營謀事不休',27:'一生做事少商量，難靠祖宗作主張',28:'一生行事似飄蓬，祖宗產業在夢中',29:'初年運限未曾亨，縱有功名在後成',30:'勞勞碌碌苦中求，東奔西走何日休',31:'忙忙碌碌苦中求，何日雲開見日頭',32:'初年運蹇事難謀，漸有財源如水流',33:'早年做事事難成，百計徒勞枉費心',34:'此命推來自不同，為人能幹異凡庸',35:'生平福量不周全，祖業根基覺少傳',36:'不須勞碌過平生，獨自成家福不輕',37:'此命般般事不成，弟兄少力自孤成',38:'一身骨肉最清高，早入簧門姓氏標',39:'此命終身運不通，勞勞作事盡皆空',40:'平生衣祿是綿長，件件心中自主張',41:'此命推來事不同，為人能幹異凡庸',42:'此命推來旺末年，妻榮子貴自怡然',43:'為人心性最聰明，做事軒昂近貴人',44:'來事由天莫苦求，須知福祿勝前途',45:'福中取貴格求真，明敏才華志自伸',46:'東西南北盡皆通，出姓移名更覺隆',47:'此命推來旺末年，妻榮子貴自怡然',48:'初年運道未曾亨，若是蹉跎再不興',49:'此命推來福不輕，自成自立顯門庭',50:'為利為名終日勞，中年福祿也多遭',51:'一世榮華事事通，不須勞碌自亨通',52:'一世榮華事事能，不須勞思自然寧',53:'此格推來氣象真，興家發達在其中',54:'此命推來禮義通，一生福祿用無窮',55:'走馬揚鞭爭名利，少年做事費籌論',60:'一世榮華事事宜，不須勞碌自然宜',70:'此命推來福不輕，不須愁慮苦勞心',71:'此命生成大不同，公侯卿相在其中'};

function calcBone(yearGZ,lunarMonth,lunarDay,hourIdx){
  var t=(BONE_YEAR[yearGZ]||0)+(BONE_MONTH[lunarMonth]||0)+(BONE_DAY[lunarDay]||0)+(BONE_HOUR[hourIdx]||0);
  var txt=BONE_TEXT[t]||BONE_TEXT[Math.floor(t/10)*10]||'查無對應批註';
  return{total:t,text:Math.floor(t/10)+'兩'+(t%10)+'錢',poem:txt,
    detail:{year:BONE_YEAR[yearGZ]||0,month:BONE_MONTH[lunarMonth]||0,day:BONE_DAY[lunarDay]||0,hour:BONE_HOUR[hourIdx]||0}};
}

// ═══ ⑤ 七政四餘（校準版）═══
// 28宿黃經起始度（1976年epoch校準，回歸黃經制）
var XIU28=[
['壁','水',8.812],['奎','木',19.865],['婁','金',33.255],['胃','土',46.588],
['昴','日',59.295],['畢','月',68.122],['參','水',81.465],['觜','火',82.875],
['井','木',94.944],['鬼','金',128.275],['柳','土',138.115],['星','日',146.695],
['張','月',156.465],['翼','火',169.365],['軫','水',191.435],['角','木',203.125],
['亢','金',213.365],['氐','土',224.385],['房','日',241.595],['心','月',249.055],
['尾','火',255.095],['箕','水',270.065],['斗','木',279.835],['牛','金',293.515],
['女','土',311.392],['虛','日',322.695],['危','月',334.715],['室','火',352.765]
];
XIU28.sort(function(a,b){return a[2]-b[2]});

// 十二宮映射（回歸黃經→地支宮，中國定義）
var GONG12={'子':300,'丑':270,'寅':240,'卯':210,'辰':180,'巳':150,'午':120,'未':90,'申':60,'酉':30,'戌':0,'亥':330};
var GONG_ORDER_QZ=['戌','酉','申','未','午','巳','辰','卯','寅','丑','子','亥'];

function eclToXiu(lon){
  lon=((lon%360)+360)%360;
  for(var i=XIU28.length-1;i>=0;i--){
    if(lon>=XIU28[i][2]){
      return{name:XIU28[i][0]+XIU28[i][1],deg:lon-XIU28[i][2]};
    }
  }
  var last=XIU28[XIU28.length-1];
  return{name:last[0]+last[1],deg:(lon-last[2]+360)%360};
}

function eclToGong(lon){
  lon=((lon%360)+360)%360;
  var idx=Math.floor(lon/30);
  return{name:GONG_ORDER_QZ[idx]+'宮',deg:lon-idx*30};
}

function fmtDeg(d){return Math.floor(d)+'°'+Math.round((d%1)*60).toString().padStart(2,'0')+"'"}

function calcQizheng(planets,Y,M,D){
  if(!planets)return null;
  var result={bodies:[],relations:{}};
  
  // 七政（直接用回歸黃經）
  var QZ_MAP=[['日','sun'],['月','moon'],['水','mercury'],['金','venus'],['火','mars'],['木','jupiter'],['土','saturn']];
  QZ_MAP.forEach(function(m){
    var p=planets[m[1]];if(!p)return;
    var xiu=eclToXiu(p.lon);
    var gong=eclToGong(p.lon);
    result.bodies.push({name:m[0],xiu:xiu.name,xiuDeg:xiu.deg,gong:gong.name,gongDeg:gong.deg,lon:p.lon});
  });

  // 四餘（中國定義：羅=南交，計=北交）
  var northNode=planets.node?planets.node.lon:0;
  var southNode=(northNode+180)%360;
  
  // 羅睺（南交）
  var rahuXiu=eclToXiu(southNode),rahuGong=eclToGong(southNode);
  result.bodies.push({name:'羅',xiu:rahuXiu.name,xiuDeg:rahuXiu.deg,gong:rahuGong.name,gongDeg:rahuGong.deg,lon:southNode});
  
  // 計都（北交）
  var ketuXiu=eclToXiu(northNode),ketuGong=eclToGong(northNode);
  result.bodies.push({name:'計',xiu:ketuXiu.name,xiuDeg:ketuXiu.deg,gong:ketuGong.name,gongDeg:ketuGong.deg,lon:northNode});

  // 月孛（月球遠地點）
  if(planets.apog){
    var beiXiu=eclToXiu(planets.apog.lon),beiGong=eclToGong(planets.apog.lon);
    result.bodies.push({name:'孛',xiu:beiXiu.name,xiuDeg:beiXiu.deg,gong:beiGong.name,gongDeg:beiGong.deg,lon:planets.apog.lon});
  }


  // 紫氣（28年週期虛星）
  // 基準：1976/2/5 UTC=242.067°，每年移動12°51'(3/7)" ≈ 12.857°
  var ZIQI_BASE_LON=242.067,ZIQI_BASE_Y=1976.1,ZIQI_YEARLY=12.857142857;
  var yearsFromBase=Y-1976+(M-2)/12+(D-5)/365.25;
  var ziqiLon=((ZIQI_BASE_LON+yearsFromBase*ZIQI_YEARLY)%360+360)%360;
  var ziqiXiu=eclToXiu(ziqiLon),ziqiGong=eclToGong(ziqiLon);
  result.bodies.push({name:'紫',xiu:ziqiXiu.name,xiuDeg:ziqiXiu.deg,gong:ziqiGong.name,gongDeg:ziqiGong.deg,lon:ziqiLon});

  return result;
}

// ═══ ⑥ 瑪雅曆法（增強版：修正Oracle+13月亮曆）═══
var M_SEAL=['紅龍','白風','藍夜','黃種子','紅蛇','白世界橋','藍手','黃星星','紅月','白狗','藍猴','黃人','紅天行者','白巫師','藍鷹','黃戰士','紅地球','白鏡','藍風暴','黃太陽'];
var M_TONE=['磁性的','月亮的','電力的','自我存在的','超頻的','韻律的','共鳴的','銀河的','太陽的','行星的','光譜的','水晶的','宇宙的'];
var M_TONE_EN=['Magnetic','Lunar','Electric','Self-Existing','Overtone','Rhythmic','Resonant','Galactic','Solar','Planetary','Spectral','Crystal','Cosmic'];
var M_SEAL_EN=['Red Dragon','White Wind','Blue Night','Yellow Seed','Red Serpent','White Worldbridger','Blue Hand','Yellow Star','Red Moon','White Dog','Blue Monkey','Yellow Human','Red Skywalker','White Wizard','Blue Eagle','Yellow Warrior','Red Earth','White Mirror','Blue Storm','Yellow Sun'];
var M_PLN=['海王星','天王星','地球','冥王星','火星','冥王星','地球','金星','水星','水星','金星','地球','火星','木星','木星','土星','天王星','海王星','冥王星','太陽'];
var M_FAM={0:'極性',1:'極性',4:'極性',7:'極性',8:'信號',9:'信號',12:'極性',13:'極性',14:'信號',17:'極性',18:'信號',19:'極性',2:'通道',3:'通道',5:'通道',6:'通道',10:'通道',11:'通道',15:'通道',16:'通道'};
var MOON13=['磁性蝙蝠月','月亮蠍月','電力鹿月','自我存在貓頭鷹月','超頻孔雀月','韻律蜥蜴月','共鳴猴月','銀河鷹月','太陽美洲豹月','行星狗月','光譜蛇月','水晶兔月','宇宙海龜月'];

function calcMaya(Y,M,D){
  var base=new Date(1993,6,26),tgt=new Date(Y,M-1,D);
  var diff=Math.floor((tgt-base)/86400000);
  function cntLeap(y1,m1,d1,y2,m2,d2){var c=0,d=new Date(y1,m1-1,d1),e=new Date(y2,m2-1,d2);while(d<e){if(d.getMonth()==1&&d.getDate()==29)c++;d.setDate(d.getDate()+1)}return c}
  var leaps=diff>=0?cntLeap(1993,7,26,Y,M,D):-cntLeap(Y,M,D,1993,7,26);
  var disp=diff-leaps;
  var kin=(((144-1+disp)%260)+260)%260+1;
  var tone=((kin-1)%13)+1;
  var seal=(kin-1)%20;

  // ═══ 修正版 Oracle 五大神諭 ═══
  // Analog/Support: pairs sum to 17
  var analogSI=(17-seal+20)%20;
  // Antipode/Challenge: +10
  var antiSI=(seal+10)%20;
  // Occult/Hidden: from 261-KIN
  var occK=261-kin;if(occK<=0)occK+=260;
  var occSeal=(occK-1)%20;
  // Guide: same color, index = (tone%5==0?4:tone%5-1)
  var sCI=[];for(var s=0;s<20;s++)if(s%4==seal%4)sCI.push(s);
  var gIdx=tone%5==0?4:tone%5-1;
  // tone 1,6,11 = self-guided
  if(tone%5==1)gIdx=sCI.indexOf(seal);
  var guideSI=sCI[gIdx];

  // 波符
  var ws=Math.floor((kin-1)/13)+1,wsDay=((kin-1)%13)+1;
  var wsSealIdx=((ws-1)*13)%20;

  // 13月亮曆（7/26起算，NS epoch = 1935）
  var yearStart=new Date(Y,6,26);
  if(tgt<yearStart)yearStart=new Date(Y-1,6,26);
  var dayOfYear=Math.floor((tgt-yearStart)/86400000);
  var nsYear=yearStart.getFullYear()-1935;
  var nsMoon,nsDay,nsWeek;
  if(dayOfYear>=364){nsMoon=0;nsDay=0;nsWeek=0}
  else{nsMoon=Math.floor(dayOfYear/28)+1;nsDay=(dayOfYear%28)+1;nsWeek=Math.ceil(nsDay/7)}

  // PSI & Inner Goddess（需260天查表，此處用近似公式+AI指令補完）
  var psiKin=((kin+168-1)%260)+1;
  var psiTone=((psiKin-1)%13)+1;var psiSeal=(psiKin-1)%20;

  // 內在女神力 = 五力合一KIN（analog tone + 合一seal index）
  var igSeal=((seal+analogSI+guideSI+antiSI+((occK-1)%20))%20);
  var igKin=((igSeal)*13+tone);igKin=((igKin-1)%260)+1;
  var igTone=((igKin-1)%13)+1;var igSealIdx=(igKin-1)%20;

  // ═══ 13月亮曆增強 ═══
  // 週內第幾天 + 等離子
  var PLASMA=['Dali','Seli','Gamma','Kali','Alpha','Limi','Silio'];
  var CHAKRA=['頂輪','根輪','眉心輪','薦骨輪','喉輪','胃輪','心輪'];
  var nsDayOfWeek=nsDay>0?((nsDay-1)%7):0;
  var nsPlasma=PLASMA[nsDayOfWeek];
  var nsChakra=CHAKRA[nsDayOfWeek];

  // 週的顏色+階段
  var WEEK_CLR=['紅色啟動週','白色精煉週','藍色轉化週','黃色成熟週'];
  var nsWeekName=nsWeek>0?WEEK_CLR[nsWeek-1]:'';

  // 年度圖騰（13月亮曆年=7/26開始，每年KIN不同）
  // 年份bearer: 7/26那天的KIN的seal name
  var yearBase=new Date(Y,6,26);
  if(tgt<yearBase)yearBase=new Date(Y-1,6,26);
  var yDiff=Math.floor((yearBase-base)/86400000);
  var yLeaps=yDiff>=0?cntLeap(1993,7,26,yearBase.getFullYear(),7,26):-cntLeap(yearBase.getFullYear(),7,26,1993,7,26);
  var yDisp=yDiff-yLeaps;
  var yKin=(((144-1+yDisp)%260)+260)%260+1;
  var yTone=((yKin-1)%13)+1;
  var ySeal=(yKin-1)%20;
  var yearName=M_TONE[yTone-1].replace('的','')+M_SEAL[ySeal]+'年';

  // 力量動物
  var POWER_ANIMAL=['蝙蝠','蠍','鹿','貓頭鷹','孔雀','蜥蜴','猴','鷹','美洲豹','狗','蛇','兔','海龜'];
  var nsPowerAnimal=POWER_ANIMAL[tone-1]||'鳳凰';

  // KIN加減法（+與-的對稱）
  var kinSum=((kin-1)+(261-kin)-1)%260+1;
  var kinPlus='+'+(1+9+7+6+0+2+0+5)+'/'+(rdP(1+9+7+6+0+2+0+5))+'('+rdP(rdP(1+9+7+6+0+2+0+5))+')';
  // 正確算法：生日數字加總
  var bdDigits=String(Y)+String(M).padStart(2,'0')+String(D).padStart(2,'0');var bdSum=0,zeroCount=0;bdDigits.split('').forEach(function(d){bdSum+=+d;if(d=='0')zeroCount++});
  var kinPlusStr='+'+bdSum+'/'+rdP(bdSum)+'('+zeroCount+')';
  var kinMinusStr='-'+bdSum+'/'+rdP(bdSum)+'('+zeroCount+')';

  return{kin:kin,tone:tone,toneN:M_TONE[tone-1],toneEN:M_TONE_EN[tone-1],
    seal:seal,sealN:M_SEAL[seal],sealEN:M_SEAL_EN[seal],
    guide:M_SEAL[guideSI],analog:M_SEAL[analogSI],anti:M_SEAL[antiSI],
    occK:occK,occSeal:M_SEAL[occSeal],
    ws:ws,wsDay:wsDay,wsSeal:M_SEAL[wsSealIdx],planet:M_PLN[seal],family:M_FAM[seal]||'',
    psi:{kin:psiKin,tone:M_TONE[psiTone-1],seal:M_SEAL[psiSeal]},
    innerGoddess:{kin:igKin,tone:M_TONE[igTone-1],seal:M_SEAL[igSealIdx]},
    ns:{year:nsYear,moon:nsMoon,day:nsDay,week:nsWeek,dayOfWeek:nsDayOfWeek+1,plasma:nsPlasma,chakra:nsChakra,weekName:nsWeekName,moonName:nsMoon>0?MOON13[nsMoon-1]:'時間外之日',yearName:yearName,powerAnimal:nsPowerAnimal,kinPlus:kinPlusStr,kinMinus:kinMinusStr},
    nsCoord:'NS 1.'+nsYear+'.'+nsMoon+'.'+nsDay
  };
}

// ═══ ⑦ 生命靈數（商用完整版：大師數+九宮格+禮物挑戰+時辰經絡）═══
// rd = 保留大師數(11/22/33)  rdP = 全部化簡到個位
function rd(n){n=Math.abs(n);if(n==11||n==22||n==33)return n;while(n>9){var s=0;String(n).split('').forEach(function(d){s+=+d});n=s;if(n==11||n==22||n==33)return n}return n}
function rdP(n){n=Math.abs(n);while(n>9){var s=0;String(n).split('').forEach(function(d){s+=+d});n=s}return n}

var NUM_GIFT={1:'開創與獨立',2:'配合與感受',3:'表達與創造',4:'秩序與安全',5:'自由與體驗',6:'責任與愛護',7:'真理與深度',8:'權威與豐盛',9:'大愛與放下',0:'潛能待開發',11:'直覺與啟發的傳訊者',22:'把夢想變現實的建築師',33:'無私奉獻的終極導師'};

var MISS_TXT={
  1:'習慣聽別人的，找不到自己的主場。功課：練習說「我要什麼」',
  2:'太過獨立或遲鈍，接不住別人的情緒。功課：先停三秒再開口',
  3:'心裡想了一百句，說出來變一句。功課：允許自己表達「不完美」的想法',
  4:'極度討厭被綁住，容易缺乏安全感。功課：建立最微小的日常微習慣',
  5:'害怕改變，待在舒適圈會慢慢窒息。功課：每月做一件從沒做過的小事',
  6:'很難毫無顧忌地去愛，總怕自己給得不夠。功課：先看見自己的付出',
  7:'懷疑論者，很難真心相信別人。功課：把「可是」換成「也有可能喔」',
  8:'對金錢或權力有隱形匱乏感。功課：練習管理小額金錢，建立豐盛意識',
  9:'對別人的苦難無感，或者過度冷漠。功課：給出一個沒有目的的微笑'
};

function calcNum(Y,M,D,H){
  var mS=rd(M),dS=rd(D),yS=rd(Y);
  var life=rd(Y+M+D);
  var talent=rd(D); // 天賦數＝出生日化簡

  // 九宮格
  var digits=String(Y)+String(M).padStart(2,'0')+String(D).padStart(2,'0');
  var grid={};for(var i=0;i<=9;i++)grid[i]=0;
  digits.split('').forEach(function(d){grid[+d]++});
  var innateArr=digits.split('').map(Number).filter(function(n){return n>0}).sort();
  var innate='0'.repeat(grid[0])+innateArr.join('');
  var missing=[];for(var i=1;i<=9;i++)if(grid[i]==0)missing.push(i);

  // 禮物（往上加，保留大師數）
  var g1=rd(rdP(mS)+rdP(dS)),g2=rd(rdP(dS)+rdP(yS)),g3=rd(rdP(g1)+rdP(g2)),g4=rd(rdP(mS)+rdP(yS));

  // 挑戰（往下減，不保留大師數）
  var c1=Math.abs(rdP(mS)-rdP(dS)),c2=Math.abs(rdP(dS)-rdP(yS)),c3=Math.abs(c1-c2),c4=Math.abs(rdP(mS)-rdP(yS));

  // 階段年齡（36 - 生命數化簡到單數）
  var lifeSimple=rdP(life);
  var p1end=36-lifeSimple;
  var stages=[
    {name:'第一階段（種子期）',age:'0～'+p1end+'歲',gift:g1,challenge:c1},
    {name:'第二階段（扎根期）',age:(p1end+1)+'～'+(p1end+9)+'歲',gift:g2,challenge:c2},
    {name:'第三階段（開花期）',age:(p1end+10)+'～'+(p1end+18)+'歲',gift:g3,challenge:c3},
    {name:'第四階段（結果期）',age:(p1end+19)+'歲以後',gift:g4,challenge:c4}
  ];

  // 流年
  var py2026=rd(rdP(2+0+2+6)+M+D);

  // 時辰經絡
  var scIdx=(H==null||H==undefined)?-1:(H==23?0:Math.floor((H+1)/2)%12);
  var MERIDIAN=['膽經（子時23-1點）','肝經（丑時1-3點）','肺經（寅時3-5點）','大腸經（卯時5-7點）','胃經（辰時7-9點）','脾經（巳時9-11點）','心經（午時11-13點）','小腸經（未時13-15點）','膀胱經（申時15-17點）','腎經（酉時17-19點）','心包經（戌時19-21點）','三焦經（亥時21-23點）'];

  return{life:life,talent:talent,yS:yS,mS:mS,dS:dS,
    grid:grid,innate:innate,missing:missing,
    stages:stages,py:py2026,
    gifts:{g1:g1,g2:g2,g3:g3,g4:g4},
    challenges:{c1:c1,c2:c2,c3:c3,c4:c4},
    meridian:scIdx>=0?MERIDIAN[scIdx]:'未提供時辰',scIdx:scIdx};
}

// ═══ ⑧ 馥靈秘碼 ═══
function calcFL(lm,ld,sY,sM,sD,H){
  var scM=[1,2,3,4,5,6,7,8,9,1,11,3];
  var scI=H==23?0:Math.floor((H+1)/2)%12;
  var scN=scM[scI];
  var hV=rd(lm+ld),oV=rd(Array.from(String(sY)+String(sM)+String(sD)).reduce(function(a,b){return a+(+b)},0)),uV=rd(scN),rV=rd(hV+oV+uV);
  var lV=rd(lm),iV=rd(scN),gV=rd(rd(sY)),hLV=rd(ld),tV=rd(lV+iV+gV+hLV);
  // ── 12宮正確公式（馥靈秘碼系統v5.1）──
  // 1宮=H數 | 2宮=年末兩位加總 | 3宮=西曆月(rd) | 4宮=西曆日(rd)
  // 5宮=農曆月(rd) | 6宮=農曆日(rd) | 7宮=O數
  // 8宮=G數 | 9宮=西曆年百位數 | 10宮=U數 | 11宮=T數 | 12宮=R數
  var pal2=rdP(Math.floor(sY/10)%10+sY%10); // 年末兩位加總全化簡
  var pal9=Math.floor(sY/100)%10; // 百位數直取
  var palVals=[hV,pal2,rd(sM),rd(sD),rd(lm),hLV,oV,gV,pal9,uV,tV,rV];
  var palN=['1宮_勇氣殿','2宮_力量廳','3宮_告別苑','4宮_淨化室','5宮_消化閣','6宮_信任殿','7宮_心門宮','8宮_明辨廳','9宮_卸載苑','10宮_志氣殿','11宮_敞開閣','12宮_平衡室'];
  var pals={};palN.forEach(function(n,idx){pals[n]=palVals[idx]});
  return{H:{H:hV,O:oV,U:uV,R:rV},L:{L:lV,I:iV,G:gV,H:hLV,T:tV},pals:pals};
}

// ═══ ⑨ 生命密碼（日日月月年年年年）═══
function calcTri(Y,M,D){
  // 正確順序：日日月月年年年年（不是YYYYMMDD！）
  var dd=String(D).padStart(2,'0');
  var mm=String(M).padStart(2,'0');
  var yy=String(Y).padStart(4,'0');
  var ds=dd+mm+yy;
  var A=+ds[0],B=+ds[1],C=+ds[2],D2=+ds[3],E=+ds[4],F=+ds[5],G=+ds[6],H=+ds[7];
  // 此系統不保留大師數，全部化簡到1-9
  var rr=rdP; // 用不保留大師數的版本
  var I=rr(A+B),J=rr(C+D2),K=rr(E+F),L=rr(G+H);
  if(G===0&&H===0)L=5; // 世紀年(1900/2000/2100) 0+0=5
  var M2=rr(I+J),N=rr(K+L),O=rr(M2+N);
  var T=rr(I+M2),S=rr(J+M2),U=rr(T+S);
  var V=rr(K+N),W=rr(L+N),X=rr(V+W);
  var P=rr(M2+O),Q=rr(N+O),R=rr(P+Q);
  return{I:I,J:J,K:K,L:L,M:M2,N:N,O:O,T:T,S:S,U:U,V:V,W:W,X:X,P:P,Q:Q,R:R,sub:rr(I+L+O),ext:rr(U+R+X),inner:rr(O+M2+N)};
}

// ═══ 三角形輔助：流年 / 五行 / 特殊密碼 ═══
function calcFlowYear(M,D,yr){var s=0;String(M).split('').forEach(function(d){s+=+d});String(D).split('').forEach(function(d){s+=+d});String(yr).split('').forEach(function(d){s+=+d});return rdP(s)}
var WUXING={1:'金',2:'水',3:'火',4:'木',5:'土',6:'金',7:'水',8:'火',9:'木'};
function getWuxing(n){return WUXING[rdP(n)]||''}
var FLOW_KW={1:'播種開新局',2:'合作鞏固關係',3:'表達創意輸出',4:'打地基穩固',5:'變動體驗冒險',6:'家庭責任承擔',7:'內省深化學習',8:'收割成就擴張',9:'放手完結清理'};
// 常見特殊聯合密碼標籤
var SPECIAL_CODE={
'123':'演講碼／講師碼：語言魅力強，能說服群眾並快速變現','132':'演講碼變體：先行動再溝通，適合實戰型講師',
'156':'驛馬創富碼：移動產生價值，跨區域發展財富','165':'驛馬碼變體：方向明確後快速行動開拓','516':'驛馬碼：自由驅動的跨域財富擴張',
'235':'洗腦專家碼／夢想家：語言感染力極強，能短時間改變他人認知','325':'洗腦碼變體：行動力帶動說服力',
'246':'結構化銷售碼：系統性建構客戶關係，穩定高轉化','426':'銷售高手碼：規劃先行的服務型銷售王者',
'281':'銷售冠軍碼（批發型）：極強抗壓＋解決問題能力，適合大宗商業','821':'銷售冠軍碼（草根型）：白手起家，做事有手腕但感情多變',
'369':'投資家碼／以錢生錢：對商業氣氛極度敏感，好惡分明','639':'資本運作碼：財富感知＋快速行動＋宏觀遠見',
'573':'貴人碼＋義氣碼：身邊常有高淨值人士，極重朋友義氣',
'696':'點石成金碼：能將平凡資源轉化為驚人利潤','966':'願景整合碼：依靠宏大社會願景創造財富',
'729':'桃花碼：天生異性緣強，女性貴人旺事業','279':'桃花碼變體：溝通力帶動人際吸引力',
'483':'專業碼／老二命：專業深厚但需明師指引方向，婚姻需磨合','843':'高壓專業碼：責任重壓下的專業執行者',
'887':'泰山壓頂碼：責任大壓力大情緒大，建議晚婚','898':'窮忙焦慮碼：忙碌卻找不到突破口，注意健康',
'977':'高管碼：人緣好位高權重，但需防身邊小人','988':'壓力創富碼：靠正財一分耕耘一分收穫',
'999':'天堂地獄碼：機會極多但最忌貪心，堅持一個方向可獲巨大回報',
'213':'溫和領袖碼：以柔克剛的高EQ統御術','393':'心靈手巧碼：工匠精神但感情易鑽牛角尖'
};
function getSpecialLabel(a,b,c){var k1=''+a+b+c;var k2=''+a+c+b;var k3=''+b+a+c;return SPECIAL_CODE[k1]||SPECIAL_CODE[k2]||SPECIAL_CODE[k3]||''}


// ═══════════════════════════════════════
// 二十四大引擎 新增系統 ⑩-㉔ 計算函數
// © 2026 Hour Light International
// ═══════════════════════════════════════

// ══════ 威妥瑪拼音轉換（常見3000+字）══════
var WG_MAP=(function(){var m={};
'王Wang,李Lee,張Chang,劉Liu,陳Chen,楊Yang,黃Huang,趙Chao,吳Wu,周Chou,徐Hsu,孫Sun,馬Ma,朱Chu,胡Hu,郭Kuo,何Ho,林Lin,羅Lo,梁Liang,宋Sung,鄭Cheng,謝Hsieh,韓Han,唐Tang,馮Feng,于Yu,董Tung,蕭Hsiao,程Cheng,曹Tsao,袁Yuan,鄧Teng,許Hsu,傅Fu,沈Shen,曾Tseng,彭Peng,呂Lu,蘇Su,盧Lu,蔣Chiang,蔡Tsai,賈Chia,丁Ting,魏Wei,薛Hsueh,葉Yeh,余Yu,潘Pan,杜Tu,戴Tai,夏Hsia,鐘Chung,汪Wang,田Tien,任Jen,姜Chiang,范Fan,方Fang,石Shih,姚Yao,譚Tan,廖Liao,鄒Tsou,熊Hsiung,金Chin,陸Lu,孔Kung,白Pai,崔Tsui,康Kang,毛Mao,邱Chiu,秦Chin,江Chiang,史Shih,侯Hou,邵Shao,孟Meng,龍Lung,萬Wan,段Tuan,雷Lei,錢Chien,湯Tang,尹Yin,黎Li,易Yi,常Chang,武Wu,喬Chiao,賀Ho,賴Lai,龔Kung,文Wen,殷Yin,施Shih,陶Tao,洪Hung,安An,顏Yen,倪Ni,嚴Yen,溫Wen,季Chi,俞Yu,章Chang,葛Ko,韋Wei,申Shen,尤Yu,柳Liu,路Lu,岳Yueh,梅Mei,莊Chuang,辛Hsin,管Kuan,祝Chu,左Tso,谷Ku,時Shih,舒Shu,卜Pu,詹Chan,關Kuan,苗Miao,凌Ling,費Fei,盛Sheng,童Tung,歐Ou,席Hsi,衛Wei,查Cha,花Hua,穆Mu,蘭Lan,包Pao,司Ssu,柏Po,寧Ning,郎Lang,區Ou,翁Weng'.split(',').forEach(function(p){m[p[0]]=p.substring(1)});
'逸Yi,君Chun,瑋Wei,雅Ya,琪Chi,婷Ting,芳Fang,惠Hui,玲Ling,珍Chen,美Mei,麗Li,華Hua,英Ying,秀Hsiu,淑Shu,貞Chen,慧Hui,娟Chuan,雲Yun,萍Ping,敏Min,儀Yi,如Ju,佳Chia,怡Yi,雯Wen,妍Yen,欣Hsin,琳Lin,靜Ching,潔Chieh,瑩Ying,芬Fen,蓉Jung,嘉Chia,茹Ju,倩Chien,思Ssu,詩Shih,涵Han,璇Hsuan,瑜Yu,彤Tung,瑤Yao,薇Wei,萱Hsuan,韻Yun,宜Yi,真Chen,柔Jou,穎Ying,心Hsin,羽Yu,菲Fei,晴Ching,紫Tzu,若Jo,馨Hsin,妮Ni,蕾Lei,翠Tsui,蘭Lan'.split(',').forEach(function(p){m[p[0]]=p.substring(1)});
'文Wen,明Ming,志Chih,偉Wei,建Chien,國Kuo,東Tung,海Hai,平Ping,強Chiang,軍Chun,正Cheng,德Te,生Sheng,忠Chung,慶Ching,輝Hui,勇Yung,誠Cheng,達Ta,學Hsueh,祥Hsiang,勝Sheng,天Tien,宏Hung,傑Chieh,仁Jen,義Yi,禮Li,智Chih,信Hsin,榮Jung,昌Chang,興Hsing,振Chen,清Ching,福Fu,喜Hsi,寶Pao,吉Chi,壽Shou,富Fu,貴Kuei,成Cheng,龍Lung,鳳Feng,家Chia,豪Hao,峰Feng,翔Hsiang,宇Yu,浩Hao,博Po,維Wei,中Chung,山Shan,光Kuang,大Ta,永Yung,俊Chun,哲Che,賢Hsien,鑫Hsin,威Wei,政Cheng,彥Yen,廷Ting,毅Yi,恆Heng,聖Sheng,凱Kai,瑞Jui,銘Ming,裕Yu,源Yuan,澤Tse,小Hsiao,子Tzu,世Shih,民Min,仕Shih,承Cheng,立Li,全Chuan,有Yu,守Shou,同Tung,至Chih,宗Tsung,尚Shang,和Ho,昊Hao,松Sung,治Chih,亮Liang,奕Yi,昱Yu,秋Chiu,科Ko,冠Kuan,品Pin,泉Chuan,昭Chao,相Hsiang,盈Ying,致Chih,剛Kang,原Yuan,庭Ting,桂Kuei,修Hsiu,容Jung,恩En,書Shu,根Ken,益Yi,高Kao,素Su,淳Chun,堯Yao,揚Yang,景Ching,超Chao,琦Chi,新Hsin,業Yeh,睿Jui,群Chun,鼎Ting,愛Ai,敬Ching,照Chao,嘉Chia,碩Shuo,齊Chi,儒Ju,錦Chin,霖Lin,鴻Hung'.split(',').forEach(function(p){if(!m[p[0]])m[p[0]]=p.substring(1)});
// 補常見字
'珮Pei,蘋Ping,誼Yi,瑢Jung,博Po,伊Yi,芸Yun,丹Tan,妤Yu,旻Min,昕Hsin,語Yu,恬Tien,可Ko,沁Chin,瑄Hsuan,甯Ning,愷Kai,勳Hsun,杰Chieh,翰Han,廷Ting,霆Ting,棋Chi,皓Hao,晨Chen,煜Yu,晟Cheng,璋Chang,瀚Han,騰Teng'.split(',').forEach(function(p){if(!m[p[0]])m[p[0]]=p.substring(1)});
return m})();

function autoWadeGiles(){
  var el=document.getElementById('bname'),en=document.getElementById('bname_en');
  if(!el||!en)return;
  var v=el.value.trim();
  if(!v){en.value='';return}
  var chars=v.split(''),parts=[];
  for(var i=0;i<chars.length;i++){
    var ch=chars[i];
    if(WG_MAP[ch])parts.push(WG_MAP[ch]);
    // 忽略注音符號和組字中的字元
  }
  if(parts.length>=2)en.value=parts[0]+' '+parts.slice(1).join('');
  else if(parts.length===1)en.value=parts[0];
  else en.value='';
}
// 手機 IME 相容：組字完成後才觸發轉換
(function(){
  var el=document.getElementById('bname');
  if(!el)return;
  var composing=false;
  el.addEventListener('compositionstart',function(){composing=true});
  el.addEventListener('compositionend',function(){composing=false;autoWadeGiles()});
  el.addEventListener('input',function(){if(!composing)autoWadeGiles()});
  // blur 時也觸發一次（防漏）
  el.addEventListener('blur',function(){autoWadeGiles()});
})();

// ══════ ⑩ 大六壬（生辰起課）══════
var LR_YJ=[11,10,9,8,7,6,5,4,3,2,1,0]; // 正月亥將,二月戌將,...十二月子將
var LR_GAN_PAL=[2,4,5,6,5,6,8,10,11,1]; // 甲寅乙辰丙巳丁午戊巳己午庚申辛戌壬亥癸丑
function calcLiuren(lm,hzI,dayGanIdx,dayZhiIdx){
  var yjI=LR_YJ[(lm-1)%12];
  var off=(yjI-hzI+12)%12;
  var tp=[];for(var i=0;i<12;i++)tp.push(DZ[(i+off)%12]);
  var pal=LR_GAN_PAL[dayGanIdx];
  var k1t=tp[pal],k1b=DZ[pal];
  var k2b=k1t,k2t=tp[DZ.indexOf(k1t)];
  var k3t=tp[dayZhiIdx],k3b=DZ[dayZhiIdx];
  var k4b=k3t,k4t=tp[DZ.indexOf(k3t)];
  var c1=k1t,c2=tp[DZ.indexOf(c1)],c3=tp[DZ.indexOf(c2)];
  return{yj:DZ[yjI],shi:DZ[hzI],tp:tp,
    lessons:[{t:k1t,b:k1b},{t:k2t,b:k2b},{t:k3t,b:k3b},{t:k4t,b:k4b}],
    san:[c1,c2,c3]};
}

// ══════ ⑪ 九星氣學 ══════
var NSK=[null,{n:'一白水星',e:'水',ba:'坎',d:'北',t:'獨立深沉、洞察力強',g:'傾聽力、柔軟度',ch:'孤僻、壓抑',ar:'佛手柑、薰衣草'},{n:'二黑土星',e:'土',ba:'坤',d:'西南',t:'包容踏實、照顧型',g:'耐心、同理心',ch:'犧牲、猶豫',ar:'岩蘭草、檀香'},{n:'三碧木星',e:'木',ba:'震',d:'東',t:'衝勁十足、開創者',g:'行動力、決斷力',ch:'急躁、虎頭蛇尾',ar:'迷迭香、尤加利'},{n:'四綠木星',e:'木',ba:'巽',d:'東南',t:'溫和善溝通',g:'人際敏感、創意',ch:'優柔寡斷',ar:'天竺葵、快樂鼠尾草'},{n:'五黃土星',e:'土',ba:'中宮',d:'中央',t:'九星之王、掌控者',g:'領袖氣質、影響力',ch:'控制慾、壓力大',ar:'乳香、沒藥'},{n:'六白金星',e:'金',ba:'乾',d:'西北',t:'高貴自律、完美主義',g:'領導力、正義感',ch:'嚴格、不近人情',ar:'茶樹、松針'},{n:'七赤金星',e:'金',ba:'兌',d:'西',t:'魅力口才、享樂主義',g:'表達力、品味',ch:'花錢大手',ar:'玫瑰、依蘭'},{n:'八白土星',e:'土',ba:'艮',d:'東北',t:'穩重內斂、大器晚成',g:'毅力、專注力',ch:'固執、慢熱',ar:'雪松、廣藿香'},{n:'九紫火星',e:'火',ba:'離',d:'南',t:'熱情閃耀、直覺強',g:'創造力、激勵他人',ch:'情緒起伏',ar:'甜橙、肉桂'}];
var NSK_E4=[1,3,4,9],NSK_SMT=[[2,4],[3,6],[4,5],[5,6],[6,6],[7,7],[8,8],[9,8],[10,8],[11,7],[12,7],[1,6]];
var NSK_MT={A:[8,7,6,5,4,3,2,1,9,8,7,6],B:[5,4,3,2,1,9,8,7,6,5,4,3],C:[2,1,9,8,7,6,5,4,3,2,1,9]};
var NSK_T3={1:{8:7,7:8,6:9,5:1,4:2,3:3,2:4,1:5,9:6},2:{2:5,1:6,9:7,8:8,7:9,6:1,5:2,4:3,3:4},3:{5:3,4:4,3:5,2:6,1:7,9:8,8:9,7:1,6:2},4:{8:1,7:2,6:3,5:4,4:5,3:6,2:7,1:8,9:9},5:{2:8,1:9,9:1,8:2,7:3,6:4,5:5,4:6,3:7},6:{5:6,4:7,3:8,2:9,1:1,9:2,8:3,7:4,6:5},7:{8:4,7:5,6:6,5:7,4:8,3:9,2:1,1:2,9:3},8:{2:2,1:3,9:4,8:5,7:6,6:7,5:8,4:9,3:1},9:{5:9,4:1,3:2,2:3,1:4,9:5,8:6,7:7,6:8}};
function nskDS(n){while(n>9){var s=0;String(n).split('').forEach(function(d){s+=+d});n=s}return n}
function calcNSK(Y,M,D){
  var aY=(M<2||(M===2&&D<4))?Y-1:Y;
  var ys=11-nskDS(aY);if(ys>9)ys-=9;if(ys<=0)ys+=9;
  var mi=-1;for(var i=NSK_SMT.length-1;i>=0;i--){if(M>NSK_SMT[i][0]||(M===NSK_SMT[i][0]&&D>=NSK_SMT[i][1])){mi=i;break}}
  if(mi<0)mi=11;
  var grp=([1,4,7].indexOf(ys)>=0)?'A':([3,6,9].indexOf(ys)>=0)?'B':'C';
  var ms=NSK_MT[grp][mi];
  var ts=(NSK_T3[ys]&&NSK_T3[ys][ms])||5;
  return{ys:ys,ms:ms,ts:ts,isE:NSK_E4.indexOf(ys)>=0}
}

// ══════ ⑫ 生日色彩 ══════
var CLR={1:{n:'紅',h:'#DC3545',ck:'海底輪',t:'開創力、領導力',ar:'肉桂、黑胡椒'},2:{n:'橘',h:'#FD7E14',ck:'臍輪',t:'連結力、感受力',ar:'甜橙、橙花'},3:{n:'黃',h:'#FFC107',ck:'太陽神經叢',t:'表達力、陽光感染力',ar:'檸檬、葡萄柚'},4:{n:'綠',h:'#28A745',ck:'心輪',t:'穩定力、自然平衡者',ar:'尤加利、薄荷'},5:{n:'藍',h:'#007BFF',ck:'喉輪',t:'自由、變化、冒險',ar:'薰衣草、藍艾菊'},6:{n:'靛',h:'#6610F2',ck:'眉心輪',t:'責任感、洞察力',ar:'薰衣草、茉莉'},7:{n:'紫',h:'#9B59B6',ck:'頂輪',t:'神秘內省、靈性追尋',ar:'乳香、檀香'},8:{n:'玫瑰金',h:'#B76E79',ck:'心輪高階',t:'豐盛、物質掌控者',ar:'玫瑰、廣藿香'},9:{n:'白金',h:'#E8E0D4',ck:'全脈輪',t:'完成、慈悲智慧',ar:'岩蘭草、雪松'},11:{n:'銀白',h:'#C0C0C0',ck:'眉心+頂輪',t:'大師數·直覺通道',ar:'乳香、岩蘭草'},22:{n:'金',h:'#FFD700',ck:'太陽+頂輪',t:'大師數·建造大師',ar:'乳香、迷迭香'}};
function clrR(n){while(n>9&&n!==11&&n!==22&&n!==33){var s=0;String(n).split('').forEach(function(d){s+=+d});n=s}if(n===33)n=6;return n}
function clrRS(n){while(n>9){var s=0;String(n).split('').forEach(function(d){s+=+d});n=s}return n}
function calcColor(Y,M,D){
  var ln=clrR(clrR(Y)+clrR(M)+clrR(D)),dn=clrR(D),mn=clrR(M),yn=clrR(Y);
  return{ln:ln,dn:dn,mn:mn,yn:yn,mc:CLR[ln]||CLR[clrRS(ln)],ic:CLR[dn]||CLR[clrRS(dn)],ec:CLR[mn]||CLR[clrRS(mn)],nc:CLR[yn]||CLR[clrRS(yn)]}
}

// ══════ ⑬ 凱龍星與黑月莉莉絲 ══════
var CHI_INTERP=['傷口在自我認同，覺察天賦：幫助別人找到自己','傷口在自我價值，覺察天賦：教人看見自己的價值','傷口在溝通表達，覺察天賦：幫助別人說出心裡話','傷口在安全感與家，覺察天賦：為別人建造心靈避風港','傷口在被看見，覺察天賦：鼓勵別人勇敢發光','傷口在完美主義，覺察天賦：教人接納不完美','傷口在關係平衡，覺察天賦：幫助別人建立健康關係','傷口在信任與背叛，覺察天賦：引導穿越黑暗重生','傷口在信念系統，覺察天賦：幫助找到屬於自己的哲學','傷口在權威成就，覺察天賦：教人建立自己的權威','傷口在歸屬感，覺察天賦：幫助邊緣人找到位置','傷口在界線慈悲，覺察天賦：教人慈悲但不犧牲'];
var LIL_INTERP=['被壓抑的原始憤怒與領導慾，釋放：允許自己理直氣壯地爭取','被壓抑的感官慾望與物質渴望，釋放：坦然接受身體的需求','被壓抑的真實聲音，釋放：用寫作或創作釋放內在對話','被壓抑的極端情感需求，釋放：允許自己脆弱','被壓抑的自我表現慾，釋放：大膽創作不怕被看見','被壓抑的失控恐懼，釋放：刻意練習差不多就好','被壓抑的公平執念，釋放：為正義發聲而非默默承受','被壓抑的毀滅重生衝動，釋放：允許深度轉化','被壓抑的極端自由渴望，釋放：給自己冒險的空間','被壓抑的權力渴望，釋放：堂堂正正承擔領導','被壓抑的主流反叛，釋放：用創新改變體制','被壓抑的神秘連結，釋放：信任直覺但保持接地'];
function calcBML(y,m,d){var a=Math.floor((14-m)/12),y2=y+4800-a,m2=m+12*a-3;var jdn=d+Math.floor((153*m2+2)/5)+365*y2+Math.floor(y2/4)-Math.floor(y2/100)+Math.floor(y2/400)-32045;return((83.353+0.111404016*(jdn-2451545))%360+360)%360}
function calcCL(planets,Y,M,D){
  var r={ch:null,li:null};
  if(planets&&planets.chiron){var cl=planets.chiron.lon;var ci=Math.floor(cl/30)%12;r.ch={sign:SIGNS[ci],deg:Math.floor(cl%30),min:Math.floor((cl%1)*60),idx:ci,interp:CHI_INTERP[ci]}}
  var bl=calcBML(Y,M,D);var li=Math.floor(bl/30)%12;
  r.li={sign:SIGNS[li],deg:Math.floor(bl%30),min:Math.floor((bl%1)*60),idx:li,interp:LIL_INTERP[li]};
  return r
}

// ══════ ⑭ 吠陀占星 Jyotish ══════
var V_RASHI=['梅沙（牡羊）','弗裡沙巴（金牛）','密圖那（雙子）','卡爾卡塔（巨蟹）','辛哈（獅子）','坎亞（處女）','圖拉（天秤）','弗裡希奇卡（天蠍）','達努（射手）','瑪卡拉（摩羯）','昆巴（水瓶）','密那（雙魚）'];
var V_NAK_ZH=['阿許維尼','婆羅尼','刻栗底迦','羅希尼','摩利伽尸羅','阿耳陀羅','普那婆蘇','普世耶','阿須利沙','摩伽','前法勒虞尼','後法勒虞尼','訶斯多','質多羅','莎缽底','毗舍佉','阿努羅陀','折瑟陀','牟羅','前阿沙陀','後阿沙陀','室羅婆拿','淡尼瑟陀','摩多壁宿','前跋達羅鉢陀','後跋達羅鉢陀','離婆底'];
var V_NAK_LORD=['計都','金星','太陽','月亮','火星','羅睺','木星','土星','水星','計都','金星','太陽','月亮','火星','羅睺','木星','土星','水星','計都','金星','太陽','月亮','火星','羅睺','木星','土星','水星'];
function lahiriAyan(y,m,d){var T=((y-2000)+(m-1)/12+(d-1)/365.25)/100;return 23.856111+1.39583333*T+0.00111111*T*T}
function calcVedic(planets,Y,M,D){
  var ay=lahiriAyan(Y,M,D),r=[];
  var pn=['太陽','月亮','水星','金星','火星','木星','土星'],pk=['sun','moon','mercury','venus','mars','jupiter','saturn'];
  for(var i=0;i<pk.length;i++){var p=planets?planets[pk[i]]:null;if(!p)continue;
    var sl=((p.lon-ay)%360+360)%360,ri=Math.floor(sl/30)%12,ni=Math.floor(sl/13.333333);if(ni>26)ni=26;
    r.push({nm:pn[i],sl:sl,ri:ri,rn:V_RASHI[ri],dg:Math.floor(sl%30),mn:Math.floor((sl%1)*60),ni:ni,nn:V_NAK_ZH[ni],nl:V_NAK_LORD[ni],rt:p.retro||false})}
  if(planets&&planets.node){var nd=planets.node;var nsl=((nd.lon-ay)%360+360)%360;var nri=Math.floor(nsl/30)%12;var nni=Math.floor(nsl/13.333333);if(nni>26)nni=26;
    r.push({nm:'羅睺',sl:nsl,ri:nri,rn:V_RASHI[nri],dg:Math.floor(nsl%30),mn:Math.floor((nsl%1)*60),ni:nni,nn:V_NAK_ZH[nni],nl:V_NAK_LORD[nni],rt:true});
    var ksl=(nsl+180)%360;var kri=Math.floor(ksl/30)%12;var kni=Math.floor(ksl/13.333333);if(kni>26)kni=26;
    r.push({nm:'計都',sl:ksl,ri:kri,rn:V_RASHI[kri],dg:Math.floor(ksl%30),mn:Math.floor((ksl%1)*60),ni:kni,nn:V_NAK_ZH[kni],nl:V_NAK_LORD[kni],rt:true})}
  return{ay:ay,ps:r}
}

// ══════ ⑮ 姓名解碼（簡化五格筆畫）══════
var NM_STROKES=(function(){var m={};
'王4,李7,張11,劉15,陳16,楊13,黃12,趙14,吳7,周8,徐10,孫10,馬10,朱6,胡11,郭15,何7,林8,羅20,梁11,宋7,鄭19,謝17,韓17,唐10,馮12,于3,董15,蕭18,程12,曹11,袁10,鄧19,許11,傅12,沈8,曾12,彭12,呂7,蘇22,盧16,蔣17,蔡17,丁2,魏18,薛19,葉15,余7,潘16,杜7,戴18,夏10,鐘17,汪8,田5,任6,姜9,范11,方4,石5,姚9,廖14,金8,陸16,孔4,白5,崔11,康11,毛4,邱12,秦10,江7,史5,侯9,邵12,孟8,龍16,萬15,段9,雷13,錢16,湯13,尹4,黎15,易8,常11,武8,賀12,賴16,龔22,文4,殷10,施9,陶16,洪10,安6,顏18,倪10,嚴20,溫14,季8,俞9,章11,韋9,申5,尤4,柳9,路13,岳8,梅11,莊13,辛7,管14,祝10,谷7,時10,舒12,卜2,詹13,關19,苗11,凌10,費12,盛12,童12,歐15,席10,衛16,查9,花10,穆16,包5,柏9,寧14,翁10'.split(',').forEach(function(p){m[p.slice(0,-1*String(parseInt(p.match(/\d+$/)[0])).length)]=parseInt(p.match(/\d+$/)[0])});
'逸15,君7,瑋14,雅12,琪13,婷12,芳10,惠12,玲10,珍10,美9,麗19,華14,英11,秀7,淑12,貞9,慧15,娟10,雲12,萍14,敏11,儀15,如6,佳8,怡9,雯12,妍7,欣8,琳13,靜16,潔16,瑩15,芬10,蓉16,嘉14,茹12,倩10,思9,詩13,涵12,璇16,瑜14,彤7,瑤15,薇19,萱15,韻19,宜8,真10,柔9,穎16,心4,羽6,菲14,晴12,紫11,若11,馨20,妮8,蕾19,翠14'.split(',').forEach(function(p){var ch=p.replace(/\d+$/,'');var n=parseInt(p.match(/\d+$/)[0]);if(!m[ch])m[ch]=n});
'明8,志7,偉11,建9,國11,東8,平5,強12,軍9,正5,德15,生5,忠8,輝15,勇9,誠14,達16,學16,祥11,勝12,天4,宏7,傑12,仁4,義13,智12,信9,榮14,昌8,興16,振11,清12,福14,寶20,成7,家8,豪14,峰10,翔12,宇6,浩11,博12,維14,中4,山3,光6,永5,俊9,哲10,賢15,威9,政9,彥9,廷7,毅15,恆10,聖13,凱12,瑞14,銘14,裕13,源14,澤17,世5,民5,承8,立5,全6,守6,同6,宗8,尚8,和8,松8,治9,亮9,奕9,昱9,秋9,冠9,品9,昭9,致10,庭10,桂10,修10,容10,恩10,書10,益10,高10,素10,淳12,堯12,景12,超12,新13,睿14,鼎13,照13,錦16,霖16,鴻17'.split(',').forEach(function(p){var ch=p.replace(/\d+$/,'');var n=parseInt(p.match(/\d+$/)[0]);if(!m[ch])m[ch]=n});
'珮10,蘋14,誼15,瑢14,博12,伊6,芸10,丹4,妤7,旻8,昕8,語14,恬10,可5,沁8,瑄14,甯14,愷14,勳16,翰16,霆15,棋12,皓12,晨11,煜13,晟11,璋16,瀚20,騰20'.split(',').forEach(function(p){var ch=p.replace(/\d+$/,'');var n=parseInt(p.match(/\d+$/)[0]);if(!m[ch])m[ch]=n});
return m})();
function getStroke(ch){return NM_STROKES[ch]||0}
var SULI_81=[0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,0,0,1,0,1,1,1,0,0,0,1,0,1,1,1,0,1,0,1,0,1,0,1,0,0,0,1,0,1,1,0,0,1,1,1,0,0,0,1,0,0,0,1,0,1,0,1,0,1,1,0,0,1,0,1,0,0,0,1,0,0,0];
var SULI_NAME={1:'太極之數·萬物開泰',2:'兩儀之數·混沌未開',3:'萬物成形·進取如意',4:'萬物枯衰·破敗挑戰',5:'福祿壽長·陰陽和合',6:'安穩吉慶·富貴榮達',7:'精悍剛毅·獨立權威',8:'意志剛健·勤勉發展',9:'利去功空·心身疲弊',10:'萬業終局·充滿損耗',11:'旱苗逢雨·挽回家運',12:'薄弱無力·孤立無援',13:'智能超群·博學多才',14:'忍得苦難·必有後福',15:'福壽圓滿·富貴榮耀',16:'貴人得助·天乙貴人',17:'突破萬難·剛柔兼備',18:'有志竟成·內外合力',19:'成功雖早·慎防虧空',20:'智高志大·歷盡艱難',21:'光風霽月·萬象更新',22:'秋草逢霜·懷才不遇',23:'旭日東升·錦繡前程',24:'錦繡前程·望事遂意',25:'資性英敏·奇略才謀',26:'變怪奇異·英雄豪傑',27:'足智多謀·先苦後甜',28:'遭難頻至·如浪之中',29:'智謀奮進·才略奏功',30:'一成一敗·絕處逢生',31:'智勇得志·可享安福',32:'僥倖多望·貴人得助',33:'旭日升天·家門隆昌',34:'災難不絕·破家亡身',35:'溫和平靜·優雅發展',36:'風浪不靜·俠義薄運',37:'權威顯達·獨佔鰲頭',38:'薄弱無力·藝術成功',39:'富貴榮華·財帛豐盈',40:'退安進吉·一盛一衰',41:'天賦吉運·德望兼備',42:'寒蟬在柳·十藝九窮',43:'雨夜花落·外祥內苦',44:'秋雨夜長·願望難達',45:'順風揚帆·新生泰和',46:'離祖搬遷·養蜂釀蜜',47:'有貴人助·可成大業',48:'美花豐實·鶴立雞群',49:'吉險難分·不進則退',50:'一盛一衰·浮沉不定',51:'盛衰交加·一成一敗',52:'卓識達人·集眾信仰',53:'憂愁困苦·內外不和',54:'石上栽花·多困無功',55:'外祥內患·不堪苦衷',56:'挑戰於前·萬事挫折',57:'寒雪青松·繁榮富貴',58:'先苦後甘·晚景轉佳',59:'寒蟬悲風·前途無力',60:'黑暗無光·心苦難營',61:'牡丹芙蓉·花開富貴',62:'衰敗日見·萬事不利',63:'萬物化育·繁榮之象',64:'見異思遷·十九不成',65:'富貴長壽·家門興旺',66:'淺吉之象·內外不和',67:'獨營事業·財源廣進',68:'順風吹帆·家道興昌',69:'坐立不安·陷於逆境',70:'挑戰中帶吉·暗藏險象',71:'吉險參半·惟賴勇氣',72:'先甘後苦·難以安順',73:'安樂自來·自然吉祥',74:'沉淪逆境·秋葉落寞',75:'先苦後甘·守之可安',76:'離散敗亂·進退維谷',77:'前半吉祥·後半需慎',78:'有得有失·宜守本份',79:'挽回乏力·身疲力盡',80:'得而復失·枉費心機',81:'還原復始·天賦吉運'};
var WX_SUPPORT={'木':'火','火':'土','土':'金','金':'水','水':'木'};
var WX_CONTROL={'木':'土','土':'水','水':'火','火':'金','金':'木'};
function wxRelation(a,b){if(a===b)return'比和（同氣相助）';if(WX_SUPPORT[a]===b)return a+'生'+b+'（相生·順）';if(WX_SUPPORT[b]===a)return b+'生'+a+'（被生·受益）';if(WX_CONTROL[a]===b)return a+'剋'+b+'（相剋·耗損）';if(WX_CONTROL[b]===a)return b+'剋'+a+'（被剋·壓力）';return'中性'}
function nmLucky(n){n=((n-1)%80)+1;return SULI_81[n]?'吉':'挑戰'}
var WX_MAP={1:'木',2:'木',3:'火',4:'火',5:'土',6:'土',7:'金',8:'金',9:'水',0:'水'};
function calcNameGrid(surname,given){
  var ss=0,gs=0;
  for(var i=0;i<surname.length;i++)ss+=getStroke(surname[i])||10;
  for(var i=0;i<given.length;i++)gs+=getStroke(given[i])||10;
  var tian=ss+1,ren=ss+getStroke(given[0]||''),di=gs+1,wai=tian+di-ren,zong=ss+gs;
  if(surname.length===1&&given.length===1){wai=2;di=getStroke(given[0])+1}
  return{ss:ss,gs:gs,chars:surname+given,
    tian:{v:tian,wx:WX_MAP[tian%10],lk:nmLucky(tian)},
    ren:{v:ren,wx:WX_MAP[ren%10],lk:nmLucky(ren)},
    di:{v:di,wx:WX_MAP[di%10],lk:nmLucky(di)},
    wai:{v:wai>0?wai:2,wx:WX_MAP[(wai>0?wai:2)%10],lk:nmLucky(wai>0?wai:2)},
    zong:{v:zong,wx:WX_MAP[zong%10],lk:nmLucky(zong)},
    sancai:WX_MAP[tian%10]+WX_MAP[ren%10]+WX_MAP[di%10]}
}

// ══════ ⑯ 卡巴拉生命之樹 ══════
var KB_VAL={};'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function(c,i){KB_VAL[c]=(i%9)+1});
var KB_VOWELS='AEIOU';
var KB_SEPH=['Kether 王冠','Chokmah 智慧','Binah 理解','Chesed 慈悲','Geburah 力量','Tiphareth 美','Netzach 勝利','Hod 榮耀','Yesod 基礎','Malkuth 王國'];
var KB_NUM_MEAN={1:'開創·獨立·領導力',2:'合作·敏感·外交力',3:'創意表達·社交魅力',4:'穩定·紀律·建造力',5:'自由·變化·冒險',6:'責任·關懷·和諧之愛',7:'內省·分析·靈性追尋',8:'豐盛·權力·物質掌控',9:'完成·慈悲·大格局',11:'直覺大師（大師數）',22:'建造大師（大師數）'};
function kbReduce(n){while(n>9&&n!==11&&n!==22&&n!==33){var s=0;String(n).split('').forEach(function(d){s+=+d});n=s}return n}
function kbRS(n){while(n>9){var s=0;String(n).split('').forEach(function(d){s+=+d});n=s}return n}
function kbNTS(n){if(n===10||n===0)return 9;if(n===11)return 0;if(n===22)return 5;if(n>=1&&n<=9)return n-1;return kbRS(n)-1}
function calcKabbalah(nameEn,Y,M,D){
  var up=nameEn.toUpperCase().replace(/[^A-Z]/g,'');
  var tot=0,vow=0,con=0;
  for(var i=0;i<up.length;i++){var v=KB_VAL[up[i]]||0;tot+=v;if(KB_VOWELS.indexOf(up[i])>=0)vow+=v;else con+=v}
  var expr=kbReduce(tot),soul=kbReduce(vow),pers=kbReduce(con);
  var lp=kbReduce(kbReduce(Y)+kbReduce(M)+kbReduce(D));
  var mission=kbReduce(expr+lp);
  var kab=(tot%9)+1;
  return{name:nameEn,letters:up,expr:expr,soul:soul,pers:pers,lp:lp,mission:mission,kab:kab,
    exprS:KB_SEPH[kbNTS(expr)],soulS:KB_SEPH[kbNTS(soul)],persS:KB_SEPH[kbNTS(pers)],
    lpS:KB_SEPH[kbNTS(lp)],missionS:KB_SEPH[kbNTS(mission)]}
}

// ═══════════════════════════════════════
// 主控台
// ═══════════════════════════════════════
var SYS=['① 四柱八字','② 紫微斗數','③ 西洋占星','④ 人類圖','⑤ 七政四餘','⑥ 瑪雅曆法','⑦ 生命靈數','⑧ 馥靈秘碼','⑨ 生命密碼','⑩ 大六壬','⑪ 九星氣學','⑫ 生日色彩','⑬ 凱龍莉莉絲','⑭ 吠陀占星','⑮ 姓名解碼','⑯ 卡巴拉'];
