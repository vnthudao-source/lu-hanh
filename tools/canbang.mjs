/* Cân bằng quái (v10.19): tính máu, sát thương, kinh nghiệm của mọi quái theo cấp vùng, dựa trên sức mạnh "người chơi chuẩn" ở cấp đó.
   Chạy: node tools/canbang.mjs  → ghi src/01-data-canbang.js (ghi đè cột mau, sat_thuong, kinh_nghiem của GAME_DATA.quai).
   Mục tiêu (sửa ở bảng T bên dưới rồi chạy lại):
   - Người chơi chuẩn cấp L: điểm cộng 50% Sức mạnh · 35% Sức khỏe · 15% Nhanh nhẹn, đồ cửa hàng tốt nhất đã mở tới cấp L, cường hóa +6.
   - Quái thường vùng cấp Lv: người chơi chuẩn cấp Lv hạ trong T.ttk giây, bị đánh liên tục thì trụ được T.live giây (giữ tỉ lệ mạnh / yếu giữa các loài trong vùng).
   - Boss vùng: người chơi chuẩn cấp Lv+10 hạ trong T.bossTtk giây, trụ T.bossLive giây.
   - Boss cuối Hắc Thiên Ma: người chơi cấp 400 mặc trọn bộ huyền thoại +15 (trung vị 30 bộ danh tướng) hạ trong T.finalTtk giây, trụ T.finalLive giây.
   - Kinh nghiệm: người chơi trung bình (T.killsPerHour con / giờ) lên cấp L sau T.hours × (L/400)^T.curve giờ chơi. */
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const T={ttk:4,live:45,bossTtk:45,bossLive:75,boss2Ttk:70,boss2Live:90,finalTtk:150,finalLive:170,hours:700,curve:1.35,killsPerHour:260,clip:[.6,1.8]};
const ctx={console,Math};vm.createContext(ctx);
vm.runInContext(['src/01-data.js','src/01-data-vung.js','src/05-player.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join(';\n')+';this.G=GAME_DATA;this.PL=Player;',ctx);
const G=ctx.G,P=ctx.PL;
// tính với hệ số quái = 1 (máu / sát thương / kinh nghiệm trên Sheet là số thật)
for(const k of ['quai_nhan_mau','quai_nhan_sat_thuong','boss_nhan','quai_nhan_kinh_nghiem']){const r=G.cau_hinh.find(x=>x.khoa===k);if(r)r.gia_tri=1;}
P.load(G);
const W=P.WEAPONS,num=v=>Number(v)||0;
const dpsOf=(D,st)=>{const S=D.tot,lo=S.dmgMin,hi=Math.max(lo,S.dmgMax),acc=Math.min(100,S.acc)/100,avg=acc*hi+(1-acc)*(lo+hi)/2,crit=1+Math.min(.3,S.crit3/100)*2+Math.min(.6,S.crit2/100),q=1+Math.min(1,S.mythDmg/100)*2+Math.min(1,S.legDmg/100),w=W[st.type]||{dmg:.55,dur:.32};return avg*w.dmg*D.dmgMul*crit*q*(1+(D.fx.aura||0)/100)/(w.dur/(1+S.atkSpd/100))*1.2;};
// phần sát thương quái còn lại sau thủ / giảm / né / đỡ, và số lần hồi đầy máu (Sức khỏe)
const takeK=(D,dt)=>{const S=D.tot,red={hoan_hao:S.perfRed,huyen_thoai:S.legRed,than:S.mythRed}[dt]||0;return 100/(100+S.def*4)*(1-S.dmgRed/100)*(1-red/100)*(1-Math.min(.5,S.dodge/100))*(1-Math.min(.6,S.block/100)*.8);};
const shopLv=k=>{const m=k.match(/^thanh-(.+?)(?:-ren|-thu|-sach)?$/);return m?P.mapLevel(m[1]):1;};
function shopGear(L,lv){const best={};for(const [k,rows] of Object.entries(P.SHOPS)){if(shopLv(k)>L)continue;for(const r of rows){const d=P.items[r.id];if(!d||!d.slot||['cos','book','mount'].includes(d.slot)||d.ruby||(d.gender&&d.gender!=='m'))continue;const q=d.q||'n',v=((d.atk||0)*2+(d.def||0))*P.RAR[q].mul;const slot=d.slot==='hand'?(d.kind==='shield'?'left':'right'):d.slot;if(slot==='right'&&d.grip==='two')continue;if(!best[slot]||v>best[slot].v)best[slot]={v,id:r.id,q};}}return Object.entries(best).map(([slot,b])=>[slot,b.id,b.q,lv]);}
function hero(L,gear){const s=P.create({name:'H',gender:'m'});s.level=L;const pts=(L-1)*num(P.CFG.diem_moi_cap||5);s.alloc={strength:Math.round(pts*.5),vitality:Math.round(pts*.35),agility:Math.round(pts*.15),intelligence:0,command:0};
  for(const k of Object.keys(s.equipment))s.equipment[k]=null;for(const [slot,id,q,lv] of gear){const it=P.roll(id,q||'n');it.lv=lv||0;s.equipment[slot]=it;}return P.derive(s);}
const setGear=(sid,lv)=>P.SETS[sid].pieces.map(id=>{const d=P.items[id];return [d.slot==='hand'?(/:left$/.test(id)?'left':'right'):d.slot,id,d.q||'l',lv];});
const REF={};const ref=L=>{L=Math.max(1,Math.min(999,Math.round(L)));if(!REF[L]){const D=hero(L,shopGear(L,L<20?0:6));REF[L]={D,dps:dpsOf(D,{type:'sword'}),hp:D.tot.hp};}return REF[L];};
// sát thương thô một đòn để người chơi D trụ được live giây (đòn mỗi cd+windup giây, chí mạng ×2 theo tỉ lệ)
const rawDmg=(D,M,live,skillK=1)=>{const heal=1+Math.min(.2,D.tot.fullHeal/100)*3,per=(M.cd+M.windup),crit=1+num(M.crit)/100;return D.tot.hp*heal/live*per/(takeK(D,M.dtype)*crit*skillK);};
const REG=P.REGIONS.map(r=>({id:r.id,lv:P.mapLevel(r.id)})).sort((a,b)=>a.lv-b.lv),nextLv=id=>{const i=REG.findIndex(r=>r.id===id);return i>=0&&i<REG.length-1?REG[i+1].lv:Math.max(400,P.maxLevel());};
const expNeed=L=>Math.round(num(P.CFG.exp_goc||60)*Math.pow(Math.max(1,L),num(P.CFG.exp_tang||150)/100));
const hoursAt=L=>T.hours*Math.pow(L/400,T.curve);
// kinh nghiệm mỗi con để ở giữa dải cấp của vùng, mỗi cấp mất đúng thời gian theo đường cong
const expFor=(lo,hi)=>{const L=Math.max(1,Math.round((lo+hi)/2)),dh=(hoursAt(L+1)-hoursAt(L));return expNeed(L)/(dh*T.killsPerHour);};
const out={},rows=G.quai;const byReg={};for(const r of rows){const reg=P.regionOf(r.id);(byReg[reg]=byReg[reg]||[]).push(r);}
const LEG=Object.keys(P.SETS).filter(k=>/^tq-/.test(k)),med=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];
for(const [reg,list] of Object.entries(byReg)){const Lv=P.mapLevel(reg),Ln=nextLv(reg),normals=list.filter(r=>!num(r.boss)),mh=med(normals.map(r=>num(r.mau))),md=med(normals.map(r=>num(r.sat_thuong))),mx=med(normals.map(r=>num(r.kinh_nghiem)||1));
  const clip=v=>Math.max(T.clip[0],Math.min(T.clip[1],v));
  for(const r of list){const M=P.MON[r.id];let hp,dmg,exp;
    if(r.id==='hac-thien-ma'||r.id==='hon-nguyen-ma-to'){const FL=r.id==='hac-thien-ma'?400:999;const Ds=LEG.map(sid=>hero(FL,setGear(sid,15))),dps=med(Ds.map(D=>dpsOf(D,{type:'sword'}))),D=Ds[Math.floor(Ds.length/2)];hp=dps*T.finalTtk;dmg=rawDmg(D,M,T.finalLive,1.5);exp=expFor(Lv,Math.max(Lv+1,FL))*40;}
    else if(num(r.boss)){const k2=num(r.boss)>=2,R=ref(Math.min(Lv>=400?999:400,Lv+(k2?30:10)));hp=R.dps*(k2?T.boss2Ttk:T.bossTtk);dmg=rawDmg(R.D,M,k2?T.boss2Live:T.bossLive,1.4);exp=expFor(Lv,Ln)*(k2?30:15);}
    else{const R=ref(Lv),fh=clip(num(r.mau)/mh),fd=clip(num(r.sat_thuong)/md),fx=clip((num(r.kinh_nghiem)||1)/mx);hp=R.dps*T.ttk*fh;dmg=rawDmg(R.D,M,T.live/fd);exp=expFor(Lv,Ln)*Math.sqrt(fh*fd);}
    out[r.id]=[Math.max(1,Math.round(hp)),Math.max(1,Math.round(dmg)),Math.max(1,Math.round(exp))];}}
// v10.34: giữ nguyên số đã cân của các loài cũ (đang dùng trên Sheet), chỉ tính thêm loài mới (10 vùng 400–999); muốn tính lại tất cả: node tools/canbang.mjs --all
if(!process.argv.includes('--all')){try{const c={GAME_DATA:{quai:[]}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'src/01-data-canbang.js'),'utf8')+';this.X=LH_CAN_BANG',c);for(const [k,v] of Object.entries(c.X))out[k]=v;}catch(e){}}
const head='/* Sinh bởi tools/canbang.mjs (v10.19): máu, sát thương, kinh nghiệm mọi quái theo cấp vùng. Đừng sửa tay — sửa bảng mục tiêu trong tools/canbang.mjs rồi chạy lại.\n   Trên Sheet: chạy capNhatV1019() một lần để chép các số này vào tab quai (cột mau, sat_thuong, kinh_nghiem). */\n';
fs.writeFileSync(path.join(root,'src/01-data-canbang.js'),head+'const LH_CAN_BANG='+JSON.stringify(out)+';\nfor(const r of GAME_DATA.quai){const v=LH_CAN_BANG[r.id];if(v){r.mau=v[0];r.sat_thuong=v[1];r.kinh_nghiem=v[2];}}\n');
// bảng tóm tắt
const show=['deer','chua-son-lam','moc-tinh','tuong-am-binh','hoa-long','hac-long-tuong','ma-vuong','hac-de','hac-thien-ma','hu-anh','hu-khong-vuong','tu-binh','nguyen-soai-ma','kiem-ma','minh-vuong','hon-nguyen-ve','hon-nguyen-ma-to'];
for(const k of show)if(out[k])console.log(k.padEnd(16),'lv',String(P.mapLevel(P.regionOf(k))).padStart(3),'máu',String(out[k][0]).padStart(9),'st',String(out[k][1]).padStart(7),'exp',String(out[k][2]).padStart(8));
console.log('Đã ghi src/01-data-canbang.js:',Object.keys(out).length,'loài quái');
