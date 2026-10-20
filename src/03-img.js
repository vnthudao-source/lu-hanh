/* ================= ẢNH TĨNH (Sheet "LH · Hình ảnh", tab hinh_anh) =================
   Mỗi dòng: nhom + ma + link_anh. Dán link ảnh Google Drive (chia sẻ "Bất kỳ ai có đường liên kết") hoặc link ảnh bất kỳ.
   Ô link để trống, hoặc ảnh không tải được: dùng biểu tượng / hình vẽ mặc định của game.
   Thay ảnh bằng cách tải phiên bản mới lên cùng file Drive: chạy lamMoiAnh (Apps Script) để game tải lại ảnh đó.
   nhom: bieu_tuong (biểu tượng giao diện) · vat_pham (đồ dùng) · quai (quái vật) · npc (dân làng) · giao_dien (logo, nền, chân dung, túi đồ rơi) */
const LH_IMG=(()=>{
  const KEY='lh-img',MAP={},PIC={},ORIG={};
  // Link Drive (file/d/ID/view, open?id=ID, uc?id=ID…) → link ảnh xem trực tiếp
  function direct(u){
    u=String(u||'').trim();if(!u)return '';
    const m=/(?:drive|docs)\.google\.com/.test(u)&&(u.match(/\/d\/([\w-]{20,})/)||u.match(/[?&]id=([\w-]{20,})/));
    if(m)return 'https://lh3.googleusercontent.com/d/'+m[1];
    return /^https?:\/\/\S+$/.test(u)||/^data:image\//.test(u)?u:'';
  }
  // v10.32: ảnh Drive (lh3) xin đúng cỡ cần dùng thay vì file gốc (nền 800 KB → ~100–200 KB): =w<rộng> theo nhóm, nền theo cỡ màn hình
  const scr=()=>{try{const w=Math.max(screen.width||0,screen.height||0,innerWidth||0,innerHeight||0)*Math.min(1.5,devicePixelRatio||1);return Math.min(1600,Math.max(640,Math.ceil(w/320)*320));}catch(e){return 1280;}};
  function sized(u,k){
    if(NOSIZE||!/^https:\/\/lh3\.googleusercontent\.com\/d\/[\w-]+$/.test(u))return u;
    const g=k.split(':')[0],m=k.split(':')[1]||'',w=g==='bieu_tuong'?96:g==='vat_pham'?128:g==='quai'||g==='npc'?320:g==='giao_dien'?(/^nen/.test(m)?scr():m==='logo'?480:/^chan_dung/.test(m)?256:160):0;
    return w?u+'=w'+w:u;
  }
  // nếu Drive không trả ảnh thu nhỏ (=w…) thì nhớ lại và dùng ảnh gốc như trước
  let NOSIZE=false;try{NOSIZE=localStorage.getItem('lh-img-nosize')==='1';}catch(e){}
  function probe(){if(NOSIZE||typeof Image==='undefined')return;const k=Object.keys(MAP).find(k=>/=w\d+/.test(MAP[k]));if(!k)return;const im=new Image();im.referrerPolicy='no-referrer';
    im.onerror=()=>{const o=new Image();o.referrerPolicy='no-referrer';o.onload=()=>off();o.src=String(MAP[k]).replace(/=w\d+(?=\?|$)/,'');};im.src=MAP[k];
    function off(){NOSIZE=true;try{localStorage.setItem('lh-img-nosize','1');}catch(e){}const m={};for(const [k,u] of Object.entries(MAP))m[k]=String(u).replace(/=w\d+(?=\?|$)/,'');try{localStorage.setItem(KEY,JSON.stringify(m));}catch(e){}load(m);}}
  // v10.51: đồ dùng chung ảnh với đồ khác (Hổ trắng Tây Bắc của nhiệm vụ Vịt con = ảnh Hổ trắng Tây Bắc bán ở Thăng Long)
  const ALIAS={'vat_pham:ho-trang-vit':'vat_pham:ho-trang'};
  const url=key=>MAP[key]||(ALIAS[key]&&MAP[ALIAS[key]])||'';
  const attr=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  // Biểu tượng HTML: ảnh nếu có, lỗi thì quay về biểu tượng mặc định
  function icon(key,fb,color){
    const s=`<svg class="icon" aria-hidden="true"${color?` style="color:${color}"`:''}><use href="#i-${fb}"/></svg>`,u=url(key);
    // ảnh nằm trong khung <svg class="icon"> để giữ đúng cỡ biểu tượng ở mọi chỗ
    return u?`<svg class="icon pic" viewBox="0 0 32 32" aria-hidden="true"${color?` style="color:${color}"`:''}><image href="${attr(u)}" width="32" height="32" preserveAspectRatio="xMidYMid meet" onerror="const e=document.createElementNS('http://www.w3.org/2000/svg','use');e.setAttribute('href','#i-${fb}');this.replaceWith(e)"/></svg>`:s;
  }
  // Ảnh cho canvas (quái, NPC, túi đồ, vũ khí cầm tay): chỉ trả về khi đã tải xong
  // v10.12: chỉ tải trước ảnh giao diện (nền, logo, chân dung); ảnh quái, NPC, đồ vật tải khi lần đầu cần vẽ (warm để tải sớm khi vào bản đồ)
  function want(key){const u=url(key);if(!u||/^bieu_tuong:/.test(key))return null;let p=PIC[key];if(!p||p.src!==u){p=new Image();p.referrerPolicy='no-referrer';p.src=u;PIC[key]=p;}return p;}
  function pic(key){const p=PIC[key]||want(key);return p&&p.complete&&p.naturalWidth>0?p:null;}
  const warm=keys=>{for(const k of keys||[])want(k);};
  // Biểu tượng giao diện: thay nội dung <symbol id="i-…"> bằng ảnh, mọi chỗ dùng biểu tượng đó tự đổi theo
  function applyIcons(){
    if(typeof document==='undefined')return;
    for(const [id,html] of Object.entries(ORIG)){const s=document.getElementById('i-'+id);if(s&&!MAP['bieu_tuong:'+id]){s.innerHTML=html;delete ORIG[id];}}
    for(const [k,u] of Object.entries(MAP)){
      if(!k.startsWith('bieu_tuong:'))continue;const id=k.slice(11),s=document.getElementById('i-'+id);if(!s)continue;
      if(!(id in ORIG))ORIG[id]=s.innerHTML;
      const vb=(s.getAttribute('viewBox')||'0 0 32 32').split(/\s+/).map(Number);
      // thử tải trước: lỗi thì giữ biểu tượng cũ
      const im=new Image();im.referrerPolicy='no-referrer';im.onload=()=>{s.innerHTML=`<image href="${attr(u)}" x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" preserveAspectRatio="xMidYMid meet"/>`;};im.src=u;
    }
  }
  function load(map){
    for(const k of Object.keys(MAP))delete MAP[k];Object.assign(MAP,map);
    // ảnh riêng của vật phẩm (cột anh trong tab vat_pham: thẻ avatar, khung, nền, đồ cốt truyện) khi tab hinh_anh chưa có dòng riêng
    if(typeof Player!=='undefined')for(const [k,d] of Object.entries(Player.items||{}))if(d.img&&!MAP['vat_pham:'+k])MAP['vat_pham:'+k]=sized(direct(d.img)||d.img,'vat_pham:'+k);
    // v10.32: chỉ tải ngay ảnh của màn hình đầu (logo, nền đăng nhập, căn lều, chân dung, túi rơi); ảnh màn chờ khác tải lúc rảnh
    const now=k=>/^giao_dien:(logo|nen_dang_nhap|nen_leu|chan_dung|tui_do_roi)/.test(k),later=Object.keys(MAP).filter(k=>/^giao_dien:/.test(k)&&!now(k));
    for(const k of Object.keys(MAP))if(now(k))want(k);
    if(later.length&&typeof window!=='undefined'){const go=()=>later.forEach(k=>want(k));if(window.requestIdleCallback)requestIdleCallback(()=>setTimeout(go,2500),{timeout:6000});else setTimeout(go,4000);}
    applyIcons();probe();
  }
  // rows: [{nhom, ma, link_anh}] từ máy chủ
  function set(rows){
    const map={};for(const r of rows||[]){const k=String(r.nhom||'').trim()+':'+String(r.ma||'').trim();let u=sized(direct(r.link_anh),k);
      // v: phiên bản ảnh (giờ sửa file trên Drive, hàm lamMoiAnh ghi vào cột phien_ban) → thay file cùng link thì trình duyệt vẫn tải ảnh mới
      if(u&&r.v&&!/^data:/.test(u))u+=(u.includes('?')?'&':'?')+'v='+encodeURIComponent(String(r.v));
      if(u&&k.length>2)map[k]=u;}
    try{localStorage.setItem(KEY,JSON.stringify(map));}catch(e){}
    load(map);
  }
  try{const c=JSON.parse(localStorage.getItem(KEY)||'{}');if(c&&typeof c==='object')load(c);}catch(e){}
  return {set,url,icon,pic,warm,direct,get map(){return {...MAP};}};
})();
