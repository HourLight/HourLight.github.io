/* hl-meridian-clock.js — 子午流注即時經絡提醒模組 v1.0
   自動偵測 UTC+8 時辰，渲染對應經絡資訊卡片，含倒數計時自動切換。
   © 2026 馥靈之鑰 Hour Light */
(function(){
'use strict';

/* ── 12 經絡時辰資料 ── */
var DATA=[
{hour:'子',start:23,end:1,meridian:'足少陽膽經',element:'木',
 emotion:'猶豫不決、難以做選擇',
 acupoint:'風池穴',location:'後頸兩側凹陷處',
 massage:'雙手拇指按壓風池穴，力道適中，每次 30 秒 x 3 組',
 advice:'這是膽汁分泌最旺的時候。能睡就睡，睡不著就躺著閉眼。熬夜傷的不只是精神，是你的決斷力。膽經管「決定」，長期子時不睡的人會越來越猶豫。',
 oils:'薰衣草（安眠）、羅馬洋甘菊（鎮靜）',
 trivia:['古人說「膽者，中正之官，決斷出焉」，你做不了決定不是因為笨，可能是因為太晚睡','膽經從眼尾開始，沿著頭側面一路走到腳趾。偏頭痛常常就是膽經塞住了','子時是一天陰氣最重的時刻，陰極生陽。如果你在這個時間還清醒，等於錯過了身體「重開機」的黃金時段','膽汁是消化脂肪的關鍵。長期熬夜的人容易膽結石，不是巧合']},

{hour:'丑',start:1,end:3,meridian:'足厥陰肝經',element:'木',
 emotion:'憤怒、壓抑、委屈',
 acupoint:'太衝穴',location:'腳背大拇趾和第二趾之間往上兩指',
 massage:'用拇指從太衝穴往腳趾方向推，力道稍重，每次 20 秒 x 5 組',
 advice:'肝在這個時候解毒和造血。如果你常在這個時間醒來，通常跟壓抑的情緒有關。肝主疏泄，意思是它幫你「消化」情緒。氣到睡不著就是肝經在抗議。',
 oils:'佛手柑（疏肝解鬱）、薄荷（清肝熱）',
 trivia:['「怒傷肝」不是隨便說的，長期壓抑怒氣的人眼睛容易乾澀、指甲容易斷裂，因為肝開竅於目、其華在爪','丑時是肝臟排毒造血的黃金期。中醫說「人臥則血歸於肝」，躺下來肝才能好好工作','肝經經過生殖系統，經期不順、子宮肌瘤常跟肝氣鬱結有關','春天屬木屬肝，春天容易情緒起伏大就是這個原因。春天疏肝比夏天補心更重要']},

{hour:'寅',start:3,end:5,meridian:'手太陰肺經',element:'金',
 emotion:'悲傷、失落、放不下',
 acupoint:'列缺穴',location:'手腕內側橫紋上方一寸半',
 massage:'一手握另一手手腕，拇指按壓列缺穴，每次 15 秒 x 3 組',
 advice:'肺經在凌晨開始分配一天的氣。老人家常在這個時候咳嗽或醒來，是肺氣在調整。如果你睡得好，這個時候身體的修復力最強。夜班的人這個時間特別容易覺得冷。',
 oils:'尤加利（開肺）、茶樹（清呼吸道）',
 trivia:['中醫說「肺主皮毛」，皮膚不好的人先看看自己的呼吸深不深。淺呼吸的人氣色一定差','寅時是道家練功的最佳時辰，叫「寅時練氣」。空氣裡的負離子在這個時段濃度最高','肺經從胸口走到大拇指，大拇指麻的人要注意肺功能','肺與大腸相表裡，便秘的人容易長痘痘，因為大腸的毒排不出去，肺就往皮膚排']},

{hour:'卯',start:5,end:7,meridian:'手陽明大腸經',element:'金',
 emotion:'控制、不願放手、囤積',
 acupoint:'合谷穴',location:'虎口，大拇指和食指之間的肌肉最高點',
 massage:'拇指按壓合谷穴，有酸脹感即可，每次 30 秒 x 3 組',
 advice:'大腸經管排泄。早上起來喝一杯溫水，讓腸子動起來。如果你長期便秘，這個時間起床上廁所是最順的。不要賴床賴過七點，腸子會很失望。',
 oils:'薑（溫腸）、甜橙（促進蠕動）',
 trivia:['大腸經走到鼻翼旁邊，鼻子過敏的人按合谷穴有時候比吃藥還快','合谷穴是全身止痛第一大穴，頭痛牙痛經痛都能按。但孕婦不要按，會刺激子宮','早上五到七點排便最順，因為大腸經正在值班。錯過這個時段，一整天腸子都懶懶的','大腸經跟情緒的「放手」有關。便秘的人通常在心理上也有放不下的東西']},

{hour:'辰',start:7,end:9,meridian:'足陽明胃經',element:'土',
 emotion:'焦慮、過度思慮、吃不下',
 acupoint:'足三里',location:'膝蓋下方四指、脛骨外側一指',
 massage:'用拳頭輕敲足三里，每次 2 分鐘，坐著就能做',
 advice:'胃經最旺的時間，一定要吃早餐。這個時候吃的東西吸收率最高。不吃早餐的人到中午血糖掉下來會特別暴躁。胃經從臉上經過，臉色蠟黃通常跟胃有關。',
 oils:'檸檬（開胃）、薄荷（助消化）',
 trivia:['足三里被稱為「長壽穴」，日本養生老人每天敲它已經變成國民運動了','胃經從眼睛下面開始，臉上長痘的位置對應不同的胃腸問題。下巴=腸，臉頰=胃','辰時吃的東西吸收率是一天最高的。不吃早餐等於浪費了身體最好的消化時段','胃經經過乳房，中醫認為乳腺問題跟胃經和肝經都有關']},

{hour:'巳',start:9,end:11,meridian:'足太陰脾經',element:'土',
 emotion:'過度擔心、想太多、鑽牛角尖',
 acupoint:'三陰交',location:'內踝上方四指',
 massage:'用拇指輕柔按壓三陰交，每次 20 秒 x 3 組。注意：孕婦不要按',
 advice:'脾主運化，這個時候思考力最強。適合開會、做決策、讀書。但不要一邊吃東西一邊工作，脾不喜歡你分心。脾也管肌肉，這個時段運動的效果最好。',
 oils:'迷迭香（提神醒腦）、檸檬草（活化）',
 trivia:['「思傷脾」，一直想一直想的人容易消化不良。你以為是吃壞東西，其實是想壞腦袋','三陰交是婦科第一大穴，經痛的時候按這裡比吃止痛藥快。但孕婦絕對不能按','脾主肌肉，肌肉無力或容易抽筋的人要養脾。多吃黃色食物：南瓜、地瓜、玉米','脾開竅於口，嘴唇乾裂脫皮不一定是缺水，可能是脾虛。擦護唇膏不如喝碗四神湯']},

{hour:'午',start:11,end:13,meridian:'手少陰心經',element:'火',
 emotion:'心慌、失眠、過度興奮',
 acupoint:'神門穴',location:'手腕內側橫紋尾端凹陷處',
 massage:'用另一手拇指輕按神門穴，配合深呼吸，每次 30 秒',
 advice:'心經管神志。中午小睡 15-30 分鐘對下午的精神有巨大幫助。但不要睡超過一小時，越睡越昏。如果睡不著就閉眼休息，心經也會感謝你。',
 oils:'玫瑰（安心寧神）、薰衣草（放鬆）',
 trivia:['心經從腋下走到小指尖，緊張的時候搓搓小指頭，心會安靜下來','午時小睡叫「子午覺」，子時睡覺養膽，午時小憩養心。兩個都做到的人精神好兩倍','中醫說「心主神明」，心不只是泵血的器官，還管你的意識和思維。心火旺的人話多、睡不著','舌頭是心的外在指標。舌尖紅代表心火旺，舌頭有齒痕代表脾虛。每天照鏡子看舌頭比量體重有用']},

{hour:'未',start:13,end:15,meridian:'手太陽小腸經',element:'火',
 emotion:'混亂、分不清楚、難以取捨',
 acupoint:'養老穴',location:'手腕外側骨突上方凹陷處',
 massage:'旋轉手腕的同時按壓養老穴，每次 15 秒 x 3 組',
 advice:'小腸負責「分清泌濁」，就是把好的留下、不要的排掉。這個時間喝水比喝咖啡好，幫助代謝午餐。小腸經也管「判斷力」，午後做選擇題特別清楚。',
 oils:'佛手柑（消化輔助）、天竺葵（平衡）',
 trivia:['小腸經走過肩膀和後頸，下午肩膀硬不是因為工作太多，是小腸經在叫你喝水','小腸經管「分清泌濁」，分不清什麼重要什麼不重要的人，小腸經可能不太通','養老穴的名字很直白，就是「養老」用的。老花眼、耳背、腰酸背痛都可以按','午餐後兩小時是小腸吸收營養的高峰期。這段時間喝冰水會讓小腸收縮，吸收力下降']},

{hour:'申',start:15,end:17,meridian:'足太陽膀胱經',element:'水',
 emotion:'恐懼、不安全感、膽小',
 acupoint:'委中穴',location:'膝蓋後方正中凹陷處',
 massage:'坐著雙手扶膝，拇指按壓委中穴，配合伸展，每次 15 秒 x 3 組',
 advice:'膀胱經是人體最長的經絡，從頭頂到腳底。這個時間多喝水、多走動。坐了一下午的人站起來伸展一下，讓膀胱經的氣跑通。這也是記憶力第二好的時段，適合學習。',
 oils:'尤加利（開通）、迷迭香（增強記憶）',
 trivia:['膀胱經經過整條背部，背痛的人八成跟膀胱經有關。下午按按委中穴，晚上腰會輕很多','膀胱經是人體最長的經絡，從頭頂到腳小趾，左右共 134 個穴位','申時是記憶力第二高峰（第一高峰是辰時）。下午三點到五點讀書效率特別好','古人說「膀胱者，州都之官，津液藏焉」。膀胱管水，水喝不夠的人膀胱經最先抗議']},

{hour:'酉',start:17,end:19,meridian:'足少陰腎經',element:'水',
 emotion:'恐懼、不安、缺乏安全感',
 acupoint:'湧泉穴',location:'腳底前三分之一凹陷處',
 massage:'用拳頭搓湧泉穴到發熱，或用網球踩著滾，每次 2 分鐘',
 advice:'腎藏精，管你的元氣。這個時間不適合太劇烈的運動，適合慢走、做瑜伽、泡腳。如果下午五六點特別累，不是你弱，是腎經在提醒你該休息了。',
 oils:'雪松（穩固根基）、檀香（滋陰安神）',
 trivia:['腎開竅於耳，耳鳴的人按湧泉穴會有幫助。「耳聰目明」不是成語，是腎好的證據','腎藏精，精生髓，髓養骨。掉頭髮、骨質疏鬆、記憶力下降都跟腎有關','湧泉穴是腎經第一穴，也是人體最低的穴位。用熱水泡腳等於直接給腎經充電','酉時不適合劇烈運動，因為腎精在這個時候要收藏。傍晚慢走比跑步好']},

{hour:'戌',start:19,end:21,meridian:'手厥陰心包經',element:'火（相火）',
 emotion:'孤獨、關係焦慮、界線模糊',
 acupoint:'內關穴',location:'手腕內側橫紋上三指',
 massage:'按壓內關穴，配合深呼吸，每次 30 秒。暈車、孕吐也可以按這裡',
 advice:'心包是心臟的「保鏢」。這個時間適合散步、聊天、跟喜歡的人相處。心包經管的是你跟人之間的距離感，太近會窒息，太遠會孤單。練習剛好的距離。',
 oils:'依蘭（打開心房）、玫瑰（溫暖心輪）',
 trivia:['內關穴是暈車特效穴。下次搭車前先按 30 秒，比暈車藥快','心包經被稱為心臟的「護衛」。你覺得心痛，其實第一個擋住傷害的是心包','戌時是跟家人相處的最佳時段。心包經管「親密關係的距離感」，太近窒息太遠孤單','心包經也管你的「邊界感」。不會拒絕別人的人，心包經通常比較弱']},

{hour:'亥',start:21,end:23,meridian:'手少陽三焦經',element:'火（相火）',
 emotion:'煩躁、靜不下來、失眠',
 acupoint:'外關穴',location:'手腕背面橫紋上三指，跟內關相對',
 massage:'按壓外關穴，每次 15 秒 x 3 組，睡前做最好',
 advice:'三焦是人體的「水利工程」，負責通調水道和氣的運行。這個時間該準備睡覺了。三焦通暢的人入睡快、睡眠深。睡前泡腳、關手機、讓三焦安靜下來。',
 oils:'薰衣草（助眠）、乳香（靜心）',
 trivia:['三焦不是具體的器官，是中醫獨有的概念。上焦管心肺、中焦管脾胃、下焦管腎膀胱，像身體的「總經理」','亥時泡腳是養生圈的最大公約數。因為三焦通水道，熱水從腳底往上走，三焦的氣就通了','三焦經走在手臂外側，打電腦太久手臂外側痠痛，就是三焦經在喊累','西醫找不到三焦對應的器官，但有人認為它最接近「淋巴系統 + 筋膜系統」的綜合體']}
];

/* ── 五行色碼 ── */
var ELEMENT_COLORS={
  '木':'#5a8a5e','金':'#b09060','土':'#c49a40',
  '火':'#c05a4a','水':'#4a7a9a','火（相火）':'#c07a5a'
};

/* ── 注入 CSS ── */
var css='\
.meridian-clock{background:#fffcf7;border:1px solid #e8ddd0;border-radius:16px;padding:0;margin-bottom:20px;overflow:hidden;font-family:"LXGW WenKai TC","Noto Serif TC",serif}\
.mc-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;padding:16px 20px 12px;border-bottom:1px solid #f0e8de}\
.mc-time{font-size:.95rem;color:#2d2418;letter-spacing:.04em}\
.mc-countdown{font-size:.85rem;color:#9a8a74;font-variant-numeric:tabular-nums}\
.mc-body{padding:18px 20px 20px}\
.mc-meridian{font-size:1.2rem;font-weight:500;color:#2d2418;margin-bottom:6px;letter-spacing:.06em}\
.mc-element{display:inline-block;font-size:.8rem;padding:3px 10px;border-radius:20px;color:#fff;margin-bottom:12px}\
.mc-emotion{font-size:.88rem;color:#7a6a58;margin-bottom:14px;line-height:1.6}\
.mc-advice{font-size:.9rem;color:#2d2418;line-height:1.8;margin-bottom:16px;padding:14px 16px;background:#fdf8f2;border-radius:10px;border-left:3px solid #c9a060}\
.mc-acupoint{margin-bottom:14px}\
.mc-acupoint-title{font-size:.92rem;color:#2d2418;margin-bottom:4px;font-weight:500}\
.mc-acupoint-location{font-size:.85rem;color:#9a8a74;margin-bottom:4px}\
.mc-acupoint-massage{font-size:.88rem;color:#7a6a58;line-height:1.7}\
.mc-oil{font-size:.88rem;color:#7a6a58;margin-bottom:14px}\
.mc-oil-label{color:#9a8a74;font-size:.82rem;margin-bottom:2px}\
.mc-trivia{font-size:.88rem;color:#7a6a58;line-height:1.7;padding:12px 14px;background:rgba(201,160,96,.06);border-radius:10px;border:1px solid rgba(201,160,96,.12)}\
.mc-trivia-label{font-size:.82rem;color:#9a8a74;margin-bottom:4px}\
#mcTriviaText{transition:opacity .3s ease}\
@media(max-width:600px){\
  .mc-header{flex-direction:column;align-items:flex-start}\
  .mc-body{padding:14px 16px 16px}\
}\
';
var sty=document.createElement('style');
sty.textContent=css;
document.head.appendChild(sty);

/* ── 工具函式 ── */
function getUTC8Now(){
  var now=new Date();
  var utc=now.getTime()+now.getTimezoneOffset()*60000;
  return new Date(utc+8*3600000);
}

function getCurrentIndex(h){
  // 子時 23-01 特殊處理
  if(h>=23||h<1) return 0;
  if(h>=1&&h<3)  return 1;
  if(h>=3&&h<5)  return 2;
  if(h>=5&&h<7)  return 3;
  if(h>=7&&h<9)  return 4;
  if(h>=9&&h<11) return 5;
  if(h>=11&&h<13)return 6;
  if(h>=13&&h<15)return 7;
  if(h>=15&&h<17)return 8;
  if(h>=17&&h<19)return 9;
  if(h>=19&&h<21)return 10;
  return 11; // 21-23
}

function getEndMs(idx){
  var d=DATA[idx];
  var now8=getUTC8Now();
  var endH=d.end;
  // 子時特殊：end=1，若當前 >=23 則 end 是明天 01:00
  var target=new Date(now8);
  target.setMinutes(0,0,0);
  target.setHours(endH);
  if(target<=now8) target.setDate(target.getDate()+1);
  // 把 target（UTC+8 邏輯時間）轉回本地時間戳
  var localNow=new Date();
  var diff=target.getTime()-now8.getTime();
  return localNow.getTime()+diff;
}

function formatTime(h){
  return (h<10?'0':'')+h+':00';
}

function formatCountdown(ms){
  if(ms<=0) return '即將切換...';
  var s=Math.floor(ms/1000);
  var hh=Math.floor(s/3600);
  var mm=Math.floor((s%3600)/60);
  var ss=s%60;
  return (hh>0?(hh+':'):'')+(mm<10?'0':'')+mm+':'+(ss<10?'0':'')+ss;
}

/* ── 渲染 ── */
function render(container){
  var now8=getUTC8Now();
  var h=now8.getHours();
  var idx=getCurrentIndex(h);
  var d=DATA[idx];
  var startH=d.start;
  var endH=d.end;
  var timeRange=formatTime(startH)+'-'+formatTime(endH);
  var elColor=ELEMENT_COLORS[d.element]||'#c9a060';

  container.innerHTML='\
<div class="meridian-clock">\
  <div class="mc-header">\
    <span class="mc-time">'+d.hour+'時（'+timeRange+'）｜'+d.meridian+'</span>\
    <span class="mc-countdown" id="mcCountdown"></span>\
  </div>\
  <div class="mc-body">\
    <div class="mc-meridian">'+d.meridian+'</div>\
    <div class="mc-element" style="background:'+elColor+'">'+d.element+'</div>\
    <div class="mc-emotion">情緒主題：'+d.emotion+'</div>\
    <div class="mc-advice">'+d.advice+'</div>\
    <div class="mc-acupoint">\
      <div class="mc-acupoint-title">穴位：'+d.acupoint+'</div>\
      <div class="mc-acupoint-location">位置：'+d.location+'</div>\
      <div class="mc-acupoint-massage">'+d.massage+'</div>\
    </div>\
    <div class="mc-oil"><div class="mc-oil-label">推薦精油</div>'+d.oils+'</div>\
    <div class="mc-trivia"><div class="mc-trivia-label">小知識</div><span id="mcTriviaText">'+(Array.isArray(d.trivia)?d.trivia[0]:d.trivia)+'</span></div>\
  </div>\
</div>';

  return idx;
}

/* ── 初始化 ── */
function init(){
  var container=document.getElementById('meridianClockContainer');
  if(!container) return;

  var currentIdx=render(container);
  var endMs=getEndMs(currentIdx);

  var timer=setInterval(function(){
    var remain=endMs-Date.now();
    var el=document.getElementById('mcCountdown');
    if(el) el.textContent='距離下個時辰 '+formatCountdown(remain);

    if(remain<=0){
      // 時辰切換
      currentIdx=render(container);
      endMs=getEndMs(currentIdx);
    }
  },1000);

  // 冷知識輪播（每 8 秒切換）
  var triviaIdx=0;
  setInterval(function(){
    var d=DATA[currentIdx];
    if(!d||!Array.isArray(d.trivia)||d.trivia.length<=1) return;
    triviaIdx=(triviaIdx+1)%d.trivia.length;
    var el=document.getElementById('mcTriviaText');
    if(el){
      el.style.opacity='0';
      setTimeout(function(){
        el.textContent=d.trivia[triviaIdx];
        el.style.opacity='1';
      },300);
    }
  },8000);
}

/* ── DOM Ready ── */
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}

})();
