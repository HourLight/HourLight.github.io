// 馥靈意識導航™ 數字資料庫 (numerologyData.js)
// 根據用戶提供的關鍵字、五行、精油和連線解讀進行編寫

export const numerologyData = {
    1: {
        element: '木 (陽)',
        elementClass: 'wood',
        coreIdentity: '開創者 (領導)',
        positive: '獨立、創造潛能、自信、果斷、強烈意志力、原創、熱忱',
        negative: '自我中心、自大/傲慢、愛說教、缺乏耐心、偏執、衝動、任性',
        oil: '佛手柑 (Bergamot)',
        advice: '學習謙遜，將精力導向創造性目標。透過冥想與內省，平衡自我與群體關係。'
    },
    2: {
        element: '火 (陰)',
        elementClass: 'fire',
        coreIdentity: '協調者 (合作)',
        positive: '合作、協調、敏感細膩、溫和、有耐心、善解人意、體貼、善於書寫',
        negative: '依賴性強、缺乏獨立性、情緒不穩定、優柔寡斷、軟弱、害怕失去',
        oil: '羅馬洋甘菊 (Roman Chamomile)',
        advice: '勇敢表達自我，設立健康界線。透過藝術創作或書寫，穩定情緒。'
    },
    3: {
        element: '火 (陽)',
        elementClass: 'fire',
        coreIdentity: '表達者 (創意)',
        positive: '樂觀、創造力、溝通表達強、熱忱、幽默感、偏財運、藝術天分',
        negative: '浮誇/愛賣弄、不切實際、逃避現實、情緒化、浪費/愛亂花錢、愛出風頭',
        oil: '甜橙 (Sweet Orange)',
        advice: '將創意落實，避免過度理想化。學習財務管理，將熱情導向有形產出。'
    },
    4: {
        element: '土 (陰)',
        elementClass: 'earth',
        coreIdentity: '執行者 (務實)',
        positive: '務實、穩定、可靠/忠誠、組織力強、邏輯分明、腳踏實地、重視承諾、謹慎',
        negative: '固執、缺乏安全感、不變通、過於謹慎、缺乏想像力、說話生硬、愛計較細節',
        oil: '岩蘭草 (Vetiver)',
        advice: '接納變化，給予自己內在安全感。透過規律運動，釋放身體壓力。'
    },
    5: {
        element: '土 (陽)',
        elementClass: 'earth',
        coreIdentity: '自由者 (變革)',
        positive: '自由、變動/變革、適應能力、博學多聞、敢於冒險、推銷能力、善於表達',
        negative: '變動無常、逃避 (壓力)、缺乏恆心、煩躁不安、情緒化、無紀律、霸道',
        oil: '薄荷 (Peppermint)',
        advice: '集中精力，透過紀律獲得真正的自由。學習專注，避免過度分散。'
    },
    6: {
        element: '金 (陰)',
        elementClass: 'metal',
        coreIdentity: '奉獻者 (責任)',
        positive: '責任感強、有愛心、樂於助人、忠誠、注重細節、追求完美、母性/父性特質',
        negative: '過度犧牲、挑剔、焦慮、情緒波動、濫用情感、自以為是、缺乏界線',
        oil: '玫瑰 (Rose)',
        advice: '學習愛自己，設立健康界線。將完美主義轉化為對細節的掌控。'
    },
    7: {
        element: '金 (陽)',
        elementClass: 'metal',
        coreIdentity: '探究者 (智慧)',
        positive: '理性、邏輯分析強、探究、洞察力強、求真理、精算、力量、勤奮好學',
        negative: '多疑/質疑、孤獨、缺乏感性、逃避現實、不信任感、得理不饒人',
        oil: '乳香 (Frankincense)',
        advice: '信任直覺，避免過度分析。透過獨處與冥想，尋求內在真理。'
    },
    8: {
        element: '水 (陰)',
        elementClass: 'water',
        coreIdentity: '權力者 (財富)',
        positive: '領導力、商業頭腦、創造財富、果斷、組織管理能力、專注、野心、強大執行力',
        negative: '愛操縱、權力慾望強、急於成功、投機取巧、勢利眼、虛榮、見錢眼開',
        oil: '雪松 (Cedarwood)',
        advice: '學習放權，將精力轉向正面工作。平衡物質與精神，避免過度追求外在成功。'
    },
    9: {
        element: '水 (陽)',
        elementClass: 'water',
        coreIdentity: '人道者 (整合)',
        positive: '大愛/人道主義、智慧/博學、整合能力、模倣能力強、圓融、富有同情心、多才多藝',
        negative: '過度理想化、不切實際、懶惰、幻想、情緒波動大、愛心泛濫、缺乏務實',
        oil: '薰衣草 (Lavender)',
        advice: '專注夢想，將大愛落實到具體行動。學習務實，避免空想。'
    }
};

// 九宮格連線解讀 (根據生命數字學的常見連線進行整合)
export const gridLines = [
    { numbers: [1, 2, 3], name: '藝術線 / 創意線', meaning: '代表美學、平衡、精緻，具備強大的表達與創造力。' },
    { numbers: [4, 5, 6], name: '組織線 / 完美線', meaning: '代表團隊合作、重情重義，具備卓越的組織與規劃能力。' },
    { numbers: [7, 8, 9], name: '貴人線 / 權力線', meaning: '容易結交有權勢的人，具有吸引權貴的親和力，具備智慧與力量。' },
    { numbers: [1, 4, 7], name: '務實線 / 安全線', meaning: '對物質和精神安全有強烈需求，腳踏實地，注重結果。' },
    { numbers: [2, 5, 8], name: '情感線 / 敏感線', meaning: '高度的敏感度與情緒感知力，擅長處理人際關係和情感問題。' },
    { numbers: [3, 6, 9], name: '夢想線 / 創意線', meaning: '具有獨特的創意和設計才能，靈感豐富，適合創新領域。' },
    { numbers: [1, 5, 9], name: '事業線 / 自由線', meaning: '有助於獨立事業或創賺錢之道，目標明確，執行力強。' },
    { numbers: [3, 5, 7], name: '成效線 / 影響線', meaning: '注重效率、成效和績效，工作能力強，具有影響他人的才華。' }
];

// 卓越數 (Master Numbers)
export const masterNumbers = {
    11: {
        name: '夢想家 (啟發)',
        meaning: '具備 1 和 2 的雙重能量，屬於精神層次較高的數字。代表高度的洞察力與靈性，使命是啟發他人。'
    },
    22: {
        name: '大師建築師 (實踐)',
        meaning: '具備 2 和 4 的雙重能量，擁有將夢想化為現實的強大執行力。代表將精神層次的願景落實到物質世界的卓越能力。'
    },
    33: {
        name: '宇宙導師 (奉獻)',
        meaning: '具備 3 和 6 的雙重能量，擁有極高的愛與奉獻精神。代表將創意與大愛結合，成為啟發眾人的導師。'
    }
};
