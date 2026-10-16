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
const LH_SHEETS=@@IDS@@;
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
  // Quái, nhiệm vụ mới của bản cập nhật (vùng mới) mà Sheet chưa có dòng: dùng số liệu mặc định cho tới khi chạy kiemTra để chép vào Sheet
  for(const tab of LH_BO_SUNG)if(LH_SHEETS[LH_STATIC[tab]]&&Array.isArray(out[tab])&&out[tab].length){const has=new Set(out[tab].map(r=>String(r.id)));for(const r of LH_DEFAULT[tab]||[])if(!has.has(String(r.id)))out[tab].push(r);}
  // Ảnh tĩnh: chỉ gửi các dòng đã dán link
  out.hinh_anh=(out.hinh_anh||[]).filter(r=>String(r.link_anh||'').trim()).map(r=>({nhom:r.nhom,ma:r.ma,link_anh:String(r.link_anh).trim()}));
  const s=JSON.stringify(out);if(s.length<95000)cache.put('lh-data',s,120);
  return out;
}
// Tab được bổ sung dòng mới (theo cột id) khi game thêm quái, nhiệm vụ
const LH_BO_SUNG=['quai','nhiem_vu'];
// Chép các dòng mặc định còn thiếu (quái, nhiệm vụ của vùng mới) xuống cuối tab; không sửa dòng đã có
function lhDuLieuBoSung_(){
  let n=0;
  for(const tab of LH_BO_SUNG){
    const file=LH_SHEETS[LH_STATIC[tab]];if(!file)continue;const sh=SpreadsheetApp.openById(file).getSheetByName(tab);if(!sh||sh.getLastRow()<2)continue;
    const v=sh.getDataRange().getValues(),h=v[0].map(String),ci=h.indexOf('id');if(ci<0)continue;const has=new Set(v.slice(1).map(r=>String(r[ci])));
    const add=(LH_DEFAULT[tab]||[]).filter(r=>!has.has(String(r.id))).map(r=>h.map(k=>r[k]===undefined||r[k]===null?'':r[k]));
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
function kiemTra(){try{lhDuLieuBoSung_();}catch(e){Logger.log('Chưa bổ sung được quái / nhiệm vụ mới: '+e);}try{const n=lhHinhAnhBoSung_();if(n)Logger.log('Thêm '+n+' dòng ảnh mới vào file Hình ảnh');}catch(e){Logger.log('Chưa bổ sung được file Hình ảnh: '+e);}xoaBoNhoDem();const d=lhStatic_();Logger.log(Object.keys(d).map(k=>k+': '+d[k].length+' dòng').join('\n'));LH_DB.rows('tai_khoan');LH_DB.rows('nhan_vat');LH_DB.rows('cho');Logger.log('Bảng người chơi sẵn sàng. Quyền gửi mail: '+MailApp.getRemainingDailyQuota()+' thư/ngày');}
