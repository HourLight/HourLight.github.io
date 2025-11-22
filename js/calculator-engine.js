// 馥靈意識導航™ 計算機引擎
// 完整的三角星位、九宮格、五行分析系統

class NumerologyCalculator {
  constructor() {
    this.numerologyData = null;
    this.cardsMapping = null;
    this.loadData();
  }

  // 加載JSON資料庫
  async loadData() {
    try {
      const [numerologyRes, cardsRes] = await Promise.all([
        fetch('numerology_database.json'),
        fetch('hour_light_cards_mapping.json')
      ]);
      
      this.numerologyData = await numerologyRes.json();
      this.cardsMapping = await cardsRes.json();
    } catch (error) {
      console.error('數據加載失敗:', error);
    }
  }

  // 將數字縮減為單數
  reduceToSingle(num) {
    while (num > 9) {
      num = Math.floor(num / 10) + (num % 10);
    }
    return Math.max(1, num); // 確保最小值為1
  }

  // 計算三角星位
  calculateTriangle(year, month, day) {
    // 基礎拆解
    const dayNum = this.reduceToSingle(day);
    const monthNum = this.reduceToSingle(month);
    const yearDigits = year.toString().split('').map(Number);
    const yearFirst = this.reduceToSingle(yearDigits[0] + yearDigits[1]);
    const yearLast = this.reduceToSingle(yearDigits[2] + yearDigits[3]);

    // 內部三角（內在真實的自我）
    const innerLeft = this.reduceToSingle(dayNum + monthNum);
    const innerRight = this.reduceToSingle(yearFirst + yearLast);
    const innerCore = this.reduceToSingle(innerLeft + innerRight);

    // 外部三角（不同人生階段的外在人格）
    const outerTop = this.reduceToSingle(dayNum + monthNum + yearFirst + yearLast);
    const outerLeft = this.reduceToSingle(monthNum + innerLeft);
    const outerRight = this.reduceToSingle(yearFirst + innerRight);

    return {
      // 內部三角
      innerCore,
      innerLeft,
      innerRight,
      // 外部三角
      outerTop,
      outerLeft,
      outerRight,
      // 基礎數字
      dayNum,
      monthNum,
      yearFirst,
      yearLast
    };
  }

  // 繪製九宮格命盤
  drawGrid9(triangle) {
    const numbers = [
      triangle.dayNum,
      triangle.monthNum,
      triangle.yearFirst,
      triangle.yearLast,
      triangle.innerLeft,
      triangle.innerRight,
      triangle.innerCore
    ];

    const counts = {};
    numbers.forEach(n => {
      counts[n] = (counts[n] || 0) + 1;
    });

    return {
      counts,
      missingNumbers: Array.from({length: 9}, (_, i) => i + 1).filter(i => !counts[i]),
      presentNumbers: Object.keys(counts).map(Number)
    };
  }

  // 分析五行平衡
  analyzeFiveElements(triangle) {
    const elementMap = {
      1: "小木", 2: "小水", 3: "小火", 4: "小金", 5: "中央土",
      6: "大金", 7: "大水", 8: "大火", 9: "大木"
    };

    const numbers = [
      triangle.dayNum,
      triangle.monthNum,
      triangle.yearFirst,
      triangle.yearLast,
      triangle.innerLeft,
      triangle.innerRight,
      triangle.innerCore
    ];

    const elementCounts = {};
    numbers.forEach(n => {
      const elem = elementMap[n];
      elementCounts[elem] = (elementCounts[elem] || 0) + 1;
    });

    // 五行對應關係
    const fiveElementsOrder = ["小木", "小水", "小火", "小金", "中央土", "大金", "大水", "大火", "大木"];
    
    const analysis = {};
    fiveElementsOrder.forEach(elem => {
      const count = elementCounts[elem] || 0;
      analysis[elem] = {
        count,
        status: count === 0 ? "缺乏" : count === 1 ? "平衡" : "過旺"
      };
    });

    return {
      elementCounts,
      analysis,
      overElements: Object.entries(elementCounts).filter(([_, c]) => c > 1).map(([e]) => e),
      lackingElements: fiveElementsOrder.filter(e => !elementCounts[e])
    };
  }

  // 分析能量連線
  analyzeEnergyLines(triangle) {
    const numbers = [
      triangle.dayNum,
      triangle.monthNum,
      triangle.yearFirst,
      triangle.yearLast,
      triangle.innerLeft,
      triangle.innerRight,
      triangle.innerCore
    ];

    const energyLines = {
      "1-2-3": { name: "藝術線/獨立線", meaning: "有主見、創作天分、領導能力強" },
      "4-5-6": { name: "秩序線/治療線", meaning: "穩定務實、解決問題、條理清晰" },
      "7-8-9": { name: "權力線/貴人線", meaning: "智慧人道、權威影響力" },
      "1-4-7": { name: "安全線/錢財線", meaning: "追求穩定、金錢安全感、財富累積" },
      "2-5-8": { name: "感情線/表達線", meaning: "溝通表達、情緒敏感、坦誠相待" },
      "3-6-9": { name: "創意線/想象線", meaning: "想象力豐富、理想化、夢想家" },
      "1-5-9": { name: "事業線/自由線", meaning: "企圖心強、獨立創業、工作狂" },
      "3-5-7": { name: "人緣線/表達線", meaning: "看穿人心、銷售天才、社交高手" }
    };

    const foundLines = [];
    for (const [lineNumbers, lineInfo] of Object.entries(energyLines)) {
      const nums = lineNumbers.split('-').map(Number);
      if (nums.every(n => numbers.includes(n))) {
        foundLines.push({
          numbers: lineNumbers,
          ...lineInfo
        });
      }
    }

    return foundLines;
  }

  // 獲取數字的詳細信息
  getNumberInfo(num) {
    if (!this.numerologyData) return null;
    return this.numerologyData.numbers[num.toString()];
  }

  // 獲取推薦的馥靈之鑰卡牌
  getRecommendedCards(num) {
    if (!this.cardsMapping) return [];
    const mapping = this.cardsMapping.number_to_cards[num.toString()];
    return mapping ? mapping.cards : [];
  }

  // 完整的計算結果
  fullCalculation(year, month, day) {
    const triangle = this.calculateTriangle(year, month, day);
    const grid9 = this.drawGrid9(triangle);
    const fiveElements = this.analyzeFiveElements(triangle);
    const energyLines = this.analyzeEnergyLines(triangle);

    return {
      triangle,
      grid9,
      fiveElements,
      energyLines,
      innerCoreInfo: this.getNumberInfo(triangle.innerCore),
      outerPersonalityInfo: this.getNumberInfo(triangle.outerTop),
      recommendedCards: {
        innerCore: this.getRecommendedCards(triangle.innerCore),
        outerPersonality: this.getRecommendedCards(triangle.outerTop)
      }
    };
  }
}

// 導出計算器實例
const calculator = new NumerologyCalculator();
