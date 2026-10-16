// Đóng gói: node tools/build.mjs
//   dist/lu-hanh.css, dist/lu-hanh.js  → nạp qua jsDelivr trên Blogspot
//   dist/lu-hanh.html                   → bản một file (giống file trong Google Doc), mở thẳng để chơi thử ngoại tuyến
//   apps-script/Code.gs                 → dán vào Apps Script
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const rd=f=>fs.readFileSync(path.join(root,f),'utf8'),wr=(f,s)=>{fs.writeFileSync(path.join(root,f),s);console.log(f.padEnd(24),s.length);};
const V=rd('VERSION').trim();
const JS=['01-data.js','02-core.js','03-net.js','04-world.js','05-player.js','06-game.js','07-ui.js','08-portal.js'];
// CSS: gắn mọi luật vào #lu-hanh để giao diện Blogspot không đè được (nút, chữ, ô nhập)
function scope(src){
  src=src.replace(/\/\*[\s\S]*?\*\//g,'');let out='',i=0;
  const pre=sel=>sel.split(',').map(x=>{x=x.trim();if(!x)return x;if(x===':root'||x==='body'||x==='html')return '#lu-hanh';if(x==='*')return '#lu-hanh *';if(/^(body|html)[.:#]/.test(x))return x.replace(/^(body|html)/,'#lu-hanh');return '#lu-hanh '+x;}).join(',');
  function block(){ // đọc tới dấu } khớp
    let d=0,st=i;for(;i<src.length;i++){if(src[i]==='{')d++;else if(src[i]==='}'){d--;if(d===0){i++;break;}}}return src.slice(st,i);
  }
  while(i<src.length){
    const b=src.indexOf('{',i);if(b<0)break;
    const head=src.slice(i,b).trim();
    if(head.startsWith('@media')||head.startsWith('@supports')){i=b;const inner=block();out+=head+'{'+scope(inner.slice(1,-1))+'}\n';}
    else if(head.startsWith('@')){i=b;out+=head+block()+'\n';}
    else{i=b;out+=pre(head)+block()+'\n';}
  }
  return out;
}
const ROOT='#lu-hanh{position:fixed;inset:0;z-index:2147483000;overflow:hidden;text-align:left;line-height:normal}\nbody:has(#lu-hanh){overflow:hidden!important}\n';
// JS: đổi các ký hiệu không phải chữ (· – — × → ★ …) thành \uXXXX để Blogspot không biến thành &#183;
const safe=t=>t.replace(/[^\x00-\x7f]/gu,ch=>/[\p{L}\p{M}\p{N}]/u.test(ch)?ch:'\\u{'+ch.codePointAt(0).toString(16)+'}');
const css=ROOT+scope(rd('src/style.css')),body=rd('src/body.html').replaceAll('{{VERSION}}',V),js=JS.map(f=>safe(rd('src/'+f)));
const banner=`/*! Lữ Hành ${V} · Làng Thanh Mộc · https://github.com/vnthudao-source/lu-hanh */\n`;
wr('dist/lu-hanh.css',banner+css);
const inject=`(function(){if(document.getElementById('portal'))return;document.body.insertAdjacentHTML('beforeend',${safe(JSON.stringify(body))});})();\n`;
wr('dist/lu-hanh.js',banner+inject+js.map(s=>';'+s).join('\n'));
const head=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="game-version" content="${V}"><title>Lữ Hành ${V} · Làng Thanh Mộc</title>`;
wr('dist/lu-hanh.html',`${head}<style>\n${css}</style></head><body>\n${body}${js.map(s=>`<script>\n${s}</script>\n`).join('')}</body></html>\n`);
// Code.gs
const ctx={};vm.runInNewContext(rd('src/01-data.js')+';this.GD=GAME_DATA;',ctx);
const ids=JSON.parse(rd('apps-script/sheet-ids.json'));
const table=Object.fromEntries(Object.entries(ctx.GD).map(([k,rows])=>{const h=Object.keys(rows[0]);return [k,[h,...rows.map(r=>h.map(c=>r[c]))]];}));
wr('apps-script/Code.gs',rd('apps-script/gs-adapter.js').replace('@@IDS@@',JSON.stringify(ids,null,1))+
  '\n// Dữ liệu mặc định (dùng khi tab Sheet còn trống và để chạy caiDat)\nconst LH_DEFAULT=(d=>Object.fromEntries(Object.entries(d).map(([k,[h,...rows]])=>[k,rows.map(r=>Object.fromEntries(h.map((c,i)=>[c,r[i]])))])))('+JSON.stringify(table)+');\n\n'+rd('src/02-core.js'));
