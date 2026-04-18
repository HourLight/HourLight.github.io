// UX 敏感 bug 掃描：NaN / undefined / Invalid Date / 破圖無 fallback / 按鈕卡住
const fs = require('fs');
const path = require('path');

const htmlFiles = [];
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (p.includes('node_modules') || p.includes('.git') || p.includes('資源') ||
        p.includes('.claude') || p.includes('course-slides') || p.includes('naha-slides') ||
        p.includes('backups') || p.includes('tools/')) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (f.endsWith('.html')) htmlFiles.push(p);
  }
}
walk('.');

const issues = {
  newDateNoCheck: [],    // new Date(x) 後直接 toLocaleDateString 沒 isNaN check
  mathNoCheck: [],       // Math.ceil/round 輸入可能是 NaN
  textContentNaN: [],    // .textContent = 可能輸出 NaN / undefined
  imgNoErrorHandler: [], // <img> 沒 onerror
  buttonStuck: [],       // btn.disabled=true 後只有一個路徑能 false（error path 沒 reset）
  innerHTMLInterp: [],   // innerHTML = '...' + userData + '...'（可能 XSS 或 undefined 注入）
};

htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');

  // (1) new Date() without isNaN check on same context
  const dateMatches = [...html.matchAll(/new Date\(([^)]+)\)/g)];
  dateMatches.forEach(m => {
    const context = html.substring(m.index, Math.min(html.length, m.index + 300));
    // 有 toLocaleDateString 但同區段沒 isNaN
    if (/\.toLocaleDateString|\.toISOString|\.toDateString/.test(context)) {
      if (!/isNaN|!=\s*['"]Invalid|getTime\(\)\s*[!=]/.test(context.substring(0, 300))) {
        const line = html.substring(0, m.index).split('\n').length;
        issues.newDateNoCheck.push({ file, line, snippet: m[0] + ' ...' + context.substring(m[0].length, m[0].length + 80).replace(/\n/g, ' ') });
      }
    }
  });

  // (2) <img> 沒 onerror 且是動態 src（含 ${} 或 .src= 或 user content）
  const imgMatches = [...html.matchAll(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/g)];
  imgMatches.forEach(m => {
    const tag = m[0];
    if (!/onerror=/i.test(tag)) {
      const src = m[1];
      // 忽略 data: URL 與絕對 URL 到 gstatic / mailerlite 等
      if (src.startsWith('http')) return;
      if (src.startsWith('data:')) return;
      if (!src.includes('${') && !src.includes('+')) return; // 靜態圖片通常都在 repo，不必 onerror
      const line = html.substring(0, m.index).split('\n').length;
      issues.imgNoErrorHandler.push({ file, line, snippet: tag.substring(0, 100) });
    }
  });

  // (3) button.textContent = '載入中' 或類似，但錯誤 catch 裡沒 reset 的
  // 簡單掃：找 btn.disabled=true 沒對應的 disabled=false
  const btnStuckMatches = [...html.matchAll(/(\w+)\.disabled\s*=\s*true/g)];
  btnStuckMatches.forEach(m => {
    const btnVar = m[1];
    // 看後續 300 字內有沒有 disabled=false 或 re-enable
    const ctx = html.substring(m.index, Math.min(html.length, m.index + 800));
    const resetRegex = new RegExp(btnVar + '\\.disabled\\s*=\\s*false', 'g');
    const textResetRegex = new RegExp(btnVar + '\\.(textContent|innerHTML)\\s*=\\s*', 'g');
    if (!resetRegex.test(ctx)) {
      const line = html.substring(0, m.index).split('\n').length;
      // 跳過誤報（btnVar 看起來很通用）
      if (['this', 'btn', 'e'].includes(btnVar) && ctx.match(textResetRegex)) return;
      issues.buttonStuck.push({ file, line, btn: btnVar, snippet: m[0] });
    }
  });
});

console.log('🔴 new Date() 沒 isNaN 檢查（可能 Invalid Date 顯示）:', issues.newDateNoCheck.length);
issues.newDateNoCheck.slice(0, 15).forEach(i =>
  console.log('  ' + i.file + ':' + i.line));

console.log('\n⚠️  動態 <img src> 沒 onerror fallback:', issues.imgNoErrorHandler.length);
issues.imgNoErrorHandler.slice(0, 10).forEach(i =>
  console.log('  ' + i.file + ':' + i.line + ' ' + i.snippet.substring(0, 80)));

console.log('\n⚠️  btn.disabled=true 可能沒 reset:', issues.buttonStuck.length);
const stuckByFile = {};
issues.buttonStuck.forEach(i => {
  if (!stuckByFile[i.file]) stuckByFile[i.file] = 0;
  stuckByFile[i.file]++;
});
Object.entries(stuckByFile).sort((a,b)=>b[1]-a[1]).slice(0, 10).forEach(([f, c]) => {
  console.log('  ' + f + ': ' + c + ' 處');
});
