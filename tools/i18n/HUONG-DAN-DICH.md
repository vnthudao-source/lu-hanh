# Translation guide — Lữ Hành (Vietnamese → English)

Lữ Hành is a browser RPG set in an old-Vietnamese village world (legend, folklore, Vietnamese history; some Chinese-classic figures like Tôn Ngộ Không, Tam Quốc generals). The English version is shown to foreign players. The UI is terse and icon-heavy: keep translations SHORT — about the same length as the Vietnamese, never longer than needed.

## How translations are applied (important)
Each item is a text fragment cut from the game's source. At runtime, the game replaces the Vietnamese fragment wherever it appears inside a rendered line. Fragments are often pieces of a longer sentence with numbers/names inserted between them, e.g. `'Đang tới '+placeName` produced the fragment `Đang tới` → translate as `Traveling to`. So:
- Translate the fragment so it reads naturally when a number / name / another fragment comes right before or after it.
- Keep leading/trailing words that connect (e.g. `cần cấp` → `requires level`).
- Keep placeholders, symbols, digits, `·`, `/`, `+`, `%`, `×`, emoji exactly as they are.
- Keep sentence case like the source (capital first letter if the source has it; lowercase if lowercase).
- Never add quotes around the output.

## Proper names — KEEP in Vietnamese, with diacritics, unchanged
- People / named characters: Tôn Ngộ Không, Ông Bụt, Mạnh Bà, Bà Triệu, Trần Hưng Đạo, Quang Trung, Âu Dương Tuân, Bé Na, Tí Còi, Na Lém, Gầy Đệ, Béo Ca, Hiệp khách Vân → "Swordsman Vân" (title translated, name kept), Tôn Quyền, Bạch Khởi, Bá Vương…
- Lands / maps / cities / named regions: Thanh Mộc, Thăng Long, Cổ Loa, Hoa Lư, Phú Xuân, Bạch Đằng, Thiên Đình, Cung Trăng, Thủy Cung, Lưu Sa Hà, Cửu Trùng Đài, Hỗn Nguyên Điện, Vạn Kiếm Sơn, Rừng Trúc, Rừng Ma, Núi Lửa, Núi tuyết, Sa mạc, Đầm Lầy, Đỉnh Mây, Băng Nguyên, Huyết Hải, Hỗn Độn Hải, Hư Không Giới, Địa Ngục Môn, Vực Yêu Tinh, Đảo Rồng, Hang Cướp, Hoang Mạc Xương, Cổ Chiến Trường, Rừng Đông Ngạn, Tây Lương, Giang Đông… (any capitalized map/region name: keep).
- When a generic word wraps a proper name, translate the generic word only: `Làng Thanh Mộc` → `Thanh Mộc Village`; `Thành Cổ Loa` → `Cổ Loa Citadel`; `Bộ Trần Hưng Đạo` → `Trần Hưng Đạo Set`; `Áo bát quái Ngọa Long` → `Ngọa Long Bagua Robe`.
- A fragment that is ONLY a proper name: return it unchanged.

## Translate
Roles/titles (Lý trưởng, Thợ rèn), monster/creature kinds (Sói tuyết → Snow Wolf), item names (Áo vải → Cloth Shirt), sub-areas (Bãi sói tuyết → Snow Wolf Field, Trạm nghỉ → Rest Stop, Trong thành → Inside the Citadel), UI, dialogue, quests, quiz questions (history quiz: translate the question faithfully, keep names/dates).
Dialogue: natural, slightly old-fashioned storybook tone (ngươi/ta → you/I; plain, not Shakespearean). Onomatopoeia: adapt (Chíp chíp → Cheep cheep, Măm măm → Nom nom, Ầm → Boom).

## Glossary (use exactly)
| Vietnamese | English |
|---|---|
| vàng | gold |
| bạc | silver |
| đồng (tiền) | coins (`đ` alone = keep `đ`) |
| hồng ngọc | rubies (Hồng ngọc → Rubies) |
| Sức mạnh / Nhanh nhẹn / Sức khỏe / Trí tuệ | Strength / Agility / Vitality / Intellect |
| Mệnh lệnh | Command |
| Máu / Mana | HP / MP |
| Công / Thủ / Né / Tốc | ATK / DEF / Dodge / SPD |
| Sát thương | Damage |
| Kinh nghiệm | EXP |
| cấp | level |
| Thường / Đẹp / Hoàn hảo / Huyền thoại / Thần / Thần thoại | Common / Fine / Perfect / Legendary / Divine / Mythic |
| Gia cường | Enhance |
| Dung hợp | Fuse |
| Luyện sách | Train Book |
| Thú cưỡi | Mount |
| Lính / Thuê lính | Soldiers / Hire Soldiers |
| Túi đồ | Bag |
| Nhiệm vụ / Nhận việc / Trả việc | Quest / Accept Quest / Turn In |
| Về làng | Return to Village |
| Vào làng | Enter Village |
| Tạo nhân vật | Create Character |
| Đăng nhập / Đăng ký / Mật khẩu | Log in / Sign up / Password |
| Mã khôi phục | Recovery Code |
| Ký gửi / Chợ / Mua bán | Consign / Market / Trade |
| Nạp thẻ | Top Up |
| Bãi luyện công | Training Ground |
| Lý trưởng | Village Chief |
| Thầy đồ | Village Teacher |
| Thợ rèn / Lò rèn | Blacksmith / Forge |
| Đạo sĩ | Taoist |
| Pháp sư | Mage |
| Tướng quân | General |
| Luyện khí sư | Alchemist |
| Người giữ rương | Chest Keeper |
| Kiếm / Đao / Thương / Cung / Nỏ / Chùy / Gậy phép / Khiên | Sword / Saber / Spear / Bow / Crossbow / Mace / Staff / Shield |
| Sách Hỏa/Thủy/Mộc/Kim/Thổ/Lôi/Phong/Băng/Ánh sáng/Ma công | Fire/Water/Wood/Metal/Earth/Thunder/Wind/Ice/Light/Demon Book |
| Liên hoàn / Diện rộng / Phân thân | Chain / Area / Clone |
| Trùm | Boss |
| Quái | Monster(s) |
| Hồi sinh / Tái sinh | Respawn / Rebirth |
| Bộ (trang bị) | Set |
| Đồ thần | Divine gear |
| Võ đài | Arena |

## Output format
Write a JSON object mapping each `vi` string EXACTLY (byte-for-byte, as given) to its English translation. Every input item must appear once. Example:
{"Đang tới": "Traveling to", "Làng Thanh Mộc": "Thanh Mộc Village", "Tôn Ngộ Không": "Tôn Ngộ Không"}
