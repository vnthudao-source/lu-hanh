/* ================= v10.36: QUÁI VÀ BOSS CÁC VÙNG TỪ THIÊN ĐÌNH TRỞ LÊN (vẽ tay) =================
   11 vùng × (2 quái + 1 boss), vẽ đè lên hình sinh tự động của gói bản đồ. Vùng càng sau nét càng dày: tham số d = 0 (Thiên Đình) … 10 (Hỗn Nguyên Điện)
   thêm gai, sọ, xích, chạm giáp, vết nứt phát sáng, vật bay quanh. Boss to dần (175 → 300 đơn vị màn); trùm cuối Hỗn Nguyên Ma Tổ ba mặt sáu tay.
   Mọi hình quay mặt sang phải, chân chạm y = 0. LH_BOSS.top[mã] = chiều cao hình, để tên và thanh máu nằm trên đỉnh.
   Ảnh do người dùng đặt trong file Hình ảnh (quai:<mã>) vẫn được ưu tiên. */
(()=>{
  const B=LH_BOSS,{E,P,L,S,F,lg,rg,glow,noGlow,al,shade,fc,hr,aura,flames,bolt,swirl,feather,curve,warlord,dragon,serpent,fishKing}=B.kit,PI=Math.PI,PI2=PI*2,TOP=B.top;
  // đăng ký: px = chiều cao hình trên màn, dh = chiều cao thiết kế, top = đỉnh hình nếu khác px (rồng có cánh vươn cao)
  // quái thường (cao dưới 150) tắt phát sáng (shadowBlur) cho nhẹ máy: một bãi có cả chục con cùng lúc
  const NOBLUR={configurable:true,get(){return 0;},set(){}};
  const reg=(id,fn,P0,px,dh,top)=>{const s=px/dh,lite=px<150;B[id]=(c,m,M,st)=>{c.save();c.scale(s,s);if(lite)Object.defineProperty(c,'shadowBlur',NOBLUR);try{fn(c,m,M,st,P0);}finally{if(lite)delete c.shadowBlur;c.restore();}};TOP[id]=Math.round(top||px);};
  /* ---------- nét phụ ---------- */
  const ring=(c,x,y,rx,ry,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.ellipse(x,y,rx,ry,0,0,PI2);c.stroke();};
  function runes(c,t,rx,col,n){c.save();c.globalAlpha=.5;ring(c,0,-1,rx,rx*.24,col,1.6);ring(c,0,-1,rx*.8,rx*.19,col,1);
    for(let i=0;i<n;i++){const a=i/n*PI2+t*.35,x=Math.cos(a)*rx*.9,y=-1+Math.sin(a)*rx*.215;c.globalAlpha=.3+.35*(1+Math.sin(t*3+i))/2;L(c,[x-3,y-1.8,x,y+1.8,x+3,y-1.8],col,1.2);}c.restore();}
  function embers(c,t,w,h,col,n,y0=0,seed=40){c.save();c.fillStyle=col;for(let i=0;i<n;i++){const ph=(t*.45+hr(i+seed))%1,x=(hr(i+seed+1)-.5)*w+Math.sin(t*2+i)*4,y=y0-ph*h;c.globalAlpha=(1-ph)*.85;c.beginPath();c.arc(x,y,1.1+hr(i+seed+2)*1.5,0,PI2);c.fill();}c.restore();}
  function chain(c,x0,y0,x1,y1,sag,col,n){const a=Math.atan2(y1-y0,x1-x0);c.strokeStyle=col;c.lineWidth=1.3;for(let i=0;i<=n;i++){const u=i/n,x=x0+(x1-x0)*u,y=y0+(y1-y0)*u+Math.sin(u*PI)*sag;c.beginPath();c.ellipse(x,y,i%2?2.6:1.3,i%2?1.3:2.6,a,0,PI2);c.stroke();}}
  const bez=(a,b,cc,d,n)=>{const r=[];for(let i=0;i<=n;i++){const u=i/n,v=1-u;r.push([v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*cc[0]+u*u*u*d[0],v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*cc[1]+u*u*u*d[1]]);}return r;};
  // ống thân (cổ rắn, đuôi): vòng tròn nối nhau, bụng sáng, gai lưng
  function tube(c,st,pts,r0,r1,A,Bl,X,spines){const n=pts.length-1;
    for(let i=0;i<=n;i++){const [x,y]=pts[i],r=r0+(r1-r0)*i/n;E(c,x,y,r*1.04,r,fc(st,i%2?A:shade(A,-.07)));}
    if(st.fl)return;
    for(let i=1;i<=n;i++){const [x,y]=pts[i],[px,py]=pts[i-1],r=r0+(r1-r0)*i/n,a=Math.atan2(y-py,x-px),nx=-Math.sin(a),ny=Math.cos(a);E(c,x+nx*r*.45,y+ny*r*.45,r*.62,r*.36,Bl,a);if(i%2)L(c,[x+nx*r*.2-Math.cos(a)*r*.4,y+ny*r*.2-Math.sin(a)*r*.4,x+nx*r*.2+Math.cos(a)*r*.4,y+ny*r*.2+Math.sin(a)*r*.4],shade(Bl,-.3),.8);
      c.strokeStyle=al(shade(A,.4),.55);c.lineWidth=.8;c.beginPath();c.arc(x-nx*r*.15,y-ny*r*.15,r*.5,a+PI*1.1,a+PI*1.9);c.stroke();
      if(spines&&i%2===0&&i<n)P(c,[x-nx*r*.8+Math.cos(a)*3,y-ny*r*.8+Math.sin(a)*3,x-nx*(r+spines*(1-i/n)+3),y-ny*(r+spines*(1-i/n)+3),x-nx*r*.8-Math.cos(a)*4,y-ny*r*.8-Math.sin(a)*4],X);}}
  /* ---------- cánh ---------- */
  // cánh dơi: khớp vai ở (x,y), xòe về phía sau lưng (bên trái)
  function batWing(c,st,x,y,sz,rot,mem,bone){c.save();c.translate(x,y);c.rotate(rot);c.scale(sz,sz);
    const El=[-26,-44],Wr=[-50,-64],T=[[-104,-50],[-96,-12],[-76,14],[-46,26]];
    c.fillStyle=fc(st,lg(c,-50,-64,-60,26,[shade(mem,.15),mem,shade(mem,-.45)]));c.beginPath();c.moveTo(0,6);c.lineTo(El[0],El[1]);c.lineTo(Wr[0],Wr[1]);c.lineTo(T[0][0],T[0][1]);
    for(let i=1;i<4;i++){const a=T[i-1],b=T[i],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;c.quadraticCurveTo(mx+(Wr[0]-mx)*.34,my+(Wr[1]-my)*.34,b[0],b[1]);}
    c.quadraticCurveTo(-22,12,-4,16);c.closePath();c.fill();
    if(!st.fl)for(const p of T)S(c,[Wr[0],Wr[1],(Wr[0]+p[0])/2+5,(Wr[1]+p[1])/2+4,p[0]*.9+Wr[0]*.1+6,p[1]*.9+Wr[1]*.1+5],al(shade(mem,.4),.3),.8);
    L(c,[0,4,El[0],El[1],Wr[0],Wr[1]],fc(st,bone),4.2);for(const p of T)L(c,[Wr[0],Wr[1],p[0],p[1]],fc(st,bone),1.9);
    P(c,[Wr[0]-2,Wr[1],Wr[0]+5,Wr[1]-13,Wr[0]+3,Wr[1]-2],fc(st,'#e8e0d0'));for(const p of T)P(c,[p[0]-1,p[1]-1,p[0]-5,p[1]+3,p[0]+1,p[1]+1],fc(st,'#e8e0d0'));c.restore();}
  // cánh lông vũ
  function fWing(c,st,x,y,sz,rot,col,lt){c.save();c.translate(x,y);c.rotate(rot);c.scale(sz,sz);
    for(let k=0;k<10;k++)feather(c,-2-k*3,-k*1.2,-PI*.62-k*.075,46-k*1.6,6,fc(st,k%2?shade(col,-.1):col),al(lt,.6));
    for(let k=0;k<7;k++)feather(c,-2-k*3,-2,-PI*.6-k*.07,26,6,fc(st,shade(col,.15)),null);
    for(let k=0;k<5;k++){c.fillStyle=fc(st,lt);c.beginPath();c.arc(-6-k*5,-6-k*1.5,4,0,PI);c.fill();}c.restore();}
  // cánh kiếm: quạt kiếm sau lưng
  function bladeWing(c,st,x,y,n,len,col,gl){const t=st.t;c.save();c.translate(x,y);for(let k=0;k<n;k++){const a=-PI*.5-.25-k*(1.5/n)+Math.sin(t*1.6+k*.5)*.04;c.save();c.rotate(a+PI/2);c.translate(0,-10);
    if(gl)glow(c,gl,6);P(c,[-2.6,0,2.6,0,2,-len+k*2,0,-len-6+k*2,-2,-len+k*2],fc(st,col));noGlow(c);L(c,[0,-2,0,-len+k*2],'#ffffff66',.7);L(c,[-5,1,5,1],'#3a3a44',2.2);c.restore();}c.restore();}
  /* ---------- vầng hào quang ---------- */
  function halo(c,st,x,y,r,P0){const t=st.t,col=P0.halo;c.save();c.translate(x,y);
    if(P0.haloType==='wheel'){c.rotate(t*.25);c.save();glow(c,col,16);ring(c,0,0,r,r,col,3.2);c.restore();ring(c,0,0,r*.78,r*.78,al(col,.7),1.6);
      for(let i=0;i<12;i++){const a=i/12*PI2;L(c,[Math.cos(a)*r*.3,Math.sin(a)*r*.3,Math.cos(a)*r*.78,Math.sin(a)*r*.78],al(col,.6),1.4);
        const fx=Math.cos(a)*r,fy=Math.sin(a)*r,ph=Math.sin(t*6+i*1.7);c.fillStyle=al(i%2?col:'#ffffff',.9);c.beginPath();c.moveTo(fx+Math.cos(a-.12)*2,fy+Math.sin(a-.12)*2);c.quadraticCurveTo(fx+Math.cos(a)*(12+ph*4),fy+Math.sin(a)*(12+ph*4),fx+Math.cos(a+.12)*2,fy+Math.sin(a+.12)*2);c.fill();
        if(i%3===0){const sx=Math.cos(a+.26)*r*.89,sy=Math.sin(a+.26)*r*.89;E(c,sx,sy,4,4.4,'#e8e0cc');E(c,sx-1.4,sy-.6,1.1,1.1,'#1a0a0a');E(c,sx+1.4,sy-.6,1.1,1.1,'#1a0a0a');}}
      c.save();glow(c,col,20);E(c,0,0,r*.26,r*.26,al(col,.35));c.restore();}
    else{// vầng vỡ: vòng vàng nứt, mảnh rơi
      c.save();glow(c,col,10);c.strokeStyle=col;c.lineWidth=3;for(let i=0;i<5;i++){const a0=i/5*PI2+.15+t*.1;c.beginPath();c.ellipse(0,0,r,r*.32,0,a0,a0+PI2/5-.3);c.stroke();}c.restore();
      c.fillStyle=col;for(let i=0;i<4;i++){const ph=(t*.4+hr(i+90))%1;c.globalAlpha=1-ph;P(c,[-r*.6+i*r*.4,4+ph*30,-r*.6+i*r*.4+3,7+ph*30,-r*.6+i*r*.4+1,11+ph*30],col);}c.globalAlpha=1;
      L(c,[r*.2,-r*.25,r*.2+3,r*.05],'#1a0a14',1.4);L(c,[-r*.5,-r*.2,-r*.45,r*.1],'#1a0a14',1.4);}
    c.restore();}
  /* ---------- vật bay quanh (pass 0 = nửa sau, 1 = nửa trước) ---------- */
  function orbit(c,st,P0,pass,cx,cy,rx){const t=st.t,n=P0.orbitN||6,kind=P0.orbit;
    for(let i=0;i<n;i++){const a=t*(kind==='ghosts'?.9:1.3)+i/n*PI2,z=Math.sin(a);if((pass?z>=0:z<0))continue;const x=cx+Math.cos(a)*rx,y=cy+z*rx*.22+Math.sin(t*2+i)*4,s=.85+z*.15;
      c.save();c.translate(x,y);c.scale(s,s);c.globalAlpha=.75+z*.25;
      if(kind==='swords'){c.rotate(Math.sin(t*2+i)*.2+PI*.1);if(P0.wglow)glow(c,P0.wglow,8);P(c,[-2.2,0,2.2,0,1.6,-30,0,-35,-1.6,-30],fc(st,P0.wcol||'#d0e0f0'));noGlow(c);L(c,[-6,1,6,1],P0.c[3],2);L(c,[0,2,0,9],'#2a2030',2.2);}
      else if(kind==='ghosts'){const col=P0.ghost||'#a0ffc8';F(c,[-6,-8,6,-8,7,4,3,14+Math.sin(t*5+i)*3,0,8,-3,14,-7,4],al(col,.7));E(c,-2,-4,1.6,2.2,'#0a1a10');E(c,3,-4,1.6,2.2,'#0a1a10');E(c,.5,2,1.8,2.6,'#0a1a10');}
      else if(kind==='skulls'){flames(c,t+i,0,-4,.8,[P0.ghost||'#ff4020','#ffd060'],3);E(c,0,0,6,6.4,'#e8e0cc');E(c,1,4,4,2.6,'#d8d0b8');E(c,-2,-.5,1.8,2,'#1a0a0a');E(c,2.6,-.5,1.8,2,'#1a0a0a');}
      else if(kind==='shards'){const col=P0.ghost||'#c0b0ff';c.rotate(t+i);if(!st.fl)glow(c,col,8);P(c,[0,-9,4,0,0,9,-4,0],al(col,.9));noGlow(c);L(c,[0,-8,0,8],'#ffffffaa',.8);}
      c.restore();}}
  /* ================= BINH KHÍ LỚN (tay cầm ở gốc tọa độ, lưỡi hướng lên) ================= */
  function weapon2(c,st,P0){const W=P0.weapon,T=P0.c[3],wc=P0.wcol||'#c8ccd4',pole=P0.pole||'#2a1a14',gl=P0.wglow,t=st.t,d=P0.d||0;
    if(W==='trident'){L(c,[0,46,0,-92],pole,4.6);for(const y of [-40,-8,26])L(c,[-3.4,y,3.4,y],T,2.4);
      c.save();if(gl)glow(c,gl,14);P(c,[-13,-92,13,-92,10,-85,-10,-85],fc(st,wc));for(const x of [-12,0,12])P(c,[x-3.2,-90,x,-124-(x?0:12),x+3.2,-90],fc(st,wc));P(c,[-13,-92,-19,-106,-11,-98],fc(st,wc));P(c,[13,-92,19,-106,11,-98],fc(st,wc));c.restore();
      L(c,[0,-92,0,-132],'#ffffff77',.8);E(c,0,-88,2.6,2.6,'#ff2060');if(gl)flames(c,t,0,-126,1,[gl,'#ffffff'],4);P(c,[-2.6,46,2.6,46,0,56],'#9aa0a6');}
    else if(W==='saber'){L(c,[0,46,0,-70],pole,4.6);for(const y of [-30,6,30])L(c,[-3.4,y,3.4,y],T,2.2);
      c.save();if(gl)glow(c,gl,12);F(c,[-2,-62,10,-70,26,-92,26,-116,14,-134,10,-112,-2,-84],fc(st,wc));c.restore();
      S(c,[10,-70,24,-94,22,-116],'#ffffff99',1.1);for(let i=0;i<3;i++)P(c,[-2,-70-i*8,-9,-76-i*8,-2,-78-i*8],fc(st,wc));
      E(c,-1,-64,3.6,3.6,T);E(c,-1,-64,1.6,1.6,'#c8202a');for(let i=0;i<4;i++)S(c,[-2,-62,-6-i,-54+Math.sin(t*4+i)*2,-7-i*.6,-44],'#a01020',1.5);
      if(d>=3){c.save();c.globalAlpha=.5+Math.sin(t*4)*.2;S(c,[6,-80,18,-100,16,-118],P0.wglow||'#ff4040',2);c.restore();}}
    else if(W==='bigsword'){L(c,[0,16,0,-4],'#2a1a20',4.4);E(c,0,18,3.4,3.4,T);
      P(c,[-16,-6,-10,-11,10,-11,16,-6,10,-3,-10,-3],fc(st,T));P(c,[-16,-6,-22,-14,-12,-9],fc(st,T));P(c,[16,-6,22,-14,12,-9],fc(st,T));E(c,0,-7,3,3,P0.gem||'#80e0ff');
      c.save();if(gl)glow(c,gl,14);P(c,[-6,-11,6,-11,5,-112,0,-126,-5,-112],fc(st,wc));c.restore();
      if(d>=5&&!st.fl)for(let i=0;i<8;i++){const y=-20-i*11;P(c,[5,y,9,y-4,5,y-7],fc(st,wc));}
      L(c,[0,-14,0,-112],shade(wc,-.35),1.2);if(!st.fl){c.save();c.globalAlpha=.55+Math.sin(t*3)*.3;for(let i=0;i<6;i++)L(c,[-2,-22-i*14,2,-26-i*14],gl||'#80e0ff',1.4);c.restore();}}
    else if(W==='spade'){// nguyệt nha sản: đầu xẻng, đuôi lưỡi trăng khuyết, vòng đồng
      L(c,[0,52,0,-90],pole,4.6);for(const y of [-50,-10,30])L(c,[-3.4,y,3.4,y],T,2.4);
      c.save();if(gl)glow(c,gl,10);P(c,[-11,-90,11,-90,14,-112,-14,-112],fc(st,wc));c.restore();L(c,[-14,-112,14,-112],'#ffffffaa',1);
      for(const d0 of [-1,1]){c.strokeStyle=fc(st,T);c.lineWidth=1.3;c.beginPath();c.arc(d0*8,-86,3.4,0,PI2);c.stroke();}
      c.fillStyle=fc(st,wc);c.beginPath();c.arc(0,58,14,PI*.08,PI*.92);c.arc(0,52,10,PI*.88,PI*.12,true);c.fill();}
    else if(W==='mace'){L(c,[0,34,0,-62],pole,5);for(const y of [-40,0,24])L(c,[-3.6,y,3.6,y],T,2.4);
      c.save();if(gl)glow(c,gl,10);E(c,0,-78,15,17,fc(st,wc));c.restore();E(c,-4,-82,6,6,fc(st,shade(wc,.35)));
      for(let i=0;i<12;i++){const a=i/12*PI2;P(c,[Math.cos(a)*11,-78+Math.sin(a)*12,Math.cos(a+.13)*24,-78+Math.sin(a+.13)*26,Math.cos(a+.26)*11,-78+Math.sin(a+.26)*12],fc(st,'#d0d4d8'));}
      for(let i=0;i<3;i++)L(c,[-12,-72+i*-4,12,-72+i*-4],al(T,.7),1.4);}
    else if(W==='skullstaff'){S(c,[0,50,2,20,-2,-10,2,-40,0,-84],pole,4.4);for(let i=0;i<5;i++)L(c,[-3,30-i*24,3,26-i*24],T,1.6);
      for(const d0 of [-1,1])S(c,[0,-92,d0*12,-104,d0*10,-118],fc(st,'#2a2020'),2.8);
      E(c,0,-96,10,11,fc(st,'#e8e0cc'));E(c,1,-88,7,4,fc(st,'#d8d0b8'));c.save();glow(c,gl||'#80ffb0',12);E(c,-3,-97,2.6,3,gl||'#80ffb0');E(c,4,-97,2.6,3,gl||'#80ffb0');c.restore();
      flames(c,t,0,-106,1.3,[gl||'#80ffb0','#e0ffe8'],6);for(const d0 of [-1,1]){L(c,[d0*8,-84,d0*10,-66],T,1);E(c,d0*10,-64,2.2,3,'#d0a030');P(c,[d0*10-3,-64,d0*10+3,-64,d0*10+2,-52,d0*10-2,-52],'#e8d8a8');}}
  }
  /* ================= ĐẦU QUỶ ================= */
  function dHead(c,st,P0,hx,hy){const t=st.t,[A,D,Lt,T]=P0.c,H=P0.head,eye=P0.eye||'#ff3030',skin=P0.skin||'#6a3a3a',d=P0.d||0,open=st.open;
    const glowEye=(x,y,rx,ry)=>{c.save();glow(c,eye,10);E(c,x,y,rx,ry,eye);c.restore();E(c,x+.3,y,rx*.3,ry*.7,'#ffffff');};
    // tóc dữ phía sau
    if(P0.hair){const hc=P0.hair;for(let k=0;k<9;k++){const a=PI*.62+k*.17,w=Math.sin(t*3+k)*2;F(c,[hx-2,hy-4,hx+Math.cos(a)*18-4+w,hy+Math.sin(a)*16-8,hx+Math.cos(a+.1)*28-6+w,hy+Math.sin(a+.1)*22-8,hx+Math.cos(a+.18)*14-2,hy+Math.sin(a+.18)*12-2],fc(st,k%2?hc:shade(hc,-.25)));}}
    if(P0.horns==='ram'||P0.horns==='long'||P0.horns==='bull')horns(c,st,P0,hx,hy,0);
    if(H!=='none')E(c,hx-2,hy+13,8.5,8,fc(st,shade(skin,-.2)));
    if(H==='none'){}
    else if(H==='skull'){E(c,hx,hy,11.5,12.5,fc(st,'#e0d8c2'));E(c,hx+4,hy+8,8,5,fc(st,'#d0c8b0'));
      c.save();c.translate(hx+3,hy+9);c.rotate(open?.4:.04);P(c,[-6,0,9,0,8,6,-5,6],fc(st,'#c8c0a8'));for(let i=-4;i<8;i+=2.4)L(c,[i,0,i,2.4],'#3a3020',.8);c.restore();
      E(c,hx+5,hy-1,3.4,3.8,'#140808');E(c,hx-2.5,hy-1,3,3.6,'#140808');glowEye(hx+5,hy-1,1.6,1.8);glowEye(hx-2.5,hy-1,1.4,1.6);P(c,[hx+8,hy+3,hx+10,hy+6,hx+7,hy+6],'#140808');
      if(!st.fl){L(c,[hx-6,hy-10,hx-2,hy-5,hx-4,hy-1],'#5a5040',.9);L(c,[hx+6,hy-11,hx+8,hy-7],'#5a5040',.8);}}
    else if(H==='visor'){c.fillStyle=fc(st,lg(c,hx-12,hy-16,hx+12,hy+14,[shade(A,.35),A,shade(A,-.45)]));c.beginPath();c.moveTo(hx-12,hy+12);c.lineTo(hx-13,hy-6);c.quadraticCurveTo(hx-10,hy-18,hx,hy-18);c.quadraticCurveTo(hx+12,hy-18,hx+14,hy-4);c.lineTo(hx+13,hy+12);c.quadraticCurveTo(hx,hy+16,hx-12,hy+12);c.fill();
      L(c,[hx+1,hy-17,hx+1,hy+14],shade(A,-.4),1.4);c.save();glow(c,eye,12);P(c,[hx-9,hy-3,hx+13,hy-4,hx+13,hy-1,hx-9,hy],eye);P(c,[hx+3,hy-1,hx+5,hy-1,hx+5,hy+8,hx+3,hy+8],eye);c.restore();
      for(let i=0;i<4;i++)E(c,hx+8,hy+3+i*2.4,.9,.9,'#101014');for(const [x,y] of [[-10,-8],[-10,8],[11,8],[11,-10]])E(c,hx+x,hy+y,1.2,1.2,fc(st,T));
      P(c,[hx-4,hy-17,hx+4,hy-17,hx+2,hy-30-d,hx-2,hy-30-d],fc(st,shade(A,-.2)));L(c,[hx-13,hy+12,hx+13,hy+12],T,2);}
    else if(H==='hood'){c.fillStyle=fc(st,lg(c,hx-16,hy-18,hx+16,hy+16,[shade(A,.2),A,shade(A,-.5)]));c.beginPath();c.moveTo(hx-14,hy+14);c.quadraticCurveTo(hx-18,hy-8,hx-4,hy-20);c.quadraticCurveTo(hx+14,hy-24,hx+18,hy-4);c.lineTo(hx+14,hy+12);c.closePath();c.fill();
      E(c,hx+4,hy+1,9,11,'#05050a');glowEye(hx+6,hy-1,2.4,1.1);glowEye(hx,hy-1,2.2,1);S(c,[hx-14,hy+14,hx-16,hy-4,hx-4,hy-18],al(shade(A,.4),.6),1);}
    else if(H==='mian'){// mặt tái xanh, râu dài, mũ miện chuỗi ngọc
      c.fillStyle=fc(st,rg(c,hx+2,hy-2,12,[shade(skin,.15),skin,shade(skin,-.3)]));c.beginPath();c.ellipse(hx,hy,9.5,11,0,0,PI2);c.fill();
      glowEye(hx+5,hy-1,1.9,1.3);glowEye(hx,hy-1,1.7,1.2);L(c,[hx+2,hy-5,hx+8,hy-3.4],'#0a0a0a',1.6);L(c,[hx-2,hy-4.6,hx+1,hy-5.4],'#0a0a0a',1.3);
      const bc=P0.beard||'#0a0a10';F(c,[hx-3,hy+3,hx+9,hy+4,hx+9,hy+14,hx+4,hy+30+Math.sin(t*2)*1.5,hx-2,hy+14],fc(st,bc));S(c,[hx+3,hy+4,hx+12,hy+8,hx+16,hy+14],bc,1.4);
      B.kit.helm(c,st,{c:P0.c,helm:'mian'},hx,hy-4);}
    else{// 'demon' và 'ogre': mặt da, gờ mày, nanh
      const og=H==='ogre';c.fillStyle=fc(st,rg(c,hx+3,hy-2,13,[shade(skin,.18),skin,shade(skin,-.32)]));c.beginPath();c.ellipse(hx,hy,og?11:9.5,og?12:11,0,0,PI2);c.fill();
      if(og){E(c,hx+10,hy+2,4,3.4,fc(st,shade(skin,-.08)));}
      P(c,[hx-8,hy-8,hx+3,hy-5,hx+11,hy-7,hx+11,hy-4,hx+2,hy-2,hx-8,hy-4],fc(st,shade(skin,-.35)));
      glowEye(hx+6,hy-2,2,1.4);glowEye(hx,hy-2,1.8,1.3);
      if(!og){P(c,[hx-9,hy-2,hx-17,hy-10,hx-11,hy+1],fc(st,shade(skin,-.15)));}
      c.save();c.translate(hx+2,hy+6);c.rotate(open?.3:0);P(c,[-4,0,11,-1,10,open?7:3,-3,open?6:3],'#2a0808');P(c,[2,0,3.4,4,4.6,0],'#ffffff');P(c,[7,0,8.2,3.6,9.4,0],'#ffffff');c.restore();
      if(og){P(c,[hx+3,hy+8,hx+5,hy-2,hx+7,hy+8],fc(st,'#f0e8d0'));P(c,[hx+9,hy+7,hx+12,hy-1,hx+12,hy+7],fc(st,'#f0e8d0'));}
      if(P0.beard){F(c,[hx-2,hy+5,hx+9,hy+7,hx+8,hy+15,hx+3,hy+24+Math.sin(t*2),hx-1,hy+14],fc(st,P0.beard));}}
    if(P0.eyes===3){c.save();glow(c,eye,12);E(c,hx+3,hy-11,1.2,2.8,eye);c.restore();L(c,[hx+3,hy-14,hx+3,hy-8],'#1a0a0a',.5);}
    if(P0.horns==='crown'){c.save();glow(c,T,8);P(c,[hx-11,hy-9,hx-12,hy-22,hx-7,hy-14,hx-3,hy-26,hx+1,hy-14,hx+6,hy-25,hx+9,hy-14,hx+13,hy-21,hx+12,hy-9],fc(st,T));c.restore();E(c,hx+1,hy-15,2,2,eye);}
    if(P0.horns==='shards'){c.save();glow(c,P0.ghost||'#c0b0ff',10);for(const [x,h,a] of [[-10,16,-.5],[-4,26,-.2],[3,20,.1],[9,13,.4]]){c.save();c.translate(hx+x,hy-9);c.rotate(a);P(c,[-3,0,0,-h,3,0],fc(st,P0.ghost||'#c0b0ff'));c.restore();}c.restore();}
    if(P0.flameCrown)flames(c,t,hx,hy-16,1.6,[P0.flameCrown,'#ffffff'],6);
  }
  function horns(c,st,P0,hx,hy){const col=fc(st,P0.hornCol||'#1a1214'),hl=al(shade(P0.hornCol||'#1a1214',.5),.6),d=P0.d||0,k=1+d*.04;
    for(const s of [-1,1]){const ox=hx+(s<0?-6:4),oy=hy-8,back=s<0;c.save();if(back)c.globalAlpha=.9;
      if(P0.horns==='ram'){c.strokeStyle=col;c.lineCap='round';for(let i=0;i<6;i++){c.lineWidth=(7-i)*k;c.beginPath();c.arc(ox-5,oy,9-i*.4,-PI*.2+i*.5,-PI*.2+(i+1)*.5);c.stroke();}}
      else if(P0.horns==='bull'){c.fillStyle=col;c.beginPath();c.moveTo(ox-2,oy+2);c.quadraticCurveTo(ox+s*16+8,oy-2,ox+s*14+12,oy-22*k);c.quadraticCurveTo(ox+s*8+6,oy-6,ox+3,oy-3);c.fill();}
      else{c.fillStyle=col;c.beginPath();c.moveTo(ox-3,oy+2);c.quadraticCurveTo(ox-14-(back?6:0),oy-6,ox-22*k-(back?6:0),oy-30*k);c.quadraticCurveTo(ox-10,oy-12,ox+4,oy-2);c.fill();S(c,[ox-2,oy-2,ox-12-(back?6:0),oy-9,ox-19*k-(back?6:0),oy-26*k],hl,1);
        if(d>=4)for(let i=1;i<4;i++)L(c,[ox-4-i*4-(back?2:0),oy-2-i*5,ox-6-i*4-(back?2:0),oy-1-i*5],hl,.8);}
      c.restore();}}
  /* ================= QUỶ VƯƠNG / TƯỚNG LỚN (người khổng lồ) — cao thiết kế 140 ================= */
  function demon(c,m,M,st,P0){
    const {t,open,atk}=st,g=m.walk||0,mv=m.moving?1:0,[A,D,Lt,T]=P0.c,W=P0.bulk||1,d=P0.d||0,skin=P0.skin||'#6a3a3a',br=Math.sin(t*1.6)*.9,sp=P0.spike||'#d8d0c0',sw=Math.sin(g)*mv,hx=4,hy=-108;
    if(P0.runes)runes(c,t,64*W,P0.runes,8+d);
    if(P0.sand){c.save();for(let i=0;i<3;i++)swirl(c,t+i*.7,(-30+i*30)*W,-20-i*30,30,al(P0.sand,.6));c.restore();embers(c,t,140,150,P0.sand,12,0,70);}
    if(P0.aura)aura(c,t,P0.aura,84*W,160,6+d);
    c.save();c.translate(0,br);
    if(P0.orbit)orbit(c,st,P0,0,0,-70,58*W);
    if(P0.halo)halo(c,st,hx-8,hy-6,P0.haloR||30,P0);
    // cờ trận cắm sau lưng
    if(P0.banners)for(let i=0;i<P0.banners;i++){const bx=-14-i*7,top=-178+i*8,wv=Math.sin(t*3+i);L(c,[bx+8,-80,bx,top],'#2a1a10',2.4);P(c,[bx-2,top-4,bx+2,top-4,bx,top-10],'#c0a060');
      c.fillStyle=fc(st,i%2?P0.banner||'#7a1010':shade(P0.banner||'#7a1010',-.25));c.beginPath();c.moveTo(bx,top+2);c.quadraticCurveTo(bx-12,top+4+wv*3,bx-24,top+2+wv*5);c.lineTo(bx-26+wv*2,top+36+wv*4);c.lineTo(bx-18,top+30);c.lineTo(bx-12,top+38+wv*2);c.quadraticCurveTo(bx-6,top+20,bx-1,top+34);c.closePath();c.fill();
      if(!st.fl){E(c,bx-12,top+16+wv*3,5,5,al(T,.9));L(c,[bx-15,top+16+wv*3,bx-9,top+16+wv*3],'#1a0a0a',1.2);L(c,[bx-12,top+13+wv*3,bx-12,top+19+wv*3],'#1a0a0a',1.2);}}
    // cánh
    if(P0.wings==='bat'){const f=Math.sin(t*2.2)*.12,mc=P0.wingCol||D;batWing(c,st,-8*W,-92,1.2+d*.02,-.42-f,shade(mc,-.3),P0.bone||'#140a12');batWing(c,st,-12*W,-88,1.3+d*.02,-.06+f,mc,P0.bone||'#24141e');}
    if(P0.wings==='blades')bladeWing(c,st,-10*W,-92,7+(d>>2),70,P0.wcol||'#c8d8e8',P0.wglow);
    // áo choàng rách
    if(P0.cape){const wv=Math.sin(t*2)*4+sw*3,cp=P0.cape;c.fillStyle=fc(st,lg(c,0,-92,-36,0,[cp,shade(cp,-.55)]));c.beginPath();c.moveTo(-15*W,-92);c.quadraticCurveTo(-36*W-wv,-52,-48*W-wv,-2);
      const n=8;for(let i=1;i<=n;i++){const u=i/n;c.lineTo(-48*W-wv+u*(40*W+wv*.6),-2-(i%2?8+hr(i)*12:0));}c.quadraticCurveTo(-6,-44,8*W,-90);c.closePath();c.fill();S(c,[-15*W,-92,-36*W-wv,-52,-48*W-wv,-2],shade(cp,.3),1.2);
      if(d>=6&&!st.fl)for(let i=0;i<3;i++)L(c,[-24*W-i*6-wv*.5,-60+i*14,-22*W-i*6-wv*.5,-52+i*14],shade(cp,-.6),1);}
    // chân
    const leg=(x,ph,front)=>{const k=Math.sin(g+ph)*mv,col=front?A:shade(A,-.3),dk=front?D:shade(D,-.3),kx=x+k*9;
      P(c,[x-9*W,-50,x+9*W,-50,x+7*W+k*3,-26,x-7*W+k*3,-26],fc(st,dk));
      P(c,[x-7*W+k*3,-24,x+8*W+k*3,-24,x+7*W+k*4.5,-8,x-6*W+k*4.5,-8],fc(st,col));if(!st.fl)L(c,[x-2*W+k*3.4,-21,x-1*W+k*4.2,-10],al(Lt,.6),1.2);
      c.fillStyle=fc(st,lg(c,x-8,-32,x+8,-20,[shade(col,.3),col]));c.beginPath();c.ellipse(x+k*3+1,-26,8*W,7,0,0,PI2);c.fill();
      if(d>=1)P(c,[x+k*3+5*W,-30,x+k*3+16*W+d*.5,-28,x+k*3+6*W,-22],fc(st,sp));
      P(c,[kx-8*W,-9,kx+7*W,-9,kx+16*W,-2,kx+16*W,1,kx-8*W,1],fc(st,dk));for(const dd of [0,5,10])P(c,[kx+6*W+dd*.6,0,kx+12*W+dd*.6,3,kx+8*W+dd*.6,1],fc(st,sp));L(c,[kx-8*W,-8,kx+7*W,-8],T,1.4);};
    if(P0.robe){const hw=26*W,sk=Math.sin(t*1.8)*2+sw*2;c.fillStyle=fc(st,lg(c,0,-56,0,0,[A,shade(A,-.45)]));c.beginPath();c.moveTo(-17*W,-56);c.lineTo(17*W,-56);c.quadraticCurveTo(22*W,-28,hw+sk,0);c.lineTo(-hw-8+sk,0);c.quadraticCurveTo(-22*W,-28,-17*W,-56);c.fill();
      if(!st.fl)for(let i=-3;i<=3;i++)S(c,[i*5*W,-52,i*7*W+sk*.5,-24,i*8*W+sk,0],shade(A,-.25),1);L(c,[-hw-8+sk,-1,hw+sk,-1],T,3);P(c,[-8,-56,8,-56,6+sk*.3,-4,-6+sk*.3,-4],fc(st,Lt));
      if(P0.robeFaces&&!st.fl)for(let i=0;i<3;i++){const fx=-12+i*12+sk*.5,fy=-30+(i%2)*10;c.save();c.globalAlpha=.35+Math.sin(t*2+i)*.2;E(c,fx,fy,4,5,P0.ghost||'#a0ffc8');E(c,fx-1.4,fy-1,1,1.4,'#0a0a0a');E(c,fx+1.4,fy-1,1,1.4,'#0a0a0a');E(c,fx,fy+2,1.2,1.8,'#0a0a0a');c.restore();}}
    else{leg(-9*W,PI,false);leg(10*W,0,true);
      for(let i=0;i<4;i++){const x0=(-21+i*10.5)*W;P(c,[x0,-54,x0+11*W,-54,x0+12*W,-30+(i%2)*3,x0-1*W,-32],fc(st,i%2?shade(A,-.18):A));L(c,[x0-1*W,-32+(i%2)*1.5,x0+12*W,-30+(i%2)*1.5],T,1.6);
        if(!st.fl)for(let r=0;r<2;r++)E(c,x0+5.5*W,-48+r*8,1,1,al(Lt,.8));}}
    // thân giáp
    c.fillStyle=fc(st,lg(c,-24*W,-94,24*W,-52,[shade(A,.22),A,shade(A,-.45)]));c.beginPath();c.moveTo(-14*W,-52);c.lineTo(14*W,-52);c.quadraticCurveTo(25*W,-70,23*W,-92);c.lineTo(-23*W,-92);c.quadraticCurveTo(-25*W,-70,-14*W,-52);c.fill();
    if(!st.fl){for(let r=0;r<3;r++)S(c,[-11*W,-60-r*6,0,-62-r*6,11*W,-60-r*6],al(Lt,.45),1);S(c,[-18*W,-90,-8*W,-74,2*W,-78],al(Lt,.5),1.2);S(c,[20*W,-90,12*W,-74,4*W,-78],al(Lt,.5),1.2);}
    // huy hiệu ngực: mặt quỷ
    {const ex=4*W,ey=-80;c.save();glow(c,T,6);E(c,ex,ey,8.5,8,fc(st,T));c.restore();E(c,ex,ey,6.6,6.2,fc(st,shade(D,-.2)));
      if(d>=2){P(c,[ex-5,ey-4,ex-8,ey-10,ex-2,ey-5],fc(st,T));P(c,[ex+5,ey-4,ex+8,ey-10,ex+2,ey-5],fc(st,T));c.save();glow(c,P0.eye||'#ff3030',6);E(c,ex-2.4,ey-1,1.4,1,P0.eye||'#ff3030');E(c,ex+2.4,ey-1,1.4,1,P0.eye||'#ff3030');c.restore();for(let i=-3;i<=3;i+=2)L(c,[ex+i,ey+3,ex+i,ey+5],'#e8e0d0',.8);}
      else E(c,ex,ey,2.4,2.4,P0.eye||'#ff3030');}
    // vết nứt phát sáng
    if(P0.crack&&!st.fl){c.save();c.globalAlpha=.6+Math.sin(t*3)*.3;glow(c,P0.crack,8);L(c,[-14*W,-64,-8*W,-70,-10*W,-78,-4*W,-86],P0.crack,1.2);L(c,[14*W,-60,10*W,-66,13*W,-74],P0.crack,1.1);L(c,[-4*W,-56,0,-62],P0.crack,1);c.restore();}
    // đai lưng
    L(c,[-15*W,-54,15*W,-54],'#1a1010',5);{const bx=3*W;E(c,bx,-54,5,4.4,fc(st,T));if(d>=3){E(c,bx,-54,3.4,3.2,'#e8e0cc');E(c,bx-1.2,-55,.9,.9,'#1a0a0a');E(c,bx+1.2,-55,.9,.9,'#1a0a0a');}else E(c,bx,-54,2,1.8,'#c8202a');}
    // chuỗi sọ
    if(P0.skulls){const n=P0.skulls;for(let i=0;i<n;i++){const u=i/(n-1),a=PI*.15+u*PI*.7,x=4*W+Math.cos(a)*15*W,y=-94+Math.sin(a)*11;if(i)L(c,[x,y,4*W+Math.cos(a-PI*.7/(n-1))*15*W,-94+Math.sin(a-PI*.7/(n-1))*11],'#5a3a20',1);E(c,x,y,3.4,3.6,fc(st,'#e8e0cc'));E(c,x-1.1,y-.5,.9,1,'#1a0a0a');E(c,x+1.1,y-.5,.9,1,'#1a0a0a');}}
    // tay sau
    {const bx=-20*W,by=-86;L(c,[bx,by,bx-8*W,-66,bx-4*W,-50],fc(st,shade(A,-.35)),9*W);E(c,bx-4*W,-48,5.4*W,5.4*W,fc(st,shade(D,-.2)));
      if(P0.chains&&!st.fl)chain(c,bx-4*W,-46,bx-14*W,-6,6,'#8a8a90',9);}
    // giáp vai
    const pauldron=(x,dir,front)=>{const base=front?A:shade(A,-.3);for(let k=2;k>=0;k--){c.fillStyle=fc(st,k%2?shade(base,-.18):base);c.beginPath();c.ellipse(x,-88+k*5.5,(15-k*2)*W,8.5-k,0,PI,0);c.fill();L(c,[x-(14-k*2)*W,-88+k*5.5,x+(14-k*2)*W,-88+k*5.5],al(T,.85),1.2);}
      const ns=1+Math.min(3,(d+1)>>1);for(let i=0;i<ns;i++){const sx=x+(i-(ns-1)/2)*8*W;P(c,[sx-3,-94,sx+dir*2,-108-(i===((ns-1)>>1)?6:0)-d*.6,sx+3,-94],fc(st,sp));}
      if(front&&d>=4){E(c,x+3,-90,5,5.4,fc(st,'#e8e0cc'));E(c,x+1.6,-91,1.2,1.4,'#1a0a0a');E(c,x+4.4,-91,1.2,1.4,'#1a0a0a');L(c,[x+1,-87,x+5,-87],'#1a0a0a',.8);}};
    pauldron(-17*W,-1,false);
    c.save();c.translate(hx,hy+14);c.scale(P0.headK||1.38,P0.headK||1.38);c.translate(-hx,-hy-14);dHead(c,st,P0,hx,hy);c.restore();
    pauldron(17*W,1,true);
    // tay trước + binh khí
    const sx=19*W,sy=-86,ang=open?1.2:atk?-2.2:.3+Math.sin(t*1.4)*.06,ex=sx+Math.sin(ang)*17*W,ey=sy+Math.cos(ang)*17,hx2=ex+Math.sin(ang*.6+.4)*16,hy2=ey+Math.cos(ang*.6+.4)*15;
    L(c,[sx,sy,ex,ey],fc(st,shade(A,-.08)),10*W);L(c,[ex,ey,hx2,hy2],fc(st,P0.arm||skin),8.5*W);L(c,[ex+(hx2-ex)*.3,ey+(hy2-ey)*.3,ex+(hx2-ex)*.75,ey+(hy2-ey)*.75],fc(st,T),9.5*W);
    c.save();c.translate(hx2,hy2);c.rotate(open?1.6:atk?-.9:.08);weapon2(c,st,P0);c.restore();
    E(c,hx2,hy2,5.4*W,5.4*W,fc(st,shade(D,-.15)));
    if(P0.chains&&!st.fl)chain(c,hx2,hy2+4,hx2+8,hy2+34,4,'#8a8a90',8);
    if(P0.orbit)orbit(c,st,P0,1,0,-70,58*W);
    c.restore();
    if(P0.embers)embers(c,t,110*W,170,P0.embers,8+d,0,20);
  }
  /* ================= RỒNG NHIỀU ĐẦU — cao thiết kế 140 ================= */
  function wyrm(c,st,x,y,rot,s,dir,H,jaw,d){c.save();c.translate(x,y);c.scale(dir*s,s);c.rotate(rot);const [A,D,Bl,X]=H.c;
    for(let k=0;k<5;k++)P(c,[-8+k*3,-8+k,-18-k*2,-18-k*3+Math.sin(st.t*3+k)*1.5,-4+k*3,-5+k],fc(st,k%2?X:shade(X,-.25)));
    for(const dd of [0,1]){const col=fc(st,H.horn||'#e8d8b8');S(c,[2+dd*4,-9,-6+dd*4,-20,-16+dd*3,-26,-20+dd*2,-22],col,2.8-dd*.6);}
    c.save();c.translate(6,5);c.rotate(jaw);F(c,[-6,-2,24,0,28,5,20,7,-4,7],fc(st,shade(A,-.2)));if(jaw>.15){for(let xx=6;xx<24;xx+=3.6)P(c,[xx,0,xx+1.4,-4.4,xx+2.8,0],'#f8f0e0');P(c,[2,1,22,1,18,5,2,5],'#5a0a10');}c.restore();
    c.fillStyle=fc(st,lg(c,-10,-14,30,6,[shade(A,.2),A,shade(A,-.25)]));c.beginPath();c.moveTo(-10,3);c.quadraticCurveTo(-9,-13,6,-12);c.quadraticCurveTo(22,-10,32,-3);c.quadraticCurveTo(34,3,29,6);c.lineTo(6,8);c.quadraticCurveTo(-6,10,-10,3);c.fill();
    if(jaw>.15)for(let xx=10;xx<30;xx+=3.6)P(c,[xx,5,xx+1.4,9.5,xx+2.8,5],'#f8f0e0');else for(let xx=12;xx<28;xx+=4)P(c,[xx,6,xx+1.2,9,xx+2.4,6],'#f8f0e0');
    E(c,30,-2,1.6,1.2,'#140808');P(c,[0,-11,12,-8,8,-6],fc(st,shade(A,-.35)));c.save();glow(c,H.eye,10);E(c,9,-6,3.2,2.2,H.eye);c.restore();E(c,9.6,-6,1,1.8,'#140808');
    if(d>=6&&!st.fl)for(let i=0;i<4;i++)E(c,-2+i*6,-10+i*.6,1.3,.9,al(shade(A,.5),.6));
    if(H.breath&&jaw>.3){c.save();for(let k=0;k<7;k++){const u=k/7;c.globalAlpha=.7*(1-u);glow(c,H.breath,10);E(c,34+u*50,4+Math.sin(st.t*20+k)*3+u*8,4+u*10,3+u*6,H.breath);}c.restore();}
    c.restore();}
  function hydra(c,m,M,st,P0){const {t,open}=st,[A,D,Bl,X]=P0.c,n=P0.heads,d=P0.d||0,mv=m.moving?1:0,g=m.walk||0;
    E(c,-8,-2,80,10,'#00000030');
    if(P0.runes)runes(c,t,86,P0.runes,10+d);
    if(P0.aura)aura(c,t,P0.aura,130,140,6+d);
    if(P0.wing){const f=Math.sin(t*2)*.12;batWing(c,st,-16,-70,1.25,-.4-f,shade(P0.wingCol||D,-.3),'#120a10');batWing(c,st,-6,-66,1.35,-.1+f,P0.wingCol||D,'#1e1018');}
    const tw=Math.sin(t*1.4)*6;tube(c,st,bez([-28,-24],[-74,-6],[-92,-40+tw],[-122,-30+tw*1.4],12),17,2.5,A,Bl,fc(st,X),8);
    const leg=(x,ph,back)=>{const k=Math.sin(g+ph)*mv*6,col=fc(st,back?shade(A,-.3):A);E(c,x,-30,13,15,col);L(c,[x+2,-22,x+6+k,-6],col,11);E(c,x+8+k,-3,10,4.4,col);for(const dd of [-3,1,5])P(c,[x+12+k+dd,-3,x+20+k+dd,1,x+12+k+dd,2],'#e8e0c8');};
    leg(-30,PI,true);leg(14,0,true);
    c.fillStyle=fc(st,lg(c,0,-84,0,-6,[shade(A,.2),A,shade(A,-.35)]));c.beginPath();c.ellipse(-8,-40,50,34,0,0,PI2);c.fill();
    E(c,-4,-20,38,12,fc(st,Bl));if(!st.fl){for(let r=0;r<4;r++)L(c,[-34+r*4,-16-r*.5,26-r*4,-16-r*.5],shade(Bl,-.25),.9);
      for(let r=0;r<4;r++)for(let q=0;q<9;q++){c.strokeStyle=al(shade(A,.45),.5);c.lineWidth=.9;c.beginPath();c.arc(-44+q*9+(r%2)*4.5,-66+r*9,4.4,PI*1.05,PI*1.95);c.stroke();}
      for(let q=0;q<7;q++){const x=-40+q*11;P(c,[x-4,-70+Math.abs(q-3)*1.6,x,-82-(d>>1)+Math.abs(q-3)*2,x+4,-70+Math.abs(q-3)*1.6],fc(st,X));}}
    leg(-20,0,false);leg(24,PI,false);
    const order=[...Array(n).keys()].sort((a,b)=>Math.abs(b-(n-1)/2)-Math.abs(a-(n-1)/2));
    for(const i of order){const u=n>1?i/(n-1):.5,ctr=1-Math.abs(u-.5)*2,phi=-PI*.92+u*PI*.78,len=(P0.neck||70)*(.78+.32*ctr),bx=-8+Math.cos(-PI*.85+u*PI*.7)*30,by=-62+Math.sin(-PI*.85+u*PI*.7)*14,
      sx=Math.sin(t*1.5+i*1.3)*7,sy=Math.cos(t*1.3+i*1.7)*5,hx=bx+Math.cos(phi)*len+sx,hy=by+Math.sin(phi)*len*.95+sy,dir=Math.cos(phi)<-.3?-1:1,H=(P0.headCols&&P0.headCols[i])||{c:P0.c,eye:P0.eye,horn:P0.horn,breath:P0.breath},
      jaw=open?(ctr>.6?.55:.35):(Math.sin(t*2+i*1.9)>.86?.4:.06);
      const pts=bez([bx,by],[bx+Math.cos(phi)*len*.2,by-len*.35],[hx-dir*len*.35,hy+len*.25],[hx-dir*6,hy+4],12);
      tube(c,st,pts,(P0.neckR||11)*(.85+.25*ctr),(P0.neckR||11)*.62,H.c[0],H.c[2],fc(st,P0.spine||H.c[3]),P0.spines==null?5:P0.spines);
      wyrm(c,st,hx,hy,dir>0?-.12+Math.sin(t*1.7+i)*.08:-.2,(P0.headS||1)*(.82+.3*ctr),dir,H,jaw,d);
      if(P0.drip&&!st.fl){c.save();c.fillStyle=P0.drip;const ph=(t*.8+hr(i+30))%1;c.globalAlpha=1-ph;E(c,hx+dir*16,hy+12+ph*40,1.4,2.6,P0.drip);c.restore();}}
    if(P0.embers)embers(c,t,200,160,P0.embers,10+d,0,30);
  }
  /* ================= HƯ KHÔNG VƯƠNG: khổng lồ pha lê lơ lửng trước khe nứt hư không — cao thiết kế 150 ================= */
  function voidKing(c,m,M,st,P0){const {t,open,atk}=st,[A,D,Lt]=P0.c,gl=P0.ghost||'#c0b0ff',eye=P0.eye||'#ffffff',d=P0.d||0,bob=Math.sin(t*1.5)*4,lift=open?-40:atk?-14:Math.sin(t*1.3)*4;
    if(P0.runes)runes(c,t,70,P0.runes,10+d);
    // khe nứt hư không
    c.save();c.translate(-6,-86);c.fillStyle=rg(c,0,0,64,['#000000','#0a0420',al(gl,.5),al(gl,0)]);c.beginPath();c.ellipse(0,0,44,74,.08,0,PI2);c.fill();
    for(let i=0;i<14;i++){const a=hr(i+5)*PI2,r=hr(i+6)*40;c.globalAlpha=.4+.6*Math.abs(Math.sin(t*2+i));E(c,Math.cos(a)*r*.6,Math.sin(a)*r*1.4,.9,.9,'#ffffff');}c.globalAlpha=1;
    c.strokeStyle=al(gl,.8);c.lineWidth=1.6;c.beginPath();for(let i=0;i<=24;i++){const a=i/24*PI2,r=1+Math.sin(a*7+t*3)*.05;i?c.lineTo(Math.cos(a)*44*r,Math.sin(a)*74*r):c.moveTo(44*r,0);}c.stroke();c.restore();
    orbit(c,st,P0,0,0,-80,66);
    const shard=(x,y,rx,ry,rot,col)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=fc(st,lg(c,-rx,-ry,rx,ry,[shade(col,.35),col,shade(col,-.45)]));c.beginPath();c.moveTo(0,-ry);c.lineTo(rx,-ry*.25);c.lineTo(rx*.7,ry*.8);c.lineTo(-rx*.5,ry);c.lineTo(-rx,-ry*.1);c.closePath();c.fill();
      if(!st.fl){L(c,[0,-ry,0,ry*.2,rx*.7,ry*.8],al(Lt,.5),.9);L(c,[-rx,-ry*.1,0,ry*.2],al(D,.6),.8);}c.restore();};
    // chân lơ lửng
    for(const [x,ph] of [[-16,0],[16,PI]]){const y=-14+Math.sin(t*1.8+ph)*3;shard(x,y,10,13,0,A);c.save();glow(c,gl,8);E(c,x,y+12,7,2,al(gl,.6));c.restore();}
    c.save();c.translate(0,bob);
    // tay sau
    c.save();c.translate(-36,-96);c.rotate(-.3);shard(0,0,10,10,0,D);shard(-4,22,9,15,.1,A);shard(-6,46,13,12,.3,D);for(const a of [-.5,0,.5])shard(-6+Math.sin(a)*10,62,4,12,a,Lt);c.restore();
    // thân pha lê
    shard(0,-58,22,22,.05,D);shard(0,-92,34,30,0,A);
    c.save();glow(c,gl,12);c.strokeStyle=al(gl,.8);c.lineWidth=1.3;for(const p of [[-20,-100,-6,-86,-14,-70],[18,-108,6,-90,16,-76],[-6,-66,4,-52]]){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.stroke();}c.restore();
    // mắt lõi
    {const ex=2,ey=-92,ir=Math.sin(t*.8)*2;c.save();glow(c,gl,18);E(c,ex,ey,12,8,'#05020c');c.restore();E(c,ex+ir,ey,6,6,fc(st,gl));E(c,ex+ir,ey,3,5,'#05020c');E(c,ex+ir-1.6,ey-2,1.4,1.4,'#ffffff');
      if(open){c.save();c.globalAlpha=.6;glow(c,gl,16);L(c,[ex+8,ey,ex+90,ey+30],gl,4);L(c,[ex+8,ey,ex+90,ey+30],'#ffffff',1.4);c.restore();}}
    // vai, đầu
    shard(-26,-118,11,9,-.3,Lt);shard(24,-118,11,9,.3,Lt);
    shard(2,-130,13,12,0,A);c.save();glow(c,eye,10);P(c,[3,-133,10,-132,9,-129,3,-130],eye);P(c,[-5,-133,0,-133,0,-130,-4,-130],eye);c.restore();
    dHead(c,st,{c:P0.c,horns:'shards',ghost:gl,head:'none'},2,-130);
    // tay trước: vuốt pha lê lớn
    c.save();c.translate(34,-104);c.rotate(.5+lift/45);shard(0,0,10,10,0,Lt);shard(4,22,9,15,-.1,A);shard(6,46,13,12,-.3,D);for(const a of [-.6,0,.6]){c.save();glow(c,gl,6);shard(6+Math.sin(a)*12,66,4,14,a,Lt);c.restore();}c.restore();
    c.restore();
    orbit(c,st,P0,1,0,-80,66);
    embers(c,t,120,170,gl,10+d,0,50);
  }
  /* ================= HỖN NGUYÊN MA TỔ: ba mặt sáu tay, vòng lửa, bốn cánh — cao thiết kế 180 ================= */
  function mato(c,m,M,st,P0){const {t,open,atk}=st,[A,D,Lt,T]=P0.c,skin=P0.skin,eye=P0.eye,gl=P0.ghost,g=m.walk||0,mv=m.moving?1:0,br=Math.sin(t*1.2)*1.2;
    runes(c,t,120,T,24);runes(c,-t*.7,84,gl,16);
    aura(c,t,gl,150,200,16);
    // tia sét lóe
    {const k=Math.floor(t*3);if(hr(k+7)>.55)bolt(c,(hr(k+1)-.5)*180,-230,(hr(k+2)-.5)*80,-140,k,gl);}
    c.save();c.translate(0,br);
    halo(c,st,0,-162,80,{halo:T,haloType:'wheel'});
    // bốn cánh
    const f=Math.sin(t*1.8)*.1;batWing(c,st,-14,-128,1.65,-.7-f,shade(D,-.4),'#0a0408');batWing(c,st,-10,-122,1.8,-.32+f,shade(D,-.2),'#140a10');
    c.save();c.scale(-1,1);batWing(c,st,-10,-128,1.4,-.75+f,shade(D,-.5),'#0a0408');c.restore();
    batWing(c,st,-6,-110,1.6,.05-f,D,'#1e0e18');
    // tay sau (ba tay bên trái, tối hơn)
    const arm=(sx,sy,a1,l1,a2,l2,col,thick,item)=>{const ex=sx+Math.cos(a1)*l1,ey=sy+Math.sin(a1)*l1,hx=ex+Math.cos(a2)*l2,hy=ey+Math.sin(a2)*l2;L(c,[sx,sy,ex,ey],fc(st,col),thick);L(c,[ex,ey,hx,hy],fc(st,shade(col,-.08)),thick*.85);
      L(c,[ex+(hx-ex)*.35,ey+(hy-ey)*.35,ex+(hx-ex)*.8,ey+(hy-ey)*.8],fc(st,T),thick*.95);E(c,hx,hy,thick*.62,thick*.62,fc(st,shade(col,-.2)));if(item)item(hx,hy);return [hx,hy];};
    const sw0=Math.sin(t*1.3);
    arm(-24,-120,-2.3+sw0*.06,26,-1.9,24,shade(skin,-.35),10,(x,y)=>{c.save();glow(c,gl,22);E(c,x-2,y-14,13,13,'#140418');c.restore();E(c,x-2,y-14,13,13,al(gl,.25));swirl(c,t,x-2,y-14,16,gl);bolt(c,x-10,y-24,x+6,y-6,Math.floor(t*8),gl);});
    arm(-28,-108,-3.0+sw0*.05,26,-2.6,22,shade(skin,-.4),10,(x,y)=>{if(!st.fl){chain(c,x,y,x-30,y+24,10,'#9a9aa4',12);chain(c,x-30,y+24,x-18,y+64,8,'#9a9aa4',10);}});
    arm(-24,-96,2.4+sw0*.08,22,2.0,20,shade(skin,-.4),9,(x,y)=>{flames(c,t,x,y-2,1.4,[gl,'#ffffff'],5);for(const a of [-.4,0,.4])L(c,[x,y,x+Math.cos(PI*.7+a)*10,y+Math.sin(PI*.7+a)*10],'#e8e0d0',1.6);});
    // váy giáp, chân
    for(const [x,ph] of [[-14,PI],[16,0]]){const k=Math.sin(g+ph)*mv*8;P(c,[x-11+k,-14,x+12+k,-14,x+24+k,-1,x+24+k,2,x-11+k,2],fc(st,shade(D,-.2)));for(const dd of [0,6,12])P(c,[x+12+k+dd*.7,0,x+20+k+dd*.7,4,x+14+k+dd*.7,2],fc(st,'#e8e0d0'));}
    {const sk=Math.sin(t*1.6)*3+Math.sin(g)*mv*3;c.fillStyle=fc(st,lg(c,0,-74,0,-6,[shade(A,.1),A,shade(A,-.5)]));c.beginPath();c.moveTo(-26,-74);c.lineTo(26,-74);c.quadraticCurveTo(36,-40,46+sk,-10);c.lineTo(-50+sk,-10);c.quadraticCurveTo(-36,-40,-26,-74);c.fill();
      if(!st.fl)for(let i=0;i<7;i++){const x0=-40+i*13+sk*.6;L(c,[x0*(.6)+i*0,-70,x0,-12],shade(A,-.35),1.2);}
      L(c,[-50+sk,-11,46+sk,-11],T,3);for(let i=0;i<6;i++){const x=-38+i*15+sk;E(c,x,-24,5,5.6,fc(st,'#e8e0cc'));E(c,x-1.6,-25,1.3,1.5,'#1a0a0a');E(c,x+1.6,-25,1.3,1.5,'#1a0a0a');}
      for(let i=0;i<8;i++)flames(c,t+i*.37,-46+i*13+sk,-10,1.1,[gl,'#ffd0f0'],2);}
    // thân
    c.fillStyle=fc(st,lg(c,-34,-126,34,-70,[shade(skin,.2),skin,shade(skin,-.45)]));c.beginPath();c.moveTo(-22,-72);c.lineTo(22,-72);c.quadraticCurveTo(36,-96,34,-122);c.lineTo(-34,-122);c.quadraticCurveTo(-36,-96,-22,-72);c.fill();
    if(!st.fl){S(c,[-26,-118,-10,-102,2,-106],al(shade(skin,-.5),.8),1.6);S(c,[28,-118,14,-102,4,-106],al(shade(skin,-.5),.8),1.6);for(let r=0;r<3;r++){L(c,[-10,-96+r*8,-2,-96+r*8],al(shade(skin,-.5),.7),1.2);L(c,[4,-96+r*8,12,-96+r*8],al(shade(skin,-.5),.7),1.2);}
      c.save();c.globalAlpha=.55+Math.sin(t*3)*.35;glow(c,gl,8);L(c,[-24,-110,-16,-100,-20,-90,-12,-80],gl,1.3);L(c,[24,-112,18,-100,22,-88],gl,1.3);L(c,[-6,-118,-2,-108,-6,-100],gl,1);c.restore();}
    // mặt quỷ ở bụng (khóa đai)
    {const bx=2,by=-74;c.save();glow(c,T,10);E(c,bx,by,15,12,fc(st,T));c.restore();E(c,bx,by,12,9.4,fc(st,shade(T,-.45)));P(c,[bx-11,by-6,bx-18,by-16,bx-6,by-9],fc(st,T));P(c,[bx+11,by-6,bx+18,by-16,bx+6,by-9],fc(st,T));
      c.save();glow(c,eye,10);E(c,bx-5,by-3,2.6,1.6,eye);E(c,bx+5,by-3,2.6,1.6,eye);c.restore();P(c,[bx-8,by+2,bx+8,by+2,bx+6,by+(open?9:6),bx-6,by+(open?9:6)],'#1a0408');for(let i=-6;i<=6;i+=3)P(c,[bx+i-1,by+2,bx+i,by+5,bx+i+1,by+2],'#ffffff');}
    L(c,[-24,-72,24,-72],'#1a0a10',5);
    // vai, vòng cổ, chuỗi sọ
    for(const [x,d0,front] of [[-28,-1,false],[28,1,true]]){const base=front?A:shade(A,-.3);for(let k=2;k>=0;k--){c.fillStyle=fc(st,k%2?shade(base,-.2):base);c.beginPath();c.ellipse(x,-122+k*6,18-k*2,10-k,d0*.25,PI,0);c.fill();L(c,[x-17+k*2,-122+k*6,x+17-k*2,-122+k*6],T,1.4);}
      for(let i=0;i<4;i++){const sx=x+(i-1.5)*8;P(c,[sx-3.4,-128,sx+d0*3,-140-(i%2?0:6),sx+3.4,-128],fc(st,'#e8e0d0'));}E(c,x+2,-124,6,6.4,fc(st,'#e8e0cc'));E(c,x,-125,1.5,1.7,eye);E(c,x+3.6,-125,1.5,1.7,eye);}
    for(let i=0;i<9;i++){const u=i/8,a=PI*.12+u*PI*.76,x=2+Math.cos(a)*24,y=-124+Math.sin(a)*16;E(c,x,y,4,4.4,fc(st,'#e8e0cc'));E(c,x-1.3,y-.6,1.1,1.2,'#1a0a0a');E(c,x+1.3,y-.6,1.1,1.2,'#1a0a0a');}
    // ba mặt
    const face=(x,y,s,dir,main)=>{c.save();c.translate(x,y);c.scale(dir*s,s);
      c.fillStyle=fc(st,rg(c,3,-2,14,[shade(skin,.2),skin,shade(skin,-.4)]));c.beginPath();c.ellipse(0,0,11,13,0,0,PI2);c.fill();
      P(c,[-9,-7,3,-4,12,-8,12,-4,2,-1,-9,-3],fc(st,shade(skin,-.45)));c.save();glow(c,eye,12);E(c,6,-2,2.4,1.6,eye);E(c,0,-2,2.2,1.5,eye);E(c,3,-11,1.3,3,eye);c.restore();
      c.save();c.translate(2,6);c.rotate(open&&main?.35:.05);P(c,[-4,0,12,-1,11,open&&main?9:4,-3,open&&main?8:4],'#2a0408');for(let i=0;i<4;i++)P(c,[i*3,0,i*3+1.3,4,i*3+2.6,0],'#ffffff');P(c,[1,3,3,-6,4,3],'#f0e8d0');P(c,[8,3,10,-6,11,3],'#f0e8d0');c.restore();
      P(c,[-9,-1,-18,-9,-11,2],fc(st,shade(skin,-.2)));c.restore();};
    E(c,2,-132,13,10,fc(st,shade(skin,-.25)));face(-22,-152,1.05,-1,false);
    // sừng lớn
    horns(c,st,{horns:'long',hornCol:'#140a10',d:10},2,-160);
    face(4,-154,1.45,1,true);face(28,-150,.95,1,false);
    // mũ miện lửa
    c.save();glow(c,T,12);P(c,[-30,-166,-32,-188,-20,-176,-12,-202,-2,-178,4,-210,10,-178,20,-200,26,-176,36,-186,34,-166],fc(st,T));c.restore();
    E(c,4,-178,4,4,eye);E(c,-12,-176,2.2,2.2,gl);E(c,20,-176,2.2,2.2,gl);flames(c,t,4,-206,2.2,[gl,'#ffffff'],7);
    // tay trước: giáo dựng cao, kiếm ngang, đại đao vung
    arm(32,-118,-.75+sw0*.05,28,-1.35,22,skin,11,(x,y)=>{c.save();c.translate(x,y);c.rotate(.1);weapon2(c,st,{weapon:'trident',c:P0.c,wcol:'#e8d8a0',wglow:gl,pole:'#1a0a14',d:10});c.restore();});
    arm(30,-108,-.2+sw0*.05,24,.1,22,skin,10,(x,y)=>{c.save();c.translate(x,y);c.rotate(1.45);weapon2(c,st,{weapon:'bigsword',c:P0.c,wcol:'#d8d0e8',wglow:gl,gem:eye,d:10});c.restore();});
    {const sx=24,sy=-96,ang=open?1.25:atk?-2.3:.45+Math.sin(t*1.4)*.06,ex=sx+Math.sin(ang)*22,ey=sy+Math.cos(ang)*22,hx2=ex+Math.sin(ang*.6+.4)*20,hy2=ey+Math.cos(ang*.6+.4)*18;
      L(c,[sx,sy,ex,ey],fc(st,skin),12);L(c,[ex,ey,hx2,hy2],fc(st,shade(skin,-.06)),10.5);L(c,[ex+(hx2-ex)*.3,ey+(hy2-ey)*.3,ex+(hx2-ex)*.78,ey+(hy2-ey)*.78],fc(st,T),11.5);
      c.save();c.translate(hx2,hy2);c.rotate(open?1.6:atk?-.9:.08);c.scale(1.3,1.3);weapon2(c,st,{weapon:'saber',c:P0.c,wcol:'#f0e0c0',wglow:eye,pole:'#1a0a14',d:10});c.restore();E(c,hx2,hy2,7,7,fc(st,shade(D,-.2)));}
    c.restore();
    embers(c,t,240,240,eye,22,0,10);embers(c,t,200,220,gl,16,0,80);
  }
  /* ================= THÚ BỐN CHÂN (sư tử, ngựa, hổ, chó quỷ) — cao thiết kế 80 ================= */
  function beast(c,m,M,st,P0){const {t,open}=st,g=m.walk||0,mv=m.moving?1:0,[A,D,Lt,X]=P0.c,k=P0.kind,d=P0.d||0,eye=P0.eye||'#ffd040',horse=k==='horse',bob=Math.sin(g*2)*mv*1.2,mane=P0.mane||X;
    E(c,0,-1,42,5,'#00000026');
    if(P0.fire)embers(c,t,80,70,P0.fire,5+d,-16);
    c.save();c.translate(0,bob);if(P0.ghost)c.globalAlpha=.88;
    if(P0.wings==='feather')fWing(c,st,-4,-50,.72,.25+Math.sin(t*3)*.18,shade(P0.wcol||Lt,-.18),Lt);
    if(P0.wings==='bat')batWing(c,st,-2,-48,.62,-.25-Math.sin(t*3)*.16,shade(D,-.35),'#100810');
    // đuôi
    const tw=Math.sin(t*2.4)*5;for(let j=0;j<(P0.tails||1);j++){const o=j*8;
      if(horse){for(let s=0;s<5;s++)S(c,[-30,-46,-44-s,-44+tw*.4+s,-50-s*1.5,-24+tw+s*2,-46-s,-8+s*2],fc(st,s%2?mane:shade(mane,-.25)),2.4);}
      else{S(c,[-30,-42-o,-46,-50+tw-o,-52-o*.5,-66+tw-o],fc(st,A),4.6);if(P0.fire&&k!=='lion')flames(c,t+j,-52-o*.5,-66+tw-o,.9,[P0.fire,'#ffe080'],3);else{c.save();c.translate(-52-o*.5,-68+tw-o);for(let s=0;s<5;s++){const a=-PI*.5+(s-2)*.4;F(c,[0,4,Math.cos(a)*8,Math.sin(a)*8,Math.cos(a)*3,Math.sin(a)*3+2],fc(st,mane));}c.restore();}
        if(k==='tiger'&&!st.fl)for(let s=0;s<3;s++)L(c,[-36-s*5,-44-s*4+tw*.3,-38-s*5,-50-s*4+tw*.4],'#1a1410',1.6);}}
    const leg=(x,ph,back)=>{const s=Math.sin(g*1.5+ph)*mv,col=fc(st,back?shade(A,-.28):A),dk=fc(st,back?shade(D,-.25):D),kx=x+s*6;
      E(c,x,-38,horse?8:10,horse?11:10,col);L(c,[x,-34,kx,-18],col,horse?7:9);L(c,[kx,-18,x+s*4,-3],dk,horse?5:7);
      if(horse){P(c,[x+s*4-4.4,-4,x+s*4+4.4,-4,x+s*4+5,1,x+s*4-5,1],fc(st,'#1a1414'));if(P0.fire)flames(c,t+x,x+s*4,-4,.55,[P0.fire,'#ffe080'],2);}
      else{E(c,x+s*4+2,-2,7,3.6,dk);for(const dd of [-2,1,4])P(c,[x+s*4+5+dd,-1,x+s*4+8+dd,1.6,x+s*4+5+dd,1.4],'#e8e0d0');}
      if((P0.stone||P0.lava)&&!st.fl){L(c,[x-2,-34,x+1,-28,x-1,-22],P0.lava?P0.lava:shade(D,-.35),P0.lava?1.2:.9);}
      if(P0.armor&&!back){P(c,[x-6,-44,x+7,-44,x+6,-32,x-5,-32],fc(st,P0.armor));L(c,[x-6,-44,x+7,-44],X,1.2);}};
    leg(-22,0,true);leg(16,PI,true);
    // thân
    c.fillStyle=fc(st,lg(c,0,-58,0,-22,[shade(A,.18),A,shade(A,-.25)]));c.beginPath();c.ellipse(-3,-40,horse?30:33,horse?14:16,-.04,0,PI2);c.fill();E(c,-1,-28,23,5,fc(st,Lt));
    if(!st.fl){
      if(k==='tiger')for(let s=0;s<7;s++){const x=-30+s*9;F(c,[x,-56,x+4,-47,x+1,-36,x-2,-46],'#1a1410');}
      if(P0.stone){L(c,[-24,-50,-14,-44,-18,-36],shade(D,-.35),1);L(c,[4,-54,10,-46,6,-38],shade(D,-.35),1);E(c,-10,-52,4,2,al(shade(A,.4),.6));}
      if(P0.lava){c.save();c.globalAlpha=.7+Math.sin(t*3)*.25;glow(c,P0.lava,8);L(c,[-26,-48,-16,-42,-20,-34],P0.lava,1.4);L(c,[2,-54,8,-46,4,-38,10,-32],P0.lava,1.4);L(c,[-8,-56,-4,-50],P0.lava,1.2);c.restore();}
      if(P0.stars)for(let s=0;s<9;s++){const x=-28+hr(s+3)*50,y=-50+hr(s+4)*20;c.globalAlpha=.4+.6*Math.abs(Math.sin(t*2+s));E(c,x,y,1,1,'#ffffff');c.globalAlpha=1;}
      if(P0.armor){c.fillStyle=fc(st,P0.armor);c.beginPath();c.ellipse(-4,-44,26,12,0,PI*1.05,PI*1.95);c.fill();for(let s=0;s<5;s++)L(c,[-24+s*10,-52,-26+s*10,-40],X,1.2);L(c,[-28,-40,20,-40],X,1.6);}
      if(P0.spikes)for(let s=0;s<5+(d>>1);s++){const x=-28+s*(52/(5+(d>>1)));P(c,[x-3,-53,x,-62-(s%2?0:3),x+3,-53],fc(st,X));}}
    leg(-16,PI,false);leg(22,0,false);
    // cổ + đầu
    if(horse){F(c,[12,-50,20,-66,30,-78,38,-72,30,-54,22,-40],fc(st,A));for(let s=0;s<6;s++){const x=14+s*3.6,y=-56-s*4;if(P0.fire)flames(c,t+s*.3,x,y,.6,[P0.fire,'#ffe080'],2);else F(c,[x,y,x-8,y-4+Math.sin(t*3+s)*2,x-2,y+2],fc(st,mane));}
      c.save();c.translate(34,-76);c.rotate(open?-.25:.35+Math.sin(t*1.5)*.04);
      F(c,[-6,-6,4,-10,22,-4,26,2,22,6,4,6,-6,4],fc(st,A));P(c,[-4,-8,-1,-16,2,-8],fc(st,shade(A,-.2)));
      if(P0.armor){P(c,[2,-9,20,-5,20,0,2,-2],fc(st,P0.armor));P(c,[6,-9,8,-18,10,-8],fc(st,X));}
      c.save();glow(c,eye,8);E(c,4,-3,2,1.6,eye);c.restore();E(c,24,1,1.2,1,'#140808');if(open){P(c,[16,4,26,4,22,9],'#2a0808');}
      c.restore();}
    else{const hx=k==='hound'?32:30,hy=k==='hound'?-56:-58;c.save();c.translate(hx,hy+Math.sin(t*1.5)*.8);c.rotate(open?-.14:0);
      if(k==='lion'){for(let s=0;s<14;s++){const a=PI*.35+s/14*PI*1.4,r=15+(s%2)*3,w=Math.sin(t*3+s)*1.2;
          if(P0.stone){E(c,Math.cos(a)*r*.8-3,Math.sin(a)*r*.8,5,5,fc(st,s%2?mane:shade(mane,-.2)));if(!st.fl){c.strokeStyle=shade(mane,-.4);c.lineWidth=.8;c.beginPath();c.arc(Math.cos(a)*r*.8-3,Math.sin(a)*r*.8,2.6,0,PI*1.5);c.stroke();}}
          else F(c,[Math.cos(a-.2)*8-3,Math.sin(a-.2)*8,Math.cos(a)*(r+6)-3+w,Math.sin(a)*(r+6)+w,Math.cos(a+.2)*8-3,Math.sin(a+.2)*8],fc(st,s%2?mane:shade(mane,-.2)));}
        if(P0.fire)flames(c,t,-6,-14,1,[P0.fire,'#fff0a0'],4);}
      if(k==='hound'){P(c,[-8,-6,-14,-20,-4,-8],fc(st,shade(A,-.2)));for(let s=0;s<(P0.horns||2);s++)S(c,[-2-s*3,-8,-8-s*4,-20-s*2,-16-s*3,-24-s*2],fc(st,P0.hornCol||'#1a1214'),2.4-s*.3);}
      else if(P0.horn){c.save();glow(c,P0.horn,6);S(c,[2,-10,4,-20,0,-28],fc(st,P0.horn),2.6);c.restore();}
      if(P0.crystal){c.save();glow(c,P0.crystal,8);for(const [x,h,a] of [[-6,12,-.6],[-1,16,-.3],[4,10,0]]){c.save();c.translate(x,-8);c.rotate(a);P(c,[-2.4,0,0,-h,2.4,0],fc(st,P0.crystal));c.restore();}c.restore();}
      // sọ, mõm
      const long=k==='hound';c.fillStyle=fc(st,lg(c,-8,-10,22,8,[shade(A,.15),A,shade(A,-.2)]));c.beginPath();c.moveTo(-8,2);c.quadraticCurveTo(-8,-11,4,-11);c.quadraticCurveTo(14,-10,long?26:20,-2);c.quadraticCurveTo(long?27:21,4,long?20:15,6);c.quadraticCurveTo(-2,9,-8,2);c.fill();
      if(k==='tiger'&&!st.fl){L(c,[-4,-9,0,-6],'#1a1410',1.6);L(c,[4,-10,6,-6],'#1a1410',1.4);E(c,-2,4,6,4,fc(st,'#f8f0e0'));}
      if(P0.stone&&!st.fl)L(c,[-4,-8,2,-2,0,4],shade(D,-.35),.9);
      E(c,long?25:19.5,-1,2,1.6,'#140808');P(c,[1,-9,9,-7,6,-5],fc(st,shade(A,-.4)));c.save();glow(c,eye,8);E(c,6,-5,2.4,1.7,eye);c.restore();E(c,6.4,-5,.8,1.4,'#140808');
      c.save();c.translate(6,4);c.rotate(open?.42:.06);F(c,[-4,0,long?20:14,0,long?18:12,5,-2,5],fc(st,shade(A,-.25)));c.restore();
      if(open){P(c,[6,3,long?24:18,3,long?20:15,9],'#3a0808');for(let xx=8;xx<(long?22:16);xx+=3.4)P(c,[xx,3,xx+1.2,6.4,xx+2.4,3],'#ffffff');}
      P(c,[long?20:14,3,long?21:15,8,long?22:16,3],'#ffffff');
      c.restore();}
    c.restore();}
  /* ================= HỒN MA LƠ LỬNG (cát, băng, u hồn) — cao thiết kế 90 ================= */
  function wraith(c,m,M,st,P0){const {t,open}=st,[A,D,Lt]=P0.c,d=P0.d||0,eye=P0.eye||'#ffffff',fy=-12+Math.sin(t*2)*4,lean=open?7:0;
    E(c,0,-1,22,4,'#00000022');
    if(P0.sand){swirl(c,t,0,-30,26,al(P0.sand,.7));swirl(c,t+1.3,4,-56,20,al(P0.sand,.5));embers(c,t,60,80,P0.sand,8+d,-6,12);}
    if(P0.ice)orbit(c,st,{orbit:'shards',orbitN:4,ghost:P0.ice,c:P0.c},0,0,-50,30);
    c.save();if(P0.alpha)c.globalAlpha=P0.alpha;c.translate(lean,fy);
    // đuôi khói
    for(let k=7;k>=0;k--){const u=k/7,x=-4-u*22+Math.sin(t*3+u*4)*4,y=-36+u*36,r=13*(1-u*.75);c.globalAlpha=(P0.alpha||1)*(1-u*.6);E(c,x,y,r,r*.9,fc(st,k%2?A:shade(A,-.12)));}c.globalAlpha=P0.alpha||1;
    // tay sau
    S(c,[-8,-62,-14,-48,-4,-38+(open?-4:0)],fc(st,shade(A,-.3)),4.4);for(const a of [-.4,0,.4])L(c,[-4,-38,-4+Math.cos(a+.6)*7,-38+Math.sin(a+.6)*7],fc(st,'#e8e0d0'),1.2);
    // thân áo rách
    c.fillStyle=fc(st,lg(c,0,-68,0,-28,[shade(A,.15),A,shade(A,-.3)]));c.beginPath();c.moveTo(-12,-66);c.quadraticCurveTo(-16,-46,-12,-28);for(let i=0;i<6;i++)c.lineTo(-12+i*5,-28+(i%2?7+hr(i)*4:0));c.quadraticCurveTo(16,-46,14,-64);c.closePath();c.fill();
    if(!st.fl)for(let i=0;i<3;i++)S(c,[-6+i*6,-62,-7+i*6,-44,-8+i*6+Math.sin(t*3+i)*2,-30],shade(A,-.3),.9);
    if(P0.chains&&!st.fl){chain(c,-12,-50,14,-44,6,'#9aa0a0',7);chain(c,0,-36,-6,-4,3,'#9aa0a0',8);c.fillStyle='#6a6a70';c.fillRect(-9,-6,6,5);}
    // đầu
    const hx=4,hy=-76;
    if(P0.face==='skull'){F(c,[hx-12,hy+8,hx-14,hy-8,hx-2,hy-16,hx+12,hy-12,hx+14,hy+6],fc(st,shade(A,-.4)));E(c,hx+2,hy,8,9,fc(st,'#e0d8c2'));E(c,hx+4,hy+6,5.4,3.4,fc(st,'#d0c8b0'));E(c,hx+5,hy-1,2.4,2.8,'#0a0a0a');E(c,hx,hy-1,2.2,2.6,'#0a0a0a');c.save();glow(c,eye,8);E(c,hx+5,hy-1,1,1.2,eye);E(c,hx,hy-1,.9,1.1,eye);c.restore();for(let i=-1;i<6;i+=2)L(c,[hx+i,hy+5,hx+i,hy+8],'#3a3020',.7);}
    else if(P0.face==='ice'){c.fillStyle=fc(st,lg(c,hx-10,hy-12,hx+12,hy+10,['#ffffff',Lt,A]));c.beginPath();c.moveTo(hx-9,hy+8);c.lineTo(hx-11,hy-4);c.lineTo(hx-4,hy-12);c.lineTo(hx+8,hy-11);c.lineTo(hx+12,hy-2);c.lineTo(hx+9,hy+9);c.closePath();c.fill();
      c.save();glow(c,P0.ice||'#a0e0ff',10);for(const [x,h,a] of [[-8,14,-.5],[-2,20,-.15],[5,15,.2],[10,10,.5]]){c.save();c.translate(hx+x,hy-10);c.rotate(a);P(c,[-2.4,0,0,-h,2.4,0],'#e8f8ff');c.restore();}c.restore();
      c.save();glow(c,eye,10);P(c,[hx+2,hy-3,hx+9,hy-2,hx+8,hy,hx+2,hy-1],eye);P(c,[hx-5,hy-3,hx-1,hy-3,hx-1,hy-1,hx-5,hy-1],eye);c.restore();if(open)E(c,hx+4,hy+4,3,2.4,'#0a2030');}
    else{// mũ trùm
      c.fillStyle=fc(st,lg(c,hx-12,hy-14,hx+12,hy+12,[shade(A,.2),A,shade(A,-.45)]));c.beginPath();c.moveTo(hx-12,hy+10);c.quadraticCurveTo(hx-14,hy-8,hx-2,hy-16);c.quadraticCurveTo(hx+12,hy-18,hx+14,hy-2);c.lineTo(hx+11,hy+10);c.closePath();c.fill();
      E(c,hx+3,hy+1,7,8.4,'#05050a');c.save();glow(c,eye,8);E(c,hx+5,hy-1,1.9,.9,eye);E(c,hx,hy-1,1.7,.8,eye);c.restore();}
    // tay trước: vuốt dài / kiếm
    const ax=open?30:20,ay=open?-50:-44;S(c,[10,-62,18,-56,ax,ay],fc(st,A),4.6);
    if(P0.sword){c.save();c.translate(ax,ay);c.rotate(open?1.3:.5);if(P0.wglow)glow(c,P0.wglow,10);P(c,[-1.8,-2,1.8,-2,1.4,-38,0,-43,-1.4,-38],fc(st,P0.wcol||'#d0d8f0'));noGlow(c);L(c,[-5,-2,5,-2],'#3a3040',2);c.restore();}
    else for(const a of [-.5,0,.5])L(c,[ax,ay,ax+Math.cos(a)*9,ay+Math.sin(a)*9+2],fc(st,'#e8e0d0'),1.3);
    c.restore();
    if(P0.ice)orbit(c,st,{orbit:'shards',orbitN:4,ghost:P0.ice,c:P0.c},1,0,-50,30);
    if(P0.wisp)embers(c,t,50,90,P0.wisp,6+d,-10,24);
  }
  /* ================= BÒ CẠP — cao thiết kế 80 ================= */
  function scorpion(c,m,M,st,P0){const {t,open}=st,g=m.walk||0,mv=m.moving?1:0,[A,D,Lt,X]=P0.c,d=P0.d||0;
    E(c,-4,-1,46,6,'#00000026');
    const legs=back=>{for(let k=0;k<4;k++){const x0=-10+k*7,ph=k*1.2+(back?PI:0),s=Math.sin(g*2+ph)*mv*3,col=fc(st,back?shade(D,-.3):D);L(c,[x0,-14,x0-6+k*3+s,-26,x0-12+k*5+s,-1],col,2.4);}};
    legs(true);
    // đuôi cong
    const strike=open?1:0,sw=Math.sin(t*2)*3,tp=bez([-30,-18],[-62,-30],[-56,-80+sw],[-18+strike*34,-84+sw+strike*20],16);
    for(let i=0;i<tp.length;i++){const [x,y]=tp[i],r=8-i*.3;c.fillStyle=fc(st,lg(c,x,y-r,x,y+r,[shade(A,.25),A,shade(A,-.3)]));c.beginPath();c.ellipse(x,y,r,r*.85,0,0,PI2);c.fill();if(!st.fl&&i%2)L(c,[x-r*.6,y-r*.4,x+r*.6,y-r*.4],al(Lt,.6),.8);}
    {const [x,y]=tp[tp.length-1];c.save();c.translate(x,y);c.rotate(strike?.9:.3);E(c,0,0,6,5,fc(st,shade(A,-.1)));c.save();glow(c,X,10);P(c,[3,-2,14,4,4,4],fc(st,X));c.restore();c.restore();}
    // thân đốt
    for(let k=4;k>=0;k--){const x=-30+k*7;c.fillStyle=fc(st,lg(c,x,-26,x,-6,[shade(A,.2),A,shade(A,-.3)]));c.beginPath();c.ellipse(x,-16,8,12-k*.4,0,0,PI2);c.fill();if(!st.fl)L(c,[x-5,-22,x+5,-22],al(Lt,.6),.9);}
    c.fillStyle=fc(st,lg(c,6,-28,6,-6,[shade(A,.25),A,shade(A,-.3)]));c.beginPath();c.ellipse(8,-17,18,13,0,0,PI2);c.fill();
    if(!st.fl){L(c,[0,-24,14,-24],al(Lt,.7),1);E(c,14,-22,1.4,1.4,'#140808');E(c,17,-21,1.2,1.2,'#140808');if(d>=4)for(let k=0;k<4;k++)P(c,[-28+k*7,-25,-26+k*7,-31,-24+k*7,-25],fc(st,X));}
    legs(false);
    // càng
    for(const [ox,oy,back] of [[14,-18,true],[18,-14,false]]){const op=open?.5:Math.sin(t*3)*.12+.12,col=fc(st,back?shade(A,-.25):A);L(c,[ox,oy,ox+12,oy-8,ox+22,oy-6],col,4.4);
      c.save();c.translate(ox+24,oy-6);c.fillStyle=col;c.beginPath();c.ellipse(4,0,8,5.4,0,0,PI2);c.fill();c.rotate(-op);P(c,[8,-3,22,-6,14,0],col);c.rotate(op*2);P(c,[8,2,20,6,12,3],fc(st,shade(A,-.15)));c.restore();}
  }
  /* ================= VẬT THÊM CHO NGƯỜI ================= */
  // kiếm bay quanh người (Kiếm linh), bong bóng (Hải yêu), quầng hư không (Hư ảnh)
  const withFx=(fn,fx)=>(c,m,M,st,P0)=>{if(fx.back)fx.back(c,m,M,st,P0);fn(c,m,M,st,P0);if(fx.front)fx.front(c,m,M,st,P0);};
  const swordRing={back:(c,m,M,st,P0)=>orbit(c,st,{orbit:'swords',orbitN:4,wcol:'#d8ecff',wglow:'#80d8ff',c:P0.c},0,0,-58,34),front:(c,m,M,st,P0)=>orbit(c,st,{orbit:'swords',orbitN:4,wcol:'#d8ecff',wglow:'#80d8ff',c:P0.c},1,0,-58,34)};
  const bubbles={front:(c,m,M,st)=>{c.save();c.strokeStyle='#c8ecffcc';c.lineWidth=1;for(let i=0;i<7;i++){const ph=(st.t*.4+hr(i+11))%1;c.globalAlpha=1-ph;c.beginPath();c.arc((hr(i+12)-.5)*50,-10-ph*100,1.6+hr(i+13)*2.4,0,PI2);c.stroke();}c.restore();}};
  const holyHalo={back:(c,m,M,st)=>{c.save();glow(c,'#fff0a0',10);ring(c,2,-86,13,4,'#ffe890',2);c.restore();embers(c,st.t,60,100,'#fff4c0',5,-10,33);}};
  /* ================= DANH SÁCH: quái (x2 mỗi vùng) và boss, theo vùng ================= */
  // Thiên Đình (d0)
  reg('thien-tuong',withFx(warlord,holyHalo),{c:['#f0e0a0','#c0a050','#fffaf0','#ffd040'],skin:'#f0dcc0',helm:'plume',weapon:'spear',wcol:'#fff4d0',wglow:'#ffe080',cape:'#fff6e0',lion:1,emblem:'dragon'},88,112);
  reg('than-thu',beast,{kind:'lion',c:['#e8c060','#a08030','#fff0b0','#ff8040'],mane:'#ff9a40',eye:'#ff4040',wings:'feather',wcol:'#fff4d0',horn:'#fff0a0',fire:'#ffb040',d:0},84,80);
  reg('hac-thien-ma',demon,{c:['#2a1040','#0a0414','#8a5ab0','#d0a040'],skin:'#3a1a3a',eye:'#ff2060',head:'demon',horns:'long',hornCol:'#0a0408',wings:'bat',wingCol:'#2a0a30',weapon:'trident',wcol:'#d8c8e8',wglow:'#ff2060',halo:'#d0a040',haloType:'cracked',cape:'#3a0a2a',aura:'#ff2060',runes:'#c040ff',d:2},178,140);
  // Hư Không Giới (d1)
  reg('hu-anh',wraith,{c:['#5a5090','#2a2458','#c0b8ff'],eye:'#ffffff',sword:1,wcol:'#e0d8ff',wglow:'#a090ff',alpha:.85,wisp:'#c0b0ff',d:1},88,90);
  reg('tinh-thu',beast,{kind:'hound',c:['#2a2460','#120e30','#7a70c0','#c0b0ff'],eye:'#ffffff',crystal:'#c0b0ff',stars:1,horns:0,spikes:1,d:1},86,80);
  reg('hu-khong-vuong',voidKing,{c:['#3a3070','#140e34','#c8c0ff'],ghost:'#c0b0ff',eye:'#ffffff',orbit:'shards',orbitN:7,runes:'#a090ff',d:1},190,150);
  // Huyết Hải (d2)
  reg('huyet-ngu',fishKing,{c:['#b02828','#5a0a10','#f0a0a0','#ff6040'],eye:'#ffff60'},84,100);
  reg('xich-giao',dragon,{c:['#a02020','#5a0808','#ff9060','#ffd040'],eye:'#ffff80',mane:'#ff6020',whisker:'#ffd0a0',breath:'#ff6040',horn:'#2a0a0a',thick:9,amp:9},88,100);
  reg('huyet-ma-long',dragon,{c:['#7a0a10','#300206','#ff6050','#e8d8c0'],eye:'#ffff60',mane:'#c01020',whisker:'#ff8080',wing:1,breath:'#ff2020',horn:'#e8dcc4',aura:'#ff2020',thick:14,amp:15,finK:2.2,fin:'#e8dcc4',drip:'#c00010',fire:1},150,100,196);
  // Cổ Chiến Trường (d3)
  reg('tu-binh',warlord,{c:['#4a4440','#2a2420','#8a8070','#9a8050'],skin:'#a09080',skull:1,eye:'#ff6040',helm:'horn',weapon:'spear',wcol:'#a0a4a8',pole:'#3a2a1a',cape:'#3a2a20',ghost:1},92,112);
  reg('chien-ma-ma',beast,{kind:'horse',c:['#2a2420','#120e0a','#6a5a48','#c0a060'],mane:'#ff6040',eye:'#ff3020',fire:'#ff5020',armor:'#4a4038',ghost:1,d:3},92,80);
  reg('nguyen-soai-ma',demon,{c:['#3a2a28','#140c0a','#8a6a5a','#c8a040'],skin:'#5a4a40',eye:'#ff3020',head:'skull',horns:'bull',hornCol:'#2a1a10',weapon:'saber',wcol:'#d8d0c0',wglow:'#ff4020',cape:'#4a1010',banners:4,banner:'#6a0a0a',aura:'#ff6040',embers:'#ff8040',d:3,bulk:1.1},196,140);
  // Lưu Sa Hà (d4)
  reg('sa-yeu',wraith,{c:['#c8a060','#8a6a30','#f0d8a0'],eye:'#ff4020',sand:'#e0c080',face:'skull',d:4},88,90);
  reg('bo-cap-vang',scorpion,{c:['#e0b030','#8a6010','#fff080','#ff6020'],d:4},74,80);
  reg('sa-ha-quai',demon,{c:['#5a4a3a','#2a2018','#a08a6a','#d0a030'],skin:'#5a7080',arm:'#5a7080',eye:'#ffe040',head:'ogre',hair:'#c03010',skulls:9,weapon:'spade',wcol:'#d8dce0',pole:'#3a2414',sand:'#e0c080',spike:'#e0d8c0',d:4,bulk:1.25},206,140);
  // Võ Đài Thập Tướng (d5)
  reg('vo-si-ma',warlord,{c:['#6a2a1a','#3a1008','#c08a6a','#e0b040'],skin:'#a88070',eye:'#ff4040',eyeGlow:1,hair:'#1a1010',weapon:'sword',wcol:'#e0e4e8',wglow:'#ff6040',beard:'#1a1010',ghost:1},92,112);
  reg('su-tu-da',beast,{kind:'lion',c:['#9a9488','#5a564e','#d0ccc0','#e0b040'],mane:'#8a847a',eye:'#ff4040',stone:1,horn:0,spikes:0,d:5},92,80);
  reg('thiet-giap-tuong',demon,{c:['#5a5a64','#24242c','#a8a8b8','#d0a040'],skin:'#4a4a52',eye:'#ffb020',head:'visor',weapon:'mace',wcol:'#8a8a94',wglow:'#ff8020',chains:1,crack:'#ff8020',embers:'#ffb060',spike:'#c8ccd4',d:5,bulk:1.3},214,140);
  // Vạn Kiếm Sơn (d6)
  reg('kiem-linh',withFx(warlord,swordRing),{c:['#8aa8c8','#405870','#e8f4ff','#ffffff'],skin:'#d0e0f0',eye:'#80e0ff',eyeGlow:1,helm:'none',hair:'#c8e0f0',weapon:'sword',wcol:'#e8f4ff',wglow:'#80e0ff',ghost:1,fx:'ice'},94,112);
  reg('thach-ho',beast,{kind:'tiger',c:['#8a8a88','#4a4a48','#c8c8c0','#ff8040'],eye:'#ff8040',stone:1,lava:'#ff7020',d:6},94,80);
  reg('kiem-ma',demon,{c:['#22303e','#0a1018','#7090b0','#a0c8e0'],skin:'#405060',eye:'#80e0ff',head:'hood',wings:'blades',weapon:'bigsword',wcol:'#d8ecff',wglow:'#80e0ff',gem:'#80e0ff',orbit:'swords',orbitN:8,cape:'#14202c',aura:'#80e0ff',runes:'#80e0ff',d:6},222,140);
  // Băng Hỏa Lưỡng Giới (d7)
  reg('bang-phach',wraith,{c:['#a0d8f8','#5a98c8','#ffffff'],eye:'#205080',face:'ice',ice:'#c0ecff',alpha:.9,wisp:'#e0f8ff',d:7},94,90);
  reg('hoa-diem-thu',beast,{kind:'hound',c:['#7a2a10','#3a0a04','#c86030','#ffd040'],eye:'#ffff60',lava:'#ffb020',fire:'#ff6020',spikes:1,horns:2,hornCol:'#2a0a04',tails:1,d:7},96,80);
  reg('song-dau-long',hydra,{c:['#3a3a5a','#141428','#9aa0c0','#e0e0f0'],heads:2,neck:74,neckR:13,headS:1.25,wing:1,wingCol:'#2a2440',aura:'#ffb060',embers:'#ffd0a0',d:7,
    headCols:[{c:['#4a7ab0','#1a3a6a','#d8f0ff','#ffffff'],eye:'#e0ffff',horn:'#e8f8ff',breath:'#a0e8ff'},{c:['#b03a20','#5a1008','#ffc070','#ffd040'],eye:'#ffff60',horn:'#2a0a04',breath:'#ff8030'}]},238,140);
  // Cửu U Minh Phủ (d8)
  reg('u-hon',wraith,{c:['#5aa080','#1a5038','#c0ffe0'],eye:'#80ffb0',face:'skull',chains:1,alpha:.82,wisp:'#80ffb0',d:8},96,90);
  reg('quy-sai',warlord,{c:['#2a2a3a','#14141e','#7a7a8a','#80ffb0'],skin:'#4a5a50',eye:'#80ffb0',eyeGlow:1,helm:'horn',weapon:'mace',wcol:'#5a5a64',wglow:'#80ffb0',cape:'#141a18',bulk:1.15,beard:'#0a100c'},100,112);
  reg('minh-vuong',demon,{c:['#1a1a2a','#08080e','#5a5a7a','#d0b040'],skin:'#4a6a58',eye:'#80ffb0',head:'mian',beard:'#0a0a10',robe:1,robeFaces:1,ghost:'#a0ffc8',weapon:'skullstaff',wglow:'#80ffb0',pole:'#1a1410',orbit:'ghosts',orbitN:7,chains:1,cape:'#0a1410',halo:'#80ffb0',haloType:'wheel',haloR:34,aura:'#80ffb0',runes:'#80ffb0',d:8,bulk:1.25},248,140);
  // Hỗn Độn Hải (d9)
  reg('hai-yeu',withFx(warlord,bubbles),{c:['#2a6a8a','#123a5a','#a0d8f0','#ffe060'],skin:'#a0c8e0',eye:'#ffe060',eyeGlow:1,helm:'crown',weapon:'spear',wcol:'#e0f4ff',wglow:'#80d0ff',fem:1,robe:1,hair:'#1a5a4a',cape:'#1a4a6a'},100,112);
  reg('thon-hai-thu',serpent,{c:['#1a3a5a','#0a1a30','#6aa0d0','#ffe060'],eye:'#ffe060',hood:1,horn:'#e0e8f0'},104,100);
  reg('cuu-dau-xa',hydra,{c:['#1a4030','#08180e','#70b090','#ff4060'],heads:9,neck:82,neckR:10,headS:.95,spine:'#0e2a1e',spines:3,eye:'#ff2040',horn:'#e8e0c8',breath:'#60ffc0',drip:'#80ff60',aura:'#60ffc0',runes:'#60ffc0',embers:'#a0ffc0',d:9},266,140);
  // Hỗn Nguyên Điện (d10)
  reg('hon-nguyen-ve',warlord,{c:['#3a2a3a','#1a101a','#a080a0','#e0b040'],skin:'#a08890',eye:'#ffd040',eyeGlow:1,helm:'dragon',weapon:'halberd',wcol:'#e8d8a0',wglow:'#ffd040',pole:'#1a0a14',cape:'#4a0a2a',bulk:1.2,emblem:'dragon',lion:1},106,112);
  reg('ma-than-thu',beast,{kind:'hound',c:['#3a1a30','#14060f','#8a4a7a','#ffd040'],eye:'#ffd040',wings:'bat',spikes:1,horns:4,hornCol:'#0a0408',tails:2,fire:'#ff60c0',lava:'#ff60c0',d:10},104,80);
  reg('hon-nguyen-ma-to',mato,{c:['#2a0a20','#0a0208','#7a3a60','#e0b040'],skin:'#4a1a40',eye:'#ffd040',ghost:'#ff60c0'},300,215);
})();
