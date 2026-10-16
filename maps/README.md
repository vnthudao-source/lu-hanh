# Bản đồ / phó bản

Mỗi bản đồ là một file `maps/<mã>.json`. Game dùng chung một bộ chạy bản đồ (`src/04-world.js`) và một bộ luật nhân vật (`Player`), nên thêm bản đồ chỉ là thêm dữ liệu.

- `thanh-moc.json` nằm sẵn trong file game (bản đồ đầu).
- Các bản đồ khác được đóng gói thành `dist/maps/<mã>.js` (dữ liệu `<mã>.json` + hình vẽ `<mã>.art.js`, đã rút gọn), game **tải trước khi nhân vật tới gần cổng** (khoảng 9 ô) nên bước qua cổng là vào ngay. Thêm bao nhiêu bản đồ thì file game chính cũng không nặng thêm.
- Quái của bản đồ nào thì hình vẽ nằm trong gói bản đồ đó; quái thu phục đi theo về làng thì game tự tải gói chứa hình của nó.
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
| `theme` | bộ nền vẽ từng ô trong `<mã>.art.js` (`sand`, `snow`, `cave`); bỏ trống = nền cỏ của làng |
| `sky` | hiệu ứng phủ màn hình (`sand` cát bay, `snow` tuyết rơi, `cave` bóng tối, chỉ sáng quanh người và vật có `light`) |
| `objects` (thêm) | vật riêng của gói: `{kind,x,y,w?,solid?,light?}` — `kind` là tên hàm trong `obj` của `<mã>.art.js` (xương rồng `cactus`, thốt nốt `palm`, tháp Chàm `tower`, thông tuyết `pine`, miếu đá `shrine`, thạch nhũ `stalag`, pha lê `crystal`…); `solid:false` đi xuyên qua; `light:"#màu"` phát sáng trong hang |
| `portals[].label` | tên hiện trên cổng khi lại gần |

## Hình vẽ của gói (`<mã>.art.js`)

Một hàm `K=>({...})`, nhận bộ bút `K` (`ell`, `line`, `poly`, `rr`, `shade`, `mix`, `noise`, `hash`, `blob`) và trả về:

- `theme.<tên>.tile(c,x,y,v,n,T,G)`: vẽ một ô nền (`v` = loại ô 0 cỏ, 1 chắn, 2 nước, 3 cầu, 4 đường, 5 cỏ khô, 6 ruộng/đặc biệt; `G(x,y)` đọc ô bên cạnh); `over(c,def,T,G)` vẽ thêm sau cùng (hồ, băng có mép tròn).
- `obj.<kind>(c,o,t)`: vẽ vật; `mon.<mã quái>(c,m,M,s)`: vẽ quái (gốc tọa độ ở chân, mặt quay sang phải); `sky.<tên>(c,s)`: hiệu ứng trên màn hình; `ring.<mã quái>`: màu vòng đòn đánh.

Ảnh dán ở Sheet Hình ảnh (`quai:<mã>`) vẫn được ưu tiên hơn hình vẽ.

Muốn mở bản đồ mới từ Thanh Mộc: thêm một cổng vào `portals` của `thanh-moc.json` (ví dụ ở rìa Đông Ngạn) trỏ tới mã bản đồ mới, và một cổng quay về ở bản đồ mới. Gục ở bản đồ khác thì về làng Thanh Mộc.
