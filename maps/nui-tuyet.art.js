/* Hình vẽ riêng của bản đồ Núi tuyết: tuyết, vách đá phủ tuyết, hồ băng; thông tuyết, miếu đá trên đỉnh; Sói tuyết, Gấu ngựa, trùm Hồ Tinh chín đuôi; tuyết rơi */
K=>{
  const {ell,line,poly,rr,shade,hash,PI2}=K;
  function tile(c,x,y,v,n,T,G){
    const X=x*T,Y=y*T,h=hash(x,y);
    if(v===1){ // núi: mặt trên phủ tuyết (xanh nhạt hơn nền), đá lộ rải rác; hàng cuối có vách đá tối, mép trái phải lộ đá
      c.fillStyle=K.mix('#e4edf4','#cfdce7',K.noise(x,y,4,2));c.fillRect(X,Y,T,T);
      if(h>.72){const ox=X+hash(x,y,31)*20,oy=Y+6+hash(x,y,32)*16,sz=.6+hash(x,y,33)*.7;poly(c,[ox,oy+14*sz,ox+8*sz,oy+2*sz,ox+20*sz,oy,ox+26*sz,oy+14*sz],'#7f878e');poly(c,[ox+8*sz,oy+2*sz,ox+20*sz,oy,ox+14*sz,oy+6*sz],'#f6fbff');}
      if(G(x-1,y)!==1){c.fillStyle='#8a939a';c.fillRect(X,Y,5,T);}
      if(G(x+1,y)!==1){c.fillStyle='#5e666d';c.fillRect(X+T-5,Y,5,T);}
      if(G(x,y-1)!==1){c.fillStyle='#ffffff';c.fillRect(X,Y,T,4);}
      if(G(x,y+1)!==1){const top=Y+T-26;c.fillStyle='#6b737a';c.beginPath();c.moveTo(X,Y+T);for(let k=0;k<=8;k++)c.lineTo(X+k*T/8,top+hash(x*8+k,y,22)*8);c.lineTo(X+T,Y+T);c.fill();
        c.fillStyle='#4a5157';for(let k=0;k<4;k++)c.fillRect(X+4+k*12+(h*6|0),top+8,2,18);ell(c,X+T/2,Y+T+3,T*.55,5,'#5a7a9a33');}
      return;
    }
    // tuyết: trắng ngả xanh theo nhiễu, lấp lánh
    const k=K.noise(x,y,5,2);c.fillStyle=K.mix('#f3f7fa','#dde7ef',k);c.fillRect(X,Y,T,T);
    for(let i=0;i<3;i++){const px=X+hash(x,y,i+30)*44,py=Y+hash(x,y,i+40)*44;ell(c,px,py,8+i*3,3+i,'#c9d8e455');}
    if(h<.35){c.fillStyle='#ffffff';c.fillRect(X+(h*120|0)%44,Y+((h*333)|0)%44,2,2);}
    if(v===5&&h>.6){ // vết chân thú trên tuyết
      c.fillStyle='#b9c9d688';for(let i=0;i<4;i++){ell(c,X+8+i*10,Y+18+(i%2)*8,2.2,3,'#b9c9d6aa');}}
    if(v===4){ // đường mòn: tuyết bị giẫm, lộ đất
      for(let i=0;i<4;i++){const px=X+8+hash(x,y,i+50)*32,py=Y+8+hash(x,y,i+60)*32;ell(c,px,py,12,7,'#c4ccd21c',hash(x,y,i)*3);}for(let i=0;i<3;i++){const px=X+6+hash(x,y,i)*36,py=Y+6+hash(x,y,i+9)*36;ell(c,px,py,2.5+i,1.6,'#9a958a77');}}
  }
  function over(c,def,T,G){
    const {w,h}=def;
    // mặt băng (đi được) và hồ băng sâu: mép tròn, vết nứt, ánh phản chiếu
    K.blob(c,G,w,h,T,6,.95,'#cfe6f1');K.blob(c,G,w,h,T,2,.95,'#b6dbeb');K.blob(c,G,w,h,T,2,.78,'#93c6de');K.blob(c,G,w,h,T,2,.6,'#86bcd7');
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=G(x,y);if(v!==2&&v!==6)continue;const X=x*T,Y=y*T;
      if(hash(x,y,8)>.75){c.strokeStyle=v===2?'#e8f6ffaa':'#ffffffaa';c.lineWidth=1.2;const a=hash(x,y,9)*6;c.beginPath();c.moveTo(X+10,Y+12+a);c.lineTo(X+22,Y+20);c.lineTo(X+34,Y+16+a);c.moveTo(X+22,Y+20);c.lineTo(X+26,Y+34);c.stroke();}
      if(v===2&&hash(x,y,10)>.6){c.fillStyle='#ffffffaa';c.fillRect(X+8,Y+8,16,3);c.fillRect(X+12,Y+13,8,2);}}
  }
  const shadow=(c,x,y,rx,ry)=>ell(c,x+rx*.3,y+3,rx,ry,'#4a6a8a30');
  const obj={
    // thông phủ tuyết: nhiều tầng lá, tuyết trên mỗi tầng
    pine(c,o,t){const x=o.x,y=o.y+4,s=.85+(o.seed%4)*.1,sw=Math.sin(t*.9+o.seed)*1.2;shadow(c,x,y,22*s,7*s);
      rr(c,x-3*s,y-14*s,6*s,16*s,2,'#5a4232');
      for(let k=0;k<4;k++){const by=y-10*s-k*17*s,wd=(26-k*5)*s,top=by-24*s,tx=x+sw*k*.5;poly(c,[x-wd,by,tx,top,x+wd,by],k%2?'#2f5a46':'#2a5240');poly(c,[tx,top,x+wd,by,x+wd*.2,by],'#21443a');
        c.fillStyle='#f6fbff';c.beginPath();c.moveTo(x-wd*.82,by-3*s);c.quadraticCurveTo(x-wd*.3,by-8*s,tx,top+2);c.quadraticCurveTo(x+wd*.4,by-9*s,x+wd*.85,by-3*s);c.quadraticCurveTo(x,by-12*s,x-wd*.82,by-3*s);c.fill();}
      ell(c,x+sw*2,y-82*s,4*s,3*s,'#ffffff');},
    snowrock(c,o){const x=o.x,y=o.y,s=.8+(o.seed%4)*.14;shadow(c,x,y,22*s,7*s);
      poly(c,[x-22*s,y,x-16*s,y-18*s,x-2*s,y-26*s,x+16*s,y-18*s,x+22*s,y],'#7d868e');poly(c,[x-2*s,y-26*s,x+16*s,y-18*s,x+22*s,y,x+4*s,y],'#5e666d');
      c.fillStyle='#f6fbff';c.beginPath();c.moveTo(x-17*s,y-16*s);c.quadraticCurveTo(x-6*s,y-30*s,x+15*s,y-18*s);c.quadraticCurveTo(x,y-14*s,x-17*s,y-16*s);c.fill();},
    cairn(c,o){const x=o.x,y=o.y;shadow(c,x,y,14,5);[[0,0,14,7],[1,-11,11,6],[-1,-20,8,5],[0,-27,5,4]].forEach(([dx,dy,rx,ry],i)=>{ell(c,x+dx,y+dy,rx,ry,i%2?'#8a9299':'#6f777e');ell(c,x+dx-2,y+dy-2,rx*.6,ry*.4,'#a7b0b7');});ell(c,x,y-31,4,1.6,'#ffffff');},
    // miếu đá nhỏ trên đỉnh núi (w=3): tường đá, mái ngói phủ tuyết, bát hương
    shrine(c,o,t){const x=o.x,y=o.y;shadow(c,x,y,60,11);
      rr(c,x-58,y-14,116,16,2,'#7d868e');rr(c,x-44,y-58,88,46,2,'#9aa2a8');c.fillStyle='#868e95';for(let k=0;k<4;k++)c.fillRect(x-44,y-50+k*10,88,1.4);
      rr(c,x-14,y-46,28,34,3,'#3a2a22');ell(c,x,y-28,6,8,'#ffcf6a');ell(c,x,y-28,3,4,'#fff3c0');
      poly(c,[x-62,y-56,x-50,y-80,x+50,y-80,x+62,y-56],'#6a4436');poly(c,[x-62,y-56,x-72,y-64,x-54,y-60],'#6a4436');poly(c,[x+62,y-56,x+72,y-64,x+54,y-60],'#6a4436');
      c.fillStyle='#f6fbff';c.beginPath();c.moveTo(x-60,y-60);c.lineTo(x-50,y-82);c.lineTo(x+50,y-82);c.lineTo(x+60,y-60);c.quadraticCurveTo(x,y-70,x-60,y-60);c.fill();
      for(const s of [-1,1]){rr(c,x+s*52-4,y-30,8,30,2,'#a8b0b6');ell(c,x+s*52,y-34,6,3,'#f6fbff');}
      for(let i=0;i<3;i++){const ph=(t*.4+i/3)%1;c.globalAlpha=(1-ph)*.5;ell(c,x+Math.sin(ph*6+i)*4,y-62-ph*40,2+ph*5,2+ph*4,'#e6eaee');}c.globalAlpha=1;},
    flagpole(c,o,t){const x=o.x,y=o.y;shadow(c,x,y,8,3);line(c,[x,y,x,y-78],'#6b4a2e',3);const f=Math.sin(t*4)*3;
      for(let i=0;i<4;i++){c.fillStyle=['#c0453a','#e8c46a','#3a7ab0','#e9eef4'][i];c.beginPath();c.moveTo(x,y-74+i*9);c.quadraticCurveTo(x+12,y-72+i*9+f,x+26,y-70+i*9+f*1.4);c.lineTo(x+24,y-64+i*9+f);c.lineTo(x,y-66+i*9);c.fill();}},
    hut(c,o){const x=o.x,y=o.y;shadow(c,x,y,40,8);rr(c,x-34,y-34,68,36,2,'#7a5a3e');c.fillStyle='#5f452f';for(let k=0;k<5;k++)c.fillRect(x-34,y-30+k*7,68,1.5);
      rr(c,x-8,y-24,16,26,2,'#3a2a1c');poly(c,[x-44,y-30,x,y-60,x+44,y-30],'#5a4232');c.fillStyle='#f6fbff';c.beginPath();c.moveTo(x-46,y-30);c.lineTo(x,y-64);c.lineTo(x+46,y-30);c.quadraticCurveTo(x,y-44,x-46,y-30);c.fill();
      rr(c,x+16,y-22,10,8,1,'#ffcf6a');},
    icecrys(c,o,t){const x=o.x,y=o.y,gl=.6+Math.sin(t*2+o.seed)*.2;shadow(c,x,y,14,5);c.save();c.shadowColor='#bfeaff';c.shadowBlur=10*gl;
      [[-8,-22,-2],[0,-34,0],[8,-18,2],[-3,-14,-6]].forEach(([dx,h,tl])=>{poly(c,[x+dx-5,y,x+dx+tl,y+h,x+dx+5,y],'#cdeefc');poly(c,[x+dx+tl,y+h,x+dx+5,y,x+dx,y],'#9ed4ee');});c.restore();}
  };
  /* ---------- Quái ---------- */
  const mon={
    // Sói tuyết: lông trắng xám, đuôi xù, mắt xanh băng, há mõm khi vồ
    'soi-tuyet'(c,m,M,s){const {col,g,open,t}=s,mv=m.moving?1:0,B=col('#c3ced8'),D=col('#7f8f9e'),L=col('#eef3f7');c.strokeStyle='#4a5866';c.lineWidth=1.2;
      const leg=(x,ph,cl)=>{const k=Math.sin(g*1.4+ph)*5*mv;line(c,[x,-16,x+k*.6,-8,x+k,0],cl,4);};
      leg(-14,0,D);leg(10,Math.PI,D);
      c.fillStyle=B;c.beginPath();c.moveTo(-18,-24);c.quadraticCurveTo(-34,-34+Math.sin(t*3)*3,-40,-22);c.quadraticCurveTo(-30,-26,-20,-18);c.fill();
      ell(c,-2,-21,19,9,B);c.beginPath();c.ellipse(-2,-21,19,9,0,0,PI2);c.stroke();ell(c,-2,-17,14,4,L);ell(c,-4,-26,12,3,D);ell(c,12,-25,9,9,B);leg(-8,Math.PI,B);leg(14,0,B);
      const jaw=open?.45:0;c.save();c.translate(16,-30);
      poly(c,[0,-8,6,-18,10,-6],B);poly(c,[2,-8,6,-15,8,-7],col('#c9a0a8'));
      ell(c,4,0,9,7,B);c.beginPath();c.ellipse(4,0,9,7,0,0,PI2);c.stroke();poly(c,[8,-3,22,0,20,4,8,5],B);ell(c,0,4,6,3,L);c.save();c.translate(10,4);c.rotate(jaw);poly(c,[0,0,12,1,10,4,0,4],D);c.restore();
      ell(c,21,0,2,2,'#2a2a30');ell(c,6,-3,2.2,1.6,'#6fd8ff');if(open){c.fillStyle='#fff';c.fillRect(12,3,1.5,2.5);c.fillRect(16,3,1.5,2.5);}
      c.restore();
      if(Math.sin(t*2+m.id)>.6){c.globalAlpha=.35;ell(c,40,-28,5,3,'#ffffff');c.globalAlpha=1;}},
    // Gấu ngựa: lông đen, vằn trăng khuyết trắng trên ngực, đứng dậy vồ khi đánh
    'gau-nui'(c,m,M,s){const {col,g,open,atk}=s,mv=m.moving?1:0,B=col('#2a2624'),D=col('#1a1716'),M2=col('#b89a78');
      const up=open||atk?1:0;
      if(up){c.save();c.rotate(-.5);}
      const leg=(x,ph,cl)=>{const k=Math.sin(g*1.1+ph)*4*mv;rr(c,x-5+k,-22,10,24,4,cl);};
      leg(-18,0,D);leg(12,Math.PI,D);ell(c,0,-30,28,17,B);ell(c,-22,-34,6,6,B);leg(-12,Math.PI,B);leg(18,0,B);
      c.save();c.translate(26,-38);ell(c,0,0,13,12,B);ell(c,-6,-11,4.5,4.5,B);ell(c,4,-12,4.5,4.5,B);ell(c,-6,-11,2,2,'#4a3a32');
      ell(c,10,3,7,5.5,M2);ell(c,15,1,2.4,2,'#111');ell(c,4,-3,1.6,1.6,'#e8c070');if(open){poly(c,[8,6,16,6,13,10],'#7a2020');}c.restore();
      c.strokeStyle=col('#f2efe6');c.lineWidth=3.4;c.beginPath();c.arc(18,-36,10,Math.PI*.3,Math.PI*.95);c.stroke();
      if(up){for(const s of [0,1]){c.save();c.translate(14+s*6,-50+s*4);c.rotate(-.8+s*.3);rr(c,-4,-18,9,20,4,B);for(let k=0;k<3;k++)line(c,[-2+k*3,-18,-3+k*3,-23],'#e8e2d0',1.4);c.restore();}c.restore();}},
    // Hồ Tinh chín đuôi: cáo trắng, chín đuôi xòe như quạt, đầu đuôi lửa xanh, hồ hỏa bay quanh
    'ho-tinh'(c,m,M,s){const {col,t,open,g}=s,mv=m.moving?1:0,B=col('#f4f6fa'),D=col('#aebdd0'),F='#7fd8ff';
      c.save();c.scale(1.9,1.9);c.strokeStyle='#6a7a96';c.lineWidth=1;
      for(let i=0;i<9;i++){const a=-2.6+i*.22+Math.sin(t*2+i)*.06,len=34+(i%3)*4,ex=-14+Math.cos(a)*len,ey=-24+Math.sin(a)*len;
        c.strokeStyle=i%2?B:D;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(-14,-22);c.quadraticCurveTo(-14+Math.cos(a+.4)*len*.6,-24+Math.sin(a+.4)*len*.6,ex,ey);c.stroke();
        c.save();c.shadowColor=F;c.shadowBlur=10;ell(c,ex,ey,4+Math.sin(t*8+i),6,F+'cc');ell(c,ex,ey-2,2,3,'#ffffff');c.restore();}
      const leg=(x,ph,cl)=>{const k=Math.sin(g*1.3+ph)*4*mv;line(c,[x,-14,x+k*.5,-7,x+k,0],cl,3.4);};
      leg(-10,0,D);leg(8,Math.PI,D);ell(c,0,-18,16,8,B);c.beginPath();c.ellipse(0,-18,16,8,0,0,PI2);c.stroke();ell(c,-2,-22,11,3,'#dce4f0');leg(-6,Math.PI,B);leg(12,0,B);
      c.save();c.translate(14,-28);if(open)c.rotate(-.15);
      ell(c,0,0,9,8,B);c.beginPath();c.ellipse(0,0,9,8,0,0,PI2);c.stroke();poly(c,[-5,-6,-4,-20,2,-8],B);poly(c,[2,-7,6,-20,9,-6],B);poly(c,[-3,-8,-3,-16,0,-9],'#f2b8c8');
      poly(c,[4,-2,22,2,6,6],B);ell(c,22,2,2,1.8,'#2a2a30');
      c.save();c.shadowColor=F;c.shadowBlur=8;poly(c,[2,-3,8,-4,6,-1],'#3ab8ff');c.restore();
      line(c,[-4,4,-7,10],'#d84a6a',1.4);ell(c,0,-12,1.6,1.6,'#d84a6a');c.restore();
      c.restore();
      // hồ hỏa (lửa cáo) bay quanh
      for(let i=0;i<3;i++){const a=t*1.4+i*2.1,x=Math.cos(a)*58,y=-70+Math.sin(a*1.3)*18;c.save();c.shadowColor=F;c.shadowBlur=14;ell(c,x,y,6,8,'#9fe4ffcc');ell(c,x,y+2,3,4,'#ffffff');c.restore();}
      if(open)for(let i=0;i<8;i++){const a=i/8*PI2+t*3;ell(c,40+Math.cos(a)*18,-50+Math.sin(a)*10,3,3,'#bfefff');}}
  };
  // Tuyết rơi, gió lạnh: hạt to nhỏ rơi chéo, hơi lạnh xanh ở viền màn hình
  const flakes=[];for(let i=0;i<90;i++)flakes.push({x:Math.random(),y:Math.random(),v:.04+Math.random()*.07,s:1+Math.random()*2.6,p:Math.random()*6});
  function sky(c,s){const {w,h,t}=s;
    const g=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.35,w/2,h/2,Math.max(w,h)*.75);g.addColorStop(0,'#dff2ff00');g.addColorStop(1,'#cfe8ff3a');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.fillStyle='#ffffff';for(const f of flakes){const y=((f.y+t*f.v)%1)*h,x=((f.x+Math.sin(t*.6+f.p)*.02+t*f.v*.25)%1)*w;c.globalAlpha=.55+.35*Math.sin(f.p+t);c.beginPath();c.arc(x,y,f.s,0,PI2);c.fill();}c.globalAlpha=1;}
  return {theme:{snow:{tile,over,still:true}},obj,mon,sky:{snow:sky},ring:{'ho-tinh':'#8fd8ff','gau-nui':'#e8eef4','soi-tuyet':'#e8eef4'}};
}
