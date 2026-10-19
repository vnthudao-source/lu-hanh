/* Cân bằng toàn bộ (v10.35): máu, sát thương, thủ, kinh nghiệm của mọi quái và kinh nghiệm thưởng nhiệm vụ, theo cấp vùng 1–999.
   Chạy: node tools/canbang.mjs [--bang]  → ghi src/01-data-canbang.js (ghi đè cột mau, sat_thuong, kinh_nghiem, thu của GAME_DATA.quai
   và thuong_kinh_nghiem của nhiệm vụ săn / hạ trùm / cốt truyện). --bang in bảng tóm tắt từng vùng.
   Trên Sheet: chạy capNhatV1035() để chép các số này vào tab quai và nhiem_vu.

   Mô hình (tham khảo Mu Online / Diablo):
   - Người chơi chuẩn cấp L: điểm cộng 50% Sức mạnh · 30% Sức khỏe · 20% Nhanh nhẹn. Đồ: tới cấp 300 là đồ cửa hàng tốt nhất đã mở,
     từ 300 trở lên là đồ rơi bậc ≈ 0,9 × L (phẩm chất Hoàn hảo). Cường hóa +0 → +12 theo cấp. Không tính sách, thú cưỡi, lính (phần thưởng thêm cho người chơi).
   - Thủ kiểu Diablo: phần sát thương còn lại = K·cấp kẻ đánh / (thủ + K·cấp kẻ đánh) (cau_hinh thu_he_so). Quái thường thủ = 0,5·K·cấp (giảm 33% đòn người chơi cùng cấp),
     trùm 0,8·K·cấp (giảm 44%).
   - Quái thường vùng cấp Lv: người chơi chuẩn cấp Lv hạ trong T.ttk giây, bị đánh liên tục trụ T.live giây. Trùm: người chơi cấp Lv+10 (trùm thế giới +30).
   - Kinh nghiệm: cần để lên cấp L = exp_goc × L^(exp_tang/100). Thời gian chơi tới cấp L = T.hours × (L/999)^T.curve giờ (cấp càng cao một cấp càng lâu).
     Mỗi con quái thường cho số kinh nghiệm để người chơi đánh T.kph con / giờ lên cấp đúng nhịp ở giữa dải cấp của vùng. */
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
export const T={ttk:5,live:40,bossTtk:50,bossLive:55,boss2Ttk:80,boss2Live:75,finalTtk:180,finalLive:150,hours:3000,curve:2,kph:360,clip:[.6,1.8],
  thuThuong:.5,thuTrum:.8,expBoss:15,expBoss2:30,expFinal:80,questHunt:.35,questBoss:1.5,questStory:240,questStoryCu:120}; // v10.39: việc Tìm con ≈ 40 phút săn ở vùng đó (240 con), tiền ≈ 120 con
const ctx={console,Math};vm.createContext(ctx);
vm.runInContext(['src/01-data.js','src/01-data-vung.js','src/05-player.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join(';\n')+';this.G=GAME_DATA;this.PL=Player;',ctx);
const G=ctx.G,P=ctx.PL;
for(const k of ['quai_nhan_mau','quai_nhan_sat_thuong','boss_nhan','quai_nhan_kinh_nghiem']){const r=G.cau_hinh.find(x=>x.khoa===k);if(r)r.gia_tri=1;}
P.load(G);
const W=P.WEAPONS,num=v=>Number(v)||0,CFG=P.CFG,K=num(CFG.thu_he_so)||2;
export const expNeed=L=>Math.round(num(CFG.exp_goc||60)*Math.pow(Math.max(1,L),num(CFG.exp_tang||250)/100));
export const hoursAt=L=>T.hours*Math.pow(Math.max(0,L)/999,T.curve);
let seed=12345;const rng=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const dpsOf=D=>{const S=D.tot,lo=S.dmgMin,hi=Math.max(lo,S.dmgMax),acc=Math.min(100,S.acc)/100,avg=acc*hi+(1-acc)*(lo+hi)/2,crit=1+Math.min(.3,S.crit3/100)*2+Math.min(.6,S.crit2/100),q=1+Math.min(1,S.mythDmg/100)*2+Math.min(1,S.legDmg/100)+Math.min(1,S.perfDmg/100)*.5,w=W.sword||{dmg:1.15,dur:.42};
  return (avg*w.dmg*D.dmgMul*crit*q+num(S.trueDmg))/(w.dur/(1+S.atkSpd/100)+.15)*1.15;}; // +0,15 giây nghỉ giữa đòn, ×1,15 kỹ năng
const takeK=(D,dt,Lm)=>{const S=D.tot,red={hoan_hao:S.perfRed,huyen_thoai:S.legRed,than:S.mythRed}[dt]||0;return P.armorMul(S.def,Lm)*(1-S.dmgRed/100)*(1-red/100)*(1-Math.min(.5,S.dodge/100))*(1-Math.min(.6,S.block/100)*.8);};
const shopLv=k=>{const m=k.match(/^thanh-(.+?)(?:-ren|-thu|-sach)?$/);return m?P.mapLevel(m[1]):1;};
function bestGear(L){const best={},cap=Math.min(L,300);
  for(const [k,rows] of Object.entries(P.SHOPS)){const sl=shopLv(k);if(sl>cap)continue;for(const r of rows){const d=P.items[r.id];if(!d||!d.slot||['cos','book','mount','quest'].includes(d.slot)||d.ruby||d.set||(d.gender&&d.gender!=='m'))continue;
    const slot=d.slot==='hand'?(d.kind==='shield'?'left':'right'):d.slot;if(slot==='right'&&d.grip==='two')continue;const t=L>300?0:num(r.bac)||sl,v=((d.atk||0)*2+(d.def||0))*P.tierBase(t);if(!best[slot]||v>best[slot].v)best[slot]={v,id:r.id,t};}}
  const q=L<15?'g':'p',lv=L<15?0:L<60?3:L<170?6:L<450?9:L<750?12:15,t=L>300?Math.round(L*.9):null;
  return Object.entries(best).map(([slot,b])=>[slot,b.id,q,lv,t||b.t]);}
function hero(L){const s=P.create({name:'H',gender:'m'});s.level=L;const pts=num(CFG.diem_khoi_tao||50)+(L-1)*num(CFG.diem_moi_cap||5);
  s.stats={strength:0,agility:0,vitality:0,intelligence:0,command:10};s.alloc={strength:Math.round(pts*.5),vitality:Math.round(pts*.3),agility:Math.round(pts*.2),intelligence:0,command:0};
  for(const k of Object.keys(s.equipment))s.equipment[k]=null;seed=777+L;for(const [slot,id,q,lv,t] of bestGear(L)){const it=P.roll(id,q,rng,t);it.lv=lv;s.equipment[slot]=it;}return s;}
const REF={};export const ref=L=>{L=Math.max(1,Math.min(999,Math.round(L)));if(!REF[L]){const s=hero(L),D=P.derive(s);REF[L]={s,D,dps:dpsOf(D),hp:D.tot.hp};}return REF[L];};
const rawDmg=(D,M,live,Lm,skillK=1)=>{const heal=1+Math.min(.2,D.tot.fullHeal/100)*Math.max(1,live/num(CFG.hoi_day_giay||10))*.5,per=(M.cd+M.windup),crit=1+num(M.crit)/100;return D.tot.hp*heal/live*per/(takeK(D,M.dtype,Lm)*crit*skillK);};
const REG=P.REGIONS.map(r=>({id:r.id,lv:P.mapLevel(r.id)})).sort((a,b)=>a.lv-b.lv),nextLv=id=>{const i=REG.findIndex(r=>r.id===id);return i>=0&&i<REG.length-1?REG[i+1].lv:Math.max(P.maxLevel(),REG[REG.length-1].lv+1);};
// kinh nghiệm mỗi con quái thường của vùng [lo, hi): người chơi ở giữa dải lên một cấp đúng thời gian theo đường cong
export const expFor=(lo,hi)=>{const L=Math.max(1,Math.round((lo+Math.max(lo+1,hi))/2)),dh=Math.max(1e-4,hoursAt(L+1)-hoursAt(L));return expNeed(L)/(dh*T.kph);};
const out={},rows=G.quai;const byReg={};for(const r of rows){const reg=P.regionOf(r.id);(byReg[reg]=byReg[reg]||[]).push(r);}
const med=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];const clip=v=>Math.max(T.clip[0],Math.min(T.clip[1],v));
const FINAL={'hac-thien-ma':1,'hon-nguyen-ma-to':1};
for(const [reg,list] of Object.entries(byReg)){const Lv=P.mapLevel(reg),Ln=nextLv(reg),normals=list.filter(r=>!num(r.boss)),mh=med(normals.map(r=>num(r.mau))||[1]),md=med(normals.map(r=>num(r.sat_thuong))||[1]),mx=med(normals.map(r=>num(r.kinh_nghiem)||1)||[1]);
  for(const r of list){const M=P.MON[r.id];let hp,dmg,exp,thu;
    if(FINAL[r.id]){const R=ref(Math.min(999,Lv+30));thu=T.thuTrum*K*Lv;hp=R.dps*P.armorMul(thu,R.s.level)*T.finalTtk;dmg=rawDmg(R.D,M,T.finalLive,Lv,1.5);exp=expFor(Lv,Ln)*T.expFinal;}
    else if(num(r.boss)){const k2=num(r.boss)>=2,R=ref(Math.min(999,Lv+(k2?30:10)));thu=T.thuTrum*K*Lv;hp=R.dps*P.armorMul(thu,R.s.level)*(k2?T.boss2Ttk:T.bossTtk);dmg=rawDmg(R.D,M,k2?T.boss2Live:T.bossLive,Lv,1.4);exp=expFor(Lv,Ln)*(k2?T.expBoss2:T.expBoss);}
    else{const R=ref(Lv),fh=normals.length>1?clip(num(r.mau)/mh):1,fd=normals.length>1?clip(num(r.sat_thuong)/md):1;thu=T.thuThuong*K*Lv;hp=R.dps*P.armorMul(thu,Lv)*T.ttk*fh;dmg=rawDmg(R.D,M,T.live/fd,Lv);exp=expFor(Lv,Ln)*Math.sqrt(fh*fd);}
    out[r.id]=[Math.max(1,Math.round(hp)),Math.max(1,Math.round(dmg)),Math.max(1,Math.round(exp)),Math.round(thu)];}}
// nhiệm vụ: săn quái ≈ T.questHunt cấp, hạ trùm ≈ T.questBoss cấp (theo cấp vùng của quái mục tiêu); cốt truyện Tìm con ≈ 2 cấp
const nv={},tc={};for(const q of G.nhiem_vu||[]){if(num(q.truyen)){const reg=P.regionOf(q.muc_tieu),Lv=P.mapLevel(reg),ns=(byReg[reg]||[]).filter(r=>!num(r.boss));nv[q.id]=Math.max(1,Math.round(expFor(Lv,nextLv(reg))*T.questStory));const cu=(ns.length?med(ns.map(r=>num(r.dong))):Lv*10)*(num(CFG.quai_nhan_tien)||1),cap=num(CFG.quai_tien_toi_da);tc[q.id]=Math.max(100,Math.round((cap>0?Math.min(cap,cu):cu)*T.questStoryCu/100)*100);continue;}
  const M=P.MON[q.muc_tieu];if(!M)continue;const L=P.mapLevel(P.regionOf(q.muc_tieu));const k=q.truyen?2:num(M.boss)?T.questBoss:T.questHunt*Math.max(1,num(q.so_luong))/6;nv[q.id]=Math.max(1,Math.round(expNeed(L)*k));}
const head='/* Sinh bởi tools/canbang.mjs (v10.35): máu, sát thương, kinh nghiệm, thủ mọi quái theo cấp vùng 1–999; kinh nghiệm thưởng nhiệm vụ. Đừng sửa tay — sửa bảng T trong tools/canbang.mjs rồi chạy lại.\n   Trên Sheet: chạy capNhatV1035() một lần để chép các số này vào tab quai (mau, sat_thuong, kinh_nghiem, thu) và nhiem_vu (thuong_kinh_nghiem). */\n';
fs.writeFileSync(path.join(root,'src/01-data-canbang.js'),head+'const LH_CAN_BANG='+JSON.stringify(out)+',LH_CAN_BANG_NV='+JSON.stringify(nv)+',LH_CAN_BANG_TC='+JSON.stringify(tc)+';\nfor(const r of GAME_DATA.quai){const v=LH_CAN_BANG[r.id];if(v){r.mau=v[0];r.sat_thuong=v[1];r.kinh_nghiem=v[2];r.thu=v[3];}}\nfor(const r of GAME_DATA.nhiem_vu||[]){const v=LH_CAN_BANG_NV[r.id];if(v)r.thuong_kinh_nghiem=v;const c=LH_CAN_BANG_TC[r.id];if(c)r.thuong_dong=c;}\n');
if(process.argv.includes('--bang')){
  for(const R0 of REG){const L=R0.lv,Rf=ref(L),list=byReg[R0.id]||[];const n=list.filter(r=>!num(r.boss)).map(r=>r.id),b=list.filter(r=>num(r.boss)).map(r=>r.id);
    console.log(R0.id.padEnd(16),'lv',String(L).padStart(3),'| người chơi máu',String(Rf.hp).padStart(6),'dps',String(Math.round(Rf.dps)).padStart(7),'| quái',n.slice(0,2).map(id=>id+' '+out[id].slice(0,4).join('/')).join(' · '),'| trùm',b.map(id=>id+' '+out[id].slice(0,3).join('/')).join(' · '));}
}
console.log('Đã ghi src/01-data-canbang.js:',Object.keys(out).length,'loài quái,',Object.keys(nv).length,'nhiệm vụ');
