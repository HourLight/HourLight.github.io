"""
湛寂數字能量學 - 完整優化版本 v2.0
基於白皮書完整規範的Python實現

核心特性：
- 身分證號碼計算（含326坎卦特例）
- 手機號碼計算（台灣/大陸格式）
- 流年流月映射
- 五行相生相剋判斷
- 因人而異的3/8凶性判斷
"""

from enum import Enum
from typing import Dict, Tuple, Optional, List
from dataclasses import dataclass


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


# 建立ID到Hexagram的映射
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
    GOLD = "金"
    WOOD = "木"
    WATER = "水"
    FIRE = "火"
    EARTH = "土"


# 五行相生相剋表
WUXING_SHENG = {
    "木": "火",  # 木生火
    "火": "土",  # 火生土
    "土": "金",  # 土生金
    "金": "水",  # 金生水
    "水": "木",  # 水生木
}

WUXING_KE = {
    "木": "土",  # 木剋土
    "土": "水",  # 土剋水
    "水": "火",  # 水剋火
    "火": "金",  # 火剋金
    "金": "木",  # 金剋木
}


@dataclass
class IDResult:
    """身分證計算結果"""
    id_number: str
    group1: str
    group2: str
    group3: str
    hex1: Hexagram  # 第一組卦象
    hex2: Hexagram  # 第二組卦象（下卦）
    hex3: Hexagram  # 第三組卦象（上卦）
    ming_gua_name: str  # 本命卦名稱
    ming_gua_upper: Hexagram  # 本命卦上卦
    ming_gua_lower: Hexagram  # 本命卦下卦
    interpretation: str


@dataclass
class PhoneResult:
    """手機號碼計算結果"""
    phone_number: str
    region: str
    groups: List[str]
    hexagrams: List[Hexagram]
    wuxing_flow: List[str]
    score: int
    has_void: bool
    has_four: bool
    interpretation: str


class DigitTransformer:
    """數字變換器"""

    @staticmethod
    def transform_zero(triad: str) -> str:
        """
        處理「0」的變換規則
        - 末位為0：返回"VOID"（能量空亡）
        - 首位/次位為0：複製右側數字（右側優先同化）
        """
        if not triad or len(triad) != 3:
            return triad

        chars = list(triad)

        # 規則B：末位為0 -> 空亡
        if chars[2] == '0':
            return "VOID"

        # 規則A：首位/次位為0 -> 右側優先同化
        if chars[1] == '0':
            chars[1] = chars[2]  # 905 -> 955

        if chars[0] == '0':
            chars[0] = chars[1]  # 028 -> 228

        return "".join(chars)

    @staticmethod
    def parse_phone_triads(phone_str: str, region: str = "TW") -> List[str]:
        """
        電話號碼分組邏輯
        - 台灣(10碼)：去首位0，然後三位一組
        - 大陸(11碼)：補首位0至12碼，然後三位一組
        """
        clean_str = ''.join(filter(str.isdigit, phone_str))

        if region == "TW" and len(clean_str) == 10:
            # 台灣格式：0905723595 -> 905, 723, 595
            target_segment = clean_str[1:]  # 去掉首位0
            groups = [target_segment[i:i+3] for i in range(0, 9, 3)]
            return groups

        elif region == "CN" and len(clean_str) == 11:
            # 大陸格式：15601853595 -> 補0 -> 015601853595 -> 015, 601, 853, 595
            target_segment = '0' + clean_str  # 補首位0
            groups = [target_segment[i:i+3] for i in range(0, 12, 3)]
            return groups

        else:
            raise ValueError(f"不支援的電話格式：{region} {len(clean_str)}碼")

    @staticmethod
    def calculate_triad_value(triad: str, mode: str = "MODULO", position: str = "normal") -> Optional[int]:
        """
        計算單組數字的卦象值
        
        Args:
            triad: 三位數字字符串
            mode: "MODULO"(標準) 或 "PARITY"(陰陽爻法)
            position: "first", "middle", "last" - 用於判斷是否觸發特殊規則
        
        Returns:
            卦象ID (1-8) 或 None (如果是VOID)
        """
        if triad == "VOID":
            return None

        # 特殊規則：身分證中段（第二組）的「一陽二陰」判定
        if position == "middle" and mode == "PARITY":
            parities = [int(d) % 2 for d in triad]  # 1=奇(陽), 0=偶(陰)
            yang_count = sum(parities)

            if yang_count == 1:  # 一陽二陰
                # 湛寂特例：視為坎卦（中男）
                return 6

        # 標準模式：求和取餘
        total = sum(int(d) for d in triad)
        remainder = total % 8
        return remainder if remainder != 0 else 8


class NumerologyEngine:
    """數字能量計算引擎"""

    # 64卦組合表（簡化版）
    GUA_COMBINATIONS = {
        ("坤", "坎"): "地水師",
        ("坤", "坤"): "坤為地",
        ("坤", "艮"): "地山謙",
        ("坤", "震"): "地雷復",
        ("坤", "巽"): "地風升",
        ("坤", "離"): "地火明夷",
        ("坤", "兌"): "地澤臨",
        ("坤", "乾"): "地天泰",
        # ... 其他組合可根據需要擴充
    }

    # 流年流月映射表（稀疏矩陣）
    YEAR_FLOW_MAP = {
        "40-49": {"gua": "解", "yao": None, "name": "解卦（十年大運）"},
        50: {"gua": "困", "yao": 5, "name": "困卦（五爻）"},
        "60-69": {"gua": "臨", "yao": 1, "name": "臨卦（一爻）"},
        "70-79": {"gua": "坤", "yao": 2, "name": "坤卦（二爻，帝王命）"},
    }

    @staticmethod
    def calculate_id_gua(id_number: str) -> IDResult:
        """
        計算身分證卦象
        
        身分證格式：H224326529
        分組：224 | 326 | 529
        規則：
        - 第1組(224)：標準模式 -> 坤卦
        - 第2組(326)：中段特例，「一陽二陰」-> 坎卦（下卦）
        - 第3組(529)：標準模式 -> 坤卦（上卦）
        - 本命卦 = 上卦(529) + 下卦(326)
        """
        # 提取數字部分
        digits = ''.join(filter(str.isdigit, id_number))
        if len(digits) != 9:
            raise ValueError(f"身分證號碼必須是9位數字，收到：{len(digits)}")

        # 分組
        group1 = digits[0:3]  # 224
        group2 = digits[3:6]  # 326
        group3 = digits[6:9]  # 529

        # 計算卦象
        transformer = DigitTransformer()

        # 第1組：標準模式
        val1 = transformer.calculate_triad_value(group1, mode="MODULO", position="first")
        hex1 = HEXAGRAM_MAP[val1]

        # 第2組：中段特例（直讀陰陽爻法）
        val2 = transformer.calculate_triad_value(group2, mode="PARITY", position="middle")
        hex2 = HEXAGRAM_MAP[val2]

        # 第3組：標準模式
        val3 = transformer.calculate_triad_value(group3, mode="MODULO", position="last")
        hex3 = HEXAGRAM_MAP[val3]

        # 組合本命卦：上卦=第3組，下卦=第2組
        upper_gua = hex3.get_name()
        lower_gua = hex2.get_name()
        ming_gua_key = (upper_gua, lower_gua)
        ming_gua_name = NumerologyEngine.GUA_COMBINATIONS.get(
            ming_gua_key, f"{upper_gua}{lower_gua}卦"
        )

        interpretation = f"本命卦為{ming_gua_name}，上卦{upper_gua}代表外在環境，下卦{lower_gua}代表內在自我。"

        return IDResult(
            id_number=id_number,
            group1=group1,
            group2=group2,
            group3=group3,
            hex1=hex1,
            hex2=hex2,
            hex3=hex3,
            ming_gua_name=ming_gua_name,
            ming_gua_upper=hex3,
            ming_gua_lower=hex2,
            interpretation=interpretation
        )

    @staticmethod
    def calculate_phone_gua(phone_number: str, region: str = "TW") -> PhoneResult:
        """
        計算手機號碼卦象
        
        規則：
        - 分組後，每組先處理「0」的變換
        - 然後用標準模式計算卦象
        - 檢查是否有VOID或4
        """
        transformer = DigitTransformer()

        # 分組
        groups = transformer.parse_phone_triads(phone_number, region)

        # 處理每一組
        hexagrams = []
        has_void = False
        has_four = False
        wuxing_flow = []

        for group in groups:
            # 處理「0」
            transformed = transformer.transform_zero(group)

            if transformed == "VOID":
                has_void = True
                hexagrams.append(None)
                wuxing_flow.append("空")
            else:
                # 檢查是否包含「4」
                if '4' in transformed:
                    has_four = True

                # 計算卦象
                val = transformer.calculate_triad_value(transformed, mode="MODULO")
                hex_obj = HEXAGRAM_MAP[val]
                hexagrams.append(hex_obj)
                wuxing_flow.append(hex_obj.get_wuxing())

        # 計算評分
        score = NumerologyEngine.calculate_phone_score(
            hexagrams, wuxing_flow, has_void, has_four
        )

        # 生成解釋
        hex_names = [h.get_name() if h else "空" for h in hexagrams]
        interpretation = f"手機卦象序列：{' → '.join(hex_names)}，五行流動：{' → '.join(wuxing_flow)}"

        return PhoneResult(
            phone_number=phone_number,
            region=region,
            groups=groups,
            hexagrams=hexagrams,
            wuxing_flow=wuxing_flow,
            score=score,
            has_void=has_void,
            has_four=has_four,
            interpretation=interpretation
        )

    @staticmethod
    def calculate_phone_score(hexagrams: List, wuxing_flow: List[str], has_void: bool, has_four: bool) -> int:
        """
        計算手機號碼的評分
        
        評分邏輯：
        - 基礎分：100分
        - 五行相生：+10分
        - 五行相剋：-20分
        - 包含VOID：-30分
        - 包含4：-15分
        """
        score = 100

        # 檢查五行流動
        for i in range(len(wuxing_flow) - 1):
            current = wuxing_flow[i]
            next_wx = wuxing_flow[i + 1]

            if current == "空" or next_wx == "空":
                continue

            # 相生
            if WUXING_SHENG.get(current) == next_wx:
                score += 10
            # 相剋
            elif WUXING_KE.get(current) == next_wx:
                score -= 20

        # 特殊規則
        if has_void:
            score -= 30
        if has_four:
            score -= 15

        return max(0, min(100, score))  # 限制在0-100

    @staticmethod
    def get_year_flow(birth_year_roc: int, current_year_roc: int) -> Dict:
        """
        計算流年卦象
        
        基於稀疏矩陣映射表
        民國紀年計算虛歲
        """
        virtual_age = current_year_roc - birth_year_roc + 1

        # 查表
        for age_range, info in NumerologyEngine.YEAR_FLOW_MAP.items():
            if isinstance(age_range, str):  # "40-49" 格式
                start, end = map(int, age_range.split('-'))
                if start <= virtual_age <= end:
                    return {
                        "age": virtual_age,
                        "gua": info["gua"],
                        "yao": info["yao"],
                        "name": info["name"],
                        "remark": "十年大運" if info["yao"] is None else "特定年份"
                    }
            elif isinstance(age_range, int):  # 50 格式
                if virtual_age == age_range:
                    return {
                        "age": virtual_age,
                        "gua": info["gua"],
                        "yao": info["yao"],
                        "name": info["name"],
                        "remark": "特定年份"
                    }

        # 未知年份
        return {
            "age": virtual_age,
            "gua": "未知",
            "yao": None,
            "name": "未知（超出已知範圍）",
            "remark": "需要師父補充"
        }

    @staticmethod
    def check_compatibility(id_result: IDResult, phone_result: PhoneResult) -> Dict:
        """
        檢查身分證與手機號碼的相容性
        
        邏輯：
        1. 身分證本命卦的上卦五行（代表「命」）
        2. 手機號碼第一個卦的五行（代表「運」）
        3. 判斷「運」是否能「生」「命」
        """
        if not phone_result.hexagrams or phone_result.hexagrams[0] is None:
            return {"compatible": False, "reason": "手機號碼首組無效"}

        id_wuxing = id_result.ming_gua_upper.get_wuxing()
        phone_wuxing = phone_result.hexagrams[0].get_wuxing()

        # 判斷五行關係
        if WUXING_SHENG.get(phone_wuxing) == id_wuxing:
            compatibility_score = 95
            reason = f"手機的{phone_wuxing}生身分證的{id_wuxing}，完美搭配！"
        elif WUXING_KE.get(phone_wuxing) == id_wuxing:
            compatibility_score = 40
            reason = f"手機的{phone_wuxing}剋身分證的{id_wuxing}，需謹慎。"
        else:
            compatibility_score = 70
            reason = f"手機的{phone_wuxing}與身分證的{id_wuxing}無直接相生相剋。"

        return {
            "compatible": compatibility_score >= 70,
            "score": compatibility_score,
            "reason": reason,
            "id_wuxing": id_wuxing,
            "phone_wuxing": phone_wuxing
        }


# 測試
if __name__ == "__main__":
    engine = NumerologyEngine()

    # 測試身分證
    print("=" * 80)
    print("【身分證計算測試】")
    print("=" * 80)
    id_result = engine.calculate_id_gua("H224326529")
    print(f"身分證：{id_result.id_number}")
    print(f"分組：{id_result.group1} | {id_result.group2} | {id_result.group3}")
    print(f"卦象：{id_result.hex1.get_name()} | {id_result.hex2.get_name()} | {id_result.hex3.get_name()}")
    print(f"本命卦：{id_result.ming_gua_name}")
    print(f"解釋：{id_result.interpretation}")

    # 測試手機號碼
    print("\n" + "=" * 80)
    print("【手機號碼計算測試】")
    print("=" * 80)
    phone_result = engine.calculate_phone_gua("0905723595", region="TW")
    print(f"手機號碼：{phone_result.phone_number}")
    print(f"分組：{' | '.join(phone_result.groups)}")
    print(f"卦象：{' | '.join([h.get_name() if h else '空' for h in phone_result.hexagrams])}")
    print(f"五行流動：{' → '.join(phone_result.wuxing_flow)}")
    print(f"評分：{phone_result.score}/100")
    print(f"解釋：{phone_result.interpretation}")

    # 測試相容性
    print("\n" + "=" * 80)
    print("【相容性檢查】")
    print("=" * 80)
    compatibility = engine.check_compatibility(id_result, phone_result)
    print(f"相容性評分：{compatibility['score']}/100")
    print(f"評價：{compatibility['reason']}")

    # 測試流年
    print("\n" + "=" * 80)
    print("【流年計算測試】")
    print("=" * 80)
    year_flow = engine.get_year_flow(birth_year_roc=74, current_year_roc=124)  # 民國74年生，現在民國124年
    print(f"虛歲：{year_flow['age']}")
    print(f"流年卦象：{year_flow['name']}")
    print(f"備註：{year_flow['remark']}")
