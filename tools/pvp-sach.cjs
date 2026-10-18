/* Mô phỏng PvP: hai nhân vật cùng cấp, cùng đồ, chia điểm đều; mỗi người 5 sách cùng một hệ.
   Đấu tay đôi theo sự kiện (đánh thường + Combo khi đủ mana), đủ hiệu ứng sách. In tỉ lệ thắng giữa các hệ.
   Chạy: node tools/pvp-sach.cjs [số trận mỗi cặp]   (dùng CFG hiện tại trong src/01-data.js) */
const fs=require('fs'),vm=require('vm'),path=require('path'),root=path.join(__dirname,'..');
const ctx={console,Math};vm.createContext(ctx);
vm.runInContext(['src/01-data.js','src/01-data-vung.js','src/01-data-canbang.js','src/05-player.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join(';\n')+';this.G=GAME_DATA;this.P=Player;',ctx);
const P=ctx.P;P.load(ctx.G);const OVR=process.env.CFG?JSON.parse(process.env.CFG):{};Object.assign(P.CFG,OVR);
const CFG=P.CFG,num=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const BOOK={fire:'book-fire',water:'book-water',earth:'book-earth',metal:'book-metal',wood:'book-wood',thunder:'book-loi',wind:'book-phong',ice:'book-bang',light:'book-sang'};
const EL=Object.keys(BOOK),NAME={fire:'Hỏa',water:'Thủy',earth:'Thổ',metal:'Kim',wood:'Mộc',thunder:'Lôi',wind:'Phong',ice:'Băng',light:'Ánh sáng'};
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
// đồ tốt nhất bán ở thành có cấp ≤ L (mỗi ô), phẩm chất q, cường hoá lv
const lvOf={};for(const k in P.SHOPS){const m=k.match(/^thanh-(.+?)(?:-ren|-thu|-sach)?$/);const L=m?P.mapLevel(m[1]):1;for(const r of P.SHOPS[k])lvOf[r.id]=Math.min(lvOf[r.id]??1e9,L);}
function gear(L,q,lv){const eq={},best={};
  for(const [id,d] of Object.entries(P.items)){if(!d.slot||['cos','book','mount','quest'].includes(d.slot)||d.set||d.ruby||d.gender)continue;if((lvOf[id]??1e9)>L)continue;
    const slot=d.slot==='hand'?(d.kind==='shield'?'left':(d.kind==='sword'?'right':null)):d.slot;if(!slot)continue;const v=(d.atk||0)*2+(d.def||0);if(!best[slot]||v>best[slot].v)best[slot]={id,v};}
  for(const [slot,b] of Object.entries(best)){const it=P.roll(b.id,q,rnd);it.lv=lv;eq[slot]=it;}return eq;}
function hero(L,el,q,lv,bookT){
  const s=P.create({name:'x',gender:'m'});s.level=L;const pts=num(CFG.diem_khoi_tao,50)+(L-1)*num(CFG.diem_moi_cap,5),each=Math.floor(pts/4);
  s.stats={strength:0,agility:0,vitality:0,intelligence:0,command:s.stats.command||10};for(const k of ['strength','agility','vitality','intelligence'])s.alloc[k]=each;
  const keep=seed;seed=99991+L*7+lv;Object.assign(s.equipment,gear(L,q,lv));   // cùng một bộ đồ cho mọi hệ

  for(let i=0;i<5;i++){const b=P.roll(BOOK[el],q,rnd);b.t=bookT;b.lv=lv;s.skillSlots[i]=b;}
  seed=keep;const D=P.derive(s);return {el,L,D,S:D.tot,B:D.bfx||{},bef:D.bef||{}};
}
// Xoay vòng kỹ năng như người chơi: Cao cấp → Trung cấp → Cơ bản → đánh thường (hồi chiêu giảm theo cdr từ Trí tuệ, tốn mana)
const SKL=[['advanced',28,10,.55,5,.75],['intermediate',18,6,1.2,1,1.15],['basic',10,3,.7,3,.85]],W={dur:.42,mana:.9,cd:1.1};
function duel(A,B){
  const st=[A,B].map(h=>({h,hp:h.S.hp,mp:h.S.mp,t:rnd()*.3,cd:{},stun:0,slow:0,morph:0,burn:null}));
  let time=0;
  for(let guard=0;guard<40000;guard++){
    const i=st[0].t<=st[1].t?0:1,a=st[i],d=st[1-i],dt=a.t-time;
    for(const x of st){x.hp=Math.min(x.h.S.hp,x.hp+(x.h.S.hpReg||0)*dt);x.mp=Math.min(x.h.S.mp,x.mp+(x.h.S.mpReg||0)*dt);if(x.burn&&time<x.burn.until)x.hp-=x.burn.dps*Math.min(dt,x.burn.until-time);}
    time=a.t;if(st[0].hp<=0||st[1].hp<=0||time>240)break;
    if(time<a.stun){a.t=a.stun;continue;}
    const S=a.h.S,spd=1+(S.atkSpd||0)/100;
    let sk=null;for(const k of SKL){const cost=Math.round(k[1]*W.mana);if((a.cd[k[0]]||0)<=time&&a.mp>=cost){sk=k;a.mp-=cost;a.cd[k[0]]=time+k[2]*(1-(S.cdr||0)/100)*W.cd;break;}}
    const [,,,dur,cyc,mul]=sk||[0,0,0,1,1,1];
    let gap=W.dur*dur*cyc/spd+.12;if(time<a.slow)gap*=1.3;a.t=time+Math.max(gap,sk?0:.45);
    for(let h=0;h<cyc;h++){
      const D=d.h.S;if(rnd()*100<D.dodge)continue;
      const lo=S.dmgMin,hi=Math.max(lo,S.dmgMax);let v=rnd()*100<S.acc?hi:lo+rnd()*(hi-lo);v*=mul*a.h.D.dmgMul*W.cd;
      if(sk&&sk[0]==='advanced'&&h===cyc-1)v*=2;
      const c=rnd()*100;if(c<S.crit3)v*=3;else if(c<S.crit3+S.crit2)v*=2;
      const q2=rnd()*100;if(q2<S.mythDmg)v*=3;else if(q2<S.mythDmg+S.legDmg)v*=2;else if(q2<S.mythDmg+S.legDmg+S.perfDmg)v*=1.5;
      if(time<a.morph)v*=num(CFG.phong_hoa_sat_thuong,2);
      if(a.h.B.shatter&&time<d.stun&&d.frz)v*=1+a.h.B.shatter/100;
      v+=S.trueDmg||0;
      const red=x=>{let y=x;if(rnd()*100<D.block)y*=.2;y*=P.armorMul(D.def,a.h.L);y*=1-(D.dmgRed||0)/100;return Math.max(1,y);};
      let dmg=red(v);const ms=d.h.D.fx.manaShield;if(ms){const part=Math.min(d.mp,dmg*ms/100);d.mp-=part;d.hp-=dmg-part;}else d.hp-=dmg;
      const ls=a.h.D.fx.lifesteal;if(ls)a.hp=Math.min(S.hp,a.hp+dmg*ls/100);
      const Bf=a.h.B;
      if(a.h.el==='fire'){const k=a.h.bef.fire||1;d.burn={dps:Math.max(1,dmg*.04*k),until:time+3};}
      if(Bf.thunder&&rnd()*100<Bf.thunder)d.hp-=red(v*num(CFG.loi_sat_thuong,150)/100);
      if(Bf.wind&&rnd()*100<Bf.wind)d.slow=time+num(CFG.phong_ms,3000)/1000;
      if(Bf.morph&&time>=a.morph&&rnd()*100<Bf.morph)a.morph=time+Bf.morphSec;
      if(Bf.ice&&rnd()*100<Bf.ice){d.stun=Math.max(d.stun,time+num(CFG.bang_ms,1800)/1000*.5);d.frz=1;}   // PvP: khống chế tính nửa thời gian
      if(d.h.B.light&&rnd()*100<d.h.B.light){a.stun=Math.max(a.stun,time+num(CFG.sang_ms,2500)/1000*.5);a.frz=0;}   // Ánh sáng: bị đánh trúng → kẻ đánh hoảng sợ
      if(D.reflect)a.hp-=dmg*D.reflect/100;
      if(D.fullHeal&&d.hp>0&&time>(d.fhAt||-99)&&rnd()*100<D.fullHeal){d.hp=D.hp;d.fhAt=time+num(CFG.hoi_day_giay,10);}
      if(st[0].hp<=0||st[1].hp<=0)break;
    }
    if(st[0].hp<=0||st[1].hp<=0)break;
  }
  if(st[0].hp<=0&&st[1].hp<=0)return .5;if(st[1].hp<=0)return 1;if(st[0].hp<=0)return 0;return st[0].hp/A.S.hp>st[1].hp/B.S.hp?1:0;
}
if(require.main!==module){module.exports={run:(cfg,N,cases)=>{Object.assign(CFG,cfg);seed=7;return runAll(N,cases);},EL,NAME};}
function runAll(N,cases){const score={};for(const e of EL)score[e]=0;for(const c of cases){const H={};for(const e of EL)H[e]=hero(c.L,e,c.q,c.lv,c.t);for(const a of EL)for(const b of EL){if(a>=b)continue;let w=0;for(let k=0;k<N;k++)w+=k%2?duel(H[a],H[b]):1-duel(H[b],H[a]);score[a]+=w/N;score[b]+=1-w/N;}}return Object.fromEntries(EL.map(e=>[e,score[e]/(cases.length*(EL.length-1))]));}
if(require.main===module){
const N=+process.argv[2]||60;
const CASES=[];for(const L of [60,170,290,400])for(const q of ['p','l','m'])for(const lv of [0,9,15])CASES.push({L,q,lv,t:L});
const score={},mat={};for(const e of EL){score[e]=0;mat[e]={};for(const f of EL)mat[e][f]=0;}
let games=0,builds=0;
for(const c of CASES){const H={};for(const e of EL)H[e]=hero(c.L,e,c.q,c.lv,c.t);builds+=EL.length;
  for(const a of EL)for(const b of EL){if(a>=b)continue;let w=0;for(let k=0;k<N;k++)w+=k%2?duel(H[a],H[b]):1-duel(H[b],H[a]);const r=w/N;mat[a][b]+=r;mat[b][a]+=1-r;score[a]+=r;score[b]+=1-r;games+=N;}}
const pairs=CASES.length,avg=e=>score[e]/(pairs*(EL.length-1));
console.log(`Trận: ${games} · build: ${builds} (${CASES.length} mốc cấp × phẩm chất × cường hoá, ${EL.length} hệ) · mỗi cặp ${N} trận`);
console.log('Tỉ lệ thắng trung bình:');for(const e of [...EL].sort((x,y)=>avg(y)-avg(x)))console.log('  '+NAME[e].padEnd(9),(avg(e)*100).toFixed(1)+'%');
console.log('\nBảng thắng hàng ↔ cột (%):');console.log('         '+EL.map(e=>NAME[e].slice(0,5).padStart(6)).join(''));
for(const a of EL)console.log(NAME[a].padEnd(9)+EL.map(b=>a===b?'     -':(mat[a][b]/pairs*100).toFixed(0).padStart(6)).join(''));
if(process.env.JSON)fs.writeFileSync(process.env.JSON,JSON.stringify({avg:Object.fromEntries(EL.map(e=>[e,avg(e)])),mat:Object.fromEntries(EL.map(a=>[a,Object.fromEntries(EL.map(b=>[b,a===b?.5:mat[a][b]/pairs]))]))}));
// chỉ số mẫu (cấp 290, Huyền thoại +9)
if(process.env.SHOW){const c={L:290,q:'l',lv:9,t:290};for(const e of EL){const h=hero(c.L,e,c.q,c.lv,c.t),S=h.S;console.log(NAME[e].padEnd(9),'máu',S.hp,'st',S.dmgMin+'-'+S.dmgMax,'thủ',S.def,'né',S.dodge,'phản',S.reflect,'giảm',S.dmgRed,'hồi',S.hpReg,'mana',S.mp,'+'+S.mpReg,'bfx',JSON.stringify(h.B),'mul',h.D.dmgMul.toFixed(2));}}
}
module.exports.dbg={hero,duel,CFG};
