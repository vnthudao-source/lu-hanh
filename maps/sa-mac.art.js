/* Hình vẽ riêng của bản đồ Sa mạc: nền cát, đá đỏ, ốc đảo; xương rồng, thốt nốt, tháp Chàm đổ; Bọ cạp cát, Kền kền, trùm Chằn Tinh, Thạch Tinh; cát bay */
K=>{
  const {ell,line,poly,rr,shade,hash,PI2}=K;
  function tile(c,x,y,v,n,T,G){
    const X=x*T,Y=y*T,h=hash(x,y);
    if(v===1){ // núi đá đỏ: mặt trên loang màu, nứt; viền sáng; vách đứng hắt bóng phía dưới
      c.fillStyle=K.mix('#bd6a44','#a45434',K.noise(x,y,3,7));c.fillRect(X,Y,T,T);
      for(let i=0;i<3;i++){const px=X+K.hash(x,y,i)*40,py=Y+K.hash(x,y,i+5)*40;K.ell(c,px+4,py+4,6+i*2,3+i,'#c97a5255');}
      if(h>.55)line(c,[X+8,Y+10+(h*20|0),X+20,Y+16+(h*20|0),X+30,Y+12+(h*20|0)],'#8a4430',1.5);
      if(G(x,y-1)!==1){c.fillStyle='#d9926a';c.fillRect(X,Y,T,4);}
      if(G(x-1,y)!==1){c.fillStyle='#cd8460';c.fillRect(X,Y,4,T);}
      if(G(x+1,y)!==1){c.fillStyle='#8f4630';c.fillRect(X+T-4,Y,4,T);}
      if(G(x,y+1)!==1){const g=c.createLinearGradient(0,Y+T-18,0,Y+T);g.addColorStop(0,'#8a3e2a');g.addColorStop(1,'#5e2a1d');c.fillStyle=g;c.fillRect(X,Y+T-18,T,18);c.fillStyle='#4a2016';for(let k=0;k<4;k++)c.fillRect(X+4+k*12+(h*6|0),Y+T-16,2,16);K.ell(c,X+T/2,Y+T+3,T*.55,5,'#7a5a2a33');}
      return;
    }
    // cát: màu đổi dần theo nhiễu, gợn gió nối liền giữa các ô
    const k=K.noise(x,y,5),base=K.mix('#ebd29c','#d8b67a',k);c.fillStyle=base;c.fillRect(X,Y,T,T);
    c.lineWidth=1.3;
    for(let yy=Y+4;yy<Y+T;yy+=12){const ph=yy*.13,amp=3+K.noise(x,y,3,5)*3,a=.25+K.noise(x,yy/T,4,9)*.45;
      c.globalAlpha=a;c.strokeStyle='#c09c62';c.beginPath();c.moveTo(X,yy+Math.sin(X/34+ph)*amp);for(let xx=X+6;xx<=X+T;xx+=6)c.lineTo(xx,yy+Math.sin(xx/34+ph)*amp);c.stroke();
      c.strokeStyle='#fbecc6';c.beginPath();c.moveTo(X,yy-2+Math.sin(X/34+ph)*amp);for(let xx=X+6;xx<=X+T;xx+=6)c.lineTo(xx,yy-2+Math.sin(xx/34+ph)*amp);c.stroke();}
    c.globalAlpha=1;
    if(v===4){ // đường mòn: cát nén sẫm hơn, đá cuội rải rác
      K.ell(c,X+T/2,Y+T/2,T*.62,T*.55,'#b8955a2a');for(let i=0;i<4;i++){const px=X+4+K.hash(x,y,i)*38,py=Y+4+K.hash(x,y,i+9)*38,r=2+K.hash(x,y,i+3)*3;K.ell(c,px,py+1,r+1,r*.7+1,'#9c7c4c66');K.ell(c,px,py,r,r*.7,'#d6c29a');}
    }
    if(h<.05){c.fillStyle='#b99a64';c.fillRect(X+(h*700|0)%40,Y+30,3,2);c.fillRect(X+(h*900|0)%40,Y+12,2,2);}
  }
  // đồi cát: gò lớn, sáng phía trên, bóng phía dưới
  function over(c,def,T,G){
    const {w,h}=def;
    // ốc đảo: cỏ, bờ cát ướt, mặt nước, gợn sáng (mép tròn)
    K.blob(c,G,w,h,T,6,.95,'#9bb466');K.blob(c,G,w,h,T,6,.8,'#90ac5a');
    K.blob(c,G,w,h,T,2,.95,'#c9c48a');K.blob(c,G,w,h,T,2,.8,'#4e9ea4');K.blob(c,G,w,h,T,2,.72,'#43939c');
    c.strokeStyle='#6f8f3e';c.lineWidth=1.3;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(G(x,y)===6)for(let k=0;k<5;k++){const gx=x*T+4+hash(x,y,k)*40,gy=y*T+4+hash(x,y,k+7)*38;c.beginPath();c.moveTo(gx,gy+6);c.lineTo(gx+1.5,gy);c.moveTo(gx+3,gy+6);c.lineTo(gx+5,gy+1);c.stroke();}
    c.fillStyle='#8fd0d0';for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(G(x,y)===2&&hash(x,y,3)>.4)c.fillRect(x*T+8+hash(x,y)*24,y*T+14+hash(x,y,1)*20,14,2);
    for(const d of def.decor||[]){if(d.kind!=='dune')continue;const cx=(d.x+d.w/2)*T,cy=(d.y+d.h/2)*T,rx=d.w*T/2,ry=d.h*T/2;
      const g=c.createLinearGradient(0,cy-ry,0,cy+ry);g.addColorStop(0,'#f4dca688');g.addColorStop(.55,'#e2c38800');g.addColorStop(1,'#b8925a66');
      c.fillStyle=g;c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,PI2);c.fill();
      c.strokeStyle='#f8e8c0aa';c.lineWidth=2;c.beginPath();c.moveTo(cx-rx*.85,cy+ry*.1);c.quadraticCurveTo(cx-rx*.2,cy-ry*.9,cx+rx*.8,cy-ry*.1);c.stroke();}
  }
  const shadow=(c,x,y,rx,ry)=>ell(c,x+rx*.35,y+3,rx,ry,'#7a5a2a33');
  const obj={
    cactus(c,o,t){const x=o.x,y=o.y,s=.8+(o.seed%5)*.08,h=46*s;shadow(c,x,y,14,5);
      rr(c,x-6,y-h,12,h+2,6,'#5f8f4a');rr(c,x-6,y-h,4,h,3,'#79a95c');
      if(o.seed%2){rr(c,x-18,y-h*.62,8,20,4,'#5f8f4a');rr(c,x-18,y-h*.42,14,7,3,'#5f8f4a');}
      rr(c,x+8,y-h*.78,8,22,4,'#5f8f4a');rr(c,x+4,y-h*.5,12,7,3,'#5f8f4a');
      c.fillStyle='#e9f0c8';for(let k=0;k<6;k++)c.fillRect(x-5+(k%3)*4,y-h+6+k*6,1.4,1.4);
      if(o.seed%3===0){ell(c,x,y-h-2,4,3,'#f07aa0');ell(c,x,y-h-2,1.6,1.6,'#ffe07a');}},
    palm(c,o,t){const x=o.x,y=o.y,sw=Math.sin(t*1.1+o.seed)*2,h=84+(o.seed%3)*8;shadow(c,x,y,24,7);
      c.strokeStyle='#8a6a44';c.lineWidth=6;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-8,y-h*.5,x+4+sw,y-h);c.stroke();
      c.strokeStyle='#6f5232';c.lineWidth=1;for(let s=8;s<h;s+=8){c.beginPath();c.moveTo(x-4-(s/h)*4,y-s);c.lineTo(x+2-(s/h)*4,y-s);c.stroke();}
      const tx=x+4+sw,ty=y-h;for(let f=0;f<9;f++){const a=-Math.PI/2+(f-4)*.45;c.strokeStyle=f%2?'#4f8a3a':'#63a046';c.lineWidth=3;c.beginPath();c.moveTo(tx,ty);c.quadraticCurveTo(tx+Math.cos(a)*24,ty+Math.sin(a)*24-10,tx+Math.cos(a)*40,ty+Math.sin(a)*22+12);c.stroke();}
      for(let k=0;k<4;k++)ell(c,tx-4+k*3,ty+6,2.6,3.4,'#7a3a22');},
    rock(c,o){const x=o.x,y=o.y,s=.8+(o.seed%4)*.15;shadow(c,x,y,22*s,7*s);
      poly(c,[x-22*s,y,x-16*s,y-22*s,x-2*s,y-30*s,x+16*s,y-20*s,x+22*s,y],'#b56a46');poly(c,[x-2*s,y-30*s,x+16*s,y-20*s,x+22*s,y,x+4*s,y],'#8f4a32');line(c,[x-12*s,y-14*s,x-2*s,y-18*s],'#d08c62',2);},
    bones(c,o){const x=o.x,y=o.y-10;c.strokeStyle='#f1e6cc';c.lineWidth=3;c.lineCap='round';
      line(c,[x-22,y,x+18,y],'#efe4c8',3);for(let k=0;k<5;k++){c.beginPath();c.ellipse(x-14+k*7,y,4,9,0,Math.PI*1.05,Math.PI*1.95);c.stroke();}
      ell(c,x+24,y-2,7,5.5,'#efe4c8');c.fillStyle='#5a4a3a';c.fillRect(x+24,y-4,2.4,2.4);line(c,[x+30,y+1,x+33,y+3],'#efe4c8',2);},
    tent(c,o){const x=o.x,y=o.y;shadow(c,x,y,46,9);poly(c,[x-44,y,x,y-50,x+44,y],'#d9c49a');poly(c,[x,y-50,x+44,y,x+14,y],'#b9a175');
      c.strokeStyle='#a8483a';c.lineWidth=3;for(let k=1;k<4;k++){c.beginPath();c.moveTo(x-44+k*11,y-k*12.5+0);c.lineTo(x+44-k*11,y-k*12.5);c.stroke();}
      poly(c,[x-8,y,x,y-26,x+8,y],'#5a4430');line(c,[x,y-50,x,y-62],'#6b4a2e',2);poly(c,[x,y-62,x+12,y-58,x,y-55],'#c0453a');},
    // Tháp Chàm đổ nát: gạch đỏ, nhiều tầng, đỉnh vỡ
    tower(c,o,t){const x=o.x,y=o.y;shadow(c,x,y,66,13);
      const B='#a8573c',D='#86412c',L='#c7714f';
      rr(c,x-62,y-26,124,28,3,D);rr(c,x-58,y-30,116,10,2,L);
      rr(c,x-48,y-112,96,86,3,B);c.fillStyle=D;c.fillRect(x+16,y-112,32,86);
      for(let k=0;k<5;k++){c.fillStyle='#8f4a33';c.fillRect(x-44+k*22,y-104,6,74);}
      poly(c,[x-16,y-26,x-16,y-70,x,y-84,x+16,y-70,x+16,y-26],'#3a2118');poly(c,[x-10,y-26,x-10,y-66,x,y-76,x+10,y-66,x+10,y-26],'#1c100b');
      rr(c,x-54,y-124,108,14,3,L);rr(c,x-40,y-170,80,48,3,B);c.fillStyle=D;c.fillRect(x+12,y-170,28,48);rr(c,x-46,y-180,92,12,3,L);
      poly(c,[x-30,y-180,x-22,y-214,x-6,y-204,x+4,y-226,x+14,y-198,x+28,y-206,x+32,y-180],B);poly(c,[x+4,y-226,x+14,y-198,x+28,y-206,x+32,y-180,x+8,y-180],D);
      for(const s of [-1,1]){poly(c,[x+s*58,y-124,x+s*66,y-148,x+s*52,y-128],L);poly(c,[x+s*44,y-180,x+s*50,y-198,x+s*38,y-182],L);}
      c.fillStyle='#e6b48a';for(let k=0;k<6;k++)c.fillRect(x-30+k*12,y-140,6,3);
      c.strokeStyle='#5c7a3a';c.lineWidth=2;c.beginPath();c.moveTo(x-48,y-60);c.quadraticCurveTo(x-60,y-40,x-52,y-26);c.stroke();ell(c,x-55,y-42,4,3,'#6f9a44');},
    ruin(c,o){const x=o.x,y=o.y,h=30+(o.seed%3)*12;shadow(c,x,y,16,6);rr(c,x-12,y-h,24,h+2,2,'#a8573c');c.fillStyle='#86412c';c.fillRect(x+4,y-h,8,h);
      poly(c,[x-14,y-h,x-6,y-h-8,x+2,y-h-3,x+12,y-h-10,x+14,y-h],'#c7714f');c.fillStyle='#8f4a33';for(let k=0;k<3;k++)c.fillRect(x-12,y-h+8+k*10,24,2);
      rr(c,x+14,y-8,14,10,2,'#9a5038');}
  };
  /* ---------- Quái ---------- */
  const mon={
    // Bọ cạp cát: 8 chân, càng kẹp, đuôi cong có ngòi độc
    'bo-cap'(c,m,M,s){const {col,g,open}=s,mv=m.moving?1:0,B=col('#c48a3a'),D=col('#8a5a22'),L=col('#e0b062');
      for(let i=0;i<4;i++)for(const sd of [-1,1]){const lx=-12+i*7,ph=g*1.6+i+(sd>0?Math.PI:0),k=Math.sin(ph)*3*mv;line(c,[lx,-10,lx-4+k,-16-sd*2,lx-8+k*1.4,0],sd>0?D:B,2.2);}
      ell(c,-6,-11,15,7,B);for(let k=0;k<4;k++)line(c,[-18+k*7,-17,-16+k*7,-5],D,1.4);ell(c,9,-11,8,6,L);
      const sn=open?1:0,cx=26+sn*8;line(c,[12,-12,20,-18,cx,-14],B,3.5);line(c,[12,-8,20,-4,cx,-6],B,3.5);
      for(const [yy,sg] of [[-14,-1],[-6,1]]){ell(c,cx+4,yy,6,4,L);poly(c,[cx+8,yy-sg*1,cx+16,yy-sg*(4+sn*3),cx+9,yy+sg*2],D);poly(c,[cx+8,yy+sg*1,cx+15,yy+sg*3,cx+8,yy+sg*3],D);}
      ell(c,15,-14,1.5,1.5,'#1a1008');ell(c,15,-9,1.5,1.5,'#1a1008');
      const pts=open?[[-18,-12],[-24,-24],[-22,-36],[-10,-44],[6,-42],[18,-32]]:[[-18,-12],[-26,-22],[-28,-34],[-22,-44],[-10,-48],[-2,-42]];
      for(let i=0;i<pts.length-1;i++){const [a,b]=pts[i],[e,f]=pts[i+1];line(c,[a,b,e,f],i%2?B:L,7-i*.6);}
      const [sx,sy]=pts[pts.length-1];poly(c,[sx-3,sy-3,sx+7,sy+6,sx+1,sy+3],col('#3a1a0a'));ell(c,sx,sy,3.4,3.4,col('#7a2a18'));
      if(open)ell(c,sx+6,sy+5,2,2,'#b8ff6a');},
    // Kền kền: bay lượn, cánh xòe, cổ trọc đỏ, mỏ quặp
    'ken-ken'(c,m,M,s){const {col,t,open}=s,hv=-34-Math.sin(t*3+m.id)*5+(open?16:0),fl=Math.sin(t*(m.moving?9:5)+m.id),up=fl*14;
      c.save();c.translate(0,hv);if(open)c.rotate(.35);
      const W=col('#4a3a30'),Wd=col('#2e241e'),Wl=col('#6a5848');
      // cánh xa
      c.fillStyle=Wd;c.beginPath();c.moveTo(-4,-6);c.quadraticCurveTo(-18,-26-up,-40,-24-up*1.4);c.lineTo(-52,-16-up*1.5);c.lineTo(-46,-10-up);c.lineTo(-52,-6-up*1.2);c.lineTo(-40,-4-up*.6);c.quadraticCurveTo(-20,0,-4,0);c.fill();
      ell(c,0,0,18,9,W);poly(c,[-16,-3,-32,4,-34,-2,-30,-6,-16,-6],Wd);ell(c,12,-6,8,5.4,col('#efe4d2'));
      line(c,[14,-8,20,-16,24,-18],col('#c8665a'),4.5);ell(c,26,-19,5,4.4,col('#d77a6a'));poly(c,[29,-21,37,-18,33,-14,30,-16],col('#e8dcb8'));ell(c,27,-21,1.4,1.4,'#1a1008');
      // cánh gần: lông chính tách ngón
      c.fillStyle=W;c.beginPath();c.moveTo(-2,-4);c.quadraticCurveTo(-14,-30-up,-36,-34-up*1.5);for(let k=0;k<5;k++){c.lineTo(-44-k*2,-30-up*1.5+k*6);c.lineTo(-38-k*2,-28-up*1.4+k*6);}c.quadraticCurveTo(-18,2,-2,2);c.fill();
      c.strokeStyle=Wl;c.lineWidth=1.2;for(let k=0;k<4;k++){c.beginPath();c.moveTo(-8-k*6,-4-k);c.lineTo(-20-k*6,-20-up*(.6+k*.2));c.stroke();}
      line(c,[4,8,6,16],col('#a89070'),2);line(c,[-4,8,-4,16],col('#a89070'),2);c.restore();},
    // Chằn Tinh: trăn khổng lồ cuộn khúc, đầu ngóc cao, mắt đỏ, sừng nhỏ
    // trùm Thạch Tinh: người đá cát khổng lồ, mắt lửa; vung tay đập xuống khi ra đòn
    'thach-tinh'(c,m,M,s){const {col,t,open,atk}=s,R=col('#a8673e'),D=col('#6e3f22'),L=col('#d9a271'),g=m.moving?Math.sin(s.g):0,lift=open?-38:atk?-14:Math.sin(t*1.4)*3;
      const rock=(x,y,rx,ry,cl)=>{ell(c,x,y,rx,ry,D);ell(c,x-1,y-2,rx-3,ry-3,cl||R);ell(c,x-rx*.35,y-ry*.4,rx*.35,ry*.25,L);};
      rock(-16-g*6,-14,13,15);rock(16+g*6,-14,13,15);
      rock(0,-52,38,34);for(let k=0;k<5;k++)line(c,[-24+k*11,-70+(k%2)*8,-18+k*11,-44+(k%3)*6],D,2);
      c.save();c.translate(-34,-66);c.rotate(-.3-(open?.5:0));rock(0,14,12,22);rock(-2,40,14,12);c.restore();
      c.save();c.translate(34,-66);c.rotate(.9+lift/40);rock(0,14,12,22);rock(4,38,16,14);c.restore();
      rock(4,-98,22,18);c.fillStyle=col('#ff8a2a');c.shadowColor='#ffb04a';c.shadowBlur=10;c.fillRect(6,-104,6,4);c.fillRect(16,-103,5,4);c.shadowBlur=0;
      if(open)line(c,[8,-90,22,-88],col('#3a1e10'),3);
      c.fillStyle='#e8c89a66';for(let k=0;k<6;k++){const a=t*2+k;c.beginPath();c.arc(Math.cos(a)*44,-8+Math.sin(a*1.3)*4,2,0,PI2);c.fill();}
    },
    'chan-tinh'(c,m,M,s){c.scale(1.3,1.3);const {col,t,open}=s,B=col('#5f7a3a'),D=col('#3f5626'),Y=col('#c9b45a'),sw=Math.sin(t*1.6)*3;
      for(const [y0,rx,ry] of [[-6,54,16],[-22,46,14],[-36,36,12]]){ell(c,0,y0,rx,ry,D);ell(c,0,y0-3,rx-4,ry-4,B);for(let k=-3;k<=3;k++){c.save();c.translate(k*rx/4.2,y0-2);c.rotate(.6);c.fillStyle=Y;c.fillRect(-3,-3,6,6);c.restore();}}
      const hx=open?58:40+sw,hy=open?-84:-96+sw;
      c.lineCap='round';c.strokeStyle=D;c.lineWidth=24;c.beginPath();c.moveTo(-10,-40);c.bezierCurveTo(10,-70,hx-30,hy+40,hx-6,hy+6);c.stroke();
      c.strokeStyle=B;c.lineWidth=18;c.stroke();c.strokeStyle=col('#e8dca0');c.lineWidth=7;c.beginPath();c.moveTo(-4,-44);c.bezierCurveTo(16,-70,hx-26,hy+40,hx-4,hy+10);c.stroke();
      c.save();c.translate(hx,hy);c.rotate(open?.25:0);
      ell(c,0,0,22,13,D);ell(c,-1,-2,19,10,B);poly(c,[-8,-10,-16,-24,-4,-12],col('#c9a85a'));poly(c,[2,-11,-2,-26,8,-12],col('#c9a85a'));
      ell(c,6,-5,4,3.2,'#ff3a1a');ell(c,6,-5,1.5,2.6,'#2a0a00');
      if(open){poly(c,[8,4,26,2,24,14,8,10],'#5a1410');poly(c,[12,4,14,10,16,4],'#fff');poly(c,[19,3,20,8,22,3],'#fff');}
      else{line(c,[20,2,30,3+Math.sin(t*12)*2],'#c0283a',1.6);line(c,[30,3,34,0],'#c0283a',1.2);line(c,[30,3,34,6],'#c0283a',1.2);}
      c.restore();
      if(open)for(let k=0;k<3;k++)ell(c,hx+30+k*8,hy+8+k*3,3,2,'#b8ff6a99');}
  };
  // Cát bay ngang màn hình, ánh nắng gắt
  const dust=[];for(let i=0;i<46;i++)dust.push({x:Math.random(),y:Math.random(),v:.04+Math.random()*.08,s:1+Math.random()*2.2,p:Math.random()*6});
  function sky(c,s){const {w,h,t}=s;
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#fff0c41f');g.addColorStop(.5,'#ffd08a00');g.addColorStop(1,'#d08a3a14');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.fillStyle='#f6dfa8';for(const d of dust){const x=((d.x+t*d.v)%1)*w,y=d.y*h+Math.sin(t*1.3+d.p)*14;c.globalAlpha=.35+.25*Math.sin(t*2+d.p);c.fillRect(x,y,d.s*3,d.s*.7);}c.globalAlpha=1;}
  return {theme:{sand:{tile,over,ripple:'#d8f0ec66'}},obj,mon,sky:{sand:sky},ring:{'chan-tinh':'#c9b45a','thach-tinh':'#d9a271','bo-cap':'#d8b070'}};
}
