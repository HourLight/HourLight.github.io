#!/usr/bin/env python3
"""
馥靈之鑰｜十系統統一計算引擎 v2.0
一個檔案，輸入生日→十系統全部自動跑完
包含：農曆自動轉換、時區辨識、時辰判斷

2026-03-04
版權所有：馥靈之鑰國際有限公司（Hour Light International Co., Ltd.）
本程式為核心營業秘密，禁止外洩
"""

import swisseph as swe
import math, json, sys
from datetime import date, datetime, timedelta
from lunardate import LunarDate
from timezonefinder import TimezoneFinder
import pytz

swe.set_ephe_path('')
tf_finder = TimezoneFinder()

# ════════════════════════════════════════════════════════════
# 共用工具
# ════════════════════════════════════════════════════════════

TIANGAN = '甲乙丙丁戊己庚辛壬癸'
DIZHI = '子丑寅卯辰巳午未申酉戌亥'

def reduce(n):
    """化簡，保留大師數11/22/33"""
    if isinstance(n, float): n = int(n)
    n = abs(n)
    if n in (11,22,33): return n
    while n > 9:
        n = sum(int(d) for d in str(n))
        if n in (11,22,33): return n
    return n

def reduce_plain(n):
    """化簡，不保留大師數"""
    if isinstance(n, float): n = int(n)
    n = abs(n)
    while n > 9:
        n = sum(int(d) for d in str(n))
    return n

def get_shichen_idx(hour):
    """小時→時辰索引（子=0 丑=1 ... 亥=11）"""
    if hour == 23: return 0
    return ((hour + 1) // 2) % 12

def get_shichen(hour):
    return DIZHI[get_shichen_idx(hour)]

# ════════════════════════════════════════════════════════════
# 自動轉換工具
# ════════════════════════════════════════════════════════════

def solar_to_lunar(year, month, day):
    """陽曆→農曆自動轉換"""
    lunar = LunarDate.fromSolarDate(year, month, day)
    return {
        'year': lunar.year,
        'month': lunar.month,
        'day': lunar.day,
        'year_tg_idx': (lunar.year - 4) % 10,
        'year_zhi_idx': (lunar.year - 4) % 12,
    }

def get_timezone_offset(lat, lon, dt_obj):
    """經緯度→時區偏移（小時）"""
    tz_str = tf_finder.timezone_at(lat=lat, lng=lon)
    if not tz_str:
        return 8.0  # 預設台灣
    tz = pytz.timezone(tz_str)
    offset = tz.utcoffset(dt_obj).total_seconds() / 3600
    return offset

# ════════════════════════════════════════════════════════════
# ① 八字引擎（修正版）
# ════════════════════════════════════════════════════════════

WUXING_TG = dict(zip(TIANGAN, '木木火火土土金金水水'))
CANGGAN = {
    '子':['癸'],'丑':['己','癸','辛'],'寅':['甲','丙','戊'],'卯':['乙'],
    '辰':['戊','乙','癸'],'巳':['丙','庚','戊'],'午':['丁','己'],'未':['己','丁','乙'],
    '申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],'亥':['壬','甲']
}

NAYIN_TABLE = [
    '海中金','爐中火','大林木','路旁土','劍鋒金','山頭火',
    '澗下水','城頭土','白蠟金','楊柳木','泉中水','屋上土',
    '霹靂火','松柏木','長流水','沙中金','山下火','平地木',
    '壁上土','金箔金','覆燈火','天河水','大驛土','釵環金',
    '桑柘木','大溪水','沙中土','天上火','石榴木','大海水',
]

def calc_bazi(year, month, day, hour, minute=0, gender='F'):
    """八字四柱計算（修正版：日柱基準2000/1/7甲子日）"""
    # 年柱（以立春為界，近似2/4）
    is_before_lichun = (month < 2) or (month == 2 and day < 4)
    y = year - 1 if is_before_lichun else year
    yi = (y - 4) % 60
    y_tg_idx = yi % 10
    y_zhi_idx = yi % 12
    y_tg, y_dz = TIANGAN[y_tg_idx], DIZHI[y_zhi_idx]

    # 月柱（以節氣為界）
    JIEQI_BOUNDS = [
        (2, 4), (3, 6), (4, 5), (5, 6), (6, 6), (7, 7),
        (8, 8), (9, 8), (10, 8), (11, 7), (12, 7), (1, 6)
    ]
    if (month == 1 and day < 6) or (month == 12 and day >= 7): m_num = 11  # 子月
    elif month == 1 or (month == 2 and day < 4): m_num = 12  # 丑月
    elif month == 2 or (month == 3 and day < 6): m_num = 1   # 寅月
    elif month == 3 or (month == 4 and day < 5): m_num = 2   # 卯月
    elif month == 4 or (month == 5 and day < 6): m_num = 3   # 辰月
    elif month == 5 or (month == 6 and day < 6): m_num = 4   # 巳月
    elif month == 6 or (month == 7 and day < 7): m_num = 5   # 午月
    elif month == 7 or (month == 8 and day < 8): m_num = 6   # 未月
    elif month == 8 or (month == 9 and day < 8): m_num = 7   # 申月
    elif month == 9 or (month == 10 and day < 8): m_num = 8  # 酉月
    elif month == 10 or (month == 11 and day < 7): m_num = 9 # 戌月
    elif month == 11 or (month == 12 and day < 7): m_num = 10 # 亥月
    else: m_num = 11

    # 月干
    m_tg_base = (y_tg_idx % 5) * 2 + 2
    m_tg_idx = (m_tg_base + m_num - 1) % 10
    m_zhi_idx = (m_num + 1) % 12
    m_tg, m_dz = TIANGAN[m_tg_idx], DIZHI[m_zhi_idx]

    # 日柱（修正：基準日2000/1/7=甲子日）
    BASE_DATE = date(2000, 1, 7)
    target = date(year, month, day)
    diff = (target - BASE_DATE).days
    d_tg_idx = diff % 10
    d_zhi_idx = diff % 12
    d_tg, d_dz = TIANGAN[d_tg_idx], DIZHI[d_zhi_idx]

    # 時柱
    zhi_idx = get_shichen_idx(hour)
    h_tg_base = (d_tg_idx % 5) * 2
    h_tg_idx = (h_tg_base + zhi_idx) % 10
    h_tg, h_dz = TIANGAN[h_tg_idx], DIZHI[zhi_idx]

    # 日柱六十甲子索引
    day_gz_idx = diff % 60

    # 納音
    def nayin(tg_i, dz_i):
        for i in range(60):
            if i % 10 == tg_i and i % 12 == dz_i:
                return NAYIN_TABLE[i // 2 % 30]
        return ''

    # 十神
    def shishen(day_tg, other_tg):
        d_wx = WUXING_TG[day_tg]
        o_wx = WUXING_TG[other_tg]
        d_yin = TIANGAN.index(day_tg) % 2
        o_yin = TIANGAN.index(other_tg) % 2
        same_yin = (d_yin == o_yin)
        wx_order = '木火土金水'
        di = wx_order.index(d_wx)
        oi = wx_order.index(o_wx)
        rel = (oi - di) % 5
        names = {
            0: ('比肩','劫財'), 1: ('傷官','食神'),
            2: ('偏財','正財'), 3: ('七殺','正官'), 4: ('偏印','正印')
        }
        return names[rel][0 if same_yin else 1]

    # 五行統計
    all_tg = [y_tg, m_tg, d_tg, h_tg]
    all_dz = [y_dz, m_dz, d_dz, h_dz]
    all_wx = [WUXING_TG[t] for t in all_tg]
    for dz in all_dz:
        for cg in CANGGAN[dz]:
            all_wx.append(WUXING_TG[cg])
    total = len(all_wx)
    wx_pct = {w: round(all_wx.count(w)/total*100) for w in '木火土金水'}

    # 格局
    month_ling = WUXING_TG[CANGGAN[m_dz][0]]
    day_wx = WUXING_TG[d_tg]

    # 大運
    is_yang = (y_tg_idx % 2 == 0)
    forward = (is_yang and gender == 'M') or (not is_yang and gender == 'F')
    dayun = []
    for i in range(1, 11):
        if forward:
            gi = (m_tg_idx + i) % 10
            zi = (m_zhi_idx + i) % 12
        else:
            gi = (m_tg_idx - i) % 10
            zi = (m_zhi_idx - i) % 12
        start = i * 10 - 9
        dayun.append(f'{start}-{start+9}歲 {TIANGAN[gi]}{DIZHI[zi]}')

    # 流年
    cy = 2026
    cy_idx = (cy - 4) % 60
    liunian = TIANGAN[cy_idx%10] + DIZHI[cy_idx%12]

    return {
        'pillars': {
            '年柱': f'{y_tg}{y_dz}（{nayin(y_tg_idx, y_zhi_idx)}）',
            '月柱': f'{m_tg}{m_dz}（{nayin(m_tg_idx, m_zhi_idx)}）',
            '日柱': f'{d_tg}{d_dz}（{nayin(d_tg_idx, d_zhi_idx)}）',
            '時柱': f'{h_tg}{h_dz}（{nayin(h_tg_idx, zhi_idx)}）',
        },
        'day_master': f'{d_tg}（{day_wx}）',
        'canggan': {
            '年支': [(c, shishen(d_tg,c)) for c in CANGGAN[y_dz]],
            '月支': [(c, shishen(d_tg,c)) for c in CANGGAN[m_dz]],
            '日支': [(c, shishen(d_tg,c)) for c in CANGGAN[d_dz]],
            '時支': [(c, shishen(d_tg,c)) for c in CANGGAN[h_dz]],
        },
        'shishen': {
            '年干': shishen(d_tg, y_tg),
            '月干': shishen(d_tg, m_tg),
            '時干': shishen(d_tg, h_tg),
        },
        'wuxing_pct': wx_pct,
        'month_ling': month_ling,
        'dayun': dayun,
        'liunian_2026': liunian,
        'day_gz_idx': day_gz_idx,
        '_y_tg_idx': y_tg_idx,
        '_y_zhi_idx': y_zhi_idx,
    }

# ════════════════════════════════════════════════════════════
# ②③④⑤ 占星/人類圖/七政四餘（從 master_calc_engine 匯入）
# ════════════════════════════════════════════════════════════

# 以下引用 master_calc_engine.py 中已建好的函數
# 在正式版中會整合在同一檔案
# 此處用 import 避免重複

sys.path.insert(0, '/home/claude')
from master_calc_engine import (
    calc_astro, calc_humandesign, calc_qizheng,
    calc_maya, calc_numerology,
    calc_fuling_code, calc_life_triangle, calc_fuling_triangle,
)

# ════════════════════════════════════════════════════════════
# ② 紫微斗數（從完整引擎匯入）
# ════════════════════════════════════════════════════════════

from ziwei_full_engine import calc_ziwei_full, print_ziwei_full

# ════════════════════════════════════════════════════════════
# 主控台
# ════════════════════════════════════════════════════════════

def run_all(solar_year, solar_month, solar_day, hour, minute,
            gender='F', birthplace='台灣桃園',
            birthplace_lat=24.9936, birthplace_lon=121.3169,
            id_number=''):
    """
    十系統統一計算主程式

    只需要輸入：
    ► 陽曆年月日
    ► 出生時間（時:分）
    ► 性別
    ► 出生地（或經緯度）

    農曆自動轉換、時辰自動判斷、時區自動辨識
    """

    # ──── 自動轉換 ────
    lunar = solar_to_lunar(solar_year, solar_month, solar_day)
    shichen = get_shichen(hour)
    shichen_idx = get_shichen_idx(hour)

    print(f"\n{'═'*60}")
    print(f"  馥靈之鑰｜十系統統一計算引擎 v2.0")
    print(f"{'═'*60}")
    print(f"  陽曆：{solar_year}年{solar_month}月{solar_day}日 {hour}:{minute:02d}")
    print(f"  農曆：{TIANGAN[lunar['year_tg_idx']]}{DIZHI[lunar['year_zhi_idx']]}年"
          f"{lunar['month']}月{lunar['day']}日（{shichen}時）")
    print(f"  性別：{'女' if gender=='F' else '男'}")
    print(f"  出生地：{birthplace}（{birthplace_lat}°N, {birthplace_lon}°E）")
    print(f"{'═'*60}\n")

    results = {}

    # ════════ ① 八字 ════════
    print("━" * 60)
    print("  ① 八字（子平命理）")
    print("━" * 60)
    bazi = calc_bazi(solar_year, solar_month, solar_day, hour, minute, gender)
    results['八字'] = bazi
    for k, v in bazi['pillars'].items():
        print(f"  ► {k}：{v}")
    print(f"  ► 日主：{bazi['day_master']}")
    print(f"  ► 五行：木{bazi['wuxing_pct']['木']}% 火{bazi['wuxing_pct']['火']}% "
          f"土{bazi['wuxing_pct']['土']}% 金{bazi['wuxing_pct']['金']}% 水{bazi['wuxing_pct']['水']}%")
    print(f"  ► 十神：年干{bazi['shishen']['年干']} 月干{bazi['shishen']['月干']} 時干{bazi['shishen']['時干']}")
    print(f"  ► 月令：{bazi['month_ling']}")
    print(f"  ► 2026流年：{bazi['liunian_2026']}")
    print(f"  ► 大運：")
    for d in bazi['dayun']:
        print(f"    {d}")
    print()

    # ════════ ② 紫微斗數 ════════
    print("━" * 60)
    print("  ② 紫微斗數")
    print("━" * 60)
    ziwei = calc_ziwei_full(
        lunar_year=lunar['year'],
        lunar_month=lunar['month'],
        lunar_day=lunar['day'],
        hour_zhi_idx=shichen_idx,
        year_tg_idx=lunar['year_tg_idx'],
        year_zhi_idx=lunar['year_zhi_idx'],
        gender=gender,
    )
    results['紫微斗數'] = ziwei
    print_ziwei_full(ziwei)
    print()

    # ════════ ③ 西洋占星 ════════
    print("━" * 60)
    print("  ③ 西洋占星")
    print("━" * 60)
    astro = calc_astro(solar_year, solar_month, solar_day, hour, minute, birthplace_lat, birthplace_lon)
    results['西洋占星'] = astro
    for name in ['太陽','月亮','水星','金星','火星','木星','土星','天王星','海王星','冥王星','凱龍星','北交點']:
        p = astro['planets'].get(name)
        if p:
            retro = ' ℞' if p.get('retrograde') else ''
            house = f" 第{p['house']}宮" if 'house' in p else ''
            print(f"  ► {name}：{p['sign']}{p['deg']}°{p['min']}'{house}{retro}")
    print(f"  ► 上升：{astro['asc']['sign']}{astro['asc']['deg']}°{astro['asc']['min']}'")
    print(f"  ► 天頂：{astro['mc']['sign']}{astro['mc']['deg']}°{astro['mc']['min']}'")
    print(f"  ► 元素：火{astro['elements']['火']} 土{astro['elements']['土']} "
          f"風{astro['elements']['風']} 水{astro['elements']['水']}")
    print(f"  ► 模式：基本{astro['modes']['基本']} 固定{astro['modes']['固定']} 變動{astro['modes']['變動']}")
    print(f"  ► 主要相位（{len(astro['aspects'])}個）：")
    for asp in astro['aspects'][:15]:
        print(f"    {asp['p1']} {asp['type']} {asp['p2']}（容許{asp['orb']}°）")
    print()

    # ════════ ④ 人類圖 ════════
    print("━" * 60)
    print("  ④ 人類圖")
    print("━" * 60)
    hd = calc_humandesign(solar_year, solar_month, solar_day, hour, minute, birthplace_lat, birthplace_lon)
    results['人類圖'] = hd
    print(f"  ► 類型：{hd['type']}")
    print(f"  ► 策略：{hd['strategy']}")
    print(f"  ► 內在權威：{hd['authority']}")
    print(f"  ► 人生角色：{hd['profile']}")
    print(f"  ► 定義：{hd['definition']}")
    print(f"  ► 輪迴交叉：{hd['cross']}")
    print(f"  ► 通道：")
    for ch in hd['channels']:
        print(f"    {ch['gates']}（{ch['name']}）")
    print(f"  ► 已定義中心：{', '.join(hd['defined_centers'])}")
    print(f"  ► 未定義中心：{', '.join(hd['undefined_centers'])}")
    print(f"  ► 個性水晶：")
    for name, val in hd['personality'].items():
        print(f"    {name}：{val}")
    print(f"  ► 設計水晶：")
    for name, val in hd['design'].items():
        print(f"    {name}：{val}")
    print()

    # ════════ ⑤ 七政四餘 ════════
    print("━" * 60)
    print("  ⑤ 七政四餘")
    print("━" * 60)
    qz = calc_qizheng(solar_year, solar_month, solar_day, hour, minute)
    results['七政四餘'] = qz
    for name, data in qz['qizheng'].items():
        print(f"  ► {name}：{data['sign']}（{data['xiu']}）")
    for name, data in qz['siyu'].items():
        if 'degree' in data:
            print(f"  ► {name}：{data['sign']}（{data['xiu']}）")
        else:
            print(f"  ► {name}：{data.get('note','待計算')}")
    print()

    # ════════ ⑥ 瑪雅曆法 ════════
    print("━" * 60)
    print("  ⑥ 瑪雅曆法（Dreamspell）")
    print("━" * 60)
    maya = calc_maya(solar_year, solar_month, solar_day)
    results['瑪雅曆法'] = maya
    print(f"  ► KIN {maya['kin']}：{maya['kin_name']}")
    print(f"  ► 音調：第{maya['tone']}音（{maya['tone_name']}）")
    print(f"  ► 主圖騰：{maya['seal_name']}（Seal {maya['seal']}）")
    print(f"  ► 指引力量：{maya['guide']['seal']}（KIN {maya['guide']['kin']}）")
    print(f"  ► 類比力量（支持）：{maya['analog']['seal']}（KIN {maya['analog']['kin']}）")
    print(f"  ► 對立力量（挑戰）：{maya['antipode']['seal']}（KIN {maya['antipode']['kin']}）")
    print(f"  ► 神秘力量（隱藏）：KIN {maya['occult_kin']}")
    print(f"  ► 波符：第{maya['wavespell']}波符（{maya['ws_seal']}）第{maya['ws_day']}天")
    print(f"  ► 行星家族：{maya['planet']}  身份家族：{maya['family']}家族")
    print(f"  ► Haab太陽曆：{maya['haab']}")
    print(f"  ► 長計數曆：{maya['long_count']}")
    print()

    # ════════ ⑦ 生命靈數 ════════
    print("━" * 60)
    print("  ⑦ 生命靈數")
    print("━" * 60)
    num = calc_numerology(solar_year, solar_month, solar_day)
    results['生命靈數'] = num
    print(f"  ► 生命數：{num['life_number']}")
    print(f"  ► 天賦數：{num['talent_number']}")
    print(f"  ► 年份數：{num['year_number']}  月份數：{num['month_number']}  日期數：{num['day_number']}")
    print(f"  ► 先天數：{''.join(str(d) for d in num['innate'])}")
    print(f"  ► 空缺數：{', '.join(str(m) for m in num['missing']) if num['missing'] else '無'}")
    print(f"  ► 2026個人年：{num['personal_year_2026']}")
    print(f"  ► 挑戰數：第一{num['challenges']['ch1']} 第二{num['challenges']['ch2']} 主{num['challenges']['main']}")
    print()

    # ════════ ⑧ 馥靈秘碼 ════════
    print("━" * 60)
    print("  ⑧ 馥靈秘碼（農曆系統）")
    print("━" * 60)
    fc = calc_fuling_code(lunar['month'], lunar['day'],
                         solar_year, solar_month, solar_day, hour)
    results['馥靈秘碼'] = fc
    h = fc['HOUR']
    l = fc['LIGHT']
    print(f"  ► H.O.U.R.四主數：")
    print(f"    H（身心校準）= {h['H']}")
    print(f"    O（智慧辨識）= {h['O']}")
    print(f"    U（潛能解鎖）= {h['U']}")
    print(f"    R（行動進化）= {h['R']}")
    print(f"  ► L.I.G.H.T.五能量：")
    print(f"    L（愛之力）= {l['L']}")
    print(f"    I（直覺力）= {l['I']}")
    print(f"    G（根基力）= {l['G']}")
    print(f"    H（和諧力）= {l['H']}")
    print(f"    T（蛻變力）= {l['T']}")
    print(f"  ► 12宮位：")
    for k, v in fc['palaces'].items():
        print(f"    {k} = {v}")
    print()

    # ════════ ⑨ 生命數字三角形 ════════
    print("━" * 60)
    print("  ⑨ 生命數字三角形（陽曆系統）")
    print("━" * 60)
    tri = calc_life_triangle(solar_year, solar_month, solar_day)
    results['生命數字三角形'] = tri
    inner = tri['inner']
    outer = tri['outer']
    print(f"  ► 內三角：")
    print(f"    I={inner['I']} J={inner['J']} K={inner['K']} L={inner['L']}")
    print(f"    M（父親基因）={inner['M']} N（母親基因）={inner['N']}")
    print(f"    O（命數）={inner['O']}")
    print(f"  ► 外三角：")
    print(f"    S={outer['S']} T={outer['T']} U={outer['U']}")
    print(f"    V={outer['V']} W={outer['W']} X={outer['X']}")
    print(f"    P={outer['P']} Q={outer['Q']} R={outer['R']}")
    print(f"  ► 潛意識密碼：{tri['subconscious']}")
    print(f"  ► 外心密碼：{tri['external_code']}")
    print()

    # ════════ ⑩ 馥靈三角秘碼 ════════
    print("━" * 60)
    print("  ⑩ 馥靈三角秘碼（身份證字號）")
    print("━" * 60)
    ft = calc_fuling_triangle(id_number)
    results['馥靈三角秘碼'] = ft
    if id_number:
        print(f"  ► 總數：{ft['total']}")
    else:
        print(f"  ► 未提供身份證字號")
    print()

    print(f"{'═'*60}")
    print(f"  十系統計算完成")
    print(f"{'═'*60}")

    return results


# ════════════════════════════════════════════════════════════
# 測試
# ════════════════════════════════════════════════════════════

if __name__ == '__main__':
    results = run_all(
        solar_year=1976, solar_month=2, solar_day=5,
        hour=19, minute=47,
        gender='F',
        birthplace='台灣桃園',
        birthplace_lat=24.9936, birthplace_lon=121.3169,
    )
