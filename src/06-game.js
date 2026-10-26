/* ================= VÒNG LẶP GAME (gọi startGame sau khi chọn nhân vật) ================= */
window.startGame=(session)=>{
  'use strict';
  const canvas=document.getElementById('scene');let ctx=canvas.getContext('2d'); // v10.66: let — tạm trỏ sang canvas đệm khi vẽ ảnh cảnh vật
  const mini=document.getElementById('minimap'),mx=mini.getContext('2d'),overlayEl=document.getElementById('overlay'),dialogEl=document.getElementById('dialog');
  const T=World.T,EL=Player.ELEMENTS,PI2=Math.PI*2,CFG=Player.CFG,MON=Player.MON;
  const player=session.player;
  let W=World.W,H=World.H,grid=World.grid;
  const hero={...World.spawn,map:World.id,name:player.name,facing:1,moving:false,walk:0,aim:{x:1,y:0},attack:null,swing:0,blockUntil:0,barrierUntil:0,hurt:-9,lastHurt:-9,invuln:0,dead:0,mountAct:null,shieldHp:0,shieldAt:0,hasteUntil:0,counter:false,reviveAt:0,waveCount:0};
  if(session.pos)Object.assign(hero,session.pos);
  const camera={x:0,y:0},keys=new Set(),seen=new Set(session.seen||[]),projectiles=[],particles=[],floaters=[],fx=[];
  // quái của bản đồ đang đứng (đổi bản đồ thì dựng lại)
  const makeMonsters=()=>World.monsterSpawns.filter(s=>MON[s.type]).map((s,i)=>{const x=(s.x+.5)*T,y=(s.y+.5)*T;return {id:i,type:s.type,hx:x,hy:y,x,y,hp:MON[s.type].hp,max:MON[s.type].hp,dead:false,deadAt:0,respawn:0,facing:-1,walk:0,moving:false,hurt:-9,aggro:-9,atk:null,cd:0,flee:0,wander:null,stunUntil:0,burn:null,burnAcc:0,leapCd:0,leap:null};});
  const monsters=makeMonsters();
  // v10.12: ảnh quái, NPC của bản đồ tải sớm khi vào (ảnh khác chỉ tải lúc cần vẽ)
  const warmMap=()=>{try{LH_IMG.warm([...new Set(monsters.map(m=>'quai:'+m.type)),...World.npcs.map(n=>'npc:'+n.id),...World.npcs.map(n=>'npc:'+(n.role||''))]);}catch(e){}};warmMap();
  const ATK={
    punch:{dur:.32,hit:.5,range:50,arc:1.3,dmg:.55,kind:'melee',knock:40},
    sword:{dur:.46,hit:.45,range:76,arc:2.0,dmg:1,kind:'melee',knock:45},
    shield:{dur:.48,hit:.45,range:58,arc:1.3,dmg:.7,kind:'melee',knock:110},
    spear:{dur:.56,hit:.5,range:112,width:26,dmg:1.15,kind:'thrust',knock:60},
    saber:{dur:.52,hit:.47,range:82,arc:2.45,dmg:1.25,kind:'melee',knock:70}, // v10.14: đao — chém rộng, nặng tay
    mace:{dur:.64,hit:.5,range:66,arc:1.75,dmg:1.45,kind:'melee',knock:130,stun:15}, // v10.14: chùy — đẩy lùi mạnh, 15% choáng
    staff:{dur:.62,hit:.56,speed:400,dmg:1.05,kind:'orb',range:420,splash:46},
    bow:{dur:.7,hit:.62,speed:640,dmg:1.1,kind:'arrow',range:520},
    crossbow:{dur:.85,hit:.22,speed:880,dmg:1.3,kind:'bolt',range:600,pierce:1}
  };
  // Lấy sát thương, tầm đánh, độ lan, tốc đánh theo bảng loại vũ khí (Sheet vu_khi)
  for(const [k,d] of Object.entries(ATK)){const w=Player.WEAPONS[k];if(!w)continue;d.dmg=w.dmg;d.range=w.range;d.dur=w.dur;
    if(d.kind==='melee'&&w.spread)d.arc=w.spread*Math.PI/180;else if(d.kind==='thrust'&&w.spread)d.width=w.spread;else if(d.kind==='orb')d.splash=w.spread;else if(d.kind==='bolt')d.pierce=Math.round(w.spread);}
  // 4 kỹ năng mặc định: đánh thường · combo (3 đòn) · diện rộng · liên hoàn (5 đòn + nổ)
  const SK={normal:{mul:1,dur:1,cycles:1},basic:{mul:.85,dur:.7,cycles:3},intermediate:{mul:1.15,dur:1.2,cycles:1,multi:3,nova:130},advanced:{mul:.75,dur:.55,cycles:5,nova:160,finale:2}};
  let width=0,height=0,scale=1,route=[],targetNPC=null,targetWell=null,dialogNPC=null,page=0,last=0,time=0,toastTimer,joystick={x:0,y:0},holdAttack=false,mouseAim=null,shakeAmp=0,manaWarnAt=-9;
  let sceneTick=0,lastAllyKey='',safe=World.isSafe(hero.x,hero.y),HD=Player.derive(player,{safe}),hdAt=-1,bridgeSide=[],travelling=false;
  const ground=document.createElement('canvas'),miniGround=document.createElement('canvas');
  hero.name=player.name;
  const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,seg=(p,a,b)=>clamp((p-a)/(b-a),0,1),E=t=>t<.5?2*t*t:1-((-2*t+2)**2)/2;
  const svg=id=>`<svg class="icon"><use href="#i-${id}"/></svg>`;
  // Thông báo ngắn: icon + vài chữ/số
  function message(html,sec){$('#toast').innerHTML=html;$('#toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.opacity=0,(sec||2.4)*1000);}
  const esc=t=>String(t).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);
  // Ảnh tĩnh (Sheet hinh_anh) vẽ thay hình mặc định: chân chạm gốc, quay mặt sang phải
  function drawPic(c,im,h,bob){const w=h*im.naturalWidth/im.naturalHeight;c.drawImage(im,-w/2,-h+bob,w,h);}
  function roundRect(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  function ell(c,x,y,rx,ry,color,rot=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,rot,0,PI2);c.fill();}
  function line(c,pts,color,w){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.stroke();}
  function poly(c,pts,color){c.fillStyle=color;c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.closePath();c.fill();}
  const busy=()=>!!dialogNPC||!overlayEl.hidden;

  /* ---------- Nền: đường đất, sân gạch, ruộng lúa, ao sen ---------- */
  function groundDraw(){
    ground.width=W*T;ground.height=H*T;const c=ground.getContext('2d');
    // Bản đồ có bộ nền riêng (sa mạc, tuyết, hang…): vẽ từng ô bằng hình vẽ của gói bản đồ
    const TH=World.theme&&LH_ART.theme[World.theme];
    if(TH){const B=World.base,G=(x,y)=>x<0||y<0||x>=W||y>=H?1:B[y][x];for(let y=0;y<H;y++)for(let x=0;x<W;x++)TH.tile(c,x,y,B[y][x],(x*37+y*71)%9,T,G);if(TH.over)TH.over(c,World.def,T,G);}
    else for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const v=grid[y][x],n=(x*37+y*71)%9,east=v===5;
      c.fillStyle=v===2?'#4f7f74':v===3?'#a68a52':v===4?['#b99a68','#b4955f','#bd9f6d'][n%3]:v===6?['#8fae63','#93b266'][n%2]:east?['#a6a56c','#aaa771','#a1a067','#aeab75'][n%4]:['#7f9a5e','#829d61','#7b965b','#86a064'][n%4];
      c.fillRect(x*T,y*T,T,T);
      if(v===2){c.fillStyle='#5e9083';c.fillRect(x*T+8,y*T+14,17,2);c.fillRect(x*T+25,y*T+37,12,2);}
      else if(v===4){c.strokeStyle='#9c7f5233';c.lineWidth=2;c.beginPath();c.moveTo(x*T,y*T+16);c.lineTo(x*T+T,y*T+16);c.moveTo(x*T,y*T+34);c.lineTo(x*T+T,y*T+34);c.stroke();if(n===2){c.fillStyle='#9c8256';c.fillRect(x*T+30,y*T+9,4,3);}}
      else if(v===6){ // lúa: hàng mạ + bờ ruộng
        c.fillStyle='#6f9a8a55';c.fillRect(x*T,y*T,T,T);
        c.strokeStyle='#4f7a36';c.lineWidth=1.6;for(let ry=6;ry<T;ry+=10)for(let rx=5;rx<T;rx+=9){c.beginPath();c.moveTo(x*T+rx,y*T+ry+5);c.lineTo(x*T+rx-2,y*T+ry);c.moveTo(x*T+rx,y*T+ry+5);c.lineTo(x*T+rx+2,y*T+ry);c.stroke();}
        c.fillStyle='#9c8a5c';if(x%3===0)c.fillRect(x*T,y*T,4,T);if(y%2===1)c.fillRect(x*T,y*T+T-4,T,4);
      }
      else if(east){c.strokeStyle='#86844f88';c.lineWidth=1.4;for(let k=0;k<3;k++){const gx=x*T+(n*7+k*13)%44,gy=y*T+(n*11+k*17)%44;c.beginPath();c.moveTo(gx,gy+6);c.lineTo(gx+2,gy);c.moveTo(gx+3,gy+6);c.lineTo(gx+6,gy+1);c.stroke();}}
      else{
        c.strokeStyle='#6a8a5288';c.lineWidth=1.2;for(let k=0;k<3;k++){const gx=x*T+(n*7+k*13)%44,gy=y*T+(n*11+k*17)%42;c.beginPath();c.moveTo(gx,gy+5);c.lineTo(gx+1.5,gy);c.moveTo(gx+3,gy+5);c.lineTo(gx+5,gy+1);c.stroke();}
        if(v===0&&(x*13+y*7)%17===0){const cols=['#f2d16b','#e98aa0','#f4f0e6'];for(let k=0;k<4;k++){const fx2=x*T+10+(k*11+n*5)%28,fy2=y*T+12+(k*7+n*3)%24;c.fillStyle=cols[(k+n)%3];c.beginPath();c.arc(fx2,fy2,2,0,PI2);c.fill();}}
      }
    }
    // Trang trí theo dữ liệu bản đồ: ao sen, sân gạch, cầu tre
    for(const d of World.decor){
      if(d.kind==='pond'){const n=Math.round(14*d.w*d.h/12);for(let i=0;i<n;i++){const px=d.x*T+12+(i*37)%Math.max(10,d.w*T-18),py=d.y*T+12+(i*53)%Math.max(10,d.h*T-22);c.fillStyle='#3f7a46';c.beginPath();c.arc(px,py,9+(i%3)*2,.4,PI2-.2);c.lineTo(px,py);c.fill();if(i%3===0){c.fillStyle='#f0a6bd';c.beginPath();for(let k=0;k<5;k++){const a=k*1.256;c.ellipse(px+3+Math.cos(a)*3,py-3+Math.sin(a)*3,3,2,a,0,PI2);}c.fill();ell(c,px+3,py-3,2,2,'#f6e27a');}}
        c.strokeStyle='#6b5a3c';c.lineWidth=3;c.strokeRect(d.x*T-2,d.y*T-2,d.w*T+4,d.h*T+4);}
      else if(d.kind==='plaza'){const sx0=d.x*T,sy0=d.y*T,sw=d.w*T,sh=d.h*T;c.fillStyle='#b5674a';c.fillRect(sx0,sy0,sw,sh);
        c.strokeStyle='#97513a';c.lineWidth=1.5;for(let gx=sx0;gx<=sx0+sw;gx+=24){c.beginPath();c.moveTo(gx,sy0);c.lineTo(gx,sy0+sh);c.stroke();}for(let gy=sy0;gy<=sy0+sh;gy+=24){c.beginPath();c.moveTo(sx0,gy);c.lineTo(sx0+sw,gy);c.stroke();}
        c.strokeStyle='#7d4330';c.lineWidth=4;c.strokeRect(sx0,sy0,sw,sh);}
    }
    for(const B of World.bridges){
      const bx0=B.x0*T,bx1=(B.x1+1)*T,by0=B.y0*T,by1=(B.y1+1)*T;
      c.fillStyle='#a68a52';c.fillRect(bx0,by0,bx1-bx0,by1-by0);
      c.strokeStyle='#7f6a3c';c.lineWidth=2;for(let x=bx0;x<=bx1;x+=7){c.beginPath();c.moveTo(x,by0);c.lineTo(x,by1);c.stroke();}
      for(const ry of [by0-3,by1-3]){c.fillStyle='#b9a75a';c.fillRect(bx0,ry,bx1-bx0,5);c.fillStyle='#8a7a3c';for(let x=bx0;x<bx1;x+=32)c.fillRect(x,ry,2,5);}
      c.fillStyle='#7a6a34';for(let x=bx0;x<=bx1;x+=T){c.fillRect(x-3,by0-8,6,12);c.fillRect(x-3,by1-6,6,12);}
    }
    // Cổng sang bản đồ khác
    for(const P of World.portals){const x0=P.x*T,y0=P.y*T,w=(P.w||1)*T,h=(P.h||1)*T;const g=c.createRadialGradient(x0+w/2,y0+h/2,4,x0+w/2,y0+h/2,Math.max(w,h)*.7);g.addColorStop(0,'#fff2c066');g.addColorStop(1,'#fff2c000');c.fillStyle=g;c.fillRect(x0-T/2,y0-T/2,w+T,h+T);c.strokeStyle='#e7c46a';c.lineWidth=3;c.setLineDash([8,6]);c.strokeRect(x0+3,y0+3,w-6,h-6);c.setLineDash([]);}
    miniGround.width=mini.width;miniGround.height=mini.height;miniGround.getContext('2d').drawImage(ground,0,0,mini.width,mini.height);
  }
  /* ---------- v10.66: chế độ hiệu năng tự động cho máy yếu ----------
     lv 0 = đầy đủ · 1 = tiết kiệm (vẽ ở tối đa 1,25 điểm ảnh / px, bỏ bóng mờ (shadowBlur), bớt hạt) · 2 = cực tiết kiệm (vẽ ở 0,8 px, bỏ gợn nước, bớt tuyết / cát, bỏ filter).
     Đo thời gian mỗi khung hình (trung bình trượt): quá 30 ms (dưới ~33 fps) thì hạ một bậc; dưới 12 ms suốt 30 giây thì nâng lại. Nhớ bậc vào localStorage để lần sau vào đúng ngay.
     window.LH_PERF.set(lv) để ép tay (bảng Tình trạng). */
  const PERF={lv:0,ema:0,n:0,changed:0,down:0,shadow:false};
  try{PERF.lv=Math.max(0,Math.min(2,Math.floor(Number(localStorage.getItem('lh-perf'))||0)));}catch(e){}
  const perfDpr=()=>{const d=devicePixelRatio||1,small=(canvas.getBoundingClientRect().width||innerWidth)<700;return PERF.lv===0?Math.min(2,d):PERF.lv===1?Math.min(1.25,d):Math.min(1,d)*(small?1:.8);}; // màn nhỏ (điện thoại) giữ 1 px / px cho chữ còn đọc được
  const PQ=()=>[1,.6,.35][PERF.lv]; // hệ số số hạt
  function perfApply(save){
    const noShadow=PERF.lv>=1;
    if(noShadow!==PERF.shadow){PERF.shadow=noShadow;
      if(noShadow){ctx.shadowBlur=0;Object.defineProperty(ctx,'shadowBlur',{configurable:true,get(){return 0;},set(){}});if(PERF.lv>=2)Object.defineProperty(ctx,'filter',{configurable:true,get(){return 'none';},set(){}});}
      else{delete ctx.shadowBlur;delete ctx.filter;}}
    if(PERF.lv>=2&&!Object.getOwnPropertyDescriptor(ctx,'filter'))Object.defineProperty(ctx,'filter',{configurable:true,get(){return 'none';},set(){}});
    if(PERF.lv<2&&Object.getOwnPropertyDescriptor(ctx,'filter'))delete ctx.filter;
    if(save)try{localStorage.setItem('lh-perf',String(PERF.lv));}catch(e){}
    resize();
  }
  function perfSet(lv,manual){lv=Math.max(0,Math.min(2,lv|0));if(lv===PERF.lv&&!manual)return;PERF.lv=lv;PERF.changed=time;PERF.ema=0;PERF.n=0;PERF.win=PERF.slow=PERF.mid=0;if(manual)PERF.manual=true;perfApply(true);}
  // gọi mỗi khung hình với thời gian khung thật (ms)
  function perfTick(raw){
    if(raw<=0||raw>400||document.hidden)return;PERF.n++;PERF.ema=PERF.ema?PERF.ema*.95+raw*.05:raw;
    if(PERF.manual||time-PERF.changed<5)return;
    // cửa sổ 150 khung: quá 60% khung chậm (trên 30 ms) thì hạ bậc; dưới 2% khung chậm suốt 30 giây thì nâng lại
    if(!PERF.win)PERF.winAt=time;PERF.win=(PERF.win||0)+1;if(raw>30)PERF.slow=(PERF.slow||0)+1;if(raw>16.8)PERF.mid=(PERF.mid||0)+1;
    if(PERF.win<150&&!(PERF.win>=30&&time-PERF.winAt>4))return;const slow=PERF.slow/PERF.win,mid=PERF.mid/PERF.win;PERF.win=PERF.slow=PERF.mid=0; // 150 khung, hoặc 4 giây nếu máy quá chậm
    if(slow>.6&&PERF.lv<2){PERF.down=time;perfSet(PERF.lv+1);message(svg('eye')+'Máy chạy chậm · đã chuyển sang chế độ '+(PERF.lv===2?'cực tiết kiệm':'tiết kiệm')+' cho mượt hơn',4);}
    else if(slow<.02&&mid<.2&&PERF.lv>0&&time-PERF.changed>30&&time-PERF.down>90)perfSet(PERF.lv-1);
  }
  window.LH_PERF={get lv(){return PERF.lv;},get ms(){return PERF.ema;},get cpu(){return {update:PERF.ums||0,render:PERF.rms||0,avg:PERF.cnt?PERF.sum/PERF.cnt:0};},reset(){PERF.sum=0;PERF.cnt=0;},get bytes(){return SPR.bytes;},get sprites(){return SPR.map.size+MSPR.size+HSPR.size;},get taint(){return SPR.taint;},set:lv=>{perfSet(lv,true);try{localStorage.setItem('lh-perf-manual','1');}catch(e){}},auto(){PERF.manual=false;PERF.changed=time;PERF.n=0;try{localStorage.removeItem('lh-perf-manual');}catch(e){}},get manual(){return !!PERF.manual;}};
  try{if(localStorage.getItem('lh-perf-manual')==='1')PERF.manual=true;}catch(e){}
  function resize(){const r=canvas.getBoundingClientRect(),d=perfDpr();width=r.width;height=r.height;canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);scale=width<700?.95:1.1;camera.x=clamp(hero.x-width/scale/2,0,Math.max(0,W*T-width/scale));camera.y=clamp(hero.y-height/scale/2,0,Math.max(0,H*T-height/scale));}

  /* ---------- Cây: tre, cau, chuối, đa ---------- */
  function tree(o){
    const x=o.x,y=o.y,v=o.seed%5,sway=Math.sin(time*1.2+o.seed)*2;
    if(o.dry){ell(ctx,x+14,y+5,28,10,'#22392640');roundRect(ctx,x-4,y-34,8,37,3,'#6f5a3c');line(ctx,[x,y-26,x-15,y-44],'#6f5a3c',4);line(ctx,[x,y-30,x+14,y-47],'#6f5a3c',4);ell(ctx,x,y-52,36,11,'#4f6b33');ell(ctx,x-6,y-56,28,9,'#5f7a3e');return;}
    ell(ctx,x+10,y+4,26,9,'#22392640');
    if(v<=2){ // khóm tre
      for(let k=0;k<7;k++){const bx=x-14+k*4.5,h=70+((o.seed*(k+3))%28),lean=(k-3)*3+sway;ctx.strokeStyle=k%2?'#7d9a3c':'#8aa846';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx,y+2);ctx.quadraticCurveTo(bx+lean*.3,y-h*.5,bx+lean,y-h);ctx.stroke();ctx.fillStyle='#5f7a2c';for(let s=1;s<5;s++){const t2=s/5;ctx.fillRect(bx+lean*t2*t2-2,y-h*t2,4,1.5);}
        for(let l=0;l<4;l++){const lx=bx+lean+(l-1.5)*6,ly=y-h+6+l*5;ell(ctx,lx,ly,8,2.4,l%2?'#6f9140':'#86ad4c',(l%2?.5:-.5));}}
      return;
    }
    if(v===3){ // cây cau
      const h=96;ctx.strokeStyle='#8f8a7a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y+2);ctx.quadraticCurveTo(x+4,y-h*.5,x+2+sway,y-h);ctx.stroke();ctx.strokeStyle='#77725f';ctx.lineWidth=1;for(let s=8;s<h;s+=9){ctx.beginPath();ctx.moveTo(x-2,y-s);ctx.lineTo(x+3,y-s);ctx.stroke();}
      const tx=x+2+sway,ty=y-h;for(let f=0;f<7;f++){const a=-Math.PI/2+(f-3)*.5;ctx.strokeStyle=f%2?'#4f7a36':'#5f8a3e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo(tx+Math.cos(a)*22,ty+Math.sin(a)*22-8,tx+Math.cos(a)*34,ty+Math.sin(a)*20+10);ctx.stroke();}
      ctx.fillStyle='#d98a2e';for(let k=0;k<5;k++){ctx.beginPath();ctx.arc(tx-3+(k%3)*3,ty+6+Math.floor(k/3)*4,2.4,0,PI2);ctx.fill();}return;
    }
    // bụi chuối
    roundRect(ctx,x-5,y-30,10,32,4,'#7d9a52');roundRect(ctx,x+7,y-22,8,24,4,'#86a35a');
    for(let f=0;f<6;f++){const a=-Math.PI/2+(f-2.5)*.55+Math.sin(time+f)*.04,len=34;ctx.save();ctx.translate(x+2,y-28);ctx.rotate(a+Math.PI/2);ell(ctx,0,-len/2,7,len/2,f%2?'#6aa040':'#7cb34c');line(ctx,[0,0,0,-len],'#5a8a34',1);ctx.restore();}
  }
  function banyan(o){ // cây đa đầu làng
    const x=o.x,y=o.y;ell(ctx,x+20,y+6,70,18,'#1f322236');
    roundRect(ctx,x-14,y-58,28,62,10,'#6b5a42');line(ctx,[x-14,y,x-26,y+4],'#6b5a42',8);line(ctx,[x+14,y,x+28,y+5],'#6b5a42',8);line(ctx,[x-6,y-50,x-34,y-80],'#6b5a42',9);line(ctx,[x+6,y-52,x+36,y-84],'#6b5a42',9);
    ctx.strokeStyle='#5c4e38';ctx.lineWidth=1.4;for(let r=0;r<9;r++){const rx=x-60+r*15,top=y-86+((r*13)%10);ctx.beginPath();ctx.moveTo(rx,top);ctx.quadraticCurveTo(rx+Math.sin(time+r)*2,top+40,rx+1,top+66+((r*7)%18));ctx.stroke();}
    const blobs=[[-50,-96,40,26],[50,-98,40,26],[0,-118,56,34],[-30,-128,34,24],[34,-130,34,22],[0,-92,60,24]];blobs.forEach(([dx,dy,rx,ry],i)=>ell(ctx,x+dx,y+dy,rx,ry,['#2f5233','#35593a','#3d6340','#457046','#3a6040','#2c4c30'][i]));
    ell(ctx,x-18,y-136,18,10,'#56804f');ell(ctx,x+26,y-120,14,8,'#507a4a');
  }
  function oldWell(o){
    const x=o.x,y=o.y,full=!((player.flags.wells[o.id]||0)>Date.now());
    ell(ctx,x+6,y+4,32,9,'#22392640');
    roundRect(ctx,x-26,y-24,52,26,5,'#a0603c');ctx.strokeStyle='#7a4428';ctx.lineWidth=1;
    for(const yy of [y-15,y-6]){ctx.beginPath();ctx.moveTo(x-26,yy);ctx.lineTo(x+26,yy);ctx.stroke();}
    for(let i=-2;i<=2;i++){const xx=x+i*11+(i%2?5:0);ctx.beginPath();ctx.moveTo(xx,y-24);ctx.lineTo(xx,y-15);ctx.moveTo(xx-5,y-15);ctx.lineTo(xx-5,y-6);ctx.stroke();}
    ell(ctx,x-17,y-3,8,3,'#5f8a4a');ell(ctx,x+15,y-1,7,3,'#6f9a52');ell(ctx,x-22,y-20,4,2,'#6f9a52');
    ell(ctx,x,y-24,26,9,'#7a4a2e');ell(ctx,x,y-24,20,6,full?'#3f8fa8':'#4a3a2a');
    if(full){ell(ctx,x-4+Math.sin(time*2)*4,y-25,7,1.6,'#d6f2ffaa');ell(ctx,x+6+Math.cos(time*1.6)*3,y-23,4,1.2,'#d6f2ff77');}
    else{ell(ctx,x-5,y-23,4,1.5,'#6a5440');ell(ctx,x+6,y-24,3,1.2,'#6a5440');}
    line(ctx,[x-22,y-24,x-22,y-62],'#5a3a24',4);line(ctx,[x+22,y-24,x+22,y-62],'#5a3a24',4);
    poly(ctx,[x-36,y-58,x-30,y-64,x-26,y-74,x+26,y-74,x+30,y-64,x+36,y-58,x+24,y-63,x-24,y-63],'#8d3b2a');
    line(ctx,[x-26,y-74,x+26,y-74],'#5e2418',3);line(ctx,[x-30,y-66,x+30,y-66],'#a8503a',1.2);
    line(ctx,[x-22,y-58,x+22,y-58],'#6b4a2e',3);line(ctx,[x+4,y-58,x+4,full?y-40:y-30],'#c9b07a',1);roundRect(ctx,x-1,full?y-42:y-32,10,8,2,'#7a5a3a');
    ell(ctx,x+36,y-5,10,12,'#7a4a2e');ell(ctx,x+36,y-16,7,2.6,'#3a2418');ell(ctx,x+33,y-9,2,4,'#9a6a46');
  }
  function well(o){if(o.ancient)return oldWell(o);const x=o.x,y=o.y;ell(ctx,x+6,y+4,26,8,'#22392640');roundRect(ctx,x-22,y-24,44,26,6,'#8a8070');ell(ctx,x,y-24,22,8,'#6f6658');ell(ctx,x,y-24,16,5,'#2f4a52');line(ctx,[x-20,y-24,x-20,y-56],'#6b4a2e',3);line(ctx,[x+20,y-24,x+20,y-56],'#6b4a2e',3);line(ctx,[x-24,y-56,x+24,y-56],'#6b4a2e',4);line(ctx,[x,y-56,x,y-36],'#c9b07a',1);roundRect(ctx,x-5,y-38,10,8,2,'#7a5a3a');}

  /* ---------- Nhà kiểu làng Việt: mái ngói cong, mái rạ, vách tre ---------- */
  function thatch(x0,eave,x1,ridge,over,col='#b8954e'){ // mái rạ
    poly(ctx,[x0-over,eave,x0+over*1.4,ridge,x1-over*1.4,ridge,x1+over,eave],col);
    ctx.strokeStyle='#9c7a3c';ctx.lineWidth=1.3;for(let i=0;i<=40;i++){const k=i/40,bx=lerp(x0-over,x1+over,k),tx=lerp(x0+over*1.4,x1-over*1.4,k);ctx.beginPath();ctx.moveTo(bx,eave);ctx.lineTo(lerp(bx,tx,.55),lerp(eave,ridge,.55));ctx.stroke();}
    line(ctx,[x0+over*1.4,ridge,x1-over*1.4,ridge],'#7d5f2e',5);ctx.fillStyle='#d1b06a55';ctx.fillRect(x0-over,eave-6,x1-x0+over*2,4);
  }
  function tileRoof(x0,eave,x1,ridge,over,col='#9a4630'){ // mái ngói, đầu đao cong
    poly(ctx,[x0-over,eave,x0+over,ridge,x1-over,ridge,x1+over,eave],col);
    for(let i=0;i<=36;i++){const k=i/36,bx=lerp(x0-over,x1+over,k),tx=lerp(x0+over,x1-over,k);ctx.strokeStyle=i%2?'#7c3424':'#b25a3e';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(bx,eave);ctx.lineTo(tx,ridge);ctx.stroke();}
    line(ctx,[x0-over,eave,x1+over,eave],'#5e2a1c',4);
    ctx.strokeStyle='#5e2a1c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x0-over+10,eave);ctx.quadraticCurveTo(x0-over-6,eave,x0-over-10,eave-18);ctx.moveTo(x1+over-10,eave);ctx.quadraticCurveTo(x1+over+6,eave,x1+over+10,eave-18);ctx.stroke();
    line(ctx,[x0+over-4,ridge,x1-over+4,ridge],'#5e2a1c',7);
    ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x0+over-4,ridge);ctx.quadraticCurveTo(x0+over-14,ridge,x0+over-12,ridge-14);ctx.moveTo(x1-over+4,ridge);ctx.quadraticCurveTo(x1-over+14,ridge,x1-over+12,ridge-14);ctx.stroke();
  }
  function lantern(x,y,col){const sw=Math.sin(time*2+x)*2;line(ctx,[x,y-10,x+sw,y],'#3a2a1c',1.2);ctx.save();ctx.shadowColor=col;ctx.shadowBlur=12;ell(ctx,x+sw,y+7,6,8,col);ctx.restore();ctx.fillStyle='#e8c56a';ctx.fillRect(x+sw-4,y-1,8,2);ctx.fillRect(x+sw-4,y+14,8,2);line(ctx,[x+sw,y+16,x+sw,y+22],'#e8c56a',1);}
  function smoke(x,y){for(let i=0;i<4;i++){const ph=(time*.35+i/4)%1;ctx.globalAlpha=(1-ph)*.45;ell(ctx,x+Math.sin(ph*5+i)*8+ph*14,y-ph*70,6+ph*12,5+ph*10,'#d9d6cf');}ctx.globalAlpha=1;}
  function lattice(x,y,w,h){roundRect(ctx,x,y,w,h,2,'#6e4526');ctx.strokeStyle='#4a2c16';ctx.lineWidth=1.5;for(let lx=x+5;lx<x+w;lx+=6){ctx.beginPath();ctx.moveTo(lx,y+3);ctx.lineTo(lx,y+h-3);ctx.stroke();}ctx.strokeRect(x+2,y+2,w-4,h-4);}
  function house(b){
    const x=b.x*T,y=b.y*T,w=b.w*T,h=b.h*T,bot=y+h;
    ctx.fillStyle='#21302440';ctx.fillRect(x+12,y+30,w,h-20);
    if(b.style==='hall'){ // nhà ngói ba gian của lý trưởng
      roundRect(ctx,x-8,bot-16,w+16,18,3,'#a35a40');ctx.strokeStyle='#8a4a34';ctx.lineWidth=1;for(let gx=x-8;gx<x+w+8;gx+=16){ctx.beginPath();ctx.moveTo(gx,bot-16);ctx.lineTo(gx,bot+2);ctx.stroke();}
      roundRect(ctx,x+8,y+52,w-16,h-68,2,'#7a4a2a');
      const bay=(w-16)/3;for(let i=0;i<3;i++){lattice(x+16+i*bay,y+64,bay-16,h-88);}
      for(let i=0;i<=3;i++)roundRect(ctx,x+6+i*bay,y+50,10,h-64,3,'#3e2414');
      roundRect(ctx,x+w/2-34,y+54,68,14,2,'#2a1a10');ctx.strokeStyle='#d9b45f';ctx.lineWidth=1.5;ctx.strokeRect(x+w/2-32,y+56,64,10);
      tileRoof(x,y+56,x+w,y-8,26);
      lantern(x+22,y+60,'#d8402c');lantern(x+w-22,y+60,'#d8402c');
    }else if(b.style==='shrine'){ // miếu nhỏ của đạo sĩ: mái chồng diêm, lư hương, cờ phướn
      const cx=x+w/2;roundRect(ctx,x+4,bot-14,w-8,16,3,'#8d8a80');
      roundRect(ctx,x+20,y+82,w-40,h-96,2,'#c9a26a');roundRect(ctx,cx-16,bot-62,32,48,[14,14,0,0],'#6e1f18');
      roundRect(ctx,x+16,y+80,8,h-94,2,'#9a2c1e');roundRect(ctx,x+w-24,y+80,8,h-94,2,'#9a2c1e');
      tileRoof(x+14,y+86,x+w-14,y+50,16,'#5e6e46');tileRoof(x+30,y+50,x+w-30,y+14,12,'#5e6e46');
      ctx.save();ctx.shadowColor='#ffd27a';ctx.shadowBlur=10;ell(ctx,cx,y+6,7,7,'#e7c46a');ctx.restore();
      for(const s of [-1,1]){const fx2=cx+s*(w/2-4),wave=Math.sin(time*2+s)*4;line(ctx,[fx2,y+40,fx2,bot-10],'#5a4028',2);poly(ctx,[fx2,y+44,fx2+s*12+wave,y+50,fx2+s*10+wave,y+110,fx2,y+104],'#d9b44a');line(ctx,[fx2+s*3,y+60,fx2+s*8+wave*.6,y+64],'#b33a2e',2);}
      ell(ctx,cx,bot-4,14,5,'#7a5a2e');roundRect(ctx,cx-11,bot-16,22,12,[2,2,6,6],'#8a6a3a');line(ctx,[cx-12,bot-16,cx+12,bot-16],'#c9a46a',2);
      for(let k=-1;k<=1;k++){line(ctx,[cx+k*4,bot-16,cx+k*4,bot-30],'#c98a5a',1.2);ell(ctx,cx+k*4,bot-30,1.2,1.2,'#ff6a3a');}
      ctx.strokeStyle='#e6e1d888';ctx.lineWidth=1.2;for(let k=0;k<2;k++){ctx.beginPath();for(let s=0;s<20;s++){const yy=bot-32-s*3,xx=cx+(k?4:-4)+Math.sin(time*2+s*.4+k)*3;s?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();}
    }else if(b.style==='forge'){ // lò rèn: mái rạ, lò đất, ống bễ, giá dao kiếm
      roundRect(ctx,x+6,y+44,w-12,h-44,3,'#a07a52');ctx.strokeStyle='#8a6640';ctx.lineWidth=1;for(let ry=y+54;ry<bot;ry+=12){ctx.beginPath();ctx.moveTo(x+8,ry);ctx.lineTo(x+w-8,ry+2);ctx.stroke();}
      roundRect(ctx,x+14,y+60,w-28,h-64,3,'#2a1e16');
      ell(ctx,x+52,bot-30,28,32,'#8a5a3a');ell(ctx,x+52,bot-46,22,14,'#9a6a46');
      const g=ctx.createRadialGradient(x+52,bot-24,2,x+52,bot-24,18);g.addColorStop(0,'#ffe08a');g.addColorStop(.6,'#ff7a2e');g.addColorStop(1,'#ff7a2e00');ctx.save();ctx.globalAlpha=.8+Math.sin(time*9)*.15;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x+52,bot-24,18,0,PI2);ctx.fill();ctx.restore();
      for(let k=0;k<2;k++){roundRect(ctx,x+86+k*12,bot-70,9,64,4,'#b59a5c');line(ctx,[x+86+k*12,bot-50,x+95+k*12,bot-50],'#8a7a3c',1.5);}
      const rx=x+w-110;line(ctx,[rx,bot-96,rx+96,bot-96],'#5a4028',4);
      [[10,'#d5dde2',36],[30,'#cfd6db',30],[52,'#d5dde2',40]].forEach(([dx,col,len])=>{line(ctx,[rx+dx,bot-96,rx+dx,bot-90],'#3a2a1a',1);line(ctx,[rx+dx,bot-90,rx+dx,bot-90+len],col,4);line(ctx,[rx+dx,bot-90,rx+dx,bot-84],'#6b4a2e',5);});
      ctx.strokeStyle='#cfd6db';ctx.lineWidth=3;ctx.beginPath();ctx.arc(rx+80,bot-74,12,Math.PI*.1,Math.PI*1.1);ctx.stroke();line(ctx,[rx+80,bot-62,rx+80,bot-52],'#6b4a2e',4);
      for(const px of [x+6,x+w-12])roundRect(ctx,px,y+40,7,h-40,2,'#7a6a3a');
      thatch(x,y+52,x+w,y-6,16);smoke(x+52,y-4);
    }else if(b.style==='inn'){ // quán nước: vách tre, chõng, ấm trà, nón lá treo
      roundRect(ctx,x+6,y+46,w-12,h-46,3,'#c9ad6e');ctx.strokeStyle='#a98d52';ctx.lineWidth=1.5;for(let lx=x+12;lx<x+w-6;lx+=8){ctx.beginPath();ctx.moveTo(lx,y+48);ctx.lineTo(lx,bot);ctx.stroke();}
      roundRect(ctx,x+20,y+64,w-40,h-84,3,'#3a2c1c');
      roundRect(ctx,x+30,bot-34,88,8,2,'#b8964f');line(ctx,[x+34,bot-26,x+34,bot-8],'#8a6a3a',3);line(ctx,[x+114,bot-26,x+114,bot-8],'#8a6a3a',3);ctx.strokeStyle='#9a7a3a';for(let sx=x+34;sx<x+118;sx+=6){ctx.beginPath();ctx.moveTo(sx,bot-34);ctx.lineTo(sx,bot-27);ctx.stroke();}
      ell(ctx,x+60,bot-40,8,6,'#6b3a24');line(ctx,[x+67,bot-42,x+73,bot-46],'#6b3a24',2);ell(ctx,x+80,bot-37,3,2.5,'#e8e0cc');ell(ctx,x+90,bot-37,3,2.5,'#e8e0cc');
      poly(ctx,[x+w-60,y+86,x+w-44,y+70,x+w-28,y+86],'#e1cd8e');line(ctx,[x+w-58,y+86,x+w-30,y+86],'#b49c62',1.5);
      const sw=Math.sin(time*1.6)*4;line(ctx,[x+w-14,y+40,x+w-14,bot],'#7a5a3a',3);poly(ctx,[x+w-14,y+44,x+w+14+sw,y+48,x+w+12+sw,y+76,x+w-14,y+72],'#3e5f8a');
      thatch(x,y+54,x+w,y-4,16);lantern(x+30,y+56,'#ffb347');
    }else if(b.style==='barn'){ // kho thóc nhà sàn
      for(const px of [x+16,x+w/2-4,x+w-24])roundRect(ctx,px,bot-48,8,48,2,'#6b4a2e');
      roundRect(ctx,x+8,bot-54,w-16,8,2,'#8a6a42');
      roundRect(ctx,x+12,y+60,w-24,h-114,3,'#b8975a');ctx.strokeStyle='#9a7a40';ctx.lineWidth=1.2;for(let k=0;k<12;k++){ctx.beginPath();ctx.moveTo(x+12,y+64+k*6);ctx.lineTo(x+w-12,y+64+k*6);ctx.stroke();}
      roundRect(ctx,x+w/2-14,y+76,28,38,2,'#6e4a2a');
      line(ctx,[x+w/2-10,bot-46,x+w/2-18,bot],'#8a6a3a',3);line(ctx,[x+w/2+10,bot-46,x+w/2+2,bot],'#8a6a3a',3);for(let k=1;k<5;k++)line(ctx,[x+w/2-10-k*2,bot-46+k*9,x+w/2+10-k*2,bot-46+k*9],'#8a6a3a',2);
      thatch(x+4,y+64,x+w-4,y-24,18);
      ell(ctx,x+14,bot-8,12,9,'#a68048');ell(ctx,x+14,bot-14,12,4,'#c9a058');ell(ctx,x+w-16,bot-10,13,10,'#d8c49a');
    }else if(b.style==='stable'){ // chuồng ngựa: mái rạ, rào tre
      for(let px=x+4;px<=x+w;px+=58)roundRect(ctx,px,y+30,7,h-30,2,'#7a6a3a');
      roundRect(ctx,x+10,y+50,w-20,h-58,3,'#2c2016');
      const bob=Math.sin(time*1.3)*3,hx=x+w/2+10;
      ell(ctx,hx-10,y+90,22,14,'#7a4b2a');line(ctx,[hx+4,y+84,hx+14,y+68+bob],'#7a4b2a',10);ell(ctx,hx+20,y+66+bob,12,7,'#7a4b2a',.5);line(ctx,[hx+8,y+76,hx+16,y+62+bob],'#2e1c10',4);
      ell(ctx,x+40,y+108,22,9,'#e3c35a');
      thatch(x,y+40,x+w,y-2,14,'#b08a48');
      for(const ry of [bot-24,bot-12]){line(ctx,[x-4,ry,x+w+4,ry],'#b59a5c',4);for(let nx=x+20;nx<x+w;nx+=40)line(ctx,[nx,ry-2,nx,ry+2],'#8a7a3c',1.5);}for(let px=x;px<=x+w;px+=30)roundRect(ctx,px-3,bot-32,6,32,2,'#9c8a45');
    }
  }

  /* ---------- NPC trang phục Việt xưa + hoạt động lặp lại ---------- */
  /* ---------- Bộ vẽ người dùng chung (nhân vật, lính, dân làng): viền đậm, đổ bóng, mặt có mắt mũi miệng ---------- */
  const shadeMemo={};
  function shade(hex,f){const k=hex+f;if(shadeMemo[k])return shadeMemo[k];const m=/^#([0-9a-f]{6})/i.exec(hex||'');if(!m)return hex;const n=parseInt(m[1],16),ch=i=>{const v=(n>>i)&255;return Math.round(f<0?v*(1+f):v+(255-v)*f);};return shadeMemo[k]='#'+[16,8,0].map(i=>ch(i).toString(16).padStart(2,'0')).join('');}
  // nét có viền: vẽ lớp tối dày hơn ở dưới
  function oline(c,pts,col,w){line(c,pts,shade(col,-.45),w+2);line(c,pts,col,w);}
  // khối thân: tô màu, bóng tối nửa sau, viền
  function torso(c,x,y,w,h,r,col){c.save();roundRect(c,x,y,w,h,r,col);c.beginPath();c.roundRect(x,y,w,h,r);c.clip();c.fillStyle='#00000026';c.fillRect(x,y,w*.32,h);c.fillStyle='#ffffff14';c.fillRect(x+w*.62,y,w*.2,h);c.restore();c.strokeStyle=shade(col,-.5);c.lineWidth=1.2;c.beginPath();c.roundRect(x,y,w,h,r);c.stroke();}
  // mặt nhìn nghiêng sang phải: cổ, tai, mắt trắng + con ngươi, lông mày, mũi, miệng, má hồng
  function face(c,o){
    const skin=o.skin,dk=shade(skin,-.22);
    c.fillStyle=dk;c.fillRect(-3.5,-27.5,7,4.5);
    c.fillStyle=skin;c.strokeStyle=shade(skin,-.5);c.lineWidth=1.1;c.beginPath();c.ellipse(0,-35,10.5,11,0,0,PI2);c.fill();c.stroke();
    c.save();c.globalAlpha=.28;c.fillStyle=dk;c.beginPath();c.ellipse(-4.5,-33,5.5,8,0,0,PI2);c.fill();c.restore();
    ell(c,-4.5,-34,2.4,3.3,dk);ell(c,-4.5,-34,1.1,1.8,shade(skin,-.35));
    const blink=o.t!==undefined&&((o.t*.7+(o.ph||0))%4)<.12;
    if(blink)line(c,[4,-36,7.6,-36],'#2a2018',1.2);else{ell(c,5.6,-36,2.2,1.7,'#fbf3e4');ell(c,6.4,-35.9,1.25,1.45,'#2a2018');c.fillStyle='#fff';c.fillRect(6.6,-36.9,.7,.7);}
    line(c,[3.2,-39.6,8.2,-40.1],o.brow||'#2a2018',o.old?1.6:1.3);
    line(c,[10.1,-36,11,-32.6,9.6,-32.2],dk,1);
    line(c,[6.4,-29.4,9.2,-29.8],o.fem?'#b0473f':'#8a4a3a',o.fem?1.4:1.1);
    if(o.fem){c.save();c.globalAlpha=.32;ell(c,5.5,-32.4,2.3,1.4,'#e0705f');c.restore();}
    if(o.old){line(c,[2.5,-31.5,4.5,-30.4],dk,.8);line(c,[7,-37.8,8.6,-37.4],shade(skin,-.3),.7);}
  }
  // mặt 3/4 nhìn xuống chéo về phía trước (5 giờ khi quay phải, 7 giờ khi quay trái): thấy cả hai mắt, mũi, miệng; tai và bóng ở phía sau
  function faceQ(c,o){
    const skin=o.skin,dk=shade(skin,-.22),ink=o.eye||'#2a2018';
    c.fillStyle=dk;c.fillRect(-4,-27.5,8,4.5);
    c.fillStyle=skin;c.strokeStyle=shade(skin,-.5);c.lineWidth=1.1;c.beginPath();c.ellipse(.5,-35,10.5,11,0,0,PI2);c.fill();c.stroke();
    c.save();c.globalAlpha=.25;c.fillStyle=dk;c.beginPath();c.ellipse(-5.5,-34,5,8.5,0,0,PI2);c.fill();c.restore();
    ell(c,-9.4,-33.5,2.2,3.2,dk);
    const blink=o.t!==undefined&&((o.t*.7+(o.ph||0))%4)<.12;
    for(const [x,w] of [[-1.6,1.9],[5,2.3]]){if(blink)line(c,[x-w,-33.6,x+w,-33.6],ink,1.2);else{ell(c,x,-33.8,w,1.75,'#fbf3e4');ell(c,x+.5,-33.4,1.15,1.4,ink);c.fillStyle='#fff';c.fillRect(x+.6,-34.3,.6,.6);}}
    line(c,[-4,-37.4,.4,-37.9],o.brow||ink,o.old?1.6:1.25);line(c,[2.8,-38,7.6,-37.4],o.brow||ink,o.old?1.6:1.25);
    line(c,[2.6,-33,3.6,-30.2,2.2,-29.9],dk,1);
    line(c,[.6,-27.6,4.4,-27.8],o.fem?'#b0473f':'#8a4a3a',o.fem?1.4:1.1);
    if(o.fem){c.save();c.globalAlpha=.3;ell(c,-2.6,-30.6,2,1.2,'#e0705f');ell(c,6.6,-30.6,2.2,1.3,'#e0705f');c.restore();}
    if(o.old){line(c,[-3,-30,-1.2,-29],dk,.8);line(c,[7,-36.2,8.4,-35.8],shade(skin,-.3),.7);}
    // dấu trên mặt (diện mạo): sẹo má, nốt ruồi, vẽ mặt chiến binh, hoa cài
    if(o.mark==='seo')line(c,[6.5,-38.5,8.5,-31],'#a8503a',1.3);
    else if(o.mark==='not')ell(c,6.2,-29.6,1,1,'#3a2a22');
    else if(o.mark==='ve'){line(c,[-7,-34,-3,-31.5],'#c03030',1.6);line(c,[8,-32,10,-29],'#c03030',1.6);line(c,[-1,-39.5,1.5,-39.5],'#c03030',1.4);}
    if(o.beard){c.fillStyle=o.beard;c.beginPath();c.moveTo(-6,-29);c.quadraticCurveTo(1,-14,8,-29);c.quadraticCurveTo(1,-26,-6,-29);c.fill();line(c,[-3,-27.5,5.5,-27.5],o.beard,1.6);}
  }
  // tóc nhìn 3/4 từ trên xuống: chỏm tóc, mái lệch, lọn sau gáy
  function hairQ(c,col,style){
    if(style==='troc'){c.save();c.globalAlpha=.25;ell(c,0,-43,9,4,shade(col,.5));c.restore();return;}
    if(style==='xoa'){ell(c,-8,-33,6,13,col);ell(c,-4,-26,4,8,col);}
    if(style==='dung'){for(let k=-3;k<=3;k++)poly(c,[k*3-1.5,-44,k*3+1.5,-44,k*3+(k<0?-2:2),-53-Math.abs(k)*-1.2],col);}
    ell(c,-.5,-43.5,11.8,6,col);if(style==='khan'){c.fillStyle='#b8302a';c.fillRect(-11.5,-45.5,23,4);line(c,[-11,-44,-16,-40],'#b8302a',2.2);}c.fillStyle=col;c.beginPath();c.moveTo(-10.5,-42);c.quadraticCurveTo(-4,-36.5,2,-40.2);c.quadraticCurveTo(7,-38.5,11,-41);c.lineTo(10.5,-45);c.lineTo(-10.5,-45);c.closePath();c.fill();ell(c,-9,-37,3.4,6,col);c.strokeStyle=shade(col,.28);c.lineWidth=.8;c.beginPath();c.ellipse(-.5,-44,9,3.2,0,Math.PI*1.05,Math.PI*1.85);c.stroke();}
  function npcLegs(c,n,col){const s=n.moving?Math.sin(n.walk)*4:0;oline(c,[-3,-6,-4-s,5],col,5);oline(c,[3,-6,4+s,5],col,5);ell(c,-4-s+1.5,6,4.5,2.2,'#2e241a');ell(c,4+s+1.5,6,4.5,2.2,'#2e241a');}
  function head(c,skin,hair,beard,o={}){
    face(c,{skin,old:!!beard,fem:!!o.fem,t:time,ph:o.ph,brow:beard||undefined});
    if(hair){ell(c,-1,-42,11.5,6,hair);ell(c,-7.5,-37,3.2,5.5,hair);c.strokeStyle=shade(hair,.25);c.lineWidth=.8;c.beginPath();c.ellipse(-1,-42,9,3.6,0,Math.PI*1.05,Math.PI*1.8);c.stroke();}
    if(beard){c.fillStyle=beard;c.beginPath();c.moveTo(-1,-30);c.quadraticCurveTo(5,-11,11,-30);c.quadraticCurveTo(6,-27,-1,-30);c.fill();c.strokeStyle=shade(beard,-.2);c.lineWidth=.7;for(let k=0;k<3;k++){c.beginPath();c.moveTo(2+k*2.5,-28);c.lineTo(3+k*2,-18+k*2);c.stroke();}line(c,[5,-31.5,11,-31.2],beard,1.6);}
  }
  const NH={ell,line,poly,rr:(c,x,y,w,h,r,col)=>roundRect(c,x,y,w,h,r,col),head,khanXep:(c,col)=>khanXep(c,col||'#1e1b19'),nonLa:(c,col)=>nonLa(c,col||'#e1cd8e'),npcLegs,torso,oline,shade};
  function khanXep(c,col='#1e1b19'){ell(c,0,-43,12.5,6,col);c.strokeStyle='#3a3430';c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();c.ellipse(0,-43+k*2-2,12,3,0,Math.PI*.1,Math.PI*.9);c.stroke();}}
  function nonLa(c,col='#e1cd8e'){poly(c,[-20,-41,0,-60,20,-41],col);line(c,[-20,-41,20,-41],'#b49c62',1.5);c.strokeStyle='#c9b070';c.lineWidth=1;for(let k=1;k<4;k++){c.beginPath();c.moveTo(-20+k*4.5,-41-k*4.3);c.lineTo(20-k*4.5,-41-k*4.3);c.stroke();}}
  // v10.13: giá bày cánh sau lưng Luyện khí sư — vài đôi cánh (màu theo đồ cánh) bay lượn nhẹ
  const WING_SHOW=['#f4f0ff','#5a1a3a','#ffc0e8','#fff0a0','#a0c8ff','#ff8a3d'];
  function drawWingRack(n){const c=ctx,t=time;c.save();c.translate(n.x,n.y);
    line(c,[-34,-2,-34,-70],'#5a3e1e',3);line(c,[34,-2,34,-70],'#5a3e1e',3);line(c,[-36,-70,36,-70],'#7a5a2e',4);
    for(let i=0;i<3;i++){const x=-24+i*24,y=-54+Math.sin(t*1.5+i)*2,col=WING_SHOW[(i+Math.floor(t/6))%WING_SHOW.length],pic=LH_IMG.pic('vat_pham:'+['canh-thien-than','canh-ac-quy','canh-tien-nu','canh-anh-sang','canh-loi-phong','canh-lua'][(i+Math.floor(t/6))%6]);
      if(pic){c.drawImage(pic,x-11,y-11,22,22);continue;}
      c.fillStyle=col;c.globalAlpha=.9;for(const sx of [-1,1]){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+sx*14,y-14,x+sx*12,y+2);c.quadraticCurveTo(x+sx*6,y+6,x,y+2);c.fill();}c.globalAlpha=1;}
    c.restore();}
  function drawNPC(n){
    const c=ctx,t=time;ell(c,n.x,n.y+5,14,6,'#243d3544');
    if(n.panel==='fuse')drawWingRack(n);
    c.save();c.translate(n.x,n.y);c.scale(n.facing,1);
    const pic=LH_IMG.pic('npc:'+n.id);
    if(pic)drawPic(c,pic,66,n.moving?-Math.abs(Math.sin(n.walk))*2:0);
    else if(LH_ART.npc[n.role])LH_ART.npc[n.role](c,n,t,NH); // vai NPC do gói bản đồ khai báo (thành trì)
    else if(n.role==='elder'){ // lý trưởng: áo the đen, khăn xếp, gậy trúc, đi đi lại lại
      const s=n.moving?Math.sin(n.walk)*4:0;ell(c,-3-s,5,4,2,'#2e241a');ell(c,4+s,5,4,2,'#2e241a');line(c,[-3,-2,-3-s,4],'#e8e2d2',4);line(c,[3,-2,3+s,4],'#e8e2d2',4);
      poly(c,[-12,-28,12,-28,14,0,-14,0],'#2b2724');line(c,[2,-27,9,-8],'#4a4440',1.5);line(c,[-14,-1,14,-1],'#3a3430',2);
      line(c,[-10,-24,-14,-10],'#2b2724',6);
      const cane=n.moving?Math.sin(n.walk)*3:0;line(c,[14+cane,-16,17+cane,6],'#c9b26a',2.5);for(let k=0;k<3;k++)line(c,[13.5+cane+k*1,-10+k*6,16+cane+k,-10+k*6],'#9c8a45',1);line(c,[10,-22,14+cane,-16],'#2b2724',6);ell(c,14+cane,-16,3,3,'#e1c295');
      for(let k=0;k<4;k++)ell(c,3+k*.7,-24+k*4.5,1.3,1.3,'#c9a24a');line(c,[-13,-9,13,-9],'#8b2f25',2.2);line(c,[-12,-27,12,-27],'#4a4440',1.6);
      head(c,'#e1c295',null,'#f2efe6',{ph:.3});khanXep(c);
    }else if(n.role==='smith'){ // thợ rèn: cởi trần, khăn quấn đầu, búa gõ đe
      const ph=(t*1.1+n.phase)%1,raise=ph<.45?E(ph/.45):ph<.55?1-((ph-.45)/.1):0,ang=lerp(.5,-2.3,raise);
      ell(c,25,0,10,4,'#5a4028');roundRect(c,18,-12,14,12,2,'#6b4a2e');poly(c,[14,-17,34,-17,31,-12,17,-12],'#3d4248');
      c.save();c.shadowColor='#ff8a3d';c.shadowBlur=10;roundRect(c,19,-20,12,3,1,ph>.45&&ph<.7?'#fff0b0':'#ff9a3d');c.restore();
      npcLegs(c,n,'#5a3e28');
      roundRect(c,-13,-28,26,24,8,'#b9875a');line(c,[-6,-22,0,-18,6,-22],'#9c6e46',1.5);poly(c,[-9,-16,9,-16,10,-2,-10,-2],'#5a3a22');line(c,[-9,-16,-11,-25],'#5a3a22',1.5);
      c.fillStyle='#4a3020';c.fillRect(-13,-8,26,4);
      line(c,[-10,-24,10,-17],'#b9875a',6);ell(c,12,-17,3.5,3.5,'#b9875a');line(c,[12,-17,22,-19],'#2c2c2c',2.5);
      line(c,[-8,-27,-6,-14],'#4a3020',1.6);line(c,[8,-27,6,-14],'#4a3020',1.6);c.strokeStyle='#8a5c38';c.lineWidth=1;c.beginPath();c.moveTo(-8,-23);c.quadraticCurveTo(-3,-20,0,-23);c.moveTo(1,-23);c.quadraticCurveTo(5,-20,9,-23);c.stroke();
      head(c,'#b9875a','#2a2622','#3a2a1a',{ph:.7});ell(c,0,-42,12,4.5,'#7a5a3a');line(c,[-10,-42,-15,-36],'#7a5a3a',2.5);
      c.save();c.translate(9,-23);c.rotate(ang);line(c,[0,0,13,0],'#b9875a',6.5);ell(c,13,0,3.8,3.8,'#b9875a');line(c,[13,0,13,-18],'#6b4a2e',3);roundRect(c,7,-24,13,8,2,'#4a4f56');c.restore();
    }else if(n.role==='guide'){ // người dẫn đường: áo nâu, nón lá, tay nải, ống nhòm
      const cyc=(t+n.phase*6)%6,up=cyc<.7?E(cyc/.7):cyc<4.5?1:cyc<5.2?1-E((cyc-4.5)/.7):0;
      line(c,[-14,-30,-6,-6],'#6b4a2e',2);ell(c,-15,-24,7,8,'#3e5f8a');
      npcLegs(c,n,'#2e2a26');
      roundRect(c,-12,-27,24,23,6,'#7a5a3a');c.fillStyle='#4a3a2a';c.fillRect(-12,-10,24,3);
      line(c,[-11,-25,11,-9],'#5a3e24',2);roundRect(c,-5,-12,10,3,1,'#c9a24a');
      head(c,'#d8b48a','#2a2622',null,{ph:1.1});nonLa(c);
      const hx=lerp(12,8,up),hy=lerp(-10,-36,up);line(c,[6,-22,hx,hy],'#7a5a3a',5.5);line(c,[-4,-22,lerp(-12,4,up),lerp(-10,-34,up)],'#7a5a3a',5.5);
      c.save();c.translate(hx+2,hy-1);c.rotate(lerp(1.2,0,up));roundRect(c,-3,-6,9,5,1.5,'#3a2a1a');roundRect(c,-3,1,9,5,1.5,'#3a2a1a');ell(c,6,-3.5,1.6,2.4,'#c9a46a');ell(c,6,3.5,1.6,2.4,'#c9a46a');c.restore();
    }else if(n.role==='trainer'){ // người nuôi ngựa: áo cánh nâu, khăn mỏ quạ, quay dây thừng
      const a=t*5+n.phase*6;
      npcLegs(c,n,'#3e3a34');line(c,[-3,0,-4,4],'#d8b48a',4);line(c,[3,0,4,4],'#d8b48a',4);
      roundRect(c,-12,-27,24,23,6,'#a77a4a');line(c,[0,-26,0,-6],'#8a5f36',1.5);c.fillStyle='#6b4a2e';c.fillRect(-12,-10,24,3);
      line(c,[-10,-23,-13,-9],'#a77a4a',5.5);
      for(let k=0;k<3;k++)ell(c,-9+k*3,-8,2,1.4,'#c9a46a');
      head(c,'#d0a87a','#2a2622',null,{ph:1.6});poly(c,[-12,-41,12,-41,9,-52,-2,-56,-11,-50],'#2a2522');poly(c,[-2,-56,6,-60,4,-52],'#2a2522');
      const hx=6+Math.cos(a)*5,hy=-50+Math.sin(a)*3;line(c,[8,-23,hx,hy],'#a77a4a',5.5);ell(c,hx,hy,3.4,3.4,'#d0a87a');
      c.save();c.translate(2,-64);c.strokeStyle='#c9a46a';c.lineWidth=2;c.beginPath();c.ellipse(0,0,20,5,0,0,PI2);c.stroke();c.setLineDash([5,5]);c.lineDashOffset=-t*40;c.strokeStyle='#8a6a42';c.stroke();c.setLineDash([]);c.restore();
      line(c,[hx,hy,2+Math.cos(a)*20,-64+Math.sin(a)*5],'#c9a46a',1.6);
    }else if(n.role==='wizard'){ // đạo sĩ: đạo bào vàng, mũ đạo, phất trần, bùa bay
      const hov=Math.sin(t*2+n.phase*6)*2;c.translate(0,hov-2);
      ell(c,0,6-hov,12,3,'#e7c46a33');
      poly(c,[-12,-28,12,-28,16,6,-16,6],'#c99a3a');line(c,[-16,5,16,5],'#2a2622',3);line(c,[0,-27,0,4],'#2a2622',2);
      c.save();c.translate(0,-15);ell(c,0,0,5.5,5.5,'#f2ead6');c.fillStyle='#2a2622';c.beginPath();c.arc(0,0,5.5,-Math.PI/2,Math.PI/2);c.fill();ell(c,0,-2.75,2.75,2.75,'#2a2622');ell(c,0,2.75,2.75,2.75,'#f2ead6');c.restore();
      line(c,[-10,-23,-13,-10],'#c99a3a',6);
      line(c,[-12,-27,-4,-14],'#e7c46a',1.6);line(c,[12,-27,4,-14],'#e7c46a',1.6);
      head(c,'#e8cfa8',null,'#cfcfd6',{ph:2.1});c.fillStyle='#cfcfd6';c.beginPath();c.moveTo(-3,-30);c.quadraticCurveTo(4,-6,9,-30);c.fill();
      roundRect(c,-9,-58,18,16,2,'#1e1b19');roundRect(c,-12,-45,24,4,1,'#1e1b19');roundRect(c,-3,-56,6,6,1,'#e7c46a');
      const wv=Math.sin(t*3)*.5;line(c,[8,-22,15,-28],'#c99a3a',6);ell(c,15,-28,3.4,3.4,'#e8cfa8');
      c.save();c.translate(15,-28);c.rotate(-.8+wv);line(c,[0,0,0,-16],'#6b4a2e',2.5);c.strokeStyle='#f4f1e8';c.lineWidth=1.4;for(let k=-3;k<=3;k++){c.beginPath();c.moveTo(0,-16);c.quadraticCurveTo(k*3,-24,k*4+Math.sin(t*4+k)*2,-32);c.stroke();}c.restore();
      for(let i=0;i<3;i++){const ba=t*1.4+i*2.09,bx=Math.cos(ba)*26,by=-36+Math.sin(ba)*8;c.save();c.globalAlpha=Math.sin(ba)>0?1:.5;c.translate(bx,by);c.rotate(Math.sin(t*2+i)*.3);roundRect(c,-4,-8,8,16,1,'#f0d060');line(c,[0,-5,0,5],'#c0342a',1.4);line(c,[-2,-2,2,-2],'#c0342a',1.2);c.restore();}
    }else if(n.role==='merchant'){ // thương nhân: áo tứ thân, nón quai thao, đòn gánh hai thúng hàng
      const sw=Math.sin(t*2.2+n.phase*6)*2;
      line(c,[-30,-30+sw*.3,30,-30-sw*.3],'#a8864a',3);
      for(const s of [-1,1]){const bx=s*28,by=-30-s*sw*.3;line(c,[bx-6,by,bx-8,by+14],'#7a5a3a',1);line(c,[bx+6,by,bx+8,by+14],'#7a5a3a',1);roundRect(c,bx-11,by+14,22,12,[2,2,8,8],'#b8964f');ell(c,bx,by+14,11,3,'#d8b46a');ell(c,bx-3,by+12,4,3,s<0?'#e05a3a':'#8fcf5a');ell(c,bx+4,by+12,3.5,3,'#f2d06b');}
      npcLegs(c,n,'#3a2a22');
      poly(c,[-12,-27,12,-27,15,4,-15,4],'#7a4a2e');line(c,[0,-26,0,4],'#5a3420',1.5);c.fillStyle='#c0392b';c.fillRect(-12,-12,24,3);
      line(c,[8,-24,12,-30],'#7a4a2e',5);
      poly(c,[-6,-26,6,-26,3,-16,-3,-16],'#c0392b');line(c,[-12,-26,0,-12],'#a8864a',1.2);line(c,[12,-26,0,-12],'#a8864a',1.2);
      head(c,'#e1c295','#2a2622',null,{fem:true,ph:2.6});ell(c,-9,-30,4,7,'#2a2622');poly(c,[-11,-42,0,-50,11,-42],'#1e1b19');
      ell(c,0,-47,19,5,'#d8c48a');ell(c,0,-49,13,3,'#c8b070');line(c,[-8,-46,-6,-32],'#3a2a1c',1);line(c,[8,-46,6,-32],'#3a2a1c',1);
    }
    c.restore();
    label(n.name,n.x,n.y-(n.role==='wizard'?82:n.role==='guide'||n.role==='trainer'||n.role==='merchant'?70:66),'#ecdfb9');
  }
  function label(t,x,y,color,fx){if(SPR.baking)return;ctx.font='12px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#22382bd0';ctx.strokeText(t,x,y);
    // Thuốc đa nhiệm: hiệu ứng tên — ánh vàng (lóe), cầu vồng (chuyển màu), lửa (đỏ cam nhấp nháy), băng (xanh phát sáng), tím mộng
    if(fx){ctx.save();const tm=time;let col=color,glow='';
      if(fx==='vang'){col='#ffe08a';glow='#ffd24a';}else if(fx==='cau-vong'){col=`hsl(${(tm*90)%360} 95% 70%)`;glow=col;}else if(fx==='lua'){col=tm%.3<.15?'#ff8a3d':'#ffd27a';glow='#ff5a1a';}else if(fx==='bang'){col='#dff6ff';glow='#5fc8ff';}else if(fx==='tim'){col='#f0c8ff';glow='#b060ff';}
      ctx.shadowColor=glow;ctx.shadowBlur=8+Math.sin(tm*4)*3;ctx.fillStyle=col;ctx.fillText(t,x,y);ctx.restore();return;}
    ctx.fillStyle=color;ctx.fillText(t,x,y);}
  // Biểu tượng trên đầu NPC: "!" khi còn nhiệm vụ, túi hàng khi đã xong và có bán đồ
  function npcMarkY(n){return n.y-(n.role==='tuong-quan-tg'?112:n.role==='wizard'?98:88);}
  // v10.46: có sự kiện thế giới đang cho ghi danh (trước giờ mở tg_dang_ky_phut phút)
  let tgRegAt=-9,tgRegOn=null;const tgReg=()=>{if(time-tgRegAt>1){tgRegAt=time;tgRegOn=Object.values(Player.TG).find(E=>E.on&&Player.tgState(E.id).phase==='reg')||null;}return tgRegOn;};
  function drawNPCMarks(){
    for(const n of World.npcs){
      const bx=n.x,by=npcMarkY(n)+Math.sin(time*3)*2,near=Math.hypot(n.x-hero.x,n.y-hero.y)<92;
      // v10.12: NPC đang giữ việc cốt truyện Tìm con: dấu hồng (! có việc · ? trả việc)
      if(n.panel==='tg'&&tgReg()&&!TGM){const k=1+Math.sin(time*7)*.12;ctx.save();ctx.translate(bx,by);ctx.scale(k,k);ctx.font='800 30px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#3a1206ee';ctx.strokeText('!',0,10);ctx.fillStyle='#ff7a2a';ctx.fillText('!',0,10);ctx.restore();continue;}
      if(vitWants(n)){ctx.font='800 24px system-ui';ctx.textAlign='center';ctx.lineWidth=3.5;ctx.strokeStyle='#3a2a06ee';ctx.strokeText('!',bx,by+7);ctx.fillStyle='#ffe040';ctx.fillText('!',bx,by+7);continue;}
      const st=Player.storyAt(player,n.id);
      if(st){const ch=st.state==='ready'?'?':'!';ctx.font='700 24px system-ui';ctx.textAlign='center';ctx.lineWidth=3.5;ctx.strokeStyle='#3a102aee';ctx.strokeText(ch,bx,by+7);ctx.fillStyle=st.state==='active'?'#ffb0c8':'#ff5a8a';ctx.fillText(ch,bx,by+7);if(st.state!=='active')continue;}
      if(!seen.has(n.id)){
        if(near&&!dialogNPC){roundRect(ctx,bx-17,by-12,34,24,7,'#f0e7c8');ctx.fillStyle='#f0e7c8';ctx.beginPath();ctx.moveTo(bx-4,by+10);ctx.lineTo(bx-4,by+17);ctx.lineTo(bx+4,by+10);ctx.fill();ctx.fillStyle='#31503b';for(let k=-1;k<=1;k++){ctx.beginPath();ctx.arc(bx+k*8,by,2,0,PI2);ctx.fill();}}
        else{ctx.font='700 20px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#22382bd0';ctx.strokeText('!',bx,by+6);ctx.fillStyle='#f6d36b';ctx.fillText('!',bx,by+6);}
      }else if(n.panel){
        const ready=n.panel==='quests'&&Object.entries(player.quests.active).some(([id,v])=>Player.QUESTS[id]&&v>=Player.QUESTS[id].count);
        if(ready){ctx.font='700 22px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#22382bd0';ctx.strokeText('!',bx,by+7);ctx.fillStyle='#ffd04a';ctx.fillText('!',bx,by+7);continue;}
        roundRect(ctx,bx-13,by-12,26,24,7,near?'#3f7a55':'#2f5a43ee');ctx.strokeStyle='#e8f6d8';ctx.lineWidth=1.8;
        if(n.panel==='shop'){ctx.beginPath();ctx.moveTo(bx-6,by-3);ctx.lineTo(bx+6,by-3);ctx.lineTo(bx+7,by+7);ctx.lineTo(bx-7,by+7);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(bx,by-4,4,Math.PI,0);ctx.stroke();}
        else if(n.panel==='quests'){ctx.strokeRect(bx-6,by-7,12,14);line(ctx,[bx-3,by-2,bx+3,by-2],'#e8f6d8',1.4);line(ctx,[bx-3,by+2,bx+3,by+2],'#e8f6d8',1.4);}
        else if(n.panel==='mercs'){line(ctx,[bx-7,by+7,bx+7,by-7],'#e8f6d8',1.8);line(ctx,[bx-7,by-7,bx+7,by+7],'#e8f6d8',1.8);}
        else if(n.panel==='market'){ctx.beginPath();ctx.arc(bx,by,7,0,PI2);ctx.stroke();ctx.strokeRect(bx-2.5,by-2.5,5,5);}
        else if(n.panel==='tg'){line(ctx,[bx-5,by+8,bx-5,by-8],'#e8f6d8',1.8);ctx.fillStyle='#e8f6d8';ctx.beginPath();ctx.moveTo(bx-4,by-8);ctx.lineTo(bx+7,by-4);ctx.lineTo(bx-4,by);ctx.closePath();ctx.fill();}
      }
    }
  }
  function drawWellMarks(){
    const cd=wellCd();
    for(const o of World.wells){
      const left=(player.flags.wells[o.id]||0)-Date.now(),bx=o.x,by=o.y-92+Math.sin(time*3)*2;
      if(left<=0){
        ctx.fillStyle='#7fd0ff';ctx.beginPath();ctx.moveTo(bx,by-11);ctx.quadraticCurveTo(bx+10,by+2,bx,by+9);ctx.quadraticCurveTo(bx-10,by+2,bx,by-11);ctx.fill();
        ctx.strokeStyle='#1d3a4a';ctx.lineWidth=1.6;ctx.stroke();ell(ctx,bx-3,by+1,2,3,'#e8f8ff');
      }else{
        const f=1-left/cd,s=Math.ceil(left/1000),t=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
        ctx.lineWidth=4;ctx.strokeStyle='#1d2e26cc';ctx.beginPath();ctx.arc(bx,by,10,0,PI2);ctx.stroke();
        ctx.strokeStyle='#7fd0ff';ctx.beginPath();ctx.arc(bx,by,10,-Math.PI/2,-Math.PI/2+Math.max(.01,f)*PI2);ctx.stroke();
        ctx.font='700 11px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#1d2e26';ctx.strokeText(t,bx,by+25);ctx.fillStyle='#e8f6d8';ctx.fillText(t,bx,by+25);
      }
    }
  }
  function updateNPCs(dt){
    for(const n of World.npcs){
      n.moving=false;
      if(dialogNPC===n){n.facing=hero.x<n.x?-1:1;continue;}
      if(n.role==='elder'){
        if(n.x0==null||n.x1==null)continue; // v10.38: elder không khai báo đoạn đi (x0, x1) thì đứng yên, tránh tọa độ NaN làm NPC biến mất
        if(time<n.pause)continue;const tx=n.dir>0?n.x1:n.x0,d=tx-n.x;
        if(Math.abs(d)<2){n.dir*=-1;n.pause=time+1.6+Math.random()*1.4;}else{const st=Math.sign(d)*38*dt;n.x+=st;n.facing=Math.sign(d);n.moving=true;n.walk+=Math.abs(st)*.09;}
      }else if(n.role==='smith'){
        const ph=(time*1.1+n.phase)%1;if(n.last!==undefined&&n.last<.45&&ph>=.45&&Math.abs(n.x-camera.x-width/scale/2)<width/scale){for(let i=0;i<9;i++){const a=-Math.PI/2+(Math.random()-.5)*2.2,v=80+Math.random()*120;particles.push({x:n.x+25*n.facing,y:n.y-20,vx:Math.cos(a)*v,vy:Math.sin(a)*v,age:0,life:.35+Math.random()*.25,color:Math.random()<.5?'#ffd27a':'#ff8a3d',size:2,grav:420});}}n.last=ph;
      }else if(n.role==='guide'){if(time>n.turnAt){n.turnAt=time+5+Math.random()*3;if(Math.random()<.5)n.facing*=-1;}}
      else if(n.role==='trainer'){n.facing=-1;}
      else if(n.act==='patrol'&&n.x0!=null){
        if(time<n.pause)continue;const tx=n.dir>0?n.x1:n.x0,d=tx-n.x;
        if(Math.abs(d)<2){n.dir*=-1;n.pause=time+1+Math.random()*2;}else{const st=Math.sign(d)*(n.spd||44)*dt;n.x+=st;n.facing=Math.sign(d);n.moving=true;n.walk+=Math.abs(st)*.09;}
      }else if(n.act==='turn'){if(time>n.turnAt){n.turnAt=time+4+Math.random()*4;if(Math.random()<.5)n.facing*=-1;}}
      else if(n.act==='drum'){const ph=(time*6/PI2+n.phase/PI2)%1;if(n.last!==undefined&&n.last>ph&&Math.abs(n.x-camera.x-width/scale/2)<width/scale)for(let i=0;i<4;i++)particles.push({x:n.x+n.facing*30,y:n.y-56,vx:(Math.random()-.5)*90,vy:-40-Math.random()*60,age:0,life:.4,color:'#ffe08a',size:2,grav:200});n.last=ph;}
    }
  }

  /* ---------- Hoạt ảnh nhân vật chính ---------- */
  const SH={front:{x:5,y:-23},back:{x:-5,y:-23}};
  const MELEE1=t=>t==='sword'||t==='saber'||t==='mace'; // v10.14: đao, chùy dùng dáng kiếm
  function heroPose(h,st,a,t){
    const aim=a&&a.aim?a.aim:h.aim,tilt=clamp(Math.atan2(aim.y,Math.max(.25,Math.abs(aim.x))),-1.15,1.15);
    let p=a?clamp((t-a.start)/a.dur,0,1):0;if(a&&a.cycles>1)p=(Math.min(p,.9999)*a.cycles)%1;const sw=h.moving?Math.sin(h.walk):0;
    const idle={sword:-1.15,saber:-1.1,mace:-1.0,staff:-1.45,shield:0,punch:0};
    const P={tilt,p,lean:0,crouch:0,front:{x:11+sw*3,y:-11,ang:idle[st.right||'punch']},back:{x:-9-sw*3,y:-11,ang:idle[st.left||'punch']},trail:null,pull:2,arrow:false,charge:0,cb:{string:-6,bolt:true,flash:false},stride:0,block:false,heal:false};
    // song kiếm: kiếm tay trước chĩa ra trước, kiếm tay sau giơ chéo sau vai — nhìn rõ hai thanh
    if(st.dual&&MELEE1(st.type)){P.front={x:12+sw*2,y:-13,ang:-.55};P.back={x:-12-sw*2,y:-17,ang:-2.3};}
    if(st.two){
      if(st.type==='spear'||MELEE1(st.type)){P.front={x:14,y:-14,ang:-1.25};P.back={x:14-Math.cos(-1.25)*17,y:-14-Math.sin(-1.25)*17,ang:-1.25};} // đao / chùy hai tay cầm như thương
      if(st.type==='bow'){P.front={x:13,y:-6,ang:.12};P.back={x:-6,y:-12,ang:0};} // cung hạ thấp, dựng đứng bên hông trước
      if(st.type==='crossbow'){P.front={x:13,y:-12,ang:.45};P.back={x:1,y:-17,ang:.45};}
    }
    if(t<h.blockUntil){const sh=st.right==='shield'?P.front:P.back;sh.x=16+Math.sin(t*40)*.6;sh.y=-20;P.crouch=3;P.block=true;}
    if(!a)return P;
    const type=a.type;
    if(type==='heal'){const k=Math.sin(p*Math.PI);P.front={x:lerp(11,7,k),y:lerp(-11,-34,k),ang:P.front.ang};P.back={x:lerp(-9,-5,k),y:lerp(-11,-34,k),ang:P.back.ang};P.heal=true;return P;}
    if(type==='block')return P;
    if(MELEE1(type)){
      const left=a.hand==='left',hand=left?P.back:P.front,sx=left?-5:5,w=seg(p,0,.3),s=seg(p,.3,.56),r=seg(p,.56,1),end=.8+tilt*.6,k=s*s*(3-2*s);
      let ang,hx,hy;
      if(p<.3){ang=lerp(-1.15,-2.55,E(w));hx=lerp(left?-9:11,sx-1,E(w));hy=lerp(-11,-33,E(w));P.lean=-2*E(w);}
      else if(p<.56){ang=lerp(-2.55,end,k);hx=lerp(sx-1,sx+15,k);hy=lerp(-33,-12+tilt*10,k);P.lean=lerp(-2,4,k);P.trail={cx:sx,cy:-23,r:46,from:-2.4,to:ang,fade:1};}
      else{ang=lerp(end,-1.15,E(r));hx=lerp(sx+15,left?-9:11,E(r));hy=lerp(-12+tilt*10,-11,E(r));P.lean=4*(1-E(r));if(r<.3)P.trail={cx:sx,cy:-23,r:46,from:-2.4+r*5,to:end,fade:1-r/.3};}
      hand.x=hx;hand.y=hy;hand.ang=ang;P.stride=P.lean>2?1:0;if(st.two){P.back={x:hx-Math.cos(ang)*14,y:hy-Math.sin(ang)*14,ang};}
    }else if(type==='punch'){const k=Math.sin(seg(p,.15,.75)*Math.PI);P.front.x=10+k*16;P.front.y=-15+tilt*6*k;P.lean=k*3;}
    else if(type==='shield'){
      const w=seg(p,0,.3),s=seg(p,.3,.48),r=seg(p,.48,1),x=p<.3?lerp(12,3,E(w)):p<.48?lerp(3,27,s):lerp(27,12,E(r)),hand=st.right==='shield'?P.front:P.back;
      hand.x=x;hand.y=-16+tilt*6;if(st.dual){P.back.x=x-7;P.back.y=-15+tilt*5;}P.lean=p<.3?-2*E(w):p<.48?6*s:6*(1-E(r));P.crouch=2;P.stride=P.lean>2?1:0;
    }else if(type==='spear'){
      const w=seg(p,0,.38),s=seg(p,.38,.52),r=seg(p,.66,1),ang=p<.38?lerp(-1.25,tilt,E(w)):p<.66?tilt:lerp(tilt,-1.25,E(r));
      const fx=p<.38?lerp(10,-1,E(w)):p<.52?lerp(-1,31,s*s):p<.66?31:lerp(31,10,E(r)),fy=-15+Math.sin(ang)*4;
      P.front={x:fx,y:fy,ang};P.back={x:fx-Math.cos(ang)*17,y:fy-Math.sin(ang)*17,ang};
      P.lean=p<.38?-3*E(w):p<.66?lerp(-3,7,Math.min(1,s*1.5)):7*(1-E(r));P.stride=P.lean>2?1.4:0;P.crouch=P.lean>2?2:0;
    }else if(type==='staff'){
      const hand=st.right==='staff'?P.front:P.back,w=seg(p,0,.46),s=seg(p,.46,.62),r=seg(p,.62,1);
      if(p<.46){hand.x=lerp(11,5,E(w));hand.y=lerp(-13,-37,E(w));hand.ang=lerp(-1.45,-2.25,E(w));P.charge=E(w);P.lean=-1.5*E(w);}
      else if(p<.62){hand.x=lerp(5,21,s);hand.y=lerp(-37,-19+tilt*9,s);hand.ang=lerp(-2.25,tilt-.2,s);P.charge=1-s;P.lean=4*s;}
      else{hand.x=lerp(21,11,E(r));hand.y=lerp(-19+tilt*9,-13,E(r));hand.ang=lerp(tilt-.2,-1.45,E(r));P.lean=4*(1-E(r));}
      if(st.dual){P.back.x=hand.x-9;P.back.y=hand.y+3;P.back.ang=hand.ang+.15;}
    }else if(type==='bow'){
      const raise=E(seg(p,0,.2))*(1-E(seg(p,.74,1))),draw=E(seg(p,.08,.62)),rel=p>=.62;
      const ang=lerp(1.15,tilt,raise),d={x:Math.cos(ang),y:Math.sin(ang)};
      const bh={x:SH.front.x+d.x*lerp(9,19,raise),y:SH.front.y+d.y*lerp(9,19,raise)+lerp(10,0,raise)};
      const pull=rel?lerp(18,2,seg(p,.62,.68)):lerp(2,22,draw);P.pull=pull;P.arrow=!rel&&p>.04;
      const string={x:bh.x-d.x*(4+pull),y:bh.y-d.y*(4+pull)},follow=rel?(1-seg(p,.62,.9))*7:0;
      P.front={x:bh.x,y:bh.y,ang};P.back={x:(rel?bh.x-d.x*26:string.x)-d.x*follow,y:(rel?bh.y-d.y*26:string.y)-d.y*follow,ang};P.lean=raise*1.5;
    }else if(type==='crossbow'){
      const raise=E(seg(p,0,.15))*(1-E(seg(p,.93,1))),reload=seg(p,.4,.88),ang=lerp(.45,tilt,raise)+(p>.4&&p<.88?Math.sin(reload*Math.PI)*.35:0);
      const recoil=p>=.22?(1-seg(p,.22,.42))**2*7:0,d={x:Math.cos(ang),y:Math.sin(ang)};
      const fh={x:SH.front.x+d.x*(16-recoil),y:SH.front.y+d.y*(16-recoil)+lerp(9,0,raise)};
      const loaded=p<.22||p>.88,string=loaded?-6:p<.4?7:lerp(7,-6,E(reload));
      const crank=p>.4&&p<.88?Math.sin(reload*Math.PI*3)*4:0;
      P.front={x:fh.x,y:fh.y,ang};P.back={x:fh.x+d.x*(string-4)-d.y*crank,y:fh.y+d.y*(string-4)+d.x*crank+2,ang};
      P.cb={string,bolt:loaded,flash:p>=.22&&p<.3};P.lean=-recoil*.5;
    }
    return P;
  }
  // Nhìn 3/4 từ phía trước: tay phải nhân vật luôn ở bên trái màn hình, tay trái ở bên phải.
  // Quay trái (lật hình) thì tay phải đã nằm phía trước; quay phải thì dời tay cầm vũ khí chính ra sau thân, tay kia ra trước.
  // Tay nào đang ra đòn (hand của dáng): front = tay phải, back = tay trái, both = cả hai, null = không
  function atkHand(a,st){
    if(!a||a.type==='block')return null;const T=a.type;
    if(T==='heal')return 'both';if(T==='sword'||T==='saber'||T==='mace')return st.two?'both':a.hand==='left'?'back':'front';
    if(T==='shield')return st.right==='shield'?'front':'back';if(T==='staff')return st.right==='staff'?'front':'back';
    return 'front';
  }
  // Quay trái (7 giờ, theo phác thảo của tác giả): tay phải buông thấp phía trước, kiếm/gậy chĩa chếch lên bên trái thấy trọn;
  // tay trái co lại, khiên đưa ra bên hông phía sau (mặt ngoài nhìn thẳng), cả hai vẽ trước thân. Khi ra đòn thì về dáng đòn như thường.
  // Dáng quay trái (tác giả chọn, v10.6): khiên trước ngực nhìn thẳng mặt ngoài vẽ trên thân; tay phải buông thấp, kiếm chĩa xuống trước, vẽ sau thân (lộ phần lưỡi bên hông trái)
  const LEFT_POSE={sw:{x:12,y:-8,ang:.35},sh:{x:-7,y:-14},face:true,swBack:true};
  const HIDE_ANG={sword:-.78,saber:-.78,mace:-.9,staff:-1.0,punch:-1.6};
  function handSide(P,st,facing,a){
    const ah=atkHand(a,st);
    // Quay trái chỉ dùng dáng riêng (LEFT_POSE) khi đứng / đi / đỡ có cầm đồ một tay; tay không, vũ khí hai tay và lúc ra đòn thì vẽ đối xứng gương với quay phải
    const mirror=facing>0||st.two||P.heal||!(st.right||st.left)||(ah&&!P.block);
    if(mirror){const dW=st.two?0:-15,dO=st.two?0:15;P.front.x+=dW;P.back.x+=dO;if(P.trail)P.trail.cx+=dW;P.sh={front:{x:-8,y:-23},back:{x:8,y:-23}};}
    else{P.sh={front:{x:8,y:-23},back:{x:-8,y:-23}};
      if(!(P.block&&st.right==='shield')){const V=LEFT_POSE;P.hide=true;P.lp={...V};
        P.front={x:V.sw.x,y:V.sw.y,ang:MELEE1(st.right)?V.sw.ang:(HIDE_ANG[st.right]!==undefined?HIDE_ANG[st.right]:-1.1)};
        if(!P.block)P.back={x:V.sh.x,y:V.sh.y,ang:P.back.ang};}}
    return P;
  }
  function drawArm(c,sx,sy,hx,hy,sleeve,skin){
    const dx=hx-sx,dy=hy-sy,dd=Math.hypot(dx,dy)||1,d=Math.min(19.5,dd),ux=dx/dd,uy=dy/dd,off=Math.sqrt(Math.max(0,100-(d/2)**2));
    let px=-uy,py=ux;if(py<0){px=-px;py=-py;}
    const ex=sx+dx/2+px*off*.9,ey=sy+dy/2+py*off*.9;
    oline(c,[sx,sy,ex,ey,hx,hy],sleeve,5);ell(c,ex,ey,2.4,2.4,shade(sleeve,-.12));
    c.fillStyle=skin;c.strokeStyle=shade(skin,-.5);c.lineWidth=1;c.beginPath();c.arc(hx,hy,3.5,0,PI2);c.fill();c.stroke();
  }
  function glow(c,el,blur){if(el){c.shadowColor=EL[el].color;c.shadowBlur=blur;}}
  let curLook=null; // dáng vẻ món vũ khí đang vẽ (bộ huyền thoại / đồ thần: chuôi, đốc theo màu bộ)
  function drawSword(c,el,tint){const G=curLook&&(curLook.legend||curLook.fx)?curLook:null;line(c,[-6,0,3,0],G?G.main:'#5a4330',4);c.fillStyle=G?G.trim:'#c9a85f';c.beginPath();c.arc(-7,0,2.5,0,PI2);c.fill();line(c,[3,-6,3,6],G?G.trim:'#c9a85f',3);c.save();glow(c,el,10);c.fillStyle=tint||'#dfe6ea';c.beginPath();c.moveTo(5,-2.3);c.lineTo(31,-1.6);c.lineTo(38,0);c.lineTo(31,1.6);c.lineTo(5,2.3);c.closePath();c.fill();c.restore();line(c,[7,0,29,0],'#9fb0b8',1);}
  // v10.14: đao (lưỡi cong rộng, đốc đồng) và chùy (cán gỗ, đầu sắt tròn có gai)
  function drawSaber(c,el,tint){const G=curLook&&(curLook.legend||curLook.fx)?curLook:null;line(c,[-7,0,3,0],G?G.main:'#4a3320',4);c.fillStyle=G?G.trim:'#c9a85f';c.beginPath();c.arc(-8,0,2.6,0,PI2);c.fill();line(c,[3,-5,3,5],G?G.trim:'#c9a85f',3);c.save();glow(c,el,10);c.fillStyle=tint||'#d8e0e4';c.beginPath();c.moveTo(4,-2);c.quadraticCurveTo(26,-9,40,-9);c.quadraticCurveTo(30,-1,22,3);c.lineTo(4,3);c.closePath();c.fill();c.restore();c.strokeStyle='#8fa0a8';c.lineWidth=1;c.beginPath();c.moveTo(7,-1);c.quadraticCurveTo(22,-5,33,-6);c.stroke();}
  function drawMace(c,el,tint){const G=curLook&&(curLook.legend||curLook.fx)?curLook:null;line(c,[-8,0,22,0],G?G.main:'#6a4a2c',3.5);c.fillStyle=G?G.trim:'#c9a85f';c.beginPath();c.arc(-9,0,2.6,0,PI2);c.fill();c.save();glow(c,el,10);c.fillStyle=tint||'#8a8f96';c.beginPath();c.arc(28,0,7.5,0,PI2);c.fill();c.restore();c.fillStyle=tint?shade(tint,-.25):'#5a5f66';for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(28+Math.cos(a)*6,Math.sin(a)*6);c.lineTo(28+Math.cos(a)*11,Math.sin(a)*11);c.lineTo(28+Math.cos(a+.4)*6,Math.sin(a+.4)*6);c.fill();}c.fillStyle='#ffffff44';c.beginPath();c.arc(26,-2,2.5,0,PI2);c.fill();}
  function drawSpear(c,el,tint){line(c,[-30,0,36,0],'#9a7448',3);c.save();glow(c,el,10);c.fillStyle=tint||'#dfe3da';c.beginPath();c.moveTo(35,-4.5);c.lineTo(48,0);c.lineTo(35,4.5);c.closePath();c.fill();c.restore();c.fillStyle='#6f7a74';c.fillRect(32,-2.5,4,5);const tc=curLook&&(curLook.legend||curLook.fx)?curLook.main:'#b8433a';line(c,[33,2,31,9],tc,1.6);line(c,[34,2,34,10],tc,1.6);}
  function drawStaff(c,el,charge,t,tint){line(c,[-22,0,26,0],'#7d5d3a',3.5);line(c,[22,-3,22,3],'#c9a85f',2);line(c,[26,0,29,-5],'#7d5d3a',2);line(c,[26,0,29,5],'#7d5d3a',2);const col=el?EL[el].color:curLook&&(curLook.legend||curLook.fx)?curLook.trim:tint||'#a6baff',r=5+charge*3.5+Math.sin(t*6)*.6;c.save();c.shadowColor=col;c.shadowBlur=8+charge*16;c.fillStyle=col;c.beginPath();c.arc(31,0,r,0,PI2);c.fill();c.fillStyle='#ffffffcc';c.beginPath();c.arc(30,-1.5,r*.35,0,PI2);c.fill();c.restore();}
  // Khiên: nhìn nghiêng (cạnh) khi ở tay sau / đang chặn; nhìn thẳng mặt ngoài (face) khi đưa ra trước lúc quay trái hoặc đeo sau lưng
  function drawShield(c,back,blocking,t,tint,face){c.save();if(blocking){c.shadowColor='#f4dd9a';c.shadowBlur=14+Math.sin(t*20)*4;}const G=curLook&&(curLook.legend||curLook.fx)?curLook:null,col=G?G.main:tint||(back?'#8a6a3a':'#a07a46'),trim=G?G.trim:'#d0bc7b';
    if(face){c.fillStyle=col;c.strokeStyle=trim;c.lineWidth=2.2;c.beginPath();c.ellipse(0,0,12,15,0,0,PI2);c.fill();c.stroke();c.restore();
      c.strokeStyle=shade(col,-.3);c.lineWidth=1;c.beginPath();c.ellipse(0,0,8.5,11,0,0,PI2);c.stroke();for(let k=-8;k<=8;k+=4){c.beginPath();c.moveTo(-9+Math.abs(k)*.5,k);c.lineTo(9-Math.abs(k)*.5,k);c.stroke();}
      c.fillStyle=trim;for(const [x,y] of [[0,-10],[0,10],[-7,0],[7,0]]){c.beginPath();c.arc(x,y,1.5,0,PI2);c.fill();}c.beginPath();c.arc(0,0,4,0,PI2);c.fill();c.fillStyle='#ffffff55';c.beginPath();c.arc(-1,-1.5,1.6,0,PI2);c.fill();return;}
    c.fillStyle=col;c.strokeStyle=trim;c.lineWidth=2;c.beginPath();c.ellipse(2,0,7,15,0,0,PI2);c.fill();c.stroke();c.restore();c.strokeStyle='#6b4a2e';c.lineWidth=1;for(let k=-10;k<=10;k+=5){c.beginPath();c.moveTo(-3,k);c.lineTo(7,k);c.stroke();}c.fillStyle='#d0bc7b';c.beginPath();c.arc(2.5,0,3,0,PI2);c.fill();}
  function drawBow(c,pull,arrow,el,tint){
    const sx=-(4+pull);line(c,[-4,-22,sx,0,-4,22],'#efe6cc',1.2);
    c.strokeStyle=tint||'#caa16b';c.lineWidth=3;c.beginPath();c.moveTo(-4,-22);c.quadraticCurveTo(9,-12,0,0);c.quadraticCurveTo(9,12,-4,22);c.stroke();line(c,[-1,-3,-1,3],'#6b4a2e',4);
    if(arrow){c.save();glow(c,el,8);line(c,[sx,0,16,0],'#e9dcb4',1.8);c.fillStyle='#cfd5d8';c.beginPath();c.moveTo(16,-3);c.lineTo(22,0);c.lineTo(16,3);c.fill();c.restore();line(c,[sx+1,-3,sx+5,0,sx+1,3],'#c8553f',1.5);}
  }
  function drawCrossbow(c,cb,el,tint){
    roundRect(c,-24,-3,8,7,2,'#5f4229');line(c,[-18,0,12,0],tint||'#7a5634',5);line(c,[-4,2,-6,8],'#3d3020',2.5);
    c.strokeStyle='#3d4a52';c.lineWidth=3;c.beginPath();c.moveTo(6,-15);c.quadraticCurveTo(14,-4,10,0);c.quadraticCurveTo(14,4,6,15);c.stroke();
    line(c,[6,-15,cb.string,0,6,15],'#efe6cc',1.2);
    if(cb.bolt){c.save();glow(c,el,8);line(c,[cb.string,-1.5,16,-1.5],'#d8d0b0',2.2);c.fillStyle='#bfc6c9';c.beginPath();c.moveTo(16,-4.5);c.lineTo(22,-1.5);c.lineTo(16,1.5);c.fill();c.restore();}
    if(cb.flash){c.fillStyle='#fff3b0';c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?4:11;c.lineTo(24+Math.cos(a)*r,Math.sin(a)*r);}c.fill();}
  }
  // Ảnh vũ khí trong Sheet Hình ảnh (vat_pham:<mã>): vẽ ảnh thay hình mặc định. Ảnh vẽ chéo, chuôi ở góc dưới trái, mũi ở góc trên phải.
  const PIC_LEN={sword:36,spear:62,staff:46,saber:40,mace:36};
  function drawHeld(c,type,hp,P,el,t,role,tint,it){
    if(!type)return;c.save();c.translate(hp.x,hp.y);if(hp.s)c.scale(hp.s,hp.s);curLook=it?LH_Look.of(it):null;
    const pic=it&&type!=='bow'&&type!=='crossbow'?LH_IMG.pic('vat_pham:'+it):null;
    if(pic){
      if(type==='shield'){const sz=P.block?26:22;c.drawImage(pic,-sz/2,-sz/2,sz,sz);}
      else{const s=PIC_LEN[type]/1.15;c.rotate(hp.ang+Math.PI/4);if(el){c.shadowColor=EL[el].glow;c.shadowBlur=10;}c.drawImage(pic,-s*.14,-s*.86,s,s);}
      c.restore();return;
    }
    if(type==='shield')drawShield(c,role==='back',P.block,t,tint,role==='front'||role==='carry');
    else{c.rotate(hp.ang);if(type==='sword')drawSword(c,el,tint);else if(type==='saber')drawSaber(c,el,tint);else if(type==='mace')drawMace(c,el,tint);else if(type==='spear')drawSpear(c,el,tint);else if(type==='staff')drawStaff(c,el,P.charge,t,tint);else if(type==='bow')drawBow(c,P.pull,P.arrow,el,tint);else if(type==='crossbow')drawCrossbow(c,P.cb,el,tint);}
    c.restore();
  }
  function drawWings(c,t){const f=Math.sin(t*4)*.12;c.save();c.translate(-4,-22);c.rotate(-.1+f);c.fillStyle='#e9eef4dd';c.strokeStyle='#b9c6d3';c.lineWidth=1;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-26,-40,-40,-12);c.quadraticCurveTo(-28,-12,-22,4);c.quadraticCurveTo(-12,0,0,8);c.closePath();c.fill();c.stroke();for(let i=1;i<4;i++){c.beginPath();c.moveTo(-4,2);c.lineTo(-12-i*8,-14+i*5);c.stroke();}c.restore();}
  function drawHorse(c,tint,moving,walk,t){
    const g=moving?walk*1.6:0,dark='#00000033',mane=tint==='#ece6da'?'#d8cfc0':'#2a1d14';
    const leg=(x,ph,col)=>{const k=moving?Math.sin(g+ph):0;line(c,[x,-14,x+k*6,-6,x+k*3,2],col,4);ell(c,x+k*3+1,2,3,1.6,'#2a2420');};
    leg(-14,0,tint);leg(12,Math.PI,tint);
    c.strokeStyle=mane;c.lineWidth=4;c.beginPath();c.moveTo(-22,-24);c.quadraticCurveTo(-32,-18+(moving?Math.sin(g)*3:0),-30,-6);c.stroke();
    ell(c,0,-22,23,10,tint);ell(c,0,-18,18,5,dark);
    line(c,[14,-26,23,-40],tint,10);c.save();c.translate(29,-40+(moving?Math.sin(g*2)*1.5:Math.sin(t*1.5)));c.rotate(.55);ell(c,0,0,10,5.5,tint);ell(c,7,1,3,2.5,'#00000044');c.restore();
    line(c,[13,-31,21,-46],mane,4);line(c,[24,-45,25,-51],tint,3);
    leg(-10,Math.PI,tint);leg(16,0,tint);
    roundRect(c,-10,-34,18,7,3,'#6b3a24');line(c,[-1,-27,-1,-12],'#4a2c18',1.5);
  }
  function drawAura(c,x,y,el,t,k=1){
    const C=EL[el];c.save();
    const g=c.createRadialGradient(x,y,2,x,y,40*k);g.addColorStop(0,C.color+'66');g.addColorStop(1,C.color+'00');c.fillStyle=g;c.beginPath();c.ellipse(x,y,40*k,16*k,0,0,PI2);c.fill();
    c.lineCap='round';
    if(el==='fire'){for(let i=0;i<7;i++){const ph=(t*1.1+i/7)%1,px=x+Math.sin(i*2.1+t*2)*16*k,py=y-4-ph*60*k,s=(1-ph)*6*k;c.globalAlpha=1-ph;c.fillStyle=ph<.4?C.glow:C.color;c.beginPath();c.ellipse(px,py,s*.7,s,0,0,PI2);c.fill();}}
    else if(el==='water'){for(let i=0;i<5;i++){const a=t*1.5+i*1.2566,px=x+Math.cos(a)*24*k,py=y-24*k+Math.sin(a)*9*k;c.globalAlpha=.6+Math.sin(a)*.35;c.fillStyle=C.color;c.beginPath();c.moveTo(px,py-6*k);c.quadraticCurveTo(px+4*k,py,px,py+3*k);c.quadraticCurveTo(px-4*k,py,px,py-6*k);c.fill();}}
    else if(el==='earth'){for(let i=0;i<5;i++){const a=-t*1.1+i*1.2566,px=x+Math.cos(a)*26*k,py=y-8*k+Math.sin(a)*8*k-Math.abs(Math.sin(t*2+i))*8*k;c.globalAlpha=.9;poly(c,[px-4*k,py,px-1*k,py-4*k,px+4*k,py-2*k,px+3*k,py+3*k,px-2*k,py+3*k],i%2?C.color:'#9b7448');}}
    else if(el==='metal'){c.strokeStyle=C.color;c.lineWidth=2;c.translate(x,y-24*k);c.scale(1,.42);for(let i=0;i<6;i++){const a=t*2.4+i*1.047;c.globalAlpha=.85;c.beginPath();c.moveTo(Math.cos(a)*22*k,Math.sin(a)*22*k);c.lineTo(Math.cos(a+.35)*30*k,Math.sin(a+.35)*30*k);c.stroke();}c.globalAlpha=.5;c.beginPath();c.arc(0,0,26*k,0,PI2);c.stroke();}
    else if(el==='thunder'){c.strokeStyle=C.color;c.lineWidth=1.8;for(let i=0;i<4;i++){if(Math.sin(t*9+i*2.3)<.2)continue;const a=t*1.7+i*1.57,px=x+Math.cos(a)*24*k,py=y-22*k+Math.sin(a)*12*k;c.globalAlpha=.9;c.beginPath();c.moveTo(px,py-8*k);c.lineTo(px+3*k,py-2*k);c.lineTo(px-2*k,py);c.lineTo(px+2*k,py+7*k);c.stroke();}}
    else if(el==='wind'){c.strokeStyle=C.color;c.lineWidth=2;for(let i=0;i<3;i++){const a=t*3+i*2.1;c.globalAlpha=.75;c.beginPath();c.ellipse(x,y-8*k-i*14*k,(26-i*4)*k,7*k,0,a,a+2.4);c.stroke();}}
    else if(el==='ice'){c.strokeStyle=C.glow;c.lineWidth=1.4;for(let i=0;i<5;i++){const a=t*.9+i*1.2566,px=x+Math.cos(a)*24*k,py=y-22*k+Math.sin(a)*10*k;c.globalAlpha=.9;for(let j=0;j<3;j++){const b=j*Math.PI/3;c.beginPath();c.moveTo(px-Math.cos(b)*4*k,py-Math.sin(b)*4*k);c.lineTo(px+Math.cos(b)*4*k,py+Math.sin(b)*4*k);c.stroke();}}}
    else if(el==='demon'){for(let i=0;i<6;i++){const ph=(t*.7+i/6)%1,px=x+Math.sin(i*2.4+t)*18*k,py=y-ph*54*k;c.globalAlpha=(1-ph)*.7;c.fillStyle=i%2?C.color:'#4a1838';c.beginPath();c.ellipse(px,py,(4+ph*6)*k,(3+ph*4)*k,0,0,PI2);c.fill();}}
    else if(el==='light'){c.strokeStyle=C.color;c.lineWidth=2;c.globalAlpha=.55;c.beginPath();c.ellipse(x,y-58*k,11*k,4*k,0,0,PI2);c.stroke();for(let i=0;i<8;i++){const a=t*.8+i*.785;c.globalAlpha=.35+Math.sin(t*3+i)*.2;c.beginPath();c.moveTo(x+Math.cos(a)*14*k,y-24*k+Math.sin(a)*7*k);c.lineTo(x+Math.cos(a)*34*k,y-24*k+Math.sin(a)*15*k);c.stroke();}}
    else if(el==='wood'){c.fillStyle=C.color;for(let i=0;i<5;i++){const a=t*1.1+i*1.2566,px=x+Math.cos(a)*24*k,py=y-20*k+Math.sin(a)*10*k-Math.sin(t*2+i)*6*k;c.globalAlpha=.85;c.beginPath();c.ellipse(px,py,5*k,2.4*k,a,0,PI2);c.fill();}}
    c.restore();
  }
  function drawTiger(c,moving,walk,t,saddle=true,tint){
    const g=moving?walk*1.8:0,body=tint||'#e08a2e',dark='#2a1a10',belly=tint?shade(tint,.3):'#f4e6d0',legc=tint?shade(tint,-.12):'#c9772a';
    const leg=(x,ph,col)=>{const k=moving?Math.sin(g+ph):0;line(c,[x,-12,x+k*7,-4,x+k*4,1],col,5);ell(c,x+k*4+1,2,3.5,1.8,belly);};
    leg(-14,0,legc);leg(12,Math.PI,legc);
    c.strokeStyle=body;c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-22,-18);c.quadraticCurveTo(-36,-22,-34,-34+Math.sin(t*3)*3);c.stroke();
    ell(c,0,-18,23,9,body);ell(c,0,-12,17,4,belly);
    c.strokeStyle=dark;c.lineWidth=2.2;for(let i=-16;i<=12;i+=6){c.beginPath();c.moveTo(i,-26);c.quadraticCurveTo(i+3,-20,i,-14);c.stroke();}
    leg(-10,Math.PI,body);leg(16,0,body);
    ell(c,25,-24,10,9,body);ell(c,32,-21,5,4,belly);poly(c,[18,-30,20,-37,25,-32],body);poly(c,[26,-32,29,-37,31,-30],body);
    c.fillStyle=dark;c.fillRect(27,-27,2.5,2.5);c.fillRect(35,-23,2.5,2);line(c,[21,-30,23,-26],dark,1.5);line(c,[26,-33,26,-29],dark,1.5);
    if(saddle)roundRect(c,-10,-30,18,6,3,'#6b3a24');
  }
  function drawElephantMount(c,tint,moving,walk,t){
    const g=moving?walk*1.2:0,col=tint||'#8e9398',dk='#7b8086';
    const lg=(x,ph,cl)=>roundRect(c,x+(moving?Math.sin(g+ph)*3:0)-6,-26,12,26,4,cl);
    lg(-22,0,dk);lg(16,Math.PI,dk);line(c,[-34,-38,-40,-24],col,2.5);
    ell(c,0,-36,34,20,col);lg(-14,Math.PI,col);lg(22,0,col);
    ell(c,32,-44,13,13,col);ell(c,24,-44,10,14,dk);
    const sw=Math.sin(t*1.5)*3;c.strokeStyle=col;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(42,-40);c.quadraticCurveTo(52,-24+sw,46,-6+sw);c.stroke();
    line(c,[39,-34,47,-31,50,-36],'#f2ead8',3);c.fillStyle='#2d2b29';c.fillRect(36,-49,2.5,2.5);
    poly(c,[-22,-52,14,-52,18,-34,-26,-34],'#b8443a');line(c,[-24,-37,16,-37],'#e7c46a',2);for(let k=-20;k<14;k+=8)ell(c,k,-34,1.8,1.8,'#e7c46a');
    roundRect(c,-14,-58,22,8,2,'#6b3a24');
  }
  // Kỳ lân: thân ngựa vảy vàng, sừng, bờm lửa
  // v10.18: kỳ lân, rồng, phượng hoàng, cửu vĩ hồ, huyền vũ vẽ ở src/04-boss.js (LH_BOSS.mount)
  function drawMount(c,md,moving,walk,t){if(md.beast==='tiger'){c.save();c.scale(1.3,1.3);drawTiger(c,moving,walk,t,true,md.tint&&md.tint!=='#e08a2e'?md.tint:null);c.restore();}else if(md.beast==='elephant')drawElephantMount(c,md.tint,moving,walk,t);else if(LH_BOSS.mount[md.beast])LH_BOSS.mount[md.beast](c,md.tint,moving,walk,t); // v10.18: phượng hoàng, cửu vĩ hồ, huyền vũ
    else if(md.beast==='thienma'){LH_BOSS.mount.wings(c,t,moving,false);drawHorse(c,md.tint||'#fff4e0',moving,walk,t);LH_BOSS.mount.wings(c,t,moving,true);}else drawHorse(c,md.tint||'#7a4b2a',moving,walk,t);}
  function seatOf(eq){if(safe)return 0;const md=eq&&eq.mount&&Player.info(eq.mount);return md?Player.BEASTS[md.beast].seat:0;}
  function seatH(){return seatOf(player.equipment);}
  // Thú cưỡi nghiêng người khi dùng kỹ năng: ngựa chổng hậu, voi chồm lên, hổ lao tới
  function mountRot(h,t){const m=h.mountAct;if(!m)return null;const p=clamp((t-m.start)/m.dur,0,1),k=Math.sin(Math.PI*p);
    if(m.type==='horse')return {px:14,rot:.32*k};if(m.type==='elephant')return {px:-20,rot:-.32*Math.sin(Math.PI*Math.min(1,p/m.hit))};if(m.type==='kylan')return {px:-10,rot:-.28*k};if(m.type==='rong')return {px:-10,rot:-.12*k};return {px:0,rot:-.22*k};}
  // Mặc định: nam cởi trần đóng khố, nữ mặc yếm váy
  function drawHero(c,h,st,el,t,opts={}){
    // Trong vùng an toàn (làng, thành): thu vũ khí — kiếm dắt bên hông, khiên / cung / nỏ / giáo / gậy đeo sau lưng; tay vung theo bước đi. Đang ra đòn hoặc xem trước (túi đồ, chân dung) thì vẫn cầm.
    const who=opts.who||player,eq=who.equipment,info=Player.info,a=h.attack,sheathed=safe&&!a&&!opts.armed&&t>=h.blockUntil,stP=sheathed?{...st,right:null,left:null,two:false,dual:false,type:'punch'}:st,P=handSide(heroPose(h,stP,a,t),stP,h.facing,a),flash=t-h.hurt<.12,md=!safe&&eq.mount&&info(eq.mount),mounted=!!md,seat=mounted?Player.BEASTS[md.beast].seat:0,big=mounted&&md.beast==='elephant',fem=who.gender==='f';
    // đeo cánh (không phải áo choàng / cờ) và không cưỡi thú: lơ lửng cách đất, di chuyển thì lướt, chân không bước
    const LWk=eq.wings&&LH_Look.of(eq.wings.type),flying=!!(LWk&&LWk.kind==='wings'&&!mounted&&!h.dead),hover=flying?-9+Math.sin(t*2.6+h.x*.01)*2.2:0;
    const AV=Player.AVATARS[who.avatar]||null,bob=flying?hover:h.moving?-Math.abs(Math.sin(h.walk))*(mounted?1.4:2.2):Math.sin(t*2)*.6,SKIN=AV?shade(AV.skin,-.07):'#d9ad80';
    c.save();if(h.dead)c.globalAlpha=.45;
    ell(c,h.x,h.y+5,big?42:mounted?28:flying?11:15,big?12:mounted?8:flying?4:7,flying?'#243d3530':'#243d3544');
    if(el)drawAura(c,h.x,h.y,el,t,big?1.6:mounted?1.25:1);
    if(t<h.barrierUntil){c.save();c.globalAlpha=.35+Math.sin(t*12)*.1;c.strokeStyle='#9fe8a8';c.lineWidth=3;c.beginPath();c.ellipse(h.x,h.y-22-seat,26,34,0,0,PI2);c.stroke();c.restore();}
    c.save();c.translate(h.x,h.y);c.scale(h.facing,1);
    if(mounted){const r=opts.still?null:mountRot(h,t);if(r){c.translate(r.px,0);c.rotate(r.rot);c.translate(-r.px,0);}drawMount(c,md,h.moving,h.walk,t);c.translate(0,-seat);}
    c.translate(P.lean,bob+P.crouch);
    // dáng vẻ từng món đang mặc (áo choàng / cờ / cánh, kiểu mũ, áo, váy, giày…), cùng bảng với ảnh biểu tượng
    const LK=s=>eq[s]&&LH_Look.of(eq[s].type),LW=LK('wings'),LA=LK('armor'),LH=LK('hat'),LP=LK('pants'),LG=LK('gloves'),LS=LK('shoes');
    const myth=Player.slots.map(LK).filter(x=>x&&x.fx);
    if(LW)LH_Look.back(c,LW,t,h.moving);
    const sleeve=LA?LA.main:SKIN,skin=LG?LG.main:SKIN;
    const held=(type,hp,role,tn,lv,it)=>{c.save();if(lv>=7){c.shadowColor=lv>=10?'#ff6a3a':'#ffd77a';c.shadowBlur=6+lv;}const L=it&&LH_Look.of(it);if(L&&L.fx)LH_Look.mythGlow(c,L);drawHeld(c,type,hp,P,el,t,role,tn,it);c.restore();};
    const backTop=a&&a.hand==='left'&&a.type==='sword',hide=!!P.hide&&!sheathed;
    if(sheathed){P.hide=false;P.trail=null;} // trong làng: tay như lúc tay không (một tay co trước bụng, tay kia buông), vũ khí dắt / đeo
    if(fem)ell(c,-7,-31,6,11,'#2a2622'); // tóc dài sau lưng
    // đồ đeo sau lưng (vẽ trước thân): khiên, cung, nỏ, giáo, gậy, kiếm thứ hai; kiếm chính dắt bên hông (vẽ trước thân, hé chuôi và mũi)
    if(sheathed){
      // Kiếm dắt hông, đồ đeo lưng: vẽ cùng tọa độ cục bộ cho hai hướng → quay trái là ảnh gương của quay phải
      const f=1,carry=(type,it,tn,lv,x,y,ang)=>{if(type)held(type,{x,y,ang},'carry',tn,lv,it);}; // hai hướng đối xứng gương (tác giả chốt v10.9)
      const R=st.right,L=st.left;
      // đồ dài (cung, nỏ, giáo, gậy, kiếm thứ hai) đeo chéo sau lưng: đầu trên nhô qua vai phải (bên trái màn hình), đầu dưới ló dưới hông trái
      const diag=(type,it,tn,lv)=>{const d=f>0?.9:Math.PI-.9,bow=type==='bow'||type==='crossbow',off=type==='spear'?-9:type==='sword'?-16:0;carry(type,it,tn,lv,-f*4+Math.cos(d)*off,-26+Math.sin(d)*off,bow?d-Math.PI/2:d);}; // cung / nỏ vẽ vuông góc với hướng ngắm nên xoay thêm 90°
      // khiên đeo lưng: nhô lên sau vai trái, nhìn thẳng mặt ngoài
      if(L==='shield')carry('shield',st.itL,st.tintL,st.lvL,f*8,-30,0);else if(R==='shield')carry('shield',st.itR,st.tintR,st.lvR,f*8,-30,0);
      if(L&&L!=='shield')diag(L,st.itL,st.tintL,st.lvL);
      if(R&&R!=='shield'&&R!=='sword')diag(R,st.itR,st.tintR,st.lvR);
      drawArm(c,P.sh.back.x,P.sh.back.y,P.back.x,P.back.y,sleeve,skin);
    }
    const hipSword=()=>{if(sheathed&&st.right==='sword')held('sword',{x:9,y:-11,ang:1.42,s:.8},'carry',st.tintR,st.lvR,st.itR);};
    // quay trái: món tay phải (kiếm, gậy) vẽ trước thân → khuất sau người, chỉ lộ phần lưỡi nhô lên vai
    const LPZ=hide?P.lp:null;
    if(sheathed){}
    else if(hide){if(LPZ.shBack){held(st.left,P.back,LPZ.face?'front':'back',st.tintL,st.lvL,st.itL);drawArm(c,P.sh.back.x,P.sh.back.y,P.back.x,P.back.y,sleeve,skin);}
      if(LPZ.swBack){held(st.right,P.front,'back',st.tintR,st.lvR,st.itR);drawArm(c,P.sh.front.x,P.sh.front.y,P.front.x,P.front.y,sleeve,skin);}}
    else{if(!st.two&&!backTop)held(st.left,P.back,'back',st.tintL,st.lvL,st.itL);
      if(!backTop)drawArm(c,P.sh.back.x,P.sh.back.y,P.back.x,P.back.y,sleeve,skin);}
    const skirt=LP&&LP.kind==='skirt',pants=LP&&!skirt?LP.main:SKIN,boot=LS?LS.main:null;
    const foot=(x,y)=>{if(boot){roundRect(c,x-4,y-2,8,5,2,boot);line(c,[x-3,y-1.5,x+3,y-1.5],shade(boot,.25),1);}else ell(c,x,y+1,3.8,2.1,shade(SKIN,-.05));};
    if(mounted){oline(c,[0,-6,9,-2,7,9],pants,5.5);foot(6,10);}
    else{const w=h.moving&&!flying?Math.sin(h.walk):0,l1=Math.max(0,w)*3,l2=Math.max(0,-w)*3,st2=flying?0:P.stride*3;oline(c,[-4,-6,-4.5-st2*.3,5-l1],pants,5.5);oline(c,[4,-6,4.5+st2,5-l2],pants,5.5);foot(-4.5-st2*.3,6-l1);foot(4.5+st2,6-l2);}
    if(skirt){poly(c,mounted?[-11,-9,11,-9,14,3,-8,5]:[-12,-9,12,-9,15,4,-15,4],LP.main);line(c,[-12,-8,12,-8],LP.trim,2);}
    else if(!eq.pants){
      if(fem){poly(c,mounted?[-11,-9,11,-9,14,3,-8,5]:[-12,-9,12,-9,15,4,-15,4],'#5a3a2e');line(c,[-12,-8,12,-8],'#8a5a3a',2);} // váy
      else{c.fillStyle='#8b3a2a';c.fillRect(-12,-10,24,5);poly(c,[-4,-6,4,-6,3,4,-3,4],'#8b3a2a');} // khố
    }
    if(LA)LH_Look.robeSkirt(c,LA,h.moving&&!mounted,h.walk);
    const body=flash?'#fff3e6':LA?LA.main:SKIN;torso(c,-12,-27,24,23,6,body);
    if(LA)LH_Look.armor(c,LA,fem);
    else if(!fem){c.strokeStyle='#a87c55';c.lineWidth=1.1;c.beginPath();c.moveTo(-6,-20);c.quadraticCurveTo(-1,-17,1,-20);c.moveTo(2,-20);c.quadraticCurveTo(6,-17,9,-20);c.stroke();line(c,[1,-15,1,-9],'#b88a60',1);line(c,[-2,-13,4,-13],'#c09068',.8);line(c,[-2,-10.5,4,-10.5],'#c09068',.8);}
    else if(fem){poly(c,[0,-25,9,-16,0,-7,-9,-16],'#c0392b');line(c,[-5,-21,-4,-28],'#c0392b',1.2);line(c,[5,-21,4,-28],'#c0392b',1.2);} // yếm
    else line(c,[-6,-21,0,-18,6,-21],'#b88a60',1.4);
    if(eq.pants&&!skirt){c.fillStyle=LP.legend?LP.alt:'#a8343a';c.fillRect(-12,-10,24,4);roundRect(c,5,-11,5,6,1,LP.trim);line(c,[-11,-6,-14,0],LP.legend?LP.alt:'#a8343a',2);}
    if(LW)LH_Look.front(c,LW);
    const HAIR=AV?AV.hair:'#2a2622',HS=AV?AV.style:'';faceQ(c,{skin:flash?'#fff3e6':AV?AV.skin:'#e1c295',fem,t,ph:h.x*.01,eye:AV?AV.eye:undefined,mark:AV?AV.mark:'',beard:AV&&AV.beard||null});hairQ(c,HAIR,HS);
    if(HS==='troc'){}
    else if(fem){ell(c,-10,-46,6.5,5.5,HAIR);line(c,[-15,-48,-4,-44],'#c9a24a',1.6);ell(c,-4,-44,1.6,1.6,AV&&AV.mark==='hoa'?'#f06090':'#c0392b');if(AV&&AV.mark==='hoa'){ell(c,-12,-50,3,3,'#f06090');ell(c,-9,-52,2.2,2.2,'#ffd040');}}
    else if((!eq.hat||LH.kind==='tram')&&HS!=='dung'&&HS!=='xoa'){ell(c,-4,-49,4.5,4,HAIR);line(c,[-7,-46.5,-1,-46.5],'#a8343a',1.8);} // búi tóc
    if(LH)LH_Look.hat(c,LH,fem);
    if(opts.mask){c.fillStyle='#1c1b20';c.beginPath();c.moveTo(-10.5,-32.2);c.lineTo(11,-32.2);c.quadraticCurveTo(10.5,-23.5,.5,-23.6);c.quadraticCurveTo(-9.5,-23.8,-10.5,-32.2);c.fill();line(c,[-10,-31.5,-16,-27],'#1c1b20',2.2);line(c,[-10,-31.5,-15.5,-34],'#1c1b20',2);} // bịt mặt (toán cướp)
    if(sheathed)hipSword(); // kiếm dắt bên hông: chuôi ở thắt lưng, lưỡi chếch ra sau
    else if(st.two){held(st.right,P.front,'front',st.tintR,st.lvR,st.itR);c.fillStyle=skin;c.beginPath();c.arc(P.back.x,P.back.y,3.4,0,PI2);c.fill();}
    else if(hide){if(!LPZ.shBack){held(st.left,P.back,LPZ.face?'front':'back',st.tintL,st.lvL,st.itL);drawArm(c,P.sh.back.x,P.sh.back.y,P.back.x,P.back.y,sleeve,skin);}
      if(!LPZ.swBack)held(st.right,P.front,'front',st.tintR,st.lvR,st.itR);} // quay trái: theo phương án LEFT_POSES
    else held(st.right,P.front,'front',st.tintR,st.lvR,st.itR);
    if(backTop){held(st.left,P.back,'back',st.tintL,st.lvL,st.itL);drawArm(c,P.sh.back.x,P.sh.back.y,P.back.x,P.back.y,sleeve,skin);}
    if(!(hide&&LPZ.swBack))drawArm(c,P.sh.front.x,P.sh.front.y,P.front.x,P.front.y,sleeve,skin);
    if(P.trail&&P.trail.to>P.trail.from){const tr=P.trail;c.save();c.globalAlpha=.5*tr.fade;c.fillStyle=el?EL[el].color:'#f4ead0';c.beginPath();c.arc(tr.cx,tr.cy,tr.r+6,tr.from,tr.to);c.arc(tr.cx,tr.cy,tr.r-14,tr.to,tr.from,true);c.closePath();c.fill();c.restore();}
    if(myth.length)LH_Look.mythAura(c,myth,t);
    if(P.heal){c.save();c.globalAlpha=.7;c.fillStyle='#bff5c4';c.beginPath();c.arc(P.front.x,P.front.y,6,0,PI2);c.arc(P.back.x,P.back.y,6,0,PI2);c.fill();c.restore();}
    c.restore();c.restore();
    if(opts.label!==false)label(h.name,h.x,h.y-(64+seat),opts.labelColor||'#fff2d1',who===player&&player.cos&&player.cos.use.ten||null);
  }

  /* ---------- Quái vật ---------- */
  const ADD_ART={'hoa-moc':(...a)=>drawFlower(...a),'ngo-khong':(...a)=>drawWukong(...a),'ngo-khong-ao':(...a)=>drawWukong(...a)};
  function drawMonster(m){
    const M=MON[m.type],c=ctx;let alpha=1;
    if(m.dead){alpha=clamp(1-(time-m.deadAt)/1.2,0,1);if(alpha<=0)return;}
    const fl=time-m.hurt<.1,col=v=>fl?'#fff3e6':v,g=m.walk;
    c.save();c.globalAlpha=alpha;ell(c,m.x,m.y+3,M.r*1.2,M.r*.45,'#243d3540');
    c.translate(m.x,m.y-(m.fly||0));c.scale(m.facing,1);
    let lunge=0,open=false;
    if(m.atk){if(time<m.atk.at)lunge=-5*clamp((time-(m.atk.at-M.windup))/M.windup,0,1);else{lunge=12*Math.max(0,1-(time-m.atk.at)/.3);open=true;}}
    c.translate(lunge,0);if(m.dead)c.rotate(-.5*(1-alpha));if(m.sc)c.scale(m.sc,m.sc);
    // v10.66: chế độ tiết kiệm — hình quái vẽ sẵn vào ảnh đệm theo từng pha (đi / đứng, há miệng, lóe sáng), dán lại thay vì vẽ hàng chục nét mỗi khung
    if(PERF.lv>=1&&!m.dead&&!ADD_ART[m.type]&&!LH_IMG.pic('quai:'+(m.art||m.type)))monSprite(c,m,M,open,fl,g);else monArt(c,m,M,open,fl,g);
    c.restore();
    monOver(m,M);
  }
  const MSPR=new Map();
  function monSprite(c,m,M,open,fl,g){
    const mv=!!m.moving,gq=mv?walkQ(g):0,tq=timeQ(mv);
    const key=m.type+'|'+(m.art||'')+'|'+(open?1:0)+(fl?1:0)+(mv?1:0)+'|'+gq.toFixed(2)+'|'+tq;
    let sp=MSPR.get(key);
    if(sp===undefined){if(SPR.made>=3){monArt(c,m,M,open,fl,g);return;}SPR.made++;if(SPR.bytes>56e6)sprReset();
      const mm=Object.create(m);mm.moving=mv;mm.walk=gq;sp=sprMake(mm,c2=>monArt(c2,mm,M,open,fl,gq),0,0,tq,'mon');MSPR.set(key,sp);}
    if(!sp){monArt(c,m,M,open,fl,g);return;}if(sp.empty)return;
    c.drawImage(sp.cv,sp.dx,sp.dy,sp.w,sp.h);
  }
  // hình quái tại gốc (chân, quay mặt sang phải)
  function monArt(c,m,M,open,fl,g){
    const col=v=>fl?'#fff3e6':v;
    const leg=(x,ph,len,w,colr)=>line(c,[x,-len,x+Math.sin(g+ph)*len*.3*(m.moving?1:0),0],colr,w);
    const own=ADD_ART[m.type],pic=!own&&LH_IMG.pic('quai:'+(m.art||m.type)); // v10.65: hình vẽ riêng (Hoa Mộc, Tôn Ngộ Không)
    const art=!pic&&LH_ART.mon[m.art||m.type]; // v10.46: m.art = hình vẽ mượn (lính phe địch ở Chiến trường)
    if(own)own(c,m,M,{t:time,open,col,g,fl,atk:!!m.atk});
    else if(pic){if(fl)c.filter='brightness(1.8)';drawPic(c,pic,Math.max(M.h*1.3,M.r*2),m.moving?-Math.abs(Math.sin(g))*3:0);c.filter='none';}
    else if(LH_BOSS[m.type])LH_BOSS[m.type](c,m,M,{t:time,open,col,g,fl,atk:!!m.atk}); // v10.18: boss vẽ chi tiết
    else if(art)art(c,m,M,{t:time,open,col,g,fl,atk:!!m.atk});
    else if(!['deer','lion','elephant','croc','chua-son-lam','ngu-tinh'].includes(m.type)){World.monPack(m.type);ell(c,0,-M.h*.45,M.r,M.h*.45,col('#5a4a3a'));ell(c,M.r*.6,-M.h*.7,3,3,'#ffd27a');}
    else if(m.type==='deer'){
      leg(-12,0,22,3,col('#7a5334'));leg(10,Math.PI,22,3,col('#7a5334'));
      ell(c,0,-26,20,10,col('#b07a4c'));ell(c,0,-21,14,4,col('#d9b48a'));leg(-9,Math.PI,21,3,col('#93623d'));leg(13,0,21,3,col('#93623d'));
      ell(c,-20,-30,3,4,'#f2e8d8');line(c,[12,-30,19,-46],col('#b07a4c'),7);ell(c,24,-47,7,5,col('#b07a4c'));ell(c,18,-52,2,4,col('#93623d'));
      c.fillStyle='#2d2620';c.fillRect(29,-47,2.5,2.5);c.fillRect(24,-49,2,2);
      line(c,[21,-52,17,-63,13,-69],'#e2d1ac',2);line(c,[17,-63,22,-68],'#e2d1ac',2);line(c,[24,-52,27,-62,24,-69],'#e2d1ac',2);line(c,[27,-62,31,-66],'#e2d1ac',2);
      c.fillStyle='#f2e8d8';[[-8,-30],[-2,-32],[5,-30]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,1.4,0,PI2);c.fill();});
    }else if(m.type==='lion'){
      leg(-14,0,18,5,col('#a87638'));leg(12,Math.PI,18,5,col('#a87638'));
      c.strokeStyle=col('#c9984e');c.lineWidth=3;c.beginPath();c.moveTo(-22,-26);c.quadraticCurveTo(-38,-28,-35,-40);c.stroke();ell(c,-35,-41,3.5,3.5,'#6b3f1c');
      ell(c,0,-22,24,11,col('#c9984e'));leg(-10,Math.PI,17,5,col('#b4823f'));leg(15,0,17,5,col('#b4823f'));
      c.fillStyle=col('#7c4a22');c.beginPath();for(let i=0;i<12;i++){const a=i/12*PI2,r=i%2?13:16;c.lineTo(22+Math.cos(a)*r,-30+Math.sin(a)*r);}c.closePath();c.fill();
      ell(c,26,-29,9,9,col('#d4a35b'));ell(c,33,-26,5,4,col('#e8c88e'));c.fillStyle='#3a2414';c.fillRect(35,-29,3,2.5);c.fillRect(28,-33,2,2);
      if(open){c.fillStyle='#5a1f1a';c.beginPath();c.moveTo(29,-24);c.lineTo(39,-21);c.lineTo(31,-18);c.fill();c.fillStyle='#fff';c.fillRect(34,-23,2,2);}
    }else if(m.type==='elephant'){
      const lg=(x,ph,cl)=>roundRect(c,x+(m.moving?Math.sin(g+ph)*3:0)-6,-30,12,30,4,cl);
      lg(-22,0,col('#7d8287'));lg(16,Math.PI,col('#7d8287'));
      line(c,[-36,-44,-41,-30],col('#8e9398'),2);
      ell(c,0,-42,36,25,col('#8e9398'));lg(-14,Math.PI,col('#8a8f94'));lg(22,0,col('#8a8f94'));
      ell(c,33,-50,15,15,col('#8e9398'));ell(c,26,-50,11,15,col('#7b8086'));
      const lift=open?-26:m.atk?-10:Math.sin(time*1.5)*3;c.strokeStyle=col('#8e9398');c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(44,-47);c.quadraticCurveTo(56,-30+lift,50,-9+lift);c.stroke();
      line(c,[41,-40,50,-37,53,-43],'#f2ead8',3);c.fillStyle='#2d2b29';c.fillRect(38,-56,2.5,2.5);
    }else if(m.type==='croc'){
      c.fillStyle=col('#4c6738');c.beginPath();c.moveTo(-24,-12);c.lineTo(-60,-5);c.lineTo(-24,-3);c.fill();
      line(c,[-14,-5,-19+(m.moving?Math.sin(g)*4:0),2],col('#3f5a2e'),4);line(c,[14,-5,19+(m.moving?Math.sin(g+Math.PI)*4:0),2],col('#3f5a2e'),4);
      ell(c,0,-8,28,7.5,col('#557140'));ell(c,0,-5,22,3,col('#8fa36b'));
      c.fillStyle=col('#3f5a2e');for(let x=-22;x<=20;x+=7){c.beginPath();c.moveTo(x,-14);c.lineTo(x+3,-18);c.lineTo(x+6,-14);c.fill();}
      c.save();c.translate(24,-8);if(open)c.rotate(-.38);c.fillStyle=col('#557140');c.beginPath();c.moveTo(0,-4);c.lineTo(30,-1.5);c.lineTo(30,1);c.lineTo(0,1);c.fill();c.fillStyle='#fff';for(let x=6;x<28;x+=5)c.fillRect(x,1,1.5,2);c.restore();
      c.fillStyle=col('#4c6738');c.beginPath();c.moveTo(24,-7);c.lineTo(52,-4);c.lineTo(24,-1);c.fill();ell(c,30,-13,2.6,2.6,'#e2c64a');
    }else if(m.type==='chua-son-lam'){ // trùm: hổ chúa
      c.save();c.scale(2.1,2.1);if(open)c.rotate(-.12);drawTiger(c,m.moving,m.walk,time,false);ell(c,27,-28,1.6,1.6,'#ff4a2a');line(c,[22,-33,25,-31,28,-33],'#2a1a10',1.2);c.restore();
    }else if(m.type==='ngu-tinh'){ // trùm cuối: Ngư Tinh
      const sw=Math.sin(time*2)*4,mo=open?.5:m.atk?.2:.05;
      ell(c,0,4,74,15,'#4f9fb055');ell(c,0,4,52+Math.sin(time*3)*6,9,'#8fd0e055');
      poly(c,[-58,-40,-92,-72+sw,-82,-40,-94,-10-sw],col('#2f6f78'));
      ell(c,0,-40,60,30,col('#3f8a8f'));ell(c,4,-28,48,15,col('#cfe8d8'));
      c.strokeStyle='#2f6f78';c.lineWidth=1.5;for(let i=-40;i<40;i+=12)for(let j=-60;j<=-36;j+=12){c.beginPath();c.arc(i+(j%24?6:0),j,6,0,Math.PI);c.stroke();}
      poly(c,[-30,-66,-18,-92+sw,-6,-68,6,-94-sw,18,-68,30,-88+sw,40,-62],col('#2a5f66'));poly(c,[-6,-22,-24,0,6,-16],col('#2f6f78'));
      c.save();c.translate(52,-42);c.rotate(-mo*.3);poly(c,[0,-14,28,-6,28,0,0,0],col('#3f8a8f'));c.restore();
      c.save();c.translate(52,-38);c.rotate(mo*.6);poly(c,[0,0,28,2,26,9,0,11],col('#357a80'));c.fillStyle='#fff';for(let x=4;x<26;x+=5)c.fillRect(x,0,2,3);c.restore();
      ell(c,47,-52,7,7,'#f2e6c8');ell(c,49,-52,3.5,3.5,'#e0302a');
      c.strokeStyle='#d8c890';c.lineWidth=2;for(const s of [-1,1]){c.beginPath();c.moveTo(68,-42);c.quadraticCurveTo(92,-42+s*10+sw,106,-32+s*18-sw);c.stroke();}
    }
  }
  // tên, thanh máu, băng / chậm / sợ / choáng trên đầu quái
  function monOver(m,M){
    const MT=Math.max(M.h,(LH_BOSS.top||{})[m.type]||0); // v10.36: tên, thanh máu nằm trên đỉnh hình vẽ
    if(!m.dead&&time<m.frozenUntil){ctx.save();ctx.globalAlpha=.55;roundRect(ctx,m.x-M.r*1.35,m.y-M.h-8,M.r*2.7,M.h+12,8,'#cdeeff');ctx.globalAlpha=.9;ctx.strokeStyle='#f2fbff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(m.x-M.r,m.y-M.h);ctx.lineTo(m.x-M.r*.4,m.y-M.h*.5);ctx.lineTo(m.x+M.r*.2,m.y-M.h*.7);ctx.moveTo(m.x+M.r*.6,m.y-4);ctx.lineTo(m.x+M.r,m.y-M.h*.4);ctx.stroke();ctx.restore();}
    if(!m.dead&&time<m.slowUntil){ctx.save();ctx.strokeStyle=EL.wind.color;ctx.lineWidth=2;ctx.globalAlpha=.7;for(let i=0;i<2;i++){const a=time*4+i*Math.PI;ctx.beginPath();ctx.ellipse(m.x,m.y-6-i*12,M.r*1.2,M.r*.35,0,a,a+2.2);ctx.stroke();}ctx.restore();}
    if(!m.dead&&time<m.fearUntil){ctx.save();ctx.font='700 18px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#3a2a10';const yy=m.y-MT-24+Math.sin(time*12)*2;ctx.strokeText('!',m.x,yy);ctx.fillStyle=EL.light.color;ctx.fillText('!',m.x,yy);ctx.restore();}
    if(!m.dead&&time<m.stunUntil){ctx.fillStyle='#ffe69a';for(let i=0;i<3;i++){const a=time*5+i*2.09;ctx.beginPath();ctx.arc(m.x+Math.cos(a)*14,m.y-MT-10+Math.sin(a)*4,2.5,0,PI2);ctx.fill();}}
    if(!m.dead&&M.boss)label(M.name,m.x,m.y-MT-28,M.boss===2?'#ff9ad0':'#ffc58a');
    if(!m.dead&&(m.hp<m.max||m.aggro>time)){const bw=M.boss?84:40,by=m.y-MT-16;if(PERF.lv>=1){ctx.fillStyle='#0a120ecc';ctx.fillRect(m.x-bw/2,by,bw,5);ctx.fillStyle='#e0625a';ctx.fillRect(m.x-bw/2,by,bw*Math.max(0,m.hp/m.max),5);}else{roundRect(ctx,m.x-bw/2,by,bw,5,2,'#0a120ecc');roundRect(ctx,m.x-bw/2,by,bw*Math.max(0,m.hp/m.max),5,2,'#e0625a');}}
  }
  // Quái thu phục: vẽ như quái thường + vòng Ma công dưới chân, tên màu tím
  function drawPet(e){const M=MON[e.type];ctx.save();ctx.globalAlpha=.5+Math.sin(time*3)*.15;ctx.strokeStyle=EL.demon.color;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(e.x,e.y+3,M.r*1.3,M.r*.45,0,0,PI2);ctx.stroke();ctx.restore();if(M.boss){ctx.save();ctx.translate(e.x,e.y);ctx.scale(.65,.65);ctx.translate(-e.x,-e.y);drawMonster(e);ctx.restore();}else drawMonster(e);if(safe)label(M.name,e.x,e.y-M.h*(M.boss?.65:1)-12,EL.demon.glow);} // v10.21: trùm thu phục vẽ nhỏ lại
  function center(m){return {x:m.x,y:m.y-MON[m.type].h*.5};}
  function floater(x,y,text,color,size=14,icon){if(PERF.lv>=1&&floaters.length>=[99,28,16][PERF.lv])floaters.shift();floaters.push({x,y,text,color,size,icon,age:0,life:.9});} // v10.66: máy yếu bớt số bay
  // v10.13: số bay kèm biểu tượng tiền (đồng / bạc / vàng / hồng ngọc) thay cho chữ
  const COIN_IC={copper:['#c87a3e','#7a4420'],silver:['#d8dde2','#7a8088'],gold:['#f3c14a','#8a6410'],ruby:['#ff5a8a','#8a1a40']};
  function drawCoinIcon(x,y,kind,r){const [c1,c2]=COIN_IC[kind]||COIN_IC.copper;ctx.save();ctx.lineWidth=1.5;ctx.strokeStyle=c2;ctx.fillStyle=c1;ctx.beginPath();if(kind==='ruby'){ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();}else ctx.arc(x,y,r,0,PI2);ctx.fill();ctx.stroke();if(kind!=='ruby'){ctx.fillStyle=c2;ctx.beginPath();ctx.arc(x,y,r*.35,0,PI2);ctx.fill();}ctx.restore();}
  // tiền nhặt được: tách vàng / bạc / đồng thành từng dòng số + biểu tượng
  function moneyFloat(x,y,copper){const m=Player.money(copper);let dy=0;for(const [k,v] of [['gold',m.gold],['silver',m.silver],['copper',m.copper]]){if(!v)continue;floater(x,y-dy,'+'+v,k==='gold'?'#ffd98a':k==='silver'?'#e8ecf0':'#f0b080',13,k);dy+=14;}return dy;}
  function burst(x,y,color,n=10,spd=120){n=Math.max(2,Math.round(n*PQ()));if(particles.length>400*PQ())n=Math.min(n,3);for(let i=0;i<n;i++){const a=Math.random()*PI2,v=spd*(.4+Math.random()*.8);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,age:0,life:.45+Math.random()*.35,color,size:2+Math.random()*2.5,grav:180});}}
  function shake(a){shakeAmp=Math.max(shakeAmp,a);}
  const rarColor=q=>(Player.RAR[q]||{}).color||'#fff';
  function refreshHD(){HD=Player.derive(player,{safe});}
  function healHero(v){if(v>0&&!hero.dead)player.hp=Math.min(HD.tot.hp,player.hp+v);}

  /* ---------- Sát thương: dao động min-max, chính xác, x2/x3, hoàn hảo/huyền thoại/thần thoại, sát thương chuẩn ---------- */
  function rollHit(D,mul,owner){
    const S=D.tot,lo=S.dmgMin,hi=Math.max(lo,S.dmgMax);
    let v=Math.random()*100<S.acc?hi:lo+Math.random()*(hi-lo);
    v*=mul*D.dmgMul*(1+(HD.fx.aura||0)/100);
    let tag='',color='#ffffff',size=14;
    const c=Math.random()*100;
    if(c<S.crit3){v*=3;tag='x3';size=20;}else if(c<S.crit3+S.crit2){v*=2;tag='x2';size=17;}
    const q=Math.random()*100;
    if(q<S.mythDmg){v*=3;tag='Thần thoại';color=rarColor('m');size=Math.max(size,19);}
    else if(q<S.mythDmg+S.legDmg){v*=2;tag='Huyền thoại';color=rarColor('l');size=Math.max(size,18);}
    else if(q<S.mythDmg+S.legDmg+S.perfDmg){v*=1.5;tag='Hoàn hảo';color=rarColor('p');size=Math.max(size,16);}
    if(owner==='hero'&&hero.counter){v*=1+(HD.fx.counter||0)/100;hero.counter=false;tag=tag||'Phản công';}
    if(owner==='hero'&&dbfOn('weak'))v*=.6;
    if(owner==='hero'&&hero.morph&&time<hero.morph.until)v*=Number(CFG.phong_hoa_sat_thuong)||2; // v10.31: hoá quái (sách Phong)
    if(owner==='hero'&&HD.fx.rage&&player.hp<HD.tot.hp*.3){v*=1+HD.fx.rage/100;tag=tag||'Cuồng nộ';} // Cuồng nộ: dưới 30% máu
    return {dmg:Math.max(1,Math.round(v+S.trueDmg)),tag,color,size};
  }
  function hitMonster(m,atk,dx,dy,opt={}){
    if(m.dead)return 0;const M=MON[m.type];
    if(m.reviveUntil>time){if(time>(m.tipAt||0)){m.tipAt=time+1;const cc=center(m);floater(cc.x,cc.y-M.h*.5-26,'Đang hồi sinh','#a0ff80',12);}return 0;}
    const r=atk.abs?{dmg:Math.max(1,Math.round(atk.abs)),tag:'',color:atk.color||'#fff1c4',size:13}:rollHit(atk.D,atk.mul,atk.owner);
    let dmg=r.dmg;const f=atk.owner==='hero'&&!atk.abs?HD.fx:{};
    if(!atk.abs&&M.def>0)dmg=Math.max(1,Math.round(dmg*Player.armorMul(M.def,player.level||1))); // v10.35: thủ của quái (cột thu) theo cấp nhân vật
    // v10.22: sách Hỏa đốt cháy quái (giữ chân trùm bỏ chạy, làm tan giáp băng, chặn tái sinh)
    if(atk.el==='fire'&&!atk.abs&&(atk.owner==='hero'||atk.owner==='merc')){m.scorch=time+3;const k=(HD.bef&&HD.bef.fire)||1;if(!(m.burn&&m.burn.until>time&&m.burn.dps>dmg*.04*k))m.burn={dps:Math.max(1,dmg*.04*k),until:time+3,color:'#ff8a3d'};}
    // v10.33: sách Băng — Vỡ băng: đòn của nhân vật vào quái đang bị đóng băng thêm % sát thương (bang_vo_bang × bậc × phẩm chất)
    if(atk.owner==='hero'&&!atk.abs&&HD.bfx&&HD.bfx.shatter&&m.frozenUntil>time){dmg=Math.round(dmg*(1+HD.bfx.shatter/100));r.tag=r.tag||'Vỡ băng';}
    const TAC=M.tac||[],melee=!atk.abs&&!atk.ranged,tip=(t,col)=>{if(time>(m.tipAt||0)){m.tipAt=time+1.2;const cc=center(m);floater(cc.x,cc.y-M.h*.5-26,t,col,12);}};
    if(TAC.length){
      if(TAC.includes('giap-bang')&&atk.owner!=='burn'){if(atk.el==='fire'&&!atk.abs){if(!(m.melt>time))tip('Giáp băng tan!','#ffb070');m.melt=time+5;}else if(!(m.melt>time)){dmg=Math.max(1,Math.round(dmg*.3));tip('Giáp băng','#a0e0ff');}}
      if(TAC.includes('bay')&&m.flyUntil>time&&melee){dmg=Math.max(1,Math.round(dmg*.15));tip('Trên cao · cần đánh xa','#c0d8ff');}
      if(TAC.includes('phan-giap')&&melee){dmg=Math.max(1,Math.round(dmg*.6));if(atk.owner==='hero'&&time>(m.reflAt||0)){m.reflAt=time+.4;hurtHero(dmg*.15/.6,m);tip('Da đá dội đòn','#c8b8a0');}}
      if(TAC.includes('tron')&&m.fleeing&&melee&&atk.owner!=='burn'){dmg=Math.max(1,Math.round(dmg*.3));tip('Chạy xa · cần bắn theo','#ff80c0');}
    }
    if(f.execute&&!M.boss&&(m.hp-dmg)/m.max<f.execute/100){dmg=Math.max(dmg,m.hp);r.tag='Kết liễu';}
    m.hp-=dmg;m.hurt=time;m.aggro=time+8;if(atk.owner!=='bot')m.heroDmg=(m.heroDmg||0)+dmg;
    const c=center(m);if(atk.owner==='bot')floater(c.x+(Math.random()*16-8),c.y-M.h*.5,String(dmg),'#cfc7b6',11);else floater(c.x+(Math.random()*16-8),c.y-M.h*.5,String(dmg),r.color,r.size); // v10.13: chỉ số, màu theo loại sát thương (trắng · hoàn hảo · huyền thoại · thần)
    burst(c.x,c.y,atk.el?EL[atk.el].color:'#f1e2b5',6);
    if(atk.owner!=='bot')LH_Audio.play(r.tag||r.size>14?'crit':'hit');
    const kb=(atk.knock||30)*M.knock;if(kb)World.move(m,dx*kb*.25,dy*kb*.25,Math.min(M.r,16));
    if(m.type==='deer')m.flee=time+3;
    if(atk.owner==='hero')hero.lastHitAt=time;
    if(atk.owner==='hero'&&!atk.abs){
      if(f.lifesteal)healHero(dmg*f.lifesteal/100);
      if((f.stun||atk.stun)&&Math.random()*100<(f.stun||0)+(atk.stun||0)){m.stunUntil=time+1;m.atk=null;floater(c.x,c.y-M.h*.5-18,'Choáng','#ffe69a',12);} // v10.14: chùy cũng gây choáng
      if(f.burn)m.burn={dps:dmg*f.burn/100/3,until:time+3};
      if(f.venom&&!(m.burn&&m.burn.until>time+3)){m.burn={dps:dmg*f.venom/100/4,until:time+4,color:'#80e060'};floater(c.x,c.y-M.h*.5-18,'Độc','#80e060',12);} // Độc: mất máu dần 4 giây
      if(f.frost&&Math.random()*100<f.frost){m.slowUntil=time+2;m.slowK=.5;floater(c.x,c.y-M.h*.5-18,'Băng giá','#a0e0ff',12);burst(c.x,m.y-6,'#a0e0ff',10,120);}
      const B=HD.bfx||{},bossK=M.boss?.5:1;
      if(B.thunder&&Math.random()*100<B.thunder)thunder(m,dmg*(Number(CFG.loi_sat_thuong)||150)/100);
      if(B.wind&&Math.random()*100<B.wind){m.slowUntil=time+(Number(CFG.phong_ms)||3000)/1000;m.slowK=Math.max(.1,1-(Number(CFG.phong_cham)||45)/100);floater(c.x,c.y-M.h*.5-18,'Chậm',EL.wind.color,12);burst(c.x,m.y-6,EL.wind.color,10,120);}
      if(B.morph&&!(hero.morph&&time<hero.morph.until)&&!hero.dead&&Math.random()*100<B.morph){hero.morph={type:m.type,until:time+B.morphSec,sec:B.morphSec};floater(hero.x,hero.y-96,'Hoá thân '+M.name+' · sát thương ×'+(Number(CFG.phong_hoa_sat_thuong)||2),EL.wind.glow,15);burst(hero.x,hero.y-30,EL.wind.color,30,220);fx.push({kind:'ring',x:hero.x,y:hero.y,r0:10,r1:90,color:EL.wind.color,age:0,life:.5,lw:5});LH_Audio.play('rare');}
      if(B.taunt&&time>(hero.tauntCd||0)&&Math.random()*100<B.taunt)taunt();
      if(B.ice&&Math.random()*100<B.ice){m.frozenUntil=time+(Number(CFG.bang_ms)||1800)/1000*bossK;m.atk=null;m.leap=null;floater(c.x,c.y-M.h*.5-18,'Đóng băng',EL.ice.glow,13);burst(c.x,c.y,EL.ice.color,16,140);}
      if(f.cleave&&atk.skill==='normal'&&!opt.cleave)for(const o of monsters)if(o!==m&&!o.dead&&Math.hypot(o.x-m.x,o.y-m.y)<90)hitMonster(o,{abs:dmg*f.cleave/100,owner:'hero',color:'#ffc8a0'},dx,dy,{cleave:true});
    }
    if(m.hp<=0)kill(m,atk.owner);
    return dmg;
  }
  // v10.31: sách Thổ — Trêu ngươi: mọi quái quanh nhân vật quay sang đánh nhân vật (lối chơi trâu máu + phản đòn)
  function taunt(){
    hero.tauntCd=time+1;const R=Number(CFG.tho_treu_ban_kinh)||260,dur=Number(CFG.tho_treu_giay)||5;let n=0;
    for(const o of monsters){if(o.dead||o.type==='deer'||Math.hypot(o.x-hero.x,o.y-hero.y)>R)continue;o.taunt=time+dur;o.aggro=time+8;o.tgt='hero';o.chase=null;o.fearUntil=0;n++;}
    if(!n)return;floater(hero.x,hero.y-90-seatH(),'Trêu ngươi! ('+n+')',EL.earth.glow,15);fx.push({kind:'ring',x:hero.x,y:hero.y,r0:20,r1:R,color:EL.earth.color,age:0,life:.55,lw:4});shake(3);
  }
  // Sách Lôi: một đạo lôi quang từ trời đánh xuống quái, nổ sau 0,15 giây
  const strikes=[];
  function thunder(m,v){const c=center(m),x0=c.x+(Math.random()-.5)*70,pts=[x0,c.y-320];for(let i=1;i<8;i++)pts.push(lerp(x0,c.x,i/8)+(Math.random()-.5)*26,c.y-320+40*i);pts.push(c.x,c.y);fx.push({kind:'sky',pts,color:EL.thunder.color,glow:EL.thunder.glow,age:0,life:.32});strikes.push({m,v,at:time+.12});}
  function updateStrikes(){for(let i=strikes.length-1;i>=0;i--){const k=strikes[i];if(time<k.at)continue;strikes.splice(i,1);if(k.m.dead)continue;const c=center(k.m);fx.push({kind:'ring',x:k.m.x,y:k.m.y,r0:6,r1:60,color:EL.thunder.glow,age:0,life:.3,lw:4});burst(c.x,c.y,EL.thunder.color,16,200);shake(3);hitMonster(k.m,{abs:k.v,owner:'thunder',color:EL.thunder.glow},0,0);}}
  function hitArc(ox,oy,ang,range,arc,atk){
    for(const m of monsters){if(m.dead)continue;const M=MON[m.type],c=center(m),dx=c.x-ox,dy=c.y-oy,d=Math.hypot(dx,dy);if(d-M.r>range)continue;
      const da=Math.abs(((Math.atan2(dy,dx)-ang)%PI2+PI2*1.5)%PI2-Math.PI);if(arc<PI2-.01&&da>arc/2&&d>M.r+12)continue;hitMonster(m,atk,dx/(d||1),dy/(d||1));}
    if(pk&&!pk.e.dead&&pkOwner(atk)){const e=pk.e,dx=e.x-ox,dy=e.y-24-oy,d=Math.hypot(dx,dy);if(d-16<=range){const da=Math.abs(((Math.atan2(dy,dx)-ang)%PI2+PI2*1.5)%PI2-Math.PI);if(!(arc<PI2-.01&&da>arc/2&&d>28))pkDamage(atk,dx/(d||1),dy/(d||1));}}
  }
  function hitLine(ox,oy,ang,len,w,atk){
    const ux=Math.cos(ang),uy=Math.sin(ang);
    for(const m of monsters){if(m.dead)continue;const M=MON[m.type],c=center(m),dx=c.x-ox,dy=c.y-oy,along=dx*ux+dy*uy,perp=Math.abs(dx*uy-dy*ux);if(along>-M.r&&along<len+M.r&&perp<w/2+M.r)hitMonster(m,atk,ux,uy);}
    if(pk&&!pk.e.dead&&pkOwner(atk)){const e=pk.e,dx=e.x-ox,dy=e.y-24-oy,along=dx*ux+dy*uy,perp=Math.abs(dx*uy-dy*ux);if(along>-16&&along<len+16&&perp<w/2+16)pkDamage(atk,ux,uy);}
  }
  function nova(x,y,r,atk,except){fx.push({kind:'ring',x,y,r0:10,r1:r,color:atk.el?EL[atk.el].color:'#ffd9a0',age:0,life:.45,lw:5});if(pk&&!pk.e.dead&&pkOwner(atk)){const e=pk.e,d=Math.hypot(e.x-x,e.y-24-y);if(d<r+16)pkDamage(atk,(e.x-x)/(d||1),(e.y-y)/(d||1));}for(const m of monsters){if(m.dead||m===except)continue;const c=center(m),d=Math.hypot(c.x-x,c.y-y);if(d<r+MON[m.type].r)hitMonster(m,{...atk,knock:60},(c.x-x)/(d||1),(c.y-y)/(d||1));}}
  function spawnProjectile(o,ang,atk,d,home,missed){
    const ox=o.x+Math.cos(ang)*26,oy=o.y-20-(o.seat||0)+Math.sin(ang)*20;
    projectiles.push({kind:d.kind,x:ox,y:oy,vx:Math.cos(ang)*d.speed,vy:Math.sin(ang)*d.speed,sp:d.speed,age:0,life:(d.range||400)/d.speed,atk:{...atk,ranged:true,knock:d.kind==='bolt'?50:25},el:atk.el,pierce:d.pierce||0,splash:d.splash||0,hit:new Set(),gy:20+(o.seat||0),home:home||null,missed:missed||null});
  }
  function resolveAttack(a,idx=0){
    const d0=ATK[a.type],RM=1+(HD.tot.range||0)/100,d=RM>1?{...d0,range:d0.range*RM}:d0,sk=SK[a.skill],el=HD.books.fire?'fire':a.elem; // Tầm đánh (dòng cánh): nới tầm mọi đòn
    const atk={D:HD,mul:d.dmg*sk.mul*(a.empowered?1.6:1),el,owner:'hero',knock:d.knock,skill:a.skill,stun:d.stun||0};
    const ang=Math.atan2(a.aim.y,a.aim.x),ox=hero.x,oy=hero.y-18,col=el?EL[el].color:'#f4ead0';
    LH_Audio.play({sword:'swing',saber:'swing',mace:'bash',punch:'swing',shield:'bash',spear:'thrust',staff:'magic',bow:'bow',crossbow:'crossbow'}[a.type]||'swing');
    if(d.kind==='melee'){
      const whirl=!!sk.multi,range=d.range*(whirl?1.15:1)*(a.skill==='basic'?1.2:1);
      hitArc(ox,oy,ang,range,whirl?PI2:d.arc,{...atk,knock:d.knock*(a.type==='shield'&&a.skill!=='normal'?1.6:1)});
      fx.push(whirl?{kind:'ring',x:ox,y:oy,r0:range*.5,r1:range,color:col,age:0,life:.35,lw:6}:{kind:'arc',x:ox,y:oy,ang,r:range*.8,arc:a.type==='punch'?.8:a.type==='shield'?1.1:1.7,color:col,age:0,life:.22});
      if(a.type==='shield'){shake(3);fx.push({kind:'ring',x:ox+Math.cos(ang)*34,y:oy+Math.sin(ang)*34,r0:4,r1:30,color:'#f4dd9a',age:0,life:.25,lw:3});}
    }else if(d.kind==='thrust'){
      const n=sk.multi?3:1;for(let i=0;i<n;i++){const an=ang+(i-(n-1)/2)*.28;hitLine(ox,oy,an,d.range*(a.skill==='basic'?1.25:1),d.width,atk);fx.push({kind:'thrust',x:ox,y:oy,ang:an,len:d.range,color:col,age:0,life:.2});}
    }else{
      const n=sk.multi?3:1,o={x:hero.x,y:hero.y,seat:seatH()},tg=lockOn&&isRanged(a.type)&&hero.lockT&&!hero.lockT.dead?hero.lockT:null;
      for(let i=0;i<n;i++){if(!tg){spawnProjectile(o,ang+(i-(n-1)/2)*.16,atk,d);continue;}
        const hit=Math.random()*100<(HD.tot.aim||0);spawnProjectile(o,ang+(hit?(i-(n-1)/2)*.16:(Math.random()<.5?-1:1)*(.18+Math.random()*.2)),atk,d,hit?tg:null,hit?null:tg);}
      if(a.stance&&a.stance.dual&&a.type==='staff')spawnProjectile(o,ang+.08,{...atk,mul:atk.mul*.6},d);
      if(a.type==='crossbow')shake(3);
    }
    if(a.skill==='basic')burst(ox+Math.cos(ang)*30,oy+Math.sin(ang)*20,col,14,160);
    if(sk.nova&&idx===a.cycles-1){nova(hero.x,hero.y-12,sk.nova,{...atk,mul:atk.mul*(sk.finale||.9)},null);burst(hero.x,hero.y-20,col,26,220);shake(6);}
    if(a.skill==='normal'&&HD.fx.wave&&++hero.waveCount%4===0){nova(hero.x,hero.y-12,150,{...atk,mul:atk.mul*HD.fx.wave/100},null);burst(hero.x,hero.y-20,'#ffb070',20,200);}
  }
  function kill(m,owner){
    if(m.fighter){tgDown(m,owner);return;} // v10.46: bản sao / NPC sự kiện thế giới
    if(m.add){addDown(m,owner);return;} // v10.65: hoa Mộc Tinh, khỉ con, phân thân Ngộ Không
    if(m.wk){wkDown(m,owner);return;}
    if(XA_REV[m.type]&&!m.ev&&(m.rev||0)<XA_REV[m.type].length){xaRevive(m);return;} // v10.65: Xà Tinh hồi sinh 3 lần
    if(m.chase&&m.chase.ent!==hero&&!m.chase.ent.dead){const e=m.chase.ent;floater(e.x,e.y-84,'Đa tạ đại hiệp!','#ffe6a8',14);m.chase=null;}
    const M=MON[m.type];m.dead=true;m.deadAt=time;m.respawn=m.ev?1e18:time+M.respawn;m.atk=null;m.burn=null;m.leap=null;
    if(owner==='bot'&&(m.heroDmg||0)<m.max*.3){burst(m.x,m.y-M.h*.4,'#e9dcb4',12);return;}
    moneyFloat(m.x,m.y-M.h-6,Player.killCopper(M));burst(m.x,m.y-M.h*.4,'#e9dcb4',16);LH_Audio.play(M.boss?'boss':'kill');
    // Phần thưởng tính ngay trên máy người chơi (cùng luật, cùng chuỗi ngẫu nhiên với máy chủ): túi rơi xuống là mở liền,
    // lệnh gom lại gửi máy chủ sau; máy chủ tính lại y hệt để lưu
    const sack={x:m.x+(Math.random()-.5)*10,y:m.y+4,born:time,boss:!!M.boss};loot.push(sack);
    op({t:'kill',mon:m.type},M.boss?300:2500).then(r=>{sack.r=r;sack.openAt=time+.22;},()=>{sack.gone=time;});
    if(HD.fx.haste&&owner==='hero')hero.hasteUntil=time+4;
    if(HD.fx.clone&&owner==='hero'&&!hero.dead&&Math.random()*100<HD.fx.clone)spawnClone(); // v10.13: Phân thân (thú thần thoại)
    if(M.boss){shake(10);message(svg('check')+'Đã hạ '+M.name);}
    window.GameUI?.refresh();
  }
  /* ---------- Túi rơi đồ ---------- */
  const loot=[];
  function openSack(sack,r){
    if(!r||!r.ok){sack.gone=time;return;}
    sack.open=time;const x=sack.x,y=sack.y-30;let dy=0;
    burst(x,y+18,(r.items.length?Player.rar(r.items[0]).color:'#e9dcb4'),r.items.length?22:10,150);
    LH_Audio.play(r.items.length?(Player.rar(r.items[0]).tier>=3?'rare':'pickup'):'coin');
    if(r.rubies){floater(x,y-dy,'+'+r.rubies,'#ff9ab8',14,'ruby');dy+=16;}
    if(r.exp){floater(x,y-dy,'+'+r.exp+' exp','#ffe08a',12);dy+=14;}
    if(r.up)levelUp(r.up);
    if(r.mercUp&&r.mercUp.length)syncMerc(); // lính lên cấp: tính lại máu, sát thương
    (r.mercUp||[]).forEach(u=>message(svg('flag')+String(u.name).replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';')+' lên cấp '+u.lv));
    if(r.pet){petSpawn[r.pet.pid]={x:sack.x,y:sack.y};const M=MON[r.pet.type];floater(x,y-dy-10,'Thu phục '+M.name+'!',EL.demon.glow,16);fx.push({kind:'ring',x:sack.x,y:sack.y,r0:8,r1:90,color:EL.demon.color,age:0,life:.7,lw:5});burst(sack.x,sack.y-20,EL.demon.color,30,200);const mins=r.pet.exp?Math.round((r.pet.exp-Date.now())/60000):0;message(svg('check')+`Thu phục ${M.boss?'trùm ':''}${M.name} · ${r.pet.exp?'đi theo '+(mins>=60?Math.round(mins/60)+' giờ':Math.max(1,mins)+' phút'):'đi theo mãi mãi'}`);syncMerc();}
    r.items.forEach(it=>{const R=Player.rar(it),nm=Player.nameOf(it);floater(x,y-dy,nm,R.color,14);dy+=16;message(svg('bag')+`Nhặt được <b style="color:${R.color}">${nm}</b> \u{00b7} ${R.name}`);});
    (r.lost||[]).forEach(it=>message(svg('close')+'Túi đầy, rơi mất '+Player.nameOf(it)));
    (r.done||[]).forEach(id=>{const Q=Player.QUESTS[id];if(Q)LH_Audio.play('quest');if(Q)message(svg('quest')+`${Q.name}: xong, về gặp ${Q.story?'Lý trưởng (Tìm con)':'Lý trưởng'}`);});
    if(r.hunt){const B=Player.QUIZ[r.hunt.bo];if(r.hunt.reveal){LH_Audio.play('quest');message(svg('quest')+`Đủ manh mối cho bài "${B?B.name:r.hunt.bo}" · về gặp Thầy đồ`);}else floater(x,y-dy-14,`Manh mối ${r.hunt.got}/${r.hunt.need}`,'#c8e0ff',12);}
    if(r.bonus)message(svg('check')+'Săn đủ 4 loài \u{00b7} +'+r.bonus+' đồng');
  }
  // Lên cấp: vòng sáng, hạt vàng, đầy máu và mana
  function levelUp(n){
    refreshHD();player.hp=HD.tot.hp;player.mana=HD.tot.mp;
    for(let i=0;i<3;i++)fx.push({kind:'ring',x:hero.x,y:hero.y-10,r0:10+i*6,r1:110+i*30,color:i?'#fff3c4':'#ffd36a',age:0,life:.8+i*.15,lw:5-i});
    burst(hero.x,hero.y-30,'#ffe08a',40,240);burst(hero.x,hero.y-30,'#fff6d8',18,150);
    floater(hero.x,hero.y-90,'Lên cấp '+player.level+'!','#ffe08a',20);LH_Audio.play('levelup');
    message(svg('check')+`Lên cấp ${player.level} · +${n*(Number(Player.CFG.diem_moi_cap)||5)} điểm cộng chỉ số`);
    const av=document.getElementById('avatarBtn');if(av){av.classList.add('lvup');setTimeout(()=>av.classList.remove('lvup'),1600);}
    window.GameUI?.refresh();
  }
  function drawLoot(){
    for(let i=loot.length-1;i>=0;i--){
      const s=loot[i];if(s.r&&!s.open&&time>=s.openAt)openSack(s,s.r);if((s.open&&time-s.open>.5)||(s.gone&&time-s.gone>.3)||time-s.born>30){loot.splice(i,1);continue;}
      const a=s.open?1-(time-s.open)/.5:1,bob=Math.sin((time-s.born)*5)*2,x=s.x,y=s.y+bob*(s.open?0:1),k=s.boss?1.4:1;
      ctx.save();ctx.globalAlpha=Math.max(0,a);ctx.translate(x,y);ctx.scale(k,k);
      if(!s.open){ctx.globalAlpha*=.35+.25*Math.sin(time*6);ell(ctx,0,-6,16,8,s.boss?'#ffb0e0':'#ffe7a0');ctx.globalAlpha=Math.max(0,a);}
      ell(ctx,0,2,10,3,'#1d2a2266');
      const sp=LH_IMG.pic('giao_dien:tui_do_roi');if(sp)drawPic(ctx,sp,24,0);else{poly(ctx,[-8,0,8,0,6,-12,-6,-12],'#b48a52');poly(ctx,[-6,-12,6,-12,3,-16,-3,-16],'#8a6438');line(ctx,[-4,-13,4,-13],'#5a3e22',1.6);}
      ctx.restore();
    }
  }
  /* ---------- Lưu tiến trình: chơi trên máy, chỉ gửi lên máy chủ ở các mốc ----------
     - Mọi lệnh (giết quái, mua bán, gia cường, nhiệm vụ, thuê lính, cộng điểm…) tính ngay trên máy bằng cùng luật + cùng chuỗi ngẫu nhiên với máy chủ,
       rồi xếp hàng và ghi vào bộ nhớ trình duyệt (localStorage) cùng trạng thái nhân vật. Tắt trang giữa chừng vẫn còn, lần vào sau gửi tiếp.
     - Chỉ gửi lên máy chủ và tải lại túi đồ, tiền, nhân vật khi: về làng, qua cầu, gặp Thương nhân, bấm Lưu, ra lều. Không tự làm mới.
     - Máy chủ tính lại y hệt (theo thời điểm và cách xếp đồ lúc ra lệnh) rồi lưu; trạng thái máy chủ là chuẩn. */
  // v10.46: đang ở bản đồ sự kiện thế giới thì lưu chỗ đứng trước khi vào (lần sau vào game không kẹt trong bản đồ sự kiện)
  const heroPos=()=>TGM&&TGM.back?{...hero,x:(TGM.back.x+.5)*T,y:(TGM.back.y+.5)*T,map:TGM.back.map}:(World.def&&World.def.event?{...hero,...World.spawn,map:World.DEFAULT}:hero);
  const CHUNK=500,sync={queue:[],busy:null,sig:'',lastLay:null,at:-99,keptAt:0},pending=[];let inflight=null,sent=[];
  const record=()=>({save:Player.serialize(player,heroPos(),seen),inflight,ops:sync.queue.map(b=>b.op),t:Date.now()});
  // Ghi phần chơi xuống máy: ngay khi cần (force) hoặc theo nhịp ~1,5 giây (không ghi mỗi đòn đánh để máy yếu không khựng)
  let localDirty=false;
  function keepLocal(force){if(!force&&time-sync.keptAt<1.5){localDirty=true;return;}localDirty=false;sync.keptAt=time;try{LH_Local.set(session.charId,record());}catch(e){LH_DIAG.error(e,'lưu máy');}}
  const unsaved=()=>!!(sync.queue.length||inflight);
  function queueOp(o,L=Player.layout(player)){
    const sig=JSON.stringify(L);o.at=Date.now();
    if(!sync.queue.length||sig!==sync.sig){o.lay=L;sync.sig=sig;}
    const b={op:o,ent:null};sync.queue.push(b);keepLocal();return b;
  }
  function adopt(S){
    const before=JSON.parse(JSON.stringify(player));
    let R=Player.merge(S,before);
    if(pending.length){for(const p of pending){try{Player.applyOp(R,p.op,{},Date.now());}catch(e){}}R=Player.merge(R,before);}
    for(const k of Object.keys(player))if(!(k in R))delete player[k];
    Object.assign(player,R);refreshHD();syncMerc();window.GameUI?.refresh();
  }
  // Gửi hết hàng chờ (mỗi gói tối đa 500 lệnh), nhận lại trạng thái chuẩn
  function flush(){
    if(window.LH_KICKED)return Promise.resolve(false);
    if(sync.busy)return sync.busy.then(()=>flush(),()=>flush());
    sync.busy=(async()=>{
      try{
        do{
          if(!inflight){
            sent=sync.queue.splice(0,CHUNK);const ops=sent.map(b=>b.op);
            if(ops.length&&!ops[0].lay&&sync.lastLay)ops[0]={...ops[0],lay:sync.lastLay};
            for(const o of ops)if(o.lay)sync.lastLay=o.lay;
            inflight={bid:Date.now().toString(36)+Math.random().toString(36).slice(2,8),ops};
          }
          keepLocal(true);
          const sentSig=JSON.stringify(Player.layout(player));
          const r=await Net.call('play',{charId:session.charId,bid:inflight.bid,sentAt:Date.now(),save:Player.serialize(player,heroPos(),seen),ops:inflight.ops});
          sync.flushedSig=sentSig;
          inflight=null;sent.forEach((b,i)=>{b.res=(r.results||[])[i];});
          for(const b of sent)if(b.ent){const i=pending.indexOf(b.ent);if(i>=0)pending.splice(i,1);}
          adopt(r.state);if(r.savedAt)LH_LoadCache.set(session.charId,r.savedAt,null,{player:r.state,pos:heroPos(),seen:[...seen]}); // v10.71: bản lưu đệm cho lần Vào làng sau
          const badL=(r.results||[]).filter(x=>!x.ok),bad=badL.length;if(bad)message(svg('close')+(badL.some(x=>x.error==='LENH'||x.error==='KHONG_CO_LENH')?'Máy chủ đang chạy Code.gs cũ, chưa biết lệnh mới · hãy dán lại Code.gs rồi Triển khai':'Máy chủ không nhận '+bad+' lệnh, đã đồng bộ lại'),6); // v10.67: báo rõ khi Gs chưa cập nhật
          sent=[];
        }while(sync.queue.length>=CHUNK);
        sync.at=time;if(!unsaved())LH_Local.clear(session.charId);else keepLocal(true);return true;
      }catch(e){keepLocal(true);message(svg('close')+netMsg(e)+(e.message==='CHAP_CHON'?'':' · tiến trình vẫn giữ trên máy'));
        // rớt mạng: tự gửi lại một lần sau 10 giây (không cần chờ tới mốc lưu sau)
        if(['Failed to fetch','CHAP_CHON','KHONG_TRUY_CAP'].includes(e.message)&&!sync.retry){sync.retry=setTimeout(()=>{sync.retry=null;if(unsaved())flush();},10000);}
        return false;}
      finally{sync.busy=null;window.GameUI?.refresh();}
    })();
    return sync.busy;
  }
  // Lệnh giao dịch với người chơi (qua Thương nhân): lưu hết phần chơi trên máy trước, rồi mới gọi máy chủ và nhận trạng thái chuẩn
  // v10.12: phần chơi chưa gửi đi kèm ngay trong lệnh (trường pre) → một lượt gọi máy chủ thay vì hai (ký gửi, mua ở chợ nhanh gấp đôi).
  // Máy chủ chạy phần lưu trước rồi tới lệnh; lỗi giữa chừng thì gói lưu còn trên máy, gửi lại sau (mã bid chống tính hai lần)
  function server(action,payload){
    if(window.LH_KICKED)return Promise.reject(Error('CHUA_LUU'));
    if(sync.busy)return sync.busy.then(()=>server(action,payload),()=>server(action,payload));
    sync.busy=(async()=>{
      let pre=null;
      if(unsaved()||JSON.stringify(Player.layout(player))!==sync.flushedSig){
        if(!inflight){sent=sync.queue.splice(0,CHUNK);const ops=sent.map(b=>b.op);if(ops.length&&!ops[0].lay&&sync.lastLay)ops[0]={...ops[0],lay:sync.lastLay};for(const o of ops)if(o.lay)sync.lastLay=o.lay;inflight={bid:Date.now().toString(36)+Math.random().toString(36).slice(2,8),ops};}
        keepLocal(true);pre={bid:inflight.bid,sentAt:Date.now(),save:Player.serialize(player,heroPos(),seen),ops:inflight.ops};
      }
      const sentSig=JSON.stringify(Player.layout(player));
      let r;
      try{r=await Net.call(action,{charId:session.charId,...payload,...(pre?{pre}:{})});}
      catch(e){
        if(pre){keepLocal(true);if(['Failed to fetch','CHAP_CHON','KHONG_TRUY_CAP'].includes(e.message)&&!sync.retry)sync.retry=setTimeout(()=>{sync.retry=null;if(unsaved())flush();},10000);}
        throw e;
      }
      if(pre){sync.flushedSig=sentSig;inflight=null;sent.forEach((b,i)=>{b.res=((r.pre||{}).results||[])[i];});for(const b of sent)if(b.ent){const i=pending.indexOf(b.ent);if(i>=0)pending.splice(i,1);}sent=[];}
      if(r.state&&(!r.charId||r.charId===session.charId))adopt(r.state);
      sync.at=time;if(!unsaved())LH_Local.clear(session.charId);else keepLocal(true);
      return r;
    })().finally(()=>{sync.busy=null;window.GameUI?.refresh();});
    return sync.busy;
  }
  // Mốc lưu tự động (về làng, qua cầu, gặp Thương nhân): vừa lưu xong mà chưa chơi gì thêm thì bỏ qua
  function checkpoint(){if(!unsaved()&&time-sync.at<20)return;flush().then(ok=>{if(ok)message(svg('save')+'Đã lưu');});}
  const op=(o)=>{
    if(Player.PREDICT.has(o.t)){
      const L=Player.layout(player);let r;try{r=Player.applyOp(player,o,{},Date.now());}catch(e){return Promise.reject(e);}
      const b=queueOp(o,L);
      b.ent={op:o};pending.push(b.ent);refreshHD();syncMerc();window.GameUI?.refresh();
      return Promise.resolve({ok:true,...r});
    }
    // lệnh máy chủ tự chấm (Thầy đồ…): chờ gửi xong, trả về đúng kết quả của lệnh đó; máy chủ từ chối thì báo lỗi
    const b=queueOp(o);return flush().then(ok=>{if(!ok&&!b.res)throw Error('CHUA_LUU');const x=b.res;if(x&&x.ok===false)throw Error(x.error||'LOI');return x||{ok:true};});
  };
  function moveVector(){const x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joystick.x,y=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joystick.y;return {x,y,len:Math.hypot(x,y)};}
  function toggleLock(){lockOn=!lockOn;hero.lockT=null;try{localStorage.setItem('lh-lock',lockOn?'1':'0');}catch(e){}message(svg('aim')+(lockOn?'Khóa mục tiêu: bật':'Khóa mục tiêu: tắt'));window.GameUI?.refresh();}
  /* ---------- Khóa mục tiêu (cung, nỏ): bật nút thì mỗi phát bắn tự tìm quái đã chọn / gần nhất; trúng theo tỉ lệ chính xác của vũ khí ---------- */
  let lockOn=(()=>{try{return localStorage.getItem('lh-lock')==='1';}catch(e){return false;}})();
  const isRanged=t=>t==='bow'||t==='crossbow';
  function lockTarget(range){
    const ok=m=>m&&!m.dead&&Math.hypot(m.x-hero.x,m.y-hero.y)<range+220;
    if(ok(hero.lockT))return hero.lockT;
    let best=null,bd=range+60;for(const m of monsters){if(m.dead)continue;const dd=Math.hypot(m.x-hero.x,m.y-hero.y);if(dd<bd){bd=dd;best=m;}}
    return hero.lockT=best;
  }
  function chooseAim(st,d){
    const mv=moveVector();
    if(lockOn&&isRanged(st.type)){const m=lockTarget(d.range||500);if(m){const c=center(m),dx=c.x-hero.x,dy=c.y-(hero.y-20),l=Math.hypot(dx,dy)||1;return {x:dx/l,y:dy/l};}}
    if(mouseAim&&time-mouseAim.t<3){const dx=mouseAim.x-hero.x,dy=mouseAim.y-(hero.y-20),l=Math.hypot(dx,dy)||1;return {x:dx/l,y:dy/l};}
    if(st.type==='crossbow'){if(mv.len>.1)return {x:mv.x/mv.len,y:mv.y/mv.len};return {...hero.aim};}
    let best=null,bd=(d.range||80)+40;
    for(const m of monsters){if(m.dead)continue;const dd=Math.hypot(m.x-hero.x,m.y-hero.y);if(dd<bd){bd=dd;best=m;}}
    if(best){const c=center(best),dx=c.x-hero.x,dy=c.y-(hero.y-20),l=Math.hypot(dx,dy)||1;return {x:dx/l,y:dy/l};}
    if(mv.len>.1)return {x:mv.x/mv.len,y:mv.y/mv.len};
    return {...hero.aim};
  }
  const SKILL_NAMES={basic:'Combo',intermediate:'Diện rộng',advanced:'Liên hoàn'};
  const atkFactor=()=>(1+(HD.tot.atkSpd+(time<hero.hasteUntil?HD.fx.haste||0:0))/100)*(dbfOn('slow')?.6:1);
  function cast(id,quiet){
    if(busy()||hero.dead)return false;
    if(frozen()){if(!quiet)message(svg('ice')+'Đang bị '+(dbfOn('freeze')?'đóng băng':'choáng'));return false;}
    if(safe&&id!=='normal'){if(!quiet)message(svg('shield')+'Vùng an toàn: không dùng kỹ năng');return false;}
    if(id==='mount'&&!player.equipment.mount)return false;
    if(hero.mountAct&&time<hero.mountAct.start+hero.mountAct.dur)return false;
    if(id!=='mount'&&hero.attack&&time<hero.attack.start+hero.attack.dur*(hero.attack.cycles>1?.97:.82))return false;
    const r=Player.cast(player,id,Date.now(),HD);
    if(!r.ok){if(r.error==='MANA'&&(!quiet||time-manaWarnAt>4)){manaWarnAt=time;message(svg('orb')+'Hết mana'+(HD.tot.mpReg?'':' · cần Sách Thủy hoặc đồ hồi mana'));}return false;}
    const st=r.stance,aim=chooseAim(st,ATK[st.type]);
    hero.aim=aim;if(Math.abs(aim.x)>.12)hero.facing=aim.x<0?-1:1;
    if(id==='mount'){
      const md=Player.info(player.equipment.mount),big=md.beast==='elephant';
      hero.mountAct={type:Player.BEASTS[md.beast].act||md.beast,start:time,dur:big?.9:.7,hit:big?.55:.45,done:false,aim:{...aim}};
      floater(hero.x,hero.y-80-seatH(),Player.BEASTS[md.beast].skill,'#ffe0a0',13);LH_Audio.play('roar');window.GameUI?.refresh();return true;
    }
    if(st.dual)hero.swing^=1;
    const d=ATK[st.type],sk=SK[id];
    hero.attack={type:st.type,skill:id,start:time,dur:d.dur*sk.dur*sk.cycles/atkFactor(),cycles:sk.cycles,hitIdx:0,hit:d.hit,stance:st,elem:Player.element(player),empowered:r.empowered,hand:st.dual&&hero.swing?'left':'right',aim:{...aim}};
    if(r.empowered)floater(hero.x,hero.y-78-seatH(),'★ Nội tại','#f5d765',16);
    if(SKILL_NAMES[id])floater(hero.x,hero.y-86-seatH(),SKILL_NAMES[id],'#ffe0a0',13);
    window.GameUI?.refresh();return true;
  }
  // Kỹ năng thú cưỡi: ngựa đá hậu (phía sau), hổ vồ mồi (lao tới), voi dày xéo (diện rộng)
  // v10.17: sát thương đòn thú cưỡi × thu_cuoi_nhan_chi_so
  function mountStrike(m){
    const MS=Player.mountPow(),el=HD.books.fire?'fire':Player.element(player),oy=hero.y-14,atk={D:HD,el,owner:'hero',knock:90};
    if(m.type==='horse'){const ang=hero.facing>0?Math.PI:0;hitArc(hero.x,oy,ang,95,2.2,{...atk,mul:1.7*MS,knock:160});fx.push({kind:'arc',x:hero.x,y:oy,ang,r:70,arc:1.8,color:'#f4ead0',age:0,life:.3});burst(hero.x-hero.facing*40,hero.y-10,'#d9cdb0',14,160);shake(4);}
    else if(m.type==='tiger'){hitArc(hero.x,oy,0,85,PI2,{...atk,mul:2*MS});fx.push({kind:'ring',x:hero.x,y:hero.y,r0:10,r1:85,color:'#ff9a3d',age:0,life:.35,lw:5});burst(hero.x,hero.y-20,'#ff9a3d',18,200);shake(5);}
    // kỳ lân: Lân hỏa — vòng lửa quanh mình, quái trúng bị bỏng; rồng: Long tức — luồng lửa dài phía trước
    else if(m.type==='kylan'){nova(hero.x,hero.y,130,{...atk,el:'fire',mul:2.2*MS},null);for(const o of monsters)if(!o.dead&&Math.hypot(o.x-hero.x,o.y-hero.y)<130)o.burn={dps:HD.tot.dmgMax*.3/3*MS,until:time+3};fx.push({kind:'ring',x:hero.x,y:hero.y,r0:10,r1:130,color:'#ff9a3d',age:0,life:.45,lw:6});burst(hero.x,hero.y-20,'#ffd27a',30,240);shake(6);}
    else if(m.type==='rong'){const ang=Math.atan2(m.aim.y,m.aim.x);hitArc(hero.x,oy,ang,210,.9,{...atk,el:'fire',mul:2.6*MS,knock:140});for(let k=1;k<=5;k++)burst(hero.x+Math.cos(ang)*k*40,oy+Math.sin(ang)*k*40,k%2?'#ff9a3d':'#ffd27a',8,160);fx.push({kind:'arc',x:hero.x,y:oy,ang,r:200,arc:.9,color:'#ff9a3d',age:0,life:.4});shake(7);}
    else{nova(hero.x,hero.y,160,{...atk,mul:1.8*MS},null);burst(hero.x,hero.y-6,'#d9cdb0',30,240);shake(9);}
  }
  /* ---------- Nhận sát thương: né, đỡ, phòng ngự, giảm sát thương theo loại, lá chắn, khiên mana, phản đòn ---------- */
  /* ---------- Kỹ năng trùm (cột ky_nang): hiệu ứng xấu lên nhân vật hero.dbf[loại]=hết lúc ---------- */
  const DBF=Player.SKILLS;hero.dbf={};
  const dbfOn=k=>time<(hero.dbf[k]||0);
  const frozen=()=>dbfOn('freeze')||dbfOn('stun');
  function applyDbf(kind,dur){const S=DBF[kind];if(!S||hero.dead)return;hero.dbf[kind]=Math.max(hero.dbf[kind]||0,time+dur);if(kind==='poison')hero.poisonT=time;if(frozen()){hero.attack=null;route=[];}floater(hero.x,hero.y-80-seatH(),S.name,S.color,15);burst(hero.x,hero.y-24,S.color,14,150);}
  function resolveCast(m){
    const M=MON[m.type],c=m.cast,S=DBF[c.kind],R=130;if(!S)return;
    fx.push({kind:'ring',x:c.x,y:c.y,r0:10,r1:R,color:S.color,age:0,life:.4,lw:5});burst(c.x,c.y,S.color,22,220);
    if(!hero.dead&&Math.hypot(hero.x-c.x,hero.y-c.y)<R){if(c.kind==='bomb'){hurtHero(M.dmg*2.5,m);shake(8);}else{hurtHero(M.dmg*.4,m);applyDbf(c.kind,S.dur);}}
    for(const e of allies)if(e.hp>0&&Math.hypot(e.x-c.x,e.y-c.y)<R)hurtAlly(e,M.dmg*(c.kind==='bomb'?2.5:.6));
    for(const e of bots)if(!e.dead&&Math.hypot(e.x-c.x,e.y-c.y)<R)hurtBot(e,M.dmg*(c.kind==='bomb'?2.5:.6));
  }
  // v10.13: hiệu ứng vùng lên nhân vật (ngoài vùng an toàn; World.def.hazard từ gói bản đồ): burn = nóng/khát mất 1% máu mỗi giây · freeze = thỉnh thoảng đóng băng · slow = chậm chân
  const hazard=()=>(!safe&&World.def&&World.def.hazard)||'';
  const HZ_NAME={burn:'Nắng sa mạc · mất máu dần',freeze:'Giá rét · thỉnh thoảng đóng băng',slow:'Bùn lầy · chậm chân'};
  let hzT=0,hzShown='';
  function updateHazard(dt){
    const h=hazard();if(!h||hero.dead){hzShown=h?hzShown:'';return;}
    if(hzShown!==h){hzShown=h;message(svg(h==='burn'?'flame':h==='freeze'?'ice':'water')+HZ_NAME[h]);}
    hzT+=dt;
    if(h==='burn'&&hzT>=1){hzT=0;const d=Math.max(1,Math.round(HD.tot.hp*.01));player.hp-=d;floater(hero.x+8,hero.y-60-seatH(),'-'+d,'#ff9a5a',12);if(player.hp<=0)die();}
    else if(h==='freeze'&&hzT>=1){hzT=0;if(!frozen()&&Math.random()<.06)applyDbf('freeze',1.4);}
  }
  function updateDbf(dt){
    updateHazard(dt);
    if(dbfOn('poison')&&!hero.dead&&time-(hero.poisonT||0)>=.5){hero.poisonT=time;const d=Math.max(1,Math.round(HD.tot.hp*.02));player.hp-=d;floater(hero.x,hero.y-66-seatH(),'-'+d,DBF.poison.color,13);if(player.hp<=0)die();}
  }
  function drawDbf(){
    const on=Object.keys(hero.dbf).filter(dbfOn);if(!on.length||hero.dead)return;const y=hero.y-24-seatH();
    if(frozen()){ctx.save();ctx.globalAlpha=.55;roundRect(ctx,hero.x-16,y-28,32,56,6,dbfOn('freeze')?'#bfe8ff':'#fff0a0');ctx.restore();}
    label(on.map(k=>DBF[k].name+' '+Math.ceil(hero.dbf[k]-time)+'s').join(' · '),hero.x,hero.y-(78+seatH()),'#ffd0c0');
  }
  function hurtHero(dmg,m){
    if(tut&&tut.oneHit&&tut.oneHit===m&&!hero.dead){tut.oneHit=null;tutKO(m);return;}
    if(hero.dead||time<hero.invuln)return;
    const M=MON[m.type],S=HD.tot;
    if(Math.random()*100<S.dodge){floater(hero.x,hero.y-66-seatH(),'Né','#cfe8ff',15);if(HD.fx.counter)hero.counter=true;hero.invuln=time+.2;return;}
    let d=m.tut?dmg*.5:dmg,tag='';
    if(Math.random()*100<M.crit){d=Math.max(dmg,d*2*(1-S.critRed/100));tag='x2 ';}
    const front=(m.x-hero.x)*hero.facing>-10;
    let blocked=false;
    if(time<hero.blockUntil&&front){d*=.2;blocked=true;burst(hero.x+hero.facing*20,hero.y-22,'#f4dd9a',10,150);}
    else if(Math.random()*100<S.block){d*=.2;tag='Đỡ ';blocked=true;burst(hero.x+hero.facing*20,hero.y-22,'#f4dd9a',8,120);}
    LH_Audio.play(blocked?'block':'hurt');
    d*=Player.armorMul(S.def*(dbfOn('armor')?.5:1),Player.monLv(m.type));d*=1-S.dmgRed/100; // v10.35: thủ theo cấp quái
    const red={hoan_hao:S.perfRed,huyen_thoai:S.legRed,than:S.mythRed}[M.dtype]||0;d*=1-red/100;
    d=Math.max(1,Math.round(d));
    if(hero.shieldHp>0){const a=Math.min(hero.shieldHp,d);hero.shieldHp-=a;d-=a;}
    if(HD.fx.manaShield&&d>0){const part=Math.min(Math.floor(player.mana),Math.round(d*HD.fx.manaShield/100));player.mana-=part;d-=part;}
    player.hp-=d;if(m.tut&&player.hp<1)player.hp=1;hero.lastHurt=time;hero.hurt=time;hero.invuln=time+.35;
    floater(hero.x,hero.y-66-seatH(),tag+'-'+d,'#ff8f86',15);shake(4);
    // v10.14: Sức khỏe → tỉ lệ hồi đầy máu khi trúng đòn · v10.33: mỗi lần hồi đầy phải chờ hoi_day_giay giây (cân bằng PvP)
    if(player.hp>0&&S.fullHeal&&time>(hero.fullHealAt||-99)&&Math.random()*100<S.fullHeal){hero.fullHealAt=time+(Number(CFG.hoi_day_giay)||10);player.hp=S.hp;floater(hero.x,hero.y-84-seatH(),'+'+S.hp,'#9fe8a8',16,'heart');burst(hero.x,hero.y-30,'#9fe8a8',16,160);}
    if(S.reflect&&!m.dead){const c=center(m);hitMonster(m,{abs:dmg*S.reflect/100,owner:'reflect',color:EL.earth.glow},(m.x-hero.x)/(Math.hypot(m.x-hero.x,m.y-hero.y)||1),0);fx.push({kind:'bolt',x1:hero.x,y1:hero.y-22,x2:c.x,y2:c.y,color:EL.earth.color,age:0,life:.2});}
    const dx=hero.x-m.x,dy=hero.y-m.y,l=Math.hypot(dx,dy)||1;World.move(hero,dx/l*16,dy/l*16);
    if(HD.bfx&&HD.bfx.light&&!m.dead&&Math.random()*100<HD.bfx.light){m.fearUntil=time+(Number(CFG.sang_ms)||2500)/1000*(M.boss?.5:1);m.atk=null;m.leap=null;m.path=null;floater(m.x,m.y-M.h-20,'Hoảng sợ',EL.light.color,13);fx.push({kind:'ring',x:hero.x,y:hero.y-20,r0:10,r1:120,color:EL.light.color,age:0,life:.5,lw:5});burst(hero.x,hero.y-30,EL.light.glow,18,220);}
    if(player.hp<=0)die();
    window.GameUI?.refresh();
  }
  function die(){
    if(TGM&&TGM.phase!=='lobby'){if(!(HD.fx.revive&&time>=hero.reviveAt)){tgHeroDown();return;}}
    if(HD.fx.revive&&time>=hero.reviveAt){player.hp=Math.round(HD.tot.hp*HD.fx.revive/100);hero.reviveAt=time+300;hero.invuln=time+2;LH_Audio.play('heal');message(svg('heart')+'Hồi sinh tại chỗ');burst(hero.x,hero.y-24,'#ffe0f0',30,200);return;}
    {const b=monsters.find(o=>!o.dead&&o.tk&&o.tk.on);if(b){bossLine(b,'thang',3.6);b.tk.on=false;b.tk.i=0;}}player.hp=0;hero.dead=time+2.2;hero.attack=null;hero.mountAct=null;route=[];LH_Audio.play('die');message(svg('heart')+'Bạn đã gục · về làng');
    // mất toàn bộ đồ đang mặc (cau_hinh chet_mat_do): máy chủ xác nhận, cấp / sách / lính / túi giữ nguyên
    const tk=!!(tut&&tut.koed);op(tk?{t:'die',tut:1}:{t:'die'}).then(r=>{refreshHD();if(r.lost&&r.lost.length){window.GameUI?.refresh();setTimeout(()=>message(svg('close')+`Gục ngã: mất ${r.lost.length} món đang mặc (${r.lost.slice(0,3).map(it=>Player.nameOf(it)).join(', ')}${r.lost.length>3?'…':''})`),2600);}},()=>{});
  }
  /* ---------- v10.46–48: Sự kiện thế giới (Tướng quân) — Lôi đài thế giới, Chiến trường phương Bắc, Chiến trường thế giới ----------
     Trước giờ mở tg_dang_ky_phut phút: gặp Tướng quân → vào sân chờ (vùng an toàn). Trong lúc chờ, máy hỏi máy chủ bản sao người chơi chênh không quá tg_chenh_cap cấp
     (hỏi vào một giây ngẫu nhiên, chờ tối đa 3 giây; lỗi thì dùng NPC giả lập theo chỉ số của mình, trận vẫn mở đúng giờ).
     Kẻ địch (bản sao đối thủ, lính phe địch, trụ / nhà chính phe địch) là "quái" đặc biệt (m.fighter, phe m.side) nên mọi đòn, kỹ năng, lính, thú của người chơi đánh trúng như quái.
     Đồng đội (Chiến trường) là người chơi ảo (bots, mate, phe 'A'): tự đánh quái phe địch, không bị đòn của người chơi.
     Lôi đài: hỗn chiến tự do, vòng đài thu hẹp sau 1 phút; gục thì bị loại, ở lại xem, nhận vàng theo hạng.
     Phương Bắc: đội 5 người trên đường chéo; lính phe địch ra theo đợt (tg_bac_dot_giay giây), đợt sau mạnh hơn (tg_bac_tang_phan_tram %);
     phá nhà chính phe địch là thắng; nhà chính phe ta đổ hoặc hết giờ là thua; gục giữa trận thì về làng ngay (giữ kinh nghiệm, không có vàng).
     Thế giới (v10.48): 10 đấu 10 trên ba đường. Phe địch là bản sao người chơi chênh không quá tg_chenh_cap cấp (kèm lính thuê), phe ta là đồng đội;
     mỗi tg_the_gioi_dot_giay giây cả hai phe ra một đợt lính (tg_the_gioi_linh_dot con, chia ba đường) đi theo đường của mình; mỗi đường một trụ mỗi phe.
     Đồng đội, bản sao phe địch gục thì tg_the_gioi_hoi_sinh_giay giây sau đứng dậy ở doanh trại; người chơi gục thì về làng. Phá nhà chính đối phương trước là thắng.
     Mọi trường hợp gục trong bản đồ sự kiện: không mất đồ, không gửi lệnh die. */
  let TGM=null,tgBanner=null;
  const TG_NAMES=['Kiếm khách Hắc Y','Lãng khách Vô Danh','Hồng Y nữ hiệp','Cuồng đao Tứ Hải','Thiết quyền Bắc Sơn','Bạch Y thư sinh','Độc cô Kiếm Khách','Thanh Phong hiệp nữ','Phi đao Lạc Việt','Hắc Hổ đại hán','Ngọc Diện công tử','Lục Lâm hảo hán','Tiêu Dao lãng tử','Băng Tâm tiên tử','Hỏa Long võ sĩ','Kim Đao bộ đầu','Tử Vân kiếm khách','Lam Y nữ hiệp','Trường Thương tráng sĩ','Bích Hải đạo nhân','Vân Mộng tiên cô','Thiết Huyết hiệp sĩ','Hoàng Sơn cư sĩ','Song Kiếm thiếu hiệp','Lôi Hỏa đao khách','Nguyệt Ảnh sát thủ','Đồng Tiền nữ hiệp'];
  function tgBannerSet(html){if(!tgBanner){tgBanner=document.createElement('div');tgBanner.className='ev-banner tg-banner';document.getElementById('lu-hanh').appendChild(tgBanner);tgBanner.addEventListener('click',ev=>{const b=ev.target.closest('[data-tg]');if(!b)return;if(b.dataset.tg==='leave')tgLeave();else if(b.dataset.tg==='result'&&TGM&&TGM.result)window.GameUI?.tgResult(TGM.result,TGM);});}
    if(html==null){tgBanner.remove();tgBanner=null;return;}if(tgBanner.innerHTML!==html)tgBanner.innerHTML=html;}
  const mmss=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
  const tgK=k=>{const E=TGM&&TGM.E,p=E&&E.id==='the'?'tg_the_gioi_':'tg_bac_';return Number(CFG[p+k]);};
  const tgN=E=>Math.max(2,Math.min(30,Number(CFG[E.id==='loi'?'tg_loi_dai_so_nguoi':'tg_'+(E.id==='bac'?'bac':'the_gioi')+'_so_nguoi'])||E.team||10));
  // Vào sân chờ (gọi từ bảng Tướng quân)
  async function tgEnter(ev){
    const E=Player.TG[ev];if(!E)return false;if(!E.on){message(svg('lock')+E.name+' sẽ mở ở bản cập nhật sau',3);return false;}
    const st=Player.tgState(ev);if(st.phase!=='reg'){message(svg('flag')+(st.phase==='run'?'Trận đã bắt đầu, chờ suất sau':'Chưa tới giờ ghi danh'),3);return false;}
    if(Player.tgLeft(player,ev)<=0){message(svg('close')+'Hôm nay đã hết lượt '+E.name,3);return false;}
    if(hero.dead||travelling)return false;
    const back={map:World.id,x:Math.floor(hero.x/T),y:Math.floor(hero.y/T)};checkpoint();
    const ok=await travel(E.map);if(!ok)return false;
    TGM={ev,E,start:st.start,end:st.end,back,phase:'lobby',snaps:null,askAt:Date.now()+Math.random()*1500,teams:[],kills:0,exp:0,out:false,result:null,ours:[],wave:0,pre:[],si:0};
    tgArrivePlan(TGM);
    message(svg('flag')+`<b>${E.name}</b> · chờ tới giờ mở trong ${ev==='loi'?'sân chờ':'doanh trại'}`,4);LH_Audio.play('portal');return true;
  }
  function tgLeave(){
    if(!TGM)return;const b=TGM.back,ev=TGM;tgClear();hero.dead=0;refreshHD();player.hp=HD.tot.hp;player.mana=HD.tot.mp;
    travel(b.map,b.x,b.y).then(ok=>{if(!ok)travel(World.DEFAULT);});if(ev.phase==='fight'&&!ev.result)message(svg('close')+'Rời trận giữa chừng',3);
  }
  function tgClear(){for(const k of Object.keys(MON))if(/^_tg/.test(k))delete MON[k];for(let i=monsters.length-1;i>=0;i--)if(monsters[i].fighter)monsters.splice(i,1);for(let i=bots.length-1;i>=0;i--)if(bots[i].mate||bots[i].waiter)bots.splice(i,1);TGM=null;tgBannerSet(null);}
  // hỏi máy chủ bản sao người chơi (một lần, vào giây ngẫu nhiên trong lúc chờ để hàng nghìn người không gọi cùng lúc)
  function tgAsk(){
    if(!TGM||TGM.asked)return;TGM.asked=true;const n=tgN(TGM.E)*(TGM.E.id==='the'?2:1)-1,me=TGM;
    Promise.race([Net.call('doiThu',{lv:player.level||1,n,ten:player.name}),new Promise((_,no)=>setTimeout(()=>no(Error('CHAM')),3000))])
      .then(r=>{if(TGM!==me)return;const used=me.used=me.used||new Set();me.snaps=(r.list||[]).filter(x=>x&&x.equipment&&!used.has(x.name)&&x.name!==player.name);for(const x of me.snaps)used.add(x.name);}).catch(()=>{if(TGM===me)me.snaps=[];});
  }
  // NPC giả lập: chép chỉ số, đồ của chính người chơi, yếu hơn (tg_npc_phan_tram %)
  function tgFake(i){
    const used=TGM.used=TGM.used||new Set((TGM.snaps||[]).map(x=>x.name));used.add(player.name);const pool=TG_NAMES.filter(x=>!used.has(x)),name=pool[Math.floor(Math.random()*pool.length)]||('Cao thủ '+(i+1));used.add(name);
    const d=JSON.parse(JSON.stringify({name,gender:Math.random()<.35?'f':'m',level:player.level||1,stats:player.stats,alloc:player.alloc,equipment:player.equipment,skillSlots:player.skillSlots,passive:player.passive||0,mercs:[]}));
    return {snap:d,fake:true};
  }
  // v10.49: người tham gia kế tiếp — bản sao người chơi thật (nếu máy chủ đã trả) rồi mới tới NPC giả lập
  function tgNext(i){const M0=TGM,sn=M0.snaps&&M0.snaps[M0.si];if(sn){M0.si++;return {snap:sn,fake:false};}return tgFake(i);}
  // v10.49: trong lúc chờ, các cao thủ lần lượt vào sân chờ / doanh trại (đứng chơi, đi lại, chào hỏi) — vào càng sớm càng thấy ít người, gần giờ mở thì đủ
  const TG_SAY=['Chào chư vị anh hùng!','Lần này nhất định thắng!','Cùng cấp cả, đừng nương tay nhé.','Ta mới tới, còn kịp chứ?','Ai đi cùng ta đường giữa?','Giữ nhà chính cẩn thận!','Đánh xong còn đi săn tiếp.','Vũ khí ta vừa rèn xong.','Hôm nay đông thật!','Chờ trống trận thôi.'];
  function tgWaitN(M0){return tgN(M0.E)-1;} // người hiện trong sân chờ phe ta (Lôi đài: mọi người; Chiến trường: đồng đội)
  function tgArrivePlan(M0){
    const n=tgWaitN(M0),now=Date.now(),reg=M0.start-now,full=Math.max(60000,(Number(CFG.tg_dang_ky_phut)||5)*60000),done=clamp(1-reg/full,0,1);
    // đã có sẵn một phần theo thời gian đã trôi của giờ ghi danh (ít nhất 1–2 người), số còn lại tới dần, người cuối tới trước giờ mở ~8 giây
    const have=Math.min(n,Math.max(1+Math.floor(Math.random()*2),Math.round(n*done*.9))),rest=n-have,span=Math.max(3000,reg-8000);
    M0.quietUntil=now+5000;M0.arr=[];for(let i=0;i<have;i++)M0.arr.push(now+400+i*250);
    for(let i=0;i<rest;i++)M0.arr.push(now+2500+span*((i+.3+Math.random()*.6)/rest)*(.75+.25*((i+1)/rest)));M0.arr.sort((a,b)=>a-b);
  }
  function tgArrive(M0,quiet){
    const sf=World.def.safe;if(!sf)return;const x0=(sf.x0+1)*T,x1=(sf.x1)*T,y0=(sf.y0+.5)*T,y1=(sf.y1+.5)*T;
    const it=tgNext(M0.pre.length);M0.pre.push(it);const d=tgData(it.snap);
    let p=null;for(let k=0;k<30&&!p;k++){const x=x0+Math.random()*(x1-x0),y=y0+Math.random()*(y1-y0);if(World.canStand(x,y)&&World.isSafe(x,y))p={x,y};}if(!p)p={x:World.spawn.x,y:World.spawn.y};
    // đi vào từ mép doanh trại / lối vào sân chờ
    const sp=World.spawn,e=makeBot(800+M0.pre.length,d,{x:(x0+x1)/2,y:(y0+y1)/2,r:Math.max(x1-x0,y1-y0)*.55},sp.x+(Math.random()-.5)*40,sp.y+(Math.random()-.5)*30,true);
    e.waiter=true;e.wander={t:time+2+Math.random()*2,x:p.x,y:p.y};bots.push(e);burst(e.x,e.y-24,'#ffe6a8',12,120);
    if(!quiet){if(Math.random()<.55&&typeof tutSay==='function')setTimeout(()=>{if(bots.includes(e))tutSay(e,TG_SAY[Math.floor(Math.random()*TG_SAY.length)],2.6);},700);
      if(Math.hypot(e.x-hero.x,e.y-hero.y)<900)message(svg('user')+`${esc(d.name)} đã tới · ${M0.pre.length}/${tgWaitN(M0)}`,1.8);}
  }
  function tgData(sn){const base=Player.create({name:sn.name,gender:sn.gender,stats:sn.stats});const d=Object.assign(base,JSON.parse(JSON.stringify(sn)));d.hp=1e9;d.mana=1e9;d.bag=base.bag.map(()=>null);return d;}
  let tgSeq=0;
  const tgNpcK=()=>(Number(CFG.tg_npc_phan_tram)||75)/100;
  // đòn đánh của một người (bản sao, NPC, lính thuê của bản sao, đồng đội): tầm, nhịp theo vũ khí và tốc đánh
  function tgMove(D,st){const A=ATK[st.type]||ATK.punch,ranged=A.kind==='arrow'||A.kind==='bolt'||A.kind==='orb',dur=(A.dur||.5)/(1+(D.tot.atkSpd||0)/100),spd=140*(1+(D.tot.moveSpd||0)/100);
    return {A,ranged,range:ranged?300:A.range*.8+18,windup:dur*(A.hit||.5),cd:dur+.35,speed:spd,run:spd};}
  function tgFighter(data,team,o){
    let D;try{D=Player.derive(data);}catch(e){return null;}
    const st=Player.stance(data),merc=!!o.merc,k=o.fake?tgNpcK():1;
    if(merc){const tm=Player.tierMul(data)*Player.mercPow();D.tot.hp=Math.round(D.tot.hp*tm);D.tot.def=Math.round(D.tot.def*Player.mercDefMul(data));D.dmgMul*=tm;}
    const id='_tg'+(++tgSeq),max=Math.max(50,Math.round(D.tot.hp*(Number(CFG.tg_mau_nhan)||3)*k)),mv=tgMove(D,st);
    MON[id]={name:data.name,hp:max,hpBase:max,dmg:1,def:Math.round((D.tot.def||0)*k),r:16,h:62,knock:.25,crit:0,dtype:'',lv:data.level||player.level||1,band:10,speed:mv.speed,run:mv.run,range:mv.range,windup:mv.windup,cd:mv.cd,aggro:900,respawn:1e9,
      drops:{m:0,l:0,p:0,g:0},rubies:[0,0],copper:0,exp:0,tac:[],skills:[],tg:1};
    return {type:id,key:id,data,D,name:data.name,fighter:true,bot:true,team,side:team,main:!merc,fake:!!o.fake,k,ranged:mv.ranged,akind:mv.A.kind,stance:st,x:0,y:0,hx:0,hy:0,facing:1,moving:false,walk:0,aim:{x:1,y:0},attack:null,atk:null,hurt:-9,dead:false,deadAt:0,
      max,hp:max,cd:time+1+Math.random(),heroDmg:0,stunUntil:0,frozenUntil:0,slowUntil:0,fearUntil:0,path:null,stuck:0,blockUntil:0,barrierUntil:0,burnAcc:0,swing:0,tgt:null,tgtAt:0};
  }
  // chỉ số gốc của trận Chiến trường (theo nhân vật lúc khai trận): một đòn của nhân vật, máu nhân vật sau giáp
  function tgBase(){const S=HD.tot,hit=Math.max(1,(S.dmgMin+Math.max(S.dmgMin,S.dmgMax))/2*HD.dmgMul),am=Player.armorMul(S.def,player.level||1);return {hit,hp:S.hp,am:Math.max(.05,am)};}
  // lính / tướng phe địch (vẽ bằng hình quân phương Bắc của sự kiện đột xuất)
  function tgCreep(w,boss,side='B'){
    const B=TGM.base,the=TGM.E.id==='the',up=1+w*(tgK('tang_phan_tram')||(the?8:15))/100,id='_tg'+(++tgSeq);
    let hp=Math.round(B.hit*(Number(CFG.tg_bac_linh_don)||6)*up*(boss?5:1)),dmg=B.hp*.04/B.am*(the?up:1+w*.1)*(boss?2:1);
    // lính phe ta (Thế giới): máu tính theo đòn lính địch (chịu ~10 đòn), đòn bằng 1/8 máu lính địch
    if(side==='A'){const eh=hp;hp=Math.round(dmg*10);dmg=eh/8;}
    MON[id]={name:side==='A'?'Quân phe ta':boss?'Tướng phương Bắc':the?'Quân phe địch':'Quân phương Bắc',hp,hpBase:hp,dmg,def:0,r:boss?24:16,h:boss?90:60,knock:boss?.1:.5,crit:0,dtype:'',lv:player.level||1,band:10,speed:120,run:130,range:boss?80:66,windup:.35,cd:1.3,aggro:420,respawn:1e9,
      drops:{m:0,l:0,p:0,g:0},rubies:[0,0],copper:0,exp:0,tac:[],skills:[],tg:1};
    return {type:id,art:side==='A'?'linh-phe-ta':boss?'tuong-phuong-bac':'linh-phuong-bac',name:MON[id].name,fighter:true,creep:true,side,ours:side==='A',main:false,dmg,x:0,y:0,hx:0,hy:0,facing:side==='A'?1:-1,moving:false,walk:0,aim:{x:-1,y:0},attack:null,atk:null,hurt:-9,dead:false,deadAt:0,
      max:hp,hp,cd:time+.5+Math.random(),heroDmg:0,stunUntil:0,frozenUntil:0,slowUntil:0,fearUntil:0,path:null,stuck:0,burnAcc:0,tgt:null,tgtAt:0};
  }
  // trụ, nhà chính: phe địch là "quái" (đánh được), phe ta nằm trong TGM.ours (lính địch đánh)
  function tgBuild(kind,side,tx,ty){
    const B=TGM.base,tower=kind==='tower',hp=side==='B'?Math.round(B.hit*(tower?(tgK('tru_don')||70):(tgK('nha_don')||130))):Math.round(B.hp*.04/B.am*(tower?120:260)*3),id='_tg'+(++tgSeq);
    const o={type:id,build:kind,side,ours:side==='A',name:(tower?'Trụ canh ':'Nhà chính ')+(side==='B'?'phe địch':'phe ta'),fighter:true,main:false,x:(tx+.5)*T,y:(ty+.5)*T+10,hx:0,hy:0,facing:1,moving:false,walk:0,hurt:-9,dead:false,deadAt:0,max:hp,hp,cd:time+2,
      dmg:tower?(side==='B'?B.hp*.08/B.am:B.hit*(Number(CFG.tg_bac_linh_don)||6)*.25):0,heroDmg:0,stunUntil:0,frozenUntil:0,slowUntil:0,fearUntil:0,burnAcc:0};
    MON[id]={name:o.name,hp,hpBase:hp,dmg:o.dmg,def:0,r:tower?30:46,h:tower?120:110,knock:0,crit:0,dtype:'',lv:player.level||1,band:10,speed:0,run:0,range:tower?330:0,windup:.3,cd:1.3,aggro:330,respawn:1e9,drops:{m:0,l:0,p:0,g:0},rubies:[0,0],copper:0,exp:0,tac:[],skills:[],tg:1};
    return o;
  }
  // đồng đội Chiến trường: người chơi ảo đi cùng phe (không nằm trong monsters nên đòn của người chơi không trúng)
  function tgMate(x,i){
    const d=tgData(x.snap),e=makeBot(700+i,d,{x:hero.x,y:hero.y,r:T},hero.x,hero.y,false),k=x.fake?tgNpcK():1,mv=tgMove(e.D,Player.stance(d));
    e.max=e.hp=Math.max(50,Math.round(e.D.tot.hp*(Number(CFG.tg_mau_nhan)||3)*k));Object.assign(e,{tut:true,mate:true,side:'A',k,M:mv,stance:Player.stance(d),ranged:mv.ranged,akind:mv.A.kind,cd:time+1,tgt:null,tgtAt:0,name:d.name});return e;
  }
  // Đúng giờ: dựng trận
  function tgFight(){
    const M0=TGM,E=M0.E,N=tgN(E);
    M0.phase='fight';M0.fightAt=Date.now();M0.base=tgBase();
    op({t:'tgStart',ev:M0.ev}).then(r=>{if(TGM===M0)M0.left=r.left;},e=>{if(TGM!==M0)return;message(svg('close')+(e.message==='TG_HET_LUOT'?'Hôm nay đã hết lượt':'Máy chủ không nhận trận này ('+e.message+')'),4);M0.noReward=true;});
    const C=N*(E.id==='the'?2:1)-1,list=M0.pre.slice(0,C);while(list.length<C)list.push(tgNext(list.length));
    M0.spot=new Map();for(let i=bots.length-1;i>=0;i--)if(bots[i].waiter){M0.spot.set(bots[i].name,{x:bots[i].x,y:bots[i].y});bots.splice(i,1);}
    if(E.id==='loi')return tgFightLoi(M0,list);
    if(E.id==='the')return tgFightThe(M0,list.slice(0,N-1),list.slice(N-1));
    // Chiến trường phương Bắc: đồng đội, trụ, nhà chính, đợt lính đầu
    const L=World.def.lane;M0.total=1;
    list.forEach((x,i)=>{const e=tgMate(x,i),a=i/Math.max(1,list.length)*PI2;e.x=hero.x+Math.cos(a)*60;e.y=hero.y+Math.sin(a)*40;if(!World.canStand(e.x,e.y)){e.x=hero.x;e.y=hero.y;}{const p=M0.spot&&M0.spot.get(e.name);if(p){e.x=p.x;e.y=p.y;}}e.home={x:e.x,y:e.y,r:T};bots.push(e);M0.teams.push({team:'A',name:e.name,fake:x.fake,alive:true});});
    M0.ours=[tgBuild('house','A',...L.ours.house),...L.ours.towers.map(p=>tgBuild('tower','A',...p))];
    for(const p of L.theirs.towers)monsters.push(tgBuild('tower','B',...p));M0.house=tgBuild('house','B',...L.theirs.house);monsters.push(M0.house);
    M0.nextWave=Date.now()+4000;LH_Audio.play('boss');shake(6);message(svg('flag')+`<b>${E.name}</b> · khai chiến! Phá nhà chính phe địch ở góc trên, giữ nhà chính phe ta`,5);
  }
  // Chiến trường thế giới: bản sao người chơi thật xếp phe địch trước (đối thủ là người thật), phần còn lại làm đồng đội
  function tgFightThe(M0,mates,foes){
    const L=World.def.lane;M0.total=1;M0.foeKills=0;
    mates.forEach((x,i)=>{const e=tgMate(x,i),a=i/Math.max(1,mates.length)*PI2;e.x=hero.x+Math.cos(a)*60;e.y=hero.y+Math.sin(a)*40;if(!World.canStand(e.x,e.y)){e.x=hero.x;e.y=hero.y;}{const p=M0.spot&&M0.spot.get(e.name);if(p){e.x=p.x;e.y=p.y;}}e.home={x:e.x,y:e.y,r:T};tgLane(e,i%3);bots.push(e);M0.teams.push({team:'A',name:e.name,fake:x.fake,alive:true});});
    M0.ours=[tgBuild('house','A',...L.ours.house),...L.ours.towers.map(p=>tgBuild('tower','A',...p))];
    for(const p of L.theirs.towers)monsters.push(tgBuild('tower','B',...p));M0.house=tgBuild('house','B',...L.theirs.house);monsters.push(M0.house);
    M0.foes=[];foes.forEach((x,i)=>{const d=tgData(x.snap),f=tgFighter(d,'B',{fake:x.fake});if(!f)return;f.revive=true;tgLane(f,i%3);tgAtSpawnB(f);monsters.push(f);M0.foes.push({name:d.name,fake:x.fake});
      for(const m of (x.snap.mercs||[]).slice(0,3)){const md=Player.makeMerc({...m});Object.assign(md,JSON.parse(JSON.stringify(m)));const g=tgFighter(md,'B',{fake:x.fake,merc:true});if(g){g.owner=f;g.revive=true;g.lane=f.lane;g.wp=0;tgAtSpawnB(g);monsters.push(g);}}});
    M0.nextWave=Date.now()+4000;LH_Audio.play('boss');shake(6);message(svg('flag')+`<b>${M0.E.name}</b> · ${mates.length+1} đấu ${M0.foes.length}! Theo ba đường phá nhà chính phe địch ở góc trên phải`,5);
  }
  // đi theo đường (Thế giới): phe ta từ dưới trái lên, phe địch ngược lại
  function tgLane(e,i){const P=World.def.lane&&World.def.lane.paths;if(!P)return;e.lane=i;e.wp=0;}
  function tgLanePts(e){const P=World.def.lane&&World.def.lane.paths;if(!P||e.lane==null)return null;const L=P[e.lane];return e.side==='B'?L.slice().reverse():L;}
  function tgAtSpawnB(e){const [sx,sy]=World.def.lane.theirs.spawn;let x=(sx+.5)*T+(Math.random()-.5)*80,y=(sy+.5)*T+(Math.random()-.5)*60;if(!World.canStand(x,y)){x=(sx+.5)*T;y=(sy+.5)*T;}e.x=e.hx=x;e.y=e.hy=y;}
  // một đợt lính hai phe (Thế giới): mỗi phe tg_the_gioi_linh_dot con chia đều ba đường, ra ở đầu đường của mình
  function tgWaveThe(){
    const M0=TGM,w=M0.wave++,n=Math.max(3,tgK('linh_dot')||9),per=Math.ceil(n/3);
    const cnt=s=>s==='A'?M0.ours.filter(o=>o.creep&&!o.dead).length:monsters.filter(o=>o.creep&&!o.dead).length;
    for(const side of ['A','B']){if(cnt(side)>80)continue;
      for(let i=0;i<n;i++){const ln=Math.floor(i/per)%3,c=tgCreep(w,false,side);c.lane=ln;c.wp=1;const pts=tgLanePts(c),[sx,sy]=pts[0];
        let x=(sx+.5)*T+(Math.random()-.5)*50,y=(sy+.5)*T+(Math.random()-.5)*40;if(!World.canStand(x,y)){x=(sx+.5)*T;y=(sy+.5)*T;}c.x=c.hx=x;c.y=c.hy=y;(side==='A'?M0.ours:monsters).push(c);}}
    if(w>0)message(svg('flag')+`Đợt lính thứ ${w+1} của hai phe xuất trận ở ba đường!`,2.4);
  }
  function tgFightLoi(M0,list){
    const R=World.def.ring,cx=(R.x+.5)*T,cy=(R.y+.5)*T,ents=[];
    list.forEach((x,i)=>{const team='t'+i,d=tgData(x.snap),f=tgFighter(d,team,{fake:x.fake});if(!f)return;M0.teams.push({team,name:d.name,fake:x.fake,alive:true,rank:0,main:f});ents.push(f);
      for(const m of (x.snap.mercs||[]).slice(0,3)){const md=Player.makeMerc({...m});Object.assign(md,JSON.parse(JSON.stringify(m)));const g=tgFighter(md,team,{fake:x.fake,merc:true});if(g){g.owner=f;ents.push(g);}}});
    // xếp mọi người quanh võ đài, người chơi ở phía nam (gần sân chờ)
    const tot=M0.teams.length+1,r0=R.r*T*.72;
    const place=(e,a,j)=>{const rr=r0-(j?28+j*14:0);let x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.92;if(!World.canStand(x,y)){const o=World.nearestOpen(Math.floor(x/T),Math.floor(y/T));if(o){x=(o.x+.5)*T;y=(o.y+.5)*T;}}e.x=e.hx=x;e.y=e.hy=y;e.facing=x<cx?1:-1;};
    place(hero,Math.PI/2,0);hero.attack=null;route=[];allies.forEach((e,i)=>{e.x=hero.x+FORM[i%6][0];e.y=hero.y+FORM[i%6][1];if(!World.canStand(e.x,e.y)){e.x=hero.x;e.y=hero.y;}e.path=null;});
    M0.teams.forEach((t,i)=>{const a=Math.PI/2+(i+1)/tot*PI2;let j=0;for(const e of ents)if(e.team===t.team)place(e,a,j++);});
    for(const e of ents){monsters.push(e);burst(e.x,e.y-24,'#ffd9a8',14,140);}
    M0.total=tot;LH_Audio.play('boss');shake(6);message(svg('sword')+`<b>${M0.E.name}</b> · khai đài! ${tot} người, ai trụ lại cuối cùng là người thắng`,4);
  }
  // một đợt lính phe địch: tg_bac_linh_dot con, mỗi 4 đợt thêm một tướng; số lính tăng dần
  function tgWave(){
    const M0=TGM,L=World.def.lane,[sx,sy]=L.theirs.spawn,w=M0.wave++,n=(Number(CFG.tg_bac_linh_dot)||5)+Math.floor(w/3),boss=w>0&&w%4===3;
    for(let i=0;i<n+(boss?1:0);i++){const c=tgCreep(w,boss&&i===n);let x=(sx+.5)*T+(Math.random()-.5)*90,y=(sy+.5)*T+(Math.random()-.5)*70;if(!World.canStand(x,y)){x=(sx+.5)*T;y=(sy+.5)*T;}c.x=c.hx=x;c.y=c.hy=y;monsters.push(c);}
    if(w>0)message(svg('flag')+`Đợt lính thứ ${w+1}${boss?' · có Tướng phương Bắc':''} tràn xuống!`,2.6);
  }
  const tgRingR=()=>{const R=World.def.ring,M0=TGM;if(!R)return 1e9;const full=R.r*T;if(!M0||M0.phase!=='fight')return full;const t=(Date.now()-M0.fightAt)/1000,dur=(M0.end-M0.fightAt)/1000;if(t<60)return full;return lerp(full,full*.22,clamp((t-60)/Math.max(30,dur-80),0,1));};
  function tgAliveTeams(){return TGM.teams.filter(t=>t.alive&&t.team!=='A');}
  // một kẻ địch gục (owner: ai ra đòn cuối) — người chơi, lính, thú, phân thân của người chơi hạ thì được thưởng
  function tgDown(m,owner){
    m.dead=true;m.deadAt=time;m.respawn=1e18;m.atk=null;m.attack=null;m.burn=null;burst(m.x,m.y-24,m.build?'#a89880':'#cfc6b8',m.build?40:18,m.build?220:150);if(m.build)shake(8);
    const mine=!['ffa','ring','mate','tower'].includes(owner);
    if(m.revive&&TGM){m.respawn=time+(Number(CFG.tg_the_gioi_hoi_sinh_giay)||15);m.wp=0;m.tgt=null;const x=m.x,y=m.y;tgAtSpawnB(m);m.x=x;m.y=y;if(m.main)TGM.foeKills=(TGM.foeKills||0)+1;}
    if(m.main&&!m.revive){const t=TGM&&TGM.teams.find(x=>x.team===m.team);if(t&&t.alive){t.alive=false;t.rank=tgAliveTeams().length+(TGM.out?0:1)+1;
      for(const o of monsters)if(o.fighter&&o.team===m.team&&!o.dead&&o!==m){o.dead=true;o.deadAt=time;o.respawn=1e18;burst(o.x,o.y-24,'#cfc6b8',10,120);}
      floater(m.x,m.y-90,'Bị loại','#ffb0a0',15);if(Math.hypot(m.x-hero.x,m.y-hero.y)<700)message(svg('close')+esc(m.name)+' bị loại · còn '+(tgAliveTeams().length+(TGM.out?0:1))+' người',2.6);}}
    if(m.build&&TGM){message(svg('flag')+`Đã phá ${esc(m.name)}${m===TGM.house?' · phe ta thắng!':''}`,3);if(m===TGM.house&&!TGM.ended)TGM.winAt=Date.now()+700;}
    if(!mine||!TGM||TGM.out||TGM.noReward)return;
    TGM.kills++;
    const sack={x:m.x+(Math.random()-.5)*10,y:m.y+4,born:time,boss:!!m.build};loot.push(sack);
    op({t:'tgKill',ev:TGM.ev,...(m.main||m.creep||m.build||!m.fighter?{}:{m:1})}).then(r=>{if(TGM)TGM.exp+=r.exp||0;sack.r=r;sack.openAt=time+.22;},e=>{sack.gone=time;if(e&&e.message==='TG_DU_LUOT_HA'&&TGM&&!TGM.capSaid){TGM.capSaid=1;message(svg('close')+'Đã đủ số lần hạ được thưởng trong trận',3);}});
    window.GameUI?.refresh();
  }
  // người chơi gục trong trận: Lôi đài bị loại (ở lại xem), Chiến trường về làng ngay; không mất đồ
  function tgHeroDown(){
    player.hp=0;hero.dead=1e12;hero.attack=null;hero.mountAct=null;route=[];LH_Audio.play('die');
    const M0=TGM;M0.out=true;
    if(M0.E.id==='loi'){const rank=tgAliveTeams().length+1;tgEnd(rank,false);message(svg('close')+`Bạn bị loại · hạng ${rank}/${M0.total} · ở lại xem hoặc bấm Về làng`,5);return;}
    tgEnd(1,false,true);message(svg('close')+'Bạn đã gục · rời chiến trường về làng (giữ kinh nghiệm đã nhận)',4);setTimeout(()=>{if(TGM===M0)tgLeave();},2600);
  }
  // our structure hit by creeps
  function tgOurHit(b,d){if(b.dead)return;b.hp-=d;b.hurt=time;
    if(b.creep){if(b.hp<=0){b.hp=0;b.dead=true;b.deadAt=time;b.atk=null;b.attack=null;burst(b.x,b.y-24,'#cfc6b8',12,130);}return;}
    floater(b.x+(Math.random()*20-10),b.y-110,String(Math.round(d)),'#ffb0a0',11);
    if(b.hp<=0){b.hp=0;b.dead=true;b.deadAt=time;burst(b.x,b.y-40,'#a89880',40,220);shake(8);message(svg('close')+esc(b.name)+' đã đổ!',3);if(b.build==='house'&&TGM&&!TGM.ended){TGM.lost='Nhà chính phe ta thất thủ';tgEnd(1,false);}}}
  function tgEnd(rank,win,dead){
    const M0=TGM;if(!M0||M0.ended)return;M0.ended=true;M0.rank=rank;M0.win=win;
    const done=r=>{if(TGM!==M0)return;M0.result={rank,n:M0.total,win,kills:M0.kills,exp:M0.exp,copper:r?r.copper:0,item:r?r.item:null,lost:r?r.lost:null,why:M0.lost||'',dead:!!dead,ev:M0.ev};if(r&&r.copper)moneyFloat(hero.x,hero.y-96,r.copper);LH_Audio.play(win?'rare':'coin');if(!dead)window.GameUI?.tgResult(M0.result,M0);};
    if(M0.noReward){done(null);return;}
    op({t:'tgEnd',ev:M0.ev,rank,n:M0.total,...(M0.E.id!=='loi'&&!win?{lose:1}:{}),...(dead?{dead:1}:{})}).then(done,()=>done(null));
  }
  // kẻ có thể bị m đánh: phe ta (người chơi, lính, thú, đồng đội, trụ / nhà phe ta) với kẻ địch; quái phe địch với đồng đội; Lôi đài: mọi người khác phe
  function tgTargets(m){
    const out=[];
    if(m.side==='A'){for(const o of monsters)if(o.fighter&&!o.dead)out.push(o);return out;}
    const ok=o=>m.side!=='B'||!World.isSafe(o.x,o.y); // lính phe địch không đánh vào doanh trại (vùng an toàn) phe ta
    if(!hero.dead&&ok(hero))out.push(hero);for(const e of allies)if(e.hp>0&&ok(e))out.push(e);for(const e of bots)if(e.mate&&!e.dead&&ok(e))out.push(e);
    if(TGM&&TGM.ours)for(const b of TGM.ours)if(!b.dead)out.push(b);
    for(const o of monsters)if(o.fighter&&!o.dead&&!o.build&&o.side!==m.side&&o.side!=='B')out.push(o);
    return out;
  }
  const tgDead=t=>t===hero?hero.dead:(t.dead||t.hp<=0);
  // đường hành quân khi không có ai trong tầm: lính địch xuống nhà chính phe ta, đồng đội lên trụ / nhà phe địch gần nhất còn đứng
  function tgMarch(m){
    const pts=tgLanePts(m);
    if(pts&&m.wp<pts.length){let [px,py]=pts[m.wp];px=(px+.5)*T;py=(py+.5)*T;if(Math.hypot(px-m.x,py-m.y)<70){m.wp++;if(m.wp<pts.length){[px,py]=pts[m.wp];px=(px+.5)*T;py=(py+.5)*T;}}if(m.wp<pts.length)return {x:px,y:py};}
    if(m.side==='B'&&TGM.E.id==='the'){const h=TGM.ours[0];if(h&&!h.dead)return {x:h.x,y:h.y};}
    if(m.side==='B'){const b=TGM.ours.find(x=>!x.dead&&x.build==='tower')||TGM.ours.find(x=>!x.dead);return b?{x:b.x,y:b.y}:null;}
    let best=null,bd=1e9;for(const o of monsters)if(o.build&&!o.dead){const d=Math.hypot(o.x-m.x,o.y-m.y);if(d<bd){bd=d;best=o;}}return best?{x:best.x,y:best.y}:null;
  }
  // trí khôn chung: bản sao / NPC (Lôi đài), lính phe địch, đồng đội
  function updateFighter(m,dt){
    if(!TGM||TGM.phase!=='fight'){m.moving=false;return;}
    if(m.build){tgTower(m,dt);return;}
    const M=m.M||MON[m.type],slowK=time<(m.slowUntil||0)?m.slowK:1,loi=TGM.E.id==='loi';
    if(m.attack&&time>=m.attack.start+m.attack.dur)m.attack=null;
    if(m.atk){if(time>=m.atk.at&&!m.atk.done){m.atk.done=true;tgStrike(m);}if(m.dead)return;if(m.atk&&time>=m.atk.end)m.atk=null;m.moving=false;return;}
    const R=World.def.ring;if(R){const cx=(R.x+.5)*T,cy=(R.y+.5)*T;if(Math.hypot(m.x-cx,m.y-cy)>tgRingR()-24){steer(m,{x:cx,y:cy},M.run*slowK,dt,14,false);m.moving=m.stepMoved>.05;m.walk+=m.stepMoved*.09;if(Math.abs(cx-m.x)>3)m.facing=cx<m.x?-1:1;return;}}
    const reach=o=>Math.hypot(o.x-m.x,o.y-m.y)-(o.build?(o.build==='house'?40:26):0);
    let tg=m.tgt;if(!tg||time>m.tgtAt||tgDead(tg)){tg=null;let bd=loi?1e9:(m.mate?460:420);for(const o of tgTargets(m)){const d=reach(o)*(o===hero?.9:1)*(o.build?1.4:1);if(d<bd){bd=d;tg=o;}}m.tgt=tg;m.tgtAt=time+1.5+Math.random()*1.5;}
    let goal=null;
    if(!tg){goal=loi?null:tgMarch(m);if(!goal){m.moving=false;return;}}
    else{const dx=tg.x-m.x,dy=tg.y-m.y,dist=reach(tg);if(Math.abs(dx)>3)m.facing=dx<0?-1:1;const l=Math.hypot(dx,dy)||1;m.aim={x:dx/l,y:(dy-10)/l};
      if(dist>M.range)goal={x:tg.x,y:tg.y};
      else{m.moving=false;
        if(time>m.cd){const dur=M.cd-.35;m.atk={at:time+M.windup,end:time+dur,done:false,tg};m.cd=time+M.cd*(.9+Math.random()*.3);
          const st=m.stance;if(st){if(st.dual)m.swing^=1;m.attack={type:st.type,skill:'normal',start:time,dur,hit:.5,hitDone:false,aim:{...m.aim},stance:st,hand:st.dual&&m.swing?'left':'right'};}}
        return;}}
    steer(m,goal,M.run*slowK,dt,14,false);m.moving=m.stepMoved>.05;m.walk+=m.stepMoved*.09;if(Math.abs(goal.x-m.x)>3)m.facing=goal.x<m.x?-1:1;
  }
  function tgHitTarget(m,t,d,crit){
    if(t===hero)hurtHero(d,m);
    else if(t.mate)hurtBot(t,d);
    else if(t.ours)tgOurHit(t,d);
    else if(t.fighter){const l=Math.hypot(t.x-m.x,t.y-m.y)||1;hitMonster(t,{abs:d,owner:m.side==='A'?'mate':m.ours?'tower':'ffa',color:crit?'#ffd070':'#e8dcc8'},(t.x-m.x)/l,(t.y-m.y)/l);}
    else hurtAlly(t,d);
  }
  function tgStrike(m){
    const t=m.atk.tg,M=m.M||MON[m.type];if(!t||tgDead(t))return;
    const dist=Math.hypot(t.x-m.x,t.y-m.y)-(t.build?46:0);if(dist>M.range+40)return;
    let d,crit=false;
    if(m.creep)d=m.dmg*(.85+Math.random()*.3);
    else{const S=m.D.tot,lo=S.dmgMin||1,hi=Math.max(lo,S.dmgMax||lo),A=ATK[m.stance.type]||ATK.punch;d=(lo+Math.random()*(hi-lo))*m.D.dmgMul*(A.dmg||1)*m.k;if(Math.random()*100<(S.crit2||0)+(S.crit3||0)){d*=2;crit=true;}}
    if(m.ranged){fx.push({kind:'bolt',x1:m.x+m.facing*20,y1:m.y-34,x2:t.x,y2:t.y-30,color:m.akind==='orb'?'#c8a0ff':'#f0e2c8',age:0,life:.18});}
    else fx.push({kind:'arc',x:m.x,y:m.y-18,ang:Math.atan2(m.aim.y,m.aim.x),r:Math.min(90,M.range*.7),arc:1.5,color:m.creep?'#ffb0a0':'#f0e2c8',age:0,life:.2});
    tgHitTarget(m,t,d,crit);
  }
  // trụ canh bắn kẻ địch gần nhất trong tầm (trụ phe địch: người chơi, lính, đồng đội; trụ phe ta: lính phe địch)
  function tgTower(b,dt){
    if(b.build!=='tower'||b.dead||time<b.cd)return;const R=330;let tg=null,bd=R;
    const list=b.side==='B'?[...(hero.dead?[]:[hero]),...allies.filter(e=>e.hp>0),...bots.filter(e=>e.mate&&!e.dead),...TGM.ours.filter(o=>o.creep&&!o.dead)]:monsters.filter(o=>o.fighter&&!o.dead&&!o.build);
    for(const o of list){const d=Math.hypot(o.x-b.x,o.y-b.y);if(d<bd){bd=d;tg=o;}}if(!tg)return;b.cd=time+1.3;
    fx.push({kind:'bolt',x1:b.x,y1:b.y-110,x2:tg.x,y2:tg.y-30,color:b.side==='B'?'#ff7050':'#7fd0ff',age:0,life:.22});burst(tg.x,tg.y-30,b.side==='B'?'#ff8a60':'#9fdcff',8,120);
    tgHitTarget(b,tg,b.dmg*(.9+Math.random()*.2),false);
  }
  function tgTick(dt){
    if(!TGM)return;const M0=TGM,now=Date.now();
    if(World.id!==M0.E.map){tgClear();return;}
    if(M0.phase==='lobby'){
      if(!M0.asked&&now>=M0.askAt)tgAsk();
      // người tham gia lần lượt vào (chờ máy chủ trả bản sao tối đa ~6 giây đầu để người tới trước là người thật)
      let k=0;while(M0.arr&&M0.arr.length&&now>=M0.arr[0]&&(M0.snaps||now>M0.askAt+3000)&&k<4){M0.arr.shift();tgArrive(M0,now<M0.quietUntil||k>0);k++;}
      if(time>(M0.chatAt||0)){M0.chatAt=time+5+Math.random()*7;const w=bots.filter(b=>b.waiter);if(w.length&&typeof tutSay==='function'){const e=w[Math.floor(Math.random()*w.length)];if(Math.hypot(e.x-hero.x,e.y-hero.y)<700)tutSay(e,TG_SAY[Math.floor(Math.random()*TG_SAY.length)],2.6);}}
      if(!World.isSafe(hero.x,hero.y)&&!hero.dead){const sp=World.spawn;hero.x=sp.x;hero.y=sp.y;route=[];message(svg('flag')+`Chưa tới giờ ${M0.E.id==='loi'?'khai đài · chờ trong sân':'khai chiến · chờ trong doanh trại'}`,2.4);}
      tgBannerSet(`${svg('flag')}<b>${esc(M0.E.short)}</b> · ${M0.E.id==='loi'?'khai đài':'khai chiến'} sau <b>${mmss(M0.start-now)}</b> · <b>${M0.pre.length+1}</b>/${tgWaitN(M0)+1}<span class="tg-x"> người${M0.E.id==='the'?' phe ta':''}</span> <button type="button" data-tg="leave">Rời</button>`);
      if(now>=M0.start){if(!M0.asked)tgAsk();if(M0.snaps||now>=M0.start+3500)tgFight();}
      return;
    }
    for(let i=monsters.length-1;i>=0;i--){const m=monsters[i];if(m.fighter&&m.dead&&!m.build&&!m.revive&&time-m.deadAt>1.4){delete MON[m.type];monsters.splice(i,1);}}
    if(M0.phase==='fight'&&M0.E.id!=='loi'){
      // đồng đội: tự đánh, gục thì 15 giây sau đứng dậy ở doanh trại phe ta
      for(const e of bots)if(e.mate){if(e.dead){if(time>(e.respawnAt||0)&&!M0.ended){const sp=World.spawn;Object.assign(e,{dead:0,hp:e.max,x:sp.x+(Math.random()-.5)*60,y:sp.y+(Math.random()-.5)*40,attack:null,atk:null,tgt:null,wp:0});e.respawnAt=0;}else if(!e.respawnAt||e.respawnAt-time>60)e.respawnAt=time+(M0.E.id==='the'?(Number(CFG.tg_the_gioi_hoi_sinh_giay)||15):15);continue;}if(!M0.ended)updateFighter(e,dt);else e.moving=false;}
      for(let i=M0.ours.length-1;i>=0;i--){const b=M0.ours[i];if(b.creep){if(b.dead){if(time-b.deadAt>1.4){delete MON[b.type];M0.ours.splice(i,1);}continue;}if(!M0.ended)updateFighter(b,dt);else b.moving=false;continue;}if(!M0.ended)tgTower(b,dt);}
      if(M0.winAt&&!M0.ended&&now>=M0.winAt)tgEnd(1,true);
      if(!M0.ended&&!M0.winAt&&now>=M0.nextWave){if(M0.E.id==='the')tgWaveThe();else tgWave();M0.nextWave=now+(tgK('dot_giay')||30)*1000;}
      if(!M0.ended&&now>=M0.end){M0.lost='Hết giờ mà chưa phá được nhà chính phe địch';tgEnd(1,false);}
      if(M0.ended&&!M0.overAt)M0.overAt=now;
      const tw=monsters.filter(o=>o.build&&!o.dead).length;
      tgBannerSet(`${svg('flag')}<b>${esc(M0.E.short)}</b> · đợt ${M0.wave}${M0.E.id==='the'?`<span class="tg-x"> · hạ ${M0.foeKills||0} cao thủ</span>`:''} · công trình địch còn <b>${tw}</b> · ${mmss(M0.end-now)}${M0.ended?` · <button type="button" data-tg="result">Kết quả</button>`:''} <button type="button" data-tg="leave">${M0.ended?'Về làng':'Rời'}</button>`);
      return;
    }
    if(M0.phase==='fight'){
      const R=World.def.ring,cx=(R.x+.5)*T,cy=(R.y+.5)*T,rr=tgRingR(),burn=Number(CFG.tg_vong_mat_mau)||4;
      if(!hero.dead&&Math.hypot(hero.x-cx,hero.y-cy)>rr){M0.hzAcc=(M0.hzAcc||0)+HD.tot.hp*burn/100*dt;if(M0.hzAcc>=1){const v=Math.floor(M0.hzAcc);M0.hzAcc-=v;player.hp-=v;floater(hero.x,hero.y-70,'-'+v,'#ff7060',12);if(time>(M0.hzSaid||0)){M0.hzSaid=time+4;message(svg('flame')+'Ngoài vòng đài · mất máu dần, chạy vào giữa!',2.4);}if(player.hp<=0)die();}}
      for(const m of monsters)if(m.fighter&&!m.dead&&Math.hypot(m.x-cx,m.y-cy)>rr){m.rzAcc=(m.rzAcc||0)+m.max*burn/100*dt;if(m.rzAcc>=1){const v=Math.floor(m.rzAcc);m.rzAcc-=v;hitMonster(m,{abs:v,owner:'ring',color:'#ff7060'},0,0);}}
      const alive=tgAliveTeams().length+(M0.out?0:1);
      if(!M0.out&&!M0.ended&&alive<=1)tgEnd(1,true);
      if(!M0.ended&&now>=M0.end){if(!M0.out)tgEnd(1,true);}
      if(now>=M0.end+1000||(M0.ended&&alive<=1))M0.phase='over';
      tgBannerSet(`${svg('sword')}<b>${esc(M0.E.short)}</b> · còn <b>${alive}</b>/${M0.total} · ${mmss(M0.end-now)}${M0.ended?` · <button type="button" data-tg="result">Kết quả</button>`:''} <button type="button" data-tg="leave">${M0.out||M0.ended?'Về làng':'Rời'}</button>`);
      return;
    }
    if(M0.phase==='over')tgBannerSet(`${svg('flag')}<b>${esc(M0.E.short)}</b> · đã kết thúc ${M0.result?`· hạng <b>${M0.result.rank}</b>/${M0.result.n} <button type="button" data-tg="result">Kết quả</button>`:''} <button type="button" data-tg="leave">Về làng</button>`);
  }
  // vòng đài (vẽ dưới chân mọi người): nền đá, vạch vòng an toàn, vùng ngoài vòng tô đỏ khi đang thu hẹp
  function tgDrawGround(){
    const R=World.def&&World.def.ring;if(!R)return;const cx=(R.x+.5)*T,cy=(R.y+.5)*T,full=R.r*T,rr=tgRingR();
    ctx.save();ctx.strokeStyle='#e0b04088';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,full,0,PI2);ctx.stroke();ctx.strokeStyle='#6a2a1a66';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,full*.55,0,PI2);ctx.stroke();
    if(TGM&&TGM.phase!=='lobby'&&rr<full-2){ctx.fillStyle='rgba(200,40,20,.16)';ctx.beginPath();ctx.arc(cx,cy,full+40,0,PI2);ctx.arc(cx,cy,rr,0,PI2,true);ctx.fill();ctx.strokeStyle='#ff6040';ctx.lineWidth=3+Math.sin(time*6);ctx.setLineDash([14,10]);ctx.beginPath();ctx.arc(cx,cy,rr,0,PI2);ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
  }
  // trụ canh (tháp gỗ trên bệ đá) và nhà chính (doanh trại có mái, cổng): phe ta cờ xanh, phe địch cờ đỏ; đổ thì còn đống gạch
  function drawBuilding(b){
    const c=ctx,col=b.side==='B'?'#c02020':'#2a6ab0',fl=time-b.hurt<.1;c.save();c.translate(b.x,b.y);
    ell(c,0,4,b.build==='house'?64:36,b.build==='house'?18:11,'#243d3550');
    if(b.dead){for(let i=0;i<9;i++)ell(c,(i%3-1)*16+Math.sin(i*7)*5,-4-Math.floor(i/3)*6,11,6,i%2?'#7a6a58':'#5a4e40');c.restore();return;}
    if(fl)c.filter='brightness(1.6)';
    if(b.build==='tower'){
      c.fillStyle='#7a7064';c.beginPath();c.moveTo(-28,0);c.lineTo(28,0);c.lineTo(22,-26);c.lineTo(-22,-26);c.closePath();c.fill();c.strokeStyle='#4a4238';c.lineWidth=1.5;for(let y=-8;y>-26;y-=9){c.beginPath();c.moveTo(-26,y);c.lineTo(26,y);c.stroke();}
      line(c,[-16,-26,-12,-96],'#6a4a2a',5);line(c,[16,-26,12,-96],'#6a4a2a',5);line(c,[-14,-50,14,-72],'#5a3a1e',3);line(c,[14,-50,-14,-72],'#5a3a1e',3);
      c.fillStyle='#8a6038';c.fillRect(-22,-104,44,12);c.fillStyle='#5a3a1e';for(let x=-22;x<22;x+=8)c.fillRect(x,-112,5,8);
      c.fillStyle='#3a2a1a';c.beginPath();c.moveTo(-26,-112);c.lineTo(0,-132);c.lineTo(26,-112);c.closePath();c.fill();
      line(c,[0,-132,0,-158],'#4a3220',2);const w=Math.sin(time*3+b.x)*3;poly(c,[0,-158,22,-153+w,18,-147+w*.6,24,-140+w,0,-138],col);
    }else{
      c.fillStyle='#8a7a62';c.fillRect(-58,-50,116,50);c.strokeStyle='#5a4c3c';c.lineWidth=1.5;for(let y=-10;y>-50;y-=10){c.beginPath();c.moveTo(-58,y);c.lineTo(58,y);c.stroke();}
      c.fillStyle='#5a2a1a';c.fillRect(-16,-38,32,38);c.fillStyle='#3a1a10';c.beginPath();c.arc(0,-38,16,Math.PI,0);c.fill();
      c.fillStyle='#3a2a1a';c.beginPath();c.moveTo(-70,-50);c.lineTo(-50,-84);c.lineTo(50,-84);c.lineTo(70,-50);c.closePath();c.fill();c.fillStyle='#6a1a14';c.beginPath();c.moveTo(-50,-84);c.lineTo(-30,-104);c.lineTo(30,-104);c.lineTo(50,-84);c.closePath();c.fill();
      for(const s of [-1,1]){line(c,[s*40,-104,s*40,-134],'#4a3220',2);const w=Math.sin(time*3+s)*3;poly(c,[s*40,-134,s*40+18,-129+w,s*40+15,-123+w*.6,s*40+20,-117+w,s*40,-115],col);}
      ell(c,-36,-26,6,8,'#ffb060');ell(c,36,-26,6,8,'#ffb060');
    }
    c.filter='none';
    const w=b.build==='house'?96:60,y=b.build==='house'?-122:-170;roundRect(c,-w/2,y,w,7,3,'#0a120ecc');roundRect(c,-w/2,y,w*Math.max(0,b.hp/b.max),7,3,b.side==='B'?'#e05a4a':'#5fb0ff');
    c.font='600 12px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#1a120ccc';c.strokeText(b.name,0,y-6);c.fillStyle=b.side==='B'?'#ffb0a0':'#bfe3ff';c.fillText(b.name,0,y-6);
    c.restore();
  }
  /* ---------- Đổi bản đồ: lưu, tải gói dữ liệu bản đồ (lần đầu), dựng lại nền, quái, dân làng ---------- */
  let portalArmed=!World.portalAt(hero.x,hero.y),prefAt=0;
  // Cảnh nhạc nền: làng / trong thành (an toàn), hoang dã, hang ổ trùm (trùm còn sống)
  function musicScene(){const z=World.zoneAt(hero.x,hero.y)||'';LH_Audio.setScene(safe?(z==='Trong thành'?'citadel':'village'):(/^Hang ổ/.test(z)&&monsters.some(m=>!m.dead&&MON[m.type].boss&&Math.hypot(m.x-hero.x,m.y-hero.y)<420)?'boss':'wild'));}
  async function travel(id,tx,ty){
    if(travelling)return;travelling=true;route=[];targetNPC=null;keys.clear();joystick={x:0,y:0};holdAttack=false;dialogNPC=null;dialogEl.hidden=true;
    let def;
    // v10.13: màn hình chờ khi đổi vùng (tải gói bản đồ lúc này); quá 20 giây thì bỏ (bấm lại sẽ tải lại), không khóa game vĩnh viễn
    const L=window.LH_Loader,nm=(LH_MAPS[id]&&LH_MAPS[id].name)||(Player.REGIONS.find(r=>r.id===id)||{}).name||'';
    if(L){L.show({scene:true,label:'Đang tới '+nm,bg:'vao_lang'}).step(8,null,70);}
    const slow=setTimeout(()=>{if(travelling&&L)L.step(30,'Mạng chậm, xin chờ…',70);},2500);
    try{def=await Promise.race([World.load(id),new Promise((_,no)=>setTimeout(()=>no(Error('CHO_LAU')),20000))]);}catch(e){clearTimeout(slow);if(L)L.hide();World.cancel&&World.cancel(id);message(svg('close')+(e.message==='CHO_LAU'?'Tải vùng quá lâu, kiểm tra mạng rồi bấm lại':'Chưa mở được vùng này'));travelling=false;portalArmed=false;window.GameUI?.refresh();return false;}
    clearTimeout(slow);if(L)L.step(70,'Dựng '+nm,96);
    if(cave&&cave.ph==='fight'&&World.id==='hang-cuop'&&id==='sa-mac')caveChase=time+60; // v10.29: bị toán cướp rượt ra khỏi hang
    World.use(def);W=World.W;H=World.H;grid=World.grid;
    tut=null;cave=null;EV=null;hqReset();evSlot=-1;evBannerSet(null);monsters.length=0;eshots.length=0;WKB=null;sprReset();PERF.changed=time;PERF.win=PERF.slow=PERF.mid=0;monsters.push(...makeMonsters());warmMap();spawnBots();syncMerc();projectiles.length=0;particles.length=0;floaters.length=0;fx.length=0;
    Object.assign(hero,tx!=null?{x:(tx+.5)*T,y:(ty+.5)*T}:World.spawn,{map:World.id,attack:null,mountAct:null});
    // điểm đến bị chặn (đá, tường, vật) thì dời sang ô trống gần nhất — không bao giờ kẹt khi vừa qua cổng
    if(!World.canStand(hero.x,hero.y)){const o=World.nearestOpen(Math.floor(hero.x/T),Math.floor(hero.y/T));if(o){hero.x=(o.x+.5)*T;hero.y=(o.y+.5)*T;}}
    allies.forEach((e,i)=>{e.x=hero.x+FORM[i%6][0];e.y=hero.y+FORM[i%6][1];if(!World.canStand(e.x,e.y)){e.x=hero.x;e.y=hero.y;}e.path=null;});
    bridgeSide=[];portalArmed=!World.portalAt(hero.x,hero.y);safe=World.isSafe(hero.x,hero.y);refreshHD();caveEnter(); // v10.29: dựng toán cướp sau khi đặt nhân vật
    groundDraw();resize();keepLocal();window.GameUI?.refresh();message(svg('pin')+World.name);LH_Audio.play('portal');musicScene();if(L)await L.done({label:World.name,fast:true});travelling=false;return true;
  }
  function respawn(){if(World.id!==World.DEFAULT){hero.dead=0;refreshHD();player.hp=HD.tot.hp;player.mana=HD.tot.mp;hero.invuln=time+2;travel(World.DEFAULT);return;}
    hero.dead=0;hero.mountAct=null;refreshHD();player.hp=HD.tot.hp;player.mana=HD.tot.mp;Object.assign(hero,World.spawn);hero.invuln=time+2;hero.attack=null;monsters.forEach(m=>{m.aggro=-9;m.atk=null;});resize();}
  /* ---------- Cảnh làng: chó vàng chạy quanh làng, mèo đuổi chuột sau chuồng, đống lửa ---------- */
  const DOG_PATH=[[5.6,14.5],[13.4,14.5],[16.5,14.4],[24.4,14.5],[24.4,17.3],[16.5,17.3],[13,17.3],[5.6,17.3]].map(([x,y])=>({x:x*T,y:y*T}));
  const dog={amb:'dog',x:DOG_PATH[0].x,y:DOG_PATH[0].y,i:1,facing:1,walk:0,moving:false,rest:0,restUntil:0,bark:-9};
  const cat={amb:'cat',x:0,y:0,facing:1,walk:0,moving:false,hop:0},mouse={amb:'mouse',x:0,y:0,facing:1,walk:0,moving:false},chase={u:0,lag:.5};
  const village={list:[dog,cat,mouse]};
  const CH=(u)=>({x:(19.1+5.2*Math.sin(u*.9)+.6*Math.sin(u*2.3))*T,y:(24.9+1.05*Math.sin(u*1.7+1))*T});
  function updateVillage(dt){
    if(World.def.ambient!=='village')return;
    // chó: chạy vòng quanh làng, thỉnh thoảng ngồi nghỉ; gặp người thì đứng vẫy đuôi
    const near=Math.hypot(hero.x-dog.x,hero.y-dog.y)<70;dog.moving=false;
    if(time>dog.restUntil&&!near){
      const g=DOG_PATH[dog.i],dx=g.x-dog.x,dy=g.y-dog.y,l=Math.hypot(dx,dy);
      if(l<6){dog.i=(dog.i+1)%DOG_PATH.length;if(Math.random()<.35){dog.restUntil=time+2+Math.random()*3;}}
      else{const sp=Math.min(l,130*dt);dog.x+=dx/l*sp;dog.y+=dy/l*sp;dog.walk+=sp*.2;dog.moving=true;if(Math.abs(dx)>1)dog.facing=dx<0?-1:1;}
    }
    if(near&&time-dog.bark>4){dog.bark=time;}
    // mèo đuổi chuột: chuột chạy trước, mèo theo sau, lúc áp sát thì vồ
    chase.u+=dt*(.55+.25*Math.sin(time*.7));chase.lag=.32+.22*Math.sin(time*.45);
    const pm={...mouse},a=CH(chase.u),b=CH(chase.u-chase.lag);
    mouse.x=a.x;mouse.y=a.y;mouse.moving=true;mouse.walk+=Math.hypot(a.x-pm.x,a.y-pm.y)*.5;if(Math.abs(a.x-pm.x)>.1)mouse.facing=a.x<pm.x?-1:1;
    const pc={x:cat.x,y:cat.y};cat.x=b.x;cat.y=b.y;const mv=Math.hypot(b.x-pc.x,b.y-pc.y);cat.moving=mv>.1;cat.walk+=mv*.25;if(Math.abs(b.x-pc.x)>.1)cat.facing=b.x<pc.x?-1:1;
    cat.hop=chase.lag<.4?Math.abs(Math.sin(time*7))*8:0;
    // tàn lửa bay lên từ đống lửa
    for(const f of World.fires)if(Math.random()<dt*6&&Math.abs(f.x-hero.x)<900)particles.push({x:f.x+(Math.random()-.5)*12,y:f.y-18,vx:(Math.random()-.5)*20,vy:-50-Math.random()*40,age:0,life:.9+Math.random()*.6,color:Math.random()<.5?'#ffcf5a':'#ff8a3d',size:1.5+Math.random()*1.5,grav:-10});
  }
  function drawAmbient(o){
    const c=ctx;c.save();
    if(o.amb==='dog'){
      const g=o.walk,bob=o.moving?Math.abs(Math.sin(g))*2:0;ell(c,o.x,o.y+2,16,4,'#243d3540');
      c.translate(o.x,o.y-bob);c.scale(o.facing,1);
      const legs=(x,ph)=>line(c,[x,-10,x+(o.moving?Math.sin(g+ph)*5:0),0],'#9a6a34',3.2);
      legs(-9,0);legs(8,Math.PI);
      const wag=Math.sin(time*(o.moving?14:9))*.6;c.save();c.translate(-13,-15);c.rotate(-.9+wag*.6);line(c,[0,0,-2,-10],'#c99a58',3.2);c.restore();
      ell(c,0,-14,14,6.5,'#c99a58');ell(c,1,-11,10,3,'#e6c48e');legs(-6,Math.PI);legs(11,0);
      ell(c,15,-20,7,6,'#c99a58');ell(c,21,-18,4.5,3.4,'#e6c48e');ell(c,24.5,-19,1.8,1.6,'#2a1f18');
      poly(c,[11,-24,13,-31,16,-24],'#8a5a2a');c.fillStyle='#2a1f18';c.fillRect(16,-22,2,2);
      if(time-o.bark<.6){c.scale(o.facing,1);c.globalAlpha=1-(time-o.bark)/.6;c.strokeStyle='#f2e6c8';c.lineWidth=1.5;for(let i=1;i<3;i++){c.beginPath();c.arc(30*o.facing,-20,4+i*5,-.6,.6);c.stroke();}}
    }else if(o.amb==='cat'){
      const g=o.walk;ell(c,o.x,o.y+2,11,3,'#243d3540');c.translate(o.x,o.y-o.hop);c.scale(o.facing,1);
      const legs=(x,ph)=>line(c,[x,-7,x+(o.moving?Math.sin(g+ph)*4:0),0],'#7a6e66',2.4);
      legs(-6,0);legs(6,Math.PI);
      c.strokeStyle='#8f837a';c.lineWidth=2.6;c.lineCap='round';c.beginPath();c.moveTo(-9,-10);c.quadraticCurveTo(-18,-12,-16,-22+Math.sin(time*5)*2);c.stroke();
      ell(c,0,-10,10,4.6,'#9a8f86');c.strokeStyle='#6e635c';c.lineWidth=1.2;for(let x=-5;x<=5;x+=4){c.beginPath();c.moveTo(x,-14);c.lineTo(x-1.5,-7);c.stroke();}
      legs(-3,Math.PI);legs(8,0);ell(c,10,-15,5.2,4.6,'#9a8f86');poly(c,[7,-18,8,-23,11,-19],'#9a8f86');poly(c,[11,-19,13,-23,14,-18],'#9a8f86');
      c.fillStyle='#d9e86a';c.fillRect(11.5,-16.5,1.6,1.6);c.fillStyle='#f0b4a8';c.fillRect(14.5,-14,1.4,1.2);
    }else if(o.amb==='mouse'){
      ell(c,o.x,o.y+1,5,1.6,'#243d3540');c.translate(o.x,o.y);c.scale(o.facing,1);
      line(c,[-5,-3,-10,-2+Math.sin(time*20)*1.5,-14,-4],'#c9a8a0',1);ell(c,0,-3,5.5,3,'#8c8682');ell(c,5,-4,2.6,2.2,'#8c8682');ell(c,3.5,-6.5,1.6,1.6,'#c9a8a0');c.fillStyle='#1e1a18';c.fillRect(6,-5,1,1);
    }
    c.restore();
  }
  // Đống lửa: vòng đá, củi chéo, lửa bập bùng, quầng sáng
  function campfire(o){
    const x=o.x,y=o.y,c=ctx;
    const g=c.createRadialGradient(x,y-10,4,x,y-10,70);g.addColorStop(0,'#ffb04a55');g.addColorStop(1,'#ffb04a00');c.fillStyle=g;c.beginPath();c.ellipse(x,y-6,70,38,0,0,PI2);c.fill();
    for(let i=0;i<8;i++){const a=i/8*PI2;ell(c,x+Math.cos(a)*16,y+Math.sin(a)*6,5,3.6,i%2?'#7d7a72':'#9a968c');}
    line(c,[x-14,y+2,x+12,y-6],'#5a3a22',5);line(c,[x-12,y-6,x+14,y+2],'#6b4a2c',5);
    for(let i=0;i<3;i++){const f=Math.sin(time*(9+i*2.3)+i)*3,h=22+Math.sin(time*7+i*1.7)*5-i*5,w=9-i*2.2,ox=(i-1)*4;
      c.fillStyle=['#ff7a2a','#ffb03a','#ffe9a0'][i];c.beginPath();c.moveTo(x+ox-w,y-2);c.quadraticCurveTo(x+ox-w*.8,y-h*.6,x+ox+f,y-h);c.quadraticCurveTo(x+ox+w*.8,y-h*.6,x+ox+w,y-2);c.closePath();c.fill();}
  }
  /* ---------- Đồng đội: tối đa 4 lính cùng đi theo + quái thu phục bằng sách Ma công ---------- */
  const allies=[],petSpawn={},FORM=[[-46,16],[-50,-22],[-88,2],[-92,34],[-22,46],[-26,-44]];
  // v10.13: phân thân — bản sao của nhân vật (cùng đồ, chỉ số) đánh cùng 10 giây; tối đa 2 phân thân cùng lúc
  const clones=[];
  function spawnClone(){
    if(clones.filter(c=>c.until>time).length>=2)return;
    const data={mid:'clone-'+Math.random().toString(36).slice(2,8),name:player.name,gender:player.gender,equipment:player.equipment,stats:player.stats,alloc:player.alloc,skillSlots:player.skillSlots,activeBook:player.activeBook,level:player.level,cmd:0,on:true,hpFrac:1,src:'clone'};
    const e={key:data.mid,pet:false,clone:true,until:time+10,data,x:hero.x-hero.facing*30,y:hero.y+10,facing:hero.facing,moving:false,walk:0,aim:{x:1,y:0},attack:null,atk:null,hurt:-9,dead:0,deadAt:0,blockUntil:0,barrierUntil:0,cd:0,hp:0,swing:0,aggro:-9,stunUntil:0,stuck:0,path:null};
    if(!World.canStand(e.x,e.y)){e.x=hero.x;e.y=hero.y;}
    clones.push(e);syncMerc();fx.push({kind:'ring',x:e.x,y:e.y-20,r0:6,r1:70,color:'#9fe8ff',age:0,life:.5,lw:4});burst(e.x,e.y-30,'#9fe8ff',18,160);floater(e.x,e.y-80,'Phân thân','#9fe8ff',14);LH_Audio.play('magic');
  }
  function syncMerc(){
    for(let i=clones.length-1;i>=0;i--)if(clones[i].until<=time){burst(clones[i].x,clones[i].y-30,'#9fe8ff',10,120);clones.splice(i,1);}
    const want=[...player.mercs.filter(m=>m.on&&m.hpFrac>0).map(m=>({key:m.mid,data:m,pet:false})),...(player.pets||[]).filter(x=>x.hpFrac>0&&MON[x.type]).map(x=>({key:x.pid,data:x,pet:true})),...clones.map(c=>({key:c.key,data:c.data,pet:false,ent:c}))];
    const old=new Map(allies.map(e=>[e.key,e]));allies.length=0;
    want.forEach((w,i)=>{
      let e=old.get(w.key)||w.ent;
      if(!e){const f=FORM[i%6],sp=petSpawn[w.key]||{x:hero.x+f[0]*hero.facing,y:hero.y+f[1]};delete petSpawn[w.key];
        e={key:w.key,pet:w.pet,x:sp.x,y:sp.y,facing:1,moving:false,walk:0,aim:{x:1,y:0},attack:null,atk:null,hurt:-9,dead:0,deadAt:0,blockUntil:0,barrierUntil:0,cd:0,hp:0,swing:0,aggro:-9,stunUntil:0,stuck:0,path:null};
        if(!World.canStand(e.x,e.y)){e.x=hero.x;e.y=hero.y;}
        if(w.pet)burst(e.x,e.y-20,EL.demon.color,18,160);}
      e.data=w.data;e.slot=i;
      if(w.pet){const M=MON[w.data.type];e.type=w.data.type;e.max=M.hpBase||M.hp;e.name=M.name;}else{e.D=Player.derive(w.data);const tm=Player.tierMul(w.data)*Player.mercPow();e.D.tot.hp=Math.round(e.D.tot.hp*tm);e.D.tot.def=Math.round(e.D.tot.def*Player.mercDefMul(w.data));e.D.dmgMul*=tm;e.max=e.D.tot.hp;e.name=w.data.name;e.tier=w.data.tier||'n';const K=Player.mercGuard(w.data,Player.mapLevel(World.id),mobDmg());e.max=Math.max(e.max,K.hpMin);e.red=K.red;e.reg=K.reg;} // v10.24: lính đủ cấp vùng có máu tối thiểu theo sát thương quái vùng, giảm sát thương, hồi máu theo phẩm cấp // v10.14: lính phẩm cấp cao máu, sát thương nhân lên
      if(!e.hp)e.hp=Math.max(1,Math.round(e.max*(w.data.hpFrac||1)));e.hp=Math.min(e.hp,e.max);
      allies.push(e);
    });
  }
  const allyKey=()=>player.mercs.map(m=>m.mid+(m.on&&m.hpFrac>0?'+':'-')).join()+'|'+(player.pets||[]).map(x=>x.pid+(x.hpFrac>0?'+':'-')).join();
  function mercHit(e,a){
    // lính thành trì: hệ sách theo ngày (Player.mercDaily); mỗi đòn thứ 4 ra chiêu diện rộng
    const dl=!e.pet&&Player.mercDaily(e.data),el=dl?dl.el:null,col=el?EL[el].color:'#dfe8f0';e.hits=(e.hits||0)+1;
    const d=ATK[a.type],atk={D:e.D,mul:d.dmg*(el?1.15:1)*(1+(HD.tot.mercDmg||0)/100),el,owner:'merc',knock:d.knock,stun:d.stun||0},ang=Math.atan2(a.aim.y,a.aim.x),ox=e.x,oy=e.y-18; // v10.14: Mệnh lệnh cộng % sát thương lính
    if(el&&e.hits%4===0){nova(e.x,e.y-12,110,{...atk,mul:atk.mul*1.6},null);fx.push({kind:'ring',x:e.x,y:e.y-12,r0:8,r1:110,color:col,age:0,life:.4,lw:4});burst(e.x,e.y-20,col,16,180);floater(e.x,e.y-70,dl.skill,col,12);return;}
    // v10.24: lính Huyền thoại, Thần bị vây (từ 3 quái trong tầm) thì quét một vòng trúng mọi quái quanh mình
    if((e.tier==='l'||e.tier==='m')&&monsters.filter(m=>!m.dead&&Math.hypot(m.x-e.x,m.y-e.y)<130).length>=3){const col2=e.tier==='m'?'#ff9fd0':'#ffcf8a';nova(e.x,e.y-12,130,{...atk,mul:atk.mul*(Number(CFG.linh_quet_vong)||.8)},null);fx.push({kind:'ring',x:e.x,y:e.y-12,r0:8,r1:130,color:col2,age:0,life:.35,lw:4});return;}
    if(d.kind==='melee'){hitArc(ox,oy,ang,d.range,d.arc,atk);fx.push({kind:'arc',x:ox,y:oy,ang,r:d.range*.8,arc:1.5,color:col,age:0,life:.2});}
    else if(d.kind==='thrust')hitLine(ox,oy,ang,d.range,d.width,atk);else spawnProjectile({x:e.x,y:e.y},ang,atk,d);
  }
  // v10.24: sát thương trung vị của quái thường ở bản đồ đang đứng (để tính máu tối thiểu của lính)
  let mobDmgCache={id:'',v:0};
  function mobDmg(){if(mobDmgCache.id===World.id&&mobDmgCache.n===monsters.length)return mobDmgCache.v;const a=[...new Set(monsters.map(m=>m.type))].filter(t=>MON[t]&&!MON[t].boss).map(t=>MON[t].dmg).sort((x,y)=>x-y);mobDmgCache={id:World.id,n:monsters.length,v:a.length?a[Math.floor(a.length/2)]:0};return mobDmgCache.v;}
  function nearestFoe(e,r){let t=null,bd=r;for(const m of monsters){if(m.dead)continue;const dd=Math.hypot(m.x-e.x,m.y-e.y);if(dd<bd&&Math.hypot(m.x-hero.x,m.y-hero.y)<420){bd=dd;t=m;}}return t;}
  function formGoal(e){const f=FORM[e.slot%6],gx=hero.x+f[0]*hero.facing,gy=hero.y+f[1];return Math.hypot(gx-e.x,gy-e.y)>32?{x:gx,y:gy}:null;}
  function updateAllies(dt){
    if(clones.some(c=>c.until<=time))syncMerc(); // phân thân hết hạn
    for(const e of allies){
      e.moving=false;
      if(safe&&e.hp<e.max)e.hp=Math.min(e.max,e.hp+e.max*.15*dt); // về làng hồi máu
      else if(!e.pet&&e.hp>0&&e.hp<e.max)e.hp=Math.min(e.max,e.hp+e.max*((e.reg||0)+(time-(e.hitAt||0)>5?(Number(CFG.linh_hoi_ngoai_tran)||6):0))/100*dt); // v10.24: lính hồi máu ngoài vùng an toàn (theo phẩm cấp; 5 giây không trúng đòn thì hồi nhanh)
      if(Math.hypot(hero.x-e.x,hero.y-e.y)>650){e.x=hero.x-30*hero.facing;e.y=hero.y+10;e.path=null;}
      if(e.pet){updatePet(e,dt);continue;}
      if(e.attack){const a=e.attack,p=(time-a.start)/a.dur;if(!a.hitDone&&p>=a.hit){a.hitDone=true;mercHit(e,a);}if(p>=1)e.attack=null;}
      const st=Player.stance(e.data),d=ATK[st.type],target=!safe&&!hero.dead?nearestFoe(e,280):null;
      let goal=null;const spd=150*(1+e.D.tot.moveSpd/100);
      if(target){
        const c=center(target),dist=Math.hypot(target.x-e.x,target.y-e.y),reach=d.kind==='melee'||d.kind==='thrust'?d.range*.75+MON[target.type].r:260;
        const dx=c.x-e.x,dy=c.y-(e.y-20),l=Math.hypot(dx,dy)||1;e.aim={x:dx/l,y:dy/l};if(Math.abs(dx)>3)e.facing=dx<0?-1:1;
        if(dist>reach)goal={x:target.x,y:target.y};
        else if(!e.attack&&time>e.cd){const dur=d.dur/(1+e.D.tot.atkSpd/100);if(st.dual)e.swing^=1;e.attack={type:st.type,skill:'normal',start:time,dur,hit:d.hit,hitDone:false,aim:{...e.aim},stance:st,hand:st.dual&&e.swing?'left':'right'};e.cd=time+dur+.35;}
      }else goal=formGoal(e);
      if(goal){steer(e,goal,spd,dt,11,false);e.moving=e.stepMoved>.05;e.walk+=e.stepMoved*.09;if(!target&&Math.abs(goal.x-e.x)>3)e.facing=goal.x<e.x?-1:1;}
      e.data.hpFrac=e.hp/e.max;
    }
  }

  /* ---------- Người chơi ảo: đi săn ở các bãi quái. Lấy từ nhân vật người chơi đang rao cho thuê ở Thương nhân (tên, giới tính, đồ),
     chưa có thì dùng bộ người chơi mặc định với đồ đạc khác nhau. Quái do người chơi ảo hạ không cho thưởng (trừ khi mình đã đánh từ 30% máu) ---------- */
  const bots=[];let botPool=[],botPoolAt=-1e9;
  const BOT_DEF=[['Lữ khách Bình','m',['sword-iron','shield-wood','hat','armor-leather','shoes']],['Nữ hiệp Lan Anh','f',['bow-hunt','hat','armor','shoes-leather']],['Tráng sĩ Dũng','m',['spear-iron','armor-iron','pants-guard','gloves-leather']],['Đạo sĩ Huyền','m',['staff-jade','hat-iron','armor','shoes']],
    ['Cung thủ Mai','f',['crossbow-war','armor-leather','pants','shoes-leather']],['Võ sinh Khôi','m',['sword-steel','sword-iron','gloves','shoes-iron']],['Nữ tướng Thảo','f',['sword-steel','shield-iron','armor-iron','hat-iron']],['Hiệp khách Phong','m',['bow','pants-guard','gloves-leather','wings']],
    ['Kiếm khách Long','m',[]],['Nữ kiếm Vân','f',[]],['Thợ săn Tùng','m',[]],['Tiểu thư Ngọc','f',[]],['Thư sinh Minh','m',[]],['Nữ hiệp Hà','f',[]],['Lãng tử Hải','m',[]],['Cô nương Liên','f',[]]]; // v10.22: thêm tên cho người chơi ảo trong thành
  function loadBotPool(){return Promise.resolve();} // v10.13: bỏ cho thuê nhân vật → bot dùng tên mẫu, không hỏi máy chủ
  // v10.22: đồ của người chơi ảo theo cấp bản đồ — bản đồ càng cao đồ càng đẹp (phẩm chất, cấp cường hóa, đồ bậc thành, bộ Huyền thoại / Thần ở vùng cao)
  const shopLvOf=k=>{const mm=String(k).match(/^thanh-(.+?)(?:-ren|-thu|-sach)?$/);return mm?Player.mapLevel(mm[1]):1;};
  function botGear(m,L,rng){
    const pick=a=>a[Math.floor(rng()*a.length)],lvR=mx=>Math.max(0,Math.floor(rng()*(mx+1)));
    if(L>=170&&rng()<(L>=290?.55:L>=235?.4:.25)){
      const want=L>=290&&rng()<.5?'m':'l',sets=Object.values(Player.SETS).filter(S=>S.q===want&&(!S.gender||S.gender===m.gender));
      if(sets.length){const S=pick(sets),lv=want==='m'?6+lvR(6):8+lvR(7);for(const id of S.pieces){const d=Player.items[id];if(!d||d.slot==='mount')continue;const it=Player.roll(id,d.q||want,rng);it.lv=lv;m.equipment[d.slot==='hand'?(/:left$/.test(id)?'left':'right'):d.slot]=it;}return;}
    }
    const q=L<20?(rng()<.6?'n':'g'):L<70?(rng()<.7?'g':'p'):L<170?(rng()<.4?'g':'p'):(rng()<.25?'l':'p'),lv=L<20?0:lvR(Math.min(12,Math.round(L/20)));
    const by={};for(const [k,rows] of Object.entries(Player.SHOPS)){const sl=shopLvOf(k);if(sl>L)continue;for(const r of rows){const d=Player.items[r.id];if(!d||!d.slot||['cos','book','mount','quest'].includes(d.slot)||d.ruby||d.set||(d.gender&&d.gender!==m.gender))continue;
      const slot=d.slot==='hand'?(d.kind==='shield'?'left':'right'):d.slot,v=((d.atk||0)*2+(d.def||0))*(1+(r.t||0)/25);(by[slot]=by[slot]||[]).push({id:r.id,t:r.t||0,v,d});}}
    for(const slot of ['right','hat','armor','pants','gloves','shoes','wings','left']){const a=(by[slot]||[]).sort((x,y)=>y.v-x.v).slice(0,4);if(!a.length)continue;if(slot==='left'&&(m.equipment.right&&Player.isTwo(m.equipment.right)||rng()<.4))continue;if(slot==='wings'&&rng()<.5)continue;
      const c=pick(a),it=Player.roll(c.id,c.d.q||q,rng,c.t);it.lv=lv;m.equipment[slot]=it;}
  }
  function botData(i,L){
    L=L==null?Player.mapLevel(World.id):L;const rng=Math.random;
    const [name,g]=BOT_DEF[(i+World.id.length)%BOT_DEF.length],st=12+L*2+Math.floor(rng()*6);
    const m=Player.makeMerc({name,gender:g,stats:{strength:st,agility:st,vitality:st+4,intelligence:st}});
    try{botGear(m,L,rng);}catch(e){}
    return m;
  }
  function makeBot(i,data,home,x,y,town){const D=Player.derive(data);return {bot:true,town:!!town,key:'bot'+i,data,D,name:data.name,home,x,y,facing:1,moving:false,walk:0,aim:{x:1,y:0},attack:null,hurt:-9,dead:0,deadAt:0,blockUntil:0,barrierUntil:0,cd:0,swing:0,stuck:0,path:null,max:Math.round(D.tot.hp*3),hp:Math.round(D.tot.hp*3)};}
  // ô đứng được trong vùng an toàn quanh điểm vào (làng, thành)
  function safeSpot(cx,cy,R){for(let k=0;k<40;k++){const a=Math.random()*PI2,r=Math.random()*R,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(World.canStand(x,y)&&World.isSafe(x,y))return {x,y};}return null;}
  function spawnBots(){
    if(World.def&&World.def.event){bots.length=0;return;} // v10.46: bản đồ sự kiện thế giới không có người chơi ảo đi lại
    bots.length=0;botRunAt=time+20+Math.random()*30;const n=Math.max(0,Math.min(8,Number(CFG.nguoi_choi_ao??4))),camps=World.camps;
    if(n&&camps.length)for(let i=0;i<n;i++){
      const cp=camps[i%camps.length],data=botData(i),a=Math.random()*PI2,r=Math.random()*cp.r*.8,e=makeBot(i,data,cp,cp.x+Math.cos(a)*r,cp.y+Math.sin(a)*r);
      if(!World.canStand(e.x,e.y)){e.x=cp.x;e.y=cp.y;}bots.push(e);
    }
    // v10.22: người chơi ảo đi lại trong làng / thành (đồ theo cấp thành)
    const nt=Math.max(0,Math.min(10,Number(CFG.nguoi_choi_ao_thanh??5))),sp0=World.spawn,nc=World.npcs.find(n=>n.panel&&World.isSafe(n.x,n.y)),sp=World.isSafe(sp0.x,sp0.y)?sp0:nc?{x:nc.x,y:nc.y}:null; // làng: quanh điểm vào; thành: quanh dân thành có việc
    if(nt&&sp)for(let i=0;i<nt;i++){const p=safeSpot(sp.x,sp.y,14*T);if(!p)continue;const e=makeBot(100+i,botData(i+8),{x:p.x,y:p.y,r:5*T},p.x,p.y,true);bots.push(e);}
  }
  // v10.22: thỉnh thoảng một người chơi ảo bị quái rượt, còn ít máu, chạy về làng / thành (điểm vào bản đồ)
  let botRunAt=0;
  function botRunEvent(){
    const gap=Number(CFG.nguoi_choi_ao_chay_giay??60);if(!(gap>0)||time<botRunAt)return;botRunAt=time+gap*(.5+Math.random());
    const sp0=World.spawn,nc=World.npcs.find(n=>n.panel&&World.isSafe(n.x,n.y)),sp=World.isSafe(sp0.x,sp0.y)||!nc?sp0:{x:nc.x,y:nc.y},cand=bots.filter(e=>!e.dead&&!e.town&&!e.flee&&!e.tut);if(!cand.length)return;const e=cand[Math.floor(Math.random()*cand.length)];
    let mon=null,bd=520;for(const m of monsters){if(m.dead||MON[m.type].boss||m.type==='deer')continue;const d=Math.hypot(m.x-e.x,m.y-e.y);if(d<bd){bd=d;mon=m;}}if(!mon)return;
    e.hp=Math.round(e.max*(.12+Math.random()*.12));e.flee={until:time+45,to:{x:sp.x,y:sp.y}};e.attack=null;mon.chase={ent:e,until:time+14};mon.aggro=time+14;
    floater(e.x,e.y-80,'Cứu với!','#ffb0a0',15);if(Math.hypot(e.x-hero.x,e.y-hero.y)<700)message(svg('user')+`${esc(e.name)} bị ${esc(MON[mon.type].name)} rượt, ít máu, đang chạy về ${World.isSafe(sp.x,sp.y)?(Player.REGIONS.find(r=>r.id===World.id)?'thành':'làng'):'cổng'}!`,3.5);
  }
  function botHit(e,a){
    const d=ATK[a.type],atk={D:e.D,mul:d.dmg*.6,el:null,owner:'bot',knock:d.knock},ang=Math.atan2(a.aim.y,a.aim.x),ox=e.x,oy=e.y-18;
    if(d.kind==='melee'){hitArc(ox,oy,ang,d.range,d.arc,atk);fx.push({kind:'arc',x:ox,y:oy,ang,r:d.range*.8,arc:1.5,color:'#f0e2c8',age:0,life:.2});}
    else if(d.kind==='thrust')hitLine(ox,oy,ang,d.range,d.width,atk);else spawnProjectile({x:e.x,y:e.y},ang,atk,d);
  }
  function updateBots(dt){
    for(const e of bots){
      if(e.tut)continue;e.moving=false;
      if(e.dead){if(time>e.respawnAt){Object.assign(e,{dead:0,hp:e.max,x:e.home.x,y:e.home.y,attack:null,path:null,flee:null,gone:0});}continue;}
      if(e.flee){const f=e.flee,dd=Math.hypot(f.to.x-e.x,f.to.y-e.y);if(dd<34||time>f.until){e.dead=1;e.gone=1;e.flee=null;e.respawnAt=time+40;burst(e.x,e.y-20,'#ffe6a8',12,120);continue;}
        steer(e,f.to,145*(1+e.D.tot.moveSpd/100),dt,11,false);e.moving=e.stepMoved>.05;e.walk+=e.stepMoved*.09;if(Math.abs(f.to.x-e.x)>3)e.facing=f.to.x<e.x?-1:1;if(time>(e.cryAt||0)){e.cryAt=time+3+Math.random()*2;floater(e.x,e.y-82,['Cứu với!','Chạy mau!','Về làng thôi!'][Math.floor(Math.random()*3)],'#ffb0a0',12);}continue;}
      if(e.town){if(!e.wander||time>e.wander.t){const go=Math.random()<.55,p=go?safeSpot(e.home.x,e.home.y,e.home.r):null;e.wander={t:time+3+Math.random()*6,x:p?p.x:null,y:p?p.y:null};}
        if(e.wander.x!=null&&Math.hypot(e.wander.x-e.x,e.wander.y-e.y)>8){steer(e,{x:e.wander.x,y:e.wander.y},70,dt,11,false);e.moving=e.stepMoved>.05;e.walk+=e.stepMoved*.09;if(Math.abs(e.wander.x-e.x)>3)e.facing=e.wander.x<e.x?-1:1;}else if(e.wander.x!=null)e.wander.x=null;continue;}
      if(e.attack){const a=e.attack,p=(time-a.start)/a.dur;if(!a.hitDone&&p>=a.hit){a.hitDone=true;botHit(e,a);}if(p>=1)e.attack=null;}
      const st=Player.stance(e.data),d=ATK[st.type];
      let target=null,bd=300;for(const m of monsters){if(m.dead||MON[m.type].boss)continue;const dd=Math.hypot(m.x-e.x,m.y-e.y);if(dd<bd&&Math.hypot(m.x-e.home.x,m.y-e.home.y)<e.home.r+260){bd=dd;target=m;}}
      let goal=null;const spd=140*(1+e.D.tot.moveSpd/100);
      if(target){
        const c=center(target),dist=Math.hypot(target.x-e.x,target.y-e.y),reach=d.kind==='melee'||d.kind==='thrust'?d.range*.75+MON[target.type].r:240;
        const dx=c.x-e.x,dy=c.y-(e.y-20),l=Math.hypot(dx,dy)||1;e.aim={x:dx/l,y:dy/l};if(Math.abs(dx)>3)e.facing=dx<0?-1:1;
        if(dist>reach)goal={x:target.x,y:target.y};
        else if(!e.attack&&time>e.cd){const dur=d.dur/(1+e.D.tot.atkSpd/100);if(st.dual)e.swing^=1;e.attack={type:st.type,skill:'normal',start:time,dur,hit:d.hit,hitDone:false,aim:{...e.aim},stance:st,hand:st.dual&&e.swing?'left':'right'};e.cd=time+dur+.5;}
      }else{
        e.hp=Math.min(e.max,e.hp+e.max*.04*dt);
        if(!e.wander||time>e.wander.t){const go=Math.random()<.7,a=Math.random()*PI2,rr=Math.random()*e.home.r;e.wander={t:time+2+Math.random()*4,x:go?e.home.x+Math.cos(a)*rr:null,y:go?e.home.y+Math.sin(a)*rr:null};}
        if(e.wander.x!=null){if(Math.hypot(e.wander.x-e.x,e.wander.y-e.y)>8)goal={x:e.wander.x,y:e.wander.y};else e.wander.x=null;}
      }
      if(goal){steer(e,goal,target?spd:spd*.6,dt,11,false);e.moving=e.stepMoved>.05;e.walk+=e.stepMoved*.09;if(!target&&Math.abs(goal.x-e.x)>3)e.facing=goal.x<e.x?-1:1;}
    }
  }
  function hurtBot(e,dmg){
    if(e.dead)return;const S=e.D.tot;if(Math.random()*100<S.dodge){floater(e.x,e.y-60,'Né','#cfe8ff',12);return;}
    const d=Math.max(1,Math.round(dmg*Player.armorMul(S.def,Player.mapLevel(World.id))*(1-S.dmgRed/100)));e.hp-=d;e.hurt=time;
    if(e.hp<=0){e.hp=0;e.dead=1;e.respawnAt=time+20;e.attack=null;burst(e.x,e.y-20,'#cfcfcf',16,140);}
  }
  // Quái thu phục: đi theo, cắn/húc quái khác. Chết là mất hẳn
  function updatePet(e,dt){
    const M=MON[e.type];
    if(e.atk){if(time>=e.atk.at&&!e.atk.done){e.atk.done=true;const t=e.atk.tg;if(t&&!t.dead&&Math.hypot(t.x-e.x,t.y-e.y)<M.range+MON[t.type].r+40){const l=Math.hypot(t.x-e.x,t.y-e.y)||1;hitMonster(t,{abs:Math.max(6,M.dmgBase||M.dmg)*Player.petDmgMul()*(M.boss?Number(Player.CFG.ma_boss_sat_thuong)||.3:1)*(1+player.level*.05)*(1+(HD.tot.petDmg||0)/100),owner:'pet',color:EL.demon.glow,knock:40},(t.x-e.x)/l,(t.y-e.y)/l);}}if(e.atk&&time>=e.atk.end)e.atk=null;e.data.hpFrac=e.hp/e.max;return;}
    const target=!safe&&!hero.dead?nearestFoe(e,300):null;let goal=null;
    if(target){const dx=target.x-e.x,dist=Math.hypot(dx,target.y-e.y),reach=M.range*.8+MON[target.type].r+M.r*.5;if(Math.abs(dx)>3)e.facing=dx<0?-1:1;
      if(dist>reach)goal={x:target.x,y:target.y};else if(time>e.cd){const w=Math.max(.25,M.windup);e.atk={at:time+w,end:time+w+.35,done:false,tg:target};e.cd=time+w+Math.max(.8,M.cd);}}
    else goal=formGoal(e);
    if(goal){steer(e,goal,Math.min(Math.max(M.speed,M.run*.8),220),dt,Math.min(M.r,16),false);e.moving=e.stepMoved>.05;e.walk+=e.stepMoved*.12;if(!target&&Math.abs(goal.x-e.x)>3)e.facing=goal.x<e.x?-1:1;}
    e.data.hpFrac=e.hp/e.max;
  }
  function hurtAlly(e,dmg){
    if(e&&e.bot)return hurtBot(e,dmg);
    if(!e||e.hp<=0)return;let d;
    if(e.pet)d=Math.max(1,Math.round(dmg*.8));
    else{const S=e.D.tot;if(Math.random()*100<S.dodge){floater(e.x,e.y-60,'Né','#cfe8ff',13);return;}d=dmg*Player.armorMul(S.def,Player.mapLevel(World.id))*(1-S.dmgRed/100)*(1-(e.red||0)/100);if(Math.random()*100<S.block)d*=.2;e.hitAt=time;d=Math.max(1,Math.round(d));}
    e.hp-=d;e.hurt=time;floater(e.x,e.y-(e.pet?MON[e.type].h+12:62),'-'+d,'#ffb0a0',13);
    if(e.hp<=0){
      e.hp=0;e.data.hpFrac=0;const i=allies.indexOf(e);if(i>=0)allies.splice(i,1);burst(e.x,e.y-20,'#cfcfcf',18,150);
      if(e.pet){message(svg('close')+e.name+' đã chết · không hồi sinh');op({t:'petOff',pid:e.key}).catch(()=>{});}
      else{message(svg('user')+e.name+' gục · về làng chờ');keepLocal();}
    }
  }
  // Về làng: lính gục đứng chờ ở làng nhập đội lại
  function reviveAtVillage(){
    const back=player.mercs.filter(m=>m.hpFrac===0);if(!back.length)return;
    back.forEach(m=>m.hpFrac=1);syncMerc();message(svg('user')+back.map(m=>m.name).join(', ')+' nhập đội lại');keepLocal();
  }
  /* ---------- Quái vật và trùm ---------- */
  function pickTarget(m){
    if(m.taunt>time&&!hero.dead&&!World.isSafe(hero.x,hero.y))return {x:hero.x,y:hero.y,isHero:true,ok:true,d:Math.hypot(hero.x-m.x,hero.y-m.y)};
    if(m.chase){const e=m.chase.ent;if(time<m.chase.until&&!e.dead&&!World.isSafe(e.x,e.y))return {x:e.x,y:e.y,isHero:false,ent:e,ok:true,d:Math.hypot(e.x-m.x,e.y-m.y)};m.chase=null;}
    let best=null,bd=1e9;
    const cand=[{x:hero.x,y:hero.y,isHero:true,ok:!hero.dead}];for(const e of allies)cand.push({x:e.x,y:e.y,isHero:false,ent:e,ok:e.hp>0});for(const e of bots)cand.push({x:e.x,y:e.y,isHero:false,ent:e,ok:!e.dead});
    for(const c of cand){if(!c.ok||World.isSafe(c.x,c.y))continue;const d=Math.hypot(c.x-m.x,c.y-m.y);if(d<bd){bd=d;best=c;}}
    return best?{...best,d:bd}:null;
  }
  function monsterStrike(m){
    const M=MON[m.type],reach=M.range+18+(M.boss?24:0);
    const hits=[];if(!hero.dead&&Math.hypot(hero.x-m.x,hero.y-m.y)<reach)hits.push('hero');for(const e of allies)if(e.hp>0&&Math.hypot(e.x-m.x,e.y-m.y)<reach+(e.pet?MON[e.type].r:0))hits.push(e);for(const e of bots)if(!e.dead&&Math.hypot(e.x-m.x,e.y-m.y)<reach)hits.push(e);
    const pref=m.tgt&&hits.includes(m.tgt)?m.tgt:hits.includes('hero')?'hero':hits[0],list=M.boss?hits:pref?[pref]:[];
    for(const h of list){if(h==='hero')hurtHero(M.dmg,m);else hurtAlly(h,M.dmg);}
    if(m.type==='elephant'||M.boss){const hd=Math.hypot(hero.x-m.x,hero.y-m.y);if(hd<480)shake((M.boss?8:6)*(1-hd/600)); // chỉ rung khi người chơi ở gần (quái đánh người chơi ảo, lính ở xa thì không rung)
fx.push({kind:'ring',x:m.x+m.facing*(M.boss?20:40),y:m.y,r0:10,r1:M.boss?reach:70,color:LH_ART.ring[m.type]||(m.type==='ngu-tinh'?'#7fd0ff':'#d9cdb0'),age:0,life:.45,lw:5});}
    if(m.type==='ngu-tinh')for(let i=0;i<14;i++){const a=i/14*PI2;particles.push({x:m.x+Math.cos(a)*30,y:m.y-10,vx:Math.cos(a)*160,vy:Math.sin(a)*60-80,age:0,life:.6,color:'#9fdcff',size:4,grav:300});}
  }
  // Đi tới đích; vướng bụi cây, nhà, nước thì tìm đường vòng theo lưới ô thay vì đẩy mãi vào vật cản
  function steer(e,goal,spd,dt,r,mon){
    e.stepMoved=0;let to=goal;
    if(e.path){const wp=e.path[0];if(!wp||time>e.pathUntil||Math.hypot(goal.x-e.pathGoal.x,goal.y-e.pathGoal.y)>96)e.path=null;else{if(Math.hypot(wp.x-e.x,wp.y-e.y)<10){e.path.shift();if(!e.path.length)e.path=null;}if(e.path)to=e.path[0];}}
    const dx=to.x-e.x,dy=to.y-e.y,l=Math.hypot(dx,dy);if(l<2)return true;
    const step=Math.min(l,spd*dt);
    if(mon&&World.isSafe(e.x+dx/l*step,e.y+dy/l*step)&&!World.isSafe(e.x,e.y)){e.path=null;return false;}
    const ox=e.x,oy=e.y;World.move(e,dx/l*step,dy/l*step,r);
    const mv=Math.hypot(e.x-ox,e.y-oy);e.stepMoved=mv;e.dirX=dx;
    if(mv<step*.35){
      e.stuck=(e.stuck||0)+dt;
      if(e.stuck>.25&&time>(e.pathAt||0)){
        e.pathAt=time+.8;e.stuck=0;const p=World.findPath(e,goal);
        if(p&&p.length>1){e.path=p.slice(1);e.pathGoal={x:goal.x,y:goal.y};e.pathUntil=time+5;}
        else{const a=Math.atan2(dy,dx)+(Math.random()<.5?1:-1)*Math.PI/2;World.move(e,Math.cos(a)*10,Math.sin(a)*10,r);e.path=null;}
      }
    }else e.stuck=0;
    return true;
  }
  // Chạy trốn: chọn hướng thoáng gần với hướng ngược kẻ đuổi nhất (không lao đầu vào bụi cây, bờ nước)
  // v10.22: chiến thuật trùm (cột ky_nang): tron · bay · hoi-mau (giap-bang, phan-giap xử lý trong hitMonster). Trả true = trùm đã tự di chuyển lượt này
  const tacSeen=new Set();
  function tacHint(m,M){if(tacSeen.has(m.type))return;tacSeen.add(m.type);const t=M.tac.map(k=>Player.SKILLS[k]).filter(Boolean);message(svg('eye')+`<b>${esc(M.name)}</b> · ${t.map(x=>x.name+': '+x.desc).join(' · ')}<br><small>${t.map(x=>x.hint).join(' · ')}</small>`,7);}
  function bossTactics(m,M,dt){
    const T=M.tac,c=center(m);if(m.aggro>time)tacHint(m,M);
    // v10.52: chỉ tái sinh khi không trúng đòn trong 2,5 giây (đánh liên tục thì luôn hạ được, dù sát thương thấp)
    if(T.includes('hoi-mau')&&m.hp<m.max&&!(m.burn&&m.burn.until>time)&&time-(m.hurt||-9)>2.5){m.hp=Math.min(m.max,m.hp+m.max*.01*dt);if(time>(m.regAt||0)&&m.aggro>time){m.regAt=time+1.5;floater(c.x,c.y-M.h*.5-20,'Tái sinh','#90e070',12);}}
    if(T.includes('bay')&&m.aggro>time){if(!m.flyNext)m.flyNext=time+6;if(time>=m.flyNext){m.flyUntil=time+4;m.flyNext=time+12;floater(c.x,c.y-M.h-20,'Bay lên cao!','#c0d8ff',16);}}
    m.fly=m.flyUntil>time?60*Math.min(1,(m.flyUntil-time)/.4,(time-(m.flyUntil-4))/.4):0;
    if(T.includes('tron')){
      if(!m.fleeing&&!m.fledOnce&&m.hp<m.max*.2&&time>(m.fleeCd||0)){if(m.scorch>time){if(time>(m.pinAt||0)){m.pinAt=time+3;floater(c.x,c.y-M.h-20,'Lửa giữ chân!','#ffb070',15);}}else{m.fleeing={until:time+7};m.fledOnce=true;bossLine(m,'chay',3.4);m.atk=null;m.leap=null;m.cast=null;floater(c.x,c.y-M.h-20,'Bỏ chạy!','#ff80c0',18);message(svg('eye')+`${esc(M.name)} bỏ chạy! Đốt cháy bằng sách Hỏa hoặc bắn theo, không thì nó hồi một nửa máu · lần sau nó sẽ không chạy nữa`,4);}}
      if(m.fleeing){
        if(m.scorch>time){m.fleeing=null;m.fleeCd=time+6;m.stunUntil=time+2;floater(c.x,c.y-M.h-20,'Bị lửa thiêu, ngã quỵ!','#ffb070',16);burst(c.x,c.y,'#ff8a3d',24,180);return true;}
        if(time>m.fleeing.until||Math.hypot(m.x-hero.x,m.y-hero.y)>760){m.fleeing=null;m.fleeCd=time+10;if(m.tk){m.tk.on=false;m.tk.quay=true;}m.hp=Math.max(m.hp,Math.round(m.max*.5));m.x=m.hx;m.y=m.hy;m.aggro=0;m.burn=null;burst(m.x,m.y-30,'#ff80c0',30,200);message(svg('close')+`${esc(M.name)} đã trốn về hang và hồi một nửa máu · lần này nó sẽ đánh tới cùng`,4);return true;}
        moveMon(m,fleeGoal(m,hero.x,hero.y),M.run*1.6,dt,M);return true;
      }
    }
    return false;
  }
  function fleeGoal(m,fx,fy){
    const base=Math.atan2(m.y-fy,m.x-fx);if(m.fleeGoal&&time<m.fleeGoalUntil)return m.fleeGoal;
    for(const o of [0,.45,-.45,.9,-.9,1.4,-1.4,1.9,-1.9,2.5,-2.5,Math.PI]){const a=base+o;let ok=true;for(const d of [50,100,160,220]){const px=m.x+Math.cos(a)*d,py=m.y+Math.sin(a)*d;if(!World.canStand(px,py,14)||World.isSafe(px,py)){ok=false;break;}}if(ok){m.fleeGoal={x:m.x+Math.cos(a)*220,y:m.y+Math.sin(a)*220};m.fleeGoalUntil=time+.9;return m.fleeGoal;}}
    return {x:m.hx,y:m.hy};
  }
  function moveMon(m,goal,spd,dt,M){
    const ok=steer(m,goal,spd,dt,Math.min(M.r,16),true);if(!ok){m.wander=null;m.moving=false;return;}
    m.moving=m.stepMoved>.05;m.walk+=m.stepMoved*.12;if(Math.abs(m.dirX||0)>2)m.facing=m.dirX<0?-1:1;
  }
  /* ---------- v10.13: sự kiện đột xuất ở làng / thành (Player.EVENTS) ----------
     Mỗi su_kien_phut phút (theo mốc đồng hồ, mọi người chơi cùng thấy) quái sự kiện hiện ngoài vùng an toàn gần chỗ xuất hiện của bản đồ.
     Kẻ trộm: đánh tới dưới 40% máu thì bỏ chạy, chạy khuất là thắng. Quân địch: hạ hết trong thời hạn là thắng, hết giờ chúng rút.
     Thắng → op eventWin (cỏ may mắn, tiền, hồng ngọc; máy chủ chống nhận trùng theo khoảng thời gian). */
  let EV=null,evSlot=-1,evBanner=null;
  const evPeriod=()=>Math.max(60,(Number(CFG.su_kien_phut)||5)*60);
  function evFor(map){for(const [id,E] of Object.entries(Player.EVENTS||{}))if(E.map===map)return {id,E};return null;}
  // chỗ đặt quái sự kiện: vòng quanh điểm xuất hiện, ô trống và ngoài vùng an toàn
  function evSpots(n){const out=[],cx=Math.floor(World.spawn.x/T),cy=Math.floor(World.spawn.y/T);
    for(let r=2;r<14&&out.length<n;r++)for(let a=0;a<16&&out.length<n;a++){const ang=a/16*PI2+r,x=Math.round(cx+Math.cos(ang)*r),y=Math.round(cy+Math.sin(ang)*r*.8),px=(x+.5)*T,py=(y+.5)*T;if(World.canStand(px,py)&&!World.isSafe(px,py)&&!out.some(o=>Math.hypot(o.x-px,o.y-py)<40))out.push({x:px,y:py});}
    return out;}
  function evBannerSet(html){if(!evBanner){evBanner=document.createElement('div');evBanner.className='ev-banner';document.getElementById('lu-hanh').appendChild(evBanner);}if(html==null){evBanner.remove();evBanner=null;return;}evBanner.innerHTML=html;}
  function evStart(id,E,left){
    const n=E.mobs.reduce((a,[,k])=>a+k,0),spots=evSpots(n);if(!spots.length)return;let i=0;const list=[];
    for(const [type,k] of E.mobs)for(let j=0;j<k&&i<spots.length;j++,i++){const M=MON[type];if(!M)continue;const sp=spots[i],m={id:9000+monsters.length,type,ev:id,hx:sp.x,hy:sp.y,x:sp.x,y:sp.y,hp:M.hp,max:M.hp,dead:false,deadAt:0,respawn:1e18,facing:-1,walk:0,moving:false,hurt:-9,aggro:time+8,atk:null,cd:0,flee:0,wander:null,stunUntil:0,burn:null,burnAcc:0,leapCd:0,leap:null};monsters.push(m);list.push(m);burst(m.x,m.y-20,'#ff7aa0',14,150);}
    EV={id,E,mobs:list,until:time+left,won:false};LH_Audio.play('boss');message(svg('flag')+`<b>${E.name}</b> · ${E.hint}`);shake(5);
  }
  function evEnd(won){
    if(!EV)return;const E=EV.E;
    for(const m of EV.mobs){const i=monsters.indexOf(m);if(i>=0){burst(m.x,m.y-20,won?'#ffd98a':'#c9cfc4',10,120);monsters.splice(i,1);}}
    if(won){op({t:'eventWin',ev:EV.id}).then(r=>{const x=hero.x,y=hero.y-80-seatH();let dy=0;floater(x,y,'+'+r.luck+' cỏ may mắn','#9fe8a8',16);dy+=18;dy+=moneyFloat(x,y-dy,r.copper);if(r.rubies)floater(x,y-dy,'+'+r.rubies,'#ff9ab8',14,'ruby');LH_Audio.play('levelup');message(svg('check')+`${E.name}: thắng! +${r.luck} cỏ may mắn (đang có ${r.total}) · dùng khi gia cường / dung hợp`);window.GameUI?.refresh();},e=>{message(svg('close')+(e.message==='EVENT_CU'?'Sự kiện này vừa được thưởng, lần sau nhé':'Chưa nhận được thưởng sự kiện'));});}
    else message(svg('flag')+`${E.name}: đã rút lui`);
    EV=null;evBannerSet(null);
  }
  function evTick(){
    const P=evPeriod(),now=Date.now()/1000,slot=Math.floor(now/P),into=now-slot*P,F=evFor(World.id);
    if(!EV&&F&&slot!==evSlot){evSlot=slot;if(into<F.E.dur-20&&!hero.dead)evStart(F.id,F.E,F.E.dur-into);}
    if(!EV)return;
    const E=EV.E,left=Math.max(0,EV.until-time);
    if(E.flee){const m=EV.mobs[0];if(m&&!m.dead){if(m.hp<m.max*E.flee){if(!m.evFlee){m.evFlee=true;m.fleeAt=time;m.fearUntil=time+999;m.atk=null;floater(m.x,m.y-MON[m.type].h-14,'Bỏ chạy!','#ffd98a',14);}if(Math.hypot(m.x-hero.x,m.y-hero.y)>460||time-m.fleeAt>14){evEnd(true);return;}}}}
    if(EV.mobs.every(m=>m.dead)){evEnd(true);return;}
    if(left<=0){evEnd(false);return;}
    const mm=Math.floor(left/60),ss=String(Math.floor(left%60)).padStart(2,'0'),alive=EV.mobs.filter(m=>!m.dead).length;
    evBannerSet(`${svg('flag')}<b>${E.name}</b><span>${E.flee?'':alive+' tên · '}${mm}:${ss}</span>`);
  }
  function updateMonsters(dt){
    bossTalk();updateEshots(dt);
    for(let i=monsters.length-1;i>=0;i--){const o=monsters[i];if(o.add&&o.dead&&time-o.deadAt>2)monsters.splice(i,1);} // v10.65: dọn quái gọi thêm đã gục
    for(const m of monsters){
      const M=MON[m.type];
      if(m.cast&&time>=m.cast.at){resolveCast(m);m.cast=null;}
      if(m.tubao&&!m.dead){if(time>=m.tubao.at){const R=260;fx.push({kind:'ring',x:m.x,y:m.y,r0:20,r1:R,color:'#ff3020',age:0,life:.6,lw:8});burst(m.x,m.y-M.h*.4,'#ff8040',60,420);shake(14);
          if(!hero.dead&&Math.hypot(hero.x-m.x,hero.y-m.y)<R)hurtHero(M.dmg*4,m);for(const e of allies)if(e.hp>0&&Math.hypot(e.x-m.x,e.y-m.y)<R)hurtAlly(e,M.dmg*4);for(const e of bots)if(!e.dead&&Math.hypot(e.x-m.x,e.y-m.y)<R)hurtBot(e,M.dmg*4);
          m.tubao=null;m.hp=0;kill(m,'hero');continue;}
        m.moving=false;if(Math.random()<.5)burst(m.x+(Math.random()-.5)*60,m.y-Math.random()*M.h,'#ff6030',3,120);continue;}
      if(m.dead){if(time>m.respawn){Object.assign(m,{dead:false,fledOnce:false,fleeing:null,hp:m.max,heroDmg:0,cast:null,tubao:null,skillCd:0,x:m.hx,y:m.hy,atk:null,aggro:-9,flee:0,burn:null,leap:null,stunUntil:0,frozenUntil:0,slowUntil:0,fearUntil:0,path:null,stuck:0,rev:0,bloom:null,bloomGone:false,reviveUntil:0});}continue;}
      if(m.burn){if(time<m.burn.until){m.burnAcc+=m.burn.dps*dt;if(m.burnAcc>=1){const v=Math.floor(m.burnAcc);m.burnAcc-=v;hitMonster(m,{abs:v,owner:'burn',color:m.burn.color||'#ff9a3d'},0,0);if(m.dead)continue;}}else m.burn=null;}
      if(m.flower){flowerAI(m,M,dt);continue;}
      if(BLOOM[m.type])bloomCheck(m);
      if(M.tac&&M.tac.length&&bossTactics(m,M,dt))continue;
      if(time<m.stunUntil||time<m.frozenUntil){m.moving=false;continue;}
      if(m.fighter){updateFighter(m,dt);continue;}
      const slowK=time<m.slowUntil?m.slowK:1;
      if(time<m.fearUntil){moveMon(m,fleeGoal(m,hero.x,hero.y),M.run*slowK,dt,M);continue;}
      const tg=pickTarget(m),dx=tg?tg.x-m.x:0,dy=tg?tg.y-m.y:0,dist=tg?tg.d:1e9,homeD=Math.hypot(m.hx-m.x,m.hy-m.y);
      let tx=0,ty=0,spd=0;
      if(m.leap){const p=(time-m.leap.start)/m.leap.dur;if(p>=1){m.x=m.leap.tx;m.y=m.leap.ty;m.leap=null;monsterStrike(m);}else{World.move(m,(m.leap.tx-m.x)*Math.min(1,dt*8),(m.leap.ty-m.y)*Math.min(1,dt*8),16);}continue;}
      if(m.atk){
        if(time>=m.atk.at&&!m.atk.done){m.atk.done=true;monsterStrike(m);}
        // đòn đánh có thể làm quái gục ngay (phản đòn, gai): lúc đó m.atk đã bị xóa
        if(m.dead)continue;if(m.atk&&time>=m.atk.end)m.atk=null;
      }else{
        const angry=m.aggro>time,canSee=!!tg;let hostile=false;
        if(m.type==='elephant')hostile=canSee&&angry;
        else if(m.type==='croc')hostile=canSee&&(dist<M.aggro||angry)&&homeD<230;
        // sư tử, trùm và quái các vùng mới: thấy người là đánh, đuổi không quá xa ổ
        else if(m.type!=='deer')hostile=canSee&&(m.chase?true:(dist<M.aggro||angry)&&(M.boss?homeD<420:m.type==='lion'||homeD<380));
        if(m.taunt>time&&canSee&&m.type!=='deer')hostile=true;
        if(hostile)m.tgt=tg.isHero?'hero':tg.ent;
        if(m.type==='deer'){if(m.flee>time||(dist<110&&canSee)){const g=fleeGoal(m,tg?tg.x:m.x-1,tg?tg.y:m.y);tx=g.x-m.x;ty=g.y-m.y;spd=m.flee>time?M.run:M.speed*1.6;}}
        else if(hostile){
          if(M.skills&&M.skills.length&&!m.cast&&time>(m.skillCd||0)&&dist<M.aggro){
            if(M.skills.includes('tubao')&&!m.tubao&&m.hp<m.max*.15){m.tubao={at:time+2.2};floater(m.x,m.y-M.h-24,'Tự bạo!','#ff2020',20);fx.push({kind:'ring',x:m.x,y:m.y,r0:20,r1:260,color:'#ff3020',age:0,life:2.2,lw:3});continue;}
            const list=M.skills.filter(k=>k!=='tubao'&&!(Player.SKILLS[k]||{}).passive);
            if(list.length){const kind=list[(m.skillIdx=((m.skillIdx||0)+1)%list.length)],S=Player.SKILLS[kind];m.cast={kind,at:time+1.1,x:tg.x,y:tg.y};LH_Audio.play(kind==='freeze'?'freeze':'bolt');m.skillCd=time+(Number(CFG.trum_ky_nang_giay)||7);
              floater(m.x,m.y-M.h-24,S.name,S.color,17);fx.push({kind:'ring',x:tg.x,y:tg.y,r0:130,r1:30,color:S.color,age:0,life:1.1,lw:3});}
          }
          if(M.boss===1&&dist>M.range*1.4&&dist<320&&time>m.leapCd){m.leapCd=time+6;m.facing=dx<0?-1:1;m.leap={start:time,dur:.55,tx:tg.x-dx/dist*40,ty:tg.y-dy/dist*20};fx.push({kind:'ring',x:m.leap.tx,y:m.leap.ty,r0:10,r1:60,color:'#ff7a5a',age:0,life:.55,lw:3});continue;}
          if(dist<M.range&&time>m.cd){m.atk={at:time+M.windup,end:time+M.windup+.35,done:false};m.cd=time+M.windup+M.cd;m.facing=dx<0?-1:1;}else if(dist>=M.range*.75){tx=dx;ty=dy;spd=M.run;}
        }
        else if(homeD>(m.type==='croc'?20:60)){tx=m.hx-m.x;ty=m.hy-m.y;spd=m.type==='croc'?M.run*.6:M.speed;}
        if(!spd&&!m.atk&&!hostile){
          if(!m.wander||time>m.wander.t){const go=Math.random()<.6,a=Math.random()*PI2,rr=Math.random()*(m.type==='croc'?40:M.boss?80:110);m.wander={t:time+2+Math.random()*3,x:go?m.hx+Math.cos(a)*rr:null,y:go?m.hy+Math.sin(a)*rr:null};}
          if(m.wander.x!=null){tx=m.wander.x-m.x;ty=m.wander.y-m.y;if(Math.hypot(tx,ty)>6)spd=M.speed;else m.wander.x=null;}
        }
      }
      m.moving=false;
      if(spd>0){moveMon(m,{x:m.x+tx,y:m.y+ty},spd*slowK,dt,M);if(m.wander&&m.wander.x!=null&&m.stuck>.2&&!m.path)m.wander.x=null;}
    }
  }
  function updateProjectiles(dt){
    for(let i=projectiles.length-1;i>=0;i--){
      const pr=projectiles[i];
      if(pr.home&&!pr.home.dead&&!pr.hit.has(pr.home)){const c=center(pr.home),a1=Math.atan2(c.y-pr.y,c.x-pr.x),a0=Math.atan2(pr.vy,pr.vx);let da=((a1-a0)%PI2+PI2*1.5)%PI2-Math.PI;const k=Math.max(-14*dt,Math.min(14*dt,da)),an=a0+k;pr.vx=Math.cos(an)*pr.sp;pr.vy=Math.sin(an)*pr.sp;pr.life=Math.max(pr.life,pr.age+.3);}
      pr.age+=dt;pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;
      if(pr.kind==='orb'&&Math.random()<.7)particles.push({x:pr.x,y:pr.y,vx:(Math.random()-.5)*20,vy:(Math.random()-.5)*20,age:0,life:.3,color:pr.el?EL[pr.el].color:'#a6baff',size:3,grav:0});
      let gone=pr.age>pr.life;const gx=Math.floor(pr.x/T),gy=Math.floor((pr.y+pr.gy)/T);if(gx<0||gy<0||gx>=W||gy>=H||(grid[gy][gx]===1&&!pr.home))gone=true;
      for(const m of monsters){if(gone||m.dead||pr.hit.has(m))continue;const c=center(m);if(Math.hypot(c.x-pr.x,c.y-pr.y)<MON[m.type].r+8+(pr.gy>20?14:0)){pr.hit.add(m);hitMonster(m,pr.atk,pr.vx/pr.sp,pr.vy/pr.sp);if(pr.splash)nova(pr.x,pr.y,pr.splash,{...pr.atk,mul:pr.atk.mul*.5},m);if(pr.pierce>0)pr.pierce--;else gone=true;}}
      if(!gone&&pk&&!pk.e.dead&&!pr.hit.has(pk.e)&&pkOwner(pr.atk)&&Math.hypot(pk.e.x-pr.x,pk.e.y-24-pr.y)<24+(pr.gy>20?14:0)){pr.hit.add(pk.e);pkDamage(pr.atk,pr.vx/pr.sp,pr.vy/pr.sp);if(pr.pierce>0)pr.pierce--;else gone=true;}
      if(gone){if(pr.missed&&!pr.hit.size&&!pr.missed.dead){const M=MON[pr.missed.type];floater(pr.missed.x,pr.missed.y-M.h-14,'Trượt','#c9cfc4',12);}burst(pr.x,pr.y,pr.el?EL[pr.el].color:pr.kind==='orb'?'#a6baff':'#e9dcb4',pr.kind==='orb'?12:5,90);projectiles.splice(i,1);}
    }
  }
  function updateEffects(dt){
    for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.age+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.grav*dt;if(q.age>q.life)particles.splice(i,1);}
    for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.age+=dt;f.y-=38*dt;if(f.age>f.life)floaters.splice(i,1);}
    for(let i=fx.length-1;i>=0;i--){fx[i].age+=dt;if(fx[i].age>fx[i].life)fx.splice(i,1);}
    shakeAmp=Math.max(0,shakeAmp-dt*25);
  }
  /* ---------- v10.27: Hướng dẫn tân thủ — lần đầu vào Thanh Mộc: 4 người chơi ảo bắt chuyện, Béo Ca dắt ra bìa rừng, sư tử vồ, cả bọn chạy tán loạn ---------- */
  let tut=null,tutPending=true;
  const TUT_CREW=[['Béo Ca','m'],['Gầy Đệ','m'],['Tí Còi','m'],['Na Lém','f']];
  function tutOn(){const v=CFG.huong_dan_tan_thu;return World.id==='thanh-moc'&&!(v===0||v==='0')&&!seen.has('tut')&&seen.size===0&&(player.level||1)<=1&&!(player.exp>0);}
  function tutBot(i,name,g,x,y){const d=Player.makeMerc({name,gender:g,stats:{strength:14,agility:14,vitality:18,intelligence:14}});try{botGear(d,6,Math.random);}catch(e){}d.name=name;const e=makeBot(300+i,d,{x,y,r:2*T},x,y,false);e.tut=true;e.name=name;return e;}
  function tutSay(e,text,sec){e.say={text,until:time+(sec||3.2)};}
  function tutTalk(e,lines,btn,onEnd){keys.clear();joystick={x:0,y:0};holdAttack=false;route=[];targetNPC=null;hero.attack=null;e.facing=hero.x<e.x?-1:1;dialogNPC={id:'tut-'+e.key,name:e.name,lines,btn,tut:true,onEnd};page=0;dialogEl.hidden=false;showLine();}
  // đi theo đường lưới tới đích; trả true khi tới nơi
  function tutWalk(e,goal,spd,dt){
    if(!e.tp||time>e.tpAt||Math.hypot(goal.x-e.tpG.x,goal.y-e.tpG.y)>40){e.tp=World.findPath(e,goal)||[];e.tpAt=time+1.5;e.tpG={x:goal.x,y:goal.y};}
    let wp=e.tp[0];while(wp&&Math.hypot(wp.x-e.x,wp.y-e.y)<8){e.tp.shift();wp=e.tp[0];}
    if(!wp)wp=goal;const dx=wp.x-e.x,dy=wp.y-e.y,l=Math.hypot(dx,dy);e.moving=false;
    if(l>2){const st=Math.min(l,spd*dt),ox=e.x,oy=e.y;World.move(e,dx/l*st,dy/l*st,11);const mv=Math.hypot(e.x-ox,e.y-oy);e.moving=mv>.05;e.walk+=mv*.09;if(Math.abs(dx)>3)e.facing=dx<0?-1:1;}
    return Math.hypot(goal.x-e.x,goal.y-e.y)<14;
  }
  const tutPt=(tx,ty)=>{const o=World.nearestOpen(tx,ty)||{x:tx,y:ty};return {x:(o.x+.5)*T,y:(o.y+.5)*T};};
  function tutStart(){
    const crew=[],slots=[[80,-10],[125,-55],[130,45],[180,0]];
    TUT_CREW.forEach(([n,g],i)=>{let x=hero.x+300+i*40,y=hero.y+(i%2?-1:1)*60*(i>>1)+(i?20:0);if(!World.canStand(x,y)){x=hero.x+slots[i][0];y=hero.y+slots[i][1];}if(!World.canStand(x,y)){x=hero.x+40;y=hero.y;}const e=tutBot(i,n,g,x,y);e.slot={x:hero.x+slots[i][0],y:hero.y+slots[i][1]};if(!World.canStand(e.slot.x,e.slot.y))e.slot={x:hero.x+60+i*20,y:hero.y};bots.push(e);crew.push(e);});
    tut={ph:'meet',t:time,crew,beo:crew[0],A:tutPt(38,15),said:{}};
    tutSay(crew[1],'Ơ, tân thủ kìa!',2.5);setTimeout(()=>{if(tut)tutSay(crew[3],'Chào người mới!',2.5);},700);
  }
  function tutUpdate(dt){
    if(tut.part===2)return tut2Update(dt);
    const U=tut,[beo,...rest]=U.crew,X=player.gender==='f'?'Cô':'Chú',x=X.toLowerCase(),age=time-U.t;
    const behind=(e,k)=>({x:beo.x-beo.facing*(50+k*38),y:beo.y+(k%2?-22:22)});
    if(U.ph==='meet'){
      let all=true;for(const e of U.crew){if(!tutWalk(e,e.slot,130,dt))all=false;else e.facing=hero.x<e.x?-1:1;}
      if((all&&age>2.2)||age>7){if(busy())return;U.ph='talk';
        tutTalk(beo,[`Hi! ${X} mới vào đây ư? Đi theo Béo Ca nào! Béo Ca sẽ chỉ cho ${x} vả con quái ngoài bìa rừng!`],'Đi theo',()=>{U.ph='follow';U.t=time;tutSay(beo,'Theo sát Béo Ca nhé!');});}
      return;
    }
    if(U.ph==='talk'){if(!dialogNPC){U.ph='follow';U.t=time;}return;}
    if(U.ph==='follow'){
      const hd=Math.hypot(hero.x-beo.x,hero.y-beo.y);
      if(hd>260){beo.moving=false;beo.facing=hero.x<beo.x?-1:1;if(time>(U.waitSay||0)){U.waitSay=time+4;tutSay(beo,'Nhanh lên nào, '+x+' ơi!',2.5);}}
      else if(tutWalk(beo,U.A,112,dt)){U.ph='ambush';U.t=time;beo.facing=1;tutSay(beo,'Tới rồi! Quái đâu, ra đây coi!',3);
        const L=tutPt(45,14),M=MON.lion,hp=Math.round(M.hp*.7);
        const m={id:9990,type:'lion',tut:true,hx:U.A.x+3*T,hy:U.A.y,x:L.x,y:L.y,hp,max:hp,dead:false,deadAt:0,respawn:1e18,facing:-1,walk:0,moving:false,hurt:-9,aggro:time+30,atk:null,cd:0,flee:0,wander:null,stunUntil:0,burn:null,burnAcc:0,leapCd:0,leap:null,chase:{ent:beo,until:time+30}};
        monsters.push(m);U.lion=m;}
      if(!U.said.bridge&&beo.x>28*T){U.said.bridge=1;tutSay(beo,'Qua cầu là tới bìa rừng!');tutSay(rest[1],'Hôm nay vả sư tử!',2.6);}
      rest.forEach((e,k)=>{const g=behind(e,k+1);if(Math.hypot(g.x-e.x,g.y-e.y)>26)tutWalk(e,g,124,dt);else e.moving=false;});
      // người chơi tự đi theo Béo Ca (bấm phím di chuyển thì tự đi)
      if(!busy()&&!hero.dead&&moveVector().len<.05&&time>(U.routeAt||0)&&hd>95){U.routeAt=time+.5;const g=behind(hero,rest.length+1),p=World.findPath(hero,g);if(p)route=p;}
      return;
    }
    if(U.ph==='ambush'){
      const m=U.lion,d=Math.hypot(m.x-beo.x,m.y-beo.y);
      if(!U.said.roar&&d<420){U.said.roar=1;floater(m.x,m.y-MON.lion.h-20,'Gầmmm!','#ffb070',20);LH_Audio.play('hurt');tutSay(beo,'Ơ… con gì to thế kia?',2);}
      if(!U.pounce&&!m.dead&&d<170){U.pounce=time+.45;m.chase=null;m.facing=beo.x<m.x?-1:1;m.leap={start:time,dur:.45,tx:beo.x+(m.x>beo.x?30:-30),ty:beo.y};fx.push({kind:'ring',x:beo.x,y:beo.y,r0:10,r1:60,color:'#ff7a5a',age:0,life:.45,lw:3});}
      if(U.pounce&&time>=U.pounce){
        beo.hp=0;beo.dead=1;beo.respawnAt=1e18;beo.say=null;burst(beo.x,beo.y-20,'#cfcfcf',22,160);floater(beo.x,beo.y-86,'Á á á!!','#ffb0a0',18);shake(6);LH_Audio.play('die');
        message(svg('close')+'Béo Ca bị sư tử vồ gục!',3);
        const cry=['Chạy đi tụi bay!','Ối zồi ôi! Méo ổn rồi!','Á á! Sư tử thật kìa!'];rest.forEach((e,k)=>{tutSay(e,cry[k%cry.length],3.4);e.runTo=safeSpot(World.spawn.x,World.spawn.y,6*T)||World.spawn;});
        m.aggro=time+60;m.tgt='hero';U.ph='fight';U.t=time;U.hint=time+3.5;
      }
      if(!m.dead&&d>=170)m.chase={ent:beo,until:time+5};
      return;
    }
    if(U.ph==='fight'||U.ph==='greet'||U.ph==='lead'){
      // ba người còn lại chạy tán loạn về làng, tới nơi thì đi lại trong làng như người chơi khác
      for(const e of rest){if(!e.tut||e.dead)continue;if(tutWalk(e,e.runTo,180,dt)){e.tut=false;e.town=true;e.home={x:e.x,y:e.y,r:5*T};e.wander=null;}else if(time>(e.cryAt||0)){e.cryAt=time+2.6+Math.random()*1.5;if(time>(e.say?e.say.until:0))tutSay(e,['Cứu với!','Chạy mau!','Mẹ ơi!'][Math.floor(Math.random()*3)],1.6);}}
      // Béo Ca gục rồi về làng dưỡng thương
      if(beo.dead&&age>8)tutBeoBack(beo);
    }
    if(U.ph==='fight'){
      const m=U.lion;
      if(time>U.hint){U.hint=time+14;message(svg('sword')+(hero.dead?'':'Hạ con sư tử! Bấm Đánh (Space), dùng Combo (H) khi có mana'),4);}
      if(!m.dead){if(!hero.dead&&!World.isSafe(hero.x,hero.y)&&Math.hypot(hero.x-m.x,hero.y-m.y)<640)m.chase={ent:hero,until:time+2};return;}
      U.ph='greet';U.t=time;
      const G=tutPt(27,15),e=tutBot(9,'Hiệp khách Vân','f',G.x,G.y);bots.push(e);U.vy=e;tutSay(e,'Khoan đã, các hạ!',2.4);
      return;
    }
    if(U.ph==='greet'){
      const e=U.vy,hd=Math.hypot(hero.x-e.x,hero.y-e.y);
      if(hd>85){if(!hero.dead)tutWalk(e,{x:hero.x-(hero.x>e.x?55:-55),y:hero.y},175,dt);return;}
      e.moving=false;if(busy())return;U.ph='talk2';
      tutTalk(e,['Các hạ thật lợi hại, mời các hạ vào thành gặp gỡ mọi người trong làng!'],'Vào làng',()=>{U.ph='lead';U.t=time;tutDone();});
      return;
    }
    if(U.ph==='talk2'){if(!dialogNPC){U.ph='lead';U.t=time;tutDone();}return;}
    if(U.ph==='lead'){
      const e=U.vy,sp=U.home||(U.home=safeSpot(World.spawn.x,World.spawn.y,3*T)||World.spawn);
      if(tutWalk(e,sp,120,dt)||age>40){e.tut=false;e.town=true;e.home={x:e.x,y:e.y,r:5*T};e.wander=null;const i=monsters.indexOf(U.lion);if(i>=0&&U.lion.dead)monsters.splice(i,1);
        if(beo.dead)tutBeoBack(beo);beo.tut=false;beo.town=true;tut2Start('village');return;}
      if(!busy()&&!hero.dead&&moveVector().len<.05&&time>(U.routeAt||0)&&Math.hypot(hero.x-e.x,hero.y-e.y)>90){U.routeAt=time+.5;const p=World.findPath(hero,{x:e.x-(e.facing*50),y:e.y});if(p)route=p;}
    }
  }
  function tutBeoBack(beo){Object.assign(beo,{dead:0,hp:Math.round(beo.max*.3),x:World.spawn.x+70,y:World.spawn.y+40,tut:false,town:true,home:{x:World.spawn.x+70,y:World.spawn.y+40,r:3*T},wander:null,tp:null});if(!World.canStand(beo.x,beo.y)){beo.x=World.spawn.x;beo.y=World.spawn.y;beo.home.x=beo.x;beo.home.y=beo.y;}tutSay(beo,'Ui da… sư tử ác quá!',4);}
  function tutDone(){seen.add('tut');checkpoint();if(tut&&tut.vy)tutSay(tut.vy,'Đi thôi, mọi người đang chờ!',3);}
  /* ---------- v10.28: Hướng dẫn tân thủ phần 2 — vào làng gặp Lý trưởng nhận đồ, dẫn tân binh đi bắt Ngư Tinh, bị hạ một đòn, tỉnh dậy ở làng ---------- */
  function tut2On(){const v=CFG.huong_dan_tan_thu;return World.id==='thanh-moc'&&!(v===0||v==='0')&&seen.has('tut')&&!seen.has('tut2');}
  function tut2Crew(){
    return [['Hiệp khách Vân','f'],['Gầy Đệ','m'],['Tí Còi','m'],['Na Lém','f']].map(([n,g],i)=>{let e=bots.find(b=>b.name===n&&b.key.startsWith('bot3'));
      if(!e){const p=safeSpot(hero.x,hero.y,3*T)||{x:hero.x+40,y:hero.y};e=tutBot(10+i,n,g,p.x,p.y);bots.push(e);}
      Object.assign(e,{tut:true,town:false,tp:null,wander:null,dead:0});if(e.hp<=0)e.hp=e.max;return e;});
  }
  function tut2Start(ph){
    const crew=tut2Crew();
    tut={part:2,ph,t:time,crew,said:{},elder:World.npcs.find(n=>n.id==='elder'),smith:World.npcs.find(n=>n.id==='smith'),fish:monsters.find(m=>m.type==='ngu-tinh'),goal:null};
    if(ph==='hunt')tut2Hunt();
  }
  function tut2Resume(){if(!(player.flags&&player.flags.tutGift))tut2Start('village');else if(!player.flags.tutDied)tut2Start('hunt');else{seen.add('tut2');checkpoint();}}
  function tut2Hunt(){const U=tut;U.ph='hunt';U.t=time;U.said={};U.goal=U.fish;const v=U.crew[0];v.tut=false;v.town=true;v.home={x:v.x,y:v.y,r:4*T};tutSay(v,'Lên đường bình an nhé!',2.6);
    message(svg('pin')+'Dẫn ba tân binh ra phía đông nam làng tìm Ngư Tinh',4.5);}
  function tut2Elder(n){
    keys.clear();joystick={x:0,y:0};holdAttack=false;route=[];targetNPC=null;hero.attack=null;tut.ph='elderTalk';
    dialogNPC={id:'tut-elder',name:n.name,btn:'Nhận đồ',tut:true,lines:['Làng tặng đại hiệp bộ quần áo, hãy mở thùng đồ để mặc đồ.','Nhân tiện hãy đưa ae tân binh kia ra ngoài thành bắt «Chung Tình»… à nhầm!!! Ngư Tình… à nhầm. Ngư Tinh giúp làng nhé, nó ở phía đông nam của làng!'],
      onEnd:()=>{op({t:'tutGift'}).then(r=>{LH_Audio.play('pickup');message(svg('bag')+'Nhận '+(r.items||[]).map(it=>Player.nameOf(it)).join(', ')+' · mở Túi đồ (B) để mặc',5);},()=>{});if(tut&&tut.part===2)tut2Hunt();}};
    page=0;dialogEl.hidden=false;showLine();
  }
  // một đòn của Ngư Tinh: người chơi gục ngay, không né, không đỡ
  function tutKO(m){tut.koed=true;const d=Math.max(9999,Math.round(HD.tot.hp*40));floater(hero.x,hero.y-70-seatH(),'x2 -'+d,'#ff4a3a',24);burst(hero.x,hero.y-24,'#ff7a6a',44,280);shake(16);LH_Audio.play('hurt');hero.invuln=0;die();window.GameUI?.refresh();}
  function tut2Update(dt){
    const U=tut,[van,...three]=U.crew,age=time-U.t;
    const spot=k=>({x:hero.x-hero.facing*(60+(k%2)*34),y:hero.y+(k-1.5)*30});
    const follow=(list,spd)=>list.forEach((e,k)=>{if(e.dead||!e.tut)return;const g=spot(k),d=Math.hypot(g.x-e.x,g.y-e.y);if(d>36)tutWalk(e,g,d>320?220:spd,dt);else{e.moving=false;e.facing=hero.x<e.x?-1:1;}});
    const lines=(L,who,gap)=>{L.forEach((t,k)=>{if(!U.said['l'+k]&&age>.6+k*(gap||1.8)){U.said['l'+k]=1;tutSay(who[k%who.length],t,4);}});};
    if(U.ph==='village'){
      U.goal=U.elder;follow(U.crew,150);
      lines(['Qua gặp Lý trưởng kìa bạn!','Bạn đánh cả sư tử thì kinh rồi!','Nhà tôi cũng có 1 con sư tử','Lão Lý trưởng dâm dê lắm'],U.crew);
      if(age>12&&time>(U.nag||0)){U.nag=time+14;tutSay(van,'Qua gặp Lý trưởng kìa bạn!',3);}
      return;
    }
    if(U.ph==='elderTalk'){if(!dialogNPC)tut2Hunt();return;}
    if(U.ph==='hunt'){
      const f=U.fish;follow(three,150);
      if(!f||f.dead){seen.add('tut2');checkpoint();for(const e of three){e.tut=false;e.town=true;e.home={x:e.x,y:e.y,r:4*T};}tut=null;return;}
      if(!U.said.out&&!World.isSafe(hero.x,hero.y)){U.said.out=1;tutSay(three[0],'Ngư Tinh ở đông nam đó!',3);tutSay(three[2],'Có đại hiệp đi cùng, sợ gì!',3);}
      if(!hero.dead&&Math.hypot(hero.x-f.x,hero.y-f.y)<330&&!World.isSafe(hero.x,hero.y)){
        U.ph='strike';U.t=time;U.oneHit=f;f.aggro=time+8;f.atk=null;f.cast=null;f.facing=hero.x<f.x?-1:1;f.leap={start:time,dur:.6,tx:hero.x+(f.x>hero.x?38:-38),ty:hero.y};
        floater(f.x,f.y-MON[f.type].h-24,'Grààào!!','#7fd0ff',22);fx.push({kind:'ring',x:hero.x,y:hero.y,r0:10,r1:70,color:'#7fd0ff',age:0,life:.6,lw:4});
        const cry=['Chạy đi tụi bay!','Ối zồi ôi! Méo ổn rồi!','Tao đã nghi nghi rồi!'];three.forEach((e,k)=>{tutSay(e,cry[k],3.6);e.runTo=safeSpot(World.spawn.x,World.spawn.y,5*T)||World.spawn;});
      }
      return;
    }
    if(U.ph==='strike'||U.ph==='dead'){
      for(const e of three){if(!e.runTo)continue;if(tutWalk(e,e.runTo,185,dt))e.runTo=null;else if(time>(e.cryAt||0)){e.cryAt=time+2.4+Math.random()*1.4;if(time>(e.say?e.say.until:0))tutSay(e,['Cứu với!','Chạy mau!','Mẹ ơi!'][Math.floor(Math.random()*3)],1.5);}}
      if(U.ph==='strike'){if(hero.dead){U.ph='dead';U.oneHit=null;U.koed=false;}else if(age>1.4&&U.oneHit)tutKO(U.oneHit);return;}
      if(!hero.dead){U.ph='wake';U.t=time;U.said={};U.goal=null;
        U.crew.forEach((e,k)=>{const a=-.6+k*.55,x=hero.x+Math.cos(a)*90,y=hero.y+Math.sin(a)*70,p=World.canStand(x,y)?{x,y}:safeSpot(hero.x,hero.y,2*T)||{x:hero.x+40,y:hero.y};Object.assign(e,{x:p.x,y:p.y,tut:true,town:false,dead:0,runTo:null,tp:null,moving:false,say:null,cryAt:time+99,facing:hero.x<p.x?-1:1});});
        message(svg('close')+'Bạn bị Ngư Tinh hạ một đòn · mất hết đồ đạc',4.5);}
      return;
    }
    if(U.ph==='wake'){
      lines(['Tỉnh rồi à bạn!','Còn đúng mảnh vải che thân','Thấy tội ghê!','Hãy ra chỗ Thợ rèn ở đó có quần áo!'],[three[0],three[1],three[2],van]);
      for(const e of U.crew)e.facing=hero.x<e.x?-1:1;
      if(age>7.8&&!U.goal){U.goal=U.smith;message(svg('bag')+'Tới Thợ rèn mua quần áo mới',4);}
      if(!U.smithTalk&&!busy()&&((U.smith&&Math.hypot(hero.x-U.smith.x,hero.y-U.smith.y)<130)||age>150))tut2Smith();
    }
  }
  function tut2Smith(){
    const U=tut;if(!U||U.smithTalk)return;U.smithTalk=1;U.goal=null;keys.clear();joystick={x:0,y:0};holdAttack=false;route=[];targetNPC=null;hero.attack=null;
    const n=U.smith||{name:'Thợ rèn'};dialogNPC={id:'tut-smith',name:n.name,tut:true,btn:'Xong',lines:['Không có tiền thì qua đây làm gì? Muốn có đồ ngon phải có tiền!!!','Hãy đi làm thuê cho Lý Trưởng và hắn sẽ trả tiền công cho ngươi!'],
      onEnd:()=>{seen.add('tut2');checkpoint();if(tut&&tut.crew)for(const e of tut.crew){e.tut=false;e.town=true;e.home={x:e.x,y:e.y,r:4*T};e.wander=null;}tut=null;LH_Audio.play('pickup');message(svg('check')+'Hoàn thành nhiệm vụ giới thiệu tân thủ',5);}};
    page=0;dialogEl.hidden=false;showLine();
  }
  // mũi tên chỉ đường quanh nhân vật
  function drawTutArrow(){
    const g=tut&&tut.goal;if(!g||hero.dead||(g.dead))return;const dx=g.x-hero.x,dy=g.y-hero.y,d=Math.hypot(dx,dy);if(d<150)return;
    const a=Math.atan2(dy,dx),r=64+Math.sin(time*5)*6,x=hero.x+Math.cos(a)*r,y=hero.y-22+Math.sin(a)*r*.75;
    ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=.92;ctx.fillStyle='#ffd54a';ctx.strokeStyle='#5a3a0a';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-8,-13);ctx.lineTo(-2,0);ctx.lineTo(-8,13);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();
  }
  /* ---------- v10.31: Hang động — đang đánh quái thì thỉnh thoảng một người chơi ảo lao vào đánh lén (PK); đánh thắng được 1 lượt chiêu mộ miễn phí ở Thanh Mộc ---------- */
  let pk=null,pkNext=0;
  const PK_NAMES=[['Kiếm khách Hắc Y','m'],['Sát thủ Ẩn Danh','m'],['Lãng khách Vô Danh','m'],['Hồng Y nữ tặc','f'],['Cuồng đao Tứ Hải','m']];
  const pkOwner=a=>a&&(a.owner==='hero'||a.owner==='clone'||(!(pk&&pk.duel)&&(a.owner==='merc'||a.owner==='pet'))); // v10.34: võ đài chỉ tính đòn của chính nhân vật (một chọi một)
  function pkSpawn(){
    const [name,g]=PK_NAMES[Math.floor(Math.random()*PK_NAMES.length)],L=Math.max(Player.mapLevel(World.id),player.level||1),st=12+L*2;
    const d=Player.makeMerc({name,gender:g,stats:{strength:st,agility:st,vitality:st+4,intelligence:st}});try{botGear(d,L+3,Math.random);}catch(e){}d.name=name;
    let p=null;for(let k=0;k<20&&!p;k++){const a=Math.random()*PI2,r=300+Math.random()*120,x=hero.x+Math.cos(a)*r,y=hero.y+Math.sin(a)*r;if(World.canStand(x,y)&&!World.isSafe(x,y))p={x,y};}if(!p)return;
    // máu kẻ đánh lén ≈ pk_so_don đòn thường của nhân vật
    const e=makeBot(500,d,{x:p.x,y:p.y,r:T},p.x,p.y,false);e.tut=true;e.pk=true;e.name=name;e.max=e.hp=Math.max(60,Math.round((HD.tot.dmgMin+HD.tot.dmgMax)/2*HD.dmgMul*(Number(CFG.pk_so_don)||16)));e.cd=time+1.2;
    bots.push(e);pk={e,t:time};tutSay(e,['Đồ ngon đấy, để lại đây!','Hang này là của ta!','Nộp mạng đi!'][Math.floor(Math.random()*3)],3);
    message(svg('sword')+esc(name)+' lao vào đánh lén · đánh trả để nhận 1 lượt chiêu mộ miễn phí ở Thanh Mộc!',4.5);LH_Audio.play('boss');
  }
  function pkEnd(e,say){if(say)tutSay(e,say,2.6);const i=bots.indexOf(e);setTimeout(()=>{const j=bots.indexOf(e);if(j>=0){burst(e.x,e.y-24,'#cfc6b8',12,120);bots.splice(j,1);}},say?1800:0);if(i<0){}pk=null;pkNext=time+(Number(CFG.pk_giay)||90);}
  function pkDamage(atk,dx,dy){
    const e=pk.e,r=atk.abs?{dmg:Math.max(1,Math.round(atk.abs)),color:'#fff1c4',size:13}:rollHit(atk.D,atk.mul,atk.owner);let dmg=r.dmg;
    e.hp-=dmg;e.hurt=time;floater(e.x+(Math.random()*16-8),e.y-62,String(dmg),r.color||'#fff1c4',r.size||13);burst(e.x,e.y-24,atk.el?EL[atk.el].color:'#f1e2b5',6);World.move(e,dx*10,dy*10,11);if(atk.owner==='hero')LH_Audio.play('hit');
    if(e.hp<=0&&e.duel){duelWon(e);return;}
    if(e.hp<=0){e.hp=0;e.dead=1;e.respawnAt=1e18;burst(e.x,e.y-20,'#cfcfcf',22,160);floater(e.x,e.y-84,'Tha cho ta!','#ffe6a8',15);pk=null;pkNext=time+(Number(CFG.pk_giay)||90);
      const i=bots.indexOf(e);if(i>=0)bots.splice(i,1);
      op({t:'pkWin'}).then(r=>{LH_Audio.play('rare');message(svg('flag')+'Thắng! Nhận 1 lượt chiêu mộ miễn phí ở làng Thanh Mộc (đang có '+r.free+')',5);window.GameUI?.refresh();},()=>message(svg('check')+'Đã đánh bại '+esc(e.name),3));}
  }
  function pkHit(e){
    if(hero.dead||time<hero.invuln)return;const S=HD.tot;if(Math.random()*100<S.dodge){floater(hero.x,hero.y-66-seatH(),'Né','#cfe8ff',15);hero.invuln=time+.2;return;}
    let d=S.hp*(e.dmgPct||Number(CFG.pk_sat_thuong)||7)/100*(.8+Math.random()*.4);if(time<hero.blockUntil||Math.random()*100<S.block)d*=.2;d*=1-(S.dmgRed||0)/100;d=Math.max(1,Math.round(d));
    if(hero.shieldHp>0){const a=Math.min(hero.shieldHp,d);hero.shieldHp-=a;d-=a;}
    player.hp-=d;hero.hurt=time;hero.lastHurt=time;hero.invuln=time+.35;floater(hero.x,hero.y-66-seatH(),'-'+d,'#ff8f86',15);shake(3);LH_Audio.play('hurt');
    if(S.reflect&&e.hp>0)pkDamage({abs:d*S.reflect/100,owner:'reflect',color:EL.earth.glow},Math.sign(e.x-hero.x)||1,0); // phản đòn (sách Thổ)
    if(player.hp<=0)die();window.GameUI?.refresh();
  }
  function pkTick(dt){
    if(pk){
      const e=pk.e;if(bots.indexOf(e)<0||(World.id!=='hang-dong'&&!pk.duel)){pk=null;return;}if(e.dead)return;
      if(hero.dead){pkEnd(e,pk.duel?'Về luyện thêm rồi hẵng thượng đài!':'Yếu thế mà cũng vào hang!');return;}
      if(pk.duel){const A=World.def.arena;if(!A||Math.hypot(hero.x-(A.x+.5)*T,hero.y-(A.y+.5)*T)>(A.r+1.5)*T){pkEnd(e,'Bỏ đài là thua!');message(svg('close')+'Rời võ đài · trận đấu bị hủy',3);return;}}
      const dx=hero.x-e.x,dy=hero.y-e.y,d=Math.hypot(dx,dy);
      if(!pk.duel&&(d>900||World.isSafe(hero.x,hero.y))){pkEnd(e,'Lần sau gặp lại!');return;}
      e.facing=dx<0?-1:1;
      if(e.attack){const a=e.attack,p=(time-a.start)/a.dur;if(!a.hitDone&&p>=a.hit){a.hitDone=true;if(Math.hypot(hero.x-e.x,hero.y-e.y)<(a.reach||80))pkHit(e);}if(p>=1)e.attack=null;}
      const st=Player.stance(e.data),A=ATK[st.type]||ATK.punch,far=A.kind!=='melee'&&A.kind!=='thrust',reach=far?230:(A.range||70)*.8+20;
      if(d>reach-10){tutWalk(e,{x:hero.x-dx/(d||1)*(reach-30),y:hero.y-dy/(d||1)*(reach-30)*.5},150,dt);}
      else{e.moving=false;if(!e.attack&&time>e.cd){e.aim={x:dx/(d||1),y:dy/(d||1)};e.attack={type:st.type,skill:'normal',start:time,dur:A.dur,hit:A.hit,hitDone:false,aim:{...e.aim},stance:st,hand:'right',reach:reach+20};e.cd=time+A.dur+(e.rest||Number(CFG.pk_nghi_giay)||.9);}}
      if(time>(e.tauntAt||0)){e.tauntAt=time+6+Math.random()*5;if(e.duel&&Math.random()<.5)tutSay(e,DUEL[e.duel-1][1],2.4);else if(e.hp<e.max*.35)tutSay(e,'Khá lắm…',2);else if(Math.random()<.5)tutSay(e,['Đỡ này!','Chạy đi đâu!','Ha ha!'][Math.floor(Math.random()*3)],1.8);}
      return;
    }
    if(World.id!=='hang-dong'||hero.dead||safe||tut||busy()||time<pkNext||time-(hero.lastHitAt||-99)>3)return;
    pkNext=time+(Number(CFG.pk_giay)||90)*(.6+Math.random()*.8);if(Math.random()*100<(Number(CFG.pk_ti_le)||35))pkSpawn();
  }
  /* ---------- v10.34: nhiệm vụ ẩn của 10 vùng cấp 400–999 ----------
     Cổ Chiến Trường: quân địch tràn ra từng đợt; vào giữa doanh trại đứng cạnh cờ soái vài giây để đoạt cờ → mở cổng sang Lưu Sa Hà.
     Võ Đài Thập Tướng: nói với Trọng tài để thượng đài, lần lượt một chọi một 10 danh tướng (mặc bộ Thần của lính đánh thuê) → mở cổng sang Vạn Kiếm Sơn.
     Hỗn Nguyên Điện (cấp 999): hạ Hỗn Nguyên Ma Tổ, mở lồng cứu An (con gái), đưa con về làng Thanh Mộc; dân làng ra chào tạm biệt hai cha con. */
  const DUEL=[['ha-hau-don','Mắt là tinh huyết cha mẹ, không thể bỏ!'],['hua-chu','Hổ Si ở đây, kẻ nào dám tới!'],['dien-vi','Ác Lai giữ cửa, đừng hòng qua!'],['hoang-trung','Lão tướng này chưa già đâu!'],['ma-sieu','Cẩm Mã Siêu đất Tây Lương đây!'],
    ['truong-phi','Ta là Trương Dực Đức đất Yến!'],['trieu-van','Thường Sơn Triệu Tử Long đây!'],['quan-vu','Thanh Long Đao không chém kẻ vô danh!'],['hang-vu','Sức nhổ núi, khí trùm đời!'],['lu-bo','Nhân trung Lữ Bố, mã trung Xích Thố!']];
  let VIT=null,DUCK=null,BT=null,AN=null,FW=null,hqHint='',SQ=null,cageWant=false,cageBusy=false,cageAuto=0;
  const hqDone=k=>!!(player.flags.hq&&player.flags.hq[k]);
  try{LH_ART.add('con-gai',K=>LH_ART.gen({npc:{'con-gai-an':{robe:'#e86a9a',trim:'#fff0c0',hat:'none',hair:'#2a2622',s:.6,fem:1,skirt:1,sash:'#fff0c0'}}}));}catch(e){}
  function hqReset(){BT=null;hqHint='';if(AN)AN.map='';SQ=null;}
  function talkBox(o){keys.clear();joystick={x:0,y:0};holdAttack=false;route=[];targetNPC=null;hero.attack=null;dialogNPC={tut:true,...o};page=0;dialogEl.hidden=false;showLine();}
  // Cổ Chiến Trường: đợt quân
  function btWave(n){
    const D=World.def,types=[...new Set((D.camps||[]).flatMap(c=>Object.keys(c.mon||{})))].filter(t=>MON[t]);if(!types.length)return;let put=0;
    for(let k=0;k<n;k++){let p=null;for(let j=0;j<24&&!p;j++){const a=Math.random()*PI2,r=380+Math.random()*280,x=hero.x+Math.cos(a)*r,y=hero.y+Math.sin(a)*r;if(World.canStand(x,y)&&!World.isSafe(x,y))p={x,y};}if(!p)continue;
      const type=types[k%types.length],M=MON[type],m={id:9500+monsters.length+k,type,wave:1,hx:p.x,hy:p.y,x:p.x,y:p.y,hp:M.hp,max:M.hp,dead:false,deadAt:0,respawn:1e18,facing:-1,walk:0,moving:false,hurt:-9,aggro:time+90,atk:null,cd:0,flee:0,wander:null,stunUntil:0,burn:null,burnAcc:0,leapCd:0,leap:null};
      monsters.push(m);burst(p.x,p.y-20,'#ff6040',10,140);put++;}
    if(put){message(svg('flag')+'Đợt quân thứ '+BT.wave+' tràn ra · '+put+' tên!',2.6);LH_Audio.play('boss');shake(3);}
  }
  function btTick(dt){
    const D=World.def;if(D.kind!=='battle'){BT=null;return;}
    if(!BT)BT={next:time+6,wave:0,hold:0,tipAt:0,busy:false,told:false};
    for(let i=monsters.length-1;i>=0;i--){const m=monsters[i];if(m.wave&&m.dead&&time-m.deadAt>2.5)monsters.splice(i,1);}
    if(hero.dead||tut)return;
    if(time>=BT.next){BT.next=time+(safe?3:(Number(CFG.chien_truong_dot_giay)||16));if(!safe){const alive=monsters.filter(m=>m.wave&&!m.dead).length,cap=Number(CFG.chien_truong_toi_da)||45,n=Math.min(cap-alive,(Number(CFG.chien_truong_so_quai)||12)+Math.min(10,BT.wave));if(n>0){BT.wave++;btWave(n);}}}
    const f=D.flag;if(!f||hqDone('chien-truong'))return;const fx=(f.x+.5)*T,fy=(f.y+.6)*T,d=Math.hypot(hero.x-fx,hero.y-fy);
    if(d<260&&!BT.told){BT.told=true;message(svg('flag')+'Cờ soái của địch tung bay giữa doanh trại…',3.5);}
    if(d<84){BT.hold+=dt;const need=Number(CFG.chien_truong_doat_giay)||3;if(time>BT.tipAt){BT.tipAt=time+.45;floater(fx,fy-118,'Đoạt cờ '+Math.min(100,Math.round(BT.hold/need*100))+'%','#ffd040',15);}
      if(BT.hold>=need&&!BT.busy){BT.busy=true;op({t:'hqFlag'}).then(r=>{burst(fx,fy-70,'#ffd040',46,260);shake(6);LH_Audio.play('levelup');floater(fx,fy-140,'Đã đoạt cờ soái!','#ffd040',20);message(svg('flag')+'Đoạt cờ soái! Cổng phía bắc sang Lưu Sa Hà đã mở'+(r.rubies?' · +'+r.rubies+' hồng ngọc':''),6);window.GameUI?.refresh();},()=>{BT.busy=false;BT.hold=0;});}}
    else BT.hold=Math.max(0,BT.hold-dt*2);
  }
  // Võ Đài Thập Tướng
  const duelList=()=>DUEL.filter(([id])=>Player.TUONG[id]);
  function duelAsk(n){
    const L=duelList(),k=Math.min(L.length,Math.floor(Number(player.flags.duel)||0));n.facing=hero.x<n.x?-1:1;
    if(hqDone('vo-dai')||k>=L.length){talkBox({id:'duel-done',name:n.name,lines:['Mười danh tướng đều đã bại dưới tay các hạ. Cổng phía bắc mở rồi — đường tới Vạn Kiếm Sơn thông suốt!']});return;}
    if(pk&&pk.duel){message(svg('sword')+'Trận đấu đang diễn ra',2);return;}
    const G=Player.TUONG[L[k][0]];
    talkBox({id:'duel-ask',name:n.name,lines:[k?`Các hạ đã thắng ${k}/${L.length} trận. Người kế tiếp chờ trên đài là ${G.name}.`:`Võ đài Thập Tướng: ${L.length} danh tướng lần lượt thượng đài, mỗi trận một chọi một — lính đánh thuê, thú nuôi không được giúp. Thắng đủ thì cổng phía bắc tự mở.`,`Trận ${k+1}/${L.length} — ${G.name}. Các hạ sẵn sàng chưa?`],choices:['Thượng đài!','Để sau'],onChoice:i=>{if(i===0)duelStart(k);}});
  }
  function duelStart(k){
    const A=World.def.arena,L0=duelList();if(!A||!L0[k])return;const [id,cry]=L0[k],G=Player.TUONG[id],cx=(A.x+.5)*T,cy=(A.y+.5)*T;
    const L=Player.mapLevel(World.id)+k*(Number(CFG.vo_dai_cap_tang)||25),st=12+L*2;
    const d=Player.makeMerc({name:G.name,gender:G.gender,stats:{strength:st,agility:st,vitality:st+4,intelligence:st}});d.name=G.name;
    const SET=Player.SETS[G.setM]||Player.SETS[G.setL];if(SET)for(const pid of SET.pieces){const it0=Player.items[pid];if(!it0||it0.slot==='mount')continue;try{const it=Player.roll(pid,it0.q||'m',Math.random);it.lv=Math.min(15,6+k);d.equipment[it0.slot==='hand'?(/:left$/.test(pid)?'left':'right'):it0.slot]=it;}catch(e){}}
    if(World.canStand(cx,cy+T*3)){hero.x=cx;hero.y=cy+T*3;}hero.facing=1;route=[];
    const e=makeBot(600+k,d,{x:cx,y:cy,r:T},cx,cy-T*3,false);e.tut=true;e.pk=true;e.duel=k+1;e.name=G.name;e.facing=-1;
    const avg=(HD.tot.dmgMin+HD.tot.dmgMax)/2*HD.dmgMul;e.max=e.hp=Math.max(200,Math.round(avg*((Number(CFG.vo_dai_so_don)||22)+k*(Number(CFG.vo_dai_so_don_tang)||4))));
    e.cd=time+2.2;e.dmgPct=(Number(CFG.vo_dai_sat_thuong)||6)+k*(Number(CFG.vo_dai_sat_thuong_tang)||.6);e.rest=Math.max(.45,(Number(CFG.pk_nghi_giay)||.9)-k*.04);
    bots.push(e);pk={e,t:time,duel:k+1};tutSay(e,cry,3.5);message(svg('sword')+`Trận ${k+1}/${L0.length} · ${esc(G.name)} thượng đài!`,4);LH_Audio.play('boss');shake(4);
  }
  function duelWon(e){
    e.hp=0;e.dead=1;e.respawnAt=1e18;burst(e.x,e.y-20,'#ffd040',30,200);floater(e.x,e.y-90,'Bội phục! Bội phục!','#ffe6a8',16);pk=null;
    setTimeout(()=>{const i=bots.indexOf(e);if(i>=0)bots.splice(i,1);},1600);
    op({t:'duelWin',n:e.duel}).then(r=>{LH_Audio.play('rare');const n=duelList().length;
      if(r.duel>=n){LH_Audio.play('levelup');shake(6);message(svg('flag')+`Thắng cả ${n} danh tướng! Cổng phía bắc sang Vạn Kiếm Sơn đã mở · +${r.rubies} hồng ngọc`,7);}
      else message(svg('check')+`Thắng trận ${r.duel}/${n} · +${r.rubies} hồng ngọc · nói với Trọng tài để đánh trận kế`,5);window.GameUI?.refresh();},
      err=>message(svg('close')+'Chưa ghi được trận thắng ('+esc(String(err&&err.message||err))+') · đánh lại trận này',4));
  }
  // Hỗn Nguyên Điện: lồng giam con gái
  const cageAt=()=>{const r=World.def.kind==='final'&&World.def.rescue;return r?{x:(r.x+.5)*T,y:(r.y+.8)*T}:null;};
  // v10.40: bấm / chạm vào lồng (điện thoại không có phím E): đứng xa thì tự đi tới rồi mở; đứng sát lồng sau khi đã hạ trùm thì tự mở
  function hqTouch(pt){
    if(wkTouch(pt))return true; // v10.65: Tôn Ngộ Không dưới núi
    if(butTouch(pt))return true; // v10.74: Ông Bụt giữa hồ Rừng Trúc
    const c=cageAt();if(!c||Number(player.flags.rescue)>=1)return false;
    if(pt&&!(Math.abs(pt.x-c.x)<52&&pt.y>c.y-120&&pt.y<c.y+30))return false;
    if(Math.hypot(hero.x-c.x,hero.y-c.y)>110){if(!pt)return false;const p=World.findPath(hero,{x:c.x,y:c.y+44});if(p){route=p;targetNPC=null;cageWant=true;}return true;}
    if(cageBusy)return true;
    if(!((player.flags.kills||{})['hon-nguyen-ma-to']>0)){talkBox({id:'an-cage',name:'An',lines:['Bố ơi! Bố! Con ở đây!','Con quái to trong điện giữ chìa khóa lồng… Bố cẩn thận nhé, con chờ bố!']});return true;}
    cageBusy=true;op({t:'rescue'}).then(()=>{cageBusy=false;burst(c.x,c.y-40,'#ffe0a0',44,230);LH_Audio.play('levelup');shake(4);
      talkBox({id:'an-free',name:'An',lines:['Bố!!! Con biết thế nào bố cũng tới mà!','Con nhớ bố, nhớ nhà, nhớ cả làng Thanh Mộc nữa…','Bố ơi, mình về nhà đi!'],btn:'Về nhà thôi',onEnd:()=>message(svg('heart')+'Đưa An về làng Thanh Mộc · An sẽ đi theo bạn',6)});window.GameUI?.refresh();},
      err=>{cageBusy=false;message(svg('close')+'Chưa mở được lồng ('+esc(String(err&&err.message||err))+')',3);});
    return true;
  }
  function drawCage(o){
    const c=ctx,x=o.x,y=o.y,open=Number(player.flags.rescue)>=1;ell(c,x,y+4,36,9,'#00000055');
    if(!open){const kid={id:'con-gai-an',role:'con-gai-an',x,y:y-4,facing:Math.sin(time*.7)>0?1:-1,walk:0,moving:false,phase:0};drawNPC(kid);}
    c.save();c.strokeStyle='#d8b050';c.lineWidth=3;c.beginPath();c.ellipse(x,y-78,30,9,0,0,PI2);c.stroke();line(c,[x-30,y,x+30,y],'#8a6a30',5);
    const n=open?3:7;for(let k=0;k<n;k++){const bx=x-28+k*(open?28:9.3);line(c,[bx,y,bx,y-78],'#c8a040',3);}
    if(open){c.save();c.translate(x+30,y);c.rotate(.9);line(c,[0,0,0,-78],'#c8a040',3);c.restore();}
    line(c,[x,y-87,x,y-100],'#8a6a30',3);c.restore();
    if(!open&&Math.hypot(hero.x-x,hero.y-y)<260){ctx.font='700 22px system-ui';ctx.textAlign='center';ctx.lineWidth=3.5;ctx.strokeStyle='#3a102aee';const by=y-118+Math.sin(time*3)*2;ctx.strokeText('!',x,by);ctx.fillStyle='#ff5a8a';ctx.fillText('!',x,by);}
  }
  function drawHQ(){
    const D=World.def;if(D.kind==='battle'&&D.flag&&!hqDone('chien-truong')&&BT){const fx=(D.flag.x+.5)*T,fy=(D.flag.y+.6)*T,d=Math.hypot(hero.x-fx,hero.y-fy);
      if(d<300){ctx.save();ctx.globalAlpha=.35+Math.sin(time*4)*.15;ctx.strokeStyle='#ffd040';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(fx,fy+4,60,22,0,0,PI2);ctx.stroke();
        if(BT.hold>0){ctx.globalAlpha=.9;ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(fx,fy+4,60,22,-Math.PI/2,-Math.PI/2,-Math.PI/2+PI2*Math.min(1,BT.hold/(Number(CFG.chien_truong_doat_giay)||3)));ctx.stroke();}ctx.restore();}}
  }
  // con gái đi theo · dân làng chào tạm biệt
  const FW_LINES=['Bé An về rồi kìa cả làng ơi!','Chúc mừng hai cha con!','Đi đường bình an nhé!','Nhớ ghé làng chơi nha An!','Tạm biệt đại hiệp!','Hai cha con mạnh khỏe!','Ối zồi ôi, mừng quá!','Làng Thanh Mộc luôn chờ hai người!'];
  function fwTick(){
    if(!FW){if(World.id===World.DEFAULT&&Number(player.flags.rescue)===1&&AN&&AN.map===World.id&&!tut&&!dialogNPC&&!hero.dead&&safe){FW={t:time,k:0,ph:'cheer'};message(svg('heart')+'Cả làng Thanh Mộc ra đón hai cha con!',4);LH_Audio.play('rare');}return;}
    if(FW.ph==='cheer'){const who=[...World.npcs,...bots.filter(b=>!b.dead&&b.town)];if(who.length&&time>FW.t+FW.k*.75&&FW.k<Math.min(10,who.length+2)){const e=who[FW.k%who.length];if(!e.data)e.facing=hero.x<e.x?-1:1;tutSay(e,FW_LINES[FW.k%FW_LINES.length],3.2);FW.k++;}
      if(time>FW.t+6.5&&!dialogNPC){FW.ph='talk';const el=World.npcs.find(n=>n.id==='elder');if(el)el.facing=hero.x<el.x?-1:1;
        talkBox({id:'fw-elder',name:el?el.name:'Lý trưởng',lines:['Cả làng Thanh Mộc mừng cho đại hiệp đã tìm lại được bé An!','Từ cái ngày đại hiệp chỉ còn mảnh vải che thân tới giờ… làng này chứng kiến hết. Đường về nhà còn xa, hai cha con đi cẩn thận.','Làng Thanh Mộc lúc nào cũng mở cửa đón hai người. Tạm biệt!'],btn:'Tạm biệt cả làng',onEnd:()=>{FW.ph='bye';FW.t=time;tutSay(AN,'Con chào cả làng! Bố ơi, mình về nhà thôi!',4.5);
          op({t:'rescueHome'}).then(r=>{LH_Audio.play('levelup');message(svg('heart')+'<b>Hành trình Tìm con trọn vẹn</b> · hai cha con đã về nhà'+(r.rubies?' · +'+r.rubies+' hồng ngọc':''),9);window.GameUI?.refresh();},()=>{});}});}}
    else if(FW.ph==='bye'){if(time<FW.t+4&&Math.random()<.25)burst(hero.x+(Math.random()-.5)*400,hero.y-120-Math.random()*120,['#ffd040','#ff7aa0','#9fe8a8','#8fd0ff'][Math.floor(Math.random()*4)],22,200);
      if(time>FW.t+1.2&&!FW.waved){FW.waved=true;for(const n of World.npcs)tutSay(n,'Tạm biệt!',3);}}
  }
  /* ---------- v10.50: nhiệm vụ ẩn Vịt con ----------
     Hang động: trong Tổ đại bàng (ô 24,30) có một quả trứng. Hạ Đại Bàng Tinh rồi tới gần tổ thì trứng nở ra vịt con; lại gần vịt con, nó gọi "Chào Bố / Mẹ! Măm măm!" (theo giới tính nhân vật)
     và đi theo từ đó (op vitNhan, player.flags.vit=1). Núi tuyết: Thợ săn đổi vịt lấy vit_vang vàng (vitBan). Kinh thành Thăng Long: Nghệ nhân đèn đổi lấy Hổ trắng Tây Bắc (vitDoi).
     Chỉ xảy ra một lần: đã nhận vịt (flags.vit >= 1) thì tổ không còn trứng. */
  const vitNest=()=>{if(World.id!=='hang-dong')return null;const o=(World.def.objects||[]).find(o=>o.kind==='nest');return o?{x:(o.x+(o.w||1)/2)*T,y:(o.y+.7)*T}:{x:24.5*T,y:30.7*T};};
  const vitBo=()=>player.gender==='f'?'Mẹ':'Bố';
  const vitDone=()=>Number(player.flags.vit)>=1;
  function vitWants(n){return Number(player.flags.vit)===1&&((n.id==='tho-san'&&World.id==='nui-tuyet')||(n.id==='nghe-nhan'&&World.id==='thang-long'));}
  function vitTick(dt){
    // trứng / vịt con trong tổ
    if(!vitDone()&&World.id==='hang-dong'){const N=vitNest();if(N){
      if(!VIT||VIT.map!==World.id)VIT={kind:'vit-egg',map:World.id,x:N.x,y:N.y+6,ph:'egg',t:time};
      const d=Math.hypot(hero.x-N.x,hero.y-N.y),slain=((player.flags.kills||{})['dai-bang']||0)>0;
      if(VIT.ph==='egg'&&slain&&d<6*T&&!hero.dead){VIT.ph='crack';VIT.t=time;message(svg('spark')+'Quả trứng trong tổ đại bàng khẽ rung rinh…',3);}
      else if(VIT.ph==='crack'&&time>VIT.t+2.2){VIT.ph='duck';VIT.t=time;burst(N.x,N.y-14,'#fff3c0',26,150);LH_Audio.play('rare');
        VIT.duck={duckling:true,name:'Vịt con',x:N.x+4,y:N.y+4,facing:-1,walk:0,moving:false,map:World.id};tutSay(VIT.duck,'Chíp chíp!',2.4);}
      else if(VIT.ph==='duck'){const k=VIT.duck;k.facing=hero.x<k.x?-1:1;k.hop=Math.abs(Math.sin(time*5))*3;
        if(time>(VIT.chirp||0)){VIT.chirp=time+3.5+Math.random()*2;if(d>110)tutSay(k,['Chíp chíp!','Quạc?','Chíp!'][Math.floor(Math.random()*3)],1.8);}
        if(d<100&&!hero.dead&&!VIT.busy){VIT.busy=true;tutSay(k,`Chào ${vitBo()}! Măm măm!`,4);LH_Audio.play('pickup');
          op({t:'vitNhan'}).then(()=>{DUCK={...k,map:World.id};VIT=null;message(svg('heart')+`Vịt con nhận bạn làm ${vitBo().toLowerCase()} · từ giờ nó sẽ lẽo đẽo theo bạn`,6);window.GameUI?.refresh();},
            e=>{VIT.busy=false;VIT.chirp=time+5;message(svg('close')+'Vịt con chưa chịu đi theo ('+esc(String(e&&e.message||e))+')',3);});}}
    }}else if(VIT&&(vitDone()||World.id!=='hang-dong'))VIT=null;
    // vịt con đi theo
    if(Number(player.flags.vit)!==1){DUCK=null;return;}
    if(!DUCK||DUCK.map!==World.id)DUCK={duckling:true,name:'Vịt con',x:hero.x+hero.facing*-30,y:hero.y+22,facing:hero.facing,walk:0,moving:false,map:World.id};
    const off=AN&&AN.map===World.id?64:36,tx=hero.x-hero.facing*off,ty=hero.y+24,dx=tx-DUCK.x,dy=ty-DUCK.y,dd=Math.hypot(dx,dy);
    if(dd>650){DUCK.x=tx;DUCK.y=ty;DUCK.moving=false;}else if(dd>8){const sp=Math.min(dd,(dd>120?380:200)*dt);DUCK.x+=dx/dd*sp;DUCK.y+=dy/dd*sp;DUCK.moving=true;DUCK.walk+=sp*.25;DUCK.facing=dx<0?-1:1;}else{DUCK.moving=false;DUCK.facing=hero.facing;}
    if(time>(DUCK.chatAt||0)){DUCK.chatAt=time+35+Math.random()*40;if(Math.random()<.6)tutSay(DUCK,['Quạc quạc!','Măm măm!',`${vitBo()} ơi, đợi con với!`,`${vitBo()} giỏi quá!`,'Con đói rồi…','Chíp chíp!'][Math.floor(Math.random()*6)],2.8);}
  }
  // nói chuyện với Thợ săn (Núi tuyết) / Nghệ nhân đèn (Thăng Long) khi đang có vịt con
  function vitTalk(n){
    if(!vitWants(n))return false;n.facing=hero.x<n.x?-1:1;
    const hunter=n.id==='tho-san',bo=vitBo().toLowerCase();
    const lines=hunter?['Ồ! Đại hiệp dắt theo con vịt béo tốt thế kia à?','Mùa tuyết này săn được gì đâu… Con vịt ấy nướng lên thì thơm phải biết. Ta trả 30 vàng, đổi không?']
      :['Khoan đã! Con vịt lông vàng óng kia… chẳng phải giống vịt trời ở tổ đại bàng trong truyền thuyết sao?','Ta đang làm đèn kéo quân hình vịt dâng vua dịp Trung thu mà mãi chưa có con mẫu nào ưng ý.','Đổi cho ta con vịt ấy nhé. Ta sẽ tặng lại đại hiệp con Hổ trắng Tây Bắc ta nuôi từ bé, chạy nhanh như gió!'];
    lines[0]=lines[0].replace('30 vàng',(Number(CFG.vit_vang)||30)+' vàng');lines[1]=lines[1].replace('30 vàng',(Number(CFG.vit_vang)||30)+' vàng');
    talkBox({id:'vit-'+n.id,name:n.name,lines,choices:hunter?[`Đổi lấy ${Number(CFG.vit_vang)||30} vàng`,'Không, giữ lại vịt con']:['Đổi lấy Hổ trắng Tây Bắc','Không, giữ lại vịt con'],
      onChoice:i=>{
        if(i===1){if(DUCK)tutSay(DUCK,`Hihi, ${bo} thương con nhất!`,3);meetRest(n);return;}
        op({t:hunter?'vitBan':'vitDoi'}).then(r=>{
          if(DUCK){burst(DUCK.x,DUCK.y-14,'#fff3c0',18,140);tutSay(n,hunter?'Đa tạ! Tiền đây, cầm lấy.':'Tuyệt quá! Hổ trắng là của đại hiệp.',3);}
          DUCK=null;LH_Audio.play(hunter?'coin':'rare');
          if(hunter){if(r.copper)moneyFloat(hero.x,hero.y-96,r.copper);message(svg('coin')+`Đã đổi vịt con lấy ${Math.round((r.copper||0)/10000)} vàng`,5);}
          else message(svg('tiger')+'<b>Nhận Hổ trắng Tây Bắc</b> · đã cất vào túi đồ, mở túi để cưỡi',6);
          window.GameUI?.refresh();},
          e=>message(svg('close')+(e&&e.message==='BAG_FULL'?'Túi đồ đầy, dọn một ô rồi quay lại':'Chưa đổi được ('+esc(String(e&&e.message||e))+')'),4));}});
    return true;
  }
  // vịt con: thân tròn vàng, đầu to, mỏ cam, cánh nhỏ vẫy khi chạy
  function drawDuck(o){
    const c=ctx,s=.9,g=o.walk||0,mv=o.moving?1:0,hop=(o.hop||0)+(mv?Math.abs(Math.sin(g*.5))*3:0);c.save();ell(c,o.x,o.y+2,11,4,'#00000030');c.translate(o.x,o.y-hop);c.scale(o.facing*s,s);
    line(c,[-3,-4,-4+Math.sin(g*.5)*3*mv,0],'#e88a20',2);line(c,[3,-4,3-Math.sin(g*.5)*3*mv,0],'#e88a20',2);
    ell(c,-1,-11,11,9,'#f6d240');ell(c,-9,-14,4,3,'#f6d240');ell(c,-2,-9,7,4,'#ffe478');
    c.save();c.translate(-3,-13);c.rotate(-.3+Math.sin(time*(mv?14:3))*(mv?.5:.12));ell(c,0,0,6,3.5,'#e8bc28');c.restore();
    ell(c,6,-22,8,7.5,'#f8d848');ell(c,4,-25,3,2,'#fff0a0');ell(c,13,-20,4.5,2.2,'#f08c20');c.fillStyle='#2a1a10';c.beginPath();c.arc(8,-24,1.6,0,PI2);c.fill();c.fillStyle='#fff';c.fillRect(8.4,-24.8,.8,.8);
    line(c,[4,-29,6,-33],'#f6d240',1.6);line(c,[6,-29,9,-32],'#f6d240',1.4);c.restore();
  }
  // quả trứng trong tổ: rung khi sắp nở, vỏ nứt rồi tách đôi
  function drawEgg(o){
    if(o.ph==='duck'){const c=ctx;c.save();c.translate(o.x,o.y);ell(c,-16,-2,7,5,'#f4ecd8');ell(c,-16,-4,5,3,'#e8dcc0');ell(c,15,-1,6,4,'#f4ecd8');c.restore();if(o.duck)drawDuck(o.duck);return;}
    const c=ctx,sh=o.ph==='crack'?Math.sin(time*40)*Math.min(3,(time-o.t)*2):Math.sin(time*1.3)*.4;c.save();c.translate(o.x+sh,o.y);
    ell(c,0,-14,11,14,'#f6efdc');ell(c,-3,-19,4,5,'#fffaf0');for(const [px,py] of [[4,-10],[-5,-8],[2,-22],[6,-17]])ell(c,px,py,1.4,1.1,'#c8b890');
    if(o.ph==='crack'){c.strokeStyle='#6a5a40';c.lineWidth=1.3;c.beginPath();c.moveTo(-9,-15);c.lineTo(-5,-12);c.lineTo(-1,-16);c.lineTo(3,-12);c.lineTo(7,-16);c.lineTo(10,-13);c.stroke();}
    c.restore();
    if(o.ph==='egg'&&((player.flags.kills||{})['dai-bang']||0)>0&&Math.hypot(hero.x-o.x,hero.y-o.y)<420){ctx.font='700 18px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#3a2a06ee';const by=o.y-42+Math.sin(time*3)*2;ctx.strokeText('?',o.x,by);ctx.fillStyle='#ffe040';ctx.fillText('?',o.x,by);}
  }
  function anTick(dt){
    if(!(Number(player.flags.rescue)>=1)){AN=null;return;}
    if(!AN||AN.map!==World.id)AN={id:'con-gai-an',role:'con-gai-an',name:'An',x:hero.x-hero.facing*40,y:hero.y+8,facing:hero.facing,walk:0,moving:false,phase:0,map:World.id};
    const tx=hero.x-hero.facing*42,ty=hero.y+10,dx=tx-AN.x,dy=ty-AN.y,d=Math.hypot(dx,dy);
    if(d>650){AN.x=tx;AN.y=ty;AN.moving=false;}else if(d>10){const sp=Math.min(d,(d>140?360:210)*dt);AN.x+=dx/d*sp;AN.y+=dy/d*sp;AN.moving=true;AN.walk+=sp*.1;AN.facing=dx<0?-1:1;}else{AN.moving=false;AN.facing=hero.facing;}
    if(time>(AN.chatAt||0)){AN.chatAt=time+40+Math.random()*40;if(Math.random()<.5)tutSay(AN,['Bố ơi, đợi con với!','Bố giỏi quá!','Con không sợ nữa đâu!','Mình về nhà ăn cơm mẹ nấu nhé bố!'][Math.floor(Math.random()*4)],3);}
  }
  /* ---------- v10.39: việc Tìm con làm ngay trên bản đồ (LH_TC trong 07-tro-choi.js) ----------
     talk: hỏi chuyện vài NPC · find: điểm sáng (seq hiện lần lượt, back mang về NPC giao việc, t giây trước khi tan) · escort: NPC giao việc đi theo tới chỗ cắm cờ.
     Điểm được chọn tự động trên ô đi được (tìm từ chỗ đứng đầu bản đồ), cố định theo mã việc nên vào lại vẫn ở chỗ cũ. Xong → op sg. */
  const sqSpec=()=>{if(typeof LH_TC==='undefined')return null;for(const id of Object.keys(player.quests.active)){const Q=Player.QUESTS[id],S=LH_TC[id];if(Q&&Q.story&&S&&S.map===World.id&&/^game:/.test(Q.target)&&!Player.questReady(player,Q))return {Q,S};}return null;};
  const sqHash=(s,k)=>{let h=2166136261;for(const ch of s+'#'+k)h=Math.imul(h^ch.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
  function sqReach(sx,sy){const W=World.def.w,H=World.def.h,dist=new Map(),q=[[sx,sy]];dist.set(sy*W+sx,0);
    for(let i=0;i<q.length;i++){const [x,y]=q[i],d=dist.get(y*W+x);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*W+nx;if(nx<1||ny<1||nx>=W-1||ny>=H-1||dist.has(k)||World.blocked(nx,ny))continue;dist.set(k,d+1);q.push([nx,ny]);}}return dist;}
  function sqPoints(Q,S){
    const W=World.def.w,sx=Math.floor(World.spawn.x/T),sy=Math.floor(World.spawn.y/T),dist=sqReach(sx,sy),cand=[];
    for(const [k,d] of dist){const x=k%W,y=Math.floor(k/W);if(d<5||World.isSafe((x+.5)*T,(y+.5)*T)||World.blocked(x,y))continue;cand.push({x,y,d});}
    const pts=[];let prev={x:sx,y:sy};
    for(let i=0;i<S.n;i++){
      let best=null,bs=-1;for(const c of cand){if(pts.some(p=>Math.abs(p.tx-c.x)+Math.abs(p.ty-c.y)<6))continue;
        const dp=Math.abs(c.x-prev.x)+Math.abs(c.y-prev.y),ok=S.seq?(dp>=5&&dp<=10):(c.d>=8&&c.d<=30);if(!ok)continue;const v=sqHash(Q.id,i+':'+c.x+','+c.y);if(v>bs){bs=v;best=c;}}
      if(!best)best=cand.filter(c=>!pts.some(p=>p.tx===c.x&&p.ty===c.y))[Math.floor(sqHash(Q.id,i)*cand.length)]||cand[0];if(!best)break;
      pts.push({tx:best.x,ty:best.y,x:(best.x+.5)*T,y:(best.y+.6)*T,got:false,face:sqHash(Q.id,'f'+i)<.5?-1:1});prev=best;}
    return pts;
  }
  function sqStart(Q,S){
    const giver=World.npcs.find(n=>n.id===Q.npc);SQ={id:Q.id,map:World.id,Q,S,i:0,carry:null,busy:false,done:false,giver,talked:new Set(),fol:null,gone:[]};
    if(S.k==='find')SQ.pts=sqPoints(Q,S);
    if(S.k==='escort'&&giver){const gx=Math.floor(giver.x/T),gy=Math.floor(giver.y/T),dist=sqReach(gx,gy);let best=null,bs=-1;
      const inS=World.isSafe(giver.x,giver.y); // NPC đứng trong thành thì chỗ cắm cờ cũng trong thành (ngoài cổng hay có quân sự kiện)
      for(const [k,d] of dist){if(d<S.dist||d>S.dist+5)continue;const x=k%World.def.w,y=Math.floor(k/World.def.w);if(inS&&!World.isSafe((x+.5)*T,(y+.5)*T))continue;const v=sqHash(Q.id,x+','+y);if(v>bs){bs=v;best={x,y};}}
      SQ.flag=best?{x:(best.x+.5)*T,y:(best.y+.6)*T}:{x:giver.x+6*T,y:giver.y};}
    if(S.k!=='talk')message(svg('heart')+esc(S.hint),4);
  }
  function sqFinish(){if(SQ.busy||SQ.done)return;SQ.busy=true;const Q=SQ.Q;
    op({t:'sg',id:Q.id}).then(()=>{SQ.done=true;LH_Audio.play('quest');message(svg('check')+`Xong: ${esc(Q.name)} · về gặp ${esc(Q.npcName||Q.npc)} để trả việc`,6);window.GameUI?.refresh();},
      e=>{SQ.busy=false;message(svg('close')+'Chưa ghi được ('+esc(String(e&&e.message||e))+')',3);});}
  // hỏi chuyện: gặp NPC trong danh sách thì nghe lời kể của việc thay cho lời thường
  function sqTalk(n){
    if(!SQ||SQ.done||SQ.S.k!=='talk')return false;const L=SQ.S.who[n.id];if(!L||SQ.talked.has(n.id))return false;n.facing=hero.x<n.x?-1:1;
    talkBox({id:'sq-'+n.id,name:n.name,lines:L,onEnd:()=>{SQ.talked.add(n.id);const k=SQ.talked.size,N=Object.keys(SQ.S.who).length;if(k>=N)sqFinish();else message(svg('talk')+`Đã hỏi ${k}/${N} người`,3);}});return true;
  }
  function sqTick(dt){
    if(SQ&&(SQ.map!==World.id||player.quests.active[SQ.id]==null))SQ=null;
    if(!SQ){if(tut||((time*2)|0)===(((time-dt)*2)|0))return;const f=sqSpec();if(f)sqStart(f.Q,f.S);return;}
    if(SQ.done||hero.dead)return;const S=SQ.S;
    if(S.k==='find'){
      if(SQ.carry){const g=SQ.giver;if(S.t){const left=SQ.carry.until-time;if(left<=0){SQ.carry.got=false;SQ.carry=null;LH_Audio.play('enhanceFail');message(svg('close')+`${esc(S.label)} đã tan mất · lấy khối khác`,3);return;}
          if(((time*2)|0)!==(((time-dt)*2)|0))floater(hero.x,hero.y-96,Math.ceil(left)+' giây','#9fe0ff',13);}
        // v10.61: lạc đà đi theo sau nhân vật
        if(SQ.fol){const F=SQ.fol,tx=hero.x-hero.facing*58,ty=hero.y+4,dx=tx-F.x,dy=ty-F.y,d=Math.hypot(dx,dy);if(d>8){const sp=Math.min(d,Math.max(120,d*3)*dt);F.x+=dx/d*sp;F.y+=dy/d*sp;F.walk+=sp*.07;if(Math.abs(dx)>4)F.face=dx<0?-1:1;}}
        if(g&&Math.hypot(hero.x-g.x,hero.y-g.y)<80){SQ.carry.done=true;if(SQ.fol){SQ.gone.push({...SQ.fol,t0:time,tx:g.x+(SQ.fol.x<g.x?-30:30),ty:g.y+10});SQ.fol=null;}SQ.carry=null;burst(g.x,g.y-30,S.col,18,160);LH_Audio.play('pickup');const k=SQ.pts.filter(p=>p.done).length;
          if(k>=SQ.pts.length)sqFinish();else message(svg('check')+`Đã mang về ${k}/${SQ.pts.length}`,3);}
        return;}
      for(let i=0;i<SQ.pts.length;i++){const p=SQ.pts[i];if(p.got)continue;if(S.seq&&i!==SQ.i)continue;
        if(Math.hypot(hero.x-p.x,hero.y-p.y)<46){p.got=true;SQ.i=i+1;burst(p.x,p.y-10,S.col,20,170);LH_Audio.play('pickup');const say=(S.say||[])[i];
          if(S.back){SQ.carry=p;if(S.t)p.until=time+S.t;if(S.obj==='camel')SQ.fol={x:p.x,y:p.y,walk:0,face:p.face||1};message(svg('heart')+(say?esc(say):esc(S.label))+(S.t?` · còn ${S.t} giây`:''),4);}
          else{const k=SQ.pts.filter(q=>q.got).length;if(k>=SQ.pts.length)sqFinish();else message(svg('pin')+`${esc(S.label)} ${k}/${SQ.pts.length}`+(say?' · '+esc(say):''),4);}
          break;}}
    }else if(S.k==='escort'&&SQ.giver){
      const n=SQ.giver,F=SQ.flag;if(dialogNPC===n)return;
      const tx=hero.x-hero.facing*46,ty=hero.y+8,dx=tx-n.x,dy=ty-n.y,d=Math.hypot(dx,dy);
      if(d>24&&d<9*T){const sp=Math.min(d,(S.spd||95)*dt);n.x+=dx/d*sp;n.y+=dy/d*sp;n.moving=true;n.walk+=sp*.09;n.facing=dx<0?-1:1;}
      else if(d>=9*T&&time>(SQ.warn||0)){SQ.warn=time+4;tutSay(n,'Con ơi, đợi bà với!',2.5);}
      if(Math.hypot(n.x-F.x,n.y-F.y)<60){n.moving=false;tutSay(n,S.say||'Cảm ơn con!',4);burst(F.x,F.y-30,'#ffd27a',22,180);sqFinish();}
    }
  }
  // v10.61: hình vẽ vật cần tìm của các việc 'find' (thay chấm sáng): lạc đà, khối băng, hình vẽ than, dấu chân, sợi chỉ đỏ
  function sqObj(kind,x,y,o={}){
    const c=ctx;c.save();c.globalAlpha=o.alpha==null?1:Math.max(0,o.alpha);c.translate(x,y);if(o.scale)c.scale(o.scale,o.scale);
    if(kind==='camel'){const f=o.face||1,w=o.walk||0,bob=o.idle?Math.sin(time*1.6)*1.2:Math.abs(Math.sin(w))*1.5;
      c.fillStyle='#0004';c.beginPath();c.ellipse(0,2,34,8,0,0,PI2);c.fill();c.scale(f,1);
      const leg=(lx,ph,col)=>{const a=o.idle?0:Math.sin(w+ph)*.45;c.save();c.translate(lx,-30);c.rotate(a);c.strokeStyle=col;c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(0,15);c.stroke();c.translate(0,15);c.rotate(-a*.6);c.beginPath();c.moveTo(0,0);c.lineTo(0,14);c.stroke();c.fillStyle='#6a4a28';c.beginPath();c.ellipse(1,15,3.6,2,0,0,PI2);c.fill();c.restore();};
      leg(-16,Math.PI,'#a77c45');leg(14,0,'#a77c45');c.translate(0,-bob);
      c.strokeStyle='#8a6232';c.lineWidth=2.5;c.beginPath();c.moveTo(-26,-40);c.quadraticCurveTo(-34,-34,-31,-24);c.stroke(); // đuôi
      c.fillStyle='#c99a5b';c.beginPath();c.ellipse(0,-40,27,13,0,0,PI2);c.fill(); // thân
      c.beginPath();c.ellipse(-3,-50,14,13,0,Math.PI,0);c.fill(); // bướu
      c.fillStyle='#b03a2a';c.beginPath();c.moveTo(-15,-49);c.quadraticCurveTo(-3,-58,9,-49);c.lineTo(11,-41);c.lineTo(-17,-41);c.closePath();c.fill(); // chăn yên đoàn buôn
      c.fillStyle='#e8c060';for(let k=-12;k<=8;k+=6)c.fillRect(k,-42,3,3);
      c.fillStyle='#c99a5b';c.beginPath();c.moveTo(18,-46);c.quadraticCurveTo(30,-50,31,-66);c.lineTo(38,-66);c.quadraticCurveTo(36,-48,24,-34);c.closePath();c.fill(); // cổ
      const hb=o.idle?Math.sin(time*1.1)*2:0;c.beginPath();c.ellipse(38,-67+hb,10,6.5,.15,0,PI2);c.fill(); // đầu
      c.fillStyle='#a77c45';c.beginPath();c.ellipse(46,-64+hb,4.5,3.6,0,0,PI2);c.fill();c.beginPath();c.ellipse(33,-73+hb,2.4,4,-.4,0,PI2);c.fill();
      c.fillStyle='#2a1a10';c.beginPath();c.arc(39,-69+hb,1.5,0,PI2);c.fill();
      leg(-10,0,'#c99a5b');leg(20,Math.PI,'#c99a5b');}
    else if(kind==='ice'){const fl=o.float?Math.sin(time*3)*2:0;c.translate(0,fl);
      c.fillStyle='#0003';c.beginPath();c.ellipse(0,2,16,5,0,0,PI2);c.fill();
      c.fillStyle='#bfeaff';c.beginPath();c.moveTo(-14,-6);c.lineTo(0,-1);c.lineTo(14,-6);c.lineTo(14,-24);c.lineTo(0,-29);c.lineTo(-14,-24);c.closePath();c.fill();
      c.fillStyle='#e8f8ff';c.beginPath();c.moveTo(-14,-24);c.lineTo(0,-19);c.lineTo(14,-24);c.lineTo(0,-29);c.closePath();c.fill();
      c.fillStyle='#8fcbe8';c.beginPath();c.moveTo(0,-19);c.lineTo(14,-24);c.lineTo(14,-6);c.lineTo(0,-1);c.closePath();c.fill();
      c.strokeStyle='#ffffffcc';c.lineWidth=1.5;c.beginPath();c.moveTo(-9,-20);c.lineTo(-9,-10);c.moveTo(5,-24);c.lineTo(9,-25.5);c.stroke();
      if(Math.sin(time*5)>.6){c.fillStyle='#fff';c.beginPath();c.arc(-6,-25,1.6,0,PI2);c.fill();}
      if(o.float){c.fillStyle='#9fe0ff';for(let k=0;k<2;k++){const t=(time*1.5+k*.5)%1;c.globalAlpha*=1;c.beginPath();c.arc(-6+k*10,-1+t*14,1.6*(1-t),0,PI2);c.fill();}}}
    else if(kind==='drawing'){ // phiến đá có hình vẽ than
      c.fillStyle='#0004';c.beginPath();c.ellipse(0,2,26,6,0,0,PI2);c.fill();
      c.fillStyle='#8d877c';c.beginPath();c.moveTo(-26,0);c.lineTo(-23,-34);c.lineTo(-6,-40);c.lineTo(20,-37);c.lineTo(27,-6);c.lineTo(20,0);c.closePath();c.fill();
      c.fillStyle='#a8a296';c.beginPath();c.moveTo(-20,-4);c.lineTo(-18,-31);c.lineTo(-5,-35);c.lineTo(17,-32);c.lineTo(22,-8);c.closePath();c.fill();
      c.strokeStyle='#2a2622';c.lineWidth=1.6;c.lineCap='round';c.lineJoin='round';c.beginPath();const i=o.i||0;
      if(i===0){c.arc(0,-18,6,0,PI2);c.moveTo(-5,-22);c.lineTo(-4,-28);c.lineTo(-1,-23);c.moveTo(5,-22);c.lineTo(4,-28);c.lineTo(1,-23);c.moveTo(6,-14);c.quadraticCurveTo(14,-12,12,-22);}
      else if(i===1){c.moveTo(-14,-10);c.lineTo(-14,-22);c.lineTo(-7,-29);c.lineTo(0,-22);c.lineTo(0,-10);c.closePath();for(const px of [5,10,15]){c.moveTo(px+2,-21);c.arc(px,-21,2,0,PI2);c.moveTo(px,-19);c.lineTo(px,-13);c.moveTo(px-2,-10);c.lineTo(px,-13);c.lineTo(px+2,-10);}c.moveTo(7,-17);c.lineTo(13,-17);}
      else{c.arc(-10,-24,4,0,PI2);for(let k=0;k<8;k++){const a=k*Math.PI/4;c.moveTo(-10+Math.cos(a)*6,-24+Math.sin(a)*6);c.lineTo(-10+Math.cos(a)*8,-24+Math.sin(a)*8);}
        c.moveTo(0,-13);c.quadraticCurveTo(6,-22,12,-14);c.moveTo(1,-13);c.lineTo(1,-8);c.moveTo(11,-13);c.lineTo(11,-8);c.moveTo(12,-15);c.lineTo(15,-21);c.lineTo(17,-20);}
      c.stroke();}
    else if(kind==='foot'){ // dấu chân trẻ con, mũi chân chỉ hướng đi tiếp
      c.rotate((o.ang||0)+Math.PI/2);c.fillStyle='#5c7c9c';c.globalAlpha*=.85;
      const fp=(dx,dy)=>{c.beginPath();c.ellipse(dx,dy,3.4,6,0,0,PI2);c.fill();for(let k=-1;k<=1;k++){c.beginPath();c.arc(dx+k*2.4,dy-8,1.3,0,PI2);c.fill();}};
      fp(-5,4);fp(5,-8);}
    else if(kind==='thread'){ // khe nứt có sợi chỉ đỏ buộc
      c.strokeStyle='#1a1018';c.lineWidth=3;c.beginPath();c.moveTo(-22,2);c.lineTo(-10,-3);c.lineTo(-4,3);c.lineTo(8,-2);c.lineTo(20,3);c.stroke();
      c.strokeStyle='#d8344a';c.lineWidth=2.2;c.lineCap='round';const wv=Math.sin(time*4)*3;
      c.beginPath();c.moveTo(-4,0);c.lineTo(-4,-14);c.stroke();c.beginPath();c.ellipse(-8,-15,4,2.6,0,0,PI2);c.ellipse(0,-15,4,2.6,0,0,PI2);c.stroke();
      c.beginPath();c.moveTo(-4,-15);c.quadraticCurveTo(4,-8+wv,12,-12+wv);c.moveTo(-4,-15);c.quadraticCurveTo(-10,-6-wv,-16,-9-wv);c.stroke();}
    c.restore();
  }
  function lab(x,y,t,col){if(!t||Math.hypot(hero.x-x,hero.y-y)>=320)return;const c=ctx;c.save();c.font='600 12px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#0a120ecc';c.strokeText(t,x,y);c.fillStyle=col;c.fillText(t,x,y);c.restore();}
  function drawSQ(){
    if(!SQ)return;if(SQ.done){if(SQ.gone&&SQ.gone.length){SQ.gone=SQ.gone.filter(G=>time-G.t0<1.6);for(const G of SQ.gone){const k=Math.min(1,(time-G.t0)/1.6);sqObj('camel',G.x+(G.tx-G.x)*Math.min(1,k*1.4),G.y+(G.ty-G.y)*Math.min(1,k*1.4),{face:G.tx<G.x?-1:1,walk:G.walk+k*8,alpha:1-k});}}return;}const S=SQ.S,c=ctx;
    const glow=(x,y,col,lab,sc)=>{if(sc){c.save();c.globalAlpha=.3;c.fillStyle=col;c.beginPath();c.ellipse(x,y,(22+Math.sin(time*4)*4)*sc*1.6,(8+Math.sin(time*4)*1.5)*sc*1.6,0,0,PI2);c.fill();c.restore();return;}const r=14+Math.sin(time*4)*3;c.save();c.globalAlpha=.35;c.fillStyle=col;c.beginPath();c.ellipse(x,y,r*1.8,r*.7,0,0,PI2);c.fill();c.globalAlpha=.9;c.shadowColor=col;c.shadowBlur=14;c.beginPath();c.arc(x,y-14+Math.sin(time*3)*3,6,0,PI2);c.fill();c.restore();
      if(lab&&Math.hypot(hero.x-x,hero.y-y)<320){c.font='600 12px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#0a120ecc';c.strokeText(lab,x,y-30);c.fillStyle=col;c.fillText(lab,x,y-30);}};
    if(S.k==='find'){
      // lạc đà đã trả: đi lại gần Trưởng đoàn buôn rồi mờ dần
      SQ.gone=SQ.gone.filter(G=>time-G.t0<1.6);for(const G of SQ.gone){const k=Math.min(1,(time-G.t0)/1.6),x=G.x+(G.tx-G.x)*Math.min(1,k*1.4),y=G.y+(G.ty-G.y)*Math.min(1,k*1.4);sqObj('camel',x,y,{face:G.tx<G.x?-1:1,walk:G.walk+k*8,alpha:1-k});}
      if(SQ.carry){const g=SQ.giver;if(g&&!SQ.done)glow(g.x,g.y+4,S.col,'Mang về đây');
        if(SQ.fol)sqObj('camel',SQ.fol.x,SQ.fol.y,{face:SQ.fol.face,walk:SQ.fol.walk});
        else if(S.obj==='ice'){const k=S.t?Math.max(.35,(SQ.carry.until-time)/S.t):1;sqObj('ice',hero.x+hero.facing*30,hero.y-8,{scale:1.05*k,float:1});}
        return;}
      SQ.pts.forEach((p,i)=>{if(p.got||(S.seq&&i!==SQ.i))return;const nx=SQ.pts[i+1];
        if(S.obj){glow(p.x,p.y,S.col,'',.5);sqObj(S.obj,p.x,p.y,{face:p.face,i,ang:nx?Math.atan2(nx.y-p.y,nx.x-p.x):(p.face<0?Math.PI:0),idle:1,scale:({foot:1.7,ice:1.3,thread:1.3,drawing:1.15})[S.obj]||0});lab(p.x,p.y-(S.obj==='camel'?84:S.obj==='drawing'?50:34),S.label,S.col);}
        else glow(p.x,p.y,S.col,S.label);});}
    else if(S.k==='escort'&&SQ.flag){const F=SQ.flag;glow(F.x,F.y,'#ffd27a','Bên kia đường');line(c,[F.x,F.y,F.x,F.y-60],'#6a4a2a',3);c.fillStyle='#d03030';c.beginPath();c.moveTo(F.x,F.y-60);c.lineTo(F.x+26,F.y-52);c.lineTo(F.x,F.y-44);c.fill();}
  }
  /* ---------- v10.65: hiệu ứng đặc biệt của trùm + quái gọi thêm (m.add: không rơi đồ, không gửi máy chủ) ----------
     Mộc Tinh (Rừng Trúc): máu còn 10% thì mọc 5 Hoa Mộc quanh mình, hoa bắn hạt vào người chơi và truyền máu cho Mộc Tinh (mỗi hoa 1% máu / giây).
       Hạ hết hoa thì hết hồi máu; sát thương đủ lớn vẫn hạ được Mộc Tinh khi hoa còn sống.
     Xà Tinh (Đầm Lầy): bị hạ thì hồi sinh, tối đa 3 lần (30% · 20% · 10% máu), mỗi lần một câu thoại (LH_THOAI['xa-tinh'].hoi).
     Tôn Ngộ Không: nhiệm vụ ẩn Núi tuyết (ô 12,28) → trùm phụ Rừng Trúc cùng bầy khỉ con; hạ hết khỉ con thì phân thân. */
  const BLOOM={'moc-tinh':{n:5,at:.1,heal:.01}},XA_REV={'xa-tinh':[.3,.2,.1]};
  // giữ lượt thoại của trùm để câu đặc biệt không bị câu chào đè (bossTalk)
  function talkHold(m,sec){const k=m.tk||(m.tk={on:false,i:0,next:0,last:-1,sap:false,off:0});k.on=true;k.off=0;k.next=time+(sec||4);}
  function addType(id,o){MON[id]=Object.assign(MON[id]||{},{def:0,speed:0,run:0,r:18,h:50,aggro:300,range:60,cd:1.5,windup:.4,copper:0,knock:0,boss:0,respawn:1e9,drops:{g:0,p:0,l:0,m:0},rubies:[0,0],dtype:'thuong',crit:5,exp:0,skills:[],tac:[]},o);delete MON[id].lv;return MON[id];}
  function mkMon(type,x,y,o){const M=MON[type];return Object.assign({id:9700+monsters.length,type,hx:x,hy:y,x,y,hp:M.hp,max:M.hp,dead:false,deadAt:0,respawn:1e18,facing:-1,walk:0,moving:false,hurt:-9,aggro:-9,atk:null,cd:0,flee:0,wander:null,stunUntil:0,burn:null,burnAcc:0,leapCd:0,leap:null},o||{});}
  function spotNear(x,y,r){for(let k=0;k<10;k++){const a=Math.random()*PI2,rr=r*(.55+Math.random()*.45),px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.8;if(World.canStand(px,py,14)&&!World.isSafe(px,py))return {x:px,y:py};}return {x:x+(Math.random()-.5)*30,y:y+(Math.random()-.5)*20};}
  // quái gọi thêm gục: không rơi túi, không tính lệnh kill
  function addDown(m,owner){
    const M=MON[m.type];m.dead=true;m.deadAt=time;m.respawn=1e18;m.atk=null;m.burn=null;m.leap=null;m.cast=null;
    if(m.flower){burst(m.x,m.y-50,'#ff7ab8',22,170);burst(m.x,m.y-20,'#6ac040',10,110);}
    else if(m.clone){burst(m.x,m.y-40,'#f0e8d8',30,180);floater(m.x,m.y-M.h-20,'Chỉ là sợi lông khỉ!','#ffe0a0',14);}
    else burst(m.x,m.y-M.h*.4,'#e9dcb4',14);
    LH_Audio.play('kill');if(m.onDown)m.onDown(m,owner);
  }
  /* Mộc Tinh: Hoa Mộc */
  function bloomCheck(m){
    const B=BLOOM[m.type];if(!B||m.bloom||m.dead||m.ev||m.hp>m.max*B.at)return;
    const M=MON[m.type],FM=addType('hoa-moc',{name:'Hoa Mộc',hp:Math.max(1,Math.round(M.hp*.08)),dmg:Math.max(1,Math.round(M.dmg*.35)),r:18,h:62,aggro:460,cd:1.7,crit:5,map:M.map,def:M.def||0});
    m.bloom=[];m.bloomGone=false;
    for(let i=0;i<B.n;i++){const a=i/B.n*PI2+Math.random()*.4;let p=null;for(const rr of [140,115,95,170]){const px=m.x+Math.cos(a)*rr,py=m.y+Math.sin(a)*rr*.75;if(World.canStand(px,py,14)){p={x:px,y:py};break;}}if(!p)p=spotNear(m.x,m.y,130);
      const f=mkMon('hoa-moc',p.x,p.y,{add:true,flower:true,owner:m,aggro:time+30,born:time,cd:time+1+i*.3,facing:p.x<m.x?1:-1,onDown:flowerDown});monsters.push(f);m.bloom.push(f);
      burst(p.x,p.y-10,'#6ac040',18,150);fx.push({kind:'ring',x:p.x,y:p.y,r0:6,r1:46,color:'#90e070',age:0,life:.5,lw:3});}
    talkHold(m);bossLine(m,'hoa',3.8);shake(5);LH_Audio.play('boss');
    message(svg('eye')+`<b>${esc(M.name)}</b> gọi ${B.n} Hoa Mộc · hoa bắn hạt và truyền máu cho trùm<br><small>Hạ hết hoa để chặn hồi máu · hoặc dồn sát thương thật lớn</small>`,6);
    void FM;
  }
  function flowerDown(f){
    const m=f.owner;if(!m||m.dead||!m.bloom||m.bloomGone)return;
    if(m.bloom.every(o=>o.dead)){m.bloomGone=true;talkHold(m);bossLine(m,'hoa_het',3.4);const c=center(m);floater(c.x,c.y-MON[m.type].h*.5-30,'Hết hồi máu!','#ffd0a0',16);message(svg('check')+'Đã hạ hết Hoa Mộc · '+esc(MON[m.type].name)+' hết hồi máu',4);}
  }
  function flowerAI(f,M,dt){
    const m=f.owner,B=m&&BLOOM[m.type];
    if(!m||m.dead||!m.bloom||!m.bloom.includes(f)){f.hp=0;addDown(f,'');return;} // trùm gục / hồi sinh lại: hoa héo
    f.moving=false;
    if(time<f.stunUntil||time<f.frozenUntil)return;
    // truyền máu cho trùm
    if(m.hp<m.max){const v=m.max*B.heal*dt;m.hp=Math.min(m.max,m.hp+v);m.bloomHeal=(m.bloomHeal||0)+v;}
    if(time>(m.bloomShow||0)&&m.bloomHeal>=1){m.bloomShow=time+1;const c=center(m);floater(c.x+(Math.random()-.5)*20,c.y-MON[m.type].h*.5-8,'+'+Math.round(m.bloomHeal),'#90f070',13);m.bloomHeal=0;}
    // bắn hạt vào mục tiêu gần nhất
    const tg=pickTarget(f);if(!tg||tg.d>M.aggro)return;f.facing=tg.x<f.x?-1:1;
    if(time>f.cd){f.cd=time+M.cd*(.85+Math.random()*.3);f.shotAt=time;const ox=f.x+f.facing*4,oy=f.y-56,ty=tg.y-24,a=Math.atan2(ty-oy,tg.x-ox),sp=290;
      eshots.push({x:ox,y:oy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,age:0,life:Math.min(2.4,(M.aggro+80)/sp),dmg:M.dmg,src:f,col:'#ff7ab8'});LH_Audio.play('bow');}
  }
  // đạn của quái (hạt hoa): trúng người chơi, lính, người chơi ảo
  const eshots=[];
  function updateEshots(dt){
    for(let i=eshots.length-1;i>=0;i--){const s=eshots[i];s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;let hit=s.age>s.life;
      if(!hit&&!hero.dead&&Math.hypot(hero.x-s.x,hero.y-24-s.y)<20){hurtHero(s.dmg,s.src);hit=true;}
      if(!hit)for(const e of allies)if(e.hp>0&&Math.hypot(e.x-s.x,e.y-24-s.y)<20){hurtAlly(e,s.dmg);hit=true;break;}
      if(!hit)for(const e of bots)if(!e.dead&&Math.hypot(e.x-s.x,e.y-24-s.y)<20){hurtBot(e,s.dmg);hit=true;break;}
      if(hit){burst(s.x,s.y,s.col,8,90);eshots.splice(i,1);}}
  }
  function drawAdds(){
    // dây truyền máu từ hoa tới trùm
    for(const f of monsters){if(!f.flower||f.dead||!f.owner||f.owner.dead)continue;const c=center(f.owner),x0=f.x,y0=f.y-56,ph=(time*1.4+f.id*.37)%1;
      ctx.save();ctx.globalAlpha=.55+Math.sin(time*6+f.id)*.15;ctx.strokeStyle='#8af070';ctx.lineWidth=2.4;ctx.shadowColor='#b0ff80';ctx.shadowBlur=10;ctx.setLineDash([7,6]);ctx.lineDashOffset=-time*40;
      const mx=(x0+c.x)/2,my=Math.min(y0,c.y)-40;ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(mx,my,c.x,c.y);ctx.stroke();ctx.setLineDash([]);
      const u=ph,px=(1-u)*(1-u)*x0+2*(1-u)*u*mx+u*u*c.x,py=(1-u)*(1-u)*y0+2*(1-u)*u*my+u*u*c.y;ctx.globalAlpha=1;ctx.fillStyle='#e8ffd0';ctx.beginPath();ctx.arc(px,py,3.2,0,PI2);ctx.fill();ctx.restore();}
    for(const s of eshots){ctx.save();ctx.shadowColor=s.col;ctx.shadowBlur=12;ctx.fillStyle=s.col;ctx.globalAlpha=.4;ctx.beginPath();ctx.arc(s.x-s.vx*.03,s.y-s.vy*.03,4,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(s.x,s.y,5.5,0,PI2);ctx.fill();ctx.fillStyle='#fff6c0';ctx.beginPath();ctx.arc(s.x-1,s.y-1,2.2,0,PI2);ctx.fill();ctx.restore();}
  }
  // Hoa Mộc: gốc rễ, thân uốn, hai lá, đóa hoa hồng có miệng nhả hạt (há ra khi bắn)
  function drawFlower(c,m,M,st){
    const K=LH_BOSS.kit,t=st.t,fl=st.fl,f=v=>fl?'#fff3e6':v,sw=Math.sin(t*2+m.id)*3,op=Math.max(0,1-(t-(m.shotAt??-9))/.35),grow=Math.min(1,(t-(m.born??-9))/.6);
    c.save();c.scale(1,grow);
    K.E(c,0,-2,15,4.5,f('#3e2a18'));for(const d of [-1,1])K.S(c,[d*4,-2,d*12,2,d*19,0],f('#4a3220'),3);
    K.S(c,[0,-2,-3+sw*.3,-20,2+sw*.6,-36,sw,-50],f('#3f7a2a'),5);
    c.save();c.translate(-1+sw*.3,-18);c.rotate(-.7+Math.sin(t*2.4)*.1);K.E(c,-9,0,11,4.5,f('#5aa83a'));K.L(c,[-18,0,-2,0],f('#3f7a2a'),1);c.restore();
    c.save();c.translate(1+sw*.5,-30);c.rotate(.6-Math.sin(t*2.1)*.1);K.E(c,9,0,10,4,f('#4a9a30'));K.L(c,[2,0,17,0],f('#3f7a2a'),1);c.restore();
    c.save();c.translate(sw,-56);const R=13+op*3;K.glow(c,'#ff7ab8',8+op*12);
    for(let i=0;i<7;i++){c.save();c.rotate(i/7*PI2+t*.4);K.E(c,R*.78,0,R*.62,R*.36,f(i%2?'#ff5a9a':'#ff8ac0'));c.restore();}
    K.noGlow(c);K.E(c,0,0,R*.5,R*.5,f('#ffd84a'));K.E(c,0,1,R*.26,R*.1+op*R*.22,'#7a2a10');
    c.restore();c.restore();
  }
  /* Xà Tinh: hồi sinh 3 lần */
  function xaRevive(m){
    const M=MON[m.type],P=XA_REV[m.type],k=m.rev=(m.rev||0)+1,L=(typeof LH_THOAI!=='undefined'&&LH_THOAI[m.type]&&LH_THOAI[m.type].hoi)||[];
    m.hp=Math.max(1,Math.round(m.max*(P[k-1]||.1)));m.atk=null;m.leap=null;m.cast=null;m.burn=null;m.reviveUntil=time+1.4;m.stunUntil=time+1.4;m.aggro=time+10;
    const c=center(m);burst(c.x,c.y,'#80e060',44,240);burst(m.x,m.y-6,'#2a4a2a',20,140);fx.push({kind:'ring',x:m.x,y:m.y,r0:10,r1:150,color:'#90f070',age:0,life:.7,lw:6});shake(7);LH_Audio.play('boss');
    floater(c.x,c.y-M.h*.5-34,'Hồi sinh '+k+'/'+P.length,'#a0ff80',18);
    if(L[k-1]){talkHold(m,3.8);bossSpeak(m,L[k-1],3.2);}
    message(svg('eye')+`<b>${esc(M.name)}</b> hồi sinh với ${Math.round((P[k-1]||.1)*100)}% máu · ${k<P.length?'còn '+(P.length-k)+' lần nữa':'đây là lần cuối'}`,4);
  }
  /* ---------- Tôn Ngộ Không ---------- */
  const WK_AT={map:'nui-tuyet',x:12,y:28};
  let WK=null,WKB=null;
  const wkFlag=()=>Number(player.flags.wk)||0;
  const wkNgu=()=>player.gender==='f'?'con':'thằng';
  function wkTypes(){
    const B=MON['moc-tinh']||MON['khi-rung'],K0=MON['khi-rung']||B;
    addType('ngo-khong',{name:'Tôn Ngộ Không',hp:Math.round(B.hp*1.4),dmg:Math.round(B.dmg*.9),speed:90,run:200,r:26,h:92,aggro:320,range:96,cd:1.3,windup:.45,knock:.08,boss:1,dtype:'hoan_hao',crit:15,map:'rung-truc',def:B.def||0,skills:['stun']});
    addType('ngo-khong-ao',{name:'Tôn Ngộ Không',hp:Math.round(B.hp*.16),dmg:Math.round(B.dmg*.45),speed:90,run:210,r:26,h:92,aggro:360,range:96,cd:1.5,windup:.45,knock:.1,boss:1,dtype:'thuong',crit:5,map:'rung-truc',def:0});
    addType('khi-con',{name:'Khỉ con',hp:Math.round(K0.hp*.55),dmg:Math.round(K0.dmg*.6),speed:85,run:215,r:16,h:38,aggro:300,range:50,cd:1.1,windup:.35,knock:.4,crit:8,map:'rung-truc',def:K0.def||0});
  }
  function wkTick(dt){
    // Núi tuyết: núi đè, lá bùa
    if(World.id===WK_AT.map){
      if(!WK||WK.map!==World.id){const o=World.canStand((WK_AT.x+.5)*T,(WK_AT.y+.5)*T)?{x:WK_AT.x,y:WK_AT.y}:(World.nearestOpen(WK_AT.x,WK_AT.y)||WK_AT);WK={map:World.id,x:(o.x+.5)*T,y:(o.y+.5)*T,ph:wkFlag()?'gone':'trap',t:time,near:false};WK.bub={name:'Tôn Ngộ Không',x:WK.x+34,y:WK.y,sayH:88};}
      const tx=WK.x+34,ty=WK.y+8,d=Math.hypot(hero.x-tx,hero.y-ty);
      if(WK.ph==='trap'){
        if(d<420&&d>150&&time>(WK.callAt||0)&&!dialogNPC){WK.callAt=time+7+Math.random()*4;tutSay(WK.bub,['Ê! Ê! Bên này!','Người qua đường ơi! Cứu lão Tôn với!','Này! Lại đây lão Tôn bảo!','Ngứa mũi quá… ai gãi hộ với…'][Math.floor(Math.random()*4)],2.6);}
        if(d<110&&!WK.near&&!dialogNPC&&!hero.dead&&!busy()){WK.near=true;wkTalk();}else if(d>200)WK.near=false;
      }else if(WK.ph==='crack'&&time>WK.t+1.3){WK.ph='out';WK.t=time;burst(WK.x,WK.y-60,'#c8c0b0',60,300);burst(WK.x+30,WK.y-20,'#ffe080',30,220);shake(10);LH_Audio.play('boss');
        WK.mx=WK.x+70;WK.my=WK.y+26;WK.bub.sayH=118;tutSay(WK.bub,'Bố '+wkNgu()+' ngu! Bye bye!',3.4);}
      else if(WK.ph==='out'&&time>WK.t+2.6){WK.ph='fly';WK.t=time;LH_Audio.play('rare');}
      else if(WK.ph==='fly'&&time>WK.t+1.8){WK.ph='gone';message(svg('eye')+'Tôn Ngộ Không cưỡi cân đẩu vân bay mất… nghe đồn hắn kéo một bầy khỉ về Rừng Trúc',6);}
    }else if(WK&&WK.map!==World.id)WK=null;
    // Rừng Trúc: trùm phụ + bầy khỉ con
    if(World.id==='rung-truc'&&wkFlag()===1&&!tut){
      if(!WKB||!monsters.includes(WKB))wkSpawn();
      else if(!WKB.dead&&!WKB.split&&WKB.kids.every(k=>k.dead)&&WKB.aggro>time)wkSplit(WKB);
    }else if(WKB&&!monsters.includes(WKB))WKB=null;
  }
  function wkSpawn(){
    wkTypes();const cp=(World.def.camps||[]).find(c=>c.mon&&c.mon['khi-rung'])||(World.def.camps||[])[0];
    let o=cp?{x:(cp.x+.5)*T,y:(cp.y+.5)*T}:{x:World.spawn.x+600,y:World.spawn.y};if(!World.canStand(o.x,o.y,14)){const n=World.nearestOpen(Math.floor(o.x/T),Math.floor(o.y/T));if(n)o={x:(n.x+.5)*T,y:(n.y+.5)*T};}
    const b=mkMon('ngo-khong',o.x,o.y,{wk:true,kids:[],split:false});monsters.push(b);WKB=b;
    for(let i=0;i<6;i++){const p=spotNear(o.x,o.y,110),k=mkMon('khi-con',p.x,p.y,{add:true,art:'khi-rung',sc:.72,owner:b});monsters.push(k);b.kids.push(k);}
    World.monPack&&World.monPack('khi-rung');
  }
  // hạ hết khỉ con: phân thân — ba bản sao, xếp lẫn với con thật
  function wkSplit(b){
    b.split=true;wkTypes();talkHold(b);bossLine(b,'phan',3.6);const n=3,cx=b.x,cy=b.y,a0=Math.random()*PI2,pos=[];
    for(let i=0;i<=n;i++){const a=a0+i/(n+1)*PI2;let p={x:cx+Math.cos(a)*80,y:cy+Math.sin(a)*60};if(!World.canStand(p.x,p.y,14))p=spotNear(cx,cy,90);pos.push(p);}
    const real=Math.floor(Math.random()*(n+1));b.x=pos[real].x;b.y=pos[real].y;b.atk=null;b.leap=null;
    let j=0;for(let i=0;i<=n;i++){if(i===real)continue;const p=pos[i],cl=mkMon('ngo-khong-ao',p.x,p.y,{add:true,clone:true,owner:b,aggro:time+20,facing:b.facing,leapCd:time+1+j});monsters.push(cl);b.kids.push(cl);j++;}
    for(const p of pos){burst(p.x,p.y-40,'#f0ece0',34,200);fx.push({kind:'ring',x:p.x,y:p.y,r0:6,r1:60,color:'#ffe0a0',age:0,life:.5,lw:4});}
    floater(cx,cy-130,'Phân thân!','#ffd060',20);shake(6);LH_Audio.play('rare');
    message(svg('eye')+'<b>Tôn Ngộ Không</b> phân thân! Chỉ một con là thật · bản sao trúng đòn sẽ hiện nguyên hình sợi lông khỉ',5);
  }
  function wkDown(b,owner){
    // v10.77: phần thưởng có đồ Hoàn hảo — túi đầy thì Ngộ Không chưa chịu thua (còn 1 máu), dọn túi rồi đánh tiếp
    if(!player.bag.includes(null)){b.hp=Math.max(1,Math.round(b.max*.05));b.dead=false;if(time>(b.fullMsg||0)){b.fullMsg=time+5;bossSpeak&&bossSpeak(b,'Túi ngươi đầy rồi, lấy gì đựng quà của lão Tôn? Ha ha!',3.2);message(svg('bag')+'Túi đồ đầy · dọn một ô trống để nhận quà khi hạ Tôn Ngộ Không',5);}return;}
    const M=MON[b.type];b.dead=true;b.deadAt=time;b.respawn=1e18;b.atk=null;b.burn=null;b.leap=null;b.cast=null;
    for(const k of b.kids||[])if(!k.dead){k.hp=0;addDown(k,'');}
    burst(b.x,b.y-M.h*.4,'#ffd060',40,240);shake(10);LH_Audio.play('boss');message(svg('check')+'Đã hạ '+M.name);
    op({t:'wkHa'}).then(r=>{const d=r&&r.item&&Player.info(r.item),Q=Player.RAR.p||{};if(r&&r.rubies)floater(b.x,b.y-M.h-30,'+'+r.rubies,'#ff9ab8',16,'ruby');if(d){floater(hero.x,hero.y-96,'+ '+d.name+' \u00b7 Hoàn hảo',Q.color||'#c0a0ff',15);LH_Audio.play('rare');}
        message(svg('heart')+`Hạ Tôn Ngộ Không · nhận ${r&&r.rubies?r.rubies+' hồng ngọc':''}${r&&r.rubies&&d?' và ':''}${d?'<b>'+esc(d.name)+' · Hoàn hảo</b> (đã vào túi đồ)':''}`,7);window.GameUI?.refresh();},
      e=>message(svg('close')+'Chưa nhận được thưởng ('+esc(String(e&&e.message||e))+')',5));
    void owner;
  }
  // nói chuyện với Tôn Ngộ Không dưới núi
  function wkTalk(){
    if(!WK||WK.ph!=='trap'||dialogNPC)return false;
    const again=Number(player.flags.wkDay)>0,gold=Number(CFG.ngo_khong_vang)||1;
    const lines=again?['Lại là ngươi! Hôm nay đổi ý chưa?','Bóc giùm lá bùa trên đỉnh núi đi mà… lão Tôn mỏi cổ lắm rồi.']
      :['Ê! Ê! Dưới này! Người qua đường ơi, cúi xuống đây!','Lão Tôn ta đây, Tề Thiên Đại Thánh, từng đại náo Thiên Cung, bị Phật Tổ đè dưới ngọn núi này đã năm trăm năm rồi.','Năm trăm năm! Tuyết phủ đầy đầu, chim làm tổ trên tai, ngứa mũi cũng không gãi được…','Ngày ngày chỉ có viên sắt nóng với nước đồng sôi cho ăn. Răng lão Tôn mẻ hết cả rồi.','Trên đỉnh núi có một lá bùa vàng. Ngươi chỉ cần bóc nó xuống thôi, dễ ợt!','Thả lão Tôn ra, lão Tôn hứa sẽ nhớ ơn ngươi suốt đời. Thật đấy, khỉ không bao giờ nói dối!'];
    talkBox({id:'ngo-khong',name:'Tôn Ngộ Không',lines,choices:['Bóc lá bùa, thả Ngộ Không','Không thả'],
      onChoice:i=>{
        if(i===1){op({t:'wkGiu'}).then(r=>{tutSay(WK.bub,['Đồ keo kiệt! Mai lão Tôn lại năn nỉ tiếp!','Hừ! Năm trăm năm còn chờ được, sợ gì thêm một ngày!','Đi đi! Mai nhớ quay lại đấy!'][Math.floor(Math.random()*3)],3.4);
            if(r&&r.copper){moneyFloat(hero.x,hero.y-96,r.copper);LH_Audio.play('coin');}message(svg('coin')+`Giữ lời nguyền của Phật Tổ · nhận ${gold} vàng · mỗi ngày quay lại được thưởng thêm`,5);window.GameUI?.refresh();},
          e=>{const m=String(e&&e.message||e);tutSay(WK.bub,'Hôm nay ngươi qua đây rồi mà! Mai hẵng tới.',3);message(svg('close')+(m==='DA_NHAN'?'Hôm nay đã nhận thưởng giữ núi · mai quay lại':m==='LEVEL'?'Chưa đủ cấp để nhận thưởng ở Núi tuyết':'Chưa nhận được ('+esc(m)+')'),4);});return;}
        op({t:'wkTha'}).then(()=>{WK.ph='crack';WK.t=time;LH_Audio.play('quest');shake(4);message(svg('spark')+'Bạn bóc lá bùa trên đỉnh núi… ngọn núi rung chuyển!',3);},
          e=>message(svg('close')+'Chưa thả được ('+esc(String(e&&e.message||e))+')',4));}});
    return true;
  }
  // bấm vào núi / nhấn Space khi đứng gần
  function wkTouch(pt){
    if(!WK||WK.map!==World.id||WK.ph!=='trap')return false;
    if(pt&&!(Math.abs(pt.x-WK.x)<120&&pt.y>WK.y-165&&pt.y<WK.y+24))return false;
    const tx=WK.x+34,ty=WK.y+8;
    if(Math.hypot(hero.x-tx,hero.y-ty)>130){if(!pt)return false;const p=World.findPath(hero,{x:tx+20,y:ty+30});if(p){route=p;targetNPC=null;WK.near=false;}return true;}
    return wkTalk();
  }
  // đầu Tôn Ngộ Không (mặt quay sang phải, tâm đầu ở 0,0)
  function wkHead(c,K,t,f,o){
    const FUR=f('#a8682e'),FACE=f('#f2cc98');
    K.E(c,-10,1,4.5,5.5,FACE);K.E(c,0,0,13,12.5,FUR);
    c.fillStyle=FACE;c.beginPath();c.moveTo(-2,-6);c.quadraticCurveTo(6,-11,12,-5);c.quadraticCurveTo(15,4,9,10);c.quadraticCurveTo(2,13,-1,7);c.quadraticCurveTo(-5,0,-2,-6);c.fill();
    K.E(c,2,-2,2.4,2.4,'#ffd040');K.E(c,8.5,-2,2.4,2.4,'#ffd040');K.E(c,2.6,-2,1.1,1.3,'#1a0a0a');K.E(c,9,-2,1.1,1.3,'#1a0a0a');
    K.S(c,[0,-5.5,3,-6.5,5,-5.5],f('#6a3a14'),1.2);K.S(c,[7,-5.5,9.5,-6.5,12,-5],f('#6a3a14'),1.2);
    K.E(c,11,3,1,.8,'#3a1a0a');K.S(c,[4,6,7.5,7.5+(o&&o.mouth||0),11,5.5],'#7a3a1a',1.3);
    K.L(c,[-12.5,-4,12.5,-6.5],f('#f0c040'),2.8);K.E(c,0,-5.3,1.8,1.8,f('#e04030'));
    const sw=Math.sin(t*2)*2;K.S(c,[-2,-9,-8,-24,-18,-34+sw,-30,-38+sw],f('#d8402a'),1.5);K.S(c,[2,-10,0,-26,-6,-38-sw,-16,-46-sw],f('#e86040'),1.5);
  }
  // Tôn Ngộ Không đứng (quay sang phải, chân chạm y=0): áo giáp vàng, đai đỏ, áo choàng, đuôi, Gậy Như Ý
  function drawWukong(c,m,M,st){
    const K=LH_BOSS.kit,t=st.t,f=v=>st.fl?'#fff3e6':v,g=st.g||0,mv=m.moving?1:0,s=(M.h||92)/92;c.save();c.scale(s,s);
    if(m.clone)c.globalAlpha*=.92;
    K.S(c,[-10,-30,-24,-24,-32,-38+Math.sin(t*3)*4,-26,-52+Math.sin(t*3)*5,-18,-54],f('#a8682e'),4);
    K.F(c,[-6,-60,-22,-22+Math.sin(t*2)*2,-12,-16,6,-52],f('#9a1c1c'));
    const leg=(x,ph,col)=>{const k=Math.sin(g+ph)*mv;K.L(c,[x,-32,x+k*6,-15,x+k*4,-2],f(col),6.5);K.E(c,x+k*4+2,-1,5.5,2.6,f('#3a2a1a'));};
    leg(-6,0,'#c89038');leg(6,Math.PI,'#e0aa48');
    c.fillStyle=st.fl?'#fff3e6':K.lg(c,0,-64,0,-28,['#ffe070','#e8b030','#a87010']);c.beginPath();c.ellipse(0,-46,13,18,0,0,PI2);c.fill();
    for(let r=0;r<3;r++)for(let q=0;q<4;q++){c.strokeStyle='#a8701888';c.lineWidth=.8;c.beginPath();c.arc(-7+q*4.6+(r%2)*2.3,-54+r*5,2.2,0,Math.PI);c.stroke();}
    K.L(c,[-12.5,-34,12.5,-34],f('#c8302a'),4.5);K.E(c,0,-50,4.5,4.5,f('#d83a2a'));K.E(c,0,-50,2,2,f('#ffe080'));
    // gậy Như Ý: đứng yên chống nghiêng, vung lên khi lấy đà, quật ngang khi ra đòn
    const pre=m.atk&&time<m.atk.at,a=st.open?.25:pre?-2.3:-1.15+Math.sin(t*1.5)*.06;
    c.save();c.translate(10,-46);c.rotate(a);K.L(c,[-36,0,40,0],f('#c8302a'),3.6);K.L(c,[-36,0,-30,0],f('#f0c040'),4.6);K.L(c,[34,0,40,0],f('#f0c040'),4.6);
    if(st.open){c.save();c.globalAlpha=.4;K.S(c,[40,0,30,-26,6,-40],'#ffe080',6);c.restore();}c.restore();
    K.L(c,[4,-56,10,-46],f('#a8682e'),5);K.E(c,10,-46,3.4,3.4,f('#a8682e'));
    c.save();c.translate(1,-74+(mv?Math.sin(g*2)*1.2:Math.sin(t*1.6)*.8));wkHead(c,K,t,f,{mouth:st.open?2:0});c.restore();
    c.restore();
  }
  // núi đè Tôn Ngộ Không ở Núi tuyết (tuyết phủ đỉnh, lá bùa vàng); thả ra thì Ngộ Không nhảy ra, cưỡi mây bay đi
  function drawWkMount(o){
    const c=ctx,K=LH_BOSS.kit,t=time,ph=o.ph,f=v=>v,shk=ph==='crack'?Math.sin(t*50)*Math.min(4,(t-o.t)*4):0;
    c.save();c.translate(o.x+shk,o.y);c.scale(1.3,1.3);ell(c,0,4,96,18,'#00000030');
    K.P(c,[-96,0,-74,-46,-46,-78,-14,-120,16,-98,44,-112,74,-58,100,0],'#767b86');
    K.P(c,[-96,0,-74,-46,-46,-78,-14,-120,-8,-82,-32,-34,-22,0],'#8b909a');K.P(c,[44,-112,74,-58,100,0,62,0,60,-50],'#646973');
    K.P(c,[-32,-92,-14,-120,4,-104,16,-98,28,-104,44,-112,54,-96,36,-90,20,-84,6,-92,-8,-86,-22,-90],'#f4f8ff');K.P(c,[-74,-46,-62,-58,-50,-50,-60,-44],'#eef4fc');
    for(const p of [[-60,-20,-44,-34,-48,-48],[30,-30,40,-50,36,-66],[-20,-60,-6,-70]])K.L(c,p,'#565a62',1.4);
    if(ph==='trap'||(ph==='crack'&&t<o.t+.25)){c.save();c.translate(-12,-118);c.rotate(Math.sin(t*3)*.1);c.fillStyle='#f2d040';c.fillRect(-7,0,14,28);c.strokeStyle='#c83020';c.lineWidth=1.3;c.strokeRect(-5.5,1.5,11,25);
      for(const y of [6,12,18,23])K.L(c,[-3,y,3,y-2],'#c83020',1.4);K.L(c,[0,4,0,24],'#c83020',1);c.restore();}
    else if(ph==='crack'){const u=(t-o.t-.25);c.save();c.translate(-12+u*60,-118-u*180);c.rotate(u*8);c.globalAlpha=Math.max(0,1-u);c.fillStyle='#f2d040';c.fillRect(-7,0,14,28);c.restore();}
    else{c.save();c.translate(-12,-112);c.rotate(.5);c.fillStyle='#d8c060';c.fillRect(-3,0,6,9);c.restore();} // mẩu bùa rách
    if(ph==='trap'||ph==='crack'){
      c.save();c.translate(26,-16);c.save();c.rotate(Math.sin(t*4)*.5-.3);K.L(c,[0,0,16,-8],'#a8682e',5);K.E(c,17,-9,4,4,'#f2cc98');c.restore();
      c.translate(0,-10);c.scale(1.35,1.35);wkHead(c,K,t,f,{mouth:Math.sin(t*6)>.3?2:0});c.restore();
      K.P(c,[8,-2,20,-12,44,-10,52,0],'#7c818b'); // đá đè lên vai
    }
    c.restore();
    if(ph==='out'||ph==='fly'){
      const u=ph==='fly'?Math.min(1,(t-o.t)/1.8):0,jx=ph==='out'?Math.min(1,(t-o.t)/.35):1,x=lerp(o.x+20,o.mx,jx)+u*u*520,y=lerp(o.y-30,o.my,jx)-(ph==='out'?Math.sin(jx*Math.PI)*60:0)-u*u*360;
      c.save();c.globalAlpha=1-u*.9;c.translate(x,y);
      if(ph==='fly'){for(const [cx,cy,r] of [[-18,6,12],[0,10,15],[18,6,12],[30,10,9],[-30,10,8]])ell(c,cx,cy,r,r*.55,'#ffffff');ell(c,0,12,34,6,'#e8f0ff');}
      drawWukong(c,{moving:false,facing:1},{h:92},{t,fl:false,g:0,open:false});c.restore();
      if(o.bub){o.bub.x=x;o.bub.y=y;}
    }
  }
  /* ---------- v10.74: Ông Bụt giữa hồ Rừng Trúc (ô 38,30 cạnh hồ) — nhiệm vụ ẩn rìu đồng / bạc / vàng ----------
     Tới gần bờ hồ: Bụt hiện lên giữa hồ, cầm rìu đồng, hỏi "có phải rìu ngươi đánh rơi?" — nhận bừa → Bụt biến mất ("Mỡ đấy mà húp!"),
     nói không → đổi rìu bạc → rồi rìu vàng; tới rìu vàng mà nhận thì được Chùy sắt Hoàn hảo (một lần, lần sau Bụt không hiện nữa),
     vẫn nói không thì Bụt khen thật thà rồi biến mất, không được gì (lần sau vào lại map Bụt lại hiện). */
  const BUT_AT={map:'rung-truc',x:38,y:30,lx:41.5,ly:30.2};
  let OB=null;
  const butFlag=()=>Number(player.flags.but)||0;
  const BUT_AXE=[['rìu đồng','#c47a3a','#8a4e22'],['rìu bạc','#dfe4ec','#8d96a6'],['rìu vàng','#f4c53a','#b8841a']];
  function butTick(dt){
    if(World.id!==BUT_AT.map){if(OB)OB=null;return;}
    if(!OB||OB.map!==World.id){OB={map:World.id,x:BUT_AT.lx*T,y:BUT_AT.ly*T,sx:(BUT_AT.x+.5)*T,sy:(BUT_AT.y+.5)*T,ph:butFlag()?'gone':'hide',t:time,stage:0,swap:-9,near:false};OB.bub={name:'Ông Bụt',x:OB.x,y:OB.y-128,sayH:100};}
    if(OB.ph==='gone')return;
    OB.bub.x=OB.x;OB.bub.y=OB.y-128;
    const d=Math.hypot(hero.x-OB.sx,hero.y-OB.sy);
    if(OB.ph==='hide'){if(d<170&&!hero.dead){OB.ph='rise';OB.t=time;burst(OB.x,OB.y-10,'#fff6c0',30,170);fx.push({kind:'ring',x:OB.x,y:OB.y,r0:8,r1:96,color:'#ffe9a0',age:0,life:.8,lw:4});LH_Audio.play('magic');message(svg('eye')+'Có gì đó hiện lên giữa hồ nước…',3);}return;}
    if(OB.ph==='rise'){if(time>OB.t+1){OB.ph='show';OB.t=time;}return;}
    if(OB.ph==='show'){if(d<170&&!OB.near&&!dialogNPC&&!hero.dead&&!busy()){OB.near=true;butTalk();}else if(d>260)OB.near=false;}
    else if(OB.ph==='fade'&&time>OB.t+1.2)OB.ph='gone';
  }
  function butTalk(){
    if(!OB||OB.ph!=='show'||dialogNPC)return false;
    const st=OB.stage;
    const lines=st===0?['Ê thanh niên 6 ngón! Lại đây ông bảo!','Thanh niên không tin mình 6 ngón ư? Nhìn thử icon đánh thường đếm lại coi ta nói đúng không!','Đây có phải cây rìu mà ngươi đánh rơi không?']
      :st===1?['Hừm… không phải à? Để ta lặn xuống mò lại…','Thế cây rìu bạc này, có phải của ngươi không?']
      :['Lại không phải? Ngươi thật thà quá đấy… Ta hỏi lần cuối.','Cây rìu vàng này, có phải cây rìu ngươi đánh rơi không?'];
    talkBox({id:'ong-but',name:'Ông Bụt',lines,choices:['Có, của tôi đấy!','Không phải của tôi'],onChoice:i=>{
      if(!OB||OB.ph!=='show')return;
      if(i===0){
        if(st<2){butGone('Mỡ đấy mà húp!',2.6);return;}
        op({t:'butChuy'}).then(r=>{const it=r&&r.item,d=it&&Player.info(it);tutSay(OB.bub,'Thôi! Đừng diễn nữa! Đây! Tặng tạm cho ngươi một cái chuỳ xài chơi!',4.4);
            burst(hero.x,hero.y-40,'#ffe9a0',26,180);LH_Audio.play('quest');if(d)floater(hero.x,hero.y-96,'+ '+d.name+' · Hoàn hảo','#c0a0ff',15);
            message(svg('bag')+'Ông Bụt tặng <b>'+esc(d?d.name:'Chùy')+' · Hoàn hảo</b> · đã vào túi đồ',6);window.GameUI?.refresh();OB.ph='fade';OB.t=time+3.6;},
          e=>{const m=String(e&&e.message||e);tutSay(OB.bub,m==='BAG_FULL'?'Túi ngươi đầy rồi! Dọn chỗ rồi quay lại ta cho.':'Ơ… hôm nay ta không trao được.',3.4);message(svg('close')+(m==='BAG_FULL'?'Túi đồ đầy · dọn chỗ rồi nói lại với Ông Bụt':m==='DA_NHAN'?'Đã nhận quà của Ông Bụt rồi':m==='LEVEL'?'Chưa đủ cấp Rừng Trúc':'Chưa nhận được ('+esc(m)+')'),4);OB.near=false;});
        return;}
      if(st<2){OB.stage=st+1;OB.swap=time;burst(OB.x+16,OB.y-70,'#ffffff',18,140);LH_Audio.play('magic');
        setTimeout(()=>{if(OB&&OB.ph==='show'&&!dialogNPC&&!hero.dead&&!busy())butTalk();else if(OB)OB.near=false;},1500);return;}
      butGone('Ta biết ngươi là người thật thà! Thế Hoy đi nha!',3.4);
    }});
    return true;
  }
  function butGone(say,sec){tutSay(OB.bub,say,sec);OB.ph='fade';OB.t=time+sec-.4;}
  // bấm vào Bụt / nhấn Space khi đứng gần bờ hồ: xa thì tự đi tới bờ
  function butTouch(pt){
    if(!OB||OB.map!==World.id||OB.ph!=='show')return false;
    if(pt&&!(Math.abs(pt.x-OB.x)<70&&pt.y>OB.y-170&&pt.y<OB.y+30))return false;
    if(Math.hypot(hero.x-OB.sx,hero.y-OB.sy)>170){if(!pt)return false;const p=World.findPath(hero,{x:OB.sx,y:OB.sy});if(p){route=p;targetNPC=null;OB.near=false;}return true;}
    return butTalk();
  }
  // Ông Bụt: râu tóc bạc phơ, áo trắng, đứng trên áng mây giữa hồ, tay cầm rìu (đồng → bạc → vàng)
  function drawBut(o){
    const c=ctx,K=LH_BOSS.kit,t=time,ph=o.ph;
    const u=ph==='rise'?Math.min(1,(t-o.t)/1):1,al=ph==='fade'?Math.max(0,1-Math.max(0,t-o.t)/1.2):u,bob=Math.sin(t*1.6)*4,rise=(1-u)*70;
    if(al<=0)return;
    c.save();c.translate(o.x,o.y);
    // mặt nước gợn + ánh sáng dưới chân
    c.globalAlpha=al*.55;for(let i=0;i<3;i++){const k=((t*.5+i/3)%1);c.strokeStyle='#dff6ff';c.lineWidth=1.2;c.globalAlpha=al*(1-k)*.6;c.beginPath();c.ellipse(0,6,22+k*50,7+k*16,0,0,PI2);c.stroke();}
    c.globalAlpha=al;
    c.save();c.translate(0,bob+rise);
    if(u<1){c.save();c.beginPath();c.rect(-90,-200,180,200-rise);c.clip();}
    K.glow(c,'#fff2b0',22);K.E(c,0,-70,46,78,'#fff4c840');K.noGlow(c);
    // mây dưới chân
    for(const [cx,cy,r] of [[-20,4,13],[0,8,16],[20,4,13],[32,9,9],[-32,9,9]])ell(c,cx,cy,r,r*.55,'#ffffff');ell(c,0,10,38,6,'#e8f0ff');
    // áo trắng dài
    K.F(c,[-18,-30,-24,0,24,0,18,-30,10,-78,-10,-78],'#f6f3ea');K.S(c,[-6,-76,-4,-40,-8,-2],'#d9d2c0',1.2);K.S(c,[0,-78,2,-30,0,-2],'#d9d2c0',1.2);
    K.L(c,[-16,-44,16,-44],'#c9a24a',3); // dây lưng
    // tay trái giơ rìu, tay phải chống gậy / vuốt râu
    K.L(c,[-12,-66,-30,-52,-34,-36],'#f6f3ea',9);K.E(c,-34,-36,5,5,'#f1d3a8');
    K.L(c,[12,-66,26,-58,30,-46],'#f6f3ea',9);K.E(c,30,-46,5,5,'#f1d3a8');
    // đầu, mũ, râu
    K.E(c,0,-92,13,14,'#f1d3a8');K.E(c,0,-104,13,6,'#f6f3ea');K.P(c,[-12,-104,12,-104,8,-118,-8,-118],'#f6f3ea');
    K.E(c,-5,-94,1.4,1.6,'#2a1a10');K.E(c,5,-94,1.4,1.6,'#2a1a10');K.S(c,[-8,-98,-3,-100],'#e6e6e6',1.6);K.S(c,[3,-100,8,-98],'#e6e6e6',1.6);
    K.F(c,[-11,-88,-14,-66,-6,-50,0,-44,6,-50,14,-66,11,-88,0,-84],'#f4f4f4');K.S(c,[-6,-88,0,-86,6,-88],'#8a6a4a',1); // râu dài, miệng cười
    // rìu trong tay trái
    const ax=BUT_AXE[Math.min(2,o.stage)],sw=Math.min(1,(t-(o.swap||-9))/.5),gl=1-sw;
    c.save();c.translate(-34,-36);c.rotate(-.35+Math.sin(t*1.2)*.05);
    K.L(c,[0,8,0,-40],'#7a4a22',4);
    K.glow(c,ax[1],8+gl*20);K.P(c,[-3,-40,-20,-46,-24,-30,-16,-16,-3,-22],ax[1]);K.P(c,[-3,-40,-20,-46,-18,-40,-5,-36],ax[2]);K.noGlow(c);
    if(gl>0){c.globalAlpha=al*gl;for(let i=0;i<6;i++){const a=i/6*PI2+t*3;K.E(c,-12+Math.cos(a)*18,-32+Math.sin(a)*18,2,2,'#ffffff');}c.globalAlpha=al;}
    c.restore();
    if(u<1)c.restore();
    c.restore();
    // hào quang tròn sau đầu
    c.globalAlpha=al*.5;c.strokeStyle='#ffe28a';c.lineWidth=2.5;c.beginPath();c.arc(0,-92+bob+rise,22,0,PI2);c.stroke();
    c.restore();
  }
  function hqTick(dt){
    btTick(dt);anTick(dt);vitTick(dt);wkTick(dt);butTick(dt);fwTick();sqTick(dt);
    {const c=cageAt();if(c&&!(Number(player.flags.rescue)>=1)&&!dialogNPC&&!hero.dead&&!tut){const near=Math.hypot(hero.x-c.x,hero.y-c.y)<110;
      if(cageWant&&!route.length){cageWant=false;if(near)hqTouch();}
      else if(near&&time>cageAuto&&((player.flags.kills||{})['hon-nguyen-ma-to']>0)){cageAuto=time+6;hqTouch();}}}
    const D=World.def;if(D.kind==='final'&&hqHint!==World.id&&!tut){hqHint=World.id;if(!(Number(player.flags.rescue)>=1))message(svg('heart')+'Có tiếng trẻ con khóc vọng ra từ sâu trong điện…',5);}
  }
  // vẽ nhân vật đang hoá thành quái (sách Phong): hình quái tại chỗ nhân vật, viền gió, thanh thời gian
  function drawMorph(){
    const M=MON[hero.morph.type];if(!M){hero.morph=null;return;}
    const pr={type:hero.morph.type,x:hero.x,y:hero.y,facing:hero.facing,walk:hero.walk*1.6,moving:hero.moving,hurt:hero.hurt,atk:null,hp:1,max:1,dead:false,deadAt:0,slowUntil:0,frozenUntil:0,stunUntil:0,fearUntil:0,aggro:0,fly:0};
    ctx.save();ctx.globalAlpha=.5+Math.sin(time*6)*.15;ctx.strokeStyle=EL.wind.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(hero.x,hero.y,M.r*1.5+10,M.r*.5+5,0,0,PI2);ctx.stroke();ctx.restore();
    drawMonster(pr);
    const left=Math.max(0,hero.morph.until-time),w=46;roundRect(ctx,hero.x-w/2,hero.y-M.h-26,w,5,2,'#0a120ecc');roundRect(ctx,hero.x-w/2,hero.y-M.h-26,w*left/hero.morph.sec,5,2,EL.wind.color);
    label(player.name+' · '+M.name,hero.x,hero.y-M.h-32,'#bff5e0');
  }
  /* ---------- v10.29: Hang Cướp (phó bản dưới tháp cổ Sa mạc) — 40 tên cướp bịt mặt hỏi mật khẩu; đúng thì để lại rương báu, sai thì cả bọn đánh, rượt về tận trạm nghỉ ---------- */
  let cave=null,caveChase=0;
  const CAVE_N=()=>Math.max(1,Math.min(60,Math.floor(Number(CFG.hang_cuop_so_cuop)||40)));
  const vnDay=()=>Math.floor((Date.now()+7*3600000)/86400000);
  function robBot(i,x,y,lead){const d=Player.makeMerc({name:lead?'Thủ lĩnh bịt mặt':'Cướp bịt mặt',gender:i%7===3?'f':'m',stats:{strength:20,agility:20,vitality:24,intelligence:10}});try{botGear(d,12,Math.random);}catch(e){}
    for(const k of ['hat','wings'])d.equipment[k]=null;const e=makeBot(400+i,d,{x,y,r:2*T},x,y,false);const oa=Math.random()*PI2,orr=26+Math.random()*46;Object.assign(e,{tut:true,rob:true,mask:true,lead:!!lead,name:d.name,cd:time+Math.random(),off:{x:Math.cos(oa)*orr,y:Math.sin(oa)*orr*.55}});return e;}
  function caveEnter(){
    cave=null;
    if(World.id==='sa-mac'&&caveChase>time){ // toán cướp rượt ra tận ngoài hang
      const P=World.portals.find(q=>q.to==='hang-cuop'),px=P?(P.x+.5)*T:hero.x,py=P?(P.y+.5)*T:hero.y,list=[];
      for(let i=0;i<Math.min(12,CAVE_N());i++){const a=Math.random()*PI2,r=10+Math.random()*50;let x=px+Math.cos(a)*r,y=py+Math.sin(a)*r;if(!World.canStand(x,y)){x=hero.x;y=hero.y;}const e=robBot(i,x,y,i===0);e.hunt=true;bots.push(e);list.push(e);}
      cave={ph:'chase',robs:list,t:time,out:true};tutSay(list[0],'Chạy đâu cho thoát!',3);return;}
    caveChase=0;if(World.id!=='hang-cuop')return;
    const ok=!!(player.flags&&player.flags.caveOk),ch=tutPtAt(16,4);
    cave={ph:ok?'chest':'come',t:time,robs:[],chest:ok?ch:null,ch,said:{}};
    if(ok)return;
    for(let i=0;i<CAVE_N();i++){const a=(i/CAVE_N())*PI2,r=40+(i%5)*26,x=ch.x+Math.cos(a)*r*1.6,y=ch.y+60+Math.sin(a)*r*.5;const p=World.canStand(x,y)?{x,y}:ch;const e=robBot(i,p.x,p.y,i===0);
      // chỗ đứng: vây hình vòng cung trước mặt nhân vật
      const row=Math.floor(i/10),col=i%10,ang=Math.PI*(1.15+.7*col/9),rr=120+row*42;e.slot={x:hero.x+Math.cos(ang)*rr,y:hero.y+Math.sin(ang)*rr*.6};if(!World.canStand(e.slot.x,e.slot.y))e.slot=safeSpot0(hero.x,hero.y-100,140)||{x:p.x,y:p.y};bots.push(e);cave.robs.push(e);}
  }
  const tutPtAt=(tx,ty)=>({x:(tx+.5)*T,y:(ty+.6)*T});
  function safeSpot0(cx,cy,R){for(let k=0;k<30;k++){const a=Math.random()*PI2,r=Math.random()*R,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(World.canStand(x,y))return {x,y};}return null;}
  function caveAsk(){
    const L=cave.robs[0];keys.clear();joystick={x:0,y:0};holdAttack=false;route=[];targetNPC=null;hero.attack=null;cave.ph='ask';tutSay(L,'Mật khẩu là gì?',4);
    dialogNPC={id:'cave-ask',name:L.name,tut:true,lines:['Mật khẩu là gì?'],choices:['A. Vừng ơi mở ra!','B. Phà ơi mở ra!','C. Bừng lên mở ra!','D. Bà ơi đừng la!'],
      onChoice:i=>{if(i===3)caveRight();else caveWrong();},onEnd:()=>{if(cave&&cave.ph==='ask'){cave.ph='wait';cave.t=time;}}};
    page=0;dialogEl.hidden=false;showLine();
  }
  function caveRight(){
    const L=cave.robs[0];cave.ph='vanish';cave.t=time;tutSay(L,'Mật khẩu đúng!',3);LH_Audio.play('pickup');
    cave.robs.forEach((e,k)=>{if(k&&k%6===0)tutSay(e,['Mời đại hiệp!','Rút thôi anh em!','Hẹn gặp lại!'][k%3],2.4);});
    op({t:'cavePass'}).catch(()=>{});
  }
  function caveWrong(){
    seen.add('caveBad');
    const L=cave.robs[0];cave.ph='fight';cave.t=time;tutSay(L,'Sai rồi! Đánh nó!',3);shake(4);
    const cry=['Xông lên!','Dám lừa bọn ta à!','Bắt lấy nó!','Đánh!'];cave.robs.forEach((e,k)=>{e.hunt=true;if(k&&k%5===0)tutSay(e,cry[k%4],2.2);});
    message(svg('close')+'Sai mật khẩu! Cả toán cướp lao vào · chạy ra cửa hang!',4.5);
  }
  // đòn của cướp: rất nhẹ (đủ để chạy thoát)
  function robHit(e){
    if(hero.dead||time<hero.invuln)return;const S=HD.tot;if(Math.random()*100<S.dodge){floater(hero.x,hero.y-66-seatH(),'Né','#cfe8ff',15);hero.invuln=time+.2;return;}
    const d=Math.max(1,Math.round(S.hp*(Number(CFG.hang_cuop_sat_thuong)||2)/100));player.hp-=d;hero.hurt=time;hero.invuln=time+.3;floater(hero.x,hero.y-66-seatH(),'-'+d,'#ff8f86',14);LH_Audio.play('hurt');hero.invuln=time+.8; // cả toán đánh cũng chỉ trúng ~1 đòn mỗi 0,8 giây

    if(player.hp<=0)die();window.GameUI?.refresh();
  }
  function caveUpdate(dt){
    const C=cave;if(!C)return;const age=time-C.t;
    const hunt=(e,spd)=>{const dx=hero.x-e.x,dy=hero.y-e.y,d=Math.hypot(dx,dy);e.facing=dx<0?-1:1;
      if(e.attack){const a=e.attack,p=(time-a.start)/a.dur;if(!a.hitDone&&p>=a.hit){a.hitDone=true;if(Math.hypot(hero.x-e.x,hero.y-e.y)<80)robHit(e);}if(p>=1)e.attack=null;}
      const gx=hero.x+e.off.x,gy=hero.y+e.off.y;if(Math.hypot(gx-e.x,gy-e.y)>14&&d>30){tutWalk(e,{x:gx,y:gy},spd,dt);}else{e.moving=false;if(!e.attack&&time>e.cd&&d<80){const st=Player.stance(e.data),A=ATK[st.type]||ATK.punch;e.aim={x:dx/(d||1),y:dy/(d||1)};e.attack={type:st.type,skill:'normal',start:time,dur:A.dur,hit:A.hit,hitDone:false,aim:{...e.aim},stance:st,hand:'right'};e.cd=time+A.dur+.7+Math.random()*.8;}}};
    if(C.ph==='chase'){ // ngoài Sa mạc: rượt tới trạm nghỉ thì bỏ đi
      const inSafe=World.isSafe(hero.x,hero.y)||hero.dead;
      for(const e of C.robs){if(e.dead)continue;if(e.leave){if(tutWalk(e,e.leave,150,dt)||time>e.leaveAt){e.dead=1;e.respawnAt=1e18;burst(e.x,e.y-20,'#8a7a6a',10,100);}continue;}
        if(inSafe){const P=World.portals.find(q=>q.to==='hang-cuop');e.leave=P?{x:(P.x+.5)*T,y:(P.y+.5)*T}:{x:e.x,y:e.y-200};e.leaveAt=time+25;e.hunt=false;if(e===C.robs[0])tutSay(e,'Lần sau liệu hồn!',3);continue;}
        hunt(e,138);}
      if(C.robs.every(e=>e.dead)){for(const e of C.robs){const i=bots.indexOf(e);if(i>=0)bots.splice(i,1);}cave=null;caveChase=0;}
      return;
    }
    if(C.ph==='come'){let all=true;for(const e of C.robs){if(!tutWalk(e,e.slot,175,dt))all=false;else{e.moving=false;e.facing=hero.x<e.x?-1:1;}}
      if(!C.said.c){C.said.c=1;tutSay(C.robs[3]||C.robs[0],'Có kẻ lạ vào hang!',2.5);tutSay(C.robs[17]||C.robs[0],'Vây lại!',2.5);}
      if((all&&age>1.5)||age>6){if(!busy())caveAsk();}return;}
    if(C.ph==='wait'){for(const e of C.robs)e.facing=hero.x<e.x?-1:1;if(age>2.5&&!busy())caveAsk();return;}
    if(C.ph==='ask'){for(const e of C.robs){e.moving=false;e.facing=hero.x<e.x?-1:1;}return;}
    if(C.ph==='vanish'){if(age>1.6){for(const e of C.robs){burst(e.x,e.y-24,'#cfc6b8',10,120);const i=bots.indexOf(e);if(i>=0)bots.splice(i,1);}C.robs=[];C.ph='chest';C.chest=C.ch;C.t=time;burst(C.ch.x,C.ch.y-20,'#ffe08a',30,200);message(svg('spark')+'Toán cướp để lại một rương báu!',4);}return;}
    if(C.ph==='fight'){for(const e of C.robs)hunt(e,138);return;}
    if(C.ph==='chest'){if(C.want&&Math.hypot(hero.x-C.chest.x,hero.y-C.chest.y)<90){C.want=false;caveOpen();}}
  }
  // v10.30: về làng Thanh Mộc sau khi bị toán cướp rượt — người chơi ảo trêu lần đầu, sau đó thỉnh thoảng nhắc mật khẩu (tới khi trả lời đúng)
  let gossipAt=0,gossipLine=0;
  function caveGossip(){
    if(time<gossipAt)return;gossipAt=time+1;
    if(World.id!=='thanh-moc'||!seen.has('caveBad')||(player.flags&&player.flags.caveOk)||tut||hero.dead||busy()||!World.isSafe(hero.x,hero.y))return;
    const near=bots.filter(e=>!e.dead&&!e.rob&&!e.tut&&Math.hypot(e.x-hero.x,e.y-hero.y)<520).sort((a,b)=>Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y));if(!near.length)return;
    if(!seen.has('caveTaunt')){seen.add('caveTaunt');checkpoint();
      ['Ở đây không phải truyện cổ tích đâu!','«Vừng ơi mở ra» kkk','Đáp án phải là D «Bà ơi đừng la!»'].forEach((t,k)=>setTimeout(()=>{const e=near[k%near.length];if(e&&!e.dead){e.facing=hero.x<e.x?-1:1;tutSay(e,t,3.6);}},k*1900));
      gossipAt=time+60+Math.random()*60;return;}
    gossipAt=time+70+Math.random()*80;const e=near[0];e.facing=hero.x<e.x?-1:1;
    tutSay(e,['Nhớ nhé: «Bà ơi đừng la!»','Toán cướp dưới tháp cổ vẫn chờ mật khẩu đấy!','Vừng ơi mở ra… kkk','Đáp án là D đó bạn ơi!','Lại bị cướp rượt về à? Nhớ chọn D nha!'][gossipLine++%5],3.4);
  }
  function caveOpen(){
    const C=cave;if(!C||!C.chest)return;route=[];
    if(player.flags.caveDay===vnDay()){C.opened=true;message(svg('close')+'Toán cướp không để lại gì! Thùng trống rỗng!',4);floater(C.chest.x,C.chest.y-60,'Trống rỗng!','#d8cfc0',15);return;}
    op({t:'caveChest'}).then(r=>{C.opened=true;LH_Audio.play('rare');burst(C.chest.x,C.chest.y-30,'#ff9ab8',26,200);floater(C.chest.x,C.chest.y-60,'+'+(r.rubies||1),'#ff9ab8',18,'ruby');message(svg('spark')+'Mở rương báu: +'+(r.rubies||1)+' hồng ngọc · mai quay lại nhé',4.5);window.GameUI?.refresh();},
      err=>{C.opened=true;message(svg('close')+'Toán cướp không để lại gì! Thùng trống rỗng!',4);});
  }
  function caveTouch(pt){ // bấm vào rương (pt) hoặc nhấn E gần rương
    const C=cave;if(!C||!C.chest)return false;const ch=C.chest;
    if(pt&&Math.hypot(pt.x-ch.x,pt.y-(ch.y-18))>44)return false;
    const d=Math.hypot(hero.x-ch.x,hero.y-ch.y);if(d<90){caveOpen();return true;}
    if(!pt)return false;const p=World.findPath(hero,{x:ch.x,y:ch.y+30});if(p){route=p;targetNPC=null;C.want=true;}return true;
  }
  function drawCave(){
    const C=cave;if(!C||!C.chest)return;const {x,y}=C.chest,op2=C.opened||(player.flags&&player.flags.caveDay===vnDay());
    ctx.save();ell(ctx,x,y+4,34,9,'#00000066');
    if(!op2){ctx.shadowColor='#ffd040';ctx.shadowBlur=14+Math.sin(time*3)*6;}
    roundRect(ctx,x-30,y-34,60,36,5,'#6b3e1e');ctx.shadowBlur=0;roundRect(ctx,x-30,y-34,60,6,3,'#c9962e');roundRect(ctx,x-30,y-6,60,6,3,'#c9962e');
    for(const dx of [-22,20])roundRect(ctx,x+dx,y-34,4,36,1,'#c9962e');
    if(op2){ctx.fillStyle='#2a160a';ctx.beginPath();ctx.ellipse(x,y-34,28,7,0,0,PI2);ctx.fill();roundRect(ctx,x-30,y-62,60,26,6,'#7c4a24');roundRect(ctx,x-30,y-40,60,5,2,'#c9962e');}
    else{ctx.fillStyle='#8a5228';ctx.beginPath();ctx.moveTo(x-30,y-34);ctx.quadraticCurveTo(x,y-56,x+30,y-34);ctx.closePath();ctx.fill();roundRect(ctx,x-5,y-30,10,12,2,'#ffd84a');ell(ctx,x,y-25,2,2.4,'#5a3a10');}
    ctx.restore();
  }
  /* ---------- v10.54 · Thoại boss (LH_THOAI ở 04-boss-thoai.js): nói khi gặp, xen giữa trận, khi máu dưới 30%, khi gục, khi hạ người chơi, khi bỏ chạy / quay lại ---------- */
  function bossSpeak(m,t,sec){if(!t)return;t=String(t).replace(/\{cha\}/g,player.gender==='f'?'Mẹ':'Cha').replace(/\{ngu\}/g,player.gender==='f'?'con':'thằng');m.say={text:t,until:time+(sec||Math.min(5.2,2.4+t.length*.035)),mon:true};}
  function bossLine(m,key,sec){const L=typeof LH_THOAI!=='undefined'&&LH_THOAI[m.type];if(L&&L[key])bossSpeak(m,L[key],sec);}
  function bossTalk(){
    if(typeof LH_THOAI==='undefined')return;
    const gapOf=n=>Number(CFG['thoai_giay_'+n])||({nhieu:5,vua:10,it:18})[n]||10;
    for(const m of monsters){const L=LH_THOAI[m.type];if(!L)continue;const M=MON[m.type];let k=m.tk||(m.tk={on:false,i:0,next:0,last:-1,sap:false,off:0});
      if(m.dead){if(k.on&&!k.guc){k.guc=true;k.on=false;bossSpeak(m,L.guc,3.8);}continue;}
      if(k.guc)k=m.tk={on:false,i:0,next:0,last:-1,sap:false,off:0}; // đã hồi sinh
      if(m.fleeing)continue;
      const d=Math.hypot(m.x-hero.x,m.y-hero.y),eng=!hero.dead&&d<640&&m.tgt==='hero'&&(m.aggro>time||d<(M.aggro||300)+40);
      if(!eng){if(k.on){if(!k.off)k.off=time;if(time-k.off>6){k.on=false;k.i=0;k.off=0;}}else if(k.sap&&m.hp>=m.max*.9)k.sap=false;continue;}
      k.off=0;
      if(!k.on){k.on=true;const t=k.quay&&L.quay?L.quay:L.gap;k.quay=false;bossSpeak(m,t);k.next=time+(t?3.6:1.2);continue;}
      if(!k.sap&&L.sap&&m.hp<m.max*.3){k.sap=true;bossSpeak(m,L.sap);k.next=time+Math.max(3.6,gapOf(L.n)*.6);continue;}
      if(time<k.next)continue;
      const ch=L.chuoi||[],cu=L.cau||[];let t='';
      if(k.i<ch.length){t=ch[k.i++];k.next=time+(k.i<ch.length?3.4:gapOf(L.n));} // chuỗi: nói liền một mạch như độc thoại
      else if(cu.length){let j=Math.floor(Math.random()*cu.length);if(cu.length>1&&j===k.last)j=(j+1)%cu.length;k.last=j;t=cu[j];k.next=time+gapOf(L.n)*(.8+Math.random()*.4);}
      else if(ch.length){k.i=0;k.next=time+gapOf(L.n)*2;continue;} // chỉ có chuỗi: nghỉ một lúc rồi kể lại từ đầu
      bossSpeak(m,t);
    }
  }
  // bóng thoại của người chơi ảo
  function drawSay(){
    const placed=[];
    for(const e of [...bots,...World.npcs,...(AN&&AN.map===World.id?[AN]:[]),...(DUCK&&DUCK.map===World.id?[DUCK]:[]),...(VIT&&VIT.duck?[VIT.duck]:[]),...(WK&&WK.map===World.id&&WK.bub?[WK.bub]:[]),...(OB&&OB.map===World.id&&OB.bub?[OB.bub]:[]),...monsters.filter(m=>m.say)]){if(!e.say||time>e.say.until||(e.dead&&!e.say.mon))continue;const t=e.say.text;ctx.save();ctx.font='600 13px system-ui';
      // v10.54: câu dài tự xuống dòng (tối đa 240 px một dòng)
      const lines=[];{let cur='';for(const wd of LH_T(t).split(' ')){const nx=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(nx).width>240){lines.push(cur);cur=wd;}else cur=nx;}if(cur)lines.push(cur);}
      const w=Math.min(260,Math.max(...lines.map(l=>ctx.measureText(l).width))+20),h=9+lines.length*17,a=Math.min(1,(e.say.until-time)*3);
      let y;if(e.say.mon){const M=MON[e.type],MT=Math.max(M.h,(LH_BOSS.top||{})[e.type]||0);y=e.y-MT-46-h;}else y=e.data?e.y-128-seatOf(e.data.equipment):e.y-(e===AN?84:e.duckling?62:(e.sayH||108)); // v10.34: dân làng, con gái cũng nói
      if(!e.say.mon)y-=h-26;
      // bóng thoại đè nhau thì đẩy lên trên
      for(let k=0;k<6&&placed.some(r=>Math.abs(r.x-e.x)<(r.w+w)/2+4&&y<r.y+r.h+4&&y+h+4>r.y);k++)y-=31;placed.push({x:e.x,y,w,h});ctx.globalAlpha=a;
      const bg=e.say.mon?'#fff1dc':'#fff8e2';roundRect(ctx,e.x-w/2,y,w,h,9,bg);ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(e.x-6,y+h-1);ctx.lineTo(e.x,y+h+7);ctx.lineTo(e.x+6,y+h-1);ctx.fill();
      if(e.say.mon){ctx.strokeStyle=MON[e.type].boss===2?'#d070a8':'#c88040';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect?ctx.roundRect(e.x-w/2,y,w,h,9):ctx.rect(e.x-w/2,y,w,h);ctx.stroke();}
      ctx.fillStyle='#3a2a1a';ctx.textAlign='center';ctx.textBaseline='middle';lines.forEach((l,n)=>ctx.fillText(l,e.x,y+4.5+8.5+n*17,w-12));ctx.restore();}
  }

  /* ---------- Trò chuyện: NPC còn lời dặn thì nói chuyện, sau đó mở thẳng bảng chức năng ---------- */
  const PANEL_BTN={tg:'Sự kiện',shop:'Mua bán',quests:'Nhận việc',mercs:'Thuê lính',market:'Chợ',avatar:'Đổi diện mạo',fuse:'Dung hợp',nap:'Nạp thẻ',quiz:'Hỏi bài'};
  function nearby(){let best=null,bd=92;for(const n of World.npcs){const d=Math.hypot(n.x-hero.x,n.y-hero.y);if(d<bd){bd=d;best=n;}}return best;}
  function meet(n){
    route=[];targetNPC=null;
    if(tut&&tut.part===2&&tut.ph==='village'&&n.id==='elder'){tut2Elder(n);return;}
    if(tut&&tut.part===2&&tut.ph==='wake'&&n.id==='smith'&&tut.said.l3){tut2Smith();return;}
    if(n.id==='trong-tai-vo-dai'){duelAsk(n);return;}
    if(vitTalk(n))return;
    meetRest(n);
  }
  function meetRest(n){
    if(sqTalk(n))return;
    if(!seen.has(n.id)){keys.clear();joystick={x:0,y:0};holdAttack=false;dialogNPC=n;page=0;dialogEl.hidden=false;showLine();return;}
    window.GameUI?.openPanel(n);
  }
  function showLine(){
    const n=dialogNPC,lastPage=page===n.lines.length-1;
    $('#speaker').textContent=n.name;$('#line').textContent=n.lines[page];
    $('#page').innerHTML=n.lines.length>1?n.lines.map((_,i)=>`<i class="${i===page?'on':''}"></i>`).join(''):'';
    $('#next').innerHTML=svg(lastPage?'check':'next')+(lastPage?(n.btn||'Xong'):'Tiếp');
    {let box=document.getElementById('choices');if(!box){box=document.createElement('div');box.id='choices';box.className='choices';$('#line').after(box);}
      const ask=!!(n.choices&&lastPage);box.hidden=!ask;$('#next').hidden=ask;
      if(ask){box.innerHTML=n.choices.map((c,i)=>`<button type="button" data-i="${i}">${esc(c)}</button>`).join('');box.onclick=ev=>{const b=ev.target.closest('button');if(!b||dialogNPC!==n)return;dialogNPC=null;dialogEl.hidden=true;box.hidden=true;$('#next').hidden=false;canvas.focus();n.onChoice&&n.onChoice(+b.dataset.i);};}}
    const st=Player.storyAt(player,n.id);$('#shopBtn').hidden=!(lastPage&&(n.panel||st));$('#shopLabel').textContent=st?(st.state==='ready'?'Trả việc':st.state==='active'?'Việc đang làm':'Có việc nhờ'):PANEL_BTN[n.panel]||'Mở';
  }
  const wellCd=()=>(World.def&&World.def.event?(Number(CFG.tg_gieng_giay)||60):(Number(Player.CFG.gieng_hoi_giay)||300))*1000; // v10.46: giếng trong bản đồ sự kiện đầy lại nhanh hơn
  function nearWell(r=82){let best=null,bd=r;for(const o of World.wells){const d=Math.hypot(o.x-hero.x,o.y-hero.y);if(d<bd){bd=d;best=o;}}return best;}
  function useWell(o){
    route=[];targetWell=null;targetNPC=null;if(hero.dead)return;
    const left=(player.flags.wells[o.id]||0)-Date.now();
    if(left>0){const s=Math.ceil(left/1000);message(svg('water')+`Giếng cạn · nước về sau ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`);return;}
    const S=HD.tot,gain=Math.max(0,Math.round(S.hp-player.hp)),gm=Math.max(0,Math.round(S.mp-player.mana));player.hp=S.hp;player.mana=S.mp; // v10.46: hồi cả mana
    player.flags.wells[o.id]=Date.now()+wellCd();
    hero.facing=o.x<hero.x?-1:1;floater(hero.x,hero.y-70-seatH(),'+'+gain,'#7fe0b0',16);if(gm)floater(hero.x+26,hero.y-52-seatH(),'+'+gm,'#8fc8ff',14);burst(o.x,o.y-30,'#9fdcff',26,170);burst(hero.x,hero.y-30,'#9fe8a8',16,120);
    message(svg('heart')+'Uống nước giếng cổ · hồi đầy máu và mana');keepLocal();window.GameUI?.refresh();
  }
  function interact(){if(!overlayEl.hidden)return;if(dialogNPC){nextLine();return;}if(caveTouch()||hqTouch())return;const n=nearby();if(n){meet(n);return;}const w=nearWell();if(w)useWell(w);}
  function endDialog(save=true){if(!dialogNPC)return;if(dialogNPC.tut){const f=dialogNPC.onEnd;dialogNPC=null;dialogEl.hidden=true;canvas.focus();if(f)f();return;}seen.add(dialogNPC.id);dialogNPC=null;dialogEl.hidden=true;window.GameUI?.refresh();canvas.focus();if(save)checkpoint();}
  function nextLine(){if(!dialogNPC)return;if(dialogNPC.choices&&page===dialogNPC.lines.length-1)return;if(page<dialogNPC.lines.length-1){page++;showLine();}else endDialog();}
  function goTo(pt){
    if(busy()||hero.dead)return;
    if(caveTouch(pt)||hqTouch(pt))return;
    const st=Player.stance(player),d=ATK[st.type];
    const m=monsters.find(o=>!o.dead&&Math.hypot(o.x-pt.x,(o.y-MON[o.type].h*.5)-pt.y)<MON[o.type].r+16);
    if(m&&lockOn&&isRanged(st.type)){hero.lockT=m;cast('normal');return;}
    if(m){mouseAim={x:m.x,y:m.y-MON[m.type].h*.5,t:time};if(Math.hypot(m.x-hero.x,m.y-hero.y)<(d.range||80)+MON[m.type].r){cast('normal');return;}}
    targetWell=null;
    const wl=!m&&World.wells.find(o=>Math.abs(o.x-pt.x)<40&&pt.y<o.y+8&&pt.y>o.y-100);
    if(wl){if(Math.hypot(wl.x-hero.x,wl.y-hero.y)<82){useWell(wl);return;}const wp=World.findPath(hero,{x:wl.x,y:wl.y+40});if(wp){route=wp;targetNPC=null;targetWell=wl;canvas.focus();}return;}
    const n=World.npcs.find(n=>Math.hypot(n.x-pt.x,n.y-26-pt.y)<36||(Math.abs(n.x-pt.x)<22&&Math.abs(npcMarkY(n)-pt.y)<22));
    if(n&&Math.hypot(n.x-hero.x,n.y-hero.y)<92){meet(n);return;}
    const target=n?{x:n.x,y:n.y+40}:m?{x:m.x,y:m.y}:pt,path=World.findPath(hero,target);
    if(!path)return;
    route=path;targetNPC=n||null;canvas.focus();if(n&&n.panel==='market')window.GameUI?.prefetchMarket(); // v10.12: hỏi thương nhân trước khi tới nơi
  }
  function screenPoint(x,y){return {x:x/scale+camera.x,y:y/scale+camera.y};}
  const save=()=>flush();
  // v10.21: quái thu phục hết thời gian (theo Trí tuệ lúc thu phục) thì bỏ đi; máy chủ cũng tự bỏ khi lưu
  function petExpire(){const now=Date.now(),gone=(player.pets||[]).filter(x=>x.exp>0&&x.exp<=now);if(!gone.length)return;
    player.pets=player.pets.filter(x=>!(x.exp>0&&x.exp<=now));for(const x of gone){const e=allies.find(a=>a.key===x.pid);if(e){burst(e.x,e.y-20,EL.demon.color,16,140);floater(e.x,e.y-MON[x.type].h-14,'Bỏ đi',EL.demon.glow,13);}message(svg('demon')+(MON[x.type]?MON[x.type].name:'Quái')+' hết thời gian thu phục, đã bỏ đi');}syncMerc();window.GameUI?.refresh();}
  function update(dt){
    if((sceneTick=(sceneTick||0)+1)%45===0)musicScene();
    const nowSafe=World.isSafe(hero.x,hero.y);if(nowSafe!==safe){safe=nowSafe;hero.mountAct=null;refreshHD();window.GameUI?.refresh();if(safe){LH_Audio.play('safe');message(svg('shield')+'Vào vùng an toàn');checkpoint();}musicScene();}
    if(time-hdAt>.25){hdAt=time;refreshHD();petExpire();const k=allyKey();if(k!==lastAllyKey){lastAllyKey=k;syncMerc();}if(safe)reviveAtVillage();}
    const S=HD.tot;
    if(!hero.dead){player.mana=Math.min(S.mp,player.mana+S.mpReg*dt);player.hp=Math.min(S.hp,player.hp+(S.hpReg+(HD.fx.heal?S.hp*HD.fx.heal/100:0))*dt);}
    player.hp=Math.min(player.hp,S.hp);player.mana=Math.min(player.mana,S.mp);
    if(HD.fx.shield&&time>hero.shieldAt){hero.shieldAt=time+10;hero.shieldHp=Math.round(S.hp*HD.fx.shield/100);}else if(!HD.fx.shield)hero.shieldHp=0;
    if(time-sync.keptAt>(localDirty?1.5:3))keepLocal(true);
    World.bridges.forEach((B,i)=>{const sd=hero.x<B.x0*T?'w':hero.x>(B.x1+1)*T?'e':bridgeSide[i];if(sd!==bridgeSide[i]){const was=bridgeSide[i];bridgeSide[i]=sd;if(was)checkpoint();}});
    if(time-prefAt>1){prefAt=time;for(const P of World.portals)if(Math.hypot((P.x+.5)*T-hero.x,(P.y+.5)*T-hero.y)<T*9)World.prefetch(P.to);}
    {const P=World.portalAt(hero.x,hero.y);if(!P)portalArmed=true;else if(portalArmed&&!travelling&&!hero.dead){portalArmed=false;const lk=Player.mapLock(player,P.to);if(lk)message(svg('lock')+lk.msg+' để vào '+(P.label||(LH_MAPS[P.to]&&LH_MAPS[P.to].name)||''),4);else{checkpoint();travel(P.to,P.tx,P.ty);}}}
    updateNPCs(dt);updateProjectiles(dt);updateMonsters(dt);tgTick(dt);updateAllies(dt);updateBots(dt);botRunEvent();hqTick(dt);if(tutPending&&time>1.5&&!busy()){tutPending=false;if(tutOn())tutStart();else if(tut2On())tut2Resume();}if(tut)tutUpdate(dt);if(cave)caveUpdate(dt);caveGossip();pkTick(dt);updateDbf(dt);if(((time*4)|0)!==((time-dt)*4|0))evTick();updateStrikes();updateVillage(dt);updateEffects(dt);
    const a=hero.attack;
    if(a){const p=(time-a.start)/a.dur;while(a.hitIdx<a.cycles&&p>=(a.hitIdx+a.hit)/a.cycles){resolveAttack(a,a.hitIdx);a.hitIdx++;}if(p>=1)hero.attack=null;}
    const ma=hero.mountAct;
    if(ma){const p=(time-ma.start)/ma.dur;if(ma.type==='tiger'&&p<ma.hit&&!hero.dead){const sp=330*dt;World.move(hero,ma.aim.x*sp,ma.aim.y*sp);}if(!ma.done&&p>=ma.hit){ma.done=true;mountStrike(ma);}if(p>=1)hero.mountAct=null;}
    hero.moving=false;
    if(hero.dead){if(time>hero.dead)respawn();return;}
    if(busy())return;
    if((holdAttack||keys.has(' '))&&!hero.attack)cast('normal',true);
    const sf=(1+(S.moveSpd+(time<hero.hasteUntil?HD.fx.haste||0:0))/100)*(hazard()==='slow'?.7:1); // v10.13: đầm lầy làm chậm 30%
    const mv=frozen()?{x:0,y:0,len:0}:moveVector();let vx=mv.x,vy=mv.y;if(frozen())route=[];
    if(mv.len>.05){route=[];targetNPC=null;const d=Math.max(1,mv.len);vx/=d;vy/=d;}
    else if(route.length){
      const next=route[0],dx=next.x-hero.x,dy=next.y-hero.y,d=Math.hypot(dx,dy);
      if(d<4){route.shift();vx=vy=0;if(!route.length&&targetNPC){if(Math.hypot(targetNPC.x-hero.x,targetNPC.y-hero.y)<92)meet(targetNPC);targetNPC=null;}if(!route.length&&targetWell){if(Math.hypot(targetWell.x-hero.x,targetWell.y-hero.y)<82)useWell(targetWell);targetWell=null;}}
      else{vx=dx/d;vy=dy/d;const maxStep=155*sf*dt;if(d<maxStep){vx*=d/maxStep;vy*=d/maxStep;}}
    }
    const cur=hero.attack,slow=cur?(cur.type==='block'?.45:.72):1,speed=155*slow*sf;
    const ox=hero.x,oy=hero.y;World.move(hero,vx*speed*dt,vy*speed*dt);
    const moved=Math.hypot(hero.x-ox,hero.y-oy);hero.moving=moved>.05;if(hero.moving){const w0=hero.walk;hero.walk+=moved*.09/Math.max(1,sf*(seatH()?1.3:1));
      if(Math.floor(hero.walk/Math.PI)!==Math.floor(w0/Math.PI)){const wk=player.equipment.wings&&LH_Look.of(player.equipment.wings.type);LH_Audio.play(seatH()?'hoof':wk&&wk.kind==='wings'?'glide':'step');}}
    const len=Math.hypot(vx,vy),mouseOn=mouseAim&&time-mouseAim.t<3;
    if(!cur){
      if(mouseOn){const dx=mouseAim.x-hero.x,dy=mouseAim.y-(hero.y-20),l=Math.hypot(dx,dy)||1;hero.aim={x:dx/l,y:dy/l};if(Math.abs(dx)>4)hero.facing=dx<0?-1:1;}
      else if(len>.05){hero.aim={x:vx/len,y:vy/len};if(Math.abs(vx)>.05)hero.facing=vx<0?-1:1;}
    }
    if(route.length&&!hero.moving&&len>.1){route=[];targetNPC=null;}
    const desiredX=clamp(hero.x-width/scale/2,0,Math.max(0,W*T-width/scale)),desiredY=clamp(hero.y-height/scale/2,0,Math.max(0,H*T-height/scale));camera.x+=(desiredX-camera.x)*(1-Math.exp(-dt*8));camera.y+=(desiredY-camera.y)*(1-Math.exp(-dt*8));
    for(const B of World.bridges)if(B.flag&&!player.flags[B.flag]&&hero.x>(B.x1+1)*T){player.flags[B.flag]=true;message(svg('bridge')+(B.msg||'Đã qua cầu'));window.GameUI?.refresh();}
  }
  function drawFX(){
    for(const pr of projectiles){
      ctx.save();ctx.translate(pr.x,pr.y);ctx.rotate(Math.atan2(pr.vy,pr.vx));
      if(pr.kind==='orb'){const col=pr.el?EL[pr.el].color:'#a6baff';ctx.shadowColor=col;ctx.shadowBlur=14;ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,6.5,0,PI2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(1,-1,2.4,0,PI2);ctx.fill();}
      else if(pr.kind==='arrow'){line(ctx,[-24,0,10,0],'#f0e3bd',2);ctx.fillStyle='#cfd5d8';ctx.beginPath();ctx.moveTo(10,-3.5);ctx.lineTo(17,0);ctx.lineTo(10,3.5);ctx.fill();line(ctx,[-24,-4,-18,0,-24,4],'#c8553f',2);if(pr.el)line(ctx,[-40,0,-26,0],EL[pr.el].color+'99',3);}
      else{ctx.globalAlpha=.35;line(ctx,[-46,0,-14,0],pr.el?EL[pr.el].color:'#fff4cf',3);ctx.globalAlpha=1;line(ctx,[-14,0,8,0],'#d8d0b0',3);ctx.fillStyle='#bfc6c9';ctx.beginPath();ctx.moveTo(8,-4);ctx.lineTo(15,0);ctx.lineTo(8,4);ctx.fill();}
      ctx.restore();
    }
    for(const e of fx){
      const k=e.age/e.life;ctx.save();ctx.globalAlpha=1-k;ctx.strokeStyle=e.color;ctx.lineCap='round';
      if(e.kind==='ring'){ctx.lineWidth=e.lw*(1-k*.6);ctx.beginPath();ctx.ellipse(e.x,e.y,lerp(e.r0,e.r1,k),lerp(e.r0,e.r1,k)*.55,0,0,PI2);ctx.stroke();}
      else if(e.kind==='arc'){ctx.lineWidth=7*(1-k);ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1+k*.15),e.ang-e.arc/2,e.ang+e.arc/2);ctx.stroke();}
      else if(e.kind==='thrust'){const ux=Math.cos(e.ang),uy=Math.sin(e.ang);ctx.lineWidth=5*(1-k);ctx.beginPath();ctx.moveTo(e.x+ux*30,e.y+uy*30);ctx.lineTo(e.x+ux*(e.len+10),e.y+uy*(e.len+10));ctx.stroke();ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(e.x+ux*40-uy*7,e.y+uy*40+ux*7);ctx.lineTo(e.x+ux*e.len-uy*3,e.y+uy*e.len+ux*3);ctx.stroke();}
      else if(e.kind==='sky'){ctx.shadowColor=e.glow;ctx.shadowBlur=18;ctx.lineJoin='round';for(const [w,col] of [[6,e.color],[2.4,'#ffffff']]){ctx.strokeStyle=col;ctx.lineWidth=w*(1-k*.5);ctx.beginPath();ctx.moveTo(e.pts[0],e.pts[1]);for(let i=2;i<e.pts.length;i+=2)ctx.lineTo(e.pts[i],e.pts[i+1]);ctx.stroke();}}
      else if(e.kind==='bolt'){ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(e.x1,e.y1);for(let i=1;i<6;i++){const t=i/6;ctx.lineTo(lerp(e.x1,e.x2,t)+(Math.random()-.5)*14,lerp(e.y1,e.y2,t)+(Math.random()-.5)*14);}ctx.lineTo(e.x2,e.y2);ctx.stroke();}
      ctx.restore();
    }
    for(const q of particles){ctx.globalAlpha=1-q.age/q.life;ctx.fillStyle=q.color;ctx.fillRect(q.x-q.size/2,q.y-q.size/2,q.size,q.size);}ctx.globalAlpha=1;
    const noStroke=PERF.lv>=2;for(const f of floaters){ctx.globalAlpha=1-Math.max(0,f.age/f.life-.4)/.6;ctx.font=`700 ${f.size}px system-ui`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#1a120ccc';const off=f.icon?f.size*.45:0;if(!noStroke)ctx.strokeText(f.text,f.x-off,f.y);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x-off,f.y);if(f.icon){const w=ctx.measureText(f.text).width;drawCoinIcon(f.x-off+w/2+f.size*.55,f.y-f.size*.35,f.icon,f.size*.4);}}ctx.globalAlpha=1;
  }
  /* ---------- v10.66: ảnh đệm cảnh vật — cây, đá, nhà, tường… vẽ một lần vào canvas nhỏ rồi dán lại mỗi khung hình ----------
     Mỗi cây tre vẽ sống tốn ~33 nét; một màn hình Rừng Trúc hơn 1 000 nét / khung chỉ cho cây. Dán ảnh đệm thì mỗi cây là 1 lệnh drawImage.
     Cây, cỏ đung đưa: nghiêng ảnh theo gió (transform) thay vì vẽ lại. Vật có lửa / cờ bay (SPR_LIVE) vẫn vẽ sống. Hết hạn mức bộ nhớ thì vẽ sống như cũ. */
  const SPR={map:new Map(),bytes:0,cv:null,cx:null,k:1,res:'',made:0,taint:{}};
  const SPR_LIVE={lantern:1,torch:1,crystal:1,brazier:1,flag:1,banner:1,fire:1,well:1,'hq-cage':1};
  const SPR_SWAY={tree:1,grass:1,banyan:.5,bamboo:1};
  const sprKey=o=>o.kind+'|'+(o.seed||0)+'|'+(o.w||0)+'|'+(o.h||0)+'|'+(o.dry?1:0)+'|'+(o.style||'')+'|'+(o.v||o.var||o.type||'');
  function sprReset(){SPR.taint={};SPR.map.clear();if(typeof MSPR!=='undefined')MSPR.clear();if(typeof HSPR!=='undefined')HSPR.clear();SPR.bytes=0;}
  // vẽ vật o (gốc tại chân vật ox,oy) bằng hàm draw(c) lên canvas đo, tìm khung thật rồi dựng ảnh đệm ở độ phân giải k
  function sprMake(o,draw,ox,oy,tt=0,cat='obj'){
    if(SPR.taint[cat])return null; // v10.67: nhóm này từng dính ảnh khác nguồn (Drive) → không đệm nữa, vẽ sống
    // đo khung ở 1/4 cỡ (canvas 200×150, quét ~30 000 điểm — rẻ) rồi mới dựng ảnh thật
    const k=SPR.k,Q=4;if(!SPR.cv){SPR.cv=document.createElement('canvas');SPR.cv.width=200;SPR.cv.height=150;SPR.cx=SPR.cv.getContext('2d',{willReadFrequently:true});}
    const mc=SPR.cx,MX=100,MY=125;mc.setTransform(1/Q,0,0,1/Q,0,0);mc.clearRect(0,0,200*Q,150*Q);mc.save();mc.translate(MX*Q-ox,MY*Q-oy);
    const real=ctx,t0=time;ctx=mc;time=tt;SPR.baking=true;try{draw(mc);}catch(e){ctx=real;time=t0;SPR.baking=false;mc.restore();return null;}ctx=real;time=t0;SPR.baking=false;mc.restore();
    // v10.67: Safari / iOS: canvas đã vẽ ảnh khác nguồn (ảnh Drive của trang bị, NPC) thì getImageData ném SecurityError "The operation is insecure" → bỏ canvas đo, nhóm này vẽ sống
    let d;try{d=mc.getImageData(0,0,200,150).data;}catch(e){SPR.cv=null;SPR.cx=null;SPR.taint[cat]=true;return null;}let x0=200,y0=150,x1=-1,y1=-1;
    for(let y=0;y<150;y++){let row=y*200*4+3;for(let x=0;x<200;x++,row+=4)if(d[row]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
    if(x1<0)return {empty:true};
    if(x0<=0||y0<=0||x1>=199||y1>=149)return null; // tràn khung đo (vật quá to / rộng): vẽ sống
    x0=(x0-1)*Q;y0=(y0-1)*Q;x1=(x1+2)*Q;y1=(y1+2)*Q;const w=x1-x0,h=y1-y0;
    const cv=document.createElement('canvas');cv.width=Math.ceil(w*k);cv.height=Math.ceil(h*k);const c=cv.getContext('2d');c.setTransform(k,0,0,k,0,0);c.translate(-(x0-MX*Q)-ox,-(y0-MY*Q)-oy);
    ctx=c;time=tt;SPR.baking=true;try{draw(c);}finally{ctx=real;time=t0;SPR.baking=false;}
    SPR.bytes+=cv.width*cv.height*4;
    return {cv,dx:x0-MX*Q,dy:y0-MY*Q,w,h,up:MY*Q-y0};
  }
  function sprDraw(o,draw,ox,oy,sway){
    const key=sprKey(o);let sp=SPR.map.get(key);
    if(sp===undefined){if(SPR.made>=3){draw(ctx);return;}SPR.made++;sp=SPR.bytes<56e6?sprMake(o,draw,ox,oy):null;SPR.map.set(key,sp);} // tối đa 5 ảnh mới mỗi khung hình, khỏi khựng
    if(sp===null){draw(ctx);return;}if(sp.empty)return;
    if(sway){ctx.save();ctx.translate(ox,oy);ctx.transform(1,0,-sway/Math.max(20,sp.up),1,0,0);ctx.drawImage(sp.cv,sp.dx,sp.dy,sp.w,sp.h);ctx.restore();}
    else ctx.drawImage(sp.cv,ox+sp.dx,oy+sp.dy,sp.w,sp.h);
  }
  function sprRes(){const k=PERF.lv>=2?1:Math.min(2,(devicePixelRatio||1)*scale),r=k.toFixed(2);if(r!==SPR.res){SPR.res=r;SPR.k=k;sprReset();}}
  // vật cảnh trong danh sách vẽ: ảnh đệm nếu được, không thì vẽ sống như trước
  function drawScenery(o){
    const A=LH_ART.obj[o.kind];
    if(A){if(SPR_LIVE[o.kind]){A(ctx,o,time);return;}const sw=SPR_SWAY[o.kind]?Math.sin(time*.9+(o.seed||0))*1.4*SPR_SWAY[o.kind]:0;sprDraw(o,c=>A(c,o,0),o.x,o.y,sw);return;}
    if(o.kind==='tree'){const sw=Math.sin(time*1.2+(o.seed||0))*2;sprDraw(o,()=>tree(o),o.x,o.y,sw);}
    else if(o.kind==='house')sprDraw(o,()=>house(o),o.x*T,o.foot,0);
    else if(o.kind==='banyan')sprDraw(o,()=>banyan(o),o.x,o.y,Math.sin(time)*1);
    else if(o.kind==='well')well(o);else if(o.kind==='fire')campfire(o);else if(o.role)drawNPCQ(o);else if(o.build)drawBuilding(o);else drawMonster(o);
  }
  // v10.66: chế độ tiết kiệm — người chơi ảo, lính, dân làng vẽ sẵn vào ảnh đệm theo pha (đứng yên / bước đi); đang ra đòn, trúng đòn, đỡ, cưỡi thú nhảy… thì vẽ sống
  const HSPR=new Map();
  const eqSig=eq=>Player.slots.map(k=>{const i=eq&&eq[k];return i?i.type+':'+(i.q||'')+':'+(i.lv||i.enh||0):'';}).join(',');
  function walkQ(g){return (Math.round((((g%PI2)+PI2)%PI2)/(PI2/6))%6)*(PI2/6);}
  function timeQ(mv){return mv||PERF.lv>=2?0:Math.round(time)%4;} // đứng yên: 4 pha (mỗi giây một pha) · đang đi: chỉ theo bước chân · cực tiết kiệm: đứng im
  function drawHeroQ(c,e,st,el,t,opts){
    const who=opts.who;
    if(PERF.lv<1||e===hero||e.dead||e.attack||t<e.blockUntil||t<e.barrierUntil||t-e.hurt<.2||e.mountAct||opts.mask||!who){drawHero(c,e,st,el,t,opts);return;}
    const mv=!!e.moving,gq=mv?walkQ(e.walk):0,tq=timeQ(mv),key='H|'+(e.key||'')+'|'+who.name+'|'+(who.avatar||'')+'|'+who.gender+'|'+eqSig(who.equipment)+'|'+(safe?1:0)+(mv?1:0)+'|'+gq.toFixed(2)+'|'+tq;
    let sp=HSPR.get(key);
    if(sp===undefined){if(SPR.made>=3){drawHero(c,e,st,el,t,opts);return;}SPR.made++;if(SPR.bytes>56e6)sprReset();
      const hh=Object.create(e);hh.x=0;hh.y=0;hh.facing=1;hh.walk=gq;hh.moving=mv;hh.hurt=-9;sp=sprMake(hh,c2=>drawHero(c2,hh,st,el,tq,{...opts,label:false}),0,0,tq,'hero');HSPR.set(key,sp);}
    if(!sp){drawHero(c,e,st,el,t,opts);return;}
    if(!sp.empty){c.save();c.translate(e.x,e.y);c.scale(e.facing,1);c.drawImage(sp.cv,sp.dx,sp.dy,sp.w,sp.h);c.restore();}
    if(opts.label!==false)label(e.name,e.x,e.y-(64+seatOf(who.equipment)),opts.labelColor||'#fff2d1',null);
  }
  function drawNPCQ(n){
    if(PERF.lv<1||n.panel==='fuse'||LH_IMG.pic('npc:'+n.id)){drawNPC(n);return;}
    const mv=!!n.moving,gq=mv?walkQ(n.walk):0,tq=timeQ(mv),key='N|'+n.id+'|'+n.role+'|'+(n.phase||'')+'|'+(mv?1:0)+'|'+gq.toFixed(2)+'|'+tq;
    let sp=HSPR.get(key);
    if(sp===undefined){if(SPR.made>=3){drawNPC(n);return;}SPR.made++;if(SPR.bytes>56e6)sprReset();
      const nn=Object.create(n);nn.x=0;nn.y=0;nn.facing=1;nn.walk=gq;nn.moving=mv;sp=sprMake(nn,()=>drawNPC(nn),0,0,tq,'npc');HSPR.set(key,sp);}
    if(!sp){drawNPC(n);return;}if(sp.empty)return;
    ctx.save();ctx.translate(n.x,n.y);ctx.scale(n.facing,1);ctx.drawImage(sp.cv,sp.dx,sp.dy,sp.w,sp.h);ctx.restore();
    label(n.name,n.x,n.y-(n.role==='wizard'?82:n.role==='guide'||n.role==='trainer'||n.role==='merchant'?70:66),'#ecdfb9');
  }
  function render(){
    sprRes();SPR.made=0;ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(scale,scale);
    const sx=shakeAmp?(Math.random()-.5)*shakeAmp:0,sy=shakeAmp?(Math.random()-.5)*shakeAmp:0;
    ctx.translate(-camera.x+sx,-camera.y+sy);
    {const m=Math.ceil(shakeAmp)+2,gx=Math.max(0,Math.floor(camera.x-m)),gy=Math.max(0,Math.floor(camera.y-m)),gw=Math.min(ground.width-gx,Math.ceil(width/scale)+2*m+2),gh=Math.min(ground.height-gy,Math.ceil(height/scale)+2*m+2);if(gw>0&&gh>0)ctx.drawImage(ground,gx,gy,gw,gh,gx,gy,gw,gh);} // v10.66: chỉ vẽ phần nền đang thấy
    const TH=World.theme&&LH_ART.theme[World.theme],vx0=camera.x-300,vx1=camera.x+width/scale+160,vy0=camera.y-110,vy1=camera.y+height/scale+300;
    ctx.strokeStyle=TH&&TH.ripple||'#c8e0ca55';ctx.lineWidth=2;if(!(TH&&TH.still)&&PERF.lv<2)for(const R of World.ripples){const y=R.y;if(y*T<vy0||y*T>vy1)continue;if(y%2!==1||World.bridges.some(b=>y>=b.y0-1&&y<=b.y1+1))continue;const rx=(R.x+1.2)*T;ctx.beginPath();ctx.moveTo(rx+Math.sin(time+y)*9,y*T);ctx.lineTo(rx+25+Math.sin(time+y)*9,y*T);ctx.stroke();}
    tgDrawGround();
    if(route.length){ctx.fillStyle='#f3d58c99';for(let i=0;i<route.length;i+=2){ctx.beginPath();ctx.arc(route[i].x,route[i].y,3,0,PI2);ctx.fill();}const p=route[route.length-1];ctx.strokeStyle='#f3d58c';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,12+Math.sin(time*5)*2,6,0,0,PI2);ctx.stroke();}
    const st=Player.stance(player),el=Player.element(player);
    if(lockOn&&isRanged(st.type)&&hero.lockT&&!hero.lockT.dead){const m=hero.lockT,M=MON[m.type],r=M.r+10,pul=Math.sin(time*6)*2;ctx.save();ctx.strokeStyle='#ff6a4a';ctx.lineWidth=2;ctx.globalAlpha=.85;ctx.beginPath();ctx.ellipse(m.x,m.y+2,r+pul,(r+pul)*.42,0,0,PI2);ctx.stroke();const cy=m.y-M.h*.5;for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]])line(ctx,[m.x+ax*(r+4),cy+ay*(r+4),m.x+ax*(r+12),cy+ay*(r+12)],'#ff6a4a',2);ctx.restore();}
    if(st.type==='crossbow'&&!hero.dead){const ax=hero.aim.x,ay=hero.aim.y,ox=hero.x+ax*30,oy=hero.y-20-seatH()+ay*30;ctx.save();ctx.setLineDash([6,8]);ctx.globalAlpha=.55;line(ctx,[ox,oy,ox+ax*170,oy+ay*170],'#f6e3a8',1.5);ctx.setLineDash([]);ctx.beginPath();ctx.arc(ox+ax*180,oy+ay*180,6,0,PI2);ctx.stroke();ctx.restore();}
    const layers=[];
    for(const o of World.objects){const ox=o.kind==='house'?o.x*T:o.x,d=o.kind==='house'?o.foot:o.y;if(ox<vx0||ox>vx1||d<vy0||d>vy1)continue;layers.push([d,o]);}
    const vis=e=>e.x>vx0&&e.x<vx1&&e.y>vy0-160&&e.y<vy1; // v10.66: ngoài màn hình thì không vẽ
    for(const n of World.npcs)if(vis(n))layers.push([n.y,n]);for(const m of monsters)if(vis(m))layers.push([m.y,m]);if(TGM&&TGM.ours)for(const b of TGM.ours)if(vis(b))layers.push([b.y,b]);layers.push([hero.y,hero]);for(const e of allies)if(vis(e))layers.push([e.y,e]);for(const e of bots)if(!e.dead&&e.x>vx0&&e.x<vx1&&e.y>vy0&&e.y<vy1)layers.push([e.y,e]);if(AN&&AN.map===World.id)layers.push([AN.y,AN]);if(DUCK&&DUCK.map===World.id)layers.push([DUCK.y,DUCK]);if(VIT&&VIT.map===World.id)layers.push([VIT.y,VIT]);if(WK&&WK.map===World.id)layers.push([WK.y,WK]);if(OB&&OB.map===World.id&&OB.ph!=='gone'&&OB.ph!=='hide')layers.push([OB.y,OB]);{const cg=cageAt();if(cg)layers.push([cg.y,{kind:'hq-cage',x:cg.x,y:cg.y}]);}if(World.def.ambient==='village')for(const a of village.list)if(a.x>vx0&&a.x<vx1&&a.y>vy0&&a.y<vy1)layers.push([a.y,a]);
    layers.sort((a,b)=>a[0]-b[0]);
    for(const [,o] of layers){
      if(o===hero){if(hero.morph&&time<hero.morph.until&&!hero.dead)drawMorph();else drawHero(ctx,hero,st,el,time);drawDbf();if(hero.shieldHp>0){ctx.save();ctx.globalAlpha=.3+Math.sin(time*6)*.08;ctx.strokeStyle='#ffe9a8';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(hero.x,hero.y-24-seatH(),26,36,0,0,PI2);ctx.stroke();ctx.restore();}}
      else if(o.key&&o.data){const e=o;if(e.pet){drawPet(e);}else{drawHeroQ(ctx,e,Player.stance(e.data),null,time,{who:e.data,labelColor:e.fighter?(e.main?'#ffa898':'#e8c0b0'):e.bot?'#ffd9a8':e.tier&&e.tier!=='n'?(Player.RAR[e.tier]||{}).color||'#bfe3ff':'#bfe3ff',label:e.rob?!!e.lead:(e.bot||safe),mask:e.mask});const sh=seatOf(e.data.equipment);if(e.hp<e.max){roundRect(ctx,e.x-18,e.y-78-sh,36,4,2,'#0a120ecc');roundRect(ctx,e.x-18,e.y-78-sh,36*e.hp/e.max,4,2,e.hp<e.max*.3?'#e05a4a':'#7fd38a');}}}
      else if(o.amb)drawAmbient(o);
      else if(o.kind==='hq-cage')drawCage(o);
      else if(o===WK)drawWkMount(o);
      else if(o===OB)drawBut(o);
      else if(o.duckling)drawDuck(o);
      else if(o.kind==='vit-egg')drawEgg(o);
      else drawScenery(o);
    }
    drawFX();drawAdds();drawLoot();drawNPCMarks();drawWellMarks();drawPortalMarks();drawCave();drawHQ();drawSQ();drawSay();drawTutArrow();
    ctx.restore();
    // trời riêng của bản đồ (cát bay, tuyết rơi, bóng tối trong hang có đuốc, pha lê sáng)
    const SK=World.def.sky&&LH_ART.sky[World.def.sky];if(SK)try{SK(ctx,{q:PERF.lv,w:width,h:height,t:time,sc:scale,cam:camera,hx:(hero.x-camera.x)*scale,hy:(hero.y-24-camera.y)*scale,lights:World.lights,fires:World.fires,T})}catch(e){oops(e,'vẽ trời');}
    const boss=monsters.find(m=>!m.dead&&MON[m.type].boss&&(m.aggro>time||Math.hypot(m.x-hero.x,m.y-hero.y)<420));
    window.GameUI?.frame(time,{safe,boss:boss?{type:boss.type,name:MON[boss.type].name,hp:boss.hp,max:boss.max,final:MON[boss.type].boss===2}:null});
    if(time-(render.miniAt||0)>.15){render.miniAt=time; // v10.66: bản đồ nhỏ vẽ ~7 lần / giây là đủ
    mx.drawImage(miniGround,0,0);const kx=mini.width/(W*T),ky=mini.height/(H*T);mx.strokeStyle='#f2e5bd88';mx.lineWidth=1;mx.strokeRect(camera.x*kx,camera.y*ky,width/scale*kx,height/scale*ky);
    mx.fillStyle='#e6c47e';World.npcs.forEach(n=>mx.fillRect(n.x*kx-2,n.y*ky-2,4,4));World.wells.forEach(o=>{mx.fillStyle=(player.flags.wells[o.id]||0)>Date.now()?'#6a7a80':'#5fd0ff';mx.beginPath();mx.arc(o.x*kx,o.y*ky,2.6,0,PI2);mx.fill();});monsters.forEach(m=>{if(m.dead)return;const b=MON[m.type].boss;mx.fillStyle=b?'#ff5ad1':'#e0625a';const s=b?6:4;mx.fillRect(m.x*kx-s/2,m.y*ky-s/2,s,s);});
    for(const e of allies){mx.fillStyle=e.pet?'#d97ab0':'#8fd0ff';mx.fillRect(e.x*kx-2,e.y*ky-2,4,4);}
    for(const e of bots)if(!e.dead){mx.fillStyle='#ffd9a8';mx.fillRect(e.x*kx-1.5,e.y*ky-1.5,3,3);}
    mx.fillStyle='#fff6d5';mx.beginPath();mx.arc(hero.x*kx,hero.y*ky,3,0,PI2);mx.fill();}
    const pv=document.getElementById('preview');if(pv&&!overlayEl.hidden)drawPreview(pv);
  }
  // Tên vùng bên kia cổng, hiện khi lại gần
  function drawPortalMarks(){for(const P of World.portals){const cx=(P.x+(P.w||1)/2)*T,cy=(P.y+(P.h||1)/2)*T;if(Math.hypot(cx-hero.x,cy-hero.y)>260)continue;const nm=P.label||(LH_MAPS[P.to]&&LH_MAPS[P.to].name)||'';if(nm)label('\u{2192} '+nm,cx,(cy<T*3?cy+T*1.1:cy-30)+Math.sin(time*3)*2,'#ffe6a8');}}
  function drawPreview(pv){
    const ui=window.GameUI,el=ui&&ui.previewElem?ui.previewElem():Player.element(player),who=ui&&ui.previewWho?ui.previewWho():null,dpr=Math.min(2,devicePixelRatio||1),cw=pv.clientWidth||100,ch=pv.clientHeight||100;
    if(pv.width!==Math.round(cw*dpr)){pv.width=Math.round(cw*dpr);pv.height=Math.round(ch*dpr);}
    const c=pv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,cw,ch);
    const st=Player.stance(who||player),d=ATK[st.type],cyc=d.dur+1.1,ph=time%cyc,sh=seatOf((who||player).equipment),mounted=sh>0,k=ch/100*(mounted?(sh>30?.62:.9):1.15);
    const fake={x:cw/2-(mounted?2:6),y:ch*.86,facing:1,moving:false,walk:0,aim:{x:1,y:0},hurt:-9,blockUntil:0,barrierUntil:0,dead:0,name:'',attack:ph<d.dur?{type:st.type,skill:'normal',start:time-ph,dur:d.dur,aim:{x:1,y:0},hand:'right',stance:st}:null};
    c.save();c.translate(fake.x,fake.y);c.scale(k,k);c.translate(-fake.x,-fake.y);
    const b=ui&&ui.previewBurst?time-ui.previewBurst():9;
    if(el&&!who&&b<.9){c.save();c.globalAlpha=1-b/.9;c.strokeStyle=EL[el].glow;c.lineWidth=3;c.beginPath();c.ellipse(fake.x,fake.y-20,10+b*60,(10+b*60)*.7,0,0,PI2);c.stroke();c.restore();}
    drawHero(c,fake,st,who?null:el,time,{label:false,who:who||undefined,armed:true});c.restore();
  }
  function activateBurst(el){if(!el)return;const C=EL[el];fx.push({kind:'ring',x:hero.x,y:hero.y-10,r0:8,r1:90,color:C.color,age:0,life:.6,lw:5});burst(hero.x,hero.y-26,C.color,26,200);burst(hero.x,hero.y-26,C.glow,12,120);}
  // Vòng lặp: một khung hình lỗi không làm dừng game (ghi vào nhật ký Tình trạng, báo một dòng, chạy tiếp)
  let errAt=-99;
  function oops(e,where){LH_DIAG.error(e,where);if(time-errAt>8){errAt=time;message(svg('close')+'Lỗi '+where+': '+String(e&&e.message||e).slice(0,80));}}
  function loop(ms){
    if(window.LH_KICKED)return;requestAnimationFrame(loop);
    const raw=last?ms-last:0,dt=Math.min(.04,raw/1000);last=ms;time=ms/1000;perfTick(raw);
    const t1=performance.now();try{update(dt);}catch(e){oops(e,'cập nhật');}
    const t2=performance.now();try{render();}catch(e){oops(e,'vẽ');try{resize();}catch(_){}}
    const t3=performance.now();PERF.ums=(PERF.ums||0)*.95+(t2-t1)*.05;PERF.rms=(PERF.rms||0)*.95+(t3-t2)*.05;PERF.sum=(PERF.sum||0)+(t3-t1);PERF.cnt=(PERF.cnt||0)+1;
  }

  /* ---------- Điều khiển ---------- */
  // Chế độ chân dung: chỉ mượn bộ vẽ nhân vật (căn lều chọn nhân vật, chợ cho thuê), không chạy game
  if(session.portrait){
    safe=false;
    return {draw(c,who,x,y,k,t,el,opts={}){
      time=t;const st=Player.stance(who),fake={x,y,facing:opts.facing||1,moving:false,walk:0,aim:{x:1,y:0},hurt:-9,blockUntil:0,barrierUntil:0,dead:0,name:'',attack:null,mountAct:null};
      c.save();c.translate(x,y);c.scale(k,k);c.translate(-x,-y);drawHero(c,fake,st,el||null,t,{label:false,who,armed:true});c.restore();
    },seat:eq=>seatOf(eq)};
  }
  canvas.addEventListener('pointerdown',e=>{if(e.button&&e.button!==0)return;e.preventDefault();const r=canvas.getBoundingClientRect(),pt=screenPoint(e.clientX-r.left,e.clientY-r.top);if(e.pointerType==='mouse')mouseAim={x:pt.x,y:pt.y,t:time};goTo(pt);});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=canvas.getBoundingClientRect(),pt=screenPoint(e.clientX-r.left,e.clientY-r.top);mouseAim={x:pt.x,y:pt.y,t:time};});
  // Đọc vị trí phím (e.code) thay vì ký tự: bộ gõ tiếng Việt biến W thành ư, D thành đ… làm nhận sai nút
  const KEYMAP={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright',KeyE:'e',KeyB:'b',KeyT:'t',KeyH:'h',KeyJ:'j',KeyK:'k',KeyL:'l',Escape:'escape',Space:' '}; // v10.64: kỹ năng H J K L (bỏ phím số 1–4)
  const keyOf=e=>KEYMAP[e.code]||(e.key&&e.key.length===1?e.key.toLowerCase():String(e.key||'').toLowerCase());
  document.addEventListener('keydown',e=>{
    if(window.LH_KICKED)return;
    if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=keyOf(e);
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','escape',' ','h','j','k','l','b'].includes(k))e.preventDefault();
    // v10.64: Space — đang hội thoại thì sang lời tiếp, đứng cạnh NPC / giếng / vật tương tác thì nói chuyện, còn lại thì đánh (giữ để đánh liên tục)
    if(k===' '){if(!e.repeat&&overlayEl.hidden&&(dialogNPC||nearby()||nearWell())){interact();return;}if(!e.repeat&&overlayEl.hidden&&(caveTouch()||hqTouch()))return;keys.add(' ');if(!e.repeat)cast('normal');return;}
    if(['h','j','k','l'].includes(k)){if(!e.repeat)cast({h:'basic',j:'intermediate',k:'advanced',l:'mount'}[k]);return;}
    if(k==='b'&&!e.repeat){window.GameUI?.showBag();return;}
    if(k==='t'&&!e.repeat){toggleLock();return;}
    if(k==='e'&&!e.repeat)interact();else if(k==='escape'){if(dialogNPC&&dialogNPC.tut)endDialog();else if(dialogNPC){dialogNPC=null;dialogEl.hidden=true;checkpoint();}}else keys.add(k);
  });
  document.addEventListener('keyup',e=>{const k=keyOf(e);keys.delete(k);if(k===' ')keys.delete(' ');if(!e.code)keys.clear();});
  window.addEventListener('blur',()=>{keys.clear();stopPad();holdAttack=false;});
  $('#next').onclick=nextLine;
  $('#shopBtn').onclick=()=>{const n=dialogNPC;if(!n||!(n.panel||Player.storyAt(player,n.id)))return;endDialog(false);window.GameUI?.openPanel(n);};
  let padId=null;const pad=$('#pad');
  function padMove(e){if(e.pointerId!==padId)return;const r=pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,d=Math.max(36,Math.hypot(dx,dy));joystick={x:dx/d,y:dy/d};$('.knob').style.transform=`translate(${joystick.x*31}px,${joystick.y*31}px)`;}
  function stopPad(){padId=null;joystick={x:0,y:0};$('.knob').style.transform='';}
  pad.addEventListener('pointerdown',e=>{e.preventDefault();padId=e.pointerId;try{pad.setPointerCapture(padId);}catch(_){}padMove(e);});
  pad.addEventListener('pointermove',padMove);
  pad.addEventListener('pointerup',e=>{if(e.pointerId===padId)stopPad();});pad.addEventListener('pointercancel',e=>{if(e.pointerId===padId)stopPad();});pad.addEventListener('lostpointercapture',e=>{if(e.pointerId===padId)stopPad();});
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{last=0;keys.clear();stopPad();holdAttack=false;if(document.hidden)keepLocal(true);});
  window.addEventListener('pagehide',()=>{keepLocal(true);});
  groundDraw();perfApply(false);syncMerc();spawnBots();caveEnter();loadBotPool().then(()=>{if(botPool.length)spawnBots();});requestAnimationFrame(loop);
  /* ---------- Ảnh biểu tượng vật phẩm (công cụ tạo ảnh webp dùng): vẽ bằng đúng các hàm vẽ trên người ----------
     Vũ khí theo quy ước ảnh cầm tay: chéo 45°, tay cầm ở (14%, 86%) khung ảnh, ảnh rộng PIC_LEN/1.15 điểm thế giới. */
  const WREACH={sword:[-9,38],spear:[-30,48],staff:[-22,37],saber:[-11,50],mace:[-12,42]};
  function itemIcon(cv,type){
    const c=cv.getContext('2d'),N=cv.width,d=Player.items[type];c.clearRect(0,0,N,N);if(!d)return false;
    const L=LH_Look.of(type),kind=d.kind,T0=0;c.save();
    if(L&&L.fx){const [a,b]=LH_Look.FX[L.fx];const g=c.createRadialGradient(N/2,N/2,4,N/2,N/2,N*.5);g.addColorStop(0,a+'88');g.addColorStop(1,a+'00');c.fillStyle=g;c.fillRect(0,0,N,N);
      c.fillStyle=b;for(let i=0;i<9;i++){const x=N*(.15+.7*((i*37)%100)/100),y=N*(.12+.76*((i*53)%100)/100),r=1.5+(i%3);c.beginPath();c.moveTo(x,y-r*2);c.lineTo(x+r*.6,y-r*.6);c.lineTo(x+r*2,y);c.lineTo(x+r*.6,y+r*.6);c.lineTo(x,y+r*2);c.lineTo(x-r*.6,y+r*.6);c.lineTo(x-r*2,y);c.lineTo(x-r*.6,y-r*.6);c.closePath();c.fill();}}
    curLook=L;
    if(L&&L.fx)LH_Look.mythGlow(c,L);
    if((d.slot==='hand'||d.slot==='right'||d.slot==='left'||!d.slot&&WREACH[kind])&&WREACH[kind]){
      const s=PIC_LEN[kind]/1.15,k=N/s,[b0,b1]=WREACH[kind],B=-b0,Ab=.198*s,Af=1.216*s,g=Math.min(1,(Ab+Af)/(B+b1)),off=Ab-B*g;
      c.translate(.14*N,.86*N);c.scale(k,k);c.rotate(-Math.PI/4);c.translate(off,0);c.scale(g,g);
      if(kind==='sword')drawSword(c,null,d.tint);else if(kind==='saber')drawSaber(c,null,d.tint);else if(kind==='mace')drawMace(c,null,d.tint);else if(kind==='spear')drawSpear(c,null,d.tint);else drawStaff(c,null,0,T0,d.tint);
    }
    else if(kind==='shield'){c.translate(N*.46,N/2);c.scale(N/34,N/34);drawShield(c,false,false,T0,d.tint);}
    else if(kind==='bow'){c.translate(N/2,N/2);c.rotate(-Math.PI/4);c.scale(N/52,N/52);drawBow(c,0,true,null,d.tint);}
    else if(kind==='crossbow'){c.translate(N*.52,N/2);c.rotate(-Math.PI/4);c.scale(N/54,N/54);drawCrossbow(c,{string:6,bolt:true},null,d.tint);}
    else if(d.slot==='mount'){const b=d.beast||'horse',k=N/(b==='elephant'?110:b==='tiger'?92:b==='rua'?104:b==='phuong'?96:b==='cuuvi'?98:b==='thienma'?92:84);c.translate(N*.5,N*.86);c.scale(k,k);drawMount(c,{...d,tint:L&&(L.legend||L.fx)?d.tint:d.tint},false,0,T0);
      if(L&&L.legend){c.fillStyle=L.main;c.fillRect(-14,-36-(b==='elephant'?18:0),22,7);c.fillStyle=L.trim;c.fillRect(-14,-30-(b==='elephant'?18:0),22,1.6);}}
    else if(d.slot==='book'){const col=d.element&&EL[d.element]?EL[d.element].color:'#c9a43a';c.translate(N/2,N/2);c.rotate(-.12);c.scale(N/64,N/64);
      roundRect(c,-20,-24,40,48,4,shade(col,-.45));roundRect(c,-17,-24,37,46,3,col);c.fillStyle='#f4ead0';c.fillRect(-20,20,40,4);line(c,[-14,-24,-14,22],shade(col,-.5),2);
      c.save();c.shadowColor=col;c.shadowBlur=10;ell(c,3,-2,9,9,'#fff4d6');ell(c,3,-2,6,6,col);c.restore();for(let i=0;i<3;i++)line(c,[-8,12+i*3,14,12+i*3],shade(col,.4),1);}
    else if(kind==='ore'||!d.slot){c.translate(N/2,N*.62);c.scale(N/60,N/60);const cr=[[-10,0,-6,-24,0,0],[0,2,6,-30,12,2],[6,4,14,-14,20,4]];cr.forEach(([a,b,x,y,e,f],i)=>{poly(c,[a,b,x,y,e,f],['#8ab4c8','#a8d0e0','#7aa0b8'][i]);line(c,[x,y,(a+e)/2,(b+f)/2],'#ffffff88',1);});ell(c,4,4,18,4,'#5a5048');}
    else if(L){c.translate(N/2,N/2);c.scale(N/64,N/64);LH_Look.iconWear(c,L,T0);}
    c.restore();curLook=null;return true;
  }
  window.mapGame={itemIcon,travel,hero,player,camera,monsters,allies,adoptState:S=>adopt(S), // v10.71: cổng vào đối chiếu bản lưu đệm với máy chủ ngầm
    get sq(){return SQ;},get charId(){return session.charId;},get route(){return route;},get seen(){return [...seen];},get safe(){return safe;},get HD(){return HD;},now:()=>time,screenPoint,goTo,cast,message,activateBurst,svg,save,unsaved,checkpoint,server,op,refreshHD,syncMerc,
    hammer(color){let n=0;const t=setInterval(()=>{LH_Audio.play('anvil');burst(hero.x+hero.facing*14,hero.y-26,color||'#ffcf7a',6,140);if(color)fx.push({kind:'ring',x:hero.x,y:hero.y-20,r0:6,r1:46,color,age:0,life:.4,lw:3});else shake(2);if(++n>=3)clearInterval(t);},380);},
    levelUp,musicScene,
    setHold(v){holdAttack=!!v;},
    enhanceFx(ok){LH_Audio.play(ok?'enhanceOk':'enhanceFail');const c=ok?'#ffd77a':'#9aa0a6';fx.push({kind:'ring',x:hero.x,y:hero.y-20,r0:6,r1:ok?80:40,color:c,age:0,life:.5,lw:4});burst(hero.x,hero.y-24,c,ok?24:10,ok?200:90);},
    home(){if(World.id!==World.DEFAULT){travel(World.DEFAULT);return;}route=[];targetNPC=null;dialogNPC=null;dialogEl.hidden=true;keys.clear();joystick={x:0,y:0};hero.attack=null;hero.mountAct=null;projectiles.length=0;Object.assign(hero,World.spawn);allies.forEach((e,i)=>{e.x=hero.x+FORM[i%6][0];e.y=hero.y+FORM[i%6][1];if(!World.canStand(e.x,e.y)){e.x=hero.x;e.y=hero.y;}e.path=null;});resize();},
    // Chọn bản đồ (menu): về trạm nghỉ ở cổng vùng đó; thiếu cấp thì không đi
    async goto(id){
      const R=Player.REGIONS.find(r=>r.id===id),need=Player.mapLevel(id);if(!R||travelling)return false;
      if(hero.dead){message(svg('close')+'Đang gục, chưa đi được');return false;}
      {const lk=Player.mapLock(player,id);if(lk){message(svg('lock')+lk.msg+' để vào '+R.name,4);return false;}}
      if(id===World.DEFAULT){this.home();return true;}
      if(World.id===id){Object.assign(hero,World.spawn,{attack:null,mountAct:null});route=[];resize();message(svg('pin')+World.name);return true;}
      checkpoint();return travel(id);
    },
    get mapId(){return World.id;},
    get me(){return player;}, // v10.50: nhân vật hiện tại (player có thể được thay sau khi đồng bộ máy chủ)
    tgEnter,tgLeave,get tgm(){return TGM;}, // v10.46
    toggleLock,get lockOn(){return lockOn;},get bots(){return bots;},get tut(){return tut;},get cave(){return cave;},get pk(){return pk;},pkSpawn,get hq(){return {BT,AN,FW,SQ};},duelStart,taunt,botRun(){botRunAt=0;botRunEvent();},
    stop(){route=[];targetNPC=null;keys.clear();joystick={x:0,y:0};holdAttack=false;},
    closeDialog(){dialogNPC=null;dialogEl.hidden=true;}};
};
