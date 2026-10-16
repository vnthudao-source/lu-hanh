/* ================= VÒNG LẶP GAME (gọi startGame sau khi chọn nhân vật) ================= */
window.startGame=(session)=>{
  'use strict';
  const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d'),mini=document.getElementById('minimap'),mx=mini.getContext('2d'),overlayEl=document.getElementById('overlay'),dialogEl=document.getElementById('dialog');
  const {T,W,H,grid}=World,EL=Player.ELEMENTS,PI2=Math.PI*2,CFG=Player.CFG,MON=Player.MON;
  const player=session.player;
  const hero={...World.spawn,name:player.name,facing:1,moving:false,walk:0,aim:{x:1,y:0},attack:null,swing:0,blockUntil:0,barrierUntil:0,hurt:-9,lastHurt:-9,invuln:0,dead:0,mountAct:null,shieldHp:0,shieldAt:0,hasteUntil:0,counter:false,reviveAt:0,waveCount:0};
  if(session.pos)Object.assign(hero,session.pos);
  const camera={x:0,y:0},keys=new Set(),seen=new Set(session.seen||[]),projectiles=[],particles=[],floaters=[],fx=[];
  const monsters=World.monsterSpawns.filter(s=>MON[s.type]).map((s,i)=>{const x=(s.x+.5)*T,y=(s.y+.5)*T;return {id:i,type:s.type,hx:x,hy:y,x,y,hp:MON[s.type].hp,max:MON[s.type].hp,dead:false,deadAt:0,respawn:0,facing:-1,walk:0,moving:false,hurt:-9,aggro:-9,atk:null,cd:0,flee:0,wander:null,stunUntil:0,burn:null,burnAcc:0,leapCd:0,leap:null};});
  const ATK={
    punch:{dur:.32,hit:.5,range:50,arc:1.3,dmg:.55,kind:'melee',knock:40},
    sword:{dur:.46,hit:.45,range:76,arc:2.0,dmg:1,kind:'melee',knock:45},
    shield:{dur:.48,hit:.45,range:58,arc:1.3,dmg:.7,kind:'melee',knock:110},
    spear:{dur:.56,hit:.5,range:112,width:26,dmg:1.15,kind:'thrust',knock:60},
    staff:{dur:.62,hit:.56,speed:400,dmg:1.05,kind:'orb',range:420,splash:46},
    bow:{dur:.7,hit:.62,speed:640,dmg:1.1,kind:'arrow',range:520},
    crossbow:{dur:.85,hit:.22,speed:880,dmg:1.3,kind:'bolt',range:600,pierce:1}
  };
  // Lấy sát thương, tầm đánh, độ lan, tốc đánh theo bảng loại vũ khí (Sheet vu_khi)
  for(const [k,d] of Object.entries(ATK)){const w=Player.WEAPONS[k];if(!w)continue;d.dmg=w.dmg;d.range=w.range;d.dur=w.dur;
    if(d.kind==='melee'&&w.spread)d.arc=w.spread*Math.PI/180;else if(d.kind==='thrust'&&w.spread)d.width=w.spread;else if(d.kind==='orb')d.splash=w.spread;else if(d.kind==='bolt')d.pierce=Math.round(w.spread);}
  // 4 kỹ năng mặc định: đánh thường · combo (3 đòn) · diện rộng · liên hoàn (5 đòn + nổ)
  const SK={normal:{mul:1,dur:1,cycles:1},basic:{mul:.85,dur:.7,cycles:3},intermediate:{mul:1.15,dur:1.2,cycles:1,multi:3,nova:130},advanced:{mul:.75,dur:.55,cycles:5,nova:160,finale:2}};
  const NPC_IDS=World.npcs.map(n=>n.id);
  let width=0,height=0,scale=1,route=[],targetNPC=null,targetWell=null,dialogNPC=null,page=0,last=0,time=0,toastTimer,joystick={x:0,y:0},holdAttack=false,mouseAim=null,shakeAmp=0,manaWarnAt=-9;
  let lastAllyKey='',safe=World.isSafe(hero.x),HD=Player.derive(player,{safe}),hdAt=-1,nextSave=60;
  const ground=document.createElement('canvas'),miniGround=document.createElement('canvas');
  hero.name=player.name;
  const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,seg=(p,a,b)=>clamp((p-a)/(b-a),0,1),E=t=>t<.5?2*t*t:1-((-2*t+2)**2)/2;
  const svg=id=>`<svg class="icon"><use href="#i-${id}"/></svg>`;
  // Thông báo ngắn: icon + vài chữ/số
  function message(html){$('#toast').innerHTML=html;$('#toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.opacity=0,2400);}
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
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const v=grid[y][x],n=(x*37+y*71)%9,east=x>=World.riverX(y)+3;
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
    // Ao sen
    for(let i=0;i<14;i++){const px=2*T+12+(i*37)%126,py=9*T+12+(i*53)%170;c.fillStyle='#3f7a46';c.beginPath();c.arc(px,py,9+(i%3)*2,.4,PI2-.2);c.lineTo(px,py);c.fill();if(i%3===0){c.fillStyle='#f0a6bd';c.beginPath();for(let k=0;k<5;k++){const a=k*1.256;c.ellipse(px+3+Math.cos(a)*3,py-3+Math.sin(a)*3,3,2,a,0,PI2);}c.fill();ell(c,px+3,py-3,2,2,'#f6e27a');}}
    c.strokeStyle='#6b5a3c';c.lineWidth=3;c.strokeRect(2*T-2,9*T-2,3*T+4,4*T+4);
    // Sân gạch trước làng (gạch bát đỏ)
    const sx0=13.2*T,sy0=17.1*T,sw=4.6*T,sh=2.8*T;c.fillStyle='#b5674a';c.fillRect(sx0,sy0,sw,sh);
    c.strokeStyle='#97513a';c.lineWidth=1.5;for(let gx=sx0;gx<=sx0+sw;gx+=24){c.beginPath();c.moveTo(gx,sy0);c.lineTo(gx,sy0+sh);c.stroke();}for(let gy=sy0;gy<=sy0+sh;gy+=24){c.beginPath();c.moveTo(sx0,gy);c.lineTo(sx0+sw,gy);c.stroke();}
    c.strokeStyle='#7d4330';c.lineWidth=4;c.strokeRect(sx0,sy0,sw,sh);
    // Cầu tre — lối duy nhất qua sông
    const bx0=World.BRIDGE.x0*T,bx1=(World.BRIDGE.x1+1)*T,by0=World.ROAD.y0*T,by1=(World.ROAD.y1+1)*T;
    c.fillStyle='#a68a52';c.fillRect(bx0,by0,bx1-bx0,by1-by0);
    c.strokeStyle='#7f6a3c';c.lineWidth=2;for(let x=bx0;x<=bx1;x+=7){c.beginPath();c.moveTo(x,by0);c.lineTo(x,by1);c.stroke();}
    for(const ry of [by0-3,by1-3]){c.fillStyle='#b9a75a';c.fillRect(bx0,ry,bx1-bx0,5);c.fillStyle='#8a7a3c';for(let x=bx0;x<bx1;x+=32)c.fillRect(x,ry,2,5);}
    c.fillStyle='#7a6a34';for(let x=bx0;x<=bx1;x+=T){c.fillRect(x-3,by0-8,6,12);c.fillRect(x-3,by1-6,6,12);}
    miniGround.width=mini.width;miniGround.height=mini.height;miniGround.getContext('2d').drawImage(ground,0,0,mini.width,mini.height);
  }
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);width=r.width;height=r.height;canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);scale=width<700?.95:1.1;camera.x=clamp(hero.x-width/scale/2,0,Math.max(0,W*T-width/scale));camera.y=clamp(hero.y-height/scale/2,0,Math.max(0,H*T-height/scale));}

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
  function npcLegs(c,n,col){const s=n.moving?Math.sin(n.walk)*4:0;line(c,[-3,-6,-4-s,6],col,5);line(c,[3,-6,4+s,6],col,5);ell(c,-4-s+1,6,4,2,'#2e241a');ell(c,4+s+1,6,4,2,'#2e241a');}
  function head(c,skin,hair,beard){ell(c,0,-35,10.5,11,skin);if(hair)ell(c,-1,-42,11.5,6,hair);c.fillStyle='#30372e';c.fillRect(4,-37,2,2);if(beard){c.fillStyle=beard;c.beginPath();c.moveTo(-2,-30);c.quadraticCurveTo(5,-12,10,-30);c.closePath();c.fill();}}
  function khanXep(c,col='#1e1b19'){ell(c,0,-43,12.5,6,col);c.strokeStyle='#3a3430';c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();c.ellipse(0,-43+k*2-2,12,3,0,Math.PI*.1,Math.PI*.9);c.stroke();}}
  function nonLa(c,col='#e1cd8e'){poly(c,[-20,-41,0,-60,20,-41],col);line(c,[-20,-41,20,-41],'#b49c62',1.5);c.strokeStyle='#c9b070';c.lineWidth=1;for(let k=1;k<4;k++){c.beginPath();c.moveTo(-20+k*4.5,-41-k*4.3);c.lineTo(20-k*4.5,-41-k*4.3);c.stroke();}}
  function drawNPC(n){
    const c=ctx,t=time;ell(c,n.x,n.y+5,14,6,'#243d3544');
    c.save();c.translate(n.x,n.y);c.scale(n.facing,1);
    const pic=LH_IMG.pic('npc:'+n.id);
    if(pic)drawPic(c,pic,66,n.moving?-Math.abs(Math.sin(n.walk))*2:0);
    else if(n.role==='elder'){ // lý trưởng: áo the đen, khăn xếp, gậy trúc, đi đi lại lại
      const s=n.moving?Math.sin(n.walk)*4:0;ell(c,-3-s,5,4,2,'#2e241a');ell(c,4+s,5,4,2,'#2e241a');line(c,[-3,-2,-3-s,4],'#e8e2d2',4);line(c,[3,-2,3+s,4],'#e8e2d2',4);
      poly(c,[-12,-28,12,-28,14,0,-14,0],'#2b2724');line(c,[2,-27,9,-8],'#4a4440',1.5);line(c,[-14,-1,14,-1],'#3a3430',2);
      line(c,[-10,-24,-14,-10],'#2b2724',6);
      const cane=n.moving?Math.sin(n.walk)*3:0;line(c,[14+cane,-16,17+cane,6],'#c9b26a',2.5);for(let k=0;k<3;k++)line(c,[13.5+cane+k*1,-10+k*6,16+cane+k,-10+k*6],'#9c8a45',1);line(c,[10,-22,14+cane,-16],'#2b2724',6);ell(c,14+cane,-16,3,3,'#e1c295');
      head(c,'#e1c295',null,'#f2efe6');khanXep(c);
    }else if(n.role==='smith'){ // thợ rèn: cởi trần, khăn quấn đầu, búa gõ đe
      const ph=(t*1.1+n.phase)%1,raise=ph<.45?E(ph/.45):ph<.55?1-((ph-.45)/.1):0,ang=lerp(.5,-2.3,raise);
      ell(c,25,0,10,4,'#5a4028');roundRect(c,18,-12,14,12,2,'#6b4a2e');poly(c,[14,-17,34,-17,31,-12,17,-12],'#3d4248');
      c.save();c.shadowColor='#ff8a3d';c.shadowBlur=10;roundRect(c,19,-20,12,3,1,ph>.45&&ph<.7?'#fff0b0':'#ff9a3d');c.restore();
      npcLegs(c,n,'#5a3e28');
      roundRect(c,-13,-28,26,24,8,'#b9875a');line(c,[-6,-22,0,-18,6,-22],'#9c6e46',1.5);poly(c,[-9,-16,9,-16,10,-2,-10,-2],'#5a3a22');line(c,[-9,-16,-11,-25],'#5a3a22',1.5);
      c.fillStyle='#4a3020';c.fillRect(-13,-8,26,4);
      line(c,[-10,-24,10,-17],'#b9875a',6);ell(c,12,-17,3.5,3.5,'#b9875a');line(c,[12,-17,22,-19],'#2c2c2c',2.5);
      head(c,'#b9875a','#2a2622','#3a2a1a');ell(c,0,-42,12,4.5,'#7a5a3a');line(c,[-10,-42,-15,-36],'#7a5a3a',2.5);
      c.save();c.translate(9,-23);c.rotate(ang);line(c,[0,0,13,0],'#b9875a',6.5);ell(c,13,0,3.8,3.8,'#b9875a');line(c,[13,0,13,-18],'#6b4a2e',3);roundRect(c,7,-24,13,8,2,'#4a4f56');c.restore();
    }else if(n.role==='guide'){ // người dẫn đường: áo nâu, nón lá, tay nải, ống nhòm
      const cyc=(t+n.phase*6)%6,up=cyc<.7?E(cyc/.7):cyc<4.5?1:cyc<5.2?1-E((cyc-4.5)/.7):0;
      line(c,[-14,-30,-6,-6],'#6b4a2e',2);ell(c,-15,-24,7,8,'#3e5f8a');
      npcLegs(c,n,'#2e2a26');
      roundRect(c,-12,-27,24,23,6,'#7a5a3a');c.fillStyle='#4a3a2a';c.fillRect(-12,-10,24,3);
      head(c,'#d8b48a','#2a2622');nonLa(c);
      const hx=lerp(12,8,up),hy=lerp(-10,-36,up);line(c,[6,-22,hx,hy],'#7a5a3a',5.5);line(c,[-4,-22,lerp(-12,4,up),lerp(-10,-34,up)],'#7a5a3a',5.5);
      c.save();c.translate(hx+2,hy-1);c.rotate(lerp(1.2,0,up));roundRect(c,-3,-6,9,5,1.5,'#3a2a1a');roundRect(c,-3,1,9,5,1.5,'#3a2a1a');ell(c,6,-3.5,1.6,2.4,'#c9a46a');ell(c,6,3.5,1.6,2.4,'#c9a46a');c.restore();
    }else if(n.role==='trainer'){ // người nuôi ngựa: áo cánh nâu, khăn mỏ quạ, quay dây thừng
      const a=t*5+n.phase*6;
      npcLegs(c,n,'#3e3a34');line(c,[-3,0,-4,4],'#d8b48a',4);line(c,[3,0,4,4],'#d8b48a',4);
      roundRect(c,-12,-27,24,23,6,'#a77a4a');line(c,[0,-26,0,-6],'#8a5f36',1.5);c.fillStyle='#6b4a2e';c.fillRect(-12,-10,24,3);
      line(c,[-10,-23,-13,-9],'#a77a4a',5.5);
      head(c,'#d0a87a','#2a2622');poly(c,[-12,-41,12,-41,9,-52,-2,-56,-11,-50],'#2a2522');poly(c,[-2,-56,6,-60,4,-52],'#2a2522');
      const hx=6+Math.cos(a)*5,hy=-50+Math.sin(a)*3;line(c,[8,-23,hx,hy],'#a77a4a',5.5);ell(c,hx,hy,3.4,3.4,'#d0a87a');
      c.save();c.translate(2,-64);c.strokeStyle='#c9a46a';c.lineWidth=2;c.beginPath();c.ellipse(0,0,20,5,0,0,PI2);c.stroke();c.setLineDash([5,5]);c.lineDashOffset=-t*40;c.strokeStyle='#8a6a42';c.stroke();c.setLineDash([]);c.restore();
      line(c,[hx,hy,2+Math.cos(a)*20,-64+Math.sin(a)*5],'#c9a46a',1.6);
    }else if(n.role==='wizard'){ // đạo sĩ: đạo bào vàng, mũ đạo, phất trần, bùa bay
      const hov=Math.sin(t*2+n.phase*6)*2;c.translate(0,hov-2);
      ell(c,0,6-hov,12,3,'#e7c46a33');
      poly(c,[-12,-28,12,-28,16,6,-16,6],'#c99a3a');line(c,[-16,5,16,5],'#2a2622',3);line(c,[0,-27,0,4],'#2a2622',2);
      c.save();c.translate(0,-15);ell(c,0,0,5.5,5.5,'#f2ead6');c.fillStyle='#2a2622';c.beginPath();c.arc(0,0,5.5,-Math.PI/2,Math.PI/2);c.fill();ell(c,0,-2.75,2.75,2.75,'#2a2622');ell(c,0,2.75,2.75,2.75,'#f2ead6');c.restore();
      line(c,[-10,-23,-13,-10],'#c99a3a',6);
      head(c,'#e8cfa8',null,'#cfcfd6');c.fillStyle='#cfcfd6';c.beginPath();c.moveTo(-3,-30);c.quadraticCurveTo(4,-6,9,-30);c.fill();
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
      head(c,'#e1c295','#2a2622');poly(c,[-11,-42,0,-50,11,-42],'#1e1b19');
      ell(c,0,-47,19,5,'#d8c48a');ell(c,0,-49,13,3,'#c8b070');line(c,[-8,-46,-6,-32],'#3a2a1c',1);line(c,[8,-46,6,-32],'#3a2a1c',1);
    }
    c.restore();
    label(n.name,n.x,n.y-(n.role==='wizard'?82:n.role==='guide'||n.role==='trainer'||n.role==='merchant'?70:66),'#ecdfb9');
  }
  function label(t,x,y,color){ctx.font='12px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#22382bd0';ctx.strokeText(t,x,y);ctx.fillStyle=color;ctx.fillText(t,x,y);}
  // Biểu tượng trên đầu NPC: "!" khi còn nhiệm vụ, túi hàng khi đã xong và có bán đồ
  function npcMarkY(n){return n.y-(n.role==='wizard'?98:88);}
  function drawNPCMarks(){
    for(const n of World.npcs){
      const bx=n.x,by=npcMarkY(n)+Math.sin(time*3)*2,near=Math.hypot(n.x-hero.x,n.y-hero.y)<92;
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
      }
    }
  }
  function drawWellMarks(){
    const cd=(Number(Player.CFG.gieng_hoi_giay)||300)*1000;
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
        if(time<n.pause)continue;const tx=n.dir>0?n.x1:n.x0,d=tx-n.x;
        if(Math.abs(d)<2){n.dir*=-1;n.pause=time+1.6+Math.random()*1.4;}else{const st=Math.sign(d)*38*dt;n.x+=st;n.facing=Math.sign(d);n.moving=true;n.walk+=Math.abs(st)*.09;}
      }else if(n.role==='smith'){
        const ph=(time*1.1+n.phase)%1;if(n.last!==undefined&&n.last<.45&&ph>=.45&&Math.abs(n.x-camera.x-width/scale/2)<width/scale){for(let i=0;i<9;i++){const a=-Math.PI/2+(Math.random()-.5)*2.2,v=80+Math.random()*120;particles.push({x:n.x+25*n.facing,y:n.y-20,vx:Math.cos(a)*v,vy:Math.sin(a)*v,age:0,life:.35+Math.random()*.25,color:Math.random()<.5?'#ffd27a':'#ff8a3d',size:2,grav:420});}}n.last=ph;
      }else if(n.role==='guide'){if(time>n.turnAt){n.turnAt=time+5+Math.random()*3;if(Math.random()<.5)n.facing*=-1;}}
      else if(n.role==='trainer'){n.facing=-1;}
    }
  }

  /* ---------- Hoạt ảnh nhân vật chính ---------- */
  const SH={front:{x:5,y:-23},back:{x:-5,y:-23}};
  function heroPose(h,st,a,t){
    const aim=a&&a.aim?a.aim:h.aim,tilt=clamp(Math.atan2(aim.y,Math.max(.25,Math.abs(aim.x))),-1.15,1.15);
    let p=a?clamp((t-a.start)/a.dur,0,1):0;if(a&&a.cycles>1)p=(Math.min(p,.9999)*a.cycles)%1;const sw=h.moving?Math.sin(h.walk):0;
    const idle={sword:-1.15,staff:-1.45,shield:0,punch:0};
    const P={tilt,p,lean:0,crouch:0,front:{x:11+sw*3,y:-11,ang:idle[st.right||'punch']},back:{x:-9-sw*3,y:-11,ang:idle[st.left||'punch']},trail:null,pull:2,arrow:false,charge:0,cb:{string:-6,bolt:true,flash:false},stride:0,block:false,heal:false};
    if(st.two){
      if(st.type==='spear'){P.front={x:10,y:-14,ang:-1.25};P.back={x:10-Math.cos(-1.25)*17,y:-14-Math.sin(-1.25)*17,ang:-1.25};}
      if(st.type==='bow'){P.front={x:13,y:-12,ang:1.15};P.back={x:-8,y:-11,ang:0};}
      if(st.type==='crossbow'){P.front={x:13,y:-12,ang:.45};P.back={x:1,y:-17,ang:.45};}
    }
    if(t<h.blockUntil){const sh=st.right==='shield'?P.front:P.back;sh.x=16+Math.sin(t*40)*.6;sh.y=-20;P.crouch=3;P.block=true;}
    if(!a)return P;
    const type=a.type;
    if(type==='heal'){const k=Math.sin(p*Math.PI);P.front={x:lerp(11,7,k),y:lerp(-11,-34,k),ang:P.front.ang};P.back={x:lerp(-9,-5,k),y:lerp(-11,-34,k),ang:P.back.ang};P.heal=true;return P;}
    if(type==='block')return P;
    if(type==='sword'){
      const left=a.hand==='left',hand=left?P.back:P.front,sx=left?-5:5,w=seg(p,0,.3),s=seg(p,.3,.56),r=seg(p,.56,1),end=.8+tilt*.6,k=s*s*(3-2*s);
      let ang,hx,hy;
      if(p<.3){ang=lerp(-1.15,-2.55,E(w));hx=lerp(left?-9:11,sx-1,E(w));hy=lerp(-11,-33,E(w));P.lean=-2*E(w);}
      else if(p<.56){ang=lerp(-2.55,end,k);hx=lerp(sx-1,sx+15,k);hy=lerp(-33,-12+tilt*10,k);P.lean=lerp(-2,4,k);P.trail={cx:sx,cy:-23,r:46,from:-2.4,to:ang,fade:1};}
      else{ang=lerp(end,-1.15,E(r));hx=lerp(sx+15,left?-9:11,E(r));hy=lerp(-12+tilt*10,-11,E(r));P.lean=4*(1-E(r));if(r<.3)P.trail={cx:sx,cy:-23,r:46,from:-2.4+r*5,to:end,fade:1-r/.3};}
      hand.x=hx;hand.y=hy;hand.ang=ang;P.stride=P.lean>2?1:0;
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
  function drawArm(c,sx,sy,hx,hy,sleeve,skin){
    const dx=hx-sx,dy=hy-sy,dd=Math.hypot(dx,dy)||1,d=Math.min(19.5,dd),ux=dx/dd,uy=dy/dd,off=Math.sqrt(Math.max(0,100-(d/2)**2));
    let px=-uy,py=ux;if(py<0){px=-px;py=-py;}
    const ex=sx+dx/2+px*off*.9,ey=sy+dy/2+py*off*.9;
    line(c,[sx,sy,ex,ey,hx,hy],sleeve,5);c.fillStyle=skin;c.beginPath();c.arc(hx,hy,3.4,0,PI2);c.fill();
  }
  function glow(c,el,blur){if(el){c.shadowColor=EL[el].color;c.shadowBlur=blur;}}
  function drawSword(c,el,tint){line(c,[-6,0,3,0],'#5a4330',4);c.fillStyle='#c9a85f';c.beginPath();c.arc(-7,0,2.5,0,PI2);c.fill();line(c,[3,-6,3,6],'#c9a85f',3);c.save();glow(c,el,10);c.fillStyle=tint||'#dfe6ea';c.beginPath();c.moveTo(5,-2.3);c.lineTo(31,-1.6);c.lineTo(38,0);c.lineTo(31,1.6);c.lineTo(5,2.3);c.closePath();c.fill();c.restore();line(c,[7,0,29,0],'#9fb0b8',1);}
  function drawSpear(c,el,tint){line(c,[-30,0,36,0],'#9a7448',3);c.save();glow(c,el,10);c.fillStyle=tint||'#dfe3da';c.beginPath();c.moveTo(35,-4.5);c.lineTo(48,0);c.lineTo(35,4.5);c.closePath();c.fill();c.restore();c.fillStyle='#6f7a74';c.fillRect(32,-2.5,4,5);line(c,[33,2,31,9],'#b8433a',1.6);line(c,[34,2,34,10],'#b8433a',1.6);}
  function drawStaff(c,el,charge,t,tint){line(c,[-22,0,26,0],'#7d5d3a',3.5);line(c,[22,-3,22,3],'#c9a85f',2);line(c,[26,0,29,-5],'#7d5d3a',2);line(c,[26,0,29,5],'#7d5d3a',2);const col=el?EL[el].color:tint||'#a6baff',r=5+charge*3.5+Math.sin(t*6)*.6;c.save();c.shadowColor=col;c.shadowBlur=8+charge*16;c.fillStyle=col;c.beginPath();c.arc(31,0,r,0,PI2);c.fill();c.fillStyle='#ffffffcc';c.beginPath();c.arc(30,-1.5,r*.35,0,PI2);c.fill();c.restore();}
  function drawShield(c,back,blocking,t,tint){c.save();if(blocking){c.shadowColor='#f4dd9a';c.shadowBlur=14+Math.sin(t*20)*4;}c.fillStyle=tint||(back?'#8a6a3a':'#a07a46');c.strokeStyle='#d0bc7b';c.lineWidth=2;c.beginPath();c.ellipse(2,0,7,15,0,0,PI2);c.fill();c.stroke();c.restore();c.strokeStyle='#6b4a2e';c.lineWidth=1;for(let k=-10;k<=10;k+=5){c.beginPath();c.moveTo(-3,k);c.lineTo(7,k);c.stroke();}c.fillStyle='#d0bc7b';c.beginPath();c.arc(2.5,0,3,0,PI2);c.fill();}
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
  function drawHeld(c,type,hp,P,el,t,role,tint){
    if(!type)return;c.save();c.translate(hp.x,hp.y);
    if(type==='shield')drawShield(c,role==='back',P.block,t,tint);
    else{c.rotate(hp.ang);if(type==='sword')drawSword(c,el,tint);else if(type==='spear')drawSpear(c,el,tint);else if(type==='staff')drawStaff(c,el,P.charge,t,tint);else if(type==='bow')drawBow(c,P.pull,P.arrow,el,tint);else if(type==='crossbow')drawCrossbow(c,P.cb,el,tint);}
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
  function drawTiger(c,moving,walk,t,saddle=true){
    const g=moving?walk*1.8:0,body='#e08a2e',dark='#2a1a10',belly='#f4e6d0';
    const leg=(x,ph,col)=>{const k=moving?Math.sin(g+ph):0;line(c,[x,-12,x+k*7,-4,x+k*4,1],col,5);ell(c,x+k*4+1,2,3.5,1.8,belly);};
    leg(-14,0,'#c9772a');leg(12,Math.PI,'#c9772a');
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
  function drawMount(c,md,moving,walk,t){if(md.beast==='tiger'){c.save();c.scale(1.3,1.3);drawTiger(c,moving,walk,t);c.restore();}else if(md.beast==='elephant')drawElephantMount(c,md.tint,moving,walk,t);else drawHorse(c,md.tint||'#7a4b2a',moving,walk,t);}
  function seatOf(eq){if(safe)return 0;const md=eq&&eq.mount&&Player.info(eq.mount);return md?Player.BEASTS[md.beast].seat:0;}
  function seatH(){return seatOf(player.equipment);}
  // Thú cưỡi nghiêng người khi dùng kỹ năng: ngựa chổng hậu, voi chồm lên, hổ lao tới
  function mountRot(h,t){const m=h.mountAct;if(!m)return null;const p=clamp((t-m.start)/m.dur,0,1),k=Math.sin(Math.PI*p);
    if(m.type==='horse')return {px:14,rot:.32*k};if(m.type==='elephant')return {px:-20,rot:-.32*Math.sin(Math.PI*Math.min(1,p/m.hit))};return {px:0,rot:-.22*k};}
  // Mặc định: nam cởi trần đóng khố, nữ mặc yếm váy
  function drawHero(c,h,st,el,t,opts={}){
    const who=opts.who||player,eq=who.equipment,info=Player.info,a=h.attack,P=heroPose(h,st,a,t),flash=t-h.hurt<.12,md=!safe&&eq.mount&&info(eq.mount),mounted=!!md,seat=mounted?Player.BEASTS[md.beast].seat:0,big=mounted&&md.beast==='elephant',fem=who.gender==='f';
    const bob=h.moving?-Math.abs(Math.sin(h.walk))*(mounted?1.4:2.2):Math.sin(t*2)*.6,SKIN='#d9ad80';
    c.save();if(h.dead)c.globalAlpha=.45;
    ell(c,h.x,h.y+5,big?42:mounted?28:15,big?12:mounted?8:7,'#243d3544');
    if(el)drawAura(c,h.x,h.y,el,t,big?1.6:mounted?1.25:1);
    if(t<h.barrierUntil){c.save();c.globalAlpha=.35+Math.sin(t*12)*.1;c.strokeStyle='#9fe8a8';c.lineWidth=3;c.beginPath();c.ellipse(h.x,h.y-22-seat,26,34,0,0,PI2);c.stroke();c.restore();}
    c.save();c.translate(h.x,h.y);c.scale(h.facing,1);
    if(mounted){const r=opts.still?null:mountRot(h,t);if(r){c.translate(r.px,0);c.rotate(r.rot);c.translate(-r.px,0);}drawMount(c,md,h.moving,h.walk,t);c.translate(0,-seat);}
    c.translate(P.lean,bob+P.crouch);
    if(eq.wings)drawWings(c,t);
    const tint=s=>eq[s]&&info(eq[s]).tint;
    const sleeve=eq.armor?(tint('armor')||'#6a5a44'):SKIN,skin=eq.gloves?(tint('gloves')||'#7a6a55'):SKIN;
    const held=(type,hp,role,tn,lv)=>{c.save();if(lv>=7){c.shadowColor=lv>=10?'#ff6a3a':'#ffd77a';c.shadowBlur=6+lv;}drawHeld(c,type,hp,P,el,t,role,tn);c.restore();};
    const backTop=a&&a.hand==='left'&&a.type==='sword';
    if(fem)ell(c,-7,-31,6,11,'#2a2622'); // tóc dài sau lưng
    if(!st.two&&!backTop)held(st.left,P.back,'back',st.tintL,st.lvL);
    if(!backTop)drawArm(c,SH.back.x,SH.back.y,P.back.x,P.back.y,sleeve,skin);
    const pants=eq.pants?(tint('pants')||'#4a4036'):SKIN,boot=eq.shoes?(tint('shoes')||'#5b5048'):null;
    if(mounted){line(c,[0,-6,9,-2,7,9],pants,5.5);if(boot)roundRect(c,4,7,9,4,2,boot);}
    else{const s=h.moving?Math.sin(h.walk)*5:0,bf=-4-s-P.stride*4,ff=4+s+P.stride*7;line(c,[-3,-6,bf,6],pants,5.5);line(c,[3,-6,ff,6],pants,5.5);if(boot){roundRect(c,bf-3,4,8,4,2,boot);roundRect(c,ff-3,4,8,4,2,boot);}}
    if(!eq.pants){
      if(fem){poly(c,mounted?[-11,-9,11,-9,14,3,-8,5]:[-12,-9,12,-9,15,4,-15,4],'#5a3a2e');line(c,[-12,-8,12,-8],'#8a5a3a',2);} // váy
      else{c.fillStyle='#8b3a2a';c.fillRect(-12,-10,24,5);poly(c,[-4,-6,4,-6,3,4,-3,4],'#8b3a2a');} // khố
    }
    roundRect(c,-12,-27,24,23,6,flash?'#fff3e6':eq.armor?(tint('armor')||'#6a5a44'):SKIN);
    if(eq.armor){line(c,[-9,-22,0,-15,9,-22],'#c9b27c',2);line(c,[0,-15,0,-6],'#c9b27c',2);}
    else if(fem){poly(c,[0,-25,9,-16,0,-7,-9,-16],'#c0392b');line(c,[-5,-21,-4,-28],'#c0392b',1.2);line(c,[5,-21,4,-28],'#c0392b',1.2);} // yếm
    else line(c,[-6,-21,0,-18,6,-21],'#b88a60',1.4);
    if(eq.pants){c.fillStyle='#a8343a';c.fillRect(-12,-10,24,4);}
    ell(c,0,-35,11,11,flash?'#fff3e6':'#e1c295');ell(c,-1,-42,12,7,'#2a2622');ell(c,-9,-42,5,5,'#2a2622');c.fillStyle='#30372e';c.fillRect(4,-36,2,2);
    if(fem){ell(c,-10,-46,6,5,'#2a2622');line(c,[-13,-47,-6,-45],'#c0392b',1.5);}
    if(eq.hat){if(eq.hat.type==='hat')nonLa(c);else{c.fillStyle=tint('hat')||'#6b4a2e';c.beginPath();c.moveTo(-15,-40);c.lineTo(0,-52);c.lineTo(15,-40);c.closePath();c.fill();ell(c,0,-53,3,3,'#c0342a');line(c,[-15,-40,15,-40],'#3a2a1a',2);}}
    if(st.two){held(st.right,P.front,'front',st.tintR,st.lvR);c.fillStyle=skin;c.beginPath();c.arc(P.back.x,P.back.y,3.4,0,PI2);c.fill();}
    else held(st.right,P.front,'front',st.tintR,st.lvR);
    if(backTop){held(st.left,P.back,'back',st.tintL,st.lvL);drawArm(c,SH.back.x,SH.back.y,P.back.x,P.back.y,sleeve,skin);}
    drawArm(c,SH.front.x,SH.front.y,P.front.x,P.front.y,sleeve,skin);
    if(P.trail&&P.trail.to>P.trail.from){const tr=P.trail;c.save();c.globalAlpha=.5*tr.fade;c.fillStyle=el?EL[el].color:'#f4ead0';c.beginPath();c.arc(tr.cx,tr.cy,tr.r+6,tr.from,tr.to);c.arc(tr.cx,tr.cy,tr.r-14,tr.to,tr.from,true);c.closePath();c.fill();c.restore();}
    if(P.heal){c.save();c.globalAlpha=.7;c.fillStyle='#bff5c4';c.beginPath();c.arc(P.front.x,P.front.y,6,0,PI2);c.arc(P.back.x,P.back.y,6,0,PI2);c.fill();c.restore();}
    c.restore();c.restore();
    if(opts.label!==false)label(h.name,h.x,h.y-(64+seat),opts.labelColor||'#fff2d1');
  }

  /* ---------- Quái vật ---------- */
  function drawMonster(m){
    const M=MON[m.type],c=ctx;let alpha=1;
    if(m.dead){alpha=clamp(1-(time-m.deadAt)/1.2,0,1);if(alpha<=0)return;}
    const fl=time-m.hurt<.1,col=v=>fl?'#fff3e6':v,g=m.walk;
    c.save();c.globalAlpha=alpha;ell(c,m.x,m.y+3,M.r*1.2,M.r*.45,'#243d3540');
    c.translate(m.x,m.y);c.scale(m.facing,1);
    let lunge=0,open=false;
    if(m.atk){if(time<m.atk.at)lunge=-5*clamp((time-(m.atk.at-M.windup))/M.windup,0,1);else{lunge=12*Math.max(0,1-(time-m.atk.at)/.3);open=true;}}
    c.translate(lunge,0);if(m.dead)c.rotate(-.5*(1-alpha));
    const leg=(x,ph,len,w,colr)=>line(c,[x,-len,x+Math.sin(g+ph)*len*.3*(m.moving?1:0),0],colr,w);
    const pic=LH_IMG.pic('quai:'+m.type);
    if(pic){if(fl)c.filter='brightness(1.8)';drawPic(c,pic,Math.max(M.h*1.3,M.r*2),m.moving?-Math.abs(Math.sin(g))*3:0);c.filter='none';}
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
    c.restore();
    if(!m.dead&&time<m.frozenUntil){ctx.save();ctx.globalAlpha=.55;roundRect(ctx,m.x-M.r*1.35,m.y-M.h-8,M.r*2.7,M.h+12,8,'#cdeeff');ctx.globalAlpha=.9;ctx.strokeStyle='#f2fbff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(m.x-M.r,m.y-M.h);ctx.lineTo(m.x-M.r*.4,m.y-M.h*.5);ctx.lineTo(m.x+M.r*.2,m.y-M.h*.7);ctx.moveTo(m.x+M.r*.6,m.y-4);ctx.lineTo(m.x+M.r,m.y-M.h*.4);ctx.stroke();ctx.restore();}
    if(!m.dead&&time<m.slowUntil){ctx.save();ctx.strokeStyle=EL.wind.color;ctx.lineWidth=2;ctx.globalAlpha=.7;for(let i=0;i<2;i++){const a=time*4+i*Math.PI;ctx.beginPath();ctx.ellipse(m.x,m.y-6-i*12,M.r*1.2,M.r*.35,0,a,a+2.2);ctx.stroke();}ctx.restore();}
    if(!m.dead&&time<m.fearUntil){ctx.save();ctx.font='700 18px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#3a2a10';const yy=m.y-M.h-24+Math.sin(time*12)*2;ctx.strokeText('!',m.x,yy);ctx.fillStyle=EL.light.color;ctx.fillText('!',m.x,yy);ctx.restore();}
    if(!m.dead&&time<m.stunUntil){ctx.fillStyle='#ffe69a';for(let i=0;i<3;i++){const a=time*5+i*2.09;ctx.beginPath();ctx.arc(m.x+Math.cos(a)*14,m.y-M.h-10+Math.sin(a)*4,2.5,0,PI2);ctx.fill();}}
    if(!m.dead&&M.boss)label(M.name,m.x,m.y-M.h-28,M.boss===2?'#ff9ad0':'#ffc58a');
    if(!m.dead&&(m.hp<m.max||m.aggro>time)){const bw=M.boss?84:40,by=m.y-M.h-16;roundRect(ctx,m.x-bw/2,by,bw,5,2,'#0a120ecc');roundRect(ctx,m.x-bw/2,by,bw*Math.max(0,m.hp/m.max),5,2,'#e0625a');}
  }
  // Quái thu phục: vẽ như quái thường + vòng Ma công dưới chân, tên màu tím
  function drawPet(e){const M=MON[e.type];ctx.save();ctx.globalAlpha=.5+Math.sin(time*3)*.15;ctx.strokeStyle=EL.demon.color;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(e.x,e.y+3,M.r*1.3,M.r*.45,0,0,PI2);ctx.stroke();ctx.restore();drawMonster(e);if(safe)label(M.name,e.x,e.y-M.h-12,EL.demon.glow);}
  function center(m){return {x:m.x,y:m.y-MON[m.type].h*.5};}
  function floater(x,y,text,color,size=14){floaters.push({x,y,text,color,size,age:0,life:.9});}
  function burst(x,y,color,n=10,spd=120){for(let i=0;i<n;i++){const a=Math.random()*PI2,v=spd*(.4+Math.random()*.8);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,age:0,life:.45+Math.random()*.35,color,size:2+Math.random()*2.5,grav:180});}}
  function shake(a){shakeAmp=Math.max(shakeAmp,a);}
  const rarColor=q=>(Player.RAR[q]||{}).color||'#fff';
  function refreshHD(){HD=Player.derive(player,{safe});}
  function healHero(v){if(v>0&&!hero.dead)player.hp=Math.min(HD.tot.hp,player.hp+v);}

  /* ---------- Sát thương: dao động min-max, chính xác, x2/x3, hoàn hảo/huyền thoại/thần thoại, sát thương chuẩn ---------- */
  function rollHit(D,mul,owner){
    const S=D.tot,lo=S.dmgMin,hi=Math.max(lo,S.dmgMax);
    let v=Math.random()*100<S.acc?hi:lo+Math.random()*(hi-lo);
    v*=mul*D.dmgMul*(1+(HD.fx.aura||0)/100);
    let tag='',color='#fff1c4',size=14;
    const c=Math.random()*100;
    if(c<S.crit3){v*=3;tag='x3';color='#ff9a5a';size=18;}else if(c<S.crit3+S.crit2){v*=2;tag='x2';color='#ffd27a';size=16;}
    const q=Math.random()*100;
    if(q<S.mythDmg){v*=3;tag='Thần thoại';color=rarColor('m');size=18;}
    else if(q<S.mythDmg+S.legDmg){v*=2;tag='Huyền thoại';color=rarColor('l');size=17;}
    else if(q<S.mythDmg+S.legDmg+S.perfDmg){v*=1.5;tag='Hoàn hảo';color=rarColor('p');size=16;}
    if(owner==='hero'&&hero.counter){v*=1+(HD.fx.counter||0)/100;hero.counter=false;tag=tag||'Phản công';}
    return {dmg:Math.max(1,Math.round(v+S.trueDmg)),tag,color,size};
  }
  function hitMonster(m,atk,dx,dy,opt={}){
    if(m.dead)return 0;const M=MON[m.type];
    const r=atk.abs?{dmg:Math.max(1,Math.round(atk.abs)),tag:'',color:atk.color||'#fff1c4',size:13}:rollHit(atk.D,atk.mul,atk.owner);
    let dmg=r.dmg;const f=atk.owner==='hero'&&!atk.abs?HD.fx:{};
    if(f.execute&&!M.boss&&(m.hp-dmg)/m.max<f.execute/100){dmg=Math.max(dmg,m.hp);r.tag='Kết liễu';}
    m.hp-=dmg;m.hurt=time;m.aggro=time+8;
    const c=center(m);floater(c.x+(Math.random()*16-8),c.y-M.h*.5,(r.tag?r.tag+' ':'')+dmg,atk.el&&!r.tag?EL[atk.el].glow:r.color,atk.el&&!r.tag?16:r.size);
    burst(c.x,c.y,atk.el?EL[atk.el].color:'#f1e2b5',6);
    const kb=(atk.knock||30)*M.knock;if(kb)World.move(m,dx*kb*.25,dy*kb*.25,Math.min(M.r,16));
    if(m.type==='deer')m.flee=time+3;
    if(atk.owner==='hero'&&!atk.abs){
      if(f.lifesteal)healHero(dmg*f.lifesteal/100);
      if(f.stun&&Math.random()*100<f.stun){m.stunUntil=time+1;m.atk=null;floater(c.x,c.y-M.h*.5-18,'Choáng','#ffe69a',12);}
      if(f.burn)m.burn={dps:dmg*f.burn/100/3,until:time+3};
      const B=HD.bfx||{},bossK=M.boss?.5:1;
      if(B.thunder&&Math.random()*100<B.thunder)thunder(m,dmg*(Number(CFG.loi_sat_thuong)||150)/100);
      if(B.wind&&Math.random()*100<B.wind){m.slowUntil=time+(Number(CFG.phong_ms)||3000)/1000;m.slowK=Math.max(.1,1-(Number(CFG.phong_cham)||45)/100);floater(c.x,c.y-M.h*.5-18,'Chậm',EL.wind.color,12);burst(c.x,m.y-6,EL.wind.color,10,120);}
      if(B.ice&&Math.random()*100<B.ice){m.frozenUntil=time+(Number(CFG.bang_ms)||1800)/1000*bossK;m.atk=null;m.leap=null;floater(c.x,c.y-M.h*.5-18,'Đóng băng',EL.ice.glow,13);burst(c.x,c.y,EL.ice.color,16,140);}
      if(f.cleave&&atk.skill==='normal'&&!opt.cleave)for(const o of monsters)if(o!==m&&!o.dead&&Math.hypot(o.x-m.x,o.y-m.y)<90)hitMonster(o,{abs:dmg*f.cleave/100,owner:'hero',color:'#ffc8a0'},dx,dy,{cleave:true});
    }
    if(m.hp<=0)kill(m,atk.owner);
    return dmg;
  }
  // Sách Lôi: một đạo lôi quang từ trời đánh xuống quái, nổ sau 0,15 giây
  const strikes=[];
  function thunder(m,v){const c=center(m),x0=c.x+(Math.random()-.5)*70,pts=[x0,c.y-320];for(let i=1;i<8;i++)pts.push(lerp(x0,c.x,i/8)+(Math.random()-.5)*26,c.y-320+40*i);pts.push(c.x,c.y);fx.push({kind:'sky',pts,color:EL.thunder.color,glow:EL.thunder.glow,age:0,life:.32});strikes.push({m,v,at:time+.12});}
  function updateStrikes(){for(let i=strikes.length-1;i>=0;i--){const k=strikes[i];if(time<k.at)continue;strikes.splice(i,1);if(k.m.dead)continue;const c=center(k.m);fx.push({kind:'ring',x:k.m.x,y:k.m.y,r0:6,r1:60,color:EL.thunder.glow,age:0,life:.3,lw:4});burst(c.x,c.y,EL.thunder.color,16,200);shake(3);hitMonster(k.m,{abs:k.v,owner:'thunder',color:EL.thunder.glow},0,0);}}
  function hitArc(ox,oy,ang,range,arc,atk){
    for(const m of monsters){if(m.dead)continue;const M=MON[m.type],c=center(m),dx=c.x-ox,dy=c.y-oy,d=Math.hypot(dx,dy);if(d-M.r>range)continue;
      const da=Math.abs(((Math.atan2(dy,dx)-ang)%PI2+PI2*1.5)%PI2-Math.PI);if(arc<PI2-.01&&da>arc/2&&d>M.r+12)continue;hitMonster(m,atk,dx/(d||1),dy/(d||1));}
  }
  function hitLine(ox,oy,ang,len,w,atk){
    const ux=Math.cos(ang),uy=Math.sin(ang);
    for(const m of monsters){if(m.dead)continue;const M=MON[m.type],c=center(m),dx=c.x-ox,dy=c.y-oy,along=dx*ux+dy*uy,perp=Math.abs(dx*uy-dy*ux);if(along>-M.r&&along<len+M.r&&perp<w/2+M.r)hitMonster(m,atk,ux,uy);}
  }
  function nova(x,y,r,atk,except){fx.push({kind:'ring',x,y,r0:10,r1:r,color:atk.el?EL[atk.el].color:'#ffd9a0',age:0,life:.45,lw:5});for(const m of monsters){if(m.dead||m===except)continue;const c=center(m),d=Math.hypot(c.x-x,c.y-y);if(d<r+MON[m.type].r)hitMonster(m,{...atk,knock:60},(c.x-x)/(d||1),(c.y-y)/(d||1));}}
  function spawnProjectile(o,ang,atk,d){
    const ox=o.x+Math.cos(ang)*26,oy=o.y-20-(o.seat||0)+Math.sin(ang)*20;
    projectiles.push({kind:d.kind,x:ox,y:oy,vx:Math.cos(ang)*d.speed,vy:Math.sin(ang)*d.speed,sp:d.speed,age:0,life:(d.range||400)/d.speed,atk:{...atk,knock:d.kind==='bolt'?50:25},el:atk.el,pierce:d.pierce||0,splash:d.splash||0,hit:new Set(),gy:20+(o.seat||0)});
  }
  function resolveAttack(a,idx=0){
    const d=ATK[a.type],sk=SK[a.skill],el=HD.books.fire?'fire':a.elem;
    const atk={D:HD,mul:d.dmg*sk.mul*(a.empowered?1.6:1),el,owner:'hero',knock:d.knock,skill:a.skill};
    const ang=Math.atan2(a.aim.y,a.aim.x),ox=hero.x,oy=hero.y-18,col=el?EL[el].color:'#f4ead0';
    if(d.kind==='melee'){
      const whirl=!!sk.multi,range=d.range*(whirl?1.15:1)*(a.skill==='basic'?1.2:1);
      hitArc(ox,oy,ang,range,whirl?PI2:d.arc,{...atk,knock:d.knock*(a.type==='shield'&&a.skill!=='normal'?1.6:1)});
      fx.push(whirl?{kind:'ring',x:ox,y:oy,r0:range*.5,r1:range,color:col,age:0,life:.35,lw:6}:{kind:'arc',x:ox,y:oy,ang,r:range*.8,arc:a.type==='punch'?.8:a.type==='shield'?1.1:1.7,color:col,age:0,life:.22});
      if(a.type==='shield'){shake(3);fx.push({kind:'ring',x:ox+Math.cos(ang)*34,y:oy+Math.sin(ang)*34,r0:4,r1:30,color:'#f4dd9a',age:0,life:.25,lw:3});}
    }else if(d.kind==='thrust'){
      const n=sk.multi?3:1;for(let i=0;i<n;i++){const an=ang+(i-(n-1)/2)*.28;hitLine(ox,oy,an,d.range*(a.skill==='basic'?1.25:1),d.width,atk);fx.push({kind:'thrust',x:ox,y:oy,ang:an,len:d.range,color:col,age:0,life:.2});}
    }else{
      const n=sk.multi?3:1,o={x:hero.x,y:hero.y,seat:seatH()};for(let i=0;i<n;i++)spawnProjectile(o,ang+(i-(n-1)/2)*.16,atk,d);
      if(a.stance&&a.stance.dual&&a.type==='staff')spawnProjectile(o,ang+.08,{...atk,mul:atk.mul*.6},d);
      if(a.type==='crossbow')shake(3);
    }
    if(a.skill==='basic')burst(ox+Math.cos(ang)*30,oy+Math.sin(ang)*20,col,14,160);
    if(sk.nova&&idx===a.cycles-1){nova(hero.x,hero.y-12,sk.nova,{...atk,mul:atk.mul*(sk.finale||.9)},null);burst(hero.x,hero.y-20,col,26,220);shake(6);}
    if(a.skill==='normal'&&HD.fx.wave&&++hero.waveCount%4===0){nova(hero.x,hero.y-12,150,{...atk,mul:atk.mul*HD.fx.wave/100},null);burst(hero.x,hero.y-20,'#ffb070',20,200);}
  }
  function kill(m,owner){
    const M=MON[m.type];m.dead=true;m.deadAt=time;m.respawn=time+M.respawn;m.atk=null;m.burn=null;m.leap=null;
    floater(m.x,m.y-M.h-6,'+'+M.copper+' đồng','#f3d27a',13);burst(m.x,m.y-M.h*.4,'#e9dcb4',16);
    // Phần thưởng tính ngay trên máy người chơi (cùng luật, cùng chuỗi ngẫu nhiên với máy chủ): túi rơi xuống là mở liền,
    // lệnh gom lại gửi máy chủ sau; máy chủ tính lại y hệt để lưu
    const sack={x:m.x+(Math.random()-.5)*10,y:m.y+4,born:time,boss:!!M.boss};loot.push(sack);
    op({t:'kill',mon:m.type},M.boss?300:2500).then(r=>{sack.r=r;sack.openAt=time+.22;},()=>{sack.gone=time;});
    if(HD.fx.haste&&owner==='hero')hero.hasteUntil=time+4;
    if(M.boss){shake(10);message(svg('check')+'Đã hạ '+M.name);}
    window.GameUI?.refresh();
  }
  /* ---------- Túi rơi đồ ---------- */
  const loot=[];
  function openSack(sack,r){
    if(!r||!r.ok){sack.gone=time;return;}
    sack.open=time;const x=sack.x,y=sack.y-30;let dy=0;
    burst(x,y+18,(r.items.length?Player.rar(r.items[0]).color:'#e9dcb4'),r.items.length?22:10,150);
    if(r.rubies){floater(x,y-dy,'+'+r.rubies+' hồng ngọc','#ff7aa0',14);dy+=16;}
    if(r.exp){floater(x,y-dy,'+'+r.exp+' kinh nghiệm','#ffe08a',12);dy+=14;}
    if(r.up)levelUp(r.up);
    if(r.pet){petSpawn[r.pet.pid]={x:sack.x,y:sack.y};const M=MON[r.pet.type];floater(x,y-dy-10,'Thu phục '+M.name+'!',EL.demon.glow,16);fx.push({kind:'ring',x:sack.x,y:sack.y,r0:8,r1:90,color:EL.demon.color,age:0,life:.7,lw:5});burst(sack.x,sack.y-20,EL.demon.color,30,200);message(svg('check')+`Thu phục ${M.name} · đi theo bạn`);syncMerc();}
    r.items.forEach(it=>{const R=Player.rar(it),nm=Player.nameOf(it);floater(x,y-dy,nm,R.color,14);dy+=16;message(svg('bag')+`Nhặt được <b style="color:${R.color}">${nm}</b> \u{00b7} ${R.name}`);});
    (r.lost||[]).forEach(it=>message(svg('close')+'Túi đầy, rơi mất '+Player.nameOf(it)));
    (r.done||[]).forEach(id=>{const Q=Player.QUESTS[id];if(Q)message(svg('quest')+`${Q.name}: xong, về gặp Lý trưởng`);});
    if(r.bonus)message(svg('check')+'Săn đủ 4 loài \u{00b7} +'+r.bonus+' đồng');
  }
  // Lên cấp: vòng sáng, hạt vàng, đầy máu và mana
  function levelUp(n){
    refreshHD();player.hp=HD.tot.hp;player.mana=HD.tot.mp;
    for(let i=0;i<3;i++)fx.push({kind:'ring',x:hero.x,y:hero.y-10,r0:10+i*6,r1:110+i*30,color:i?'#fff3c4':'#ffd36a',age:0,life:.8+i*.15,lw:5-i});
    burst(hero.x,hero.y-30,'#ffe08a',40,240);burst(hero.x,hero.y-30,'#fff6d8',18,150);
    floater(hero.x,hero.y-90,'Lên cấp '+player.level+'!','#ffe08a',20);
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
  /* ---------- Đồng bộ với máy chủ: gom lệnh, gửi kèm cách sắp xếp đồ, nhận lại trạng thái chuẩn ---------- */
  /* Đồng bộ kiểu "hiện trước, lưu sau":
     - Mua, bán, gia cường, nhiệm vụ, thuê lính, cộng điểm: máy người chơi tính ngay bằng cùng luật + cùng chuỗi ngẫu nhiên với máy chủ,
       hiện kết quả liền, rồi gom lệnh gửi lên máy chủ. Máy chủ tính lại y hệt và lưu; trạng thái máy chủ luôn là chuẩn.
     - Lệnh chưa được máy chủ xác nhận nằm trong `pending`; mỗi lần nhận trạng thái mới thì áp lại các lệnh đó lên trên. */
  const sync={queue:[],busy:false,timer:null,at:0,fail:0},pending=[];
  function schedule(ms){const at=Date.now()+ms;if(sync.timer&&sync.at<=at)return;clearTimeout(sync.timer);sync.at=at;sync.timer=setTimeout(()=>{sync.timer=null;flush();},ms);}
  function queueOp(o,delay=0,ent=null){return new Promise((resolve,reject)=>{sync.queue.push({op:o,resolve,reject,ent});schedule(delay);});}
  function adopt(S){
    const before=JSON.parse(JSON.stringify(player));
    let R=Player.merge(S,before);
    if(pending.length){for(const p of pending){try{Player.applyOp(R,p.op,{},Date.now());}catch(e){}}R=Player.merge(R,before);}
    for(const k of Object.keys(player))if(!(k in R))delete player[k];
    Object.assign(player,R);refreshHD();syncMerc();window.GameUI?.refresh();
  }
  async function flush(){
    if(sync.busy){schedule(300);return false;}
    sync.busy=true;const batch=sync.queue.splice(0);nextSave=time+60;
    try{
      const r=await Net.call('play',{charId:session.charId,save:Player.serialize(player,hero,seen),ops:batch.map(b=>b.op)});
      sync.fail=0;
      for(const b of batch)if(b.ent){const i=pending.indexOf(b.ent);if(i>=0)pending.splice(i,1);}
      adopt(r.state);
      batch.forEach((b,i)=>{const res=r.results[i]||{ok:false,error:'LOI'};if(b.ent&&!res.ok)message(svg('close')+'Máy chủ không nhận lệnh, đã đồng bộ lại');b.resolve(res);});return true;
    }catch(e){
      sync.fail++;const keep=batch.filter(b=>(b.op.t==='kill'||b.ent)&&sync.fail<6&&e.message==='Failed to fetch');
      batch.filter(b=>!keep.includes(b)).forEach(b=>{if(b.ent){const i=pending.indexOf(b.ent);if(i>=0)pending.splice(i,1);}b.reject(e);});sync.queue.unshift(...keep);if(keep.length)schedule(3000*sync.fail);
      message(svg('close')+netMsg(e));return false;
    }finally{sync.busy=false;if(sync.queue.length&&!sync.timer)schedule(200);}
  }
  const op=(o,delay=400)=>{
    if(Player.PREDICT.has(o.t)){
      let r;try{r=Player.applyOp(player,o,{},Date.now());}catch(e){return Promise.reject(e);}
      const ent={op:o};pending.push(ent);refreshHD();syncMerc();window.GameUI?.refresh();
      queueOp(o,delay,ent).catch(()=>{});
      return Promise.resolve({ok:true,...r});
    }
    return queueOp(o,0).then(r=>{if(!r.ok)throw Error(r.error);return r;});
  };
  function moveVector(){const x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joystick.x,y=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joystick.y;return {x,y,len:Math.hypot(x,y)};}
  function chooseAim(st,d){
    const mv=moveVector();
    if(mouseAim&&time-mouseAim.t<3){const dx=mouseAim.x-hero.x,dy=mouseAim.y-(hero.y-20),l=Math.hypot(dx,dy)||1;return {x:dx/l,y:dy/l};}
    if(st.type==='crossbow'){if(mv.len>.1)return {x:mv.x/mv.len,y:mv.y/mv.len};return {...hero.aim};}
    let best=null,bd=(d.range||80)+40;
    for(const m of monsters){if(m.dead)continue;const dd=Math.hypot(m.x-hero.x,m.y-hero.y);if(dd<bd){bd=dd;best=m;}}
    if(best){const c=center(best),dx=c.x-hero.x,dy=c.y-(hero.y-20),l=Math.hypot(dx,dy)||1;return {x:dx/l,y:dy/l};}
    if(mv.len>.1)return {x:mv.x/mv.len,y:mv.y/mv.len};
    return {...hero.aim};
  }
  const SKILL_NAMES={basic:'Combo',intermediate:'Diện rộng',advanced:'Liên hoàn'};
  const atkFactor=()=>1+(HD.tot.atkSpd+(time<hero.hasteUntil?HD.fx.haste||0:0))/100;
  function cast(id,quiet){
    if(busy()||hero.dead)return false;
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
      hero.mountAct={type:md.beast,start:time,dur:big?.9:.7,hit:big?.55:.45,done:false,aim:{...aim}};
      floater(hero.x,hero.y-80-seatH(),Player.BEASTS[md.beast].skill,'#ffe0a0',13);window.GameUI?.refresh();return true;
    }
    if(st.dual)hero.swing^=1;
    const d=ATK[st.type],sk=SK[id];
    hero.attack={type:st.type,skill:id,start:time,dur:d.dur*sk.dur*sk.cycles/atkFactor(),cycles:sk.cycles,hitIdx:0,hit:d.hit,stance:st,elem:Player.element(player),empowered:r.empowered,hand:st.dual&&hero.swing?'left':'right',aim:{...aim}};
    if(r.empowered)floater(hero.x,hero.y-78-seatH(),'★ Nội tại','#f5d765',16);
    if(SKILL_NAMES[id])floater(hero.x,hero.y-86-seatH(),SKILL_NAMES[id],'#ffe0a0',13);
    window.GameUI?.refresh();return true;
  }
  // Kỹ năng thú cưỡi: ngựa đá hậu (phía sau), hổ vồ mồi (lao tới), voi dày xéo (diện rộng)
  function mountStrike(m){
    const el=HD.books.fire?'fire':Player.element(player),oy=hero.y-14,atk={D:HD,el,owner:'hero',knock:90};
    if(m.type==='horse'){const ang=hero.facing>0?Math.PI:0;hitArc(hero.x,oy,ang,95,2.2,{...atk,mul:1.7,knock:160});fx.push({kind:'arc',x:hero.x,y:oy,ang,r:70,arc:1.8,color:'#f4ead0',age:0,life:.3});burst(hero.x-hero.facing*40,hero.y-10,'#d9cdb0',14,160);shake(4);}
    else if(m.type==='tiger'){hitArc(hero.x,oy,0,85,PI2,{...atk,mul:2});fx.push({kind:'ring',x:hero.x,y:hero.y,r0:10,r1:85,color:'#ff9a3d',age:0,life:.35,lw:5});burst(hero.x,hero.y-20,'#ff9a3d',18,200);shake(5);}
    else{nova(hero.x,hero.y,160,{...atk,mul:1.8},null);burst(hero.x,hero.y-6,'#d9cdb0',30,240);shake(9);}
  }
  /* ---------- Nhận sát thương: né, đỡ, phòng ngự, giảm sát thương theo loại, lá chắn, khiên mana, phản đòn ---------- */
  function hurtHero(dmg,m){
    if(hero.dead||time<hero.invuln)return;
    const M=MON[m.type],S=HD.tot;
    if(Math.random()*100<S.dodge){floater(hero.x,hero.y-66-seatH(),'Né','#cfe8ff',15);if(HD.fx.counter)hero.counter=true;hero.invuln=time+.2;return;}
    let d=dmg,tag='';
    if(Math.random()*100<M.crit){d=Math.max(dmg,d*2*(1-S.critRed/100));tag='x2 ';}
    const front=(m.x-hero.x)*hero.facing>-10;
    if(time<hero.blockUntil&&front){d*=.2;burst(hero.x+hero.facing*20,hero.y-22,'#f4dd9a',10,150);}
    else if(Math.random()*100<S.block){d*=.2;tag='Đỡ ';burst(hero.x+hero.facing*20,hero.y-22,'#f4dd9a',8,120);}
    d*=100/(100+S.def*4);d*=1-S.dmgRed/100;
    const red={hoan_hao:S.perfRed,huyen_thoai:S.legRed,than:S.mythRed}[M.dtype]||0;d*=1-red/100;
    d=Math.max(1,Math.round(d));
    if(hero.shieldHp>0){const a=Math.min(hero.shieldHp,d);hero.shieldHp-=a;d-=a;}
    if(HD.fx.manaShield&&d>0){const part=Math.min(Math.floor(player.mana),Math.round(d*HD.fx.manaShield/100));player.mana-=part;d-=part;}
    player.hp-=d;hero.lastHurt=time;hero.hurt=time;hero.invuln=time+.35;
    floater(hero.x,hero.y-66-seatH(),tag+'-'+d,'#ff8f86',15);shake(4);
    if(S.reflect&&!m.dead){const c=center(m);hitMonster(m,{abs:dmg*S.reflect/100,owner:'reflect',color:EL.earth.glow},(m.x-hero.x)/(Math.hypot(m.x-hero.x,m.y-hero.y)||1),0);fx.push({kind:'bolt',x1:hero.x,y1:hero.y-22,x2:c.x,y2:c.y,color:EL.earth.color,age:0,life:.2});}
    const dx=hero.x-m.x,dy=hero.y-m.y,l=Math.hypot(dx,dy)||1;World.move(hero,dx/l*16,dy/l*16);
    if(HD.bfx&&HD.bfx.light&&!m.dead&&Math.random()*100<HD.bfx.light){m.fearUntil=time+(Number(CFG.sang_ms)||2500)/1000*(M.boss?.5:1);m.atk=null;m.leap=null;m.path=null;floater(m.x,m.y-M.h-20,'Hoảng sợ',EL.light.color,13);fx.push({kind:'ring',x:hero.x,y:hero.y-20,r0:10,r1:120,color:EL.light.color,age:0,life:.5,lw:5});burst(hero.x,hero.y-30,EL.light.glow,18,220);}
    if(player.hp<=0)die();
    window.GameUI?.refresh();
  }
  function die(){
    if(HD.fx.revive&&time>=hero.reviveAt){player.hp=Math.round(HD.tot.hp*HD.fx.revive/100);hero.reviveAt=time+300;hero.invuln=time+2;message(svg('heart')+'Hồi sinh tại chỗ');burst(hero.x,hero.y-24,'#ffe0f0',30,200);return;}
    player.hp=0;hero.dead=time+2.2;hero.attack=null;hero.mountAct=null;route=[];message(svg('heart')+'Bạn đã gục · về làng');
  }
  function respawn(){hero.dead=0;hero.mountAct=null;refreshHD();player.hp=HD.tot.hp;player.mana=HD.tot.mp;Object.assign(hero,World.spawn);hero.invuln=time+2;hero.attack=null;monsters.forEach(m=>{m.aggro=-9;m.atk=null;});resize();}
  /* ---------- Cảnh làng: chó vàng chạy quanh làng, mèo đuổi chuột sau chuồng, đống lửa ---------- */
  const DOG_PATH=[[5.6,14.5],[13.4,14.5],[16.5,14.4],[24.4,14.5],[24.4,17.3],[16.5,17.3],[13,17.3],[5.6,17.3]].map(([x,y])=>({x:x*T,y:y*T}));
  const dog={amb:'dog',x:DOG_PATH[0].x,y:DOG_PATH[0].y,i:1,facing:1,walk:0,moving:false,rest:0,restUntil:0,bark:-9};
  const cat={amb:'cat',x:0,y:0,facing:1,walk:0,moving:false,hop:0},mouse={amb:'mouse',x:0,y:0,facing:1,walk:0,moving:false},chase={u:0,lag:.5};
  const village={list:[dog,cat,mouse]};
  const CH=(u)=>({x:(19.1+5.2*Math.sin(u*.9)+.6*Math.sin(u*2.3))*T,y:(24.9+1.05*Math.sin(u*1.7+1))*T});
  function updateVillage(dt){
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
  function syncMerc(){
    const want=[...player.mercs.filter(m=>m.on&&m.hpFrac>0).map(m=>({key:m.mid,data:m,pet:false})),...(player.pets||[]).filter(x=>x.hpFrac>0&&MON[x.type]).map(x=>({key:x.pid,data:x,pet:true}))];
    const old=new Map(allies.map(e=>[e.key,e]));allies.length=0;
    want.forEach((w,i)=>{
      let e=old.get(w.key);
      if(!e){const f=FORM[i%6],sp=petSpawn[w.key]||{x:hero.x+f[0]*hero.facing,y:hero.y+f[1]};delete petSpawn[w.key];
        e={key:w.key,pet:w.pet,x:sp.x,y:sp.y,facing:1,moving:false,walk:0,aim:{x:1,y:0},attack:null,atk:null,hurt:-9,dead:0,deadAt:0,blockUntil:0,barrierUntil:0,cd:0,hp:0,swing:0,aggro:-9,stunUntil:0,stuck:0,path:null};
        if(!World.canStand(e.x,e.y)){e.x=hero.x;e.y=hero.y;}
        if(w.pet)burst(e.x,e.y-20,EL.demon.color,18,160);}
      e.data=w.data;e.slot=i;
      if(w.pet){const M=MON[w.data.type];e.type=w.data.type;e.max=M.hp;e.name=M.name;}else{e.D=Player.derive(w.data);e.max=e.D.tot.hp;e.name=w.data.name;}
      if(!e.hp)e.hp=Math.max(1,Math.round(e.max*(w.data.hpFrac||1)));e.hp=Math.min(e.hp,e.max);
      allies.push(e);
    });
  }
  const allyKey=()=>player.mercs.map(m=>m.mid+(m.on&&m.hpFrac>0?'+':'-')).join()+'|'+(player.pets||[]).map(x=>x.pid+(x.hpFrac>0?'+':'-')).join();
  function mercHit(e,a){
    const d=ATK[a.type],atk={D:e.D,mul:d.dmg,el:null,owner:'merc',knock:d.knock},ang=Math.atan2(a.aim.y,a.aim.x),ox=e.x,oy=e.y-18;
    if(d.kind==='melee'){hitArc(ox,oy,ang,d.range,d.arc,atk);fx.push({kind:'arc',x:ox,y:oy,ang,r:d.range*.8,arc:1.5,color:'#dfe8f0',age:0,life:.2});}
    else if(d.kind==='thrust')hitLine(ox,oy,ang,d.range,d.width,atk);else spawnProjectile({x:e.x,y:e.y},ang,atk,d);
  }
  function nearestFoe(e,r){let t=null,bd=r;for(const m of monsters){if(m.dead)continue;const dd=Math.hypot(m.x-e.x,m.y-e.y);if(dd<bd&&Math.hypot(m.x-hero.x,m.y-hero.y)<420){bd=dd;t=m;}}return t;}
  function formGoal(e){const f=FORM[e.slot%6],gx=hero.x+f[0]*hero.facing,gy=hero.y+f[1];return Math.hypot(gx-e.x,gy-e.y)>32?{x:gx,y:gy}:null;}
  function updateAllies(dt){
    for(const e of allies){
      e.moving=false;
      if(safe&&e.hp<e.max)e.hp=Math.min(e.max,e.hp+e.max*.15*dt); // về làng hồi máu
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
  // Quái thu phục: đi theo, cắn/húc quái khác. Chết là mất hẳn
  function updatePet(e,dt){
    const M=MON[e.type];
    if(e.atk){if(time>=e.atk.at&&!e.atk.done){e.atk.done=true;const t=e.atk.tg;if(t&&!t.dead&&Math.hypot(t.x-e.x,t.y-e.y)<M.range+MON[t.type].r+40){const l=Math.hypot(t.x-e.x,t.y-e.y)||1;hitMonster(t,{abs:Math.max(6,M.dmg)*(1+player.level*.05),owner:'pet',color:EL.demon.glow,knock:40},(t.x-e.x)/l,(t.y-e.y)/l);}}if(time>=e.atk.end)e.atk=null;e.data.hpFrac=e.hp/e.max;return;}
    const target=!safe&&!hero.dead?nearestFoe(e,300):null;let goal=null;
    if(target){const dx=target.x-e.x,dist=Math.hypot(dx,target.y-e.y),reach=M.range*.8+MON[target.type].r+M.r*.5;if(Math.abs(dx)>3)e.facing=dx<0?-1:1;
      if(dist>reach)goal={x:target.x,y:target.y};else if(time>e.cd){const w=Math.max(.25,M.windup);e.atk={at:time+w,end:time+w+.35,done:false,tg:target};e.cd=time+w+Math.max(.8,M.cd);}}
    else goal=formGoal(e);
    if(goal){steer(e,goal,Math.min(Math.max(M.speed,M.run*.8),220),dt,Math.min(M.r,16),false);e.moving=e.stepMoved>.05;e.walk+=e.stepMoved*.12;if(!target&&Math.abs(goal.x-e.x)>3)e.facing=goal.x<e.x?-1:1;}
    e.data.hpFrac=e.hp/e.max;
  }
  function hurtAlly(e,dmg){
    if(!e||e.hp<=0)return;let d;
    if(e.pet)d=Math.max(1,Math.round(dmg*.8));
    else{const S=e.D.tot;if(Math.random()*100<S.dodge){floater(e.x,e.y-60,'Né','#cfe8ff',13);return;}d=dmg*100/(100+S.def*4)*(1-S.dmgRed/100);if(Math.random()*100<S.block)d*=.2;d=Math.max(1,Math.round(d));}
    e.hp-=d;e.hurt=time;floater(e.x,e.y-(e.pet?MON[e.type].h+12:62),'-'+d,'#ffb0a0',13);
    if(e.hp<=0){
      e.hp=0;e.data.hpFrac=0;const i=allies.indexOf(e);if(i>=0)allies.splice(i,1);burst(e.x,e.y-20,'#cfcfcf',18,150);
      if(e.pet){message(svg('close')+e.name+' đã chết · không hồi sinh');queueOp({t:'petOff',pid:e.key},0).catch(()=>{});}
      else{message(svg('user')+e.name+' gục · về làng chờ');save();}
    }
  }
  // Về làng: lính gục đứng chờ ở làng nhập đội lại
  function reviveAtVillage(){
    const back=player.mercs.filter(m=>m.hpFrac===0);if(!back.length)return;
    back.forEach(m=>m.hpFrac=1);syncMerc();message(svg('user')+back.map(m=>m.name).join(', ')+' nhập đội lại');save();
  }
  /* ---------- Quái vật và trùm ---------- */
  function pickTarget(m){
    let best=null,bd=1e9;
    const cand=[{x:hero.x,y:hero.y,isHero:true,ok:!hero.dead}];for(const e of allies)cand.push({x:e.x,y:e.y,isHero:false,ent:e,ok:e.hp>0});
    for(const c of cand){if(!c.ok||World.isSafe(c.x))continue;const d=Math.hypot(c.x-m.x,c.y-m.y);if(d<bd){bd=d;best=c;}}
    return best?{...best,d:bd}:null;
  }
  function monsterStrike(m){
    const M=MON[m.type],reach=M.range+18+(M.boss?24:0);
    const hits=[];if(!hero.dead&&Math.hypot(hero.x-m.x,hero.y-m.y)<reach)hits.push('hero');for(const e of allies)if(e.hp>0&&Math.hypot(e.x-m.x,e.y-m.y)<reach+(e.pet?MON[e.type].r:0))hits.push(e);
    const pref=m.tgt&&hits.includes(m.tgt)?m.tgt:hits.includes('hero')?'hero':hits[0],list=M.boss?hits:pref?[pref]:[];
    for(const h of list){if(h==='hero')hurtHero(M.dmg,m);else hurtAlly(h,M.dmg);}
    if(m.type==='elephant'||M.boss){shake(M.boss?8:6);fx.push({kind:'ring',x:m.x+m.facing*(M.boss?20:40),y:m.y,r0:10,r1:M.boss?reach:70,color:m.type==='ngu-tinh'?'#7fd0ff':'#d9cdb0',age:0,life:.45,lw:5});}
    if(m.type==='ngu-tinh')for(let i=0;i<14;i++){const a=i/14*PI2;particles.push({x:m.x+Math.cos(a)*30,y:m.y-10,vx:Math.cos(a)*160,vy:Math.sin(a)*60-80,age:0,life:.6,color:'#9fdcff',size:4,grav:300});}
  }
  // Đi tới đích; vướng bụi cây, nhà, nước thì tìm đường vòng theo lưới ô thay vì đẩy mãi vào vật cản
  function steer(e,goal,spd,dt,r,mon){
    e.stepMoved=0;let to=goal;
    if(e.path){const wp=e.path[0];if(!wp||time>e.pathUntil||Math.hypot(goal.x-e.pathGoal.x,goal.y-e.pathGoal.y)>96)e.path=null;else{if(Math.hypot(wp.x-e.x,wp.y-e.y)<10){e.path.shift();if(!e.path.length)e.path=null;}if(e.path)to=e.path[0];}}
    const dx=to.x-e.x,dy=to.y-e.y,l=Math.hypot(dx,dy);if(l<2)return true;
    const step=Math.min(l,spd*dt);
    if(mon&&World.isSafe(e.x+dx/l*step)&&!World.isSafe(e.x)){e.path=null;return false;}
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
  function fleeGoal(m,fx,fy){
    const base=Math.atan2(m.y-fy,m.x-fx);if(m.fleeGoal&&time<m.fleeGoalUntil)return m.fleeGoal;
    for(const o of [0,.45,-.45,.9,-.9,1.4,-1.4,1.9,-1.9,2.5,-2.5,Math.PI]){const a=base+o;let ok=true;for(const d of [50,100,160,220]){const px=m.x+Math.cos(a)*d,py=m.y+Math.sin(a)*d;if(!World.canStand(px,py,14)||World.isSafe(px)){ok=false;break;}}if(ok){m.fleeGoal={x:m.x+Math.cos(a)*220,y:m.y+Math.sin(a)*220};m.fleeGoalUntil=time+.9;return m.fleeGoal;}}
    return {x:m.hx,y:m.hy};
  }
  function moveMon(m,goal,spd,dt,M){
    const ok=steer(m,goal,spd,dt,Math.min(M.r,16),true);if(!ok){m.wander=null;m.moving=false;return;}
    m.moving=m.stepMoved>.05;m.walk+=m.stepMoved*.12;if(Math.abs(m.dirX||0)>2)m.facing=m.dirX<0?-1:1;
  }
  function updateMonsters(dt){
    for(const m of monsters){
      const M=MON[m.type];
      if(m.dead){if(time>m.respawn){Object.assign(m,{dead:false,hp:m.max,x:m.hx,y:m.hy,atk:null,aggro:-9,flee:0,burn:null,leap:null,stunUntil:0,frozenUntil:0,slowUntil:0,fearUntil:0,path:null,stuck:0});}continue;}
      if(m.burn){if(time<m.burn.until){m.burnAcc+=m.burn.dps*dt;if(m.burnAcc>=1){const v=Math.floor(m.burnAcc);m.burnAcc-=v;hitMonster(m,{abs:v,owner:'burn',color:'#ff9a3d'},0,0);if(m.dead)continue;}}else m.burn=null;}
      if(time<m.stunUntil||time<m.frozenUntil){m.moving=false;continue;}
      const slowK=time<m.slowUntil?m.slowK:1;
      if(time<m.fearUntil){moveMon(m,fleeGoal(m,hero.x,hero.y),M.run*slowK,dt,M);continue;}
      const tg=pickTarget(m),dx=tg?tg.x-m.x:0,dy=tg?tg.y-m.y:0,dist=tg?tg.d:1e9,homeD=Math.hypot(m.hx-m.x,m.hy-m.y);
      let tx=0,ty=0,spd=0;
      if(m.leap){const p=(time-m.leap.start)/m.leap.dur;if(p>=1){m.x=m.leap.tx;m.y=m.leap.ty;m.leap=null;monsterStrike(m);}else{World.move(m,(m.leap.tx-m.x)*Math.min(1,dt*8),(m.leap.ty-m.y)*Math.min(1,dt*8),16);}continue;}
      if(m.atk){
        if(time>=m.atk.at&&!m.atk.done){m.atk.done=true;monsterStrike(m);}
        if(time>=m.atk.end)m.atk=null;
      }else{
        const angry=m.aggro>time,canSee=!!tg;let hostile=false;
        if(m.type==='lion'||M.boss)hostile=canSee&&(dist<M.aggro||angry)&&(!M.boss||homeD<420);
        else if(m.type==='elephant')hostile=canSee&&angry;
        else if(m.type==='croc')hostile=canSee&&(dist<M.aggro||angry)&&homeD<230;
        if(hostile)m.tgt=tg.isHero?'hero':tg.ent;
        if(m.type==='deer'){if(m.flee>time||(dist<110&&canSee)){const g=fleeGoal(m,tg?tg.x:m.x-1,tg?tg.y:m.y);tx=g.x-m.x;ty=g.y-m.y;spd=m.flee>time?M.run:M.speed*1.6;}}
        else if(hostile){
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
      const pr=projectiles[i];pr.age+=dt;pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;
      if(pr.kind==='orb'&&Math.random()<.7)particles.push({x:pr.x,y:pr.y,vx:(Math.random()-.5)*20,vy:(Math.random()-.5)*20,age:0,life:.3,color:pr.el?EL[pr.el].color:'#a6baff',size:3,grav:0});
      let gone=pr.age>pr.life;const gx=Math.floor(pr.x/T),gy=Math.floor((pr.y+pr.gy)/T);if(gx<0||gy<0||gx>=W||gy>=H||grid[gy][gx]===1)gone=true;
      for(const m of monsters){if(gone||m.dead||pr.hit.has(m))continue;const c=center(m);if(Math.hypot(c.x-pr.x,c.y-pr.y)<MON[m.type].r+8+(pr.gy>20?14:0)){pr.hit.add(m);hitMonster(m,pr.atk,pr.vx/pr.sp,pr.vy/pr.sp);if(pr.splash)nova(pr.x,pr.y,pr.splash,{...pr.atk,mul:pr.atk.mul*.5},m);if(pr.pierce>0)pr.pierce--;else gone=true;}}
      if(gone){burst(pr.x,pr.y,pr.el?EL[pr.el].color:pr.kind==='orb'?'#a6baff':'#e9dcb4',pr.kind==='orb'?12:5,90);projectiles.splice(i,1);}
    }
  }
  function updateEffects(dt){
    for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.age+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.grav*dt;if(q.age>q.life)particles.splice(i,1);}
    for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.age+=dt;f.y-=38*dt;if(f.age>f.life)floaters.splice(i,1);}
    for(let i=fx.length-1;i>=0;i--){fx[i].age+=dt;if(fx[i].age>fx[i].life)fx.splice(i,1);}
    shakeAmp=Math.max(0,shakeAmp-dt*25);
  }
  /* ---------- Trò chuyện: NPC còn lời dặn thì nói chuyện, sau đó mở thẳng bảng chức năng ---------- */
  const PANEL_BTN={shop:'Mua bán',quests:'Nhận việc',mercs:'Thuê lính',market:'Chợ'};
  function nearby(){let best=null,bd=92;for(const n of World.npcs){const d=Math.hypot(n.x-hero.x,n.y-hero.y);if(d<bd){bd=d;best=n;}}return best;}
  function meet(n){
    route=[];targetNPC=null;
    if(!seen.has(n.id)){keys.clear();joystick={x:0,y:0};holdAttack=false;dialogNPC=n;page=0;dialogEl.hidden=false;showLine();return;}
    window.GameUI?.openPanel(n);
  }
  function showLine(){
    const n=dialogNPC,lastPage=page===n.lines.length-1;
    $('#speaker').textContent=n.name;$('#line').textContent=n.lines[page];
    $('#page').innerHTML=n.lines.length>1?n.lines.map((_,i)=>`<i class="${i===page?'on':''}"></i>`).join(''):'';
    $('#next').innerHTML=svg(lastPage?'check':'next')+(lastPage?'Xong':'Tiếp');
    $('#shopBtn').hidden=!(lastPage&&n.panel);$('#shopLabel').textContent=PANEL_BTN[n.panel]||'Mở';
  }
  function nearWell(r=82){let best=null,bd=r;for(const o of World.wells){const d=Math.hypot(o.x-hero.x,o.y-hero.y);if(d<bd){bd=d;best=o;}}return best;}
  function useWell(o){
    route=[];targetWell=null;targetNPC=null;if(hero.dead)return;
    const left=(player.flags.wells[o.id]||0)-Date.now();
    if(left>0){const s=Math.ceil(left/1000);message(svg('water')+`Giếng cạn · nước về sau ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`);return;}
    const S=HD.tot,gain=Math.max(0,Math.round(S.hp-player.hp));player.hp=S.hp;
    player.flags.wells[o.id]=Date.now()+(Number(Player.CFG.gieng_hoi_giay)||300)*1000;
    hero.facing=o.x<hero.x?-1:1;floater(hero.x,hero.y-70-seatH(),'+'+gain,'#7fe0b0',16);burst(o.x,o.y-30,'#9fdcff',26,170);burst(hero.x,hero.y-30,'#9fe8a8',16,120);
    message(svg('heart')+'Uống nước giếng cổ · hồi đầy máu');nextSave=Math.min(nextSave,time+2);window.GameUI?.refresh();
  }
  function interact(){if(!overlayEl.hidden)return;if(dialogNPC){nextLine();return;}const n=nearby();if(n){meet(n);return;}const w=nearWell();if(w)useWell(w);}
  function endDialog(){if(!dialogNPC)return;seen.add(dialogNPC.id);dialogNPC=null;dialogEl.hidden=true;window.GameUI?.refresh();canvas.focus();}
  function nextLine(){if(!dialogNPC)return;if(page<dialogNPC.lines.length-1){page++;showLine();}else endDialog();}
  function goTo(pt){
    if(busy()||hero.dead)return;
    const st=Player.stance(player),d=ATK[st.type];
    const m=monsters.find(o=>!o.dead&&Math.hypot(o.x-pt.x,(o.y-MON[o.type].h*.5)-pt.y)<MON[o.type].r+16);
    if(m){mouseAim={x:m.x,y:m.y-MON[m.type].h*.5,t:time};if(Math.hypot(m.x-hero.x,m.y-hero.y)<(d.range||80)+MON[m.type].r){cast('normal');return;}}
    targetWell=null;
    const wl=!m&&World.wells.find(o=>Math.abs(o.x-pt.x)<40&&pt.y<o.y+8&&pt.y>o.y-100);
    if(wl){if(Math.hypot(wl.x-hero.x,wl.y-hero.y)<82){useWell(wl);return;}const wp=World.findPath(hero,{x:wl.x,y:wl.y+40});if(wp){route=wp;targetNPC=null;targetWell=wl;canvas.focus();}return;}
    const n=World.npcs.find(n=>Math.hypot(n.x-pt.x,n.y-26-pt.y)<36||(Math.abs(n.x-pt.x)<22&&Math.abs(npcMarkY(n)-pt.y)<22));
    if(n&&Math.hypot(n.x-hero.x,n.y-hero.y)<92){meet(n);return;}
    const target=n?{x:n.x,y:n.y+40}:m?{x:m.x,y:m.y}:pt,path=World.findPath(hero,target);
    if(!path)return;
    route=path;targetNPC=n||null;canvas.focus();
  }
  function screenPoint(x,y){return {x:x/scale+camera.x,y:y/scale+camera.y};}
  const save=()=>flush();
  function update(dt){
    const nowSafe=World.isSafe(hero.x);if(nowSafe!==safe){safe=nowSafe;hero.mountAct=null;refreshHD();window.GameUI?.refresh();if(safe)message(svg('shield')+'Vào vùng an toàn');}
    if(time-hdAt>.25){hdAt=time;refreshHD();const k=allyKey();if(k!==lastAllyKey){lastAllyKey=k;syncMerc();}if(safe)reviveAtVillage();}
    const S=HD.tot;
    if(!hero.dead){player.mana=Math.min(S.mp,player.mana+S.mpReg*dt);player.hp=Math.min(S.hp,player.hp+(S.hpReg+(HD.fx.heal?S.hp*HD.fx.heal/100:0))*dt);}
    player.hp=Math.min(player.hp,S.hp);player.mana=Math.min(player.mana,S.mp);
    if(HD.fx.shield&&time>hero.shieldAt){hero.shieldAt=time+10;hero.shieldHp=Math.round(S.hp*HD.fx.shield/100);}else if(!HD.fx.shield)hero.shieldHp=0;
    if(time>nextSave)save();
    updateNPCs(dt);updateProjectiles(dt);updateMonsters(dt);updateAllies(dt);updateStrikes();updateVillage(dt);updateEffects(dt);
    const a=hero.attack;
    if(a){const p=(time-a.start)/a.dur;while(a.hitIdx<a.cycles&&p>=(a.hitIdx+a.hit)/a.cycles){resolveAttack(a,a.hitIdx);a.hitIdx++;}if(p>=1)hero.attack=null;}
    const ma=hero.mountAct;
    if(ma){const p=(time-ma.start)/ma.dur;if(ma.type==='tiger'&&p<ma.hit&&!hero.dead){const sp=330*dt;World.move(hero,ma.aim.x*sp,ma.aim.y*sp);}if(!ma.done&&p>=ma.hit){ma.done=true;mountStrike(ma);}if(p>=1)hero.mountAct=null;}
    hero.moving=false;
    if(hero.dead){if(time>hero.dead)respawn();return;}
    if(busy())return;
    if((holdAttack||keys.has(' '))&&!hero.attack)cast('normal',true);
    const sf=1+(S.moveSpd+(time<hero.hasteUntil?HD.fx.haste||0:0))/100;
    const mv=moveVector();let vx=mv.x,vy=mv.y;
    if(mv.len>.05){route=[];targetNPC=null;const d=Math.max(1,mv.len);vx/=d;vy/=d;}
    else if(route.length){
      const next=route[0],dx=next.x-hero.x,dy=next.y-hero.y,d=Math.hypot(dx,dy);
      if(d<4){route.shift();vx=vy=0;if(!route.length&&targetNPC){if(Math.hypot(targetNPC.x-hero.x,targetNPC.y-hero.y)<92)meet(targetNPC);targetNPC=null;}if(!route.length&&targetWell){if(Math.hypot(targetWell.x-hero.x,targetWell.y-hero.y)<82)useWell(targetWell);targetWell=null;}}
      else{vx=dx/d;vy=dy/d;const maxStep=155*sf*dt;if(d<maxStep){vx*=d/maxStep;vy*=d/maxStep;}}
    }
    const cur=hero.attack,slow=cur?(cur.type==='block'?.45:.72):1,speed=155*slow*sf;
    const ox=hero.x,oy=hero.y;World.move(hero,vx*speed*dt,vy*speed*dt);
    const moved=Math.hypot(hero.x-ox,hero.y-oy);hero.moving=moved>.05;if(hero.moving)hero.walk+=moved*.09/Math.max(1,sf*(seatH()?1.3:1));
    const len=Math.hypot(vx,vy),mouseOn=mouseAim&&time-mouseAim.t<3;
    if(!cur){
      if(mouseOn){const dx=mouseAim.x-hero.x,dy=mouseAim.y-(hero.y-20),l=Math.hypot(dx,dy)||1;hero.aim={x:dx/l,y:dy/l};if(Math.abs(dx)>4)hero.facing=dx<0?-1:1;}
      else if(len>.05){hero.aim={x:vx/len,y:vy/len};if(Math.abs(vx)>.05)hero.facing=vx<0?-1:1;}
    }
    if(route.length&&!hero.moving&&len>.1){route=[];targetNPC=null;}
    const desiredX=clamp(hero.x-width/scale/2,0,Math.max(0,W*T-width/scale)),desiredY=clamp(hero.y-height/scale/2,0,Math.max(0,H*T-height/scale));camera.x+=(desiredX-camera.x)*(1-Math.exp(-dt*8));camera.y+=(desiredY-camera.y)*(1-Math.exp(-dt*8));
    if(!player.flags.river&&hero.x>(World.BRIDGE.x1+1)*T){player.flags.river=true;message(svg('bridge')+'Đã qua cầu · Đông Ngạn');window.GameUI?.refresh();}
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
    for(const f of floaters){ctx.globalAlpha=1-Math.max(0,f.age/f.life-.4)/.6;ctx.font=`700 ${f.size}px system-ui`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#1a120ccc';ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;
  }
  function render(){
    ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(scale,scale);
    const sx=shakeAmp?(Math.random()-.5)*shakeAmp:0,sy=shakeAmp?(Math.random()-.5)*shakeAmp:0;
    ctx.translate(-camera.x+sx,-camera.y+sy);ctx.drawImage(ground,0,0);
    ctx.strokeStyle='#c8e0ca55';ctx.lineWidth=2;for(let y=1;y<H-1;y+=2){if(y>=World.ROAD.y0-1&&y<=World.ROAD.y1+1)continue;const rx=(World.riverX(y)+1.2)*T;ctx.beginPath();ctx.moveTo(rx+Math.sin(time+y)*9,y*T);ctx.lineTo(rx+25+Math.sin(time+y)*9,y*T);ctx.stroke();}
    if(route.length){ctx.fillStyle='#f3d58c99';for(let i=0;i<route.length;i+=2){ctx.beginPath();ctx.arc(route[i].x,route[i].y,3,0,PI2);ctx.fill();}const p=route[route.length-1];ctx.strokeStyle='#f3d58c';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,12+Math.sin(time*5)*2,6,0,0,PI2);ctx.stroke();}
    const st=Player.stance(player),el=Player.element(player);
    if(st.type==='crossbow'&&!hero.dead){const ax=hero.aim.x,ay=hero.aim.y,ox=hero.x+ax*30,oy=hero.y-20-seatH()+ay*30;ctx.save();ctx.setLineDash([6,8]);ctx.globalAlpha=.55;line(ctx,[ox,oy,ox+ax*170,oy+ay*170],'#f6e3a8',1.5);ctx.setLineDash([]);ctx.beginPath();ctx.arc(ox+ax*180,oy+ay*180,6,0,PI2);ctx.stroke();ctx.restore();}
    const vx0=camera.x-300,vx1=camera.x+width/scale+160,vy0=camera.y-110,vy1=camera.y+height/scale+300,layers=[];
    for(const o of World.objects){const ox=o.kind==='house'?o.x*T:o.x,d=o.kind==='house'?o.foot:o.y;if(ox<vx0||ox>vx1||d<vy0||d>vy1)continue;layers.push([d,o]);}
    for(const n of World.npcs)layers.push([n.y,n]);for(const m of monsters)layers.push([m.y,m]);layers.push([hero.y,hero]);for(const e of allies)layers.push([e.y,e]);for(const a of village.list)if(a.x>vx0&&a.x<vx1&&a.y>vy0&&a.y<vy1)layers.push([a.y,a]);
    layers.sort((a,b)=>a[0]-b[0]);
    for(const [,o] of layers){
      if(o===hero){drawHero(ctx,hero,st,el,time);if(hero.shieldHp>0){ctx.save();ctx.globalAlpha=.3+Math.sin(time*6)*.08;ctx.strokeStyle='#ffe9a8';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(hero.x,hero.y-24-seatH(),26,36,0,0,PI2);ctx.stroke();ctx.restore();}}
      else if(o.key&&o.data){const e=o;if(e.pet){drawPet(e);}else{drawHero(ctx,e,Player.stance(e.data),null,time,{who:e.data,labelColor:'#bfe3ff',label:safe});const sh=seatOf(e.data.equipment);if(e.hp<e.max){roundRect(ctx,e.x-18,e.y-78-sh,36,4,2,'#0a120ecc');roundRect(ctx,e.x-18,e.y-78-sh,36*e.hp/e.max,4,2,'#7fd38a');}}}
      else if(o.amb)drawAmbient(o);
      else if(o.kind==='tree')tree(o);else if(o.kind==='house')house(o);else if(o.kind==='banyan')banyan(o);else if(o.kind==='well')well(o);else if(o.kind==='fire')campfire(o);else if(o.role)drawNPC(o);else drawMonster(o);
    }
    drawFX();drawLoot();drawNPCMarks();drawWellMarks();
    ctx.restore();
    const boss=monsters.find(m=>!m.dead&&MON[m.type].boss&&(m.aggro>time||Math.hypot(m.x-hero.x,m.y-hero.y)<420));
    window.GameUI?.frame(time,{safe,boss:boss?{type:boss.type,name:MON[boss.type].name,hp:boss.hp,max:boss.max,final:MON[boss.type].boss===2}:null});
    mx.drawImage(miniGround,0,0);const kx=mini.width/(W*T),ky=mini.height/(H*T);mx.strokeStyle='#f2e5bd88';mx.lineWidth=1;mx.strokeRect(camera.x*kx,camera.y*ky,width/scale*kx,height/scale*ky);
    mx.fillStyle='#e6c47e';World.npcs.forEach(n=>mx.fillRect(n.x*kx-2,n.y*ky-2,4,4));World.wells.forEach(o=>{mx.fillStyle=(player.flags.wells[o.id]||0)>Date.now()?'#6a7a80':'#5fd0ff';mx.beginPath();mx.arc(o.x*kx,o.y*ky,2.6,0,PI2);mx.fill();});monsters.forEach(m=>{if(m.dead)return;const b=MON[m.type].boss;mx.fillStyle=b?'#ff5ad1':'#e0625a';const s=b?6:4;mx.fillRect(m.x*kx-s/2,m.y*ky-s/2,s,s);});
    for(const e of allies){mx.fillStyle=e.pet?'#d97ab0':'#8fd0ff';mx.fillRect(e.x*kx-2,e.y*ky-2,4,4);}
    mx.fillStyle='#fff6d5';mx.beginPath();mx.arc(hero.x*kx,hero.y*ky,3,0,PI2);mx.fill();
    const pv=document.getElementById('preview');if(pv&&!overlayEl.hidden)drawPreview(pv);
  }
  function drawPreview(pv){
    const ui=window.GameUI,el=ui&&ui.previewElem?ui.previewElem():Player.element(player),who=ui&&ui.previewWho?ui.previewWho():null,dpr=Math.min(2,devicePixelRatio||1),cw=pv.clientWidth||100,ch=pv.clientHeight||100;
    if(pv.width!==Math.round(cw*dpr)){pv.width=Math.round(cw*dpr);pv.height=Math.round(ch*dpr);}
    const c=pv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,cw,ch);
    const st=Player.stance(who||player),d=ATK[st.type],cyc=d.dur+1.1,ph=time%cyc,sh=seatOf((who||player).equipment),mounted=sh>0,k=ch/100*(mounted?(sh>30?.62:.9):1.15);
    const fake={x:cw/2-(mounted?2:6),y:ch*.86,facing:1,moving:false,walk:0,aim:{x:1,y:0},hurt:-9,blockUntil:0,barrierUntil:0,dead:0,name:'',attack:ph<d.dur?{type:st.type,skill:'normal',start:time-ph,dur:d.dur,aim:{x:1,y:0},hand:'right',stance:st}:null};
    c.save();c.translate(fake.x,fake.y);c.scale(k,k);c.translate(-fake.x,-fake.y);
    const b=ui&&ui.previewBurst?time-ui.previewBurst():9;
    if(el&&!who&&b<.9){c.save();c.globalAlpha=1-b/.9;c.strokeStyle=EL[el].glow;c.lineWidth=3;c.beginPath();c.ellipse(fake.x,fake.y-20,10+b*60,(10+b*60)*.7,0,0,PI2);c.stroke();c.restore();}
    drawHero(c,fake,st,who?null:el,time,{label:false,who:who||undefined});c.restore();
  }
  function activateBurst(el){if(!el)return;const C=EL[el];fx.push({kind:'ring',x:hero.x,y:hero.y-10,r0:8,r1:90,color:C.color,age:0,life:.6,lw:5});burst(hero.x,hero.y-26,C.color,26,200);burst(hero.x,hero.y-26,C.glow,12,120);}
  function loop(ms){const dt=Math.min(.04,(ms-(last||ms))/1000);last=ms;time=ms/1000;update(dt);render();requestAnimationFrame(loop);}

  /* ---------- Điều khiển ---------- */
  // Chế độ chân dung: chỉ mượn bộ vẽ nhân vật (căn lều chọn nhân vật, chợ cho thuê), không chạy game
  if(session.portrait){
    safe=false;
    return {draw(c,who,x,y,k,t,el,opts={}){
      time=t;const st=Player.stance(who),fake={x,y,facing:opts.facing||1,moving:false,walk:0,aim:{x:1,y:0},hurt:-9,blockUntil:0,barrierUntil:0,dead:0,name:'',attack:null,mountAct:null};
      c.save();c.translate(x,y);c.scale(k,k);c.translate(-x,-y);drawHero(c,fake,st,el||null,t,{label:false,who});c.restore();
    },seat:eq=>seatOf(eq)};
  }
  canvas.addEventListener('pointerdown',e=>{if(e.button&&e.button!==0)return;e.preventDefault();const r=canvas.getBoundingClientRect(),pt=screenPoint(e.clientX-r.left,e.clientY-r.top);if(e.pointerType==='mouse')mouseAim={x:pt.x,y:pt.y,t:time};goTo(pt);});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=canvas.getBoundingClientRect(),pt=screenPoint(e.clientX-r.left,e.clientY-r.top);mouseAim={x:pt.x,y:pt.y,t:time};});
  // Đọc vị trí phím (e.code) thay vì ký tự: bộ gõ tiếng Việt biến W thành ư, D thành đ… làm nhận sai nút
  const KEYMAP={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright',KeyE:'e',KeyB:'b',Escape:'escape',Space:' ',Digit1:'1',Digit2:'2',Digit3:'3',Digit4:'4',Numpad1:'1',Numpad2:'2',Numpad3:'3',Numpad4:'4'};
  const keyOf=e=>KEYMAP[e.code]||(e.key&&e.key.length===1?e.key.toLowerCase():String(e.key||'').toLowerCase());
  document.addEventListener('keydown',e=>{
    if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=keyOf(e);
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','escape',' ','1','2','3','4','b'].includes(k))e.preventDefault();
    if(k===' '){keys.add(' ');if(!e.repeat)cast('normal');return;}
    if(['1','2','3','4'].includes(k)){if(!e.repeat)cast(['basic','intermediate','advanced','mount'][Number(k)-1]);return;}
    if(k==='b'&&!e.repeat){window.GameUI?.showBag();return;}
    if(k==='e'&&!e.repeat)interact();else if(k==='escape'){dialogNPC=null;dialogEl.hidden=true;}else keys.add(k);
  });
  document.addEventListener('keyup',e=>{const k=keyOf(e);keys.delete(k);if(k===' ')keys.delete(' ');if(!e.code)keys.clear();});
  window.addEventListener('blur',()=>{keys.clear();stopPad();holdAttack=false;});
  $('#next').onclick=nextLine;
  $('#shopBtn').onclick=()=>{const n=dialogNPC;if(!n||!n.panel)return;endDialog();window.GameUI?.openPanel(n);};
  let padId=null;const pad=$('#pad');
  function padMove(e){if(e.pointerId!==padId)return;const r=pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,d=Math.max(36,Math.hypot(dx,dy));joystick={x:dx/d,y:dy/d};$('.knob').style.transform=`translate(${joystick.x*31}px,${joystick.y*31}px)`;}
  function stopPad(){padId=null;joystick={x:0,y:0};$('.knob').style.transform='';}
  pad.addEventListener('pointerdown',e=>{e.preventDefault();padId=e.pointerId;try{pad.setPointerCapture(padId);}catch(_){}padMove(e);});
  pad.addEventListener('pointermove',padMove);
  pad.addEventListener('pointerup',e=>{if(e.pointerId===padId)stopPad();});pad.addEventListener('pointercancel',e=>{if(e.pointerId===padId)stopPad();});pad.addEventListener('lostpointercapture',e=>{if(e.pointerId===padId)stopPad();});
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{last=0;keys.clear();stopPad();holdAttack=false;if(document.hidden)save();});
  window.addEventListener('pagehide',()=>{save();});
  groundDraw();resize();syncMerc();requestAnimationFrame(loop);
  window.mapGame={hero,player,camera,monsters,allies,get route(){return route;},get seen(){return [...seen];},get safe(){return safe;},get HD(){return HD;},now:()=>time,screenPoint,goTo,cast,message,activateBurst,svg,save,op,refreshHD,syncMerc,
    hammer(color){let n=0;const t=setInterval(()=>{burst(hero.x+hero.facing*14,hero.y-26,color||'#ffcf7a',6,140);if(color)fx.push({kind:'ring',x:hero.x,y:hero.y-20,r0:6,r1:46,color,age:0,life:.4,lw:3});else shake(2);if(++n>=3)clearInterval(t);},380);},
    levelUp,
    setHold(v){holdAttack=!!v;},
    enhanceFx(ok){const c=ok?'#ffd77a':'#9aa0a6';fx.push({kind:'ring',x:hero.x,y:hero.y-20,r0:6,r1:ok?80:40,color:c,age:0,life:.5,lw:4});burst(hero.x,hero.y-24,c,ok?24:10,ok?200:90);},
    home(){route=[];targetNPC=null;dialogNPC=null;dialogEl.hidden=true;keys.clear();joystick={x:0,y:0};hero.attack=null;hero.mountAct=null;projectiles.length=0;Object.assign(hero,World.spawn);allies.forEach((e,i)=>{e.x=hero.x+FORM[i%6][0];e.y=hero.y+FORM[i%6][1];if(!World.canStand(e.x,e.y)){e.x=hero.x;e.y=hero.y;}e.path=null;});resize();},
    stop(){route=[];targetNPC=null;keys.clear();joystick={x:0,y:0};holdAttack=false;},
    closeDialog(){dialogNPC=null;dialogEl.hidden=true;}};
};
