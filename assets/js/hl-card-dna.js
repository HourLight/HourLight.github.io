/**
 * 馥靈之鑰｜牌卡 DNA 教育模組 v1.0
 * 抽牌後顯示「為什麼馥靈之鑰的 AI 解讀跟外面不一樣」
 */
(function(){
  'use strict';
  var DIMS = [
    {icon:'🃏',name:'塔羅原型',desc:'每張牌對應哪張阿爾克那，正逆位的能量方向'},
    {icon:'☯️',name:'易經卦象',desc:'對應哪一卦哪一爻，古人的智慧在說什麼'},
    {icon:'🔢',name:'靈數共振',desc:'牌卡編號的數字能量，跟你生命數的共鳴'},
    {icon:'⭐',name:'星象守護',desc:'對應哪個星座哪顆行星'},
    {icon:'🌿',name:'精油配方',desc:'這張牌建議的芳香配方，為什麼是這支精油'},
    {icon:'🎨',name:'脈輪對位',desc:'身體的哪個能量中心在說話'},
    {icon:'🌳',name:'五行歸屬',desc:'金木水火土，這張牌在五行裡的位置'},
    {icon:'🏰',name:'城堡房間',desc:'對應內在城堡的哪個空間'},
    {icon:'🔮',name:'奇門遁甲',desc:'天盤地盤九宮八門的判斷邏輯'},
    {icon:'📅',name:'瑪雅印記',desc:'瑪雅曆法中的 KIN 對應'},
    {icon:'💎',name:'卡巴拉路徑',desc:'生命之樹上的位置'},
    {icon:'🌙',name:'月相關聯',desc:'月亮週期中的能量特性'}
  ];
  var CID='hl-card-dna-education';

  function createHTML(){
    var s=DIMS.slice().sort(function(){return .5-Math.random()});
    var shown=s.slice(0,6), hidden=DIMS.length-6;
    var h='<div id="'+CID+'" style="margin-top:20px;padding:24px 20px;border-radius:16px;background:linear-gradient(135deg,rgba(160,124,220,.04),rgba(233,194,125,.04));border:1px solid rgba(160,124,220,.15);display:none">';
    h+='<div style="text-align:center;margin-bottom:16px">';
    h+='<div style="font-size:1.4rem;margin-bottom:6px">🧬</div>';
    h+='<div style="font-family:\'Noto Serif TC\',serif;font-size:1rem;color:#f8dfa5;letter-spacing:.12em">每張牌都有 20+ 個解讀維度</div>';
    h+='<div style="font-size:.78rem;color:rgba(255,255,255,.45);margin-top:6px;line-height:1.8">把牌卡資料丟去外面的 AI，它看到的只是一個編號和名字。<br>馥靈之鑰看到的，是這張牌完整的 DNA。</div></div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:14px">';
    shown.forEach(function(d){
      h+='<div style="padding:12px 10px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);text-align:center">';
      h+='<div style="font-size:1.2rem;margin-bottom:4px">'+d.icon+'</div>';
      h+='<div style="font-size:.78rem;color:#f8dfa5;letter-spacing:.05em">'+d.name+'</div>';
      h+='<div style="font-size:.68rem;color:rgba(255,255,255,.35);margin-top:4px;line-height:1.5">'+d.desc+'</div></div>';
    });
    h+='</div>';
    h+='<div style="text-align:center;font-size:.75rem;color:rgba(255,255,255,.35);margin-bottom:16px">還有 '+hidden+' 個維度在交叉比對⋯⋯</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">';
    h+='<div style="padding:14px 12px;border-radius:12px;background:rgba(255,100,100,.04);border:1px solid rgba(255,100,100,.12);text-align:center">';
    h+='<div style="font-size:.85rem;color:rgba(255,150,150,.7);margin-bottom:8px">😵 外面的 AI</div>';
    h+='<div style="font-size:.72rem;color:rgba(255,255,255,.4);line-height:1.8">只看到編號和名字<br>只能猜大方向<br>沒有你的命盤交叉比對<br>沒有精油建議<br><span style="color:rgba(255,120,120,.5)">等於瞎子摸象</span></div></div>';
    h+='<div style="padding:14px 12px;border-radius:12px;background:rgba(233,194,125,.04);border:1px solid rgba(233,194,125,.15);text-align:center">';
    h+='<div style="font-size:.85rem;color:rgba(240,212,138,.8);margin-bottom:8px">✨ 馥靈之鑰 AI</div>';
    h+='<div style="font-size:.72rem;color:rgba(255,255,255,.55);line-height:1.8">塔羅 × 易經 × 靈數 × 星象<br>× 精油 × 脈輪 × 五行 × 城堡<br>× 你的生日命盤交叉比對<br>× 牌陣位置的語境分析<br><span style="color:rgba(240,212,138,.7)">20+ 維度同時解讀</span></div></div>';
    h+='</div>';
    h+='<div style="text-align:center;font-size:.7rem;color:rgba(255,255,255,.3)">上方的 AI 解讀使用的是馥靈之鑰專屬的牌卡 DNA 系統</div>';
    h+='</div>';
    return h;
  }

  function show(){
    var ex=document.getElementById(CID);
    if(ex){ex.style.display='block';return;}
    var sec=document.getElementById('aiReadingSection');
    if(sec){
      sec.insertAdjacentHTML('beforebegin',createHTML());
      var el=document.getElementById(CID);
      if(el){el.style.display='block';el.style.opacity='0';el.style.transition='opacity .6s ease';setTimeout(function(){el.style.opacity='1'},100);}
    }
  }
  function hide(){var el=document.getElementById(CID);if(el)el.style.display='none';}
  window.hlCardDNA={show:show,hide:hide};
})();
