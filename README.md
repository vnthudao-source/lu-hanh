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

## Ra bản mới

1. Sửa trong `src/` (và `VERSION`).
2. `node tools/build.mjs`
3. Commit lên `main`, rồi tạo nhánh phát hành `ban-<số bản>` (ví dụ `ban-8.6`) trỏ vào commit đó. Nhánh phát hành không bao giờ sửa lại, nên bộ nhớ đệm của jsDelivr không giữ nhầm bản cũ.
4. Trên Blogspot đổi `@ban-8.5` thành `@ban-8.6` (trang game và trang Chợ phiên).
5. Nếu `Code.gs` đổi: dán lại vào Apps Script, Triển khai → Quản lý triển khai → Sửa → Phiên bản mới (giữ nguyên URL).

## Dữ liệu trong Sheet

Mọi ô là số nguyên: tỉ lệ ghi theo %, tốc độ thú cưỡi ×100, tỉ lệ rơi đồ theo phần vạn (100 = 1%). Sửa Sheet xong chạy hàm `xoaBoNhoDem` trong Apps Script để game nhận ngay.
