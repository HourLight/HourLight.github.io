# 馥靈之鑰城堡貓咪 AI 生成提示詞

## 生成規格
- **風格**: LINE 貼圖風格，可愛卡通動漫
- **背景**: 透明或白色背景
- **尺寸**: 正方形，512x512 或更高
- **格式**: PNG (支援透明度)
- **品質**: 高品質數位插畫

---

## 1. 可可 (keke) - 暹羅貓

**角色特徵**:
- 暹羅貓，奶油底色，耳鼻四肢深棕色
- 個性：話很多，每句都有意思
- 房間：瞭望塔
- 引言："你今天說了很多，但有沒有說到你真正想說的？"

**AI 提示詞**:
```
Cute cartoon Siamese cat sticker, cream colored body with dark brown ears, nose, and paws, sitting upright pose, bright blue eyes, mouth slightly open as if talking, friendly and wise expression, fluffy tail curled around body, LINE sticker style, kawaii anime art, soft shading, transparent background, high quality digital illustration, adorable and expressive
```

---

## 2. 圓圓 (yuanyuan) - 摺耳貓

**角色特徵**:
- 摺耳貓，灰藍色，耳朵往前折
- 個性：最黏人，你不在時最難過
- 房間：愛之殿
- 引言："你回來了。我等了你一整天。"

**AI 提示詞**:
```
Adorable cartoon Scottish Fold cat sticker, grey-blue fur color, characteristic folded ears bent forward, round chubby cheeks, sitting pose with slightly sad but hopeful expression, large round eyes looking up lovingly, paws positioned as if reaching out, clingy and affectionate personality, LINE sticker style, kawaii anime art, soft pastel colors, transparent background, high quality digital illustration
```

---

## 3. 阿BO (xiaoma) - 賓士貓

**角色特徵**:
- 賓士貓，黑白花色，白色鬍鬚
- 個性：有自己的規矩，但對你破例
- 房間：解鎖密室
- 引言："你說要改變的那件事，你是說真的嗎？我想看你做到。"

**AI 提示詞**:
```
Sophisticated cartoon tuxedo cat sticker, black and white bicolor pattern like a tuxedo, prominent white whiskers, sitting in dignified pose, intelligent amber eyes with slightly stern but caring expression, white chest and paws contrasting with black body, formal gentleman-like appearance, LINE sticker style, kawaii anime art, clean lines, transparent background, high quality digital illustration
```

---

## 4. 七七 (qiqi) - 花貓

**角色特徵**:
- 花貓，黑白橘三色，每個用戶花紋隨機
- 個性：最隨性，每天狀態不一樣
- 房間：不固定
- 引言："今天是新的一天。不需要跟昨天一樣。"

**AI 提示詞**:
```
Playful cartoon calico cat sticker, tri-color pattern with black, white, and orange patches, unique random markings, sitting in relaxed casual pose, bright curious eyes, slightly tilted head showing free-spirited personality, fluffy fur with distinct color patches, cheerful and unpredictable expression, LINE sticker style, kawaii anime art, vibrant colors, transparent background, high quality digital illustration
```

---

## 5. 琥珀 (hupo) - 玳瑁貓

**角色特徵**:
- 玳瑁貓，黑橘棕三色混合
- 個性：溫柔但有主見，不喜歡被打擾
- 房間：和諧苑
- 引言："你是不是又在照顧別人、忘了照顧自己？"

**AI 提示詞**:
```
Elegant cartoon tortoiseshell cat sticker, beautiful blend of black, orange, and brown fur in mottled pattern, sitting gracefully with composed posture, gentle but determined expression, golden-green eyes showing wisdom and independence, slightly reserved but caring demeanor, warm earth-tone colors, LINE sticker style, kawaii anime art, rich color palette, transparent background, high quality digital illustration
```

---

## 6. 雪糕 (xuegao) - 白貓

**角色特徵**:
- 純白貓，異瞳（一藍一金）
- 個性：最安靜，眼神最深
- 房間：夢境走廊
- 引言："你知道嗎，你其實已經知道答案了。"

**AI 提示詞**:
```
Mystical cartoon white cat sticker, pure white fluffy fur, striking heterochromia with one blue eye and one golden eye, sitting in serene meditation-like pose, peaceful and wise expression, ethereal and mysterious aura, long fluffy tail wrapped around body, profound gaze suggesting deep knowledge, LINE sticker style, kawaii anime art, soft lighting effects, transparent background, high quality digital illustration
```

---

## 7. 豆豆 (doudou) - 虎斑貓

**角色特徵**:
- 灰色虎斑貓，額頭有M字花紋
- 個性：精力充沛，愛在房間間跑來跑去
- 房間：王座廳
- 引言："你今天做了什麼讓自己往前走了一步？"

**AI 提示詞**:
```
Energetic cartoon tabby cat sticker, grey striped pattern with distinct M-marking on forehead, playful active pose as if mid-run or about to pounce, bright alert eyes full of energy, slightly open mouth showing enthusiasm, dynamic tail position, motivational and encouraging expression, classic tabby markings, LINE sticker style, kawaii anime art, vibrant and lively, transparent background, high quality digital illustration
```

---

## 生成後處理步驟

1. **圖片優化**: 將生成的 PNG 轉換為 WebP 格式
2. **檔案命名**: 按照格式 `cat-[id]-new.webp` (例如：`cat-keke-new.webp`)
3. **尺寸調整**: 確保圖片大小適中（目標 < 50KB）
4. **背景處理**: 確認背景透明或純白
5. **品質檢查**: 確認圖片清晰度和風格一致性

## 更新檔案列表

生成完成後需要更新 `assets/js/hl-castle-pets.js` 中的圖片引用：

```javascript
// 範例更新
expressions: {
  normal: 'cat-keke-new.webp',  // 替換舊的檔案引用
  happy: 'cat-keke-happy.webp',
  sleepy: 'cat-keke-sleep.webp'
}
```