/*! Lữ Hành v10.79 · khởi động · https://github.com/vnthudao-source/lu-hanh */
/* ================= NGÔN NGỮ (v10.78): tiếng Việt / English =================
   Mã nguồn giữ nguyên chữ tiếng Việt. Ở chế độ English, chữ được đổi lúc hiện ra màn hình:
   - Chữ trong trang (DOM): MutationObserver đổi từng nút chữ + thuộc tính title / placeholder / aria-label / alt.
   - Chữ vẽ lên canvas: bọc fillText / strokeText / measureText.
   Từ điển (tools/i18n/en.json \u{2192} dist/lang-en.js) ánh xạ từng đoạn chữ tiếng Việt \u{2192} tiếng Anh; đoạn dài khớp trước.
   Tên trên Sheet có cột ten_en / mo_ta_en\u{2026} thì dùng luôn (LH_I18N.addRows), không cần sửa từ điển.
   Luật chơi, dữ liệu, máy chủ không đổi gì: hai ngôn ngữ chơi chung một thế giới.
   Chọn ngôn ngữ: ?lang=en | ?lang=vi trên đường dẫn \u{2192} window.LH_LANG \u{2192} localStorage lh-lang \u{2192} tiếng Việt. */
window.LH_I18N=window.LH_I18N||(()=>{
  const VI=/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const LET=/[\p{L}\p{M}]/u;
  let lang='vi';
  try{
    const m=/[?&#]lang=(en|vi)\b/i.exec(location.search+location.hash);
    if(m){lang=m[1].toLowerCase();try{localStorage.setItem('lh-lang',lang);}catch(e){}}
    else if(window.LH_LANG)lang=String(window.LH_LANG).toLowerCase();
    else{try{lang=localStorage.getItem('lh-lang')||'vi';}catch(e){}}
  }catch(e){}
  if(lang!=='en')lang='vi';
  const EN=lang==='en';
  const dict=new Map(),byFirst=new Map(),cache=new Map(),outs=new Set();let ready=false;const waiters=[]; // outs: chuỗi đã là bản dịch \u{2192} không dịch lần nữa
  const firstWord=s=>{const m=/^[\p{L}\p{M}]+/u.exec(s);return m?m[0]:'';};
  // Chữ không dấu (Nam, Mua, Voi\u{2026}): chỉ đổi khi đứng một mình (bỏ số, dấu câu hai bên)
  const ascii=new Map();
  const core=s=>{const m=/^([^\p{L}]*)(.*?)([^\p{L}]*)$/su.exec(s);return m?m:['',s,'',''];};
  function put(vi,en){
    vi=String(vi||'').trim();en=String(en==null?'':en).trim();
    if(vi&&!VI.test(vi)){if(en&&/^[A-Za-z][A-Za-z ]*$/.test(vi)){ascii.set(vi,en);cache.clear();}return;}
    if(!vi||!VI.test(vi))return;
    if(!en&&!/^[a-zđ]/.test(vi))return; // chuỗi rỗng chỉ cho đại từ viết thường (chú, cô\u{2026})
    if(!dict.has(vi)){const w=firstWord(vi);if(!w)return;let a=byFirst.get(w);if(!a){a=[];byFirst.set(w,a);}a.push(vi);a.sort((x,y)=>y.length-x.length);}
    dict.set(vi,en);cache.clear();
  }
  // Đổi một chuỗi: khớp nguyên chuỗi trước, rồi thay từng đoạn (dài nhất trước) tại đầu mỗi từ
  function tr(s){
    if(!EN||typeof s!=='string'||!s)return s;
    if(!VI.test(s)){if(!ascii.size||s.length>40)return s;const m=core(s),a=ascii.get(m[2]);return a?m[1]+a+m[3]:s;}
    const c=cache.get(s);if(c!==undefined)return c;
    if(outs.has(s))return s;
    let out;
    const t=s.trim(),whole=dict.get(t);
    if(whole!==undefined)out=s.replace(t,()=>whole);
    else{
      out='';let i=0;const n=s.length;
      while(i<n){
        const ch=s[i];
        if(LET.test(ch)&&(i===0||!LET.test(s[i-1]))){
          const w=firstWord(s.slice(i,i+40)),cand=byFirst.get(w);let hit=null;
          if(cand)for(const k of cand){if(s.startsWith(k,i)&&!LET.test(s[i+k.length]||'')){hit=k;break;}}
          if(hit){out+=dict.get(hit);i+=hit.length;continue;}
          out+=w;i+=w.length;continue;
        }
        out+=ch;i++;
      }
    }
    if(out!==s)out=out.replace(/ {2,}/g,' ').replace(/ ([,.!?])/g,'$1');
    if(cache.size>6000)cache.clear();
    if(out!==s){if(outs.size>6000)outs.clear();outs.add(out);}
    cache.set(s,out);return out;
  }
  // ----- DOM
  const ATTRS=['title','placeholder','aria-label','alt'];let done=new WeakMap();
  const skipEl=el=>!!(el&&el.closest&&el.closest('script,style,textarea,input,[contenteditable],[data-noi18n]'));
  // v10.79: chống giành giật \u{2014} nút chữ bị mã game ghi lại liên tục (>20 lần / giây) thì thôi dịch nút đó, không để hai bên ghi qua ghi lại làm đơ
  let hot=new WeakMap(),hotT=0;
  function fixText(node){const v=node.data;if(done.get(node)===v)return;const parent=node.parentNode;if(!parent||skipEl(parent))return;
    const now=performance.now();if(now-hotT>1000){hot=new WeakMap();hotT=now;}const c=(hot.get(node)||0)+1;hot.set(node,c);if(c>20)return;
    const o=tr(v);done.set(node,o);if(o!==v)node.data=o;}
  function diag(m){try{if(window.LH_DIAG)LH_DIAG.error(m,'ngôn ngữ');else console.warn('[LH_I18N]',m);}catch(e){}}
  let attrDone=new WeakMap();
  function fixAttrs(el){if(skipEl(el))return;for(const a of ATTRS){const v=el.getAttribute(a);if(v&&VI.test(v)){let D=attrDone.get(el);if(D&&D[a]===v)continue;{const now=performance.now();if(now-hotT>1000){hot=new WeakMap();hotT=now;}const c=(hot.get(el)||0)+1;hot.set(el,c);if(c>20)continue;}const o=tr(v);if(!D)attrDone.set(el,D={});D[a]=o;if(o!==v)el.setAttribute(a,o);}}
    if(el.tagName==='INPUT'&&/^(button|submit|reset)$/i.test(el.type)&&VI.test(el.value)){const o=tr(el.value);if(o!==el.value)el.value=o;}}
  function walk(root){
    if(!root)return;
    if(root.nodeType===3){if(want(root.data))fixText(root);return;}
    if(root.nodeType!==1&&root.nodeType!==11)return;
    if(root.nodeType===1){if(skipEl(root))return;fixAttrs(root);}
    const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
    while((n=tw.nextNode())){if(n.nodeType===3){if(want(n.data))fixText(n);}else fixAttrs(n);}
  }
  const want=t=>VI.test(t)||(ascii.size>0&&t.length<=40&&/[A-Za-z]/.test(t)&&ascii.has(core(t)[2]));
  let obs=null;
  function startDom(){
    if(obs||!EN||typeof MutationObserver==='undefined')return;
    const go=()=>{
      try{document.documentElement.lang='en';}catch(e){}
      walk(document.body);paintLang(document.body);
      // v10.79: cầu chì \u{2014} bản dịch tốn quá 250 ms trong 1 giây (vòng lặp với mã khác) thì tạm dừng 3 giây, ghi vào Tình trạng, không để trang đơ
      let spent=0,win=0,trips=0;
      const OPT={subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS.concat(['value'])};
      obs=new MutationObserver(list=>{const t0=performance.now();if(t0-win>1000){win=t0;spent=0;}
        for(const m of list){
          if(m.type==='characterData'){if(want(m.target.data))fixText(m.target);}
          else if(m.type==='attributes'){if(m.target.nodeType===1)fixAttrs(m.target);}
          else for(const a of m.addedNodes){walk(a);if(a.nodeType===1){if(a.matches&&a.matches('[data-lh-lang]'))paintLang(a.parentNode);else paintLang(a);}}
        }
        spent+=performance.now()-t0;
        if(spent>250){obs.disconnect();trips++;diag('Dịch chữ quá tải ('+Math.round(spent)+' ms/giây, lần '+trips+') \u{b7} tạm dừng 3 giây');spent=0;
          setTimeout(()=>{done=new WeakMap();attrDone=new WeakMap();walk(document.body);obs.observe(document.body,OPT);},3000);}
      });
      obs.observe(document.body,OPT);
    };
    if(document.body)go();else document.addEventListener('DOMContentLoaded',go);
  }
  // ----- Canvas
  function patchCanvas(){
    if(!EN)return;
    for(const P of [window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype]){
      if(!P||P.__lhI18n)continue;P.__lhI18n=true;
      for(const f of ['fillText','strokeText','measureText']){const o=P[f];if(typeof o!=='function')continue;
        P[f]=function(t,...r){return o.call(this,typeof t==='string'&&!rawDepth?tr(t):t,...r);};}
    }
  }
  let rawDepth=0;
  // Vẽ / đặt chữ không qua bản dịch (tên người chơi do người chơi tự đặt)
  function raw(fn){rawDepth++;try{return fn();}finally{rawDepth--;}}
  // ----- Từ điển
  function load(obj){if(obj)for(const k in obj)put(k,obj[k]);ready=true;done=new WeakMap();attrDone=new WeakMap();if(document.body&&EN)walk(document.body);while(waiters.length)waiters.shift()();}
  // Bảng Sheet: cột X_en đứng cạnh cột X (ten_en, mo_ta_en, ten_bo_en\u{2026})
  function addRows(data){
    if(!EN||!data)return;
    let n0=dict.size;for(const k in data){const rows=data[k];if(!Array.isArray(rows))continue;
      for(const r of rows){if(!r||typeof r!=='object')continue;for(const c in r){if(c.endsWith('_en')&&r[c]){const base=r[c.slice(0,-3)];if(base)put(base,r[c]);}}}}
    if(dict.size!==n0){done=new WeakMap();attrDone=new WeakMap();if(document.body)walk(document.body);}
  }
  function set(l){
    l=l==='en'?'en':'vi';try{localStorage.setItem('lh-lang',l);}catch(e){}
    const u=new URL(location.href);u.searchParams.set('lang',l);u.hash=u.hash.replace(/[?&#]?lang=\w+/i,'');
    location.replace(u.toString());
  }
  // Tải từ điển (gói dist/lang-en.js) khi đang ở chế độ English
  function fetchDict(base){
    if(!EN||ready||window.LH_LANG_EN||document.getElementById('lh-lang-en'))return;
    const s=document.createElement('script');s.id='lh-lang-en';s.charset='utf-8';s.src=(base||window.LH_BASE||'')+'lang-en.js';
    s.onerror=()=>{ready=true;};document.head.appendChild(s);
  }
  // Nút đổi ngôn ngữ: mọi phần tử có data-lh-lang (menu trong game, cổng đăng nhập, trang chủ)
  function paintLang(root){
    if(!EN||!root||!root.querySelectorAll)return;
    for(const b of root.querySelectorAll('[data-lh-lang]')){if(b.dataset.lhLang==='vi')continue;b.dataset.lhLang='vi';const sp=b.querySelector('span')||b;sp.textContent='Tiếng Việt';b.title='Chơi bằng tiếng Việt';}
  }
  try{document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-lh-lang]');if(!b)return;e.preventDefault();e.stopPropagation();
    const to=b.dataset.lhLang==='vi'?'vi':'en',sv=document.getElementById('saveBtn'),inGame=sv&&sv.offsetParent!==null;
    if(inGame){try{sv.click();}catch(x){}setTimeout(()=>set(to),1200);}else set(to);},true);}catch(e){}
  patchCanvas();startDom();
  if(window.LH_LANG_EN)load(window.LH_LANG_EN);
  else if(EN&&document.head){const cs=document.currentScript,me=cs&&cs.src?cs.src.replace(/[^\/]*$/,''):'';fetchDict(window.LH_BASE||me||window.LH_LANG_CDN||'');}
  return {lang,EN,tr,raw,load,addRows,set,fetchDict,put,
    ready:()=>ready?Promise.resolve():new Promise(ok=>waiters.push(ok)),
    loc:EN?'en-US':'vi-VN',
    size:()=>dict.size};
})();
window.LH_T=window.LH_I18N.tr;
;/* v10.63: Safari cũ (macOS / iOS trước Safari 16) chưa có ctx.roundRect \u{2192} báo "Lỗi vẽ: roundRect is not a function". Bổ sung thay thế (bán kính số hoặc mảng). */
(function(){const add=P=>{if(!P||P.roundRect)return;P.roundRect=function(x,y,w,h,r){let a=Array.isArray(r)?r:[r==null?0:r];a=a.map(v=>typeof v==='object'&&v?(v.x||0):(+v||0));
  const [tl,tr,br,bl]=a.length===1?[a[0],a[0],a[0],a[0]]:a.length===2?[a[0],a[1],a[0],a[1]]:a.length===3?[a[0],a[1],a[2],a[1]]:a;
  if(w<0){x+=w;w=-w;}if(h<0){y+=h;h=-h;}const m=Math.min(w,h)/2,k=v=>Math.max(0,Math.min(v,m));const A=k(tl),B=k(tr),C=k(br),D=k(bl);
  this.moveTo(x+A,y);this.lineTo(x+w-B,y);this.arcTo(x+w,y,x+w,y+B,B);this.lineTo(x+w,y+h-C);this.arcTo(x+w,y+h,x+w-C,y+h,C);this.lineTo(x+D,y+h);this.arcTo(x,y+h,x,y+h-D,D);this.lineTo(x,y+A);this.arcTo(x,y,x+A,y,A);this.closePath();return this;};};
  try{add(window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype);add(window.Path2D&&Path2D.prototype);add(window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype);}catch(e){}})();
/* ================= MÀN HÌNH CHỜ: thanh tải 0\u{2013}100%, cảnh làng + lời dẫn truyện =================
   Dùng chung cho file khởi động (tải tài nguyên trang) và game (kết nối máy chủ, tải nhân vật, dựng bản đồ). */
window.LH_Loader=window.LH_Loader||(()=>{
  const CSS=`#lh-loader{position:fixed;inset:0;z-index:2147483600;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px;background:#0d1712;color:#f3e6c4;font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;transition:opacity .5s;overflow:hidden}
#lh-loader.out{opacity:0;pointer-events:none}#lh-loader.quick{transition-duration:.22s}
#lh-loader canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0}
#lh-loader .lh-in{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:12px;width:min(520px,100%)}
#lh-loader .lh-logo{font:600 40px/1 Georgia,"Times New Roman",serif;color:#f6dc9c;letter-spacing:1px;text-shadow:0 2px 0 #3a1a0a,0 0 24px #e8b05a55}
#lh-loader .lh-sub{font-size:13px;color:#d8c9a0;letter-spacing:2px;text-transform:uppercase;margin-top:-4px}
#lh-loader .lh-story{min-height:0;max-width:520px;font:italic 17px/1.6 Georgia,"Times New Roman",serif;color:#fff2cf;text-shadow:0 1px 3px #000c}
#lh-loader .lh-story:empty{display:none}
#lh-loader .lh-bar{position:relative;width:100%;height:14px;border:1px solid #c9a35c;border-radius:9px;background:#1b130c;box-shadow:inset 0 1px 4px #000a;overflow:hidden}
#lh-loader .lh-fill{position:absolute;inset:0 auto 0 0;width:0;background:linear-gradient(90deg,#8a2e1c,#c8553a 45%,#f0c060);box-shadow:0 0 12px #f0b05a88}
#lh-loader .lh-row{display:flex;justify-content:space-between;width:100%;font-size:13px;color:#e9dcb4}
#lh-loader .lh-row b{color:#ffd98a;font-variant-numeric:tabular-nums}
#lh-loader .lh-go{margin-top:4px;padding:10px 22px;border-radius:10px;border:1px solid #e3b86f;background:linear-gradient(#a4452c,#7c2c1b);color:#fff3d6;font-weight:700;font-size:15px;cursor:pointer}
#lh-loader .lh-go[hidden]{display:none}`;
  let el,fill,pctEl,lbl,story,goBtn,cv,bgImg=null,shown=0,target=0,cap=0,raf=0,t0=0,scene=false,storyDone=Promise.resolve(),stuckCap=-1,stuckAt=0;
  // Ảnh tĩnh đã lưu từ lần vào trước (Sheet hinh_anh): logo, nền màn hình chờ
  const pics=()=>{try{return JSON.parse(localStorage.getItem('lh-img')||'{}')||{};}catch(e){return {};}};
  // v10.22: chặn phóng to trên điện thoại (chạm hai lần, chụm hai ngón) và ẩn giao diện trang chứa game
  let noZoom=false;
  function lockZoom(){if(noZoom)return;noZoom=true;try{document.documentElement.classList.add('lh-boot');let m=document.querySelector('meta[name=viewport]');if(!m){m=document.createElement('meta');m.name='viewport';document.head.appendChild(m);}m.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
    const s=document.createElement('style');s.textContent='html.lh-boot,html.lh-boot body{touch-action:manipulation;-webkit-text-size-adjust:100%}#lu-hanh,#lu-hanh *,#lh-loader,#lh-loader *{touch-action:manipulation}#lu-hanh canvas#scene,#lu-hanh .pad{touch-action:none}';document.head.appendChild(s);
    for(const ev of ['gesturestart','gesturechange'])document.addEventListener(ev,e=>e.preventDefault(),{passive:false});
    document.addEventListener('dblclick',e=>{if(!(e.target&&e.target.closest&&e.target.closest('input,textarea')))e.preventDefault();},{passive:false});
    document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length>1)e.preventDefault();},{passive:false});}catch(e){}}
  function mount(){
    lockZoom();const cv0=document.getElementById('lh-cover');if(cv0)cv0.remove();
    if(el&&document.body.contains(el))return;
    if(!document.getElementById('lh-loader-css')){const s=document.createElement('style');s.id='lh-loader-css';s.textContent=CSS;document.head.appendChild(s);}
    el=document.getElementById('lh-loader');
    if(!el){el=document.createElement('div');el.id='lh-loader';el.innerHTML='<canvas></canvas><div class="lh-in"><div class="lh-logo">L\u{1EEF} H\u{00E0}nh</div><div class="lh-sub">L\u{00E0}ng Thanh M\u{1ED9}c</div><p class="lh-story"></p><div class="lh-bar"><div class="lh-fill"></div></div><div class="lh-row"><span class="lh-lbl"></span><b class="lh-pct">0%</b></div><button class="lh-go" hidden>Ti\u{1EBF}p t\u{1EE5}c</button></div>';document.body.appendChild(el);}
    const P=pics();
    if(P['giao_dien:logo']){const lg=el.querySelector('.lh-logo');lg.innerHTML=`<img src="${P['giao_dien:logo'].replace(/"/g,'')}" alt="" referrerpolicy="no-referrer" style="max-width:240px;max-height:100px;object-fit:contain" onerror="this.parentNode.textContent='L\u{1EEF} H\u{00E0}nh'">`;}
    fill=el.querySelector('.lh-fill');pctEl=el.querySelector('.lh-pct');lbl=el.querySelector('.lh-lbl');story=el.querySelector('.lh-story');goBtn=el.querySelector('.lh-go');cv=el.querySelector('canvas');
  }
  // Tranh làng lúc hoàng hôn: núi xa, lũy tre, nhà sàn có đèn, người cha đội nón đi trên đường đất
  function paint(t){
    const w=cv.clientWidth||innerWidth,h=cv.clientHeight||innerHeight,d=Math.min(2,devicePixelRatio||1);
    if(cv.width!==Math.round(w*d)){cv.width=Math.round(w*d);cv.height=Math.round(h*d);}
    const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);
    if(bgImg&&bgImg.complete&&bgImg.naturalWidth){const s=Math.max(w/bgImg.naturalWidth,h/bgImg.naturalHeight),iw=bgImg.naturalWidth*s,ih=bgImg.naturalHeight*s;c.drawImage(bgImg,(w-iw)/2,(h-ih)/2,iw,ih);
      const v=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.2,w/2,h/2,Math.max(w,h)*.75);v.addColorStop(0,'#00000022');v.addColorStop(1,'#000000aa');c.fillStyle=v;c.fillRect(0,0,w,h);return;}
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1d2b3a');g.addColorStop(.45,'#7a4a3a');g.addColorStop(.62,'#e3a15a');g.addColorStop(.63,'#3d4a2e');g.addColorStop(1,'#141c12');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.fillStyle='#ffd98a';c.globalAlpha=.85;c.beginPath();c.arc(w*.72,h*.5,Math.min(w,h)*.07,0,Math.PI*2);c.fill();c.globalAlpha=1;
    const hill=(y,amp,col,ph)=>{c.fillStyle=col;c.beginPath();c.moveTo(0,h);for(let x=0;x<=w;x+=8)c.lineTo(x,y+Math.sin(x*.006+ph)*amp+Math.sin(x*.017+ph*2)*amp*.4);c.lineTo(w,h);c.fill();};
    hill(h*.55,h*.05,'#4a3a40',1);hill(h*.6,h*.035,'#2f3a2c',2.4);
    c.fillStyle='#1f2a1c';for(let i=0;i<34;i++){const x=(i*61)%w,bh=h*(.14+((i*37)%10)/80),sw=Math.sin(t*1.3+i)*3;c.beginPath();c.moveTo(x-3,h*.64);c.quadraticCurveTo(x+sw,h*.64-bh*.6,x+sw*2,h*.64-bh);c.quadraticCurveTo(x+sw+3,h*.64-bh*.6,x+3,h*.64);c.fill();}
    const hx=w*.22,hy=h*.64;c.fillStyle='#2a1d14';c.fillRect(hx-46,hy-36,92,34);c.fillRect(hx-40,hy-2,4,10);c.fillRect(hx+36,hy-2,4,10);
    c.fillStyle='#3a2a1a';c.beginPath();c.moveTo(hx-62,hy-34);c.lineTo(hx,hy-78);c.lineTo(hx+62,hy-34);c.fill();
    c.fillStyle='#ffcf7a';c.globalAlpha=.7+Math.sin(t*3)*.15;c.fillRect(hx-10,hy-28,20,16);c.globalAlpha=1;
    c.fillStyle='#4a3a26';c.beginPath();c.moveTo(w*.3,h);c.quadraticCurveTo(w*.5,h*.78,w*.62,h*.66);c.lineTo(w*.66,h*.66);c.quadraticCurveTo(w*.58,h*.8,w*.52,h);c.fill();
    const k=Math.min(w,h)/700,px=w*(.6-((t*.012)%.25)),py=h*.72+(.6-px/w)*h*.6,step=Math.sin(t*4);
    c.save();c.translate(px,py);c.scale(k*1.6,k*1.6);c.fillStyle='#120d0a';
    c.beginPath();c.moveTo(-14,-42);c.lineTo(0,-54);c.lineTo(14,-42);c.fill();c.fillRect(-5,-42,10,8);c.fillRect(-7,-34,14,22);
    c.fillRect(-6+step*3,-12,4,14);c.fillRect(2-step*3,-12,4,14);c.fillRect(6,-32,3,16);c.restore();
    const v=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.2,w/2,h/2,Math.max(w,h)*.75);v.addColorStop(0,'#00000000');v.addColorStop(1,'#000000aa');c.fillStyle=v;c.fillRect(0,0,w,h);
  }
  function tick(ts){
    raf=requestAnimationFrame(tick);const t=ts/1000;
    // thanh chạy mượt về mốc đã đạt; trong lúc chờ mạng thì nhích dần tới sát mốc kế tiếp
    if(target<cap)target=Math.min(cap-1,target+(cap-target)*.006+.01);
    shown+=(target-shown)*.12;if(Math.abs(target-shown)<.05)shown=target;
    // v10.70: kẹt quá 40 giây ở một mốc (mạng treo, lệnh không trả lời) thì hiện nút Tải lại thay vì đứng im mãi
    if(cap!==stuckCap){stuckCap=cap;stuckAt=Date.now();}
    else if(cap<100&&Date.now()-stuckAt>40000&&goBtn.hidden&&!goBtn.dataset.retry){goBtn.dataset.retry='1';goBtn.textContent='T\u{1EA3}i l\u{1EA1}i';goBtn.hidden=false;goBtn.onclick=()=>location.reload();lbl.textContent='Mạng chậm hoặc máy chủ chưa trả lời\u{2026}';}
    fill.style.width=shown.toFixed(1)+'%';pctEl.textContent=Math.floor(shown)+'%';
    if(scene)paint(t);
  }
  const L={
    show(opt={}){
      mount();el.classList.remove('out');el.hidden=false;
      // ảnh nền màn hình chờ theo từng lúc (Sheet hinh_anh): nen_cho_tai_game, nen_cho_tao_nv, nen_cho_vao_lang; không có thì dùng nen_cho
      const P=pics(),src=P['giao_dien:nen_cho_'+(opt.bg||'')]||P['giao_dien:nen_cho']||'';
      if(src){if(!bgImg||bgImg.dataset.src!==src){bgImg=new Image();bgImg.referrerPolicy='no-referrer';bgImg.dataset.src=src;bgImg.src=src;}}else bgImg=null;
      scene=!!opt.scene||!!opt.story||!!bgImg;cv.style.display=scene?'':'none';
      if(!opt.keep){shown=target=cap=0;}story.textContent='';goBtn.hidden=true;delete goBtn.dataset.retry;goBtn.textContent='Ti\u{1EBF}p t\u{1EE5}c';goBtn.onclick=null;stuckCap=-1;lbl.textContent=opt.label||'';
      if(opt.story){
        const words=String(opt.story).split(' ');let i=0;
        // chạm màn hình để hiện hết lời dẫn
        el.onclick=()=>{i=words.length-1;};
        storyDone=new Promise(ok=>{const iv=setInterval(()=>{if(!el||el.hidden){clearInterval(iv);ok();return;}story.textContent=words.slice(0,++i).join(' ');if(i>=words.length){clearInterval(iv);el.onclick=null;setTimeout(ok,1400);}},opt.speed||160);});
      }else storyDone=Promise.resolve();
      if(!raf)raf=requestAnimationFrame(tick);t0=Date.now();return L;
    },
    // pct: mốc vừa xong; next: mốc kế tiếp (thanh nhích dần trong lúc chờ)
    step(pct,label,next){mount();target=Math.max(target,pct);cap=Math.max(target,next||pct);if(label!=null)lbl.textContent=label;return L;},
    async done(opt={}){
      mount();target=cap=100;lbl.textContent=opt.label||'S\u{1EB5}n s\u{00E0}ng';if(goBtn.dataset.retry){goBtn.hidden=true;delete goBtn.dataset.retry;goBtn.onclick=null;}
      if(!opt.fast)await new Promise(r=>setTimeout(r,450)); // v10.71: chuyển bản đồ (fast) không đợi thêm, mờ nhanh hơn \u{2014} bớt ~0,4 giây mỗi lần qua cổng
      await storyDone;
      if(opt.confirm){goBtn.hidden=false;await new Promise(ok=>{goBtn.onclick=ok;});}
      const wait=Math.max(0,(opt.min||0)-(Date.now()-t0));if(wait)await new Promise(r=>setTimeout(r,wait));
      el.classList.toggle('quick',!!opt.fast);el.classList.add('out');await new Promise(r=>setTimeout(r,opt.fast?230:500));el.hidden=true;el.classList.remove('quick');cancelAnimationFrame(raf);raf=0;
    },
    hide(){if(!el)return;el.classList.add('out');setTimeout(()=>{el.hidden=true;},500);cancelAnimationFrame(raf);raf=0;},
    get visible(){return !!el&&!el.hidden&&!el.classList.contains('out');}
  };
  return L;
})();
;/* ================= KHỞI ĐỘNG: hiện màn hình chờ ngay, tải CSS + JS của game có đếm phần trăm ================= */
(function(){
  var me=document.currentScript,base=(me&&me.src||'').replace(/[^\/]*$/,''),FILES={"css":{"name":"lu-hanh.css","size":57714},"js":{"name":"lu-hanh.js","size":387168},"game":{"name":"lu-hanh-game.js","size":471454}};
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
  // v10.32: CSS + JS tải song song, chung một thanh tiến trình (0\u{2013}70%)
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
