// Đóng gói: node tools/build.mjs
//   dist/lu-hanh.css, dist/lu-hanh.js      → game, nạp qua jsDelivr trên Blogspot
//   dist/lu-hanh.html                       → game một file (giống file trong Google Doc), mở thẳng để chơi thử ngoại tuyến
//   dist/maps/<mã>.js                       → gói bản đồ / phó bản (ngoài Thanh Mộc): dữ liệu + hình vẽ riêng, game chỉ tải khi nhân vật tới gần cổng
//   (lu-hanh.js, lu-hanh.css, gói bản đồ được rút gọn bằng Terser trong tools/vendor; lu-hanh.html giữ nguyên để đọc)
//   dist/cho-phien.css, dist/cho-phien.js   → trang Chợ phiên (từ v9.3 chỉ còn trang báo dời vào game)
//   dist/cho-phien.html                     → Chợ phiên một file để thử ngoại tuyến
//   apps-script/Code.gs                     → dán vào Apps Script (máy chủ chung cho game và Chợ phiên)
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {minify} from './vendor/terser/main.js';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const rd=f=>fs.readFileSync(path.join(root,f),'utf8'),wr=(f,s)=>{fs.writeFileSync(path.join(root,f),s);console.log(f.padEnd(24),s.length);};
const V=rd('VERSION').trim();
const API='https://script.google.com/macros/s/AKfycbwEUXIQSLK1t6FXNDDD18lbJGNomqhMAzcwh55N_uzKbUL19LaxvieMyhLpzrB06VfzgA/exec';
const GAME=['00-loader.js','01-data.js','02-core.js','03-net.js','03-img.js','04-art.js','04-world.js','04-looks.js','05-player.js','06-game.js','07-ui.js','08-portal.js'];
const CHO=['cho/cho.js'];
// CSS: gắn mọi luật vào khung gốc (#lu-hanh, #cho-phien) để giao diện Blogspot không đè được (nút, chữ, ô nhập)
function scope(src,id){
  src=src.replace(/\/\*[\s\S]*?\*\//g,'');let out='',i=0;
  const pre=sel=>sel.split(',').map(x=>{x=x.trim();if(!x)return x;if(x===':root'||x==='body'||x==='html')return id;if(x==='*')return id+' *';if(/^(body|html)[.:#]/.test(x))return x.replace(/^(body|html)/,id);return id+' '+x;}).join(',');
  function block(){let d=0,st=i;for(;i<src.length;i++){if(src[i]==='{')d++;else if(src[i]==='}'){d--;if(d===0){i++;break;}}}return src.slice(st,i);}
  while(i<src.length){
    const b=src.indexOf('{',i);if(b<0)break;
    const head=src.slice(i,b).trim();
    if(head.startsWith('@media')||head.startsWith('@supports')){i=b;const inner=block();out+=head+'{'+scope(inner.slice(1,-1),id)+'}\n';}
    else if(head.startsWith('@')){i=b;out+=head+block()+'\n';}
    else{i=b;out+=pre(head)+block()+'\n';}
  }
  return out;
}
const rootCss=(id,ov)=>`${id}{position:fixed;inset:0;z-index:2147483000;overflow:${ov};text-align:left;line-height:normal}\nbody:has(${id}){overflow:hidden!important}\n`;
// JS: đổi các ký hiệu không phải chữ (· – — × → ★ …) thành \u{…} để Blogspot không biến thành &#183;
const safe=t=>t.replace(/[^\x00-\x7f]/gu,ch=>/[\p{L}\p{M}\p{N}]/u.test(ch)?ch:'\\u{'+ch.codePointAt(0).toString(16)+'}');
const banner=name=>`/*! Lữ Hành ${V} · ${name} · https://github.com/vnthudao-source/lu-hanh */\n`;
const inject=(body,probe)=>`(function(){if(document.getElementById('${probe}'))return;document.body.insertAdjacentHTML('beforeend',${safe(JSON.stringify(body))});})();\n`;
const page=(title,css,body,js,api)=>`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="game-version" content="${V}"><title>${title}</title><style>\n${css}</style></head><body>\n${body}<script>${cfgJs(api)}</script>\n${js.map(s=>`<script>\n${s}</script>\n`).join('')}</body></html>\n`;
const cfgJs=api=>`window.LH_API='${api}';window.LH_CHO='https://ikynagame.blogspot.com/p/cho-phien.html';window.LH_GAME='https://ikynagame.blogspot.com/';`;
// ---- bản đồ (thư mục maps/): bản đồ đầu nằm sẵn trong game; bản đồ khác là gói dist/maps/<mã>.js = dữ liệu maps/<mã>.json + hình vẽ maps/<mã>.art.js
const MAP0='thanh-moc',mapIds=fs.readdirSync(path.join(root,'maps')).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
const mapOf=id=>JSON.parse(rd('maps/'+id+'.json'));
const artOf=id=>fs.existsSync(path.join(root,'maps/'+id+'.art.js'))?rd('maps/'+id+'.art.js').replace(/^\s*\/\*[\s\S]*?\*\/\s*/,'').trim().replace(/;$/,''):'null';
const packOf=id=>`LH_PACK(${JSON.stringify(id)},${JSON.stringify(mapOf(id))},${artOf(id)});`;
// JS rút gọn (tên biến ngắn, bỏ khoảng trắng); giữ chú thích /*! … */ ở đầu
const MIN={compress:{passes:2},mangle:true,format:{comments:/^!/}};
const mini=async(src,what)=>{const r=await minify(src,MIN);if(!r.code)throw Error('Rút gọn lỗi: '+what);return r.code;};
// CSS rút gọn: bỏ xuống dòng, khoảng trắng thừa quanh { } ;
const miniCss=css=>css.replace(/\/\*(?!!)[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{};])\s*/g,'$1').replace(/;}/g,'}').trim()+'\n';
fs.mkdirSync(path.join(root,'dist/maps'),{recursive:true});
for(const f of fs.readdirSync(path.join(root,'dist/maps')))fs.unlinkSync(path.join(root,'dist/maps',f));
const monPack={};
for(const id of mapIds){const d=mapOf(id);if(d.id!==id)throw Error('maps/'+id+'.json: id phải là '+id);if(d.tiles.length!==d.h||d.tiles.some(r=>r.length!==d.w))throw Error('maps/'+id+'.json: tiles phải đủ '+d.h+' hàng × '+d.w+' ô');
  if(id===MAP0)continue;for(const m of d.monsters||[])monPack[m.type]=monPack[m.type]||id;
  wr('dist/maps/'+id+'.js',await mini(packOf(id),'maps/'+id));}
const mapJs=ids=>`window.LH_MAP_CDN='https://cdn.jsdelivr.net/gh/vnthudao-source/lu-hanh@ban-${V.replace(/^v/,'')}/dist/maps/';window.LH_MON_PACK=${JSON.stringify(monPack)};`+'window.LH_MAPS=window.LH_MAPS||{};'+ids.map(id=>id===MAP0?`window.LH_MAPS[${JSON.stringify(id)}]=${JSON.stringify(mapOf(id))};`:packOf(id)).join('\n');
// ---- game
const body=rd('src/body.html').replaceAll('{{VERSION}}',V),css=rootCss('#lu-hanh','hidden')+scope(rd('src/style.css'),'#lu-hanh');
const gameJs=ids=>GAME.flatMap(f=>f==='04-art.js'?[safe(rd('src/'+f)),safe(mapJs(ids))]:[safe(rd('src/'+f))]);
const js=gameJs([MAP0]),jsAll=gameJs(mapIds);
wr('dist/lu-hanh.css',banner('Làng Thanh Mộc')+miniCss(css));
wr('dist/lu-hanh.js',safe(await mini(banner('Làng Thanh Mộc')+inject(body,'portal')+js.map(s=>';'+s).join('\n'),'lu-hanh.js')));
wr('dist/lu-hanh.html',page(`Lữ Hành ${V} · Làng Thanh Mộc`,css,body,js,API));
wr('dist/lu-hanh-offline.html',page(`Lữ Hành ${V} · thử ngoại tuyến`,css,body,jsAll,''));
// file khởi động: hiện màn hình chờ, tải CSS + JS có đếm phần trăm
const B=n=>Buffer.byteLength(rd('dist/'+n),'utf8');
wr('dist/lu-hanh-boot.js',banner('khởi động')+safe(rd('src/00-loader.js'))+';'+safe(rd('src/boot.js')).replace('@@FILES@@',JSON.stringify({css:{name:'lu-hanh.css',size:B('lu-hanh.css')},js:{name:'lu-hanh.js',size:B('lu-hanh.js')}})));
// ---- Chợ phiên (dùng chung bộ biểu tượng của game)
const sprite=body.match(/<svg style="position:absolute;width:0[\s\S]*?<\/svg>/)[0];
const choBody=rd('src/cho/body.html').replace('<div id="cho-phien">','<div id="cho-phien">\n'+sprite),choCss=rootCss('#cho-phien','auto')+scope(rd('src/cho/cho.css'),'#cho-phien'),choJs=CHO.map(f=>safe(rd('src/'+f)));
wr('dist/cho-phien.css',banner('Chợ phiên')+choCss);
wr('dist/cho-phien.js',banner('Chợ phiên')+inject(choBody,'chBody')+choJs.map(s=>';'+s).join('\n'));
wr('dist/cho-phien.html',page(`Chợ phiên · Lữ Hành ${V}`,choCss,choBody,choJs,API));
wr('dist/cho-phien-offline.html',page(`Chợ phiên · thử ngoại tuyến`,choCss,choBody,choJs,''));
// ---- đoạn dán vào Blogspot
const cdn=`https://cdn.jsdelivr.net/gh/vnthudao-source/lu-hanh@ban-${V.replace(/^v/,'')}/dist/`;
const cfg=`<script>${cfgJs(API)}</script>`;
wr('blogspot/nhung-vao-blogspot.html',`<!-- Lữ Hành ${V} · trang GAME: dán vào bài/trang Blogspot (chế độ HTML). Bản mới: đổi số sau @ban- -->\n${cfg}\n<script charset="utf-8" src="${cdn}lu-hanh-boot.js"></script>\n`);
wr('blogspot/cho-phien.html',`<!-- Lữ Hành ${V} · trang CHỢ PHIÊN: tạo Trang mới tên "cho-phien" trên Blogspot, dán vào (chế độ HTML). -->\n<link rel="stylesheet" href="${cdn}cho-phien.css">\n${cfg}\n<script charset="utf-8" src="${cdn}cho-phien.js"></script>\n`);
// ---- Code.gs
const ctx={};vm.runInNewContext(rd('src/01-data.js')+';'+rd('src/05-player.js')+';this.GD=GAME_DATA;this.P=Player;',ctx);
const ids=JSON.parse(rd('apps-script/sheet-ids.json'));
const table=Object.fromEntries(Object.entries(ctx.GD).map(([k,rows])=>{const h=Object.keys(rows[0]);return [k,[h,...rows.map(r=>h.map(c=>r[c]))]];}));
// ---- Bảng ảnh tĩnh (Sheet "LH · Hình ảnh"): mọi đối tượng dùng được ảnh, cột link_anh để trống = dùng hình mặc định
const ICON_VN={sword:['Kiếm','Loại vũ khí kiếm, nút đánh thường khi cầm kiếm'],bow:['Cung','Loại cung, nút đánh khi cầm cung'],crossbow:['Nỏ','Loại nỏ, nút đánh khi cầm nỏ'],staff:['Gậy phép','Loại gậy, nút đánh khi cầm gậy'],spear:['Thương','Loại thương, nút đánh khi cầm thương'],shield:['Khiên','Loại khiên, chỉ số Thủ, vùng an toàn'],punch:['Nắm đấm','Sức mạnh, tay không'],hat:['Mũ','Ô trang bị mũ'],armor:['Áo giáp','Ô trang bị áo'],pants:['Quần','Ô trang bị quần'],gloves:['Găng tay','Ô trang bị găng'],shoes:['Giày','Ô trang bị giày'],wings:['Áo choàng / cánh','Ô trang bị cánh'],mount:['Ngựa','Thú cưỡi, nút kỹ năng thú cưỡi'],book:['Sách','Sách kỹ năng, ô kỹ năng'],ore:['Khoáng thạch','Nguyên liệu'],lock:['Ổ khóa','Ô khóa, đăng nhập'],pin:['Ghim bản đồ','Tên vùng trên bản đồ nhỏ'],flame:['Lửa','Sách Hỏa, kỹ năng Liên hoàn'],water:['Nước','Sách Thủy, trùm Ngư Tinh'],wood:['Cây','Sách Mộc'],metal:['Kim loại','Sách Kim'],earth:['Đất','Sách Thổ'],heart:['Trái tim','Máu, Sức khỏe'],orb:['Cầu mana','Mana, hết mana'],speed:['Tốc độ','Tốc độ chạy, tốc đánh'],reflect:['Phản đòn','Chỉ số phản đòn'],feather:['Lông vũ','Nhanh nhẹn'],flag:['Lá cờ','Mệnh lệnh, lính đang ra trận'],talk:['Nói chuyện','Gặp dân làng'],bridge:['Cây cầu','Nhiệm vụ qua cầu'],deer:['Hươu','Nhiệm vụ săn hươu'],lion:['Sư tử','Nhiệm vụ sư tử'],elephant:['Voi','Voi rừng, thú cưỡi voi'],croc:['Cá sấu','Nhiệm vụ cá sấu'],coin:['Đồng tiền','Tiền'],close:['Dấu X','Đóng, báo lỗi'],eye:['Con mắt','Xem, tầm đánh'],out:['Cửa ra','Đăng xuất'],check:['Dấu tích','Xong, thành công'],next:['Mũi tên','Tiếp, nhận việc'],pen:['Bút','Đặt tên'],user:['Người','Lính, đổi nhân vật'],hand2:['Hai tay','Vũ khí cầm hai tay'],thunder:['Sấm sét','Sách Lôi'],wind:['Gió','Sách Phong'],ice:['Băng','Sách Băng'],demon:['Ma công','Sách Ma công, quái thu phục'],light:['Ánh sáng','Sách Ánh sáng'],spark:['Tia sáng','Trí tuệ, Mana, kỹ năng Combo'],whirl:['Lốc xoáy','Kỹ năng Diện rộng'],tiger:['Hổ','Thú cưỡi hổ, trùm Chúa Sơn Lâm'],anvil:['Cái đe','Gia cường'],bag:['Túi đồ','Nút túi đồ, nhặt đồ'],home:['Ngôi nhà','Về làng'],save:['Lưu','Nút lưu'],quest:['Nhiệm vụ','Nút nhiệm vụ, theo dõi việc'],menu:['Menu','Nút menu góc trên (ba gạch)'],map:['Bản đồ','Nút chọn bản đồ trong menu']};
const ICON_TIP='64×64, định dạng webp, nền trong suốt, nét đơn giản một màu (game tô màu theo chỗ dùng)';
const imgRows=[['nhom','ma','ten','dung_o','link_anh','goi_y','gioi_tinh','ghi_chu']];
// Gợi ý vẽ ảnh khớp với hình trên nhân vật (cùng bảng dáng vẻ src/04-looks.js)
vm.runInNewContext(rd('src/04-looks.js')+';this.LK=LH_Look;',Object.assign(ctx,{Player:ctx.P}));

for(const [,id] of body.matchAll(/<symbol id="i-([\w-]+)"/g)){const v=ICON_VN[id]||[id,''];imgRows.push(['bieu_tuong',id,v[0],v[1],'',ICON_TIP,'','']);}
const P=ctx.P,SLOT_VN={hand:'Vũ khí / tay',hat:'Mũ',armor:'Áo',pants:'Quần',gloves:'Găng tay',shoes:'Giày',wings:'Cánh',mount:'Thú cưỡi',book:'Sách'};
for(const [id,d] of Object.entries(P.items)){const S=d.set?P.SETS[d.set]:null;imgRows.push(['vat_pham',id,d.name+(S?' (Bộ '+S.name+' · '+S.hero+')':d.myth?' (Đồ thần)':''),SLOT_VN[d.slot]||'Nguyên liệu','',...(n=>[n.goi_y,n.gioi_tinh,n.ghi_chu])(ctx.LK.note(id))]);}
for(const [id,M] of Object.entries(P.MON))imgRows.push(['quai',id,M.name+(M.boss?' (trùm)':''),'Hình quái trên bản đồ (thay hình vẽ), quái thu phục, biểu tượng nhiệm vụ'+(M.boss?', thanh máu trùm':''),'','Khoảng 256 px, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh','','']);
for(const {id,name} of mapIds.flatMap(m=>mapOf(m).npcs||[]))imgRows.push(['npc',id,name,'Hình dân làng trên bản đồ (thay hình vẽ)','','Khoảng 128×256, định dạng webp, nền trong suốt, quay mặt sang phải, chân chạm đáy ảnh, cao khoảng 2 lần rộng','','']);
[['logo','Logo Lữ Hành','Màn hình chờ, cổng đăng nhập','PNG nền trong suốt, ngang khoảng 480×200'],['nen_cho','Màn hình chờ (loading screen) chung','Mọi màn hình chờ, khi chưa có ảnh riêng bên dưới','Ảnh ngang 1920×1080'],['nen_cho_tai_game','Màn hình chờ lúc mở trang','Thanh tải 0–100% khi mở trang và kết nối máy chủ','Ảnh ngang 1920×1080'],['nen_cho_tao_nv','Màn hình chờ tạo nhân vật','Lời dẫn câu chuyện khi bấm khởi tạo nhân vật','Ảnh ngang 1920×1080'],['nen_cho_vao_lang','Màn hình chờ vào làng','Khi bấm Vào làng, tải nhân vật và bản đồ','Ảnh ngang 1920×1080'],['nen_leu','Cảnh căn lều chọn nhân vật','Phía sau 5 ô nhân vật trước lều','Ảnh ngang 1200×700'],['nen_dang_nhap','Nền cổng đăng nhập','Phía sau khung đăng nhập và căn lều','Ảnh ngang 1920×1080'],['chan_dung_nam','Chân dung nhân vật nam','Ô chân dung góc trên trái','Vuông 256×256'],['chan_dung_nu','Chân dung nhân vật nữ','Ô chân dung góc trên trái','Vuông 256×256'],['tui_do_roi','Túi đồ rơi','Túi vải rơi ra khi hạ quái','PNG nền trong suốt 64×64']].forEach(([id,n,w,g])=>imgRows.push(['giao_dien',id,n,w,'',g.replace(/^PNG nền trong suốt/,'Định dạng webp, nền trong suốt').replace(/^Ảnh ngang/,'Định dạng webp, ảnh ngang').replace(/^Vuông/,'Định dạng webp, vuông'),'','']));
// (không đưa vào Code.gs: file Sheet đã có sẵn danh sách; caiDat chỉ đổi tên trang đầu thành hinh_anh)
wr('apps-script/hinh-anh.csv',imgRows.map(r=>r.map(x=>/[",\n]/.test(String(x))?'"'+String(x).replace(/"/g,'""')+'"':String(x)).join(',')).join('\n')+'\n');
wr('apps-script/Code.gs',rd('apps-script/gs-adapter.js').replace('@@IDS@@',JSON.stringify(ids,null,1))+
  '\n// Ảnh vật phẩm game vẽ sẵn (hàm capNhatAnh chép vào Drive)\nconst LH_ANH_CDN='+JSON.stringify(cdn.replace(/dist\/$/,'dist/anh/'))+';\n'+
  '\n// Dòng ảnh giao diện, quái bổ sung vào file Hình ảnh khi chạy kiemTra\nconst LH_HINH_THEM='+JSON.stringify(imgRows.slice(1).filter(r=>r[0]==='giao_dien'||r[0]==='quai'||r[0]==='bieu_tuong').map(r=>Object.fromEntries(imgRows[0].map((k,i)=>[k,r[i]]).filter(([k])=>r[0]!=='bieu_tuong'||['nhom','ma','ten','dung_o'].includes(k)))))+';\n'+
  '\n// Dữ liệu mặc định (dùng khi tab Sheet còn trống và để chạy caiDat)\nconst LH_DEFAULT=(d=>Object.fromEntries(Object.entries(d).map(([k,[h,...rows]])=>[k,rows.map(r=>Object.fromEntries(h.map((c,i)=>[c,r[i]])))])))('+JSON.stringify(table)+');\n\n'+rd('src/02-core.js')+'\n'+rd('src/05-player.js')+'\n'+rd('src/04-looks.js'));
