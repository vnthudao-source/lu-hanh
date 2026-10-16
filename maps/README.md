# Bản đồ / phó bản

Mỗi bản đồ là một file `maps/<mã>.json`. Game dùng chung một bộ chạy bản đồ (`src/04-world.js`) và một bộ luật nhân vật (`Player`), nên thêm bản đồ chỉ là thêm dữ liệu.

- `thanh-moc.json` nằm sẵn trong file game (bản đồ đầu).
- Các bản đồ khác được đóng gói thành `dist/maps/<mã>.json`, game **chỉ tải khi nhân vật bước qua cổng** (vài KB). Thêm bao nhiêu bản đồ thì file game chính cũng không nặng thêm.
- Chạy `node tools/build.mjs`: kiểm tra `id` trùng tên file, `tiles` đủ `h` hàng × `w` ô.

## Các trường

| Trường | Ý nghĩa |
|---|---|
| `id`, `name` | mã (chữ thường, số, `-`) và tên hiện trên bản đồ nhỏ |
| `w`, `h` | rộng, cao (số ô; mỗi ô 48 điểm ảnh) |
| `tiles` | `h` chuỗi, mỗi chuỗi `w` ký tự: `.` cỏ · `#` chắn · `~` nước · `=` cầu · `:` đường đất · `,` cỏ khô · `"` ruộng lúa. Viền ngoài luôn là chắn |
| `spawn` | chỗ xuất hiện / hồi sinh `{x,y}` (ô) |
| `safe` | vùng an toàn `{x0,y0,x1,y1}`: không cưỡi thú, không dùng kỹ năng, lính gục chờ ở đây; vào vùng này là một mốc lưu. `cfg` (tùy chọn) lấy cạnh phải từ Sheet cấu hình |
| `zones` | tên vùng con `[{name,x0,y0,x1,y1}]` (hiện ở bản đồ nhỏ) |
| `bridges` | cầu `[{x0,x1,y0,y1,flag?,msg?}]`: đi qua cầu (mỗi chiều) là một mốc lưu; `flag` đánh dấu nhiệm vụ "qua cầu" |
| `decor` | trang trí nền: `pond` ao sen, `plaza` sân gạch `{kind,x,y,w,h}` |
| `objects` | `house {x,y,w,h,style: hall/shrine/forge/inn/stable/barn}`, `banyan`, `fire`, `well` (`ancient:true` + `id` = giếng cổ hồi máu) |
| `trees` | `[x,y,khô?]` mỗi cây một ô chắn |
| `npcs` | dân làng `{id,role,name,x,y,lines,panel?,shop?,x0?,x1?,facing?}` — `id` không trùng giữa các bản đồ; `role` chọn hình vẽ (elder, smith, guide, trainer, wizard, merchant) hoặc dùng ảnh `npc:<id>` trong Sheet Hình ảnh |
| `monsters` | `{type,x,y}` — `type` là mã quái trong Sheet quai |
| `portals` | cổng `{x,y,w,h,to,tx,ty}`: bước vào thì lưu rồi sang bản đồ `to`, đứng ở ô `tx,ty` |
| `ambient` | `"village"`: có chó, mèo, chuột chạy quanh (chỉ Thanh Mộc) |

Muốn mở bản đồ mới từ Thanh Mộc: thêm một cổng vào `portals` của `thanh-moc.json` (ví dụ ở rìa Đông Ngạn) trỏ tới mã bản đồ mới, và một cổng quay về ở bản đồ mới. Gục ở bản đồ khác thì về làng Thanh Mộc.
