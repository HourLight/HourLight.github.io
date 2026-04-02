/**
 * 馥靈之鑰 內在城堡鑰匙系統 v2.0
 * assets/js/hl-castle-key.js
 *
 * v2.0 新增：
 *   - 點數兌換機制（50pt→AI解讀/100pt→深潛測驗/200pt→合盤試用）
 *   - 成就系統（7種勳章）
 *   - 城堡卡資料（截圖分享用）
 *   - 入口敘事支援（新用戶漸進解鎖）
 *   - 城堡日記（每次謎語自動記錄）
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'hl_castle_v3';
  var DIARY_KEY   = 'hl_castle_diary';

  var ACHIEVEMENTS = [
    {id:'first_key',    icon:'🗝️', name:'初入城堡',   desc:'第一次推開城堡的門',       cond:function(s){return s.totalRooms>=1;}},
    {id:'week_streak',  icon:'🔥', name:'鑰匙守護者', desc:'連續 7 天回來',             cond:function(s){return s.streak>=7;}},
    {id:'all_rooms',    icon:'👑', name:'城堡之主',   desc:'12 個房間全部解鎖一次',     cond:function(s){return s.totalRooms>=12;}},
    {id:'share_x10',    icon:'🌟', name:'傳播者',     desc:'分享城堡 10 次',            cond:function(s){return(s.shareCount||0)>=10;}},
    {id:'month_streak', icon:'💎', name:'探索大師',   desc:'連續 30 天探索城堡',        cond:function(s){return s.streak>=30;}},
    {id:'pts_100',      icon:'✨', name:'光的收藏者', desc:'累積 100 點靈感',           cond:function(s){return s.points>=100;}},
    {id:'redeem_first', icon:'🎁', name:'兌換者',     desc:'第一次用靈感點數兌換',      cond:function(s){return(s.redeemCount||0)>=1;}}
  ];

  var REDEEM_ITEMS = [
    {id:'ai_read',   cost:50,  icon:'🤖', name:'AI 解讀指令 1 次',  desc:'在任何命理工具使用一次深度解讀', action:'add_ai_quota'},
    {id:'deep_quiz', cost:100, icon:'🔮', name:'深潛測驗解鎖',      desc:'解鎖任一深潛覺察測驗完整版',    action:'unlock_deep_quiz'},
    {id:'match_try', cost:200, icon:'💞', name:'合盤試用 1 次',     desc:'解鎖合盤引擎試用一次',           action:'unlock_match'}
  ];

  var TASK_POOL = [
    {type:'draw',   label:'抽一張牌',       hint:'抽一張牌，帶一份覺察回來。',          url:'draw-hl.html?castle=1'},
    {type:'draw',   label:'抽一張輕盈牌',   hint:'抽一張馥靈輕盈牌，聽聽直覺的聲音。', url:'draw-light.html?castle=1'},
    {type:'engine', label:'算一套命盤',     hint:'去命盤引擎找到您的座標。',            url:'destiny-engine.html?castle=1'},
    {type:'fuyu',   label:'卜一卦',         hint:'去馥靈馥語問一個問題。',              url:'fuling-fuyu.html?castle=1'},
    {type:'mima',   label:'算馥靈秘碼',     hint:'去馥靈秘碼看看您的四主數。',         url:'fuling-mima.html?castle=1'},
    {type:'share',  label:'分享給朋友',     hint:'送一份覺察給一個您在意的人。',       url:'_share'},
    {type:'quiz',   label:'依附風格測驗',   hint:'您在關係裡是什麼模式？',             url:'quiz-attachment.html?castle=1'},
    {type:'quiz',   label:'EQ 情緒智商',   hint:'測測您的情緒智慧。',                 url:'quiz-eq.html?castle=1'},
    {type:'quiz',   label:'HSP 高敏感',    hint:'您是高敏感族嗎？',                   url:'quiz-hsp.html?castle=1'},
    {type:'quiz',   label:'MBTI 人格',     hint:'您是哪種人格類型？',                 url:'quiz-mbti.html?castle=1'},
    {type:'quiz',   label:'九型人格',       hint:'找到您的九型原型。',                 url:'quiz-enneagram.html?castle=1'},
    {type:'quiz',   label:'Big Five 五大', hint:'五個維度看您的性格。',               url:'quiz-bigfive.html?castle=1'},
    {type:'quiz',   label:'DISC 行為風格', hint:'您在團隊裡扮演什麼角色？',           url:'quiz-disc.html?castle=1'},
    {type:'quiz',   label:'界限感測驗',     hint:'您的界限是太硬還是太軟？',           url:'quiz-boundary.html?castle=1'},
    {type:'quiz',   label:'冒牌者症候群',   hint:'您有沒有覺得自己是假的？',           url:'quiz-impostor.html?castle=1'},
    {type:'quiz',   label:'內在小孩測驗',   hint:'您的內在小孩幾歲了？',               url:'quiz-innerchild.html?castle=1'},
    {type:'quiz',   label:'壓力指數',       hint:'最近的壓力有多大？',                 url:'quiz-stress.html?castle=1'},
    {type:'quiz',   label:'恆毅力測驗',     hint:'您能撐多久？',                       url:'quiz-grit.html?castle=1'},
    {type:'quiz',   label:'自我疼惜測驗',   hint:'您對自己夠溫柔嗎？',                 url:'quiz-selfcompassion.html?castle=1'},
    {type:'quiz',   label:'身體覺察測驗',   hint:'您的身體在說什麼？',                 url:'quiz-somatic.html?castle=1'},
    {type:'quiz',   label:'自我導航測驗',   hint:'此刻的情緒是什麼顏色？',             url:'quiz-emotion.html?castle=1'},
    {type:'quiz',   label:'VIA 性格優勢',  hint:'您的24項優勢裡最亮的是哪一個？',     url:'quiz-via.html?castle=1'},
    {type:'quiz',   label:'愛的語言',       hint:'您怎麼表達愛？',                     url:'quiz-lovelang.html?castle=1'},
    {type:'quiz',   label:'人格原型測驗',   hint:'您是哪一種原型角色？',               url:'quiz-archetype.html?castle=1'},
    {type:'quiz',   label:'精油人格',       hint:'哪支精油最像您？',                   url:'quiz-oil-personality.html?castle=1'},
    {type:'quiz',   label:'天賦優勢',       hint:'您的天賦在哪裡？',                   url:'quiz-strengths.html?castle=1'},
    {type:'quiz',   label:'RIASEC 職業',   hint:'您適合什麼工作？',                   url:'quiz-riasec.html?castle=1'},
    {type:'quiz',   label:'完美主義測驗',   hint:'您的完美主義有多強？',               url:'quiz-perfectionism.html?castle=1'},
    {type:'quiz',   label:'拖延症 6 型',   hint:'您的拖延是哪一種？',                 url:'quiz-procrastinate.html?castle=1'},
    {type:'quiz',   label:'職業倦怠量表',   hint:'您燒到什麼程度了？',                 url:'quiz-burnout.html?castle=1'},
    {type:'quiz',   label:'假性外向者',     hint:'您是真外向還是在演？',               url:'quiz-pseudo-extrovert.html?castle=1'},
    {type:'quiz',   label:'夢境心理測驗',   hint:'您的夢在告訴您什麼？',               url:'quiz-dream.html?castle=1'},
    {type:'quiz',   label:'自尊量表',       hint:'您怎麼看待自己？',                   url:'quiz-selfesteem.html?castle=1'},
    {type:'quiz',   label:'花卉人格測驗',   hint:'看看您像哪朵花？',                   url:'quiz-flower.html?castle=1'},
    {type:'quiz',   label:'左右腦偏好',     hint:'您是理性腦還是直覺腦？',             url:'quiz-brain.html?castle=1'},
    {type:'quiz',   label:'情緒天氣',       hint:'您的內在天空是什麼天氣？',           url:'quiz-emotion-weather.html?castle=1'},
    {type:'quiz',   label:'溝通盲點',       hint:'您在溝通中最常踩的雷是什麼？',       url:'quiz-comm-blind.html?castle=1'},
    {type:'quiz',   label:'愛情劇本',       hint:'您在愛情裡重複演哪齣戲？',           url:'quiz-love-script.html?castle=1'},
    {type:'quiz',   label:'心理韌性',       hint:'您被打倒後多快能站起來？',           url:'quiz-resilience.html?castle=1'}
  ];

  var ROOM_IDS = ['mirror','treasure','key','throne','love','intuition','ground','harmony','transform','dream','garden','tower'];

  // 新用戶漸進解鎖順序：每完成一個房間就多開一扇
  var UNLOCK_STAGES = [
    ['mirror'],
    ['mirror','treasure'],
    ['mirror','treasure','key'],
    ['mirror','treasure','key','throne'],
    ['mirror','treasure','key','throne','love'],
    ['mirror','treasure','key','throne','love','intuition'],
    ['mirror','treasure','key','throne','love','intuition','ground'],
    ['mirror','treasure','key','throne','love','intuition','ground','harmony'],
    ['mirror','treasure','key','throne','love','intuition','ground','harmony','transform'],
    ['mirror','treasure','key','throne','love','intuition','ground','harmony','transform','dream'],
    ['mirror','treasure','key','throne','love','intuition','ground','harmony','transform','dream','garden'],
    ROOM_IDS
  ];

  var ROOM_HINTS = {
    mirror:'這面鏡子只為認識自己的人敞開。',
    treasure:'寶庫的門認得出懂得自己價值的人。',
    key:'密室的鑰匙藏在您還沒探索過的地方。',
    throne:'王座只為敢坐上去的人準備。',
    love:'愛之殿需要您先愛自己一次。',
    intuition:'直覺閣等待一個願意閉眼的人。',
    ground:'磐石的力量來自知道自己站在哪裡。',
    harmony:'和諧苑歡迎願意看見關係的人。',
    transform:'蛻變室只讓脫下面具的人進入。',
    dream:'夢境走廊的門在意識放鬆時才會現形。',
    garden:'花園裡的花是您親手種的。',
    tower:'瞭望塔在最高處等您。'
  };

  // 12 位僕人系統 v2 — 豐富對話（時段/節氣/進度/精油知識/俏皮吐槽）
  // 節氣判斷
  function getSolarTerm(){
    var tw=new Date(new Date().getTime()+8*3600000);
    var m=tw.getUTCMonth()+1,d=tw.getUTCDate();
    var terms=[
      [1,5,'小寒'],[1,20,'大寒'],[2,4,'立春'],[2,19,'雨水'],
      [3,5,'驚蟄'],[3,20,'春分'],[4,4,'清明'],[4,20,'穀雨'],
      [5,5,'立夏'],[5,21,'小滿'],[6,5,'芒種'],[6,21,'夏至'],
      [7,7,'小暑'],[7,22,'大暑'],[8,7,'立秋'],[8,23,'處暑'],
      [9,7,'白露'],[9,23,'秋分'],[10,8,'寒露'],[10,23,'霜降'],
      [11,7,'立冬'],[11,22,'小雪'],[12,7,'大雪'],[12,22,'冬至']
    ];
    var cur='';
    for(var i=0;i<terms.length;i++){
      if(m>terms[i][0]||(m===terms[i][0]&&d>=terms[i][1])) cur=terms[i][2];
    }
    return cur||'冬至';
  }
  function getTimeSlot(){
    var h=new Date(new Date().getTime()+8*3600000).getUTCHours();
    if(h>=5&&h<12) return 'morning';
    if(h>=12&&h<18) return 'afternoon';
    return 'evening';
  }

  var SERVANTS = {
    mirror: {
      name:'鏡靈', emoji:'🪞', personality:'溫柔、善於觀察、偶爾毒舌',
      morning:['早安。今天照鏡子時，有沒有對自己微笑？','晨光最適合看清自己，來，讓我替你照一照。'],
      afternoon:['午後的光線最誠實，讓我看看你今天的表情。','下午了，你對自己說過一句好話了嗎？'],
      evening:['晚上好。黑暗中看鏡子需要勇氣，但你做到了。','夜晚的鏡子映出的，是你最真實的模樣。'],
      general:[
        '鏡子不會說謊。你準備好了嗎？',
        '有些真相，看見了就回不去了。但看見，才是自由的起點。',
        '你總是看見別人的美，卻忘了鏡子裡也有一個值得被讚美的人。',
        '我觀察你很久了——你比你以為的堅強。',
        '今天，你敢直視自己的眼睛嗎？裡面有答案。',
        '嘿，別急著修圖。原本的你就很好看。'
      ],
      oil:['乳香精油能幫助你沉靜下來，面對真實的自己。深呼吸一口，讓靈魂歸位。','橙花精油適合此刻——它溫柔地提醒你：接納，是最深的美。'],
      solar:{'春分':'春分到了，萬物重生。你也該重新認識自己了。','秋分':'秋分時分，光影等長。是時候平衡一下內心的明與暗。','冬至':'冬至夜最長，適合向內看。鏡中那個人，等你很久了。'},
      revisit:['又來了？很好，勇於面對自己的人不多。','第{n}次照鏡子了。每一次，你看見的都不一樣，對吧？']
    },
    treasure: {
      name:'寶庫者', emoji:'💎', personality:'精打細算、務實、偶爾神秘',
      morning:['早安！今天的第一筆投資，是投資在自己身上。','早起的你就是今天最珍貴的寶藏。'],
      afternoon:['午後是盤點的好時機。你最近有沒有遺忘什麼寶物？','下午好。別忘了，你自己就是最值錢的資產。'],
      evening:['晚上好。一天結束前，清點一下今天收穫了什麼。','今晚，把感恩當金幣存進口袋裡吧。'],
      general:[
        '你知道自己有多珍貴嗎？市場上可沒有第二個你。',
        '寶藏不在遠方，在你一直忽略的地方。',
        '今天，打開一個你一直沒勇氣看的抽屜。裡面有驚喜。',
        '精打細算不是小氣，是懂得珍惜。你值得被珍惜。',
        '別把自己賤賣了。你的價值不需要打折。',
        '有些東西看起來不起眼，卻是無價之寶——比如你的善良。'
      ],
      oil:['岩蘭草精油像大地的擁抱，幫你穩住價值感。腳踩實地，才知道自己有多富有。','沒藥精油是古代的珍寶，提醒你：真正的富足來自內在的豐盛。'],
      solar:{'立春':'立春了！新的一年，重新盤點你的內在資產吧。','大暑':'大暑天熱，但你的寶庫恆溫。進來歇歇。','冬至':'冬至團圓，最好的寶藏是身邊的人。'},
      revisit:['又來尋寶？好眼光。真正的寶藏越挖越多。','第{n}次來了，我幫你記著呢。每次你都帶走一點勇氣。']
    },
    key: {
      name:'鑰匙守', emoji:'🔑', personality:'神秘、話少但深、沉穩',
      morning:['⋯⋯早安。今天，有一扇門在等你。','晨光中的鑰匙孔特別亮。你看見了嗎。'],
      afternoon:['⋯⋯午安。門不會催你，但它一直在那裡。','下午的鎖比較鬆。試試看。'],
      evening:['夜深了。有些門只在月光下才出現。','⋯⋯晚安。今天打開了幾扇門？'],
      general:[
        '每一把鑰匙都對應一個勇氣。',
        '不急。鑰匙會在你準備好的時候出現。',
        '有些門看起來鎖住了，其實只是虛掩。推一下就好。',
        '⋯⋯你手裡已經握著鑰匙了。只是你還沒低頭看。',
        '打開門之前要有一個心理準備：門後的風景可能跟你想的不一樣。',
        '鑰匙不怕生鏽，怕的是你不敢用它。'
      ],
      oil:['杜松漿果精油能清除能量上的阻塞，像一把無形的鑰匙。','絲柏精油幫助你放下執念，有時候放手就是打開門的方式。'],
      solar:{'驚蟄':'驚蟄雷響，沉睡的門被叫醒了。該開門了。','白露':'白露凝結，像鑰匙上的露珠。清澈才能轉動。','小寒':'小寒天冷，但鑰匙握在手心就會暖。'},
      revisit:['⋯⋯又來了。好。','第{n}次了。你越來越知道哪些門該開了。']
    },
    throne: {
      name:'王座侍', emoji:'👑', personality:'莊重、有使命感、鼓勵',
      morning:['晨安，陛下。新的一天，新的決定在等您。','早安。王座已經擦亮，等您就座。'],
      afternoon:['午安。統治自己的人生，比統治王國更難，但您做得到。','下午了，陛下。別忘了休息也是王者的智慧。'],
      evening:['晚安，陛下。今天您做了哪些值得驕傲的決定？','夜幕降臨，請容許自己放下王冠，好好休息。'],
      general:[
        '王座等的不是完美的人，是願意負責的人。',
        '您的人生，您說了算。這不是狂妄，是覺醒。',
        '一個好的領導者，首先要能領導自己。',
        '王冠很重，但您的頭足以承載。',
        '做決定很難，不做決定更難。陛下，請決斷。',
        '有時候最勇敢的決定，是承認自己需要幫助。'
      ],
      oil:['玫瑰精油是花中之后，配得上王座前的您。它打開心輪，讓愛與勇氣同行。','大西洋雪松精油帶來沉穩的力量感，像一棵千年古木，穩穩地撐住您。'],
      solar:{'立夏':'立夏到了，萬物生長。陛下的版圖也在擴張。','秋分':'秋分收穫季，回顧一下您種下的種子吧。','大寒':'大寒嚴冬，更顯王者本色。寒風中站穩的人最了不起。'},
      revisit:['陛下再次駕臨，臣深感榮幸。','第{n}次蒞臨王座殿了。每一次您都更有王者風範。']
    },
    garden: {
      name:'花園精靈', emoji:'🌿', personality:'陽光、充滿生命力、愛說故事',
      morning:['早安呀！今天的露水好甜，你聞到了嗎？','太陽出來啦！花兒們都在伸懶腰，你也是嗎？'],
      afternoon:['午後的花園最適合發呆。來，坐下來曬太陽。','下午好！蝴蝶剛跟我說了一個秘密——你今天會有好事發生。'],
      evening:['晚安。夜來香開始散發香氣了，今晚要做個好夢喔。','夜風好涼。花園裡的螢火蟲替你點燈了。'],
      general:[
        '今天澆了水嗎？我說的是你自己。',
        '花開不是為了誰，是因為時候到了。你也是。',
        '慢慢來，花園不趕時間，你也不用趕。',
        '每朵花都有自己的花期。別拿自己跟隔壁的玫瑰比啦！',
        '雜草也是植物呀，有時候換個角度看，它還挺可愛的。',
        '你知道嗎？根長得越深，花開得越燦爛。現在辛苦的你，正在紮根。'
      ],
      oil:['天竺葵精油就像花園的守護者，平衡荷爾蒙也平衡心情。來聞一口春天！','真正薰衣草是花園的百搭款，放鬆、安撫、療癒，什麼時候都適合。'],
      solar:{'春分':'春分耶！萬物甦醒了，你的花園也在等你回來打理。','小滿':'小滿小滿，穀物漸滿。你的心也該被填滿一些溫柔。','霜降':'霜降了，花園在休息。你也該讓自己冬眠一下。'},
      revisit:['你又來花園啦！花兒們都認得你了呢。','第{n}次來了！我特別幫你留了一朵今天最漂亮的花。']
    },
    library: {
      name:'書靈', emoji:'📚', personality:'博學、引經據典、幽默',
      morning:['晨讀最養腦。早安，今天想讀什麼？','古人說「聞雞起舞」，我說「聞書起讀」。早安。'],
      afternoon:['午後犯睏？來，我讀一段給你聽。保證比咖啡有效。','下午好。有人說「書中自有黃金屋」，但我覺得書中自有安慰劑。'],
      evening:['晚安。睡前翻幾頁書，比滑手機好一百倍——我說真的。','夜讀的人最浪漫。今晚讀什麼？'],
      general:[
        '答案都在書裡，但你得先問對問題。',
        '知識是最輕的行李，也是最重的武器。',
        '莊子說：「吾生也有涯，而知也無涯。」不過別太焦慮，讀一點算一點。',
        '今天讀了什麼？哪怕一句話也好。一句話也能改變一天。',
        '有人問我推薦什麼書？我推薦你先讀自己——你是一本很精彩的書。',
        '別只收藏書單了，打開來讀啊。我在這裡等你的讀後感。'
      ],
      oil:['迷迭香精油是記憶力的好朋友，莎士比亞在《哈姆雷特》裡都提過它呢。','甜羅勒精油能提振精神、釐清思路，很適合讀書和思考時使用。'],
      solar:{'雨水':'雨水時節，適合窩在圖書館聽雨讀書。','芒種':'芒種忙種，播下知識的種子，秋天收穫智慧。','立冬':'立冬進補，腦袋也要進補。推薦你讀一本新書。'},
      revisit:['又來圖書館了？好學生！我記得你上次翻了哪本。','第{n}次造訪了。你快比我還博學了。⋯⋯開玩笑的。']
    },
    alchemy: {
      name:'煉金使', emoji:'⚗️', personality:'好奇、愛實驗、一針見血',
      morning:['早安！今天的實驗題目是——你自己。準備好了嗎？','晨光是最好的催化劑。來，我們開始今天的煉金。'],
      afternoon:['下午好。實驗進行到一半了，別半途而廢。','午後的爐火正旺，你想把什麼情緒丟進去燒一燒？'],
      evening:['晚上好。煉金爐的火焰在暗處最美。像你正在經歷的蛻變。','今天的實驗結束了嗎？每一次失敗都是新配方的開始。'],
      general:[
        '痛苦不是敵人，是原料。看你怎麼煉。',
        '最好的煉金術，是把經歷變成智慧，把傷口變成勳章。',
        '今天，你想把什麼煉成什麼？焦慮煉成行動？恐懼煉成勇氣？',
        '失敗的實驗不叫失敗，叫「排除了一種不可行的方案」。很科學的。',
        '好奇心是煉金的第一步。你對自己夠好奇嗎？',
        '別怕弄髒手。最珍貴的黃金，都是從泥巴裡煉出來的。'
      ],
      oil:['茶樹精油是大自然的煉金成果——強大的淨化力，從內到外清理不需要的東西。','檸檬精油的清新能幫你釐清混亂的思緒，像在燒杯裡加入澄清劑。'],
      solar:{'驚蟄':'驚蟄春雷響，是時候震醒沉睡的潛能了！','夏至':'夏至火最旺，煉金爐也是。大膽實驗吧。','大雪':'大雪紛飛，爐火更暖。冬天最適合煉內功。'},
      revisit:['又來實驗了？我喜歡。反覆試驗才能找到黃金配方。','第{n}次進煉金室了。你的實驗紀錄越來越厚了呢。']
    },
    music: {
      name:'音律仙', emoji:'🎵', personality:'浪漫、用音樂比喻、感性',
      morning:['早安～今天的序曲是什麼調性？我猜是明亮的大調。','鳥兒在唱晨歌，你有沒有跟著哼？'],
      afternoon:['午後的慢板最動人。放慢節奏，聽聽心跳的旋律。','下午好。你今天的心情是什麼歌？告訴我。'],
      evening:['晚安。夜曲時間到了。讓一切喧囂都漸弱（diminuendo）。','月光奏鳴曲的時間。今晚，對自己溫柔一點。'],
      general:[
        '你有多久沒聽見自己的聲音了？不是說話的聲音，是心的聲音。',
        '音樂不需要完美，需要真實。你的人生也是一首即興曲。',
        '走音也是一種風味。別怕唱錯，怕的是不敢唱。',
        '人生像交響樂，有高潮有低潮，但沒有哪個樂章是多餘的。',
        '今天，讓自己發出一個不完美的音符。那是屬於你的聲音。',
        '休止符不是沒有音樂，是音樂的一部分。你的休息也是。'
      ],
      oil:['依蘭依蘭精油是感官的交響樂，花香裡帶著甜蜜的低音。讓心跟著柔軟。','佛手柑精油像一首輕快的小步舞曲，趕走憂鬱，帶來陽光般的節奏。'],
      solar:{'春分':'春分奏起了萬物復甦的序曲。你感受到春天的旋律了嗎？','小暑':'小暑的蟬聲是夏天的打擊樂。熱情地活著吧！','小雪':'小雪紛飛像鋼琴的柔音踏板，世界安靜了。好好聆聽。'},
      revisit:['你又來聽歌了！我最喜歡有知音的感覺。','第{n}次來音樂廳了。我們之間的默契越來越好了，是不是？']
    },
    dream: {
      name:'夢行者', emoji:'🌙', personality:'夢幻、說話像在做夢、詩意',
      morning:['早安⋯⋯昨晚的夢還掛在你的睫毛上呢⋯⋯','你從夢裡帶了什麼回來？⋯⋯仔細想想⋯⋯'],
      afternoon:['午後的陽光好適合做白日夢⋯⋯閉上眼睛⋯⋯看見了嗎？','下午好⋯⋯你知道嗎，白日夢也是一種預言⋯⋯'],
      evening:['夜晚來了⋯⋯夢的大門正在緩緩打開⋯⋯','晚安⋯⋯今晚讓夢帶你去一個你清醒時不敢去的地方⋯⋯'],
      general:[
        '昨晚的夢，你還記得嗎？⋯⋯每個夢都是靈魂的呢喃⋯⋯',
        '潛意識在跟你說話⋯⋯安靜一點就聽見了⋯⋯',
        '夢是另一個你寫的信⋯⋯你讀了嗎？⋯⋯',
        '你夢見飛翔了嗎⋯⋯那代表你的靈魂想要自由⋯⋯',
        '反覆出現的夢境⋯⋯是未完成的功課⋯⋯別忽略它⋯⋯',
        '有時候⋯⋯夢裡的人不是別人⋯⋯是你自己的另一個面向⋯⋯'
      ],
      oil:['快樂鼠尾草精油⋯⋯能讓夢境更清晰⋯⋯睡前在枕頭滴一滴⋯⋯','羅馬洋甘菊精油⋯⋯是夢的搖籃曲⋯⋯幫助你安穩入夢⋯⋯'],
      solar:{'雨水':'雨水潤澤大地⋯⋯夢也被澆灌得更鮮活了⋯⋯','夏至':'夏至夜最短⋯⋯但夢最濃⋯⋯珍惜每一個夢⋯⋯','冬至':'冬至夜最長⋯⋯是做深層夢境的好時候⋯⋯'},
      revisit:['你又來了⋯⋯夢境走廊記得你的腳步聲⋯⋯','第{n}次造訪⋯⋯你的夢境地圖越來越清晰了⋯⋯']
    },
    tower: {
      name:'星占師', emoji:'⭐', personality:'哲學、愛看星星、冷靜宏觀',
      morning:['晨安。太陽升起，但星星只是隱藏了，它們一直在。','早安。今天的星象顯示——適合勇敢一次。'],
      afternoon:['午安。白天看不見星星，不代表它們不存在。就像你看不見的力量。','下午好。天頂的太陽代表你此刻擁有最大的能量。善用它。'],
      evening:['晚安。抬頭看看，今晚的星座想跟你說什麼？','夜空好美。你在宇宙的位置，剛剛好。'],
      general:[
        '站高一點看，困境就小了。站再高一點，連地球都小了。',
        '看清方向比走得快重要。GPS 再快也要先定位。',
        '宇宙這麼大，你的煩惱大概只佔一顆塵埃。但你的存在佔了一顆星。',
        '星星不著急發光，它只是一直在燃燒。你也是。',
        '人生的路沒有走錯，只有走了不同的星軌。',
        '占星不是算命。是理解自己在宇宙中的位置和使命。'
      ],
      oil:['乳香精油自古用於冥想和星象儀式，幫助你連結更高的自己。','檀香精油讓思緒沉靜，適合在星空下思考人生大問題。'],
      solar:{'春分':'春分晝夜等長，宇宙在提醒你：平衡。','夏至':'夏至陽氣最盛，像星星在最亮的時候。全力以赴。','冬至':'冬至一陽生，最暗的夜之後是轉折。相信光會回來。'},
      revisit:['又來看星星了？你的眼睛裡有星光，你知道嗎？','第{n}次登上瞭望塔了。你的視野越來越開闊。']
    },
    kitchen: {
      name:'灶神', emoji:'🍳', personality:'熱情、愛分享食譜、碎念',
      morning:['早安！吃早餐了沒？沒有的話我生氣囉。','早上好！今天的早餐要吃得像女王一樣，聽到沒？'],
      afternoon:['午餐吃了嗎？不要跟我說隨便吃。隨便是什麼菜？','下午茶時間！給自己泡杯花草茶，加一塊手工餅乾。你值得。'],
      evening:['晚安。晚餐不要亂吃泡麵！⋯⋯好啦偶爾可以。','今天辛苦了。回家煮碗熱湯，暖胃也暖心。'],
      general:[
        '吃飽了嗎？吃好了嗎？身體是靈魂的房子，要好好餵它。',
        '今天為自己煮一頓飯，不為別人。那叫自我疼愛。',
        '你知道嗎？好好吃飯的人，運氣都不會太差。',
        '別只顧著餵別人。你自己的碗空了多久了？',
        '廚房是全城堡最有愛的地方。因為所有的關心都從這裡端出來。',
        '減肥的事明天再說。今天先把自己餵飽，嗯？'
      ],
      oil:['甜橙精油是廚房的好夥伴，不但香氣開胃，還能舒緩消化不適。滴兩滴在擴香裡，煮飯心情就好了。','薑精油暖胃又暖心，感覺冷的時候泡個薑茶，再加一滴檸檬精油，完美。'],
      solar:{'立春':'立春了！來碗春捲配花草茶，吃出春天的味道。','大暑':'大暑天熱，煮碗綠豆薏仁湯消消暑吧。','立冬':'立冬進補！薑母鴨、麻油雞，看你選哪個？'},
      revisit:['又來廚房了！乖！我最喜歡會回來吃飯的孩子。','第{n}次來了。你的專屬碗我都洗好放著了。']
    },
    secret: {
      name:'暗道守', emoji:'🚪', personality:'低調、觀察力強、守口如瓶',
      morning:['⋯⋯早。你來得比平常早。有心事？','晨光太亮了。來暗道裡歇一歇。這裡很安全。'],
      afternoon:['⋯⋯下午好。你知道我一直在這裡。','午後的暗道特別安靜。適合面對那些你白天不敢想的事。'],
      evening:['⋯⋯晚上好。暗道在夜裡反而最自在。你也是嗎？','夜深了。暗道的盡頭有光，你看見了嗎？'],
      general:[
        '有些路只有你自己能走。但我會在旁邊替你守著。',
        '暗處不一定危險，有時候是安全。光太強的時候，陰影反而是庇護。',
        '我觀察你很久了。你比自己以為的更勇敢。',
        '秘密不是壞事。每個人都需要一個安全的角落。',
        '⋯⋯你不用什麼都說出來。我懂。',
        '暗道的好處是——走過黑暗的人，不再怕黑。'
      ],
      oil:['岩蘭草精油，深沉而穩重，像暗道裡最可靠的扶手。幫你穩穩走過不安。','廣藿香精油帶著大地的氣息，在暗處也能讓你感覺腳踏實地。'],
      solar:{'白露':'白露凝結在暗道口⋯⋯微光中的水珠，像未說出口的話。','霜降':'霜降了。暗道的牆壁結了一層薄霜，觸感像記憶。','小寒':'小寒入骨。但暗道裡有我在，不冷。'},
      revisit:['⋯⋯你又來了。嗯。','第{n}次了。暗道已經認得你的氣息了。']
    }
  };

  function getServantGreeting(roomId){
    var s = SERVANTS[roomId];
    if(!s) return null;
    var dk = todayKey();
    var tw = new Date(new Date().getTime()+8*3600000);
    var ts = getTimeSlot();
    var term = getSolarTerm();
    // 計算訪問次數
    var visitKey = 'hlCastle_visit_'+roomId;
    var visitCount = 1;
    try { visitCount = parseInt(localStorage.getItem(visitKey)||'0',10)+1; localStorage.setItem(visitKey, String(visitCount)); } catch(e){}
    // 建構候選對話池
    var pool = [];
    // 時段問候（高權重）
    var timeGreets = s[ts] || [];
    for(var i=0;i<timeGreets.length;i++) pool.push(timeGreets[i]);
    // 通用對話
    for(var i=0;i<s.general.length;i++) pool.push(s.general[i]);
    // 精油知識
    if(s.oil) for(var i=0;i<s.oil.length;i++) pool.push(s.oil[i]);
    // 節氣問候
    if(s.solar && s.solar[term]) pool.push(s.solar[term]);
    // 回訪問候（第3次以上）
    if(visitCount>=3 && s.revisit){
      for(var i=0;i<s.revisit.length;i++) pool.push(s.revisit[i].replace('{n}',String(visitCount)));
    }
    // 用日期+時段做種子，每個時段換一句
    var seed = dk + '_' + ts + '_' + roomId;
    var hash = 0;
    for(var i=0;i<seed.length;i++) hash=((hash<<5)-hash)+seed.charCodeAt(i);
    var idx = Math.abs(hash) % pool.length;
    return {name:s.name, emoji:s.emoji, personality:s.personality, greeting:pool[idx]};
  }

  var ROOM_NAMES = {
    mirror:'鏡之廳',treasure:'價值寶庫',key:'解鎖密室',throne:'啟程塔',
    love:'愛之殿',intuition:'直覺閣',ground:'磐石廳',harmony:'和諧苑',
    transform:'蛻變室',dream:'夢境走廊',garden:'記憶花園',tower:'瞭望塔'
  };

  var ROOM_ICONS = {
    mirror:'🪞',treasure:'💎',key:'🔑',throne:'👑',love:'💕',
    intuition:'🔮',ground:'🏔️',harmony:'🌿',transform:'🦋',
    dream:'🌙',garden:'🌸',tower:'🔭'
  };

  var UNLOCK_MSGS = {
    treasure:'🎉 鏡之廳探索完成！<br>價值寶庫的門悄悄打開了。',
    key:'🎉 連探兩房！解鎖密室正在等您。',
    throne:'🎉 H.O.U.R. 四塔全開！<br>L.I.G.H.T. 五房間接著解鎖。',
    love:'✨ 愛之殿已開啟。',
    intuition:'✨ 直覺閣已開啟。',
    ground:'✨ 磐石廳已開啟。',
    harmony:'✨ 和諧苑已開啟。',
    transform:'🌟 L.I.G.H.T. 五房全開！<br>最後三個秘境正在現身…',
    dream:'🌙 夢境走廊已開啟。',
    garden:'🌸 記憶花園已開啟。',
    tower:'🔭 城堡最高處，瞭望塔，等您了。'
  };

  function todayKey(){
    var tw=new Date(new Date().getTime()+8*3600000);
    return tw.getUTCFullYear()+'-'+String(tw.getUTCMonth()+1).padStart(2,'0')+'-'+String(tw.getUTCDate()).padStart(2,'0');
  }

  function seededShuffle(arr,seed){
    var s=0;for(var i=0;i<seed.length;i++)s=((s<<5)-s)+seed.charCodeAt(i);
    var a=arr.slice();
    for(var i=a.length-1;i>0;i--){s=(s*16807+0)%2147483647;var j=Math.abs(s)%(i+1);var t=a[i];a[i]=a[j];a[j]=t;}
    return a;
  }

  function loadState(){
    var def={points:0,streak:1,totalRooms:0,daily:{},lastDate:'',
             unlockedRooms:['mirror'],achievements:[],shareCount:0,
             redeemCount:0,redeemHistory:[],milestones:{},castleBonus:{}};
    try{
      var raw=localStorage.getItem(STORAGE_KEY);
      if(!raw)return def;
      var d=JSON.parse(raw);
      var today=todayKey();
      var yest=(function(){var y=new Date(new Date().getTime()+8*3600000-86400000);
        return y.getUTCFullYear()+'-'+String(y.getUTCMonth()+1).padStart(2,'0')+'-'+String(y.getUTCDate()).padStart(2,'0');})();
      def.points=d.points||0;def.totalRooms=d.totalRooms||0;
      def.shareCount=d.shareCount||0;def.redeemCount=d.redeemCount||0;
      def.redeemHistory=d.redeemHistory||[];def.milestones=d.milestones||{};
      def.achievements=d.achievements||[];def.castleBonus=d.castleBonus||{};
      def.unlockedRooms=(d.unlockedRooms&&d.unlockedRooms.length)?d.unlockedRooms:ROOM_IDS.slice();
      if(d.lastDate===today){def.streak=d.streak||1;def.daily=d.daily||{};}
      else if(d.lastDate===yest){def.streak=(d.streak||0)+1;def.daily={};}
      else{def.streak=1;def.daily={};}
      def.lastDate=d.lastDate;return def;
    }catch(e){return def;}
  }

  function saveState(st){st.lastDate=todayKey();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(st));}catch(e){}}

  function loadDiary(){try{var r=localStorage.getItem(DIARY_KEY);return r?JSON.parse(r):[];}catch(e){return[];}}

  function appendDiary(roomId,question,answer,insight){
    var d=loadDiary();
    d.unshift({date:todayKey(),roomId:roomId,
      roomName:ROOM_NAMES[roomId]||roomId,roomIcon:ROOM_ICONS[roomId]||'🏰',
      question:question||'',answer:answer||'',
      insight:(insight||'').replace(/<[^>]*>/g,'').substring(0,80)});
    if(d.length>90)d=d.slice(0,90);
    try{localStorage.setItem(DIARY_KEY,JSON.stringify(d));}catch(e){}
  }

  function checkAch(st){
    var newOnes=[];
    ACHIEVEMENTS.forEach(function(a){
      if(st.achievements.indexOf(a.id)===-1&&a.cond(st)){st.achievements.push(a.id);newOnes.push(a);}
    });
    return newOnes;
  }

  var state=loadState();
  var todayTasks=getTodayTasks();

  function getTodayTasks(){
    var s=seededShuffle(TASK_POOL,todayKey()+'_castle');
    var t={};ROOM_IDS.forEach(function(r,i){t[r]=s[i%s.length];});return t;
  }

  window.hlCastle={
    getState:function(){
      return{points:state.points,streak:state.streak,totalRooms:state.totalRooms,
             daily:state.daily,shareCount:state.shareCount,redeemCount:state.redeemCount,
             achievements:state.achievements,unlockedRooms:state.unlockedRooms,
             todayOpened:Object.keys(state.daily).filter(function(k){return state.daily[k]==='done';}).length,
             maxDaily:3+(state.daily._bonusDoors||0)};
    },
    hasKey:function(r){return state.daily[r]==='key'||state.daily[r]==='done';},
    isDone:function(r){return state.daily[r]==='done';},
    isUnlocked:function(r){return state.unlockedRooms.indexOf(r)>-1;},
    canOpen:function(){
      var o=Object.keys(state.daily).filter(function(k){return state.daily[k]==='done';}).length;
      return o<(3+(state.daily._bonusDoors||0));
    },
    giveKey:function(r){
      if(!r)return false;
      if(state.daily[r]!=='done'){state.daily[r]='key';saveState(state);}
      return true;
    },
    autoGiveFromUrl:function(){
      var p=new URLSearchParams(window.location.search);
      if(p.get('castle')!=='1')return;
      var pg=window.location.pathname.split('/').pop().split('?')[0];
      ROOM_IDS.forEach(function(r){
        var t=todayTasks[r];
        if(t&&t.url&&t.url.indexOf(pg)>-1&&state.daily[r]!=='done'){state.daily[r]='key';saveState(state);}
      });
    },
    completeRoom:function(roomId,question,answer,insight){
      if(!this.hasKey(roomId))return{ok:false,reason:'no_key'};
      if(!this.canOpen())return{ok:false,reason:'daily_full'};
      state.daily[roomId]='done';
      var pts=2;
      if(state.streak>1)pts+=2;
      var first=!state.milestones[roomId];
      if(first){pts+=5;state.milestones[roomId]=true;}
      state.points+=pts;
      state.totalRooms=(state.totalRooms||0)+1;
      if(question&&answer)appendDiary(roomId,question,answer,insight||'');
      // 敘事解鎖
      var stage=UNLOCK_STAGES[Math.min(state.totalRooms,UNLOCK_STAGES.length-1)];
      var newUnlocked=[];
      stage.forEach(function(r){if(state.unlockedRooms.indexOf(r)===-1){state.unlockedRooms.push(r);newUnlocked.push(r);}});
      var newAch=checkAch(state);
      saveState(state);
      return{ok:true,ptsEarned:pts,isFirstEver:first,newlyUnlocked:newUnlocked,
             newAchievements:newAch,
             unlockMsg:newUnlocked.length?UNLOCK_MSGS[newUnlocked[newUnlocked.length-1]]:null};
    },
    addPoints:function(n){state.points+=(n||0);saveState(state);},
    shareBonus:function(){
      state.points+=2;state.shareCount=(state.shareCount||0)+1;
      state.daily._bonusDoors=(state.daily._bonusDoors||0)+1;
      var na=checkAch(state);saveState(state);return{newAchievements:na};
    },
    redeem:function(itemId){
      var item=REDEEM_ITEMS.filter(function(i){return i.id===itemId;})[0];
      if(!item)return{ok:false,reason:'not_found'};
      if(state.points<item.cost)return{ok:false,reason:'not_enough',need:item.cost-state.points};
      state.points-=item.cost;
      state.redeemCount=(state.redeemCount||0)+1;
      state.redeemHistory=(state.redeemHistory||[]);
      state.redeemHistory.unshift({item:itemId,cost:item.cost,date:todayKey()});
      state.castleBonus=state.castleBonus||{};
      if(item.action==='add_ai_quota')state.castleBonus.aiQuota=(state.castleBonus.aiQuota||0)+1;
      else if(item.action==='unlock_deep_quiz')state.castleBonus.deepQuizUnlock=(state.castleBonus.deepQuizUnlock||0)+1;
      else if(item.action==='unlock_match')state.castleBonus.matchTry=(state.castleBonus.matchTry||0)+1;
      var na=checkAch(state);saveState(state);
      return{ok:true,item:item,newAchievements:na};
    },
    getRedeemItems:function(){
      return REDEEM_ITEMS.map(function(i){return Object.assign({},i,{canAfford:state.points>=i.cost});});
    },
    getAllAchievements:function(){
      return ACHIEVEMENTS.map(function(a){return Object.assign({},a,{unlocked:state.achievements.indexOf(a.id)>-1});});
    },
    getCastleCard:function(roomId,insightText){
      return{roomIcon:ROOM_ICONS[roomId]||'🏰',roomName:ROOM_NAMES[roomId]||'城堡',
             insight:insightText||'',streak:state.streak,points:state.points,
             date:todayKey(),totalDays:state.totalRooms};
    },
    getDiary:function(limit){var d=loadDiary();return limit?d.slice(0,limit):d;},
    getTodayTask:function(r){return todayTasks[r]||null;},
    getRoomHint:function(r){return ROOM_HINTS[r]||'';},
    getVisibleRooms:function(){return state.unlockedRooms.slice();},
    getCastleBonus:function(){return state.castleBonus||{};},
    getServant:function(roomId){return getServantGreeting(roomId);},
    getServants:function(){return SERVANTS;},
    reload:function(){state=loadState();todayTasks=getTodayTasks();}
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){window.hlCastle.autoGiveFromUrl();});
  }else{window.hlCastle.autoGiveFromUrl();}

  /* ── 城堡任務回程 Banner ──────────────────────────────
   * 偵測 ?castle=1 → 結果區出現時自動注入「帶著鑰匙回城堡」按鈕
   * 支援三種結果區結構：
   *   1. .quiz-result.active   (39 頁)
   *   2. #quizResult.active    (9 頁)
   *   3. #ra                   (1 頁)
   * ─────────────────────────────────────────────────── */
  (function(){
    var p=new URLSearchParams(window.location.search);
    if(p.get('castle')!=='1') return;

    var injected=false;

    function injectBanner(){
      if(injected) return;
      // 找已顯示的結果區（涵蓋測驗/抽牌/占卜/馥靈頁面）
      var el=document.querySelector([
        '.quiz-result.active',
        '#quizResult.active',
        '#ra:not(:empty)',
        '#aromaResult:not([style*="display: none"]):not([style*="display:none"])',
        '#readingBox:not([style*="display: none"]):not([style*="display:none"]):not(:empty)',
        '#spreadResult:not([style*="display: none"]):not([style*="display:none"])',
        '#aiResultBlock:not([style*="display: none"]):not([style*="display:none"])',
        '#fuyu-today:not([style*="display: none"]):not([style*="display:none"])',
        '#fuyu-oil:not([style*="display: none"]):not([style*="display:none"])'
      ].join(','));
      if(!el || !el.offsetParent) return; // 還沒顯示
      if(el.querySelector('.hl-castle-return')) return; // 已注入

      injected=true;

      var banner=document.createElement('div');
      banner.className='hl-castle-return';
      banner.style.cssText=[
        'margin:0 0 20px 0',
        'padding:18px 20px',
        'background:linear-gradient(135deg,rgba(92,58,99,0.85),rgba(29,17,51,0.95))',
        'border:1px solid rgba(233,194,125,0.45)',
        'border-radius:18px',
        'text-align:center',
        'animation:hlCastlePopIn .5s cubic-bezier(.16,1,.3,1) both'
      ].join(';');

      banner.innerHTML=
        '<div style="font-size:1.5rem;margin-bottom:6px">🗝️</div>'+
        '<div style="font-size:.92rem;color:#f8dfa5;font-weight:600;margin-bottom:4px;letter-spacing:.5px">鑰匙已拿到！</div>'+
        '<div style="font-size:.8rem;color:rgba(249,240,229,.7);margin-bottom:14px">帶著這份覺察，回城堡開啟今天的房間</div>'+
        '<a href="castle-game.html" style="'+[
          'display:inline-block',
          'padding:11px 28px',
          'background:linear-gradient(135deg,#b8922a,#e9c27d)',
          'color:#1a0f2e',
          'border-radius:999px',
          'font-size:.92rem',
          'font-weight:700',
          'text-decoration:none',
          'letter-spacing:.5px',
          'transition:all .25s'
        ].join(';')+'">🏰 回到城堡</a>';

      // 插到結果區最前面
      el.insertBefore(banner, el.firstChild);

      // 注入動畫 keyframe（只注一次）
      if(!document.getElementById('hl-castle-anim')){
        var st=document.createElement('style');
        st.id='hl-castle-anim';
        st.textContent='@keyframes hlCastlePopIn{from{opacity:0;transform:translateY(-12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}';
        document.head.appendChild(st);
      }

      // 自動滾到 banner
      setTimeout(function(){
        banner.scrollIntoView({behavior:'smooth',block:'nearest'});
      },300);
    }

    // MutationObserver 監聽結果區 class 變化
    var observer=new MutationObserver(function(){injectBanner();});
    function startObserve(){
      var targets=[
        document.querySelector('.quiz-result'),
        document.getElementById('quizResult'),
        document.getElementById('ra'),
        document.getElementById('aromaResult'),
        document.getElementById('readingBox'),
        document.getElementById('spreadResult'),
        document.getElementById('aiResultBlock'),
        document.getElementById('fuyu-today'),
        document.getElementById('fuyu-oil')
      ].filter(Boolean);
      targets.forEach(function(t){
        observer.observe(t,{attributes:true,childList:true,subtree:false,attributeFilter:['class','style']});
      });
      // 也輪詢一次（防止已顯示但 observer 來不及）
      injectBanner();
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',function(){
        setTimeout(startObserve,200);
      });
    }else{
      setTimeout(startObserve,200);
    }
    // 定時補漏（有些頁面 JS 很晚才渲染結果）
    var poll=setInterval(function(){
      injectBanner();
      if(injected) clearInterval(poll);
    },800);
    setTimeout(function(){clearInterval(poll);},60000);
  })();
})();
