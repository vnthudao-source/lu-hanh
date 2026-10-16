/* ================= GIAO DIỆN TRONG GAME ================= */
window.startUI=(session)=>{
  const $=s=>document.querySelector(s),game=window.mapGame,p=game.player,info=Player.info,EL=Player.ELEMENTS,svg=game.svg;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tintOf=it=>{const d=info(it);return d?(d.element?EL[d.element].color:d.tint||null):null;};
  const qColor=it=>Player.rar(it).color;
  const icon=(type,color)=>{const d=Player.items[type],id=d?(d.icon||d.kind):type;return `<svg class="icon" aria-hidden="true"${color?` style="color:${color}"`:''}><use href="#i-${id}"/></svg>`;};
  const coins=c=>{const m=Player.money(c),out=[];if(m.gold)out.push(`<span class="coin gold"><i></i>${m.gold}</span>`);if(m.silver)out.push(`<span class="coin silver"><i></i>${m.silver}</span>`);if(m.copper||!out.length)out.push(`<span class="coin"><i></i>${m.copper}</span>`);return out.join('');};
  const ruby=n=>`<span class="coin ruby"><i></i>${n}</span>`;
  const chip=(id,txt,color)=>`<i class="ch"${color?` style="color:${color}"`:''}>${svg(id)}${txt}</i>`;
  const lvb=it=>it&&it.lv?`<b class="lvb">+${it.lv}</b>`:'';
  const qdot=it=>{const q=Player.qOf(it);return q!=='n'?`<i class="qd" style="background:${qColor(it)}"></i>`:'';};
  const SLOT_NAMES={mount:'Thú cưỡi',hat:'Mũ',wings:'Cánh',left:'Tay trái',armor:'Áo giáp',right:'Tay phải',gloves:'Găng tay',pants:'Quần',shoes:'Giày'};
  const KIND_NAMES={sword:'Kiếm',shield:'Khiên',staff:'Gậy phép',bow:'Cung',spear:'Giáo',crossbow:'Nỏ',punch:'Tay không'};
  const ERR={BAG_FULL:'Túi đầy',PAIR:'Không cầm chung được',MONEY:'Không đủ tiền',SLOT:'Không mặc vào ô này được',RUBY:'Không đủ hồng ngọc',MAX:'Đã tối đa +15',BOOK:'Không phải sách',ITEM:'Món này không làm được việc này',GENDER:'Đồ này dành cho nhân vật khác giới',CMD:'Không đủ Mệnh lệnh',QUEST_FULL:'Chỉ nhận tối đa 3 việc cùng lúc',QUEST_HAVE:'Đã nhận việc này',QUEST_NOT_DONE:'Chưa làm xong',QUEST_DONE:'Việc này chỉ làm một lần',MERC_FULL:'Tối đa 3 lính đánh thuê',MERC:'Không tìm thấy lính',POINTS:'Không đủ điểm',STAT:'Chỉ số không hợp lệ'};
  const fail=err=>game.message(svg('close')+(ERR[err.message]||netMsg(err)));
  // Chạy lệnh máy chủ: khóa nút trong lúc chờ, báo lỗi nếu có
  const run=(btn,pr,after)=>{if(btn){btn.disabled=true;btn.classList.add('busy');}return pr.then(()=>refresh(),e=>{fail(e);if(btn){btn.disabled=false;btn.classList.remove('busy');}after&&after();});};
  const ttl=(id,text)=>`${svg(id)}<b>${text}</b>`;
  const addLine=(k,v)=>{const A=Player.ADD[k];return A?`${A.name} +${v}${A.unit}`:'';};
  // Chỉ số món đồ: icon + chữ ngắn + số (đã tính phẩm chất và cấp gia cường) + dòng thuộc tính phụ
  function chips(it){
    const d=info(it),s=Player.stat(it),o=[];
    if(s.atk)o.push(chip('sword','Công +'+s.atk));
    if(s.def)o.push(chip('shield','Thủ +'+s.def));
    if(s.hp)o.push(chip('heart','Máu +'+s.hp));
    if(s.mp)o.push(chip('spark','Mana +'+s.mp));
    if(d.element)for(const [k,v] of Object.entries(Player.bookStat(it)))o.push(chip(STAT_IC[k],STAT_NM[k]+' +'+v,EL[d.element].color));
    if(s.speed)o.push(chip('speed','Tốc ×'+s.speed));
    if(d.element)o.push(chip(EL[d.element].icon,elInfo(d.element),EL[d.element].color));
    if(d.grip==='two')o.push(chip('hand2','Hai tay'));
    if(d.beast)o.push(chip('spark',Player.BEASTS[d.beast].skill,'#ffe0a0'));
    for(const [k,v] of Object.entries(it.add||{}))o.push(`<i class="ch add">${addLine(k,v)}</i>`);
    return `<span class="chips">${o.join('')}</span>`;
  }
  const STAT_NM=Object.fromEntries(Player.GROUPS.map(g=>[g[0],g[1]])),STAT_IC=Object.fromEntries(Player.GROUPS.map(g=>[g[0],g[2]]));
  const C=Player.CFG,elInfo=e=>({fire:`+${C.hoa_sat_thuong}% sát thương`,water:`+${C.thuy_hoi_mana} mana/giây`,earth:`Phản ${C.tho_phan_don}% sát thương`,metal:`Giảm ${C.kim_giam_sat_thuong}% sát thương nhận`,wood:`+${C.moc_hoi_mau} máu/giây`})[e];
  function gainText(d){if(d.slot==='mount')return `Tốc +${Player.mountGain(1).speed}; từ +7 thêm Công; từ +11 thêm Máu, Mana, Thủ`;if(d.slot==='book')return 'chỉ số +'+Player.gainOf(d).stat;const g=Player.gainOf(d);return g.atk?'Công +2':g.def?'Thủ +1':g.speed?'Tốc +0.03':'';}
  function desc(it){
    const d=info(it);if(!d)return '';
    if(d.slot==='book')return `Gắn vào ô kỹ năng · nhiều sách cộng dồn chỉ số, hiệu ứng mỗi hệ tính một lần · luyện ở Đạo sĩ: ${gainText(d)}/cấp`;
    if(!d.slot)return 'Nguyên liệu, mang bán cho thợ rèn.';
    let t;
    if(d.slot==='mount')t=`Thú cưỡi · phím 4: ${Player.BEASTS[d.beast].skill} · cần ${d.cmd} Mệnh lệnh`;
    else if(d.slot==='hand'){const k=KIND_NAMES[d.kind];t=d.grip==='two'?k+' · cầm hai tay'+(d.kind==='crossbow'?' · bắn theo hướng chạy':''):k+' · một tay';}
    else t=SLOT_NAMES[d.slot];
    return t+(d.slot==='mount'?` · gia cường: ${gainText(d)}`:` · gia cường: ${gainText(d)}/cấp`);
  }
  function itemInfo(it){
    const d=info(it),R=Player.rar(it);let h=`<div class="sel-info"><b class="sel-name" style="color:${R.color}">${esc(Player.nameOf(it))}</b><small class="qtag" style="color:${R.color}">${R.name}${R.trade?' · bán được qua thương nhân':''}</small>${chips(it)}<small class="sel-desc">${desc(it)}</small>`;
    if(d.set){const S=Player.SETS[d.set],n=Player.derive(p).sets.find(x=>x.id===d.set);h+=`<small class="set-desc"><b>Bộ ${esc(S.name)} · ${esc(S.hero)}</b> (${n?n.n:0}/9) · ${d.gender==='f'?'nhân vật nữ':'nhân vật nam'}<br>${[3,5,7].map(t=>`<span class="${n&&n.n>=t?'on':''}">${t} món: ${Object.entries(S.tiers[t]).map(([k,v])=>addLine(k,v)).join(', ')}</span>`).join('<br>')}<br><span class="${n&&n.n>=9?'on':''}">9 món: ${esc(S.fxText)}</span></small>`;}
    if(d.fxText&&!d.set)h+=`<small class="set-desc"><b>${Player.FX_NAMES[d.fx]||''}</b>: ${esc(d.fxText)}</small>`;
    return h+'</div>';
  }
  const menu=$('#gameMenu');let lastExp='',lastFrame=-1,lastType='',selected=null,skillFocus=null,burstAt=-9,lastBuffs='',shopSel=null,enhSel=null,shopQ='n',previewWho=null,mercSel=null,lastGender='';
  function closeMenu(){menu.hidden=true;$('#settingsBtn').setAttribute('aria-expanded','false');}
  function closeModal(){$('#overlay').hidden=true;shopSel=null;previewWho=null;$('#scene').focus();}
  function openModal(titleHtml,content,wide=false){game.stop();game.closeDialog();closeMenu();$('#modalCard').classList.toggle('wide',wide);$('#overlayTitle').innerHTML=titleHtml;const keep=$('#overlay').hidden?0:$('#modalCard').scrollTop;$('#overlayBody').innerHTML=content;$('#overlay').hidden=false;$('#modalCard').scrollTop=keep;}
  function questHtml(){
    const s=game.seen.length,total=World.npcs.length;if(s<total)return svg('talk')+`Gặp dân làng ${s}/${total}`;
    const act=Object.entries(p.quests.active);
    if(act.length){const [id,n]=act[0],Q=Player.QUESTS[id];return svg('quest')+`${esc(Q.name)} ${Math.min(n,Q.count)}/${Q.count}`+(act.length>1?` <small>+${act.length-1}</small>`:'');}
    if(!p.flags.river)return svg('bridge')+'Qua cầu sang Đông Ngạn';
    return svg('quest')+'Gặp Lý trưởng nhận việc';
  }
  function refresh(){
    const D=game.HD,S=D.tot;
    $('#playerName').textContent=p.name;$('#levelBadge').textContent='Lv. '+p.level;
    const need=Player.expNeed(p.level),maxed=p.level>=Player.maxLevel(),pct=maxed?100:Math.min(100,(p.exp||0)/need*100),dash=pct.toFixed(1)+' 100';
    if(lastExp!==dash){lastExp=dash;$('#expArc').setAttribute('stroke-dasharray',dash);$('#avatarBtn').title=maxed?'Cấp tối đa':`Kinh nghiệm ${p.exp||0} / ${need}`;}
    $('#ptDot').hidden=!(p.points>0);
    $('#hpFill').style.width=(p.hp/S.hp*100)+'%';$('#hpText').textContent=Math.ceil(p.hp)+' / '+S.hp;
    $('#manaFill').style.width=(p.mana/S.mp*100)+'%';$('#manaText').textContent=Math.floor(p.mana)+' / '+S.mp;
    $('#passiveFill').style.width=p.passive+'%';$('#passiveText').textContent='★ '+Math.floor(p.passive)+'%';
    $('#skill-normal').classList.toggle('charged',p.passive>=100);
    const east=game.hero.x>(World.BRIDGE.x1+1)*World.T;
    $('#placeName').textContent=east?'Đông Ngạn':'Thanh Mộc';$('#placeCoord').textContent=Math.floor(game.hero.x/World.T)+', '+Math.floor(game.hero.y/World.T);
    $('#safeTag').hidden=!game.safe;
    const q=questHtml();if($('#questTrack').innerHTML!==q)$('#questTrack').innerHTML=q;
    const type=Player.stance(p).type;if(lastType!==type){$('#normalIcon').innerHTML=`<use href="#i-${type}"/>`;lastType=type;}
    const el=Player.element(p);$('#skill-normal').style.setProperty('--elem',el?EL[el].color:'#dfc480');
    const books=Object.keys(D.books),key=books.join();if(key!==lastBuffs){lastBuffs=key;$('#buffs').innerHTML=books.map(b=>`<span class="buff" style="color:${EL[b].color}" title="${EL[b].name}: ${elInfo(b)}">${svg(EL[b].icon)}</span>`).join('');}
    const md=p.equipment.mount&&info(p.equipment.mount),mb=$('#skill-mount');mb.hidden=!md||game.safe;
    if(md&&mb.dataset.beast!==md.beast){mb.dataset.beast=md.beast;const B=Player.BEASTS[md.beast];$('#mountIcon').innerHTML=`<use href="#i-${B.icon}"/>`;$('#mountName').textContent=B.skill;mb.title='4 · '+B.skill+' · 12 mana';}
    document.querySelectorAll('.skill-wheel .skill:not(.normal)').forEach(b=>b.classList.toggle('locked',game.safe));
    if(lastGender!==p.gender){lastGender=p.gender;$('#pfHair').style.display=p.gender==='f'?'':'none';$('#pfYem').style.display=p.gender==='f'?'':'none';}
  }
  /* ---------- Bảng thuộc tính: 5 chỉ số lớn, chỉ số nhỏ chỉ hiện khi có cộng thêm ---------- */
  function showAttributes(){
    const D=game.HD,S=D.tot,A=D.add;
    const rows=Player.GROUPS.map(([g,name,ic])=>{
      const baseKey={str:'strength',agi:'agility',vit:'vitality',int:'intelligence',cmd:'command'}[g],plus=A[g]||0;
      const subs=Object.entries(Player.ADD).filter(([k,a])=>a.group===g&&k!==g&&(A[k]||0)>0).map(([k,a])=>`<div class="sub"><span>${a.name}</span><b>${S[k]}${a.unit}</b><em>+${Math.round(A[k]*10)/10}${a.unit}</em></div>`).join('');
      const extra=g==='vit'?`<div class="sub base"><span>Máu tối đa</span><b>${S.hp}</b></div>`:g==='int'?`<div class="sub base"><span>Mana tối đa</span><b>${S.mp}</b></div>`:g==='cmd'?`<div class="sub base"><span>Đang dùng</span><b>${(p.equipment.mount&&info(p.equipment.mount)?info(p.equipment.mount).cmd:0)+(p.activeMerc!=null?p.mercs[p.activeMerc].cmd:0)}</b></div>`:'';
      const al=baseKey!=='command'?(p.alloc&&p.alloc[baseKey])||0:0,addBtn=p.points>0&&g!=='cmd'?`<button class="pt-add" data-pt="${g}">+1</button>${p.points>=5?`<button class="pt-add" data-pt="${g}" data-n="5">+5</button>`:''}`:'';
      return `<div class="attr"><div class="main">${svg(ic)}<span>${name}</span><b>${D.main[g]}</b>${plus?`<em>+${plus}</em>`:''}${al?`<em title="Điểm đã cộng" style="color:#ffd98a">+${al}</em>`:''}${addBtn}</div>${extra}${subs}</div>`;
    }).join('');
    const sets=D.sets.map(x=>{const S2=Player.SETS[x.id];return chip('quest',`Bộ ${S2.name} ${x.n}/9`,Player.RAR.l.color);}).join('');
    const fxs=Object.entries(D.fx).map(([k,v])=>chip('spark',Player.FX_NAMES[k]+' '+v,Player.RAR.m.color)).join('');
    const books=Object.keys(D.books).map(b=>chip(EL[b].icon,EL[b].name+': '+elInfo(b),EL[b].color)).join('');
    const need=Player.expNeed(p.level),maxed=p.level>=Player.maxLevel();
    const xp=`<div class="exp-line">${svg('spark')}<span>Kinh nghiệm</span><span class="xb"><i style="width:${maxed?100:Math.min(100,(p.exp||0)/need*100)}%"></i></span><b>${maxed?'Tối đa':`${p.exp||0} / ${need}`}</b></div>`;
    const pts=p.points>0?`<div class="pts">${svg('check')}<span>Điểm cộng chưa dùng</span><b>${p.points}</b></div>`:'';
    openModal(ttl('user','Thuộc tính'),`<div class="attr-head"><b>${esc(p.name)}</b><small>${p.gender==='f'?'Nữ':'Nam'} · Lv. ${p.level}</small></div>${xp}${pts}<div class="attr-list">${rows}</div>${sets||fxs||books?`<span class="chips" style="justify-content:flex-start;margin-top:8px">${sets}${fxs}${books}</span>`:''}`);
    document.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>run(b,game.op({t:'pt',k:b.dataset.pt,n:Number(b.dataset.n||1)}).then(()=>{game.refreshHD();showAttributes();})));
  }
  function previewElem(){const sel=selected!==null?p.bag[selected]:null;if(info(sel)&&info(sel).element)return info(sel).element;const f=skillFocus!==null?p.skillSlots[skillFocus]:null;if(info(f)&&info(f).element)return info(f).element;return Player.element(p);}
  const slotHtml=(who,slot,canFn)=>{
    let it=who.equipment[slot],locked=false;if(slot==='left'&&Player.isTwo(who.equipment.right)){it=who.equipment.right;locked=true;}
    const type=it?it.type:slot==='left'?'shield':slot==='right'?'sword':slot,label=it?Player.nameOf(it):SLOT_NAMES[slot],can=canFn&&canFn(slot);
    return `<button class="equipment-slot${locked?' locked':''}${can?' can':''}${it?' has':''}" data-slot="${slot}" title="${esc(label)}" style="${it&&Player.qOf(it)!=='n'?`border-color:${qColor(it)}`:''}"><span style="color:${it?(tintOf(it)||'#e4cc8d'):'#4f6452'}">${icon(type)}</span><small class="slot-label" style="${it?`color:${qColor(it)}`:''}">${esc(label)}</small>${locked?'':lvb(it)}${locked?`<span class="lock">${svg('lock')}</span>`:''}</button>`;
  };
  const bagHtml=(filter)=>p.bag.map((it,i)=>{const ok=!filter||!it||filter(it);return `<button data-bag="${i}" class="bag-slot${i===selected?' selected':''}${ok?'':' dim'}" title="${it?esc(Player.nameOf(it)):''}" style="${it&&Player.qOf(it)!=='n'?`border-color:${qColor(it)}`:''}">${it?icon(it.type,tintOf(it)):''}${lvb(it)}${it?qdot(it):''}</button>`;}).join('');
  function renderBag(){
    previewWho=null;
    const sel=selected!==null?p.bag[selected]:null,sd=info(sel),tg=sel?Player.targets(p,sel):[],st=Player.stance(p),D=game.HD;
    const equip=Player.slots.map(slot=>slotHtml(p,slot,s=>sel&&(tg.includes(s)||(sd&&sd.grip==='two'&&s==='left')))).join('');
    const skillSlots=p.skillSlots.map((it,i)=>`<button class="skill-slot${it?'':' empty'}${p.activeBook===i?' active':''}${skillFocus===i?' focus':''}" data-skillslot="${i}" title="${it?esc(info(it).name):'Ô kỹ năng trống'}">${it?`<span style="color:${tintOf(it)}">${svg(EL[info(it).element].icon)}</span>`:svg('book')}</button>`).join('');
    const money=Player.money(p.copper);
    let bar='';
    if(sel){
      bar=`<span class="big" style="color:${tintOf(sel)||'#e4cc8d'}">${icon(sel.type)}</span>${itemInfo(sel)}`+(sd.slot==='book'?`<button class="primary" data-act="book">${svg('book')}Gắn sách</button>`:'')+`<button data-act="clear">${svg('close')}Bỏ chọn</button>`;
      if(tg.length)bar=bar.replace('</small></div>',' · chạm ô sáng để mặc</small></div>');
    }else if(skillFocus!==null&&p.skillSlots[skillFocus]){
      const it=p.skillSlots[skillFocus],on=p.activeBook===skillFocus;
      bar=`<span class="big" style="color:${tintOf(it)}">${svg(EL[info(it).element].icon)}</span><div class="sel-info"><b class="sel-name">${esc(info(it).name)}</b>${chips(it)}<small class="sel-desc">Đang gắn · hào quang ${on?'bật':'tắt'}</small></div><button class="primary" data-act="toggle">${svg('eye')}${on?'Tắt':'Bật'} hào quang</button><button data-act="remove">${svg('out')}Tháo</button><button data-act="clear">${svg('close')}Bỏ chọn</button>`;
    }
    openModal(ttl('bag','Túi đồ'),`<div class="bag-layout"><section><div class="equip-head"><canvas id="preview"></canvas><div><span class="chips" style="justify-content:flex-start">${chip(st.type,KIND_NAMES[st.type]+(st.dual?' đôi':''))}${chip('sword',`Sát thương ${D.tot.dmgMin}–${D.tot.dmgMax}`)}${chip('shield','Phòng ngự '+D.tot.def)}</span>${D.sets.length?`<span class="chips" style="justify-content:flex-start;margin-top:4px">${D.sets.map(x=>chip('quest',`${Player.SETS[x.id].hero} ${x.n}/9`,Player.RAR.l.color)).join('')}</span>`:''}</div></div><div class="equip-grid">${equip}</div><div class="gap"></div><div class="skill-grid">${skillSlots}</div></section><section><div class="bag-grid">${bagHtml()}</div><div class="money"><span class="coin gold"><i></i>${money.gold}</span><span class="coin silver"><i></i>${money.silver}</span><span class="coin"><i></i>${money.copper}</span>${ruby(p.rubies)}</div></section></div>${bar?`<div class="sel-bar">${bar}</div>`:''}`,true);
    const act=fn=>{try{fn();game.refreshHD();refresh();renderBag();}catch(err){fail(err);}};
    document.querySelectorAll('[data-bag]').forEach(btn=>btn.onclick=()=>{const i=Number(btn.dataset.bag);skillFocus=null;if(!p.bag[i]||selected===i){selected=null;}else{selected=i;if(info(p.bag[i]).element)burstAt=game.now();}renderBag();});
    document.querySelectorAll('[data-slot]').forEach(btn=>btn.onclick=()=>act(()=>{
      const slot=btn.dataset.slot;
      if(selected===null){Player.unequip(p,slot);return;}
      const item=p.bag[selected],d=info(item),t=Player.targets(p,item);let dest=slot;
      if(d.gender&&d.gender!==p.gender)throw Error('GENDER');
      if(d.grip==='two'&&(slot==='left'||slot==='right'))dest='right';
      if(!t.includes(dest))throw Error(d.slot==='hand'?'PAIR':'SLOT');
      Player.equip(p,selected,dest);selected=null;
    }));
    document.querySelectorAll('[data-skillslot]').forEach(btn=>btn.onclick=()=>act(()=>{
      const i=Number(btn.dataset.skillslot);
      if(selected!==null&&info(p.bag[selected]).slot==='book'){Player.setSkill(p,selected,i);selected=null;skillFocus=i;game.activateBurst(Player.element(p));burstAt=game.now();return;}
      selected=null;if(!p.skillSlots[i]){skillFocus=null;return;}
      skillFocus=i;if(p.activeBook!==i){p.activeBook=i;game.activateBurst(Player.element(p));burstAt=game.now();}
    }));
    document.querySelectorAll('[data-act]').forEach(btn=>btn.onclick=()=>act(()=>{
      const a=btn.dataset.act;
      if(a==='book'){Player.setSkill(p,selected,null);skillFocus=p.activeBook;selected=null;game.activateBurst(Player.element(p));burstAt=game.now();}
      else if(a==='toggle'){Player.toggleBook(p,skillFocus);if(p.activeBook===skillFocus){game.activateBurst(Player.element(p));burstAt=game.now();}}
      else if(a==='remove'){Player.unsetSkill(p,skillFocus);skillFocus=null;}
      else{selected=null;skillFocus=null;}
    }));
  }
  /* ---------- Cửa hàng + gia cường ---------- */
  const RATE_NOTE=lv=>{if(lv>=Player.MAX_LV)return 'Đã đạt cấp tối đa';const r=Player.enhRate(lv);if(r>=1)return 'Chắc chắn thành công';return lv<10?'Thất bại: cấp về ngẫu nhiên +0 đến +6':'Thất bại: cấp về +6';};
  const ENH_OK={smith:d=>d.slot!=='book',trainer:d=>d.slot==='mount',wizard:d=>d.slot==='book'};
  function enhList(id){const ok=ENH_OK[id]||(()=>true);return [...Player.slots.map(sl=>({where:'eq',key:sl,it:p.equipment[sl]})),...p.skillSlots.map((it,i)=>({where:'sk',key:i,it})),...p.bag.map((it,i)=>({where:'bag',key:i,it}))].filter(r=>Player.canEnhance(r.it)&&ok(info(r.it)));}
  function enhHtml(id){
    const list=enhList(id);
    if(!list.length)return `<div class="shop-empty">${svg('anvil')}<span>Chưa có món đồ để gia cường</span></div>`;
    let cur=enhSel&&list.find(r=>r.where===enhSel.where&&String(r.key)===String(enhSel.key));if(!cur){cur=list[0];enhSel={where:cur.where,key:cur.key};}
    const it=cur.it,lv=it.lv||0,max=lv>=Player.MAX_LV,rate=Player.enhRate(lv),cost=Player.enhCost(lv),next={...it,lv:lv+1};
    const tiles=list.map(r=>`<button class="mini${r===cur?' sel':''}" data-enh="${r.where}:${r.key}" title="${esc(Player.nameOf(r.it))}" style="${Player.qOf(r.it)!=='n'?`border-color:${qColor(r.it)}`:''}"><span style="color:${tintOf(r.it)||'#e4cc8d'}">${icon(r.it.type)}</span>${lvb(r.it)}${r.where!=='bag'?'<small class="worn">Đang dùng</small>':''}</button>`).join('');
    return `<div class="enh"><div class="enh-list">${tiles}</div><div class="enh-box"><div class="enh-top"><span class="big" style="color:${tintOf(it)||'#e4cc8d'}">${icon(it.type)}</span><div><b class="sel-name" style="color:${qColor(it)}">${esc(Player.nameOf(it))}</b>${chips(it)}</div></div>
      ${max?'':`<div class="enh-next">${svg('next')}<b>+${lv+1}</b>${chips({...next,add:{}})}</div>`}
      <div class="enh-rows"><div><small>Tỉ lệ</small><b>${max?'—':Math.round(rate*100)+'%'}</b></div><div><small>Phí</small><b>${max?'—':ruby(cost)}</b></div><div><small>Hồng ngọc</small><b>${ruby(p.rubies)}</b></div></div>
      <small class="sel-desc">${RATE_NOTE(lv)} · ${info(it).slot==='mount'?gainText(info(it)):'Mỗi cấp: '+gainText(info(it))}</small>
      <button id="enhGo" class="primary big-btn"${max?' disabled':''}>${svg(id==='wizard'?'book':'anvil')}${id==='wizard'?'Luyện sách':'Gia cường'}</button></div></div>`;
  }
  function showShop(id,tab='buy'){
    const list=Player.SHOPS[id]||[],META={smith:{icon:'sword',title:'Lò rèn',enh:'Gia cường'},trainer:{icon:'mount',title:'Thú cưỡi',enh:'Nâng thú'},wizard:{icon:'book',title:'Sách ngũ hành',enh:'Luyện sách'}}[id]||{icon:'bag',title:'Cửa hàng'};
    if(tab==='enh'&&!META.enh)tab='buy';
    const qs=[...new Set(list.flatMap(r=>r.q))],full=p.bag.indexOf(null)<0;if(!qs.includes(shopQ))shopQ=qs[0]||'n';
    const tile=(attr,type,it,price,go,goTxt,off,sel)=>`<button class="tile${off?' off':''}${sel?' sel':''}" ${attr} title="${esc(desc(it))}" style="${Player.qOf(it)!=='n'?`border-color:${qColor(it)}`:''}"><span class="ti" style="color:${tintOf(it)||'#e4cc8d'}">${icon(type)}</span>${lvb(it)}<b class="nm" style="color:${qColor(it)}">${esc(Player.nameOf(it))}</b>${chips(it)}<span class="price">${coins(price)}</span><span class="go">${svg(go)}${goTxt}</span></button>`;
    let body;
    if(tab==='buy'){
      const qbar=qs.length>1?`<div class="qbar">${qs.map(q=>`<button data-q="${q}" class="${q===shopQ?'on':''}" style="color:${Player.RAR[q].color}">${Player.RAR[q].name}</button>`).join('')}${shopQ!=='n'?`<small>Mỗi món có ${Player.RAR[shopQ].lines} dòng thuộc tính ngẫu nhiên</small>`:''}</div>`:'';
      body=qbar+`<div class="shop-grid">${list.filter(r=>r.q.includes(shopQ)).map(r=>{const price=Player.shopPrice(r.id,shopQ),it={type:r.id,q:shopQ};return tile(`data-buy="${r.id}"`,r.id,it,price,'bag','Mua',p.copper<price||full,shopSel===r.id);}).join('')}</div>`;
    }
    else if(tab==='sell'){const t=p.bag.map((it,i)=>it?tile(`data-sell="${i}"`,it.type,it,Player.sellPrice(it),'coin','Bán',false,shopSel===String(i)):'').join('');body=`<div class="shop-grid">${t||`<div class="shop-empty">${svg('bag')}<span>Túi trống</span></div>`}</div>`;}
    else body=enhHtml(id);
    const tabs=[['buy',META.icon,'Mua'],['sell','coin','Bán'],...(META.enh?[['enh',id==='wizard'?'book':'anvil',META.enh]]:[])];
    openModal(`<div class="shop-tabs">${tabs.map(([k,ic,tx])=>`<button data-tab="${k}" class="${tab===k?'on':''}">${svg(ic)}${tx}</button>`).join('')}</div><div class="purse">${coins(p.copper)}${ruby(p.rubies)}</div>`,`<div class="shop-sub">${svg(META.icon)}${META.title}${tab==='enh'?'':' · chạm 2 lần để '+(tab==='buy'?'mua':'bán')}</div>${body}`,true);
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{shopSel=null;showShop(id,b.dataset.tab);});
    document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{shopQ=b.dataset.q;shopSel=null;showShop(id,'buy');});
    document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const type=b.dataset.buy;if(shopSel!==type){shopSel=type;showShop(id,'buy');return;}run(b,game.op({t:'buy',type,q:shopQ}).then(r=>{game.message(svg('check')+`Đã mua <b style="color:${qColor(r.item)}">${esc(Player.nameOf(r.item))}</b>`);shopSel=null;showShop(id,'buy');}));});
    document.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{const i=b.dataset.sell;if(shopSel!==i){shopSel=i;showShop(id,'sell');return;}run(b,game.op({t:'sell',i:Number(i)}).then(r=>{game.message(svg('coin')+'Đã bán '+esc(Player.nameOf(r.item))+' '+coins(r.v));shopSel=null;showShop(id,'sell');}));});
    document.querySelectorAll('[data-enh]').forEach(b=>b.onclick=()=>{const [w,k]=b.dataset.enh.split(':');enhSel={where:w,key:w==='eq'?k:Number(k)};showShop(id,'enh');});
    const go=$('#enhGo');if(go)go.onclick=()=>{const t0=Date.now();const cur=enhSel.where==='sk'?p.skillSlots[enhSel.key]:enhSel.where==='bag'?p.bag[enhSel.key]:p.equipment[enhSel.key],ce=info(cur)&&info(cur).element;go.innerHTML=svg(id==='wizard'?'book':'anvil')+(id==='wizard'?'Đang luyện':'Đang rèn')+'…';game.hammer(ce?EL[ce].color:null);run(go,game.op(enhSel.where==='sk'?{t:'enhSk',key:enhSel.key}:{t:'enh',where:enhSel.where==='bag'?'bag':'eq',key:enhSel.key}).then(r=>new Promise(ok=>setTimeout(()=>ok(r),Math.max(0,1300-(Date.now()-t0))))).then(r=>{const name=info(r.item).name;game.enhanceFx(r.ok);game.message(r.ok?svg('check')+`Thành công! ${esc(name)} +${r.to}`:svg('close')+`Thất bại\u{2026} ${esc(name)} về +${r.to}`);showShop(id,'enh');}),()=>showShop(id,'enh'));};
  }
  /* ---------- Lý trưởng: bảng nhiệm vụ ---------- */
  function rewardChips(Q){const o=[];if(Q.copper)o.push(`<i class="ch">${coins(Q.copper)}</i>`);if(Q.rubies)o.push(`<i class="ch">${ruby(Q.rubies)}</i>`);if(Q.item&&Player.items[Q.item]){const it={type:Q.item,q:Q.itemQ};o.push(`<i class="ch" style="color:${qColor(it)}">${icon(Q.item)}${esc(Player.items[Q.item].name)} · ${Player.RAR[Q.itemQ||'n'].name}</i>`);}return o.join('');}
  function showQuestBoard(){
    const rows=Object.values(Player.QUESTS).map(Q=>{
      const n=p.quests.active[Q.id],done=p.quests.done[Q.id]||0,M=Player.MON[Q.target],act=n!=null,ready=act&&n>=Q.count;
      const btn=ready?`<button class="primary" data-turnin="${Q.id}">${svg('check')}Trả việc</button>`:act?`<span class="qprog">${n}/${Q.count}</span>`:(!Q.repeat&&done)?`<span class="qprog">Đã xong</span>`:`<button data-accept="${Q.id}">${svg('next')}Nhận</button>`;
      return `<div class="qrow${act?' act':''}">${svg(M&&['deer','lion','elephant','croc'].includes(Q.target)?Q.target:'flag')}<div><b>${esc(Q.name)}</b><small>${esc(Q.desc)} · ${M?esc(M.name):''} ×${Q.count}${done?` · đã làm ${done} lần`:''}</small><span class="chips">${rewardChips(Q)}</span></div>${btn}</div>`;
    }).join('');
    openModal(ttl('quest','Lý trưởng giao việc'),`<small class="sel-desc">Nhận tối đa ${Player.MAX_ACTIVE_QUEST} việc cùng lúc. Xong việc quay về gặp Lý trưởng để nhận thưởng.</small><div class="quest-rows" style="margin-top:8px">${rows}</div>`,true);
    document.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>run(b,game.op({t:'qa',id:b.dataset.accept}).then(()=>showQuestBoard())));
    document.querySelectorAll('[data-turnin]').forEach(b=>b.onclick=()=>run(b,game.op({t:'qt',id:b.dataset.turnin}).then(r=>{game.message(svg('check')+'Nhận thưởng'+(r.copper?' '+coins(r.copper):'')+(r.rubies?' '+ruby(r.rubies):'')+(r.exp?' · +'+r.exp+' kinh nghiệm':'')+(r.item?` \u{00b7} <b style="color:${qColor(r.item)}">${esc(Player.nameOf(r.item))}</b>`:''));if(r.up)game.levelUp(r.up);showQuestBoard();})));
  }
  /* ---------- Người dẫn đường: lính đánh thuê ---------- */
  const statLine=st=>`<small class="sel-desc">Sức mạnh ${st.strength} · Nhanh nhẹn ${st.agility} · Sức khỏe ${st.vitality} · Trí tuệ ${st.intelligence}</small>`;
  const gearIcons=eq=>Player.slots.map(k=>eq&&eq[k]&&info(eq[k])?`<span title="${esc(Player.nameOf(eq[k]))}" style="color:${qColor(eq[k])}">${icon(eq[k].type)}</span>`:'').join('');
  function showMercBoard(tab='hire'){
    const tabs=`<div class="shop-tabs"><button data-mt="hire" class="${tab==='hire'?'on':''}">${svg('user')}Thuê lính</button><button data-mt="mine" class="${tab==='mine'?'on':''}">${svg('flag')}Lính của tôi (${p.mercs.length}/${Player.MAX_MERC})</button></div><div class="purse">${coins(p.copper)}</div>`;
    let body='';
    if(tab==='hire'){
      const npc=Object.values(Player.MERCS).map(M=>`<div class="mrow"><span class="mg">${M.gender==='f'?'Nữ':'Nam'}</span><div><b>${esc(M.name)}</b><small class="sel-desc">${esc(M.desc||'')} · cần ${M.cmd} Mệnh lệnh</small>${statLine(M.stats)}</div><button data-hire="${M.id}"${p.copper<M.price?' disabled':''}>${coins(M.price)}Thuê</button></div>`).join('');
      body=`<h4 class="sec">Lính trong vùng</h4>${npc}<div class="cho-note">${svg('user')}<span>Muốn có nhân vật của người chơi khác đi theo? Mua ở <b>Chợ phiên</b>.</span>${choBtn()}</div>`;
    }else{
      const m=mercSel!=null?p.mercs[mercSel]:null;
      const list=p.mercs.map((M,i)=>`<div class="mrow${p.activeMerc===i?' act':''}${mercSel===i?' sel':''}"><span class="mg">${M.gender==='f'?'Nữ':'Nam'}</span><div><b>${esc(M.name)}</b>${p.activeMerc===i?'<small class="qtag" style="color:#9fe8a8">Đang đi theo</small>':''}<span class="gear">${gearIcons(M.equipment)}</span><small class="sel-desc">Cần ${M.cmd} Mệnh lệnh</small></div><span class="mbtns"><button data-follow="${i}">${p.activeMerc===i?'Cho nghỉ':'Đi theo'}</button><button data-gear="${i}">Đồ</button><button data-dismiss="${i}">Giải tán</button></span></div>`).join('')||'<small class="sel-desc">Chưa có lính. Qua mục Thuê lính để thuê.</small>';
      let gear='';
      if(m){previewWho={equipment:m.equipment,gender:m.gender,stats:m.stats};const P2={equipment:m.equipment,gender:m.gender,isMerc:true};
        gear=`<div class="mgear"><div class="equip-head"><canvas id="preview"></canvas><div><b>${esc(m.name)}</b><small class="sel-desc">Chạm ô trang bị của lính để lấy về túi. Chạm đồ trong túi để mặc cho lính.</small></div></div><div class="equip-grid">${Player.slots.map(k=>slotHtml(m,k)).join('')}</div><div class="bag-grid" style="margin-top:8px">${bagHtml(it=>Player.targets(P2,it).length>0)}</div></div>`;}
      else previewWho=null;
      body=`<div class="mlist">${list}</div>${gear}`;
    }
    openModal(tabs,body,true);
    document.querySelectorAll('[data-mt]').forEach(b=>b.onclick=()=>{mercSel=null;showMercBoard(b.dataset.mt);});
    document.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>run(b,game.op({t:'hire',id:b.dataset.hire}).then(r=>{const i=p.mercs.findIndex(m=>m.mid===r.mid);if(p.activeMerc==null&&i>=0){try{Player.setActiveMerc(p,i);}catch(e){}}game.syncMerc();game.message(svg('check')+'Đã thuê '+esc(r.name));game.save();showMercBoard('mine');})));
    document.querySelectorAll('[data-follow]').forEach(b=>b.onclick=()=>{try{const i=Number(b.dataset.follow);Player.setActiveMerc(p,p.activeMerc===i?null:i);game.syncMerc();refresh();showMercBoard('mine');}catch(e){fail(e);}});
    document.querySelectorAll('[data-gear]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.gear);mercSel=mercSel===i?null:i;showMercBoard('mine');});
    document.querySelectorAll('[data-dismiss]').forEach(b=>b.onclick=()=>run(b,game.op({t:'dismiss',i:Number(b.dataset.dismiss)}).then(()=>{mercSel=null;game.syncMerc();showMercBoard('mine');})));
    if(tab==='mine'&&mercSel!=null){
      document.querySelectorAll('.mgear [data-slot]').forEach(b=>b.onclick=()=>{try{Player.mercUnequip(p,mercSel,b.dataset.slot);game.syncMerc();showMercBoard('mine');}catch(e){fail(e);}});
      document.querySelectorAll('.mgear [data-bag]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.bag),it=p.bag[i];if(!it)return;const m=p.mercs[mercSel],t=Player.targets({equipment:m.equipment,gender:m.gender,isMerc:true},it);if(!t.length)return fail(Error(info(it).gender?'GENDER':'SLOT'));try{Player.mercEquip(p,mercSel,i,t.includes('right')&&!m.equipment.right?'right':t[0]);game.syncMerc();showMercBoard('mine');}catch(e){fail(e);}});
    }
  }
  /* ---------- Thương nhân: mua bán giữa người chơi diễn ra ở trang Chợ phiên riêng ---------- */
  const choUrl=()=>String(window.LH_CHO||Player.CFG.link_cho_phien||'').trim();
  const choBtn=()=>choUrl()?`<a class="cho-go" href="${esc(choUrl())}" target="_blank" rel="noopener">${svg('next')}Ra Chợ phiên</a>`:'';
  function showMarket(){
    openModal(ttl('coin','Thương nhân'),`<div class="cho-card">${svg('coin')}<div><b>Chợ phiên</b><p>Mua bán đồ <b style="color:${Player.RAR.p.color}">${Player.RAR.p.name}</b>, <b style="color:${Player.RAR.m.color}">${Player.RAR.m.name}</b> với người chơi khác, thuê hoặc mua nhân vật của người khác về đi theo, nhận tiền bán hàng.</p><p class="sel-desc">Đồ trong túi và tiền của nhân vật được giữ trên máy chủ, ra chợ đăng nhập cùng tài khoản là thấy ngay.</p></div></div>${choBtn()||'<small class="sel-desc">Chưa có địa chỉ Chợ phiên (khóa link_cho_phien trong Sheet cấu hình).</small>'}`);
  }
  function showQuests(){
    const s=game.seen,k=p.flags.kills,row=(id,label,html)=>`<div class="qrow">${svg(id)}<div><b>${label}</b><span class="chips">${html}</span></div></div>`;
    const met=World.npcs.map(n=>chip(s.includes(n.id)?'check':'user',esc(n.name),s.includes(n.id)?'#9fe8a8':'')).join('');
    const names={deer:'Hươu',lion:'Sư tử',elephant:'Voi',croc:'Cá sấu'};
    const hunt=Object.keys(names).map(t=>chip(t,names[t]+' '+(k[t]||0),k[t]?'#9fe8a8':'')).join('');
    const act=Object.entries(p.quests.active).map(([id,n])=>{const Q=Player.QUESTS[id];return row('quest',esc(Q.name)+` (${Math.min(n,Q.count)}/${Q.count})`,rewardChips(Q));}).join('');
    const first=(s.length<World.npcs.length?row('talk',`Gặp dân làng (${s.length}/${World.npcs.length})`,met):'')+(p.flags.river?'':row('bridge','Qua cầu sang Đông Ngạn',chip('next','Chưa qua')))+(p.flags.hunted?'':row('bow','Săn mỗi loài một con · thưởng 1 bạc',hunt));
    openModal(ttl('quest','Nhiệm vụ'),`<div class="quest-rows">${act}${first||(act?'':`<div class="qdone">${svg('check')}<span>Đã xong việc làng. Gặp Lý trưởng nhận việc mới.</span></div>`)}</div>`);
  }
  function openPanel(n){
    if(n.panel==='shop')return showShop(n.shop);
    if(n.panel==='quests')return showQuestBoard();
    if(n.panel==='mercs')return showMercBoard('hire');
    if(n.panel==='market')return showMarket();
  }
  async function save(){closeMenu();const ok=await game.save();game.message(ok?svg('save')+'Đã lưu':svg('close')+'Không lưu được');}
  $('#avatarBtn').onclick=showAttributes;
  $('#settingsBtn').onclick=()=>{menu.hidden=!menu.hidden;$('#settingsBtn').setAttribute('aria-expanded',String(!menu.hidden));};
  $('#saveBtn').onclick=save;$('#homeBtn').onclick=()=>{closeMenu();closeModal();game.home();refresh();};
  $('#questBtn').onclick=showQuests;$('#bagBtn').onclick=()=>{selected=null;skillFocus=null;renderBag();};
  $('#switchBtn').onclick=async()=>{closeMenu();await game.save();location.reload();};
  $('#closeOverlay').onclick=closeModal;$('#overlay').onclick=evt=>{if(evt.target.id==='overlay')closeModal();};
  document.querySelectorAll('[data-skill]').forEach(btn=>{
    const id=btn.dataset.skill,up=()=>{btn.classList.remove('pressed');if(id==='normal')game.setHold(false);};
    btn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();closeMenu();btn.classList.add('pressed');game.cast(id);if(id==='normal')game.setHold(true);try{btn.setPointerCapture(e.pointerId);}catch(_){}});
    btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);
    btn.addEventListener('contextmenu',e=>e.preventDefault());btn.addEventListener('click',e=>e.preventDefault());
  });
  document.addEventListener('pointerdown',evt=>{if(!menu.hidden&&!menu.contains(evt.target)&&!$('#settingsBtn').contains(evt.target))closeMenu();});
  document.addEventListener('keydown',evt=>{if(evt.key==='Escape'){closeMenu();closeModal();}});
  window.GameUI={refresh,showAttributes,openPanel,showShop:(id,tab)=>{shopSel=null;showShop(id,tab);},showQuestBoard,showMercBoard,showMarket,showQuests,save,previewElem,previewWho:()=>previewWho,previewBurst:()=>burstAt,
    showBag:()=>{if($('#overlay').hidden){selected=null;skillFocus=null;renderBag();}else closeModal();},
    frame(time,st){
      if(time-lastFrame<.1)return;lastFrame=time;refresh();const now=Date.now();
      for(const [id,skill] of Object.entries(Player.skills)){const remaining=Math.max(0,(p.cooldowns[id]||0)-now),span=$('#skill-'+id+' .cooldown');if(!span)continue;span.style.setProperty('--progress',Math.min(100,remaining/skill.cooldown*100)+'%');span.textContent=remaining>0&&id!=='normal'?String(Math.ceil(remaining/1000)):'';}
      const bb=$('#bossBar');if(st&&st.boss){bb.hidden=false;bb.classList.toggle('final',st.boss.final);$('#bossName').textContent=st.boss.name;$('#bossFill').style.width=(st.boss.hp/st.boss.max*100)+'%';$('#bossHp').textContent=Math.max(0,Math.ceil(st.boss.hp))+' / '+st.boss.max;}else bb.hidden=true;
    }};
  refresh();
};
