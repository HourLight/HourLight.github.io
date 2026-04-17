"""
MBTI 繁轉簡批次工具
用法：
  python tools/mbti-tw2sc.py --dry-run mbti-infp-guide.html    # 試轉一頁（輸出 sc/mbti-infp-guide.html）
  python tools/mbti-tw2sc.py --all                              # 批次轉全部 97 頁

策略：
- OpenCC tw2s（字面轉換，不動詞彙習慣）
- canonical / og:url / mainEntityOfPage 指向 /sc/ 版
- lang="zh-Hant-TW" -> lang="zh-Hans"
- 資源路徑 assets/ -> ../assets/，favicon.ico -> ../favicon.ico
- 內部相對連結保持不變（sc/ 同目錄同名對應）
"""
import os, re, sys, glob
from opencc import OpenCC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = ROOT
DST_DIR = os.path.join(ROOT, 'sc')

cc = OpenCC('tw2s')


def convert_page(fname):
    src = os.path.join(SRC_DIR, fname)
    dst = os.path.join(DST_DIR, fname)
    with open(src, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1) OpenCC 字面轉換
    html = cc.convert(html)

    # 2) lang 屬性
    html = re.sub(r'<html\s+lang="zh-Hant-TW"', '<html lang="zh-Hans"', html, count=1)
    html = re.sub(r'<html\s+lang="zh-Hant"', '<html lang="zh-Hans"', html, count=1)
    html = re.sub(r'<html\s+lang="zh-TW"', '<html lang="zh-Hans"', html, count=1)

    # 3) 資源相對路徑
    html = re.sub(r'(href|src)="assets/', r'\1="../assets/', html)
    html = re.sub(r'(href|src)="js/', r'\1="../js/', html)
    html = re.sub(r'(href|src)="css/', r'\1="../css/', html)
    html = re.sub(r'href="favicon\.ico"', 'href="../favicon.ico"', html)
    html = re.sub(r'src="(LOGO-1|HOUR-LIGHT|og-image)\.(png|webp|jpg)"',
                  r'src="../\1.\2"', html)

    # 4) canonical / og:url / mainEntityOfPage -> /sc/ 版
    html = re.sub(
        r'(https?://(?:www\.)?hourlightkey\.com)/(mbti-[a-z0-9\-]+\.html)',
        r'\1/sc/\2', html)

    return html


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return

    if '--all' in args:
        files = sorted(glob.glob(os.path.join(SRC_DIR, 'mbti-*.html')))
        files = [os.path.basename(f) for f in files]
    else:
        files = [a for a in args if a.endswith('.html')]

    dry = '--dry-run' in args
    n = 0
    for fname in files:
        try:
            html = convert_page(fname)
            dst = os.path.join(DST_DIR, fname)
            os.makedirs(DST_DIR, exist_ok=True)
            with open(dst, 'w', encoding='utf-8') as f:
                f.write(html)
            n += 1
            print(f'  {fname} -> sc/{fname}  ({len(html):,} bytes)')
        except Exception as e:
            print(f'  {fname} FAILED: {e}')
    print(f'\n{n}/{len(files)} converted.')


if __name__ == '__main__':
    main()
