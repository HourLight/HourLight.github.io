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
  // EPH 索引映射：P_ORDER index → EPH body ID（node=True Node=11，跳過10=Mean Node）
  var EPH_IDX=[0,1,2,3,4,5,6,7,8,9,11,null];
  for(var i=0;i<P_ORDER.length;i++){
    var ei=EPH_IDX[i];if(ei===null)continue;
    var lon0=row[ei], lon1=nr?nr[ei]:lon0;
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
  bd.setUTCDate(bd.getUTCDate()-100);
  var bestDiff=999,bestDate=null,bestFrac=0;
  for(var di=0;di<30;di++){
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
      var pidx={'sun':0,'moon':1,'mercury':2,'venus':3,'mars':4,'jupiter':5,'saturn':6,'uranus':7,'neptune':8,'pluto':9,'node':11,'earth':-1,'snode':-2}[k];
      var lon;
      if(pidx==-1){var si=0;var v1=EPH[bestDate.ck][0],v2=EPH[bestDate.nk][0];var dd=v2-v1;if(dd>180)dd-=360;if(dd<-180)dd+=360;lon=((v1+dd*bestFrac+360)%360+180)%360}
      else if(pidx==-2){var v1=EPH[bestDate.ck][11],v2=EPH[bestDate.nk][11];var dd=v2-v1;if(dd>180)dd-=360;if(dd<-180)dd+=360;lon=((v1+dd*bestFrac+360)%360+180)%360}
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
  else if(defC.length===0){type='反映者';strategy='等待月循環';nst='失望'}
  else{type='投射者';strategy='等待邀請';nst='苦澀'}
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
  // 定義類型（BFS 連通分量）
  var _defKeys=[];for(var _dk in HD_CENTERS){if(defC.indexOf(HD_CENTER_NAMES[_dk])>=0)_defKeys.push(_dk);}
  var _vis2={},_comps=0;
  _defKeys.forEach(function(c){if(_vis2[c])return;_comps++;var q=[c];while(q.length){var cur=q.shift();if(_vis2[cur])return;_vis2[cur]=true;(_cg[cur]||[]).forEach(function(nb){if(!_vis2[nb]&&_defKeys.indexOf(nb)>=0)q.push(nb)})}});
  var defType=_comps<=1?(_defKeys.length===0?'無定義':'單一定義'):_comps===2?'二分人':_comps===3?'三分人':'四分人';
  // 輪迴交叉
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
    var ln=parseInt(String(profile).split('/')[0])||0;
    if(ln>=1&&ln<=3)crossFull='右角度交叉之'+_RN[pos]+v+' ('+gs+')';
    else if(ln===4)crossFull='並列交叉之'+(_JN[ps]||'')+' ('+gs+')';
    else{var nm=(qi===0||qi===2)?_LA[pos]:_LB[pos];crossFull='左角度交叉之'+nm+((qi<=1)?1:2)+' ('+gs+')';}
  })();
  return{type:type,strategy:strategy,authority:authority,profile:profile,nst:nst,channels:channels,defC:defC,undefC:undefC,pGates:pGates,dGates:dGates,defType:defType,crossFull:crossFull};
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

// ══════ 威妥瑪拼音轉換（20,900+字，含護照慣用拼法）══════
var WG_MAP=(function(){var m={};
'丁Ting,于Yu,任Jen,何Ho,余Yu,侯Hou,俞Yu,倪Ni,傅Fu,凌Ling,劉Liu,包Pao,區Ou,卜Pu,史Shih,吳Wu,呂Lu,周Chou,唐Tang,嚴Yen,夏Hsia,姚Yao,孫Sun,安An,宋Sung,寧Ning,尹Yin,岳Yueh,崔Tsui,左Tso,席Hsi,常Chang,康Kang,廖Liao,張Chang,徐Hsu,戴Tai,方Fang,施Shih,曾Tseng,朱Chu,李Lee,杜Tu,林Lin,柏Po,查Cha,柳Liu,楊Yang,歐Ou,武Wu,段Tuan,殷Yin,毛Mao,江Chiang,汪Wang,沈Shen,洪Hung,湯Tang,溫Wen,潘Pan,王Wang,田Tien,白Pai,盛Sheng,盧Lu,石Shih,祝Chu,秦Chin,穆Mu,童Tung,羅Lo,翁Weng,胡Hu,舒Shu,花Hua,苗Miao,范Fan,莊Chuang,萬Wan,葉Yeh,葛Ko,董Tung,蔡Tsai,蔣Chiang,蕭Hsiao,薛Hsueh,蘇Su,蘭Lan,袁Yuan,許Hsu,詹Chan,謝Hsieh,譚Tan,谷Ku,費Fei,賀Ho,賴Lai,趙Chao,辛Hsin,邱Chiu,邵Shao,郭Kuo,鄒Tsou,鄧Teng,鄭Cheng,金Chin,錢Chien,鐘Chung,關Kuan,陳Chen,陶Tao,雷Lei,韋Wei,韓Han,顏Yen,馮Feng,黃Huang,黎Li,龍Lung,龔Kung'.split(',').forEach(function(p){m[p[0]]=p.substring(1)});
'A:啊嗄錒锕阿,Ai:伌僾凒叆哀哎唉啀嗌嗳嘊噯埃塧壒娭娾嫒嬡愛懓懝挨捱敱敳昹暧曖欸毐溰溾濭爱瑷璦癌皑皚皧瞹矮砹硋碍礙艾蔼薆藹譪譺躷銰鎄鑀锿閡隘霭靄靉餲馤騃鱫鴱,An:侒俺儑唵啽垵埯堓婩媕安岸峖庵按揞晻暗案桉氨洝犴玵痷盦盫罯胺腤荌菴萻葊蓭誝諳谙豻貋銨錌铵闇隌雸鞌鞍韽馣鮟鵪鶕鹌黯鿷,Ang:卬岇昂昻枊盎肮醠骯,Ao:傲凹厫嗷嗸坳垇墺奡奥奧媪媼嫯岙岰嶅嶴廒慠懊扷抝拗摮擙敖柪梎滶澳熬爊獒獓璈磝翱翶翺聱芺蔜螯袄襖謷謸軪遨鏊鏖镺隞隩驁骜鰲鳌鷔鼇鿫,Cha:乍侘偛偧劄厏叉吒咤哳喳嗏垞奓奼姹宱察岔嵖差扎扠抯拃挓挿插揷揸搩搽搾摣札杈柞柤查査栅楂榨槎樝檫汊渣溠灹炸煠牐猹甴疀痄皶皻眨砟碴秅箚紁耫肞臿艖苲茬茶蚱蚻衩觰詐詧詫譇譗诈诧踷蹅醡銟鍘鍤鑔铡锸镲閘闸霅靫餷馇鮓鮺鲊鲝齄齇,Chai:侪债債儕喍囆夈宅寨拆捚摘斋斎柴榸檡犲瘥瘵砦祡窄粂芆茝虿蠆袃訍豺釵鉙钗齋齜,Chan:丳产佔偡僝儃儳冁刬剗剷劖占啴嘽噡嚵囅壥婵嫸嬋展崭嵼嶃嶄嶘嶦巉幝幨廛忏惉懴懺战戦戰搀搌摌摲攙斩斬斺旃旜旵枬栈栴桟梴棎棧榐橏欃毚毡氈氊沾浐湛湹滻潹潺澶瀍瀺灛煘燀獑琖產産盏盞瞻硟磛禅禪站簅粘綻緾繟纏纒绽缠羼艬菚蒇蕆薝蘸虥虦蛅蝉蟬蟾裧襜覘覱觇詀詹誗諂譂譧譫讇讒讝谄谗谵趈躔輚輾轏辴辿邅鄽酁醆鉆鋋鋓鏟鑱铲镡镵閚閳闡阐霑韂顫颤颭飐飦饘饞馋驏驙骣魙鱣鳣鸇鹯黵龪,Chang:丈仉仗仧仩伥倀倡偿傽僘償兏厂厰唱嘗嚐场場塲墇娼嫜嫦尝嶂帐帳常幛幥廠张張彰徜怅悵惝慞扙掌敞昌昶晿暢暲杖椙樟氅涨涱淐漲漳焻猖獐玚琩瑒瑺璋瓺甞畅畼痮瘬瘴瞕礃章粀粻肠胀脹腸膓苌菖萇蔁蟐蟑裮誯賬账遧鄣鋹鋿錩鏛鏱锠長镸长閶阊障韔餦騿鬯鯧鱆鱨鲳鲿麞鼚,Chao:仦仯佋兆勦召吵啁嘲垗妱巐巢巣巶弨怊找抄招旐昭晁曌朝枛棹樔櫂欩沼漅潮炒炤焣焯照煼燳爪爫牊狣瑵皽盄眧瞾窲窼笊罀罩罺羄耖肁肇肈觘訬詔謿诏赵超趙轈鄛釗鈔鉊鍣钊钞駋鮡麨鼂鼌,Che:乽伡俥偖勶厇哲唓啠啫喆嗻嚞坼埑嫬屮彻徹悊扯折掣摺撤撦晢晣柘樜歽浙淛潪澈烢爡着瞮矺砓砗硨硩磔禇籷粍者聅莗蔗虴蛰蛼蜇蟄蟅袩褶襵詟謫謺讁讋谪赭車輒輙轍车辄辙这迠這遮銸鍺锗頙馲鮿鷓鹧,Chen:侦侲偵儭嗔嚫圳塦塵墋夦嫃宸寊尘屒帧帪弫忱愖抮抻挋振捵揕揨搸敐敶斟昣晨曟朕枕栕栚桢桭楨榇榛樄樼櫬殝沉浈湞潧澵煁獉珍珎琛瑧瑱甄甽畛疢疹瘎眕眞真眹瞋砧硶碜碪磣祯禎禛稹箴籈紖紾絼綝縝縥纼缜聄胗臣臻茞莀莐萙葴蒖蓁蔯薼薽螴衬袗裖襯訦診誫諃諶謓讖诊谌谶貞賑賝贂贞赈趁趂趻踸軙軫轃轸辰迧遉郴酖酙醦針鈂鉁鋴錱鍖鍼鎭鎮针镇阵陈陣陳霃震靕駗鬒鱵鴆鷐鸩麎黰齓齔龀,Cheng:丞乗乘争佂侱偁僜凧呈城埕埩堘塍塖塣姃娍媜宬峥峸崝崢幀庱征徎徰徴徵怔悜惩愸憆憕懲成承抍拯挣挰掁掙掟揁摚撐撑撜政整晟晸朾枨柽棖棦椉橕橙檉檙正氶泟洆浾溗澂澄瀓炡烝爭爯牚狰猙珵珹琤畻症癥眐睁睈睜瞠碀秤称程稱穪窚竀筝筬箏篜糽絾緽罉聇脀脭荿蒸蛏蟶裎証誠諍證证诚诤赪赬踭逞郑郕鄭酲鉦鋮錚鏳鏿鐣钲铖铮阷靗頳饓騁騬骋鬇鯎鯖鴊鿇,Chi:七丌丮乞乩亓亝亟亼亽企伋伎佶俟倛偈偮僛僟其兾冀凄几击刉刏剂剘剞剤劑勣卙即卽及叝叽吉启呇呮咠咭哜唘唧唭啓啔啟喞嗘嘁嘰噐器嚌圻圾坖垍基埼塈塉墼夡奇契妀妓妻姞姫姬娸婍嫉季寂寄屐屺岂岌岐岓峜崎嵆嵇嵜嵴嶯己帺幾庴廭弃彐彑彶徛忌忔忣忯急悸悽惎愭愱慼慽憇憩懠懻戚戟戢技挤捿掎掑揤摖撃撠擊擠攲敧斉斊旂旗旡既旣晵暣暨暩曁朞期机杞极枅柒栔栖桤桼梞棄棊棋棘棨棲楫極榿槉槣槭樭機橶檕檝檱檵櫀櫅欫欺歧殛毄气気氣汔汲汽沏泣泲洎济淇淒済湆湇湒漃漆漈潗激濈濝濟瀱炁焏犄犱狤猉玂玑玘琦琪璂璣甈畦畸畿疧疾痵瘠癠癪皀皍盀盵矵矶砌碁碕碛碶磜磧磩磯祁祇祈祭祺禝禥禨积稘稩稷稽穄穊積穖穧竒笄笈筓箕箿簊簯簱籍籏粸紀紒級紪継綥綦綨綮綺緀緕緝績繋繼纃级纪继绩绮缉缼罊罽羁羇羈耆耤耭肌肵脊脐膌臍臮艥艩芑芞芨芪芰茍茤荠萁萋萕葪葺蒺蓟蔇蕀蕲蕺薊薺藄藉蘄蘎蘮蘻虀虮蚑蚔蚚蛣蛴蜝蜞螏螧蟣蟿蠐裚褀褄襀襋覉覊覬觊觙觭計訖記誋諅諆諬諿譏譤计讥讫记诘谻豈賫賷赍起趌跂跡跻跽踑踖蹊蹐蹟躋躤躸軝輯轚辑迄迉迹邔郆郪鄿釮銈銡錡錤鍓鏚鏶鐖鑇鑙锜闙际際隮集雞雦雧霁霋霵霽鞿韲頎颀飢饑饥騎騏騹驥骐骑骥髻鬐鬾鬿魌魕魢鯕鯚鰭鰶鰿鱀鱭鱾鲚鲫鲯鳍鳮鵋鵸鶀鶈鶏鶺鷄鷑鸄鸡鹡麂麒麡鼜齊齌齎齏齐齑,Chia:乫价佳假傢價冾加叚唊嘉圶圿埉夹夾婽嫁家岬峠帢幏徦忦恝恰愘戛戞扴抸拁拤掐斚斝架枷梜椵榎榢槚檟殎毠泇洽浃浹犌猳玾珈甲痂瘕硈稼笳糘耞胛腵茄荚莢葜葭蛱蛺袈袷裌豭貑賈贾跏跒跲迦郏郟酠鉀鉫鉿鋏鎵钾铗镓鞐頬頰颊餄駕驾髂鴶鵊麚鿼,Chiang:丬傋僵勥匞匠呛唴嗆嗴墏墙墻壃夅奖奨奬姜嫱嬙将將嵹嶈廧弜弶強强彊戕戗戧抢搶摪摾斨枪桨椌槍槳樯橿檣櫤殭江洚浆溬滰漒漿炝熗牄牆犟猐獇獎玱瑲畕畺疅疆礓篬糡糨絳繈繦繮绛缰羌羗羟羥羫羻翞耩腔膙艢茳葁蒋蔃蔣蔷薑薔蘠蜣螀螿袶襁謒講謽讲豇跄蹌蹡酱醤醬錆鎗鏘鏹锖锵镪降韁顜鱂鳉,Chiao:乔交佼侥侨俏僑僥僬僺儌剿劁劋叫呌喬嘂嘄嘦嘺噍噭墝墽姣娇嫶嬌嬓孂峤峧峭嵪嶕嶠嶣巧帩幧徺徼恔悄愀憍憔憿挍挢捁搅摷撟撬撹撽攪敎教敫敲敽敿斠晈暞曒桥椒槗樵橇橋櫵殻毃浇湫湬滘漖潐澆灚烄焦煍燆燋燞犞狡獥珓璬癄皎皦皭瞧矫矯硗硚磽礁礄穚窌窍窖竅笅簥絞繑繳纐绞缲缴翘翹胶脚腳膠膲臫艽芁茭茮荍荞菬蕉蕎藠藮虠蛟蟜蟭角訆誚譑譙譥诮谯賋趫趬趭跤跷踋踍蹺躈較轇轎轿较郊郻鄡鄥酵醮釂釥鉸鍫鍬鐈鐎鐰铰锹陗隦鞒鞘鞩鞽韒頝顦餃饺驕骄骹髚髜鮫鱎鲛鵁鵤鷦鷮鹪,Chieh:且丯介借倢偼傑切刦刧刼劫劼匧卩卪厒吤喈喼嗟堦堺妾姐婕媎媘媫嫅孑尐屆届岊岕崨嵥嶻巀幯庎徣怯悈悏惬愜戒截拮挈捷接掲掶揭擑擮昅朅杢杰桀桝椄楐楬楶榤檞櫭毑洁洯淁湝滐潔煯犗玠琾界畍疌疖疥痎癤癿皆睫砎碣礍秸稭穕窃竊竭笡箧節篋籡結絜緁结羯聺脻节芥苆莭菨蓵藒蚧蛪蛶蜐蝍蝔蠘蠞蠽街衱衸袺褯解觧訐詰誡誱謯讦诫踕踥迼郄鉣鍥鍻鎅鐑锲阶階鞂鞊颉飷骱魝魪鮚鯜鲒鶛,Chien:乾仟仱件伣佥俔俭俴倩倹偂健傔僉僭儉儙兛兼冿减凵刋前剑剣剪剱劍劎劒劔劗千嗛囏囝圱圲坚堅堑堿塹墘墹壍奷奸姦姧婜媊嬱孅孯寋尖岍岒嵌嵰幵建弿彅徤忴悓悭惤愆慊慳戋戔戩戬扦扲拑拣拪挸捡掔掮揀揃揵搛搴撁撿擶攐攑攓旔暕杄枧柬栫梘检棈検椠椷椾楗榗榩槏槧樫橬橺檢檶櫏櫼欠欦歉歬歼殱殲毽汘汧洊浅涧淺渐減湔湕溅漸潛潜澗濳濺瀐瀳瀸瀽灊煎熞熸牋牮牵牽犍猏玪珔瑊瑐瓩皘监監睑睷瞷瞼硷碊碱磵礀礆礛竏笕笺筧签简箋箝箞箭篏篟篯簡簽籖籛籤粁糋絸綪緘縑縴繝繭繾缄缣缱羬翦肩肷脥腱膁臤臶舰艦艰艱芊芡茜茧茾荐菅菺葌葥蒨蒹蔪蔳蕁蕑蕳薦藆虃虔蚈蜸螹蠒袸裥褰襇襉襺見覵覸见詃諐諓諫謇謙謭譴譼譾谏谦谫谴谸豜豣賎賤贱趝趼践踐踺蹇軡輤轞迁遣遷釺釼鈆鈐鉗鉛鉴銭鋻錢鍳鍵鎆鏩鏲鐗鐧鐱鑑鑒鑓鑬鑯鑳钎钤钱钳铅锏键間间阡雃靬鞬鞯韀韆韉顅餞餰饯馢騚騝騫骞鬋鬜鬝鰎鰜鰬鰹鲣鳒鳽鵮鵳鶼鹐鹣鹸鹻鹼麉黔黚,Chih:之乿侄侈侙俧倁値值偫傂傺儨凪制劕劧勅勑卮卶厔只叱叺吃吱呎咫哧啻喫嗤嗭噄址坁坧坻垁垑埴執墀墆墌夂妛妷姪娡媸嬂寘尺岻峙崻巵帋帙帜幟庢庤廌弛彘彨彲彳徏徔徝志忮怾恉恜恥慗慹憄憏懘懥懫戠执扺扻抧抶持挃指挚掷搘搱摛摭摯擲擳攡支敕斥旘旨晊智杘枝枳柣栀栉桎梔梽植椥楖榰樴櫍櫛欼止歭歯殖汁池汥汦沚治泜洔洷淔淽湁滍滞滯漐漦潌瀄灻炙炽烾熫熾犆狾猘瓆瓡瓻畤疐疷疻痓痔痣痴痸瘈瘛癡直眵瞝知砋硳礩祉祑祗祬禃禔秓秖秩秪秲秷稙稚稺穉窒竾笞筂筫箎篪粚紙紩絷絺綕緻縶織纸织置翄翅翐翤翨耻聀职職肔肢胑胝胣胵脂腟膣膱至致臸芖芝芷茋茌荎藢蘵蚇蚩蚳蛭蜘螭螲蟙衹衼袟袠袲袳裭製褫襧覟觗觯觶訨訵誌誺謘豑豒豸貭貾質贄质贽赤赿趍趩趾跖跮跱踟踬踯蹠躑躓軄軹軽輊轵轾迟迣遅遟遫遲郅酯釞鉄鉓鉹銍銐鋕鑕铚锧阤阯陟隲隻雉雴飭饎饬馳馶馽駤騭騺驇驰骘魑鯯鳷鴙鴟鴲鵄鶒鷘鷙鸱鸷麶黐黹鼅齒齝齿鿵,Chin:亲仅今伒侭侵僅僸儘兓凚劤劲勁勤卺厪吢吣唚唫嗪噙噤嚍坅埁埐堇堻墐壗妗媇嫀嫤嬧寑寖寝寢寴尽嵚嶔嶜巹巾庈廑惍慬懃懄抋捦揿搇搢撳擒斤斳昑晉晋枃梫槿檎欽歏殣沁津浕浸溍溱漌澿濅濜瀙烬煡燼珒珡琎琴琹琻瑨瑾璡璶瘽盡矜矝砛祲禁禽秦笉筋紟紧綅緊縉缙耹芩芹荕荩菣菦菫菳蓳藎藽蚙螓螼蠄衾衿襟親覲觐觔誛謹谨賮贐赆赾近进進金釒釿鈙鈫鋟錦钅钦锓锦雂靲靳顉饉馑駸骎鬵鮼鳹鵭鹶黅齽,Ching:丼井京亰俓倞倾傹傾儆儬兢净凈凊刭剄剠勍卿圊坓坕坙埥境夝妌婙婛婧宑寈巠幜庆庼廎弪弳径徑情惊慶憬憼掅擎擏敬旌旍景晴晶暒暻曔桱梷棾樈橸檠檾櫦殑殸氢氫氰汫汬泾浄涇淨淸清漀濪瀞燝猄獍璄璟璥甠痉痙睛硘碃磬秔稉穽竞竟竧竫競竸箐粳精経經经罄聙肼胫脛腈苘茎荆荊莖菁葏葝蜻蟼誩請謦警请踁輕轻迳逕郬鏡鑋镜阱靑青靓靖靘静靚靜頃頚頸顷颈驚鯨鲭鲸鵛鶁鶄麖麠黥鼱'.split(',').forEach(function(p){var s=p.split(':');if(s[1])for(var i=0;i<s[1].length;i++)if(!m[s[1][i]])m[s[1][i]]=s[0]});
'Chiu:丘丠丩久乆九乣俅倃僦勼匓匛匶厩叴咎唒啾囚坵奺媝就崷巯巰廄廏廐恘慦扏捄揂揪揫搝摎救旧朻杦柩柾桕梂楸樛欍殏殧毬求汓汣泅浗渞湭灸煪牞犰玌玖球璆疚皳盚秋秌穐究篍糗糺糾紌紤絿緧纠肍臼舅舊舏莍萛萩蓲蘒虬虯蚯蛷蝤蝵蟗蠤裘觓觩訄訅賕赇赳趥逎逑遒邱酋酒醔釚釻銶镹阄鞦鞧韭韮鬏鬮鮂鯄鯦鰌鰍鰽鳅鳩鶖鷲鸠鹙鹫麔鼽齨龝,Chiung:侰僒儝冂冋冏卭囧坰埛宆惸憌扃桏橩泂浻澃炅炯烱焪焭煚煛煢熍熲燛琼璚瓊瓗睘瞏穷穹窘窮竆笻筇絅綗舼芎茕藑藭蘏蘔蛩蛬褧赹跫迥逈邛銎颎駉駫,Cho:丵倬劅卓叕啄啅嚽圴妰娕娖娺婥婼彴惙戳拙捉撯擆擉擢斀斫斱斲斵晫桌梲棁棳椓槕櫡歠汋浊浞涰涿濁濯灂灼炪烵犳琸硺磭禚穛穱窡窧篧籗籱綽繛绰罬腏茁蠗蠿諁諑謶诼趠踔輟辍辵辶逴酌酫鋜鐯鐲鑡镯鵫鷟齪龊,Chou:丑丒仇伷侜侴俦偢僽儔冑吜周呪咒咮喌噣嚋妯婤嬦宙州帚帱幬徟怞惆愁懤抽掫搊昼晝晭杻杽栦椆殠洲淍炿烐燽犨犫珘甃畴疇疛瘳皗皱皺盩睭瞅矁矪稠筹箒篘籀籌籒籕粙粥紂紬絒綢縐纣绉绸肘胄臭臰舟荮菗菷葤薵裯詋詶謅譸讎讐诌诪賙赒踌躊軸輈輖轴辀週遚郮酎酧酬醜醻銂雔雠霌駎駲騆驟骤魗鯞鵃鸼,Chu:丶主举乬亍伫伹佇佉住佢侏侷俱俶倨倶傗储僪儊儲具冣凥処出刍初刞剧劇劚助劬劯勮匊匤区區厨厺去取句呿咀唟啹嘱嘼囑坥坾埧埱埾墸壉壴处姖娵娶婅婮媰孎宔寠局居屈屦屨岀岖岠岨岴崌嵀嶇巈巨巪幮廚弆忂怇怐怚怵惧愳憈憷懅懼戵抅抾拀拄拒拘拠挙挶据掬搐摴據擧敊敺斪斶斸昛曯曲朐朱杵杼柱柷株桔梮椇椈椐椘楚楮榉榋榘槠樗樦橘橥橱橻檋檚櫉櫥櫧櫫櫸欅欋欘欪歜歫殶毩毱氍沮泃泏泦注洙洰浀涺淗淭渚渠湨滀滁潴澽濋濐瀦灈灟炢炬炷烛烥焗煑煮燭爠爥犋犑犓狊狙猪珠珿琚琡璖璩璴畜疰疽痀瘃癯眗眝瞩瞿矗矚矩砠砫础硃磲礎祛祝祩秬秼窋窭窶竌竐竘竚竬竹竺笁笜筁筑筥筯箸築篨篫簗簴籧粔粬粷紵紶紸絀絇絑纻绌罜罝羜翑翥耝耟耡聚聥胊胠腒臅臞舉舳艍芻苎苣苴茱茿莇莒菃菊菹葋著蒟蒢蒭蓫蕏蕖藸蘜蘧處虡蚷蛀蛆蛐蛛蜍蜛蝫蝺螶蟝蟵蠋蠩蠷蠼蠾衐衢袓袪袾裾褚襷覰覷覻觑触觸註詎詓詘詝誅誳諊諔諸讵诎诛诸豖豠豦豬貗貙貯贮趄趋趎趜趣趨跓跔跙距跦跼踀踘踞踽蹫蹰躅躆躇躕躣躯躹軀軥軴輂迬迲逐遽邭邾郹鄐醵鉅鉏鉒銖鋤鋦鋳鋸鐻鑄鑺钃钜铢铸锄锔锯镼閦閰閴闃阒阹除陱陼雎雏雛霔鞠鞫颶飓馵駆駈駏駐駒駯駶驅驧驱驹驻髷魼鮈鮔鮢鯺鰸鱁鱋鴝鴡鴸鵙鵴鶋鶪鶵鸀鸜鸲麆麈麮麯麴麹黜黢鼁鼄鼩鼰鼳齟齣齭齲齼龃龋,Chuai:啜嘬揣搋膗膪踹,Chuan:专串传佺倦傳僎僢全券剶劝劵勌勧勬勸卷叀呟啭啳喘囀圈圌圏埍埢堟塼奆奍姢姾娟婘嫥孉孨専專峑巏巛川巻帣弮恮悛惓慻拳捐捲搼撰暷权桊棬椦椽楾権權歂氚汌汱泉洤涓淃湶灷烇焆牶牷犈犬犭狷猭獧玔瑏瑑瑔瑼瓹甎畎痊眷睊睠砖硂磗磚穿竱筌篅篆篹籑絟絭絹綣縓縳绢绻罥羂脧腞膞臇舛舡舩船荃荈菤葲蒃蔨虇蜷蟤蠲蠸裐襈觠詮諯譔诠賗賺赚跧踡踳転輇輲轉转辁遄鄄鄟醛釧銓錈鎸鐉鐫钏铨锩镌闎隽雋韏顓顴颛颧飬餋饌馔駩騡鬈鰁鱄鳈鵑鶨鹃齤,Chuang:傸凔刅创刱剏剙創噇壮壯壵妆妝娤幢庄床庒怆愴戇摐摤撞桩梉樁湷漴焋牀牎牕状狀疮瘡磢窓窗窻粧糚荘莊装裝闖闯,Chueh:亅倔傕决刔劂勪匷却卻厥噘噱嚼埆塙墧孒孓屩屫崅崛嶥弡彏悫愨慤憠憰戄抉挗捔掘搉撅撧攫斍桷榷橛橜欔欮殌氒決泬灍焳熦燩爑爝爴爵獗玃玦玨珏琷瑴疦瘚瘸皵矍矡砄硞确碏確碻礐礭絕絶绝缺臄芵蒛蕝蕨虳蚗蟨蟩覐覚覺觉觖觼訣譎诀谲貜赽趉趞趹蹶蹷蹻躩逫鈌鐍鐝钁镢闋闕阕阙雀駃鴂鴃鵲鶌鷢鹊龣,Chui:倕吹坠垂埀墜娷惴捶搥桘棰椎槌沝炊甀畷硾礈笍箠綴縋缀缒腄膇菙諈贅赘轛追醊錐錘錣鎚鑆锤锥陲隹顀餟騅骓鵻龡,Chun:俊偆儁军准凖君呁唇囷均埈埻堾夋姰媋宒宭寯峮峻帬惷懏捃攈攟旾春晙暙杶桾棞椿槆橁櫄汮浚浱淳湻準滣漘濬焌燇犉珺瑃畯皲皸皹睶碅稕窀竣箘箟箺純綧纯羣群肫脣莙莼菌萅萶蒓蓴蚐蜠蝽蠢衠袀裙裠覠訰諄谆賰軍輴迍逡郡醇醕鈞銁銞錞鍕钧陖陙餕馂駿骏鮶鯙鰆鲪鵔鵕鵘鶉鶞鹑麇麏麕,Chung:中仲伀众偅充冢冲刣喠嘃埫堹塚塜妐妕媑宠寵尰崇崈幒彸徸忠忡憃憧揰摏柊歱汷沖泈浺炂煄爞狆珫瘇盅眾祌种種穜筗籦終緟终罿翀肿腫舂舯艟茺茽蔠虫蚛蝩螤螽蟲衆衝衳衶衷褈諥踵蹖蹱重鈡銃銿鍾鐘钟铳锺隀鴤鼨,E:俄偔僫匎卾厄吪呃呝咢咹噁噩囮垩堊堮妸妿姶娥娿婀屙屵岋峉峨峩崿廅恶悪惡愕戹扼搤搹擜枙櫮歞歺涐湂珴琧痾皒睋砈砐砨硆磀礘腭苊莪萼蕚蚅蛾蝁覨訛詻誐諤譌讍讹谔豟軛軶轭迗遌遏遻鄂鈋鈪鋨鍔鑩锇锷閼阏阨阸頋頞頟額顎颚额餓餩饿騀魤魥鰐鰪鱷鳄鵈鵝鵞鶚鹅鹗齃齶,Ei:誒诶,En:奀峎恩摁煾蒽,Eng:鞥,Erh:二佴侕儿児兒刵厼咡唲尒尓尔峏弍弐栭栮樲毦洏洱爾珥粫而耳聏胹荋薾衈袻誀貮貳贰趰輀轜迩邇鉺铒陑隭餌饵駬髵鮞鲕鴯鸸,Fa:乏伐佱傠发垡姂彂栰橃沷法浌灋珐琺疺発發瞂砝笩筏罚罰罸茷蕟藅醱鍅閥阀髪髮,Fan:仮凡凢凣勫匥反噃墦奿婏嬎嬏帆幡忛憣払旙旛杋柉梵棥樊橎氾汎泛渢滼瀪瀿烦煩燔犯璠畈番盕矾礬笲笵範籓籵緐繁繙羳翻膰舤舧范蕃薠藩蘩蠜襎訉販贩蹯軓軬轓返釩鐇鐢钒颿飜飯飰饭鱕鷭,Fang:仿倣匚坊埅堏妨房放方旊昉昘枋汸淓牥瓬眆紡纺肪舫芳蚄訪访趽邡鈁錺钫防髣魴鰟鲂鴋鶭,Fei:俷剕匪厞吠啡奜妃婓婔屝废廃廢悱扉斐昲暃曊朏杮棐榧櫠沸淝渄濷狒猆疿痱癈篚緋绯翡肥肺胇胐腓芾菲萉蕜蜚蜰蟦裶誹诽費费鐨镄陫霏靅非靟飛飝飞餥馡騑騛鯡鲱鼣,Fen:份偾僨兝兺分吩哛坟墳奋奮妢岎帉幩弅忿愤憤昐朆朌枌梤棻棼橨氛汾濆瀵炃焚燌燓瞓秎竕粉粪糞紛纷羒羵翂肦膹芬蒶蕡蚠蚡衯訜豮豶躮轒酚鈖鐼隫雰餴饙馚馩魵鱝鲼黂黺鼖鼢,Feng:丰仹俸偑僼冯凤凨凬凮唪堸夆奉妦寷封峯峰崶捀摓枫桻楓檒沣沨浲湗溄漨灃烽焨煈犎猦琒甮疯瘋盽砜碸篈綘縫缝艂葑蘴蜂蠭覂諷讽豐賵赗逢鄷酆鋒鎽鏠锋闏霻靊風飌风馮鳯鳳鴌麷,Fo:仏坲梻,Fou:否妚殕紑缶缹缻裦雬鴀,Fu:乀乶付伏伕佛俌俘俛俯偩傅冨冹凫刜副匐呋咈咐哹嘸坿垘垺复夫妇妋姇娐婦媍嬔孚孵富尃岪峊巿幅幞府弗弣彿復怤怫懯扶抚拂拊捬撨撫敷斧旉服枎柎柫栿桴棴椨椱榑氟泭洑浮涪滏澓炥烰焤父玞玸琈甫甶畉畐痡癁盙砆砩祓祔福禣秿稃稪竎符笰筟箙簠粰糐紨紱紼絥綍綒緮縛绂绋缚罘罦翇肤胕腐腑腹膚艀艴芙芣苻茀茯荂荴莩菔萯葍蕧虙蚥蚨蚹蛗蜅蜉蝜蝠蝮衭袝袱複褔襆襥覄覆訃詂諨讣豧負賦賻负赋赙赴趺跗踾輔輹輻辅辐邞郙郛鄜酜釜釡鈇鉘鉜鍑鍢阜阝附陚韍韨頫颫馥駙驸髴鬴鮄鮒鮲鰒鲋鳆鳧鳬鳺鴔鵩鶝麩麬麱麸黻黼,Ha:哈奤蛤铪,Hai:亥咍嗐嗨嚡塰妎孩害氦海烸胲还還酼醢頦餀饚駭駴骇骸,Han:丆佄傼兯函凾厈含哻唅喊圅垾娢嫨寒屽岾崡嵅悍憨憾捍撖撼旱晗晘暵梒歛汉汗浛浫涆涵漢澏瀚焊焓熯爳猂琀甝皔睅筨罕翰肣莟菡蔊蘫虷蚶蛿蜬蜭螒譀谽豃邗邯酣釬銲鋎鋡閈闬阚雗韓韩頇頷顄顸颔馠馯駻鬫魽鶾鼾鿰,Hang:垳夯斻杭沆珩笐筕絎绗航苀蚢貥迒頏颃魧,Hao:傐儫号哠嗥嘷噑嚆嚎壕好恏悎昊昦晧暤暭曍椃毜毫浩淏滈澔濠灏灝獆獋獔皓皜皞皡皥秏竓籇耗聕茠蒿薃薅薧號蚝蠔諕譹豪貉郝鄗鎬顥颢鰝,Hei:嘿潶黑黒,Hen:佷很恨拫狠痕詪鞎,Heng:亨哼啈堼姮恆恒悙桁横橫涥烆胻脝蘅衡鑅鴴鵆鸻,Ho:何佫劾合呵咊和哬啝喝嗃嗬垎壑姀寉峆惒抲敆曷柇核楁欱毼河涸渮澕焃煂熆熇燺爀狢癋皬盇盉盍盒碋礉禾秴穒篕籺粭紇翮翯荷菏萂蚵螛蠚袔褐覈訶訸詥謞诃貈賀贺赫郃鉌鑉闔阂阖靍靎靏鞨頜颌饸魺鲄鶡鶮鶴鸖鹖鹤麧齕龁龢,Hou:侯候厚后吼喉垕堠帿後洉犼猴瘊睺矦篌糇翭翵葔豞逅郈鄇鍭餱骺鮜鯸鱟鲎鲘齁,Hsi:习係俙傒僖兮凞匸卌卥厀吸呬咥唏唽喜喺嘻噏嚱囍墍壐夕奚媳嬆嬉屃屖屣屭嵠嶍嶲巇希席徆徙徯忚忥怬怸恄恓息悉悕惁惜慀憘憙戏戱戲扱扸昔晞晰晳暿曦析枲桸椞椺榽槢樨橀橲檄欯欷歖氥汐洗浠淅渓溪滊漇漝潝潟澙烯焁焈焟焬煕熂熄熈熙熹熺熻燨爔牺犀犔犠犧狶玺琋璽瘜皙盻睎瞦矖矽硒磎磶礂禊禧稀稧穸窸粞糦系細綌緆縘縰繥繫细绤羲習翕翖肸肹膝舃舄舾莃菥葈葸蒠蒵蓆蓰蕮薂虩蜥螅螇蟋蟢蠵衋袭襲西覀覡覤觋觹觽觿諰謑謵譆谿豀豨豯貕赥赩趇趘蹝躧邜郋郗郤鄎酅醯釳釸鈢鉨鉩錫鎴鏭鑴铣锡闟阋隙隟隰隵雟霫霼飁餏餼饩饻騱騽驨鬩鯑鰼鱚鳛鵗鸂黖鼷,Hsia:丅下乤侠俠傄匣吓嚇圷夏夓峡峽懗敮暇柙梺炠烚煆狎狭狹珨瑕疜疨睱瞎硖硤碬磍祫筪縀縖罅翈舝舺蕸虲虾蝦谺赮轄辖遐鍜鎋鎼鏬閕閜陜陿霞颬騢魻鰕鶷黠,Hsiang:乡享亯佭像勨厢向响啌嚮塂姠嶑巷庠廂忀想晑曏栙楿橡欀湘珦瓖瓨相祥稥箱絴緗缃缿翔膷芗萫葙薌蚃蟓蠁衖襄襐詳详象跭郷鄉鄊鄕銄銗鐌鑲镶響項项飨餉饗饟饷香驤骧鮝鯗鱌鱜鱶鲞麘,Hsiao:侾俲傚効呺咲哓哮啸嘋嘐嘨嘯嘵嚣嚻囂婋孝宯宵小崤庨彇恷憢揱效敩斅斆晓暁曉枭枵校梟櫹歊歗殽毊洨消涍淆潇瀟灱灲焇熽猇獢痚痟皛皢硝硣穘窙笑筊筱筿箫篠簘簫綃绡翛肖膮萧萷蕭藃虈虓蟂蟏蟰蠨訤詨誟誵謏踃逍郩銷销霄驍骁髇髐魈鴞鴵鷍鸮'.split(',').forEach(function(p){var s=p.split(':');if(s[1])for(var i=0;i<s[1].length;i++)if(!m[s[1][i]])m[s[1][i]]=s[0]});
'Hsieh:些亵伳偕偞偰僁写冩劦勰协協卨卸嗋噧垥塮夑奊娎媟寫屑屓屟屧峫嶰廨徢恊愶懈拹挟挾揳携撷擕擷攜斜旪暬械楔榍榭歇泄泻洩渫澥瀉瀣灺炧炨烲焎熁燮燲爕猲獬瑎祄禼糏紲絏絬綊緤緳繲纈绁缬缷翓胁脅脇脋膎薢薤藛蝎蝢蟹蠍蠏衺褉褻襭諧謝讗谐谢躞邂邪鞋鞢鞵韰頡齂齘齛齥龤,Hsien:仙仚伭佡僊僩僲僴先冼县咞咸哯唌啣嘕垷壏奾妶姭娊娨娴娹婱嫌嫺嫻嬐宪尟尠屳岘峴崄嶮幰廯弦忺憪憲憸挦掀搟撊撏攇攕显晛暹杴枮橌櫶毨氙涀涎湺澖瀗灦烍燹狝猃献獫獮獻玁现珗現甉痫癇癎県睍瞯硍礥祆禒秈稴筅箲籼粯糮絃絤綫線縣繊纎纖纤线缐羡羨胘腺臔臽舷苋苮莧莶薟藓藖蘚蚬蚿蛝蜆衔衘褼襳誢誸諴譣豏賢贒贤赻跣跹蹮躚輱酰醎銑銛銜鋧錎鍁鍌鑦铦锨閑閒闲限陥险陷険險霰韅韯韱顕顯餡馅馦鮮鱻鲜鶱鷳鷴鷼鹇鹹麙麲鼸,Hsin:伈伩信俽噺囟妡嬜孞廞心忄忻惞新昕杺枔欣歆炘焮盺脪舋芯薪衅襑訢訫軐辛邤釁鈊鋅鐔鑫锌阠顖馨馫馸,Hsing:侀倖兴刑哘型垶姓娙婞嬹幸形性悻惺擤星曐杏洐涬滎煋猩瑆皨睲硎箵篂緈腥臖興荇荥莕蛵行裄觪觲謃邢郉醒鈃鉶銒鋞钘铏陉陘騂骍鮏鯹鿿,Hsiu:休俢修咻嗅岫峀庥朽樇溴滫潃烋烌珛琇璓秀糔綇繍繡绣羞脙脩臹苬螑袖褎褏貅銝銹鎀鏅鏥鏽锈飍饈馐髤髹鮴鱃鵂鸺齅,Hsiung:兄兇凶匂匈哅夐忷恟敻汹洶焸焽熊胷胸訩詗詾讻诇賯雄,Hsu:伵侐俆偦冔勖勗卹叙吁呴喣嘘噓垿墟壻姁婿媭嬃幁序徐怴恤慉戌揟敍敘旭旴昫晇暊朂栩楈槒欨欰歔殈汿沀洫湑溆漵潊烅烼煦獝珝珬疞盢盨盱瞁瞲稰稸窢糈絮続緒緖縃繻續绪续聓聟胥芧蒣蓄蓿蕦藇藚虗虚虛蝑裇訏許訹詡諝譃许诩谞賉鄦酗醑銊鑐需須頊须顼驉鬚魆魖魣鱮,Hsuan:儇吅咺喧塇媗嫙宣弲怰悬愃愋懁懸揎旋昍昡晅暄暶梋楥楦檈泫渲漩炫烜煊玄玹琁琄瑄璇璿痃癣癬眩眴睻矎碹禤箮絢縇縼繏绚翧翾萱萲蓒蔙蕿藼蘐蜁蝖蠉衒袨諠諼譞讂谖贙軒轩选選鉉鋗鍹鏇铉镟鞙顈颴駽鰚,Hsueh:乴削吷坹壆学學岤峃嶨斈桖樰泶澩瀥燢狘疶穴膤艝茓蒆薛血袕觷謔谑趐踅轌辥辪雤雪靴鞾鱈鳕鷽鸴,Hsun:伨侚偱勋勛勲勳卂噀噚嚑坃埙塤壎壦奞寻尋峋巡巺巽廵徇循恂愻揗攳旬曛杊栒桪樳殉殾毥汛洵浔潠潯灥焄熏燅燖燻爋狥獯珣璕畃矄稄窨紃纁臐荀荨蔒蕈薫薰蘍蟳訊訓訙詢训讯询賐迅迿逊遜鄩醺鑂顨馴駨驯鱏鱘鲟,Hu:乎乕乥乯互俿冱冴匢匫呼唬唿喖嗀嘑嘝嚛囫垀壶壷壺婟媩嫭嫮寣岵帍幠弖弧忽怘怙恗惚戯戶户戸戽扈抇护搰摢斛昈昒曶枑楛楜槲槴歑汻沍沪泘浒淴湖滬滸滹瀫烀焀煳熩狐猢琥瑚瓠瓳祜笏箶簄粐糊絗綔縠胡膴芐苸萀葫蔛蔰虍虎虖虝蝴螜衚觳謼護軤轷鄠醐錿鍙鍸隺雐雽韄頀頶餬鬍魱鯱鰗鱯鳠鳸鵠鶘鶦鸌鹕鹱,Hua:划劃化华哗嘩埖夻姡婲婳嫿嬅崋搳摦撶杹枠桦椛槬樺滑澅猾画畫畵硴磆糀繣舙花芲華蒊蕐蘤螖觟話誮諙諣譁譮话釪釫鋘錵鏵铧驊骅鷨黊,Huai:咶坏壊壞徊怀懐懷槐櫰淮瀤耲蘹蘾褢褱踝,Huan:唤喚喛嚾圜奂奐嬛宦寏寰峘嵈幻患愌懽换換擐攌桓梙槵欢歓歡洹浣涣渙漶澣澴烉焕煥犿狟獾环瑍環瓛痪瘓睆糫絙綄緩繯缓缳羦肒荁萈萑藧讙豢豲貆貛轘逭郇酄鉮鍰鐶锾镮闤阛雈驩鬟鯇鯶鰀鲩鴅鵍鹮,Huang:偟兤凰喤堭塃墴奛媓宺崲巟幌徨怳恍惶愰慌晃晄曂朚楻榥櫎湟滉潢炾煌熀熿獚瑝璜癀皇皝皩磺穔篁篊簧縨肓艎荒葟蝗蟥衁詤諻謊谎趪遑鍠鎤鐄锽隍韹餭騜鰉鱑鳇鷬黃黄,Hui:会佪僡儶匯卉咴哕喙嘒噅噕嚖囘回囬圚婎媈嬒孈寭屶屷幑廻廽彗彙彚徻徽恚恛恢恵悔惠慧憓懳拻挥揮撝晖晦暉暳會楎槥橞檅檓櫘殨毀毁毇汇泋洃洄浍湏滙潓澮濊瀈灰灳烠烣烩煇燬燴獩珲璤璯痐瘣睳瞺禈秽穢篲絵繢繪绘缋翙翚翬翽芔茴荟蔧蕙薈薉藱蘳虺蚘蛔蛕蜖蟪袆褘詯詼誨諱譓譭譿讳诙诲豗賄贿輝辉迴逥鏸鐬闠阓隓隳靧頮顪颒餯鮰鰴麾,Hun:俒倱圂堚婚忶惛慁掍昏昬梡棔殙浑涽混渾溷焝琿睧睯繉荤葷觨諢诨轋閽阍餛馄魂鼲,Hung:仜叿吰吽呍哄嗊嚝垬妅娂宏宖弘彋揈撔晎汯泓洪浤渱渹潂澋澒灴烘焢玒玜硔硡竑竤粠紅紘紭綋红纮翃翝耾苰荭葒葓蕻薨虹訇訌讧谹谼谾軣輷轟轰鈜鉷銾鋐鍧閎閧闀闂闳霐霟鞃鬨魟鴻鸿黉黌,Huo:伙佸俰剨劐吙咟嚄嚯嚿夥奯惑或捇掝攉旤曤楇檴沎活湱漷濩瀖火獲癨眓矆矐砉祸禍秮秳穫耠耯臛艧获蒦藿蠖謋豁貨货邩鈥鍃鑊钬锪镬閄霍靃騞,Jan:冄冉呥嘫姌媣染橪然燃珃繎肰苒蒅蚦蚺衻袇袡髥髯,Jang:儴勷嚷壌壤懹攘瀼爙獽瓤禳穣穰纕蘘譲讓让躟鬤,Jao:娆嬈扰擾桡橈繞绕荛蕘襓遶隢饒饶,Je:惹热熱,Jen:人亻仁仞仭任刃刄壬妊姙屻岃忈忍忎扨朲杒栠栣梕棯牣祍秂秹稔紉紝絍綛纫纴肕腍芢荏荵葚衽袵訒認认讱躵軔轫鈓銋靭靱韌韧飪餁饪魜鵀,Jeng:仍扔礽芿辸陾,Jih:囸日釰鈤馹驲,Jo:偌叒嵶弱捼楉渃焫爇箬篛若蒻鄀鰙鰯鶸,Jou:厹媃宍揉柔楺渘煣瑈瓇禸粈糅肉腬葇蝚蹂輮鍒鞣韖騥鰇鶔,Ju:乳侞儒入嗕嚅如媷嬬孺嶿帤扖擩曘杁桇汝洳渪溽濡燸筎縟缛肗茹蒘蓐蕠薷蝡蠕袽褥襦辱邚鄏醹銣铷顬颥鱬鳰鴑鴽,Juan:偄堧壖媆撋朊瑌瓀碝礝緛耎軟輭软阮,Jui:叡壡婑枘桵橤汭瑞甤睿緌繠芮蕊蕋蕤蘂蘃蚋蜹銳鋭锐,Jun:橍润潤瞤膶閏閠闰,Jung:傇冗坈媶嫆嬫宂容峵嵘嵤嶸巆戎搈搑曧栄榕榮榵毧氄溶瀜烿熔爃狨瑢穁穃絨縙绒羢肜茙茸荣蓉蝾融螎蠑褣軵鎔镕駥髶,Ka:伽佧卡呷咔咖喀嘎嘠噶垰尕尜尬擖旮玍胩衉裃釓鉲錷钆魀,Kai:丐乢侅凯凱剀剴勓匃匄嘅垓垲塏奒姟峐嵦开忋忾恺愒愷愾慨戤揩摡改晐暟杚楷概槩槪欬溉漑炌炏烗瓂畡盖祴絠絯荄葢蒈蓋該该豥賅賌赅輆郂鈣鍇鎎鎧鐦钙铠锎锴開闓闿阣陔隑颽,Kan:乹亁仠侃倝偘冚凎凲刊勘咁坎坩埳堪塪墈尲尴尶尷崁嵁干幹忓惂感戡扞擀攼敢旰杆柑栞桿榦槛橄檊檻欿歁汵泔淦漧澉灨玕甘疳皯盰看瞰矙矸砍磡秆稈竷竿笴筸簳粓紺绀肝芉苷莰衎衦詌贑贛赣赶趕輡轗迀酐闞顑骭魐鰔鱤鳡鳱龕龛,Kang:亢伉冈冮刚剛匟囥堈堽嫝岗岡崗嵻康忼慷戅戆扛抗掆摃杠棡槓槺港漮炕焵焹牨犅犺疘矼砊穅筻粇糠綱纲缸罁罓罡肛躿邟釭鈧鋼鎠鏮钢钪閌闶鱇鿍,Kao:丂勂吿告夰尻峼拷搞攷暠杲栲槀槁槔槹橰檺櫜洘滜烤犒皋皐睾祮祰禞稁稾稿筶篙糕縞缟羔羙考膏臯菒藁藳誥诰郜銬鋯铐锆镐靠韟餻高髙髛鮳鯌鲓鷎鷱鼛,Kei:給给,Ken:亘亙哏啃垦墾恳懇掯揯搄根肎肯肻艮茛裉褃豤跟錹齦龈,Keng:刯劥吭哽坑埂堩妔峺庚挭挳摼暅更梗椩浭焿牼畊硁硜硻絚綆緪縆绠羮羹耕耿莄菮誙賡赓郠銵鍞鏗铿阬骾鯁鲠鶊鹒,Ko:个仡佮個克刻剋割勀勊匌匼可各呄咯咳哥哿嗑嗝嗰圪坷堁塥壳娔客尅岢嵑嵙嶱彁恪愅愙戈戓戨挌揢搁搕搿擱敋敤柯格棵榼槅樖櫊歌殼氪渇渴溘滆滒炣牁牫牱犐犵獦珂疙疴瞌砢硌碦磕礊礚科稞窠箇緙纥缂翗肐胢胳膈臵舸艐苛茖萪葛薖虼蛒蝌袼裓觡課諽謌课趷軻輵轕轲醘鈳鉻鎶钶铬锞镉閣閤阁隔革鞈鞷韐韚顆颏颗騍騔骒骼髁鬲鮯鴐鴚鴿鸽鿔,Kou:佝冓冦剾劶勾口叩坸垢够夠姤媾宼寇岣彀彄扣抠搆摳撀敂构枸構沟溝滱煹狗玽眍瞉瞘窛笱筘篝簆簼緱缑耇耈耉芤芶苟茩蔲蔻蚼袧褠覯觏訽詬诟豿購购遘釦鈎鉤钩雊鞲韝鷇,Ku:估俈傦僱凅刳古呱咕哭唂唃啒喾嘏嚳固圐堀堌夃姑嫴孤尳崓崫崮库庫廤愲扝扢故枯柧桍梏棝榖榾橭毂汩沽泒淈濲瀔焅牯牿狜痼瘔皷皼盬瞽矻祻秙稒穀窟笟箍箛篐糓絝縎绔罛罟羖股脵臌苦苽菇菰蓇薣蛄蛊蛌蠱袴裤褲觚詁诂谷趶跍軱軲轂轱辜逧郀酤酷鈲鈷錮钴锢雇顧顾餶馉骨骷鮕鮬鯝鲴鴣鶻鸪鹄鹘鼓鼔,Kua:侉冎刮剐剮劀卦叧咵啩坬垮夸姱寡挂挎掛栝歄煱瓜絓緺罣罫聒胍胯舿褂詿誇诖趏跨踻銙銽颪颳騧骻鴰鸹,Kuai:乖侩儈凷叏哙噲圦块塊墤夬巜廥快怪恠拐掴摑擓旝枴柺狯獪筷箉糩脍膾蒯郐鄶鱠鲙,Kuan:丱倌关冠官宽寛寬悹悺惯慣掼摜棺樌欵款歀毌泴涫潅灌爟琯瓘痯瘝癏盥矔礶祼窤窽窾筦管罆罐臗舘莞蒄覌観觀观貫贯躀輨遦錧鏆鑧鑵関闗關雚館馆髋髖鰥鱞鱹鳏鳤鸛鹳,Kuang:侊俇僙儣光况劻匡匩卝咣哐圹垙壙夼姯岲广広廣忹恇懬懭抂撗旷昿曠桄框欟況洭洸灮炗炚炛烡爌犷狂狅獷珖眖眶矌矿砿硄礦穬筐筺絋絖纊纩胱臦臩茪誆誑诓诳貺贶軖軠軦軭輄逛邝邼鄺鉱銧鋛鑛鵟黆黋,Kuei:亀亏佹傀刲刽刿劊劌匦匭匮匱厬喟喹嘳圭垝夔奎妫姽媯媿嫢嬀嬇宄尯岿嶡巂巋巙帰庋庪廆归恑悝愦愧憒戣揆摫撌攰攱昋晆晷暌朹柜桂桧椝椢楏楑槶槻槼樻檜櫃櫆櫷欳歸氿湀溃潰炔煃犪猤珪瑰璝瓌癐癸皈盔睽瞆瞡瞶硅祪禬窐窥窺筀篑簂簋簣籄聧聩聭聵胿腃膭茥葵蒉蓕蕢藈蘬蘷虁虧蛫蝰螝蟡袿襘規规觤詭謉诡貴贵跪跬蹞躨軌轨逵邽郌鄈鍨鍷鐀鑎閨闚闺陒隗鞼頄頍頯顝餽饋馈馗騤騩骙鬶鬹鬼魁鮭鱖鱥鲑鳜龜龟,Kun:丨困坤堃堒壸壼婫尡崐崑悃惃捆昆晜梱棍涃滚滾潉焜熴猑琨瑻璭睏睔睴硱磙祵稇稛綑緄绲菎蓘蔉蜫衮袞裈裍裩褌謴貇輥辊醌錕锟閫閸阃騉髠髡髨鮌鯀鯤鲧鲲鵾鶤鹍,Kung:供倥公共功匑匔厷唝埪塨孔宫宮崆工巩幊廾弓恐恭悾愩慐拱拲控攻杛栱汞涳熕珙硿碽空箜糼羾肱莻蚣觥觵貢贡躬躳躻輁錓鞏鞚髸鵼龏龔龚'.split(',').forEach(function(p){var s=p.split(':');if(s[1])for(var i=0;i<s[1].length;i++)if(!m[s[1][i]])m[s[1][i]]=s[0]});
'Kuo:呙咼啯嘓囯囶囻国圀國埚堝墎崞帼幗廓彉彍惈慖懖扩拡括挄擴果桰椁槨淉漍濄濶猓瘑筈粿綶聝腘膕菓萿葀蔮虢蛞蜾蝈蟈裹褁輠过過郭鈛錁鍋鐹锅闊阔霩鞟鞹韕頢餜馃馘髺鬠,La:剌啦喇嚹垃拉揦揧搚攋旯柆楋溂爉瓎瘌砬磖翋腊臈臘菈藞蜡蝋蝲蠟辢辣邋鑞镴鞡鬎鯻,Lai:來俫倈唻婡崃崍庲徕徠来梾棶櫴涞淶濑瀨瀬猍琜癞癩睐睞筙箂籁籟莱萊藾襰賚賴赉赖逨郲錸铼頼顂騋鯠鵣鶆麳,Lan:儖兰厱嚂囒囕壈婪嬾孄孏岚嵐幱惏懒懢懶拦揽擥攔攬斓斕栏榄欄欖欗浨滥漤澜濫瀾灆灠灡烂燗燣燷爁爛爤爦璼瓓礷篮籃籣糷繿纜缆罱葻蓝藍蘭褴襕襤襴襽覧覽览譋讕谰躝醂鑭钄镧闌阑韊顲,Lang:勆唥啷埌塱嫏崀廊斏朖朗朤桹榔樃欴浪烺狼琅瑯硠稂筤艆莨蒗蓈蓢蜋螂誏躴郎郒郞鋃鎯锒閬阆駺鿶鿾,Lao:佬僗劳労勞咾哰唠嗠嘮姥嫪崂嶗恅憥憦捞撈朥栳橑橯浶涝潦澇烙牢狫珯痨癆硓磱窂簩粩老耂耢耮荖蛯蟧躼軂轑酪醪銠鐒铑铹顟髝鮱鿲,Le:乐了仂叻忇扐楽樂氻泐玏砳竻簕肋艻阞韷餎饹鰳鳓,Lei:傫儡儽勒厽嘞垒塁壘壨嫘擂攂樏檑櫐櫑欙泪洡涙淚灅瓃畾癗矋磊磥礌礧礨禷类累絫縲纇纍纝缧罍羸耒腂蔂蕌蕾藟蘱蘲蘽虆蠝誄讄诔轠酹銇錑鐳鑘鑸镭雷靁頛頪類颣鱩鸓鼺,Leng:倰冷堎塄崚愣棱楞睖碐稜薐踜輘,Li:丽例俐俚俪傈儮儷兣凓刕利剓剺劙力励勵历厉厘厤厯厲吏呖哩唎唳喱嚟嚦囄囇坜塛壢娌娳婯嫠孋孷屴岦峛峢峲巁廲悡悧悷慄戾搮攊攦攭斄暦曆曞朸李杝枥栃栎栗栛梨梩梸棃棙樆檪櫔櫟櫪欐欚歴歷沥沴浬涖溧漓澧濿瀝灕爄爏犁犂犡狸猁珕理琍瑮璃瓅瓈瓑瓥疠疬痢癘癧皪盠盭睝砅砺砾磿礪礫礰礼禮禲离秝穲立竰笠筣篥篱籬粒粝粴糎糲綟縭纚缡罹脷艃苈苙茘荔荲莅莉菞蒚蒞蓠蔾藜藶蘺蚸蛎蛠蜊蜧蝷蟍蟸蠇蠡蠣蠫裏裡褵觻詈謧讈豊貍赲跞躒轢轣轹逦邌邐郦酈醨醴里釐鉝鋫鋰錅鎘鏫鑗锂隶隷隸離雳靂靋驪骊鬁鯉鯏鯬鱧鱱鱳鱺鲡鲤鳢鳨鴗鵹鷅鸝鹂麗麜黎黧,Liang:両两亮俍兩凉哴唡啢喨墚悢掚晾梁椋樑涼湸煷粮粱糧綡緉脼良蜽裲諒谅踉輌輛輬辆辌量鍄魉魎鿄鿌,Liao:僚叾嘹嫽寥寮尞尥尦屪嵺嶚嶛廖廫憀憭撂撩敹料暸曢漻炓燎爎爒獠璙疗療瞭窷竂簝繚缭聊膋膫蓼藔蟟豂賿蹘蹽辽遼鄝釕鐐钌镣镽飉髎鷯鹩,Lieh:儠冽列劣劽咧哷埒埓姴巤挒挘捩擸栵毟洌浖烈烮煭犣猎猟獵睙聗脟茢蛚裂趔躐迾颲鬛鬣鮤鱲鴷,Lien:亷僆劆匲匳嗹噒堜奁奩媡嫾嬚帘廉怜恋慩憐戀摙敛斂梿楝槤櫣殓殮浰涟湅溓漣潋澰濂濓瀲炼煉熑燫琏瑓璉磏簾籢籨練縺纞练羷翴联聨聫聮聯脸臁臉莲萰蓮蔹薕蘝蘞螊蠊裢裣褳襝覝謰蹥连連鄻錬鍊鎌鏈鐮链镰鬑鰊鰱鲢,Lin:临亃僯冧凛凜厸吝啉壣崊嶙廩廪恡悋懍懔拎撛斴晽暽林橉檁檩淋潾澟瀶焛燐獜琳璘甐疄痳癛癝瞵碄磷箖粦粼繗翷膦臨菻蔺藺賃赁蹸躏躙躪轔轥辚遴邻鄰鏻閵隣霖驎鱗鳞麐麟,Ling:令伶凌刢另呤囹坽夌姈婈孁岭岺嶺彾掕昤朎柃棂櫺欞泠淩澪瀮灵炩燯爧狑玲琌瓴皊砱祾秢竛笭紷綾绫羚翎聆舲苓菱蓤蔆蕶蘦蛉衑袊裬詅跉軨酃醽鈴錂铃閝阾陵零霊霗霛霝靈領领駖魿鯪鲮鴒鸰鹷麢齡齢龄龗,Liu:六刘劉嚠塯媹嬼嵧廇懰旈旒柳栁桞桺榴橊橮沠流浏溜澑瀏熘熮珋琉瑠瑬璢畂畄留畱疁瘤癅硫磂磟綹绺罶羀翏蒥蓅藰蟉裗蹓遛鋶鎏鎦鏐鐂锍镏镠雡霤飀飂飅飗餾馏駠駵騮驑骝鬸鰡鶹鷚鹠鹨麍,Lo:倮儸剆啰囉峈摞攞曪椤欏泺洛洜漯濼犖猡玀珞瘰癳硦笿箩籮絡纙络罖罗羅脶腡臝荦萝落蓏蘿螺蠃裸覙覶覼躶逻邏鏍鑼锣镙雒頱饠駱騾驘骆骡鮥鴼鵅鸁,Lou:偻僂剅喽嘍塿娄婁屚嵝嶁廔慺搂摟楼樓溇漊漏熡甊瘘瘺瘻瞜篓簍耧耬艛蒌蔞蝼螻謱軁遱鏤镂陋鞻髅髏,Lu:侓侣侶僇儢剹勎勠勴卢卤吕呂噜嚕嚧圥坴垆垏塶塷壚娽寽屡屢履峍嵂庐廘廬彔录律慮戮挔捋捛掳摝撸擄擼攎旅曥枦栌梠椂榈樐樚橹櫓櫖櫚櫨氀氇氌氯泸淕淥渌滤滷漉潞澛濾瀂瀘炉焒熝爈爐獹率玈琭璐璷瓐甪盝盧睩矑硉硵碌磠祣祿禄稆稑穋穞穭箓箻簏簬簵簶籙籚粶絽綠緑縷繂纑绿缕罏胪膂膐膔膟膢臚舮舻艣艪艫芦菉葎蓾蔍蕗藘蘆虂虏虑虜螰蠦褛褸觮謢賂赂趢路踛蹗輅轆轤轳辂辘逯郘醁鈩鋁錄録錴鏀鏕鏴鐪鑢鑥鑪铝镥閭闾陆陸露顱颅馿騄騼驢驴髗魯魲鯥鱸鲁鲈鵦鵱鷜鷺鸕鸬鹭鹵鹿麓黸,Luan:乱亂卵圝圞奱娈孌孪孿峦巒挛攣曫栾欒滦灓灤癴癵羉脔臠虊釠銮鑾鵉鸞鸾龻,Lueh:圙掠擽略畧稤鋝鋢锊,Lun:仑伦侖倫囵圇埨婨崘崙惀抡掄棆沦淪溣碖磮稐綸纶耣腀菕蜦論论踚輪轮錀陯鯩,Lung:儱咙哢嚨垄垅壟壠屸嶐巃巄徿拢攏昽曨朧栊梇槞櫳泷湰滝漋瀧爖珑瓏癃眬矓砻礱礲窿竉竜笼篢篭籠聋聾胧茏蕯蘢蠪蠬襱豅贚躘鏧鑨陇隆隴霳靇驡鸗龍龒龓龙,Ma:亇傌吗唛嗎嘛嘜妈媽嫲嬤嬷孖杩榪溤犘犸獁玛瑪痲睰码碼礣祃禡罵蔴蚂螞蟆蟇遤鎷閁馬駡马骂鬕鰢鷌麻,Mai:买佅劢勱卖嘪埋売脈脉荬蕒薶衇買賣迈邁霡霢霾鷶麥麦鿏鿺,Man:僈墁姏嫚屘幔悗慢慲摱曼槾樠満满滿漫澷熳獌睌瞒瞞矕縵缦蔄蔓蘰蛮螨蟎蠻襔謾谩鄤鏋鏝镘鞔顢颟饅馒鬗鬘鰻鳗,Mang:吂哤壾娏尨庬忙恾杗杧氓汒浝漭牤牻狵痝盲硥硭笀芒茫茻莽莾蛖蟒蠎邙釯鋩铓駹,Mao:乮兞冃冇冐冒卯堥夘媢峁帽愗懋戼旄昴暓枆柕楙毛毷氂泖渵牦犛猫瑁皃眊瞀矛笷罞耄芼茂茅茆萺蓩蝐蝥蟊袤覒貌貓貿贸軞鄚鄮酕鉚錨铆锚髦髳鶜,Mei:凂呅坆堳塺妹娒媄媒媚媺嬍寐嵄嵋徾抺挴攗旀昧枚栂梅楣楳槑毎每沒没沬浼渼湄湈煝煤燘猸玫珻瑂痗眉眛睂睸矀祙禖穈篃美脄脢腜苺莓葿蘪蝞袂跊躾郿酶鋂鎂鎇镁镅霉韎鬽魅鶥鹛黣黴,Men:们們悶懑懣扪捫暪椚焖燜玧璊菛虋鍆钔門閅门闷,Meng:儚冡勐夢夣孟幪懜懞懵掹擝曚朦梦橗檬氋溕濛猛獴瓾甍甿盟瞢矇矒礞艋艨莔萌蒙蕄蘉虻蜢蝱蠓鄳鄸錳锰霥霿靀顭饛鯍鯭鸏鹲鼆,Mi:侎冖冞冪咪嘧塓孊宓宻密峚幂幎幦弥弭彌戂擟攠敉榓樒櫁汨沕沵泌洣淧渳滵漞濔濗瀰灖熐爢猕獼瓕眫眯瞇祕祢禰秘簚米粎糜糸縻羃羋脒芈葞蒾蔝蔤藌蘼蜜袮覓覔覛觅詸謎謐谜谧迷醚醾醿釄銤镾靡鸍麊麋麛麿鼏鿹,Miao:喵妙媌嫹庙庿廟描杪淼渺玅眇瞄秒竗篎緢緲缈苗藐邈鱙鶓鹋,Mieh:乜吀咩哶孭幭懱搣櫗滅灭烕篾蔑薎蠛衊覕鑖鱴鴓,Mien:丏偭免冕勉勔喕娩婂媔嬵宀愐杣棉檰櫋汅沔渑湎澠眄眠矈矊矏糆絻綿緜緬绵缅腼臱芇葂蝒面靣鮸麪麫麵麺黽,Min:僶冺刡勄垊姄岷崏忞怋悯惽愍慜憫抿捪敃敏敯旻旼暋民泯湣潣珉琘琝瑉痻皿盿砇碈笢笽簢緍緡缗罠苠蠠鈱錉鍲閔閩闵闽鰵鳘鴖黾,Ming:佲冥凕名命姳嫇慏掵明暝朙椧榠洺溟猽眀眳瞑茗蓂螟覭詺鄍酩銘铭鳴鸣,Miu:謬谬,Mo:劘劰唜嗼嚤嚩嚰圽塻墨妺嫫嫼寞尛帓帞庅怽懡抹摩摸摹擵昩暯末枺模橅歾歿殁沫湐漠瀎爅獏瘼皌眜眽眿瞐瞙砞磨礳秣粖糢絈纆耱膜茉莈莫蓦藦蘑蛨蟔謨謩谟貃貊貘銆鏌镆陌靺饃饝馍驀髍魔魩魹麽默黙,Mou:侔劺哞恈某洠牟眸瞴繆缪蛑謀谋踎鉾鍪鴾麰,Mu:亩仫凩募坶墓墲姆峔幕幙慔慕拇暮木朰楘母毣毪氁沐炑牡牧牳狇畆畒畝畞畮目睦砪穆縸胟艒苜莯蚞踇鉧鉬钼雮霂鞪,Na:乸吶呐哪嗱妠娜拏拿挐捺笝納纳肭蒳衲袦豽貀軜那鈉鎿钠镎雫靹魶,Nai:乃倷奈奶嬭孻廼摨柰氖渿熋疓耏耐腉艿萘螚褦迺釢錼鼐,Nan:侽南喃囡娚婻戁抩揇暔枏柟楠湳煵男畘腩莮萳蝻諵赧遖难難,Nang:乪儾嚢囊囔擃攮曩欜灢蠰譨饢馕鬞齉,Nao:匘呶垴堖夒嫐孬峱嶩巎怓恼悩惱憹挠撓淖猱獶獿瑙硇碙碯脑脳腦臑蛲蟯詉譊鐃铙閙闹鬧,Ne:呢抐疒眲訥讷,Nei:內内娞氝脮腇錗餒馁鮾鯘,Nen:嫩嫰恁,Neng:能,Ni:伱伲你倪儗儞匿坭埿堄妮妳婗嫟嬺孴尼屔屰怩惄愵抳拟擬旎昵晲暱柅棿檷氼泥淣溺狔猊眤睨秜籾縌聣聻胒腝腻膩臡苨薿蚭蜺觬誽貎跜輗迡逆郳鈮铌隬霓馜鯢鲵麑齯鿭,Niang:娘嬢孃酿醸釀,Niao:嫋嬝嬲尿樢脲茑蔦袅裊褭鳥鸟,Nieh:啮喦嗫噛嚙囁囓圼孼孽嵲嶭巕帇惗捏揑摰敜枿槷櫱涅湼痆篞籋糱糵聂聶臬臲苶菍蘖蠥讘踂踗踙蹑躡錜鎳鑈鑷钀镊镍闑陧隉顳颞齧,Nien:卄哖唸埝姩年廿念拈捻撚撵攆涊淰焾碾秊秥簐艌蔫跈蹍蹨躎輦辇辗鮎鯰鲇鲶鵇黏,Nin:囜您拰脌,Ning:佞侫倿儜凝咛嚀嬣宁寍寕寗寜寧拧擰柠橣檸泞澝濘狞獰甯矃聍聹苧薴鑏鬡鸋,Niu:妞忸扭汼炄牛牜狃紐纽莥鈕钮靵,No:傩儺喏愞懦懧挪掿搦搻梛榒橠稬穤糑糥糯諾诺蹃逽郍锘,Nu:伮傉努女奴孥弩怒恧搙朒沑砮笯籹胬衂衄釹钕駑驽,Nuan:奻暖渜煖煗餪,Nueh:疟瘧硸虐,Nung:侬儂农哝噥弄挊挵檂欁浓濃燶癑禯秾穠繷脓膿蕽襛農辳醲齈,O:哦喔噢,Ou:偶吘呕嘔塸怄慪櫙欧歐殴毆沤漚熰瓯甌筽耦腢膒蕅藕藲謳讴鏂鴎鷗鸥齵,Pa:丷仈八叐叭吧哵啪坝坺垻墢壩夿妑妭岜峇巴巼帊帕弝怕扒把抜拔捌掱朳杷柭欛潖灞炦爬爸犮玐琶疤癹皅矲笆筢粑紦罢罷羓耙胈舥芭茇菝葩蚆袙覇詙豝趴跁跋軷釛釟鈀钯霸靶颰魃魞鮊鲃鲅鲌鼥鿱,Pai:佰俳哌庍廹徘拍拜拝挀捭排掰摆擘擺敗柏栢棑派渒湃牌犤猅猈瓸白百稗竡簰簲粨粺絔蒎薭襬贁败輫鎃韛'.split(',').forEach(function(p){var s=p.split(':');if(s[1])for(var i=0;i<s[1].length;i++)if(!m[s[1][i]])m[s[1][i]]=s[0]});
'Pan:伴冸判办半叛坂坢姅媻岅幋怑扮扳拌拚搫搬攀攽斑斒昄板柈槃沜泮洀湴溿潘瀊炍爿版牉班瓣瓪畔畨瘢癍盘盤盼眅磐磻秚粄絆縏绊聁舨般萠蒰蝂螁螌蟠袢褩襻詊跘蹒蹣辦辬鈑鉡鋬鎜鑻钣闆阪靽鞶頒頖颁魬鳻鵥,Pang:乓傍厐厖嗙垹塝嫎帮幇幚幫庞彷徬捠搒旁梆棒棓榜沗浜滂炐牓玤磅稖綁縍绑耪肨胖胮膀膖舽艕蒡蚌蜯螃覫謗谤逄邦邫鎊镑雱霶鞤髈鳑龎龐,Pao:佨保儤刨勹勽包匏咆垉堡堢報奅媬嫑孢宝宲寚寳寶庖忁怉抛报抱拋暴曓枹泡炮炰煲爆爮狍珤疱皰砲礟礮窇笣緥胞脬苞菢萢葆蕔薄藵虣蚫袌袍褒褓褜襃豹賲趵跑軳鉋鑤铇闁雹靌靤鞄飹飽饱駂骲髱鮑鲍鳵鴇鸨麃麅麭齙龅,Pei:伂佩俖俻倍偝偹備僃北卑呗呸唄培备姵孛嶏帔怌悖悲惫愂憊揹斾旆昁杯柸桮梖椑毰沛浿焙牬犕狈狽珮珼琲盃碑碚禙糒肧背胚苝蓓蓜藣蛽衃被裴裵褙誖貝賠贝赔軰輩轡辈辔邶郥鄁配醅鉳鋇鐾钡锫阫陂陪霈鞁鞴馷駍骳鵯鹎,Pen:倴呠喯喷噴坋坌奔奙捹撪本栟桳楍歕泍渀湓犇獖瓫畚盆笨翉翸苯葐贲輽逩錛锛,Peng:伻倗傰剻匉嘣嘭埄埲堋塳塴奟崩嵭弸彭怦恲憉抨挷捧掽揼朋梈棚椖椪槰樥泵淎漰澎烹熢琣琫甏甭痭皏砰硑硼碰磞祊稝竼篣篷絣綳繃纄绷膨芃莑菶蓬蘕蟚蟛踫蹦軯輣迸逬錋鏰鑝镚閍閛鞛韸韼騯髼鬅鬔鵬鹏,Pi:丕仳伓伾佊佖俾偪僻劈匕匹吡哔啚啤嗶噼噽嚊嚭圮坒坯埤堛壀壁夶奰妣妼婢媲嫓嬖嬶屁屄岯崥币幣幤庀庇庳廦弊弻弼彃彼必怭怶悂愊愎憵批披抷揊擗敝斃旇朇朼枇枈柀柲梐楅榌比毕毖毗毘毙毞毴沘淠湢滗滭潎潷澼濞炋焷煏熚狉狓狴獘獙珌琵璧甓畀畁畢疈疋疕疪疲痞痹痺癖皕皮睤睥砒碧磇礔礕禆秕秛秠稫笓笔筆筚箄箅箆篦篳篺粃粊紕綼縪繴纰罴罼羆翍耚聛肶脴脾腗腷膍臂舭芘苉苾荜荸萆萞蓖蓽蔽薜蚍蚽蚾蜌蜱螕螷蠯袐裨襅襞襣觱詖諀譬诐豍豼豾貏貔貱賁贔赑跸蹕躃躄辟逼避邲邳郫鄙鄨鄪釽鈚鈹鉍鉟銔銢錃錍鎞鏎鐴铋铍閇閉閟闢闭阰陛陴霹鞸韠飶饆馝駓駜驆髀髬髲魓魮魾鮅鮍鰏鲏鲾鴄鵖鵧鷝鷩鷿鸊鼊鼙鼻,Piao:俵僄儦剽勡嘌墂婊嫖幖彪彯徱慓摽旚杓标標檦殍淲滮漂瀌灬熛爂犥猋瓢瘭皫瞟磦票穮篻縹缥翲脿膘臕蔈薸藨螵表裱褾諘謤贆醥錶鏢鑣镖镳闝顠颩颮颷飃飄飆飇飈飊飑飘飙飚驃驫骉骠髟魒鰾鳔,Pieh:丿別别咇嫳彆徶憋撆撇暼氕瘪癟瞥苤莂虌蛂蟞襒蹩鐅鱉鳖鼈龞,Pien:便偏匾卞变囨変媥峅弁徧忭惼扁抃揙昪楄楩汳汴炞煸片牑犏猵獱玣甂砭碥稨窆笾箯篇籩糄編緶缏编翩胼腁艑苄萹藊蝙褊覍覑諚諞變谝貵貶賆贬跰蹁辡辧辨辩辫辮辯边辺遍邉邊釆鍂鍽閞鞭駢騈騗騙骈骗骿魸鯾鯿鳊鴘鶣,Pin:傧儐品嚬姘娦嫔嬪宾彬拼摈擯斌梹椕榀槟檳殡殯氞汃汖滨濒濱濵瀕牝玢玭琕瑸璸矉砏礗穦繽缤聘膑臏薲虨蠙豩豳貧賓賔贫邠鑌镔霦頻顮顰频颦馪驞髌髕髩鬂鬓鬢,Ping:丙並乒仌仒併俜倂偋傡兵冫冰凭凴呯坪垪塀娉寎屏屛岼帡帲幈平并幷庰怲慿憑抦掤摒昞昺枰柄栤棅檘氷泙洴涄淜炳焩玶瓶甁甹病眪砯禀秉稟窉竝竮箳簈缾聠胓艵苪苹荓萍蓱蘋蚲蛃蛢評誁评軿輧邴郱鈵鉼鋲陃靐鞆鞞頩餅餠饼鮃鮩鲆,Po:亳仢伯侼僠僰剝剥勃博卜叵哱啵嘙嚗坡婆孹尀岥岶嶓帗帛愽懪拨挬搏撥播敀昢桲檗櫇欂泊波泼洦浡淿渤溊溌潑烞煿牔犦犻狛猼玻珀瓝瓟癶癷皤盋破砵砶碆礡礴秡笸箔箥簙簸粕糪紴缽肑胉脖膊舶艊苩菠萡葧蒪蔔蔢蘗袚袯袰袹襏襮謈譒豰跛踣蹳迫郣鄱酦醗釙鈸鉑鉕鉢鋍鎛鏺鑮钋钵钷钹铂镈頗颇餑餺饽馎馛馞駁駊駮驋驳髆髉魄鮁鱍鵓鹁,Pu:不仆佈僕勏匍卟吥咘哺喸噗圃圑圤埔埗埠墣峬巬巭布庯廍怖悑扑抪捕捗撲擈攴攵晡普暜曝朴柨樸檏步歨歩氆浦溥潽濮瀑炇烳獛璞瓿瞨穙篰簿纀脯舖舗荹莆菐菩葡蒱蒲蔀补補誧諩譜谱贌踄蹼轐逋部郶酺醭鈈鈽鋪鏷鐠钚钸铺镤镨陠餔餢鯆鳪鵏鸔鿻,Sa:仨卅挱挲摋撒櫒泧洒潵灑脎萨薩虄訯躠鈒钑隡靸颯飒馺,Sai:僿嗮嘥噻塞愢揌毢毸簺腮賽赛顋鰓鳃,San:三仐伞俕傘厁叁壭帴弎散橵毵毶毿犙糁糂糝糣糤繖鏒鏾閐饊馓鬖,Sang:丧喪嗓搡桑桒槡磉褬鎟顙颡,Sao:埽嫂慅扫掃掻搔氉溞瘙矂繅缫臊螦騒騷骚髞鰠鱢鳋,Se:啬嗇懎擌栜歮歰洓涩渋澀澁濇濏瀒琗瑟璱瘷穑穡穯繬色譅轖銫鏼铯閪雭飋,Sen:森椮槮襂,Seng:僧鬙,Sha:乷倽傻儍刹剎厦唦唼啑啥喢帹廈杀桬榝樧歃殺毮沙煞猀痧砂硰箑粆紗繌纱翜翣莎萐蔱裟鎩铩閯霎魦鯊鯋鲨,Shai:晒曬筛篩簁簛繺酾釃閷,Shan:傓僐删刪剡剼善嘇圸埏墠墡姍姗嬗山幓彡扇挻掞搧擅敾晱杉柵椫樿檆歚汕潬潸澘灗炶煔煽熌狦珊疝痁睒磰笘縿繕缮羴羶脠膳膻舢芟苫蟮蟺衫覢訕謆譱讪贍赡赸跚軕邖鄯釤銏鐥钐閃閊闪陕陝饍騸骟鯅鱓鱔鳝鿃,Shang:丄上伤傷商垧墒尙尚恦慯扄晌殇殤滳漡熵緔绱蔏螪裳觞觴謪賞贘赏鑜鞝鬺,Shao:劭勺卲哨娋少弰捎旓柖梢潲烧焼燒玿睄稍筲紹綤绍艄芍苕莦蕱蛸袑輎邵韶颵髾鮹,She:佘厍厙奢射弽慑慴懾捨摂摄摵攝檨欇歙涉涻渉滠灄猞畬畲社舌舍舎蔎虵蛇蛥蠂設设賒賖赊赦輋韘騇麝,Shen:什伸侁侺兟呻哂堔妽姺娠婶嬸审宷審屾峷弞愼慎扟敒昚曋曑柛棽椹榊氠沈涁深渖渗滲瀋燊珅甚甡甧申瘆瘮眒眘瞫矤矧砷神祳穼籶籸紳绅罙罧肾胂脤腎莘葠蓡蔘薓蜃蜄裑覾訠訷詵諗讅诜谂谉身邥鋠頣駪魫鯓鯵鰰鰺鲹鵢,Sheng:偗剩剰勝升呏圣墭声嵊憴斘昇晠曻枡栍榺橳殅泩渻湦焺牲狌珄琞生甥盛省眚竔笙縄繩绳聖聲胜苼蕂譝貹賸鉎鍟阩陞陹鵿鼪,Shih:世丗乨乭亊事仕似佦使侍兘冟势勢匙十卋叓史呞呩嗜噬埘塒士失奭始姼媞嬕实実室宩寔實尸屍屎峕崼嵵市师師式弑弒徥忕恀恃戺拭拾揓施时旹是昰時枾柹柿栻榁榯氏浉湜湤湿溡溮溼澨濕炻烒煶狮獅瑡眂眎眡睗矢石示礻祏竍笶筮篒簭籂絁舐舓莳葹蒒蒔蓍虱蚀蝕蝨螫褷襫襹視视觢試詩誓諟諡謚識识试诗谥豉豕貰贳軾轼辻适逝遈適遾邿釈释釋釶鈰鉂鉃鉇鉈鉐鉽銴鍦铈食飠飾餙餝饣饰駛驶鮖鯴鰘鰣鰤鲥鲺鳲鳾鶳鸤鼫鼭,Shou:兽収受售垨壽夀守寿手扌授收涭狩獣獸痩瘦綬绶膄艏鏉首龵,Shu:书侸倏倐儵叔咰塾墅姝婌孰尌尗属屬庶庻怷恕戍抒捒掓摅攄数數暏暑曙書朮术束杸枢树梳樞樹橾殊殳毹毺沭淑漱潄潻澍濖瀭焂熟瑹璹疎疏癙秫竖竪糬紓絉綀纾署腧舒荗菽蒁蔬薥薯藷虪蜀蠴術裋襡襩豎贖赎跾踈軗輸输述鄃鉥錰鏣陎隃鮛鱪鱰鵨鶐黍鼠鼡,Shua:刷唰耍誜,Shuai:卛帅帥摔甩蟀衰,Shuan:拴栓涮腨閂闩,Shuang:双塽孀孇慡樉欆漺灀爽礵縔艭鏯雙霜騻驦骦鷞鸘鹴,Shui:帨水氵氺涗涚睡祱稅税脽裞誰谁閖,Shun:吮橓瞚瞬舜蕣順顺鬊,Shuo:哾妁搠朔槊欶烁爍獡矟硕碩箾蒴說説说鎙鑠铄,So:乺傞唆唢嗍嗦嗩娑惢所摍暛桫梭溑溹琐琑瑣璅睃簑簔索縮缩羧莏蓑蜶褨趖逤鎈鎍鎖鎻鏁锁髿鮻,Sou:傁凁叜叟嗖嗽嗾廀廋捜搜摉摗擞擻櫢溲獀瘶瞍籔艘蒐蓃薮藪螋鄋醙鎪锼颼颾飕餿馊騪,Ssu:丝亖佀価俬儩兕凘厮厶司咝嗣嘶噝四姒娰媤孠寺巳廝思恖撕斯杫柶楒榹死汜泀泗泤洍涘澌瀃燍牭磃祀禗禠禩私竢笥籭糹絲緦纟缌罳耜肂肆蕬蕼虒蛳蜤螄蟖蟴覗貄釲鈶鈻鉰銯鋖鐁锶颸飔飤飼饲駟騦驷鷥鸶鼶,Su:俗傃僳嗉囌塐塑夙嫊宿愫愬憟梀榡樎樕橚櫯殐泝洬涑溯溸潚潥玊珟璛甦碿稣穌窣簌粛粟素縤肃肅膆苏莤蔌藗蘇蘓觫訴謖诉谡趚蹜速遡遬酥鋉餗驌骕鯂鱐鷫鹔,Suan:匴狻痠祘笇筭算蒜酸,Sui:亗倠哸埣夊嬘岁嵗旞檖歲歳浽滖澻濉瀡煫熣燧璲瓍眭睟睢砕碎祟禭穂穗穟綏繀繐繸绥膸芕荽荾葰虽襚誶譢谇賥遀遂邃鐆鐩隋随隧隨雖鞖韢髄髓,Sun:孙孫损損搎榫槂狲猻笋筍箰簨荪蓀蕵薞鎨隼飧飱鶽,Sung:倯傱凇娀宋崧嵩嵷庺忪怂悚愯慫憽松枀枩柗梥楤檧淞濍硹竦耸聳菘蜙訟誦讼诵送鍶鎹頌颂餸駷鬆,Ta:亣他侤剳匒呾咑咜哒嗒噠嚃嚺垯塌塔墖墶大她妲它崉怛打挞搨搭撘撻榙榻橽毾汏沓涾溚溻澾濌炟燵牠狧獭獺畗畣瘩眔祂禢笚笪答繨羍耷荅荙薘蟽褟褡詚誻譶趿跶踏蹋蹹躂躢达迏迖迚逹達遝遢錔鎉鎝鐽铊闒闥闧闼阘靼鞑鞜鞳韃鮙鰨鳎龖龘鿎,Tai:代侢傣儓冭叇台呆呔囼坮垈埭太夳嬯孡岱帒带帯帶廗待忲态怠態懛戴抬擡旲曃枱柋檯歹殆汰泰溙瀻炱炲燤獃玳瑇甙箈簤籉粏紿緿绐肽胎臺舦艜苔菭薹蚮袋襶貸贷跆蹛軑軚軩轪迨逮邰酞鈦钛霴靆颱駘骀鮐鮘鲐鴏黛黱,Tan:丹亶伔但倓傝僋僤儋刐勯匰单単叹啖啗啿單嗿嘆嘾噉嚪坍坛坦埮墰墵壇壜妉婒媅帎弹弾彈忐怹惔惮憚憛憳憺憻抌担探掸摊撢撣擔擹攤旦昙暺曇柦榃檀歎殚殫毯氮沊泹淡湠滩潭澸澹灘炭燂狚玬璮瓭甔疍疸痑痰瘅瘫癉癚癱眈砃碳磹禫窞箪簞紞繵罈罎耼耽聃聸胆腅膽舑舕菼萏蓞藫蛋蜑衴袒褝襌襢覃觛誕談譚譠诞谈谭貚貪賧贉贪赕躭郯郸鄲醈醓醰鉭錟钽锬霮頕顃餤饏馾駳髧鴠黕黮鿕,Tang:伖倘偒傏傥儅儻党凼劏唐啺嘡噹圵坣垱堂塘壋婸宕嵣帑当愓戃挡搪摥擋攩曭档棠榶樘橖檔欓氹汤淌湯溏漟潒澢灙烫煻燙爣珰瑭璗璫瓽當盪瞊矘砀碭磄礑禟筜篖簜簹糃糖糛羰耥膅膛艡荡菪蓎蕩薚蘯蝪螗螳蟷裆襠譡讜谠赯趟趤踼蹚躺逿鄌醣鎕鎲鏜鐋鐺钂铛铴镋镗闛闣隚雼鞺餳餹饄饧鶶黨鼞'.split(',').forEach(function(p){var s=p.split(':');if(s[1])for(var i=0;i<s[1].length;i++)if(!m[s[1][i]])m[s[1][i]]=s[0]});
'Tao:倒刀刂到匋叨咷啕噵壔夲套嫍导導岛島嶋嶌嶹幍弢忉悼慆捣捯掏搗搯擣朷桃梼椡槄槝檤檮氘洮涛淘滔濤焘燾瑫瓙盗盜祷祹禂禱稲稻箌絛綯縚縧纛绦绹翢翿舠艔菿萄蜪衜衟裪討詜謟讨蹈軇轁迯逃道醄釖鋾錭陦陶隝隯鞀鞉鞱韜韬飸饀饕駣騊魛鱽鼗,Te:嘚得徳德忑忒恴悳惪慝棏淂特的脦螣蟘貣鋱鍀铽锝,Teng:儯凳噔墱嬁嶝幐戥朩櫈滕漛灯熥燈璒疼痋登瞪磴竳等簦籐籘縢腾膯艠藤虅覴誊謄豋蹬邆邓鄧鐙镫隥霯駦騰驣鰧鼟,Ti:仾低体俤倜偍偙僀剃剔厎厗呧唙啇啲啼嗁嘀嚁嚏嚔地坔坘埊埞堤墑墬奃娣媂嫡屉屜崹嶳帝底廸弟弤彽徲怟悌悐惕惖惿慸戻抵拞挮掋掦提揥摕擿敌敵旳替朑杕枤柢梊梑梯棣楴樀歒殢氐洟涕涤渧滌滴漽焍牴狄玓珶瑅瓋甋眱睇砥碮碲磾祶禘禵稊笛第笹篴籊籴糴綈締緹绨缇缔罤羝翟聜腣苐苖荑荻菂菧蒂蔋蔐蔕蕛薙藡蝃蝭螮袛裼褅褆覿觌觝詆諦謕诋谛豴趆趧趯踢踶蹄蹏蹢躰軆軧迪递逓逖逷遆遞遰邸醍釱鉪銻鍉鍗鏑锑镝阺隄靮鞮頔題题馰騠骵骶體髢髰鬀鬄鮧鮷鯳鯷鳀鴺鵜鶗鶙鷈鷉鷤鸐鹈,Tiao:伄佻凋刁刟叼吊奝嬥宨屌岧岹庣弔弴彫恌扚挑掉斢旫晀朓条條樤殦汈琱瘹眺瞗碉祒祧窎窕窱窵竨笤簓粜糶絩聎脁芀萔蓚蓧蓨藋虭蛁蜩螩覜訋誂調调貂趒跳迢釣鈟銱鋚鋽鎥鑃钓铞铫雕雿鞗髫魡鮉鯈鯛鰷鲦鲷鳭鵰鼦齠龆,Tieh:僣叠呫哋喋嗲垤堞峌嵽帖幉怗恎惵戜挕揲昳曡殜氎爹牃牒瓞畳疂疉疊眣眰碟絰绖耊耋聑胅臷艓苵萜蛈蜨蝶褋褺詄諜谍貼贴趃跌蹀迭銕鐡鐵铁镻飻餮驖鰈鲽鴩,Tien:佃倎傎兲典厧唺嚸坫垫塡填墊壂天奌奠婖婝婰屇嵮巅巓巔店忝恬悿惦扂掂掭搷攧敁敟晪椣槇槙橂橝殄殿沺淀淟添湉滇澱点猠玷琔琠璳甛甜田电甸畋畑畠痶瘨癜癫癲盷睓睼碘碵磌窴簟緂胋腆舔舚菾蒧蕇蜔覥觍賟跕踮蹎酟鈿錪鍩钿闐阗阽電靔靛靝靦顚顛颠餂驔鴫鷆鷏黇點齻鿬,Ting:丁亭仃侹停厅厛叮听啶圢奵娗婷定嵉嵿帄庁庭廰廳廷忊挺桯梃椗楟榳汀涏渟濎烃烴烶玎珽町甼疔盯矴碇碠磸筳綎耓耵聢聤聴聼聽脡腚艇艼莛萣葶薡虰蜓蝊蝏訂誔諪订邒酊釘鋌錠鐤钉铤锭閮霆靪鞓頂頲顁顶颋飣饤鼎鼑鼮,Tiu:丟丢銩铥,To:乇亸仛佗侂凙刴剁剟剫咃咄哆哚唾喥嚉嚲坨垛垜埵堕堶墮墯多夛夺奪奲妥媠嫷尮岮崜嶞庹彵惰憜托扡拓拕拖挅挆挩捝掇敓敚敠敪朵朶杔柁柝柮桗椭椯楕槖橐橢毤毲毻汑沰沱沲涶狏畓痥砣砤碢箨籜紽綞缍脫脱舵莌萚蘀袉袥裰託讬趓跅跎跢跥跺踱躱躲軃迱酡鈬鐸铎陀陁陊陏飥飿饦饳馱駄駝駞騨驒驝驮驼鬌魠鮀鮵鰖鴕鵎鵽鸵鼉鼍鼧鿳鿸,Tou:乧亠偷偸兜兠吺唗唞头妵婾媮投抖敨斗斣枓梪橷毭浢痘窦竇篼紏綉緰脰荳蔸蘣蚪豆透逗郖都酘鈄鋀鍮钭閗闘阧陡頭飳餖饾骰鬥鬦鬪鬬鬭黈,Tsa:偺匝咂咋喒嚓囃囋囐帀拶擦攃杂沞沯砸磼礤礸紥紮臜臢襍迊遪鉔雑雜雥韴魳,Tsai:仔倸偲傤儎再哉啋在埰婇宰寀崽彩才扗採材栽棌毝洅渽溨災灾烖猜甾睬睵綵縡縩纔菑菜蔡裁財賳财跴踩載载酨采,Tsan:傪儏儧儹兂参參叄叅咱喰噆嬠孱寁惨惭慘慙慚憯掺揝摻撍攅攒攢昝暂暫朁桚残殘湌澯濽灒灿燦爘璨瓉瓒瓚禶穇篸簪簮粲糌薒蚕蝅蠶蠺襸謲讃讚賛贊赞趱趲蹔鄼酇錾鏨鐕鐟飡餐饡驂骖黪黲,Tsang:仓仺伧倉傖匨塟奘嵢弉欌沧滄濸牂獊羘脏臓臟臧舱艙苍葬蒼蔵藏螥賍賘賶贓贜赃銺鑶駔驵髒鶬鸧,Tsao:傮凿唕唣喿嘈噪嶆愺慥懆撡操早曹曺枣栆梍棗槽漕澡灶煰燥璪皁皂竃竈簉糙糟繰肏艁艚艸艹草蓸薻藻蚤螬褿襙譟趮蹧躁造遭鄵醩鏪鑿騲,Tse:仄伬侧側冊册则則厕厠唶啧嘖墄夨嫧崱帻幘庂廁恻惻憡択择拺捑擇敇昃昗樍歵汄沢泎泽测測溭澤畟皟瞔矠礋笧笮策筞筴箣箦簀簎粣舴荝萗萴蓛蔶蠌襗諎謮責賾责赜迮鸅齚齰,Tsei:戝蠈賊贼鯽鰂鱡鲗,Tsen:囎岑嵾怎梣涔笒譖譛谮,Tseng:噌増增层層嶒憎曽曾橧熷璔甑矰磳竲繒缯罾譄贈赠蹭鄫鋥锃驓鱛,Tso:佐作侳做剉剒厝咗唑坐夎岝岞嵯嵳左座怍挫捽措搓撮斮昨棤椊琢瑳痤睉矬磋祚秨稓筰糳繓胙脞莋莝莡葃葄蒫蓌蓙蔖虘袏蹉躦逪遳酂醝鈼銼錯锉错阼飵鹺鹾,Tsou:凑奏揍棷棸楱湊箃緅腠菆諏诹走赱輳辏邹郰鄒鄹陬騶驺鯐鯫鲰黀齱齺龰,Tsu:促俎傶卆卒哫唨噈媨崒崪徂憱族殂爼猝珇瘄瘯祖租箤簇粗組縬组脨葅蒩蔟觕詛誎诅趗足踤踧踿蹙蹴蹵酢醋鎺鏃镞阻靻顣麁麄麤鼀,Tsuan:巑撺攛攥櫕欑殩汆熶爨穳窜竄篡簒籫繤纂纉纘缵蹿躜躥鋑鑚鑹鑽钻镩,Tsui:乼伜倅催凗厜啐啛嗺嘴噿墔崔嶉嶊嶵忰悴慛摧晬最朘栬榱槜槯樶檇檌毳淬漼濢焠獕璀璻疩瘁皠磪祽稡穝竁粋粹紣絊綷縗纗缞罪翆翠脃脆脺膬膵臎萃蕞蟕襊趡辠酔酻醉鋷錊鏙顇,Tsun:侟僔刌吋噂墫壿存寸尊嶟忖拵捘撙村樽澊皴竴籿繜罇膥譐踆遵邨銌鐏鱒鳟鶎鷷,Tsung:丛从倊倧偬傯匆叢囪囱堫婃孮宗嵏嵕嵸従徖從忩怱总悤悰惣惾愡慒憁捴揔搃摠昮暰朡枞棇棕椶樅樬樷欉淙漎漗潀潈潨灇焧熜熧燪爜猔猣琮瑽璁疭瘲瞛碂磫稯篵粽糉糭綜緃総緫緵縂縦縱總繱纵综翪聡聦聪聰腙苁茐葱葼蓗蓯蔥藂蝬蟌誴謥豵賨賩踨踪蹤錝鍐鍯鏓鏦鑁騌騘騣驄骔骢鬃鬉鬷鯮鯼,Tu:兎兔凃凟凸剢匵厾吐唋嘟図图圕圖圗土圡堍堗堵塗妒妬嬻宊屠峹嵞嶀帾度庩廜徒怢悇捈捸揬杜梌椟櫝殬殰毒汢涂涋涜渎渡湥潳瀆牍牘犊犢独獨琽瓄痜瘏皾督睹碡禿秃秺稌突笃筡篤肚腯芏荰荼莵菟葖蒤蝳螙蠧蠹裻覩読讀讟读豄賭贕赌跿迌途酴醏釷鈯鋵錖鍍鍎鑟钍镀闍阇靯韇韣韥馟駼騳髑鵌鵚鵵鶟鷋鷵黩黷鼵,Tuan:偳剬剸团団團塅媏彖慱抟摶断斷椴槫檲段毈湍湪漙煅煓猯瑖疃短碫端篿簖籪糰緞缎耑腶葮褍褖貒躖鍛鍴鏄锻鷒鷻,Tui:侻俀僓兊兌兑垖堆塠娧对対對尵嵟弚怼憝憞懟推濧瀩煺痽碓磓祋穨綐腿蓷薱藬蘈蛻蜕褪襨譈譵蹆蹪退鐓鐜镦队陮隊隤頧頹頺頽颓駾骽魋鴭,Tun:伅吞吨呑啍噋噸囤坉墩墪屯庉忳惇撉撴敦旽暾朜楯橔氽沌涒潡炖焞燉犜獤畽盹盾砘碷礅臀臋芚蜳豘豚趸踲蹲蹾躉軘逇遁遯鈍钝霕頓顿飩饨驐魨鲀黗,Tung:东仝佟侗倲働僮冬冻凍动動勭同咚哃嗵囲垌埬墥姛娻嬞岽峂峒峝崠崬庝彤徚恫恸慟憅懂戙挏捅昸晍曈朣東栋桐桶棟樋橦氃氡氭洞浵涷湩潼炵烔燑犝狪獞痌痛眮瞳砼硐秱童笗筒筩箽粡絧統綂统胨胴腖膧苳茼菄董蓪蕫蚒蝀衕詷諌赨迵通酮鉖鉵銅铜霘餇駧鮗鮦鯟鲖鶇鶫鸫鼕鿴,Tzu:乲伺佌佽倳偨兹刺刾剚吇呰呲咨啙嗞垐堲姉姊姕姿嬨子字孜孳孶崰嵫庛恣慈朿杍柌栥栨梓椔榟橴次此泚淄渍湽滋滓漬澬濨牸玆玼珁璾瓷甆疵皉眥眦矷磁礠祠禌秄秭秶稵笫籽粢糍紎紫絘緇縒缁耔胏胔胾自芓茈茊茡茦茨茲荢莿葘蓻薋虸蛓螆蠀觜訾訿詞諮词谘貲資賜赀资赐赼趀趑趦跐輜輺辎辝辞辤辭鄑釨鈭錙鍿鎡锱镃雌頾頿飺餈骴髊髭鮆鯔鰦鲻鴜鶅鶿鷀鹚鼒齍齹龇,Wa:佤劸咓哇嗗嗢娃娲媧屲挖搲攨洼溛漥瓦瓲畖砙穵窊窪聉腽膃蛙袜襪邷韈韤鼃,Wai:喎外夞崴歪竵顡,Wan:万丸倇刓剜卍卐唍埦塆壪妧婉婠完宛岏帵弯彎忨惋抏挽捖捥晚晥晩晼杤梚椀汍湾潫澫灣烷玩琓琬畹皖盌睕瞣碗笂紈綩綰纨绾翫脕脘腕芄菀萖萬薍蜿蟃豌貦贃贎踠輐輓鋄鋔錽鎫頑顽,Wang:亡亾仼兦妄尣尩尪尫彺往徃徍忘惘旺暀望朢枉棢汪瀇王盳網网罒罔莣菵蚟蛧蝄誷輞辋迋魍龬,Wei:为亹伟伪位偉偎偽僞儰卫危厃叞味唯喂喡喴囗围圍圩墛壝委威娓媁媙媦寪尉尾屗峗峞崣嵔嵬嶶巍帏帷幃徫微惟愄愇慰懀捤揋揻撱斖暐未桅梶椲椳楲欈沩洈洧浘涠渨渭湋溈溦潍潙潿濰濻瀢炜為烓煀煒煟煨熭燰爲犚犩猥猬玮琟瑋璏畏痏痿癓硊硙碨磈磑維緭緯縅纬维罻胃腲艉芛苇苿荱菋萎葦葨葳蒍蓶蔚蔿薇薳藯蘶蜲蜼蝛蝟螱衛衞褽覣覹詴諉謂讆讏诿谓踓躗躛軎轊违逶違鄬醀鍏鍡鏏闈闱隇隈霨霺韋韑韙韡韦韪頠颹餧餵饖骩骪骫魏鮇鮠鮪鰃鰄鲔鳂鳚,Wen:刎匁吻呚呡問塭妏彣忟抆揾搵文昷桽榅榲殟汶渂温溫炆玟珳瑥璺瘒瘟稳穏穩紊紋纹聞肳脗芠莬蕰蚉蚊螡蟁豱輼轀辒鎾閺閿闅闦问闻阌雯鞰顐饂馼駇魰鰛鰮鳁鳼鴍鼤,Weng:勜嗡塕奣嵡攚暡滃瓮甕瞈罋翁聬蓊蕹螉鎓鶲鹟齆,Wo:仴倭偓卧唩婐媉幄我挝捰捾握撾擭斡枂楃沃涡涴涹渥渦濣焥猧瓁瞃硪窝窩肟腛臒臥莴萵蜗蝸踒雘齷龌,Wu:乄乌五仵伆伍侮俉倵儛兀剭务務勿午卼吳吴吾呉呒呜唔啎嗚圬坞塢奦妩娪娬婺嫵寤屋屼岉嵍嵨巫庑廡弙忢忤怃悞悟悮憮戊扤捂摀敄无旿晤杇杌梧橆歍武毋汙汚污洖洿浯溩潕烏焐無熃熓物牾玝珷珸瑦璑甒痦矹碔祦禑窏窹箼粅舞芜芴茣莁蕪蘁蜈螐蟱誈誣誤譕诬误躌迕逜邬郚鄔鋈錻鎢钨铻阢隖雺雾霚霧靰騖骛鯃鰞鴮鵐鵡鶩鷡鹀鹉鹜鼯鼿齀,Ya:丫乛亚亜亞伢俹劜厊压厑厓吖呀哑唖啞圔圠圧垭埡堐壓娅婭孲岈崕崖庌庘押挜掗揠枒桠椏氩氬涯漄牙犽猚猰玡琊瑘痖瘂睚砑稏窫笌聐芽蕥蚜衙襾訝讶軋轧迓錏鐚铔雅鴉鴨鵶鸦鸭齖齾,Yang:仰佒佯傟养劷咉坱垟央姎岟崵崸徉怏恙慃懩扬抰揚攁敭旸昜暘杨柍样楊楧様樣殃氜氧氱泱洋漾瀁炀炴烊煬珜疡痒瘍癢眏眻礢禓秧紻羊羏羕羪胦蛘蝆詇諹軮輰鉠鍚鐊钖阦阳陽雵霷鞅颺飏養駚鰑鴦鴹鸉鸯'.split(',').forEach(function(p){var s=p.split(':');if(s[1])for(var i=0;i<s[1].length;i++)if(!m[s[1][i]])m[s[1][i]]=s[0]});
'Yao:仸倄偠傜吆咬喓嗂垚堯夭妖姚婹媱宎尧尭岆峣崾嶢嶤幺徭愮抭揺搖摇摿暚曜杳枖柼楆榚榣殀溔滧烑熎燿爻狕猺獟珧瑤瑶眑矅磘祅穾窅窈窑窔窯窰筄繇纅耀肴腰舀艞苭药葯葽蓔薬藥蘨袎要覞訞詏謠謡讑谣軺轺遙遥邀邎銚鎐鑰钥闄靿顤颻飖餆餚騕鰩鳐鴁鴢鷂鷕鹞鼼齩,Yeh:业也亪亱倻僷冶叶吔啘嘢噎嚈埜堨墷壄夜嶪嶫抴捓捙掖揶擛擨擪擫晔暍曄曅曗曳曵枼枽椰楪業歋殗洂液漜潱澲烨燁爗爷爺璍皣瞱瞸礏耶腋葉蠮謁谒邺鄓鄴野釾鋣鍱鎁鎑鐷铘靥靨頁页餣饁馌驜鵺鸈,Yen:严乵俨偃偐偣傿儼兖兗剦匽厌厣厭厳厴咽唁啱喭噞嚥嚴堰塩墕壛壧夵奄妍妟姲姸娫娮嫣嬊嬮嬿孍宴岩崦嵃嵒嵓嶖巌巖巗巘巚延弇彥彦恹愝懕懨戭扊抁掩揅揜敥昖晏暥曕曣曮棪椻椼楌樮檐檿櫩欕沇沿淊淹渰渷湮溎滟演漹灎灔灧灩炎烟烻焉焑焔焰焱煙熖燄燕爓牪狿猒珚琂琰甗盐眼研砚硏硯硽碞礹筵篶簷綖縯罨胭腌臙艳艶艷芫莚菸萒葕蔅虤蜒蝘衍裺褗覎觃觾言訁訮詽諺讌讞讠谚谳豓豔贋贗赝躽軅遃郔郾鄢酀酓酽醃醶醼釅閆閹閻闫阉阎隁隒雁顏顔顩颜餍饜騐験騴驗驠验鬳魇魘鰋鳫鴈鴳鶠鷃鷰鹽麣黡黤黫黬黭黶鼴鼹齞齴龑,Yi:一乁乂义乊乙亄亦亿以仪伇伊伿佁佚佾侇依俋倚偯儀億兿冝刈劓劮勚勩匇匜医吚呓呭呹咦咿唈噫囈圛圯坄垼埶埸墿壱壹夁夷奕姨媐嫕嫛嬄嬑嬟宐宜宧寱寲屹峄峓崺嶧嶬嶷已巸帟帠幆庡廙异弈弋弌弬彛彜彝彞役忆怈怡怿恞悒悘悥意憶懌懿扅扆抑拸挹掜揖撎攺敡敼斁旑旖易晹暆曀曎杙枍枻柂栘栧栺桋棭椅椬椸榏槸檍檥檹欥欭欹歝殔殪殹毅毉沂沶泆洢浂浥浳渏湙溢漪潩澺瀷炈焲熠熤熪熼燚燡燱狋猗獈玴珆瑿瓵畩異疑疫痍痬瘗瘞瘱癔益眙睪瞖矣硛礒祎禕秇移稦穓竩笖箷簃籎縊繄繶繹绎缢羛羠義羿翊翌翳翼耛耴肄肊胰膉臆舣艗艤艺芅苅苡苢萓萟蓺薏藙藝蘙虉蚁蛜蛡蛦蜴螔螘螠蟻衣衤衪衵袘袣裔裛裿褹襼觺訑訲訳詍詑詒詣誃誼謻譩譯議讉讛议译诒诣谊豙豛豷貖貤貽賹贀贻跇跠踦軼輢轙轶辷迆迤迻逘逸遗遺邑郼酏醫醳醷釔釴鈘鈠鉯銥鎰鏔鐿钇铱镒镱陭隿霬靾頉頤頥顊顗颐飴饐饴駅驛驿骮鮨鯣鳦鶂鶃鶍鷁鷊鷖鷧鷾鸃鹝鹢鹥黓黟黳齮齸,Yin:乑乚侌冘凐印吟吲喑噖噾嚚囙因圁垔垠垽堙堷夤姻婣婬寅尹峾崟崯嶾廕廴引愔慇慭憖憗懚斦朄栶檃檭檼櫽歅殥殷氤泿洇洕淫淾湚溵滛濥濦烎犾狺猌珢璌瘖瘾癊癮碒磤禋秵筃粌絪緸胤苂茚茵荫荶蒑蔩蔭蘟蚓螾蟫裀訔訚訡誾諲讔赺趛輑鄞酳鈏鈝銀銦铟银闉阥阴陰陻隂隐隠隱霒霠霪靷鞇音韾飮飲饮駰骃鮣鷣齗龂,Ying:偀僌啨営嘤噟嚶塋婴媖媵嫈嬰嬴孆孾巊应廮影応愥應摬撄攍攖映暎朠桜梬楹樱櫻櫿浧渶溁溋滢潁潆濙濚濴瀅瀛瀠瀯瀴灐灜煐熒營珱瑛瑩璎瓔甇甖瘿癭盁盈矨硬碤礯穎籝籯緓縈纓绬缨罂罃罌膡膺英茔荧莹莺萤营萦萾蓥藀蘡蛍蝇蝧蝿螢蠅蠳褮覮謍譍譻賏贏赢軈迎郢鍈鎣鐛鑍锳霙鞕韺頴颍颕颖鱦鴬鶑鶧鶯鷪鷹鸎鸚鹦鹰,Yu:与丣乻予于亐亴伃优伛佑余侑俁俞俣俼偊偤傴儥優兪匬卣又友右呦哊唀唹喅喐喩喻噊噳嚘囿圄圉圫域堉堣堬妤妪姷娛娯娱媀嫗嬩孧宇宥寓寙尢尤屿峟峪峳峿崳嵎嵛嶎嶼幼幽庮庽庾彧御忧忬怣怮悆悠惐愈愉愚慾憂懙懮戫扜扵挧揄攸敔斔斞於斿旕旟昱有杅柚栯桙梄棛棜棫楀楡楢楰榆槱櫌櫲櫾欎欝欤欲歈歟歶毓沋油泑浟浴淢淤淯渔渝游湡湵滪滺漁潏澚澞澦瀀灪焴煜燏燠爩牏牖牗牰犹狖狱狳猶猷獄玉玗玙琙瑀瑜璵由畭疣瘀瘉瘐癒盂盓睮矞砡硢硲礇礖礜祐祤禉禦禹禺秗秞稢稶穥穻窬窳竽箊篽籅籞籲糿紆緎繘纋纡罭羐羑羭羽耰聈聿肀肬育脜腴臾舁舆與艅艈芋芌苃茟茰莜莠莸萭萮萸蒏蒮蓣蓹蕍蕕蕷薁蘌蘛虞虶蚰蚴蜏蜟蜮蝓蝣螸衧袬裕褕覦觎訧誉誘語諛諭謣譽语诱谀谕豫貁貐踰軉輍輏輶輿轝込迂迃迶逌逰逳逾遇遊遹邘邮郁郵鄅鄾酉酑酭醧釉鈺鈾銉銪鋊鋙錥鍝鐭钰铀铕閾阈陓隅雓雨雩霱預頨预飫餘饇饫馀馭駀騟驈驭骬髃鬰鬱鬻魊魚魷鮋鮽鯲鰅鱊鱼鱿鲉鳿鴥鴧鴪鵒鷠鷸鸆鸒鹆鹬麀麌黝鼬齬龉龥,Yuan:傆元円冤剈原厡厵员員噮囦园圆圎園圓垣垸塬夗妴媛媴嫄嬽寃怨悁惌愿掾援杬棩榞榬橼櫞沅淵渁渆渊渕湲源溒灁爰猨猿獂瑗盶眢禐笎箢緣縁缘羱肙苑茒葾蒝蒬薗蚖蜎蜵蝝蝯螈衏袁裫裷褑褤謜貟贠轅辕远逺遠邍邧酛鈨鋺鎱院願駌騵魭鳶鴛鵷鶢鶰鸢鸳鹓黿鼋鼘鼝,Yueh:刖噦妜嬳岄岳嶽彟彠恱悅悦戉抈捳曰曱月樾瀹爚玥矱礿禴箹篗籆籥籰粤粵約约蘥蚎蚏越跀跃躍軏鈅鉞钺閱閲阅鸑鸙黦龠,Yun:云伝傊允勻匀喗囩夽奫妘孕恽惲愠愪慍抎抣昀晕暈枟橒殒殞氲氳沄涢溳澐煴熅熉熨狁畇眃磒秐筠筼篔紜緷緼縕縜繧纭缊耘耺腪芸荺蒀蒕蒷蕓蕴薀藴蘊蝹褞賱贇赟运運郓郧鄆鄖酝醖醞鈗鋆阭陨隕雲霣韗韞韫韵韻頵餫馧馻齫齳,Yung:佣俑傛傭勇勈咏喁嗈噰埇塎墉壅嫞嵱庸廱彮怺恿悀惥愑愹慂慵拥揘擁柡栐槦永泳涌湧滽澭灉牅用甬痈癕癰砽硧禜臃苚蛹詠踊踴邕郺鄘醟鏞镛雍雝顒颙饔鯒鰫鱅鲬鳙鷛'.split(',').forEach(function(p){var s=p.split(':');if(s[1])for(var i=0;i<s[1].length;i++)if(!m[s[1][i]])m[s[1][i]]=s[0]});
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
