/* ================= NGÔN NGỮ (v10.78): tiếng Việt / English =================
   Mã nguồn giữ nguyên chữ tiếng Việt. Ở chế độ English, chữ được đổi lúc hiện ra màn hình:
   - Chữ trong trang (DOM): MutationObserver đổi từng nút chữ + thuộc tính title / placeholder / aria-label / alt.
   - Chữ vẽ lên canvas: bọc fillText / strokeText / measureText.
   Từ điển (tools/i18n/en.json → dist/lang-en.js) ánh xạ từng đoạn chữ tiếng Việt → tiếng Anh; đoạn dài khớp trước.
   Tên trên Sheet có cột ten_en / mo_ta_en… thì dùng luôn (LH_I18N.addRows), không cần sửa từ điển.
   Luật chơi, dữ liệu, máy chủ không đổi gì: hai ngôn ngữ chơi chung một thế giới.
   Chọn ngôn ngữ: ?lang=en | ?lang=vi trên đường dẫn → window.LH_LANG → localStorage lh-lang → tiếng Việt. */
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
  const dict=new Map(),byFirst=new Map(),cache=new Map(),outs=new Set();let ready=false;const waiters=[]; // outs: chuỗi đã là bản dịch → không dịch lần nữa
  const firstWord=s=>{const m=/^[\p{L}\p{M}]+/u.exec(s);return m?m[0]:'';};
  // Chữ không dấu (Nam, Mua, Voi…): chỉ đổi khi đứng một mình (bỏ số, dấu câu hai bên)
  const ascii=new Map();
  const core=s=>{const m=/^([^\p{L}]*)(.*?)([^\p{L}]*)$/su.exec(s);return m?m:['',s,'',''];};
  function put(vi,en){
    vi=String(vi||'').trim();en=String(en==null?'':en).trim();
    if(vi&&!VI.test(vi)){if(en&&/^[A-Za-z][A-Za-z ]*$/.test(vi)){ascii.set(vi,en);cache.clear();}return;}
    if(!vi||!VI.test(vi))return;
    if(!en&&!/^[a-zđ]/.test(vi))return; // chuỗi rỗng chỉ cho đại từ viết thường (chú, cô…)
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
  // v10.80: data-noi18n trên <body> (kèm data-lh-root) chỉ để script song ngữ của theme Blogspot bỏ qua trang game — bộ dịch của game vẫn dịch bên trong
  const skipEl=el=>!!(el&&el.closest&&el.closest('script,style,textarea,input,[contenteditable],[data-noi18n]:not([data-lh-root])'));
  // v10.80: theme trang chủ cũng có bộ dịch riêng chạy trên mọi trang. Hai bộ dịch cùng sửa chữ game → vòng lặp vô tận
  // ("Sa mạc" → "Sa mạc · Desert" → "Sa mạc · Desert · Desert"…), bấm bản đồ nhỏ là đơ. Đánh dấu <body> để theme không đụng vào trang game.
  const fenceHome=()=>{try{const b=document.body;if(b&&!b.hasAttribute('data-lh-root')){b.setAttribute('data-lh-root','');b.setAttribute('data-noi18n','');}}catch(e){}};
  // v10.79: chống giành giật — nút chữ bị mã game ghi lại liên tục (>20 lần / giây) thì thôi dịch nút đó, không để hai bên ghi qua ghi lại làm đơ
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
    fenceHome();
    const go=()=>{
      fenceHome();try{document.documentElement.lang='en';}catch(e){}
      walk(document.body);paintLang(document.body);
      // v10.79: cầu chì — bản dịch tốn quá 250 ms trong 1 giây (vòng lặp với mã khác) thì tạm dừng 3 giây, ghi vào Tình trạng, không để trang đơ
      let spent=0,win=0,trips=0;
      const OPT={subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS.concat(['value'])};
      obs=new MutationObserver(list=>{const t0=performance.now();if(t0-win>1000){win=t0;spent=0;}
        for(const m of list){
          if(m.type==='characterData'){if(want(m.target.data))fixText(m.target);}
          else if(m.type==='attributes'){if(m.target.nodeType===1)fixAttrs(m.target);}
          else for(const a of m.addedNodes){walk(a);if(a.nodeType===1){if(a.matches&&a.matches('[data-lh-lang]'))paintLang(a.parentNode);else paintLang(a);}}
        }
        spent+=performance.now()-t0;
        if(spent>250){obs.disconnect();trips++;diag('Dịch chữ quá tải ('+Math.round(spent)+' ms/giây, lần '+trips+') · tạm dừng 3 giây');spent=0;
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
  // Bảng Sheet: cột X_en đứng cạnh cột X (ten_en, mo_ta_en, ten_bo_en…)
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
