/*! Lữ Hành v10.12 · khởi động · https://github.com/vnthudao-source/lu-hanh */
/* ================= MÀN HÌNH CHỜ: thanh tải 0\u{2013}100%, cảnh làng + lời dẫn truyện =================
   Dùng chung cho file khởi động (tải tài nguyên trang) và game (kết nối máy chủ, tải nhân vật, dựng bản đồ). */
window.LH_Loader=window.LH_Loader||(()=>{
  const CSS=`#lh-loader{position:fixed;inset:0;z-index:2147483600;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px;background:#0d1712;color:#f3e6c4;font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;transition:opacity .5s;overflow:hidden}
#lh-loader.out{opacity:0;pointer-events:none}
#lh-loader canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0}
#lh-loader .lh-in{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:12px;width:min(520px,100%)}
#lh-loader .lh-logo{font:600 40px/1 Georgia,"Times New Roman",serif;color:#f6dc9c;letter-spacing:1px;text-shadow:0 2px 0 #3a1a0a,0 0 24px #e8b05a55}
#lh-loader .lh-sub{font-size:13px;color:#d8c9a0;letter-spacing:2px;text-transform:uppercase;margin-top:-4px}
#lh-loader .lh-story{min-height:0;max-width:520px;font:italic 17px/1.6 Georgia,"Times New Roman",serif;color:#fff2cf;text-shadow:0 1px 3px #000c}
#lh-loader .lh-story:empty{display:none}
#lh-loader .lh-bar{position:relative;width:100%;height:14px;border:1px solid #c9a35c;border-radius:9px;background:#1b130c;box-shadow:inset 0 1px 4px #000a;overflow:hidden}
#lh-loader .lh-fill{position:absolute;inset:0 auto 0 0;width:0;background:linear-gradient(90deg,#8a2e1c,#c8553a 45%,#f0c060);box-shadow:0 0 12px #f0b05a88}
#lh-loader .lh-row{display:flex;justify-content:space-between;width:100%;font-size:13px;color:#e9dcb4}
#lh-loader .lh-row b{color:#ffd98a;font-variant-numeric:tabular-nums}
#lh-loader .lh-go{margin-top:4px;padding:10px 22px;border-radius:10px;border:1px solid #e3b86f;background:linear-gradient(#a4452c,#7c2c1b);color:#fff3d6;font-weight:700;font-size:15px;cursor:pointer}
#lh-loader .lh-go[hidden]{display:none}`;
  let el,fill,pctEl,lbl,story,goBtn,cv,bgImg=null,shown=0,target=0,cap=0,raf=0,t0=0,scene=false,storyDone=Promise.resolve();
  // Ảnh tĩnh đã lưu từ lần vào trước (Sheet hinh_anh): logo, nền màn hình chờ
  const pics=()=>{try{return JSON.parse(localStorage.getItem('lh-img')||'{}')||{};}catch(e){return {};}};
  function mount(){
    if(el&&document.body.contains(el))return;
    if(!document.getElementById('lh-loader-css')){const s=document.createElement('style');s.id='lh-loader-css';s.textContent=CSS;document.head.appendChild(s);}
    el=document.getElementById('lh-loader');
    if(!el){el=document.createElement('div');el.id='lh-loader';el.innerHTML='<canvas></canvas><div class="lh-in"><div class="lh-logo">L\u{1EEF} H\u{00E0}nh</div><div class="lh-sub">L\u{00E0}ng Thanh M\u{1ED9}c</div><p class="lh-story"></p><div class="lh-bar"><div class="lh-fill"></div></div><div class="lh-row"><span class="lh-lbl"></span><b class="lh-pct">0%</b></div><button class="lh-go" hidden>Ti\u{1EBF}p t\u{1EE5}c</button></div>';document.body.appendChild(el);}
    const P=pics();
    if(P['giao_dien:logo']){const lg=el.querySelector('.lh-logo');lg.innerHTML=`<img src="${P['giao_dien:logo'].replace(/"/g,'')}" alt="" referrerpolicy="no-referrer" style="max-width:240px;max-height:100px;object-fit:contain" onerror="this.parentNode.textContent='L\u{1EEF} H\u{00E0}nh'">`;}
    fill=el.querySelector('.lh-fill');pctEl=el.querySelector('.lh-pct');lbl=el.querySelector('.lh-lbl');story=el.querySelector('.lh-story');goBtn=el.querySelector('.lh-go');cv=el.querySelector('canvas');
  }
  // Tranh làng lúc hoàng hôn: núi xa, lũy tre, nhà sàn có đèn, người cha đội nón đi trên đường đất
  function paint(t){
    const w=cv.clientWidth||innerWidth,h=cv.clientHeight||innerHeight,d=Math.min(2,devicePixelRatio||1);
    if(cv.width!==Math.round(w*d)){cv.width=Math.round(w*d);cv.height=Math.round(h*d);}
    const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);
    if(bgImg&&bgImg.complete&&bgImg.naturalWidth){const s=Math.max(w/bgImg.naturalWidth,h/bgImg.naturalHeight),iw=bgImg.naturalWidth*s,ih=bgImg.naturalHeight*s;c.drawImage(bgImg,(w-iw)/2,(h-ih)/2,iw,ih);
      const v=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.2,w/2,h/2,Math.max(w,h)*.75);v.addColorStop(0,'#00000022');v.addColorStop(1,'#000000aa');c.fillStyle=v;c.fillRect(0,0,w,h);return;}
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1d2b3a');g.addColorStop(.45,'#7a4a3a');g.addColorStop(.62,'#e3a15a');g.addColorStop(.63,'#3d4a2e');g.addColorStop(1,'#141c12');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.fillStyle='#ffd98a';c.globalAlpha=.85;c.beginPath();c.arc(w*.72,h*.5,Math.min(w,h)*.07,0,Math.PI*2);c.fill();c.globalAlpha=1;
    const hill=(y,amp,col,ph)=>{c.fillStyle=col;c.beginPath();c.moveTo(0,h);for(let x=0;x<=w;x+=8)c.lineTo(x,y+Math.sin(x*.006+ph)*amp+Math.sin(x*.017+ph*2)*amp*.4);c.lineTo(w,h);c.fill();};
    hill(h*.55,h*.05,'#4a3a40',1);hill(h*.6,h*.035,'#2f3a2c',2.4);
    c.fillStyle='#1f2a1c';for(let i=0;i<34;i++){const x=(i*61)%w,bh=h*(.14+((i*37)%10)/80),sw=Math.sin(t*1.3+i)*3;c.beginPath();c.moveTo(x-3,h*.64);c.quadraticCurveTo(x+sw,h*.64-bh*.6,x+sw*2,h*.64-bh);c.quadraticCurveTo(x+sw+3,h*.64-bh*.6,x+3,h*.64);c.fill();}
    const hx=w*.22,hy=h*.64;c.fillStyle='#2a1d14';c.fillRect(hx-46,hy-36,92,34);c.fillRect(hx-40,hy-2,4,10);c.fillRect(hx+36,hy-2,4,10);
    c.fillStyle='#3a2a1a';c.beginPath();c.moveTo(hx-62,hy-34);c.lineTo(hx,hy-78);c.lineTo(hx+62,hy-34);c.fill();
    c.fillStyle='#ffcf7a';c.globalAlpha=.7+Math.sin(t*3)*.15;c.fillRect(hx-10,hy-28,20,16);c.globalAlpha=1;
    c.fillStyle='#4a3a26';c.beginPath();c.moveTo(w*.3,h);c.quadraticCurveTo(w*.5,h*.78,w*.62,h*.66);c.lineTo(w*.66,h*.66);c.quadraticCurveTo(w*.58,h*.8,w*.52,h);c.fill();
    const k=Math.min(w,h)/700,px=w*(.6-((t*.012)%.25)),py=h*.72+(.6-px/w)*h*.6,step=Math.sin(t*4);
    c.save();c.translate(px,py);c.scale(k*1.6,k*1.6);c.fillStyle='#120d0a';
    c.beginPath();c.moveTo(-14,-42);c.lineTo(0,-54);c.lineTo(14,-42);c.fill();c.fillRect(-5,-42,10,8);c.fillRect(-7,-34,14,22);
    c.fillRect(-6+step*3,-12,4,14);c.fillRect(2-step*3,-12,4,14);c.fillRect(6,-32,3,16);c.restore();
    const v=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.2,w/2,h/2,Math.max(w,h)*.75);v.addColorStop(0,'#00000000');v.addColorStop(1,'#000000aa');c.fillStyle=v;c.fillRect(0,0,w,h);
  }
  function tick(ts){
    raf=requestAnimationFrame(tick);const t=ts/1000;
    // thanh chạy mượt về mốc đã đạt; trong lúc chờ mạng thì nhích dần tới sát mốc kế tiếp
    if(target<cap)target=Math.min(cap-1,target+(cap-target)*.006+.01);
    shown+=(target-shown)*.12;if(Math.abs(target-shown)<.05)shown=target;
    fill.style.width=shown.toFixed(1)+'%';pctEl.textContent=Math.floor(shown)+'%';
    if(scene)paint(t);
  }
  const L={
    show(opt={}){
      mount();el.classList.remove('out');el.hidden=false;
      // ảnh nền màn hình chờ theo từng lúc (Sheet hinh_anh): nen_cho_tai_game, nen_cho_tao_nv, nen_cho_vao_lang; không có thì dùng nen_cho
      const P=pics(),src=P['giao_dien:nen_cho_'+(opt.bg||'')]||P['giao_dien:nen_cho']||'';
      if(src){if(!bgImg||bgImg.dataset.src!==src){bgImg=new Image();bgImg.referrerPolicy='no-referrer';bgImg.dataset.src=src;bgImg.src=src;}}else bgImg=null;
      scene=!!opt.scene||!!opt.story||!!bgImg;cv.style.display=scene?'':'none';
      if(!opt.keep){shown=target=cap=0;}story.textContent='';goBtn.hidden=true;lbl.textContent=opt.label||'';
      if(opt.story){
        const words=String(opt.story).split(' ');let i=0;
        // chạm màn hình để hiện hết lời dẫn
        el.onclick=()=>{i=words.length-1;};
        storyDone=new Promise(ok=>{const iv=setInterval(()=>{if(!el||el.hidden){clearInterval(iv);ok();return;}story.textContent=words.slice(0,++i).join(' ');if(i>=words.length){clearInterval(iv);el.onclick=null;setTimeout(ok,1400);}},opt.speed||160);});
      }else storyDone=Promise.resolve();
      if(!raf)raf=requestAnimationFrame(tick);t0=Date.now();return L;
    },
    // pct: mốc vừa xong; next: mốc kế tiếp (thanh nhích dần trong lúc chờ)
    step(pct,label,next){mount();target=Math.max(target,pct);cap=Math.max(target,next||pct);if(label!=null)lbl.textContent=label;return L;},
    async done(opt={}){
      mount();target=cap=100;lbl.textContent=opt.label||'S\u{1EB5}n s\u{00E0}ng';
      await new Promise(r=>setTimeout(r,450));
      await storyDone;
      if(opt.confirm){goBtn.hidden=false;await new Promise(ok=>{goBtn.onclick=ok;});}
      const wait=Math.max(0,(opt.min||0)-(Date.now()-t0));if(wait)await new Promise(r=>setTimeout(r,wait));
      el.classList.add('out');await new Promise(r=>setTimeout(r,500));el.hidden=true;cancelAnimationFrame(raf);raf=0;
    },
    hide(){if(!el)return;el.classList.add('out');setTimeout(()=>{el.hidden=true;},500);cancelAnimationFrame(raf);raf=0;},
    get visible(){return !!el&&!el.hidden&&!el.classList.contains('out');}
  };
  return L;
})();
;/* ================= KHỞI ĐỘNG: hiện màn hình chờ ngay, tải CSS + JS của game có đếm phần trăm ================= */
(function(){
  var me=document.currentScript,base=(me&&me.src||'').replace(/[^\/]*$/,''),FILES={"css":{"name":"lu-hanh.css","size":43864},"js":{"name":"lu-hanh.js","size":439585}};
  window.LH_BASE=window.LH_BASE||base;
  var L=window.LH_Loader.show({label:'T\u{1EA3}i t\u{00E0}i nguy\u{00EA}n trang',bg:'tai_game'});
  function plain(){var l=document.createElement('link');l.rel='stylesheet';l.href=base+FILES.css.name;document.head.appendChild(l);var s=document.createElement('script');s.src=base+FILES.js.name;s.charset='utf-8';document.head.appendChild(s);}
  async function get(f,from,to,label){
    var r=await fetch(base+f.name);if(!r.ok||!r.body)throw Error('fetch');
    var rd=r.body.getReader(),n=0,parts=[];L.step(from,label,to);
    for(;;){var x=await rd.read();if(x.done)break;parts.push(x.value);n+=x.value.length;L.step(from+(to-from)*Math.min(1,n/f.size),null,to);}
    var buf=new Uint8Array(n),o=0;parts.forEach(function(p){buf.set(p,o);o+=p.length;});
    return new TextDecoder('utf-8').decode(buf);
  }
  (async function(){
    var css=await get(FILES.css,0,12,'T\u{1EA3}i giao di\u{1EC7}n');
    var js=await get(FILES.js,12,70,'T\u{1EA3}i tr\u{00F2} ch\u{01A1}i');
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var sc=document.createElement('script');sc.text=js;document.head.appendChild(sc);
  })().catch(function(){plain();});
})();
