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
const ART={theme:{'loi-dai-tg':{g:['#8a7a5a','#706244'],d:'brick',r:['#9a8468','#6a5844','#3a3024'],w:['#5a8aa0','#3a6a80'],p:'#c0a878',sd:'#a89070'}},
  sky:{'loi-dai-tg':{n:18,col:'#ffd080',size:3,vx:6,vy:-8,glow:1,tint:'#40201010'}},
  obj:{'cot-loi-dai':{base:'pillar',c:['#b0a080','#6a2a1a']},'den-loi-dai':{base:'lantern',c:['#5a2a1a','#ff7040']},'co-loi-dai':{base:'flag',s:1.4,c:['#4a3220','#c02020','#ffd040']},
    'leu-loi-dai':{base:'tent',c:['#8a2a20','#4a3220']},'trong-loi-dai':{base:'drum',c:['#6a1a10','#e8d0a0','#e0b040']}}};
for(const d of [loiDai()]){
  fs.writeFileSync(path.join(root,'maps',d.id+'.json'),JSON.stringify(d,null,1)+'\n');
  fs.writeFileSync(path.join(root,'maps',d.id+'.art.js'),`/* ${d.name} · sinh bởi tools/sukien-maps.mjs (bản đồ sự kiện thế giới) */\nK=>LH_ART.gen(${JSON.stringify(ART)})\n`);
  console.log('Đã sinh',d.id,d.objects.length,'vật',d.trees.length,'cây');
}
