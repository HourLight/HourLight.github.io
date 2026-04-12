"""Generate 5 SEO blog articles (繁體 + 簡體) from content dict."""
import os, sys, io, json
import zhconv

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

ARTICLES = [
    {
        'slug': 'inner-child-healing-guide',
        'title': '內在小孩療傷完整指南｜八種童年角色 × 覺察工具',
        'meta': '內在小孩不是神秘概念，是心理學研究 40 年的真實現象。本文用 Bradshaw 八種童年角色理論，帶你看見那個一直沒長大的部分，並提供三個可立即做的覺察練習。',
        'og_title': '內在小孩療傷完整指南｜八種童年角色',
        'keywords': '內在小孩,童年療傷,家族治療,原生家庭,創傷知情,馥靈之鑰',
        'date': '2026-04-12',
        'intro': '你是不是常常在某些時刻，會突然覺得自己像個小孩。不是可愛的那種，是那種被冷落、被罵、被誤解卻不敢說出口的那種。那個感覺出現的時候，你幾歲其實不重要，因為裡面那個他從來沒真正長大。\n\n他有一個名字，叫內在小孩。這個詞聽起來很軟，但它是 John Bradshaw 在 1988 年系統化提出來的真實心理學概念，背後有四十年的研究。馥靈版的整理不是抄理論，是把理論翻譯成你看得懂、做得到的覺察步驟。',
        'sections': [
            {
                'h2': '為什麼你長大了，心裡還有一個小孩',
                'content': '大腦的記憶不是一本日記，是一個分層結構。我們三歲以前的記憶通常無法被語言提取，但身體記得；六到九歲的記憶會被「情境」鎖在深層，只有相似情境出現才會被啟動；十二歲以後的記憶才會變成「我知道我知道」的那種。\n\n內在小孩就是那些被鎖在深層、還沒被你的成年人自我整合過的部分。他不是另一個人，他是你還沒認領的某一塊。每次你「莫名其妙」情緒化、「不應該那樣反應」的時候，其實都是他在拉你的衣角。\n\n重點是：他不是你的敵人。他是你一個還沒被好好接住的版本。你的工作不是把他治好，是把他接回來。'
            },
            {
                'h2': 'Bradshaw 的八種童年角色，你是哪一種',
                'content': '心理學家 John Bradshaw 發現，每個成年人心裡的那個小孩，通常會落在八種角色之一。這八種不是診斷，是一種方便辨識的地圖。\n\n一、英雄（Hero）：家裡被期待「最棒」「最乖」「最懂事」的那一個。長大後通常是高成就者但內心很累。\n\n二、代罪羔羊（Scapegoat）：家裡出事就被怪的那一個。長大後容易自責，或反過來變得憤怒。\n\n三、隱形小孩（Lost Child）：為了不麻煩大人而把自己縮小的那一個。長大後常常感覺不到自己的存在。\n\n四、吉祥物（Mascot）：用搞笑和幽默分散家庭衝突的那一個。長大後不敢認真。\n\n五、照顧者（Caretaker）：從很小就負責大人情緒的那一個（親職化）。長大後不知道怎麼被照顧。\n\n六、完美主義者（The Perfectionist）：相信「只要夠好就會被愛」的那一個。長大後永遠覺得不夠。\n\n七、反叛者（Rebel）：用不聽話換取存在感的那一個。長大後容易在感情裡用衝突證明愛。\n\n八、消失者（The Disappeared）：為了不受傷乾脆把感覺關掉的那一個。長大後常常覺得「沒感覺」。\n\n你可能不只一種。大部分人是 2-3 種組合。'
            },
            {
                'h2': '你可以立刻做的三個覺察練習',
                'content': '練習一，身體定位：下次你情緒上來、但你知道那個情緒「比事件大」的時候，先停下來問自己「這個感覺我幾歲的時候有過」。不用答對，身體會給你一個年齡的印象。有了那個年齡，你就知道現在在前線的不是 35 歲的你，是那個年紀的你。\n\n練習二，寫信給那個年齡的他：不用長。寫一張紙就好。寫給那個年紀的他，告訴他「你現在安全了」「我會保護你」「那不是你的錯」。寫完你可以撕掉或收起來，重點不是文字，是你第一次當那個小孩的盟友。\n\n練習三，氣味錨定：找一個讓你覺得「被抱住」的氣味。可能是薰衣草、可能是外婆家的老棉被、可能是某種餅乾。每次那個小孩情緒上來的時候，聞一下那個氣味。這叫認知芳療錨定（Olfactory Anchoring），神經科學證實嗅覺跟邊緣系統直接連接，繞過理性的那一層。'
            },
            {
                'h2': '療傷不是一次性的事',
                'content': '內在小孩的療傷不像去醫院包紮。它比較像學一種語言：你需要持續地練習聽他、回應他、不評價他。一開始會覺得假，做多了會變成你的一部分，有一天你會發現你會在生氣之前先停下來問「他現在需要什麼」。\n\n這個變化沒有明確的里程碑，你不會有一天起床覺得「我已經完成了」。但你會慢慢發現，以前那些會讓你情緒爆炸的情境，現在你可以先呼吸一下，再決定怎麼反應。這個「呼吸那一下」就是療傷的成果。\n\n那個小孩不會消失。他會繼續存在，只是他終於有了一個大人可以依靠——就是現在的你。'
            }
        ],
        'faq': [
            {'q': '內在小孩跟自戀是同一件事嗎', 'a': '不是。自戀是把別人當成自我延伸，內在小孩是把自己還沒長大的那部分接回來。一個是向外擴張，一個是向內整合。兩件事的方向相反。'},
            {'q': '我不記得童年，還能做這個覺察嗎', 'a': '可以。記憶不是必要的。你的身體和情緒反應模式本身就是內在小孩的線索。不記得是大腦的保護機制，不是缺陷。'},
            {'q': '這個療傷需要看心理師嗎', 'a': '輕度的內在小孩工作可以自己做，但如果你發現自己有很強的恐慌、解離、或自傷念頭，建議找專業的創傷知情心理師。馥靈提供的是入門的覺察工具，不取代專業協助。危機可撥安心專線 1925。'},
            {'q': '多久會有效果', 'a': '因人而異。有些人做一次練習就會有感，有些人要持續幾個月。療傷的速度跟你對自己的溫柔程度成正比。急著好反而會慢。'}
        ],
        'cta_text': '想知道你腦中那個最常罵你的聲音是誰？',
        'cta_target': 'quiz-inner-critic.html',
        'cta_label': '做內在批判者測驗'
    },
    {
        'slug': 'law-of-attraction-science',
        'title': '吸引力法則的科學解釋｜為什麼有些人想什麼就來什麼',
        'meta': '吸引力法則不是玄學。本文從網狀激發系統（RAS）、目標設定心理學、行為激活三個科學角度解釋為什麼「想」真的會影響「來」，以及如何正確使用這個機制。',
        'og_title': '吸引力法則的科學解釋｜RAS 大腦網狀激發系統',
        'keywords': '吸引力法則,顯化,心想事成,大腦科學,RAS,目標設定,馥靈之鑰',
        'date': '2026-04-12',
        'intro': '吸引力法則在社群上紅了快二十年，但大部分人學完就放棄了，因為「沒用」。真正的原因不是法則是假的，是大部分人學到的版本被簡化到剩下「你想它就會來」，而那個版本不會 work。\n\n這篇我們不講「宇宙會回應」那套話。我們用神經科學、心理學、行為科學三個角度，解釋為什麼「持續想一件事」真的會改變它來不來的機率，以及那個機制到底發生在你的大腦哪一塊。',
        'sections': [
            {
                'h2': '第一層：網狀激發系統 RAS',
                'content': '你腦幹有一個只有鉛筆大小的結構叫網狀激發系統（Reticular Activating System, RAS）。它的工作是過濾訊息。你每秒接收的訊息大概有 1100 萬條，但意識只能處理 40 條。RAS 就是那個決定哪 40 條能進來的守門員。\n\n它怎麼決定？用「你在乎什麼」當標準。這就是為什麼你決定買某個牌子的車之後，突然街上到處都是那個牌子的車——不是突然多了，是你的 RAS 終於開始讓它進來。\n\n吸引力法則的第一層機制就是這個。你每天想一件事，你的 RAS 會把跟那件事有關的訊息往上調。之前忽略的機會、人脈、資訊會突然「跳出來」。不是它們變多了，是你終於看得見了。'
            },
            {
                'h2': '第二層：目標設定心理學',
                'content': '哈佛心理學家 Edwin Locke 和 Gary Latham 研究目標設定四十年，發現一個很穩定的結果：有具體書面目標的人，達成率比沒有的人高 42%。進一步做「心智演練」（mental rehearsal）的人，又比只寫目標的人高 20%。\n\n為什麼？因為大腦無法完全分辨「清晰想像」和「真實發生」的差別。你反覆想像一件事的時候，大腦其實已經在練習它。等到真的機會來臨，你的反應速度和自信度都比沒練習過的人高。\n\n這就是為什麼運動員會做意象訓練。美國奧運代表隊的心理師會要求運動員每晚在腦中跑一遍賽道，研究發現這樣的訓練效果接近實際訓練的 60%。\n\n吸引力法則的第二層機制是這個。想不是魔法，是練習。練習到你身體記得，機會來了你就抓得住。'
            },
            {
                'h2': '第三層：行為激活',
                'content': '前兩層都還是內在的。第三層是最關鍵的：當你的 RAS 讓機會跳出來、當你的大腦已經練習過行動，你會更「敢做」。這叫行為激活（Behavioral Activation）。\n\n沒有寫目標的人遇到機會通常會想「再說吧」「還沒準備好」「下次吧」。寫過目標又練習過的人遇到同樣機會，身體會先動起來。這個差別累積一年、兩年、五年，結果就是完全不同的人生。\n\n所以吸引力法則不是「想就會來」，是「想 → 看見 → 練習 → 敢做 → 真的做了 → 來了」。中間那幾步才是重點。宇宙沒有特別幫你，是你變成一個更準備好的自己。'
            },
            {
                'h2': '怎麼正確使用（三個原則）',
                'content': '一、具體到身體可以感覺：不要說「我要賺更多錢」。說「我要在 2026 年底月薪達到 X 元，我會用那筆錢做 Y 件事」。數字和場景是讓大腦認得的。\n\n二、每天做一次，不用久：每天早上起床後五分鐘，閉上眼睛想一遍那個畫面。感受那個畫面裡的身體狀態，不只是視覺。這是神經科學證實最有效的方式。\n\n三、想完要做一件小事：想完立刻做一件小小的、朝那個方向的事。回一封信、查一個資料、踏出一步。這是把「想」和「做」的神經通路接起來。只想不做的話，大腦會認為想就夠了，真的行動反而變難。'
            }
        ],
        'faq': [
            {'q': '如果想了沒有來怎麼辦', 'a': '通常是兩個原因：想得不夠具體（大腦認不得）或沒做第三步行動（想跟做沒接上）。調整這兩個，九成的人會看到差別。'},
            {'q': '負面的想法也會被吸引嗎', 'a': '會，但機制是 RAS 把負面相關的訊息調高，不是宇宙懲罰你。解方是把注意力主動轉向你要的東西，不是強迫自己不想負面。'},
            {'q': '這跟正念矛盾嗎', 'a': '不矛盾。正念是「在當下」，吸引力法則是「有方向」。兩個可以並存：活在當下，同時朝某個方向。不衝突。'},
            {'q': '沒有具體目標的人怎麼辦', 'a': '先不用逼自己有。每天早上問「今天我想怎麼感覺」就好。感覺也是一種目標，而且比具體事件更根本。'}
        ],
        'cta_text': '把吸引力法則變成你每天的微儀式',
        'cta_target': 'magic-lab.html',
        'cta_label': '進入微魔法實驗室'
    },
    {
        'slug': 'attachment-anxiety-14-day-guide',
        'title': '焦慮型依附 14 天自救手冊｜從科學到日常行動',
        'meta': '56% 成人是安全依附，剩下 44% 是不安全依附。如果你是焦慮型，這份 14 天手冊會帶你從辨認身體反應開始，一步一步走到可以不再因為已讀不回崩潰。',
        'og_title': '焦慮型依附 14 天自救手冊',
        'keywords': '焦慮型依附,依附理論,已讀不回,感情焦慮,Bowlby,自我覺察,馥靈之鑰',
        'date': '2026-04-12',
        'intro': '你有沒有那種時刻：訊息傳出去三分鐘還沒收到回覆，你開始重讀自己剛剛打的字，開始想他是不是生氣了，開始腦補接下來兩小時的所有劇情。那不是你小題大作，那是焦慮型依附被啟動了。\n\n依附理論從 John Bowlby 在 1969 年提出到現在，已經累積幾千篇研究。我們知道成人中大約 56% 是安全依附，其餘 44% 屬於不安全依附，而焦慮型大約佔 19%。如果你看完這段覺得「在說我」，那個啟發性也不用懷疑。這份 14 天手冊不是要把你變成別人，是讓你不再被自己的神經系統綁架。',
        'sections': [
            {
                'h2': '第一週：看見你的模式',
                'content': '第 1 天，認識身體反應：焦慮型依附被啟動的時候，身體會有固定反應。心跳快、胃緊、呼吸變淺、有一種「我要做點什麼」的衝動。今天的作業是當這些反應出現的時候不要做任何事，只是觀察 60 秒。不是要壓下去，是要看見。\n\n第 2-3 天，辨認觸發點：你的焦慮不是平均分布的。有一些情境特別容易觸發，其他情境不會。用兩天的時間記下來每次焦慮被啟動的時間和當下的情境。你會發現一個模式。\n\n第 4-5 天，找到原型：這個焦慮不是憑空出現的。它通常跟你六歲以前某個「被忽略」的經驗有關。不用挖太深，只要問一次：「這個感覺我最早什麼時候有過？」身體會給你一個印象。\n\n第 6-7 天，建立安全基地：你需要一個地方、一個人、或一個物品，讓你的神經系統記得「安全」是什麼感覺。可以是一首歌、一條毯子、一個朋友的名字。當焦慮來的時候，回到這個基地。'
            },
            {
                'h2': '第二週：練習回應不是反應',
                'content': '第 8-9 天，建立延遲：焦慮型依附最大的傷害是「立刻行動」。訊息沒回立刻再傳一則、立刻打電話、立刻想辦法。這兩天的作業是：焦慮起來的時候，強制自己延遲 10 分鐘再做任何事。10 分鐘過後，你會發現大部分的事情不用做。\n\n第 10-11 天，學會自我安撫：不要等別人來安撫你。你要成為那個可以安撫自己的人。方法：左手放胸口，右手放肚子，對自己說「我現在很焦慮，沒關係，我在這裡」。聽起來有點怪，但神經科學證實這個動作會啟動副交感神經。\n\n第 12-13 天，練習「他沒回不等於他不愛」：把這句話寫在紙上貼在你看得到的地方。每次焦慮被啟動的時候先讀這句話，再決定怎麼反應。這叫認知重構，研究顯示持續做兩週會開始有自動化效果。\n\n第 14 天，回顧你的改變：看看這 14 天裡，你比第 1 天鬆開了哪裡。不用很多，能說出一件就夠了。'
            },
            {
                'h2': '長期策略：依附風格可以改變',
                'content': '好消息是：研究顯示約 50% 的不安全依附者可以在五年內轉變成「習得的安全依附」（Earned Secure Attachment）。關鍵有三個。\n\n一、有一段「矯正性經驗」的關係：可能是愛情、友情、治療關係。關鍵是對方穩定、誠實、能夠承接你的情緒而不逃走。這種關係本身就是療傷。\n\n二、持續的自我覺察：不是只做一次手冊。依附風格的改變需要一年以上的持續工作。這份 14 天手冊只是第一層。\n\n三、接受自己不完美的那一面：焦慮型依附不是你的缺陷。它是你小時候為了連結而發展出來的生存策略。你不用把它消滅，你只需要讓它退到後面。有一天你會發現，那個焦慮還在，但它不再開車了。'
            }
        ],
        'faq': [
            {'q': '怎麼知道自己是焦慮型', 'a': '簡單判斷：你在關係裡會因為對方的小訊號（語氣、回訊速度）產生很大的情緒反應，會一直想知道對方在想什麼，會覺得「如果我不主動就會被遺忘」，那很可能是焦慮型。正式評估可以做 ECR-R 量表。'},
            {'q': '如果對方是迴避型怎麼辦', 'a': '焦慮型配迴避型是最難的組合。你越追他越跑，他越跑你越追。解法不是改對方，是雙方都要做自己的工作。如果只有一方願意做，建議先保護自己。'},
            {'q': '我可以自己做還是需要心理師', 'a': '輕度到中度可以自己做。如果你發現焦慮已經影響生活、工作或身體健康，找專業的依附治療師會快很多。'},
            {'q': '這個可以完全治好嗎', 'a': '不是治好，是整合。焦慮型依附的敏感其實是一種天賦，只是被恐懼扭曲了。當恐懼鬆開，那個敏感會變成深度的共感能力，這是很多治療師和創作者的核心資源。'}
        ],
        'cta_text': '看看你的內在批判者可能怎麼在你焦慮時出手',
        'cta_target': 'quiz-inner-critic.html',
        'cta_label': '做內在批判者測驗'
    },
    {
        'slug': 'cognitive-aromatherapy-five-mechanisms',
        'title': '認知芳療五個科學機制｜為什麼想到氣味就有效',
        'meta': '認知芳療不是精神勝利法。本文從嗅覺記憶迴路、邊緣系統捷徑、交叉感覺、預期效應、鏡像神經元五個角度，解釋為什麼「想到」氣味就能啟動神經迴路。',
        'og_title': '認知芳療五個科學機制｜嗅覺記憶迴路解密',
        'keywords': '認知芳療,嗅覺記憶,邊緣系統,神經科學,馥靈之鑰,王逸君',
        'date': '2026-04-12',
        'intro': '我常常被問同一個問題：如果沒有真的聞到精油，光是想，怎麼可能有效？這個問題很合理，因為它挑戰了我們對「生理效應需要物理接觸」的直覺。但從神經科學的角度，答案是——它真的有效，而且有五個不同層次的機制在同時運作。\n\n這篇我們不談行銷話術，只看研究數據。認知芳療（Cognitive Aromatherapy）是馥靈之鑰創辦人王逸君提出的概念，核心主張是：氣味在大腦留下的印記比視覺和聽覺都深，一旦建立，即使不實際聞到，光是回憶或聯想就能啟動對應的神經反應。',
        'sections': [
            {
                'h2': '機制一：嗅覺記憶的神經結構優勢',
                'content': '你的嗅覺神經是唯一不經過視丘（thalamus）就直接連到大腦皮質的感官。其他感官（視覺、聽覺、觸覺、味覺）都要先經過視丘這個「中繼站」，而嗅覺訊號走一條捷徑，直達杏仁核（情緒）和海馬迴（記憶）。\n\n這意味著氣味和情緒、記憶之間沒有「翻譯層」。當你聞到某個味道時，你的情緒和記憶會比任何其他感官都更快被啟動。這就是為什麼一個偶然聞到的味道可以讓你瞬間回到十年前的某個場景，而看到同樣的場景照片不會有那種強度。\n\n因為這條神經通路是如此原始、如此直接，一旦某個氣味跟某個情境綁定，這個綁定會非常持久。甚至不需要實際聞到，光是「想到」那個氣味，大腦就會啟動這條通路的一部分。'
            },
            {
                'h2': '機制二：心智意象的神經重現',
                'content': '2003 年 Bensafi 等人在《Nature Neuroscience》發表的研究發現：當受試者「想像」某個氣味時，他們的主嗅覺皮質和梨狀皮質會出現活化，活化模式跟實際嗅聞時非常相似。不是一模一樣，但重疊區域超過 60%。\n\n這個結果震驚了神經科學界，因為它意味著嗅覺意象不是「比喻的想像」，而是大腦真的在演練嗅覺體驗。你的鼻子沒有聞到任何東西，但你的大腦已經在做類似的事情。\n\n這個機制解釋了為什麼「想到薄荷有涼感」是真的。你大腦的體感皮質收到了嗅覺皮質發出的信號，像收到真實訊號一樣處理了它。涼感不是錯覺，是腦內真實事件。'
            },
            {
                'h2': '機制三：交叉感覺聯結',
                'content': '嗅覺跟其他感官不是各自獨立的，它們會互相引發。研究顯示：當你看一張「紅色辣椒」的照片時，嗅覺皮質會出現微弱但可測的活化。當你聽到「咖啡」兩個字時，嗅覺皮質也會。這叫交叉感覺聯結（Cross-modal Sensory Binding）。\n\n這個機制意味著：你不需要真的聞到才能啟動嗅覺系統。你讀到一段描述氣味的文字（例如馥靈牌卡上的解讀）、看到一張有氣味意象的圖、聽到一個有氣味聯想的詞，都會在你的大腦裡產生微型的嗅覺事件。這些微事件累積起來，可以改變你的情緒狀態。'
            },
            {
                'h2': '機制四：預期效應與安慰劑的神經基礎',
                'content': '2010 年 Ted Kaptchuk 在哈佛做了一個顛覆性的研究：他告訴參與者「這是安慰劑，沒有藥效」，然後給他們服用。結果發現這些人的症狀依然改善了，改善率達到真實藥物的 30-60%。這叫公開標記安慰劑（Open-Label Placebo）。\n\n這個研究證實一件事：治療效果不只來自物質本身，也來自「儀式和意圖」。當你誠心地執行一個看起來像治療的行為，你的大腦會釋放多巴胺和內啡肽，這些內源性化學物質的效果不輸藥物。\n\n認知芳療利用的正是這個機制。你打開一個牌卡、閱讀一段氣味描述、專心想像那個氣味、伴隨一個覺察意圖。這整個過程本身就是一個儀式，儀式會觸發預期效應，預期效應會產生真實的神經化學變化。這不是迷信，這是神經藥理學。'
            },
            {
                'h2': '機制五：鏡像神經元與情緒傳染',
                'content': '最後一層，也是最深的一層。義大利神經科學家 Rizzolatti 在 1990 年代發現鏡像神經元（Mirror Neurons）：當你看到另一個人做一個動作，你腦中的相同運動區會像自己在做一樣活化。後來發現鏡像神經元不只對動作有反應，對情緒和感覺也有。\n\n當你讀到一段描述「她閉上眼睛深深吸了一口薰衣草」的文字時，你的大腦會像自己在做這個動作一樣活化。你的呼吸會微微變深，肩膀會放鬆一點點，因為你的神經系統把那個場景當成自己的在經歷。\n\n這就是為什麼寫得好的氣味描述比單純的「薰衣草很放鬆」這類宣傳語有效得多。馥靈的做法是每一張牌卡都有一段「場景化的氣味描述」，目的就是啟動你的鏡像神經元，讓你的身體真的去感覺那個場景。'
            }
        ],
        'faq': [
            {'q': '那我還需要買精油嗎', 'a': '不一定需要。如果你已經累積過精油的嗅覺記憶，認知芳療可以完全不需要實體精油。但如果你還沒有那個記憶庫，接觸一次實體精油有助於建立那個庫。一次就夠，之後可以靠回憶啟動。'},
            {'q': '這跟催眠是一樣的嗎', 'a': '機制有重疊但不一樣。催眠依賴暗示和注意力聚焦，認知芳療依賴嗅覺記憶和神經通路。認知芳療不需要進入催眠狀態也能運作。'},
            {'q': '為什麼馥靈牌卡可以用這個機制', 'a': '因為每張牌卡的解讀都有詳細的氣味描述、情境場景、身體感覺引導。這三層一起啟動你的嗅覺皮質、邊緣系統和鏡像神經元。這不是隨便寫的，每張牌都經過設計。'},
            {'q': '有沒有反例的研究', 'a': '有。如果受試者對該氣味沒有個人經驗，機制的效果會大幅降低。這就是為什麼認知芳療需要一定的嗅覺記憶基礎。不是對所有人都一樣有效。'}
        ],
        'cta_text': '想親自感受一次認知芳療？抽一張馥靈牌試試',
        'cta_target': 'draw-hl.html',
        'cta_label': '抽一張馥靈牌'
    },
    {
        'slug': 'nine-purple-fire-personal-guide',
        'title': '九紫離火運個人完整指南｜2024-2043 二十年大運怎麼接',
        'meta': '九紫離火運不只影響美業，也影響每個人的二十年命運。本文從個人角度拆解火運的特質、適合做什麼、避開什麼，以及如何用自己的生辰找到最有利的位置。',
        'og_title': '九紫離火運個人完整指南｜二十年大運怎麼接',
        'keywords': '九紫離火運,玄空飛星,三元九運,個人運勢,2026運勢,馥靈之鑰',
        'date': '2026-04-12',
        'intro': '2024 年 2 月 4 日立春，我們進入九紫離火運，這是一個長達二十年的大運週期，會一路影響到 2043 年。市面上很多文章在談美業、房地產、科技業在這個運裡會怎麼樣，但比較少有人從個人的角度說：一個普通人，你的生活、你的選擇、你的人際，會怎麼被這股力量影響。\n\n這篇我們用玄空飛星的基本架構加上現代人的角度，拆解火運的個人面向。不是算命，是讓你看懂這二十年的能量大方向，然後決定自己要怎麼站位。',
        'sections': [
            {
                'h2': '什麼是九紫離火運（用人話）',
                'content': '三元九運是玄空風水的時間系統，把 180 年分成九個「運」，每個運 20 年。現在輪到的第九運叫「九紫離火運」，2024 到 2043。上一個類似的火運要追溯到 1844-1863 年，那個時期剛好是工業革命的高峰，整個世界的能源結構和生活方式被徹底改變。\n\n「離」是八卦之一，代表火、光、目光、心靈、名聲、文明、媒體、表達、藝術。這個運的核心主題不是破壞性的火，是「照亮和被看見」的火。二十年裡會被這股力量放大的東西，都跟這些特質有關。\n\n注意一件事：所有「運」都是雙面的。九紫離火運會讓表達力強的人放大，也會讓隱藏不住的東西被照出來。它獎勵真實，懲罰偽裝。這是最重要的個人啟示。'
            },
            {
                'h2': '這二十年會被放大的個人質地',
                'content': '一、真實的表達能力：在這個運裡，會說自己故事的人會被看見。不用很會講，只要真。那些一直在社群說套話、用公關模板的帳號會慢慢失去能量，而那些敢說「我今天不開心」「我這個月很掙扎」的人會得到意想不到的共鳴。\n\n二、跨界連結的能力：火的特質之一是「照亮不同角落」。過去線性的職涯路徑（讀書 → 工作 → 升遷）在這個運裡會越來越難走，而同時做幾件不同的事、把不同領域連起來的人會發亮。你不需要都很強，只要有你自己的視角。\n\n三、情感和直覺：左腦（邏輯）的時代正在緩慢收尾，右腦（情感、直覺、身體知覺）的時代正在放大。這不是說邏輯不重要，是光靠邏輯不夠用了。可以感覺到別人情緒的人、可以在資訊爆炸中抓到「這個對」的人，這二十年會越來越有競爭力。\n\n四、靈性和心理健康的行業：心理諮商、身心靈、自我探索工具、冥想 app、治療類服務，所有這個領域的需求會在這二十年內倍數成長。不是因為風潮，是因為火運本身就把「內在」放大了。'
            },
            {
                'h2': '這二十年要小心的陷阱',
                'content': '一、過度表達的疲勞：火運鼓勵被看見，但被看見有成本。很多人會進入一個「我必須一直發聲」的焦慮，結果耗盡。解方是有意識地選擇「說什麼」而不是「說多少」。\n\n二、偽真實的誘惑：因為真實被獎勵，有人會開始「表演真實」。這種假的真實在社群上越來越多。火運的能量會慢慢把真假區分開，所以短期可以騙到人，長期會被淘汰。做自己就好，不用演。\n\n三、被情緒主導而失去判斷：右腦時代的陷阱是過度依賴情緒。但情緒不是判斷，情緒是資訊。看見情緒之後還是要用頭腦決定。\n\n四、健康被忽略：火運對心臟、眼睛、血液循環、小腸有加乘效應。如果你本來這些系統有弱點，這二十年要特別照顧。建議每年做一次心血管檢查。'
            },
            {
                'h2': '你個人怎麼接這個運',
                'content': '第一件事，找出你天生的「表達載體」是什麼。有人是文字、有人是聲音、有人是手作、有人是人和人之間。這個運裡最安全的位置是你已經很會的那一種表達方式。不用創新，用你原本就會的。\n\n第二件事，開始建立一個「被找到」的資產。可能是社群帳號、Podcast、部落格、LinkedIn、作品集。重點不是粉絲數，是你有沒有一個地方讓別人可以找到你。這個資產會在五年後變得非常值錢。\n\n第三件事，做一件跟「照顧身心」有關的事情。不是大事。每天 10 分鐘冥想、每週一次自己下廚、固定運動、去看中醫。這二十年裡，身體會成為你最重要的本錢，你怎麼照顧它會決定你可以走多遠。\n\n第四件事，建立一個小圈子，三五個人就夠。可以真實說話、彼此支持、不用表演的那種。這個運會讓孤立的人特別辛苦，而有深度連結的人會變成更大的自己。'
            }
        ],
        'faq': [
            {'q': '我可以用哪個命盤看自己跟九紫離火運的關係', 'a': '最直接的是紫微斗數和八字。紫微看十年大限跟火運的互動，八字看日主在火運的強弱。馥靈之鑰的 33 合 1 命盤引擎可以一次給你多系統的交叉資料。'},
            {'q': '這二十年投資什麼會好', 'a': '這篇是個人面向不談投資細節。但可以說的原則是：跟「被看見」「內在」「情感連結」「心靈產業」相關的領域會有順風。細節請諮詢專業財務顧問。'},
            {'q': '我本命火很旺會不會被燒', 'a': '會比較敏感是真的，但不是壞事。火多火會需要「疏導」而不是「壓制」，最好的方式是找一個可以讓你表達的管道。表達出來的火不會燒自己。'},
            {'q': '我內向怎麼辦，不想被看見', 'a': '被看見不等於變成網紅。可以是一個小圈子的深度、可以是留下一段文字、可以是只被一兩個重要的人真正理解。火運放大的是「真實」，不是「人氣」。'}
        ],
        'cta_text': '用你的生辰做一次 33 套命盤交叉看個人運勢',
        'cta_target': 'destiny-engine.html',
        'cta_label': '開啟 33 合 1 命盤'
    }
]


def to_sc(s):
    return zhconv.convert(s, 'zh-hans')


def build_html(a, is_sc=False):
    base_path = '../' if is_sc else '../'
    prefix = 'sc/' if is_sc else ''
    canonical_url = f'https://hourlightkey.com/{prefix}blog/{a["slug"]}.html'
    alt_tc = f'https://hourlightkey.com/blog/{a["slug"]}.html'
    alt_sc = f'https://hourlightkey.com/sc/blog/{a["slug"]}.html'

    title = to_sc(a['title']) if is_sc else a['title']
    meta_desc = to_sc(a['meta']) if is_sc else a['meta']
    og_title = to_sc(a['og_title']) if is_sc else a['og_title']
    intro = to_sc(a['intro']) if is_sc else a['intro']
    cta_text = to_sc(a['cta_text']) if is_sc else a['cta_text']
    cta_label = to_sc(a['cta_label']) if is_sc else a['cta_label']
    lang = 'zh-Hans' if is_sc else 'zh-Hant-TW'

    # Sections HTML
    sections_html = ''
    for s in a['sections']:
        h2 = to_sc(s['h2']) if is_sc else s['h2']
        content = to_sc(s['content']) if is_sc else s['content']
        # Split content into paragraphs
        paragraphs = ''.join(f'<p>{p.strip()}</p>' for p in content.split('\n') if p.strip())
        sections_html += f'<h2>{h2}</h2>{paragraphs}'

    # FAQ HTML + Schema
    faq_html = '<div class="faq-list">'
    faq_schema = []
    for f in a['faq']:
        q = to_sc(f['q']) if is_sc else f['q']
        ans = to_sc(f['a']) if is_sc else f['a']
        faq_html += f'<details class="faq-item"><summary class="faq-q">{q}</summary><div class="faq-a"><p>{ans}</p></div></details>'
        faq_schema.append({'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': ans}})
    faq_html += '</div>'

    article_schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': title,
        'description': meta_desc,
        'author': {'@type': 'Person', 'name': '王逸君', 'url': 'https://hourlightkey.com/founder.html'},
        'publisher': {'@type': 'Organization', 'name': '馥靈之鑰 Hour Light', 'logo': {'@type': 'ImageObject', 'url': 'https://hourlightkey.com/logo.svg'}, 'url': 'https://hourlightkey.com', 'image': 'https://hourlightkey.com/og-image.jpg'},
        'datePublished': a['date'], 'dateModified': a['date'],
        'mainEntityOfPage': canonical_url,
        'image': 'https://hourlightkey.com/og-image.jpg',
        'inLanguage': 'zh-Hans' if is_sc else 'zh-Hant'
    }
    faq_schema_obj = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': faq_schema}

    breadcrumb_schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': to_sc('首頁') if is_sc else '首頁', 'item': f'https://hourlightkey.com/{prefix}index.html'},
            {'@type': 'ListItem', 'position': 2, 'name': to_sc('文章') if is_sc else '文章', 'item': f'https://hourlightkey.com/{prefix}blog-hub.html'},
            {'@type': 'ListItem', 'position': 3, 'name': title}
        ]
    }

    cta_target = a['cta_target']
    if is_sc and cta_target == 'draw-hl.html':
        cta_target = 'draw.html'

    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}｜馥靈之鑰</title>
<meta name="description" content="{meta_desc}">
<meta name="keywords" content="{a['keywords']}">
<link rel="canonical" href="{canonical_url}">
<link rel="alternate" hreflang="zh-Hant" href="{alt_tc}">
<link rel="alternate" hreflang="zh-Hans" href="{alt_sc}">
<meta property="og:type" content="article">
<meta property="og:url" content="{canonical_url}">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{meta_desc}">
<meta property="og:image" content="https://hourlightkey.com/og-image.jpg">
<script type="application/ld+json">{json.dumps(article_schema, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(faq_schema_obj, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(breadcrumb_schema, ensure_ascii=False)}</script>
<link rel="stylesheet" href="{base_path}assets/css/hourlight-global.css">
<style>
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#faf9f7;color:#1a1714;font-family:'Noto Sans TC','Noto Sans SC',sans-serif;line-height:1.85;padding-bottom:60px}}
.blog-wrap{{max-width:760px;margin:0 auto;padding:70px 22px 40px}}
.blog-breadcrumb{{font-size:13px;color:#8b7a60;margin-bottom:20px}}
.blog-breadcrumb a{{color:#8b6914;text-decoration:none}}
.blog-header{{text-align:center;margin-bottom:40px;padding-bottom:30px;border-bottom:1px solid #e8e4de}}
.blog-badge{{display:inline-block;padding:5px 16px;border:1px solid rgba(184,146,42,.35);border-radius:999px;font-size:12px;letter-spacing:2px;color:#8b6914;margin-bottom:16px}}
.blog-title{{font-family:'Noto Serif TC','Noto Serif SC',serif;font-size:clamp(26px,5vw,38px);font-weight:600;color:#1a1714;line-height:1.45;margin-bottom:14px}}
.blog-meta{{font-size:13px;color:#8b7a60}}
.blog-body h2{{font-family:'Noto Serif TC','Noto Serif SC',serif;font-size:24px;font-weight:500;color:#2a1f0e;margin:42px 0 16px;padding-left:14px;border-left:4px solid #e9c27d}}
.blog-body p{{font-size:16px;color:#3a3020;line-height:2;margin-bottom:18px}}
.blog-internal{{margin:32px 0;padding:22px 26px;background:#faf4e5;border-radius:12px}}
.blog-internal p{{font-size:14px;color:#5a4a30;margin:0}}
.blog-internal a{{color:#8b6914;text-decoration:underline}}
.blog-cta-box{{text-align:center;background:#fff;border:1px solid #e8e4de;border-radius:16px;padding:36px 28px;margin:44px 0 24px}}
.blog-cta-box p{{font-size:15px;color:#5a4a30;margin-bottom:18px}}
.blog-cta-btn{{display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e9c27d,#d4ab64);color:#2a2420;font-size:15px;font-weight:600;border-radius:999px;text-decoration:none;transition:all .25s;min-height:48px}}
.blog-cta-btn:hover{{transform:translateY(-2px);box-shadow:0 10px 24px rgba(217,174,100,.35)}}
.faq-list{{display:flex;flex-direction:column;gap:12px;margin:20px 0}}
.faq-item{{background:#fff;border:1px solid #e8e4de;border-radius:12px;overflow:hidden}}
.faq-q{{padding:16px 22px;font-size:15px;font-weight:500;color:#2a1f0e;cursor:pointer;list-style:none}}
.faq-q::after{{content:'+';float:right;color:#b8922a}}
.faq-item[open] .faq-q::after{{content:'-'}}
.faq-a{{padding:4px 22px 20px;font-size:14.5px;line-height:1.9;color:#4a3e34}}
@media(max-width:640px){{.blog-wrap{{padding:50px 18px 30px}}.blog-title{{font-size:26px}}.blog-body h2{{font-size:21px}}.blog-body p{{font-size:15.5px}}}}
</style>
</head>
<body>
<script src="{base_path}assets/js/hl-topnav.js?v=4"></script>
<main class="blog-wrap">
  <div class="blog-breadcrumb"><a href="{base_path}index.html">{to_sc("首頁") if is_sc else "首頁"}</a> ＞ <a href="{prefix}blog-hub.html">{to_sc("文章") if is_sc else "文章"}</a> ＞ {title}</div>
  <header class="blog-header">
    <div class="blog-badge">HOUR LIGHT · BLOG</div>
    <h1 class="blog-title">{title}</h1>
    <div class="blog-meta">{a['date']} · {to_sc("王逸君") if is_sc else "王逸君"}</div>
  </header>
  <article class="blog-body">
    <p>{intro.split(chr(10))[0]}</p>
    {"".join(f'<p>{p}</p>' for p in intro.split(chr(10))[1:] if p.strip())}
    {sections_html}
    <h2>{to_sc("常見問題") if is_sc else "常見問題"}</h2>
    {faq_html}
    <div class="blog-cta-box">
      <p>{cta_text}</p>
      <a class="blog-cta-btn" href="{base_path}{cta_target}">{cta_label}</a>
    </div>
  </article>
</main>
<script src="{base_path}assets/js/hl-bottomnav.js?v=4"></script>
</body>
</html>'''


os.makedirs('blog', exist_ok=True)
os.makedirs('sc/blog', exist_ok=True)

for a in ARTICLES:
    tc_path = f'blog/{a["slug"]}.html'
    with open(tc_path, 'w', encoding='utf-8') as f:
        f.write(build_html(a, is_sc=False))

    sc_path = f'sc/blog/{a["slug"]}.html'
    with open(sc_path, 'w', encoding='utf-8') as f:
        f.write(build_html(a, is_sc=True))

    print(f'{a["slug"]}: OK')

# Clean any accidental double-dashes
import re
cleaned = 0
for a in ARTICLES:
    for path in [f'blog/{a["slug"]}.html', f'sc/blog/{a["slug"]}.html']:
        with open(path, encoding='utf-8') as f:
            c = f.read()
        n = c.count('——')
        if n > 0:
            c = c.replace('——', '，').replace('，，', '，')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(c)
            cleaned += n
print(f'總清除雙破折號 {cleaned} 處')
print('DONE')
