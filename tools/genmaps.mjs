/* Sinh 20 bản đồ cấp 20–300 (v10.12: giãn cấp các vùng, thành cuối lv 290–300, nhân vật tối đa lv 400; v10.2: 10 bản đồ cấp 20–100; v10.3: thêm 10 bản đồ cấp 105–150, hàng hóa thành trì, diện mạo): maps/<mã>.json + maps/<mã>.art.js từ bảng tham số dưới đây.
   Chạy: node tools/genmaps.mjs  (rồi node tools/build.mjs). Nền, vật, quái, NPC đều vẽ bằng bộ sinh LH_ART.gen (src/04-gen.js),
   nên mỗi gói bản đồ chỉ còn dữ liệu ô + vài trăm byte khai báo hình. Sửa tham số ở đây rồi chạy lại là ra bản đồ mới. */
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const W=48,H=34;
// ---- băm cố định theo tọa độ (sinh lại luôn ra cùng bản đồ)
const hash=(x,y,s=0)=>{let h=(x*374761393+y*668265263+s*1442695041)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
const noise=(x,y,sc,s)=>{const fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),u=fx-ix,v=fy-iy,a=hash(ix,iy,s),b=hash(ix+1,iy,s),c=hash(ix,iy+1,s),d=hash(ix+1,iy+1,s),su=u*u*(3-2*u),sv=v*v*(3-2*v);return a+(b-a)*su+(c-a)*sv+(a-b-c+d)*su*sv;};
// ---- 10 bản đồ: thứ tự = chuỗi cấp 20 → 100
const MAPS=[
 {id:'rung-truc',name:'Rừng Trúc',lv:20,from:'hang-dong',seed:21,theme:{g:['#7fa860','#5f8a48'],d:'bamboo',r:['#8d9a7a','#5f6a52','#3d4636'],w:['#6fb0c0','#3f8aa0'],p:'#8a7048'},sky:null,rock:.58,water:.78,dry:.3,
  deco:[['truc',{base:'tree',shape:'bamboo',c:['#5a7a3a','#6f9a44','#9ac860']},.09],['da',{base:'rock',c:['#8d9a7a','#4d5a42']},.015],['mieu',{base:'shrine',c:['#9a9484','#6b2d1e']},.004]],
  mobs:[['khi-rung','Khỉ rừng',{body:'quad',s:.7,c:['#8a6a3a','#5a4020','#d8b888','#5a4020'],tail:1,eye:'#1a1010'}],['ran-ho','Rắn hổ mang',{body:'snake',s:.8,c:['#4a6a2a','#2a4a18','#c8d070'],eye:'#e8e020'}]],
  boss:['moc-tinh','Mộc Tinh',{body:'golem',s:.9,c:['#4a6a2a','#2f4a1c','#8ab860'],eye:'#d8ff60',glow:'#a8ff80'},'slow,hoi-mau'],ring:'#a8d860'},
 {id:'dam-lay',name:'Đầm Lầy',lv:35,hazard:'slow',from:'sa-mac',seed:33,theme:{g:['#5e6e3a','#45552a'],d:'moss',r:['#6a6e5a','#454a3a','#2a2e22'],w:['#5a7a5a','#3a5a46'],p:'#6a5a3a',ripple:'#9ab08055'},sky:{n:30,col:'#c8d8b0',size:14,vx:12,vy:4,tint:'#2a3a2018'},rock:.62,water:.62,dry:.4,
  deco:[['cay-kho',{base:'tree',shape:'dead',c:['#4a3a2a']},.05],['co-lac',{base:'tree',shape:'round',s:.7,c:['#4a3a2a','#5a7a3a','#8aa050']},.03],['xuong',{base:'bones',c:['#d8d2c4']},.012]],
  mobs:[['dia-khong-lo','Đỉa khổng lồ',{body:'snake',s:.9,c:['#3a2a3a','#201820','#8a5a7a'],eye:'#ff6060'}],['ech-doc','Ếch độc',{body:'blob',s:.9,c:['#6aa040','#3a6a20','#c8e860'],eye:'#1a1010'}]],
  boss:['xa-tinh','Xà Tinh',{body:'dragon',s:.8,c:['#3a7a4a','#1f4a2c','#9ad080','#e8e060'],eye:'#ffe040',breath:'#9aff80'},'poison,slow'],ring:'#9ad080'},
 {id:'dinh-may',name:'Đỉnh Mây',lv:55,from:'nui-tuyet',seed:45,theme:{g:['#dfe8ee','#c4d3dc'],d:'cloud',r:['#aab6bf','#7a858e','#58626a'],w:['#bcd8ea','#9ac0dc'],p:'#b8ab98',sd:'#e8eef2'},sky:{n:26,col:'#ffffff',size:22,vx:16,vy:2,tint:'#dfe8f020'},rock:.6,water:.9,dry:.3,
  deco:[['thong',{base:'tree',shape:'cone',c:['#5a4232','#3a6a4a','#5a8a6a']},.05],['da-xanh',{base:'rock',c:['#aab6bf','#58626a']},.02],['cot-may',{base:'pillar',c:['#c8ccd0','#8a9298'],broken:1},.004]],
  mobs:[['ung-tuyet','Ưng tuyết',{body:'bird',s:.9,c:['#e8e8f0','#9aa0b0','#ffffff','#e8b040'],eye:'#1a1010'}],['de-nui','Dê núi',{body:'quad',s:.8,c:['#d8d0c0','#8a8070','#f0ece0','#6a5a40'],horn:1,eye:'#1a1010'}]],
  boss:['loi-dieu','Lôi Điểu',{body:'bird',s:1.8,c:['#3a3a6a','#20204a','#8a8aff','#ffe040'],eye:'#ffff80',horn:1,slow:1},'stun,slow,bay'],ring:'#8a8aff'},
 {id:'co-loa',name:'Thành Cổ Loa',lv:70,from:'rung-truc',seed:57,citadel:1,theme:{g:['#8a9a5a','#6f8048'],d:'grass',r:['#9a9484','#6a6456','#44403a'],w:['#6fa8c0','#3f80a0'],p:'#a08a60',sd:'#b0a070'},sky:null,rock:.66,water:.8,dry:.35,
  deco:[['da-co',{base:'rock',c:['#9a9484','#44403a']},.012],['co-thu',{base:'tree',shape:'round',c:['#5a4232','#4a7a3a','#7aa850']},.035],['tru-gay',{base:'pillar',c:['#b0a890','#6a6456'],broken:1},.006]],
  mobs:[['am-binh','Âm binh',{body:'human',s:.9,c:['#6a7a8a','#3a4a5a','#9aaabb','#c8c8d0'],see:1,weapon:'spear',hat:'helm',skin:'#9aaabb',eye:'#80ff80'}],['quy-doi','Quỷ đói',{body:'human',s:.85,c:['#5a4a4a','#3a2a2a','#9a8a8a'],hat:'hood',weapon:'club',skin:'#b0a0a0',eye:'#ff6060'}]],
  boss:['tuong-am-binh','Tướng Âm Binh',{body:'human',s:1.7,c:['#4a5a7a','#2a3a5a','#8a9ab0','#d8c060'],see:1,weapon:'sword',hat:'helm',armor:1,skin:'#9aaabb',eye:'#80ff80',glow:'#60ff9044'},'armor,weak'],ring:'#80ff80',
  npcs:[{id:'linh-gac-1',role:'linh-gac',name:'Lính gác',act:'patrol',x0:16,x1:31,y:9,lines:['Đứng lại! À, khách lạ. Thành Cổ Loa mở cửa đón người có chí.','Ngoài thành toàn âm binh của triều đại cũ, chớ đi đêm.']},
   {id:'linh-gac-2',role:'linh-gac',name:'Lính gác',act:'patrol',x0:16,x1:31,y:21,lines:['Vòng thành ốc này xây ba lớp, âm binh không vào được.']},
   {id:'quan-huyen',role:'quan-van',name:'Quan huyện',act:'turn',x:20,y:12,panel:'quests',lines:['Bản quan trông coi việc thành. Có việc gì cần người gan dạ, ta ghi hết ở đây.','Làm xong việc thì về bẩm, bổng lộc không thiếu.']},
   {id:'su-thay',role:'su-thay',name:'Sư thầy',act:'turn',x:28,y:12,lines:['A di đà Phật. Giữ tâm sáng thì âm binh không dám lại gần.','Thí chủ đi xa về, nghỉ bên giếng cổ cho lại sức.']},
   {id:'vu-cong',role:'vu-cong',name:'Vũ công',act:'dance',x:23,y:17,lines:['Hội thành đêm nay có múa đèn, ở lại xem nhé!']},
   {id:'trong-hoi',role:'trong-hoi',name:'Người đánh trống',act:'drum',x:26,y:17,lines:['Tùng! Tùng! Trống thành đánh ba hồi là lính đổi ca.']},
   {id:'tho-ren-thanh',role:'tho-ren-thanh',name:'Thợ rèn thành',act:'stand',x:18,y:17,panel:'shop',shop:'thanh-co-loa-ren',lines:['Rèn của thành dùng sắt núi, bền hơn rèn làng.','Đồ nhặt ở vùng cao mang về đây gia cường cũng được.']},
   {id:'tuong-quan',role:'tuong-quan',name:'Tướng quân',act:'stand',x:30,y:17,panel:'mercs',lines:['Muốn thuê quân? Lính của ta đã qua trận mạc.']},
   {id:'thay-do-co-loa',role:'thay-do',name:'Thầy đồ',act:'stand',x:14,y:21,panel:'quiz',lines:['Ta là thầy đồ, dạy chữ dạy người. Muốn thử sức với sách "Thư pháp Việt" thì ngồi xuống.','Trả lời đúng ta thưởng hồng ngọc. Không biết thì đi săn quái lấy manh mối, ta sẽ chỉ cho.']},
   {id:'hieu-buon-co-loa',role:'hieu-buon',name:'Chủ hiệu Âu Lạc',act:'turn',x:24,y:21,panel:'shop',shop:'thanh-co-loa',lines:['Hiệu Âu Lạc có binh khí đúc theo lối Cổ Loa, nỏ Liên Châu bắn một phát ba mũi.','Hàng thành trì đắt hơn hàng làng, nhưng mỗi món đều có chỉ số riêng.']},
   {id:'phap-su-co-loa',role:'phap-su',name:'Pháp sư',act:'turn',x:33,y:12,panel:'shop',shop:'thanh-co-loa-sach',lines:['Sách ngũ hành bậc Cổ Loa: cùng một quyển nhưng chỉ số mạnh hơn sách làng nhiều lần.','Chỉ gắn được 5 quyển, chọn hệ cho kỹ.']},
   {id:'nap-the-co-loa',role:'nap-the',name:'Người giữ kho',act:'turn',x:33,y:21,panel:'nap',lines:['Muốn thêm hồng ngọc? Chọn gói, quét mã, ta ghi sổ rồi kho mở ngay.']},
   {id:'giu-ruong-co-loa',role:'giu-ruong',name:'Người giữ rương',act:'turn',x:28,y:21,panel:'chest',lines:['Rương Cổ Loa thông với rương mọi thành: gửi ở đây, nhân vật khác lấy ở đâu cũng được.']},
   {id:'tre-con-co-loa-1',role:'tre-con',name:'Cu Tí',act:'patrol',x0:19,x1:27,y:14,spd:70,lines:['Anh ơi chơi đuổi bắt với bọn em không?']},
   {id:'tre-con-co-loa-2',role:'tre-con-2',name:'Cu Tèo',act:'patrol',x0:21,x1:29,y:15,spd:75,lines:['Em chạy nhanh nhất thành đấy!']}],
  goods:{mul:20,mount:[['ngua-co-loa','Ngựa chiến Cổ Loa','horse',1.6,6,'#6a4a30'],['ky-lan-lua','Kỳ Lân Lửa','kylan',1.7,12,'#ff8a3a','lifesteal',6,'Thú thần thoại: hút 6% sát thương gây ra thành máu']],fx:[['no-lien-chau','Nỏ Liên Châu','crossbow','two',22,0,'#8a6a3a','frost',18,'Đòn bắn có 18% làm quái chậm nửa tốc trong 2 giây'],['co-may-man','Cờ May Mắn','wings','',0,4,'#e0b040','luck',25,'Tỉ lệ rơi đồ tăng 25%']]}},
 {id:'bien-dong',name:'Bãi Biển Hoang',lv:90,from:'dam-lay',seed:69,theme:{g:['#e8d8a8','#d4c08a'],d:'grass',r:['#a89878','#6a5a48','#443a2e'],w:['#5fb0d0','#2f80b0'],p:'#c8b080',sd:'#f0e4c0',ripple:'#ffffff66'},sky:{n:24,col:'#ffffff',size:3,vx:30,vy:10},rock:.64,water:.55,dry:.5,sea:1,
  deco:[['dua',{base:'tree',shape:'palm',c:['#8a6a40','#4a9a4a']},.03],['da-bien',{base:'rock',c:['#a89878','#443a2e']},.02],['xuong-ca',{base:'bones',c:['#e8e2d4']},.01]],
  mobs:[['cua-khong-lo','Cua khổng lồ',{body:'bug',s:1,c:['#c85a3a','#8a3a22','#f0a080','#5a2a1a'],eye:'#1a1010'}],['muc-ma','Mực ma',{body:'blob',s:1,c:['#6a4a9a','#3a2a6a','#b090e0'],eye:'#ffe040',see:1,glow:'#9a70ff'}]],
  boss:['thuong-luong','Thuồng Luồng',{body:'dragon',s:1,c:['#2a6a8a','#1a4060','#80c8e0','#e8e8a0'],eye:'#80ffff',breath:'#a0e8ff'},'slow,poison'],ring:'#80c8e0'},
 {id:'nui-lua',name:'Núi Lửa',lv:105,hazard:'burn',from:'dinh-may',seed:81,theme:{g:['#4a3a36','#352826'],d:'ash',r:['#5a4a46','#3a2e2c','#201816'],w:['#ff8a30','#e04a10'],p:'#6a5048',sd:'#5a4038',s:'#ff7a20',sg:'#ffd060',ripple:'#ffd06066'},sky:{n:40,col:'#ff9a40',size:2,vx:10,vy:-40,glow:1,tint:'#30100818'},rock:.56,water:.86,dry:.45,lava:1,
  deco:[['da-den',{base:'rock',c:['#3a2e2c','#201816']},.03],['cay-chay',{base:'tree',shape:'dead',c:['#2a1a16']},.025],['pha-le-lua',{base:'crystal',c:['#ff8a30','#ffb060']},.008,{light:'#ff9a40'}]],
  mobs:[['nham-thach-thu','Nham thạch thú',{body:'quad',s:1,c:['#5a3a36','#2a1a16','#ff8a30','#ff6020'],spikes:1,eye:'#ffd040',ears:false}],['quy-lua','Quỷ lửa',{body:'human',s:.95,c:['#c84a20','#7a2a10','#ffb060','#ff6020'],hat:'horn',weapon:'club',skin:'#e06030',eye:'#ffff60',glow:'#ff802066'}]],
  boss:['hoa-long','Hỏa Long',{body:'dragon',s:1.1,c:['#c83a20','#7a2010','#ff9a50','#ffd040'],eye:'#ffff80',wing:1,breath:'#ff9a40'},'bomb,weak'],ring:'#ff9a40'},
 {id:'rung-ma',name:'Rừng Ma',lv:130,from:'co-loa',seed:93,theme:{g:['#3a3a4a','#2a2a38'],d:'bone',r:['#4a4a5a','#30303e','#1c1c26'],w:['#4a5a7a','#2a3a5a'],p:'#4a4050',sd:'#44405a',ripple:'#8a9ac055'},sky:{n:30,col:'#a0ff90',size:2.5,vx:14,vy:-8,glow:1,dark:'rgba(10,8,20,.72)',tint:'#20183018'},rock:.6,water:.82,dry:.4,
  deco:[['cay-ma',{base:'tree',shape:'dead',c:['#2a2430']},.07],['den-ma',{base:'lantern',c:['#3a3040','#80ff90']},.012,{light:'#80ff90'}],['bia-mo',{base:'shrine',c:['#5a5a6a','#30303e']},.008]],
  mobs:[['ma-troi','Ma trơi',{body:'blob',s:.8,c:['#80ff90','#40a050','#d0ffd0'],eye:'#1a1010',see:1,glow:'#80ff90'}],['quy-cay','Quỷ cây',{body:'golem',s:.7,c:['#3a3028','#201a16','#6a5a40'],eye:'#ff4040'}]],
  boss:['chua-quy','Chúa Quỷ',{body:'human',s:1.9,c:['#4a1a3a','#2a0a20','#9a4a8a','#ff40a0'],hat:'horn',weapon:'sword',armor:1,skin:'#7a3a6a',eye:'#ff2060',glow:'#ff40a044'},'weak,armor,poison'],ring:'#ff40a0'},
 {id:'bang-nguyen',name:'Băng Nguyên',lv:150,hazard:'freeze',from:'bien-dong',seed:105,theme:{g:['#e4eef6','#c6d8e6'],d:'ice',r:['#9ab0c4','#6a8096','#48596a'],w:['#b6dbeb','#86bcd7'],p:'#c0ccd4',sd:'#dde8f0',ripple:'#ffffff66'},sky:{n:50,col:'#ffffff',size:2,vx:20,vy:40,tint:'#d8e8ff14'},rock:.6,water:.72,dry:.4,
  deco:[['bang-tru',{base:'crystal',c:['#bfe3f4','#ffffff']},.02],['thong-tuyet',{base:'tree',shape:'cone',c:['#4a3a32','#dfe8ee','#f6fbff']},.03],['xuong-voi',{base:'bones',c:['#f0ece0']},.008]],
  mobs:[['voi-ma-mut','Voi ma mút',{body:'quad',s:1.5,c:['#7a5a40','#4a3020','#b09070','#f0ece0'],horn:1,eye:'#1a1010'}],['yeu-tuyet','Yêu tuyết',{body:'human',s:1.1,c:['#e8f0f8','#b0c0d0','#ffffff','#80c0ff'],hat:'horn',weapon:'club',skin:'#c8d8e8',eye:'#60a0ff'}]],
  boss:['bang-hoang','Băng Hoàng',{body:'human',s:1.9,c:['#6aa0d0','#3a6090','#c0e0ff','#ffffff'],hat:'crown',weapon:'staff',armor:1,skin:'#d0e8ff',eye:'#80ffff',glow:'#a0e0ff55'},'freeze,slow,giap-bang'],ring:'#a0e0ff'},
 {id:'thang-long',name:'Kinh Thành Thăng Long',lv:170,from:'rung-ma',seed:117,citadel:1,theme:{g:['#9a9a7a','#80805e'],d:'brick',r:['#8a7a6a','#5a4e44','#3a322c'],w:['#6fa8c0','#3f80a0'],p:'#b0a080',sd:'#a8a080'},sky:{n:18,col:'#ffd080',size:3,vx:8,vy:-6,glow:1,tint:'#30201010'},rock:.66,water:.84,dry:.3,
  deco:[['den-long',{base:'lantern',c:['#5a2a1a','#ff7040']},.012,{light:'#ffb060'}],['hoe',{base:'tree',shape:'round',c:['#5a4232','#5a8a3a','#9ac860']},.03],['tuong-da',{base:'pillar',c:['#b0a890','#6a6456']},.005]],
  mobs:[['phan-quan','Phản quân',{body:'human',s:1,c:['#5a3a3a','#3a2020','#9a7a7a','#c0a060'],weapon:'sword',hat:'helm',armor:1,skin:'#e1c295',eye:'#1a1010'}],['hac-ky','Hắc kỵ',{body:'quad',s:1.3,c:['#2a2a30','#141418','#5a5a66','#c0a060'],tail:1,eye:'#ff4040'}]],
  boss:['hac-long-tuong','Hắc Long Tướng',{body:'human',s:2,c:['#2a2a3a','#141420','#6a6a8a','#e0b040'],weapon:'spear',hat:'helm',armor:1,skin:'#c8b090',eye:'#ff4040',glow:'#e0b04044'},'armor,stun,weak'],ring:'#e0b040',
  npcs:[{id:'cam-ve-1',role:'cam-ve',name:'Cấm vệ',act:'patrol',x0:14,x1:33,y:9,lines:['Kinh thành nghiêm cẩn, khách xa cứ tự nhiên nhưng chớ gây sự.','Phản quân vây ngoài thành, cấm vệ chúng ta thay nhau canh ngày đêm.']},
   {id:'cam-ve-2',role:'cam-ve',name:'Cấm vệ',act:'patrol',x0:14,x1:33,y:22,lines:['Đèn lồng treo khắp phố là lệnh của Hoàng thượng: đêm sáng như ngày.']},
   {id:'quan-van',role:'quan-van',name:'Quan văn',act:'turn',x:18,y:12,panel:'quests',lines:['Triều đình cần người dẹp loạn. Việc ghi trong sổ này, ngươi xem rồi nhận.','Dẹp xong Hắc Long Tướng, ta tâu lên ban thưởng.']},
   {id:'ca-nu',role:'ca-nu',name:'Ca nữ',act:'dance',x:24,y:17,lines:['Khúc ca Thăng Long này, người đi xa nghe mà nhớ nhà…']},
   {id:'nghe-nhan',role:'nghe-nhan',name:'Nghệ nhân đèn',act:'turn',x:30,y:12,lines:['Đèn lồng ta làm bằng lụa Hà Đông, thắp cả đêm không tắt.']},
   {id:'tho-ren-hoang-cung',role:'tho-ren-hoang-cung',name:'Thợ rèn hoàng cung',act:'stand',x:16,y:17,panel:'shop',shop:'thanh-thang-long-ren',lines:['Lò rèn hoàng cung rèn binh khí cho cấm quân. Ngươi có đồ quý thì đưa ta gia cường.']},
   {id:'phap-su',role:'phap-su',name:'Pháp sư',act:'turn',x:32,y:17,panel:'shop',shop:'thanh-thang-long-sach',lines:['Sách ngũ hành của ta luyện tới tầng cao mới thấy uy lực.']},
   {id:'thuong-gia',role:'thuong-gia',name:'Thương gia kinh thành',act:'stand',x:20,y:21,panel:'market',lines:['Chợ kinh thành thông với chợ làng, ngươi ký gửi ở đâu cũng bán được.']},
   {id:'nguoi-nuoi-ngua',role:'nguoi-nuoi-ngua',name:'Quan mục',act:'stand',x:28,y:21,panel:'shop',shop:'thanh-thang-long-thu',lines:['Ngựa của hoàng cung toàn tuấn mã, muốn mua thì xem.']},
   {id:'thay-do-thang-long',role:'thay-do',name:'Thầy đồ',act:'stand',x:14,y:21,panel:'quiz',lines:['Ta là thầy đồ, dạy chữ dạy người. Muốn thử sức với sách "Thư pháp Việt" thì ngồi xuống.','Trả lời đúng ta thưởng hồng ngọc. Không biết thì đi săn quái lấy manh mối, ta sẽ chỉ cho.']},
   {id:'hieu-buon-thang-long',role:'hieu-buon',name:'Chủ hiệu Long Thành',act:'turn',x:24,y:21,panel:'shop',shop:'thanh-thang-long',lines:['Hiệu Long Thành: binh khí hoàng cung, hổ trắng Tây Bắc, cờ Phú Quý. Giá cao nhưng đáng đồng tiền.']},
   {id:'tho-truyen-than',role:'tho-truyen-than',name:'Thợ truyền thần',act:'turn',x:14,y:17,panel:'avatar',lines:['Ta vẽ truyền thần cho vua quan trong triều. Muốn đổi diện mạo, ta tô lại cho: da, tóc, râu, mắt… mua một lần, đổi mãi.']},
   {id:'luyen-khi-su',role:'luyen-khi-su',name:'Luyện khí sư',act:'turn',x:33,y:12,panel:'fuse',lines:['Thú cưỡi luyện tới +9, thêm một báu vật huyền thoại hay thần, thêm hồng ngọc… ta dung hợp thành đôi cánh. Mười lần được bốn, chịu không?']},
   {id:'nap-the-thang-long',role:'nap-the',name:'Quan ngân khố',act:'turn',x:33,y:21,panel:'nap',lines:['Ngân khố kinh thành đổi hồng ngọc cho khách. Chọn gói, quét mã là xong.']},
   {id:'giu-ruong-thang-long',role:'giu-ruong',name:'Người giữ rương',act:'turn',x:24,y:12,panel:'chest',lines:['Rương kinh thành khóa đồng, gửi đồ, tiền, hồng ngọc cho nhân vật khác cùng tài khoản.']}],
  goods:{mul:150,mount:[['ho-trang','Hổ trắng Tây Bắc','tiger',1.6,12,'#f0f0f4'],['ngua-ngu-lam','Ngựa Ngự Lâm','horse',1.7,8,'#2a2a30'],['bach-ho','Bạch Hổ Tây Phương','tiger',1.75,14,'#e8f0ff','dmgPct',12,'Thú thần thoại: sát thương +12%'],['phuong-hoang','Phượng Hoàng Lửa','phuong',1.8,16,'#ff5a30','lifesteal',10,'Thú thần thoại: hút 10% sát thương gây ra thành máu']],fx:[['kiem-long-tuyen','Kiếm Long Tuyền','sword','one',30,0,'#9ad0c0','venom',30,'Đòn đánh gây độc thêm 30% sát thương trong 4 giây'],['dao-loi-dinh','Đao Lôi Đình','saber','one',32,0,'#b0c8ff','stun',12,'Đòn chém có thêm 12% làm quái choáng 1 giây'],['co-phu-quy','Cờ Phú Quý','wings','',0,6,'#e0b040','coinUp',30,'Đồng nhận được khi hạ quái tăng 30%'],['ao-choang-tinh-thong','Áo choàng Tinh Thông','wings','',0,6,'#4a6a9a','expUp',25,'Kinh nghiệm nhận được tăng 25%']]}},
 {id:'cuu-trung',name:'Cửu Trùng Đài',lv:190,from:'bang-nguyen',also:'thang-long',seed:129,theme:{g:['#f0e4c0','#dccb9a'],d:'cloud',r:['#d8c89a','#a08a5a','#6a5a3a'],w:['#ffe8a0','#f0c860'],p:'#e8d8a8',sd:'#f6ecd0',ripple:'#ffffff88'},sky:{n:30,col:'#fff0a0',size:3,vx:12,vy:-10,glow:1,tint:'#ffe8a014'},rock:.62,water:.86,dry:.3,
  deco:[['cot-vang',{base:'pillar',c:['#e8d8a8','#c8a040']},.012],['may-ngoc',{base:'crystal',c:['#fff0b0','#ffffff']},.012,{light:'#fff0b0'}],['dao',{base:'tree',shape:'round',c:['#8a6a40','#f0a0c0','#ffd0e0']},.025]],
  mobs:[['thien-binh','Thiên binh',{body:'human',s:1.1,c:['#e8d8a0','#b09050','#fff8e0','#ffd040'],weapon:'spear',hat:'helm',armor:1,skin:'#f0dcc0',eye:'#1a1010',glow:'#ffe08033'}],['ky-lan','Kỳ lân',{body:'quad',s:1.2,c:['#e8c060','#a08030','#fff0b0','#ff8040'],horn:1,tail:1,eye:'#ff4040'}]],
  boss:['ma-vuong','Ma Vương',{body:'dragon',s:1.3,c:['#3a1a4a','#1a0a2a','#8a4aa0','#ff40a0'],eye:'#ff2060',wing:1,breath:'#c040ff'},'freeze,weak,bomb,tubao'],ring:'#ff40a0'},
 // ---- v10.3: cấp 105–150 (máu ×1,5, sát thương ×1,25 mỗi bản đồ kể từ bản đồ 11; quái thường từ cấp 125 có một chiêu)
 {id:'thuy-cung',name:'Thủy Cung',lv:205,from:'cuu-trung',seed:141,theme:{g:['#2a6a8a','#1f5272'],d:'cloud',r:['#4a8a9a','#2a5a6a','#183a48'],w:['#3a9ad0','#1a6aa0'],p:'#4a8aa0',sd:'#3a7a98',ripple:'#bfe8ff66'},sky:{n:36,col:'#bfe8ff',size:3,vx:4,vy:-30,glow:1,tint:'#0a3a6a2a'},rock:.62,water:.72,dry:.4,
  deco:[['san-ho',{base:'tree',shape:'round',s:.7,c:['#c05070','#f08090','#ffb0c0']},.05],['vo-oc',{base:'rock',c:['#d0c0a0','#8a7a60']},.02],['ngoc-trai',{base:'crystal',c:['#e0f0ff','#ffffff']},.01,{light:'#bfe8ff'}]],
  mobs:[['tom-tuong','Tôm tướng',{body:'bug',s:1,c:['#d05030','#8a3020','#ffb090','#ffd040'],spikes:1,eye:'#1a1010'}],['ca-kiem','Cá kiếm',{body:'snake',s:.9,c:['#4a7aa0','#2a4a70','#a0d0f0'],eye:'#ffe040'}]],
  boss:['long-vuong','Long Vương Thủy Phủ',{body:'dragon',s:1.2,c:['#2a7aa0','#1a4a70','#90d8ff','#ffe060'],eye:'#ffffff',wing:0,breath:'#90d8ff'},'freeze,slow,poison'],ring:'#90d8ff'},
 {id:'hoang-mac-xuong',name:'Hoang Mạc Xương',lv:215,hazard:'burn',from:'thuy-cung',seed:153,theme:{g:['#c8b088','#a89068'],d:'bone',r:['#a89878','#6a5a48','#443a2e'],w:['#8a9a7a','#5a6a5a'],p:'#d0b890',sd:'#e0d0a8'},sky:{n:40,col:'#e8d8b0',size:2,vx:50,vy:6,tint:'#5a3a1012'},rock:.6,water:.9,dry:.3,
  deco:[['xuong-rong',{base:'bones',c:['#f0e8d8']},.04],['cay-gai',{base:'tree',shape:'dead',c:['#6a5a3a']},.03],['tru-co',{base:'pillar',c:['#c0b090','#6a5a48'],broken:1},.008]],
  mobs:[['xuong-kho','Xương khô',{body:'human',s:1,c:['#e8e0d0','#a09080','#ffffff','#5a4a3a'],legs:true,weapon:'sword',skin:'#e8e0d0',eye:'#ff4040'}],['bo-cap-den','Bọ cạp đen',{body:'bug',s:1.1,c:['#2a2a2a','#101010','#5a5a5a','#c04040'],spikes:1,eye:'#ff6060'}]],
  boss:['hac-mo-vuong','Hắc Mộ Vương',{body:'golem',s:1,c:['#4a4040','#2a2020','#8a7a7a','#ff6040'],eye:'#ff4040',glow:'#ff604044'},'armor,weak,bomb'],ring:'#ff6040'},
 {id:'thien-son',name:'Thiên Sơn',lv:225,hazard:'freeze',from:'hoang-mac-xuong',seed:165,theme:{g:['#e8eef4','#cfdbe6'],d:'ice',r:['#b0bcc8','#7a8690','#58626a'],w:['#c8e0f0','#9ac0dc'],p:'#c0b8a8',sd:'#f0f4f8'},sky:{n:40,col:'#ffffff',size:2.5,vx:24,vy:30,tint:'#dfe8f018'},rock:.58,water:.9,dry:.3,
  deco:[['tung-tuyet',{base:'tree',shape:'cone',c:['#4a3a32','#3a6a5a','#dfe8ee']},.05],['bang-son',{base:'crystal',c:['#cfe8f8','#ffffff']},.015],['mieu-tien',{base:'shrine',c:['#d0d8e0','#6a4a8a']},.005]],
  mobs:[['tien-hac','Tiên hạc',{body:'bird',s:1.1,c:['#f8f8ff','#c0c8d8','#ffffff','#e04040'],eye:'#1a1010'}],['tuyet-vien','Tuyết viên',{body:'quad',s:1.1,c:['#f0f0f8','#b0b8c8','#ffffff','#6a7a8a'],tail:1,eye:'#60a0ff'}]],
  boss:['phong-vuong','Phong Vương',{body:'bird',s:2,c:['#6a8ab0','#3a5a80','#c0e0ff','#ffe060'],eye:'#ffffff',horn:1,slow:1},'stun,slow,weak'],ring:'#c0e0ff'},
 {id:'hoa-lu',name:'Cố Đô Hoa Lư',lv:235,from:'thien-son',seed:177,citadel:1,theme:{g:['#9a9a70','#7e8058'],d:'brick',r:['#8a8070','#5a5248','#3a342c'],w:['#6fa8c0','#3f80a0'],p:'#b0a080',sd:'#a8a080'},sky:{n:20,col:'#ffe0a0',size:3,vx:6,vy:-5,glow:1,tint:'#30201010'},rock:.66,water:.84,dry:.3,
  deco:[['da-voi',{base:'rock',s:1.3,c:['#9a9484','#44403a']},.02],['co-lau',{base:'tree',shape:'bamboo',s:.6,c:['#a0a060','#d8d0a0','#f0e8c0']},.04],['bia-da',{base:'pillar',c:['#b0a890','#6a6456']},.006]],
  mobs:[['tho-phi','Thổ phỉ',{body:'human',s:1,c:['#5a4a3a','#3a2a1a','#9a8a6a','#c08040'],weapon:'club',hat:'hood',skin:'#d0a070',eye:'#1a1010'}],['ngao-den','Ngao đen',{body:'quad',s:1.2,c:['#2a2a2a','#141414','#5a5a5a','#c04040'],tail:1,eye:'#ff4040'}]],
  boss:['su-quan','Sứ Quân Phản Loạn',{body:'human',s:2,c:['#6a2a2a','#3a1010','#b06060','#e0b040'],weapon:'spear',hat:'helm',armor:1,skin:'#d0a070',eye:'#ff6040',glow:'#e0b04044'},'armor,stun,weak,bomb'],ring:'#e0b040',
  npcs:[{id:'vo-si-hoa-lu-1',role:'vo-si',name:'Võ sĩ Hoa Lư',act:'patrol',x0:14,x1:33,y:9,lines:['Cố đô tuy cũ nhưng tường còn vững. Ngươi đến đúng lúc, sứ quân lại nổi loạn.']},
   {id:'vo-si-hoa-lu-2',role:'vo-si',name:'Võ sĩ Hoa Lư',act:'patrol',x0:14,x1:33,y:22,lines:['Cờ lau năm xưa phất ở chính nơi này.']},
   {id:'quan-thai-su',role:'thai-su',name:'Thái sư',act:'turn',x:18,y:12,panel:'quests',lines:['Việc nước rối ren, ta cần người dẹp loạn. Sổ việc đây.']},
   {id:'tho-ren-hoa-lu',role:'tho-ren-hoang-cung',name:'Thợ rèn Hoa Lư',act:'stand',x:16,y:17,panel:'shop',shop:'thanh-hoa-lu-ren',lines:['Rèn Hoa Lư luyện bằng than đá Tràng An, lưỡi bền gấp đôi.']},
   {id:'thay-do-hoa-lu',role:'thay-do',name:'Thầy đồ',act:'stand',x:14,y:21,panel:'quiz',lines:['Ta là thầy đồ, dạy chữ dạy người. Muốn thử sức với sách "Thư pháp Việt" thì ngồi xuống.','Trả lời đúng ta thưởng hồng ngọc. Không biết thì đi săn quái lấy manh mối, ta sẽ chỉ cho.']},
   {id:'hieu-buon-hoa-lu',role:'hieu-buon',name:'Chủ hiệu Trường Yên',act:'turn',x:24,y:21,panel:'shop',shop:'thanh-hoa-lu',lines:['Hiệu Trường Yên: kỳ lân Tràng An, giáp Cuồng Nộ… hàng hiếm, giá không rẻ.']},
   {id:'thuong-gia-hoa-lu',role:'thuong-gia',name:'Thương gia Hoa Lư',act:'stand',x:30,y:21,panel:'market',lines:['Chợ cố đô thông với chợ các vùng.']},
   {id:'tuong-hoa-lu',role:'tuong-quan',name:'Đại tướng',act:'stand',x:30,y:17,panel:'mercs',lines:['Quân Hoa Lư từng đánh dẹp 12 sứ quân. Thuê đi.']},
   {id:'ca-tru',role:'ca-nu',name:'Ca nương',act:'dance',x:23,y:17,lines:['Ca trù đất Tràng An, nghe một khúc cho đỡ mỏi đường.']},
   {id:'trong-hoa-lu',role:'trong-hoi',name:'Người đánh trống',act:'drum',x:27,y:17,lines:['Trống đồng Hoa Lư, đánh lên là quân reo.']},
   {id:'phap-su-hoa-lu',role:'phap-su',name:'Pháp sư',act:'turn',x:20,y:17,panel:'shop',shop:'thanh-hoa-lu-sach',lines:['Sách ngũ hành bậc Trường Yên, luyện lên mỗi cấp cộng chỉ số gấp bội sách làng.']},
   {id:'nap-the-hoa-lu',role:'nap-the',name:'Người giữ kho',act:'turn',x:33,y:12,panel:'nap',lines:['Kho cố đô đổi hồng ngọc cho khách. Chọn gói, quét mã là xong.']},
   {id:'giu-ruong-hoa-lu',role:'giu-ruong',name:'Người giữ rương',act:'turn',x:28,y:12,panel:'chest',lines:['Rương cố đô: một tài khoản một rương, nhân vật nào cũng mở được.']},
   {id:'tre-con-hoa-lu-1',role:'tre-con',name:'Bé Lau',act:'patrol',x0:18,x1:26,y:14,spd:70,lines:['Bọn em chơi cờ lau tập trận như vua Đinh ngày xưa!']},
   {id:'tre-con-hoa-lu-2',role:'tre-con-3',name:'Bé Sậy',act:'patrol',x0:20,x1:28,y:15,spd:65,lines:['Chị ơi, chị có kẹo không?']}],
  goods:{mul:800,mount:[['ky-lan-trang-an','Kỳ lân Tràng An','kylan',1.75,14,'#e8c060'],['voi-trang','Voi trắng','elephant',1.4,18,'#e8e8e4'],['huyen-vu','Huyền Vũ Bắc Phương','rua',1.5,20,'#1e2a3a','defPct',20,'Thú thần thoại: phòng ngự +20%'],['thien-ma','Thiên Mã có cánh','thienma',1.9,16,'#fff4e0','dmgPct',18,'Thú thần thoại: sát thương +18%']],fx:[['giap-cuong-no','Giáp Cuồng Nộ','armor','',0,30,'#8a2a2a','rage',40,'Dưới 30% máu: sát thương tăng 40%'],['chuy-thai-son','Chùy Thái Sơn','mace','one',40,0,'#6a6a7a','stun',20,'Đòn chùy có thêm 20% làm quái choáng 1 giây'],['cung-co-lau','Cung Cờ Lau','bow','two',34,0,'#c08040','frost',25,'Đòn bắn có 25% làm quái chậm nửa tốc trong 2 giây'],['co-tinh-thong','Cờ Tinh Thông','wings','',0,8,'#4a6a9a','expUp',40,'Kinh nghiệm nhận được tăng 40%']]}},
 {id:'dia-nguc-mon',name:'Địa Ngục Môn',lv:245,hazard:'burn',from:'hoa-lu',seed:189,theme:{g:['#3a2a2a','#2a1a1a'],d:'ash',r:['#5a3a3a','#3a2222','#201010'],w:['#ff6a20','#d03a10'],p:'#5a4040',sd:'#4a3030',s:'#ff5a10',sg:'#ffb040',ripple:'#ffb04066'},sky:{n:50,col:'#ff7a30',size:2.5,vx:8,vy:-50,glow:1,dark:'rgba(20,4,4,.6)',tint:'#30080818'},rock:.56,water:.86,dry:.4,lava:1,
  deco:[['cot-xuong',{base:'pillar',c:['#d8d0c0','#6a5a4a'],broken:1},.01],['lua-ma',{base:'torch',c:['#3a2a2a','#ff6a20']},.02,{light:'#ff7a30'}],['dau-lau',{base:'bones',c:['#e8e0d0']},.03]],
  mobs:[['nguu-dau','Ngưu Đầu',{body:'human',s:1.3,c:['#6a3a2a','#3a1a10','#b07050','#e0d0c0'],hat:'horn',weapon:'club',armor:1,skin:'#8a5a4a',eye:'#ff4040'}],['ma-dien','Mã Diện',{body:'quad',s:1.3,c:['#3a3a4a','#1a1a2a','#7a7a9a','#ff6040'],tail:1,eye:'#ff6040'}]],
  boss:['diem-la-tuong','Diêm La Tướng',{body:'human',s:2.1,c:['#2a1a2a','#140a14','#7a5a7a','#ff4040'],hat:'crown',weapon:'sword',armor:1,skin:'#6a4a5a',eye:'#ff2020',glow:'#ff202044'},'weak,armor,poison,bomb,tubao'],ring:'#ff4040'},
 {id:'dao-rong',name:'Đảo Rồng',lv:255,from:'dia-nguc-mon',seed:201,theme:{g:['#5a8a5a','#3f6a44'],d:'grass',r:['#7a8a70','#4a5a44','#2e3a2c'],w:['#3a9ac0','#1a6a98'],p:'#8a9a70',sd:'#c0b088',ripple:'#ffffff66'},sky:{n:30,col:'#ffffff',size:3,vx:36,vy:8},rock:.6,water:.56,dry:.4,sea:1,
  deco:[['dua-rong',{base:'tree',shape:'palm',s:1.2,c:['#6a5a3a','#3a8a4a']},.04],['da-rong',{base:'rock',s:1.4,c:['#7a8a70','#2e3a2c']},.02],['trung-rong',{base:'crystal',c:['#c0e0a0','#ffffff']},.008,{light:'#c0ffa0'}]],
  mobs:[['giao-long','Giao long',{body:'snake',s:1.3,c:['#2a7a6a','#1a4a40','#90d8c0','#ffe060'],horn:1,eye:'#ffe040'}],['hai-quy','Hải quỷ',{body:'blob',s:1.2,c:['#3a5a8a','#1a3a5a','#90b0e0'],eye:'#ff6060',see:1,glow:'#6090ff'}]],
  boss:['hai-long-vuong','Hải Long Vương',{body:'dragon',s:1.4,c:['#1a6a4a','#0a4a30','#80e0a0','#ffe060'],eye:'#ffffff',wing:1,breath:'#80ffc0'},'freeze,slow,poison,bomb'],ring:'#80e0a0'},
 {id:'vuc-yeu-tinh',name:'Vực Yêu Tinh',lv:270,hazard:'slow',from:'dao-rong',seed:213,theme:{g:['#4a3a5a','#36284a'],d:'moss',r:['#5a4a6a','#3a2e48','#241c30'],w:['#6a4a9a','#4a2a7a'],p:'#5a4a60',sd:'#54486a',ripple:'#d0a0ff55'},sky:{n:36,col:'#ff80d0',size:2.5,vx:10,vy:-10,glow:1,dark:'rgba(20,8,30,.6)',tint:'#30104018'},rock:.6,water:.82,dry:.4,
  deco:[['cay-yeu',{base:'tree',shape:'round',c:['#3a2a40','#8a3a9a','#d060c0']},.05],['den-yeu',{base:'lantern',c:['#3a2040','#ff80d0']},.012,{light:'#ff80d0'}],['hoa-doc',{base:'crystal',c:['#c040a0','#ff80d0']},.01]],
  mobs:[['ho-ly','Hồ ly',{body:'quad',s:1,c:['#e0a060','#a06030','#fff0d0','#c04040'],tail:1,eye:'#ff4080'}],['yeu-tang','Yêu tăng',{body:'human',s:1.1,c:['#8a3a5a','#5a1a3a','#d080a0','#e0b040'],hat:'hood',weapon:'staff',skin:'#c0a0b0',eye:'#ff40a0',glow:'#ff40a044'}]],
  boss:['cuu-vi-ho','Cửu Vĩ Hồ',{body:'quad',s:2.2,c:['#f0e0d0','#c0a080','#ffffff','#ff4080'],tail:1,horn:1,eye:'#ff2080',glow:'#ff40a055'},'weak,freeze,poison,stun,tron'],ring:'#ff40a0'},
 {id:'cung-trang',name:'Cung Trăng',lv:280,from:'vuc-yeu-tinh',seed:225,theme:{g:['#d8dce8','#bcc4d8'],d:'cloud',r:['#a8b0c8','#788098','#565c70'],w:['#c8d8f8','#a0b8e8'],p:'#c0c4d4',sd:'#e8ecf4'},sky:{n:60,col:'#ffffff',size:1.6,vx:4,vy:-6,glow:1,dark:'rgba(10,14,40,.45)',tint:'#1a2a6a1a'},rock:.6,water:.88,dry:.3,
  deco:[['cot-ngoc',{base:'pillar',c:['#e8ecf8','#a0a8c0']},.012],['cay-que',{base:'tree',shape:'round',c:['#8a7a6a','#c0d0f0','#ffffff']},.03],['ngoc-trang',{base:'crystal',c:['#e8f0ff','#ffffff']},.012,{light:'#e8f0ff'}]],
  mobs:[['tho-ngoc','Thỏ ngọc chiến binh',{body:'quad',s:.9,c:['#f8f8ff','#c0c8d8','#ffffff','#ff8080'],eye:'#ff4040'}],['nguyet-binh','Nguyệt binh',{body:'human',s:1.1,c:['#c0c8e8','#8088b0','#f0f4ff','#e0b040'],weapon:'spear',hat:'helm',armor:1,skin:'#e8e8f8',eye:'#4060ff',glow:'#c0d0ff33'}]],
  boss:['nguyet-than','Nguyệt Thần',{body:'human',s:2,c:['#e8ecff','#a0a8d0','#ffffff','#ffe060'],hat:'crown',weapon:'staff',skin:'#f8f8ff',eye:'#6080ff',glow:'#c0d0ff66'},'freeze,stun,weak,slow'],ring:'#c0d0ff'},
 {id:'phu-xuan',name:'Kinh Thành Phú Xuân',lv:290,from:'cung-trang',seed:237,citadel:1,theme:{g:['#9a8a6a','#7e7050'],d:'brick',r:['#8a7a6a','#5a4e44','#3a322c'],w:['#6fa8c0','#3f80a0'],p:'#c0a880',sd:'#b0a080'},sky:{n:24,col:'#ffd080',size:3,vx:8,vy:-6,glow:1,tint:'#30201010'},rock:.66,water:.84,dry:.3,
  deco:[['den-cung',{base:'lantern',c:['#5a2a1a','#ffd040']},.014,{light:'#ffd060'}],['phuong-vi',{base:'tree',shape:'round',c:['#5a4232','#c03030','#ff6040']},.03],['tuong-rong',{base:'pillar',c:['#c0b090','#6a6456']},.006]],
  mobs:[['ngu-lam-phan','Ngự lâm phản loạn',{body:'human',s:1.1,c:['#3a3a5a','#1a1a3a','#8a8ab0','#e0b040'],weapon:'sword',hat:'helm',armor:1,skin:'#e1c295',eye:'#1a1010'}],['chien-tuong','Chiến tượng',{body:'quad',s:1.6,c:['#6a6a70','#3a3a40','#a0a0a8','#c03030'],horn:1,eye:'#ff4040'}]],
  boss:['hac-de','Hắc Đế',{body:'human',s:2.2,c:['#1a1a2a','#0a0a14','#5a5a7a','#ffd040'],hat:'crown',weapon:'sword',armor:1,skin:'#b0a090',eye:'#ff2020',glow:'#ffd04044'},'armor,stun,weak,bomb,tubao'],ring:'#ffd040',
  npcs:[{id:'ngu-lam-1',role:'ngu-lam',name:'Ngự lâm quân',act:'patrol',x0:14,x1:33,y:9,lines:['Kinh thành Phú Xuân, cấm địa của Hoàng thượng. Khách phương xa cứ vào, chớ rút gươm trong thành.']},
   {id:'ngu-lam-2',role:'ngu-lam',name:'Ngự lâm quân',act:'patrol',x0:14,x1:33,y:22,lines:['Bên kia sông Hương là phản quân của Hắc Đế, đêm nào cũng kéo tới.']},
   {id:'quan-thuong-thu',role:'thai-su',name:'Thượng thư',act:'turn',x:18,y:12,panel:'quests',lines:['Triều đình treo thưởng lớn cho ai dẹp được Hắc Đế. Sổ việc đây.']},
   {id:'tho-ren-phu-xuan',role:'tho-ren-hoang-cung',name:'Thợ rèn Ngự xưởng',act:'stand',x:16,y:17,panel:'shop',shop:'thanh-phu-xuan-ren',lines:['Ngự xưởng rèn cho vua. Đồ của ngươi đưa đây ta gia cường.']},
   {id:'thay-do-phu-xuan',role:'thay-do',name:'Thầy đồ',act:'stand',x:14,y:21,panel:'quiz',lines:['Ta là thầy đồ, dạy chữ dạy người. Muốn thử sức với sách "Thư pháp Việt" thì ngồi xuống.','Trả lời đúng ta thưởng hồng ngọc. Không biết thì đi săn quái lấy manh mối, ta sẽ chỉ cho.']},
   {id:'hieu-buon-phu-xuan',role:'hieu-buon',name:'Chủ hiệu Thuận Hóa',act:'turn',x:24,y:21,panel:'shop',shop:'thanh-phu-xuan',lines:['Hiệu Thuận Hóa: rồng cưỡi, kiếm Thiên Mệnh… vật quý nhất Đại Việt, giá cũng nhất Đại Việt.']},
   {id:'tho-truyen-than-phu-xuan',role:'tho-truyen-than',name:'Họa sư cung đình',act:'turn',x:14,y:17,panel:'avatar',lines:['Họa sư cung đình tô lại diện mạo cho ngươi: da, tóc, râu, mắt. Mua một lần, đổi mãi.']},
   {id:'phap-su-phu-xuan',role:'phap-su',name:'Pháp sư',act:'turn',x:32,y:17,panel:'shop',shop:'thanh-phu-xuan-sach',lines:['Sách ngũ hành luyện ở đây lên tầng cao nhất.']},
   {id:'thuong-gia-phu-xuan',role:'thuong-gia',name:'Thương gia Phú Xuân',act:'stand',x:30,y:21,panel:'market',lines:['Chợ Đông Ba thông với chợ mọi vùng.']},
   {id:'nguoi-nuoi-ngua-phu-xuan',role:'nguoi-nuoi-ngua',name:'Quan mục',act:'stand',x:28,y:12,panel:'shop',shop:'thanh-phu-xuan-thu',lines:['Ngựa chiến của Ngự lâm, muốn mua thì xem.']},
   {id:'tuong-phu-xuan',role:'tuong-quan',name:'Thống chế',act:'stand',x:30,y:17,panel:'mercs',lines:['Quân Phú Xuân tinh nhuệ nhất nước. Thuê thì nói.']},
   {id:'cung-nu',role:'ca-nu',name:'Cung nữ',act:'dance',x:23,y:17,lines:['Nhã nhạc cung đình, nghe một lần nhớ mãi…']},
   {id:'trong-phu-xuan',role:'trong-hoi',name:'Người đánh trống',act:'drum',x:27,y:17,lines:['Trống Ngọ Môn điểm canh.']},
   {id:'luyen-khi-su-phu-xuan',role:'luyen-khi-su',name:'Luyện khí sư',act:'turn',x:33,y:12,panel:'fuse',lines:['Ta dung hợp thú cưỡi +9 với báu vật huyền thoại hay thần thành cánh. Mười lần được bốn.']},
   {id:'nap-the-phu-xuan',role:'nap-the',name:'Quan ngân khố',act:'turn',x:33,y:21,panel:'nap',lines:['Ngân khố Phú Xuân đổi hồng ngọc cho khách. Chọn gói, quét mã là xong.']},
   {id:'giu-ruong-phu-xuan',role:'giu-ruong',name:'Quan giữ rương',act:'turn',x:24,y:12,panel:'chest',lines:['Rương Phú Xuân giữ đồ cho cả tài khoản. Gửi ở đây, lấy ở làng hay thành nào cũng được.']},
   {id:'tre-con-phu-xuan-1',role:'tre-con-2',name:'Cu Bin',act:'patrol',x0:19,x1:27,y:14,spd:72,lines:['Em muốn làm Ngự lâm quân!']},
   {id:'tre-con-phu-xuan-2',role:'tre-con-3',name:'Bé Na',act:'patrol',x0:21,x1:29,y:15,spd:66,lines:['Anh đến từ đâu thế? Xa lắm không?']}],
  goods:{mul:3000,mount:[['rong-thuan-hoa','Rồng Thuận Hóa','rong',1.9,24,'#2a6a5a'],['ky-lan-hoang-gia','Kỳ lân hoàng gia','kylan',1.85,16,'#f0d080'],['thanh-long','Thanh Long Đông Phương','rong',2,26,'#2aa070','clone',15,'Thú thần thoại: hạ quái có 15% gọi phân thân (bản sao của bạn) đánh cùng 10 giây'],['cuu-vi-ho','Cửu Vĩ Hồ Ly','cuuvi',1.9,18,'#ffd0b0','lifesteal',15,'Thú thần thoại: hút 15% sát thương gây ra thành máu'],['kim-long','Kim Long Thiên Tử','rong',2.1,30,'#ffd040','dmgPct',25,'Thú thần thoại: sát thương +25%']],fx:[['kiem-thien-menh','Kiếm Thiên Mệnh','sword','one',44,0,'#ffe080','rage',60,'Dưới 30% máu: sát thương tăng 60%'],['co-thien-menh','Cờ Thiên Mệnh','wings','',0,10,'#ffd040','luck',50,'Tỉ lệ rơi đồ tăng 50%'],['khien-ngu-lam','Khiên Ngự Lâm','shield','one',0,38,'#3a3a5a','frost',30,'Đòn khiên có 30% làm quái chậm nửa tốc trong 2 giây'],['ao-choang-phu-quy','Áo choàng Phú Quý','wings','',0,10,'#e0b040','coinUp',50,'Đồng nhận được khi hạ quái tăng 50%']]}},
 {id:'thien-dinh',name:'Thiên Đình',lv:300,from:'phu-xuan',also:'cung-trang',seed:249,theme:{g:['#f4ecd0','#e4d8b0'],d:'cloud',r:['#e0d0a0','#b09a60','#7a6a40'],w:['#fff0b0','#f8d870'],p:'#f0e4c0',sd:'#faf4e0',ripple:'#ffffff88'},sky:{n:40,col:'#fff8c0',size:3,vx:10,vy:-12,glow:1,tint:'#fff0c014'},rock:.62,water:.86,dry:.3,
  deco:[['cot-thien',{base:'pillar',s:1.3,c:['#f0e4c0','#d0a040']},.014],['may-ngu-sac',{base:'crystal',c:['#fff8d0','#ffffff']},.012,{light:'#fff8d0'}],['dao-tien',{base:'tree',shape:'round',c:['#8a6a40','#ffb0d0','#ffe0f0']},.03]],
  mobs:[['thien-tuong','Thiên tướng',{body:'human',s:1.3,c:['#f0e0a0','#c0a050','#fffaf0','#ffd040'],weapon:'spear',hat:'helm',armor:1,skin:'#f0dcc0',eye:'#1a1010',glow:'#ffe08044'}],['than-thu','Thần thú',{body:'dragon',s:.7,c:['#e8c060','#a08030','#fff0b0','#ff8040'],eye:'#ff4040',wing:1}]],
  boss:['hac-thien-ma','Hắc Thiên Ma',{body:'dragon',s:1.6,c:['#1a0a2a','#0a0414','#6a3a8a','#ff2060'],eye:'#ff2060',wing:1,breath:'#c040ff'},'freeze,weak,armor,bomb,tubao'],ring:'#ff2060'},
 // ---- v10.34: 10 bản đồ cấp 400–999 sau Thiên Đình (mở khi cấp 400 và đã hạ Hắc Thiên Ma). kind: battle = chiến trường đoạt cờ, arena = võ đài 10 danh tướng, final = cứu con gái
 {id:'hu-khong',name:'Hư Không Giới',lv:400,from:'thien-dinh',seed:261,gate:'kill:hac-thien-ma',theme:{g:['#2a2440','#1f1a33'],d:'cloud',r:['#4a4068','#30284a','#1a1430'],w:['#6a5aa8','#3a2a78'],p:'#3a3456',sd:'#2e2848',ripple:'#c0b0ff55'},sky:{n:60,col:'#e0d8ff',size:2,vx:3,vy:-3,glow:1,dark:'rgba(8,4,24,.55)',tint:'#2010401a'},rock:.62,water:.8,dry:.3,
  deco:[['tinh-thach',{base:'crystal',c:['#a090ff','#ffffff']},.016,{light:'#b0a0ff'}],['cot-hu',{base:'pillar',s:1.2,c:['#5a5080','#2a2448'],broken:1},.008],['da-troi',{base:'rock',c:['#4a4068','#1a1430']},.02]],
  mobs:[['hu-anh','Hư ảnh',{body:'human',s:1.1,c:['#7a70b0','#3a3070','#c0b8ff','#e0d8ff'],see:1,weapon:'sword',hat:'hood',skin:'#b0a8e0',eye:'#ffffff',glow:'#a090ff44'}],['tinh-thu','Tinh thú',{body:'quad',s:1.2,c:['#3a3070','#1a1440','#a090ff','#ffffff'],horn:1,glow:'#a090ff',eye:'#ffffff'}]],
  boss:['hu-khong-vuong','Hư Không Vương',{body:'golem',s:1.5,c:['#3a3070','#1a1440','#c0b0ff'],eye:'#ffffff',glow:'#c0b0ff'},'freeze,weak,armor,bomb'],ring:'#c0b0ff'},
 {id:'huyet-hai',name:'Huyết Hải',lv:460,hazard:'burn',from:'hu-khong',seed:273,theme:{g:['#5a2a2a','#432020'],d:'ash',r:['#6a3a36','#4a2420','#2a1210'],w:['#b02020','#7a0a10'],p:'#6a4038',sd:'#5a3028',ripple:'#ff808066'},sky:{n:30,col:'#ff6060',size:2.5,vx:8,vy:-14,glow:1,tint:'#40000818'},rock:.62,water:.6,dry:.35,sea:1,
  deco:[['xuong-huyet',{base:'bones',c:['#e8d0c8']},.014],['san-ho-mau',{base:'crystal',c:['#ff4040','#ffb0b0']},.012,{light:'#ff6060'}],['da-mau',{base:'rock',c:['#6a3a36','#2a1210']},.02]],
  mobs:[['huyet-ngu','Huyết ngư',{body:'snake',s:1.2,c:['#c03030','#701010','#ff9090','#ffe060'],eye:'#ffff60'}],['xich-giao','Xích giao',{body:'dragon',s:.8,c:['#a02020','#600a0a','#ff8060','#ffd040'],eye:'#ffff80',breath:'#ff6040'}]],
  boss:['huyet-ma-long','Huyết Ma Long',{body:'dragon',s:1.6,c:['#801010','#400408','#ff4040','#ffd040'],eye:'#ffff60',wing:1,breath:'#ff2020'},'poison,weak,bomb,tubao'],ring:'#ff4040'},
 {id:'chien-truong',name:'Cổ Chiến Trường',lv:520,from:'huyet-hai',seed:285,kind:'battle',theme:{g:['#6a5a40','#544630'],d:'ash',r:['#7a6a54','#4a4034','#2a241c'],w:['#5a6a70','#3a4a50'],p:'#7a6448',sd:'#8a7450'},sky:{n:36,col:'#ffb070',size:2,vx:24,vy:-6,glow:1,tint:'#3018081a'},rock:.7,water:.88,dry:.5,
  deco:[['giao-gay',{base:'bones',c:['#a09080']},.02],['co-rach',{base:'flag',c:['#4a3a2a','#7a2020','#2a1a10']},.006,{solid:false}],['xe-vo',{base:'rock',c:['#6a5040','#3a2a1a']},.012]],
  mobs:[['tu-binh','Tử binh',{body:'human',s:1,c:['#5a5048','#3a3028','#9a8a78','#c0a060'],weapon:'spear',hat:'helm',armor:1,skin:'#a09080',eye:'#ff6040'}],['chien-ma-ma','Chiến mã ma',{body:'quad',s:1.3,c:['#3a3028','#1a1410','#7a6a58','#c0a060'],tail:1,eye:'#ff4040',glow:'#ff604044'}]],
  boss:['nguyen-soai-ma','Nguyên Soái Ma',{body:'human',s:2,c:['#3a2a2a','#1a1010','#8a5a4a','#e0b040'],weapon:'saber',hat:'helm',armor:1,skin:'#9a7a6a',eye:'#ff4040',glow:'#ff604044'},'armor,stun,weak,bomb'],ring:'#ff6040'},
 {id:'luu-sa',name:'Lưu Sa Hà',lv:580,hazard:'slow',from:'chien-truong',seed:297,gate:'hq:chien-truong',theme:{g:['#c8a868','#b09050'],d:'bone',r:['#a88a5a','#7a603a','#4a3a22'],w:['#a89060','#806a40'],p:'#d0b478',sd:'#e0c890',ripple:'#fff0c066'},sky:{n:50,col:'#f0d8a0',size:2,vx:50,vy:6,tint:'#c0a06012'},rock:.64,water:.66,dry:.6,
  deco:[['xuong-lac-da',{base:'bones',c:['#f0e8d8']},.014],['cay-sa',{base:'tree',shape:'dead',c:['#6a5030']},.02],['bia-sa',{base:'shrine',c:['#b0986a','#5a4020']},.006]],
  mobs:[['sa-yeu','Sa yêu',{body:'blob',s:1.2,c:['#d0b070','#907040','#fff0c0'],eye:'#3a2010'}],['bo-cap-vang','Bò cạp vàng',{body:'bug',s:1.2,c:['#e0b030','#8a6010','#fff080','#4a3010'],eye:'#1a1010'}]],
  boss:['sa-ha-quai','Sa Hà Quái',{body:'golem',s:1.6,c:['#a08050','#5a4020','#e0c080'],eye:'#ff4040',glow:'#ffd08044'},'slow,armor,stun,bomb'],ring:'#e0c080'},
 {id:'vo-dai',name:'Võ Đài Thập Tướng',lv:640,from:'luu-sa',seed:309,kind:'arena',theme:{g:['#8a7a5a','#706244'],d:'brick',r:['#9a8468','#6a5844','#3a3024'],w:['#5a8aa0','#3a6a80'],p:'#b09a70',sd:'#a89070'},sky:{n:20,col:'#ffd080',size:3,vx:6,vy:-8,glow:1,tint:'#40201010'},rock:.72,water:.9,dry:.3,
  deco:[['den-vo-dai',{base:'lantern',c:['#5a2a1a','#ff7040']},.01,{light:'#ffb060'}],['gia-binh-khi',{base:'pillar',c:['#8a6a4a','#4a3a2a']},.008],['co-thu',{base:'tree',shape:'round',c:['#5a4232','#4a7a3a','#7aa850']},.02]],
  mobs:[['vo-si-ma','Võ sĩ ma',{body:'human',s:1.1,c:['#6a3a2a','#3a1a10','#c08a6a','#e0b040'],weapon:'sword',hat:'khan',skin:'#c8a080',eye:'#ff4040'}],['su-tu-da','Sư tử đá',{body:'quad',s:1.4,c:['#9a9488','#5a564e','#d0ccc0','#e0b040'],eye:'#ff4040',spikes:1}]],
  boss:['thiet-giap-tuong','Thiết Giáp Tướng',{body:'human',s:2,c:['#4a4a52','#22222a','#9a9aa8','#e0b040'],weapon:'mace',hat:'helm',armor:1,skin:'#b09888',eye:'#ffd040'},'armor,stun,weak'],ring:'#e0b040',
  npcs:[{id:'trong-tai-vo-dai',role:'trong-tai',name:'Trọng tài võ đài',act:'turn',x:24,y:23,lines:['Võ đài Thập Tướng: mười danh tướng thiên hạ chờ người dám thượng đài.','Thắng đủ mười trận, cổng phía bắc tự mở. Thua thì về nghỉ, lần sau đánh tiếp trận dang dở.']}]},
 {id:'van-kiem',name:'Vạn Kiếm Sơn',lv:700,from:'vo-dai',seed:321,gate:'hq:vo-dai',theme:{g:['#7a8288','#62696e'],d:'ice',r:['#8a9298','#5a6066','#33383c'],w:['#7aa0b8','#4a7088'],p:'#9aa0a4',sd:'#b0b6ba',ripple:'#ffffff55'},sky:{n:30,col:'#e8f0ff',size:2,vx:30,vy:4,tint:'#c0d0e012'},rock:.6,water:.86,dry:.3,
  deco:[['kiem-cam',{base:'pillar',s:.7,c:['#c8d0d8','#6a7480']},.02],['thong-da',{base:'tree',shape:'cone',c:['#4a4038','#3a5a4a','#5a7a6a']},.03],['da-kiem',{base:'rock',c:['#8a9298','#33383c']},.02]],
  mobs:[['kiem-linh','Kiếm linh',{body:'human',s:1,c:['#a0b8d0','#506880','#e8f4ff','#ffffff'],see:1,weapon:'sword',hat:'none',skin:'#d0e0f0',eye:'#80e0ff',glow:'#a0d8ff44'}],['thach-ho','Thạch hổ',{body:'quad',s:1.4,c:['#8a8a88','#4a4a48','#c8c8c0','#ff8040'],tail:1,eye:'#ff8040'}]],
  boss:['kiem-ma','Kiếm Ma',{body:'human',s:2,c:['#2a3a4a','#101a24','#80a0c0','#c0e8ff'],weapon:'sword',hat:'hood',armor:1,skin:'#9ab0c0',eye:'#80e0ff',glow:'#80e0ff55'},'weak,stun,bomb,tubao'],ring:'#80e0ff'},
 {id:'bang-hoa',name:'Băng Hỏa Lưỡng Giới',lv:770,hazard:'freeze',from:'van-kiem',seed:333,lava:1,theme:{g:['#d0dce8','#b4c4d4'],d:'ice',r:['#8a9aac','#5a6a7c','#38444e'],w:['#ff6a20','#c03a10'],p:'#c0c8d0',sd:'#e0e8f0',s:'#ff7a20',sg:'#ffd060',ripple:'#ffd06066'},sky:{n:44,col:'#ffffff',size:2,vx:-10,vy:30,tint:'#d0e0ff12'},rock:.62,water:.8,dry:.3,
  deco:[['bang-hoa-tru',{base:'crystal',c:['#bfe3f4','#ff9a50']},.018,{light:'#ffb080'}],['thong-bang',{base:'tree',shape:'cone',c:['#4a3a32','#dfe8ee','#f6fbff']},.025],['da-nham',{base:'rock',c:['#5a4a46','#201816']},.015]],
  mobs:[['bang-phach','Băng phách',{body:'blob',s:1.2,c:['#c0e8ff','#6aa8d8','#ffffff'],eye:'#205080',see:1,glow:'#a0e0ff'}],['hoa-diem-thu','Hỏa diệm thú',{body:'quad',s:1.3,c:['#c84a20','#7a2a10','#ffb060','#ffd040'],spikes:1,eye:'#ffff60',glow:'#ff802066'}]],
  boss:['song-dau-long','Song Đầu Long',{body:'dragon',s:1.7,c:['#4a6a9a','#a03a20','#c0e0ff','#ffd040'],eye:'#ffffff',wing:1,breath:'#ffb060'},'freeze,bomb,weak,tubao'],ring:'#ffb060'},
 {id:'cuu-u',name:'Cửu U Minh Phủ',lv:840,from:'bang-hoa',seed:345,theme:{g:['#2a2a30','#1e1e24'],d:'bone',r:['#3a3a44','#24242c','#121216'],w:['#3a5a4a','#1a3a2a'],p:'#34303a',sd:'#3a3442',ripple:'#80ffb044'},sky:{n:34,col:'#80ffb0',size:2.5,vx:6,vy:-10,glow:1,dark:'rgba(4,8,6,.74)',tint:'#08201018'},rock:.62,water:.8,dry:.4,
  deco:[['den-u',{base:'lantern',c:['#2a3a30','#80ffb0']},.014,{light:'#80ffb0'}],['bia-u',{base:'shrine',c:['#4a4a54','#1a1a20']},.01],['cay-u',{base:'tree',shape:'dead',c:['#1e1a22']},.05]],
  mobs:[['u-hon','U hồn',{body:'blob',s:1,c:['#90ffc0','#40a070','#e0ffe8'],eye:'#1a1010',see:1,glow:'#80ffb0'}],['quy-sai','Quỷ sai',{body:'human',s:1.2,c:['#2a2a3a','#14141e','#7a7a8a','#80ffb0'],weapon:'club',hat:'horn',skin:'#6a7a70',eye:'#80ffb0'}]],
  boss:['minh-vuong','Minh Vương',{body:'human',s:2.1,c:['#1a1a2a','#0a0a14','#5a5a7a','#80ffb0'],weapon:'staff',hat:'crown',armor:1,skin:'#5a6a60',eye:'#80ffb0',glow:'#80ffb055'},'poison,freeze,weak,armor,tubao'],ring:'#80ffb0'},
 {id:'hon-don-hai',name:'Hỗn Độn Hải',lv:920,from:'cuu-u',seed:357,theme:{g:['#2a3a4a','#1f2c3a'],d:'moss',r:['#3a4a5a','#24303c','#121a22'],w:['#2a4a7a','#122a52'],p:'#344250',sd:'#3a4858',ripple:'#80b0ff55'},sky:{n:40,col:'#a0c0ff',size:3,vx:-20,vy:-4,glow:1,dark:'rgba(4,8,20,.5)',tint:'#10204018'},rock:.6,water:.55,dry:.35,sea:1,
  deco:[['xoay-hon-don',{base:'crystal',c:['#80a0ff','#ffffff']},.014,{light:'#80a0ff'}],['xuong-ca-voi',{base:'bones',c:['#d8e0e8']},.012],['da-hai',{base:'rock',c:['#3a4a5a','#121a22']},.02]],
  mobs:[['hai-yeu','Hải yêu',{body:'human',s:1.1,c:['#3a6a9a','#1a3a6a','#a0d0ff','#ffe060'],weapon:'spear',hat:'crown',skin:'#a0c8e0',eye:'#ffe060',glow:'#80b0ff44'}],['thon-hai-thu','Thôn hải thú',{body:'snake',s:1.6,c:['#1a3a5a','#0a1a30','#6aa0d0','#ffe060'],horn:1,eye:'#ffe060'}]],
  boss:['cuu-dau-xa','Cửu Đầu Xà',{body:'dragon',s:1.8,c:['#1a4a3a','#0a2a20','#60c0a0','#ff4060'],eye:'#ff4060',wing:1,breath:'#60ffc0'},'poison,freeze,bomb,weak,tubao'],ring:'#60ffc0'},
 {id:'hon-nguyen',name:'Hỗn Nguyên Điện',lv:999,from:'hon-don-hai',seed:369,kind:'final',theme:{g:['#3a2e40','#2c2232'],d:'brick',r:['#5a4a5a','#3a2e3a','#1e161e'],w:['#c09040','#8a6020'],p:'#5a4858',sd:'#6a5868',ripple:'#ffe08066'},sky:{n:40,col:'#ffd080',size:3,vx:4,vy:-16,glow:1,dark:'rgba(12,6,16,.45)',tint:'#30102018'},rock:.66,water:.88,dry:.3,
  deco:[['cot-hon-nguyen',{base:'pillar',s:1.4,c:['#6a5a6a','#e0b040']},.012],['den-hon-nguyen',{base:'lantern',c:['#3a1a2a','#ffd060']},.012,{light:'#ffd080'}],['da-den',{base:'rock',c:['#5a4a5a','#1e161e']},.015]],
  mobs:[['hon-nguyen-ve','Hỗn Nguyên vệ',{body:'human',s:1.4,c:['#3a2a3a','#1a101a','#9a7a9a','#e0b040'],weapon:'spear',hat:'helm',armor:1,skin:'#a08890',eye:'#ffd040',glow:'#ffd04044'}],['ma-than-thu','Ma thần thú',{body:'golem',s:1.3,c:['#4a2a3a','#200a18','#c06090'],eye:'#ffd040',glow:'#ff60a0'}]],
  boss:['hon-nguyen-ma-to','Hỗn Nguyên Ma Tổ',{body:'dragon',s:2,c:['#2a0a20','#100410','#a03070','#ffd040'],eye:'#ffd040',wing:1,breath:'#ff60c0'},'freeze,weak,armor,bomb,tubao,poison'],ring:'#ffd040'}
];
// ---- quái: số liệu tăng theo bậc bản đồ (máu ×2, sát thương ×1,5, kinh nghiệm ×2 mỗi bản đồ; tỉ lệ rơi huyền thoại từ cấp 44, thần từ cấp 60)
const R=(v)=>Math.round(v);
// hệ số theo bậc bản đồ: 10 bản đồ đầu ×2 máu / ×1,5 sát thương / ×1,8 đồng; từ bản đồ 11 (cấp 105) ×1,5 / ×1,25 / ×1,5 để người chơi cấp cao còn theo kịp
// v10.10: tác giả giảm máu quái vùng cấp 20+ còn 1/5, sát thương gấp đôi (HP_K, DMG_K)
const HP_K=1/5,DMG_K=2;
const K_HP=i=>HP_K*(i<10?Math.pow(2,i):Math.pow(2,10)*Math.pow(1.5,i-10)),K_DMG=i=>DMG_K*(i<10?Math.pow(1.5,i):Math.pow(1.5,10)*Math.pow(1.25,i-10)),K_COIN=i=>i<10?Math.pow(1.8,i):Math.pow(1.8,10)*Math.pow(1.5,i-10);
const MOB_SKILL=['slow','poison','weak','armor','frost'];
const OLD_LV=[20,28,36,44,52,60,70,80,90,100,105,110,115,120,125,130,135,140,145,150,150,150,150,150,150,150,150,150,150,150]; // v10.34: 10 vùng 400–999 dùng bảng rơi đồ cao nhất
function monRows(){
  const rows=[];
  MAPS.forEach((M,i)=>{
    const k=K_HP(i),kd=K_DMG(i),L=OLD_LV[i]; // ngưỡng rơi đồ theo cấp cũ (v10.12 giãn cấp vùng, không đổi bảng rơi)
    const [a,b]=M.mobs;
    const mob=(id,ten,hp,dmg,spd,run,r,h,aggro,range,cd,wind,copper,knock,exp,ruby,x2)=>({id,ten,mau:R(hp*k),sat_thuong:R(dmg*kd),toc_do:spd,toc_chay:run,ban_kinh:r,cao:h,tam_danh:aggro,tam_gan:range,hoi_chieu_ms:cd,vung_tay_ms:wind,dong:R(copper*(i<20?K_COIN(i):K_COIN(19)*(1+.15*(i-19)))),day_lui_phan_tram:knock,boss:0,hoi_sinh_giay:20,
      dep_phan_van:1500,hoan_hao_phan_van:L>=105?500:350,huyen_thoai_phan_van:L>=70?Math.min(120,30+Math.max(0,L-100)*2):0,than_phan_van:L>=120?Math.min(30,5+(L-120)):0,hong_ngoc_it:L>=105?1:0,hong_ngoc_nhieu:L>=105?2+Math.floor((L-100)/10):0,loai_sat_thuong:L>=120?'hoan_hao':'thuong',ti_le_x2:x2,kinh_nghiem:R(exp*k/HP_K),ban_do:M.id,ky_nang:L>=125?(['slow','poison','weak','armor','slow','poison'][i%6]):''});
    rows.push(mob(a[0],a[1],2000,90,70,190,24,50,260,56,1200,400,150,40,180,0,10));
    rows.push(mob(b[0],b[1],2800,110,55,160,28,60,240,64,1500,500,200,30,240,0,12));
    const [bid,bten,,sk]=M.boss;
    rows.push({id:bid,ten:bten,mau:R(18000*k),sat_thuong:R(150*kd),toc_do:50,toc_chay:130,ban_kinh:48,cao:110,tam_danh:300,tam_gan:120,hoi_chieu_ms:2000,vung_tay_ms:700,dong:R(4000*(i<20?K_COIN(i):K_COIN(19)*(1+.15*(i-19)))),day_lui_phan_tram:5,boss:L>=145?2:1,hoi_sinh_giay:300,
      dep_phan_van:7500,hoan_hao_phan_van:4000,huyen_thoai_phan_van:L>=44?Math.min(3500,R(200+(L-44)*25)):0,than_phan_van:L>=60?Math.min(1500,R(50+(L-60)*12)):0,hong_ngoc_it:8+i*2,hong_ngoc_nhieu:20+i*4,loai_sat_thuong:L>=120?'than':L>=70?'huyen_thoai':'hoan_hao',ti_le_x2:15+i,kinh_nghiem:R(2000*k/HP_K),ban_do:M.id,ky_nang:sk});
  });
  return rows;
}
function questRows(){
  const rows=[];
  // v10.34: vùng 400–999 không nhân luỹ thừa nữa: đồng theo hệ số vùng 20 tăng 15% mỗi vùng, kinh nghiệm theo số cần lên cấp (săn ≈ nửa cấp, trùm ≈ 3 cấp)
  const NEED=L=>Math.round(60*Math.pow(L,1.5));
  MAPS.forEach((M,i)=>{const [a]=M.mobs,[bid,bten]=M.boss,k=i<20?K_COIN(i):K_COIN(19)*(1+.15*(i-19)),ke=K_HP(i)/HP_K;
    if(i>=20){rows.push({id:'q-'+a[0],ten:'Săn '+a[1].toLowerCase(),mo_ta:a[1]+' quấy phá vùng '+M.name+', không ai dám qua lại.',muc_tieu:a[0],so_luong:6,thuong_dong:R(4000*k),thuong_hong_ngoc:0,thuong_do:'',pham_chat_do:'',lap_lai:'khong',thuong_kinh_nghiem:R(NEED(M.lv)*.5)});
      rows.push({id:'q-'+bid,ten:'Hạ '+bten,mo_ta:bten+' ngự trị '+M.name+'. Hạ được nó, đường tìm con thêm một bước.',muc_tieu:bid,so_luong:1,thuong_dong:R(40000*k),thuong_hong_ngoc:5+i*2,thuong_do:'',pham_chat_do:'',lap_lai:'khong',thuong_kinh_nghiem:R(NEED(M.lv)*3)});return;}
    rows.push({id:'q-'+a[0],ten:'Săn '+a[1].toLowerCase(),mo_ta:a[1]+' quấy phá vùng '+M.name+', dân không dám qua lại.',muc_tieu:a[0],so_luong:6,thuong_dong:R(4000*k),thuong_hong_ngoc:0,thuong_do:'',pham_chat_do:'',lap_lai:'khong',thuong_kinh_nghiem:R(400*ke)});
    rows.push({id:'q-'+bid,ten:'Hạ '+bten,mo_ta:bten+' ngự trị '+M.name+'. Hạ được nó, cả vùng yên ổn.',muc_tieu:bid,so_luong:1,thuong_dong:R(40000*k),thuong_hong_ngoc:5+i*2,thuong_do:'',pham_chat_do:'',lap_lai:'khong',thuong_kinh_nghiem:R(4000*ke)});});
  return rows;
}
// dáng NPC thành trì (vẽ bằng LH_ART.gen → npc)
const NPC_LOOK={
 'linh-gac':{robe:'#7a4a2a',trim:'#e0b040',hat:'tru',hatc:'#6b6e74',item:'spear'},
 'quan-van':{robe:'#2a4a7a',trim:'#e0b040',hat:'quan',item:'scroll',beard:'#3a3030'},
 'su-thay':{robe:'#b08a40',trim:'#7a4a1a',hat:'none',hair:null,item:'staff',beard:'#d8d0c0',skin:'#e8c8a0'},
 'vu-cong':{robe:'#c03060',trim:'#ffd080',hat:'hoa',item:'fan',fem:1,skirt:1,sash:'#ffd080'},
 'trong-hoi':{robe:'#8a2a1a',trim:'#e0b040',hat:'khan',hatc:'#c03030',item:'sticks'},
 'tho-ren-thanh':{robe:'#5a4a3a',trim:'#8a6a40',hat:'khan',hatc:'#3a2a1a',skin:'#c8945a'},
 'tuong-quan':{robe:'#3a3a4a',trim:'#e0b040',hat:'tru',hatc:'#a08a40',item:'spear',beard:'#2a2020'},
 'cam-ve':{robe:'#c03030',trim:'#e0b040',hat:'tru',hatc:'#e0b040',item:'spear'},
 'ca-nu':{robe:'#e07090',trim:'#fff0c0',hat:'hoa',item:'fan',fem:1,skirt:1,sash:'#fff0c0'},
 'nghe-nhan':{robe:'#4a6a8a',trim:'#c0d0e0',hat:'non',item:'lantern'},
 'tho-ren-hoang-cung':{robe:'#4a3a2a',trim:'#e0b040',hat:'khan',hatc:'#1e1b19',skin:'#c8945a',beard:'#3a3030'},
 'phap-su':{robe:'#6a3a8a',trim:'#e0b040',hat:'quan',hatc:'#4a2a6a',item:'staff',beard:'#d8d0c0'},
 'thuong-gia':{robe:'#8a6a2a',trim:'#e0b040',hat:'khan',hatc:'#3a2a1a',item:'scroll'},
 'nguoi-nuoi-ngua':{robe:'#6a5a3a',trim:'#a08a40',hat:'non'},
 // v10.3
 'hieu-buon':{robe:'#2a6a5a',trim:'#e0b040',hat:'khan',hatc:'#1e1b19',item:'scroll',beard:'#3a3030'},
 'thay-do':{robe:'#1e1b19',trim:'#c0a060',hat:'khan',hatc:'#1e1b19',item:'scroll',beard:'#d8d0c0',skin:'#e8c8a0'}, // v10.11: thầy đồ hỏi thư pháp
 'tho-truyen-than':{robe:'#7a5a8a',trim:'#f0e0c0',hat:'khan',hatc:'#4a3a5a',item:'fan',beard:'#5a4a4a'},
 'vo-si':{robe:'#5a3a2a',trim:'#c0a060',hat:'khan',hatc:'#8a2a1a',item:'spear'},
 'thai-su':{robe:'#4a2a6a',trim:'#e0b040',hat:'quan',hatc:'#2a1a3a',item:'scroll',beard:'#d8d0c0'},
 'ngu-lam':{robe:'#2a2a4a',trim:'#e0b040',hat:'tru',hatc:'#e0b040',item:'spear'},
 // v10.6
 'luyen-khi-su':{robe:'#3a2a5a',trim:'#c8a0ff',hat:'quan',hatc:'#2a1a3a',item:'staff',beard:'#8a8090',skin:'#e8d0b0'},
 'nap-the':{robe:'#8a4a1a',trim:'#ffd040',hat:'khan',hatc:'#5a2a0a',item:'scroll'},
 'tre-con':{robe:'#c04040',trim:'#ffe080',hat:'none',hair:'#2a2622',s:.62},
 'tre-con-2':{robe:'#3a6aa0',trim:'#ffe080',hat:'none',hair:'#2a2622',s:.58},
 'tre-con-3':{robe:'#5a8a3a',trim:'#ffe080',hat:'non',s:.6,fem:1,skirt:1},
 'trong-tai':{robe:'#8a2a1a',trim:'#e0b040',hat:'quan',hatc:'#2a1a10',item:'fan',beard:'#d8d0c0'} // v10.34: trọng tài võ đài
};
const ICON={'rung-truc':'wood','dam-lay':'water','dinh-may':'wind','co-loa':'shield','bien-dong':'water','nui-lua':'flame','rung-ma':'demon','bang-nguyen':'ice','thang-long':'flag','cuu-trung':'spark',
  'thuy-cung':'water','hoang-mac-xuong':'earth','thien-son':'ice','hoa-lu':'shield','dia-nguc-mon':'flame','dao-rong':'demon','vuc-yeu-tinh':'demon','cung-trang':'light','phu-xuan':'flag','thien-dinh':'light',
  'hu-khong':'spark','huyet-hai':'water','chien-truong':'flag','luu-sa':'earth','vo-dai':'sword','van-kiem':'metal','bang-hoa':'ice','cuu-u':'demon','hon-don-hai':'wind','hon-nguyen':'heart'};
// ---- hàng hóa hiệu buôn thành trì: cùng một bộ mặt hàng, tên và màu riêng từng thành, bậc (bac) = cấp thành → chỉ số nhân theo bậc, giá nhân mul
const GOODS_BASE=[ // [hậu tố mã, tên, ô, loại, cầm, công, thủ, giá gốc]
 ['kiem','Kiếm','hand','sword','one',16,0,600],['khien','Khiên','hand','shield','one',0,14,560],['gay','Gậy phép','hand','staff','one',13,0,520],['cung','Cung','hand','bow','two',15,0,560],['giao','Giáo','hand','spear','two',17,0,600],['dao','Đao','hand','saber','one',18,0,640],['chuy','Chùy','hand','mace','one',20,0,700],['no','Nỏ','hand','crossbow','two',19,0,700],
 ['mu','Mũ trụ','hat','hat','',0,6,300],['giap','Giáp','armor','armor','',0,12,800],['quan','Quần giáp','pants','pants','',0,6,300],['gang','Bao tay','gloves','gloves','',0,4,220],['giay','Hài','shoes','shoes','',0,5,260],['ao-choang','Áo choàng','wings','wings','',0,3,1200]];
const GOODS_NAME={'co-loa':['Âu Lạc','#8a9a5a'],'thang-long':['Long Thành','#c03030'],'hoa-lu':['Trường Yên','#6a3a8a'],'phu-xuan':['Thuận Hóa','#d0a030']};
const BOOKS=[['book-fire',400],['book-water',300],['book-earth',450],['book-metal',450],['book-wood',300],['book-loi',900],['book-phong',700],['book-bang',800],['book-ma',1500],['book-sang',1000]];
function goodsRows(){
  const vp=[],ch=[];
  for(const M of MAPS){if(!M.goods)continue;const [nm,col]=GOODS_NAME[M.id],G=M.goods;let o=1;
    for(const [suf,ten,oo,loai,cam,cong,thu,gia] of GOODS_BASE){const id=suf+'-'+M.id;vp.push({id,ten:ten+' '+nm,o:oo,loai,cam,cong,thu,toc:0,gia:R(gia*G.mul),mau:col,thu_cuoi:'',menh_lenh:0,he:'',pham_chat:'',hieu_ung:'',gia_tri:0,mo_ta:''});ch.push({cua_hang:'thanh-'+M.id+(oo==='hand'?'-ren':''),id,pham_chat:'n,g,p',gia:'',thu_tu:o++,bac:M.lv});} // v10.13: lò rèn chỉ bán vũ khí; mũ / giáp / quần / găng / hài / áo choàng ở hiệu buôn
    for(const [id,ten,beast,toc,cmd,mau,fx,v,mo] of G.mount){vp.push({id,ten,o:'mount',loai:'mount',cam:'',cong:beast==='kylan'||beast==='rong'?6:0,thu:beast==='elephant'||beast==='rong'?10:0,toc:Math.round(toc*100),gia:R((fx?9000:4000)*G.mul),mau,thu_cuoi:beast,menh_lenh:cmd,he:'',pham_chat:fx?'p':'',hieu_ung:fx||'',gia_tri:v||0,mo_ta:mo||''}); /* v10.13: thú thần thoại có hiệu ứng (hút máu, % sát thương, % phòng ngự, phân thân) */ch.push({cua_hang:'thanh-'+M.id+(M.npcs.some(n=>n.role==='nguoi-nuoi-ngua')?'-thu':''),id,pham_chat:fx?'p':'n',gia:'',thu_tu:o++,bac:M.lv});}
    for(const [id,ten,loai,cam,cong,thu,mau,fx,v,mo] of G.fx){const oo=['sword','shield','staff','bow','spear','crossbow','saber','mace'].includes(loai)?'hand':loai;vp.push({id,ten,o:oo,loai,cam,cong,thu,toc:0,gia:R(8000*G.mul),mau,thu_cuoi:'',menh_lenh:0,he:'',pham_chat:'p',hieu_ung:fx,gia_tri:v,mo_ta:mo});ch.push({cua_hang:'thanh-'+M.id+(oo==='hand'?'-ren':oo==='mount'&&M.npcs.some(n=>n.role==='nguoi-nuoi-ngua')?'-thu':''),id,pham_chat:'p',gia:'',thu_tu:o++,bac:M.lv});}
  }
  // v10.12: Pháp sư mỗi thành bán 10 quyển sách ngũ hành bậc = cấp thành (chỉ số sách ×(1+bậc/25)), giá × mul/2
  for(const M of MAPS){if(!M.goods)continue;let o=1;for(const [id,gia] of BOOKS)ch.push({cua_hang:'thanh-'+M.id+'-sach',id,pham_chat:'n,g,p',gia:R(gia*M.goods.mul/2),thu_tu:o++,bac:M.lv});}
  return {vat_pham:vp,cua_hang:ch};
}
// ---- sinh ô nền và vật
function build(M,idx){
  const S=M.seed,g=Array.from({length:H},()=>Array(W).fill('.'));
  const next=MAPS[idx+1],prev=M.from;
  // cổng vào ở mép dưới (giữa), cổng ra ở mép trên; thành trì: cổng ra ở mép phải
  const ent={x:23,y:32,w:3,h:1},ex=next?(M.citadel?{x:46,y:16,w:1,h:2}:{x:23,y:1,w:3,h:1}):null;
  const spawn={x:24,y:29},safe=M.citadel?{x0:12,y0:7,x1:35,y1:24}:{x0:19,y0:27,x1:29,y1:32};
  const inSafe=(x,y)=>x>=safe.x0&&x<=safe.x1&&y>=safe.y0&&y<=safe.y1;
  const camps=M.kind==='battle'?[ // v10.34: chiến trường — bốn bãi quân đông quanh doanh trại
    {name:'Bãi '+M.mobs[0][1].toLowerCase(),x:9,y:21,r:4,mon:{[M.mobs[0][0]]:10,[M.mobs[1][0]]:4}},{name:'Bãi '+M.mobs[1][1].toLowerCase(),x:39,y:21,r:4,mon:{[M.mobs[1][0]]:8,[M.mobs[0][0]]:5}},
    {name:'Tiền quân',x:10,y:9,r:3,mon:{[M.mobs[0][0]]:7,[M.mobs[1][0]]:3}},{name:'Hậu quân',x:38,y:9,r:3,mon:{[M.mobs[1][0]]:6,[M.mobs[0][0]]:4}}]
    // v10.35: thêm Bãi luyện công — bãi quái đông để cày kinh nghiệm
    :M.citadel?[{name:'Bãi '+M.mobs[0][1].toLowerCase(),x:7,y:16,r:3,mon:{[M.mobs[0][0]]:6,[M.mobs[1][0]]:2}},{name:'Bãi '+M.mobs[1][1].toLowerCase(),x:40,y:28,r:3,mon:{[M.mobs[1][0]]:5,[M.mobs[0][0]]:2}},{name:'Bãi luyện công',x:7,y:6,r:3,mon:{[M.mobs[0][0]]:9,[M.mobs[1][0]]:3}}]
    :[{name:'Bãi '+M.mobs[0][1].toLowerCase(),x:10,y:20,r:3,mon:{[M.mobs[0][0]]:6,[M.mobs[1][0]]:2}},{name:'Bãi '+M.mobs[1][1].toLowerCase(),x:38,y:12,r:3,mon:{[M.mobs[1][0]]:5,[M.mobs[0][0]]:2}},{name:'Bãi luyện công',x:37,y:24,r:3,mon:{[M.mobs[0][0]]:9,[M.mobs[1][0]]:3}}];
  const lair=M.citadel?{x:40,y:4}:{x:24,y:8};
  const keep=(x,y)=>inSafe(x,y)||Math.hypot(x-spawn.x,y-spawn.y)<=2.2||camps.some(c=>(x-c.x)**2+(y-c.y)**2<=(c.r+1.5)**2)||Math.hypot(x-lair.x,y-lair.y)<5||(ex&&Math.abs(x-ex.x-1)<=3&&Math.abs(y-ex.y)<=3)||(Math.abs(x-ent.x-1)<=3&&Math.abs(y-ent.y)<=3)||(M.kind==='battle'&&x>=17&&x<=33&&y>=2&&y<=14)||(M.kind==='arena'&&Math.hypot(x-24,y-17)<=7.2);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(x===0||y===0||x===W-1||y===H-1){g[y][x]='#';continue;}
    if(keep(x,y))continue;
    const n1=noise(x,y,5,S),n2=noise(x,y,7,S+1),n3=noise(x,y,4,S+2);
    if(n1>M.rock)g[y][x]='#';
    else if(n2>M.water)g[y][x]='~';
    else if(M.lava&&n3>.83)g[y][x]='"';
    else if(n3<M.dry)g[y][x]=',';
  }
  if(M.sea)for(let y=1;y<H-1;y++)for(let x=1;x<=4+Math.round(noise(0,y,4,S+5)*4);x++)if(!keep(x,y))g[y][x]='~';
  // thành trì: bên trong tường là sân gạch (ô đặc biệt không), đường quanh
  if(M.citadel){for(let y=safe.y0;y<=safe.y1;y++)for(let x=safe.x0;x<=safe.x1;x++)g[y][x]=(x+y)%7===0?',':'.';}
  // đường đất: vào → sảnh → ra, và tới hai bãi
  const path=[];const road=(ax,ay,bx,by)=>{let x=ax,y=ay;while(x!==bx){path.push([x,y]);x+=Math.sign(bx-x);}while(y!==by){path.push([x,y]);y+=Math.sign(by-y);}path.push([x,y]);};
  road(ent.x+1,ent.y,spawn.x,spawn.y);if(ex)road(spawn.x,spawn.y,ex.x+ (ex.w>1?1:0),ex.y+(ex.h>1?1:0));for(const c of camps)road(spawn.x,spawn.y,c.x,c.y);road(spawn.x,spawn.y,lair.x,lair.y);
  for(const [px,py] of path){for(const [dx,dy] of [[0,0],[1,0],[0,1]]){const x=px+dx,y=py+dy;if(x>0&&x<W-1&&y>0&&y<H-1&&(g[y][x]==='#'||g[y][x]==='~'||g[y][x]==='"'))g[y][x]='.';}if(g[py][px]!=='~'&&!inSafe(px,py))g[py][px]=':';}
  for(const P of [ent,ex].filter(Boolean))for(let y=P.y;y<P.y+(P.h||1);y++)for(let x=P.x;x<P.x+(P.w||1);x++)g[y][x]='.';
  // vật trang trí
  const objects=[],solidAt=new Set(),blockedAt=(x,y)=>g[y][x]!=='.'&&g[y][x]!==','&&g[y][x]!==':'||solidAt.has(x+','+y);
  const place=(kind,x,y,extra={})=>{objects.push({kind,x,y,...extra});if(extra.solid!==false)for(let k=0;k<(extra.w||1);k++)for(let j=0;j<(extra.h||1);j++)solidAt.add((x+k)+','+(y-j));};
  const onPath=new Set(path.map(([x,y])=>x+','+y));
  for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){
    if(blockedAt(x,y)||onPath.has(x+','+y)||onPath.has((x-1)+','+y)||keep(x,y)&&!(camps.some(c=>Math.hypot(x-c.x,y-c.y)>c.r+.5&&Math.hypot(x-c.x,y-c.y)<c.r+1.6)))continue;
    const h=hash(x,y,S+9);let acc=0;
    for(const [kind,,dens,extra] of M.deco){acc+=dens;if(h<acc){place(kind,x,y,{seed:(x*31+y*17)%97,...(extra||{})});break;}}
  }
  // trạm nghỉ ở cổng vào: lửa trại, giếng cổ
  const fireAt=M.citadel?{x:21,y:19}:{x:21,y:30},wellAt=M.citadel?{x:26,y:19}:{x:27,y:30};
  place('fire',fireAt.x,fireAt.y);place('well',wellAt.x,wellAt.y,{ancient:true,id:'gieng-'+M.id});
  if(M.citadel){
    const {x0,y0,x1,y1}=safe,gateX=23;
    for(let x=x0;x<=x1;x+=3)if(Math.abs(x+1-gateX)>2)place('tuong',x,y1+1,{w:3});
    for(let x=x0;x<=x1;x+=3)place('tuong',x,y0-1,{w:3});
    place('cong-thanh',gateX,y1+1,{w:3,solid:false});
    for(let y=y0;y<=y1;y+=1){if(!(ex&&y>=ex.y-1&&y<=ex.y+2&&x1+1>=ex.x-2))g[y][x0-1]='#';if(!(ex&&y>=ex.y-1&&y<=ex.y+2))g[y][x1+1]='#';}
    g[y1+1][gateX]='.';g[y1+1][gateX+1]='.';g[y1+1][gateX+2]='.';g[y1+2][gateX]=g[y1+2][gateX+1]=g[y1+2][gateX+2]='.';
    for(const [x,y,w,h] of [[15,10,3,2],[31,10,3,2],[15,22,3,2],[31,22,3,2],[22,10,4,2]])place('nha',x,y+h-1,{w,h});
    for(const [x,y] of [[14,14],[33,14],[14,20],[33,20],[20,24],[27,24],[23,13]])place('den',x,y,{light:'#ffb060',solid:false});
    place('co',18,8,{solid:false});place('co',29,8,{solid:false});place('trong',27,17,{solid:true});
    // lối ra ở tường phải
    if(ex){for(let y=ex.y;y<ex.y+ex.h;y++)for(let x=x1+1;x<=ex.x;x++)g[y][x]='.';}
  }
  // v10.34: chiến trường — doanh trại địch (rào gỗ hai cổng bắc nam, lều, trống trận, cờ soái giữa doanh); võ đài — sàn đá tròn, cột và cờ; điện cuối — lồng giam con gái
  if(M.kind==='battle'){const X0=18,X1=30,Y0=3,Y1=13;
    for(let x=X0;x<=X1;x+=3)if(Math.abs(x+1-23)>2){place('rao',x,Y1,{w:3});place('rao',x,Y0,{w:3});}
    for(let y=Y0;y<=Y1;y++){g[y][X0-1]='#';g[y][X1+3]='#';}
    for(const [x,y] of [[20,6],[29,6],[20,11],[29,11]])place('leu',x,y);
    for(const [x,y] of [[21,9],[27,9]])place('trong-tran',x,y);
    for(const [x,y] of [[19,4],[31,4],[19,12],[31,12],[22,13],[26,13]])place('duoc',x,y,{light:'#ffb060',solid:false});
    place('co-doanh',24,7,{solid:false});}
  if(M.kind==='arena'){const cx=24,cy=17;
    for(let y=cy-7;y<=cy+7;y++)for(let x=cx-7;x<=cx+7;x++){const d=Math.hypot(x-cx,y-cy);if(d<=6.2&&g[y]&&g[y][x]!==undefined)g[y][x]=d<=5.4&&(x+y)%5===0?',':'.';}
    for(let k=0;k<12;k++){const a=k/12*Math.PI*2;if(Math.abs(Math.sin(a))>.9)continue;place('cot-vo-dai',Math.round(cx+Math.cos(a)*6.6),Math.round(cy+Math.sin(a)*6.6));}
    for(const [x,y] of [[cx-5,cy-5],[cx+5,cy-5],[cx-5,cy+5],[cx+5,cy+5]])place('co-vo-dai',x,y,{solid:false});}
  if(M.kind==='final'){for(const [x,y] of [[20,12],[28,12],[20,16],[28,16],[20,20],[28,20]])place('den-hon-nguyen',x,y,{light:'#ffd080',solid:false});}
  // quái lẻ ngoài bãi
  const monsters=[{type:M.boss[0],x:lair.x,y:lair.y}];
  const free=(x,y)=>x>1&&x<W-2&&y>1&&y<H-2&&!blockedAt(x,y)&&!inSafe(x,y);
  let put=0;for(let i=0;put<6&&i<400;i++){const x=2+Math.floor(hash(i,S,3)*(W-4)),y=2+Math.floor(hash(i,S,4)*(H-4));if(free(x,y)&&!camps.some(c=>Math.hypot(x-c.x,y-c.y)<c.r+3)&&Math.hypot(x-lair.x,y-lair.y)>6){monsters.push({type:M.mobs[put%2][0],x,y});put++;}}
  // kiểm tra tới được mọi nơi (BFS trên ô đi được), chưa tới được thì đục đường thẳng
  const pass=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&g[y][x]!=='#'&&g[y][x]!=='~'&&!solidAt.has(x+','+y);
  const reach=()=>{const seen=new Set([spawn.x+','+spawn.y]),q=[[spawn.x,spawn.y]];while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&pass(nx,ny)){seen.add(k);q.push([nx,ny]);}}}return seen;};
  const need=[...camps.map(c=>[c.x,c.y]),[lair.x,lair.y],[ent.x+1,ent.y],...(ex?[[ex.x,ex.y]]:[]),...monsters.map(m=>[m.x,m.y]),...(M.npcs||[]).map(n=>[n.x!=null?n.x:n.x0,n.y])];
  for(const [tx,ty] of need){let seen=reach();if(seen.has(tx+','+ty))continue;let x=spawn.x,y=spawn.y;while(x!==tx||y!==ty){if(x!==tx)x+=Math.sign(tx-x);else y+=Math.sign(ty-y);if(g[y][x]==='#'||g[y][x]==='~')g[y][x]='.';const i=objects.findIndex(o=>o.x===x&&o.y===y&&o.solid!==false&&!/^(nha|tuong)$/.test(o.kind));if(i>=0){objects.splice(i,1);solidAt.delete(x+','+y);}}}
  const portals=[{...ent,to:prev,label:MAPS.find(m=>m.id===prev)?.name||{'hang-dong':'Hang động','sa-mac':'Sa mạc','nui-tuyet':'Núi tuyết'}[prev]}];
  if(ex)portals.push({...ex,to:next.id,label:next.name});
  if(M.also){portals.push({x:1,y:16,w:1,h:2,to:M.also,label:MAPS.find(m=>m.id===M.also).name});for(let y=16;y<18;y++)for(let x=1;x<=4;x++)if(g[y][x]!=='.')g[y][x]='.';}
  // tx,ty của cổng: đứng ngay trong bản đồ đích, cạnh cổng về
  const def={id:M.id,name:M.name,w:W,h:H,tiles:g.map(r=>r.join('')),spawn,safe,zones:[{name:M.citadel?'Trong thành':'Trạm nghỉ',...safe},...(M.kind==='battle'?[{name:'Doanh trại địch',x0:18,y0:3,x1:32,y1:13}]:M.kind==='arena'?[{name:'Võ đài',x0:18,y0:11,x1:30,y1:23}]:[]),{name:'Hang ổ '+M.boss[1],x0:lair.x-4,y0:lair.y-4,x1:lair.x+4,y1:lair.y+4}],
    hazard:M.hazard||undefined, // v10.13: hiệu ứng vùng
    camps,objects,trees:[],...(M.kind==='battle'?{flag:{x:24,y:7},kind:'battle'}:M.kind==='arena'?{arena:{x:24,y:17,r:6},kind:'arena'}:M.kind==='final'?{rescue:{x:28,y:6},kind:'final'}:{}),npcs:(M.npcs||[]).map(n=>({...n,...(n.x==null?{x:(n.x0+n.x1)/2,facing:1}:{})})),monsters,portals,theme:M.id,sky:M.sky?M.id:undefined,level:M.lv};
  return def;
}
// v10.39: NPC giao việc chính tuyến Tìm con ở từng vùng (hình vẽ dùng chung trong src/04-gen.js A.npc, không cần khai báo ở gói bản đồ)
const GIVERS={
 'dam-lay':['lai-do','Ông lái đò',['Đầm này nuốt người như bỡn. Muốn qua thì phải đi đúng phiến đá.','Ta chèo đò ở đây ba mươi năm, chưa thấy ai lội bùn mà qua được.']],
 'co-loa':['ba-lao-che','Bà lão bán chè',['Chè đậu, chè kê đây! Ăn một bát cho mát lòng.','Mắt bà kém rồi, qua đường đông xe ngựa sợ lắm.']],
 'nui-lua':['tho-ren-nui','Thợ rèn núi',['Lửa núi này nóng hơn mọi lò rèn dưới xuôi.','Rèn gì cũng được… miễn trả đủ tiền. Ta đã lỡ rèn một thứ không nên rèn.']],
 'bang-nguyen':['su-gia-bang','Sứ giả Băng Hoàng',['Băng Hoàng không tiếp kẻ ngu dốt. Muốn hỏi chuyện thì phải qua câu đố của ta.']],
 'thang-long':['linh-bang-tin','Lính gác bảng tin',['Bảng tin kinh thành dán lệnh truy nã mỗi ngày.','Có ai nhận ra kẻ nào thì báo ngay cho lính gác.']],
 'cuu-trung':['giu-lau','Lão giữ lầu',['Cửu Trùng Đài chín tầng, mỗi tầng một câu đố. Đáp được thì lên.']],
 'thuy-cung':['quy-tuong','Quy thừa tướng',['Ta là thừa tướng của Long Vương, sống đã ngàn năm.','Con trai khổng lồ ngoài kia giữ một viên ngọc biết nói.']],
 'thien-son':['chan-de','Người chăn dê',['Gió Thiên Sơn mạnh lắm, thả diều thì bay tới tận mây.']],
 'hoa-lu':['lao-gac-cong','Lão gác cổng',['Cổng thành ba người canh, mà chỉ có một người thật thà.']],
 'dia-nguc-mon':['phan-quan','Phán quan',['Sổ sinh tử ghi tên mọi kiếp người. Ghi sai một nét là đổi cả một đời.']],
 'vuc-yeu-tinh':['dao-co','Đạo cô',['Trong vực có hồ ly thành tinh, giả làm người để dụ khách lạ.','Đứng cạnh đèn mà nhìn bóng, bóng không biết nói dối.']],
 'cung-trang':['nguyet-than','Nguyệt Thần',['Cung Trăng lạnh lẽo, chỉ có tiếng chày giã thuốc của Thỏ Ngọc.']],
 'phu-xuan':['quan-le-bo','Quan Lễ bộ',['Lễ nghi triều đình phải đúng từng bước, sai một bước là phạm thượng.']],
 'hu-khong':['tien-ong','Tiên ông lạc lối',['Ta lạc ở Hư Không này đã trăm năm, chỉ thấy khe nứt với khe nứt.']],
 'huyet-hai':['lao-thuyen','Lão lái thuyền',['Biển máu không có cá, chỉ có thuyền giấy trôi dạt.']],
 'chien-truong':['lao-binh','Lão binh',['Chiến trường này ta đánh từ thời trai trẻ, giờ chỉ còn ma.','Cờ soái của địch còn cắm giữa doanh trại kia.']],
 'luu-sa':['lao-lai-be','Lão lái bè',['Sông cát chảy ngược, không có Sa Hà Quái gật đầu thì chẳng ai qua được.']],
 'vo-dai':['lao-vo-su','Lão võ sư',['Mười danh tướng trên đài kia, mỗi người một tuyệt kỹ.']],
 'van-kiem':['kiem-lao','Kiếm lão',['Vạn thanh kiếm cắm trên núi, mỗi thanh chờ một chủ nhân.']],
 'bang-hoa':['dao-si-bang-hoa','Đạo sĩ băng hỏa',['Băng với lửa phải cân nhau thì cổng mới mở.']],
 'cuu-u':['manh-ba','Mạnh Bà',['Uống bát canh này thì quên hết… Ngươi chưa muốn quên ai à?']],
 'hon-don-hai':['long-nu','Long nữ',['Biển Hỗn Độn không có đường, chỉ có la bàn đá của tổ tiên.']]};
for(const M of MAPS){const g=GIVERS[M.id];if(!g)continue;const [id,name,lines]=g;M.npcs=[...(M.npcs||[]).filter(n=>n.id!==id),{id,role:id,name,act:'stand',...(M.citadel?{x:15,y:14}:{x:26,y:28}),facing:-1,lines}];}
const defs=MAPS.map((M,i)=>build(M,i));
// tx,ty cho từng cổng (ô đứng cạnh cổng về trong bản đồ đích)
const spawnNear=(d,P)=>P.y<=1?{tx:P.x+1,ty:P.y+2}:P.y>=H-2?{tx:P.x+1,ty:P.y-2}:P.x<=1?{tx:P.x+3,ty:P.y+1}:{tx:P.x-3,ty:P.y+1};
for(const d of defs)for(const P of d.portals){const to=defs.find(x=>x.id===P.to);if(!to)continue;const back=to.portals.find(q=>q.to===d.id);if(back)Object.assign(P,spawnNear(to,back));}
// cổng ở bản đồ cũ sang bản đồ mới
const OLD={'hang-dong':{x:6,y:32,w:3,h:1},'sa-mac':{x:46,y:15,w:1,h:2},'nui-tuyet':{x:20,y:1,w:3,h:1}};
for(const [oid,P] of Object.entries(OLD)){
  const f=path.join(root,'maps',oid+'.json'),d=JSON.parse(fs.readFileSync(f,'utf8')),M=MAPS.find(m=>m.from===oid),to=defs.find(x=>x.id===M.id),back=to.portals.find(q=>q.to===oid);
  d.portals=d.portals.filter(q=>q.to!==M.id);d.portals.push({...P,to:M.id,label:M.name,...spawnNear(to,back)});
  const t=d.tiles.map(r=>r.split(''));for(let y=P.y;y<P.y+(P.h||1);y++)for(let x=P.x;x<P.x+(P.w||1);x++)t[y][x]='.';for(let k=1;k<=2;k++){const y=P.y<=1?P.y+k:P.y>=H-2?P.y-k:P.y,x=P.x>=W-2?P.x-k:P.x;for(let i=0;i<(P.w||1);i++)for(let j=0;j<(P.h||1);j++)if(t[y+(P.h>1?j:0)]&&t[y+(P.h>1?j:0)][x+(P.w>1?i:0)]==='#')t[y+(P.h>1?j:0)][x+(P.w>1?i:0)]='.';}
  d.tiles=t.map(r=>r.join(''));d.objects=(d.objects||[]).filter(o=>!(Math.abs(o.x-P.x)<=3&&Math.abs(o.y-P.y)<=3));d.trees=(d.trees||[]).filter(([x,y])=>!(Math.abs(x-P.x)<=3&&Math.abs(y-P.y)<=3));
  for(const q of to.portals)if(q.to===oid)Object.assign(q,spawnNear(d,d.portals.find(z=>z.to===M.id)));
  fs.writeFileSync(f,JSON.stringify(d,null,1)+'\n');
}
// ghi json + art
for(const [i,d] of defs.entries()){
  const M=MAPS[i];
  fs.writeFileSync(path.join(root,'maps',d.id+'.json'),JSON.stringify(d,null,1)+'\n');
  const obj={};for(const [k,v] of M.deco)obj[k]=v;
  if(M.kind==='battle')Object.assign(obj,{rao:{base:'wall',c:['#6a4a2a','#3a2414','#8a6a40']},leu:{base:'tent',c:['#8a2a20','#4a3220']},'trong-tran':{base:'drum',c:['#6a1a10','#e8d0a0','#e0b040']},duoc:{base:'torch',c:['#4a3220','#ff8a30']},'co-doanh':{base:'flag',s:1.6,c:['#4a3220','#c02020','#ffd040']}});
  if(M.kind==='arena')Object.assign(obj,{'cot-vo-dai':{base:'pillar',c:['#b0a080','#6a2a1a']},'co-vo-dai':{base:'flag',c:['#4a3220','#e0b040','#c02020']}});
  if(M.citadel)Object.assign(obj,{tuong:{base:'wall',c:['#8a7a66','#5a4e44','#b0a088']},'cong-thanh':{base:'gate',c:['#8a7a66','#e0b040','#6b2d1e']},nha:{base:'roof',c:['#c8b088','#6b2d1e','#e0b040']},den:{base:'lantern',c:['#5a2a1a','#ff7040']},co:{base:'flag',c:['#6a4a2a','#c03030','#e0b040']},trong:{base:'drum',c:['#8a2a1a','#e8d0a0','#e0b040']}});
  const mon={};for(const [id,,sp] of M.mobs)mon[id]=sp;mon[M.boss[0]]=M.boss[2];
  const npc={};for(const n of M.npcs||[])if(!npc[n.role]&&NPC_LOOK[n.role])npc[n.role]=NPC_LOOK[n.role];
  const spec={theme:{[M.id]:M.theme},obj,mon,ring:{[M.boss[0]]:M.ring},...(M.sky?{sky:{[M.id]:M.sky}}:{}),...(Object.keys(npc).length?{npc}:{})};
  fs.writeFileSync(path.join(root,'maps',d.id+'.art.js'),`/* ${M.name} (cấp ${M.lv}) · sinh bởi tools/genmaps.mjs: nền, vật, quái, NPC vẽ bằng LH_ART.gen */\nK=>LH_ART.gen(${JSON.stringify(spec)})\n`);
}
// dữ liệu cho src/01-data.js (quái, nhiệm vụ, bản đồ)
fs.writeFileSync(path.join(root,'src','01-data-vung.js'),'/* Sinh bởi tools/genmaps.mjs: quái, nhiệm vụ, bản đồ của 20 vùng cấp 20–150, hàng hóa hiệu buôn 4 thành trì (nối vào GAME_DATA; Sheet có dòng thì Sheet thắng) */\nconst GAME_DATA_VUNG=(d=>Object.fromEntries(Object.entries(d).map(([k,[h,...rows]])=>[k,rows.map(r=>Object.fromEntries(h.map((c,i)=>[c,r[i]])))])))('+JSON.stringify(Object.fromEntries(Object.entries({quai:monRows(),nhiem_vu:questRows(),ban_do:MAPS.map((M,i)=>({id:M.id,ten:M.name,cap:M.lv,bieu_tuong:ICON[M.id],thu_tu:5+i,khoa_mo:M.gate||''})),...goodsRows()}).map(([k,rows])=>{const h=Object.keys(rows[0]);return [k,[h,...rows.map(r=>h.map(c=>r[c]))]];})))+');\nfor(const k of Object.keys(GAME_DATA_VUNG))GAME_DATA[k]=(GAME_DATA[k]||[]).concat(GAME_DATA_VUNG[k]);\n');
console.log('Đã sinh',defs.length,'bản đồ:',defs.map(d=>d.id+'('+d.objects.length+' vật, '+d.monsters.length+' quái lẻ)').join(', '));
