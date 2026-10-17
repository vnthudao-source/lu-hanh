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
