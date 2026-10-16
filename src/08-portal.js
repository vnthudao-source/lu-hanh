/* ================= CỔNG VÀO: đăng nhập · đăng ký · quên tài khoản · chọn và tạo nhân vật ================= */
(()=>{
  const $=s=>document.querySelector(s),root=$('#portal'),box=$('#portalBody');
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=c=>{const m=Player.money(c);return `${m.gold} vàng ${m.silver} bạc ${m.copper} đồng`;};
  const STAT=[['strength','Sức mạnh','Sát thương, tỉ lệ x2'],['agility','Nhanh nhẹn','Tốc đánh, tốc chạy, né, phòng ngự'],['vitality','Sức khỏe','Máu, hồi máu, phản đòn'],['intelligence','Trí tuệ','Mana, hồi mana, hồi chiêu']];
  const face=g=>`<svg viewBox="0 0 64 64" class="pface"><path fill="#d9ad80" d="M10 64v-8c0-21 44-21 44 0v8Z"/>${g==='f'?'<path fill="#c0392b" d="M32 44l10 10-10 10-10-10Z"/><ellipse fill="#2a2622" cx="20" cy="34" rx="7" ry="13"/>':'<path fill="#8b3a2a" d="M14 62h36v2H14z"/>'}<ellipse fill="#e4c69b" cx="32" cy="25" rx="15" ry="18"/><path fill="#2a2622" d="M16 26V14C16-2 52-3 48 19L33 13l-17 13Z"/>${g==='f'?'<ellipse fill="#2a2622" cx="20" cy="8" rx="8" ry="6"/>':''}</svg>`;
  let msgTimer;
  const note=(t,ok)=>{const n=$('#portalMsg');n.textContent=t;n.className=ok?'ok':'';clearTimeout(msgTimer);if(t)msgTimer=setTimeout(()=>n.textContent='',6000);};
  const busy=(btn,on)=>{if(btn){btn.disabled=on;btn.classList.toggle('busy',on);}};
  $('#netMode').textContent=Net.online?'Máy chủ: Apps Script':'Chế độ ngoại tuyến · dữ liệu lưu trên trình duyệt này';
  function auth(tab='login'){
    const tabs=[['login','Đăng nhập'],['register','Đăng ký'],['forgot','Quên tài khoản']];
    let form='';
    if(tab==='login')form=`<label>Tên đăng nhập hoặc email<input id="fUser" autocomplete="username"></label><label>Mật khẩu<input id="fPass" type="password" autocomplete="current-password"></label><button class="primary big-btn" id="fGo">Đăng nhập</button>`;
    else if(tab==='register')form=`<label>Email<input id="fEmail" type="email" autocomplete="email"></label><label>Tên đăng nhập<input id="fUser" autocomplete="username" placeholder="3–20 ký tự: a-z, 0-9, _"></label><label>Mật khẩu<input id="fPass" type="password" autocomplete="new-password" placeholder="Tối thiểu 6 ký tự"></label><label>Nhập lại mật khẩu<input id="fPass2" type="password" autocomplete="new-password"></label><button class="primary big-btn" id="fGo">Đăng ký</button>`;
    else form=`<p class="hint2">Nhập email đã đăng ký. Mã khôi phục và tên đăng nhập sẽ được gửi vào email.</p><label>Email<input id="fEmail" type="email"></label><button class="big-btn" id="fSend">Gửi mã</button><label>Mã khôi phục<input id="fCode" inputmode="numeric"></label><label>Mật khẩu mới<input id="fPass" type="password" autocomplete="new-password"></label><button class="primary big-btn" id="fGo">Đặt lại mật khẩu</button>`;
    box.innerHTML=`<div class="ptabs">${tabs.map(([k,t])=>`<button data-at="${k}" class="${k===tab?'on':''}">${t}</button>`).join('')}</div><div class="pform">${form}</div>`;
    box.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{note('');auth(b.dataset.at);});
    const go=$('#fGo'),val=id=>($(id)||{}).value||'';
    box.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')go.click();}));
    if($('#fSend'))$('#fSend').onclick=async()=>{const b=$('#fSend');busy(b,true);try{const r=await Net.call('forgot',{email:val('#fEmail')});note(r.devCode?`Ngoại tuyến: tên đăng nhập ${r.username}, mã ${r.devCode}`:'Đã gửi mã vào email',true);}catch(e){note(netMsg(e));}busy(b,false);};
    go.onclick=async()=>{
      busy(go,true);
      try{
        let r;
        if(tab==='login')r=await Net.call('login',{username:val('#fUser'),password:val('#fPass')});
        else if(tab==='register'){if(val('#fPass')!==val('#fPass2'))throw Error('Mật khẩu nhập lại không khớp');r=await Net.call('register',{email:val('#fEmail'),username:val('#fUser'),password:val('#fPass')});}
        else r=await Net.call('reset',{email:val('#fEmail'),code:val('#fCode'),password:val('#fPass')});
        Net.setToken(r.token);note('');await chars();
      }catch(e){note(NET_ERR[e.message]?netMsg(e):e.message);}
      busy(go,false);
    };
  }
  async function chars(){
    let r;try{r=await Net.call('chars');}catch(e){Net.setToken('');note(netMsg(e));return auth('login');}
    const list=r.chars.map(c=>`<div class="pchar${c.status==='merc'?' merc':''}">${face(c.gender)}<div class="pinfo"><b>${esc(c.name)}</b><small>${c.gender==='f'?'Nữ':'Nam'} · SM ${c.stats.strength} · NN ${c.stats.agility} · SK ${c.stats.vitality} · TT ${c.stats.intelligence}</small>${c.status==='merc'?`<small class="mtag">Đang cho thuê · ${money(c.price)}</small>`:''}</div><div class="pbtns">${c.status==='merc'?`<button data-cancel="${c.id}">Hủy cho thuê</button>`:`<button class="primary" data-enter="${c.id}">Vào làng</button><button data-rent="${c.id}">Cho thuê</button>`}</div></div>`).join('');
    box.innerHTML=`<div class="phead"><b>${esc(r.account.username)}</b><button id="pOut">Đăng xuất</button></div>${r.claim?`<p class="hint2 ok">Có ${money(r.claim)} tiền bán hàng đang chờ, sẽ cộng vào nhân vật khi vào làng.</p>`:''}<div class="plist">${list||'<p class="hint2">Chưa có nhân vật nào.</p>'}</div>${r.chars.length<r.max?`<button class="primary big-btn" id="pNew">Tạo nhân vật (${r.chars.length}/${r.max})</button>`:`<p class="hint2">Đã đủ ${r.max} nhân vật.</p>`}<div id="rentBox"></div>`;
    $('#pOut').onclick=async()=>{try{await Net.call('logout');}catch(e){}Net.setToken('');auth('login');};
    if($('#pNew'))$('#pNew').onclick=()=>create();
    box.querySelectorAll('[data-enter]').forEach(b=>b.onclick=()=>enter(b.dataset.enter,r.claim,b));
    box.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=async()=>{busy(b,true);try{await Net.call('mercCancel',{charId:b.dataset.cancel});await chars();}catch(e){note(netMsg(e));busy(b,false);}});
    box.querySelectorAll('[data-rent]').forEach(b=>b.onclick=()=>{
      const c=r.chars.find(x=>x.id===b.dataset.rent);
      $('#rentBox').innerHTML=`<div class="rent"><b>Cho thuê ${esc(c.name)}</b><p class="hint2">Trong lúc cho thuê bạn không vào được nhân vật này. Nếu có người mua, nhân vật thuộc về họ và bạn nhận tiền (trừ ${(Player.CFG.phi_cho||0)}% phí). Bạn vẫn tạo được nhân vật khác.</p><div class="price-in"><label>Vàng<input id="rg" type="number" min="0" value="1"></label><label>Bạc<input id="rs" type="number" min="0" max="99" value="0"></label></div><button class="primary big-btn" id="rGo">Đăng ký cho thuê</button></div>`;
      $('#rGo').onclick=async()=>{const price=Math.max(0,+$('#rg').value||0)*10000+Math.min(99,Math.max(0,+$('#rs').value||0))*100;const g=$('#rGo');busy(g,true);try{await Net.call('mercRegister',{charId:c.id,price});await chars();}catch(e){note(netMsg(e));busy(g,false);}};
    });
  }
  function create(){
    const total=Number(Player.CFG.diem_khoi_tao)||50,st={strength:13,agility:13,vitality:12,intelligence:12};let gender='m';
    const left=()=>total-Object.values(st).reduce((a,b)=>a+b,0);
    const draw=()=>{
      box.innerHTML=`<div class="phead"><b>Tạo nhân vật</b><button id="cBack">Quay lại</button></div>
        <div class="gpick">${['m','f'].map(g=>`<button data-g="${g}" class="${g===gender?'on':''}">${face(g)}<span>${g==='m'?'Nam · cởi trần, đóng khố':'Nữ · yếm, váy'}</span></button>`).join('')}</div>
        <div class="spick">${STAT.map(([k,n,d])=>`<div class="srow"><div><b>${n}</b><small>${d}</small></div><button data-dec="${k}">−</button><input data-in="${k}" type="number" min="0" max="${total}" value="${st[k]}"><button data-inc="${k}">+</button></div>`).join('')}<p class="left${left()?'':' ok'}">Còn lại: <b>${left()}</b> / ${total} điểm</p></div>
        <label>Tên nhân vật<input id="cName" maxlength="16" placeholder="2–16 ký tự"></label><button class="primary big-btn" id="cGo"${left()?' disabled':''}>Khởi tạo</button>`;
      $('#cBack').onclick=()=>chars();
      box.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{gender=b.dataset.g;const n=$('#cName').value;draw();$('#cName').value=n;});
      const set=(k,v)=>{const others=total-left()-st[k];st[k]=Math.max(0,Math.min(total-others,Math.floor(v)||0));const n=$('#cName').value;draw();$('#cName').value=n;};
      box.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>set(b.dataset.dec,st[b.dataset.dec]-1));
      box.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>set(b.dataset.inc,st[b.dataset.inc]+1));
      box.querySelectorAll('[data-in]').forEach(i=>i.onchange=()=>set(i.dataset.in,+i.value));
      $('#cGo').onclick=async()=>{const g=$('#cGo');busy(g,true);try{await Net.call('createChar',{name:$('#cName').value,gender,stats:{...st}});note('Đã tạo nhân vật',true);await chars();}catch(e){note(netMsg(e));busy(g,false);}};
    };
    draw();
  }
  async function enter(charId,claim,btn){
    busy(btn,true);
    try{
      const r=await Net.call('load',{charId});
      const R=Player.restore(r.save,r.char,World.canStand,World.npcs.map(n=>n.id));
      root.hidden=true;document.body.classList.add('in-game');
      window.startGame({charId,player:R.player,pos:R.pos,seen:R.seen});
      window.startUI({charId,claim});
      if(!r.save)window.mapGame.save();
    }catch(e){note(netMsg(e));busy(btn,false);}
  }
  (async()=>{
    if(Net.online){try{const d=await Net.call('data');if(d.data&&d.data.vat_pham)Player.load(d.data);}catch(e){note('Không tải được dữ liệu từ Sheet, dùng dữ liệu mặc định');}}
    if(Net.token)await chars();else auth('login');
  })();
})();
