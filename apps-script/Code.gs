/* ================= LỮ HÀNH · APPS SCRIPT (Code.gs) =================
   Cách dùng:
   1. Vào script.google.com → Dự án mới → dán toàn bộ file này vào Code.gs → Lưu.
   2. Chọn hàm caiDat → Chạy (một lần). Google sẽ hỏi quyền đọc/ghi Sheet và gửi email: đồng ý.
      Hàm này đổ dữ liệu mặc định vào các file Sheet còn trống trong thư mục "Lữ Hành · Dữ liệu game" và tạo bảng người chơi.
      Lưu ý: dùng đúng tài khoản Google đang sở hữu thư mục đó.
   3. Triển khai → Tùy chọn triển khai mới → Loại: Ứng dụng web → Thực thi với tư cách: Tôi → Ai có quyền truy cập: Bất kỳ ai → Triển khai.
   4. Sao chép URL ứng dụng web (đuôi /exec), dán vào dòng const LH_API='' trong code game trên Blogspot.
   Sửa số liệu trong các file Sheet xong, chạy hàm xoaBoNhoDem để game nhận ngay (nếu không, tối đa 2 phút).
   v8.9: chạy kiemTra để thêm dòng ảnh màn hình chờ, cảnh căn lều vào file Hình ảnh. Chợ phiên ký gửi bằng hồng ngọc.
   v9.7: hàm capNhatAnh: ghi gợi ý vẽ ảnh (webp), cột gioi_tinh, ghi_chu vào file Hình ảnh và chép ảnh vật phẩm game vẽ sẵn vào thư mục Drive.
   v9.3: đọc đúng dòng cần (không đọc cả bảng), chống chạy lệnh 2 lần (mã rid), dọn bảng chợ hằng ngày (hàm donCho, tab cho_cu). Chạy caiDat một lần để tạo lịch dọn chợ.
   v8.8: doGet nhận lệnh nhỏ qua ?p= (dự phòng cho trình duyệt điện thoại không gửi POST được).
   v8.5: thêm cột token_cu (tai_khoan): mỗi tài khoản chỉ đăng nhập một thiết bị, đăng nhập nơi khác thì thiết bị cũ bị đẩy ra. Tự thêm khi chạy.
   v8.4: thêm tab vu_khi (trong file vat_pham): sát thương, tầm đánh, tốc đánh, mana của 6 loại vũ khí; file mới "LH · Hình ảnh" (tab hinh_anh): dán link ảnh Drive để thay biểu tượng, đồ, quái, NPC. Chạy caiDat một lần.
   v8.3: thêm cột gia_hong_ngoc (nhan_vat), hong_ngoc, hong_ngoc_nhan (cho): cho thuê nhân vật bằng hồng ngọc. Tự thêm khi chạy.
   v8.1: thêm cột cap, kinh_nghiem ở bảng nhan_vat (tự thêm khi chạy). Lên cấp, điểm cộng chỉ số do máy chủ tính.
   v8: máy chủ giữ tiền, hồng ngọc, đồ của nhân vật và tự tính rơi đồ, gia cường. Có thêm trang Chợ phiên dùng chung máy chủ này.
*/
const LH_SHEETS={
 "cau_hinh": "19zg1YKz8YX82YHh-wA_dFJIjbNho9KVpOCVqo1DelJw",
 "pham_chat": "1MAqtc8dBC6u-HK0biNNgkvZg0lb0Z_CvSf9WE6pyOQg",
 "vat_pham": "1fY54IZrh1cUYwGcUGqqrhbu3NnAifIEp33t1YO5w6Cs",
 "cua_hang": "1Yc6SJUh5hrJbsuieyNKsn2LRWNyFEkVL6397vr-NWos",
 "bo_huyen_thoai": "1MqlD-n4q5tly5_q92tdhw8iSyquf1l2SoKyas6WvwUo",
 "do_than": "1EuWyQtEPjC6txoSPeA-PClvEuFIDurAJA4O6f4_PDfY",
 "quai": "1o303UjsvXHMPQ07h1m-1t9sJcp6heLu-h5b0LHZAUik",
 "nhiem_vu": "1Hl4SDBmUmK-PJ4FXwl3dwzeG1n5nyAlx_o8Kbx47GyY",
 "linh": "15xB5TtDwOMc70mPptKQjcfk9pp4vKInFeeThJd_kAPw",
 "nguoi_choi": "1L6Qwt5u_F4ZeaBSA7zXEugVK8htDX4AOv1IxBpXxsPg",
 "hinh_anh": "1veOUExwMQ1_ATbhaGm1KSmH4mB-ncLe0Ewfe6x3vyzw"
};
// Tab dữ liệu tĩnh → file Sheet chứa nó
const LH_STATIC={cau_hinh:'cau_hinh',gia_cuong:'cau_hinh',pham_chat:'pham_chat',thuoc_tinh:'pham_chat',vat_pham:'vat_pham',cua_hang:'cua_hang',bo_huyen_thoai:'bo_huyen_thoai',do_than:'do_than',quai:'quai',nhiem_vu:'nhiem_vu',linh:'linh',vu_khi:'vat_pham',hinh_anh:'hinh_anh'};
// Cột của các bảng người chơi (file "LH · Người chơi")
const LH_COLS={
  tai_khoan:['id','username','email','muoi','mat_khau','tao_luc','token','token_het_han','ma_khoi_phuc','ma_het_han','token_cu'],
  nhan_vat:['id','tai_khoan','ten','ten_khoa','gioi_tinh','suc_manh','nhanh_nhen','suc_khoe','tri_tue','trang_thai','gia_danh_thue','nguoi_mua','luu','tao_luc','cap_nhat','cap','kinh_nghiem','gia_hong_ngoc'],
  cho:['id','loai','nguoi_ban','nhan_vat_ban','ten_nguoi_ban','vat_pham','gia','tien_nhan','trang_thai','nguoi_mua','tao_luc','ban_luc','da_nhan','hong_ngoc','hong_ngoc_nhan']
};
function lhRows_(sh,cols){
  const v=sh.getDataRange().getValues();if(v.length<2)return [];
  const h=cols||v[0].map(String);
  return v.slice(1).map((r,i)=>{const o={_r:i+2};h.forEach((k,j)=>{if(k)o[k]=r[j]===null||r[j]===undefined?'':(r[j] instanceof Date?r[j].toISOString():r[j]);});return o;});
}
function lhStatic_(){
  const cache=CacheService.getScriptCache(),hit=cache.get('lh-data');if(hit)return JSON.parse(hit);
  const out={},books={};
  for(const [tab,file] of Object.entries(LH_STATIC)){
    if(!LH_SHEETS[file]){out[tab]=LH_DEFAULT[tab]||[];continue;}
    const ss=books[file]||(books[file]=SpreadsheetApp.openById(LH_SHEETS[file]));
    const sh=ss.getSheetByName(tab)||(tab==='hinh_anh'?ss.getSheets()[0]:null);if(!sh||sh.getLastRow()<2){out[tab]=LH_DEFAULT[tab]||[];continue;}out[tab]=sh?lhRows_(sh).filter(r=>Object.keys(r).some(k=>k!=='_r'&&r[k]!=='')).map(r=>{delete r._r;return r;}):[];
  }
  // Ảnh tĩnh: chỉ gửi các dòng đã dán link
  out.hinh_anh=(out.hinh_anh||[]).filter(r=>String(r.link_anh||'').trim()).map(r=>({nhom:r.nhom,ma:r.ma,link_anh:String(r.link_anh).trim()}));
  const s=JSON.stringify(out);if(s.length<95000)cache.put('lh-data',s,120);
  return out;
}
const LH_DB=(()=>{
  let ss=null;const cache={},rc={};
  // một dòng (đọc một lần mỗi lượt gọi)
  function rowAt(t,r){const key=t+'#'+r;if(rc[key])return rc[key];const n=LH_COLS[t].length,v=sheet(t).getRange(r,1,1,n).getValues()[0],o={_r:r};LH_COLS[t].forEach((c,i)=>{const x=v[i];o[c]=x===null||x===undefined?'':String(x instanceof Date?x.toISOString():x);});return rc[key]=o;}
  const book=()=>ss||(ss=SpreadsheetApp.openById(LH_SHEETS.nguoi_choi));
  function sheet(t){let sh=book().getSheetByName(t);if(!sh){sh=book().insertSheet(t);sh.getRange(1,1,1,LH_COLS[t].length).setValues([LH_COLS[t]]);sh.setFrozenRows(1);sh.getRange('A:Z').setNumberFormat('@');}else if(sh.getLastColumn()<LH_COLS[t].length)sh.getRange(1,1,1,LH_COLS[t].length).setValues([LH_COLS[t]]);return sh;}
  const row=(t,o)=>LH_COLS[t].map(k=>o[k]===undefined||o[k]===null?'':String(o[k]));
  return {
    // Chỉ đọc đúng các dòng có cột k = v (tìm bằng TextFinder trên một cột), không đọc cả bảng
    where(t,k,v){
      if(cache[t])return cache[t].filter(o=>o[k]===v);
      const sh=sheet(t),col=LH_COLS[t].indexOf(k)+1,last=sh.getLastRow();if(col<1||last<2)return [];
      const rg=sh.getRange(2,col,last-1,1);
      if(!rg.createTextFinder)return this.rows(t).filter(o=>o[k]===v);
      return rg.createTextFinder(v).matchEntireCell(true).matchCase(true).findAll().map(h=>rowAt(t,h.getRow())).filter(o=>o.id&&o[k]===v);
    },
    find(t,k,v){return this.where(t,k,v)[0]||null;},
    // mỗi lượt gọi đọc dữ liệu mới (không dùng lại bản đọc của lượt trước)
    fresh(){for(const k of Object.keys(cache))delete cache[k];for(const k of Object.keys(rc))delete rc[k];},
    rows(t){if(!cache[t])cache[t]=lhRows_(sheet(t),LH_COLS[t]).map(o=>{for(const k of LH_COLS[t])o[k]=String(o[k]);return o;}).filter(o=>o.id);return cache[t];},
    insert(t,o){const sh=sheet(t);sh.appendRow(row(t,o));o._r=sh.getLastRow();rc[t+'#'+o._r]=o;if(cache[t])cache[t].push(o);},
    update(t,o){const sh=sheet(t);if(!o._r){const f=this.rows(t).find(x=>x.id===o.id);if(!f)throw Error('KHONG_THAY_DONG');o._r=f._r;}sh.getRange(o._r,1,1,LH_COLS[t].length).setValues([row(t,o)]);}
  };
})();
const LH_RULES={ok:false};
const LH=LH_Core({
  rows:t=>LH_DB.rows(t),find:(t,k,v)=>LH_DB.find(t,k,v),where:(t,k,v)=>LH_DB.where(t,k,v),insert:(t,o)=>LH_DB.insert(t,o),update:(t,o)=>LH_DB.update(t,o),
  mail:(to,subject,body)=>MailApp.sendEmail(to,subject,body),
  hash:s=>Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8).map(b=>((b+256)%256).toString(16).padStart(2,'0')).join(''),
  now:()=>Date.now(),uid:()=>Utilities.getUuid().replace(/-/g,'').slice(0,12),staticData:lhStatic_,
  rules:()=>{if(!LH_RULES.ok){Player.load(lhStatic_());LH_RULES.ok=true;}},
  lock:fn=>{const l=LockService.getScriptLock();l.waitLock(15000);try{return fn();}finally{l.releaseLock();}}
});
// Lệnh ghi có mã rid: gửi lại cùng mã (mạng rớt, đổi đường GET/POST) thì trả lại kết quả cũ, không chạy lần hai
function lhRun_(p){
  LH_DB.fresh();
  const rid=String(p.rid||'').slice(0,40);if(!rid)return JSON.stringify(LH.handle(p.action,p));
  const c=CacheService.getScriptCache(),k='rid:'+rid;let hit=c.get(k);
  for(let i=0;hit==='…'&&i<40;i++){Utilities.sleep(500);hit=c.get(k);}
  if(hit&&hit!=='…')return hit;
  c.put(k,'…',120);let out;
  try{out=JSON.stringify(LH.handle(p.action,p));}catch(err){c.remove(k);throw err;}
  if(out.length<95000)c.put(k,out,900);else c.remove(k);
  return out;
}
function doPost(e){
  let p={};try{p=JSON.parse(e.postData.contents);}catch(err){}
  return ContentService.createTextOutput(lhRun_(p)).setMimeType(ContentService.MimeType.JSON);
}
// GET: không tham số = kiểm tra máy chủ; ?p={...} = lệnh nhỏ (đường dự phòng khi trình duyệt không POST được)
function doGet(e){
  const q=e&&e.parameter&&e.parameter.p;let p={};if(q){try{p=JSON.parse(q);}catch(err){}}
  return ContentService.createTextOutput(q?lhRun_(p):JSON.stringify(LH.handle('ping',{}))).setMimeType(ContentService.MimeType.JSON);
}
function xoaBoNhoDem(){CacheService.getScriptCache().remove('lh-data');}
// Dọn bảng chợ: món đã hủy, món đã bán và đã nhận tiền chuyển sang tab cho_cu (bảng cho chỉ còn hàng đang bày + tiền chưa nhận).
// caiDat tạo lịch chạy hằng ngày lúc 3 giờ sáng; chạy tay lúc nào cũng được.
function donCho(){
  const l=LockService.getScriptLock();l.waitLock(30000);
  try{
    const db=SpreadsheetApp.openById(LH_SHEETS.nguoi_choi),sh=db.getSheetByName('cho');if(!sh||sh.getLastRow()<2)return 0;
    const n=LH_COLS.cho.length,v=sh.getRange(2,1,sh.getLastRow()-1,n).getValues(),ci=k=>LH_COLS.cho.indexOf(k);
    const done=r=>String(r[ci('trang_thai')])==='huy'||(String(r[ci('trang_thai')])==='da_ban'&&String(r[ci('da_nhan')])==='1');
    const old=v.filter(done),keep=v.filter(r=>!done(r)&&String(r[0]));if(!old.length)return 0;
    let ar=db.getSheetByName('cho_cu');if(!ar){ar=db.insertSheet('cho_cu');ar.getRange(1,1,1,n).setValues([LH_COLS.cho]);ar.setFrozenRows(1);ar.getRange('A:Z').setNumberFormat('@');}
    ar.getRange(ar.getLastRow()+1,1,old.length,n).setValues(old);
    sh.getRange(2,1,v.length,n).clearContent();if(keep.length)sh.getRange(2,1,keep.length,n).setValues(keep);
    Logger.log('Chuyển '+old.length+' dòng sang cho_cu, còn '+keep.length+' dòng');return old.length;
  }finally{l.releaseLock();}
}
function lhLichDonCho_(){try{if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='donCho'))ScriptApp.newTrigger('donCho').timeBased().everyDays(1).atHour(3).create();}catch(e){Logger.log('Chưa tạo được lịch dọn chợ: '+e);}}
// Đổ dữ liệu mặc định vào các tab còn trống, tạo bảng người chơi (chạy một lần sau khi dán code)
function caiDat(){
  for(const [tab,file] of Object.entries(LH_STATIC)){
    if(!LH_SHEETS[file])continue;
    const ss=SpreadsheetApp.openById(LH_SHEETS[file]);let sh=ss.getSheetByName(tab);
    // file Hình ảnh đã có sẵn danh sách ở trang đầu: đổi tên trang thành hinh_anh, tô đậm dòng tiêu đề
    if(!sh&&tab==='hinh_anh'&&ss.getSheets()[0].getLastRow()>1){sh=ss.getSheets()[0].setName(tab);sh.setFrozenRows(1);sh.getRange(1,1,1,sh.getLastColumn()).setFontWeight('bold').setBackground('#2b4d38').setFontColor('#ffffff');continue;}
    if(!sh){const first=ss.getSheets()[0];if(ss.getSheets().length===1&&first.getLastRow()===0&&!Object.keys(LH_STATIC).includes(first.getName())){sh=first.setName(tab);}else sh=ss.insertSheet(tab);}
    if(sh.getLastRow()>1)continue;
    const rows=LH_DEFAULT[tab]||[];if(!rows.length)continue;const h=Object.keys(rows[0]);
    sh.clear();sh.getRange(1,1,rows.length+1,h.length).setValues([h,...rows.map(r=>h.map(k=>r[k]===undefined||r[k]===null?'':r[k]))]);
    sh.setFrozenRows(1);sh.getRange(1,1,1,h.length).setFontWeight('bold').setBackground('#2b4d38').setFontColor('#ffffff');sh.autoResizeColumns(1,h.length);
  }
  const db=SpreadsheetApp.openById(LH_SHEETS.nguoi_choi);
  for(const t of Object.keys(LH_COLS)){LH_DB.rows(t);const sh=db.getSheetByName(t);sh.getRange('A:Z').setNumberFormat('@');sh.getRange(1,1,1,LH_COLS[t].length).setFontWeight('bold').setBackground('#2b4d38').setFontColor('#ffffff');}
  const first=db.getSheets().find(x=>!LH_COLS[x.getName()]);if(first&&first.getLastRow()===0&&db.getSheets().length>1)db.deleteSheet(first);
  lhLichDonCho_();
  kiemTra();
}
// Bổ sung các dòng ảnh mới (giao diện, màn hình chờ…) vào file Hình ảnh nếu còn thiếu; sửa lại tên, chỗ dùng, gợi ý. Không đụng cột link_anh.
function lhHinhAnhBoSung_(){
  if(!LH_SHEETS.hinh_anh||typeof LH_HINH_THEM==='undefined')return 0;
  const ss=SpreadsheetApp.openById(LH_SHEETS.hinh_anh),sh=ss.getSheetByName('hinh_anh')||ss.getSheets()[0];if(!sh)return 0;
  const v=sh.getDataRange().getValues(),h=v[0].map(String),ci=k=>h.indexOf(k);if(ci('nhom')<0||ci('ma')<0)return 0;let n=0;
  for(const r of LH_HINH_THEM){
    const i=v.findIndex((x,j)=>j>0&&String(x[ci('nhom')])===r.nhom&&String(x[ci('ma')])===r.ma);
    if(i<0){sh.appendRow(h.map(k=>k==='link_anh'?'':(r[k]===undefined?'':r[k])));n++;}
    else for(const k of ['ten','dung_o','goi_y'])if(ci(k)>=0&&r[k]!==undefined&&v[i][ci(k)]!==r[k])sh.getRange(i+1,ci(k)+1).setValue(r[k]);
  }
  return n;
}
// Cập nhật file Hình ảnh (chạy tay một lần sau khi dán Code.gs; chạy lại nếu báo còn ảnh chưa chép):
//  1) cột goi_y (định dạng webp, cách vẽ khớp nhân vật, bảng màu), gioi_tinh (Nam / Nữ / Chung), ghi_chu (Huyền thoại / Thần thoại)
//  2) dòng vật phẩm chưa có link_anh: chép ảnh game vẽ sẵn (webp) vào thư mục Drive, mở quyền xem cho mọi người, ghi link vào link_anh
const LH_ANH_FOLDER='1TXKoic_9MDOHsM6NVocdxoS5R6Uj-CZn';
function capNhatAnh(){
  const t0=Date.now(),ss=SpreadsheetApp.openById(LH_SHEETS.hinh_anh),sh=ss.getSheetByName('hinh_anh')||ss.getSheets()[0];
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  for(const k of ['gioi_tinh','ghi_chu'])if(h.indexOf(k)<0){h.push(k);sh.getRange(1,h.length).setValue(k).setFontWeight('bold');}
  const ci=k=>h.indexOf(k),last=sh.getLastRow();if(last<2)return;
  Player.load(lhStatic_());
  const v=sh.getRange(1,1,last,h.length).getValues(),W='định dạng webp, nền trong suốt';
  // gợi ý cho từng dòng: vật phẩm theo bảng dáng vẻ (giống hình trên nhân vật), nhóm khác theo loại
  const info=r=>{const nhom=String(r[ci('nhom')]).trim(),ma=String(r[ci('ma')]).trim();
    if(nhom==='vat_pham')return {...LH_Look.note(ma),file:Player.items[ma]?'vat_pham/'+ma.replace(/:/g,'_')+'.webp':''};
    if(nhom==='bieu_tuong')return {goi_y:'64×64, '+W+', nét đơn giản một màu (game tô màu theo chỗ dùng)',gioi_tinh:'',ghi_chu:''};
    if(nhom==='quai')return {goi_y:'Khoảng 256 px, '+W+', quay mặt sang phải, chân chạm đáy ảnh',gioi_tinh:'',ghi_chu:''};
    if(nhom==='npc')return {goi_y:'Khoảng 128×256, '+W+', quay mặt sang phải, chân chạm đáy ảnh, cao khoảng 2 lần rộng',gioi_tinh:'',ghi_chu:''};
    const g=String(r[ci('goi_y')]);return {goi_y:/webp/i.test(g)?g:'Định dạng webp. '+g.replace(/,?\s*PNG/i,''),gioi_tinh:'',ghi_chu:''};};
  const I=v.map((r,i)=>i?info(r):null);
  for(const col of ['goi_y','gioi_tinh','ghi_chu'])sh.getRange(2,ci(col)+1,last-1,1).setValues(I.slice(1).map(d=>[d[col]]));
  const folder=DriveApp.getFolderById(LH_ANH_FOLDER);let n=0,left=0;
  for(let i=1;i<v.length;i++){
    const d=I[i];if(!d||!d.file||String(v[i][ci('link_anh')]).trim())continue;
    if(Date.now()-t0>270000){left++;continue;}
    try{
      const blob=UrlFetchApp.fetch(LH_ANH_CDN+d.file).getBlob().setName(d.file.split('/').pop());
      const f=folder.createFile(blob);try{f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(e){}
      sh.getRange(i+1,ci('link_anh')+1).setValue('https://drive.google.com/file/d/'+f.getId()+'/view');n++;
    }catch(e){Logger.log('Không chép được '+d.file+': '+e);}
  }
  xoaBoNhoDem();Logger.log('Đã chép '+n+' ảnh vào Drive'+(left?', còn '+left+' ảnh: chạy lại capNhatAnh':', xong'));
}
function kiemTra(){try{const n=lhHinhAnhBoSung_();if(n)Logger.log('Thêm '+n+' dòng ảnh mới vào file Hình ảnh');}catch(e){Logger.log('Chưa bổ sung được file Hình ảnh: '+e);}xoaBoNhoDem();const d=lhStatic_();Logger.log(Object.keys(d).map(k=>k+': '+d[k].length+' dòng').join('\n'));LH_DB.rows('tai_khoan');LH_DB.rows('nhan_vat');LH_DB.rows('cho');Logger.log('Bảng người chơi sẵn sàng. Quyền gửi mail: '+MailApp.getRemainingDailyQuota()+' thư/ngày');}

// Ảnh vật phẩm game vẽ sẵn (hàm capNhatAnh chép vào Drive)
const LH_ANH_CDN="https://cdn.jsdelivr.net/gh/vnthudao-source/lu-hanh@ban-9.7/dist/anh/";

// Dòng ảnh giao diện bổ sung vào file Hình ảnh khi chạy kiemTra
const LH_HINH_THEM=[{"nhom":"giao_dien","ma":"logo","ten":"Logo Lữ Hành","dung_o":"Màn hình chờ, cổng đăng nhập","link_anh":"","goi_y":"Định dạng webp, nền trong suốt, ngang khoảng 480×200","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho","ten":"Màn hình chờ (loading screen) chung","dung_o":"Mọi màn hình chờ, khi chưa có ảnh riêng bên dưới","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho_tai_game","ten":"Màn hình chờ lúc mở trang","dung_o":"Thanh tải 0–100% khi mở trang và kết nối máy chủ","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho_tao_nv","ten":"Màn hình chờ tạo nhân vật","dung_o":"Lời dẫn câu chuyện khi bấm khởi tạo nhân vật","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho_vao_lang","ten":"Màn hình chờ vào làng","dung_o":"Khi bấm Vào làng, tải nhân vật và bản đồ","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_leu","ten":"Cảnh căn lều chọn nhân vật","dung_o":"Phía sau 5 ô nhân vật trước lều","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1200×700","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_dang_nhap","ten":"Nền cổng đăng nhập","dung_o":"Phía sau khung đăng nhập và căn lều","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"chan_dung_nam","ten":"Chân dung nhân vật nam","dung_o":"Ô chân dung góc trên trái","link_anh":"","goi_y":"Định dạng webp, vuông 256×256","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"chan_dung_nu","ten":"Chân dung nhân vật nữ","dung_o":"Ô chân dung góc trên trái","link_anh":"","goi_y":"Định dạng webp, vuông 256×256","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"tui_do_roi","ten":"Túi đồ rơi","dung_o":"Túi vải rơi ra khi hạ quái","link_anh":"","goi_y":"Định dạng webp, nền trong suốt 64×64","gioi_tinh":"","ghi_chu":""}];

// Dữ liệu mặc định (dùng khi tab Sheet còn trống và để chạy caiDat)
const LH_DEFAULT=(d=>Object.fromEntries(Object.entries(d).map(([k,[h,...rows]])=>[k,rows.map(r=>Object.fromEntries(h.map((c,i)=>[c,r[i]])))])))({"cau_hinh":[["khoa","gia_tri","ghi_chu"],["diem_khoi_tao",50,"Tổng điểm chia cho Sức mạnh, Nhanh nhẹn, Sức khỏe, Trí tuệ khi tạo nhân vật"],["menh_lenh_goc",10,"Mệnh lệnh ban đầu của mọi nhân vật"],["so_nhan_vat_toi_da",5,"Số nhân vật tối đa của một tài khoản"],["tien_thu_nghiem",9999999,"Tiền (đồng) cho nhân vật mới: 999 vàng 99 bạc 99 đồng. 100 đồng = 1 bạc, 100 bạc = 1 vàng"],["hong_ngoc_thu_nghiem",999,"Hồng ngọc cho nhân vật mới"],["ti_le_ban_lai",40,"% giá gốc nhận lại khi bán cho cửa hàng"],["he_so_gia_do_dep",250,"Giá đồ Đẹp trong cửa hàng = % này của giá gốc"],["phi_cho",5,"% thương nhân giữ lại khi bán hộ trên chợ và khi bán nhân vật đánh thuê"],["mau_goc",60,"Máu = mau_goc + Sức khỏe × mau_moi_diem"],["mau_moi_diem",5,""],["mana_goc",40,"Mana = mana_goc + Trí tuệ × mana_moi_diem"],["mana_moi_diem",4,""],["hoa_sat_thuong",25,"Sách Hỏa: % sát thương"],["thuy_hoi_mana",3,"Sách Thủy: mana mỗi giây"],["tho_phan_don",30,"Sách Thổ: % phản đòn"],["kim_giam_sat_thuong",25,"Sách Kim: % giảm sát thương"],["moc_hoi_mau",2,"Sách Mộc: máu mỗi giây"],["vung_an_toan_x",27,"Ô bản đồ từ cột 0 đến cột này là vùng an toàn (làng)"],["bo_cong_vu_khi",16,"Đồ bộ huyền thoại: công vũ khí gốc"],["bo_thu_khien",10,"Đồ bộ: thủ của khiên"],["bo_thu_ao",12,"Đồ bộ: thủ của áo giáp"],["bo_thu_nho",6,"Đồ bộ: thủ của mũ, quần, găng, giày, cánh"],["bo_toc_thu_cuoi",155,"Đồ bộ: tốc độ thú cưỡi (% tốc đi bộ)"],["gia_do_bo",5000,"Giá gốc món đồ bộ (để tính giá bán lại)"],["gieng_hoi_giay",300,"Giếng cổ: số giây để nước đầy lại sau khi dùng"],["exp_goc",60,"Kinh nghiệm cần để lên cấp 2. Cấp L cần exp_goc × L^(exp_tang/100)"],["exp_tang",150,"Độ tăng kinh nghiệm cần mỗi cấp (150 = lũy thừa 1,5)"],["cap_toi_da",60,"Cấp cao nhất của nhân vật"],["diem_moi_cap",5,"Điểm cộng chỉ số nhận được mỗi lần lên cấp"],["sach_chi_so",4,"Mỗi sách gắn vào ô kỹ năng cộng chừng này điểm vào chỉ số theo hệ (Mộc chia đôi cho Sức khỏe và Trí tuệ)"],["sach_moi_cap",2,"Mỗi cấp gia cường sách cộng thêm"],["thu_cuoi_toc_cap",3,"Thú cưỡi: % tốc độ mỗi cấp gia cường (+1 đến +15)"],["thu_cuoi_cong_cap",2,"Thú cưỡi: công mỗi cấp từ +7"],["thu_cuoi_mau_cap",20,"Thú cưỡi: máu mỗi cấp từ +11"],["thu_cuoi_mana_cap",10,"Thú cưỡi: mana mỗi cấp từ +11"],["thu_cuoi_thu_cap",2,"Thú cưỡi: phòng ngự mỗi cấp từ +11"],["sach_ti_le_cap",1,"Sách Lôi, Phong, Băng, Ánh sáng, Ma công: mỗi cấp gia cường cộng thêm % tỉ lệ kích hoạt"],["loi_ti_le",12,"Sách Lôi: % mỗi đòn trúng có thêm một đạo lôi quang đánh xuống"],["loi_sat_thuong",150,"Sách Lôi: sát thương lôi quang = % sát thương đòn đánh"],["phong_ti_le",20,"Sách Phong: % làm chậm quái"],["phong_cham",45,"Sách Phong: % giảm tốc độ quái"],["phong_ms",3000,"Sách Phong: thời gian chậm (mili giây)"],["bang_ti_le",10,"Sách Băng: % đóng băng quái"],["bang_ms",1800,"Sách Băng: thời gian đóng băng (mili giây), trùm còn một nửa"],["sang_ti_le",15,"Sách Ánh sáng: % khi bị đánh trúng làm quái hoảng sợ bỏ chạy"],["sang_ms",2500,"Sách Ánh sáng: thời gian quái bỏ chạy (mili giây), trùm còn một nửa"],["ma_ti_le_goc",2,"Sách Ma công: % thu phục quái khi hạ (không áp dụng cho trùm)"],["ma_phan_van_moi_menh_lenh",20,"Sách Ma công: mỗi điểm Mệnh lệnh cộng thêm chừng này phần vạn tỉ lệ (20 = 0,2%)"],["ma_toi_da",2,"Số quái thu phục tối đa đi theo. Quái chết là mất hẳn"],["pham_chat_roi_toi_da","p","Phẩm chất cao nhất rơi ra ở bản đồ này (n Thường, g Đẹp, p Hoàn hảo, l Huyền thoại, m Thần). Đồ cao hơn không rơi, phần thưởng nhiệm vụ cũng không vượt mức này"],["link_cho_phien","https://ikynagame.blogspot.com/p/cho-phien.html","Địa chỉ trang Chợ phiên (mua bán giữa người chơi, nhân vật đi theo)"]],"gia_cuong":[["cap","ti_le","phi_hong_ngoc","that_bai_tu","that_bai_den"],[0,100,1,"",""],[1,100,2,"",""],[2,100,3,"",""],[3,100,4,"",""],[4,100,5,"",""],[5,100,6,"",""],[6,50,7,0,6],[7,50,8,0,6],[8,50,9,0,6],[9,50,10,0,6],[10,25,11,6,6],[11,20,12,6,6],[12,15,13,6,6],[13,10,14,6,6],[14,5,15,6,6]],"pham_chat":[["ma","ten","mau","he_so","so_dong","bac","giao_dich","mua_duoc"],["n","Thường","#e8e6df",100,0,0,"khong","co"],["g","Đẹp","#ffd54a",110,1,1,"khong","co"],["p","Hoàn hảo","#5aa9ff",125,2,2,"co","khong"],["l","Huyền thoại","#c8823e",150,3,3,"co","khong"],["m","Thần","#ff6fb5",200,4,4,"co","khong"]],"thuoc_tinh":[["ma","ten","nhom","don_vi","dep_thap","dep_cao","hoan_hao_thap","hoan_hao_cao","huyen_thoai_thap","huyen_thoai_cao","than_thap","than_cao"],["str","Sức mạnh","str","",1,2,2,4,4,7,8,12],["agi","Nhanh nhẹn","agi","",1,2,2,4,4,7,8,12],["vit","Sức khỏe","vit","",1,2,2,4,4,7,8,12],["int","Trí tuệ","int","",1,2,2,4,4,7,8,12],["cmd","Mệnh lệnh","cmd","",1,1,1,2,2,4,4,6],["dmgMax","Sát thương cao nhất","str","",1,3,3,6,6,10,12,20],["dmgMin","Sát thương nhỏ nhất","str","",1,2,2,4,4,7,8,14],["acc","Sát thương chính xác","str","%",1,2,2,4,4,7,8,12],["crit2","Tỉ lệ sát thương x2","str","%",1,2,2,4,4,6,7,10],["crit3","Tỉ lệ sát thương x3","str","%",1,1,1,2,2,3,3,5],["trueDmg","Sát thương chuẩn","str","",1,2,2,5,5,9,10,18],["perfDmg","Sát thương hoàn hảo","str","%",1,1,1,3,3,5,5,8],["legDmg","Sát thương huyền thoại","str","%",1,1,1,2,2,4,4,6],["mythDmg","Sát thương thần thoại","str","%",1,1,1,1,1,2,3,5],["atkSpd","Tốc độ đánh","agi","%",1,3,3,6,6,10,10,15],["moveSpd","Tốc độ di chuyển","agi","%",1,2,2,4,4,7,8,12],["def","Khả năng phòng ngự","agi","",1,2,2,4,4,7,8,14],["block","Phòng ngự thành công","agi","%",1,2,2,4,4,6,7,10],["dodge","Tránh né","agi","%",1,2,2,3,3,5,6,9],["dmgRed","Giảm sát thương","agi","%",1,2,2,4,4,6,7,10],["perfRed","Giảm sát thương hoàn hảo","agi","%",1,2,2,4,4,6,7,10],["critRed","Giảm sát thương x2, x3","agi","%",1,2,2,4,4,6,7,10],["legRed","Giảm sát thương huyền thoại","agi","%",1,2,2,4,4,6,7,10],["mythRed","Giảm sát thương thần thoại","agi","%",1,2,2,3,3,5,5,8],["hp","Lượng máu","vit","",5,10,10,20,20,40,50,80],["hpReg","Hồi máu mỗi giây","vit","",1,1,1,2,2,3,3,5],["reflect","Phản đòn","vit","%",1,2,2,4,4,7,8,12],["mp","Lượng mana","int","",4,8,8,16,16,30,40,60],["mpReg","Hồi mana mỗi giây","int","",1,1,1,2,2,3,3,5],["cdr","Giảm thời gian hồi chiêu","int","%",1,2,2,4,4,6,7,10]],"vat_pham":[["id","ten","o","loai","cam","cong","thu","toc","gia","mau","thu_cuoi","menh_lenh","he"],["sword","Kiếm tập","hand","sword","one",2,0,0,40,"","",0,""],["sword-iron","Kiếm sắt","hand","sword","one",6,0,0,150,"#d5dde2","",0,""],["sword-steel","Kiếm thép","hand","sword","one",11,0,0,480,"#a8dcf0","",0,""],["shield","Khiên tập","hand","shield","one",0,2,0,40,"","",0,""],["shield-wood","Khiên mây","hand","shield","one",0,4,0,120,"#a8864a","",0,""],["shield-iron","Khiên đồng","hand","shield","one",0,8,0,420,"#b08a4a","",0,""],["staff","Gậy tập","hand","staff","one",2,0,0,40,"","",0,""],["staff-jade","Gậy ngọc","hand","staff","one",8,0,0,360,"#7fe0b0","",0,""],["bow","Cung tập","hand","bow","two",3,0,0,50,"","",0,""],["bow-hunt","Cung săn","hand","bow","two",9,0,0,380,"#9a6430","",0,""],["spear","Giáo tập","hand","spear","two",3,0,0,50,"","",0,""],["spear-iron","Giáo sắt","hand","spear","two",10,0,0,400,"#d5dde2","",0,""],["crossbow","Nỏ tập","hand","crossbow","two",4,0,0,60,"","",0,""],["crossbow-war","Nỏ chiến","hand","crossbow","two",13,0,0,560,"#4a3524","",0,""],["hat","Nón lá","hat","hat","",0,1,0,30,"","",0,""],["hat-iron","Nón dấu","hat","hat","",0,3,0,180,"#6b4a2e","",0,""],["armor","Áo vải","armor","armor","",0,2,0,60,"","",0,""],["armor-leather","Áo da","armor","armor","",0,4,0,200,"#8a5a34","",0,""],["armor-iron","Giáp đồng","armor","armor","",0,8,0,600,"#a07a40","",0,""],["pants","Quần vải","pants","pants","",0,1,0,30,"","",0,""],["pants-guard","Quần giáp","pants","pants","",0,3,0,180,"#5d4a34","",0,""],["gloves","Bao tay","gloves","gloves","",0,1,0,30,"","",0,""],["gloves-leather","Bao tay da","gloves","gloves","",0,2,0,120,"#6b4a2e","",0,""],["shoes","Dép cỏ","shoes","shoes","",0,1,0,30,"","",0,""],["shoes-leather","Giày da","shoes","shoes","",0,2,0,120,"#5b3d26","",0,""],["shoes-iron","Ủng đồng","shoes","shoes","",0,4,0,300,"#8a6a3a","",0,""],["wings","Áo choàng","wings","wings","",0,1,0,900,"","",0,""],["mount","Ngựa con","mount","mount","",0,0,115,200,"#b78452","horse",5,""],["mount-brown","Ngựa nâu","mount","mount","",0,0,125,600,"#7a4b2a","horse",5,""],["mount-black","Ngựa ô","mount","mount","",0,0,135,1200,"#2e2a2a","horse",5,""],["mount-white","Bạch mã","mount","mount","",0,0,150,2500,"#ece6da","horse",5,""],["mount-tiger","Hổ","mount","mount","",4,0,145,4000,"#e08a2e","tiger",10,""],["mount-elephant","Voi","mount","mount","",0,8,120,6000,"#8e9398","elephant",15,""],["ore","Khoáng thạch","","ore","",0,0,0,20,"","",0,""],["book-fire","Sách Hỏa","book","book","",0,0,0,400,"","",0,"fire"],["book-water","Sách Thủy","book","book","",0,0,0,300,"","",0,"water"],["book-earth","Sách Thổ","book","book","",0,0,0,450,"","",0,"earth"],["book-metal","Sách Kim","book","book","",0,0,0,450,"","",0,"metal"],["book-wood","Sách Mộc","book","book","",0,0,0,300,"","",0,"wood"],["book-loi","Sách Lôi","book","book","",0,0,0,900,"","",0,"thunder"],["book-phong","Sách Phong","book","book","",0,0,0,700,"","",0,"wind"],["book-bang","Sách Băng","book","book","",0,0,0,800,"","",0,"ice"],["book-ma","Sách Ma công","book","book","",0,0,0,1500,"","",0,"demon"],["book-sang","Sách Ánh sáng","book","book","",0,0,0,1000,"","",0,"light"]],"vu_khi":[["loai","ten","sat_thuong","tam_danh","lan_rong","toc_danh_ms","mana","hoi_chieu","noi_tai","ghi_chu"],["spear","Thương",130,130,26,500,110,90,14,"Sát thương cao nhất, đâm thẳng một đường"],["sword","Kiếm",115,85,115,420,90,110,10,"Đánh nhanh nhất, chém vòng cung trước mặt"],["shield","Khiên",100,60,75,560,130,70,18,"Tầm ngắn nhất, đẩy lùi mạnh. Tốn mana nhiều nhất nhưng hồi chiêu và nội tại nhanh nhất"],["crossbow","Nỏ",90,600,1,760,100,100,12,"Bắn xa, mũi tên xuyên qua quái"],["bow","Cung",80,540,0,660,120,80,16,"Bắn xa, hồi chiêu nhanh"],["staff","Gậy phép",65,680,90,900,80,120,9,"Tầm xa và rộng nhất (cầu phép nổ lan), sát thương thấp nhất, đánh chậm nhất"]],"cua_hang":[["cua_hang","id","pham_chat","gia","thu_tu"],["smith","sword-iron","n,g","",1],["smith","sword-steel","n,g","",2],["smith","shield-wood","n,g","",3],["smith","shield-iron","n,g","",4],["smith","staff-jade","n,g","",5],["smith","bow-hunt","n,g","",6],["smith","spear-iron","n,g","",7],["smith","crossbow-war","n,g","",8],["smith","hat-iron","n,g","",9],["smith","armor-leather","n,g","",10],["smith","armor-iron","n,g","",11],["smith","pants-guard","n,g","",12],["smith","gloves-leather","n,g","",13],["smith","shoes-leather","n,g","",14],["smith","shoes-iron","n,g","",15],["trainer","mount","n","",1],["trainer","mount-brown","n","",2],["trainer","mount-black","n","",3],["trainer","mount-white","n","",4],["trainer","mount-tiger","n","",5],["trainer","mount-elephant","n","",6],["wizard","book-fire","n","",1],["wizard","book-water","n","",2],["wizard","book-earth","n","",3],["wizard","book-metal","n","",4],["wizard","book-wood","n","",5],["wizard","book-loi","n","",6],["wizard","book-phong","n","",7],["wizard","book-bang","n","",8],["wizard","book-ma","n","",9],["wizard","book-sang","n","",10]],"bo_huyen_thoai":[["id","nhan_vat","gioi_tinh","ten_bo","vu_khi_loai","vu_khi","tay_trai_loai","tay_trai","mu","ao","quan","gang","giay","canh","thu_cuoi","thu_cuoi_loai","moc_3","moc_5","moc_7","hieu_ung_9","gia_tri_9","mo_ta_9"],["ngo-quyen","Ngô Quyền","m","Bạch Đằng","sword","Kiếm Bạch Đằng","shield","Khiên cọc gỗ lim","Mũ trụ Đường Lâm","Giáp Bạch Đằng","Quần trận Bạch Đằng","Bao tay chèo lái","Hài thủy chiến","Cờ hiệu Tiền Ngô","Chiến mã Đường Lâm","horse","def:6,hp:30","reflect:8,dmgRed:4","str:8,crit2:4","stun",15,"Cọc Bạch Đằng: đòn đánh có 15% làm quái choáng 1 giây"],["dinh-bo-linh","Đinh Bộ Lĩnh","m","Cờ Lau","sword","Kiếm Hoa Lư","sword","Đoản kiếm Hoa Lư","Mũ Vạn Thắng","Long bào Đại Cồ Việt","Quần cờ lau","Bao tay Vạn Thắng","Hài Hoa Lư","Cờ lau tập trận","Ngựa Vạn Thắng","horse","cmd:3,hp:30","atkSpd:8,crit2:3","str:6,agi:6","execute",12,"Dẹp loạn 12 sứ quân: kết liễu quái thường còn dưới 12% máu"],["le-hoan","Lê Hoàn","m","Đại Hành","sword","Kiếm Thập đạo","shield","Khiên Chi Lăng","Mũ Thập đạo tướng quân","Giáp Lê Đại Hành","Quần trận Chi Lăng","Bao tay Đại Hành","Hài phá Tống","Cờ Đại Hành","Voi chiến Đại Hành","elephant","def:5,block:3","hp:60,dmgRed:4","str:6,trueDmg:8","shield",20,"Chi Lăng: mỗi 10 giây nhận lá chắn bằng 20% máu tối đa"],["ly-thuong-kiet","Lý Thường Kiệt","m","Như Nguyệt","sword","Kiếm Như Nguyệt","shield","Khiên sông Cầu","Mũ Thái úy","Giáp Như Nguyệt","Quần Thái úy","Bao tay Nam quốc","Hài sông Cầu","Cờ Nam quốc sơn hà","Chiến mã Ung Châu","horse","int:5,mp:20","cdr:6,crit2:3","str:6,dmgMax:8","wave",60,"Nam quốc sơn hà: mỗi đòn thứ 4 tung sóng chém 60% sát thương"],["tran-hung-dao","Trần Hưng Đạo","m","Hưng Đạo","sword","Kiếm Hưng Đạo Vương","shield","Khiên Vạn Kiếp","Mũ Quốc công","Giáp Hưng Đạo","Quần Vạn Kiếp","Bao tay Hịch tướng sĩ","Hài Bạch Đằng","Cờ Tiết chế","Chiến mã Vạn Kiếp","horse","cmd:4,hp:30","str:5,crit3:2","dmgRed:6,reflect:6","aura",30,"Hịch tướng sĩ: bản thân và lính đánh thuê +30% sát thương"],["tran-quoc-toan","Trần Quốc Toản","m","Phá Cường Địch","sword","Kiếm Hoài Văn Hầu","sword","Đoản kiếm Hoài Văn","Mũ Hoài Văn Hầu","Giáp thiếu niên","Quần Hoài Văn","Bao tay bóp cam","Hài thiếu niên","Cờ Phá cường địch","Ngựa Hoài Văn","horse","agi:5,atkSpd:5","crit2:4,moveSpd:4","str:6,perfDmg:3","cleave",40,"Phá cường địch: đòn thường lan 40% sát thương sang quái gần"],["nguyen-trai","Nguyễn Trãi","m","Bình Ngô","staff","Bút Bình Ngô","staff","Gậy trúc Côn Sơn","Khăn Ức Trai","Áo Côn Sơn","Quần Ức Trai","Bao tay Quân trung từ mệnh","Hài Côn Sơn","Áo choàng Bình Ngô","Ngựa mưu sĩ Lam Sơn","horse","int:6,mp:30","mpReg:3,cdr:6","int:8,crit2:3","manaShield",30,"Bình Ngô đại cáo: 30% sát thương nhận vào trừ vào mana"],["le-loi","Lê Lợi","m","Lam Sơn","sword","Kiếm Lam Sơn","shield","Khiên Lam Sơn","Mũ Bình Định Vương","Giáp Lam Sơn","Quần Lam Sơn","Bao tay Lũng Nhai","Hài Chí Linh","Cờ Bình Định","Voi chiến Lam Sơn","elephant","vit:5,hp:40","def:6,hpReg:2","str:6,crit2:3","lifesteal",8,"Hội thề Lũng Nhai: hút 8% sát thương gây ra thành máu"],["quang-trung","Quang Trung","m","Tây Sơn","sword","Kiếm Tây Sơn","sword","Đoản kiếm Đống Đa","Mũ Quang Trung","Áo bào Tây Sơn","Quần Ngọc Hồi","Bao tay Đống Đa","Hài thần tốc","Cờ đào Tây Sơn","Voi chiến Ngọc Hồi","elephant","moveSpd:6,atkSpd:5","str:6,crit2:4","crit3:3,dmgMax:10","haste",40,"Thần tốc: hạ quái tăng 40% tốc đánh và tốc chạy trong 4 giây"],["trung-trac","Trưng Trắc","f","Mê Linh","sword","Kiếm Mê Linh","shield","Khiên Hát Môn","Mũ Trưng Vương","Giáp Mê Linh","Váy trận Hát Môn","Bao tay Trưng Vương","Hài Mê Linh","Cờ Trưng Vương","Voi chiến Mê Linh","elephant","cmd:3,hp:30","str:5,def:5","crit2:4,dmgRed:5","burn",30,"Lửa Mê Linh: đòn đánh gây bỏng thêm 30% sát thương trong 3 giây"],["trung-nhi","Trưng Nhị","f","Hát Giang","sword","Kiếm Trưng Nhị","sword","Đoản kiếm Hát Giang","Mũ Trưng Nhị","Giáp Hát Giang","Váy trận Trưng Nhị","Bao tay Hát Giang","Hài Hát Giang","Cờ Hát Giang","Voi chiến Hát Giang","elephant","agi:5,dodge:3","atkSpd:6,crit2:3","str:6,dodge:4","counter",100,"Song kiếm: sau khi né, đòn kế tiếp gây gấp đôi"],["trieu-thi-trinh","Bà Triệu","f","Núi Nưa","sword","Gươm Núi Nưa","sword","Gươm Bồ Điền","Trâm Nhụy Kiều","Giáp vàng Nhụy Kiều","Váy trận Núi Nưa","Bao tay Bồ Điền","Guốc ngà Bà Triệu","Cờ Nhụy Kiều tướng quân","Voi một ngà","elephant","str:5,hp:30","crit2:4,atkSpd:5","str:7,dmgMax:8","wave",50,"Cưỡi gió đạp sóng: mỗi đòn thứ 4 tung sóng 50% sát thương"],["le-chan","Lê Chân","f","An Biên","sword","Kiếm An Biên","shield","Khiên Hải tần","Mũ nữ tướng An Biên","Giáp thủy quân","Váy trận An Biên","Bao tay chài lưới","Hài Hải Phòng","Cờ An Biên","Ngựa An Biên","horse","def:5,hp:30","block:4,dmgRed:4","vit:6,reflect:5","shield",18,"Thành An Biên: mỗi 10 giây nhận lá chắn bằng 18% máu tối đa"],["phung-thi-chinh","Phùng Thị Chính","f","Lãng Bạc","sword","Kiếm Lãng Bạc","shield","Khiên Phùng nữ tướng","Mũ Phùng nữ tướng","Giáp Lãng Bạc","Váy trận Lãng Bạc","Bao tay Lãng Bạc","Hài Lãng Bạc","Cờ nữ tướng Lãng Bạc","Ngựa Lãng Bạc","horse","vit:5,hpReg:1","hp:60,def:4","str:5,reflect:6","heal",2,"Trận Lãng Bạc: hồi 2% máu tối đa mỗi giây"],["vu-thi-thuc","Bát Nàn","f","Tiên La","sword","Kiếm Tiên La","shield","Khiên Bát Nàn","Mũ Bát Nàn công chúa","Giáp Tiên La","Váy trận Bát Nàn","Bao tay Tiên La","Hài Tiên La","Cờ Bát Nàn","Ngựa Tiên La","horse","str:4,hp:30","crit2:3,trueDmg:5","str:6,atkSpd:6","lifesteal",6,"Bát Nàn: hút 6% sát thương gây ra thành máu"],["duong-van-nga","Dương Vân Nga","f","Hoa Lư","staff","Trượng Thái hậu","staff","Gậy ngọc Hoa Lư","Mũ phượng Dương Vân Nga","Áo phượng Hoa Lư","Xiêm y Thái hậu","Bao tay ngọc Hoa Lư","Hài phượng","Áo choàng Thái hậu","Kiệu ngựa Hoa Lư","horse","int:5,mp:30","mpReg:2,cdr:5","int:7,hp:40","revive",50,"Trao áo long cổn: hồi sinh tại chỗ một lần mỗi 5 phút với 50% máu"],["y-lan","Ỷ Lan","f","Thổ Lỗi","staff","Trượng Nhiếp chính","shield","Khiên Thổ Lỗi","Mũ Nguyên phi","Áo Nguyên phi","Xiêm y Thổ Lỗi","Bao tay Nhiếp chính","Hài Thổ Lỗi","Áo choàng Ỷ Lan","Ngựa Thăng Long","horse","cmd:3,int:4","cdr:5,mp:30","int:6,dmgRed:5","aura",20,"Nhiếp chính: bản thân và lính đánh thuê +20% sát thương"],["bui-thi-xuan","Bùi Thị Xuân","f","Tây Sơn ngũ phụng","sword","Song kiếm Bùi Thị Xuân","sword","Đoản kiếm Tây Sơn","Mũ Đô đốc","Giáp Tây Sơn","Váy trận Tây Sơn","Bao tay luyện voi","Hài Tây Sơn","Cờ ngũ phụng","Voi chiến Bùi Thị Xuân","elephant","str:4,cmd:3","atkSpd:6,crit2:3","str:6,crit3:2","stun",12,"Thuần voi: đòn đánh có 12% làm quái choáng 1 giây"]],"do_than":[["id","ten","o","loai","cam","cong","thu","toc","thu_cuoi","mau","hieu_ung","gia_tri","mo_ta","gia"],["than-roi-sat","Roi sắt Thánh Gióng","hand","sword","one",40,0,0,"","#3c3f44","wave",80,"Mỗi đòn thứ 4 tung sóng lửa 80% sát thương",20000],["than-ngua-sat","Ngựa sắt Thánh Gióng","mount","mount","",0,10,190,"horse","#4a4d52","burn",40,"Ngựa phun lửa: đòn đánh gây bỏng thêm 40% sát thương",20000],["than-giap-sat","Giáp sắt Thánh Gióng","armor","armor","",0,40,0,"","#5a5e64","shield",30,"Mỗi 10 giây nhận lá chắn bằng 30% máu tối đa",20000],["than-no-kim-quy","Nỏ thần Kim Quy","hand","crossbow","two",60,0,0,"","#c9a24a","execute",20,"Kết liễu quái thường còn dưới 20% máu",20000],["than-kiem-thuan-thien","Kiếm Thuận Thiên","hand","sword","one",45,0,0,"","#9ff0d0","lifesteal",12,"Hút 12% sát thương gây ra thành máu",20000],["than-gay-chu-dong-tu","Gậy thần Chử Đồng Tử","hand","staff","one",38,0,0,"","#e6d28a","heal",3,"Hồi 3% máu tối đa mỗi giây",20000],["than-non-chu-dong-tu","Nón thần Chử Đồng Tử","hat","hat","",0,20,0,"","#f0dc90","revive",60,"Hồi sinh tại chỗ một lần mỗi 5 phút với 60% máu",20000],["than-canh-au-co","Cánh tiên Âu Cơ","wings","wings","",0,18,0,"","#ffd1ec","haste",50,"Hạ quái tăng 50% tốc đánh và tốc chạy trong 4 giây",20000],["than-khien-lac-long","Khiên vảy rồng Lạc Long Quân","hand","shield","one",0,35,0,"","#4fb3a8","stun",20,"Đòn đánh có 20% làm quái choáng 1 giây",20000],["than-giay-son-tinh","Giày mây Sơn Tinh","shoes","shoes","",0,16,0,"","#a8d08d","counter",150,"Sau khi né, đòn kế tiếp gây thêm 150%",20000],["than-gang-thuy-tinh","Bao tay sóng nước Thủy Tinh","gloves","gloves","",0,16,0,"","#5fb6ff","cleave",50,"Đòn thường lan 50% sát thương sang quái gần",20000]],"quai":[["id","ten","mau","sat_thuong","toc_do","toc_chay","ban_kinh","cao","tam_danh","tam_gan","hoi_chieu_ms","vung_tay_ms","dong","day_lui_phan_tram","boss","hoi_sinh_giay","dep_phan_van","hoan_hao_phan_van","huyen_thoai_phan_van","than_phan_van","hong_ngoc_it","hong_ngoc_nhieu","loai_sat_thuong","ti_le_x2","kinh_nghiem"],["deer","Hươu",60,0,60,190,16,44,0,0,0,0,8,100,0,12,800,120,8,0,0,0,"thuong",0,8],["lion","Sư tử",150,11,70,165,18,40,240,50,1200,380,25,60,0,15,800,120,8,0,0,0,"thuong",5,20],["elephant","Voi rừng",420,20,45,95,28,72,0,72,1900,650,60,15,0,20,1000,150,10,0,0,0,"thuong",5,50],["croc","Cá sấu",190,15,35,150,20,20,150,58,1500,300,35,50,0,15,800,120,8,0,0,0,"thuong",5,25],["chua-son-lam","Chúa Sơn Lâm",2500,28,80,150,30,64,260,74,1400,500,300,10,1,120,6000,2500,400,0,3,10,"huyen_thoai",15,300],["ngu-tinh","Ngư Tinh",6000,40,40,110,40,80,280,120,2200,800,1000,5,2,300,8000,5000,1200,150,10,30,"than",20,800]],"nhiem_vu":[["id","ten","mo_ta","muc_tieu","so_luong","thuong_dong","thuong_hong_ngoc","thuong_do","pham_chat_do","lap_lai","thuong_kinh_nghiem"],["q-huou","Săn hươu","Dân làng cần thịt hươu cho hội làng.","deer",5,200,0,"","","khong",20],["q-su-tu","Trừ sư tử","Sư tử bên Đông Ngạn hay vồ người đi rừng.","lion",3,500,0,"","","khong",50],["q-ca-sau","Diệt cá sấu","Cá sấu rình ở bến sông, dân không dám lấy nước.","croc",3,500,0,"","","khong",50],["q-voi","Đuổi voi rừng","Voi rừng phá nương rẫy phía đông.","elephant",2,800,0,"","","khong",80],["q-chua-son-lam","Hạ Chúa Sơn Lâm","Con hổ chúa ở rừng đông bắc đã giết nhiều thợ săn.","chua-son-lam",1,10000,0,"","","khong",1000],["q-ngu-tinh","Trừ Ngư Tinh","Ngư Tinh nổi lên ở đầm phía đông nam, dâng nước hại dân.","ngu-tinh",1,30000,0,"","","khong",3000]],"linh":[["id","ten","gioi_tinh","gia","menh_lenh","suc_manh","nhanh_nhen","suc_khoe","tri_tue","trang_bi","mo_ta"],["dan-binh","Dân binh","m",100,5,12,8,12,4,"spear,hat","Lính giáo rẻ, máu trâu"],["cung-thu","Nữ cung thủ","f",300,5,10,14,8,6,"bow,shoes","Bắn từ xa"],["vo-si","Võ sĩ","m",600,8,16,10,14,4,"sword,shield,armor","Kiếm khiên, chịu đòn tốt"],["dao-si","Đạo sĩ trẻ","m",800,6,6,8,10,20,"staff-jade,hat","Bắn cầu phép"],["nu-tuong","Nữ tướng","f",1200,10,18,14,14,6,"sword-iron,sword-iron,armor-leather","Song kiếm, đánh nhanh"]]});

/* ================= LÕI MÁY CHỦ (dùng chung cho Apps Script và chế độ ngoại tuyến) =================
   adapter cần có: rows(bang) · find(bang,cot,giaTri) · where(bang,cot,giaTri) (tùy chọn: chỉ đọc đúng dòng cần, không đọc cả bảng) · insert(bang,obj) · update(bang,obj) · mail(to,tieuDe,noiDung) · hash(chuoi) · now() · uid() · staticData() · lock(fn) · rules() (nạp luật chơi)
   Bảng: tai_khoan · nhan_vat · cho
   v8: máy chủ giữ tiền, hồng ngọc, đồ của từng nhân vật. Trình duyệt chỉ gửi: sắp xếp đồ, máu/mana, vị trí và các lệnh (hạ quái, mua, bán, gia cường, nhiệm vụ, thuê lính). */
function LH_Core(A){
  const TOKEN_DAYS=30,RESET_MIN=15;
  const fail=e=>{throw Error(e);};
  const lower=s=>String(s||'').trim().toLowerCase();
  const cfg=k=>{const r=(A.staticData().cau_hinh||[]).find(x=>x.khoa===k);return r?Number(r.gia_tri):null;};
  const pub=a=>({id:a.id,username:a.username,email:a.email});
  // Tìm dòng theo một cột: máy chủ thật chỉ đọc đúng các dòng khớp (nhanh khi bảng lớn), máy giả thì lọc cả bảng
  const find=(t,k,v)=>{v=String(v==null?'':v);if(!v)return null;return (A.find?A.find(t,k,v):A.rows(t).find(x=>String(x[k])===v))||null;};
  const where=(t,k,v)=>{v=String(v==null?'':v);if(!v)return [];return A.where?A.where(t,k,v):A.rows(t).filter(x=>String(x[k])===v);};
  function auth(token){
    const a=token?find('tai_khoan','token',token):null;
    // Mỗi tài khoản chỉ một thiết bị: đăng nhập nơi khác thì phiên cũ bị đẩy ra
    if(!a){if(token&&find('tai_khoan','token_cu',token))fail('DANG_NHAP_NOI_KHAC');fail('PHIEN_HET_HAN');}
    if(Number(a.token_het_han)<A.now())fail('PHIEN_HET_HAN');
    return a;
  }
  function ownChar(a,id,status){
    const c=find('nhan_vat','id',id);
    if(!c||c.tai_khoan!==a.id)fail('KHONG_THAY_NHAN_VAT');
    if(status&&c.trang_thai!==status)fail('SAI_TRANG_THAI');
    return c;
  }
  const charView=c=>({id:c.id,name:c.ten,gender:c.gioi_tinh,stats:{strength:+c.suc_manh,agility:+c.nhanh_nhen,vitality:+c.suc_khoe,intelligence:+c.tri_tue},status:c.trang_thai,level:+c.cap||1,price:+c.gia_danh_thue||0,ruby:+c.gia_hong_ngoc||0,created:+c.tao_luc});
  function newToken(a){a.token_cu=a.token&&Number(a.token_het_han)>A.now()?a.token:'';a.token=A.uid()+A.uid();a.token_het_han=A.now()+TOKEN_DAYS*864e5;A.update('tai_khoan',a);return a.token;}
  // Trạng thái nhân vật lưu trên máy chủ (cột luu): {v, player, pos, seen, srv}
  function stateOf(c){
    A.rules&&A.rules();
    let save=null;try{save=c.luu?JSON.parse(c.luu):null;}catch(e){}save=save||{};
    const ch=charView(c);
    return {save,player:save.player?Player.restore(save,ch,()=>true,null).player:Player.create(ch)};
  }
  function storeState(c,st,player,soft){
    soft=soft||{};
    const okPos=v=>v&&Number.isFinite(+v.x)&&Number.isFinite(+v.y)?{x:+v.x,y:+v.y,...(typeof v.map==='string'&&/^[a-z0-9-]{1,40}$/.test(v.map)?{map:v.map}:{})}:null;
    const save={v:Player.VERSION,player,pos:soft.pos!==undefined?okPos(soft.pos):(st.save.pos||null),seen:Array.isArray(soft.seen)?soft.seen.slice(0,60).map(String):(st.save.seen||[]),srv:st.save.srv||{}};
    const j=JSON.stringify(save);if(j.length>45000)fail('DU_LIEU_QUA_LON');
    c.luu=j;c.cap=player.level;c.kinh_nghiem=player.exp;c.cap_nhat=A.now();A.update('nhan_vat',c);st.save=save;
  }
  // Dáng vẻ nhân vật (cho căn lều chọn nhân vật và chợ cho thuê): cấp, đồ đang mặc, hào quang sách, số lính, chỉ số
  function lookOf(c){
    try{const p=stateOf(c).player,D=Player.derive(p),ab=p.activeBook!=null?p.skillSlots[p.activeBook]:p.skillSlots.find(Boolean);
      return {level:p.level,equipment:p.equipment,el:ab&&Player.info(ab)?Player.info(ab).element:null,mercs:p.mercs.length,pets:(p.pets||[]).length,main:D.main,dmg:[D.tot.dmgMin,D.tot.dmgMax],hp:D.tot.hp,def:D.tot.def};}catch(e){return null;}
  }
  const claimSum=acc=>pendingClaims(acc).reduce((s,r)=>({copper:s.copper+Number(r.tien_nhan||0),ruby:s.ruby+Number(r.hong_ngoc_nhan||0)}),{copper:0,ruby:0});
  function pendingClaims(acc){return where('cho','nguoi_ban',acc).filter(r=>r.trang_thai==='da_ban'&&String(r.da_nhan)!=='1');}
  const H={
    ping:()=>({msg:'Lữ Hành API'}),
    // kiểm tra phiên còn giữ (game gọi định kỳ): bị đăng nhập nơi khác thì báo DANG_NHAP_NOI_KHAC
    alive(p){auth(p.token);return {};},
    data:()=>({data:A.staticData()}),
    register(p){
      const username=lower(p.username),email=lower(p.email),pw=String(p.password||'');
      if(!/^[a-z0-9_]{3,20}$/.test(username))fail('TEN_DANG_NHAP_SAI');
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))fail('EMAIL_SAI');
      if(pw.length<6)fail('MAT_KHAU_NGAN');
      return A.lock(()=>{
        if(find('tai_khoan','username',username))fail('TEN_DANG_NHAP_DA_CO');
        if(find('tai_khoan','email',email))fail('EMAIL_DA_CO');
        const salt=A.uid(),a={id:'tk-'+A.uid(),username,email,muoi:salt,mat_khau:A.hash(salt+pw),tao_luc:A.now(),token:'',token_het_han:0,ma_khoi_phuc:'',ma_het_han:0};
        A.insert('tai_khoan',a);
        return {token:newToken(a),account:pub(a)};
      });
    },
    login(p){
      const key=lower(p.username),pw=String(p.password||'');
      const a=find('tai_khoan','username',key)||find('tai_khoan','email',key);
      if(!a||A.hash(a.muoi+pw)!==a.mat_khau)fail('SAI_DANG_NHAP');
      return {token:newToken(a),account:pub(a)};
    },
    logout(p){const a=auth(p.token);a.token='';a.token_cu='';a.token_het_han=0;A.update('tai_khoan',a);return {};},
    forgot(p){
      const email=lower(p.email),a=find('tai_khoan','email',email);
      if(!a)fail('KHONG_THAY_EMAIL');
      const code=String(100000+Math.floor(Math.random()*900000));
      a.ma_khoi_phuc=code;a.ma_het_han=A.now()+RESET_MIN*6e4;A.update('tai_khoan',a);
      A.mail(a.email,'Lữ Hành · Khôi phục tài khoản',`Tên đăng nhập của bạn: ${a.username}\nMã khôi phục: ${code}\nMã có hiệu lực ${RESET_MIN} phút.`);
      return {sent:true,devCode:A.devMail?code:undefined,username:A.devMail?a.username:undefined};
    },
    reset(p){
      const email=lower(p.email),a=find('tai_khoan','email',email);
      if(!a||!a.ma_khoi_phuc||String(a.ma_khoi_phuc)!==String(p.code).trim()||Number(a.ma_het_han)<A.now())fail('MA_SAI');
      if(String(p.password||'').length<6)fail('MAT_KHAU_NGAN');
      a.muoi=A.uid();a.mat_khau=A.hash(a.muoi+p.password);a.ma_khoi_phuc='';a.ma_het_han=0;
      return {token:newToken(a),account:pub(a)};
    },
    chars(p){
      const a=auth(p.token),list=where('nhan_vat','tai_khoan',a.id).filter(c=>(c.trang_thai==='active'||c.trang_thai==='merc')).map(c=>({...charView(c),look:lookOf(c)}));
      const cs=claimSum(a.id);
      return {account:pub(a),chars:list,max:cfg('so_nhan_vat_toi_da')||5,claim:cs.copper,claimRuby:cs.ruby};
    },
    createChar(p){
      const a=auth(p.token),name=String(p.name||'').trim().replace(/\s+/g,' '),gender=p.gender==='f'?'f':'m',st=p.stats||{};
      if(name.length<2||name.length>16||!/^[\p{L}\p{N} ]+$/u.test(name))fail('TEN_NHAN_VAT_SAI');
      const keys=['strength','agility','vitality','intelligence'],vals=keys.map(k=>Number(st[k]));
      if(vals.some(v=>!Number.isInteger(v)||v<0))fail('DIEM_SAI');
      if(vals.reduce((s,v)=>s+v,0)!==(cfg('diem_khoi_tao')||50))fail('DIEM_SAI');
      return A.lock(()=>{
        const max=cfg('so_nhan_vat_toi_da')||5;
        if(where('nhan_vat','tai_khoan',a.id).filter(c=>c.trang_thai==='active'||c.trang_thai==='merc').length>=max)fail('DU_NHAN_VAT');
        if(where('nhan_vat','ten_khoa',lower(name)).some(c=>c.trang_thai!=='deleted'))fail('TEN_DA_CO');
        const c={id:'nv-'+A.uid(),tai_khoan:a.id,ten:name,ten_khoa:lower(name),gioi_tinh:gender,suc_manh:vals[0],nhanh_nhen:vals[1],suc_khoe:vals[2],tri_tue:vals[3],trang_thai:'active',gia_danh_thue:0,nguoi_mua:'',luu:'',tao_luc:A.now(),cap_nhat:A.now()};
        A.insert('nhan_vat',c);return {char:charView(c)};
      });
    },
    load(p){
      const a=auth(p.token);
      return A.lock(()=>{const c=ownChar(a,p.charId,'active'),st=stateOf(c);if(!c.luu)storeState(c,st,st.player);return {char:charView(c),save:{player:st.player,pos:st.save.pos||null,seen:st.save.seen||[]}};});
    },
    // Đồng bộ: nhận cách sắp xếp đồ + lệnh, máy chủ tự tính kết quả (rơi đồ, tiền, gia cường…) rồi trả lại trạng thái chuẩn
    play(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const c=ownChar(a,p.charId,'active'),st=stateOf(c),C=p.save&&p.save.player;
        let R=C?Player.merge(st.player,C):st.player;const srv=st.save.srv=st.save.srv||{},now=A.now(),ops=Array.isArray(p.ops)?p.ops.slice(0,600):[];
        // Lệnh chơi được gom trên máy người chơi rồi gửi một lần (về làng, qua cầu, gặp thương nhân, bấm Lưu).
        // Gói đã nhận rồi (mạng rớt lúc chờ trả lời, gửi lại) thì không tính lần hai.
        const bid=String(p.bid||'').slice(0,40),dup=!!bid&&(srv.bids||[]).includes(bid);
        // Thời điểm từng lệnh theo đồng hồ máy chủ: không sớm hơn lần lưu trước, không muộn hơn lúc này
        const skew=Number.isFinite(+p.sentAt)&&+p.sentAt>0?now-(+p.sentAt):0;let prev=Math.max(+srv.lastAt||0,now-864e5);
        const results=dup?ops.map(()=>({ok:true,dup:true})):ops.map(op=>{
          let at=Number.isFinite(+(op&&op.at))?+op.at+skew:now;at=Math.min(now,Math.max(prev,at));prev=at;
          try{if(op&&op.lay)R=Player.relayout(R,op.lay);return {ok:true,...Player.applyOp(R,op,srv,at)};}catch(e){return {ok:false,error:String(e.message||e)};}
        });
        if(!dup&&ops.length&&C)R=Player.merge(R,C);
        if(bid&&!dup)srv.bids=[...(srv.bids||[]),bid].slice(-8);
        srv.lastAt=now;
        storeState(c,st,R,{pos:p.save&&p.save.pos,seen:p.save&&p.save.seen});
        return {state:R,results,savedAt:c.cap_nhat};
      });
    },
    save(p){return H.play({...p,ops:[]});},
    // Cho thuê / hủy cho thuê: đọc và ghi dòng nhân vật trong khóa (không ghi đè phần lưu mới hơn của lệnh khác)
    mercRegister(p){
      const a=auth(p.token),price=Math.max(0,Math.floor(Number(p.price)||0)),ruby=Math.max(0,Math.floor(Number(p.ruby)||0));
      if(!(price>=100)&&!(ruby>=1))fail('GIA_SAI');
      if(p.playing&&p.playing===p.charId)fail('DANG_CHOI');
      return A.lock(()=>{const c=ownChar(a,p.charId,'active');c.trang_thai='merc';c.gia_danh_thue=price;c.gia_hong_ngoc=ruby;c.cap_nhat=A.now();A.update('nhan_vat',c);return {char:charView(c)};});
    },
    mercCancel(p){const a=auth(p.token);return A.lock(()=>{const c=ownChar(a,p.charId,'merc');c.trang_thai='active';c.gia_danh_thue=0;c.gia_hong_ngoc=0;A.update('nhan_vat',c);return {char:charView(c)};});},
    mercList(p){
      const a=auth(p.token);
      return {list:where('nhan_vat','trang_thai','merc').filter(c=>c.tai_khoan!==a.id).map(c=>{let eq={};try{eq=(JSON.parse(c.luu||'{}').player||{}).equipment||{};}catch(e){}return {...charView(c),equipment:eq,look:lookOf(c)};})};
    },
    mercBuy(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const b=ownChar(a,p.charId,'active'),t=find('nhan_vat','id',p.targetId);
        if(!t||t.trang_thai!=='merc'||t.tai_khoan===a.id)fail('LINH_KHONG_CON');
        let eq={};try{eq=(JSON.parse(t.luu||'{}').player||{}).equipment||{};}catch(e){}
        const price=Number(t.gia_danh_thue)||0,ruby=Number(t.gia_hong_ngoc)||0,fee=(cfg('phi_cho')||0)/100,st=stateOf(b);
        if(st.player.copper<price)fail('KHONG_DU_TIEN');if(st.player.rubies<ruby)fail('KHONG_DU_HONG_NGOC');if(st.player.mercs.length>=Player.MAX_MERC)fail('DU_LINH');
        Player.addMerc(st.player,{name:t.ten,gender:t.gioi_tinh,stats:charView(t).stats,equipment:eq,src:'player',from:t.id,cmd:10});
        st.player.copper-=price;st.player.rubies-=ruby;storeState(b,st,st.player);
        t.trang_thai='sold';t.nguoi_mua=p.charId;t.cap_nhat=A.now();A.update('nhan_vat',t);
        A.insert('cho',{id:'ch-'+A.uid(),loai:'linh',nguoi_ban:t.tai_khoan,nhan_vat_ban:t.id,vat_pham:'',gia:price,tien_nhan:Math.floor(price*(1-fee)),hong_ngoc:ruby,hong_ngoc_nhan:Math.floor(ruby*(1-fee)),trang_thai:'da_ban',nguoi_mua:p.charId,tao_luc:A.now(),ban_luc:A.now(),da_nhan:0});
        return {name:t.ten,price,ruby,state:st.player};
      });
    },
    marketList(p){
      const a=auth(p.token),rows=where('cho','trang_thai','mo').filter(r=>r.loai==='do');
      const view=r=>({id:r.id,item:JSON.parse(r.vat_pham||'null'),price:Number(r.gia),ruby:Number(r.hong_ngoc)||0,mine:r.nguoi_ban===a.id,seller:r.ten_nguoi_ban||''});
      return {open:rows.filter(r=>r.trang_thai==='mo').map(view),claim:claimSum(a.id).copper,claimRuby:claimSum(a.id).ruby};
    },
    // Ký gửi: lấy món đồ ra khỏi túi nhân vật trên máy chủ
    marketSell(p){
      const a=auth(p.token),price=Math.max(0,Math.floor(Number(p.price)||0)),ruby=Math.max(0,Math.floor(Number(p.ruby)||0));
      if(!(price>=1)&&!(ruby>=1))fail('GIA_SAI');
      return A.lock(()=>{
        const c=ownChar(a,p.charId,'active'),st=stateOf(c),i=p.uid?st.player.bag.findIndex(x=>x&&x.uid===String(p.uid)):Math.floor(Number(p.i)),it=st.player.bag[i];
        if(!it||!Player.tradeable(it))fail('VAT_PHAM_SAI');
        st.player.bag[i]=null;storeState(c,st,st.player);
        const fee=(cfg('phi_cho')||0)/100,r={id:'ch-'+A.uid(),loai:'do',nguoi_ban:a.id,nhan_vat_ban:c.id,ten_nguoi_ban:c.ten,vat_pham:JSON.stringify(it),gia:price,tien_nhan:Math.floor(price*(1-fee)),hong_ngoc:ruby,hong_ngoc_nhan:Math.floor(ruby*(1-fee)),trang_thai:'mo',nguoi_mua:'',tao_luc:A.now(),ban_luc:0,da_nhan:0};
        A.insert('cho',r);return {id:r.id,state:st.player};
      });
    },
    // Hủy ký gửi: trả món đồ về túi nhân vật đã ký gửi
    marketCancel(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const r=find('cho','id',p.id);if(!r||r.nguoi_ban!==a.id||r.trang_thai!=='mo')fail('KHONG_HUY_DUOC');
        const c=ownChar(a,r.nhan_vat_ban,'active'),st=stateOf(c),it=Player.cleanItem(JSON.parse(r.vat_pham));
        if(it)Player.addItem(st.player,it);storeState(c,st,st.player);
        r.trang_thai='huy';A.update('cho',r);return {charId:c.id,state:st.player};
      });
    },
    marketBuy(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const c=ownChar(a,p.charId,'active'),r=find('cho','id',p.id);
        if(!r||r.trang_thai!=='mo')fail('DA_BAN');if(r.nguoi_ban===a.id)fail('DO_CUA_MINH');
        const st=stateOf(c),price=Number(r.gia)||0,ruby=Number(r.hong_ngoc)||0,it=Player.cleanItem(JSON.parse(r.vat_pham));
        if(st.player.copper<price)fail('KHONG_DU_TIEN');if(st.player.rubies<ruby)fail('KHONG_DU_HONG_NGOC');if(!it)fail('VAT_PHAM_SAI');
        Player.addItem(st.player,it);st.player.copper-=price;st.player.rubies-=ruby;storeState(c,st,st.player);
        r.trang_thai='da_ban';r.nguoi_mua=p.charId;r.ban_luc=A.now();A.update('cho',r);
        return {item:it,price,ruby,state:st.player};
      });
    },
    // Nhận tiền bán hàng vào một nhân vật
    claim(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const c=ownChar(a,p.charId,'active'),st=stateOf(c);let sum=0,rsum=0;
        for(const r of pendingClaims(a.id)){sum+=Number(r.tien_nhan||0);rsum+=Number(r.hong_ngoc_nhan||0);r.da_nhan=1;A.update('cho',r);}
        st.player.copper+=sum;st.player.rubies+=rsum;storeState(c,st,st.player);return {amount:sum,ruby:rsum,state:st.player};
      });
    }
  };
  return {handle(action,p){try{if(!H[action])fail('KHONG_CO_LENH');return {ok:true,...H[action](p||{})};}catch(e){return {ok:false,error:String(e.message||e)};}}};
}

/* ================= LUẬT CHƠI: chỉ số, trang bị, phẩm chất, bộ đồ, gia cường, nhiệm vụ, lính đánh thuê ================= */
const Player=(()=>{
  const VERSION=7,BAG_SIZE=40,SKILL_SLOTS=10,MAX_LV=15,MAX_ACTIVE_QUEST=3,MAX_MERC=4;
  const slots=['mount','hat','wings','left','armor','right','gloves','pants','shoes'];
  const STAT_KEYS=['strength','agility','vitality','intelligence'];
  const ELEMENTS={
    fire:{name:'Hỏa',icon:'flame',color:'#ff8a3d',glow:'#ffd27a',st:['str']},water:{name:'Thủy',icon:'water',color:'#5fb6ff',glow:'#dcf1ff',st:['int']},
    earth:{name:'Thổ',icon:'earth',color:'#c99a5b',glow:'#f3dcaa',st:['vit']},metal:{name:'Kim',icon:'metal',color:'#e3cf7a',glow:'#fffbe2',st:['agi']},wood:{name:'Mộc',icon:'wood',color:'#8ed46a',glow:'#e5ffb8',st:['vit','int']},
    thunder:{name:'Lôi',icon:'thunder',color:'#c9a7ff',glow:'#f4ecff',st:['str']},wind:{name:'Phong',icon:'wind',color:'#8fe3c4',glow:'#e6fff5',st:['agi']},
    ice:{name:'Băng',icon:'ice',color:'#8fd3ff',glow:'#effaff',st:['int']},demon:{name:'Ma công',icon:'demon',color:'#c0508a',glow:'#ffb8dc',st:['cmd']},light:{name:'Ánh sáng',icon:'light',color:'#ffe680',glow:'#fffbe0',st:['vit']}
  };
  const BEASTS={horse:{seat:24,skill:'Đá hậu',icon:'mount',cmd:5},tiger:{seat:28,skill:'Vồ mồi',icon:'tiger',cmd:10},elephant:{seat:46,skill:'Dày xéo',icon:'elephant',cmd:15}};
  const GROUPS=[['str','Sức mạnh','punch'],['agi','Nhanh nhẹn','feather'],['vit','Sức khỏe','heart'],['int','Trí tuệ','spark'],['cmd','Mệnh lệnh','flag']];
  const FX_NAMES={stun:'Choáng',execute:'Kết liễu',shield:'Lá chắn',wave:'Sóng chém',aura:'Hào khí',cleave:'Chém lan',manaShield:'Khiên mana',lifesteal:'Hút máu',haste:'Thần tốc',burn:'Thiêu đốt',counter:'Phản công',heal:'Hồi phục',revive:'Hồi sinh'};
  const SLOT_OF={vu_khi:'right',tay_trai:'left',mu:'hat',ao:'armor',quan:'pants',gang:'gloves',giay:'shoes',canh:'wings',thu_cuoi:'mount'};
  const PAIRS=new Set(['sword|sword','shield|shield','staff|staff','shield|staff','shield|sword']);
  const ALIAS={'book-ice':'book-water','book-wind':'book-metal','book-thunder':'book-earth'};
  const skills={normal:{cost:0,cooldown:450},basic:{cost:10,cooldown:3000},intermediate:{cost:18,cooldown:6000},advanced:{cost:28,cooldown:10000},mount:{cost:12,cooldown:6000}};
  // Bảng sinh từ dữ liệu (Sheet)
  const CFG={},RAR={},ADD={},items={},SHOPS={},SETS={},MON={},QUESTS={},MERCS={},ENH=[],WEAPONS={};
  // Loại vũ khí (tab vu_khi): sát thương, tầm đánh, độ lan, thời gian một đòn, mana kỹ năng, thời gian hồi chiêu, nội tại mỗi đòn
  const W_DEF={punch:{name:'Tay không',dmg:.55,range:50,spread:75,dur:.32,mana:1,cd:1,passive:12}};
  const weapon=t=>WEAPONS[t]||W_DEF[t]||W_DEF.punch;
  const num=(v,f=0)=>{if(v===''||v==null)return f;const n=Number(typeof v==='string'?v.replace(/^'/,'').replace(',','.'):v);return Number.isFinite(n)?n:f;};
  const range=s=>{const [a,b]=String(s||'0-0').split('-').map(Number);return [num(a),num(b,num(a))];};
  const parseBonus=s=>{const o={};String(s||'').split(/[,;]/).forEach(p=>{const [k,v]=p.split(':').map(x=>x&&x.trim());if(k&&ADD[k]&&Number.isFinite(+v))o[k]=+v;});return o;};
  const clear=o=>{for(const k of Object.keys(o))delete o[k];};
  function load(data){
    [CFG,RAR,ADD,items,SHOPS,SETS,MON,QUESTS,MERCS,WEAPONS].forEach(clear);
    for(const r of data.vu_khi||[])WEAPONS[r.loai]={name:r.ten,dmg:num(r.sat_thuong,100)/100,range:num(r.tam_danh,80),spread:num(r.lan_rong),dur:Math.max(.15,num(r.toc_danh_ms,500)/1000),mana:num(r.mana,100)/100,cd:num(r.hoi_chieu,100)/100,passive:num(r.noi_tai,12)};ENH.length=0;
    for(const r of data.cau_hinh||[])CFG[r.khoa]=num(r.gia_tri,r.gia_tri);
    for(const r of data.gia_cuong||[])ENH[num(r.cap)]={rate:num(r.ti_le)/100,cost:num(r.phi_hong_ngoc),fail:r.that_bai_tu===''||r.that_bai_tu==null?null:[num(r.that_bai_tu),num(r.that_bai_den,num(r.that_bai_tu))]};
    for(const r of data.pham_chat||[])RAR[r.ma]={name:r.ten,color:r.mau,mul:num(r.he_so,100)/100,lines:num(r.so_dong),tier:num(r.bac),trade:r.giao_dich==='co',buy:r.mua_duoc==='co'};
    for(const r of data.thuoc_tinh||[])ADD[r.ma]={name:r.ten,group:r.nhom,unit:r.don_vi||'',ranges:[null,...['dep','hoan_hao','huyen_thoai','than'].map(k=>[num(r[k+'_thap']),num(r[k+'_cao'],num(r[k+'_thap']))])]};
    for(const r of data.vat_pham||[]){
      const slot=r.o||null,d={name:r.ten,slot,kind:r.loai||slot,grip:r.cam||'one',atk:num(r.cong),def:num(r.thu),speed:num(r.toc)/100,price:num(r.gia),tint:r.mau||null};
      if(slot==='mount'){d.beast=r.thu_cuoi||'horse';d.cmd=num(r.menh_lenh,BEASTS[d.beast].cmd);if(d.beast!=='horse')d.icon=d.beast;}
      if(slot==='book'){d.icon='book';d.element=r.he;}
      if(!slot)d.icon=r.loai||'ore';
      items[r.id]=d;
    }
    for(const r of data.cua_hang||[]){(SHOPS[r.cua_hang]=SHOPS[r.cua_hang]||[]).push({id:r.id,q:String(r.pham_chat||'n').split(',').map(x=>x.trim()),price:num(r.gia),order:num(r.thu_tu)});}
    for(const k of Object.keys(SHOPS))SHOPS[k].sort((a,b)=>a.order-b.order);
    for(const r of data.bo_huyen_thoai||[]){
      const S={id:r.id,hero:r.nhan_vat,gender:r.gioi_tinh,name:r.ten_bo,tiers:{3:parseBonus(r.moc_3),5:parseBonus(r.moc_5),7:parseBonus(r.moc_7)},fx:r.hieu_ung_9,fxv:num(r.gia_tri_9),fxText:r.mo_ta_9,pieces:[]};
      SETS[r.id]=S;
      for(const [col,slot] of Object.entries(SLOT_OF)){
        const id=r.id+':'+slot,base={name:r[col],set:r.id,gender:r.gioi_tinh,q:'l',price:num(CFG.gia_do_bo,5000),tint:'#e8c070'};
        if(slot==='right'||slot==='left'){const k=slot==='right'?r.vu_khi_loai:r.tay_trai_loai;Object.assign(base,{slot:'hand',kind:k,grip:'one',atk:k==='shield'?0:num(CFG.bo_cong_vu_khi,16)*(slot==='left'?.6:1),def:k==='shield'?num(CFG.bo_thu_khien,10):0});}
        else if(slot==='mount'){const b=r.thu_cuoi_loai||'horse';Object.assign(base,{slot,kind:'mount',beast:b,cmd:BEASTS[b].cmd,speed:num(CFG.bo_toc_thu_cuoi,155)/100,tint:b==='elephant'?'#a8aeb4':b==='tiger'?'#e89a3e':'#d8c8a8'});if(b!=='horse')base.icon=b;}
        else Object.assign(base,{slot,kind:slot,def:slot==='armor'?num(CFG.bo_thu_ao,12):num(CFG.bo_thu_nho,6)});
        base.atk=Math.round(base.atk||0);items[id]=base;S.pieces.push(id);
      }
    }
    for(const r of data.do_than||[]){
      const d={name:r.ten,slot:r.o,kind:r.loai,grip:r.cam||'one',atk:num(r.cong),def:num(r.thu),speed:num(r.toc)/100,price:num(r.gia,20000),tint:r.mau||null,q:'m',fx:r.hieu_ung,fxv:num(r.gia_tri),fxText:r.mo_ta,myth:true};
      if(d.slot==='mount'){d.beast=r.thu_cuoi||'horse';d.cmd=BEASTS[d.beast].cmd;}
      items[r.id]=d;
    }
    for(const r of data.quai||[])MON[r.id]={name:r.ten,hp:num(r.mau),dmg:num(r.sat_thuong),speed:num(r.toc_do),run:num(r.toc_chay),r:num(r.ban_kinh),h:num(r.cao),aggro:num(r.tam_danh),range:num(r.tam_gan),cd:num(r.hoi_chieu_ms)/1000,windup:num(r.vung_tay_ms)/1000,copper:num(r.dong),knock:num(r.day_lui_phan_tram)/100,boss:num(r.boss),respawn:num(r.hoi_sinh_giay,15),drops:{g:num(r.dep_phan_van)/1e4,p:num(r.hoan_hao_phan_van)/1e4,l:num(r.huyen_thoai_phan_van)/1e4,m:num(r.than_phan_van)/1e4},rubies:[num(r.hong_ngoc_it),num(r.hong_ngoc_nhieu)],dtype:r.loai_sat_thuong||'thuong',crit:num(r.ti_le_x2),exp:num(r.kinh_nghiem,Math.max(1,Math.round(num(r.mau)/8)))};
    for(const r of data.nhiem_vu||[])QUESTS[r.id]={id:r.id,name:r.ten,desc:r.mo_ta,target:r.muc_tieu,count:num(r.so_luong,1),copper:num(r.thuong_dong),rubies:num(r.thuong_hong_ngoc),item:r.thuong_do||'',itemQ:r.pham_chat_do||'n',repeat:r.lap_lai!=='khong',exp:num(r.thuong_kinh_nghiem,Math.round(num(r.thuong_dong)/10))};
    for(const r of data.linh||[])MERCS[r.id]={id:r.id,name:r.ten,gender:r.gioi_tinh==='f'?'f':'m',price:num(r.gia),cmd:num(r.menh_lenh,5),stats:{strength:num(r.suc_manh),agility:num(r.nhanh_nhen),vitality:num(r.suc_khoe),intelligence:num(r.tri_tue),command:0},gear:String(r.trang_bi||'').split(',').map(x=>x.trim()).filter(Boolean),desc:r.mo_ta};
  }
  const info=i=>i&&items[i.type];
  const kind=i=>info(i)?info(i).kind:null;
  const qOf=i=>{const d=info(i);return d?(d.q||i.q||'n'):'n';};
  const rar=i=>RAR[qOf(i)]||RAR.n||{name:'Thường',color:'#e8e6df',mul:1,lines:0,tier:0};
  const isTwo=i=>!!info(i)&&info(i).grip==='two';
  const pairOk=(a,b)=>PAIRS.has([a,b].sort().join('|'));
  const nameOf=i=>info(i)?info(i).name+(i.lv?' +'+i.lv:''):'';
  const SELL_MUL={n:1,g:2,p:5,l:10,m:20};
  const sellPrice=i=>Math.max(1,Math.floor((info(i)?info(i).price:0)*num(CFG.ti_le_ban_lai,40)/100*(SELL_MUL[qOf(i)]||1)));
  const canEnhance=i=>{const d=info(i);return !!d&&!!d.slot;};
  const tradeable=i=>!!info(i)&&!!rar(i).trade;
  const gainOf=d=>d.slot==='mount'?{speed:.03}:d.slot==='book'?{stat:num(CFG.sach_moi_cap,2)}:d.atk?{atk:2}:d.def?{def:1}:{};
  const r2=v=>Math.round(v*100)/100;
  // Thú cưỡi: +1..+6 tăng tốc; +7..+10 thêm sát thương; +11..+15 thêm cả máu, mana, phòng ngự (tốc độ tăng suốt 15 cấp)
  function mountGain(lv){
    const a=Math.max(0,lv-6),b=Math.max(0,lv-10);
    return {speed:num(CFG.thu_cuoi_toc_cap,3)/100*lv,atk:num(CFG.thu_cuoi_cong_cap,2)*a,hp:num(CFG.thu_cuoi_mau_cap,20)*b,mp:num(CFG.thu_cuoi_mana_cap,10)*b,def:num(CFG.thu_cuoi_thu_cap,2)*b};
  }
  // Sách: cộng vào chỉ số lớn theo hệ (Hỏa→Sức mạnh, Kim→Nhanh nhẹn, Thổ→Sức khỏe, Thủy→Trí tuệ, Mộc→Sức khỏe + Trí tuệ)
  const bookStat=it=>{const d=info(it);if(!d||!d.element)return {};const v=num(CFG.sach_chi_so,4)+num(CFG.sach_moi_cap,2)*(it.lv||0),k=ELEMENTS[d.element].st;return Object.fromEntries(k.map(x=>[x,k.length>1?Math.ceil(v/2):v]));};
  function stat(i){
    const d=info(i);if(!d)return {atk:0,def:0,speed:0,hp:0,mp:0};
    const lv=i.lv||0,g=gainOf(d),m=rar(i).mul;
    if(d.slot==='mount'){const G=mountGain(lv);return {atk:Math.round((d.atk||0)*m)+G.atk,def:Math.round((d.def||0)*m)+G.def,speed:r2(d.speed+G.speed),hp:G.hp,mp:G.mp};}
    return {atk:Math.round((d.atk||0)*m)+(g.atk||0)*lv,def:Math.round((d.def||0)*m)+(g.def||0)*lv,speed:d.speed?r2(d.speed+(g.speed||0)*lv):0,hp:0,mp:0};
  }
  const rnd36=rng=>(Math.floor(rng()*4294967296)>>>0).toString(36);
  const uid=(t,rng=Math.random)=>'it-'+String(t).replace(/[^a-z0-9]/gi,'').slice(0,12)+'-'+rnd36(rng)+rnd36(rng);
  // Chuỗi ngẫu nhiên dùng chung giữa máy người chơi và máy chủ (mulberry32, trạng thái s.rs do máy chủ giữ):
  // máy người chơi tính trước kết quả mua/gia cường/nhiệm vụ để hiện ngay, máy chủ tính lại y hệt rồi lưu
  function seqRng(s){return ()=>{let t=(s.rs=(s.rs+0x6D2B79F5)|0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  // Sinh món đồ với phẩm chất + dòng thuộc tính ngẫu nhiên
  function roll(type,q='n',rng=Math.random){
    const d=items[type];if(!d)throw Error('ITEM');
    const it={uid:uid(type,rng),type};if(!d.q&&q!=='n')it.q=q;
    const R=RAR[d.q||q]||{lines:0,tier:0};
    if(d.slot&&d.slot!=='book'&&R.lines){
      const keys=Object.keys(ADD).filter(k=>ADD[k].ranges[R.tier]);it.add={};
      for(let n=0;n<R.lines&&keys.length;n++){const k=keys.splice(Math.floor(rng()*keys.length),1)[0],[a,b]=ADD[k].ranges[R.tier];it.add[k]=a+Math.floor(rng()*(b-a+1));}
    }
    return it;
  }
  const BASE_DROP=()=>Object.keys(items).filter(k=>{const d=items[k];return !d.q&&d.slot&&d.slot!=='book'&&d.slot!=='mount';});
  const dropCap=()=>{const q=String(CFG.pham_chat_roi_toi_da||'').trim();return RAR[q]?RAR[q].tier:99;};
  function rollDrop(monId,rng=Math.random){
    const M=MON[monId];if(!M)return {items:[],rubies:0};
    const out=[],tries=M.boss===2?3:M.boss?2:1,cap=dropCap(),R=q=>RAR[q]?RAR[q].tier<=cap:true;
    // phẩm chất rơi cao nhất của bản đồ (cau_hinh: pham_chat_roi_toi_da); phẩm chất vượt mức thì không rơi
    const dm=R('m')?M.drops.m:0,dl=R('l')?M.drops.l:0,dp=R('p')?M.drops.p:0,dg=R('g')?M.drops.g:0;
    for(let t=0;t<tries;t++){
      const x=rng();let acc=0;
      if(x<(acc+=dm)){const pool=Object.keys(items).filter(k=>items[k].myth);if(pool.length)out.push(roll(pool[Math.floor(rng()*pool.length)],'m',rng));}
      else if(x<(acc+=dl)){const pool=Object.keys(items).filter(k=>items[k].set);if(pool.length)out.push(roll(pool[Math.floor(rng()*pool.length)],'l',rng));}
      else if(x<(acc+=dp)){const pool=BASE_DROP();out.push(roll(pool[Math.floor(rng()*pool.length)],'p',rng));}
      else if(x<(acc+=dg)){const pool=BASE_DROP();out.push(roll(pool[Math.floor(rng()*pool.length)],'g',rng));}
    }
    const [a,b]=M.rubies;return {items:out,rubies:b>0?a+Math.floor(rng()*(b-a+1)):0};
  }
  // Gia cường
  const enhRate=lv=>lv>=MAX_LV?0:(ENH[lv]?ENH[lv].rate:0);
  const enhCost=lv=>ENH[lv]?ENH[lv].cost:lv+1;
  function enhFail(lv,rng){const f=ENH[lv]?ENH[lv].fail:null;if(!f)return lv;const [a,b]=f;return a+Math.floor(rng()*(b-a+1));}
  // Mỗi NPC gia cường loại đồ của mình: thợ rèn (vũ khí, giáp), người nuôi thú (thú cưỡi), đạo sĩ (sách)
  const SHOP_ENH={smith:d=>d.slot!=='book'&&d.slot!=='mount',trainer:d=>d.slot==='mount',wizard:d=>d.slot==='book'};
  function enhance(s,ref,rng=Math.random,shop){
    const it=ref.where==='bag'?s.bag[ref.key]:ref.where==='skill'?s.skillSlots[ref.key]:s.equipment[ref.key];
    if(!canEnhance(it))throw Error('ITEM');
    if(shop&&SHOP_ENH[shop]&&!SHOP_ENH[shop](info(it)))throw Error('SHOP');
    const lv=it.lv||0;if(lv>=MAX_LV)throw Error('MAX');
    const cost=enhCost(lv);if(s.rubies<cost)throw Error('RUBY');
    s.rubies-=cost;const ok=rng()<enhRate(lv);it.lv=ok?lv+1:enhFail(lv,rng);
    return {ok,from:lv,to:it.lv,cost};
  }
  // Tạo nhân vật mới (từ thông tin máy chủ)
  function create(ch){
    const bag=Array(BAG_SIZE).fill(null);
    ['crossbow','bow','spear','staff','shield','hat','armor'].forEach((type,i)=>bag[i]={uid:'training-'+type+'-'+i,type});
    const st=Object.fromEntries(STAT_KEYS.map(k=>[k,Math.max(0,Math.floor(num(ch&&ch.stats&&ch.stats[k],12)))]));st.command=num(CFG.menh_lenh_goc,10);
    const s={name:(ch&&ch.name)||'Lữ khách',gender:ch&&ch.gender==='f'?'f':'m',level:1,exp:0,points:0,alloc:Object.fromEntries([...STAT_KEYS,'command'].map(k=>[k,0])),stats:st,hp:1e9,mana:1e9,passive:0,copper:num(CFG.tien_thu_nghiem,0),rubies:num(CFG.hong_ngoc_thu_nghiem,0),
      flags:{river:false,hunted:false,kills:{},wells:{}},equipment:Object.fromEntries(slots.map(k=>[k,k==='right'?{uid:'training-sword',type:'sword'}:null])),bag,skillSlots:Array(SKILL_SLOTS).fill(null),activeBook:null,cooldowns:{},
      quests:{active:{},done:{}},mercs:[],pets:[],rs:(Math.random()*2147483647)|0};
    const D=derive(s);s.hp=D.tot.hp;s.mana=D.tot.mp;return s;
  }
  // Tính toàn bộ chỉ số: 5 chỉ số lớn + chỉ số nhỏ (base + phần cộng thêm từ đồ, bộ, sách)
  const CAPS={dodge:50,block:60,dmgRed:70,cdr:50,crit2:60,crit3:30,perfRed:80,critRed:80,legRed:80,mythRed:80,acc:100};
  function derive(s,opt={}){
    const A={},add=(k,v)=>{if(v)A[k]=(A[k]||0)+v;};
    const eqs=slots.map(k=>s.equipment[k]).filter(it=>info(it)&&!(opt.safe&&info(it).slot==='mount'));
    let atk=0,mount=null,shield=false;const setCount={},fx={};
    for(const it of eqs){
      const d=info(it),st=stat(it);atk+=st.atk;add('def',st.def);add('hp',st.hp);add('mp',st.mp);
      if(d.slot==='mount'){mount=d;if(st.speed>1)add('moveSpd',Math.round((st.speed-1)*100));}
      if(d.kind==='shield')shield=true;
      for(const [k,v] of Object.entries(it.add||{}))if(ADD[k])add(k,num(v));
      if(d.set&&(!d.gender||d.gender===s.gender))setCount[d.set]=(setCount[d.set]||0)+1;
      if(d.fx)fx[d.fx]=Math.max(fx[d.fx]||0,d.fxv);
    }
    if(atk){add('dmgMin',Math.round(atk*.8));add('dmgMax',Math.round(atk*1.3));}
    if(shield)add('block',10);
    const sets=[];
    for(const [id,n] of Object.entries(setCount)){const S=SETS[id];if(!S)continue;sets.push({id,n,name:S.name,hero:S.hero});for(const t of [3,5,7])if(n>=t)for(const [k,v] of Object.entries(S.tiers[t]))add(k,v);if(n>=9)fx[S.fx]=Math.max(fx[S.fx]||0,S.fxv);}
    const books={},blv={};for(const it of (s.skillSlots||[])){const d=info(it);if(d&&d.element){books[d.element]=true;blv[d.element]=Math.max(blv[d.element]??-1,it.lv||0);for(const [k,v] of Object.entries(bookStat(it)))add(k,v);}}
    const pc=(k,f,e)=>blv[e]>=0?num(CFG[k],f)+num(CFG.sach_ti_le_cap,1)*blv[e]:0;
    const bfx={thunder:pc('loi_ti_le',12,'thunder'),wind:pc('phong_ti_le',20,'wind'),ice:pc('bang_ti_le',10,'ice'),light:pc('sang_ti_le',15,'light'),demon:blv.demon>=0?blv.demon:-1};
    if(books.water)add('mpReg',num(CFG.thuy_hoi_mana,3));if(books.wood)add('hpReg',num(CFG.moc_hoi_mau,2));if(books.earth)add('reflect',num(CFG.tho_phan_don,30));if(books.metal)add('dmgRed',num(CFG.kim_giam_sat_thuong,25));
    const st=s.stats||{},al=s.alloc||{};
    const main={str:num(st.strength)+num(al.strength)+(A.str||0),agi:num(st.agility)+num(al.agility)+(A.agi||0),vit:num(st.vitality)+num(al.vitality)+(A.vit||0),int:num(st.intelligence)+num(al.intelligence)+(A.int||0),cmd:num(st.command)+num(al.command)+(A.cmd||0)};
    const base={dmgMin:main.str*.6,dmgMax:main.str,crit2:main.str*.1,atkSpd:main.agi*.6,moveSpd:main.agi*.3,def:main.agi*.3,dodge:main.agi*.2,hp:num(CFG.mau_goc,60)+main.vit*num(CFG.mau_moi_diem,5),mp:num(CFG.mana_goc,40)+main.int*num(CFG.mana_moi_diem,4),cdr:main.int*.3};
    const tot={};for(const k of Object.keys(ADD)){if(GROUPS.some(g=>g[0]===k))continue;let v=(base[k]||0)+(A[k]||0);if(CAPS[k])v=Math.min(CAPS[k],v);tot[k]=ADD[k].unit?Math.round(v*10)/10:Math.round(v);}
    tot.hp=Math.round(tot.hp);tot.mp=Math.round(tot.mp);tot.dmgMax=Math.max(tot.dmgMax,tot.dmgMin);
    return {main,add:A,tot,fx,books,bfx,sets,mount,dmgMul:books.fire?1+num(CFG.hoa_sat_thuong,25)/100:1};
  }
  const mountCmd=eq=>eq&&eq.mount&&info(eq.mount)?info(eq.mount).cmd||5:0;
  // Mệnh lệnh: thú cưỡi + mỗi lính đang đi theo tốn số điểm riêng của lính đó (lính gục chờ ở làng vẫn giữ chỗ)
  function mercCmd(s){return (s.mercs||[]).reduce((a,m)=>a+(m.on?num(m.cmd,5):0),0);}
  // Mệnh lệnh: tổng, đã dùng (thú cưỡi, lính), còn trống
  function cmdInfo(s){const total=derive(s).main.cmd,mount=mountCmd(s.equipment),merc=mercCmd(s);return {total,mount,merc,used:mount+merc,free:total-mount-merc};}
  function fitFollow(s,m){return (m.hpFrac===undefined||m.hpFrac>0)&&cmdInfo(s).free>=num(m.cmd,5);}
  function stash(bag,list,prefer){const b=bag.slice();for(const it of list){const i=prefer!=null&&b[prefer]===null?prefer:b.indexOf(null);if(i<0)throw Error('BAG_FULL');b[i]=it;prefer=null;}return b;}
  function targets(s,item){
    const d=info(item);if(!d||!d.slot||d.slot==='book')return [];
    if(d.gender&&d.gender!==s.gender)return [];
    if(d.slot!=='hand')return [d.slot];
    if(d.grip==='two')return ['right'];
    const eq=s.equipment;if(isTwo(eq.right))return ['left','right'];
    return ['left','right'].filter(sl=>{const o=eq[sl==='left'?'right':'left'];return !o||pairOk(d.kind,kind(o));});
  }
  function equip(s,index,slot){
    if(!Number.isInteger(index)||index<0||index>=BAG_SIZE)throw Error('SLOT');
    const item=s.bag[index],d=info(item);if(!d||!slots.includes(slot))throw Error('SLOT');
    if(d.gender&&d.gender!==s.gender)throw Error('GENDER');
    if(d.slot==='mount'&&!s.isMerc){const need=d.cmd||5;if(need>derive(s).main.cmd-mercCmd(s))throw Error('CMD');}
    if(d.slot!=='hand'){if(d.slot!==slot)throw Error('SLOT');s.bag[index]=s.equipment[slot];s.equipment[slot]=item;return;}
    if(slot!=='left'&&slot!=='right')throw Error('SLOT');
    const eq=s.equipment;let bag=s.bag.slice();bag[index]=null;
    if(d.grip==='two'){bag=stash(bag,[eq.right,eq.left].filter(Boolean),index);s.bag=bag;eq.right=item;eq.left=null;return;}
    const prevTwo=isTwo(eq.right)?eq.right:null,other=prevTwo?null:eq[slot==='left'?'right':'left'];
    if(other&&!pairOk(d.kind,kind(other)))throw Error('PAIR');
    bag=stash(bag,prevTwo?[prevTwo]:(eq[slot]?[eq[slot]]:[]),index);
    s.bag=bag;if(prevTwo){eq.right=null;eq.left=null;}eq[slot]=item;
  }
  function unequip(s,slot){
    if(!slots.includes(slot))throw Error('SLOT');
    const key=slot==='left'&&isTwo(s.equipment.right)?'right':slot,it=s.equipment[key];if(!it)return;
    const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.bag[i]=it;s.equipment[key]=null;
  }
  function stance(s){
    const L=s.equipment.left,R=s.equipment.right;
    if(isTwo(R))return {type:kind(R),two:true,dual:false,shield:false,left:null,right:kind(R),tintL:null,tintR:info(R).tint||null,lvL:0,lvR:R.lv||0,itL:null,itR:R.type};
    const l=kind(L),r=kind(R),types=[l,r].filter(Boolean);
    const base={two:false,left:l,right:r,tintL:L?info(L).tint||null:null,tintR:R?info(R).tint||null:null,lvL:L?L.lv||0:0,lvR:R?R.lv||0:0,itL:L?L.type:null,itR:R?R.type:null};
    if(!types.length)return {...base,type:'punch',dual:false,shield:false};
    const type=types.includes('sword')?'sword':types.includes('staff')?'staff':'shield';
    return {...base,type,dual:types.length===2&&l===r,shield:types.includes('shield')&&type!=='shield'};
  }
  function setSkill(s,bagIndex,slotIndex){
    const item=s.bag[bagIndex];if(!info(item)||info(item).slot!=='book')throw Error('BOOK');
    if(slotIndex==null){slotIndex=s.skillSlots.indexOf(null);if(slotIndex<0)slotIndex=s.activeBook??0;}
    if(slotIndex<0||slotIndex>=SKILL_SLOTS)throw Error('SLOT');
    s.bag[bagIndex]=s.skillSlots[slotIndex];s.skillSlots[slotIndex]=item;s.activeBook=slotIndex;
  }
  function unsetSkill(s,i){const it=s.skillSlots[i];if(!it)return;const b=s.bag.indexOf(null);if(b<0)throw Error('BAG_FULL');s.bag[b]=it;s.skillSlots[i]=null;if(s.activeBook===i)s.activeBook=s.skillSlots.findIndex(Boolean);if(s.activeBook<0)s.activeBook=null;}
  function toggleBook(s,i){if(!s.skillSlots[i])return;s.activeBook=s.activeBook===i?null:i;}
  function element(s){const b=s.activeBook!=null?s.skillSlots[s.activeBook]:null;return b&&info(b)?info(b).element:null;}
  function money(c){return {gold:Math.floor(c/10000),silver:Math.floor(c/100)%100,copper:c%100};}
  function shopPrice(type,q='n'){const d=items[type];if(!d)return 0;let row=null;for(const k in SHOPS){row=SHOPS[k].find(r=>r.id===type)||row;}const p=row&&row.price?row.price:d.price;return Math.round(p*(q==='g'?num(CFG.he_so_gia_do_dep,250)/100:1));}
  function buy(s,type,q='n',rng=Math.random){const d=items[type];if(!d||!d.price||d.q)throw Error('ITEM');const price=shopPrice(type,q);if(s.copper<price)throw Error('MONEY');const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.copper-=price;s.bag[i]=roll(type,q,rng);return i;}
  function sell(s,index){const it=s.bag[index];if(!it)throw Error('SLOT');const v=sellPrice(it);s.copper+=v;s.bag[index]=null;return v;}
  function addItem(s,it){const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.bag[i]=it;return i;}
  // Mana kỹ năng theo loại vũ khí đang cầm (thú cưỡi không đổi)
  function skillCost(s,id,W){const k=skills[id];if(!k)return 0;return id==='mount'||!k.cost?k.cost:Math.round(k.cost*(W||weapon(stance(s).type)).mana);}
  function cast(s,id,now,D){
    const skill=skills[id];if(!skill)return {ok:false,error:'SKILL'};
    if(id==='mount'&&!s.equipment.mount)return {ok:false,error:'NOMOUNT'};
    if(now<(s.cooldowns[id]||0))return {ok:false,error:'COOLDOWN'};
    const W=weapon(stance(s).type),cost=skillCost(s,id,W);
    if(s.mana<cost)return {ok:false,error:'MANA'};
    const cdr=D?D.tot.cdr:0;
    s.mana-=cost;s.cooldowns[id]=now+skill.cooldown*(1-cdr/100)*(id==='normal'||id==='mount'?1:W.cd);
    const empowered=id==='normal'&&s.passive>=100;
    if(id==='normal')s.passive=empowered?0:Math.min(100,s.passive+W.passive);
    return {ok:true,stance:stance(s),empowered};
  }
  // Nhiệm vụ của Lý trưởng
  function questAccept(s,id){const Q=QUESTS[id];if(!Q)throw Error('QUEST');if(s.quests.active[id]!=null)throw Error('QUEST_HAVE');if(Object.keys(s.quests.active).length>=MAX_ACTIVE_QUEST)throw Error('QUEST_FULL');if(!Q.repeat&&s.quests.done[id])throw Error('QUEST_DONE');s.quests.active[id]=0;}
  function questProgress(s,monId){const out=[];for(const id of Object.keys(s.quests.active)){const Q=QUESTS[id];if(Q&&Q.target===monId&&s.quests.active[id]<Q.count){s.quests.active[id]++;out.push(id);}}return out;}
  function questTurnIn(s,id,rng=Math.random){
    const Q=QUESTS[id];if(!Q||s.quests.active[id]==null)throw Error('QUEST');if(s.quests.active[id]<Q.count)throw Error('QUEST_NOT_DONE');
    let it=null;if(Q.item&&items[Q.item]){if(s.bag.indexOf(null)<0)throw Error('BAG_FULL');let q=Q.itemQ||'n';if(RAR[q]&&RAR[q].tier>dropCap())q='p';it=roll(Q.item,q,rng);addItem(s,it);}
    s.copper+=Q.copper;s.rubies+=Q.rubies;delete s.quests.active[id];s.quests.done[id]=(s.quests.done[id]||0)+1;const up=gainExp(s,Q.exp);return {copper:Q.copper,rubies:Q.rubies,item:it,exp:Q.exp,up};
  }
  // Kinh nghiệm và cấp: điểm cần cho mỗi cấp tăng dần; lên cấp được điểm cộng vào 4 chỉ số
  const maxLevel=()=>num(CFG.cap_toi_da,60),petMax=()=>num(CFG.ma_toi_da,2);
  const expNeed=lv=>Math.round(num(CFG.exp_goc,60)*Math.pow(Math.max(1,lv),num(CFG.exp_tang,150)/100));
  function gainExp(s,n){
    n=Math.max(0,Math.floor(num(n)));let up=0;if(s.level>=maxLevel()){s.exp=0;return 0;}
    s.exp=(s.exp||0)+n;
    while(s.level<maxLevel()&&s.exp>=expNeed(s.level)){s.exp-=expNeed(s.level);s.level++;s.points=(s.points||0)+num(CFG.diem_moi_cap,5);up++;}
    if(s.level>=maxLevel())s.exp=0;
    if(up){const D=derive(s);s.hp=D.tot.hp;s.mana=D.tot.mp;}
    return up;
  }
  const STAT_OF={str:'strength',agi:'agility',vit:'vitality',int:'intelligence',cmd:'command'};
  function spendPoints(s,k,n){const key=STAT_OF[k]||k;n=Math.floor(num(n,1));if(![...STAT_KEYS,'command'].includes(key)||!(n>=1))throw Error('STAT');if((s.points||0)<n)throw Error('POINTS');s.points-=n;s.alloc[key]=(s.alloc[key]||0)+n;}
  // Lính đánh thuê
  function makeMerc(o,rng=Math.random){
    const m={mid:'mc-'+rnd36(rng),src:o.src||'npc',tpl:o.tpl||'',from:o.from||'',name:String(o.name||'Lính').slice(0,20),gender:o.gender==='f'?'f':'m',cmd:num(o.cmd,10),
      stats:{strength:num(o.stats&&o.stats.strength,10),agility:num(o.stats&&o.stats.agility,10),vitality:num(o.stats&&o.stats.vitality,10),intelligence:num(o.stats&&o.stats.intelligence,10),command:0},equipment:Object.fromEntries(slots.map(k=>[k,null])),hpFrac:1};
    const eq=o.equipment||{};for(const k of slots){const it=cleanItem(eq[k]);if(it)m.equipment[k]=it;}
    return m;
  }
  function hireNpc(s,id,rng=Math.random){
    const T=MERCS[id];if(!T)throw Error('MERC');if(s.mercs.length>=MAX_MERC)throw Error('MERC_FULL');if(s.copper<T.price)throw Error('MONEY');
    const m=makeMerc({src:'npc',tpl:id,name:T.name,gender:T.gender,cmd:T.cmd,stats:T.stats},rng);
    let hand=0;for(const g of T.gear){const d=items[g];if(!d)continue;const it=roll(g,'n',rng);if(d.slot==='hand'){const sl=d.grip==='two'?'right':hand++?'left':'right';m.equipment[sl]=it;}else if(d.slot!=='mount')m.equipment[d.slot]=it;}
    s.copper-=T.price;m.on=fitFollow(s,m);s.mercs.push(m);return m;
  }
  function addMerc(s,o){if(s.mercs.length>=MAX_MERC)throw Error('MERC_FULL');const m=makeMerc(o);m.on=fitFollow(s,m);s.mercs.push(m);return m;}
  // Cho lính đi theo / nghỉ. Lính gục phải chờ ở làng, chủ về làng mới dắt đi tiếp được
  function setFollow(s,i,on){
    const m=s.mercs[i];if(!m)throw Error('MERC');
    if(!on){m.on=false;return;}
    if(m.on)return;if(!(m.hpFrac>0))throw Error('MERC_DOWN');if(cmdInfo(s).free<num(m.cmd,5))throw Error('CMD');m.on=true;
  }
  const mercProxy=(s,m)=>({equipment:m.equipment,bag:s.bag,gender:m.gender,stats:m.stats,isMerc:true});
  function mercEquip(s,i,bagIndex,slot){const m=s.mercs[i];if(!m)throw Error('MERC');const P=mercProxy(s,m);equip(P,bagIndex,slot);s.bag=P.bag;}
  function mercUnequip(s,i,slot){const m=s.mercs[i];if(!m)throw Error('MERC');const P=mercProxy(s,m);unequip(P,slot);s.bag=P.bag;}
  function dismissMerc(s,i){const m=s.mercs[i];if(!m)throw Error('MERC');const list=slots.map(k=>m.equipment[k]).filter(Boolean);if(s.bag.filter(x=>!x).length<list.length)throw Error('BAG_FULL');for(const it of list)addItem(s,it);s.mercs.splice(i,1);}
  // Lưu / khôi phục
  function cleanItem(i){
    if(!i||typeof i.uid!=='string')return null;const type=ALIAS[i.type]||i.type;const d=items[type];if(!d)return null;
    const it={uid:i.uid.slice(0,80),type};const lv=Math.floor(num(i.lv));if(lv>0&&canEnhance(it))it.lv=Math.min(MAX_LV,lv);
    if(!d.q&&RAR[i.q]&&i.q!=='n')it.q=i.q;
    if(i.add&&typeof i.add==='object'){const a={};for(const [k,v] of Object.entries(i.add))if(ADD[k]&&Number.isFinite(+v))a[k]=Math.max(0,Math.min(999,+v));if(Object.keys(a).length)it.add=a;}
    return it;
  }
  function serialize(s,pos,seen){return {v:VERSION,player:s,pos:{x:pos.x,y:pos.y,...(pos.map?{map:pos.map}:{})},seen:[...seen]};}
  function restorePlayer(p,ch){
    const s=create(ch),n=(v,a,b,f)=>typeof v==='number'&&Number.isFinite(v)?Math.max(a,Math.min(b,v)):f,used=new Set();
    const valid=i=>{const it=cleanItem(i);if(!it||used.has(it.uid))return null;used.add(it.uid);return it;};
    s.level=Math.floor(n(p.level,1,maxLevel(),1));s.exp=Math.floor(n(p.exp,0,expNeed(s.level),0));s.points=Math.floor(n(p.points,0,99999,0));s.passive=n(p.passive,0,100,0);
    for(const k of [...STAT_KEYS,'command'])s.alloc[k]=Math.floor(n(p.alloc&&p.alloc[k],0,99999,0));
    if(Number.isFinite(+p.rs))s.rs=(+p.rs)|0;
    s.copper=Math.floor(n(p.copper,0,Number.MAX_SAFE_INTEGER,0));s.rubies=Math.floor(n(p.rubies,0,Number.MAX_SAFE_INTEGER,0));
    s.stats.command=Math.floor(n(p.stats&&p.stats.command,0,999,s.stats.command));
    if(p.flags){s.flags.river=!!p.flags.river;s.flags.hunted=!!p.flags.hunted;if(p.flags.wells&&typeof p.flags.wells==='object')for(const [k,v] of Object.entries(p.flags.wells))if(/^gieng-\d+$/.test(k)&&Number.isFinite(+v))s.flags.wells[k]=+v;for(const [k,v] of Object.entries(p.flags.kills||{}))if(MON[k])s.flags.kills[k]=Math.floor(n(v,0,1e9,0));}
    const extra=[],eq=Object.fromEntries(slots.map(k=>[k,null]));
    for(const k of slots){const it=valid(p.equipment&&p.equipment[k]);if(!it)continue;const d=items[it.type];const ok=(d.slot==='hand'?(k==='left'||k==='right'):d.slot===k)&&(!d.gender||d.gender===s.gender);if(ok)eq[k]=it;else extra.push(it);}
    if(isTwo(eq.left)){extra.push(eq.left);eq.left=null;}
    if(isTwo(eq.right)&&eq.left){extra.push(eq.left);eq.left=null;}
    if(eq.left&&eq.right&&!pairOk(kind(eq.left),kind(eq.right))){extra.push(eq.left);eq.left=null;}
    s.equipment=eq;
    const srcBag=Array.isArray(p.bag)?p.bag:[];s.bag=Array.from({length:BAG_SIZE},(_,i)=>valid(srcBag[i]));
    const srcSk=Array.isArray(p.skillSlots)?p.skillSlots:[];
    s.skillSlots=Array.from({length:SKILL_SLOTS},(_,i)=>{const it=valid(srcSk[i]);if(it&&items[it.type].slot!=='book'){extra.push(it);return null;}return it;});
    s.activeBook=Number.isInteger(p.activeBook)&&s.skillSlots[p.activeBook]?p.activeBook:null;
    for(const it of extra){const i=s.bag.indexOf(null);if(i>=0)s.bag[i]=it;}
    for(const k of Object.keys(skills))s.cooldowns[k]=n(p.cooldowns&&p.cooldowns[k],0,Date.now()+skills[k].cooldown,0);
    if(p.quests){for(const [k,v] of Object.entries(p.quests.active||{}))if(QUESTS[k])s.quests.active[k]=Math.floor(n(v,0,999,0));for(const [k,v] of Object.entries(p.quests.done||{}))if(QUESTS[k])s.quests.done[k]=Math.floor(n(v,0,1e6,0));}
    if(Array.isArray(p.mercs))s.mercs=p.mercs.slice(0,MAX_MERC).map(m=>{const x=makeMerc(m);x.mid=typeof m.mid==='string'?m.mid.slice(0,30):x.mid;x.hpFrac=n(m.hpFrac,0,1,1);x.on=!!m.on;return x;});
    if(Number.isInteger(p.activeMerc)&&s.mercs[p.activeMerc])s.mercs[p.activeMerc].on=true; // bản cũ: 1 lính
    if(Array.isArray(p.pets))s.pets=p.pets.filter(x=>x&&MON[x.type]&&!MON[x.type].boss&&typeof x.pid==='string').slice(0,petMax()).map(x=>({pid:x.pid.slice(0,30),type:x.type,hpFrac:n(x.hpFrac,0,1,1)}));
    const D=derive(s);
    // lính vượt quá Mệnh lệnh đang có thì cho nghỉ (theo thứ tự trong danh sách)
    {let left=D.main.cmd-mountCmd(s.equipment);for(const m of s.mercs)if(m.on){if(num(m.cmd,5)<=left)left-=num(m.cmd,5);else m.on=false;}}
    s.hp=n(p.hp,1,D.tot.hp,D.tot.hp);s.mana=n(p.mana,0,D.tot.mp,D.tot.mp);
    return s;
  }
  function restore(save,ch,canStand,npcIds){
    if(!save||!save.player)return {player:create(ch),pos:null,seen:[]};
    const s=restorePlayer(save.player,ch),pos=save.pos;
    return {player:s,pos:pos&&canStand&&canStand(pos.x,pos.y)?{x:pos.x,y:pos.y,...(typeof pos.map==='string'?{map:pos.map}:{})}:null,seen:Array.isArray(save.seen)?save.seen.filter(v=>npcIds?npcIds.includes(v):typeof v==='string'&&/^[a-z0-9-]{1,40}$/.test(v)):[]};
  }
  /* ---------- v8: máy chủ quyết định tiền, đồ, gia cường ----------
     merge(S,C): S = trạng thái máy chủ (đồ nào tồn tại, tiền, hồng ngọc, nhiệm vụ),
                 C = trạng thái máy người chơi (chỉ được sắp xếp đồ đang có + máu, mana, giếng…).
     Người chơi không thể tự sinh đồ hay tiền: món nào không có trên máy chủ thì bị bỏ, món mới trên máy chủ tự vào túi. */
  const allItems=s=>[...(s.bag||[]),...Object.values(s.equipment||{}),...(s.skillSlots||[]),...(s.mercs||[]).flatMap(m=>Object.values(m.equipment||{}))].filter(it=>it&&typeof it.uid==='string');
  // Sắp xếp đồ của người chơi lúc ra lệnh (chỉ mã đồ): b túi, e trang bị, s ô sách, m trang bị lính, a sách đang dùng
  function layout(s){const u=x=>x&&x.uid||null,eq=E=>Object.fromEntries(slots.map(k=>[k,u(E&&E[k])]));return {b:(s.bag||[]).map(u),e:eq(s.equipment),s:(s.skillSlots||[]).map(u),m:Object.fromEntries((s.mercs||[]).map(m=>[m.mid,eq(m.equipment)])),a:s.activeBook};}
  function relayout(S,L){
    if(!L||typeof L!=='object')return S;const it=u=>typeof u==='string'?{uid:u}:null,eq=E=>Object.fromEntries(slots.map(k=>[k,it(E&&E[k])]));
    return merge(S,{...S,bag:(Array.isArray(L.b)?L.b:[]).map(it),equipment:eq(L.e),skillSlots:(Array.isArray(L.s)?L.s:[]).map(it),activeBook:L.a,mercs:(S.mercs||[]).map(m=>({...m,equipment:eq(L.m&&L.m[m.mid])}))});
  }
  function merge(S,C){
    const chOf={name:S.name,gender:S.gender,stats:S.stats};
    const soft={hp:C&&C.hp,mana:C&&C.mana,passive:C&&C.passive,cooldowns:C&&C.cooldowns,flags:{...S.flags,river:!!(S.flags&&S.flags.river)||!!(C&&C.flags&&C.flags.river),wells:(C&&C.flags&&C.flags.wells)||(S.flags&&S.flags.wells)||{}}};
    const softOnly=()=>restorePlayer({...S,...soft},chOf);
    if(!C||typeof C!=='object')return restorePlayer(S,chOf);
    const pool=new Map(allItems(S).map(it=>[it.uid,it]));
    const take=x=>{if(!x||typeof x.uid!=='string')return null;const it=pool.get(x.uid);if(!it)return null;pool.delete(x.uid);return it;};
    const cm=new Map((Array.isArray(C.mercs)?C.mercs:[]).filter(m=>m&&typeof m.mid==='string').map(m=>[m.mid,m]));
    const mercs=(S.mercs||[]).map(m=>({...m,equipment:Object.fromEntries(slots.map(k=>[k,null]))}));
    mercs.forEach((m,i)=>{if(!cm.has(m.mid))for(const k of slots)m.equipment[k]=take((S.mercs[i].equipment||{})[k]);});
    mercs.forEach(m=>{const c=cm.get(m.mid);if(!c)return;for(const k of slots)m.equipment[k]=take(c.equipment&&c.equipment[k]);if(Number.isFinite(+c.hpFrac))m.hpFrac=Math.max(0,Math.min(1,+c.hpFrac));m.on=!!c.on;});
    const cp=new Map((Array.isArray(C.pets)?C.pets:[]).filter(x=>x&&typeof x.pid==='string').map(x=>[x.pid,x])),pets=(S.pets||[]).map(x=>{const c=cp.get(x.pid);return c&&Number.isFinite(+c.hpFrac)?{...x,hpFrac:Math.max(0,Math.min(1,+c.hpFrac))}:x;});
    const equipment=Object.fromEntries(slots.map(k=>[k,take(C.equipment&&C.equipment[k])]));
    const skillSlots=Array.from({length:SKILL_SLOTS},(_,i)=>take(Array.isArray(C.skillSlots)?C.skillSlots[i]:null));
    const bag=Array.from({length:BAG_SIZE},(_,i)=>take(Array.isArray(C.bag)?C.bag[i]:null));
    for(const it of pool.values()){const i=bag.indexOf(null);if(i<0)return softOnly();bag[i]=it;}
    const R=restorePlayer({...S,...soft,activeBook:C.activeBook,equipment,skillSlots,bag,mercs,pets},chOf);
    return allItems(R).length===allItems(S).length?R:softOnly();
  }
  // Các lệnh làm thay đổi tiền/đồ, chạy trên máy chủ (và trên trình duyệt ở chế độ ngoại tuyến)
  const KILL_LIMIT=id=>MON[id].boss?1:3;
  const PREDICT=new Set(['kill','buy','sell','enh','enhSk','qa','qt','hire','dismiss','pt','petOff']);
  function applyOp(s,op,srv,now=Date.now(),rng=Math.random){
    const t=op&&op.t;if(PREDICT.has(t))rng=seqRng(s);
    if(t==='kill'){
      const M=MON[op.mon];if(!M)throw Error('MON');
      srv.kills=srv.kills||{};const win=Math.max(5,M.respawn)*1000,log=(srv.kills[op.mon]||[]).filter(x=>now-x<win);
      if(log.length>=KILL_LIMIT(op.mon))throw Error('NHANH_QUA');log.push(now);srv.kills[op.mon]=log;
      s.copper+=M.copper;s.flags.kills[op.mon]=(s.flags.kills[op.mon]||0)+1;
      const drop=rollDrop(op.mon,rng),items=[],lost=[];s.rubies+=drop.rubies;
      for(const it of drop.items){try{addItem(s,it);items.push(it);}catch(e){lost.push(it);}}
      const done=questProgress(s,op.mon).filter(id=>s.quests.active[id]>=QUESTS[id].count);
      let bonus=0;const k=s.flags.kills;if(!s.flags.hunted&&k.deer&&k.lion&&k.elephant&&k.croc){s.flags.hunted=true;s.copper+=100;bonus=100;}
      const up=gainExp(s,M.exp);
      // Sách Ma công: tỉ lệ thu phục quái (không áp dụng cho trùm), tăng theo Mệnh lệnh và cấp sách
      let pet=null;if(!M.boss&&(s.pets=s.pets||[]).length<petMax()){const D=derive(s);if(D.bfx.demon>=0){const ch=num(CFG.ma_ti_le_goc,2)+D.main.cmd*num(CFG.ma_phan_van_moi_menh_lenh,20)/100+num(CFG.sach_ti_le_cap,1)*D.bfx.demon;if(rng()*100<ch){pet={pid:'pet-'+rnd36(rng),type:op.mon,hpFrac:1};s.pets.push(pet);}}}
      return {mon:op.mon,copper:M.copper,rubies:drop.rubies,items,lost,done,bonus,exp:M.exp,up,level:s.level,pet};
    }
    if(t==='buy'){const i=buy(s,String(op.type),op.q==='g'?'g':'n',rng);return {i,item:s.bag[i]};}
    if(t==='sell'){const i=Math.floor(op.i),it=s.bag[i];const v=sell(s,i);return {v,item:it};}
    if(t==='enh'){const bag=op.where==='bag',key=bag?Math.floor(op.key):String(op.key);if(!bag&&!slots.includes(key))throw Error('SLOT');const r=enhance(s,{where:bag?'bag':'equipment',key},rng,op.shop);return {...r,item:bag?s.bag[key]:s.equipment[key]};}
    if(t==='enhSk'){const key=Math.floor(op.key);if(!(key>=0&&key<SKILL_SLOTS))throw Error('SLOT');const r=enhance(s,{where:'skill',key},rng,op.shop||'wizard');return {...r,item:s.skillSlots[key]};}
    if(t==='qa'){questAccept(s,String(op.id));return {};}
    if(t==='qt'){return questTurnIn(s,String(op.id),rng);}
    if(t==='hire'){const m=hireNpc(s,String(op.id),rng);return {mid:m.mid,name:m.name};}
    if(t==='petOff'){const i=(s.pets||[]).findIndex(x=>x.pid===op.pid);if(i<0)throw Error('PET');const x=s.pets.splice(i,1)[0];return {type:x.type};}
    if(t==='pt'){spendPoints(s,String(op.k),op.n);return {k:op.k,points:s.points};}
    if(t==='dismiss'){const i=Math.floor(op.i),m=s.mercs[i];dismissMerc(s,i);return {name:m?m.name:''};}
    throw Error('LENH');
  }
  load(typeof GAME_DATA!=='undefined'?GAME_DATA:{});
  return {VERSION,BAG_SIZE,SKILL_SLOTS,MAX_LV,MAX_MERC,MAX_ACTIVE_QUEST,ELEMENTS,BEASTS,GROUPS,FX_NAMES,STAT_KEYS,CFG,RAR,ADD,SHOPS,SETS,MON,QUESTS,MERCS,items,slots,skills,
    layout,relayout,load,info,kind,weapon,skillCost,cmdInfo,WEAPONS,PREDICT,seqRng,setFollow,fitFollow,mercCmd,petMax,SHOP_ENH,expNeed,maxLevel,gainExp,spendPoints,mountGain,bookStat,mountCmd,qOf,rar,nameOf,stat,canEnhance,tradeable,gainOf,enhRate,enhCost,enhance,roll,rollDrop,create,derive,targets,equip,unequip,stance,isTwo,pairOk,setSkill,unsetSkill,toggleBook,element,money,shopPrice,buy,sell,sellPrice,addItem,cast,
    questAccept,questProgress,questTurnIn,hireNpc,addMerc,mercEquip,mercUnequip,dismissMerc,makeMerc,cleanItem,serialize,restore,restorePlayer,merge,applyOp,allItems};
})();

/* ================= DÁNG VẺ ĐỒ: mỗi món đồ được vẽ trên người theo đúng tên / loại =================
   Một bảng duy nhất dùng cho cả hình trên người nhân vật lẫn ảnh biểu tượng trong túi (tools/anh-vat-pham.mjs vẽ ảnh webp từ chính các hàm này),
   nên ảnh và nhân vật luôn khớp nhau.
   - Ô Cánh: tên có "Áo choàng" → áo choàng trên vai · "Cờ" → cờ cắm sau lưng · còn lại → đôi cánh.
   - Mũ: Nón lá, Nón dấu, Khăn, Trâm, Mũ phượng, Mũ trụ / mũ tướng, Mũ vương (Quang Trung, Quốc công…).
   - Áo: Áo vải, Áo da, Giáp (vảy), Áo bào / Long bào / Áo phượng (áo dài tới gối).
   - Quần: quần hoặc váy (Váy, Xiêm y). Giày: dép, guốc, hài, ủng, giày mây.
   - Đồ huyền thoại (bộ): cả bộ dùng chung một bảng màu của vị anh hùng, viền vàng.
   - Đồ thần: màu riêng + hiệu ứng riêng (lửa, sóng nước, mây, vảy rồng, ánh ngọc…). */
const LH_Look=(()=>{
  // Bảng màu từng bộ huyền thoại: [chính, phụ, viền]
  const SET={
    'ngo-quyen':['#2f5d8a','#c9d2da','#e8c070'],'dinh-bo-linh':['#c9a43a','#7a5a2a','#f2dc8a'],'le-hoan':['#a8342a','#3a2a22','#e8c070'],
    'ly-thuong-kiet':['#7a1f2a','#2a2a30','#e8c070'],'tran-hung-dao':['#b0302a','#e0b84a','#f2dc8a'],'tran-quoc-toan':['#c0392b','#f2c94c','#f2dc8a'],
    'nguyen-trai':['#2e3f6e','#d8d2c0','#c9b070'],'le-loi':['#2f6a44','#c9a43a','#e8c070'],'quang-trung':['#9a2a2a','#26355a','#e8c070'],
    'trung-trac':['#6a3a8a','#e0b84a','#f2dc8a'],'trung-nhi':['#8a3a7a','#e0b84a','#f2dc8a'],'trieu-thi-trinh':['#d9a62a','#8a3a1a','#fff0b0'],
    'le-chan':['#2a7a7a','#d8e8e0','#e8c070'],'phung-thi-chinh':['#b04a6a','#f2d0d8','#e8c070'],'vu-thi-thuc':['#9a4ab0','#e8d0f0','#e8c070'],
    'duong-van-nga':['#5a2a8a','#e8c070','#fff0b0'],'y-lan':['#c06a8a','#f8e0e8','#e8c070'],'bui-thi-xuan':['#c0442a','#2a2a30','#f2dc8a']
  };
  // Đồ thần: màu + hiệu ứng riêng
  const MYTH={
    'than-roi-sat':{c:'#3c3f44',fx:'fire'},'than-ngua-sat':{c:'#4a4d52',fx:'fire'},'than-giap-sat':{c:'#5a5e64',fx:'fire'},
    'than-no-kim-quy':{c:'#c9a43a',fx:'gold'},'than-kiem-thuan-thien':{c:'#5fb89a',fx:'jade'},
    'than-gay-chu-dong-tu':{c:'#8a6a3a',fx:'light'},'than-non-chu-dong-tu':{c:'#e8d48a',fx:'light'},
    'than-canh-au-co':{c:'#f4e6f0',fx:'fairy'},'than-khien-lac-long':{c:'#2f7a9a',fx:'dragon'},
    'than-giay-son-tinh':{c:'#a8b8c8',fx:'cloud'},'than-gang-thuy-tinh':{c:'#3a8ab0',fx:'water'}
  };
  const FX={fire:['#ff8a3d','#ffd27a'],gold:['#ffd36a','#fff3c4'],jade:['#7fe0b0','#d8fff0'],light:['#fff2a8','#ffffff'],fairy:['#ffc0e8','#ffffff'],dragon:['#5fd0ff','#c8f0ff'],cloud:['#e8f0ff','#ffffff'],water:['#5fb8ff','#d8f0ff']};
  const has=(s,...w)=>w.some(x=>s.includes(x));
  const cache={};
  // Dáng vẻ của một loại đồ (theo mã)
  function of(type){
    if(cache[type])return cache[type];
    const d=typeof Player!=='undefined'&&Player.items[type];if(!d)return null;
    const name=String(d.name||'').toLowerCase(),slot=d.slot==='hand'?(type.endsWith(':left')?'left':'right'):d.slot;
    const L={type,slot,name:d.name,set:d.set||null,myth:!!d.myth,gender:d.gender||'',main:d.tint||null,alt:null,trim:null,kind:slot};
    if(d.set&&SET[d.set]){[L.main,L.alt,L.trim]=SET[d.set];L.legend=true;}
    if(d.myth&&MYTH[type]){L.main=MYTH[type].c;L.fx=MYTH[type].fx;L.trim=FX[L.fx][0];}
    if(slot==='wings')L.kind=has(name,'áo choàng')?'cloak':has(name,'cờ')?'flag':'wings';
    else if(slot==='hat')L.kind=has(name,'nón lá','nón thần')?'nonla':has(name,'nón dấu')?'nondau':has(name,'khăn')?'khan':has(name,'trâm')?'tram':has(name,'phượng','nguyên phi')?'phoenix':has(name,'quang trung','quốc công','bình định vương','vạn thắng','trưng vương','trưng nhị')?'crown':'helm';
    else if(slot==='armor')L.kind=has(name,'bào','áo phượng','áo nguyên phi','côn sơn')?'robe':has(name,'áo da')?'leather':has(name,'áo vải')?'cloth':'scale';
    else if(slot==='pants')L.kind=has(name,'váy','xiêm')?'skirt':'pants';
    else if(slot==='shoes')L.kind=has(name,'dép')?'sandal':has(name,'guốc')?'clog':has(name,'ủng','giày da')?'boot':has(name,'mây')?'cloud':'hai';
    // màu mặc định của đồ thường
    const DEF={cloak:'#6a3a2a',flag:'#b0302a',wings:'#e9eef4',nonla:'#e1cd8e',nondau:'#3a2a1a',khan:'#2a2622',helm:'#6b5a3a',crown:'#b08a3a',tram:'#e8c070',phoenix:'#c9a43a',
      robe:'#6a3a2a',leather:'#7a5232',cloth:'#8a7a5c',scale:'#7a5a2a',pants:'#4a4036',skirt:'#3a2a22',gloves:'#6a5240',sandal:'#a8864a',clog:'#e8dcc0',boot:'#4a3a2a',cloud:'#c8d8e8',hai:'#3a2a22'};
    if(!L.main)L.main=DEF[L.kind]||'#7a6a55';
    if(!L.alt)L.alt=shadeL(L.main,-.3);
    if(!L.trim)L.trim=L.legend?'#e8c070':shadeL(L.main,.35);
    return cache[type]=L;
  }
  function shadeL(hex,k){const n=parseInt(String(hex).slice(1,7),16);if(!Number.isFinite(n))return hex;let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)));return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');}
  const P=(c,pts,fill,stroke,lw)=>{c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||1;c.stroke();}};
  const E=(c,x,y,rx,ry,fill)=>{c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  const Ln=(c,pts,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.stroke();};

  /* ---------- Ô cánh: áo choàng / cờ / cánh (vẽ sau lưng, trước khi vẽ thân) ---------- */
  function back(c,L,t,moving){
    const sw=Math.sin(t*(moving?7:2))*(moving?3:1.2);
    if(L.kind==='cloak'){
      // áo choàng buông từ vai xuống quá gối, bay nhẹ theo bước
      const g=c.createLinearGradient(0,-26,0,6);g.addColorStop(0,L.main);g.addColorStop(1,shadeL(L.main,-.35));
      c.fillStyle=g;c.beginPath();c.moveTo(-9,-25);c.quadraticCurveTo(-17-sw,-8,-19-sw*1.6,6);c.lineTo(-4-sw,8);c.quadraticCurveTo(2,-6,7,-25);c.closePath();c.fill();
      c.strokeStyle=L.trim;c.lineWidth=1.4;c.beginPath();c.moveTo(-19-sw*1.6,6);c.lineTo(-4-sw,8);c.stroke();
      c.strokeStyle=shadeL(L.main,-.45);c.lineWidth=.8;c.beginPath();c.moveTo(-9,-22);c.quadraticCurveTo(-13-sw,-6,-14-sw*1.3,6);c.stroke();
    }
    else if(L.kind==='flag'){
      // cờ hiệu cắm sau lưng: cán tre, lá cờ đuôi nheo bay
      Ln(c,[-6,-14,-11,-62],'#6b4a2e',2.2);E(c,-11,-63,1.8,1.8,L.trim);
      const fl=Math.sin(t*5)*2.5;c.fillStyle=L.main;c.beginPath();c.moveTo(-11,-61);c.quadraticCurveTo(-24,-60+fl,-34,-58+fl*1.4);c.lineTo(-28,-51+fl);c.lineTo(-34,-44+fl*1.2);c.quadraticCurveTo(-22,-45-fl,-10,-44);c.closePath();c.fill();
      c.strokeStyle=L.trim;c.lineWidth=1.2;c.stroke();E(c,-19,-52+fl*.5,3.2,3.2,L.alt);E(c,-19,-52+fl*.5,1.6,1.6,L.trim);
    }
    else{ // đôi cánh
      const f=Math.sin(t*4)*.12,col=L.main;c.save();c.translate(-4,-22);
      for(const s of [1,.8]){c.save();c.rotate(-.1+f*s);c.scale(s,s);c.globalAlpha=s<1?.7:.92;c.fillStyle=col;c.strokeStyle=L.trim;c.lineWidth=1;
        c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-26,-40,-40,-12);c.quadraticCurveTo(-28,-12,-22,4);c.quadraticCurveTo(-12,0,0,8);c.closePath();c.fill();c.stroke();
        c.strokeStyle=shadeL(col,-.25);for(let i=1;i<4;i++){c.beginPath();c.moveTo(-4,2);c.lineTo(-12-i*8,-14+i*5);c.stroke();}c.restore();}
      c.restore();
    }
  }
  /* ---------- Áo choàng: vạt trước vắt qua vai (vẽ sau thân) ---------- */
  function front(c,L){if(L.kind!=='cloak')return;P(c,[-9,-26,7,-26,4,-21,-6,-21],L.main);E(c,0,-23,2.2,2.2,L.trim);}
  /* ---------- Mũ ---------- */
  function hat(c,L,fem){
    const m=L.main,a=L.alt,tr=L.trim;
    if(L.kind==='nonla'){P(c,[-20,-41,0,-60,20,-41],m);Ln(c,[-20,-41,20,-41],shadeL(m,-.25),1.5);c.strokeStyle=shadeL(m,-.15);c.lineWidth=1;for(let k=1;k<4;k++){c.beginPath();c.moveTo(-20+k*4.5,-41-k*4.3);c.lineTo(20-k*4.5,-41-k*4.3);c.stroke();}}
    else if(L.kind==='nondau'){P(c,[-13,-44,0,-55,13,-44],m);Ln(c,[-13,-44,13,-44],tr,1.6);E(c,0,-56,2.6,2.6,'#c0342a');Ln(c,[0,-56,-3,-49],'#c0342a',1.2);}
    else if(L.kind==='khan'){E(c,-1,-45,11,6,m);c.strokeStyle=shadeL(m,.3);c.lineWidth=1;for(let k=-1;k<2;k++){c.beginPath();c.ellipse(-1,-45+k*2.4,10,2.2,0,Math.PI,0);c.stroke();}}
    else if(L.kind==='tram'){Ln(c,[-16,-49,-2,-43],tr,1.8);E(c,-2,-43,2,2,m);E(c,-16,-49,1.6,1.6,a);}
    else if(L.kind==='phoenix'){P(c,[-11,-44,-8,-53,0,-57,8,-53,11,-44],m,tr,1.2);P(c,[0,-57,-6,-64,0,-61,6,-64],tr);E(c,0,-50,2.4,2.4,a);for(const s of [-1,1])Ln(c,[s*10,-46,s*15,-40],tr,1.2);}
    else if(L.kind==='crown'){P(c,[-12,-42,-12,-52,-5,-56,0,-60,5,-56,12,-52,12,-42],m,tr,1.4);Ln(c,[-12,-46,12,-46],tr,1.6);E(c,0,-52,2.6,2.6,a);for(const s of [-1,1])P(c,[s*12,-48,s*20,-54,s*18,-46],tr);}
    else{ // mũ trụ tướng: chỏm tròn, vành, chóp tua đỏ
      c.fillStyle=m;c.beginPath();c.arc(0,-44,11.5,Math.PI,0);c.closePath();c.fill();c.strokeStyle=shadeL(m,-.4);c.lineWidth=1;c.stroke();
      Ln(c,[-13,-44,13,-44],tr,2.2);Ln(c,[0,-55,0,-61],tr,1.6);E(c,0,-62,2.4,3,L.legend?a:'#c0342a');for(const s of [-1,1])Ln(c,[s*11,-44,s*12,-37],shadeL(m,-.2),2.4);
    }
  }
  /* ---------- Áo, quần, găng, giày: màu + hoa văn theo kiểu ---------- */
  function armor(c,L,fem){
    const m=L.main,tr=L.trim;
    if(L.kind==='scale'){c.strokeStyle=shadeL(m,-.35);c.lineWidth=1;for(let y=-21;y<-6;y+=4)for(let x=-10;x<11;x+=5){c.beginPath();c.arc(x+(y%8?2.5:0),y,2.5,0,Math.PI);c.stroke();}Ln(c,[-9,-24,0,-18,9,-24],tr,2);E(c,0,-18,2,2,tr);}
    else if(L.kind==='leather'){c.strokeStyle=shadeL(m,-.4);c.setLineDash([2,2]);c.lineWidth=.8;c.strokeRect(-9,-22,18,14);c.setLineDash([]);Ln(c,[-9,-24,0,-19,9,-24],shadeL(m,.3),1.4);}
    else if(L.kind==='robe'){Ln(c,[-2,-27,3,-6],tr,1.8);Ln(c,[-9,-25,-2,-27],tr,1.2);if(L.legend){E(c,-5,-15,2.4,2.4,tr);E(c,5,-12,2,2,tr);}}
    else{Ln(c,[-6,-25,0,-21,6,-25],shadeL(m,-.3),1.4);Ln(c,[0,-21,0,-8],shadeL(m,-.2),.8);}
    if(L.legend){c.strokeStyle=tr;c.lineWidth=1;c.strokeRect(-11.5,-8,23,2);}
  }
  // áo dài (bào): vạt áo phủ xuống gối, vẽ sau chân
  function robeSkirt(c,L,moving,walk){if(L.kind!=='robe')return;const s=moving?Math.sin(walk)*2:0;P(c,[-12,-8,12,-8,13+s,1,-13-s,1],L.main,shadeL(L.main,-.45),1);Ln(c,[-13-s,1,13+s,1],L.trim,1.6);}
  /* ---------- Hiệu ứng đồ thần ---------- */
  function mythAura(c,list,t){
    for(const [i,L] of list.entries()){
      const [a,b]=FX[L.fx]||FX.gold;c.save();
      for(let k=0;k<5;k++){const ph=t*1.6+k*1.26+i*.7,r=16+((t*12+k*7)%14),x=Math.cos(ph)*r*.8,y=-22+Math.sin(ph*1.3)*14-((t*14+k*9)%22);
        c.globalAlpha=.55-((t*12+k*7)%14)/30;c.fillStyle=k%2?a:b;c.beginPath();
        if(L.fx==='fire'){c.moveTo(x,y-4);c.quadraticCurveTo(x+3,y,x,y+2);c.quadraticCurveTo(x-3,y,x,y-4);}
        else if(L.fx==='water'||L.fx==='dragon'){c.ellipse(x,y,2.4,1.4,ph,0,Math.PI*2);}
        else if(L.fx==='cloud'){c.ellipse(x,4,4,2,0,0,Math.PI*2);}
        else{c.moveTo(x,y-3);c.lineTo(x+1,y-1);c.lineTo(x+3,y);c.lineTo(x+1,y+1);c.lineTo(x,y+3);c.lineTo(x-1,y+1);c.lineTo(x-3,y);c.lineTo(x-1,y-1);c.closePath();}
        c.fill();}
      c.restore();
    }
  }
  // Ánh sáng quanh vũ khí / món đồ thần (dùng cả khi vẽ trên tay)
  function mythGlow(c,L){if(!L||!L.fx)return;const [a]=FX[L.fx]||FX.gold;c.shadowColor=a;c.shadowBlur=12;}
  /* ---------- Ảnh biểu tượng (túi đồ) cho đồ mặc: vẽ riêng từng món, giữa khung ---------- */
  function iconWear(c,L,t=0){
    c.save();
    const sl=L.slot;
    if(sl==='wings'){c.translate(L.kind==='flag'?18:L.kind==='wings'?24:6,L.kind==='flag'?36:16);const k=L.kind==='cloak'?1.6:1.05;c.scale(k,k);if(L.kind==='cloak'){c.translate(4,-2);back(c,L,0,false);front(c,L);}else back(c,L,0,false);}
    else if(sl==='hat'){c.scale(1.5,1.5);c.translate(0,L.kind==='tram'?46:L.kind==='khan'?45:50);hat(c,L,false);}
    else if(sl==='armor'){c.scale(1.7,1.7);c.translate(0,20);const g=c.createLinearGradient(-12,0,12,0);g.addColorStop(0,shadeL(L.main,-.2));g.addColorStop(.6,L.main);g.addColorStop(1,shadeL(L.main,-.15));
      c.fillStyle=g;c.beginPath();c.roundRect(-12,-27,24,23,6);c.fill();P(c,[-12,-25,-19,-14,-16,-10,-11,-18],L.main);P(c,[12,-25,19,-14,16,-10,11,-18],L.main);armor(c,L,false);robeSkirt(c,L,false,0);}
    else if(sl==='pants'){c.scale(1.8,1.8);c.translate(0,1);if(L.kind==='skirt'){P(c,[-11,-10,11,-10,15,6,-15,6],L.main,shadeL(L.main,-.4),1);Ln(c,[-11,-9,11,-9],L.trim,2);}else{P(c,[-11,-10,11,-10,10,8,3,8,0,-2,-3,8,-10,8],L.main,shadeL(L.main,-.4),1);c.fillStyle=L.legend?L.trim:'#a8343a';c.fillRect(-11,-11,22,3);}}
    else if(sl==='gloves'){c.scale(1.9,1.9);for(const s of [-1,1]){c.save();c.translate(s*6,0);c.rotate(s*.25);c.fillStyle=L.main;c.beginPath();c.roundRect(-4,-9,8,14,3);c.fill();c.fillStyle=L.trim;c.fillRect(-4,-9,8,2.4);c.restore();}}
    else if(sl==='shoes'){c.scale(2.2,2.2);c.translate(0,3);for(const s of [-1,1]){c.save();c.translate(s*5.5,0);
      if(L.kind==='sandal'){c.fillStyle=L.main;c.beginPath();c.ellipse(0,0,4.5,2.4,0,0,Math.PI*2);c.fill();Ln(c,[-2,-1,2,1],shadeL(L.main,-.4),1);}
      else if(L.kind==='clog'){c.fillStyle=L.main;c.fillRect(-4.5,-1,9,3);c.fillStyle=L.trim;c.fillRect(-3,-3,6,2);}
      else{const h=L.kind==='boot'?7:3;c.fillStyle=L.main;c.beginPath();c.roundRect(-3.5,-h,7,h+2,1.5);c.fill();c.beginPath();c.roundRect(-3.5,0,9,3,1.5);c.fill();Ln(c,[-3.5,-h+.5,3.5,-h+.5],L.trim,1);if(L.kind==='cloud'){c.globalAlpha=.7;E(c,-2,3,4,1.6,'#ffffff');E(c,4,3,3,1.4,'#ffffff');c.globalAlpha=1;}}
      c.restore();}}
    c.restore();
  }
  /* ---------- Gợi ý vẽ ảnh (file Hình ảnh, cột goi_y / gioi_tinh / ghi_chu) ---------- */
  const WEBP='định dạng webp, nền trong suốt';
  const KIND_VN={cloak:'áo choàng khoác vai (buông quá gối)',flag:'cờ hiệu cắm sau lưng (cán tre, đuôi nheo)',wings:'đôi cánh sau lưng',nonla:'nón lá',nondau:'nón dấu lính (chóp tua đỏ)',khan:'khăn xếp quấn đầu',tram:'trâm cài búi tóc',phoenix:'mũ phượng',crown:'mũ vương có cánh chuồn',helm:'mũ trụ tướng (chỏm tròn, vành, chóp tua)',
    robe:'áo bào dài tới gối',leather:'áo da có đường chỉ',cloth:'áo vải cổ chéo',scale:'giáp vảy',pants:'quần (thắt lưng đỏ)',skirt:'váy dài',sandal:'dép cỏ',clog:'guốc',boot:'ủng cao cổ',cloud:'giày mây',hai:'hài thấp cổ',gloves:'bao tay'};
  const FX_VN={fire:'lửa cháy',gold:'ánh vàng',jade:'ánh ngọc bích',light:'hào quang trắng',fairy:'bụi tiên hồng',dragon:'vảy rồng xanh',cloud:'mây trắng',water:'sóng nước'};
  function note(type){
    const d=Player.items[type];if(!d)return {goi_y:'128×128, '+WEBP+'.',gioi_tinh:'Chung',ghi_chu:''};
    const L=of(type),k=d.kind,S=d.set&&Player.SETS[d.set];let t;
    if(['sword','spear','staff'].includes(k))t=`128×128, ${WEBP}. Vũ khí vẽ chéo 45°: tay cầm ở góc dưới trái (14% từ trái, 86% từ trên), mũi hướng góc trên phải — game đặt đúng điểm này vào tay nhân vật.`;
    else if(k==='shield')t=`128×128, ${WEBP}. Khiên đứng thẳng giữa ảnh, cao khoảng 85% khung.`;
    else if(k==='bow'||k==='crossbow')t=`128×128, ${WEBP}. Vẽ chéo giữa khung (trên tay vẫn dùng hình vẽ của game vì có động tác kéo dây).`;
    else if(d.slot==='mount')t=`128×128, ${WEBP}. Thú quay mặt sang phải, chân chạm đáy, thấy yên cưỡi.`;
    else if(d.slot==='book')t=`128×128, ${WEBP}. Bìa sách màu hệ, biểu tượng hệ ở giữa.`;
    else if(L&&KIND_VN[L.kind])t=`128×128, ${WEBP}. Món đồ nhìn chính diện, giữa khung. Trên nhân vật vẽ thành: ${KIND_VN[L.kind]}.`;
    else t=`128×128, ${WEBP}.`;
    if(L&&d.slot!=='book')t+=` Màu: chính ${L.main}, phụ ${L.alt}, viền ${L.trim}.`;
    if(L&&L.legend)t+=' Đồng bộ cả bộ: cùng bảng màu, viền vàng, cùng hoa văn.';
    if(L&&L.fx)t+=` Đồ thần: hiệu ứng ${FX_VN[L.fx]} (quầng sáng + hạt lấp lánh).`;
    const g=S?S.gender:d.gender;
    return {goi_y:t,gioi_tinh:g==='f'?'Nữ':g==='m'?'Nam':'Chung',ghi_chu:S?`Huyền thoại · Bộ ${S.name} (${S.hero}) · 9 món đồng bộ`:d.myth?`Thần thoại · ${d.fxText||''}`:''};
  }
  return {note,of,SET,MYTH,FX,shade:shadeL,back,front,hat,armor,robeSkirt,mythAura,mythGlow,iconWear};
})();
