/* Hang Cướp (phó bản dưới tháp cổ Sa mạc): nền đá hang, đuốc, pha lê vàng; đống vàng, bạc nén của toán cướp */
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
  // vàng bạc của toán cướp
  obj.gold=(c,o,t)=>{const x=o.x,y=o.y,s=o.s||1;ell(c,x,y+2,36*s,9*s,'#00000066');
    poly(c,[x-34*s,y,x-20*s,y-15*s,x-4*s,y-25*s,x+13*s,y-21*s,x+32*s,y],'#a8760a');poly(c,[x-24*s,y-5*s,x-9*s,y-20*s,x+10*s,y-18*s,x+24*s,y-4*s],'#dca21c');
    c.save();c.shadowColor='#ffd040';c.shadowBlur=8;
    for(let i=0;i<20;i++){const u=hash(i,o.tx||1,7)-.5,px=x+u*56*s,py=y-3-hash(i,(o.ty||1)+3,9)*20*s*(1-Math.abs(u)*1.6);ell(c,px,py,4.2*s,2.3*s,'#ffd84a');ell(c,px-1,py-.7,2*s,1*s,'#fff4b0');}
    c.restore();[['#e0304a',-11,-12],['#30c070',9,-11],['#4a86ff',-1,-21]].forEach(([col,dx,dy])=>poly(c,[x+dx*s,y+dy*s-4,x+dx*s+4,y+dy*s,x+dx*s,y+dy*s+4,x+dx*s-4,y+dy*s],col));
    const tw=(t*1.1+(o.tx||0)*.37)%1;if(tw<.25){c.save();c.globalAlpha=1-tw/.25;line(c,[x+6,y-26*s-7,x+6,y-26*s+7],'#fffbe0',1.6);line(c,[x-1,y-26*s,x+13,y-26*s],'#fffbe0',1.6);c.restore();}};
  obj.bac=(c,o)=>{const x=o.x,y=o.y;ell(c,x,y+2,26,6,'#00000055');
    for(const [dx,dy] of [[-11,0],[9,0],[-1,-9]]){poly(c,[x+dx-11,y+dy,x+dx-8,y+dy-9,x+dx+8,y+dy-9,x+dx+11,y+dy],'#b8bec8');ell(c,x+dx,y+dy-9,7,3.2,'#eef2f8');ell(c,x+dx,y+dy-10,3,1.4,'#ffffff');}};
  return {theme:{cave:{tile,over,ripple:'#5f9aac55'}},obj};
}
