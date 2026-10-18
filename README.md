# Lữ Hành · Làng Thanh Mộc

Webgame nhập vai phiêu lưu, phong cách làng Việt xưa. Chạy trên Blogspot, máy chủ là Google Apps Script, dữ liệu nằm trong Google Sheets.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/` | Mã nguồn, tách theo phần: `01-data.js` dữ liệu mặc định (giống các Sheet) · `02-core.js` lõi máy chủ dùng chung cho Apps Script và chế độ ngoại tuyến · `03-net.js` kết nối máy chủ · `04-world.js` bản đồ · `05-player.js` luật chơi (chỉ số, trang bị, phẩm chất, gia cường, nhiệm vụ, lính) · `06-game.js` vòng lặp game · `07-ui.js` giao diện · `08-portal.js` đăng nhập, tạo nhân vật · `style.css`, `body.html` |
| `dist/` | Bản đóng gói, **không sửa tay**: `lu-hanh.js` + `lu-hanh.css` để Blogspot nạp qua jsDelivr; `lu-hanh.html` là bản một file (mở thẳng để chơi thử ngoại tuyến) |
| `apps-script/` | `Code.gs` để dán vào Apps Script (sinh tự động từ `gs-adapter.js` + dữ liệu + lõi); `sheet-ids.json` là ID các file Sheet |
| `blogspot/` | Đoạn HTML ngắn để dán vào Blogspot |
| `tools/build.mjs` | Đóng gói lại `dist/` và `Code.gs` |

## Đưa lên Blogspot

Dán nội dung `blogspot/nhung-vao-blogspot.html` vào bài viết ở chế độ HTML. Đoạn này nạp `dist/lu-hanh-boot.js` (vài KB): hiện màn hình chờ ngay, rồi tải `lu-hanh.css` + `lu-hanh.js` có đếm phần trăm.

`window.LH_API` là URL Web App (đuôi `/exec`), đã điền sẵn máy chủ Việt Nam. Để trống thì game chạy ngoại tuyến, lưu trên trình duyệt (`dist/lu-hanh-offline.html` để thử).

## Chợ phiên (trang riêng)

Trên Blogspot tạo **Trang** mới, đường dẫn `cho-phien`, dán `blogspot/cho-phien.html` (chế độ HTML). Trang này dùng chung tài khoản và máy chủ với game: ký gửi đồ Hoàn hảo, Huyền thoại, Thần, mua đồ, mua nhân vật người khác làm lính đi theo, nhận tiền bán hàng.

## Máy chủ quyết định

Từ v8, tiền, đồ rơi, gia cường, mua bán, nhiệm vụ, lính đều do máy chủ (`05-player.js` chạy trong Apps Script) quyết định. Máy người chơi chỉ gửi lệnh (gom các lần hạ quái, gửi 2,5 giây một lần) và nhận lại trạng thái. Sửa dữ liệu trên trình duyệt không tăng được tiền hay đồ.

## Cấp độ, sách, thú cưỡi (v8.1)

- Hạ quái và trả việc cho Lý trưởng được kinh nghiệm (cột `kinh_nghiem` ở tab `quai`, `thuong_kinh_nghiem` ở tab `nhiem_vu`; Sheet chưa có cột thì máy chủ tự tính: quái = máu/8, việc = đồng thưởng/10). Kinh nghiệm cần lên cấp L = `exp_goc` × L^(`exp_tang`/100). Mỗi cấp được `diem_moi_cap` điểm cộng vào 4 chỉ số. Cấp và kinh nghiệm ghi vào cột `cap`, `kinh_nghiem` của bảng `nhan_vat`.
- Sách gắn vào ô kỹ năng cộng dồn chỉ số (`sach_chi_so`, `sach_moi_cap`); luyện sách ở Đạo sĩ.
- Thú cưỡi gia cường (Lò rèn hoặc Người nuôi thú cưỡi): +1..+6 tốc độ, +7..+10 thêm công, +11..+15 thêm máu, mana, phòng ngự (`thu_cuoi_*`). Lính đánh thuê cưỡi được thú, không tốn Mệnh lệnh của người chơi.

## Sách bí truyền, lính, quái thu phục (v8.2)

- Sách Lôi (lôi quang đánh xuống), Phong (làm chậm), Băng (đóng băng), Ánh sáng (bị đánh trúng thì dọa quái bỏ chạy), Ma công (hạ quái có tỉ lệ thu phục, tăng theo Mệnh lệnh; quái chết là mất). Tỉ lệ trong `cau_hinh`: `loi_*`, `phong_*`, `bang_*`, `sang_*`, `ma_*`, `sach_ti_le_cap`.
- Tối đa 4 lính, đi theo cùng lúc nếu đủ Mệnh lệnh. Lính gục về làng chờ, nhân vật về làng thì nhập đội lại. Điểm lên cấp cộng được vào Mệnh lệnh.
- Thợ rèn gia cường vũ khí, giáp; Người nuôi thú cưỡi gia cường thú; Đạo sĩ luyện sách (máy chủ kiểm tra).

## Phản hồi tức thì (v8.3)

Mua, bán, gia cường, nhiệm vụ, thuê lính, cộng điểm chạy ngay trên máy người chơi bằng cùng luật (`05-player.js`) và cùng chuỗi ngẫu nhiên `rs` với máy chủ, hiện kết quả liền rồi gửi lên máy chủ. Máy chủ tính lại y hệt và lưu; trạng thái máy chủ luôn là chuẩn.

## Vũ khí, Mệnh lệnh, ảnh tĩnh (v8.4)

- Tab `vu_khi` (file Sheet vật phẩm): mỗi loại vũ khí có sát thương (%), tầm đánh, độ lan, thời gian một đòn, mana kỹ năng (%), thời gian hồi kỹ năng (%), nội tại mỗi đòn. Mặc định: sát thương Thương > Kiếm > Khiên > Nỏ > Cung > Gậy; tầm Gậy > Nỏ > Cung > Thương > Kiếm > Khiên; tốc đánh Kiếm > Thương > Khiên > Cung > Nỏ > Gậy; tốn mana và hồi chiêu nhanh Khiên > Cung > Thương > Nỏ > Kiếm > Gậy.
- Mỗi lính đi theo tốn số Mệnh lệnh riêng; bảng lính hiện "Mệnh lệnh đã dùng / tổng" và "Cần X / còn Y" cho từng lính.
- File `LH 11 · Hình ảnh` (tab `hinh_anh`, danh sách sinh tự động ở `apps-script/hinh-anh.csv`): dán link ảnh Google Drive vào cột `link_anh` để thay biểu tượng, đồ dùng, quái, NPC, logo, nền, chân dung, túi đồ rơi. Ô trống hoặc ảnh lỗi thì dùng hình mặc định. Ảnh Drive phải chia sẻ "Bất kỳ ai có đường liên kết".
- Hạ quái: phần thưởng tính ngay trên máy người chơi (cùng chuỗi ngẫu nhiên với máy chủ), túi đồ mở liền rồi mới gửi lên máy chủ.
- Thanh máu trùm: biểu tượng + thanh ngắn cạnh nút phiên bản.

## Một thiết bị, khung vừa màn hình (v8.5)

- Mỗi tài khoản chỉ chơi trên một thiết bị: đăng nhập ở thiết bị mới thì thiết bị cũ bị dừng (máy chủ báo `DANG_NHAP_NOI_KHAC`, game kiểm tra phiên mỗi 20 giây). Cột `token_cu` ở bảng `tai_khoan`.
- Khung game cao đúng phần màn hình nhìn thấy (trừ thanh công cụ trình duyệt điện thoại).
- Chợ phiên nhận ký gửi đồ Hoàn hảo, Huyền thoại, Thần (cột `giao_dich` ở tab `pham_chat`).

## Bản 8.9

- Chợ phiên ký gửi đồ bằng tiền, hồng ngọc hoặc cả hai. Bảng thuê lính hiện hồng ngọc.
- Nhiệm vụ của Lý trưởng chỉ thưởng tiền, làm một lần, xong thì ẩn. Phẩm chất rơi cao nhất của bản đồ: `pham_chat_roi_toi_da` trong `cau_hinh` (mặc định `p` Hoàn hảo).
- Ảnh màn hình chờ, cảnh căn lều: chạy `kiemTra` để thêm các dòng `giao_dien:nen_cho_*`, `nen_leu` vào file Hình ảnh.
- Vẽ lại người: mặt có mắt mũi miệng, viền và bóng, song kiếm cầm hai thanh rõ ràng.

## Bản 9.0: lưu theo mốc

- Mọi việc trong game (hạ quái, mua bán, gia cường, nhiệm vụ, thuê lính, cộng điểm, xếp đồ, vị trí) tính và ghi ngay trên máy (localStorage, khóa `lh-local-<mã nhân vật>`), không gửi máy chủ liên tục.
- Chỉ gửi lên máy chủ rồi tải lại túi đồ, tiền, nhân vật ở các mốc: về làng (vào vùng an toàn), qua cầu (mỗi chiều), gặp Thương nhân, rời cuộc nói chuyện với dân làng (từ 9.2), bấm Lưu, đổi nhân vật. Không tự làm mới theo giờ.
- Còn lệnh chưa lưu: nút menu có chấm cam. Tắt trang khi chưa lưu: lần sau vào game hoặc Chợ phiên, phần còn giữ trên máy được gửi trước khi tải nhân vật.
- Máy chủ (`play`) tính lại từng lệnh theo thời điểm ra lệnh (không sớm hơn lần lưu trước) và cách xếp đồ lúc đó (`lay`), mỗi gói tối đa 600 lệnh, gói gửi lại do rớt mạng (`bid`) không tính hai lần.

## Bản 9.1

- Ảnh đồ trong file Hình ảnh (`vat_pham:<mã>`) giờ hiện cả trên tay nhân vật và lính (kiếm, thương, gậy, khiên), không chỉ trong túi đồ. Ảnh vũ khí nên vẽ chéo: chuôi ở góc dưới trái, mũi ở góc trên phải, nền trong. Cung, nỏ vẫn dùng hình vẽ của game (có động tác kéo dây).
- Dữ liệu Sheet lưu đệm trên máy chủ tối đa 2 phút (trước là 10 phút). Muốn thấy ngay: chạy `xoaBoNhoDem` rồi tải lại trang game.

## Bản 9.2

- Thông báo (đã lưu, thu phục quái…) trên điện thoại hiện một dòng ở chính giữa phía trên, như bản máy tính.
- Thêm mốc lưu: rời cuộc nói chuyện với bất kỳ dân làng nào (bấm Xong ở lời thoại, hoặc đóng bảng cửa hàng / nhận việc / thuê lính / chợ mở từ dân làng).

## Bản 9.3

- **Giao dịch giữa người chơi chuyển vào game, qua Thương nhân** (cuối làng): bày bán / mua đồ ký gửi, thuê nhân vật của người chơi khác, cho thuê nhân vật khác của mình, nhận tiền bán hàng. Trước mỗi giao dịch game lưu hết phần chơi trên máy rồi mới gửi lệnh. Trong lúc chờ máy chủ cả bảng bị khóa (bấm nhanh không dồn lệnh); mua phải chạm 2 lần. Trang Chợ phiên chỉ còn báo "đã dời vào làng".
- **Máy chủ nhẹ hơn:** mỗi lệnh chỉ đọc đúng dòng cần (tìm theo cột), không đọc cả bảng người chơi/chợ. Lệnh ghi có mã `rid`: gửi lại (rớt mạng, đổi GET/POST) thì máy chủ trả kết quả cũ, không làm hai lần. Cho thuê / hủy cho thuê chạy trong khóa (vá lỗi có thể nhân đôi đồ). Hàm `donCho` (lịch 3 giờ sáng hằng ngày, tạo khi chạy `caiDat`) chuyển hàng đã hủy / đã bán và nhận tiền sang tab `cho_cu`.
- **Bộ bản đồ dùng chung:** bản đồ là dữ liệu (`maps/*.json`, xem `maps/README.md`); Thanh Mộc nằm sẵn trong game, bản đồ khác chỉ tải khi bước qua cổng. Vị trí lưu kèm mã bản đồ; gục hoặc "Về làng" ở bản đồ khác thì về Thanh Mộc.

## Bản 9.4: chống đứng hình

- Vòng lặp game không bao giờ dừng vì một lỗi: lỗi được ghi vào nhật ký và báo một dòng, game chạy tiếp.
- Gọi máy chủ quá 25 giây không trả lời thì coi như rớt mạng (trước đây có thể chờ mãi, làm mọi lần lưu sau đó bị kẹt). Lệnh ghi có mã `rid` nên gửi lại không bị làm hai lần.
- Ghi phần chơi xuống máy theo nhịp ~1,5 giây (không ghi mỗi đòn), ghi ngay khi tắt / ẩn trang.
- Menu → **Tình trạng**: phiên bản, còn phần chơi chưa lưu không, 8 lần gọi máy chủ gần nhất (OK / lỗi gì), 8 lỗi trò chơi gần nhất. Gặp sự cố thì chụp màn hình này.

## Bản 9.5

- Sửa lỗi gốc của đứng hình khi đánh quái: quái đang ra đòn mà bị phản đòn chết ngay thì vòng lặp đọc `m.atk.end` của đòn đã bị xóa (`Cannot read properties of null (reading 'end')`). Trước 9.4 lỗi này làm dừng hẳn game; 9.4 bắt được lỗi và hiện thông báo; 9.5 sửa hẳn.

## Bản 9.6

- Rớt mạng thoáng qua khi lưu: lệnh ghi (có mã `rid`) tự gửi lại 1 lần ngay; vẫn lỗi thì tự gửi lại sau 10 giây.
- Thông báo lỗi đúng hơn: đã kết nối được máy chủ trong phiên mà một lần gọi bị rớt thì báo "Mạng chập chờn hoặc máy chủ trả lời chậm" (trước đây báo nhầm là chưa đặt quyền "Bất kỳ ai"). Hạn chờ: lệnh đọc 25 giây, lệnh ghi 45 giây.

## Bản 9.7: đồ vẽ đúng trên người, ảnh vật phẩm

- `src/04-looks.js`: bảng dáng vẻ từng món đồ theo tên / loại (áo choàng, cờ hiệu, cánh, nón lá, nón dấu, mũ trụ, mũ vương, mũ phượng, khăn, trâm, áo bào, giáp vảy, áo da, váy, dép, guốc, hài, ủng, giày mây). Đồ huyền thoại: cả bộ chung bảng màu của vị anh hùng, viền vàng. Đồ thần: màu + hiệu ứng riêng (lửa, ánh vàng, ngọc bích, hào quang, bụi tiên, vảy rồng, mây, sóng nước) quanh nhân vật và trên vũ khí.
- Ảnh vật phẩm game vẽ sẵn (webp 128×128, vẽ bằng đúng các hàm vẽ trên người): `dist/anh/vat_pham/<mã>.webp` (dấu `:` đổi thành `_`). Tạo lại: mở game ngoại tuyến, gọi `mapGame.itemIcon(canvas, mã)`.
- Hàm Apps Script `capNhatAnh`: ghi cột `goi_y` (định dạng webp, cách vẽ khớp nhân vật, bảng màu), thêm cột `gioi_tinh` (Nam / Nữ / Chung) và `ghi_chu` (Huyền thoại / Thần thoại) vào file Hình ảnh; dòng vật phẩm chưa có `link_anh` được chép ảnh vào thư mục Drive (mở quyền xem cho mọi người) và ghi link. Chạy quá 4,5 phút thì dừng, chạy lại để chép tiếp.

## Bản 9.8: ba vùng mới, tải nhẹ hơn

- Bản đồ mới (thư mục `maps/`): **Sa mạc** (cổng ở bìa bắc rừng Đông Ngạn), **Núi tuyết** (cổng ở đầu đường phía tây làng), **Hang động** (cổng ở bìa nam rừng Đông Ngạn). Mỗi vùng có trạm nghỉ an toàn ở cổng vào (lửa trại, giếng cổ hồi máu), 2 loài quái và 1 trùm.
- Quái mạnh gấp 2–3 lần rừng Đông Ngạn: Bọ cạp cát, Kền kền, trùm Chằn Tinh (sa mạc); Sói tuyết, Gấu ngựa, trùm Hồ Tinh chín đuôi (núi tuyết); Dơi quỷ, Nhện độc, trùm Đại Bàng Tinh (hang động). Chỉ rơi đồ từ Hoàn hảo trở xuống. 6 nhiệm vụ mới ở Lý trưởng.
- Mỗi vùng là một gói `dist/maps/<mã>.js` (dữ liệu + hình vẽ nền, cây đá, quái, trời: cát bay, tuyết rơi, bóng tối có đuốc và pha lê), khoảng 13 KB, chỉ tải khi nhân vật tới gần cổng. File game chính không chứa hình vẽ các vùng này.
- `lu-hanh.js` được rút gọn bằng Terser (chép sẵn trong `tools/vendor/terser`, không cần npm): nhỏ hơn khoảng 21%. `lu-hanh.html` (bản dán Google Doc) giữ nguyên để đọc.
- Máy chủ: Sheet `quai`, `nhiem_vu` chưa có dòng mới thì tự dùng số liệu mặc định; chạy `kiemTra` một lần để chép các dòng mới vào Sheet (và dòng ảnh quái mới vào file Hình ảnh) rồi sửa số liệu ở đó.

## Bản 9.9: chọn bản đồ, cấp vào vùng

- **Ô trang bị trống** (mũ, tay, chân, cánh, thú cưỡi, quần, giày…) giờ dùng biểu tượng ô (`bieu_tuong:<ô>` trong file Hình ảnh, ví dụ `bieu_tuong:hat`), không còn lấy nhầm ảnh vật phẩm cùng mã (`vat_pham:hat` là Nón lá, `vat_pham:mount` là Ngựa con…).
- **Thay ảnh mà vẫn thấy ảnh cũ:** khi tải phiên bản mới đè lên cùng file Drive (link không đổi), trình duyệt giữ ảnh cũ. Hàm Apps Script `lamMoiAnh` ghi giờ sửa từng file vào cột `phien_ban` của file Hình ảnh, game tải lại ảnh nào có phiên bản mới; chạy tay một lần, sau đó tự chạy mỗi giờ. Nhật ký báo các ảnh chưa chia sẻ hoặc không mở được.
- Nút menu góc trên đổi từ bánh răng sang biểu tượng menu (ba gạch). Menu có thêm **Bản đồ**: đi thẳng tới trạm nghỉ ở cổng Làng Thanh Mộc, Hang động, Sa mạc, Núi tuyết (tự lưu trước khi đi).
- **Cấp tối thiểu** (Sheet `cau_hinh`: `cap_hang_dong` 5, `cap_sa_mac` 10, `cap_nui_tuyet` 15; chạy `kiemTra` để thêm các dòng này): chặn ở bảng Bản đồ, ở cổng vào vùng, và máy chủ đưa nhân vật về làng nếu vị trí lưu ở vùng chưa đủ cấp.
- **Lý trưởng** xếp việc theo cấp, nhóm theo vùng; việc ở vùng chưa đủ cấp hiện khóa, không nhận được (máy chủ cũng kiểm tra). Cột tùy chọn `cap_toi_thieu` ở tab `nhiem_vu` đặt cấp riêng cho từng việc.

## Bản 10.0: dáng người mới, khóa mục tiêu, bãi quái, người chơi ảo

- Khung thông tin món đang chọn trong túi (nhất là sách) không còn bị ép chữ thành cột dọc: phần chữ giữ chiều rộng tối thiểu, các nút xuống hàng dưới.
- Nhân vật và lính vẽ lại theo dáng 3/4 nhìn về phía trước: quay phải là hướng 5 giờ, quay trái hướng 7 giờ (thấy hai mắt, mũi, miệng, mái tóc lệch).
- Bỏ mục "Đổi nhân vật" trong menu.
- **Khóa mục tiêu** (cầm cung hoặc nỏ): nút Khóa (phím T) cạnh nút kỹ năng. Bật thì mỗi phát bắn tự tìm quái đã chạm chọn (hoặc quái gần nhất), có vòng ngắm đỏ; mũi tên bay đuổi theo mục tiêu nếu trúng theo **tỉ lệ chính xác**, trượt thì lệch hướng và hiện chữ "Trượt". Chính xác: cung 70%, nỏ 76%, mỗi cấp gia cường +2% (tối đa 100%), Sheet `cau_hinh`: `cung_chinh_xac`, `no_chinh_xac`, `chinh_xac_moi_cap`.
- Cung, nỏ được cộng thêm 15% tỉ lệ sát thương x2 (`cung_no_x2`), vũ khí khác không có.
- **Bãi quái lớn**: mỗi bản đồ 2 bãi (trường `camps` trong `maps/*.json`), quái tụ đông để luyện cấp, tên bãi hiện ở góc bản đồ nhỏ. Giới hạn hạ quái cùng loài trong một lượt hồi sinh nâng lên 16 (`gioi_han_ha_quai`).
- **Người chơi ảo** (`nguoi_choi_ao`, mặc định 4 mỗi bản đồ, 0 = tắt): đi săn quanh các bãi quái, bị quái đánh, gục thì 20 giây sau quay lại. Tên, giới tính, đồ lấy từ nhân vật người chơi đang rao cho thuê ở Thương nhân; chưa có thì dùng 8 người chơi mặc định với vũ khí, đồ khác nhau (đồ tốt hơn ở vùng cấp cao). Không đánh trùm. Quái do người chơi ảo hạ không cho thưởng, trừ khi mình đã gây từ 30% máu quái.

## Bản 10.1: dòng chỉ số đồ mặc, cường hóa đủ bộ, trùm Thạch Tinh

- **Đồ mặc** (mũ, áo, quần, găng, giày, cánh) có dòng chỉ số ngẫu nhiên trong nhóm: phòng ngự, lượng máu, tránh né, phản đòn, hồi máu, lượng mana (Sheet `cau_hinh` `dong_do_mac`). Số dòng: Thường 1 · Đẹp 1–2 · Hoàn hảo 2–3 · Huyền thoại, Thần 3–4 (ngoài hiệu ứng bộ). Mỗi chỉ số chỉ xuất hiện một lần trên một món; đồ Thường lấy nửa dưới khoảng giá trị của đồ Đẹp. Vũ khí, thú cưỡi giữ như cũ. Phản đòn tổng tối đa 60%.
- **Cường hóa** (8 ô đồ, trừ thú cưỡi; vũ khí hai tay tính cả ô tay trái): 5 món từ +9: máu +80 (`cuong_hoa_5_mau`). Đủ 8 ô từ +9: thêm máu +150 và sát thương +10% (`cuong_hoa_bo_mau`, `cuong_hoa_bo_sat_thuong`). Đủ 8 ô cùng từ +10 trở lên, theo món thấp nhất (cộng dồn): +10 giảm hồi chiêu 5% · +11 tốc đánh 6% · +12 tốc chạy 6% · +13 x2 4% · +14 giảm sát thương 4% · +15 x3 2%. Hiện ở bảng Thuộc tính.
- Vẽ lại tay: nhìn 3/4 từ phía trước nên tay phải (vũ khí chính) luôn ở bên trái màn hình, tay trái bên phải, quay hướng nào cũng vậy. Chân đứng thẳng, bàn chân hướng xuống như Lý trưởng; đi bộ nhấc chân luân phiên.
- Bỏ mục "Về làng" trong menu (dùng Bản đồ → Làng Thanh Mộc).
- Sa mạc có thêm trùm **Thạch Tinh** (người đá cát) ở ô 9, 24, rơi đồ tới Hoàn hảo, kèm việc "Phá Thạch Tinh" ở Lý trưởng.
- Rung màn hình khi voi, trùm ra đòn giờ chỉ xảy ra khi người chơi ở gần (trước đây trùm, voi đánh người chơi ảo ở xa cũng làm rung cả màn hình).

## Bản 10.2: mười vùng cấp 20–100, hai thành trì, chiêu thức trùm

- **10 bản đồ mới** nối tiếp nhau theo cấp, mỗi vùng 2 loài quái, 1 trùm, 2 bãi quái lớn, trạm nghỉ ở cổng vào (lửa trại, giếng cổ) và người chơi ảo:

  | Cấp | Vùng | Đi từ | Trùm · chiêu |
  |---|---|---|---|
  | 20 | Rừng Trúc | Hang động (mép dưới) | Mộc Tinh · Trì trệ |
  | 28 | Đầm Lầy | Sa mạc (mép phải) | Xà Tinh · Trúng độc, Trì trệ |
  | 36 | Đỉnh Mây | Núi tuyết (mép trên) | Lôi Điểu · Sét giật, Trì trệ |
  | 44 | **Thành Cổ Loa** (thành trì) | Rừng Trúc | Tướng Âm Binh · Phá giáp, Suy nhược |
  | 52 | Bãi Biển Hoang | Đầm Lầy | Thuồng Luồng · Trì trệ, Trúng độc |
  | 60 | Núi Lửa | Đỉnh Mây | Hỏa Long · Nổ, Suy nhược |
  | 70 | Rừng Ma | Thành Cổ Loa | Chúa Quỷ · Suy nhược, Phá giáp, Trúng độc |
  | 80 | Băng Nguyên | Bãi Biển Hoang | Băng Hoàng · Đóng băng, Trì trệ |
  | 90 | **Kinh Thành Thăng Long** (thành trì) | Rừng Ma | Hắc Long Tướng · Phá giáp, Sét giật, Suy nhược |
  | 100 | Cửu Trùng Đài | Băng Nguyên và Thăng Long | Ma Vương · Đóng băng, Suy nhược, Nổ, Tự bạo |

- **Thành trì** có tường, cổng, nhà mái ngói, đèn lồng, cờ; NPC mới: lính gác / cấm vệ tuần tra, quan văn giao việc, sư thầy, vũ công và ca nữ múa, người đánh trống hội, nghệ nhân đèn, thợ rèn thành, tướng quân (thuê lính), pháp sư, thương gia, quan mục. Quái vây ngoài thành.
- **Quái mạnh dần**: mỗi vùng máu ×2, sát thương ×1,5, kinh nghiệm ×2 so với vùng trước (số liệu ở tab `quai`, chỉnh được). Giới hạn cấp nhân vật nâng lên 100 (`cap_toi_da`; game lấy số lớn hơn giữa cấu hình và cấp vùng cao nhất).
- **Đồ theo bậc vùng**: đồ rơi ở vùng cấp ≥ 20 mang bậc `t` = cấp vùng (tên hiện "· cấp 44"): chỉ số gốc ×(1 + t/25), dòng cộng thêm ×(1 + t/20). Trùm từ cấp 44 rơi đồ huyền thoại, từ cấp 60 rơi đồ thần, tỉ lệ tăng dần theo cấp vùng (cột `huyen_thoai_phan_van`, `than_phan_van`); quái thường từ cấp 70 có tỉ lệ nhỏ rơi huyền thoại. Trần `pham_chat_roi_toi_da` tự nới theo cấp vùng.
- **Chiêu thức trùm** (cột `ky_nang` tab `quai`, cách nhau dấu phẩy, ra chiêu mỗi `trum_ky_nang_giay` = 7 giây, có vòng báo trước 1,1 giây tại chỗ đứng): `slow` Trì trệ (tốc đánh −40%, 6 giây) · `freeze` Đóng băng (đứng yên 1,6 giây) · `stun` Sét giật (choáng 1,4 giây) · `weak` Suy nhược (sát thương −40%) · `armor` Phá giáp (phòng ngự −50%) · `poison` Trúng độc (mất 2% máu mỗi nửa giây, 5 giây) · `bomb` Nổ (sát thương ×2,5 trong vòng tròn) · `tubao` Tự bạo (còn dưới 15% máu: gồng 2,2 giây rồi nổ ×4 sát thương bán kính 260 và chết, vẫn rơi đồ). Hiệu ứng đang dính hiện trên đầu nhân vật.
- **Gọn nhẹ**: nền, vật trang trí, quái, NPC của các vùng mới vẽ bằng bộ sinh theo tham số `src/04-gen.js` (dáng quad / bird / snake / human / blob / bug / golem / dragon, nền theo bảng màu…), nên mỗi gói bản đồ mới chỉ 4–8 KB (vùng vẽ tay cũ 13–15 KB) và vẫn chỉ tải khi tới gần cổng. Toàn bộ 10 vùng sinh từ một bảng tham số: `node tools/genmaps.mjs` (ghi `maps/*.json`, `maps/*.art.js`, `src/01-data-vung.js`, thêm cổng vào 3 vùng cũ).
- Tab mới `ban_do` (file cấu hình): mã, tên, cấp tối thiểu, biểu tượng của từng vùng; `kiemTra` tự tạo tab này và thêm cột `ban_do`, `ky_nang` vào tab `quai` cùng 30 quái, 20 việc mới.

## Bản 10.3: mười vùng cấp 105–150, hiệu buôn thành trì, diện mạo, dáng quay trái

- **Dáng nhân vật quay trái** (nhân vật chính, lính đi theo, người chơi ảo): học theo dáng quay phải — món tay phải (kiếm, gậy) khuất sau người, chỉ lộ phần lưỡi nhô lên vai; món tay trái (khiên) đưa ra trước, thấy trọn. Khi tay phải ra đòn thì vũ khí vung ra trước như thường; chặn khiên, vũ khí hai tay (giáo, cung, nỏ) giữ nguyên.
- **10 bản đồ mới** nối tiếp Cửu Trùng Đài, 2 thành trì (Cố Đô Hoa Lư, Kinh Thành Phú Xuân). Từ bản đồ thứ 11 quái mỗi vùng máu ×1,5, sát thương ×1,25, đồng ×1,5 so với vùng trước (10 vùng đầu vẫn ×2 / ×1,5 / ×1,8); quái thường từ cấp 125 có một chiêu; trùm cấp 145–150 là trùm cuối (rơi 3 lượt). Cấp tối đa 150.

  | Cấp | Vùng | Đi từ | Trùm · chiêu |
  |---|---|---|---|
  | 105 | Thủy Cung | Cửu Trùng Đài | Long Vương Thủy Phủ · Đóng băng, Trì trệ, Độc |
  | 110 | Hoang Mạc Xương | Thủy Cung | Hắc Mộ Vương · Phá giáp, Suy nhược, Nổ |
  | 115 | Thiên Sơn | Hoang Mạc Xương | Phong Vương · Sét giật, Trì trệ, Suy nhược |
  | 120 | **Cố Đô Hoa Lư** (thành trì) | Thiên Sơn | Sứ Quân Phản Loạn · Phá giáp, Sét giật, Suy nhược, Nổ |
  | 125 | Địa Ngục Môn | Hoa Lư | Diêm La Tướng · Suy nhược, Phá giáp, Độc, Nổ, Tự bạo |
  | 130 | Đảo Rồng | Địa Ngục Môn | Hải Long Vương · Đóng băng, Trì trệ, Độc, Nổ |
  | 135 | Vực Yêu Tinh | Đảo Rồng | Cửu Vĩ Hồ · Suy nhược, Đóng băng, Độc, Sét giật |
  | 140 | Cung Trăng | Vực Yêu Tinh | Nguyệt Thần · Đóng băng, Sét giật, Suy nhược, Trì trệ |
  | 145 | **Kinh Thành Phú Xuân** (thành trì) | Cung Trăng | Hắc Đế · Phá giáp, Sét giật, Suy nhược, Nổ, Tự bạo |
  | 150 | Thiên Đình | Phú Xuân và Cung Trăng | Hắc Thiên Ma · Đóng băng, Suy nhược, Phá giáp, Nổ, Tự bạo |

- **Hiệu buôn thành trì** (NPC Chủ hiệu ở cả 4 thành: Âu Lạc 44, Long Thành 90, Trường Yên 120, Thuận Hóa 145; mã cửa hàng `thanh-<vùng>`): 12 món vũ khí / đồ mặc mang tên thành, bán ba phẩm chất Thường / Đẹp / Hoàn hảo (giá ×1 / ×2,5 / ×6, `he_so_gia_hoan_hao`), mọi món mang bậc = cấp thành (cột `bac` tab `cua_hang`) nên chỉ số nhân theo bậc như đồ rơi; thú cưỡi mới (Ngựa chiến Cổ Loa, Hổ trắng Tây Bắc, Ngựa Ngự Lâm, **Kỳ lân** Tràng An / hoàng gia — chiêu Lân hỏa nổ lửa quanh mình, Voi trắng, **Rồng** Thuận Hóa — chiêu Long tức phun lửa phía trước); đồ hiệu ứng phẩm chất Hoàn hảo cố định với hiệu ứng mới: `frost` Băng giá (đòn đánh có X% làm quái chậm nửa tốc 2 giây), `venom` Độc (gây độc thêm X% sát thương trong 4 giây), `rage` Cuồng nộ (dưới 30% máu sát thương +X%), `luck` May mắn (tỉ lệ rơi đồ ×(1+X%)), `expUp` Tinh thông (+X% kinh nghiệm), `coinUp` Phú quý (+X% đồng). Hiệu buôn gia cường được vũ khí, giáp, thú cưỡi. Giá tăng dần theo thành (Cổ Loa vài chục nghìn → Phú Xuân hàng chục triệu đồng).
- **Diện mạo**: NPC Thợ truyền thần (Thăng Long) / Họa sư cung đình (Phú Xuân) mở bảng đổi da, tóc, râu, màu mắt, dấu trên mặt; tab mới `dien_mao` (file cấu hình: giá đồng / hồng ngọc, màu da, màu tóc, kiểu tóc `xoa` `dung` `khan` `troc`, râu, màu mắt, dấu `seo` `not` `ve` `hoa`, giới tính). Mua một lần (lệnh `av`, máy chủ giữ danh sách đã mua), đổi lại bao nhiêu lần cũng được; chân dung góc trái đổi màu theo, hoặc dùng ảnh `giao_dien:chan_dung_<mã diện mạo>` nếu dán trong file Hình ảnh. Sau này bán avatar chỉ cần thêm dòng vào tab này.
- `vat_pham` có thêm cột `pham_chat` (phẩm chất cố định), `hieu_ung`, `gia_tri`, `mo_ta` (hiệu ứng riêng như đồ thần); `cua_hang` thêm cột `bac`. `kiemTra` tự thêm cột, tab `dien_mao` và các dòng mới (quái, việc, hàng hóa, diện mạo).
- **Nhân vật thử**: hàm `taoNhanVatThu()` trong Apps Script tạo cho tài khoản `vnthudao` hai nhân vật cấp 100 (Thử Nam 100, Thử Nữ 100): mặc đủ 9 món một bộ huyền thoại +9 bậc 100, túi có bộ huyền thoại thứ hai, 11 món đồ thần, hổ, voi, 4 sách, 50 triệu đồng, 5000 hồng ngọc. `taoNhanVatThu('ten_khac',120)` cho tài khoản / cấp khác.

## Bản 10.4: khiên nhìn thẳng mặt, kiếm quay trái, thu vũ khí trong làng và thành

- **Quay trái**: khiên đưa ra trước vẽ **mặt ngoài nhìn thẳng** (tròn, có núm và đinh tán, viền theo màu bộ); kiếm/gậy khuất sau người nay chếch hẳn về bên trái, lưỡi nhô qua vai.
- **Trong vùng an toàn** (làng, thành trì) nhân vật, lính đi theo và người chơi ảo **thu vũ khí**: tay vung theo bước đi; kiếm dắt bên hông (chuôi ở thắt lưng, lưỡi chếch ra sau); khiên, cung, nỏ, giáo, gậy, kiếm thứ hai đeo sau lưng. Ra đòn (đánh thường) hoặc chặn thì cầm lại; túi đồ, chân dung, chợ cho thuê vẫn hiện dáng cầm vũ khí.

## Bản 10.5: dáng quay trái theo phác thảo

- Quay trái: tay phải buông thấp phía trước, kiếm/gậy chĩa chếch lên bên trái thấy trọn; tay trái co lại, khiên đưa ra bên hông phía sau, mặt ngoài nhìn thẳng. Cả hai vẽ trước thân (theo phác thảo của tác giả). Phần còn lại giữ nguyên bản 10.4.

## Bản 10.28 — hướng dẫn tân thủ phần 2 (Lý trưởng, Ngư Tinh)
- Vào làng: nhóm người chơi ảo nói «Qua gặp Lý trưởng kìa bạn!», «Bạn đánh cả sư tử thì kinh rồi!», «Nhà tôi cũng có 1 con sư tử», «Lão Lý trưởng dâm dê lắm»; mũi tên vàng chỉ tới Lý trưởng.
- Gặp Lý trưởng: lời thoại riêng, bấm «Nhận đồ» được Nón lá, Áo vải, Quần vải, Dép cỏ (lệnh máy chủ `tutGift`, chỉ một lần; cờ `flags.tutGift`).
- Ba tân binh đi cùng, mũi tên chỉ về Ngư Tinh (đông nam). Lần đầu chạm mặt: Ngư Tinh lao tới hạ một đòn, cả nhóm chạy tán loạn («Chạy đi tụi bay!», «Ối zồi ôi! Méo ổn rồi!», «Tao đã nghi nghi rồi!»).
- Gục lần này (`die` có `tut`): mất đồ đang mặc và mọi quần áo trong túi (chỉ giữ vũ khí tập). Tỉnh dậy ở làng, nhóm đứng cạnh nói «Tỉnh rồi à bạn!», «Còn đúng mảnh vải che thân», «Thấy tội ghê!», «Hãy ra chỗ Thợ rèn ở đó có quần áo!»; mũi tên chỉ Thợ rèn. Tới Thợ rèn là xong (dấu `tut2`).
- Thoát giữa chừng: lần vào sau tiếp tục đúng chặng (chưa nhận đồ → gặp Lý trưởng; đã nhận đồ → đi tìm Ngư Tinh).

## Bản 10.27 — hướng dẫn tân thủ
- Nhân vật mới (cấp 1, chưa gặp ai) vào Thanh Mộc: 4 người chơi ảo (Béo Ca, Gầy Đệ, Tí Còi, Na Lém) tới bắt chuyện; Béo Ca hỏi (Chú/Cô theo giới tính), nút duy nhất «Đi theo».
- Béo Ca dắt qua cầu ra bìa rừng Đông Ngạn, nhân vật tự đi theo; sư tử lao ra vồ gục Béo Ca, ba người còn lại chạy tán loạn về làng («Chạy đi tụi bay!», «Ối zồi ôi! Méo ổn rồi!»).
- Sư tử hướng dẫn: 70% máu, đánh nửa sát thương, không làm người chơi gục. Hạ xong, Hiệp khách Vân chạy ra mời vào làng, rồi dẫn về; cả nhóm ở lại đi lại trong làng.
- Xong thì lưu dấu `tut` (chỉ chạy một lần). Cấu hình `huong_dan_tan_thu` = 0 để tắt (kiemTra tự thêm dòng).

## Bản 10.26 — giá thú cưỡi thành ×10, chiêu mộ 100 hồng ngọc, Mệnh lệnh danh tướng 150–350

- **Giá thú cưỡi**: Thanh Mộc giữ nguyên (2–60 vàng); các thành = giá bản 10.24 × 10 (`thu_cuoi_gia_thanh`): Cổ Loa 297–669, Thăng Long 595–1.338, Hoa Lư 1.190–2.677, Phú Xuân 2.210–4.971 vàng.
- **Đơn chiêu mộ** trở lại 100 hồng ngọc (tỉ lệ danh tướng giữ 1% · 0,3%).
- **Danh tướng** cần 150–350 Mệnh lệnh như trước (ngẫu nhiên khi chiêu mộ, không theo nơi chiêu mộ); bỏ dòng `tuong_menh_lenh_*`.
- Mô phỏng 100 người chơi: 98/100 hạ boss cuối, trung vị 22 tháng (nạp 5tr: 24,7; 10tr: 15,9) — chậm hơn mốc 1 năm vì danh tướng (nguồn bộ Huyền thoại / Thần) khó chiêu mộ.
- Sheet: chạy `kiemTra` rồi `capNhatV1026()` một lần.

## Bản 10.25 — danh tướng độc lập, giá thú cưỡi

- **Danh tướng** (lính Huyền thoại, Thần thoại) tách khỏi hệ lính thường: tổng điểm chỉ số cố định (`tuong_diem_huyen_thoai` 1.800, `tuong_diem_than` 2.600; Sức khỏe ít nhất 1/4) dù chiêu mộ ở Thanh Mộc hay Phú Xuân — chỉ khác cấp (cấp nơi chiêu mộ + 0..10). Giá như nhau mọi nơi (`tuong_gia_huyen_thoai` 500, `tuong_gia_than` 2.000 hồng ngọc), Mệnh lệnh cố định (40 / 60), luôn được máu tối thiểu theo quái vùng. Danh tướng đã chiêu mộ trước đây được nâng chỉ số lên đủ mức mới.
- **Chiêu mộ khó hơn**: tỉ lệ ra Huyền thoại 1%, Thần thoại 0,3% (`chieu_mo_ti_le` = 55,33,10.7,1,0.3); giá mỗi đơn 30 hồng ngọc (`chieu_mo_hong_ngoc`, trước 100) để giữ mốc thời gian.
- **Giá thú cưỡi**: Thanh Mộc giữ nguyên; mỗi nơi bán kế tiếp ×10 (`thu_cuoi_gia_moi_thanh`): Cổ Loa 149–335, Thăng Long ~1.500–3.300, Hoa Lư ~15.000–33.000, Phú Xuân ~138.000–311.000 vàng.
- Mô phỏng 100 người chơi: 96/100 hạ boss cuối, trung vị 14,5 tháng (nạp 5tr: 14,2; 10tr: 12,6) — chậm hơn bản 10.24 (12,8) vì bộ Huyền thoại / Thần chỉ có từ danh tướng.
- Sheet: chạy `kiemTra` rồi `capNhatV1025()` một lần.

## Bản 10.24 — lính đánh thuê bền hơn, giá sách, giá thú cưỡi

- **Lính đánh thuê** (trước: không hồi máu ngoài làng, lính thành trì vùng cao chỉ chịu được 1–3 đòn quái): lính có cấp ≥ cấp vùng − 10 được máu tối thiểu = `linh_mau_toi_thieu` (6 · 8 · 10 · 25 · 35) × sát thương quái thường của vùng; giảm sát thương nhận `linh_giam_sat_thuong` (0 · 10 · 20 · 35 · 45%); tự hồi `linh_hoi_mau` (0,5 · 1 · 1,5 · 3 · 4% máu/giây) ngoài vùng an toàn, 5 giây không trúng đòn hồi thêm 6%/giây. Lính Huyền thoại, Thần bị từ 3 quái vây thì đánh quét một vòng (× 0,8 sát thương). Thử ở bãi quái Phú Xuân: lính Huyền thoại, Thần, Thiện chiến giữ 100% máu qua 12 đợt quái.
- **Giá sách**: mỗi thành kế tiếp gấp đôi (`sach_gia_moi_thanh` = 2): sách Hỏa Thường 4 · 8 · 16 · 32 · 64 vàng.
- **Giá thú cưỡi**: làng Thanh Mộc × 5 (`thu_cuoi_gia_lang`; ngựa con 2 vàng … voi 60 vàng); mỗi nơi bán kế tiếp giá trung bình gấp đôi nơi trước (`thu_cuoi_gia_moi_thanh`): Cổ Loa ≈ 30–67, Thăng Long ≈ 59–134, Hoa Lư ≈ 119–268, Phú Xuân ≈ 221–497 vàng.
- **Sửa lỗi bán lại**: đồ có phẩm chất cố định (thú Hoàn hảo ở thành…) không nhân hệ số phẩm chất khi bán lại nữa (trước đây bán được gấp đôi giá mua).
- Sheet: chạy `kiemTra` (thêm dòng cấu hình mới) rồi `capNhatV1024()` một lần (đổi `sach_gia_moi_thanh` trên Sheet thành 2).

## Bản 10.23 — giá sách theo thành

- Giá sách = giá ở làng Thanh Mộc × `sach_gia_nhan` (100) × `sach_gia_moi_thanh` (5) mũ bậc thành × phẩm chất (1 · 5 · 20). Mỗi thành kế tiếp đắt gấp 5: Thanh Mộc ×1, Cổ Loa ×5, Thăng Long ×25, Hoa Lư ×125, Phú Xuân ×625. Ví dụ sách Hỏa Thường: 4 · 20 · 100 · 500 · 2.500 vàng. Cột `gia` của dòng sách ở tab `cua_hang` không còn dùng.
- Sheet: chạy `kiemTra` (thêm dòng `sach_gia_moi_thanh`).

## Bản 10.22 — che Blogspot, chặn phóng to, người chơi ảo, chiến thuật trùm, sách rơi từ trùm

- **Không còn thấy giao diện Blogspot**: đoạn nhúng mới phủ nền tối + chữ “Lữ Hành” ngay khi trình duyệt đọc tới, màn hình chờ hiện đè lên. Muốn che hoàn toàn từ khung hình đầu tiên: dán `blogspot/dau-trang-blogspot.html` một lần vào Chủ đề → Chỉnh sửa HTML, ngay sau `<head>` (chỉ áp dụng cho trang game).
- **Chặn phóng to trên điện thoại**: khóa viewport (`user-scalable=no`), `touch-action:manipulation` cho toàn game, chặn chụm hai ngón / chạm hai lần.
- **Người chơi ảo**: đồ theo cấp bản đồ (vùng thấp đồ thường, vùng cao đồ hoàn hảo cường hóa, từ cấp 170 có người mặc trọn bộ Huyền thoại / Thần); 5 người đi lại trong làng, thành (`nguoi_choi_ao_thanh`); khoảng mỗi phút (`nguoi_choi_ao_chay_giay`) một người bị quái rượt, ít máu, kêu cứu chạy về làng / thành — hạ con quái là được cảm ơn.
- **Trùm vùng +20% sát thương** (`boss_nhan_sat_thuong`); Hắc Đế, Hắc Thiên Ma giữ nguyên (đã cân cho mốc 1 năm).
- **Chiến thuật trùm** (cột `ky_nang`): `tron` Hồ Tinh chín đuôi, Cửu Vĩ Hồ — dưới 20% máu bỏ chạy, thoát là hồi đầy máu; đốt cháy bằng sách Hỏa giữ chân (ngã quỵ 2 giây) hoặc bắn tầm xa (cận chiến chỉ 30%). `bay` Đại Bàng Tinh, Lôi Điểu — 4 giây mỗi 12 giây bay lên cao, cận chiến 15%. `giap-bang` Băng Hoàng — giảm 70% sát thương, đòn lửa làm tan giáp 5 giây. `hoi-mau` Mộc Tinh — hồi 1% máu/giây, đốt cháy / độc thì ngừng. `phan-giap` Thạch Tinh — cận chiến 60% và dội 15% vào người đánh. Lần đầu giao chiến game hiện mẹo đánh. Sách Hỏa nay gây cháy (mất máu dần 3 giây).
- **Sách**: cửa hàng chỉ bán Thường, Đẹp, Hoàn hảo; giá × 100 (`sach_gia_nhan`). Sách Huyền thoại / Thần chỉ rơi khi hạ trùm: 3% / 0,5% mỗi lần (trùm thế giới × 3), bậc sách theo cấp vùng của trùm.
- Mô phỏng 100 người chơi: 100/100 hạ boss cuối, trung vị 12,8 tháng (không đổi).
- Sheet: chạy `kiemTra` rồi `capNhatV1022()` một lần.

## Bản 10.21 — rương chung, thú cưỡi cần Mệnh lệnh, sách theo bậc và phẩm chất, Trí tuệ giữ quái

- **Người giữ rương** ở làng Thanh Mộc và 4 thành (Cổ Loa, Thăng Long, Hoa Lư, Phú Xuân): mỗi tài khoản một rương chung (`ruong_so_o` = 60 ô), nhân vật nào cũng gửi / lấy được đồ, tiền, hồng ngọc. Máy chủ giữ rương ở cột `ruong` của tab `tai_khoan` (tự thêm). Đồ nhiệm vụ không gửi được.
- **Thú cưỡi**: Mệnh lệnh cần = mức theo loài + cấp thú × 0,5 + phẩm chất (`thu_cuoi_menh_lenh_pham_chat` = 0,5,15,30,60) + 1 mỗi cấp gia cường. Cấp thú: thú bán ở thành = cấp thành; thú làng theo giá (ngựa con 7 … voi 26 Mệnh lệnh, nhân vật mới có 10); thú bộ Huyền thoại tính như cấp 250 (≈160), bộ Thần cấp 330 (≈230). Thú chưa có Công / Thủ lấy chỉ số gốc theo loài, nhân theo cấp thú. Ô thú cưỡi hiện “Cần N Mệnh lệnh” (đỏ khi thiếu).
- **Sách** có 5 bậc theo nơi bán (Thanh Mộc · Cổ Loa · Thăng Long · Hoa Lư · Phú Xuân) và 5 phẩm chất. Điểm cộng (sách Thường): 3 · 8 · 15 · 25 · 40; sách Ma công cộng Mệnh lệnh 5 · 10 · 15 · 20 · 20; nhân phẩm chất 1 · 1,3 · 1,7 · 2,3 · 3. Hiệu ứng (Hỏa, Thủy, Thổ, Kim, Mộc, tỉ lệ Lôi / Phong / Băng / Ánh sáng / Ma công) nhân 0,4 · 0,6 · 0,8 · 1 · 1,2 theo bậc và 1 · 1,15 · 1,3 · 1,5 · 1,8 theo phẩm chất. Giá nhân 1 · 5 · 20 · 100 · 400; Huyền thoại, Thần thêm hồng ngọc (Thần Phú Xuân 1.000).
- **Sách Ma công**: tối đa 1 · 2 · 2 · 3 · 3 quái theo bậc (+1 với Huyền thoại, Thần); từ Thăng Long thu phục được trùm vùng với tỉ lệ × 0,05 · 0,1 · 0,2 (trùm thế giới, trùm cuối không). Trùm thu phục vẽ nhỏ lại, sát thương × 0,3.
- **Trí tuệ giữ quái**: mốc 0 · 60 · 150 · 300 · 600 Trí tuệ → quái ở lại 1 phút · 10 phút · 1 giờ · 10 giờ · vĩnh viễn (trùm giảm một mốc). Hết giờ quái bỏ đi.
- **Sửa lỗi**: mua sách ở Đạo sĩ làng trước đây ra sách bậc Phú Xuân (+50 điểm) và tính giá Phú Xuân, vì lệnh mua không ghi cửa hàng. Nay lệnh mua luôn ghi cửa hàng.
- Mô phỏng 100 người chơi (người chơi để dành điểm Mệnh lệnh cho thú bộ): 100/100 hạ boss cuối, trung vị 12,8 tháng; nạp 5tr: 13,4; 10tr: 11,8.
- Sheet: chạy `kiemTra` rồi `capNhatV1021()` một lần.

## Bản 10.20 — bảng cường hóa mới

- **Cường hóa** (`gia_cuong`, cột `ti_le`): lên +1…+6 chắc chắn 100%; +7, +8, +9 còn 50%; +10…+15 giảm dần 44 · 38 · 33 · 27 · 21 · 15%. Phí hồng ngọc và mức rớt (hỏng tụt 1 cấp từ +7) giữ nguyên.
- Kỳ vọng hồng ngọc mỗi món (không dùng may mắn): +9 ≈ 110, +12 ≈ 704, +15 ≈ 27.700. Đích thực tế của người chơi nạp vì thế là **bộ thần +12**; huyền thoại +15 thành mục tiêu rất đắt.
- Mô phỏng 100 người chơi: 99/100 hạ boss cuối ở cấp 400; trung vị 12,4 tháng, 10% nhanh nhất ≤ 8,2 tháng, nhanh nhất 5,8 tháng. Nạp 3tr: trung vị 19,0 tháng; 5tr: 13,2; 10tr: 10,4.
- Sheet: chạy `kiemTra` rồi `capNhatV1020()` một lần (chỉ ghi cột `ti_le` của tab `gia_cuong`).

## Bản 10.19 — cân bằng lại toàn game

Mục tiêu: người chơi nạp 5–10 triệu/năm, chơi trung bình 2 giờ/ngày hạ boss cuối Hắc Thiên Ma sau khoảng 1 năm (nhanh nhất khoảng 6 tháng), khi đạt cấp 400 và mặc trọn bộ huyền thoại +15 hoặc thần +12.
- **Quái**: máu, sát thương, kinh nghiệm của 82 loài tính lại theo cấp vùng (`tools/canbang.mjs` → `src/01-data-canbang.js`). Quái thường ≈ 4 giây hạ với người chơi đúng cấp; boss vùng ≈ 45 giây; Hắc Thiên Ma ≈ 150 giây với cấp 400 + huyền thoại +15. Hệ số `quai_nhan_mau`, `quai_nhan_sat_thuong`, `boss_nhan`, `quai_nhan_kinh_nghiem` về 1.
- **Thiên Đình cần cấp 400** (`cap_thien_dinh`); từ cấp 290 luyện ở Phú Xuân.
- **Uy lực trang bị**: mỗi món cộng % sát thương và % máu theo phẩm chất và cấp cường hóa (`uy_luc_pham_chat` = 0,1,3,8,8; `uy_luc_moi_cap` = 0.3,0.3,0.4,1.2,0.9). Trọn bộ huyền thoại +15 ≈ +234%, thần +12 ≈ +169% (đồ thần chỉ số gốc gấp đôi) → hai đích ngang nhau.
- **Cường hóa** (`gia_cuong`): +0..+5 chắc chắn, +6..+14 tỉ lệ 80% → 50%, hỏng chỉ tụt 1 cấp. Kỳ vọng mỗi món: +9 ≈ 55, +12 ≈ 154, +15 ≈ 389 hồng ngọc (trước: +12 ≈ 8.600, +15 ≈ 12 triệu).
- **Vũ khí đánh xa**: sát thương gậy 65 → 140, cung 80 → 120, nỏ 90 → 135 (trước chỉ bằng 1/4 – 1/2 kiếm).
- Mô phỏng 100 người chơi (`tools/mophong.cjs`): 99/100 hạ boss cuối, tất cả ở cấp 400; trung vị 10,6 tháng, 10% nhanh nhất ≤ 7,6 tháng, nhanh nhất 5,6 tháng. Nạp 3tr: trung vị 12,8 tháng; 5tr: 11,5; 10tr: 9,7. Không nạp: chưa có đường lấy bộ huyền thoại (chỉ hồng ngọc sự kiện thành).
- Sheet: chạy `kiemTra` rồi `capNhatV1019()` một lần.

## Bản 10.18

Vẽ lại thú cưỡi và boss (module mới `src/04-boss.js`, `LH_BOSS`):
- Thú cưỡi có hình riêng đúng tên: Phượng Hoàng Lửa (chim phượng cam đỏ, đuôi dài, bốc lửa), Cửu Vĩ Hồ Ly (cáo chín đuôi xòe, lửa hồ ly), Huyền Vũ (rùa mai lục giác, rắn quấn), Thiên Mã (ngựa có cánh lông vũ), rồng (rồng phương Đông uốn lượn cưỡi mây, Kim Long màu vàng), kỳ lân (vảy, móng guốc, đầu rồng một sừng, bờm và đuôi lửa).
- Loài thú cưỡi mới trong `BEASTS`: `phuong`, `cuuvi`, `rua`, `thienma` (đòn phím 4 dùng lại đòn kỳ lân / hổ / voi / ngựa). Dòng Sheet cũ ghi loài cũ (kylan, tiger, elephant, horse) tự đổi sang loài mới; ghi loài mới trên Sheet cũng được.
- 26 boss vẽ chi tiết: tướng / vua / thần (giáp vảy, hộ tâm kính, áo choàng bay, mũ theo vai, binh khí: đại đao, giáo, kiếm phát sáng, trượng ngọc / trăng, chùy gai, hào quang), rồng phương Đông (thân uốn, vảy bụng, bờm, sừng nai, râu, ngọc, cánh, phun lửa), chim thần (lớp lông, sấm sét, gió xoáy), hồ ly chín đuôi, trăn tinh và rắn hổ mang, Chúa Sơn Lâm, Ngư Tinh, Thạch Tinh, Mộc Tinh. Ảnh `quai:<mã>` trong file Hình ảnh vẫn được ưu tiên.
- Ảnh vật phẩm thú cưỡi (`dist/anh/vat_pham`) vẽ lại; hàm `capNhatAnhThuCuoi` thay ảnh thú cưỡi trong file Hình ảnh (chỉ những ảnh do capNhatAnh chép, ảnh tự đặt giữ nguyên).

## Bản 10.17

Hệ số mới trong `cau_hinh` (kiemTra tự thêm; sửa trên Sheet rồi chạy `xoaBoNhoDem`):
- `thu_phuc_sat_thuong` = 0.5: sát thương quái thu phục còn 1/2.
- `linh_huyen_than_them` = 0.25: lính huyền thoại, thần thoại thêm 25% máu, sát thương, phòng ngự (huyền thoại ×3 → ×3,75; thần thoại ×4 → ×5).
- Lính đi theo nhận cùng lượng kinh nghiệm như chủ khi hạ quái, lên cấp theo cùng bảng kinh nghiệm; mỗi cấp được `diem_moi_cap` điểm, tự chia vào 4 chỉ số theo tỉ lệ chỉ số đang có.
- `boss_nhan` = 2: máu, sát thương boss ×2 (sau hệ số 1/4 chung → boss còn 1/2 so với gốc).
- `thu_cuoi_nhan_chi_so` = 2: công, thủ thú cưỡi và sát thương đòn thú cưỡi (phím 4) ×2.
- `thu_cuoi_menh_lenh_cap` = 0.5: thú cưỡi bán ở thành cần thêm Mệnh lệnh = cấp thành × 0.5 (Cổ Loa +35, Thăng Long +85, Hoa Lư +118, Phú Xuân +145). Thú cưỡi đang cưỡi mà vượt Mệnh lệnh thì khi vào game được cất vào túi.
- `quai_nhan_tien` = 0.1, `quai_nhan_kinh_nghiem` = 0.1: tiền, kinh nghiệm hạ quái còn 1/10.
- `quai_tien_toi_da` = 9999: mỗi con quái cho tối đa 99 bạc 99 đồng (không bao giờ ra vàng). 0 = không giới hạn.
- `quai_roi_do` = 0: quái không rơi hồng ngọc, đồ đạc (1 = rơi như cũ).

## Bản 10.16

Năm hệ số mới trong tab `cau_hinh` (kiemTra tự thêm; sửa trên Sheet rồi chạy `xoaBoNhoDem` là có hiệu lực, không cần dán lại mã):
- `linh_nhan_chi_so` = 2: máu và sát thương mọi lính đánh thuê ×2 (nhân thêm với hệ số phẩm cấp `linh_he_so`).
- `linh_nhan_menh_lenh` = 10: Mệnh lệnh cần để cho lính đi theo = cột `menh_lenh` của lính × 10. Khi vào game, lính vượt quá Mệnh lệnh hiện có tự chuyển sang nghỉ.
- `quai_nhan_mau` = 0.25, `quai_nhan_sat_thuong` = 0.25: máu và sát thương mọi quái, boss, quái sự kiện còn 1/4. Kinh nghiệm, tiền rơi giữ nguyên; quái thu phục giữ chỉ số gốc.
- `thu_cuoi_nhan_gia` = 20: giá thú cưỡi ở cửa hàng ×20 (giá bán lại theo tỉ lệ cũ nên cũng ×20).

Nạp thẻ có 6 gói vàng (tab `goi_nap`, cột mới `vang`): 20K → 100 vàng · 50K → 275 · 100K → 600 · 200K → 1.300 · 500K → 3.500 · 1 triệu → 7.500. Cộng tay: `napVang('tên', số vàng)` hoặc `napGoi('tên', 'vang-100')` (napGoi cũng dùng được cho gói hồng ngọc). Nhật ký tab `nap_the` thêm cột `vang`.

## Bản 10.15

- Bổ sung 631 ảnh vật phẩm vẽ sẵn còn thiếu (`dist/anh/vat_pham`): Đao, Chùy, đồ của 4 thành, đồ vùng và 60 bộ huyền thoại / thần của 30 danh tướng. Hàm `capNhatAnh` hết báo lỗi 404.
- Ảnh biểu tượng vẽ đúng hình đao và chùy (trước đây vẽ thành gậy).

## Bản 10.14: đao và chùy, lính theo phẩm cấp, đơn chiêu mộ, 30 danh tướng Trung Hoa, điểm cộng sinh thêm chỉ số

- **Hai loại vũ khí mới** (Sheet `vu_khi`): **Đao** (`saber`, một tay, chém vòng cung rộng 140°, sát thương 125%) và **Chùy** (`mace`, một tay, nặng nhất 145%, đẩy lùi mạnh, mỗi đòn 15% làm quái choáng). Cầm đôi hoặc kèm khiên; dùng dáng đánh của kiếm, hình vẽ riêng, biểu tượng `i-saber`, `i-mace`. Thợ rèn làng bán Đao sắt / Chùy sắt; lò rèn 4 thành bán Đao / Chùy theo thành; Thăng Long có Đao Lôi Đình (choáng 12%), Hoa Lư có Chùy Thái Sơn (choáng 20%).
- **Lính theo phẩm cấp** (`m.tier`): thường · tinh nhuệ · thiện chiến · huyền thoại · thần thoại, **máu và sát thương nhân** `linh_he_so` = 1 / 1,5 / 2 / 3 / 4 (`Player.tierMul`, áp ở `syncMerc`). Tên lính trên bản đồ và trong bảng tô màu phẩm cấp.
- **Đơn chiêu mộ** (bảng Tướng quân, op `recruit` → `recruitHire` / `recruitDrop`, kết quả giữ trong `s.recruit`): mỗi lần `chieu_mo_hong_ngoc`=100 hồng ngọc, rút theo `chieu_mo_ti_le` 50/35/10/3/2 %. Cấp = cấp thành + 0/10/20/35/50 + 0–10, điểm chỉ số ×(1 + 0,25·bậc) chia ngẫu nhiên. Giá theo cấp thành (f = cấp/300): thường 1–100 vàng; tinh nhuệ 100–400 vàng (thành thấp) hoặc 10–100 hồng ngọc; thiện chiến 100–500, huyền thoại 500–1000, thần thoại 1000–5000 hồng ngọc. Thường / tinh nhuệ / thiện chiến lấy mẫu lính của thành (đồ phẩm n / g / p).
- **30 danh tướng Trung Hoa** (Sheet mới `tuong`, cột như `bo_huyen_thoai` + `mau`, `mo_ta`): Quan Vũ (Thanh Long Yển Nguyệt Đao), Trương Phi, Triệu Vân, Lữ Bố, Mã Siêu, Hoàng Trung, Gia Cát Lượng, Chu Du, Tào Tháo, Lưu Bị, Tôn Quyền, Hạ Hầu Đôn, Điển Vi, Hứa Chử, Cam Ninh, Thái Sử Từ, Khương Tử Nha, Tôn Vũ, Bạch Khởi, Hàn Tín, Hạng Vũ, Lý Quảng, Vệ Thanh, Tiết Nhân Quý, Lý Tịnh, Tần Thúc Bảo, Nhạc Phi, Hoa Mộc Lan, Mục Quế Anh, Lương Hồng Ngọc. Mỗi tướng sinh **hai bộ**: huyền thoại `tq-<id>` (phẩm l) và thần `tt-<id>` (phẩm m, công thủ và mốc bộ ×1,5). Rút được **huyền thoại** → tướng mặc sẵn bộ huyền thoại; **thần thoại** → mặc sẵn bộ thần. Chỉ số tướng nghiêng theo binh khí. Đồ của tướng **tháo ra cho người chơi dùng được**, nam nữ đều mặc.
- **Bộ 8 món**: vũ khí để trống tay trái = cầm hai tay (thương, cung, đao lớn, chùy lớn); bộ đủ 8 món là kích hoạt hiệu ứng (`Math.min(9, pieces.length)`); bảng đồ và thuộc tính hiện `n/8` hoặc `n/9`.
- **Điểm cộng sinh thêm chỉ số** (Sheet `thuoc_tinh` + `cau_hinh`, mỗi 100 điểm): **Sức khỏe** → `fullHeal` % hồi đầy máu khi trúng đòn (`suc_khoe_hoi_day`=2, tối đa 20%); **Trí tuệ** → `aim` chính xác cung nỏ (`tri_tue_chinh_xac`=4, cộng vào chính xác gốc của cung / nỏ), hồi mana mỗi giây (`tri_tue_hoi_mana`=2), giảm hồi chiêu (như cũ); **Mệnh lệnh** → `mercDmg` sát thương lính thuê và `petDmg` sát thương quái thu phục (`menh_lenh_sat_thuong`=50 % mỗi 100 điểm). Bốn chỉ số này cũng rơi thành dòng ngẫu nhiên trên đồ. Bảng Thuộc tính hiện rõ các chỉ số nhỏ từng chỉ số lớn sinh ra.
- Code.gs: `LH_STATIC` thêm tab `tuong` (file bo_huyen_thoai), `LH_BO_SUNG` thêm `vu_khi`, `tuong` (khóa `vu_khi` theo `loai`); chạy `kiemTra` để tạo tab `tuong` và chép dòng mới.

## Bản 10.13: thầy đồ chấm nhanh, màn hình chờ đổi vùng, lính thành có cấp, lò rèn/hiệu buôn, bỏ cho thuê, thú thần thoại, hiệu ứng vùng, sự kiện đột xuất, cỏ may mắn, số sát thương màu

- **Thầy đồ**: nộp bài gọi `quizCheck` (đọc, không khóa, không ghi Sheet → nhanh) trả câu sai + **chữ ký HMAC** (khóa bí mật `LH_KEY` tự sinh trong Script Properties); trình duyệt áp dụng op `quiz{wrong,sig}` ngay (PREDICT), máy chủ kiểm chữ ký khi nhận gói lưu (`Player._sign`/`_sid` đặt trong `handle`). `quizShow` cũng thành lệnh đọc. **Bỏ mọi bộ NV\*, SKQ\*** (lọc ở `Player.load` và `lhStatic_`), còn 3 bộ `DX_*` (mẫu chép đủ vào `cau_hoi` mặc định).
- **Đổi vùng có màn hình chờ** (`LH_Loader` với tên vùng, bước tải gói → dựng), quá 20 giây thì bỏ và cho bấm lại.
- **Lính thành trì chào thuê theo ngày** (`Player.mercOffers`): mỗi mẫu 3 suất, **cấp** quanh cấp thành (−10/0/+15 +0–7), điểm chỉ số `cấp × linh_diem_cap` chia ngẫu nhiên vào 4 chỉ số, mệnh lệnh cộng thêm, giá theo cấp; op `hire{id,k,day}` sinh lại đúng suất trên máy chủ (lệch ngày >1 → `MERC_CU`). Lính giữ `lv`.
- **Lò rèn chỉ bán vũ khí**; mũ / giáp / quần / găng / hài / áo choàng (và đồ hiệu ứng loại đó) sang **hiệu buôn** ở cả 4 thành (`genmaps goodsRows`). `capNhatV1013` dọn dòng `cua_hang thanh-*` cũ trên Sheet.
- **Bỏ hẳn cho thuê nhân vật** (`mercRegister/mercCancel/mercList/mercBuy`, tab "Lính người chơi", bot lấy tên người chơi); nhân vật đang `merc` tự về `active` khi mở lều. **Chợ chỉ nhận** đồ huyền thoại / thần, cánh, thú cưỡi (`tradeable`).
- **Thú cưỡi thần thoại** (hiệu buôn / chuồng thú 4 thành, phẩm chất hoàn hảo): Kỳ Lân Lửa (hút máu 6%), Bạch Hổ (sát thương +12%), Phượng Hoàng Lửa (hút máu 10%), Huyền Vũ (phòng ngự +20%), Thiên Mã (sát thương +18%), Thanh Long (**phân thân** 15%: hạ quái gọi bản sao của bạn đánh cùng 10 giây, tối đa 2), Cửu Vĩ Hồ (hút máu 15%), Kim Long (sát thương +25%). Hiệu ứng mới `dmgPct`, `defPct`, `clone` trong `derive` / `kill`.
- **Luyện khí sư** bày cánh: giá treo 3 đôi cánh bay lượn sau lưng NPC (ảnh `vat_pham:canh-*` nếu có) và thư viện cánh trong bảng Dung hợp.
- **Hiệu ứng vùng** (`hazard` trong gói bản đồ, ngoài vùng an toàn): `burn` mất 1% máu/giây (Sa mạc, Núi Lửa, Hoang Mạc Xương, Địa Ngục Môn), `freeze` thỉnh thoảng đóng băng (Núi tuyết, Băng Nguyên, Thiên Sơn), `slow` chậm 30% (Đầm Lầy, Vực Yêu Tinh).
- **Sự kiện đột xuất** (`Player.EVENTS`, mỗi `su_kien_phut`=5 phút theo mốc đồng hồ, quái hiện ngoài vùng an toàn quanh điểm xuất hiện, băng rôn đếm ngược): làng — *Kẻ trộm chó* (đánh dưới 40% máu thì bỏ chạy, chạy khuất là thắng); Cổ Loa — *Quân phương Bắc tràn xuống* (6 lính + 1 tướng, 10 phút); Thăng Long — *Đạo tặc cướp kho lương*; Hoa Lư — *Hổ dữ sổng chuồng*; Phú Xuân — *Gian tế ám sát*. Thắng → op `eventWin` (PREDICT): **cỏ may mắn** 2–8 + tiền + hồng ngọc; máy chủ chống nhận trùng (`srv.evAt`). Quái sự kiện có dòng `quai` riêng (`ke-trom-cho`, `linh-phuong-bac`, `tuong-phuong-bac`, `dao-tac`, `ho-du`, `gian-te`), hình vẽ đăng ký sẵn (`LH_ART.add('su-kien')`).
- **Cỏ may mắn** (`s.luck`, hiện ở túi): mỗi cỏ +1% tỉ lệ gia cường / dung hợp, tối đa `co_may_man_toi_da`=10 cỏ một lần (ô nhập ở bảng gia cường / dung hợp, op `enh/enhSk/fuse` thêm `luck`).
- **Số sát thương**: chỉ số, không chữ — trắng thường, màu phẩm chất cho hoàn hảo / huyền thoại / thần, x2 x3 chỉ to hơn; tiền nhặt tách **vàng / bạc / đồng / hồng ngọc** thành số + biểu tượng; kinh nghiệm `+n exp`.
- Code.gs: `sign` (HMAC), `quizCheck`, `quizShow`; hàm **`capNhatV1013`** (chạy sau `kiemTra`).

## Bản 10.12: lều tải nhanh, âm thanh ổn định, mỹ phẩm dùng ngay, 5 ô sách, cấp 400, chợ một lượt gọi, Tìm con theo NPC

- **Lều nhân vật nhanh hơn**: danh sách nhân vật lưu đệm (`lh-chars-cache`, theo token) → lều hiện ngay, máy chủ trả về thì thay; tạo nhân vật không gọi lại `chars` (thêm thẳng vào lều), lời dẫn chạy nhanh hơn, hết chờ cố định 3,5 giây; vào làng tải song song gói bản đồ đứng lần trước (`lh-last-map-<id>`); **ảnh chỉ tải khi cần**: `LH_IMG` chỉ tải trước `giao_dien:*`, ảnh quái / NPC / đồ vật tải lúc vẽ lần đầu (`LH_IMG.warm` tải sớm quái + NPC của bản đồ đang vào).
- **Âm thanh**: iPhone gạt im lặng vẫn nghe (thẻ `<audio>` câm lặp vô hạn tạo trong lần chạm đầu → trang được coi là đang phát nhạc); tự mở lại khi bị gián đoạn (`statechange`, `pageshow`, `focus`), lệnh `play` gặp ngữ cảnh treo thì resume; nhạc nền trễ quá 1 giây thì nhảy nhịp thay vì dồn nốt.
- **Phấn Son**: bỏ hẳn **khung chân dung** (9 món `khung-*` không nạp, cửa hàng tự lọc; `capNhatV1012` xóa dòng trên Sheet). Mua thẻ avatar / nền hồ sơ / thuốc đa nhiệm → **áp dụng ngay**, không vào túi (op `buy` với đồ `cos` trả `cos:{kind,id}`; thuốc đa nhiệm chọn hiệu ứng tên ngay trên ô hàng `fx`). Bộ sưu tập vẫn ở Thuộc tính → Phấn Son.
- **Sách**: còn **5 ô kỹ năng** (`SKILL_SLOTS=5`; sách dư ở ô 6–10 bản cũ tự về túi). **Pháp sư ở 4 thành** bán 10 quyển sách bậc = cấp thành (cửa hàng `thanh-<thành>-sach`, giá × mul/2, luyện sách tại đó): chỉ số sách ×(1+bậc/25) — sách Cổ Loa (bậc 70) +15 thay vì +4.
- **Cấp**: nhân vật tối đa **400** (`cau_hinh cap_toi_da`), 20 vùng giãn từ 20 → 300 (`genmaps`: Rừng Trúc 20, Đầm Lầy 35, Đỉnh Mây 55, Cổ Loa 70, Bãi Biển 90, Núi Lửa 105, Rừng Ma 130, Băng Nguyên 150, Thăng Long 170, Cửu Trùng 190, Thủy Cung 205, Hoang Mạc Xương 215, Thiên Sơn 225, Hoa Lư 235, Địa Ngục Môn 245, Đảo Rồng 255, Vực Yêu Tinh 270, Cung Trăng 280, Phú Xuân 290, Thiên Đình 300). Bảng rơi đồ vẫn theo cấp cũ (`OLD_LV`).
- **Mạng chậm**: chuyển vùng báo "đang tải" sau 1,5 giây, quá 20 giây thì bỏ lượt (`World.cancel`) và cho bấm lại — không còn kẹt `travelling`; **Thương nhân**: danh sách hàng hỏi trước khi tới nơi (chạm NPC / 4 giây sau khi vào làng), giữ 60 giây và làm mới ngầm; **ký gửi / mua / nhận tiền chỉ một lượt gọi** — phần chơi chưa gửi đi kèm trong lệnh (`pre:{bid,sentAt,save,ops}`, máy chủ chạy `play` trước rồi tới lệnh, trả `pre.results`); nút đang gửi hiện "Đang gửi…".
- **Tìm con theo NPC**: mỗi việc gắn một NPC (cột `npc`, `noi`, `npc_ten` ở `nhiem_vu`): Thầy đồ & Đạo sĩ (làng) → Sư thầy & Vũ công (Cổ Loa) → Ca nữ & Nghệ nhân đèn (Thăng Long) → Ca nương (Hoa Lư) → Cung nữ (Phú Xuân). Bảng Lý trưởng / Nhiệm vụ chỉ báo *"<NPC> ở <vùng> đang có việc muốn nhờ bạn"*; tới gặp NPC (dấu **!** hồng, **?** khi xong) mới thấy nội dung, nhận và trả việc tại chỗ (`Player.storyAt`, `storyNext`).
- Code.gs: `handle` nhận `pre`; hàm **`capNhatV1012`** chép cấp vùng, `cap_toi_da`, cột npc của việc `tc-*` vào dòng đã có trên Sheet và xóa khung (chạy một lần sau `kiemTra`).

## Bản 10.11: Phấn Son, cốt truyện Tìm con, Thầy đồ hỏi thư pháp, chết mất đồ, lính thành trì, tải nhanh

- **Tiệm Phấn Son** (NPC `phan-son` ở làng Thanh Mộc, mua bằng **hồng ngọc**): 9 thẻ avatar (thay ảnh chân dung khung trên + lều), 9 khung chân dung (viền ngoài vòng kinh nghiệm), 6 nền hồ sơ (nền khung trên), Thuốc đa nhiệm (hiệu ứng tên: ánh vàng, cầu vồng, lửa, băng, tím mộng). Lấy từ bảng DoiQua (tab QuaTang); ảnh là link Drive ở cột `anh` tab `vat_pham`, giá cột `gia_hong_ngoc`. Dùng (túi → Dùng) là vào bộ sưu tập `cos`, đổi qua lại ở **Thuộc tính → Phấn Son** (`op use`, `op cos`). Ô `cos`: không mặc, không bán, không rơi.
- **Cốt truyện "Tìm con"** (8 việc `tc-1`…`tc-8` ở Lý trưởng, nhóm riêng đầu bảng): người cha xuyên vào game lần theo manh mối cứu con gái — Rừng Trúc (bút lông) → Đỉnh Mây (giấy mực) → Bãi Biển Hoang (giá treo bút) → Rừng Ma (nghiên đá) → Thăng Long (ấn Thanh Điền, trùm) → Hoang Mạc Xương (ấn Ba Lâm) → Đảo Rồng (ấn Xương Hoá, trùm) → Thiên Đình (ấn Thọ Sơn, trùm cuối, cứu được con). Cột mới tab `nhiem_vu`: `yeu_cau` (việc trước), `loi_ket` (lời kể khi trả việc), `truyen`. Vật phẩm ô `quest` (8 món, ảnh Drive).
- **Thầy đồ** (NPC `thay-do` ở làng + 4 thành trì, bảng `Hỏi bài`): 20 bộ câu hỏi sách "Thư pháp Việt" (tab `bo_cau_hoi`; câu hỏi máy chủ đọc thẳng tab **CauHoi của bảng OCD_Quest** — `LH_NGOAI` trong Code.gs, đáp án không gửi xuống trình duyệt). Luật (`cau_hinh quiz_*`): 5 câu, sai ≤ 1 vẫn được thưởng hồng ngọc + kinh nghiệm; sai quá 2 lần hoặc bấm "Chưa biết" → săn 8 quái của vùng tương ứng (bộ 1 ↔ Rừng Trúc … bộ 20 ↔ Thiên Đình) lấy manh mối → thầy chỉ đáp án → trả lời lại nhận 50 %. Bộ sau mở khi xong bộ trước. Lệnh `quiz`, `quizHunt`, `quizShow` chạy trên máy chủ (lệnh không dự đoán nay trả đúng kết quả từng lệnh).
- **Gục ngã mất đồ đang mặc** (`cau_hinh chet_mat_do`=1): lệnh `die` xóa mọi ô trang bị (kể cả thú cưỡi, cánh); cấp, sách, lính, thú thu phục, túi đồ giữ nguyên; về làng như cũ.
- **Lính thành trì** (tab `linh`, cột `thanh`): 8 lính chỉ thuê được ở đúng thành (Cổ Loa 2, Thăng Long 2, Hoa Lư 2, Phú Xuân 2), cần cấp vào thành, chỉ số và giá cao, mặc đồ của thành. Mỗi ngày (giờ VN) nhận ngẫu nhiên một hệ sách theo mã lính (`Player.mercDaily`): đòn có hệ ×1,15, mỗi đòn thứ 4 ra chiêu diện rộng.
- **Mỗi thành một NPC một loại hàng**: Thợ rèn thành bán vũ khí + giáp (cả đồ hiệu ứng) — cửa hàng `thanh-<thành>-ren`; Quan mục bán thú cưỡi — `thanh-<thành>-thu` (Thăng Long, Phú Xuân; Cổ Loa, Hoa Lư không có Quan mục nên thú ở Hiệu buôn); Hiệu buôn chỉ còn áo choàng, cờ (và thú ở 2 thành kia); Pháp sư bán sách.
- **Tải nhanh**: dữ liệu tĩnh lưu đệm trong máy (`localStorage lh-data-cache` kèm mã băm `_h` máy chủ tính); lần sau gửi `h`, chưa đổi thì máy chủ chỉ trả `same:true` (đỡ ~120 KB); gọi `data` và `chars` song song.
- Code.gs: `LH_STATIC` thêm `bo_cau_hoi`, `cau_hoi` (file nhiem_vu), `LH_NGOAI`, `hideAnswers`; chạy `kiemTra` để tạo tab mới và thêm cột/dòng mới.

## Bản 10.10: hết kẹt khi vào thành, quái máu 1/5 sát thương ×2

- **Kẹt khi qua cổng vào Thành Cổ Loa, Kinh Thành Thăng Long** (và Hoa Lư): điểm xuất hiện `World.spawn` tính ở **góc ô** thay vì tâm ô, nên khi cổng không có tọa độ đích (`tx,ty`) nhân vật bị đặt đè lên ô đá kề bên (thành trì có đá sát điểm xuất hiện) → không đứng được. Sửa: `spawn` lấy tâm ô; `travel` kiểm tra `canStand`, bị chặn thì dời sang ô trống gần nhất (`nearestOpen`); `genmaps` giữ trống bán kính 2 ô quanh điểm xuất hiện (3 bản đồ thành trì sinh lại). Đã chạy thử **52 lượt qua cổng** của 25 bản đồ (kịch bản `scratchpad/v103/mapchk.py`): đứng được, tìm được đường tới vùng an toàn và mọi cổng.
- **Quái vùng cấp 20+** (20 bản đồ sinh, kể cả trùm): máu còn **1/5**, sát thương **gấp đôi** (`HP_K`, `DMG_K` trong `genmaps.mjs`); kinh nghiệm, tiền, đồ rơi giữ nguyên. Máy chủ: tab `quai` trên Sheet đang giữ số cũ → chạy `capNhatQuai()` một lần để chép lại hai cột `mau`, `sat_thuong` (chỉ dòng có `ban_do`, dòng bạn tự thêm không đổi).

## Bản 10.9: dáng tay / vũ khí thống nhất (tác giả duyệt theo bảng 18 dáng)

- **Quay trái là ảnh gương của quay phải** cho: tay không, trong làng (kiếm dắt hông, khiên / cung / nỏ / giáo / gậy đeo lưng), vũ khí hai tay (cung, nỏ, giáo) và **mọi lúc ra đòn** (`handSide`: `mirror`). Riêng lúc đứng / đi / đỡ có cầm đồ một tay (kiếm + khiên, gậy + khiên, song đao, cưỡi thú) quay trái giữ dáng riêng `LEFT_POSE` (khiên trước ngực, kiếm buông thấp) đã chốt ở 10.6.
- Trong làng / thành: tay như lúc tay không (một tay co trước bụng, tay kia buông, vung theo bước); kiếm trong vỏ ở hông, chuôi ở thắt lưng, lưỡi chúc dọc chân (vẽ nhỏ 0,8); khiên đeo lưng nhô lên sau vai; đồ dài đeo chéo sau lưng, đầu trên nhô qua vai, đầu dưới ló dưới hông (cung / nỏ xoay thêm 90° vì vẽ vuông góc hướng ngắm).
- Khi chém: khiên giữ nguyên vị trí lúc đứng (không nhảy lên ngực). Cung đứng: hạ thấp, dựng đứng bên hông trước. Giáo đứng: cầm chếch trước mặt, không đè lên mặt khi quay phải. `drawHeld` nhận `hp.s` (tỉ lệ).
- Áp dụng chung cho nhân vật, lính đi theo, người chơi ảo (cùng `drawHero`). Bảng duyệt: `scratchpad/v103/v109.jpg` (18 hàng × 2 hướng).

## Bản 10.8: âm thanh

- Toàn bộ âm thanh **tổng hợp bằng Web Audio** trong trình duyệt (`src/03-audio.js`, không tải file, không tốn băng thông): bật / tắt ở menu **Âm thanh** (lưu trong máy, khóa `lh-am`). iPhone chỉ phát sau thao tác chạm đầu tiên.
- **Nhạc nền** ngũ cung gảy kiểu đàn tranh, tự sinh không lặp, đổi theo cảnh: làng (nhẹ, có luyến như đàn bầu), trong thành (thêm tiếng chuông), hoang dã (ngũ cung thứ, trống trầm), gần trùm còn sống (nhanh, trống dồn). Tiếng cảnh: gió, chim (làng / thành), dế và cú (hoang dã), gầm trầm (trùm).
- **Tiếng động**: vung kiếm, đấm, dộng khiên, đâm giáo, phép (gậy), bắn cung, nỏ; trúng đòn thường / chí mạng; đỡ đòn; bị đánh; gục; hồi sinh; hạ quái, hạ trùm; nhặt đồng / đồ / đồ hiếm; nhiệm vụ xong; lên cấp; bước chân (đi bộ, vó thú, lướt khi đeo cánh); chiêu thú cưỡi; chiêu trùm (sét / đóng băng); qua cổng; vào vùng an toàn; búa rèn, gia cường thành / bại, dung hợp cánh; mở bảng, bấm nút, mua hàng.
- Điểm gắn trong `06-game.js` (`LH_Audio.play(...)`, `musicScene()`), `07-ui.js` (nút `#amBtn`, tiếng bấm nút). Tên tiếng xem bảng `SFX` trong `03-audio.js`.

## Bản 10.7: sửa trang tải đứng ở ~96% (máy chủ chậm)

- Nguyên nhân: gói dữ liệu tĩnh (quái, nhiệm vụ, vật phẩm, cửa hàng của 20 vùng…) đã ~122 KB, vượt giới hạn 100 KB một ô của CacheService; code cũ chỉ đệm khi dưới 95 KB nên **mọi lệnh gọi** đều đọc lại 15 tab Sheet → quá 25 giây là trang coi như rớt mạng, thử lại, nhìn như đứng ở 96%.
- Sửa (`gs-adapter.js`): nén gzip rồi chia nhiều ô đệm (`lhCachePut_` / `lhCacheGet_`, 122 KB → ~27 KB một ô), giữ 5 phút; `xoaBoNhoDem` xóa đủ các ô. Chỉ cần dán Code.gs mới và tạo phiên bản triển khai mới; không đổi gì ở game.

## Bản 10.6: dáng quay trái chốt, cánh dung hợp, bay lơ lửng, trẻ con trong thành, nạp thẻ

- **Dáng quay trái** (tác giả chọn mẫu 7 vòng 2): khiên trước ngực nhìn thẳng mặt ngoài vẽ trên thân; tay phải buông thấp, kiếm chĩa xuống trước, vẽ sau thân, lộ phần lưỡi bên hông trái. Áp dụng cho nhân vật, lính đi theo, người chơi ảo (hằng `LEFT_POSE` trong `06-game.js`).
- **Luyện khí sư** (Thăng Long, Phú Xuân; bảng `Dung hợp`): thú cưỡi **+9** (`dung_hop_thu_cap`) + một món **huyền thoại hoặc thần** + `dung_hop_ngoc` = 60 hồng ngọc → tỉ lệ `dung_hop_ti_le` = 40% ra một trong 8 đôi cánh: thiên thần, ác quỷ, tiên nữ, ánh sáng, xương, lôi phong, đại bàng, lửa (tab `vat_pham`, mã `canh-*`, không mua / không rơi). Cánh có **0–5 dòng** ngẫu nhiên trong `canh_dong` (sát thương cao nhất, sát thương nhỏ nhất, phòng ngự, máu, mana, **tầm đánh** — chỉ số mới `range`, nới tầm mọi đòn, trần 60% — tỉ lệ x3); tỉ lệ số dòng theo `dung_hop_dong` = 30/28/22/12/6/2 % cho 0…5 dòng. Phẩm chất theo số dòng: 0–1 Đẹp, 2–3 Hoàn hảo, 4 Huyền thoại, 5 Thần (giá trị dòng nhân thêm theo cấp thú). Thất bại: mất món huyền thoại / thần và hồng ngọc, thú cưỡi về +6. Lệnh `fuse` chạy trên máy chủ.
- Dáng cánh theo tên: ác quỷ = cánh dơi, xương = cánh xương, ánh sáng / lửa / lôi phong = cánh năng lượng phát sáng, còn lại cánh lông; màu theo cột `mau`.
- **Đeo cánh** (không phải áo choàng / cờ, không cưỡi thú): người lơ lửng cách đất, di chuyển thì lướt, chân không bước, bóng nhỏ lại; cưỡi thú thì như cũ.
- **Trẻ con** chơi đuổi bắt trong Cổ Loa, Hoa Lư, Phú Xuân (vai `tre-con*`, tỉ lệ nhỏ `s` trong bộ sinh NPC).
- **Nạp thẻ** (NPC ở cả 4 thành, bảng `Nạp thẻ`): gói trong tab mới `goi_nap` (tên, tiền, hồng ngọc, mô tả); chọn gói → mã QR VietQR chuyển khoản (`nap_ngan_hang` MB, `nap_so_tai_khoan`, `nap_ten_tai_khoan`, nội dung `nap_noi_dung` = `Ikyna {goi} {tai_khoan}` → ví dụ `Ikyna Goi 100K vnthudao`). Game không tự cộng; sau khi nhận tiền chạy `napHongNgoc('tên nhân vật hoặc tên đăng nhập', số hồng ngọc)` trong Apps Script (ghi nhật ký tab `nap_the` của file Người chơi).
- `kiemTra` tự thêm tab `goi_nap`, dòng `thuoc_tinh` `range`, 8 cánh ở `vat_pham`, các khóa `cau_hinh` mới.

## Ra bản mới

1. Sửa trong `src/` (và `VERSION`).
2. `node tools/build.mjs`
3. Commit lên `main`, rồi tạo nhánh phát hành `ban-<số bản>` (ví dụ `ban-10.7`) trỏ vào commit đó. Nhánh phát hành không bao giờ sửa lại, nên bộ nhớ đệm của jsDelivr không giữ nhầm bản cũ.
4. Trên Blogspot đổi `@ban-10.6` thành `@ban-10.7` (trang game và trang Chợ phiên).
5. Nếu `Code.gs` đổi: dán lại vào Apps Script, Triển khai → Quản lý triển khai → Sửa → Phiên bản mới (giữ nguyên URL).

## Dữ liệu trong Sheet

Mọi ô là số nguyên: tỉ lệ ghi theo %, tốc độ thú cưỡi ×100, tỉ lệ rơi đồ theo phần vạn (100 = 1%). Sửa Sheet xong chạy hàm `xoaBoNhoDem` trong Apps Script để game nhận ngay.
