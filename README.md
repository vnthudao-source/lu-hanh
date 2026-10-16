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

Dán nội dung `blogspot/nhung-vao-blogspot.html` vào bài viết ở chế độ HTML. Đoạn này nạp game từ:

```
https://cdn.jsdelivr.net/gh/vnthudao-source/lu-hanh@ban-8.2/dist/lu-hanh.js
https://cdn.jsdelivr.net/gh/vnthudao-source/lu-hanh@ban-8.2/dist/lu-hanh.css
```

Dòng `window.LH_API=''` là chỗ dán URL Web App (đuôi `/exec`). Để trống thì game chạy ngoại tuyến, lưu trên trình duyệt.

## Chợ phiên (trang riêng)

Trên Blogspot tạo **Trang** mới, đường dẫn `cho-phien`, dán `blogspot/cho-phien.html` (chế độ HTML). Trang này dùng chung tài khoản và máy chủ với game: ký gửi đồ Hoàn hảo/Thần, mua đồ, mua nhân vật người khác làm lính đi theo, nhận tiền bán hàng.

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

## Ra bản mới

1. Sửa trong `src/` (và `VERSION`).
2. `node tools/build.mjs`
3. Commit lên `main`, rồi tạo nhánh phát hành `ban-<số bản>` (ví dụ `ban-8.3`) trỏ vào commit đó. Nhánh phát hành không bao giờ sửa lại, nên bộ nhớ đệm của jsDelivr không giữ nhầm bản cũ.
4. Trên Blogspot đổi `@ban-8.2` thành `@ban-8.3` ở 2 chỗ.
5. Nếu `Code.gs` đổi: dán lại vào Apps Script, Triển khai → Quản lý triển khai → Sửa → Phiên bản mới (giữ nguyên URL).

## Dữ liệu trong Sheet

Mọi ô là số nguyên: tỉ lệ ghi theo %, tốc độ thú cưỡi ×100, tỉ lệ rơi đồ theo phần vạn (100 = 1%). Sửa Sheet xong chạy hàm `xoaBoNhoDem` trong Apps Script để game nhận ngay.
