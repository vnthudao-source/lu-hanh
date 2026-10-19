/* ================= GIAO DIỆN TRONG GAME ================= */
window.startUI=(session)=>{
  const $=s=>document.querySelector(s),game=window.mapGame,p=game.player,info=Player.info,EL=Player.ELEMENTS,svg=game.svg;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tintOf=it=>{const d=info(it);return d?(d.element?EL[d.element].color:d.tint||null):null;};
  const qColor=it=>Player.rar(it).color;
  const icon=(type,color)=>{const d=Player.items[type],id=d?(d.icon||d.kind):type;return LH_IMG.icon('vat_pham:'+type,id,color);};
  const coins=c=>{const m=Player.money(c),out=[];if(m.gold)out.push(`<span class="coin gold"><i></i>${m.gold}</span>`);if(m.silver)out.push(`<span class="coin silver"><i></i>${m.silver}</span>`);if(m.copper||!out.length)out.push(`<span class="coin"><i></i>${m.copper}</span>`);return out.join('');};
  const ruby=n=>`<span class="coin ruby"><i></i>${n}</span>`;
  // v10.13: cỏ may mắn (nhận từ sự kiện đột xuất) — mỗi cỏ +1% tỉ lệ gia cường / dung hợp, tối đa 10 cỏ một lần
  const luckTag=()=>`<span class="coin luck" title="Cỏ may mắn: +1% tỉ lệ gia cường / dung hợp mỗi cỏ">${svg('wood')}${p.luck||0} cỏ</span>`;
  let luckUse=0;const luckMax=()=>Math.min(Number(Player.CFG.co_may_man_toi_da)||10,p.luck||0);
  const luckBar=()=>luckMax()>0?`<div class="luck-bar">${svg('wood')}<span>Cỏ may mắn (có ${p.luck}): dùng</span><input id="luckN" type="number" min="0" max="${luckMax()}" value="${Math.min(luckUse,luckMax())}" inputmode="numeric"><small>+${Math.min(luckUse,luckMax())}% tỉ lệ</small></div>`:'';
  const luckHook=()=>{const i=$('#luckN');if(i)i.onchange=()=>{luckUse=Math.max(0,Math.min(luckMax(),Math.floor(+i.value||0)));i.value=luckUse;const sm=i.nextElementSibling;if(sm)sm.textContent='+'+luckUse+'% tỉ lệ';};};
  const chip=(id,txt,color)=>`<i class="ch"${color?` style="color:${color}"`:''}>${svg(id)}${txt}</i>`;
  const lvb=it=>it&&it.lv?`<b class="lvb">+${it.lv}</b>`:'';
  const qdot=it=>{const q=Player.qOf(it);return q!=='n'?`<i class="qd" style="background:${qColor(it)}"></i>`:'';};
  const SLOT_NAMES={mount:'Thú cưỡi',hat:'Mũ',wings:'Cánh',left:'Tay trái',armor:'Áo giáp',right:'Tay phải',gloves:'Găng tay',pants:'Quần',shoes:'Giày'};
  const KIND_NAMES={sword:'Kiếm',shield:'Khiên',staff:'Gậy phép',bow:'Cung',spear:'Thương',crossbow:'Nỏ',saber:'Đao',mace:'Chùy',punch:'Tay không'}; // v10.14: đao, chùy
  const xpLeft=u=>{const m=Math.max(0,Math.ceil((u-Date.now())/60000));return m>=60?Math.floor(m/60)+' giờ '+(m%60?m%60+' phút':''):m+' phút';};
  const ERR={CHIEU_MO:'Chưa có đơn chiêu mộ',TUONG:'Chưa có danh tướng',BAG_FULL:'Túi đầy',PAIR:'Không cầm chung được',MONEY:'Không đủ tiền',SLOT:'Không mặc vào ô này được',RUBY:'Không đủ hồng ngọc',KN_DAY:'Thuốc kinh nghiệm đã đầy thời gian, chờ bớt rồi uống tiếp',KHONG_CAN_TAY:'Chưa cộng điểm nào, không cần tẩy',MAX:'Đã tối đa +15',BOOK:'Không phải sách',ITEM:'Món này không làm được việc này',GENDER:'Đồ này dành cho nhân vật khác giới',CMD:'Không đủ Mệnh lệnh (cộng điểm Mệnh lệnh hoặc cho lính nghỉ)',RUONG_DAY:'Rương chung đã đầy',RUONG_TRONG:'Chưa chọn đồ hoặc số tiền',KHONG_GUI_DUOC:'Đồ nhiệm vụ không cất vào rương được',RUONG_KHONG_DU_TIEN:'Rương không đủ tiền',RUONG_KHONG_DU_HONG_NGOC:'Rương không đủ hồng ngọc',KHONG_DU_TIEN:'Không đủ tiền',KHONG_DU_HONG_NGOC:'Không đủ hồng ngọc',VAT_PHAM_SAI:'Không tìm thấy món đồ',QUEST_FULL:'Chỉ nhận tối đa 3 việc cùng lúc',QUEST_HAVE:'Đã nhận việc này',QUEST_NOT_DONE:'Chưa làm xong',QUEST_DONE:'Việc này chỉ làm một lần',MERC_FULL:'Tối đa 3 lính đánh thuê',MERC:'Không tìm thấy lính',MERC_CU:'Suất lính này đã hết hạn, mở lại bảng',EVENT_CU:'Sự kiện này vừa được thưởng rồi',EVENT:'Không có sự kiện này',QUIZ_SIG:'Bài chấm không hợp lệ, nộp lại',POINTS:'Không đủ điểm',STAT:'Chỉ số không hợp lệ',MERC_DOWN:'Lính đang chờ ở làng, về làng để dắt đi',SHOP:'Món này gia cường ở chỗ khác',PET:'Không tìm thấy quái',LEVEL:'Chưa đủ cấp',KHONG_BAN:'Món này không bán được',QUEST_TRUOC:'Phải xong việc trước đã',QUIZ_TRUOC:'Phải xong bài trước đã',QUIZ_XONG:'Bài này đã xong',QUIZ_CHUA:'Chưa đủ manh mối',QUIZ_QUAI:'Bài này chưa có quái để săn',KHONG_CO:'Chưa có món này trong bộ sưu tập',FX:'Chọn một hiệu ứng tên',CHUA_LUU:'Chưa gửi được lên máy chủ, thử lại'};
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
    if(d.element)o.push(chip(EL[d.element].icon,elInfo(d.element,Player.bookFx(it),it.lv||0,d.element==='demon'?Player.demonOf(it):null),EL[d.element].color));
    if(d.slot==='book')o.push(chip('book','Sách bậc '+(Player.bookBac(it)+1)+' · '+['Thanh Mộc','Cổ Loa','Thăng Long','Hoa Lư','Phú Xuân'][Player.bookBac(it)],'#e4cc8d'));
    if(d.slot==='mount'){const need=Player.mountNeed(it),have=Player.derive(p).main.cmd;o.push(chip('flag','Cần '+need+' Mệnh lệnh',need>have?'#ff9a8a':'#ffe0a0'));}
    if(d.grip==='two')o.push(chip('hand2','Hai tay'));
    const W=d.slot==='hand'&&Player.WEAPONS[d.kind];if(W)o.push(chip('eye','Tầm '+W.range,'#bfe3ff'),chip('speed','Đánh '+String(W.dur).replace('.',',')+' giây','#bfe3ff'),chip('sword','Sát thương '+Math.round(W.dmg*100)+'%','#bfe3ff'),chip('orb','Mana '+Math.round(W.mana*100)+'% · hồi chiêu '+Math.round(W.cd*100)+'%','#bfe3ff'));
    if(Player.isRanged(d.kind))o.push(chip('aim','Chính xác '+Player.aimAcc(it)+'% (khóa mục tiêu)','#ffb49a'),chip('spark','x2 +'+(Number(Player.CFG.cung_no_x2)||15)+'%','#ffb49a'));
    if(d.beast)o.push(chip('spark',Player.BEASTS[d.beast].skill,'#ffe0a0'));
    for(const [k,v] of Object.entries(it.add||{}))o.push(`<i class="ch add">${addLine(k,v)}</i>`);
    return `<span class="chips">${o.join('')}</span>`;
  }
  const STAT_NM=Object.fromEntries(Player.GROUPS.map(g=>[g[0],g[1]])),STAT_IC=Object.fromEntries(Player.GROUPS.map(g=>[g[0],g[2]]));
  // v10.21: hiệu ứng sách theo độ mạnh k (bậc × phẩm chất) và cấp luyện lv; không truyền thì lấy theo sách đang gắn
  const C=Player.CFG,r1=v=>Math.round(v*10)/10,elInfo=(e,k,lv,dm)=>{if(k==null){const D=Player.derive(p);k=(D.bef||{})[e]||0;lv=Math.max(0,...(p.skillSlots||[]).filter(it=>info(it)&&info(it).element===e).map(it=>it.lv||0));dm=D.demon;}const pr=b=>r1(Number(C[b]||0)*k+(Number(C.sach_ti_le_cap)||1)*(lv||0));
    return ({fire:`+${r1(C.hoa_sat_thuong*k)}% sát thương`,water:`+${r1(C.thuy_hoi_mana*k)} mana/giây · hồi ${Math.min(60,r1(Number(C.thuy_hut_mau||16)*k))}% sát thương gây ra thành máu`,earth:`Phản ${r1(C.tho_phan_don*k)}% sát thương · ${pr('tho_treu_ti_le')}% Trêu ngươi (quái quanh mình quay sang đánh mình)`,metal:`Giảm ${r1(C.kim_giam_sat_thuong*k)}% sát thương nhận`,wood:`+${r1(C.moc_hoi_mau*k)} máu/giây`,thunder:`${pr('loi_ti_le')}% lôi quang +${C.loi_sat_thuong}% sát thương`,wind:`${pr('phong_ti_le')}% làm chậm ${C.phong_cham}% · ${r1(Number(C.phong_hoa_ti_le||3)*k+Number(C.phong_hoa_moi_cap||.3)*(lv||0))}% hoá thành quái, sát thương ×${C.phong_hoa_sat_thuong||2} trong ${Math.max(Number(C.phong_hoa_giay)||6,lv||0)} giây`,ice:`${pr('bang_ti_le')}% đóng băng quái · Vỡ băng +${r1(Number(C.bang_vo_bang||120)*k)}% sát thương lên quái đang đóng băng`,demon:dm?`Thu phục tối đa ${dm.max} quái${dm.boss>0?' · thu phục được trùm vùng':''}`:'Thu phục quái, tăng theo Mệnh lệnh',light:`${pr('sang_ti_le')}% dọa quái bỏ chạy`})[e];};
  const bkSum=it=>Object.values(Player.bookStat(it)).reduce((a,b)=>a+b,0);
  function gainText(d,it){if(d.slot==='mount')return `Tốc +${Player.mountGain(1).speed}; từ +7 thêm Công; từ +11 thêm Máu, Mana, Thủ`;if(d.slot==='book')return 'chỉ số +'+(it?bkSum({...it,lv:(it.lv||0)+1})-bkSum(it):Player.gainOf(d).stat)+(['thunder','wind','ice','demon','light'].includes(d.element)?`, tỉ lệ +${C.sach_ti_le_cap||1}%`:'');const g=Player.gainOf(d);return g.atk?'Công +2':g.def?'Thủ +1':g.speed?'Tốc +0.03':'';}
  function desc(it){
    const d=info(it);if(!d)return '';
    if(d.slot==='cos'||d.slot==='quest')return d.desc||(d.slot==='quest'?'Vật phẩm cốt truyện':'Mỹ phẩm');
    if(d.slot==='book')return `Gắn vào ô kỹ năng · nhiều sách cộng dồn chỉ số, hiệu ứng mỗi hệ tính một lần · luyện ở Đạo sĩ, Pháp sư: ${gainText(d,it)}/cấp`;
    if(!d.slot)return 'Nguyên liệu, mang bán cho thợ rèn.';
    let t;
    if(d.slot==='mount')t=`Thú cưỡi · phím 4: ${Player.BEASTS[d.beast].skill} · cần ${Player.mountNeed(it)} Mệnh lệnh (thú càng cao cấp, càng luyện cao càng cần nhiều)`;
    else if(d.slot==='hand'){const k=KIND_NAMES[d.kind];t=d.grip==='two'?k+' · cầm hai tay'+(d.kind==='crossbow'?' · bắn theo hướng chạy':''):k+' · một tay';}
    else t=SLOT_NAMES[d.slot];
    return t+(d.slot==='mount'?` · gia cường: ${gainText(d)}`:` · gia cường: ${gainText(d)}/cấp`);
  }
  function itemInfo(it){
    const d=info(it),R=Player.rar(it);let h=`<div class="sel-info"><b class="sel-name" style="color:${R.color}">${esc(Player.nameOf(it))}</b><small class="qtag" style="color:${R.color}">${R.name}${R.trade?' · bán được qua thương nhân':''}</small>${d.gender&&d.gender!==p.gender?`<small class="qtag" style="color:#ffb0a0">${svg('lock')}Đồ của nhân vật ${d.gender==='f'?'nữ':'nam'}: ${p.gender==='f'?'nữ':'nam'} không mặc được</small>`:''}${chips(it)}<small class="sel-desc">${desc(it)}</small>`;
    if(d.set){const S=Player.SETS[d.set],n=Player.derive(p).sets.find(x=>x.id===d.set);const full=Math.min(9,S.pieces.length);h+=`<small class="set-desc"><b>Bộ ${esc(S.name)} · ${esc(S.hero)}</b> (${n?n.n:0}/${full}) · ${d.gender==='f'?'nhân vật nữ':d.gender==='m'?'nhân vật nam':'nam nữ đều mặc'}<br>${[3,5,7].map(t=>`<span class="${n&&n.n>=t?'on':''}">${t} món: ${Object.entries(S.tiers[t]).map(([k,v])=>addLine(k,v)).join(', ')}</span>`).join('<br>')}<br><span class="${n&&n.n>=full?'on':''}">${full} món: ${esc(S.fxText)}</span></small>`;} // v10.14: bộ 8 món, bộ tướng ai cũng mặc
    if(d.fxText&&!d.set)h+=`<small class="set-desc"><b>${Player.FX_NAMES[d.fx]||''}</b>: ${esc(d.fxText)}</small>`;
    return h+'</div>';
  }
  const petLeft=e=>{const m=Math.max(0,Math.round((e-Date.now())/60000));return m>=60?Math.floor(m/60)+' giờ '+(m%60?m%60+' phút':''):Math.max(1,m)+' phút';};
  const menu=$('#gameMenu');let lastExp='',lastFrame=-1,lastType='',selected=null,skillFocus=null,burstAt=-9,lastBuffs='',shopSel=null,enhSel=null,shopQ='n',previewWho=null,mercSel=null,lastGender='';
  // bảng mở từ dân làng (cửa hàng, nhận việc, thuê lính, chợ): đóng bảng = rời cuộc nói chuyện → lưu
  let npcPanel=false;
  function closeMenu(){menu.hidden=true;$('#settingsBtn').setAttribute('aria-expanded','false');}
  function closeModal(){if(npcPanel){npcPanel=false;game.checkpoint();}$('#overlay').hidden=true;shopSel=null;previewWho=null;$('#scene').focus();}
  function openModal(titleHtml,content,wide=false){if($('#overlay').hidden)LH_Audio.play('open');delete $('#modalCard').dataset.mk;game.stop();game.closeDialog();closeMenu();$('#modalCard').classList.toggle('wide',wide);$('#overlayTitle').innerHTML=titleHtml;const keep=$('#overlay').hidden?0:$('#modalCard').scrollTop;$('#overlayBody').innerHTML=content;$('#overlay').hidden=false;$('#modalCard').scrollTop=keep;}
  function questHtml(){
    const V=villagers(),s=V.filter(n=>game.seen.includes(n.id)).length,total=V.length;if(s<total)return svg('talk')+`Gặp dân làng ${s}/${total}`;
    const act=Object.entries(p.quests.active);
    if(act.length){act.sort((a,b)=>(Player.QUESTS[b[0]]&&Player.QUESTS[b[0]].story?1:0)-(Player.QUESTS[a[0]]&&Player.QUESTS[a[0]].story?1:0));const [id,n]=act[0],Q=Player.QUESTS[id];return svg(Q.story?'heart':'quest')+`${esc(Q.name)} ${Math.min(n,Q.count)}/${Q.count}`+(Q.story&&n>=Q.count?` <small>· gặp ${esc(Q.npcName||Q.npc)}</small>`:'')+(act.length>1?` <small>+${act.length-1}</small>`:'');}
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
    const books=Object.keys(D.books),xb=Player.xpBuff(p),key=books.join()+'|'+(xb?xb+':'+xpLeft(p.flags.xp.u):'');if(key!==lastBuffs){lastBuffs=key;$('#buffs').innerHTML=books.map(b=>`<span class="buff" style="color:${EL[b].color}" title="${EL[b].name}: ${elInfo(b)}">${svg(EL[b].icon)}</span>`).join('')+(xb?`<span class="buff xpb" title="Thuốc kinh nghiệm +${xb}% · còn ${xpLeft(p.flags.xp.u)}">${svg('spark')}<small>+${xb}%</small></span>`:'');}
    const md=p.equipment.mount&&info(p.equipment.mount),mb=$('#skill-mount');mb.hidden=!md||game.safe;
    {const lb=$('#lockBtn'),rg=Player.isRanged(Player.stance(p).type);lb.hidden=!rg;lb.classList.toggle('on',rg&&game.lockOn);lb.setAttribute('aria-pressed',String(rg&&game.lockOn));}
    if(md&&mb.dataset.beast!==md.beast){mb.dataset.beast=md.beast;const B=Player.BEASTS[md.beast];$('#mountIcon').innerHTML=`<use href="#i-${B.icon}"/>`;$('#mountName').textContent=B.skill;mb.title='4 · '+B.skill+' · 12 mana';}
    document.querySelectorAll('.skill-wheel .skill:not(.normal):not(.lockon)').forEach(b=>b.classList.toggle('locked',game.safe));
    // chân dung góc trái: theo giới tính + diện mạo đang dùng (ảnh giao_dien:chan_dung_<diện mạo> nếu có, không thì chan_dung_nam/nu, không thì hình vẽ đổi màu da, tóc, râu)
    const C=p.cos&&p.cos.use||{},avKey=p.gender+'|'+(p.avatar||'')+'|'+(C.avatar||'')+'|'+(C.nen||'')+'|'+(C.ten||'');
    if(lastGender!==avKey){lastGender=avKey;const av=$('#avatarBtn'),A=Player.AVATARS[p.avatar]||null,cosAv=C.avatar&&info({type:C.avatar}),u=(cosAv&&cosAv.img)||(A&&LH_IMG.url('giao_dien:chan_dung_'+A.id))||LH_IMG.url('giao_dien:chan_dung_'+(p.gender==='f'?'nu':'nam'));
      // nền khung trên, hiệu ứng tên (Thuốc đa nhiệm); v10.12: bỏ khung chân dung
      const bg=C.nen&&info({type:C.nen}),hd=document.querySelector('#lu-hanh header');if(hd){hd.style.backgroundImage=bg&&bg.img?`linear-gradient(#14231d99,#14231dcc),url("${bg.img}")`:'';hd.style.backgroundSize='cover';hd.style.backgroundPosition='center';}
      $('#playerName').className='player-name'+(C.ten?' fx-'+C.ten:'');av.querySelector('.pf-img')?.remove();if(u)av.querySelector('.portrait').insertAdjacentHTML('afterend',`<img class="pf-img" src="${esc(u)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">`);
      const skin=A?A.skin:'#e4c69b',hair=A?A.hair:'#2a2622',sh=(h,k)=>LH_Look.shade?LH_Look.shade(h,k):h;$('#pfFace').setAttribute('fill',skin);$('#pfNeck').setAttribute('fill',sh(skin,-.06));$('#pfBody').setAttribute('fill',sh(skin,-.1));$('#pfTop').setAttribute('fill',hair);$('#pfHair').setAttribute('fill',hair);$('#pfBeard').setAttribute('fill',A&&A.beard||hair);
      $('#pfTop').style.display=A&&A.style==='troc'?'none':'';$('#pfHair').style.display=p.gender==='f'||(A&&A.style==='xoa')?'':'none';$('#pfYem').style.display=p.gender==='f'?'':'none';$('#pfBeard').style.display=A&&A.beard?'':'none';}
  }
  /* ---------- Bảng thuộc tính: 5 chỉ số lớn, chỉ số nhỏ chỉ hiện khi có cộng thêm ---------- */
  function showAttributes(){
    const D=game.HD,S=D.tot,A=D.add;
    const rows=Player.GROUPS.map(([g,name,ic])=>{
      const baseKey={str:'strength',agi:'agility',vit:'vitality',int:'intelligence',cmd:'command'}[g],plus=A[g]||0;
      const subs=Object.entries(Player.ADD).filter(([k,a])=>a.group===g&&k!==g&&(A[k]||0)>0).map(([k,a])=>`<div class="sub"><span>${a.name}</span><b>${S[k]}${a.unit}</b><em>+${Math.round(A[k]*10)/10}${a.unit}</em></div>`).join('');
      // v10.14: mỗi chỉ số lớn hiện rõ các chỉ số nhỏ nó sinh ra
      const bl=(nm,v)=>`<div class="sub base"><span>${nm}</span><b>${v}</b></div>`;
      const extra=g==='str'?bl('Sát thương',`${S.dmgMin}–${S.dmgMax}`)+bl('Tỉ lệ x2',S.crit2+'%'):g==='agi'?bl('Tốc đánh · chạy',`${S.atkSpd}% · ${S.moveSpd}%`)+bl('Phòng ngự · né',`${S.def} · ${S.dodge}%`)
        :g==='vit'?bl('Máu tối đa',S.hp)+bl('Hồi đầy máu khi trúng đòn',(S.fullHeal||0)+'%'):g==='int'?bl('Mana tối đa',S.mp)+bl('Hồi mana mỗi giây',S.mpReg||0)+bl('Giảm hồi chiêu',(S.cdr||0)+'%')+bl('Chính xác cung, nỏ',(S.aim||0)+'%')
        :g==='cmd'?(()=>{const c=Player.cmdInfo(p);return bl('Đang dùng',`${c.used} / ${c.total}`)+bl('Thú cưỡi · lính',`${c.mount} · ${c.merc}`)+bl('Sát thương lính thuê',`+${S.mercDmg||0}%`)+bl('Sát thương quái thu phục',`+${S.petDmg||0}%`);})():'';
      const al=(p.alloc&&p.alloc[baseKey])||0,addBtn=p.points>0?`<button class="pt-add" data-pt="${g}">+1</button>${p.points>=5?`<button class="pt-add" data-pt="${g}" data-n="5">+5</button>`:''}${p.points>=50?`<button class="pt-add" data-pt="${g}" data-n="50">+50</button>`:''}${p.points>=500?`<button class="pt-add" data-pt="${g}" data-n="500">+500</button>`:''}`:'';
      return `<div class="attr"><div class="main">${svg(ic)}<span>${name}</span><b>${D.main[g]}</b>${plus?`<em>+${plus}</em>`:''}${al?`<em title="Điểm đã cộng" style="color:#ffd98a">+${al}</em>`:''}${addBtn}</div>${extra}${subs}</div>`;
    }).join('');
    const sets=(D.power?chip('flame',`Uy lực trang bị +${D.power}% sát thương · máu`,'#ffb070'):'')+D.sets.map(x=>{const S2=Player.SETS[x.id];return chip('quest',`Bộ ${S2.name} ${x.n}/${Math.min(9,S2.pieces.length)}`,(Player.RAR[S2.q||'l']||Player.RAR.l).color);}).join('')+(D.enh&&D.enh.n9?chip('anvil',`Đồ +9: ${D.enh.n9}/8`,'#ffd77a'):'')+(D.enh?D.enh.list.map(([ic,t])=>chip(ic,t,'#ffd77a')).join(''):'');
    const fxs=Object.entries(D.fx).map(([k,v])=>chip('spark',Player.FX_NAMES[k]+' '+v,Player.RAR.m.color)).join('');
    const books=Object.keys(D.books).map(b=>chip(EL[b].icon,EL[b].name+': '+elInfo(b),EL[b].color)).join('');
    const need=Player.expNeed(p.level),maxed=p.level>=Player.maxLevel();
    const xp=`<div class="exp-line">${svg('spark')}<span>Kinh nghiệm</span><span class="xb"><i style="width:${maxed?100:Math.min(100,(p.exp||0)/need*100)}%"></i></span><b>${maxed?'Tối đa':`${p.exp||0} / ${need}`}</b></div>`+(Player.xpBuff(p)?`<div class="pts">${svg('spark')}<span>Thuốc kinh nghiệm +${Player.xpBuff(p)}% · còn ${xpLeft(p.flags.xp.u)}</span></div>`:'');
    const pts=p.points>0?`<div class="pts">${svg('check')}<span>Điểm cộng chưa dùng</span><b>${p.points}</b></div>`:'';
    openModal(ttl('user','Thuộc tính'),`<div class="attr-head"><b>${esc(p.name)}</b><small>${p.gender==='f'?'Nữ':'Nam'} · Lv. ${p.level}</small><button id="cosBtn" class="mini-btn">${svg('orb')}Phấn Son</button></div>${xp}${pts}<div class="attr-list">${rows}</div>${sets||fxs||books?`<span class="chips" style="justify-content:flex-start;margin-top:8px">${sets}${fxs}${books}</span>`:''}`);
    document.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>run(b,game.op({t:'pt',k:b.dataset.pt,n:Number(b.dataset.n||1)}).then(()=>{game.refreshHD();showAttributes();})));
    const cb=$('#cosBtn');if(cb)cb.onclick=showCosmetics;
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
      bar=`<span class="big" style="color:${tintOf(sel)||'#e4cc8d'}">${icon(sel.type)}</span>${itemInfo(sel)}`+(sd.slot==='book'?`<button class="primary" data-act="book">${svg('book')}Gắn sách</button>`:'')
        +(sd.slot==='cos'?(sd.kind==='thuoc'?Object.entries(Player.NAME_FX).map(([k,v])=>`<button class="primary fx-${k}" data-usefx="${k}">${svg('orb')}${v}</button>`).join(''):`<button class="primary" data-use="1">${svg('check')}Dùng</button>`):'')+`<button data-act="clear">${svg('close')}Bỏ chọn</button>`;
      if(tg.length)bar=bar.replace('</small></div>',' · chạm ô sáng để mặc</small></div>');
    }else if(skillFocus!==null&&p.skillSlots[skillFocus]){
      const it=p.skillSlots[skillFocus],on=p.activeBook===skillFocus;
      bar=`<span class="big" style="color:${tintOf(it)}">${svg(EL[info(it).element].icon)}</span><div class="sel-info"><b class="sel-name">${esc(info(it).name)}</b>${chips(it)}<small class="sel-desc">Đang gắn · hào quang ${on?'bật':'tắt'}</small></div><button class="primary" data-act="toggle">${svg('eye')}${on?'Tắt':'Bật'} hào quang</button><button data-act="remove">${svg('out')}Tháo</button><button data-act="clear">${svg('close')}Bỏ chọn</button>`;
    }
    openModal(ttl('bag','Túi đồ'),`<div class="bag-layout"><section><div class="equip-head"><canvas id="preview"></canvas><div><span class="chips" style="justify-content:flex-start">${chip(st.type,KIND_NAMES[st.type]+(st.dual?' đôi':''))}${chip('sword',`Sát thương ${D.tot.dmgMin}–${D.tot.dmgMax}`)}${chip('shield','Phòng ngự '+D.tot.def)}</span>${D.sets.length?`<span class="chips" style="justify-content:flex-start;margin-top:4px">${D.sets.map(x=>chip('quest',`${Player.SETS[x.id].hero} ${x.n}/${Math.min(9,Player.SETS[x.id].pieces.length)}`,(Player.RAR[Player.SETS[x.id].q||'l']||Player.RAR.l).color)).join('')}</span>`:''}</div></div><div class="equip-grid">${equip}</div><div class="gap"></div><div class="skill-grid">${skillSlots}</div></section><section><div class="bag-grid">${bagHtml()}</div><div class="money"><span class="coin gold"><i></i>${money.gold}</span><span class="coin silver"><i></i>${money.silver}</span><span class="coin"><i></i>${money.copper}</span>${ruby(p.rubies)}${luckTag()}</div></section></div>${bar?`<div class="sel-bar">${bar}</div>`:''}`,true);
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
    document.querySelectorAll('[data-use],[data-usefx]').forEach(btn=>btn.onclick=()=>{const i=selected;run(btn,game.op({t:'use',i,...(btn.dataset.usefx?{fx:btn.dataset.usefx}:{})}).then(r=>{LH_Audio.play('rare');game.message(svg('check')+({avatar:'Đã đổi ảnh chân dung',nen:'Đã đổi nền hồ sơ',ten:'Tên nhân vật đã có hiệu ứng '+(Player.NAME_FX[r.id]||'')}[r.kind]||'Đã dùng')+' · đổi qua lại ở bảng Diện mạo');selected=null;game.refreshHD();renderBag();}));});
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
  function enhHtml(id,isBook){
    const list=enhList(id);
    if(!list.length)return `<div class="shop-empty">${svg('anvil')}<span>Chưa có món đồ để gia cường</span></div>`;
    let cur=enhSel&&list.find(r=>r.where===enhSel.where&&String(r.key)===String(enhSel.key));if(!cur){cur=list[0];enhSel={where:cur.where,key:cur.key};}
    const it=cur.it,lv=it.lv||0,max=lv>=Player.MAX_LV,rate=Player.enhRate(lv),cost=Player.enhCost(lv),next={...it,lv:lv+1};
    const tiles=list.map(r=>`<button class="mini${r===cur?' sel':''}" data-enh="${r.where}:${r.key}" title="${esc(Player.nameOf(r.it))}" style="${Player.qOf(r.it)!=='n'?`border-color:${qColor(r.it)}`:''}"><span style="color:${tintOf(r.it)||'#e4cc8d'}">${icon(r.it.type)}</span>${lvb(r.it)}${r.where!=='bag'?'<small class="worn">Đang dùng</small>':''}</button>`).join('');
    return `<div class="enh"><div class="enh-list">${tiles}</div><div class="enh-box"><div class="enh-top"><span class="big" style="color:${tintOf(it)||'#e4cc8d'}">${icon(it.type)}</span><div><b class="sel-name" style="color:${qColor(it)}">${esc(Player.nameOf(it))}</b>${chips(it)}</div></div>
      ${max?'':`<div class="enh-next">${svg('next')}<b>+${lv+1}</b>${chips({...next,add:{}})}</div>`}
      ${max?'':luckBar()}<div class="enh-rows"><div><small>Tỉ lệ</small><b>${max?'—':Math.round(rate*100)+'%'+(Math.min(luckUse,luckMax())?' +'+Math.min(luckUse,luckMax())+'%':'')}</b></div><div><small>Phí</small><b>${max?'—':ruby(cost)}</b></div><div><small>Hồng ngọc</small><b>${ruby(p.rubies)}</b></div></div>
      <small class="sel-desc">${RATE_NOTE(lv)} · ${info(it).slot==='mount'?gainText(info(it)):'Mỗi cấp: '+gainText(info(it),it)}</small>
      <button id="enhGo" class="primary big-btn"${max?' disabled':''}>${svg(isBook?'book':'anvil')}${isBook?'Luyện sách':'Gia cường'}</button></div></div>`;
  }
  function showShop(id,tab='buy'){
    // hiệu buôn thành trì (thanh-<vùng>): tên theo vùng, có gia cường; món nào cũng ghi bậc (· cấp N) = cấp thành
    const RG=/^thanh-/.test(id)?Player.REGIONS.find(r=>id.startsWith('thanh-'+r.id)):null;
    const RG2=/^thanh-/.test(id)?Player.REGIONS.find(r=>id.startsWith('thanh-'+r.id)):null,RGN=RG2?RG2.name.replace(/^(Thành|Kinh Thành|Cố Đô) /,''):'';
    const list=Player.SHOPS[id]||[],META={smith:{icon:'sword',title:'Lò rèn',enh:'Gia cường'},trainer:{icon:'mount',title:'Thú cưỡi',enh:'Nâng thú'},wizard:{icon:'book',title:'Sách ngũ hành',enh:'Luyện sách'},'phan-son':{icon:'orb',title:'Tiệm Phấn Son · mua bằng hồng ngọc'}}[id]||(RG2?(/-ren$/.test(id)?{icon:'sword',title:'Lò rèn '+RGN,enh:'Gia cường'}:/-thu$/.test(id)?{icon:'mount',title:'Chuồng thú '+RGN,enh:'Nâng thú'}:/-sach$/.test(id)?{icon:'book',title:'Pháp sư '+RGN+' · sách bậc '+RG2.lv,enh:'Luyện sách'}:{icon:'bag',title:'Hiệu buôn '+RGN,enh:'Gia cường'}):{icon:'bag',title:'Cửa hàng'});
    if(tab==='enh'&&!META.enh)tab='buy';const isBook=id==='wizard'||/-sach$/.test(id);
    const qs=[...new Set(list.flatMap(r=>r.q))],full=p.bag.indexOf(null)<0;if(!qs.includes(shopQ))shopQ=qs[0]||'n';
    const tile=(attr,type,it,price,go,goTxt,off,sel)=>{const dd=info(it)||{};return `<button class="tile${off?' off':''}${sel?' sel':''}${dd.img?' pic':''}" ${attr} title="${esc(desc(it))}" style="${Player.qOf(it)!=='n'?`border-color:${qColor(it)}`:''}"><span class="ti" style="color:${tintOf(it)||'#e4cc8d'}">${icon(type)}</span>${lvb(it)}<b class="nm" style="color:${qColor(it)}">${esc(Player.nameOf(it))}</b>${chips(it)}${dd.desc?`<small>${esc(dd.desc)}</small>`:''}<span class="price">${dd.ruby&&go==='bag'?ruby(dd.ruby):coins(price)+(go==='bag'&&it.rb?ruby(it.rb):'')}</span><span class="go">${svg(go)}${goTxt}</span></button>`;};
    let body;
    if(tab==='buy'){
      const qbar=qs.length>1?`<div class="qbar">${qs.map(q=>`<button data-q="${q}" class="${q===shopQ?'on':''}" style="color:${Player.RAR[q].color}">${Player.RAR[q].name}</button>`).join('')}${isBook?`<small>Sách phẩm chất cao cộng nhiều điểm hơn, hiệu ứng mạnh hơn · sách Huyền thoại, Thần chỉ rơi khi hạ trùm</small>`:shopQ!=='n'?`<small>Mỗi món có ${Player.RAR[shopQ].lines} dòng thuộc tính ngẫu nhiên</small>`:''}</div>`:'';
      body=qbar+`<div class="shop-grid">${list.filter(r=>r.q.includes(shopQ)||(info({type:r.id})||{}).q&&r.q.includes(info({type:r.id}).q)).map(r=>{const d=info({type:r.id}),q=d&&d.q?d.q:shopQ,price=Player.shopPrice(r.id,q,id),rb=d&&d.ruby?0:Player.shopRuby(r.id,q,id),it={type:r.id,q,...(r.t?{t:r.t}:{}),...(rb?{rb}:{})};return tile(`data-buy="${r.id}"`,r.id,it,price,'bag','Mua',(d&&d.ruby?p.rubies<d.ruby:p.copper<price||p.rubies<rb)||full,shopSel===r.id);}).join('')}</div>`;
    }
    else if(tab==='sell'){const t=p.bag.map((it,i)=>it&&info(it)&&info(it).slot!=='cos'&&info(it).slot!=='quest'?tile(`data-sell="${i}"`,it.type,it,Player.sellPrice(it),'coin','Bán',false,shopSel===String(i)):'').join('');body=`<div class="shop-grid">${t||`<div class="shop-empty">${svg('bag')}<span>Túi trống</span></div>`}</div>`;}
    else body=enhHtml(id,isBook);
    const tabs=[['buy',META.icon,'Mua'],['sell','coin','Bán'],...(META.enh?[['enh',isBook?'book':'anvil',META.enh]]:[])];
    openModal(`<div class="shop-tabs">${tabs.map(([k,ic,tx])=>`<button data-tab="${k}" class="${tab===k?'on':''}">${svg(ic)}${tx}</button>`).join('')}</div><div class="purse">${coins(p.copper)}${ruby(p.rubies)}</div>`,`<div class="shop-sub">${svg(META.icon)}${META.title}${tab==='enh'?'':' · chạm 2 lần để '+(tab==='buy'?'mua':'bán')}</div>${body}`,true);
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{shopSel=null;showShop(id,b.dataset.tab);});
    document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{shopQ=b.dataset.q;shopSel=null;showShop(id,'buy');});
    // v10.12: mỹ phẩm Phấn Son mua xong áp dụng ngay (thuốc đa nhiệm: chọn hiệu ứng tên rồi mới mua)
    const buyDone=r=>{LH_Audio.play('buy');if(r.pot){game.refreshHD();refresh();game.message(svg('check')+(r.pot.kind==='kn'?`Đã uống · +${r.pot.p}% kinh nghiệm đánh quái, còn ${xpLeft(r.pot.u)}`:`Đã tẩy · ${r.pot.pts} điểm cộng trả về, mở Thuộc tính để cộng lại`));}else if(r.cos){game.refreshHD();refresh();game.message(svg('check')+({avatar:'Đã mua và thay ảnh chân dung',nen:'Đã mua và đổi nền hồ sơ',ten:'Đã mua · tên nhân vật có hiệu ứng '+(Player.NAME_FX[r.cos.id]||'')}[r.cos.kind]||'Đã mua')+' · đổi qua lại ở Thuộc tính → Phấn Son');}else game.message(svg('check')+`Đã mua <b style="color:${qColor(r.item)}">${esc(Player.nameOf(r.item))}</b>`);shopSel=null;showShop(id,'buy');};
    document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const type=b.dataset.buy,d=info({type});if(shopSel!==type){shopSel=type;showShop(id,'buy');return;}if(d&&d.slot==='cos'&&d.kind==='thuoc')return;run(b,game.op({t:'buy',type,q:shopQ,shop:id}).then(buyDone));});
    if(shopSel&&tab==='buy'){const d=info({type:shopSel});const tile=document.querySelector(`[data-buy="${shopSel}"]`);if(tile&&d&&d.slot==='cos'&&d.kind==='thuoc'){const go=tile.querySelector('.go');if(go){go.innerHTML='<small>Chọn hiệu ứng tên:</small>';const bar=document.createElement('span');bar.className='fx-pick';bar.innerHTML=Object.entries(Player.NAME_FX).map(([k,v])=>`<button class="fx-${k}" data-buyfx="${k}">${v}</button>`).join('');go.appendChild(bar);
      bar.querySelectorAll('[data-buyfx]').forEach(x=>x.onclick=e=>{e.stopPropagation();run(x,game.op({t:'buy',type:shopSel,q:shopQ,fx:x.dataset.buyfx,shop:id}).then(buyDone));});}}}
    document.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{const i=b.dataset.sell;if(shopSel!==i){shopSel=i;showShop(id,'sell');return;}run(b,game.op({t:'sell',i:Number(i)}).then(r=>{game.message(svg('coin')+'Đã bán '+esc(Player.nameOf(r.item))+' '+coins(r.v));shopSel=null;showShop(id,'sell');}));});
    document.querySelectorAll('[data-enh]').forEach(b=>b.onclick=()=>{const [w,k]=b.dataset.enh.split(':');enhSel={where:w,key:w==='eq'?k:Number(k)};showShop(id,'enh');});luckHook();
    const go=$('#enhGo');if(go)go.onclick=()=>{const t0=Date.now();const cur=enhSel.where==='sk'?p.skillSlots[enhSel.key]:enhSel.where==='bag'?p.bag[enhSel.key]:p.equipment[enhSel.key],ce=info(cur)&&info(cur).element;go.innerHTML=svg(isBook?'book':'anvil')+(isBook?'Đang luyện':'Đang rèn')+'…';game.hammer(ce?EL[ce].color:null);const luck=Math.min(luckUse,luckMax());run(go,game.op(enhSel.where==='sk'?{t:'enhSk',key:enhSel.key,shop:id,luck}:{t:'enh',where:enhSel.where==='bag'?'bag':'eq',key:enhSel.key,shop:id,luck}).then(r=>new Promise(ok=>setTimeout(()=>ok(r),Math.max(0,550-(Date.now()-t0))))).then(r=>{const name=info(r.item).name;game.enhanceFx(r.ok);game.message(r.ok?svg('check')+`Thành công! ${esc(name)} +${r.to}`:svg('close')+`Thất bại\u{2026} ${esc(name)} về +${r.to}`);showShop(id,'enh');}),()=>showShop(id,'enh'));};
  }
  /* ---------- Lý trưởng: bảng nhiệm vụ ---------- */
  function rewardChips(Q){const o=[];if(Q.copper)o.push(`<i class="ch">${coins(Q.copper)}</i>`);if(Q.rubies)o.push(`<i class="ch">${ruby(Q.rubies)}</i>`);if(Q.item&&Player.items[Q.item]){const it={type:Q.item,q:Q.itemQ};o.push(`<i class="ch" style="color:${qColor(it)}">${icon(Q.item)}${esc(Player.items[Q.item].name)} · ${Player.RAR[Q.itemQ||'n'].name}</i>`);}return o.join('');}
  function showQuestBoard(){
    // việc làm một lần đã xong thì không hiện nữa; xếp theo cấp, nhóm theo vùng; vùng chưa đủ cấp hiện khóa
    const lv=p.level||1,R=id=>Player.REGIONS.find(r=>r.id===id)||Player.REGIONS[0];
    const list=Object.values(Player.QUESTS).filter(Q=>!Q.story&&(Q.repeat||!p.quests.done[Q.id]||p.quests.active[Q.id]!=null))
      .map(Q=>({Q,need:Player.questLevel(Q),reg:R(Player.regionOf(Q.target))})).sort((a,b)=>a.need-b.need);
    // v10.12: cốt truyện Tìm con không bày trên bảng; chỉ chỉ chỗ NPC đang giữ việc, tới gặp mới biết việc gì
    let last='',rows=storyHint();
    for(const {Q,need,reg} of list){
      const key=need+'|'+reg.id,lock=lv<need;
      if(key!==last){last=key;rows+=`<div class="qgroup${lock?' qlock':''}">${svg(lock?'lock':reg.icon)}<b>${esc(reg.name)}</b><span>${lock?'Cần cấp '+need:'Cấp '+need+'+'}</span></div>`;}
      const n=p.quests.active[Q.id],done=p.quests.done[Q.id]||0,M=Player.MON[Q.target],act=n!=null,ready=act&&n>=Q.count;
      const btn=ready?`<button class="primary" data-turnin="${Q.id}">${svg('check')}Trả việc</button>`:act?`<span class="qprog">${n}/${Q.count}</span>`:(!Q.repeat&&done)?`<span class="qprog">Đã xong</span>`:lock?`<span class="qprog">${svg('lock')}${need}</span>`:`<button data-accept="${Q.id}">${svg('next')}Nhận</button>`;
      rows+=`<div class="qrow${act?' act':''}${lock&&!act?' dim':''}">${LH_IMG.icon('quai:'+Q.target,monIc(Q.target,'flag'))}<div><b>${esc(Q.name)}</b><small>${esc(Q.desc)} · ${M?esc(M.name):''} ×${Q.count}${done?` · đã làm ${done} lần`:''}</small><span class="chips">${rewardChips(Q)}</span></div>${btn}</div>`;
    }
    openModal(ttl('quest','Lý trưởng giao việc'),`<small class="sel-desc">Lv. ${lv} · nhận tối đa ${Player.MAX_ACTIVE_QUEST} việc cùng lúc. Xong việc quay về gặp Lý trưởng để nhận thưởng.</small><div class="quest-rows" style="margin-top:8px">${rows||`<div class="cho-note">${svg('check')}<span>Đã làm xong mọi việc của làng. Hãy ra Đông Ngạn săn quái, luyện cấp.</span></div>`}</div>`,true);
    document.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>run(b,game.op({t:'qa',id:b.dataset.accept}).then(()=>showQuestBoard())));
    document.querySelectorAll('[data-turnin]').forEach(b=>b.onclick=()=>run(b,game.op({t:'qt',id:b.dataset.turnin}).then(r=>{rewardMsg(r);showQuestBoard();})));
  }
  const rewardMsg=r=>game.message(svg('check')+'Nhận thưởng'+(r.copper?' '+coins(r.copper):'')+(r.rubies?' '+ruby(r.rubies):'')+(r.exp?' · +'+r.exp+' kinh nghiệm':'')+(r.item?` \u{00b7} <b style="color:${qColor(r.item)}">${esc(Player.nameOf(r.item))}</b>`:''))||(r.up&&game.levelUp(r.up));
  const regName=id=>(Player.REGIONS.find(r=>r.id===id)||{}).name||id;
  // v10.43: Kỷ vật — đồ cốt truyện cất lại sau khi đưa An về làng (không chiếm ô túi), bấm vào để đọc lời kể
  function keepsakeHtml(){const kv=Array.isArray(p.flags.kyvat)?p.flags.kyvat:[];if(!kv.length)return '';
    return `<div class="kyvat"><b>${svg('heart')}Kỷ vật</b><div class="kv-grid">${kv.map(id=>{const d=Player.items[id];if(!d)return '';return `<button class="kv" data-kv="${esc(id)}" title="${esc(d.name)}">${d.img?`<img src="${esc(d.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:svg('quest')}<small>${esc(d.name)}</small></button>`;}).join('')}</div><p class="kv-desc" id="kvDesc">Bấm vào một kỷ vật để đọc lại câu chuyện.</p></div>`;}
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-kv]');if(!b)return;const d=Player.items[b.dataset.kv],el=document.getElementById('kvDesc');if(d&&el)el.textContent=d.name+': '+(d.desc||'');});
  // Bảng nhiệm vụ chỉ báo NPC nào đang giữ việc Tìm con (đang làm: nơi trả việc)
  function storyHint(){
    const act=Object.keys(p.quests.active).map(id=>Player.QUESTS[id]).find(Q=>Q&&Q.story);
    if(act){const ok=Player.questReady(p,act);return `<div class="qgroup story">${svg('heart')}<b>Tìm con</b><span>${esc(act.name)} · ${storyGoal(act,1)}</span></div><div class="qnpc">${svg(ok?'check':'talk')}<div><b>${ok?'Về gặp':'Xong việc về gặp'} ${esc(act.npcName||act.npc)}</b><small>${esc(regName(act.at))}</small></div></div>`;}
    const nx=Player.storyNext(p);if(!nx)return Object.values(Player.QUESTS).some(Q=>Q.story)?`<div class="qgroup story">${svg('heart')}<b>Tìm con</b><span>${Number(p.flags.rescue)>=2?'Đã đưa con gái về nhà · hành trình trọn vẹn':Number(p.flags.rescue)===1?'Đã cứu được An · đưa con về làng Thanh Mộc':'Manh mối cuối: An bị đưa qua Hư Không Giới tới Hỗn Nguyên Điện (cấp 999)'}</span></div>${keepsakeHtml()}`:'';
    const need=Player.questLevel(nx),lock=(p.level||1)<need;
    return `<div class="qgroup story">${svg('heart')}<b>Tìm con</b><span>Lần theo manh mối qua từng vùng để cứu con gái</span></div><div class="qnpc">${svg(lock?'lock':'talk')}<div><b>${esc(nx.npcName||nx.npc)} đang có việc muốn nhờ bạn</b><small>${esc(regName(nx.at))}${lock?' · cần cấp '+need:' · tới gặp để biết việc gì'}</small></div></div>`;
  }
  // Gặp NPC đang giữ việc cốt truyện: kể chuyện, nhận / trả việc tại chỗ; xong mới mở bảng thường của NPC (nếu có)
  // v10.39: mục tiêu của việc Tìm con — quái ×số, trò nhỏ (LH_TC) hoặc điều kiện có sẵn
  const TC=typeof LH_TC!=='undefined'?LH_TC:{},tcPlay=typeof LH_TroChoi==='function'?LH_TroChoi({openModal,closeModal,svg,esc,ttl}):null;
  function storyGoal(Q,withCount){const M=Player.MON[Q.target],S=TC[Q.id],n=p.quests.active[Q.id];
    if(M)return esc(M.name)+(withCount&&n!=null?` ${Math.min(n,Q.count)}/${Q.count}`:` ×${Q.count}`);return esc(S&&S.hint||Q.name);}
  function showStoryTalk(n,st){
    const Q=st.Q,need=Player.questLevel(Q),lock=(p.level||1)<need,S=TC[Q.id],mini=!!(S&&tcPlay&&!['talk','find','escort','cond'].includes(S.k));
    const next=n.panel?`<button id="stNext">${svg('next')}${({shop:'Mua bán',quests:'Sổ việc',mercs:'Thuê lính',market:'Chợ',avatar:'Đổi diện mạo',fuse:'Dung hợp',nap:'Nạp thẻ',chest:'Mở rương',quiz:'Hỏi bài'})[n.panel]||'Mở'}</button>`:'';
    const where=esc(regName(Player.regionOf(Q.target)));
    const body=st.state==='new'?`<div class="story-talk"><span class="who">${svg('talk')}</span><div><p>${esc(Q.desc)}</p><small class="sel-desc">${storyGoal(Q)} · ${where}${lock?' · cần cấp '+need:''}</small><span class="chips">${rewardChips(Q)}</span></div></div><div class="story-bar">${next}<button class="primary" id="stGo"${lock?' disabled':''}>${svg('check')}Nhận việc</button></div>`
      :st.state==='ready'?`<div class="story-talk"><span class="who">${svg('check')}</span><div><p>Việc đã xong: ${esc(Q.name)}.</p><span class="chips">${rewardChips(Q)}</span></div></div><div class="story-bar">${next}<button class="primary" id="stGo">${svg('check')}Trả việc</button></div>`
      :`<div class="story-talk"><span class="who">${svg('quest')}</span><div><p>${esc(Q.desc)}</p><small class="sel-desc">${storyGoal(Q,1)} · ${mini?'thua thì chơi lại ngay':'làm ở '+where+' · xong về gặp ta'}</small></div></div><div class="story-bar">${next}${mini?`<button class="primary" id="stPlay">${svg('next')}Bắt đầu</button>`:''}</div>`;
    openModal(ttl('heart',esc(n.name)+' · Tìm con'),body);
    const nb=$('#stNext');if(nb)nb.onclick=()=>openPanel(n,true);
    const pl=$('#stPlay');if(pl)pl.onclick=()=>tcPlay(Q,S,()=>game.op({t:'sg',id:Q.id}).then(()=>{refresh();showStoryTalk(n,{Q,state:'ready'});},e=>{fail(e);}));
    const go=$('#stGo');if(go)go.onclick=()=>run(go,game.op(st.state==='new'?{t:'qa',id:Q.id}:{t:'qt',id:Q.id}).then(r=>{
      if(st.state==='new'){game.message(svg('quest')+'Đã nhận: '+esc(Q.name));LH_Audio.play('quest');if(mini)showStoryTalk(n,{Q,state:'active'});else closeModal();return;}
      rewardMsg(r);LH_Audio.play('quest');
      openModal(ttl('heart','Tìm con · '+Q.name),`<div class="story-end">${svg('quest')}<p>${esc(Q.end||'Cảm ơn, hành trình còn dài.')}</p></div><button class="primary big-btn" id="storyOk">${svg('next')}Tiếp tục</button>`);
      $('#storyOk').onclick=()=>{const nx=Player.storyNext(p);if(nx)game.message(svg('talk')+`Manh mối tiếp: gặp ${nx.npcName||nx.npc} ở ${regName(nx.at)}${(p.level||1)<Player.questLevel(nx)?' (cần cấp '+Player.questLevel(nx)+')':''}`);closeModal();};
    }));
  }
  /* ---------- Người dẫn đường: lính đánh thuê ---------- */
  const statLine=st=>`<small class="sel-desc">Sức mạnh ${st.strength} · Nhanh nhẹn ${st.agility} · Sức khỏe ${st.vitality} · Trí tuệ ${st.intelligence}</small>`;
  const gearIcons=eq=>Player.slots.map(k=>eq&&eq[k]&&info(eq[k])?`<span title="${esc(Player.nameOf(eq[k]))}" style="color:${qColor(eq[k])}">${icon(eq[k].type)}</span>`:'').join('');
  function showMercBoard(tab='hire'){
    const tabs=`<div class="shop-tabs"><button data-mt="hire" class="${tab==='hire'?'on':''}">${svg('user')}Thuê lính</button><button data-mt="mine" class="${tab==='mine'?'on':''}">${svg('flag')}Lính của tôi (${p.mercs.length}/${Player.MAX_MERC})</button></div><div class="purse">${coins(p.copper)}${ruby(p.rubies||0)}</div>`;
    let body='';
    if(tab==='hire'){
      const c=Player.cmdInfo(p);
      const here=World.id,isCity=Object.values(Player.MERCS).some(M=>M.map===here);
      // v10.13: lính thành trì chào thuê theo ngày — có cấp, chỉ số chia ngẫu nhiên, mệnh lệnh; làng: lính thường như cũ
      const row=(M,key,lv)=>`<div class="mrow"><span class="mg">${M.gender==='f'?'Nữ':'Nam'}</span><div><b>${esc(M.name)}${lv?` <small class="qtag" style="color:#9fe8a8">Lv. ${lv}</small>`:''}</b>${M.map?`<small class="qtag" style="color:#c8e0ff">${svg('book')}Mỗi ngày nhận ngẫu nhiên một hệ sách (đòn có hệ, mỗi 4 đòn ra chiêu diện rộng)</small>`:''}<small class="sel-desc">${esc(M.desc||'')}</small><span class="chips">${chip(STAT_IC.str,'Sức mạnh '+M.stats.strength)}${chip(STAT_IC.agi,'Nhanh nhẹn '+M.stats.agility)}${chip(STAT_IC.vit,'Sức khỏe '+M.stats.vitality)}${chip(STAT_IC.int,'Trí tuệ '+M.stats.intelligence)}${chip('flag','Mệnh lệnh '+Player.mercCost(M),Player.mercCost(M)>c.free?'#ffb0a0':'')}</span><small class="need${Player.mercCost(M)>c.free?' no':''}">${svg('flag')}Đi theo cần ${Player.mercCost(M)} / còn ${c.free}${Player.mercCost(M)>c.free?' · thuê xong để nghỉ':''}</small></div><button data-hire="${key}"${p.copper<M.price?' disabled':''}>${coins(M.price)}Thuê</button></div>`;
      const npc=isCity?Player.mercOffers(here).map(o=>row(o,`${o.tpl}:${o.k}:${o.day}`,o.lv)).join(''):Object.values(Player.MERCS).filter(M=>!M.map).map(M=>row(M,M.id,0)).join('');
      // v10.14: đơn chiêu mộ — tốn hồng ngọc, rút phẩm cấp lính (thường / tinh nhuệ / thiện chiến / huyền thoại / thần thoại); huyền thoại, thần thoại là danh tướng mặc sẵn bộ đồ
      const TC=Player.TIER_NAME,tc=t=>(Player.RAR[t]||Player.RAR.n).color,cost=Number(Player.CFG.chieu_mo_hong_ngoc)||100,PT=String(Player.CFG.chieu_mo_ti_le||'50,35,10,3,2').split(','),o=p.recruit;
      const priceHtml=pr=>(pr.copper?coins(pr.copper):'')+(pr.rubies?ruby(pr.rubies):'')||'<span class="coin"><i></i>0</span>';
      // v10.31: cỏ may mắn chuyển % lính thường sang tinh nhuệ, thiện chiến (không đổi % danh tướng)
      const LK=Math.min(luckUse,luckMax())*(Number(Player.CFG.co_may_man_chieu_mo)||2),PA=PT.map(Number),mv=Math.min(PA[0]||0,LK);if(mv){PA[0]-=mv;PA[1]+=mv/2;PA[2]+=mv/2;}
      const odds=`<span class="chips">${Player.TIERS.map((t,i)=>chip('user',`${TC[t]} ${Math.round((PA[i]||0)*10)/10}%`,tc(t))).join('')}</span>`;
      const freeN=Number(p.flags&&p.flags.freeRecruit)||0,freeBtn=freeN&&World.id==='thanh-moc'?`<button class="primary" data-recruit-free${o?' disabled':''}>${svg('flag')}Chiêu mộ miễn phí (còn ${freeN})</button>`:freeN?`<small class="sel-desc">Có ${freeN} lượt chiêu mộ miễn phí · dùng ở làng Thanh Mộc</small>`:'';
      let offer='';
      if(o){const mul=Player.tierMul(o),canPay=p.copper>=(o.price.copper||0)&&p.rubies>=(o.price.rubies||0),S=o.set&&Player.SETS[o.set];
        const gear=S?`<span class="gear">${S.pieces.map(id=>`<span title="${esc(Player.items[id].name)}" style="color:${(Player.RAR[S.q]||Player.RAR.l).color}">${icon(id)}</span>`).join('')}</span><small class="sel-desc">Mặc sẵn bộ ${esc(S.name)} (${S.pieces.length} món) · tháo ra cho mình dùng được</small>`:(o.gear||[]).length?`<span class="gear">${o.gear.map(id=>Player.items[id]?`<span style="color:${(Player.RAR[o.tier==='p'?'p':o.tier==='g'?'g':'n']||Player.RAR.n).color}">${icon(id)}</span>`:'').join('')}</span>`:'';
        offer=`<div class="mrow rc" style="border-color:${tc(o.tier)}"><span class="mg" style="color:${tc(o.tier)}">${o.gender==='f'?'Nữ':'Nam'}</span><div><b style="color:${tc(o.tier)}">${esc(o.name)} <small class="qtag" style="color:#9fe8a8">Lv. ${o.lv}</small> <small class="qtag" style="color:${tc(o.tier)}">${TC[o.tier]}${mul>1?` · máu, sát thương ×${mul}`:''}</small></b><small class="sel-desc">${esc(o.desc||'')}</small><span class="chips">${chip(STAT_IC.str,'Sức mạnh '+o.stats.strength)}${chip(STAT_IC.agi,'Nhanh nhẹn '+o.stats.agility)}${chip(STAT_IC.vit,'Sức khỏe '+o.stats.vitality)}${chip(STAT_IC.int,'Trí tuệ '+o.stats.intelligence)}${chip('flag','Mệnh lệnh '+Player.mercCost(o),Player.mercCost(o)>c.free?'#ffb0a0':'')}</span>${gear}</div><span class="mbtns"><button class="primary" data-rchire${canPay&&p.mercs.length<Player.MAX_MERC?'':' disabled'}>${priceHtml(o.price)}Nhận</button><button data-rcdrop>Bỏ qua</button></span></div>`;}
      const rc=`<h4 class="sec">Đơn chiêu mộ</h4>${o?'':luckBar().replace('% tỉ lệ','% tỉ lệ').replace(/\+(\d+)% tỉ lệ/,(a,b)=>'+'+(b*(Number(Player.CFG.co_may_man_chieu_mo)||2))+'% tinh nhuệ / thiện chiến')}<div class="rc-box"><button class="primary" data-recruit${p.rubies<cost||o?' disabled':''}>${svg('flag')}Gửi đơn chiêu mộ ${ruby(cost)}</button>${freeBtn}${odds}</div>${offer}`;
      body=`${rc}<h4 class="sec">${isCity?'Lính thành trì chào thuê hôm nay (đổi suất mỗi ngày)':'Lính trong vùng'}</h4>${npc}`;
    }else{
      const m=mercSel!=null?p.mercs[mercSel]:null;
      const c=Player.cmdInfo(p),pct=x=>Math.max(0,Math.min(100,x/Math.max(1,c.total)*100)).toFixed(1)+'%';
      const cmdLine=`<div class="cmd-line">${svg('flag')}<span>Mệnh lệnh</span><b>${c.used} / ${c.total}</b><div class="cmd-bar"><i class="m" style="width:${pct(c.mount)}"></i><i class="l" style="width:${pct(c.merc)}"></i></div><small>Thú cưỡi ${c.mount} · Lính ${c.merc} · Còn trống <b>${c.free}</b></small></div>`;
      const stat=M=>!(M.hpFrac>0)?'<small class="qtag" style="color:#ffb0a0">Chờ ở làng</small>':M.on?'<small class="qtag" style="color:#9fe8a8">Đang đi theo</small>':'';
      const need=M=>{const n=Player.mercCost(M);return M.on?`<small class="need on">${svg('flag')}${n}</small>`:`<small class="need${n>c.free?' no':''}">${svg('flag')}Cần ${n} / còn ${c.free}</small>`;};
      const list=cmdLine+(p.mercs.map((M,i)=>{const n=Player.mercCost(M),can=M.on||(n<=c.free&&M.hpFrac>0);const dl=Player.mercDaily(M);const tcol=(Player.RAR[M.tier]||Player.RAR.n).color;return `<div class="mrow${M.on?' act':''}${mercSel===i?' sel':''}"><span class="mg" style="color:${tcol}">${M.gender==='f'?'Nữ':'Nam'}</span><div><b style="color:${M.tier&&M.tier!=='n'?tcol:''}">${esc(M.name)}${M.lv?` <small class="qtag" style="color:#9fe8a8">Lv. ${M.lv}</small>`:''}${M.tier&&M.tier!=='n'?` <small class="qtag" style="color:${tcol}">${Player.TIER_NAME[M.tier]} ×${Player.tierMul(M)}</small>`:''}</b>${dl?`<small class="qtag" style="color:${EL[dl.el].color}">${svg(EL[dl.el].icon)}Hôm nay: ${esc(dl.skill)}</small>`:''}${stat(M)}${need(M)}<span class="gear">${gearIcons(M.equipment)}</span></div><span class="mbtns"><button data-follow="${i}"${can?'':' disabled'}>${M.on?'Cho nghỉ':'Đi theo'}</button><button data-gear="${i}">Đồ</button><button data-dismiss="${i}">Giải tán</button></span></div>`;}).join('')||'<small class="sel-desc">Chưa có lính. Qua mục Thuê lính để thuê.</small>');
      const pets=p.pets&&p.pets.length?`<h4 class="sec">Quái thu phục (${p.pets.length}${Player.petMax(p)?'/'+Player.petMax(p):' · chưa gắn sách Ma công'})</h4>`+p.pets.map(x=>{const M=Player.MON[x.type];return `<div class="mrow"><span class="mg pet">${LH_IMG.icon('quai:'+x.type,monIc(x.type,'demon'))}</span><div><b>${esc(M.name)}</b><small class="sel-desc">${M.boss?'Trùm · ':''}Máu ${Math.round((M.hpBase||M.hp)*x.hpFrac)} / ${M.hpBase||M.hp} · ${x.exp?'còn '+petLeft(x.exp):'ở lại mãi mãi'} · chết là mất hẳn</small></div><span class="mbtns"><button data-petoff="${x.pid}">Thả đi</button></span></div>`;}).join(''):'';
      let gear='';
      if(m){previewWho={equipment:m.equipment,gender:m.gender,stats:m.stats};const P2={equipment:m.equipment,gender:m.gender,isMerc:true};
        gear=`<div class="mgear"><div class="equip-head"><canvas id="preview"></canvas><div><b>${esc(m.name)}</b><small class="sel-desc">Chạm ô trang bị của lính để lấy về túi. Chạm đồ trong túi để mặc cho lính.</small></div></div><div class="equip-grid">${Player.slots.map(k=>slotHtml(m,k)).join('')}</div><div class="bag-grid" style="margin-top:8px">${bagHtml(it=>Player.targets(P2,it).length>0)}</div></div>`;}
      else previewWho=null;
      body=`<div class="mlist">${list}${pets}</div>${gear}`;
    }
    openModal(tabs,body,true);
    document.querySelectorAll('[data-mt]').forEach(b=>b.onclick=()=>{mercSel=null;showMercBoard(b.dataset.mt);});
    luckHook();{const i=$('#luckN');if(i){const f=i.onchange;i.onchange=()=>{f&&f();showMercBoard('hire');};}}
    const rcf=document.querySelector('[data-recruit-free]');if(rcf)rcf.onclick=()=>run(rcf,game.op({t:'recruit',map:World.id,free:1,luck:Math.min(luckUse,luckMax())}).then(r=>{const o=r.offer;luckUse=0;game.message(svg('flag')+'Chiêu mộ miễn phí · '+esc(Player.TIER_NAME[o.tier])+' · '+esc(o.name));game.save();showMercBoard('hire');}));
    const rcb=document.querySelector('[data-recruit]');if(rcb)rcb.onclick=()=>run(rcb,game.op({t:'recruit',map:World.id,luck:Math.min(luckUse,luckMax())}).then(r=>{luckUse=0;return r;}).then(r=>{const o=r.offer;game.message(svg('flag')+esc(Player.TIER_NAME[o.tier])+' · '+esc(o.name));game.save();showMercBoard('hire');}));
    const rch=document.querySelector('[data-rchire]');if(rch)rch.onclick=()=>run(rch,game.op({t:'recruitHire'}).then(r=>{game.syncMerc();game.message(svg('check')+'Đã nhận '+esc(r.name)+' · Lv. '+r.lv);game.save();showMercBoard('mine');}));
    const rcd=document.querySelector('[data-rcdrop]');if(rcd)rcd.onclick=()=>run(rcd,game.op({t:'recruitDrop'}).then(()=>showMercBoard('hire')));
    document.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>{const [id,k,day]=b.dataset.hire.split(':');run(b,game.op({t:'hire',id,...(k!=null?{k:Number(k),day:Number(day)}:{})}).then(r=>{game.syncMerc();game.message(svg('check')+'Đã thuê '+esc(r.name)+(r.lv?' · Lv. '+r.lv:''));game.save();showMercBoard('mine');}));});
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
  const MK={tab:'buy',list:null,mercs:null,chars:null,claim:0,claimRuby:0,filter:'all',sel:null,pick:null,busy:false,at:0,fetching:null};
  const MK_FRESH=60000; // danh sách hàng dùng lại trong 60 giây (mở bảng là thấy ngay), vẫn làm mới ngầm
  const mkSet=r=>{MK.list=r.open;MK.claim=r.claim;MK.claimRuby=r.claimRuby||0;MK.at=Date.now();};
  // hỏi thương nhân trước (lúc chạm vào NPC / vào làng) để khi tới nơi bảng hiện ngay
  function prefetchMarket(force){if(!Net.token)return;if(!force&&MK.list&&Date.now()-MK.at<MK_FRESH)return;if(MK.fetching)return MK.fetching;MK.fetching=Net.call('marketList').then(r=>{mkSet(r);if(!$('#overlay').hidden&&$('#modalCard').dataset.mk&&(MK.tab==='buy'||MK.tab==='money')&&!MK.busy)showMarket(null,true);},()=>{}).finally(()=>{MK.fetching=null;});return MK.fetching;}
  const price2=(c,r)=>(c||!r?coins(c):'')+(r?ruby(r):'');
  function mkTile(attr,it,priceHtml,go,goTxt,off,sel,foot){
    return `<button class="tile${off?' off':''}${sel?' sel':''}" ${attr} title="${esc(desc(it))}" style="${Player.qOf(it)!=='n'?`border-color:${qColor(it)}`:''}"><span class="ti" style="color:${tintOf(it)||'#e4cc8d'}">${icon(it.type)}</span>${lvb(it)}<b class="nm" style="color:${qColor(it)}">${esc(Player.nameOf(it))}</b>${chips(it)}${priceHtml?`<span class="price">${priceHtml}</span>`:''}${foot||''}<span class="go">${svg(go)}${goTxt}</span></button>`;
  }
  // Gọi máy chủ: khóa cả bảng trong lúc chờ (bấm nhanh không dồn lệnh)
  async function mkRun(fn,btn){
    if(MK.busy)return;MK.busy=true;const card=$('#modalCard');card.classList.add('mk-wait');card.querySelectorAll('button:not(#closeOverlay),input').forEach(x=>x.disabled=true);
    if(btn){btn.classList.add('busy');btn.innerHTML=svg('next')+'Đang gửi…';btn.disabled=true;}
    try{await fn();}catch(e){fail(e);}finally{MK.busy=false;card.classList.remove('mk-wait');if(!$('#overlay').hidden&&$('#modalCard').dataset.mk)showMarket(MK.tab,true);}
  }
  async function mkLoad(force){
    if(MK.tab==='buy'&&(force||!MK.list)){const r=await Net.call('marketList');mkSet(r);}
    if(MK.tab==='money'&&force){const r=await Net.call('marketList');mkSet(r);}
  }
  function showMarket(tab,quiet){
    if(tab)MK.tab=tab;if(!quiet){MK.sel=null;MK.pick=null;}
    if(MK.tab==='merc')MK.tab='buy';
    const need=(MK.tab==='buy'&&!MK.list)||(MK.tab==='money'&&MK.list==null);
    const fee=Player.CFG.phi_cho||0,tabs=[['buy','coin','Hàng'],['sell','bag','Ký gửi'],['money','check','Tiền bán'+(MK.claim||MK.claimRuby?' <i class="mk-dot"></i>':'')]];
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
      const tr=['l','m'].map(k=>Player.RAR[k]).filter(Boolean).map(r=>`<b style="color:${r.color}">${r.name}</b>`).join(', ');
      body=`<p class="mk-hint">Chợ chỉ nhận đồ ${tr}, <b>cánh</b> và <b>thú cưỡi</b> trong túi. Bán được, thương nhân giữ ${fee}%, tiền về mục Tiền bán.</p>`+
        (own.length?`<div class="shop-grid">${own.map(({it})=>mkTile(`data-mpick="${it.uid}"`,it,'','check','Chọn',false,MK.pick===it.uid)).join('')}</div>`:`<div class="shop-empty">${svg('bag')}<span>Túi không có đồ ký gửi được</span></div>`)+
        (sel?`<div class="mk-bar"><b style="color:${qColor(sel)}">${esc(Player.nameOf(sel))}</b><label>Vàng<input id="mkG" type="number" min="0" value="1" inputmode="numeric"></label><label>Bạc<input id="mkS" type="number" min="0" max="99" value="0" inputmode="numeric"></label><label>Hồng ngọc<input id="mkR" type="number" min="0" value="0" inputmode="numeric"></label><button class="primary" id="mkSell">${svg('coin')}Ký gửi</button></div>`:'');
    }
    else body=`<div class="mk-claim">${svg('coin')}<div><span>Tiền bán hàng đang chờ</span><b>${price2(MK.claim,MK.claimRuby)}</b></div>${MK.claim||MK.claimRuby?`<button class="primary" id="mkClaim">Nhận</button>`:''}</div><p class="mk-hint">Gồm tiền bán đồ ký gửi và tiền cho thuê nhân vật, đã trừ phí thương nhân.</p>`;
    openModal(`<div class="shop-tabs">${tabs.map(([k,ic,t])=>`<button data-mtab="${k}" class="${MK.tab===k?'on':''}">${svg(ic)}<span>${t}</span></button>`).join('')}</div><div class="purse">${coins(p.copper)}${ruby(p.rubies)}</div>`,`<div class="shop-sub">${svg('coin')}Thương nhân · mua bán với người chơi${MK.tab==='buy'?' · chạm 2 lần để mua':''}</div>${body}`,true);
    $('#modalCard').dataset.mk='1';
    if(need){mkRun(()=>mkLoad(false));return;}
    const Q=s=>document.querySelectorAll(s);
    Q('[data-mtab]').forEach(b=>b.onclick=()=>showMarket(b.dataset.mtab));
    Q('[data-mf]').forEach(b=>b.onclick=()=>{MK.filter=b.dataset.mf;showMarket(null,true);});
    Q('[data-mreload]').forEach(b=>b.onclick=()=>mkRun(()=>mkLoad(true)));
    Q('[data-mbuy]').forEach(b=>b.onclick=()=>{const id=b.dataset.mbuy;if(MK.sel!==id){MK.sel=id;showMarket(null,true);return;}
      mkRun(async()=>{try{const r=await game.server('marketBuy',{id});MK.list=MK.list.filter(x=>x.id!==id);MK.sel=null;game.message(svg('check')+`Đã mua <b style="color:${qColor(r.item)}">${esc(Player.nameOf(r.item))}</b>`);}catch(e){if(e.message==='DA_BAN'){MK.list=MK.list.filter(x=>x.id!==id);MK.sel=null;}throw e;}},b);});
    Q('[data-mcancel]').forEach(b=>b.onclick=()=>{const id=b.dataset.mcancel;if(MK.sel!==id){MK.sel=id;showMarket(null,true);return;}
      mkRun(async()=>{await game.server('marketCancel',{id});MK.list=MK.list.filter(x=>x.id!==id);MK.sel=null;game.message(svg('check')+'Đã lấy lại món đồ');},b);});
    Q('[data-mpick]').forEach(b=>b.onclick=()=>{MK.pick=MK.pick===b.dataset.mpick?null:b.dataset.mpick;showMarket(null,true);});
    const sg=$('#mkSell');if(sg)sg.onclick=()=>{const v=id=>Math.max(0,Math.floor(+$(id).value||0)),pr=v('#mkG')*10000+Math.min(99,v('#mkS'))*100,rb=v('#mkR');
      if(pr<1&&rb<1){game.message(svg('close')+'Nhập giá bán');return;}const uid=MK.pick,it=p.bag.find(x=>x&&x.uid===uid);
      mkRun(async()=>{const r=await game.server('marketSell',{uid,price:pr,ruby:rb});if(MK.list&&it)MK.list.unshift({id:r.id,item:it,price:pr,ruby:rb,mine:true,seller:p.name});MK.pick=null;game.message(svg('check')+'Đã bày hàng');},sg);};
    const cg=$('#mkClaim');if(cg)cg.onclick=()=>mkRun(async()=>{const r=await game.server('claim',{});MK.claim=0;MK.claimRuby=0;game.message(svg('coin')+'Đã nhận '+price2(r.amount,r.ruby));},cg);
    if(MK.tab==='money'&&MK.list!=null&&!quiet)mkRun(()=>mkLoad(true));
  }
  /* ---------- v10.21 · Người giữ rương: rương chung của tài khoản (mọi nhân vật gửi / lấy đồ, tiền, hồng ngọc) ----------
     Lệnh chạy trên máy chủ (game.server lưu phần chơi trước); rương giữ ở bảng tai_khoan. */
  const CH={chest:null,tab:'chest',sel:null,busy:false};
  async function chRun(fn,btn){
    if(CH.busy)return;CH.busy=true;const card=$('#modalCard');card.classList.add('mk-wait');card.querySelectorAll('button:not(#closeOverlay),input').forEach(x=>x.disabled=true);
    if(btn){btn.classList.add('busy');btn.innerHTML=svg('next')+'Đang gửi…';}
    try{await fn();}catch(e){fail(e);}finally{CH.busy=false;card.classList.remove('mk-wait');if(!$('#overlay').hidden&&$('#modalCard').dataset.ch)showChest(null,true);}
  }
  function showChest(tab,quiet){
    if(tab)CH.tab=tab;if(!quiet)CH.sel=null;const C2=CH.chest;
    const tabs=[['chest','bag','Rương chung'],['bag','next','Gửi đồ'],['money','coin','Tiền']];
    let body='';
    if(!C2)body=`<div class="shop-empty">${svg('bag')}<span>Đang mở rương…</span></div>`;
    else if(CH.tab==='chest'){const full=p.bag.indexOf(null)<0;
      body=`<p class="mk-hint">Rương dùng chung cho mọi nhân vật của tài khoản: ${C2.items.length}/${C2.size} ô · ${coins(C2.copper)}${ruby(C2.rubies)}. Chạm 2 lần để lấy về túi.</p>`+
        (C2.items.length?`<div class="shop-grid">${C2.items.map(it=>mkTile(`data-chtake="${it.uid}"`,it,'','out','Lấy ra',full,CH.sel===it.uid)).join('')}</div>`:`<div class="shop-empty">${svg('bag')}<span>Rương trống</span></div>`);}
    else if(CH.tab==='bag'){const own=p.bag.filter(it=>it&&info(it)&&info(it).slot!=='quest'),full=C2.items.length>=C2.size;
      body=`<p class="mk-hint">Chọn đồ trong túi để cất vào rương (${C2.items.length}/${C2.size} ô). Nhân vật khác của tài khoản lấy ra được ở bất kỳ Người giữ rương nào.</p>`+
        (own.length?`<div class="shop-grid">${own.map(it=>mkTile(`data-chput="${it.uid}"`,it,'','bag','Cất vào',full,CH.sel===it.uid)).join('')}</div>`:`<div class="shop-empty">${svg('bag')}<span>Túi trống</span></div>`);}
    else body=`<div class="mk-claim">${svg('coin')}<div><span>Trong rương</span><b>${coins(C2.copper)}${ruby(C2.rubies)}</b></div></div><div class="mk-claim">${svg('bag')}<div><span>Nhân vật đang có</span><b>${coins(p.copper)}${ruby(p.rubies)}</b></div></div>
      <div class="mk-bar"><label>Vàng<input id="chG" type="number" min="0" value="0" inputmode="numeric"></label><label>Bạc<input id="chS" type="number" min="0" max="99" value="0" inputmode="numeric"></label><label>Đồng<input id="chC" type="number" min="0" max="99" value="0" inputmode="numeric"></label><label>Hồng ngọc<input id="chR" type="number" min="0" value="0" inputmode="numeric"></label>
      <button class="primary" id="chPut">${svg('bag')}Gửi vào</button><button id="chTake">${svg('out')}Lấy ra</button></div><p class="mk-hint">Nhập số rồi bấm Gửi vào (từ nhân vật sang rương) hoặc Lấy ra (từ rương về nhân vật).</p>`;
    openModal(`<div class="shop-tabs">${tabs.map(([k,ic,t])=>`<button data-chtab="${k}" class="${CH.tab===k?'on':''}">${svg(ic)}<span>${t}</span></button>`).join('')}</div><div class="purse">${coins(p.copper)}${ruby(p.rubies)}</div>`,`<div class="shop-sub">${svg('bag')}Người giữ rương · rương chung của tài khoản</div>${body}`,true);
    $('#modalCard').dataset.ch='1';
    if(!C2){if(!CH.busy)chRun(async()=>{const r=await game.server('chest',{});CH.chest=r.chest;});return;}
    const Q=x=>document.querySelectorAll(x),done=r=>{CH.chest=r.chest;CH.sel=null;};
    Q('[data-chtab]').forEach(b=>b.onclick=()=>showChest(b.dataset.chtab));
    Q('[data-chtake]').forEach(b=>b.onclick=()=>{const uid=b.dataset.chtake;if(CH.sel!==uid){CH.sel=uid;showChest(null,true);return;}chRun(async()=>{const r=await game.server('chestTake',{uid});done(r);game.message(svg('check')+'Đã lấy <b style="color:'+qColor(r.item)+'">'+esc(Player.nameOf(r.item))+'</b> về túi');},b);});
    Q('[data-chput]').forEach(b=>b.onclick=()=>{const uid=b.dataset.chput;if(CH.sel!==uid){CH.sel=uid;showChest(null,true);return;}chRun(async()=>{const r=await game.server('chestPut',{uid});done(r);game.message(svg('check')+'Đã cất <b style="color:'+qColor(r.item)+'">'+esc(Player.nameOf(r.item))+'</b> vào rương');},b);});
    const amt=()=>{const v=id=>Math.max(0,Math.floor(+$(id).value||0));return {copper:v('#chG')*10000+Math.min(99,v('#chS'))*100+Math.min(99,v('#chC')),rubies:v('#chR')};};
    for(const [id,act,txt] of [['#chPut','chestPut','Đã gửi vào rương '],['#chTake','chestTake','Đã lấy ra ']]){const b=$(id);if(b)b.onclick=()=>{const m=amt();if(!m.copper&&!m.rubies){game.message(svg('close')+'Nhập số tiền hoặc hồng ngọc');return;}chRun(async()=>{const r=await game.server(act,m);done(r);game.message(svg('coin')+txt+price2(m.copper,m.rubies));},b);};}
  }
  function showQuests(){
    const s=game.seen,k=p.flags.kills,row=(id,label,html)=>`<div class="qrow">${svg(id)}<div><b>${label}</b><span class="chips">${html}</span></div></div>`;
    const V=villagers(),metN=V.filter(n=>s.includes(n.id)).length,met=V.map(n=>chip(s.includes(n.id)?'check':'user',esc(n.name),s.includes(n.id)?'#9fe8a8':'')).join('');
    const names={deer:'Hươu',lion:'Sư tử',elephant:'Voi',croc:'Cá sấu'};
    const hunt=Object.keys(names).map(t=>chip(t,names[t]+' '+(k[t]||0),k[t]?'#9fe8a8':'')).join('');
    const act=Object.entries(p.quests.active).map(([id,n])=>{const Q=Player.QUESTS[id];return row('quest',esc(Q.name)+` (${Math.min(n,Q.count)}/${Q.count})`,rewardChips(Q));}).join('');
    const first=(metN<V.length?row('talk',`Gặp dân làng (${metN}/${V.length})`,met):'')+(p.flags.river?'':row('bridge','Qua cầu sang Đông Ngạn',chip('next','Chưa qua')))+(p.flags.hunted?'':row('bow','Săn mỗi loài một con · thưởng 1 bạc',hunt));
    openModal(ttl('quest','Nhiệm vụ'),`<div class="quest-rows">${storyHint()}${act}${first||(act?'':`<div class="qdone">${svg('check')}<span>Đã xong việc làng. Gặp Lý trưởng nhận việc mới.</span></div>`)}</div>`);
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
  /* ---------- Bộ sưu tập Phấn Son: đổi qua lại thẻ avatar, khung, nền, hiệu ứng tên đã có (op cos) ---------- */
  const COS_T={avatar:['Ảnh chân dung','user'],nen:['Nền hồ sơ','map'],ten:['Hiệu ứng tên','orb']};
  function showCosmetics(){
    const C=p.cos||{use:{},own:{}};
    const sec=Object.entries(COS_T).map(([k,[tt,ic]])=>{const own=C.own[k]||[],use=C.use[k]||'';
      const tiles=[`<button class="tile cos${!use?' sel':''}" data-cos="${k}:"><span class="ti">${svg('close')}</span><b class="nm">Không dùng</b></button>`,...own.map(id=>{const d=k==='ten'?{name:Player.NAME_FX[id]||id}:info({type:id})||{name:id};return `<button class="tile cos${use===id?' sel':''}" data-cos="${k}:${id}">${d.img?`<img src="${esc(d.img)}" alt="" referrerpolicy="no-referrer">`:`<span class="ti">${svg(ic)}</span>`}<b class="nm${k==='ten'?' fx-'+id:''}">${esc(d.name)}</b>${use===id?`<span class="price">${svg('check')}Đang dùng</span>`:''}</button>`;})].join('');
      return `<h4 class="mk-h">${svg(ic)}${tt}${own.length?'':' <small>— chưa có, mua ở Cô hàng Phấn Son (làng Thanh Mộc): mua xong dùng ngay</small>'}</h4><div class="shop-grid cos-grid">${tiles}</div>`;}).join('');
    openModal(ttl('orb','Phấn Son · bộ sưu tập')+`<div class="purse">${ruby(p.rubies)}</div>`,`<small class="sel-desc">Đồ đã mua giữ mãi trong bộ sưu tập; chạm để đổi. Ảnh chân dung thay cho diện mạo ở khung trên và lều nhân vật.</small>${sec}`,true);
    document.querySelectorAll('[data-cos]').forEach(b=>b.onclick=()=>{const [kind,id]=b.dataset.cos.split(':');run(b,game.op({t:'cos',kind,id}).then(()=>{refresh();showCosmetics();}));});
  }
  /* ---------- Thầy đồ: hỏi bài thư pháp (máy chủ chấm). Sai quá → săn quái lấy manh mối → thầy chỉ đáp án → trả lời lại nhận thưởng giảm ---------- */
  let quizSt={bo:null,ans:{}};
  function showQuiz(){
    const sets=Object.values(Player.QUIZ).filter(Q=>Q.qs.length).sort((a,b)=>a.order-b.order),Z=p.quiz||{},maxWrong=Number(Player.CFG.quiz_sai_toi_da)||1,tries=Number(Player.CFG.quiz_lan_thu)||2,lo=Number(Player.CFG.quiz_thuong_lo)||50;
    const st=id=>Z[id]||{done:0,fail:0,hunt:null,reveal:false};
    let firstOpen=null;sets.forEach((Q,i)=>{if(firstOpen==null&&!st(Q.id).done)firstOpen=i;});
    if(quizSt.bo==null){
      const rows=sets.map((Q,i)=>{const z=st(Q.id),locked=i>(firstOpen==null?sets.length:firstOpen),M=Player.MON[Q.mon];
        const tag=z.done?`<span class="qprog">${svg('check')}Đã xong</span>`:locked?`<span class="qprog">${svg('lock')}Bài trước</span>`:z.reveal?`<button class="primary" data-quiz="${Q.id}">${svg('eye')}Xem đáp án</button>`:z.hunt?`<span class="qprog">${svg('quest')}Manh mối ${z.hunt.got}/${z.hunt.need}</span>`:`<button data-quiz="${Q.id}">${svg('next')}Trả lời</button>`;
        return `<div class="qrow${z.done?' dim':''}">${svg('book')}<div><b>${esc(Q.name)}</b><small>${Q.qs.length} câu${z.hunt&&!z.done?` · săn ${M?esc(M.name):Q.mon} ${z.hunt.got}/${z.hunt.need}${Q.map?' ở '+esc((Player.REGIONS.find(r=>r.id===Q.map)||{}).name||Q.map):''}`:''}${z.fail&&!z.done?` · sai ${z.fail} lần`:''}</small><span class="chips">${chip('orb','+'+Q.rubies+' hồng ngọc','#ff7aa0')}</span></div>${tag}</div>`;}).join('');
      openModal(ttl('book','Thầy đồ hỏi bài')+`<div class="purse">${ruby(p.rubies)}</div>`,`<small class="sel-desc">Sách "Thư pháp Việt". Mỗi bài ${sets[0]?sets[0].qs.length:5} câu, sai tối đa ${maxWrong} câu vẫn được thưởng. Sai quá ${tries} lần hoặc chọn "chưa biết" thì đi săn quái lấy manh mối, thầy sẽ chỉ đáp án (thưởng còn ${lo}%).</small><div class="quest-rows" style="margin-top:8px">${rows||'<div class="cho-note">Chưa có câu hỏi</div>'}</div>`,true);
      document.querySelectorAll('[data-quiz]').forEach(b=>b.onclick=()=>{quizSt={bo:b.dataset.quiz,ans:{}};showQuiz();});
      return;
    }
    const Q=Player.QUIZ[quizSt.bo],z=st(Q.id),wrongSet=new Set(quizSt.wrong||[]);
    if(z.reveal&&!quizSt.show){Net.call('quizShow',{charId:session.charId,bo:Q.id}).then(r=>{quizSt.show=r.show;r.show.forEach((K,i)=>{quizSt.ans[i]=K;});showQuiz();},()=>{});}
    const qs=Q.qs.map((q,i)=>`<div class="quiz-q${wrongSet.has(i)?' wrong':''}"><b>${i+1}. ${esc(q.q)}</b><div class="quiz-opts">${['a','b','c','d'].map(k=>{const K=k.toUpperCase(),on=quizSt.ans[i]===K,isAns=z.reveal&&quizSt.show&&quizSt.show[i]===K;return `<button data-qa="${i}:${K}" class="${on?'on':''}${isAns?' ans':''}"><i>${K}</i>${esc(q[k])}</button>`;}).join('')}</div></div>`).join('');
    const n=Q.qs.length,picked=Object.keys(quizSt.ans).length;
    openModal(ttl('book',Q.name)+`<div class="purse">${ruby(p.rubies)}</div>`,`<div class="quiz-wrap">${z.reveal?`<small class="sel-desc">${svg('eye')}Thầy đồ đã chỉ đáp án (viền sáng). Chọn đúng để nhận ${lo}% thưởng.</small>`:`<small class="sel-desc">Chọn đáp án cho ${n} câu rồi nộp bài. Sai tối đa ${maxWrong} câu.</small>`}${qs}
      <div class="quiz-bar"><button id="quizBack">${svg('close')}Quay lại</button>${z.reveal||z.hunt?'':`<button id="quizHunt">${svg('quest')}Chưa biết, xin việc săn</button>`}<button id="quizGo" class="primary"${picked<n?' disabled':''}>${svg('check')}Nộp bài (${picked}/${n})</button></div></div>`,true);
    document.querySelectorAll('[data-qa]').forEach(b=>b.onclick=()=>{const [i,K]=b.dataset.qa.split(':');quizSt.ans[i]=K;showQuiz();});
    $('#quizBack').onclick=()=>{quizSt={bo:null,ans:{}};showQuiz();};
    const h=$('#quizHunt');if(h)h.onclick=()=>run(h,game.op({t:'quizHunt',bo:Q.id}).then(r=>{const M=Player.MON[r.hunt.mon];game.message(svg('quest')+`Thầy đồ: săn ${r.hunt.need} ${M?M.name:r.hunt.mon} mang manh mối về`);quizSt={bo:null,ans:{}};showQuiz();}));
    // v10.13: máy chủ chỉ chấm (quizCheck, không khóa / không ghi) rồi trả câu sai kèm chữ ký; kết quả áp dụng ngay tại máy, gửi theo gói lưu sau
    $('#quizGo').onclick=()=>{const go=$('#quizGo');go.innerHTML=svg('next')+'Đang chấm…';run(go,Net.call('quizCheck',{charId:session.charId,bo:Q.id,ans:Q.qs.map((q,i)=>quizSt.ans[i]||'')}).then(c=>game.op({t:'quiz',bo:Q.id,wrong:c.wrong,sig:c.sig})).then(r=>{
      if(r.pass){LH_Audio.play('levelup');game.message(svg('check')+`Đúng ${r.ok}/${r.total} · +${r.rubies} hồng ngọc · +${r.exp} kinh nghiệm`);if(r.up)game.levelUp(r.up);game.refreshHD();quizSt={bo:null,ans:{}};showQuiz();return;}
      LH_Audio.play('enhanceFail');quizSt.wrong=r.wrong;
      if(r.hunt){const M=Player.MON[r.hunt.mon];game.message(svg('quest')+`Sai ${r.wrong.length} câu. Thầy đồ: đi săn ${r.hunt.need} ${M?M.name:r.hunt.mon} lấy manh mối, ta sẽ chỉ đáp án`);quizSt={bo:null,ans:{}};}
      else game.message(svg('close')+`Sai ${r.wrong.length} câu (câu ${r.wrong.map(i=>i+1).join(', ')}). Thử lại, còn ${Math.max(0,tries-r.fail)} lần`);
      showQuiz();}));};
  }
  /* ---------- Luyện khí sư (thành trì): dung hợp thú cưỡi +9 với một món huyền thoại / thần + hồng ngọc → cánh (tỉ lệ dung_hop_ti_le) ---------- */
  let fuseSel={m:null,x:null};
  function showFuse(){
    const need=Number(Player.CFG.dung_hop_thu_cap)||9,cost=Number(Player.CFG.dung_hop_ngoc)||60,rate=Number(Player.CFG.dung_hop_ti_le)||40;
    const mounts=p.bag.map((it,i)=>({it,i})).filter(r=>r.it&&info(r.it).slot==='mount'),mats=p.bag.map((it,i)=>({it,i})).filter(r=>r.it&&(info(r.it).set||info(r.it).myth));
    if(fuseSel.m!=null&&!mounts.some(r=>r.i===fuseSel.m))fuseSel.m=null;if(fuseSel.x!=null&&!mats.some(r=>r.i===fuseSel.x))fuseSel.x=null;
    const mini=(r,key,ok)=>`<button class="mini${fuseSel[key]===r.i?' sel':''}${ok?'':' off'}" data-fz="${key}:${r.i}" title="${esc(Player.nameOf(r.it))}" style="${Player.qOf(r.it)!=='n'?`border-color:${qColor(r.it)}`:''}"><span style="color:${tintOf(r.it)||'#e4cc8d'}">${icon(r.it.type)}</span>${lvb(r.it)}</button>`;
    const M=fuseSel.m!=null?p.bag[fuseSel.m]:null,X=fuseSel.x!=null?p.bag[fuseSel.x]:null,okM=M&&(M.lv||0)>=need,can=okM&&X&&p.rubies>=cost;
    const wings=Object.values(Player.items).filter(d=>d.wing).map(d=>d.name).join(' · ');
    // v10.13: trưng bày các đôi cánh có thể ra lò (ảnh từ tab hinh_anh vat_pham:canh-*, không có ảnh thì biểu tượng)
    const gallery=Object.entries(Player.items).filter(([,d])=>d.wing).map(([id,d])=>`<div class="wing-card"><span class="ti" style="color:${d.tint||'#e4cc8d'}">${icon(id)}</span><b>${esc(d.name)}</b><small>Thủ +${d.def||0} · 0–5 dòng ngẫu nhiên</small></div>`).join('');
    openModal(ttl('wings','Luyện khí sư')+`<div class="purse">${coins(p.copper)}${ruby(p.rubies)}</div>`,
      `<small class="sel-desc">Dung hợp <b>thú cưỡi +${need}</b> với một món <b>huyền thoại / thần</b> và ${cost} hồng ngọc → một đôi cánh ngẫu nhiên (${esc(wings)}). Tỉ lệ ${rate}%. Thất bại: mất món huyền thoại / thần và hồng ngọc, thú cưỡi về +6. Cánh có 0–5 dòng chỉ số ngẫu nhiên, càng nhiều dòng càng hiếm.</small>
      <div class="wing-gallery">${gallery}</div>
      <h4 class="mk-h">Thú cưỡi (+${need} trở lên)</h4>${mounts.length?`<div class="enh-list">${mounts.map(r=>mini(r,'m',(r.it.lv||0)>=need)).join('')}</div>`:`<div class="shop-empty">${svg('mount')}<span>Túi không có thú cưỡi</span></div>`}
      <h4 class="mk-h">Món huyền thoại / thần</h4>${mats.length?`<div class="enh-list">${mats.map(r=>mini(r,'x',true)).join('')}</div>`:`<div class="shop-empty">${svg('bag')}<span>Túi không có đồ huyền thoại / thần</span></div>`}
      ${luckBar()}<div class="enh-rows"><div><small>Thú</small><b>${M?esc(Player.nameOf(M)):'—'}</b></div><div><small>Vật liệu</small><b>${X?esc(Player.nameOf(X)):'—'}</b></div><div><small>Phí</small><b>${ruby(cost)}</b></div><div><small>Tỉ lệ</small><b>${rate}%${Math.min(luckUse,luckMax())?' +'+Math.min(luckUse,luckMax())+'%':''}</b></div></div>
      <button id="fuseGo" class="primary big-btn"${can?'':' disabled'}>${svg('wings')}Dung hợp</button>`,true);
    document.querySelectorAll('[data-fz]').forEach(b=>b.onclick=()=>{const [k,i]=b.dataset.fz.split(':');fuseSel[k]=fuseSel[k]===Number(i)?null:Number(i);showFuse();});luckHook();
    const go=$('#fuseGo');if(go)go.onclick=()=>{const t0=Date.now();go.innerHTML=svg('wings')+'Đang luyện…';game.hammer('#c8a0ff');run(go,game.op({t:'fuse',m:fuseSel.m,x:fuseSel.x,luck:Math.min(luckUse,luckMax())}).then(r=>new Promise(ok=>setTimeout(()=>ok(r),Math.max(0,900-(Date.now()-t0))))).then(r=>{game.enhanceFx(r.ok);if(r.ok)LH_Audio.play('fuse');game.message(r.ok?svg('check')+`Dung hợp thành công! <b style="color:${qColor(r.item)}">${esc(Player.nameOf(r.item))}</b> (${r.lines} dòng)`:svg('close')+'Dung hợp thất bại… thú cưỡi về +'+(r.mount.lv||0));fuseSel={m:null,x:null};game.refreshHD();showFuse();}),()=>showFuse());};
  }
  /* ---------- Nạp thẻ (thành trì): chọn gói → mã QR chuyển khoản VietQR về tài khoản cấu hình; hồng ngọc cộng tay sau khi nhận tiền ---------- */
  let napSel=null;
  function showTopup(){
    const C=Player.CFG,list=Player.TOPUPS,G=list.find(g=>g.id===napSel)||null,user=window.LH_USER||'';
    const fmt=v=>Number(v).toLocaleString('vi-VN');
    const tiles=list.map(g=>`<button class="tile${napSel===g.id?' sel':''}" data-nap="${g.id}"><span class="ti" style="color:#ff6fb5">${svg('orb')}</span><b class="nm">${esc(g.name)}</b><span class="chips">${g.ruby?`<span class="chip">${ruby(g.ruby)}</span>`:''}${g.gold?`<span class="chip">${coins(g.gold*10000)}</span>`:''}</span>${g.desc?`<small>${esc(g.desc)}</small>`:''}<span class="price">${fmt(g.vnd)} đ</span></button>`).join('');
    let qr='';
    if(G){const info=String(C.nap_noi_dung||'Ikyna {goi} {tai_khoan}').replace('{goi}',G.name.replace(/^Gói\s*/i,'Goi ')).replace('{tai_khoan}',user).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').trim();
      const url=`https://img.vietqr.io/image/${encodeURIComponent(C.nap_ngan_hang||'MB')}-${encodeURIComponent(C.nap_so_tai_khoan||'')}-compact2.png?amount=${G.vnd}&addInfo=${encodeURIComponent(info)}&accountName=${encodeURIComponent(C.nap_ten_tai_khoan||'')}`;
      qr=`<div class="nap-qr"><img src="${url}" alt="Mã QR chuyển khoản" referrerpolicy="no-referrer"><div class="nap-info"><div><small>Ngân hàng</small><b>${esc(C.nap_ngan_hang||'MB')}</b></div><div><small>Số tài khoản</small><b>${esc(C.nap_so_tai_khoan||'')}</b></div><div><small>Chủ tài khoản</small><b>${esc(C.nap_ten_tai_khoan||'')}</b></div><div><small>Số tiền</small><b>${fmt(G.vnd)} đ</b></div><div><small>Nội dung</small><b>${esc(info)}</b></div><small class="sel-desc">Quét mã bằng ứng dụng ngân hàng, giữ nguyên nội dung chuyển khoản. ${G.gold&&!G.ruby?'Vàng':G.gold?'Hồng ngọc và vàng':'Hồng ngọc'} được cộng vào tài khoản sau khi nhận tiền.</small></div></div>`;}
    openModal(ttl('orb','Nạp thẻ')+`<div class="purse">${coins(p.copper)}${ruby(p.rubies)}</div>`,`<div class="shop-grid nap-grid">${tiles}</div>${qr}`,true);
    document.querySelectorAll('[data-nap]').forEach(b=>b.onclick=()=>{napSel=b.dataset.nap;showTopup();});
  }
  function openPanel(n,skipStory){
    npcPanel=true;
    const st=skipStory?null:Player.storyAt(p,n.id);if(st)return showStoryTalk(n,st);
    if(n.panel==='fuse'){fuseSel={m:null,x:null};return showFuse();}
    if(n.panel==='nap'){napSel=null;return showTopup();}
    if(n.panel==='chest'){CH.chest=null;return showChest('chest');}
    if(n.panel==='avatar'){avSel=null;return showAvatars();}
    if(n.panel==='quiz'){quizSt={bo:null,ans:{}};return showQuiz();}
    if(n.panel==='shop')return showShop(n.shop);
    if(n.panel==='quests')return showQuestBoard();
    if(n.panel==='mercs')return showMercBoard('hire');
    if(n.panel==='market'){const fresh=MK.list&&Date.now()-MK.at<MK_FRESH;if(!fresh)MK.list=null;showMarket('buy');if(fresh)prefetchMarket(true);return;}
  }
  /* ---------- Chọn bản đồ: đi nhanh tới trạm nghỉ ở cổng từng vùng; thiếu cấp thì khóa ---------- */
  function showMaps(){
    closeMenu();const lv=p.level||1,cur=game.mapId;
    const rows=Player.REGIONS.map(R=>{const need=Player.mapLevel(R.id),lk=Player.mapLock(p,R.id),lock=!!lk,here=cur===R.id;
      const btn=here?`<span class="qprog">${svg('pin')}Đang ở</span>`:lock?`<span class="qprog">${svg('lock')}${need}</span>`:`<button class="primary" data-go="${R.id}">${svg('next')}Đi</button>`;
      return `<div class="qrow map-row${lock?' dim':''}${here?' act':''}"><span class="map-ic">${svg(R.icon)}</span><div><b>${esc(R.name)}</b><small>${lock?esc(lk.msg):need>1?'Từ cấp '+need:'Làng, vùng an toàn'}</small></div>${btn}</div>`;}).join('');
    openModal(ttl('map','Bản đồ'),`<small class="sel-desc">Lv. ${lv} · đi thẳng tới trạm nghỉ ở cổng vùng (tự lưu trước khi đi).</small><div class="quest-rows" style="margin-top:8px">${rows}</div>`);
    document.querySelectorAll('[data-go]').forEach(b=>b.onclick=async()=>{b.disabled=true;closeModal();await game.goto(b.dataset.go);refresh();});
  }
  async function save(){closeMenu();const ok=await game.save();game.message(ok?svg('save')+'Đã lưu':svg('close')+'Không lưu được');}
  $('#avatarBtn').onclick=showAttributes;
  $('#settingsBtn').onclick=()=>{menu.hidden=!menu.hidden;$('#settingsBtn').setAttribute('aria-expanded',String(!menu.hidden));};
  $('#lockBtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();game.toggleLock();});$('#saveBtn').onclick=save;$('#mapBtn').onclick=showMaps;
  // Âm thanh: bật / tắt (lưu trong máy)
  const amBtn=$('#amBtn'),amPaint=()=>{amBtn.classList.toggle('off',!LH_Audio.on);amBtn.querySelector('span').textContent=LH_Audio.on?'Âm thanh: bật':'Âm thanh: tắt';};amPaint();
  amBtn.onclick=()=>{LH_Audio.toggle();amPaint();if(LH_Audio.on){LH_Audio.unlock();LH_Audio.play('open');game.musicScene();}game.message(svg('sound')+(LH_Audio.on?'Âm thanh: bật':'Âm thanh: tắt'));};
  // tiếng bấm cho mọi nút trong game
  document.getElementById('lu-hanh').addEventListener('click',e=>{if(e.target.closest('button'))LH_Audio.play('ui');},true);
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
  window.GameUI={refresh,showAttributes,openPanel,prefetchMarket,showShop:(id,tab)=>{shopSel=null;showShop(id,tab);},showQuestBoard,showMaps,showMercBoard,showMarket,showQuests,save,previewElem,previewWho:()=>previewWho,previewBurst:()=>burstAt,
    showBag:()=>{if($('#overlay').hidden){selected=null;skillFocus=null;renderBag();}else closeModal();},
    frame(time,st){
      if(time-lastFrame<.1)return;lastFrame=time;refresh();$('#settingsBtn').classList.toggle('dirty',game.unsaved());$('#saveBtn').classList.toggle('dirty',game.unsaved());const now=Date.now();
      for(const [id,skill] of Object.entries(Player.skills)){const remaining=Math.max(0,(p.cooldowns[id]||0)-now),span=$('#skill-'+id+' .cooldown');if(!span)continue;span.style.setProperty('--progress',Math.min(100,remaining/skill.cooldown*100)+'%');span.textContent=remaining>0&&id!=='normal'?String(Math.ceil(remaining/1000)):'';}
      const bb=$('#bossBar');if(st&&st.boss){bb.hidden=false;bb.classList.toggle('final',st.boss.final);if(bb.dataset.t!==st.boss.type){bb.dataset.t=st.boss.type;bb.title=st.boss.name;$('#bossIc').innerHTML=LH_IMG.icon('quai:'+st.boss.type,monIc(st.boss.type,'tiger'));}$('#bossFill').style.width=Math.max(0,st.boss.hp/st.boss.max*100)+'%';$('#bossHp').textContent=Math.max(0,Math.ceil(st.boss.hp));}else bb.hidden=true;
    }};
  refresh();
  setTimeout(()=>prefetchMarket(),4000);
};
