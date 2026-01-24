/**
 * 馥靈之鑰 Hour Light - 完整追蹤系統
 * GA4 + Facebook Pixel + MailerLite 事件追蹤
 * 
 * GA4 ID: G-BXP7K53QG6
 * FB Pixel ID: 1333106288588347
 * MailerLite Account: 2060689
 */

(function() {
  'use strict';

  // 檢查追蹤工具是否存在
  const hasGA = typeof gtag === 'function';
  const hasFB = typeof fbq === 'function';
  
  if (!hasGA && !hasFB) {
    console.warn('追蹤工具未載入');
    return;
  }

  // ========== 通用追蹤函數 ==========
  function trackEvent(gaEvent, gaParams, fbEvent, fbParams) {
    if (hasGA && gaEvent) {
      gtag('event', gaEvent, gaParams || {});
    }
    if (hasFB && fbEvent) {
      fbq('track', fbEvent, fbParams || {});
    }
  }

  // ========== 點擊事件追蹤 ==========
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href') || '';
    const text = link.textContent.trim().substring(0, 50);
    
    // LINE 連結 → Lead 事件
    if (href.includes('lin.ee') || href.includes('line.me')) {
      trackEvent(
        'click_line', 
        { event_category: 'engagement', event_label: text },
        'Lead',
        { content_name: 'LINE諮詢', content_category: 'contact' }
      );
    }
    
    // 購買連結（Pubu 電子書）→ InitiateCheckout 事件
    if (href.includes('pubu.com.tw')) {
      trackEvent(
        'click_purchase',
        { event_category: 'conversion', event_label: text },
        'InitiateCheckout',
        { content_name: text, content_category: 'book' }
      );
    }
    
    // 課程/服務頁連結 → ViewContent 事件
    if (href.includes('course') || href.includes('training') || 
        href.includes('services') || href.includes('pricing')) {
      trackEvent(
        'click_service',
        { event_category: 'consideration', event_label: href },
        'ViewContent',
        { content_name: text, content_category: 'service' }
      );
    }
  });

  // ========== 頁面類型追蹤 ==========
  const pagePath = window.location.pathname;
  const pageTitle = document.title;
  
  // 免費工具使用
  if (pagePath.includes('draw') || 
      pagePath.includes('calculator') || 
      pagePath.includes('fuling-mima') ||
      pagePath.includes('tarot')) {
    trackEvent(
      'use_free_tool',
      { event_category: 'free_tool', event_label: pagePath },
      'CustomizeProduct',
      { content_name: pageTitle, content_category: 'free_tool' }
    );
  }
  
  // 書籍預覽頁
  if (pagePath.includes('preview') || pagePath.includes('book')) {
    trackEvent(
      'view_book',
      { event_category: 'content', event_label: pagePath },
      'ViewContent',
      { content_name: pageTitle, content_category: 'book' }
    );
  }
  
  // 服務/價格頁
  if (pagePath.includes('pricing') || 
      pagePath.includes('services') || 
      pagePath.includes('consulting')) {
    trackEvent(
      'view_service',
      { event_category: 'consideration', event_label: pagePath },
      'ViewContent',
      { content_name: pageTitle, content_category: 'service', value: 1 }
    );
  }

  // ========== 滾動深度追蹤 ==========
  let scrollMarks = [25, 50, 75, 90];
  let scrollFired = [];
  
  window.addEventListener('scroll', function() {
    const scrollPercent = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    
    scrollMarks.forEach(function(mark) {
      if (scrollPercent >= mark && !scrollFired.includes(mark)) {
        scrollFired.push(mark);
        if (hasGA) {
          gtag('event', 'scroll_depth', {
            event_category: 'engagement',
            event_label: mark + '%',
            value: mark
          });
        }
      }
    });
  });

  // ========== MailerLite 訂閱追蹤 ==========
  // 監聽 MailerLite 表單提交成功
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'mailerlite' && e.data.event === 'form_submitted') {
      trackEvent(
        'email_subscribe',
        { event_category: 'conversion', event_label: 'mailerlite_form' },
        'CompleteRegistration',
        { content_name: 'Email訂閱', status: true }
      );
      console.log('✅ 訂閱成功已追蹤');
    }
  });

  // 備用：監聽訂閱按鈕點擊
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.ml-form-embedSubmit button, .ml-embedded button');
    if (btn) {
      trackEvent(
        'email_subscribe_attempt',
        { event_category: 'engagement', event_label: 'subscribe_click' },
        null, null
      );
    }
  });

  // ========== 公開追蹤函數（供外部呼叫）==========
  window.hlTrackSubscribe = function() {
    trackEvent(
      'email_subscribe',
      { event_category: 'conversion', event_label: 'manual_track' },
      'CompleteRegistration',
      { content_name: 'Email訂閱', status: true }
    );
  };

  console.log('✅ HL Analytics 已啟動 (GA4 + FB Pixel + MailerLite)');
})();
