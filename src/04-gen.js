/* ================= BỘ SINH HÌNH THEO THAM SỐ (dùng cho các gói bản đồ từ v10.2) =================
   Gói bản đồ mới không vẽ tay từng con quái, từng ô nền nữa: chỉ khai báo tham số (dáng, màu, cỡ, chi tiết),
   bộ sinh ở đây vẽ ra. Một gói bản đồ chỉ còn vài trăm byte hình vẽ, tải rất nhanh.
     LH_ART.gen({ theme:{ten:{...}}, obj:{ten:{...}}, mon:{ma:{...}}, npc:{vai:{...}}, sky:{ten:{...}} })
   Dáng quái (body): quad (thú 4 chân) · bird (chim) · snake (rắn) · human (người, ma, lính) · blob (hồn, nhầy) · bug (cua, bọ) · golem (đá chồng) · dragon (rồng)
   Vai NPC vẽ bằng bộ phận có sẵn của game (đầu, nón, khăn, chân…) do game truyền vào H. */
(()=>{
  const A=LH_ART,K=A.K,{ell,line,poly,rr,shade,hash,mix,noise,PI2}=K;
  A.npc=A.npc||{};
  // ---------- nền ----------
  // spec: {g:[màu1,màu2] cỏ/đất · d:'grass|bamboo|moss|ash|ice|brick|cloud|bone' chi tiết · r:[mặt trên, vách, tối] đá · w:[nông,sâu] nước · p:màu đường · s:màu ô đặc biệt (6) · sd:màu ô khô (5)}
  function theme(S){
    const g0=S.g[0],g1=S.g[1],R=S.r||['#8a8a86','#5e5e5a','#3e3e3a'],P=S.p||mix(g1,'#7a5a3a',.6),SD=S.sd||mix(g0,'#b89a5a',.45),SP=S.s||mix(g1,'#ff8040',.5);
    const detail={
      grass(c,X,Y,h){for(let i=0;i<3;i++){const px=X+8+hash(X,Y,i)*32,py=Y+10+hash(X,Y,i+5)*30;line(c,[px,py,px+2,py-7],shade(g1,-.2),1.2);}},
      bamboo(c,X,Y,h){if(h>.55)for(let i=0;i<2;i++){const px=X+10+hash(X,Y,i)*28,py=Y+12+hash(X,Y,i+5)*26;line(c,[px,py,px+5,py-9],shade(g1,-.3),1.3);line(c,[px+5,py-9,px+2,py-15],shade(g1,-.3),1.3);}},
      moss(c,X,Y,h){ell(c,X+12+h*20,Y+14+hash(X,Y,2)*18,7+h*5,4,shade(g1,.12));if(h>.7)ell(c,X+30,Y+34,4,2.5,shade(g0,-.18));},
      ash(c,X,Y,h){c.fillStyle=shade(g1,-.35);for(let i=0;i<3;i++)c.fillRect(X+hash(X,Y,i)*44,Y+hash(X,Y,i+7)*44,2,2);if(h>.8)ell(c,X+24,Y+26,9,3,'#ff6a2a22');},
      ice(c,X,Y,h){if(h>.6){c.strokeStyle='#ffffff88';c.lineWidth=1;c.beginPath();c.moveTo(X+8,Y+14);c.lineTo(X+22,Y+20);c.lineTo(X+38,Y+12);c.stroke();}},
      brick(c,X,Y,h){c.strokeStyle=shade(g1,-.18);c.lineWidth=1;c.strokeRect(X+.5,Y+.5,T0-1,T0-1);c.beginPath();c.moveTo(X,Y+T0/2);c.lineTo(X+T0,Y+T0/2);c.moveTo(X+T0/2,Y);c.lineTo(X+T0/2,Y+T0/2);c.stroke();},
      cloud(c,X,Y,h){ell(c,X+14+h*20,Y+20+hash(X,Y,3)*10,12,5,'#ffffff55');},
      bone(c,X,Y,h){if(h>.78){line(c,[X+10,Y+30,X+24,Y+24],'#d8d2c4',2);ell(c,X+10,Y+30,2.5,2.5,'#d8d2c4');ell(c,X+24,Y+24,2.5,2.5,'#d8d2c4');}}
    }[S.d||'grass'];
    let T0=48;
    function tile(c,x,y,v,n,T,G){
      T0=T;const X=x*T,Y=y*T,h=hash(x,y);
      if(v===1){ // chắn: mặt trên, mép sáng trái / tối phải, vách đứng dưới
        c.fillStyle=mix(R[0],shade(R[0],-.18),noise(x,y,4,2));c.fillRect(X,Y,T,T);
        if(h>.7){ell(c,X+12+h*20,Y+14+hash(x,y,9)*16,7,4,shade(R[0],.18));}
        if(G(x-1,y)!==1){c.fillStyle=shade(R[0],.25);c.fillRect(X,Y,4,T);}
        if(G(x+1,y)!==1){c.fillStyle=R[2];c.fillRect(X+T-4,Y,4,T);}
        if(G(x,y-1)!==1){c.fillStyle=shade(R[0],.35);c.fillRect(X,Y,T,3);}
        if(G(x,y+1)!==1){const top=Y+T-24;c.fillStyle=R[1];c.beginPath();c.moveTo(X,Y+T);for(let k=0;k<=6;k++)c.lineTo(X+k*T/6,top+hash(x*6+k,y,22)*7);c.lineTo(X+T,Y+T);c.fill();c.fillStyle=R[2];for(let k=0;k<3;k++)c.fillRect(X+6+k*15+(h*5|0),top+8,2,15);ell(c,X+T/2,Y+T+3,T*.55,5,'#00000022');}
        return;
      }
      const k=noise(x,y,5,1);c.fillStyle=mix(g0,g1,k);c.fillRect(X,Y,T,T);
      if(v===4){c.fillStyle=mix(P,shade(P,-.12),hash(x,y,4));c.fillRect(X,Y,T,T);for(let i=0;i<3;i++)ell(c,X+6+hash(x,y,i)*36,Y+6+hash(x,y,i+9)*36,2,1.4,shade(P,-.3));return;}
      if(v===5){c.fillStyle=mix(SD,shade(SD,-.1),k);c.fillRect(X,Y,T,T);}
      if(v===6){c.fillStyle=mix(SP,shade(SP,.15),hash(x,y,6));c.fillRect(X,Y,T,T);if(S.sg){c.save();c.globalAlpha=.35+hash(x,y,7)*.3;ell(c,X+T/2,Y+T/2,T*.55,T*.4,S.sg);c.restore();}return;}
      detail(c,X,Y,h);
    }
    function over(c,def,T,G){const {w,h}=def,W=S.w||['#7fb4c9','#4f8aa5'];K.blob(c,G,w,h,T,2,.95,W[0]);K.blob(c,G,w,h,T,2,.7,W[1]);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(G(x,y)===2&&hash(x,y,10)>.7){c.fillStyle='#ffffff66';c.fillRect(x*T+8,y*T+10,14,2);}}
    return {tile,over,ripple:S.ripple||'#ffffff55'};
  }
  // ---------- vật trang trí ----------
  // spec: {base:'tree|rock|pillar|lantern|wall|gate|roof|flag|torch|shrine|bones|crystal|drum|tent|rack|barrel|crate|palisade|brazier|dummy|banner|cart|grass|stones', c:[màu…], s:cỡ, shape:'round|cone|palm|bamboo|dead'}
  const shadow=(c,x,y,rx,ry)=>ell(c,x+rx*.25,y+3,rx,ry,'#00000026');
  const OBJ={
    tree(c,o,t,S){const x=o.x,y=o.y+4,s=(S.s||1)*(.85+(o.seed%4)*.1),sw=Math.sin(t*.9+o.seed)*1.4,[trunk,leaf,leaf2]=S.c;shadow(c,x,y,20*s,6*s);
      if(S.shape==='bamboo'){for(let k=-1;k<=1;k++){const bx=x+k*7*s;line(c,[bx,y,bx+sw*.6,y-70*s-k*8*s],leaf,4*s);for(let j=1;j<5;j++)line(c,[bx-3*s,y-j*15*s,bx+3*s,y-j*15*s],shade(leaf,-.3),1.2);for(let j=2;j<5;j++){line(c,[bx,y-j*15*s,bx+12*s+sw,y-j*15*s-10*s],leaf2||shade(leaf,.2),2);line(c,[bx,y-j*15*s-6*s,bx-11*s+sw,y-j*15*s-12*s],leaf2||shade(leaf,.2),2);}}return;}
      if(S.shape==='dead'){line(c,[x,y,x+sw,y-48*s],trunk,6*s);line(c,[x+sw*.6,y-30*s,x+16*s,y-50*s],trunk,3*s);line(c,[x+sw*.4,y-22*s,x-14*s,y-40*s],trunk,3*s);line(c,[x+16*s,y-50*s,x+22*s,y-62*s],trunk,2*s);return;}
      if(S.shape==='palm'){line(c,[x,y,x+sw,y-60*s],trunk,6*s);for(let k=0;k<6;k++){const a=k/6*PI2+t*.15;const ex=x+sw+Math.cos(a)*26*s,ey=y-60*s+Math.abs(Math.sin(a))*14*s-4;c.strokeStyle=k%2?leaf:shade(leaf,.15);c.lineWidth=5*s;c.beginPath();c.moveTo(x+sw,y-60*s);c.quadraticCurveTo(x+sw+Math.cos(a)*16*s,y-70*s,ex,ey);c.stroke();}return;}
      line(c,[x,y,x+sw*.3,y-26*s],trunk,7*s);
      if(S.shape==='cone'){for(let k=0;k<3;k++){const by=y-16*s-k*16*s,wd=(24-k*5)*s;poly(c,[x-wd,by,x+sw*k*.5,by-26*s,x+wd,by],k%2?leaf:shade(leaf,-.12));poly(c,[x+sw*k*.5,by-26*s,x+wd,by,x+wd*.2,by],shade(leaf,-.3));}return;}
      ell(c,x+sw,y-44*s,24*s,20*s,shade(leaf,-.2));ell(c,x+sw-4*s,y-50*s,18*s,16*s,leaf);ell(c,x+sw+8*s,y-40*s,14*s,12*s,leaf);ell(c,x+sw-8*s,y-54*s,8*s,6*s,leaf2||shade(leaf,.25));},
    rock(c,o,t,S){const x=o.x,y=o.y,s=(S.s||1)*(.8+(o.seed%5)*.12),[a,b]=S.c;shadow(c,x,y,18*s,6*s);poly(c,[x-18*s,y,x-14*s,y-14*s,x-2*s,y-22*s,x+12*s,y-18*s,x+18*s,y-4*s,x+14*s,y],a);poly(c,[x-14*s,y-14*s,x-2*s,y-22*s,x+12*s,y-18*s,x+2*s,y-10*s],shade(a,.2));line(c,[x+4*s,y-10*s,x+14*s,y-2*s],b,1.5);},
    pillar(c,o,t,S){const x=o.x,y=o.y,s=S.s||1,[a,b]=S.c,h=70*s;shadow(c,x,y,12*s,5*s);rr(c,x-7*s,y-h,14*s,h,2,a);c.fillStyle=shade(a,-.3);c.fillRect(x+2*s,y-h,5*s,h);rr(c,x-11*s,y-h-6*s,22*s,8*s,2,b);rr(c,x-11*s,y-6*s,22*s,8*s,2,b);if(S.broken)poly(c,[x-7*s,y-h+6,x+7*s,y-h-8,x+7*s,y-h+2],a);},
    lantern(c,o,t,S){const x=o.x,y=o.y,s=S.s||1,[pole,paper]=S.c,g=.7+Math.sin(t*3+o.seed)*.15;line(c,[x,y,x,y-46*s],pole,3*s);line(c,[x,y-46*s,x+14*s,y-40*s],pole,2.5*s);c.save();c.shadowColor=paper;c.shadowBlur=14*g;ell(c,x+14*s,y-30*s,6*s,8*s,paper);c.restore();line(c,[x+14*s,y-22*s,x+14*s,y-17*s],'#e8c050',1.5);},
    torch(c,o,t,S){const x=o.x,y=o.y,[pole,fire]=S.c,f=Math.sin(t*9+o.seed);line(c,[x,y,x,y-30],pole,3);c.save();c.shadowColor=fire;c.shadowBlur=12;ell(c,x,y-36,5+f,8+f*1.5,fire);ell(c,x,y-38,2.5,4,'#fff3b0');c.restore();},
    wall(c,o,t,S){const x=o.x-((o.w||1)*48)/2,y=o.y,w=(o.w||1)*48,[a,b,c2]=S.c;c.fillStyle=a;c.fillRect(x,y-54,w,54);c.fillStyle=shade(a,-.25);c.fillRect(x,y-8,w,8);c.strokeStyle=b;c.lineWidth=1;for(let yy=y-50;yy<y-8;yy+=10){c.beginPath();c.moveTo(x,yy);c.lineTo(x+w,yy);c.stroke();}for(let xx=x;xx<x+w;xx+=16){c.fillStyle=c2||shade(a,.3);c.fillRect(xx+2,y-64,10,10);}},
    gate(c,o,t,S){const x=o.x,y=o.y,w=(o.w||3)*48,[a,b,roof]=S.c;c.fillStyle=a;c.fillRect(x-w/2,y-60,w,60);c.fillStyle='#1a1410';c.fillRect(x-w/4,y-40,w/2,40);c.beginPath();c.arc(x,y-40,w/4,Math.PI,0);c.fill();poly(c,[x-w/2-10,y-60,x+w/2+10,y-60,x+w/2-6,y-78,x-w/2+6,y-78],roof||'#6b2d1e');poly(c,[x-w/2-14,y-80,x+w/2+14,y-80,x+w/2,y-96,x-w/2,y-96],roof||'#6b2d1e');line(c,[x-w/2-14,y-80,x-w/2-22,y-88],roof||'#6b2d1e',4);line(c,[x+w/2+14,y-80,x+w/2+22,y-88],roof||'#6b2d1e',4);c.fillStyle=b;c.fillRect(x-14,y-74,28,10);},
    roof(c,o,t,S){const w=(o.w||3)*48,h=(o.h||2)*48,x=o.x-w/2,y=o.y,[wall,roof,trim]=S.c;shadow(c,o.x,y,w/2,8);c.fillStyle=wall;c.fillRect(x+6,y-h+20,w-12,h-20);c.fillStyle=shade(wall,-.4);c.fillRect(o.x-10,y-30,20,30);c.strokeStyle=trim;c.lineWidth=2;c.strokeRect(x+10,y-h+34,14,14);c.strokeRect(x+w-24,y-h+34,14,14);poly(c,[x-8,y-h+22,x+w+8,y-h+22,x+w-10,y-h-14,x+10,y-h-14],roof);poly(c,[x-8,y-h+22,x-16,y-h+12,x+6,y-h+10],roof);poly(c,[x+w+8,y-h+22,x+w+16,y-h+12,x+w-6,y-h+10],roof);c.strokeStyle=shade(roof,-.3);c.lineWidth=1;for(let k=x+10;k<x+w-10;k+=9){c.beginPath();c.moveTo(k,y-h-12);c.lineTo(k-4,y-h+20);c.stroke();}line(c,[x+10,y-h-14,x+w-10,y-h-14],trim,2);},
    flag(c,o,t,S){const x=o.x,y=o.y,[pole,cloth,em]=S.c,w=Math.sin(t*2.2+o.seed)*4;line(c,[x,y,x,y-70],pole,3);c.fillStyle=cloth;c.beginPath();c.moveTo(x,y-70);c.quadraticCurveTo(x+16,y-64+w,x+30,y-66+w);c.lineTo(x+30,y-46+w);c.quadraticCurveTo(x+16,y-44+w,x,y-48);c.fill();if(em)ell(c,x+16,y-57+w,5,5,em);},
    shrine(c,o,t,S){const x=o.x,y=o.y,[stone,roof]=S.c;shadow(c,x,y,20,6);rr(c,x-14,y-30,28,30,2,stone);c.fillStyle='#1b1512';c.fillRect(x-7,y-22,14,16);poly(c,[x-22,y-30,x+22,y-30,x+16,y-44,x-16,y-44],roof);line(c,[x-22,y-30,x-26,y-36],roof,3);line(c,[x+22,y-30,x+26,y-36],roof,3);const g=.5+Math.sin(t*4)*.3;c.save();c.globalAlpha=g;ell(c,x,y-15,3,4,'#ffb050');c.restore();},
    bones(c,o,t,S){const x=o.x,y=o.y,[b]=S.c;ell(c,x-6,y-8,9,8,b);c.fillStyle='#1a1410';c.fillRect(x-9,y-10,4,4);c.fillRect(x-2,y-10,4,4);for(let k=0;k<4;k++)line(c,[x+6+k*6,y-16+k*2,x+10+k*6,y+1],b,2.2);line(c,[x+4,y-14,x+30,y-8],b,3);},
    crystal(c,o,t,S){const x=o.x,y=o.y,[a,g]=S.c,p=.6+Math.sin(t*2+o.seed)*.2;c.save();c.shadowColor=g;c.shadowBlur=16*p;for(const [dx,h,w] of [[-8,28,6],[2,42,8],[12,24,5]])poly(c,[x+dx-w,y,x+dx,y-h,x+dx+w,y],a);c.restore();for(const [dx,h,w] of [[-8,28,6],[2,42,8]])poly(c,[x+dx-w*.5,y-h*.3,x+dx,y-h,x+dx+w*.3,y-h*.25],shade(a,.35));},
    drum(c,o,t,S){const x=o.x,y=o.y,[body,skin,band]=S.c;shadow(c,x,y,22,7);for(const dx of [-12,12])line(c,[x+dx,y,x+dx*1.4,y-40],'#4a3220',3);ell(c,x,y-36,22,10,shade(body,-.2));c.fillStyle=body;c.fillRect(x-22,y-60,44,24);ell(c,x,y-60,22,10,skin);c.strokeStyle=band;c.lineWidth=2;c.beginPath();c.ellipse(x,y-60,22,10,0,0,PI2);c.stroke();for(let k=0;k<8;k++)ell(c,x-19+k*5.4,y-50,1.6,1.6,band);},
    // v10.49: đồ trang trí doanh trại, chiến trường: giá binh khí, thùng, hòm, rào nhọn, vạc lửa, người rơm, phướn, xe lương, cỏ, đá vụn
    rack(c,o,t,S){const x=o.x,y=o.y,[wood,metal]=S.c;shadow(c,x,y,26,7);line(c,[x-22,y,x-22,y-44],wood,4);line(c,[x+22,y,x+22,y-44],wood,4);line(c,[x-26,y-40,x+26,y-40],wood,3);line(c,[x-24,y-12,x+24,y-12],wood,3);
      for(let k=0;k<5;k++){const bx=x-16+k*8;line(c,[bx,y-8,bx+2,y-62],shade(wood,.15),2);if(k%2)poly(c,[bx-1,y-62,bx+2,y-74,bx+5,y-62],metal);else{line(c,[bx+2,y-62,bx+2,y-70],metal,3);}}},
    barrel(c,o,t,S){const x=o.x,y=o.y,[wood,band]=S.c,n=o.n||1;for(let k=0;k<n;k++){const bx=x+(k-(n-1)/2)*22,by=y-(k===2?18:0);shadow(c,bx,by,12,4);rr(c,bx-11,by-28,22,28,6,wood);c.fillStyle=shade(wood,-.25);c.fillRect(bx+3,by-26,6,24);line(c,[bx-11,by-8,bx+11,by-8],band,2);line(c,[bx-11,by-21,bx+11,by-21],band,2);ell(c,bx,by-28,11,4,shade(wood,.2));}},
    crate(c,o,t,S){const x=o.x,y=o.y,[wood,dark]=S.c;shadow(c,x,y,22,6);const box=(bx,by,w)=>{c.fillStyle=wood;c.fillRect(bx-w/2,by-w,w,w);c.strokeStyle=dark;c.lineWidth=2;c.strokeRect(bx-w/2+1,by-w+1,w-2,w-2);line(c,[bx-w/2+2,by-2,bx+w/2-2,by-w+2],dark,2);poly(c,[bx-w/2,by-w,bx-w/2+6,by-w-6,bx+w/2+6,by-w-6,bx+w/2,by-w],shade(wood,.2));poly(c,[bx+w/2,by-w,bx+w/2+6,by-w-6,bx+w/2+6,by-6,bx+w/2,by],shade(wood,-.25));};
      box(x-8,y,24);box(x+14,y,20);if(o.seed%2)box(x+2,y-24,18);},
    palisade(c,o,t,S){const w=(o.w||2)*48,x0=o.x-w/2,y=o.y,[wood]=S.c;shadow(c,o.x,y,w/2,6);for(let xx=x0+5;xx<x0+w;xx+=10){const h=46+((xx*7)%9);rr(c,xx-4.5,y-h,9,h,2,(xx/10|0)%2?wood:shade(wood,-.12));poly(c,[xx-4.5,y-h,xx,y-h-9,xx+4.5,y-h],shade(wood,.15));}line(c,[x0,y-14,x0+w,y-14],shade(wood,-.35),3);line(c,[x0,y-34,x0+w,y-34],shade(wood,-.35),3);},
    brazier(c,o,t,S){const x=o.x,y=o.y,[metal,fire]=S.c,f=Math.sin(t*8+o.seed);shadow(c,x,y,16,5);for(const d of [-1,0,1])line(c,[x+d*10,y,x+d*5,y-22],metal,3);poly(c,[x-16,y-22,x+16,y-22,x+11,y-32,x-11,y-32],metal);c.save();c.shadowColor=fire;c.shadowBlur=18;
      poly(c,[x-11,y-32,x-7,y-48-f*4,x-2,y-38,x+2,y-54+f*3,x+6,y-40,x+9,y-50-f*2,x+11,y-32],fire);ell(c,x,y-36,6,4,'#fff0a0');c.restore();},
    dummy(c,o,t,S){const x=o.x,y=o.y,[straw,cloth]=S.c,w=Math.sin(t*1.5+o.seed)*1.2;shadow(c,x,y,12,4);line(c,[x,y,x,y-56],'#5a3a1e',4);line(c,[x-20,y-42,x+20,y-42+w],'#5a3a1e',3);ell(c,x,y-34,11,14,straw);c.fillStyle=cloth;c.fillRect(x-11,y-34,22,8);ell(c,x,y-58,9,9,straw);line(c,[x-4,y-60,x+4,y-56],'#3a2a1a',1.5);line(c,[x+4,y-60,x-4,y-56],'#3a2a1a',1.5);for(let k=-2;k<=2;k++)line(c,[x+k*4,y-22,x+k*5,y-14],shade(straw,-.2),1.5);},
    banner(c,o,t,S){const x=o.x,y=o.y,[pole,cloth,em]=S.c,w=Math.sin(t*1.8+o.seed)*3;line(c,[x,y,x,y-96],pole,3);line(c,[x-2,y-92,x+18,y-92],pole,2);c.fillStyle=cloth;c.beginPath();c.moveTo(x+2,y-92);c.lineTo(x+18,y-92);c.quadraticCurveTo(x+20+w,y-70,x+18+w*1.3,y-44);c.lineTo(x+10+w,y-50);c.lineTo(x+2+w*1.1,y-44);c.quadraticCurveTo(x+4+w*.5,y-70,x+2,y-92);c.fill();
      if(em){ell(c,x+10+w*.4,y-78,4,4,em);ell(c,x+10+w*.7,y-66,3,3,em);}ell(c,x,y-98,3,3,'#e0b040');},
    cart(c,o,t,S){const x=o.x,y=o.y,[wood,cargo]=S.c;shadow(c,x,y,34,8);line(c,[x+24,y-14,x+50,y-6],wood,3);c.fillStyle=wood;c.fillRect(x-30,y-28,56,12);for(let k=0;k<3;k++)ell(c,x-18+k*16,y-34-(k%2)*4,10,8,k%2?shade(cargo,-.1):cargo);line(c,[x-24,y-36,x+18,y-38],shade(cargo,-.4),1.5);
      for(const wx of [-18,14]){ell(c,x+wx,y-8,10,10,'#3a2a1a');ell(c,x+wx,y-8,7,7,shade(wood,.1));line(c,[x+wx-7,y-8,x+wx+7,y-8],'#3a2a1a',1.5);line(c,[x+wx,y-15,x+wx,y-1],'#3a2a1a',1.5);}},
    grass(c,o,t,S){const x=o.x,y=o.y,[a,b]=S.c,sw=Math.sin(t*1.3+o.seed)*2;for(let k=-3;k<=3;k++)line(c,[x+k*3,y,x+k*4.5+sw,y-10-Math.abs((k*5+o.seed)%7)],k%2?a:(b||shade(a,.2)),1.6);if(S.flower)for(let k=0;k<3;k++)ell(c,x-6+k*6+sw,y-14-(k%2)*3,2.2,2.2,S.flower);},
    stones(c,o,t,S){const x=o.x,y=o.y,[a]=S.c;for(let k=0;k<4;k++){const sx=x-12+k*8+((o.seed*k)%5),sy=y-((k*3)%5);ell(c,sx,sy,4+(k%2)*2,3+(k%2),k%2?a:shade(a,-.18));ell(c,sx-1,sy-1,2,1.4,shade(a,.25));}},
    tent(c,o,t,S){const x=o.x,y=o.y,[cloth,pole]=S.c;shadow(c,x,y,34,9);poly(c,[x-34,y,x,y-52,x+34,y],cloth);poly(c,[x-8,y,x,y-20,x+8,y],'#1a1410');line(c,[x,y-52,x,y-62],pole,2);poly(c,[x-34,y,x,y-52,x-10,y],shade(cloth,-.2));}
  };
  // ---------- quái: dáng tham số ----------
  // spec: {body, s:cỡ, c:[chính, tối, sáng, điểm nhấn], eye:màu mắt, horn, wing, tail, spikes, glow, see:true (trong suốt), legs}
  const MON={
    quad(c,m,M,st,S){const {col,g,open,t}=st,s=S.s||1,[A0,D,L,X]=S.c,mv=m.moving?1:0,leg=(x,ph,len,w)=>line(c,[x*s,-len*s,(x+Math.sin(g+ph)*6*mv)*s,0],col(D),w*s);
      leg(-14,0,20,5);leg(12,Math.PI,20,5);ell(c,0,-26*s,26*s,13*s,col(A0));ell(c,-2*s,-22*s,18*s,6*s,col(L));leg(-8,Math.PI,19,5);leg(16,0,19,5);
      if(S.tail)line(c,[-24*s,-30*s,-40*s,-40*s+Math.sin(t*3)*4*s],col(D),4*s);
      c.save();c.translate(26*s,-36*s);if(open)c.rotate(-.2);ell(c,0,0,12*s,10*s,col(A0));ell(c,8*s,3*s,6*s,4*s,col(L));c.fillStyle=S.eye||'#2a1a10';c.fillRect(3*s,-4*s,3*s,3*s);
      if(S.horn)for(const d of [-1,1])line(c,[-2*s,-8*s,(-2+d*8)*s,-20*s],col(X||L),3*s);
      if(S.ears!==false){ell(c,-6*s,-9*s,3*s,5*s,col(D));}
      if(open){c.fillStyle='#5a1f1a';c.beginPath();c.moveTo(6*s,2*s);c.lineTo(16*s,6*s);c.lineTo(8*s,8*s);c.fill();}
      c.restore();if(S.spikes)for(let k=0;k<4;k++)poly(c,[(-16+k*9)*s,-36*s,(-12+k*9)*s,-48*s,(-8+k*9)*s,-36*s],col(X||D));},
    bird(c,m,M,st,S){const {col,g,open,t}=st,s=S.s||1,[A0,D,L,X]=S.c,fl=Math.sin(t*(S.slow?4:9))*(open?.4:1);
      ell(c,0,-4*s,16*s,4*s,'#00000022');c.save();c.translate(0,-30*s+Math.sin(t*3)*3);
      for(const d of [-1,1]){c.save();c.scale(1,1);poly(c,[-4*s,-4*s,(d*-26)*s,(-16-fl*16)*s,(d*-38)*s,(-4-fl*10)*s,(d*-16)*s,2*s],col(d<0?D:A0));c.restore();}
      ell(c,0,0,16*s,10*s,col(A0));ell(c,2*s,3*s,10*s,5*s,col(L));ell(c,14*s,-8*s,8*s,7*s,col(A0));poly(c,[20*s,-8*s,30*s,(-6+(open?3:0))*s,20*s,-4*s],X||'#e8b040');c.fillStyle=S.eye||'#1a1010';c.fillRect(15*s,-11*s,2.5*s,2.5*s);
      if(S.horn)poly(c,[10*s,-14*s,14*s,-26*s,18*s,-14*s],col(X||L));line(c,[-16*s,-2*s,-28*s,4*s],col(D),3*s);c.restore();},
    snake(c,m,M,st,S){const {col,g,open,t}=st,s=S.s||1,[A0,D,L,X]=S.c,n=7;c.lineCap='round';
      for(let k=n;k>=0;k--){const x=(-k*12)*s,y=(-8-Math.abs(Math.sin(t*4-k*.7))*6)*s,r=(12-k)*s*.9;ell(c,x,y,r,r*.75,col(k%2?D:A0));if(k%2)ell(c,x,y-2*s,r*.6,r*.3,col(L));}
      c.save();c.translate(12*s,-24*s);if(open)c.rotate(-.3);ell(c,0,0,15*s,10*s,col(A0));ell(c,4*s,4*s,9*s,4*s,col(L));c.fillStyle=S.eye||'#e8d020';c.fillRect(4*s,-5*s,4*s,3*s);c.fillRect(-4*s,-5*s,4*s,3*s);
      if(S.horn)for(const d of [-1,1])line(c,[d*4*s,-8*s,d*9*s,-20*s],col(X||L),2.5*s);
      if(open||Math.sin(t*5)>.8)line(c,[14*s,2*s,26*s,0,30*s,-4*s],'#ff4a4a',2);if(open)line(c,[14*s,2*s,26*s,0,30*s,4*s],'#ff4a4a',2);c.restore();},
    human(c,m,M,st,S){const {col,g,open,t}=st,s=S.s||1,[A0,D,L,X]=S.c,mv=m.moving?Math.sin(g)*5:0;
      if(S.see){c.save();c.globalAlpha=.78;}
      if(S.legs!==false){line(c,[-5*s,-14*s,(-7-mv)*s,0],col(D),5*s);line(c,[5*s,-14*s,(7+mv)*s,0],col(D),5*s);}else{poly(c,[-10*s,-14*s,10*s,-14*s,6*s,6*s+Math.sin(t*5)*2,-4*s,2*s,-12*s,6*s],col(D));}
      rr(c,-11*s,-40*s,22*s,28*s,4*s,col(A0));c.fillStyle=col(L);c.fillRect(-11*s,-40*s,6*s,28*s);
      if(S.armor){line(c,[-11*s,-28*s,11*s,-28*s],col(X||L),2*s);line(c,[-11*s,-20*s,11*s,-20*s],col(X||L),2*s);}
      const arm=open?-18:-30;line(c,[-9*s,-36*s,(-16)*s,(-18)*s],col(A0),4*s);line(c,[9*s,-36*s,16*s,arm*s],col(A0),4*s);
      if(S.weapon==='spear')line(c,[16*s,(arm+22)*s,16*s,(arm-40)*s],'#8a6a40',2.5*s),poly(c,[12*s,(arm-40)*s,16*s,(arm-52)*s,20*s,(arm-40)*s],'#d8dde2');
      else if(S.weapon==='sword')line(c,[16*s,(arm+4)*s,(16+(open?18:6))*s,(arm-(open?10:30))*s],'#d8dde2',3*s);
      else if(S.weapon==='club')line(c,[16*s,(arm+4)*s,22*s,(arm-26)*s],'#6b4a2e',5*s);
      ell(c,0,-50*s,10*s,11*s,col(S.skin||L));c.fillStyle=S.eye||'#1a1010';c.fillRect(-5*s,-52*s,3*s,3*s);c.fillRect(3*s,-52*s,3*s,3*s);
      if(S.hat==='helm'){ell(c,0,-58*s,11*s,6*s,col(X||D));c.fillStyle=col(X||D);c.fillRect(-11*s,-58*s,22*s,6*s);line(c,[0,-64*s,0,-76*s],'#c03030',2.5*s);}
      else if(S.hat==='horn'){for(const d of [-1,1])line(c,[d*6*s,-58*s,d*12*s,-72*s],col(X||D),3*s);}
      else if(S.hat==='crown'){poly(c,[-10*s,-58*s,-8*s,-70*s,-3*s,-62*s,0,-72*s,3*s,-62*s,8*s,-70*s,10*s,-58*s],'#e8c050');}
      else if(S.hat==='hood'){poly(c,[-12*s,-50*s,0,-68*s,12*s,-50*s,8*s,-42*s,-8*s,-42*s],col(D));}
      if(S.see)c.restore();if(S.glow){c.save();c.globalAlpha=.5+Math.sin(t*4)*.2;ell(c,0,-20*s,16*s,22*s,S.glow);c.restore();}},
    blob(c,m,M,st,S){const {col,g,open,t}=st,s=S.s||1,[A0,D,L]=S.c,p=1+Math.sin(t*4)*.08;c.save();if(S.see)c.globalAlpha=.7;if(S.glow){c.shadowColor=S.glow;c.shadowBlur=18;}
      ell(c,0,-18*s,18*s*p,16*s/p,col(A0));ell(c,-4*s,-24*s,8*s,5*s,col(L));c.restore();
      for(let k=0;k<3;k++){const a=t*2+k*2.1;ell(c,Math.cos(a)*22*s,-18*s+Math.sin(a)*8*s,3*s,3*s,col(L));}
      c.fillStyle=S.eye||'#1a1010';c.fillRect(-7*s,-22*s,4*s,4*s);c.fillRect(3*s,-22*s,4*s,4*s);if(open)ell(c,0,-12*s,6*s,4*s,'#3a0a0a');},
    bug(c,m,M,st,S){const {col,g,open,t}=st,s=S.s||1,[A0,D,L,X]=S.c,mv=m.moving?1:0;
      for(let k=0;k<4;k++)for(const d of [-1,1]){const ph=k*1.3,x0=d*(8+k*5)*s;line(c,[x0,-10*s,x0+d*(14+Math.sin(g*2+ph)*4*mv)*s,-14*s,x0+d*18*s,0],col(D),2.5*s);}
      ell(c,0,-14*s,22*s,12*s,col(A0));ell(c,0,-18*s,14*s,6*s,col(L));if(S.spikes)for(let k=-2;k<=2;k++)poly(c,[k*8*s,-24*s,(k*8+3)*s,-32*s,(k*8+6)*s,-24*s],col(X||D));
      for(const d of [-1,1]){c.save();c.translate(d*22*s,-16*s);c.rotate(d*(open?-.6:-.2)+Math.sin(t*3)*.1);ell(c,d*8*s,0,9*s,6*s,col(A0));poly(c,[d*14*s,-4*s,d*26*s,(-10-(open?6:0))*s,d*18*s,0],col(X||D));poly(c,[d*14*s,4*s,d*26*s,10*s,d*18*s,0],col(X||D));c.restore();}
      c.fillStyle=S.eye||'#1a1010';c.fillRect(6*s,-22*s,3*s,3*s);c.fillRect(-9*s,-22*s,3*s,3*s);},
    golem(c,m,M,st,S){const {col,g,open,t,atk}=st,s=S.s||1,[A0,D,L,X]=S.c,mv=m.moving?Math.sin(g):0,lift=open?-38:atk?-14:Math.sin(t*1.4)*3;
      const rock=(x,y,rx,ry,cl)=>{ell(c,x,y,rx,ry,col(D));ell(c,x-1,y-2,rx-3*s,ry-3*s,col(cl||A0));ell(c,x-rx*.35,y-ry*.4,rx*.35,ry*.25,col(L));};
      rock((-16-mv*6)*s,-14*s,13*s,15*s);rock((16+mv*6)*s,-14*s,13*s,15*s);rock(0,-52*s,38*s,34*s);
      c.save();c.translate(-34*s,-66*s);c.rotate(-.3-(open?.5:0));rock(0,14*s,12*s,22*s);rock(-2*s,40*s,14*s,12*s);c.restore();
      c.save();c.translate(34*s,-66*s);c.rotate(.9+lift/40);rock(0,14*s,12*s,22*s);rock(4*s,38*s,16*s,14*s);c.restore();
      rock(4*s,-98*s,22*s,18*s);c.fillStyle=S.eye||'#ff8a2a';c.shadowColor=S.eye||'#ffb04a';c.shadowBlur=10;c.fillRect(6*s,-104*s,6*s,4*s);c.fillRect(16*s,-103*s,5*s,4*s);c.shadowBlur=0;
      if(S.glow){c.save();c.globalAlpha=.4+Math.sin(t*3)*.15;for(let k=0;k<5;k++)ell(c,(-20+k*10)*s,(-60+hash(k,1)*20)*s,3*s,3*s,S.glow);c.restore();}},
    dragon(c,m,M,st,S){const {col,g,open,t}=st,s=S.s||1,[A0,D,L,X]=S.c,sw=Math.sin(t*1.6)*3;
      for(let k=6;k>=1;k--){const x=(-k*14)*s,y=(-30-Math.sin(t*3-k*.6)*5)*s,r=(16-k)*s;ell(c,x,y,r,r*.8,col(k%2?D:A0));poly(c,[x-4*s,y-r*.7,x,y-r*1.4,x+4*s,y-r*.7],col(X||L));}
      if(S.wing)for(const d of [-1,1]){const fl=Math.sin(t*4)*8;poly(c,[-10*s,-50*s,(-30+d*10)*s,(-90-fl)*s,(-60+d*14)*s,(-70-fl)*s,-40*s,-44*s],col(D));}
      ell(c,0,-40*s,30*s,22*s,col(A0));ell(c,4*s,-30*s,22*s,8*s,col(L));
      for(const x of [-12,10])line(c,[x*s,-24*s,(x-4)*s,0],col(D),7*s),ell(c,(x-4)*s,0,7*s,3*s,col(D));
      c.save();c.translate(34*s,(-70+sw)*s);if(open)c.rotate(.2);ell(c,0,0,20*s,13*s,col(A0));poly(c,[8*s,-10*s,14*s,-28*s,20*s,-8*s],col(X||L));poly(c,[-6*s,-12*s,-4*s,-28*s,4*s,-10*s],col(X||L));
      c.fillStyle=S.eye||'#ffd040';c.shadowColor=S.eye||'#ffd040';c.shadowBlur=8;c.fillRect(6*s,-6*s,5*s,4*s);c.shadowBlur=0;
      c.save();c.translate(16*s,4*s);c.rotate(open?.5:.1);poly(c,[0,-4*s,24*s,-2*s,22*s,6*s,0,6*s],col(D));c.fillStyle='#fff';for(let x=4;x<22;x+=5)c.fillRect(x*s,-2*s,2*s,3*s);c.restore();
      if(S.breath&&open){c.save();c.globalAlpha=.6;for(let k=0;k<5;k++)ell(c,(26+k*12)*s,(2+Math.sin(t*20+k)*4)*s,(6+k*2)*s,(4+k)*s,S.breath);c.restore();}c.restore();}
  };
  // ---------- NPC: người theo tham số (robe, nón, vật cầm, hành động) ----------
  // spec: {robe, trim, hat:'non|khan|quan|tru|none', item:'spear|drum|fan|scroll|lantern|staff|none', skin, hair, fem, beard, act:'patrol|dance|drum|turn|stand|bow'}
  function npc(S){
    return (c,n,t,H)=>{
      const {ell,line,poly,rr,head,khanXep,nonLa,npcLegs,torso,oline,shade}=H,sway=S.act==='dance'?Math.sin(t*4+n.phase*6)*4:0,beat=S.act==='drum'?Math.max(0,Math.sin(t*6+n.phase)):0;
      c.save();c.translate(sway*.5,0);if(S.s)c.scale(S.s,S.s); // s: tỉ lệ (trẻ con ~0,6)
      npcLegs(c,n,S.pants||shade(S.robe,-.35));
      if(S.skirt)poly(c,[-13,-26,13,-26,16,0,-16,0],S.robe);
      torso(c,-12,-28,24,24,5,S.robe);if(S.trim)line(c,[-12,-9,12,-9],S.trim,2.2),line(c,[2,-27,8,-10],S.trim,1.3);
      if(S.sash)poly(c,[-12,-24,-4,-26,6,-4,-2,-2],S.sash);
      // tay
      const armA=S.act==='dance'?-20-sway*2:S.act==='drum'?-12-beat*18:S.act==='bow'?-2:-10;
      oline(c,[-10,-24,-16,armA],S.robe,5);oline(c,[10,-24,16,S.act==='drum'?-12-(1-beat)*18:S.item?-26:armA],S.robe,5);
      if(S.item==='spear'){line(c,[16,-6,16,-70],'#8a6a40',2.5);poly(c,[12,-70,16,-82,20,-70],'#d8dde2');}
      else if(S.item==='staff')line(c,[16,-4,18,-56],'#8a6a40',3),ell(c,18,-58,4,4,'#e8c050');
      else if(S.item==='fan'){c.save();c.translate(16,-30);c.rotate(-.6+sway*.08);poly(c,[0,0,-14,-16,-6,-20,4,-22,12,-18,16,-10],S.trim||'#e8c0a0');c.restore();}
      else if(S.item==='scroll')rr(c,8,-32,16,6,2,'#f0e6c8'),line(c,[8,-29,24,-29],'#8a5a3a',.8);
      else if(S.item==='lantern'){line(c,[16,-26,22,-40],'#8a6a40',1.5);c.save();c.shadowColor='#ffb050';c.shadowBlur=10;ell(c,22,-30,5,7,'#f06030');c.restore();}
      else if(S.item==='chest'){ // v10.21: rương gỗ nẹp đồng đặt cạnh chân, tay cầm chùm chìa khóa
        rr(c,16,-18,26,18,3,'#7a4a24');rr(c,16,-22,26,7,3,'#8e5a2c');line(c,[16,-15,42,-15],'#d8a840',2);line(c,[22,-22,22,0],'#d8a840',2);line(c,[36,-22,36,0],'#d8a840',2);rr(c,26,-15,6,6,1,'#f0c850');ell(c,29,-12,1.2,1.2,'#3a2410');
        ell(c,16,-26,3,3,'#e0b040');line(c,[16,-24,18,-17],'#e0b040',1.5);line(c,[13,-25,11,-19],'#c8a040',1.5);}
      else if(S.item==='flag'){const w=Math.sin(t*3+n.phase)*3;line(c,[17,-4,17,-92],'#6a4a2a',2.6);poly(c,[17,-92,44,-86+w,40,-78+w*.6,46,-70+w,17,-64],S.flagc||'#c02020');line(c,[17,-92,44,-86+w,40,-78+w*.6,46,-70+w,17,-64],S.trim||'#ffd040',1.4);ell(c,17,-94,3,3,'#ffd040');ell(c,29,-78+w*.5,4.5,4.5,S.trim||'#ffd040');} // v10.46: cờ lệnh Tướng quân
      else if(S.item==='sticks'){for(const [x0,y0] of [[-16,armA],[16,-12-(1-beat)*18]])line(c,[x0,y0,x0+6,y0-14],'#d8c8a0',2);}
      head(c,S.skin||'#e1c295',S.hair||(S.hat==='none'?'#2a2622':null),S.beard||null,{fem:!!S.fem,ph:n.phase});
      if(S.hat==='non')nonLa(c,S.hatc);else if(S.hat==='khan')khanXep(c,S.hatc);
      else if(S.hat==='quan'){rr(c,-11,-52,22,10,2,S.hatc||'#1e1b19');rr(c,-6,-60,12,9,2,S.hatc||'#1e1b19');line(c,[-14,-48,-18,-54],S.hatc||'#1e1b19',3);line(c,[14,-48,18,-54],S.hatc||'#1e1b19',3);}
      else if(S.hat==='tru'){ell(c,0,-44,12,7,S.hatc||'#6b6e74');c.fillStyle=S.hatc||'#6b6e74';c.fillRect(-12,-44,24,5);line(c,[0,-50,0,-62],'#c03030',3);}
      else if(S.hat==='hoa'){ell(c,-8,-46,4,4,'#f06090');ell(c,-4,-50,3,3,'#f0c040');}
      c.restore();
    };
  }
  // v10.21: Người giữ rương (làng Thanh Mộc và các thành) — vai dùng chung, không cần gói bản đồ
  // v10.38: Thầy đồ (làng Thanh Mộc và các thành) — áo the, khăn xếp, cuộn giấy, râu bạc, đứng yên
  A.npc['thay-do']=npc({robe:'#1e1b19',trim:'#c0a060',hat:'khan',hatc:'#1e1b19',item:'scroll',beard:'#d8d0c0',skin:'#e8c8a0',act:'stand'});
  // v10.46: Tướng quân giao sự kiện thế giới (làng Thanh Mộc và các thành) — giáp đỏ, mũ trụ vàng, cờ lệnh
  A.npc['tuong-quan-tg']=npc({robe:'#8a1e1a',trim:'#ffd040',hat:'tru',hatc:'#d8a830',item:'flag',flagc:'#c02020',beard:'#2a2020',pants:'#3a2a20',act:'stand'});
  A.npc['giu-ruong']=npc({robe:'#5a3a1e',trim:'#e0b040',hat:'khan',hatc:'#2a1a0e',item:'chest',beard:'#4a3a30'});
  // v10.39: NPC giao việc Tìm con ở từng vùng (vai dùng chung cho mọi bản đồ)
  for(const [k,S] of Object.entries({
   'be-na':{robe:'#5a8a3a',trim:'#ffe080',hat:'non',s:.6,fem:1,skirt:1},
   'tieu-phu':{robe:'#6a5034',trim:'#c8a870',hat:'khan',hatc:'#3a2a1a',item:'sticks',beard:'#3a3028'},
   'truong-doan-buon':{robe:'#b0682a',trim:'#f0d090',hat:'khan',hatc:'#f0e0c0',item:'staff',beard:'#5a4030',skin:'#c89a70'},
   'tho-san':{robe:'#5a6a74',trim:'#e8e8e8',hat:'non',hatc:'#c8c0a8',item:'spear',beard:'#4a3a30'},
   'lai-do':{robe:'#4a5a3a',trim:'#c8b880',hat:'non',item:'staff',beard:'#d8d0c0',skin:'#c8a080'},
   'ba-lao-che':{robe:'#6a4a3a',trim:'#d8c0a0',hat:'khan',hatc:'#3a2a20',fem:1,skirt:1,hair:'#d8d0c8',skin:'#d8b898'},
   'tho-ren-nui':{robe:'#3a2a24',trim:'#ff8a3d',hat:'khan',hatc:'#5a1a10',item:'sticks',beard:'#2a2420',skin:'#b8805a'},
   'su-gia-bang':{robe:'#9ac8e8',trim:'#ffffff',hat:'quan',hatc:'#4a7aa0',item:'scroll',skin:'#e8e4f0'},
   'linh-bang-tin':{robe:'#7a2a2a',trim:'#e0b040',hat:'tru',hatc:'#6b6e74',item:'spear'},
   'giu-lau':{robe:'#4a2a5a',trim:'#e0b040',hat:'quan',hatc:'#2a1a3a',item:'lantern',beard:'#d8d0c0'},
   'quy-tuong':{robe:'#2a6a6a',trim:'#e0d070',hat:'quan',hatc:'#1a4a4a',item:'scroll',beard:'#e8e8e0',skin:'#a8b890'},
   'chan-de':{robe:'#8a7a5a',trim:'#e8e0c8',hat:'non',item:'staff',hair:'#2a2622'},
   'lao-gac-cong':{robe:'#5a3a2a',trim:'#c0a060',hat:'tru',hatc:'#8a6a40',item:'spear',beard:'#d8d0c0'},
   'phan-quan':{robe:'#1a1a2a',trim:'#c03030',hat:'quan',hatc:'#0a0a14',item:'scroll',beard:'#1a1a1a',skin:'#9aa0a0'},
   'dao-co':{robe:'#e8e0d0',trim:'#8a5a9a',hat:'none',hair:'#2a2622',fem:1,skirt:1,item:'fan'},
   'nguyet-than':{robe:'#f0f0ff',trim:'#c0c8ff',hat:'hoa',fem:1,skirt:1,sash:'#c0c8ff',item:'lantern',skin:'#f4ece8'},
   'quan-le-bo':{robe:'#a02a2a',trim:'#e0b040',hat:'quan',hatc:'#1e1b19',item:'scroll',beard:'#3a3028'},
   'tien-ong':{robe:'#e8e8f0',trim:'#a090ff',hat:'none',hair:'#f0f0f0',beard:'#f8f8f8',item:'staff'},
   'lao-thuyen':{robe:'#4a2a2a',trim:'#ff8080',hat:'non',hatc:'#6a4a3a',item:'staff',beard:'#d8d0c0',skin:'#c8a090'},
   'lao-binh':{robe:'#5a5048',trim:'#c0a060',hat:'tru',hatc:'#6b6e74',item:'spear',beard:'#e0e0d8'},
   'lao-lai-be':{robe:'#a08050',trim:'#f0e0b0',hat:'non',item:'staff',beard:'#e8e0d0',skin:'#c09870'},
   'lao-vo-su':{robe:'#6a3a2a',trim:'#e0b040',hat:'khan',hatc:'#2a1a10',item:'staff',beard:'#f0f0f0'},
   'kiem-lao':{robe:'#3a4a5a',trim:'#c0e8ff',hat:'khan',hatc:'#1a2430',item:'staff',beard:'#f0f0f0',skin:'#e0d0c0'},
   'dao-si-bang-hoa':{robe:'#4a6a9a',trim:'#ff9a50',hat:'quan',hatc:'#a03a20',item:'fan',beard:'#d8d0c0'},
   'manh-ba':{robe:'#2a3a30',trim:'#80ffb0',hat:'khan',hatc:'#1a2420',fem:1,skirt:1,hair:'#d8d8d0',item:'lantern',skin:'#c8d0c8'},
   'long-nu':{robe:'#2a5a8a',trim:'#ffe060',hat:'hoa',fem:1,skirt:1,sash:'#a0d0ff',item:'fan',skin:'#e8e0f0'}
  }))if(!A.npc[k])A.npc[k]=npc(S);
  // ---------- trời: hạt rơi / bay + màu phủ ----------
  // spec: {n, col, size, vx, vy, tint, glow, dark} — hạt (tro, lá, hoa, tuyết, đom đóm, sương), tint = màu phủ cả màn hình
  function sky(S){
    return (c,s)=>{const {w,h,t}=s,n=Math.round((S.n||40)*(s.q===2?.3:s.q===1?.55:1)); // v10.66: máy yếu bớt hạt
      if(S.tint){c.fillStyle=S.tint;c.fillRect(0,0,w,h);}
      if(S.dark){const g=c.createRadialGradient(s.hx,s.hy,80,s.hx,s.hy,Math.max(w,h)*.7);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,S.dark);c.fillStyle=g;c.fillRect(0,0,w,h);}
      c.save();if(S.glow&&!s.q){c.shadowColor=S.col;c.shadowBlur=8;}c.fillStyle=S.col;
      for(let i=0;i<n;i++){const ph=hash(i,1)*1000,x=((hash(i,2)*w+t*(S.vx||20)*(.5+hash(i,3))+Math.sin(t+ph)*14)%(w+40)+w+40)%(w+40)-20,y=((hash(i,4)*h+t*(S.vy||30)*(.6+hash(i,5)))%(h+40)+h+40)%(h+40)-20,r=(S.size||2)*(.6+hash(i,6));
        if(S.leaf){c.save();c.translate(x,y);c.rotate(t*2+ph);c.fillRect(-r*1.5,-r*.6,r*3,r*1.2);c.restore();}else{c.globalAlpha=S.glow?.5+Math.sin(t*3+ph)*.4:.8;c.beginPath();c.arc(x,y,r,0,PI2);c.fill();}}
      c.restore();};
  }
  A.gen=spec=>{
    const out={theme:{},obj:{},mon:{},npc:{},sky:{},ring:spec.ring||{}};
    for(const [k,v] of Object.entries(spec.theme||{}))out.theme[k]=theme(v);
    for(const [k,v] of Object.entries(spec.obj||{})){const f=OBJ[v.base];if(f)out.obj[k]=(c,o,t)=>f(c,o,t,v);}
    for(const [k,v] of Object.entries(spec.mon||{})){const f=MON[v.body];if(f)out.mon[k]=(c,m,M,st)=>{if(v.sc)c.scale(v.sc,v.sc);f(c,m,M,st,v);};}
    for(const [k,v] of Object.entries(spec.npc||{}))out.npc[k]=npc(v);
    for(const [k,v] of Object.entries(spec.sky||{}))out.sky[k]=sky(v);
    return out;
  };
  // v10.13: hình quái sự kiện đột xuất (kẻ trộm chó, quân phương Bắc, đạo tặc, hổ dữ, gian tế) — đăng ký sẵn trong game, không cần gói bản đồ
  // v10.67: kẻ trộm chó vác bao tải trên lưng, đầu và một chân chó thò ra khỏi miệng bao (vẽ thêm lên hình người)
  function dogSack(c,m,st){const {t,g,col}=st,mv=m.moving?1:0,sw=Math.sin(g)*2*mv+Math.sin(t*2)*.6,s=.95;
    c.save();c.translate(-9*s,-34*s);c.rotate(-.25+sw*.03);
    line(c,[4*s,-4*s,8*s,-8*s],'#c8b08a',1.6); // dây buộc qua vai
    ell(c,-8*s,0,11*s,14*s,col('#9a7a4c'));ell(c,-9*s,-4*s,8*s,8*s,col('#a98858'));line(c,[-14*s,10*s,-2*s,12*s],'#6b5030',1.2);line(c,[-15*s,2*s,-4*s,1*s],'#6b503066',1);
    poly(c,[-15*s,-11*s,-1*s,-12*s,-3*s,-7*s,-13*s,-6*s],col('#7a5c36')); // miệng bao thắt lại
    // chân chó thò ra bên hông bao, đạp đạp
    c.save();c.translate(-17*s,4*s);c.rotate(.9+Math.sin(t*7+1)*.25*(1+mv));line(c,[0,0,-9*s,2*s],col('#c99a58'),3.4*s);ell(c,-10*s,2*s,2.6*s,2*s,col('#e6c48e'));c.restore();
    // đầu chó thò ra khỏi miệng bao, ngó quanh
    c.save();c.translate(-9*s,-13*s);c.rotate(Math.sin(t*2.5)*.18);
    ell(c,0,-3*s,7*s,6*s,col('#c99a58'));ell(c,-6*s,-2*s,4.5*s,3.4*s,col('#e6c48e'));ell(c,-9.5*s,-3*s,1.8*s,1.6*s,'#2a1f18');
    poly(c,[2*s,-7*s,5*s,-14*s,7*s,-6*s],col('#8a5a2a'));poly(c,[-3*s,-8*s,-4*s,-14*s,0,-8*s],col('#8a5a2a'));c.fillStyle='#2a1f18';c.fillRect(-4*s,-5.5*s,2*s,2*s);
    if(Math.sin(t*4)>.5)line(c,[-7*s,0,-9*s,2*s],'#e07070',1.4); // lè lưỡi
    c.restore();c.restore();}
  setTimeout(()=>{try{A.add('su-kien',K=>{const r=A.gen({mon:{
    'ke-trom-cho':{body:'human',s:.95,c:['#4a3a2a','#2a1a10','#8a7a60','#6b4a2e'],weapon:'club',hat:'hood',skin:'#d9ad80',eye:'#2a2018'},
    'linh-phuong-bac':{body:'human',s:1,c:['#8a2a2a','#5a1a1a','#d8c060','#c0c0c0'],weapon:'spear',hat:'helm',armor:1,skin:'#e4c69b',eye:'#2a2018'},
    'linh-phe-ta':{body:'human',s:1,c:['#2a4a8a','#1a2a5a','#d8c060','#c0c0c0'],weapon:'spear',hat:'helm',armor:1,skin:'#e4c69b',eye:'#2a2018'},
    'tuong-phuong-bac':{body:'human',s:1.5,c:['#6a1a1a','#3a0a0a','#ffd040','#d0d0d8'],weapon:'sword',hat:'helm',armor:1,skin:'#e4c69b',eye:'#ff6060',glow:'#ff404033'},
    'dao-tac':{body:'human',s:.95,c:['#2a2a3a','#14141e','#8a8aa0','#c0c0c0'],weapon:'sword',hat:'hood',skin:'#d9ad80',eye:'#ffd040'},
    'ho-du':{body:'quad',s:1.25,c:['#e08a2e','#7a3a10','#f0c070','#2a1a0a'],tail:1,eye:'#ffe060'},
    'gian-te':{body:'human',s:1,c:['#1a1a22','#0a0a10','#5a5a70','#c03030'],weapon:'sword',hat:'hood',skin:'#c8a080',eye:'#ff3040',glow:'#ff204022'}
  },ring:{'tuong-phuong-bac':'#ff6060'}});const base=r.mon['ke-trom-cho'];r.mon['ke-trom-cho']=(c,m,M,st)=>{base(c,m,M,st);dogSack(c,m,st);};return r;});}catch(e){}},0);
  // gói mới có thể trả về cả npc
  const add0=A.add;A.add=(id,fn)=>{if(A.packs[id]||typeof fn!=='function')return;A.packs[id]=true;const r=fn(K)||{};for(const k of ['theme','obj','mon','sky','ring','npc'])Object.assign(A[k],r[k]||{});};
})();
