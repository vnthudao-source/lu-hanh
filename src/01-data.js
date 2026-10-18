/* ================= DỮ LIỆU MẶC ĐỊNH (giống hệt các file Google Sheet; khi nối Apps Script sẽ lấy bản trên Sheet) ================= */
const GAME_DATA={
cau_hinh:[
 {khoa:'diem_khoi_tao',gia_tri:50,ghi_chu:'Tổng điểm chia cho Sức mạnh, Nhanh nhẹn, Sức khỏe, Trí tuệ khi tạo nhân vật'},
 {khoa:'menh_lenh_goc',gia_tri:10,ghi_chu:'Mệnh lệnh ban đầu của mọi nhân vật'},
 {khoa:'so_nhan_vat_toi_da',gia_tri:5,ghi_chu:'Số nhân vật tối đa của một tài khoản'},
 {khoa:'cung_chinh_xac',gia_tri:70,ghi_chu:'Cung: tỉ lệ bắn trúng (%) khi bật khóa mục tiêu, chưa gia cường'},
 {khoa:'no_chinh_xac',gia_tri:76,ghi_chu:'Nỏ: tỉ lệ bắn trúng (%) khi bật khóa mục tiêu, chưa gia cường'},
 {khoa:'chinh_xac_moi_cap',gia_tri:2,ghi_chu:'Mỗi cấp gia cường cung / nỏ cộng thêm bao nhiêu % chính xác (tối đa 100%)'},
 {khoa:'cung_no_x2',gia_tri:15,ghi_chu:'Cầm cung / nỏ: cộng thêm % tỉ lệ gây sát thương x2 (vũ khí khác không có)'},
 {khoa:'gioi_han_ha_quai',gia_tri:16,ghi_chu:'Hạ tối đa bao nhiêu con cùng một loài quái thường trong một lượt hồi sinh (chống gian lận; bãi quái lớn cần số lớn)'},
 {khoa:'nguoi_choi_ao',gia_tri:4,ghi_chu:'Số người chơi ảo đi săn ở mỗi bản đồ (0 = tắt)'},
 {khoa:'trum_ky_nang_giay',gia_tri:7,ghi_chu:'Trùm ra chiêu đặc biệt (cột ky_nang ở tab quai) cách nhau bao nhiêu giây'},
 {khoa:'dong_do_mac',gia_tri:'def,hp,dodge,reflect,hpReg,mp',ghi_chu:'Đồ mặc: các chỉ số có thể ra dòng ngẫu nhiên (mã ở tab thuoc_tinh, cách nhau dấu phẩy)'},
 {khoa:'cuong_hoa_5_mau',gia_tri:80,ghi_chu:'Mặc 5 món từ +9: cộng thêm máu'},
 {khoa:'cuong_hoa_bo_mau',gia_tri:150,ghi_chu:'Đủ 8 ô đồ từ +9: cộng thêm máu'},
 {khoa:'cuong_hoa_bo_sat_thuong',gia_tri:10,ghi_chu:'Đủ 8 ô đồ từ +9: cộng thêm % sát thương'},
 {khoa:'tien_thu_nghiem',gia_tri:9999999,ghi_chu:'Tiền (đồng) cho nhân vật mới: 999 vàng 99 bạc 99 đồng. 100 đồng = 1 bạc, 100 bạc = 1 vàng'},
 {khoa:'hong_ngoc_thu_nghiem',gia_tri:999,ghi_chu:'Hồng ngọc cho nhân vật mới'},
 {khoa:'ti_le_ban_lai',gia_tri:40,ghi_chu:'% giá gốc nhận lại khi bán cho cửa hàng'},
 {khoa:'he_so_gia_do_dep',gia_tri:250,ghi_chu:'Giá đồ Đẹp trong cửa hàng = % này của giá gốc'},
 {khoa:'he_so_gia_hoan_hao',gia_tri:600,ghi_chu:'Giá đồ Hoàn hảo trong hiệu buôn thành trì = % này của giá gốc'},
 {khoa:'dung_hop_ngoc',gia_tri:60,ghi_chu:'Dung hợp cánh (NPC Luyện khí sư): số hồng ngọc tốn mỗi lần'},
 {khoa:'dung_hop_ti_le',gia_tri:40,ghi_chu:'Dung hợp cánh: tỉ lệ thành công (%)'},
 {khoa:'dung_hop_thu_cap',gia_tri:9,ghi_chu:'Dung hợp cánh: thú cưỡi phải gia cường tới cấp này'},
 {khoa:'dung_hop_dong',gia_tri:'0,30,28,22,12,6,2',ghi_chu:'Dung hợp cánh: tỉ lệ (%) ra 0,1,2,3,4,5 dòng (6 số, cách nhau dấu phẩy; số đầu bỏ qua)'},
 {khoa:'canh_dong',gia_tri:'dmgMax,dmgMin,def,hp,mp,range,crit3',ghi_chu:'Dung hợp cánh: các chỉ số có thể ra dòng'},
 {khoa:'nap_ngan_hang',gia_tri:'MB',ghi_chu:'Nạp thẻ: mã ngân hàng theo VietQR (MB = Quân đội)'},
 {khoa:'nap_so_tai_khoan',gia_tri:'2220181818888',ghi_chu:'Nạp thẻ: số tài khoản nhận tiền'},
 {khoa:'nap_ten_tai_khoan',gia_tri:'TRAN ANH NGUYET',ghi_chu:'Nạp thẻ: tên chủ tài khoản (không dấu)'},
 {khoa:'nap_noi_dung',gia_tri:'Ikyna {goi} {tai_khoan}',ghi_chu:'Nạp thẻ: nội dung chuyển khoản ({goi} = tên gói, {tai_khoan} = tên đăng nhập)'},
 {khoa:'phi_cho',gia_tri:5,ghi_chu:'% thương nhân giữ lại khi bán hộ trên chợ và khi bán nhân vật đánh thuê'},
 {khoa:'mau_goc',gia_tri:60,ghi_chu:'Máu = mau_goc + Sức khỏe × mau_moi_diem'},
 {khoa:'mau_moi_diem',gia_tri:5,ghi_chu:''},
 {khoa:'mana_goc',gia_tri:40,ghi_chu:'Mana = mana_goc + Trí tuệ × mana_moi_diem'},
 {khoa:'mana_moi_diem',gia_tri:4,ghi_chu:''},
 {khoa:'hoa_sat_thuong',gia_tri:25,ghi_chu:'Sách Hỏa: % sát thương'},
 {khoa:'thuy_hoi_mana',gia_tri:3,ghi_chu:'Sách Thủy: mana mỗi giây'},
 {khoa:'tho_phan_don',gia_tri:30,ghi_chu:'Sách Thổ: % phản đòn'},
 {khoa:'kim_giam_sat_thuong',gia_tri:25,ghi_chu:'Sách Kim: % giảm sát thương'},
 {khoa:'moc_hoi_mau',gia_tri:2,ghi_chu:'Sách Mộc: máu mỗi giây'},
 {khoa:'vung_an_toan_x',gia_tri:27,ghi_chu:'Ô bản đồ từ cột 0 đến cột này là vùng an toàn (làng)'},
 {khoa:'bo_cong_vu_khi',gia_tri:16,ghi_chu:'Đồ bộ huyền thoại: công vũ khí gốc'},
 {khoa:'bo_thu_khien',gia_tri:10,ghi_chu:'Đồ bộ: thủ của khiên'},
 {khoa:'bo_thu_ao',gia_tri:12,ghi_chu:'Đồ bộ: thủ của áo giáp'},
 {khoa:'bo_thu_nho',gia_tri:6,ghi_chu:'Đồ bộ: thủ của mũ, quần, găng, giày, cánh'},
 {khoa:'bo_toc_thu_cuoi',gia_tri:155,ghi_chu:'Đồ bộ: tốc độ thú cưỡi (% tốc đi bộ)'},
 {khoa:'gia_do_bo',gia_tri:5000,ghi_chu:'Giá gốc món đồ bộ (để tính giá bán lại)'},
 {khoa:'gieng_hoi_giay',gia_tri:300,ghi_chu:'Giếng cổ: số giây để nước đầy lại sau khi dùng'},
 {khoa:'exp_goc',gia_tri:60,ghi_chu:'Kinh nghiệm cần để lên cấp 2. Cấp L cần exp_goc × L^(exp_tang/100)'},
 {khoa:'exp_tang',gia_tri:150,ghi_chu:'Độ tăng kinh nghiệm cần mỗi cấp (150 = lũy thừa 1,5)'},
 {khoa:'cap_toi_da',gia_tri:400,ghi_chu:'Cấp cao nhất của nhân vật (v10.12: 400)'},
 {khoa:'diem_moi_cap',gia_tri:5,ghi_chu:'Điểm cộng chỉ số nhận được mỗi lần lên cấp'},
 {khoa:'sach_chi_so',gia_tri:4,ghi_chu:'Mỗi sách gắn vào ô kỹ năng cộng chừng này điểm vào chỉ số theo hệ (Mộc chia đôi cho Sức khỏe và Trí tuệ)'},
 {khoa:'sach_moi_cap',gia_tri:2,ghi_chu:'Mỗi cấp gia cường sách cộng thêm'},
 {khoa:'thu_cuoi_toc_cap',gia_tri:3,ghi_chu:'Thú cưỡi: % tốc độ mỗi cấp gia cường (+1 đến +15)'},
 {khoa:'thu_cuoi_cong_cap',gia_tri:2,ghi_chu:'Thú cưỡi: công mỗi cấp từ +7'},
 {khoa:'thu_cuoi_mau_cap',gia_tri:20,ghi_chu:'Thú cưỡi: máu mỗi cấp từ +11'},
 {khoa:'thu_cuoi_mana_cap',gia_tri:10,ghi_chu:'Thú cưỡi: mana mỗi cấp từ +11'},
 {khoa:'thu_cuoi_thu_cap',gia_tri:2,ghi_chu:'Thú cưỡi: phòng ngự mỗi cấp từ +11'},
 {khoa:'sach_ti_le_cap',gia_tri:1,ghi_chu:'Sách Lôi, Phong, Băng, Ánh sáng, Ma công: mỗi cấp gia cường cộng thêm % tỉ lệ kích hoạt'},
 {khoa:'loi_ti_le',gia_tri:12,ghi_chu:'Sách Lôi: % mỗi đòn trúng có thêm một đạo lôi quang đánh xuống'},
 {khoa:'loi_sat_thuong',gia_tri:150,ghi_chu:'Sách Lôi: sát thương lôi quang = % sát thương đòn đánh'},
 {khoa:'phong_ti_le',gia_tri:20,ghi_chu:'Sách Phong: % làm chậm quái'},
 {khoa:'phong_cham',gia_tri:45,ghi_chu:'Sách Phong: % giảm tốc độ quái'},
 {khoa:'phong_ms',gia_tri:3000,ghi_chu:'Sách Phong: thời gian chậm (mili giây)'},
 {khoa:'bang_ti_le',gia_tri:10,ghi_chu:'Sách Băng: % đóng băng quái'},
 {khoa:'bang_ms',gia_tri:1800,ghi_chu:'Sách Băng: thời gian đóng băng (mili giây), trùm còn một nửa'},
 {khoa:'sang_ti_le',gia_tri:15,ghi_chu:'Sách Ánh sáng: % khi bị đánh trúng làm quái hoảng sợ bỏ chạy'},
 {khoa:'sang_ms',gia_tri:2500,ghi_chu:'Sách Ánh sáng: thời gian quái bỏ chạy (mili giây), trùm còn một nửa'},
 {khoa:'ma_ti_le_goc',gia_tri:2,ghi_chu:'Sách Ma công: % thu phục quái khi hạ (không áp dụng cho trùm)'},
 {khoa:'ma_phan_van_moi_menh_lenh',gia_tri:20,ghi_chu:'Sách Ma công: mỗi điểm Mệnh lệnh cộng thêm chừng này phần vạn tỉ lệ (20 = 0,2%)'},
 {khoa:'ma_toi_da',gia_tri:2,ghi_chu:'Số quái thu phục tối đa đi theo. Quái chết là mất hẳn'},
 {khoa:'pham_chat_roi_toi_da',gia_tri:'p',ghi_chu:'Phẩm chất cao nhất rơi ra ở bản đồ này (n Thường, g Đẹp, p Hoàn hảo, l Huyền thoại, m Thần). Đồ cao hơn không rơi, phần thưởng nhiệm vụ cũng không vượt mức này'},
 {khoa:'chieu_mo_hong_ngoc',gia_tri:100,ghi_chu:'v10.14 · Đơn chiêu mộ ở bảng lính thành trì: hồng ngọc mỗi lần gửi'},
 {khoa:'chieu_mo_ti_le',gia_tri:'50,35,10,3,2',ghi_chu:'v10.14 · Đơn chiêu mộ: % ra lính thường, tinh nhuệ, thiện chiến, huyền thoại, thần thoại'},
 {khoa:'linh_he_so',gia_tri:'1,1.5,2,3,4',ghi_chu:'v10.14 · Máu và sát thương lính theo phẩm cấp (thường, tinh nhuệ, thiện chiến, huyền thoại, thần thoại) nhân với lính thường'},
 {khoa:'suc_khoe_hoi_day',gia_tri:2,ghi_chu:'v10.14 · Sức khỏe: mỗi 100 điểm cộng thêm % tỉ lệ hồi đầy máu khi trúng đòn (tối đa 20%)'},
 {khoa:'tri_tue_chinh_xac',gia_tri:4,ghi_chu:'v10.14 · Trí tuệ: mỗi 100 điểm cộng thêm % chính xác cung, nỏ'},
 {khoa:'tri_tue_hoi_mana',gia_tri:2,ghi_chu:'v10.14 · Trí tuệ: mỗi 100 điểm cộng thêm mana hồi mỗi giây'},
 {khoa:'menh_lenh_sat_thuong',gia_tri:50,ghi_chu:'v10.14 · Mệnh lệnh: mỗi 100 điểm cộng thêm % sát thương cho lính thuê và quái thu phục'},
 {khoa:'linh_nhan_chi_so',gia_tri:2,ghi_chu:'v10.16 · Máu và sát thương mọi lính đánh thuê nhân với số này (nhân thêm với hệ số phẩm cấp linh_he_so)'},
 {khoa:'linh_nhan_menh_lenh',gia_tri:10,ghi_chu:'v10.16 · Mệnh lệnh cần để cho một lính đi theo = cột menh_lenh của lính × số này'},
 {khoa:'quai_nhan_mau',gia_tri:0.25,ghi_chu:'v10.16 · Máu mọi quái và boss nhân với số này (0.25 = còn 1/4). Quái thu phục giữ máu gốc'},
 {khoa:'quai_nhan_sat_thuong',gia_tri:0.25,ghi_chu:'v10.16 · Sát thương mọi quái và boss nhân với số này (0.25 = còn 1/4). Quái thu phục giữ sát thương gốc'},
 {khoa:'thu_cuoi_nhan_gia',gia_tri:20,ghi_chu:'v10.16 · Giá thú cưỡi ở cửa hàng nhân với số này (giá bán lại cũng theo)'},
 {khoa:'link_cho_phien',gia_tri:'https://ikynagame.blogspot.com/p/cho-phien.html',ghi_chu:'Địa chỉ trang Chợ phiên (mua bán giữa người chơi, nhân vật đi theo)'}
],
// cap = cấp hiện tại; ti_le = % thành công lên cấp kế; thất bại: cấp về ngẫu nhiên từ that_bai_tu đến that_bai_den (để trống = giữ nguyên)
gia_cuong:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(c=>({cap:c,ti_le:c<6?100:c<10?50:[25,20,15,10,5][c-10],phi_hong_ngoc:c+1,that_bai_tu:c<6?'':c<10?0:6,that_bai_den:c<6?'':6})),
pham_chat:[
 {ma:'n',ten:'Thường',mau:'#e8e6df',he_so:100,so_dong:0,bac:0,giao_dich:'khong',mua_duoc:'co'},
 {ma:'g',ten:'Đẹp',mau:'#ffd54a',he_so:110,so_dong:1,bac:1,giao_dich:'khong',mua_duoc:'co'},
 {ma:'p',ten:'Hoàn hảo',mau:'#5aa9ff',he_so:125,so_dong:2,bac:2,giao_dich:'co',mua_duoc:'khong'},
 {ma:'l',ten:'Huyền thoại',mau:'#c8823e',he_so:150,so_dong:3,bac:3,giao_dich:'co',mua_duoc:'khong'},
 {ma:'m',ten:'Thần',mau:'#ff6fb5',he_so:200,so_dong:4,bac:4,giao_dich:'co',mua_duoc:'khong'}
],
thuoc_tinh:[
 ['str','Sức mạnh','str','','1-2','2-4','4-7','8-12'],['agi','Nhanh nhẹn','agi','','1-2','2-4','4-7','8-12'],['vit','Sức khỏe','vit','','1-2','2-4','4-7','8-12'],['int','Trí tuệ','int','','1-2','2-4','4-7','8-12'],['cmd','Mệnh lệnh','cmd','','1-1','1-2','2-4','4-6'],
 ['dmgMax','Sát thương cao nhất','str','','1-3','3-6','6-10','12-20'],['dmgMin','Sát thương nhỏ nhất','str','','1-2','2-4','4-7','8-14'],['acc','Sát thương chính xác','str','%','1-2','2-4','4-7','8-12'],
 ['crit2','Tỉ lệ sát thương x2','str','%','1-2','2-4','4-6','7-10'],['crit3','Tỉ lệ sát thương x3','str','%','1-1','1-2','2-3','3-5'],['trueDmg','Sát thương chuẩn','str','','1-2','2-5','5-9','10-18'],
 ['perfDmg','Sát thương hoàn hảo','str','%','1-1','1-3','3-5','5-8'],['legDmg','Sát thương huyền thoại','str','%','1-1','1-2','2-4','4-6'],['mythDmg','Sát thương thần thoại','str','%','1-1','1-1','1-2','3-5'],
 ['atkSpd','Tốc độ đánh','agi','%','1-3','3-6','6-10','10-15'],['moveSpd','Tốc độ di chuyển','agi','%','1-2','2-4','4-7','8-12'],['def','Khả năng phòng ngự','agi','','1-2','2-4','4-7','8-14'],
 ['block','Phòng ngự thành công','agi','%','1-2','2-4','4-6','7-10'],['dodge','Tránh né','agi','%','1-2','2-3','3-5','6-9'],['dmgRed','Giảm sát thương','agi','%','1-2','2-4','4-6','7-10'],
 ['perfRed','Giảm sát thương hoàn hảo','agi','%','1-2','2-4','4-6','7-10'],['critRed','Giảm sát thương x2, x3','agi','%','1-2','2-4','4-6','7-10'],['legRed','Giảm sát thương huyền thoại','agi','%','1-2','2-4','4-6','7-10'],['mythRed','Giảm sát thương thần thoại','agi','%','1-2','2-3','3-5','5-8'],
 ['hp','Lượng máu','vit','','5-10','10-20','20-40','50-80'],['hpReg','Hồi máu mỗi giây','vit','','1-1','1-2','2-3','3-5'],['reflect','Phản đòn','vit','%','1-2','2-4','4-7','8-12'],['range','Tầm đánh','agi','%','3-5','5-8','8-12','12-18'],
 ['mp','Lượng mana','int','','4-8','8-16','16-30','40-60'],['mpReg','Hồi mana mỗi giây','int','','1-1','1-2','2-3','3-5'],['cdr','Giảm thời gian hồi chiêu','int','%','1-2','2-4','4-6','7-10'],
 // v10.14: chỉ số mới sinh từ điểm cộng — Sức khỏe: hồi đầy máu khi trúng đòn; Trí tuệ: chính xác tầm xa (cung, nỏ); Mệnh lệnh: sát thương lính thuê, quái thu phục
 ['fullHeal','Hồi đầy máu khi trúng đòn','vit','%','1-1','1-1','1-2','2-3'],['aim','Chính xác tầm xa','int','%','1-2','2-4','4-6','6-10'],['mercDmg','Sát thương lính thuê','cmd','%','1-2','2-4','4-7','8-12'],['petDmg','Sát thương quái thu phục','cmd','%','1-2','2-4','4-7','8-12']
].map(([ma,ten,nhom,don_vi,...r])=>{const o={ma,ten,nhom,don_vi};['dep','hoan_hao','huyen_thoai','than'].forEach((k,i)=>{const [a,b]=r[i].split('-').map(Number);o[k+'_thap']=a;o[k+'_cao']=b;});return o;}),
vat_pham:[
 ['sword','Kiếm tập','hand','sword','one',2,0,0,40,'',''],['sword-iron','Kiếm sắt','hand','sword','one',6,0,0,150,'#d5dde2',''],['sword-steel','Kiếm thép','hand','sword','one',11,0,0,480,'#a8dcf0',''],
 ['shield','Khiên tập','hand','shield','one',0,2,0,40,'',''],['shield-wood','Khiên mây','hand','shield','one',0,4,0,120,'#a8864a',''],['shield-iron','Khiên đồng','hand','shield','one',0,8,0,420,'#b08a4a',''],
 ['staff','Gậy tập','hand','staff','one',2,0,0,40,'',''],['staff-jade','Gậy ngọc','hand','staff','one',8,0,0,360,'#7fe0b0',''],
 ['bow','Cung tập','hand','bow','two',3,0,0,50,'',''],['bow-hunt','Cung săn','hand','bow','two',9,0,0,380,'#9a6430',''],
 ['spear','Giáo tập','hand','spear','two',3,0,0,50,'',''],['spear-iron','Giáo sắt','hand','spear','two',10,0,0,400,'#d5dde2',''],
 ['saber-iron','Đao sắt','hand','saber','one',9,0,0,420,'#cfd6da',''],['mace-iron','Chùy sắt','hand','mace','one',12,0,0,520,'#8a8f96',''],
 ['crossbow','Nỏ tập','hand','crossbow','two',4,0,0,60,'',''],['crossbow-war','Nỏ chiến','hand','crossbow','two',13,0,0,560,'#4a3524',''],
 ['hat','Nón lá','hat','hat','',0,1,0,30,'',''],['hat-iron','Nón dấu','hat','hat','',0,3,0,180,'#6b4a2e',''],
 ['armor','Áo vải','armor','armor','',0,2,0,60,'',''],['armor-leather','Áo da','armor','armor','',0,4,0,200,'#8a5a34',''],['armor-iron','Giáp đồng','armor','armor','',0,8,0,600,'#a07a40',''],
 ['pants','Quần vải','pants','pants','',0,1,0,30,'',''],['pants-guard','Quần giáp','pants','pants','',0,3,0,180,'#5d4a34',''],
 ['gloves','Bao tay','gloves','gloves','',0,1,0,30,'',''],['gloves-leather','Bao tay da','gloves','gloves','',0,2,0,120,'#6b4a2e',''],
 ['shoes','Dép cỏ','shoes','shoes','',0,1,0,30,'',''],['shoes-leather','Giày da','shoes','shoes','',0,2,0,120,'#5b3d26',''],['shoes-iron','Ủng đồng','shoes','shoes','',0,4,0,300,'#8a6a3a',''],
 ['wings','Áo choàng','wings','wings','',0,1,0,900,'',''],
 // Cánh (v10.6): chỉ có được qua dung hợp ở Luyện khí sư; dòng chỉ số ngẫu nhiên 0–5 (tab cau_hinh canh_dong, dung_hop_dong)
 ['canh-thien-than','Cánh thiên thần','wings','wings','',0,6,0,30000,'#f4f0ff',''],['canh-ac-quy','Cánh ác quỷ','wings','wings','',0,6,0,30000,'#5a1a3a',''],['canh-tien-nu','Cánh tiên nữ','wings','wings','',0,6,0,30000,'#ffc0e8',''],['canh-anh-sang','Cánh ánh sáng','wings','wings','',0,6,0,30000,'#fff0a0',''],
 ['canh-xuong','Cánh xương','wings','wings','',0,6,0,30000,'#e8e0d0',''],['canh-loi-phong','Cánh lôi phong','wings','wings','',0,6,0,30000,'#a0c8ff',''],['canh-dai-bang','Cánh đại bàng','wings','wings','',0,6,0,30000,'#8a5a30',''],['canh-lua','Cánh lửa','wings','wings','',0,6,0,30000,'#ff8a3d',''],
 ['mount','Ngựa con','mount','mount','',0,0,1.15,200,'#b78452','horse',5],['mount-brown','Ngựa nâu','mount','mount','',0,0,1.25,600,'#7a4b2a','horse',5],['mount-black','Ngựa ô','mount','mount','',0,0,1.35,1200,'#2e2a2a','horse',5],['mount-white','Bạch mã','mount','mount','',0,0,1.5,2500,'#ece6da','horse',5],
 ['mount-tiger','Hổ','mount','mount','',4,0,1.45,4000,'#e08a2e','tiger',10],['mount-elephant','Voi','mount','mount','',0,8,1.2,6000,'#8e9398','elephant',15],
 ['ore','Khoáng thạch','','ore','',0,0,0,20,'',''],
 ['book-fire','Sách Hỏa','book','book','',0,0,0,400,'','',0,'fire'],['book-water','Sách Thủy','book','book','',0,0,0,300,'','',0,'water'],['book-earth','Sách Thổ','book','book','',0,0,0,450,'','',0,'earth'],['book-metal','Sách Kim','book','book','',0,0,0,450,'','',0,'metal'],['book-wood','Sách Mộc','book','book','',0,0,0,300,'','',0,'wood'],
 ['book-loi','Sách Lôi','book','book','',0,0,0,900,'','',0,'thunder'],['book-phong','Sách Phong','book','book','',0,0,0,700,'','',0,'wind'],['book-bang','Sách Băng','book','book','',0,0,0,800,'','',0,'ice'],['book-ma','Sách Ma công','book','book','',0,0,0,1500,'','',0,'demon'],['book-sang','Sách Ánh sáng','book','book','',0,0,0,1000,'','',0,'light']
].map(([id,ten,o,loai,cam,cong,thu,toc,gia,mau,thu_cuoi,menh_lenh,he])=>({id,ten,o,loai,cam,cong,thu,toc:Math.round(toc*100),gia,mau,thu_cuoi:thu_cuoi||'',menh_lenh:menh_lenh||0,he:he||'',pham_chat:'',hieu_ung:'',gia_tri:0,mo_ta:''})),
// (v10.3) vat_pham có thêm cột pham_chat (phẩm chất cố định, vd p), hieu_ung / gia_tri / mo_ta (hiệu ứng riêng như đồ thần) — dùng cho hàng hiệu buôn thành trì (sinh ở 01-data-vung.js)
// Loại vũ khí: sat_thuong = % sát thương; tam_danh = tầm đánh (điểm ảnh, 1 ô bản đồ = 48); lan_rong = độ rộng đòn (cận chiến: góc chém theo độ, giáo: bề ngang mũi đâm, gậy: bán kính nổ, nỏ: số quái xuyên qua thêm)
// toc_danh_ms = thời gian một đòn (càng nhỏ càng nhanh); mana = % mana tốn khi dùng kỹ năng; hoi_chieu = % thời gian hồi kỹ năng (càng nhỏ hồi càng nhanh); noi_tai = % thanh nội tại mỗi đòn thường
vu_khi:[
 ['spear','Thương',130,130,26,500,110,90,14,'Sát thương cao nhất, đâm thẳng một đường'],
 ['saber','Đao',125,82,140,520,100,100,12,'v10.14 · Nặng tay, chém vòng cung rộng hơn kiếm'],
 ['mace','Chùy',145,66,100,640,110,95,15,'v10.14 · Nặng nhất, đẩy lùi mạnh, mỗi đòn có 15% làm quái choáng'],
 ['sword','Kiếm',115,85,115,420,90,110,10,'Đánh nhanh nhất, chém vòng cung trước mặt'],
 ['shield','Khiên',100,60,75,560,130,70,18,'Tầm ngắn nhất, đẩy lùi mạnh. Tốn mana nhiều nhất nhưng hồi chiêu và nội tại nhanh nhất'],
 ['crossbow','Nỏ',90,600,1,760,100,100,12,'Bắn xa, mũi tên xuyên qua quái'],
 ['bow','Cung',80,540,0,660,120,80,16,'Bắn xa, hồi chiêu nhanh'],
 ['staff','Gậy phép',65,680,90,900,80,120,9,'Tầm xa và rộng nhất (cầu phép nổ lan), sát thương thấp nhất, đánh chậm nhất']
].map(([loai,ten,sat_thuong,tam_danh,lan_rong,toc_danh_ms,mana,hoi_chieu,noi_tai,ghi_chu])=>({loai,ten,sat_thuong,tam_danh,lan_rong,toc_danh_ms,mana,hoi_chieu,noi_tai,ghi_chu})),
cua_hang:[
 ...['sword-iron','sword-steel','shield-wood','shield-iron','staff-jade','bow-hunt','spear-iron','crossbow-war','saber-iron','mace-iron','hat-iron','armor-leather','armor-iron','pants-guard','gloves-leather','shoes-leather','shoes-iron'].map((id,i)=>({cua_hang:'smith',id,pham_chat:'n,g',gia:'',thu_tu:i+1,bac:0})),
 ...['mount','mount-brown','mount-black','mount-white','mount-tiger','mount-elephant'].map((id,i)=>({cua_hang:'trainer',id,pham_chat:'n',gia:'',thu_tu:i+1,bac:0})),
 ...['book-fire','book-water','book-earth','book-metal','book-wood','book-loi','book-phong','book-bang','book-ma','book-sang'].map((id,i)=>({cua_hang:'wizard',id,pham_chat:'n',gia:'',thu_tu:i+1,bac:0}))
],
// Gói nạp (v10.6): NPC Nạp thẻ ở thành trì hiện gói, sinh mã QR chuyển khoản (VietQR). Hồng ngọc cộng tay bằng hàm napHongNgoc trong Apps Script sau khi nhận tiền.
goi_nap:[
 ['goi-20','Gói 20K',20000,20,'Dùng thử'],['goi-50','Gói 50K',50000,55,'Tặng 10%'],['goi-100','Gói 100K',100000,120,'Tặng 20%'],['goi-200','Gói 200K',200000,260,'Tặng 30%'],['goi-500','Gói 500K',500000,700,'Tặng 40%'],['goi-1000','Gói 1 triệu',1000000,1500,'Tặng 50%'],
 // v10.16: gói vàng (cột vang = số vàng; 1 vàng = 100 bạc = 10.000 đồng). Cộng tay bằng hàm napVang
 ['vang-20','Gói vàng 20K',20000,0,'Dùng thử',100],['vang-50','Gói vàng 50K',50000,0,'Tặng 10%',275],['vang-100','Gói vàng 100K',100000,0,'Tặng 20%',600],['vang-200','Gói vàng 200K',200000,0,'Tặng 30%',1300],['vang-500','Gói vàng 500K',500000,0,'Tặng 40%',3500],['vang-1000','Gói vàng 1 triệu',1000000,0,'Tặng 50%',7500]
].map(([id,ten,tien,hong_ngoc,mo_ta,vang],i)=>({id,ten,tien,hong_ngoc,mo_ta,thu_tu:i+1,vang:vang||0})),
// Diện mạo (v10.3): NPC Thợ truyền thần ở thành trì cấp cao bán; mỗi dòng là một bộ da + tóc + râu + mắt + dấu trên mặt. gia = đồng, hong_ngoc = hồng ngọc (0 cả hai = miễn phí). gioi_tinh trống = cả hai.
// kieu_toc: '' búi tóc · xoa (xõa dài) · dung (dựng) · khan (khăn buộc) · troc (đầu trọc). dau: seo (sẹo má) · not (nốt ruồi) · ve (vẽ mặt) · hoa (hoa cài, nữ). Ảnh chân dung riêng: giao_dien:chan_dung_<id> trong file Hình ảnh
dien_mao:[
 ['da-nau','Da nâu','',0,0,'#c89060','#2a2622','','','#2a2018','',1],
 ['da-trang','Da trắng','',0,0,'#f0dcc0','#2a2622','','','#2a2018','',2],
 ['dau-troc','Đầu trọc','m',0,0,'#e1c295','#2a2622','troc','','#2a2018','',3],
 ['toc-xoa','Tóc xõa','',2000,0,'#e1c295','#2a2622','xoa','','#2a2018','',4],
 ['toc-dung','Tóc dựng','',5000,0,'#e1c295','#1a1614','dung','','#2a2018','',5],
 ['khan-buoc','Khăn buộc đầu','',6000,0,'#d8b088','#2a2622','khan','','#2a2018','',6],
 ['toc-nau','Tóc nâu','',8000,0,'#e8cca8','#6a3a1a','','','#3a2a18','',7],
 ['hoa-cai','Hoa cài tóc','f',8000,0,'#f0dcc0','#2a2622','','','#2a2018','hoa',8],
 ['rau-quai','Râu quai nón','m',10000,0,'#d8b088','#2a2622','','#2a2622','#2a2018','',9],
 ['not-ruoi','Nốt ruồi duyên','',12000,0,'#f0dcc0','#2a2622','','','#2a2018','not',10],
 ['vet-seo','Vết sẹo chiến binh','',15000,0,'#c89060','#1a1614','dung','','#2a2018','seo',11],
 ['toc-bac','Tóc bạc','',20000,0,'#e1c295','#d8d8d8','','','#2a2018','',12],
 ['ve-mat','Vẽ mặt chiến binh','',30000,0,'#c89060','#2a2622','khan','','#2a2018','ve',13],
 ['lao-truong','Lão trượng','m',50000,0,'#e8cca8','#d8d8d8','','#d8d0c0','#2a2018','',14],
 ['mat-ngoc','Mắt ngọc','',100000,0,'#f0dcc0','#2a2622','xoa','','#2a7a9a','',15],
 ['mat-hoa','Mắt hỏa','',0,20,'#d8b088','#1a1614','dung','','#c03020','',16],
 ['tien-nu','Tiên nữ','f',0,30,'#fff0e0','#4a2a6a','xoa','','#6a3aa0','hoa',17],
 ['ma-vuong','Ma Vương','m',0,30,'#9a8ab0','#1a0a2a','dung','#1a0a2a','#ff2060','ve',18]
].map(([id,ten,gioi_tinh,gia,hong_ngoc,mau_da,mau_toc,kieu_toc,rau,mau_mat,dau,thu_tu])=>({id,ten,gioi_tinh,gia,hong_ngoc,mau_da,mau_toc,kieu_toc,rau,mau_mat,dau,thu_tu})),
// Bộ huyền thoại: nhân vật lịch sử có thật. Mốc 3/5/7 món cộng chỉ số, đủ 9 món kích hoạt hiệu ứng riêng.
bo_huyen_thoai:[
 ['ngo-quyen','Ngô Quyền','m','Bạch Đằng','sword','Kiếm Bạch Đằng','shield','Khiên cọc gỗ lim','Mũ trụ Đường Lâm','Giáp Bạch Đằng','Quần trận Bạch Đằng','Bao tay chèo lái','Hài thủy chiến','Cờ hiệu Tiền Ngô','Chiến mã Đường Lâm','horse','def:6,hp:30','reflect:8,dmgRed:4','str:8,crit2:4','stun',15,'Cọc Bạch Đằng: đòn đánh có 15% làm quái choáng 1 giây'],
 ['dinh-bo-linh','Đinh Bộ Lĩnh','m','Cờ Lau','sword','Kiếm Hoa Lư','sword','Đoản kiếm Hoa Lư','Mũ Vạn Thắng','Long bào Đại Cồ Việt','Quần cờ lau','Bao tay Vạn Thắng','Hài Hoa Lư','Cờ lau tập trận','Ngựa Vạn Thắng','horse','cmd:3,hp:30','atkSpd:8,crit2:3','str:6,agi:6','execute',12,'Dẹp loạn 12 sứ quân: kết liễu quái thường còn dưới 12% máu'],
 ['le-hoan','Lê Hoàn','m','Đại Hành','sword','Kiếm Thập đạo','shield','Khiên Chi Lăng','Mũ Thập đạo tướng quân','Giáp Lê Đại Hành','Quần trận Chi Lăng','Bao tay Đại Hành','Hài phá Tống','Cờ Đại Hành','Voi chiến Đại Hành','elephant','def:5,block:3','hp:60,dmgRed:4','str:6,trueDmg:8','shield',20,'Chi Lăng: mỗi 10 giây nhận lá chắn bằng 20% máu tối đa'],
 ['ly-thuong-kiet','Lý Thường Kiệt','m','Như Nguyệt','sword','Kiếm Như Nguyệt','shield','Khiên sông Cầu','Mũ Thái úy','Giáp Như Nguyệt','Quần Thái úy','Bao tay Nam quốc','Hài sông Cầu','Cờ Nam quốc sơn hà','Chiến mã Ung Châu','horse','int:5,mp:20','cdr:6,crit2:3','str:6,dmgMax:8','wave',60,'Nam quốc sơn hà: mỗi đòn thứ 4 tung sóng chém 60% sát thương'],
 ['tran-hung-dao','Trần Hưng Đạo','m','Hưng Đạo','sword','Kiếm Hưng Đạo Vương','shield','Khiên Vạn Kiếp','Mũ Quốc công','Giáp Hưng Đạo','Quần Vạn Kiếp','Bao tay Hịch tướng sĩ','Hài Bạch Đằng','Cờ Tiết chế','Chiến mã Vạn Kiếp','horse','cmd:4,hp:30','str:5,crit3:2','dmgRed:6,reflect:6','aura',30,'Hịch tướng sĩ: bản thân và lính đánh thuê +30% sát thương'],
 ['tran-quoc-toan','Trần Quốc Toản','m','Phá Cường Địch','sword','Kiếm Hoài Văn Hầu','sword','Đoản kiếm Hoài Văn','Mũ Hoài Văn Hầu','Giáp thiếu niên','Quần Hoài Văn','Bao tay bóp cam','Hài thiếu niên','Cờ Phá cường địch','Ngựa Hoài Văn','horse','agi:5,atkSpd:5','crit2:4,moveSpd:4','str:6,perfDmg:3','cleave',40,'Phá cường địch: đòn thường lan 40% sát thương sang quái gần'],
 ['nguyen-trai','Nguyễn Trãi','m','Bình Ngô','staff','Bút Bình Ngô','staff','Gậy trúc Côn Sơn','Khăn Ức Trai','Áo Côn Sơn','Quần Ức Trai','Bao tay Quân trung từ mệnh','Hài Côn Sơn','Áo choàng Bình Ngô','Ngựa mưu sĩ Lam Sơn','horse','int:6,mp:30','mpReg:3,cdr:6','int:8,crit2:3','manaShield',30,'Bình Ngô đại cáo: 30% sát thương nhận vào trừ vào mana'],
 ['le-loi','Lê Lợi','m','Lam Sơn','sword','Kiếm Lam Sơn','shield','Khiên Lam Sơn','Mũ Bình Định Vương','Giáp Lam Sơn','Quần Lam Sơn','Bao tay Lũng Nhai','Hài Chí Linh','Cờ Bình Định','Voi chiến Lam Sơn','elephant','vit:5,hp:40','def:6,hpReg:2','str:6,crit2:3','lifesteal',8,'Hội thề Lũng Nhai: hút 8% sát thương gây ra thành máu'],
 ['quang-trung','Quang Trung','m','Tây Sơn','sword','Kiếm Tây Sơn','sword','Đoản kiếm Đống Đa','Mũ Quang Trung','Áo bào Tây Sơn','Quần Ngọc Hồi','Bao tay Đống Đa','Hài thần tốc','Cờ đào Tây Sơn','Voi chiến Ngọc Hồi','elephant','moveSpd:6,atkSpd:5','str:6,crit2:4','crit3:3,dmgMax:10','haste',40,'Thần tốc: hạ quái tăng 40% tốc đánh và tốc chạy trong 4 giây'],
 ['trung-trac','Trưng Trắc','f','Mê Linh','sword','Kiếm Mê Linh','shield','Khiên Hát Môn','Mũ Trưng Vương','Giáp Mê Linh','Váy trận Hát Môn','Bao tay Trưng Vương','Hài Mê Linh','Cờ Trưng Vương','Voi chiến Mê Linh','elephant','cmd:3,hp:30','str:5,def:5','crit2:4,dmgRed:5','burn',30,'Lửa Mê Linh: đòn đánh gây bỏng thêm 30% sát thương trong 3 giây'],
 ['trung-nhi','Trưng Nhị','f','Hát Giang','sword','Kiếm Trưng Nhị','sword','Đoản kiếm Hát Giang','Mũ Trưng Nhị','Giáp Hát Giang','Váy trận Trưng Nhị','Bao tay Hát Giang','Hài Hát Giang','Cờ Hát Giang','Voi chiến Hát Giang','elephant','agi:5,dodge:3','atkSpd:6,crit2:3','str:6,dodge:4','counter',100,'Song kiếm: sau khi né, đòn kế tiếp gây gấp đôi'],
 ['trieu-thi-trinh','Bà Triệu','f','Núi Nưa','sword','Gươm Núi Nưa','sword','Gươm Bồ Điền','Trâm Nhụy Kiều','Giáp vàng Nhụy Kiều','Váy trận Núi Nưa','Bao tay Bồ Điền','Guốc ngà Bà Triệu','Cờ Nhụy Kiều tướng quân','Voi một ngà','elephant','str:5,hp:30','crit2:4,atkSpd:5','str:7,dmgMax:8','wave',50,'Cưỡi gió đạp sóng: mỗi đòn thứ 4 tung sóng 50% sát thương'],
 ['le-chan','Lê Chân','f','An Biên','sword','Kiếm An Biên','shield','Khiên Hải tần','Mũ nữ tướng An Biên','Giáp thủy quân','Váy trận An Biên','Bao tay chài lưới','Hài Hải Phòng','Cờ An Biên','Ngựa An Biên','horse','def:5,hp:30','block:4,dmgRed:4','vit:6,reflect:5','shield',18,'Thành An Biên: mỗi 10 giây nhận lá chắn bằng 18% máu tối đa'],
 ['phung-thi-chinh','Phùng Thị Chính','f','Lãng Bạc','sword','Kiếm Lãng Bạc','shield','Khiên Phùng nữ tướng','Mũ Phùng nữ tướng','Giáp Lãng Bạc','Váy trận Lãng Bạc','Bao tay Lãng Bạc','Hài Lãng Bạc','Cờ nữ tướng Lãng Bạc','Ngựa Lãng Bạc','horse','vit:5,hpReg:1','hp:60,def:4','str:5,reflect:6','heal',2,'Trận Lãng Bạc: hồi 2% máu tối đa mỗi giây'],
 ['vu-thi-thuc','Bát Nàn','f','Tiên La','sword','Kiếm Tiên La','shield','Khiên Bát Nàn','Mũ Bát Nàn công chúa','Giáp Tiên La','Váy trận Bát Nàn','Bao tay Tiên La','Hài Tiên La','Cờ Bát Nàn','Ngựa Tiên La','horse','str:4,hp:30','crit2:3,trueDmg:5','str:6,atkSpd:6','lifesteal',6,'Bát Nàn: hút 6% sát thương gây ra thành máu'],
 ['duong-van-nga','Dương Vân Nga','f','Hoa Lư','staff','Trượng Thái hậu','staff','Gậy ngọc Hoa Lư','Mũ phượng Dương Vân Nga','Áo phượng Hoa Lư','Xiêm y Thái hậu','Bao tay ngọc Hoa Lư','Hài phượng','Áo choàng Thái hậu','Kiệu ngựa Hoa Lư','horse','int:5,mp:30','mpReg:2,cdr:5','int:7,hp:40','revive',50,'Trao áo long cổn: hồi sinh tại chỗ một lần mỗi 5 phút với 50% máu'],
 ['y-lan','Ỷ Lan','f','Thổ Lỗi','staff','Trượng Nhiếp chính','shield','Khiên Thổ Lỗi','Mũ Nguyên phi','Áo Nguyên phi','Xiêm y Thổ Lỗi','Bao tay Nhiếp chính','Hài Thổ Lỗi','Áo choàng Ỷ Lan','Ngựa Thăng Long','horse','cmd:3,int:4','cdr:5,mp:30','int:6,dmgRed:5','aura',20,'Nhiếp chính: bản thân và lính đánh thuê +20% sát thương'],
 ['bui-thi-xuan','Bùi Thị Xuân','f','Tây Sơn ngũ phụng','sword','Song kiếm Bùi Thị Xuân','sword','Đoản kiếm Tây Sơn','Mũ Đô đốc','Giáp Tây Sơn','Váy trận Tây Sơn','Bao tay luyện voi','Hài Tây Sơn','Cờ ngũ phụng','Voi chiến Bùi Thị Xuân','elephant','str:4,cmd:3','atkSpd:6,crit2:3','str:6,crit3:2','stun',12,'Thuần voi: đòn đánh có 12% làm quái choáng 1 giây']
].map(([id,nhan_vat,gioi_tinh,ten_bo,vu_khi_loai,vu_khi,tay_trai_loai,tay_trai,mu,ao,quan,gang,giay,canh,thu_cuoi,thu_cuoi_loai,moc_3,moc_5,moc_7,hieu_ung_9,gia_tri_9,mo_ta_9])=>({id,nhan_vat,gioi_tinh,ten_bo,vu_khi_loai,vu_khi,tay_trai_loai,tay_trai,mu,ao,quan,gang,giay,canh,thu_cuoi,thu_cuoi_loai,moc_3,moc_5,moc_7,hieu_ung_9,gia_tri_9,mo_ta_9})),
// v10.14: 30 danh tướng Trung Hoa — đơn chiêu mộ ra lính huyền thoại (mặc bộ huyền thoại, màu cam) hoặc thần thoại (mặc bộ thần, màu hồng, chỉ số cao hơn); đồ tháo ra được cho người chơi dùng.
// Cột như bo_huyen_thoai; tay_trai_loai trống = vũ khí cầm hai tay (bộ 8 món, đủ 8 là kích hoạt hiệu ứng). gioi_tinh là của tướng; đồ bộ nam nữ đều mặc được. mau = màu áo bào
tuong:[
 ['quan-vu','Quan Vũ','m','Thanh Long','saber','Thanh Long Yển Nguyệt Đao','','','Mũ xanh Hán Thọ Đình Hầu','Chiến bào xanh lục','Quần trận Hán Thọ','Bao tay Nghĩa Dũng','Hài Hán Thọ','Áo choàng xanh Quan Công','Xích Thố','horse','str:8,hp:40','crit2:5,dmgRed:4','str:8,crit3:3','execute',15,'Quá ngũ quan trảm lục tướng: kết liễu quái thường còn dưới 15% máu','#2a8a4a','Võ thánh, mặt đỏ râu dài, nghĩa khí cao vời'],
 ['truong-phi','Trương Phi','m','Yến Nhân','spear','Bát Xà Mâu','','','Mũ trụ Yến Nhân','Giáp đen Trương Dực Đức','Quần trận Trường Bản','Bao tay Yến Nhân','Hài Trường Bản','Áo choàng đen Yến Nhân','Ngựa Ô Vân','horse','str:9,hp:30','atkSpd:6,crit2:4','str:8,dmgMax:10','stun',18,'Tiếng thét Trường Bản: đòn đánh có 18% làm quái choáng 1 giây','#2a2a3a','Mãnh tướng hét vỡ cầu Trường Bản'],
 ['trieu-van','Triệu Vân','m','Thường Sơn','spear','Long Đảm Lượng Ngân Thương','','','Mũ bạc Thường Sơn','Giáp bạc Tử Long','Quần trận Thường Sơn','Bao tay Tử Long','Hài bạc Thường Sơn','Áo choàng trắng Tử Long','Bạch Long Mã','horse','agi:7,def:5','dodge:5,atkSpd:6','str:7,crit2:5','counter',100,'Thất tiến thất xuất: sau khi né, đòn kế tiếp gây gấp đôi','#e8ecf2','Toàn thân là gan, một mình cứu ấu chủ'],
 ['lu-bo','Lữ Bố','m','Phi Tướng','spear','Phương Thiên Họa Kích','','','Mũ Tam Xoa Thúc Phát Tử Kim Quan','Giáp Thú Diện Thôn Đầu Liên Hoàn','Quần trận Hổ Lao','Bao tay Phi Tướng','Hài Hổ Lao Quan','Áo choàng Bách Hoa Chiến Bào','Xích Thố Mã','horse','str:10,agi:5','crit2:6,atkSpd:5','str:10,crit3:4','cleave',50,'Nhân trung Lữ Bố: đòn thường lan 50% sát thương sang quái gần','#c03030','Mãnh tướng vô song thời Tam Quốc'],
 ['ma-sieu','Mã Siêu','m','Tây Lương','spear','Hổ Đầu Trảm Kim Thương','','','Mũ bạc Tây Lương','Giáp bạc Mã Mạnh Khởi','Quần trận Tây Lương','Bao tay Mã Siêu','Hài Tây Lương','Áo choàng trắng Tây Lương','Ngựa Tây Lương','horse','agi:8,moveSpd:5','str:6,crit2:4','atkSpd:8,dmgMax:8','haste',40,'Thần tốc Tây Lương: hạ quái tăng 40% tốc đánh và tốc chạy trong 4 giây','#d8dde8','Cẩm Mã Siêu, kỵ binh Tây Lương'],
 ['hoang-trung','Hoàng Trung','m','Lão Tướng','bow','Bách Bộ Xuyên Dương Cung','','','Mũ lão tướng Hán Thăng','Giáp Hoàng Hán Thăng','Quần trận Định Quân','Bao tay bắn cung','Hài Định Quân Sơn','Áo choàng vàng Hoàng Trung','Ngựa Định Quân','horse','str:6,aim:5','crit2:6,aim:5','str:7,crit3:3','execute',12,'Trăm bước xuyên lá dương: kết liễu quái thường còn dưới 12% máu','#c8a040','Lão tướng bách phát bách trúng'],
 ['gia-cat-luong','Gia Cát Lượng','m','Ngọa Long','staff','Quạt lông Ngọa Long','staff','Trúc giản Long Trung','Khăn Khổng Minh','Áo bát quái Ngọa Long','Quần đạo bào Long Trung','Bao tay Thừa tướng','Hài Long Trung','Áo choàng bát quái','Xe tứ luân','horse','int:8,mp:40','cdr:8,mpReg:3','int:9,crit2:3','manaShield',35,'Bát trận đồ: 35% sát thương nhận vào trừ vào mana','#4a6a9a','Ngọa Long, mưu lược thần sầu'],
 ['chu-du','Chu Du','m','Xích Bích','sword','Kiếm Ngô Việt','shield','Khiên thủy quân Giang Đông','Mũ Đại đô đốc','Áo bào đỏ Xích Bích','Quần Đại đô đốc','Bao tay Giang Đông','Hài Xích Bích','Áo choàng lửa Xích Bích','Ngựa Giang Đông','horse','int:6,str:5','crit2:4,cdr:5','int:7,dmgMax:8','burn',35,'Hỏa thiêu Xích Bích: đòn đánh gây bỏng thêm 35% sát thương trong 3 giây','#c84a30','Đại đô đốc Đông Ngô, hỏa công Xích Bích'],
 ['tao-thao','Tào Tháo','m','Ngụy Vương','sword','Ỷ Thiên Kiếm','sword','Thanh Cang Kiếm','Mũ Ngụy Vương','Long bào Ngụy Vương','Quần Ngụy Vương','Bao tay Mạnh Đức','Hài Hứa Xương','Áo choàng Ngụy Vương','Tuyệt Ảnh Mã','horse','cmd:4,int:5','str:6,crit2:4','cmd:5,dmgRed:5','aura',35,'Thiên hạ quy tâm: bản thân và lính đánh thuê +35% sát thương','#5a3a6a','Gian hùng thời loạn, năng thần thời bình'],
 ['luu-bi','Lưu Bị','m','Huyền Đức','sword','Song Cổ Kiếm','sword','Song Cổ Kiếm (tả)','Mũ Hán Trung Vương','Long bào Thục Hán','Quần Huyền Đức','Bao tay Huyền Đức','Hài Thành Đô','Áo choàng Thục Hán','Đích Lư Mã','horse','cmd:4,hp:40','hp:60,def:5','cmd:5,hpReg:3','heal',2,'Nhân đức: hồi 2% máu tối đa mỗi giây','#d8c070','Hoàng đế Thục Hán, lấy nhân đức thu phục'],
 ['ton-quyen','Tôn Quyền','m','Giang Đông','sword','Bạch Hồng Kiếm','shield','Khiên Giang Đông','Mũ Ngô Vương','Long bào Đông Ngô','Quần Ngô Vương','Bao tay Trọng Mưu','Hài Kiến Nghiệp','Áo choàng Đông Ngô','Ngựa Kiến Nghiệp','horse','def:6,hp:30','block:5,dmgRed:4','vit:7,reflect:6','shield',22,'Trường Giang thiên hiểm: mỗi 10 giây nhận lá chắn bằng 22% máu tối đa','#3a7a8a','Ngô Vương, mắt biếc râu tía'],
 ['ha-hau-don','Hạ Hầu Đôn','m','Độc Nhãn','saber','Đao Hạ Hầu','shield','Khiên Nguyên Nhượng','Mũ trụ Độc Nhãn','Giáp Hạ Hầu','Quần trận Hạ Hầu','Bao tay Nguyên Nhượng','Hài Hạ Hầu','Áo choàng Hạ Hầu','Ngựa Hạ Hầu','horse','vit:7,def:4','hp:50,dmgRed:5','str:7,reflect:6','rage',40,'Bạt thỉ đạm tình: dưới 30% máu sát thương +40%','#6a4a3a','Nuốt mắt mình giữa trận, kiên cường vô song'],
 ['dien-vi','Điển Vi','m','Cổ Chi Ác Lai','mace','Song Thiết Kích','mace','Song Thiết Kích (tả)','Khăn trụ Điển Vi','Giáp da Điển Vi','Quần trận Uyển Thành','Bao tay Ác Lai','Hài Uyển Thành','Áo choàng Điển Vi','Ngựa Uyển Thành','horse','str:9,vit:5','atkSpd:6,crit2:4','str:8,hp:50','stun',20,'Song thiết kích: đòn đánh có 20% làm quái choáng 1 giây','#7a4a2a','Hộ vệ Tào Tháo, chết đứng giữ cửa'],
 ['hua-chu','Hứa Chử','m','Hổ Si','mace','Đại Thiết Chùy Hổ Si','','','Khăn trụ Hổ Si','Giáp Hứa Trọng Khang','Quần trận Hổ Si','Bao tay Hổ Si','Hài Hổ Si','Áo choàng Hứa Chử','Ngựa Hổ Si','horse','str:8,hp:40','hp:60,def:5','str:9,dmgMax:10','shield',25,'Hổ Si: mỗi 10 giây nhận lá chắn bằng 25% máu tối đa','#8a6a3a','Hổ Si cởi trần đánh Mã Siêu'],
 ['cam-ninh','Cam Ninh','m','Cẩm Phàm','saber','Đao Cẩm Phàm','shield','Khiên Cẩm Phàm','Mũ lông chim Cam Ninh','Áo gấm Cẩm Phàm','Quần Cẩm Phàm','Bao tay Hưng Bá','Hài Cẩm Phàm','Áo choàng gấm Cẩm Phàm','Ngựa Hưng Bá','horse','agi:7,atkSpd:5','moveSpd:6,crit2:4','str:6,dodge:5','haste',45,'Trăm kỵ cướp trại: hạ quái tăng 45% tốc đánh và tốc chạy trong 4 giây','#a04060','Tướng cướp Cẩm Phàm, trăm kỵ phá trại Tào'],
 ['thai-su-tu','Thái Sử Từ','m','Thần Xạ','bow','Cung Thần Xạ Tử Nghĩa','','','Mũ Thần Xạ','Giáp Thái Sử','Quần trận Thần Đình','Bao tay Thần Xạ','Hài Thần Đình','Áo choàng Thái Sử Từ','Ngựa Thần Đình','horse','agi:6,aim:6','crit2:6,atkSpd:5','str:7,aim:6','wave',70,'Thần xạ: mỗi đòn thứ 4 tung sóng chém 70% sát thương','#6a8a4a','Thần xạ thủ, hứa hẹn giữ chữ tín'],
 ['khuong-tu-nha','Khương Tử Nha','m','Phong Thần','staff','Đả Thần Tiên','staff','Hạnh Hoàng Kỳ','Mũ đạo Côn Luân','Đạo bào Khương Thượng','Quần đạo Côn Luân','Bao tay Tử Nha','Hài Côn Luân','Áo choàng Phong Thần','Tứ Bất Tướng','elephant','int:9,mp:40','cdr:8,mpReg:3','int:10,crit2:4','revive',60,'Phong thần bảng: hồi sinh tại chỗ một lần mỗi 5 phút với 60% máu','#8a6aa0','Thái công vọng, câu cá chờ thời'],
 ['ton-vu','Tôn Vũ','m','Binh Thánh','sword','Kiếm Binh Pháp','shield','Khiên Mười Ba Thiên','Mũ Binh Thánh','Áo bào Binh Pháp','Quần Binh Thánh','Bao tay Tôn Tử','Hài Ngô Quốc','Áo choàng Binh Pháp','Ngựa Ngô Quốc','horse','cmd:5,int:5','cdr:6,def:5','cmd:6,crit2:4','aura',40,'Binh pháp Tôn Tử: bản thân và lính đánh thuê +40% sát thương','#3a5a7a','Binh thánh, tác giả Binh pháp mười ba thiên'],
 ['bach-khoi','Bạch Khởi','m','Nhân Đồ','saber','Đao Nhân Đồ','','','Mũ trụ Tần Quốc','Giáp đen Nhân Đồ','Quần trận Trường Bình','Bao tay Nhân Đồ','Hài Trường Bình','Áo choàng đen Bạch Khởi','Ngựa Tần Quốc','horse','str:8,crit2:4','crit2:6,atkSpd:5','str:9,crit3:4','execute',20,'Trường Bình: kết liễu quái thường còn dưới 20% máu','#2a2a2a','Nhân Đồ, bách chiến bách thắng'],
 ['han-tin','Hàn Tín','m','Binh Tiên','sword','Kiếm Binh Tiên','shield','Khiên Bối Thủy','Mũ Tề Vương','Giáp Hàn Tín','Quần trận Bối Thủy','Bao tay Binh Tiên','Hài Bối Thủy','Áo choàng Binh Tiên','Ngựa Tề Vương','horse','cmd:5,hp:30','str:6,cdr:5','cmd:6,dmgMax:8','aura',30,'Đa đa ích thiện: bản thân và lính đánh thuê +30% sát thương','#5a6a3a','Binh Tiên, bối thủy nhất chiến'],
 ['hang-vu','Hạng Vũ','m','Bá Vương','spear','Bá Vương Thương','','','Mũ Tây Sở Bá Vương','Giáp Tây Sở','Quần trận Cai Hạ','Bao tay Bá Vương','Hài Cai Hạ','Áo choàng Tây Sở','Ô Truy','horse','str:10,hp:40','crit2:6,crit3:3','str:10,dmgMax:12','rage',50,'Lực bạt sơn hà: dưới 30% máu sát thương +50%','#1a1a2a','Tây Sở Bá Vương, lực bạt sơn hà'],
 ['ly-quang','Lý Quảng','m','Phi Tướng Quân','bow','Cung Phi Tướng Quân','','','Mũ Hán Phi Tướng','Giáp Lý Quảng','Quần trận Nhạn Môn','Bao tay Phi Tướng','Hài Nhạn Môn','Áo choàng Lý Quảng','Ngựa Nhạn Môn','horse','agi:7,aim:6','crit2:6,aim:6','str:7,crit3:3','frost',25,'Xạ hổ: đòn đánh có 25% làm quái chậm lại','#8a7a5a','Phi Tướng Quân, bắn đá tưởng hổ'],
 ['ve-thanh','Vệ Thanh','m','Trường Bình Hầu','saber','Đao Trường Bình Hầu','shield','Khiên Hán Kỵ','Mũ Đại tướng quân','Giáp Vệ Thanh','Quần trận Hà Nam','Bao tay Đại tướng quân','Hài Hà Nam','Áo choàng Vệ Thanh','Ngựa Hán Kỵ','horse','agi:6,def:5','moveSpd:6,atkSpd:5','str:7,dmgRed:5','cleave',45,'Kỵ binh Hán: đòn thường lan 45% sát thương sang quái gần','#6a7a8a','Đại tướng quân phá Hung Nô'],
 ['tiet-nhan-quy','Tiết Nhân Quý','m','Bạch Bào','spear','Phương Thiên Kích Bạch Bào','','','Mũ bạc Bạch Bào','Giáp trắng Tiết Nhân Quý','Quần trận Thiên Sơn','Bao tay Bạch Bào','Hài Thiên Sơn','Áo choàng trắng Bạch Bào','Ngựa trắng Thiên Sơn','horse','str:8,agi:5','crit2:5,atkSpd:6','str:8,crit3:3','wave',75,'Tam tiễn định Thiên Sơn: mỗi đòn thứ 4 tung sóng chém 75% sát thương','#f0f0f0','Tướng áo trắng, ba mũi tên định Thiên Sơn'],
 ['ly-tinh','Lý Tịnh','m','Vệ Công','sword','Kiếm Vệ Công','shield','Khiên Lục Hoa Trận','Mũ Vệ Quốc Công','Giáp Lý Dược Sư','Quần Vệ Công','Bao tay Dược Sư','Hài Âm Sơn','Áo choàng Vệ Công','Ngựa Âm Sơn','horse','cmd:5,int:5','def:6,cdr:5','cmd:6,dmgRed:6','shield',28,'Lục hoa trận: mỗi 10 giây nhận lá chắn bằng 28% máu tối đa','#4a6a6a','Vệ Công, binh pháp Lục Hoa'],
 ['tan-thuc-bao','Tần Thúc Bảo','m','Song Giản','mace','Song Giản Tần Quỳnh','mace','Song Giản Tần Quỳnh (tả)','Mũ Hộ Quốc Công','Giáp vàng Tần Quỳnh','Quần trận Hộ Quốc','Bao tay Song Giản','Hài Hộ Quốc','Áo choàng Tần Thúc Bảo','Hoàng Phiêu Mã','horse','str:8,vit:5','atkSpd:6,crit2:5','str:8,hp:50','stun',22,'Song giản: đòn đánh có 22% làm quái choáng 1 giây','#c8a030','Môn thần, song giản vô địch'],
 ['nhac-phi','Nhạc Phi','m','Tinh Trung','spear','Lịch Tuyền Thương','','','Mũ Nhạc Vũ Mục','Giáp Tinh Trung Báo Quốc','Quần trận Nhạc Gia Quân','Bao tay Nhạc Phi','Hài Chu Tiên Trấn','Áo choàng Tinh Trung','Ngựa Nhạc Gia','horse','str:8,cmd:4','def:6,crit2:5','str:8,cmd:5','aura',45,'Nhạc gia quân: bản thân và lính đánh thuê +45% sát thương','#c83a3a','Tinh trung báo quốc, Nhạc gia quân bất khả bại'],
 ['hoa-moc-lan','Hoa Mộc Lan','f','Mộc Lan','sword','Kiếm Mộc Lan','shield','Khiên Mộc Lan','Mũ trụ Mộc Lan','Giáp Mộc Lan','Quần trận Mộc Lan','Bao tay Mộc Lan','Hài Mộc Lan','Áo choàng Mộc Lan','Ngựa Mộc Lan','horse','agi:7,def:4','dodge:5,atkSpd:6','str:6,crit2:5','counter',100,'Thay cha tòng quân: sau khi né, đòn kế tiếp gây gấp đôi','#d06080','Nữ tướng cải trang thay cha tòng quân'],
 ['muc-que-anh','Mục Quế Anh','f','Mục Kha Trại','spear','Lê Hoa Thương','','','Mũ phượng Mục Quế Anh','Giáp Mục Kha Trại','Quần trận Dương Gia','Bao tay Mục Quế Anh','Hài Dương Gia','Áo choàng Mục Kha Trại','Ngựa Đào Hoa','horse','str:7,agi:6','crit2:5,atkSpd:6','str:8,dmgMax:10','cleave',48,'Phá Thiên Môn trận: đòn thường lan 48% sát thương sang quái gần','#e07090','Nữ tướng Dương gia, phá Thiên Môn trận'],
 ['luong-hong-ngoc','Lương Hồng Ngọc','f','Hồng Ngọc','sword','Kiếm Hồng Ngọc','shield','Khiên Hoàng Thiên Đãng','Mũ nữ tướng Hồng Ngọc','Giáp Lương Hồng Ngọc','Quần trận Hoàng Thiên Đãng','Bao tay đánh trống','Hài Hoàng Thiên Đãng','Áo choàng Hồng Ngọc','Ngựa Hoàng Thiên Đãng','horse','cmd:4,hp:30','def:5,hpReg:2','cmd:5,reflect:6','heal',2,'Trống trận Hoàng Thiên Đãng: hồi 2% máu tối đa mỗi giây','#c03050','Nữ tướng đánh trống trận Hoàng Thiên Đãng']
].map(([id,nhan_vat,gioi_tinh,ten_bo,vu_khi_loai,vu_khi,tay_trai_loai,tay_trai,mu,ao,quan,gang,giay,canh,thu_cuoi,thu_cuoi_loai,moc_3,moc_5,moc_7,hieu_ung_9,gia_tri_9,mo_ta_9,mau,mo_ta])=>({id,nhan_vat,gioi_tinh,ten_bo,vu_khi_loai,vu_khi,tay_trai_loai,tay_trai,mu,ao,quan,gang,giay,canh,thu_cuoi,thu_cuoi_loai,moc_3,moc_5,moc_7,hieu_ung_9,gia_tri_9,mo_ta_9,mau,mo_ta})),
// Đồ thần: báu vật trong thần thoại, truyền thuyết. Rơi rất hiếm từ trùm cuối.
do_than:[
 ['than-roi-sat','Roi sắt Thánh Gióng','hand','sword','one',40,0,0,'','#3c3f44','wave',80,'Mỗi đòn thứ 4 tung sóng lửa 80% sát thương'],
 ['than-ngua-sat','Ngựa sắt Thánh Gióng','mount','mount','',0,10,1.9,'horse','#4a4d52','burn',40,'Ngựa phun lửa: đòn đánh gây bỏng thêm 40% sát thương'],
 ['than-giap-sat','Giáp sắt Thánh Gióng','armor','armor','',0,40,0,'','#5a5e64','shield',30,'Mỗi 10 giây nhận lá chắn bằng 30% máu tối đa'],
 ['than-no-kim-quy','Nỏ thần Kim Quy','hand','crossbow','two',60,0,0,'','#c9a24a','execute',20,'Kết liễu quái thường còn dưới 20% máu'],
 ['than-kiem-thuan-thien','Kiếm Thuận Thiên','hand','sword','one',45,0,0,'','#9ff0d0','lifesteal',12,'Hút 12% sát thương gây ra thành máu'],
 ['than-gay-chu-dong-tu','Gậy thần Chử Đồng Tử','hand','staff','one',38,0,0,'','#e6d28a','heal',3,'Hồi 3% máu tối đa mỗi giây'],
 ['than-non-chu-dong-tu','Nón thần Chử Đồng Tử','hat','hat','',0,20,0,'','#f0dc90','revive',60,'Hồi sinh tại chỗ một lần mỗi 5 phút với 60% máu'],
 ['than-canh-au-co','Cánh tiên Âu Cơ','wings','wings','',0,18,0,'','#ffd1ec','haste',50,'Hạ quái tăng 50% tốc đánh và tốc chạy trong 4 giây'],
 ['than-khien-lac-long','Khiên vảy rồng Lạc Long Quân','hand','shield','one',0,35,0,'','#4fb3a8','stun',20,'Đòn đánh có 20% làm quái choáng 1 giây'],
 ['than-giay-son-tinh','Giày mây Sơn Tinh','shoes','shoes','',0,16,0,'','#a8d08d','counter',150,'Sau khi né, đòn kế tiếp gây thêm 150%'],
 ['than-gang-thuy-tinh','Bao tay sóng nước Thủy Tinh','gloves','gloves','',0,16,0,'','#5fb6ff','cleave',50,'Đòn thường lan 50% sát thương sang quái gần']
].map(([id,ten,o,loai,cam,cong,thu,toc,thu_cuoi,mau,hieu_ung,gia_tri,mo_ta])=>({id,ten,o,loai,cam,cong,thu,toc:Math.round(toc*100),thu_cuoi,mau,hieu_ung,gia_tri,mo_ta,gia:20000})),
// Quái vật. boss: 1 = trùm, 2 = trùm cuối. Tỉ lệ rơi đồ tính theo phần vạn (100 = 1%). loai_sat_thuong: thuong | hoan_hao | huyen_thoai | than
quai:[
 ['deer','Hươu',60,0,60,190,16,44,0,0,0,0,8,1,0,12,.08,.012,.0008,0,'0-0','thuong',0],
 ['lion','Sư tử',150,11,70,165,18,40,240,50,1.2,.38,25,.6,0,15,.08,.012,.0008,0,'0-0','thuong',5],
 ['elephant','Voi rừng',420,20,45,95,28,72,0,72,1.9,.65,60,.15,0,20,.1,.015,.001,0,'0-0','thuong',5],
 ['croc','Cá sấu',190,15,35,150,20,20,150,58,1.5,.3,35,.5,0,15,.08,.012,.0008,0,'0-0','thuong',5],
 ['chua-son-lam','Chúa Sơn Lâm',2500,28,80,150,30,64,260,74,1.4,.5,300,.1,1,120,.6,.25,.04,0,'3-10','huyen_thoai',15],
 ['ngu-tinh','Ngư Tinh',6000,40,40,110,40,80,280,120,2.2,.8,1000,.05,2,300,.8,.5,.12,.015,'10-30','than',20],
 // v9.8 · ba vùng mới, quái mạnh gấp 2–3 lần rừng Đông Ngạn; chỉ rơi đồ từ Hoàn hảo trở xuống (huyền thoại, thần = 0)
 // Sa mạc (phía bắc rừng Đông Ngạn)
 ['bo-cap','Bọ cạp cát',380,26,55,160,22,30,240,56,1.3,.4,60,.4,0,18,.12,.025,0,0,'0-0','thuong',8],
 ['ken-ken','Kền kền',300,24,80,210,22,52,280,60,1.1,.35,55,.5,0,18,.12,.025,0,0,'0-0','thuong',8],
 ['chan-tinh','Chằn Tinh',6500,60,45,120,44,86,280,110,2,.7,1500,.08,1,240,.7,.35,0,0,'5-15','hoan_hao',15],
 ['thach-tinh','Thạch Tinh',8000,64,40,105,46,112,260,104,2.2,.8,1700,.05,1,260,.72,.36,0,0,'6-16','hoan_hao',15],
 // Núi tuyết (phía tây làng)
 ['soi-tuyet','Sói tuyết',420,30,90,220,20,38,300,54,1,.3,70,.5,0,18,.13,.028,0,0,'0-0','thuong',10],
 ['gau-nui','Gấu ngựa',1050,45,45,130,28,60,220,70,1.8,.6,110,.2,0,22,.15,.03,0,0,'0-0','thuong',8],
 ['ho-tinh','Hồ Tinh chín đuôi',7500,66,80,170,40,84,300,110,1.6,.6,1800,.08,1,240,.75,.38,0,0,'6-18','hoan_hao',18],
 // Hang động (phía nam rừng Đông Ngạn)
 ['doi-quy','Dơi quỷ',450,34,95,230,20,56,260,52,1,.3,75,.4,0,18,.14,.03,0,0,'0-0','thuong',10],
 ['nhen-doc','Nhện độc',1200,52,50,150,28,32,240,64,1.6,.5,120,.25,0,22,.16,.032,0,0,'0-0','thuong',10],
 ['dai-bang','Đại Bàng Tinh',9000,75,70,190,46,100,320,120,1.8,.65,2200,.06,1,240,.8,.4,0,0,'8-20','hoan_hao',20]
].map(([id,ten,mau,sat_thuong,toc_do,toc_chay,ban_kinh,cao,tam_danh,tam_gan,hoi_chieu,vung_tay,dong,day_lui,boss,hoi_sinh_giay,ti_le_dep,ti_le_hoan_hao,ti_le_huyen_thoai,ti_le_than,hong_ngoc,loai_sat_thuong,ti_le_x2])=>{const [ha,hb]=hong_ngoc.split('-').map(Number),v=x=>Math.round(x*10000);return {id,ten,mau,sat_thuong,toc_do,toc_chay,ban_kinh,cao,tam_danh,tam_gan,hoi_chieu_ms:Math.round(hoi_chieu*1000),vung_tay_ms:Math.round(vung_tay*1000),dong,day_lui_phan_tram:Math.round(day_lui*100),boss,hoi_sinh_giay,dep_phan_van:v(ti_le_dep),hoan_hao_phan_van:v(ti_le_hoan_hao),huyen_thoai_phan_van:v(ti_le_huyen_thoai),than_phan_van:v(ti_le_than),hong_ngoc_it:ha,hong_ngoc_nhieu:hb,loai_sat_thuong,ti_le_x2,kinh_nghiem:{deer:8,lion:20,elephant:50,croc:25,'chua-son-lam':300,'ngu-tinh':800,'bo-cap':45,'ken-ken':40,'chan-tinh':900,'thach-tinh':1000,'soi-tuyet':55,'gau-nui':110,'ho-tinh':1200,'doi-quy':60,'nhen-doc':130,'dai-bang':1500}[id]||0};}),
nhiem_vu:[
 ['q-huou','Săn hươu','Dân làng cần thịt hươu cho hội làng.','deer',5,200,0,'','','khong'],
 ['q-su-tu','Trừ sư tử','Sư tử bên Đông Ngạn hay vồ người đi rừng.','lion',3,500,0,'','','khong'],
 ['q-ca-sau','Diệt cá sấu','Cá sấu rình ở bến sông, dân không dám lấy nước.','croc',3,500,0,'','','khong'],
 ['q-voi','Đuổi voi rừng','Voi rừng phá nương rẫy phía đông.','elephant',2,800,0,'','','khong'],
 ['q-chua-son-lam','Hạ Chúa Sơn Lâm','Con hổ chúa ở rừng đông bắc đã giết nhiều thợ săn.','chua-son-lam',1,10000,0,'','','khong'],
 ['q-ngu-tinh','Trừ Ngư Tinh','Ngư Tinh nổi lên ở đầm phía đông nam, dâng nước hại dân.','ngu-tinh',1,30000,0,'','','khong'],
 ['q-bo-cap','Bọ cạp sa mạc','Lái buôn qua sa mạc phía bắc rừng Đông Ngạn bị bọ cạp cát đốt.','bo-cap',5,2000,0,'','','khong'],
 ['q-chan-tinh','Diệt Chằn Tinh','Chằn Tinh cuộn mình trong tháp cổ giữa sa mạc, đòi người nộp mạng.','chan-tinh',1,20000,0,'','','khong'],
 ['q-thach-tinh','Phá Thạch Tinh','Thạch Tinh thức dậy ở góc tây nam sa mạc, đá lăn chặn đường lái buôn.','thach-tinh',1,22000,0,'','','khong'],
 ['q-soi-tuyet','Đàn sói tuyết','Sói tuyết từ núi phía tây làng xuống bắt gia súc.','soi-tuyet',5,2500,0,'','','khong'],
 ['q-ho-tinh','Trừ Hồ Tinh','Hồ Tinh chín đuôi ẩn trên đỉnh núi tuyết, mê hoặc người lên núi.','ho-tinh',1,25000,0,'','','khong'],
 ['q-nhen-doc','Ổ nhện độc','Nhện độc giăng tơ kín hang động phía nam rừng Đông Ngạn.','nhen-doc',3,3000,0,'','','khong'],
 ['q-dai-bang','Hạ Đại Bàng Tinh','Đại Bàng Tinh làm tổ trong hang đá thạch nhũ, bắt người về hang.','dai-bang',1,30000,0,'','','khong']
].map(([id,ten,mo_ta,muc_tieu,so_luong,thuong_dong,thuong_hong_ngoc,thuong_do,pham_chat_do,lap_lai])=>({id,ten,mo_ta,muc_tieu,so_luong,thuong_dong,thuong_hong_ngoc,thuong_do,pham_chat_do,lap_lai,thuong_kinh_nghiem:Math.round(thuong_dong/10)})),
// Vùng đất: cấp tối thiểu để vào (cổng, bảng Bản đồ) và nhận việc; biểu tượng ở bảng Bản đồ. 10 vùng cấp 20–100 nối thêm từ 01-data-vung.js
ban_do:[
 {id:'thanh-moc',ten:'Làng Thanh Mộc',cap:1,bieu_tuong:'home',thu_tu:1},
 {id:'hang-dong',ten:'Hang động',cap:5,bieu_tuong:'light',thu_tu:2},
 {id:'sa-mac',ten:'Sa mạc',cap:10,bieu_tuong:'flame',thu_tu:3},
 {id:'nui-tuyet',ten:'Núi tuyết',cap:15,bieu_tuong:'ice',thu_tu:4}
],
linh:[
 ['dan-binh','Dân binh','m',100,5,12,8,12,4,'spear,hat','Lính giáo rẻ, máu trâu'],
 ['cung-thu','Nữ cung thủ','f',300,5,10,14,8,6,'bow,shoes','Bắn từ xa'],
 ['vo-si','Võ sĩ','m',600,8,16,10,14,4,'sword,shield,armor','Kiếm khiên, chịu đòn tốt'],
 ['dao-si','Đạo sĩ trẻ','m',800,6,6,8,10,20,'staff-jade,hat','Bắn cầu phép'],
 ['nu-tuong','Nữ tướng','f',1200,10,18,14,14,6,'sword-iron,sword-iron,armor-leather','Song kiếm, đánh nhanh']
].map(([id,ten,gioi_tinh,gia,menh_lenh,suc_manh,nhanh_nhen,suc_khoe,tri_tue,trang_bi,mo_ta])=>({id,ten,gioi_tinh,gia,menh_lenh,suc_manh,nhanh_nhen,suc_khoe,tri_tue,trang_bi,mo_ta}))
};

/* ================= v10.11: Phấn Son (mỹ phẩm), cốt truyện "Tìm con", Thầy đồ hỏi thư pháp, lính thành trì ================= */
{
  const DRIVE=id=>'https://drive.google.com/file/d/'+id+'/view';
  // Mỹ phẩm (ô 'cos'): thẻ avatar (thay ảnh chân dung), nền hồ sơ (nền khung trên của game), thuốc đa nhiệm (hiệu ứng tên nhân vật). v10.12: bỏ khung avatar; mua xong áp dụng ngay, không qua túi
  // Mua bằng hồng ngọc ở Chủ tiệm Phấn Son. Dùng xong vào bộ sưu tập, đổi qua lại ở bảng Diện mạo. Ảnh: link Drive (cột anh) — thay ảnh thì sửa link trong tab vat_pham.
  const COS=[
   ['av-tuong-quan','Thẻ avatar Tướng quân','avatar',40,'1LUSY5q3cEGNu4VECWZGa_VOalCcphoUx'],['av-hiep-khach','Thẻ avatar Hiệp khách','avatar',40,'1_9hVbAhxETPwldlFvRDfe9e68-cZu0Yu'],
   ['av-phi-tan','Thẻ avatar Phi Tần','avatar',40,'1jVlcjR4RDojr-Q9LSx6ywwmElINgtMJd'],['av-my-nu-sen','Thẻ avatar Mỹ nữ bên hoa sen','avatar',40,'1Zjjc7Sqp_J-v0ckeA7UbamopSTXY_BQN'],
   ['av-minh-hong','Thẻ avatar Minh Hồng','avatar',80,'1mHxTCbL1vxiveuALFl6cdY-Ajwew2vpJ'],['av-vuong-gia','Thẻ avatar Vương Gia Lãng Tử','avatar',80,'15dbYhpGHNrYIluqQy77_-ZLoNX4IK0Om'],
   ['av-bach-kim','Thẻ avatar Bạch Kim Quang Mỹ Nữ','avatar',80,'11VnNVYq69-5o5MDsH4O4dzdJgUhmdQrL'],['av-mau-don','Thẻ avatar Mẫu Đơn','avatar',80,'18bul53I9se1-05F0SZ8yfmMmtlv5NaOH'],['av-cuu-vi','Thẻ avatar Cửu Vĩ Hồ Ly Tinh','avatar',200,'1DSHau53kj7bF2y7_NvLrUYroAR9RlylB'],
   ['nen-ca','Nền hồ sơ Cá','nen',60,'1vKX-YFQvcFS-6R6L5cxIewU7bN58co4Z'],['nen-lau-dai','Nền hồ sơ Lâu đài','nen',60,'1e0BY_CCZOErhaiAcIIaQmv--gxYgC7R0'],['nen-nui','Nền hồ sơ Núi','nen',60,'1I9axl3vT4v4oooskc6slprQqOAV-Usqi'],['nen-trang','Nền hồ sơ Trăng','nen',60,'1ZVeQIWPwsMS66the145Tye9rlDgmViSJ'],
   ['nen-hong-nhat','Nền hồ sơ Hồng Nhật','nen',120,'1VZ5c_m99jsLeUqQ2ulSonB67v4O203rD'],['nen-cuu-vi','Nền hồ sơ Cửu vĩ hồ ly','nen',200,'1KyQHKTBKXBu1mOBXTTCR2Uj22D4j4YoS'],
   ['thuoc-da-nhiem','Thuốc đa nhiệm','thuoc',30,'1Jeb6RLbkOBphWIdBml68c0BgOAciYwnX']
  ];
  const COS_MOTA={avatar:'Mua xong thay ngay ảnh chân dung ở khung trên và lều nhân vật (giữ mãi, đổi qua lại ở bảng Phấn Son)',nen:'Thay nền khung trên của game',thuoc:'Uống vào chọn một hiệu ứng cho tên nhân vật: ánh vàng, cầu vồng, lửa, băng, tím mộng'};
  for(const [id,ten,loai,gia_hong_ngoc,drv] of COS)GAME_DATA.vat_pham.push({id,ten,o:'cos',loai,cam:'',cong:0,thu:0,toc:0,gia:0,mau:'',thu_cuoi:'',menh_lenh:0,he:'',pham_chat:'',hieu_ung:'',gia_tri:0,mo_ta:COS_MOTA[loai],gia_hong_ngoc,anh:DRIVE(drv)});
  GAME_DATA.cua_hang.push(...COS.map(([id],i)=>({cua_hang:'phan-son',id,pham_chat:'n',gia:'',thu_tu:i+1,bac:0})));
  // Vật phẩm cốt truyện (ô 'quest'): không mặc, không bán, không rơi — manh mối tìm con gái
  const QI=[
   ['but-long','Bút Lông','1hCTzUeg0kJM9bbiho5v-IaBQvfhfoUgA','Cây bút lông nhỏ, cán khắc chữ "An". Con bé vẫn hay cắn cán bút khi tập viết.'],
   ['giay-muc','Giấy và mực','160eR2F_DzmffC3EN8z74NSC7-MC_xg7m','Tờ giấy dó còn vết mực loang, góc giấy có nét chữ con gái viết dở: "Bố ơi…"'],
   ['gia-treo-but','Giá treo bút','12zNWrsPoBfv25BgP1PMpKI21WLA2eDuG','Giá treo bút bằng gỗ, mặt sau khắc hình con cá — món quà sinh nhật bố tặng con năm ngoái.'],
   ['nghien-da','Nghiên đá','1AvnoWSoZx-1i00HZOgWOAczwoJ3h8LOU','Nghiên mực còn ẩm. Dưới đáy có vẽ mũi tên chỉ về hướng kinh thành.'],
   ['an-thanh-dien','Ấn Thanh Điền Thạch','1yHTGPfsbLnGBVy-7GyVp_xhllt85TLOs','Phôi đá Thanh Điền khắc dở chữ "Bình An". Tướng giặc giữ nó trong ngực áo.'],
   ['an-ba-lam','Ấn Ba Lâm Thạch','1xw9kNZjckB4LHseVwtAMjEggvnJ0zFIZ','Ấn đá Ba Lâm hình tròn, mặt khắc tên con bé. Ai đó đã dùng nó đóng lên một bức thư.'],
   ['an-xuong-hoa','Ấn Xương Hoá Thạch','1o1UZagjjarAkLRHv78xOG_1iMfp0y1Gf','Ấn Xương Hoá vân đỏ như máu gà. Khắc trên đó: "Thiên Đình — tầng cao nhất".'],
   ['an-tho-son','Ấn Thọ Sơn Thạch','1GtEYIXVVBPJ8sunCWL0lR-DzDJgSVCyq','Ấn Thọ Sơn — chìa khóa mở cửa Thiên Đình. Con gái đang ở ngay sau cánh cửa ấy.']
  ];
  for(const [id,ten,drv,mo_ta] of QI)GAME_DATA.vat_pham.push({id,ten,o:'quest',loai:'quest',cam:'',cong:0,thu:0,toc:0,gia:0,mau:'#e8c070',thu_cuoi:'',menh_lenh:0,he:'',pham_chat:'',hieu_ung:'',gia_tri:0,mo_ta,gia_hong_ngoc:0,anh:DRIVE(drv)});
  // Cốt truyện "Tìm con": người cha xuyên vào game, phải đánh phá từng vùng để lần theo manh mối cứu con gái bị lạc. 8 việc nối tiếp nhau (yeu_cau = việc trước), rải từ vùng cấp 20 tới Thiên Đình.
  // v10.12: mỗi việc do một NPC giao (npc, noi = bản đồ của NPC); bảng nhiệm vụ chỉ báo NPC nào có việc, phải tới gặp mới biết việc
  const STORY_NPC={'tc-1':['thay-do','thanh-moc','Thầy đồ'],'tc-2':['wizard','thanh-moc','Đạo sĩ'],'tc-3':['su-thay','co-loa','Sư thầy'],'tc-4':['vu-cong','co-loa','Vũ công'],'tc-5':['ca-nu','thang-long','Ca nữ'],'tc-6':['nghe-nhan','thang-long','Nghệ nhân đèn'],'tc-7':['ca-tru','hoa-lu','Ca nương'],'tc-8':['cung-nu','phu-xuan','Cung nữ']};
  const STORY=[ // [id, tên, vùng, quái, số, đồ thưởng, mô tả, lời kết (hiện khi trả việc)]
   ['tc-1','Dấu vết đầu tiên','rung-truc','khi-rung',8,'but-long','Lũ khỉ rừng trúc cướp được một cây bút lông nhỏ. Bạn nhận ra cán bút khắc chữ "An" — tên con gái mình.','Bút của con bé! Nó đã đi qua đây. Trên cán bút còn dính vết bùn đầm lầy… không, là mây — nó bị kéo lên Đỉnh Mây.'],
   ['tc-2','Nét chữ dở dang','dinh-may','ung-tuyet',8,'giay-muc','Ưng tuyết trên Đỉnh Mây tha về tổ những mẩu giấy. Một tờ có nét chữ con gái bạn.','"Bố ơi, người ta đưa con ra biển…" Chữ run run nhưng vẫn đúng bút thuận bố dạy. Ra Bãi Biển Hoang!'],
   ['tc-3','Món quà sinh nhật','bien-dong','cua-khong-lo',8,'gia-treo-but','Cua khổng lồ ngoài bãi biển kẹp giữ một giá treo bút bằng gỗ, mặt sau khắc hình con cá.','Giá treo bút bố tặng con năm ngoái. Vết kéo lê trên cát dẫn vào Rừng Ma.'],
   ['tc-4','Mũi tên dưới đáy nghiên','rung-ma','quy-cay',8,'nghien-da','Quỷ cây trong Rừng Ma nuốt một nghiên mực còn ẩm.','Đáy nghiên vẽ mũi tên chỉ về kinh thành. Thăng Long đang có phản loạn — con bé bị giữ ở đó.'],
   ['tc-5','Trong ngực áo tướng giặc','thang-long','hac-long-tuong',1,'an-thanh-dien','Hắc Long Tướng cầm đầu phản quân Thăng Long giữ một phôi đá Thanh Điền khắc dở chữ "Bình An".','Hắn khai: "Con bé được đưa về Hoang Mạc Xương, cho Hắc Mộ Vương." Bạn siết chặt ấn đá, lên đường.'],
   ['tc-6','Bức thư đóng ấn','hoang-mac-xuong','xuong-kho',8,'an-ba-lam','Xương khô ngoài hoang mạc ôm theo một bức thư đóng ấn Ba Lâm — ấn khắc tên con gái bạn.','Thư viết: "Đưa nó ra Đảo Rồng, đổi lấy chìa khóa Thiên Đình." Hải Long Vương là kẻ nhận hàng.'],
   ['tc-7','Vân đỏ Xương Hoá','dao-rong','hai-long-vuong',1,'an-xuong-hoa','Hải Long Vương ngoài Đảo Rồng giữ ấn Xương Hoá vân đỏ.','Trên ấn khắc: "Thiên Đình — tầng cao nhất". Chỉ còn một cánh cửa nữa. Hắc Thiên Ma đang giữ chìa khóa.'],
   ['tc-8','Cánh cửa Thiên Đình','thien-dinh','hac-thien-ma',1,'an-tho-son','Hắc Thiên Ma trên Thiên Đình giữ ấn Thọ Sơn — chìa khóa mở cánh cửa nơi con gái bạn bị nhốt.','Cánh cửa mở. Con bé ngồi giữa phòng, tay vẫn cầm bút tập viết. "Bố!" — Bạn đã phá đảo và tìm được con. Hành trình vẫn còn dài, nhưng từ nay hai cha con đi cùng nhau.']
  ];
  STORY.forEach(([id,ten,vung,muc_tieu,so_luong,thuong_do,mo_ta,loi_ket],i)=>GAME_DATA.nhiem_vu.push({id,ten,mo_ta,muc_tieu,so_luong,thuong_dong:2000*(i+1)*(i+1),thuong_hong_ngoc:5+i*5,thuong_do,pham_chat_do:'n',lap_lai:'khong',thuong_kinh_nghiem:800*(i+1)*(i+1),yeu_cau:i?STORY[i-1][0]:'',loi_ket,truyen:1,npc:STORY_NPC[id][0],noi:STORY_NPC[id][1],npc_ten:STORY_NPC[id][2]}));
  // Thầy đồ (làng, thành trì): bộ câu hỏi thư pháp từ sách "Thư pháp Việt". Máy chủ đọc tab CauHoi của bảng OCD_Quest (xem Code.gs LH_NGOAI); dưới đây là bộ mặc định khi chưa đọc được.
  // Trả lời sai quá quiz_sai_toi_da hoặc chọn "chưa biết" → Thầy đồ giao việc săn quái (quai × so_luong, quái của vùng tương ứng); săn xong thầy chỉ đáp án đúng, chọn lại được thưởng (quiz_thuong_lo %).
  const MAPSEQ=['rung-truc','dam-lay','dinh-may','co-loa','bien-dong','nui-lua','rung-ma','bang-nguyen','thang-long','cuu-trung','thuy-cung','hoang-mac-xuong','thien-son','hoa-lu','dia-nguc-mon','dao-rong','vuc-yeu-tinh','cung-trang','phu-xuan','thien-dinh'];
  const MAPMOB={'rung-truc':'khi-rung','dam-lay':'dia-khong-lo','dinh-may':'ung-tuyet','co-loa':'am-binh','bien-dong':'cua-khong-lo','nui-lua':'nham-thach-thu','rung-ma':'ma-troi','bang-nguyen':'voi-ma-mut','thang-long':'phan-quan','cuu-trung':'thien-binh','thuy-cung':'tom-tuong','hoang-mac-xuong':'xuong-kho','thien-son':'tien-hac','hoa-lu':'tho-phi','dia-nguc-mon':'nguu-dau','dao-rong':'giao-long','vuc-yeu-tinh':'ho-ly','cung-trang':'tho-ngoc','phu-xuan':'ngu-lam-phan','thien-dinh':'thien-tuong'};
  // v10.13: chỉ còn các bộ DX_* (bộ NV*, SKQ* bị bỏ, máy chủ cũng lọc); 3 bộ gắn 3 vùng đầu
  const BO=[['DX_AN_CHUONG','Ấn chương',10],['DX_VUONG_HI_CHI','Vương Hi Chi',12],['DX_AU_DUONG_TUAN','Âu Dương Tuân',15]];
  GAME_DATA.bo_cau_hoi=BO.map(([id,ten,thuong_hong_ngoc],i)=>({id,ten,thu_tu:i+1,thuong_hong_ngoc,quai:MAPMOB[MAPSEQ[i]],so_luong:8,ban_do:MAPSEQ[i]}));
  const CH=[ // [bộ, câu, A, B, C, D, đáp án] — chép từ bảng OCD_Quest tab CauHoi (3 bộ DX_*)
   ['DX_AN_CHUONG','Ấn âm văn tạo dấu như thế nào trên giấy?','Chữ đỏ, nền trắng','Chữ đen, nền đỏ','Chữ trắng, nền đỏ','Chữ đỏ, nền đen','C'],
   ['DX_AN_CHUONG','Ấn dương văn có đặc điểm nào?','Chữ khắc nổi, in ra chữ đỏ','Khắc chìm, dấu chữ trắng trên nền đỏ','Khắc nổi, dấu chữ trắng trên nền đỏ','Khắc nổi, in ra chữ đen','A'],
   ['DX_AN_CHUONG','Vì sao cần trộn đều chu sa trước khi đóng ấn?','Để chu sa khô nhanh và bám giấy hơn','Để màu đỏ chuyển sang sắc đen','Để mặt ấn được phủ kín bằng dầu','Để dầu và phần thịt hòa đều, hạn chế loang dầu','D'],
   ['DX_AN_CHUONG','Danh chương chủ yếu giúp người xem biết điều gì?','Cho biết loại giấy và kích thước tác phẩm','Ai là người viết tác phẩm','Ghi lại nội dung chính của tác phẩm','Đánh dấu vị trí cần bồi biểu','B'],
   ['DX_AN_CHUONG','Theo bài đọc, kích thước con dấu nên thế nào?','Lớn hơn chữ chính văn để tạo điểm nhấn','Luôn giữ cùng kích thước bất kể chính văn','Bằng hoặc nhỏ hơn chữ chính văn','Tỷ lệ phải dựa theo khổ giấy, không xét chữ chính văn','C'],
   ['DX_VUONG_HI_CHI','Theo bài viết, tên tự của Vương Hi Chi là gì?','Hữu Quân','Dật Thiếu','Hiến Chi','Thảo Thánh','B'],
   ['DX_VUONG_HI_CHI','Tác phẩm Lan Đình Tự được Vương Hi Chi viết trong hoàn cảnh nào theo bài viết?','Trong một buổi tế lễ tại triều đình','Sau khi dâng thư lên hoàng đế','Trong chuyến đi sứ đến kinh đô','Trong một buổi tụ họp bạn hữu, uống rượu và làm thơ','D'],
   ['DX_VUONG_HI_CHI','Vì sao chiếc ao được gọi là Mặc Trì theo câu chuyện trong bài?','Vì ông thường rửa bút ở đó khiến nước ao đen dần','Vì nước ao vốn có màu đen tự nhiên','Vì ao nằm cạnh nơi chế mực của địa phương','Vì tên ao được đặt theo hình dáng giống nghiên mực','A'],
   ['DX_VUONG_HI_CHI','Theo bài viết, việc quan sát ngỗng giúp Vương Hi Chi học được điều gì?','Cách phối hợp lực ngón tay để giữ bút','Cách điều chỉnh độ đậm nhạt của mực','Cách vận dụng cổ tay linh hoạt','Cách giữ quản bút thẳng đứng suốt quá trình viết','C'],
   ['DX_VUONG_HI_CHI','Điều gì đã xảy ra với bản gốc Lan Đình Tự theo bài viết?','Bản gốc được lưu giữ nguyên vẹn tại một thư viện ở Sơn Âm','Bản gốc thất lạc, về sau chỉ còn các bản được người đời lâm mô','Bản gốc thất lạc, về sau còn các bản lâm mô','Bản gốc còn nguyên trên tấm bia tại Lan Đình','B'],
   ['DX_AU_DUONG_TUAN','Âu Dương Tuân sinh vào năm nào và qua đời vào năm nào?','498–563','538–570','625–691','557–641','D'],
   ['DX_AU_DUONG_TUAN','Sau biến cố của cha, ai đã nhận nuôi và dạy Âu Dương Tuân học chữ, thư tịch?','Ngu Thế Nam','Giang Tổng','Trần Thúc Đạt','Bùi Củ','B'],
   ['DX_AU_DUONG_TUAN','Năm 624, Âu Dương Tuân cùng các cộng sự phụng chiếu biên soạn bộ sách nào?','Tùy thư','Ngụy thư','Nghệ văn loại tụ','Văn tuyển','C'],
   ['DX_AU_DUONG_TUAN','Đặc điểm nào phù hợp nhất với phong cách Âu thể trong bài viết?','Kết cấu nghiêm cẩn, bút lực cương kiện, thế chữ hiểm mà vững','Phong cách phóng túng, thiên về chữ Thảo và giảm thiểu quy phạm','Nét mềm tròn, ít phân biệt trọng tâm và kết cấu','Chủ yếu dựa vào tốc độ, không chú trọng pháp tắc','A'],
   ['DX_AU_DUONG_TUAN','Khi bắt gặp bia do Sách Tĩnh viết, Âu Dương Tuân đã làm gì?','Chép lại bia trong một buổi rồi lập tức rời đi','Xin mang bia về thư phòng để nghiên cứu','Trở lại vào dịp khác để so sánh với các bản thác','Ở lại ba ngày để quan sát và nghiền ngẫm từng nét','D']
  ];
  {const n={};GAME_DATA.cau_hoi=CH.map(([bo,cau,a,b,c,d,dap_an])=>{n[bo]=(n[bo]||0)+1;return {id:bo+'-Q'+String(n[bo]).padStart(2,'0'),bo,thu_tu:n[bo],cau,a,b,c,d,dap_an};});}
  // Lính thành trì (cột thanh): chỉ thuê được ở thành đó, chỉ số cao, đồ theo thành; mỗi ngày nhận ngẫu nhiên một kỹ năng sách (hệ) — xem Player.mercDaily
  const ML=[ // [id, tên, giới, giá, mệnh lệnh, sức mạnh, nhanh nhẹn, sức khỏe, trí tuệ, trang bị, mô tả, thành]
   ['linh-au-lac','Lính Âu Lạc','m',8000,12,34,22,30,10,'kiem-co-loa,khien-co-loa,giap-co-loa','Lính thành Cổ Loa, kiếm khiên vững chãi','co-loa'],
   ['no-thu-co-loa','Nỏ thủ Cổ Loa','f',9000,12,24,36,24,12,'cung-co-loa,mu-co-loa,giay-co-loa','Nỏ thần Cổ Loa, bắn xa','co-loa'],
   ['cam-ve-thang-long','Cấm vệ Thăng Long','m',30000,16,60,40,56,16,'kiem-thang-long,khien-thang-long,giap-thang-long,mu-thang-long','Cấm quân kinh thành, chịu đòn cực tốt','thang-long'],
   ['phap-su-thang-long','Pháp sư hoàng cung','f',32000,16,20,36,40,70,'gay-thang-long,mu-thang-long,giay-thang-long','Phép thuật diện rộng','thang-long'],
   ['vo-si-hoa-lu','Võ sĩ Hoa Lư','m',80000,20,90,60,86,20,'kiem-hoa-lu,kiem-hoa-lu,giap-hoa-lu,quan-hoa-lu','Song kiếm Trường Yên, đánh nhanh','hoa-lu'],
   ['xa-thu-hoa-lu','Xạ thủ Hoa Lư','f',85000,20,50,96,60,30,'cung-hoa-lu,mu-hoa-lu,gang-hoa-lu,giay-hoa-lu','Bắn tỉa từ xa','hoa-lu'],
   ['ngu-lam-phu-xuan','Ngự lâm Phú Xuân','m',200000,25,130,90,130,30,'giao-phu-xuan,giap-phu-xuan,mu-phu-xuan,quan-phu-xuan','Thương dài ngự lâm, sát thương cao nhất','phu-xuan'],
   ['quoc-su-phu-xuan','Quốc sư Phú Xuân','m',220000,25,40,70,90,140,'gay-phu-xuan,mu-phu-xuan,gang-phu-xuan','Phép thuật thượng thừa','phu-xuan']
  ];
  for(const [id,ten,gioi_tinh,gia,menh_lenh,suc_manh,nhanh_nhen,suc_khoe,tri_tue,trang_bi,mo_ta,thanh] of ML)GAME_DATA.linh.push({id,ten,gioi_tinh,gia,menh_lenh,suc_manh,nhanh_nhen,suc_khoe,tri_tue,trang_bi,mo_ta,thanh});
  GAME_DATA.cau_hinh.push(
   {khoa:'quiz_sai_toi_da',gia_tri:1,ghi_chu:'Thầy đồ: số câu sai tối đa vẫn được thưởng (trong 5 câu)'},
   {khoa:'quiz_lan_thu',gia_tri:2,ghi_chu:'Thầy đồ: trả lời sai quá số lần này thì phải đi săn quái lấy manh mối'},
   {khoa:'quiz_san_so_luong',gia_tri:8,ghi_chu:'Thầy đồ: số quái phải săn để được chỉ đáp án (bỏ trống cột so_luong ở bo_cau_hoi thì dùng số này)'},
   {khoa:'quiz_thuong_lo',gia_tri:50,ghi_chu:'Thầy đồ: % thưởng khi trả lời sau khi được chỉ đáp án'},
   {khoa:'quiz_kinh_nghiem',gia_tri:300,ghi_chu:'Thầy đồ: kinh nghiệm thưởng mỗi bộ câu hỏi (nhân với thứ tự bộ)'},
   {khoa:'chet_mat_do',gia_tri:1,ghi_chu:'Gục ngã thì mất toàn bộ đồ đang mặc (1 = bật, 0 = tắt). Cấp, sách, lính, thú thu phục, túi đồ giữ nguyên'},
   {khoa:'linh_thanh_he_so',gia_tri:100,ghi_chu:'Lính thành trì: % chỉ số so với bảng linh (chỉnh độ mạnh chung)'},
   {khoa:'linh_diem_cap',gia_tri:3,ghi_chu:'v10.13 · Lính thành trì chào thuê: điểm chỉ số cộng thêm mỗi cấp (chia ngẫu nhiên vào 4 chỉ số, đổi suất mỗi ngày)'},
   {khoa:'su_kien_phut',gia_tri:5,ghi_chu:'v10.13 · Sự kiện đột xuất ở làng / thành: bao nhiêu phút một lần (theo mốc đồng hồ)'},
   {khoa:'co_may_man_toi_da',gia_tri:10,ghi_chu:'v10.13 · Cỏ may mắn: số cỏ dùng tối đa một lần gia cường / dung hợp (mỗi cỏ +1% tỉ lệ)'}
  );
  // v10.13: quái sự kiện đột xuất (không có trong bãi quái; hiện theo sự kiện ngoài vùng an toàn gần cổng). Máu / sát thương theo cấp vùng.
  const EVM=[ // [id, tên, máu, sát thương, tốc, chạy, bán kính, cao, tầm đánh, tầm gần, hồi chiêu ms, vung tay ms, đồng, đẩy lùi %, hồi sinh, exp, bản đồ]
   ['ke-trom-cho','Kẻ trộm chó',160,6,80,260,22,56,220,50,1100,350,40,30,9999,40,'thanh-moc'],
   ['linh-phuong-bac','Lính phương Bắc',3600,600,70,190,24,58,280,60,1300,450,400,30,9999,500,'co-loa'],
   ['tuong-phuong-bac','Tướng phương Bắc',14000,900,60,160,34,72,320,80,1700,600,2500,15,9999,2500,'co-loa'],
   ['dao-tac','Đạo tặc',110000,4800,80,230,24,56,300,60,1200,400,9000,30,9999,9000,'thang-long'],
   ['ho-du','Hổ dữ sổng chuồng',1500000,21000,90,260,36,60,320,70,1300,450,60000,40,9999,60000,'hoa-lu'],
   ['gian-te','Gian tế áo đen',11000000,64000,95,280,24,56,300,60,1000,350,300000,30,9999,250000,'phu-xuan']
  ];
  for(const [id,ten,mau,sat_thuong,toc_do,toc_chay,ban_kinh,cao,tam_danh,tam_gan,hoi_chieu_ms,vung_tay_ms,dong,day_lui_phan_tram,hoi_sinh_giay,kinh_nghiem,ban_do] of EVM)
    GAME_DATA.quai.push({id,ten,mau,sat_thuong,toc_do,toc_chay,ban_kinh,cao,tam_danh,tam_gan,hoi_chieu_ms,vung_tay_ms,dong,day_lui_phan_tram,boss:0,hoi_sinh_giay,dep_phan_van:1500,hoan_hao_phan_van:350,huyen_thoai_phan_van:0,than_phan_van:0,hong_ngoc_it:0,hong_ngoc_nhieu:0,loai_sat_thuong:'thuong',ti_le_x2:10,kinh_nghiem,ban_do,ky_nang:''});
}
