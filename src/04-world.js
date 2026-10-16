/* ================= THẾ GIỚI: làng Việt xưa ================= */
const World=(()=>{
  const T=48,W=60,H=32;
  // 0 cỏ · 1 vật cản · 2 nước · 3 cầu · 4 đường đất · 5 đồng cỏ khô (bờ đông) · 6 ruộng lúa
  const grid=Array.from({length:H},()=>Array(W).fill(0)),objects=[];
  const riverX=y=>30+Math.round(Math.sin(y*.28)*1.3);
  const ROAD={y0:15,y1:16,x0:5,x1:42},BRIDGE={x0:28,x1:35};
  const buildings=[
    {x:7,y:5,w:6,h:4,style:'hall'},
    {x:14,y:5,w:3,h:4,style:'shrine'},
    {x:19,y:6,w:5,h:4,style:'forge'},
    {x:7,y:19,w:5,h:4,style:'inn'},
    {x:13,y:20,w:5,h:3,style:'stable'},
    {x:20,y:20,w:4,h:4,style:'barn'}
  ];
  const monsterSpawns=[{type:'chua-son-lam',x:51,y:5},{type:'ngu-tinh',x:44,y:28},{type:'deer',x:43,y:8},{type:'deer',x:47,y:24},{type:'lion',x:50,y:12},{type:'elephant',x:52,y:21},{type:'croc',x:35,y:7},{type:'croc',x:35,y:25}];
  // Giếng cổ ở vùng săn (mỗi bản đồ 2–3 giếng): chạm/nói chuyện để hồi đầy máu, dùng xong cạn nước một lúc
  const WELLS=[{id:'gieng-1',x:39,y:9},{id:'gieng-2',x:48,y:18},{id:'gieng-3',x:54,y:26}];
  const spurs=[[9,10,9,14],[15,15,9,14],[21,22,10,14],[9,10,17,18],[15,16,17,19],[21,22,17,19]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const r=riverX(y);
    if(x>=r&&x<r+3)grid[y][x]=2;else if(x>=r+3)grid[y][x]=5;
    if(y>=ROAD.y0&&y<=ROAD.y1&&x>=ROAD.x0&&x<=ROAD.x1)grid[y][x]=grid[y][x]===2?3:4;
    if(y>=27&&y<=H-2&&x>=2&&x<=27&&grid[y][x]===0)grid[y][x]=6; // ruộng lúa phía nam làng
    if(x===0||y===0||x===W-1||y===H-1)grid[y][x]=1;
  }
  for(let y=9;y<=12;y++)for(let x=2;x<=4;x++)grid[y][x]=2; // ao sen
  spurs.forEach(([x0,x1,y0,y1])=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)grid[y][x]=4;});
  const reserved=(x,y)=>monsterSpawns.some(s=>Math.abs(s.x-x)<=1&&Math.abs(s.y-y)<=1)||WELLS.some(w=>Math.abs(w.x-x)<=1&&Math.abs(w.y-y)<=1)||(y>=13&&y<=18&&x<=44);
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
    const v=grid[y][x];if(reserved(x,y))continue;
    const town=x>=5&&x<=26&&y>=3&&y<=26;
    let tree=false;
    if(v===0&&!town&&(x*71+y*43)%13<5)tree=true; // lũy tre, cau, chuối bao quanh làng
    if(v===5&&(x>=56?(x*71+y*43)%13<9:(x*37+y*29)%31===0&&x>riverX(y)+5))tree=true;
    if(tree){grid[y][x]=1;objects.push({kind:'tree',x:(x+.5)*T,y:(y+.6)*T,seed:x*31+y*17,dry:v===5});}
  }
  buildings.forEach(b=>{for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)grid[y][x]=1;objects.push({kind:'house',...b,foot:(b.y+b.h)*T});});
  grid[11][25]=1;objects.push({kind:'banyan',x:25.5*T,y:11.8*T}); // cây đa đầu làng
  grid[18][12]=1;objects.push({kind:'well',x:12.5*T,y:18.7*T});   // giếng làng
  // Đống lửa trong làng
  const fires=[{x:14,y:13},{x:25,y:21}].map(f=>{grid[f.y][f.x]=1;const o={kind:'fire',x:(f.x+.5)*T,y:(f.y+.6)*T};objects.push(o);return o;});
  const wells=WELLS.map(w=>{grid[w.y][w.x]=1;const o={kind:'well',ancient:true,id:w.id,x:(w.x+.5)*T,y:(w.y+.7)*T};objects.push(o);return o;});
  const npcs=[
    {id:'elder',role:'elder',panel:'quests',name:'Lý trưởng',x:9*T,y:11.4*T,x0:8.4*T,x1:13.2*T,lines:['Chào lữ khách. Thanh Mộc là nơi bắt đầu hành trình của bạn.','Trong làng là vùng an toàn: không cưỡi thú, không dùng kỹ năng.','Làng có việc gì ta sẽ giao, xong việc có thưởng tiền và đồ.']},
    {id:'smith',role:'smith',shop:'smith',panel:'shop',name:'Thợ rèn',x:20.4*T,y:11.7*T,lines:['Dao, kiếm, khiên, nỏ… lò rèn này có đủ.','Có hồng ngọc thì ta gia cường đồ cho, càng lên cao càng dễ vỡ.']},
    {id:'guide',role:'guide',panel:'mercs',name:'Người dẫn đường',x:27.3*T,y:14.4*T,lines:['Qua sông chỉ có cây cầu này.','Sư tử, cá sấu dữ. Voi chỉ nổi giận khi bị đánh.','Đi một mình nguy hiểm, ta có lính đánh thuê cho thuê.']},
    {id:'trainer',role:'trainer',shop:'trainer',panel:'shop',name:'Người nuôi thú cưỡi',x:18.8*T,y:21.7*T,lines:['Ngựa, hổ, voi… con nào ở đây cũng đã thuần.','Mỗi loài có một ngón nghề riêng: ngựa đá hậu, hổ vồ mồi, voi dày xéo.']},
    {id:'wizard',role:'wizard',shop:'wizard',panel:'shop',name:'Đạo sĩ',x:17.4*T,y:10.3*T,lines:['Ngũ hành: Hỏa, Thủy, Thổ, Kim, Mộc. Bí truyền: Lôi, Phong, Băng, Ánh sáng, Ma công.','Gắn nhiều sách cùng lúc, chỉ số cộng dồn. Ta luyện sách cho mạnh thêm.']},
    {id:'merchant',role:'merchant',panel:'market',name:'Thương nhân',x:9.6*T,y:24.4*T,lines:['Ta buôn bán khắp các làng.','Đồ Hoàn hảo và đồ Thần, ta bán hộ cho người chơi khác.','Bán được ta giữ một ít tiền công.']}
  ];
  npcs.forEach(n=>Object.assign(n,{hx:n.x,hy:n.y,facing:n.role==='guide'||n.role==='smith'?1:-1,moving:false,walk:0,dir:1,pause:0,turnAt:0,phase:Math.random()}));
  const spawn={x:16*T,y:16*T};
  // Vùng an toàn: từ cột 0 đến cột vung_an_toan_x (Sheet cấu hình)
  const isSafe=x=>x<((typeof Player!=='undefined'&&Number(Player.CFG.vung_an_toan_x))||27)*T+T;
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
  return {isSafe,T,W,H,grid,objects,buildings,npcs,wells,fires,spawn,monsterSpawns,riverX,ROAD,BRIDGE,blocked,canStand,move,findPath,nearestOpen};
})();
