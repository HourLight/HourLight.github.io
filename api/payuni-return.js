// ═══════════════════════════════════════
// 馥靈之鑰 · PAYUNi 付款返回中繼 API
// PAYUNi 付款完成後 POST 導回這裡，再用 302 GET 跳轉到靜態頁面
// （GitHub Pages 不接受 POST，會回 405 Not Allowed）
// © 2026 Hour Light International
// ═══════════════════════════════════════

module.exports = function handler(req, res) {
  // PAYUNi 會用 POST 把客人導回 ReturnURL
  // 我們接收後用 302 GET redirect 到實際的 GitHub Pages 靜態頁面

  // 從 query string 取得原始目標頁面
  const to = req.query.to || '';

  // 白名單檢查（只允許跳轉到 hourlightkey.com）
  let target = 'https://hourlightkey.com/member-dashboard.html?payment=success';
  if (to) {
    try {
      const u = new URL(to);
      if (u.hostname === 'hourlightkey.com' || u.hostname === 'www.hourlightkey.com') {
        target = to;
      }
    } catch (e) {
      // invalid URL, use default
    }
  }

  // 302 GET redirect（瀏覽器會用 GET 請求目標 URL）
  res.redirect(302, target);
};
