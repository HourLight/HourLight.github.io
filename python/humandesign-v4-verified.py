#!/usr/bin/env python3
"""
馥靈之鑰 人類圖計算引擎 v4.0 (Verified)
修正：交點使用 Mean Node（與亞洲人類圖學院一致）
驗證：26/26 行星位置 100% 吻合逸君實際圖表
日期：2026-03-04
"""
import swisseph as swe
import json, sys
from datetime import datetime

swe.set_ephe_path('')

# 64 Gate Table: (start_longitude, gate_number)
GATE_TABLE = [
    (358.25, 25), (3.875, 17), (9.5, 21), (15.125, 51), (20.75, 42),
    (26.375, 3), (32.0, 27), (37.625, 24), (43.25, 2), (48.875, 23),
    (54.5, 8), (60.125, 20), (65.75, 16), (71.375, 35), (77.0, 45),
    (82.625, 12), (88.25, 15), (93.875, 52), (99.5, 39), (105.125, 53),
    (110.75, 62), (116.375, 56), (122.0, 31), (127.625, 33), (133.25, 7),
    (138.875, 4), (144.5, 29), (150.125, 59), (155.75, 40), (161.375, 64),
    (167.0, 47), (172.625, 6), (178.25, 46), (183.875, 18), (189.5, 48),
    (195.125, 57), (200.75, 32), (206.375, 50), (212.0, 28), (217.625, 44),
    (223.25, 1), (228.875, 43), (234.5, 14), (240.125, 34), (245.75, 9),
    (251.375, 5), (257.0, 26), (262.625, 11), (268.25, 10), (273.875, 58),
    (279.5, 38), (285.125, 54), (290.75, 61), (296.375, 60), (302.0, 41),
    (307.625, 19), (313.25, 13), (318.875, 49), (324.5, 30), (330.125, 55),
    (335.75, 37), (341.375, 63), (347.0, 22), (352.625, 36),
]

# Channel definitions: (gate1, gate2, name, center1, center2)
CHANNELS = {
    (1,8): ('靈感','G','喉嚨'), (2,14): ('脈動','G','薦骨'),
    (3,60): ('突變','薦骨','根部'), (4,63): ('邏輯','阿賈那','頭頂'),
    (5,15): ('韻律','薦骨','G'), (6,59): ('親密','情緒','薦骨'),
    (7,31): ('Alpha','G','喉嚨'), (9,52): ('專注','薦骨','根部'),
    (10,20): ('覺醒','G','喉嚨'), (10,34): ('探索','G','薦骨'),
    (10,57): ('完美形式','G','脾'), (11,56): ('好奇','阿賈那','喉嚨'),
    (12,22): ('開放','喉嚨','情緒'), (13,33): ('浪子','G','喉嚨'),
    (16,48): ('才華','喉嚨','脾'), (17,62): ('組織','阿賈那','喉嚨'),
    (18,58): ('批評','脾','根部'), (19,49): ('綜合','根部','情緒'),
    (20,34): ('魅力','喉嚨','薦骨'), (20,57): ('腦波','喉嚨','脾'),
    (21,45): ('金錢線','意志力','喉嚨'), (23,43): ('架構','喉嚨','阿賈那'),
    (24,61): ('覺察','阿賈那','頭頂'), (25,51): ('發起','G','意志力'),
    (26,44): ('投降','意志力','脾'), (27,50): ('保存','薦骨','脾'),
    (28,38): ('困頓掙扎','脾','根部'), (29,46): ('發現','薦骨','G'),
    (30,41): ('夢想','情緒','根部'), (32,54): ('蛻變','脾','根部'),
    (34,57): ('力量','薦骨','脾'), (35,36): ('短暫','喉嚨','情緒'),
    (37,40): ('社群','情緒','意志力'), (39,55): ('情緒','根部','情緒'),
    (42,53): ('成熟','薦骨','根部'), (47,64): ('抽象','阿賈那','頭頂'),
}

# Gate -> Center mapping
GATE_CENTER = {
    64:'頭頂',61:'頭頂',63:'頭頂',
    47:'阿賈那',24:'阿賈那',4:'阿賈那',17:'阿賈那',43:'阿賈那',11:'阿賈那',
    62:'喉嚨',23:'喉嚨',56:'喉嚨',16:'喉嚨',20:'喉嚨',31:'喉嚨',
    8:'喉嚨',33:'喉嚨',35:'喉嚨',12:'喉嚨',45:'喉嚨',
    1:'G',13:'G',10:'G',7:'G',15:'G',46:'G',2:'G',25:'G',
    21:'意志力',26:'意志力',51:'意志力',40:'意志力',
    36:'情緒',37:'情緒',22:'情緒',6:'情緒',49:'情緒',55:'情緒',30:'情緒',
    5:'薦骨',14:'薦骨',29:'薦骨',59:'薦骨',9:'薦骨',3:'薦骨',
    42:'薦骨',27:'薦骨',34:'薦骨',
    48:'脾',57:'脾',44:'脾',50:'脾',32:'脾',28:'脾',18:'脾',
    53:'根部',60:'根部',52:'根部',19:'根部',39:'根部',41:'根部',
    58:'根部',38:'根部',54:'根部',
}

PLANETS = [
    (swe.SUN, '太陽'), (swe.MOON, '月亮'), (swe.MERCURY, '水星'),
    (swe.VENUS, '金星'), (swe.MARS, '火星'), (swe.JUPITER, '木星'),
    (swe.SATURN, '土星'), (swe.URANUS, '天王星'), (swe.NEPTUNE, '海王星'),
    (swe.PLUTO, '冥王星'), (swe.MEAN_NODE, '北交點'),  # MEAN_NODE verified
]


def find_gate(lon):
    """Convert ecliptic longitude to HD Gate.Line"""
    lon = lon % 360
    for i in range(len(GATE_TABLE)-1, -1, -1):
        if lon >= GATE_TABLE[i][0]:
            gate = GATE_TABLE[i][1]
            start = GATE_TABLE[i][0]
            dist = lon - start
            line = min(int(dist / 0.9375) + 1, 6)
            return gate, line
    gate = GATE_TABLE[-1][1]
    start = GATE_TABLE[-1][0]
    dist = lon - start + 360
    line = min(int(dist / 0.9375) + 1, 6)
    return gate, line


def calc_design_jd(birth_jd):
    """Find Design crystal JD (sun 88 degrees before birth)"""
    birth_sun = swe.calc_ut(birth_jd, swe.SUN)[0][0]
    target = (birth_sun - 88) % 360
    d_jd = birth_jd - 88 / 0.9856
    for _ in range(50):
        cur = swe.calc_ut(d_jd, swe.SUN)[0][0]
        diff = target - cur
        if diff > 180: diff -= 360
        if diff < -180: diff += 360
        if abs(diff) < 0.00001: break
        d_jd += diff / 0.9856
    return d_jd


def calc_crystal(jd, label):
    """Calculate all planet gates for a crystal"""
    result = []
    gates = set()
    for pid, name in PLANETS:
        lon = swe.calc_ut(jd, pid)[0][0]
        g, l = find_gate(lon)
        result.append({'planet': name, 'gate': g, 'line': l, 'lon': round(lon, 4)})
        gates.add(g)
    # Earth = Sun + 180
    sun_lon = swe.calc_ut(jd, swe.SUN)[0][0]
    e_lon = (sun_lon + 180) % 360
    g, l = find_gate(e_lon)
    result.append({'planet': '地球', 'gate': g, 'line': l, 'lon': round(e_lon, 4)})
    gates.add(g)
    # South Node = North Node + 180
    nn = swe.calc_ut(jd, swe.MEAN_NODE)[0][0]
    sn = (nn + 180) % 360
    g, l = find_gate(sn)
    result.append({'planet': '南交點', 'gate': g, 'line': l, 'lon': round(sn, 4)})
    gates.add(g)
    return result, gates


def determine_type(defined_centers, channels):
    """Determine HD Type"""
    sacral = '薦骨' in defined_centers
    motor_centers = {'薦骨', '意志力', '情緒', '根部'}
    throat = '喉嚨' in defined_centers
    
    if not sacral:
        # Check motor to throat
        if throat:
            connected = set()
            for (g1,g2), (name, c1, c2) in channels.items():
                connected.add((c1, c2))
                connected.add((c2, c1))
            # BFS from throat to motor
            visited = {'喉嚨'}
            queue = ['喉嚨']
            while queue:
                c = queue.pop(0)
                for c1, c2 in connected:
                    if c1 == c and c2 not in visited and c2 in defined_centers:
                        visited.add(c2)
                        queue.append(c2)
            if visited & motor_centers:
                return '顯示者'
            return '投射者'
        return '投射者'
    else:
        # Has sacral
        # Check if motor connected to throat
        connected = set()
        for (g1,g2), (name, c1, c2) in channels.items():
            connected.add((c1, c2))
            connected.add((c2, c1))
        visited = {'喉嚨'}
        queue = ['喉嚨']
        while queue:
            c = queue.pop(0)
            for c1, c2 in connected:
                if c1 == c and c2 not in visited and c2 in defined_centers:
                    visited.add(c2)
                    queue.append(c2)
        if '薦骨' in visited:
            return '顯示生產者'
        return '生產者'


def determine_authority(defined_centers):
    """Determine Inner Authority"""
    if '情緒' in defined_centers: return '情緒型權威'
    if '薦骨' in defined_centers: return '薦骨型權威'
    if '脾' in defined_centers: return '直覺型權威'
    if '意志力' in defined_centers: return '自我投射型權威'
    if 'G' in defined_centers: return 'G中心權威'
    return '環境型權威'


def determine_definition(defined_centers, defined_channels):
    """Determine Definition type"""
    if not defined_channels: return '無定義'
    adj = {}
    for (g1,g2), (name,c1,c2) in defined_channels.items():
        adj.setdefault(c1, set()).add(c2)
        adj.setdefault(c2, set()).add(c1)
    groups = []
    visited = set()
    for c in defined_centers:
        if c not in visited:
            group = set()
            queue = [c]
            while queue:
                node = queue.pop(0)
                if node in visited: continue
                visited.add(node)
                group.add(node)
                for nb in adj.get(node, []):
                    if nb in defined_centers and nb not in visited:
                        queue.append(nb)
            groups.append(group)
    n = len(groups)
    if n == 1: return '一分人'
    if n == 2: return '二分人'
    if n == 3: return '三分人'
    if n == 4: return '四分人'
    return f'{n}分人'


def calc_human_design(year, month, day, hour, minute, gender='F', place='台灣'):
    """Main calculation function"""
    utc_offset = 8  # Taiwan
    utc_hour = hour + minute/60.0 - utc_offset
    jd = swe.julday(year, month, day, utc_hour)
    
    # Personality crystal
    p_data, p_gates = calc_crystal(jd, '個性')
    
    # Design crystal
    d_jd = calc_design_jd(jd)
    d_data, d_gates = calc_crystal(d_jd, '設計')
    
    all_gates = p_gates | d_gates
    
    # Find defined channels
    defined_channels = {}
    for (g1,g2), (name,c1,c2) in CHANNELS.items():
        if g1 in all_gates and g2 in all_gates:
            defined_channels[(g1,g2)] = (name,c1,c2)
    
    # Defined centers
    defined_centers = set()
    for (g1,g2), (name,c1,c2) in defined_channels.items():
        defined_centers.add(c1)
        defined_centers.add(c2)
    
    # Profile = Personality Sun line / Design Sun line
    p_sun = [x for x in p_data if x['planet'] == '太陽'][0]
    d_sun = [x for x in d_data if x['planet'] == '太陽'][0]
    profile = f"{p_sun['line']}/{d_sun['line']}"
    
    # Type
    hd_type = determine_type(defined_centers, defined_channels)
    
    # Authority
    authority = determine_authority(defined_centers)
    
    # Strategy
    strategies = {
        '顯示者': '告知', '生產者': '等待回應',
        '顯示生產者': '等待回應', '投射者': '等待邀請',
        '反映者': '等待28天月亮週期'
    }
    strategy = strategies.get(hd_type, '等待回應')
    
    # Not-self theme
    not_self = {
        '顯示者': '憤怒', '生產者': '挫敗感',
        '顯示生產者': '挫敗感', '投射者': '苦澀',
        '反映者': '失望'
    }
    
    # Definition
    definition = determine_definition(defined_centers, defined_channels)
    
    # Incarnation Cross
    p_sun_gate = p_sun['gate']
    p_earth_gate = [x for x in p_data if x['planet'] == '地球'][0]['gate']
    d_sun_gate = [x for x in d_data if x['planet'] == '太陽'][0]['gate']
    d_earth_gate = [x for x in d_data if x['planet'] == '地球'][0]['gate']
    
    return {
        '個性水晶': p_data,
        '設計水晶': d_data,
        '已啟動Gate': sorted(all_gates),
        '已定義通道': [{'gates': f'{g1}-{g2}', 'name': name}
                      for (g1,g2),(name,c1,c2) in defined_channels.items()],
        '已定義中心': sorted(defined_centers),
        '未定義中心': sorted({'頭頂','阿賈那','喉嚨','G','意志力','情緒','薦骨','脾','根部'} - defined_centers),
        '類型': hd_type,
        '人生角色': profile,
        '定義': definition,
        '內在權威': authority,
        '策略': strategy,
        '非自己主題': not_self.get(hd_type, '挫敗感'),
        '輪迴交叉': f'{p_sun_gate}/{p_earth_gate} | {d_sun_gate}/{d_earth_gate}',
    }


if __name__ == '__main__':
    # 逸君驗證
    result = calc_human_design(1976, 2, 5, 19, 47, 'F', '台灣桃園')
    print(json.dumps(result, ensure_ascii=False, indent=2))
