"""
湛寂師父數字卦系統 - 完整運算模組
Version: 1.0
Author: 基於反向工程破解
Description: 實現湛寂師父的數字卦占卜系統的完整運算法
"""

class ZhanjiDivination:
    """湛寂師父數字卦系統的核心運算類"""
    
    # 八卦對應表
    GUA_MAP = {
        1: {"name": "乾", "element": "金", "meaning": "天、創造、領導"},
        2: {"name": "兌", "element": "金", "meaning": "喜悅、交談、少女"},
        3: {"name": "離", "element": "火", "meaning": "光明、名聲、文明"},
        4: {"name": "震", "element": "木", "meaning": "動力、變化、行動"},
        5: {"name": "巽", "element": "木", "meaning": "風、順從、進入"},
        6: {"name": "坎", "element": "水", "meaning": "水、聰慧、流動"},
        7: {"name": "艮", "element": "土", "meaning": "山、停止、穩定"},
        8: {"name": "坤", "element": "土", "meaning": "地、包容、母親"},
    }
    
    # 五行相生相剋表
    FIVE_ELEMENTS_GENERATION = {
        "金": "水",
        "水": "木",
        "木": "火",
        "火": "土",
        "土": "金",
    }
    
    FIVE_ELEMENTS_RESTRAINT = {
        "金": "木",
        "木": "土",
        "土": "水",
        "水": "火",
        "火": "金",
    }
    
    def __init__(self):
        """初始化運算模組"""
        pass
    
    def _process_zero(self, digits_str):
        """
        處理零的規則
        - 首位為0 → 複製次位
        - 次位為0 → 複製首位
        - 末位為0 → 成空（返回None）
        """
        if len(digits_str) < 3:
            return digits_str
        
        # 末位為0 → 成空
        if digits_str[2] == '0':
            return None
        
        # 首位為0 → 複製次位
        if digits_str[0] == '0':
            return digits_str[1] + digits_str[1] + digits_str[2]
        
        # 次位為0 → 複製首位
        if digits_str[1] == '0':
            return digits_str[0] + digits_str[0] + digits_str[2]
        
        return digits_str
    
    def _sum_mod_8(self, digits_str):
        """
        求和取餘法
        - 三位數相加
        - 除以8取餘
        - 餘數0視為8
        """
        if digits_str is None:
            return None
        
        total = sum(int(d) for d in digits_str)
        remainder = total % 8
        return remainder if remainder != 0 else 8
    
    def _yin_yang_gua(self, digits_str):
        """
        陰陽爻法（爻序為中,初,上）
        - 奇數=陽爻
        - 偶數=陰爻
        - 爻序：(中爻, 初爻, 上爻)
        """
        if digits_str is None or len(digits_str) < 3:
            return None
        
        # 轉換為陰陽
        yao = []
        for d in digits_str:
            if int(d) % 2 == 1:  # 奇數
                yao.append("陽")
            else:  # 偶數
                yao.append("陰")
        
        # 爻序為(中,初,上)
        pattern = yao[1] + yao[0] + yao[2]
        
        # 對應卦象
        gua_patterns = {
            "陽陽陽": 1,  # 乾
            "陽陽陰": 4,  # 震
            "陽陰陽": 3,  # 離
            "陽陰陰": 5,  # 巽
            "陰陽陽": 2,  # 兌
            "陰陽陰": 6,  # 坎
            "陰陰陽": 7,  # 艮
            "陰陰陰": 8,  # 坤
        }
        
        return gua_patterns.get(pattern, None)
    
    def _should_use_yin_yang(self, digits_str):
        """
        判斷是否應該使用陰陽爻法
        規則：當第1位是奇數，第2位和第3位都是偶數時，使用陰陽爻法
        模式：「奇-偶-偶」
        """
        if digits_str is None or len(digits_str) < 3:
            return False
        
        d1 = int(digits_str[0])
        d2 = int(digits_str[1])
        d3 = int(digits_str[2])
        
        # 檢查模式：「奇-偶-偶」
        return (d1 % 2 == 1) and (d2 % 2 == 0) and (d3 % 2 == 0)
    
    def _calculate_gua(self, digits_str):
        """
        計算單個三位數的卦象
        
        步驟：
        1. 處理零
        2. 判斷是否使用陰陽爻法
        3. 使用相應的計算方法
        4. 返回卦象編號
        """
        # 步驟1：處理零
        processed = self._process_zero(digits_str)
        if processed is None:
            return None
        
        # 步驟2：判斷計算方法
        if self._should_use_yin_yang(processed):
            # 使用陰陽爻法
            gua_num = self._yin_yang_gua(processed)
        else:
            # 使用求和取餘法
            gua_num = self._sum_mod_8(processed)
        
        return gua_num
    
    def _calculate_single_digit_gua(self, digit_str):
        """
        計算單個數字的卦象
        - 直接對應卦象編號
        """
        if len(digit_str) == 1:
            return int(digit_str)
        return None
    
    def _split_number(self, number_str, is_phone=False):
        """
        分組數字
        
        規則：
        - 從後面開始三位一組
        - 如果是手機號且首位為0，去掉首位0
        """
        # 去掉非數字字符
        digits = ''.join(c for c in number_str if c.isdigit())
        
        # 如果是手機號且首位為0，去掉首位0
        if is_phone and digits and digits[0] == '0':
            digits = digits[1:]
        
        # 從後面開始三位一組
        groups = []
        for i in range(len(digits), 0, -3):
            start = max(0, i - 3)
            groups.insert(0, digits[start:i])
        
        return groups
    
    def calculate_id_gua(self, id_number):
        """
        計算身分證的卦象序列
        
        返回：
        {
            "original": "H224326529",
            "groups": ["224", "326", "529"],
            "gua_sequence": [8, 6, 8],
            "gua_names": ["坤", "坎", "坤"],
            "elements": ["土", "水", "土"],
            "ming_gua": "地水師卦",
            "details": [...]
        }
        """
        groups = self._split_number(id_number, is_phone=False)
        
        gua_sequence = []
        gua_names = []
        elements = []
        details = []
        
        for i, group in enumerate(groups):
            if len(group) == 1:
                gua_num = self._calculate_single_digit_gua(group)
            else:
                gua_num = self._calculate_gua(group)
            
            if gua_num is not None:
                gua_name = self.GUA_MAP[gua_num]["name"]
                element = self.GUA_MAP[gua_num]["element"]
                
                gua_sequence.append(gua_num)
                gua_names.append(gua_name)
                elements.append(element)
                
                details.append({
                    "position": i + 1,
                    "group": group,
                    "gua_num": gua_num,
                    "gua_name": gua_name,
                    "element": element,
                    "meaning": self.GUA_MAP[gua_num]["meaning"]
                })
        
        # 計算本命卦（上卦 + 下卦）
        ming_gua = None
        if len(gua_names) >= 2:
            upper_gua = gua_names[-1]  # 第3組是上卦
            lower_gua = gua_names[1]   # 第2組是下卦
            ming_gua = f"{upper_gua}{lower_gua}卦"
        
        return {
            "original": id_number,
            "groups": groups,
            "gua_sequence": gua_sequence,
            "gua_names": gua_names,
            "elements": elements,
            "ming_gua": ming_gua,
            "details": details
        }
    
    def calculate_phone_gua(self, phone_number):
        """
        計算手機號的卦象序列
        
        返回：
        {
            "original": "0905723595",
            "groups": ["905", "723", "595"],
            "gua_sequence": [7, 4, 3],
            "gua_names": ["艮", "震", "離"],
            "elements": ["土", "木", "火"],
            "five_elements_flow": "土→木→火",
            "score": 85,
            "details": [...]
        }
        """
        groups = self._split_number(phone_number, is_phone=True)
        
        gua_sequence = []
        gua_names = []
        elements = []
        details = []
        
        for i, group in enumerate(groups):
            if len(group) == 1:
                gua_num = self._calculate_single_digit_gua(group)
            else:
                gua_num = self._calculate_gua(group)
            
            if gua_num is not None:
                gua_name = self.GUA_MAP[gua_num]["name"]
                element = self.GUA_MAP[gua_num]["element"]
                
                gua_sequence.append(gua_num)
                gua_names.append(gua_name)
                elements.append(element)
                
                details.append({
                    "position": i + 1,
                    "group": group,
                    "gua_num": gua_num,
                    "gua_name": gua_name,
                    "element": element,
                    "meaning": self.GUA_MAP[gua_num]["meaning"]
                })
        
        # 分析五行流動
        five_elements_flow = " → ".join(elements)
        
        # 計算評分（基礎版本）
        score = self._calculate_phone_score(gua_sequence, elements, phone_number)
        
        return {
            "original": phone_number,
            "groups": groups,
            "gua_sequence": gua_sequence,
            "gua_names": gua_names,
            "elements": elements,
            "five_elements_flow": five_elements_flow,
            "score": score,
            "details": details
        }
    
    def _calculate_phone_score(self, gua_sequence, elements, phone_number):
        """
        計算手機號評分
        
        評分規則：
        - 基礎分：100分
        - 包含數字4：-20分
        - 末位為0：-15分
        - 五行相剋：-10~20分
        - 五行相生：+5~10分
        """
        score = 100
        
        # 檢查數字4
        if '4' in phone_number:
            score -= 20
        
        # 檢查末位為0
        if phone_number.endswith('0'):
            score -= 15
        
        # 分析五行流動
        if len(elements) >= 2:
            for i in range(len(elements) - 1):
                current_element = elements[i]
                next_element = elements[i + 1]
                
                # 檢查相生
                if self.FIVE_ELEMENTS_GENERATION.get(current_element) == next_element:
                    score += 5
                # 檢查相剋
                elif self.FIVE_ELEMENTS_RESTRAINT.get(current_element) == next_element:
                    score -= 10
        
        # 確保評分在0-100之間
        score = max(0, min(100, score))
        
        return score
    
    def analyze_compatibility(self, id_gua_result, phone_gua_result):
        """
        分析身分證和手機號的相容性
        
        返回：
        {
            "id_elements": ["土", "水", "土"],
            "phone_elements": ["火", "木", "火"],
            "compatibility_score": 85,
            "analysis": "...",
            "recommendation": "..."
        }
        """
        id_elements = id_gua_result["elements"]
        phone_elements = phone_gua_result["elements"]
        
        # 計算相容性評分
        compatibility_score = 100
        
        # 檢查身分證下卦與手機號第一卦的相容性
        if len(id_elements) >= 2 and len(phone_elements) >= 1:
            id_lower_element = id_elements[1]
            phone_first_element = phone_elements[0]
            
            # 相生加分
            if self.FIVE_ELEMENTS_GENERATION.get(id_lower_element) == phone_first_element:
                compatibility_score += 10
            # 相剋減分
            elif self.FIVE_ELEMENTS_RESTRAINT.get(id_lower_element) == phone_first_element:
                compatibility_score -= 15
        
        # 檢查整體五行平衡
        all_elements = id_elements + phone_elements
        element_count = {}
        for elem in all_elements:
            element_count[elem] = element_count.get(elem, 0) + 1
        
        # 如果某個五行過多，減分
        if max(element_count.values()) > 3:
            compatibility_score -= 10
        
        # 確保評分在0-100之間
        compatibility_score = max(0, min(100, compatibility_score))
        
        return {
            "id_elements": id_elements,
            "phone_elements": phone_elements,
            "compatibility_score": compatibility_score,
            "analysis": f"身分證五行：{' '.join(id_elements)}，手機號五行：{' '.join(phone_elements)}",
            "recommendation": "相容性良好" if compatibility_score >= 80 else "相容性一般" if compatibility_score >= 60 else "相容性較差"
        }


# 使用示例
if __name__ == "__main__":
    divination = ZhanjiDivination()
    
    # 計算您的身分證
    print("="*80)
    print("【您的身分證】")
    print("="*80)
    id_result = divination.calculate_id_gua("H224326529")
    print(f"原始：{id_result['original']}")
    print(f"分組：{' | '.join(id_result['groups'])}")
    print(f"卦象：{' | '.join(id_result['gua_names'])}")
    print(f"五行：{' | '.join(id_result['elements'])}")
    print(f"本命卦：{id_result['ming_gua']}")
    print()
    
    # 計算您的手機號
    print("="*80)
    print("【您的手機號】")
    print("="*80)
    phone_result = divination.calculate_phone_gua("0905723595")
    print(f"原始：{phone_result['original']}")
    print(f"分組：{' | '.join(phone_result['groups'])}")
    print(f"卦象：{' | '.join(phone_result['gua_names'])}")
    print(f"五行流動：{phone_result['five_elements_flow']}")
    print(f"評分：{phone_result['score']}分")
    print()
    
    # 分析相容性
    print("="*80)
    print("【身分證與手機號的相容性】")
    print("="*80)
    compatibility = divination.analyze_compatibility(id_result, phone_result)
    print(f"相容性評分：{compatibility['compatibility_score']}分")
    print(f"分析：{compatibility['analysis']}")
    print(f"建議：{compatibility['recommendation']}")
    print()
    
    # 計算其他人的信息
    print("="*80)
    print("【女兒的身分證】")
    print("="*80)
    daughter_id = divination.calculate_id_gua("H224717173")
    print(f"卦象：{' | '.join(daughter_id['gua_names'])}")
    print(f"五行：{' | '.join(daughter_id['elements'])}")
    print()
    
    print("="*80)
    print("【爸爸的身分證】")
    print("="*80)
    father_id = divination.calculate_id_gua("H102561219")
    print(f"卦象：{' | '.join(father_id['gua_names'])}")
    print(f"五行：{' | '.join(father_id['elements'])}")
    print()
    
    print("="*80)
    print("【爸爸的手機號】")
    print("="*80)
    father_phone = divination.calculate_phone_gua("0987258995")
    print(f"卦象：{' | '.join(father_phone['gua_names'])}")
    print(f"五行流動：{father_phone['five_elements_flow']}")
    print(f"評分：{father_phone['score']}分")
    print()
    
    print("="*80)
    print("【媽媽的手機號】")
    print("="*80)
    mother_phone = divination.calculate_phone_gua("0922736862")
    print(f"卦象：{' | '.join(mother_phone['gua_names'])}")
    print(f"五行流動：{mother_phone['five_elements_flow']}")
    print(f"評分：{mother_phone['score']}分")
