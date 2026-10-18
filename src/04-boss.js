/* ================= HÌNH VẼ CHI TIẾT: BOSS VÀ THÚ CƯỠI THẦN THOẠI (v10.18) =================
   LH_BOSS[mã_quái](c,m,M,s) vẽ boss quay mặt sang phải, chân chạm y=0; thiết kế trong khung cao 100 đơn vị rồi phóng theo M.h.
   LH_BOSS.mount[loài](c,tint,moving,walk,t) vẽ thú cưỡi (khung như ngựa: thân quanh y=-24, chỗ ngồi theo BEASTS.seat).
   Ảnh do người dùng đặt trong file Hình ảnh (quai:<mã>) vẫn được ưu tiên hơn hình vẽ ở đây. */
const LH_BOSS=(()=>{
  const PI=Math.PI,PI2=PI*2,memo={};
  const shade=(hex,f)=>{const k=hex+f;if(memo[k])return memo[k];const m=/^#([0-9a-f]{6})/i.exec(hex||'');if(!m)return hex;const n=parseInt(m[1],16),ch=i=>{const v=(n>>i)&255;return Math.round(f<0?v*(1+f):v+(255-v)*f);};return memo[k]='#'+[16,8,0].map(i=>ch(i).toString(16).padStart(2,'0')).join('');};
  const hr=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const E=(c,x,y,rx,ry,col,rot=0)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),rot,0,PI2);c.fill();};
  const P=(c,p,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();c.fill();};
  const L=(c,p,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.stroke();};
  // đường cong mượt qua các điểm (giữa hai điểm dùng quadratic)
  const curve=(c,p)=>{c.moveTo(p[0],p[1]);for(let i=2;i<p.length-2;i+=2){const mx=(p[i]+p[i+2])/2,my=(p[i+1]+p[i+3])/2;c.quadraticCurveTo(p[i],p[i+1],mx,my);}c.lineTo(p[p.length-2],p[p.length-1]);};
  const S=(c,p,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();curve(c,p);c.stroke();};
  const F=(c,p,col)=>{c.fillStyle=col;c.beginPath();curve(c,p);c.closePath();c.fill();};
  const lg=(c,x0,y0,x1,y1,st)=>{const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach((s,i)=>g.addColorStop(i/(st.length-1),s));return g;};
  const rg=(c,x,y,r,st)=>{const g=c.createRadialGradient(x,y,0,x,y,r);st.forEach((s,i)=>g.addColorStop(i/(st.length-1),s));return g;};
  const glow=(c,col,b)=>{c.shadowColor=col;c.shadowBlur=b;};
  const noGlow=c=>{c.shadowBlur=0;};
  const al=(hex,a)=>hex+Math.round(Math.max(0,Math.min(1,a))*255).toString(16).padStart(2,'0');
  // màu khi trúng đòn: trắng lóe
  const FL='#fff3e6';
  const fc=(st,v)=>st.fl?FL:v;
  const fg=(st,g,v)=>st.fl?FL:g;
  /* ---------- hiệu ứng chung ---------- */
  function aura(c,t,col,w,h,n=12){c.save();for(let i=0;i<n;i++){const ph=(t*.35+hr(i))%1,x=(hr(i+9)-.5)*w,y=-ph*h,r=1.2+hr(i+3)*2.2;c.globalAlpha=(1-ph)*.85;glow(c,col,8);E(c,x,y,r,r,col);}c.restore();
    c.save();c.globalAlpha=.35+Math.sin(t*3)*.08;c.fillStyle=rg(c,0,-2,w*.55,[al(col,.7),al(col,0)]);c.beginPath();c.ellipse(0,-2,w*.55,w*.16,0,0,PI2);c.fill();c.restore();}
  function flames(c,t,x,y,s,cols,n=5){c.save();for(let i=0;i<n;i++){const ph=(t*1.6+i/n)%1,px=x+Math.sin(i*2.3+t*3)*4*s,py=y-ph*16*s,r=(1-ph)*4.5*s;c.globalAlpha=1-ph;glow(c,cols[1],8);c.fillStyle=ph<.35?cols[1]:cols[0];c.beginPath();c.moveTo(px,py-r*1.8);c.quadraticCurveTo(px+r,py,px,py+r*.6);c.quadraticCurveTo(px-r,py,px,py-r*1.8);c.fill();}c.restore();}
  function bolt(c,x0,y0,x1,y1,seed,col){const n=6,p=[x0,y0];for(let i=1;i<n;i++){const u=i/n;p.push(x0+(x1-x0)*u+(hr(seed+i)-.5)*10,y0+(y1-y0)*u+(hr(seed+i+20)-.5)*6);}p.push(x1,y1);c.save();glow(c,col,10);L(c,p,col,2.2);L(c,p,'#ffffff',.9);c.restore();}
  function swirl(c,t,x,y,r,col){c.save();c.strokeStyle=col;c.lineCap='round';for(let i=0;i<3;i++){const a=t*3+i*2.1;c.globalAlpha=.55;c.lineWidth=1.6;c.beginPath();c.arc(x+Math.cos(a)*r*.3,y+Math.sin(a)*r*.15,r*(.5+i*.25),a,a+2.2);c.stroke();}c.restore();}
  /* ================= NGƯỜI: TƯỚNG, VUA, THẦN (áo giáp vảy, hộ tâm kính, áo choàng, mũ, binh khí) ================= */
  function weapon(c,st,P0){const W=P0.weapon,wc=P0.wcol||'#d8dde2',pole=P0.pole||'#5a2a1a',T=P0.c[3];
    if(W==='guandao'||W==='halberd'){L(c,[0,30,0,-62],pole,3.4);for(const y of [-20,8,24])L(c,[-2.4,y,2.4,y],T,2);
      c.save();if(P0.wglow)glow(c,P0.wglow,12);F(c,[-1,-56,6,-62,16,-78,14,-92,6,-98,4,-84,-1,-70],fc(st,wc));c.restore();S(c,[4,-64,12,-80,10,-92],'#ffffff99',1);
      P(c,[-3,-58,3,-58,2,-54,-2,-54],T);for(let i=0;i<4;i++)S(c,[-1,-56,-5-i,-48+Math.sin(st.t*4+i)*2,-6-i*.5,-40],'#c8202a',1.4);P(c,[-1.5,30,1.5,30,0,38],'#9aa0a6');}
    else if(W==='spear'){L(c,[0,30,0,-70],pole,3);c.save();if(P0.wglow)glow(c,P0.wglow,12);P(c,[-4,-70,0,-90,4,-70,0,-66],fc(st,wc));c.restore();L(c,[0,-88,0,-70],'#ffffff88',.8);
      for(let i=0;i<5;i++)S(c,[0,-66,-3-i*.8,-58+Math.sin(st.t*5+i)*2,-4-i,-50],'#c8202a',1.3);P(c,[-3,-67,3,-67,2,-64,-2,-64],T);}
    else if(W==='sword'){c.save();if(P0.wglow)glow(c,P0.wglow,14);P(c,[-2.2,-8,2.2,-8,1.6,-54,0,-60,-1.6,-54],fc(st,wc));c.restore();L(c,[0,-10,0,-54],'#ffffffaa',.8);L(c,[-7,-7,7,-7],T,3);E(c,0,-7,2.4,2.4,'#c8202a');L(c,[0,-5,0,6],'#3a2018',3);E(c,0,7,2.2,2.2,T);}
    else if(W==='staff'){L(c,[0,32,0,-58],pole,3);for(const y of [-50,-30,10])L(c,[-2.5,y,2.5,y],T,1.8);
      if(P0.moon){c.save();glow(c,P0.wglow||'#fff4c0',16);c.fillStyle=fc(st,wc);c.beginPath();c.arc(0,-70,12,PI*.15,PI*1.85);c.arc(5,-70,9,PI*1.75,PI*.25,true);c.fill();c.restore();}
      else{S(c,[0,-58,-8,-66,-6,-76,0,-80,6,-76,8,-66,0,-58],T,2);c.save();glow(c,P0.wglow||wc,18);E(c,0,-68,6.5,6.5,fc(st,wc));c.restore();E(c,-2,-70,2,2,'#ffffffcc');}
      if(P0.ice)for(let i=0;i<5;i++){const a=st.t*1.5+i*1.26;P(c,[Math.cos(a)*12,-68+Math.sin(a)*12,Math.cos(a)*15+1.5,-68+Math.sin(a)*15,Math.cos(a)*18,-68+Math.sin(a)*18-1.5],'#e0f6ff');}}
    else if(W==='mace'){L(c,[0,26,0,-40],pole,4);c.save();if(P0.wglow)glow(c,P0.wglow,10);E(c,0,-50,9,13,fc(st,wc));c.restore();for(let i=0;i<9;i++){const a=i/9*PI2;P(c,[Math.cos(a)*7,-50+Math.sin(a)*10,Math.cos(a+.2)*14,-50+Math.sin(a+.2)*17,Math.cos(a+.4)*7,-50+Math.sin(a+.4)*10],'#d0d4d8');}}
  }
  function helm(c,st,P0,hx,hy){const [A,D,Lt,T]=P0.c,H=P0.helm,t=st.t;
    if(H==='plume'){E(c,hx,hy-4,11,9,fc(st,D));c.fillStyle=fc(st,lg(c,hx-10,hy-12,hx+10,hy,[shade(D,.25),D]));c.beginPath();c.ellipse(hx,hy-5,10.5,8.5,0,PI,0);c.fill();
      L(c,[hx-11,hy-2,hx+11,hy-2],T,2.4);P(c,[hx-10,hy-2,hx-12,hy+8,hx-6,hy+6,hx-7,hy-2],fc(st,D));L(c,[hx,hy-13,hx,hy-20],T,2);
      F(c,[hx,hy-20,hx-6,hy-30+Math.sin(t*3),hx-16,hy-34+Math.sin(t*3+1)*2,hx-24,hy-30,hx-14,hy-26,hx-4,hy-18],'#c8202a');S(c,[hx-2,hy-21,hx-12,hy-29,hx-20,hy-30],'#ff6060',1);}
    else if(H==='dragon'){E(c,hx,hy-4,11,9,fc(st,D));L(c,[hx-11,hy-2,hx+11,hy-2],T,2.4);
      for(const d of [-1,1])S(c,[hx+d*3,hy-10,hx+d*6-6,hy-22,hx+d*4-14,hy-30,hx+d*2-20,hy-28],T,2.6);P(c,[hx+4,hy-12,hx+14,hy-16,hx+8,hy-8],T);E(c,hx+3,hy-8,2,1.6,'#c8202a');}
    else if(H==='horn'){for(const d of [-1,1]){c.fillStyle=fc(st,'#2a1a1a');c.beginPath();c.moveTo(hx+d*5,hy-8);c.quadraticCurveTo(hx+d*18,hy-14,hx+d*14,hy-34);c.quadraticCurveTo(hx+d*12,hy-18,hx+d*2,hy-10);c.fill();S(c,[hx+d*7,hy-10,hx+d*15,hy-16,hx+d*13,hy-28],'#ffffff33',1);}
      F(c,[hx-10,hy-4,hx-6,hy-12,hx+6,hy-12,hx+10,hy-4],fc(st,D));}
    else if(H==='crown'||H==='mian'){if(H==='mian'){P(c,[hx-16,hy-15,hx+16,hy-17,hx+16,hy-13,hx-16,hy-11],fc(st,'#1a1410'));for(let i=-14;i<=14;i+=4){const sw=Math.sin(t*2+i)*.6;L(c,[hx+i,hy-12,hx+i+sw,hy-2],'#e8c050',.8);E(c,hx+i+sw,hy-2,1.2,1.2,i%8?'#e05050':'#ffffff');}}
      c.save();glow(c,'#ffd060',6);P(c,[hx-10,hy-6,hx-11,hy-17,hx-6,hy-11,hx-2,hy-20,hx+2,hy-11,hx+7,hy-19,hx+11,hy-6],fc(st,'#e8c050'));c.restore();L(c,[hx-10,hy-6,hx+11,hy-6],'#a07820',2);E(c,hx+1,hy-11,1.8,1.8,'#e02040');E(c,hx-6,hy-10,1.3,1.3,'#40c0ff');}
    else if(H==='tiara'){c.save();glow(c,'#fff4c0',10);c.fillStyle='#fff0b0';c.beginPath();c.arc(hx-2,hy-16,7,PI*.2,PI*1.8);c.arc(hx+1,hy-16,5.5,PI*1.7,PI*.3,true);c.fill();c.restore();L(c,[hx-9,hy-8,hx+9,hy-9],'#e8c050',1.6);}
    else if(H==='skull'){c.save();glow(c,P0.eye||'#ff4040',6);P(c,[hx-11,hy-5,hx-12,hy-18,hx-6,hy-10,hx-3,hy-22,hx+1,hy-10,hx+6,hy-21,hx+8,hy-9,hx+12,hy-17,hx+11,hy-5],fc(st,'#6a6050'));c.restore();for(let i=-8;i<=8;i+=8)E(c,hx+i,hy-8,1.6,1.6,P0.eye||'#ff4040');}
    else if(H==='icecrown'){c.save();glow(c,'#a0e8ff',10);for(let i=0;i<7;i++){const x=hx-12+i*4,h=6+(i%2?4:10)+(i===3?6:0);P(c,[x-2,hy-6,x,hy-6-h,x+2,hy-6],'#e0f8ff');}c.restore();L(c,[hx-12,hy-6,hx+12,hy-6],'#a0d8f0',2);}
  }
  function warlord(c,m,M,st,P0){
    const {t,open,atk}=st,g=m.walk||0,mv=m.moving?1:0,[A,D,Lt,T]=P0.c,W=P0.bulk||1,skin=P0.skin||'#d8a878',br=Math.sin(t*2)*.8,sw=Math.sin(g)*mv;
    if(P0.aura)aura(c,t,P0.aura,70*W,110);
    c.save();if(P0.ghost)c.globalAlpha=.86;
    c.translate(0,br*.3);
    // áo choàng phía sau
    if(P0.cape){const wv=Math.sin(t*2.2)*4+sw*3,cp=P0.cape;c.fillStyle=fc(st,lg(c,0,-62,-20,0,[cp,shade(cp,-.45)]));c.beginPath();c.moveTo(-10*W,-62);c.quadraticCurveTo(-24*W-wv,-34,-34*W-wv,-2);c.lineTo(-18*W-wv*.6,-6);c.lineTo(-8*W-wv*.4,0);c.quadraticCurveTo(-4,-30,6*W,-60);c.closePath();c.fill();
      S(c,[-10*W,-62,-24*W-wv,-34,-34*W-wv,-2],shade(cp,.25),1.2);P(c,[-34*W-wv,-2,-26*W-wv*.8,-8,-18*W-wv*.6,-6,-12*W-wv*.5,-1,-8*W-wv*.4,0],P0.c[3]);}
    // chân
    const leg=(x,ph,front)=>{const k=Math.sin(g+ph)*mv,kx=x+k*7,col=front?D:shade(D,-.25);
      if(P0.ghost){F(c,[x-6,-36,x+6,-36,x+4+k*4,-14,x+k*6+Math.sin(t*5)*3,-2,x-4+k*3,-14],al(col,.8));return;}
      L(c,[x,-36,x+k*3,-18,kx,-6],fc(st,col),8.5*W);P(c,[x-5*W+k*3,-22,x+5*W+k*3,-22,x+4*W+k*4,-12,x-4*W+k*4,-12],fc(st,front?A:shade(A,-.25)));
      P(c,[kx-5,-9,kx+5,-9,kx+10,-1,kx+10,1,kx-5,1],fc(st,'#2a1c14'));L(c,[kx-5,-8,kx+5,-8],T,1.4);};
    if(P0.robe){const hw=17*W,sk=Math.sin(t*1.8)*2+sw*2;c.fillStyle=fc(st,lg(c,0,-40,0,0,[A,shade(A,-.3)]));c.beginPath();c.moveTo(-12*W,-40);c.lineTo(12*W,-40);c.quadraticCurveTo(16*W,-20,hw+sk,0);c.lineTo(-hw-6+sk,0);c.quadraticCurveTo(-16*W,-20,-12*W,-40);c.fill();
      for(let i=-2;i<=2;i++)S(c,[i*4*W,-36,i*6*W+sk*.5,-16,i*7*W+sk,0],shade(A,-.2),1);L(c,[-hw-6+sk,-1,hw+sk,-1],T,2.4);P(c,[-6,-40,6,-40,4+sk*.3,-4,-4+sk*.3,-4],fc(st,P0.c[2]));}
    else{leg(-6,PI,false);leg(7,0,true);
      // giáp váy (tassets)
      for(const [x0,w,cl] of [[-15,12,shade(A,-.2)],[-6,13,A],[5,12,shade(A,.05)]]){P(c,[x0*W,-38,(x0+w)*W,-38,(x0+w+1)*W,-18,(x0-1)*W,-18],fc(st,cl));for(let r=0;r<3;r++)for(let q=0;q<3;q++){c.strokeStyle=al(Lt,.55);c.lineWidth=.8;c.beginPath();c.arc((x0+2+q*4)*W,-34+r*6,2,0,PI);c.stroke();}L(c,[(x0-1)*W,-18.5,(x0+w+1)*W,-18.5],T,1.6);}}
    // thân giáp
    c.fillStyle=fg(st,lg(c,-14*W,-64,14*W,-36,[shade(A,.15),A,shade(A,-.35)]));c.beginPath();c.moveTo(-11*W,-37);c.lineTo(11*W,-37);c.quadraticCurveTo(16*W,-50,15*W,-63);c.lineTo(-15*W,-63);c.quadraticCurveTo(-16*W,-50,-11*W,-37);c.fill();
    if(!st.fl)for(let r=0;r<5;r++)for(let q=-3;q<=3;q++){c.strokeStyle=al(Lt,.5);c.lineWidth=.7;c.beginPath();c.arc(q*3.6*W+(r%2)*1.8,-60+r*4.6,2,0,PI);c.stroke();}
    // hộ tâm kính + đai
    c.save();glow(c,T,4);E(c,4*W,-52,6.5,6.5,fc(st,T));c.restore();E(c,4*W,-52,5,5,fc(st,rg(c,2*W,-54,6,['#ffffff',Lt,shade(Lt,-.3)])));
    if(P0.emblem==='dragon')S(c,[1*W,-50,3*W,-55,6*W,-53,7*W,-49],T,1);else E(c,4*W,-52,1.6,1.6,T);
    L(c,[-12*W,-38,12*W,-38],'#2a1a10',4);E(c,4*W,-38,3.2,2.6,T);E(c,4*W,-38,1.4,1.2,'#c8202a');
    // tay sau
    L(c,[-12*W,-58,-17*W,-46,-15*W,-36],fc(st,shade(A,-.3)),6.5);E(c,-15*W,-35,3.6,3.6,fc(st,P0.glove||'#3a2a20'));
    // vai giáp
    for(const [x,d] of [[-12,-1],[12,1]]){for(let k=0;k<3;k++){c.fillStyle=fc(st,k%2?shade(A,-.15):A);c.beginPath();c.ellipse(x*W+d*1.5,-60+k*3.2,9*W-k,4.4,d*.25,PI,0);c.fill();L(c,[x*W+d*1.5-8*W+k,-60+k*3.2,x*W+d*1.5+8*W-k,-60+k*3.2],al(T,.8),1);}}
    if(P0.lion){E(c,13*W,-63,4,3.6,fc(st,T));E(c,15*W,-63,1,1,'#c8202a');}
    // đầu
    const hx=2,hy=-74;
    if(P0.hair){const hc=P0.hair;F(c,[hx-8,hy-6,hx-14,hy+10,hx-13+Math.sin(t*2)*2,hy+30,hx-6,hy+26,hx-3,hy+4],fc(st,hc));}
    L(c,[hx,hy+6,hx,hy+12],fc(st,skin),5);
    if(P0.skull){E(c,hx,hy,9,9.5,fc(st,'#e8e0cc'));E(c,hx+2,hy+6,6,4,fc(st,'#d8d0b8'));c.save();glow(c,P0.eye||'#ff3030',8);E(c,hx+4,hy-1,2.6,2.6,'#1a0a0a');E(c,hx-2,hy-1,2.4,2.4,'#1a0a0a');E(c,hx+4,hy-1,1.2,1.2,P0.eye||'#ff3030');E(c,hx-2,hy-1,1.1,1.1,P0.eye||'#ff3030');c.restore();for(let i=-2;i<=4;i+=2)L(c,[hx+i,hy+5,hx+i,hy+8],'#3a3020',.8);}
    else{c.fillStyle=fc(st,rg(c,hx+2,hy-2,11,[shade(skin,.12),skin,shade(skin,-.25)]));c.beginPath();c.ellipse(hx,hy,8.5,9.5,0,0,PI2);c.fill();E(c,hx+8,hy+1,1.6,2.2,fc(st,shade(skin,-.1)));
      c.save();glow(c,P0.eye||'#1a1010',P0.eyeGlow?8:0);E(c,hx+5,hy-1,1.7,1.2,P0.eye||'#1a1010');E(c,hx+.5,hy-1,1.5,1.1,P0.eye||'#1a1010');c.restore();
      L(c,[hx+2.5,hy-5.6,hx+7,hy-4.4],'#1a1010',1.3);L(c,[hx-1.5,hy-5.2,hx+1.5,hy-5.4],'#1a1010',1.1);
      if(P0.fem){E(c,hx+5,hy+5,1.6,.8,'#c04050');E(c,hx+4,hy+2,2,1.2,al('#ff8090',.35));}
      else{L(c,[hx+3,hy+5,hx+7,hy+4.6],'#3a1a10',1);}
      if(P0.beard){const bc=P0.beard;F(c,[hx-2,hy+3,hx+8,hy+4,hx+7,hy+12,hx+3,hy+22+Math.sin(t*2)*1.5,hx-1,hy+12],fc(st,bc));S(c,[hx+3,hy+3.5,hx+10,hy+7,hx+12,hy+11],bc,1.4);}
      if(P0.mark)L(c,[hx+3,hy-9,hx+3,hy-6],P0.mark,1.4);
      if(P0.fem&&!P0.hair)E(c,hx-2,hy-8,9,4,fc(st,'#1a1410'));}
    if(P0.helm)helm(c,st,P0,hx,hy-2);
    // tay trước + binh khí: thủ thế / vung lên / chém xuống
    const sx=12*W,sy=-58,ang=open?1.15:atk?-2.1:.25+Math.sin(t*1.6)*.05,ex=sx+Math.sin(ang)*10,ey=sy+Math.cos(ang)*10,hx2=ex+Math.sin(ang*.6+.4)*10,hy2=ey+Math.cos(ang*.6+.4)*9;
    L(c,[sx,sy,ex,ey,hx2,hy2],fc(st,A),6.5);
    c.save();c.translate(hx2,hy2);c.rotate(open?1.6:atk?-.9:.08);weapon(c,st,P0);c.restore();
    E(c,hx2,hy2,3.6,3.6,fc(st,P0.glove||'#3a2a20'));
    c.restore();
    if(P0.fx==='ice'){c.save();for(let i=0;i<8;i++){const ph=(t*.25+hr(i))%1,x=(hr(i+3)-.5)*80,y=-20-ph*90;c.globalAlpha=1-ph;L(c,[x-2,y,x+2,y],'#e0f8ff',1);L(c,[x,y-2,x,y+2],'#e0f8ff',1);}c.restore();}
    if(P0.fx==='moon'){c.save();c.globalAlpha=.35+Math.sin(t*2)*.1;c.fillStyle=rg(c,0,-60,60,['#fff8d0aa','#fff8d000']);c.beginPath();c.arc(0,-60,60,0,PI2);c.fill();c.restore();}
    if(P0.fx==='ghost'){c.save();for(let i=0;i<5;i++){const a=t*1.2+i*1.26,x=Math.cos(a)*34,y=-50+Math.sin(a*1.3)*20;c.globalAlpha=.5;glow(c,'#80ffb0',10);E(c,x,y,3,4,'#c0ffd8');E(c,x-2,y+4,2,2.5,'#80ffb066');}c.restore();}
  }
  /* ================= RỒNG PHƯƠNG ĐÔNG (thân uốn lượn, vảy bụng, bờm, râu, sừng nai, móng vuốt) ================= */
  function dragon(c,m,M,st,P0){
    const {t,open}=st,[A,D,B,X]=P0.c,th=P0.thick||10,N=34,pts=[];
    const amp=P0.amp||13;for(let i=0;i<=N;i++){const u=i/N,x=40-u*126,y=-64+Math.sin(u*PI*2.1-t*1.8)*amp*(.3+u)+u*u*38-(P0.float?6:0);pts.push([x,y,th*(1-u*.82)+1.5]);}
    if(!P0.float)E(c,-24,-2,64,7,'#00000024');
    if(P0.float){c.save();c.globalAlpha=.75;for(let i=0;i<6;i++){const x=-70+i*24+Math.sin(t+i)*3;E(c,x,-6,14,5,'#f0f4ff');E(c,x+6,-9,9,5,'#ffffff');}c.restore();}
    if(P0.aura)aura(c,t,P0.aura,120,100,10);
    // cánh phía sau
    const wing=(d)=>{const wx=pts[8][0],wy=pts[8][1],fl=Math.sin(t*3.2)*10*d;c.save();c.globalAlpha=d<0?.85:1;const col=d<0?shade(D,-.3):D;
      c.fillStyle=fc(st,col);c.beginPath();c.moveTo(wx,wy-4);c.lineTo(wx-14,wy-56-fl);c.lineTo(wx-34,wy-70-fl);c.quadraticCurveTo(wx-34,wy-40-fl*.6,wx-50,wy-30-fl*.5);c.quadraticCurveTo(wx-36,wy-24,wx-40,wy-8);c.quadraticCurveTo(wx-24,wy-14,wx-14,wy);c.closePath();c.fill();
      for(const [ex,ey] of [[-34,-70],[-50,-30],[-40,-8]])L(c,[wx-14,wy-56-fl,wx+ex,wy+ey-(ey<-20?fl*(ey<-50?1:.5):0)],al(X,.8),1.6);L(c,[wx,wy-4,wx-14,wy-56-fl],fc(st,X),3);c.restore();};
    if(P0.wing)wing(-1);
    // chân (sau thân)
    const legAt=(i,ph,back)=>{const [x,y,r]=pts[i],k=m.moving?Math.sin((m.walk||0)+ph)*5:Math.sin(t*1.5+ph)*1.5,fy=y+r+13;const col=fc(st,back?shade(D,-.25):D);
      L(c,[x,y+r*.4,x+6+k,(y+fy)/2,x+2+k*1.4,fy],col,r*.8);E(c,x+6+k,(y+fy)/2,r*.42,r*.42,col);for(const d of [-1,0,1])L(c,[x+2+k*1.4,fy,x+6+k*1.4+d*2.5,fy+3],'#e8e0c8',1.4);};
    legAt(18,PI,true);legAt(5,0,true);
    // thân: từ đuôi lên đầu
    for(let i=N;i>=0;i--){const [x,y,r]=pts[i];c.fillStyle=fc(st,i%2?A:shade(A,-.06));c.beginPath();c.ellipse(x,y,r*1.05,r,0,0,PI2);c.fill();}
    if(!st.fl){for(let i=N;i>=1;i--){const [x,y,r]=pts[i];E(c,x+1,y+r*.5,r*.85,r*.42,B);if(i%2)L(c,[x-r*.6,y+r*.45,x+r*.6,y+r*.45],shade(B,-.25),.9);}
      for(let i=1;i<N;i+=1){const [x,y,r]=pts[i];c.strokeStyle=al(shade(A,.35),.6);c.lineWidth=.8;c.beginPath();c.arc(x,y-r*.25,r*.45,PI*1.1,PI*1.9);c.stroke();}}
    // vây lưng
    const fk=P0.finK||1;for(let i=2;i<N-2;i+=2){const [x,y,r]=pts[i];P(c,[x+3*fk,y-r*.8,x-2*fk,y-r-(7*(1-i/N)+3)*fk,x-6*fk,y-r*.7],fc(st,P0.fin||X));}
    // đuôi: chùm lông lửa
    {const [x,y,r]=pts[N];for(let k=0;k<5;k++){const a=PI*.75+k*.2+Math.sin(t*3+k)*.12;F(c,[x,y,x+Math.cos(a)*14,y+Math.sin(a)*14-4,x+Math.cos(a)*22,y+Math.sin(a)*22],fc(st,k%2?X:P0.mane||X));}}
    legAt(16,0,false);legAt(3,PI,false);
    if(P0.wing)wing(1);
    // đầu
    const [hx,hy0]=pts[0],hy=hy0-6,sway=Math.sin(t*1.8)*2;c.save();c.translate(hx+4,hy+sway);c.rotate(open?-.12:0);
    // bờm
    const mn=P0.mane||X;for(let k=0;k<7;k++){const a=PI*.85+k*.18,w=Math.sin(t*3+k)*2;F(c,[-2,-4,Math.cos(a)*18-4+w,Math.sin(a)*14-6,Math.cos(a+.12)*26-6+w,Math.sin(a+.12)*18-4,Math.cos(a+.2)*14-4,Math.sin(a+.2)*10],fc(st,k%2?mn:shade(mn,-.2)));}
    // sừng nai
    for(const d of [0,1]){const ox=-2+d*4,col=fc(st,P0.horn||'#e8d8a8');S(c,[ox,-10,ox-6,-22,ox-14,-30],col,2.6);S(c,[ox-5,-20,ox-2,-28],col,1.8);S(c,[ox-10,-27,ox-9,-35],col,1.6);}
    // hàm dưới
    c.save();c.translate(6,6);c.rotate(open?.42:.08);F(c,[-4,-2,22,0,26,4,20,6,-2,6],fc(st,shade(A,-.15)));if(open){c.fillStyle='#ffffff';for(let x=4;x<22;x+=4)P(c,[x,-1,x+1.5,-4,x+3,-1],'#ffffff');}c.restore();
    // sọ + mõm
    c.fillStyle=fc(st,lg(c,-10,-14,30,6,[shade(A,.15),A,shade(A,-.2)]));c.beginPath();c.moveTo(-10,2);c.quadraticCurveTo(-8,-14,6,-12);c.quadraticCurveTo(20,-10,30,-4);c.quadraticCurveTo(33,2,28,6);c.lineTo(6,8);c.quadraticCurveTo(-6,10,-10,2);c.fill();
    E(c,4,-12,6,3,fc(st,shade(A,.25)));P(c,[2,-12,8,-15,14,-12],fc(st,X));
    if(open){c.fillStyle='#ffffff';for(let x=8;x<28;x+=4)P(c,[x,5,x+1.5,9,x+3,5],'#ffffff');}
    E(c,29,-2,1.6,1.2,'#1a0a0a');
    c.save();glow(c,P0.eye||'#ffd040',10);E(c,8,-7,3,2.2,P0.eye||'#ffd040');c.restore();E(c,8.6,-7,1,1.6,'#1a0a0a');L(c,[3,-10,13,-9.5],'#1a0a0a',1.2);
    // râu dài
    for(const d of [0,1]){const w=Math.sin(t*2.4+d)*5;S(c,[26,2+d*2,34,6+w*.4,44,4+w,54,10+w*.6,60,6+w],fc(st,P0.whisker||X),1.3);}
    c.restore();
    // ngọc
    if(P0.pearl){const [x,y]=pts[3];c.save();glow(c,P0.pearl,16);E(c,x+16,y+16+Math.sin(t*2)*3,5,5,P0.pearl);c.restore();E(c,x+14.5,y+14.5+Math.sin(t*2)*3,1.6,1.6,'#ffffff');}
    if(P0.fire){for(let i=4;i<N-6;i+=5){const [x,y,r]=pts[i];flames(c,t+i*.13,x,y-r,.7,['#ff6020','#ffd060'],2);}}
    if(P0.drip){c.save();c.fillStyle=P0.drip;for(let i=0;i<7;i++){const ph=(t*.7+hr(i+60))%1,[x,y,r]=pts[3+i*4];c.globalAlpha=1-ph;c.beginPath();c.ellipse(x,y+r+ph*40,1.4,2.4,0,0,PI2);c.fill();}c.restore();}
    if(P0.breath&&open){c.save();for(let k=0;k<9;k++){const u=k/9;c.globalAlpha=.75*(1-u);glow(c,P0.breath,12);E(c,hx+34+u*70,hy+8+Math.sin(t*20+k)*3+u*10,5+u*12,4+u*8,P0.breath);}c.restore();}
  }
  /* ================= CHIM THẦN (lớp lông, cánh lớn, đuôi dài, mào, móng) ================= */
  function feather(c,x,y,a,len,w,col,edge){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=col;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(len*.5,-w,len,0);c.quadraticCurveTo(len*.5,w*.7,0,0);c.fill();if(edge){L(c,[0,0,len*.92,0],edge,.7);}c.restore();}
  function bird(c,m,M,st,P0){
    const {t,open}=st,[A,D,Lt,X]=P0.c,sp=P0.slow?3:5,fl=Math.sin(t*sp),by=-58+Math.sin(t*sp)*4;
    E(c,0,-2,30,6,'#00000026');
    if(P0.fx==='wind')for(let i=0;i<3;i++)swirl(c,t+i,(-30+i*30),-30-i*12,22,'#e8f6ff');
    c.save();c.translate(0,by);
    const wing=(front)=>{const up=fl*(front?1:.85),col=front?A:shade(A,-.3),ox=front?2:-6;c.save();c.translate(ox,-8);c.rotate(.55-up*.5);
      for(let k=0;k<9;k++)feather(c,-2-k*3.2,-2-k*.6,-PI*.97+k*.06,44-k*1.2,6,fc(st,k%2?shade(col,-.12):col),al(Lt,.6));
      for(let k=0;k<7;k++)feather(c,-2-k*3,-2,-PI*.9+k*.06,26,6,fc(st,shade(col,.12)),null);
      for(let k=0;k<6;k++){c.fillStyle=fc(st,Lt);c.beginPath();c.arc(-6-k*5,-4,4,0,PI);c.fill();}c.restore();};
    wing(false);
    // đuôi
    const tl=P0.tail||5;for(let k=0;k<tl;k++){const a=PI*.92+(k-(tl-1)/2)*.12+Math.sin(t*2+k)*.04,len=(P0.longTail?56:30)+k%2*8;feather(c,-16,4,a,len,7,fc(st,k%2?X:D),al(Lt,.5));if(P0.longTail){const ex=-16+Math.cos(a)*len,ey=4+Math.sin(a)*len;E(c,ex,ey,3.5,3.5,fc(st,Lt));E(c,ex,ey,1.6,1.6,X);}}
    // móng
    for(const x of [-4,6]){L(c,[x,10,x+2,26],'#c8a040',2.2);for(const d of [-1,0,1])L(c,[x+2,26,x+2+d*3,30],'#2a2018',1.4);}
    // thân
    c.fillStyle=fc(st,lg(c,0,-16,0,16,[shade(A,.1),A,D]));c.beginPath();c.ellipse(0,0,20,14,-.15,0,PI2);c.fill();
    if(!st.fl)for(let r=0;r<3;r++)for(let q=0;q<4;q++){c.fillStyle=al(Lt,.55);c.beginPath();c.arc(-6+q*6-r*2,2+r*4,3,0,PI);c.fill();}
    // cổ, đầu (cổ ngắn, đầu sát thân)
    F(c,[10,-8,15,-15,18,-20,26,-20,24,-8,16,4],fc(st,A));c.save();c.translate(-4,8);
    E(c,25,-29,9,8,fc(st,A));E(c,27,-26,6,4,fc(st,Lt));
    for(let k=0;k<(P0.crest||4);k++){const a=-PI*.75-k*.22+Math.sin(t*3+k)*.05;feather(c,22,-35,a,14+k*2,3,fc(st,k%2?X:Lt),null);}
    // mỏ
    F(c,[31,-31,42,-30,46,-25,40,-26,33,-26],fc(st,P0.beak||'#e8b040'));c.save();c.translate(33,-25);c.rotate(open?.35:0);P(c,[0,0,10,1,6,4],fc(st,shade(P0.beak||'#e8b040',-.2)));c.restore();
    c.save();glow(c,P0.eye||'#ffff80',8);E(c,29,-31,2.2,2,P0.eye||'#ffff80');c.restore();E(c,29.6,-31,.9,1.4,'#1a0a0a');c.restore();
    wing(true);
    c.restore();
    if(P0.fx==='thunder'){const k=Math.floor(t*6);if(hr(k)>.35){bolt(c,(hr(k+1)-.5)*60,-130,(hr(k+2)-.5)*80,-70,k,'#c0c8ff');}c.save();glow(c,'#a0a8ff',14);E(c,0,by,22,16,'#a0a8ff18');c.restore();}
    if(P0.fx==='fire')flames(c,t,0,by+10,2.2,['#ff5a20','#ffd060'],8);
  }
  /* ================= HỒ LY CHÍN ĐUÔI ================= */
  function fox(c,m,M,st,P0,mount){
    const {t,open}=st,[A,D,Lt,X]=P0.c,mv=m.moving?1:0,g=m.walk||0,n=P0.tails||9,s=mount?.72:1;
    c.save();c.scale(s,s);
    if(P0.fire&&!mount)for(let i=0;i<5;i++){const a=t*.9+i*1.26,x=Math.cos(a)*48-8,y=-60+Math.sin(a*1.4)*24;c.save();glow(c,P0.fire,14);E(c,x,y,3.6,4.6,P0.fire);c.restore();E(c,x,y+1,1.6,2,'#ffffff');}
    // đuôi bông xòe hình quạt (mỗi đuôi: thân màu chính, chóp màu sáng)
    for(let k=0;k<n;k++){const u=n>1?k/(n-1):.5,a=-PI*.98+u*PI*.55+Math.sin(t*2+k*.7)*.06,len=44+(k%3)*5,bx=-24,by=-38,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,w=len*.24,cv=Math.sin(t*1.6+k)*4;
      const tx=bx+dx*len+nx*cv,ty=by+dy*len+ny*cv,tail=(f0,ww,col)=>{const sx=bx+dx*len*f0,sy=by+dy*len*f0;c.fillStyle=col;c.beginPath();c.moveTo(sx+nx*ww*.3,sy+ny*ww*.3);c.quadraticCurveTo(bx+dx*len*(f0+.45*(1-f0))+nx*ww,by+dy*len*(f0+.45*(1-f0))+ny*ww,tx,ty);c.quadraticCurveTo(bx+dx*len*(f0+.45*(1-f0))-nx*ww,by+dy*len*(f0+.45*(1-f0))-ny*ww,sx-nx*ww*.3,sy-ny*ww*.3);c.closePath();c.fill();};
      tail(0,w,fc(st,k%2?A:shade(A,-.06)));tail(.62,w*.62,fc(st,Lt));
      if(!st.fl)S(c,[bx+dx*len*.2,by+dy*len*.2,bx+dx*len*.7+nx*cv*.5,by+dy*len*.7+ny*cv*.5],al(shade(A,-.25),.6),1);
      if(P0.tipGlow){c.save();glow(c,P0.tipGlow,10);E(c,tx,ty,2.6,2.6,al(P0.tipGlow,.9));c.restore();}}
    // chân
    const leg=(x,ph,back)=>{const k=Math.sin(g*1.4+ph)*mv,col=fc(st,back?shade(A,-.22):A);L(c,[x,-28,x+k*5,-13,x+k*4,-2],col,6);L(c,[x+k*5,-13,x+k*4,-2],fc(st,back?shade(D,-.2):D),4.4);E(c,x+k*4+1.5,-1,3.6,2,fc(st,shade(D,-.35)));};
    leg(-16,0,true);leg(14,PI,true);
    // thân
    c.fillStyle=fc(st,lg(c,0,-48,0,-18,[shade(A,.1),A,shade(A,-.15)]));c.beginPath();c.ellipse(-2,-33,28,15,-.05,0,PI2);c.fill();E(c,2,-24,20,5.5,fc(st,Lt));
    leg(-10,PI,false);leg(20,0,false);
    // ức lông trắng + cổ
    F(c,[14,-38,26,-56,34,-50,30,-30,20,-22],fc(st,A));F(c,[22,-42,30,-52,32,-36,26,-24,20,-30],fc(st,Lt));
    // đầu
    c.save();c.translate(33,-58);c.scale(1.18,1.18);c.rotate(open?-.15:Math.sin(t*1.5)*.04);
    for(const [ex,d] of [[-6,0],[2,1]]){P(c,[ex-4,-6,ex+1-d,-24,ex+5,-5],fc(st,d?A:shade(A,-.2)));P(c,[ex-2,-7,ex+1-d,-19,ex+3,-6],fc(st,'#f0a0b0'));}
    c.fillStyle=fc(st,lg(c,-6,-10,22,6,[shade(A,.12),A]));c.beginPath();c.moveTo(-8,0);c.quadraticCurveTo(-6,-10,4,-10);c.quadraticCurveTo(14,-8,24,-1);c.quadraticCurveTo(22,4,12,5);c.quadraticCurveTo(-4,8,-8,0);c.fill();
    F(c,[-6,2,4,6,12,4,4,0],fc(st,Lt));E(c,23.5,-1,2,1.6,'#1a1010');
    if(open){P(c,[10,3,22,1,18,7],'#5a1f1a');P(c,[13,3,14,6,15,3],'#ffffff');}
    c.save();glow(c,P0.eye||'#ff3080',8);c.fillStyle=P0.eye||'#ff3080';c.beginPath();c.moveTo(4,-5);c.quadraticCurveTo(8,-7.5,11,-5);c.quadraticCurveTo(8,-3.8,4,-5);c.fill();c.restore();L(c,[8,-6.5,8,-3.6],'#1a0a0a',.9);
    if(P0.marks){L(c,[3,-9,10,-6],P0.marks,1.2);L(c,[-2,-4,1,1],P0.marks,1.2);}
    c.restore();
    c.restore();
  }
  /* ================= TRĂN TINH / RẮN HỔ MANG ================= */
  function serpent(c,m,M,st,P0){
    const {t,open}=st,[A,D,B,X]=P0.c;
    // khoanh trên đất
    for(let r=2;r>=0;r--){const y=-6-r*11,rx=46-r*9,ry=10-r*1.2;c.lineWidth=13-r*1.5;c.strokeStyle=fc(st,r%2?shade(A,-.12):A);c.beginPath();c.ellipse(-8,y,rx,ry,0,0,PI2);c.stroke();
      if(!st.fl)for(let k=0;k<14;k++){const a=k/14*PI2+r,x=-8+Math.cos(a)*rx,yy=y+Math.sin(a)*ry;if(Math.sin(a)<-.2)continue;P(c,[x-3,yy,x,yy-3,x+3,yy,x,yy+3],X);}}
    // cổ vươn lên
    const sw=Math.sin(t*1.6)*5,hx=22+sw,hy=-92+Math.sin(t*2)*3+(open?8:0);
    const neck=[-2,-30,6,-48,20+sw*.3,-62,14+sw*.6,-78,hx,hy+8];
    c.lineCap='round';c.strokeStyle=fc(st,A);c.lineWidth=15;c.beginPath();curve(c,neck);c.stroke();c.strokeStyle=fc(st,B);c.lineWidth=7;c.beginPath();curve(c,neck.map((v,i)=>i%2?v:v+4));c.stroke();
    if(!st.fl)for(let k=0;k<8;k++){const u=k/8,x=-2+(hx+4-(-2))*u,y=-30+(hy+8+30)*u;L(c,[x+1,y,x+7,y-1],shade(B,-.25),.8);}
    // mang rắn hổ mang
    if(P0.hood){c.fillStyle=fc(st,lg(c,hx-20,hy,hx+10,hy+30,[shade(A,.1),D]));c.beginPath();c.moveTo(hx-4,hy-2);c.quadraticCurveTo(hx-26,hy+8,hx-16,hy+34);c.quadraticCurveTo(hx-4,hy+26,hx+6,hy+30);c.quadraticCurveTo(hx+18,hy+10,hx+4,hy-2);c.fill();
      c.save();glow(c,X,6);E(c,hx-10,hy+14,4,3,X);E(c,hx+4,hy+16,3,2.4,X);c.restore();E(c,hx-10,hy+14,1.6,1.4,'#1a1010');E(c,hx+4,hy+16,1.3,1.1,'#1a1010');}
    // đầu
    c.save();c.translate(hx,hy);c.rotate(open?-.25:.05);
    c.fillStyle=fc(st,lg(c,-6,-10,22,8,[shade(A,.2),A,D]));c.beginPath();c.moveTo(-8,2);c.quadraticCurveTo(-8,-10,6,-10);c.quadraticCurveTo(20,-8,26,-2);c.quadraticCurveTo(24,4,16,5);c.quadraticCurveTo(0,8,-8,2);c.fill();
    if(P0.horn)for(const d of [0,1])S(c,[2+d*3,-8,-4+d*3,-18,-10+d*2,-22],P0.horn,2.4);
    c.save();glow(c,P0.eye||'#ffe040',8);E(c,9,-4,2.8,2,P0.eye||'#ffe040');c.restore();L(c,[9,-6,9,-2],'#1a0a0a',1);
    if(open){c.save();c.rotate(.5);F(c,[-2,4,22,4,18,10,0,9],'#5a1f1a');c.restore();P(c,[14,4,15.5,12,17,4],'#ffffff');P(c,[19,3,20,9,21,3],'#ffffff');}
    if(open||Math.sin(t*4)>.7){S(c,[24,1,32,2,36,-1],'#ff4060',1.2);S(c,[32,2,36,5],'#ff4060',1.2);}
    c.restore();
    if(P0.poison){c.save();for(let i=0;i<5;i++){const ph=(t*.6+hr(i))%1;c.globalAlpha=1-ph;glow(c,'#a0ff60',8);E(c,(hr(i+4)-.5)*90,-ph*70,2.4,2.4,'#a0ff60');}c.restore();}
  }
  /* ================= CHÚA SƠN LÂM (hổ) ================= */
  function tigerKing(c,m,M,st,P0){
    const {t,open}=st,mv=m.moving?1:0,g=m.walk||0,A=P0.c[0],D=P0.c[1],W='#f8f0e0',K='#1a1410';
    const leg=(x,ph,back)=>{const k=Math.sin(g*1.3+ph)*mv,col=fc(st,back?shade(A,-.25):A);E(c,x,-38,10,9,col);F(c,[x-6,-38,x+6,-38,x+k*8+4,-16,x+k*5+4,-2,x+k*5-4,-2,x+k*8-4,-16],col);if(!st.fl)for(const y of [-30,-22])L(c,[x+k*(y+38)/22*6-4,y,x+k*(y+38)/22*6+3,y-2],K,1.6);E(c,x+k*5+2,-1,6,3.4,fc(st,W));for(const d of [-2,0,2])L(c,[x+k*5+3+d,-1,x+k*5+4+d,1],K,.8);};
    // đuôi
    const tw=Math.sin(t*2.4)*6;c.strokeStyle=fc(st,A);c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(-40,-44);c.quadraticCurveTo(-62,-48+tw,-60,-74+tw);c.stroke();for(let k=0;k<4;k++){const u=.3+k*.18;L(c,[-40-22*u-2,-44-(4-tw)*u-6*u*u-2,-40-22*u+2,-44-(4-tw)*u-6*u*u+2],K,2);}E(c,-60,-75+tw,3.4,3.4,fc(st,K));
    leg(-28,0,true);leg(20,PI,true);
    c.fillStyle=fc(st,lg(c,0,-62,0,-26,[shade(A,.15),A,shade(A,-.15)]));c.beginPath();c.ellipse(-6,-44,40,18,-.04,0,PI2);c.fill();E(c,-4,-31,30,6,fc(st,W));
    if(!st.fl)for(let k=0;k<7;k++){const x=-38+k*10;F(c,[x,-61,x+4,-52,x+1,-42,x-2,-50],K);}
    leg(-20,PI,false);leg(28,0,false);
    // đầu
    c.save();c.translate(36,-58+Math.sin(t*1.5));c.rotate(open?-.12:0);
    for(const d of [-1,1])E(c,-4+d*7,-15,5,5,fc(st,A)),E(c,-4+d*7,-15,2.6,2.6,fc(st,'#e8a0a0'));
    E(c,0,0,17,15,fc(st,A));E(c,-6,6,10,8,fc(st,W));E(c,8,6,11,8,fc(st,W));
    // ria má
    for(const d of [-1,1])F(c,[-12,0+d*2,-22,4+d*4,-16,10,-10,8],fc(st,W));
    if(!st.fl){for(const [x,y] of [[-10,-6],[-12,2],[6,-12]])L(c,[x,y,x+5,y+2],K,1.6);L(c,[-3,-12,3,-12],K,1.6);L(c,[0,-14,0,-8],K,1.6);L(c,[-3,-10,3,-10],K,1.2);}
    E(c,12,1,3.6,2.6,fc(st,'#c87070'));
    c.save();glow(c,'#ffe060',8);E(c,4,-5,3.4,2.4,'#ffe060');E(c,-6,-5,3,2.2,'#ffe060');c.restore();E(c,4.4,-5,1,2,K);E(c,-5.6,-5,.9,1.8,K);
    c.save();c.translate(6,10);c.rotate(open?.4:0);F(c,[-6,0,10,0,8,6,-4,6],fc(st,'#5a1f1a'));P(c,[0,0,1.5,5,3,0],'#ffffff');P(c,[6,0,7,4,8,0],'#ffffff');c.restore();
    for(const d of [-1,1])L(c,[12,6,22,6+d*3],'#ffffffaa',.7);
    c.restore();
  }
  /* ================= NGƯ TINH (cá khổng lồ) ================= */
  function fishKing(c,m,M,st,P0){
    const {t,open}=st,[A,D,B,X]=P0.c,bob=Math.sin(t*1.6)*4,tw=Math.sin(t*3.2)*.25;
    c.save();c.globalAlpha=.55;for(let i=0;i<3;i++){c.strokeStyle='#c8f0ff';c.lineWidth=1.5;c.beginPath();c.ellipse(0,-2,40+i*12+Math.sin(t*2+i)*3,6+i*2,0,0,PI2);c.stroke();}c.restore();
    c.save();c.translate(0,-46+bob);c.rotate(-.18);
    // đuôi
    c.save();c.translate(-42,0);c.rotate(tw);F(c,[0,0,-22,-26,-14,-6,-26,8,-18,14,-4,6],fc(st,X));for(let k=-2;k<=2;k++)L(c,[0,0,-20,k*8],al(shade(X,-.3),.7),1);c.restore();
    // vây lưng
    F(c,[-26,-20,-20,-38,-8,-34,2,-44,10,-30,16,-22],fc(st,X));for(let k=0;k<5;k++)L(c,[-20+k*8,-22,-18+k*7,-38+k%2*4],shade(X,-.3),1);
    // thân
    c.fillStyle=fc(st,lg(c,0,-26,0,24,[shade(A,.2),A,D]));c.beginPath();c.ellipse(0,0,44,24,0,0,PI2);c.fill();
    E(c,4,10,34,10,fc(st,B));
    if(!st.fl)for(let r=0;r<4;r++)for(let q=0;q<8;q++){c.strokeStyle=al(shade(A,.45),.7);c.lineWidth=1;c.beginPath();c.arc(-26+q*7+(r%2)*3.5,-14+r*7,4,PI*.5,PI*1.5);c.stroke();}
    // vây ngực
    c.save();c.translate(6,8);c.rotate(.6+Math.sin(t*4)*.2);F(c,[0,0,-6,18,6,22,10,6],fc(st,X));c.restore();
    // đầu
    F(c,[24,-18,40,-12,48,0,44,14,28,20],fc(st,shade(A,-.05)));
    c.save();c.translate(42,6);c.rotate(open?.35:.05);F(c,[-10,0,10,-2,12,4,-8,8],fc(st,D));c.restore();
    if(open){F(c,[30,2,46,0,44,10,32,10],'#4a0a14');for(let x=32;x<46;x+=3)P(c,[x,1,x+1.2,5,x+2.4,1],'#ffffff');}
    else for(let x=32;x<46;x+=3.5)P(c,[x,4,x+1.2,8,x+2.4,4],'#ffffff');
    c.save();glow(c,P0.eye||'#ffe040',10);E(c,34,-6,4,4,P0.eye||'#ffe040');c.restore();E(c,35,-6,1.6,2.8,'#1a0a0a');
    for(const d of [0,1]){const w=Math.sin(t*2.6+d)*4;S(c,[46,6+d*3,56,10+w*.5,64,6+w,70,14+w*.6],fc(st,X),1.4);}
    L(c,[22,-14,26,14],al(shade(A,-.4),.8),1.6);
    c.restore();
    c.save();for(let i=0;i<6;i++){const ph=(t*.8+hr(i))%1;c.globalAlpha=1-ph;E(c,(hr(i+2)-.5)*70,-8-ph*60,1.6,1.6,'#d8f6ff');}c.restore();
  }
  /* ================= THẠCH TINH (người đá) và MỘC TINH (cây) ================= */
  function rockGolem(c,m,M,st,P0){
    const {t,open,atk}=st,[A,D,Lt,X]=P0.c,mv=m.moving?Math.sin(m.walk||0):0,lift=open?-34:atk?-12:Math.sin(t*1.4)*3;
    const rock=(x,y,rx,ry,rot=0)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=fc(st,D);c.beginPath();c.moveTo(-rx,0);c.lineTo(-rx*.7,-ry);c.lineTo(rx*.4,-ry*1.05);c.lineTo(rx,-ry*.2);c.lineTo(rx*.8,ry*.8);c.lineTo(-rx*.5,ry);c.closePath();c.fill();
      c.fillStyle=fc(st,lg(c,-rx,-ry,rx,ry,[shade(A,.2),A,shade(A,-.15)]));c.beginPath();c.moveTo(-rx+2,0);c.lineTo(-rx*.68+1,-ry+2);c.lineTo(rx*.38,-ry+2);c.lineTo(rx-2,-ry*.2);c.lineTo(rx*.76,ry*.7);c.lineTo(-rx*.46,ry-2);c.closePath();c.fill();
      if(!st.fl){L(c,[-rx*.3,-ry*.5,0,0,rx*.2,ry*.4],shade(D,-.2),1);L(c,[0,0,rx*.4,-ry*.3],shade(D,-.2),.8);}c.restore();};
    rock((-14-mv*5),-12,11,13);rock((14+mv*5),-12,11,13);
    c.save();c.translate(-26,-54);c.rotate(-.25);rock(0,10,9,15);rock(-2,30,11,10);c.restore();
    rock(0,-46,28,26);
    // lõi phát sáng
    c.save();glow(c,X,16+Math.sin(t*3)*6);E(c,2,-48,6,6,X);c.restore();if(!st.fl)for(const a of [.3,1.6,2.8,4.2,5.4])L(c,[2,-48,2+Math.cos(a)*16,-48+Math.sin(a)*14],al(X,.8),1.4);
    // pha lê mọc trên vai
    if(P0.crystal)for(const [x,y,h] of [[-18,-66,14],[-10,-70,20],[16,-66,12]]){c.save();glow(c,P0.crystal,8);P(c,[x-3,y,x,y-h,x+3,y],P0.crystal);c.restore();L(c,[x,y-2,x,y-h+2],'#ffffff99',.8);}
    c.save();c.translate(26,-54);c.rotate(.8+lift/40);rock(0,10,9,15);rock(3,30,12,11);c.restore();
    rock(3,-70,14,12);c.save();glow(c,P0.eye||'#ff8a2a',10);P(c,[1,-73,7,-72,6,-69,1,-70],P0.eye||'#ff8a2a');P(c,[10,-72,15,-72,14,-69,10,-69],P0.eye||'#ff8a2a');c.restore();
    if(m.moving||atk){c.save();c.globalAlpha=.5;for(let i=0;i<4;i++)E(c,(hr(i)-.5)*40,-2-hr(i+5)*4,2,2,shade(A,-.1));c.restore();}
  }
  function ent(c,m,M,st,P0){
    const {t,open,atk}=st,[A,D,Lf,X]=P0.c,mv=m.moving?Math.sin(m.walk||0):0,sway=Math.sin(t*1.3)*2;
    // rễ chân
    for(const [x,ph] of [[-12,0],[10,PI]]){const k=m.moving?Math.sin((m.walk||0)+ph)*6:0;S(c,[x,-30,x+k,-14,x+k-6,-2,x+k-12,0],fc(st,D),7);S(c,[x+k,-10,x+k+8,0],fc(st,D),4);}
    // thân cây
    c.fillStyle=fc(st,lg(c,-18,0,18,0,[shade(A,-.3),A,shade(A,-.15)]));c.beginPath();c.moveTo(-16,-28);c.quadraticCurveTo(-20,-60,-14+sway,-88);c.lineTo(14+sway,-88);c.quadraticCurveTo(20,-60,16,-28);c.closePath();c.fill();
    if(!st.fl){for(let k=0;k<6;k++){const x=-12+k*5;S(c,[x,-30,x+Math.sin(k)*3,-55,x+sway,-84],shade(A,-.35),1.1);}E(c,-6,-46,4,2,shade(A,-.3));}
    // rêu
    for(let k=0;k<5;k++)E(c,-14+k*6,-30+Math.sin(k)*2,4,2,fc(st,shade(Lf,-.2)));
    // mặt
    E(c,-1+sway*.5,-66,4,3,'#1a0e06');E(c,9+sway*.5,-66,3.6,2.8,'#1a0e06');c.save();glow(c,P0.eye||'#d8ff60',10);E(c,-1+sway*.5,-66,1.8,1.4,P0.eye||'#d8ff60');E(c,9+sway*.5,-66,1.6,1.2,P0.eye||'#d8ff60');c.restore();
    F(c,[0,-56,10,-56,8,open?-48:-53,2,open?-48:-53],'#1a0e06');
    // cành tay
    const arm=(d,lift)=>{c.save();c.translate(d*12+sway,-74);c.rotate(d*(.9-lift));S(c,[0,0,d*10,6,d*20,4,d*30,10],fc(st,D),6);S(c,[d*20,4,d*26,-4],fc(st,D),3);S(c,[d*28,9,d*34,6],fc(st,D),2.4);
      for(const [x,y] of [[d*26,-6],[d*34,6],[d*20,8]])E(c,x,y,6,5,fc(st,Lf));c.restore();};
    arm(-1,0);
    // tán lá
    for(let k=0;k<9;k++){const a=k/9*PI2,x=Math.cos(a)*24+sway,y=-98+Math.sin(a)*12;E(c,x,y,14,11,fc(st,k%2?Lf:shade(Lf,-.15)));}
    E(c,sway,-104,18,13,fc(st,shade(Lf,.1)));for(let k=0;k<6;k++)E(c,(hr(k)-.5)*40+sway,-100+(hr(k+3)-.5)*16,2,2,fc(st,X));
    arm(1,open?.9:atk?.4:0);
    c.save();for(let i=0;i<6;i++){const a=t*.8+i,x=Math.cos(a)*40,y=-70+Math.sin(a*1.3)*30;c.globalAlpha=.6+Math.sin(t*4+i)*.3;glow(c,'#e8ff80',8);E(c,x,y,1.4,1.4,'#f0ffa0');}c.restore();
  }
  /* ================= DANH SÁCH BOSS ================= */
  const H=(fn,P0,k=1)=>(c,m,M,st)=>{const s=(M&&M.h||100)*1.3/100*k;c.save();c.scale(s,s);try{fn(c,m,M,st,P0);}finally{c.restore();}};
  const B={
    'chua-son-lam':H(tigerKing,{c:['#e88a2a','#a85a18']},1.25),
    'ngu-tinh':H(fishKing,{c:['#3a8aa8','#1a4a68','#d8f0f0','#e8c050'],eye:'#ffe040'},1.05),
    'chan-tinh':H(serpent,{c:['#6a7a3a','#3a4a1a','#d8d0a0','#2a3010'],eye:'#ff4020',horn:'#d8c890'}),
    'thach-tinh':H(rockGolem,{c:['#c09060','#7a5030','#e8c890','#ff8a2a'],eye:'#ffb040',crystal:'#ffd080'}),
    'ho-tinh':H(fox,{c:['#f4f8ff','#c0c8d8','#ffffff','#80c0ff'],eye:'#40c0ff',tipGlow:'#a0e0ff',fire:'#a0e0ff',marks:'#4080ff'},.95),
    'dai-bang':H(bird,{c:['#7a5030','#4a2a14','#e8d0a0','#f0e8d8'],beak:'#e8b040',eye:'#ffd040',crest:3,tail:6},1.05),
    'moc-tinh':H(ent,{c:['#6a4a2a','#4a3018','#5a9a3a','#e8ff80'],eye:'#d8ff60'},.95),
    'xa-tinh':H(serpent,{c:['#3a8a4a','#1f4a2c','#e8e0a0','#e8d040'],eye:'#ffe040',hood:1,poison:1}),
    'loi-dieu':H(bird,{c:['#3a3a7a','#20204a','#a0a8ff','#ffe040'],beak:'#ffd040',eye:'#ffffa0',crest:6,tail:7,slow:1,fx:'thunder'},1.1),
    'tuong-am-binh':H(warlord,{c:['#4a5a7a','#2a3a5a','#9aaac0','#c8b060'],skin:'#9aaabb',eye:'#80ff90',eyeGlow:1,helm:'plume',weapon:'sword',wglow:'#80ff90',cape:'#2a3a4a',ghost:1,aura:'#80ffb0',fx:'ghost'}),
    'thuong-luong':H(dragon,{c:['#2a7a9a','#1a4a6a','#c0e8f0','#e8e8a0'],eye:'#80ffff',mane:'#a0e0f0',whisker:'#e8f8ff',breath:'#a0e8ff',thick:11}),
    'hoa-long':H(dragon,{c:['#c83a20','#7a2010','#ffc070','#ffd040'],eye:'#ffff80',mane:'#ff9a30',wing:1,breath:'#ff9a40',fire:1,horn:'#3a1a10'}),
    'chua-quy':H(warlord,{c:['#4a1a3a','#2a0a20','#a05090','#e0a030'],skin:'#8a3a6a',eye:'#ff2060',eyeGlow:1,helm:'horn',weapon:'mace',wcol:'#4a3a40',wglow:'#ff40a0',cape:'#3a0a1a',bulk:1.2,aura:'#ff40a0',lion:1}),
    'bang-hoang':H(warlord,{c:['#8ab8e0','#4a7aa8','#e0f4ff','#ffffff'],skin:'#e0eeff',eye:'#40c0ff',eyeGlow:1,helm:'icecrown',weapon:'staff',wcol:'#c0f0ff',wglow:'#80e0ff',ice:1,fem:1,robe:1,hair:'#d8eeff',cape:'#a0c8f0',aura:'#a0e0ff',fx:'ice'}),
    'hac-long-tuong':H(warlord,{c:['#2a2a3a','#141420','#6a6a8a','#e0b040'],skin:'#c8a080',eye:'#ff4040',helm:'dragon',weapon:'guandao',wcol:'#c8d0d8',pole:'#2a1a1a',cape:'#6a1010',beard:'#1a1410',emblem:'dragon',lion:1,bulk:1.1}),
    'ma-vuong':H(dragon,{c:['#4a1a5a','#1a0a2a','#a070c0','#ff40a0'],eye:'#ff2060',mane:'#c040ff',wing:1,breath:'#c040ff',horn:'#1a0a1a',aura:'#c040ff'}),
    'long-vuong':H(dragon,{c:['#2a7ab0','#1a4a80','#c8ecff','#ffe060'],eye:'#ffffff',mane:'#ffe060',whisker:'#ffe8a0',pearl:'#e0f8ff',breath:'#90d8ff',float:1,horn:'#ffe8a0'}),
    'hac-mo-vuong':H(warlord,{c:['#3a3434','#1a1414','#8a7a6a','#c0a060'],skin:'#e8e0cc',skull:1,eye:'#ff4030',helm:'skull',weapon:'staff',wcol:'#ff6040',wglow:'#ff4020',cape:'#2a1a1a',robe:1,aura:'#ff6040',bulk:1.1}),
    'phong-vuong':H(bird,{c:['#7a9ac0','#4a6a90','#e0f0ff','#ffe060'],beak:'#ffe060',eye:'#ffffff',crest:5,tail:7,longTail:1,slow:1,fx:'wind'},1.1),
    'su-quan':H(warlord,{c:['#8a2a2a','#4a1010','#d07070','#e0b040'],skin:'#d0a070',eye:'#1a1010',helm:'plume',weapon:'spear',wcol:'#e0e4e8',cape:'#3a1010',beard:'#2a1a10',lion:1,bulk:1.1}),
    'diem-la-tuong':H(warlord,{c:['#2a1a2a','#140a14','#8a5a7a','#e04040'],skin:'#7a3a3a',eye:'#ff2020',eyeGlow:1,helm:'mian',weapon:'sword',wcol:'#ff8080',wglow:'#ff2020',cape:'#4a0a0a',robe:1,beard:'#1a0a0a',aura:'#ff3030',bulk:1.15}),
    'hai-long-vuong':H(dragon,{c:['#1a7a5a','#0a4a30','#b0f0c8','#ffe060'],eye:'#ffffff',mane:'#60e0a0',whisker:'#e0ffe8',wing:1,breath:'#80ffc0',pearl:'#c0ffe0',thick:12}),
    'cuu-vi-ho':H(fox,{c:['#fff0e8','#d8b0a0','#ffffff','#ff4080'],eye:'#ff2080',tipGlow:'#ff60a0',fire:'#ff60b0',marks:'#e02060'},1.05),
    'nguyet-than':H(warlord,{c:['#eef0ff','#a8b0d8','#ffffff','#ffe070'],skin:'#fff4ec',eye:'#4060c0',helm:'tiara',weapon:'staff',moon:1,wcol:'#fff0b0',wglow:'#fff4c0',fem:1,robe:1,hair:'#1a1430',cape:'#c8d0ff',aura:'#fff4c0',fx:'moon'}),
    'hac-de':H(warlord,{c:['#1a1a2a','#0a0a14','#5a5a7a','#ffd040'],skin:'#c8b090',eye:'#ff2020',eyeGlow:1,helm:'mian',weapon:'sword',wcol:'#e8e0c0',wglow:'#ffd040',cape:'#6a0a0a',robe:1,beard:'#0a0a0a',emblem:'dragon',aura:'#ffd040',bulk:1.2}),
    'hac-thien-ma-cu':H(dragon,{c:['#2a1040','#0a0414','#7a4aa0','#ff2060'],eye:'#ff2060',mane:'#ff2060',wing:1,breath:'#c040ff',horn:'#0a0a0a',aura:'#ff2060',thick:13},1.1)
  };
  /* ================= THÚ CƯỠI MỚI ================= */
  // Phượng hoàng lửa: chim cam đỏ, đuôi dài, toàn thân bốc lửa
  function phoenix(c,tint,moving,walk,t){const A=tint||'#ff6a20',D=shade(A,-.35),Lt='#ffd27a',fl=Math.sin(t*(moving?7:4));
    flames(c,t,-30,-14,1.4,['#ff4a10','#ffd060'],6);
    // đuôi dài
    for(let k=0;k<5;k++){const a=PI*.95+(k-2)*.14+Math.sin(t*2+k)*.05;feather(c,-14,-24,a,40+k%2*10,6,k%2?'#ffb030':A,al(Lt,.6));const ex=-14+Math.cos(a)*(40+k%2*10),ey=-24+Math.sin(a)*(40+k%2*10);c.save();glow(c,'#ffd060',8);E(c,ex,ey,3,3,'#ffd060');c.restore();}
    // cánh sau
    c.save();c.translate(-4,-34);c.rotate(-.3-fl*.5);for(let k=0;k<7;k++)feather(c,-4-k*3.6,-1,-PI*.8+k*.07,30+k,5,k%2?D:shade(A,-.15),null);c.restore();
    // chân
    for(const x of [-4,6]){const k=moving?Math.sin(walk*1.6+x)*4:0;L(c,[x,-16,x+k,-2],'#c88020',2);for(const d of [-1,0,1])L(c,[x+k,-2,x+k+d*2.5,1],'#5a3010',1.2);}
    // thân
    c.fillStyle=lg(c,0,-36,0,-12,[shade(A,.2),A,D]);c.beginPath();c.ellipse(0,-24,19,11,-.1,0,PI2);c.fill();for(let r=0;r<2;r++)for(let q=0;q<4;q++){c.fillStyle=al(Lt,.6);c.beginPath();c.arc(-6+q*5,-22+r*4,2.6,0,PI);c.fill();}
    // cổ, đầu
    F(c,[10,-30,16,-42,20,-50,28,-48,22,-34,14,-20],A);E(c,23,-50,7,6,A);E(c,25,-47,4,3,Lt);
    for(let k=0;k<4;k++){const a=-PI*.72-k*.2+Math.sin(t*3+k)*.05;feather(c,20,-55,a,12+k*2,2.6,k%2?'#ffd060':'#ff4a10',null);}
    F(c,[28,-52,37,-50,33,-47,29,-47],'#ffd060');c.save();glow(c,'#ffff80',6);E(c,26,-51.5,1.6,1.5,'#ffff80');c.restore();E(c,26.3,-51.5,.6,1,'#1a0a0a');
    // cánh trước
    c.save();c.translate(2,-32);c.rotate(-.35-fl*.6);for(let k=0;k<8;k++)feather(c,-3-k*3.4,-1,-PI*.82+k*.07,32+k*1.4,5.4,k%2?shade(A,-.08):A,al(Lt,.55));for(let k=0;k<5;k++){c.fillStyle=Lt;c.beginPath();c.arc(-4-k*4,-2,3,0,PI);c.fill();}c.restore();
    flames(c,t+.5,0,-36,1.2,['#ff6020','#ffe080'],5);
  }
  // Cửu vĩ hồ: cáo chín đuôi, có lửa hồ ly
  function nineTail(c,tint,moving,walk,t){const A=tint||'#ffd0b0',m={moving,walk};
    fox(c,m,null,{t,open:false,col:v=>v,fl:false},{c:[A,shade(A,-.3),'#fffaf4','#ff6080'],eye:'#ff3080',tipGlow:'#ff80b0',marks:'#e04070',tails:9},true);
    for(let i=0;i<3;i++){const a=t*1.2+i*2.1,x=-10+Math.cos(a)*30,y=-50+Math.sin(a)*10;c.save();glow(c,'#ff60b0',10);E(c,x,y,2.4,3,'#ff80c0');c.restore();}
  }
  // Huyền vũ: rùa đen mai lục giác, rắn quấn quanh
  function blackTortoise(c,tint,moving,walk,t){const A=tint||'#1e2a3a',D=shade(A,-.4),Lt=shade(A,.35),sk='#3a5a4a';
    const leg=(x,ph)=>{const k=moving?Math.sin(walk*1.2+ph)*4:0;roundLeg(c,x+k,sk);};
    leg(-22,0);leg(16,PI);
    // đuôi rắn phía sau
    // mai rùa
    c.fillStyle=lg(c,0,-50,0,-12,[Lt,A,D]);c.beginPath();c.ellipse(-2,-24,34,22,0,PI,0);c.fill();E(c,-2,-24,34,5,D);
    for(const [x,y] of [[-2,-38],[-16,-30],[12,-30],[-26,-26],[22,-26],[-9,-28],[5,-28]]){c.strokeStyle='#8ac0b0aa';c.lineWidth=1.2;c.beginPath();for(let i=0;i<6;i++){const a=i/6*PI2;const px=x+Math.cos(a)*6,py=y+Math.sin(a)*4.5;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.stroke();}
    for(let i=-30;i<=26;i+=7)E(c,i,-22,2.4,1.6,'#c8a040');
    leg(-14,PI);leg(22,0);
    // đầu rùa
    F(c,[26,-24,34,-32,44,-32,48,-26,42,-20,30,-18],sk);c.save();glow(c,'#80ffd0',6);E(c,41,-28,1.6,1.4,'#80ffd0');c.restore();
    // rắn quấn mai
    const sw=Math.sin(t*2)*3;c.strokeStyle='#2a6a4a';c.lineWidth=5.5;c.lineCap='round';c.beginPath();c.moveTo(-36,-22);c.bezierCurveTo(-30,-58,10,-56,14,-40);c.bezierCurveTo(18,-30,-4,-30,0,-46+sw);c.bezierCurveTo(2,-58,14,-66,22,-62+sw);c.stroke();
    c.strokeStyle='#8ad0a0';c.lineWidth=1.4;c.setLineDash([2,3]);c.beginPath();c.moveTo(-36,-22);c.bezierCurveTo(-30,-58,10,-56,14,-40);c.stroke();c.setLineDash([]);
    c.save();c.translate(23,-62+sw);E(c,2,0,5,3.4,'#2a6a4a');c.save();glow(c,'#ffe040',6);E(c,4,-1,1.2,1,'#ffe040');c.restore();if(Math.sin(t*4)>.6)S(c,[7,0,11,1,13,-1],'#ff4060',1);c.restore();
  }
  function roundLeg(c,x,col){L(c,[x,-16,x,-2],col,7);E(c,x+1,-1,5,2.4,shade(col,-.3));}
  // Thiên mã: đôi cánh lông vũ trắng (vẽ thêm lên ngựa)
  function pegasusWings(c,t,moving,front){const fl=Math.sin(t*(moving?6:2.5));c.save();c.translate(front?-2:-6,-30);c.rotate(-.5-fl*.5);
    for(let k=0;k<8;k++)feather(c,-2-k*3.2,-1,-PI*.78+k*.07,26+k*1.2,5,front?(k%2?'#ffffff':'#f0f4ff'):'#d8dce8','#c8d0e0');
    for(let k=0;k<5;k++){c.fillStyle=front?'#ffffff':'#e8ecf4';c.beginPath();c.arc(-3-k*3.8,-2,2.8,0,PI);c.fill();}c.restore();}
  // Rồng cưỡi: rồng phương Đông nhỏ, uốn nhẹ, cưỡi mây
  function dragonMount(c,tint,moving,walk,t){const A=tint||'#2a6a5a',gold=/^#(f|e)[c-f]/i.test(A),X=gold?'#e06a20':'#ffd040';c.save();c.scale(.5,.5);c.translate(12,6);
    dragon(c,{moving,walk},null,{t,open:false,col:v=>v,fl:false},{c:[A,shade(A,-.4),shade(A,.55),X],mane:gold?'#ff9a30':shade(A,.35),eye:'#ffe060',whisker:gold?'#fff0b0':'#e8fff0',horn:gold?'#fff0c0':'#e8d8a8',float:1,amp:4,thick:12});c.restore();}
  // Kỳ lân: thân phủ vảy, móng guốc, đầu rồng một sừng, bờm và đuôi lửa
  function qilin(c,tint,moving,walk,t){const A=tint||'#ff8a3a',D=shade(A,-.35),Lt=shade(A,.45),G='#ffd060',g=moving?walk*1.6:0;
    const leg=(x,ph,back)=>{const k=moving?Math.sin(g+ph):0,col=back?D:A;L(c,[x,-16,x+k*6,-7,x+k*3,1],col,4.2);P(c,[x+k*3-2.5,-1,x+k*3+2.5,-1,x+k*3+3,2.5,x+k*3-3,2.5],'#2a1a10');flames(c,t+x,x+k*5,-9,.45,['#ff6020','#ffd060'],2);};
    // đuôi lửa cuộn
    const tw=Math.sin(t*3)*3;S(c,[-20,-26,-30,-30,-34,-40+tw,-28,-46+tw],A,4);flames(c,t,-28,-46+tw,1,['#ff5a10','#ffd060'],4);
    leg(-14,0,true);leg(12,PI,true);
    c.fillStyle=lg(c,0,-34,0,-12,[Lt,A,D]);c.beginPath();c.ellipse(0,-22,23,10.5,0,0,PI2);c.fill();
    for(let r=0;r<2;r++)for(let q=0;q<7;q++){c.strokeStyle=al(G,.75);c.lineWidth=.8;c.beginPath();c.arc(-15+q*5+(r%2)*2.5,-27+r*4.5,2.2,0,PI);c.stroke();}
    E(c,0,-15,17,3.5,shade(A,.6));
    leg(-10,PI,false);leg(16,0,false);
    // cổ, bờm lửa
    F(c,[12,-28,18,-40,24,-46,30,-42,24,-30,18,-18],A);for(let k=0;k<5;k++)flames(c,t+k*.3,14+k*3,-34-k*2.5,.5,['#ff4a10','#ffd060'],2);
    // đầu rồng
    c.save();c.translate(28,-45+(moving?Math.sin(g*2)*1.2:Math.sin(t*1.5)));c.rotate(.15);
    c.fillStyle=lg(c,-6,-6,14,6,[Lt,A]);c.beginPath();c.moveTo(-6,2);c.quadraticCurveTo(-6,-7,3,-7);c.quadraticCurveTo(11,-6,15,-1);c.quadraticCurveTo(14,4,8,4);c.quadraticCurveTo(-2,6,-6,2);c.fill();
    c.save();glow(c,G,6);S(c,[0,-6,1,-14,-2,-20],G,2.2);c.restore();P(c,[-4,-5,-9,-10,-5,-2],D);
    E(c,4,-3,1.6,1.3,'#1a0a0a');E(c,14,0,1,.8,'#1a0a0a');F(c,[2,4,8,5,5,11+Math.sin(t*2)],'#fff0c0');
    for(const d of [0,1])S(c,[14,1+d,20,3+Math.sin(t*2.4+d)*2,25,1+Math.sin(t*2.4+d)*3],'#ffe080',.9);
    c.restore();
    roundRectFill(c,-8,-34,18,6,2,'#6b3a24');L(c,[-8,-31,10,-31],G,1);}
  function roundRectFill(c,x,y,w,h,r,col){c.fillStyle=col;c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.fill();}
  B.mount={phuong:phoenix,cuuvi:nineTail,rua:blackTortoise,wings:pegasusWings,rong:dragonMount,kylan:qilin};
  // v10.36: bộ bút dùng chung cho src/04-boss-cao.js (quái, boss từ Thiên Đình trở lên); top[mã] = chiều cao hình để đặt tên, thanh máu
  B.kit={E,P,L,S,F,lg,rg,glow,noGlow,al,shade,fc,hr,aura,flames,bolt,swirl,feather,curve,warlord,dragon,serpent,fishKing,helm};B.top={};
  return B;
})();
