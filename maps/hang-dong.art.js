/* Hình vẽ riêng của bản đồ Hang động: nền đá, vách hang, sông ngầm, rêu sáng; thạch nhũ, pha lê, nấm phát sáng, đuốc, tơ nhện, tổ đại bàng;
   Dơi quỷ, Nhện độc, trùm Đại Bàng Tinh; bóng tối trong hang, chỉ sáng quanh người, đuốc, pha lê */
K=>{
  const {ell,line,poly,rr,shade,hash,PI2}=K;
  function tile(c,x,y,v,n,T,G){
    const X=x*T,Y=y*T,h=hash(x,y);
    if(v===1){ // vách hang: đá sẫm, mặt vách sáng hơn khi bên dưới là lối đi
      c.fillStyle=K.mix('#2c2622','#1f1b18',K.noise(x,y,3,6));c.fillRect(X,Y,T,T);
      for(let i=0;i<3;i++){const px=X+hash(x,y,i)*40,py=Y+hash(x,y,i+4)*40;poly(c,[px,py,px+12,py-4,px+15,py+7,px+3,py+10],'#3a322c');}
      if(G(x,y+1)!==1){const g=c.createLinearGradient(0,Y+T-22,0,Y+T);g.addColorStop(0,'#4a3f36');g.addColorStop(1,'#2a231e');c.fillStyle=g;c.fillRect(X,Y+T-22,T,22);
        c.fillStyle='#5a4d42';for(let k=0;k<3;k++){const sx=X+6+k*15+(h*6|0);poly(c,[sx,Y+T-22,sx+6,Y+T-22,sx+3,Y+T-8-(hash(x,y,k)*8|0)],'#5a4d42');}
        ell(c,X+T/2,Y+T+3,T*.55,5,'#00000044');}
      if(G(x,y-1)!==1){c.fillStyle='#463b33';c.fillRect(X,Y,T,3);}
      return;
    }
    const k=K.noise(x,y,4,3);c.fillStyle=K.mix('#4d4640','#3c3631',k);c.fillRect(X,Y,T,T);
    for(let i=0;i<3;i++){const px=X+hash(x,y,i+30)*44,py=Y+hash(x,y,i+40)*44;ell(c,px,py,7+i*3,3+i,'#5a524b66');}
    if(v===5||h<.2){for(let i=0;i<5;i++){const px=X+4+hash(x,y,i)*40,py=Y+4+hash(x,y,i+9)*40;ell(c,px,py,2+hash(x,y,i+3)*2,1.6,'#6e655c');}}
    if(v===4){ell(c,X+T/2,Y+T/2,T*.6,T*.5,'#6a5c4c55');}
    if(v===3){ // cầu đá tự nhiên
      c.fillStyle='#6b6258';c.fillRect(X,Y,T,T);c.strokeStyle='#4f473f';c.lineWidth=2;for(let k=0;k<3;k++){c.beginPath();c.moveTo(X,Y+8+k*16);c.lineTo(X+T,Y+10+k*16);c.stroke();}}
  }
  function over(c,def,T,G){
    const {w,h}=def;
    // sông ngầm: bờ đá ướt, nước xanh thẫm; rêu sáng: thảm rêu tròn có đốm sáng
    K.blob(c,G,w,h,T,2,.95,'#2e4a4f');K.blob(c,G,w,h,T,2,.8,'#1d4655');K.blob(c,G,w,h,T,2,.6,'#173c4a');
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=G(x,y),X=x*T,Y=y*T;
      if(v===2&&hash(x,y,5)>.5){c.fillStyle='#4f8a9c';c.fillRect(X+8+hash(x,y)*20,Y+16,16,2);}
      if(v===6){for(let i=0;i<3;i++){const px=X+10+hash(x,y,i+20)*28,py=Y+10+hash(x,y,i+29)*28;ell(c,px,py,9+i*2,5+i,'#2f5a44aa',hash(x,y,i)*3);}for(let i=0;i<5;i++){const px=X+6+hash(x,y,i)*36,py=Y+6+hash(x,y,i+9)*36;ell(c,px,py,1.8,1.8,'#7dffb0');ell(c,px,py,4,4,'#7dffb033');}}
      if(v===3){c.fillStyle='#6b6258';c.fillRect(X,Y,T,T);c.strokeStyle='#4f473f';c.lineWidth=2;for(let k=0;k<3;k++){c.beginPath();c.moveTo(X,Y+8+k*16);c.lineTo(X+T,Y+10+k*16);c.stroke();}if(G(x,y-1)===2||G(x,y+1)===2){c.fillStyle='#857a6c';c.fillRect(X,G(x,y-1)===2?Y:Y+T-4,T,4);}}}
  }
  const shadow=(c,x,y,rx,ry)=>ell(c,x+rx*.3,y+3,rx,ry,'#00000055');
  const obj={
    // thạch nhũ mọc từ nền (măng đá), có vệt nước nhỏ giọt
    stalag(c,o,t){const x=o.x,y=o.y,s=.8+(o.seed%4)*.15;shadow(c,x,y,16*s,5*s);
      poly(c,[x-14*s,y,x-4*s,y-46*s,x+2*s,y-56*s,x+6*s,y-40*s,x+14*s,y],'#9a8a74');poly(c,[x+2*s,y-56*s,x+6*s,y-40*s,x+14*s,y,x+2*s,y],'#7a6c5a');
      line(c,[x-6*s,y-6*s,x-3*s,y-34*s],'#b8a88e',2);poly(c,[x+10*s,y,x+16*s,y-20*s,x+20*s,y],'#8a7a64');
      const d=(t*.6+o.seed*.13)%1;ell(c,x+2*s,y-56*s-30+d*10,1.6,2.4,'#a8e0ff'+(d<.8?'cc':'44'));},
    crystal(c,o,t){const x=o.x,y=o.y,col=o.light||'#7fd8ff',gl=.6+Math.sin(t*2+o.seed)*.25;shadow(c,x,y,16,5);
      c.save();c.shadowColor=col;c.shadowBlur=14*gl;
      [[-10,-24,-4],[0,-40,0],[9,-28,4],[-3,-18,-8],[14,-14,6]].forEach(([dx,h,tl],i)=>{poly(c,[x+dx-5,y,x+dx+tl,y+h,x+dx+5,y],shade(col,.35));poly(c,[x+dx+tl,y+h,x+dx+5,y,x+dx,y],shade(col,-.15));});
      c.restore();ell(c,x,y-30,2,6,'#ffffffaa');},
    shroom(c,o,t){const x=o.x,y=o.y-6,col=o.light||'#9dffb0',gl=.5+Math.sin(t*1.5+o.seed)*.3;
      c.save();c.shadowColor=col;c.shadowBlur=10*gl;
      [[-8,0,7],[4,-2,9],[12,2,5]].forEach(([dx,dy,r])=>{rr(c,x+dx-1.5,y+dy-r,3,r+4,1,'#d8e8d0');c.beginPath();c.fillStyle=col;c.ellipse(x+dx,y+dy-r,r,r*.6,0,Math.PI,0);c.fill();ell(c,x+dx-r*.3,y+dy-r*1.2,1.2,1.2,'#ffffff');});
      c.restore();},
    torch(c,o,t){const x=o.x,y=o.y,f=Math.sin(t*14+o.seed)*1.5;shadow(c,x,y,6,3);
      line(c,[x,y,x,y-40],'#5a3e28',4);rr(c,x-5,y-46,10,8,2,'#3a2a1c');
      c.save();c.shadowColor='#ffb060';c.shadowBlur=18;poly(c,[x-6,y-46,x+f,y-66,x+6,y-46],'#ff8a3d');poly(c,[x-3,y-46,x+f*.6,y-58,x+3,y-46],'#ffe07a');c.restore();},
    web(c,o){const x=o.x,y=o.y-14;c.strokeStyle='#e8e8f099';c.lineWidth=1;
      for(let i=0;i<8;i++){const a=i/8*PI2;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*26,y+Math.sin(a)*16);c.stroke();}
      for(let r=6;r<=24;r+=6){c.beginPath();for(let i=0;i<=8;i++){const a=i/8*PI2;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.62);}c.stroke();}},
    // tổ Đại Bàng: cành khô đan, xương, trứng
    nest(c,o,t){const x=o.x,y=o.y;ell(c,x,y-4,74,22,'#3a2a1c');
      for(let i=0;i<26;i++){const a=i/26*PI2,r=60+hash(i,1)*14;line(c,[x+Math.cos(a)*r,y-4+Math.sin(a)*r*.3,x+Math.cos(a+.6)*(r-18),y-4+Math.sin(a+.6)*(r-18)*.3],i%2?'#7a5a3a':'#5e4430',3);}
      ell(c,x,y-6,46,13,'#2a1e14');
      [[-14,-10],[2,-12],[16,-8]].forEach(([dx,dy])=>{ell(c,x+dx,y+dy,8,10,'#e8dcc0');ell(c,x+dx-2,y+dy-3,3,4,'#fff8e8');});
      line(c,[x-40,y+4,x-20,y+10],'#efe4c8',3);ell(c,x-44,y+3,5,4,'#efe4c8');}
  };
  /* ---------- Quái ---------- */
  const mon={
    // Dơi quỷ: cánh màng vỗ nhanh, tai nhọn, mắt đỏ rực, nanh
    'doi-quy'(c,m,M,s){const {col,t,open}=s,hv=-40-Math.sin(t*4+m.id)*6+(open?14:0),fl=Math.sin(t*(m.moving?16:11)+m.id);
      c.save();c.translate(0,hv);const W=col('#3a2440'),Wd=col('#24162a'),B=col('#4a3050');
      for(const sd of [-1,1]){const wy=fl*14;c.save();c.scale(sd,1);c.fillStyle=sd<0?Wd:W;c.beginPath();c.moveTo(-2,-2);c.lineTo(-12,-14-wy);c.lineTo(-30,-18-wy*1.4);c.lineTo(-44,-6-wy*1.2);c.quadraticCurveTo(-36,-2-wy,-32,4-wy*.6);c.quadraticCurveTo(-24,0,-20,6-wy*.4);c.quadraticCurveTo(-12,2,-4,6);c.fill();
        c.strokeStyle=col('#5a3a62');c.lineWidth=1.2;c.beginPath();c.moveTo(-6,-4);c.lineTo(-30,-18-wy*1.4);c.moveTo(-10,-6);c.lineTo(-36,-2-wy);c.stroke();c.restore();}
      ell(c,0,0,11,9,B);poly(c,[-6,-6,-9,-18,-1,-8],B);poly(c,[3,-8,8,-19,9,-5],B);
      ell(c,5,-1,2.6,2.2,'#ff3a2a');ell(c,-3,-1,2.6,2.2,'#ff3a2a');c.save();c.shadowColor='#ff3a2a';c.shadowBlur=8;ell(c,5,-1,1.2,1.2,'#ffd0c0');ell(c,-3,-1,1.2,1.2,'#ffd0c0');c.restore();
      poly(c,[0,5,2,10,3,5],'#ffffff');poly(c,[-2,5,-1,10,1,5],'#ffffff');if(open)ell(c,1,7,4,3,'#5a1010');
      c.restore();},
    // Nhện độc: bụng to có vân đỏ, 8 chân gập, cụm mắt đỏ, nanh; đứng dậy khi cắn
    'nhen-doc'(c,m,M,s){const {col,g,open,t}=s,mv=m.moving?1:0,B=col('#2a1e30'),D=col('#160f1a'),R=col('#c0283a');
      if(open){c.save();c.rotate(-.25);}
      for(let i=0;i<4;i++)for(const sd of [-1,1]){const bx=-2+i*6,ph=g*1.8+i*1.3+(sd>0?Math.PI:0),k=Math.sin(ph)*4*mv,sp=-22+i*14;line(c,[bx,-16,bx+sp*.5+k,-30-(i%2)*4,bx+sp+k*1.4,0],sd>0?D:B,2.6);}
      ell(c,-20,-18,18,14,B);ell(c,-20,-20,10,7,R);poly(c,[-26,-20,-20,-12,-14,-20,-20,-28],D);for(let k=0;k<3;k++)ell(c,-30+k*10,-27,2.4,1.6,col('#e04a5a'));
      ell(c,6,-16,10,8,B);for(let k=0;k<4;k++){ell(c,10+(k%2)*4,-21+(k>>1)*4,1.8,1.8,'#ff4a3a');}
      const fo=open?3:0;line(c,[13,-12,16+fo,-4,13+fo,-2],col('#5a3a20'),2.4);line(c,[10,-11,12+fo,-3,9+fo,-1],col('#5a3a20'),2.4);
      if(open){c.restore();for(let k=0;k<3;k++)ell(c,26+k*6,-8+k*2,2.2,2.2,'#a8ff6a99');}},
    // Đại Bàng Tinh: chim khổng lồ, sải cánh rộng vỗ chậm, mào lông vàng, mắt đỏ, vuốt duỗi khi lao xuống
    'dai-bang'(c,m,M,s){const {col,t,open}=s,hv=-52-Math.sin(t*1.6)*8+(open?30:0),fl=Math.sin(t*(m.moving?5:3));
      c.save();c.translate(0,hv);if(open)c.rotate(.3);c.scale(1.25,1.25);
      const B=col('#6a4426'),D=col('#3e2614'),G=col('#d9a84a'),L=col('#efe2c4'),up=fl*26;
      const wing=(far)=>{const cl=far?D:B,u=far?up*.8:up;c.fillStyle=cl;c.beginPath();c.moveTo(-6,-10);c.quadraticCurveTo(-30,-40-u,-70,-44-u*1.3);
        for(let k=0;k<6;k++){c.lineTo(-84+k*3,-36-u*1.2+k*8);c.lineTo(-76+k*4,-34-u*1.1+k*8);}c.quadraticCurveTo(-30,4,-4,2);c.fill();
        c.strokeStyle=far?shade('#3e2614',.15):G;c.lineWidth=1.4;for(let k=0;k<5;k++){c.beginPath();c.moveTo(-14-k*9,-12-k*2);c.lineTo(-28-k*10,-30-u*(.5+k*.15));c.stroke();}};
      wing(true);
      poly(c,[-22,-6,-48,-2,-50,8,-44,4,-40,12,-34,6,-22,4],D);
      ell(c,0,-4,26,14,B);ell(c,6,0,16,9,G);
      c.save();c.translate(24,-20);ell(c,0,0,12,11,L);poly(c,[-8,-8,-16,-24,-4,-12],G);poly(c,[-2,-10,-4,-28,6,-12],G);poly(c,[4,-9,10,-22,10,-8],G);
      poly(c,[8,-4,24,0,18,8,10,4],'#e8b030');poly(c,[18,4,24,0,22,8],'#3a2a10');ell(c,6,-4,3,2.6,'#ff2a1a');ell(c,6,-4,1.2,1.6,'#2a0000');c.restore();
      wing(false);
      const ta=open?16:6;for(const dx of [-6,8]){line(c,[dx,8,dx+4,8+ta],'#e8b030',3.4);for(let k=-1;k<=1;k++)line(c,[dx+4,8+ta,dx+8+k*3,12+ta],'#2a1a0a',2);}
      c.restore();
      if(open){for(let i=0;i<10;i++){const a=i/10*PI2+t*5;ell(c,40+Math.cos(a)*30,-10+Math.sin(a)*10,3,2,'#ffe2a0');}}}
  };
  // Trong hang tối: chỉ sáng quanh người chơi, đuốc, pha lê, nấm, lửa trại (vẽ lớp tối ở độ phân giải nửa để nhẹ máy)
  let dark=null,dc=null;
  function sky(c,s){const {w,h,t,sc,cam,lights,T}=s,q=.5,W2=Math.ceil(w*q),H2=Math.ceil(h*q);
    if(!dark){dark=document.createElement('canvas');dc=dark.getContext('2d');}
    if(dark.width!==W2||dark.height!==H2){dark.width=W2;dark.height=H2;}
    dc.globalCompositeOperation='source-over';dc.clearRect(0,0,W2,H2);dc.fillStyle='rgba(6,6,12,.82)';dc.fillRect(0,0,W2,H2);
    dc.globalCompositeOperation='destination-out';
    const hole=(x,y,r,a)=>{if(x<-r||y<-r||x>W2+r||y>H2+r)return;const g=dc.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(0,0,0,'+a+')');g.addColorStop(.55,'rgba(0,0,0,'+a*.7+')');g.addColorStop(1,'rgba(0,0,0,0)');dc.fillStyle=g;dc.fillRect(x-r,y-r,r*2,r*2);};
    hole(s.hx*q,s.hy*q,(250+Math.sin(t*3)*6)*sc*q,1);
    const all=lights.concat(s.fires||[]);
    for(const o of all){const x=(o.x-cam.x)*sc*q,y=(o.y-26-cam.y)*sc*q,big=o.kind==='torch'||o.kind==='fire'?170:o.kind==='crystal'?120:80;hole(x,y,(big+Math.sin(t*4+(o.seed||0))*5)*sc*q,o.kind==='shroom'?.6:.9);}
    c.drawImage(dark,0,0,w,h);
    // ánh màu của nguồn sáng
    c.save();c.globalCompositeOperation='lighter';
    for(const o of all){const x=(o.x-cam.x)*sc,y=(o.y-26-cam.y)*sc,r=(o.kind==='torch'||o.kind==='fire'?120:70)*sc;if(x<-r||y<-r||x>w+r||y>h+r)continue;const col=o.light||'#ff9a50',g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col+'40');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
    c.restore();
    // giọt nước rơi
    c.fillStyle='#a8d8ff88';for(let i=0;i<14;i++){const ph=(t*.7+i*.37)%1,x=((i*197)%w),y=ph*h;c.fillRect(x,y,1.2,6);}}
  return {theme:{cave:{tile,over,ripple:'#5f9aac55'}},obj,mon,sky:{cave:sky},ring:{'dai-bang':'#ffcf7a','nhen-doc':'#a8ff6a','doi-quy':'#ff6a6a'}};
}
