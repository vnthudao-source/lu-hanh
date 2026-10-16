/* ================= THẾ GIỚI: bộ bản đồ dùng chung =================
   Mỗi bản đồ / phó bản là một gói dữ liệu (thư mục maps/, xem maps/README.md): ô nền, nhà, cây, dân làng, quái, cầu, vùng an toàn, cổng sang bản đồ khác.
   Bản đồ đầu (Thanh Mộc) nằm sẵn trong game; bản đồ khác chỉ tải khi nhân vật bước vào (dist/maps/<mã>.json), nên thêm bản đồ không làm game nặng thêm.
   Chỉ số nhân vật, rơi đồ, nhiệm vụ… vẫn tính bằng một bộ luật chung (Player) cho mọi bản đồ. */
const LH_MAPS=(typeof window!=='undefined'&&window.LH_MAPS)||{};
const World=(()=>{
  const T=48,TILE={'.':0,'#':1,'~':2,'=':3,':':4,',':5,'"':6};
  let M=null,grid=[],objects=[],npcs=[],wells=[],fires=[],ripples=[],W=0,H=0;
  const DEFAULT='thanh-moc';
  // Dựng bản đồ từ dữ liệu
  function use(def){
    M=def;W=def.w;H=def.h;
    grid=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{const c=(def.tiles[y]||'')[x];return c in TILE?TILE[c]:1;}));
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x===0||y===0||x===W-1||y===H-1)grid[y][x]=1;
    objects=[];
    const block=(x,y)=>{if(y>=0&&y<H&&x>=0&&x<W)grid[y][x]=1;};
    for(const [x,y,dry] of def.trees||[]){block(x,y);objects.push({kind:'tree',x:(x+.5)*T,y:(y+.6)*T,seed:x*31+y*17,dry:!!dry});}
    fires=[];wells=[];
    for(const o of def.objects||[]){
      if(o.kind==='house'){for(let y=o.y;y<o.y+o.h;y++)for(let x=o.x;x<o.x+o.w;x++)block(x,y);objects.push({...o,foot:(o.y+o.h)*T});}
      else if(o.kind==='banyan'){block(o.x,o.y);objects.push({kind:'banyan',x:(o.x+.5)*T,y:(o.y+.8)*T});}
      else if(o.kind==='fire'){block(o.x,o.y);const f={kind:'fire',x:(o.x+.5)*T,y:(o.y+.6)*T};objects.push(f);fires.push(f);}
      else if(o.kind==='well'){block(o.x,o.y);const w=o.ancient?{kind:'well',ancient:true,id:o.id,x:(o.x+.5)*T,y:(o.y+.7)*T}:{kind:'well',x:(o.x+.5)*T,y:(o.y+.7)*T};objects.push(w);if(o.ancient)wells.push(w);}
    }
    npcs=(def.npcs||[]).map(n=>({...n,x:n.x*T,y:n.y*T,...(n.x0!=null?{x0:n.x0*T,x1:n.x1*T}:{}),lines:n.lines||[],hx:n.x*T,hy:n.y*T,facing:n.facing||-1,moving:false,walk:0,dir:1,pause:0,turnAt:0,phase:Math.random()}));
    // gợn nước: ô nước đầu tiên mỗi hàng (bỏ hàng có cầu)
    ripples=[];for(let y=1;y<H-1;y++){const x=grid[y].indexOf(2);if(x>0&&!grid[y].includes(3))ripples.push({x,y});}
    return World;
  }
  // Lấy bản đồ: có sẵn trong game thì dùng luôn, chưa có thì tải gói dữ liệu (chỉ một lần)
  const loading={};
  function load(id){
    id=id||DEFAULT;if(LH_MAPS[id])return Promise.resolve(LH_MAPS[id]);
    if(!loading[id]){
      const base=(typeof window!=='undefined'&&(window.LH_MAP_BASE||(window.LH_BASE?window.LH_BASE+'maps/':window.LH_MAP_CDN)))||'';
      loading[id]=(base?fetch(base+id+'.json').then(r=>{if(!r.ok)throw Error('KHONG_CO_BAN_DO');return r.json();}):Promise.reject(Error('KHONG_CO_BAN_DO')))
        .then(d=>LH_MAPS[id]=d,e=>{delete loading[id];throw e;});
    }
    return loading[id];
  }
  async function enter(id){let d;try{d=await load(id);}catch(e){d=await load(DEFAULT);}use(d);return d.id;}
  const S=()=>M.safe||null;
  // Vùng an toàn (hình chữ nhật theo ô; Thanh Mộc lấy cạnh phải từ Sheet cấu hình vung_an_toan_x)
  function isSafe(x,y){
    const s=S();if(!s)return false;const x1=s.cfg&&typeof Player!=='undefined'&&Number(Player.CFG[s.cfg])?Number(Player.CFG[s.cfg]):s.x1;
    return x>=s.x0*T&&x<(x1+1)*T&&(y==null||(y>=s.y0*T&&y<(s.y1+1)*T));
  }
  const zoneAt=(x,y)=>{for(const z of M.zones||[])if(x>=z.x0*T&&x<(z.x1+1)*T&&y>=z.y0*T&&y<(z.y1+1)*T)return z.name;return M.name;};
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
  const api={T,DEFAULT,use,load,enter,isSafe,zoneAt,portalAt,blocked,canStand,move,findPath,nearestOpen,
    get id(){return M.id;},get name(){return M.name;},get def(){return M;},get W(){return W;},get H(){return H;},get grid(){return grid;},get objects(){return objects;},
    get npcs(){return npcs;},get wells(){return wells;},get fires(){return fires;},get ripples(){return ripples;},get decor(){return M.decor||[];},get bridges(){return M.bridges||[];},get portals(){return M.portals||[];},
    get spawn(){return {x:M.spawn.x*T,y:M.spawn.y*T};},get monsterSpawns(){return M.monsters||[];}};
  return api;
})();
if(LH_MAPS[World.DEFAULT])World.use(LH_MAPS[World.DEFAULT]);
