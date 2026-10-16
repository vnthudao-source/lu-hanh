/* ================= KHỞI ĐỘNG: hiện màn hình chờ ngay, tải CSS + JS của game có đếm phần trăm ================= */
(function(){
  var me=document.currentScript,base=(me&&me.src||'').replace(/[^\/]*$/,''),FILES=@@FILES@@;
  window.LH_BASE=window.LH_BASE||base;
  var L=window.LH_Loader.show({label:'T\u{1EA3}i t\u{00E0}i nguy\u{00EA}n trang',bg:'tai_game'});
  function plain(){var l=document.createElement('link');l.rel='stylesheet';l.href=base+FILES.css.name;document.head.appendChild(l);var s=document.createElement('script');s.src=base+FILES.js.name;s.charset='utf-8';document.head.appendChild(s);}
  async function get(f,from,to,label){
    var r=await fetch(base+f.name);if(!r.ok||!r.body)throw Error('fetch');
    var rd=r.body.getReader(),n=0,parts=[];L.step(from,label,to);
    for(;;){var x=await rd.read();if(x.done)break;parts.push(x.value);n+=x.value.length;L.step(from+(to-from)*Math.min(1,n/f.size),null,to);}
    var buf=new Uint8Array(n),o=0;parts.forEach(function(p){buf.set(p,o);o+=p.length;});
    return new TextDecoder('utf-8').decode(buf);
  }
  (async function(){
    var css=await get(FILES.css,0,12,'T\u{1EA3}i giao di\u{1EC7}n');
    var js=await get(FILES.js,12,70,'T\u{1EA3}i tr\u{00F2} ch\u{01A1}i');
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var sc=document.createElement('script');sc.text=js;document.head.appendChild(sc);
  })().catch(function(){plain();});
})();
