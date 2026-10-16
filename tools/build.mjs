// Đóng gói: node tools/build.mjs
//   dist/lu-hanh.css, dist/lu-hanh.js      → game, nạp qua jsDelivr trên Blogspot
//   dist/lu-hanh.html                       → game một file (giống file trong Google Doc), mở thẳng để chơi thử ngoại tuyến
//   dist/cho-phien.css, dist/cho-phien.js   → trang Chợ phiên (trang Blogspot riêng)
//   dist/cho-phien.html                     → Chợ phiên một file để thử ngoại tuyến
//   apps-script/Code.gs                     → dán vào Apps Script (máy chủ chung cho game và Chợ phiên)
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const rd=f=>fs.readFileSync(path.join(root,f),'utf8'),wr=(f,s)=>{fs.writeFileSync(path.join(root,f),s);console.log(f.padEnd(24),s.length);};
const V=rd('VERSION').trim();
const GAME=['01-data.js','02-core.js','03-net.js','04-world.js','05-player.js','06-game.js','07-ui.js','08-portal.js'];
const CHO=['01-data.js','02-core.js','03-net.js','05-player.js','cho/cho.js'];
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
const page=(title,css,body,js)=>`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="game-version" content="${V}"><title>${title}</title><style>\n${css}</style></head><body>\n${body}${js.map(s=>`<script>\n${s}</script>\n`).join('')}</body></html>\n`;
// ---- game
const body=rd('src/body.html').replaceAll('{{VERSION}}',V),css=rootCss('#lu-hanh','hidden')+scope(rd('src/style.css'),'#lu-hanh'),js=GAME.map(f=>safe(rd('src/'+f)));
wr('dist/lu-hanh.css',banner('Làng Thanh Mộc')+css);
wr('dist/lu-hanh.js',banner('Làng Thanh Mộc')+inject(body,'portal')+js.map(s=>';'+s).join('\n'));
wr('dist/lu-hanh.html',page(`Lữ Hành ${V} · Làng Thanh Mộc`,css,body,js));
// ---- Chợ phiên (dùng chung bộ biểu tượng của game)
const sprite=body.match(/<svg style="position:absolute;width:0[\s\S]*?<\/svg>/)[0];
const choBody=rd('src/cho/body.html').replace('<div id="cho-phien">','<div id="cho-phien">\n'+sprite),choCss=rootCss('#cho-phien','auto')+scope(rd('src/cho/cho.css'),'#cho-phien'),choJs=CHO.map(f=>safe(rd('src/'+f)));
wr('dist/cho-phien.css',banner('Chợ phiên')+choCss);
wr('dist/cho-phien.js',banner('Chợ phiên')+inject(choBody,'chBody')+choJs.map(s=>';'+s).join('\n'));
wr('dist/cho-phien.html',page(`Chợ phiên · Lữ Hành ${V}`,choCss,choBody,choJs));
// ---- đoạn dán vào Blogspot
const cdn=`https://cdn.jsdelivr.net/gh/vnthudao-source/lu-hanh@ban-${V.replace(/^v/,'')}/dist/`;
const cfg=`<script>window.LH_API='';/* URL Web App (đuôi /exec) của Apps Script; để trống = chơi thử ngoại tuyến */window.LH_CHO='https://ikynagame.blogspot.com/p/cho-phien.html';window.LH_GAME='https://ikynagame.blogspot.com/';</script>`;
wr('blogspot/nhung-vao-blogspot.html',`<!-- Lữ Hành ${V} · trang GAME: dán vào bài/trang Blogspot (chế độ HTML). Bản mới: đổi số sau @ban- ở 2 chỗ. -->\n<link rel="stylesheet" href="${cdn}lu-hanh.css">\n${cfg}\n<script charset="utf-8" src="${cdn}lu-hanh.js"></script>\n`);
wr('blogspot/cho-phien.html',`<!-- Lữ Hành ${V} · trang CHỢ PHIÊN: tạo Trang mới tên "cho-phien" trên Blogspot, dán vào (chế độ HTML). -->\n<link rel="stylesheet" href="${cdn}cho-phien.css">\n${cfg}\n<script charset="utf-8" src="${cdn}cho-phien.js"></script>\n`);
// ---- Code.gs
const ctx={};vm.runInNewContext(rd('src/01-data.js')+';this.GD=GAME_DATA;',ctx);
const ids=JSON.parse(rd('apps-script/sheet-ids.json'));
const table=Object.fromEntries(Object.entries(ctx.GD).map(([k,rows])=>{const h=Object.keys(rows[0]);return [k,[h,...rows.map(r=>h.map(c=>r[c]))]];}));
wr('apps-script/Code.gs',rd('apps-script/gs-adapter.js').replace('@@IDS@@',JSON.stringify(ids,null,1))+
  '\n// Dữ liệu mặc định (dùng khi tab Sheet còn trống và để chạy caiDat)\nconst LH_DEFAULT=(d=>Object.fromEntries(Object.entries(d).map(([k,[h,...rows]])=>[k,rows.map(r=>Object.fromEntries(h.map((c,i)=>[c,r[i]])))])))('+JSON.stringify(table)+');\n\n'+rd('src/02-core.js')+'\n'+rd('src/05-player.js'));
