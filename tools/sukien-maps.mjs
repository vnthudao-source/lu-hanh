// v10.46: bản đồ sự kiện thế giới (Tướng quân) — sinh maps/<mã>.json + maps/<mã>.art.js
//   loi-dai-tg: Lôi đài thế giới — sân chờ (vùng an toàn, phía nam) và võ đài tròn ở giữa (World.def.ring), vòng đài thu hẹp trong trận
// Chạy: node tools/sukien-maps.mjs && node tools/build.mjs
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const hash=(a,b)=>{let h=(a*374761393+b*668265263)>>>0;h=(h^(h>>>13))*1274126177>>>0;return ((h^(h>>>16))>>>0)/4294967296;};
function loiDai(){
  const W=40,H=36,cx=20,cy=15,R=11,g=[...Array(H)].map((_,y)=>[...Array(W)].map((_,x)=>x===0||y===0||x===W-1||y===H-1?'#':'.'));
  // nền võ đài: đường đất (lát gạch theo bộ nền), vành ngoài cỏ khô
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const d=Math.hypot(x-cx,y-cy);if(d<=R)g[y][x]=':';else if(d<=R+1.6)g[y][x]=',';else if(hash(x,y)<.08)g[y][x]=',';}
  // sân chờ: lối đất từ võ đài xuống
  for(let y=cy+R;y<H-2;y++)for(let x=cx-1;x<=cx+1;x++)g[y][x]=':';
  const objects=[],solid=new Set();const put=(kind,x,y,o={})=>{objects.push({kind,x,y,...o});if(o.solid!==false)solid.add(x+','+y);};
  // cột đá quanh võ đài (chừa lối vào phía nam), cờ bốn góc
  for(let k=0;k<20;k++){const a=k/20*Math.PI*2;const x=Math.round(cx+Math.cos(a)*(R+2)),y=Math.round(cy+Math.sin(a)*(R+2));if(y>cy+R-1&&Math.abs(x-cx)<=3)continue;if(x<2||y<2||x>W-3||y>H-3)continue;put(k%2?'cot-loi-dai':'den-loi-dai',x,y,k%2?{}:{light:'#ffb060'});}
  for(const [x,y] of [[cx-8,cy-8],[cx+8,cy-8],[cx-8,cy+8],[cx+8,cy+8]])put('co-loi-dai',x,y,{solid:false});
  // sân chờ: lều, trống trận, đèn, giếng cổ
  const safe={x0:11,y0:28,x1:29,y1:33};
  for(const [x,y] of [[12,29],[27,29],[12,32],[27,32]])put('leu-loi-dai',x,y);
  put('trong-loi-dai',16,29);put('trong-loi-dai',24,29);
  for(const [x,y] of [[14,33],[26,33],[11,30],[29,30]])put('den-loi-dai',x,y,{light:'#ffb060'});
  objects.push({kind:'well',x:23,y:31,ancient:true,id:'gieng-901'});
  // cây quanh rìa
  const trees=[];for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const d=Math.hypot(x-cx,y-cy);if(d>R+3.5&&!(x>=safe.x0-1&&x<=safe.x1+1&&y>=safe.y0-1)&&hash(x*7,y*13)<.16&&!solid.has(x+','+y))trees.push([x,y,hash(x,y)<.3?1:0]);}
  return {id:'loi-dai-tg',name:'Lôi Đài Thế Giới',w:W,h:H,tiles:g.map(r=>r.join('')),spawn:{x:cx,y:31},safe,zones:[{name:'Sân chờ',...safe},{name:'Võ đài',x0:cx-R,y0:cy-R,x1:cx+R,y1:cy+R}],
    objects,trees,npcs:[],monsters:[],portals:[],theme:'loi-dai-tg',sky:'loi-dai-tg',event:'loi',ring:{x:cx,y:cy,r:R},level:1};
}
// Chiến trường phương Bắc: một đường chéo từ góc dưới trái (phe ta) lên góc trên phải (phe địch). lane = vị trí trụ, nhà chính, chỗ lính địch xuất hiện (ô)
function bacChien(){
  const W=48,H=40,A=[4,36],B=[44,4],P=t=>[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t],R=v=>Math.round(v);
  const dl=(x,y)=>{const vx=B[0]-A[0],vy=B[1]-A[1],t=Math.max(0,Math.min(1,((x-A[0])*vx+(y-A[1])*vy)/(vx*vx+vy*vy)));const [px,py]=P(t);return Math.hypot(x-px,y-py);};
  const g=[...Array(H)].map((_,y)=>[...Array(W)].map((_,x)=>{if(x===0||y===0||x===W-1||y===H-1)return '#';const d=dl(x,y);if(d<=2.2)return ':';if(d<=5.5)return hash(x,y)<.12?',':'.';if(d<=7.5)return hash(x*3,y*5)<.35?',':'.';return '#';}));
  // góc phe ta (sân chờ) và góc phe địch mở rộng
  for(let y=30;y<=38;y++)for(let x=1;x<=12;x++)if(g[y][x]==='#')g[y][x]='.';
  for(let y=1;y<=9;y++)for(let x=36;x<=46;x++)if(g[y][x]==='#')g[y][x]='.';
  const objects=[],trees=[],solid=new Set(),put=(kind,x,y,o={})=>{objects.push({kind,x,y,...o});if(o.solid!==false)solid.add(x+','+y);};
  const safe={x0:1,y0:34,x1:8,y1:38};
  const at=t=>{const [x,y]=P(t);return [R(x),R(y)];};
  const lane={ours:{house:at(.15),towers:[at(.29)]},theirs:{towers:[at(.58),at(.74)],house:at(.9),spawn:at(.98)}};
  // phe ta: rào gỗ, lều, đuốc, cờ xanh; phe địch: rào, lều đỏ, đuốc, cờ đỏ
  for(const [x,y] of [[2,33],[5,33],[9,37],[12,35]])put('leu-bac-ta',x,y);
  for(const [x,y] of [[4,38],[8,34],[1,36]])put('duoc-bac',x,y,{light:'#ffb060'});
  put('co-bac-ta',7,31,{solid:false});put('co-bac-ta',13,33,{solid:false});
  for(const [x,y] of [[38,2],[45,7],[37,6],[44,2]])put('leu-bac-dich',x,y);
  for(const [x,y] of [[41,3],[46,5],[38,9]])put('duoc-bac',x,y,{light:'#ff8050'});
  put('co-bac-dich',36,4,{solid:false});put('co-bac-dich',42,9,{solid:false});
  // bụi cây, đá hai bên đường
  for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){if(g[y][x]==='#'||solid.has(x+','+y))continue;const d=dl(x,y);if(d>4.2&&hash(x*7,y*13)<.18&&!(x<=13&&y>=29)&&!(x>=35&&y<=10))trees.push([x,y,hash(x,y)<.4?1:0]);}
  // giếng cổ: cạnh doanh trại phe ta và giữa đường (bên lề)
  const mid=at(.44);objects.push({kind:'well',x:11,y:36,ancient:true,id:'gieng-911'});objects.push({kind:'well',x:mid[0]-3,y:mid[1]-3,ancient:true,id:'gieng-912'});
  for(const [x,y] of [[11,36],[mid[0]-3,mid[1]-3]]){g[y][x]='.';for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1],[1,1]])if(g[y+dy][x+dx]==='#')g[y+dy][x+dx]='.';}
  const keepFree=[...Object.values(lane.ours).flat(),...Object.values(lane.theirs).flat()].filter(Array.isArray);
  return {id:'bac-chien-tg',name:'Chiến Trường Phương Bắc',w:W,h:H,tiles:g.map(r=>r.join('')),spawn:{x:4,y:36},safe,
    zones:[{name:'Doanh trại phe ta',...safe},{name:'Doanh trại phe địch',x0:36,y0:1,x1:46,y1:9},{name:'Chiến tuyến',x0:10,y0:8,x1:38,y1:32}],
    objects,trees:trees.filter(([x,y])=>!keepFree.some(p=>Math.abs(p[0]-x)<=1&&Math.abs(p[1]-y)<=1)),npcs:[],monsters:[],portals:[],theme:'bac-chien-tg',sky:'bac-chien-tg',event:'bac',lane,level:1};
}
// Chiến trường thế giới: ba đường (trên, giữa, dưới) từ doanh trại phe ta (góc dưới trái) lên doanh trại phe địch (góc trên phải); mỗi đường một trụ mỗi phe
function theGioi(){
  const W=56,H=44,R=Math.round;
  const lanes=[[[8,33],[5,22],[5,6],[18,4],[44,5]],[[11,34],[28,21],[45,9]],[[12,38],[30,40],[50,39],[51,24],[48,11]]];
  const segD=(x,y,a,b)=>{const vx=b[0]-a[0],vy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy)));return Math.hypot(x-a[0]-vx*t,y-a[1]-vy*t);};
  const dl=(x,y)=>Math.min(...lanes.map(L=>Math.min(...L.slice(1).map((b,i)=>segD(x,y,L[i],b)))));
  const len=L=>L.slice(1).reduce((s,b,i)=>s+Math.hypot(b[0]-L[i][0],b[1]-L[i][1]),0);
  const at=(L,f)=>{let d=len(L)*f;for(let i=1;i<L.length;i++){const a=L[i-1],b=L[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=l){const t=d/l;return [R(a[0]+(b[0]-a[0])*t),R(a[1]+(b[1]-a[1])*t)];}d-=l;}return L[L.length-1];};
  const g=[...Array(H)].map((_,y)=>[...Array(W)].map((_,x)=>{if(x===0||y===0||x===W-1||y===H-1)return '#';const d=dl(x,y);if(d<=1.6)return ':';if(d<=3.6)return hash(x,y)<.12?',':'.';return hash(x*5,y*3)<.07?'#':(hash(x,y*7)<.3?',':'.');}));
  for(let y=33;y<=42;y++)for(let x=1;x<=13;x++)if(g[y][x]==='#')g[y][x]='.';
  for(let y=1;y<=12;y++)for(let x=42;x<=54;x++)if(g[y][x]==='#')g[y][x]='.';
  const objects=[],solid=new Set(),put=(kind,x,y,o={})=>{objects.push({kind,x,y,...o});if(o.solid!==false)solid.add(x+','+y);};
  const safe={x0:1,y0:38,x1:7,y1:42};
  const lane={ours:{house:[9,36],towers:lanes.map(L=>at(L,.3))},theirs:{house:[47,8],towers:lanes.map(L=>at(L,.7)),spawn:[46,10]},spawnA:[11,36],spawnB:[46,10],paths:lanes};
  for(const [x,y] of [[2,36],[5,36],[12,41]])put('leu-bac-ta',x,y);for(const [x,y] of [[1,39],[8,42],[13,38]])put('duoc-bac',x,y,{light:'#ffb060'});put('co-bac-ta',10,33,{solid:false});put('co-bac-ta',14,36,{solid:false});
  for(const [x,y] of [[51,3],[53,8],[43,2]])put('leu-bac-dich',x,y);for(const [x,y] of [[54,4],[44,11],[50,12]])put('duoc-bac',x,y,{light:'#ff8050'});put('co-bac-dich',45,6,{solid:false});put('co-bac-dich',42,9,{solid:false});
  const keep=[lane.ours.house,lane.theirs.house,...lane.ours.towers,...lane.theirs.towers,lane.spawnA,lane.spawnB];
  const trees=[];for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){if(g[y][x]!=='.'&&g[y][x]!==',')continue;if(solid.has(x+','+y))continue;const d=dl(x,y);if(d>4.2&&hash(x*7,y*13)<.26&&!(x<=14&&y>=32)&&!(x>=41&&y<=13)&&!keep.some(p=>Math.abs(p[0]-x)<=1&&Math.abs(p[1]-y)<=1))trees.push([x,y,hash(x,y)<.4?1:0]);}
  const wells=[[12,40,'gieng-921'],[20,17,'gieng-922'],[37,29,'gieng-923']];
  for(const [x,y,id] of wells){objects.push({kind:'well',x,y,ancient:true,id});for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(g[y+dy][x+dx]==='#')g[y+dy][x+dx]='.';}}
  const T2=trees.filter(([x,y])=>!wells.some(w=>Math.abs(w[0]-x)<=1&&Math.abs(w[1]-y)<=1));
  return {id:'the-gioi-tg',name:'Chiến Trường Thế Giới',w:W,h:H,tiles:g.map(r=>r.join('')),spawn:{x:4,y:40},safe,
    zones:[{name:'Doanh trại phe ta',...safe},{name:'Doanh trại phe địch',x0:42,y0:1,x1:54,y1:12},{name:'Đường giữa',x0:15,y0:12,x1:40,y1:32},{name:'Đường trên',x0:1,y0:1,x1:41,y1:30},{name:'Đường dưới',x0:14,y0:13,x1:54,y1:42}],
    objects,trees:T2,npcs:[],monsters:[],portals:[],theme:'bac-chien-tg',sky:'bac-chien-tg',event:'the',lane,level:1};
}
const ART={theme:{'bac-chien-tg':{g:['#6a5a40','#544630'],d:'ash',r:['#7a6a54','#4a4034','#2a241c'],w:['#5a6a70','#3a4a50'],p:'#8a7450',sd:'#8a7450'},'loi-dai-tg':{g:['#8a7a5a','#706244'],d:'brick',r:['#9a8468','#6a5844','#3a3024'],w:['#5a8aa0','#3a6a80'],p:'#c0a878',sd:'#a89070'}},
  sky:{'bac-chien-tg':{n:30,col:'#ffb070',size:2,vx:24,vy:-6,glow:1,tint:'#3018081a'},'loi-dai-tg':{n:18,col:'#ffd080',size:3,vx:6,vy:-8,glow:1,tint:'#40201010'}},
  obj:{'leu-bac-ta':{base:'tent',c:['#2a5a6a','#3a3220']},'leu-bac-dich':{base:'tent',c:['#8a2a20','#4a3220']},'duoc-bac':{base:'torch',c:['#4a3220','#ff8a30']},'co-bac-ta':{base:'flag',s:1.5,c:['#4a3220','#2a6ab0','#ffd040']},'co-bac-dich':{base:'flag',s:1.5,c:['#4a3220','#c02020','#ffd040']},'cot-loi-dai':{base:'pillar',c:['#b0a080','#6a2a1a']},'den-loi-dai':{base:'lantern',c:['#5a2a1a','#ff7040']},'co-loi-dai':{base:'flag',s:1.4,c:['#4a3220','#c02020','#ffd040']},
    'leu-loi-dai':{base:'tent',c:['#8a2a20','#4a3220']},
    // v10.49: trang trí thêm (tên có đuôi -tg vì tên vật dùng chung mọi gói bản đồ — 'gia-binh-khi' đã có ở vo-dai)
    'gia-binh-khi-tg':{base:'rack',c:['#6a4a2a','#c8c8d0']},'thung-go-tg':{base:'barrel',c:['#7a5a34','#3a2a1a']},'hom-go-tg':{base:'crate',c:['#9a7444','#5a3e20']},
    'rao-nhon-tg':{base:'palisade',c:['#7a5a34']},'vac-lua-tg':{base:'brazier',c:['#3a3434','#ff8a30']},'nguoi-rom-tg':{base:'dummy',c:['#d8b860','#8a2a20']},
    'phuon-ta-tg':{base:'banner',c:['#4a3220','#2a5ab0','#ffd040']},'phuon-dich-tg':{base:'banner',c:['#4a3220','#b02020','#ffd040']},'phuon-loi-tg':{base:'banner',c:['#4a3220','#c08020','#8a1a10']},
    'xe-luong-tg':{base:'cart',c:['#7a5a34','#c8b070']},'co-dai-tg':{base:'grass',c:['#7a8a40','#9aa050']},'co-hoa-tg':{base:'grass',c:['#6a8a3a','#8aa048'],flower:'#e8c040'},'co-hoa-do-tg':{base:'grass',c:['#6a8a3a','#8aa048'],flower:'#d05040'},
    'da-vun-tg':{base:'stones',c:['#8a8070']},'xuong-tran-tg':{base:'bones',c:['#d8d0b8']},'da-tang-tg':{base:'rock',s:1.1,c:['#7a7264','#4a4438']},'trong-loi-dai':{base:'drum',c:['#6a1a10','#e8d0a0','#e0b040']}}};
// v10.49: trang trí thêm cho đỡ đơn điệu — đặt theo danh sách (bỏ qua ô bận), rồi rải cỏ, hoa, đá vụn (đi xuyên qua được)
function decorate(d,list,scatter){
  const busy=new Set(),key=(x,y)=>x+','+y;for(const o of d.objects)for(let k=0;k<(o.w||1);k++)busy.add(key(o.x+k,o.y));for(const [x,y] of d.trees)busy.add(key(x,y));
  const keep=[];if(d.lane){for(const s of ['ours','theirs']){const L=d.lane[s];if(L.house)keep.push(L.house);for(const t of L.towers||[])keep.push(t);if(L.spawn)keep.push(L.spawn);}if(d.lane.spawnA)keep.push(d.lane.spawnA);}
  const tile=(x,y)=>(d.tiles[y]||'')[x];
  const free=(x,y,w=1,path=false)=>{for(let k=0;k<w;k++){const t=tile(x+k,y);if(!t||t==='#'||busy.has(key(x+k,y)))return false;if(!path&&t===':')return false;}
    if(keep.some(p=>Math.abs(p[0]-x)<=2&&Math.abs(p[1]-y)<=2))return false;for(const o of d.objects)if(o.kind==='well'&&Math.abs(o.x-x)<=1&&Math.abs(o.y-y)<=1)return false;return true;};
  let n=0;for(const [kind,x,y,o] of list){const w=(o&&o.w)||1,solid=!(o&&o.solid===false);if(!free(x,y,w,!solid))continue;d.objects.push({kind,x,y,...(o||{})});for(let k=0;k<w;k++)busy.add(key(x+k,y));n++;}
  for(let y=1;y<d.h-1;y++)for(let x=1;x<d.w-1;x++){const h=hash(x*11+3,y*17+5),t=tile(x,y);if(h>=(t===':'?scatter.pathRate||0:scatter.rate))continue;if(t==='#'||busy.has(key(x,y)))continue;
    const kinds=t===':'?scatter.path:scatter.ground;if(!kinds||!kinds.length)continue;d.objects.push({kind:kinds[Math.floor(hash(x,y*3)*kinds.length)],x,y,solid:false});busy.add(key(x,y));n++;}
  return n;
}
const DECO={
  'loi-dai-tg':d=>decorate(d,[
    // phướn vàng quanh võ đài, vạc lửa ở bốn hướng, giá binh khí và người rơm trong sân chờ, thùng hòm cạnh lều
    ...[...Array(12)].map((_,k)=>{const a=k/12*Math.PI*2+.13;return ['phuon-loi-tg',Math.round(20+Math.cos(a)*15),Math.round(15+Math.sin(a)*14.2)];}),
    ['vac-lua-tg',20,1,{light:'#ff9040'}],['vac-lua-tg',5,15,{light:'#ff9040'}],['vac-lua-tg',35,15,{light:'#ff9040'}],['vac-lua-tg',8,4,{light:'#ff9040'}],['vac-lua-tg',32,4,{light:'#ff9040'}],
    ['gia-binh-khi-tg',14,28],['gia-binh-khi-tg',26,28],['nguoi-rom-tg',13,31],['nguoi-rom-tg',28,31],['thung-go-tg',11,32,{n:2}],['hom-go-tg',29,32],['thung-go-tg',15,33],['hom-go-tg',25,33],
    ['xe-luong-tg',6,30],['xe-luong-tg',33,30],['gia-binh-khi-tg',5,26],['gia-binh-khi-tg',35,26],['nguoi-rom-tg',8,27],['nguoi-rom-tg',32,27],['thung-go-tg',3,33,{n:3}],['hom-go-tg',36,33],
    ['da-tang-tg',3,4],['da-tang-tg',36,5],['da-tang-tg',2,20],['da-tang-tg',37,22]],
    {rate:.13,pathRate:.025,ground:['co-dai-tg','co-dai-tg','co-hoa-tg','co-hoa-do-tg','da-vun-tg'],path:['da-vun-tg']}),
  'bac-chien-tg':d=>decorate(d,[
    // doanh trại phe ta: rào nhọn, giá binh khí, thùng, hòm, xe lương, vạc lửa, phướn xanh; phe địch tương tự phướn đỏ; dọc đường: đá, xương, xe hỏng
    ['rao-nhon-tg',1,32,{w:3}],['rao-nhon-tg',10,39,{w:2}],['gia-binh-khi-tg',3,35],['thung-go-tg',6,38,{n:2}],['hom-go-tg',2,37],['xe-luong-tg',10,33],['vac-lua-tg',6,35,{light:'#ff9040'}],['phuon-ta-tg',9,35],['phuon-ta-tg',1,34],['nguoi-rom-tg',12,37],
    ['rao-nhon-tg',39,10,{w:3}],['rao-nhon-tg',46,9],['gia-binh-khi-tg',40,5],['thung-go-tg',43,3,{n:2}],['hom-go-tg',39,4],['xe-luong-tg',36,8],['vac-lua-tg',42,6,{light:'#ff7040'}],['phuon-dich-tg',37,3],['phuon-dich-tg',45,3],
    ['xuong-tran-tg',20,22],['xuong-tran-tg',27,16],['xuong-tran-tg',33,13],['xe-luong-tg',17,22],['da-tang-tg',23,17],['da-tang-tg',30,10],['thung-go-tg',25,22],['hom-go-tg',31,18],['phuon-ta-tg',14,28],['phuon-dich-tg',34,10]],
    {rate:.12,pathRate:.05,ground:['co-dai-tg','co-dai-tg','co-hoa-tg','da-vun-tg','da-vun-tg'],path:['da-vun-tg','da-vun-tg','da-vun-tg','xuong-tran-tg']}),
  'the-gioi-tg':d=>decorate(d,[
    ['rao-nhon-tg',1,37,{w:2}],['rao-nhon-tg',8,37,{w:2}],['gia-binh-khi-tg',3,38],['gia-binh-khi-tg',6,42],['thung-go-tg',1,41,{n:2}],['hom-go-tg',7,40],['xe-luong-tg',14,40],['vac-lua-tg',4,37,{light:'#ff9040'}],['phuon-ta-tg',7,38],['phuon-ta-tg',13,35],['nguoi-rom-tg',2,42],
    ['rao-nhon-tg',42,12,{w:3}],['rao-nhon-tg',52,10,{w:2}],['gia-binh-khi-tg',49,4],['thung-go-tg',52,6,{n:2}],['hom-go-tg',45,3],['xe-luong-tg',53,12],['vac-lua-tg',48,2,{light:'#ff7040'}],['phuon-dich-tg',44,9],['phuon-dich-tg',50,8],
    // giữa bản đồ: tàn tích trận cũ giữa các đường
    ['xuong-tran-tg',16,14],['xuong-tran-tg',38,24],['xuong-tran-tg',24,32],['xuong-tran-tg',40,16],['xe-luong-tg',18,24],['xe-luong-tg',36,31],['da-tang-tg',22,10],['da-tang-tg',33,34],['da-tang-tg',42,26],['da-tang-tg',12,18],
    ['thung-go-tg',20,30],['hom-go-tg',34,12],['phuon-ta-tg',9,25],['phuon-ta-tg',22,36],['phuon-dich-tg',33,7],['phuon-dich-tg',47,30],['vac-lua-tg',27,27,{light:'#ff9040'}],['vac-lua-tg',17,7,{light:'#ff9040'}],['vac-lua-tg',45,36,{light:'#ff9040'}]],
    {rate:.11,pathRate:.04,ground:['co-dai-tg','co-dai-tg','co-hoa-tg','co-hoa-do-tg','da-vun-tg'],path:['da-vun-tg']})};
for(const d of [loiDai(),bacChien(),theGioi()]){
  const nd=DECO[d.id]?DECO[d.id](d):0;if(nd)console.log('  trang trí',d.id,nd);
  fs.writeFileSync(path.join(root,'maps',d.id+'.json'),JSON.stringify(d,null,1)+'\n');
  fs.writeFileSync(path.join(root,'maps',d.id+'.art.js'),`/* ${d.name} · sinh bởi tools/sukien-maps.mjs (bản đồ sự kiện thế giới) */\nK=>LH_ART.gen(${JSON.stringify(ART)})\n`);
  console.log('Đã sinh',d.id,d.objects.length,'vật',d.trees.length,'cây');
}
