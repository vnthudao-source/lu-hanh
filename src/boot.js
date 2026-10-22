/* ================= KHỞI ĐỘNG: hiện màn hình chờ ngay, tải CSS + JS của game có đếm phần trăm ================= */
(function(){
  var me=document.currentScript,base=(me&&me.src||'').replace(/[^\/]*$/,''),FILES=@@FILES@@;
  window.LH_BASE=window.LH_BASE||base;
  // v10.32: mở sẵn kết nối tới máy chủ Apps Script và kho ảnh Drive (đỡ vài trăm ms bắt tay TLS trên điện thoại)
  ['https://script.google.com','https://script.googleusercontent.com','https://lh3.googleusercontent.com'].forEach(function(h){try{var l=document.createElement('link');l.rel='preconnect';l.href=h;if(!/lh3/.test(h))l.crossOrigin='';document.head.appendChild(l);}catch(e){}});
  // v10.32: gọi máy chủ ngay (dữ liệu tĩnh + danh sách nhân vật) trong lúc tải gói trò chơi; cổng vào dùng lại kết quả (LH_PRE)
  try{var api=window.LH_API;if(api){var tok=localStorage.getItem('lh-token')||'',dc=null;try{dc=JSON.parse(localStorage.getItem('lh-data-cache')||'null');}catch(e){}var h=dc&&dc.data&&dc.data.vat_pham?(dc.h||''):'';
    var post=function(b){return fetch(api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)}).then(function(x){return x.text();}).then(function(t){return JSON.parse(t);});};
    var P={tok:tok,h:h,data:post({h:h,action:'data',token:tok})};if(tok)P.chars=post({action:'chars',token:tok});
    P.data.catch(function(){});if(P.chars)P.chars.catch(function(){});window.LH_PRE=P;}}catch(e){}
  var L=window.LH_Loader.show({label:'T\u{1EA3}i t\u{00E0}i nguy\u{00EA}n trang',bg:'tai_game'});
  // v10.71: gói trong game (lu-hanh-game.js) tải sau gói cổng vào; cổng vào chờ window.LH_GAME_READY trước khi dựng lều / vào làng
  var gameOk;window.LH_GAME_READY=new Promise(function(ok){gameOk=ok;});window.LH_GAME_LOADED=function(){gameOk();};
  function tag(name,cb){var s=document.createElement('script');s.src=base+name;s.charset='utf-8';if(cb)s.onload=cb;s.onerror=function(){if(cb)cb();};document.head.appendChild(s);}
  function plain(){var l=document.createElement('link');l.rel='stylesheet';l.href=base+FILES.css.name;document.head.appendChild(l);tag(FILES.js.name,function(){tag(FILES.game.name);});}
  // v10.32: CSS + JS tải song song, chung một thanh tiến trình (0–70%)
  var TOT=(FILES.css.size||1)+(FILES.js.size||1),GOT=0;
  async function get(f){
    var r=await fetch(base+f.name);if(!r.ok||!r.body)throw Error('fetch');
    var rd=r.body.getReader(),n=0,parts=[];
    for(;;){var x=await rd.read();if(x.done)break;parts.push(x.value);n+=x.value.length;GOT+=x.value.length;L.step(70*Math.min(1,GOT/TOT),null,70);}
    var buf=new Uint8Array(n),o=0;parts.forEach(function(p){buf.set(p,o);o+=p.length;});
    return new TextDecoder('utf-8').decode(buf);
  }
  (async function(){
    L.step(0,'T\u{1EA3}i tr\u{00F2} ch\u{01A1}i',70);
    var pc=get(FILES.css),pj=get(FILES.js);pc.catch(function(){});
    var css=await pc,js=await pj;
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var sc=document.createElement('script');sc.text=js;document.head.appendChild(sc);
    // gói trong game: tải ngay sau (không chen với thanh tiến trình), lỗi thì thử lại bằng thẻ script thường
    try{var g=await fetch(base+FILES.game.name);if(!g.ok)throw Error('fetch');var gt=await g.text();var sg=document.createElement('script');sg.text=gt;document.head.appendChild(sg);}catch(e){tag(FILES.game.name);}
  })().catch(function(){plain();});
})();
