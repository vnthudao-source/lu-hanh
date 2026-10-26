// Gom mọi đoạn chữ tiếng Việt người chơi nhìn thấy → tools/i18n/vi-segments.json
//   node tools/i18n-extract.mjs
// Đoạn chữ = phần chữ giữa các thẻ HTML / biến ${...} trong chuỗi của mã nguồn và bản đồ.
// Bỏ qua: ghi chú cho chủ game (ghi_chu, goi_y, note), console.*, khóa của object.
import fs from 'node:fs';import path from 'node:path';
import {parse} from './vendor/terser/lib/parse.js';
import {TreeWalker,AST_String,AST_TemplateSegment,AST_ObjectKeyVal,AST_Call,AST_Dot,AST_SymbolRef,AST_Sub,AST_RegExp} from './vendor/terser/lib/ast.js';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const rd=f=>fs.readFileSync(path.join(root,f),'utf8');
const VI=/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const SKIP_KEYS=new Set(['ghi_chu','goi_y','note','gioi_tinh','dung_o']);
const ENT={'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&middot;':'·'};
const seg=new Map(); // đoạn → {n, files:Set}
function add(raw,file){
  if(!VI.test(raw))return;
  let s=raw.replace(/&[a-z#0-9]+;/gi,m=>ENT[m.toLowerCase()]??' ');
  // tách theo thẻ HTML, xuống dòng
  for(let part of s.split(/<[^>]*>|\n|\{\w+\}/)){
    // bỏ dấu câu / ký hiệu / số ở hai đầu
    part=part.replace(/^[\s\d.,:;!?·•–—\-+×x%()[\]{}"'“”‘’/\\|*#@=<>~^$€→←↑↓★☆♥✦…]+/u,'').replace(/[\s\d.,:;!?·•–—\-+×%()[\]{}"'“”‘’/\\|*#@=<>~^$€→←↑↓★☆♥✦…]+$/u,'');
    if(!part||!VI.test(part)||part.length>400)continue;
    const e=seg.get(part)||{n:0,files:new Set()};e.n++;e.files.add(file);seg.set(part,e);
  }
}
function fromJs(file){
  const src=rd(file).replace(/@@\w+@@/g,'0');let ast;
  try{ast=parse(src,{module:false});}catch(e){console.error('Không đọc được',file,e.message);return;}
  const skipNodes=new Set();
  ast.walk(new TreeWalker(node=>{
    if(node instanceof AST_ObjectKeyVal&&SKIP_KEYS.has(String(node.key)))skipNodes.add(node.value);
    if(node instanceof AST_Call&&node.expression instanceof AST_Dot&&node.expression.expression instanceof AST_SymbolRef&&node.expression.expression.name==='console')node.args.forEach(a=>skipNodes.add(a));
  }));
  ast.walk(new TreeWalker(node=>{
    if(skipNodes.has(node))return true;
    if(node instanceof AST_RegExp)return true;
    if(node instanceof AST_String)add(node.value,file);
    else if(node instanceof AST_TemplateSegment)add(node.value,file);
  }));
}
function fromJson(file){
  const walk=(o,k)=>{if(Array.isArray(o))o.forEach(x=>walk(x,k));else if(o&&typeof o==='object')for(const [a,b] of Object.entries(o))walk(b,a);else if(typeof o==='string'&&!SKIP_KEYS.has(k))add(o,file);};
  walk(JSON.parse(rd(file)),'');
}
const SRC=fs.readdirSync(path.join(root,'src')).filter(f=>f.endsWith('.js')&&f!=='04-looks.js').map(f=>'src/'+f);
for(const f of SRC)fromJs(f);
fromJs('apps-script/gs-adapter.js');
for(const f of fs.readdirSync(path.join(root,'maps')))if(f.endsWith('.json'))fromJson('maps/'+f);else if(f.endsWith('.art.js'))fromJs('maps/'+f);
add(rd('src/body.html'),'src/body.html');
fs.mkdirSync(path.join(root,'tools/i18n'),{recursive:true});
const out=[...seg.entries()].sort((a,b)=>a[0].localeCompare(b[0],'vi')).map(([s,e])=>({vi:s,n:e.n,f:[...e.files].map(x=>x.replace(/^(src|maps|apps-script)\//,'')).join(',')}));
fs.writeFileSync(path.join(root,'tools/i18n/vi-segments.json'),JSON.stringify(out,null,0).replace(/\},\{/g,'},\n{'));
console.log('Đoạn chữ:',out.length,'· ký tự:',out.reduce((a,x)=>a+x.vi.length,0));
