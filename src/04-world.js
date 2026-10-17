/* ================= THẾ GIỚI: bộ bản đồ dùng chung =================
   Mỗi bản đồ / phó bản là một gói dữ liệu (thư mục maps/, xem maps/README.md): ô nền, nhà, cây, dân làng, quái, cầu, vùng an toàn, cổng sang bản đồ khác.
   Bản đồ đầu (Thanh Mộc) nằm sẵn trong game; bản đồ khác chỉ tải khi nhân vật tới gần cổng (gói dist/maps/<mã>.js: dữ liệu + hình vẽ riêng), nên thêm bản đồ không làm game nặng thêm.
   Chỉ số nhân vật, rơi đồ, nhiệm vụ… vẫn tính bằng một bộ luật chung (Player) cho mọi bản đồ. */
const LH_MAPS=(typeof window!=='undefined'&&(window.LH_MAPS=window.LH_MAPS||{}))||{};
const World=(()=>{
  const T=48,TILE={'.':0,'#':1,'~':2,'=':3,':':4,',':5,'"':6};
  let M=null,grid=[],base=[],objects=[],npcs=[],wells=[],fires=[],ripples=[],lights=[],W=0,H=0,campSpawns=[],camps=[],zones=[];
  const DEFAULT='thanh-moc';
  // Dựng bản đồ từ dữ liệu
  function use(def){
    M=def;W=def.w;H=def.h;
    grid=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{const c=(def.tiles[y]||'')[x];return c in TILE?TILE[c]:1;}));
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x===0||y===0||x===W-1||y===H-1)grid[y][x]=1;
    base=grid.map(r=>r.slice()); // ô nền gốc (trước khi nhà, cây, đá chắn lối) để vẽ nền
    objects=[];
    const block=(x,y)=>{if(y>=0&&y<H&&x>=0&&x<W)grid[y][x]=1;};
    for(const [x,y,dry] of def.trees||[]){block(x,y);objects.push({kind:'tree',x:(x+.5)*T,y:(y+.6)*T,seed:x*31+y*17,dry:!!dry});}
    fires=[];wells=[];lights=[];
    for(const o of def.objects||[]){
      if(o.kind==='house'){for(let y=o.y;y<o.y+o.h;y++)for(let x=o.x;x<o.x+o.w;x++)block(x,y);objects.push({...o,foot:(o.y+o.h)*T});}
      else if(o.kind==='banyan'){block(o.x,o.y);objects.push({kind:'banyan',x:(o.x+.5)*T,y:(o.y+.8)*T});}
      else if(o.kind==='fire'){block(o.x,o.y);const f={kind:'fire',x:(o.x+.5)*T,y:(o.y+.6)*T};objects.push(f);fires.push(f);}
      else if(o.kind==='well'){block(o.x,o.y);const w=o.ancient?{kind:'well',ancient:true,id:o.id,x:(o.x+.5)*T,y:(o.y+.7)*T}:{kind:'well',x:(o.x+.5)*T,y:(o.y+.7)*T};objects.push(w);if(o.ancient)wells.push(w);}
      // vật trang trí riêng của gói bản đồ (đá, xương rồng, thông tuyết, thạch nhũ, pha lê…): vẽ bằng LH_ART.obj[kind]; solid:false = đi xuyên qua được
      else{const sz=o.w||1,rows=o.h||1;if(o.solid!==false)for(let k=0;k<sz;k++)for(let j=0;j<rows;j++)block(o.x+k,o.y-j);const g={...o,tx:o.x,ty:o.y,x:(o.x+sz/2)*T,y:(o.y+.7)*T,seed:o.seed??(o.x*31+o.y*17)};objects.push(g);if(o.light)lights.push(g);}
    }
    npcs=(def.npcs||[]).map(n=>({...n,x:n.x*T,y:n.y*T,...(n.x0!=null?{x0:n.x0*T,x1:n.x1*T}:{}),lines:n.lines||[],hx:n.x*T,hy:n.y*T,facing:n.facing||-1,moving:false,walk:0,dir:1,pause:0,turnAt:0,phase:Math.random()}));
    // gợn nước: ô nước đầu tiên mỗi hàng (bỏ hàng có cầu)
    // Bãi quái (camps): rải n con mỗi loài trên các ô trống trong bán kính r quanh tâm (cố định theo vị trí, mọi máy như nhau)
    // (lúc khởi động Player chưa sẵn: chỉ dùng khung vùng an toàn ghi trong bản đồ)
    const sf=def.safe,inSafeRect=(x,y)=>!!sf&&x>=sf.x0&&x<=sf.x1&&y>=sf.y0&&y<=sf.y1;
    campSpawns=[];camps=[];
    for(const cp of def.camps||[]){
      const r=cp.r||3,spots=[];
      for(let y=cp.y-r;y<=cp.y+r;y++)for(let x=cp.x-r;x<=cp.x+r;x++){if((x-cp.x)**2+(y-cp.y)**2>r*r+1||blocked(x,y)||grid[y][x]===3)continue;if(inSafeRect(x,y))continue;spots.push({x,y,h:((x*73856093)^(y*19349663))>>>0});}
      spots.sort((a,b)=>a.h-b.h);let k=0;
      for(const [type,n] of Object.entries(cp.mon||{}))for(let i=0;i<n&&spots.length;i++){const p=spots[k++%spots.length];campSpawns.push({type,x:p.x,y:p.y,camp:cp.name});}
      camps.push({name:cp.name,x:(cp.x+.5)*T,y:(cp.y+.5)*T,r:r*T});
    }
    zones=[...(def.camps||[]).map(cp=>({name:cp.name,x0:cp.x-(cp.r||3)-1,y0:cp.y-(cp.r||3)-1,x1:cp.x+(cp.r||3)+1,y1:cp.y+(cp.r||3)+1})),...(def.zones||[])];
    ripples=[];for(let y=1;y<H-1;y++){const x=grid[y].indexOf(2);if(x>0&&!grid[y].includes(3))ripples.push({x,y});}
    return World;
  }
  // Lấy bản đồ: có sẵn trong game thì dùng luôn, chưa có thì tải gói bản đồ dist/maps/<mã>.js (dữ liệu + hình vẽ, chỉ một lần).
  // Gói tự gọi LH_PACK khi tải xong. Tải trước khi nhân vật tới gần cổng (prefetch) nên bước qua cổng là vào ngay.
  const loading={};
  function load(id){
    id=id||DEFAULT;if(LH_MAPS[id])return Promise.resolve(LH_MAPS[id]);
    if(!loading[id]){
      const base=(typeof window!=='undefined'&&(window.LH_MAP_BASE||(window.LH_BASE?window.LH_BASE+'maps/':window.LH_MAP_CDN)))||'';
      loading[id]=new Promise((ok,no)=>{
        if(!base||typeof document==='undefined')return no(Error('KHONG_CO_BAN_DO'));
        const s=document.createElement('script');s.src=base+id+'.js';s.charset='utf-8';s.async=true;
        s.onload=()=>LH_MAPS[id]?ok(LH_MAPS[id]):no(Error('KHONG_CO_BAN_DO'));s.onerror=()=>no(Error('KHONG_CO_BAN_DO'));
        document.head.appendChild(s);
      }).catch(e=>{delete loading[id];throw e;});
    }
    return loading[id];
  }
  const prefetch=id=>{if(id&&!LH_MAPS[id])load(id).catch(()=>{});};
  // Quái thu phục đi theo về làng: tải gói chứa hình vẽ của loài quái đó
  const monPack=type=>{const id=(typeof window!=='undefined'&&window.LH_MON_PACK||{})[type];if(id)prefetch(id);};
  async function enter(id){let d;try{d=await load(id);}catch(e){d=await load(DEFAULT);}use(d);return d.id;}
  const S=()=>M.safe||null;
  // Vùng an toàn (hình chữ nhật theo ô; Thanh Mộc lấy cạnh phải từ Sheet cấu hình vung_an_toan_x)
  function isSafe(x,y){
    const s=S();if(!s)return false;const x1=s.cfg&&typeof Player!=='undefined'&&Number(Player.CFG[s.cfg])?Number(Player.CFG[s.cfg]):s.x1;
    return x>=s.x0*T&&x<(x1+1)*T&&(y==null||(y>=s.y0*T&&y<(s.y1+1)*T));
  }
  const zoneAt=(x,y)=>{for(const z of zones)if(x>=z.x0*T&&x<(z.x1+1)*T&&y>=z.y0*T&&y<(z.y1+1)*T)return z.name;return M.name;};
  const portalAt=(x,y)=>(M.portals||[]).find(p=>x>=p.x*T&&x<(p.x+(p.w||1))*T&&y>=p.y*T&&y<(p.y+(p.h||1))*T)||null;
  const blocked=(x,y)=>x<0||y<0||x>=W||y>=H||grid[y][x]===1||grid[y][x]===2;
  function canStand(x,y,r=11){
    if(!Number.isFinite(x)||!Number.isFinite(y))return false;
    for(let gy=Math.floor((y-r)/T);gy<=Math.floor((y+r)/T);gy++)for(let gx=Math.floor((x-r)/T);gx<=Math.floor((x+r)/T);gx++)if(blocked(gx,gy)){
      const cx=Math.max(gx*T,Math.min(x,(gx+1)*T)),cy=Math.max(gy*T,Math.min(y,(gy+1)*T));
      if((x-cx)**2+(y-cy)**2<r*r)return false;
    }
    return true;
  }
  function move(p,dx,dy,r=11){
    if(!Number.isFinite(dx)||!Number.isFinite(dy))return p;dx=Math.max(-300,Math.min(300,dx));dy=Math.max(-300,Math.min(300,dy));
    const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/6));
    for(let i=0;i<n;i++){if(canStand(p.x+dx/n,p.y,r))p.x+=dx/n;if(canStand(p.x,p.y+dy/n,r))p.y+=dy/n;}
    return p;
  }
  function nearestOpen(tx,ty){
    if(!blocked(tx,ty))return {x:tx,y:ty};
    for(let d=1;d<=4;d++)for(let y=ty-d;y<=ty+d;y++)for(let x=tx-d;x<=tx+d;x++)if(Math.max(Math.abs(x-tx),Math.abs(y-ty))===d&&!blocked(x,y))return {x,y};
    return null;
  }
  function findPath(from,to){
    const sx=Math.floor(from.x/T),sy=Math.floor(from.y/T),goal=nearestOpen(Math.floor(to.x/T),Math.floor(to.y/T));
    if(blocked(sx,sy)||!goal)return null;
    const ex=goal.x,ey=goal.y,key=(x,y)=>y*W+x,start=key(sx,sy),end=key(ex,ey),queue=[start],parent=new Map([[start,-1]]);
    for(let i=0;i<queue.length;i++){
      const k=queue[i];if(k===end)break;const x=k%W,y=Math.floor(k/W);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,nk=key(nx,ny);if(!blocked(nx,ny)&&!parent.has(nk)){parent.set(nk,k);queue.push(nk);}}
    }
    if(!parent.has(end))return null;
    const path=[];let k=end;while(k!==-1){path.push({x:(k%W+.5)*T,y:(Math.floor(k/W)+.5)*T});k=parent.get(k);}
    path.reverse();
    if(ex===Math.floor(to.x/T)&&ey===Math.floor(to.y/T)&&canStand(to.x,to.y))path[path.length-1]={x:to.x,y:to.y};
    return path;
  }
  const api={T,DEFAULT,use,load,prefetch,monPack,enter,isSafe,zoneAt,portalAt,blocked,canStand,move,findPath,nearestOpen,
    get id(){return M.id;},get name(){return M.name;},get def(){return M;},get W(){return W;},get H(){return H;},get grid(){return grid;},get base(){return base;},get objects(){return objects;},
    get npcs(){return npcs;},get wells(){return wells;},get fires(){return fires;},get ripples(){return ripples;},get lights(){return lights;},get theme(){return M.theme||null;},get decor(){return M.decor||[];},get bridges(){return M.bridges||[];},get portals(){return M.portals||[];},
    get spawn(){return {x:M.spawn.x*T,y:M.spawn.y*T};},get monsterSpawns(){return [...(M.monsters||[]),...campSpawns];},get camps(){return camps;}};
  return api;
})();
if(LH_MAPS[World.DEFAULT])World.use(LH_MAPS[World.DEFAULT]);
