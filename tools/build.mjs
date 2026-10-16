// Đóng gói: node tools/build.mjs
//   dist/lu-hanh.css, dist/lu-hanh.js  → nạp qua jsDelivr trên Blogspot
//   dist/lu-hanh.html                   → bản một file (giống file trong Google Doc), mở thẳng để chơi thử ngoại tuyến
//   apps-script/Code.gs                 → dán vào Apps Script
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const rd=f=>fs.readFileSync(path.join(root,f),'utf8'),wr=(f,s)=>{fs.writeFileSync(path.join(root,f),s);console.log(f.padEnd(24),s.length);};
const V=rd('VERSION').trim();
const JS=['01-data.js','02-core.js','03-net.js','04-world.js','05-player.js','06-game.js','07-ui.js','08-portal.js'];
const css=rd('src/style.css'),body=rd('src/body.html'),js=JS.map(f=>rd('src/'+f));
const banner=`/*! Lữ Hành ${V} · Làng Thanh Mộc · https://github.com/vnthudao-source/lu-hanh */\n`;
wr('dist/lu-hanh.css',banner+css);
const inject=`(function(){if(document.getElementById('portal'))return;var r=document.getElementById('lu-hanh')||document.body;r.insertAdjacentHTML('beforeend',${JSON.stringify(body)});})();\n`;
wr('dist/lu-hanh.js',banner+inject+js.map(s=>';'+s).join('\n'));
const head=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="game-version" content="${V}"><title>Lữ Hành ${V} · Làng Thanh Mộc</title>`;
wr('dist/lu-hanh.html',`${head}<style>\n${css}</style></head><body>\n${body}${js.map(s=>`<script>\n${s}</script>\n`).join('')}</body></html>\n`);
// Code.gs
const ctx={};vm.runInNewContext(rd('src/01-data.js')+';this.GD=GAME_DATA;',ctx);
const ids=JSON.parse(rd('apps-script/sheet-ids.json'));
const table=Object.fromEntries(Object.entries(ctx.GD).map(([k,rows])=>{const h=Object.keys(rows[0]);return [k,[h,...rows.map(r=>h.map(c=>r[c]))]];}));
wr('apps-script/Code.gs',rd('apps-script/gs-adapter.js').replace('@@IDS@@',JSON.stringify(ids,null,1))+
  '\n// Dữ liệu mặc định (dùng khi tab Sheet còn trống và để chạy caiDat)\nconst LH_DEFAULT=(d=>Object.fromEntries(Object.entries(d).map(([k,[h,...rows]])=>[k,rows.map(r=>Object.fromEntries(h.map((c,i)=>[c,r[i]])))])))('+JSON.stringify(table)+');\n\n'+rd('src/02-core.js'));
