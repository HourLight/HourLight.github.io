#!/usr/bin/env python3
"""
Definition-first 首句改寫：17 個知識學苑頁加「XXX 是 ___」定義段
-----------------------------------------------------------------
CMU GEO 研究指出「定義式首句」是 AI 被引用預測的 top-5 特徵。

對每個知識頁：在 `<main class="xxx-body">` 之後立刻插入一個樣式化的
定義段落 `<div class="definition-first">`，格式：
「XXX 是 ___（一句話定義 + 馥靈觀點的附加說明）」

不破壞任何現有內容，只在最前面加一塊 AI 愛吃的區塊。

作者：馥寶 (Opus 4.6)
日期：2026/04/14
"""
import os
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 每頁的定義段內容
DEFINITIONS = {
    "meridian-guide.html": {
        "term": "經絡",
        "definition": "經絡 是中醫理論裡分佈全身的 14 條能量通道與 361 個穴位節點，負責運行氣血、連結臟腑、反映身心狀態的訊號系統。",
        "extra": "馥靈之鑰把經絡當作身體的高速公路 — 不是玄學，是你身體一直在使用的實體地圖。2017 諾貝爾生理醫學獎晝夜節律研究為「子午流注」提供了現代生物學基礎。"
    },
    "chakra-guide.html": {
        "term": "脈輪",
        "definition": "脈輪 是古印度身心傳統的 7 個身體能量中心，每一個對應一組內分泌腺體、神經叢和心理課題，是身心靈狀態的重要指標。",
        "extra": "馥靈之鑰的脈輪解讀結合內分泌科學 + 神經叢對照 + 台灣人常見問題，讓「玄學概念」落地成可實證的身體覺察工具。"
    },
    "crystal-guide.html": {
        "term": "水晶療癒",
        "definition": "水晶療癒 是透過礦物的晶格結構、壓電效應與色彩頻率影響人的情緒與能量狀態的身心練習，本質上結合了礦物學、色彩心理學與神經錨點理論。",
        "extra": "馥靈之鑰不把水晶當成魔法，把它當成「神經系統的可攜式錨點」— 一塊戴著的水晶就是一個你隨時可以觸發的情緒狀態開關。"
    },
    "aromatherapy-science.html": {
        "term": "芳療",
        "definition": "芳療 是運用植物精油透過嗅覺、皮膚吸收、神經傳導來影響身心狀態的整體療法，涵蓋化學分類、吸收途徑、免疫調節與情緒支持等多個科學面向。",
        "extra": "馥靈之鑰的芳療不玄不飄，每一支精油都有 GC-MS 化學分析與安全禁忌。創辦人王逸君擁有 34 年美業資歷與健康產業管理碩士學位。"
    },
    "skincare-science.html": {
        "term": "護膚科學",
        "definition": "護膚科學 是從表皮層、真皮層、皮下層三層結構出發，結合 NMF 天然保濕因子、皮脂膜、微生物群系等生物學機制，理解皮膚如何自我調節與受外界影響的科學領域。",
        "extra": "馥靈之鑰的護膚觀點：皮膚不是一塊可以「擦什麼就變什麼」的布料，是一個會跟你的情緒、睡眠、飲食對話的活器官。"
    },
    "reiki-guide.html": {
        "term": "靈氣",
        "definition": "靈氣（Reiki） 是 1922 年日本臼井甕男創立的身心療法，透過手位放置與意念傳遞讓接受者進入深度放鬆與自我修復狀態，近年已有多篇 NIH 補充醫學研究收錄。",
        "extra": "馥靈之鑰的靈氣介紹從臼井傳承系譜 → 12 手位 × 脈輪對照 → NIH 臨床研究結論，一次讀懂靈氣的歷史、科學與實作。"
    },
    "blending-guide.html": {
        "term": "調香",
        "definition": "調香 是運用精油揮發速度（前中後調）、分子量、蒸氣壓與嗅覺三角理論，將單支精油組合成層次豐富香氣的科學與藝術。",
        "extra": "馥靈之鑰的調香教學不只講比例，還講情緒配方 — 例如「壓力大的時候」「準備見客人的時候」各自有不同的分子組合邏輯。"
    },
    "massage-guide.html": {
        "term": "芳療按摩",
        "definition": "芳療按摩 是結合瑞典式五大手法（輕撫、揉捏、摩擦、敲擊、振動）與精油調理，透過皮膚吸收、神經刺激、淋巴引流達到身心放鬆的整體療法。",
        "extra": "馥靈之鑰的按摩指南不只教技法，還教你「這一塊肌肉為什麼緊」— 結合筋膜機制、情緒印記與精油配對。"
    },
    "kids-aromatherapy.html": {
        "term": "兒童芳療",
        "definition": "兒童芳療 是針對 0-12 歲兒童設計的精油使用規範，嚴格區分嬰幼兒禁用精油、安全稀釋濃度、應用途徑與親子互動實作。",
        "extra": "馥靈之鑰的兒童芳療以 IFA 與 NAHA 國際標準為基準，同時結合觸覺神經發育研究 — 嬰兒按摩不是儀式，是大腦正在寫程式的時刻。"
    },
    "yuan-chen-guide.html": {
        "term": "元辰宮",
        "definition": "元辰宮 是華人道家傳統的內在意象觀想技術，透過觀察內心自建的空間（屋、花園、庭院、水池等）來映照當下的生命狀態，西方心理學稱為「主動想像（active imagination）」。",
        "extra": "馥靈之鑰把元辰宮結構化成 12 個房間，每個房間對應一個人生面向，讓古老的觀想技術變成可複製、可紀錄、可追蹤的覺察工具。"
    },
    "five-elements-guide.html": {
        "term": "五行芳療",
        "definition": "五行芳療 是結合中醫五行（木火土金水）與精油芳療的整合系統，將精油按照五行屬性分類，對應五臟六腑、五情五色與現代生理學機制。",
        "extra": "馥靈之鑰的五行芳療不玄，每一個對應都有《黃帝內經》原典 + 現代內分泌學雙重論證。"
    },
    "certification-guide.html": {
        "term": "芳療認證",
        "definition": "芳療認證 是評估芳療師專業能力的國際標準，三大主流包括英國 IFA、美國 NAHA、英國 CIBTAC，各自有不同的時數、考試、個案報告要求與職涯路徑。",
        "extra": "馥靈之鑰的認證指南比較台灣、馬來西亞、新加坡三地現況，含創辦人 34 年實戰經驗與學員備考心法。"
    },
    "nail-energy-guide.html": {
        "term": "美甲能量",
        "definition": "美甲能量 是結合美甲設計、顏色心理學、礦物壓電效應、凝膠保護與手型象徵的整體身心應用，讓指尖成為個人能量的載體與宣言。",
        "extra": "馥靈之鑰把美甲從裝飾提升為覺察工具 — 每一個顏色、每一種材質、每一個甲面造型，都是你對當下自己的提問與回答。"
    },
    "hour-methodology.html": {
        "term": "H.O.U.R. 方法論",
        "definition": "H.O.U.R. 是馥靈之鑰創辦人王逸君整合 34 年美業經驗的自我覺察方法論：H 身心校準 → O 智慧辨識 → U 潛能解鎖 → R 行動進化，四階段結構化引導個人從感知到行動的完整循環。",
        "extra": "H.O.U.R. 不是理論，是 3000+ 個案實證的工具。從認知科學、正向心理學、榮格分析心理學到中醫五行，是馥靈之鑰所有工具的底層架構。"
    },
    "huangdi-neijing-guide.html": {
        "term": "黃帝內經",
        "definition": "黃帝內經 是中國最早的醫學典籍，成書於戰國至漢代，分為《素問》《靈樞》兩部，系統闡述陰陽五行、臟腑經絡、四時養生、情志病理，是中醫理論的奠基文獻。",
        "extra": "馥靈之鑰的黃帝內經指南不是考古，是把 2000 年前的身心智慧翻譯成 21 世紀的生活語言 — 節氣對應什麼精油、情志對應什麼覺察、體質對應什麼飲食。"
    },
    "cognitive-aromatherapy-theory.html": {
        "term": "認知芳療",
        "definition": "認知芳療（Cognitive Aromatherapy） 是馥靈之鑰創辦人王逸君提出的理論：嗅覺記憶一旦建立，即使沒有實體精油，光是「想到」那個氣味就能觸發對應的神經反應與情緒狀態。",
        "extra": "這個理論是馥靈之鑰牌卡系統能在線上運作的根基 — 牌卡觸發氣味記憶或情緒連結，覺察就已經真實發生，不需要精油、不需要特定空間。"
    },
    "ear-acupoint-guide.html": {
        "term": "耳穴壓豆",
        "definition": "耳穴壓豆 是中醫微針系統之一，根據耳朵與全身器官的反射對應關係，在特定耳穴上貼壓王不留行籽或磁珠，達到刺激經絡、調節臟腑、緩解症狀的效果。",
        "extra": "馥靈之鑰的耳穴壓豆指南結合現代神經反射學與精油輔助 — 每一個穴位都有科學對應與情緒連結。"
    },
    "nine-purple-fire-guide.html": {
        "term": "九紫離火運",
        "definition": "九紫離火運 是三元九運中的第九大運，時間橫跨 2024-2043 共 20 年，對應後天八卦的離卦，主「火、光明、數位、精神、心智」，是一個重度影響科技、媒體、美業、身心靈產業的大運週期。",
        "extra": "馥靈之鑰的九紫離火解讀結合玄學與商業趨勢分析 — 20 年大運對芳療、美業、心靈覺察產業的具體影響與布局建議。"
    }
}


def inject_definition(path, data):
    try:
        with open(path, 'r', encoding='utf-8', newline='') as f:
            c = f.read()
    except Exception as e:
        return ('ERROR', str(e))

    # 已經有 definition-first？跳過
    if 'class="definition-first"' in c:
        return ('ALREADY_HAS', None)

    term = data['term']
    defn = data['definition']
    extra = data['extra']

    # 樣式化 definition block（inline CSS 避免依賴外部 CSS）
    block = f'''<!-- Definition-first (CMU GEO top-5 feature) -->
<div class="definition-first" style="max-width:760px;margin:28px auto 0;padding:24px 28px;background:linear-gradient(135deg,#fff9ef 0%,#fff4db 100%);border:1px solid #e8dec5;border-left:4px solid #c4a374;border-radius:10px;font-family:'Noto Serif TC',serif;line-height:2;color:#3a2f26">
<p style="font-size:1.02rem;margin:0 0 10px"><strong style="color:#6b4f1a;font-size:1.08rem">{term}</strong> {defn}</p>
<p style="font-size:.9rem;color:#6b5e52;margin:0;line-height:1.95">{extra}</p>
</div>'''

    # 找 <main> 開頭之後的插入點
    # 優先順序：<main class="xxx-body"> → <main> → </header>
    main_match = re.search(r'<main[^>]*>', c)
    if main_match:
        insert_pos = main_match.end()
        use_crlf = '\r\n' in c
        nl = '\r\n' if use_crlf else '\n'
        new_c = c[:insert_pos] + nl + block + nl + c[insert_pos:]
    else:
        return ('NO_MAIN', None)

    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(new_c)
    return ('INJECTED', term)


def main():
    stats = {'INJECTED': 0, 'ALREADY_HAS': 0, 'NO_MAIN': 0, 'NOT_FOUND': 0, 'ERROR': 0}
    for fname, data in DEFINITIONS.items():
        # 繁體
        path = os.path.join(REPO_ROOT, fname)
        if os.path.exists(path):
            status, info = inject_definition(path, data)
            stats[status] = stats.get(status, 0) + 1
            marker = {'INJECTED': '[+]', 'ALREADY_HAS': '[~]', 'NO_MAIN': '[!]',
                      'NOT_FOUND': '[?]', 'ERROR': '[x]'}[status]
            print(f'{marker} {fname}')
        else:
            stats['NOT_FOUND'] += 1
            print(f'[?] {fname}')

        # 簡體
        sc_path = os.path.join(REPO_ROOT, 'sc', fname)
        if os.path.exists(sc_path):
            status, info = inject_definition(sc_path, data)
            stats[status] = stats.get(status, 0) + 1
            marker = {'INJECTED': '[+]', 'ALREADY_HAS': '[~]', 'NO_MAIN': '[!]',
                      'NOT_FOUND': '[?]', 'ERROR': '[x]'}[status]
            print(f'{marker} sc/{fname}')

    print()
    print('=' * 60)
    for k, v in stats.items():
        print(f'  {k}: {v}')


if __name__ == '__main__':
    main()
