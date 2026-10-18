// Chạy: node tools/mophong.cjs '{"runs":100,"budget":[5e6,10e6],"hpd":2}'  (budget: đồng nạp/năm, hpd: giờ chơi/ngày trung vị)
// Mô phỏng v10.19: người chơi từ cấp 1 tới khi hạ Hắc Thiên Ma, có nạp 5–10 triệu/năm (hồng ngọc theo tháng), chiêu mộ danh tướng lấy bộ đồ, cường hóa.
const vm=require('vm'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'..');
const OPT=Object.assign({runs:100,seed:1,budget:[5e6,10e6],hpd:2,tag:''},JSON.parse(process.argv[2]||'{}'));
const ctx={console,Math,Date};vm.createContext(ctx);
vm.runInContext(['src/01-data.js','src/01-data-vung.js','src/01-data-canbang.js','src/05-player.js'].map(f=>fs.readFileSync(path.join(ROOT,f),'utf8')).join(';\n')+';Player.load(GAME_DATA);this.P=Player;',ctx);
const P=ctx.P,MON=P.MON,CFG=P.CFG,W=P.WEAPONS,num=v=>Number(v)||0;
const MAPS={};for(const f of fs.readdirSync(path.join(ROOT,'maps')).filter(f=>f.endsWith('.json'))){const d=JSON.parse(fs.readFileSync(path.join(ROOT,'maps',f),'utf8'));const c={};for(const m of d.monsters||[])c[m.type]=(c[m.type]||0)+1;for(const cp of d.camps||[])for(const [k,n] of Object.entries(cp.mon||{}))c[k]=(c[k]||0)+n;MAPS[d.id]=c;}
const REG=P.REGIONS.map(r=>({id:r.id,lv:P.mapLevel(r.id)})).sort((a,b)=>a.lv-b.lv);
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const dpsOf=(D,st,sk)=>{const S=D.tot,lo=S.dmgMin,hi=Math.max(lo,S.dmgMax),acc=Math.min(100,S.acc)/100,avg=acc*hi+(1-acc)*(lo+hi)/2,crit=1+Math.min(.3,S.crit3/100)*2+Math.min(.6,S.crit2/100),q=1+Math.min(1,S.mythDmg/100)*2+Math.min(1,S.legDmg/100),w=W[st.type]||{dmg:.55,dur:.32};return avg*w.dmg*D.dmgMul*crit*q*(1+(D.fx.aura||0)/100)/(w.dur/(1+S.atkSpd/100))*sk;};
const takeK=(D,dt)=>{const S=D.tot,red={hoan_hao:S.perfRed,huyen_thoai:S.legRed,than:S.mythRed}[dt]||0;return 100/(100+S.def*4)*(1-S.dmgRed/100)*(1-red/100)*(1-Math.min(.5,S.dodge/100))*(1-Math.min(.6,S.block/100)*.8);};
const monDps=(D,M,k=1)=>M.dmg*(1+num(M.crit)/100)*takeK(D,M.dtype)/(M.cd+M.windup)*k;
const live=(D,M,k)=>D.tot.hp*(1+Math.min(.2,D.tot.fullHeal/100)*3)/Math.max(1e-9,monDps(D,M,k));
const shopLv=k=>{const m=k.match(/^thanh-(.+?)(?:-ren|-thu|-sach)?$/);return m?P.mapLevel(m[1]):1;};
const ITEMS=[];for(const [k,rows] of Object.entries(P.SHOPS))for(const r of rows){const d=P.items[r.id];if(!d||!d.slot||['cos','book'].includes(d.slot)||d.ruby||(d.gender&&d.gender!=='m'))continue;const q=d.q||'n',price=P.shopPrice(r.id,q,k);if(!(price>0))continue;ITEMS.push({id:r.id,lv:shopLv(k),price,q,slot:d.slot,v:((d.atk||0)*2+(d.def||0))*P.RAR[q].mul});}
const value=(s,sk)=>{const D=P.derive(s);return dpsOf(D,P.stance(s),sk)*Math.sqrt(D.tot.hp/takeK(D,'thuong'));};
function equipNew(s,id,q,lv=0,rng){const x=P.roll(id,q,rng);x.lv=lv;P.addItem(s,x);const i=s.bag.findIndex(b=>b&&b.uid===x.uid),t=P.targets(s,x);if(!t.length){s.bag[i]=null;throw Error('slot');}try{P.equip(s,i,/:left$/.test(id)&&t.includes('left')?'left':t.includes('right')?'right':t[0]);}catch(e){s.bag[i]=null;throw e;}for(let j=0;j<s.bag.length;j++)if(s.bag[j])s.bag[j]=null;return x;}
function shop(s,rng,sk){if(s.locked)return;for(let pass=0;pass<4;pass++){const base=value(s,sk);let best=null;const cand={};for(const it of ITEMS){if(it.lv>s.level||it.price>s.copper)continue;if(it.slot==='mount'&&P.mountNeed({type:it.id})>P.derive(s).main.cmd)continue;(cand[it.slot]=cand[it.slot]||[]).push(it);}
  for(const it of Object.values(cand).flatMap(a=>a.sort((x,y)=>y.v-x.v).slice(0,3))){const save=JSON.stringify(s.equipment);try{equipNew(s,it.id,it.q,6,rng);const g=value(s,sk)/base;if(g>1.03&&(!best||g>best.g))best={it,g};}catch(e){}s.equipment=JSON.parse(save);}
  if(!best)break;equipNew(s,best.it.id,best.it.q,6,rng);s.copper-=best.it.price;}}
// cường hóa đồ bộ: tăng đều từng món, dùng tỉ lệ / phí / hỏng thật của game
function enhanceSet(s,target,rng){let spent=0;for(let guard=0;guard<100000;guard++){const list=Object.values(s.equipment).filter(it=>it&&P.items[it.type]&&P.items[it.type].set&&(it.lv||0)<target);if(!list.length)break;const it=list.sort((a,b)=>(a.lv||0)-(b.lv||0))[0],lv=it.lv||0,c=P.enhCost(lv);if(s.rubies<c)break;s.rubies-=c;spent+=c;if(rng()<P.enhRate(lv))it.lv=lv+1;else it.lv=lv<6?lv:lv-1;}return spent;}
const BUILD={strength:.5,vitality:.35,agility:.15};
// v10.21: thú cưỡi bộ cần 160–245 Mệnh lệnh → người chơi dành dần điểm cho Mệnh lệnh từ cấp 120 (một nửa số điểm mỗi cấp cho tới mức cần)
function spend(s){const need=s.wantMount?P.mountNeed({type:s.wantMount,lv:15}):0;const D0=P.derive(s),tgt=Math.max(need?need+P.mercCmd(s):0,s.level>=120?Math.min(250,40+(s.level-120)*1.2):0);if(tgt>D0.main.cmd){const add=Math.min(s.points||0,need&&tgt>D0.main.cmd?tgt-D0.main.cmd:Math.ceil((s.points||0)/2),tgt-D0.main.cmd);s.alloc.command=num(s.alloc.command)+add;s.points-=add;}while((s.points||0)>0){const k=Object.entries(BUILD).sort((x,y)=>num(s.alloc[x[0]])/x[1]-num(s.alloc[y[0]])/y[1])[0][0];s.alloc[k]=num(s.alloc[k])+1;s.points--;}}
function run(seed){
  const rng=mulberry(seed*7919+11),s=P.create({name:'Sim',gender:'m'});s.copper=num(CFG.tien_thu_nghiem);s.rubies=0;
  const hpd=Math.min(6,Math.max(.75,OPT.hpd*Math.exp((rng()+rng()+rng()-1.5)*.62))),eff=.85+rng()*.3,walk=(5+rng()*4)/eff,skill=1.1+.2*eff;
  const budget=Array.isArray(OPT.budget)?OPT.budget[0]+rng()*(OPT.budget[1]-OPT.budget[0]):OPT.budget,rubYear=budget/1e6*1500;
  let T=0,day=0,setQ=null,tries=0,recruitSpent=0,enhSpent=0,gotSetAt=null,bossLv=P.mapLevel('thien-dinh');const B=MON['hac-thien-ma'],ms={};
  const payTo=hours=>{const d=hours/hpd;while(day+30<=d){day+=30;s.rubies+=rubYear/12;}};
  const tryRecruit=()=>{ // gửi đơn chiêu mộ ở Cổ Loa (rẻ nhất) khi đủ cấp vào thành; nhận tướng huyền thoại / thần thoại
    if(s.level<P.mapLevel('co-loa'))return;if(setQ&&!s.weak&&(setQ==='m'||s.enhDone===false))return;if(setQ&&s.enhDone===false)return;
    for(let g=0;g<400;g++){if(s.pending){const pr=s.pending.price.rubies||0;if(s.rubies<pr)return;s.rubies-=pr;recruitSpent+=pr;const S=P.SETS[s.pending.set];const better=S&&(!setQ||(s.pending.tier==='m'&&setQ==='l')||(s.weak&&!['staff','bow','crossbow'].includes(P.items[S.pieces[0]].kind)));if(better){for(const k of Object.keys(s.equipment))if(s.equipment[k]&&P.items[s.equipment[k].type].set)s.equipment[k]=null;s.weak=['staff','bow','crossbow'].includes(P.items[S.pieces[0]].kind)&&false;s.enhDone=false;for(const id of S.pieces){if(P.items[id].slot==='mount')s.wantMount=id;try{equipNew(s,id,P.items[id].q||s.pending.tier,0,rng);}catch(e){}}setQ=s.pending.tier;s.locked=true;if(gotSetAt===null)gotSetAt=T;}s.pending=null;if(setQ)return;}
      if(s.rubies<100)return;s.rubies-=100;recruitSpent+=100;tries++;const o=P.recruitRoll('co-loa',rng,Date.now());if(o.tier==='l'||o.tier==='m')s.pending=o;}};
  for(let guard=0;guard<20000;guard++){
    payTo(T/3600);tryRecruit();if(setQ){enhSpent+=enhanceSet(s,setQ==='m'?12:15,rng);const eqs=Object.values(s.equipment).filter(i=>i&&P.items[i.type].set);s.enhDone=eqs.every(i=>(i.lv||0)>=(setQ==='m'?12:15));
      if(s.enhDone&&s.level>=bossLv-20&&s.weak===undefined){const D0=P.derive(s),ttk=B.hp/dpsOf(D0,P.stance(s),skill),rg=['staff','bow','crossbow'].includes(P.stance(s).type);s.weak=ttk>live(D0,B,1.5)*(rg?1.5:1)*.95;}}
    spend(s);if(s.wantMount&&(!s.equipment.mount||s.equipment.mount.type!==s.wantMount)){try{const lv=Math.max(0,...Object.values(s.equipment).filter(i=>i&&P.items[i.type].set).map(i=>i.lv||0));equipNew(s,s.wantMount,P.items[s.wantMount].q||setQ,lv,rng);}catch(e){}}
    const D=P.derive(s),st=P.stance(s),dps=dpsOf(D,st,skill),hp=D.tot.hp;
    for(const L of [100,200,300,400])if(s.level>=L&&ms[L]==null)ms[L]=T/3600/hpd/30.4;
    if(s.level>=bossLv){const ranged=['bow','crossbow','staff'].includes(st.type),ttk=B.hp/dps,lv=live(D,B,1.5)*(.85+rng()*.3)*(ranged?1.5:1);if(ttk<lv){T+=ttk+300;return {ok:true,cmd:D.main.cmd,merc:P.mercCmd(s),h:T/3600,months:T/3600/hpd/30.4,lv:s.level,hpd,budget,setQ,setLv:Math.min(...Object.values(s.equipment).filter(i=>i&&P.items[i.type].set).map(i=>i.lv||0)),gotSet:gotSetAt&&gotSetAt/3600/hpd/30.4,tries,recruitSpent,enhSpent,ms};}}
    if(s.level>=P.maxLevel()){T+=3600*5;if(T>3600*8000){const eq=Object.values(s.equipment).filter(i=>i&&P.items[i.type].set);return {ok:false,cmd:D.main.cmd,merc:P.mercCmd(s),need:s.wantMount?P.mountNeed({type:s.wantMount,lv:15}):0,h:T/3600,lv:s.level,hpd,budget,setQ,ms,pieces:eq.length,set:eq[0]&&P.items[eq[0].type].set,lvs:eq.map(i=>i.lv||0),slots:Object.fromEntries(Object.entries(s.equipment).map(([k,v])=>[k,v&&v.type])),ttk:Math.round(B.hp/dps),live:Math.round(live(D,B,1.5)),rub:Math.round(s.rubies)};}continue;}
    let best=null;const reg=Math.max(.5,D.tot.hpReg+hp*.004);
    for(const R of REG){if(R.lv>s.level)continue;for(const [type,n] of Object.entries(MAPS[R.id]||{})){const M=MON[type];if(!M||M.boss)continue;const ttk=M.hp/dps,loss=monDps(D,M)*ttk;if(loss>hp*.6)continue;const t=ttk+walk+loss/reg,rate=Math.min(1/t,n/Math.max(5,M.respawn)*.85),e=P.killExp(M)*rate;if(!best||e>best.e)best={e,c:P.killCopper(M)*rate};}}
    if(!best)return {ok:false,stuck:true,lv:s.level,h:T/3600};
    const left=Math.max(1,Math.round(num(CFG.exp_goc)*Math.pow(s.level,num(CFG.exp_tang)/100))-(s.exp||0)),dt=left/best.e*1.15;
    T+=dt;s.copper+=Math.round(best.c*dt);P.gainExp(s,left);if(s.level%3===0)shop(s,rng,skill);
  }
  return {ok:false,h:T/3600,lv:s.level};
}
const res=[];for(let i=0;i<OPT.runs;i++)res.push(run(OPT.seed+i));
if(OPT.out)fs.writeFileSync(OPT.out,JSON.stringify(res));
const q=(a,p)=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y);return a.length?a[Math.min(a.length-1,Math.floor(p*a.length))]:NaN;},f=v=>isNaN(v)?'-':v.toFixed(1);
const ok=res.filter(r=>r.ok);console.log('lượt',res.length,'thắng',ok.length);
console.log('Tháng tới khi hạ boss cuối: p10',f(q(ok.map(r=>r.months),.1)),'trung vị',f(q(ok.map(r=>r.months),.5)),'p90',f(q(ok.map(r=>r.months),.9)),'nhanh nhất',f(q(ok.map(r=>r.months),0)));
console.log('Giờ chơi: p10',f(q(ok.map(r=>r.h),.1)),'trung vị',f(q(ok.map(r=>r.h),.5)),'p90',f(q(ok.map(r=>r.h),.9)));
for(const L of [100,200,300,400])console.log(' tới cấp',L,'(tháng): trung vị',f(q(res.map(r=>r.ms&&r.ms[L]),.5)),'p10',f(q(res.map(r=>r.ms&&r.ms[L]),.1)));
console.log('Cấp lúc thắng: trung vị',q(ok.map(r=>r.lv),.5),'thấp nhất',q(ok.map(r=>r.lv),0));
console.log('Bộ đồ: thần',ok.filter(r=>r.setQ==='m').length,'huyền thoại',ok.filter(r=>r.setQ==='l').length,'· cấp cường hóa thấp nhất trong bộ (trung vị)',q(ok.map(r=>r.setLv),.5),'· tháng có bộ (trung vị)',f(q(ok.map(r=>r.gotSet),.5)));
console.log('Hồng ngọc chiêu mộ (trung vị)',Math.round(q(ok.map(r=>r.recruitSpent),.5)),'· cường hóa',Math.round(q(ok.map(r=>r.enhSpent),.5)),'· số đơn',q(ok.map(r=>r.tries),.5));
const bad=res.filter(r=>!r.ok);if(bad.length)console.log('không thắng',bad.length,JSON.stringify(bad[0]).slice(0,300));
