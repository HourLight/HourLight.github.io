// hl-castle-daily.js  v1.0
// 城堡每日任務 + 隱藏機關 + 房間靈魂語錄
// 純 JS 注入，不修改任何房間頁面結構
(function(){
  'use strict';

  // ── 1. 偵測目前房間 ────────────────────────────────────
  var ROOM_SLUGS = {
    'castle-room-star':      { name:'星象台',   icon:'🌌' },
    'castle-room-dream':     { name:'夢境殿',   icon:'🌙' },
    'castle-room-library':   { name:'學院塔',   icon:'📚' },
    'castle-room-garden':    { name:'城堡庭院', icon:'🌸' },
    'castle-room-mirror':    { name:'鏡之廳',   icon:'🪞' },
    'castle-room-ground':    { name:'地基宮',   icon:'🔑' },
    'castle-room-key':       { name:'鑰匙廳',   icon:'🗝️' },
    'castle-room-secret':    { name:'秘密室',   icon:'🔮' },
    'castle-room-throne':    { name:'王座廳',   icon:'👑' },
    'castle-room-harmony':   { name:'和諧苑',   icon:'🪷' },
    'castle-room-love':      { name:'愛情室',   icon:'💝' },
    'castle-room-intuition': { name:'直覺廳',   icon:'⚡' },
    'castle-room-transform': { name:'蛻變室',   icon:'🦋' },
    'castle-room-music':     { name:'音樂廳',   icon:'🎵' },
    'castle-room-kitchen':   { name:'廚房',     icon:'🌿' },
    'castle-room-alchemy':   { name:'煉金室',   icon:'⚗️' },
    'castle-room-treasure':  { name:'寶藏廳',   icon:'💎' }
  };

  var path = location.pathname.replace(/.*\//, '').replace('.html', '');
  var room = ROOM_SLUGS[path];
  if (!room) return; // 不是城堡房間頁面，退出

  // ── 2. 每日任務資料庫 ──────────────────────────────────
  // 每個房間 14 個任務，日期輪替（不重複 2 週）
  var QUEST_POOLS = {
    'castle-room-star': [
      { id:'s1',  text:'前往命運引擎查詢你的命盤',      link:'destiny-engine.html',      reward_mat:'star_shard',      reward_pt:1 },
      { id:'s2',  text:'完成一次八字排盤',               link:'bazi.html',                reward_mat:'time_fragment',   reward_pt:1 },
      { id:'s3',  text:'查看你的西洋星座命盤',           link:'astro.html',               reward_mat:'wuxing_crystal',  reward_pt:1 },
      { id:'s4',  text:'探索紫微斗數命宮',               link:'ziwei.html',               reward_mat:'star_shard',      reward_pt:1 },
      { id:'s5',  text:'查看人類圖設計圖',               link:'hd.html',                  reward_mat:'time_fragment',   reward_pt:1 },
      { id:'s6',  text:'完成一次瑪雅曆查詢',             link:'maya.html',                reward_mat:'wuxing_crystal',  reward_pt:1 },
      { id:'s7',  text:'抽一張牌問今天的方向',           link:'draw-hl.html',             reward_mat:'star_shard',      reward_pt:1 },
      { id:'s8',  text:'查詢你的三角生命密碼',           link:'triangle-calculator.html', reward_mat:'time_fragment',   reward_pt:1 },
      { id:'s9',  text:'查看七政四餘命盤',               link:'qizheng.html',             reward_mat:'star_shard',      reward_pt:1 },
      { id:'s10', text:'計算你的生命靈數',               link:'lifepath.html',            reward_mat:'wuxing_crystal',  reward_pt:1 },
      { id:'s11', text:'完成一次數字命理查詢',           link:'numerology.html',          reward_mat:'time_fragment',   reward_pt:1 },
      { id:'s12', text:'去感受一下合盤的力量',           link:'destiny-match.html',       reward_mat:'star_shard',      reward_pt:1 },
      { id:'s13', text:'查詢你的農曆馥靈秘碼',           link:'fuling-mima.html',         reward_mat:'wuxing_crystal',  reward_pt:1 },
      { id:'s14', text:'在星象台合成一件星空傢具',       link:'castle-materials.html',    reward_mat:'destiny_core',    reward_pt:1 }
    ],
    'castle-room-dream': [
      { id:'d1',  text:'進行一次夢境解碼',               link:'dream-decoder.html',       reward_mat:'dream_fragment',  reward_pt:1 },
      { id:'d2',  text:'照一照真實之鏡',                 link:'mirror-oracle.html',       reward_mat:'sleep_mist',      reward_pt:1 },
      { id:'d3',  text:'抽一張今日情緒牌',               link:'draw-hl.html',             reward_mat:'dream_fragment',  reward_pt:1 },
      { id:'d4',  text:'完成一次易經占卜問潛意識',       link:'yijing-oracle.html',       reward_mat:'lucid_crystal',   reward_pt:1 },
      { id:'d5',  text:'做一個關係覺察測驗',             link:'quiz-attachment-style.html', reward_mat:'sleep_mist',    reward_pt:1 },
      { id:'d6',  text:'做一次天使卡占卜',               link:'angel-oracle.html',        reward_mat:'dream_fragment',  reward_pt:1 },
      { id:'d7',  text:'進行季節神諭查詢',               link:'season-oracle.html',       reward_mat:'lucid_crystal',   reward_pt:1 },
      { id:'d8',  text:'完成一次 Big Five 人格測驗',     link:'quiz-big5.html',           reward_mat:'sleep_mist',      reward_pt:1 },
      { id:'d9',  text:'讓夢境領你去煉金室探索',         link:'castle-room-alchemy.html', reward_mat:'dream_fragment',  reward_pt:1 },
      { id:'d10', text:'完成深潛覺察測驗',               link:'quiz-hub.html',            reward_mat:'lucid_crystal',   reward_pt:1 },
      { id:'d11', text:'查詢你的農曆秘碼',               link:'fuling-mima.html',         reward_mat:'sleep_mist',      reward_pt:1 },
      { id:'d12', text:'在夢境殿抽一次 5 張牌',          link:'draw-hl.html',             reward_mat:'dream_fragment',  reward_pt:1 },
      { id:'d13', text:'照見鏡之廳的另一個自己',         link:'castle-room-mirror.html',  reward_mat:'lucid_crystal',   reward_pt:1 },
      { id:'d14', text:'照顧你的內在孩子：做覺察測驗',   link:'quiz-hub.html',            reward_mat:'subconsious_orb', reward_pt:1 }
    ],
    'castle-room-library': [
      { id:'l1',  text:'閱讀一篇芳療知識文章',           link:'knowledge-hub.html',       reward_mat:'wisdom_scroll',   reward_pt:1 },
      { id:'l2',  text:'完成 MBTI 16 型測驗',            link:'quiz-mbti.html',           reward_mat:'chart_ink',       reward_pt:1 },
      { id:'l3',  text:'了解九型人格',                   link:'quiz-enneagram.html',      reward_mat:'wisdom_scroll',   reward_pt:1 },
      { id:'l4',  text:'深入芳療共享園地',               link:'aroma-garden.html',        reward_mat:'chart_ink',       reward_pt:1 },
      { id:'l5',  text:'研究認知芳療理論',               link:'cognitive-aromatherapy-theory.html', reward_mat:'wisdom_scroll', reward_pt:1 },
      { id:'l6',  text:'探索座標哲學',                   link:'coordinate-philosophy.html', reward_mat:'chart_ink',     reward_pt:1 },
      { id:'l7',  text:'完成 DISC 測驗',                 link:'quiz-disc.html',           reward_mat:'wisdom_scroll',   reward_pt:1 },
      { id:'l8',  text:'了解 EQ 情緒智能',               link:'quiz-eq.html',             reward_mat:'chart_ink',       reward_pt:1 },
      { id:'l9',  text:'研讀護膚科學',                   link:'skincare-science.html',    reward_mat:'wisdom_scroll',   reward_pt:1 },
      { id:'l10', text:'了解靈氣療法',                   link:'reiki-guide.html',         reward_mat:'chart_ink',       reward_pt:1 },
      { id:'l11', text:'研究芳療認證指南',               link:'certification-guide.html', reward_mat:'wisdom_scroll',   reward_pt:1 },
      { id:'l12', text:'完成愛之語測驗',                 link:'quiz-love-language.html',  reward_mat:'chart_ink',       reward_pt:1 },
      { id:'l13', text:'探索元辰宮歷史',                 link:'yuan-chen-guide.html',     reward_mat:'wisdom_scroll',   reward_pt:1 },
      { id:'l14', text:'讀懂按摩科學基礎',               link:'massage-guide.html',       reward_mat:'chart_ink',       reward_pt:1 }
    ],
    'castle-room-garden': [
      { id:'g1',  text:'在花園抽一張情緒牌',             link:'draw-hl.html',             reward_mat:'dawn_dew',        reward_pt:1 },
      { id:'g2',  text:'探索芳療配方花園',               link:'aroma-garden.html',        reward_mat:'angel_feather',   reward_pt:1 },
      { id:'g3',  text:'讓天使卡給你一個指引',           link:'angel-oracle.html',        reward_mat:'dawn_dew',        reward_pt:1 },
      { id:'g4',  text:'去完成一個心理測驗',             link:'quiz-hub.html',            reward_mat:'angel_feather',   reward_pt:1 },
      { id:'g5',  text:'在 SPA 牌陣感受身體的聲音',     link:'draw-spa.html',            reward_mat:'dawn_dew',        reward_pt:1 },
      { id:'g6',  text:'打開音樂廳讓聲音穿過庭院',       link:'castle-room-music.html',   reward_mat:'angel_feather',   reward_pt:1 },
      { id:'g7',  text:'為自己選一支今日精油牌',         link:'draw-hl.html',             reward_mat:'dawn_dew',        reward_pt:1 },
      { id:'g8',  text:'做一個兒童芳療知識閱讀',         link:'kids-aromatherapy.html',   reward_mat:'angel_feather',   reward_pt:1 },
      { id:'g9',  text:'在 Draw Hub 感受今日能量',       link:'draw-hub.html',            reward_mat:'dawn_dew',        reward_pt:1 },
      { id:'g10', text:'完成女巫原力測驗',               link:'witch-power.html',         reward_mat:'angel_feather',   reward_pt:1 },
      { id:'g11', text:'查詢你的季節神諭',               link:'season-oracle.html',       reward_mat:'dawn_dew',        reward_pt:1 },
      { id:'g12', text:'在調香指南找一個喜歡的香調',     link:'blending-guide.html',      reward_mat:'angel_feather',   reward_pt:1 },
      { id:'g13', text:'讀一篇知識學苑文章',             link:'knowledge-hub.html',       reward_mat:'dawn_dew',        reward_pt:1 },
      { id:'g14', text:'從庭院走進廚房採集香草',         link:'castle-room-kitchen.html', reward_mat:'angel_feather',   reward_pt:1 }
    ],
    'castle-room-mirror': [
      { id:'mi1', text:'照一照真實之鏡',                 link:'mirror-oracle.html',       reward_mat:'honest_mirror',   reward_pt:1 },
      { id:'mi2', text:'完成投射卡測驗',                 link:'projection-cards.html',    reward_mat:'mirror_truth',    reward_pt:1 },
      { id:'mi3', text:'做一個自我覺察測驗',             link:'quiz-hub.html',            reward_mat:'honest_mirror',   reward_pt:1 },
      { id:'mi4', text:'完成依附型態測驗',               link:'quiz-attachment-style.html', reward_mat:'mirror_truth',  reward_pt:1 },
      { id:'mi5', text:'在夢境殿照見深層自我',           link:'castle-room-dream.html',   reward_mat:'honest_mirror',   reward_pt:1 },
      { id:'mi6', text:'做一個關係模式測驗',             link:'quiz-hub.html',            reward_mat:'mirror_truth',    reward_pt:1 },
      { id:'mi7', text:'讀懂自己的 MBTI 深度指南',       link:'quiz-mbti.html',           reward_mat:'honest_mirror',   reward_pt:1 },
      { id:'mi8', text:'用骨牌占卜問真實',               link:'bone-casting.html',        reward_mat:'mirror_truth',    reward_pt:1 },
      { id:'mi9', text:'完成原生家庭覺察測驗',           link:'quiz-hub.html',            reward_mat:'honest_mirror',   reward_pt:1 },
      { id:'mi10', text:'做 Big Five 五大人格',          link:'quiz-big5.html',           reward_mat:'mirror_truth',    reward_pt:1 },
      { id:'mi11', text:'進行一次自我對話（抽 1 張牌）', link:'draw-hl.html',             reward_mat:'honest_mirror',   reward_pt:1 },
      { id:'mi12', text:'查詢你的 VIA 優勢',             link:'quiz-via.html',            reward_mat:'mirror_truth',    reward_pt:1 },
      { id:'mi13', text:'在秘密室找到隱藏的真相',        link:'castle-room-secret.html',  reward_mat:'honest_mirror',   reward_pt:1 },
      { id:'mi14', text:'讓鏡之廳給你今日最真實的答案', link:'mirror-oracle.html',        reward_mat:'moonlight_shard', reward_pt:1 }
    ],
    'castle-room-ground': [
      { id:'gr1', text:'計算你的馥靈秘碼',               link:'fuling-mima.html',         reward_mat:'earth_core',      reward_pt:1 },
      { id:'gr2', text:'查詢三角生命密碼',               link:'triangle-calculator.html', reward_mat:'root_crystal',    reward_pt:1 },
      { id:'gr3', text:'完成生命靈數查詢',               link:'lifepath.html',            reward_mat:'earth_core',      reward_pt:1 },
      { id:'gr4', text:'了解品牌起源故事',               link:'brand-story.html',         reward_mat:'root_crystal',    reward_pt:1 },
      { id:'gr5', text:'認識創辦人逸君',                 link:'founder.html',             reward_mat:'earth_core',      reward_pt:1 },
      { id:'gr6', text:'確認你的會員狀態',               link:'member-dashboard.html',    reward_mat:'root_crystal',    reward_pt:1 },
      { id:'gr7', text:'查詢你的農曆生日秘密',           link:'fuling-mima.html',         reward_mat:'earth_core',      reward_pt:1 },
      { id:'gr8', text:'閱讀品牌願景',                   link:'brand-vision.html',        reward_mat:'root_crystal',    reward_pt:1 },
      { id:'gr9', text:'完成一個美業覺察測驗',           link:'quiz-hub.html',            reward_mat:'earth_core',      reward_pt:1 },
      { id:'gr10', text:'認識座標哲學基礎',              link:'coordinate-philosophy.html', reward_mat:'root_crystal',  reward_pt:1 },
      { id:'gr11', text:'探索 H.O.U.R. 覺察系統',       link:'services.html',            reward_mat:'earth_core',      reward_pt:1 },
      { id:'gr12', text:'查詢數字命理',                  link:'numerology.html',          reward_mat:'root_crystal',    reward_pt:1 },
      { id:'gr13', text:'閱讀一篇知識學苑文章',          link:'knowledge-hub.html',       reward_mat:'earth_core',      reward_pt:1 },
      { id:'gr14', text:'進行一次城堡全覽',              link:'app.html',                 reward_mat:'foundation_stone', reward_pt:1 }
    ],
    'castle-room-key': [
      { id:'k1',  text:'查看你的會員中心',               link:'member-dashboard.html',    reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k2',  text:'確認你的訂閱方案',               link:'pricing.html',             reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k3',  text:'查看完整服務價目',               link:'price-list.html',          reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k4',  text:'了解 VIP 深度服務',              link:'price-list-vip.html',      reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k5',  text:'查看城堡材料收藏',               link:'castle-materials.html',    reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k6',  text:'了解 B2B 合作方案',              link:'price-list-b2b.html',      reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k7',  text:'在鑰匙廳解鎖更多命理系統',       link:'destiny-engine.html',      reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k8',  text:'探索合盤配對功能',               link:'destiny-match.html',       reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k9',  text:'了解品牌 FAQ',                   link:'faq.html',                 reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k10', text:'查詢元辰宮功能',                 link:'yuan-chen-reading.html',   reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k11', text:'閱讀更新日誌',                   link:'changelog.html',           reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k12', text:'探索所有城堡房間',               link:'app.html',                 reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k13', text:'完成一個心理測驗',               link:'quiz-hub.html',            reward_mat:'castle_key_core', reward_pt:1 },
      { id:'k14', text:'抽一張今日指引牌',               link:'draw-hl.html',             reward_mat:'castle_key_core', reward_pt:1 }
    ],
    'castle-room-secret': [
      { id:'se1', text:'抽一張塔羅牌問秘密',             link:'tarot-draw.html',          reward_mat:'rune_stone',      reward_pt:1 },
      { id:'se2', text:'進行易經卦象占卜',               link:'yijing-oracle.html',       reward_mat:'hidden_rune',     reward_pt:1 },
      { id:'se3', text:'骨牌占卜今日命運',               link:'bone-casting.html',        reward_mat:'rune_stone',      reward_pt:1 },
      { id:'se4', text:'讓女巫原力告訴你秘密',           link:'witch-power.html',         reward_mat:'hidden_rune',     reward_pt:1 },
      { id:'se5', text:'電話占卜問今天的選擇',           link:'phone-oracle.html',        reward_mat:'rune_stone',      reward_pt:1 },
      { id:'se6', text:'姓名占卜解開命運密碼',           link:'name-oracle.html',         reward_mat:'hidden_rune',     reward_pt:1 },
      { id:'se7', text:'進行一次詩意積木占卜',           link:'poe-blocks.html',          reward_mat:'rune_stone',      reward_pt:1 },
      { id:'se8', text:'讓天使卡開啟秘密頻道',           link:'angel-oracle.html',        reward_mat:'hidden_rune',     reward_pt:1 },
      { id:'se9', text:'季節神諭告訴你今日方向',         link:'season-oracle.html',       reward_mat:'rune_stone',      reward_pt:1 },
      { id:'se10', text:'鏡像占卜照見隱藏的自己',        link:'mirror-oracle.html',       reward_mat:'hidden_rune',     reward_pt:1 },
      { id:'se11', text:'元辰宮問你的內在宮殿',          link:'yuan-chen-reading.html',   reward_mat:'rune_stone',      reward_pt:1 },
      { id:'se12', text:'用前世故事牌陣問秘密',          link:'draw-hl.html',             reward_mat:'hidden_rune',     reward_pt:1 },
      { id:'se13', text:'讓夢境殿繼續這個秘密',          link:'castle-room-dream.html',   reward_mat:'rune_stone',      reward_pt:1 },
      { id:'se14', text:'在直覺廳感受隱藏的訊息',        link:'castle-room-intuition.html', reward_mat:'void_crystal',  reward_pt:1 }
    ],
    'castle-room-throne': [
      { id:'th1', text:'完成完整命盤 33 系統分析',       link:'destiny-engine.html',      reward_mat:'king_seal',       reward_pt:1 },
      { id:'th2', text:'進行 7 張 H.O.U.R. 完整解讀',   link:'draw-hl.html',             reward_mat:'king_seal',       reward_pt:1 },
      { id:'th3', text:'完成你的 VIA 品格優勢',          link:'quiz-via.html',            reward_mat:'king_seal',       reward_pt:1 },
      { id:'th4', text:'探索 VIP 深度服務方案',          link:'price-list-vip.html',      reward_mat:'king_seal',       reward_pt:1 },
      { id:'th5', text:'閱讀創辦人故事',                 link:'founder.html',             reward_mat:'king_seal',       reward_pt:1 },
      { id:'th6', text:'確認你的城堡完成度',             link:'castle-materials.html',    reward_mat:'king_seal',       reward_pt:1 },
      { id:'th7', text:'完成 PDP 人格動力測驗',          link:'quiz-pdp.html',            reward_mat:'king_seal',       reward_pt:1 },
      { id:'th8', text:'進行一次合盤分析',               link:'destiny-match.html',       reward_mat:'king_seal',       reward_pt:1 },
      { id:'th9', text:'完成富命覺醒測驗',               link:'quiz-hub.html',            reward_mat:'king_seal',       reward_pt:1 },
      { id:'th10', text:'查看品牌願景與使命',            link:'brand-vision.html',        reward_mat:'king_seal',       reward_pt:1 },
      { id:'th11', text:'完成天命導航測驗',              link:'quiz-hub.html',            reward_mat:'king_seal',       reward_pt:1 },
      { id:'th12', text:'在城堡入口重新出發',            link:'app.html',                 reward_mat:'king_seal',       reward_pt:1 },
      { id:'th13', text:'確認半年陪伴方案',              link:'price-list-vip.html',      reward_mat:'king_seal',       reward_pt:1 },
      { id:'th14', text:'在王座廳完成一次 28 張校準牌陣',link:'draw-hl.html',             reward_mat:'destiny_core',    reward_pt:1 }
    ],
    'castle-room-harmony': [
      { id:'ha1', text:'完成一次家族牌陣抽牌',           link:'draw-family.html',         reward_mat:'harmony_petal',   reward_pt:1 },
      { id:'ha2', text:'做愛之語測驗',                   link:'quiz-love-language.html',  reward_mat:'bond_thread',     reward_pt:1 },
      { id:'ha3', text:'完成關係覺察測驗',               link:'quiz-hub.html',            reward_mat:'harmony_petal',   reward_pt:1 },
      { id:'ha4', text:'進行家族系統測驗',               link:'quiz-hub.html',            reward_mat:'bond_thread',     reward_pt:1 },
      { id:'ha5', text:'在愛情室繼續和諧之旅',           link:'castle-room-love.html',    reward_mat:'harmony_petal',   reward_pt:1 },
      { id:'ha6', text:'完成依附型態測驗',               link:'quiz-attachment-style.html', reward_mat:'bond_thread',   reward_pt:1 },
      { id:'ha7', text:'探索 SPA 抽牌療癒',              link:'draw-spa.html',            reward_mat:'harmony_petal',   reward_pt:1 },
      { id:'ha8', text:'進行一次三張牌關係解讀',         link:'draw-hl.html',             reward_mat:'bond_thread',     reward_pt:1 },
      { id:'ha9', text:'完成親子關係覺察測驗',           link:'quiz-hub.html',            reward_mat:'harmony_petal',   reward_pt:1 },
      { id:'ha10', text:'查看元辰宮人際關係面向',        link:'yuan-chen-reading.html',   reward_mat:'bond_thread',     reward_pt:1 },
      { id:'ha11', text:'做一個內在小孩測驗',            link:'quiz-hub.html',            reward_mat:'harmony_petal',   reward_pt:1 },
      { id:'ha12', text:'探索佔星合盤',                  link:'destiny-match.html',       reward_mat:'bond_thread',     reward_pt:1 },
      { id:'ha13', text:'做一個邊界設定測驗',            link:'quiz-hub.html',            reward_mat:'harmony_petal',   reward_pt:1 },
      { id:'ha14', text:'讓音樂帶來和諧能量',            link:'castle-room-music.html',   reward_mat:'resonance_gem',   reward_pt:1 }
    ],
    'castle-room-love': [
      { id:'lo1', text:'抽一張愛情指引牌',               link:'draw-hl.html',             reward_mat:'rose_petal_gold', reward_pt:1 },
      { id:'lo2', text:'完成愛之語測驗',                 link:'quiz-love-language.html',  reward_mat:'love_thread',     reward_pt:1 },
      { id:'lo3', text:'用西洋星座看感情宮位',           link:'astro.html',               reward_mat:'rose_petal_gold', reward_pt:1 },
      { id:'lo4', text:'做依附型態測驗',                 link:'quiz-attachment-style.html', reward_mat:'love_thread',   reward_pt:1 },
      { id:'lo5', text:'進行合盤感情解讀',               link:'destiny-match.html',       reward_mat:'rose_petal_gold', reward_pt:1 },
      { id:'lo6', text:'完成關係模式覺察測驗',           link:'quiz-hub.html',            reward_mat:'love_thread',     reward_pt:1 },
      { id:'lo7', text:'在和諧苑感受關係能量',           link:'castle-room-harmony.html', reward_mat:'rose_petal_gold', reward_pt:1 },
      { id:'lo8', text:'查看元辰宮感情宮位',             link:'yuan-chen-reading.html',   reward_mat:'love_thread',     reward_pt:1 },
      { id:'lo9', text:'讓天使卡給感情一個答案',         link:'angel-oracle.html',        reward_mat:'rose_petal_gold', reward_pt:1 },
      { id:'lo10', text:'做一個邊界設定覺察',            link:'quiz-hub.html',            reward_mat:'love_thread',     reward_pt:1 },
      { id:'lo11', text:'完成自我疼愛測驗',              link:'quiz-hub.html',            reward_mat:'rose_petal_gold', reward_pt:1 },
      { id:'lo12', text:'在鏡之廳看見感情中的自己',      link:'castle-room-mirror.html',  reward_mat:'love_thread',     reward_pt:1 },
      { id:'lo13', text:'感受 3 張感情牌陣的指引',       link:'draw-hl.html',             reward_mat:'rose_petal_gold', reward_pt:1 },
      { id:'lo14', text:'讓愛情室的永恆花朵盛開',        link:'castle-room-love.html',    reward_mat:'eternal_bloom',   reward_pt:1 }
    ],
    'castle-room-intuition': [
      { id:'in1', text:'進行一次易經卦象',               link:'yijing-oracle.html',       reward_mat:'instinct_spark',  reward_pt:1 },
      { id:'in2', text:'做塔羅牌直覺抽卡',               link:'tarot-draw.html',          reward_mat:'sixth_sense',     reward_pt:1 },
      { id:'in3', text:'用骨牌問直覺指引',               link:'bone-casting.html',        reward_mat:'instinct_spark',  reward_pt:1 },
      { id:'in4', text:'在夢境殿開啟直覺之門',           link:'castle-room-dream.html',   reward_mat:'sixth_sense',     reward_pt:1 },
      { id:'in5', text:'完成 MBTI 確認你的 N/S 傾向',    link:'quiz-mbti.html',           reward_mat:'instinct_spark',  reward_pt:1 },
      { id:'in6', text:'查詢人類圖感知類型',             link:'hd.html',                  reward_mat:'sixth_sense',     reward_pt:1 },
      { id:'in7', text:'進行女巫原力測驗',               link:'witch-power.html',         reward_mat:'instinct_spark',  reward_pt:1 },
      { id:'in8', text:'讓鏡像占卜測試你的直覺',         link:'mirror-oracle.html',       reward_mat:'sixth_sense',     reward_pt:1 },
      { id:'in9', text:'進行天使卡直覺抽卡',             link:'angel-oracle.html',        reward_mat:'instinct_spark',  reward_pt:1 },
      { id:'in10', text:'完成感官覺察相關測驗',          link:'quiz-hub.html',            reward_mat:'sixth_sense',     reward_pt:1 },
      { id:'in11', text:'在秘密室繼續直覺探索',          link:'castle-room-secret.html',  reward_mat:'instinct_spark',  reward_pt:1 },
      { id:'in12', text:'季節神諭問今日直覺方向',        link:'season-oracle.html',       reward_mat:'sixth_sense',     reward_pt:1 },
      { id:'in13', text:'做一次詩意積木直覺測試',        link:'poe-blocks.html',          reward_mat:'instinct_spark',  reward_pt:1 },
      { id:'in14', text:'讓直覺廳授予你神諭心核',        link:'castle-room-intuition.html', reward_mat:'oracle_heart',  reward_pt:1 }
    ],
    'castle-room-transform': [
      { id:'tr1', text:'完成蛻變覺察測驗',               link:'quiz-hub.html',            reward_mat:'chrysalis_dust',  reward_pt:1 },
      { id:'tr2', text:'進行一次 7 張 H.O.U.R. 解讀',   link:'draw-hl.html',             reward_mat:'rebirth_dew',     reward_pt:1 },
      { id:'tr3', text:'完成創傷覺察相關測驗',           link:'quiz-hub.html',            reward_mat:'chrysalis_dust',  reward_pt:1 },
      { id:'tr4', text:'做邊界設定測驗',                 link:'quiz-hub.html',            reward_mat:'rebirth_dew',     reward_pt:1 },
      { id:'tr5', text:'在煉金室合成新傢具',             link:'castle-materials.html',    reward_mat:'chrysalis_dust',  reward_pt:1 },
      { id:'tr6', text:'完成富命覺醒測驗',               link:'quiz-hub.html',            reward_mat:'rebirth_dew',     reward_pt:1 },
      { id:'tr7', text:'做一個天命導航測驗',             link:'quiz-hub.html',            reward_mat:'chrysalis_dust',  reward_pt:1 },
      { id:'tr8', text:'進行一次完整命盤查詢',           link:'destiny-engine.html',      reward_mat:'rebirth_dew',     reward_pt:1 },
      { id:'tr9', text:'完成陰影整合覺察測驗',           link:'quiz-hub.html',            reward_mat:'chrysalis_dust',  reward_pt:1 },
      { id:'tr10', text:'在鏡之廳看見蛻變前的自己',      link:'castle-room-mirror.html',  reward_mat:'rebirth_dew',     reward_pt:1 },
      { id:'tr11', text:'了解認知芳療如何助你蛻變',      link:'cognitive-aromatherapy-theory.html', reward_mat:'chrysalis_dust', reward_pt:1 },
      { id:'tr12', text:'完成家族系統覺察測驗',          link:'quiz-hub.html',            reward_mat:'rebirth_dew',     reward_pt:1 },
      { id:'tr13', text:'在直覺廳強化你的轉化直覺',      link:'castle-room-intuition.html', reward_mat:'chrysalis_dust', reward_pt:1 },
      { id:'tr14', text:'讓鳳凰灰燼見證你的蛻變',        link:'castle-room-transform.html', reward_mat:'phoenix_ash',   reward_pt:1 }
    ],
    'castle-room-music': [
      { id:'mu1', text:'在 432Hz 音樂中抽一張牌',        link:'draw-hl.html',             reward_mat:'chord_fragment',  reward_pt:1 },
      { id:'mu2', text:'完成 EQ 情緒智能測驗',           link:'quiz-eq.html',             reward_mat:'lyric_ink',       reward_pt:1 },
      { id:'mu3', text:'探索芳療共享園地精油知識',       link:'aroma-garden.html',        reward_mat:'chord_fragment',  reward_pt:1 },
      { id:'mu4', text:'做一個情緒覺察測驗',             link:'quiz-hub.html',            reward_mat:'lyric_ink',       reward_pt:1 },
      { id:'mu5', text:'在和諧苑感受音樂與關係',         link:'castle-room-harmony.html', reward_mat:'chord_fragment',  reward_pt:1 },
      { id:'mu6', text:'完成感官偏好覺察測驗',           link:'quiz-hub.html',            reward_mat:'lyric_ink',       reward_pt:1 },
      { id:'mu7', text:'讓季節神諭告訴你今日音符',       link:'season-oracle.html',       reward_mat:'chord_fragment',  reward_pt:1 },
      { id:'mu8', text:'天使卡問今日旋律',               link:'angel-oracle.html',        reward_mat:'lyric_ink',       reward_pt:1 },
      { id:'mu9', text:'在直覺廳傾聽內心的聲音',         link:'castle-room-intuition.html', reward_mat:'chord_fragment', reward_pt:1 },
      { id:'mu10', text:'完成 Big Five 開放性測驗',      link:'quiz-big5.html',           reward_mat:'lyric_ink',       reward_pt:1 },
      { id:'mu11', text:'探索調香指南的音符香調',        link:'blending-guide.html',      reward_mat:'chord_fragment',  reward_pt:1 },
      { id:'mu12', text:'在夢境殿讓音樂帶你入眠',        link:'castle-room-dream.html',   reward_mat:'lyric_ink',       reward_pt:1 },
      { id:'mu13', text:'完成色彩性格測驗',              link:'quiz-hub.html',            reward_mat:'chord_fragment',  reward_pt:1 },
      { id:'mu14', text:'靜待靈魂音調的共鳴',            link:'castle-room-music.html',   reward_mat:'soulful_tone',    reward_pt:1 }
    ],
    'castle-room-kitchen': [
      { id:'ki1', text:'在芳療花園找一個滋養配方',       link:'aroma-garden.html',        reward_mat:'herb_essence',    reward_pt:1 },
      { id:'ki2', text:'完成護膚科學閱讀',               link:'skincare-science.html',    reward_mat:'nourish_glow',    reward_pt:1 },
      { id:'ki3', text:'研究兒童芳療安全配方',           link:'kids-aromatherapy.html',   reward_mat:'herb_essence',    reward_pt:1 },
      { id:'ki4', text:'在調香指南找到今日香氣',         link:'blending-guide.html',      reward_mat:'nourish_glow',    reward_pt:1 },
      { id:'ki5', text:'探索按摩指南為身體補充能量',     link:'massage-guide.html',       reward_mat:'herb_essence',    reward_pt:1 },
      { id:'ki6', text:'在庭院採集今日香草靈感',         link:'castle-room-garden.html',  reward_mat:'nourish_glow',    reward_pt:1 },
      { id:'ki7', text:'用 SPA 牌陣問身體需要什麼',      link:'draw-spa.html',            reward_mat:'herb_essence',    reward_pt:1 },
      { id:'ki8', text:'完成身體覺察測驗',               link:'quiz-hub.html',            reward_mat:'nourish_glow',    reward_pt:1 },
      { id:'ki9', text:'探索精油芳療科學基礎',           link:'aromatherapy-science.html', reward_mat:'herb_essence',   reward_pt:1 },
      { id:'ki10', text:'在健康宮查看身體能量',          link:'ziwei.html',               reward_mat:'nourish_glow',    reward_pt:1 },
      { id:'ki11', text:'讓今日精油牌告訴你身體密碼',    link:'draw-hl.html',             reward_mat:'herb_essence',    reward_pt:1 },
      { id:'ki12', text:'閱讀芳療認證指南',              link:'certification-guide.html', reward_mat:'nourish_glow',    reward_pt:1 },
      { id:'ki13', text:'在直覺廳感受身體的直覺訊號',    link:'castle-room-intuition.html', reward_mat:'herb_essence',  reward_pt:1 },
      { id:'ki14', text:'廚房煉出靈藥：去煉金室合成',    link:'castle-materials.html',    reward_mat:'primal_spice',    reward_pt:1 }
    ],
    'castle-room-alchemy': [
      { id:'al1', text:'在城堡材料庫合成一件傢具',       link:'castle-materials.html',    reward_mat:'alchemy_bubble',  reward_pt:1 },
      { id:'al2', text:'完成命理工具後回來煉金',         link:'destiny-engine.html',      reward_mat:'transform_dust',  reward_pt:1 },
      { id:'al3', text:'做一個測驗後回來煉金',           link:'quiz-hub.html',            reward_mat:'alchemy_bubble',  reward_pt:1 },
      { id:'al4', text:'在蛻變室尋找煉金靈感',           link:'castle-room-transform.html', reward_mat:'transform_dust', reward_pt:1 },
      { id:'al5', text:'探索認知芳療的煉金之道',         link:'cognitive-aromatherapy-theory.html', reward_mat:'alchemy_bubble', reward_pt:1 },
      { id:'al6', text:'進行一次前世故事牌陣',           link:'draw-hl.html',             reward_mat:'transform_dust',  reward_pt:1 },
      { id:'al7', text:'在直覺廳找到煉金的第六感',       link:'castle-room-intuition.html', reward_mat:'alchemy_bubble', reward_pt:1 },
      { id:'al8', text:'完成轉化人格相關測驗',           link:'quiz-hub.html',            reward_mat:'transform_dust',  reward_pt:1 },
      { id:'al9', text:'研究芳療化學成分',               link:'aromatherapy-science.html', reward_mat:'catalyst_stone', reward_pt:1 },
      { id:'al10', text:'用卡巴拉命理查詢',              link:'destiny-engine.html',      reward_mat:'alchemy_bubble',  reward_pt:1 },
      { id:'al11', text:'在廚房備好原料再煉金',          link:'castle-room-kitchen.html', reward_mat:'transform_dust',  reward_pt:1 },
      { id:'al12', text:'完成能量場清理覺察測驗',        link:'quiz-hub.html',            reward_mat:'alchemy_bubble',  reward_pt:1 },
      { id:'al13', text:'查看今日材料採集情況',          link:'castle-materials.html',    reward_mat:'transform_dust',  reward_pt:1 },
      { id:'al14', text:'煉金大成：合成進階傢具',        link:'castle-materials.html',    reward_mat:'prime_matter',    reward_pt:1 }
    ],
    'castle-room-treasure': [
      { id:'te1', text:'查看你的完整命盤寶藏',           link:'destiny-engine.html',      reward_mat:'gold_dust',       reward_pt:1 },
      { id:'te2', text:'完成富命覺醒測驗',               link:'quiz-hub.html',            reward_mat:'jade_fragment',   reward_pt:1 },
      { id:'te3', text:'探索你的天賦優勢',               link:'quiz-via.html',            reward_mat:'gold_dust',       reward_pt:1 },
      { id:'te4', text:'查看服務價目了解投資自己',        link:'price-list.html',          reward_mat:'jade_fragment',   reward_pt:1 },
      { id:'te5', text:'在城堡合成一件豪華傢具',          link:'castle-materials.html',    reward_mat:'gold_dust',       reward_pt:1 },
      { id:'te6', text:'完成事業藍圖相關測驗',           link:'quiz-hub.html',            reward_mat:'jade_fragment',   reward_pt:1 },
      { id:'te7', text:'用 21 張矩陣牌陣探索寶藏',       link:'draw-hl.html',             reward_mat:'gold_dust',       reward_pt:1 },
      { id:'te8', text:'完成財富意識相關測驗',           link:'quiz-hub.html',            reward_mat:'jade_fragment',   reward_pt:1 },
      { id:'te9', text:'探索你的使命與天賦',             link:'quiz-hub.html',            reward_mat:'gold_dust',       reward_pt:1 },
      { id:'te10', text:'查看品牌合作挖寶機會',          link:'partners.html',            reward_mat:'jade_fragment',   reward_pt:1 },
      { id:'te11', text:'完成 RIASEC 職業興趣測驗',      link:'quiz-riasec.html',         reward_mat:'gold_dust',       reward_pt:1 },
      { id:'te12', text:'用命理找到你的財帛宮',          link:'ziwei.html',               reward_mat:'jade_fragment',   reward_pt:1 },
      { id:'te13', text:'在鑰匙廳開啟財富之門',          link:'castle-room-key.html',     reward_mat:'gold_dust',       reward_pt:1 },
      { id:'te14', text:'找到城堡最深的寶藏',            link:'castle-room-throne.html',  reward_mat:'golden_ore',      reward_pt:1 }
    ]
  };

  // ── 3. 房間靈魂語錄（每次隨機一句）──────────────────────
  var SPIRIT_QUOTES = {
    'castle-room-star':      ['星象不是命令，是地圖。','你的命盤不是天花板，是起點。','每顆星都在說話，問題是你有沒有在聽。','今天的位置，是明天的起跑線。','宇宙沒有偏愛，只有頻率。'],
    'castle-room-dream':     ['夢裡的你，是最誠實的版本。','潛意識從不說謊，只是說話的方式不一樣。','今晚你會記得什麼？','有時候最大的答案藏在你不記得的夢裡。','休息是另一種前進。'],
    'castle-room-library':   ['知識是鑰匙，但你才是那扇門。','讀懂一件事，就打開了一個世界。','智慧不是用來炫耀的，是用來看清楚的。','今天你想知道什麼？','每個問號都值得一個誠實的答案。'],
    'castle-room-garden':    ['花開是因為它知道時間到了。','有些東西種下去，要很久才看到。','今天澆一點水，不需要全力衝刺。','庭院裡最重要的事是：不要拔掉正在長的。','自然有它的節奏，你也是。'],
    'castle-room-mirror':    ['你看到的，一半是自己，一半是你希望的樣子。','真相不是殘忍的，迴避才是。','今天你願意看幾成真實？','鏡子只照當下，不審判過去。','照見了不等於要立刻改變，先看清楚就好。'],
    'castle-room-ground':    ['根越深，走越遠。','你的出發點，是你力量的第一個來源。','地基看不見，但它決定了一切。','今天回到基礎，不是退步，是充電。','你從哪裡來，決定你往哪裡走得最穩。'],
    'castle-room-key':       ['有些門只有你自己的鑰匙能開。','你已經擁有的，比你以為的多。','今天你要開哪扇門？','鑰匙不是用來收著的，是用來開門的。','每一把鑰匙的背後，都是你走過的路。'],
    'castle-room-secret':    ['有些事藏著，是因為時候還沒到。','秘密不是謊言，是等待被看見的真相。','今天你準備好知道什麼了嗎？','每個秘密都有它的用意。','有些問題只有你自己知道答案在哪裡。'],
    'castle-room-throne':    ['你不是坐在這裡等人授權，你本來就可以。','主權不是搶來的，是先給自己的。','今天你決定了什麼？','王座是一種責任，不是一種特權。','你準備好了嗎？其實你早就準備好了。'],
    'castle-room-harmony':   ['關係不是用來完成你的，是用來陪你成長的。','和諧不是沒有衝突，是衝突後還願意繼續。','今天你想和誰更靠近一點？','聽見對方，是關係最難也最重要的事。','有些和解，要先從自己開始。'],
    'castle-room-love':      ['愛不是找到完美的人，是看見真實的彼此。','今天你有沒有好好愛自己？','愛是動詞，不是名詞。','你值得的愛，比你目前要求的多。','愛一個人，先要知道自己需要什麼。'],
    'castle-room-intuition': ['那個說不出口的感覺，通常是對的。','直覺是你的身體在跟你說話。','今天有什麼你「就是知道」的事？','理性是地圖，直覺是羅盤。','停下來感覺一下，比繼續往前重要。'],
    'castle-room-transform': ['蛻變不是變成另一個人，是變成更真實的自己。','那些不舒服，是舊皮在脫落的聲音。','今天你願意放下什麼？','改變不是一夜之間的，是每天一點點的選擇。','鳳凰是從灰燼裡起來的，不是從原地飛的。'],
    'castle-room-music':     ['有些感受說不出口，但可以唱出來。','今天你的身體有什麼節奏？','音樂是情緒最誠實的語言。','讓聲音帶你去你還沒說出口的地方。','你的內心有一首歌，你有沒有聽過？'],
    'castle-room-kitchen':   ['滋養自己不是奢侈，是必需。','今天你吃進去的是什麼？身體的？心的？','照顧好自己，才有力氣照顧別人。','香氣是最直接通往記憶的路。','你值得被好好對待，從自己開始。'],
    'castle-room-alchemy':   ['每一次的轉化，都需要材料和時間。','煉金不是把普通變珍貴，是把隱藏的帶出來。','今天你在轉化什麼？','所有的蛻變都有一個沸騰的過程。','成分對了，加上耐心，就是魔法。'],
    'castle-room-treasure':  ['你的天賦，是你藏得最深的寶藏。','有些價值要先被你自己看見，才能被別人看見。','今天你挖到了什麼？','最好的投資，是投資在你自己身上。','寶藏不是找到的，是認出來的。']
  };

  // ── 4. 隱藏機關掉落材料（每房間一種）────────────────────
  var HIDDEN_MATS = {
    'castle-room-star':      { id:'star_shard',      name:'星辰碎片',   icon:'⭐' },
    'castle-room-dream':     { id:'dream_fragment',  name:'夢境碎片',   icon:'🌙' },
    'castle-room-library':   { id:'wisdom_scroll',   name:'智慧卷軸',   icon:'📜' },
    'castle-room-garden':    { id:'dawn_dew',         name:'晨露珠珠',   icon:'🌸' },
    'castle-room-mirror':    { id:'honest_mirror',    name:'誠實之鏡',   icon:'🪞' },
    'castle-room-ground':    { id:'earth_core',       name:'大地核心',   icon:'🌍' },
    'castle-room-key':       { id:'castle_key_core',  name:'城堡鑰匙芯', icon:'🗝️' },
    'castle-room-secret':    { id:'rune_stone',       name:'盧恩石',     icon:'🔮' },
    'castle-room-throne':    { id:'king_seal',        name:'王印',       icon:'👑' },
    'castle-room-harmony':   { id:'harmony_petal',    name:'和諧花瓣',   icon:'🪷' },
    'castle-room-love':      { id:'rose_petal_gold',  name:'金玫瑰花瓣', icon:'🌹' },
    'castle-room-intuition': { id:'instinct_spark',   name:'本能火花',   icon:'⚡' },
    'castle-room-transform': { id:'chrysalis_dust',   name:'蛹化之粉',   icon:'🦋' },
    'castle-room-music':     { id:'chord_fragment',   name:'和弦碎片',   icon:'🎵' },
    'castle-room-kitchen':   { id:'herb_essence',     name:'香草精華',   icon:'🌿' },
    'castle-room-alchemy':   { id:'alchemy_bubble',   name:'煉金泡泡',   icon:'⚗️' },
    'castle-room-treasure':  { id:'gold_dust',        name:'金粉',       icon:'✨' }
  };

  // 隱藏機關圖示輪替
  var SPOT_ICONS = ['✨','💫','🌟','⭐','🔮','💎','🌸','🍀','🦋','⚡','🪄','🌈'];

  // ── 5. localStorage helpers ────────────────────────────
  function getToday() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function loadDailyData() {
    try { return JSON.parse(localStorage.getItem('hl_castle_daily') || '{}'); } catch (e) { return {}; }
  }
  function saveDailyData(data) {
    try { localStorage.setItem('hl_castle_daily', JSON.stringify(data)); } catch (e) {}
  }
  function addMatFallback(matId) {
    try {
      var raw = localStorage.getItem('hl_materials_v1');
      var inv = raw ? JSON.parse(raw) : { inventory: {}, furniture: {} };
      if (!inv.inventory) inv.inventory = {};
      inv.inventory[matId] = (inv.inventory[matId] || 0) + 1;
      localStorage.setItem('hl_materials_v1', JSON.stringify(inv));
    } catch (e) {}
  }
  function addMat(matId) {
    // Try public API first, then fallback
    if (window.hlMaterial && typeof hlMaterial.drop === 'function') {
      addMatFallback(matId); // drop() is gated; write directly for quest rewards
    } else {
      addMatFallback(matId);
    }
    addMatFallback(matId); // Write directly always for quest rewards
  }

  // ── 6. 今日任務 ───────────────────────────────────────
  var questPool = QUEST_POOLS[path] || [];
  if (!questPool.length) return;

  var today = getToday();
  var dayNum = Math.floor(Date.now() / 86400000);
  var questIdx = dayNum % questPool.length;
  var todayQuest = questPool[questIdx];

  var dailyData = loadDailyData();
  if (!dailyData[today]) dailyData[today] = {};
  var roomData = dailyData[today][path] || { started: false, completed: false, claimed: false, hiddenFound: false };
  dailyData[today][path] = roomData;
  if (!roomData.started) { roomData.started = true; saveDailyData(dailyData); }

  // ── 7. CSS 注入 ───────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '.hl-daily-btn{position:fixed;bottom:80px;right:16px;width:52px;height:52px;border-radius:50%;',
    'background:linear-gradient(135deg,#c8862a,#e8b86d);border:none;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;font-size:1.4rem;',
    'box-shadow:0 4px 16px rgba(200,134,42,.45);z-index:800;transition:transform .2s;}',
    '.hl-daily-btn:hover{transform:scale(1.08);}',
    '.hl-daily-dot{position:absolute;top:3px;right:3px;width:12px;height:12px;',
    'background:#e8455a;border-radius:50%;border:2px solid #fff;}',
    '.hl-daily-panel{position:fixed;bottom:144px;right:16px;width:290px;',
    'background:#fff8f0;border:1.5px solid rgba(200,134,42,.25);border-radius:16px;',
    'padding:16px;box-shadow:0 8px 32px rgba(62,42,26,.15);z-index:799;',
    'display:none;font-family:"Noto Serif TC",serif;}',
    '.hl-daily-panel.open{display:block;}',
    '.hl-dp-title{font-size:.7rem;color:#c8862a;letter-spacing:.08em;margin-bottom:8px;font-weight:700;}',
    '.hl-dp-text{font-size:.86rem;color:#3e2a1a;line-height:1.6;margin-bottom:10px;}',
    '.hl-dp-reward{display:flex;align-items:center;gap:6px;font-size:.76rem;color:#9a7a60;margin-bottom:12px;}',
    '.hl-dp-go{display:block;width:100%;padding:8px;background:linear-gradient(135deg,#c8862a,#e8b86d);',
    'color:#fff;border:none;border-radius:10px;font-size:.83rem;cursor:pointer;',
    'text-align:center;text-decoration:none;transition:opacity .2s;}',
    '.hl-dp-go:hover{opacity:.88;}',
    '.hl-dp-go.done{background:#e8f5e9;color:#388e3c;pointer-events:none;}',
    '.hl-dp-claim{display:block;width:100%;padding:8px;',
    'background:linear-gradient(135deg,#2a8a7c,#4eb8a8);color:#fff;',
    'border:none;border-radius:10px;font-size:.83rem;cursor:pointer;',
    'text-align:center;margin-top:7px;transition:opacity .2s;}',
    '.hl-dp-claim:hover{opacity:.88;}',
    '.hl-dp-claimed{font-size:.74rem;color:#9a7a60;text-align:center;',
    'padding:6px;background:#f5f5f5;border-radius:8px;margin-top:7px;}',
    '@keyframes hl-spot-pulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.35);opacity:1}}',
    '.hl-hidden-spot{position:fixed;cursor:pointer;font-size:1.7rem;z-index:700;',
    'animation:hl-spot-pulse 2.6s ease-in-out infinite;',
    'filter:drop-shadow(0 0 7px rgba(200,134,42,.65));user-select:none;-webkit-user-select:none;}',
    '@keyframes hl-toast-in{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}',
    '@keyframes hl-toast-out{from{opacity:1}to{opacity:0}}',
    '.hl-spirit-toast{position:fixed;top:68px;left:50%;transform:translateX(-50%);',
    'max-width:270px;width:88%;background:rgba(50,32,16,.88);color:#f5dfa8;',
    'border-radius:12px;padding:11px 15px;font-size:.8rem;line-height:1.6;',
    'text-align:center;z-index:900;font-family:"Noto Serif TC",serif;',
    'animation:hl-toast-in .35s ease forwards;pointer-events:none;}',
    '.hl-spirit-toast.hiding{animation:hl-toast-out .35s ease forwards;}',
    '.hl-rwd-overlay{position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:999;',
    'opacity:0;transition:opacity .3s;}',
    '.hl-rwd-overlay.show{opacity:1;}',
    '.hl-rwd-popup{position:fixed;top:50%;left:50%;',
    'transform:translate(-50%,-50%) scale(.82);',
    'background:#fff8f0;border:2px solid rgba(200,134,42,.28);',
    'border-radius:20px;padding:26px 22px;text-align:center;z-index:1000;',
    'font-family:"Noto Serif TC",serif;',
    'box-shadow:0 20px 60px rgba(62,42,26,.18);',
    'opacity:0;transition:all .3s cubic-bezier(.34,1.56,.64,1);min-width:230px;}',
    '.hl-rwd-popup.show{opacity:1;transform:translate(-50%,-50%) scale(1);}',
    '.hl-rwd-icon{font-size:2.8rem;margin-bottom:8px;}',
    '.hl-rwd-name{font-size:1.05rem;color:#3e2a1a;font-weight:700;margin-bottom:4px;}',
    '.hl-rwd-sub{font-size:.78rem;color:#9a7a60;margin-bottom:14px;}',
    '.hl-rwd-close{padding:8px 20px;background:linear-gradient(135deg,#c8862a,#e8b86d);',
    'color:#fff;border:none;border-radius:20px;cursor:pointer;font-size:.83rem;}'
  ].join('');
  document.head.appendChild(style);

  // ── 8. 獎勵彈窗 ──────────────────────────────────────
  function showReward(icon, name, sub, cb) {
    var ov = document.createElement('div'); ov.className = 'hl-rwd-overlay';
    var pp = document.createElement('div'); pp.className = 'hl-rwd-popup';
    pp.innerHTML = '<div class="hl-rwd-icon">' + icon + '</div>' +
      '<div class="hl-rwd-name">' + name + '</div>' +
      '<div class="hl-rwd-sub">' + sub + '</div>' +
      '<button class="hl-rwd-close">太好了！</button>';
    document.body.appendChild(ov); document.body.appendChild(pp);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ov.classList.add('show'); pp.classList.add('show'); });
    });
    pp.querySelector('.hl-rwd-close').addEventListener('click', function () {
      ov.classList.remove('show'); pp.classList.remove('show');
      setTimeout(function () {
        ov.parentNode && ov.parentNode.removeChild(ov);
        pp.parentNode && pp.parentNode.removeChild(pp);
        if (cb) cb();
      }, 300);
    });
  }

  // ── 9. 靈魂語錄 Toast ────────────────────────────────
  var quotes = SPIRIT_QUOTES[path] || ['你今天來了，就是好的開始。'];
  var quote = quotes[Math.floor(Math.random() * quotes.length)];
  setTimeout(function () {
    var toast = document.createElement('div');
    toast.className = 'hl-spirit-toast';
    toast.textContent = room.icon + '  ' + quote;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('hiding');
      setTimeout(function () { toast.parentNode && toast.parentNode.removeChild(toast); }, 380);
    }, 4200);
  }, 1100);

  // ── 10. 隱藏機關 ─────────────────────────────────────
  if (!roomData.hiddenFound) {
    var topPct = 22 + Math.floor((dayNum * 37 + path.length * 7) % 50);
    var leftPct = 5  + Math.floor((dayNum * 53 + path.charCodeAt(12)) % 83);
    var spotIcon = SPOT_ICONS[(dayNum + path.length) % SPOT_ICONS.length];
    var hiddenMat = HIDDEN_MATS[path] || { id: 'star_shard', name: '星辰碎片', icon: '✨' };

    var spot = document.createElement('div');
    spot.className = 'hl-hidden-spot';
    spot.textContent = spotIcon;
    spot.style.top = topPct + 'vh';
    spot.style.left = leftPct + 'vw';
    spot.title = '有什麼在閃爍...';
    document.body.appendChild(spot);

    spot.addEventListener('click', function () {
      roomData.hiddenFound = true;
      saveDailyData(dailyData);
      spot.parentNode && spot.parentNode.removeChild(spot);
      addMatFallback(hiddenMat.id);
      showReward(hiddenMat.icon, '發現隱藏機關！', '獲得 ' + hiddenMat.name + ' ×1', null);
    });
  }

  // ── 11. 每日任務面板 ──────────────────────────────────
  function getMatInfo(matId) {
    if (window.hlMaterial && hlMaterial.MATERIAL_DEFS) {
      var found = null;
      Object.values(hlMaterial.MATERIAL_DEFS).forEach(function (pool) {
        pool.forEach(function (m) { if (m.id === matId) found = m; });
      });
      if (found) return found;
    }
    return { name: matId, icon: '✨' };
  }

  var questBtn = document.createElement('button');
  questBtn.className = 'hl-daily-btn';
  questBtn.setAttribute('aria-label', '每日任務');

  var panel = document.createElement('div');
  panel.className = 'hl-daily-panel';

  function renderPanel() {
    var mat = getMatInfo(todayQuest.reward_mat);
    var matIcon = mat.icon || '✨';
    var matName = mat.name || todayQuest.reward_mat;

    var actionHTML;
    if (roomData.claimed) {
      actionHTML = '<div class="hl-dp-claimed">今日任務已完成領取</div>';
    } else if (roomData.completed) {
      actionHTML = '<a href="' + todayQuest.link + '" class="hl-dp-go done">任務完成 — 繼續探索</a>' +
        '<button class="hl-dp-claim" id="hl-claim-btn">領取 ' + matIcon + matName + ' ×1 ＋' + todayQuest.reward_pt + '點</button>';
    } else {
      actionHTML = '<a href="' + todayQuest.link + '" class="hl-dp-go" id="hl-go-btn">前往完成任務</a>';
    }

    panel.innerHTML =
      '<div class="hl-dp-title">' + room.icon + ' 今日任務 · ' + room.name + '</div>' +
      '<div class="hl-dp-text">' + todayQuest.text + '</div>' +
      '<div class="hl-dp-reward"><span>' + matIcon + '</span>' +
      '<span>完成獎勵：' + matName + ' ×1 ＋' + todayQuest.reward_pt + ' 點</span></div>' +
      actionHTML;

    var claimBtn = panel.querySelector('#hl-claim-btn');
    if (claimBtn) {
      claimBtn.addEventListener('click', function () {
        roomData.claimed = true;
        saveDailyData(dailyData);
        addMatFallback(todayQuest.reward_mat);
        if (window.hlCastle && typeof hlCastle.addPoints === 'function') {
          hlCastle.addPoints(todayQuest.reward_pt);
        }
        questBtn.innerHTML = '📋';
        showReward(matIcon, '任務完成！', '獲得 ' + matName + ' ×1 ＋' + todayQuest.reward_pt + ' 點', renderPanel);
      });
    }

    var goBtn = panel.querySelector('#hl-go-btn');
    if (goBtn) {
      goBtn.addEventListener('click', function () {
        setTimeout(function () {
          roomData.completed = true;
          saveDailyData(dailyData);
        }, 400);
      });
    }

    // Update btn dot
    questBtn.innerHTML = '📋' + (!roomData.claimed ? '<span class="hl-daily-dot"></span>' : '');
  }

  renderPanel();

  questBtn.addEventListener('click', function () { panel.classList.toggle('open'); });

  document.body.appendChild(panel);
  document.body.appendChild(questBtn);

  // 返回頁面時自動標記完成（referrer 檢測）
  if (document.referrer && !roomData.completed && !roomData.claimed) {
    var refBase = document.referrer.split('?')[0].split('/').pop();
    var qBase = todayQuest.link.split('?')[0];
    if (refBase && qBase && (refBase === qBase || document.referrer.indexOf(qBase) !== -1)) {
      roomData.completed = true;
      saveDailyData(dailyData);
      renderPanel();
    }
  }

})();
