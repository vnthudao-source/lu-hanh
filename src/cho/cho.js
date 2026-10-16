/* ================= CHỢ PHIÊN: trang riêng mua bán giữa người chơi =================
   Dùng chung tài khoản và máy chủ với game. Đồ và tiền nằm trên máy chủ nên mua bán ở đây là nhân vật trong game nhận ngay. */
(()=>{
  const $=s=>document.querySelector(s),root=$('#cho-phien'),info=Player.info;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg=id=>`<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const qColor=it=>Player.rar(it).color;
  const tintOf=it=>{const d=info(it);return d?(d.element?Player.ELEMENTS[d.element].color:d.tint||null):null;};
  const icon=(type,color)=>{const d=Player.items[type],id=d?(d.icon||d.kind):type;return `<svg class="icon" aria-hidden="true"${color?` style="color:${color}"`:''}><use href="#i-${id}"/></svg>`;};
  const coins=c=>{const m=Player.money(c),o=[];if(m.gold)o.push(`<span class="coin gold"><i></i>${m.gold}</span>`);if(m.silver)o.push(`<span class="coin silver"><i></i>${m.silver}</span>`);if(m.copper||!o.length)o.push(`<span class="coin"><i></i>${m.copper}</span>`);return `<span class="money">${o.join('')}</span>`;};
  const chip=(id,t,c)=>`<i class="ch"${c?` style="color:${c}"`:''}>${svg(id)}${t}</i>`;
  const chips=it=>{const s=Player.stat(it),o=[];if(s.atk)o.push(chip('sword','Công +'+s.atk));if(s.def)o.push(chip('shield','Thủ +'+s.def));if(s.speed)o.push(chip('speed','Tốc ×'+s.speed));for(const [k,v] of Object.entries(it.add||{})){const A=Player.ADD[k];if(A)o.push(`<i class="ch add">${A.name} +${v}${A.unit}</i>`);}const d=info(it);if(d&&d.fxText)o.push(`<i class="ch fx">${esc(d.fxText)}</i>`);return `<span class="chips">${o.join('')}</span>`;};
  const ERR={MONEY:'Không đủ tiền',BAG_FULL:'Túi đồ đã đầy'};
  const errMsg=e=>ERR[e&&e.message]||netMsg(e);
  const gameUrl=()=>String(window.LH_GAME||'').trim();
  let toastT;
  function toast(html,bad){const t=$('#chToast');t.innerHTML=html;t.className=bad?'bad on':'on';clearTimeout(toastT);toastT=setTimeout(()=>t.className='',3200);}
  const busy=(b,on)=>{if(b){b.disabled=on;b.classList.toggle('busy',on);}};
  // ---------- trạng thái ----------
  const S={acc:null,chars:[],max:5,claim:0,charId:null,state:null,tab:'do',filter:'all',market:null,mercs:null,sel:null};
  const cur=()=>S.chars.find(c=>c.id===S.charId);
  const view=$('#chBody');
  // ---------- đăng nhập ----------
  function login(){
    $('#chUser').innerHTML='';
    view.innerHTML=`<div class="ch-login"><h2>Vào chợ</h2><p class="hint">Dùng tài khoản đã đăng ký trong game.</p>
      <label>Tên đăng nhập hoặc email<input id="lUser" autocomplete="username"></label><label>Mật khẩu<input id="lPass" type="password" autocomplete="current-password"></label>
      <button class="primary big" id="lGo">Đăng nhập</button><p id="lMsg" class="msg"></p>${gameUrl()?`<a class="link" href="${esc(gameUrl())}">Chưa có tài khoản? Đăng ký trong game</a>`:''}</div>`;
    const go=$('#lGo');
    view.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')go.click();}));
    go.onclick=async()=>{busy(go,true);try{const r=await Net.call('login',{username:$('#lUser').value,password:$('#lPass').value});Net.setToken(r.token);await boot();}catch(e){$('#lMsg').textContent=errMsg(e);busy(go,false);}};
  }
  async function boot(){
    let r;try{r=await Net.call('chars');}catch(e){Net.setToken('');return login();}
    S.acc=r.account;S.chars=r.chars;S.max=r.max;S.claim=r.claim;
    $('#chUser').innerHTML=`<b>${esc(S.acc.username)}</b><button id="chOut">Đăng xuất</button>`;
    $('#chOut').onclick=async()=>{try{await Net.call('logout');}catch(e){}Net.setToken('');S.charId=null;login();};
    const act=S.chars.filter(c=>c.status==='active');
    if(!act.some(c=>c.id===S.charId))S.charId=(act[0]||{}).id||null;
    if(S.charId)await loadChar();else S.state=null;
    draw();
  }
  async function loadChar(){try{const r=await Net.call('load',{charId:S.charId});S.state=r.save.player;}catch(e){S.state=null;toast(svg('close')+errMsg(e),true);}}
  // ---------- giao diện ----------
  function draw(){
    const act=S.chars.filter(c=>c.status==='active'),c=cur(),st=S.state;
    const picker=act.length?`<div class="who"><span class="lbl">Nhân vật giao dịch</span><div class="who-list">${act.map(x=>`<button data-char="${x.id}" class="${x.id===S.charId?'on':''}"><b>${esc(x.name)}</b><small>${x.gender==='f'?'Nữ':'Nam'}</small></button>`).join('')}</div>${st?`<div class="purse">${coins(st.copper)}<span class="bagc">${svg('bag')}${st.bag.filter(Boolean).length}/${st.bag.length}</span><span class="bagc">${svg('user')}${st.mercs.length}/${Player.MAX_MERC}</span></div>`:''}</div>`:`<div class="empty">${svg('user')}<span>Tài khoản chưa có nhân vật nào đang hoạt động.</span></div>`;
    const tabs=[['do','coin','Hàng hóa'],['ky','bag','Ký gửi'],['linh','user','Nhân vật đi theo'],['tien','check','Tiền bán hàng'+(S.claim?' <i class="dot"></i>':'')]];
    view.innerHTML=picker+`<nav class="tabs">${tabs.map(([k,ic,t])=>`<button data-tab="${k}" class="${S.tab===k?'on':''}">${svg(ic)}<span>${t}</span></button>`).join('')}</nav><section id="chPane"></section>`;
    view.querySelectorAll('[data-char]').forEach(b=>b.onclick=async()=>{S.charId=b.dataset.char;S.sel=null;await loadChar();draw();});
    view.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;S.sel=null;draw();});
    ({do:paneMarket,ky:paneSell,linh:paneMercs,tien:paneClaim})[S.tab]();
  }
  const pane=()=>$('#chPane');
  const card=(it,price,foot,attrs='')=>`<div class="card" ${attrs} style="--q:${qColor(it)}"><div class="ci" style="color:${tintOf(it)||'#e4cc8d'}">${icon(it.type)}${it.lv?`<b class="lv">+${it.lv}</b>`:''}</div><b class="nm" style="color:${qColor(it)}">${esc(Player.nameOf(it))}</b><small class="q" style="color:${qColor(it)}">${Player.rar(it).name}</small>${chips(it)}${price!=null?`<div class="pr">${coins(price)}</div>`:''}${foot||''}</div>`;
  async function paneMarket(){
    const p=pane();
    if(!S.market){p.innerHTML='<p class="hint">Đang tải hàng…</p>';try{S.market=await Net.call('marketList');}catch(e){p.innerHTML=`<p class="hint">${esc(errMsg(e))}</p>`;return;}S.claim=S.market.claim;}
    const q=S.filter,list=S.market.open.map(r=>({...r,it:Player.cleanItem(r.item)})).filter(r=>r.it&&(q==='all'||Player.qOf(r.it)===q));
    const flt=[['all','Tất cả'],...Object.entries(Player.RAR).filter(([,r])=>r.trade).map(([k,r])=>[k,r.name])];
    const money=S.state?S.state.copper:0;
    p.innerHTML=`<div class="flt">${flt.map(([k,t])=>`<button data-f="${k}" class="${q===k?'on':''}" ${Player.RAR[k]?`style="color:${Player.RAR[k].color}"`:''}>${t}</button>`).join('')}<button id="reload" class="ghost">${svg('next')}Làm mới</button></div>`+
      (list.length?`<div class="grid">${list.map(r=>card(r.it,r.price,r.mine?`<button data-cancel="${r.id}">${svg('out')}Lấy lại</button><small class="seller">Của bạn</small>`:`<button class="primary" data-buy="${r.id}"${!S.state||money<r.price?' disabled':''}>${svg('bag')}Mua</button><small class="seller">${esc(r.seller||'')}</small>`)).join('')}</div>`:`<div class="empty">${svg('coin')}<span>Chợ chưa có hàng.</span></div>`);
    p.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.filter=b.dataset.f;paneMarket();});
    $('#reload').onclick=()=>{S.market=null;paneMarket();};
    p.querySelectorAll('[data-buy]').forEach(b=>b.onclick=async()=>{busy(b,true);try{const r=await Net.call('marketBuy',{charId:S.charId,id:b.dataset.buy});S.state=r.state;S.market=null;toast(svg('check')+`${esc(cur().name)} đã mua <b style="color:${qColor(r.item)}">${esc(Player.nameOf(r.item))}</b>`);draw();}catch(e){toast(svg('close')+errMsg(e),true);busy(b,false);}});
    p.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=async()=>{busy(b,true);try{const r=await Net.call('marketCancel',{id:b.dataset.cancel});if(r.charId===S.charId)S.state=r.state;S.market=null;toast(svg('check')+'Đã lấy lại món đồ về túi nhân vật đã ký gửi');draw();}catch(e){toast(svg('close')+errMsg(e),true);busy(b,false);}});
  }
  function paneSell(){
    const p=pane(),st=S.state;
    if(!st){p.innerHTML='<div class="empty"><span>Chọn nhân vật trước.</span></div>';return;}
    const fee=Player.CFG.phi_cho||0,tr=Object.values(Player.RAR).filter(r=>r.trade).map(r=>`<b style="color:${r.color}">${r.name}</b>`).join(', ');
    const own=st.bag.map((it,i)=>it&&Player.tradeable(it)?{it,i}:null).filter(Boolean);
    const sel=S.sel!=null?st.bag[S.sel]:null;
    p.innerHTML=`<p class="hint">Chỉ đồ ${tr} trong túi của ${esc(cur().name)} mới ký gửi được. Bán được, thương nhân giữ ${fee}%, tiền về mục Tiền bán hàng.</p>`+
      (own.length?`<div class="grid">${own.map(({it,i})=>card(it,null,`<button data-pick="${i}" class="${S.sel===i?'primary':''}">${svg('check')}${S.sel===i?'Đã chọn':'Chọn'}</button>`,S.sel===i?'data-on':'')).join('')}</div>`:`<div class="empty">${svg('bag')}<span>Túi không có đồ ký gửi được.</span></div>`)+
      (sel?`<div class="sellbar"><span>Giá bán <b style="color:${qColor(sel)}">${esc(Player.nameOf(sel))}</b></span><label>Vàng<input id="pg" type="number" min="0" value="1"></label><label>Bạc<input id="ps" type="number" min="0" max="99" value="0"></label><label>Đồng<input id="pc" type="number" min="0" max="99" value="0"></label><button class="primary" id="sGo">${svg('coin')}Ký gửi</button></div>`:'');
    p.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.pick);S.sel=S.sel===i?null:i;paneSell();});
    const go=$('#sGo');if(go)go.onclick=async()=>{
      const v=id=>Math.max(0,Math.floor(+$(id).value||0)),price=v('#pg')*10000+Math.min(99,v('#ps'))*100+Math.min(99,v('#pc'));
      if(price<1)return toast(svg('close')+'Nhập giá bán',true);
      busy(go,true);try{const r=await Net.call('marketSell',{charId:S.charId,i:S.sel,price});S.state=r.state;S.sel=null;S.market=null;toast(svg('check')+'Đã bày hàng ra chợ');draw();}catch(e){toast(svg('close')+errMsg(e),true);busy(go,false);}
    };
  }
  const statLine=s=>`<small class="stats">SM ${s.strength} · NN ${s.agility} · SK ${s.vitality} · TT ${s.intelligence}</small>`;
  const gear=eq=>Player.slots.map(k=>eq&&eq[k]&&info(eq[k])?`<span title="${esc(Player.nameOf(eq[k]))}" style="color:${qColor(eq[k])}">${icon(eq[k].type)}</span>`:'').join('');
  async function paneMercs(){
    const p=pane();
    if(!S.mercs){p.innerHTML='<p class="hint">Đang tải…</p>';try{S.mercs=(await Net.call('mercList')).list;}catch(e){S.mercs=[];}}
    const st=S.state,full=st&&st.mercs.length>=Player.MAX_MERC,money=st?st.copper:0;
    const list=S.mercs.length?S.mercs.map(m=>`<div class="row"><span class="g">${m.gender==='f'?'Nữ':'Nam'}</span><div><b>${esc(m.name)}</b><span class="gear">${gear(m.equipment)}</span>${statLine(m.stats)}</div><div class="end">${coins(m.price)}<button class="primary" data-mbuy="${m.id}"${!st||full||money<m.price?' disabled':''}>${svg('user')}Mua về đi theo</button></div></div>`).join(''):`<div class="empty">${svg('user')}<span>Chưa có ai cho thuê nhân vật.</span></div>`;
    const mine=S.chars.filter(c=>c.id!==S.charId).map(c=>`<div class="row mine"><span class="g">${c.gender==='f'?'Nữ':'Nam'}</span><div><b>${esc(c.name)}</b>${statLine(c.stats)}${c.status==='merc'?`<small class="tag">Đang cho thuê · ${coins(c.price)}</small>`:''}</div><div class="end">${c.status==='merc'?`<button data-mcancel="${c.id}">Hủy cho thuê</button>`:`<div class="price-in"><label>Vàng<input data-mg="${c.id}" type="number" min="0" value="2"></label><label>Bạc<input data-ms="${c.id}" type="number" min="0" max="99" value="0"></label></div><button data-mreg="${c.id}">Cho thuê</button>`}</div></div>`).join('');
    p.innerHTML=`<p class="hint">Mua nhân vật của người chơi khác về làm lính đi theo ${st?esc(cur().name):''} (${st?st.mercs.length:0}/${Player.MAX_MERC}). Lính mua về thuộc về bạn, cần 10 Mệnh lệnh để dẫn theo.</p><div class="rows">${list}</div>
      <h3>Cho thuê nhân vật của tôi</h3><p class="hint">Nhân vật đang cho thuê không vào game được. Có người mua thì nhân vật thuộc về họ, bạn nhận tiền (trừ ${Player.CFG.phi_cho||0}% phí). Không cho thuê được nhân vật đang chọn giao dịch.</p><div class="rows">${mine||'<div class="empty"><span>Không có nhân vật nào khác.</span></div>'}</div>`;
    p.querySelectorAll('[data-mbuy]').forEach(b=>b.onclick=async()=>{busy(b,true);try{const r=await Net.call('mercBuy',{charId:S.charId,targetId:b.dataset.mbuy});S.state=r.state;S.mercs=null;toast(svg('check')+`${esc(r.name)} sẽ đi theo ${esc(cur().name)}`);draw();}catch(e){toast(svg('close')+errMsg(e),true);busy(b,false);}});
    p.querySelectorAll('[data-mreg]').forEach(b=>b.onclick=async()=>{const id=b.dataset.mreg,g=+p.querySelector(`[data-mg="${id}"]`).value||0,s=+p.querySelector(`[data-ms="${id}"]`).value||0,price=Math.max(0,Math.floor(g))*10000+Math.min(99,Math.max(0,Math.floor(s)))*100;busy(b,true);try{await Net.call('mercRegister',{charId:id,price});await boot();toast(svg('check')+'Đã đăng cho thuê');}catch(e){toast(svg('close')+errMsg(e),true);busy(b,false);}});
    p.querySelectorAll('[data-mcancel]').forEach(b=>b.onclick=async()=>{busy(b,true);try{await Net.call('mercCancel',{charId:b.dataset.mcancel});await boot();toast(svg('check')+'Đã hủy cho thuê');}catch(e){toast(svg('close')+errMsg(e),true);busy(b,false);}});
  }
  function paneClaim(){
    const p=pane(),c=cur();
    p.innerHTML=`<div class="claim">${svg('coin')}<div><span>Tiền bán hàng đang chờ</span><b>${coins(S.claim)}</b></div>${S.claim&&c?`<button class="primary" id="cGo">Nhận vào ${esc(c.name)}</button>`:''}</div><p class="hint">Gồm tiền bán đồ ký gửi và tiền bán nhân vật cho thuê, đã trừ phí thương nhân.</p>`;
    const go=$('#cGo');if(go)go.onclick=async()=>{busy(go,true);try{const r=await Net.call('claim',{charId:S.charId});S.state=r.state;S.claim=0;toast(svg('check')+'Đã nhận '+coins(r.amount));draw();}catch(e){toast(svg('close')+errMsg(e),true);busy(go,false);}};
  }
  // ---------- khởi động ----------
  const g=gameUrl();if(g)$('#chBack').href=g;else $('#chBack').hidden=true;
  $('#chMode').textContent=Net.online?'':'Chế độ ngoại tuyến · dữ liệu lưu trên trình duyệt này';
  (async()=>{
    if(Net.online){try{const d=await Net.call('data');if(d.data&&d.data.vat_pham)Player.load(d.data);}catch(e){}}
    if(Net.token)await boot();else login();
  })();
})();
