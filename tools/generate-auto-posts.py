"""
Generate three-tier FB/Threads auto-post content pools.

Tier A (07:30) — 天使故事鉤子，導流到 angel-story.html?id=XX
Tier B (12:15) — 知識學苑摘要，導流到 knowledge-*.html
Tier C (20:00) — 工具導流，導流到各命理 / 測驗 / 占卜工具

Each post has: { "text": "...", "hashtags": [...], "reply": "..." }
post.js will rotate by (day % pool_length) for each tier.
"""
import json
import sys
import io
import os
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = 'https://hourlightkey.com/'


def load_angels():
    with open('assets/data/angel-stories.json', 'r', encoding='utf-8') as f:
        return json.load(f)


def first_sentence(text, maxlen=60):
    """Take first meaningful sentence, trim cleanly."""
    text = text.replace('\n', '')
    # cut at first natural break
    for sep in ['。', '，', '？', '！']:
        pos = text.find(sep)
        if 0 < pos < maxlen:
            return text[:pos + 1]
    return text[:maxlen] + '...'


def build_angel_posts():
    angels = load_angels()
    posts = []
    for sid, data in angels.items():
        title = data.get('title', '')
        tarot = data.get('tarot', '')
        full = data.get('fullStory', '')
        hook = first_sentence(full, 70)
        text = (
            f"《{title}》\n\n"
            f"{hook}\n\n"
            f"這是馥靈之鑰 52 篇《天使故事》其中一則。每一個故事都從一張牌開始。\n"
            f"讀完整篇 → {BASE}angel-story.html?id={sid}"
        )
        reply = (
            f"抽一張屬於你自己的牌：{BASE}draw-hl.html\n"
            f"52 篇全集：{BASE}angel-stories.html"
        )
        posts.append({
            "id": sid,
            "title": title,
            "text": text,
            "hashtags": ["#馥靈之鑰", "#天使故事", "#塔羅", f"#{tarot}", "#覺察"],
            "reply": reply,
        })
    return posts


def build_knowledge_posts():
    """11 knowledge pages × 3 angles = 33 posts"""
    pages = [
        {
            "file": "knowledge-hub.html",
            "title": "未來美容學苑",
            "angles": [
                {
                    "hook": "美業不只是做美甲、做臉、做 SPA。你每天接觸的客人，身體裡都寫著情緒的地圖。",
                    "body": "8 大主題 × 上千個小知識，從芳療科學、認證指南、調香、元辰宮、兒童芳療、靈氣、護膚、按摩，每一篇都做到學員可以直接拿去上班用的深度。",
                    "tag": "未來美容學苑",
                },
                {
                    "hook": "為什麼做臉的客人會莫名其妙掉眼淚？因為你的手，打開了她封住的情緒。",
                    "body": "美業人不只是技術，是情緒現場的第一線。馥靈之鑰把這件事做成一整套可學、可教、可帶出門的知識系統。",
                    "tag": "身心照顧",
                },
                {
                    "hook": "學芳療不是背精油。是學會怎麼在對的時刻，拿對的工具，陪對的人。",
                    "body": "8 篇主題知識庫，從化學結構到臨床應用，從歷史源頭到現代科學，免費開放全文閱讀。",
                    "tag": "芳療教育",
                },
            ],
        },
        {
            "file": "aromatherapy-science.html",
            "title": "芳療科學基礎",
            "angles": [
                {
                    "hook": "薰衣草讓你放鬆，不是因為它「溫柔」。是因為裡面的沈香醇（linalool）會直接作用在你的 GABA 受體上。",
                    "body": "芳療其實是化學。不懂化學分類，就不會知道為什麼不同廠牌的同一支精油效果天差地遠。",
                    "tag": "芳療科學",
                },
                {
                    "hook": "精油進到身體的方式有三條路：嗅覺、皮膚、黏膜。每一條路的速度都不一樣。",
                    "body": "為什麼嗅覺最快？因為它直達邊緣系統，跳過血腦屏障。這是科學上已經證實的神經路徑。",
                    "tag": "精油吸收",
                },
                {
                    "hook": "GC-MS 是什麼？為什麼好的精油廠都會附這張報告？看不懂這張報告，你等於在買盲盒。",
                    "body": "氣相層析質譜儀，會把精油裡的上百種成分一支一支拆給你看。有沒有被稀釋、主成分比例對不對，一張報告全說了。",
                    "tag": "精油檢測",
                },
            ],
        },
        {
            "file": "certification-guide.html",
            "title": "芳療認證指南",
            "angles": [
                {
                    "hook": "想考芳療認證，台灣看得到的選擇至少有五個：IFA、IFPA、NAHA、IAAMA、CIBTAC。差別到底在哪？",
                    "body": "這篇把五大國際認證的課綱深度、考試形式、年費、續約條件、就業方向全部列成對照表。",
                    "tag": "芳療認證",
                },
                {
                    "hook": "考完 NAHA L1 之後可以做什麼？可以不可以直接接案？這是每個學員都問的問題。",
                    "body": "L1 畢業後的三條進階路線：L2 進階學術、Aromacare 芳香照護師、覺察師變現系統。三條路不一樣。",
                    "tag": "進階規劃",
                },
                {
                    "hook": "芳香照護師 Aromacare 為什麼含金量最高？因為英國協會親自監考，而且已經被 NHS 引入。",
                    "body": "不是所有芳療認證都能走進醫療體系。這張證照可以。",
                    "tag": "照護師",
                },
            ],
        },
        {
            "file": "blending-guide.html",
            "title": "精油調香指南",
            "angles": [
                {
                    "hook": "調香不是把喜歡的精油加在一起。是用六大香氣家族做平衡。",
                    "body": "柑橘、花香、草本、木質、辛香、樹脂，每一家族在配方裡的角色都不一樣。少一家族，整瓶就會缺一個面向。",
                    "tag": "調香",
                },
                {
                    "hook": "四季怎麼調？春天開、夏天收、秋天穩、冬天暖。這不是玄學，是嗅覺邏輯。",
                    "body": "四季配方都附濃度速算跟實際比例，不用再靠感覺。",
                    "tag": "四季配方",
                },
                {
                    "hook": "情緒配方不是隨便加薰衣草。悲傷用什麼、憤怒用什麼、焦慮用什麼，分子結構會給你答案。",
                    "body": "24 組情緒配方，從生理回推到嗅覺神經科學。",
                    "tag": "情緒配方",
                },
            ],
        },
        {
            "file": "yuan-chen-guide.html",
            "title": "元辰宮指南",
            "angles": [
                {
                    "hook": "元辰宮不是電影裡那個奇幻房間。它是你潛意識把自己活成什麼樣子的一張快照。",
                    "body": "房間髒亂 → 你在消耗。庭院荒蕪 → 你斷了跟外界的連結。客廳擺設 → 你的社交位置。",
                    "tag": "元辰宮",
                },
                {
                    "hook": "為什麼有些人進元辰宮，看到的是一片海？那不是亂看，那是你的內在在給你訊號。",
                    "body": "房間進階解讀：不同空間對應不同人生議題，對應 130 張牌卡與四主數。",
                    "tag": "元辰宮解讀",
                },
                {
                    "hook": "元辰宮可以透過冥想自己進去，也可以找覺察師帶路。兩種都是正式做法。",
                    "body": "這篇附完整冥想引導腳本，讓你第一次就能進去。",
                    "tag": "冥想引導",
                },
            ],
        },
        {
            "file": "kids-aromatherapy.html",
            "title": "兒童芳療",
            "angles": [
                {
                    "hook": "給小孩用精油，濃度要降到成人的四分之一到十分之一。很多家長沒搞懂這件事。",
                    "body": "2 歲以下有些精油根本不能用。6 歲以下要避開含大量酮類的配方。這些不是迷信，是安全。",
                    "tag": "兒童芳療",
                },
                {
                    "hook": "小孩的情緒用牌卡比用話快。一張圖，他會直接指給你看。",
                    "body": "親子共讀牌卡怎麼用？這篇附 10 組親子活動設計。",
                    "tag": "親子互動",
                },
                {
                    "hook": "嬰兒按摩不是哄睡。是在替他搭建第一個身體記憶的基礎。",
                    "body": "從印度古老的嬰兒按摩傳統，到現代神經科學證實的觸覺發展重要性。",
                    "tag": "嬰兒按摩",
                },
            ],
        },
        {
            "file": "reiki-guide.html",
            "title": "靈氣指南",
            "angles": [
                {
                    "hook": "靈氣不是玄學。它是一套 1922 年從日本發展出來的能量照顧系統，現在全球醫院都在用。",
                    "body": "12 個標準手位對應中醫十二經絡，這篇把對照表攤開來。",
                    "tag": "靈氣",
                },
                {
                    "hook": "為什麼靈氣會被醫院採用？因為至少 7 篇同儕審查的臨床研究證實它對疼痛、焦慮、化療後恢復有幫助。",
                    "body": "研究來源全部附了，你可以自己查。",
                    "tag": "靈氣研究",
                },
                {
                    "hook": "學靈氣要選哪個流派？臼井、西式、水晶，差別在哪？",
                    "body": "選課指南：從授權傳承、課程時數、證書價值到上課場地，一次說清楚。",
                    "tag": "選課",
                },
            ],
        },
        {
            "file": "skincare-science.html",
            "title": "護膚科學",
            "angles": [
                {
                    "hook": "你的膚質不會一輩子不變。季節、壓力、荷爾蒙，每一個都會讓它變。",
                    "body": "五大膚質分類 + 五大成分地圖（A 醇、菸鹼醯胺、玻尿酸、神經醯胺、水楊酸）幫你看懂成分標。",
                    "tag": "護膚",
                },
                {
                    "hook": "季節護膚不是換一瓶乳液。是整套保養節奏要調整。",
                    "body": "春季抗敏、夏季控油、秋季修護、冬季養脂。每個季節的重點成分完全不一樣。",
                    "tag": "季節保養",
                },
                {
                    "hook": "DIY 保養品要小心。不是天然就安全，也不是有機就有效。",
                    "body": "這篇附 8 組安全的 DIY 配方，成分濃度全部標清楚。",
                    "tag": "DIY保養",
                },
            ],
        },
        {
            "file": "massage-guide.html",
            "title": "按摩指南",
            "angles": [
                {
                    "hook": "按摩不只是讓肌肉放鬆。它會改變你的副交感神經、皮質醇、淋巴循環。",
                    "body": "從生理機制拆給你看：為什麼按完會想哭、為什麼按完會想睡、為什麼按完會覺得通體舒暢。",
                    "tag": "按摩科學",
                },
                {
                    "hook": "經絡按摩跟西方按摩差在哪？一個走氣血路線，一個走肌肉解剖。兩個都對。",
                    "body": "這篇把兩套系統的對照表全攤出來，你會看到身體不只一張地圖。",
                    "tag": "經絡vs西方",
                },
                {
                    "hook": "哪些狀況不能按摩？發燒、孕早期、血栓、急性扭傷。這些是禁忌，不是建議。",
                    "body": "按摩禁忌全盤點，附對應的精油配方與替代方案。",
                    "tag": "按摩禁忌",
                },
            ],
        },
        {
            "file": "aroma-garden.html",
            "title": "芳療共享園地",
            "angles": [
                {
                    "hook": "305 組精油配方，從疼痛、情緒、皮膚、呼吸到 DIY 保養，可以直接用的實戰庫。",
                    "body": "免費開放全文，即時搜尋。",
                    "tag": "精油配方",
                },
                {
                    "hook": "25 支核心精油速查表：拉丁學名、萃取方式、主成分、注意事項，一張卡片看完。",
                    "body": "芳療學員必備，也是行動的第一份口袋書。",
                    "tag": "精油速查",
                },
                {
                    "hook": "12 經絡 × 精油 × 情緒對照表，附子午流注時辰。古老的中醫，對上現代的芳療。",
                    "body": "這張對照表是逸君自己整合 30 年實務累積出來的。",
                    "tag": "經絡芳療",
                },
            ],
        },
        {
            "file": "cognitive-aromatherapy-theory.html",
            "title": "認知芳療理論",
            "angles": [
                {
                    "hook": "你不需要手邊有精油，也能感受到那個氣味帶給你的感覺。這句話是認知芳療的起點。",
                    "body": "想到薄荷有沁涼感、想到酸梅會分泌唾液，這就是大腦在做芳療。",
                    "tag": "認知芳療",
                },
                {
                    "hook": "為什麼馥靈之鑰的線上抽牌可以真的有效？因為牌卡觸發了嗅覺記憶，覺察就真的發生了。",
                    "body": "9 章理論 + 9 篇學術引用，把這件事講到完整。",
                    "tag": "線上覺察",
                },
                {
                    "hook": "嗅覺是唯一直接連到邊緣系統的感官。這個神經路徑，科學上已經證實了。",
                    "body": "認知芳療不是玄學，是神經科學。",
                    "tag": "神經科學",
                },
            ],
        },
    ]

    posts = []
    for page in pages:
        for angle in page["angles"]:
            text = (
                f"{angle['hook']}\n\n"
                f"{angle['body']}\n\n"
                f"完整閱讀 → {BASE}{page['file']}"
            )
            reply = f"更多美業知識主題 → {BASE}knowledge-hub.html"
            posts.append({
                "title": page["title"],
                "text": text,
                "hashtags": [
                    "#馥靈之鑰", "#未來美容學苑",
                    f"#{angle['tag']}", "#芳療教育", "#美業",
                ],
                "reply": reply,
            })
    return posts


def build_tool_posts():
    """Tool spotlight posts. Each tool has 1-2 angles."""
    tools = [
        {
            "name": "33 套命理整合引擎",
            "link": "destiny-engine.html",
            "hook": "一次算完 33 套命理系統，從八字、紫微、人類圖、占星、七政四餘、馥靈秘碼到瑪雅曆，全部整合在一張命盤裡。",
            "body": "這是全球唯一一個把 33 套系統做成交叉比對的引擎。座標哲學讓你的人生變成一張可導航的地圖。",
            "tag": "命盤引擎",
        },
        {
            "name": "33 套合盤系統",
            "link": "destiny-match.html",
            "hook": "兩個人到底合不合？問 33 套系統最公平。八字合婚、紫微夫妻宮、人類圖連接線、占星合盤，一次看完。",
            "body": "前 5 套免費開放，後半段鑰友解鎖。",
            "tag": "合盤",
        },
        {
            "name": "130 張原創牌卡",
            "link": "draw-hl.html",
            "hook": "馥靈之鑰 130 張原創智慧牌卡，9 種牌陣從 1 張到 28 張，每一張都對應一支精油、一個身體區域、一段情緒。",
            "body": "1 張永遠免費，不限次。抽一張，看看今天你需要什麼。",
            "tag": "馥靈牌卡",
        },
        {
            "name": "盧恩符文占卜",
            "link": "runes-oracle.html",
            "hook": "24 支古北歐盧恩符文，從西元 2 世紀流傳下來的答案系統。視覺化操作，可以抽 1 張、3 張或 5 張。",
            "body": "附 AI 深度解讀指令，讓 Claude 或 ChatGPT 幫你做完整解讀。",
            "tag": "盧恩",
        },
        {
            "name": "七型內在批判者測驗",
            "link": "quiz-inner-critic.html",
            "hook": "你腦袋裡那個很兇的聲音，叫做內在批判者。它有七種面貌：完美主義者、控制者、工頭、扯後腿、毀滅者、懷罪者、塑形者。",
            "body": "這個測驗會告訴你，你身上最強的是哪兩個。不是要你把它趕走，而是先認識它。",
            "tag": "內在批判",
        },
        {
            "name": "易經卜卦",
            "link": "yijing-oracle.html",
            "hook": "三枚銅錢，六次擲出，一卦 64 種可能。易經不是算命，是在問你「現在身處哪一卦」。",
            "body": "免費開放，附完整爻辭與現代語白話解釋。",
            "tag": "易經",
        },
        {
            "name": "微魔法實驗室",
            "link": "magic-lab.html",
            "hook": "魔法不是變出東西，是改變你看自己的方式。馥靈之鑰把吸引力法則、自我肯定、正念，整合成五個可以每天做的小動作。",
            "body": "晨間咒語深度版已上線，附 7 天挑戰模板。",
            "tag": "微魔法",
        },
        {
            "name": "晨間咒語深度版",
            "link": "magic-morning.html",
            "hook": "每天早上，身體先被聞到，然後才被說話。五個步驟：身體感覺 → 我在這裡 → 今日一句 → 聞一支精油 → 寫一件小事。",
            "body": "這不是儀式感，是 Steele 1988 自我肯定理論的操作版。",
            "tag": "晨間儀式",
        },
        {
            "name": "101 項心理測驗",
            "link": "quiz-hub.html",
            "hook": "MBTI、九型、DISC、Big Five、依附型態、愛之語、PDP、VIA、EQ，再加上馥靈獨家的深潛覺察系列 14 項。",
            "body": "全部免費開放，結果都附 AI 深度解讀指令。",
            "tag": "心理測驗",
        },
        {
            "name": "元辰宮覺察",
            "link": "yuan-chen-reading.html",
            "hook": "元辰宮是你潛意識把自己活成什麼樣子的一張快照。不用進入冥想，透過牌卡就能看到。",
            "body": "AI 深度解讀 NT$599。",
            "tag": "元辰宮",
        },
        {
            "name": "天使卡",
            "link": "angel-oracle.html",
            "hook": "當你什麼都問不出口，就抽一張天使卡。天使不會替你決定，但會讓你想起你自己其實知道答案。",
            "body": "免費不限次。",
            "tag": "天使卡",
        },
        {
            "name": "姓名學解碼",
            "link": "name-oracle.html",
            "hook": "你的名字不只是符號。筆畫、五行、音韻，每一個都在影響你這輩子會被怎麼叫、怎麼被記住。",
            "body": "康熙字典筆畫系統，完整姓名學解碼。",
            "tag": "姓名學",
        },
        {
            "name": "手機號碼能量",
            "link": "phone-oracle.html",
            "hook": "你的手機號碼跟你朝夕相處，它的數字組合會微妙地影響你的能量節奏。",
            "body": "用生命靈數邏輯拆解，看看你的號碼在跟你說什麼。",
            "tag": "號碼能量",
        },
        {
            "name": "擲杯占卜",
            "link": "poe-blocks.html",
            "hook": "不確定該不該做一件事的時候，就擲杯。三次，看結果。",
            "body": "台灣民間最普遍的占卜方式，線上重現。",
            "tag": "擲杯",
        },
        {
            "name": "夢境解碼",
            "link": "dream-decoder.html",
            "hook": "夢不是隨機的。它是你白天沒消化完的情緒、沒說出口的話、沒面對的人。",
            "body": "輸入你的夢境描述，取得榮格式的象徵解讀。",
            "tag": "夢境",
        },
        {
            "name": "馥靈秘碼",
            "link": "fuling-mima.html",
            "hook": "農曆生日＋生命靈數邏輯 ＝ 馥靈秘碼，王逸君原創，全球唯一用農曆算的生命數字系統。",
            "body": "免費開放。輸入農曆生日，取得三組內在數字。",
            "tag": "馥靈秘碼",
        },
        {
            "name": "塔羅抽牌",
            "link": "tarot-draw.html",
            "hook": "78 張塔羅，從大阿爾克那的愚人到世界，從小阿爾克那的四組元素到宮廷牌，一次抽得清楚。",
            "body": "每工具每天免費 3 次，鑰友 10 次，大師無限。",
            "tag": "塔羅",
        },
        {
            "name": "骨牌占卜",
            "link": "bone-casting.html",
            "hook": "從非洲、北歐、拉丁美洲到台灣民間，骨牌是最古老的占卜之一。每一個落點都是訊息。",
            "body": "視覺化拋擲，看你的骨牌如何落定。",
            "tag": "骨牌",
        },
        {
            "name": "鏡像卡占卜",
            "link": "mirror-oracle.html",
            "hook": "鏡子裡的你，跟鏡子外的你，不一樣。鏡像卡讓你看到兩個自己的對話。",
            "body": "榮格陰影理論的視覺化版本。",
            "tag": "鏡像",
        },
        {
            "name": "三角生命密碼",
            "link": "triangle-calculator.html",
            "hook": "身分證字號裡藏著一組三角密碼，它跟你的對外身份、社會使命、工作能量有關。",
            "body": "王逸君原創系統，免費開放。",
            "tag": "三角秘碼",
        },
        {
            "name": "52 篇天使故事全集",
            "link": "angel-stories.html",
            "hook": "每一個故事都從一張塔羅牌開始。52 個角色，52 個轉彎的瞬間。",
            "body": "A00-A21 是原型版本、001-030 是進階版本。讀故事，比看道理更有感覺。",
            "tag": "天使故事",
        },
        {
            "name": "芳療共享園地",
            "link": "aroma-garden.html",
            "hook": "19 個主題區塊，305 組配方，25 支核心精油速查表，12 經絡對照表，免費開放。",
            "body": "不需要學員代碼，進來就能讀。",
            "tag": "芳療學苑",
        },
    ]

    posts = []
    for tool in tools:
        text = (
            f"【{tool['name']}】\n\n"
            f"{tool['hook']}\n\n"
            f"{tool['body']}\n\n"
            f"前往使用 → {BASE}{tool['link']}"
        )
        reply = f"更多工具總覽 → {BASE}index.html"
        posts.append({
            "name": tool["name"],
            "text": text,
            "hashtags": [
                "#馥靈之鑰", f"#{tool['tag']}",
                "#命理", "#覺察", "#自我探索",
            ],
            "reply": reply,
        })
    return posts


def main():
    os.makedirs('docs', exist_ok=True)

    angels = build_angel_posts()
    knowledge = build_knowledge_posts()
    tools = build_tool_posts()

    # Sanity: no em-dashes, no forbidden words
    banned = ['——', '治癒', '療癒', '對頻', '調頻', '顯化']
    for name, pool in [('angel', angels), ('knowledge', knowledge), ('tools', tools)]:
        for i, p in enumerate(pool):
            for b in banned:
                if b in p['text']:
                    print(f'[WARN] {name}[{i}] contains "{b}"')

    with open('docs/auto-post-angel.json', 'w', encoding='utf-8') as f:
        json.dump(angels, f, ensure_ascii=False, indent=2)
    with open('docs/auto-post-knowledge.json', 'w', encoding='utf-8') as f:
        json.dump(knowledge, f, ensure_ascii=False, indent=2)
    with open('docs/auto-post-tools.json', 'w', encoding='utf-8') as f:
        json.dump(tools, f, ensure_ascii=False, indent=2)

    print(f'angel:     {len(angels)} posts')
    print(f'knowledge: {len(knowledge)} posts')
    print(f'tools:     {len(tools)} posts')
    print('done.')


if __name__ == '__main__':
    main()
