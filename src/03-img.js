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
  const url=key=>MAP[key]||'';
  const attr=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  // Biểu tượng HTML: ảnh nếu có, lỗi thì quay về biểu tượng mặc định
  function icon(key,fb,color){
    const s=`<svg class="icon" aria-hidden="true"${color?` style="color:${color}"`:''}><use href="#i-${fb}"/></svg>`,u=url(key);
    // ảnh nằm trong khung <svg class="icon"> để giữ đúng cỡ biểu tượng ở mọi chỗ
    return u?`<svg class="icon pic" viewBox="0 0 32 32" aria-hidden="true"${color?` style="color:${color}"`:''}><image href="${attr(u)}" width="32" height="32" preserveAspectRatio="xMidYMid meet" onerror="const e=document.createElementNS('http://www.w3.org/2000/svg','use');e.setAttribute('href','#i-${fb}');this.replaceWith(e)"/></svg>`:s;
  }
  // Ảnh cho canvas (quái, NPC, túi đồ, vũ khí cầm tay): chỉ trả về khi đã tải xong
  // v10.12: chỉ tải trước ảnh giao diện (nền, logo, chân dung); ảnh quái, NPC, đồ vật tải khi lần đầu cần vẽ (warm để tải sớm khi vào bản đồ)
  function want(key){const u=MAP[key];if(!u||/^bieu_tuong:/.test(key))return null;let p=PIC[key];if(!p||p.src!==u){p=new Image();p.referrerPolicy='no-referrer';p.src=u;PIC[key]=p;}return p;}
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
    if(typeof Player!=='undefined')for(const [k,d] of Object.entries(Player.items||{}))if(d.img&&!MAP['vat_pham:'+k])MAP['vat_pham:'+k]=d.img;
    for(const k of Object.keys(MAP))if(/^giao_dien:/.test(k))want(k);
    applyIcons();
  }
  // rows: [{nhom, ma, link_anh}] từ máy chủ
  function set(rows){
    const map={};for(const r of rows||[]){let u=direct(r.link_anh);const k=String(r.nhom||'').trim()+':'+String(r.ma||'').trim();
      // v: phiên bản ảnh (giờ sửa file trên Drive, hàm lamMoiAnh ghi vào cột phien_ban) → thay file cùng link thì trình duyệt vẫn tải ảnh mới
      if(u&&r.v&&!/^data:/.test(u))u+=(u.includes('?')?'&':'?')+'v='+encodeURIComponent(String(r.v));
      if(u&&k.length>2)map[k]=u;}
    try{localStorage.setItem(KEY,JSON.stringify(map));}catch(e){}
    load(map);
  }
  try{const c=JSON.parse(localStorage.getItem(KEY)||'{}');if(c&&typeof c==='object')load(c);}catch(e){}
  return {set,url,icon,pic,warm,direct,get map(){return {...MAP};}};
})();
