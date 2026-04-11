/* hl-meridian-clock.js — 子午流注即時經絡提醒模組 v2.0
   圓形時鐘 + 經絡走向示意圖 + 五行漸層 + 動態效果
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
 trivia:['古人說「膽者，中正之官，決斷出焉」，你做不了決定，可能跟太晚睡有關','膽經從眼尾開始，沿著頭側面一路走到腳趾。偏頭痛常常就是膽經塞住了','子時是一天陰氣最重的時刻，陰極生陽。如果你在這個時間還清醒，等於錯過了身體「重開機」的黃金時段','膽汁是消化脂肪的關鍵。長期熬夜的人容易膽結石，有直接關係','膽經有44個穴位，是十二正經裡穴位第二多的。走在身體側面，側睡壓到膽經會影響睡眠品質','古代打仗前要「壯膽」，膽氣足的人確實反應快、判斷準、不猶豫','半夜11點到1點是美容覺的黃金期，因為膽經管新陳代謝，這時段睡覺皮膚修復最快','膽經走過太陽穴，太陽穴痛按風池穴比按太陽穴更有效'],
 bodyPath:'M50,22 L50,18 M50,22 L48,28 L46,34 L44,40 L42,50 L40,60 L38,70 L36,78 L36,88 L38,96',
 bodyDots:[[48,18],[44,40],[36,78]]},

{hour:'丑',start:1,end:3,meridian:'足厥陰肝經',element:'木',
 emotion:'憤怒、壓抑、委屈',
 acupoint:'太衝穴',location:'腳背大拇趾和第二趾之間往上兩指',
 massage:'用拇指從太衝穴往腳趾方向推，力道稍重，每次 20 秒 x 5 組',
 advice:'肝在這個時候解毒和造血。如果你常在這個時間醒來，通常跟壓抑的情緒有關。肝主疏泄，意思是它幫你「消化」情緒。氣到睡不著就是肝經在抗議。',
 oils:'佛手柑（疏肝解鬱）、薄荷（清肝熱）',
 trivia:['「怒傷肝」說的很有道理，長期壓抑怒氣的人眼睛容易乾澀、指甲容易斷裂，因為肝開竅於目、其華在爪','丑時是肝臟排毒造血的黃金期。中醫說「人臥則血歸於肝」，躺下來肝才能好好工作','肝經經過生殖系統，經期不順、子宮肌瘤常跟肝氣鬱結有關','春天屬木屬肝，春天容易情緒起伏大就是這個原因。春天疏肝比夏天補心更重要','丑時是肝臟排毒造血的黃金期。中醫說「人臥則血歸於肝」，躺下來肝才能好好工作','肝經經過生殖系統，經期不順常跟肝氣鬱結有關','春天屬木屬肝，春天容易情緒起伏大就是這個原因。春天疏肝比夏天補心更重要','肝主筋，腳抽筋的人可能跟肝血不足有關。喝杯枸杞茶比吃鈣片有效'],
 bodyPath:'M38,96 L38,88 L40,78 L42,68 L44,58 L46,50 L48,44 L50,38 L50,34',
 bodyDots:[[38,94],[44,58],[50,34]]},

{hour:'寅',start:3,end:5,meridian:'手太陰肺經',element:'金',
 emotion:'悲傷、失落、放不下',
 acupoint:'列缺穴',location:'手腕內側橫紋上方一寸半',
 massage:'一手握另一手手腕，拇指按壓列缺穴，每次 15 秒 x 3 組',
 advice:'肺經在凌晨開始分配一天的氣。老人家常在這個時候咳嗽或醒來，是肺氣在調整。如果你睡得好，這個時候身體的修復力最強。夜班的人這個時間特別容易覺得冷。',
 oils:'尤加利（開肺）、茶樹（清呼吸道）',
 trivia:['中醫說「肺主皮毛」，皮膚不好的人先看看自己的呼吸深不深。淺呼吸的人氣色一定差','寅時是道家練功的最佳時辰，叫「寅時練氣」。空氣裡的負離子在這個時段濃度最高','肺經從胸口走到大拇指，大拇指麻的人要注意肺功能','肺與大腸相表裡，便秘的人容易長痘痘，因為大腸排不出去的東西，肺會往皮膚排','寅時是道家練功的最佳時辰，叫「寅時練氣」。空氣裡的負離子在這個時段濃度最高','肺經從胸口走到大拇指，大拇指麻的人要注意肺功能','肺與大腸相表裡，便秘的人容易長痘痘，因為大腸排不出去的東西，肺會往皮膚排','寅時咳嗽是肺經在排寒氣。不要急著吃止咳藥，那是身體的自我清理機制'],
 bodyPath:'M50,30 L48,32 L44,34 L40,36 L36,38 L32,42 L28,46 L26,50',
 bodyDots:[[50,30],[36,38],[26,50]]},

{hour:'卯',start:5,end:7,meridian:'手陽明大腸經',element:'金',
 emotion:'控制、不願放手、囤積',
 acupoint:'合谷穴',location:'虎口，大拇指和食指之間的肌肉最高點',
 massage:'拇指按壓合谷穴，有酸脹感即可，每次 30 秒 x 3 組',
 advice:'大腸經管排泄。早上起來喝一杯溫水，讓腸子動起來。如果你長期便秘，這個時間起床上廁所是最順的。不要賴床賴過七點，腸子會很失望。',
 oils:'薑（溫腸）、甜橙（促進蠕動）',
 trivia:['大腸經走到鼻翼旁邊，鼻子過敏的人按合谷穴有時候比吃藥還快','合谷穴是全身止痛第一大穴，頭痛牙痛經痛都能按。但孕婦不要按，會刺激子宮','早上五到七點排便最順，因為大腸經正在值班。錯過這個時段，一整天腸子都懶懶的','大腸經跟情緒的「放手」有關。便秘的人通常在心理上也有放不下的東西','合谷穴是全身止痛第一大穴，頭痛牙痛經痛都能按。但孕婦不要按，會刺激子宮','早上五到七點排便最順，因為大腸經正在值班。錯過這個時段，一整天腸子都懶懶的','大腸經跟情緒的「放手」有關。便秘的人通常在心理上也有放不下的東西','大腸經的合谷穴配肺經的列缺穴，叫「原絡配穴」，是治感冒的經典組合'],
 bodyPath:'M26,50 L28,46 L32,42 L36,38 L40,36 L44,34 L48,30 L50,26 L50,20 L49,16',
 bodyDots:[[26,50],[40,36],[49,16]]},

{hour:'辰',start:7,end:9,meridian:'足陽明胃經',element:'土',
 emotion:'焦慮、過度思慮、吃不下',
 acupoint:'足三里',location:'膝蓋下方四指、脛骨外側一指',
 massage:'用拳頭輕敲足三里，每次 2 分鐘，坐著就能做',
 advice:'胃經最旺的時間，一定要吃早餐。這個時候吃的東西吸收率最高。不吃早餐的人到中午血糖掉下來會特別暴躁。胃經從臉上經過，臉色蠟黃通常跟胃有關。',
 oils:'檸檬（開胃）、薄荷（助消化）',
 trivia:['足三里被稱為「長壽穴」，日本養生老人每天敲它已經變成國民運動了','胃經從眼睛下面開始，臉上長痘的位置對應不同的胃腸問題。下巴=腸，臉頰=胃','辰時吃的東西吸收率是一天最高的。不吃早餐等於浪費了身體最好的消化時段','胃經經過乳房，中醫認為乳腺問題跟胃經和肝經都有關','胃經從眼睛下面開始，臉上長痘的位置對應不同的胃腸問題。下巴=腸，臉頰=胃','辰時吃的東西吸收率是一天最高的。不吃早餐等於浪費了身體最好的消化時段','胃經經過乳房，中醫認為乳腺問題跟胃經和肝經都有關','胃經走到腳第二趾，腳第二趾比大拇趾長的人（希臘腳），中醫認為胃氣比較旺'],
 bodyPath:'M49,14 L48,18 L48,22 L50,28 L50,34 L50,42 L50,50 L48,60 L46,70 L44,80 L42,90 L42,96',
 bodyDots:[[49,14],[50,42],[44,80]]},

{hour:'巳',start:9,end:11,meridian:'足太陰脾經',element:'土',
 emotion:'過度擔心、想太多、鑽牛角尖',
 acupoint:'三陰交',location:'內踝上方四指',
 massage:'用拇指輕柔按壓三陰交，每次 20 秒 x 3 組。注意：孕婦不要按',
 advice:'脾主運化，這個時候思考力最強。適合開會、做決策、讀書。但不要一邊吃東西一邊工作，脾不喜歡你分心。脾也管肌肉，這個時段運動的效果最好。',
 oils:'迷迭香（提神醒腦）、檸檬草（活化）',
 trivia:['「思傷脾」，一直想一直想的人容易消化不良。很多時候跟想太多有關','三陰交是婦科第一大穴，經痛的時候按這裡比吃止痛藥快。但孕婦絕對不能按','脾主肌肉，肌肉無力或容易抽筋的人要養脾。多吃黃色食物：南瓜、地瓜、玉米','脾開竅於口，嘴唇乾裂脫皮可能跟脾虛有關。擦護唇膏不如喝碗四神湯','三陰交是婦科第一大穴，經痛的時候按這裡比吃止痛藥快。但孕婦絕對不能按','脾主肌肉，肌肉無力或容易抽筋的人要養脾。多吃黃色食物：南瓜、地瓜、玉米','脾開竅於口，嘴唇乾裂脫皮可能跟脾虛有關。擦護唇膏不如喝碗四神湯','脾最怕濕。台灣濕氣重，脾虛的人特別多。下雨天覺得全身沈重就是脾在喊救命'],
 bodyPath:'M42,96 L42,88 L44,78 L46,68 L48,58 L50,50 L50,44 L50,38 L48,34',
 bodyDots:[[42,94],[46,68],[48,34]]},

{hour:'午',start:11,end:13,meridian:'手少陰心經',element:'火',
 emotion:'心慌、失眠、過度興奮',
 acupoint:'神門穴',location:'手腕內側橫紋尾端凹陷處',
 massage:'用另一手拇指輕按神門穴，配合深呼吸，每次 30 秒',
 advice:'心經管神志。中午小睡 15-30 分鐘對下午的精神有巨大幫助。但不要睡超過一小時，越睡越昏。如果睡不著就閉眼休息，心經也會感謝你。',
 oils:'玫瑰（安心寧神）、薰衣草（放鬆）',
 trivia:['心經從腋下走到小指尖，緊張的時候搓搓小指頭，心會安靜下來','午時小睡叫「子午覺」，子時睡覺養膽，午時小憩養心。兩個都做到的人精神好兩倍','中醫說「心主神明」，心在中醫裡同時管意識和思維。心火旺的人話多、睡不著','舌頭是心的外在指標。舌尖紅代表心火旺，舌頭有齒痕代表脾虛。每天照鏡子看舌頭比量體重有用','午時小睡叫「子午覺」，子時睡覺養膽，午時小憩養心。兩個都做到的人精神好兩倍','中醫說「心主神明」，心在中醫裡同時管意識和思維。心火旺的人話多、睡不著','舌頭是心的外在指標。舌尖紅代表心火旺，舌頭有齒痕代表脾虛。每天照鏡子看舌頭比量體重有用','心經只有9個穴位，是十二正經裡最少的。少而精，每一個都很關鍵'],
 bodyPath:'M50,30 L48,32 L46,36 L44,40 L40,44 L36,48 L32,52 L30,54',
 bodyDots:[[50,30],[40,44],[30,54]]},

{hour:'未',start:13,end:15,meridian:'手太陽小腸經',element:'火',
 emotion:'混亂、分不清楚、難以取捨',
 acupoint:'養老穴',location:'手腕外側骨突上方凹陷處',
 massage:'旋轉手腕的同時按壓養老穴，每次 15 秒 x 3 組',
 advice:'小腸負責「分清泌濁」，就是把好的留下、不要的排掉。這個時間喝水比喝咖啡好，幫助代謝午餐。小腸經也管「判斷力」，午後做選擇題特別清楚。',
 oils:'佛手柑（消化輔助）、天竺葵（平衡）',
 trivia:['小腸經走過肩膀和後頸，下午肩膀硬，小腸經在叫你喝水','小腸經管「分清泌濁」，分不清什麼重要什麼不重要的人，小腸經可能不太通','養老穴的名字很直白，就是「養老」用的。老花眼、耳背、腰酸背痛都可以按','午餐後兩小時是小腸吸收營養的高峰期。這段時間喝冰水會讓小腸收縮，吸收力下降','小腸經管「分清泌濁」，分不清什麼重要什麼不重要的人，小腸經可能不太通','養老穴的名字很直白，就是「養老」用的。老花眼、耳背、腰酸背痛都可以按','午餐後兩小時是小腸吸收營養的高峰期。這段時間喝冰水會讓小腸收縮，吸收力下降','小腸經有19個穴位，大部分在肩膀和後頸。上班族的肩頸痠痛，按小腸經的穴位最有效'],
 bodyPath:'M30,54 L32,52 L36,48 L40,44 L44,40 L48,36 L50,30 L50,24 L50,18 L48,14',
 bodyDots:[[30,54],[44,40],[48,14]]},

{hour:'申',start:15,end:17,meridian:'足太陽膀胱經',element:'水',
 emotion:'恐懼、不安全感、膽小',
 acupoint:'委中穴',location:'膝蓋後方正中凹陷處',
 massage:'坐著雙手扶膝，拇指按壓委中穴，配合伸展，每次 15 秒 x 3 組',
 advice:'膀胱經是人體最長的經絡，從頭頂到腳底。這個時間多喝水、多走動。坐了一下午的人站起來伸展一下，讓膀胱經的氣跑通。這也是記憶力第二好的時段，適合學習。',
 oils:'尤加利（開通）、迷迭香（增強記憶）',
 trivia:['膀胱經經過整條背部，背痛的人八成跟膀胱經有關。下午按按委中穴，晚上腰會輕很多','膀胱經是人體最長的經絡，從頭頂到腳小趾，左右共 134 個穴位','申時是記憶力第二高峰（第一高峰是辰時）。下午三點到五點讀書效率特別好','古人說「膀胱者，州都之官，津液藏焉」。膀胱管水，水喝不夠的人膀胱經最先抗議','膀胱經是人體最長的經絡，從頭頂到腳小趾，左右共 134 個穴位','申時是記憶力第二高峰（第一高峰是辰時）。下午三點到五點讀書效率特別好','古人說「膀胱者，州都之官，津液藏焉」。膀胱管水，水喝不夠的人膀胱經最先抗議','膀胱經在背部有兩條線，內側那條叫「俞穴」，每個內臟都有對應的俞穴在這裡。背診就是這個原理'],
 bodyPath:'M50,12 L50,16 L50,22 L50,28 L50,34 L50,42 L50,50 L50,58 L50,66 L50,74 L50,82 L50,90 L50,96',
 bodyDots:[[50,12],[50,50],[50,74]]},

{hour:'酉',start:17,end:19,meridian:'足少陰腎經',element:'水',
 emotion:'恐懼、不安、缺乏安全感',
 acupoint:'湧泉穴',location:'腳底前三分之一凹陷處',
 massage:'用拳頭搓湧泉穴到發熱，或用網球踩著滾，每次 2 分鐘',
 advice:'腎藏精，管你的元氣。這個時間不適合太劇烈的運動，適合慢走、做瑜伽、泡腳。如果下午五六點特別累，那是腎經在提醒你該休息了。',
 oils:'雪松（穩固根基）、檀香（滋陰安神）',
 trivia:['腎開竅於耳，耳鳴的人按湧泉穴會有幫助。「耳聰目明」其實在說腎好的證據','腎藏精，精生髓，髓養骨。掉頭髮、骨質疏鬆、記憶力下降都跟腎有關','湧泉穴是腎經第一穴，也是人體最低的穴位。用熱水泡腳等於直接給腎經充電','酉時不適合劇烈運動，因為腎精在這個時候要收藏。傍晚慢走比跑步好','腎藏精，精生髓，髓養骨。掉頭髮、骨質疏鬆、記憶力下降都跟腎有關','湧泉穴是腎經第一穴，也是人體最低的穴位。用熱水泡腳等於直接給腎經充電','酉時不適合劇烈運動，因為腎精在這個時候要收藏。傍晚慢走比跑步好','腎主骨生髓，牙齒鬆動的人中醫不看牙，看腎。「齒為骨之餘」，牙好不好看腎氣'],
 bodyPath:'M42,96 L42,90 L44,82 L46,74 L48,66 L50,58 L50,50 L50,42 L50,36',
 bodyDots:[[42,96],[46,74],[50,36]]},

{hour:'戌',start:19,end:21,meridian:'手厥陰心包經',element:'火（相火）',
 emotion:'孤獨、關係焦慮、界線模糊',
 acupoint:'內關穴',location:'手腕內側橫紋上三指',
 massage:'按壓內關穴，配合深呼吸，每次 30 秒。暈車、孕吐也可以按這裡',
 advice:'心包是心臟的「保鏢」。這個時間適合散步、聊天、跟喜歡的人相處。心包經管的是你跟人之間的距離感，太近會窒息，太遠會孤單。練習剛好的距離。',
 oils:'依蘭（打開心房）、玫瑰（溫暖心輪）',
 trivia:['內關穴是暈車特效穴。下次搭車前先按 30 秒，比暈車藥快','心包經被稱為心臟的「護衛」。你覺得心痛，其實第一個擋住傷害的是心包','戌時是跟家人相處的最佳時段。心包經管「親密關係的距離感」，太近窒息太遠孤單','心包經也管你的「邊界感」。不會拒絕別人的人，心包經通常比較弱','心包經被稱為心臟的「護衛」。你覺得心痛，其實第一個擋住傷害的是心包','戌時是跟家人相處的最佳時段。心包經管「親密關係的距離感」，太近窒息太遠孤單','心包經也管你的「邊界感」。不會拒絕別人的人，心包經通常比較弱','心包經只有9個穴位，但內關穴一個就值回票價。按30秒能緩解心悸、胸悶、暈車、孕吐'],
 bodyPath:'M50,30 L48,32 L44,36 L40,40 L36,44 L32,48 L28,52 L26,54',
 bodyDots:[[50,30],[36,44],[26,54]]},

{hour:'亥',start:21,end:23,meridian:'手少陽三焦經',element:'火（相火）',
 emotion:'煩躁、靜不下來、失眠',
 acupoint:'外關穴',location:'手腕背面橫紋上三指，跟內關相對',
 massage:'按壓外關穴，每次 15 秒 x 3 組，睡前做最好',
 advice:'三焦是人體的「水利工程」，負責通調水道和氣的運行。這個時間該準備睡覺了。三焦通暢的人入睡快、睡眠深。睡前泡腳、關手機、讓三焦安靜下來。',
 oils:'薰衣草（助眠）、乳香（靜心）',
 trivia:['三焦是中醫獨有的概念，沒有對應的具體器官。上焦管心肺、中焦管脾胃、下焦管腎膀胱，像身體的「總經理」','亥時泡腳是養生圈的最大公約數。因為三焦通水道，熱水從腳底往上走，三焦的氣就通了','三焦經走在手臂外側，打電腦太久手臂外側痠痛，就是三焦經在喊累','西醫找不到三焦對應的器官，但有人認為它最接近「淋巴系統 + 筋膜系統」的綜合體','亥時泡腳是養生圈的最大公約數。因為三焦通水道，熱水從腳底往上走，三焦的氣就通了','三焦經走在手臂外側，打電腦太久手臂外側痠痛，就是三焦經在喊累','西醫找不到三焦對應的器官，但有人認為它最接近「淋巴系統+筋膜系統」的綜合體','亥時的「亥」字拆開是二人抱著一個小孩，象徵孕育新生。一天的結束就是新一天的孕育'],
 bodyPath:'M26,54 L28,52 L32,48 L36,44 L40,40 L44,36 L48,32 L50,28 L50,22 L50,16',
 bodyDots:[[26,54],[40,40],[50,16]]}
];

/* ── 五行漸層配置 ── */
var ELEMENT_GRADIENTS={
  '木':'linear-gradient(135deg,rgba(90,138,94,.12),rgba(120,170,100,.06))',
  '金':'linear-gradient(135deg,rgba(200,190,170,.12),rgba(180,165,140,.06))',
  '土':'linear-gradient(135deg,rgba(196,154,64,.12),rgba(210,180,100,.06))',
  '火':'linear-gradient(135deg,rgba(192,90,74,.12),rgba(210,130,90,.06))',
  '水':'linear-gradient(135deg,rgba(74,122,154,.12),rgba(90,140,180,.06))',
  '火（相火）':'linear-gradient(135deg,rgba(192,122,90,.12),rgba(210,150,110,.06))'
};
var ELEMENT_ACCENT={
  '木':'#5a8a5e','金':'#b09060','土':'#c49a40',
  '火':'#c05a4a','水':'#4a7a9a','火（相火）':'#c07a5a'
};
var ELEMENT_GLOW={
  '木':'rgba(90,138,94,.35)','金':'rgba(176,144,96,.35)','土':'rgba(196,154,64,.35)',
  '火':'rgba(192,90,74,.35)','水':'rgba(74,122,154,.35)','火（相火）':'rgba(192,122,90,.35)'
};

/* ── 時辰標籤（按圓環順序：子開始順時針）── */
var HOUR_LABELS=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

/* ── 注入 CSS ── */
var css='\
@keyframes mc-pulse{0%,100%{opacity:.85}50%{opacity:1}}\
@keyframes mc-fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}\
.meridian-clock-v2{background:#fffcf7;border:1px solid #e8ddd0;border-radius:16px;overflow:hidden;margin-bottom:20px;font-family:"LXGW WenKai TC","Noto Serif TC",serif;animation:mc-fade-in .5s ease}\
.mc2-top{display:flex;gap:20px;padding:20px 24px 16px;align-items:flex-start}\
.mc2-clock-col{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:10px}\
.mc2-body-col{flex:0 0 auto;display:flex;flex-direction:column;align-items:center}\
.mc2-clock-wrap{position:relative;width:200px;height:200px}\
.mc2-clock-svg{width:100%;height:100%;animation:mc-pulse 4s ease-in-out infinite}\
.mc2-center-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none}\
.mc2-center-hour{font-size:1.6rem;font-weight:600;color:#2d2418;line-height:1.2}\
.mc2-center-meridian{font-size:.82rem;color:#7a6a58;margin-top:2px}\
.mc2-countdown{font-size:.82rem;color:#9a8a74;font-variant-numeric:tabular-nums;text-align:center}\
.mc2-body-svg{width:140px;height:180px}\
.mc2-body-label{font-size:.78rem;color:#9a8a74;margin-top:4px;text-align:center}\
.mc2-info{padding:0 24px 20px}\
.mc2-emotion{font-size:.88rem;color:#7a6a58;margin-bottom:14px;padding:10px 14px;border-radius:10px;border-left:3px solid #c9a060;background:#fdf8f2;line-height:1.7}\
.mc2-advice{font-size:.9rem;color:#2d2418;line-height:1.8;margin-bottom:16px;padding:14px 16px;background:#fdf8f2;border-radius:10px;border-left:3px solid #c9a060}\
.mc2-folds{display:flex;flex-direction:column;gap:0;margin-bottom:14px}\
.mc2-fold{border:1px solid #ede6da;border-radius:10px;overflow:hidden;margin-bottom:8px}\
.mc2-fold-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer;background:#fdf8f2;font-size:.88rem;color:#2d2418;font-weight:500;user-select:none;-webkit-user-select:none}\
.mc2-fold-head:hover{background:#f8f0e4}\
.mc2-fold-arrow{font-size:.72rem;color:#9a8a74;transition:transform .25s ease}\
.mc2-fold.open .mc2-fold-arrow{transform:rotate(90deg)}\
.mc2-fold-body{max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;padding:0 14px;font-size:.88rem;color:#7a6a58;line-height:1.7}\
.mc2-fold.open .mc2-fold-body{max-height:300px;padding:10px 14px 14px}\
.mc2-trivia{font-size:.88rem;color:#7a6a58;line-height:1.7;padding:12px 14px;background:rgba(201,160,96,.06);border-radius:10px;border:1px solid rgba(201,160,96,.12)}\
.mc2-trivia-label{font-size:.78rem;color:#9a8a74;margin-bottom:6px}\
#mcTriviaText{transition:opacity .3s ease;display:block}\
@media(max-width:600px){\
  .mc2-top{flex-direction:column;align-items:center;padding:16px 16px 10px}\
  .mc2-clock-wrap{width:180px;height:180px}\
  .mc2-body-svg{width:120px;height:160px}\
  .mc2-info{padding:0 16px 16px}\
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
  return 11;
}

function getEndMs(idx){
  var d=DATA[idx];
  var now8=getUTC8Now();
  var endH=d.end;
  var target=new Date(now8);
  target.setMinutes(0,0,0);
  target.setHours(endH);
  if(target<=now8) target.setDate(target.getDate()+1);
  var localNow=new Date();
  var diff=target.getTime()-now8.getTime();
  return localNow.getTime()+diff;
}

function formatCountdown(ms){
  if(ms<=0) return '即將切換...';
  var s=Math.floor(ms/1000);
  var hh=Math.floor(s/3600);
  var mm=Math.floor((s%3600)/60);
  var ss=s%60;
  return (hh>0?(hh+':'):'')+(mm<10?'0':'')+mm+':'+(ss<10?'0':'')+ss;
}

/* ── 建立圓形時鐘 SVG ── */
function buildClockSVG(activeIdx, accentColor){
  var size=200;
  var cx=100,cy=100,r=85;
  var circumference=2*Math.PI*r;
  var segLen=circumference/12;
  var gap=4;
  var arcLen=segLen-gap;

  var svgParts=['<svg class="mc2-clock-svg" viewBox="0 0 '+size+' '+size+'" xmlns="http://www.w3.org/2000/svg">'];

  svgParts.push('<defs><filter id="mcGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>');

  for(var i=0;i<12;i++){
    var startAngle=-90+(i*30);
    var endAngle=startAngle+((arcLen/circumference)*360);
    var startRad=startAngle*Math.PI/180;
    var endRad=endAngle*Math.PI/180;
    var x1=cx+r*Math.cos(startRad);
    var y1=cy+r*Math.sin(startRad);
    var x2=cx+r*Math.cos(endRad);
    var y2=cy+r*Math.sin(endRad);
    var isActive=(i===activeIdx);
    var color=isActive?(DATA[i].color||'#e9c27d'):'#ddd5c8';
    var width=isActive?6:3;
    var opacity=isActive?1:0.5;
    var extra=isActive?' filter="url(#mcGlow)"':'';
    svgParts.push('<path d="M'+x1.toFixed(1)+','+y1.toFixed(1)+' A'+r+','+r+' 0 0,1 '+x2.toFixed(1)+','+y2.toFixed(1)+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round" opacity="'+opacity+'"'+extra+'/>');
  }

  var labelR=r+14;
  for(var j=0;j<12;j++){
    var angle=-90+(j*30)+15;
    var rad=angle*Math.PI/180;
    var lx=cx+labelR*Math.cos(rad);
    var ly=cy+labelR*Math.sin(rad);
    var isActiveLabel=(j===activeIdx);
    var lColor=isActiveLabel?(DATA[j].color||'#e9c27d'):'#b0a898';
    var lWeight=isActiveLabel?'600':'400';
    var lSize=isActiveLabel?'.7rem':'.62rem';
    svgParts.push('<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="middle" dominant-baseline="central" fill="'+lColor+'" font-size="'+lSize+'" font-weight="'+lWeight+'" font-family="inherit">'+HOUR_LABELS[j]+'</text>');
  }

  svgParts.push('</svg>');
  return svgParts.join('');
}

/* ── 建立人體經絡 SVG ── */
function buildBodySVG(d, accentColor){
  var svgParts=['<svg class="mc2-body-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'];

  svgParts.push('<defs><filter id="mcBodyGlow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>');

  // 簡約人體輪廓
  svgParts.push('<g opacity=".25" stroke="#b0a898" stroke-width=".8" fill="none">');
  svgParts.push('<circle cx="50" cy="14" r="6"/>');
  svgParts.push('<line x1="50" y1="20" x2="50" y2="24"/>');
  svgParts.push('<line x1="50" y1="24" x2="50" y2="58"/>');
  svgParts.push('<line x1="36" y1="28" x2="64" y2="28"/>');
  svgParts.push('<line x1="36" y1="28" x2="28" y2="44"/>');
  svgParts.push('<line x1="28" y1="44" x2="24" y2="56"/>');
  svgParts.push('<line x1="64" y1="28" x2="72" y2="44"/>');
  svgParts.push('<line x1="72" y1="44" x2="76" y2="56"/>');
  svgParts.push('<line x1="42" y1="58" x2="58" y2="58"/>');
  svgParts.push('<line x1="44" y1="58" x2="40" y2="78"/>');
  svgParts.push('<line x1="40" y1="78" x2="38" y2="96"/>');
  svgParts.push('<line x1="56" y1="58" x2="60" y2="78"/>');
  svgParts.push('<line x1="60" y1="78" x2="62" y2="96"/>');
  svgParts.push('</g>');

  // 經絡路線
  if(d.bodyPath){
    svgParts.push('<path d="'+d.bodyPath+'" fill="none" stroke="'+accentColor+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".85" filter="url(#mcBodyGlow)"/>');
  }

  // 穴位脈衝圓點
  if(d.bodyDots&&d.bodyDots.length){
    for(var k=0;k<d.bodyDots.length;k++){
      var dot=d.bodyDots[k];
      svgParts.push('<circle cx="'+dot[0]+'" cy="'+dot[1]+'" r="2.5" fill="'+accentColor+'" opacity=".8"><animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;1;.6" dur="2s" repeatCount="indefinite"/></circle>');
    }
  }

  svgParts.push('</svg>');
  return svgParts.join('');
}

/* ── 摺疊卡片互動 ── */
function bindFolds(container){
  var heads=container.querySelectorAll('.mc2-fold-head');
  for(var i=0;i<heads.length;i++){
    heads[i].addEventListener('click',function(){
      this.parentElement.classList.toggle('open');
    });
  }
}

/* ── 渲染 ── */
function render(container){
  var now8=getUTC8Now();
  var h=now8.getHours();
  var idx=getCurrentIndex(h);
  var d=DATA[idx];
  var accent=d.color||ELEMENT_ACCENT[d.element]||'#c9a060';
  var gradient=ELEMENT_GRADIENTS[d.element]||'none';

  var clockSVG=buildClockSVG(idx,accent);
  var bodySVG=buildBodySVG(d,accent);

  var html='<div class="meridian-clock-v2" style="background-image:'+gradient+'">';

  // 上半：時鐘 + 人體圖
  html+='<div class="mc2-top">';
  html+='<div class="mc2-clock-col">';
  html+='<div class="mc2-clock-wrap">'+clockSVG;
  html+='<div class="mc2-center-text">';
  html+='<div class="mc2-center-hour">'+d.hour+'時</div>';
  html+='<div class="mc2-center-meridian">'+d.meridian+'</div>';
  html+='</div></div>';
  html+='<div class="mc2-countdown" id="mcCountdown">載入中</div>';
  html+='</div>';
  html+='<div class="mc2-body-col">';
  html+=bodySVG;
  html+='<div class="mc2-body-label">'+d.acupoint+' '+d.location+'</div>';
  html+='</div>';
  html+='</div>';

  // 下半：資訊
  html+='<div class="mc2-info">';
  html+='<div class="mc2-emotion">情緒主題：'+d.emotion+'</div>';
  html+='<div class="mc2-advice">'+d.advice+'</div>';

  // 摺疊卡片
  html+='<div class="mc2-folds">';
  html+='<div class="mc2-fold"><div class="mc2-fold-head"><span>穴位按摩</span><span class="mc2-fold-arrow">&#9654;</span></div><div class="mc2-fold-body">'+d.massage+'</div></div>';
  html+='<div class="mc2-fold"><div class="mc2-fold-head"><span>推薦精油</span><span class="mc2-fold-arrow">&#9654;</span></div><div class="mc2-fold-body">'+d.oils+'</div></div>';
  html+='</div>';

  // 冷知識
  html+='<div class="mc2-trivia"><div class="mc2-trivia-label">小知識</div><span id="mcTriviaText">'+(Array.isArray(d.trivia)?d.trivia[0]:d.trivia)+'</span></div>';

  html+='</div></div>';

  container.innerHTML=html;
  bindFolds(container);
  return idx;
}

/* ── 初始化 ── */
function init(){
  var container=document.getElementById('meridianClockContainer');
  if(!container) return;

  var currentIdx=render(container);
  var endMs=getEndMs(currentIdx);

  setInterval(function(){
    var remain=endMs-Date.now();
    var el=document.getElementById('mcCountdown');
    if(el) el.textContent='距離下個時辰 '+formatCountdown(remain);
    if(remain<=0){
      currentIdx=render(container);
      endMs=getEndMs(currentIdx);
    }
  },1000);

  // 冷知識輪播（每 8 秒切換淡入淡出）
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
// v2 1775899767
