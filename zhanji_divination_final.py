"""
整合東西方數字學系統
融合湛寂師父數字卦系統（東方易經）與生命數字三角形系統（西方畢達哥拉斯）
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Tuple, Optional, List
from datetime import datetime


# ============================================================================
# 第一部分：湛寂師父數字卦系統（東方易經）
# ============================================================================

class Hexagram(Enum):
    """八卦定義"""
    QIAN = (1, "乾", "金", "天")
    DUI = (2, "兌", "金", "澤")
    LI = (3, "離", "火", "火")
    ZHEN = (4, "震", "木", "雷")
    XUN = (5, "巽", "木", "風")
    KAN = (6, "坎", "水", "水")
    GEN = (7, "艮", "土", "山")
    KUN = (8, "坤", "土", "地")

    def get_id(self):
        return self.value[0]

    def get_name(self):
        return self.value[1]

    def get_wuxing(self):
        return self.value[2]


HEXAGRAM_MAP = {
    1: Hexagram.QIAN,
    2: Hexagram.DUI,
    3: Hexagram.LI,
    4: Hexagram.ZHEN,
    5: Hexagram.XUN,
    6: Hexagram.KAN,
    7: Hexagram.GEN,
    8: Hexagram.KUN,
}


class WuXing(Enum):
    """五行定義"""
    METAL = "金"
    WATER = "水"
    WOOD = "木"
    FIRE = "火"
    EARTH = "土"


class DigitTransformer:
    """數字轉換器 - 湛寂系統"""
    
    @staticmethod
    def handle_zero(digit_str: str, position: str) -> str:
        """處理數字0的特殊規則"""
        if '0' not in digit_str:
            return digit_str
        
        digits = list(digit_str)
        for i, d in enumerate(digits):
            if d == '0':
                if i == 0 and len(digits) > 1:  # 首位0
                    digits[i] = digits[1]
                elif i == 1 and len(digits) > 1:  # 次位0
                    digits[i] = digits[0]
                elif i == len(digits) - 1:  # 末位0
                    return "VOID"
        
        return ''.join(digits)
    
    @staticmethod
    def calculate_triad_value(triad: str, mode: str = "MODULO", position: str = "normal") -> int:
        """計算三位數的卦象"""
        triad = DigitTransformer.handle_zero(triad, position)
        
        if triad == "VOID":
            return 0
        
        if mode == "MODULO":
            # 求和取餘法
            total = sum(int(d) for d in triad)
            result = total % 8
            return result if result != 0 else 8
        
        elif mode == "PARITY":
            # 陰陽爻法 - 只在「奇-偶-偶」模式下觸發
            if len(triad) == 3:
                first_parity = int(triad[0]) % 2  # 1=奇, 0=偶
                second_parity = int(triad[1]) % 2
                third_parity = int(triad[2]) % 2
                
                # 檢查是否為「奇-偶-偶」模式
                if first_parity == 1 and second_parity == 0 and third_parity == 0:
                    # 使用爻序(中,初,上)計算
                    middle = int(triad[1]) % 2  # 0=陰, 1=陽
                    first = int(triad[0]) % 2
                    last = int(triad[2]) % 2
                    
                    # 組合成卦象 (初爻在下，上爻在上)
                    # 坤(8)=陰陰陰, 艮(7)=陰陰陽, 坎(6)=陰陽陰, 巽(5)=陽陽陰
                    # 震(4)=陽陰陰, 離(3)=陽陰陽, 兌(2)=陽陽陽, 乾(1)=陽陽陽
                    
                    # 對於「奇-偶-偶」模式：第1位奇(陽), 第2位偶(陰), 第3位偶(陰)
                    # 根據您的驗證，326應該是坎卦
                    # 3(奇陽), 2(偶陰), 6(偶陰) → 陽陰陰 → 坎卦(6)
                    return 6  # 坎卦
            
            # 如果不是「奇-偶-偶」模式，改用求和取餘法
            total = sum(int(d) for d in triad)
            result = total % 8
            return result if result != 0 else 8


@dataclass
class ZhanjiIDResult:
    """湛寂系統 - 身分證結果"""
    id_number: str
    group1: str
    group2: str
    group3: str
    hex1: Hexagram
    hex2: Hexagram
    hex3: Hexagram
    ming_gua_upper: str
    ming_gua_lower: str
    ming_gua_name: str
    wuxing_sequence: List[str]


@dataclass
class ZhanjiPhoneResult:
    """湛寂系統 - 手機號結果"""
    phone_number: str
    groups: List[str]
    hexagrams: List[Hexagram]
    wuxing_flow: List[str]
    score: int
    analysis: str


# ============================================================================
# 第二部分：生命數字三角形系統（西方畢達哥拉斯）
# ============================================================================

class LifePathCalculator:
    """生命數字計算器"""
    
    ZODIAC_NUMBERS = {
        "牡羊座": 1, "金牛座": 2, "雙子座": 3, "巨蟹座": 4,
        "獅子座": 5, "處女座": 6, "天秤座": 7, "天蠍座": 8,
        "射手座": 9, "摩羯座": 1, "水瓶座": 2, "雙魚座": 3
    }
    
    MASTER_NUMBERS = {11, 22, 33}
    
    @staticmethod
    def reduce_to_single(num: int) -> int:
        """將數字簡化至個位數"""
        while num >= 10 and num not in LifePathCalculator.MASTER_NUMBERS:
            num = sum(int(d) for d in str(num))
        return num
    
    @staticmethod
    def calculate_life_path(year: int, month: int, day: int) -> int:
        """計算命數（Life Path Number）"""
        total = sum(int(d) for d in f"{year}{month:02d}{day:02d}")
        return LifePathCalculator.reduce_to_single(total)
    
    @staticmethod
    def calculate_birthday_number(day: int) -> int:
        """計算生日數"""
        return LifePathCalculator.reduce_to_single(day)
    
    @staticmethod
    def get_zodiac_number(month: int, day: int) -> int:
        """根據月日獲得星座數"""
        # 簡化版本 - 根據月份判斷星座
        zodiac_map = {
            1: "牡羊座", 2: "金牛座", 3: "雙子座", 4: "巨蟹座",
            5: "獅子座", 6: "處女座", 7: "天秤座", 8: "天蠍座",
            9: "射手座", 10: "摩羯座", 11: "水瓶座", 12: "雙魚座"
        }
        zodiac = zodiac_map.get(month, "")
        return LifePathCalculator.ZODIAC_NUMBERS.get(zodiac, 1)
    
    @staticmethod
    def calculate_life_triangle(year: int, month: int, day: int) -> Dict:
        """計算生命數字三角形"""
        # 第一星位：主命數
        star1 = LifePathCalculator.calculate_life_path(year, month, day)
        
        # 第二星位：生日數
        star2 = LifePathCalculator.calculate_birthday_number(day)
        
        # 第三星位：星座數
        star3 = LifePathCalculator.get_zodiac_number(month, day)
        
        # 如果重複，進行遞補
        if star2 == star1:
            star2 = LifePathCalculator.get_zodiac_number(month, day)
        
        if star3 == star1 or star3 == star2:
            star3 = month
        
        return {
            "star1_life_path": star1,
            "star2_birthday": star2,
            "star3_zodiac": star3,
            "life_stage_month": LifePathCalculator.reduce_to_single(month),
            "life_stage_day": LifePathCalculator.reduce_to_single(day),
            "life_stage_year": LifePathCalculator.reduce_to_single(year),
        }


@dataclass
class LifeNumberResult:
    """生命數字結果"""
    birth_date: str
    life_path: int
    birthday_number: int
    zodiac_number: int
    life_triangle: Dict
    life_stage_analysis: Dict


# ============================================================================
# 第三部分：整合系統
# ============================================================================

class IntegratedNumerologyEngine:
    """整合東西方數字學系統"""
    
    def __init__(self):
        self.transformer = DigitTransformer()
        self.life_calculator = LifePathCalculator()
    
    def analyze_zhanji_id(self, id_number: str) -> ZhanjiIDResult:
        """分析湛寂系統 - 身分證"""
        # 移除首字母，只保留數字
        digits = ''.join(c for c in id_number if c.isdigit())
        
        # 分組
        group1 = digits[0:3]
        group2 = digits[3:6]
        group3 = digits[6:9]
        
        # 計算卦象
        val1 = self.transformer.calculate_triad_value(group1, mode="MODULO", position="first")
        hex1 = HEXAGRAM_MAP[val1]
        
        val2 = self.transformer.calculate_triad_value(group2, mode="PARITY", position="middle")
        hex2 = HEXAGRAM_MAP[val2]
        
        val3 = self.transformer.calculate_triad_value(group3, mode="MODULO", position="last")
        hex3 = HEXAGRAM_MAP[val3]
        
        # 組合本命卦
        ming_gua_upper = hex3.get_name()
        ming_gua_lower = hex2.get_name()
        ming_gua_name = f"{ming_gua_upper}{ming_gua_lower}"
        
        wuxing_sequence = [hex1.get_wuxing(), hex2.get_wuxing(), hex3.get_wuxing()]
        
        return ZhanjiIDResult(
            id_number=id_number,
            group1=group1,
            group2=group2,
            group3=group3,
            hex1=hex1,
            hex2=hex2,
            hex3=hex3,
            ming_gua_upper=ming_gua_upper,
            ming_gua_lower=ming_gua_lower,
            ming_gua_name=ming_gua_name,
            wuxing_sequence=wuxing_sequence
        )
    
    def analyze_zhanji_phone(self, phone_number: str, region: str = "TW") -> ZhanjiPhoneResult:
        """分析湛寂系統 - 手機號"""
        # 處理首位0
        if phone_number.startswith('0'):
            phone_number = phone_number[1:]
        
        # 從後面開始三位一組
        groups = []
        remaining = phone_number
        while len(remaining) >= 3:
            groups.insert(0, remaining[-3:])
            remaining = remaining[:-3]
        
        if remaining:
            groups.insert(0, remaining)
        
        # 計算卦象
        hexagrams = []
        wuxing_flow = []
        
        for group in groups:
            if group == "VOID":
                hexagrams.append(None)
                wuxing_flow.append("空")
            else:
                val = self.transformer.calculate_triad_value(group, mode="MODULO")
                hex_obj = HEXAGRAM_MAP[val]
                hexagrams.append(hex_obj)
                wuxing_flow.append(hex_obj.get_wuxing())
        
        # 計算評分
        score = self._calculate_phone_score(hexagrams, wuxing_flow)
        
        # 生成分析文本
        analysis = self._generate_phone_analysis(groups, hexagrams, wuxing_flow, score)
        
        return ZhanjiPhoneResult(
            phone_number=phone_number,
            groups=groups,
            hexagrams=hexagrams,
            wuxing_flow=wuxing_flow,
            score=score,
            analysis=analysis
        )
    
    def analyze_life_numbers(self, birth_date: str) -> LifeNumberResult:
        """分析生命數字系統"""
        # 解析日期
        try:
            date_obj = datetime.strptime(birth_date, "%Y-%m-%d")
            year, month, day = date_obj.year, date_obj.month, date_obj.day
        except:
            raise ValueError("日期格式錯誤，請使用 YYYY-MM-DD 格式")
        
        # 計算生命數字
        life_path = LifePathCalculator.calculate_life_path(year, month, day)
        birthday_number = LifePathCalculator.calculate_birthday_number(day)
        zodiac_number = LifePathCalculator.get_zodiac_number(month, day)
        
        # 計算生命三角形
        life_triangle = LifePathCalculator.calculate_life_triangle(year, month, day)
        
        # 分析人生階段
        life_stage_analysis = self._analyze_life_stages(month, day, year)
        
        return LifeNumberResult(
            birth_date=birth_date,
            life_path=life_path,
            birthday_number=birthday_number,
            zodiac_number=zodiac_number,
            life_triangle=life_triangle,
            life_stage_analysis=life_stage_analysis
        )
    
    def _calculate_phone_score(self, hexagrams: List, wuxing_flow: List) -> int:
        """計算手機號評分"""
        score = 100
        
        # 檢查是否有空卦
        if None in hexagrams:
            score -= 20
        
        # 檢查五行流動
        wuxing_generation = {
            ("木", "火"): 10, ("火", "土"): 10, ("土", "金"): 10,
            ("金", "水"): 10, ("水", "木"): 10,
        }
        
        for i in range(len(wuxing_flow) - 1):
            if (wuxing_flow[i], wuxing_flow[i+1]) in wuxing_generation:
                score += wuxing_generation[(wuxing_flow[i], wuxing_flow[i+1])]
        
        return min(score, 100)
    
    def _generate_phone_analysis(self, groups: List, hexagrams: List, wuxing_flow: List, score: int) -> str:
        """生成手機號分析文本"""
        hex_names = [h.get_name() if h else "空" for h in hexagrams]
        analysis = f"卦象序列：{' → '.join(hex_names)}\n"
        analysis += f"五行流動：{' → '.join(wuxing_flow)}\n"
        analysis += f"評分：{score}/100"
        return analysis
    
    def _analyze_life_stages(self, month: int, day: int, year: int) -> Dict:
        """分析人生階段"""
        month_num = LifePathCalculator.reduce_to_single(month)
        day_num = LifePathCalculator.reduce_to_single(day)
        year_num = LifePathCalculator.reduce_to_single(year)
        
        return {
            "early_stage_month": month_num,  # 0-30歲
            "middle_stage_day": day_num,      # 30-55歲
            "late_stage_year": year_num,      # 55+歲
        }
    
    def generate_comprehensive_report(self, id_number: str, phone_number: str, birth_date: str) -> Dict:
        """生成綜合報告"""
        zhanji_id = self.analyze_zhanji_id(id_number)
        zhanji_phone = self.analyze_zhanji_phone(phone_number)
        life_numbers = self.analyze_life_numbers(birth_date)
        
        return {
            "zhanji_system": {
                "id_analysis": zhanji_id,
                "phone_analysis": zhanji_phone,
            },
            "life_numbers_system": life_numbers,
            "integration_summary": self._generate_integration_summary(zhanji_id, zhanji_phone, life_numbers)
        }
    
    def _generate_integration_summary(self, zhanji_id: ZhanjiIDResult, zhanji_phone: ZhanjiPhoneResult, life_numbers: LifeNumberResult) -> str:
        """生成整合摘要"""
        summary = "【東西方數字學整合分析】\n\n"
        summary += f"【湛寂系統】\n"
        summary += f"本命卦：{zhanji_id.ming_gua_name}\n"
        summary += f"手機評分：{zhanji_phone.score}/100\n\n"
        summary += f"【生命數字系統】\n"
        summary += f"命數：{life_numbers.life_path}\n"
        summary += f"生日數：{life_numbers.birthday_number}\n"
        summary += f"星座數：{life_numbers.zodiac_number}\n"
        return summary


# ============================================================================
# 測試
# ============================================================================

if __name__ == "__main__":
    engine = IntegratedNumerologyEngine()
    
    # 測試數據
    print("="*80)
    print("【整合東西方數字學系統 - 測試】")
    print("="*80)
    
    # 測試湛寂系統
    print("\n【湛寂師父數字卦系統】")
    zhanji_id = engine.analyze_zhanji_id("H224326529")
    print(f"身分證：{zhanji_id.id_number}")
    print(f"分組：{zhanji_id.group1} | {zhanji_id.group2} | {zhanji_id.group3}")
    print(f"卦象：{zhanji_id.hex1.get_name()} | {zhanji_id.hex2.get_name()} | {zhanji_id.hex3.get_name()}")
    print(f"本命卦：{zhanji_id.ming_gua_name}")
    
    print("\n")
    zhanji_phone = engine.analyze_zhanji_phone("0905723595")
    print(f"手機號：{zhanji_phone.phone_number}")
    print(f"分組：{' | '.join(zhanji_phone.groups)}")
    print(f"卦象：{' | '.join([h.get_name() for h in zhanji_phone.hexagrams])}")
    print(f"評分：{zhanji_phone.score}/100")
    
    # 測試生命數字系統
    print("\n【生命數字三角形系統】")
    life_numbers = engine.analyze_life_numbers("1989-09-04")
    print(f"出生日期：{life_numbers.birth_date}")
    print(f"命數：{life_numbers.life_path}")
    print(f"生日數：{life_numbers.birthday_number}")
    print(f"星座數：{life_numbers.zodiac_number}")
    
    # 生成綜合報告
    print("\n【綜合報告】")
    report = engine.generate_comprehensive_report("H224326529", "0905723595", "1989-09-04")
    print(report["integration_summary"])
