/* ================= LUẬT CHƠI: chỉ số, trang bị, phẩm chất, bộ đồ, gia cường, nhiệm vụ, lính đánh thuê ================= */
const Player=(()=>{
  const VERSION=7,BAG_SIZE=40,SKILL_SLOTS=10,MAX_LV=15,MAX_ACTIVE_QUEST=3,MAX_MERC=3;
  const slots=['mount','hat','wings','left','armor','right','gloves','pants','shoes'];
  const STAT_KEYS=['strength','agility','vitality','intelligence'];
  const ELEMENTS={
    fire:{name:'Hỏa',icon:'flame',color:'#ff8a3d',glow:'#ffd27a'},water:{name:'Thủy',icon:'water',color:'#5fb6ff',glow:'#dcf1ff'},
    earth:{name:'Thổ',icon:'earth',color:'#c99a5b',glow:'#f3dcaa'},metal:{name:'Kim',icon:'metal',color:'#e3cf7a',glow:'#fffbe2'},wood:{name:'Mộc',icon:'wood',color:'#8ed46a',glow:'#e5ffb8'}
  };
  const BEASTS={horse:{seat:24,skill:'Đá hậu',icon:'mount',cmd:5},tiger:{seat:28,skill:'Vồ mồi',icon:'tiger',cmd:10},elephant:{seat:46,skill:'Dày xéo',icon:'elephant',cmd:15}};
  const GROUPS=[['str','Sức mạnh','punch'],['agi','Nhanh nhẹn','feather'],['vit','Sức khỏe','heart'],['int','Trí tuệ','spark'],['cmd','Mệnh lệnh','flag']];
  const FX_NAMES={stun:'Choáng',execute:'Kết liễu',shield:'Lá chắn',wave:'Sóng chém',aura:'Hào khí',cleave:'Chém lan',manaShield:'Khiên mana',lifesteal:'Hút máu',haste:'Thần tốc',burn:'Thiêu đốt',counter:'Phản công',heal:'Hồi phục',revive:'Hồi sinh'};
  const SLOT_OF={vu_khi:'right',tay_trai:'left',mu:'hat',ao:'armor',quan:'pants',gang:'gloves',giay:'shoes',canh:'wings',thu_cuoi:'mount'};
  const PAIRS=new Set(['sword|sword','shield|shield','staff|staff','shield|staff','shield|sword']);
  const ALIAS={'book-ice':'book-water','book-wind':'book-metal','book-thunder':'book-earth'};
  const skills={normal:{cost:0,cooldown:450},basic:{cost:10,cooldown:3000},intermediate:{cost:18,cooldown:6000},advanced:{cost:28,cooldown:10000},mount:{cost:12,cooldown:6000}};
  // Bảng sinh từ dữ liệu (Sheet)
  const CFG={},RAR={},ADD={},items={},SHOPS={},SETS={},MON={},QUESTS={},MERCS={},ENH=[];
  const num=(v,f=0)=>{if(v===''||v==null)return f;const n=Number(typeof v==='string'?v.replace(/^'/,'').replace(',','.'):v);return Number.isFinite(n)?n:f;};
  const range=s=>{const [a,b]=String(s||'0-0').split('-').map(Number);return [num(a),num(b,num(a))];};
  const parseBonus=s=>{const o={};String(s||'').split(/[,;]/).forEach(p=>{const [k,v]=p.split(':').map(x=>x&&x.trim());if(k&&ADD[k]&&Number.isFinite(+v))o[k]=+v;});return o;};
  const clear=o=>{for(const k of Object.keys(o))delete o[k];};
  function load(data){
    [CFG,RAR,ADD,items,SHOPS,SETS,MON,QUESTS,MERCS].forEach(clear);ENH.length=0;
    for(const r of data.cau_hinh||[])CFG[r.khoa]=num(r.gia_tri,r.gia_tri);
    for(const r of data.gia_cuong||[])ENH[num(r.cap)]={rate:num(r.ti_le)/100,cost:num(r.phi_hong_ngoc),fail:r.that_bai_tu===''||r.that_bai_tu==null?null:[num(r.that_bai_tu),num(r.that_bai_den,num(r.that_bai_tu))]};
    for(const r of data.pham_chat||[])RAR[r.ma]={name:r.ten,color:r.mau,mul:num(r.he_so,100)/100,lines:num(r.so_dong),tier:num(r.bac),trade:r.giao_dich==='co',buy:r.mua_duoc==='co'};
    for(const r of data.thuoc_tinh||[])ADD[r.ma]={name:r.ten,group:r.nhom,unit:r.don_vi||'',ranges:[null,...['dep','hoan_hao','huyen_thoai','than'].map(k=>[num(r[k+'_thap']),num(r[k+'_cao'],num(r[k+'_thap']))])]};
    for(const r of data.vat_pham||[]){
      const slot=r.o||null,d={name:r.ten,slot,kind:r.loai||slot,grip:r.cam||'one',atk:num(r.cong),def:num(r.thu),speed:num(r.toc)/100,price:num(r.gia),tint:r.mau||null};
      if(slot==='mount'){d.beast=r.thu_cuoi||'horse';d.cmd=num(r.menh_lenh,BEASTS[d.beast].cmd);if(d.beast!=='horse')d.icon=d.beast;}
      if(slot==='book'){d.icon='book';d.element=r.he;}
      if(!slot)d.icon=r.loai||'ore';
      items[r.id]=d;
    }
    for(const r of data.cua_hang||[]){(SHOPS[r.cua_hang]=SHOPS[r.cua_hang]||[]).push({id:r.id,q:String(r.pham_chat||'n').split(',').map(x=>x.trim()),price:num(r.gia),order:num(r.thu_tu)});}
    for(const k of Object.keys(SHOPS))SHOPS[k].sort((a,b)=>a.order-b.order);
    for(const r of data.bo_huyen_thoai||[]){
      const S={id:r.id,hero:r.nhan_vat,gender:r.gioi_tinh,name:r.ten_bo,tiers:{3:parseBonus(r.moc_3),5:parseBonus(r.moc_5),7:parseBonus(r.moc_7)},fx:r.hieu_ung_9,fxv:num(r.gia_tri_9),fxText:r.mo_ta_9,pieces:[]};
      SETS[r.id]=S;
      for(const [col,slot] of Object.entries(SLOT_OF)){
        const id=r.id+':'+slot,base={name:r[col],set:r.id,gender:r.gioi_tinh,q:'l',price:num(CFG.gia_do_bo,5000),tint:'#e8c070'};
        if(slot==='right'||slot==='left'){const k=slot==='right'?r.vu_khi_loai:r.tay_trai_loai;Object.assign(base,{slot:'hand',kind:k,grip:'one',atk:k==='shield'?0:num(CFG.bo_cong_vu_khi,16)*(slot==='left'?.6:1),def:k==='shield'?num(CFG.bo_thu_khien,10):0});}
        else if(slot==='mount'){const b=r.thu_cuoi_loai||'horse';Object.assign(base,{slot,kind:'mount',beast:b,cmd:BEASTS[b].cmd,speed:num(CFG.bo_toc_thu_cuoi,155)/100,tint:b==='elephant'?'#a8aeb4':b==='tiger'?'#e89a3e':'#d8c8a8'});if(b!=='horse')base.icon=b;}
        else Object.assign(base,{slot,kind:slot,def:slot==='armor'?num(CFG.bo_thu_ao,12):num(CFG.bo_thu_nho,6)});
        base.atk=Math.round(base.atk||0);items[id]=base;S.pieces.push(id);
      }
    }
    for(const r of data.do_than||[]){
      const d={name:r.ten,slot:r.o,kind:r.loai,grip:r.cam||'one',atk:num(r.cong),def:num(r.thu),speed:num(r.toc)/100,price:num(r.gia,20000),tint:r.mau||null,q:'m',fx:r.hieu_ung,fxv:num(r.gia_tri),fxText:r.mo_ta,myth:true};
      if(d.slot==='mount'){d.beast=r.thu_cuoi||'horse';d.cmd=BEASTS[d.beast].cmd;}
      items[r.id]=d;
    }
    for(const r of data.quai||[])MON[r.id]={name:r.ten,hp:num(r.mau),dmg:num(r.sat_thuong),speed:num(r.toc_do),run:num(r.toc_chay),r:num(r.ban_kinh),h:num(r.cao),aggro:num(r.tam_danh),range:num(r.tam_gan),cd:num(r.hoi_chieu_ms)/1000,windup:num(r.vung_tay_ms)/1000,copper:num(r.dong),knock:num(r.day_lui_phan_tram)/100,boss:num(r.boss),respawn:num(r.hoi_sinh_giay,15),drops:{g:num(r.dep_phan_van)/1e4,p:num(r.hoan_hao_phan_van)/1e4,l:num(r.huyen_thoai_phan_van)/1e4,m:num(r.than_phan_van)/1e4},rubies:[num(r.hong_ngoc_it),num(r.hong_ngoc_nhieu)],dtype:r.loai_sat_thuong||'thuong',crit:num(r.ti_le_x2)};
    for(const r of data.nhiem_vu||[])QUESTS[r.id]={id:r.id,name:r.ten,desc:r.mo_ta,target:r.muc_tieu,count:num(r.so_luong,1),copper:num(r.thuong_dong),rubies:num(r.thuong_hong_ngoc),item:r.thuong_do||'',itemQ:r.pham_chat_do||'n',repeat:r.lap_lai!=='khong'};
    for(const r of data.linh||[])MERCS[r.id]={id:r.id,name:r.ten,gender:r.gioi_tinh==='f'?'f':'m',price:num(r.gia),cmd:num(r.menh_lenh,5),stats:{strength:num(r.suc_manh),agility:num(r.nhanh_nhen),vitality:num(r.suc_khoe),intelligence:num(r.tri_tue),command:0},gear:String(r.trang_bi||'').split(',').map(x=>x.trim()).filter(Boolean),desc:r.mo_ta};
  }
  const info=i=>i&&items[i.type];
  const kind=i=>info(i)?info(i).kind:null;
  const qOf=i=>{const d=info(i);return d?(d.q||i.q||'n'):'n';};
  const rar=i=>RAR[qOf(i)]||RAR.n||{name:'Thường',color:'#e8e6df',mul:1,lines:0,tier:0};
  const isTwo=i=>!!info(i)&&info(i).grip==='two';
  const pairOk=(a,b)=>PAIRS.has([a,b].sort().join('|'));
  const nameOf=i=>info(i)?info(i).name+(i.lv?' +'+i.lv:''):'';
  const SELL_MUL={n:1,g:2,p:5,l:10,m:20};
  const sellPrice=i=>Math.max(1,Math.floor((info(i)?info(i).price:0)*num(CFG.ti_le_ban_lai,40)/100*(SELL_MUL[qOf(i)]||1)));
  const canEnhance=i=>{const d=info(i);return !!d&&!!d.slot&&d.slot!=='book';};
  const tradeable=i=>!!info(i)&&!!rar(i).trade;
  const gainOf=d=>d.slot==='mount'?{speed:.03}:d.atk?{atk:2}:d.def?{def:1}:{};
  const r2=v=>Math.round(v*100)/100;
  function stat(i){
    const d=info(i);if(!d)return {atk:0,def:0,speed:0};
    const lv=i.lv||0,g=gainOf(d),m=rar(i).mul;
    return {atk:Math.round((d.atk||0)*m)+(g.atk||0)*lv,def:Math.round((d.def||0)*m)+(g.def||0)*lv,speed:d.speed?r2(d.speed+(g.speed||0)*lv):0};
  }
  const uid=t=>'it-'+String(t).replace(/[^a-z0-9]/gi,'').slice(0,12)+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  // Sinh món đồ với phẩm chất + dòng thuộc tính ngẫu nhiên
  function roll(type,q='n',rng=Math.random){
    const d=items[type];if(!d)throw Error('ITEM');
    const it={uid:uid(type),type};if(!d.q&&q!=='n')it.q=q;
    const R=RAR[d.q||q]||{lines:0,tier:0};
    if(d.slot&&d.slot!=='book'&&R.lines){
      const keys=Object.keys(ADD).filter(k=>ADD[k].ranges[R.tier]);it.add={};
      for(let n=0;n<R.lines&&keys.length;n++){const k=keys.splice(Math.floor(rng()*keys.length),1)[0],[a,b]=ADD[k].ranges[R.tier];it.add[k]=a+Math.floor(rng()*(b-a+1));}
    }
    return it;
  }
  const BASE_DROP=()=>Object.keys(items).filter(k=>{const d=items[k];return !d.q&&d.slot&&d.slot!=='book'&&d.slot!=='mount';});
  function rollDrop(monId,rng=Math.random){
    const M=MON[monId];if(!M)return {items:[],rubies:0};
    const out=[],tries=M.boss===2?3:M.boss?2:1;
    for(let t=0;t<tries;t++){
      const x=rng();let acc=0;
      if(x<(acc+=M.drops.m)){const pool=Object.keys(items).filter(k=>items[k].myth);if(pool.length)out.push(roll(pool[Math.floor(rng()*pool.length)],'m',rng));}
      else if(x<(acc+=M.drops.l)){const pool=Object.keys(items).filter(k=>items[k].set);if(pool.length)out.push(roll(pool[Math.floor(rng()*pool.length)],'l',rng));}
      else if(x<(acc+=M.drops.p)){const pool=BASE_DROP();out.push(roll(pool[Math.floor(rng()*pool.length)],'p',rng));}
      else if(x<(acc+=M.drops.g)){const pool=BASE_DROP();out.push(roll(pool[Math.floor(rng()*pool.length)],'g',rng));}
    }
    const [a,b]=M.rubies;return {items:out,rubies:b>0?a+Math.floor(rng()*(b-a+1)):0};
  }
  // Gia cường
  const enhRate=lv=>lv>=MAX_LV?0:(ENH[lv]?ENH[lv].rate:0);
  const enhCost=lv=>ENH[lv]?ENH[lv].cost:lv+1;
  function enhFail(lv,rng){const f=ENH[lv]?ENH[lv].fail:null;if(!f)return lv;const [a,b]=f;return a+Math.floor(rng()*(b-a+1));}
  function enhance(s,ref,rng=Math.random){
    const it=ref.where==='bag'?s.bag[ref.key]:s.equipment[ref.key];
    if(!canEnhance(it))throw Error('ITEM');
    const lv=it.lv||0;if(lv>=MAX_LV)throw Error('MAX');
    const cost=enhCost(lv);if(s.rubies<cost)throw Error('RUBY');
    s.rubies-=cost;const ok=rng()<enhRate(lv);it.lv=ok?lv+1:enhFail(lv,rng);
    return {ok,from:lv,to:it.lv,cost};
  }
  // Tạo nhân vật mới (từ thông tin máy chủ)
  function create(ch){
    const bag=Array(BAG_SIZE).fill(null);
    ['crossbow','bow','spear','staff','shield','hat','armor'].forEach((type,i)=>bag[i]={uid:'training-'+type+'-'+i,type});
    const st=Object.fromEntries(STAT_KEYS.map(k=>[k,Math.max(0,Math.floor(num(ch&&ch.stats&&ch.stats[k],12)))]));st.command=num(CFG.menh_lenh_goc,10);
    const s={name:(ch&&ch.name)||'Lữ khách',gender:ch&&ch.gender==='f'?'f':'m',level:1,stats:st,hp:1e9,mana:1e9,passive:0,copper:num(CFG.tien_thu_nghiem,0),rubies:num(CFG.hong_ngoc_thu_nghiem,0),
      flags:{river:false,hunted:false,kills:{},wells:{}},equipment:Object.fromEntries(slots.map(k=>[k,k==='right'?{uid:'training-sword',type:'sword'}:null])),bag,skillSlots:Array(SKILL_SLOTS).fill(null),activeBook:null,cooldowns:{},
      quests:{active:{},done:{}},mercs:[],activeMerc:null};
    const D=derive(s);s.hp=D.tot.hp;s.mana=D.tot.mp;return s;
  }
  // Tính toàn bộ chỉ số: 5 chỉ số lớn + chỉ số nhỏ (base + phần cộng thêm từ đồ, bộ, sách)
  const CAPS={dodge:50,block:60,dmgRed:70,cdr:50,crit2:60,crit3:30,perfRed:80,critRed:80,legRed:80,mythRed:80,acc:100};
  function derive(s,opt={}){
    const A={},add=(k,v)=>{if(v)A[k]=(A[k]||0)+v;};
    const eqs=slots.map(k=>s.equipment[k]).filter(it=>info(it)&&!(opt.safe&&info(it).slot==='mount'));
    let atk=0,mount=null,shield=false;const setCount={},fx={};
    for(const it of eqs){
      const d=info(it),st=stat(it);atk+=st.atk;add('def',st.def);
      if(d.slot==='mount'){mount=d;if(st.speed>1)add('moveSpd',Math.round((st.speed-1)*100));}
      if(d.kind==='shield')shield=true;
      for(const [k,v] of Object.entries(it.add||{}))if(ADD[k])add(k,num(v));
      if(d.set&&(!d.gender||d.gender===s.gender))setCount[d.set]=(setCount[d.set]||0)+1;
      if(d.fx)fx[d.fx]=Math.max(fx[d.fx]||0,d.fxv);
    }
    if(atk){add('dmgMin',Math.round(atk*.8));add('dmgMax',Math.round(atk*1.3));}
    if(shield)add('block',10);
    const sets=[];
    for(const [id,n] of Object.entries(setCount)){const S=SETS[id];if(!S)continue;sets.push({id,n,name:S.name,hero:S.hero});for(const t of [3,5,7])if(n>=t)for(const [k,v] of Object.entries(S.tiers[t]))add(k,v);if(n>=9)fx[S.fx]=Math.max(fx[S.fx]||0,S.fxv);}
    const books={};for(const it of (s.skillSlots||[])){const d=info(it);if(d&&d.element)books[d.element]=true;}
    if(books.water)add('mpReg',num(CFG.thuy_hoi_mana,3));if(books.wood)add('hpReg',num(CFG.moc_hoi_mau,2));if(books.earth)add('reflect',num(CFG.tho_phan_don,30));if(books.metal)add('dmgRed',num(CFG.kim_giam_sat_thuong,25));
    const st=s.stats||{};
    const main={str:num(st.strength)+(A.str||0),agi:num(st.agility)+(A.agi||0),vit:num(st.vitality)+(A.vit||0),int:num(st.intelligence)+(A.int||0),cmd:num(st.command)+(A.cmd||0)};
    const base={dmgMin:main.str*.6,dmgMax:main.str,crit2:main.str*.1,atkSpd:main.agi*.6,moveSpd:main.agi*.3,def:main.agi*.3,dodge:main.agi*.2,hp:num(CFG.mau_goc,60)+main.vit*num(CFG.mau_moi_diem,5),mp:num(CFG.mana_goc,40)+main.int*num(CFG.mana_moi_diem,4),cdr:main.int*.3};
    const tot={};for(const k of Object.keys(ADD)){if(GROUPS.some(g=>g[0]===k))continue;let v=(base[k]||0)+(A[k]||0);if(CAPS[k])v=Math.min(CAPS[k],v);tot[k]=ADD[k].unit?Math.round(v*10)/10:Math.round(v);}
    tot.hp=Math.round(tot.hp);tot.mp=Math.round(tot.mp);tot.dmgMax=Math.max(tot.dmgMax,tot.dmgMin);
    return {main,add:A,tot,fx,books,sets,mount,dmgMul:books.fire?1+num(CFG.hoa_sat_thuong,25)/100:1};
  }
  function mercCmd(s){const m=s.activeMerc!=null?s.mercs[s.activeMerc]:null;return m?num(m.cmd,5):0;}
  function stash(bag,list,prefer){const b=bag.slice();for(const it of list){const i=prefer!=null&&b[prefer]===null?prefer:b.indexOf(null);if(i<0)throw Error('BAG_FULL');b[i]=it;prefer=null;}return b;}
  function targets(s,item){
    const d=info(item);if(!d||!d.slot||d.slot==='book')return [];
    if(d.gender&&d.gender!==s.gender)return [];
    if(d.slot!=='hand')return s.isMerc&&d.slot==='mount'?[]:[d.slot];
    if(d.grip==='two')return ['right'];
    const eq=s.equipment;if(isTwo(eq.right))return ['left','right'];
    return ['left','right'].filter(sl=>{const o=eq[sl==='left'?'right':'left'];return !o||pairOk(d.kind,kind(o));});
  }
  function equip(s,index,slot){
    if(!Number.isInteger(index)||index<0||index>=BAG_SIZE)throw Error('SLOT');
    const item=s.bag[index],d=info(item);if(!d||!slots.includes(slot))throw Error('SLOT');
    if(d.gender&&d.gender!==s.gender)throw Error('GENDER');
    if(d.slot==='mount'){if(s.isMerc)throw Error('SLOT');const need=d.cmd||5,have=derive(s).main.cmd-mercCmd(s);if(need>have)throw Error('CMD');}
    if(d.slot!=='hand'){if(d.slot!==slot)throw Error('SLOT');s.bag[index]=s.equipment[slot];s.equipment[slot]=item;return;}
    if(slot!=='left'&&slot!=='right')throw Error('SLOT');
    const eq=s.equipment;let bag=s.bag.slice();bag[index]=null;
    if(d.grip==='two'){bag=stash(bag,[eq.right,eq.left].filter(Boolean),index);s.bag=bag;eq.right=item;eq.left=null;return;}
    const prevTwo=isTwo(eq.right)?eq.right:null,other=prevTwo?null:eq[slot==='left'?'right':'left'];
    if(other&&!pairOk(d.kind,kind(other)))throw Error('PAIR');
    bag=stash(bag,prevTwo?[prevTwo]:(eq[slot]?[eq[slot]]:[]),index);
    s.bag=bag;if(prevTwo){eq.right=null;eq.left=null;}eq[slot]=item;
  }
  function unequip(s,slot){
    if(!slots.includes(slot))throw Error('SLOT');
    const key=slot==='left'&&isTwo(s.equipment.right)?'right':slot,it=s.equipment[key];if(!it)return;
    const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.bag[i]=it;s.equipment[key]=null;
  }
  function stance(s){
    const L=s.equipment.left,R=s.equipment.right;
    if(isTwo(R))return {type:kind(R),two:true,dual:false,shield:false,left:null,right:kind(R),tintL:null,tintR:info(R).tint||null,lvL:0,lvR:R.lv||0};
    const l=kind(L),r=kind(R),types=[l,r].filter(Boolean);
    const base={two:false,left:l,right:r,tintL:L?info(L).tint||null:null,tintR:R?info(R).tint||null:null,lvL:L?L.lv||0:0,lvR:R?R.lv||0:0};
    if(!types.length)return {...base,type:'punch',dual:false,shield:false};
    const type=types.includes('sword')?'sword':types.includes('staff')?'staff':'shield';
    return {...base,type,dual:types.length===2&&l===r,shield:types.includes('shield')&&type!=='shield'};
  }
  function setSkill(s,bagIndex,slotIndex){
    const item=s.bag[bagIndex];if(!info(item)||info(item).slot!=='book')throw Error('BOOK');
    if(slotIndex==null){slotIndex=s.skillSlots.indexOf(null);if(slotIndex<0)slotIndex=s.activeBook??0;}
    if(slotIndex<0||slotIndex>=SKILL_SLOTS)throw Error('SLOT');
    s.bag[bagIndex]=s.skillSlots[slotIndex];s.skillSlots[slotIndex]=item;s.activeBook=slotIndex;
  }
  function unsetSkill(s,i){const it=s.skillSlots[i];if(!it)return;const b=s.bag.indexOf(null);if(b<0)throw Error('BAG_FULL');s.bag[b]=it;s.skillSlots[i]=null;if(s.activeBook===i)s.activeBook=s.skillSlots.findIndex(Boolean);if(s.activeBook<0)s.activeBook=null;}
  function toggleBook(s,i){if(!s.skillSlots[i])return;s.activeBook=s.activeBook===i?null:i;}
  function element(s){const b=s.activeBook!=null?s.skillSlots[s.activeBook]:null;return b&&info(b)?info(b).element:null;}
  function money(c){return {gold:Math.floor(c/10000),silver:Math.floor(c/100)%100,copper:c%100};}
  function shopPrice(type,q='n'){const d=items[type];if(!d)return 0;let row=null;for(const k in SHOPS){row=SHOPS[k].find(r=>r.id===type)||row;}const p=row&&row.price?row.price:d.price;return Math.round(p*(q==='g'?num(CFG.he_so_gia_do_dep,250)/100:1));}
  function buy(s,type,q='n'){const d=items[type];if(!d||!d.price||d.q)throw Error('ITEM');const price=shopPrice(type,q);if(s.copper<price)throw Error('MONEY');const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.copper-=price;s.bag[i]=roll(type,q);return i;}
  function sell(s,index){const it=s.bag[index];if(!it)throw Error('SLOT');const v=sellPrice(it);s.copper+=v;s.bag[index]=null;return v;}
  function addItem(s,it){const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.bag[i]=it;return i;}
  function cast(s,id,now,D){
    const skill=skills[id];if(!skill)return {ok:false,error:'SKILL'};
    if(id==='mount'&&!s.equipment.mount)return {ok:false,error:'NOMOUNT'};
    if(now<(s.cooldowns[id]||0))return {ok:false,error:'COOLDOWN'};
    if(s.mana<skill.cost)return {ok:false,error:'MANA'};
    const cdr=D?D.tot.cdr:0;
    s.mana-=skill.cost;s.cooldowns[id]=now+skill.cooldown*(1-cdr/100);
    const empowered=id==='normal'&&s.passive>=100;
    if(id==='normal')s.passive=empowered?0:Math.min(100,s.passive+12);
    return {ok:true,stance:stance(s),empowered};
  }
  // Nhiệm vụ của Lý trưởng
  function questAccept(s,id){const Q=QUESTS[id];if(!Q)throw Error('QUEST');if(s.quests.active[id]!=null)throw Error('QUEST_HAVE');if(Object.keys(s.quests.active).length>=MAX_ACTIVE_QUEST)throw Error('QUEST_FULL');if(!Q.repeat&&s.quests.done[id])throw Error('QUEST_DONE');s.quests.active[id]=0;}
  function questProgress(s,monId){const out=[];for(const id of Object.keys(s.quests.active)){const Q=QUESTS[id];if(Q&&Q.target===monId&&s.quests.active[id]<Q.count){s.quests.active[id]++;out.push(id);}}return out;}
  function questTurnIn(s,id,rng=Math.random){
    const Q=QUESTS[id];if(!Q||s.quests.active[id]==null)throw Error('QUEST');if(s.quests.active[id]<Q.count)throw Error('QUEST_NOT_DONE');
    let it=null;if(Q.item&&items[Q.item]){if(s.bag.indexOf(null)<0)throw Error('BAG_FULL');it=roll(Q.item,Q.itemQ||'n',rng);addItem(s,it);}
    s.copper+=Q.copper;s.rubies+=Q.rubies;delete s.quests.active[id];s.quests.done[id]=(s.quests.done[id]||0)+1;return {copper:Q.copper,rubies:Q.rubies,item:it};
  }
  // Lính đánh thuê
  function makeMerc(o){
    const m={mid:'mc-'+Math.random().toString(36).slice(2,9),src:o.src||'npc',tpl:o.tpl||'',from:o.from||'',name:String(o.name||'Lính').slice(0,20),gender:o.gender==='f'?'f':'m',cmd:num(o.cmd,10),
      stats:{strength:num(o.stats&&o.stats.strength,10),agility:num(o.stats&&o.stats.agility,10),vitality:num(o.stats&&o.stats.vitality,10),intelligence:num(o.stats&&o.stats.intelligence,10),command:0},equipment:Object.fromEntries(slots.map(k=>[k,null])),hpFrac:1};
    const eq=o.equipment||{};for(const k of slots)if(k!=='mount'){const it=cleanItem(eq[k]);if(it)m.equipment[k]=it;}
    return m;
  }
  function hireNpc(s,id){
    const T=MERCS[id];if(!T)throw Error('MERC');if(s.mercs.length>=MAX_MERC)throw Error('MERC_FULL');if(s.copper<T.price)throw Error('MONEY');
    const m=makeMerc({src:'npc',tpl:id,name:T.name,gender:T.gender,cmd:T.cmd,stats:T.stats});
    let hand=0;for(const g of T.gear){const d=items[g];if(!d)continue;const it=roll(g,'n');if(d.slot==='hand'){const sl=d.grip==='two'?'right':hand++?'left':'right';m.equipment[sl]=it;}else if(d.slot!=='mount')m.equipment[d.slot]=it;}
    s.copper-=T.price;s.mercs.push(m);return m;
  }
  function addMerc(s,o){if(s.mercs.length>=MAX_MERC)throw Error('MERC_FULL');const m=makeMerc(o);s.mercs.push(m);return m;}
  function setActiveMerc(s,i){
    if(i===null||i===s.activeMerc){s.activeMerc=null;return;}
    const m=s.mercs[i];if(!m)throw Error('MERC');
    const D=derive(s),mountNeed=s.equipment.mount&&info(s.equipment.mount)?info(s.equipment.mount).cmd||5:0;
    if(num(m.cmd,5)+mountNeed>D.main.cmd)throw Error('CMD');s.activeMerc=i;
  }
  const mercProxy=(s,m)=>({equipment:m.equipment,bag:s.bag,gender:m.gender,stats:m.stats,isMerc:true});
  function mercEquip(s,i,bagIndex,slot){const m=s.mercs[i];if(!m)throw Error('MERC');const P=mercProxy(s,m);equip(P,bagIndex,slot);s.bag=P.bag;}
  function mercUnequip(s,i,slot){const m=s.mercs[i];if(!m)throw Error('MERC');const P=mercProxy(s,m);unequip(P,slot);s.bag=P.bag;}
  function dismissMerc(s,i){const m=s.mercs[i];if(!m)throw Error('MERC');const list=slots.map(k=>m.equipment[k]).filter(Boolean);if(s.bag.filter(x=>!x).length<list.length)throw Error('BAG_FULL');for(const it of list)addItem(s,it);s.mercs.splice(i,1);if(s.activeMerc===i)s.activeMerc=null;else if(s.activeMerc>i)s.activeMerc--;}
  // Lưu / khôi phục
  function cleanItem(i){
    if(!i||typeof i.uid!=='string')return null;const type=ALIAS[i.type]||i.type;const d=items[type];if(!d)return null;
    const it={uid:i.uid.slice(0,80),type};const lv=Math.floor(num(i.lv));if(lv>0&&canEnhance(it))it.lv=Math.min(MAX_LV,lv);
    if(!d.q&&RAR[i.q]&&i.q!=='n')it.q=i.q;
    if(i.add&&typeof i.add==='object'){const a={};for(const [k,v] of Object.entries(i.add))if(ADD[k]&&Number.isFinite(+v))a[k]=Math.max(0,Math.min(999,+v));if(Object.keys(a).length)it.add=a;}
    return it;
  }
  function serialize(s,pos,seen){return {v:VERSION,player:s,pos:{x:pos.x,y:pos.y},seen:[...seen]};}
  function restore(save,ch,canStand,npcIds){
    const s=create(ch);if(!save||!save.player)return {player:s,pos:null,seen:[]};
    const p=save.player,n=(v,a,b,f)=>typeof v==='number'&&Number.isFinite(v)?Math.max(a,Math.min(b,v)):f,used=new Set();
    const valid=i=>{const it=cleanItem(i);if(!it||used.has(it.uid))return null;used.add(it.uid);return it;};
    s.level=Math.floor(n(p.level,1,999,1));s.passive=n(p.passive,0,100,0);
    s.copper=Math.floor(n(p.copper,0,Number.MAX_SAFE_INTEGER,0));s.rubies=Math.floor(n(p.rubies,0,Number.MAX_SAFE_INTEGER,0));
    s.stats.command=Math.floor(n(p.stats&&p.stats.command,0,999,s.stats.command));
    if(p.flags){s.flags.river=!!p.flags.river;s.flags.hunted=!!p.flags.hunted;if(p.flags.wells&&typeof p.flags.wells==='object')for(const [k,v] of Object.entries(p.flags.wells))if(/^gieng-\d+$/.test(k)&&Number.isFinite(+v))s.flags.wells[k]=+v;for(const [k,v] of Object.entries(p.flags.kills||{}))if(MON[k])s.flags.kills[k]=Math.floor(n(v,0,1e9,0));}
    const extra=[],eq=Object.fromEntries(slots.map(k=>[k,null]));
    for(const k of slots){const it=valid(p.equipment&&p.equipment[k]);if(!it)continue;const d=items[it.type];const ok=(d.slot==='hand'?(k==='left'||k==='right'):d.slot===k)&&(!d.gender||d.gender===s.gender);if(ok)eq[k]=it;else extra.push(it);}
    if(isTwo(eq.left)){extra.push(eq.left);eq.left=null;}
    if(isTwo(eq.right)&&eq.left){extra.push(eq.left);eq.left=null;}
    if(eq.left&&eq.right&&!pairOk(kind(eq.left),kind(eq.right))){extra.push(eq.left);eq.left=null;}
    s.equipment=eq;
    const srcBag=Array.isArray(p.bag)?p.bag:[];s.bag=Array.from({length:BAG_SIZE},(_,i)=>valid(srcBag[i]));
    const srcSk=Array.isArray(p.skillSlots)?p.skillSlots:[];
    s.skillSlots=Array.from({length:SKILL_SLOTS},(_,i)=>{const it=valid(srcSk[i]);if(it&&items[it.type].slot!=='book'){extra.push(it);return null;}return it;});
    s.activeBook=Number.isInteger(p.activeBook)&&s.skillSlots[p.activeBook]?p.activeBook:null;
    for(const it of extra){const i=s.bag.indexOf(null);if(i>=0)s.bag[i]=it;}
    for(const k of Object.keys(skills))s.cooldowns[k]=n(p.cooldowns&&p.cooldowns[k],0,Date.now()+skills[k].cooldown,0);
    if(p.quests){for(const [k,v] of Object.entries(p.quests.active||{}))if(QUESTS[k])s.quests.active[k]=Math.floor(n(v,0,999,0));for(const [k,v] of Object.entries(p.quests.done||{}))if(QUESTS[k])s.quests.done[k]=Math.floor(n(v,0,1e6,0));}
    if(Array.isArray(p.mercs))s.mercs=p.mercs.slice(0,MAX_MERC).map(m=>{const x=makeMerc(m);x.mid=typeof m.mid==='string'?m.mid.slice(0,30):x.mid;x.hpFrac=n(m.hpFrac,0,1,1);return x;});
    s.activeMerc=Number.isInteger(p.activeMerc)&&s.mercs[p.activeMerc]?p.activeMerc:null;
    const D=derive(s);s.hp=n(p.hp,1,D.tot.hp,D.tot.hp);s.mana=n(p.mana,0,D.tot.mp,D.tot.mp);
    const pos=save.pos;
    return {player:s,pos:pos&&canStand&&canStand(pos.x,pos.y)?{x:pos.x,y:pos.y}:null,seen:Array.isArray(save.seen)?save.seen.filter(v=>(npcIds||[]).includes(v)):[]};
  }
  load(typeof GAME_DATA!=='undefined'?GAME_DATA:{});
  return {VERSION,BAG_SIZE,SKILL_SLOTS,MAX_LV,MAX_MERC,MAX_ACTIVE_QUEST,ELEMENTS,BEASTS,GROUPS,FX_NAMES,STAT_KEYS,CFG,RAR,ADD,SHOPS,SETS,MON,QUESTS,MERCS,items,slots,skills,
    load,info,kind,qOf,rar,nameOf,stat,canEnhance,tradeable,gainOf,enhRate,enhCost,enhance,roll,rollDrop,create,derive,targets,equip,unequip,stance,isTwo,pairOk,setSkill,unsetSkill,toggleBook,element,money,shopPrice,buy,sell,sellPrice,addItem,cast,
    questAccept,questProgress,questTurnIn,hireNpc,addMerc,setActiveMerc,mercEquip,mercUnequip,dismissMerc,makeMerc,cleanItem,serialize,restore};
})();
