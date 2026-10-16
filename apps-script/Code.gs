/* ================= LỮ HÀNH · APPS SCRIPT (Code.gs) =================
   Cách dùng:
   1. Vào script.google.com → Dự án mới → dán toàn bộ file này vào Code.gs → Lưu.
   2. Chọn hàm caiDat → Chạy (một lần). Google sẽ hỏi quyền đọc/ghi Sheet và gửi email: đồng ý.
      Hàm này đổ dữ liệu mặc định vào các file Sheet còn trống trong thư mục "Lữ Hành · Dữ liệu game" và tạo bảng người chơi.
      Lưu ý: dùng đúng tài khoản Google đang sở hữu thư mục đó.
   3. Triển khai → Tùy chọn triển khai mới → Loại: Ứng dụng web → Thực thi với tư cách: Tôi → Ai có quyền truy cập: Bất kỳ ai → Triển khai.
   4. Sao chép URL ứng dụng web (đuôi /exec), dán vào dòng const LH_API='' trong code game trên Blogspot.
   Sửa số liệu trong các file Sheet xong, chạy hàm xoaBoNhoDem để game nhận ngay (nếu không, tối đa 10 phút).
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
 "nguoi_choi": "1L6Qwt5u_F4ZeaBSA7zXEugVK8htDX4AOv1IxBpXxsPg"
};
// Tab dữ liệu tĩnh → file Sheet chứa nó
const LH_STATIC={cau_hinh:'cau_hinh',gia_cuong:'cau_hinh',pham_chat:'pham_chat',thuoc_tinh:'pham_chat',vat_pham:'vat_pham',cua_hang:'cua_hang',bo_huyen_thoai:'bo_huyen_thoai',do_than:'do_than',quai:'quai',nhiem_vu:'nhiem_vu',linh:'linh'};
// Cột của các bảng người chơi (file "LH · Người chơi")
const LH_COLS={
  tai_khoan:['id','username','email','muoi','mat_khau','tao_luc','token','token_het_han','ma_khoi_phuc','ma_het_han'],
  nhan_vat:['id','tai_khoan','ten','ten_khoa','gioi_tinh','suc_manh','nhanh_nhen','suc_khoe','tri_tue','trang_thai','gia_danh_thue','nguoi_mua','luu','tao_luc','cap_nhat'],
  cho:['id','loai','nguoi_ban','nhan_vat_ban','ten_nguoi_ban','vat_pham','gia','tien_nhan','trang_thai','nguoi_mua','tao_luc','ban_luc','da_nhan']
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
    const ss=books[file]||(books[file]=SpreadsheetApp.openById(LH_SHEETS[file]));
    const sh=ss.getSheetByName(tab);if(!sh||sh.getLastRow()<2){out[tab]=LH_DEFAULT[tab]||[];continue;}out[tab]=sh?lhRows_(sh).filter(r=>Object.keys(r).some(k=>k!=='_r'&&r[k]!=='')).map(r=>{delete r._r;return r;}):[];
  }
  const s=JSON.stringify(out);if(s.length<95000)cache.put('lh-data',s,600);
  return out;
}
const LH_DB=(()=>{
  let ss=null;const cache={};
  const book=()=>ss||(ss=SpreadsheetApp.openById(LH_SHEETS.nguoi_choi));
  function sheet(t){let sh=book().getSheetByName(t);if(!sh){sh=book().insertSheet(t);sh.getRange(1,1,1,LH_COLS[t].length).setValues([LH_COLS[t]]);sh.setFrozenRows(1);sh.getRange('A:Z').setNumberFormat('@');}return sh;}
  const row=(t,o)=>LH_COLS[t].map(k=>o[k]===undefined||o[k]===null?'':String(o[k]));
  return {
    rows(t){if(!cache[t])cache[t]=lhRows_(sheet(t),LH_COLS[t]).map(o=>{for(const k of LH_COLS[t])o[k]=String(o[k]);return o;}).filter(o=>o.id);return cache[t];},
    insert(t,o){const sh=sheet(t);sh.appendRow(row(t,o));o._r=sh.getLastRow();if(cache[t])cache[t].push(o);},
    update(t,o){const sh=sheet(t);if(!o._r){const f=this.rows(t).find(x=>x.id===o.id);if(!f)throw Error('KHONG_THAY_DONG');o._r=f._r;}sh.getRange(o._r,1,1,LH_COLS[t].length).setValues([row(t,o)]);}
  };
})();
const LH=LH_Core({
  rows:t=>LH_DB.rows(t),insert:(t,o)=>LH_DB.insert(t,o),update:(t,o)=>LH_DB.update(t,o),
  mail:(to,subject,body)=>MailApp.sendEmail(to,subject,body),
  hash:s=>Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8).map(b=>((b+256)%256).toString(16).padStart(2,'0')).join(''),
  now:()=>Date.now(),uid:()=>Utilities.getUuid().replace(/-/g,'').slice(0,12),staticData:lhStatic_,
  lock:fn=>{const l=LockService.getScriptLock();l.waitLock(15000);try{return fn();}finally{l.releaseLock();}}
});
function doPost(e){
  let p={};try{p=JSON.parse(e.postData.contents);}catch(err){}
  return ContentService.createTextOutput(JSON.stringify(LH.handle(p.action,p))).setMimeType(ContentService.MimeType.JSON);
}
function doGet(){return ContentService.createTextOutput(JSON.stringify(LH.handle('ping',{}))).setMimeType(ContentService.MimeType.JSON);}
function xoaBoNhoDem(){CacheService.getScriptCache().remove('lh-data');}
// Đổ dữ liệu mặc định vào các tab còn trống, tạo bảng người chơi (chạy một lần sau khi dán code)
function caiDat(){
  for(const [tab,file] of Object.entries(LH_STATIC)){
    const ss=SpreadsheetApp.openById(LH_SHEETS[file]);let sh=ss.getSheetByName(tab);
    if(!sh){const first=ss.getSheets()[0];if(ss.getSheets().length===1&&first.getLastRow()===0&&!Object.keys(LH_STATIC).includes(first.getName())){sh=first.setName(tab);}else sh=ss.insertSheet(tab);}
    if(sh.getLastRow()>1)continue;
    const rows=LH_DEFAULT[tab]||[];if(!rows.length)continue;const h=Object.keys(rows[0]);
    sh.clear();sh.getRange(1,1,rows.length+1,h.length).setValues([h,...rows.map(r=>h.map(k=>r[k]===undefined||r[k]===null?'':r[k]))]);
    sh.setFrozenRows(1);sh.getRange(1,1,1,h.length).setFontWeight('bold').setBackground('#2b4d38').setFontColor('#ffffff');sh.autoResizeColumns(1,h.length);
  }
  const db=SpreadsheetApp.openById(LH_SHEETS.nguoi_choi);
  for(const t of Object.keys(LH_COLS)){LH_DB.rows(t);const sh=db.getSheetByName(t);sh.getRange('A:Z').setNumberFormat('@');sh.getRange(1,1,1,LH_COLS[t].length).setFontWeight('bold').setBackground('#2b4d38').setFontColor('#ffffff');}
  const first=db.getSheets().find(x=>!LH_COLS[x.getName()]);if(first&&first.getLastRow()===0&&db.getSheets().length>1)db.deleteSheet(first);
  kiemTra();
}
function kiemTra(){xoaBoNhoDem();const d=lhStatic_();Logger.log(Object.keys(d).map(k=>k+': '+d[k].length+' dòng').join('\n'));LH_DB.rows('tai_khoan');LH_DB.rows('nhan_vat');LH_DB.rows('cho');Logger.log('Bảng người chơi sẵn sàng. Quyền gửi mail: '+MailApp.getRemainingDailyQuota()+' thư/ngày');}

// Dữ liệu mặc định (dùng khi tab Sheet còn trống và để chạy caiDat)
const LH_DEFAULT=(d=>Object.fromEntries(Object.entries(d).map(([k,[h,...rows]])=>[k,rows.map(r=>Object.fromEntries(h.map((c,i)=>[c,r[i]])))])))({"cau_hinh":[["khoa","gia_tri","ghi_chu"],["diem_khoi_tao",50,"Tổng điểm chia cho Sức mạnh, Nhanh nhẹn, Sức khỏe, Trí tuệ khi tạo nhân vật"],["menh_lenh_goc",10,"Mệnh lệnh ban đầu của mọi nhân vật"],["so_nhan_vat_toi_da",5,"Số nhân vật tối đa của một tài khoản"],["tien_thu_nghiem",9999999,"Tiền (đồng) cho nhân vật mới: 999 vàng 99 bạc 99 đồng. 100 đồng = 1 bạc, 100 bạc = 1 vàng"],["hong_ngoc_thu_nghiem",999,"Hồng ngọc cho nhân vật mới"],["ti_le_ban_lai",40,"% giá gốc nhận lại khi bán cho cửa hàng"],["he_so_gia_do_dep",250,"Giá đồ Đẹp trong cửa hàng = % này của giá gốc"],["phi_cho",5,"% thương nhân giữ lại khi bán hộ trên chợ và khi bán nhân vật đánh thuê"],["mau_goc",60,"Máu = mau_goc + Sức khỏe × mau_moi_diem"],["mau_moi_diem",5,""],["mana_goc",40,"Mana = mana_goc + Trí tuệ × mana_moi_diem"],["mana_moi_diem",4,""],["hoa_sat_thuong",25,"Sách Hỏa: % sát thương"],["thuy_hoi_mana",3,"Sách Thủy: mana mỗi giây"],["tho_phan_don",30,"Sách Thổ: % phản đòn"],["kim_giam_sat_thuong",25,"Sách Kim: % giảm sát thương"],["moc_hoi_mau",2,"Sách Mộc: máu mỗi giây"],["vung_an_toan_x",27,"Ô bản đồ từ cột 0 đến cột này là vùng an toàn (làng)"],["bo_cong_vu_khi",16,"Đồ bộ huyền thoại: công vũ khí gốc"],["bo_thu_khien",10,"Đồ bộ: thủ của khiên"],["bo_thu_ao",12,"Đồ bộ: thủ của áo giáp"],["bo_thu_nho",6,"Đồ bộ: thủ của mũ, quần, găng, giày, cánh"],["bo_toc_thu_cuoi",155,"Đồ bộ: tốc độ thú cưỡi (% tốc đi bộ)"],["gia_do_bo",5000,"Giá gốc món đồ bộ (để tính giá bán lại)"],["gieng_hoi_giay",300,"Giếng cổ: số giây để nước đầy lại sau khi dùng"]],"gia_cuong":[["cap","ti_le","phi_hong_ngoc","that_bai_tu","that_bai_den"],[0,100,1,"",""],[1,100,2,"",""],[2,100,3,"",""],[3,100,4,"",""],[4,100,5,"",""],[5,100,6,"",""],[6,50,7,0,6],[7,50,8,0,6],[8,50,9,0,6],[9,50,10,0,6],[10,25,11,6,6],[11,20,12,6,6],[12,15,13,6,6],[13,10,14,6,6],[14,5,15,6,6]],"pham_chat":[["ma","ten","mau","he_so","so_dong","bac","giao_dich","mua_duoc"],["n","Thường","#e8e6df",100,0,0,"khong","co"],["g","Đẹp","#ffd54a",110,1,1,"khong","co"],["p","Hoàn hảo","#5aa9ff",125,2,2,"co","khong"],["l","Huyền thoại","#c8823e",150,3,3,"khong","khong"],["m","Thần","#ff6fb5",200,4,4,"co","khong"]],"thuoc_tinh":[["ma","ten","nhom","don_vi","dep_thap","dep_cao","hoan_hao_thap","hoan_hao_cao","huyen_thoai_thap","huyen_thoai_cao","than_thap","than_cao"],["str","Sức mạnh","str","",1,2,2,4,4,7,8,12],["agi","Nhanh nhẹn","agi","",1,2,2,4,4,7,8,12],["vit","Sức khỏe","vit","",1,2,2,4,4,7,8,12],["int","Trí tuệ","int","",1,2,2,4,4,7,8,12],["cmd","Mệnh lệnh","cmd","",1,1,1,2,2,4,4,6],["dmgMax","Sát thương cao nhất","str","",1,3,3,6,6,10,12,20],["dmgMin","Sát thương nhỏ nhất","str","",1,2,2,4,4,7,8,14],["acc","Sát thương chính xác","str","%",1,2,2,4,4,7,8,12],["crit2","Tỉ lệ sát thương x2","str","%",1,2,2,4,4,6,7,10],["crit3","Tỉ lệ sát thương x3","str","%",1,1,1,2,2,3,3,5],["trueDmg","Sát thương chuẩn","str","",1,2,2,5,5,9,10,18],["perfDmg","Sát thương hoàn hảo","str","%",1,1,1,3,3,5,5,8],["legDmg","Sát thương huyền thoại","str","%",1,1,1,2,2,4,4,6],["mythDmg","Sát thương thần thoại","str","%",1,1,1,1,1,2,3,5],["atkSpd","Tốc độ đánh","agi","%",1,3,3,6,6,10,10,15],["moveSpd","Tốc độ di chuyển","agi","%",1,2,2,4,4,7,8,12],["def","Khả năng phòng ngự","agi","",1,2,2,4,4,7,8,14],["block","Phòng ngự thành công","agi","%",1,2,2,4,4,6,7,10],["dodge","Tránh né","agi","%",1,2,2,3,3,5,6,9],["dmgRed","Giảm sát thương","agi","%",1,2,2,4,4,6,7,10],["perfRed","Giảm sát thương hoàn hảo","agi","%",1,2,2,4,4,6,7,10],["critRed","Giảm sát thương x2, x3","agi","%",1,2,2,4,4,6,7,10],["legRed","Giảm sát thương huyền thoại","agi","%",1,2,2,4,4,6,7,10],["mythRed","Giảm sát thương thần thoại","agi","%",1,2,2,3,3,5,5,8],["hp","Lượng máu","vit","",5,10,10,20,20,40,50,80],["hpReg","Hồi máu mỗi giây","vit","",1,1,1,2,2,3,3,5],["reflect","Phản đòn","vit","%",1,2,2,4,4,7,8,12],["mp","Lượng mana","int","",4,8,8,16,16,30,40,60],["mpReg","Hồi mana mỗi giây","int","",1,1,1,2,2,3,3,5],["cdr","Giảm thời gian hồi chiêu","int","%",1,2,2,4,4,6,7,10]],"vat_pham":[["id","ten","o","loai","cam","cong","thu","toc","gia","mau","thu_cuoi","menh_lenh","he"],["sword","Kiếm tập","hand","sword","one",2,0,0,40,"","",0,""],["sword-iron","Kiếm sắt","hand","sword","one",6,0,0,150,"#d5dde2","",0,""],["sword-steel","Kiếm thép","hand","sword","one",11,0,0,480,"#a8dcf0","",0,""],["shield","Khiên tập","hand","shield","one",0,2,0,40,"","",0,""],["shield-wood","Khiên mây","hand","shield","one",0,4,0,120,"#a8864a","",0,""],["shield-iron","Khiên đồng","hand","shield","one",0,8,0,420,"#b08a4a","",0,""],["staff","Gậy tập","hand","staff","one",2,0,0,40,"","",0,""],["staff-jade","Gậy ngọc","hand","staff","one",8,0,0,360,"#7fe0b0","",0,""],["bow","Cung tập","hand","bow","two",3,0,0,50,"","",0,""],["bow-hunt","Cung săn","hand","bow","two",9,0,0,380,"#9a6430","",0,""],["spear","Giáo tập","hand","spear","two",3,0,0,50,"","",0,""],["spear-iron","Giáo sắt","hand","spear","two",10,0,0,400,"#d5dde2","",0,""],["crossbow","Nỏ tập","hand","crossbow","two",4,0,0,60,"","",0,""],["crossbow-war","Nỏ chiến","hand","crossbow","two",13,0,0,560,"#4a3524","",0,""],["hat","Nón lá","hat","hat","",0,1,0,30,"","",0,""],["hat-iron","Nón dấu","hat","hat","",0,3,0,180,"#6b4a2e","",0,""],["armor","Áo vải","armor","armor","",0,2,0,60,"","",0,""],["armor-leather","Áo da","armor","armor","",0,4,0,200,"#8a5a34","",0,""],["armor-iron","Giáp đồng","armor","armor","",0,8,0,600,"#a07a40","",0,""],["pants","Quần vải","pants","pants","",0,1,0,30,"","",0,""],["pants-guard","Quần giáp","pants","pants","",0,3,0,180,"#5d4a34","",0,""],["gloves","Bao tay","gloves","gloves","",0,1,0,30,"","",0,""],["gloves-leather","Bao tay da","gloves","gloves","",0,2,0,120,"#6b4a2e","",0,""],["shoes","Dép cỏ","shoes","shoes","",0,1,0,30,"","",0,""],["shoes-leather","Giày da","shoes","shoes","",0,2,0,120,"#5b3d26","",0,""],["shoes-iron","Ủng đồng","shoes","shoes","",0,4,0,300,"#8a6a3a","",0,""],["wings","Áo choàng","wings","wings","",0,1,0,900,"","",0,""],["mount","Ngựa con","mount","mount","",0,0,115,200,"#b78452","horse",5,""],["mount-brown","Ngựa nâu","mount","mount","",0,0,125,600,"#7a4b2a","horse",5,""],["mount-black","Ngựa ô","mount","mount","",0,0,135,1200,"#2e2a2a","horse",5,""],["mount-white","Bạch mã","mount","mount","",0,0,150,2500,"#ece6da","horse",5,""],["mount-tiger","Hổ","mount","mount","",4,0,145,4000,"#e08a2e","tiger",10,""],["mount-elephant","Voi","mount","mount","",0,8,120,6000,"#8e9398","elephant",15,""],["ore","Khoáng thạch","","ore","",0,0,0,20,"","",0,""],["book-fire","Sách Hỏa","book","book","",0,0,0,400,"","",0,"fire"],["book-water","Sách Thủy","book","book","",0,0,0,300,"","",0,"water"],["book-earth","Sách Thổ","book","book","",0,0,0,450,"","",0,"earth"],["book-metal","Sách Kim","book","book","",0,0,0,450,"","",0,"metal"],["book-wood","Sách Mộc","book","book","",0,0,0,300,"","",0,"wood"]],"cua_hang":[["cua_hang","id","pham_chat","gia","thu_tu"],["smith","sword-iron","n,g","",1],["smith","sword-steel","n,g","",2],["smith","shield-wood","n,g","",3],["smith","shield-iron","n,g","",4],["smith","staff-jade","n,g","",5],["smith","bow-hunt","n,g","",6],["smith","spear-iron","n,g","",7],["smith","crossbow-war","n,g","",8],["smith","hat-iron","n,g","",9],["smith","armor-leather","n,g","",10],["smith","armor-iron","n,g","",11],["smith","pants-guard","n,g","",12],["smith","gloves-leather","n,g","",13],["smith","shoes-leather","n,g","",14],["smith","shoes-iron","n,g","",15],["trainer","mount","n","",1],["trainer","mount-brown","n","",2],["trainer","mount-black","n","",3],["trainer","mount-white","n","",4],["trainer","mount-tiger","n","",5],["trainer","mount-elephant","n","",6],["wizard","book-fire","n","",1],["wizard","book-water","n","",2],["wizard","book-earth","n","",3],["wizard","book-metal","n","",4],["wizard","book-wood","n","",5]],"bo_huyen_thoai":[["id","nhan_vat","gioi_tinh","ten_bo","vu_khi_loai","vu_khi","tay_trai_loai","tay_trai","mu","ao","quan","gang","giay","canh","thu_cuoi","thu_cuoi_loai","moc_3","moc_5","moc_7","hieu_ung_9","gia_tri_9","mo_ta_9"],["ngo-quyen","Ngô Quyền","m","Bạch Đằng","sword","Kiếm Bạch Đằng","shield","Khiên cọc gỗ lim","Mũ trụ Đường Lâm","Giáp Bạch Đằng","Quần trận Bạch Đằng","Bao tay chèo lái","Hài thủy chiến","Cờ hiệu Tiền Ngô","Chiến mã Đường Lâm","horse","def:6,hp:30","reflect:8,dmgRed:4","str:8,crit2:4","stun",15,"Cọc Bạch Đằng: đòn đánh có 15% làm quái choáng 1 giây"],["dinh-bo-linh","Đinh Bộ Lĩnh","m","Cờ Lau","sword","Kiếm Hoa Lư","sword","Đoản kiếm Hoa Lư","Mũ Vạn Thắng","Long bào Đại Cồ Việt","Quần cờ lau","Bao tay Vạn Thắng","Hài Hoa Lư","Cờ lau tập trận","Ngựa Vạn Thắng","horse","cmd:3,hp:30","atkSpd:8,crit2:3","str:6,agi:6","execute",12,"Dẹp loạn 12 sứ quân: kết liễu quái thường còn dưới 12% máu"],["le-hoan","Lê Hoàn","m","Đại Hành","sword","Kiếm Thập đạo","shield","Khiên Chi Lăng","Mũ Thập đạo tướng quân","Giáp Lê Đại Hành","Quần trận Chi Lăng","Bao tay Đại Hành","Hài phá Tống","Cờ Đại Hành","Voi chiến Đại Hành","elephant","def:5,block:3","hp:60,dmgRed:4","str:6,trueDmg:8","shield",20,"Chi Lăng: mỗi 10 giây nhận lá chắn bằng 20% máu tối đa"],["ly-thuong-kiet","Lý Thường Kiệt","m","Như Nguyệt","sword","Kiếm Như Nguyệt","shield","Khiên sông Cầu","Mũ Thái úy","Giáp Như Nguyệt","Quần Thái úy","Bao tay Nam quốc","Hài sông Cầu","Cờ Nam quốc sơn hà","Chiến mã Ung Châu","horse","int:5,mp:20","cdr:6,crit2:3","str:6,dmgMax:8","wave",60,"Nam quốc sơn hà: mỗi đòn thứ 4 tung sóng chém 60% sát thương"],["tran-hung-dao","Trần Hưng Đạo","m","Hưng Đạo","sword","Kiếm Hưng Đạo Vương","shield","Khiên Vạn Kiếp","Mũ Quốc công","Giáp Hưng Đạo","Quần Vạn Kiếp","Bao tay Hịch tướng sĩ","Hài Bạch Đằng","Cờ Tiết chế","Chiến mã Vạn Kiếp","horse","cmd:4,hp:30","str:5,crit3:2","dmgRed:6,reflect:6","aura",30,"Hịch tướng sĩ: bản thân và lính đánh thuê +30% sát thương"],["tran-quoc-toan","Trần Quốc Toản","m","Phá Cường Địch","sword","Kiếm Hoài Văn Hầu","sword","Đoản kiếm Hoài Văn","Mũ Hoài Văn Hầu","Giáp thiếu niên","Quần Hoài Văn","Bao tay bóp cam","Hài thiếu niên","Cờ Phá cường địch","Ngựa Hoài Văn","horse","agi:5,atkSpd:5","crit2:4,moveSpd:4","str:6,perfDmg:3","cleave",40,"Phá cường địch: đòn thường lan 40% sát thương sang quái gần"],["nguyen-trai","Nguyễn Trãi","m","Bình Ngô","staff","Bút Bình Ngô","staff","Gậy trúc Côn Sơn","Khăn Ức Trai","Áo Côn Sơn","Quần Ức Trai","Bao tay Quân trung từ mệnh","Hài Côn Sơn","Áo choàng Bình Ngô","Ngựa mưu sĩ Lam Sơn","horse","int:6,mp:30","mpReg:3,cdr:6","int:8,crit2:3","manaShield",30,"Bình Ngô đại cáo: 30% sát thương nhận vào trừ vào mana"],["le-loi","Lê Lợi","m","Lam Sơn","sword","Kiếm Lam Sơn","shield","Khiên Lam Sơn","Mũ Bình Định Vương","Giáp Lam Sơn","Quần Lam Sơn","Bao tay Lũng Nhai","Hài Chí Linh","Cờ Bình Định","Voi chiến Lam Sơn","elephant","vit:5,hp:40","def:6,hpReg:2","str:6,crit2:3","lifesteal",8,"Hội thề Lũng Nhai: hút 8% sát thương gây ra thành máu"],["quang-trung","Quang Trung","m","Tây Sơn","sword","Kiếm Tây Sơn","sword","Đoản kiếm Đống Đa","Mũ Quang Trung","Áo bào Tây Sơn","Quần Ngọc Hồi","Bao tay Đống Đa","Hài thần tốc","Cờ đào Tây Sơn","Voi chiến Ngọc Hồi","elephant","moveSpd:6,atkSpd:5","str:6,crit2:4","crit3:3,dmgMax:10","haste",40,"Thần tốc: hạ quái tăng 40% tốc đánh và tốc chạy trong 4 giây"],["trung-trac","Trưng Trắc","f","Mê Linh","sword","Kiếm Mê Linh","shield","Khiên Hát Môn","Mũ Trưng Vương","Giáp Mê Linh","Váy trận Hát Môn","Bao tay Trưng Vương","Hài Mê Linh","Cờ Trưng Vương","Voi chiến Mê Linh","elephant","cmd:3,hp:30","str:5,def:5","crit2:4,dmgRed:5","burn",30,"Lửa Mê Linh: đòn đánh gây bỏng thêm 30% sát thương trong 3 giây"],["trung-nhi","Trưng Nhị","f","Hát Giang","sword","Kiếm Trưng Nhị","sword","Đoản kiếm Hát Giang","Mũ Trưng Nhị","Giáp Hát Giang","Váy trận Trưng Nhị","Bao tay Hát Giang","Hài Hát Giang","Cờ Hát Giang","Voi chiến Hát Giang","elephant","agi:5,dodge:3","atkSpd:6,crit2:3","str:6,dodge:4","counter",100,"Song kiếm: sau khi né, đòn kế tiếp gây gấp đôi"],["trieu-thi-trinh","Bà Triệu","f","Núi Nưa","sword","Gươm Núi Nưa","sword","Gươm Bồ Điền","Trâm Nhụy Kiều","Giáp vàng Nhụy Kiều","Váy trận Núi Nưa","Bao tay Bồ Điền","Guốc ngà Bà Triệu","Cờ Nhụy Kiều tướng quân","Voi một ngà","elephant","str:5,hp:30","crit2:4,atkSpd:5","str:7,dmgMax:8","wave",50,"Cưỡi gió đạp sóng: mỗi đòn thứ 4 tung sóng 50% sát thương"],["le-chan","Lê Chân","f","An Biên","sword","Kiếm An Biên","shield","Khiên Hải tần","Mũ nữ tướng An Biên","Giáp thủy quân","Váy trận An Biên","Bao tay chài lưới","Hài Hải Phòng","Cờ An Biên","Ngựa An Biên","horse","def:5,hp:30","block:4,dmgRed:4","vit:6,reflect:5","shield",18,"Thành An Biên: mỗi 10 giây nhận lá chắn bằng 18% máu tối đa"],["phung-thi-chinh","Phùng Thị Chính","f","Lãng Bạc","sword","Kiếm Lãng Bạc","shield","Khiên Phùng nữ tướng","Mũ Phùng nữ tướng","Giáp Lãng Bạc","Váy trận Lãng Bạc","Bao tay Lãng Bạc","Hài Lãng Bạc","Cờ nữ tướng Lãng Bạc","Ngựa Lãng Bạc","horse","vit:5,hpReg:1","hp:60,def:4","str:5,reflect:6","heal",2,"Trận Lãng Bạc: hồi 2% máu tối đa mỗi giây"],["vu-thi-thuc","Bát Nàn","f","Tiên La","sword","Kiếm Tiên La","shield","Khiên Bát Nàn","Mũ Bát Nàn công chúa","Giáp Tiên La","Váy trận Bát Nàn","Bao tay Tiên La","Hài Tiên La","Cờ Bát Nàn","Ngựa Tiên La","horse","str:4,hp:30","crit2:3,trueDmg:5","str:6,atkSpd:6","lifesteal",6,"Bát Nàn: hút 6% sát thương gây ra thành máu"],["duong-van-nga","Dương Vân Nga","f","Hoa Lư","staff","Trượng Thái hậu","staff","Gậy ngọc Hoa Lư","Mũ phượng Dương Vân Nga","Áo phượng Hoa Lư","Xiêm y Thái hậu","Bao tay ngọc Hoa Lư","Hài phượng","Áo choàng Thái hậu","Kiệu ngựa Hoa Lư","horse","int:5,mp:30","mpReg:2,cdr:5","int:7,hp:40","revive",50,"Trao áo long cổn: hồi sinh tại chỗ một lần mỗi 5 phút với 50% máu"],["y-lan","Ỷ Lan","f","Thổ Lỗi","staff","Trượng Nhiếp chính","shield","Khiên Thổ Lỗi","Mũ Nguyên phi","Áo Nguyên phi","Xiêm y Thổ Lỗi","Bao tay Nhiếp chính","Hài Thổ Lỗi","Áo choàng Ỷ Lan","Ngựa Thăng Long","horse","cmd:3,int:4","cdr:5,mp:30","int:6,dmgRed:5","aura",20,"Nhiếp chính: bản thân và lính đánh thuê +20% sát thương"],["bui-thi-xuan","Bùi Thị Xuân","f","Tây Sơn ngũ phụng","sword","Song kiếm Bùi Thị Xuân","sword","Đoản kiếm Tây Sơn","Mũ Đô đốc","Giáp Tây Sơn","Váy trận Tây Sơn","Bao tay luyện voi","Hài Tây Sơn","Cờ ngũ phụng","Voi chiến Bùi Thị Xuân","elephant","str:4,cmd:3","atkSpd:6,crit2:3","str:6,crit3:2","stun",12,"Thuần voi: đòn đánh có 12% làm quái choáng 1 giây"]],"do_than":[["id","ten","o","loai","cam","cong","thu","toc","thu_cuoi","mau","hieu_ung","gia_tri","mo_ta","gia"],["than-roi-sat","Roi sắt Thánh Gióng","hand","sword","one",40,0,0,"","#3c3f44","wave",80,"Mỗi đòn thứ 4 tung sóng lửa 80% sát thương",20000],["than-ngua-sat","Ngựa sắt Thánh Gióng","mount","mount","",0,10,190,"horse","#4a4d52","burn",40,"Ngựa phun lửa: đòn đánh gây bỏng thêm 40% sát thương",20000],["than-giap-sat","Giáp sắt Thánh Gióng","armor","armor","",0,40,0,"","#5a5e64","shield",30,"Mỗi 10 giây nhận lá chắn bằng 30% máu tối đa",20000],["than-no-kim-quy","Nỏ thần Kim Quy","hand","crossbow","two",60,0,0,"","#c9a24a","execute",20,"Kết liễu quái thường còn dưới 20% máu",20000],["than-kiem-thuan-thien","Kiếm Thuận Thiên","hand","sword","one",45,0,0,"","#9ff0d0","lifesteal",12,"Hút 12% sát thương gây ra thành máu",20000],["than-gay-chu-dong-tu","Gậy thần Chử Đồng Tử","hand","staff","one",38,0,0,"","#e6d28a","heal",3,"Hồi 3% máu tối đa mỗi giây",20000],["than-non-chu-dong-tu","Nón thần Chử Đồng Tử","hat","hat","",0,20,0,"","#f0dc90","revive",60,"Hồi sinh tại chỗ một lần mỗi 5 phút với 60% máu",20000],["than-canh-au-co","Cánh tiên Âu Cơ","wings","wings","",0,18,0,"","#ffd1ec","haste",50,"Hạ quái tăng 50% tốc đánh và tốc chạy trong 4 giây",20000],["than-khien-lac-long","Khiên vảy rồng Lạc Long Quân","hand","shield","one",0,35,0,"","#4fb3a8","stun",20,"Đòn đánh có 20% làm quái choáng 1 giây",20000],["than-giay-son-tinh","Giày mây Sơn Tinh","shoes","shoes","",0,16,0,"","#a8d08d","counter",150,"Sau khi né, đòn kế tiếp gây thêm 150%",20000],["than-gang-thuy-tinh","Bao tay sóng nước Thủy Tinh","gloves","gloves","",0,16,0,"","#5fb6ff","cleave",50,"Đòn thường lan 50% sát thương sang quái gần",20000]],"quai":[["id","ten","mau","sat_thuong","toc_do","toc_chay","ban_kinh","cao","tam_danh","tam_gan","hoi_chieu_ms","vung_tay_ms","dong","day_lui_phan_tram","boss","hoi_sinh_giay","dep_phan_van","hoan_hao_phan_van","huyen_thoai_phan_van","than_phan_van","hong_ngoc_it","hong_ngoc_nhieu","loai_sat_thuong","ti_le_x2"],["deer","Hươu",60,0,60,190,16,44,0,0,0,0,8,100,0,12,800,120,8,0,0,0,"thuong",0],["lion","Sư tử",150,11,70,165,18,40,240,50,1200,380,25,60,0,15,800,120,8,0,0,0,"thuong",5],["elephant","Voi rừng",420,20,45,95,28,72,0,72,1900,650,60,15,0,20,1000,150,10,0,0,0,"thuong",5],["croc","Cá sấu",190,15,35,150,20,20,150,58,1500,300,35,50,0,15,800,120,8,0,0,0,"thuong",5],["chua-son-lam","Chúa Sơn Lâm",2500,28,80,150,30,64,260,74,1400,500,300,10,1,120,6000,2500,400,0,3,10,"huyen_thoai",15],["ngu-tinh","Ngư Tinh",6000,40,40,110,40,80,280,120,2200,800,1000,5,2,300,8000,5000,1200,150,10,30,"than",20]],"nhiem_vu":[["id","ten","mo_ta","muc_tieu","so_luong","thuong_dong","thuong_hong_ngoc","thuong_do","pham_chat_do","lap_lai"],["q-huou","Săn hươu","Dân làng cần thịt hươu cho hội làng.","deer",5,200,0,"hat","g","co"],["q-su-tu","Trừ sư tử","Sư tử bên Đông Ngạn hay vồ người đi rừng.","lion",3,500,0,"sword-iron","n","co"],["q-ca-sau","Diệt cá sấu","Cá sấu rình ở bến sông, dân không dám lấy nước.","croc",3,500,0,"shoes-leather","g","co"],["q-voi","Đuổi voi rừng","Voi rừng phá nương rẫy phía đông.","elephant",2,800,0,"armor-leather","g","co"],["q-chua-son-lam","Hạ Chúa Sơn Lâm","Con hổ chúa ở rừng đông bắc đã giết nhiều thợ săn.","chua-son-lam",1,10000,10,"","","co"],["q-ngu-tinh","Trừ Ngư Tinh","Ngư Tinh nổi lên ở đầm phía đông nam, dâng nước hại dân.","ngu-tinh",1,30000,30,"","","co"]],"linh":[["id","ten","gioi_tinh","gia","menh_lenh","suc_manh","nhanh_nhen","suc_khoe","tri_tue","trang_bi","mo_ta"],["dan-binh","Dân binh","m",100,5,12,8,12,4,"spear,hat","Lính giáo rẻ, máu trâu"],["cung-thu","Nữ cung thủ","f",300,5,10,14,8,6,"bow,shoes","Bắn từ xa"],["vo-si","Võ sĩ","m",600,8,16,10,14,4,"sword,shield,armor","Kiếm khiên, chịu đòn tốt"],["dao-si","Đạo sĩ trẻ","m",800,6,6,8,10,20,"staff-jade,hat","Bắn cầu phép"],["nu-tuong","Nữ tướng","f",1200,10,18,14,14,6,"sword-iron,sword-iron,armor-leather","Song kiếm, đánh nhanh"]]});

/* ================= LÕI MÁY CHỦ (dùng chung cho Apps Script và chế độ ngoại tuyến) =================
   adapter cần có: rows(bang) · insert(bang,obj) · update(bang,obj) · mail(to,tieuDe,noiDung) · hash(chuoi) · now() · uid() · staticData() · lock(fn)
   Bảng: tai_khoan · nhan_vat · cho */
function LH_Core(A){
  const TOKEN_DAYS=30,RESET_MIN=15;
  const fail=e=>{throw Error(e);};
  const lower=s=>String(s||'').trim().toLowerCase();
  const cfg=k=>{const r=(A.staticData().cau_hinh||[]).find(x=>x.khoa===k);return r?Number(r.gia_tri):null;};
  const pub=a=>({id:a.id,username:a.username,email:a.email});
  function auth(token){
    const a=A.rows('tai_khoan').find(x=>x.token&&x.token===token);
    if(!a||Number(a.token_het_han)<A.now())fail('PHIEN_HET_HAN');
    return a;
  }
  function ownChar(a,id,status){
    const c=A.rows('nhan_vat').find(x=>x.id===id);
    if(!c||c.tai_khoan!==a.id)fail('KHONG_THAY_NHAN_VAT');
    if(status&&c.trang_thai!==status)fail('SAI_TRANG_THAI');
    return c;
  }
  const charView=c=>({id:c.id,name:c.ten,gender:c.gioi_tinh,stats:{strength:+c.suc_manh,agility:+c.nhanh_nhen,vitality:+c.suc_khoe,intelligence:+c.tri_tue},status:c.trang_thai,price:+c.gia_danh_thue||0,created:+c.tao_luc});
  function newToken(a){a.token=A.uid()+A.uid();a.token_het_han=A.now()+TOKEN_DAYS*864e5;A.update('tai_khoan',a);return a.token;}
  function pendingClaims(acc){return A.rows('cho').filter(r=>r.trang_thai==='da_ban'&&r.nguoi_ban===acc&&String(r.da_nhan)!=='1');}
  const H={
    ping:()=>({msg:'Lữ Hành API'}),
    data:()=>({data:A.staticData()}),
    register(p){
      const username=lower(p.username),email=lower(p.email),pw=String(p.password||'');
      if(!/^[a-z0-9_]{3,20}$/.test(username))fail('TEN_DANG_NHAP_SAI');
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))fail('EMAIL_SAI');
      if(pw.length<6)fail('MAT_KHAU_NGAN');
      return A.lock(()=>{
        const all=A.rows('tai_khoan');
        if(all.some(a=>a.username===username))fail('TEN_DANG_NHAP_DA_CO');
        if(all.some(a=>a.email===email))fail('EMAIL_DA_CO');
        const salt=A.uid(),a={id:'tk-'+A.uid(),username,email,muoi:salt,mat_khau:A.hash(salt+pw),tao_luc:A.now(),token:'',token_het_han:0,ma_khoi_phuc:'',ma_het_han:0};
        A.insert('tai_khoan',a);
        return {token:newToken(a),account:pub(a)};
      });
    },
    login(p){
      const key=lower(p.username),pw=String(p.password||'');
      const a=A.rows('tai_khoan').find(x=>x.username===key||x.email===key);
      if(!a||A.hash(a.muoi+pw)!==a.mat_khau)fail('SAI_DANG_NHAP');
      return {token:newToken(a),account:pub(a)};
    },
    logout(p){const a=auth(p.token);a.token='';a.token_het_han=0;A.update('tai_khoan',a);return {};},
    forgot(p){
      const email=lower(p.email),a=A.rows('tai_khoan').find(x=>x.email===email);
      if(!a)fail('KHONG_THAY_EMAIL');
      const code=String(100000+Math.floor(Math.random()*900000));
      a.ma_khoi_phuc=code;a.ma_het_han=A.now()+RESET_MIN*6e4;A.update('tai_khoan',a);
      A.mail(a.email,'Lữ Hành · Khôi phục tài khoản',`Tên đăng nhập của bạn: ${a.username}\nMã khôi phục: ${code}\nMã có hiệu lực ${RESET_MIN} phút.`);
      return {sent:true,devCode:A.devMail?code:undefined,username:A.devMail?a.username:undefined};
    },
    reset(p){
      const email=lower(p.email),a=A.rows('tai_khoan').find(x=>x.email===email);
      if(!a||!a.ma_khoi_phuc||String(a.ma_khoi_phuc)!==String(p.code).trim()||Number(a.ma_het_han)<A.now())fail('MA_SAI');
      if(String(p.password||'').length<6)fail('MAT_KHAU_NGAN');
      a.muoi=A.uid();a.mat_khau=A.hash(a.muoi+p.password);a.ma_khoi_phuc='';a.ma_het_han=0;
      return {token:newToken(a),account:pub(a)};
    },
    chars(p){
      const a=auth(p.token),list=A.rows('nhan_vat').filter(c=>c.tai_khoan===a.id&&(c.trang_thai==='active'||c.trang_thai==='merc')).map(charView);
      const claim=pendingClaims(a.id).reduce((s,r)=>s+Number(r.tien_nhan||0),0);
      return {account:pub(a),chars:list,max:cfg('so_nhan_vat_toi_da')||5,claim};
    },
    createChar(p){
      const a=auth(p.token),name=String(p.name||'').trim().replace(/\s+/g,' '),gender=p.gender==='f'?'f':'m',st=p.stats||{};
      if(name.length<2||name.length>16||!/^[\p{L}\p{N} ]+$/u.test(name))fail('TEN_NHAN_VAT_SAI');
      const keys=['strength','agility','vitality','intelligence'],vals=keys.map(k=>Number(st[k]));
      if(vals.some(v=>!Number.isInteger(v)||v<0))fail('DIEM_SAI');
      if(vals.reduce((s,v)=>s+v,0)!==(cfg('diem_khoi_tao')||50))fail('DIEM_SAI');
      return A.lock(()=>{
        const all=A.rows('nhan_vat'),max=cfg('so_nhan_vat_toi_da')||5;
        if(all.filter(c=>c.tai_khoan===a.id&&(c.trang_thai==='active'||c.trang_thai==='merc')).length>=max)fail('DU_NHAN_VAT');
        if(all.some(c=>c.ten_khoa===lower(name)&&c.trang_thai!=='deleted'))fail('TEN_DA_CO');
        const c={id:'nv-'+A.uid(),tai_khoan:a.id,ten:name,ten_khoa:lower(name),gioi_tinh:gender,suc_manh:vals[0],nhanh_nhen:vals[1],suc_khoe:vals[2],tri_tue:vals[3],trang_thai:'active',gia_danh_thue:0,nguoi_mua:'',luu:'',tao_luc:A.now(),cap_nhat:A.now()};
        A.insert('nhan_vat',c);return {char:charView(c)};
      });
    },
    load(p){const a=auth(p.token),c=ownChar(a,p.charId,'active');let save=null;try{save=c.luu?JSON.parse(c.luu):null;}catch(e){}return {char:charView(c),save};},
    save(p){
      const a=auth(p.token),c=ownChar(a,p.charId,'active'),s=JSON.stringify(p.save||{});
      if(s.length>45000)fail('DU_LIEU_QUA_LON');
      c.luu=s;c.cap_nhat=A.now();A.update('nhan_vat',c);return {savedAt:c.cap_nhat};
    },
    mercRegister(p){
      const a=auth(p.token),c=ownChar(a,p.charId,'active'),price=Math.floor(Number(p.price));
      if(!(price>=100))fail('GIA_SAI');
      c.trang_thai='merc';c.gia_danh_thue=price;c.cap_nhat=A.now();A.update('nhan_vat',c);return {char:charView(c)};
    },
    mercCancel(p){const a=auth(p.token),c=ownChar(a,p.charId,'merc');c.trang_thai='active';c.gia_danh_thue=0;A.update('nhan_vat',c);return {char:charView(c)};},
    mercList(p){
      const a=auth(p.token);
      return {list:A.rows('nhan_vat').filter(c=>c.trang_thai==='merc'&&c.tai_khoan!==a.id).map(c=>{let eq={};try{eq=(JSON.parse(c.luu||'{}').player||{}).equipment||{};}catch(e){}return {...charView(c),equipment:eq};})};
    },
    mercBuy(p){
      const a=auth(p.token);ownChar(a,p.charId,'active');
      return A.lock(()=>{
        const t=A.rows('nhan_vat').find(c=>c.id===p.targetId);
        if(!t||t.trang_thai!=='merc'||t.tai_khoan===a.id)fail('LINH_KHONG_CON');
        let eq={};try{eq=(JSON.parse(t.luu||'{}').player||{}).equipment||{};}catch(e){}
        t.trang_thai='sold';t.nguoi_mua=p.charId;t.cap_nhat=A.now();A.update('nhan_vat',t);
        const price=Number(t.gia_danh_thue),fee=(cfg('phi_cho')||0)/100;
        A.insert('cho',{id:'ch-'+A.uid(),loai:'linh',nguoi_ban:t.tai_khoan,nhan_vat_ban:t.id,vat_pham:'',gia:price,tien_nhan:Math.floor(price*(1-fee)),trang_thai:'da_ban',nguoi_mua:p.charId,tao_luc:A.now(),ban_luc:A.now(),da_nhan:0});
        return {merc:{name:t.ten,gender:t.gioi_tinh,stats:charView(t).stats,equipment:eq,src:'player',from:t.id},price};
      });
    },
    marketList(p){
      const a=auth(p.token),rows=A.rows('cho').filter(r=>r.loai==='do');
      const view=r=>({id:r.id,item:JSON.parse(r.vat_pham||'null'),price:Number(r.gia),mine:r.nguoi_ban===a.id,seller:r.ten_nguoi_ban||''});
      return {open:rows.filter(r=>r.trang_thai==='mo').map(view),claim:pendingClaims(a.id).reduce((s,r)=>s+Number(r.tien_nhan||0),0)};
    },
    marketSell(p){
      const a=auth(p.token),c=ownChar(a,p.charId,'active'),price=Math.floor(Number(p.price));
      if(!(price>=1))fail('GIA_SAI');if(!p.item||!p.item.type)fail('VAT_PHAM_SAI');
      const fee=(cfg('phi_cho')||0)/100,r={id:'ch-'+A.uid(),loai:'do',nguoi_ban:a.id,nhan_vat_ban:c.id,ten_nguoi_ban:c.ten,vat_pham:JSON.stringify(p.item),gia:price,tien_nhan:Math.floor(price*(1-fee)),trang_thai:'mo',nguoi_mua:'',tao_luc:A.now(),ban_luc:0,da_nhan:0};
      A.insert('cho',r);return {id:r.id};
    },
    marketCancel(p){
      const a=auth(p.token);
      return A.lock(()=>{const r=A.rows('cho').find(x=>x.id===p.id);if(!r||r.nguoi_ban!==a.id||r.trang_thai!=='mo')fail('KHONG_HUY_DUOC');r.trang_thai='huy';A.update('cho',r);return {item:JSON.parse(r.vat_pham)};});
    },
    marketBuy(p){
      const a=auth(p.token);ownChar(a,p.charId,'active');
      return A.lock(()=>{const r=A.rows('cho').find(x=>x.id===p.id);if(!r||r.trang_thai!=='mo')fail('DA_BAN');if(r.nguoi_ban===a.id)fail('DO_CUA_MINH');r.trang_thai='da_ban';r.nguoi_mua=p.charId;r.ban_luc=A.now();A.update('cho',r);return {item:JSON.parse(r.vat_pham),price:Number(r.gia)};});
    },
    claim(p){
      const a=auth(p.token);
      return A.lock(()=>{let sum=0;for(const r of pendingClaims(a.id)){sum+=Number(r.tien_nhan||0);r.da_nhan=1;A.update('cho',r);}return {amount:sum};});
    }
  };
  return {handle(action,p){try{if(!H[action])fail('KHONG_CO_LENH');return {ok:true,...H[action](p||{})};}catch(e){return {ok:false,error:String(e.message||e)};}}};
}
