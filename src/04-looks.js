/* ================= DÁNG VẺ ĐỒ: mỗi món đồ được vẽ trên người theo đúng tên / loại =================
   Một bảng duy nhất dùng cho cả hình trên người nhân vật lẫn ảnh biểu tượng trong túi (mapGame.itemIcon vẽ ảnh webp từ chính các hàm này),
   nên ảnh và nhân vật luôn khớp nhau.
   - Ô Cánh: tên có "Áo choàng" → áo choàng trên vai · "Cờ" → cờ cắm sau lưng · còn lại → đôi cánh.
   - Mũ: Nón lá, Nón dấu, Khăn, Trâm, Mũ phượng, Mũ trụ / mũ tướng, Mũ vương (Quang Trung, Quốc công…).
   - Áo: Áo vải, Áo da, Giáp (vảy), Áo bào / Long bào / Áo phượng (áo dài tới gối).
   - Quần: quần hoặc váy (Váy, Xiêm y). Giày: dép, guốc, hài, ủng, giày mây.
   - Đồ huyền thoại (bộ): cả bộ dùng chung một bảng màu của vị anh hùng, viền vàng.
   - Đồ thần: màu riêng + hiệu ứng riêng (lửa, sóng nước, mây, vảy rồng, ánh ngọc…). */
const LH_Look=(()=>{
  // Bảng màu từng bộ huyền thoại: [chính, phụ, viền]
  const SET={
    'ngo-quyen':['#2f5d8a','#c9d2da','#e8c070'],'dinh-bo-linh':['#c9a43a','#7a5a2a','#f2dc8a'],'le-hoan':['#a8342a','#3a2a22','#e8c070'],
    'ly-thuong-kiet':['#7a1f2a','#2a2a30','#e8c070'],'tran-hung-dao':['#b0302a','#e0b84a','#f2dc8a'],'tran-quoc-toan':['#c0392b','#f2c94c','#f2dc8a'],
    'nguyen-trai':['#2e3f6e','#d8d2c0','#c9b070'],'le-loi':['#2f6a44','#c9a43a','#e8c070'],'quang-trung':['#9a2a2a','#26355a','#e8c070'],
    'trung-trac':['#6a3a8a','#e0b84a','#f2dc8a'],'trung-nhi':['#8a3a7a','#e0b84a','#f2dc8a'],'trieu-thi-trinh':['#d9a62a','#8a3a1a','#fff0b0'],
    'le-chan':['#2a7a7a','#d8e8e0','#e8c070'],'phung-thi-chinh':['#b04a6a','#f2d0d8','#e8c070'],'vu-thi-thuc':['#9a4ab0','#e8d0f0','#e8c070'],
    'duong-van-nga':['#5a2a8a','#e8c070','#fff0b0'],'y-lan':['#c06a8a','#f8e0e8','#e8c070'],'bui-thi-xuan':['#c0442a','#2a2a30','#f2dc8a']
  };
  // Đồ thần: màu + hiệu ứng riêng
  const MYTH={
    'than-roi-sat':{c:'#3c3f44',fx:'fire'},'than-ngua-sat':{c:'#4a4d52',fx:'fire'},'than-giap-sat':{c:'#5a5e64',fx:'fire'},
    'than-no-kim-quy':{c:'#c9a43a',fx:'gold'},'than-kiem-thuan-thien':{c:'#5fb89a',fx:'jade'},
    'than-gay-chu-dong-tu':{c:'#8a6a3a',fx:'light'},'than-non-chu-dong-tu':{c:'#e8d48a',fx:'light'},
    'than-canh-au-co':{c:'#f4e6f0',fx:'fairy'},'than-khien-lac-long':{c:'#2f7a9a',fx:'dragon'},
    'than-giay-son-tinh':{c:'#a8b8c8',fx:'cloud'},'than-gang-thuy-tinh':{c:'#3a8ab0',fx:'water'}
  };
  const FX={fire:['#ff8a3d','#ffd27a'],gold:['#ffd36a','#fff3c4'],jade:['#7fe0b0','#d8fff0'],light:['#fff2a8','#ffffff'],fairy:['#ffc0e8','#ffffff'],dragon:['#5fd0ff','#c8f0ff'],cloud:['#e8f0ff','#ffffff'],water:['#5fb8ff','#d8f0ff']};
  const has=(s,...w)=>w.some(x=>s.includes(x));
  const cache={};
  // Dáng vẻ của một loại đồ (theo mã)
  function of(type){
    if(cache[type])return cache[type];
    const d=typeof Player!=='undefined'&&Player.items[type];if(!d)return null;
    const name=String(d.name||'').toLowerCase(),slot=d.slot==='hand'?(type.endsWith(':left')?'left':'right'):d.slot;
    const L={type,slot,name:d.name,set:d.set||null,myth:!!d.myth,gender:d.gender||'',main:d.tint||null,alt:null,trim:null,kind:slot};
    if(d.set&&SET[d.set]){[L.main,L.alt,L.trim]=SET[d.set];L.legend=true;}
    if(d.myth&&MYTH[type]){L.main=MYTH[type].c;L.fx=MYTH[type].fx;L.trim=FX[L.fx][0];}
    if(slot==='wings'){L.kind=has(name,'áo choàng')?'cloak':has(name,'cờ')?'flag':'wings';
      // cánh dung hợp (v10.6): dáng theo tên — ác quỷ: cánh dơi · xương: cánh xương · ánh sáng / lửa / lôi phong: cánh năng lượng phát sáng · còn lại: cánh lông
      if(L.kind==='wings')L.wing=has(name,'ác quỷ')?'bat':has(name,'xương')?'bone':has(name,'ánh sáng','lửa','lôi phong')?'energy':'feather';}
    else if(slot==='hat')L.kind=has(name,'nón lá','nón thần')?'nonla':has(name,'nón dấu')?'nondau':has(name,'khăn')?'khan':has(name,'trâm')?'tram':has(name,'phượng','nguyên phi')?'phoenix':has(name,'quang trung','quốc công','bình định vương','vạn thắng','trưng vương','trưng nhị')?'crown':'helm';
    else if(slot==='armor')L.kind=has(name,'bào','áo phượng','áo nguyên phi','côn sơn')?'robe':has(name,'áo da')?'leather':has(name,'áo vải')?'cloth':'scale';
    else if(slot==='pants')L.kind=has(name,'váy','xiêm')?'skirt':'pants';
    else if(slot==='shoes')L.kind=has(name,'dép')?'sandal':has(name,'guốc')?'clog':has(name,'ủng','giày da')?'boot':has(name,'mây')?'cloud':'hai';
    // màu mặc định của đồ thường
    const DEF={cloak:'#6a3a2a',flag:'#b0302a',wings:'#e9eef4',nonla:'#e1cd8e',nondau:'#3a2a1a',khan:'#2a2622',helm:'#6b5a3a',crown:'#b08a3a',tram:'#e8c070',phoenix:'#c9a43a',
      robe:'#6a3a2a',leather:'#7a5232',cloth:'#8a7a5c',scale:'#7a5a2a',pants:'#4a4036',skirt:'#3a2a22',gloves:'#6a5240',sandal:'#a8864a',clog:'#e8dcc0',boot:'#4a3a2a',cloud:'#c8d8e8',hai:'#3a2a22'};
    if(!L.main)L.main=DEF[L.kind]||'#7a6a55';
    if(!L.alt)L.alt=shadeL(L.main,-.3);
    if(!L.trim)L.trim=L.legend?'#e8c070':shadeL(L.main,.35);
    return cache[type]=L;
  }
  function shadeL(hex,k){const n=parseInt(String(hex).slice(1,7),16);if(!Number.isFinite(n))return hex;let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)));return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');}
  const P=(c,pts,fill,stroke,lw)=>{c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||1;c.stroke();}};
  const E=(c,x,y,rx,ry,fill)=>{c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  const Ln=(c,pts,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.stroke();};

  /* ---------- Ô cánh: áo choàng / cờ / cánh (vẽ sau lưng, trước khi vẽ thân) ---------- */
  function back(c,L,t,moving){
    const sw=Math.sin(t*(moving?7:2))*(moving?3:1.2);
    if(L.kind==='cloak'){
      // áo choàng buông từ vai xuống quá gối, bay nhẹ theo bước
      const g=c.createLinearGradient(0,-26,0,6);g.addColorStop(0,L.main);g.addColorStop(1,shadeL(L.main,-.35));
      c.fillStyle=g;c.beginPath();c.moveTo(-9,-25);c.quadraticCurveTo(-17-sw,-8,-19-sw*1.6,6);c.lineTo(-4-sw,8);c.quadraticCurveTo(2,-6,7,-25);c.closePath();c.fill();
      c.strokeStyle=L.trim;c.lineWidth=1.4;c.beginPath();c.moveTo(-19-sw*1.6,6);c.lineTo(-4-sw,8);c.stroke();
      c.strokeStyle=shadeL(L.main,-.45);c.lineWidth=.8;c.beginPath();c.moveTo(-9,-22);c.quadraticCurveTo(-13-sw,-6,-14-sw*1.3,6);c.stroke();
    }
    else if(L.kind==='flag'){
      // cờ hiệu cắm sau lưng: cán tre, lá cờ đuôi nheo bay
      Ln(c,[-6,-14,-11,-62],'#6b4a2e',2.2);E(c,-11,-63,1.8,1.8,L.trim);
      const fl=Math.sin(t*5)*2.5;c.fillStyle=L.main;c.beginPath();c.moveTo(-11,-61);c.quadraticCurveTo(-24,-60+fl,-34,-58+fl*1.4);c.lineTo(-28,-51+fl);c.lineTo(-34,-44+fl*1.2);c.quadraticCurveTo(-22,-45-fl,-10,-44);c.closePath();c.fill();
      c.strokeStyle=L.trim;c.lineWidth=1.2;c.stroke();E(c,-19,-52+fl*.5,3.2,3.2,L.alt);E(c,-19,-52+fl*.5,1.6,1.6,L.trim);
    }
    else{ // đôi cánh
      const f=Math.sin(t*4)*.12,col=L.main,W=L.wing||'feather';c.save();c.translate(-4,-22);
      for(const s of [1,.8]){c.save();c.rotate(-.1+f*s);c.scale(s,s);c.globalAlpha=s<1?.7:.92;c.fillStyle=col;c.strokeStyle=L.trim;c.lineWidth=1;
        if(W==='bat'){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-18,-34,-42,-30);c.lineTo(-34,-16);c.lineTo(-44,-4);c.lineTo(-30,0);c.lineTo(-34,12);c.lineTo(-18,4);c.lineTo(-10,10);c.closePath();c.fill();c.stroke();
          c.strokeStyle=shadeL(col,-.35);for(const [x,y] of [[-34,-16],[-30,0],[-18,4]]){c.beginPath();c.moveTo(-2,-2);c.lineTo(x,y);c.stroke();}}
        else if(W==='bone'){c.strokeStyle=col;c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-16,-30,-38,-28);c.stroke();
          for(const [x,y,x2,y2] of [[-14,-20,-30,-6],[-24,-26,-40,-12],[-34,-27,-46,-18]]){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();E(c,x2,y2,2.2,2.2,col);}
          c.lineWidth=1;c.strokeStyle=shadeL(col,-.4);c.fillStyle=shadeL(col,.2)+'55';c.beginPath();c.moveTo(-6,-6);c.lineTo(-30,-6);c.lineTo(-40,-12);c.lineTo(-24,-26);c.closePath();c.fill();}
        else if(W==='energy'){c.save();c.shadowColor=L.trim;c.shadowBlur=14;c.globalAlpha=(s<1?.5:.75);
          for(let i=0;i<3;i++){const ph=(t*1.5+i*.33)%1;c.globalAlpha*=1;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-20-i*4,-36-ph*8,-42-i*3,-10-i*8);c.quadraticCurveTo(-26,-8+i*4,0,8);c.closePath();c.fill();}
          c.restore();c.strokeStyle=shadeL(col,.4);for(let i=1;i<4;i++){c.beginPath();c.moveTo(-4,2);c.lineTo(-12-i*8,-14+i*5);c.stroke();}}
        else{c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-26,-40,-40,-12);c.quadraticCurveTo(-28,-12,-22,4);c.quadraticCurveTo(-12,0,0,8);c.closePath();c.fill();c.stroke();
          c.strokeStyle=shadeL(col,-.25);for(let i=1;i<4;i++){c.beginPath();c.moveTo(-4,2);c.lineTo(-12-i*8,-14+i*5);c.stroke();}}
        c.restore();}
      c.restore();
    }
  }
  /* ---------- Áo choàng: vạt trước vắt qua vai (vẽ sau thân) ---------- */
  function front(c,L){if(L.kind!=='cloak')return;P(c,[-9,-26,7,-26,4,-21,-6,-21],L.main);E(c,0,-23,2.2,2.2,L.trim);}
  /* ---------- Mũ ---------- */
  function hat(c,L,fem){
    const m=L.main,a=L.alt,tr=L.trim;
    if(L.kind==='nonla'){P(c,[-20,-41,0,-60,20,-41],m);Ln(c,[-20,-41,20,-41],shadeL(m,-.25),1.5);c.strokeStyle=shadeL(m,-.15);c.lineWidth=1;for(let k=1;k<4;k++){c.beginPath();c.moveTo(-20+k*4.5,-41-k*4.3);c.lineTo(20-k*4.5,-41-k*4.3);c.stroke();}}
    else if(L.kind==='nondau'){P(c,[-13,-44,0,-55,13,-44],m);Ln(c,[-13,-44,13,-44],tr,1.6);E(c,0,-56,2.6,2.6,'#c0342a');Ln(c,[0,-56,-3,-49],'#c0342a',1.2);}
    else if(L.kind==='khan'){E(c,-1,-45,11,6,m);c.strokeStyle=shadeL(m,.3);c.lineWidth=1;for(let k=-1;k<2;k++){c.beginPath();c.ellipse(-1,-45+k*2.4,10,2.2,0,Math.PI,0);c.stroke();}}
    else if(L.kind==='tram'){Ln(c,[-16,-49,-2,-43],tr,1.8);E(c,-2,-43,2,2,m);E(c,-16,-49,1.6,1.6,a);}
    else if(L.kind==='phoenix'){P(c,[-11,-44,-8,-53,0,-57,8,-53,11,-44],m,tr,1.2);P(c,[0,-57,-6,-64,0,-61,6,-64],tr);E(c,0,-50,2.4,2.4,a);for(const s of [-1,1])Ln(c,[s*10,-46,s*15,-40],tr,1.2);}
    else if(L.kind==='crown'){P(c,[-12,-42,-12,-52,-5,-56,0,-60,5,-56,12,-52,12,-42],m,tr,1.4);Ln(c,[-12,-46,12,-46],tr,1.6);E(c,0,-52,2.6,2.6,a);for(const s of [-1,1])P(c,[s*12,-48,s*20,-54,s*18,-46],tr);}
    else{ // mũ trụ tướng: chỏm tròn, vành, chóp tua đỏ
      c.fillStyle=m;c.beginPath();c.arc(0,-44,11.5,Math.PI,0);c.closePath();c.fill();c.strokeStyle=shadeL(m,-.4);c.lineWidth=1;c.stroke();
      Ln(c,[-13,-44,13,-44],tr,2.2);Ln(c,[0,-55,0,-61],tr,1.6);E(c,0,-62,2.4,3,L.legend?a:'#c0342a');for(const s of [-1,1])Ln(c,[s*11,-44,s*12,-37],shadeL(m,-.2),2.4);
    }
  }
  /* ---------- Áo, quần, găng, giày: màu + hoa văn theo kiểu ---------- */
  function armor(c,L,fem){
    const m=L.main,tr=L.trim;
    if(L.kind==='scale'){c.strokeStyle=shadeL(m,-.35);c.lineWidth=1;for(let y=-21;y<-6;y+=4)for(let x=-10;x<11;x+=5){c.beginPath();c.arc(x+(y%8?2.5:0),y,2.5,0,Math.PI);c.stroke();}Ln(c,[-9,-24,0,-18,9,-24],tr,2);E(c,0,-18,2,2,tr);}
    else if(L.kind==='leather'){c.strokeStyle=shadeL(m,-.4);c.setLineDash([2,2]);c.lineWidth=.8;c.strokeRect(-9,-22,18,14);c.setLineDash([]);Ln(c,[-9,-24,0,-19,9,-24],shadeL(m,.3),1.4);}
    else if(L.kind==='robe'){Ln(c,[-2,-27,3,-6],tr,1.8);Ln(c,[-9,-25,-2,-27],tr,1.2);if(L.legend){E(c,-5,-15,2.4,2.4,tr);E(c,5,-12,2,2,tr);}}
    else{Ln(c,[-6,-25,0,-21,6,-25],shadeL(m,-.3),1.4);Ln(c,[0,-21,0,-8],shadeL(m,-.2),.8);}
    if(L.legend){c.strokeStyle=tr;c.lineWidth=1;c.strokeRect(-11.5,-8,23,2);}
  }
  // áo dài (bào): vạt áo phủ xuống gối, vẽ sau chân
  function robeSkirt(c,L,moving,walk){if(L.kind!=='robe')return;const s=moving?Math.sin(walk)*2:0;P(c,[-12,-8,12,-8,13+s,1,-13-s,1],L.main,shadeL(L.main,-.45),1);Ln(c,[-13-s,1,13+s,1],L.trim,1.6);}
  /* ---------- Hiệu ứng đồ thần ---------- */
  function mythAura(c,list,t){
    for(const [i,L] of list.entries()){
      const [a,b]=FX[L.fx]||FX.gold;c.save();
      for(let k=0;k<5;k++){const ph=t*1.6+k*1.26+i*.7,r=16+((t*12+k*7)%14),x=Math.cos(ph)*r*.8,y=-22+Math.sin(ph*1.3)*14-((t*14+k*9)%22);
        c.globalAlpha=.55-((t*12+k*7)%14)/30;c.fillStyle=k%2?a:b;c.beginPath();
        if(L.fx==='fire'){c.moveTo(x,y-4);c.quadraticCurveTo(x+3,y,x,y+2);c.quadraticCurveTo(x-3,y,x,y-4);}
        else if(L.fx==='water'||L.fx==='dragon'){c.ellipse(x,y,2.4,1.4,ph,0,Math.PI*2);}
        else if(L.fx==='cloud'){c.ellipse(x,4,4,2,0,0,Math.PI*2);}
        else{c.moveTo(x,y-3);c.lineTo(x+1,y-1);c.lineTo(x+3,y);c.lineTo(x+1,y+1);c.lineTo(x,y+3);c.lineTo(x-1,y+1);c.lineTo(x-3,y);c.lineTo(x-1,y-1);c.closePath();}
        c.fill();}
      c.restore();
    }
  }
  // Ánh sáng quanh vũ khí / món đồ thần (dùng cả khi vẽ trên tay)
  function mythGlow(c,L){if(!L||!L.fx)return;const [a]=FX[L.fx]||FX.gold;c.shadowColor=a;c.shadowBlur=12;}
  /* ---------- Ảnh biểu tượng (túi đồ) cho đồ mặc: vẽ riêng từng món, giữa khung ---------- */
  function iconWear(c,L,t=0){
    c.save();
    const sl=L.slot;
    if(sl==='wings'){c.translate(L.kind==='flag'?18:L.kind==='wings'?24:6,L.kind==='flag'?36:16);const k=L.kind==='cloak'?1.6:1.05;c.scale(k,k);if(L.kind==='cloak'){c.translate(4,-2);back(c,L,0,false);front(c,L);}else back(c,L,0,false);}
    else if(sl==='hat'){c.scale(1.5,1.5);c.translate(0,L.kind==='tram'?46:L.kind==='khan'?45:50);hat(c,L,false);}
    else if(sl==='armor'){c.scale(1.7,1.7);c.translate(0,20);const g=c.createLinearGradient(-12,0,12,0);g.addColorStop(0,shadeL(L.main,-.2));g.addColorStop(.6,L.main);g.addColorStop(1,shadeL(L.main,-.15));
      c.fillStyle=g;c.beginPath();c.roundRect(-12,-27,24,23,6);c.fill();P(c,[-12,-25,-19,-14,-16,-10,-11,-18],L.main);P(c,[12,-25,19,-14,16,-10,11,-18],L.main);armor(c,L,false);robeSkirt(c,L,false,0);}
    else if(sl==='pants'){c.scale(1.8,1.8);c.translate(0,1);if(L.kind==='skirt'){P(c,[-11,-10,11,-10,15,6,-15,6],L.main,shadeL(L.main,-.4),1);Ln(c,[-11,-9,11,-9],L.trim,2);}else{P(c,[-11,-10,11,-10,10,8,3,8,0,-2,-3,8,-10,8],L.main,shadeL(L.main,-.4),1);c.fillStyle=L.legend?L.trim:'#a8343a';c.fillRect(-11,-11,22,3);}}
    else if(sl==='gloves'){c.scale(1.9,1.9);for(const s of [-1,1]){c.save();c.translate(s*6,0);c.rotate(s*.25);c.fillStyle=L.main;c.beginPath();c.roundRect(-4,-9,8,14,3);c.fill();c.fillStyle=L.trim;c.fillRect(-4,-9,8,2.4);c.restore();}}
    else if(sl==='shoes'){c.scale(2.2,2.2);c.translate(0,3);for(const s of [-1,1]){c.save();c.translate(s*5.5,0);
      if(L.kind==='sandal'){c.fillStyle=L.main;c.beginPath();c.ellipse(0,0,4.5,2.4,0,0,Math.PI*2);c.fill();Ln(c,[-2,-1,2,1],shadeL(L.main,-.4),1);}
      else if(L.kind==='clog'){c.fillStyle=L.main;c.fillRect(-4.5,-1,9,3);c.fillStyle=L.trim;c.fillRect(-3,-3,6,2);}
      else{const h=L.kind==='boot'?7:3;c.fillStyle=L.main;c.beginPath();c.roundRect(-3.5,-h,7,h+2,1.5);c.fill();c.beginPath();c.roundRect(-3.5,0,9,3,1.5);c.fill();Ln(c,[-3.5,-h+.5,3.5,-h+.5],L.trim,1);if(L.kind==='cloud'){c.globalAlpha=.7;E(c,-2,3,4,1.6,'#ffffff');E(c,4,3,3,1.4,'#ffffff');c.globalAlpha=1;}}
      c.restore();}}
    c.restore();
  }
  /* ---------- Gợi ý vẽ ảnh (file Hình ảnh, cột goi_y / gioi_tinh / ghi_chu) ---------- */
  const WEBP='định dạng webp, nền trong suốt';
  const KIND_VN={cloak:'áo choàng khoác vai (buông quá gối)',flag:'cờ hiệu cắm sau lưng (cán tre, đuôi nheo)',wings:'đôi cánh sau lưng',nonla:'nón lá',nondau:'nón dấu lính (chóp tua đỏ)',khan:'khăn xếp quấn đầu',tram:'trâm cài búi tóc',phoenix:'mũ phượng',crown:'mũ vương có cánh chuồn',helm:'mũ trụ tướng (chỏm tròn, vành, chóp tua)',
    robe:'áo bào dài tới gối',leather:'áo da có đường chỉ',cloth:'áo vải cổ chéo',scale:'giáp vảy',pants:'quần (thắt lưng đỏ)',skirt:'váy dài',sandal:'dép cỏ',clog:'guốc',boot:'ủng cao cổ',cloud:'giày mây',hai:'hài thấp cổ',gloves:'bao tay'};
  const FX_VN={fire:'lửa cháy',gold:'ánh vàng',jade:'ánh ngọc bích',light:'hào quang trắng',fairy:'bụi tiên hồng',dragon:'vảy rồng xanh',cloud:'mây trắng',water:'sóng nước'};
  function note(type){
    const d=Player.items[type];if(!d)return {goi_y:'128×128, '+WEBP+'.',gioi_tinh:'Chung',ghi_chu:''};
    const L=of(type),k=d.kind,S=d.set&&Player.SETS[d.set];let t;
    if(['sword','spear','staff'].includes(k))t=`128×128, ${WEBP}. Vũ khí vẽ chéo 45°: tay cầm ở góc dưới trái (14% từ trái, 86% từ trên), mũi hướng góc trên phải — game đặt đúng điểm này vào tay nhân vật.`;
    else if(k==='shield')t=`128×128, ${WEBP}. Khiên đứng thẳng giữa ảnh, cao khoảng 85% khung.`;
    else if(k==='bow'||k==='crossbow')t=`128×128, ${WEBP}. Vẽ chéo giữa khung (trên tay vẫn dùng hình vẽ của game vì có động tác kéo dây).`;
    else if(d.slot==='mount')t=`128×128, ${WEBP}. Thú quay mặt sang phải, chân chạm đáy, thấy yên cưỡi.`;
    else if(d.slot==='book')t=`128×128, ${WEBP}. Bìa sách màu hệ, biểu tượng hệ ở giữa.`;
    else if(L&&KIND_VN[L.kind])t=`128×128, ${WEBP}. Món đồ nhìn chính diện, giữa khung. Trên nhân vật vẽ thành: ${KIND_VN[L.kind]}.`;
    else t=`128×128, ${WEBP}.`;
    if(L&&d.slot!=='book')t+=` Màu: chính ${L.main}, phụ ${L.alt}, viền ${L.trim}.`;
    if(L&&L.legend)t+=' Đồng bộ cả bộ: cùng bảng màu, viền vàng, cùng hoa văn.';
    if(L&&L.fx)t+=` Đồ thần: hiệu ứng ${FX_VN[L.fx]} (quầng sáng + hạt lấp lánh).`;
    const g=S?S.gender:d.gender;
    return {goi_y:t,gioi_tinh:g==='f'?'Nữ':g==='m'?'Nam':'Chung',ghi_chu:S?`Huyền thoại · Bộ ${S.name} (${S.hero}) · 9 món đồng bộ`:d.myth?`Thần thoại · ${d.fxText||''}`:''};
  }
  return {note,of,SET,MYTH,FX,shade:shadeL,back,front,hat,armor,robeSkirt,mythAura,mythGlow,iconWear};
})();
