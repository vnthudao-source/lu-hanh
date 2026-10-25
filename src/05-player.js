/* ================= LUẬT CHƠI: chỉ số, trang bị, phẩm chất, bộ đồ, gia cường, nhiệm vụ, lính đánh thuê ================= */
const Player=(()=>{
  const VERSION=7,BAG_SIZE=40,SKILL_SLOTS=5,MAX_LV=15,MAX_ACTIVE_QUEST=3,MAX_MERC=4;
  const slots=['mount','hat','wings','left','armor','right','gloves','pants','shoes'];
  const STAT_KEYS=['strength','agility','vitality','intelligence'];
  const ELEMENTS={
    fire:{name:'Hỏa',icon:'flame',color:'#ff8a3d',glow:'#ffd27a',st:['str']},water:{name:'Thủy',icon:'water',color:'#5fb6ff',glow:'#dcf1ff',st:['int','str']},
    earth:{name:'Thổ',icon:'earth',color:'#c99a5b',glow:'#f3dcaa',st:['vit']},metal:{name:'Kim',icon:'metal',color:'#e3cf7a',glow:'#fffbe2',st:['agi']},wood:{name:'Mộc',icon:'wood',color:'#8ed46a',glow:'#e5ffb8',st:['vit','int']},
    thunder:{name:'Lôi',icon:'thunder',color:'#c9a7ff',glow:'#f4ecff',st:['str']},wind:{name:'Phong',icon:'wind',color:'#8fe3c4',glow:'#e6fff5',st:['agi','str']},
    ice:{name:'Băng',icon:'ice',color:'#8fd3ff',glow:'#effaff',st:['int']},demon:{name:'Ma công',icon:'demon',color:'#c0508a',glow:'#ffb8dc',st:['cmd']},light:{name:'Ánh sáng',icon:'light',color:'#ffe680',glow:'#fffbe0',st:['vit']}
  };
  // v10.21: công, thủ gốc của thú cưỡi theo loài (dùng khi Sheet để trống cả hai)
  const MOUNT_BASE={horse:[2,2],tiger:[4,1],elephant:[1,5],kylan:[3,2],rong:[4,4],phuong:[4,2],cuuvi:[4,2],rua:[1,5],thienma:[3,3]};
  const BEASTS={horse:{seat:24,skill:'Đá hậu',icon:'mount',cmd:5},tiger:{seat:28,skill:'Vồ mồi',icon:'tiger',cmd:10},elephant:{seat:46,skill:'Dày xéo',icon:'elephant',cmd:15},
    kylan:{seat:26,skill:'Lân hỏa',icon:'spark',cmd:12},rong:{seat:33,skill:'Long tức',icon:'demon',cmd:20},
    // v10.18: phượng hoàng (lửa quanh mình như kỳ lân), cửu vĩ hồ (lao tới như hổ), huyền vũ (dày xéo như voi), thiên mã (đá hậu như ngựa)
    phuong:{seat:32,skill:'Phượng hỏa',icon:'feather',cmd:14,act:'kylan'},cuuvi:{seat:30,skill:'Hồ hỏa',icon:'demon',cmd:12,act:'tiger'},rua:{seat:44,skill:'Huyền giáp',icon:'shield',cmd:16,act:'elephant'},thienma:{seat:24,skill:'Đá hậu',icon:'wings',cmd:8,act:'horse'}};
  // thú cưỡi đã có trên Sheet với loài cũ: đổi sang loài đúng hình (Sheet ghi loài mới thì giữ theo Sheet)
  const BEAST_FIX={'phuong-hoang':['kylan','phuong'],'cuu-vi-ho':['tiger','cuuvi'],'huyen-vu':['elephant','rua'],'thien-ma':['horse','thienma']}; // v10.3: kỳ lân (lửa quanh mình), rồng (phun lửa phía trước)
  const GROUPS=[['str','Sức mạnh','punch'],['agi','Nhanh nhẹn','feather'],['vit','Sức khỏe','heart'],['int','Trí tuệ','spark'],['cmd','Mệnh lệnh','flag']];
  const FX_NAMES={stun:'Choáng',execute:'Kết liễu',shield:'Lá chắn',wave:'Sóng chém',aura:'Hào khí',cleave:'Chém lan',manaShield:'Khiên mana',lifesteal:'Hút máu',haste:'Thần tốc',burn:'Thiêu đốt',counter:'Phản công',heal:'Hồi phục',revive:'Hồi sinh',
    frost:'Băng giá',venom:'Độc',rage:'Cuồng nộ',luck:'May mắn',expUp:'Tinh thông',coinUp:'Phú quý',dmgPct:'Uy lực',defPct:'Kiên cố',clone:'Phân thân'}; // v10.13: hiệu ứng thú thần thoại // v10.3: hiệu ứng đồ thành trì
  const SLOT_OF={vu_khi:'right',tay_trai:'left',mu:'hat',ao:'armor',quan:'pants',gang:'gloves',giay:'shoes',canh:'wings',thu_cuoi:'mount'};
  const PAIRS=new Set(['sword|sword','shield|shield','staff|staff','shield|staff','shield|sword','saber|saber','mace|mace','saber|shield','mace|shield']); // v10.14: đao, chùy cầm một tay (đôi hoặc kèm khiên)
  const ALIAS={'book-ice':'book-water','book-wind':'book-metal','book-thunder':'book-earth'};
  const skills={normal:{cost:0,cooldown:450},basic:{cost:10,cooldown:3000},intermediate:{cost:18,cooldown:6000},advanced:{cost:28,cooldown:10000},mount:{cost:12,cooldown:6000}};
  // Bảng sinh từ dữ liệu (Sheet)
  let STORY_L=null; // v10.39: bộ đệm thứ tự chuỗi Tìm con
  const CFG={},RAR={},ADD={},items={},SHOPS={},SETS={},MON={},QUESTS={},MERCS={},ENH=[],WEAPONS={},REGIONS=[],AVATARS={},TOPUPS=[],QUIZ={},TUONG={};
  // Hiệu ứng tên nhân vật (Thuốc đa nhiệm)
  const NAME_FX={vang:'Ánh vàng','cau-vong':'Cầu vồng',lua:'Lửa',bang:'Băng',tim:'Tím mộng'};
  const driveDirect=u=>{u=String(u||'').trim();const m=/(?:drive|docs)\.google\.com/.test(u)&&(u.match(/\/d\/([\w-]{20,})/)||u.match(/[?&]id=([\w-]{20,})/));return m?'https://lh3.googleusercontent.com/d/'+m[1]:(/^https?:\/\/\S+$/.test(u)?u:'');};
  // Kỹ năng trùm (cột ky_nang ở tab quai, cách nhau dấu phẩy): tên hiện, màu, thời gian hiệu ứng (giây)
  const SKILLS={slow:{name:'Trì trệ',desc:'giảm tốc đánh 40%',color:'#c8b060',dur:6},freeze:{name:'Đóng băng',desc:'đứng yên',color:'#80d8ff',dur:1.6},stun:{name:'Sét giật',desc:'choáng',color:'#ffe060',dur:1.4},
    weak:{name:'Suy nhược',desc:'giảm sát thương 40%',color:'#c060ff',dur:6},armor:{name:'Phá giáp',desc:'giảm phòng ngự 50%',color:'#ff9040',dur:6},poison:{name:'Trúng độc',desc:'mất máu dần',color:'#80e060',dur:5},
    bomb:{name:'Nổ',desc:'nổ tại chỗ đứng, sát thương lớn',color:'#ff5030',dur:0},tubao:{name:'Tự bạo',desc:'khi yếu, trùm nổ tung',color:'#ff2020',dur:0},
    // v10.22: chiến thuật trùm (bị động, không phải đòn đánh) — cần cách đánh riêng mới hạ được
    tron:{name:'Bỏ chạy',desc:'còn dưới 20% máu thì bỏ chạy về hang một lần, thoát được là hồi một nửa máu; lần sau đánh tới cùng',hint:'Dùng sách Hỏa đốt cháy để giữ chân, hoặc cung, nỏ, gậy phép bắn theo khi trùm bỏ chạy',color:'#ff80c0',dur:0,passive:1},
    bay:{name:'Bay lượn',desc:'thỉnh thoảng bay lên cao, đòn cận chiến chỉ còn 15% sát thương',hint:'Đổi sang cung, nỏ hoặc gậy phép khi trùm bay lên',color:'#c0d8ff',dur:0,passive:1},
    'giap-bang':{name:'Giáp băng',desc:'giáp băng giảm 70% sát thương nhận vào',hint:'Gắn sách Hỏa: đòn lửa làm tan giáp băng trong 5 giây',color:'#a0e0ff',dur:0,passive:1},
    'hoi-mau':{name:'Tái sinh',desc:'ngừng trúng đòn quá 2,5 giây thì mỗi giây hồi 1% máu',hint:'Đốt cháy (sách Hỏa) hoặc làm trúng độc thì trùm ngừng hồi máu',color:'#90e070',dur:0,passive:1},
    'phan-giap':{name:'Da đá',desc:'đòn cận chiến chỉ còn 60% sát thương và dội lại 15% vào người đánh',hint:'Đánh từ xa bằng cung, nỏ, gậy phép để không bị dội đòn',color:'#c8b8a0',dur:0,passive:1}};
  // Loại vũ khí (tab vu_khi): sát thương, tầm đánh, độ lan, thời gian một đòn, mana kỹ năng, thời gian hồi chiêu, nội tại mỗi đòn
  const W_DEF={punch:{name:'Tay không',dmg:.55,range:50,spread:75,dur:.32,mana:1,cd:1,passive:12}};
  const weapon=t=>WEAPONS[t]||W_DEF[t]||W_DEF.punch;
  const num=(v,f=0)=>{if(v===''||v==null)return f;const n=Number(typeof v==='string'?v.replace(/^'/,'').replace(',','.'):v);return Number.isFinite(n)?n:f;};
  const range=s=>{const [a,b]=String(s||'0-0').split('-').map(Number);return [num(a),num(b,num(a))];};
  const parseBonus=(s,k=1)=>{const o={};String(s||'').split(/[,;]/).forEach(p=>{const [kk,v]=p.split(':').map(x=>x&&x.trim());if(kk&&ADD[kk]&&Number.isFinite(+v))o[kk]=Math.round(+v*k*10)/10;});return o;};
  const clear=o=>{for(const k of Object.keys(o))delete o[k];};
  function load(data){
    [CFG,RAR,ADD,items,SHOPS,SETS,MON,QUESTS,MERCS,WEAPONS,QUIZ,TUONG].forEach(clear);
    for(const r of data.vu_khi||[])WEAPONS[r.loai]={name:r.ten,dmg:num(r.sat_thuong,100)/100,range:num(r.tam_danh,80),spread:num(r.lan_rong),dur:Math.max(.15,num(r.toc_danh_ms,500)/1000),mana:num(r.mana,100)/100,cd:num(r.hoi_chieu,100)/100,passive:num(r.noi_tai,12)};ENH.length=0;
    for(const r of data.cau_hinh||[])CFG[r.khoa]=num(r.gia_tri,r.gia_tri);
    for(const r of data.gia_cuong||[])ENH[num(r.cap)]={rate:num(r.ti_le)/100,cost:num(r.phi_hong_ngoc),fail:r.that_bai_tu===''||r.that_bai_tu==null?null:[num(r.that_bai_tu),num(r.that_bai_den,num(r.that_bai_tu))]};
    for(const r of data.pham_chat||[])RAR[r.ma]={name:r.ten,color:r.mau,mul:num(r.he_so,100)/100,lines:num(r.so_dong),tier:num(r.bac),trade:r.giao_dich==='co',buy:r.mua_duoc==='co'};
    for(const r of data.thuoc_tinh||[])ADD[r.ma]={name:r.ten,group:r.nhom,unit:r.don_vi||'',ranges:[null,...['dep','hoan_hao','huyen_thoai','than'].map(k=>[num(r[k+'_thap']),num(r[k+'_cao'],num(r[k+'_thap']))])]};
    for(const r of data.vat_pham||[]){
      const slot=r.o||null,d={name:r.ten,slot,kind:r.loai||slot,grip:r.cam||'one',atk:num(r.cong),def:num(r.thu),speed:num(r.toc)/100,price:num(r.gia),tint:r.mau||null};
      if(slot==='mount'){d.beast=BEASTS[r.thu_cuoi]?r.thu_cuoi:'horse';const fx=BEAST_FIX[r.id];if(fx&&d.beast===fx[0])d.beast=fx[1];d.cmd=num(r.menh_lenh,BEASTS[d.beast].cmd);if(d.beast!=='horse')d.icon=BEASTS[d.beast].act?BEASTS[d.beast].icon:d.beast;}
      if(slot==='book'){d.icon='book';d.element=r.he;}
      if(!slot)d.icon=r.loai||'ore';
      if(slot==='wings'&&/^canh-/.test(r.id))d.wing=true; // cánh dung hợp (không mua, không rơi)
      if(r.pham_chat&&RAR[r.pham_chat]&&r.pham_chat!=='n')d.q=r.pham_chat; // phẩm chất cố định (hàng hiệu buôn thành trì)
      if(r.hieu_ung){d.fx=r.hieu_ung;d.fxv=num(r.gia_tri);d.fxText=r.mo_ta||'';}
      if(num(r.gia_hong_ngoc)>0)d.ruby=num(r.gia_hong_ngoc); // mua bằng hồng ngọc (mỹ phẩm Phấn Son)
      if(r.anh)d.img=driveDirect(r.anh); // ảnh riêng (thẻ avatar, khung, nền, vật phẩm cốt truyện)
      if(slot==='cos'||slot==='quest'){d.desc=r.mo_ta||'';d.kind=r.loai||'avatar';d.icon=slot==='quest'?'quest':r.loai==='avatar'?'user':r.loai==='nen'?'map':r.loai==='kn'?'spark':'orb';if(slot==='cos')d.val=num(r.gia_tri);}
      if(slot==='cos'&&r.loai==='khung')continue; // v10.12: bỏ khung chân dung
      items[r.id]=d;
    }
    for(const r of data.cua_hang||[]){(SHOPS[r.cua_hang]=SHOPS[r.cua_hang]||[]).push({id:r.id,q:String(r.pham_chat||'n').split(',').map(x=>x.trim()).filter(q=>RAR[q]||q==='n'),price:num(r.gia),order:num(r.thu_tu),t:num(r.bac)});}
    for(const k of Object.keys(SHOPS)){SHOPS[k]=SHOPS[k].filter(r=>items[r.id]);SHOPS[k].sort((a,b)=>a.order-b.order);}
    // Bộ đồ nhân vật lịch sử: bo_huyen_thoai (Việt, phẩm l) và v10.14 tuong (danh tướng Trung Hoa: bản huyền thoại 'tq-<id>' phẩm l, bản thần 'tt-<id>' phẩm m mạnh gấp rưỡi).
    // Vũ khí để trống tay trái = cầm hai tay (bộ 8 món, đủ 8 là kích hoạt hiệu ứng). Bộ của tướng ai cũng mặc được (gender trống)
    const addSet=(r,sid,q,k,gender,tintW)=>{
      const two=!r.tay_trai_loai,S={id:sid,hero:r.nhan_vat,gender,name:r.ten_bo+(q==='m'?' (Thần)':''),tiers:{3:parseBonus(r.moc_3,k),5:parseBonus(r.moc_5,k),7:parseBonus(r.moc_7,k)},fx:r.hieu_ung_9,fxv:Math.round(num(r.gia_tri_9)*k),fxText:r.mo_ta_9,pieces:[],q};
      SETS[sid]=S;
      for(const [col,slot] of Object.entries(SLOT_OF)){
        if(slot==='left'&&two)continue;
        const id=sid+':'+slot,base={name:r[col]+(q==='m'?' · Thần':''),set:sid,gender,q,price:Math.round(num(CFG.gia_do_bo,5000)*k),tint:tintW||'#e8c070'};
        if(slot==='right'||slot==='left'){const kd=slot==='right'?r.vu_khi_loai:r.tay_trai_loai;Object.assign(base,{slot:'hand',kind:kd,grip:slot==='right'&&two?'two':'one',atk:kd==='shield'?0:num(CFG.bo_cong_vu_khi,16)*(slot==='left'?.6:two?1.4:1)*k,def:kd==='shield'?num(CFG.bo_thu_khien,10)*k:0});}
        else if(slot==='mount'){const b=r.thu_cuoi_loai||'horse';Object.assign(base,{slot,kind:'mount',beast:b,cmd:BEASTS[b].cmd,speed:num(CFG.bo_toc_thu_cuoi,155)/100,tint:b==='elephant'?'#a8aeb4':b==='tiger'?'#e89a3e':'#d8c8a8'});if(b!=='horse')base.icon=b;}
        else Object.assign(base,{slot,kind:slot,def:(slot==='armor'?num(CFG.bo_thu_ao,12):num(CFG.bo_thu_nho,6))*k});
        base.atk=Math.round(base.atk||0);base.def=Math.round(base.def||0);if(q==='m')base.myth=true;items[id]=base;S.pieces.push(id);
      }
      return S;};
    for(const r of data.bo_huyen_thoai||[])addSet(r,r.id,'l',1,r.gioi_tinh,'#e8c070');
    for(const r of data.tuong||[]){TUONG[r.id]={id:r.id,name:r.nhan_vat,gender:r.gioi_tinh==='f'?'f':'m',desc:r.mo_ta||'',color:r.mau||'#c8823e',setL:'tq-'+r.id,setM:'tt-'+r.id};addSet(r,'tq-'+r.id,'l',1,'',r.mau||'#e8c070');addSet(r,'tt-'+r.id,'m',1.5,'',r.mau||'#ffb0d0');}
    for(const r of data.do_than||[]){
      const d={name:r.ten,slot:r.o,kind:r.loai,grip:r.cam||'one',atk:num(r.cong),def:num(r.thu),speed:num(r.toc)/100,price:num(r.gia,20000),tint:r.mau||null,q:'m',fx:r.hieu_ung,fxv:num(r.gia_tri),fxText:r.mo_ta,myth:true};
      if(d.slot==='mount'){d.beast=BEASTS[r.thu_cuoi]?r.thu_cuoi:'horse';d.cmd=BEASTS[d.beast].cmd;}
      items[r.id]=d;
    }
    const QM=num(CFG.quai_nhan_mau,1),QD=num(CFG.quai_nhan_sat_thuong,1),BN=num(CFG.boss_nhan,1),BD=num(CFG.boss_nhan_sat_thuong,1),qx=(v,k)=>v>0?Math.max(1,Math.round(v*k)):v; // v10.16: hệ số máu / sát thương mọi quái (cau_hinh)
    for(const r of data.quai||[])MON[r.id]={def:num(r.thu),name:r.ten,hp:qx(num(r.mau),QM*(num(r.boss)?BN:1)),dmg:qx(num(r.sat_thuong),QD*(num(r.boss)?BN*(num(r.boss)===1?BD:1):1)),hpBase:num(r.mau),dmgBase:num(r.sat_thuong),speed:num(r.toc_do),run:num(r.toc_chay),r:num(r.ban_kinh),h:num(r.cao),aggro:num(r.tam_danh),range:num(r.tam_gan),cd:num(r.hoi_chieu_ms)/1000,windup:num(r.vung_tay_ms)/1000,copper:num(r.dong),knock:num(r.day_lui_phan_tram)/100,boss:num(r.boss),respawn:num(r.hoi_sinh_giay,15),drops:{g:num(r.dep_phan_van)/1e4,p:num(r.hoan_hao_phan_van)/1e4,l:num(r.huyen_thoai_phan_van)/1e4,m:num(r.than_phan_van)/1e4},rubies:[num(r.hong_ngoc_it),num(r.hong_ngoc_nhieu)],dtype:r.loai_sat_thuong||'thuong',crit:num(r.ti_le_x2),exp:num(r.kinh_nghiem,Math.max(1,Math.round(num(r.mau)/8))),map:String(r.ban_do||'').trim()||undefined,skills:String(r.ky_nang||'').split(/[,\s]+/).filter(k=>SKILLS[k]),tac:String(r.ky_nang||'').split(/[,\s]+/).filter(k=>SKILLS[k]&&SKILLS[k].passive)};
    STORY_L=null;
    for(const r of data.nhiem_vu||[])QUESTS[r.id]={id:r.id,name:r.ten,desc:r.mo_ta,target:r.muc_tieu,count:num(r.so_luong,1),copper:num(r.thuong_dong),rubies:num(r.thuong_hong_ngoc),item:r.thuong_do||'',itemQ:r.pham_chat_do||'n',repeat:r.lap_lai!=='khong',lv:num(r.cap_toi_thieu),exp:num(r.thuong_kinh_nghiem,Math.round(num(r.thuong_dong)/10)),req:r.yeu_cau||'',end:r.loi_ket||'',story:!!num(r.truyen),npc:r.npc||'',at:r.noi||'',npcName:r.npc_ten||''};
    // Thầy đồ: bộ câu hỏi (bo_cau_hoi) + câu hỏi (cau_hoi; máy chủ đọc tab CauHoi của bảng OCD_Quest, cột dap_an không gửi xuống trình duyệt)
    // v10.13: bỏ các bộ mã NV* và SKQ* (chỉ giữ bộ DX_*)
    const boOk=id=>!/^(NV|SKQ)/i.test(String(id||''));
    for(const r of (data.bo_cau_hoi||[]).filter(r=>boOk(r.id)))QUIZ[r.id]={id:r.id,name:r.ten||r.id,order:num(r.thu_tu,99),rubies:num(r.thuong_hong_ngoc,5),mon:r.quai||'',need:num(r.so_luong,0),map:r.ban_do||'',qs:[]};
    for(const r of data.cau_hoi||[]){const bo=String(r.bo||r.QuestID||'');if(!bo||!boOk(bo))continue;if(!QUIZ[bo])QUIZ[bo]={id:bo,name:String(r.chu_de||'')||bo,order:100+Object.keys(QUIZ).length,rubies:r.chu_de?num(CFG.quiz_hong_ngoc_chu_de,10):5,mon:'',need:0,map:'',qs:[]};QUIZ[bo].qs.push({id:r.id||r.QuestionID,n:num(r.thu_tu||r.ThuTu,QUIZ[bo].qs.length+1),q:r.cau||r.CauHoi||'',a:r.a||r.A||'',b:r.b||r.B||'',c:r.c||r.C||'',d:r.d||r.D||'',ans:String(r.dap_an||r.DapAn||'').trim().toUpperCase()});}
    for(const Q of Object.values(QUIZ))Q.qs.sort((x,y)=>x.n-y.n);
    REGIONS.length=0;for(const r of data.ban_do||[])REGIONS.push({id:String(r.id),name:r.ten,lv:num(r.cap,1),icon:r.bieu_tuong||'pin',order:num(r.thu_tu,99),gate:String(r.khoa_mo||'')});REGIONS.sort((a,b)=>a.order-b.order);
    TOPUPS.length=0;for(const r of data.goi_nap||[])TOPUPS.push({id:r.id,name:r.ten,vnd:num(r.tien),ruby:num(r.hong_ngoc),gold:num(r.vang),desc:r.mo_ta||'',order:num(r.thu_tu,99)});TOPUPS.sort((a,b)=>a.order-b.order);
    clear(AVATARS);for(const r of data.dien_mao||[])AVATARS[r.id]={id:r.id,name:r.ten,gender:r.gioi_tinh||'',price:num(r.gia),ruby:num(r.hong_ngoc),skin:r.mau_da||'#e1c295',hair:r.mau_toc||'#2a2622',style:r.kieu_toc||'',beard:r.rau||'',eye:r.mau_mat||'#2a2018',mark:r.dau||'',order:num(r.thu_tu,99)};
    for(const r of data.linh||[]){const k=r.thanh?num(CFG.linh_thanh_he_so,100)/100:1;MERCS[r.id]={id:r.id,name:r.ten,gender:r.gioi_tinh==='f'?'f':'m',price:num(r.gia),cmd:num(r.menh_lenh,5),stats:{strength:Math.round(num(r.suc_manh)*k),agility:Math.round(num(r.nhanh_nhen)*k),vitality:Math.round(num(r.suc_khoe)*k),intelligence:Math.round(num(r.tri_tue)*k),command:0},gear:String(r.trang_bi||'').split(',').map(x=>x.trim()).filter(Boolean),desc:r.mo_ta,map:r.thanh||''};}
    // v10.16–17: thú cưỡi — giá × thu_cuoi_nhan_gia, công / thủ × thu_cuoi_nhan_chi_so
    // v10.21: mỗi thú có "cấp" L: thú bán ở thành = cấp thành; thú làng Thanh Mộc tính theo giá gốc (2·√(giá/50): ngựa con 4 … voi 22);
    //   thú trong bộ Huyền thoại / Thần = thu_cuoi_cap_bo_huyen_thoai / _than. Mệnh lệnh cần = mức của loài + L × thu_cuoi_menh_lenh_cap (+ phẩm chất, + cấp gia cường: mountNeed).
    //   Thú chưa ghi công / thủ trên Sheet (cả hai = 0) lấy chỉ số gốc theo loài (MOUNT_BASE); thú không bán ở thành nhân thêm (1 + L/25) như đồ có bậc.
    {const MK=num(CFG.thu_cuoi_nhan_gia,1),MS=num(CFG.thu_cuoi_nhan_chi_so,1),MC=num(CFG.thu_cuoi_menh_lenh_cap,0),lvOf={};
      for(const k in SHOPS){const m=k.match(/^thanh-(.+?)(?:-ren|-thu|-sach)?$/);if(!m)continue;const L=mapLevel(m[1]);for(const r of SHOPS[k])lvOf[r.id]=Math.max(lvOf[r.id]||0,L);}
      for(const [id,d] of Object.entries(items)){if(d.slot!=='mount')continue;
        const town=lvOf[id]||0,L=id==='ho-trang-vit'?num(CFG.vit_thu_cap,90):town||(d.q==='m'?num(CFG.thu_cuoi_cap_bo_than,330):d.q==='l'||d.set?num(CFG.thu_cuoi_cap_bo_huyen_thoai,250):Math.round(2*Math.sqrt(num(d.price)/50)));d.mlv=L;
        if(!d.atk&&!d.def){const B=MOUNT_BASE[d.beast]||MOUNT_BASE.horse,f=town?1:1+L/25;d.atk=Math.round(B[0]*f);d.def=Math.round(B[1]*f);}
        if(d.price)d.price=Math.round(d.price*MK);if(MS!==1){d.atk=Math.round(d.atk*MS);d.def=Math.round(d.def*MS);}
        d.cmd=(BEASTS[d.beast]||BEASTS.horse).cmd+Math.round(L*MC);}
      if(MK!==1)for(const k in SHOPS)for(const r of SHOPS[k])if(r.price&&items[r.id].slot==='mount')r.price=Math.round(r.price*MK);
      // v10.26: sau đó thú cưỡi ở các thành × thu_cuoi_gia_thanh (Thanh Mộc giữ nguyên)
      // v10.24: giá thú cưỡi làng Thanh Mộc × thu_cuoi_gia_lang; mỗi nơi bán kế tiếp (theo cấp thành) giá trung bình gấp thu_cuoi_gia_moi_thanh lần nơi trước, giữ tỉ lệ giữa các con trong cùng nơi
      {const GV=num(CFG.thu_cuoi_gia_lang,5),GT=num(CFG.thu_cuoi_gia_moi_thanh,2),pr=r=>r.price||num(items[r.id].price),avg=a=>a.reduce((x,r)=>x+pr(r),0)/Math.max(1,a.length);
        const list=Object.keys(SHOPS).map(k=>{const mm=k.match(/^thanh-(.+?)(?:-ren|-thu|-sach)?$/);return {k,L:mm?mapLevel(mm[1]):1,rows:SHOPS[k].filter(r=>items[r.id]&&items[r.id].slot==='mount'&&!items[r.id].ruby)};}).filter(x=>x.rows.length).sort((a,b)=>a.L-b.L);
        let prev=0;for(const s of list){const sc=s.L<=1?GV:prev>0?prev*GT/Math.max(1,avg(s.rows)):1;for(const r of s.rows){const v=Math.max(1,Math.round(pr(r)*sc));r.price=v;items[r.id].price=v;}prev=avg(s.rows);}
        const GC=num(CFG.thu_cuoi_gia_thanh,10);if(GC!==1)for(const s of list)if(s.L>1)for(const r of s.rows){const v=Math.round(r.price*GC);r.price=v;items[r.id].price=v;}}}
  }
  const info=i=>i&&items[i.type];
  const kind=i=>info(i)?info(i).kind:null;
  const qOf=i=>{const d=info(i);return d?(d.q||i.q||'n'):'n';};
  const rar=i=>RAR[qOf(i)]||RAR.n||{name:'Thường',color:'#e8e6df',mul:1,lines:0,tier:0};
  const isTwo=i=>!!info(i)&&info(i).grip==='two';
  const pairOk=(a,b)=>PAIRS.has([a,b].sort().join('|'));
  const nameOf=i=>info(i)?info(i).name+(i.lv?' +'+i.lv:'')+(i.t?' · cấp '+i.t:''):'';
  const SELL_MUL={n:1,g:2,p:5,l:10,m:20};
  // v10.24: đồ có phẩm chất cố định (hàng hiệu buôn, chuồng thú thành trì) đã tính phẩm chất vào giá → không nhân thêm (trước đây thú Hoàn hảo bán lại được gấp đôi giá mua)
  const sellPrice=i=>Math.max(1,Math.floor((info(i)?info(i).price:0)*num(CFG.ti_le_ban_lai,40)/100*(info(i)&&info(i).q?1:(SELL_MUL[qOf(i)]||1))));
  const canEnhance=i=>{const d=info(i);return !!d&&!!d.slot;};
  // v10.13: chợ chỉ nhận đồ huyền thoại / thần, cánh, thú cưỡi
  const tradeable=i=>{const d=info(i);if(!d)return false;const q=qOf(i);return q==='l'||q==='m'||d.slot==='wings'||d.slot==='mount';};
  const gainOf=d=>d.slot==='mount'?{speed:.03}:d.slot==='book'?{stat:num(CFG.sach_moi_cap,2)}:d.atk?{atk:2}:d.def?{def:1}:{};
  const r2=v=>Math.round(v*100)/100;
  // Thú cưỡi: +1..+6 tăng tốc; +7..+10 thêm sát thương; +11..+15 thêm cả máu, mana, phòng ngự (tốc độ tăng suốt 15 cấp)
  function mountGain(lv){
    const a=Math.max(0,lv-6),b=Math.max(0,lv-10);
    return {speed:num(CFG.thu_cuoi_toc_cap,3)/100*lv,atk:num(CFG.thu_cuoi_cong_cap,2)*a,hp:num(CFG.thu_cuoi_mau_cap,20)*b,mp:num(CFG.thu_cuoi_mana_cap,10)*b,def:num(CFG.thu_cuoi_thu_cap,2)*b};
  }
  // Sách: cộng vào chỉ số lớn theo hệ (Hỏa→Sức mạnh, Kim→Nhanh nhẹn, Thổ→Sức khỏe, Thủy→Trí tuệ, Mộc→Sức khỏe + Trí tuệ)
  // v10.21: sách có bậc (theo cấp thành bán: sach_bac_cap) và phẩm chất; điểm cộng, hiệu ứng, giá đều theo bậc × phẩm chất
  const QORD=['n','g','p','l','m'],qIdx=it=>Math.max(0,QORD.indexOf(qOf(it))),lst=(k,d,i)=>{const a=cfgList(k,d);return num(a[Math.max(0,Math.min(i,a.length-1))]);};
  const bacOfT=t=>{const c=cfgList('sach_bac_cap','0,70,170,235,290');let b=0;c.forEach((x,i)=>{if(num(t)>=x)b=i;});return b;};
  const bookBac=it=>bacOfT(it&&it.t);
  const bookFx=it=>lst('sach_hieu_ung_bac','0.4,0.6,0.8,1,1.2',bookBac(it))*lst('sach_hieu_ung_pham_chat','1,1.15,1.3,1.5,1.8',qIdx(it));
  const bookPerLv=it=>lst('sach_moi_cap_bac','0.5,1,1.5,2,3',bookBac(it));
  const EL_VN={fire:'hoa',water:'thuy',earth:'tho',metal:'kim',wood:'moc',thunder:'loi',wind:'phong',ice:'bang',light:'sang',demon:'ma'},
    BOOK_K={hoa:.85,thuy:1.15,tho:.45,kim:1,moc:1.25,loi:.7,phong:1.1,bang:1.2,sang:.5,ma:1};
  const bookStatK=e=>{const v=EL_VN[e];return Math.max(0,num(CFG['sach_chi_so_'+v],BOOK_K[v]??1));};
  const bookStat=it=>{const d=info(it);if(!d||!d.element)return {};const b=bookBac(it),k=ELEMENTS[d.element].st,
    // v10.31: sách Thổ cộng Sức khỏe ×tho_suc_khoe_nhan · v10.33: mỗi hệ có hệ số điểm riêng (cau_hinh sach_chi_so_<hệ>, cân bằng PvP)
    base=d.element==='demon'?lst('sach_menh_lenh_bac','5,10,15,20,20',b):lst('sach_chi_so_bac','3,8,15,25,40',b),
    v=Math.round((base*lst('sach_pham_chat_he_so','1,1.3,1.7,2.3,3',qIdx(it))+bookPerLv(it)*(it.lv||0))*bookStatK(d.element));return Object.fromEntries(k.map(x=>[x,k.length>1?Math.ceil(v/2):v]));};
  // Sách Ma công: số quái tối đa, hệ số thu phục trùm
  const demonOf=it=>{const b=bookBac(it),q=qIdx(it);return {b,q,lv:it.lv||0,ef:bookFx(it),max:lst('ma_so_quai_bac','1,2,2,3,3',b)+lst('ma_so_quai_pham_chat','0,0,0,1,1',q),boss:lst('ma_boss_bac','0,0,0.05,0.1,0.2',b)};};
  // Thú cưỡi: Mệnh lệnh cần = mức theo loài + cấp thú (d.cmd) + phẩm chất + cấp gia cường
  const mountNeed=it=>{const d=info(it);if(!d||d.slot!=='mount')return 0;return Math.round(num(d.cmd,5)+lst('thu_cuoi_menh_lenh_pham_chat','0,5,15,30,60',qIdx(it))+num(CFG.thu_cuoi_menh_lenh_moi_cap,1)*(it.lv||0));};
  // Thời gian giữ quái thu phục theo Trí tuệ (phút, 0 = vĩnh viễn); trùm giảm một mốc
  const tameMin=(int,boss)=>{const T=cfgList('thu_phuc_tri_tue','0,60,150,300,600'),M=cfgList('thu_phuc_phut','1,10,60,600,0');let i=0;T.forEach((t,j)=>{if(num(int)>=t)i=j;});if(boss)i=Math.max(0,Math.min(i,M.length-1)-1);return num(M[Math.min(i,M.length-1)]);};
  function stat(i){
    const d=info(i);if(!d)return {atk:0,def:0,speed:0,hp:0,mp:0};
    const lv=i.lv||0,g=gainOf(d),m=rar(i).mul*tierBase(i.t);
    if(d.slot==='mount'){const G=mountGain(lv);return {atk:Math.round((d.atk||0)*m)+G.atk,def:Math.round((d.def||0)*m)+G.def,speed:r2(d.speed+G.speed),hp:G.hp,mp:G.mp};}
    return {atk:Math.round((d.atk||0)*m)+(g.atk||0)*lv,def:Math.round((d.def||0)*m)+(g.def||0)*lv,speed:d.speed?r2(d.speed+(g.speed||0)*lv):0,hp:0,mp:0};
  }
  const rnd36=rng=>(Math.floor(rng()*4294967296)>>>0).toString(36);
  const uid=(t,rng=Math.random)=>'it-'+String(t).replace(/[^a-z0-9]/gi,'').slice(0,12)+'-'+rnd36(rng)+rnd36(rng);
  // Chuỗi ngẫu nhiên dùng chung giữa máy người chơi và máy chủ (mulberry32, trạng thái s.rs do máy chủ giữ):
  // máy người chơi tính trước kết quả mua/gia cường/nhiệm vụ để hiện ngay, máy chủ tính lại y hệt rồi lưu
  function seqRng(s){return ()=>{let t=(s.rs=(s.rs+0x6D2B79F5)|0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  // Sinh món đồ với phẩm chất + dòng thuộc tính ngẫu nhiên
  const ARMOR_SLOTS=['hat','armor','pants','gloves','shoes','wings'];
  const ARMOR_LINES={n:[1,1],g:[1,2],p:[2,3],l:[3,4],m:[3,4]};
  const armorPool=()=>String(CFG.dong_do_mac||'def,hp,dodge,reflect,hpReg,mp').split(/[,;\s]+/).filter(k=>ADD[k]);
  // t: bậc đồ = cấp vùng rơi ra (từ 20): chỉ số gốc ×(1+t/25), dòng cộng thêm ×(1+t/20); nameOf hiện "· cấp t"
  // v10.35: từ bậc 300 trở lên chỉ số tăng chậm lại (bậc 999 ≈ ×25 gốc thay vì ×41); dòng % (né, phản đòn, chí mạng…) chỉ tăng tới bậc 100 vì đã có trần
  const tierBase=t=>{t=num(t);return 1+Math.min(t,300)/25+Math.max(0,t-300)/num(CFG.bac_cao_goc,60);},tierAdd=(t,pct)=>{t=num(t);return pct?1+Math.min(t,100)/20:1+Math.min(t,300)/20+Math.max(0,t-300)/num(CFG.bac_cao_dong,50);};
  function roll(type,q='n',rng=Math.random,t=0){
    const d=items[type];if(!d)throw Error('ITEM');
    const it={uid:uid(type,rng),type};if(!d.q&&q!=='n')it.q=q;if(t>=20)it.t=Math.floor(t);
    const R=RAR[d.q||q]||{lines:0,tier:0};
    // Đồ mặc (mũ, áo, quần, găng, giày, cánh): dòng ngẫu nhiên lấy trong nhóm phòng thủ / sinh lực (Sheet cau_hinh dong_do_mac),
    // số dòng theo phẩm chất: Thường 1 · Đẹp 1–2 · Hoàn hảo 2–3 · Huyền thoại, Thần 3–4 (ngoài hiệu ứng bộ). Mỗi chỉ số chỉ một dòng.
    // Vũ khí, thú cưỡi: giữ như cũ (số dòng = so_dong của phẩm chất, lấy trong mọi chỉ số).
    const tier=R.tier||0,wear=ARMOR_SLOTS.includes(d.slot);
    if(d.wing)return it; // cánh dung hợp: dòng do fuse() đặt
    if(d.slot&&d.slot!=='book'&&(R.lines||wear)){
      const pool=wear?armorPool():Object.keys(ADD),keys=pool.filter(k=>ADD[k]&&ADD[k].ranges[Math.max(1,tier)]);it.add={};
      const [lo,hi]=wear?(ARMOR_LINES[d.q||q]||[1,1]):[R.lines,R.lines],cnt=lo+Math.floor(rng()*(hi-lo+1));
      for(let n=0;n<cnt&&keys.length;n++){const k=keys.splice(Math.floor(rng()*keys.length),1)[0];let [a,b]=ADD[k].ranges[Math.max(1,tier)];if(!tier)b=Math.max(a,Math.ceil((a+b)/2)-1);it.add[k]=Math.round((a+Math.floor(rng()*(b-a+1)))*tierAdd(it.t,ADD[k].unit==='%'));}
      if(!Object.keys(it.add).length)delete it.add;
    }
    return it;
  }
  const BASE_DROP=()=>Object.keys(items).filter(k=>{const d=items[k];return !d.q&&d.slot&&d.slot!=='book'&&d.slot!=='mount'&&d.slot!=='cos'&&d.slot!=='quest'&&!d.wing;});
  const dropCap=()=>{const q=String(CFG.pham_chat_roi_toi_da||'').trim();return RAR[q]?RAR[q].tier:99;};
  // v10.17: phần thưởng hạ quái — tiền × quai_nhan_tien, kinh nghiệm × quai_nhan_kinh_nghiem; tiền mỗi con tối đa quai_tien_toi_da đồng (9999 = dưới 1 vàng; 0 = không giới hạn);
  // quai_roi_do = 0 thì quái không rơi hồng ngọc, đồ đạc
  const killCopper=(M,up=0)=>{const c=Math.round(num(M&&M.copper)*num(CFG.quai_nhan_tien,1)*(1+num(up)/100)),cap=num(CFG.quai_tien_toi_da,0);return cap>0?Math.min(cap,c):c;};
  const killExp=(M,up=0)=>{const e=num(M&&M.exp);return e>0?Math.max(1,Math.round(e*num(CFG.quai_nhan_kinh_nghiem,1)*(1+num(up)/100))):0;};
  // v10.22: trùm rơi sách Huyền thoại / Thần (hệ ngẫu nhiên), bậc sách theo cấp vùng của trùm; trùm thế giới tỉ lệ ×3
  const BOOK_IDS=()=>Object.keys(items).filter(k=>items[k].slot==='book'&&items[k].element);
  function bossBook(monId,rng){const M=MON[monId];if(!M||!M.boss)return null;const k=M.boss===2?3:1,pm=num(CFG.sach_roi_than_phan_van,50)/1e4*k,pl=num(CFG.sach_roi_huyen_thoai_phan_van,300)/1e4*k,x=rng();const q=x<pm?'m':x<pm+pl?'l':null;if(!q)return null;const ids=BOOK_IDS();if(!ids.length)return null;return roll(ids[Math.floor(rng()*ids.length)],q,rng,regionLv(regionOf(monId)));}
  function rollDrop(monId,rng=Math.random,luck=1){
    const M=MON[monId];if(!M||CFG.quai_roi_do!==undefined&&CFG.quai_roi_do!==''&&!num(CFG.quai_roi_do))return {items:[],rubies:0};
    const lvl=regionLv(regionOf(monId)),tier=lvl>=20?lvl:0,out=[],tries=M.boss===2?3:M.boss?2:1,cap=Math.max(dropCap(),lvl>=105?4:lvl>=70?3:0),R=q=>RAR[q]?RAR[q].tier<=cap:true;
    // phẩm chất rơi cao nhất của bản đồ (cau_hinh: pham_chat_roi_toi_da); phẩm chất vượt mức thì không rơi
    const dm=(R('m')?M.drops.m:0)*luck,dl=(R('l')?M.drops.l:0)*luck,dp=(R('p')?M.drops.p:0)*luck,dg=(R('g')?M.drops.g:0)*luck; // luck: hiệu ứng May mắn (×)
    for(let k=0;k<tries;k++){
      const x=rng();let acc=0;
      if(x<(acc+=dm)){const pool=Object.keys(items).filter(k=>items[k].myth);if(pool.length)out.push(roll(pool[Math.floor(rng()*pool.length)],'m',rng,tier));}
      else if(x<(acc+=dl)){const pool=Object.keys(items).filter(k=>items[k].set);if(pool.length)out.push(roll(pool[Math.floor(rng()*pool.length)],'l',rng,tier));}
      else if(x<(acc+=dp)){const pool=BASE_DROP();out.push(roll(pool[Math.floor(rng()*pool.length)],'p',rng,tier));}
      else if(x<(acc+=dg)){const pool=BASE_DROP();out.push(roll(pool[Math.floor(rng()*pool.length)],'g',rng,tier));}
    }
    const [a,b]=M.rubies;return {items:out,rubies:b>0?a+Math.floor(rng()*(b-a+1)):0};
  }
  // Gia cường
  const enhRate=lv=>lv>=MAX_LV?0:(ENH[lv]?ENH[lv].rate:0);
  const enhCost=lv=>ENH[lv]?ENH[lv].cost:lv+1;
  function enhFail(lv,rng){const f=ENH[lv]?ENH[lv].fail:null;if(!f)return lv;const [a,b]=f;return a+Math.floor(rng()*(b-a+1));}
  // Mỗi NPC gia cường loại đồ của mình: thợ rèn (vũ khí, giáp), người nuôi thú (thú cưỡi), đạo sĩ (sách)
  const SHOP_ENH={smith:d=>d.slot!=='book'&&d.slot!=='mount',trainer:d=>d.slot==='mount',wizard:d=>d.slot==='book'};
  // hiệu buôn thành trì (mã bắt đầu 'thanh-'): gia cường cả vũ khí, giáp, thú cưỡi
  const shopEnh=id=>SHOP_ENH[id]||(/^thanh-.*-thu$/.test(String(id))?d=>d.slot==='mount':/^thanh-.*-sach$/.test(String(id))?d=>d.slot==='book':/^thanh-/.test(String(id))?d=>d.slot!=='book'&&d.slot!=='cos'&&d.slot!=='quest':null);
  // v10.13: cỏ may mắn (s.luck, nhận từ sự kiện đột xuất): mỗi cỏ +1% tỉ lệ gia cường / dung hợp, tối đa co_may_man_toi_da (10) cỏ một lần
  function useLuck(s,want){const n=Math.max(0,Math.min(num(CFG.co_may_man_toi_da,10),Math.floor(num(want)),Math.floor(num(s.luck))));s.luck=Math.floor(num(s.luck))-n;return n;}
  function enhance(s,ref,rng=Math.random,shop,luck=0){
    const it=ref.where==='bag'?s.bag[ref.key]:ref.where==='skill'?s.skillSlots[ref.key]:s.equipment[ref.key];
    if(!canEnhance(it))throw Error('ITEM');
    if(shop&&shopEnh(shop)&&!shopEnh(shop)(info(it)))throw Error('SHOP');
    const lv=it.lv||0;if(lv>=MAX_LV)throw Error('MAX');
    const cost=enhCost(lv);if(s.rubies<cost)throw Error('RUBY');
    const L=useLuck(s,luck);s.rubies-=cost;const ok=rng()<Math.min(1,enhRate(lv)+L/100);it.lv=ok?lv+1:enhFail(lv,rng);
    return {ok,from:lv,to:it.lv,cost};
  }
  // Dung hợp cánh (NPC Luyện khí sư): thú cưỡi +dung_hop_thu_cap trở lên + một món huyền thoại / thần + hồng ngọc → tỉ lệ dung_hop_ti_le ra một đôi cánh ngẫu nhiên
  // Số dòng 0–5 theo bảng dung_hop_dong (càng nhiều dòng càng hiếm); chỉ số lấy trong canh_dong, giá trị theo bậc: 0–1 dòng Đẹp, 2–3 Hoàn hảo, 4 Huyền thoại, 5 Thần (mỗi dòng ×(1+bậc thú/20)).
  // Thất bại: mất món huyền thoại / thần và hồng ngọc, thú cưỡi về +6. Thành công: mất cả hai món, nhận cánh.
  const WING_IDS=()=>Object.keys(items).filter(k=>items[k].wing);
  function fuse(s,mi,xi,rng=Math.random,luck=0){
    const m=s.bag[mi],x=s.bag[xi],dm=info(m),dx=info(x),need=num(CFG.dung_hop_thu_cap,9),cost=num(CFG.dung_hop_ngoc,60);
    if(!dm||dm.slot!=='mount'||(m.lv||0)<need)throw Error('THU');if(!dx||mi===xi||!(dx.set||dx.myth))throw Error('VAT_LIEU');if(s.rubies<cost)throw Error('RUBY');
    const pool=WING_IDS();if(!pool.length)throw Error('ITEM');
    const L=useLuck(s,luck);s.rubies-=cost;const ok=rng()*100<num(CFG.dung_hop_ti_le,40)+L;
    if(!ok){s.bag[xi]=null;m.lv=Math.min(m.lv||0,6);return {ok:false,cost,mount:m};}
    const type=pool[Math.floor(rng()*pool.length)],w=String(CFG.dung_hop_dong||'0,30,28,22,12,6,2').split(',').map(Number).slice(1),tot=w.reduce((a,b)=>a+b,0);
    let r=rng()*tot,n=0;for(let i=0;i<w.length;i++){r-=w[i];if(r<0){n=i;break;}}
    const q=n>=5?'m':n>=4?'l':n>=2?'p':'g',tier=RAR[q]?RAR[q].tier:1,keys=String(CFG.canh_dong||'dmgMax,dmgMin,def,hp,mp,range,crit3').split(/[,;\s]+/).filter(k=>ADD[k]&&ADD[k].ranges[tier]);
    const it={uid:uid(type,rng),type,q,add:{}};
    for(let i=0;i<n&&keys.length;i++){const k=keys.splice(Math.floor(rng()*keys.length),1)[0],[a,b]=ADD[k].ranges[tier];it.add[k]=Math.round((a+Math.floor(rng()*(b-a+1)))*(1+(m.lv||0)/20));}
    if(!n)delete it.add;
    s.bag[mi]=null;s.bag[xi]=null;s.bag[Math.min(mi,xi)]=it;return {ok:true,cost,item:it,lines:n};
  }
  // Tạo nhân vật mới (từ thông tin máy chủ)
  function create(ch){
    const bag=Array(BAG_SIZE).fill(null);
    ['crossbow','bow','spear','staff','shield','hat','armor'].forEach((type,i)=>bag[i]={uid:'training-'+type+'-'+i,type});
    const st=Object.fromEntries(STAT_KEYS.map(k=>[k,Math.max(0,Math.floor(num(ch&&ch.stats&&ch.stats[k],12)))]));st.command=num(CFG.menh_lenh_goc,10);
    const s={name:(ch&&ch.name)||'Lữ khách',gender:ch&&ch.gender==='f'?'f':'m',level:1,exp:0,points:0,alloc:Object.fromEntries([...STAT_KEYS,'command'].map(k=>[k,0])),stats:st,hp:1e9,mana:1e9,passive:0,copper:num(CFG.tien_thu_nghiem,0),rubies:num(CFG.hong_ngoc_thu_nghiem,0),
      flags:{river:false,hunted:false,kills:{},wells:{}},equipment:Object.fromEntries(slots.map(k=>[k,k==='right'?{uid:'training-sword',type:'sword'}:null])),bag,skillSlots:Array(SKILL_SLOTS).fill(null),activeBook:null,cooldowns:{},
      quests:{active:{},done:{}},mercs:[],pets:[],avatar:'',avatars:[],cos:newCos(),quiz:{},luck:0,recruit:null,rs:(Math.random()*2147483647)|0};
    const D=derive(s);s.hp=D.tot.hp;s.mana=D.tot.mp;return s;
  }
  // Tính toàn bộ chỉ số: 5 chỉ số lớn + chỉ số nhỏ (base + phần cộng thêm từ đồ, bộ, sách)
  const isRanged=k=>k==='bow'||k==='crossbow';
  // Chính xác của cung / nỏ (Sheet cau_hinh: cung_chinh_xac, no_chinh_xac, chinh_xac_moi_cap)
  const aimAcc=it=>{const k=kind(it);if(!isRanged(k))return 0;return Math.min(100,num(CFG[k==='bow'?'cung_chinh_xac':'no_chinh_xac'],k==='bow'?70:76)+num(CFG.chinh_xac_moi_cap,2)*((it&&it.lv)||0));};
  // mốc cường hóa đủ bộ: [cấp thấp nhất, chỉ số, giá trị, biểu tượng]
  const ENH_TIERS=[[10,'cdr',5,'whirl'],[11,'atkSpd',6,'speed'],[12,'moveSpd',6,'feather'],[13,'crit2',4,'spark'],[14,'dmgRed',4,'shield'],[15,'crit3',2,'flame']];
  const CAPS={reflect:60,dodge:50,block:60,dmgRed:70,cdr:50,crit2:60,crit3:30,range:60,perfRed:80,critRed:80,legRed:80,mythRed:80,acc:100,fullHeal:20,aim:100,mercDmg:300,petDmg:300};
  function derive(s,opt={}){
    const A={},add=(k,v)=>{if(v)A[k]=(A[k]||0)+v;};
    const eqs=slots.map(k=>s.equipment[k]).filter(it=>info(it)&&!(opt.safe&&info(it).slot==='mount'));
    let atk=0,mount=null,shield=false;const setCount={},fx={};
    for(const it of eqs){
      const d=info(it),st=stat(it);atk+=st.atk;add('def',st.def);add('hp',st.hp);add('mp',st.mp);
      if(d.slot==='mount'){mount=d;if(st.speed>1)add('moveSpd',Math.round((st.speed-1)*100));}
      if(d.kind==='shield')shield=true;
      for(const [k,v] of Object.entries(it.add||{}))if(ADD[k])add(k,num(v));
      if(d.set&&(!d.gender||d.gender===s.gender))setCount[d.set]=(setCount[d.set]||0)+1;
      if(d.fx)fx[d.fx]=Math.max(fx[d.fx]||0,d.fxv);
    }
    if(atk){add('dmgMin',Math.round(atk*.8));add('dmgMax',Math.round(atk*1.3));}
    // v10.19: Uy lực trang bị — mỗi món cộng % sát thương và % máu theo phẩm chất (uy_luc_pham_chat) và cấp cường hóa (uy_luc_moi_cap)
    let power=0;{const base=cfgList('uy_luc_pham_chat','0,1,3,8,8'),per=cfgList('uy_luc_moi_cap','0.3,0.3,0.4,1.2,0.9'),ord=['n','g','p','l','m'];for(const it of eqs){const i=Math.max(0,ord.indexOf(qOf(it)||'n'));power+=num(base[i])+num(per[i])*(it.lv||0);}power=Math.round(power*10)/10;}
    if(shield)add('block',10);
    const sets=[];
    for(const [id,n] of Object.entries(setCount)){const S=SETS[id];if(!S)continue;sets.push({id,n,name:S.name,hero:S.hero});for(const t of [3,5,7])if(n>=t)for(const [k,v] of Object.entries(S.tiers[t]))add(k,v);if(n>=Math.min(9,S.pieces.length))fx[S.fx]=Math.max(fx[S.fx]||0,S.fxv);} // v10.14: bộ 8 món (vũ khí hai tay) đủ 8 là kích hoạt
    // Hào quang cường hóa (8 ô đồ trừ thú cưỡi; vũ khí hai tay tính cả ô tay trái):
    //  5 món +9 trở lên: + máu · đủ 8 ô +9: thêm máu và % sát thương · đủ 8 ô cùng từ +10..+15: mỗi mốc thêm một hiệu ứng (cộng dồn)
    const EQ8=['right','left','hat','armor','pants','gloves','shoes','wings'],lvOf=k=>{const it=k==='left'&&isTwo(s.equipment.right)?s.equipment.right:s.equipment[k];return info(it)?(it.lv||0):-1;};
    const lvs=EQ8.map(lvOf),n9=lvs.filter(v=>v>=9).length,full=lvs.every(v=>v>=9),minLv=Math.min(...lvs),enh={n9,full,min:full?minLv:0,list:[]};let enhDmg=0;
    if(n9>=5){add('hp',num(CFG.cuong_hoa_5_mau,80));enh.list.push(['heart','5 món +9: máu +'+num(CFG.cuong_hoa_5_mau,80)]);}
    if(full){add('hp',num(CFG.cuong_hoa_bo_mau,150));enhDmg=num(CFG.cuong_hoa_bo_sat_thuong,10);enh.list.push(['sword','Đủ bộ +9: máu +'+num(CFG.cuong_hoa_bo_mau,150)+', sát thương +'+enhDmg+'%']);
      for(const [lv,k,v,ic] of ENH_TIERS)if(minLv>=lv){add(k,v);enh.list.push([ic,'Đủ bộ +'+lv+': '+ADD[k].name+' +'+v+ADD[k].unit]);}}
    // v10.21: hiệu ứng mỗi hệ lấy theo quyển mạnh nhất (bậc × phẩm chất: bookFx), tỉ lệ kích hoạt cộng thêm theo cấp luyện
    const books={},blv={},bef={};let demon=null;for(const it of (s.skillSlots||[])){const d=info(it);if(d&&d.element){const e=d.element,f=bookFx(it);books[e]=true;blv[e]=Math.max(blv[e]??-1,it.lv||0);bef[e]=Math.max(bef[e]||0,f);for(const [k,v] of Object.entries(bookStat(it)))add(k,v);
      if(e==='demon'){const o=demonOf(it);if(!demon||o.ef>demon.ef||(o.ef===demon.ef&&o.lv>demon.lv))demon=o;}}}
    const r1=v=>Math.round(v*10)/10,pc=(k,f,e)=>blv[e]>=0?r1(num(CFG[k],f)*bef[e]+num(CFG.sach_ti_le_cap,1)*blv[e]):0;
    const bfx={thunder:pc('loi_ti_le',4.5,'thunder'),wind:pc('phong_ti_le',25,'wind'),ice:pc('bang_ti_le',22,'ice'),light:pc('sang_ti_le',8,'light'),demon:blv.demon>=0?blv.demon:-1,
      // v10.31: Phong — mỗi đòn trúng có % hoá thành chính quái đó (sát thương ×2), tỉ lệ theo bậc × phẩm chất + cấp luyện; thời gian = max(6, cấp luyện) giây
      morph:blv.wind>=0?r1(num(CFG.phong_hoa_ti_le,3)*bef.wind+num(CFG.phong_hoa_moi_cap,.3)*blv.wind):0,morphSec:blv.wind>=0?Math.max(num(CFG.phong_hoa_giay,6),blv.wind):0,
      // v10.31: Thổ — Trêu ngươi: mỗi đòn trúng có % kéo mọi quái quanh nhân vật quay sang đánh mình
      taunt:blv.earth>=0?r1(num(CFG.tho_treu_ti_le,20)*bef.earth+num(CFG.sach_ti_le_cap,1)*blv.earth):0,
      shatter:blv.ice>=0?r1(num(CFG.bang_vo_bang,120)*bef.ice):0};
    if(books.water)add('mpReg',r1(num(CFG.thuy_hoi_mana,3)*bef.water));if(books.wood)add('hpReg',r1(num(CFG.moc_hoi_mau,6)*bef.wood));if(books.earth)add('reflect',r1(num(CFG.tho_phan_don,9)*bef.earth));if(books.metal)add('dmgRed',r1(num(CFG.kim_giam_sat_thuong,28)*bef.metal));
    // v10.33: Thủy — Hồi nguyên: % sát thương gây ra hồi thành máu (cộng vào Hút máu); Băng — Vỡ băng (bfx.shatter, 06-game hitMonster)
    if(books.water)fx.lifesteal=Math.min(60,num(fx.lifesteal)+r1(num(CFG.thuy_hut_mau,16)*bef.water));
    const fireK=books.fire?1+num(CFG.hoa_sat_thuong,9)*bef.fire/100:1;
    const st=s.stats||{},al=s.alloc||{};
    const main={str:num(st.strength)+num(al.strength)+(A.str||0),agi:num(st.agility)+num(al.agility)+(A.agi||0),vit:num(st.vitality)+num(al.vitality)+(A.vit||0),int:num(st.intelligence)+num(al.intelligence)+(A.int||0),cmd:num(st.command)+num(al.command)+(A.cmd||0)};
    const base={dmgMin:main.str*.6,dmgMax:main.str,crit2:main.str*.1,atkSpd:main.agi*.6,moveSpd:main.agi*.3,def:main.agi*.3,dodge:main.agi*.2,hp:num(CFG.mau_goc,60)+main.vit*num(CFG.mau_moi_diem,5),mp:num(CFG.mana_goc,40)+main.int*num(CFG.mana_moi_diem,4),cdr:main.int*.3,
      // v10.14: Sức khỏe → % hồi đầy máu khi trúng đòn; Trí tuệ → chính xác cung nỏ, hồi mana mỗi giây; Mệnh lệnh → % sát thương lính thuê và quái thu phục (Sheet cau_hinh, mỗi 100 điểm)
      fullHeal:main.vit*num(CFG.suc_khoe_hoi_day,2)/100,aim:main.int*num(CFG.tri_tue_chinh_xac,4)/100,mpReg:main.int*num(CFG.tri_tue_hoi_mana,2)/100,mercDmg:main.cmd*num(CFG.menh_lenh_sat_thuong,50)/100,petDmg:main.cmd*num(CFG.menh_lenh_sat_thuong,50)/100};
    // v10.35: tốc đánh, tốc chạy cộng thêm (từ Nhanh nhẹn, đồ, thú cưỡi) × he_so_toc_danh / he_so_toc_chay rồi chặn trần (cấp cao đầy Nhanh nhẹn không còn nhanh quá tay)
    const SPD={atkSpd:[num(CFG.he_so_toc_danh,.5),num(CFG.toc_danh_toi_da,150)],moveSpd:[num(CFG.he_so_toc_chay,.5),num(CFG.toc_chay_toi_da,80)]};
    const tot={};for(const k of Object.keys(ADD)){if(GROUPS.some(g=>g[0]===k))continue;let v=(base[k]||0)+(A[k]||0);if(SPD[k])v=Math.min(SPD[k][1],v*SPD[k][0]);if(CAPS[k])v=Math.min(CAPS[k],v);tot[k]=ADD[k].unit?Math.round(v*10)/10:Math.round(v);}
    tot.hp=Math.round(tot.hp*(1+power*num(CFG.uy_luc_mau,100)/1e4));tot.mp=Math.round(tot.mp);tot.dmgMax=Math.max(tot.dmgMax,tot.dmgMin);
    if(fx.defPct)tot.def=Math.round(tot.def*(1+fx.defPct/100)); // v10.13: Kiên cố (thú thần thoại)
    // cung, nỏ: tỉ lệ chính xác khi khóa mục tiêu (tăng theo cấp gia cường) và cộng thêm tỉ lệ x2 sát thương
    const rw=(s.equipment||{}).right;if(isRanged(kind(rw))){tot.aim=Math.min(100,Math.round((aimAcc(rw)+(tot.aim||0))*10)/10);tot.crit2=Math.min(CAPS.crit2,(tot.crit2||0)+num(CFG.cung_no_x2,15));} // v10.14: + chính xác từ Trí tuệ, đồ
    return {main,add:A,tot,fx,books,bfx,bef,demon,sets,mount,enh,power,dmgMul:(1+power*num(CFG.uy_luc_sat_thuong,100)/1e4)*fireK*(1+enhDmg/100)*(1+num(fx.dmgPct)/100)};
  }
  const mountCmd=eq=>eq&&eq.mount&&info(eq.mount)?mountNeed(eq.mount):0;
  // Mệnh lệnh: thú cưỡi + mỗi lính đang đi theo tốn số điểm riêng của lính đó (lính gục chờ ở làng vẫn giữ chỗ)
  // Lính thành trì: mỗi ngày (giờ Việt Nam) nhận một hệ sách ngẫu nhiên theo mã lính → đòn có hệ, mỗi đòn thứ 4 ra chiêu diện rộng
  // v10.13: lính thành trì chào thuê theo ngày — mỗi mẫu lính 3 suất, cấp quanh cấp thành, điểm chỉ số (cấp × linh_diem_cap) chia ngẫu nhiên vào 4 chỉ số, mệnh lệnh cộng thêm;
  // cùng ngày (giờ Việt Nam) máy người chơi và máy chủ sinh ra y hệt (băm mẫu|ngày|suất) nên thuê suất nào là được đúng lính đó
  const dayOf=now=>Math.floor((now+7*3600e3)/864e5);
  const hashStr=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
  function mercOffer(T,k,day){const st0={rs:hashStr(T.id+'|'+day+'|'+k)|0},r=seqRng(st0),base=mapLevel(T.map),lv=Math.max(1,base+[-10,0,15][k%3]+Math.floor(r()*8)),pts=Math.round(lv*num(CFG.linh_diem_cap,3));
    const keys=['strength','agility','vitality','intelligence'],w=keys.map(()=>r()+.15),ws=w.reduce((a,b)=>a+b,0),stats={...T.stats};keys.forEach((key,i)=>{stats[key]=Math.round(num(stats[key])+pts*w[i]/ws);});
    const cmd=T.cmd+Math.floor(r()*Math.max(1,lv/25)),price=Math.round(T.price*Math.max(.5,lv/Math.max(1,base)));
    return {tpl:T.id,k,day,lv,stats,cmd,price,name:T.name,gender:T.gender,desc:T.desc,gear:T.gear,map:T.map};}
  function mercOffers(mapId,now=Date.now()){const day=dayOf(now),out=[];for(const T of Object.values(MERCS)){if(!T.map||T.map!==mapId)continue;for(let k=0;k<3;k++)out.push(mercOffer(T,k,day));}return out;}
  // v10.14: phẩm cấp lính thuê — n thường · g tinh nhuệ · p thiện chiến · l huyền thoại · m thần thoại. Máu và sát thương nhân theo linh_he_so (1, 1.5, 2, 3, 4)
  const TIERS=['n','g','p','l','m'],TIER_NAME={n:'Lính thường',g:'Tinh nhuệ',p:'Thiện chiến',l:'Huyền thoại',m:'Thần thoại'};
  const cfgList=(k,def)=>String(CFG[k]===undefined||CFG[k]===''?def:CFG[k]).split(',').map(x=>num(x.trim()));
  const topTier=m=>m&&(m.tier==='l'||m.tier==='m'),topMul=m=>topTier(m)?1+num(CFG.linh_huyen_than_them,0):1; // v10.17: huyền thoại, thần thoại thêm máu, sát thương, phòng ngự
  const tierMul=m=>{const i=Math.max(0,TIERS.indexOf((m&&m.tier)||'n'));return Math.round(Math.max(1,num(cfgList('linh_he_so','1,1.5,2,3,4')[i],1))*topMul(m)*100)/100;};
  const mercDefMul=m=>topMul(m);
  const isGen=m=>!!(m&&m.gen&&(m.tier==='l'||m.tier==='m')),tuongPts=t=>t==='m'?num(CFG.tuong_diem_than,2600):num(CFG.tuong_diem_huyen_thoai,1800);
  // v10.24: lính đủ cấp vùng (lv ≥ cấp vùng − 10) có máu tối thiểu = số đòn quái thường chịu được × sát thương quái vùng; giảm sát thương nhận, hồi máu mỗi giây theo phẩm cấp
  function mercGuard(m,regionLv,mobDmg){const i=Math.max(0,TIERS.indexOf((m&&m.tier)||'n')),pick=(k,d)=>num(cfgList(k,d)[i]);const ok=isGen(m)||num(m&&m.lv)>=num(regionLv)-num(CFG.linh_cap_lech,10); // danh tướng: luôn được máu tối thiểu, mọi vùng
    return {hpMin:ok?Math.round(pick('linh_mau_toi_thieu','6,8,10,25,35')*num(mobDmg)):0,red:pick('linh_giam_sat_thuong','0,10,20,35,45'),reg:pick('linh_hoi_mau','0.5,1,1.5,3,4')};}
  const petDmgMul=()=>num(CFG.thu_phuc_sat_thuong,1); // v10.17: sát thương quái thu phục
  const mountPow=()=>num(CFG.thu_cuoi_nhan_chi_so,1); // v10.17: công, thủ và đòn của thú cưỡi
  // Đơn chiêu mộ (chieu_mo_hong_ngoc hồng ngọc một lần): rút phẩm cấp theo chieu_mo_ti_le; thường / tinh nhuệ / thiện chiến lấy mẫu lính của thành đang đứng,
  // huyền thoại / thần thoại là danh tướng (TUONG) mặc sẵn bộ huyền thoại / bộ thần, tháo ra cho người chơi dùng được. Giá theo cấp thành (f = cấp/300)
  function recruitRoll(mapId,rng,now,luck=0){
    const P=cfgList('chieu_mo_ti_le','50,35,10,3,2').map(num);
    // v10.31: cỏ may mắn chuyển % từ lính thường sang tinh nhuệ, thiện chiến (chia đôi); không đổi % huyền thoại, thần thoại
    if(luck>0){const mv=Math.min(P[0],luck*num(CFG.co_may_man_chieu_mo,2));P[0]-=mv;P[1]+=mv/2;P[2]+=mv/2;}
    const tot=P.reduce((a,b)=>a+b,0);let x=rng()*tot,ti=P.length-1;for(let i=0;i<P.length;i++){x-=P[i];if(x<0){ti=i;break;}}
    const tier=TIERS[ti],base=Math.max(1,mapLevel(mapId)||1),f=Math.max(0,Math.min(1,base/300)),lv=Math.max(1,ti>=3?base+Math.floor(rng()*11):base+[0,10,20,35,50][ti]+Math.floor(rng()*11));
    // v10.25: danh tướng (Huyền thoại, Thần thoại) không theo hệ lính thường: chỉ số cố định tuong_diem dù chiêu mộ ở làng hay thành cuối; cấp = cấp nơi chiêu mộ (+0..10)
    const pts=ti>=3?tuongPts(tier):Math.round(lv*num(CFG.linh_diem_cap,3)*(1+ti*.25)),keys=['strength','agility','vitality','intelligence'],w=keys.map(()=>rng()+.15),L=Math.round;
    let o;
    // v10.26: danh tướng cần 150–350 Mệnh lệnh (cmd 15–35 × linh_nhan_menh_lenh), không theo nơi chiêu mộ
    if(ti>=3){const gs=Object.values(TUONG);if(!gs.length)throw Error('TUONG');const G=gs[Math.floor(rng()*gs.length)];o={tier,lv,gen:G.id,name:G.name,gender:G.gender,desc:G.desc,set:tier==='m'?G.setM:G.setL,cmd:15+Math.floor(rng()*21),stats:Object.fromEntries(keys.map(k=>[k,12]))};}
    else{const pool=Object.values(MERCS).filter(T=>T.map===mapId),pl=pool.length?pool:Object.values(MERCS).filter(T=>!T.map);if(!pl.length)throw Error('MERC');const T=pl[Math.floor(rng()*pl.length)];o={tier,lv,tpl:T.id,name:T.name,gender:T.gender,desc:T.desc,gear:T.gear.slice(),cmd:T.cmd+Math.floor(rng()*Math.max(1,lv/25))+ti*2,stats:{...T.stats}};}
    // danh tướng: chỉ số nghiêng theo binh khí (gậy phép → trí tuệ, cung nỏ → nhanh nhẹn, còn lại → sức mạnh; có khiên → thêm sức khỏe)
    if(o.set&&SETS[o.set]){const wk=items[o.set+':right'],kd=wk?wk.kind:'';w[kd==='staff'?3:kd==='bow'||kd==='crossbow'?1:0]+=1.6;if(items[o.set+':left']&&items[o.set+':left'].kind==='shield')w[2]+=.6;}
    const ws2=w.reduce((a,b)=>a+b,0);keys.forEach((k,i)=>{o.stats[k]=L(num(o.stats[k])+pts*w[i]/ws2);});o.stats.command=0;
    const lerp=(a,b)=>L(a+(b-a)*f);
    if(ti>=3){const vi=keys.indexOf('vitality');if(w[vi]<ws2*.25){o.stats.vitality=Math.max(o.stats.vitality,L(pts*.25));}} // danh tướng: Sức khỏe ít nhất 1/4 số điểm
    o.price=ti===0?{copper:lerp(1,100)*10000}:ti===1?(f<.25?{copper:L(100+300*f/.25)*10000}:{rubies:lerp(10,100)}):ti===2?{rubies:lerp(100,500)}:{rubies:Math.round(ti===4?num(CFG.tuong_gia_than,2000):num(CFG.tuong_gia_huyen_thoai,500))}; // v10.25: giá danh tướng như nhau mọi nơi
    o.map=mapId;o.at=now;return o;
  }
  function recruit(s,mapId,rng,now,luck=0,free=false){if(s.recruit)throw Error('CHIEU_MO_DO');const cost=num(CFG.chieu_mo_hong_ngoc,100);
    if(free){if(String(mapId)!=='thanh-moc')throw Error('CHI_THANH_MOC');if(!(num(s.flags.freeRecruit)>0))throw Error('HET_LUOT');}else if(s.rubies<cost)throw Error('RUBY');
    const L=useLuck(s,luck);if(free)s.flags.freeRecruit=num(s.flags.freeRecruit)-1;else s.rubies-=cost;s.recruit=recruitRoll(String(mapId||''),rng,now,L);return s.recruit;}
  function recruitHire(s,rng){
    const o=s.recruit;if(!o)throw Error('CHIEU_MO');if(s.mercs.length>=MAX_MERC)throw Error('MERC_FULL');
    if(num(o.price.copper)>s.copper)throw Error('MONEY');if(num(o.price.rubies)>s.rubies)throw Error('RUBY');
    const m=makeMerc({src:'npc',tpl:o.tpl||'',name:o.name,gender:o.gender,cmd:o.cmd,stats:o.stats,lv:o.lv,tier:o.tier,gen:o.gen||''},rng);
    if(o.set&&SETS[o.set]){for(const id of SETS[o.set].pieces){const d=items[id],it=roll(id,d.q||'l',rng);if(d.slot==='hand')m.equipment[id.endsWith(':left')?'left':'right']=it;else m.equipment[d.slot]=it;}}
    else{let hand=0;for(const g of (o.gear||[])){const d=items[g];if(!d)continue;const it=roll(g,o.tier==='p'?'p':o.tier==='g'?'g':'n',rng);if(d.slot==='hand'){const sl=d.grip==='two'?'right':hand++?'left':'right';m.equipment[sl]=it;}else if(d.slot!=='mount')m.equipment[d.slot]=it;}}
    s.copper-=num(o.price.copper);s.rubies-=num(o.price.rubies);s.recruit=null;m.on=fitFollow(s,m);s.mercs.push(m);return m;
  }
  const cleanRecruit=o=>{if(!o||typeof o!=='object'||!TIERS.includes(o.tier))return null;const st={};for(const k of ['strength','agility','vitality','intelligence'])st[k]=Math.max(0,Math.floor(num(o.stats&&o.stats[k],10)));st.command=0;
    return {tier:o.tier,lv:Math.max(1,Math.floor(num(o.lv,1))),gen:TUONG[o.gen]?o.gen:'',tpl:MERCS[o.tpl]?o.tpl:'',name:String(o.name||'Lính').slice(0,20),gender:o.gender==='f'?'f':'m',desc:String(o.desc||'').slice(0,120),set:SETS[o.set]?o.set:'',gear:Array.isArray(o.gear)?o.gear.filter(g=>items[g]).slice(0,8):[],cmd:Math.max(1,Math.floor(num(o.cmd,10))),stats:st,price:{copper:Math.max(0,Math.floor(num(o.price&&o.price.copper))),rubies:Math.max(0,Math.floor(num(o.price&&o.price.rubies)))},map:String(o.map||''),at:Math.floor(num(o.at))};};
  function mercDaily(m,now=Date.now()){const T=m&&MERCS[m.tpl];if(!T||!T.map)return null;const day=Math.floor((now+7*3600e3)/864e5);let h=0;for(const ch of String(m.mid))h=(h*31+ch.charCodeAt(0))>>>0;const keys=Object.keys(ELEMENTS),el=keys[(h+day)%keys.length];return {el,name:ELEMENTS[el].name,skill:'Sách '+ELEMENTS[el].name};}
  // v10.16: Mệnh lệnh cần để dắt một lính = chỉ số cmd của lính × linh_nhan_menh_lenh; máu, sát thương lính × linh_nhan_chi_so
  const mercCost=m=>Math.round(num(m&&m.cmd,5)*num(CFG.linh_nhan_menh_lenh,1));
  const mercPow=()=>num(CFG.linh_nhan_chi_so,1);
  function mercCmd(s){return (s.mercs||[]).reduce((a,m)=>a+(m.on?mercCost(m):0),0);}
  // Mệnh lệnh: tổng, đã dùng (thú cưỡi, lính), còn trống
  function cmdInfo(s){const total=derive(s).main.cmd,mount=mountCmd(s.equipment),merc=mercCmd(s);return {total,mount,merc,used:mount+merc,free:total-mount-merc};}
  function fitFollow(s,m){return (m.hpFrac===undefined||m.hpFrac>0)&&cmdInfo(s).free>=mercCost(m);}
  function stash(bag,list,prefer){const b=bag.slice();for(const it of list){const i=prefer!=null&&b[prefer]===null?prefer:b.indexOf(null);if(i<0)throw Error('BAG_FULL');b[i]=it;prefer=null;}return b;}
  const newCos=()=>({use:{avatar:'',nen:'',ten:''},own:{avatar:[],nen:[],ten:[]}});
  const COS_KINDS=['avatar','nen','ten']; // v10.12: bỏ khung chân dung
  // v10.41: thuốc kinh nghiệm (s.flags.xp = {p: % thêm, u: hết lúc}) và thuốc tẩy điểm
  const POTIONS=['kn','tay'],xpBuff=(s,now=Date.now())=>{const x=s&&s.flags&&s.flags.xp;return x&&num(x.u)>now?num(x.p):0;};
  function fitCmd(s){const mt=s.equipment&&s.equipment.mount;if(mt&&mountCmd(s.equipment)>derive(s).main.cmd){const b=s.bag.indexOf(null);if(b>=0){s.bag[b]=mt;s.equipment.mount=null;}}
    const D=derive(s);let left=D.main.cmd-mountCmd(s.equipment);for(const m of s.mercs||[])if(m.on){if(mercCost(m)<=left)left-=mercCost(m);else m.on=false;}s.hp=Math.min(num(s.hp),D.tot.hp);s.mana=Math.min(num(s.mana),D.tot.mp);}
  function drinkPotion(s,d,now){
    if(d.kind==='kn'){const pct=Math.max(1,num(d.val,50)),dur=num(CFG.thuoc_kn_phut,60)*60000,cap=num(CFG.thuoc_kn_toi_da_phut,480)*60000,x=s.flags.xp,cur=xpBuff(s,now);
      // cộng dồn theo "phần trăm × thời gian": thuốc mạnh hơn thì phần còn lại của thuốc yếu quy ra thời gian ở mức mạnh hơn, và ngược lại
      const P=Math.max(pct,cur),left=cur?(num(x.u)-now)*cur/P:0,total=left+dur*pct/P;if(total>cap+1000)throw Error('KN_DAY');
      s.flags.xp={p:P,u:Math.floor(now+total)};return {kind:'kn',p:P,u:s.flags.xp.u};}
    if(d.kind==='tay'){const K=[...STAT_KEYS,'command'],back=K.reduce((a,k)=>a+Math.floor(num(s.alloc&&s.alloc[k])),0);if(back<=0)throw Error('KHONG_CAN_TAY');
      for(const k of K)s.alloc[k]=0;s.points=(s.points||0)+back;fitCmd(s);return {kind:'tay',pts:back};}
    throw Error('ITEM');
  }
  // Mỹ phẩm vào thẳng bộ sưu tập và mặc luôn (mua ở Phấn Son hoặc dùng từ túi); thuốc đa nhiệm cần chọn hiệu ứng tên fx
  function wearCos(s,d,type,fx){s.cos=s.cos||newCos();let kind=d.kind,id=type;if(kind==='thuoc'){kind='ten';id=String(fx||'');if(!NAME_FX[id])throw Error('FX');}if(!COS_KINDS.includes(kind))throw Error('ITEM');if(!s.cos.own[kind].includes(id))s.cos.own[kind].push(id);s.cos.use[kind]=id;return {kind,id};}
  function targets(s,item){
    const d=info(item);if(!d||!d.slot||d.slot==='book'||d.slot==='cos'||d.slot==='quest')return [];
    if(d.gender&&d.gender!==s.gender)return [];
    if(d.slot!=='hand')return [d.slot];
    if(d.grip==='two')return ['right'];
    const eq=s.equipment;if(isTwo(eq.right))return ['left','right'];
    return ['left','right'].filter(sl=>{const o=eq[sl==='left'?'right':'left'];return !o||pairOk(d.kind,kind(o));});
  }
  function equip(s,index,slot){
    if(!Number.isInteger(index)||index<0||index>=BAG_SIZE)throw Error('SLOT');
    const item=s.bag[index],d=info(item);if(!d||!slots.includes(slot))throw Error('SLOT');
    if(d.gender&&d.gender!==s.gender)throw Error('GENDER');
    if(d.slot==='mount'&&!s.isMerc){const need=mountNeed(item);if(need>derive(s).main.cmd-mercCmd(s))throw Error('CMD');}
    if(d.slot!=='hand'){if(d.slot!==slot)throw Error('SLOT');s.bag[index]=s.equipment[slot];s.equipment[slot]=item;return;}
    if(slot!=='left'&&slot!=='right')throw Error('SLOT');
    const eq=s.equipment;let bag=s.bag.slice();bag[index]=null;
    if(d.grip==='two'){bag=stash(bag,[eq.right,eq.left].filter(Boolean),index);s.bag=bag;eq.right=item;eq.left=null;return;}
    const prevTwo=isTwo(eq.right)?eq.right:null,other=prevTwo?null:eq[slot==='left'?'right':'left'];
    if(other&&!pairOk(d.kind,kind(other)))throw Error('PAIR');
    bag=stash(bag,prevTwo?[prevTwo]:(eq[slot]?[eq[slot]]:[]),index);
    s.bag=bag;if(prevTwo){eq.right=null;eq.left=null;}eq[slot]=item;
  }
  function unequip(s,slot){
    if(!slots.includes(slot))throw Error('SLOT');
    const key=slot==='left'&&isTwo(s.equipment.right)?'right':slot,it=s.equipment[key];if(!it)return;
    const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.bag[i]=it;s.equipment[key]=null;
  }
  function stance(s){
    const L=s.equipment.left,R=s.equipment.right;
    if(isTwo(R))return {type:kind(R),two:true,dual:false,shield:false,left:null,right:kind(R),tintL:null,tintR:info(R).tint||null,lvL:0,lvR:R.lv||0,itL:null,itR:R.type};
    const l=kind(L),r=kind(R),types=[l,r].filter(Boolean);
    const base={two:false,left:l,right:r,tintL:L?info(L).tint||null:null,tintR:R?info(R).tint||null:null,lvL:L?L.lv||0:0,lvR:R?R.lv||0:0,itL:L?L.type:null,itR:R?R.type:null};
    if(!types.length)return {...base,type:'punch',dual:false,shield:false};
    const type=['sword','saber','mace','staff'].find(k=>types.includes(k))||'shield'; // v10.14: đao, chùy
    return {...base,type,dual:types.length===2&&l===r,shield:types.includes('shield')&&type!=='shield'};
  }
  function setSkill(s,bagIndex,slotIndex){
    const item=s.bag[bagIndex];if(!info(item)||info(item).slot!=='book')throw Error('BOOK');
    if(slotIndex==null){slotIndex=s.skillSlots.indexOf(null);if(slotIndex<0)slotIndex=s.activeBook??0;}
    if(slotIndex<0||slotIndex>=SKILL_SLOTS)throw Error('SLOT');
    s.bag[bagIndex]=s.skillSlots[slotIndex];s.skillSlots[slotIndex]=item;s.activeBook=slotIndex;
  }
  function unsetSkill(s,i){const it=s.skillSlots[i];if(!it)return;const b=s.bag.indexOf(null);if(b<0)throw Error('BAG_FULL');s.bag[b]=it;s.skillSlots[i]=null;if(s.activeBook===i)s.activeBook=s.skillSlots.findIndex(Boolean);if(s.activeBook<0)s.activeBook=null;}
  function toggleBook(s,i){if(!s.skillSlots[i])return;s.activeBook=s.activeBook===i?null:i;}
  function element(s){const b=s.activeBook!=null?s.skillSlots[s.activeBook]:null;return b&&info(b)?info(b).element:null;}
  function money(c){return {gold:Math.floor(c/10000),silver:Math.floor(c/100)%100,copper:c%100};}
  // Dòng hàng của một cửa hàng (shop = mã cửa hàng; không có thì tìm trong mọi cửa hàng)
  // v10.21: không ghi cửa hàng thì lấy dòng ở cửa hàng làng trước (trước đây lấy dòng cuối cùng → sách mua ở Đạo sĩ làng thành sách bậc Phú Xuân, giá Phú Xuân)
  const shopRow=(type,shop)=>{if(shop&&SHOPS[shop])return SHOPS[shop].find(r=>r.id===type)||null;let row=null,town=null;for(const k in SHOPS){const r=SHOPS[k].find(x=>x.id===type);if(!r)continue;if(/^thanh-/.test(k)){if(!town)town=r;}else if(!row)row=r;}return row||town;};
  // Giá: Đẹp ×he_so_gia_do_dep, Hoàn hảo ×he_so_gia_hoan_hao (%). Đồ phẩm chất cố định (huyền thoại, thần) bán trong cửa hàng thành trì thì tính theo giá dòng hàng
  // v10.23: giá sách = giá ở làng × sach_gia_nhan × sach_gia_moi_thanh^(bậc thành) × phẩm chất
  function shopPrice(type,q='n',shop){const d=items[type];if(!d)return 0;const row=shopRow(type,shop),p=row&&row.price?row.price:d.price;if(d.q)return Math.round(p);if(d.slot==='book')return Math.round(num(d.price)*num(CFG.sach_gia_nhan,100)*Math.pow(num(CFG.sach_gia_moi_thanh,5),bacOfT(row&&row.t))*lst('sach_gia_pham_chat','1,5,20,100,400',Math.max(0,QORD.indexOf(q))));return Math.round(p*(q==='g'?num(CFG.he_so_gia_do_dep,250)/100:q==='p'?num(CFG.he_so_gia_hoan_hao,600)/100:1));}
  // v10.21: sách Huyền thoại, Thần thêm giá hồng ngọc theo bậc thành
  function shopRuby(type,q='n',shop){const d=items[type];if(!d)return 0;if(d.ruby)return d.ruby;if(d.slot!=='book')return 0;const row=shopRow(type,shop);return Math.round(lst('sach_hong_ngoc_pham_chat','0,0,0,20,100',Math.max(0,QORD.indexOf(q)))*lst('sach_hong_ngoc_bac','1,2,4,7,10',bacOfT(row&&row.t)));}
  function buy(s,type,q='n',rng=Math.random,shop){const d=items[type];const row=shopRow(type,shop);if(!d||!(row&&row.price||d.price||d.ruby)||(d.q&&!row))throw Error('ITEM');if(row&&!row.q.includes(d.q||q))throw Error('ITEM');const price=d.ruby?0:shopPrice(type,q,shop),rb=shopRuby(type,d.q?'n':q,shop);if(s.copper<price)throw Error('MONEY');if(s.rubies<rb)throw Error('RUBY');const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.copper-=price;s.rubies-=rb;s.bag[i]=roll(type,d.q?'n':q,rng,row&&row.t||0);return i;}
  function sell(s,index){const it=s.bag[index];if(!it)throw Error('SLOT');const dd=info(it);if(dd&&(dd.slot==='quest'||dd.slot==='cos'))throw Error('KHONG_BAN');const v=sellPrice(it);s.copper+=v;s.bag[index]=null;return v;}
  function addItem(s,it){const i=s.bag.indexOf(null);if(i<0)throw Error('BAG_FULL');s.bag[i]=it;return i;}
  // Mana kỹ năng theo loại vũ khí đang cầm (thú cưỡi không đổi)
  function skillCost(s,id,W){const k=skills[id];if(!k)return 0;return id==='mount'||!k.cost?k.cost:Math.round(k.cost*(W||weapon(stance(s).type)).mana);}
  function cast(s,id,now,D){
    const skill=skills[id];if(!skill)return {ok:false,error:'SKILL'};
    if(id==='mount'&&!s.equipment.mount)return {ok:false,error:'NOMOUNT'};
    if(now<(s.cooldowns[id]||0))return {ok:false,error:'COOLDOWN'};
    const W=weapon(stance(s).type),cost=skillCost(s,id,W);
    if(s.mana<cost)return {ok:false,error:'MANA'};
    const cdr=D?D.tot.cdr:0;
    s.mana-=cost;s.cooldowns[id]=now+skill.cooldown*(1-cdr/100)*(id==='normal'||id==='mount'?1:W.cd);
    const empowered=id==='normal'&&s.passive>=100;
    if(id==='normal')s.passive=empowered?0:Math.min(100,s.passive+W.passive);
    return {ok:true,stance:stance(s),empowered};
  }
  // Nhiệm vụ của Lý trưởng
  /* ---------- Vùng đất và cấp tối thiểu (v9.9): Sheet cau_hinh cap_hang_dong, cap_sa_mac, cap_nui_tuyet ---------- */
  // REGIONS nạp từ tab ban_do (load); cấp của vùng có thể ghi đè bằng cau_hinh cap_<mã vùng, gạch dưới>
  const MON_REGION={'bo-cap':'sa-mac','ken-ken':'sa-mac','chan-tinh':'sa-mac','thach-tinh':'sa-mac','soi-tuyet':'nui-tuyet','gau-nui':'nui-tuyet','ho-tinh':'nui-tuyet','doi-quy':'hang-dong','nhen-doc':'hang-dong','dai-bang':'hang-dong'};
  const mapLevel=id=>{const R=REGIONS.find(r=>r.id===id);if(!R)return 1;return Math.max(1,num(CFG['cap_'+String(id).replace(/-/g,'_')],R.lv));};
  // v10.34: khóa mở vùng ngoài cấp (cột khoa_mo tab ban_do): kill:<mã quái> = đã hạ quái đó, hq:<mã> = đã xong nhiệm vụ ẩn. mapLock → null (vào được) hoặc {lv?, msg}
  const HQ_MSG={'chien-truong':'Đoạt cờ soái giữa doanh trại Cổ Chiến Trường để mở đường','vo-dai':'Thắng đủ 10 danh tướng ở Võ Đài Thập Tướng để mở đường'};
  const mapLock=(s,id)=>{const R=REGIONS.find(r=>r.id===id);if(!R)return null;const need=mapLevel(id);if(((s&&s.level)||1)<need)return {lv:need,msg:'Cần cấp '+need};
    for(const part of String(R.gate||'').split(',').map(x=>x.trim()).filter(Boolean)){const [k,v]=part.split(':');const f=(s&&s.flags)||{};
      if(k==='kill'&&!(num(f.kills&&f.kills[v])>0))return {msg:'Cần hạ '+(MON[v]?MON[v].name:v)+' trước'};
      if(k==='hq'&&!(f.hq&&f.hq[v]))return {msg:HQ_MSG[v]||'Cần xong nhiệm vụ ẩn của vùng trước'};}
    return null;};
  const regionLv=id=>{const R=REGIONS.find(r=>r.id===id);return R?R.lv:1;};
  const regionOf=monId=>(MON[monId]&&MON[monId].map)||MON_REGION[monId]||(/^(game|hq|rescue):/.test(String(monId))?String(monId).split(':')[1]:'')||'thanh-moc'; // v10.39: mục tiêu 'game:<vùng>' (trò nhỏ), 'hq:<vùng>' / 'rescue:<vùng>' (điều kiện)
  const questLevel=Q=>Q?(Q.lv||mapLevel(regionOf(Q.target))):1;
  function questAccept(s,id){const Q=QUESTS[id];if(!Q)throw Error('QUEST');if((s.level||1)<questLevel(Q))throw Error('LEVEL');if(s.quests.active[id]!=null)throw Error('QUEST_HAVE');if(Object.keys(s.quests.active).length>=MAX_ACTIVE_QUEST)throw Error('QUEST_FULL');if(!Q.repeat&&s.quests.done[id])throw Error('QUEST_DONE');if(Q.req&&!(Q.story?storyDone(s,Q.req):s.quests.done[Q.req]))throw Error('QUEST_TRUOC');if(Q.story&&storyDone(s,id))throw Error('QUEST_DONE');s.quests.active[id]=0;}
  // v10.13: sự kiện đột xuất ở làng / thành (mỗi su_kien_phut phút một lần, theo mốc đồng hồ): quái sự kiện hiện ngoài vùng an toàn gần cổng;
  // thắng (đuổi kẻ trộm / hạ hết) → op eventWin: cỏ may mắn + tiền + hồng ngọc; máy chủ chỉ nhận mỗi sự kiện một lần trong một khoảng (srv.evAt)
  const EVENTS={
    'trom-cho':{map:'thanh-moc',name:'Kẻ trộm chó lẻn vào làng',hint:'Đánh cho hắn bỏ chạy',mobs:[['ke-trom-cho',1]],dur:150,flee:.4,luck:[2,4],copper:300,rubies:0},
    'quan-phuong-bac':{map:'co-loa',name:'Quân phương Bắc tràn xuống',hint:'Hạ hết trước khi chúng rút',mobs:[['linh-phuong-bac',6],['tuong-phuong-bac',1]],dur:600,luck:[3,5],copper:20000,rubies:3},
    'dao-tac':{map:'thang-long',name:'Đạo tặc cướp kho lương',hint:'Hạ hết bọn đạo tặc ngoài cổng',mobs:[['dao-tac',6]],dur:600,luck:[3,6],copper:200000,rubies:5},
    'ho-du':{map:'hoa-lu',name:'Hổ dữ sổng chuồng',hint:'Hạ ba con hổ dữ trước khi chúng vào thành',mobs:[['ho-du',3]],dur:600,luck:[4,6],copper:1000000,rubies:8},
    'gian-te':{map:'phu-xuan',name:'Gian tế ám sát trong đêm',hint:'Hạ hết gian tế ngoài cổng thành',mobs:[['gian-te',5]],dur:600,luck:[5,8],copper:4000000,rubies:12}
  };
  // Cốt truyện (v10.12): mỗi việc gắn với một NPC (cột npc, noi). storyAt: việc NPC này đang có cho nhân vật → {Q,state:'new'|'active'|'ready'}; storyNext: việc kế tiếp chưa nhận (để bảng nhiệm vụ chỉ chỗ)
  // v10.39: tuyến Tìm con 34 việc (một việc mỗi vùng). Mục tiêu ngoài quái: 'game:<vùng>' (trò nhỏ, xong gửi op sg), 'hq:<vùng>' (đã xong nhiệm vụ ẩn vùng), 'rescue:<vùng>' (đã đưa An về làng).
  // storyDone: việc coi như xong khi đã trả, hoặc đã trả một việc đứng sau trong chuỗi (người chơi cũ đã xong tc-k không bị kẹt ở các việc mới chèn vào trước tc-k)
  const storyList=()=>{if(STORY_L)return STORY_L;const L=Object.values(QUESTS).filter(Q=>Q.story),by={},out=[],seen=new Set();for(const Q of L)(by[Q.req||'']=by[Q.req||'']||[]).push(Q); // thứ tự chuỗi theo yeu_cau (không theo thứ tự dòng trên Sheet)
    const walk=k=>{for(const Q of by[k]||[]){if(seen.has(Q.id))continue;seen.add(Q.id);out.push(Q);walk(Q.id);}};walk('');for(const Q of L)if(!seen.has(Q.id)){seen.add(Q.id);out.push(Q);}return STORY_L=out;};
  function storyDone(s,id){if(s.quests.done[id])return true;const L=storyList(),i=L.findIndex(Q=>Q.id===id);if(i<0)return false;for(let j=i+1;j<L.length;j++)if(s.quests.done[L[j].id])return true;return false;}
  const condOk=(s,Q)=>{const t=String(Q.target||''),[k,v]=t.split(':');if(k==='hq')return !!(s.flags.hq&&s.flags.hq[v]);if(k==='rescue')return num(s.flags.rescue)>=2;return null;};
  const questReady=(s,Q)=>{const c=condOk(s,Q);return c===null?(s.quests.active[Q.id]||0)>=Q.count:c;};
  function storyAt(s,npcId){for(const Q of storyList()){if(Q.npc!==npcId)continue;const n=s.quests.active[Q.id];if(n!=null)return {Q,state:questReady(s,Q)?'ready':'active'};if(!storyDone(s,Q.id)&&(!Q.req||storyDone(s,Q.req))&&(s.level||1)>=questLevel(Q))return {Q,state:'new'};}return null;}
  function storyNext(s){return storyList().filter(Q=>!storyDone(s,Q.id)&&s.quests.active[Q.id]==null&&(!Q.req||storyDone(s,Q.req))).sort((a,b)=>questLevel(a)-questLevel(b))[0]||null;}
  function questProgress(s,monId){const out=[];for(const id of Object.keys(s.quests.active)){const Q=QUESTS[id];if(Q&&Q.target===monId&&s.quests.active[id]<Q.count){s.quests.active[id]++;out.push(id);}}return out;}
  function questTurnIn(s,id,rng=Math.random){
    const Q=QUESTS[id];if(!Q||s.quests.active[id]==null)throw Error('QUEST');if(!questReady(s,Q))throw Error('QUEST_NOT_DONE');
    let it=null;if(Q.item&&items[Q.item]){if(s.bag.indexOf(null)<0)throw Error('BAG_FULL');let q=Q.itemQ||'n';if(RAR[q]&&RAR[q].tier>dropCap())q='p';it=roll(Q.item,q,rng);addItem(s,it);}
    s.copper+=Q.copper;s.rubies+=Q.rubies;delete s.quests.active[id];s.quests.done[id]=(s.quests.done[id]||0)+1;const up=gainExp(s,Q.exp);return {copper:Q.copper,rubies:Q.rubies,item:it,exp:Q.exp,up};
  }
  // Kinh nghiệm và cấp: điểm cần cho mỗi cấp tăng dần; lên cấp được điểm cộng vào 4 chỉ số
  const maxLevel=()=>Math.max(num(CFG.cap_toi_da,100),...REGIONS.map(r=>r.lv)),petMax=s=>{if(s){const D=derive(s);return D.demon?D.demon.max:0;}return num(CFG.ma_toi_da,2);},PET_CAP=6;
  const expNeed=lv=>Math.round(num(CFG.exp_goc,60)*Math.pow(Math.max(1,lv),num(CFG.exp_tang,150)/100));
  // v10.35: cấp quái = cấp vùng; nhân vật cao hơn quái quá dải cấp của vùng (tới vùng kế) thì kinh nghiệm giảm dần (kieu Mu/Diablo), thấp nhất exp_phat_toi_thieu %
  const monLv=id=>{const M=MON[id];if(!M)return 1;if(M.lv==null){const R=regionOf(id),L=mapLevel(R),sorted=REGIONS.map(r=>mapLevel(r.id)).sort((a,b)=>a-b),nx=sorted.find(x=>x>L);M.lv=L;M.band=Math.max(num(CFG.exp_phat_dai_toi_thieu,10),(nx||L+30)-L);}return M.lv;};
  const expLvK=(lv,id)=>{const L=monLv(id),band=MON[id]?MON[id].band:10,d=lv-L-band;if(d<=0)return 1;return Math.max(num(CFG.exp_phat_toi_thieu,5)/100,1-d*num(CFG.exp_phat_moi_cap,3)/100);};
  // v10.35: thủ theo cấp kiểu Diablo: phần sát thương còn lại = K·cấp kẻ đánh / (thủ + K·cấp kẻ đánh), giảm tối đa thu_giam_toi_da %
  const armorMul=(def,lv)=>{const k=num(CFG.thu_he_so,2)*Math.max(1,num(lv,1)),d=Math.max(0,num(def));return Math.max(1-num(CFG.thu_giam_toi_da,75)/100,k/(d+k));};
  function gainExp(s,n){
    n=Math.max(0,Math.floor(num(n)));let up=0;if(s.level>=maxLevel()){s.exp=0;return 0;}
    s.exp=(s.exp||0)+n;
    while(s.level<maxLevel()&&s.exp>=expNeed(s.level)){s.exp-=expNeed(s.level);s.level++;s.points=(s.points||0)+num(CFG.diem_moi_cap,5);up++;}
    if(s.level>=maxLevel())s.exp=0;
    if(up){const D=derive(s);s.hp=D.tot.hp;s.mana=D.tot.mp;}
    return up;
  }
  // v10.17: lính đi theo nhận cùng lượng kinh nghiệm như chủ; lên cấp được diem_moi_cap điểm, tự chia vào 4 chỉ số theo tỉ lệ chỉ số đang có
  function mercGainExp(m,n){
    n=Math.max(0,Math.floor(num(n)));if(!n)return 0;m.lv=Math.max(1,m.lv||0);if(m.lv>=maxLevel()){m.exp=0;return 0;}
    m.exp=(m.exp||0)+n;let up=0;const K=['strength','agility','vitality','intelligence'];
    while(m.lv<maxLevel()&&m.exp>=expNeed(m.lv)){m.exp-=expNeed(m.lv);m.lv++;up++;
      const P=num(CFG.diem_moi_cap,5),tot=K.reduce((a,k)=>a+Math.max(1,num(m.stats[k])),0),give=K.map(k=>P*Math.max(1,num(m.stats[k]))/tot),fl=give.map(Math.floor);let left=P-fl.reduce((a,b)=>a+b,0);
      const ord=K.map((k,i)=>i).sort((a,b)=>(give[b]-fl[b])-(give[a]-fl[a])||a-b);for(const i of ord){if(left<=0)break;fl[i]++;left--;}K.forEach((k,i)=>m.stats[k]=num(m.stats[k])+fl[i]);}
    if(m.lv>=maxLevel())m.exp=0;return up;
  }
  const STAT_OF={str:'strength',agi:'agility',vit:'vitality',int:'intelligence',cmd:'command'};
  function spendPoints(s,k,n){const key=STAT_OF[k]||k;n=Math.floor(num(n,1));if(![...STAT_KEYS,'command'].includes(key)||!(n>=1))throw Error('STAT');if((s.points||0)<n)throw Error('POINTS');s.points-=n;s.alloc[key]=(s.alloc[key]||0)+n;}
  // Lính đánh thuê
  function makeMerc(o,rng=Math.random){
    const m={mid:'mc-'+rnd36(rng),src:o.src||'npc',tpl:o.tpl||'',from:o.from||'',name:String(o.name||'Lính').slice(0,20),gender:o.gender==='f'?'f':'m',cmd:num(o.cmd,10),lv:Math.max(0,Math.floor(num(o.lv,0))),exp:Math.max(0,Math.floor(num(o.exp,0))),tier:TIERS.includes(o.tier)?o.tier:'n',gen:TUONG[o.gen]?o.gen:'', // v10.14: phẩm cấp, danh tướng
      
      stats:{strength:num(o.stats&&o.stats.strength,10),agility:num(o.stats&&o.stats.agility,10),vitality:num(o.stats&&o.stats.vitality,10),intelligence:num(o.stats&&o.stats.intelligence,10),command:0},equipment:Object.fromEntries(slots.map(k=>[k,null])),hpFrac:1};
    const eq=o.equipment||{};for(const k of slots){const it=cleanItem(eq[k]);if(it)m.equipment[k]=it;}
    // v10.25: danh tướng chiêu mộ trước đây (chỉ số theo cấp nơi chiêu mộ) được nâng lên đủ tuong_diem, giữ tỉ lệ chỉ số
    if(isGen(m)){const K=['strength','agility','vitality','intelligence'],sum=K.reduce((a,k)=>a+num(m.stats[k]),0),want=tuongPts(m.tier)+48;if(sum>0&&sum<want){const r=want/sum;for(const k of K)m.stats[k]=Math.round(num(m.stats[k])*r);}}
    return m;
  }
  function hireNpc(s,id,rng=Math.random,o={},at=Date.now()){
    const T=MERCS[id];if(!T)throw Error('MERC');if(s.mercs.length>=MAX_MERC)throw Error('MERC_FULL');if(T.map&&(s.level||1)<mapLevel(T.map))throw Error('LEVEL');
    // lính thành trì: thuê theo suất chào trong ngày (k, day); ngày lệch quá 1 so với máy chủ thì từ chối
    let off=null;if(T.map){const day=Math.floor(num(o.day,dayOf(at)));if(Math.abs(day-dayOf(at))>1)throw Error('MERC_CU');off=mercOffer(T,Math.max(0,Math.min(2,Math.floor(num(o.k)))),day);}
    const price=off?off.price:T.price;if(s.copper<price)throw Error('MONEY');
    const m=makeMerc({src:'npc',tpl:id,name:T.name,gender:T.gender,cmd:off?off.cmd:T.cmd,stats:off?off.stats:T.stats,lv:off?off.lv:0},rng);
    let hand=0;for(const g of T.gear){const d=items[g];if(!d)continue;const it=roll(g,'n',rng);if(d.slot==='hand'){const sl=d.grip==='two'?'right':hand++?'left':'right';m.equipment[sl]=it;}else if(d.slot!=='mount')m.equipment[d.slot]=it;}
    s.copper-=price;m.on=fitFollow(s,m);s.mercs.push(m);return m;
  }
  function addMerc(s,o){if(s.mercs.length>=MAX_MERC)throw Error('MERC_FULL');const m=makeMerc(o);m.on=fitFollow(s,m);s.mercs.push(m);return m;}
  // Cho lính đi theo / nghỉ. Lính gục phải chờ ở làng, chủ về làng mới dắt đi tiếp được
  function setFollow(s,i,on){
    const m=s.mercs[i];if(!m)throw Error('MERC');
    if(!on){m.on=false;return;}
    if(m.on)return;if(!(m.hpFrac>0))throw Error('MERC_DOWN');if(cmdInfo(s).free<mercCost(m))throw Error('CMD');m.on=true;
  }
  const mercProxy=(s,m)=>({equipment:m.equipment,bag:s.bag,gender:m.gender,stats:m.stats,isMerc:true});
  function mercEquip(s,i,bagIndex,slot){const m=s.mercs[i];if(!m)throw Error('MERC');const P=mercProxy(s,m);equip(P,bagIndex,slot);s.bag=P.bag;}
  function mercUnequip(s,i,slot){const m=s.mercs[i];if(!m)throw Error('MERC');const P=mercProxy(s,m);unequip(P,slot);s.bag=P.bag;}
  function dismissMerc(s,i){const m=s.mercs[i];if(!m)throw Error('MERC');const list=slots.map(k=>m.equipment[k]).filter(Boolean);if(s.bag.filter(x=>!x).length<list.length)throw Error('BAG_FULL');for(const it of list)addItem(s,it);s.mercs.splice(i,1);}
  // Lưu / khôi phục
  function cleanItem(i){
    if(!i||typeof i.uid!=='string')return null;const type=ALIAS[i.type]||i.type;const d=items[type];if(!d)return null;
    const it={uid:i.uid.slice(0,80),type};const lv=Math.floor(num(i.lv));if(lv>0&&canEnhance(it))it.lv=Math.min(MAX_LV,lv);
    if(!d.q&&RAR[i.q]&&i.q!=='n')it.q=i.q;const t=Math.floor(num(i.t));if(t>=20)it.t=Math.min(999,t);
    if(i.add&&typeof i.add==='object'){const a={};for(const [k,v] of Object.entries(i.add))if(ADD[k]&&Number.isFinite(+v))a[k]=Math.max(0,Math.min(999,+v));if(Object.keys(a).length)it.add=a;}
    return it;
  }
  function serialize(s,pos,seen){return {v:VERSION,player:s,pos:{x:pos.x,y:pos.y,...(pos.map?{map:pos.map}:{})},seen:[...seen]};}
  function restorePlayer(p,ch){
    const s=create(ch),n=(v,a,b,f)=>typeof v==='number'&&Number.isFinite(v)?Math.max(a,Math.min(b,v)):f,used=new Set();
    const valid=i=>{const it=cleanItem(i);if(!it||used.has(it.uid))return null;used.add(it.uid);return it;};
    s.level=Math.floor(n(p.level,1,maxLevel(),1));s.exp=Math.floor(n(p.exp,0,expNeed(s.level),0));s.points=Math.floor(n(p.points,0,99999,0));s.passive=n(p.passive,0,100,0);
    for(const k of [...STAT_KEYS,'command'])s.alloc[k]=Math.floor(n(p.alloc&&p.alloc[k],0,99999,0));
    if(Number.isFinite(+p.rs))s.rs=(+p.rs)|0;
    s.copper=Math.floor(n(p.copper,0,Number.MAX_SAFE_INTEGER,0));s.rubies=Math.floor(n(p.rubies,0,Number.MAX_SAFE_INTEGER,0));s.luck=Math.floor(n(p.luck,0,9999,0));
    s.stats.command=Math.floor(n(p.stats&&p.stats.command,0,999,s.stats.command));
    if(p.flags){s.flags.river=!!p.flags.river;s.flags.hunted=!!p.flags.hunted;if(Array.isArray(p.flags.tutGift))s.flags.tutGift=p.flags.tutGift.slice(0,6).map(String);if(p.flags.tutDied)s.flags.tutDied=true;if(p.flags.caveOk)s.flags.caveOk=true;if(num(p.flags.freeRecruit)>0)s.flags.freeRecruit=Math.min(5,Math.floor(num(p.flags.freeRecruit)));if(Number.isFinite(+p.flags.caveDay)&&p.flags.caveDay!=null)s.flags.caveDay=Math.floor(+p.flags.caveDay);if(p.flags.tg&&typeof p.flags.tg==='object'){const g=p.flags.tg,o={d:Math.floor(+g.d||0),n:{}};for(const k of Object.keys(TG))if(g.n&&+g.n[k]>0)o.n[k]=Math.min(99,Math.floor(+g.n[k]));if(g.cur&&TG[g.cur.ev])o.cur={ev:String(g.cur.ev),at:+g.cur.at||0,k:Math.max(0,Math.floor(+g.cur.k||0))};s.flags.tg=o;} /* v10.46: lượt sự kiện thế giới trong ngày, trận đang đánh (v10.51: sửa — trước đây chú thích // làm mất phần khôi phục giếng, số quái đã hạ phía sau) */if(p.flags.wells&&typeof p.flags.wells==='object')for(const [k,v] of Object.entries(p.flags.wells))if(/^gieng-[a-z0-9-]{1,40}$/.test(k)&&Number.isFinite(+v)&&+v>Date.now())s.flags.wells[k]=+v; // v10.73: giếng các vùng có mã chữ (gieng-rung-truc…) trước đây bị lọc mất khi nạp / đồng bộ → vừa rời vùng nước lại đầyfor(const [k,v] of Object.entries(p.flags.kills||{}))if(MON[k])s.flags.kills[k]=Math.floor(n(v,0,1e9,0));
      if(p.flags.hq&&typeof p.flags.hq==='object'){const hq={};for(const k of Object.keys(HQ_MSG))if(p.flags.hq[k])hq[k]=1;if(Object.keys(hq).length)s.flags.hq=hq;}if(num(p.flags.duel)>0)s.flags.duel=Math.min(10,Math.floor(num(p.flags.duel)));if(num(p.flags.rescue)>0)s.flags.rescue=Math.min(2,Math.floor(num(p.flags.rescue)));if(num(p.flags.vit)>0)s.flags.vit=Math.min(3,Math.floor(num(p.flags.vit)));if(num(p.flags.wk)>0)s.flags.wk=Math.min(2,Math.floor(num(p.flags.wk)));if(num(p.flags.but)>0)s.flags.but=1;/* v10.74: đã nhận chùy của Ông Bụt (Rừng Trúc) */if(Number.isFinite(+p.flags.wkDay)&&p.flags.wkDay!=null)s.flags.wkDay=Math.floor(+p.flags.wkDay);/* v10.68: nhiệm vụ ẩn Tôn Ngộ Không — trước đây hai cờ này bị rơi khi nạp lại trạng thái (lưu xong tải lại là nhận vàng tiếp được, Ngộ Không không hiện ở Rừng Trúc) */if(p.flags.xp&&num(p.flags.xp.p)>0&&num(p.flags.xp.u)>0)s.flags.xp={p:Math.min(1000,num(p.flags.xp.p)),u:Math.floor(num(p.flags.xp.u))};}
    const extra=[],eq=Object.fromEntries(slots.map(k=>[k,null]));
    for(const k of slots){const it=valid(p.equipment&&p.equipment[k]);if(!it)continue;const d=items[it.type];const ok=(d.slot==='hand'?(k==='left'||k==='right'):d.slot===k)&&(!d.gender||d.gender===s.gender);if(ok)eq[k]=it;else extra.push(it);}
    if(isTwo(eq.left)){extra.push(eq.left);eq.left=null;}
    if(isTwo(eq.right)&&eq.left){extra.push(eq.left);eq.left=null;}
    if(eq.left&&eq.right&&!pairOk(kind(eq.left),kind(eq.right))){extra.push(eq.left);eq.left=null;}
    s.equipment=eq;
    const srcBag=Array.isArray(p.bag)?p.bag:[];s.bag=Array.from({length:BAG_SIZE},(_,i)=>valid(srcBag[i]));
    const srcSk=Array.isArray(p.skillSlots)?p.skillSlots:[];
    s.skillSlots=Array.from({length:SKILL_SLOTS},(_,i)=>{const it=valid(srcSk[i]);if(it&&items[it.type].slot!=='book'){extra.push(it);return null;}return it;});
    for(let i=SKILL_SLOTS;i<srcSk.length;i++){const it=valid(srcSk[i]);if(it)extra.push(it);} // v10.12: còn 5 ô sách, sách dư về túi
    s.activeBook=Number.isInteger(p.activeBook)&&s.skillSlots[p.activeBook]?p.activeBook:null;
    for(const it of extra){const i=s.bag.indexOf(null);if(i>=0)s.bag[i]=it;}
    for(const k of Object.keys(skills))s.cooldowns[k]=n(p.cooldowns&&p.cooldowns[k],0,Date.now()+skills[k].cooldown,0);
    if(p.quests){for(const [k,v] of Object.entries(p.quests.active||{}))if(QUESTS[k])s.quests.active[k]=Math.floor(n(v,0,999,0));for(const [k,v] of Object.entries(p.quests.done||{}))if(QUESTS[k])s.quests.done[k]=Math.floor(n(v,0,1e6,0));}
    if(Array.isArray(p.mercs))s.mercs=p.mercs.slice(0,MAX_MERC).map(m=>{const x=makeMerc(m);x.mid=typeof m.mid==='string'?m.mid.slice(0,30):x.mid;x.hpFrac=n(m.hpFrac,0,1,1);x.on=!!m.on;return x;});
    if(Number.isInteger(p.activeMerc)&&s.mercs[p.activeMerc])s.mercs[p.activeMerc].on=true; // bản cũ: 1 lính
    s.recruit=cleanRecruit(p.recruit); // v10.14: đơn chiêu mộ đang chờ
    s.avatars=(Array.isArray(p.avatars)?p.avatars:[]).filter(id=>AVATARS[id]).slice(0,60);const av=AVATARS[p.avatar];s.avatar=av&&(!av.gender||av.gender===s.gender)&&(s.avatars.includes(p.avatar)||!(av.price||av.ruby))?p.avatar:'';
    s.cos=newCos();if(p.cos&&typeof p.cos==='object'){for(const k of COS_KINDS){const own=(p.cos.own&&Array.isArray(p.cos.own[k])?p.cos.own[k]:[]).filter(id=>k==='ten'?NAME_FX[id]:items[id]&&items[id].slot==='cos').slice(0,40);s.cos.own[k]=[...new Set(own)];const u=p.cos.use&&typeof p.cos.use[k]==='string'?p.cos.use[k]:'';s.cos.use[k]=s.cos.own[k].includes(u)?u:'';}}
    s.quiz={};if(p.quiz&&typeof p.quiz==='object')for(const [k,v] of Object.entries(p.quiz)){if(!v||typeof v!=='object')continue;s.quiz[k]={done:Math.floor(n(v.done,0,99,0)),fail:Math.floor(n(v.fail,0,99,0)),hunt:v.hunt&&typeof v.hunt==='object'?{mon:String(v.hunt.mon||''),need:Math.floor(n(v.hunt.need,0,999,0)),got:Math.floor(n(v.hunt.got,0,999,0)),...(v.hunt.map?{map:String(v.hunt.map)}:{})}:null,reveal:!!v.reveal};}
    if(Array.isArray(p.pets)){const now=Date.now();s.pets=p.pets.filter(x=>x&&MON[x.type]&&!(MON[x.type].boss>=2)&&typeof x.pid==='string'&&!(num(x.exp)>0&&num(x.exp)<=now)).slice(0,PET_CAP).map(x=>({pid:x.pid.slice(0,30),type:x.type,hpFrac:n(x.hpFrac,0,1,1),...(num(x.exp)>0?{exp:Math.floor(num(x.exp))}:{})}));} // v10.21: quái hết hạn thu phục thì đi mất; trùm vùng thu phục được
    {const mt=s.equipment&&s.equipment.mount;if(mt&&mountCmd(s.equipment)>derive(s).main.cmd){const b=s.bag.indexOf(null);if(b>=0){s.bag[b]=mt;s.equipment.mount=null;}}} // v10.17: thú cưỡi cần nhiều Mệnh lệnh hơn đang có thì cất vào túi
    const D=derive(s);
    // lính vượt quá Mệnh lệnh đang có thì cho nghỉ (theo thứ tự trong danh sách)
    {let left=D.main.cmd-mountCmd(s.equipment);for(const m of s.mercs)if(m.on){if(mercCost(m)<=left)left-=mercCost(m);else m.on=false;}}
    s.hp=n(p.hp,1,D.tot.hp,D.tot.hp);s.mana=n(p.mana,0,D.tot.mp,D.tot.mp);
    return s;
  }
  function restore(save,ch,canStand,npcIds){
    if(!save||!save.player)return {player:create(ch),pos:null,seen:[]};
    const s=restorePlayer(save.player,ch),pos=save.pos;
    // v10.51: số quái đã hạ bị mất từ v10.46 tới v10.50 (lỗi khôi phục) — dựng lại tối thiểu từ nhật ký hạ quái của máy chủ (srv.kills)
    if(save.srv&&save.srv.kills&&typeof save.srv.kills==='object')for(const [k,v] of Object.entries(save.srv.kills))if(MON[k]&&Array.isArray(v)&&v.length&&!(s.flags.kills[k]>0))s.flags.kills[k]=v.length;
    // vùng chưa đủ cấp (sửa dữ liệu, đổi cấu hình): về làng
    return {player:s,pos:pos&&!(typeof pos.map==='string'&&mapLock(s,pos.map))&&canStand&&canStand(pos.x,pos.y)?{x:pos.x,y:pos.y,...(typeof pos.map==='string'?{map:pos.map}:{})}:null,seen:Array.isArray(save.seen)?save.seen.filter(v=>npcIds?npcIds.includes(v):typeof v==='string'&&/^[a-z0-9-]{1,40}$/.test(v)):[]};
  }
  /* ---------- v8: máy chủ quyết định tiền, đồ, gia cường ----------
     merge(S,C): S = trạng thái máy chủ (đồ nào tồn tại, tiền, hồng ngọc, nhiệm vụ),
                 C = trạng thái máy người chơi (chỉ được sắp xếp đồ đang có + máu, mana, giếng…).
     Người chơi không thể tự sinh đồ hay tiền: món nào không có trên máy chủ thì bị bỏ, món mới trên máy chủ tự vào túi. */
  const allItems=s=>[...(s.bag||[]),...Object.values(s.equipment||{}),...(s.skillSlots||[]),...(s.mercs||[]).flatMap(m=>Object.values(m.equipment||{}))].filter(it=>it&&typeof it.uid==='string');
  // Sắp xếp đồ của người chơi lúc ra lệnh (chỉ mã đồ): b túi, e trang bị, s ô sách, m trang bị lính, a sách đang dùng
  function layout(s){const u=x=>x&&x.uid||null,eq=E=>Object.fromEntries(slots.map(k=>[k,u(E&&E[k])]));return {b:(s.bag||[]).map(u),e:eq(s.equipment),s:(s.skillSlots||[]).map(u),m:Object.fromEntries((s.mercs||[]).map(m=>[m.mid,eq(m.equipment)])),a:s.activeBook};}
  function relayout(S,L){
    if(!L||typeof L!=='object')return S;const it=u=>typeof u==='string'?{uid:u}:null,eq=E=>Object.fromEntries(slots.map(k=>[k,it(E&&E[k])]));
    return merge(S,{...S,bag:(Array.isArray(L.b)?L.b:[]).map(it),equipment:eq(L.e),skillSlots:(Array.isArray(L.s)?L.s:[]).map(it),activeBook:L.a,mercs:(S.mercs||[]).map(m=>({...m,equipment:eq(L.m&&L.m[m.mid])}))});
  }
  function merge(S,C){
    const chOf={name:S.name,gender:S.gender,stats:S.stats};
    const soft={hp:C&&C.hp,mana:C&&C.mana,passive:C&&C.passive,cooldowns:C&&C.cooldowns,flags:{...S.flags,river:!!(S.flags&&S.flags.river)||!!(C&&C.flags&&C.flags.river),wells:(C&&C.flags&&C.flags.wells)||(S.flags&&S.flags.wells)||{}}};
    const softOnly=()=>restorePlayer({...S,...soft},chOf);
    if(!C||typeof C!=='object')return restorePlayer(S,chOf);
    const pool=new Map(allItems(S).map(it=>[it.uid,it]));
    const take=x=>{if(!x||typeof x.uid!=='string')return null;const it=pool.get(x.uid);if(!it)return null;pool.delete(x.uid);return it;};
    const cm=new Map((Array.isArray(C.mercs)?C.mercs:[]).filter(m=>m&&typeof m.mid==='string').map(m=>[m.mid,m]));
    const mercs=(S.mercs||[]).map(m=>({...m,equipment:Object.fromEntries(slots.map(k=>[k,null]))}));
    mercs.forEach((m,i)=>{if(!cm.has(m.mid))for(const k of slots)m.equipment[k]=take((S.mercs[i].equipment||{})[k]);});
    mercs.forEach(m=>{const c=cm.get(m.mid);if(!c)return;for(const k of slots)m.equipment[k]=take(c.equipment&&c.equipment[k]);if(Number.isFinite(+c.hpFrac))m.hpFrac=Math.max(0,Math.min(1,+c.hpFrac));m.on=!!c.on;});
    const cp=new Map((Array.isArray(C.pets)?C.pets:[]).filter(x=>x&&typeof x.pid==='string').map(x=>[x.pid,x])),pets=(S.pets||[]).map(x=>{const c=cp.get(x.pid);return c&&Number.isFinite(+c.hpFrac)?{...x,hpFrac:Math.max(0,Math.min(1,+c.hpFrac))}:x;});
    const equipment=Object.fromEntries(slots.map(k=>[k,take(C.equipment&&C.equipment[k])]));
    const skillSlots=Array.from({length:SKILL_SLOTS},(_,i)=>take(Array.isArray(C.skillSlots)?C.skillSlots[i]:null));
    const bag=Array.from({length:BAG_SIZE},(_,i)=>take(Array.isArray(C.bag)?C.bag[i]:null));
    for(const it of pool.values()){const i=bag.indexOf(null);if(i<0)return softOnly();bag[i]=it;}
    const R=restorePlayer({...S,...soft,activeBook:C.activeBook,equipment,skillSlots,bag,mercs,pets},chOf);
    return allItems(R).length===allItems(S).length?R:softOnly();
  }
  // Các lệnh làm thay đổi tiền/đồ, chạy trên máy chủ (và trên trình duyệt ở chế độ ngoại tuyến)
  // số lần hạ một loài quái trong một lượt hồi sinh: bãi quái lớn có nhiều con cùng loài (Sheet cau_hinh gioi_han_ha_quai)
  const KILL_LIMIT=id=>MON[id].boss?1:num(CFG.gioi_han_ha_quai,16);
  const PREDICT=new Set(['kill','buy','sell','enh','enhSk','qa','qt','hire','dismiss','pt','petOff','av','fuse','use','cos','die','quiz','quizHunt','eventWin','recruit','recruitHire','tutGift','cavePass','caveChest','pkWin','hqFlag','duelWin','rescue','rescueHome','vitNhan','vitBan','vitDoi','wkGiu','wkTha','wkHa','butChuy','sg','tgStart','tgKill','tgEnd']);
  // v10.13: khóa chữ ký kết quả Thầy đồ (máy chủ ký bằng khóa bí mật; trình duyệt chỉ áp dụng trước, máy chủ kiểm khi nhận gói lưu)
  const quizKey=(cid,bo,wrong)=>'quiz|'+cid+'|'+bo+'|'+(wrong||[]).join(',');
  // v10.43: xong Tìm con (đã đưa An về làng) → đồ cốt truyện rời túi, cất vào Kỷ vật (flags.kyvat, không chiếm ô túi). Người chơi cũ đã xong được dọn ở lệnh kế tiếp.
  function keepsake(s){if(num(s.flags&&s.flags.rescue)<2||!Array.isArray(s.bag))return;const kv=Array.isArray(s.flags.kyvat)?s.flags.kyvat:[];let n=0;
    s.bag.forEach((it,i)=>{const d=it&&info(it);if(d&&d.slot==='quest'){if(!kv.includes(it.type))kv.push(it.type);s.bag[i]=null;n++;}});if(n||!s.flags.kyvat)s.flags.kyvat=kv;}
  /* ---------- v10.46: Sự kiện thế giới (Tướng quân) — Lôi đài thế giới, Chiến trường phương Bắc, Chiến trường thế giới ----------
     Giờ mở theo giờ Việt Nam, sửa trong Sheet cau_hinh (tg_<sự kiện>_gio, ví dụ "12h00, 20h00"); trước giờ mở tg_dang_ky_phut phút thì vào bản đồ chờ được.
     Mỗi sự kiện tối đa tg_luot_ngay lượt mỗi ngày. Hạ đối thủ: kinh nghiệm = tg_kinh_nghiem_nhan × kinh nghiệm quái thường vùng hợp cấp, có thể rơi đồ, sách.
     Hết trận: vàng theo cấp nhân vật (tg_dong_moi_cap đồng mỗi cấp) × hệ số thứ hạng; thắng Lôi đài nhận thêm một món đồ (phẩm chất theo cấp). */
  const TG={
    loi:{id:'loi',name:'Lôi đài thế giới',short:'Lôi đài',map:'loi-dai-tg',gio:'tg_loi_dai_gio',phut:'tg_loi_dai_phut',gio0:'12h00, 20h00',phut0:5,on:1,
      desc:'Hỗn chiến tự do với các cao thủ cùng cấp. Vòng đài thu hẹp dần, người cuối cùng còn trụ lại (hoặc còn sống khi hết giờ) là người thắng.'},
    bac:{id:'bac',name:'Chiến trường phương Bắc',short:'Phương Bắc',map:'bac-chien-tg',gio:'tg_bac_gio',phut:'tg_bac_phut',gio0:'13h00, 21h00',phut0:10,on:1,team:5,
      desc:'Đội 5 người giữ một đường chéo, chặn các đợt lính mạnh dần và phá nhà chính phe địch.'},
    the:{id:'the',name:'Chiến trường thế giới',short:'Thế giới',map:'the-gioi-tg',gio:'tg_the_gioi_gio',phut:'tg_the_gioi_phut',gio0:'19h00, 22h00',phut0:15,on:1,team:10,
      desc:'10 đấu 10 trên bản đồ ba đường, có lính hai phe. Phá nhà chính đối phương trước là thắng.'}};
  const VN_OFF=7*3600000,tgDay=now=>Math.floor((now+VN_OFF)/86400000);
  // "12h00, 20h00" · "12:00;20:30" · "20" → phút trong ngày
  function tgTimes(id){const E=TG[id];if(!E)return [];const raw=String(CFG[E.gio]!=null&&CFG[E.gio]!==''?CFG[E.gio]:E.gio0),out=[];
    for(const m of raw.matchAll(/(\d{1,2})\s*(?:[:hH.giờ]+\s*(\d{1,2}))?/g)){const h=+m[1],mi=+(m[2]||0);if(h<24&&mi<60)out.push(h*60+mi);}return [...new Set(out)].sort((a,b)=>a-b);}
  const tgDur=id=>Math.max(1,num(CFG[TG[id].phut],TG[id].phut0))*60000,tgReg=()=>Math.max(1,num(CFG.tg_dang_ky_phut,5))*60000;
  // trạng thái một sự kiện lúc now: phase 'reg' (đang cho vào chờ), 'run' (đang đánh), 'wait' (chưa tới giờ); start = giờ mở của suất gần nhất
  function tgState(id,now=Date.now()){
    const E=TG[id],ts=tgTimes(id);if(!E||!ts.length)return {phase:'off'};const d0=tgDay(now)*86400000-VN_OFF,dur=tgDur(id),reg=tgReg();
    const all=[];for(const k of [-1,0,1])for(const m of ts)all.push(d0+k*86400000+m*60000);
    for(const st of all){if(now>=st-reg&&now<st)return {phase:'reg',start:st,end:st+dur};if(now>=st&&now<st+dur)return {phase:'run',start:st,end:st+dur};}
    const next=all.find(st=>st-reg>now);return {phase:'wait',start:next,end:next+dur};
  }
  function tgFlags(s,now){const f=s.flags.tg=s.flags.tg&&typeof s.flags.tg==='object'?s.flags.tg:{};const d=tgDay(now);if(f.d!==d){f.d=d;f.n={};}f.n=f.n||{};return f;}
  const tgLeft=(s,id,now=Date.now())=>{const f=tgFlags(s,now);return Math.max(0,num(CFG.tg_luot_ngay,4)-num(f.n[id]));};
  // quái thường của vùng hợp cấp nhân vật (vùng cao nhất có cấp ≤ cấp nhân vật): dùng tính kinh nghiệm, đồ rơi khi hạ đối thủ
  function tgMon(lv){const R=REGIONS.slice().sort((a,b)=>mapLevel(b.id)-mapLevel(a.id)).find(r=>mapLevel(r.id)<=lv)||REGIONS[0];
    const ids=Object.keys(MON).filter(k=>!MON[k].boss&&!/^_/.test(k)&&MON[k].exp>0&&regionOf(k)===(R?R.id:'thanh-moc'));return ids.sort((a,b)=>num(MON[b].exp)-num(MON[a].exp))[0]||Object.keys(MON).find(k=>!MON[k].boss&&MON[k].exp>0);}
  // phẩm chất phần thưởng theo cấp (thắng Lôi đài, sách rơi): <50 Đẹp · 50–149 Hoàn hảo · 150–249 Huyền thoại · từ 250 có cơ hội Thần
  function tgQuality(lv,rng){const x=rng();if(lv>=250)return x<num(CFG.tg_than_phan_tram,20)/100?'m':'l';if(lv>=150)return x<.05?'m':'l';if(lv>=50)return x<.1?'l':'p';return x<.2?'p':'g';}
  function tgTier(lv){const ls=REGIONS.map(r=>mapLevel(r.id)).filter(x=>x<=lv);const t=ls.length?Math.max(...ls):0;return t>=20?t:0;}
  function tgItem(lv,q,rng,book){
    let pool;if(book)pool=BOOK_IDS();else if(q==='m')pool=Object.keys(items).filter(k=>items[k].myth);else if(q==='l')pool=Object.keys(items).filter(k=>items[k].set);else pool=BASE_DROP();
    if(!pool.length)pool=BASE_DROP();return roll(pool[Math.floor(rng()*pool.length)],q,rng,tgTier(lv));}
  function tgCur(s,id,now){const f=tgFlags(s,now),c=f.cur;if(!c||c.ev!==id||now>c.at+tgDur(id)+180000)throw Error('TG_CHUA_VAO');return c;}
  function tgOp(s,op,srv,now,rng){
    const t=op.t,id=String(op.ev||''),E=TG[id];if(!E||!E.on)throw Error('TG_SU_KIEN');
    if(t==='tgStart'){const st=tgState(id,now+90000),f=tgFlags(s,now);if(!(st.phase==='run'&&Math.abs(now-st.start)<=150000))throw Error('TG_SAI_GIO');
      if(f.cur&&f.cur.ev===id&&f.cur.at===st.start)throw Error('TG_DA_VAO');if(tgLeft(s,id,now)<=0)throw Error('TG_HET_LUOT');
      f.n[id]=num(f.n[id])+1;f.cur={ev:id,at:st.start,k:0};return {ev:id,left:tgLeft(s,id,now)};}
    if(t==='tgKill'){const c=tgCur(s,id,now);if(c.k>=num(CFG['tg_'+(id==='the'?'the_gioi':id)+'_ha_toi_da'],num(CFG.tg_ha_toi_da,60)))throw Error('TG_DU_LUOT_HA');c.k++;
      const M=MON[tgMon(s.level||1)],D=derive(s),F=D.fx||{},exp=Math.min(expNeed(s.level||1),Math.round(killExp(M,num(F.expUp)+xpBuff(s,now))*num(CFG.tg_kinh_nghiem_nhan,3)*(op.m?.5:1))); // như hạ quái: mỗi lần hạ tối đa 1 cấp
      const items_=[],lost=[];const drop=rollDrop(tgMon(s.level||1),rng,(1+num(F.luck)/100)*num(CFG.tg_roi_do_nhan,1));
      if(rng()*1e4<num(CFG.tg_sach_phan_van,80))drop.items.push(tgItem(s.level||1,tgQuality(s.level||1,rng),rng,true));
      for(const it of drop.items){try{addItem(s,it);items_.push(it);}catch(e){lost.push(it);}}
      const up=gainExp(s,exp),mercUp=[];for(const m of s.mercs||[])if(m.on&&m.hpFrac>0){const u=mercGainExp(m,exp);if(u)mercUp.push({name:m.name,lv:m.lv});}
      return {copper:0,rubies:0,items:items_,lost,exp,up,level:s.level,mercUp};}
    if(t==='tgEnd'){const c=tgCur(s,id,now),n=Math.max(1,Math.min(50,Math.floor(num(op.n,1)))),rank=Math.max(1,Math.min(n,Math.floor(num(op.rank,n)))),win=rank===1&&!op.lose,f=tgFlags(s,now);f.cur=null;
      // vàng theo cấp: thắng nhận đủ; Lôi đài bị loại nhận theo thứ hạng; chiến trường thua mà còn sống nhận tg_thua_phan_tram %, gục giữa trận không có vàng
      const base=Math.round((s.level||1)*num(CFG.tg_dong_moi_cap,2000)),k=win?1:op.dead?0:id==='loi'?Math.max(.1,(n-rank)/Math.max(1,n-1))*num(CFG.tg_loai_phan_tram,60)/100:num(CFG.tg_thua_phan_tram,30)/100,copper=Math.round(base*k);s.copper+=copper;
      let item=null,lost=null;if(win&&id==='loi'){try{item=tgItem(s.level||1,tgQuality(s.level||1,rng),rng,false);addItem(s,item);}catch(e){lost=item;item=null;}}
      return {ev:id,rank,n,win,copper,item,lost};}
    throw Error('LENH');
  }
  function applyOp(s,op,srv,now=Date.now(),rng=Math.random){
    const t=op&&op.t;if(PREDICT.has(t))rng=seqRng(s);keepsake(s);
    if(t==='tgStart'||t==='tgKill'||t==='tgEnd')return tgOp(s,op,srv,now,rng);
    if(t==='kill'){
      const M=MON[op.mon];if(!M)throw Error('MON');
      {const R=regionOf(op.mon);if(REGIONS.some(r=>r.id===R)&&(s.level||1)<mapLevel(R))throw Error('LEVEL');} // v10.76: chưa đủ cấp vào vùng thì không thể "hạ" quái vùng đó (chặn gửi lệnh giả)
      srv.kills=srv.kills||{};const win=Math.max(5,M.respawn)*1000,log=(srv.kills[op.mon]||[]).filter(x=>now-x<win);
      if(log.length>=KILL_LIMIT(op.mon))throw Error('NHANH_QUA');log.push(now);srv.kills[op.mon]=log;
      const D=derive(s),F=D.fx||{},copper=killCopper(M,F.coinUp),exp=Math.min(expNeed(s.level||1),Math.round(killExp(M,num(F.expUp)+xpBuff(s,now))*expLvK(s.level||1,op.mon))); // v10.35: phạt chênh cấp, mỗi con tối đa 1 cấp
      s.copper+=copper;s.flags.kills[op.mon]=(s.flags.kills[op.mon]||0)+1;
      const drop=rollDrop(op.mon,rng,1+num(F.luck)/100),items=[],lost=[];s.rubies+=drop.rubies;
      {const bk=M.boss?bossBook(op.mon,rng):null;if(bk)drop.items.push(bk);} // v10.22: sách Huyền thoại, Thần chỉ rơi từ trùm
      for(const it of drop.items){try{addItem(s,it);items.push(it);}catch(e){lost.push(it);}}
      const done=questProgress(s,op.mon).filter(id=>s.quests.active[id]>=QUESTS[id].count);
      // Thầy đồ: việc săn quái lấy manh mối đáp án
      let hunt=null;for(const [bo,z] of Object.entries(s.quiz||{}))if(z.hunt&&!z.reveal&&z.hunt.mon===op.mon&&z.hunt.got<z.hunt.need){z.hunt.got++;if(z.hunt.got>=z.hunt.need)z.reveal=true;hunt={bo,got:z.hunt.got,need:z.hunt.need,reveal:z.reveal};}
      let bonus=0;const k=s.flags.kills;if(!s.flags.hunted&&k.deer&&k.lion&&k.elephant&&k.croc){s.flags.hunted=true;s.copper+=100;bonus=100;}
      const up=gainExp(s,exp);
      const mercUp=[];for(const m of s.mercs||[])if(m.on&&m.hpFrac>0){const u=mercGainExp(m,exp);if(u)mercUp.push({name:m.name,lv:m.lv});}
      // Sách Ma công (v10.21): tỉ lệ thu phục = (gốc + Mệnh lệnh + cấp sách) × độ mạnh sách; số quái tối đa và thu phục trùm theo bậc sách.
      // Trùm vùng: tỉ lệ × ma_boss_bac (0 = không được); trùm thế giới, trùm cuối không thu phục. Thời gian ở lại theo Trí tuệ (tameMin)
      let pet=null;const DM=D.demon;if(DM&&(s.pets=s.pets||[]).filter(x=>!(num(x.exp)>0&&num(x.exp)<=now)).length<DM.max&&!(M.boss>=2)){let ch=(num(CFG.ma_ti_le_goc,2)+D.main.cmd*num(CFG.ma_phan_van_moi_menh_lenh,20)/100+num(CFG.sach_ti_le_cap,1)*DM.lv)*DM.ef;if(M.boss)ch*=DM.boss;
        if(ch>0&&rng()*100<ch){const mins=tameMin(D.main.int,!!M.boss);s.pets=s.pets.filter(x=>!(num(x.exp)>0&&num(x.exp)<=now));pet={pid:'pet-'+rnd36(rng),type:op.mon,hpFrac:1,...(mins>0?{exp:now+mins*60000}:{})};s.pets.push(pet);}}
      return {mon:op.mon,copper,rubies:drop.rubies,items,lost,done,bonus,exp,up,level:s.level,pet,hunt,mercUp};
    }
    if(t==='buy'){const type=String(op.type),d=items[type];
      // v10.12: thẻ avatar, nền hồ sơ, thuốc đa nhiệm mua xong áp dụng ngay (không qua túi đồ)
      if(d&&d.slot==='cos'){if(!d.ruby||!shopRow(type,op.shop?String(op.shop):undefined))throw Error('ITEM');if(POTIONS.includes(d.kind)){if(s.rubies<d.ruby)throw Error('RUBY');const pot=drinkPotion(s,d,now);s.rubies-=d.ruby;return {pot,item:{type}};}if(d.kind==='thuoc'&&!NAME_FX[String(op.fx||'')])throw Error('FX');if(s.rubies<d.ruby)throw Error('RUBY');s.rubies-=d.ruby;const c=wearCos(s,d,type,op.fx);return {cos:c,item:{type}};}
      const i=buy(s,type,RAR[op.q]&&op.q!=='n'?String(op.q):'n',rng,op.shop?String(op.shop):undefined);return {i,item:s.bag[i]};}
    // Diện mạo (NPC Thợ truyền thần ở thành trì): mua rồi đổi; diện mạo giá 0 ai cũng đổi được
    if(t==='av'){const id=String(op.id||'');if(!id){s.avatar='';return {id};}const V=AVATARS[id];if(!V)throw Error('AV');if(V.gender&&V.gender!==s.gender)throw Error('GENDER');s.avatars=s.avatars||[];
      if(!s.avatars.includes(id)&&(V.price||V.ruby)){if(s.copper<V.price)throw Error('MONEY');if(s.rubies<V.ruby)throw Error('RUBY');s.copper-=V.price;s.rubies-=V.ruby;s.avatars.push(id);}
      s.avatar=id;return {id,bought:!!(V.price||V.ruby)};}
    if(t==='sell'){const i=Math.floor(op.i),it=s.bag[i];const v=sell(s,i);return {v,item:it};}
    // Mỹ phẩm: dùng thẻ / khung / nền / thuốc trong túi → vào bộ sưu tập và mặc luôn (thuốc đa nhiệm: chọn hiệu ứng tên op.fx)
    if(t==='use'){const i=Math.floor(op.i),it=s.bag[i],d=info(it);if(!it||!d||d.slot!=='cos')throw Error('ITEM');const c=wearCos(s,d,it.type,op.fx);s.bag[i]=null;return c;}
    if(t==='cos'){const kind=String(op.kind||''),id=String(op.id||'');if(!COS_KINDS.includes(kind))throw Error('ITEM');s.cos=s.cos||newCos();if(id&&!s.cos.own[kind].includes(id))throw Error('KHONG_CO');s.cos.use[kind]=id;return {kind,id};}
    // Gục ngã: mất toàn bộ đồ đang mặc (cau_hinh chet_mat_do); cấp, sách, lính, thú, túi giữ nguyên
    if(t==='eventWin'){const ev=String(op.ev||''),E=EVENTS[ev];if(!E)throw Error('EVENT');srv.evAt=srv.evAt||{};const gap=num(CFG.su_kien_phut,5)*60000;if(now-(srv.evAt[ev]||0)<gap*.8)throw Error('EVENT_CU');srv.evAt[ev]=now;
      const luck=E.luck[0]+Math.floor(rng()*(E.luck[1]-E.luck[0]+1));s.luck=Math.floor(num(s.luck))+luck;s.copper+=E.copper;s.rubies+=E.rubies||0;return {luck,copper:E.copper,rubies:E.rubies||0,total:s.luck};}
    if(t==='die'){const lost=[];if(num(CFG.chet_mat_do,1)||op.tut){for(const k of slots){if(s.equipment[k]){lost.push(s.equipment[k]);s.equipment[k]=null;}}}
      // v10.28: gục trong hướng dẫn tân thủ (Ngư Tinh) — mất cả quần áo trong túi (bộ Lý trưởng tặng, đồ khởi đầu), chỉ còn mảnh vải che thân
      if(op.tut&&Array.isArray(s.flags.tutGift)&&!s.flags.tutDied){s.flags.tutDied=true;const g=new Set(s.flags.tutGift),wear=new Set(['hat','armor','pants','gloves','shoes','wings']);s.bag.forEach((it,i)=>{const d=it&&items[it.type];if(it&&(g.has(it.uid)||(d&&wear.has(d.slot)&&!d.set&&!d.ruby))){lost.push(it);s.bag[i]=null;}});}
      return {lost};}
    // v10.29: Hang Cướp — đọc đúng mật khẩu thì toán cướp tan; rương báu 1 hồng ngọc mỗi ngày (theo giờ Việt Nam)
    if(t==='cavePass'){s.flags.caveOk=true;return {};}
    if(t==='caveChest'){if(!s.flags.caveOk)throw Error('CHUA_MO');const day=Math.floor((now+7*3600000)/86400000);if(s.flags.caveDay===day)throw Error('TRONG_RONG');s.flags.caveDay=day;const n=Math.max(0,Math.floor(num(CFG.hang_cuop_hong_ngoc,1)));s.rubies+=n;return {rubies:n,day};}
    // v10.28: hướng dẫn tân thủ — Lý trưởng tặng một bộ quần áo (một lần)
    if(t==='tutGift'){if(s.flags.tutGift)throw Error('DA_NHAN');const ids=['hat','armor','pants','shoes'].filter(id=>items[id]);if(s.bag.filter(x=>!x).length<ids.length)throw Error('BAG_FULL');
      const got=ids.map(id=>{const it=roll(id,'n',rng);addItem(s,it);return it;});s.flags.tutGift=got.map(it=>it.uid);return {items:got};}
    // Thầy đồ: trả lời bộ câu hỏi (máy chủ chấm); sai quá thì giao việc săn quái; săn xong được chỉ đáp án, trả lời lại nhận thưởng giảm
    if(t==='quizShow'){const bo=String(op.bo||''),Q=QUIZ[bo],z=s.quiz&&s.quiz[bo];if(!Q)throw Error('QUIZ');if(!(z&&z.reveal))throw Error('QUIZ_CHUA');return {show:Q.qs.map(q=>q.ans)};}
    if(t==='quiz'||t==='quizHunt'){const bo=String(op.bo||''),Q=QUIZ[bo];if(!Q||!Q.qs.length)throw Error('QUIZ');s.quiz=s.quiz||{};const z=s.quiz[bo]=s.quiz[bo]||{done:0,fail:0,hunt:null,reveal:false};if(z.done)throw Error('QUIZ_XONG');
      // v10.53: chọn bài bất kỳ, không cần xong bài trước; kinh nghiệm theo số bài đã xong (bài thứ n xong được quiz_kinh_nghiem × n)
      const doneN=Object.values(s.quiz).filter(x=>x&&x.done).length;
      const startHunt=()=>{if(!z.hunt){let mon=Q.mon&&MON[Q.mon]?Q.mon:'',map=Q.map||'';
        // bài chưa gắn quái (bài theo chủ đề) hoặc quái ở vùng nhân vật chưa tới được: săn quái của vùng cao nhất mà nhân vật đã vào được, trong các vùng có bài gắn quái
        if(!mon||(map&&mapLevel(map)>(s.level||1))){mon='';const c=Object.values(QUIZ).filter(x=>x.mon&&MON[x.mon]&&x.map).sort((a,b)=>mapLevel(a.map)-mapLevel(b.map));const ok=c.filter(x=>mapLevel(x.map)<=(s.level||1));const pick=ok.length?ok[ok.length-1]:c[0];if(pick){mon=pick.mon;map=pick.map;}}
        if(!mon)throw Error('QUIZ_QUAI');z.hunt={mon,need:Q.need||num(CFG.quiz_san_so_luong,8),got:0,...(map?{map}:{})};}return {hunt:z.hunt,reveal:z.reveal};};
      if(t==='quizHunt')return startHunt();
      // v10.13: op mang sẵn câu sai + chữ ký của quizCheck (ans cũ vẫn chấm được khi không có chữ ký và đang ở máy chủ)
      let wrong,ok;if(Array.isArray(op.wrong)){wrong=op.wrong.map(i=>Math.floor(i)).filter(i=>i>=0&&i<Q.qs.length);if(API._sign&&API._sign(quizKey(API._sid,bo,wrong))!==String(op.sig||''))throw Error('QUIZ_SIG');ok=Q.qs.length-wrong.length;}
      else{const ans=Array.isArray(op.ans)?op.ans.map(x=>String(x||'').toUpperCase()):[];ok=0;wrong=[];Q.qs.forEach((q,i)=>{if(ans[i]===q.ans)ok++;else wrong.push(i);});}
      const pass=wrong.length<=quizMaxWrong(Q);
      if(!pass){z.fail++;const r={ok,total:Q.qs.length,wrong,pass:false,fail:z.fail};if(z.fail>=num(CFG.quiz_lan_thu,2)&&!z.hunt){startHunt();r.hunt=z.hunt;}return r;}
      const k=z.reveal?num(CFG.quiz_thuong_lo,50)/100:1,rubies=Math.round(Q.rubies*k),exp=Math.round(num(CFG.quiz_kinh_nghiem,300)*(doneN+1)*k);
      s.rubies+=rubies;const up=gainExp(s,exp);z.done=1;z.hunt=null;return {ok,total:Q.qs.length,wrong,pass:true,rubies,exp,up,late:z.reveal};}
    if(t==='fuse'){const mi=Math.floor(op.m),xi=Math.floor(op.x);if(!(mi>=0&&mi<BAG_SIZE&&xi>=0&&xi<BAG_SIZE))throw Error('SLOT');return fuse(s,mi,xi,rng,op.luck);}
    if(t==='enh'){const bag=op.where==='bag',key=bag?Math.floor(op.key):String(op.key);if(!bag&&!slots.includes(key))throw Error('SLOT');const r=enhance(s,{where:bag?'bag':'equipment',key},rng,op.shop,op.luck);return {...r,item:bag?s.bag[key]:s.equipment[key]};}
    if(t==='enhSk'){const key=Math.floor(op.key);if(!(key>=0&&key<SKILL_SLOTS))throw Error('SLOT');const r=enhance(s,{where:'skill',key},rng,op.shop||'wizard',op.luck);return {...r,item:s.skillSlots[key]};}
    if(t==='qa'){questAccept(s,String(op.id));return {};}
    if(t==='qt'){return questTurnIn(s,String(op.id),rng);}
    // v10.39: xong trò nhỏ của việc Tìm con (đố, lật thẻ, tìm vật…) — trò chạy ở máy người chơi, thua chơi lại không giới hạn
    if(t==='sg'){const id=String(op.id),Q=QUESTS[id];if(!Q||!Q.story||s.quests.active[id]==null||!/^game:/.test(String(Q.target)))throw Error('QUEST');s.quests.active[id]=Q.count;return {id};}
    if(t==='hire'){const m=hireNpc(s,String(op.id),rng,{k:op.k,day:op.day},now);return {mid:m.mid,name:m.name,lv:m.lv};}
    if(t==='petOff'){const i=(s.pets||[]).findIndex(x=>x.pid===op.pid);if(i<0)throw Error('PET');const x=s.pets.splice(i,1)[0];return {type:x.type};}
    if(t==='pt'){spendPoints(s,String(op.k),op.n);return {k:op.k,points:s.points};}
    if(t==='dismiss'){const i=Math.floor(op.i),m=s.mercs[i];dismissMerc(s,i);return {name:m?m.name:''};}
    // v10.14: đơn chiêu mộ — gửi (tốn hồng ngọc, rút phẩm cấp), nhận lính đang chào, hoặc bỏ qua
    if(t==='recruit'){return {offer:recruit(s,op.map,rng,now,op.luck,!!op.free),rubies:s.rubies,luck:s.luck,free:num(s.flags.freeRecruit)};}
    // v10.31: thắng người chơi ảo đánh lén ở Hang động → 1 lượt chiêu mộ miễn phí ở Thanh Mộc (cách nhau ít nhất 60 giây, giữ tối đa 5 lượt)
    // v10.34: nhiệm vụ ẩn 10 vùng 400–999 — đoạt cờ (Cổ Chiến Trường), võ đài 10 danh tướng (Võ Đài Thập Tướng), cứu con gái (Hỗn Nguyên Điện) rồi đưa về làng
    if(t==='hqFlag'){if((s.level||1)<mapLevel('chien-truong'))throw Error('LEVEL');s.flags.hq=s.flags.hq||{};if(s.flags.hq['chien-truong'])throw Error('DA_XONG');s.flags.hq['chien-truong']=1;const ru=Math.max(0,Math.floor(num(CFG.an_co_hong_ngoc,30)));s.rubies+=ru;return {rubies:ru};}
    if(t==='duelWin'){if((s.level||1)<mapLevel('vo-dai'))throw Error('LEVEL');const cur=Math.min(10,Math.floor(num(s.flags.duel))),k=Math.floor(num(op.n));if(k!==cur+1||k>10)throw Error('SAI_TRAN');srv.duelAt=num(srv.duelAt);if(now-srv.duelAt<8000)throw Error('NHANH_QUA');srv.duelAt=now;
      s.flags.duel=k;const ru=Math.max(0,Math.floor(num(CFG.vo_dai_hong_ngoc,5)))*k;s.rubies+=ru;if(k===10){s.flags.hq=s.flags.hq||{};s.flags.hq['vo-dai']=1;}return {duel:k,rubies:ru};}
    if(t==='rescue'){if(!(num(s.flags.kills&&s.flags.kills['hon-nguyen-ma-to'])>0))throw Error('CHUA_HA_TRUM');if(num(s.flags.rescue)>=1)throw Error('DA_CUU');s.flags.rescue=1;return {rescue:1};}
    // v10.50: nhiệm vụ ẩn Vịt con — hạ Đại Bàng Tinh, trứng trong tổ (Hang động) nở ra vịt con đi theo (vit=1, chỉ một lần trong đời nhân vật);
    //   Thợ săn Núi tuyết đổi lấy vit_vang vàng (vit=2) hoặc Nghệ nhân đèn Thăng Long đổi lấy Hổ trắng Tây Bắc cấp vit_thu_cap (vit=3)
    if(t==='vitNhan'){if(!(num(s.flags.kills&&s.flags.kills['dai-bang'])>0)&&!(srv&&srv.kills&&Array.isArray(srv.kills['dai-bang'])&&srv.kills['dai-bang'].length))throw Error('CHUA_HA_TRUM');if(num(s.flags.vit)>=1)throw Error('DA_NHAN');s.flags.vit=1;return {vit:1};}
    if(t==='vitBan'){if(num(s.flags.vit)!==1)throw Error('KHONG_CO_VIT');if((s.level||1)<mapLevel('nui-tuyet'))throw Error('LEVEL');const c=Math.max(0,Math.round(num(CFG.vit_vang,30)*10000));s.copper+=c;s.flags.vit=2;return {vit:2,copper:c};}
    if(t==='vitDoi'){if(num(s.flags.vit)!==1)throw Error('KHONG_CO_VIT');if((s.level||1)<mapLevel('thang-long'))throw Error('LEVEL');if(!items['ho-trang-vit'])throw Error('ITEM');const i=addItem(s,roll('ho-trang-vit','n',rng));s.flags.vit=3;return {vit:3,i,item:s.bag[i]};}
    // v10.65: nhiệm vụ ẩn Tôn Ngộ Không (Núi tuyết ô 12,28) — flags.wk: 0 còn bị đè · 1 đã thả (thành trùm phụ ở Rừng Trúc) · 2 đã hạ
    //   wkGiu: không thả, mỗi ngày nhận ngo_khong_vang vàng · wkTha: bóc bùa thả ra · wkHa: hạ Tôn Ngộ Không ở Rừng Trúc, nhận ngo_khong_hong_ngoc hồng ngọc (một lần)
    if(t==='wkGiu'){if(num(s.flags.wk))throw Error('DA_THA');if((s.level||1)<mapLevel('nui-tuyet'))throw Error('LEVEL');const day=dayOf(now);if(num(s.flags.wkDay)===day)throw Error('DA_NHAN');s.flags.wkDay=day;const c=Math.max(0,Math.round(num(CFG.ngo_khong_vang,1)*10000));s.copper+=c;return {copper:c};}
    if(t==='wkTha'){if(num(s.flags.wk))throw Error('DA_THA');if((s.level||1)<mapLevel('nui-tuyet'))throw Error('LEVEL');s.flags.wk=1;return {wk:1};}
    // v10.74: Ông Bụt giữa hồ Rừng Trúc — nói thật ba lần thì được tặng Chùy sắt Hoàn hảo (một lần duy nhất)
    if(t==='butChuy'){if(num(s.flags.but)>=1)throw Error('DA_NHAN');if((s.level||1)<mapLevel('rung-truc'))throw Error('LEVEL');if(!items['mace-iron'])throw Error('ITEM');if(!s.bag.includes(null))throw Error('BAG_FULL');const it=roll('mace-iron','p',rng);addItem(s,it);s.flags.but=1;return {but:1,item:it};}
    // v10.77: hạ Tôn Ngộ Không còn được thêm một món đồ Hoàn hảo ngẫu nhiên (vũ khí / giáp thường, bậc theo vùng Rừng Trúc). Túi đầy thì chưa tính là hạ — dọn túi rồi quay lại đánh lại
    if(t==='wkHa'){if(num(s.flags.wk)!==1)throw Error('CHUA_THA');if(!s.bag.includes(null))throw Error('BAG_FULL');
      const pool=BASE_DROP(),lvl=regionLv('rung-truc'),it=pool.length?roll(pool[Math.floor(rng()*pool.length)],'p',rng,lvl>=20?lvl:0):null;if(it)addItem(s,it);
      s.flags.wk=2;const ru=Math.max(0,Math.floor(num(CFG.ngo_khong_hong_ngoc,1)));s.rubies+=ru;return {wk:2,rubies:ru,item:it};}
    if(t==='rescueHome'){if(num(s.flags.rescue)!==1)throw Error('CHUA_CUU');s.flags.rescue=2;keepsake(s);const ru=Math.max(0,Math.floor(num(CFG.cuu_con_hong_ngoc,999)));s.rubies+=ru;return {rescue:2,rubies:ru};}
    if(t==='pkWin'){srv.pkAt=num(srv.pkAt);if(now-srv.pkAt<60000)throw Error('NHANH_QUA');srv.pkAt=now;s.flags.freeRecruit=Math.min(5,num(s.flags.freeRecruit)+1);return {free:s.flags.freeRecruit};}
    if(t==='recruitHire'){const m=recruitHire(s,rng);return {mid:m.mid,name:m.name,lv:m.lv,tier:m.tier};}
    if(t==='recruitDrop'){s.recruit=null;return {};}
    throw Error('LENH');
  }
  // v10.53: số câu sai tối đa theo độ dài bài (quiz_sai_toi_da cho mỗi 5 câu: bài 10 câu sai tối đa 2)
  function quizMaxWrong(Q){const b=num(CFG.quiz_sai_toi_da,1);return Math.max(b,Math.round(b*((Q&&Q.qs&&Q.qs.length)||5)/5));}
  load(typeof GAME_DATA!=='undefined'?GAME_DATA:{});
  const API={VERSION,BAG_SIZE,SKILL_SLOTS,MAX_LV,MAX_MERC,TIERS,TIER_NAME,tierMul,killCopper,killExp,mercDefMul,petDmgMul,mountPow,mercCost,mercPow,mercGainExp,TUONG,recruitRoll,MAX_ACTIVE_QUEST,ELEMENTS,BEASTS,GROUPS,FX_NAMES,STAT_KEYS,CFG,RAR,ADD,SHOPS,SETS,MON,QUESTS,MERCS,AVATARS,TOPUPS,QUIZ,quizMaxWrong,NAME_FX,items,slots,skills,shopEnh,shopRow,fuse,mercDaily,mercOffers,dayOf,EVENTS,TG,tgState,tgTimes,tgLeft,tgDur,tgReg,tgMon,
    layout,relayout,load,info,kind,weapon,skillCost,cmdInfo,WEAPONS,PREDICT,seqRng,setFollow,fitFollow,mercCmd,mercGuard,isGen,petMax,PET_CAP,mountNeed,tameMin,bookFx,bookBac,demonOf,shopRuby,SHOP_ENH,expNeed,maxLevel,gainExp,xpBuff,spendPoints,mountGain,bookStat,mountCmd,qOf,rar,nameOf,stat,canEnhance,tradeable,gainOf,enhRate,enhCost,enhance,roll,rollDrop,create,derive,targets,equip,unequip,stance,isTwo,pairOk,setSkill,unsetSkill,toggleBook,element,money,shopPrice,buy,sell,sellPrice,addItem,cast,
    aimAcc,isRanged,REGIONS,MON_REGION,SKILLS,mapLevel,mapLock,monLv,expLvK,armorMul,tierBase,tierAdd,regionLv,regionOf,questLevel,storyAt,storyNext,storyDone,questReady,quizKey,questAccept,questProgress,questTurnIn,hireNpc,addMerc,mercEquip,mercUnequip,dismissMerc,makeMerc,cleanItem,serialize,restore,restorePlayer,merge,applyOp,allItems};
  return API;
})();
