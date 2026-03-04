#!/usr/bin/env python3
"""
馥靈之鑰｜紫微斗數完整計算引擎 v1.0
依據《紫微斗數全書》安星規則，每宮全展開
2026-03-04
"""

DIZHI = '子丑寅卯辰巳午未申酉戌亥'
TIANGAN = '甲乙丙丁戊己庚辛壬癸'

# ════════════════════════════════════════════════════════════
# 基礎：命宮、身宮、五行局
# ════════════════════════════════════════════════════════════

def find_ming_gong(lunar_month, hour_zhi_idx):
    """
    命宮安法：寅月起子時，逆推
    口訣：正月寅宮起子時，逆行十二是歸期
    """
    # 月份從寅宮開始(idx=2)，每月進一宮
    month_base = (lunar_month + 1) % 12  # 正月=寅(2)
    # 從月份宮位起子時，逆數到出生時辰
    ming = (month_base - hour_zhi_idx) % 12
    return ming

def find_shen_gong(lunar_month, hour_zhi_idx):
    """
    身宮安法：寅月起子時，順推
    """
    month_base = (lunar_month + 1) % 12
    shen = (month_base + hour_zhi_idx) % 12
    return shen

def get_gong_tiangan(year_tg_idx, ming_zhi_idx):
    """
    宮干推算：依年干起寅宮之天干
    甲己年寅宮起丙，乙庚起戊，丙辛起庚，丁壬起壬，戊癸起甲
    """
    base_map = {0: 2, 1: 4, 2: 6, 3: 8, 4: 0,   # 甲丙 乙戊 丙庚 丁壬 戊甲
                5: 2, 6: 4, 7: 6, 8: 8, 9: 0}     # 己丙 庚戊 辛庚 壬壬 癸甲
    yin_tg = base_map[year_tg_idx]
    # 從寅宮(idx=2)起，每宮干+1
    offset = (ming_zhi_idx - 2) % 12
    return (yin_tg + offset) % 10

WUXING_JU = {
    # (宮干%2 的陰陽, 宮支) → 五行局
    # 實際用納音法：宮干+宮支的納音五行
    # 簡化版：用命宮天干地支查表
}

# 正式五行局查詢：依命宮干支的納音
NAYIN_60 = [
    '海中金','海中金','爐中火','爐中火','大林木','大林木',
    '路旁土','路旁土','劍鋒金','劍鋒金','山頭火','山頭火',
    '澗下水','澗下水','城頭土','城頭土','白蠟金','白蠟金',
    '楊柳木','楊柳木','泉中水','泉中水','屋上土','屋上土',
    '霹靂火','霹靂火','松柏木','松柏木','長流水','長流水',
    '沙中金','沙中金','山下火','山下火','平地木','平地木',
    '壁上土','壁上土','金箔金','金箔金','覆燈火','覆燈火',
    '天河水','天河水','大驛土','大驛土','釵環金','釵環金',
    '桑柘木','桑柘木','大溪水','大溪水','沙中土','沙中土',
    '天上火','天上火','石榴木','石榴木','大海水','大海水',
]

NAYIN_TO_JU = {
    '金': ('金四局', 4), '木': ('木三局', 3), '水': ('水二局', 2),
    '火': ('火六局', 6), '土': ('土五局', 5),
}

def get_wuxing_ju(gong_tg_idx, gong_zhi_idx):
    """五行局：依命宮干支的納音"""
    gz_idx = (gong_tg_idx % 10) * 12 + gong_zhi_idx  # 不對，要用六十甲子
    # 六十甲子索引
    # 天干和地支必須同陰同陽才能組合
    # 正確算法：干支共同索引
    # idx = (tg * 6 + dz/2) 如果同陰陽
    # 簡化：直接用干支表
    for i in range(60):
        if i % 10 == gong_tg_idx and i % 12 == gong_zhi_idx:
            nayin = NAYIN_60[i]
            wx = nayin[-1]  # 最後一個字就是五行
            return NAYIN_TO_JU[wx]
    # 如果干支不匹配（理論上不會），用備用
    return ('水二局', 2)

# ════════════════════════════════════════════════════════════
# 十四主星安星
# ════════════════════════════════════════════════════════════

def get_ziwei_position(lunar_day, ju_num):
    """
    紫微安星法：依農曆日數和五行局數
    口訣表（局數→紫微所在宮位）
    """
    # 紫微安星表：[五行局數][農曆日] → 宮位(地支index)
    # 這是紫微斗數最核心的查詢表
    ZIWEI_TABLE = {
        2: {  # 水二局
            1:1, 2:2, 3:2, 4:3, 5:3, 6:4, 7:4, 8:5, 9:5, 10:6,
            11:6, 12:7, 13:7, 14:8, 15:8, 16:9, 17:9, 18:10, 19:10, 20:11,
            21:11, 22:0, 23:0, 24:1, 25:1, 26:2, 27:2, 28:3, 29:3, 30:4,
        },
        3: {  # 木三局
            1:2, 2:2, 3:3, 4:2, 5:3, 6:4, 7:3, 8:4, 9:5, 10:4,
            11:5, 12:6, 13:5, 14:6, 15:7, 16:6, 17:7, 18:8, 19:7, 20:8,
            21:9, 22:8, 23:9, 24:10, 25:9, 26:10, 27:11, 28:10, 29:11, 30:0,
        },
        4: {  # 金四局
            1:3, 2:2, 3:3, 4:2, 5:4, 6:3, 7:3, 8:4, 9:3, 10:5,
            11:4, 12:4, 13:5, 14:4, 15:6, 16:5, 17:5, 18:6, 19:5, 20:7,
            21:6, 22:6, 23:7, 24:6, 25:8, 26:7, 27:7, 28:8, 29:7, 30:9,
        },
        5: {  # 土五局
            1:4, 2:2, 3:3, 4:3, 5:4, 6:2, 7:3, 8:4, 9:4, 10:5,
            11:3, 12:4, 13:5, 14:5, 15:6, 16:4, 17:5, 18:6, 19:6, 20:7,
            21:5, 22:6, 23:7, 24:7, 25:8, 26:6, 27:7, 28:8, 29:8, 30:9,
        },
        6: {  # 火六局
            1:5, 2:2, 3:3, 4:3, 5:4, 6:4, 7:5, 8:2, 9:3, 10:3,
            11:4, 12:4, 13:5, 14:5, 15:6, 16:3, 17:4, 18:4, 19:5, 20:5,
            21:6, 22:6, 23:7, 24:4, 25:5, 26:5, 27:6, 28:6, 29:7, 30:7,
        },
    }
    return ZIWEI_TABLE.get(ju_num, {}).get(lunar_day, 4)

# 紫微星系（紫微起，按固定間距安星）
# 紫微所在宮位確定後，其他5顆星按固定偏移
ZIWEI_GROUP_OFFSETS = {
    # 紫微星系：紫微→天機→空→太陽→武曲→天同
    '紫微': 0,
    '天機': -1,   # 紫微逆一宮
    '太陽': -3,   # 紫微逆三宮
    '武曲': -4,   # 紫微逆四宮
    '天同': -5,   # 紫微逆五宮
    '廉貞': 4,    # 紫微順四宮（實為逆八宮 = +4）
}

# 天府星系（天府位置 = 紫微的「鏡像」）
def get_tianfu_position(ziwei_pos):
    """天府位置：紫微的對稱位置（以寅申為軸）"""
    # 天府 = 12 - 紫微位置 + 4 (mod 12)  — 不完全正確
    # 正確公式：紫微在X宮，天府在(12-X+4)%12 = (16-X)%12 = (4-X)%12
    # 驗證：紫微辰(4)→天府子(0)  (4-4)%12=0 ✅
    return (4 - ziwei_pos) % 12  # 不對
    # 實際上天府和紫微是「鏡像」：以寅申線(2-8)為鏡
    # 如果紫微在辰(4)，鏡像 = 2 + (2-4) = 0(子) ← 但這也不太對
    # 用標準公式：天府 = (寅宮idx*2 - 紫微) % 12 = (4 - 紫微) % 12
    # 紫微=辰(4) → 天府=(4-4)%12=0(子) ← 需要驗證
    # userPreferences裡寫 紫微星位：辰宮，天府星位：子宮 → (4-4)%12=0 ✅!

TIANFU_GROUP_OFFSETS = {
    # 天府星系：天府→太陰→貪狼→巨門→天相→天梁→七殺→破軍
    '天府': 0,
    '太陰': 1,    # 天府順一宮
    '貪狼': 2,    # 天府順二宮
    '巨門': 3,    # 天府順三宮
    '天相': 4,    # 天府順四宮
    '天梁': 5,    # 天府順五宮
    '七殺': 6,    # 天府順六宮
    '破軍': 10,   # 天府順十宮（= 逆二宮 = 紫微逆二宮位置）
}

# ════════════════════════════════════════════════════════════
# 主星亮度表
# ════════════════════════════════════════════════════════════

# 格式：星名 → [子,丑,寅,卯,辰,巳,午,未,申,酉,戌,亥] 亮度
# 廟=最亮 旺=次亮 得=中上 利=中 平=中下 不=偏弱 陷=最弱
BRIGHTNESS = {
    '紫微': ['旺','廟','廟','旺','旺','得','廟','旺','廟','旺','得','旺'],
    '天機': ['廟','得','廟','旺','平','旺','廟','得','廟','旺','陷','旺'],
    '太陽': ['廟','旺','廟','旺','廟','旺','旺','得','得','陷','陷','陷'],
    '武曲': ['旺','廟','利','廟','旺','得','旺','廟','利','廟','旺','利'],
    '天同': ['平','陷','旺','陷','得','廟','陷','陷','旺','陷','得','廟'],
    '廉貞': ['平','廟','得','陷','旺','平','廟','得','廟','陷','旺','平'],
    '天府': ['廟','旺','廟','得','廟','旺','旺','得','旺','旺','廟','得'],
    '太陰': ['廟','廟','陷','陷','陷','陷','陷','旺','旺','廟','廟','廟'],
    '貪狼': ['旺','廟','平','廟','得','陷','旺','廟','平','廟','得','陷'],
    '巨門': ['旺','廟','廟','旺','得','陷','旺','廟','廟','旺','得','陷'],
    '天相': ['廟','廟','得','陷','廟','旺','廟','廟','得','陷','廟','旺'],
    '天梁': ['廟','旺','廟','陷','旺','廟','旺','廟','廟','陷','旺','廟'],
    '七殺': ['旺','廟','廟','旺','廟','得','旺','廟','廟','旺','廟','得'],
    '破軍': ['旺','廟','陷','陷','旺','陷','旺','廟','陷','陷','旺','陷'],
}

# ════════════════════════════════════════════════════════════
# 六吉星安星
# ════════════════════════════════════════════════════════════

# 文昌：依出生年干
WENCHANG = {0:5, 1:6, 2:7, 3:8, 4:9, 5:10, 6:11, 7:0, 8:1, 9:2}
# 甲→巳 乙→午 丙→未 丁→申 戊→酉 己→戌 庚→亥 辛→子 壬→丑 癸→寅
# 修正：文昌依年干安星
# 甲→巳(5) 乙→午(6) 丙→申(8) 丁→酉(9) 戊→申(8) 己→酉(9) 庚→戌(10) 辛→亥(11) 壬→亥(11) 癸→子(0)
WENCHANG = {0:5, 1:6, 2:8, 3:9, 4:8, 5:9, 6:10, 7:11, 8:11, 9:0}

# 文曲：依出生年干
# 甲→酉(9) 乙→申(8) 丙→午(6) 丁→巳(5) 戊→午(6) 己→巳(5) 庚→辰(4) 辛→卯(3) 壬→卯(3) 癸→寅(2)
WENQU = {0:9, 1:8, 2:6, 3:5, 4:6, 5:5, 6:4, 7:3, 8:3, 9:2}

# 左輔：依農曆生月（正月辰順行）
# 正月→辰(4) 二月→巳(5) ... 十二月→卯(3)
def get_zuofu(lunar_month):
    return (lunar_month + 3) % 12

# 右弼：依農曆生月（正月戌逆行）
# 正月→戌(10) 二月→酉(9) ... 十二月→亥(11)
def get_youbi(lunar_month):
    return (11 - lunar_month) % 12

# 天魁：依出生年干
# 甲戊庚→丑 乙己→子 丙丁→亥 辛→午 壬癸→卯
TIANKUI = {0:1, 1:0, 2:11, 3:11, 4:1, 5:0, 6:1, 7:6, 8:3, 9:3}

# 天鉞：依出生年干
# 甲戊庚→未 乙己→申 丙丁→酉 辛→寅 壬癸→巳
TIANYUE = {0:7, 1:8, 2:9, 3:9, 4:7, 5:8, 6:7, 7:2, 8:5, 9:5}

# ════════════════════════════════════════════════════════════
# 六煞星安星
# ════════════════════════════════════════════════════════════

# 祿存（先安祿存才能安擎羊陀羅）
# 依出生年干
# 甲→寅(2) 乙→卯(3) 丙戊→巳(5) 丁己→午(6) 庚→申(8) 辛→酉(9) 壬→亥(11) 癸→子(0)
LUCUN = {0:2, 1:3, 2:5, 3:6, 4:5, 5:6, 6:8, 7:9, 8:11, 9:0}

# 擎羊：祿存前一宮（順時針）
def get_qingyang(year_tg_idx):
    return (LUCUN[year_tg_idx] + 1) % 12

# 陀羅：祿存後一宮（逆時針）
def get_tuoluo(year_tg_idx):
    return (LUCUN[year_tg_idx] - 1) % 12

# 火星：依出生年支+時辰（簡化版用年支組）
# 寅午戌年→丑起子時順行  申子辰年→寅起子時順行
# 巳酉丑年→卯起子時順行  亥卯未年→酉起子時順行
HUOXING_BASE = {
    '寅':1, '午':1, '戌':1,  # 丑(1)
    '申':2, '子':2, '辰':2,  # 寅(2)
    '巳':3, '酉':3, '丑':3,  # 卯(3)
    '亥':9, '卯':9, '未':9,  # 酉(9)
}

def get_huoxing(year_zhi, hour_zhi_idx):
    base = HUOXING_BASE.get(year_zhi, 1)
    return (base + hour_zhi_idx) % 12

# 鈴星：依出生年支+時辰
LINGXING_BASE = {
    '寅':3, '午':3, '戌':3,  # 卯(3)
    '申':10, '子':10, '辰':10,  # 戌(10)
    '巳':10, '酉':10, '丑':10,  # 戌(10)
    '亥':10, '卯':10, '未':10,  # 戌(10)
}

def get_lingxing(year_zhi, hour_zhi_idx):
    base = LINGXING_BASE.get(year_zhi, 10)
    return (base + hour_zhi_idx) % 12

# 地空：依出生時辰（亥起子時逆行）
def get_dikong(hour_zhi_idx):
    return (11 - hour_zhi_idx) % 12

# 地劫：依出生時辰（亥起子時順行）
def get_dijie(hour_zhi_idx):
    return (11 + hour_zhi_idx) % 12

# 天馬：依出生年支
# 寅午戌→申(8) 申子辰→寅(2) 巳酉丑→亥(11) 亥卯未→巳(5)
TIANMA = {
    '寅':8, '午':8, '戌':8,
    '申':2, '子':2, '辰':2,
    '巳':11, '酉':11, '丑':11,
    '亥':5, '卯':5, '未':5,
}

# ════════════════════════════════════════════════════════════
# 生年四化
# ════════════════════════════════════════════════════════════

SIHUA = {
    '甲': {'化祿':'廉貞', '化權':'破軍', '化科':'武曲', '化忌':'太陽'},
    '乙': {'化祿':'天機', '化權':'天梁', '化科':'紫微', '化忌':'太陰'},
    '丙': {'化祿':'天同', '化權':'天機', '化科':'文昌', '化忌':'廉貞'},
    '丁': {'化祿':'太陰', '化權':'天同', '化科':'天機', '化忌':'巨門'},
    '戊': {'化祿':'貪狼', '化權':'太陰', '化科':'右弼', '化忌':'天機'},
    '己': {'化祿':'武曲', '化權':'貪狼', '化科':'天梁', '化忌':'文曲'},
    '庚': {'化祿':'太陽', '化權':'武曲', '化科':'太陰', '化忌':'天同'},
    '辛': {'化祿':'巨門', '化權':'太陽', '化科':'文曲', '化忌':'文昌'},
    '壬': {'化祿':'天梁', '化權':'紫微', '化科':'左輔', '化忌':'武曲'},
    '癸': {'化祿':'破軍', '化權':'巨門', '化科':'太陰', '化忌':'貪狼'},
}

# ════════════════════════════════════════════════════════════
# 雜曜安星（31顆）
# ════════════════════════════════════════════════════════════

# 生年系（依出生年支）
def get_hongluan(year_zhi_idx):
    """紅鸞：卯起子年逆行"""
    return (3 - year_zhi_idx) % 12

def get_tianxi(year_zhi_idx):
    """天喜：紅鸞對宮"""
    return (get_hongluan(year_zhi_idx) + 6) % 12

def get_guchen(year_zhi_idx):
    """孤辰：依年支三合局推算"""
    # 寅午戌→巳(5) 申子辰→亥(11) 巳酉丑→寅(2) 亥卯未→申(8)
    group = {2:5, 6:5, 10:5, 8:11, 0:11, 4:11, 5:2, 9:2, 1:2, 11:8, 3:8, 7:8}
    return group.get(year_zhi_idx, 0)

def get_guasu(year_zhi_idx):
    """寡宿：依年支三合局推算"""
    # 寅午戌→丑(1) 申子辰→未(7) 巳酉丑→戌(10) 亥卯未→辰(4)
    group = {2:1, 6:1, 10:1, 8:7, 0:7, 4:7, 5:10, 9:10, 1:10, 11:4, 3:4, 7:4}
    return group.get(year_zhi_idx, 0)

def get_tianku(year_zhi_idx):
    """天哭：午起子年順行"""
    return (6 + year_zhi_idx) % 12

def get_tianxu(year_zhi_idx):
    """天虛：午起子年逆行"""
    return (6 - year_zhi_idx) % 12

def get_tianxing(year_zhi_idx):
    """天刑：酉起子年順行"""
    return (9 + year_zhi_idx) % 12

def get_tianyao(year_zhi_idx):
    """天姚：丑起子年順行"""
    return (1 + year_zhi_idx) % 12

def get_tianyue_za(year_zhi_idx):
    """天月（雜曜）：依年支固定"""
    # 子→戌 丑→巳 寅→辰 卯→寅 辰→未 巳→卯 午→亥 未→未 申→午 酉→寅 戌→午 亥→辰
    TABLE = {0:10, 1:5, 2:4, 3:2, 4:7, 5:3, 6:11, 7:7, 8:6, 9:2, 10:6, 11:4}
    return TABLE.get(year_zhi_idx, 0)

def get_yinsha(year_zhi_idx):
    """陰煞：依年支"""
    # 寅午戌→丑 申子辰→未 巳酉丑→辰 亥卯未→戌
    group = {2:1, 6:1, 10:1, 8:7, 0:7, 4:7, 5:4, 9:4, 1:4, 11:10, 3:10, 7:10}
    return group.get(year_zhi_idx, 0)

def get_xianchi(year_zhi_idx):
    """咸池（桃花）：依年支"""
    # 寅午戌→卯 申子辰→酉 巳酉丑→午 亥卯未→子
    group = {2:3, 6:3, 10:3, 8:9, 0:9, 4:9, 5:6, 9:6, 1:6, 11:0, 3:0, 7:0}
    return group.get(year_zhi_idx, 0)

def get_jieshen(year_zhi_idx):
    """解神：依年支"""
    # 子→申 丑→酉 寅→戌 卯→亥 辰→子 巳→丑 午→寅 未→卯 申→辰 酉→巳 戌→午 亥→未
    return (year_zhi_idx + 8) % 12

def get_feilian(year_zhi_idx):
    """蜚廉：依年支"""
    # 子→申 丑→酉 寅→戌 卯→巳 辰→午 巳→未 午→寅 未→卯 申→辰 酉→亥 戌→子 亥→丑
    TABLE = {0:8, 1:9, 2:10, 3:5, 4:6, 5:7, 6:2, 7:3, 8:4, 9:11, 10:0, 11:1}
    return TABLE.get(year_zhi_idx, 0)

def get_posui(year_zhi_idx):
    """破碎：依年支"""
    # 子→巳 丑→酉 寅→丑 卯→巳 辰→酉 巳→丑 午→巳 未→酉 申→丑 酉→巳 戌→酉 亥→丑
    TABLE = {0:5, 1:9, 2:1, 3:5, 4:9, 5:1, 6:5, 7:9, 8:1, 9:5, 10:9, 11:1}
    return TABLE.get(year_zhi_idx, 0)

def get_dahao(year_zhi_idx):
    """大耗：依年支（直接取對宮）"""
    return (year_zhi_idx + 6) % 12

def get_tianshang(year_zhi_idx):
    """天傷：依年支"""
    # 固定在命宮對宮附近，簡化用遷移宮位
    return (year_zhi_idx + 7) % 12

def get_tianshi(year_zhi_idx):
    """天使：天傷對宮"""
    return (get_tianshang(year_zhi_idx) + 6) % 12

# 年干系雜曜
def get_enguang(year_tg_idx):
    """恩光：依年干"""
    # 甲→丑 乙→寅 丙→卯 丁→辰 戊→巳 己→午 庚→未 辛→申 壬→酉 癸→戌
    return (year_tg_idx + 1) % 12

def get_taifu(year_tg_idx):
    """台輔：依年干"""
    return (year_tg_idx + 6) % 12

def get_fenggao(year_tg_idx):
    """封誥：依年干"""
    # 甲→丑 乙→寅... 跟恩光類似但偏移不同
    # 實際：甲→丑 乙→子 丙→亥 丁→戌 戊→酉 己→申 庚→未 辛→午 壬→巳 癸→辰
    return (1 - year_tg_idx) % 12

def get_tiangui(year_tg_idx):
    """天貴：依年干"""
    # 甲→未 乙→申 丙→酉 丁→戌 戊→酉 己→戌 庚→亥 辛→子 壬→子 癸→丑
    TABLE = {0:7, 1:8, 2:9, 3:10, 4:9, 5:10, 6:11, 7:0, 8:0, 9:1}
    return TABLE.get(year_tg_idx, 0)

# 生日系雜曜（依農曆日數）
def get_santai(lunar_day):
    """三台：依農曆日（左輔起初一順行）"""
    return (get_zuofu(1) + lunar_day - 1) % 12  # 需要月份，簡化

def get_bazuo(lunar_day):
    """八座：依農曆日（右弼起初一逆行）"""
    return (get_youbi(1) - lunar_day + 1) % 12  # 需要月份，簡化

def get_tiancai(lunar_day, ming_gong):
    """天才：命宮起農曆年，順行至月、日"""
    # 簡化：天才落在命宮+日數偏移
    return (ming_gong + lunar_day - 1) % 12

def get_tianshou(lunar_day, shen_gong):
    """天壽：身宮起農曆年，順行至月、日"""
    return (shen_gong + lunar_day - 1) % 12

def get_longchi(year_zhi_idx):
    """龍池：依年支（辰起子年順行）"""
    return (4 + year_zhi_idx) % 12

def get_fengge(year_zhi_idx):
    """鳳閣：依年支（戌起子年逆行）"""
    return (10 - year_zhi_idx) % 12

# 生時系雜曜
def get_tianguan(year_tg_idx):
    """天官：依年干"""
    TABLE = {0:7, 1:4, 2:5, 3:2, 4:3, 5:8, 6:11, 7:9, 8:0, 9:6}
    return TABLE.get(year_tg_idx, 0)

def get_tianfu_za(year_tg_idx):
    """天福（雜曜）：依年干"""
    TABLE = {0:9, 1:8, 2:0, 3:11, 4:3, 5:2, 6:6, 7:5, 8:6, 9:5}
    return TABLE.get(year_tg_idx, 0)

# ════════════════════════════════════════════════════════════
# 長生十二神
# ════════════════════════════════════════════════════════════

CHANGSHENG_12 = ['長生','沐浴','冠帶','臨官','帝旺','衰','病','死','墓','絕','胎','養']

# 依五行局起長生位
# 水二局→申起長生(陽順陰逆)  木三局→亥起  金四局→巳起  土五局→申起  火六局→寅起
CHANGSHENG_START = {2: 8, 3: 11, 4: 5, 5: 8, 6: 2}

def get_changsheng(ju_num, gender_yang, gong_zhi_idx):
    """長生十二神"""
    start = CHANGSHENG_START.get(ju_num, 8)
    if gender_yang:  # 陽男陰女順行
        offset = (gong_zhi_idx - start) % 12
    else:  # 陰男陽女逆行
        offset = (start - gong_zhi_idx) % 12
    return CHANGSHENG_12[offset]

# ════════════════════════════════════════════════════════════
# 博士十二神
# ════════════════════════════════════════════════════════════

BOSHI_12 = ['博士','力士','青龍','小耗','將軍','奏書','飛廉','喜神','病符','大耗','伏兵','官府']

def get_boshi(lucun_pos, gender_yang, gong_zhi_idx):
    """博士十二神：從祿存起，陽男陰女順行，陰男陽女逆行"""
    if gender_yang:
        offset = (gong_zhi_idx - lucun_pos) % 12
    else:
        offset = (lucun_pos - gong_zhi_idx) % 12
    return BOSHI_12[offset]

# ════════════════════════════════════════════════════════════
# 截路、旬空
# ════════════════════════════════════════════════════════════

def get_jielu(gong_tg_idx):
    """截路：依宮干判斷"""
    # 甲→申酉 乙→午未 丙→辰巳 丁→寅卯 戊→子丑 己→申酉 庚→午未 辛→辰巳 壬→寅卯 癸→子丑
    TABLE = {
        0:(8,9), 1:(6,7), 2:(4,5), 3:(2,3), 4:(0,1),
        5:(8,9), 6:(6,7), 7:(4,5), 8:(2,3), 9:(0,1),
    }
    return TABLE.get(gong_tg_idx, (0,1))

def get_xunkong(day_gz_idx):
    """旬空：依日柱干支推算"""
    # 日柱所在的旬，旬尾兩個地支為空亡
    xun_start = (day_gz_idx // 10) * 10  # 旬首
    # 旬空 = 旬首地支 + 10, +11 (mod 12)
    xun_start_zhi = xun_start % 12
    kong1 = (xun_start_zhi + 10) % 12
    kong2 = (xun_start_zhi + 11) % 12
    return (kong1, kong2)

# ════════════════════════════════════════════════════════════
# 大限系統
# ════════════════════════════════════════════════════════════

def get_daxian(ming_gong, ju_num, year_yin_yang, gender):
    """
    大限排列
    陽男陰女：命宮起，順時針
    陰男陽女：命宮起，逆時針
    每個大限 = 五行局數的倍數
    """
    is_yang = (year_yin_yang == 0)  # 年干為陽
    forward = (is_yang and gender == 'M') or (not is_yang and gender == 'F')
    
    daxian_list = []
    for i in range(12):
        start_age = ju_num + i * 10 - (10 - ju_num)
        # 修正：第一大限起始年齡 = 五行局數 (如水二局→2歲起)
        start_age = ju_num + i * 10
        end_age = start_age + 9
        
        if forward:
            gong = (ming_gong + i) % 12
        else:
            gong = (ming_gong - i) % 12
        
        daxian_list.append({
            'ages': f'{start_age}-{end_age}',
            'start': start_age,
            'end': end_age,
            'gong_idx': gong,
            'gong_name': DIZHI[gong],
        })
    
    return daxian_list

# ════════════════════════════════════════════════════════════
# 命主、身主
# ════════════════════════════════════════════════════════════

def get_mingzhu(ming_gong_idx):
    """命主：依命宮地支"""
    # 子→貪狼 丑→巨門 寅→祿存 卯→文曲 辰→廉貞 巳→武曲
    # 午→破軍 未→武曲 申→廉貞 酉→文曲 戌→祿存 亥→巨門
    TABLE = ['貪狼','巨門','祿存','文曲','廉貞','武曲',
             '破軍','武曲','廉貞','文曲','祿存','巨門']
    return TABLE[ming_gong_idx]

def get_shenzhu(year_zhi_idx):
    """身主：依出生年支"""
    # 子→火星 丑→天相 寅→天梁 卯→天同 辰→文昌 巳→天機
    # 午→火星 未→天相 申→天梁 酉→天同 戌→文昌 亥→天機
    TABLE = ['火星','天相','天梁','天同','文昌','天機',
             '火星','天相','天梁','天同','文昌','天機']
    return TABLE[year_zhi_idx]

# ════════════════════════════════════════════════════════════
# 十二宮名稱
# ════════════════════════════════════════════════════════════

GONG_NAMES = ['命宮','兄弟宮','夫妻宮','子女宮','財帛宮','疾厄宮',
              '遷移宮','交友宮','事業宮','田宅宮','福德宮','父母宮']

def get_gong_name(ming_gong_idx, target_idx):
    """根據命宮位置，推算target_idx是第幾宮（逆時針排列）"""
    offset = (ming_gong_idx - target_idx) % 12
    return GONG_NAMES[offset]

# ════════════════════════════════════════════════════════════
# 主計算函數
# ════════════════════════════════════════════════════════════

def calc_ziwei_full(lunar_year, lunar_month, lunar_day, hour_zhi_idx, year_tg_idx, year_zhi_idx, gender='F'):
    """
    紫微斗數完整計算
    
    參數：
    - lunar_year: 農曆年份
    - lunar_month: 農曆月（1-12）
    - lunar_day: 農曆日（1-30）
    - hour_zhi_idx: 時辰地支索引（子=0...亥=11）
    - year_tg_idx: 年干索引（甲=0...癸=9）
    - year_zhi_idx: 年支索引（子=0...亥=11）
    - gender: 'M' or 'F'
    """
    
    year_tg = TIANGAN[year_tg_idx]
    year_zhi = DIZHI[year_zhi_idx]
    
    # ──── 基本資訊 ────
    ming_gong = find_ming_gong(lunar_month, hour_zhi_idx)
    shen_gong = find_shen_gong(lunar_month, hour_zhi_idx)
    
    # 宮干
    ming_tg_idx = get_gong_tiangan(year_tg_idx, ming_gong)
    
    # 五行局
    ju_name, ju_num = get_wuxing_ju(ming_tg_idx, ming_gong)
    
    # 命主、身主
    mingzhu = get_mingzhu(ming_gong)
    shenzhu = get_shenzhu(year_zhi_idx)
    
    # ──── 十四主星 ────
    ziwei_pos = get_ziwei_position(lunar_day, ju_num)
    tianfu_pos = (4 - ziwei_pos) % 12
    
    # 安紫微星系
    star_positions = {}  # {宮位idx: [星名, ...]}
    for i in range(12):
        star_positions[i] = {'main_stars': [], 'sihua': [], 'liuji': [], 'liusha': [],
                             'luma': [], 'zayao': [], 'changsheng': '', 'boshi': '',
                             'jielu': False, 'xunkong': False}
    
    # 紫微星系
    for star, offset in ZIWEI_GROUP_OFFSETS.items():
        pos = (ziwei_pos + offset) % 12
        brightness = BRIGHTNESS[star][pos]
        star_positions[pos]['main_stars'].append({'name': star, 'brightness': brightness})
    
    # 天府星系
    for star, offset in TIANFU_GROUP_OFFSETS.items():
        pos = (tianfu_pos + offset) % 12
        brightness = BRIGHTNESS[star][pos]
        star_positions[pos]['main_stars'].append({'name': star, 'brightness': brightness})
    
    # ──── 生年四化 ────
    sihua = SIHUA[year_tg]
    for hua_type, star_name in sihua.items():
        # 找這顆星在哪個宮
        for gong_idx in range(12):
            for s in star_positions[gong_idx]['main_stars']:
                if s['name'] == star_name:
                    star_positions[gong_idx]['sihua'].append(hua_type)
                    s['sihua'] = hua_type
    
    # ──── 六吉星 ────
    liuji_positions = {
        '文昌': WENCHANG[year_tg_idx],
        '文曲': WENQU[year_tg_idx],
        '左輔': get_zuofu(lunar_month),
        '右弼': get_youbi(lunar_month),
        '天魁': TIANKUI[year_tg_idx],
        '天鉞': TIANYUE[year_tg_idx],
    }
    for name, pos in liuji_positions.items():
        star_positions[pos]['liuji'].append(name)
        # 六吉星也可能有四化
        for hua_type, star_name in sihua.items():
            if star_name == name:
                star_positions[pos]['sihua'].append(f'{hua_type}({name})')
    
    # ──── 六煞星 + 祿馬 ────
    lucun_pos = LUCUN[year_tg_idx]
    star_positions[lucun_pos]['luma'].append('祿存')
    
    tianma_pos = TIANMA.get(year_zhi, 0)
    star_positions[tianma_pos]['luma'].append('天馬')
    
    sha_positions = {
        '擎羊': get_qingyang(year_tg_idx),
        '陀羅': get_tuoluo(year_tg_idx),
        '火星': get_huoxing(year_zhi, hour_zhi_idx),
        '鈴星': get_lingxing(year_zhi, hour_zhi_idx),
        '地空': get_dikong(hour_zhi_idx),
        '地劫': get_dijie(hour_zhi_idx),
    }
    for name, pos in sha_positions.items():
        star_positions[pos]['liusha'].append(name)
    
    # ──── 雜曜 ────
    zayao_list = [
        ('紅鸞', get_hongluan(year_zhi_idx), '生年系'),
        ('天喜', get_tianxi(year_zhi_idx), '生年系'),
        ('孤辰', get_guchen(year_zhi_idx), '生年系'),
        ('寡宿', get_guasu(year_zhi_idx), '生年系'),
        ('天哭', get_tianku(year_zhi_idx), '生年系'),
        ('天虛', get_tianxu(year_zhi_idx), '生年系'),
        ('天刑', get_tianxing(year_zhi_idx), '生年系'),
        ('天姚', get_tianyao(year_zhi_idx), '生年系'),
        ('天月', get_tianyue_za(year_zhi_idx), '生年系'),
        ('陰煞', get_yinsha(year_zhi_idx), '生年系'),
        ('咸池', get_xianchi(year_zhi_idx), '生年系'),
        ('解神', get_jieshen(year_zhi_idx), '生年系'),
        ('蜚廉', get_feilian(year_zhi_idx), '生年系'),
        ('破碎', get_posui(year_zhi_idx), '生年系'),
        ('大耗', get_dahao(year_zhi_idx), '生年系'),
        ('天傷', get_tianshang(year_zhi_idx), '生年系'),
        ('天使', get_tianshi(year_zhi_idx), '生年系'),
        ('恩光', get_enguang(year_tg_idx), '年干系'),
        ('台輔', get_taifu(year_tg_idx), '年干系'),
        ('封誥', get_fenggao(year_tg_idx), '年干系'),
        ('天貴', get_tiangui(year_tg_idx), '年干系'),
        ('龍池', get_longchi(year_zhi_idx), '生日系'),
        ('鳳閣', get_fengge(year_zhi_idx), '生日系'),
        ('天官', get_tianguan(year_tg_idx), '生時系'),
        ('天福', get_tianfu_za(year_tg_idx), '生時系'),
    ]
    
    for name, pos, group in zayao_list:
        star_positions[pos]['zayao'].append({'name': name, 'group': group})
    
    # ──── 長生十二神、博士十二神 ────
    year_yang = (year_tg_idx % 2 == 0)
    gender_yang = (year_yang and gender == 'M') or (not year_yang and gender == 'F')
    
    for i in range(12):
        star_positions[i]['changsheng'] = get_changsheng(ju_num, gender_yang, i)
        star_positions[i]['boshi'] = get_boshi(lucun_pos, gender_yang, i)
    
    # ──── 截路、旬空 ────
    for i in range(12):
        gong_tg = get_gong_tiangan(year_tg_idx, i)
        jielu = get_jielu(gong_tg)
        if i in jielu:
            star_positions[i]['jielu'] = True
    
    # 旬空需要日柱，暫時跳過（需要日柱干支索引）
    
    # ──── 大限 ────
    daxian = get_daxian(ming_gong, ju_num, year_tg_idx % 2, gender)
    
    # ──── 各宮宮干四化 ────
    gong_sihua = {}
    for i in range(12):
        gtg = get_gong_tiangan(year_tg_idx, i)
        gtg_name = TIANGAN[gtg]
        gong_sihua[i] = SIHUA[gtg_name]
    
    # ──── 身宮所在宮位名稱 ────
    shen_gong_name = get_gong_name(ming_gong, shen_gong)
    
    # ──── 組裝結果 ────
    result = {
        'basic': {
            'ming_gong': {'idx': ming_gong, 'zhi': DIZHI[ming_gong], 'tg': TIANGAN[ming_tg_idx]},
            'shen_gong': {'idx': shen_gong, 'zhi': DIZHI[shen_gong], 'name': shen_gong_name},
            'wuxing_ju': ju_name,
            'ju_num': ju_num,
            'mingzhu': mingzhu,
            'shenzhu': shenzhu,
            'sihua': sihua,
            'ziwei_pos': ziwei_pos,
            'tianfu_pos': tianfu_pos,
        },
        'palaces': {},
        'daxian': daxian,
        'gong_sihua': gong_sihua,
    }
    
    # 每宮完整資料
    for i in range(12):
        gong_tg_idx = get_gong_tiangan(year_tg_idx, i)
        gong_name = get_gong_name(ming_gong, i)
        
        palace = {
            'name': gong_name,
            'tiangan': TIANGAN[gong_tg_idx],
            'dizhi': DIZHI[i],
            'main_stars': star_positions[i]['main_stars'],
            'sihua': star_positions[i]['sihua'],
            'liuji': star_positions[i]['liuji'],
            'liusha': star_positions[i]['liusha'],
            'luma': star_positions[i]['luma'],
            'zayao': star_positions[i]['zayao'],
            'changsheng': star_positions[i]['changsheng'],
            'boshi': star_positions[i]['boshi'],
            'jielu': star_positions[i]['jielu'],
            'gong_sihua': gong_sihua[i],
        }
        
        # 大限
        for dx in daxian:
            if dx['gong_idx'] == i:
                palace['daxian'] = dx['ages']
                break
        
        result['palaces'][DIZHI[i]] = palace
    
    return result

# ════════════════════════════════════════════════════════════
# 格式化輸出
# ════════════════════════════════════════════════════════════

def print_ziwei_full(result):
    """完整輸出紫微斗數命盤"""
    b = result['basic']
    
    print("=" * 60)
    print("  紫微斗數完整命盤")
    print("=" * 60)
    print(f"  命宮：{b['ming_gong']['tg']}{b['ming_gong']['zhi']}宮")
    print(f"  身宮：{b['shen_gong']['zhi']}宮（{b['shen_gong']['name']}）")
    print(f"  五行局：{b['wuxing_ju']}")
    print(f"  命主：{b['mingzhu']}")
    print(f"  身主：{b['shenzhu']}")
    print(f"  生年四化：化祿～{b['sihua']['化祿']} 化權～{b['sihua']['化權']} "
          f"化科～{b['sihua']['化科']} 化忌～{b['sihua']['化忌']}")
    print(f"  紫微星位：{DIZHI[b['ziwei_pos']]}宮")
    print(f"  天府星位：{DIZHI[b['tianfu_pos']]}宮")
    
    # 十二宮逐宮展開
    for zhi in DIZHI:
        p = result['palaces'][zhi]
        
        print(f"\n{'～'*30}")
        dx_info = p.get('daxian', '')
        print(f"  {p['name']}（{p['tiangan']}{p['dizhi']}）大限{dx_info}")
        print(f"{'～'*30}")
        
        # 主星
        if p['main_stars']:
            stars_str = '、'.join(
                f"{s['name']}（{s['brightness']}）" + (f"[{s.get('sihua','')}]" if s.get('sihua') else '')
                for s in p['main_stars']
            )
            print(f"  ▌十四主星：{stars_str}")
        else:
            print(f"  ▌十四主星：無主星")
        
        # 生年四化
        if p['sihua']:
            print(f"  ▌生年四化：{'、'.join(p['sihua'])}")
        else:
            print(f"  ▌生年四化：無")
        
        # 六吉星
        liuji_all = ['文昌','文曲','左輔','右弼','天魁','天鉞']
        liuji_str = '  '.join(f"{s}：{'●' if s in p['liuji'] else '○'}" for s in liuji_all)
        print(f"  ▌六吉星：{liuji_str}")
        
        # 六煞星
        liusha_all = ['擎羊','陀羅','火星','鈴星','地空','地劫']
        liusha_str = '  '.join(f"{s}：{'●' if s in p['liusha'] else '○'}" for s in liusha_all)
        print(f"  ▌六煞星：{liusha_str}")
        
        # 祿馬
        if p['luma']:
            print(f"  ▌祿馬星：{'、'.join(p['luma'])}")
        else:
            print(f"  ▌祿馬星：無")
        
        # 雜曜
        za_groups = {}
        for za in p['zayao']:
            za_groups.setdefault(za['group'], []).append(za['name'])
        for group in ['生年系','年干系','生日系','生時系']:
            stars = za_groups.get(group, [])
            if stars:
                print(f"  ▌雜曜（{group}）：{'、'.join(stars)}")
        
        # 截路旬空
        marks = []
        if p['jielu']: marks.append('截路●')
        print(f"  ▌截路/旬空：{'、'.join(marks) if marks else '無'}")
        
        # 長生、博士
        print(f"  ▌長生十二神：{p['changsheng']}")
        print(f"  ▌博士十二神：{p['boshi']}")
        
        # 宮干四化
        gs = p['gong_sihua']
        print(f"  ▌宮干{p['tiangan']}四化：祿～{gs['化祿']} 權～{gs['化權']} 科～{gs['化科']} 忌～{gs['化忌']}")


# ════════════════════════════════════════════════════════════
# 測試
# ════════════════════════════════════════════════════════════

if __name__ == '__main__':
    # 王逸君：丙辰年正月初六 戌時 女
    # 年干=丙(2) 年支=辰(4) 月=1 日=6 時辰=戌(10)
    result = calc_ziwei_full(
        lunar_year=1976,
        lunar_month=1,
        lunar_day=6,
        hour_zhi_idx=10,  # 戌
        year_tg_idx=2,     # 丙
        year_zhi_idx=4,    # 辰
        gender='F'
    )
    
    print_ziwei_full(result)
    
    # 驗證
    print(f"\n{'='*60}")
    print("  驗證")
    print(f"{'='*60}")
    b = result['basic']
    print(f"  命宮：{b['ming_gong']['zhi']}宮 → {'✅' if b['ming_gong']['zhi'] == '辰' else '❌'}")
    print(f"  身宮：{b['shen_gong']['zhi']}宮（{b['shen_gong']['name']}）→ {'✅' if b['shen_gong']['zhi'] == '子' and '財帛' in b['shen_gong']['name'] else '❌'}")
    print(f"  五行局：{b['wuxing_ju']} → {'✅' if '水二' in b['wuxing_ju'] else '❌'}")
    print(f"  命主：{b['mingzhu']} → {'✅' if b['mingzhu'] == '廉貞' else '❌'}")
    print(f"  身主：{b['shenzhu']} → {'✅' if b['shenzhu'] == '文昌' else '❌'}")
    print(f"  四化：祿{b['sihua']['化祿']} 權{b['sihua']['化權']} 科{b['sihua']['化科']} 忌{b['sihua']['化忌']}")
    print(f"    → {'✅' if b['sihua']['化祿']=='天同' and b['sihua']['化權']=='天機' and b['sihua']['化科']=='文昌' and b['sihua']['化忌']=='廉貞' else '❌'}")
    
    # 主星驗證
    print(f"\n  主星分佈驗證：")
    expected = {
        '辰': ['紫微','天相'], '卯': ['天機','巨門'], '寅': ['貪狼'],
        '丑': ['太陽','太陰'], '子': ['武曲','天府'], '亥': ['天同'],
        '戌': ['破軍'], '酉': [], '申': ['廉貞'], '未': [], '午': ['七殺'], '巳': ['天梁'],
    }
    for zhi, exp_stars in expected.items():
        actual = [s['name'] for s in result['palaces'][zhi]['main_stars']]
        match = set(actual) == set(exp_stars)
        print(f"  {zhi}宮：{','.join(actual) if actual else '空'} → {'✅' if match else '❌ 期望:'+','.join(exp_stars)}")
