/* ================= LỮ HÀNH · APPS SCRIPT (Code.gs) =================
   Cách dùng:
   1. Vào script.google.com → Dự án mới → dán toàn bộ file này vào Code.gs → Lưu.
   2. Chọn hàm caiDat → Chạy (một lần). Google sẽ hỏi quyền đọc/ghi Sheet và gửi email: đồng ý.
      Hàm này đổ dữ liệu mặc định vào các file Sheet còn trống trong thư mục "Lữ Hành · Dữ liệu game" và tạo bảng người chơi.
      Lưu ý: dùng đúng tài khoản Google đang sở hữu thư mục đó.
   3. Triển khai → Tùy chọn triển khai mới → Loại: Ứng dụng web → Thực thi với tư cách: Tôi → Ai có quyền truy cập: Bất kỳ ai → Triển khai.
   4. Sao chép URL ứng dụng web (đuôi /exec), dán vào dòng const LH_API='' trong code game trên Blogspot.
   Sửa số liệu trong các file Sheet xong, chạy hàm xoaBoNhoDem để game nhận ngay (nếu không, tối đa 5 phút).
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
const LH_STATIC={cau_hinh:'cau_hinh',gia_cuong:'cau_hinh',pham_chat:'pham_chat',thuoc_tinh:'pham_chat',vat_pham:'vat_pham',cua_hang:'cua_hang',bo_huyen_thoai:'bo_huyen_thoai',tuong:'bo_huyen_thoai',do_than:'do_than',quai:'quai',nhiem_vu:'nhiem_vu',linh:'linh',vu_khi:'vat_pham',ban_do:'cau_hinh',dien_mao:'cau_hinh',goi_nap:'cau_hinh',bo_cau_hoi:'nhiem_vu',cau_hoi:'nhiem_vu',hinh_anh:'hinh_anh'};
// Bảng ngoài (v10.11): câu hỏi Thầy đồ đọc thẳng từ tab CauHoi của bảng OCD_Quest (cột QuestionID, QuestID, StepID, ThuTu, CauHoi, A, B, C, D, DapAn).
// Đọc được thì thay cho tab cau_hoi; không đọc được (chưa chia sẻ quyền) thì dùng tab cau_hoi / số mặc định. Để trống id để tắt.
const LH_NGOAI={cau_hoi:{id:'10EjfikAuPyc1t_aGDDsUlq0eewo0WUl5qOyXjkVG28M',tab:'CauHoi',cot:{id:'QuestionID',bo:'QuestID',thu_tu:'ThuTu',cau:'CauHoi',a:'A',b:'B',c:'C',d:'D',dap_an:'DapAn'}}};
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
// Bộ nhớ đệm dữ liệu tĩnh (v10.7): gói dữ liệu đã hơn 100 KB (giới hạn một ô CacheService) nên nén gzip rồi chia nhiều ô; trước đây quá 95 KB là bỏ không đệm,
// khiến mọi lệnh gọi phải đọc lại toàn bộ Sheet (rất chậm, trang tải đứng ở ~96%).
const LH_CACHE_GIAY=300;
function lhCachePut_(key,s){
  try{const z=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(s,'text/plain')).getBytes()),o={},n=Math.ceil(z.length/90000);
    for(let i=0;i<n;i++)o[key+'-'+i]=z.slice(i*90000,(i+1)*90000);o[key]=n+':'+z.length;CacheService.getScriptCache().putAll(o,LH_CACHE_GIAY);}catch(e){}
}
function lhCacheGet_(key){
  try{const cache=CacheService.getScriptCache(),h=cache.get(key);if(!h)return null;const [n,len]=h.split(':').map(Number),keys=[];for(let i=0;i<n;i++)keys.push(key+'-'+i);
    const m=cache.getAll(keys);let z='';for(const k of keys){if(!m[k])return null;z+=m[k];}if(z.length!==len)return null;
    return Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(z),'application/x-gzip')).getDataAsString();}catch(e){return null;}
}
function lhCacheXoa_(key){const cache=CacheService.getScriptCache(),keys=[key];for(let i=0;i<12;i++)keys.push(key+'-'+i);cache.removeAll(keys);}
function lhStatic_(){
  const hit=lhCacheGet_('lh-data');if(hit)return JSON.parse(hit);
  const out={},books={};
  for(const [tab,file] of Object.entries(LH_STATIC)){
    if(!LH_SHEETS[file]){out[tab]=LH_DEFAULT[tab]||[];continue;}
    const ss=books[file]||(books[file]=SpreadsheetApp.openById(LH_SHEETS[file]));
    const sh=ss.getSheetByName(tab)||(tab==='hinh_anh'?ss.getSheets()[0]:null);if(!sh||sh.getLastRow()<2){out[tab]=LH_DEFAULT[tab]||[];continue;}out[tab]=sh?lhRows_(sh).filter(r=>Object.keys(r).some(k=>k!=='_r'&&r[k]!=='')).map(r=>{delete r._r;return r;}):[];
  }
  // Quái, nhiệm vụ mới của bản cập nhật (vùng mới) mà Sheet chưa có dòng: dùng số liệu mặc định cho tới khi chạy kiemTra để chép vào Sheet
  for(const tab of LH_BO_SUNG)if(LH_SHEETS[LH_STATIC[tab]]&&Array.isArray(out[tab])&&out[tab].length){const has=new Set(out[tab].map(r=>lhKhoa_(tab,r)));for(const r of LH_DEFAULT[tab]||[])if(!has.has(lhKhoa_(tab,r)))out[tab].push(r);}
  // Câu hỏi Thầy đồ từ bảng ngoài
  for(const [tab,N] of Object.entries(LH_NGOAI)){if(!N.id)continue;try{const sh=SpreadsheetApp.openById(N.id).getSheetByName(N.tab);if(!sh||sh.getLastRow()<2)continue;
    const rows=lhRows_(sh).map(r=>Object.fromEntries(Object.entries(N.cot).map(([k,c])=>[k,r[c]===undefined?'':r[c]]))).filter(r=>r.id&&r.cau&&!/^(NV|SKQ)/i.test(String(r.bo||''))); /* v10.13: bỏ bộ NV*, SKQ* */if(rows.length)out[tab]=rows;}catch(e){Logger.log('Không đọc được bảng ngoài '+tab+': '+e);}}
  // Mã băm nội dung (trình duyệt lưu đệm, gửi lại h để khỏi tải lại)
  {const s0=JSON.stringify(out);let h=5381;for(let i=0;i<s0.length;i++)h=((h*33)^s0.charCodeAt(i))>>>0;out._h=s0.length.toString(36)+'-'+h.toString(36);}
  // Ảnh tĩnh: chỉ gửi các dòng đã dán link
  out.hinh_anh=(out.hinh_anh||[]).filter(r=>String(r.link_anh||'').trim()).map(r=>({nhom:r.nhom,ma:r.ma,link_anh:String(r.link_anh).trim(),...(String(r.phien_ban||'').trim()?{v:String(r.phien_ban).trim()}:{})}));
  lhCachePut_('lh-data',JSON.stringify(out));
  return out;
}
// Tab được bổ sung dòng mới (theo cột id) khi game thêm quái, nhiệm vụ, hàng hóa thành trì, diện mạo
const LH_BO_SUNG=['quai','nhiem_vu','cau_hinh','ban_do','vat_pham','cua_hang','dien_mao','goi_nap','thuoc_tinh','bo_cau_hoi','cau_hoi','linh','vu_khi','tuong']; // v10.14: thêm vu_khi (đao, chùy), tuong (danh tướng)
// khóa một dòng: cau_hinh theo khoa; cua_hang theo cửa hàng + mã hàng (một món có thể bán ở nhiều cửa hàng); còn lại theo id
const lhKhoa_=(tab,r)=>tab==='cau_hinh'?String(r.khoa):tab==='thuoc_tinh'?String(r.ma):tab==='vu_khi'?String(r.loai):tab==='cua_hang'?String(r.cua_hang)+'|'+String(r.id):String(r.id);
// Chép các dòng mặc định còn thiếu (quái, nhiệm vụ của vùng mới) xuống cuối tab; không sửa dòng đã có
function lhDuLieuBoSung_(){
  let n=0;
  for(const tab of LH_BO_SUNG){
    const file=LH_SHEETS[LH_STATIC[tab]];if(!file)continue;const ss=SpreadsheetApp.openById(file);let sh=ss.getSheetByName(tab);
    // tab mới của bản cập nhật (ban_do) chưa có: tạo và đổ dữ liệu mặc định
    if(!sh){const rows=LH_DEFAULT[tab]||[];if(!rows.length)continue;const h0=Object.keys(rows[0]);sh=ss.insertSheet(tab);sh.getRange(1,1,rows.length+1,h0.length).setValues([h0,...rows.map(r=>h0.map(k=>r[k]===undefined||r[k]===null?'':r[k]))]);sh.setFrozenRows(1);sh.getRange(1,1,1,h0.length).setFontWeight('bold').setBackground('#2b4d38').setFontColor('#ffffff');n+=rows.length;Logger.log('Tạo tab '+tab);continue;}
    if(sh.getLastRow()<2)continue;
    const v=sh.getDataRange().getValues(),h=v[0].map(String);if(h.indexOf('id')<0&&h.indexOf('khoa')<0&&h.indexOf('ma')<0&&h.indexOf('loai')<0)continue;const has=new Set(v.slice(1).map(r=>lhKhoa_(tab,Object.fromEntries(h.map((k,i)=>[k,r[i]])))));
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
  // không gửi đáp án Thầy đồ xuống trình duyệt (máy chủ chấm)
  hideAnswers:d=>({...d,cau_hoi:(d.cau_hoi||[]).map(r=>{const o={...r};delete o.dap_an;delete o.DapAn;return o;})}),
  lock:fn=>{const l=LockService.getScriptLock();l.waitLock(15000);try{return fn();}finally{l.releaseLock();}},
  // v10.13: chữ ký kết quả Thầy đồ (HMAC với khóa bí mật sinh một lần, lưu trong Script Properties LH_KEY)
  sign:s=>Utilities.computeHmacSha256Signature(s,lhKhoaBiMat_(),Utilities.Charset.UTF_8).map(b=>((b+256)%256).toString(16).padStart(2,'0')).join('')
});
function lhKhoaBiMat_(){const P=PropertiesService.getScriptProperties();let k=P.getProperty('LH_KEY');if(!k){k=Utilities.getUuid()+Utilities.getUuid();P.setProperty('LH_KEY',k);}return k;}
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
function xoaBoNhoDem(){lhCacheXoa_('lh-data');}
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
// v10.18: thú cưỡi vẽ lại (phượng hoàng, cửu vĩ hồ, huyền vũ, thiên mã, rồng, kỳ lân…). Chạy một lần: chép ảnh webp mới cho các dòng thú cưỡi
// mà link_anh đang trỏ tới ảnh do capNhatAnh chép (thư mục ảnh của game). Ảnh bạn tự tải lên nơi khác giữ nguyên. File Drive cũ không xóa.
// Hết giờ giữa chừng thì chạy lại: dòng đã chép được nhớ, không chép lần hai.
function capNhatAnhThuCuoi(){lhChepLaiAnh_(ma=>Player.items[ma]&&Player.items[ma].slot==='mount');}
function lhChepLaiAnh_(chon){
  const t0=Date.now(),ss=SpreadsheetApp.openById(LH_SHEETS.hinh_anh),sh=ss.getSheetByName('hinh_anh')||ss.getSheets()[0];
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String),ci=k=>h.indexOf(k),last=sh.getLastRow();if(last<2||ci('link_anh')<0)return;
  Player.load(lhStatic_());const v=sh.getRange(1,1,last,h.length).getValues(),folder=DriveApp.getFolderById(LH_ANH_FOLDER);
  const PR=PropertiesService.getScriptProperties(),key='lh-anh-lai-'+Player.VERSION,done=new Set((PR.getProperty(key)||'').split(',').filter(Boolean));let n=0,left=0,skip=0;
  const ofGame=link=>{const m=/\/d\/([\w-]{20,})/.exec(String(link||''))||/[?&]id=([\w-]{20,})/.exec(String(link||''));if(!m)return !String(link||'').trim();try{const it=DriveApp.getFileById(m[1]).getParents();while(it.hasNext())if(it.next().getId()===LH_ANH_FOLDER)return true;}catch(e){}return false;};
  for(let i=1;i<v.length;i++){
    const nhom=String(v[i][ci('nhom')]).trim(),ma=String(v[i][ci('ma')]).trim();if(nhom!=='vat_pham'||!chon(ma)||done.has(ma))continue;
    if(Date.now()-t0>270000){left++;continue;}
    if(!ofGame(v[i][ci('link_anh')])){skip++;done.add(ma);continue;}
    try{const file='vat_pham/'+ma.replace(/:/g,'_')+'.webp',blob=UrlFetchApp.fetch(LH_ANH_CDN+file).getBlob().setName(file.split('/').pop());
      const f=folder.createFile(blob);try{f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(e){}
      sh.getRange(i+1,ci('link_anh')+1).setValue('https://drive.google.com/file/d/'+f.getId()+'/view');done.add(ma);n++;
    }catch(e){Logger.log('Không chép được '+ma+': '+e);}
  }
  PR.setProperty(key,[...done].join(','));xoaBoNhoDem();
  Logger.log('Đã thay '+n+' ảnh'+(skip?', giữ '+skip+' ảnh bạn tự đặt':'')+(left?', còn '+left+' ảnh: chạy lại':', xong'));
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
// Nạp tay sau khi nhận tiền chuyển khoản (NPC Nạp thẻ chỉ hiện mã QR, không tự cộng). Tên = tên nhân vật hoặc tên đăng nhập
// (cộng vào nhân vật đầu tiên đang hoạt động của tài khoản). Ghi nhật ký vào tab nap_the.
//   napHongNgoc('tên', 120)      cộng 120 hồng ngọc
//   napVang('tên', 600)          cộng 600 vàng (v10.16)
//   napGoi('tên', 'vang-100')    cộng đúng số hồng ngọc / vàng của gói trong tab goi_nap (cột id)
function napHongNgoc(ten,soLuong){lhNap_(ten,Math.floor(Number(soLuong)||0),0);}
function napVang(ten,soVang){lhNap_(ten,0,Math.floor(Number(soVang)||0));}
function napGoi(ten,goi){Player.load(lhStatic_());const G=Player.TOPUPS.find(g=>g.id===String(goi||'').trim());if(!G){Logger.log('Không có gói '+goi+'. Các gói: '+Player.TOPUPS.map(g=>g.id).join(', '));return;}lhNap_(ten,G.ruby,G.gold);}
function lhNap_(ten,ruby,vang){
  ten=String(ten||'').trim();ruby=Math.max(0,Math.floor(ruby||0));vang=Math.max(0,Math.floor(vang||0));
  if(!ten||!(ruby>0||vang>0)){Logger.log("Cú pháp: napHongNgoc('tên', số hồng ngọc) · napVang('tên', số vàng) · napGoi('tên', 'mã gói')");return;}
  Player.load(lhStatic_());
  let c=LH_DB.where('nhan_vat','ten_khoa',ten.toLowerCase()).find(x=>x.trang_thai==='active'||x.trang_thai==='merc');
  if(!c){const a=LH_DB.find('tai_khoan','username',ten.toLowerCase());if(a)c=LH_DB.where('nhan_vat','tai_khoan',a.id).find(x=>x.trang_thai==='active'||x.trang_thai==='merc');}
  if(!c){Logger.log('Không thấy nhân vật / tài khoản '+ten);return;}
  const l=LockService.getScriptLock();l.waitLock(15000);
  try{let save={};try{save=JSON.parse(c.luu||'{}');}catch(e){}const p=save.player||Player.create({name:c.ten,gender:c.gioi_tinh});p.rubies=Math.floor(Number(p.rubies)||0)+ruby;p.copper=Math.floor(Number(p.copper)||0)+vang*10000;save.player=p;save.v=Player.VERSION;c.luu=JSON.stringify(save);c.cap_nhat=Date.now();LH_DB.update('nhan_vat',c);}
  finally{l.releaseLock();}
  try{const ss=SpreadsheetApp.openById(LH_SHEETS.nguoi_choi);let sh=ss.getSheetByName('nap_the');if(!sh){sh=ss.insertSheet('nap_the');sh.appendRow(['luc','nhan_vat','tai_khoan','hong_ngoc','vang']);sh.setFrozenRows(1);}
    else if(String(sh.getRange(1,5).getValue())!=='vang')sh.getRange(1,5).setValue('vang');sh.appendRow([new Date(),c.ten,c.tai_khoan,ruby,vang]);}catch(e){}
  Logger.log('Đã cộng '+[ruby?ruby+' hồng ngọc':'',vang?vang+' vàng':''].filter(Boolean).join(' và ')+' cho '+c.ten);
}
// v10.10: chép lại máu, sát thương của quái các vùng cấp 20+ (có cột ban_do) từ số liệu mặc định vào tab quai — tác giả giảm máu còn 1/5, sát thương gấp đôi.
// Chạy một lần sau khi dán bản mới: capNhatQuai(). Chỉ ghi đè hai cột mau, sat_thuong; dòng do bạn tự thêm (không có trong mặc định) giữ nguyên.
function capNhatQuai(){
  const file=LH_SHEETS[LH_STATIC.quai];if(!file){Logger.log('Chưa có file Sheet quai');return;}
  const sh=SpreadsheetApp.openById(file).getSheetByName('quai');if(!sh||sh.getLastRow()<2){Logger.log('Tab quai trống: game dùng số mặc định, không cần cập nhật');return;}
  const v=sh.getDataRange().getValues(),h=v[0].map(String),ci=h.indexOf('id'),cm=h.indexOf('mau'),cd=h.indexOf('sat_thuong');if(ci<0||cm<0||cd<0){Logger.log('Thiếu cột id / mau / sat_thuong');return;}
  const def=new Map((LH_DEFAULT.quai||[]).filter(r=>r.ban_do).map(r=>[String(r.id),r]));let n=0;
  for(let i=1;i<v.length;i++){const d=def.get(String(v[i][ci]));if(!d)continue;if(Number(v[i][cm])!==Number(d.mau)||Number(v[i][cd])!==Number(d.sat_thuong)){sh.getRange(i+1,cm+1).setValue(d.mau);sh.getRange(i+1,cd+1).setValue(d.sat_thuong);n++;}}
  xoaBoNhoDem();Logger.log('Đã cập nhật máu / sát thương cho '+n+' loài quái');
}
// v10.12: giãn cấp vùng (thành cuối 290–300), nhân vật tối đa cấp 400, việc Tìm con gắn NPC, bỏ khung chân dung.
// Chép giá trị mặc định mới vào các dòng ĐÃ CÓ trên Sheet (kiemTra chỉ thêm dòng mới, không sửa dòng cũ): ban_do.cap · cau_hinh.cap_toi_da · nhiem_vu tc-*: npc, noi, npc_ten;
// xóa dòng khung-* khỏi vat_pham và cua_hang. Chạy một lần sau khi dán Code.gs mới (chạy kiemTra trước để có đủ cột / dòng).
function capNhatV1012(){
  lhDuLieuBoSung_();
  const ghi=(tab,khoa,cols,chon)=>{const file=LH_SHEETS[LH_STATIC[tab]];if(!file)return 0;const sh=SpreadsheetApp.openById(file).getSheetByName(tab);if(!sh||sh.getLastRow()<2)return 0;
    const v=sh.getDataRange().getValues(),h=v[0].map(String),ck=h.indexOf(khoa);if(ck<0)return 0;const def=new Map((LH_DEFAULT[tab]||[]).filter(r=>!chon||chon(r)).map(r=>[String(r[khoa]),r]));let n=0;
    for(let i=1;i<v.length;i++){const d=def.get(String(v[i][ck]));if(!d)continue;for(const c of cols){const j=h.indexOf(c);if(j<0)continue;const val=d[c]===undefined||d[c]===null?'':d[c];if(String(v[i][j])!==String(val)){sh.getRange(i+1,j+1).setValue(val);n++;}}}
    return n;};
  const xoa=(tab,test)=>{const file=LH_SHEETS[LH_STATIC[tab]];if(!file)return 0;const sh=SpreadsheetApp.openById(file).getSheetByName(tab);if(!sh||sh.getLastRow()<2)return 0;
    const v=sh.getDataRange().getValues(),h=v[0].map(String);let n=0;for(let i=v.length-1;i>=1;i--){const r=Object.fromEntries(h.map((k,j)=>[k,v[i][j]]));if(test(r)){sh.deleteRow(i+1);n++;}}return n;};
  const a=ghi('ban_do','id',['cap']),b=ghi('cau_hinh','khoa',['gia_tri'],r=>r.khoa==='cap_toi_da'),c=ghi('nhiem_vu','id',['npc','noi','npc_ten'],r=>/^tc-/.test(String(r.id)));
  const d=xoa('vat_pham',r=>/^khung-/.test(String(r.id))||(String(r.o)==='cos'&&String(r.loai)==='khung')),e=xoa('cua_hang',r=>/^khung-/.test(String(r.id)));
  xoaBoNhoDem();Logger.log('ban_do: '+a+' ô cấp · cau_hinh cap_toi_da: '+b+' · nhiem_vu Tìm con: '+c+' ô npc · xóa '+d+' khung ở vat_pham, '+e+' ở cua_hang');
}
// v10.20: bảng cường hóa mới: lên +1…+6 chắc chắn (100%), +7…+9 còn 50%, +10…+15 giảm dần 44 · 38 · 33 · 27 · 21 · 15%.
// Chỉ ghi cột ti_le của tab gia_cuong (giữ phí hồng ngọc và mức rớt cấp). Chạy một lần sau khi dán Code.gs mới.
function capNhatV1020(){
  lhDuLieuBoSung_();
  const file=LH_SHEETS[LH_STATIC.gia_cuong];if(!file)return;const sh=SpreadsheetApp.openById(file).getSheetByName('gia_cuong');if(!sh||sh.getLastRow()<2)return;
  const v=sh.getDataRange().getValues(),h=v[0].map(String),ck=h.indexOf('cap'),ct=h.indexOf('ti_le');if(ck<0||ct<0)return;
  const def=new Map((LH_DEFAULT.gia_cuong||[]).map(r=>[String(r.cap),r.ti_le]));let n=0;
  for(let i=1;i<v.length;i++){const t=def.get(String(v[i][ck]));if(t===undefined)continue;if(String(v[i][ct])!==String(t)){sh.getRange(i+1,ct+1).setValue(t);n++;}}
  xoaBoNhoDem();Logger.log('gia_cuong: đã đổi tỉ lệ '+n+' dòng');
}
// v10.19: cân bằng lại toàn game (quái theo cấp vùng, uy lực trang bị, cường hóa theo mức nạp, vũ khí đánh xa, Thiên Đình cấp 400).
// kiemTra chỉ thêm dòng / cột mới nên cần chép số mới lên các dòng đã có. Chạy một lần sau khi dán Code.gs mới:
//  quai: mau, sat_thuong, kinh_nghiem · gia_cuong: ti_le, phi_hong_ngoc, that_bai_tu, that_bai_den · vu_khi: sat_thuong (gậy, cung, nỏ)
//  cau_hinh: quai_nhan_mau, quai_nhan_sat_thuong, boss_nhan, quai_nhan_kinh_nghiem về 1 (số đã tính sẵn vào từng quái)
function capNhatV1019(){
  lhDuLieuBoSung_();
  const ghi=(tab,khoa,cols,chon)=>{const file=LH_SHEETS[LH_STATIC[tab]];if(!file)return 0;const sh=SpreadsheetApp.openById(file).getSheetByName(tab);if(!sh||sh.getLastRow()<2)return 0;
    const v=sh.getDataRange().getValues(),h=v[0].map(String),ck=h.indexOf(khoa);if(ck<0)return 0;const def=new Map((LH_DEFAULT[tab]||[]).filter(r=>!chon||chon(r)).map(r=>[String(r[khoa]),r]));let n=0;
    for(let i=1;i<v.length;i++){const d=def.get(String(v[i][ck]));if(!d)continue;for(const c of cols){const j=h.indexOf(c);if(j<0)continue;const val=d[c]===undefined||d[c]===null?'':d[c];if(String(v[i][j])!==String(val)){sh.getRange(i+1,j+1).setValue(val);n++;}}}
    return n;};
  const a=ghi('quai','id',['mau','sat_thuong','kinh_nghiem']),b=ghi('gia_cuong','cap',['ti_le','phi_hong_ngoc','that_bai_tu','that_bai_den']),c=ghi('vu_khi','loai',['sat_thuong'],r=>['staff','bow','crossbow'].includes(String(r.loai)));
  const d=ghi('cau_hinh','khoa',['gia_tri'],r=>['quai_nhan_mau','quai_nhan_sat_thuong','boss_nhan','quai_nhan_kinh_nghiem','cap_thien_dinh'].includes(String(r.khoa)));
  xoaBoNhoDem();Logger.log('Đã cập nhật: quai '+a+' ô · gia_cuong '+b+' ô · vu_khi '+c+' ô · cau_hinh '+d+' ô');
}
// v10.13: lò rèn chỉ bán vũ khí (mũ / giáp / quần / găng / hài / áo choàng sang hiệu buôn), bỏ bộ câu hỏi NV* / SKQ*. kiemTra chỉ thêm dòng mới nên cần dọn dòng cũ:
// xóa dòng cua_hang 'thanh-*' không còn trong bảng mặc định, xóa bo_cau_hoi / cau_hoi mã NV* SKQ*. Chạy một lần sau khi dán Code.gs mới.
function capNhatV1013(){
  lhDuLieuBoSung_();
  const xoa=(tab,test)=>{const file=LH_SHEETS[LH_STATIC[tab]];if(!file)return 0;const sh=SpreadsheetApp.openById(file).getSheetByName(tab);if(!sh||sh.getLastRow()<2)return 0;
    const v=sh.getDataRange().getValues(),h=v[0].map(String);let n=0;for(let i=v.length-1;i>=1;i--){const r=Object.fromEntries(h.map((k,j)=>[k,v[i][j]]));if(test(r)){sh.deleteRow(i+1);n++;}}return n;};
  const keep=new Set((LH_DEFAULT.cua_hang||[]).map(r=>String(r.cua_hang)+'|'+String(r.id)));
  const a=xoa('cua_hang',r=>/^thanh-/.test(String(r.cua_hang))&&!keep.has(String(r.cua_hang)+'|'+String(r.id)));
  const b=xoa('bo_cau_hoi',r=>/^(NV|SKQ)/i.test(String(r.id))),c=xoa('cau_hoi',r=>/^(NV|SKQ)/i.test(String(r.bo||r.id)));
  xoaBoNhoDem();Logger.log('Xóa '+a+' dòng hàng thành trì cũ, '+b+' bộ câu hỏi, '+c+' câu hỏi NV/SKQ');
}
function kiemTra(){try{lhDuLieuBoSung_();}catch(e){Logger.log('Chưa bổ sung được quái / nhiệm vụ mới: '+e);}try{const n=lhHinhAnhBoSung_();if(n)Logger.log('Thêm '+n+' dòng ảnh mới vào file Hình ảnh');}catch(e){Logger.log('Chưa bổ sung được file Hình ảnh: '+e);}xoaBoNhoDem();const d=lhStatic_();Logger.log(Object.keys(d).map(k=>k+': '+d[k].length+' dòng').join('\n'));LH_DB.rows('tai_khoan');LH_DB.rows('nhan_vat');LH_DB.rows('cho');Logger.log('Bảng người chơi sẵn sàng. Quyền gửi mail: '+MailApp.getRemainingDailyQuota()+' thư/ngày');}
