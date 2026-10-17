/* ================= ÂM THANH (v10.8) =================
   Toàn bộ âm thanh tổng hợp bằng Web Audio ngay trong trình duyệt (không tải file): nhạc nền ngũ cung gảy như đàn tranh,
   tiếng gió / chim / dế theo cảnh, tiếng đánh nhau (vung kiếm, trúng đòn, bắn cung, nỏ, phép, đỡ khiên), nhặt đồ, lên cấp, rèn đồ, giao diện.
   iPhone / Safari chỉ cho phát sau một thao tác chạm: mở khóa ở lần chạm / bấm phím đầu tiên. Bật tắt ở nút Âm thanh (lưu trong máy, khóa lh-am). */
const LH_Audio=(()=>{
  let ctx=null,master=null,sfx=null,mus=null,amb=null,noiseBuf=null,on=true,scene='',musTimer=0,ambTimer=0,nextBeat=0,bar=0,melodyNote=2,lastPlay={};
  try{on=localStorage.getItem('lh-am')!=='0';}catch(e){}
  const SC={village:[0,2,4,7,9,12,14,16],citadel:[0,2,4,7,9,12,14,16],wild:[0,3,5,7,10,12,15,17],boss:[0,3,5,6,7,10,12]};
  const BASE={village:220,citadel:246.9,wild:174.6,boss:164.8};
  function ac(){
    if(ctx)return ctx;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
    ctx=new AC();master=ctx.createGain();master.gain.value=on?1:0;master.connect(ctx.destination);
    sfx=ctx.createGain();sfx.gain.value=.8;sfx.connect(master);mus=ctx.createGain();mus.gain.value=.3;mus.connect(master);amb=ctx.createGain();amb.gain.value=.2;amb.connect(master);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.hidden)ctx.suspend();else if(on)ctx.resume();});
    return ctx;
  }
  const now=()=>ctx.currentTime;
  // Một nốt: dao động với đường bao gain (attack / decay), có thể trượt tần số f0 → f1
  function tone(o){
    const t0=o.at!=null?o.at:now(),osc=ctx.createOscillator(),g=ctx.createGain(),out=o.out||sfx;
    osc.type=o.type||'sine';osc.frequency.setValueAtTime(o.f0||440,t0);if(o.f1)osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1),t0+(o.dur||.2));
    const v=o.vol==null?.3:o.vol,a=o.attack||.004;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(v,t0+a);g.gain.exponentialRampToValueAtTime(.0001,t0+(o.dur||.2));
    let n=osc;if(o.lp){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;osc.connect(f);n=f;}
    n.connect(g);g.connect(out);osc.start(t0);osc.stop(t0+(o.dur||.2)+.05);
  }
  // Tiếng ồn qua bộ lọc (gió, va chạm, vung vũ khí)
  function noise(o){
    const t0=o.at!=null?o.at:now(),s=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter(),out=o.out||sfx;
    s.buffer=noiseBuf;s.loop=true;s.playbackRate.value=o.rate||1;f.type=o.ft||'bandpass';f.frequency.setValueAtTime(o.f0||1200,t0);if(o.f1)f.frequency.exponentialRampToValueAtTime(Math.max(30,o.f1),t0+(o.dur||.2));f.Q.value=o.q||1;
    const v=o.vol==null?.25:o.vol,a=o.attack||.005;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(v,t0+a);g.gain.exponentialRampToValueAtTime(.0001,t0+(o.dur||.2));
    s.connect(f);f.connect(g);g.connect(out);s.start(t0);s.stop(t0+(o.dur||.2)+.05);
  }
  // Nốt gảy (đàn tranh / đàn bầu): hai dao động lệch nhẹ, tắt nhanh, có hoạ âm
  function pluck(f,at,vol,dur,out){
    tone({type:'triangle',f0:f,at,vol:vol*.8,dur,attack:.003,out,lp:f*6});tone({type:'sine',f0:f*2.01,at,vol:vol*.25,dur:dur*.5,attack:.002,out});
    tone({type:'sine',f0:f*1.002,at,vol:vol*.4,dur:dur*1.2,attack:.003,out});
  }
  const SFX={
    swing:()=>noise({f0:900,f1:2600,q:.8,dur:.16,vol:.22,rate:1.3}),
    bash:()=>{noise({f0:300,f1:120,q:1,dur:.18,vol:.35});tone({type:'square',f0:160,f1:70,dur:.14,vol:.12});},
    thrust:()=>noise({f0:600,f1:2200,q:1.2,dur:.13,vol:.2,rate:1.6}),
    magic:()=>{tone({type:'sine',f0:520,f1:1400,dur:.35,vol:.16});tone({type:'triangle',f0:780,f1:1900,dur:.3,vol:.08,at:now()+.05});noise({f0:3000,f1:6000,q:2,dur:.3,vol:.06});},
    bow:()=>{tone({type:'triangle',f0:900,f1:180,dur:.09,vol:.18});noise({f0:2400,f1:900,q:1.5,dur:.2,vol:.14,at:now()+.02});},
    crossbow:()=>{tone({type:'square',f0:220,f1:60,dur:.08,vol:.2});noise({f0:1600,f1:500,q:1.2,dur:.16,vol:.2});},
    hit:()=>{noise({f0:700,f1:150,q:.9,dur:.12,vol:.28});tone({type:'sine',f0:180,f1:60,dur:.12,vol:.25});},
    crit:()=>{noise({f0:900,f1:200,q:.9,dur:.16,vol:.34});tone({type:'sine',f0:220,f1:50,dur:.16,vol:.3});tone({type:'triangle',f0:1800,f1:2600,dur:.14,vol:.1,at:now()+.03});},
    block:()=>{tone({type:'square',f0:1400,f1:900,dur:.12,vol:.1});noise({f0:3200,q:3,dur:.14,vol:.18,ft:'highpass'});tone({type:'sine',f0:520,f1:400,dur:.2,vol:.12});},
    hurt:()=>{tone({type:'sawtooth',f0:230,f1:110,dur:.18,vol:.14,lp:900});noise({f0:400,f1:120,q:.8,dur:.14,vol:.18});},
    die:()=>{tone({type:'sawtooth',f0:260,f1:40,dur:.9,vol:.16,lp:700});noise({f0:500,f1:60,q:.7,dur:.8,vol:.2});},
    kill:()=>{noise({f0:1200,f1:120,q:.8,dur:.32,vol:.22});tone({type:'triangle',f0:300,f1:90,dur:.3,vol:.14});},
    boss:()=>{for(let i=0;i<3;i++)tone({type:'sine',f0:70-i*8,f1:35,dur:.5,vol:.3,at:now()+i*.17});noise({f0:200,f1:40,q:.6,dur:1,vol:.3});},
    coin:()=>{tone({type:'sine',f0:1760,dur:.09,vol:.14});tone({type:'sine',f0:2349,dur:.22,vol:.14,at:now()+.07});},
    pickup:()=>{[523,659,784].forEach((f,i)=>tone({type:'triangle',f0:f,dur:.18,vol:.12,at:now()+i*.06}));},
    rare:()=>{[523,659,784,1047,1319].forEach((f,i)=>tone({type:'triangle',f0:f,dur:.35,vol:.12,at:now()+i*.08}));tone({type:'sine',f0:2093,dur:.8,vol:.06,at:now()+.4});},
    levelup:()=>{[440,554,659,880,1109,1319].forEach((f,i)=>pluck(f,now()+i*.09,.2,.6,sfx));tone({type:'sine',f0:1760,dur:1.2,vol:.08,at:now()+.5});},
    ui:()=>tone({type:'triangle',f0:1200,f1:900,dur:.05,vol:.07}),
    open:()=>{tone({type:'triangle',f0:660,f1:880,dur:.08,vol:.07});tone({type:'triangle',f0:990,dur:.1,vol:.05,at:now()+.06});},
    buy:()=>{[1568,1976,2349].forEach((f,i)=>tone({type:'sine',f0:f,dur:.12,vol:.1,at:now()+i*.05}));},
    anvil:()=>{tone({type:'square',f0:2200,f1:1800,dur:.08,vol:.06});tone({type:'sine',f0:900,f1:700,dur:.16,vol:.14});noise({f0:4000,q:4,dur:.1,vol:.1,ft:'highpass'});},
    enhanceOk:()=>{[784,988,1175,1568].forEach((f,i)=>tone({type:'triangle',f0:f,dur:.3,vol:.12,at:now()+i*.07}));},
    enhanceFail:()=>{tone({type:'sawtooth',f0:200,f1:120,dur:.4,vol:.1,lp:600});tone({type:'sawtooth',f0:190,f1:110,dur:.4,vol:.08,lp:600,at:now()+.05});},
    fuse:()=>{noise({f0:300,f1:4000,q:1,dur:.9,vol:.12});[523,784,1047,1568,2093].forEach((f,i)=>tone({type:'sine',f0:f,dur:.6,vol:.1,at:now()+.3+i*.08}));},
    heal:()=>{[660,880,1100].forEach((f,i)=>tone({type:'sine',f0:f,f1:f*1.05,dur:.3,vol:.08,at:now()+i*.08}));},
    step:()=>noise({f0:260,f1:120,q:.8,dur:.07,vol:.09,rate:.8}),
    hoof:()=>{tone({type:'sine',f0:140,f1:60,dur:.07,vol:.12});noise({f0:500,f1:200,q:1,dur:.05,vol:.07});},
    glide:()=>noise({f0:400,f1:900,q:.6,dur:.4,vol:.04,ft:'lowpass'}),
    mount:()=>{noise({f0:300,f1:1500,q:.8,dur:.25,vol:.14});tone({type:'triangle',f0:300,f1:600,dur:.2,vol:.08});},
    roar:()=>{tone({type:'sawtooth',f0:120,f1:80,dur:.5,vol:.14,lp:500});noise({f0:300,f1:150,q:.7,dur:.5,vol:.2});},
    portal:()=>{noise({f0:200,f1:2400,q:.7,dur:.8,vol:.12});tone({type:'sine',f0:300,f1:1200,dur:.7,vol:.08});},
    safe:()=>{tone({type:'sine',f0:880,dur:.9,vol:.08});tone({type:'sine',f0:1320,dur:.7,vol:.05,at:now()+.12});},
    quest:()=>{[784,1047,1319].forEach((f,i)=>pluck(f,now()+i*.1,.16,.5,sfx));},
    error:()=>tone({type:'square',f0:220,f1:180,dur:.12,vol:.05}),
    bolt:()=>{noise({f0:2000,f1:400,q:1,dur:.25,vol:.2});tone({type:'sawtooth',f0:900,f1:200,dur:.2,vol:.08,lp:1500});},
    freeze:()=>{[2000,2600,3200].forEach((f,i)=>tone({type:'sine',f0:f,dur:.25,vol:.05,at:now()+i*.04}));noise({f0:5000,q:3,dur:.3,vol:.06,ft:'highpass'});}
  };
  const MIN_GAP={hit:.05,crit:.05,step:.12,hoof:.1,swing:.06,ui:.04,coin:.05,pickup:.08};
  function play(name,o={}){
    if(!on||!ctx||ctx.state!=='running'||!SFX[name])return;const t=now(),g=MIN_GAP[name]||.02;if(lastPlay[name]&&t-lastPlay[name]<g)return;lastPlay[name]=t;
    try{if(o.vol!=null){const save=sfx.gain.value;sfx.gain.setValueAtTime(save*o.vol,t);sfx.gain.setValueAtTime(save,t+.5);}SFX[name]();}catch(e){}
  }
  // ---- Nhạc nền: ngũ cung gảy, giai điệu đi ngẫu nhiên có trọng âm theo nhịp, trầm giữ nền; nhịp trống nhẹ ở vùng hoang dã / trùm
  function beat(){
    if(!ctx||!on||!scene)return;const sc=SC[scene]||SC.village,base=BASE[scene]||220,tempo=scene==='boss'?.27:scene==='wild'?.42:.5;
    while(nextBeat<now()+.6){
      const i=bar%8,t=nextBeat;
      if(i===0||(scene!=='village'&&i===4))pluck(base/2,t,.22,tempo*4,mus); // trầm
      const step=Math.random();melodyNote+=step<.3?-1:step<.65?1:step<.8?0:step<.9?2:-2;melodyNote=Math.max(0,Math.min(sc.length-1,melodyNote));
      const rest=scene==='village'?(i%2===1&&Math.random()<.45):Math.random()<.2;
      if(!rest){const f=base*Math.pow(2,sc[melodyNote]/12);pluck(f,t,i===0?.26:.17,tempo*(Math.random()<.3?3:1.6),mus);
        if(scene==='citadel'&&i===0&&Math.random()<.5)tone({type:'sine',f0:f*2,dur:1.6,vol:.05,at:t,out:mus}); // chuông
        if(scene==='village'&&Math.random()<.25)tone({type:'sine',f0:f,f1:f*1.06,dur:tempo*1.4,vol:.05,at:t+tempo*.6,out:mus}); // luyến như đàn bầu
      }
      if(scene==='wild'||scene==='boss'){if(i%4===0)tone({type:'sine',f0:90,f1:45,dur:.28,vol:scene==='boss'?.26:.14,at:t,out:mus});if(scene==='boss'&&i%2===1)noise({f0:1800,q:1,dur:.06,vol:.08,ft:'highpass',at:t,out:mus});}
      nextBeat+=tempo;bar++;
    }
  }
  // ---- Tiếng cảnh: gió nền + chim (làng, thành) / dế, cú (hoang dã) / gầm trầm (trùm)
  function ambient(){
    if(!ctx||!on||!scene)return;const t=now();
    noise({ft:'lowpass',f0:300+Math.random()*300,f1:200,q:.5,dur:3.2,vol:scene==='wild'?.09:.05,attack:1.2,at:t,out:amb}); // gió
    if(scene==='village'||scene==='citadel'){if(Math.random()<.7){const f=2400+Math.random()*1200,n=2+Math.floor(Math.random()*3);for(let k=0;k<n;k++)tone({type:'sine',f0:f,f1:f*1.3,dur:.09,vol:.05,at:t+Math.random()*1.5+k*.13,out:amb});}
      if(scene==='citadel'&&Math.random()<.25)noise({f0:800,f1:300,q:.8,dur:.5,vol:.04,at:t+Math.random()*2,out:amb}); /* tiếng người xa */}
    else if(scene==='wild'){if(Math.random()<.6)for(let k=0;k<6;k++)tone({type:'sine',f0:4200,dur:.03,vol:.025,at:t+Math.random()*2.5+k*.06,out:amb}); // dế
      if(Math.random()<.15)tone({type:'sine',f0:420,f1:380,dur:.5,vol:.05,at:t+Math.random()*2,out:amb}); // cú
    }else if(scene==='boss'&&Math.random()<.4)tone({type:'sawtooth',f0:55,f1:40,dur:1.2,vol:.06,at:t+Math.random(),out:amb,lp:200});
  }
  function start(){if(!ctx||musTimer)return;nextBeat=now()+.1;musTimer=setInterval(beat,300);ambTimer=setInterval(ambient,3000);ambient();}
  function setScene(s){if(s===scene)return;scene=s;bar=0;melodyNote=2;if(ctx&&on){nextBeat=Math.max(nextBeat,now()+.4);}}
  // Mở khóa ở thao tác đầu tiên (iPhone / Safari): tạo AudioContext trong sự kiện chạm, phát một nốt câm
  function unlock(){const c=ac();if(!c)return;if(c.state!=='running')c.resume().then(start).catch(()=>{});else start();
    try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}catch(e){}}
  ['pointerdown','keydown','touchend'].forEach(ev=>document.addEventListener(ev,unlock,{capture:true,passive:true}));
  function toggle(v){on=v==null?!on:!!v;try{localStorage.setItem('lh-am',on?'1':'0');}catch(e){}
    if(ctx){if(on){ctx.resume().catch(()=>{});master.gain.cancelScheduledValues(now());master.gain.setTargetAtTime(1,now(),.05);start();}else master.gain.setTargetAtTime(0,now(),.05);}
    return on;}
  return {play,setScene,toggle,get on(){return on;},unlock};
})();
