/* ================= HÌNH VẼ THEO BẢN ĐỒ (gói bản đồ tải khi cần) =================
   Mỗi bản đồ ngoài Thanh Mộc là một gói dist/maps/<mã>.js: dữ liệu bản đồ + hình vẽ riêng (nền, cây đá, quái, hiệu ứng trời).
   Gói gọi LH_PACK(mã, dữ liệu, hàm vẽ). Hàm vẽ nhận bộ bút K (ell, line, poly, rr, shade…) và trả về:
     theme:{ten:{tile(c,x,y,v,n,T,G), over?(c,v)}}  · obj:{loai(c,o,t)}  · mon:{ma_quai(c,m,M,s)}  · sky:{ten(c,s)}  · ring:{ma_quai:'#màu'}
   File game chính chỉ giữ khung này (vài trăm byte), nên thêm bản đồ không làm game nặng thêm. */
const LH_ART=(()=>{
  const PI2=Math.PI*2,memo={};
  const shade=(hex,f)=>{const k=hex+f;if(memo[k])return memo[k];const m=/^#([0-9a-f]{6})/i.exec(hex||'');if(!m)return hex;const n=parseInt(m[1],16),ch=i=>{const v=(n>>i)&255;return Math.round(f<0?v*(1+f):v+(255-v)*f);};return memo[k]='#'+[16,8,0].map(i=>ch(i).toString(16).padStart(2,'0')).join('');};
  const K={PI2,shade,
    ell(c,x,y,rx,ry,col,rot=0){c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),rot,0,PI2);c.fill();},
    line(c,p,col,w){c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.stroke();},
    poly(c,p,col){c.fillStyle=col;c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();c.fill();},
    rr(c,x,y,w,h,r,col){c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();},
    // nhiễu mượt theo ô (đổi màu nền dần dần, không thành ô bàn cờ)
    noise(x,y,sc=4,s=0){const fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),u=fx-ix,v=fy-iy,a=K.hash(ix,iy,s),b=K.hash(ix+1,iy,s),c=K.hash(ix,iy+1,s),d=K.hash(ix+1,iy+1,s),su=u*u*(3-2*u),sv=v*v*(3-2*v);return a+(b-a)*su+(c-a)*sv+(a-b-c+d)*su*sv;},
    // trộn hai màu #rrggbb theo tỉ lệ k (0..1)
    mix(a,b,k){const p=parseInt(a.slice(1,7),16),q=parseInt(b.slice(1,7),16),f=i=>Math.round(((p>>i)&255)*(1-k)+((q>>i)&255)*k);return '#'+[16,8,0].map(i=>f(i).toString(16).padStart(2,'0')).join('');},
    // vẽ mép mềm cho vùng ô loại v (hồ, cỏ, băng…): mỗi ô một hình tròn bán kính r ô, chồng lên nhau thành bờ cong
    blob(c,G,w,h,T,v,r,col,dy=0){c.fillStyle=col;c.beginPath();for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(G(x,y)===v){c.moveTo((x+.5+r)*T,(y+.5+dy)*T);c.arc((x+.5)*T,(y+.5+dy)*T,r*T,0,PI2);}c.fill();},
    // số giả ngẫu nhiên cố định theo tọa độ (nền không nhấp nháy khi vẽ lại)
    hash(x,y,s=0){let h=(x*374761393+y*668265263+s*1442695041)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;}
  };
  const A={theme:{},obj:{},mon:{},sky:{},ring:{},K,packs:{}};
  // nạp phần hình vẽ của một gói
  A.add=(id,fn)=>{if(A.packs[id]||typeof fn!=='function')return;A.packs[id]=true;const r=fn(K)||{};for(const k of ['theme','obj','mon','sky','ring'])Object.assign(A[k],r[k]||{});};
  return A;
})();
// Gói bản đồ tự đăng ký khi tải xong
window.LH_MAPS=window.LH_MAPS||{};
window.LH_PACK=(id,def,art)=>{window.LH_MAPS[id]=def;LH_ART.add(id,art);};
