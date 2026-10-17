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
   v9.8: ba vùng mới (Sa mạc, Núi tuyết, Hang động). Quái, nhiệm vụ mới tự dùng số liệu mặc định; chạy kiemTra một lần để chép dòng mới vào tab quai, nhiem_vu và file Hình ảnh.
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
const LH_STATIC={cau_hinh:'cau_hinh',gia_cuong:'cau_hinh',pham_chat:'pham_chat',thuoc_tinh:'pham_chat',vat_pham:'vat_pham',cua_hang:'cua_hang',bo_huyen_thoai:'bo_huyen_thoai',do_than:'do_than',quai:'quai',nhiem_vu:'nhiem_vu',linh:'linh',vu_khi:'vat_pham',ban_do:'cau_hinh',dien_mao:'cau_hinh',goi_nap:'cau_hinh',hinh_anh:'hinh_anh'};
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
  // Quái, nhiệm vụ mới của bản cập nhật (vùng mới) mà Sheet chưa có dòng: dùng số liệu mặc định cho tới khi chạy kiemTra để chép vào Sheet
  for(const tab of LH_BO_SUNG)if(LH_SHEETS[LH_STATIC[tab]]&&Array.isArray(out[tab])&&out[tab].length){const has=new Set(out[tab].map(r=>lhKhoa_(tab,r)));for(const r of LH_DEFAULT[tab]||[])if(!has.has(lhKhoa_(tab,r)))out[tab].push(r);}
  // Ảnh tĩnh: chỉ gửi các dòng đã dán link
  out.hinh_anh=(out.hinh_anh||[]).filter(r=>String(r.link_anh||'').trim()).map(r=>({nhom:r.nhom,ma:r.ma,link_anh:String(r.link_anh).trim(),...(String(r.phien_ban||'').trim()?{v:String(r.phien_ban).trim()}:{})}));
  const s=JSON.stringify(out);if(s.length<95000)cache.put('lh-data',s,120);
  return out;
}
// Tab được bổ sung dòng mới (theo cột id) khi game thêm quái, nhiệm vụ, hàng hóa thành trì, diện mạo
const LH_BO_SUNG=['quai','nhiem_vu','cau_hinh','ban_do','vat_pham','cua_hang','dien_mao','goi_nap','thuoc_tinh'];
// khóa một dòng: cau_hinh theo khoa; cua_hang theo cửa hàng + mã hàng (một món có thể bán ở nhiều cửa hàng); còn lại theo id
const lhKhoa_=(tab,r)=>tab==='cau_hinh'?String(r.khoa):tab==='thuoc_tinh'?String(r.ma):tab==='cua_hang'?String(r.cua_hang)+'|'+String(r.id):String(r.id);
// Chép các dòng mặc định còn thiếu (quái, nhiệm vụ của vùng mới) xuống cuối tab; không sửa dòng đã có
function lhDuLieuBoSung_(){
  let n=0;
  for(const tab of LH_BO_SUNG){
    const file=LH_SHEETS[LH_STATIC[tab]];if(!file)continue;const ss=SpreadsheetApp.openById(file);let sh=ss.getSheetByName(tab);
    // tab mới của bản cập nhật (ban_do) chưa có: tạo và đổ dữ liệu mặc định
    if(!sh){const rows=LH_DEFAULT[tab]||[];if(!rows.length)continue;const h0=Object.keys(rows[0]);sh=ss.insertSheet(tab);sh.getRange(1,1,rows.length+1,h0.length).setValues([h0,...rows.map(r=>h0.map(k=>r[k]===undefined||r[k]===null?'':r[k]))]);sh.setFrozenRows(1);sh.getRange(1,1,1,h0.length).setFontWeight('bold').setBackground('#2b4d38').setFontColor('#ffffff');n+=rows.length;Logger.log('Tạo tab '+tab);continue;}
    if(sh.getLastRow()<2)continue;
    const v=sh.getDataRange().getValues(),h=v[0].map(String);if(h.indexOf('id')<0&&h.indexOf('khoa')<0&&h.indexOf('ma')<0)continue;const has=new Set(v.slice(1).map(r=>lhKhoa_(tab,Object.fromEntries(h.map((k,i)=>[k,r[i]])))));
    // cột mới của bản cập nhật (ban_do, ky_nang…) chưa có trên Sheet: thêm vào cuối tiêu đề
    for(const k of Object.keys((LH_DEFAULT[tab]||[])[0]||{}))if(h.indexOf(k)<0){h.push(k);sh.getRange(1,h.length).setValue(k).setFontWeight('bold');}
    const add=(LH_DEFAULT[tab]||[]).filter(r=>!has.has(lhKhoa_(tab,r))).map(r=>h.map(k=>r[k]===undefined||r[k]===null?'':r[k]));
    if(add.length){sh.getRange(sh.getLastRow()+1,1,add.length,h.length).setValues(add);n+=add.length;Logger.log('Thêm '+add.length+' dòng vào tab '+tab);}
  }
  return n;
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
// Làm mới ảnh: ghi giờ sửa file Drive của từng link vào cột phien_ban. Thay ảnh bằng "Quản lý phiên bản" / tải đè cùng tên
// (link không đổi) thì trình duyệt vẫn giữ ảnh cũ; có phien_ban mới, game tải lại ảnh đó. Tự chạy mỗi giờ (lần đầu chạy tay để tạo lịch).
function lamMoiAnh(){
  const t0=Date.now(),ss=SpreadsheetApp.openById(LH_SHEETS.hinh_anh),sh=ss.getSheetByName('hinh_anh')||ss.getSheets()[0];
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  if(h.indexOf('phien_ban')<0){h.push('phien_ban');sh.getRange(1,h.length).setValue('phien_ban').setFontWeight('bold');}
  const ci=k=>h.indexOf(k),last=sh.getLastRow();if(last<2)return;
  const v=sh.getRange(2,1,last-1,h.length).getValues(),out=v.map(r=>[r[ci('phien_ban')]]);let n=0,bad=[];
  for(let i=0;i<v.length;i++){
    const link=String(v[i][ci('link_anh')]||'').trim(),m=link.match(/\/d\/([\w-]{20,})/)||link.match(/[?&]id=([\w-]{20,})/);
    if(!m){if(!link&&out[i][0]!==''){out[i][0]='';n++;}continue;}
    if(Date.now()-t0>270000)break;
    try{const f=DriveApp.getFileById(m[1]),ver=Math.floor(f.getLastUpdated().getTime()/1000).toString(36);if(String(out[i][0])!==ver){out[i][0]=ver;n++;}
      const a=f.getSharingAccess();if(a!==DriveApp.Access.ANYONE_WITH_LINK&&a!==DriveApp.Access.ANYONE)bad.push(v[i][ci('nhom')]+':'+v[i][ci('ma')]+' (chưa chia sẻ)');}
    catch(e){bad.push(v[i][ci('nhom')]+':'+v[i][ci('ma')]+' (không mở được file)');}
  }
  if(n){sh.getRange(2,ci('phien_ban')+1,out.length,1).setValues(out);xoaBoNhoDem();}
  try{if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='lamMoiAnh'))ScriptApp.newTrigger('lamMoiAnh').timeBased().everyHours(1).create();}catch(e){}
  Logger.log('Cập nhật phiên bản '+n+' ảnh'+(bad.length?'\nẢnh lỗi:\n'+bad.join('\n'):''));
}
// Tạo nhân vật thử cấp cao cho một tài khoản (chạy tay trong trình soạn thảo): taoNhanVatThu() → 2 nhân vật cấp 100 (nam + nữ) của tài khoản vnthudao,
// mỗi nhân vật mặc đủ 9 món một bộ huyền thoại +9, túi có bộ huyền thoại thứ hai, 11 món đồ thần, thú cưỡi, sách, tiền và hồng ngọc để thử.
// Đổi tài khoản / cấp: taoNhanVatThu('ten_dang_nhap', 120). Tên nhân vật đã có thì bỏ qua (không tạo trùng).
function taoNhanVatThu(username,cap){
  username=String(username||'vnthudao').toLowerCase();cap=Number(cap)||100;
  const a=LH_DB.find('tai_khoan','username',username);if(!a){Logger.log('Không thấy tài khoản '+username);return;}
  Player.load(lhStatic_());const now=Date.now(),rng=Math.random;
  const defs=[{ten:'Thử Nam '+cap,gioi_tinh:'m',set:['tran-hung-dao','le-loi']},{ten:'Thử Nữ '+cap,gioi_tinh:'f',set:['trung-trac','bui-thi-xuan']}];
  for(const d of defs){
    if(LH_DB.where('nhan_vat','ten_khoa',d.ten.toLowerCase()).some(c=>c.trang_thai!=='deleted')){Logger.log('Đã có '+d.ten);continue;}
    const c={id:'nv-'+Utilities.getUuid().replace(/-/g,'').slice(0,12),tai_khoan:a.id,ten:d.ten,ten_khoa:d.ten.toLowerCase(),gioi_tinh:d.gioi_tinh,suc_manh:20,nhanh_nhen:10,suc_khoe:10,tri_tue:10,trang_thai:'active',gia_danh_thue:0,nguoi_mua:'',luu:'',tao_luc:now,cap_nhat:now,cap:cap,kinh_nghiem:0,gia_hong_ngoc:0};
    const p=Player.create({name:c.ten,gender:c.gioi_tinh,stats:{strength:20,agility:10,vitality:10,intelligence:10}});
    p.level=cap;p.exp=0;p.points=0;p.bag=Array(Player.BAG_SIZE).fill(null);p.equipment=Object.fromEntries(Player.slots.map(k=>[k,null]));
    // điểm cộng: mỗi cấp 5 điểm, chia đều (dư vào Sức mạnh)
    const pts=(cap-1)*Number(Player.CFG.diem_moi_cap||5),each=Math.floor(pts/5);for(const k of ['strength','agility','vitality','intelligence','command'])p.alloc[k]=each;p.alloc.strength+=pts-each*5;
    // bộ huyền thoại 1: mặc đủ 9 món +9, bậc = cấp; bộ 2 vào túi
    const S1=Player.SETS[d.set[0]],S2=Player.SETS[d.set[1]];
    for(const id of S1.pieces){const it=Player.roll(id,'l',rng,cap);it.lv=9;const slot=id.split(':')[1];p.equipment[slot]=it;}
    for(const id of S2.pieces)Player.addItem(p,Player.roll(id,'l',rng,cap));
    for(const id of Object.keys(Player.items).filter(k=>Player.items[k].myth))Player.addItem(p,Player.roll(id,'m',rng,cap));
    for(const id of ['mount-tiger','mount-elephant','book-fire','book-metal','book-ma','book-sang'])Player.addItem(p,Player.roll(id,'n',rng));
    p.copper=50000000;p.rubies=5000;const D=Player.derive(p);p.hp=D.tot.hp;p.mana=D.tot.mp;
    c.luu=JSON.stringify({v:Player.VERSION,player:p,pos:null,seen:[],srv:{}});LH_DB.insert('nhan_vat',c);Logger.log('Đã tạo '+d.ten+' (cấp '+cap+')');
  }
}
// Nạp hồng ngọc tay sau khi nhận tiền chuyển khoản (NPC Nạp thẻ chỉ hiện mã QR, không tự cộng):
// napHongNgoc('tên nhân vật', 120) hoặc napHongNgoc('tên đăng nhập', 120) (cộng vào nhân vật đầu tiên đang hoạt động của tài khoản). Ghi nhật ký vào tab nap_the.
function napHongNgoc(ten,soLuong){
  ten=String(ten||'').trim();soLuong=Math.floor(Number(soLuong)||0);if(!ten||soLuong<=0){Logger.log('Cú pháp: napHongNgoc(\'tên nhân vật hoặc tên đăng nhập\', số hồng ngọc)');return;}
  Player.load(lhStatic_());
  let c=LH_DB.where('nhan_vat','ten_khoa',ten.toLowerCase()).find(x=>x.trang_thai==='active'||x.trang_thai==='merc');
  if(!c){const a=LH_DB.find('tai_khoan','username',ten.toLowerCase());if(a)c=LH_DB.where('nhan_vat','tai_khoan',a.id).find(x=>x.trang_thai==='active'||x.trang_thai==='merc');}
  if(!c){Logger.log('Không thấy nhân vật / tài khoản '+ten);return;}
  const l=LockService.getScriptLock();l.waitLock(15000);
  try{let save={};try{save=JSON.parse(c.luu||'{}');}catch(e){}const p=save.player||Player.create({name:c.ten,gender:c.gioi_tinh});p.rubies=Math.floor(Number(p.rubies)||0)+soLuong;save.player=p;save.v=Player.VERSION;c.luu=JSON.stringify(save);c.cap_nhat=Date.now();LH_DB.update('nhan_vat',c);}
  finally{l.releaseLock();}
  try{const ss=SpreadsheetApp.openById(LH_SHEETS.nguoi_choi);let sh=ss.getSheetByName('nap_the');if(!sh){sh=ss.insertSheet('nap_the');sh.appendRow(['luc','nhan_vat','tai_khoan','hong_ngoc']);sh.setFrozenRows(1);}sh.appendRow([new Date(),c.ten,c.tai_khoan,soLuong]);}catch(e){}
  Logger.log('Đã cộng '+soLuong+' hồng ngọc cho '+c.ten);
}
function kiemTra(){try{lhDuLieuBoSung_();}catch(e){Logger.log('Chưa bổ sung được quái / nhiệm vụ mới: '+e);}try{const n=lhHinhAnhBoSung_();if(n)Logger.log('Thêm '+n+' dòng ảnh mới vào file Hình ảnh');}catch(e){Logger.log('Chưa bổ sung được file Hình ảnh: '+e);}xoaBoNhoDem();const d=lhStatic_();Logger.log(Object.keys(d).map(k=>k+': '+d[k].length+' dòng').join('\n'));LH_DB.rows('tai_khoan');LH_DB.rows('nhan_vat');LH_DB.rows('cho');Logger.log('Bảng người chơi sẵn sàng. Quyền gửi mail: '+MailApp.getRemainingDailyQuota()+' thư/ngày');}

// Ảnh vật phẩm game vẽ sẵn (hàm capNhatAnh chép vào Drive)
const LH_ANH_CDN="https://cdn.jsdelivr.net/gh/vnthudao-source/lu-hanh@ban-10.6/dist/anh/";

// Dòng ảnh giao diện, quái bổ sung vào file Hình ảnh khi chạy kiemTra
const LH_HINH_THEM=[{"nhom":"bieu_tuong","ma":"sword","ten":"Kiếm","dung_o":"Loại vũ khí kiếm, nút đánh thường khi cầm kiếm"},{"nhom":"bieu_tuong","ma":"bow","ten":"Cung","dung_o":"Loại cung, nút đánh khi cầm cung"},{"nhom":"bieu_tuong","ma":"crossbow","ten":"Nỏ","dung_o":"Loại nỏ, nút đánh khi cầm nỏ"},{"nhom":"bieu_tuong","ma":"staff","ten":"Gậy phép","dung_o":"Loại gậy, nút đánh khi cầm gậy"},{"nhom":"bieu_tuong","ma":"spear","ten":"Thương","dung_o":"Loại thương, nút đánh khi cầm thương"},{"nhom":"bieu_tuong","ma":"shield","ten":"Khiên","dung_o":"Loại khiên, chỉ số Thủ, vùng an toàn"},{"nhom":"bieu_tuong","ma":"punch","ten":"Nắm đấm","dung_o":"Sức mạnh, tay không"},{"nhom":"bieu_tuong","ma":"hat","ten":"Mũ","dung_o":"Ô trang bị mũ"},{"nhom":"bieu_tuong","ma":"armor","ten":"Áo giáp","dung_o":"Ô trang bị áo"},{"nhom":"bieu_tuong","ma":"pants","ten":"Quần","dung_o":"Ô trang bị quần"},{"nhom":"bieu_tuong","ma":"gloves","ten":"Găng tay","dung_o":"Ô trang bị găng"},{"nhom":"bieu_tuong","ma":"shoes","ten":"Giày","dung_o":"Ô trang bị giày"},{"nhom":"bieu_tuong","ma":"wings","ten":"Áo choàng / cánh","dung_o":"Ô trang bị cánh"},{"nhom":"bieu_tuong","ma":"mount","ten":"Ngựa","dung_o":"Thú cưỡi, nút kỹ năng thú cưỡi"},{"nhom":"bieu_tuong","ma":"book","ten":"Sách","dung_o":"Sách kỹ năng, ô kỹ năng"},{"nhom":"bieu_tuong","ma":"ore","ten":"Khoáng thạch","dung_o":"Nguyên liệu"},{"nhom":"bieu_tuong","ma":"lock","ten":"Ổ khóa","dung_o":"Ô khóa, đăng nhập"},{"nhom":"bieu_tuong","ma":"pin","ten":"Ghim bản đồ","dung_o":"Tên vùng trên bản đồ nhỏ"},{"nhom":"bieu_tuong","ma":"flame","ten":"Lửa","dung_o":"Sách Hỏa, kỹ năng Liên hoàn"},{"nhom":"bieu_tuong","ma":"water","ten":"Nước","dung_o":"Sách Thủy, trùm Ngư Tinh"},{"nhom":"bieu_tuong","ma":"wood","ten":"Cây","dung_o":"Sách Mộc"},{"nhom":"bieu_tuong","ma":"metal","ten":"Kim loại","dung_o":"Sách Kim"},{"nhom":"bieu_tuong","ma":"earth","ten":"Đất","dung_o":"Sách Thổ"},{"nhom":"bieu_tuong","ma":"heart","ten":"Trái tim","dung_o":"Máu, Sức khỏe"},{"nhom":"bieu_tuong","ma":"orb","ten":"Cầu mana","dung_o":"Mana, hết mana"},{"nhom":"bieu_tuong","ma":"speed","ten":"Tốc độ","dung_o":"Tốc độ chạy, tốc đánh"},{"nhom":"bieu_tuong","ma":"reflect","ten":"Phản đòn","dung_o":"Chỉ số phản đòn"},{"nhom":"bieu_tuong","ma":"feather","ten":"Lông vũ","dung_o":"Nhanh nhẹn"},{"nhom":"bieu_tuong","ma":"flag","ten":"Lá cờ","dung_o":"Mệnh lệnh, lính đang ra trận"},{"nhom":"bieu_tuong","ma":"talk","ten":"Nói chuyện","dung_o":"Gặp dân làng"},{"nhom":"bieu_tuong","ma":"bridge","ten":"Cây cầu","dung_o":"Nhiệm vụ qua cầu"},{"nhom":"bieu_tuong","ma":"deer","ten":"Hươu","dung_o":"Nhiệm vụ săn hươu"},{"nhom":"bieu_tuong","ma":"lion","ten":"Sư tử","dung_o":"Nhiệm vụ sư tử"},{"nhom":"bieu_tuong","ma":"elephant","ten":"Voi","dung_o":"Voi rừng, thú cưỡi voi"},{"nhom":"bieu_tuong","ma":"croc","ten":"Cá sấu","dung_o":"Nhiệm vụ cá sấu"},{"nhom":"bieu_tuong","ma":"coin","ten":"Đồng tiền","dung_o":"Tiền"},{"nhom":"bieu_tuong","ma":"close","ten":"Dấu X","dung_o":"Đóng, báo lỗi"},{"nhom":"bieu_tuong","ma":"eye","ten":"Con mắt","dung_o":"Xem, tầm đánh"},{"nhom":"bieu_tuong","ma":"out","ten":"Cửa ra","dung_o":"Đăng xuất"},{"nhom":"bieu_tuong","ma":"check","ten":"Dấu tích","dung_o":"Xong, thành công"},{"nhom":"bieu_tuong","ma":"next","ten":"Mũi tên","dung_o":"Tiếp, nhận việc"},{"nhom":"bieu_tuong","ma":"pen","ten":"Bút","dung_o":"Đặt tên"},{"nhom":"bieu_tuong","ma":"user","ten":"Người","dung_o":"Lính, đổi nhân vật"},{"nhom":"bieu_tuong","ma":"hand2","ten":"Hai tay","dung_o":"Vũ khí cầm hai tay"},{"nhom":"bieu_tuong","ma":"thunder","ten":"Sấm sét","dung_o":"Sách Lôi"},{"nhom":"bieu_tuong","ma":"wind","ten":"Gió","dung_o":"Sách Phong"},{"nhom":"bieu_tuong","ma":"ice","ten":"Băng","dung_o":"Sách Băng"},{"nhom":"bieu_tuong","ma":"demon","ten":"Ma công","dung_o":"Sách Ma công, quái thu phục"},{"nhom":"bieu_tuong","ma":"light","ten":"Ánh sáng","dung_o":"Sách Ánh sáng"},{"nhom":"bieu_tuong","ma":"spark","ten":"Tia sáng","dung_o":"Trí tuệ, Mana, kỹ năng Combo"},{"nhom":"bieu_tuong","ma":"whirl","ten":"Lốc xoáy","dung_o":"Kỹ năng Diện rộng"},{"nhom":"bieu_tuong","ma":"tiger","ten":"Hổ","dung_o":"Thú cưỡi hổ, trùm Chúa Sơn Lâm"},{"nhom":"bieu_tuong","ma":"anvil","ten":"Cái đe","dung_o":"Gia cường"},{"nhom":"bieu_tuong","ma":"bag","ten":"Túi đồ","dung_o":"Nút túi đồ, nhặt đồ"},{"nhom":"bieu_tuong","ma":"home","ten":"Ngôi nhà","dung_o":"Về làng"},{"nhom":"bieu_tuong","ma":"save","ten":"Lưu","dung_o":"Nút lưu"},{"nhom":"bieu_tuong","ma":"quest","ten":"Nhiệm vụ","dung_o":"Nút nhiệm vụ, theo dõi việc"},{"nhom":"bieu_tuong","ma":"aim","ten":"Khóa mục tiêu","dung_o":"Nút khóa mục tiêu khi cầm cung, nỏ; chỉ số chính xác"},{"nhom":"bieu_tuong","ma":"menu","ten":"Menu","dung_o":"Nút menu góc trên (ba gạch)"},{"nhom":"bieu_tuong","ma":"map","ten":"Bản đồ","dung_o":"Nút chọn bản đồ trong menu"},{"nhom":"quai","ma":"deer","ten":"Hươu","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"lion","ten":"Sư tử","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"elephant","ten":"Voi rừng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"croc","ten":"Cá sấu","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"chua-son-lam","ten":"Chúa Sơn Lâm (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ngu-tinh","ten":"Ngư Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"bo-cap","ten":"Bọ cạp cát","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ken-ken","ten":"Kền kền","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"chan-tinh","ten":"Chằn Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"thach-tinh","ten":"Thạch Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"soi-tuyet","ten":"Sói tuyết","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"gau-nui","ten":"Gấu ngựa","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ho-tinh","ten":"Hồ Tinh chín đuôi (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"doi-quy","ten":"Dơi quỷ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"nhen-doc","ten":"Nhện độc","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"dai-bang","ten":"Đại Bàng Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"khi-rung","ten":"Khỉ rừng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ran-ho","ten":"Rắn hổ mang","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"moc-tinh","ten":"Mộc Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"dia-khong-lo","ten":"Đỉa khổng lồ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ech-doc","ten":"Ếch độc","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"xa-tinh","ten":"Xà Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ung-tuyet","ten":"Ưng tuyết","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"de-nui","ten":"Dê núi","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"loi-dieu","ten":"Lôi Điểu (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"am-binh","ten":"Âm binh","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"quy-doi","ten":"Quỷ đói","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tuong-am-binh","ten":"Tướng Âm Binh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"cua-khong-lo","ten":"Cua khổng lồ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"muc-ma","ten":"Mực ma","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"thuong-luong","ten":"Thuồng Luồng (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"nham-thach-thu","ten":"Nham thạch thú","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"quy-lua","ten":"Quỷ lửa","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hoa-long","ten":"Hỏa Long (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ma-troi","ten":"Ma trơi","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"quy-cay","ten":"Quỷ cây","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"chua-quy","ten":"Chúa Quỷ (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"voi-ma-mut","ten":"Voi ma mút","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"yeu-tuyet","ten":"Yêu tuyết","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"bang-hoang","ten":"Băng Hoàng (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"phan-quan","ten":"Phản quân","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hac-ky","ten":"Hắc kỵ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hac-long-tuong","ten":"Hắc Long Tướng (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"thien-binh","ten":"Thiên binh","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ky-lan","ten":"Kỳ lân","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ma-vuong","ten":"Ma Vương (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tom-tuong","ten":"Tôm tướng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ca-kiem","ten":"Cá kiếm","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"long-vuong","ten":"Long Vương Thủy Phủ (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"xuong-kho","ten":"Xương khô","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"bo-cap-den","ten":"Bọ cạp đen","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hac-mo-vuong","ten":"Hắc Mộ Vương (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tien-hac","ten":"Tiên hạc","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tuyet-vien","ten":"Tuyết viên","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"phong-vuong","ten":"Phong Vương (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tho-phi","ten":"Thổ phỉ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ngao-den","ten":"Ngao đen","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"su-quan","ten":"Sứ Quân Phản Loạn (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"nguu-dau","ten":"Ngưu Đầu","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ma-dien","ten":"Mã Diện","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"diem-la-tuong","ten":"Diêm La Tướng (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"giao-long","ten":"Giao long","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hai-quy","ten":"Hải quỷ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hai-long-vuong","ten":"Hải Long Vương (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ho-ly","ten":"Hồ ly","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"yeu-tang","ten":"Yêu tăng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"cuu-vi-ho","ten":"Cửu Vĩ Hồ (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tho-ngoc","ten":"Thỏ ngọc chiến binh","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"nguyet-binh","ten":"Nguyệt binh","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"nguyet-than","ten":"Nguyệt Thần (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ngu-lam-phan","ten":"Ngự lâm phản loạn","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"chien-tuong","ten":"Chiến tượng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hac-de","ten":"Hắc Đế (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"thien-tuong","ten":"Thiên tướng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"than-thu","ten":"Thần thú","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hac-thien-ma","ten":"Hắc Thiên Ma (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"logo","ten":"Logo Lữ Hành","dung_o":"Màn hình chờ, cổng đăng nhập","link_anh":"","goi_y":"Định dạng webp, nền trong suốt, ngang khoảng 480×200","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho","ten":"Màn hình chờ (loading screen) chung","dung_o":"Mọi màn hình chờ, khi chưa có ảnh riêng bên dưới","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho_tai_game","ten":"Màn hình chờ lúc mở trang","dung_o":"Thanh tải 0–100% khi mở trang và kết nối máy chủ","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho_tao_nv","ten":"Màn hình chờ tạo nhân vật","dung_o":"Lời dẫn câu chuyện khi bấm khởi tạo nhân vật","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho_vao_lang","ten":"Màn hình chờ vào làng","dung_o":"Khi bấm Vào làng, tải nhân vật và bản đồ","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_leu","ten":"Cảnh căn lều chọn nhân vật","dung_o":"Phía sau 5 ô nhân vật trước lều","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1200×700","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_dang_nhap","ten":"Nền cổng đăng nhập","dung_o":"Phía sau khung đăng nhập và căn lều","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"chan_dung_nam","ten":"Chân dung nhân vật nam","dung_o":"Ô chân dung góc trên trái","link_anh":"","goi_y":"Định dạng webp, vuông 256×256","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"chan_dung_nu","ten":"Chân dung nhân vật nữ","dung_o":"Ô chân dung góc trên trái","link_anh":"","goi_y":"Định dạng webp, vuông 256×256","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"tui_do_roi","ten":"Túi đồ rơi","dung_o":"Túi vải rơi ra khi hạ quái","link_anh":"","goi_y":"Định dạng webp, nền trong suốt 64×64","gioi_tinh":"","ghi_chu":""}];

// Dữ liệu mặc định (dùng khi tab Sheet còn trống và để chạy caiDat)
const LH_DEFAULT=(d=>Object.fromEntries(Object.entries(d).map(([k,[h,...rows]])=>[k,rows.map(r=>Object.fromEntries(h.map((c,i)=>[c,r[i]])))])))({"cau_hinh":[["khoa","gia_tri","ghi_chu"],["diem_khoi_tao",50,"Tổng điểm chia cho Sức mạnh, Nhanh nhẹn, Sức khỏe, Trí tuệ khi tạo nhân vật"],["menh_lenh_goc",10,"Mệnh lệnh ban đầu của mọi nhân vật"],["so_nhan_vat_toi_da",5,"Số nhân vật tối đa của một tài khoản"],["cung_chinh_xac",70,"Cung: tỉ lệ bắn trúng (%) khi bật khóa mục tiêu, chưa gia cường"],["no_chinh_xac",76,"Nỏ: tỉ lệ bắn trúng (%) khi bật khóa mục tiêu, chưa gia cường"],["chinh_xac_moi_cap",2,"Mỗi cấp gia cường cung / nỏ cộng thêm bao nhiêu % chính xác (tối đa 100%)"],["cung_no_x2",15,"Cầm cung / nỏ: cộng thêm % tỉ lệ gây sát thương x2 (vũ khí khác không có)"],["gioi_han_ha_quai",16,"Hạ tối đa bao nhiêu con cùng một loài quái thường trong một lượt hồi sinh (chống gian lận; bãi quái lớn cần số lớn)"],["nguoi_choi_ao",4,"Số người chơi ảo đi săn ở mỗi bản đồ (0 = tắt)"],["trum_ky_nang_giay",7,"Trùm ra chiêu đặc biệt (cột ky_nang ở tab quai) cách nhau bao nhiêu giây"],["dong_do_mac","def,hp,dodge,reflect,hpReg,mp","Đồ mặc: các chỉ số có thể ra dòng ngẫu nhiên (mã ở tab thuoc_tinh, cách nhau dấu phẩy)"],["cuong_hoa_5_mau",80,"Mặc 5 món từ +9: cộng thêm máu"],["cuong_hoa_bo_mau",150,"Đủ 8 ô đồ từ +9: cộng thêm máu"],["cuong_hoa_bo_sat_thuong",10,"Đủ 8 ô đồ từ +9: cộng thêm % sát thương"],["tien_thu_nghiem",9999999,"Tiền (đồng) cho nhân vật mới: 999 vàng 99 bạc 99 đồng. 100 đồng = 1 bạc, 100 bạc = 1 vàng"],["hong_ngoc_thu_nghiem",999,"Hồng ngọc cho nhân vật mới"],["ti_le_ban_lai",40,"% giá gốc nhận lại khi bán cho cửa hàng"],["he_so_gia_do_dep",250,"Giá đồ Đẹp trong cửa hàng = % này của giá gốc"],["he_so_gia_hoan_hao",600,"Giá đồ Hoàn hảo trong hiệu buôn thành trì = % này của giá gốc"],["dung_hop_ngoc",60,"Dung hợp cánh (NPC Luyện khí sư): số hồng ngọc tốn mỗi lần"],["dung_hop_ti_le",40,"Dung hợp cánh: tỉ lệ thành công (%)"],["dung_hop_thu_cap",9,"Dung hợp cánh: thú cưỡi phải gia cường tới cấp này"],["dung_hop_dong","0,30,28,22,12,6,2","Dung hợp cánh: tỉ lệ (%) ra 0,1,2,3,4,5 dòng (6 số, cách nhau dấu phẩy; số đầu bỏ qua)"],["canh_dong","dmgMax,dmgMin,def,hp,mp,range,crit3","Dung hợp cánh: các chỉ số có thể ra dòng"],["nap_ngan_hang","MB","Nạp thẻ: mã ngân hàng theo VietQR (MB = Quân đội)"],["nap_so_tai_khoan","2220181818888","Nạp thẻ: số tài khoản nhận tiền"],["nap_ten_tai_khoan","TRAN ANH NGUYET","Nạp thẻ: tên chủ tài khoản (không dấu)"],["nap_noi_dung","Ikyna {goi} {tai_khoan}","Nạp thẻ: nội dung chuyển khoản ({goi} = tên gói, {tai_khoan} = tên đăng nhập)"],["phi_cho",5,"% thương nhân giữ lại khi bán hộ trên chợ và khi bán nhân vật đánh thuê"],["mau_goc",60,"Máu = mau_goc + Sức khỏe × mau_moi_diem"],["mau_moi_diem",5,""],["mana_goc",40,"Mana = mana_goc + Trí tuệ × mana_moi_diem"],["mana_moi_diem",4,""],["hoa_sat_thuong",25,"Sách Hỏa: % sát thương"],["thuy_hoi_mana",3,"Sách Thủy: mana mỗi giây"],["tho_phan_don",30,"Sách Thổ: % phản đòn"],["kim_giam_sat_thuong",25,"Sách Kim: % giảm sát thương"],["moc_hoi_mau",2,"Sách Mộc: máu mỗi giây"],["vung_an_toan_x",27,"Ô bản đồ từ cột 0 đến cột này là vùng an toàn (làng)"],["bo_cong_vu_khi",16,"Đồ bộ huyền thoại: công vũ khí gốc"],["bo_thu_khien",10,"Đồ bộ: thủ của khiên"],["bo_thu_ao",12,"Đồ bộ: thủ của áo giáp"],["bo_thu_nho",6,"Đồ bộ: thủ của mũ, quần, găng, giày, cánh"],["bo_toc_thu_cuoi",155,"Đồ bộ: tốc độ thú cưỡi (% tốc đi bộ)"],["gia_do_bo",5000,"Giá gốc món đồ bộ (để tính giá bán lại)"],["gieng_hoi_giay",300,"Giếng cổ: số giây để nước đầy lại sau khi dùng"],["exp_goc",60,"Kinh nghiệm cần để lên cấp 2. Cấp L cần exp_goc × L^(exp_tang/100)"],["exp_tang",150,"Độ tăng kinh nghiệm cần mỗi cấp (150 = lũy thừa 1,5)"],["cap_toi_da",150,"Cấp cao nhất của nhân vật"],["diem_moi_cap",5,"Điểm cộng chỉ số nhận được mỗi lần lên cấp"],["sach_chi_so",4,"Mỗi sách gắn vào ô kỹ năng cộng chừng này điểm vào chỉ số theo hệ (Mộc chia đôi cho Sức khỏe và Trí tuệ)"],["sach_moi_cap",2,"Mỗi cấp gia cường sách cộng thêm"],["thu_cuoi_toc_cap",3,"Thú cưỡi: % tốc độ mỗi cấp gia cường (+1 đến +15)"],["thu_cuoi_cong_cap",2,"Thú cưỡi: công mỗi cấp từ +7"],["thu_cuoi_mau_cap",20,"Thú cưỡi: máu mỗi cấp từ +11"],["thu_cuoi_mana_cap",10,"Thú cưỡi: mana mỗi cấp từ +11"],["thu_cuoi_thu_cap",2,"Thú cưỡi: phòng ngự mỗi cấp từ +11"],["sach_ti_le_cap",1,"Sách Lôi, Phong, Băng, Ánh sáng, Ma công: mỗi cấp gia cường cộng thêm % tỉ lệ kích hoạt"],["loi_ti_le",12,"Sách Lôi: % mỗi đòn trúng có thêm một đạo lôi quang đánh xuống"],["loi_sat_thuong",150,"Sách Lôi: sát thương lôi quang = % sát thương đòn đánh"],["phong_ti_le",20,"Sách Phong: % làm chậm quái"],["phong_cham",45,"Sách Phong: % giảm tốc độ quái"],["phong_ms",3000,"Sách Phong: thời gian chậm (mili giây)"],["bang_ti_le",10,"Sách Băng: % đóng băng quái"],["bang_ms",1800,"Sách Băng: thời gian đóng băng (mili giây), trùm còn một nửa"],["sang_ti_le",15,"Sách Ánh sáng: % khi bị đánh trúng làm quái hoảng sợ bỏ chạy"],["sang_ms",2500,"Sách Ánh sáng: thời gian quái bỏ chạy (mili giây), trùm còn một nửa"],["ma_ti_le_goc",2,"Sách Ma công: % thu phục quái khi hạ (không áp dụng cho trùm)"],["ma_phan_van_moi_menh_lenh",20,"Sách Ma công: mỗi điểm Mệnh lệnh cộng thêm chừng này phần vạn tỉ lệ (20 = 0,2%)"],["ma_toi_da",2,"Số quái thu phục tối đa đi theo. Quái chết là mất hẳn"],["pham_chat_roi_toi_da","p","Phẩm chất cao nhất rơi ra ở bản đồ này (n Thường, g Đẹp, p Hoàn hảo, l Huyền thoại, m Thần). Đồ cao hơn không rơi, phần thưởng nhiệm vụ cũng không vượt mức này"],["link_cho_phien","https://ikynagame.blogspot.com/p/cho-phien.html","Địa chỉ trang Chợ phiên (mua bán giữa người chơi, nhân vật đi theo)"]],"gia_cuong":[["cap","ti_le","phi_hong_ngoc","that_bai_tu","that_bai_den"],[0,100,1,"",""],[1,100,2,"",""],[2,100,3,"",""],[3,100,4,"",""],[4,100,5,"",""],[5,100,6,"",""],[6,50,7,0,6],[7,50,8,0,6],[8,50,9,0,6],[9,50,10,0,6],[10,25,11,6,6],[11,20,12,6,6],[12,15,13,6,6],[13,10,14,6,6],[14,5,15,6,6]],"pham_chat":[["ma","ten","mau","he_so","so_dong","bac","giao_dich","mua_duoc"],["n","Thường","#e8e6df",100,0,0,"khong","co"],["g","Đẹp","#ffd54a",110,1,1,"khong","co"],["p","Hoàn hảo","#5aa9ff",125,2,2,"co","khong"],["l","Huyền thoại","#c8823e",150,3,3,"co","khong"],["m","Thần","#ff6fb5",200,4,4,"co","khong"]],"thuoc_tinh":[["ma","ten","nhom","don_vi","dep_thap","dep_cao","hoan_hao_thap","hoan_hao_cao","huyen_thoai_thap","huyen_thoai_cao","than_thap","than_cao"],["str","Sức mạnh","str","",1,2,2,4,4,7,8,12],["agi","Nhanh nhẹn","agi","",1,2,2,4,4,7,8,12],["vit","Sức khỏe","vit","",1,2,2,4,4,7,8,12],["int","Trí tuệ","int","",1,2,2,4,4,7,8,12],["cmd","Mệnh lệnh","cmd","",1,1,1,2,2,4,4,6],["dmgMax","Sát thương cao nhất","str","",1,3,3,6,6,10,12,20],["dmgMin","Sát thương nhỏ nhất","str","",1,2,2,4,4,7,8,14],["acc","Sát thương chính xác","str","%",1,2,2,4,4,7,8,12],["crit2","Tỉ lệ sát thương x2","str","%",1,2,2,4,4,6,7,10],["crit3","Tỉ lệ sát thương x3","str","%",1,1,1,2,2,3,3,5],["trueDmg","Sát thương chuẩn","str","",1,2,2,5,5,9,10,18],["perfDmg","Sát thương hoàn hảo","str","%",1,1,1,3,3,5,5,8],["legDmg","Sát thương huyền thoại","str","%",1,1,1,2,2,4,4,6],["mythDmg","Sát thương thần thoại","str","%",1,1,1,1,1,2,3,5],["atkSpd","Tốc độ đánh","agi","%",1,3,3,6,6,10,10,15],["moveSpd","Tốc độ di chuyển","agi","%",1,2,2,4,4,7,8,12],["def","Khả năng phòng ngự","agi","",1,2,2,4,4,7,8,14],["block","Phòng ngự thành công","agi","%",1,2,2,4,4,6,7,10],["dodge","Tránh né","agi","%",1,2,2,3,3,5,6,9],["dmgRed","Giảm sát thương","agi","%",1,2,2,4,4,6,7,10],["perfRed","Giảm sát thương hoàn hảo","agi","%",1,2,2,4,4,6,7,10],["critRed","Giảm sát thương x2, x3","agi","%",1,2,2,4,4,6,7,10],["legRed","Giảm sát thương huyền thoại","agi","%",1,2,2,4,4,6,7,10],["mythRed","Giảm sát thương thần thoại","agi","%",1,2,2,3,3,5,5,8],["hp","Lượng máu","vit","",5,10,10,20,20,40,50,80],["hpReg","Hồi máu mỗi giây","vit","",1,1,1,2,2,3,3,5],["reflect","Phản đòn","vit","%",1,2,2,4,4,7,8,12],["range","Tầm đánh","agi","%",3,5,5,8,8,12,12,18],["mp","Lượng mana","int","",4,8,8,16,16,30,40,60],["mpReg","Hồi mana mỗi giây","int","",1,1,1,2,2,3,3,5],["cdr","Giảm thời gian hồi chiêu","int","%",1,2,2,4,4,6,7,10]],"vat_pham":[["id","ten","o","loai","cam","cong","thu","toc","gia","mau","thu_cuoi","menh_lenh","he","pham_chat","hieu_ung","gia_tri","mo_ta"],["sword","Kiếm tập","hand","sword","one",2,0,0,40,"","",0,"","","",0,""],["sword-iron","Kiếm sắt","hand","sword","one",6,0,0,150,"#d5dde2","",0,"","","",0,""],["sword-steel","Kiếm thép","hand","sword","one",11,0,0,480,"#a8dcf0","",0,"","","",0,""],["shield","Khiên tập","hand","shield","one",0,2,0,40,"","",0,"","","",0,""],["shield-wood","Khiên mây","hand","shield","one",0,4,0,120,"#a8864a","",0,"","","",0,""],["shield-iron","Khiên đồng","hand","shield","one",0,8,0,420,"#b08a4a","",0,"","","",0,""],["staff","Gậy tập","hand","staff","one",2,0,0,40,"","",0,"","","",0,""],["staff-jade","Gậy ngọc","hand","staff","one",8,0,0,360,"#7fe0b0","",0,"","","",0,""],["bow","Cung tập","hand","bow","two",3,0,0,50,"","",0,"","","",0,""],["bow-hunt","Cung săn","hand","bow","two",9,0,0,380,"#9a6430","",0,"","","",0,""],["spear","Giáo tập","hand","spear","two",3,0,0,50,"","",0,"","","",0,""],["spear-iron","Giáo sắt","hand","spear","two",10,0,0,400,"#d5dde2","",0,"","","",0,""],["crossbow","Nỏ tập","hand","crossbow","two",4,0,0,60,"","",0,"","","",0,""],["crossbow-war","Nỏ chiến","hand","crossbow","two",13,0,0,560,"#4a3524","",0,"","","",0,""],["hat","Nón lá","hat","hat","",0,1,0,30,"","",0,"","","",0,""],["hat-iron","Nón dấu","hat","hat","",0,3,0,180,"#6b4a2e","",0,"","","",0,""],["armor","Áo vải","armor","armor","",0,2,0,60,"","",0,"","","",0,""],["armor-leather","Áo da","armor","armor","",0,4,0,200,"#8a5a34","",0,"","","",0,""],["armor-iron","Giáp đồng","armor","armor","",0,8,0,600,"#a07a40","",0,"","","",0,""],["pants","Quần vải","pants","pants","",0,1,0,30,"","",0,"","","",0,""],["pants-guard","Quần giáp","pants","pants","",0,3,0,180,"#5d4a34","",0,"","","",0,""],["gloves","Bao tay","gloves","gloves","",0,1,0,30,"","",0,"","","",0,""],["gloves-leather","Bao tay da","gloves","gloves","",0,2,0,120,"#6b4a2e","",0,"","","",0,""],["shoes","Dép cỏ","shoes","shoes","",0,1,0,30,"","",0,"","","",0,""],["shoes-leather","Giày da","shoes","shoes","",0,2,0,120,"#5b3d26","",0,"","","",0,""],["shoes-iron","Ủng đồng","shoes","shoes","",0,4,0,300,"#8a6a3a","",0,"","","",0,""],["wings","Áo choàng","wings","wings","",0,1,0,900,"","",0,"","","",0,""],["canh-thien-than","Cánh thiên thần","wings","wings","",0,6,0,30000,"#f4f0ff","",0,"","","",0,""],["canh-ac-quy","Cánh ác quỷ","wings","wings","",0,6,0,30000,"#5a1a3a","",0,"","","",0,""],["canh-tien-nu","Cánh tiên nữ","wings","wings","",0,6,0,30000,"#ffc0e8","",0,"","","",0,""],["canh-anh-sang","Cánh ánh sáng","wings","wings","",0,6,0,30000,"#fff0a0","",0,"","","",0,""],["canh-xuong","Cánh xương","wings","wings","",0,6,0,30000,"#e8e0d0","",0,"","","",0,""],["canh-loi-phong","Cánh lôi phong","wings","wings","",0,6,0,30000,"#a0c8ff","",0,"","","",0,""],["canh-dai-bang","Cánh đại bàng","wings","wings","",0,6,0,30000,"#8a5a30","",0,"","","",0,""],["canh-lua","Cánh lửa","wings","wings","",0,6,0,30000,"#ff8a3d","",0,"","","",0,""],["mount","Ngựa con","mount","mount","",0,0,115,200,"#b78452","horse",5,"","","",0,""],["mount-brown","Ngựa nâu","mount","mount","",0,0,125,600,"#7a4b2a","horse",5,"","","",0,""],["mount-black","Ngựa ô","mount","mount","",0,0,135,1200,"#2e2a2a","horse",5,"","","",0,""],["mount-white","Bạch mã","mount","mount","",0,0,150,2500,"#ece6da","horse",5,"","","",0,""],["mount-tiger","Hổ","mount","mount","",4,0,145,4000,"#e08a2e","tiger",10,"","","",0,""],["mount-elephant","Voi","mount","mount","",0,8,120,6000,"#8e9398","elephant",15,"","","",0,""],["ore","Khoáng thạch","","ore","",0,0,0,20,"","",0,"","","",0,""],["book-fire","Sách Hỏa","book","book","",0,0,0,400,"","",0,"fire","","",0,""],["book-water","Sách Thủy","book","book","",0,0,0,300,"","",0,"water","","",0,""],["book-earth","Sách Thổ","book","book","",0,0,0,450,"","",0,"earth","","",0,""],["book-metal","Sách Kim","book","book","",0,0,0,450,"","",0,"metal","","",0,""],["book-wood","Sách Mộc","book","book","",0,0,0,300,"","",0,"wood","","",0,""],["book-loi","Sách Lôi","book","book","",0,0,0,900,"","",0,"thunder","","",0,""],["book-phong","Sách Phong","book","book","",0,0,0,700,"","",0,"wind","","",0,""],["book-bang","Sách Băng","book","book","",0,0,0,800,"","",0,"ice","","",0,""],["book-ma","Sách Ma công","book","book","",0,0,0,1500,"","",0,"demon","","",0,""],["book-sang","Sách Ánh sáng","book","book","",0,0,0,1000,"","",0,"light","","",0,""],["kiem-co-loa","Kiếm Âu Lạc","hand","sword","one",16,0,0,12000,"#8a9a5a","",0,"","","",0,""],["khien-co-loa","Khiên Âu Lạc","hand","shield","one",0,14,0,11200,"#8a9a5a","",0,"","","",0,""],["gay-co-loa","Gậy phép Âu Lạc","hand","staff","one",13,0,0,10400,"#8a9a5a","",0,"","","",0,""],["cung-co-loa","Cung Âu Lạc","hand","bow","two",15,0,0,11200,"#8a9a5a","",0,"","","",0,""],["giao-co-loa","Giáo Âu Lạc","hand","spear","two",17,0,0,12000,"#8a9a5a","",0,"","","",0,""],["no-co-loa","Nỏ Âu Lạc","hand","crossbow","two",19,0,0,14000,"#8a9a5a","",0,"","","",0,""],["mu-co-loa","Mũ trụ Âu Lạc","hat","hat","",0,6,0,6000,"#8a9a5a","",0,"","","",0,""],["giap-co-loa","Giáp Âu Lạc","armor","armor","",0,12,0,16000,"#8a9a5a","",0,"","","",0,""],["quan-co-loa","Quần giáp Âu Lạc","pants","pants","",0,6,0,6000,"#8a9a5a","",0,"","","",0,""],["gang-co-loa","Bao tay Âu Lạc","gloves","gloves","",0,4,0,4400,"#8a9a5a","",0,"","","",0,""],["giay-co-loa","Hài Âu Lạc","shoes","shoes","",0,5,0,5200,"#8a9a5a","",0,"","","",0,""],["ao-choang-co-loa","Áo choàng Âu Lạc","wings","wings","",0,3,0,24000,"#8a9a5a","",0,"","","",0,""],["ngua-co-loa","Ngựa chiến Cổ Loa","mount","mount","",0,0,160,80000,"#6a4a30","horse",6,"","","",0,""],["no-lien-chau","Nỏ Liên Châu","hand","crossbow","two",22,0,0,160000,"#8a6a3a","",0,"","p","frost",18,"Đòn bắn có 18% làm quái chậm nửa tốc trong 2 giây"],["co-may-man","Cờ May Mắn","wings","wings","",0,4,0,160000,"#e0b040","",0,"","p","luck",25,"Tỉ lệ rơi đồ tăng 25%"],["kiem-thang-long","Kiếm Long Thành","hand","sword","one",16,0,0,90000,"#c03030","",0,"","","",0,""],["khien-thang-long","Khiên Long Thành","hand","shield","one",0,14,0,84000,"#c03030","",0,"","","",0,""],["gay-thang-long","Gậy phép Long Thành","hand","staff","one",13,0,0,78000,"#c03030","",0,"","","",0,""],["cung-thang-long","Cung Long Thành","hand","bow","two",15,0,0,84000,"#c03030","",0,"","","",0,""],["giao-thang-long","Giáo Long Thành","hand","spear","two",17,0,0,90000,"#c03030","",0,"","","",0,""],["no-thang-long","Nỏ Long Thành","hand","crossbow","two",19,0,0,105000,"#c03030","",0,"","","",0,""],["mu-thang-long","Mũ trụ Long Thành","hat","hat","",0,6,0,45000,"#c03030","",0,"","","",0,""],["giap-thang-long","Giáp Long Thành","armor","armor","",0,12,0,120000,"#c03030","",0,"","","",0,""],["quan-thang-long","Quần giáp Long Thành","pants","pants","",0,6,0,45000,"#c03030","",0,"","","",0,""],["gang-thang-long","Bao tay Long Thành","gloves","gloves","",0,4,0,33000,"#c03030","",0,"","","",0,""],["giay-thang-long","Hài Long Thành","shoes","shoes","",0,5,0,39000,"#c03030","",0,"","","",0,""],["ao-choang-thang-long","Áo choàng Long Thành","wings","wings","",0,3,0,180000,"#c03030","",0,"","","",0,""],["ho-trang","Hổ trắng Tây Bắc","mount","mount","",0,0,160,600000,"#f0f0f4","tiger",12,"","","",0,""],["ngua-ngu-lam","Ngựa Ngự Lâm","mount","mount","",0,0,170,600000,"#2a2a30","horse",8,"","","",0,""],["kiem-long-tuyen","Kiếm Long Tuyền","hand","sword","one",30,0,0,1200000,"#9ad0c0","",0,"","p","venom",30,"Đòn đánh gây độc thêm 30% sát thương trong 4 giây"],["co-phu-quy","Cờ Phú Quý","wings","wings","",0,6,0,1200000,"#e0b040","",0,"","p","coinUp",30,"Đồng nhận được khi hạ quái tăng 30%"],["ao-choang-tinh-thong","Áo choàng Tinh Thông","wings","wings","",0,6,0,1200000,"#4a6a9a","",0,"","p","expUp",25,"Kinh nghiệm nhận được tăng 25%"],["kiem-hoa-lu","Kiếm Trường Yên","hand","sword","one",16,0,0,480000,"#6a3a8a","",0,"","","",0,""],["khien-hoa-lu","Khiên Trường Yên","hand","shield","one",0,14,0,448000,"#6a3a8a","",0,"","","",0,""],["gay-hoa-lu","Gậy phép Trường Yên","hand","staff","one",13,0,0,416000,"#6a3a8a","",0,"","","",0,""],["cung-hoa-lu","Cung Trường Yên","hand","bow","two",15,0,0,448000,"#6a3a8a","",0,"","","",0,""],["giao-hoa-lu","Giáo Trường Yên","hand","spear","two",17,0,0,480000,"#6a3a8a","",0,"","","",0,""],["no-hoa-lu","Nỏ Trường Yên","hand","crossbow","two",19,0,0,560000,"#6a3a8a","",0,"","","",0,""],["mu-hoa-lu","Mũ trụ Trường Yên","hat","hat","",0,6,0,240000,"#6a3a8a","",0,"","","",0,""],["giap-hoa-lu","Giáp Trường Yên","armor","armor","",0,12,0,640000,"#6a3a8a","",0,"","","",0,""],["quan-hoa-lu","Quần giáp Trường Yên","pants","pants","",0,6,0,240000,"#6a3a8a","",0,"","","",0,""],["gang-hoa-lu","Bao tay Trường Yên","gloves","gloves","",0,4,0,176000,"#6a3a8a","",0,"","","",0,""],["giay-hoa-lu","Hài Trường Yên","shoes","shoes","",0,5,0,208000,"#6a3a8a","",0,"","","",0,""],["ao-choang-hoa-lu","Áo choàng Trường Yên","wings","wings","",0,3,0,960000,"#6a3a8a","",0,"","","",0,""],["ky-lan-trang-an","Kỳ lân Tràng An","mount","mount","",6,0,175,3200000,"#e8c060","kylan",14,"","","",0,""],["voi-trang","Voi trắng","mount","mount","",0,10,140,3200000,"#e8e8e4","elephant",18,"","","",0,""],["giap-cuong-no","Giáp Cuồng Nộ","armor","armor","",0,30,0,6400000,"#8a2a2a","",0,"","p","rage",40,"Dưới 30% máu: sát thương tăng 40%"],["cung-co-lau","Cung Cờ Lau","hand","bow","two",34,0,0,6400000,"#c08040","",0,"","p","frost",25,"Đòn bắn có 25% làm quái chậm nửa tốc trong 2 giây"],["co-tinh-thong","Cờ Tinh Thông","wings","wings","",0,8,0,6400000,"#4a6a9a","",0,"","p","expUp",40,"Kinh nghiệm nhận được tăng 40%"],["kiem-phu-xuan","Kiếm Thuận Hóa","hand","sword","one",16,0,0,1800000,"#d0a030","",0,"","","",0,""],["khien-phu-xuan","Khiên Thuận Hóa","hand","shield","one",0,14,0,1680000,"#d0a030","",0,"","","",0,""],["gay-phu-xuan","Gậy phép Thuận Hóa","hand","staff","one",13,0,0,1560000,"#d0a030","",0,"","","",0,""],["cung-phu-xuan","Cung Thuận Hóa","hand","bow","two",15,0,0,1680000,"#d0a030","",0,"","","",0,""],["giao-phu-xuan","Giáo Thuận Hóa","hand","spear","two",17,0,0,1800000,"#d0a030","",0,"","","",0,""],["no-phu-xuan","Nỏ Thuận Hóa","hand","crossbow","two",19,0,0,2100000,"#d0a030","",0,"","","",0,""],["mu-phu-xuan","Mũ trụ Thuận Hóa","hat","hat","",0,6,0,900000,"#d0a030","",0,"","","",0,""],["giap-phu-xuan","Giáp Thuận Hóa","armor","armor","",0,12,0,2400000,"#d0a030","",0,"","","",0,""],["quan-phu-xuan","Quần giáp Thuận Hóa","pants","pants","",0,6,0,900000,"#d0a030","",0,"","","",0,""],["gang-phu-xuan","Bao tay Thuận Hóa","gloves","gloves","",0,4,0,660000,"#d0a030","",0,"","","",0,""],["giay-phu-xuan","Hài Thuận Hóa","shoes","shoes","",0,5,0,780000,"#d0a030","",0,"","","",0,""],["ao-choang-phu-xuan","Áo choàng Thuận Hóa","wings","wings","",0,3,0,3600000,"#d0a030","",0,"","","",0,""],["rong-thuan-hoa","Rồng Thuận Hóa","mount","mount","",6,10,190,12000000,"#2a6a5a","rong",24,"","","",0,""],["ky-lan-hoang-gia","Kỳ lân hoàng gia","mount","mount","",6,0,185,12000000,"#f0d080","kylan",16,"","","",0,""],["kiem-thien-menh","Kiếm Thiên Mệnh","hand","sword","one",44,0,0,24000000,"#ffe080","",0,"","p","rage",60,"Dưới 30% máu: sát thương tăng 60%"],["co-thien-menh","Cờ Thiên Mệnh","wings","wings","",0,10,0,24000000,"#ffd040","",0,"","p","luck",50,"Tỉ lệ rơi đồ tăng 50%"],["khien-ngu-lam","Khiên Ngự Lâm","hand","shield","one",0,38,0,24000000,"#3a3a5a","",0,"","p","frost",30,"Đòn khiên có 30% làm quái chậm nửa tốc trong 2 giây"],["ao-choang-phu-quy","Áo choàng Phú Quý","wings","wings","",0,10,0,24000000,"#e0b040","",0,"","p","coinUp",50,"Đồng nhận được khi hạ quái tăng 50%"]],"vu_khi":[["loai","ten","sat_thuong","tam_danh","lan_rong","toc_danh_ms","mana","hoi_chieu","noi_tai","ghi_chu"],["spear","Thương",130,130,26,500,110,90,14,"Sát thương cao nhất, đâm thẳng một đường"],["sword","Kiếm",115,85,115,420,90,110,10,"Đánh nhanh nhất, chém vòng cung trước mặt"],["shield","Khiên",100,60,75,560,130,70,18,"Tầm ngắn nhất, đẩy lùi mạnh. Tốn mana nhiều nhất nhưng hồi chiêu và nội tại nhanh nhất"],["crossbow","Nỏ",90,600,1,760,100,100,12,"Bắn xa, mũi tên xuyên qua quái"],["bow","Cung",80,540,0,660,120,80,16,"Bắn xa, hồi chiêu nhanh"],["staff","Gậy phép",65,680,90,900,80,120,9,"Tầm xa và rộng nhất (cầu phép nổ lan), sát thương thấp nhất, đánh chậm nhất"]],"cua_hang":[["cua_hang","id","pham_chat","gia","thu_tu","bac"],["smith","sword-iron","n,g","",1,0],["smith","sword-steel","n,g","",2,0],["smith","shield-wood","n,g","",3,0],["smith","shield-iron","n,g","",4,0],["smith","staff-jade","n,g","",5,0],["smith","bow-hunt","n,g","",6,0],["smith","spear-iron","n,g","",7,0],["smith","crossbow-war","n,g","",8,0],["smith","hat-iron","n,g","",9,0],["smith","armor-leather","n,g","",10,0],["smith","armor-iron","n,g","",11,0],["smith","pants-guard","n,g","",12,0],["smith","gloves-leather","n,g","",13,0],["smith","shoes-leather","n,g","",14,0],["smith","shoes-iron","n,g","",15,0],["trainer","mount","n","",1,0],["trainer","mount-brown","n","",2,0],["trainer","mount-black","n","",3,0],["trainer","mount-white","n","",4,0],["trainer","mount-tiger","n","",5,0],["trainer","mount-elephant","n","",6,0],["wizard","book-fire","n","",1,0],["wizard","book-water","n","",2,0],["wizard","book-earth","n","",3,0],["wizard","book-metal","n","",4,0],["wizard","book-wood","n","",5,0],["wizard","book-loi","n","",6,0],["wizard","book-phong","n","",7,0],["wizard","book-bang","n","",8,0],["wizard","book-ma","n","",9,0],["wizard","book-sang","n","",10,0],["thanh-co-loa","kiem-co-loa","n,g,p","",1,44],["thanh-co-loa","khien-co-loa","n,g,p","",2,44],["thanh-co-loa","gay-co-loa","n,g,p","",3,44],["thanh-co-loa","cung-co-loa","n,g,p","",4,44],["thanh-co-loa","giao-co-loa","n,g,p","",5,44],["thanh-co-loa","no-co-loa","n,g,p","",6,44],["thanh-co-loa","mu-co-loa","n,g,p","",7,44],["thanh-co-loa","giap-co-loa","n,g,p","",8,44],["thanh-co-loa","quan-co-loa","n,g,p","",9,44],["thanh-co-loa","gang-co-loa","n,g,p","",10,44],["thanh-co-loa","giay-co-loa","n,g,p","",11,44],["thanh-co-loa","ao-choang-co-loa","n,g,p","",12,44],["thanh-co-loa","ngua-co-loa","n","",13,44],["thanh-co-loa","no-lien-chau","p","",14,44],["thanh-co-loa","co-may-man","p","",15,44],["thanh-thang-long","kiem-thang-long","n,g,p","",1,90],["thanh-thang-long","khien-thang-long","n,g,p","",2,90],["thanh-thang-long","gay-thang-long","n,g,p","",3,90],["thanh-thang-long","cung-thang-long","n,g,p","",4,90],["thanh-thang-long","giao-thang-long","n,g,p","",5,90],["thanh-thang-long","no-thang-long","n,g,p","",6,90],["thanh-thang-long","mu-thang-long","n,g,p","",7,90],["thanh-thang-long","giap-thang-long","n,g,p","",8,90],["thanh-thang-long","quan-thang-long","n,g,p","",9,90],["thanh-thang-long","gang-thang-long","n,g,p","",10,90],["thanh-thang-long","giay-thang-long","n,g,p","",11,90],["thanh-thang-long","ao-choang-thang-long","n,g,p","",12,90],["thanh-thang-long","ho-trang","n","",13,90],["thanh-thang-long","ngua-ngu-lam","n","",14,90],["thanh-thang-long","kiem-long-tuyen","p","",15,90],["thanh-thang-long","co-phu-quy","p","",16,90],["thanh-thang-long","ao-choang-tinh-thong","p","",17,90],["thanh-hoa-lu","kiem-hoa-lu","n,g,p","",1,120],["thanh-hoa-lu","khien-hoa-lu","n,g,p","",2,120],["thanh-hoa-lu","gay-hoa-lu","n,g,p","",3,120],["thanh-hoa-lu","cung-hoa-lu","n,g,p","",4,120],["thanh-hoa-lu","giao-hoa-lu","n,g,p","",5,120],["thanh-hoa-lu","no-hoa-lu","n,g,p","",6,120],["thanh-hoa-lu","mu-hoa-lu","n,g,p","",7,120],["thanh-hoa-lu","giap-hoa-lu","n,g,p","",8,120],["thanh-hoa-lu","quan-hoa-lu","n,g,p","",9,120],["thanh-hoa-lu","gang-hoa-lu","n,g,p","",10,120],["thanh-hoa-lu","giay-hoa-lu","n,g,p","",11,120],["thanh-hoa-lu","ao-choang-hoa-lu","n,g,p","",12,120],["thanh-hoa-lu","ky-lan-trang-an","n","",13,120],["thanh-hoa-lu","voi-trang","n","",14,120],["thanh-hoa-lu","giap-cuong-no","p","",15,120],["thanh-hoa-lu","cung-co-lau","p","",16,120],["thanh-hoa-lu","co-tinh-thong","p","",17,120],["thanh-phu-xuan","kiem-phu-xuan","n,g,p","",1,145],["thanh-phu-xuan","khien-phu-xuan","n,g,p","",2,145],["thanh-phu-xuan","gay-phu-xuan","n,g,p","",3,145],["thanh-phu-xuan","cung-phu-xuan","n,g,p","",4,145],["thanh-phu-xuan","giao-phu-xuan","n,g,p","",5,145],["thanh-phu-xuan","no-phu-xuan","n,g,p","",6,145],["thanh-phu-xuan","mu-phu-xuan","n,g,p","",7,145],["thanh-phu-xuan","giap-phu-xuan","n,g,p","",8,145],["thanh-phu-xuan","quan-phu-xuan","n,g,p","",9,145],["thanh-phu-xuan","gang-phu-xuan","n,g,p","",10,145],["thanh-phu-xuan","giay-phu-xuan","n,g,p","",11,145],["thanh-phu-xuan","ao-choang-phu-xuan","n,g,p","",12,145],["thanh-phu-xuan","rong-thuan-hoa","n","",13,145],["thanh-phu-xuan","ky-lan-hoang-gia","n","",14,145],["thanh-phu-xuan","kiem-thien-menh","p","",15,145],["thanh-phu-xuan","co-thien-menh","p","",16,145],["thanh-phu-xuan","khien-ngu-lam","p","",17,145],["thanh-phu-xuan","ao-choang-phu-quy","p","",18,145]],"goi_nap":[["id","ten","tien","hong_ngoc","mo_ta","thu_tu"],["goi-20","Gói 20K",20000,20,"Dùng thử",1],["goi-50","Gói 50K",50000,55,"Tặng 10%",2],["goi-100","Gói 100K",100000,120,"Tặng 20%",3],["goi-200","Gói 200K",200000,260,"Tặng 30%",4],["goi-500","Gói 500K",500000,700,"Tặng 40%",5],["goi-1000","Gói 1 triệu",1000000,1500,"Tặng 50%",6]],"dien_mao":[["id","ten","gioi_tinh","gia","hong_ngoc","mau_da","mau_toc","kieu_toc","rau","mau_mat","dau","thu_tu"],["da-nau","Da nâu","",0,0,"#c89060","#2a2622","","","#2a2018","",1],["da-trang","Da trắng","",0,0,"#f0dcc0","#2a2622","","","#2a2018","",2],["dau-troc","Đầu trọc","m",0,0,"#e1c295","#2a2622","troc","","#2a2018","",3],["toc-xoa","Tóc xõa","",2000,0,"#e1c295","#2a2622","xoa","","#2a2018","",4],["toc-dung","Tóc dựng","",5000,0,"#e1c295","#1a1614","dung","","#2a2018","",5],["khan-buoc","Khăn buộc đầu","",6000,0,"#d8b088","#2a2622","khan","","#2a2018","",6],["toc-nau","Tóc nâu","",8000,0,"#e8cca8","#6a3a1a","","","#3a2a18","",7],["hoa-cai","Hoa cài tóc","f",8000,0,"#f0dcc0","#2a2622","","","#2a2018","hoa",8],["rau-quai","Râu quai nón","m",10000,0,"#d8b088","#2a2622","","#2a2622","#2a2018","",9],["not-ruoi","Nốt ruồi duyên","",12000,0,"#f0dcc0","#2a2622","","","#2a2018","not",10],["vet-seo","Vết sẹo chiến binh","",15000,0,"#c89060","#1a1614","dung","","#2a2018","seo",11],["toc-bac","Tóc bạc","",20000,0,"#e1c295","#d8d8d8","","","#2a2018","",12],["ve-mat","Vẽ mặt chiến binh","",30000,0,"#c89060","#2a2622","khan","","#2a2018","ve",13],["lao-truong","Lão trượng","m",50000,0,"#e8cca8","#d8d8d8","","#d8d0c0","#2a2018","",14],["mat-ngoc","Mắt ngọc","",100000,0,"#f0dcc0","#2a2622","xoa","","#2a7a9a","",15],["mat-hoa","Mắt hỏa","",0,20,"#d8b088","#1a1614","dung","","#c03020","",16],["tien-nu","Tiên nữ","f",0,30,"#fff0e0","#4a2a6a","xoa","","#6a3aa0","hoa",17],["ma-vuong","Ma Vương","m",0,30,"#9a8ab0","#1a0a2a","dung","#1a0a2a","#ff2060","ve",18]],"bo_huyen_thoai":[["id","nhan_vat","gioi_tinh","ten_bo","vu_khi_loai","vu_khi","tay_trai_loai","tay_trai","mu","ao","quan","gang","giay","canh","thu_cuoi","thu_cuoi_loai","moc_3","moc_5","moc_7","hieu_ung_9","gia_tri_9","mo_ta_9"],["ngo-quyen","Ngô Quyền","m","Bạch Đằng","sword","Kiếm Bạch Đằng","shield","Khiên cọc gỗ lim","Mũ trụ Đường Lâm","Giáp Bạch Đằng","Quần trận Bạch Đằng","Bao tay chèo lái","Hài thủy chiến","Cờ hiệu Tiền Ngô","Chiến mã Đường Lâm","horse","def:6,hp:30","reflect:8,dmgRed:4","str:8,crit2:4","stun",15,"Cọc Bạch Đằng: đòn đánh có 15% làm quái choáng 1 giây"],["dinh-bo-linh","Đinh Bộ Lĩnh","m","Cờ Lau","sword","Kiếm Hoa Lư","sword","Đoản kiếm Hoa Lư","Mũ Vạn Thắng","Long bào Đại Cồ Việt","Quần cờ lau","Bao tay Vạn Thắng","Hài Hoa Lư","Cờ lau tập trận","Ngựa Vạn Thắng","horse","cmd:3,hp:30","atkSpd:8,crit2:3","str:6,agi:6","execute",12,"Dẹp loạn 12 sứ quân: kết liễu quái thường còn dưới 12% máu"],["le-hoan","Lê Hoàn","m","Đại Hành","sword","Kiếm Thập đạo","shield","Khiên Chi Lăng","Mũ Thập đạo tướng quân","Giáp Lê Đại Hành","Quần trận Chi Lăng","Bao tay Đại Hành","Hài phá Tống","Cờ Đại Hành","Voi chiến Đại Hành","elephant","def:5,block:3","hp:60,dmgRed:4","str:6,trueDmg:8","shield",20,"Chi Lăng: mỗi 10 giây nhận lá chắn bằng 20% máu tối đa"],["ly-thuong-kiet","Lý Thường Kiệt","m","Như Nguyệt","sword","Kiếm Như Nguyệt","shield","Khiên sông Cầu","Mũ Thái úy","Giáp Như Nguyệt","Quần Thái úy","Bao tay Nam quốc","Hài sông Cầu","Cờ Nam quốc sơn hà","Chiến mã Ung Châu","horse","int:5,mp:20","cdr:6,crit2:3","str:6,dmgMax:8","wave",60,"Nam quốc sơn hà: mỗi đòn thứ 4 tung sóng chém 60% sát thương"],["tran-hung-dao","Trần Hưng Đạo","m","Hưng Đạo","sword","Kiếm Hưng Đạo Vương","shield","Khiên Vạn Kiếp","Mũ Quốc công","Giáp Hưng Đạo","Quần Vạn Kiếp","Bao tay Hịch tướng sĩ","Hài Bạch Đằng","Cờ Tiết chế","Chiến mã Vạn Kiếp","horse","cmd:4,hp:30","str:5,crit3:2","dmgRed:6,reflect:6","aura",30,"Hịch tướng sĩ: bản thân và lính đánh thuê +30% sát thương"],["tran-quoc-toan","Trần Quốc Toản","m","Phá Cường Địch","sword","Kiếm Hoài Văn Hầu","sword","Đoản kiếm Hoài Văn","Mũ Hoài Văn Hầu","Giáp thiếu niên","Quần Hoài Văn","Bao tay bóp cam","Hài thiếu niên","Cờ Phá cường địch","Ngựa Hoài Văn","horse","agi:5,atkSpd:5","crit2:4,moveSpd:4","str:6,perfDmg:3","cleave",40,"Phá cường địch: đòn thường lan 40% sát thương sang quái gần"],["nguyen-trai","Nguyễn Trãi","m","Bình Ngô","staff","Bút Bình Ngô","staff","Gậy trúc Côn Sơn","Khăn Ức Trai","Áo Côn Sơn","Quần Ức Trai","Bao tay Quân trung từ mệnh","Hài Côn Sơn","Áo choàng Bình Ngô","Ngựa mưu sĩ Lam Sơn","horse","int:6,mp:30","mpReg:3,cdr:6","int:8,crit2:3","manaShield",30,"Bình Ngô đại cáo: 30% sát thương nhận vào trừ vào mana"],["le-loi","Lê Lợi","m","Lam Sơn","sword","Kiếm Lam Sơn","shield","Khiên Lam Sơn","Mũ Bình Định Vương","Giáp Lam Sơn","Quần Lam Sơn","Bao tay Lũng Nhai","Hài Chí Linh","Cờ Bình Định","Voi chiến Lam Sơn","elephant","vit:5,hp:40","def:6,hpReg:2","str:6,crit2:3","lifesteal",8,"Hội thề Lũng Nhai: hút 8% sát thương gây ra thành máu"],["quang-trung","Quang Trung","m","Tây Sơn","sword","Kiếm Tây Sơn","sword","Đoản kiếm Đống Đa","Mũ Quang Trung","Áo bào Tây Sơn","Quần Ngọc Hồi","Bao tay Đống Đa","Hài thần tốc","Cờ đào Tây Sơn","Voi chiến Ngọc Hồi","elephant","moveSpd:6,atkSpd:5","str:6,crit2:4","crit3:3,dmgMax:10","haste",40,"Thần tốc: hạ quái tăng 40% tốc đánh và tốc chạy trong 4 giây"],["trung-trac","Trưng Trắc","f","Mê Linh","sword","Kiếm Mê Linh","shield","Khiên Hát Môn","Mũ Trưng Vương","Giáp Mê Linh","Váy trận Hát Môn","Bao tay Trưng Vương","Hài Mê Linh","Cờ Trưng Vương","Voi chiến Mê Linh","elephant","cmd:3,hp:30","str:5,def:5","crit2:4,dmgRed:5","burn",30,"Lửa Mê Linh: đòn đánh gây bỏng thêm 30% sát thương trong 3 giây"],["trung-nhi","Trưng Nhị","f","Hát Giang","sword","Kiếm Trưng Nhị","sword","Đoản kiếm Hát Giang","Mũ Trưng Nhị","Giáp Hát Giang","Váy trận Trưng Nhị","Bao tay Hát Giang","Hài Hát Giang","Cờ Hát Giang","Voi chiến Hát Giang","elephant","agi:5,dodge:3","atkSpd:6,crit2:3","str:6,dodge:4","counter",100,"Song kiếm: sau khi né, đòn kế tiếp gây gấp đôi"],["trieu-thi-trinh","Bà Triệu","f","Núi Nưa","sword","Gươm Núi Nưa","sword","Gươm Bồ Điền","Trâm Nhụy Kiều","Giáp vàng Nhụy Kiều","Váy trận Núi Nưa","Bao tay Bồ Điền","Guốc ngà Bà Triệu","Cờ Nhụy Kiều tướng quân","Voi một ngà","elephant","str:5,hp:30","crit2:4,atkSpd:5","str:7,dmgMax:8","wave",50,"Cưỡi gió đạp sóng: mỗi đòn thứ 4 tung sóng 50% sát thương"],["le-chan","Lê Chân","f","An Biên","sword","Kiếm An Biên","shield","Khiên Hải tần","Mũ nữ tướng An Biên","Giáp thủy quân","Váy trận An Biên","Bao tay chài lưới","Hài Hải Phòng","Cờ An Biên","Ngựa An Biên","horse","def:5,hp:30","block:4,dmgRed:4","vit:6,reflect:5","shield",18,"Thành An Biên: mỗi 10 giây nhận lá chắn bằng 18% máu tối đa"],["phung-thi-chinh","Phùng Thị Chính","f","Lãng Bạc","sword","Kiếm Lãng Bạc","shield","Khiên Phùng nữ tướng","Mũ Phùng nữ tướng","Giáp Lãng Bạc","Váy trận Lãng Bạc","Bao tay Lãng Bạc","Hài Lãng Bạc","Cờ nữ tướng Lãng Bạc","Ngựa Lãng Bạc","horse","vit:5,hpReg:1","hp:60,def:4","str:5,reflect:6","heal",2,"Trận Lãng Bạc: hồi 2% máu tối đa mỗi giây"],["vu-thi-thuc","Bát Nàn","f","Tiên La","sword","Kiếm Tiên La","shield","Khiên Bát Nàn","Mũ Bát Nàn công chúa","Giáp Tiên La","Váy trận Bát Nàn","Bao tay Tiên La","Hài Tiên La","Cờ Bát Nàn","Ngựa Tiên La","horse","str:4,hp:30","crit2:3,trueDmg:5","str:6,atkSpd:6","lifesteal",6,"Bát Nàn: hút 6% sát thương gây ra thành máu"],["duong-van-nga","Dương Vân Nga","f","Hoa Lư","staff","Trượng Thái hậu","staff","Gậy ngọc Hoa Lư","Mũ phượng Dương Vân Nga","Áo phượng Hoa Lư","Xiêm y Thái hậu","Bao tay ngọc Hoa Lư","Hài phượng","Áo choàng Thái hậu","Kiệu ngựa Hoa Lư","horse","int:5,mp:30","mpReg:2,cdr:5","int:7,hp:40","revive",50,"Trao áo long cổn: hồi sinh tại chỗ một lần mỗi 5 phút với 50% máu"],["y-lan","Ỷ Lan","f","Thổ Lỗi","staff","Trượng Nhiếp chính","shield","Khiên Thổ Lỗi","Mũ Nguyên phi","Áo Nguyên phi","Xiêm y Thổ Lỗi","Bao tay Nhiếp chính","Hài Thổ Lỗi","Áo choàng Ỷ Lan","Ngựa Thăng Long","horse","cmd:3,int:4","cdr:5,mp:30","int:6,dmgRed:5","aura",20,"Nhiếp chính: bản thân và lính đánh thuê +20% sát thương"],["bui-thi-xuan","Bùi Thị Xuân","f","Tây Sơn ngũ phụng","sword","Song kiếm Bùi Thị Xuân","sword","Đoản kiếm Tây Sơn","Mũ Đô đốc","Giáp Tây Sơn","Váy trận Tây Sơn","Bao tay luyện voi","Hài Tây Sơn","Cờ ngũ phụng","Voi chiến Bùi Thị Xuân","elephant","str:4,cmd:3","atkSpd:6,crit2:3","str:6,crit3:2","stun",12,"Thuần voi: đòn đánh có 12% làm quái choáng 1 giây"]],"do_than":[["id","ten","o","loai","cam","cong","thu","toc","thu_cuoi","mau","hieu_ung","gia_tri","mo_ta","gia"],["than-roi-sat","Roi sắt Thánh Gióng","hand","sword","one",40,0,0,"","#3c3f44","wave",80,"Mỗi đòn thứ 4 tung sóng lửa 80% sát thương",20000],["than-ngua-sat","Ngựa sắt Thánh Gióng","mount","mount","",0,10,190,"horse","#4a4d52","burn",40,"Ngựa phun lửa: đòn đánh gây bỏng thêm 40% sát thương",20000],["than-giap-sat","Giáp sắt Thánh Gióng","armor","armor","",0,40,0,"","#5a5e64","shield",30,"Mỗi 10 giây nhận lá chắn bằng 30% máu tối đa",20000],["than-no-kim-quy","Nỏ thần Kim Quy","hand","crossbow","two",60,0,0,"","#c9a24a","execute",20,"Kết liễu quái thường còn dưới 20% máu",20000],["than-kiem-thuan-thien","Kiếm Thuận Thiên","hand","sword","one",45,0,0,"","#9ff0d0","lifesteal",12,"Hút 12% sát thương gây ra thành máu",20000],["than-gay-chu-dong-tu","Gậy thần Chử Đồng Tử","hand","staff","one",38,0,0,"","#e6d28a","heal",3,"Hồi 3% máu tối đa mỗi giây",20000],["than-non-chu-dong-tu","Nón thần Chử Đồng Tử","hat","hat","",0,20,0,"","#f0dc90","revive",60,"Hồi sinh tại chỗ một lần mỗi 5 phút với 60% máu",20000],["than-canh-au-co","Cánh tiên Âu Cơ","wings","wings","",0,18,0,"","#ffd1ec","haste",50,"Hạ quái tăng 50% tốc đánh và tốc chạy trong 4 giây",20000],["than-khien-lac-long","Khiên vảy rồng Lạc Long Quân","hand","shield","one",0,35,0,"","#4fb3a8","stun",20,"Đòn đánh có 20% làm quái choáng 1 giây",20000],["than-giay-son-tinh","Giày mây Sơn Tinh","shoes","shoes","",0,16,0,"","#a8d08d","counter",150,"Sau khi né, đòn kế tiếp gây thêm 150%",20000],["than-gang-thuy-tinh","Bao tay sóng nước Thủy Tinh","gloves","gloves","",0,16,0,"","#5fb6ff","cleave",50,"Đòn thường lan 50% sát thương sang quái gần",20000]],"quai":[["id","ten","mau","sat_thuong","toc_do","toc_chay","ban_kinh","cao","tam_danh","tam_gan","hoi_chieu_ms","vung_tay_ms","dong","day_lui_phan_tram","boss","hoi_sinh_giay","dep_phan_van","hoan_hao_phan_van","huyen_thoai_phan_van","than_phan_van","hong_ngoc_it","hong_ngoc_nhieu","loai_sat_thuong","ti_le_x2","kinh_nghiem","ban_do","ky_nang"],["deer","Hươu",60,0,60,190,16,44,0,0,0,0,8,100,0,12,800,120,8,0,0,0,"thuong",0,8,null,null],["lion","Sư tử",150,11,70,165,18,40,240,50,1200,380,25,60,0,15,800,120,8,0,0,0,"thuong",5,20,null,null],["elephant","Voi rừng",420,20,45,95,28,72,0,72,1900,650,60,15,0,20,1000,150,10,0,0,0,"thuong",5,50,null,null],["croc","Cá sấu",190,15,35,150,20,20,150,58,1500,300,35,50,0,15,800,120,8,0,0,0,"thuong",5,25,null,null],["chua-son-lam","Chúa Sơn Lâm",2500,28,80,150,30,64,260,74,1400,500,300,10,1,120,6000,2500,400,0,3,10,"huyen_thoai",15,300,null,null],["ngu-tinh","Ngư Tinh",6000,40,40,110,40,80,280,120,2200,800,1000,5,2,300,8000,5000,1200,150,10,30,"than",20,800,null,null],["bo-cap","Bọ cạp cát",380,26,55,160,22,30,240,56,1300,400,60,40,0,18,1200,250,0,0,0,0,"thuong",8,45,null,null],["ken-ken","Kền kền",300,24,80,210,22,52,280,60,1100,350,55,50,0,18,1200,250,0,0,0,0,"thuong",8,40,null,null],["chan-tinh","Chằn Tinh",6500,60,45,120,44,86,280,110,2000,700,1500,8,1,240,7000,3500,0,0,5,15,"hoan_hao",15,900,null,null],["thach-tinh","Thạch Tinh",8000,64,40,105,46,112,260,104,2200,800,1700,5,1,260,7200,3600,0,0,6,16,"hoan_hao",15,1000,null,null],["soi-tuyet","Sói tuyết",420,30,90,220,20,38,300,54,1000,300,70,50,0,18,1300,280,0,0,0,0,"thuong",10,55,null,null],["gau-nui","Gấu ngựa",1050,45,45,130,28,60,220,70,1800,600,110,20,0,22,1500,300,0,0,0,0,"thuong",8,110,null,null],["ho-tinh","Hồ Tinh chín đuôi",7500,66,80,170,40,84,300,110,1600,600,1800,8,1,240,7500,3800,0,0,6,18,"hoan_hao",18,1200,null,null],["doi-quy","Dơi quỷ",450,34,95,230,20,56,260,52,1000,300,75,40,0,18,1400,300,0,0,0,0,"thuong",10,60,null,null],["nhen-doc","Nhện độc",1200,52,50,150,28,32,240,64,1600,500,120,25,0,22,1600,320,0,0,0,0,"thuong",10,130,null,null],["dai-bang","Đại Bàng Tinh",9000,75,70,190,46,100,320,120,1800,650,2200,6,1,240,8000,4000,0,0,8,20,"hoan_hao",20,1500,null,null],["khi-rung","Khỉ rừng",2000,90,70,190,24,50,260,56,1200,400,150,40,0,20,1500,350,0,0,0,0,"thuong",10,180,"rung-truc",""],["ran-ho","Rắn hổ mang",2800,110,55,160,28,60,240,64,1500,500,200,30,0,20,1500,350,0,0,0,0,"thuong",12,240,"rung-truc",""],["moc-tinh","Mộc Tinh",18000,150,50,130,48,110,300,120,2000,700,4000,5,1,300,7500,4000,0,0,8,20,"hoan_hao",15,2000,"rung-truc","slow"],["dia-khong-lo","Đỉa khổng lồ",4000,135,70,190,24,50,260,56,1200,400,270,40,0,20,1500,350,0,0,0,0,"thuong",10,360,"dam-lay",""],["ech-doc","Ếch độc",5600,165,55,160,28,60,240,64,1500,500,360,30,0,20,1500,350,0,0,0,0,"thuong",12,480,"dam-lay",""],["xa-tinh","Xà Tinh",36000,225,50,130,48,110,300,120,2000,700,7200,5,1,300,7500,4000,0,0,10,24,"hoan_hao",16,4000,"dam-lay","poison,slow"],["ung-tuyet","Ưng tuyết",8000,203,70,190,24,50,260,56,1200,400,486,40,0,20,1500,350,0,0,0,0,"thuong",10,720,"dinh-may",""],["de-nui","Dê núi",11200,248,55,160,28,60,240,64,1500,500,648,30,0,20,1500,350,0,0,0,0,"thuong",12,960,"dinh-may",""],["loi-dieu","Lôi Điểu",72000,338,50,130,48,110,300,120,2000,700,12960,5,1,300,7500,4000,0,0,12,28,"hoan_hao",17,8000,"dinh-may","stun,slow"],["am-binh","Âm binh",16000,304,70,190,24,50,260,56,1200,400,875,40,0,20,1500,350,0,0,0,0,"thuong",10,1440,"co-loa",""],["quy-doi","Quỷ đói",22400,371,55,160,28,60,240,64,1500,500,1166,30,0,20,1500,350,0,0,0,0,"thuong",12,1920,"co-loa",""],["tuong-am-binh","Tướng Âm Binh",144000,506,50,130,48,110,300,120,2000,700,23328,5,1,300,7500,4000,200,0,14,32,"hoan_hao",18,16000,"co-loa","armor,weak"],["cua-khong-lo","Cua khổng lồ",32000,456,70,190,24,50,260,56,1200,400,1575,40,0,20,1500,350,0,0,0,0,"thuong",10,2880,"bien-dong",""],["muc-ma","Mực ma",44800,557,55,160,28,60,240,64,1500,500,2100,30,0,20,1500,350,0,0,0,0,"thuong",12,3840,"bien-dong",""],["thuong-luong","Thuồng Luồng",288000,759,50,130,48,110,300,120,2000,700,41990,5,1,300,7500,4000,400,0,16,36,"hoan_hao",19,32000,"bien-dong","slow,poison"],["nham-thach-thu","Nham thạch thú",64000,683,70,190,24,50,260,56,1200,400,2834,40,0,20,1500,350,0,0,0,0,"thuong",10,5760,"nui-lua",""],["quy-lua","Quỷ lửa",89600,835,55,160,28,60,240,64,1500,500,3779,30,0,20,1500,350,0,0,0,0,"thuong",12,7680,"nui-lua",""],["hoa-long","Hỏa Long",576000,1139,50,130,48,110,300,120,2000,700,75583,5,1,300,7500,4000,600,50,18,40,"hoan_hao",20,64000,"nui-lua","bomb,weak"],["ma-troi","Ma trơi",128000,1025,70,190,24,50,260,56,1200,400,5102,40,0,20,1500,350,30,0,0,0,"thuong",10,11520,"rung-ma",""],["quy-cay","Quỷ cây",179200,1253,55,160,28,60,240,64,1500,500,6802,30,0,20,1500,350,30,0,0,0,"thuong",12,15360,"rung-ma",""],["chua-quy","Chúa Quỷ",1152000,1709,50,130,48,110,300,120,2000,700,136049,5,1,300,7500,4000,850,170,20,44,"huyen_thoai",21,128000,"rung-ma","weak,armor,poison"],["voi-ma-mut","Voi ma mút",256000,1538,70,190,24,50,260,56,1200,400,9183,40,0,20,1500,350,30,0,0,0,"thuong",10,23040,"bang-nguyen",""],["yeu-tuyet","Yêu tuyết",358400,1879,55,160,28,60,240,64,1500,500,12244,30,0,20,1500,350,30,0,0,0,"thuong",12,30720,"bang-nguyen",""],["bang-hoang","Băng Hoàng",2304000,2563,50,130,48,110,300,120,2000,700,244888,5,1,300,7500,4000,1100,290,22,48,"huyen_thoai",22,256000,"bang-nguyen","freeze,slow"],["phan-quan","Phản quân",512000,2307,70,190,24,50,260,56,1200,400,16530,40,0,20,1500,350,30,0,0,0,"thuong",10,46080,"thang-long",""],["hac-ky","Hắc kỵ",716800,2819,55,160,28,60,240,64,1500,500,22040,30,0,20,1500,350,30,0,0,0,"thuong",12,61440,"thang-long",""],["hac-long-tuong","Hắc Long Tướng",4608000,3844,50,130,48,110,300,120,2000,700,440798,5,1,300,7500,4000,1350,410,24,52,"huyen_thoai",23,512000,"thang-long","armor,stun,weak"],["thien-binh","Thiên binh",1024000,3460,70,190,24,50,260,56,1200,400,29754,40,0,20,1500,350,30,0,0,0,"thuong",10,92160,"cuu-trung",""],["ky-lan","Kỳ lân",1433600,4229,55,160,28,60,240,64,1500,500,39672,30,0,20,1500,350,30,0,0,0,"thuong",12,122880,"cuu-trung",""],["ma-vuong","Ma Vương",9216000,5767,50,130,48,110,300,120,2000,700,793437,5,1,300,7500,4000,1600,530,26,56,"huyen_thoai",24,1024000,"cuu-trung","freeze,weak,bomb,tubao"],["tom-tuong","Tôm tướng",2048000,5190,70,190,24,50,260,56,1200,400,53557,40,0,20,1500,500,40,0,1,2,"thuong",10,184320,"thuy-cung",""],["ca-kiem","Cá kiếm",2867200,6343,55,160,28,60,240,64,1500,500,71409,30,0,20,1500,500,40,0,1,2,"thuong",12,245760,"thuy-cung",""],["long-vuong","Long Vương Thủy Phủ",18432000,8650,50,130,48,110,300,120,2000,700,1428187,5,1,300,7500,4000,1725,590,28,60,"huyen_thoai",25,2048000,"thuy-cung","freeze,slow,poison"],["xuong-kho","Xương khô",3072000,6487,70,190,24,50,260,56,1200,400,80336,40,0,20,1500,500,50,0,1,3,"thuong",10,276480,"hoang-mac-xuong",""],["bo-cap-den","Bọ cạp đen",4300800,7929,55,160,28,60,240,64,1500,500,107114,30,0,20,1500,500,50,0,1,3,"thuong",12,368640,"hoang-mac-xuong",""],["hac-mo-vuong","Hắc Mộ Vương",27648000,10812,50,130,48,110,300,120,2000,700,2142280,5,1,300,7500,4000,1850,650,30,64,"huyen_thoai",26,3072000,"hoang-mac-xuong","armor,weak,bomb"],["tien-hac","Tiên hạc",4608000,8109,70,190,24,50,260,56,1200,400,120503,40,0,20,1500,500,60,0,1,3,"thuong",10,414720,"thien-son",""],["tuyet-vien","Tuyết viên",6451200,9911,55,160,28,60,240,64,1500,500,160671,30,0,20,1500,500,60,0,1,3,"thuong",12,552960,"thien-son",""],["phong-vuong","Phong Vương",41472000,13515,50,130,48,110,300,120,2000,700,3213421,5,1,300,7500,4000,1975,710,32,68,"huyen_thoai",27,4608000,"thien-son","stun,slow,weak"],["tho-phi","Thổ phỉ",6912000,10136,70,190,24,50,260,56,1200,400,180755,40,0,20,1500,500,70,5,1,4,"hoan_hao",10,622080,"hoa-lu",""],["ngao-den","Ngao đen",9676800,12389,55,160,28,60,240,64,1500,500,241007,30,0,20,1500,500,70,5,1,4,"hoan_hao",12,829440,"hoa-lu",""],["su-quan","Sứ Quân Phản Loạn",62208000,16894,50,130,48,110,300,120,2000,700,4820131,5,1,300,7500,4000,2100,770,34,72,"than",28,6912000,"hoa-lu","armor,stun,weak,bomb"],["nguu-dau","Ngưu Đầu",10368000,12671,70,190,24,50,260,56,1200,400,271132,40,0,20,1500,500,80,10,1,4,"hoan_hao",10,933120,"dia-nguc-mon","weak"],["ma-dien","Mã Diện",14515200,15486,55,160,28,60,240,64,1500,500,361510,30,0,20,1500,500,80,10,1,4,"hoan_hao",12,1244160,"dia-nguc-mon","weak"],["diem-la-tuong","Diêm La Tướng",93312000,21118,50,130,48,110,300,120,2000,700,7230196,5,1,300,7500,4000,2225,830,36,76,"than",29,10368000,"dia-nguc-mon","weak,armor,poison,bomb,tubao"],["giao-long","Giao long",15552000,15838,70,190,24,50,260,56,1200,400,406699,40,0,20,1500,500,90,15,1,5,"hoan_hao",10,1399680,"dao-rong","armor"],["hai-quy","Hải quỷ",21772800,19358,55,160,28,60,240,64,1500,500,542265,30,0,20,1500,500,90,15,1,5,"hoan_hao",12,1866240,"dao-rong","armor"],["hai-long-vuong","Hải Long Vương",139968000,26397,50,130,48,110,300,120,2000,700,10845294,5,1,300,7500,4000,2350,890,38,80,"than",30,15552000,"dao-rong","freeze,slow,poison,bomb"],["ho-ly","Hồ ly",23328000,19798,70,190,24,50,260,56,1200,400,610048,40,0,20,1500,500,100,20,1,5,"hoan_hao",10,2099520,"vuc-yeu-tinh","slow"],["yeu-tang","Yêu tăng",32659200,24197,55,160,28,60,240,64,1500,500,813397,30,0,20,1500,500,100,20,1,5,"hoan_hao",12,2799360,"vuc-yeu-tinh","slow"],["cuu-vi-ho","Cửu Vĩ Hồ",209952000,32996,50,130,48,110,300,120,2000,700,16267941,5,1,300,7500,4000,2475,950,40,84,"than",31,23328000,"vuc-yeu-tinh","weak,freeze,poison,stun"],["tho-ngoc","Thỏ ngọc chiến binh",34992000,24747,70,190,24,50,260,56,1200,400,915072,40,0,20,1500,500,110,25,1,6,"hoan_hao",10,3149280,"cung-trang","poison"],["nguyet-binh","Nguyệt binh",48988800,30247,55,160,28,60,240,64,1500,500,1220096,30,0,20,1500,500,110,25,1,6,"hoan_hao",12,4199040,"cung-trang","poison"],["nguyet-than","Nguyệt Thần",314928000,41245,50,130,48,110,300,120,2000,700,24401912,5,1,300,7500,4000,2600,1010,42,88,"than",32,34992000,"cung-trang","freeze,stun,weak,slow"],["ngu-lam-phan","Ngự lâm phản loạn",52488000,30934,70,190,24,50,260,56,1200,400,1372608,40,0,20,1500,500,120,30,1,6,"hoan_hao",10,4723920,"phu-xuan","slow"],["chien-tuong","Chiến tượng",73483200,37808,55,160,28,60,240,64,1500,500,1830143,30,0,20,1500,500,120,30,1,6,"hoan_hao",12,6298560,"phu-xuan","slow"],["hac-de","Hắc Đế",472392000,51557,50,130,48,110,300,120,2000,700,36602868,5,2,300,7500,4000,2725,1070,44,92,"than",33,52488000,"phu-xuan","armor,stun,weak,bomb,tubao"],["thien-tuong","Thiên tướng",78732000,38667,70,190,24,50,260,56,1200,400,2058911,40,0,20,1500,500,120,30,1,7,"hoan_hao",10,7085880,"thien-dinh","poison"],["than-thu","Thần thú",110224800,47260,55,160,28,60,240,64,1500,500,2745215,30,0,20,1500,500,120,30,1,7,"hoan_hao",12,9447840,"thien-dinh","poison"],["hac-thien-ma","Hắc Thiên Ma",708588000,64446,50,130,48,110,300,120,2000,700,54904302,5,2,300,7500,4000,2850,1130,46,96,"than",34,78732000,"thien-dinh","freeze,weak,armor,bomb,tubao"]],"nhiem_vu":[["id","ten","mo_ta","muc_tieu","so_luong","thuong_dong","thuong_hong_ngoc","thuong_do","pham_chat_do","lap_lai","thuong_kinh_nghiem"],["q-huou","Săn hươu","Dân làng cần thịt hươu cho hội làng.","deer",5,200,0,"","","khong",20],["q-su-tu","Trừ sư tử","Sư tử bên Đông Ngạn hay vồ người đi rừng.","lion",3,500,0,"","","khong",50],["q-ca-sau","Diệt cá sấu","Cá sấu rình ở bến sông, dân không dám lấy nước.","croc",3,500,0,"","","khong",50],["q-voi","Đuổi voi rừng","Voi rừng phá nương rẫy phía đông.","elephant",2,800,0,"","","khong",80],["q-chua-son-lam","Hạ Chúa Sơn Lâm","Con hổ chúa ở rừng đông bắc đã giết nhiều thợ săn.","chua-son-lam",1,10000,0,"","","khong",1000],["q-ngu-tinh","Trừ Ngư Tinh","Ngư Tinh nổi lên ở đầm phía đông nam, dâng nước hại dân.","ngu-tinh",1,30000,0,"","","khong",3000],["q-bo-cap","Bọ cạp sa mạc","Lái buôn qua sa mạc phía bắc rừng Đông Ngạn bị bọ cạp cát đốt.","bo-cap",5,2000,0,"","","khong",200],["q-chan-tinh","Diệt Chằn Tinh","Chằn Tinh cuộn mình trong tháp cổ giữa sa mạc, đòi người nộp mạng.","chan-tinh",1,20000,0,"","","khong",2000],["q-thach-tinh","Phá Thạch Tinh","Thạch Tinh thức dậy ở góc tây nam sa mạc, đá lăn chặn đường lái buôn.","thach-tinh",1,22000,0,"","","khong",2200],["q-soi-tuyet","Đàn sói tuyết","Sói tuyết từ núi phía tây làng xuống bắt gia súc.","soi-tuyet",5,2500,0,"","","khong",250],["q-ho-tinh","Trừ Hồ Tinh","Hồ Tinh chín đuôi ẩn trên đỉnh núi tuyết, mê hoặc người lên núi.","ho-tinh",1,25000,0,"","","khong",2500],["q-nhen-doc","Ổ nhện độc","Nhện độc giăng tơ kín hang động phía nam rừng Đông Ngạn.","nhen-doc",3,3000,0,"","","khong",300],["q-dai-bang","Hạ Đại Bàng Tinh","Đại Bàng Tinh làm tổ trong hang đá thạch nhũ, bắt người về hang.","dai-bang",1,30000,0,"","","khong",3000],["q-khi-rung","Săn khỉ rừng","Khỉ rừng quấy phá vùng Rừng Trúc, dân không dám qua lại.","khi-rung",6,4000,0,"","","khong",400],["q-moc-tinh","Hạ Mộc Tinh","Mộc Tinh ngự trị Rừng Trúc. Hạ được nó, cả vùng yên ổn.","moc-tinh",1,40000,5,"","","khong",4000],["q-dia-khong-lo","Săn đỉa khổng lồ","Đỉa khổng lồ quấy phá vùng Đầm Lầy, dân không dám qua lại.","dia-khong-lo",6,7200,0,"","","khong",800],["q-xa-tinh","Hạ Xà Tinh","Xà Tinh ngự trị Đầm Lầy. Hạ được nó, cả vùng yên ổn.","xa-tinh",1,72000,7,"","","khong",8000],["q-ung-tuyet","Săn ưng tuyết","Ưng tuyết quấy phá vùng Đỉnh Mây, dân không dám qua lại.","ung-tuyet",6,12960,0,"","","khong",1600],["q-loi-dieu","Hạ Lôi Điểu","Lôi Điểu ngự trị Đỉnh Mây. Hạ được nó, cả vùng yên ổn.","loi-dieu",1,129600,9,"","","khong",16000],["q-am-binh","Săn âm binh","Âm binh quấy phá vùng Thành Cổ Loa, dân không dám qua lại.","am-binh",6,23328,0,"","","khong",3200],["q-tuong-am-binh","Hạ Tướng Âm Binh","Tướng Âm Binh ngự trị Thành Cổ Loa. Hạ được nó, cả vùng yên ổn.","tuong-am-binh",1,233280,11,"","","khong",32000],["q-cua-khong-lo","Săn cua khổng lồ","Cua khổng lồ quấy phá vùng Bãi Biển Hoang, dân không dám qua lại.","cua-khong-lo",6,41990,0,"","","khong",6400],["q-thuong-luong","Hạ Thuồng Luồng","Thuồng Luồng ngự trị Bãi Biển Hoang. Hạ được nó, cả vùng yên ổn.","thuong-luong",1,419904,13,"","","khong",64000],["q-nham-thach-thu","Săn nham thạch thú","Nham thạch thú quấy phá vùng Núi Lửa, dân không dám qua lại.","nham-thach-thu",6,75583,0,"","","khong",12800],["q-hoa-long","Hạ Hỏa Long","Hỏa Long ngự trị Núi Lửa. Hạ được nó, cả vùng yên ổn.","hoa-long",1,755827,15,"","","khong",128000],["q-ma-troi","Săn ma trơi","Ma trơi quấy phá vùng Rừng Ma, dân không dám qua lại.","ma-troi",6,136049,0,"","","khong",25600],["q-chua-quy","Hạ Chúa Quỷ","Chúa Quỷ ngự trị Rừng Ma. Hạ được nó, cả vùng yên ổn.","chua-quy",1,1360489,17,"","","khong",256000],["q-voi-ma-mut","Săn voi ma mút","Voi ma mút quấy phá vùng Băng Nguyên, dân không dám qua lại.","voi-ma-mut",6,244888,0,"","","khong",51200],["q-bang-hoang","Hạ Băng Hoàng","Băng Hoàng ngự trị Băng Nguyên. Hạ được nó, cả vùng yên ổn.","bang-hoang",1,2448880,19,"","","khong",512000],["q-phan-quan","Săn phản quân","Phản quân quấy phá vùng Kinh Thành Thăng Long, dân không dám qua lại.","phan-quan",6,440798,0,"","","khong",102400],["q-hac-long-tuong","Hạ Hắc Long Tướng","Hắc Long Tướng ngự trị Kinh Thành Thăng Long. Hạ được nó, cả vùng yên ổn.","hac-long-tuong",1,4407984,21,"","","khong",1024000],["q-thien-binh","Săn thiên binh","Thiên binh quấy phá vùng Cửu Trùng Đài, dân không dám qua lại.","thien-binh",6,793437,0,"","","khong",204800],["q-ma-vuong","Hạ Ma Vương","Ma Vương ngự trị Cửu Trùng Đài. Hạ được nó, cả vùng yên ổn.","ma-vuong",1,7934372,23,"","","khong",2048000],["q-tom-tuong","Săn tôm tướng","Tôm tướng quấy phá vùng Thủy Cung, dân không dám qua lại.","tom-tuong",6,1428187,0,"","","khong",409600],["q-long-vuong","Hạ Long Vương Thủy Phủ","Long Vương Thủy Phủ ngự trị Thủy Cung. Hạ được nó, cả vùng yên ổn.","long-vuong",1,14281869,25,"","","khong",4096000],["q-xuong-kho","Săn xương khô","Xương khô quấy phá vùng Hoang Mạc Xương, dân không dám qua lại.","xuong-kho",6,2142280,0,"","","khong",614400],["q-hac-mo-vuong","Hạ Hắc Mộ Vương","Hắc Mộ Vương ngự trị Hoang Mạc Xương. Hạ được nó, cả vùng yên ổn.","hac-mo-vuong",1,21422803,27,"","","khong",6144000],["q-tien-hac","Săn tiên hạc","Tiên hạc quấy phá vùng Thiên Sơn, dân không dám qua lại.","tien-hac",6,3213421,0,"","","khong",921600],["q-phong-vuong","Hạ Phong Vương","Phong Vương ngự trị Thiên Sơn. Hạ được nó, cả vùng yên ổn.","phong-vuong",1,32134205,29,"","","khong",9216000],["q-tho-phi","Săn thổ phỉ","Thổ phỉ quấy phá vùng Cố Đô Hoa Lư, dân không dám qua lại.","tho-phi",6,4820131,0,"","","khong",1382400],["q-su-quan","Hạ Sứ Quân Phản Loạn","Sứ Quân Phản Loạn ngự trị Cố Đô Hoa Lư. Hạ được nó, cả vùng yên ổn.","su-quan",1,48201308,31,"","","khong",13824000],["q-nguu-dau","Săn ngưu đầu","Ngưu Đầu quấy phá vùng Địa Ngục Môn, dân không dám qua lại.","nguu-dau",6,7230196,0,"","","khong",2073600],["q-diem-la-tuong","Hạ Diêm La Tướng","Diêm La Tướng ngự trị Địa Ngục Môn. Hạ được nó, cả vùng yên ổn.","diem-la-tuong",1,72301961,33,"","","khong",20736000],["q-giao-long","Săn giao long","Giao long quấy phá vùng Đảo Rồng, dân không dám qua lại.","giao-long",6,10845294,0,"","","khong",3110400],["q-hai-long-vuong","Hạ Hải Long Vương","Hải Long Vương ngự trị Đảo Rồng. Hạ được nó, cả vùng yên ổn.","hai-long-vuong",1,108452942,35,"","","khong",31104000],["q-ho-ly","Săn hồ ly","Hồ ly quấy phá vùng Vực Yêu Tinh, dân không dám qua lại.","ho-ly",6,16267941,0,"","","khong",4665600],["q-cuu-vi-ho","Hạ Cửu Vĩ Hồ","Cửu Vĩ Hồ ngự trị Vực Yêu Tinh. Hạ được nó, cả vùng yên ổn.","cuu-vi-ho",1,162679413,37,"","","khong",46656000],["q-tho-ngoc","Săn thỏ ngọc chiến binh","Thỏ ngọc chiến binh quấy phá vùng Cung Trăng, dân không dám qua lại.","tho-ngoc",6,24401912,0,"","","khong",6998400],["q-nguyet-than","Hạ Nguyệt Thần","Nguyệt Thần ngự trị Cung Trăng. Hạ được nó, cả vùng yên ổn.","nguyet-than",1,244019120,39,"","","khong",69984000],["q-ngu-lam-phan","Săn ngự lâm phản loạn","Ngự lâm phản loạn quấy phá vùng Kinh Thành Phú Xuân, dân không dám qua lại.","ngu-lam-phan",6,36602868,0,"","","khong",10497600],["q-hac-de","Hạ Hắc Đế","Hắc Đế ngự trị Kinh Thành Phú Xuân. Hạ được nó, cả vùng yên ổn.","hac-de",1,366028679,41,"","","khong",104976000],["q-thien-tuong","Săn thiên tướng","Thiên tướng quấy phá vùng Thiên Đình, dân không dám qua lại.","thien-tuong",6,54904302,0,"","","khong",15746400],["q-hac-thien-ma","Hạ Hắc Thiên Ma","Hắc Thiên Ma ngự trị Thiên Đình. Hạ được nó, cả vùng yên ổn.","hac-thien-ma",1,549043019,43,"","","khong",157464000]],"ban_do":[["id","ten","cap","bieu_tuong","thu_tu"],["thanh-moc","Làng Thanh Mộc",1,"home",1],["hang-dong","Hang động",5,"light",2],["sa-mac","Sa mạc",10,"flame",3],["nui-tuyet","Núi tuyết",15,"ice",4],["rung-truc","Rừng Trúc",20,"wood",5],["dam-lay","Đầm Lầy",28,"water",6],["dinh-may","Đỉnh Mây",36,"wind",7],["co-loa","Thành Cổ Loa",44,"shield",8],["bien-dong","Bãi Biển Hoang",52,"water",9],["nui-lua","Núi Lửa",60,"flame",10],["rung-ma","Rừng Ma",70,"demon",11],["bang-nguyen","Băng Nguyên",80,"ice",12],["thang-long","Kinh Thành Thăng Long",90,"flag",13],["cuu-trung","Cửu Trùng Đài",100,"spark",14],["thuy-cung","Thủy Cung",105,"water",15],["hoang-mac-xuong","Hoang Mạc Xương",110,"earth",16],["thien-son","Thiên Sơn",115,"ice",17],["hoa-lu","Cố Đô Hoa Lư",120,"shield",18],["dia-nguc-mon","Địa Ngục Môn",125,"flame",19],["dao-rong","Đảo Rồng",130,"demon",20],["vuc-yeu-tinh","Vực Yêu Tinh",135,"demon",21],["cung-trang","Cung Trăng",140,"light",22],["phu-xuan","Kinh Thành Phú Xuân",145,"flag",23],["thien-dinh","Thiên Đình",150,"light",24]],"linh":[["id","ten","gioi_tinh","gia","menh_lenh","suc_manh","nhanh_nhen","suc_khoe","tri_tue","trang_bi","mo_ta"],["dan-binh","Dân binh","m",100,5,12,8,12,4,"spear,hat","Lính giáo rẻ, máu trâu"],["cung-thu","Nữ cung thủ","f",300,5,10,14,8,6,"bow,shoes","Bắn từ xa"],["vo-si","Võ sĩ","m",600,8,16,10,14,4,"sword,shield,armor","Kiếm khiên, chịu đòn tốt"],["dao-si","Đạo sĩ trẻ","m",800,6,6,8,10,20,"staff-jade,hat","Bắn cầu phép"],["nu-tuong","Nữ tướng","f",1200,10,18,14,14,6,"sword-iron,sword-iron,armor-leather","Song kiếm, đánh nhanh"]]});

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
  const BEASTS={horse:{seat:24,skill:'Đá hậu',icon:'mount',cmd:5},tiger:{seat:28,skill:'Vồ mồi',icon:'tiger',cmd:10},elephant:{seat:46,skill:'Dày xéo',icon:'elephant',cmd:15},
    kylan:{seat:26,skill:'Lân hỏa',icon:'spark',cmd:12},rong:{seat:40,skill:'Long tức',icon:'demon',cmd:20}}; // v10.3: kỳ lân (lửa quanh mình), rồng (phun lửa phía trước)
  const GROUPS=[['str','Sức mạnh','punch'],['agi','Nhanh nhẹn','feather'],['vit','Sức khỏe','heart'],['int','Trí tuệ','spark'],['cmd','Mệnh lệnh','flag']];
  const FX_NAMES={stun:'Choáng',execute:'Kết liễu',shield:'Lá chắn',wave:'Sóng chém',aura:'Hào khí',cleave:'Chém lan',manaShield:'Khiên mana',lifesteal:'Hút máu',haste:'Thần tốc',burn:'Thiêu đốt',counter:'Phản công',heal:'Hồi phục',revive:'Hồi sinh',
    frost:'Băng giá',venom:'Độc',rage:'Cuồng nộ',luck:'May mắn',expUp:'Tinh thông',coinUp:'Phú quý'}; // v10.3: hiệu ứng đồ thành trì
  const SLOT_OF={vu_khi:'right',tay_trai:'left',mu:'hat',ao:'armor',quan:'pants',gang:'gloves',giay:'shoes',canh:'wings',thu_cuoi:'mount'};
  const PAIRS=new Set(['sword|sword','shield|shield','staff|staff','shield|staff','shield|sword']);
  const ALIAS={'book-ice':'book-water','book-wind':'book-metal','book-thunder':'book-earth'};
  const skills={normal:{cost:0,cooldown:450},basic:{cost:10,cooldown:3000},intermediate:{cost:18,cooldown:6000},advanced:{cost:28,cooldown:10000},mount:{cost:12,cooldown:6000}};
  // Bảng sinh từ dữ liệu (Sheet)
  const CFG={},RAR={},ADD={},items={},SHOPS={},SETS={},MON={},QUESTS={},MERCS={},ENH=[],WEAPONS={},REGIONS=[],AVATARS={},TOPUPS=[];
  // Kỹ năng trùm (cột ky_nang ở tab quai, cách nhau dấu phẩy): tên hiện, màu, thời gian hiệu ứng (giây)
  const SKILLS={slow:{name:'Trì trệ',desc:'giảm tốc đánh 40%',color:'#c8b060',dur:6},freeze:{name:'Đóng băng',desc:'đứng yên',color:'#80d8ff',dur:1.6},stun:{name:'Sét giật',desc:'choáng',color:'#ffe060',dur:1.4},
    weak:{name:'Suy nhược',desc:'giảm sát thương 40%',color:'#c060ff',dur:6},armor:{name:'Phá giáp',desc:'giảm phòng ngự 50%',color:'#ff9040',dur:6},poison:{name:'Trúng độc',desc:'mất máu dần',color:'#80e060',dur:5},
    bomb:{name:'Nổ',desc:'nổ tại chỗ đứng, sát thương lớn',color:'#ff5030',dur:0},tubao:{name:'Tự bạo',desc:'khi yếu, trùm nổ tung',color:'#ff2020',dur:0}};
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
      if(slot==='wings'&&/^canh-/.test(r.id))d.wing=true; // cánh dung hợp (không mua, không rơi)
      if(r.pham_chat&&RAR[r.pham_chat]&&r.pham_chat!=='n')d.q=r.pham_chat; // phẩm chất cố định (hàng hiệu buôn thành trì)
      if(r.hieu_ung){d.fx=r.hieu_ung;d.fxv=num(r.gia_tri);d.fxText=r.mo_ta||'';}
      items[r.id]=d;
    }
    for(const r of data.cua_hang||[]){(SHOPS[r.cua_hang]=SHOPS[r.cua_hang]||[]).push({id:r.id,q:String(r.pham_chat||'n').split(',').map(x=>x.trim()).filter(q=>RAR[q]||q==='n'),price:num(r.gia),order:num(r.thu_tu),t:num(r.bac)});}
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
    for(const r of data.quai||[])MON[r.id]={name:r.ten,hp:num(r.mau),dmg:num(r.sat_thuong),speed:num(r.toc_do),run:num(r.toc_chay),r:num(r.ban_kinh),h:num(r.cao),aggro:num(r.tam_danh),range:num(r.tam_gan),cd:num(r.hoi_chieu_ms)/1000,windup:num(r.vung_tay_ms)/1000,copper:num(r.dong),knock:num(r.day_lui_phan_tram)/100,boss:num(r.boss),respawn:num(r.hoi_sinh_giay,15),drops:{g:num(r.dep_phan_van)/1e4,p:num(r.hoan_hao_phan_van)/1e4,l:num(r.huyen_thoai_phan_van)/1e4,m:num(r.than_phan_van)/1e4},rubies:[num(r.hong_ngoc_it),num(r.hong_ngoc_nhieu)],dtype:r.loai_sat_thuong||'thuong',crit:num(r.ti_le_x2),exp:num(r.kinh_nghiem,Math.max(1,Math.round(num(r.mau)/8))),map:String(r.ban_do||'').trim()||undefined,skills:String(r.ky_nang||'').split(/[,\s]+/).filter(k=>SKILLS[k])};
    for(const r of data.nhiem_vu||[])QUESTS[r.id]={id:r.id,name:r.ten,desc:r.mo_ta,target:r.muc_tieu,count:num(r.so_luong,1),copper:num(r.thuong_dong),rubies:num(r.thuong_hong_ngoc),item:r.thuong_do||'',itemQ:r.pham_chat_do||'n',repeat:r.lap_lai!=='khong',lv:num(r.cap_toi_thieu),exp:num(r.thuong_kinh_nghiem,Math.round(num(r.thuong_dong)/10))};
    REGIONS.length=0;for(const r of data.ban_do||[])REGIONS.push({id:String(r.id),name:r.ten,lv:num(r.cap,1),icon:r.bieu_tuong||'pin',order:num(r.thu_tu,99)});REGIONS.sort((a,b)=>a.order-b.order);
    TOPUPS.length=0;for(const r of data.goi_nap||[])TOPUPS.push({id:r.id,name:r.ten,vnd:num(r.tien),ruby:num(r.hong_ngoc),desc:r.mo_ta||'',order:num(r.thu_tu,99)});TOPUPS.sort((a,b)=>a.order-b.order);
    clear(AVATARS);for(const r of data.dien_mao||[])AVATARS[r.id]={id:r.id,name:r.ten,gender:r.gioi_tinh||'',price:num(r.gia),ruby:num(r.hong_ngoc),skin:r.mau_da||'#e1c295',hair:r.mau_toc||'#2a2622',style:r.kieu_toc||'',beard:r.rau||'',eye:r.mau_mat||'#2a2018',mark:r.dau||'',order:num(r.thu_tu,99)};
    for(const r of data.linh||[])MERCS[r.id]={id:r.id,name:r.ten,gender:r.gioi_tinh==='f'?'f':'m',price:num(r.gia),cmd:num(r.menh_lenh,5),stats:{strength:num(r.suc_manh),agility:num(r.nhanh_nhen),vitality:num(r.suc_khoe),intelligence:num(r.tri_tue),command:0},gear:String(r.trang_bi||'').split(',').map(x=>x.trim()).filter(Boolean),desc:r.mo_ta};
  }
  const info=i=>i&&items[i.type];
  const kind=i=>info(i)?info(i).kind:null;
  const qOf=i=>{const d=info(i);return d?(d.q||i.q||'n'):'n';};
  const rar=i=>RAR[qOf(i)]||RAR.n||{name:'Thường',color:'#e8e6df',mul:1,lines:0,tier:0};
  const isTwo=i=>!!info(i)&&info(i).grip==='two';
  const pairOk=(a,b)=>PAIRS.has([a,b].sort().join('|'));
  const nameOf=i=>info(i)?info(i).name+(i.lv?' +'+i.lv:'')+(i.t?' · cấp '+i.t:''):'';
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
    const lv=i.lv||0,g=gainOf(d),m=rar(i).mul*tierBase(i.t);
    if(d.slot==='mount'){const G=mountGain(lv);return {atk:Math.round((d.atk||0)*m)+G.atk,def:Math.round((d.def||0)*m)+G.def,speed:r2(d.speed+G.speed),hp:G.hp,mp:G.mp};}
    return {atk:Math.round((d.atk||0)*m)+(g.atk||0)*lv,def:Math.round((d.def||0)*m)+(g.def||0)*lv,speed:d.speed?r2(d.speed+(g.speed||0)*lv):0,hp:0,mp:0};
  }
  const rnd36=rng=>(Math.floor(rng()*4294967296)>>>0).toString(36);
  const uid=(t,rng=Math.random)=>'it-'+String(t).replace(/[^a-z0-9]/gi,'').slice(0,12)+'-'+rnd36(rng)+rnd36(rng);
  // Chuỗi ngẫu nhiên dùng chung giữa máy người chơi và máy chủ (mulberry32, trạng thái s.rs do máy chủ giữ):
  // máy người chơi tính trước kết quả mua/gia cường/nhiệm vụ để hiện ngay, máy chủ tính lại y hệt rồi lưu
  function seqRng(s){return ()=>{let t=(s.rs=(s.rs+0x6D2B79F5)|0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  // Sinh món đồ với phẩm chất + dòng thuộc tính ngẫu nhiên
  const ARMOR_SLOTS=['hat','armor','pants','gloves','shoes','wings'];
  const ARMOR_LINES={n:[1,1],g:[1,2],p:[2,3],l:[3,4],m:[3,4]};
  const armorPool=()=>String(CFG.dong_do_mac||'def,hp,dodge,reflect,hpReg,mp').split(/[,;\s]+/).filter(k=>ADD[k]);
  // t: bậc đồ = cấp vùng rơi ra (từ 20): chỉ số gốc ×(1+t/25), dòng cộng thêm ×(1+t/20); nameOf hiện "· cấp t"
  const tierBase=t=>1+(t||0)/25,tierAdd=t=>1+(t||0)/20;
  function roll(type,q='n',rng=Math.random,t=0){
    const d=items[type];if(!d)throw Error('ITEM');
    const it={uid:uid(type,rng),type};if(!d.q&&q!=='n')it.q=q;if(t>=20)it.t=Math.floor(t);
    const R=RAR[d.q||q]||{lines:0,tier:0};
    // Đồ mặc (mũ, áo, quần, găng, giày, cánh): dòng ngẫu nhiên lấy trong nhóm phòng thủ / sinh lực (Sheet cau_hinh dong_do_mac),
    // số dòng theo phẩm chất: Thường 1 · Đẹp 1–2 · Hoàn hảo 2–3 · Huyền thoại, Thần 3–4 (ngoài hiệu ứng bộ). Mỗi chỉ số chỉ một dòng.
    // Vũ khí, thú cưỡi: giữ như cũ (số dòng = so_dong của phẩm chất, lấy trong mọi chỉ số).
    const tier=R.tier||0,wear=ARMOR_SLOTS.includes(d.slot);
    if(d.wing)return it; // cánh dung hợp: dòng do fuse() đặt
    if(d.slot&&d.slot!=='book'&&(R.lines||wear)){
      const pool=wear?armorPool():Object.keys(ADD),keys=pool.filter(k=>ADD[k]&&ADD[k].ranges[Math.max(1,tier)]);it.add={};
      const [lo,hi]=wear?(ARMOR_LINES[d.q||q]||[1,1]):[R.lines,R.lines],cnt=lo+Math.floor(rng()*(hi-lo+1));
      for(let n=0;n<cnt&&keys.length;n++){const k=keys.splice(Math.floor(rng()*keys.length),1)[0];let [a,b]=ADD[k].ranges[Math.max(1,tier)];if(!tier)b=Math.max(a,Math.ceil((a+b)/2)-1);it.add[k]=Math.round((a+Math.floor(rng()*(b-a+1)))*tierAdd(it.t));}
      if(!Object.keys(it.add).length)delete it.add;
    }
    return it;
  }
  const BASE_DROP=()=>Object.keys(items).filter(k=>{const d=items[k];return !d.q&&d.slot&&d.slot!=='book'&&d.slot!=='mount'&&!d.wing;});
  const dropCap=()=>{const q=String(CFG.pham_chat_roi_toi_da||'').trim();return RAR[q]?RAR[q].tier:99;};
  function rollDrop(monId,rng=Math.random,luck=1){
    const M=MON[monId];if(!M)return {items:[],rubies:0};
    const lvl=regionLv(regionOf(monId)),tier=lvl>=20?lvl:0,out=[],tries=M.boss===2?3:M.boss?2:1,cap=Math.max(dropCap(),lvl>=60?4:lvl>=44?3:0),R=q=>RAR[q]?RAR[q].tier<=cap:true;
    // phẩm chất rơi cao nhất của bản đồ (cau_hinh: pham_chat_roi_toi_da); phẩm chất vượt mức thì không rơi
    const dm=(R('m')?M.drops.m:0)*luck,dl=(R('l')?M.drops.l:0)*luck,dp=(R('p')?M.drops.p:0)*luck,dg=(R('g')?M.drops.g:0)*luck; // luck: hiệu ứng May mắn (×)
    for(let k=0;k<tries;k++){
      const x=rng();let acc=0;
      if(x<(acc+=dm)){const pool=Object.keys(items).filter(k=>items[k].myth);if(pool.length)out.push(roll(pool[Math.floor(rng()*pool.length)],'m',rng,tier));}
      else if(x<(acc+=dl)){const pool=Object.keys(items).filter(k=>items[k].set);if(pool.length)out.push(roll(pool[Math.floor(rng()*pool.length)],'l',rng,tier));}
      else if(x<(acc+=dp)){const pool=BASE_DROP();out.push(roll(pool[Math.floor(rng()*pool.length)],'p',rng,tier));}
      else if(x<(acc+=dg)){const pool=BASE_DROP();out.push(roll(pool[Math.floor(rng()*pool.length)],'g',rng,tier));}
    }
    const [a,b]=M.rubies;return {items:out,rubies:b>0?a+Math.floor(rng()*(b-a+1)):0};
  }
  // Gia cường
  const enhRate=lv=>lv>=MAX_LV?0:(ENH[lv]?ENH[lv].rate:0);
  const enhCost=lv=>ENH[lv]?ENH[lv].cost:lv+1;
  function enhFail(lv,rng){const f=ENH[lv]?ENH[lv].fail:null;if(!f)return lv;const [a,b]=f;return a+Math.floor(rng()*(b-a+1));}
  // Mỗi NPC gia cường loại đồ của mình: thợ rèn (vũ khí, giáp), người nuôi thú (thú cưỡi), đạo sĩ (sách)
  const SHOP_ENH={smith:d=>d.slot!=='book'&&d.slot!=='mount',trainer:d=>d.slot==='mount',wizard:d=>d.slot==='book'};
  // hiệu buôn thành trì (mã bắt đầu 'thanh-'): gia cường cả vũ khí, giáp, thú cưỡi
  const shopEnh=id=>SHOP_ENH[id]||(/^thanh-/.test(String(id))?d=>d.slot!=='book':null);
  function enhance(s,ref,rng=Math.random,shop){
    const it=ref.where==='bag'?s.bag[ref.key]:ref.where==='skill'?s.skillSlots[ref.key]:s.equipment[ref.key];
    if(!canEnhance(it))throw Error('ITEM');
    if(shop&&shopEnh(shop)&&!shopEnh(shop)(info(it)))throw Error('SHOP');
    const lv=it.lv||0;if(lv>=MAX_LV)throw Error('MAX');
    const cost=enhCost(lv);if(s.rubies<cost)throw Error('RUBY');
    s.rubies-=cost;const ok=rng()<enhRate(lv);it.lv=ok?lv+1:enhFail(lv,rng);
    return {ok,from:lv,to:it.lv,cost};
  }
  // Dung hợp cánh (NPC Luyện khí sư): thú cưỡi +dung_hop_thu_cap trở lên + một món huyền thoại / thần + hồng ngọc → tỉ lệ dung_hop_ti_le ra một đôi cánh ngẫu nhiên
  // Số dòng 0–5 theo bảng dung_hop_dong (càng nhiều dòng càng hiếm); chỉ số lấy trong canh_dong, giá trị theo bậc: 0–1 dòng Đẹp, 2–3 Hoàn hảo, 4 Huyền thoại, 5 Thần (mỗi dòng ×(1+bậc thú/20)).
  // Thất bại: mất món huyền thoại / thần và hồng ngọc, thú cưỡi về +6. Thành công: mất cả hai món, nhận cánh.
  const WING_IDS=()=>Object.keys(items).filter(k=>items[k].wing);
  function fuse(s,mi,xi,rng=Math.random){
    const m=s.bag[mi],x=s.bag[xi],dm=info(m),dx=info(x),need=num(CFG.dung_hop_thu_cap,9),cost=num(CFG.dung_hop_ngoc,60);
    if(!dm||dm.slot!=='mount'||(m.lv||0)<need)throw Error('THU');if(!dx||mi===xi||!(dx.set||dx.myth))throw Error('VAT_LIEU');if(s.rubies<cost)throw Error('RUBY');
    const pool=WING_IDS();if(!pool.length)throw Error('ITEM');
    s.rubies-=cost;const ok=rng()*100<num(CFG.dung_hop_ti_le,40);
    if(!ok){s.bag[xi]=null;m.lv=Math.min(m.lv||0,6);return {ok:false,cost,mount:m};}
    const type=pool[Math.floor(rng()*pool.length)],w=String(CFG.dung_hop_dong||'0,30,28,22,12,6,2').split(',').map(Number).slice(1),tot=w.reduce((a,b)=>a+b,0);
    let r=rng()*tot,n=0;for(let i=0;i<w.length;i++){r-=w[i];if(r<0){n=i;break;}}
    const q=n>=5?'m':n>=4?'l':n>=2?'p':'g',tier=RAR[q]?RAR[q].tier:1,keys=String(CFG.canh_dong||'dmgMax,dmgMin,def,hp,mp,range,crit3').split(/[,;\s]+/).filter(k=>ADD[k]&&ADD[k].ranges[tier]);
    const it={uid:uid(type,rng),type,q,add:{}};
    for(let i=0;i<n&&keys.length;i++){const k=keys.splice(Math.floor(rng()*keys.length),1)[0],[a,b]=ADD[k].ranges[tier];it.add[k]=Math.round((a+Math.floor(rng()*(b-a+1)))*(1+(m.lv||0)/20));}
    if(!n)delete it.add;
    s.bag[mi]=null;s.bag[xi]=null;s.bag[Math.min(mi,xi)]=it;return {ok:true,cost,item:it,lines:n};
  }
  // Tạo nhân vật mới (từ thông tin máy chủ)
  function create(ch){
    const bag=Array(BAG_SIZE).fill(null);
    ['crossbow','bow','spear','staff','shield','hat','armor'].forEach((type,i)=>bag[i]={uid:'training-'+type+'-'+i,type});
    const st=Object.fromEntries(STAT_KEYS.map(k=>[k,Math.max(0,Math.floor(num(ch&&ch.stats&&ch.stats[k],12)))]));st.command=num(CFG.menh_lenh_goc,10);
    const s={name:(ch&&ch.name)||'Lữ khách',gender:ch&&ch.gender==='f'?'f':'m',level:1,exp:0,points:0,alloc:Object.fromEntries([...STAT_KEYS,'command'].map(k=>[k,0])),stats:st,hp:1e9,mana:1e9,passive:0,copper:num(CFG.tien_thu_nghiem,0),rubies:num(CFG.hong_ngoc_thu_nghiem,0),
      flags:{river:false,hunted:false,kills:{},wells:{}},equipment:Object.fromEntries(slots.map(k=>[k,k==='right'?{uid:'training-sword',type:'sword'}:null])),bag,skillSlots:Array(SKILL_SLOTS).fill(null),activeBook:null,cooldowns:{},
      quests:{active:{},done:{}},mercs:[],pets:[],avatar:'',avatars:[],rs:(Math.random()*2147483647)|0};
    const D=derive(s);s.hp=D.tot.hp;s.mana=D.tot.mp;return s;
  }
  // Tính toàn bộ chỉ số: 5 chỉ số lớn + chỉ số nhỏ (base + phần cộng thêm từ đồ, bộ, sách)
  const isRanged=k=>k==='bow'||k==='crossbow';
  // Chính xác của cung / nỏ (Sheet cau_hinh: cung_chinh_xac, no_chinh_xac, chinh_xac_moi_cap)
  const aimAcc=it=>{const k=kind(it);if(!isRanged(k))return 0;return Math.min(100,num(CFG[k==='bow'?'cung_chinh_xac':'no_chinh_xac'],k==='bow'?70:76)+num(CFG.chinh_xac_moi_cap,2)*((it&&it.lv)||0));};
  // mốc cường hóa đủ bộ: [cấp thấp nhất, chỉ số, giá trị, biểu tượng]
  const ENH_TIERS=[[10,'cdr',5,'whirl'],[11,'atkSpd',6,'speed'],[12,'moveSpd',6,'feather'],[13,'crit2',4,'spark'],[14,'dmgRed',4,'shield'],[15,'crit3',2,'flame']];
  const CAPS={reflect:60,dodge:50,block:60,dmgRed:70,cdr:50,crit2:60,crit3:30,range:60,perfRed:80,critRed:80,legRed:80,mythRed:80,acc:100};
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
    // Hào quang cường hóa (8 ô đồ trừ thú cưỡi; vũ khí hai tay tính cả ô tay trái):
    //  5 món +9 trở lên: + máu · đủ 8 ô +9: thêm máu và % sát thương · đủ 8 ô cùng từ +10..+15: mỗi mốc thêm một hiệu ứng (cộng dồn)
    const EQ8=['right','left','hat','armor','pants','gloves','shoes','wings'],lvOf=k=>{const it=k==='left'&&isTwo(s.equipment.right)?s.equipment.right:s.equipment[k];return info(it)?(it.lv||0):-1;};
    const lvs=EQ8.map(lvOf),n9=lvs.filter(v=>v>=9).length,full=lvs.every(v=>v>=9),minLv=Math.min(...lvs),enh={n9,full,min:full?minLv:0,list:[]};let enhDmg=0;
    if(n9>=5){add('hp',num(CFG.cuong_hoa_5_mau,80));enh.list.push(['heart','5 món +9: máu +'+num(CFG.cuong_hoa_5_mau,80)]);}
    if(full){add('hp',num(CFG.cuong_hoa_bo_mau,150));enhDmg=num(CFG.cuong_hoa_bo_sat_thuong,10);enh.list.push(['sword','Đủ bộ +9: máu +'+num(CFG.cuong_hoa_bo_mau,150)+', sát thương +'+enhDmg+'%']);
      for(const [lv,k,v,ic] of ENH_TIERS)if(minLv>=lv){add(k,v);enh.list.push([ic,'Đủ bộ +'+lv+': '+ADD[k].name+' +'+v+ADD[k].unit]);}}
    const books={},blv={};for(const it of (s.skillSlots||[])){const d=info(it);if(d&&d.element){books[d.element]=true;blv[d.element]=Math.max(blv[d.element]??-1,it.lv||0);for(const [k,v] of Object.entries(bookStat(it)))add(k,v);}}
    const pc=(k,f,e)=>blv[e]>=0?num(CFG[k],f)+num(CFG.sach_ti_le_cap,1)*blv[e]:0;
    const bfx={thunder:pc('loi_ti_le',12,'thunder'),wind:pc('phong_ti_le',20,'wind'),ice:pc('bang_ti_le',10,'ice'),light:pc('sang_ti_le',15,'light'),demon:blv.demon>=0?blv.demon:-1};
    if(books.water)add('mpReg',num(CFG.thuy_hoi_mana,3));if(books.wood)add('hpReg',num(CFG.moc_hoi_mau,2));if(books.earth)add('reflect',num(CFG.tho_phan_don,30));if(books.metal)add('dmgRed',num(CFG.kim_giam_sat_thuong,25));
    const st=s.stats||{},al=s.alloc||{};
    const main={str:num(st.strength)+num(al.strength)+(A.str||0),agi:num(st.agility)+num(al.agility)+(A.agi||0),vit:num(st.vitality)+num(al.vitality)+(A.vit||0),int:num(st.intelligence)+num(al.intelligence)+(A.int||0),cmd:num(st.command)+num(al.command)+(A.cmd||0)};
    const base={dmgMin:main.str*.6,dmgMax:main.str,crit2:main.str*.1,atkSpd:main.agi*.6,moveSpd:main.agi*.3,def:main.agi*.3,dodge:main.agi*.2,hp:num(CFG.mau_goc,60)+main.vit*num(CFG.mau_moi_diem,5),mp:num(CFG.mana_goc,40)+main.int*num(CFG.mana_moi_diem,4),cdr:main.int*.3};
    const tot={};for(const k of Object.keys(ADD)){if(GROUPS.some(g=>g[0]===k))continue;let v=(base[k]||0)+(A[k]||0);if(CAPS[k])v=Math.min(CAPS[k],v);tot[k]=ADD[k].unit?Math.round(v*10)/10:Math.round(v);}
    tot.hp=Math.round(tot.hp);tot.mp=Math.round(tot.mp);tot.dmgMax=Math.max(tot.dmgMax,tot.dmgMin);
    // cung, nỏ: tỉ lệ chính xác khi khóa mục tiêu (tăng theo cấp gia cường) và cộng thêm tỉ lệ x2 sát thương
    const rw=(s.equipment||{}).right;if(isRanged(kind(rw))){tot.aim=aimAcc(rw);tot.crit2=Math.min(CAPS.crit2,(tot.crit2||0)+num(CFG.cung_no_x2,15));}
    return {main,add:A,tot,fx,books,bfx,sets,mount,enh,dmgMul:(books.fire?1+num(CFG.hoa_sat_thuong,25)/100:1)*(1+enhDmg/100)};
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
  // Dòng hàng của một cửa hàng (shop = mã cửa hàng; không có thì tìm trong mọi cửa hàng)
  const shopRow=(type,shop)=>{if(shop&&SHOPS[shop])return SHOPS[shop].find(r=>r.id===type)||null;let row=null;for(const k in SHOPS){row=SHOPS[k].find(r=>r.id===type)||row;}return row;};
  // Giá: Đẹp ×he_so_gia_do_dep, Hoàn hảo ×he_so_gia_hoan_hao (%). Đồ phẩm chất cố định (huyền thoại, thần) bán trong cửa hàng thành trì thì tính theo giá dòng hàng
  function shopPrice(type,q='n',shop){const d=items[type];if(!d)return 0;const row=shopRow(type,shop),p=row&&row.price?row.price:d.price;if(d.q)return Math.round(p);return Math.round(p*(q==='g'?num(CFG.he_so_gia_do_dep,250)/100:q==='p'?num(CFG.he_so_gia_hoan_hao,600)/100:1));}
  function buy(s,type,q='n',rng=Math.random,shop){const d=items[type];const row=shopRow(type,shop);if(!d||!(row&&row.price||d.price)||(d.q&&!row))throw Error('ITEM');if(row&&!row.q.includes(d.q||q))throw Error('ITEM');const price=shopPrice(type,q,shop);if(s.copper<price)throw Error('MONEY');const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.copper-=price;s.bag[i]=roll(type,d.q?'n':q,rng,row&&row.t||0);return i;}
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
  /* ---------- Vùng đất và cấp tối thiểu (v9.9): Sheet cau_hinh cap_hang_dong, cap_sa_mac, cap_nui_tuyet ---------- */
  // REGIONS nạp từ tab ban_do (load); cấp của vùng có thể ghi đè bằng cau_hinh cap_<mã vùng, gạch dưới>
  const MON_REGION={'bo-cap':'sa-mac','ken-ken':'sa-mac','chan-tinh':'sa-mac','thach-tinh':'sa-mac','soi-tuyet':'nui-tuyet','gau-nui':'nui-tuyet','ho-tinh':'nui-tuyet','doi-quy':'hang-dong','nhen-doc':'hang-dong','dai-bang':'hang-dong'};
  const mapLevel=id=>{const R=REGIONS.find(r=>r.id===id);if(!R)return 1;return Math.max(1,num(CFG['cap_'+String(id).replace(/-/g,'_')],R.lv));};
  const regionLv=id=>{const R=REGIONS.find(r=>r.id===id);return R?R.lv:1;};
  const regionOf=monId=>(MON[monId]&&MON[monId].map)||MON_REGION[monId]||'thanh-moc';
  const questLevel=Q=>Q?(Q.lv||mapLevel(regionOf(Q.target))):1;
  function questAccept(s,id){const Q=QUESTS[id];if(!Q)throw Error('QUEST');if((s.level||1)<questLevel(Q))throw Error('LEVEL');if(s.quests.active[id]!=null)throw Error('QUEST_HAVE');if(Object.keys(s.quests.active).length>=MAX_ACTIVE_QUEST)throw Error('QUEST_FULL');if(!Q.repeat&&s.quests.done[id])throw Error('QUEST_DONE');s.quests.active[id]=0;}
  function questProgress(s,monId){const out=[];for(const id of Object.keys(s.quests.active)){const Q=QUESTS[id];if(Q&&Q.target===monId&&s.quests.active[id]<Q.count){s.quests.active[id]++;out.push(id);}}return out;}
  function questTurnIn(s,id,rng=Math.random){
    const Q=QUESTS[id];if(!Q||s.quests.active[id]==null)throw Error('QUEST');if(s.quests.active[id]<Q.count)throw Error('QUEST_NOT_DONE');
    let it=null;if(Q.item&&items[Q.item]){if(s.bag.indexOf(null)<0)throw Error('BAG_FULL');let q=Q.itemQ||'n';if(RAR[q]&&RAR[q].tier>dropCap())q='p';it=roll(Q.item,q,rng);addItem(s,it);}
    s.copper+=Q.copper;s.rubies+=Q.rubies;delete s.quests.active[id];s.quests.done[id]=(s.quests.done[id]||0)+1;const up=gainExp(s,Q.exp);return {copper:Q.copper,rubies:Q.rubies,item:it,exp:Q.exp,up};
  }
  // Kinh nghiệm và cấp: điểm cần cho mỗi cấp tăng dần; lên cấp được điểm cộng vào 4 chỉ số
  const maxLevel=()=>Math.max(num(CFG.cap_toi_da,100),...REGIONS.map(r=>r.lv)),petMax=()=>num(CFG.ma_toi_da,2);
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
    if(!d.q&&RAR[i.q]&&i.q!=='n')it.q=i.q;const t=Math.floor(num(i.t));if(t>=20)it.t=Math.min(999,t);
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
    s.avatars=(Array.isArray(p.avatars)?p.avatars:[]).filter(id=>AVATARS[id]).slice(0,60);const av=AVATARS[p.avatar];s.avatar=av&&(!av.gender||av.gender===s.gender)&&(s.avatars.includes(p.avatar)||!(av.price||av.ruby))?p.avatar:'';
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
    // vùng chưa đủ cấp (sửa dữ liệu, đổi cấu hình): về làng
    return {player:s,pos:pos&&!(typeof pos.map==='string'&&mapLevel(pos.map)>(s.level||1))&&canStand&&canStand(pos.x,pos.y)?{x:pos.x,y:pos.y,...(typeof pos.map==='string'?{map:pos.map}:{})}:null,seen:Array.isArray(save.seen)?save.seen.filter(v=>npcIds?npcIds.includes(v):typeof v==='string'&&/^[a-z0-9-]{1,40}$/.test(v)):[]};
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
  // số lần hạ một loài quái trong một lượt hồi sinh: bãi quái lớn có nhiều con cùng loài (Sheet cau_hinh gioi_han_ha_quai)
  const KILL_LIMIT=id=>MON[id].boss?1:num(CFG.gioi_han_ha_quai,16);
  const PREDICT=new Set(['kill','buy','sell','enh','enhSk','qa','qt','hire','dismiss','pt','petOff','av','fuse']);
  function applyOp(s,op,srv,now=Date.now(),rng=Math.random){
    const t=op&&op.t;if(PREDICT.has(t))rng=seqRng(s);
    if(t==='kill'){
      const M=MON[op.mon];if(!M)throw Error('MON');
      srv.kills=srv.kills||{};const win=Math.max(5,M.respawn)*1000,log=(srv.kills[op.mon]||[]).filter(x=>now-x<win);
      if(log.length>=KILL_LIMIT(op.mon))throw Error('NHANH_QUA');log.push(now);srv.kills[op.mon]=log;
      const D=derive(s),F=D.fx||{},copper=Math.round(M.copper*(1+num(F.coinUp)/100)),exp=Math.round(M.exp*(1+num(F.expUp)/100));
      s.copper+=copper;s.flags.kills[op.mon]=(s.flags.kills[op.mon]||0)+1;
      const drop=rollDrop(op.mon,rng,1+num(F.luck)/100),items=[],lost=[];s.rubies+=drop.rubies;
      for(const it of drop.items){try{addItem(s,it);items.push(it);}catch(e){lost.push(it);}}
      const done=questProgress(s,op.mon).filter(id=>s.quests.active[id]>=QUESTS[id].count);
      let bonus=0;const k=s.flags.kills;if(!s.flags.hunted&&k.deer&&k.lion&&k.elephant&&k.croc){s.flags.hunted=true;s.copper+=100;bonus=100;}
      const up=gainExp(s,exp);
      // Sách Ma công: tỉ lệ thu phục quái (không áp dụng cho trùm), tăng theo Mệnh lệnh và cấp sách
      let pet=null;if(!M.boss&&(s.pets=s.pets||[]).length<petMax()){if(D.bfx.demon>=0){const ch=num(CFG.ma_ti_le_goc,2)+D.main.cmd*num(CFG.ma_phan_van_moi_menh_lenh,20)/100+num(CFG.sach_ti_le_cap,1)*D.bfx.demon;if(rng()*100<ch){pet={pid:'pet-'+rnd36(rng),type:op.mon,hpFrac:1};s.pets.push(pet);}}}
      return {mon:op.mon,copper,rubies:drop.rubies,items,lost,done,bonus,exp,up,level:s.level,pet};
    }
    if(t==='buy'){const i=buy(s,String(op.type),op.q==='g'||op.q==='p'?op.q:'n',rng,op.shop?String(op.shop):undefined);return {i,item:s.bag[i]};}
    // Diện mạo (NPC Thợ truyền thần ở thành trì): mua rồi đổi; diện mạo giá 0 ai cũng đổi được
    if(t==='av'){const id=String(op.id||'');if(!id){s.avatar='';return {id};}const V=AVATARS[id];if(!V)throw Error('AV');if(V.gender&&V.gender!==s.gender)throw Error('GENDER');s.avatars=s.avatars||[];
      if(!s.avatars.includes(id)&&(V.price||V.ruby)){if(s.copper<V.price)throw Error('MONEY');if(s.rubies<V.ruby)throw Error('RUBY');s.copper-=V.price;s.rubies-=V.ruby;s.avatars.push(id);}
      s.avatar=id;return {id,bought:!!(V.price||V.ruby)};}
    if(t==='sell'){const i=Math.floor(op.i),it=s.bag[i];const v=sell(s,i);return {v,item:it};}
    if(t==='fuse'){const mi=Math.floor(op.m),xi=Math.floor(op.x);if(!(mi>=0&&mi<BAG_SIZE&&xi>=0&&xi<BAG_SIZE))throw Error('SLOT');return fuse(s,mi,xi,rng);}
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
  return {VERSION,BAG_SIZE,SKILL_SLOTS,MAX_LV,MAX_MERC,MAX_ACTIVE_QUEST,ELEMENTS,BEASTS,GROUPS,FX_NAMES,STAT_KEYS,CFG,RAR,ADD,SHOPS,SETS,MON,QUESTS,MERCS,AVATARS,TOPUPS,items,slots,skills,shopEnh,shopRow,fuse,
    layout,relayout,load,info,kind,weapon,skillCost,cmdInfo,WEAPONS,PREDICT,seqRng,setFollow,fitFollow,mercCmd,petMax,SHOP_ENH,expNeed,maxLevel,gainExp,spendPoints,mountGain,bookStat,mountCmd,qOf,rar,nameOf,stat,canEnhance,tradeable,gainOf,enhRate,enhCost,enhance,roll,rollDrop,create,derive,targets,equip,unequip,stance,isTwo,pairOk,setSkill,unsetSkill,toggleBook,element,money,shopPrice,buy,sell,sellPrice,addItem,cast,
    aimAcc,isRanged,REGIONS,MON_REGION,SKILLS,mapLevel,regionLv,regionOf,questLevel,questAccept,questProgress,questTurnIn,hireNpc,addMerc,mercEquip,mercUnequip,dismissMerc,makeMerc,cleanItem,serialize,restore,restorePlayer,merge,applyOp,allItems};
})();

/* ================= DÁNG VẺ ĐỒ: mỗi món đồ được vẽ trên người theo đúng tên / loại =================
   Một bảng duy nhất dùng cho cả hình trên người nhân vật lẫn ảnh biểu tượng trong túi (mapGame.itemIcon vẽ ảnh webp từ chính các hàm này),
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
    if(slot==='wings'){L.kind=has(name,'áo choàng')?'cloak':has(name,'cờ')?'flag':'wings';
      // cánh dung hợp (v10.6): dáng theo tên — ác quỷ: cánh dơi · xương: cánh xương · ánh sáng / lửa / lôi phong: cánh năng lượng phát sáng · còn lại: cánh lông
      if(L.kind==='wings')L.wing=has(name,'ác quỷ')?'bat':has(name,'xương')?'bone':has(name,'ánh sáng','lửa','lôi phong')?'energy':'feather';}
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
      const f=Math.sin(t*4)*.12,col=L.main,W=L.wing||'feather';c.save();c.translate(-4,-22);
      for(const s of [1,.8]){c.save();c.rotate(-.1+f*s);c.scale(s,s);c.globalAlpha=s<1?.7:.92;c.fillStyle=col;c.strokeStyle=L.trim;c.lineWidth=1;
        if(W==='bat'){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-18,-34,-42,-30);c.lineTo(-34,-16);c.lineTo(-44,-4);c.lineTo(-30,0);c.lineTo(-34,12);c.lineTo(-18,4);c.lineTo(-10,10);c.closePath();c.fill();c.stroke();
          c.strokeStyle=shadeL(col,-.35);for(const [x,y] of [[-34,-16],[-30,0],[-18,4]]){c.beginPath();c.moveTo(-2,-2);c.lineTo(x,y);c.stroke();}}
        else if(W==='bone'){c.strokeStyle=col;c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-16,-30,-38,-28);c.stroke();
          for(const [x,y,x2,y2] of [[-14,-20,-30,-6],[-24,-26,-40,-12],[-34,-27,-46,-18]]){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();E(c,x2,y2,2.2,2.2,col);}
          c.lineWidth=1;c.strokeStyle=shadeL(col,-.4);c.fillStyle=shadeL(col,.2)+'55';c.beginPath();c.moveTo(-6,-6);c.lineTo(-30,-6);c.lineTo(-40,-12);c.lineTo(-24,-26);c.closePath();c.fill();}
        else if(W==='energy'){c.save();c.shadowColor=L.trim;c.shadowBlur=14;c.globalAlpha=(s<1?.5:.75);
          for(let i=0;i<3;i++){const ph=(t*1.5+i*.33)%1;c.globalAlpha*=1;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-20-i*4,-36-ph*8,-42-i*3,-10-i*8);c.quadraticCurveTo(-26,-8+i*4,0,8);c.closePath();c.fill();}
          c.restore();c.strokeStyle=shadeL(col,.4);for(let i=1;i<4;i++){c.beginPath();c.moveTo(-4,2);c.lineTo(-12-i*8,-14+i*5);c.stroke();}}
        else{c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-26,-40,-40,-12);c.quadraticCurveTo(-28,-12,-22,4);c.quadraticCurveTo(-12,0,0,8);c.closePath();c.fill();c.stroke();
          c.strokeStyle=shadeL(col,-.25);for(let i=1;i<4;i++){c.beginPath();c.moveTo(-4,2);c.lineTo(-12-i*8,-14+i*5);c.stroke();}}
        c.restore();}
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
