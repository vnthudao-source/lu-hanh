/* v10.39: trò nhỏ của tuyến Tìm con (kịch bản chốt 19/10/2026).
   LH_TC: cách làm từng việc chính tuyến không phải săn quái, theo mã nhiệm vụ.
     Trên bản đồ (06-game.js, sqTick): talk = hỏi chuyện vài NPC · find = tìm vật (obj: hình vẽ của vật — camel lạc đà đi theo, ice khối băng cầm theo, drawing, foot, thread; seq: hiện lần lượt; back: mang về NPC; t: giây trước khi tan) · escort = dắt NPC tới chỗ cắm cờ.
     Bảng nhỏ (LH_TroChoi bên dưới): pick = chọn 1 đáp án mỗi lượt · seq = nhớ dãy đá · cards = lật thẻ · rhythm = bấm đúng nhịp · cups = úp cốc · lights = bật đèn 3×3 · order = xếp thứ tự.
     cond = việc có sẵn trong game (đoạt cờ, võ đài, cứu con), chỉ ghi gợi ý.
   Thua thì chơi lại ngay, không giới hạn lượt. Trò chạy ở máy người chơi bằng vài khối DOM, không tải thêm ảnh; xong gửi op sg để máy chủ ghi nhận. */
const LH_TC={
  'tc-q01':{k:'talk',map:'thanh-moc',hint:'Hỏi chuyện Thợ rèn, Thương nhân và Bé Na trong làng',who:{
    smith:['Con bé tóc buộc nơ đỏ hả? Ta mải rèn, chẳng để ý ai qua lại.','Hỏi bọn trẻ trong làng xem, chúng chạy nhảy khắp nơi.'],
    merchant:['Mấy hôm trước có hai gã áo đen ghé mua lương khô, trả bằng bạc lạ.','Chúng hỏi đường tới Hang động, ta còn thấy lạ.'],
    'be-na':['Em thấy rồi! Có một chị cầm cây bút lông, khóc thút thít.','Hai chú áo đen nắm tay chị ấy dắt về phía Hang động. Em sợ quá trốn sau gốc đa…']}},
  'tc-q02':{k:'find',obj:'drawing',map:'hang-dong',n:3,label:'Hình vẽ',col:'#ffd27a',hint:'Tìm 3 hình vẽ bằng than trên vách hang (điểm sáng)',say:['Một hình con mèo, nét run run…','Hình một ngôi nhà có ba người nắm tay.','Mặt trời và con lạc đà, góc dưới ký chữ "An"!']},
  'tc-q03':{k:'find',obj:'camel',map:'sa-mac',n:3,back:1,label:'Lạc đà',col:'#f0c070',hint:'Tìm từng con lạc đà lạc rồi dắt về chỗ Trưởng đoàn buôn',say:['Bắt được một con lạc đà! Dắt về cho trưởng đoàn.','Con thứ hai đây rồi!','Con cuối cùng, nó đang gặm bụi gai.']},
  'tc-q04':{k:'find',obj:'foot',map:'nui-tuyet',n:6,seq:1,label:'Dấu chân',col:'#e8f4ff',hint:'Đi theo hàng dấu chân nhỏ trên tuyết',say:['Dấu chân nhỏ, cỡ chân trẻ con…','Dấu chân lẫn với vết vó ngựa.','Có chỗ dấu chân dừng lại, như em đứng khóc.','Dấu chân rẽ về phía rừng.','Một vệt kéo lê…','Chiếc khăn quàng đỏ vướng trên cành cây!']},
  'tc-q06':{k:'seq',title:'Lối qua đầm',hint:'Nhớ thứ tự các phiến đá nổi lên rồi bước lại',rounds:[3,5,7],n:6},
  'tc-q08':{k:'escort',map:'co-loa',dist:11,hint:'Dắt bà lão tới chỗ cắm cờ, đừng bỏ bà quá xa',say:'Cảm ơn con, bà qua được đường rồi!'},
  'tc-q10':{k:'find',obj:'ice',map:'nui-lua',n:3,back:1,t:60,label:'Khối băng',col:'#9fe0ff',hint:'Lấy khối băng (điểm sáng xanh), mang về lò rèn trước khi tan',say:['Khối băng lạnh buốt tay — mau mang về lò!','Khối thứ hai!','Khối cuối cùng!']},
  'tc-q12':{k:'pick',title:'Câu đố của Băng Hoàng',restart:1,hint:'Trả lời đúng cả ba câu đố',qs:[
    ['Mình trong như ngọc, nắng lên thì khóc, khóc mãi thì mất. Là gì?',['Khối băng','Tấm gương','Sương mù','Hạt ngọc'],0],
    ['Trắng như bông, rơi không tiếng, phủ đầy đồng mà chẳng ai gieo trồng. Là gì?',['Mây','Tuyết','Muối','Hoa bưởi'],1],
    ['Không chân mà chạy, gặp lạnh thì dừng, đứng lại hóa đá, nắng lên lại đi. Là gì?',['Gió','Cát','Nước','Mây'],2]]},
  'tc-q13':{k:'pick',title:'Bảng tin kinh thành',hint:'Đọc bảng tin, chỉ ra kẻ bắt cóc',qs:[
    ['Lệnh truy nã: kẻ bắt cóc mang theo một con ấn đá, có mặt ở bến thuyền đêm rằm và không ai làm chứng cho hắn.\n\nA. Lão bán cá — ở bến thuyền đêm rằm; cả chợ cá làm chứng lão ngồi bán tới sáng.\nB. Thầy đồ họ Lê — trong tráp có một con ấn đá; đêm rằm dạy học, học trò làm chứng.\nC. Gã buôn vải mặt sẹo — ở bến thuyền đêm rằm; tay nải có một con ấn đá; không ai biết gã ngủ đâu.\nD. Bà hàng nước — không mang ấn; đêm rằm ở quán, khách quen làm chứng.\n\nKẻ bắt cóc là ai?',['A. Lão bán cá','B. Thầy đồ họ Lê','C. Gã buôn vải mặt sẹo','D. Bà hàng nước'],2]]},
  'tc-q14':{k:'pick',title:'Chín tầng lầu',hint:'Đáp câu đố chữ ở từng tầng',qs:[
    ['Tầng 1 · Con gì đầu dê mình ốc?',['Con dốc','Con dê','Con ốc','Con sên'],0],
    ['Tầng 2 · Bỏ ngoài nướng trong, ăn ngoài bỏ trong. Là gì?',['Củ khoai','Bắp ngô','Quả trứng','Hạt dẻ'],1],
    ['Tầng 3 · Con gì mang cả cái nhà đi khắp nơi?',['Con rùa','Con cua','Con ốc sên','Con nhím'],2],
    ['Tầng 4 · Cái gì luôn đến mà không bao giờ tới?',['Ngày mai','Cơn mưa','Mùa xuân','Con thuyền'],0],
    ['Tầng 5 · Cái gì của bạn nhưng người khác dùng nhiều hơn bạn?',['Cái bút','Tên của bạn','Đôi dép','Cái bát'],1],
    ['Tầng 6 · Cái gì có cổ mà không có đầu?',['Con rắn','Cây cột','Cái chai','Cái nón'],2],
    ['Tầng 7 · Mua về màu đen, dùng thì đỏ, bỏ đi thì xám. Là gì?',['Than','Mực','Sắt','Gạch'],0],
    ['Tầng 8 · Trong ba chữ Nhất, Nhị, Tam, chữ nào nhiều nét nhất?',['Nhất','Tam','Nhị','Bằng nhau'],1],
    ['Tầng 9 · Càng lấy đi càng to ra. Là gì?',['Cái giếng','Cái hố','Đống rơm','Bao gạo'],1]]},
  'tc-q15':{k:'cards',title:'Con trai ngậm ngọc',hint:'Lật thẻ tìm đủ 6 cặp hình',icons:['water','flame','wood','metal','earth','light']},
  'tc-q17':{k:'rhythm',title:'Thả diều theo gió',hint:'Bấm đúng lúc vạch gió chạy vào ô sáng',beats:5,miss:1,col:'#9fe0ff'},
  'tc-q18':{k:'pick',title:'Kẻ nội gián',hint:'Chọn người lính nói thật',qs:[
    ['Ba người lính canh cổng, chỉ đúng một người nói thật.\n\nLính thứ nhất: "Lính thứ hai nói dối."\nLính thứ hai: "Lính thứ ba nói dối."\nLính thứ ba: "Cả hai người kia đều nói dối."\n\nAi nói thật?',['Lính thứ nhất','Lính thứ hai','Lính thứ ba'],1]]},
  'tc-q19':{k:'order',title:'Sổ sinh tử',hint:'Xếp năm trang sổ theo thứ tự can',items:['Giáp','Ất','Bính','Đinh','Mậu'],pre:'Trang '},
  'tc-q21':{k:'pick',title:'Hồ ly giả dạng',hint:'Nhìn bóng in trên vách, chỉ ra hồ ly',qs:[
    ['Bốn người lần lượt đứng cạnh ngọn đèn, bóng in trên vách đá:\n\nBác tiều phu — bóng vác rìu trên vai.\nCô hái thuốc — bóng tóc dài, sau lưng phe phẩy chín ngọn như đuôi.\nChú bé chăn trâu — bóng đội nón, tay cầm sáo.\nBà cụ — bóng lưng còng, chống gậy.\n\nAi là hồ ly?',['Bác tiều phu','Cô hái thuốc','Chú bé chăn trâu','Bà cụ'],1]]},
  'tc-q22':{k:'rhythm',title:'Chày giã thuốc',hint:'Giã theo nhịp chày của Thỏ Ngọc',beats:8,miss:1,col:'#f0f0ff'},
  'tc-q23':{k:'order',title:'Lễ dâng ấn',hint:'Làm lễ theo đúng thứ tự',items:['Dâng hương','Rót rượu','Đặt ấn','Đọc sớ']},
  'tc-q25':{k:'find',obj:'thread',map:'hu-khong',n:5,seq:1,label:'Chỉ đỏ',col:'#ff5a6a',hint:'Lần theo sợi chỉ đỏ buộc ở các khe nứt',say:['Một sợi chỉ đỏ buộc ở khe nứt…','Sợi thứ hai, thắt nút kiểu An hay thắt.','Sợi thứ ba.','Sợi thứ tư, đã sờn.','Sợi cuối cùng, cạnh khe nứt tỏa hơi đỏ!']},
  'tc-q26':{k:'order',title:'Thuyền giấy',hint:'Xếp chữ trên năm chiếc thuyền giấy thành câu',items:['Bố ơi,','con','ở','Cổ','Chiến Trường']},
  'tc-q27':{k:'cond',hint:'Đoạt cờ soái giữa doanh trại địch (đứng cạnh cờ vài giây)'},
  'tc-q28':{k:'cups',title:'Úp sọ',hint:'Đoán đúng cái sọ giấu chuỗi hạt 3 lần liền',n:3,need:3,thing:'Chuỗi hạt',col:'#e0c080'},
  'tc-q29':{k:'cond',hint:'Thắng đủ 10 danh tướng trên võ đài (nói với Trọng tài)'},
  'tc-q30':{k:'pick',title:'Kiếm chọn chủ',hint:'Đọc bia đá, tìm thanh kiếm khắc tên An',qs:[
    ['Bia đá khắc ba dòng:\n1. Kiếm của An không phải thanh dài nhất.\n2. Chuôi kiếm quấn dây đỏ.\n3. Lưỡi kiếm khắc hình mặt trời.\n\nThanh nào?',['Kiếm dài nhất · dây đỏ · mặt trời','Kiếm ngắn · dây xanh · mặt trời','Kiếm vừa · dây đỏ · mặt trăng','Kiếm vừa · dây đỏ · mặt trời','Kiếm ngắn · dây đỏ · ngôi sao','Kiếm ngắn · dây vàng · mặt trời'],3]]},
  'tc-q31':{k:'lights',title:'Cân băng hỏa',hint:'Làm chín cột cùng một màu'},
  'tc-q32':{k:'cups',title:'Đèn hồn của con',hint:'Theo dõi chiếc đèn màu khăn đỏ, chỉ đúng 3 lần liền',n:4,need:3,thing:'Đèn hồn',col:'#ff6a6a',lamp:1},
  'tc-q33':{k:'order',title:'Ghép bốn ấn',hint:'Đặt ấn theo vòng Đông → Nam → Tây → Bắc',items:['Thanh Điền','Xương Hoá','Ba Lâm','Thọ Sơn'],pre:'Ấn '},
  'tc-q34':{k:'cond',hint:'Cứu An ở Hỗn Nguyên Điện rồi đưa con về làng Thanh Mộc'}
};
// Bảng trò nhỏ: host = {openModal, closeModal, svg, esc, ttl}; play(Q, spec, onWin)
function LH_TroChoi(host){
  const {openModal,svg,esc,ttl}=host,$=s=>document.querySelector(s),snd=k=>{try{LH_Audio.play(k);}catch(e){}};
  const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const txt=s=>esc(s).replace(/\n/g,'<br>');
  let token=0;const alive=t=>t===token&&!$('#overlay').hidden&&$('#tcBox');
  const frame=(Q,S,inner)=>openModal(ttl('heart',esc(S.title||Q.name)),`<div class="tc-box" id="tcBox"><small class="sel-desc">${esc(S.hint||'')}</small>${inner}<div class="tc-msg" id="tcMsg"></div></div>`);
  const say=(m,bad)=>{const e=$('#tcMsg');if(e){e.innerHTML=m;e.className='tc-msg'+(bad?' bad':' ok');}};
  const G={
    pick(Q,S,win,t){let k=0;const draw=()=>{const [q,o,a]=S.qs[k],ord=shuf(o.map((x,i)=>i));
      $('#tcArea').innerHTML=`<div class="tc-step">${S.qs.length>1?`Câu ${k+1}/${S.qs.length}`:''}</div><p class="tc-q">${txt(q)}</p><div class="tc-opts">${ord.map(i=>`<button data-i="${i}">${esc(o[i])}</button>`).join('')}</div>`;
      $('#tcArea').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{if(!alive(t))return;if(+b.dataset.i===a){snd('pickup');k++;if(k>=S.qs.length)return win();say(svg('check')+'Đúng rồi!');draw();}
        else{snd('enhanceFail');if(S.restart){k=0;say(svg('close')+'Sai rồi! Đố lại từ đầu.',1);}else say(svg('close')+'Sai rồi, nghĩ thêm chút nữa.',1);draw();}});};
      draw();},
    seq(Q,S,win,t){let r=0,seq=[],got=0,lock=true;const n=S.n||6;
      $('#tcArea').innerHTML=`<div class="tc-step" id="tcStep"></div><div class="tc-stones">${Array.from({length:n},(_,i)=>`<button data-i="${i}"></button>`).join('')}</div><button class="primary" id="tcGo">${svg('next')}Xem đá nổi</button>`;
      const st=[...$('#tcArea').querySelectorAll('[data-i]')],lit=(i,on)=>st[i].classList.toggle('on',on);
      const show=async()=>{lock=true;$('#tcGo').hidden=true;seq=Array.from({length:S.rounds[r]},()=>Math.floor(Math.random()*n));got=0;$('#tcStep').textContent=`Lượt ${r+1}/${S.rounds.length} · ${seq.length} phiến đá`;
        await new Promise(z=>setTimeout(z,500));for(const i of seq){if(!alive(t))return;lit(i,true);snd('ui');await new Promise(z=>setTimeout(z,520));lit(i,false);await new Promise(z=>setTimeout(z,180));}
        lock=false;say(svg('next')+'Bước lại đúng thứ tự!');};
      st.forEach(b=>b.onclick=()=>{if(lock||!alive(t))return;const i=+b.dataset.i;lit(i,true);setTimeout(()=>lit(i,false),180);
        if(i!==seq[got]){snd('enhanceFail');lock=true;r=0;say(svg('close')+'Trượt chân rơi xuống bùn! Làm lại từ đầu.',1);$('#tcGo').hidden=false;return;}
        got++;if(got>=seq.length){snd('pickup');r++;if(r>=S.rounds.length)return win();say(svg('check')+'Qua được một đoạn!');lock=true;$('#tcGo').hidden=false;}});
      $('#tcGo').onclick=show;},
    cards(Q,S,win,t){const ic=S.icons,deck=shuf([...ic,...ic]);let open=[],done=0,lock=false,moves=0;
      $('#tcArea').innerHTML=`<div class="tc-step" id="tcStep">Đã mở 0/${ic.length} cặp</div><div class="tc-cards">${deck.map((x,i)=>`<button data-i="${i}"><span>${svg(x)}</span></button>`).join('')}</div>`;
      const bs=[...$('#tcArea').querySelectorAll('[data-i]')];
      bs.forEach(b=>b.onclick=()=>{if(lock||!alive(t)||b.classList.contains('up'))return;b.classList.add('up');open.push(b);if(open.length<2)return;moves++;
        const [a,c]=open;if(deck[+a.dataset.i]===deck[+c.dataset.i]){a.classList.add('ok');c.classList.add('ok');open=[];done++;snd('pickup');$('#tcStep').textContent=`Đã mở ${done}/${ic.length} cặp · ${moves} lượt lật`;if(done>=ic.length)setTimeout(()=>alive(t)&&win(),400);}
        else{lock=true;setTimeout(()=>{a.classList.remove('up');c.classList.remove('up');open=[];lock=false;},700);}});},
    rhythm(Q,S,win,t){let beat=0,miss=0,pos=0,dir=1,zone=0,last=0,raf=0;const sp0=.55;
      $('#tcArea').innerHTML=`<div class="tc-step" id="tcStep"></div><div class="tc-bar"><i class="z" id="tcZ"></i><i class="c" id="tcC"></i></div><button class="primary big-btn" id="tcHit">${svg('next')}Bấm!</button>`;
      const newZone=()=>{zone=.12+Math.random()*.6;$('#tcZ').style.left=(zone*100)+'%';$('#tcStep').textContent=`Nhịp ${beat}/${S.beats} · trượt ${miss}/${(S.miss||1)+1}`;};
      const loop=ts=>{if(!alive(t))return;const dt=last?Math.min(.05,(ts-last)/1000):0;last=ts;pos+=dir*dt*(sp0+beat*.06);if(pos>1){pos=1;dir=-1;}if(pos<0){pos=0;dir=1;}$('#tcC').style.left=(pos*100)+'%';raf=requestAnimationFrame(loop);};
      const hit=()=>{if(!alive(t))return;if(pos>=zone&&pos<=zone+.16){beat++;snd('anvil');$('#tcZ').classList.add('hit');setTimeout(()=>{const z=$('#tcZ');z&&z.classList.remove('hit');},150);if(beat>=S.beats){cancelAnimationFrame(raf);return win();}say(svg('check')+'Đúng nhịp!');}
        else{miss++;snd('enhanceFail');if(miss>(S.miss||1)){beat=0;miss=0;say(svg('close')+'Trượt nhịp! Làm lại từ đầu.',1);}else say(svg('close')+'Trượt rồi, chú ý ô sáng!',1);}newZone();};
      $('#tcHit').onclick=hit;const key=e=>{if(!alive(t)){removeEventListener('keydown',key);return;}if(e.code==='Space'||e.key==='Enter'){e.preventDefault();hit();}};addEventListener('keydown',key);
      newZone();raf=requestAnimationFrame(loop);},
    cups(Q,S,win,t){const n=S.n||3;let streak=0,pos=[...Array(n).keys()],has=0,lock=true;
      $('#tcArea').innerHTML=`<div class="tc-step" id="tcStep"></div><div class="tc-cups" style="--n:${n}">${Array.from({length:n},(_,i)=>`<button data-i="${i}" class="${S.lamp?'lamp':''}"><b></b></button>`).join('')}</div><button class="primary" id="tcGo">${svg('next')}Bắt đầu đảo</button>`;
      const cs=[...$('#tcArea').querySelectorAll('[data-i]')],place=()=>cs.forEach((c,i)=>c.style.left=`calc(${pos[i]} * (100% / ${n}))`);
      const reveal=on=>cs.forEach((c,i)=>c.classList.toggle('show',on&&i===has));
      const step=()=>{$('#tcStep').textContent=`Đúng liền ${streak}/${S.need}`;};
      const go=async()=>{lock=true;$('#tcGo').hidden=true;has=Math.floor(Math.random()*n);reveal(true);await new Promise(z=>setTimeout(z,900));reveal(false);await new Promise(z=>setTimeout(z,300));
        const k=5+streak*2,ms=Math.max(240,480-streak*90);for(let s=0;s<k;s++){if(!alive(t))return;const a=Math.floor(Math.random()*n);let b=Math.floor(Math.random()*(n-1));if(b>=a)b++;const ia=pos.indexOf(a),ib=pos.indexOf(b);pos[ia]=b;pos[ib]=a;place();await new Promise(z=>setTimeout(z,ms));}
        lock=false;say(svg('eye')+`${esc(S.thing)} ở đâu?`);};
      cs.forEach((c,i)=>{c.style.transition='left .22s';c.onclick=()=>{if(lock||!alive(t))return;lock=true;reveal(true);
        if(i===has){streak++;snd('pickup');if(streak>=S.need)return setTimeout(()=>alive(t)&&win(),600);say(svg('check')+'Đúng rồi!');}
        else{streak=0;snd('enhanceFail');say(svg('close')+'Sai rồi! Đếm lại từ đầu.',1);}
        step();$('#tcGo').hidden=false;};});
      place();step();$('#tcGo').onclick=go;},
    lights(Q,S,win,t){let g=Array(9).fill(0);const flip=i=>{const x=i%3,y=(i/3)|0;for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<3&&ny>=0&&ny<3)g[ny*3+nx]^=1;}};
      const fresh=()=>{g=Array(9).fill(0);do{for(let k=0;k<4;k++)flip(Math.floor(Math.random()*9));}while(g.every(v=>v===g[0]));};fresh();
      $('#tcArea').innerHTML=`<div class="tc-step" id="tcStep">Chạm một cột: nó và các cột kề đổi băng / lửa</div><div class="tc-lights">${g.map((_,i)=>`<button data-i="${i}"></button>`).join('')}</div><button id="tcRe">${svg('whirl')}Xếp lại</button>`;
      const bs=[...$('#tcArea').querySelectorAll('[data-i]')],draw=()=>bs.forEach((b,i)=>{b.className=g[i]?'fire':'ice';b.innerHTML=svg(g[i]?'flame':'ice');});
      bs.forEach(b=>b.onclick=()=>{if(!alive(t))return;flip(+b.dataset.i);snd('ui');draw();if(g.every(v=>v===g[0])){snd('pickup');setTimeout(()=>alive(t)&&win(),400);}});
      $('#tcRe').onclick=()=>{fresh();draw();};draw();},
    order(Q,S,win,t){const it=S.items;let k=0;
      $('#tcArea').innerHTML=`<div class="tc-slots" id="tcSlots">${it.map(()=>'<i></i>').join('')}</div><div class="tc-opts">${shuf(it.map((x,i)=>i)).map(i=>`<button data-i="${i}">${esc((S.pre||'')+it[i])}</button>`).join('')}</div>`;
      const sl=[...$('#tcSlots').children],bs=[...$('#tcArea').querySelectorAll('[data-i]')];
      bs.forEach(b=>b.onclick=()=>{if(!alive(t)||b.disabled)return;const i=+b.dataset.i;
        if(i===k){sl[k].textContent=(S.pre||'')+it[i];sl[k].className='on';b.disabled=true;k++;snd('pickup');if(k>=it.length)return setTimeout(()=>alive(t)&&win(),300);say('');}
        else{snd('enhanceFail');k=0;sl.forEach(s=>{s.textContent='';s.className='';});bs.forEach(x=>x.disabled=false);say(svg('close')+'Sai thứ tự! Xếp lại từ đầu.',1);}});}
  };
  return function play(Q,S,onWin){
    const t=++token;frame(Q,S,`<div id="tcArea"></div>`);
    G[S.k](Q,S,()=>{if(!alive(t))return;token++;snd('quest');onWin();},t);
  };
}
