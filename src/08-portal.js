/* ================= CỔNG VÀO: đăng nhập · đăng ký · quên tài khoản · căn lều chọn và tạo nhân vật ================= */
// Khung game vừa đúng phần nhìn thấy của màn hình: trên điện thoại trừ thanh địa chỉ / thanh công cụ của trình duyệt
(()=>{
  const el=document.getElementById('lu-hanh');if(!el)return;
  const fit=()=>{const vv=window.visualViewport,h=Math.round(Math.min(innerHeight,vv?vv.height*vv.scale:innerHeight));el.style.setProperty('--app-h',h+'px');el.style.height=h+'px';el.style.bottom='auto';if(scrollY)scrollTo(0,0);};
  fit();addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,350));if(window.visualViewport)visualViewport.addEventListener('resize',fit);
  // trang Blogspot không cuộn được phía sau khung game (trình duyệt cũ không hiểu :has)
  document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';
})();
(()=>{
  const $=s=>document.querySelector(s),root=$('#portal'),box=$('#portalBody'),card=$('.portal-card'),L=window.LH_Loader;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=c=>{const m=Player.money(c),o=[];if(m.gold)o.push(m.gold+' vàng');if(m.silver)o.push(m.silver+' bạc');if(m.copper||!o.length)o.push(m.copper+' đồng');return o.join(' ');};
  const STAT=[['strength','Sức mạnh','Sát thương, tỉ lệ x2'],['agility','Nhanh nhẹn','Tốc đánh, tốc chạy, né, phòng ngự'],['vitality','Sức khỏe','Máu, hồi máu, phản đòn'],['intelligence','Trí tuệ','Mana, hồi mana, hồi chiêu']];
  const STORY='Người cha khi không thấy con gái đâu quyết định đi tìm, và bất ngờ khi được dẫn vào một thế giới mà ở đó, anh ta phải chiến đấu để tìm ra dấu vết của con gái.';
  const face=g=>`<svg viewBox="0 0 64 64" class="pface"><path fill="#d9ad80" d="M10 64v-8c0-21 44-21 44 0v8Z"/>${g==='f'?'<path fill="#c0392b" d="M32 44l10 10-10 10-10-10Z"/><ellipse fill="#2a2622" cx="20" cy="34" rx="7" ry="13"/>':'<path fill="#8b3a2a" d="M14 62h36v2H14z"/>'}<ellipse fill="#e4c69b" cx="32" cy="25" rx="15" ry="18"/><path fill="#2a2622" d="M16 26V14C16-2 52-3 48 19L33 13l-17 13Z"/>${g==='f'?'<ellipse fill="#2a2622" cx="20" cy="8" rx="8" ry="6"/>':''}</svg>`;
  let msgTimer;
  const note=(t,ok)=>{const n=$('#portalMsg');n.textContent=t;n.className=ok?'ok':'';clearTimeout(msgTimer);if(t)msgTimer=setTimeout(()=>n.textContent='',6000);};
  const busy=(btn,on)=>{if(btn){btn.disabled=on;btn.classList.toggle('busy',on);}};
  // Ảnh tĩnh từ Sheet hinh_anh: nền cổng vào, logo
  function paintPortal(){
    const bg=LH_IMG.url('giao_dien:nen_dang_nhap');root.style.background=bg?`#0d1a13 url("${bg}") center/cover no-repeat`:'';
    const lg=LH_IMG.url('giao_dien:logo'),b=$('.plogo b');if(b){if(lg&&!b.querySelector('img')){b.dataset.t=b.textContent;b.innerHTML=`<img src="${esc(lg)}" alt="${esc(b.dataset.t)}" class="plogo-img" referrerpolicy="no-referrer" onerror="this.parentNode.textContent=this.alt">`;}else if(!lg&&b.dataset.t){b.textContent=b.dataset.t;delete b.dataset.t;}}
  }
  paintPortal();
  $('#netMode').textContent=Net.online?'Máy chủ Việt Nam':'Chế độ ngoại tuyến · dữ liệu lưu trên trình duyệt này';
  function auth(tab='login'){
    stopTent();card.classList.remove('wide');
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
        if(tab==='register'&&val('#fPass')!==val('#fPass2'))throw Error('Mật khẩu nhập lại không khớp');
        L.show({label:'Kết nối máy chủ Việt Nam',bg:'tai_game'}).step(0,null,45);
        let r;
        if(tab==='login')r=await Net.call('login',{username:val('#fUser'),password:val('#fPass')});
        else if(tab==='register')r=await Net.call('register',{email:val('#fEmail'),username:val('#fUser'),password:val('#fPass')});
        else r=await Net.call('reset',{email:val('#fEmail'),code:val('#fCode'),password:val('#fPass')});
        Net.setToken(r.token);note('');L.step(45,'Tải nhân vật',92);
        await chars();await L.done();
      }catch(e){L.hide();note(NET_ERR[e.message]?netMsg(e):e.message);}
      busy(go,false);
    };
  }
  /* ---------- Căn lều: 5 ô, nhân vật đứng trước lều với đầy đủ đồ, cấp, hào quang, số lính ---------- */
  let art=null,T={r:null,sel:0,mode:'view',gender:'m',st:null,raf:0,cv:null,slots:[]};
  const getArt=()=>art||(art=window.startGame({portrait:true,player:Player.create({name:'.',gender:'m'})}));
  function stopTent(){cancelAnimationFrame(T.raf);T.raf=0;}
  const whoOf=c=>c.look&&c.look.equipment?{gender:c.gender,equipment:c.look.equipment,stats:c.stats}:Player.create({name:c.name,gender:c.gender,stats:c.stats});
  // v10.12: lều hiện ngay từ danh sách nhân vật lưu lần trước (lh-chars-cache), rồi thay bằng danh sách mới khi máy chủ trả về
  const CK='lh-chars-cache',charsCached=()=>{try{const c=JSON.parse(localStorage.getItem(CK)||'null');return c&&c.tok===Net.token&&c.account&&Array.isArray(c.chars)?c:null;}catch(e){return null;}},charsKeep=r=>{try{localStorage.setItem(CK,JSON.stringify({tok:Net.token,account:r.account,chars:r.chars,max:r.max}));}catch(e){}};
  async function chars(selId,pre){
    let r;
    const cached=T.r?null:charsCached();
    if(cached&&!T.r){tent(cached,selId);note('Đang làm mới danh sách nhân vật…',true);}
    // phần chơi còn giữ trên máy (lần trước chưa kịp lưu): gửi trước để lều hiện đúng cấp, tiền
    try{r=await (pre||Net.call('chars'));if(r&&r.__err)throw r.__err;let n=0;for(const c of r.list||r.chars||[])if(c&&c.id&&LH_Local.get(c.id)){await LH_Local.push(c.id).catch(()=>{});n++;}if(n)r=await Net.call('chars');}catch(e){Net.setToken('');note(netMsg(e));return auth('login');}
    charsKeep(r);if(cached)note('');
    tent(r,selId);
  }
  function tent(r,selId){
    T.r=r;T.mode='view';window.LH_USER=r.account&&r.account.username||''; // tên đăng nhập (ghi trong nội dung chuyển khoản khi nạp thẻ)
    if(selId){const i=r.chars.findIndex(c=>c.id===selId);if(i>=0)T.sel=i;}
    if(T.sel>=Math.max(r.max,1))T.sel=0;
    card.classList.add('wide');
    box.innerHTML=`<div class="phead"><b>${esc(r.account.username)}</b><span class="srv">Máy chủ Việt Nam</span><button id="pOut">Đăng xuất</button></div>
      <div class="tent-wrap"><canvas id="tentCv" aria-label="Căn lều nhân vật"></canvas></div>
      <div id="tentInfo" class="tent-info"></div>
      ${r.claim||r.claimRuby?`<p class="hint2 ok">Có ${r.claim?money(r.claim):''}${r.claim&&r.claimRuby?' và ':''}${r.claimRuby?r.claimRuby+' hồng ngọc':''} tiền bán hàng đang chờ, nhận ở Chợ phiên.</p>`:''}`;
    $('#pOut').onclick=async()=>{try{await Net.call('logout');}catch(e){}Net.setToken('');auth('login');};
    T.cv=$('#tentCv');T.cv.onpointerdown=e=>{const b=T.cv.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;const s=T.slots.find(s=>Math.abs(x-s.x)<s.w/2&&y>s.top&&y<s.y+18);if(!s)return;
      T.sel=s.i;const c=r.chars[s.i];T.mode=c?'view':'create';if(!c)T.st=null;info();};
    getArt();info();stopTent();T.raf=requestAnimationFrame(drawTent);
  }
  function info(){
    const r=T.r,c=r.chars[T.sel],el=$('#tentInfo');if(!el)return;
    if(T.mode==='create')return createForm(el);
    if(!c){el.innerHTML=r.chars.length<r.max?`<div class="ti-empty"><span>Ô trống trước căn lều</span><button class="primary big-btn" id="tNew">Tạo nhân vật (${r.chars.length}/${r.max})</button></div>`:`<p class="hint2">Đã đủ ${r.max} nhân vật.</p>`;
      const b=$('#tNew');if(b)b.onclick=()=>{T.mode='create';T.st=null;info();};return;}
    const k=c.look||{},m=k.main||{str:c.stats.strength,agi:c.stats.agility,vit:c.stats.vitality,int:c.stats.intelligence,cmd:10};
    const chip=(t,v)=>`<span class="ti-c"><small>${t}</small><b>${v}</b></span>`;
    el.innerHTML=`<div class="ti-head"><b>${esc(c.name)}</b><small>Lv. ${k.level||c.level||1} · ${c.gender==='f'?'Nữ':'Nam'}</small></div>
      <div class="ti-stats">${chip('Sức mạnh',m.str)}${chip('Nhanh nhẹn',m.agi)}${chip('Sức khỏe',m.vit)}${chip('Trí tuệ',m.int)}${chip('Mệnh lệnh',m.cmd)}${k.dmg?chip('Sát thương',k.dmg[0]+'–'+k.dmg[1]):''}${k.hp?chip('Máu',k.hp):''}${chip('Lính',(k.mercs||0)+'/'+Player.MAX_MERC)}${k.pets?chip('Quái thu phục',k.pets):''}</div>
      ${c.status==='merc'?'':`<div class="ti-del"><button class="ghost" id="tDel">✕ Xoá nhân vật</button></div>`}
      ${c.status==='merc'?`<p class="hint2">Đang cho thuê ở Chợ phiên · ${c.price?money(c.price):''}${c.price&&c.ruby?' + ':''}${c.ruby?c.ruby+' hồng ngọc':''}</p>`:`<button class="primary big-btn" id="tEnter">Vào làng</button>`}`;
    const b=$('#tEnter');if(b)b.onclick=()=>enter(c.id,r.claim,b);
    const dl=$('#tDel');if(dl)dl.onclick=()=>delForm(c);
  }
  // v10.31: xoá nhân vật — gõ đúng tên để xác nhận, xoá vĩnh viễn (tên được dùng lại)
  function delForm(c){
    const el=$('#tentInfo');if(!el)return;
    el.innerHTML=`<div class="ti-head"><b>Xoá ${esc(c.name)}?</b></div><p class="hint2">Nhân vật, đồ, lính, tiền và hồng ngọc của nhân vật này sẽ mất vĩnh viễn, không lấy lại được. Gõ đúng tên <b>${esc(c.name)}</b> để xác nhận.</p>
      <input id="tDelName" class="ti-del-in" autocomplete="off" placeholder="${esc(c.name)}"><div class="ti-del-row"><button id="tDelNo">Thôi</button><button class="danger big-btn" id="tDelGo" disabled>Xoá vĩnh viễn</button></div>`;
    const inp=$('#tDelName'),go=$('#tDelGo');inp.focus();inp.oninput=()=>{go.disabled=inp.value.trim()!==c.name;};
    $('#tDelNo').onclick=()=>info();
    go.onclick=async()=>{busy(go,true);try{await Net.call('delChar',{charId:c.id,name:inp.value.trim()});
        try{localStorage.removeItem('lh-last-map-'+c.id);LH_Local.clear(c.id);}catch(e){}
        const r=T.r;r.chars=r.chars.filter(x=>x.id!==c.id);charsKeep(r);T.sel=Math.min(T.sel,Math.max(0,r.chars.length));note('Đã xoá '+c.name,true);info();}
      catch(e){busy(go,false);note(netMsg(e));}};
  }
  function createForm(el){
    const total=Number(Player.CFG.diem_khoi_tao)||50;T.st=T.st||{strength:13,agility:13,vitality:12,intelligence:12};const st=T.st;
    const left=()=>total-Object.values(st).reduce((a,b)=>a+b,0);
    const keepName=()=>($('#cName')||{}).value||'';
    const draw=name=>{
      el.innerHTML=`<div class="ti-head"><b>Tạo nhân vật</b><button id="cBack">Hủy</button></div>
        <div class="gpick">${['m','f'].map(g=>`<button data-g="${g}" class="${g===T.gender?'on':''}">${face(g)}<span>${g==='m'?'Nam':'Nữ'}</span></button>`).join('')}</div>
        <div class="spick">${STAT.map(([k,n,d])=>`<div class="srow"><div><b>${n}</b><small>${d}</small></div><button data-dec="${k}">−</button><input data-in="${k}" type="number" min="0" max="${total}" value="${st[k]}"><button data-inc="${k}">+</button></div>`).join('')}<p class="left${left()?'':' ok'}">Còn lại: <b>${left()}</b> / ${total} điểm</p></div>
        <label>Tên nhân vật<input id="cName" maxlength="16" placeholder="2–16 ký tự"></label><button class="primary big-btn" id="cGo"${left()?' disabled':''}>Khởi tạo</button>`;
      $('#cName').value=name||'';
      $('#cBack').onclick=()=>{T.mode='view';info();};
      el.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{T.gender=b.dataset.g;draw(keepName());});
      const set=(k,v)=>{const others=total-left()-st[k];st[k]=Math.max(0,Math.min(total-others,Math.floor(v)||0));draw(keepName());};
      el.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>set(b.dataset.dec,st[b.dataset.dec]-1));
      el.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>set(b.dataset.inc,st[b.dataset.inc]+1));
      el.querySelectorAll('[data-in]').forEach(i=>i.onchange=()=>set(i.dataset.in,+i.value));
      $('#cGo').onclick=async()=>{
        const g=$('#cGo');busy(g,true);
        L.show({story:STORY,label:'Khởi tạo nhân vật',bg:'tao_nv',speed:55}).step(4,null,55);
        try{
          const res=await Net.call('createChar',{name:$('#cName').value,gender:T.gender,stats:{...st}});
          L.step(55,'Chuẩn bị hành trang',92);
          // v10.12: không gọi lại máy chủ, thêm nhân vật mới vào lều ngay
          const r=T.r||charsCached()||{account:{username:window.LH_USER||''},chars:[],max:5};r.chars=[...(r.chars||[]),res.char];charsKeep(r);
          tent(r,res.char.id);await L.done({min:1200});note('Nhân vật đã đứng trước căn lều',true);
        }catch(e){L.hide();note(netMsg(e));busy(g,false);}
      };
    };
    draw('');
  }
  // Vẽ cảnh: trời chạng vạng, đồi xa, lũy tre, căn lều tranh có đèn lồng, 5 ô chiếu trước lều
  function drawTent(ts){
    T.raf=requestAnimationFrame(drawTent);const cv=T.cv;if(!cv||!document.body.contains(cv)){stopTent();return;}
    const t=ts/1000,w=cv.clientWidth||600,h=Math.round(Math.max(250,Math.min(400,w*.56))),d=Math.min(2,devicePixelRatio||1);
    if(cv.width!==Math.round(w*d)||cv.height!==Math.round(h*d)){cv.width=Math.round(w*d);cv.height=Math.round(h*d);cv.style.height=h+'px';}
    const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);
    // ảnh nền căn lều từ Sheet hinh_anh (giao_dien:nen_leu), không có thì vẽ cảnh mặc định
    const tp=LH_IMG.pic('giao_dien:nen_leu');
    if(tp){const s=Math.max(w/tp.naturalWidth,h/tp.naturalHeight),iw=tp.naturalWidth*s,ih=tp.naturalHeight*s;c.drawImage(tp,(w-iw)/2,(h-ih)/2,iw,ih);}else{
    const sky=c.createLinearGradient(0,0,0,h*.6);sky.addColorStop(0,'#15202e');sky.addColorStop(.7,'#4f3a3c');sky.addColorStop(1,'#c27c4a');c.fillStyle=sky;c.fillRect(0,0,w,h);
    c.fillStyle='#fff6d0';for(let i=0;i<40;i++){const x=(i*97)%w,y=(i*53)%(h*.35);c.globalAlpha=.3+.3*Math.sin(t*2+i);c.fillRect(x,y,1.5,1.5);}c.globalAlpha=1;
    c.fillStyle='#ffe7b0';c.beginPath();c.arc(w*.82,h*.14,Math.min(w,h)*.045,0,Math.PI*2);c.fill();
    const hill=(y,a,col,p)=>{c.fillStyle=col;c.beginPath();c.moveTo(0,h);for(let x=0;x<=w;x+=10)c.lineTo(x,y+Math.sin(x*.008+p)*a);c.lineTo(w,h);c.fill();};
    hill(h*.5,h*.04,'#3b3340',1);hill(h*.56,h*.025,'#2b3428',3);
    const ground=c.createLinearGradient(0,h*.58,0,h);ground.addColorStop(0,'#5b4a30');ground.addColorStop(1,'#2e2618');c.fillStyle=ground;c.fillRect(0,h*.58,w,h*.42);
    c.fillStyle='#1d2a1a';for(let i=0;i<16;i++){const x=i<8?i*w*.025:w-(i-8)*w*.025,bh=h*(.22+((i*7)%5)/30),sw=Math.sin(t*1.2+i)*3;c.beginPath();c.moveTo(x-4,h*.6);c.quadraticCurveTo(x+sw,h*.6-bh*.6,x+sw*2,h*.6-bh);c.quadraticCurveTo(x+sw+4,h*.6-bh*.6,x+4,h*.6);c.fill();}
    // căn lều tranh
    const tx=w*.5,base=h*.6,tw=Math.min(w*.56,480),th=h*.42;
    const glow=c.createRadialGradient(tx,base-th*.25,4,tx,base-th*.25,tw*.6);glow.addColorStop(0,'#ffb35a44');glow.addColorStop(1,'#ffb35a00');c.fillStyle=glow;c.fillRect(tx-tw,base-th*1.2,tw*2,th*1.4);
    c.fillStyle='#7a5a2e';c.beginPath();c.moveTo(tx-tw/2,base);c.lineTo(tx,base-th);c.lineTo(tx+tw/2,base);c.fill();
    c.strokeStyle='#a8834a';c.lineWidth=1.2;for(let i=0;i<22;i++){const f=i/21;c.beginPath();c.moveTo(tx-tw/2+tw*f,base);c.lineTo(tx+(f-.5)*tw*.12,base-th*.96);c.stroke();}
    c.strokeStyle='#5a3e1e';c.lineWidth=2;for(let k=1;k<4;k++){const y=base-th*k/4,hw=tw/2*(1-k/4);c.beginPath();c.moveTo(tx-hw,y);c.lineTo(tx+hw,y);c.stroke();}
    c.fillStyle='#2a1a0e';c.beginPath();c.moveTo(tx-tw*.13,base);c.lineTo(tx,base-th*.5);c.lineTo(tx+tw*.13,base);c.fill();
    const inner=c.createLinearGradient(0,base-th*.5,0,base);inner.addColorStop(0,'#ffcf7a55');inner.addColorStop(1,'#ff9a3a88');c.fillStyle=inner;c.beginPath();c.moveTo(tx-tw*.1,base);c.lineTo(tx,base-th*.42);c.lineTo(tx+tw*.1,base);c.fill();
    c.strokeStyle='#4a2e16';c.lineWidth=4;c.beginPath();c.moveTo(tx-6,base-th-12);c.lineTo(tx+8,base-th+8);c.moveTo(tx+6,base-th-12);c.lineTo(tx-8,base-th+8);c.stroke();
    for(const sx of [-1,1]){const lx=tx+sx*tw*.3,ly=base-th*.42+Math.sin(t*1.6+sx)*2;c.strokeStyle='#3a2a1a';c.lineWidth=1.2;c.beginPath();c.moveTo(lx,base-th*.62*(1-Math.abs(sx)*.1));c.lineTo(lx,ly-10);c.stroke();
      c.fillStyle='#c0392b';c.shadowColor='#ff9a5a';c.shadowBlur=14;c.beginPath();c.ellipse(lx,ly,7,9,0,0,Math.PI*2);c.fill();c.shadowBlur=0;c.fillStyle='#f3c14a';c.fillRect(lx-4,ly-11,8,3);c.fillRect(lx-4,ly+8,8,3);}
    for(const sx of [-1,1]){const px=tx+sx*(tw/2+18);c.strokeStyle='#5a3e1e';c.lineWidth=3;c.beginPath();c.moveTo(px,base+4);c.lineTo(px,base-th*.9);c.stroke();
      c.fillStyle=sx<0?'#b8342a':'#d9a33a';c.beginPath();c.moveTo(px,base-th*.9);c.quadraticCurveTo(px+sx*22,base-th*.86+Math.sin(t*3)*4,px+sx*40,base-th*.82+Math.sin(t*3+1)*6);c.lineTo(px,base-th*.74);c.fill();}
    }
    // 5 ô chiếu
    const r=T.r,n=Math.max(5,r?r.max:5),A=getArt(),k=Math.min(h/300*1.35,w/n/52);T.slots=[];
    for(let i=0;i<n;i++){
      const x=w*(.1+i*.8/(n-1)),y=h*.88-Math.abs(i-(n-1)/2)*h*.045,ch=r&&r.chars[i],sel=i===T.sel;
      c.fillStyle=sel?'#e8c46a55':'#00000035';c.beginPath();c.ellipse(x,y,30*k,9*k,0,0,Math.PI*2);c.fill();
      c.strokeStyle=sel?'#ffd98a':'#c9a35c88';c.lineWidth=sel?2.5:1.5;c.setLineDash(ch||sel?[]:[5,5]);c.beginPath();c.ellipse(x,y,30*k,9*k,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
      let top=y-80*k;
      if(ch){
        const who=whoOf(ch),seat=A.seat(who.equipment)*k*.9;c.save();if(ch.status==='merc')c.globalAlpha=.55;
        A.draw(c,who,x,y,k*.9,t+i*.7,ch.look&&ch.look.el,{facing:i<(n-1)/2?1:-1});c.restore();
        top=y-(66*k*.9+seat);const fs=Math.round(12*Math.max(.9,Math.min(1.25,k)));
        c.font=`700 ${fs}px system-ui`;c.textAlign='center';c.lineWidth=3;c.strokeStyle='#1a120c';
        const lv='Lv. '+((ch.look&&ch.look.level)||ch.level||1);c.strokeText(ch.name,x,top-fs-6);c.fillStyle=sel?'#ffe7a8':'#f3e6c4';c.fillText(ch.name,x,top-fs-6);
        c.font=`600 ${fs-1}px system-ui`;c.strokeText(lv,x,top-2);c.fillStyle='#9fe8a8';c.fillText(lv,x,top-2);
        const mc=(ch.look&&ch.look.mercs)||0,pc=(ch.look&&ch.look.pets)||0;
        if(mc||pc){const tag=(mc?'Lính '+mc:'')+(mc&&pc?' · ':'')+(pc?'Quái '+pc:'');c.font=`600 ${Math.round(10*Math.max(.9,k))}px system-ui`;c.strokeText(tag,x,y+20*k);c.fillStyle='#bfe3ff';c.fillText(tag,x,y+20*k);}
        if(ch.status==='merc'){c.font='600 10px system-ui';c.strokeText('Đang cho thuê',x,y+20*k+(mc||pc?13:0));c.fillStyle='#ffb0a0';c.fillText('Đang cho thuê',x,y+20*k+(mc||pc?13:0));}
        top-=24;
      }else if(sel&&T.mode==='create'){
        c.save();c.globalAlpha=.7+.15*Math.sin(t*3);A.draw(c,Player.create({name:'.',gender:T.gender}),x,y,k*.9,t,null);c.restore();top=y-100*k;
      }else{
        const a=.5+.35*Math.sin(t*2.5+i);c.strokeStyle=`rgba(255,217,138,${a})`;c.lineWidth=2.5;c.beginPath();c.moveTo(x-9*k,y-22*k);c.lineTo(x+9*k,y-22*k);c.moveTo(x,y-31*k);c.lineTo(x,y-13*k);c.stroke();
        c.font=`600 ${Math.round(11*Math.max(.9,k))}px system-ui`;c.textAlign='center';c.fillStyle='#e9dcb4';c.fillText(sel&&r&&i<r.max?'Tạo nhân vật':'',x,y-42*k);top=y-60*k;
      }
      T.slots.push({i,x,y,w:Math.min(w/n,80*k),top});
    }
    if(T.cv)T.cv.style.cursor='pointer';
  }
  async function enter(charId,claim,btn){
    busy(btn,true);
    L.show({scene:true,label:'Tải nhân vật',bg:'vao_lang'}).step(0,null,45);
    try{
      // v10.12: gói bản đồ nhân vật đứng lần trước tải song song với lệnh load (khóa lh-last-map-<id>)
      let lastMap='';try{lastMap=localStorage.getItem('lh-last-map-'+charId)||'';}catch(e){}if(lastMap)World.prefetch(lastMap);
      await LH_Local.push(charId);
      const [r]=await Promise.all([Net.call('load',{charId}),dataReady]);
      L.step(45,'Dựng làng Thanh Mộc',88);
      // dựng bản đồ nhân vật đang đứng (bản đồ chưa có trong game thì tải gói dữ liệu; lỗi thì về làng)
      const mid=(r.save&&r.save.pos&&r.save.pos.map)||World.DEFAULT,got=await World.enter(mid);try{localStorage.setItem('lh-last-map-'+charId,got);}catch(e){}
      const R=Player.restore(got===mid?r.save:{...r.save,pos:null},r.char,World.canStand,null);
      await new Promise(ok=>setTimeout(ok,60));
      stopTent();root.hidden=true;document.body.classList.add('in-game');document.getElementById('lu-hanh')?.classList.add('in-game');
      window.startGame({charId,player:R.player,pos:R.pos,seen:R.seen});
      window.startUI({charId,claim});
      if(!r.save)window.mapGame.save();
      await L.done({label:'Vào làng'});
    }catch(e){L.hide();root.hidden=false;note(netMsg(e));busy(btn,false);}
  }
  let dataReady=Promise.resolve();
  (async()=>{
    // nối tiếp thanh tải của file khởi động (nếu có), rồi tới kết nối máy chủ và tải nhân vật
    const from=L.visible?70:0;L.show({keep:from>0,label:'Kết nối máy chủ Việt Nam',bg:'tai_game'}).step(from,'Kết nối máy chủ Việt Nam',from+(100-from)*.45);
    // v10.11: tải nhanh — dữ liệu tĩnh lưu đệm trong máy (khóa lh-data-cache, kèm mã h); gửi h lên, máy chủ trả same:true nếu chưa đổi (đỡ tải ~120 KB);
    // gọi 'data' và 'chars' song song thay vì nối tiếp
    const cached=(()=>{try{const c=JSON.parse(localStorage.getItem('lh-data-cache')||'null');return c&&c.data&&c.data.vat_pham?c:null;}catch(e){return null;}})();
    if(cached){try{Player.load(cached.data);LH_IMG.set(cached.data.hinh_anh);paintPortal();}catch(e){}}
    let pChars=null;
    if(Net.online){
      if(Net.token)pChars=Net.call('chars').catch(e=>({__err:e}));
      // v10.31: dữ liệu tĩnh tải song song, không chặn đăng nhập / căn lều; chỉ chờ lúc bấm Vào làng
      dataReady=(async()=>{try{const d=await Net.call('data',{h:cached?cached.h:''});
        if(!d.same&&d.data&&d.data.vat_pham){Player.load(d.data);LH_IMG.set(d.data.hinh_anh);paintPortal();try{localStorage.setItem('lh-data-cache',JSON.stringify({h:d.h||'',data:d.data}));}catch(e){}}
      }catch(e){if(!cached)note('Không tải được dữ liệu từ máy chủ, dùng dữ liệu mặc định');}})();
      if(!cached)await dataReady; // lần đầu (chưa có dữ liệu trong máy) vẫn chờ
    }
    L.step(from+(100-from)*.45,Net.token?'Tải nhân vật':'Sẵn sàng',from+(100-from)*.92);
    if(Net.token)await chars(undefined,pChars);else auth('login');
    await L.done();
  })();
})();
