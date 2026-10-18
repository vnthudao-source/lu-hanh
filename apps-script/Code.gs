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
const LH_STATIC={cau_hinh:'cau_hinh',gia_cuong:'cau_hinh',pham_chat:'pham_chat',thuoc_tinh:'pham_chat',vat_pham:'vat_pham',cua_hang:'cua_hang',bo_huyen_thoai:'bo_huyen_thoai',tuong:'bo_huyen_thoai',do_than:'do_than',quai:'quai',nhiem_vu:'nhiem_vu',linh:'linh',vu_khi:'vat_pham',ban_do:'cau_hinh',dien_mao:'cau_hinh',goi_nap:'cau_hinh',bo_cau_hoi:'nhiem_vu',cau_hoi:'nhiem_vu',hinh_anh:'hinh_anh'};
// Bảng ngoài (v10.11): câu hỏi Thầy đồ đọc thẳng từ tab CauHoi của bảng OCD_Quest (cột QuestionID, QuestID, StepID, ThuTu, CauHoi, A, B, C, D, DapAn).
// Đọc được thì thay cho tab cau_hoi; không đọc được (chưa chia sẻ quyền) thì dùng tab cau_hoi / số mặc định. Để trống id để tắt.
const LH_NGOAI={cau_hoi:{id:'10EjfikAuPyc1t_aGDDsUlq0eewo0WUl5qOyXjkVG28M',tab:'CauHoi',cot:{id:'QuestionID',bo:'QuestID',thu_tu:'ThuTu',cau:'CauHoi',a:'A',b:'B',c:'C',d:'D',dap_an:'DapAn'}}};
// Cột của các bảng người chơi (file "LH · Người chơi")
const LH_COLS={
  tai_khoan:['id','username','email','muoi','mat_khau','tao_luc','token','token_het_han','ma_khoi_phuc','ma_het_han','token_cu','ruong'],
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
const LH_BO_SUNG=['quai','nhiem_vu','cau_hinh','ban_do','vat_pham','cua_hang','dien_mao','thuoc_tinh','bo_cau_hoi','cau_hoi','linh','vu_khi','tuong']; // v10.14: thêm vu_khi (đao, chùy), tuong (danh tướng). v10.27: bỏ goi_nap — gói nạp lấy đúng theo Sheet, không tự thêm gói mặc định đã xoá
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
// v10.26: ghi lại giá đơn chiêu mộ 100 hồng ngọc và hệ số giá thú cưỡi mỗi thành ×2 (thu_cuoi_gia_moi_thanh); dòng thu_cuoi_gia_thanh = 10 do kiemTra thêm. Chạy một lần sau khi dán Code.gs mới.
function capNhatV1026(){
  lhDuLieuBoSung_();const file=LH_SHEETS[LH_STATIC.cau_hinh];if(!file)return;const sh=SpreadsheetApp.openById(file).getSheetByName('cau_hinh');if(!sh||sh.getLastRow()<2)return;
  const v=sh.getDataRange().getValues(),h=v[0].map(String),ck=h.indexOf('khoa'),cv=h.indexOf('gia_tri');let n=0;
  const want=new Map((LH_DEFAULT.cau_hinh||[]).filter(r=>['chieu_mo_ti_le','chieu_mo_hong_ngoc','thu_cuoi_gia_moi_thanh','thu_cuoi_gia_thanh'].includes(String(r.khoa))).map(r=>[String(r.khoa),r.gia_tri]));
  for(let i=1;i<v.length;i++){const w=want.get(String(v[i][ck]));if(w!==undefined&&String(v[i][cv])!==String(w)){sh.getRange(i+1,cv+1).setValue(w);n++;}}
  xoaBoNhoDem();Logger.log('cau_hinh: đã ghi '+n+' dòng (chieu_mo_*, thu_cuoi_gia_*)');
}
// v10.25: danh tướng (Huyền thoại, Thần thoại) tách khỏi hệ lính thường; ghi lại các dòng cấu hình đã có: tỉ lệ chiêu mộ (1% · 0,3%), giá đơn chiêu mộ 30 hồng ngọc, giá thú cưỡi mỗi thành ×10. Chạy một lần sau khi dán Code.gs mới.
function capNhatV1025(){
  lhDuLieuBoSung_();const file=LH_SHEETS[LH_STATIC.cau_hinh];if(!file)return;const sh=SpreadsheetApp.openById(file).getSheetByName('cau_hinh');if(!sh||sh.getLastRow()<2)return;
  const v=sh.getDataRange().getValues(),h=v[0].map(String),ck=h.indexOf('khoa'),cv=h.indexOf('gia_tri');let n=0;
  const want=new Map((LH_DEFAULT.cau_hinh||[]).filter(r=>['chieu_mo_ti_le','chieu_mo_hong_ngoc','thu_cuoi_gia_moi_thanh'].includes(String(r.khoa))).map(r=>[String(r.khoa),r.gia_tri]));
  for(let i=1;i<v.length;i++){const w=want.get(String(v[i][ck]));if(w!==undefined&&String(v[i][cv])!==String(w)){sh.getRange(i+1,cv+1).setValue(w);n++;}}
  xoaBoNhoDem();Logger.log('cau_hinh: đã ghi '+n+' dòng (chieu_mo_ti_le, chieu_mo_hong_ngoc, thu_cuoi_gia_moi_thanh)');
}
// v10.24: giá sách mỗi thành gấp đôi (sach_gia_moi_thanh 5 → 2). kiemTra chỉ thêm dòng mới nên hàm này ghi lại giá trị dòng đã có. Chạy một lần sau khi dán Code.gs mới.
function capNhatV1024(){
  lhDuLieuBoSung_();const file=LH_SHEETS[LH_STATIC.cau_hinh];if(!file)return;const sh=SpreadsheetApp.openById(file).getSheetByName('cau_hinh');if(!sh||sh.getLastRow()<2)return;
  const v=sh.getDataRange().getValues(),h=v[0].map(String),ck=h.indexOf('khoa'),cv=h.indexOf('gia_tri');let n=0;
  for(let i=1;i<v.length;i++)if(String(v[i][ck])==='sach_gia_moi_thanh'&&String(v[i][cv])!=='2'){sh.getRange(i+1,cv+1).setValue(2);n++;}
  xoaBoNhoDem();Logger.log('sach_gia_moi_thanh: '+(n?'đã đổi thành 2':'đã là 2'));
}
// v10.22: chiến thuật trùm (cột ky_nang tab quai: tron, bay, giap-bang, hoi-mau, phan-giap) và cửa hàng sách chỉ bán tới Hoàn hảo (Huyền thoại, Thần rơi từ trùm).
// kiemTra thêm các dòng cấu hình mới (sach_gia_nhan, sach_roi_*, boss_nhan_sat_thuong, nguoi_choi_ao_*). Hàm này ghi cột ky_nang của 7 trùm và cột pham_chat của các dòng sách. Chạy một lần sau khi dán Code.gs mới.
function capNhatV1022(){
  lhDuLieuBoSung_();let n=0;
  const tab=(t,f)=>{const file=LH_SHEETS[LH_STATIC[t]];if(!file)return;const sh=SpreadsheetApp.openById(file).getSheetByName(t);if(!sh||sh.getLastRow()<2)return;const v=sh.getDataRange().getValues(),h=v[0].map(String);f(sh,v,h);};
  tab('quai',(sh,v,h)=>{const ci=h.indexOf('id'),ck=h.indexOf('ky_nang');if(ci<0||ck<0)return;const def=new Map((LH_DEFAULT.quai||[]).filter(r=>/tron|bay|giap-bang|hoi-mau|phan-giap/.test(String(r.ky_nang||''))).map(r=>[String(r.id),r.ky_nang]));
    for(let i=1;i<v.length;i++){const q=def.get(String(v[i][ci]));if(q!==undefined&&String(v[i][ck])!==String(q)){sh.getRange(i+1,ck+1).setValue(q);n++;}}});
  tab('cua_hang',(sh,v,h)=>{const cs=h.indexOf('cua_hang'),ci=h.indexOf('id'),cq=h.indexOf('pham_chat');if(cs<0||ci<0||cq<0)return;const def=new Map((LH_DEFAULT.cua_hang||[]).filter(r=>/^book-/.test(String(r.id))).map(r=>[r.cua_hang+'|'+r.id,r.pham_chat]));
    for(let i=1;i<v.length;i++){const q=def.get(v[i][cs]+'|'+v[i][ci]);if(q!==undefined&&String(v[i][cq])!==String(q)){sh.getRange(i+1,cq+1).setValue(q);n++;}}});
  xoaBoNhoDem();Logger.log('Đã ghi '+n+' ô (ky_nang trùm, pham_chat sách)');
}
// v10.21: sách bán đủ 5 phẩm chất (Thường, Đẹp, Hoàn hảo, Huyền thoại, Thần) ở Đạo sĩ làng và Pháp sư các thành; thêm Người giữ rương (rương chung tài khoản, cột ruong ở tab tai_khoan tự thêm).
// kiemTra thêm các dòng cấu hình mới (sach_*, ma_*, thu_phuc_*, thu_cuoi_*, ruong_so_o). Hàm này ghi cột pham_chat của các dòng sách trong tab cua_hang. Chạy một lần sau khi dán Code.gs mới.
function capNhatV1021(){
  lhDuLieuBoSung_();
  const file=LH_SHEETS[LH_STATIC.cua_hang];if(!file)return;const sh=SpreadsheetApp.openById(file).getSheetByName('cua_hang');if(!sh||sh.getLastRow()<2)return;
  const v=sh.getDataRange().getValues(),h=v[0].map(String),cs=h.indexOf('cua_hang'),ci=h.indexOf('id'),cq=h.indexOf('pham_chat');if(cs<0||ci<0||cq<0)return;
  const def=new Map((LH_DEFAULT.cua_hang||[]).filter(r=>/^book-/.test(String(r.id))).map(r=>[r.cua_hang+'|'+r.id,r.pham_chat]));let n=0;
  for(let i=1;i<v.length;i++){const q=def.get(v[i][cs]+'|'+v[i][ci]);if(q===undefined)continue;if(String(v[i][cq])!==String(q)){sh.getRange(i+1,cq+1).setValue(q);n++;}}
  xoaBoNhoDem();Logger.log('cua_hang: sách bán đủ 5 phẩm chất ở '+n+' dòng');
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

// Ảnh vật phẩm game vẽ sẵn (hàm capNhatAnh chép vào Drive)
const LH_ANH_CDN="https://cdn.jsdelivr.net/gh/vnthudao-source/lu-hanh@ban-10.28/dist/anh/";

// Dòng ảnh giao diện, quái bổ sung vào file Hình ảnh khi chạy kiemTra
const LH_HINH_THEM=[{"nhom":"bieu_tuong","ma":"sword","ten":"Kiếm","dung_o":"Loại vũ khí kiếm, nút đánh thường khi cầm kiếm"},{"nhom":"bieu_tuong","ma":"bow","ten":"Cung","dung_o":"Loại cung, nút đánh khi cầm cung"},{"nhom":"bieu_tuong","ma":"crossbow","ten":"Nỏ","dung_o":"Loại nỏ, nút đánh khi cầm nỏ"},{"nhom":"bieu_tuong","ma":"staff","ten":"Gậy phép","dung_o":"Loại gậy, nút đánh khi cầm gậy"},{"nhom":"bieu_tuong","ma":"saber","ten":"saber","dung_o":""},{"nhom":"bieu_tuong","ma":"mace","ten":"mace","dung_o":""},{"nhom":"bieu_tuong","ma":"spear","ten":"Thương","dung_o":"Loại thương, nút đánh khi cầm thương"},{"nhom":"bieu_tuong","ma":"shield","ten":"Khiên","dung_o":"Loại khiên, chỉ số Thủ, vùng an toàn"},{"nhom":"bieu_tuong","ma":"punch","ten":"Nắm đấm","dung_o":"Sức mạnh, tay không"},{"nhom":"bieu_tuong","ma":"hat","ten":"Mũ","dung_o":"Ô trang bị mũ"},{"nhom":"bieu_tuong","ma":"armor","ten":"Áo giáp","dung_o":"Ô trang bị áo"},{"nhom":"bieu_tuong","ma":"pants","ten":"Quần","dung_o":"Ô trang bị quần"},{"nhom":"bieu_tuong","ma":"gloves","ten":"Găng tay","dung_o":"Ô trang bị găng"},{"nhom":"bieu_tuong","ma":"shoes","ten":"Giày","dung_o":"Ô trang bị giày"},{"nhom":"bieu_tuong","ma":"wings","ten":"Áo choàng / cánh","dung_o":"Ô trang bị cánh"},{"nhom":"bieu_tuong","ma":"mount","ten":"Ngựa","dung_o":"Thú cưỡi, nút kỹ năng thú cưỡi"},{"nhom":"bieu_tuong","ma":"book","ten":"Sách","dung_o":"Sách kỹ năng, ô kỹ năng"},{"nhom":"bieu_tuong","ma":"ore","ten":"Khoáng thạch","dung_o":"Nguyên liệu"},{"nhom":"bieu_tuong","ma":"lock","ten":"Ổ khóa","dung_o":"Ô khóa, đăng nhập"},{"nhom":"bieu_tuong","ma":"pin","ten":"Ghim bản đồ","dung_o":"Tên vùng trên bản đồ nhỏ"},{"nhom":"bieu_tuong","ma":"flame","ten":"Lửa","dung_o":"Sách Hỏa, kỹ năng Liên hoàn"},{"nhom":"bieu_tuong","ma":"water","ten":"Nước","dung_o":"Sách Thủy, trùm Ngư Tinh"},{"nhom":"bieu_tuong","ma":"wood","ten":"Cây","dung_o":"Sách Mộc"},{"nhom":"bieu_tuong","ma":"metal","ten":"Kim loại","dung_o":"Sách Kim"},{"nhom":"bieu_tuong","ma":"earth","ten":"Đất","dung_o":"Sách Thổ"},{"nhom":"bieu_tuong","ma":"heart","ten":"Trái tim","dung_o":"Máu, Sức khỏe"},{"nhom":"bieu_tuong","ma":"orb","ten":"Cầu mana","dung_o":"Mana, hết mana"},{"nhom":"bieu_tuong","ma":"speed","ten":"Tốc độ","dung_o":"Tốc độ chạy, tốc đánh"},{"nhom":"bieu_tuong","ma":"reflect","ten":"Phản đòn","dung_o":"Chỉ số phản đòn"},{"nhom":"bieu_tuong","ma":"feather","ten":"Lông vũ","dung_o":"Nhanh nhẹn"},{"nhom":"bieu_tuong","ma":"flag","ten":"Lá cờ","dung_o":"Mệnh lệnh, lính đang ra trận"},{"nhom":"bieu_tuong","ma":"talk","ten":"Nói chuyện","dung_o":"Gặp dân làng"},{"nhom":"bieu_tuong","ma":"bridge","ten":"Cây cầu","dung_o":"Nhiệm vụ qua cầu"},{"nhom":"bieu_tuong","ma":"deer","ten":"Hươu","dung_o":"Nhiệm vụ săn hươu"},{"nhom":"bieu_tuong","ma":"lion","ten":"Sư tử","dung_o":"Nhiệm vụ sư tử"},{"nhom":"bieu_tuong","ma":"elephant","ten":"Voi","dung_o":"Voi rừng, thú cưỡi voi"},{"nhom":"bieu_tuong","ma":"croc","ten":"Cá sấu","dung_o":"Nhiệm vụ cá sấu"},{"nhom":"bieu_tuong","ma":"coin","ten":"Đồng tiền","dung_o":"Tiền"},{"nhom":"bieu_tuong","ma":"close","ten":"Dấu X","dung_o":"Đóng, báo lỗi"},{"nhom":"bieu_tuong","ma":"eye","ten":"Con mắt","dung_o":"Xem, tầm đánh"},{"nhom":"bieu_tuong","ma":"out","ten":"Cửa ra","dung_o":"Đăng xuất"},{"nhom":"bieu_tuong","ma":"check","ten":"Dấu tích","dung_o":"Xong, thành công"},{"nhom":"bieu_tuong","ma":"next","ten":"Mũi tên","dung_o":"Tiếp, nhận việc"},{"nhom":"bieu_tuong","ma":"pen","ten":"Bút","dung_o":"Đặt tên"},{"nhom":"bieu_tuong","ma":"user","ten":"Người","dung_o":"Lính, đổi nhân vật"},{"nhom":"bieu_tuong","ma":"hand2","ten":"Hai tay","dung_o":"Vũ khí cầm hai tay"},{"nhom":"bieu_tuong","ma":"thunder","ten":"Sấm sét","dung_o":"Sách Lôi"},{"nhom":"bieu_tuong","ma":"wind","ten":"Gió","dung_o":"Sách Phong"},{"nhom":"bieu_tuong","ma":"ice","ten":"Băng","dung_o":"Sách Băng"},{"nhom":"bieu_tuong","ma":"demon","ten":"Ma công","dung_o":"Sách Ma công, quái thu phục"},{"nhom":"bieu_tuong","ma":"light","ten":"Ánh sáng","dung_o":"Sách Ánh sáng"},{"nhom":"bieu_tuong","ma":"spark","ten":"Tia sáng","dung_o":"Trí tuệ, Mana, kỹ năng Combo"},{"nhom":"bieu_tuong","ma":"whirl","ten":"Lốc xoáy","dung_o":"Kỹ năng Diện rộng"},{"nhom":"bieu_tuong","ma":"tiger","ten":"Hổ","dung_o":"Thú cưỡi hổ, trùm Chúa Sơn Lâm"},{"nhom":"bieu_tuong","ma":"anvil","ten":"Cái đe","dung_o":"Gia cường"},{"nhom":"bieu_tuong","ma":"bag","ten":"Túi đồ","dung_o":"Nút túi đồ, nhặt đồ"},{"nhom":"bieu_tuong","ma":"home","ten":"Ngôi nhà","dung_o":"Về làng"},{"nhom":"bieu_tuong","ma":"sound","ten":"sound","dung_o":""},{"nhom":"bieu_tuong","ma":"save","ten":"Lưu","dung_o":"Nút lưu"},{"nhom":"bieu_tuong","ma":"quest","ten":"Nhiệm vụ","dung_o":"Nút nhiệm vụ, theo dõi việc"},{"nhom":"bieu_tuong","ma":"aim","ten":"Khóa mục tiêu","dung_o":"Nút khóa mục tiêu khi cầm cung, nỏ; chỉ số chính xác"},{"nhom":"bieu_tuong","ma":"menu","ten":"Menu","dung_o":"Nút menu góc trên (ba gạch)"},{"nhom":"bieu_tuong","ma":"map","ten":"Bản đồ","dung_o":"Nút chọn bản đồ trong menu"},{"nhom":"quai","ma":"deer","ten":"Hươu","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"lion","ten":"Sư tử","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"elephant","ten":"Voi rừng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"croc","ten":"Cá sấu","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"chua-son-lam","ten":"Chúa Sơn Lâm (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ngu-tinh","ten":"Ngư Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"bo-cap","ten":"Bọ cạp cát","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ken-ken","ten":"Kền kền","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"chan-tinh","ten":"Chằn Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"thach-tinh","ten":"Thạch Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"soi-tuyet","ten":"Sói tuyết","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"gau-nui","ten":"Gấu ngựa","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ho-tinh","ten":"Hồ Tinh chín đuôi (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"doi-quy","ten":"Dơi quỷ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"nhen-doc","ten":"Nhện độc","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"dai-bang","ten":"Đại Bàng Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ke-trom-cho","ten":"Kẻ trộm chó","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"linh-phuong-bac","ten":"Lính phương Bắc","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tuong-phuong-bac","ten":"Tướng phương Bắc","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"dao-tac","ten":"Đạo tặc","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ho-du","ten":"Hổ dữ sổng chuồng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"gian-te","ten":"Gian tế áo đen","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"khi-rung","ten":"Khỉ rừng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ran-ho","ten":"Rắn hổ mang","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"moc-tinh","ten":"Mộc Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"dia-khong-lo","ten":"Đỉa khổng lồ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ech-doc","ten":"Ếch độc","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"xa-tinh","ten":"Xà Tinh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ung-tuyet","ten":"Ưng tuyết","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"de-nui","ten":"Dê núi","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"loi-dieu","ten":"Lôi Điểu (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"am-binh","ten":"Âm binh","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"quy-doi","ten":"Quỷ đói","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tuong-am-binh","ten":"Tướng Âm Binh (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"cua-khong-lo","ten":"Cua khổng lồ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"muc-ma","ten":"Mực ma","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"thuong-luong","ten":"Thuồng Luồng (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"nham-thach-thu","ten":"Nham thạch thú","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"quy-lua","ten":"Quỷ lửa","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hoa-long","ten":"Hỏa Long (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ma-troi","ten":"Ma trơi","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"quy-cay","ten":"Quỷ cây","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"chua-quy","ten":"Chúa Quỷ (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"voi-ma-mut","ten":"Voi ma mút","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"yeu-tuyet","ten":"Yêu tuyết","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"bang-hoang","ten":"Băng Hoàng (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"phan-quan","ten":"Phản quân","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hac-ky","ten":"Hắc kỵ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hac-long-tuong","ten":"Hắc Long Tướng (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"thien-binh","ten":"Thiên binh","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ky-lan","ten":"Kỳ lân","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ma-vuong","ten":"Ma Vương (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tom-tuong","ten":"Tôm tướng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ca-kiem","ten":"Cá kiếm","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"long-vuong","ten":"Long Vương Thủy Phủ (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"xuong-kho","ten":"Xương khô","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"bo-cap-den","ten":"Bọ cạp đen","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hac-mo-vuong","ten":"Hắc Mộ Vương (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tien-hac","ten":"Tiên hạc","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tuyet-vien","ten":"Tuyết viên","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"phong-vuong","ten":"Phong Vương (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tho-phi","ten":"Thổ phỉ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ngao-den","ten":"Ngao đen","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"su-quan","ten":"Sứ Quân Phản Loạn (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"nguu-dau","ten":"Ngưu Đầu","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ma-dien","ten":"Mã Diện","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"diem-la-tuong","ten":"Diêm La Tướng (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"giao-long","ten":"Giao long","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hai-quy","ten":"Hải quỷ","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hai-long-vuong","ten":"Hải Long Vương (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ho-ly","ten":"Hồ ly","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"yeu-tang","ten":"Yêu tăng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"cuu-vi-ho","ten":"Cửu Vĩ Hồ (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"tho-ngoc","ten":"Thỏ ngọc chiến binh","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"nguyet-binh","ten":"Nguyệt binh","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"nguyet-than","ten":"Nguyệt Thần (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"ngu-lam-phan","ten":"Ngự lâm phản loạn","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"chien-tuong","ten":"Chiến tượng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hac-de","ten":"Hắc Đế (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"thien-tuong","ten":"Thiên tướng","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"than-thu","ten":"Thần thú","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"quai","ma":"hac-thien-ma","ten":"Hắc Thiên Ma (trùm)","dung_o":"Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ, thanh máu trùm","link_anh":"","goi_y":"Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"logo","ten":"Logo Lữ Hành","dung_o":"Màn hình chờ, cổng đăng nhập","link_anh":"","goi_y":"Định dạng webp, nền trong suốt, ngang khoảng 480×200","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho","ten":"Màn hình chờ (loading screen) chung","dung_o":"Mọi màn hình chờ, khi chưa có ảnh riêng bên dưới","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho_tai_game","ten":"Màn hình chờ lúc mở trang","dung_o":"Thanh tải 0–100% khi mở trang và kết nối máy chủ","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho_tao_nv","ten":"Màn hình chờ tạo nhân vật","dung_o":"Lời dẫn câu chuyện khi bấm khởi tạo nhân vật","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_cho_vao_lang","ten":"Màn hình chờ vào làng","dung_o":"Khi bấm Vào làng, tải nhân vật và bản đồ","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_leu","ten":"Cảnh căn lều chọn nhân vật","dung_o":"Phía sau 5 ô nhân vật trước lều","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1200×700","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"nen_dang_nhap","ten":"Nền cổng đăng nhập","dung_o":"Phía sau khung đăng nhập và căn lều","link_anh":"","goi_y":"Định dạng webp, ảnh ngang 1920×1080","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"chan_dung_nam","ten":"Chân dung nhân vật nam","dung_o":"Ô chân dung góc trên trái","link_anh":"","goi_y":"Định dạng webp, vuông 256×256","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"chan_dung_nu","ten":"Chân dung nhân vật nữ","dung_o":"Ô chân dung góc trên trái","link_anh":"","goi_y":"Định dạng webp, vuông 256×256","gioi_tinh":"","ghi_chu":""},{"nhom":"giao_dien","ma":"tui_do_roi","ten":"Túi đồ rơi","dung_o":"Túi vải rơi ra khi hạ quái","link_anh":"","goi_y":"Định dạng webp, nền trong suốt 64×64","gioi_tinh":"","ghi_chu":""}];

// Dữ liệu mặc định (dùng khi tab Sheet còn trống và để chạy caiDat)
const LH_DEFAULT=(d=>Object.fromEntries(Object.entries(d).map(([k,[h,...rows]])=>[k,rows.map(r=>Object.fromEntries(h.map((c,i)=>[c,r[i]])))])))({"cau_hinh":[["khoa","gia_tri","ghi_chu"],["diem_khoi_tao",50,"Tổng điểm chia cho Sức mạnh, Nhanh nhẹn, Sức khỏe, Trí tuệ khi tạo nhân vật"],["menh_lenh_goc",10,"Mệnh lệnh ban đầu của mọi nhân vật"],["so_nhan_vat_toi_da",5,"Số nhân vật tối đa của một tài khoản"],["cung_chinh_xac",70,"Cung: tỉ lệ bắn trúng (%) khi bật khóa mục tiêu, chưa gia cường"],["no_chinh_xac",76,"Nỏ: tỉ lệ bắn trúng (%) khi bật khóa mục tiêu, chưa gia cường"],["chinh_xac_moi_cap",2,"Mỗi cấp gia cường cung / nỏ cộng thêm bao nhiêu % chính xác (tối đa 100%)"],["cung_no_x2",15,"Cầm cung / nỏ: cộng thêm % tỉ lệ gây sát thương x2 (vũ khí khác không có)"],["gioi_han_ha_quai",16,"Hạ tối đa bao nhiêu con cùng một loài quái thường trong một lượt hồi sinh (chống gian lận; bãi quái lớn cần số lớn)"],["nguoi_choi_ao",4,"Số người chơi ảo đi săn ở mỗi bản đồ (0 = tắt)"],["huong_dan_tan_thu",1,"v10.27 · Hướng dẫn tân thủ lần đầu vào Thanh Mộc (Béo Ca dắt ra bìa rừng, sư tử vồ). 0 = tắt"],["trum_ky_nang_giay",7,"Trùm ra chiêu đặc biệt (cột ky_nang ở tab quai) cách nhau bao nhiêu giây"],["dong_do_mac","def,hp,dodge,reflect,hpReg,mp","Đồ mặc: các chỉ số có thể ra dòng ngẫu nhiên (mã ở tab thuoc_tinh, cách nhau dấu phẩy)"],["cuong_hoa_5_mau",80,"Mặc 5 món từ +9: cộng thêm máu"],["cuong_hoa_bo_mau",150,"Đủ 8 ô đồ từ +9: cộng thêm máu"],["cuong_hoa_bo_sat_thuong",10,"Đủ 8 ô đồ từ +9: cộng thêm % sát thương"],["tien_thu_nghiem",9999999,"Tiền (đồng) cho nhân vật mới: 999 vàng 99 bạc 99 đồng. 100 đồng = 1 bạc, 100 bạc = 1 vàng"],["hong_ngoc_thu_nghiem",999,"Hồng ngọc cho nhân vật mới"],["ti_le_ban_lai",40,"% giá gốc nhận lại khi bán cho cửa hàng"],["he_so_gia_do_dep",250,"Giá đồ Đẹp trong cửa hàng = % này của giá gốc"],["he_so_gia_hoan_hao",600,"Giá đồ Hoàn hảo trong hiệu buôn thành trì = % này của giá gốc"],["dung_hop_ngoc",60,"Dung hợp cánh (NPC Luyện khí sư): số hồng ngọc tốn mỗi lần"],["dung_hop_ti_le",40,"Dung hợp cánh: tỉ lệ thành công (%)"],["dung_hop_thu_cap",9,"Dung hợp cánh: thú cưỡi phải gia cường tới cấp này"],["dung_hop_dong","0,30,28,22,12,6,2","Dung hợp cánh: tỉ lệ (%) ra 0,1,2,3,4,5 dòng (6 số, cách nhau dấu phẩy; số đầu bỏ qua)"],["canh_dong","dmgMax,dmgMin,def,hp,mp,range,crit3","Dung hợp cánh: các chỉ số có thể ra dòng"],["nap_ngan_hang","MB","Nạp thẻ: mã ngân hàng theo VietQR (MB = Quân đội)"],["nap_so_tai_khoan","2220181818888","Nạp thẻ: số tài khoản nhận tiền"],["nap_ten_tai_khoan","TRAN ANH NGUYET","Nạp thẻ: tên chủ tài khoản (không dấu)"],["nap_noi_dung","Ikyna {goi} {tai_khoan}","Nạp thẻ: nội dung chuyển khoản ({goi} = tên gói, {tai_khoan} = tên đăng nhập)"],["phi_cho",5,"% thương nhân giữ lại khi bán hộ trên chợ và khi bán nhân vật đánh thuê"],["mau_goc",60,"Máu = mau_goc + Sức khỏe × mau_moi_diem"],["mau_moi_diem",5,""],["mana_goc",40,"Mana = mana_goc + Trí tuệ × mana_moi_diem"],["mana_moi_diem",4,""],["hoa_sat_thuong",25,"Sách Hỏa: % sát thương"],["thuy_hoi_mana",3,"Sách Thủy: mana mỗi giây"],["tho_phan_don",30,"Sách Thổ: % phản đòn"],["kim_giam_sat_thuong",25,"Sách Kim: % giảm sát thương"],["moc_hoi_mau",2,"Sách Mộc: máu mỗi giây"],["vung_an_toan_x",27,"Ô bản đồ từ cột 0 đến cột này là vùng an toàn (làng)"],["bo_cong_vu_khi",16,"Đồ bộ huyền thoại: công vũ khí gốc"],["bo_thu_khien",10,"Đồ bộ: thủ của khiên"],["bo_thu_ao",12,"Đồ bộ: thủ của áo giáp"],["bo_thu_nho",6,"Đồ bộ: thủ của mũ, quần, găng, giày, cánh"],["bo_toc_thu_cuoi",155,"Đồ bộ: tốc độ thú cưỡi (% tốc đi bộ)"],["gia_do_bo",5000,"Giá gốc món đồ bộ (để tính giá bán lại)"],["gieng_hoi_giay",300,"Giếng cổ: số giây để nước đầy lại sau khi dùng"],["exp_goc",60,"Kinh nghiệm cần để lên cấp 2. Cấp L cần exp_goc × L^(exp_tang/100)"],["exp_tang",150,"Độ tăng kinh nghiệm cần mỗi cấp (150 = lũy thừa 1,5)"],["cap_toi_da",400,"Cấp cao nhất của nhân vật (v10.12: 400)"],["diem_moi_cap",5,"Điểm cộng chỉ số nhận được mỗi lần lên cấp"],["sach_chi_so",4,"Mỗi sách gắn vào ô kỹ năng cộng chừng này điểm vào chỉ số theo hệ (Mộc chia đôi cho Sức khỏe và Trí tuệ)"],["sach_moi_cap",2,"Mỗi cấp gia cường sách cộng thêm"],["thu_cuoi_toc_cap",3,"Thú cưỡi: % tốc độ mỗi cấp gia cường (+1 đến +15)"],["thu_cuoi_cong_cap",2,"Thú cưỡi: công mỗi cấp từ +7"],["thu_cuoi_mau_cap",20,"Thú cưỡi: máu mỗi cấp từ +11"],["thu_cuoi_mana_cap",10,"Thú cưỡi: mana mỗi cấp từ +11"],["thu_cuoi_thu_cap",2,"Thú cưỡi: phòng ngự mỗi cấp từ +11"],["sach_ti_le_cap",1,"Sách Lôi, Phong, Băng, Ánh sáng, Ma công: mỗi cấp gia cường cộng thêm % tỉ lệ kích hoạt"],["loi_ti_le",12,"Sách Lôi: % mỗi đòn trúng có thêm một đạo lôi quang đánh xuống"],["loi_sat_thuong",150,"Sách Lôi: sát thương lôi quang = % sát thương đòn đánh"],["phong_ti_le",20,"Sách Phong: % làm chậm quái"],["phong_cham",45,"Sách Phong: % giảm tốc độ quái"],["phong_ms",3000,"Sách Phong: thời gian chậm (mili giây)"],["bang_ti_le",10,"Sách Băng: % đóng băng quái"],["bang_ms",1800,"Sách Băng: thời gian đóng băng (mili giây), trùm còn một nửa"],["sang_ti_le",15,"Sách Ánh sáng: % khi bị đánh trúng làm quái hoảng sợ bỏ chạy"],["sang_ms",2500,"Sách Ánh sáng: thời gian quái bỏ chạy (mili giây), trùm còn một nửa"],["ma_ti_le_goc",2,"Sách Ma công: % thu phục quái khi hạ (không áp dụng cho trùm)"],["ma_phan_van_moi_menh_lenh",20,"Sách Ma công: mỗi điểm Mệnh lệnh cộng thêm chừng này phần vạn tỉ lệ (20 = 0,2%)"],["ma_toi_da",2,"Số quái thu phục tối đa đi theo. Quái chết là mất hẳn"],["pham_chat_roi_toi_da","p","Phẩm chất cao nhất rơi ra ở bản đồ này (n Thường, g Đẹp, p Hoàn hảo, l Huyền thoại, m Thần). Đồ cao hơn không rơi, phần thưởng nhiệm vụ cũng không vượt mức này"],["chieu_mo_hong_ngoc",100,"v10.14 · Đơn chiêu mộ ở bảng lính thành trì: hồng ngọc mỗi lần gửi"],["chieu_mo_ti_le","55,33,10.7,1,0.3","v10.14 · Đơn chiêu mộ: % ra lính thường, tinh nhuệ, thiện chiến, huyền thoại, thần thoại"],["linh_he_so","1,1.5,2,3,4","v10.14 · Máu và sát thương lính theo phẩm cấp (thường, tinh nhuệ, thiện chiến, huyền thoại, thần thoại) nhân với lính thường"],["suc_khoe_hoi_day",2,"v10.14 · Sức khỏe: mỗi 100 điểm cộng thêm % tỉ lệ hồi đầy máu khi trúng đòn (tối đa 20%)"],["tri_tue_chinh_xac",4,"v10.14 · Trí tuệ: mỗi 100 điểm cộng thêm % chính xác cung, nỏ"],["tri_tue_hoi_mana",2,"v10.14 · Trí tuệ: mỗi 100 điểm cộng thêm mana hồi mỗi giây"],["menh_lenh_sat_thuong",50,"v10.14 · Mệnh lệnh: mỗi 100 điểm cộng thêm % sát thương cho lính thuê và quái thu phục"],["linh_nhan_chi_so",2,"v10.16 · Máu và sát thương mọi lính đánh thuê nhân với số này (nhân thêm với hệ số phẩm cấp linh_he_so)"],["linh_nhan_menh_lenh",10,"v10.16 · Mệnh lệnh cần để cho một lính đi theo = cột menh_lenh của lính × số này"],["quai_nhan_mau",1,"v10.19 · Đặt 1: máu, sát thương, kinh nghiệm quái đã tính lại theo cấp vùng (tools/canbang.mjs). Máu mọi quái và boss nhân với số này (0.25 = còn 1/4). Quái thu phục giữ máu gốc"],["quai_nhan_sat_thuong",1,"v10.19 · Đặt 1: máu, sát thương, kinh nghiệm quái đã tính lại theo cấp vùng (tools/canbang.mjs). Sát thương mọi quái và boss nhân với số này (0.25 = còn 1/4). Quái thu phục giữ sát thương gốc"],["thu_cuoi_nhan_gia",20,"v10.16 · Giá thú cưỡi ở cửa hàng nhân với số này (giá bán lại cũng theo)"],["thu_phuc_sat_thuong",0.5,"v10.17 · Sát thương quái thu phục nhân với số này (0.5 = còn 1/2)"],["linh_huyen_than_them",0.25,"v10.17 · Lính huyền thoại, thần thoại: thêm phần này vào máu, sát thương, phòng ngự (0.25 = thêm 25%)"],["boss_nhan",1,"v10.19 · Đặt 1: máu, sát thương, kinh nghiệm quái đã tính lại theo cấp vùng (tools/canbang.mjs). Máu và sát thương boss nhân thêm số này (sau quai_nhan_mau, quai_nhan_sat_thuong)"],["thu_cuoi_nhan_chi_so",2,"v10.17 · Công, thủ của mọi thú cưỡi và sát thương đòn thú cưỡi (phím 4) nhân với số này"],["thu_cuoi_menh_lenh_cap",0.5,"v10.17 · Thú cưỡi bán ở thành: Mệnh lệnh cần = mức của loài + cấp thành × số này (Cổ Loa 70 → +35, Phú Xuân 290 → +145)"],["quai_nhan_tien",0.1,"v10.17 · Tiền nhận khi hạ quái nhân với số này (0.1 = còn 1/10)"],["quai_nhan_kinh_nghiem",1,"v10.19 · Đặt 1: máu, sát thương, kinh nghiệm quái đã tính lại theo cấp vùng (tools/canbang.mjs). Kinh nghiệm nhận khi hạ quái nhân với số này (0.1 = còn 1/10, tối thiểu 1)"],["quai_tien_toi_da",9999,"v10.17 · Tiền tối đa mỗi con quái (đồng). 9999 = 99 bạc 99 đồng, không bao giờ ra vàng. 0 = không giới hạn"],["quai_roi_do",0,"v10.17 · 1 = quái rơi hồng ngọc và đồ như cũ; 0 = quái không rơi gì"],["uy_luc_pham_chat","0,1,3,8,8","v10.19 · Uy lực trang bị: mỗi món đang mặc cộng % sát thương và % máu theo phẩm chất (Thường, Đẹp, Hoàn hảo, Huyền thoại, Thần)"],["uy_luc_moi_cap","0.3,0.3,0.4,1.2,0.9","v10.19 · Uy lực cộng thêm cho mỗi cấp cường hóa, theo phẩm chất (Huyền thoại +15 = 26%/món, Thần +12 ≈ 19%/món — đồ thần chỉ số gốc gấp đôi nên trọn bộ Thần +12 ≈ Huyền thoại +15)"],["cap_thien_dinh",400,"v10.19 · Cấp vào Thiên Đình (boss cuối Hắc Thiên Ma): chỉ người chơi cấp tối đa. Từ cấp 290 luyện ở Phú Xuân"],["uy_luc_sat_thuong",100,"v10.19 · % uy lực tính vào sát thương (100 = đủ)"],["uy_luc_mau",100,"v10.19 · % uy lực tính vào máu tối đa (100 = đủ)"],["sach_bac_cap","0,70,170,235,290","v10.21 · Cấp thành của 5 bậc sách: sách bán ở thành cấp này trở lên thuộc bậc đó (Thanh Mộc, Cổ Loa, Thăng Long, Hoa Lư, Phú Xuân)"],["sach_chi_so_bac","3,8,15,25,40","v10.21 · Điểm cộng vào chỉ số của sách Thường theo bậc (Mộc chia đôi cho Sức khỏe và Trí tuệ)"],["sach_menh_lenh_bac","5,10,15,20,20","v10.21 · Sách Ma công: điểm Mệnh lệnh cộng theo bậc (sách Thường)"],["sach_moi_cap_bac","0.5,1,1.5,2,3","v10.21 · Mỗi cấp luyện sách cộng thêm chừng này điểm, theo bậc (làm tròn)"],["sach_pham_chat_he_so","1,1.3,1.7,2.3,3","v10.21 · Điểm cộng của sách nhân theo phẩm chất (Thường, Đẹp, Hoàn hảo, Huyền thoại, Thần)"],["sach_hieu_ung_bac","0.4,0.6,0.8,1,1.2","v10.21 · Độ mạnh hiệu ứng sách theo bậc (nhân với số gốc: Hỏa % sát thương, Thủy mana/giây, Thổ % phản đòn, Kim % giảm sát thương, Mộc máu/giây, tỉ lệ Lôi / Phong / Băng / Ánh sáng / Ma công)"],["sach_hieu_ung_pham_chat","1,1.15,1.3,1.5,1.8","v10.21 · Độ mạnh hiệu ứng sách nhân theo phẩm chất"],["sach_gia_pham_chat","1,5,20,100,400","v10.21 · Giá sách (tiền) nhân theo phẩm chất"],["sach_hong_ngoc_pham_chat","0,0,0,20,100","v10.21 · Sách Huyền thoại, Thần: thêm giá hồng ngọc (nhân với hệ số bậc ở dòng dưới)"],["sach_hong_ngoc_bac","1,2,4,7,10","v10.21 · Hệ số giá hồng ngọc theo bậc (Thần Phú Xuân = 100 × 10 = 1.000 hồng ngọc)"],["ma_so_quai_bac","1,2,2,3,3","v10.21 · Sách Ma công: số quái thu phục tối đa theo bậc"],["ma_so_quai_pham_chat","0,0,0,1,1","v10.21 · Sách Ma công Huyền thoại, Thần: thêm chừng này quái"],["ma_boss_bac","0,0,0.05,0.1,0.2","v10.21 · Sách Ma công: tỉ lệ thu phục trùm vùng = tỉ lệ thường × số này theo bậc (0 = không thu phục được trùm). Trùm cuối, trùm thế giới không thu phục được"],["ma_boss_sat_thuong",0.3,"v10.21 · Trùm thu phục: sát thương nhân thêm số này (sau thu_phuc_sat_thuong)"],["thu_phuc_tri_tue","0,60,150,300,600","v10.21 · Mốc Trí tuệ quyết định thời gian giữ quái thu phục (ứng với dòng thu_phuc_phut)"],["thu_phuc_phut","1,10,60,600,0","v10.21 · Số phút quái thu phục ở lại theo từng mốc Trí tuệ (0 = vĩnh viễn). Trùm thu phục giảm một mốc"],["thu_cuoi_menh_lenh_pham_chat","0,5,15,30,60","v10.21 · Mệnh lệnh cần thêm theo phẩm chất thú (Thường, Đẹp, Hoàn hảo, Huyền thoại, Thần)"],["thu_cuoi_menh_lenh_moi_cap",1,"v10.21 · Mỗi cấp gia cường thú cưỡi cần thêm chừng này Mệnh lệnh"],["thu_cuoi_cap_bo_huyen_thoai",250,"v10.21 · Thú cưỡi trong bộ Huyền thoại (không bán ở cửa hàng): tính như thú bán ở thành cấp này"],["thu_cuoi_cap_bo_than",330,"v10.21 · Thú cưỡi Thần (bộ Thần, ngựa sắt…): tính như thú bán ở thành cấp này"],["ruong_so_o",60,"v10.21 · Số ô đồ trong rương chung của mỗi tài khoản"],["sach_gia_nhan",100,"v10.22 · Giá mua sách nhân số này (so với bản 10.21)"],["sach_gia_moi_thanh",2,"v10.24 · Giá sách ở mỗi thành kế tiếp gấp chừng này lần thành trước (Thanh Mộc ×1, Cổ Loa ×2, Thăng Long ×4, Hoa Lư ×8, Phú Xuân ×16). Cột gia của dòng sách ở tab cua_hang không còn dùng"],["thu_cuoi_gia_lang",5,"v10.24 · Giá thú cưỡi ở làng Thanh Mộc nhân thêm số này"],["thu_cuoi_gia_moi_thanh",2,"v10.24 · Giá thú cưỡi trung bình ở mỗi nơi bán kế tiếp (Cổ Loa, Thăng Long, Hoa Lư, Phú Xuân) gấp chừng này lần nơi trước"],["thu_cuoi_gia_thanh",10,"v10.26 · Giá thú cưỡi ở các thành (Cổ Loa trở đi) nhân thêm số này; Thanh Mộc giữ nguyên"],["tuong_diem_huyen_thoai",1800,"v10.25 · Danh tướng Huyền thoại: tổng điểm chỉ số cố định (không theo cấp, không theo nơi chiêu mộ)"],["tuong_diem_than",2600,"v10.25 · Danh tướng Thần thoại: tổng điểm chỉ số cố định"],["tuong_gia_huyen_thoai",500,"v10.25 · Giá thuê danh tướng Huyền thoại (hồng ngọc), như nhau mọi nơi"],["tuong_gia_than",2000,"v10.25 · Giá thuê danh tướng Thần thoại (hồng ngọc), như nhau mọi nơi"],["linh_mau_toi_thieu","6,8,10,25,35","v10.24 · Lính đủ cấp vùng: máu tối thiểu = số này × sát thương quái thường của vùng (Thường, Tinh nhuệ, Thiện chiến, Huyền thoại, Thần thoại)"],["linh_giam_sat_thuong","0,10,20,35,45","v10.24 · % giảm sát thương lính nhận vào theo phẩm cấp"],["linh_hoi_mau","0.5,1,1.5,3,4","v10.24 · % máu lính tự hồi mỗi giây ngoài vùng an toàn theo phẩm cấp"],["linh_hoi_ngoai_tran",6,"v10.24 · 5 giây không trúng đòn thì lính hồi thêm % máu mỗi giây này"],["linh_cap_lech",10,"v10.24 · Lính có cấp ≥ cấp vùng − số này mới được máu tối thiểu"],["linh_quet_vong",0.8,"v10.24 · Lính Huyền thoại, Thần bị từ 3 quái vây: đòn quét một vòng, sát thương × số này"],["sach_roi_huyen_thoai_phan_van",300,"v10.22 · Sách Huyền thoại chỉ rơi từ trùm: phần vạn mỗi lần hạ trùm vùng (300 = 3%; trùm thế giới ×3). Cửa hàng chỉ bán tới Hoàn hảo"],["sach_roi_than_phan_van",50,"v10.22 · Sách Thần chỉ rơi từ trùm: phần vạn mỗi lần hạ trùm vùng (50 = 0,5%; trùm thế giới ×3)"],["boss_nhan_sat_thuong",1.2,"v10.22 · Sát thương trùm vùng nhân thêm số này (1.2 = +20%). Hắc Đế, Hắc Thiên Ma giữ nguyên (đã cân cho mốc 1 năm)"],["nguoi_choi_ao_thanh",5,"v10.22 · Số người chơi ảo đi lại trong làng / thành (0 = tắt)"],["nguoi_choi_ao_chay_giay",60,"v10.22 · Trung bình bao nhiêu giây lại có một người chơi ảo bị quái rượt, ít máu, chạy về làng / thành (0 = tắt)"],["link_cho_phien","https://ikynagame.blogspot.com/p/cho-phien.html","Địa chỉ trang Chợ phiên (mua bán giữa người chơi, nhân vật đi theo)"],["quiz_sai_toi_da",1,"Thầy đồ: số câu sai tối đa vẫn được thưởng (trong 5 câu)"],["quiz_lan_thu",2,"Thầy đồ: trả lời sai quá số lần này thì phải đi săn quái lấy manh mối"],["quiz_san_so_luong",8,"Thầy đồ: số quái phải săn để được chỉ đáp án (bỏ trống cột so_luong ở bo_cau_hoi thì dùng số này)"],["quiz_thuong_lo",50,"Thầy đồ: % thưởng khi trả lời sau khi được chỉ đáp án"],["quiz_kinh_nghiem",300,"Thầy đồ: kinh nghiệm thưởng mỗi bộ câu hỏi (nhân với thứ tự bộ)"],["chet_mat_do",1,"Gục ngã thì mất toàn bộ đồ đang mặc (1 = bật, 0 = tắt). Cấp, sách, lính, thú thu phục, túi đồ giữ nguyên"],["linh_thanh_he_so",100,"Lính thành trì: % chỉ số so với bảng linh (chỉnh độ mạnh chung)"],["linh_diem_cap",3,"v10.13 · Lính thành trì chào thuê: điểm chỉ số cộng thêm mỗi cấp (chia ngẫu nhiên vào 4 chỉ số, đổi suất mỗi ngày)"],["su_kien_phut",5,"v10.13 · Sự kiện đột xuất ở làng / thành: bao nhiêu phút một lần (theo mốc đồng hồ)"],["co_may_man_toi_da",10,"v10.13 · Cỏ may mắn: số cỏ dùng tối đa một lần gia cường / dung hợp (mỗi cỏ +1% tỉ lệ)"]],"gia_cuong":[["cap","ti_le","phi_hong_ngoc","that_bai_tu","that_bai_den"],[0,100,2,"",""],[1,100,2,"",""],[2,100,3,"",""],[3,100,3,"",""],[4,100,4,"",""],[5,100,4,"",""],[6,50,6,5,5],[7,50,7,6,6],[8,50,8,7,7],[9,44,9,8,8],[10,38,11,9,9],[11,33,12,10,10],[12,27,13,11,11],[13,21,14,12,12],[14,15,15,13,13]],"pham_chat":[["ma","ten","mau","he_so","so_dong","bac","giao_dich","mua_duoc"],["n","Thường","#e8e6df",100,0,0,"khong","co"],["g","Đẹp","#ffd54a",110,1,1,"khong","co"],["p","Hoàn hảo","#5aa9ff",125,2,2,"co","khong"],["l","Huyền thoại","#c8823e",150,3,3,"co","khong"],["m","Thần","#ff6fb5",200,4,4,"co","khong"]],"thuoc_tinh":[["ma","ten","nhom","don_vi","dep_thap","dep_cao","hoan_hao_thap","hoan_hao_cao","huyen_thoai_thap","huyen_thoai_cao","than_thap","than_cao"],["str","Sức mạnh","str","",1,2,2,4,4,7,8,12],["agi","Nhanh nhẹn","agi","",1,2,2,4,4,7,8,12],["vit","Sức khỏe","vit","",1,2,2,4,4,7,8,12],["int","Trí tuệ","int","",1,2,2,4,4,7,8,12],["cmd","Mệnh lệnh","cmd","",1,1,1,2,2,4,4,6],["dmgMax","Sát thương cao nhất","str","",1,3,3,6,6,10,12,20],["dmgMin","Sát thương nhỏ nhất","str","",1,2,2,4,4,7,8,14],["acc","Sát thương chính xác","str","%",1,2,2,4,4,7,8,12],["crit2","Tỉ lệ sát thương x2","str","%",1,2,2,4,4,6,7,10],["crit3","Tỉ lệ sát thương x3","str","%",1,1,1,2,2,3,3,5],["trueDmg","Sát thương chuẩn","str","",1,2,2,5,5,9,10,18],["perfDmg","Sát thương hoàn hảo","str","%",1,1,1,3,3,5,5,8],["legDmg","Sát thương huyền thoại","str","%",1,1,1,2,2,4,4,6],["mythDmg","Sát thương thần thoại","str","%",1,1,1,1,1,2,3,5],["atkSpd","Tốc độ đánh","agi","%",1,3,3,6,6,10,10,15],["moveSpd","Tốc độ di chuyển","agi","%",1,2,2,4,4,7,8,12],["def","Khả năng phòng ngự","agi","",1,2,2,4,4,7,8,14],["block","Phòng ngự thành công","agi","%",1,2,2,4,4,6,7,10],["dodge","Tránh né","agi","%",1,2,2,3,3,5,6,9],["dmgRed","Giảm sát thương","agi","%",1,2,2,4,4,6,7,10],["perfRed","Giảm sát thương hoàn hảo","agi","%",1,2,2,4,4,6,7,10],["critRed","Giảm sát thương x2, x3","agi","%",1,2,2,4,4,6,7,10],["legRed","Giảm sát thương huyền thoại","agi","%",1,2,2,4,4,6,7,10],["mythRed","Giảm sát thương thần thoại","agi","%",1,2,2,3,3,5,5,8],["hp","Lượng máu","vit","",5,10,10,20,20,40,50,80],["hpReg","Hồi máu mỗi giây","vit","",1,1,1,2,2,3,3,5],["reflect","Phản đòn","vit","%",1,2,2,4,4,7,8,12],["range","Tầm đánh","agi","%",3,5,5,8,8,12,12,18],["mp","Lượng mana","int","",4,8,8,16,16,30,40,60],["mpReg","Hồi mana mỗi giây","int","",1,1,1,2,2,3,3,5],["cdr","Giảm thời gian hồi chiêu","int","%",1,2,2,4,4,6,7,10],["fullHeal","Hồi đầy máu khi trúng đòn","vit","%",1,1,1,1,1,2,2,3],["aim","Chính xác tầm xa","int","%",1,2,2,4,4,6,6,10],["mercDmg","Sát thương lính thuê","cmd","%",1,2,2,4,4,7,8,12],["petDmg","Sát thương quái thu phục","cmd","%",1,2,2,4,4,7,8,12]],"vat_pham":[["id","ten","o","loai","cam","cong","thu","toc","gia","mau","thu_cuoi","menh_lenh","he","pham_chat","hieu_ung","gia_tri","mo_ta","gia_hong_ngoc","anh"],["sword","Kiếm tập","hand","sword","one",2,0,0,40,"","",0,"","","",0,"",null,null],["sword-iron","Kiếm sắt","hand","sword","one",6,0,0,150,"#d5dde2","",0,"","","",0,"",null,null],["sword-steel","Kiếm thép","hand","sword","one",11,0,0,480,"#a8dcf0","",0,"","","",0,"",null,null],["shield","Khiên tập","hand","shield","one",0,2,0,40,"","",0,"","","",0,"",null,null],["shield-wood","Khiên mây","hand","shield","one",0,4,0,120,"#a8864a","",0,"","","",0,"",null,null],["shield-iron","Khiên đồng","hand","shield","one",0,8,0,420,"#b08a4a","",0,"","","",0,"",null,null],["staff","Gậy tập","hand","staff","one",2,0,0,40,"","",0,"","","",0,"",null,null],["staff-jade","Gậy ngọc","hand","staff","one",8,0,0,360,"#7fe0b0","",0,"","","",0,"",null,null],["bow","Cung tập","hand","bow","two",3,0,0,50,"","",0,"","","",0,"",null,null],["bow-hunt","Cung săn","hand","bow","two",9,0,0,380,"#9a6430","",0,"","","",0,"",null,null],["spear","Giáo tập","hand","spear","two",3,0,0,50,"","",0,"","","",0,"",null,null],["spear-iron","Giáo sắt","hand","spear","two",10,0,0,400,"#d5dde2","",0,"","","",0,"",null,null],["saber-iron","Đao sắt","hand","saber","one",9,0,0,420,"#cfd6da","",0,"","","",0,"",null,null],["mace-iron","Chùy sắt","hand","mace","one",12,0,0,520,"#8a8f96","",0,"","","",0,"",null,null],["crossbow","Nỏ tập","hand","crossbow","two",4,0,0,60,"","",0,"","","",0,"",null,null],["crossbow-war","Nỏ chiến","hand","crossbow","two",13,0,0,560,"#4a3524","",0,"","","",0,"",null,null],["hat","Nón lá","hat","hat","",0,1,0,30,"","",0,"","","",0,"",null,null],["hat-iron","Nón dấu","hat","hat","",0,3,0,180,"#6b4a2e","",0,"","","",0,"",null,null],["armor","Áo vải","armor","armor","",0,2,0,60,"","",0,"","","",0,"",null,null],["armor-leather","Áo da","armor","armor","",0,4,0,200,"#8a5a34","",0,"","","",0,"",null,null],["armor-iron","Giáp đồng","armor","armor","",0,8,0,600,"#a07a40","",0,"","","",0,"",null,null],["pants","Quần vải","pants","pants","",0,1,0,30,"","",0,"","","",0,"",null,null],["pants-guard","Quần giáp","pants","pants","",0,3,0,180,"#5d4a34","",0,"","","",0,"",null,null],["gloves","Bao tay","gloves","gloves","",0,1,0,30,"","",0,"","","",0,"",null,null],["gloves-leather","Bao tay da","gloves","gloves","",0,2,0,120,"#6b4a2e","",0,"","","",0,"",null,null],["shoes","Dép cỏ","shoes","shoes","",0,1,0,30,"","",0,"","","",0,"",null,null],["shoes-leather","Giày da","shoes","shoes","",0,2,0,120,"#5b3d26","",0,"","","",0,"",null,null],["shoes-iron","Ủng đồng","shoes","shoes","",0,4,0,300,"#8a6a3a","",0,"","","",0,"",null,null],["wings","Áo choàng","wings","wings","",0,1,0,900,"","",0,"","","",0,"",null,null],["canh-thien-than","Cánh thiên thần","wings","wings","",0,6,0,30000,"#f4f0ff","",0,"","","",0,"",null,null],["canh-ac-quy","Cánh ác quỷ","wings","wings","",0,6,0,30000,"#5a1a3a","",0,"","","",0,"",null,null],["canh-tien-nu","Cánh tiên nữ","wings","wings","",0,6,0,30000,"#ffc0e8","",0,"","","",0,"",null,null],["canh-anh-sang","Cánh ánh sáng","wings","wings","",0,6,0,30000,"#fff0a0","",0,"","","",0,"",null,null],["canh-xuong","Cánh xương","wings","wings","",0,6,0,30000,"#e8e0d0","",0,"","","",0,"",null,null],["canh-loi-phong","Cánh lôi phong","wings","wings","",0,6,0,30000,"#a0c8ff","",0,"","","",0,"",null,null],["canh-dai-bang","Cánh đại bàng","wings","wings","",0,6,0,30000,"#8a5a30","",0,"","","",0,"",null,null],["canh-lua","Cánh lửa","wings","wings","",0,6,0,30000,"#ff8a3d","",0,"","","",0,"",null,null],["mount","Ngựa con","mount","mount","",0,0,115,200,"#b78452","horse",5,"","","",0,"",null,null],["mount-brown","Ngựa nâu","mount","mount","",0,0,125,600,"#7a4b2a","horse",5,"","","",0,"",null,null],["mount-black","Ngựa ô","mount","mount","",0,0,135,1200,"#2e2a2a","horse",5,"","","",0,"",null,null],["mount-white","Bạch mã","mount","mount","",0,0,150,2500,"#ece6da","horse",5,"","","",0,"",null,null],["mount-tiger","Hổ","mount","mount","",4,0,145,4000,"#e08a2e","tiger",10,"","","",0,"",null,null],["mount-elephant","Voi","mount","mount","",0,8,120,6000,"#8e9398","elephant",15,"","","",0,"",null,null],["ore","Khoáng thạch","","ore","",0,0,0,20,"","",0,"","","",0,"",null,null],["book-fire","Sách Hỏa","book","book","",0,0,0,400,"","",0,"fire","","",0,"",null,null],["book-water","Sách Thủy","book","book","",0,0,0,300,"","",0,"water","","",0,"",null,null],["book-earth","Sách Thổ","book","book","",0,0,0,450,"","",0,"earth","","",0,"",null,null],["book-metal","Sách Kim","book","book","",0,0,0,450,"","",0,"metal","","",0,"",null,null],["book-wood","Sách Mộc","book","book","",0,0,0,300,"","",0,"wood","","",0,"",null,null],["book-loi","Sách Lôi","book","book","",0,0,0,900,"","",0,"thunder","","",0,"",null,null],["book-phong","Sách Phong","book","book","",0,0,0,700,"","",0,"wind","","",0,"",null,null],["book-bang","Sách Băng","book","book","",0,0,0,800,"","",0,"ice","","",0,"",null,null],["book-ma","Sách Ma công","book","book","",0,0,0,1500,"","",0,"demon","","",0,"",null,null],["book-sang","Sách Ánh sáng","book","book","",0,0,0,1000,"","",0,"light","","",0,"",null,null],["av-tuong-quan","Thẻ avatar Tướng quân","cos","avatar","",0,0,0,0,"","",0,"","","",0,"Mua xong thay ngay ảnh chân dung ở khung trên và lều nhân vật (giữ mãi, đổi qua lại ở bảng Phấn Son)",40,"https://drive.google.com/file/d/1LUSY5q3cEGNu4VECWZGa_VOalCcphoUx/view"],["av-hiep-khach","Thẻ avatar Hiệp khách","cos","avatar","",0,0,0,0,"","",0,"","","",0,"Mua xong thay ngay ảnh chân dung ở khung trên và lều nhân vật (giữ mãi, đổi qua lại ở bảng Phấn Son)",40,"https://drive.google.com/file/d/1_9hVbAhxETPwldlFvRDfe9e68-cZu0Yu/view"],["av-phi-tan","Thẻ avatar Phi Tần","cos","avatar","",0,0,0,0,"","",0,"","","",0,"Mua xong thay ngay ảnh chân dung ở khung trên và lều nhân vật (giữ mãi, đổi qua lại ở bảng Phấn Son)",40,"https://drive.google.com/file/d/1jVlcjR4RDojr-Q9LSx6ywwmElINgtMJd/view"],["av-my-nu-sen","Thẻ avatar Mỹ nữ bên hoa sen","cos","avatar","",0,0,0,0,"","",0,"","","",0,"Mua xong thay ngay ảnh chân dung ở khung trên và lều nhân vật (giữ mãi, đổi qua lại ở bảng Phấn Son)",40,"https://drive.google.com/file/d/1Zjjc7Sqp_J-v0ckeA7UbamopSTXY_BQN/view"],["av-minh-hong","Thẻ avatar Minh Hồng","cos","avatar","",0,0,0,0,"","",0,"","","",0,"Mua xong thay ngay ảnh chân dung ở khung trên và lều nhân vật (giữ mãi, đổi qua lại ở bảng Phấn Son)",80,"https://drive.google.com/file/d/1mHxTCbL1vxiveuALFl6cdY-Ajwew2vpJ/view"],["av-vuong-gia","Thẻ avatar Vương Gia Lãng Tử","cos","avatar","",0,0,0,0,"","",0,"","","",0,"Mua xong thay ngay ảnh chân dung ở khung trên và lều nhân vật (giữ mãi, đổi qua lại ở bảng Phấn Son)",80,"https://drive.google.com/file/d/15dbYhpGHNrYIluqQy77_-ZLoNX4IK0Om/view"],["av-bach-kim","Thẻ avatar Bạch Kim Quang Mỹ Nữ","cos","avatar","",0,0,0,0,"","",0,"","","",0,"Mua xong thay ngay ảnh chân dung ở khung trên và lều nhân vật (giữ mãi, đổi qua lại ở bảng Phấn Son)",80,"https://drive.google.com/file/d/11VnNVYq69-5o5MDsH4O4dzdJgUhmdQrL/view"],["av-mau-don","Thẻ avatar Mẫu Đơn","cos","avatar","",0,0,0,0,"","",0,"","","",0,"Mua xong thay ngay ảnh chân dung ở khung trên và lều nhân vật (giữ mãi, đổi qua lại ở bảng Phấn Son)",80,"https://drive.google.com/file/d/18bul53I9se1-05F0SZ8yfmMmtlv5NaOH/view"],["av-cuu-vi","Thẻ avatar Cửu Vĩ Hồ Ly Tinh","cos","avatar","",0,0,0,0,"","",0,"","","",0,"Mua xong thay ngay ảnh chân dung ở khung trên và lều nhân vật (giữ mãi, đổi qua lại ở bảng Phấn Son)",200,"https://drive.google.com/file/d/1DSHau53kj7bF2y7_NvLrUYroAR9RlylB/view"],["nen-ca","Nền hồ sơ Cá","cos","nen","",0,0,0,0,"","",0,"","","",0,"Thay nền khung trên của game",60,"https://drive.google.com/file/d/1vKX-YFQvcFS-6R6L5cxIewU7bN58co4Z/view"],["nen-lau-dai","Nền hồ sơ Lâu đài","cos","nen","",0,0,0,0,"","",0,"","","",0,"Thay nền khung trên của game",60,"https://drive.google.com/file/d/1e0BY_CCZOErhaiAcIIaQmv--gxYgC7R0/view"],["nen-nui","Nền hồ sơ Núi","cos","nen","",0,0,0,0,"","",0,"","","",0,"Thay nền khung trên của game",60,"https://drive.google.com/file/d/1I9axl3vT4v4oooskc6slprQqOAV-Usqi/view"],["nen-trang","Nền hồ sơ Trăng","cos","nen","",0,0,0,0,"","",0,"","","",0,"Thay nền khung trên của game",60,"https://drive.google.com/file/d/1ZVeQIWPwsMS66the145Tye9rlDgmViSJ/view"],["nen-hong-nhat","Nền hồ sơ Hồng Nhật","cos","nen","",0,0,0,0,"","",0,"","","",0,"Thay nền khung trên của game",120,"https://drive.google.com/file/d/1VZ5c_m99jsLeUqQ2ulSonB67v4O203rD/view"],["nen-cuu-vi","Nền hồ sơ Cửu vĩ hồ ly","cos","nen","",0,0,0,0,"","",0,"","","",0,"Thay nền khung trên của game",200,"https://drive.google.com/file/d/1KyQHKTBKXBu1mOBXTTCR2Uj22D4j4YoS/view"],["thuoc-da-nhiem","Thuốc đa nhiệm","cos","thuoc","",0,0,0,0,"","",0,"","","",0,"Uống vào chọn một hiệu ứng cho tên nhân vật: ánh vàng, cầu vồng, lửa, băng, tím mộng",30,"https://drive.google.com/file/d/1Jeb6RLbkOBphWIdBml68c0BgOAciYwnX/view"],["but-long","Bút Lông","quest","quest","",0,0,0,0,"#e8c070","",0,"","","",0,"Cây bút lông nhỏ, cán khắc chữ \"An\". Con bé vẫn hay cắn cán bút khi tập viết.",0,"https://drive.google.com/file/d/1hCTzUeg0kJM9bbiho5v-IaBQvfhfoUgA/view"],["giay-muc","Giấy và mực","quest","quest","",0,0,0,0,"#e8c070","",0,"","","",0,"Tờ giấy dó còn vết mực loang, góc giấy có nét chữ con gái viết dở: \"Bố ơi…\"",0,"https://drive.google.com/file/d/160eR2F_DzmffC3EN8z74NSC7-MC_xg7m/view"],["gia-treo-but","Giá treo bút","quest","quest","",0,0,0,0,"#e8c070","",0,"","","",0,"Giá treo bút bằng gỗ, mặt sau khắc hình con cá — món quà sinh nhật bố tặng con năm ngoái.",0,"https://drive.google.com/file/d/12zNWrsPoBfv25BgP1PMpKI21WLA2eDuG/view"],["nghien-da","Nghiên đá","quest","quest","",0,0,0,0,"#e8c070","",0,"","","",0,"Nghiên mực còn ẩm. Dưới đáy có vẽ mũi tên chỉ về hướng kinh thành.",0,"https://drive.google.com/file/d/1AvnoWSoZx-1i00HZOgWOAczwoJ3h8LOU/view"],["an-thanh-dien","Ấn Thanh Điền Thạch","quest","quest","",0,0,0,0,"#e8c070","",0,"","","",0,"Phôi đá Thanh Điền khắc dở chữ \"Bình An\". Tướng giặc giữ nó trong ngực áo.",0,"https://drive.google.com/file/d/1yHTGPfsbLnGBVy-7GyVp_xhllt85TLOs/view"],["an-ba-lam","Ấn Ba Lâm Thạch","quest","quest","",0,0,0,0,"#e8c070","",0,"","","",0,"Ấn đá Ba Lâm hình tròn, mặt khắc tên con bé. Ai đó đã dùng nó đóng lên một bức thư.",0,"https://drive.google.com/file/d/1xw9kNZjckB4LHseVwtAMjEggvnJ0zFIZ/view"],["an-xuong-hoa","Ấn Xương Hoá Thạch","quest","quest","",0,0,0,0,"#e8c070","",0,"","","",0,"Ấn Xương Hoá vân đỏ như máu gà. Khắc trên đó: \"Thiên Đình — tầng cao nhất\".",0,"https://drive.google.com/file/d/1o1UZagjjarAkLRHv78xOG_1iMfp0y1Gf/view"],["an-tho-son","Ấn Thọ Sơn Thạch","quest","quest","",0,0,0,0,"#e8c070","",0,"","","",0,"Ấn Thọ Sơn — chìa khóa mở cửa Thiên Đình. Con gái đang ở ngay sau cánh cửa ấy.",0,"https://drive.google.com/file/d/1GtEYIXVVBPJ8sunCWL0lR-DzDJgSVCyq/view"],["kiem-co-loa","Kiếm Âu Lạc","hand","sword","one",16,0,0,12000,"#8a9a5a","",0,"","","",0,"",null,null],["khien-co-loa","Khiên Âu Lạc","hand","shield","one",0,14,0,11200,"#8a9a5a","",0,"","","",0,"",null,null],["gay-co-loa","Gậy phép Âu Lạc","hand","staff","one",13,0,0,10400,"#8a9a5a","",0,"","","",0,"",null,null],["cung-co-loa","Cung Âu Lạc","hand","bow","two",15,0,0,11200,"#8a9a5a","",0,"","","",0,"",null,null],["giao-co-loa","Giáo Âu Lạc","hand","spear","two",17,0,0,12000,"#8a9a5a","",0,"","","",0,"",null,null],["dao-co-loa","Đao Âu Lạc","hand","saber","one",18,0,0,12800,"#8a9a5a","",0,"","","",0,"",null,null],["chuy-co-loa","Chùy Âu Lạc","hand","mace","one",20,0,0,14000,"#8a9a5a","",0,"","","",0,"",null,null],["no-co-loa","Nỏ Âu Lạc","hand","crossbow","two",19,0,0,14000,"#8a9a5a","",0,"","","",0,"",null,null],["mu-co-loa","Mũ trụ Âu Lạc","hat","hat","",0,6,0,6000,"#8a9a5a","",0,"","","",0,"",null,null],["giap-co-loa","Giáp Âu Lạc","armor","armor","",0,12,0,16000,"#8a9a5a","",0,"","","",0,"",null,null],["quan-co-loa","Quần giáp Âu Lạc","pants","pants","",0,6,0,6000,"#8a9a5a","",0,"","","",0,"",null,null],["gang-co-loa","Bao tay Âu Lạc","gloves","gloves","",0,4,0,4400,"#8a9a5a","",0,"","","",0,"",null,null],["giay-co-loa","Hài Âu Lạc","shoes","shoes","",0,5,0,5200,"#8a9a5a","",0,"","","",0,"",null,null],["ao-choang-co-loa","Áo choàng Âu Lạc","wings","wings","",0,3,0,24000,"#8a9a5a","",0,"","","",0,"",null,null],["ngua-co-loa","Ngựa chiến Cổ Loa","mount","mount","",0,0,160,80000,"#6a4a30","horse",6,"","","",0,"",null,null],["ky-lan-lua","Kỳ Lân Lửa","mount","mount","",6,0,170,180000,"#ff8a3a","kylan",12,"","p","lifesteal",6,"Thú thần thoại: hút 6% sát thương gây ra thành máu",null,null],["no-lien-chau","Nỏ Liên Châu","hand","crossbow","two",22,0,0,160000,"#8a6a3a","",0,"","p","frost",18,"Đòn bắn có 18% làm quái chậm nửa tốc trong 2 giây",null,null],["co-may-man","Cờ May Mắn","wings","wings","",0,4,0,160000,"#e0b040","",0,"","p","luck",25,"Tỉ lệ rơi đồ tăng 25%",null,null],["kiem-thang-long","Kiếm Long Thành","hand","sword","one",16,0,0,90000,"#c03030","",0,"","","",0,"",null,null],["khien-thang-long","Khiên Long Thành","hand","shield","one",0,14,0,84000,"#c03030","",0,"","","",0,"",null,null],["gay-thang-long","Gậy phép Long Thành","hand","staff","one",13,0,0,78000,"#c03030","",0,"","","",0,"",null,null],["cung-thang-long","Cung Long Thành","hand","bow","two",15,0,0,84000,"#c03030","",0,"","","",0,"",null,null],["giao-thang-long","Giáo Long Thành","hand","spear","two",17,0,0,90000,"#c03030","",0,"","","",0,"",null,null],["dao-thang-long","Đao Long Thành","hand","saber","one",18,0,0,96000,"#c03030","",0,"","","",0,"",null,null],["chuy-thang-long","Chùy Long Thành","hand","mace","one",20,0,0,105000,"#c03030","",0,"","","",0,"",null,null],["no-thang-long","Nỏ Long Thành","hand","crossbow","two",19,0,0,105000,"#c03030","",0,"","","",0,"",null,null],["mu-thang-long","Mũ trụ Long Thành","hat","hat","",0,6,0,45000,"#c03030","",0,"","","",0,"",null,null],["giap-thang-long","Giáp Long Thành","armor","armor","",0,12,0,120000,"#c03030","",0,"","","",0,"",null,null],["quan-thang-long","Quần giáp Long Thành","pants","pants","",0,6,0,45000,"#c03030","",0,"","","",0,"",null,null],["gang-thang-long","Bao tay Long Thành","gloves","gloves","",0,4,0,33000,"#c03030","",0,"","","",0,"",null,null],["giay-thang-long","Hài Long Thành","shoes","shoes","",0,5,0,39000,"#c03030","",0,"","","",0,"",null,null],["ao-choang-thang-long","Áo choàng Long Thành","wings","wings","",0,3,0,180000,"#c03030","",0,"","","",0,"",null,null],["ho-trang","Hổ trắng Tây Bắc","mount","mount","",0,0,160,600000,"#f0f0f4","tiger",12,"","","",0,"",null,null],["ngua-ngu-lam","Ngựa Ngự Lâm","mount","mount","",0,0,170,600000,"#2a2a30","horse",8,"","","",0,"",null,null],["bach-ho","Bạch Hổ Tây Phương","mount","mount","",0,0,175,1350000,"#e8f0ff","tiger",14,"","p","dmgPct",12,"Thú thần thoại: sát thương +12%",null,null],["phuong-hoang","Phượng Hoàng Lửa","mount","mount","",0,0,180,1350000,"#ff5a30","phuong",16,"","p","lifesteal",10,"Thú thần thoại: hút 10% sát thương gây ra thành máu",null,null],["kiem-long-tuyen","Kiếm Long Tuyền","hand","sword","one",30,0,0,1200000,"#9ad0c0","",0,"","p","venom",30,"Đòn đánh gây độc thêm 30% sát thương trong 4 giây",null,null],["dao-loi-dinh","Đao Lôi Đình","hand","saber","one",32,0,0,1200000,"#b0c8ff","",0,"","p","stun",12,"Đòn chém có thêm 12% làm quái choáng 1 giây",null,null],["co-phu-quy","Cờ Phú Quý","wings","wings","",0,6,0,1200000,"#e0b040","",0,"","p","coinUp",30,"Đồng nhận được khi hạ quái tăng 30%",null,null],["ao-choang-tinh-thong","Áo choàng Tinh Thông","wings","wings","",0,6,0,1200000,"#4a6a9a","",0,"","p","expUp",25,"Kinh nghiệm nhận được tăng 25%",null,null],["kiem-hoa-lu","Kiếm Trường Yên","hand","sword","one",16,0,0,480000,"#6a3a8a","",0,"","","",0,"",null,null],["khien-hoa-lu","Khiên Trường Yên","hand","shield","one",0,14,0,448000,"#6a3a8a","",0,"","","",0,"",null,null],["gay-hoa-lu","Gậy phép Trường Yên","hand","staff","one",13,0,0,416000,"#6a3a8a","",0,"","","",0,"",null,null],["cung-hoa-lu","Cung Trường Yên","hand","bow","two",15,0,0,448000,"#6a3a8a","",0,"","","",0,"",null,null],["giao-hoa-lu","Giáo Trường Yên","hand","spear","two",17,0,0,480000,"#6a3a8a","",0,"","","",0,"",null,null],["dao-hoa-lu","Đao Trường Yên","hand","saber","one",18,0,0,512000,"#6a3a8a","",0,"","","",0,"",null,null],["chuy-hoa-lu","Chùy Trường Yên","hand","mace","one",20,0,0,560000,"#6a3a8a","",0,"","","",0,"",null,null],["no-hoa-lu","Nỏ Trường Yên","hand","crossbow","two",19,0,0,560000,"#6a3a8a","",0,"","","",0,"",null,null],["mu-hoa-lu","Mũ trụ Trường Yên","hat","hat","",0,6,0,240000,"#6a3a8a","",0,"","","",0,"",null,null],["giap-hoa-lu","Giáp Trường Yên","armor","armor","",0,12,0,640000,"#6a3a8a","",0,"","","",0,"",null,null],["quan-hoa-lu","Quần giáp Trường Yên","pants","pants","",0,6,0,240000,"#6a3a8a","",0,"","","",0,"",null,null],["gang-hoa-lu","Bao tay Trường Yên","gloves","gloves","",0,4,0,176000,"#6a3a8a","",0,"","","",0,"",null,null],["giay-hoa-lu","Hài Trường Yên","shoes","shoes","",0,5,0,208000,"#6a3a8a","",0,"","","",0,"",null,null],["ao-choang-hoa-lu","Áo choàng Trường Yên","wings","wings","",0,3,0,960000,"#6a3a8a","",0,"","","",0,"",null,null],["ky-lan-trang-an","Kỳ lân Tràng An","mount","mount","",6,0,175,3200000,"#e8c060","kylan",14,"","","",0,"",null,null],["voi-trang","Voi trắng","mount","mount","",0,10,140,3200000,"#e8e8e4","elephant",18,"","","",0,"",null,null],["huyen-vu","Huyền Vũ Bắc Phương","mount","mount","",0,0,150,7200000,"#1e2a3a","rua",20,"","p","defPct",20,"Thú thần thoại: phòng ngự +20%",null,null],["thien-ma","Thiên Mã có cánh","mount","mount","",0,0,190,7200000,"#fff4e0","thienma",16,"","p","dmgPct",18,"Thú thần thoại: sát thương +18%",null,null],["giap-cuong-no","Giáp Cuồng Nộ","armor","armor","",0,30,0,6400000,"#8a2a2a","",0,"","p","rage",40,"Dưới 30% máu: sát thương tăng 40%",null,null],["chuy-thai-son","Chùy Thái Sơn","hand","mace","one",40,0,0,6400000,"#6a6a7a","",0,"","p","stun",20,"Đòn chùy có thêm 20% làm quái choáng 1 giây",null,null],["cung-co-lau","Cung Cờ Lau","hand","bow","two",34,0,0,6400000,"#c08040","",0,"","p","frost",25,"Đòn bắn có 25% làm quái chậm nửa tốc trong 2 giây",null,null],["co-tinh-thong","Cờ Tinh Thông","wings","wings","",0,8,0,6400000,"#4a6a9a","",0,"","p","expUp",40,"Kinh nghiệm nhận được tăng 40%",null,null],["kiem-phu-xuan","Kiếm Thuận Hóa","hand","sword","one",16,0,0,1800000,"#d0a030","",0,"","","",0,"",null,null],["khien-phu-xuan","Khiên Thuận Hóa","hand","shield","one",0,14,0,1680000,"#d0a030","",0,"","","",0,"",null,null],["gay-phu-xuan","Gậy phép Thuận Hóa","hand","staff","one",13,0,0,1560000,"#d0a030","",0,"","","",0,"",null,null],["cung-phu-xuan","Cung Thuận Hóa","hand","bow","two",15,0,0,1680000,"#d0a030","",0,"","","",0,"",null,null],["giao-phu-xuan","Giáo Thuận Hóa","hand","spear","two",17,0,0,1800000,"#d0a030","",0,"","","",0,"",null,null],["dao-phu-xuan","Đao Thuận Hóa","hand","saber","one",18,0,0,1920000,"#d0a030","",0,"","","",0,"",null,null],["chuy-phu-xuan","Chùy Thuận Hóa","hand","mace","one",20,0,0,2100000,"#d0a030","",0,"","","",0,"",null,null],["no-phu-xuan","Nỏ Thuận Hóa","hand","crossbow","two",19,0,0,2100000,"#d0a030","",0,"","","",0,"",null,null],["mu-phu-xuan","Mũ trụ Thuận Hóa","hat","hat","",0,6,0,900000,"#d0a030","",0,"","","",0,"",null,null],["giap-phu-xuan","Giáp Thuận Hóa","armor","armor","",0,12,0,2400000,"#d0a030","",0,"","","",0,"",null,null],["quan-phu-xuan","Quần giáp Thuận Hóa","pants","pants","",0,6,0,900000,"#d0a030","",0,"","","",0,"",null,null],["gang-phu-xuan","Bao tay Thuận Hóa","gloves","gloves","",0,4,0,660000,"#d0a030","",0,"","","",0,"",null,null],["giay-phu-xuan","Hài Thuận Hóa","shoes","shoes","",0,5,0,780000,"#d0a030","",0,"","","",0,"",null,null],["ao-choang-phu-xuan","Áo choàng Thuận Hóa","wings","wings","",0,3,0,3600000,"#d0a030","",0,"","","",0,"",null,null],["rong-thuan-hoa","Rồng Thuận Hóa","mount","mount","",6,10,190,12000000,"#2a6a5a","rong",24,"","","",0,"",null,null],["ky-lan-hoang-gia","Kỳ lân hoàng gia","mount","mount","",6,0,185,12000000,"#f0d080","kylan",16,"","","",0,"",null,null],["thanh-long","Thanh Long Đông Phương","mount","mount","",6,10,200,27000000,"#2aa070","rong",26,"","p","clone",15,"Thú thần thoại: hạ quái có 15% gọi phân thân (bản sao của bạn) đánh cùng 10 giây",null,null],["cuu-vi-ho","Cửu Vĩ Hồ Ly","mount","mount","",0,0,190,27000000,"#ffd0b0","cuuvi",18,"","p","lifesteal",15,"Thú thần thoại: hút 15% sát thương gây ra thành máu",null,null],["kim-long","Kim Long Thiên Tử","mount","mount","",6,10,210,27000000,"#ffd040","rong",30,"","p","dmgPct",25,"Thú thần thoại: sát thương +25%",null,null],["kiem-thien-menh","Kiếm Thiên Mệnh","hand","sword","one",44,0,0,24000000,"#ffe080","",0,"","p","rage",60,"Dưới 30% máu: sát thương tăng 60%",null,null],["co-thien-menh","Cờ Thiên Mệnh","wings","wings","",0,10,0,24000000,"#ffd040","",0,"","p","luck",50,"Tỉ lệ rơi đồ tăng 50%",null,null],["khien-ngu-lam","Khiên Ngự Lâm","hand","shield","one",0,38,0,24000000,"#3a3a5a","",0,"","p","frost",30,"Đòn khiên có 30% làm quái chậm nửa tốc trong 2 giây",null,null],["ao-choang-phu-quy","Áo choàng Phú Quý","wings","wings","",0,10,0,24000000,"#e0b040","",0,"","p","coinUp",50,"Đồng nhận được khi hạ quái tăng 50%",null,null]],"vu_khi":[["loai","ten","sat_thuong","tam_danh","lan_rong","toc_danh_ms","mana","hoi_chieu","noi_tai","ghi_chu"],["spear","Thương",130,130,26,500,110,90,14,"Sát thương cao nhất, đâm thẳng một đường"],["saber","Đao",125,82,140,520,100,100,12,"v10.14 · Nặng tay, chém vòng cung rộng hơn kiếm"],["mace","Chùy",145,66,100,640,110,95,15,"v10.14 · Nặng nhất, đẩy lùi mạnh, mỗi đòn có 15% làm quái choáng"],["sword","Kiếm",115,85,115,420,90,110,10,"Đánh nhanh nhất, chém vòng cung trước mặt"],["shield","Khiên",100,60,75,560,130,70,18,"Tầm ngắn nhất, đẩy lùi mạnh. Tốn mana nhiều nhất nhưng hồi chiêu và nội tại nhanh nhất"],["crossbow","Nỏ",135,600,1,760,100,100,12,"Bắn xa, mũi tên xuyên qua quái (v10.19: sát thương 90 → 135)"],["bow","Cung",120,540,0,660,120,80,16,"Bắn xa, hồi chiêu nhanh (v10.19: sát thương 80 → 120)"],["staff","Gậy phép",140,680,90,900,80,120,9,"Tầm xa và rộng nhất (cầu phép nổ lan), đánh chậm nhất (v10.19: sát thương 65 → 140)"]],"cua_hang":[["cua_hang","id","pham_chat","gia","thu_tu","bac"],["smith","sword-iron","n,g","",1,0],["smith","sword-steel","n,g","",2,0],["smith","shield-wood","n,g","",3,0],["smith","shield-iron","n,g","",4,0],["smith","staff-jade","n,g","",5,0],["smith","bow-hunt","n,g","",6,0],["smith","spear-iron","n,g","",7,0],["smith","crossbow-war","n,g","",8,0],["smith","saber-iron","n,g","",9,0],["smith","mace-iron","n,g","",10,0],["smith","hat-iron","n,g","",11,0],["smith","armor-leather","n,g","",12,0],["smith","armor-iron","n,g","",13,0],["smith","pants-guard","n,g","",14,0],["smith","gloves-leather","n,g","",15,0],["smith","shoes-leather","n,g","",16,0],["smith","shoes-iron","n,g","",17,0],["trainer","mount","n","",1,0],["trainer","mount-brown","n","",2,0],["trainer","mount-black","n","",3,0],["trainer","mount-white","n","",4,0],["trainer","mount-tiger","n","",5,0],["trainer","mount-elephant","n","",6,0],["wizard","book-fire","n,g,p","",1,0],["wizard","book-water","n,g,p","",2,0],["wizard","book-earth","n,g,p","",3,0],["wizard","book-metal","n,g,p","",4,0],["wizard","book-wood","n,g,p","",5,0],["wizard","book-loi","n,g,p","",6,0],["wizard","book-phong","n,g,p","",7,0],["wizard","book-bang","n,g,p","",8,0],["wizard","book-ma","n,g,p","",9,0],["wizard","book-sang","n,g,p","",10,0],["phan-son","av-tuong-quan","n","",1,0],["phan-son","av-hiep-khach","n","",2,0],["phan-son","av-phi-tan","n","",3,0],["phan-son","av-my-nu-sen","n","",4,0],["phan-son","av-minh-hong","n","",5,0],["phan-son","av-vuong-gia","n","",6,0],["phan-son","av-bach-kim","n","",7,0],["phan-son","av-mau-don","n","",8,0],["phan-son","av-cuu-vi","n","",9,0],["phan-son","nen-ca","n","",10,0],["phan-son","nen-lau-dai","n","",11,0],["phan-son","nen-nui","n","",12,0],["phan-son","nen-trang","n","",13,0],["phan-son","nen-hong-nhat","n","",14,0],["phan-son","nen-cuu-vi","n","",15,0],["phan-son","thuoc-da-nhiem","n","",16,0],["thanh-co-loa-ren","kiem-co-loa","n,g,p","",1,70],["thanh-co-loa-ren","khien-co-loa","n,g,p","",2,70],["thanh-co-loa-ren","gay-co-loa","n,g,p","",3,70],["thanh-co-loa-ren","cung-co-loa","n,g,p","",4,70],["thanh-co-loa-ren","giao-co-loa","n,g,p","",5,70],["thanh-co-loa-ren","dao-co-loa","n,g,p","",6,70],["thanh-co-loa-ren","chuy-co-loa","n,g,p","",7,70],["thanh-co-loa-ren","no-co-loa","n,g,p","",8,70],["thanh-co-loa","mu-co-loa","n,g,p","",9,70],["thanh-co-loa","giap-co-loa","n,g,p","",10,70],["thanh-co-loa","quan-co-loa","n,g,p","",11,70],["thanh-co-loa","gang-co-loa","n,g,p","",12,70],["thanh-co-loa","giay-co-loa","n,g,p","",13,70],["thanh-co-loa","ao-choang-co-loa","n,g,p","",14,70],["thanh-co-loa","ngua-co-loa","n","",15,70],["thanh-co-loa","ky-lan-lua","p","",16,70],["thanh-co-loa-ren","no-lien-chau","p","",17,70],["thanh-co-loa","co-may-man","p","",18,70],["thanh-thang-long-ren","kiem-thang-long","n,g,p","",1,170],["thanh-thang-long-ren","khien-thang-long","n,g,p","",2,170],["thanh-thang-long-ren","gay-thang-long","n,g,p","",3,170],["thanh-thang-long-ren","cung-thang-long","n,g,p","",4,170],["thanh-thang-long-ren","giao-thang-long","n,g,p","",5,170],["thanh-thang-long-ren","dao-thang-long","n,g,p","",6,170],["thanh-thang-long-ren","chuy-thang-long","n,g,p","",7,170],["thanh-thang-long-ren","no-thang-long","n,g,p","",8,170],["thanh-thang-long","mu-thang-long","n,g,p","",9,170],["thanh-thang-long","giap-thang-long","n,g,p","",10,170],["thanh-thang-long","quan-thang-long","n,g,p","",11,170],["thanh-thang-long","gang-thang-long","n,g,p","",12,170],["thanh-thang-long","giay-thang-long","n,g,p","",13,170],["thanh-thang-long","ao-choang-thang-long","n,g,p","",14,170],["thanh-thang-long-thu","ho-trang","n","",15,170],["thanh-thang-long-thu","ngua-ngu-lam","n","",16,170],["thanh-thang-long-thu","bach-ho","p","",17,170],["thanh-thang-long-thu","phuong-hoang","p","",18,170],["thanh-thang-long-ren","kiem-long-tuyen","p","",19,170],["thanh-thang-long-ren","dao-loi-dinh","p","",20,170],["thanh-thang-long","co-phu-quy","p","",21,170],["thanh-thang-long","ao-choang-tinh-thong","p","",22,170],["thanh-hoa-lu-ren","kiem-hoa-lu","n,g,p","",1,235],["thanh-hoa-lu-ren","khien-hoa-lu","n,g,p","",2,235],["thanh-hoa-lu-ren","gay-hoa-lu","n,g,p","",3,235],["thanh-hoa-lu-ren","cung-hoa-lu","n,g,p","",4,235],["thanh-hoa-lu-ren","giao-hoa-lu","n,g,p","",5,235],["thanh-hoa-lu-ren","dao-hoa-lu","n,g,p","",6,235],["thanh-hoa-lu-ren","chuy-hoa-lu","n,g,p","",7,235],["thanh-hoa-lu-ren","no-hoa-lu","n,g,p","",8,235],["thanh-hoa-lu","mu-hoa-lu","n,g,p","",9,235],["thanh-hoa-lu","giap-hoa-lu","n,g,p","",10,235],["thanh-hoa-lu","quan-hoa-lu","n,g,p","",11,235],["thanh-hoa-lu","gang-hoa-lu","n,g,p","",12,235],["thanh-hoa-lu","giay-hoa-lu","n,g,p","",13,235],["thanh-hoa-lu","ao-choang-hoa-lu","n,g,p","",14,235],["thanh-hoa-lu","ky-lan-trang-an","n","",15,235],["thanh-hoa-lu","voi-trang","n","",16,235],["thanh-hoa-lu","huyen-vu","p","",17,235],["thanh-hoa-lu","thien-ma","p","",18,235],["thanh-hoa-lu","giap-cuong-no","p","",19,235],["thanh-hoa-lu-ren","chuy-thai-son","p","",20,235],["thanh-hoa-lu-ren","cung-co-lau","p","",21,235],["thanh-hoa-lu","co-tinh-thong","p","",22,235],["thanh-phu-xuan-ren","kiem-phu-xuan","n,g,p","",1,290],["thanh-phu-xuan-ren","khien-phu-xuan","n,g,p","",2,290],["thanh-phu-xuan-ren","gay-phu-xuan","n,g,p","",3,290],["thanh-phu-xuan-ren","cung-phu-xuan","n,g,p","",4,290],["thanh-phu-xuan-ren","giao-phu-xuan","n,g,p","",5,290],["thanh-phu-xuan-ren","dao-phu-xuan","n,g,p","",6,290],["thanh-phu-xuan-ren","chuy-phu-xuan","n,g,p","",7,290],["thanh-phu-xuan-ren","no-phu-xuan","n,g,p","",8,290],["thanh-phu-xuan","mu-phu-xuan","n,g,p","",9,290],["thanh-phu-xuan","giap-phu-xuan","n,g,p","",10,290],["thanh-phu-xuan","quan-phu-xuan","n,g,p","",11,290],["thanh-phu-xuan","gang-phu-xuan","n,g,p","",12,290],["thanh-phu-xuan","giay-phu-xuan","n,g,p","",13,290],["thanh-phu-xuan","ao-choang-phu-xuan","n,g,p","",14,290],["thanh-phu-xuan-thu","rong-thuan-hoa","n","",15,290],["thanh-phu-xuan-thu","ky-lan-hoang-gia","n","",16,290],["thanh-phu-xuan-thu","thanh-long","p","",17,290],["thanh-phu-xuan-thu","cuu-vi-ho","p","",18,290],["thanh-phu-xuan-thu","kim-long","p","",19,290],["thanh-phu-xuan-ren","kiem-thien-menh","p","",20,290],["thanh-phu-xuan","co-thien-menh","p","",21,290],["thanh-phu-xuan-ren","khien-ngu-lam","p","",22,290],["thanh-phu-xuan","ao-choang-phu-quy","p","",23,290],["thanh-co-loa-sach","book-fire","n,g,p",4000,1,70],["thanh-co-loa-sach","book-water","n,g,p",3000,2,70],["thanh-co-loa-sach","book-earth","n,g,p",4500,3,70],["thanh-co-loa-sach","book-metal","n,g,p",4500,4,70],["thanh-co-loa-sach","book-wood","n,g,p",3000,5,70],["thanh-co-loa-sach","book-loi","n,g,p",9000,6,70],["thanh-co-loa-sach","book-phong","n,g,p",7000,7,70],["thanh-co-loa-sach","book-bang","n,g,p",8000,8,70],["thanh-co-loa-sach","book-ma","n,g,p",15000,9,70],["thanh-co-loa-sach","book-sang","n,g,p",10000,10,70],["thanh-thang-long-sach","book-fire","n,g,p",30000,1,170],["thanh-thang-long-sach","book-water","n,g,p",22500,2,170],["thanh-thang-long-sach","book-earth","n,g,p",33750,3,170],["thanh-thang-long-sach","book-metal","n,g,p",33750,4,170],["thanh-thang-long-sach","book-wood","n,g,p",22500,5,170],["thanh-thang-long-sach","book-loi","n,g,p",67500,6,170],["thanh-thang-long-sach","book-phong","n,g,p",52500,7,170],["thanh-thang-long-sach","book-bang","n,g,p",60000,8,170],["thanh-thang-long-sach","book-ma","n,g,p",112500,9,170],["thanh-thang-long-sach","book-sang","n,g,p",75000,10,170],["thanh-hoa-lu-sach","book-fire","n,g,p",160000,1,235],["thanh-hoa-lu-sach","book-water","n,g,p",120000,2,235],["thanh-hoa-lu-sach","book-earth","n,g,p",180000,3,235],["thanh-hoa-lu-sach","book-metal","n,g,p",180000,4,235],["thanh-hoa-lu-sach","book-wood","n,g,p",120000,5,235],["thanh-hoa-lu-sach","book-loi","n,g,p",360000,6,235],["thanh-hoa-lu-sach","book-phong","n,g,p",280000,7,235],["thanh-hoa-lu-sach","book-bang","n,g,p",320000,8,235],["thanh-hoa-lu-sach","book-ma","n,g,p",600000,9,235],["thanh-hoa-lu-sach","book-sang","n,g,p",400000,10,235],["thanh-phu-xuan-sach","book-fire","n,g,p",600000,1,290],["thanh-phu-xuan-sach","book-water","n,g,p",450000,2,290],["thanh-phu-xuan-sach","book-earth","n,g,p",675000,3,290],["thanh-phu-xuan-sach","book-metal","n,g,p",675000,4,290],["thanh-phu-xuan-sach","book-wood","n,g,p",450000,5,290],["thanh-phu-xuan-sach","book-loi","n,g,p",1350000,6,290],["thanh-phu-xuan-sach","book-phong","n,g,p",1050000,7,290],["thanh-phu-xuan-sach","book-bang","n,g,p",1200000,8,290],["thanh-phu-xuan-sach","book-ma","n,g,p",2250000,9,290],["thanh-phu-xuan-sach","book-sang","n,g,p",1500000,10,290]],"goi_nap":[["id","ten","tien","hong_ngoc","mo_ta","thu_tu","vang"],["goi-20","Gói 20K",20000,20,"Dùng thử",1,0],["goi-50","Gói 50K",50000,55,"Tặng 10%",2,0],["goi-100","Gói 100K",100000,120,"Tặng 20%",3,0],["goi-200","Gói 200K",200000,260,"Tặng 30%",4,0],["goi-500","Gói 500K",500000,700,"Tặng 40%",5,0],["goi-1000","Gói 1 triệu",1000000,1500,"Tặng 50%",6,0],["vang-20","Gói vàng 20K",20000,0,"Dùng thử",7,100],["vang-50","Gói vàng 50K",50000,0,"Tặng 10%",8,275],["vang-100","Gói vàng 100K",100000,0,"Tặng 20%",9,600],["vang-200","Gói vàng 200K",200000,0,"Tặng 30%",10,1300],["vang-500","Gói vàng 500K",500000,0,"Tặng 40%",11,3500],["vang-1000","Gói vàng 1 triệu",1000000,0,"Tặng 50%",12,7500]],"dien_mao":[["id","ten","gioi_tinh","gia","hong_ngoc","mau_da","mau_toc","kieu_toc","rau","mau_mat","dau","thu_tu"],["da-nau","Da nâu","",0,0,"#c89060","#2a2622","","","#2a2018","",1],["da-trang","Da trắng","",0,0,"#f0dcc0","#2a2622","","","#2a2018","",2],["dau-troc","Đầu trọc","m",0,0,"#e1c295","#2a2622","troc","","#2a2018","",3],["toc-xoa","Tóc xõa","",2000,0,"#e1c295","#2a2622","xoa","","#2a2018","",4],["toc-dung","Tóc dựng","",5000,0,"#e1c295","#1a1614","dung","","#2a2018","",5],["khan-buoc","Khăn buộc đầu","",6000,0,"#d8b088","#2a2622","khan","","#2a2018","",6],["toc-nau","Tóc nâu","",8000,0,"#e8cca8","#6a3a1a","","","#3a2a18","",7],["hoa-cai","Hoa cài tóc","f",8000,0,"#f0dcc0","#2a2622","","","#2a2018","hoa",8],["rau-quai","Râu quai nón","m",10000,0,"#d8b088","#2a2622","","#2a2622","#2a2018","",9],["not-ruoi","Nốt ruồi duyên","",12000,0,"#f0dcc0","#2a2622","","","#2a2018","not",10],["vet-seo","Vết sẹo chiến binh","",15000,0,"#c89060","#1a1614","dung","","#2a2018","seo",11],["toc-bac","Tóc bạc","",20000,0,"#e1c295","#d8d8d8","","","#2a2018","",12],["ve-mat","Vẽ mặt chiến binh","",30000,0,"#c89060","#2a2622","khan","","#2a2018","ve",13],["lao-truong","Lão trượng","m",50000,0,"#e8cca8","#d8d8d8","","#d8d0c0","#2a2018","",14],["mat-ngoc","Mắt ngọc","",100000,0,"#f0dcc0","#2a2622","xoa","","#2a7a9a","",15],["mat-hoa","Mắt hỏa","",0,20,"#d8b088","#1a1614","dung","","#c03020","",16],["tien-nu","Tiên nữ","f",0,30,"#fff0e0","#4a2a6a","xoa","","#6a3aa0","hoa",17],["ma-vuong","Ma Vương","m",0,30,"#9a8ab0","#1a0a2a","dung","#1a0a2a","#ff2060","ve",18]],"bo_huyen_thoai":[["id","nhan_vat","gioi_tinh","ten_bo","vu_khi_loai","vu_khi","tay_trai_loai","tay_trai","mu","ao","quan","gang","giay","canh","thu_cuoi","thu_cuoi_loai","moc_3","moc_5","moc_7","hieu_ung_9","gia_tri_9","mo_ta_9"],["ngo-quyen","Ngô Quyền","m","Bạch Đằng","sword","Kiếm Bạch Đằng","shield","Khiên cọc gỗ lim","Mũ trụ Đường Lâm","Giáp Bạch Đằng","Quần trận Bạch Đằng","Bao tay chèo lái","Hài thủy chiến","Cờ hiệu Tiền Ngô","Chiến mã Đường Lâm","horse","def:6,hp:30","reflect:8,dmgRed:4","str:8,crit2:4","stun",15,"Cọc Bạch Đằng: đòn đánh có 15% làm quái choáng 1 giây"],["dinh-bo-linh","Đinh Bộ Lĩnh","m","Cờ Lau","sword","Kiếm Hoa Lư","sword","Đoản kiếm Hoa Lư","Mũ Vạn Thắng","Long bào Đại Cồ Việt","Quần cờ lau","Bao tay Vạn Thắng","Hài Hoa Lư","Cờ lau tập trận","Ngựa Vạn Thắng","horse","cmd:3,hp:30","atkSpd:8,crit2:3","str:6,agi:6","execute",12,"Dẹp loạn 12 sứ quân: kết liễu quái thường còn dưới 12% máu"],["le-hoan","Lê Hoàn","m","Đại Hành","sword","Kiếm Thập đạo","shield","Khiên Chi Lăng","Mũ Thập đạo tướng quân","Giáp Lê Đại Hành","Quần trận Chi Lăng","Bao tay Đại Hành","Hài phá Tống","Cờ Đại Hành","Voi chiến Đại Hành","elephant","def:5,block:3","hp:60,dmgRed:4","str:6,trueDmg:8","shield",20,"Chi Lăng: mỗi 10 giây nhận lá chắn bằng 20% máu tối đa"],["ly-thuong-kiet","Lý Thường Kiệt","m","Như Nguyệt","sword","Kiếm Như Nguyệt","shield","Khiên sông Cầu","Mũ Thái úy","Giáp Như Nguyệt","Quần Thái úy","Bao tay Nam quốc","Hài sông Cầu","Cờ Nam quốc sơn hà","Chiến mã Ung Châu","horse","int:5,mp:20","cdr:6,crit2:3","str:6,dmgMax:8","wave",60,"Nam quốc sơn hà: mỗi đòn thứ 4 tung sóng chém 60% sát thương"],["tran-hung-dao","Trần Hưng Đạo","m","Hưng Đạo","sword","Kiếm Hưng Đạo Vương","shield","Khiên Vạn Kiếp","Mũ Quốc công","Giáp Hưng Đạo","Quần Vạn Kiếp","Bao tay Hịch tướng sĩ","Hài Bạch Đằng","Cờ Tiết chế","Chiến mã Vạn Kiếp","horse","cmd:4,hp:30","str:5,crit3:2","dmgRed:6,reflect:6","aura",30,"Hịch tướng sĩ: bản thân và lính đánh thuê +30% sát thương"],["tran-quoc-toan","Trần Quốc Toản","m","Phá Cường Địch","sword","Kiếm Hoài Văn Hầu","sword","Đoản kiếm Hoài Văn","Mũ Hoài Văn Hầu","Giáp thiếu niên","Quần Hoài Văn","Bao tay bóp cam","Hài thiếu niên","Cờ Phá cường địch","Ngựa Hoài Văn","horse","agi:5,atkSpd:5","crit2:4,moveSpd:4","str:6,perfDmg:3","cleave",40,"Phá cường địch: đòn thường lan 40% sát thương sang quái gần"],["nguyen-trai","Nguyễn Trãi","m","Bình Ngô","staff","Bút Bình Ngô","staff","Gậy trúc Côn Sơn","Khăn Ức Trai","Áo Côn Sơn","Quần Ức Trai","Bao tay Quân trung từ mệnh","Hài Côn Sơn","Áo choàng Bình Ngô","Ngựa mưu sĩ Lam Sơn","horse","int:6,mp:30","mpReg:3,cdr:6","int:8,crit2:3","manaShield",30,"Bình Ngô đại cáo: 30% sát thương nhận vào trừ vào mana"],["le-loi","Lê Lợi","m","Lam Sơn","sword","Kiếm Lam Sơn","shield","Khiên Lam Sơn","Mũ Bình Định Vương","Giáp Lam Sơn","Quần Lam Sơn","Bao tay Lũng Nhai","Hài Chí Linh","Cờ Bình Định","Voi chiến Lam Sơn","elephant","vit:5,hp:40","def:6,hpReg:2","str:6,crit2:3","lifesteal",8,"Hội thề Lũng Nhai: hút 8% sát thương gây ra thành máu"],["quang-trung","Quang Trung","m","Tây Sơn","sword","Kiếm Tây Sơn","sword","Đoản kiếm Đống Đa","Mũ Quang Trung","Áo bào Tây Sơn","Quần Ngọc Hồi","Bao tay Đống Đa","Hài thần tốc","Cờ đào Tây Sơn","Voi chiến Ngọc Hồi","elephant","moveSpd:6,atkSpd:5","str:6,crit2:4","crit3:3,dmgMax:10","haste",40,"Thần tốc: hạ quái tăng 40% tốc đánh và tốc chạy trong 4 giây"],["trung-trac","Trưng Trắc","f","Mê Linh","sword","Kiếm Mê Linh","shield","Khiên Hát Môn","Mũ Trưng Vương","Giáp Mê Linh","Váy trận Hát Môn","Bao tay Trưng Vương","Hài Mê Linh","Cờ Trưng Vương","Voi chiến Mê Linh","elephant","cmd:3,hp:30","str:5,def:5","crit2:4,dmgRed:5","burn",30,"Lửa Mê Linh: đòn đánh gây bỏng thêm 30% sát thương trong 3 giây"],["trung-nhi","Trưng Nhị","f","Hát Giang","sword","Kiếm Trưng Nhị","sword","Đoản kiếm Hát Giang","Mũ Trưng Nhị","Giáp Hát Giang","Váy trận Trưng Nhị","Bao tay Hát Giang","Hài Hát Giang","Cờ Hát Giang","Voi chiến Hát Giang","elephant","agi:5,dodge:3","atkSpd:6,crit2:3","str:6,dodge:4","counter",100,"Song kiếm: sau khi né, đòn kế tiếp gây gấp đôi"],["trieu-thi-trinh","Bà Triệu","f","Núi Nưa","sword","Gươm Núi Nưa","sword","Gươm Bồ Điền","Trâm Nhụy Kiều","Giáp vàng Nhụy Kiều","Váy trận Núi Nưa","Bao tay Bồ Điền","Guốc ngà Bà Triệu","Cờ Nhụy Kiều tướng quân","Voi một ngà","elephant","str:5,hp:30","crit2:4,atkSpd:5","str:7,dmgMax:8","wave",50,"Cưỡi gió đạp sóng: mỗi đòn thứ 4 tung sóng 50% sát thương"],["le-chan","Lê Chân","f","An Biên","sword","Kiếm An Biên","shield","Khiên Hải tần","Mũ nữ tướng An Biên","Giáp thủy quân","Váy trận An Biên","Bao tay chài lưới","Hài Hải Phòng","Cờ An Biên","Ngựa An Biên","horse","def:5,hp:30","block:4,dmgRed:4","vit:6,reflect:5","shield",18,"Thành An Biên: mỗi 10 giây nhận lá chắn bằng 18% máu tối đa"],["phung-thi-chinh","Phùng Thị Chính","f","Lãng Bạc","sword","Kiếm Lãng Bạc","shield","Khiên Phùng nữ tướng","Mũ Phùng nữ tướng","Giáp Lãng Bạc","Váy trận Lãng Bạc","Bao tay Lãng Bạc","Hài Lãng Bạc","Cờ nữ tướng Lãng Bạc","Ngựa Lãng Bạc","horse","vit:5,hpReg:1","hp:60,def:4","str:5,reflect:6","heal",2,"Trận Lãng Bạc: hồi 2% máu tối đa mỗi giây"],["vu-thi-thuc","Bát Nàn","f","Tiên La","sword","Kiếm Tiên La","shield","Khiên Bát Nàn","Mũ Bát Nàn công chúa","Giáp Tiên La","Váy trận Bát Nàn","Bao tay Tiên La","Hài Tiên La","Cờ Bát Nàn","Ngựa Tiên La","horse","str:4,hp:30","crit2:3,trueDmg:5","str:6,atkSpd:6","lifesteal",6,"Bát Nàn: hút 6% sát thương gây ra thành máu"],["duong-van-nga","Dương Vân Nga","f","Hoa Lư","staff","Trượng Thái hậu","staff","Gậy ngọc Hoa Lư","Mũ phượng Dương Vân Nga","Áo phượng Hoa Lư","Xiêm y Thái hậu","Bao tay ngọc Hoa Lư","Hài phượng","Áo choàng Thái hậu","Kiệu ngựa Hoa Lư","horse","int:5,mp:30","mpReg:2,cdr:5","int:7,hp:40","revive",50,"Trao áo long cổn: hồi sinh tại chỗ một lần mỗi 5 phút với 50% máu"],["y-lan","Ỷ Lan","f","Thổ Lỗi","staff","Trượng Nhiếp chính","shield","Khiên Thổ Lỗi","Mũ Nguyên phi","Áo Nguyên phi","Xiêm y Thổ Lỗi","Bao tay Nhiếp chính","Hài Thổ Lỗi","Áo choàng Ỷ Lan","Ngựa Thăng Long","horse","cmd:3,int:4","cdr:5,mp:30","int:6,dmgRed:5","aura",20,"Nhiếp chính: bản thân và lính đánh thuê +20% sát thương"],["bui-thi-xuan","Bùi Thị Xuân","f","Tây Sơn ngũ phụng","sword","Song kiếm Bùi Thị Xuân","sword","Đoản kiếm Tây Sơn","Mũ Đô đốc","Giáp Tây Sơn","Váy trận Tây Sơn","Bao tay luyện voi","Hài Tây Sơn","Cờ ngũ phụng","Voi chiến Bùi Thị Xuân","elephant","str:4,cmd:3","atkSpd:6,crit2:3","str:6,crit3:2","stun",12,"Thuần voi: đòn đánh có 12% làm quái choáng 1 giây"]],"tuong":[["id","nhan_vat","gioi_tinh","ten_bo","vu_khi_loai","vu_khi","tay_trai_loai","tay_trai","mu","ao","quan","gang","giay","canh","thu_cuoi","thu_cuoi_loai","moc_3","moc_5","moc_7","hieu_ung_9","gia_tri_9","mo_ta_9","mau","mo_ta"],["quan-vu","Quan Vũ","m","Thanh Long","saber","Thanh Long Yển Nguyệt Đao","","","Mũ xanh Hán Thọ Đình Hầu","Chiến bào xanh lục","Quần trận Hán Thọ","Bao tay Nghĩa Dũng","Hài Hán Thọ","Áo choàng xanh Quan Công","Xích Thố","horse","str:8,hp:40","crit2:5,dmgRed:4","str:8,crit3:3","execute",15,"Quá ngũ quan trảm lục tướng: kết liễu quái thường còn dưới 15% máu","#2a8a4a","Võ thánh, mặt đỏ râu dài, nghĩa khí cao vời"],["truong-phi","Trương Phi","m","Yến Nhân","spear","Bát Xà Mâu","","","Mũ trụ Yến Nhân","Giáp đen Trương Dực Đức","Quần trận Trường Bản","Bao tay Yến Nhân","Hài Trường Bản","Áo choàng đen Yến Nhân","Ngựa Ô Vân","horse","str:9,hp:30","atkSpd:6,crit2:4","str:8,dmgMax:10","stun",18,"Tiếng thét Trường Bản: đòn đánh có 18% làm quái choáng 1 giây","#2a2a3a","Mãnh tướng hét vỡ cầu Trường Bản"],["trieu-van","Triệu Vân","m","Thường Sơn","spear","Long Đảm Lượng Ngân Thương","","","Mũ bạc Thường Sơn","Giáp bạc Tử Long","Quần trận Thường Sơn","Bao tay Tử Long","Hài bạc Thường Sơn","Áo choàng trắng Tử Long","Bạch Long Mã","horse","agi:7,def:5","dodge:5,atkSpd:6","str:7,crit2:5","counter",100,"Thất tiến thất xuất: sau khi né, đòn kế tiếp gây gấp đôi","#e8ecf2","Toàn thân là gan, một mình cứu ấu chủ"],["lu-bo","Lữ Bố","m","Phi Tướng","spear","Phương Thiên Họa Kích","","","Mũ Tam Xoa Thúc Phát Tử Kim Quan","Giáp Thú Diện Thôn Đầu Liên Hoàn","Quần trận Hổ Lao","Bao tay Phi Tướng","Hài Hổ Lao Quan","Áo choàng Bách Hoa Chiến Bào","Xích Thố Mã","horse","str:10,agi:5","crit2:6,atkSpd:5","str:10,crit3:4","cleave",50,"Nhân trung Lữ Bố: đòn thường lan 50% sát thương sang quái gần","#c03030","Mãnh tướng vô song thời Tam Quốc"],["ma-sieu","Mã Siêu","m","Tây Lương","spear","Hổ Đầu Trảm Kim Thương","","","Mũ bạc Tây Lương","Giáp bạc Mã Mạnh Khởi","Quần trận Tây Lương","Bao tay Mã Siêu","Hài Tây Lương","Áo choàng trắng Tây Lương","Ngựa Tây Lương","horse","agi:8,moveSpd:5","str:6,crit2:4","atkSpd:8,dmgMax:8","haste",40,"Thần tốc Tây Lương: hạ quái tăng 40% tốc đánh và tốc chạy trong 4 giây","#d8dde8","Cẩm Mã Siêu, kỵ binh Tây Lương"],["hoang-trung","Hoàng Trung","m","Lão Tướng","bow","Bách Bộ Xuyên Dương Cung","","","Mũ lão tướng Hán Thăng","Giáp Hoàng Hán Thăng","Quần trận Định Quân","Bao tay bắn cung","Hài Định Quân Sơn","Áo choàng vàng Hoàng Trung","Ngựa Định Quân","horse","str:6,aim:5","crit2:6,aim:5","str:7,crit3:3","execute",12,"Trăm bước xuyên lá dương: kết liễu quái thường còn dưới 12% máu","#c8a040","Lão tướng bách phát bách trúng"],["gia-cat-luong","Gia Cát Lượng","m","Ngọa Long","staff","Quạt lông Ngọa Long","staff","Trúc giản Long Trung","Khăn Khổng Minh","Áo bát quái Ngọa Long","Quần đạo bào Long Trung","Bao tay Thừa tướng","Hài Long Trung","Áo choàng bát quái","Xe tứ luân","horse","int:8,mp:40","cdr:8,mpReg:3","int:9,crit2:3","manaShield",35,"Bát trận đồ: 35% sát thương nhận vào trừ vào mana","#4a6a9a","Ngọa Long, mưu lược thần sầu"],["chu-du","Chu Du","m","Xích Bích","sword","Kiếm Ngô Việt","shield","Khiên thủy quân Giang Đông","Mũ Đại đô đốc","Áo bào đỏ Xích Bích","Quần Đại đô đốc","Bao tay Giang Đông","Hài Xích Bích","Áo choàng lửa Xích Bích","Ngựa Giang Đông","horse","int:6,str:5","crit2:4,cdr:5","int:7,dmgMax:8","burn",35,"Hỏa thiêu Xích Bích: đòn đánh gây bỏng thêm 35% sát thương trong 3 giây","#c84a30","Đại đô đốc Đông Ngô, hỏa công Xích Bích"],["tao-thao","Tào Tháo","m","Ngụy Vương","sword","Ỷ Thiên Kiếm","sword","Thanh Cang Kiếm","Mũ Ngụy Vương","Long bào Ngụy Vương","Quần Ngụy Vương","Bao tay Mạnh Đức","Hài Hứa Xương","Áo choàng Ngụy Vương","Tuyệt Ảnh Mã","horse","cmd:4,int:5","str:6,crit2:4","cmd:5,dmgRed:5","aura",35,"Thiên hạ quy tâm: bản thân và lính đánh thuê +35% sát thương","#5a3a6a","Gian hùng thời loạn, năng thần thời bình"],["luu-bi","Lưu Bị","m","Huyền Đức","sword","Song Cổ Kiếm","sword","Song Cổ Kiếm (tả)","Mũ Hán Trung Vương","Long bào Thục Hán","Quần Huyền Đức","Bao tay Huyền Đức","Hài Thành Đô","Áo choàng Thục Hán","Đích Lư Mã","horse","cmd:4,hp:40","hp:60,def:5","cmd:5,hpReg:3","heal",2,"Nhân đức: hồi 2% máu tối đa mỗi giây","#d8c070","Hoàng đế Thục Hán, lấy nhân đức thu phục"],["ton-quyen","Tôn Quyền","m","Giang Đông","sword","Bạch Hồng Kiếm","shield","Khiên Giang Đông","Mũ Ngô Vương","Long bào Đông Ngô","Quần Ngô Vương","Bao tay Trọng Mưu","Hài Kiến Nghiệp","Áo choàng Đông Ngô","Ngựa Kiến Nghiệp","horse","def:6,hp:30","block:5,dmgRed:4","vit:7,reflect:6","shield",22,"Trường Giang thiên hiểm: mỗi 10 giây nhận lá chắn bằng 22% máu tối đa","#3a7a8a","Ngô Vương, mắt biếc râu tía"],["ha-hau-don","Hạ Hầu Đôn","m","Độc Nhãn","saber","Đao Hạ Hầu","shield","Khiên Nguyên Nhượng","Mũ trụ Độc Nhãn","Giáp Hạ Hầu","Quần trận Hạ Hầu","Bao tay Nguyên Nhượng","Hài Hạ Hầu","Áo choàng Hạ Hầu","Ngựa Hạ Hầu","horse","vit:7,def:4","hp:50,dmgRed:5","str:7,reflect:6","rage",40,"Bạt thỉ đạm tình: dưới 30% máu sát thương +40%","#6a4a3a","Nuốt mắt mình giữa trận, kiên cường vô song"],["dien-vi","Điển Vi","m","Cổ Chi Ác Lai","mace","Song Thiết Kích","mace","Song Thiết Kích (tả)","Khăn trụ Điển Vi","Giáp da Điển Vi","Quần trận Uyển Thành","Bao tay Ác Lai","Hài Uyển Thành","Áo choàng Điển Vi","Ngựa Uyển Thành","horse","str:9,vit:5","atkSpd:6,crit2:4","str:8,hp:50","stun",20,"Song thiết kích: đòn đánh có 20% làm quái choáng 1 giây","#7a4a2a","Hộ vệ Tào Tháo, chết đứng giữ cửa"],["hua-chu","Hứa Chử","m","Hổ Si","mace","Đại Thiết Chùy Hổ Si","","","Khăn trụ Hổ Si","Giáp Hứa Trọng Khang","Quần trận Hổ Si","Bao tay Hổ Si","Hài Hổ Si","Áo choàng Hứa Chử","Ngựa Hổ Si","horse","str:8,hp:40","hp:60,def:5","str:9,dmgMax:10","shield",25,"Hổ Si: mỗi 10 giây nhận lá chắn bằng 25% máu tối đa","#8a6a3a","Hổ Si cởi trần đánh Mã Siêu"],["cam-ninh","Cam Ninh","m","Cẩm Phàm","saber","Đao Cẩm Phàm","shield","Khiên Cẩm Phàm","Mũ lông chim Cam Ninh","Áo gấm Cẩm Phàm","Quần Cẩm Phàm","Bao tay Hưng Bá","Hài Cẩm Phàm","Áo choàng gấm Cẩm Phàm","Ngựa Hưng Bá","horse","agi:7,atkSpd:5","moveSpd:6,crit2:4","str:6,dodge:5","haste",45,"Trăm kỵ cướp trại: hạ quái tăng 45% tốc đánh và tốc chạy trong 4 giây","#a04060","Tướng cướp Cẩm Phàm, trăm kỵ phá trại Tào"],["thai-su-tu","Thái Sử Từ","m","Thần Xạ","bow","Cung Thần Xạ Tử Nghĩa","","","Mũ Thần Xạ","Giáp Thái Sử","Quần trận Thần Đình","Bao tay Thần Xạ","Hài Thần Đình","Áo choàng Thái Sử Từ","Ngựa Thần Đình","horse","agi:6,aim:6","crit2:6,atkSpd:5","str:7,aim:6","wave",70,"Thần xạ: mỗi đòn thứ 4 tung sóng chém 70% sát thương","#6a8a4a","Thần xạ thủ, hứa hẹn giữ chữ tín"],["khuong-tu-nha","Khương Tử Nha","m","Phong Thần","staff","Đả Thần Tiên","staff","Hạnh Hoàng Kỳ","Mũ đạo Côn Luân","Đạo bào Khương Thượng","Quần đạo Côn Luân","Bao tay Tử Nha","Hài Côn Luân","Áo choàng Phong Thần","Tứ Bất Tướng","elephant","int:9,mp:40","cdr:8,mpReg:3","int:10,crit2:4","revive",60,"Phong thần bảng: hồi sinh tại chỗ một lần mỗi 5 phút với 60% máu","#8a6aa0","Thái công vọng, câu cá chờ thời"],["ton-vu","Tôn Vũ","m","Binh Thánh","sword","Kiếm Binh Pháp","shield","Khiên Mười Ba Thiên","Mũ Binh Thánh","Áo bào Binh Pháp","Quần Binh Thánh","Bao tay Tôn Tử","Hài Ngô Quốc","Áo choàng Binh Pháp","Ngựa Ngô Quốc","horse","cmd:5,int:5","cdr:6,def:5","cmd:6,crit2:4","aura",40,"Binh pháp Tôn Tử: bản thân và lính đánh thuê +40% sát thương","#3a5a7a","Binh thánh, tác giả Binh pháp mười ba thiên"],["bach-khoi","Bạch Khởi","m","Nhân Đồ","saber","Đao Nhân Đồ","","","Mũ trụ Tần Quốc","Giáp đen Nhân Đồ","Quần trận Trường Bình","Bao tay Nhân Đồ","Hài Trường Bình","Áo choàng đen Bạch Khởi","Ngựa Tần Quốc","horse","str:8,crit2:4","crit2:6,atkSpd:5","str:9,crit3:4","execute",20,"Trường Bình: kết liễu quái thường còn dưới 20% máu","#2a2a2a","Nhân Đồ, bách chiến bách thắng"],["han-tin","Hàn Tín","m","Binh Tiên","sword","Kiếm Binh Tiên","shield","Khiên Bối Thủy","Mũ Tề Vương","Giáp Hàn Tín","Quần trận Bối Thủy","Bao tay Binh Tiên","Hài Bối Thủy","Áo choàng Binh Tiên","Ngựa Tề Vương","horse","cmd:5,hp:30","str:6,cdr:5","cmd:6,dmgMax:8","aura",30,"Đa đa ích thiện: bản thân và lính đánh thuê +30% sát thương","#5a6a3a","Binh Tiên, bối thủy nhất chiến"],["hang-vu","Hạng Vũ","m","Bá Vương","spear","Bá Vương Thương","","","Mũ Tây Sở Bá Vương","Giáp Tây Sở","Quần trận Cai Hạ","Bao tay Bá Vương","Hài Cai Hạ","Áo choàng Tây Sở","Ô Truy","horse","str:10,hp:40","crit2:6,crit3:3","str:10,dmgMax:12","rage",50,"Lực bạt sơn hà: dưới 30% máu sát thương +50%","#1a1a2a","Tây Sở Bá Vương, lực bạt sơn hà"],["ly-quang","Lý Quảng","m","Phi Tướng Quân","bow","Cung Phi Tướng Quân","","","Mũ Hán Phi Tướng","Giáp Lý Quảng","Quần trận Nhạn Môn","Bao tay Phi Tướng","Hài Nhạn Môn","Áo choàng Lý Quảng","Ngựa Nhạn Môn","horse","agi:7,aim:6","crit2:6,aim:6","str:7,crit3:3","frost",25,"Xạ hổ: đòn đánh có 25% làm quái chậm lại","#8a7a5a","Phi Tướng Quân, bắn đá tưởng hổ"],["ve-thanh","Vệ Thanh","m","Trường Bình Hầu","saber","Đao Trường Bình Hầu","shield","Khiên Hán Kỵ","Mũ Đại tướng quân","Giáp Vệ Thanh","Quần trận Hà Nam","Bao tay Đại tướng quân","Hài Hà Nam","Áo choàng Vệ Thanh","Ngựa Hán Kỵ","horse","agi:6,def:5","moveSpd:6,atkSpd:5","str:7,dmgRed:5","cleave",45,"Kỵ binh Hán: đòn thường lan 45% sát thương sang quái gần","#6a7a8a","Đại tướng quân phá Hung Nô"],["tiet-nhan-quy","Tiết Nhân Quý","m","Bạch Bào","spear","Phương Thiên Kích Bạch Bào","","","Mũ bạc Bạch Bào","Giáp trắng Tiết Nhân Quý","Quần trận Thiên Sơn","Bao tay Bạch Bào","Hài Thiên Sơn","Áo choàng trắng Bạch Bào","Ngựa trắng Thiên Sơn","horse","str:8,agi:5","crit2:5,atkSpd:6","str:8,crit3:3","wave",75,"Tam tiễn định Thiên Sơn: mỗi đòn thứ 4 tung sóng chém 75% sát thương","#f0f0f0","Tướng áo trắng, ba mũi tên định Thiên Sơn"],["ly-tinh","Lý Tịnh","m","Vệ Công","sword","Kiếm Vệ Công","shield","Khiên Lục Hoa Trận","Mũ Vệ Quốc Công","Giáp Lý Dược Sư","Quần Vệ Công","Bao tay Dược Sư","Hài Âm Sơn","Áo choàng Vệ Công","Ngựa Âm Sơn","horse","cmd:5,int:5","def:6,cdr:5","cmd:6,dmgRed:6","shield",28,"Lục hoa trận: mỗi 10 giây nhận lá chắn bằng 28% máu tối đa","#4a6a6a","Vệ Công, binh pháp Lục Hoa"],["tan-thuc-bao","Tần Thúc Bảo","m","Song Giản","mace","Song Giản Tần Quỳnh","mace","Song Giản Tần Quỳnh (tả)","Mũ Hộ Quốc Công","Giáp vàng Tần Quỳnh","Quần trận Hộ Quốc","Bao tay Song Giản","Hài Hộ Quốc","Áo choàng Tần Thúc Bảo","Hoàng Phiêu Mã","horse","str:8,vit:5","atkSpd:6,crit2:5","str:8,hp:50","stun",22,"Song giản: đòn đánh có 22% làm quái choáng 1 giây","#c8a030","Môn thần, song giản vô địch"],["nhac-phi","Nhạc Phi","m","Tinh Trung","spear","Lịch Tuyền Thương","","","Mũ Nhạc Vũ Mục","Giáp Tinh Trung Báo Quốc","Quần trận Nhạc Gia Quân","Bao tay Nhạc Phi","Hài Chu Tiên Trấn","Áo choàng Tinh Trung","Ngựa Nhạc Gia","horse","str:8,cmd:4","def:6,crit2:5","str:8,cmd:5","aura",45,"Nhạc gia quân: bản thân và lính đánh thuê +45% sát thương","#c83a3a","Tinh trung báo quốc, Nhạc gia quân bất khả bại"],["hoa-moc-lan","Hoa Mộc Lan","f","Mộc Lan","sword","Kiếm Mộc Lan","shield","Khiên Mộc Lan","Mũ trụ Mộc Lan","Giáp Mộc Lan","Quần trận Mộc Lan","Bao tay Mộc Lan","Hài Mộc Lan","Áo choàng Mộc Lan","Ngựa Mộc Lan","horse","agi:7,def:4","dodge:5,atkSpd:6","str:6,crit2:5","counter",100,"Thay cha tòng quân: sau khi né, đòn kế tiếp gây gấp đôi","#d06080","Nữ tướng cải trang thay cha tòng quân"],["muc-que-anh","Mục Quế Anh","f","Mục Kha Trại","spear","Lê Hoa Thương","","","Mũ phượng Mục Quế Anh","Giáp Mục Kha Trại","Quần trận Dương Gia","Bao tay Mục Quế Anh","Hài Dương Gia","Áo choàng Mục Kha Trại","Ngựa Đào Hoa","horse","str:7,agi:6","crit2:5,atkSpd:6","str:8,dmgMax:10","cleave",48,"Phá Thiên Môn trận: đòn thường lan 48% sát thương sang quái gần","#e07090","Nữ tướng Dương gia, phá Thiên Môn trận"],["luong-hong-ngoc","Lương Hồng Ngọc","f","Hồng Ngọc","sword","Kiếm Hồng Ngọc","shield","Khiên Hoàng Thiên Đãng","Mũ nữ tướng Hồng Ngọc","Giáp Lương Hồng Ngọc","Quần trận Hoàng Thiên Đãng","Bao tay đánh trống","Hài Hoàng Thiên Đãng","Áo choàng Hồng Ngọc","Ngựa Hoàng Thiên Đãng","horse","cmd:4,hp:30","def:5,hpReg:2","cmd:5,reflect:6","heal",2,"Trống trận Hoàng Thiên Đãng: hồi 2% máu tối đa mỗi giây","#c03050","Nữ tướng đánh trống trận Hoàng Thiên Đãng"]],"do_than":[["id","ten","o","loai","cam","cong","thu","toc","thu_cuoi","mau","hieu_ung","gia_tri","mo_ta","gia"],["than-roi-sat","Roi sắt Thánh Gióng","hand","sword","one",40,0,0,"","#3c3f44","wave",80,"Mỗi đòn thứ 4 tung sóng lửa 80% sát thương",20000],["than-ngua-sat","Ngựa sắt Thánh Gióng","mount","mount","",0,10,190,"horse","#4a4d52","burn",40,"Ngựa phun lửa: đòn đánh gây bỏng thêm 40% sát thương",20000],["than-giap-sat","Giáp sắt Thánh Gióng","armor","armor","",0,40,0,"","#5a5e64","shield",30,"Mỗi 10 giây nhận lá chắn bằng 30% máu tối đa",20000],["than-no-kim-quy","Nỏ thần Kim Quy","hand","crossbow","two",60,0,0,"","#c9a24a","execute",20,"Kết liễu quái thường còn dưới 20% máu",20000],["than-kiem-thuan-thien","Kiếm Thuận Thiên","hand","sword","one",45,0,0,"","#9ff0d0","lifesteal",12,"Hút 12% sát thương gây ra thành máu",20000],["than-gay-chu-dong-tu","Gậy thần Chử Đồng Tử","hand","staff","one",38,0,0,"","#e6d28a","heal",3,"Hồi 3% máu tối đa mỗi giây",20000],["than-non-chu-dong-tu","Nón thần Chử Đồng Tử","hat","hat","",0,20,0,"","#f0dc90","revive",60,"Hồi sinh tại chỗ một lần mỗi 5 phút với 60% máu",20000],["than-canh-au-co","Cánh tiên Âu Cơ","wings","wings","",0,18,0,"","#ffd1ec","haste",50,"Hạ quái tăng 50% tốc đánh và tốc chạy trong 4 giây",20000],["than-khien-lac-long","Khiên vảy rồng Lạc Long Quân","hand","shield","one",0,35,0,"","#4fb3a8","stun",20,"Đòn đánh có 20% làm quái choáng 1 giây",20000],["than-giay-son-tinh","Giày mây Sơn Tinh","shoes","shoes","",0,16,0,"","#a8d08d","counter",150,"Sau khi né, đòn kế tiếp gây thêm 150%",20000],["than-gang-thuy-tinh","Bao tay sóng nước Thủy Tinh","gloves","gloves","",0,16,0,"","#5fb6ff","cleave",50,"Đòn thường lan 50% sát thương sang quái gần",20000]],"quai":[["ky_nang","id","ten","mau","sat_thuong","toc_do","toc_chay","ban_kinh","cao","tam_danh","tam_gan","hoi_chieu_ms","vung_tay_ms","dong","day_lui_phan_tram","boss","hoi_sinh_giay","dep_phan_van","hoan_hao_phan_van","huyen_thoai_phan_van","than_phan_van","hong_ngoc_it","hong_ngoc_nhieu","loai_sat_thuong","ti_le_x2","kinh_nghiem","ban_do"],["","deer","Hươu",192,1,60,190,16,44,0,0,0,0,8,100,0,12,800,120,8,0,0,0,"thuong",0,2,null],["","lion","Sư tử",301,11,70,165,18,40,240,50,1200,380,25,60,0,15,800,120,8,0,0,0,"thuong",5,3,null],["","elephant","Voi rừng",577,31,45,95,28,72,0,72,1900,650,60,15,0,20,1000,150,10,0,0,0,"thuong",5,5,null],["","croc","Cá sấu",381,16,35,150,20,20,150,58,1500,300,35,50,0,15,800,120,8,0,0,0,"thuong",5,3,null],["","chua-son-lam","Chúa Sơn Lâm",7298,9,80,150,30,64,260,74,1400,500,300,10,1,120,6000,2500,400,0,3,10,"huyen_thoai",15,40,null],["","ngu-tinh","Ngư Tinh",32189,43,40,110,40,80,280,120,2200,800,1000,5,2,300,8000,5000,1200,150,10,30,"than",20,80,null],["","bo-cap","Bọ cạp cát",621,20,55,160,22,30,240,56,1300,400,60,40,0,18,1200,250,0,0,0,0,"thuong",8,15,null],["","ken-ken","Kền kền",490,16,80,210,22,52,280,60,1100,350,55,50,0,18,1200,250,0,0,0,0,"thuong",8,13,null],["","chan-tinh","Chằn Tinh",14892,34,45,120,44,86,280,110,2000,700,1500,8,1,240,7000,3500,0,0,5,15,"hoan_hao",15,225,null],["phan-giap","thach-tinh","Thạch Tinh",14892,38,40,105,46,112,260,104,2200,800,1700,5,1,260,7200,3600,0,0,6,16,"hoan_hao",15,225,null],["","soi-tuyet","Sói tuyết",474,13,90,220,20,38,300,54,1000,300,70,50,0,18,1300,280,0,0,0,0,"thuong",10,14,null],["","gau-nui","Gấu ngựa",791,36,45,130,28,60,220,70,1800,600,110,20,0,22,1500,300,0,0,0,0,"thuong",8,22,null],["tron","ho-tinh","Hồ Tinh chín đuôi",17374,32,80,170,40,84,300,110,1600,600,1800,8,1,240,7500,3800,0,0,6,18,"hoan_hao",18,328,null],["","doi-quy","Dơi quỷ",268,7,95,230,20,56,260,52,1000,300,75,40,0,18,1400,300,0,0,0,0,"thuong",10,5,null],["","nhen-doc","Nhện độc",447,17,50,150,28,32,240,64,1600,500,120,25,0,22,1600,320,0,0,0,0,"thuong",10,9,null],["bay","dai-bang","Đại Bàng Tinh",8897,14,70,190,46,100,320,120,1800,650,2200,6,1,240,8000,4000,0,0,8,20,"hoan_hao",20,128,null],["","ke-trom-cho","Kẻ trộm chó",321,6,80,260,22,56,220,50,1100,350,40,30,0,9999,1500,350,0,0,0,0,"thuong",10,2,"thanh-moc"],["","linh-phuong-bac","Lính phương Bắc",3720,191,70,190,24,58,280,60,1300,450,400,30,0,9999,1500,350,0,0,0,0,"thuong",10,99,"co-loa"],["","tuong-phuong-bac","Tướng phương Bắc",8332,377,60,160,34,72,320,80,1700,600,2500,15,0,9999,1500,350,0,0,0,0,"thuong",10,181,"co-loa"],["","dao-tac","Đạo tặc",16950,812,80,230,24,56,300,60,1200,400,9000,30,0,9999,1500,350,0,0,0,0,"thuong",10,312,"thang-long"],["","ho-du","Hổ dữ sổng chuồng",31125,1912,90,260,36,60,320,70,1300,450,60000,40,0,9999,1500,350,0,0,0,0,"thuong",10,434,"hoa-lu"],["","gian-te","Gian tế áo đen",42438,2807,95,280,24,56,300,60,1000,350,300000,30,0,9999,1500,350,0,0,0,0,"thuong",10,659,"phu-xuan"],["","khi-rung","Khỉ rừng",946,40,70,190,24,50,260,56,1200,400,150,40,0,20,1500,350,0,0,0,0,"thuong",10,28,"rung-truc"],["","ran-ho","Rắn hổ mang",1324,60,55,160,28,60,240,64,1500,500,200,30,0,20,1500,350,0,0,0,0,"thuong",12,36,"rung-truc"],["slow,hoi-mau","moc-tinh","Mộc Tinh",20226,46,50,130,48,110,300,120,2000,700,4000,5,1,300,7500,4000,0,0,8,20,"hoan_hao",15,547,"rung-truc"],["","dia-khong-lo","Đỉa khổng lồ",1460,62,70,190,24,50,260,56,1200,400,270,40,0,20,1500,350,0,0,0,0,"thuong",10,48,"dam-lay"],["","ech-doc","Ếch độc",2043,94,55,160,28,60,240,64,1500,500,360,30,0,20,1500,350,0,0,0,0,"thuong",12,63,"dam-lay"],["poison,slow","xa-tinh","Xà Tinh",29061,69,50,130,48,110,300,120,2000,700,7200,5,1,300,7500,4000,0,0,10,24,"hoan_hao",16,947,"dam-lay"],["","ung-tuyet","Ưng tuyết",2277,98,70,190,24,50,260,56,1200,400,486,40,0,20,1500,350,0,0,0,0,"thuong",10,71,"dinh-may"],["","de-nui","Dê núi",3188,147,55,160,28,60,240,64,1500,500,648,30,0,20,1500,350,0,0,0,0,"thuong",12,93,"dinh-may"],["stun,slow,bay","loi-dieu","Lôi Điểu",43122,97,50,130,48,110,300,120,2000,700,12960,5,1,300,7500,4000,0,0,12,28,"hoan_hao",17,1395,"dinh-may"],["","am-binh","Âm binh",3307,177,70,190,24,50,260,56,1200,400,875,40,0,20,1500,350,0,0,0,0,"thuong",10,94,"co-loa"],["","quy-doi","Quỷ đói",4629,266,55,160,28,60,240,64,1500,500,1166,30,0,20,1500,350,0,0,0,0,"thuong",12,123,"co-loa"],["armor,weak","tuong-am-binh","Tướng Âm Binh",60811,171,50,130,48,110,300,120,2000,700,23328,5,1,300,7500,4000,200,0,14,32,"hoan_hao",18,1838,"co-loa"],["","cua-khong-lo","Cua khổng lồ",4477,238,70,190,24,50,260,56,1200,400,1575,40,0,20,1500,350,0,0,0,0,"thuong",10,118,"bien-dong"],["","muc-ma","Mực ma",6267,358,55,160,28,60,240,64,1500,500,2100,30,0,20,1500,350,0,0,0,0,"thuong",12,155,"bien-dong"],["slow,poison","thuong-luong","Thuồng Luồng",80651,218,50,130,48,110,300,120,2000,700,41990,5,1,300,7500,4000,400,0,16,36,"hoan_hao",19,2321,"bien-dong"],["","nham-thach-thu","Nham thạch thú",5457,294,70,190,24,50,260,56,1200,400,2834,40,0,20,1500,350,0,0,0,0,"thuong",10,147,"nui-lua"],["","quy-lua","Quỷ lửa",7640,440,55,160,28,60,240,64,1500,500,3779,30,0,20,1500,350,0,0,0,0,"thuong",12,192,"nui-lua"],["bomb,weak","hoa-long","Hỏa Long",97563,265,50,130,48,110,300,120,2000,700,75583,5,1,300,7500,4000,600,50,18,40,"hoan_hao",20,2875,"nui-lua"],["","ma-troi","Ma trơi",7387,400,70,190,24,50,260,56,1200,400,5102,40,0,20,1500,350,30,0,0,0,"thuong",10,178,"rung-ma"],["","quy-cay","Quỷ cây",10342,600,55,160,28,60,240,64,1500,500,6802,30,0,20,1500,350,30,0,0,0,"thuong",12,233,"rung-ma"],["weak,armor,poison","chua-quy","Chúa Quỷ",129582,349,50,130,48,110,300,120,2000,700,136049,5,1,300,7500,4000,850,170,20,44,"huyen_thoai",21,3500,"rung-ma"],["","voi-ma-mut","Voi ma mút",9151,482,70,190,24,50,260,56,1200,400,9183,40,0,20,1500,350,30,0,0,0,"thuong",10,208,"bang-nguyen"],["","yeu-tuyet","Yêu tuyết",12811,723,55,160,28,60,240,64,1500,500,12244,30,0,20,1500,350,30,0,0,0,"thuong",12,272,"bang-nguyen"],["freeze,slow,giap-bang","bang-hoang","Băng Hoàng",159050,419,50,130,48,110,300,120,2000,700,244888,5,1,300,7500,4000,1100,290,22,48,"huyen_thoai",22,4082,"bang-nguyen"],["","phan-quan","Phản quân",15779,780,70,190,24,50,260,56,1200,400,16530,40,0,20,1500,350,30,0,0,0,"thuong",10,295,"thang-long"],["","hac-ky","Hắc kỵ",22091,1171,55,160,28,60,240,64,1500,500,22040,30,0,20,1500,350,30,0,0,0,"thuong",12,386,"thang-long"],["armor,stun,weak","hac-long-tuong","Hắc Long Tướng",212586,547,50,130,48,110,300,120,2000,700,440798,5,1,300,7500,4000,1350,410,24,52,"huyen_thoai",23,4675,"thang-long"],["","thien-binh","Thiên binh",14539,765,70,190,24,50,260,56,1200,400,29754,40,0,20,1500,350,30,0,0,0,"thuong",10,266,"cuu-trung"],["","ky-lan","Kỳ lân",20354,1147,55,160,28,60,240,64,1500,500,39672,30,0,20,1500,350,30,0,0,0,"thuong",12,348,"cuu-trung"],["freeze,weak,bomb,tubao","ma-vuong","Ma Vương",247125,676,50,130,48,110,300,120,2000,700,793437,5,1,300,7500,4000,1600,530,26,56,"huyen_thoai",24,5217,"cuu-trung"],["","tom-tuong","Tôm tướng",16337,862,70,190,24,50,260,56,1200,400,53557,40,0,20,1500,500,40,0,1,2,"thuong",10,285,"thuy-cung"],["","ca-kiem","Cá kiếm",22871,1293,55,160,28,60,240,64,1500,500,71409,30,0,20,1500,500,40,0,1,2,"thuong",12,372,"thuy-cung"],["freeze,slow,poison","long-vuong","Long Vương Thủy Phủ",279175,775,50,130,48,110,300,120,2000,700,1428187,5,1,300,7500,4000,1725,590,28,60,"huyen_thoai",25,5582,"thuy-cung"],["","xuong-kho","Xương khô",17725,997,70,190,24,50,260,56,1200,400,80336,40,0,20,1500,500,50,0,1,3,"thuong",10,300,"hoang-mac-xuong"],["","bo-cap-den","Bọ cạp đen",24816,1496,55,160,28,60,240,64,1500,500,107114,30,0,20,1500,500,50,0,1,3,"thuong",12,393,"hoang-mac-xuong"],["armor,weak,bomb","hac-mo-vuong","Hắc Mộ Vương",301291,801,50,130,48,110,300,120,2000,700,2142280,5,1,300,7500,4000,1850,650,30,64,"huyen_thoai",26,5889,"hoang-mac-xuong"],["","tien-hac","Tiên hạc",19130,1038,70,190,24,50,260,56,1200,400,120503,40,0,20,1500,500,60,0,1,3,"thuong",10,316,"thien-son"],["","tuyet-vien","Tuyết viên",26781,1558,55,160,28,60,240,64,1500,500,160671,30,0,20,1500,500,60,0,1,3,"thuong",12,413,"thien-son"],["stun,slow,weak","phong-vuong","Phong Vương",350160,1095,50,130,48,110,300,120,2000,700,3213421,5,1,300,7500,4000,1975,710,32,68,"huyen_thoai",27,6198,"thien-son"],["","tho-phi","Thổ phỉ",28685,1688,70,190,24,50,260,56,1200,400,180755,40,0,20,1500,500,70,5,1,4,"hoan_hao",10,409,"hoa-lu"],["","ngao-den","Ngao đen",40159,2533,55,160,28,60,240,64,1500,500,241007,30,0,20,1500,500,70,5,1,4,"hoan_hao",12,535,"hoa-lu"],["armor,stun,weak,bomb","su-quan","Sứ Quân Phản Loạn",361855,1188,50,130,48,110,300,120,2000,700,4820131,5,1,300,7500,4000,2100,770,34,72,"than",28,6509,"hoa-lu"],["weak","nguu-dau","Ngưu Đầu",22975,1564,70,190,24,50,260,56,1200,400,271132,40,0,20,1500,500,80,10,1,4,"hoan_hao",10,348,"dia-nguc-mon"],["weak","ma-dien","Mã Diện",32165,2346,55,160,28,60,240,64,1500,500,361510,30,0,20,1500,500,80,10,1,4,"hoan_hao",12,455,"dia-nguc-mon"],["weak,armor,poison,bomb,tubao","diem-la-tuong","Diêm La Tướng",384969,1197,50,130,48,110,300,120,2000,700,7230196,5,1,300,7500,4000,2225,830,36,76,"than",29,6823,"dia-nguc-mon"],["armor","giao-long","Giao long",24442,1588,70,190,24,50,260,56,1200,400,406699,40,0,20,1500,500,90,15,1,5,"hoan_hao",10,369,"dao-rong"],["armor","hai-quy","Hải quỷ",34219,2382,55,160,28,60,240,64,1500,500,542265,30,0,20,1500,500,90,15,1,5,"hoan_hao",12,482,"dao-rong"],["freeze,slow,poison,bomb","hai-long-vuong","Hải Long Vương",403638,1292,50,130,48,110,300,120,2000,700,10845294,5,1,300,7500,4000,2350,890,38,80,"than",30,7232,"dao-rong"],["slow","ho-ly","Hồ ly",26351,1841,70,190,24,50,260,56,1200,400,610048,40,0,20,1500,500,100,20,1,5,"hoan_hao",10,388,"vuc-yeu-tinh"],["slow","yeu-tang","Yêu tăng",36891,2762,55,160,28,60,240,64,1500,500,813397,30,0,20,1500,500,100,20,1,5,"hoan_hao",12,508,"vuc-yeu-tinh"],["weak,freeze,poison,stun,tron","cuu-vi-ho","Cửu Vĩ Hồ",438690,1436,50,130,48,110,300,120,2000,700,16267941,5,1,300,7500,4000,2475,950,40,84,"than",31,7613,"vuc-yeu-tinh"],["poison","tho-ngoc","Thỏ ngọc chiến binh",27853,1935,70,190,24,50,260,56,1200,400,915072,40,0,20,1500,500,110,25,1,6,"hoan_hao",10,404,"cung-trang"],["poison","nguyet-binh","Nguyệt binh",38995,2903,55,160,28,60,240,64,1500,500,1220096,30,0,20,1500,500,110,25,1,6,"hoan_hao",12,529,"cung-trang"],["freeze,stun,weak,slow","nguyet-than","Nguyệt Thần",477422,2005,50,130,48,110,300,120,2000,700,24401912,5,1,300,7500,4000,2600,1010,42,88,"than",32,7933,"cung-trang"],["slow","ngu-lam-phan","Ngự lâm phản loạn",40499,3216,70,190,24,50,260,56,1200,400,1372608,40,0,20,1500,500,120,30,1,6,"hoan_hao",10,633,"phu-xuan"],["slow","chien-tuong","Chiến tượng",56699,4826,55,160,28,60,240,64,1500,500,1830143,30,0,20,1500,500,120,30,1,6,"hoan_hao",12,828,"phu-xuan"],["armor,stun,weak,bomb,tubao","hac-de","Hắc Đế",882044,1909,50,130,48,110,300,120,2000,700,36602868,5,2,300,7500,4000,2725,1070,44,92,"than",33,19766,"phu-xuan"],["poison","thien-tuong","Thiên tướng",50305,4342,70,190,24,50,260,56,1200,400,2058911,40,0,20,1500,500,120,30,1,7,"hoan_hao",10,597,"thien-dinh"],["poison","than-thu","Thần thú",70427,6516,55,160,28,60,240,64,1500,500,2745215,30,0,20,1500,500,120,30,1,7,"hoan_hao",12,781,"thien-dinh"],["freeze,weak,armor,bomb,tubao","hac-thien-ma","Hắc Thiên Ma",8019557,3428,50,130,48,110,300,120,2000,700,54904302,5,2,300,7500,4000,2850,1130,46,96,"than",34,31244,"thien-dinh"]],"nhiem_vu":[["id","ten","mo_ta","muc_tieu","so_luong","thuong_dong","thuong_hong_ngoc","thuong_do","pham_chat_do","lap_lai","thuong_kinh_nghiem","yeu_cau","loi_ket","truyen","npc","noi","npc_ten"],["q-huou","Săn hươu","Dân làng cần thịt hươu cho hội làng.","deer",5,200,0,"","","khong",20,null,null,null,null,null,null],["q-su-tu","Trừ sư tử","Sư tử bên Đông Ngạn hay vồ người đi rừng.","lion",3,500,0,"","","khong",50,null,null,null,null,null,null],["q-ca-sau","Diệt cá sấu","Cá sấu rình ở bến sông, dân không dám lấy nước.","croc",3,500,0,"","","khong",50,null,null,null,null,null,null],["q-voi","Đuổi voi rừng","Voi rừng phá nương rẫy phía đông.","elephant",2,800,0,"","","khong",80,null,null,null,null,null,null],["q-chua-son-lam","Hạ Chúa Sơn Lâm","Con hổ chúa ở rừng đông bắc đã giết nhiều thợ săn.","chua-son-lam",1,10000,0,"","","khong",1000,null,null,null,null,null,null],["q-ngu-tinh","Trừ Ngư Tinh","Ngư Tinh nổi lên ở đầm phía đông nam, dâng nước hại dân.","ngu-tinh",1,30000,0,"","","khong",3000,null,null,null,null,null,null],["q-bo-cap","Bọ cạp sa mạc","Lái buôn qua sa mạc phía bắc rừng Đông Ngạn bị bọ cạp cát đốt.","bo-cap",5,2000,0,"","","khong",200,null,null,null,null,null,null],["q-chan-tinh","Diệt Chằn Tinh","Chằn Tinh cuộn mình trong tháp cổ giữa sa mạc, đòi người nộp mạng.","chan-tinh",1,20000,0,"","","khong",2000,null,null,null,null,null,null],["q-thach-tinh","Phá Thạch Tinh","Thạch Tinh thức dậy ở góc tây nam sa mạc, đá lăn chặn đường lái buôn.","thach-tinh",1,22000,0,"","","khong",2200,null,null,null,null,null,null],["q-soi-tuyet","Đàn sói tuyết","Sói tuyết từ núi phía tây làng xuống bắt gia súc.","soi-tuyet",5,2500,0,"","","khong",250,null,null,null,null,null,null],["q-ho-tinh","Trừ Hồ Tinh","Hồ Tinh chín đuôi ẩn trên đỉnh núi tuyết, mê hoặc người lên núi.","ho-tinh",1,25000,0,"","","khong",2500,null,null,null,null,null,null],["q-nhen-doc","Ổ nhện độc","Nhện độc giăng tơ kín hang động phía nam rừng Đông Ngạn.","nhen-doc",3,3000,0,"","","khong",300,null,null,null,null,null,null],["q-dai-bang","Hạ Đại Bàng Tinh","Đại Bàng Tinh làm tổ trong hang đá thạch nhũ, bắt người về hang.","dai-bang",1,30000,0,"","","khong",3000,null,null,null,null,null,null],["tc-1","Dấu vết đầu tiên","Lũ khỉ rừng trúc cướp được một cây bút lông nhỏ. Bạn nhận ra cán bút khắc chữ \"An\" — tên con gái mình.","khi-rung",8,2000,5,"but-long","n","khong",800,"","Bút của con bé! Nó đã đi qua đây. Trên cán bút còn dính vết bùn đầm lầy… không, là mây — nó bị kéo lên Đỉnh Mây.",1,"thay-do","thanh-moc","Thầy đồ"],["tc-2","Nét chữ dở dang","Ưng tuyết trên Đỉnh Mây tha về tổ những mẩu giấy. Một tờ có nét chữ con gái bạn.","ung-tuyet",8,8000,10,"giay-muc","n","khong",3200,"tc-1","\"Bố ơi, người ta đưa con ra biển…\" Chữ run run nhưng vẫn đúng bút thuận bố dạy. Ra Bãi Biển Hoang!",1,"wizard","thanh-moc","Đạo sĩ"],["tc-3","Món quà sinh nhật","Cua khổng lồ ngoài bãi biển kẹp giữ một giá treo bút bằng gỗ, mặt sau khắc hình con cá.","cua-khong-lo",8,18000,15,"gia-treo-but","n","khong",7200,"tc-2","Giá treo bút bố tặng con năm ngoái. Vết kéo lê trên cát dẫn vào Rừng Ma.",1,"su-thay","co-loa","Sư thầy"],["tc-4","Mũi tên dưới đáy nghiên","Quỷ cây trong Rừng Ma nuốt một nghiên mực còn ẩm.","quy-cay",8,32000,20,"nghien-da","n","khong",12800,"tc-3","Đáy nghiên vẽ mũi tên chỉ về kinh thành. Thăng Long đang có phản loạn — con bé bị giữ ở đó.",1,"vu-cong","co-loa","Vũ công"],["tc-5","Trong ngực áo tướng giặc","Hắc Long Tướng cầm đầu phản quân Thăng Long giữ một phôi đá Thanh Điền khắc dở chữ \"Bình An\".","hac-long-tuong",1,50000,25,"an-thanh-dien","n","khong",20000,"tc-4","Hắn khai: \"Con bé được đưa về Hoang Mạc Xương, cho Hắc Mộ Vương.\" Bạn siết chặt ấn đá, lên đường.",1,"ca-nu","thang-long","Ca nữ"],["tc-6","Bức thư đóng ấn","Xương khô ngoài hoang mạc ôm theo một bức thư đóng ấn Ba Lâm — ấn khắc tên con gái bạn.","xuong-kho",8,72000,30,"an-ba-lam","n","khong",28800,"tc-5","Thư viết: \"Đưa nó ra Đảo Rồng, đổi lấy chìa khóa Thiên Đình.\" Hải Long Vương là kẻ nhận hàng.",1,"nghe-nhan","thang-long","Nghệ nhân đèn"],["tc-7","Vân đỏ Xương Hoá","Hải Long Vương ngoài Đảo Rồng giữ ấn Xương Hoá vân đỏ.","hai-long-vuong",1,98000,35,"an-xuong-hoa","n","khong",39200,"tc-6","Trên ấn khắc: \"Thiên Đình — tầng cao nhất\". Chỉ còn một cánh cửa nữa. Hắc Thiên Ma đang giữ chìa khóa.",1,"ca-tru","hoa-lu","Ca nương"],["tc-8","Cánh cửa Thiên Đình","Hắc Thiên Ma trên Thiên Đình giữ ấn Thọ Sơn — chìa khóa mở cánh cửa nơi con gái bạn bị nhốt.","hac-thien-ma",1,128000,40,"an-tho-son","n","khong",51200,"tc-7","Cánh cửa mở. Con bé ngồi giữa phòng, tay vẫn cầm bút tập viết. \"Bố!\" — Bạn đã phá đảo và tìm được con. Hành trình vẫn còn dài, nhưng từ nay hai cha con đi cùng nhau.",1,"cung-nu","phu-xuan","Cung nữ"],["q-khi-rung","Săn khỉ rừng","Khỉ rừng quấy phá vùng Rừng Trúc, dân không dám qua lại.","khi-rung",6,4000,0,"","","khong",400,null,null,null,null,null,null],["q-moc-tinh","Hạ Mộc Tinh","Mộc Tinh ngự trị Rừng Trúc. Hạ được nó, cả vùng yên ổn.","moc-tinh",1,40000,5,"","","khong",4000,null,null,null,null,null,null],["q-dia-khong-lo","Săn đỉa khổng lồ","Đỉa khổng lồ quấy phá vùng Đầm Lầy, dân không dám qua lại.","dia-khong-lo",6,7200,0,"","","khong",800,null,null,null,null,null,null],["q-xa-tinh","Hạ Xà Tinh","Xà Tinh ngự trị Đầm Lầy. Hạ được nó, cả vùng yên ổn.","xa-tinh",1,72000,7,"","","khong",8000,null,null,null,null,null,null],["q-ung-tuyet","Săn ưng tuyết","Ưng tuyết quấy phá vùng Đỉnh Mây, dân không dám qua lại.","ung-tuyet",6,12960,0,"","","khong",1600,null,null,null,null,null,null],["q-loi-dieu","Hạ Lôi Điểu","Lôi Điểu ngự trị Đỉnh Mây. Hạ được nó, cả vùng yên ổn.","loi-dieu",1,129600,9,"","","khong",16000,null,null,null,null,null,null],["q-am-binh","Săn âm binh","Âm binh quấy phá vùng Thành Cổ Loa, dân không dám qua lại.","am-binh",6,23328,0,"","","khong",3200,null,null,null,null,null,null],["q-tuong-am-binh","Hạ Tướng Âm Binh","Tướng Âm Binh ngự trị Thành Cổ Loa. Hạ được nó, cả vùng yên ổn.","tuong-am-binh",1,233280,11,"","","khong",32000,null,null,null,null,null,null],["q-cua-khong-lo","Săn cua khổng lồ","Cua khổng lồ quấy phá vùng Bãi Biển Hoang, dân không dám qua lại.","cua-khong-lo",6,41990,0,"","","khong",6400,null,null,null,null,null,null],["q-thuong-luong","Hạ Thuồng Luồng","Thuồng Luồng ngự trị Bãi Biển Hoang. Hạ được nó, cả vùng yên ổn.","thuong-luong",1,419904,13,"","","khong",64000,null,null,null,null,null,null],["q-nham-thach-thu","Săn nham thạch thú","Nham thạch thú quấy phá vùng Núi Lửa, dân không dám qua lại.","nham-thach-thu",6,75583,0,"","","khong",12800,null,null,null,null,null,null],["q-hoa-long","Hạ Hỏa Long","Hỏa Long ngự trị Núi Lửa. Hạ được nó, cả vùng yên ổn.","hoa-long",1,755827,15,"","","khong",128000,null,null,null,null,null,null],["q-ma-troi","Săn ma trơi","Ma trơi quấy phá vùng Rừng Ma, dân không dám qua lại.","ma-troi",6,136049,0,"","","khong",25600,null,null,null,null,null,null],["q-chua-quy","Hạ Chúa Quỷ","Chúa Quỷ ngự trị Rừng Ma. Hạ được nó, cả vùng yên ổn.","chua-quy",1,1360489,17,"","","khong",256000,null,null,null,null,null,null],["q-voi-ma-mut","Săn voi ma mút","Voi ma mút quấy phá vùng Băng Nguyên, dân không dám qua lại.","voi-ma-mut",6,244888,0,"","","khong",51200,null,null,null,null,null,null],["q-bang-hoang","Hạ Băng Hoàng","Băng Hoàng ngự trị Băng Nguyên. Hạ được nó, cả vùng yên ổn.","bang-hoang",1,2448880,19,"","","khong",512000,null,null,null,null,null,null],["q-phan-quan","Săn phản quân","Phản quân quấy phá vùng Kinh Thành Thăng Long, dân không dám qua lại.","phan-quan",6,440798,0,"","","khong",102400,null,null,null,null,null,null],["q-hac-long-tuong","Hạ Hắc Long Tướng","Hắc Long Tướng ngự trị Kinh Thành Thăng Long. Hạ được nó, cả vùng yên ổn.","hac-long-tuong",1,4407984,21,"","","khong",1024000,null,null,null,null,null,null],["q-thien-binh","Săn thiên binh","Thiên binh quấy phá vùng Cửu Trùng Đài, dân không dám qua lại.","thien-binh",6,793437,0,"","","khong",204800,null,null,null,null,null,null],["q-ma-vuong","Hạ Ma Vương","Ma Vương ngự trị Cửu Trùng Đài. Hạ được nó, cả vùng yên ổn.","ma-vuong",1,7934372,23,"","","khong",2048000,null,null,null,null,null,null],["q-tom-tuong","Săn tôm tướng","Tôm tướng quấy phá vùng Thủy Cung, dân không dám qua lại.","tom-tuong",6,1428187,0,"","","khong",409600,null,null,null,null,null,null],["q-long-vuong","Hạ Long Vương Thủy Phủ","Long Vương Thủy Phủ ngự trị Thủy Cung. Hạ được nó, cả vùng yên ổn.","long-vuong",1,14281869,25,"","","khong",4096000,null,null,null,null,null,null],["q-xuong-kho","Săn xương khô","Xương khô quấy phá vùng Hoang Mạc Xương, dân không dám qua lại.","xuong-kho",6,2142280,0,"","","khong",614400,null,null,null,null,null,null],["q-hac-mo-vuong","Hạ Hắc Mộ Vương","Hắc Mộ Vương ngự trị Hoang Mạc Xương. Hạ được nó, cả vùng yên ổn.","hac-mo-vuong",1,21422803,27,"","","khong",6144000,null,null,null,null,null,null],["q-tien-hac","Săn tiên hạc","Tiên hạc quấy phá vùng Thiên Sơn, dân không dám qua lại.","tien-hac",6,3213421,0,"","","khong",921600,null,null,null,null,null,null],["q-phong-vuong","Hạ Phong Vương","Phong Vương ngự trị Thiên Sơn. Hạ được nó, cả vùng yên ổn.","phong-vuong",1,32134205,29,"","","khong",9216000,null,null,null,null,null,null],["q-tho-phi","Săn thổ phỉ","Thổ phỉ quấy phá vùng Cố Đô Hoa Lư, dân không dám qua lại.","tho-phi",6,4820131,0,"","","khong",1382400,null,null,null,null,null,null],["q-su-quan","Hạ Sứ Quân Phản Loạn","Sứ Quân Phản Loạn ngự trị Cố Đô Hoa Lư. Hạ được nó, cả vùng yên ổn.","su-quan",1,48201308,31,"","","khong",13824000,null,null,null,null,null,null],["q-nguu-dau","Săn ngưu đầu","Ngưu Đầu quấy phá vùng Địa Ngục Môn, dân không dám qua lại.","nguu-dau",6,7230196,0,"","","khong",2073600,null,null,null,null,null,null],["q-diem-la-tuong","Hạ Diêm La Tướng","Diêm La Tướng ngự trị Địa Ngục Môn. Hạ được nó, cả vùng yên ổn.","diem-la-tuong",1,72301961,33,"","","khong",20736000,null,null,null,null,null,null],["q-giao-long","Săn giao long","Giao long quấy phá vùng Đảo Rồng, dân không dám qua lại.","giao-long",6,10845294,0,"","","khong",3110400,null,null,null,null,null,null],["q-hai-long-vuong","Hạ Hải Long Vương","Hải Long Vương ngự trị Đảo Rồng. Hạ được nó, cả vùng yên ổn.","hai-long-vuong",1,108452942,35,"","","khong",31104000,null,null,null,null,null,null],["q-ho-ly","Săn hồ ly","Hồ ly quấy phá vùng Vực Yêu Tinh, dân không dám qua lại.","ho-ly",6,16267941,0,"","","khong",4665600,null,null,null,null,null,null],["q-cuu-vi-ho","Hạ Cửu Vĩ Hồ","Cửu Vĩ Hồ ngự trị Vực Yêu Tinh. Hạ được nó, cả vùng yên ổn.","cuu-vi-ho",1,162679413,37,"","","khong",46656000,null,null,null,null,null,null],["q-tho-ngoc","Săn thỏ ngọc chiến binh","Thỏ ngọc chiến binh quấy phá vùng Cung Trăng, dân không dám qua lại.","tho-ngoc",6,24401912,0,"","","khong",6998400,null,null,null,null,null,null],["q-nguyet-than","Hạ Nguyệt Thần","Nguyệt Thần ngự trị Cung Trăng. Hạ được nó, cả vùng yên ổn.","nguyet-than",1,244019120,39,"","","khong",69984000,null,null,null,null,null,null],["q-ngu-lam-phan","Săn ngự lâm phản loạn","Ngự lâm phản loạn quấy phá vùng Kinh Thành Phú Xuân, dân không dám qua lại.","ngu-lam-phan",6,36602868,0,"","","khong",10497600,null,null,null,null,null,null],["q-hac-de","Hạ Hắc Đế","Hắc Đế ngự trị Kinh Thành Phú Xuân. Hạ được nó, cả vùng yên ổn.","hac-de",1,366028679,41,"","","khong",104976000,null,null,null,null,null,null],["q-thien-tuong","Săn thiên tướng","Thiên tướng quấy phá vùng Thiên Đình, dân không dám qua lại.","thien-tuong",6,54904302,0,"","","khong",15746400,null,null,null,null,null,null],["q-hac-thien-ma","Hạ Hắc Thiên Ma","Hắc Thiên Ma ngự trị Thiên Đình. Hạ được nó, cả vùng yên ổn.","hac-thien-ma",1,549043019,43,"","","khong",157464000,null,null,null,null,null,null]],"ban_do":[["id","ten","cap","bieu_tuong","thu_tu"],["thanh-moc","Làng Thanh Mộc",1,"home",1],["hang-dong","Hang động",5,"light",2],["sa-mac","Sa mạc",10,"flame",3],["nui-tuyet","Núi tuyết",15,"ice",4],["rung-truc","Rừng Trúc",20,"wood",5],["dam-lay","Đầm Lầy",35,"water",6],["dinh-may","Đỉnh Mây",55,"wind",7],["co-loa","Thành Cổ Loa",70,"shield",8],["bien-dong","Bãi Biển Hoang",90,"water",9],["nui-lua","Núi Lửa",105,"flame",10],["rung-ma","Rừng Ma",130,"demon",11],["bang-nguyen","Băng Nguyên",150,"ice",12],["thang-long","Kinh Thành Thăng Long",170,"flag",13],["cuu-trung","Cửu Trùng Đài",190,"spark",14],["thuy-cung","Thủy Cung",205,"water",15],["hoang-mac-xuong","Hoang Mạc Xương",215,"earth",16],["thien-son","Thiên Sơn",225,"ice",17],["hoa-lu","Cố Đô Hoa Lư",235,"shield",18],["dia-nguc-mon","Địa Ngục Môn",245,"flame",19],["dao-rong","Đảo Rồng",255,"demon",20],["vuc-yeu-tinh","Vực Yêu Tinh",270,"demon",21],["cung-trang","Cung Trăng",280,"light",22],["phu-xuan","Kinh Thành Phú Xuân",290,"flag",23],["thien-dinh","Thiên Đình",300,"light",24]],"linh":[["id","ten","gioi_tinh","gia","menh_lenh","suc_manh","nhanh_nhen","suc_khoe","tri_tue","trang_bi","mo_ta","thanh"],["dan-binh","Dân binh","m",100,5,12,8,12,4,"spear,hat","Lính giáo rẻ, máu trâu",null],["cung-thu","Nữ cung thủ","f",300,5,10,14,8,6,"bow,shoes","Bắn từ xa",null],["vo-si","Võ sĩ","m",600,8,16,10,14,4,"sword,shield,armor","Kiếm khiên, chịu đòn tốt",null],["dao-si","Đạo sĩ trẻ","m",800,6,6,8,10,20,"staff-jade,hat","Bắn cầu phép",null],["nu-tuong","Nữ tướng","f",1200,10,18,14,14,6,"sword-iron,sword-iron,armor-leather","Song kiếm, đánh nhanh",null],["linh-au-lac","Lính Âu Lạc","m",8000,12,34,22,30,10,"kiem-co-loa,khien-co-loa,giap-co-loa","Lính thành Cổ Loa, kiếm khiên vững chãi","co-loa"],["no-thu-co-loa","Nỏ thủ Cổ Loa","f",9000,12,24,36,24,12,"cung-co-loa,mu-co-loa,giay-co-loa","Nỏ thần Cổ Loa, bắn xa","co-loa"],["cam-ve-thang-long","Cấm vệ Thăng Long","m",30000,16,60,40,56,16,"kiem-thang-long,khien-thang-long,giap-thang-long,mu-thang-long","Cấm quân kinh thành, chịu đòn cực tốt","thang-long"],["phap-su-thang-long","Pháp sư hoàng cung","f",32000,16,20,36,40,70,"gay-thang-long,mu-thang-long,giay-thang-long","Phép thuật diện rộng","thang-long"],["vo-si-hoa-lu","Võ sĩ Hoa Lư","m",80000,20,90,60,86,20,"kiem-hoa-lu,kiem-hoa-lu,giap-hoa-lu,quan-hoa-lu","Song kiếm Trường Yên, đánh nhanh","hoa-lu"],["xa-thu-hoa-lu","Xạ thủ Hoa Lư","f",85000,20,50,96,60,30,"cung-hoa-lu,mu-hoa-lu,gang-hoa-lu,giay-hoa-lu","Bắn tỉa từ xa","hoa-lu"],["ngu-lam-phu-xuan","Ngự lâm Phú Xuân","m",200000,25,130,90,130,30,"giao-phu-xuan,giap-phu-xuan,mu-phu-xuan,quan-phu-xuan","Thương dài ngự lâm, sát thương cao nhất","phu-xuan"],["quoc-su-phu-xuan","Quốc sư Phú Xuân","m",220000,25,40,70,90,140,"gay-phu-xuan,mu-phu-xuan,gang-phu-xuan","Phép thuật thượng thừa","phu-xuan"]],"bo_cau_hoi":[["id","ten","thu_tu","thuong_hong_ngoc","quai","so_luong","ban_do"],["DX_AN_CHUONG","Ấn chương",1,10,"khi-rung",8,"rung-truc"],["DX_VUONG_HI_CHI","Vương Hi Chi",2,12,"dia-khong-lo",8,"dam-lay"],["DX_AU_DUONG_TUAN","Âu Dương Tuân",3,15,"ung-tuyet",8,"dinh-may"]],"cau_hoi":[["id","bo","thu_tu","cau","a","b","c","d","dap_an"],["DX_AN_CHUONG-Q01","DX_AN_CHUONG",1,"Ấn âm văn tạo dấu như thế nào trên giấy?","Chữ đỏ, nền trắng","Chữ đen, nền đỏ","Chữ trắng, nền đỏ","Chữ đỏ, nền đen","C"],["DX_AN_CHUONG-Q02","DX_AN_CHUONG",2,"Ấn dương văn có đặc điểm nào?","Chữ khắc nổi, in ra chữ đỏ","Khắc chìm, dấu chữ trắng trên nền đỏ","Khắc nổi, dấu chữ trắng trên nền đỏ","Khắc nổi, in ra chữ đen","A"],["DX_AN_CHUONG-Q03","DX_AN_CHUONG",3,"Vì sao cần trộn đều chu sa trước khi đóng ấn?","Để chu sa khô nhanh và bám giấy hơn","Để màu đỏ chuyển sang sắc đen","Để mặt ấn được phủ kín bằng dầu","Để dầu và phần thịt hòa đều, hạn chế loang dầu","D"],["DX_AN_CHUONG-Q04","DX_AN_CHUONG",4,"Danh chương chủ yếu giúp người xem biết điều gì?","Cho biết loại giấy và kích thước tác phẩm","Ai là người viết tác phẩm","Ghi lại nội dung chính của tác phẩm","Đánh dấu vị trí cần bồi biểu","B"],["DX_AN_CHUONG-Q05","DX_AN_CHUONG",5,"Theo bài đọc, kích thước con dấu nên thế nào?","Lớn hơn chữ chính văn để tạo điểm nhấn","Luôn giữ cùng kích thước bất kể chính văn","Bằng hoặc nhỏ hơn chữ chính văn","Tỷ lệ phải dựa theo khổ giấy, không xét chữ chính văn","C"],["DX_VUONG_HI_CHI-Q01","DX_VUONG_HI_CHI",1,"Theo bài viết, tên tự của Vương Hi Chi là gì?","Hữu Quân","Dật Thiếu","Hiến Chi","Thảo Thánh","B"],["DX_VUONG_HI_CHI-Q02","DX_VUONG_HI_CHI",2,"Tác phẩm Lan Đình Tự được Vương Hi Chi viết trong hoàn cảnh nào theo bài viết?","Trong một buổi tế lễ tại triều đình","Sau khi dâng thư lên hoàng đế","Trong chuyến đi sứ đến kinh đô","Trong một buổi tụ họp bạn hữu, uống rượu và làm thơ","D"],["DX_VUONG_HI_CHI-Q03","DX_VUONG_HI_CHI",3,"Vì sao chiếc ao được gọi là Mặc Trì theo câu chuyện trong bài?","Vì ông thường rửa bút ở đó khiến nước ao đen dần","Vì nước ao vốn có màu đen tự nhiên","Vì ao nằm cạnh nơi chế mực của địa phương","Vì tên ao được đặt theo hình dáng giống nghiên mực","A"],["DX_VUONG_HI_CHI-Q04","DX_VUONG_HI_CHI",4,"Theo bài viết, việc quan sát ngỗng giúp Vương Hi Chi học được điều gì?","Cách phối hợp lực ngón tay để giữ bút","Cách điều chỉnh độ đậm nhạt của mực","Cách vận dụng cổ tay linh hoạt","Cách giữ quản bút thẳng đứng suốt quá trình viết","C"],["DX_VUONG_HI_CHI-Q05","DX_VUONG_HI_CHI",5,"Điều gì đã xảy ra với bản gốc Lan Đình Tự theo bài viết?","Bản gốc được lưu giữ nguyên vẹn tại một thư viện ở Sơn Âm","Bản gốc thất lạc, về sau chỉ còn các bản được người đời lâm mô","Bản gốc thất lạc, về sau còn các bản lâm mô","Bản gốc còn nguyên trên tấm bia tại Lan Đình","B"],["DX_AU_DUONG_TUAN-Q01","DX_AU_DUONG_TUAN",1,"Âu Dương Tuân sinh vào năm nào và qua đời vào năm nào?","498–563","538–570","625–691","557–641","D"],["DX_AU_DUONG_TUAN-Q02","DX_AU_DUONG_TUAN",2,"Sau biến cố của cha, ai đã nhận nuôi và dạy Âu Dương Tuân học chữ, thư tịch?","Ngu Thế Nam","Giang Tổng","Trần Thúc Đạt","Bùi Củ","B"],["DX_AU_DUONG_TUAN-Q03","DX_AU_DUONG_TUAN",3,"Năm 624, Âu Dương Tuân cùng các cộng sự phụng chiếu biên soạn bộ sách nào?","Tùy thư","Ngụy thư","Nghệ văn loại tụ","Văn tuyển","C"],["DX_AU_DUONG_TUAN-Q04","DX_AU_DUONG_TUAN",4,"Đặc điểm nào phù hợp nhất với phong cách Âu thể trong bài viết?","Kết cấu nghiêm cẩn, bút lực cương kiện, thế chữ hiểm mà vững","Phong cách phóng túng, thiên về chữ Thảo và giảm thiểu quy phạm","Nét mềm tròn, ít phân biệt trọng tâm và kết cấu","Chủ yếu dựa vào tốc độ, không chú trọng pháp tắc","A"],["DX_AU_DUONG_TUAN-Q05","DX_AU_DUONG_TUAN",5,"Khi bắt gặp bia do Sách Tĩnh viết, Âu Dương Tuân đã làm gì?","Chép lại bia trong một buổi rồi lập tức rời đi","Xin mang bia về thư phòng để nghiên cứu","Trở lại vào dịp khác để so sánh với các bản thác","Ở lại ba ngày để quan sát và nghiền ngẫm từng nét","D"]]});

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
  // v10.21: rương chung của tài khoản (cột ruong ở bảng tai_khoan): {items:[đồ], copper, rubies}. Mọi nhân vật của tài khoản gửi / lấy ở Người giữ rương
  const chestOf=a=>{let c=null;try{c=a.ruong?JSON.parse(a.ruong):null;}catch(e){}c=c&&typeof c==='object'?c:{};
    return {items:(Array.isArray(c.items)?c.items:[]).map(x=>Player.cleanItem(x)).filter(Boolean),copper:Math.max(0,Math.floor(+c.copper||0)),rubies:Math.max(0,Math.floor(+c.rubies||0))};};
  const chestSize=()=>cfg('ruong_so_o')||60;
  const chestView=c=>({items:c.items,copper:c.copper,rubies:c.rubies,size:chestSize()});
  function chestMove(p,dir){
    const a0=auth(p.token);A.rules&&A.rules();
    return A.lock(()=>{
      const a=find('tai_khoan','id',a0.id)||a0,c=ownChar(a,p.charId,'active'),st=stateOf(c),P=st.player,ch=chestOf(a);
      const copper=Math.max(0,Math.floor(Number(p.copper)||0)),rubies=Math.max(0,Math.floor(Number(p.rubies)||0)),uid=p.uid?String(p.uid):'';
      if(!uid&&!copper&&!rubies)fail('RUONG_TRONG');let item=null;
      if(dir==='put'){
        if(uid){const i=P.bag.findIndex(x=>x&&x.uid===uid),it=P.bag[i],d=it&&Player.info(it);if(!d)fail('VAT_PHAM_SAI');if(d.slot==='quest')fail('KHONG_GUI_DUOC');if(ch.items.length>=chestSize())fail('RUONG_DAY');P.bag[i]=null;ch.items.push(it);item=it;}
        if(copper>P.copper)fail('KHONG_DU_TIEN');if(rubies>P.rubies)fail('KHONG_DU_HONG_NGOC');P.copper-=copper;P.rubies-=rubies;ch.copper+=copper;ch.rubies+=rubies;
      }else{
        if(uid){const i=ch.items.findIndex(x=>x.uid===uid);if(i<0)fail('VAT_PHAM_SAI');item=ch.items[i];Player.addItem(P,item);ch.items.splice(i,1);}
        if(copper>ch.copper)fail('RUONG_KHONG_DU_TIEN');if(rubies>ch.rubies)fail('RUONG_KHONG_DU_HONG_NGOC');ch.copper-=copper;ch.rubies-=rubies;P.copper+=copper;P.rubies+=rubies;
      }
      const j=JSON.stringify(ch);if(j.length>45000)fail('RUONG_DAY');
      storeState(c,st,P);a.ruong=j;A.update('tai_khoan',a);
      return {chest:chestView(ch),state:P,item};
    });
  }
  const H={
    ping:()=>({msg:'Lữ Hành API'}),
    chest(p){const a=auth(p.token);A.rules&&A.rules();return {chest:chestView(chestOf(a))};},
    chestPut(p){return chestMove(p,'put');},
    chestTake(p){return chestMove(p,'take');},
    // kiểm tra phiên còn giữ (game gọi định kỳ): bị đăng nhập nơi khác thì báo DANG_NHAP_NOI_KHAC
    alive(p){auth(p.token);return {};},
    // Dữ liệu tĩnh: kèm mã h (băm nội dung) để trình duyệt lưu đệm; gửi lại cùng h thì chỉ trả same:true (đỡ tải ~120 KB mỗi lần vào game)
    data:p=>{const d=A.staticData(),h=String(d._h||'');if(h&&p&&p.h===h)return {same:true,h};return {data:A.hideAnswers?A.hideAnswers(d):d,h};},
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
      const a=auth(p.token),list=where('nhan_vat','tai_khoan',a.id).filter(c=>(c.trang_thai==='active'||c.trang_thai==='merc')).map(c=>{if(c.trang_thai==='merc'){c.trang_thai='active';c.gia_danh_thue=0;c.gia_hong_ngoc=0;A.update('nhan_vat',c);}return {...charView(c),look:lookOf(c)};});
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
    // v10.13: bỏ chức năng cho thuê nhân vật giữa người chơi (mercRegister / mercCancel / mercList / mercBuy); nhân vật đang ở trạng thái merc cũ tự về active khi mở lều
    // v10.13: Thầy đồ chấm ngay (không khóa, không ghi Sheet): trả câu sai + chữ ký; trình duyệt áp dụng op 'quiz' kèm chữ ký, máy chủ kiểm chữ ký khi nhận gói lưu
    quizCheck(p){
      const a=auth(p.token);A.rules&&A.rules();const bo=String(p.bo||''),Q=Player.QUIZ[bo];if(!Q||!Q.qs.length)fail('QUIZ');
      const c=ownChar(a,p.charId,'active'),ans=Array.isArray(p.ans)?p.ans.map(x=>String(x||'').toUpperCase()):[];const wrong=[];Q.qs.forEach((q,i)=>{if(ans[i]!==q.ans)wrong.push(i);});
      return {total:Q.qs.length,ok:Q.qs.length-wrong.length,wrong,sig:A.sign?A.sign(Player.quizKey(c.id,bo,wrong)):''};
    },
    // xem đáp án sau khi đủ manh mối (đọc trạng thái, không khóa)
    quizShow(p){
      const a=auth(p.token);const c=ownChar(a,p.charId,'active'),st=stateOf(c),bo=String(p.bo||''),Q=Player.QUIZ[bo],z=st.player.quiz&&st.player.quiz[bo];if(!Q)fail('QUIZ');if(!(z&&z.reveal))fail('QUIZ_CHUA');return {show:Q.qs.map(q=>q.ans)};
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
  // v10.12: lệnh kèm pre = gói phần chơi chưa gửi {bid,sentAt,save,ops} → chạy play trước trong cùng lượt gọi (một lượt thay vì hai)
  return {handle(action,p){try{if(!H[action])fail('KHONG_CO_LENH');p=p||{};if(typeof Player!=='undefined'){Player._sign=A.sign||null;Player._sid=String(p.charId||'');}let pre=null;if(p.pre&&typeof p.pre==='object'&&action!=='play'&&action!=='save'){const r=H.play({token:p.token,charId:p.charId,...p.pre});pre={results:r.results,savedAt:r.savedAt};}return {ok:true,...H[action](p),...(pre?{pre}:{})};}catch(e){return {ok:false,error:String(e.message||e)};}finally{if(typeof Player!=='undefined'){Player._sign=null;Player._sid='';}}}};
}

/* ================= LUẬT CHƠI: chỉ số, trang bị, phẩm chất, bộ đồ, gia cường, nhiệm vụ, lính đánh thuê ================= */
const Player=(()=>{
  const VERSION=7,BAG_SIZE=40,SKILL_SLOTS=5,MAX_LV=15,MAX_ACTIVE_QUEST=3,MAX_MERC=4;
  const slots=['mount','hat','wings','left','armor','right','gloves','pants','shoes'];
  const STAT_KEYS=['strength','agility','vitality','intelligence'];
  const ELEMENTS={
    fire:{name:'Hỏa',icon:'flame',color:'#ff8a3d',glow:'#ffd27a',st:['str']},water:{name:'Thủy',icon:'water',color:'#5fb6ff',glow:'#dcf1ff',st:['int']},
    earth:{name:'Thổ',icon:'earth',color:'#c99a5b',glow:'#f3dcaa',st:['vit']},metal:{name:'Kim',icon:'metal',color:'#e3cf7a',glow:'#fffbe2',st:['agi']},wood:{name:'Mộc',icon:'wood',color:'#8ed46a',glow:'#e5ffb8',st:['vit','int']},
    thunder:{name:'Lôi',icon:'thunder',color:'#c9a7ff',glow:'#f4ecff',st:['str']},wind:{name:'Phong',icon:'wind',color:'#8fe3c4',glow:'#e6fff5',st:['agi']},
    ice:{name:'Băng',icon:'ice',color:'#8fd3ff',glow:'#effaff',st:['int']},demon:{name:'Ma công',icon:'demon',color:'#c0508a',glow:'#ffb8dc',st:['cmd']},light:{name:'Ánh sáng',icon:'light',color:'#ffe680',glow:'#fffbe0',st:['vit']}
  };
  // v10.21: công, thủ gốc của thú cưỡi theo loài (dùng khi Sheet để trống cả hai)
  const MOUNT_BASE={horse:[2,2],tiger:[4,1],elephant:[1,5],kylan:[3,2],rong:[4,4],phuong:[4,2],cuuvi:[4,2],rua:[1,5],thienma:[3,3]};
  const BEASTS={horse:{seat:24,skill:'Đá hậu',icon:'mount',cmd:5},tiger:{seat:28,skill:'Vồ mồi',icon:'tiger',cmd:10},elephant:{seat:46,skill:'Dày xéo',icon:'elephant',cmd:15},
    kylan:{seat:26,skill:'Lân hỏa',icon:'spark',cmd:12},rong:{seat:33,skill:'Long tức',icon:'demon',cmd:20},
    // v10.18: phượng hoàng (lửa quanh mình như kỳ lân), cửu vĩ hồ (lao tới như hổ), huyền vũ (dày xéo như voi), thiên mã (đá hậu như ngựa)
    phuong:{seat:32,skill:'Phượng hỏa',icon:'feather',cmd:14,act:'kylan'},cuuvi:{seat:30,skill:'Hồ hỏa',icon:'demon',cmd:12,act:'tiger'},rua:{seat:44,skill:'Huyền giáp',icon:'shield',cmd:16,act:'elephant'},thienma:{seat:24,skill:'Đá hậu',icon:'wings',cmd:8,act:'horse'}};
  // thú cưỡi đã có trên Sheet với loài cũ: đổi sang loài đúng hình (Sheet ghi loài mới thì giữ theo Sheet)
  const BEAST_FIX={'phuong-hoang':['kylan','phuong'],'cuu-vi-ho':['tiger','cuuvi'],'huyen-vu':['elephant','rua'],'thien-ma':['horse','thienma']}; // v10.3: kỳ lân (lửa quanh mình), rồng (phun lửa phía trước)
  const GROUPS=[['str','Sức mạnh','punch'],['agi','Nhanh nhẹn','feather'],['vit','Sức khỏe','heart'],['int','Trí tuệ','spark'],['cmd','Mệnh lệnh','flag']];
  const FX_NAMES={stun:'Choáng',execute:'Kết liễu',shield:'Lá chắn',wave:'Sóng chém',aura:'Hào khí',cleave:'Chém lan',manaShield:'Khiên mana',lifesteal:'Hút máu',haste:'Thần tốc',burn:'Thiêu đốt',counter:'Phản công',heal:'Hồi phục',revive:'Hồi sinh',
    frost:'Băng giá',venom:'Độc',rage:'Cuồng nộ',luck:'May mắn',expUp:'Tinh thông',coinUp:'Phú quý',dmgPct:'Uy lực',defPct:'Kiên cố',clone:'Phân thân'}; // v10.13: hiệu ứng thú thần thoại // v10.3: hiệu ứng đồ thành trì
  const SLOT_OF={vu_khi:'right',tay_trai:'left',mu:'hat',ao:'armor',quan:'pants',gang:'gloves',giay:'shoes',canh:'wings',thu_cuoi:'mount'};
  const PAIRS=new Set(['sword|sword','shield|shield','staff|staff','shield|staff','shield|sword','saber|saber','mace|mace','saber|shield','mace|shield']); // v10.14: đao, chùy cầm một tay (đôi hoặc kèm khiên)
  const ALIAS={'book-ice':'book-water','book-wind':'book-metal','book-thunder':'book-earth'};
  const skills={normal:{cost:0,cooldown:450},basic:{cost:10,cooldown:3000},intermediate:{cost:18,cooldown:6000},advanced:{cost:28,cooldown:10000},mount:{cost:12,cooldown:6000}};
  // Bảng sinh từ dữ liệu (Sheet)
  const CFG={},RAR={},ADD={},items={},SHOPS={},SETS={},MON={},QUESTS={},MERCS={},ENH=[],WEAPONS={},REGIONS=[],AVATARS={},TOPUPS=[],QUIZ={},TUONG={};
  // Hiệu ứng tên nhân vật (Thuốc đa nhiệm)
  const NAME_FX={vang:'Ánh vàng','cau-vong':'Cầu vồng',lua:'Lửa',bang:'Băng',tim:'Tím mộng'};
  const driveDirect=u=>{u=String(u||'').trim();const m=/(?:drive|docs)\.google\.com/.test(u)&&(u.match(/\/d\/([\w-]{20,})/)||u.match(/[?&]id=([\w-]{20,})/));return m?'https://lh3.googleusercontent.com/d/'+m[1]:(/^https?:\/\/\S+$/.test(u)?u:'');};
  // Kỹ năng trùm (cột ky_nang ở tab quai, cách nhau dấu phẩy): tên hiện, màu, thời gian hiệu ứng (giây)
  const SKILLS={slow:{name:'Trì trệ',desc:'giảm tốc đánh 40%',color:'#c8b060',dur:6},freeze:{name:'Đóng băng',desc:'đứng yên',color:'#80d8ff',dur:1.6},stun:{name:'Sét giật',desc:'choáng',color:'#ffe060',dur:1.4},
    weak:{name:'Suy nhược',desc:'giảm sát thương 40%',color:'#c060ff',dur:6},armor:{name:'Phá giáp',desc:'giảm phòng ngự 50%',color:'#ff9040',dur:6},poison:{name:'Trúng độc',desc:'mất máu dần',color:'#80e060',dur:5},
    bomb:{name:'Nổ',desc:'nổ tại chỗ đứng, sát thương lớn',color:'#ff5030',dur:0},tubao:{name:'Tự bạo',desc:'khi yếu, trùm nổ tung',color:'#ff2020',dur:0},
    // v10.22: chiến thuật trùm (bị động, không phải đòn đánh) — cần cách đánh riêng mới hạ được
    tron:{name:'Bỏ chạy',desc:'còn dưới 20% máu thì bỏ chạy về hang, thoát được là hồi đầy máu',hint:'Dùng sách Hỏa đốt cháy để giữ chân, hoặc cung, nỏ, gậy phép bắn theo khi trùm bỏ chạy',color:'#ff80c0',dur:0,passive:1},
    bay:{name:'Bay lượn',desc:'thỉnh thoảng bay lên cao, đòn cận chiến chỉ còn 15% sát thương',hint:'Đổi sang cung, nỏ hoặc gậy phép khi trùm bay lên',color:'#c0d8ff',dur:0,passive:1},
    'giap-bang':{name:'Giáp băng',desc:'giáp băng giảm 70% sát thương nhận vào',hint:'Gắn sách Hỏa: đòn lửa làm tan giáp băng trong 5 giây',color:'#a0e0ff',dur:0,passive:1},
    'hoi-mau':{name:'Tái sinh',desc:'mỗi giây hồi 1% máu',hint:'Đốt cháy (sách Hỏa) hoặc làm trúng độc thì trùm ngừng hồi máu',color:'#90e070',dur:0,passive:1},
    'phan-giap':{name:'Da đá',desc:'đòn cận chiến chỉ còn 60% sát thương và dội lại 15% vào người đánh',hint:'Đánh từ xa bằng cung, nỏ, gậy phép để không bị dội đòn',color:'#c8b8a0',dur:0,passive:1}};
  // Loại vũ khí (tab vu_khi): sát thương, tầm đánh, độ lan, thời gian một đòn, mana kỹ năng, thời gian hồi chiêu, nội tại mỗi đòn
  const W_DEF={punch:{name:'Tay không',dmg:.55,range:50,spread:75,dur:.32,mana:1,cd:1,passive:12}};
  const weapon=t=>WEAPONS[t]||W_DEF[t]||W_DEF.punch;
  const num=(v,f=0)=>{if(v===''||v==null)return f;const n=Number(typeof v==='string'?v.replace(/^'/,'').replace(',','.'):v);return Number.isFinite(n)?n:f;};
  const range=s=>{const [a,b]=String(s||'0-0').split('-').map(Number);return [num(a),num(b,num(a))];};
  const parseBonus=(s,k=1)=>{const o={};String(s||'').split(/[,;]/).forEach(p=>{const [kk,v]=p.split(':').map(x=>x&&x.trim());if(kk&&ADD[kk]&&Number.isFinite(+v))o[kk]=Math.round(+v*k*10)/10;});return o;};
  const clear=o=>{for(const k of Object.keys(o))delete o[k];};
  function load(data){
    [CFG,RAR,ADD,items,SHOPS,SETS,MON,QUESTS,MERCS,WEAPONS,QUIZ,TUONG].forEach(clear);
    for(const r of data.vu_khi||[])WEAPONS[r.loai]={name:r.ten,dmg:num(r.sat_thuong,100)/100,range:num(r.tam_danh,80),spread:num(r.lan_rong),dur:Math.max(.15,num(r.toc_danh_ms,500)/1000),mana:num(r.mana,100)/100,cd:num(r.hoi_chieu,100)/100,passive:num(r.noi_tai,12)};ENH.length=0;
    for(const r of data.cau_hinh||[])CFG[r.khoa]=num(r.gia_tri,r.gia_tri);
    for(const r of data.gia_cuong||[])ENH[num(r.cap)]={rate:num(r.ti_le)/100,cost:num(r.phi_hong_ngoc),fail:r.that_bai_tu===''||r.that_bai_tu==null?null:[num(r.that_bai_tu),num(r.that_bai_den,num(r.that_bai_tu))]};
    for(const r of data.pham_chat||[])RAR[r.ma]={name:r.ten,color:r.mau,mul:num(r.he_so,100)/100,lines:num(r.so_dong),tier:num(r.bac),trade:r.giao_dich==='co',buy:r.mua_duoc==='co'};
    for(const r of data.thuoc_tinh||[])ADD[r.ma]={name:r.ten,group:r.nhom,unit:r.don_vi||'',ranges:[null,...['dep','hoan_hao','huyen_thoai','than'].map(k=>[num(r[k+'_thap']),num(r[k+'_cao'],num(r[k+'_thap']))])]};
    for(const r of data.vat_pham||[]){
      const slot=r.o||null,d={name:r.ten,slot,kind:r.loai||slot,grip:r.cam||'one',atk:num(r.cong),def:num(r.thu),speed:num(r.toc)/100,price:num(r.gia),tint:r.mau||null};
      if(slot==='mount'){d.beast=BEASTS[r.thu_cuoi]?r.thu_cuoi:'horse';const fx=BEAST_FIX[r.id];if(fx&&d.beast===fx[0])d.beast=fx[1];d.cmd=num(r.menh_lenh,BEASTS[d.beast].cmd);if(d.beast!=='horse')d.icon=BEASTS[d.beast].act?BEASTS[d.beast].icon:d.beast;}
      if(slot==='book'){d.icon='book';d.element=r.he;}
      if(!slot)d.icon=r.loai||'ore';
      if(slot==='wings'&&/^canh-/.test(r.id))d.wing=true; // cánh dung hợp (không mua, không rơi)
      if(r.pham_chat&&RAR[r.pham_chat]&&r.pham_chat!=='n')d.q=r.pham_chat; // phẩm chất cố định (hàng hiệu buôn thành trì)
      if(r.hieu_ung){d.fx=r.hieu_ung;d.fxv=num(r.gia_tri);d.fxText=r.mo_ta||'';}
      if(num(r.gia_hong_ngoc)>0)d.ruby=num(r.gia_hong_ngoc); // mua bằng hồng ngọc (mỹ phẩm Phấn Son)
      if(r.anh)d.img=driveDirect(r.anh); // ảnh riêng (thẻ avatar, khung, nền, vật phẩm cốt truyện)
      if(slot==='cos'||slot==='quest'){d.desc=r.mo_ta||'';d.kind=r.loai||'avatar';d.icon=slot==='quest'?'quest':r.loai==='avatar'?'user':r.loai==='nen'?'map':'orb';}
      if(slot==='cos'&&r.loai==='khung')continue; // v10.12: bỏ khung chân dung
      items[r.id]=d;
    }
    for(const r of data.cua_hang||[]){(SHOPS[r.cua_hang]=SHOPS[r.cua_hang]||[]).push({id:r.id,q:String(r.pham_chat||'n').split(',').map(x=>x.trim()).filter(q=>RAR[q]||q==='n'),price:num(r.gia),order:num(r.thu_tu),t:num(r.bac)});}
    for(const k of Object.keys(SHOPS)){SHOPS[k]=SHOPS[k].filter(r=>items[r.id]);SHOPS[k].sort((a,b)=>a.order-b.order);}
    // Bộ đồ nhân vật lịch sử: bo_huyen_thoai (Việt, phẩm l) và v10.14 tuong (danh tướng Trung Hoa: bản huyền thoại 'tq-<id>' phẩm l, bản thần 'tt-<id>' phẩm m mạnh gấp rưỡi).
    // Vũ khí để trống tay trái = cầm hai tay (bộ 8 món, đủ 8 là kích hoạt hiệu ứng). Bộ của tướng ai cũng mặc được (gender trống)
    const addSet=(r,sid,q,k,gender,tintW)=>{
      const two=!r.tay_trai_loai,S={id:sid,hero:r.nhan_vat,gender,name:r.ten_bo+(q==='m'?' (Thần)':''),tiers:{3:parseBonus(r.moc_3,k),5:parseBonus(r.moc_5,k),7:parseBonus(r.moc_7,k)},fx:r.hieu_ung_9,fxv:Math.round(num(r.gia_tri_9)*k),fxText:r.mo_ta_9,pieces:[],q};
      SETS[sid]=S;
      for(const [col,slot] of Object.entries(SLOT_OF)){
        if(slot==='left'&&two)continue;
        const id=sid+':'+slot,base={name:r[col]+(q==='m'?' · Thần':''),set:sid,gender,q,price:Math.round(num(CFG.gia_do_bo,5000)*k),tint:tintW||'#e8c070'};
        if(slot==='right'||slot==='left'){const kd=slot==='right'?r.vu_khi_loai:r.tay_trai_loai;Object.assign(base,{slot:'hand',kind:kd,grip:slot==='right'&&two?'two':'one',atk:kd==='shield'?0:num(CFG.bo_cong_vu_khi,16)*(slot==='left'?.6:two?1.4:1)*k,def:kd==='shield'?num(CFG.bo_thu_khien,10)*k:0});}
        else if(slot==='mount'){const b=r.thu_cuoi_loai||'horse';Object.assign(base,{slot,kind:'mount',beast:b,cmd:BEASTS[b].cmd,speed:num(CFG.bo_toc_thu_cuoi,155)/100,tint:b==='elephant'?'#a8aeb4':b==='tiger'?'#e89a3e':'#d8c8a8'});if(b!=='horse')base.icon=b;}
        else Object.assign(base,{slot,kind:slot,def:(slot==='armor'?num(CFG.bo_thu_ao,12):num(CFG.bo_thu_nho,6))*k});
        base.atk=Math.round(base.atk||0);base.def=Math.round(base.def||0);if(q==='m')base.myth=true;items[id]=base;S.pieces.push(id);
      }
      return S;};
    for(const r of data.bo_huyen_thoai||[])addSet(r,r.id,'l',1,r.gioi_tinh,'#e8c070');
    for(const r of data.tuong||[]){TUONG[r.id]={id:r.id,name:r.nhan_vat,gender:r.gioi_tinh==='f'?'f':'m',desc:r.mo_ta||'',color:r.mau||'#c8823e',setL:'tq-'+r.id,setM:'tt-'+r.id};addSet(r,'tq-'+r.id,'l',1,'',r.mau||'#e8c070');addSet(r,'tt-'+r.id,'m',1.5,'',r.mau||'#ffb0d0');}
    for(const r of data.do_than||[]){
      const d={name:r.ten,slot:r.o,kind:r.loai,grip:r.cam||'one',atk:num(r.cong),def:num(r.thu),speed:num(r.toc)/100,price:num(r.gia,20000),tint:r.mau||null,q:'m',fx:r.hieu_ung,fxv:num(r.gia_tri),fxText:r.mo_ta,myth:true};
      if(d.slot==='mount'){d.beast=BEASTS[r.thu_cuoi]?r.thu_cuoi:'horse';d.cmd=BEASTS[d.beast].cmd;}
      items[r.id]=d;
    }
    const QM=num(CFG.quai_nhan_mau,1),QD=num(CFG.quai_nhan_sat_thuong,1),BN=num(CFG.boss_nhan,1),BD=num(CFG.boss_nhan_sat_thuong,1),qx=(v,k)=>v>0?Math.max(1,Math.round(v*k)):v; // v10.16: hệ số máu / sát thương mọi quái (cau_hinh)
    for(const r of data.quai||[])MON[r.id]={name:r.ten,hp:qx(num(r.mau),QM*(num(r.boss)?BN:1)),dmg:qx(num(r.sat_thuong),QD*(num(r.boss)?BN*(num(r.boss)===1?BD:1):1)),hpBase:num(r.mau),dmgBase:num(r.sat_thuong),speed:num(r.toc_do),run:num(r.toc_chay),r:num(r.ban_kinh),h:num(r.cao),aggro:num(r.tam_danh),range:num(r.tam_gan),cd:num(r.hoi_chieu_ms)/1000,windup:num(r.vung_tay_ms)/1000,copper:num(r.dong),knock:num(r.day_lui_phan_tram)/100,boss:num(r.boss),respawn:num(r.hoi_sinh_giay,15),drops:{g:num(r.dep_phan_van)/1e4,p:num(r.hoan_hao_phan_van)/1e4,l:num(r.huyen_thoai_phan_van)/1e4,m:num(r.than_phan_van)/1e4},rubies:[num(r.hong_ngoc_it),num(r.hong_ngoc_nhieu)],dtype:r.loai_sat_thuong||'thuong',crit:num(r.ti_le_x2),exp:num(r.kinh_nghiem,Math.max(1,Math.round(num(r.mau)/8))),map:String(r.ban_do||'').trim()||undefined,skills:String(r.ky_nang||'').split(/[,\s]+/).filter(k=>SKILLS[k]),tac:String(r.ky_nang||'').split(/[,\s]+/).filter(k=>SKILLS[k]&&SKILLS[k].passive)};
    for(const r of data.nhiem_vu||[])QUESTS[r.id]={id:r.id,name:r.ten,desc:r.mo_ta,target:r.muc_tieu,count:num(r.so_luong,1),copper:num(r.thuong_dong),rubies:num(r.thuong_hong_ngoc),item:r.thuong_do||'',itemQ:r.pham_chat_do||'n',repeat:r.lap_lai!=='khong',lv:num(r.cap_toi_thieu),exp:num(r.thuong_kinh_nghiem,Math.round(num(r.thuong_dong)/10)),req:r.yeu_cau||'',end:r.loi_ket||'',story:!!num(r.truyen),npc:r.npc||'',at:r.noi||'',npcName:r.npc_ten||''};
    // Thầy đồ: bộ câu hỏi (bo_cau_hoi) + câu hỏi (cau_hoi; máy chủ đọc tab CauHoi của bảng OCD_Quest, cột dap_an không gửi xuống trình duyệt)
    // v10.13: bỏ các bộ mã NV* và SKQ* (chỉ giữ bộ DX_*)
    const boOk=id=>!/^(NV|SKQ)/i.test(String(id||''));
    for(const r of (data.bo_cau_hoi||[]).filter(r=>boOk(r.id)))QUIZ[r.id]={id:r.id,name:r.ten||r.id,order:num(r.thu_tu,99),rubies:num(r.thuong_hong_ngoc,5),mon:r.quai||'',need:num(r.so_luong,0),map:r.ban_do||'',qs:[]};
    for(const r of data.cau_hoi||[]){const bo=String(r.bo||r.QuestID||'');if(!bo||!boOk(bo))continue;if(!QUIZ[bo])QUIZ[bo]={id:bo,name:bo,order:99,rubies:5,mon:'',need:0,map:'',qs:[]};QUIZ[bo].qs.push({id:r.id||r.QuestionID,n:num(r.thu_tu||r.ThuTu,QUIZ[bo].qs.length+1),q:r.cau||r.CauHoi||'',a:r.a||r.A||'',b:r.b||r.B||'',c:r.c||r.C||'',d:r.d||r.D||'',ans:String(r.dap_an||r.DapAn||'').trim().toUpperCase()});}
    for(const Q of Object.values(QUIZ))Q.qs.sort((x,y)=>x.n-y.n);
    REGIONS.length=0;for(const r of data.ban_do||[])REGIONS.push({id:String(r.id),name:r.ten,lv:num(r.cap,1),icon:r.bieu_tuong||'pin',order:num(r.thu_tu,99)});REGIONS.sort((a,b)=>a.order-b.order);
    TOPUPS.length=0;for(const r of data.goi_nap||[])TOPUPS.push({id:r.id,name:r.ten,vnd:num(r.tien),ruby:num(r.hong_ngoc),gold:num(r.vang),desc:r.mo_ta||'',order:num(r.thu_tu,99)});TOPUPS.sort((a,b)=>a.order-b.order);
    clear(AVATARS);for(const r of data.dien_mao||[])AVATARS[r.id]={id:r.id,name:r.ten,gender:r.gioi_tinh||'',price:num(r.gia),ruby:num(r.hong_ngoc),skin:r.mau_da||'#e1c295',hair:r.mau_toc||'#2a2622',style:r.kieu_toc||'',beard:r.rau||'',eye:r.mau_mat||'#2a2018',mark:r.dau||'',order:num(r.thu_tu,99)};
    for(const r of data.linh||[]){const k=r.thanh?num(CFG.linh_thanh_he_so,100)/100:1;MERCS[r.id]={id:r.id,name:r.ten,gender:r.gioi_tinh==='f'?'f':'m',price:num(r.gia),cmd:num(r.menh_lenh,5),stats:{strength:Math.round(num(r.suc_manh)*k),agility:Math.round(num(r.nhanh_nhen)*k),vitality:Math.round(num(r.suc_khoe)*k),intelligence:Math.round(num(r.tri_tue)*k),command:0},gear:String(r.trang_bi||'').split(',').map(x=>x.trim()).filter(Boolean),desc:r.mo_ta,map:r.thanh||''};}
    // v10.16–17: thú cưỡi — giá × thu_cuoi_nhan_gia, công / thủ × thu_cuoi_nhan_chi_so
    // v10.21: mỗi thú có "cấp" L: thú bán ở thành = cấp thành; thú làng Thanh Mộc tính theo giá gốc (2·√(giá/50): ngựa con 4 … voi 22);
    //   thú trong bộ Huyền thoại / Thần = thu_cuoi_cap_bo_huyen_thoai / _than. Mệnh lệnh cần = mức của loài + L × thu_cuoi_menh_lenh_cap (+ phẩm chất, + cấp gia cường: mountNeed).
    //   Thú chưa ghi công / thủ trên Sheet (cả hai = 0) lấy chỉ số gốc theo loài (MOUNT_BASE); thú không bán ở thành nhân thêm (1 + L/25) như đồ có bậc.
    {const MK=num(CFG.thu_cuoi_nhan_gia,1),MS=num(CFG.thu_cuoi_nhan_chi_so,1),MC=num(CFG.thu_cuoi_menh_lenh_cap,0),lvOf={};
      for(const k in SHOPS){const m=k.match(/^thanh-(.+?)(?:-ren|-thu|-sach)?$/);if(!m)continue;const L=mapLevel(m[1]);for(const r of SHOPS[k])lvOf[r.id]=Math.max(lvOf[r.id]||0,L);}
      for(const [id,d] of Object.entries(items)){if(d.slot!=='mount')continue;
        const town=lvOf[id]||0,L=town||(d.q==='m'?num(CFG.thu_cuoi_cap_bo_than,330):d.q==='l'||d.set?num(CFG.thu_cuoi_cap_bo_huyen_thoai,250):Math.round(2*Math.sqrt(num(d.price)/50)));d.mlv=L;
        if(!d.atk&&!d.def){const B=MOUNT_BASE[d.beast]||MOUNT_BASE.horse,f=town?1:1+L/25;d.atk=Math.round(B[0]*f);d.def=Math.round(B[1]*f);}
        if(d.price)d.price=Math.round(d.price*MK);if(MS!==1){d.atk=Math.round(d.atk*MS);d.def=Math.round(d.def*MS);}
        d.cmd=(BEASTS[d.beast]||BEASTS.horse).cmd+Math.round(L*MC);}
      if(MK!==1)for(const k in SHOPS)for(const r of SHOPS[k])if(r.price&&items[r.id].slot==='mount')r.price=Math.round(r.price*MK);
      // v10.26: sau đó thú cưỡi ở các thành × thu_cuoi_gia_thanh (Thanh Mộc giữ nguyên)
      // v10.24: giá thú cưỡi làng Thanh Mộc × thu_cuoi_gia_lang; mỗi nơi bán kế tiếp (theo cấp thành) giá trung bình gấp thu_cuoi_gia_moi_thanh lần nơi trước, giữ tỉ lệ giữa các con trong cùng nơi
      {const GV=num(CFG.thu_cuoi_gia_lang,5),GT=num(CFG.thu_cuoi_gia_moi_thanh,2),pr=r=>r.price||num(items[r.id].price),avg=a=>a.reduce((x,r)=>x+pr(r),0)/Math.max(1,a.length);
        const list=Object.keys(SHOPS).map(k=>{const mm=k.match(/^thanh-(.+?)(?:-ren|-thu|-sach)?$/);return {k,L:mm?mapLevel(mm[1]):1,rows:SHOPS[k].filter(r=>items[r.id]&&items[r.id].slot==='mount'&&!items[r.id].ruby)};}).filter(x=>x.rows.length).sort((a,b)=>a.L-b.L);
        let prev=0;for(const s of list){const sc=s.L<=1?GV:prev>0?prev*GT/Math.max(1,avg(s.rows)):1;for(const r of s.rows){const v=Math.max(1,Math.round(pr(r)*sc));r.price=v;items[r.id].price=v;}prev=avg(s.rows);}
        const GC=num(CFG.thu_cuoi_gia_thanh,10);if(GC!==1)for(const s of list)if(s.L>1)for(const r of s.rows){const v=Math.round(r.price*GC);r.price=v;items[r.id].price=v;}}}
  }
  const info=i=>i&&items[i.type];
  const kind=i=>info(i)?info(i).kind:null;
  const qOf=i=>{const d=info(i);return d?(d.q||i.q||'n'):'n';};
  const rar=i=>RAR[qOf(i)]||RAR.n||{name:'Thường',color:'#e8e6df',mul:1,lines:0,tier:0};
  const isTwo=i=>!!info(i)&&info(i).grip==='two';
  const pairOk=(a,b)=>PAIRS.has([a,b].sort().join('|'));
  const nameOf=i=>info(i)?info(i).name+(i.lv?' +'+i.lv:'')+(i.t?' · cấp '+i.t:''):'';
  const SELL_MUL={n:1,g:2,p:5,l:10,m:20};
  // v10.24: đồ có phẩm chất cố định (hàng hiệu buôn, chuồng thú thành trì) đã tính phẩm chất vào giá → không nhân thêm (trước đây thú Hoàn hảo bán lại được gấp đôi giá mua)
  const sellPrice=i=>Math.max(1,Math.floor((info(i)?info(i).price:0)*num(CFG.ti_le_ban_lai,40)/100*(info(i)&&info(i).q?1:(SELL_MUL[qOf(i)]||1))));
  const canEnhance=i=>{const d=info(i);return !!d&&!!d.slot;};
  // v10.13: chợ chỉ nhận đồ huyền thoại / thần, cánh, thú cưỡi
  const tradeable=i=>{const d=info(i);if(!d)return false;const q=qOf(i);return q==='l'||q==='m'||d.slot==='wings'||d.slot==='mount';};
  const gainOf=d=>d.slot==='mount'?{speed:.03}:d.slot==='book'?{stat:num(CFG.sach_moi_cap,2)}:d.atk?{atk:2}:d.def?{def:1}:{};
  const r2=v=>Math.round(v*100)/100;
  // Thú cưỡi: +1..+6 tăng tốc; +7..+10 thêm sát thương; +11..+15 thêm cả máu, mana, phòng ngự (tốc độ tăng suốt 15 cấp)
  function mountGain(lv){
    const a=Math.max(0,lv-6),b=Math.max(0,lv-10);
    return {speed:num(CFG.thu_cuoi_toc_cap,3)/100*lv,atk:num(CFG.thu_cuoi_cong_cap,2)*a,hp:num(CFG.thu_cuoi_mau_cap,20)*b,mp:num(CFG.thu_cuoi_mana_cap,10)*b,def:num(CFG.thu_cuoi_thu_cap,2)*b};
  }
  // Sách: cộng vào chỉ số lớn theo hệ (Hỏa→Sức mạnh, Kim→Nhanh nhẹn, Thổ→Sức khỏe, Thủy→Trí tuệ, Mộc→Sức khỏe + Trí tuệ)
  // v10.21: sách có bậc (theo cấp thành bán: sach_bac_cap) và phẩm chất; điểm cộng, hiệu ứng, giá đều theo bậc × phẩm chất
  const QORD=['n','g','p','l','m'],qIdx=it=>Math.max(0,QORD.indexOf(qOf(it))),lst=(k,d,i)=>{const a=cfgList(k,d);return num(a[Math.max(0,Math.min(i,a.length-1))]);};
  const bacOfT=t=>{const c=cfgList('sach_bac_cap','0,70,170,235,290');let b=0;c.forEach((x,i)=>{if(num(t)>=x)b=i;});return b;};
  const bookBac=it=>bacOfT(it&&it.t);
  const bookFx=it=>lst('sach_hieu_ung_bac','0.4,0.6,0.8,1,1.2',bookBac(it))*lst('sach_hieu_ung_pham_chat','1,1.15,1.3,1.5,1.8',qIdx(it));
  const bookPerLv=it=>lst('sach_moi_cap_bac','0.5,1,1.5,2,3',bookBac(it));
  const bookStat=it=>{const d=info(it);if(!d||!d.element)return {};const b=bookBac(it),k=ELEMENTS[d.element].st,
    base=d.element==='demon'?lst('sach_menh_lenh_bac','5,10,15,20,20',b):lst('sach_chi_so_bac','3,8,15,25,40',b),
    v=Math.round(base*lst('sach_pham_chat_he_so','1,1.3,1.7,2.3,3',qIdx(it))+bookPerLv(it)*(it.lv||0));return Object.fromEntries(k.map(x=>[x,k.length>1?Math.ceil(v/2):v]));};
  // Sách Ma công: số quái tối đa, hệ số thu phục trùm
  const demonOf=it=>{const b=bookBac(it),q=qIdx(it);return {b,q,lv:it.lv||0,ef:bookFx(it),max:lst('ma_so_quai_bac','1,2,2,3,3',b)+lst('ma_so_quai_pham_chat','0,0,0,1,1',q),boss:lst('ma_boss_bac','0,0,0.05,0.1,0.2',b)};};
  // Thú cưỡi: Mệnh lệnh cần = mức theo loài + cấp thú (d.cmd) + phẩm chất + cấp gia cường
  const mountNeed=it=>{const d=info(it);if(!d||d.slot!=='mount')return 0;return Math.round(num(d.cmd,5)+lst('thu_cuoi_menh_lenh_pham_chat','0,5,15,30,60',qIdx(it))+num(CFG.thu_cuoi_menh_lenh_moi_cap,1)*(it.lv||0));};
  // Thời gian giữ quái thu phục theo Trí tuệ (phút, 0 = vĩnh viễn); trùm giảm một mốc
  const tameMin=(int,boss)=>{const T=cfgList('thu_phuc_tri_tue','0,60,150,300,600'),M=cfgList('thu_phuc_phut','1,10,60,600,0');let i=0;T.forEach((t,j)=>{if(num(int)>=t)i=j;});if(boss)i=Math.max(0,Math.min(i,M.length-1)-1);return num(M[Math.min(i,M.length-1)]);};
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
  const BASE_DROP=()=>Object.keys(items).filter(k=>{const d=items[k];return !d.q&&d.slot&&d.slot!=='book'&&d.slot!=='mount'&&d.slot!=='cos'&&d.slot!=='quest'&&!d.wing;});
  const dropCap=()=>{const q=String(CFG.pham_chat_roi_toi_da||'').trim();return RAR[q]?RAR[q].tier:99;};
  // v10.17: phần thưởng hạ quái — tiền × quai_nhan_tien, kinh nghiệm × quai_nhan_kinh_nghiem; tiền mỗi con tối đa quai_tien_toi_da đồng (9999 = dưới 1 vàng; 0 = không giới hạn);
  // quai_roi_do = 0 thì quái không rơi hồng ngọc, đồ đạc
  const killCopper=(M,up=0)=>{const c=Math.round(num(M&&M.copper)*num(CFG.quai_nhan_tien,1)*(1+num(up)/100)),cap=num(CFG.quai_tien_toi_da,0);return cap>0?Math.min(cap,c):c;};
  const killExp=(M,up=0)=>{const e=num(M&&M.exp);return e>0?Math.max(1,Math.round(e*num(CFG.quai_nhan_kinh_nghiem,1)*(1+num(up)/100))):0;};
  // v10.22: trùm rơi sách Huyền thoại / Thần (hệ ngẫu nhiên), bậc sách theo cấp vùng của trùm; trùm thế giới tỉ lệ ×3
  const BOOK_IDS=()=>Object.keys(items).filter(k=>items[k].slot==='book'&&items[k].element);
  function bossBook(monId,rng){const M=MON[monId];if(!M||!M.boss)return null;const k=M.boss===2?3:1,pm=num(CFG.sach_roi_than_phan_van,50)/1e4*k,pl=num(CFG.sach_roi_huyen_thoai_phan_van,300)/1e4*k,x=rng();const q=x<pm?'m':x<pm+pl?'l':null;if(!q)return null;const ids=BOOK_IDS();if(!ids.length)return null;return roll(ids[Math.floor(rng()*ids.length)],q,rng,regionLv(regionOf(monId)));}
  function rollDrop(monId,rng=Math.random,luck=1){
    const M=MON[monId];if(!M||CFG.quai_roi_do!==undefined&&CFG.quai_roi_do!==''&&!num(CFG.quai_roi_do))return {items:[],rubies:0};
    const lvl=regionLv(regionOf(monId)),tier=lvl>=20?lvl:0,out=[],tries=M.boss===2?3:M.boss?2:1,cap=Math.max(dropCap(),lvl>=105?4:lvl>=70?3:0),R=q=>RAR[q]?RAR[q].tier<=cap:true;
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
  const shopEnh=id=>SHOP_ENH[id]||(/^thanh-.*-thu$/.test(String(id))?d=>d.slot==='mount':/^thanh-.*-sach$/.test(String(id))?d=>d.slot==='book':/^thanh-/.test(String(id))?d=>d.slot!=='book'&&d.slot!=='cos'&&d.slot!=='quest':null);
  // v10.13: cỏ may mắn (s.luck, nhận từ sự kiện đột xuất): mỗi cỏ +1% tỉ lệ gia cường / dung hợp, tối đa co_may_man_toi_da (10) cỏ một lần
  function useLuck(s,want){const n=Math.max(0,Math.min(num(CFG.co_may_man_toi_da,10),Math.floor(num(want)),Math.floor(num(s.luck))));s.luck=Math.floor(num(s.luck))-n;return n;}
  function enhance(s,ref,rng=Math.random,shop,luck=0){
    const it=ref.where==='bag'?s.bag[ref.key]:ref.where==='skill'?s.skillSlots[ref.key]:s.equipment[ref.key];
    if(!canEnhance(it))throw Error('ITEM');
    if(shop&&shopEnh(shop)&&!shopEnh(shop)(info(it)))throw Error('SHOP');
    const lv=it.lv||0;if(lv>=MAX_LV)throw Error('MAX');
    const cost=enhCost(lv);if(s.rubies<cost)throw Error('RUBY');
    const L=useLuck(s,luck);s.rubies-=cost;const ok=rng()<Math.min(1,enhRate(lv)+L/100);it.lv=ok?lv+1:enhFail(lv,rng);
    return {ok,from:lv,to:it.lv,cost};
  }
  // Dung hợp cánh (NPC Luyện khí sư): thú cưỡi +dung_hop_thu_cap trở lên + một món huyền thoại / thần + hồng ngọc → tỉ lệ dung_hop_ti_le ra một đôi cánh ngẫu nhiên
  // Số dòng 0–5 theo bảng dung_hop_dong (càng nhiều dòng càng hiếm); chỉ số lấy trong canh_dong, giá trị theo bậc: 0–1 dòng Đẹp, 2–3 Hoàn hảo, 4 Huyền thoại, 5 Thần (mỗi dòng ×(1+bậc thú/20)).
  // Thất bại: mất món huyền thoại / thần và hồng ngọc, thú cưỡi về +6. Thành công: mất cả hai món, nhận cánh.
  const WING_IDS=()=>Object.keys(items).filter(k=>items[k].wing);
  function fuse(s,mi,xi,rng=Math.random,luck=0){
    const m=s.bag[mi],x=s.bag[xi],dm=info(m),dx=info(x),need=num(CFG.dung_hop_thu_cap,9),cost=num(CFG.dung_hop_ngoc,60);
    if(!dm||dm.slot!=='mount'||(m.lv||0)<need)throw Error('THU');if(!dx||mi===xi||!(dx.set||dx.myth))throw Error('VAT_LIEU');if(s.rubies<cost)throw Error('RUBY');
    const pool=WING_IDS();if(!pool.length)throw Error('ITEM');
    const L=useLuck(s,luck);s.rubies-=cost;const ok=rng()*100<num(CFG.dung_hop_ti_le,40)+L;
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
      quests:{active:{},done:{}},mercs:[],pets:[],avatar:'',avatars:[],cos:newCos(),quiz:{},luck:0,recruit:null,rs:(Math.random()*2147483647)|0};
    const D=derive(s);s.hp=D.tot.hp;s.mana=D.tot.mp;return s;
  }
  // Tính toàn bộ chỉ số: 5 chỉ số lớn + chỉ số nhỏ (base + phần cộng thêm từ đồ, bộ, sách)
  const isRanged=k=>k==='bow'||k==='crossbow';
  // Chính xác của cung / nỏ (Sheet cau_hinh: cung_chinh_xac, no_chinh_xac, chinh_xac_moi_cap)
  const aimAcc=it=>{const k=kind(it);if(!isRanged(k))return 0;return Math.min(100,num(CFG[k==='bow'?'cung_chinh_xac':'no_chinh_xac'],k==='bow'?70:76)+num(CFG.chinh_xac_moi_cap,2)*((it&&it.lv)||0));};
  // mốc cường hóa đủ bộ: [cấp thấp nhất, chỉ số, giá trị, biểu tượng]
  const ENH_TIERS=[[10,'cdr',5,'whirl'],[11,'atkSpd',6,'speed'],[12,'moveSpd',6,'feather'],[13,'crit2',4,'spark'],[14,'dmgRed',4,'shield'],[15,'crit3',2,'flame']];
  const CAPS={reflect:60,dodge:50,block:60,dmgRed:70,cdr:50,crit2:60,crit3:30,range:60,perfRed:80,critRed:80,legRed:80,mythRed:80,acc:100,fullHeal:20,aim:100,mercDmg:300,petDmg:300};
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
    // v10.19: Uy lực trang bị — mỗi món cộng % sát thương và % máu theo phẩm chất (uy_luc_pham_chat) và cấp cường hóa (uy_luc_moi_cap)
    let power=0;{const base=cfgList('uy_luc_pham_chat','0,1,3,8,8'),per=cfgList('uy_luc_moi_cap','0.3,0.3,0.4,1.2,0.9'),ord=['n','g','p','l','m'];for(const it of eqs){const i=Math.max(0,ord.indexOf(qOf(it)||'n'));power+=num(base[i])+num(per[i])*(it.lv||0);}power=Math.round(power*10)/10;}
    if(shield)add('block',10);
    const sets=[];
    for(const [id,n] of Object.entries(setCount)){const S=SETS[id];if(!S)continue;sets.push({id,n,name:S.name,hero:S.hero});for(const t of [3,5,7])if(n>=t)for(const [k,v] of Object.entries(S.tiers[t]))add(k,v);if(n>=Math.min(9,S.pieces.length))fx[S.fx]=Math.max(fx[S.fx]||0,S.fxv);} // v10.14: bộ 8 món (vũ khí hai tay) đủ 8 là kích hoạt
    // Hào quang cường hóa (8 ô đồ trừ thú cưỡi; vũ khí hai tay tính cả ô tay trái):
    //  5 món +9 trở lên: + máu · đủ 8 ô +9: thêm máu và % sát thương · đủ 8 ô cùng từ +10..+15: mỗi mốc thêm một hiệu ứng (cộng dồn)
    const EQ8=['right','left','hat','armor','pants','gloves','shoes','wings'],lvOf=k=>{const it=k==='left'&&isTwo(s.equipment.right)?s.equipment.right:s.equipment[k];return info(it)?(it.lv||0):-1;};
    const lvs=EQ8.map(lvOf),n9=lvs.filter(v=>v>=9).length,full=lvs.every(v=>v>=9),minLv=Math.min(...lvs),enh={n9,full,min:full?minLv:0,list:[]};let enhDmg=0;
    if(n9>=5){add('hp',num(CFG.cuong_hoa_5_mau,80));enh.list.push(['heart','5 món +9: máu +'+num(CFG.cuong_hoa_5_mau,80)]);}
    if(full){add('hp',num(CFG.cuong_hoa_bo_mau,150));enhDmg=num(CFG.cuong_hoa_bo_sat_thuong,10);enh.list.push(['sword','Đủ bộ +9: máu +'+num(CFG.cuong_hoa_bo_mau,150)+', sát thương +'+enhDmg+'%']);
      for(const [lv,k,v,ic] of ENH_TIERS)if(minLv>=lv){add(k,v);enh.list.push([ic,'Đủ bộ +'+lv+': '+ADD[k].name+' +'+v+ADD[k].unit]);}}
    // v10.21: hiệu ứng mỗi hệ lấy theo quyển mạnh nhất (bậc × phẩm chất: bookFx), tỉ lệ kích hoạt cộng thêm theo cấp luyện
    const books={},blv={},bef={};let demon=null;for(const it of (s.skillSlots||[])){const d=info(it);if(d&&d.element){const e=d.element,f=bookFx(it);books[e]=true;blv[e]=Math.max(blv[e]??-1,it.lv||0);bef[e]=Math.max(bef[e]||0,f);for(const [k,v] of Object.entries(bookStat(it)))add(k,v);
      if(e==='demon'){const o=demonOf(it);if(!demon||o.ef>demon.ef||(o.ef===demon.ef&&o.lv>demon.lv))demon=o;}}}
    const r1=v=>Math.round(v*10)/10,pc=(k,f,e)=>blv[e]>=0?r1(num(CFG[k],f)*bef[e]+num(CFG.sach_ti_le_cap,1)*blv[e]):0;
    const bfx={thunder:pc('loi_ti_le',12,'thunder'),wind:pc('phong_ti_le',20,'wind'),ice:pc('bang_ti_le',10,'ice'),light:pc('sang_ti_le',15,'light'),demon:blv.demon>=0?blv.demon:-1};
    if(books.water)add('mpReg',r1(num(CFG.thuy_hoi_mana,3)*bef.water));if(books.wood)add('hpReg',r1(num(CFG.moc_hoi_mau,2)*bef.wood));if(books.earth)add('reflect',r1(num(CFG.tho_phan_don,30)*bef.earth));if(books.metal)add('dmgRed',r1(num(CFG.kim_giam_sat_thuong,25)*bef.metal));
    const fireK=books.fire?1+num(CFG.hoa_sat_thuong,25)*bef.fire/100:1;
    const st=s.stats||{},al=s.alloc||{};
    const main={str:num(st.strength)+num(al.strength)+(A.str||0),agi:num(st.agility)+num(al.agility)+(A.agi||0),vit:num(st.vitality)+num(al.vitality)+(A.vit||0),int:num(st.intelligence)+num(al.intelligence)+(A.int||0),cmd:num(st.command)+num(al.command)+(A.cmd||0)};
    const base={dmgMin:main.str*.6,dmgMax:main.str,crit2:main.str*.1,atkSpd:main.agi*.6,moveSpd:main.agi*.3,def:main.agi*.3,dodge:main.agi*.2,hp:num(CFG.mau_goc,60)+main.vit*num(CFG.mau_moi_diem,5),mp:num(CFG.mana_goc,40)+main.int*num(CFG.mana_moi_diem,4),cdr:main.int*.3,
      // v10.14: Sức khỏe → % hồi đầy máu khi trúng đòn; Trí tuệ → chính xác cung nỏ, hồi mana mỗi giây; Mệnh lệnh → % sát thương lính thuê và quái thu phục (Sheet cau_hinh, mỗi 100 điểm)
      fullHeal:main.vit*num(CFG.suc_khoe_hoi_day,2)/100,aim:main.int*num(CFG.tri_tue_chinh_xac,4)/100,mpReg:main.int*num(CFG.tri_tue_hoi_mana,2)/100,mercDmg:main.cmd*num(CFG.menh_lenh_sat_thuong,50)/100,petDmg:main.cmd*num(CFG.menh_lenh_sat_thuong,50)/100};
    const tot={};for(const k of Object.keys(ADD)){if(GROUPS.some(g=>g[0]===k))continue;let v=(base[k]||0)+(A[k]||0);if(CAPS[k])v=Math.min(CAPS[k],v);tot[k]=ADD[k].unit?Math.round(v*10)/10:Math.round(v);}
    tot.hp=Math.round(tot.hp*(1+power*num(CFG.uy_luc_mau,100)/1e4));tot.mp=Math.round(tot.mp);tot.dmgMax=Math.max(tot.dmgMax,tot.dmgMin);
    if(fx.defPct)tot.def=Math.round(tot.def*(1+fx.defPct/100)); // v10.13: Kiên cố (thú thần thoại)
    // cung, nỏ: tỉ lệ chính xác khi khóa mục tiêu (tăng theo cấp gia cường) và cộng thêm tỉ lệ x2 sát thương
    const rw=(s.equipment||{}).right;if(isRanged(kind(rw))){tot.aim=Math.min(100,Math.round((aimAcc(rw)+(tot.aim||0))*10)/10);tot.crit2=Math.min(CAPS.crit2,(tot.crit2||0)+num(CFG.cung_no_x2,15));} // v10.14: + chính xác từ Trí tuệ, đồ
    return {main,add:A,tot,fx,books,bfx,bef,demon,sets,mount,enh,power,dmgMul:(1+power*num(CFG.uy_luc_sat_thuong,100)/1e4)*fireK*(1+enhDmg/100)*(1+num(fx.dmgPct)/100)};
  }
  const mountCmd=eq=>eq&&eq.mount&&info(eq.mount)?mountNeed(eq.mount):0;
  // Mệnh lệnh: thú cưỡi + mỗi lính đang đi theo tốn số điểm riêng của lính đó (lính gục chờ ở làng vẫn giữ chỗ)
  // Lính thành trì: mỗi ngày (giờ Việt Nam) nhận một hệ sách ngẫu nhiên theo mã lính → đòn có hệ, mỗi đòn thứ 4 ra chiêu diện rộng
  // v10.13: lính thành trì chào thuê theo ngày — mỗi mẫu lính 3 suất, cấp quanh cấp thành, điểm chỉ số (cấp × linh_diem_cap) chia ngẫu nhiên vào 4 chỉ số, mệnh lệnh cộng thêm;
  // cùng ngày (giờ Việt Nam) máy người chơi và máy chủ sinh ra y hệt (băm mẫu|ngày|suất) nên thuê suất nào là được đúng lính đó
  const dayOf=now=>Math.floor((now+7*3600e3)/864e5);
  const hashStr=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
  function mercOffer(T,k,day){const st0={rs:hashStr(T.id+'|'+day+'|'+k)|0},r=seqRng(st0),base=mapLevel(T.map),lv=Math.max(1,base+[-10,0,15][k%3]+Math.floor(r()*8)),pts=Math.round(lv*num(CFG.linh_diem_cap,3));
    const keys=['strength','agility','vitality','intelligence'],w=keys.map(()=>r()+.15),ws=w.reduce((a,b)=>a+b,0),stats={...T.stats};keys.forEach((key,i)=>{stats[key]=Math.round(num(stats[key])+pts*w[i]/ws);});
    const cmd=T.cmd+Math.floor(r()*Math.max(1,lv/25)),price=Math.round(T.price*Math.max(.5,lv/Math.max(1,base)));
    return {tpl:T.id,k,day,lv,stats,cmd,price,name:T.name,gender:T.gender,desc:T.desc,gear:T.gear,map:T.map};}
  function mercOffers(mapId,now=Date.now()){const day=dayOf(now),out=[];for(const T of Object.values(MERCS)){if(!T.map||T.map!==mapId)continue;for(let k=0;k<3;k++)out.push(mercOffer(T,k,day));}return out;}
  // v10.14: phẩm cấp lính thuê — n thường · g tinh nhuệ · p thiện chiến · l huyền thoại · m thần thoại. Máu và sát thương nhân theo linh_he_so (1, 1.5, 2, 3, 4)
  const TIERS=['n','g','p','l','m'],TIER_NAME={n:'Lính thường',g:'Tinh nhuệ',p:'Thiện chiến',l:'Huyền thoại',m:'Thần thoại'};
  const cfgList=(k,def)=>String(CFG[k]===undefined||CFG[k]===''?def:CFG[k]).split(',').map(x=>num(x.trim()));
  const topTier=m=>m&&(m.tier==='l'||m.tier==='m'),topMul=m=>topTier(m)?1+num(CFG.linh_huyen_than_them,0):1; // v10.17: huyền thoại, thần thoại thêm máu, sát thương, phòng ngự
  const tierMul=m=>{const i=Math.max(0,TIERS.indexOf((m&&m.tier)||'n'));return Math.round(Math.max(1,num(cfgList('linh_he_so','1,1.5,2,3,4')[i],1))*topMul(m)*100)/100;};
  const mercDefMul=m=>topMul(m);
  const isGen=m=>!!(m&&m.gen&&(m.tier==='l'||m.tier==='m')),tuongPts=t=>t==='m'?num(CFG.tuong_diem_than,2600):num(CFG.tuong_diem_huyen_thoai,1800);
  // v10.24: lính đủ cấp vùng (lv ≥ cấp vùng − 10) có máu tối thiểu = số đòn quái thường chịu được × sát thương quái vùng; giảm sát thương nhận, hồi máu mỗi giây theo phẩm cấp
  function mercGuard(m,regionLv,mobDmg){const i=Math.max(0,TIERS.indexOf((m&&m.tier)||'n')),pick=(k,d)=>num(cfgList(k,d)[i]);const ok=isGen(m)||num(m&&m.lv)>=num(regionLv)-num(CFG.linh_cap_lech,10); // danh tướng: luôn được máu tối thiểu, mọi vùng
    return {hpMin:ok?Math.round(pick('linh_mau_toi_thieu','6,8,10,25,35')*num(mobDmg)):0,red:pick('linh_giam_sat_thuong','0,10,20,35,45'),reg:pick('linh_hoi_mau','0.5,1,1.5,3,4')};}
  const petDmgMul=()=>num(CFG.thu_phuc_sat_thuong,1); // v10.17: sát thương quái thu phục
  const mountPow=()=>num(CFG.thu_cuoi_nhan_chi_so,1); // v10.17: công, thủ và đòn của thú cưỡi
  // Đơn chiêu mộ (chieu_mo_hong_ngoc hồng ngọc một lần): rút phẩm cấp theo chieu_mo_ti_le; thường / tinh nhuệ / thiện chiến lấy mẫu lính của thành đang đứng,
  // huyền thoại / thần thoại là danh tướng (TUONG) mặc sẵn bộ huyền thoại / bộ thần, tháo ra cho người chơi dùng được. Giá theo cấp thành (f = cấp/300)
  function recruitRoll(mapId,rng,now){
    const P=cfgList('chieu_mo_ti_le','50,35,10,3,2'),tot=P.reduce((a,b)=>a+b,0);let x=rng()*tot,ti=P.length-1;for(let i=0;i<P.length;i++){x-=P[i];if(x<0){ti=i;break;}}
    const tier=TIERS[ti],base=Math.max(1,mapLevel(mapId)||1),f=Math.max(0,Math.min(1,base/300)),lv=Math.max(1,ti>=3?base+Math.floor(rng()*11):base+[0,10,20,35,50][ti]+Math.floor(rng()*11));
    // v10.25: danh tướng (Huyền thoại, Thần thoại) không theo hệ lính thường: chỉ số cố định tuong_diem dù chiêu mộ ở làng hay thành cuối; cấp = cấp nơi chiêu mộ (+0..10)
    const pts=ti>=3?tuongPts(tier):Math.round(lv*num(CFG.linh_diem_cap,3)*(1+ti*.25)),keys=['strength','agility','vitality','intelligence'],w=keys.map(()=>rng()+.15),L=Math.round;
    let o;
    // v10.26: danh tướng cần 150–350 Mệnh lệnh (cmd 15–35 × linh_nhan_menh_lenh), không theo nơi chiêu mộ
    if(ti>=3){const gs=Object.values(TUONG);if(!gs.length)throw Error('TUONG');const G=gs[Math.floor(rng()*gs.length)];o={tier,lv,gen:G.id,name:G.name,gender:G.gender,desc:G.desc,set:tier==='m'?G.setM:G.setL,cmd:15+Math.floor(rng()*21),stats:Object.fromEntries(keys.map(k=>[k,12]))};}
    else{const pool=Object.values(MERCS).filter(T=>T.map===mapId),pl=pool.length?pool:Object.values(MERCS).filter(T=>!T.map);if(!pl.length)throw Error('MERC');const T=pl[Math.floor(rng()*pl.length)];o={tier,lv,tpl:T.id,name:T.name,gender:T.gender,desc:T.desc,gear:T.gear.slice(),cmd:T.cmd+Math.floor(rng()*Math.max(1,lv/25))+ti*2,stats:{...T.stats}};}
    // danh tướng: chỉ số nghiêng theo binh khí (gậy phép → trí tuệ, cung nỏ → nhanh nhẹn, còn lại → sức mạnh; có khiên → thêm sức khỏe)
    if(o.set&&SETS[o.set]){const wk=items[o.set+':right'],kd=wk?wk.kind:'';w[kd==='staff'?3:kd==='bow'||kd==='crossbow'?1:0]+=1.6;if(items[o.set+':left']&&items[o.set+':left'].kind==='shield')w[2]+=.6;}
    const ws2=w.reduce((a,b)=>a+b,0);keys.forEach((k,i)=>{o.stats[k]=L(num(o.stats[k])+pts*w[i]/ws2);});o.stats.command=0;
    const lerp=(a,b)=>L(a+(b-a)*f);
    if(ti>=3){const vi=keys.indexOf('vitality');if(w[vi]<ws2*.25){o.stats.vitality=Math.max(o.stats.vitality,L(pts*.25));}} // danh tướng: Sức khỏe ít nhất 1/4 số điểm
    o.price=ti===0?{copper:lerp(1,100)*10000}:ti===1?(f<.25?{copper:L(100+300*f/.25)*10000}:{rubies:lerp(10,100)}):ti===2?{rubies:lerp(100,500)}:{rubies:Math.round(ti===4?num(CFG.tuong_gia_than,2000):num(CFG.tuong_gia_huyen_thoai,500))}; // v10.25: giá danh tướng như nhau mọi nơi
    o.map=mapId;o.at=now;return o;
  }
  function recruit(s,mapId,rng,now){const cost=num(CFG.chieu_mo_hong_ngoc,100);if(s.rubies<cost)throw Error('RUBY');s.rubies-=cost;s.recruit=recruitRoll(String(mapId||''),rng,now);return s.recruit;}
  function recruitHire(s,rng){
    const o=s.recruit;if(!o)throw Error('CHIEU_MO');if(s.mercs.length>=MAX_MERC)throw Error('MERC_FULL');
    if(num(o.price.copper)>s.copper)throw Error('MONEY');if(num(o.price.rubies)>s.rubies)throw Error('RUBY');
    const m=makeMerc({src:'npc',tpl:o.tpl||'',name:o.name,gender:o.gender,cmd:o.cmd,stats:o.stats,lv:o.lv,tier:o.tier,gen:o.gen||''},rng);
    if(o.set&&SETS[o.set]){for(const id of SETS[o.set].pieces){const d=items[id],it=roll(id,d.q||'l',rng);if(d.slot==='hand')m.equipment[id.endsWith(':left')?'left':'right']=it;else m.equipment[d.slot]=it;}}
    else{let hand=0;for(const g of (o.gear||[])){const d=items[g];if(!d)continue;const it=roll(g,o.tier==='p'?'p':o.tier==='g'?'g':'n',rng);if(d.slot==='hand'){const sl=d.grip==='two'?'right':hand++?'left':'right';m.equipment[sl]=it;}else if(d.slot!=='mount')m.equipment[d.slot]=it;}}
    s.copper-=num(o.price.copper);s.rubies-=num(o.price.rubies);s.recruit=null;m.on=fitFollow(s,m);s.mercs.push(m);return m;
  }
  const cleanRecruit=o=>{if(!o||typeof o!=='object'||!TIERS.includes(o.tier))return null;const st={};for(const k of ['strength','agility','vitality','intelligence'])st[k]=Math.max(0,Math.floor(num(o.stats&&o.stats[k],10)));st.command=0;
    return {tier:o.tier,lv:Math.max(1,Math.floor(num(o.lv,1))),gen:TUONG[o.gen]?o.gen:'',tpl:MERCS[o.tpl]?o.tpl:'',name:String(o.name||'Lính').slice(0,20),gender:o.gender==='f'?'f':'m',desc:String(o.desc||'').slice(0,120),set:SETS[o.set]?o.set:'',gear:Array.isArray(o.gear)?o.gear.filter(g=>items[g]).slice(0,8):[],cmd:Math.max(1,Math.floor(num(o.cmd,10))),stats:st,price:{copper:Math.max(0,Math.floor(num(o.price&&o.price.copper))),rubies:Math.max(0,Math.floor(num(o.price&&o.price.rubies)))},map:String(o.map||''),at:Math.floor(num(o.at))};};
  function mercDaily(m,now=Date.now()){const T=m&&MERCS[m.tpl];if(!T||!T.map)return null;const day=Math.floor((now+7*3600e3)/864e5);let h=0;for(const ch of String(m.mid))h=(h*31+ch.charCodeAt(0))>>>0;const keys=Object.keys(ELEMENTS),el=keys[(h+day)%keys.length];return {el,name:ELEMENTS[el].name,skill:'Sách '+ELEMENTS[el].name};}
  // v10.16: Mệnh lệnh cần để dắt một lính = chỉ số cmd của lính × linh_nhan_menh_lenh; máu, sát thương lính × linh_nhan_chi_so
  const mercCost=m=>Math.round(num(m&&m.cmd,5)*num(CFG.linh_nhan_menh_lenh,1));
  const mercPow=()=>num(CFG.linh_nhan_chi_so,1);
  function mercCmd(s){return (s.mercs||[]).reduce((a,m)=>a+(m.on?mercCost(m):0),0);}
  // Mệnh lệnh: tổng, đã dùng (thú cưỡi, lính), còn trống
  function cmdInfo(s){const total=derive(s).main.cmd,mount=mountCmd(s.equipment),merc=mercCmd(s);return {total,mount,merc,used:mount+merc,free:total-mount-merc};}
  function fitFollow(s,m){return (m.hpFrac===undefined||m.hpFrac>0)&&cmdInfo(s).free>=mercCost(m);}
  function stash(bag,list,prefer){const b=bag.slice();for(const it of list){const i=prefer!=null&&b[prefer]===null?prefer:b.indexOf(null);if(i<0)throw Error('BAG_FULL');b[i]=it;prefer=null;}return b;}
  const newCos=()=>({use:{avatar:'',nen:'',ten:''},own:{avatar:[],nen:[],ten:[]}});
  const COS_KINDS=['avatar','nen','ten']; // v10.12: bỏ khung chân dung
  // Mỹ phẩm vào thẳng bộ sưu tập và mặc luôn (mua ở Phấn Son hoặc dùng từ túi); thuốc đa nhiệm cần chọn hiệu ứng tên fx
  function wearCos(s,d,type,fx){s.cos=s.cos||newCos();let kind=d.kind,id=type;if(kind==='thuoc'){kind='ten';id=String(fx||'');if(!NAME_FX[id])throw Error('FX');}if(!COS_KINDS.includes(kind))throw Error('ITEM');if(!s.cos.own[kind].includes(id))s.cos.own[kind].push(id);s.cos.use[kind]=id;return {kind,id};}
  function targets(s,item){
    const d=info(item);if(!d||!d.slot||d.slot==='book'||d.slot==='cos'||d.slot==='quest')return [];
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
    if(d.slot==='mount'&&!s.isMerc){const need=mountNeed(item);if(need>derive(s).main.cmd-mercCmd(s))throw Error('CMD');}
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
    const type=['sword','saber','mace','staff'].find(k=>types.includes(k))||'shield'; // v10.14: đao, chùy
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
  // v10.21: không ghi cửa hàng thì lấy dòng ở cửa hàng làng trước (trước đây lấy dòng cuối cùng → sách mua ở Đạo sĩ làng thành sách bậc Phú Xuân, giá Phú Xuân)
  const shopRow=(type,shop)=>{if(shop&&SHOPS[shop])return SHOPS[shop].find(r=>r.id===type)||null;let row=null,town=null;for(const k in SHOPS){const r=SHOPS[k].find(x=>x.id===type);if(!r)continue;if(/^thanh-/.test(k)){if(!town)town=r;}else if(!row)row=r;}return row||town;};
  // Giá: Đẹp ×he_so_gia_do_dep, Hoàn hảo ×he_so_gia_hoan_hao (%). Đồ phẩm chất cố định (huyền thoại, thần) bán trong cửa hàng thành trì thì tính theo giá dòng hàng
  // v10.23: giá sách = giá ở làng × sach_gia_nhan × sach_gia_moi_thanh^(bậc thành) × phẩm chất
  function shopPrice(type,q='n',shop){const d=items[type];if(!d)return 0;const row=shopRow(type,shop),p=row&&row.price?row.price:d.price;if(d.q)return Math.round(p);if(d.slot==='book')return Math.round(num(d.price)*num(CFG.sach_gia_nhan,100)*Math.pow(num(CFG.sach_gia_moi_thanh,5),bacOfT(row&&row.t))*lst('sach_gia_pham_chat','1,5,20,100,400',Math.max(0,QORD.indexOf(q))));return Math.round(p*(q==='g'?num(CFG.he_so_gia_do_dep,250)/100:q==='p'?num(CFG.he_so_gia_hoan_hao,600)/100:1));}
  // v10.21: sách Huyền thoại, Thần thêm giá hồng ngọc theo bậc thành
  function shopRuby(type,q='n',shop){const d=items[type];if(!d)return 0;if(d.ruby)return d.ruby;if(d.slot!=='book')return 0;const row=shopRow(type,shop);return Math.round(lst('sach_hong_ngoc_pham_chat','0,0,0,20,100',Math.max(0,QORD.indexOf(q)))*lst('sach_hong_ngoc_bac','1,2,4,7,10',bacOfT(row&&row.t)));}
  function buy(s,type,q='n',rng=Math.random,shop){const d=items[type];const row=shopRow(type,shop);if(!d||!(row&&row.price||d.price||d.ruby)||(d.q&&!row))throw Error('ITEM');if(row&&!row.q.includes(d.q||q))throw Error('ITEM');const price=d.ruby?0:shopPrice(type,q,shop),rb=shopRuby(type,d.q?'n':q,shop);if(s.copper<price)throw Error('MONEY');if(s.rubies<rb)throw Error('RUBY');const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.copper-=price;s.rubies-=rb;s.bag[i]=roll(type,d.q?'n':q,rng,row&&row.t||0);return i;}
  function sell(s,index){const it=s.bag[index];if(!it)throw Error('SLOT');const dd=info(it);if(dd&&(dd.slot==='quest'||dd.slot==='cos'))throw Error('KHONG_BAN');const v=sellPrice(it);s.copper+=v;s.bag[index]=null;return v;}
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
  function questAccept(s,id){const Q=QUESTS[id];if(!Q)throw Error('QUEST');if((s.level||1)<questLevel(Q))throw Error('LEVEL');if(s.quests.active[id]!=null)throw Error('QUEST_HAVE');if(Object.keys(s.quests.active).length>=MAX_ACTIVE_QUEST)throw Error('QUEST_FULL');if(!Q.repeat&&s.quests.done[id])throw Error('QUEST_DONE');if(Q.req&&!s.quests.done[Q.req])throw Error('QUEST_TRUOC');s.quests.active[id]=0;}
  // v10.13: sự kiện đột xuất ở làng / thành (mỗi su_kien_phut phút một lần, theo mốc đồng hồ): quái sự kiện hiện ngoài vùng an toàn gần cổng;
  // thắng (đuổi kẻ trộm / hạ hết) → op eventWin: cỏ may mắn + tiền + hồng ngọc; máy chủ chỉ nhận mỗi sự kiện một lần trong một khoảng (srv.evAt)
  const EVENTS={
    'trom-cho':{map:'thanh-moc',name:'Kẻ trộm chó lẻn vào làng',hint:'Đánh cho hắn bỏ chạy',mobs:[['ke-trom-cho',1]],dur:150,flee:.4,luck:[2,4],copper:300,rubies:0},
    'quan-phuong-bac':{map:'co-loa',name:'Quân phương Bắc tràn xuống',hint:'Hạ hết trước khi chúng rút',mobs:[['linh-phuong-bac',6],['tuong-phuong-bac',1]],dur:600,luck:[3,5],copper:20000,rubies:3},
    'dao-tac':{map:'thang-long',name:'Đạo tặc cướp kho lương',hint:'Hạ hết bọn đạo tặc ngoài cổng',mobs:[['dao-tac',6]],dur:600,luck:[3,6],copper:200000,rubies:5},
    'ho-du':{map:'hoa-lu',name:'Hổ dữ sổng chuồng',hint:'Hạ ba con hổ dữ trước khi chúng vào thành',mobs:[['ho-du',3]],dur:600,luck:[4,6],copper:1000000,rubies:8},
    'gian-te':{map:'phu-xuan',name:'Gian tế ám sát trong đêm',hint:'Hạ hết gian tế ngoài cổng thành',mobs:[['gian-te',5]],dur:600,luck:[5,8],copper:4000000,rubies:12}
  };
  // Cốt truyện (v10.12): mỗi việc gắn với một NPC (cột npc, noi). storyAt: việc NPC này đang có cho nhân vật → {Q,state:'new'|'active'|'ready'}; storyNext: việc kế tiếp chưa nhận (để bảng nhiệm vụ chỉ chỗ)
  function storyAt(s,npcId){for(const Q of Object.values(QUESTS)){if(!Q.story||Q.npc!==npcId)continue;const n=s.quests.active[Q.id];if(n!=null)return {Q,state:n>=Q.count?'ready':'active'};if(!s.quests.done[Q.id]&&(!Q.req||s.quests.done[Q.req]))return {Q,state:'new'};}return null;}
  function storyNext(s){return Object.values(QUESTS).filter(Q=>Q.story&&!s.quests.done[Q.id]&&s.quests.active[Q.id]==null&&(!Q.req||s.quests.done[Q.req])).sort((a,b)=>questLevel(a)-questLevel(b))[0]||null;}
  function questProgress(s,monId){const out=[];for(const id of Object.keys(s.quests.active)){const Q=QUESTS[id];if(Q&&Q.target===monId&&s.quests.active[id]<Q.count){s.quests.active[id]++;out.push(id);}}return out;}
  function questTurnIn(s,id,rng=Math.random){
    const Q=QUESTS[id];if(!Q||s.quests.active[id]==null)throw Error('QUEST');if(s.quests.active[id]<Q.count)throw Error('QUEST_NOT_DONE');
    let it=null;if(Q.item&&items[Q.item]){if(s.bag.indexOf(null)<0)throw Error('BAG_FULL');let q=Q.itemQ||'n';if(RAR[q]&&RAR[q].tier>dropCap())q='p';it=roll(Q.item,q,rng);addItem(s,it);}
    s.copper+=Q.copper;s.rubies+=Q.rubies;delete s.quests.active[id];s.quests.done[id]=(s.quests.done[id]||0)+1;const up=gainExp(s,Q.exp);return {copper:Q.copper,rubies:Q.rubies,item:it,exp:Q.exp,up};
  }
  // Kinh nghiệm và cấp: điểm cần cho mỗi cấp tăng dần; lên cấp được điểm cộng vào 4 chỉ số
  const maxLevel=()=>Math.max(num(CFG.cap_toi_da,100),...REGIONS.map(r=>r.lv)),petMax=s=>{if(s){const D=derive(s);return D.demon?D.demon.max:0;}return num(CFG.ma_toi_da,2);},PET_CAP=6;
  const expNeed=lv=>Math.round(num(CFG.exp_goc,60)*Math.pow(Math.max(1,lv),num(CFG.exp_tang,150)/100));
  function gainExp(s,n){
    n=Math.max(0,Math.floor(num(n)));let up=0;if(s.level>=maxLevel()){s.exp=0;return 0;}
    s.exp=(s.exp||0)+n;
    while(s.level<maxLevel()&&s.exp>=expNeed(s.level)){s.exp-=expNeed(s.level);s.level++;s.points=(s.points||0)+num(CFG.diem_moi_cap,5);up++;}
    if(s.level>=maxLevel())s.exp=0;
    if(up){const D=derive(s);s.hp=D.tot.hp;s.mana=D.tot.mp;}
    return up;
  }
  // v10.17: lính đi theo nhận cùng lượng kinh nghiệm như chủ; lên cấp được diem_moi_cap điểm, tự chia vào 4 chỉ số theo tỉ lệ chỉ số đang có
  function mercGainExp(m,n){
    n=Math.max(0,Math.floor(num(n)));if(!n)return 0;m.lv=Math.max(1,m.lv||0);if(m.lv>=maxLevel()){m.exp=0;return 0;}
    m.exp=(m.exp||0)+n;let up=0;const K=['strength','agility','vitality','intelligence'];
    while(m.lv<maxLevel()&&m.exp>=expNeed(m.lv)){m.exp-=expNeed(m.lv);m.lv++;up++;
      const P=num(CFG.diem_moi_cap,5),tot=K.reduce((a,k)=>a+Math.max(1,num(m.stats[k])),0),give=K.map(k=>P*Math.max(1,num(m.stats[k]))/tot),fl=give.map(Math.floor);let left=P-fl.reduce((a,b)=>a+b,0);
      const ord=K.map((k,i)=>i).sort((a,b)=>(give[b]-fl[b])-(give[a]-fl[a])||a-b);for(const i of ord){if(left<=0)break;fl[i]++;left--;}K.forEach((k,i)=>m.stats[k]=num(m.stats[k])+fl[i]);}
    if(m.lv>=maxLevel())m.exp=0;return up;
  }
  const STAT_OF={str:'strength',agi:'agility',vit:'vitality',int:'intelligence',cmd:'command'};
  function spendPoints(s,k,n){const key=STAT_OF[k]||k;n=Math.floor(num(n,1));if(![...STAT_KEYS,'command'].includes(key)||!(n>=1))throw Error('STAT');if((s.points||0)<n)throw Error('POINTS');s.points-=n;s.alloc[key]=(s.alloc[key]||0)+n;}
  // Lính đánh thuê
  function makeMerc(o,rng=Math.random){
    const m={mid:'mc-'+rnd36(rng),src:o.src||'npc',tpl:o.tpl||'',from:o.from||'',name:String(o.name||'Lính').slice(0,20),gender:o.gender==='f'?'f':'m',cmd:num(o.cmd,10),lv:Math.max(0,Math.floor(num(o.lv,0))),exp:Math.max(0,Math.floor(num(o.exp,0))),tier:TIERS.includes(o.tier)?o.tier:'n',gen:TUONG[o.gen]?o.gen:'', // v10.14: phẩm cấp, danh tướng
      
      stats:{strength:num(o.stats&&o.stats.strength,10),agility:num(o.stats&&o.stats.agility,10),vitality:num(o.stats&&o.stats.vitality,10),intelligence:num(o.stats&&o.stats.intelligence,10),command:0},equipment:Object.fromEntries(slots.map(k=>[k,null])),hpFrac:1};
    const eq=o.equipment||{};for(const k of slots){const it=cleanItem(eq[k]);if(it)m.equipment[k]=it;}
    // v10.25: danh tướng chiêu mộ trước đây (chỉ số theo cấp nơi chiêu mộ) được nâng lên đủ tuong_diem, giữ tỉ lệ chỉ số
    if(isGen(m)){const K=['strength','agility','vitality','intelligence'],sum=K.reduce((a,k)=>a+num(m.stats[k]),0),want=tuongPts(m.tier)+48;if(sum>0&&sum<want){const r=want/sum;for(const k of K)m.stats[k]=Math.round(num(m.stats[k])*r);}}
    return m;
  }
  function hireNpc(s,id,rng=Math.random,o={},at=Date.now()){
    const T=MERCS[id];if(!T)throw Error('MERC');if(s.mercs.length>=MAX_MERC)throw Error('MERC_FULL');if(T.map&&(s.level||1)<mapLevel(T.map))throw Error('LEVEL');
    // lính thành trì: thuê theo suất chào trong ngày (k, day); ngày lệch quá 1 so với máy chủ thì từ chối
    let off=null;if(T.map){const day=Math.floor(num(o.day,dayOf(at)));if(Math.abs(day-dayOf(at))>1)throw Error('MERC_CU');off=mercOffer(T,Math.max(0,Math.min(2,Math.floor(num(o.k)))),day);}
    const price=off?off.price:T.price;if(s.copper<price)throw Error('MONEY');
    const m=makeMerc({src:'npc',tpl:id,name:T.name,gender:T.gender,cmd:off?off.cmd:T.cmd,stats:off?off.stats:T.stats,lv:off?off.lv:0},rng);
    let hand=0;for(const g of T.gear){const d=items[g];if(!d)continue;const it=roll(g,'n',rng);if(d.slot==='hand'){const sl=d.grip==='two'?'right':hand++?'left':'right';m.equipment[sl]=it;}else if(d.slot!=='mount')m.equipment[d.slot]=it;}
    s.copper-=price;m.on=fitFollow(s,m);s.mercs.push(m);return m;
  }
  function addMerc(s,o){if(s.mercs.length>=MAX_MERC)throw Error('MERC_FULL');const m=makeMerc(o);m.on=fitFollow(s,m);s.mercs.push(m);return m;}
  // Cho lính đi theo / nghỉ. Lính gục phải chờ ở làng, chủ về làng mới dắt đi tiếp được
  function setFollow(s,i,on){
    const m=s.mercs[i];if(!m)throw Error('MERC');
    if(!on){m.on=false;return;}
    if(m.on)return;if(!(m.hpFrac>0))throw Error('MERC_DOWN');if(cmdInfo(s).free<mercCost(m))throw Error('CMD');m.on=true;
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
    s.copper=Math.floor(n(p.copper,0,Number.MAX_SAFE_INTEGER,0));s.rubies=Math.floor(n(p.rubies,0,Number.MAX_SAFE_INTEGER,0));s.luck=Math.floor(n(p.luck,0,9999,0));
    s.stats.command=Math.floor(n(p.stats&&p.stats.command,0,999,s.stats.command));
    if(p.flags){s.flags.river=!!p.flags.river;s.flags.hunted=!!p.flags.hunted;if(Array.isArray(p.flags.tutGift))s.flags.tutGift=p.flags.tutGift.slice(0,6).map(String);if(p.flags.tutDied)s.flags.tutDied=true;if(p.flags.wells&&typeof p.flags.wells==='object')for(const [k,v] of Object.entries(p.flags.wells))if(/^gieng-\d+$/.test(k)&&Number.isFinite(+v))s.flags.wells[k]=+v;for(const [k,v] of Object.entries(p.flags.kills||{}))if(MON[k])s.flags.kills[k]=Math.floor(n(v,0,1e9,0));}
    const extra=[],eq=Object.fromEntries(slots.map(k=>[k,null]));
    for(const k of slots){const it=valid(p.equipment&&p.equipment[k]);if(!it)continue;const d=items[it.type];const ok=(d.slot==='hand'?(k==='left'||k==='right'):d.slot===k)&&(!d.gender||d.gender===s.gender);if(ok)eq[k]=it;else extra.push(it);}
    if(isTwo(eq.left)){extra.push(eq.left);eq.left=null;}
    if(isTwo(eq.right)&&eq.left){extra.push(eq.left);eq.left=null;}
    if(eq.left&&eq.right&&!pairOk(kind(eq.left),kind(eq.right))){extra.push(eq.left);eq.left=null;}
    s.equipment=eq;
    const srcBag=Array.isArray(p.bag)?p.bag:[];s.bag=Array.from({length:BAG_SIZE},(_,i)=>valid(srcBag[i]));
    const srcSk=Array.isArray(p.skillSlots)?p.skillSlots:[];
    s.skillSlots=Array.from({length:SKILL_SLOTS},(_,i)=>{const it=valid(srcSk[i]);if(it&&items[it.type].slot!=='book'){extra.push(it);return null;}return it;});
    for(let i=SKILL_SLOTS;i<srcSk.length;i++){const it=valid(srcSk[i]);if(it)extra.push(it);} // v10.12: còn 5 ô sách, sách dư về túi
    s.activeBook=Number.isInteger(p.activeBook)&&s.skillSlots[p.activeBook]?p.activeBook:null;
    for(const it of extra){const i=s.bag.indexOf(null);if(i>=0)s.bag[i]=it;}
    for(const k of Object.keys(skills))s.cooldowns[k]=n(p.cooldowns&&p.cooldowns[k],0,Date.now()+skills[k].cooldown,0);
    if(p.quests){for(const [k,v] of Object.entries(p.quests.active||{}))if(QUESTS[k])s.quests.active[k]=Math.floor(n(v,0,999,0));for(const [k,v] of Object.entries(p.quests.done||{}))if(QUESTS[k])s.quests.done[k]=Math.floor(n(v,0,1e6,0));}
    if(Array.isArray(p.mercs))s.mercs=p.mercs.slice(0,MAX_MERC).map(m=>{const x=makeMerc(m);x.mid=typeof m.mid==='string'?m.mid.slice(0,30):x.mid;x.hpFrac=n(m.hpFrac,0,1,1);x.on=!!m.on;return x;});
    if(Number.isInteger(p.activeMerc)&&s.mercs[p.activeMerc])s.mercs[p.activeMerc].on=true; // bản cũ: 1 lính
    s.recruit=cleanRecruit(p.recruit); // v10.14: đơn chiêu mộ đang chờ
    s.avatars=(Array.isArray(p.avatars)?p.avatars:[]).filter(id=>AVATARS[id]).slice(0,60);const av=AVATARS[p.avatar];s.avatar=av&&(!av.gender||av.gender===s.gender)&&(s.avatars.includes(p.avatar)||!(av.price||av.ruby))?p.avatar:'';
    s.cos=newCos();if(p.cos&&typeof p.cos==='object'){for(const k of COS_KINDS){const own=(p.cos.own&&Array.isArray(p.cos.own[k])?p.cos.own[k]:[]).filter(id=>k==='ten'?NAME_FX[id]:items[id]&&items[id].slot==='cos').slice(0,40);s.cos.own[k]=[...new Set(own)];const u=p.cos.use&&typeof p.cos.use[k]==='string'?p.cos.use[k]:'';s.cos.use[k]=s.cos.own[k].includes(u)?u:'';}}
    s.quiz={};if(p.quiz&&typeof p.quiz==='object')for(const [k,v] of Object.entries(p.quiz)){if(!v||typeof v!=='object')continue;s.quiz[k]={done:Math.floor(n(v.done,0,99,0)),fail:Math.floor(n(v.fail,0,99,0)),hunt:v.hunt&&typeof v.hunt==='object'?{mon:String(v.hunt.mon||''),need:Math.floor(n(v.hunt.need,0,999,0)),got:Math.floor(n(v.hunt.got,0,999,0))}:null,reveal:!!v.reveal};}
    if(Array.isArray(p.pets)){const now=Date.now();s.pets=p.pets.filter(x=>x&&MON[x.type]&&!(MON[x.type].boss>=2)&&typeof x.pid==='string'&&!(num(x.exp)>0&&num(x.exp)<=now)).slice(0,PET_CAP).map(x=>({pid:x.pid.slice(0,30),type:x.type,hpFrac:n(x.hpFrac,0,1,1),...(num(x.exp)>0?{exp:Math.floor(num(x.exp))}:{})}));} // v10.21: quái hết hạn thu phục thì đi mất; trùm vùng thu phục được
    {const mt=s.equipment&&s.equipment.mount;if(mt&&mountCmd(s.equipment)>derive(s).main.cmd){const b=s.bag.indexOf(null);if(b>=0){s.bag[b]=mt;s.equipment.mount=null;}}} // v10.17: thú cưỡi cần nhiều Mệnh lệnh hơn đang có thì cất vào túi
    const D=derive(s);
    // lính vượt quá Mệnh lệnh đang có thì cho nghỉ (theo thứ tự trong danh sách)
    {let left=D.main.cmd-mountCmd(s.equipment);for(const m of s.mercs)if(m.on){if(mercCost(m)<=left)left-=mercCost(m);else m.on=false;}}
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
  const PREDICT=new Set(['kill','buy','sell','enh','enhSk','qa','qt','hire','dismiss','pt','petOff','av','fuse','use','cos','die','quiz','quizHunt','eventWin','recruit','recruitHire','tutGift']);
  // v10.13: khóa chữ ký kết quả Thầy đồ (máy chủ ký bằng khóa bí mật; trình duyệt chỉ áp dụng trước, máy chủ kiểm khi nhận gói lưu)
  const quizKey=(cid,bo,wrong)=>'quiz|'+cid+'|'+bo+'|'+(wrong||[]).join(',');
  function applyOp(s,op,srv,now=Date.now(),rng=Math.random){
    const t=op&&op.t;if(PREDICT.has(t))rng=seqRng(s);
    if(t==='kill'){
      const M=MON[op.mon];if(!M)throw Error('MON');
      srv.kills=srv.kills||{};const win=Math.max(5,M.respawn)*1000,log=(srv.kills[op.mon]||[]).filter(x=>now-x<win);
      if(log.length>=KILL_LIMIT(op.mon))throw Error('NHANH_QUA');log.push(now);srv.kills[op.mon]=log;
      const D=derive(s),F=D.fx||{},copper=killCopper(M,F.coinUp),exp=killExp(M,F.expUp);
      s.copper+=copper;s.flags.kills[op.mon]=(s.flags.kills[op.mon]||0)+1;
      const drop=rollDrop(op.mon,rng,1+num(F.luck)/100),items=[],lost=[];s.rubies+=drop.rubies;
      {const bk=M.boss?bossBook(op.mon,rng):null;if(bk)drop.items.push(bk);} // v10.22: sách Huyền thoại, Thần chỉ rơi từ trùm
      for(const it of drop.items){try{addItem(s,it);items.push(it);}catch(e){lost.push(it);}}
      const done=questProgress(s,op.mon).filter(id=>s.quests.active[id]>=QUESTS[id].count);
      // Thầy đồ: việc săn quái lấy manh mối đáp án
      let hunt=null;for(const [bo,z] of Object.entries(s.quiz||{}))if(z.hunt&&!z.reveal&&z.hunt.mon===op.mon&&z.hunt.got<z.hunt.need){z.hunt.got++;if(z.hunt.got>=z.hunt.need)z.reveal=true;hunt={bo,got:z.hunt.got,need:z.hunt.need,reveal:z.reveal};}
      let bonus=0;const k=s.flags.kills;if(!s.flags.hunted&&k.deer&&k.lion&&k.elephant&&k.croc){s.flags.hunted=true;s.copper+=100;bonus=100;}
      const up=gainExp(s,exp);
      const mercUp=[];for(const m of s.mercs||[])if(m.on&&m.hpFrac>0){const u=mercGainExp(m,exp);if(u)mercUp.push({name:m.name,lv:m.lv});}
      // Sách Ma công (v10.21): tỉ lệ thu phục = (gốc + Mệnh lệnh + cấp sách) × độ mạnh sách; số quái tối đa và thu phục trùm theo bậc sách.
      // Trùm vùng: tỉ lệ × ma_boss_bac (0 = không được); trùm thế giới, trùm cuối không thu phục. Thời gian ở lại theo Trí tuệ (tameMin)
      let pet=null;const DM=D.demon;if(DM&&(s.pets=s.pets||[]).filter(x=>!(num(x.exp)>0&&num(x.exp)<=now)).length<DM.max&&!(M.boss>=2)){let ch=(num(CFG.ma_ti_le_goc,2)+D.main.cmd*num(CFG.ma_phan_van_moi_menh_lenh,20)/100+num(CFG.sach_ti_le_cap,1)*DM.lv)*DM.ef;if(M.boss)ch*=DM.boss;
        if(ch>0&&rng()*100<ch){const mins=tameMin(D.main.int,!!M.boss);s.pets=s.pets.filter(x=>!(num(x.exp)>0&&num(x.exp)<=now));pet={pid:'pet-'+rnd36(rng),type:op.mon,hpFrac:1,...(mins>0?{exp:now+mins*60000}:{})};s.pets.push(pet);}}
      return {mon:op.mon,copper,rubies:drop.rubies,items,lost,done,bonus,exp,up,level:s.level,pet,hunt,mercUp};
    }
    if(t==='buy'){const type=String(op.type),d=items[type];
      // v10.12: thẻ avatar, nền hồ sơ, thuốc đa nhiệm mua xong áp dụng ngay (không qua túi đồ)
      if(d&&d.slot==='cos'){if(!d.ruby||!shopRow(type,op.shop?String(op.shop):undefined))throw Error('ITEM');if(d.kind==='thuoc'&&!NAME_FX[String(op.fx||'')])throw Error('FX');if(s.rubies<d.ruby)throw Error('RUBY');s.rubies-=d.ruby;const c=wearCos(s,d,type,op.fx);return {cos:c,item:{type}};}
      const i=buy(s,type,RAR[op.q]&&op.q!=='n'?String(op.q):'n',rng,op.shop?String(op.shop):undefined);return {i,item:s.bag[i]};}
    // Diện mạo (NPC Thợ truyền thần ở thành trì): mua rồi đổi; diện mạo giá 0 ai cũng đổi được
    if(t==='av'){const id=String(op.id||'');if(!id){s.avatar='';return {id};}const V=AVATARS[id];if(!V)throw Error('AV');if(V.gender&&V.gender!==s.gender)throw Error('GENDER');s.avatars=s.avatars||[];
      if(!s.avatars.includes(id)&&(V.price||V.ruby)){if(s.copper<V.price)throw Error('MONEY');if(s.rubies<V.ruby)throw Error('RUBY');s.copper-=V.price;s.rubies-=V.ruby;s.avatars.push(id);}
      s.avatar=id;return {id,bought:!!(V.price||V.ruby)};}
    if(t==='sell'){const i=Math.floor(op.i),it=s.bag[i];const v=sell(s,i);return {v,item:it};}
    // Mỹ phẩm: dùng thẻ / khung / nền / thuốc trong túi → vào bộ sưu tập và mặc luôn (thuốc đa nhiệm: chọn hiệu ứng tên op.fx)
    if(t==='use'){const i=Math.floor(op.i),it=s.bag[i],d=info(it);if(!it||!d||d.slot!=='cos')throw Error('ITEM');const c=wearCos(s,d,it.type,op.fx);s.bag[i]=null;return c;}
    if(t==='cos'){const kind=String(op.kind||''),id=String(op.id||'');if(!COS_KINDS.includes(kind))throw Error('ITEM');s.cos=s.cos||newCos();if(id&&!s.cos.own[kind].includes(id))throw Error('KHONG_CO');s.cos.use[kind]=id;return {kind,id};}
    // Gục ngã: mất toàn bộ đồ đang mặc (cau_hinh chet_mat_do); cấp, sách, lính, thú, túi giữ nguyên
    if(t==='eventWin'){const ev=String(op.ev||''),E=EVENTS[ev];if(!E)throw Error('EVENT');srv.evAt=srv.evAt||{};const gap=num(CFG.su_kien_phut,5)*60000;if(now-(srv.evAt[ev]||0)<gap*.8)throw Error('EVENT_CU');srv.evAt[ev]=now;
      const luck=E.luck[0]+Math.floor(rng()*(E.luck[1]-E.luck[0]+1));s.luck=Math.floor(num(s.luck))+luck;s.copper+=E.copper;s.rubies+=E.rubies||0;return {luck,copper:E.copper,rubies:E.rubies||0,total:s.luck};}
    if(t==='die'){const lost=[];if(num(CFG.chet_mat_do,1)||op.tut){for(const k of slots){if(s.equipment[k]){lost.push(s.equipment[k]);s.equipment[k]=null;}}}
      // v10.28: gục trong hướng dẫn tân thủ (Ngư Tinh) — mất cả quần áo trong túi (bộ Lý trưởng tặng, đồ khởi đầu), chỉ còn mảnh vải che thân
      if(op.tut&&Array.isArray(s.flags.tutGift)&&!s.flags.tutDied){s.flags.tutDied=true;const g=new Set(s.flags.tutGift),wear=new Set(['hat','armor','pants','gloves','shoes','wings']);s.bag.forEach((it,i)=>{const d=it&&items[it.type];if(it&&(g.has(it.uid)||(d&&wear.has(d.slot)&&!d.set&&!d.ruby))){lost.push(it);s.bag[i]=null;}});}
      return {lost};}
    // v10.28: hướng dẫn tân thủ — Lý trưởng tặng một bộ quần áo (một lần)
    if(t==='tutGift'){if(s.flags.tutGift)throw Error('DA_NHAN');const ids=['hat','armor','pants','shoes'].filter(id=>items[id]);if(s.bag.filter(x=>!x).length<ids.length)throw Error('BAG_FULL');
      const got=ids.map(id=>{const it=roll(id,'n',rng);addItem(s,it);return it;});s.flags.tutGift=got.map(it=>it.uid);return {items:got};}
    // Thầy đồ: trả lời bộ câu hỏi (máy chủ chấm); sai quá thì giao việc săn quái; săn xong được chỉ đáp án, trả lời lại nhận thưởng giảm
    if(t==='quizShow'){const bo=String(op.bo||''),Q=QUIZ[bo],z=s.quiz&&s.quiz[bo];if(!Q)throw Error('QUIZ');if(!(z&&z.reveal))throw Error('QUIZ_CHUA');return {show:Q.qs.map(q=>q.ans)};}
    if(t==='quiz'||t==='quizHunt'){const bo=String(op.bo||''),Q=QUIZ[bo];if(!Q||!Q.qs.length)throw Error('QUIZ');s.quiz=s.quiz||{};const z=s.quiz[bo]=s.quiz[bo]||{done:0,fail:0,hunt:null,reveal:false};if(z.done)throw Error('QUIZ_XONG');
      const order=Object.values(QUIZ).filter(x=>x.qs.length).sort((a,b)=>a.order-b.order),idx=order.findIndex(x=>x.id===bo),prev=idx>0?order[idx-1]:null;if(prev&&!(s.quiz[prev.id]&&s.quiz[prev.id].done))throw Error('QUIZ_TRUOC');
      const startHunt=()=>{if(!z.hunt){const mon=Q.mon&&MON[Q.mon]?Q.mon:'';if(!mon)throw Error('QUIZ_QUAI');z.hunt={mon,need:Q.need||num(CFG.quiz_san_so_luong,8),got:0};}return {hunt:z.hunt,reveal:z.reveal};};
      if(t==='quizHunt')return startHunt();
      // v10.13: op mang sẵn câu sai + chữ ký của quizCheck (ans cũ vẫn chấm được khi không có chữ ký và đang ở máy chủ)
      let wrong,ok;if(Array.isArray(op.wrong)){wrong=op.wrong.map(i=>Math.floor(i)).filter(i=>i>=0&&i<Q.qs.length);if(API._sign&&API._sign(quizKey(API._sid,bo,wrong))!==String(op.sig||''))throw Error('QUIZ_SIG');ok=Q.qs.length-wrong.length;}
      else{const ans=Array.isArray(op.ans)?op.ans.map(x=>String(x||'').toUpperCase()):[];ok=0;wrong=[];Q.qs.forEach((q,i)=>{if(ans[i]===q.ans)ok++;else wrong.push(i);});}
      const pass=wrong.length<=num(CFG.quiz_sai_toi_da,1);
      if(!pass){z.fail++;const r={ok,total:Q.qs.length,wrong,pass:false,fail:z.fail};if(z.fail>=num(CFG.quiz_lan_thu,2)&&!z.hunt){startHunt();r.hunt=z.hunt;}return r;}
      const k=z.reveal?num(CFG.quiz_thuong_lo,50)/100:1,rubies=Math.round(Q.rubies*k),exp=Math.round(num(CFG.quiz_kinh_nghiem,300)*Math.max(1,idx+1)*k);
      s.rubies+=rubies;const up=gainExp(s,exp);z.done=1;z.hunt=null;return {ok,total:Q.qs.length,wrong,pass:true,rubies,exp,up,late:z.reveal};}
    if(t==='fuse'){const mi=Math.floor(op.m),xi=Math.floor(op.x);if(!(mi>=0&&mi<BAG_SIZE&&xi>=0&&xi<BAG_SIZE))throw Error('SLOT');return fuse(s,mi,xi,rng,op.luck);}
    if(t==='enh'){const bag=op.where==='bag',key=bag?Math.floor(op.key):String(op.key);if(!bag&&!slots.includes(key))throw Error('SLOT');const r=enhance(s,{where:bag?'bag':'equipment',key},rng,op.shop,op.luck);return {...r,item:bag?s.bag[key]:s.equipment[key]};}
    if(t==='enhSk'){const key=Math.floor(op.key);if(!(key>=0&&key<SKILL_SLOTS))throw Error('SLOT');const r=enhance(s,{where:'skill',key},rng,op.shop||'wizard',op.luck);return {...r,item:s.skillSlots[key]};}
    if(t==='qa'){questAccept(s,String(op.id));return {};}
    if(t==='qt'){return questTurnIn(s,String(op.id),rng);}
    if(t==='hire'){const m=hireNpc(s,String(op.id),rng,{k:op.k,day:op.day},now);return {mid:m.mid,name:m.name,lv:m.lv};}
    if(t==='petOff'){const i=(s.pets||[]).findIndex(x=>x.pid===op.pid);if(i<0)throw Error('PET');const x=s.pets.splice(i,1)[0];return {type:x.type};}
    if(t==='pt'){spendPoints(s,String(op.k),op.n);return {k:op.k,points:s.points};}
    if(t==='dismiss'){const i=Math.floor(op.i),m=s.mercs[i];dismissMerc(s,i);return {name:m?m.name:''};}
    // v10.14: đơn chiêu mộ — gửi (tốn hồng ngọc, rút phẩm cấp), nhận lính đang chào, hoặc bỏ qua
    if(t==='recruit'){return {offer:recruit(s,op.map,rng,now),rubies:s.rubies};}
    if(t==='recruitHire'){const m=recruitHire(s,rng);return {mid:m.mid,name:m.name,lv:m.lv,tier:m.tier};}
    if(t==='recruitDrop'){s.recruit=null;return {};}
    throw Error('LENH');
  }
  load(typeof GAME_DATA!=='undefined'?GAME_DATA:{});
  const API={VERSION,BAG_SIZE,SKILL_SLOTS,MAX_LV,MAX_MERC,TIERS,TIER_NAME,tierMul,killCopper,killExp,mercDefMul,petDmgMul,mountPow,mercCost,mercPow,mercGainExp,TUONG,recruitRoll,MAX_ACTIVE_QUEST,ELEMENTS,BEASTS,GROUPS,FX_NAMES,STAT_KEYS,CFG,RAR,ADD,SHOPS,SETS,MON,QUESTS,MERCS,AVATARS,TOPUPS,QUIZ,NAME_FX,items,slots,skills,shopEnh,shopRow,fuse,mercDaily,mercOffers,dayOf,EVENTS,
    layout,relayout,load,info,kind,weapon,skillCost,cmdInfo,WEAPONS,PREDICT,seqRng,setFollow,fitFollow,mercCmd,mercGuard,isGen,petMax,PET_CAP,mountNeed,tameMin,bookFx,bookBac,demonOf,shopRuby,SHOP_ENH,expNeed,maxLevel,gainExp,spendPoints,mountGain,bookStat,mountCmd,qOf,rar,nameOf,stat,canEnhance,tradeable,gainOf,enhRate,enhCost,enhance,roll,rollDrop,create,derive,targets,equip,unequip,stance,isTwo,pairOk,setSkill,unsetSkill,toggleBook,element,money,shopPrice,buy,sell,sellPrice,addItem,cast,
    aimAcc,isRanged,REGIONS,MON_REGION,SKILLS,mapLevel,regionLv,regionOf,questLevel,storyAt,storyNext,quizKey,questAccept,questProgress,questTurnIn,hireNpc,addMerc,mercEquip,mercUnequip,dismissMerc,makeMerc,cleanItem,serialize,restore,restorePlayer,merge,applyOp,allItems};
  return API;
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
    if(['sword','spear','staff','saber','mace'].includes(k))t=`128×128, ${WEBP}. Vũ khí vẽ chéo 45°: tay cầm ở góc dưới trái (14% từ trái, 86% từ trên), mũi hướng góc trên phải — game đặt đúng điểm này vào tay nhân vật.`;
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
