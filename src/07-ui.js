/* ================= GIAO DIỆN TRONG GAME ================= */
window.startUI=(session)=>{
  const $=s=>document.querySelector(s),game=window.mapGame,p=game.player,info=Player.info,EL=Player.ELEMENTS,svg=game.svg;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tintOf=it=>{const d=info(it);return d?(d.element?EL[d.element].color:d.tint||null):null;};
  const qColor=it=>Player.rar(it).color;
  const icon=(type,color)=>{const d=Player.items[type],id=d?(d.icon||d.kind):type;return LH_IMG.icon('vat_pham:'+type,id,color);};
  const coins=c=>{const m=Player.money(c),out=[];if(m.gold)out.push(`<span class="coin gold"><i></i>${m.gold}</span>`);if(m.silver)out.push(`<span class="coin silver"><i></i>${m.silver}</span>`);if(m.copper||!out.length)out.push(`<span class="coin"><i></i>${m.copper}</span>`);return out.join('');};
  const ruby=n=>`<span class="coin ruby"><i></i>${n}</span>`;
  const chip=(id,txt,color)=>`<i class="ch"${color?` style="color:${color}"`:''}>${svg(id)}${txt}</i>`;
  const lvb=it=>it&&it.lv?`<b class="lvb">+${it.lv}</b>`:'';
  const qdot=it=>{const q=Player.qOf(it);return q!=='n'?`<i class="qd" style="background:${qColor(it)}"></i>`:'';};
  const SLOT_NAMES={mount:'Thú cưỡi',hat:'Mũ',wings:'Cánh',left:'Tay trái',armor:'Áo giáp',right:'Tay phải',gloves:'Găng tay',pants:'Quần',shoes:'Giày'};
  const KIND_NAMES={sword:'Kiếm',shield:'Khiên',staff:'Gậy phép',bow:'Cung',spear:'Thương',crossbow:'Nỏ',punch:'Tay không'};
  const ERR={BAG_FULL:'Túi đầy',PAIR:'Không cầm chung được',MONEY:'Không đủ tiền',SLOT:'Không mặc vào ô này được',RUBY:'Không đủ hồng ngọc',MAX:'Đã tối đa +15',BOOK:'Không phải sách',ITEM:'Món này không làm được việc này',GENDER:'Đồ này dành cho nhân vật khác giới',CMD:'Không đủ Mệnh lệnh',QUEST_FULL:'Chỉ nhận tối đa 3 việc cùng lúc',QUEST_HAVE:'Đã nhận việc này',QUEST_NOT_DONE:'Chưa làm xong',QUEST_DONE:'Việc này chỉ làm một lần',MERC_FULL:'Tối đa 3 lính đánh thuê',MERC:'Không tìm thấy lính',POINTS:'Không đủ điểm',STAT:'Chỉ số không hợp lệ',MERC_DOWN:'Lính đang chờ ở làng, về làng để dắt đi',SHOP:'Món này gia cường ở chỗ khác',PET:'Không tìm thấy quái',LEVEL:'Chưa đủ cấp'};
  const fail=err=>game.message(svg('close')+(ERR[err.message]||netMsg(err)));
  // Chạy lệnh máy chủ: khóa nút trong lúc chờ, báo lỗi nếu có
  const run=(btn,pr,after)=>{if(btn){btn.disabled=true;btn.classList.add('busy');}return pr.then(()=>refresh(),e=>{fail(e);if(btn){btn.disabled=false;btn.classList.remove('busy');}after&&after();});};
  // dân làng Thanh Mộc (việc đầu tiên: gặp đủ dân làng), dù nhân vật đang ở bản đồ khác
  // biểu tượng mặc định của từng loài quái (khi Sheet Hình ảnh chưa có ảnh)
  const MON_IC={deer:'deer',lion:'lion',elephant:'elephant',croc:'croc','chua-son-lam':'tiger','ngu-tinh':'water','bo-cap':'earth','ken-ken':'feather','chan-tinh':'earth','thach-tinh':'earth','soi-tuyet':'ice','gau-nui':'ice','ho-tinh':'ice','doi-quy':'demon','nhen-doc':'demon','dai-bang':'wind'};
  const monIc=(t,fb)=>MON_IC[t]||fb;
  const villagers=()=>((typeof LH_MAPS!=='undefined'&&LH_MAPS[World.DEFAULT])||{npcs:[]}).npcs;
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
    const W=d.slot==='hand'&&Player.WEAPONS[d.kind];if(W)o.push(chip('eye','Tầm '+W.range,'#bfe3ff'),chip('speed','Đánh '+String(W.dur).replace('.',',')+' giây','#bfe3ff'),chip('sword','Sát thương '+Math.round(W.dmg*100)+'%','#bfe3ff'),chip('orb','Mana '+Math.round(W.mana*100)+'% · hồi chiêu '+Math.round(W.cd*100)+'%','#bfe3ff'));
    if(Player.isRanged(d.kind))o.push(chip('aim','Chính xác '+Player.aimAcc(it)+'% (khóa mục tiêu)','#ffb49a'),chip('spark','x2 +'+(Number(Player.CFG.cung_no_x2)||15)+'%','#ffb49a'));
    if(d.beast)o.push(chip('spark',Player.BEASTS[d.beast].skill,'#ffe0a0'));
    for(const [k,v] of Object.entries(it.add||{}))o.push(`<i class="ch add">${addLine(k,v)}</i>`);
    return `<span class="chips">${o.join('')}</span>`;
  }
  const STAT_NM=Object.fromEntries(Player.GROUPS.map(g=>[g[0],g[1]])),STAT_IC=Object.fromEntries(Player.GROUPS.map(g=>[g[0],g[2]]));
  const C=Player.CFG,elInfo=e=>({fire:`+${C.hoa_sat_thuong}% sát thương`,water:`+${C.thuy_hoi_mana} mana/giây`,earth:`Phản ${C.tho_phan_don}% sát thương`,metal:`Giảm ${C.kim_giam_sat_thuong}% sát thương nhận`,wood:`+${C.moc_hoi_mau} máu/giây`,thunder:`${C.loi_ti_le}% lôi quang +${C.loi_sat_thuong}% sát thương`,wind:`${C.phong_ti_le}% làm chậm ${C.phong_cham}%`,ice:`${C.bang_ti_le}% đóng băng quái`,demon:`Thu phục quái, tăng theo Mệnh lệnh`,light:`${C.sang_ti_le}% dọa quái bỏ chạy`})[e];
  function gainText(d){if(d.slot==='mount')return `Tốc +${Player.mountGain(1).speed}; từ +7 thêm Công; từ +11 thêm Máu, Mana, Thủ`;if(d.slot==='book')return 'chỉ số +'+Player.gainOf(d).stat+(['thunder','wind','ice','demon','light'].includes(d.element)?`, tỉ lệ +${C.sach_ti_le_cap||1}%`:'');const g=Player.gainOf(d);return g.atk?'Công +2':g.def?'Thủ +1':g.speed?'Tốc +0.03':'';}
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
    const d=info(it),R=Player.rar(it);let h=`<div class="sel-info"><b class="sel-name" style="color:${R.color}">${esc(Player.nameOf(it))}</b><small class="qtag" style="color:${R.color}">${R.name}${R.trade?' · bán được qua thương nhân':''}</small>${d.gender&&d.gender!==p.gender?`<small class="qtag" style="color:#ffb0a0">${svg('lock')}Đồ của nhân vật ${d.gender==='f'?'nữ':'nam'}: ${p.gender==='f'?'nữ':'nam'} không mặc được</small>`:''}${chips(it)}<small class="sel-desc">${desc(it)}</small>`;
    if(d.set){const S=Player.SETS[d.set],n=Player.derive(p).sets.find(x=>x.id===d.set);h+=`<small class="set-desc"><b>Bộ ${esc(S.name)} · ${esc(S.hero)}</b> (${n?n.n:0}/9) · ${d.gender==='f'?'nhân vật nữ':'nhân vật nam'}<br>${[3,5,7].map(t=>`<span class="${n&&n.n>=t?'on':''}">${t} món: ${Object.entries(S.tiers[t]).map(([k,v])=>addLine(k,v)).join(', ')}</span>`).join('<br>')}<br><span class="${n&&n.n>=9?'on':''}">9 món: ${esc(S.fxText)}</span></small>`;}
    if(d.fxText&&!d.set)h+=`<small class="set-desc"><b>${Player.FX_NAMES[d.fx]||''}</b>: ${esc(d.fxText)}</small>`;
    return h+'</div>';
  }
  const menu=$('#gameMenu');let lastExp='',lastFrame=-1,lastType='',selected=null,skillFocus=null,burstAt=-9,lastBuffs='',shopSel=null,enhSel=null,shopQ='n',previewWho=null,mercSel=null,lastGender='';
  // bảng mở từ dân làng (cửa hàng, nhận việc, thuê lính, chợ): đóng bảng = rời cuộc nói chuyện → lưu
  let npcPanel=false;
  function closeMenu(){menu.hidden=true;$('#settingsBtn').setAttribute('aria-expanded','false');}
  function closeModal(){if(npcPanel){npcPanel=false;game.checkpoint();}$('#overlay').hidden=true;shopSel=null;previewWho=null;$('#scene').focus();}
  function openModal(titleHtml,content,wide=false){delete $('#modalCard').dataset.mk;game.stop();game.closeDialog();closeMenu();$('#modalCard').classList.toggle('wide',wide);$('#overlayTitle').innerHTML=titleHtml;const keep=$('#overlay').hidden?0:$('#modalCard').scrollTop;$('#overlayBody').innerHTML=content;$('#overlay').hidden=false;$('#modalCard').scrollTop=keep;}
  function questHtml(){
    const V=villagers(),s=V.filter(n=>game.seen.includes(n.id)).length,total=V.length;if(s<total)return svg('talk')+`Gặp dân làng ${s}/${total}`;
    const act=Object.entries(p.quests.active);
    if(act.length){const [id,n]=act[0],Q=Player.QUESTS[id];return svg('quest')+`${esc(Q.name)} ${Math.min(n,Q.count)}/${Q.count}`+(act.length>1?` <small>+${act.length-1}</small>`:'');}
    if(!p.flags.river)return svg('bridge')+'Qua cầu sang Đông Ngạn';
    // còn việc chưa làm thì nhắc gặp Lý trưởng; làm hết rồi thì khung theo dõi biến mất cho gọn
    return Object.values(Player.QUESTS).some(Q=>Q.repeat||!p.quests.done[Q.id])?svg('quest')+'Gặp Lý trưởng nhận việc':'';
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
    $('#placeName').textContent=World.zoneAt(game.hero.x,game.hero.y);$('#placeCoord').textContent=Math.floor(game.hero.x/World.T)+', '+Math.floor(game.hero.y/World.T);
    $('#safeTag').hidden=!game.safe;
    const q=questHtml();if($('#questTrack').innerHTML!==q){$('#questTrack').innerHTML=q;$('#questTrack').hidden=!q;}
    const type=Player.stance(p).type;if(lastType!==type){$('#normalIcon').innerHTML=`<use href="#i-${type}"/>`;lastType=type;const W=Player.weapon(type);$('#skill-normal').title='Space · '+W.name;[['basic','1','Combo'],['intermediate','2','Diện rộng'],['advanced','3','Liên hoàn']].forEach(([id,k,n])=>{$('#skill-'+id).title=`${k} \u{b7} ${n} \u{b7} ${Player.skillCost(p,id)} mana`;});}
    const el=Player.element(p);$('#skill-normal').style.setProperty('--elem',el?EL[el].color:'#dfc480');
    const books=Object.keys(D.books),key=books.join();if(key!==lastBuffs){lastBuffs=key;$('#buffs').innerHTML=books.map(b=>`<span class="buff" style="color:${EL[b].color}" title="${EL[b].name}: ${elInfo(b)}">${svg(EL[b].icon)}</span>`).join('');}
    const md=p.equipment.mount&&info(p.equipment.mount),mb=$('#skill-mount');mb.hidden=!md||game.safe;
    {const lb=$('#lockBtn'),rg=Player.isRanged(Player.stance(p).type);lb.hidden=!rg;lb.classList.toggle('on',rg&&game.lockOn);lb.setAttribute('aria-pressed',String(rg&&game.lockOn));}
    if(md&&mb.dataset.beast!==md.beast){mb.dataset.beast=md.beast;const B=Player.BEASTS[md.beast];$('#mountIcon').innerHTML=`<use href="#i-${B.icon}"/>`;$('#mountName').textContent=B.skill;mb.title='4 · '+B.skill+' · 12 mana';}
    document.querySelectorAll('.skill-wheel .skill:not(.normal):not(.lockon)').forEach(b=>b.classList.toggle('locked',game.safe));
    // chân dung góc trái: theo giới tính + diện mạo đang dùng (ảnh giao_dien:chan_dung_<diện mạo> nếu có, không thì chan_dung_nam/nu, không thì hình vẽ đổi màu da, tóc, râu)
    const avKey=p.gender+'|'+(p.avatar||'');
    if(lastGender!==avKey){lastGender=avKey;const av=$('#avatarBtn'),A=Player.AVATARS[p.avatar]||null,u=(A&&LH_IMG.url('giao_dien:chan_dung_'+A.id))||LH_IMG.url('giao_dien:chan_dung_'+(p.gender==='f'?'nu':'nam'));av.querySelector('.pf-img')?.remove();if(u)av.querySelector('.portrait').insertAdjacentHTML('afterend',`<img class="pf-img" src="${esc(u)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">`);
      const skin=A?A.skin:'#e4c69b',hair=A?A.hair:'#2a2622',sh=(h,k)=>LH_Look.shade?LH_Look.shade(h,k):h;$('#pfFace').setAttribute('fill',skin);$('#pfNeck').setAttribute('fill',sh(skin,-.06));$('#pfBody').setAttribute('fill',sh(skin,-.1));$('#pfTop').setAttribute('fill',hair);$('#pfHair').setAttribute('fill',hair);$('#pfBeard').setAttribute('fill',A&&A.beard||hair);
      $('#pfTop').style.display=A&&A.style==='troc'?'none':'';$('#pfHair').style.display=p.gender==='f'||(A&&A.style==='xoa')?'':'none';$('#pfYem').style.display=p.gender==='f'?'':'none';$('#pfBeard').style.display=A&&A.beard?'':'none';}
  }
  /* ---------- Bảng thuộc tính: 5 chỉ số lớn, chỉ số nhỏ chỉ hiện khi có cộng thêm ---------- */
  function showAttributes(){
    const D=game.HD,S=D.tot,A=D.add;
    const rows=Player.GROUPS.map(([g,name,ic])=>{
      const baseKey={str:'strength',agi:'agility',vit:'vitality',int:'intelligence',cmd:'command'}[g],plus=A[g]||0;
      const subs=Object.entries(Player.ADD).filter(([k,a])=>a.group===g&&k!==g&&(A[k]||0)>0).map(([k,a])=>`<div class="sub"><span>${a.name}</span><b>${S[k]}${a.unit}</b><em>+${Math.round(A[k]*10)/10}${a.unit}</em></div>`).join('');
      const extra=g==='vit'?`<div class="sub base"><span>Máu tối đa</span><b>${S.hp}</b></div>`:g==='int'?`<div class="sub base"><span>Mana tối đa</span><b>${S.mp}</b></div>`:g==='cmd'?(()=>{const c=Player.cmdInfo(p);return `<div class="sub base"><span>Đang dùng</span><b>${c.used} / ${c.total}</b></div><div class="sub base"><span>Thú cưỡi · lính</span><b>${c.mount} · ${c.merc}</b></div>`;})():'';
      const al=(p.alloc&&p.alloc[baseKey])||0,addBtn=p.points>0?`<button class="pt-add" data-pt="${g}">+1</button>${p.points>=5?`<button class="pt-add" data-pt="${g}" data-n="5">+5</button>`:''}`:'';
      return `<div class="attr"><div class="main">${svg(ic)}<span>${name}</span><b>${D.main[g]}</b>${plus?`<em>+${plus}</em>`:''}${al?`<em title="Điểm đã cộng" style="color:#ffd98a">+${al}</em>`:''}${addBtn}</div>${extra}${subs}</div>`;
    }).join('');
    const sets=D.sets.map(x=>{const S2=Player.SETS[x.id];return chip('quest',`Bộ ${S2.name} ${x.n}/9`,Player.RAR.l.color);}).join('')+(D.enh&&D.enh.n9?chip('anvil',`Đồ +9: ${D.enh.n9}/8`,'#ffd77a'):'')+(D.enh?D.enh.list.map(([ic,t])=>chip(ic,t,'#ffd77a')).join(''):'');
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
    return `<button class="equipment-slot${locked?' locked':''}${can?' can':''}${it?' has':''}" data-slot="${slot}" title="${esc(label)}" style="${it&&Player.qOf(it)!=='n'?`border-color:${qColor(it)}`:''}"><span style="color:${it?(tintOf(it)||'#e4cc8d'):'#4f6452'}">${it?icon(type):svg(type)}</span><small class="slot-label" style="${it?`color:${qColor(it)}`:''}">${esc(label)}</small>${locked?'':lvb(it)}${locked?`<span class="lock">${svg('lock')}</span>`:''}</button>`;
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
  const ENH_OK={smith:d=>d.slot!=='book'&&d.slot!=='mount',trainer:d=>d.slot==='mount',wizard:d=>d.slot==='book'};
  function enhList(id){const ok=Player.shopEnh(id)||ENH_OK[id]||(()=>true);return [...Player.slots.map(sl=>({where:'eq',key:sl,it:p.equipment[sl]})),...p.skillSlots.map((it,i)=>({where:'sk',key:i,it})),...p.bag.map((it,i)=>({where:'bag',key:i,it}))].filter(r=>Player.canEnhance(r.it)&&ok(info(r.it)));}
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
    // hiệu buôn thành trì (thanh-<vùng>): tên theo vùng, có gia cường; món nào cũng ghi bậc (· cấp N) = cấp thành
    const RG=/^thanh-/.test(id)?Player.REGIONS.find(r=>'thanh-'+r.id===id):null;
    const list=Player.SHOPS[id]||[],META={smith:{icon:'sword',title:'Lò rèn',enh:'Gia cường'},trainer:{icon:'mount',title:'Thú cưỡi',enh:'Nâng thú'},wizard:{icon:'book',title:'Sách ngũ hành',enh:'Luyện sách'}}[id]||(RG?{icon:'bag',title:'Hiệu buôn '+RG.name.replace(/^(Thành|Kinh Thành|Cố Đô) /,''),enh:'Gia cường'}:{icon:'bag',title:'Cửa hàng'});
    if(tab==='enh'&&!META.enh)tab='buy';
    const qs=[...new Set(list.flatMap(r=>r.q))],full=p.bag.indexOf(null)<0;if(!qs.includes(shopQ))shopQ=qs[0]||'n';
    const tile=(attr,type,it,price,go,goTxt,off,sel)=>`<button class="tile${off?' off':''}${sel?' sel':''}" ${attr} title="${esc(desc(it))}" style="${Player.qOf(it)!=='n'?`border-color:${qColor(it)}`:''}"><span class="ti" style="color:${tintOf(it)||'#e4cc8d'}">${icon(type)}</span>${lvb(it)}<b class="nm" style="color:${qColor(it)}">${esc(Player.nameOf(it))}</b>${chips(it)}<span class="price">${coins(price)}</span><span class="go">${svg(go)}${goTxt}</span></button>`;
    let body;
    if(tab==='buy'){
      const qbar=qs.length>1?`<div class="qbar">${qs.map(q=>`<button data-q="${q}" class="${q===shopQ?'on':''}" style="color:${Player.RAR[q].color}">${Player.RAR[q].name}</button>`).join('')}${shopQ!=='n'?`<small>Mỗi món có ${Player.RAR[shopQ].lines} dòng thuộc tính ngẫu nhiên</small>`:''}</div>`:'';
      body=qbar+`<div class="shop-grid">${list.filter(r=>r.q.includes(shopQ)||(info({type:r.id})||{}).q&&r.q.includes(info({type:r.id}).q)).map(r=>{const d=info({type:r.id}),q=d&&d.q?d.q:shopQ,price=Player.shopPrice(r.id,q,id),it={type:r.id,q,...(r.t?{t:r.t}:{})};return tile(`data-buy="${r.id}"`,r.id,it,price,'bag','Mua',p.copper<price||full,shopSel===r.id);}).join('')}</div>`;
    }
    else if(tab==='sell'){const t=p.bag.map((it,i)=>it?tile(`data-sell="${i}"`,it.type,it,Player.sellPrice(it),'coin','Bán',false,shopSel===String(i)):'').join('');body=`<div class="shop-grid">${t||`<div class="shop-empty">${svg('bag')}<span>Túi trống</span></div>`}</div>`;}
    else body=enhHtml(id);
    const tabs=[['buy',META.icon,'Mua'],['sell','coin','Bán'],...(META.enh?[['enh',id==='wizard'?'book':'anvil',META.enh]]:[])];
    openModal(`<div class="shop-tabs">${tabs.map(([k,ic,tx])=>`<button data-tab="${k}" class="${tab===k?'on':''}">${svg(ic)}${tx}</button>`).join('')}</div><div class="purse">${coins(p.copper)}${ruby(p.rubies)}</div>`,`<div class="shop-sub">${svg(META.icon)}${META.title}${tab==='enh'?'':' · chạm 2 lần để '+(tab==='buy'?'mua':'bán')}</div>${body}`,true);
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{shopSel=null;showShop(id,b.dataset.tab);});
    document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{shopQ=b.dataset.q;shopSel=null;showShop(id,'buy');});
    document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const type=b.dataset.buy;if(shopSel!==type){shopSel=type;showShop(id,'buy');return;}run(b,game.op({t:'buy',type,q:shopQ,...(RG?{shop:id}:{})}).then(r=>{game.message(svg('check')+`Đã mua <b style="color:${qColor(r.item)}">${esc(Player.nameOf(r.item))}</b>`);shopSel=null;showShop(id,'buy');}));});
    document.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{const i=b.dataset.sell;if(shopSel!==i){shopSel=i;showShop(id,'sell');return;}run(b,game.op({t:'sell',i:Number(i)}).then(r=>{game.message(svg('coin')+'Đã bán '+esc(Player.nameOf(r.item))+' '+coins(r.v));shopSel=null;showShop(id,'sell');}));});
    document.querySelectorAll('[data-enh]').forEach(b=>b.onclick=()=>{const [w,k]=b.dataset.enh.split(':');enhSel={where:w,key:w==='eq'?k:Number(k)};showShop(id,'enh');});
    const go=$('#enhGo');if(go)go.onclick=()=>{const t0=Date.now();const cur=enhSel.where==='sk'?p.skillSlots[enhSel.key]:enhSel.where==='bag'?p.bag[enhSel.key]:p.equipment[enhSel.key],ce=info(cur)&&info(cur).element;go.innerHTML=svg(id==='wizard'?'book':'anvil')+(id==='wizard'?'Đang luyện':'Đang rèn')+'…';game.hammer(ce?EL[ce].color:null);run(go,game.op(enhSel.where==='sk'?{t:'enhSk',key:enhSel.key,shop:id}:{t:'enh',where:enhSel.where==='bag'?'bag':'eq',key:enhSel.key,shop:id}).then(r=>new Promise(ok=>setTimeout(()=>ok(r),Math.max(0,550-(Date.now()-t0))))).then(r=>{const name=info(r.item).name;game.enhanceFx(r.ok);game.message(r.ok?svg('check')+`Thành công! ${esc(name)} +${r.to}`:svg('close')+`Thất bại\u{2026} ${esc(name)} về +${r.to}`);showShop(id,'enh');}),()=>showShop(id,'enh'));};
  }
  /* ---------- Lý trưởng: bảng nhiệm vụ ---------- */
  function rewardChips(Q){const o=[];if(Q.copper)o.push(`<i class="ch">${coins(Q.copper)}</i>`);if(Q.rubies)o.push(`<i class="ch">${ruby(Q.rubies)}</i>`);if(Q.item&&Player.items[Q.item]){const it={type:Q.item,q:Q.itemQ};o.push(`<i class="ch" style="color:${qColor(it)}">${icon(Q.item)}${esc(Player.items[Q.item].name)} · ${Player.RAR[Q.itemQ||'n'].name}</i>`);}return o.join('');}
  function showQuestBoard(){
    // việc làm một lần đã xong thì không hiện nữa; xếp theo cấp, nhóm theo vùng; vùng chưa đủ cấp hiện khóa
    const lv=p.level||1,R=id=>Player.REGIONS.find(r=>r.id===id)||Player.REGIONS[0];
    const list=Object.values(Player.QUESTS).filter(Q=>Q.repeat||!p.quests.done[Q.id]||p.quests.active[Q.id]!=null)
      .map(Q=>({Q,need:Player.questLevel(Q),reg:R(Player.regionOf(Q.target))})).sort((a,b)=>a.need-b.need);
    let last='',rows='';
    for(const {Q,need,reg} of list){
      const key=need+'|'+reg.id,lock=lv<need;
      if(key!==last){last=key;rows+=`<div class="qgroup${lock?' qlock':''}">${svg(lock?'lock':reg.icon)}<b>${esc(reg.name)}</b><span>${lock?'Cần cấp '+need:'Cấp '+need+'+'}</span></div>`;}
      const n=p.quests.active[Q.id],done=p.quests.done[Q.id]||0,M=Player.MON[Q.target],act=n!=null,ready=act&&n>=Q.count;
      const btn=ready?`<button class="primary" data-turnin="${Q.id}">${svg('check')}Trả việc</button>`:act?`<span class="qprog">${n}/${Q.count}</span>`:(!Q.repeat&&done)?`<span class="qprog">Đã xong</span>`:lock?`<span class="qprog">${svg('lock')}${need}</span>`:`<button data-accept="${Q.id}">${svg('next')}Nhận</button>`;
      rows+=`<div class="qrow${act?' act':''}${lock&&!act?' dim':''}">${LH_IMG.icon('quai:'+Q.target,monIc(Q.target,'flag'))}<div><b>${esc(Q.name)}</b><small>${esc(Q.desc)} · ${M?esc(M.name):''} ×${Q.count}${done?` · đã làm ${done} lần`:''}</small><span class="chips">${rewardChips(Q)}</span></div>${btn}</div>`;
    }
    openModal(ttl('quest','Lý trưởng giao việc'),`<small class="sel-desc">Lv. ${lv} · nhận tối đa ${Player.MAX_ACTIVE_QUEST} việc cùng lúc. Xong việc quay về gặp Lý trưởng để nhận thưởng.</small><div class="quest-rows" style="margin-top:8px">${rows||`<div class="cho-note">${svg('check')}<span>Đã làm xong mọi việc của làng. Hãy ra Đông Ngạn săn quái, luyện cấp.</span></div>`}</div>`,true);
    document.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>run(b,game.op({t:'qa',id:b.dataset.accept}).then(()=>showQuestBoard())));
    document.querySelectorAll('[data-turnin]').forEach(b=>b.onclick=()=>run(b,game.op({t:'qt',id:b.dataset.turnin}).then(r=>{game.message(svg('check')+'Nhận thưởng'+(r.copper?' '+coins(r.copper):'')+(r.rubies?' '+ruby(r.rubies):'')+(r.exp?' · +'+r.exp+' kinh nghiệm':'')+(r.item?` \u{00b7} <b style="color:${qColor(r.item)}">${esc(Player.nameOf(r.item))}</b>`:''));if(r.up)game.levelUp(r.up);showQuestBoard();})));
  }
  /* ---------- Người dẫn đường: lính đánh thuê ---------- */
  const statLine=st=>`<small class="sel-desc">Sức mạnh ${st.strength} · Nhanh nhẹn ${st.agility} · Sức khỏe ${st.vitality} · Trí tuệ ${st.intelligence}</small>`;
  const gearIcons=eq=>Player.slots.map(k=>eq&&eq[k]&&info(eq[k])?`<span title="${esc(Player.nameOf(eq[k]))}" style="color:${qColor(eq[k])}">${icon(eq[k].type)}</span>`:'').join('');
  function showMercBoard(tab='hire'){
    const tabs=`<div class="shop-tabs"><button data-mt="hire" class="${tab==='hire'?'on':''}">${svg('user')}Thuê lính</button><button data-mt="mine" class="${tab==='mine'?'on':''}">${svg('flag')}Lính của tôi (${p.mercs.length}/${Player.MAX_MERC})</button></div><div class="purse">${coins(p.copper)}${ruby(p.rubies||0)}</div>`;
    let body='';
    if(tab==='hire'){
      const c=Player.cmdInfo(p);
      const npc=Object.values(Player.MERCS).map(M=>`<div class="mrow"><span class="mg">${M.gender==='f'?'Nữ':'Nam'}</span><div><b>${esc(M.name)}</b><small class="sel-desc">${esc(M.desc||'')}</small>${statLine(M.stats)}<small class="need${M.cmd>c.free?' no':''}">${svg('flag')}Đi theo cần ${M.cmd} Mệnh lệnh / còn ${c.free}${M.cmd>c.free?' · thuê xong để nghỉ':''}</small></div><button data-hire="${M.id}"${p.copper<M.price?' disabled':''}>${coins(M.price)}Thuê</button></div>`).join('');
      body=`<h4 class="sec">Lính trong vùng</h4>${npc}<div class="cho-note">${svg('user')}<span>Muốn thuê nhân vật của người chơi khác? Gặp <b>Thương nhân</b> ở cuối làng.</span></div>`;
    }else{
      const m=mercSel!=null?p.mercs[mercSel]:null;
      const c=Player.cmdInfo(p),pct=x=>Math.max(0,Math.min(100,x/Math.max(1,c.total)*100)).toFixed(1)+'%';
      const cmdLine=`<div class="cmd-line">${svg('flag')}<span>Mệnh lệnh</span><b>${c.used} / ${c.total}</b><div class="cmd-bar"><i class="m" style="width:${pct(c.mount)}"></i><i class="l" style="width:${pct(c.merc)}"></i></div><small>Thú cưỡi ${c.mount} · Lính ${c.merc} · Còn trống <b>${c.free}</b></small></div>`;
      const stat=M=>!(M.hpFrac>0)?'<small class="qtag" style="color:#ffb0a0">Chờ ở làng</small>':M.on?'<small class="qtag" style="color:#9fe8a8">Đang đi theo</small>':'';
      const need=M=>{const n=Number(M.cmd)||5;return M.on?`<small class="need on">${svg('flag')}${n}</small>`:`<small class="need${n>c.free?' no':''}">${svg('flag')}Cần ${n} / còn ${c.free}</small>`;};
      const list=cmdLine+(p.mercs.map((M,i)=>{const n=Number(M.cmd)||5,can=M.on||(n<=c.free&&M.hpFrac>0);return `<div class="mrow${M.on?' act':''}${mercSel===i?' sel':''}"><span class="mg">${M.gender==='f'?'Nữ':'Nam'}</span><div><b>${esc(M.name)}</b>${stat(M)}${need(M)}<span class="gear">${gearIcons(M.equipment)}</span></div><span class="mbtns"><button data-follow="${i}"${can?'':' disabled'}>${M.on?'Cho nghỉ':'Đi theo'}</button><button data-gear="${i}">Đồ</button><button data-dismiss="${i}">Giải tán</button></span></div>`;}).join('')||'<small class="sel-desc">Chưa có lính. Qua mục Thuê lính để thuê.</small>');
      const pets=p.pets&&p.pets.length?`<h4 class="sec">Quái thu phục (${p.pets.length}/${Player.petMax()})</h4>`+p.pets.map(x=>{const M=Player.MON[x.type];return `<div class="mrow"><span class="mg pet">${LH_IMG.icon('quai:'+x.type,monIc(x.type,'demon'))}</span><div><b>${esc(M.name)}</b><small class="sel-desc">Máu ${Math.round(M.hp*x.hpFrac)} / ${M.hp} · chết là mất hẳn</small></div><span class="mbtns"><button data-petoff="${x.pid}">Thả đi</button></span></div>`;}).join(''):'';
      let gear='';
      if(m){previewWho={equipment:m.equipment,gender:m.gender,stats:m.stats};const P2={equipment:m.equipment,gender:m.gender,isMerc:true};
        gear=`<div class="mgear"><div class="equip-head"><canvas id="preview"></canvas><div><b>${esc(m.name)}</b><small class="sel-desc">Chạm ô trang bị của lính để lấy về túi. Chạm đồ trong túi để mặc cho lính.</small></div></div><div class="equip-grid">${Player.slots.map(k=>slotHtml(m,k)).join('')}</div><div class="bag-grid" style="margin-top:8px">${bagHtml(it=>Player.targets(P2,it).length>0)}</div></div>`;}
      else previewWho=null;
      body=`<div class="mlist">${list}${pets}</div>${gear}`;
    }
    openModal(tabs,body,true);
    document.querySelectorAll('[data-mt]').forEach(b=>b.onclick=()=>{mercSel=null;showMercBoard(b.dataset.mt);});
    document.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>run(b,game.op({t:'hire',id:b.dataset.hire}).then(r=>{game.syncMerc();game.message(svg('check')+'Đã thuê '+esc(r.name));game.save();showMercBoard('mine');})));
    document.querySelectorAll('[data-follow]').forEach(b=>b.onclick=()=>{try{const i=Number(b.dataset.follow);Player.setFollow(p,i,!p.mercs[i].on);game.syncMerc();game.save();refresh();showMercBoard('mine');}catch(e){fail(e);}});
    document.querySelectorAll('[data-petoff]').forEach(b=>b.onclick=()=>run(b,game.op({t:'petOff',pid:b.dataset.petoff}).then(()=>{game.syncMerc();showMercBoard('mine');})));
    document.querySelectorAll('[data-gear]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.gear);mercSel=mercSel===i?null:i;showMercBoard('mine');});
    document.querySelectorAll('[data-dismiss]').forEach(b=>b.onclick=()=>run(b,game.op({t:'dismiss',i:Number(b.dataset.dismiss)}).then(()=>{mercSel=null;game.syncMerc();showMercBoard('mine');})));
    if(tab==='mine'&&mercSel!=null){
      document.querySelectorAll('.mgear [data-slot]').forEach(b=>b.onclick=()=>{try{Player.mercUnequip(p,mercSel,b.dataset.slot);game.syncMerc();showMercBoard('mine');}catch(e){fail(e);}});
      document.querySelectorAll('.mgear [data-bag]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.bag),it=p.bag[i];if(!it)return;const m=p.mercs[mercSel],t=Player.targets({equipment:m.equipment,gender:m.gender,isMerc:true},it);if(!t.length)return fail(Error(info(it).gender?'GENDER':'SLOT'));try{Player.mercEquip(p,mercSel,i,t.includes('right')&&!m.equipment.right?'right':t[0]);game.syncMerc();showMercBoard('mine');}catch(e){fail(e);}});
    }
  }
  /* ---------- Thương nhân: trung gian mua bán giữa người chơi (đồ ký gửi, nhân vật cho thuê, tiền bán hàng) ----------
     Mọi lệnh ở đây chạy trên máy chủ: trước khi gửi, game lưu hết phần chơi trên máy (game.server), sau đó nhận lại túi đồ, tiền chuẩn. */
  const MK={tab:'buy',list:null,mercs:null,chars:null,claim:0,claimRuby:0,filter:'all',sel:null,pick:null,busy:false};
  const price2=(c,r)=>(c||!r?coins(c):'')+(r?ruby(r):'');
  function mkTile(attr,it,priceHtml,go,goTxt,off,sel,foot){
    return `<button class="tile${off?' off':''}${sel?' sel':''}" ${attr} title="${esc(desc(it))}" style="${Player.qOf(it)!=='n'?`border-color:${qColor(it)}`:''}"><span class="ti" style="color:${tintOf(it)||'#e4cc8d'}">${icon(it.type)}</span>${lvb(it)}<b class="nm" style="color:${qColor(it)}">${esc(Player.nameOf(it))}</b>${chips(it)}${priceHtml?`<span class="price">${priceHtml}</span>`:''}${foot||''}<span class="go">${svg(go)}${goTxt}</span></button>`;
  }
  // Gọi máy chủ: khóa cả bảng trong lúc chờ (bấm nhanh không dồn lệnh)
  async function mkRun(fn){
    if(MK.busy)return;MK.busy=true;const card=$('#modalCard');card.classList.add('mk-wait');card.querySelectorAll('button:not(#closeOverlay),input').forEach(x=>x.disabled=true);
    try{await fn();}catch(e){fail(e);}finally{MK.busy=false;card.classList.remove('mk-wait');if(!$('#overlay').hidden&&$('#modalCard').dataset.mk)showMarket(MK.tab,true);}
  }
  async function mkLoad(force){
    if(MK.tab==='buy'&&(force||!MK.list)){const r=await Net.call('marketList');MK.list=r.open;MK.claim=r.claim;MK.claimRuby=r.claimRuby||0;}
    if(MK.tab==='merc'&&(force||!MK.mercs)){const [m,c]=await Promise.all([Net.call('mercList'),Net.call('chars')]);MK.mercs=m.list;MK.chars=c.chars;MK.claim=c.claim;MK.claimRuby=c.claimRuby||0;}
    if(MK.tab==='money'&&force){const r=await Net.call('marketList');MK.list=r.open;MK.claim=r.claim;MK.claimRuby=r.claimRuby||0;}
  }
  function showMarket(tab,quiet){
    if(tab)MK.tab=tab;if(!quiet){MK.sel=null;MK.pick=null;}
    const need=(MK.tab==='buy'&&!MK.list)||(MK.tab==='merc'&&!MK.mercs)||(MK.tab==='money'&&MK.list==null);
    const fee=Player.CFG.phi_cho||0,tabs=[['buy','coin','Hàng'],['sell','bag','Ký gửi'],['merc','user','Lính người chơi'],['money','check','Tiền bán'+(MK.claim||MK.claimRuby?' <i class="mk-dot"></i>':'')]];
    let body='';
    if(need)body=`<div class="shop-empty">${svg('coin')}<span>Đang hỏi thương nhân…</span></div>`;
    else if(MK.tab==='buy'){
      const q=MK.filter,flt=[['all','Tất cả'],...Object.entries(Player.RAR).filter(([,r])=>r.trade).map(([k,r])=>[k,r.name])];
      const list=MK.list.map(r=>({...r,it:Player.cleanItem(r.item)})).filter(r=>r.it&&(q==='all'||Player.qOf(r.it)===q));
      body=`<div class="qbar">${flt.map(([k,t])=>`<button data-mf="${k}" class="${q===k?'on':''}" ${Player.RAR[k]?`style="color:${Player.RAR[k].color}"`:''}>${t}</button>`).join('')}<button data-mreload class="ghost">${svg('next')}Làm mới</button></div>`+
        (list.length?`<div class="shop-grid">${list.map(r=>r.mine?mkTile(`data-mcancel="${r.id}"`,r.it,price2(r.price,r.ruby),'out','Lấy lại',false,MK.sel===r.id,'<small class="mk-own">Của bạn</small>'):mkTile(`data-mbuy="${r.id}"`,r.it,price2(r.price,r.ruby),'bag','Mua',p.copper<r.price||p.rubies<(r.ruby||0)||p.bag.indexOf(null)<0,MK.sel===r.id,`<small class="mk-own">${esc(r.seller||'')}</small>`)).join('')}</div>`:`<div class="shop-empty">${svg('coin')}<span>Chưa có hàng ký gửi</span></div>`);
    }
    else if(MK.tab==='sell'){
      const own=p.bag.map((it,i)=>it&&Player.tradeable(it)?{it,i}:null).filter(Boolean),sel=MK.pick?p.bag.find(x=>x&&x.uid===MK.pick):null;
      const tr=Object.values(Player.RAR).filter(r=>r.trade).map(r=>`<b style="color:${r.color}">${r.name}</b>`).join(', ');
      body=`<p class="mk-hint">Đồ ${tr} trong túi. Bán được, thương nhân giữ ${fee}%, tiền về mục Tiền bán.</p>`+
        (own.length?`<div class="shop-grid">${own.map(({it})=>mkTile(`data-mpick="${it.uid}"`,it,'','check','Chọn',false,MK.pick===it.uid)).join('')}</div>`:`<div class="shop-empty">${svg('bag')}<span>Túi không có đồ ký gửi được</span></div>`)+
        (sel?`<div class="mk-bar"><b style="color:${qColor(sel)}">${esc(Player.nameOf(sel))}</b><label>Vàng<input id="mkG" type="number" min="0" value="1" inputmode="numeric"></label><label>Bạc<input id="mkS" type="number" min="0" max="99" value="0" inputmode="numeric"></label><label>Hồng ngọc<input id="mkR" type="number" min="0" value="0" inputmode="numeric"></label><button class="primary" id="mkSell">${svg('coin')}Ký gửi</button></div>`:'');
    }
    else if(MK.tab==='merc'){
      const full=p.mercs.length>=Player.MAX_MERC;
      const lst=MK.mercs.length?MK.mercs.map(m=>{const k=m.look||{};return `<div class="mk-row"><span class="mk-g">${m.gender==='f'?'Nữ':'Nam'}</span><div><b>${esc(m.name)}</b><small>Lv. ${k.level||m.level||1}${k.dmg?` · Sát thương ${k.dmg[0]}–${k.dmg[1]}`:''}${k.hp?` · Máu ${k.hp}`:''}</small></div><div class="mk-end">${price2(m.price,m.ruby)}<button class="primary${MK.sel===m.id?' sel':''}" data-mhire="${m.id}"${full||p.copper<m.price||p.rubies<(m.ruby||0)?' disabled':''}>${svg('user')}${MK.sel===m.id?'Chạm lần nữa':'Thuê'}</button></div></div>`;}).join(''):`<div class="shop-empty">${svg('user')}<span>Chưa ai cho thuê nhân vật</span></div>`;
      const mine=(MK.chars||[]).filter(c=>c.id!==session.charId).map(c=>`<div class="mk-row"><span class="mk-g">${c.gender==='f'?'Nữ':'Nam'}</span><div><b>${esc(c.name)}</b><small>Lv. ${c.level||1}${c.status==='merc'?' · đang cho thuê '+price2(c.price,c.ruby):''}</small></div><div class="mk-end">${c.status==='merc'?`<button data-mstop="${c.id}">Hủy cho thuê</button>`:`<label>Vàng<input data-mg="${c.id}" type="number" min="0" value="2" inputmode="numeric"></label><label>Hồng ngọc<input data-mr="${c.id}" type="number" min="0" value="0" inputmode="numeric"></label><button data-mreg="${c.id}">Cho thuê</button>`}</div></div>`).join('');
      body=`<p class="mk-hint">Thuê nhân vật của người chơi khác về làm lính đi theo (${p.mercs.length}/${Player.MAX_MERC}).</p><div class="mk-rows">${lst}</div><h4 class="mk-h">Nhân vật khác của tôi</h4><p class="mk-hint">Đang cho thuê thì không vào game được. Có người thuê: nhân vật thuộc về họ, bạn nhận tiền (trừ ${fee}%).</p><div class="mk-rows">${mine||`<div class="shop-empty"><span>Không có nhân vật nào khác</span></div>`}</div>`;
    }
    else body=`<div class="mk-claim">${svg('coin')}<div><span>Tiền bán hàng đang chờ</span><b>${price2(MK.claim,MK.claimRuby)}</b></div>${MK.claim||MK.claimRuby?`<button class="primary" id="mkClaim">Nhận</button>`:''}</div><p class="mk-hint">Gồm tiền bán đồ ký gửi và tiền cho thuê nhân vật, đã trừ phí thương nhân.</p>`;
    openModal(`<div class="shop-tabs">${tabs.map(([k,ic,t])=>`<button data-mtab="${k}" class="${MK.tab===k?'on':''}">${svg(ic)}<span>${t}</span></button>`).join('')}</div><div class="purse">${coins(p.copper)}${ruby(p.rubies)}</div>`,`<div class="shop-sub">${svg('coin')}Thương nhân · mua bán với người chơi${MK.tab==='buy'||MK.tab==='merc'?' · chạm 2 lần để mua':''}</div>${body}`,true);
    $('#modalCard').dataset.mk='1';
    if(need){mkRun(()=>mkLoad(false));return;}
    const Q=s=>document.querySelectorAll(s);
    Q('[data-mtab]').forEach(b=>b.onclick=()=>showMarket(b.dataset.mtab));
    Q('[data-mf]').forEach(b=>b.onclick=()=>{MK.filter=b.dataset.mf;showMarket(null,true);});
    Q('[data-mreload]').forEach(b=>b.onclick=()=>mkRun(()=>mkLoad(true)));
    Q('[data-mbuy]').forEach(b=>b.onclick=()=>{const id=b.dataset.mbuy;if(MK.sel!==id){MK.sel=id;showMarket(null,true);return;}
      mkRun(async()=>{try{const r=await game.server('marketBuy',{id});MK.list=MK.list.filter(x=>x.id!==id);MK.sel=null;game.message(svg('check')+`Đã mua <b style="color:${qColor(r.item)}">${esc(Player.nameOf(r.item))}</b>`);}catch(e){if(e.message==='DA_BAN'){MK.list=MK.list.filter(x=>x.id!==id);MK.sel=null;}throw e;}});});
    Q('[data-mcancel]').forEach(b=>b.onclick=()=>{const id=b.dataset.mcancel;if(MK.sel!==id){MK.sel=id;showMarket(null,true);return;}
      mkRun(async()=>{await game.server('marketCancel',{id});MK.list=MK.list.filter(x=>x.id!==id);MK.sel=null;game.message(svg('check')+'Đã lấy lại món đồ');});});
    Q('[data-mpick]').forEach(b=>b.onclick=()=>{MK.pick=MK.pick===b.dataset.mpick?null:b.dataset.mpick;showMarket(null,true);});
    const sg=$('#mkSell');if(sg)sg.onclick=()=>{const v=id=>Math.max(0,Math.floor(+$(id).value||0)),pr=v('#mkG')*10000+Math.min(99,v('#mkS'))*100,rb=v('#mkR');
      if(pr<1&&rb<1){game.message(svg('close')+'Nhập giá bán');return;}const uid=MK.pick,it=p.bag.find(x=>x&&x.uid===uid);
      mkRun(async()=>{const r=await game.server('marketSell',{uid,price:pr,ruby:rb});if(MK.list&&it)MK.list.unshift({id:r.id,item:it,price:pr,ruby:rb,mine:true,seller:p.name});MK.pick=null;game.message(svg('check')+'Đã bày hàng');});};
    Q('[data-mhire]').forEach(b=>b.onclick=()=>{const id=b.dataset.mhire;if(MK.sel!==id){MK.sel=id;showMarket(null,true);return;}
      mkRun(async()=>{const r=await game.server('mercBuy',{targetId:id});MK.mercs=MK.mercs.filter(x=>x.id!==id);MK.sel=null;game.message(svg('user')+esc(r.name)+' đi theo bạn');});});
    Q('[data-mreg]').forEach(b=>b.onclick=()=>{const id=b.dataset.mreg,g=Math.max(0,Math.floor(+document.querySelector(`[data-mg="${id}"]`).value||0)),r=Math.max(0,Math.floor(+document.querySelector(`[data-mr="${id}"]`).value||0));
      mkRun(async()=>{const x=await Net.call('mercRegister',{charId:id,price:g*10000,ruby:r,playing:session.charId});MK.chars=MK.chars.map(c=>c.id===id?{...c,...x.char}:c);game.message(svg('check')+'Đã đăng cho thuê');});});
    Q('[data-mstop]').forEach(b=>b.onclick=()=>{const id=b.dataset.mstop;mkRun(async()=>{const x=await Net.call('mercCancel',{charId:id});MK.chars=MK.chars.map(c=>c.id===id?{...c,...x.char}:c);game.message(svg('check')+'Đã hủy cho thuê');});});
    const cg=$('#mkClaim');if(cg)cg.onclick=()=>mkRun(async()=>{const r=await game.server('claim',{});MK.claim=0;MK.claimRuby=0;game.message(svg('coin')+'Đã nhận '+price2(r.amount,r.ruby));});
    if(MK.tab==='money'&&MK.list!=null&&!quiet)mkRun(()=>mkLoad(true));
  }
  function showQuests(){
    const s=game.seen,k=p.flags.kills,row=(id,label,html)=>`<div class="qrow">${svg(id)}<div><b>${label}</b><span class="chips">${html}</span></div></div>`;
    const V=villagers(),metN=V.filter(n=>s.includes(n.id)).length,met=V.map(n=>chip(s.includes(n.id)?'check':'user',esc(n.name),s.includes(n.id)?'#9fe8a8':'')).join('');
    const names={deer:'Hươu',lion:'Sư tử',elephant:'Voi',croc:'Cá sấu'};
    const hunt=Object.keys(names).map(t=>chip(t,names[t]+' '+(k[t]||0),k[t]?'#9fe8a8':'')).join('');
    const act=Object.entries(p.quests.active).map(([id,n])=>{const Q=Player.QUESTS[id];return row('quest',esc(Q.name)+` (${Math.min(n,Q.count)}/${Q.count})`,rewardChips(Q));}).join('');
    const first=(metN<V.length?row('talk',`Gặp dân làng (${metN}/${V.length})`,met):'')+(p.flags.river?'':row('bridge','Qua cầu sang Đông Ngạn',chip('next','Chưa qua')))+(p.flags.hunted?'':row('bow','Săn mỗi loài một con · thưởng 1 bạc',hunt));
    openModal(ttl('quest','Nhiệm vụ'),`<div class="quest-rows">${act}${first||(act?'':`<div class="qdone">${svg('check')}<span>Đã xong việc làng. Gặp Lý trưởng nhận việc mới.</span></div>`)}</div>`);
  }
  /* ---------- Thợ truyền thần (thành trì): đổi diện mạo — da, tóc, râu, mắt, dấu trên mặt; diện mạo có giá thì mua một lần ---------- */
  let avSel=null;
  function showAvatars(){
    const list=Object.values(Player.AVATARS).filter(A=>!A.gender||A.gender===p.gender).sort((a,b)=>a.order-b.order),own=p.avatars||[];
    const cur=avSel!=null?avSel:(p.avatar||'');previewWho={equipment:p.equipment,gender:p.gender,stats:p.stats,avatar:cur};
    const price2=(c,r)=>(c?coins(c):'')+(r?ruby(r):'')||'<small>Miễn phí</small>';
    const tiles=[{id:'',name:'Vốn có',price:0,ruby:0,skin:'#e1c295',hair:'#2a2622'},...list].map(A=>{const has=!A.id||own.includes(A.id)||!(A.price||A.ruby),using=(p.avatar||'')===A.id;
      return `<button class="tile av-tile${cur===A.id?' sel':''}${using?' using':''}" data-av="${A.id}"><span class="av-dot" style="background:${A.skin};border-color:${A.hair}"></span><b class="nm">${esc(A.name)}</b><span class="price">${has?(using?svg('check')+'Đang dùng':'<small>Đã có</small>'):price2(A.price,A.ruby)}</span></button>`;}).join('');
    const A=Player.AVATARS[cur]||null,canUse=!A||own.includes(cur)||!(A.price||A.ruby),using=(p.avatar||'')===cur,off=using||(A&&!canUse&&(p.copper<A.price||p.rubies<A.ruby));
    openModal(ttl('user','Thợ truyền thần')+`<div class="purse">${coins(p.copper)}${ruby(p.rubies)}</div>`,`<div class="equip-head"><canvas id="preview"></canvas><div class="av-info"><b>${esc(A?A.name:'Vốn có')}</b><small class="sel-desc">${A?(canUse?'Đã có':'Mua một lần, đổi lại lúc nào cũng được'):'Diện mạo ban đầu'}</small><button id="avGo" class="primary"${off?' disabled':''}>${svg(using?'check':canUse?'user':'coin')}${using?'Đang dùng':canUse?'Đổi diện mạo':'Mua '+(A.price?coins(A.price):'')+(A.ruby?ruby(A.ruby):'')}</button></div></div><div class="shop-grid av-grid">${tiles}</div>`,true);
    document.querySelectorAll('[data-av]').forEach(b=>b.onclick=()=>{avSel=b.dataset.av;showAvatars();});
    const go=$('#avGo');if(go)go.onclick=()=>run(go,game.op({t:'av',id:cur}).then(()=>{game.message(svg('check')+'Đã đổi diện mạo');avSel=null;refresh();showAvatars();}));
  }
  function openPanel(n){
    npcPanel=true;
    if(n.panel==='avatar'){avSel=null;return showAvatars();}
    if(n.panel==='shop')return showShop(n.shop);
    if(n.panel==='quests')return showQuestBoard();
    if(n.panel==='mercs')return showMercBoard('hire');
    if(n.panel==='market'){MK.list=null;MK.mercs=null;return showMarket('buy');}
  }
  /* ---------- Chọn bản đồ: đi nhanh tới trạm nghỉ ở cổng từng vùng; thiếu cấp thì khóa ---------- */
  function showMaps(){
    closeMenu();const lv=p.level||1,cur=game.mapId;
    const rows=Player.REGIONS.map(R=>{const need=Player.mapLevel(R.id),lock=lv<need,here=cur===R.id;
      const btn=here?`<span class="qprog">${svg('pin')}Đang ở</span>`:lock?`<span class="qprog">${svg('lock')}${need}</span>`:`<button class="primary" data-go="${R.id}">${svg('next')}Đi</button>`;
      return `<div class="qrow map-row${lock?' dim':''}${here?' act':''}"><span class="map-ic">${svg(R.icon)}</span><div><b>${esc(R.name)}</b><small>${need>1?(lock?'Cần cấp '+need:'Từ cấp '+need):'Làng, vùng an toàn'}</small></div>${btn}</div>`;}).join('');
    openModal(ttl('map','Bản đồ'),`<small class="sel-desc">Lv. ${lv} · đi thẳng tới trạm nghỉ ở cổng vùng (tự lưu trước khi đi).</small><div class="quest-rows" style="margin-top:8px">${rows}</div>`);
    document.querySelectorAll('[data-go]').forEach(b=>b.onclick=async()=>{b.disabled=true;closeModal();await game.goto(b.dataset.go);refresh();});
  }
  async function save(){closeMenu();const ok=await game.save();game.message(ok?svg('save')+'Đã lưu':svg('close')+'Không lưu được');}
  $('#avatarBtn').onclick=showAttributes;
  $('#settingsBtn').onclick=()=>{menu.hidden=!menu.hidden;$('#settingsBtn').setAttribute('aria-expanded',String(!menu.hidden));};
  $('#lockBtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();game.toggleLock();});$('#saveBtn').onclick=save;$('#mapBtn').onclick=showMaps;
  // Tình trạng: phiên bản, phần chơi chưa lưu, lần gọi máy chủ và lỗi gần đây (chụp màn hình gửi khi game có vấn đề)
  function showDiag(){
    closeMenu();const D=LH_DIAG.data,v=document.querySelector('.version');
    const row=(a,b)=>`<div class="dg-row"><b>${a}</b><span>${b}</span></div>`;
    openModal(ttl('eye','Tình trạng'),`<div class="dg">${row('Phiên bản',esc(v?v.textContent:''))}${row('Máy chủ',Net.online?'Việt Nam':'Ngoại tuyến')}${row('Chưa lưu',game.unsaved()?'Có · lưu khi về làng, qua cầu, gặp dân làng hoặc bấm Lưu':'Không')}
      <h4 class="mk-h">Gọi máy chủ</h4>${D.net.length?D.net.map(x=>row(esc(x.t+' '+x.a),x.err?`<i class="dg-bad">${esc(NET_ERR[x.err]||x.err)}</i>`:'OK')).join(''):'<p class="mk-hint">Chưa có</p>'}
      <h4 class="mk-h">Lỗi gần đây</h4>${D.err.length?D.err.map(x=>`<div class="dg-err"><b>${esc(x.t)} · ${esc(x.where)}</b><span>${esc(x.m)}</span><small>${esc(x.s)}</small></div>`).join(''):'<p class="mk-hint">Không có lỗi</p>'}
      <button id="dgClear">Xóa nhật ký</button></div>`);
    $('#dgClear').onclick=()=>{LH_DIAG.clear();showDiag();};
  }
  $('#diagBtn').onclick=showDiag;
  $('#questBtn').onclick=showQuests;$('#bagBtn').onclick=()=>{selected=null;skillFocus=null;renderBag();};
  $('#closeOverlay').onclick=closeModal;$('#overlay').onclick=evt=>{if(evt.target.id==='overlay')closeModal();};
  document.querySelectorAll('[data-skill]').forEach(btn=>{
    const id=btn.dataset.skill,up=()=>{btn.classList.remove('pressed');if(id==='normal')game.setHold(false);};
    btn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();closeMenu();btn.classList.add('pressed');game.cast(id);if(id==='normal')game.setHold(true);try{btn.setPointerCapture(e.pointerId);}catch(_){}});
    btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);
    btn.addEventListener('contextmenu',e=>e.preventDefault());btn.addEventListener('click',e=>e.preventDefault());
  });
  document.addEventListener('pointerdown',evt=>{if(!menu.hidden&&!menu.contains(evt.target)&&!$('#settingsBtn').contains(evt.target))closeMenu();});
  document.addEventListener('keydown',evt=>{if(evt.key==='Escape'){closeMenu();closeModal();}});
  /* ---------- Một tài khoản một thiết bị: kiểm tra phiên định kỳ, bị đăng nhập nơi khác thì dừng game ---------- */
  window.addEventListener('lh-kicked',e=>{
    if(window.LH_KICKED)return;window.LH_KICKED=true;try{closeModal();game.closeDialog();}catch(err){}
    const other=e.detail==='DANG_NHAP_NOI_KHAC';Net.setToken('');
    const box=document.createElement('div');box.className='kicked';
    box.innerHTML=`<div class="kicked-card">${svg(other?'user':'lock')}<b>${other?'Tài khoản đang được dùng ở thiết bị khác':'Phiên đăng nhập đã hết hạn'}</b><small>${other?'Mỗi tài khoản chỉ chơi trên một thiết bị. Phiên ở đây đã dừng. Phần chơi chưa lưu vẫn giữ trên máy này, sẽ gửi khi bạn vào lại.':'Đăng nhập lại để chơi tiếp.'}</small><button class="primary big-btn" id="kickedGo">Đăng nhập lại</button></div>`;
    document.getElementById('lu-hanh').appendChild(box);box.querySelector('#kickedGo').onclick=()=>location.reload();
  });
  const alive=()=>{if(!window.LH_KICKED&&Net.token&&document.visibilityState==='visible')Net.call('alive').catch(()=>{});};
  setInterval(alive,20000);document.addEventListener('visibilitychange',alive);
  window.GameUI={refresh,showAttributes,openPanel,showShop:(id,tab)=>{shopSel=null;showShop(id,tab);},showQuestBoard,showMaps,showMercBoard,showMarket,showQuests,save,previewElem,previewWho:()=>previewWho,previewBurst:()=>burstAt,
    showBag:()=>{if($('#overlay').hidden){selected=null;skillFocus=null;renderBag();}else closeModal();},
    frame(time,st){
      if(time-lastFrame<.1)return;lastFrame=time;refresh();$('#settingsBtn').classList.toggle('dirty',game.unsaved());$('#saveBtn').classList.toggle('dirty',game.unsaved());const now=Date.now();
      for(const [id,skill] of Object.entries(Player.skills)){const remaining=Math.max(0,(p.cooldowns[id]||0)-now),span=$('#skill-'+id+' .cooldown');if(!span)continue;span.style.setProperty('--progress',Math.min(100,remaining/skill.cooldown*100)+'%');span.textContent=remaining>0&&id!=='normal'?String(Math.ceil(remaining/1000)):'';}
      const bb=$('#bossBar');if(st&&st.boss){bb.hidden=false;bb.classList.toggle('final',st.boss.final);if(bb.dataset.t!==st.boss.type){bb.dataset.t=st.boss.type;bb.title=st.boss.name;$('#bossIc').innerHTML=LH_IMG.icon('quai:'+st.boss.type,monIc(st.boss.type,'tiger'));}$('#bossFill').style.width=Math.max(0,st.boss.hp/st.boss.max*100)+'%';$('#bossHp').textContent=Math.max(0,Math.ceil(st.boss.hp));}else bb.hidden=true;
    }};
  refresh();
};
