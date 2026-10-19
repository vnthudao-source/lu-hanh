/* ================= LÕI MÁY CHỦ (dùng chung cho Apps Script và chế độ ngoại tuyến) =================
   adapter cần có: rows(bang) · find(bang,cot,giaTri) · where(bang,cot,giaTri) (tùy chọn: chỉ đọc đúng dòng cần, không đọc cả bảng) · insert(bang,obj) · update(bang,obj) · mail(to,tieuDe,noiDung) · hash(chuoi) · now() · uid() · staticData() · lock(fn) · rules() (nạp luật chơi)
   Bảng: tai_khoan · nhan_vat · cho
   v8: máy chủ giữ tiền, hồng ngọc, đồ của từng nhân vật. Trình duyệt chỉ gửi: sắp xếp đồ, máu/mana, vị trí và các lệnh (hạ quái, mua, bán, gia cường, nhiệm vụ, thuê lính). */
function LH_Core(A){
  const TOKEN_DAYS=30,RESET_MIN=15;
  const fail=e=>{throw Error(e);};
  const lower=s=>String(s||'').trim().toLowerCase();
  const cfg=k=>{const r=(A.staticData().cau_hinh||[]).find(x=>x.khoa===k);return r?Number(r.gia_tri):null;};
  const pub=a=>({id:a.id,username:a.username,email:a.email});
  // Tìm dòng theo một cột: máy chủ thật chỉ đọc đúng các dòng khớp (nhanh khi bảng lớn), máy giả thì lọc cả bảng
  const find=(t,k,v)=>{v=String(v==null?'':v);if(!v)return null;return (A.find?A.find(t,k,v):A.rows(t).find(x=>String(x[k])===v))||null;};
  const where=(t,k,v)=>{v=String(v==null?'':v);if(!v)return [];return A.where?A.where(t,k,v):A.rows(t).filter(x=>String(x[k])===v);};
  function auth(token){
    const a=token?find('tai_khoan','token',token):null;
    // Mỗi tài khoản chỉ một thiết bị: đăng nhập nơi khác thì phiên cũ bị đẩy ra
    if(!a){if(token&&find('tai_khoan','token_cu',token))fail('DANG_NHAP_NOI_KHAC');fail('PHIEN_HET_HAN');}
    if(Number(a.token_het_han)<A.now())fail('PHIEN_HET_HAN');
    return a;
  }
  function ownChar(a,id,status){
    const c=find('nhan_vat','id',id);
    if(!c||c.tai_khoan!==a.id)fail('KHONG_THAY_NHAN_VAT');
    if(status&&c.trang_thai!==status)fail('SAI_TRANG_THAI');
    return c;
  }
  const charView=c=>({id:c.id,name:c.ten,gender:c.gioi_tinh,stats:{strength:+c.suc_manh,agility:+c.nhanh_nhen,vitality:+c.suc_khoe,intelligence:+c.tri_tue},status:c.trang_thai,level:+c.cap||1,price:+c.gia_danh_thue||0,ruby:+c.gia_hong_ngoc||0,created:+c.tao_luc});
  function newToken(a){a.token_cu=a.token&&Number(a.token_het_han)>A.now()?a.token:'';a.token=A.uid()+A.uid();a.token_het_han=A.now()+TOKEN_DAYS*864e5;A.update('tai_khoan',a);return a.token;}
  // Trạng thái nhân vật lưu trên máy chủ (cột luu): {v, player, pos, seen, srv}
  function stateOf(c){
    A.rules&&A.rules();
    let save=null;try{save=c.luu?JSON.parse(c.luu):null;}catch(e){}save=save||{};
    const ch=charView(c);
    return {save,player:save.player?Player.restore(save,ch,()=>true,null).player:Player.create(ch)};
  }
  function storeState(c,st,player,soft){
    soft=soft||{};
    const okPos=v=>v&&Number.isFinite(+v.x)&&Number.isFinite(+v.y)?{x:+v.x,y:+v.y,...(typeof v.map==='string'&&/^[a-z0-9-]{1,40}$/.test(v.map)?{map:v.map}:{})}:null;
    const save={v:Player.VERSION,player,pos:soft.pos!==undefined?okPos(soft.pos):(st.save.pos||null),seen:Array.isArray(soft.seen)?soft.seen.slice(0,60).map(String):(st.save.seen||[]),srv:st.save.srv||{}};
    const j=JSON.stringify(save);if(j.length>45000)fail('DU_LIEU_QUA_LON');
    c.luu=j;c.cap=player.level;c.kinh_nghiem=player.exp;c.cap_nhat=A.now();A.update('nhan_vat',c);st.save=save;
  }
  // Dáng vẻ nhân vật (cho căn lều chọn nhân vật và chợ cho thuê): cấp, đồ đang mặc, hào quang sách, số lính, chỉ số
  function lookOf(c){
    try{const p=stateOf(c).player,D=Player.derive(p),ab=p.activeBook!=null?p.skillSlots[p.activeBook]:p.skillSlots.find(Boolean);
      return {level:p.level,equipment:p.equipment,el:ab&&Player.info(ab)?Player.info(ab).element:null,mercs:p.mercs.length,pets:(p.pets||[]).length,main:D.main,dmg:[D.tot.dmgMin,D.tot.dmgMax],hp:D.tot.hp,def:D.tot.def};}catch(e){return null;}
  }
  const claimSum=acc=>pendingClaims(acc).reduce((s,r)=>({copper:s.copper+Number(r.tien_nhan||0),ruby:s.ruby+Number(r.hong_ngoc_nhan||0)}),{copper:0,ruby:0});
  function pendingClaims(acc){return where('cho','nguoi_ban',acc).filter(r=>r.trang_thai==='da_ban'&&String(r.da_nhan)!=='1');}
  // v10.21: rương chung của tài khoản (cột ruong ở bảng tai_khoan): {items:[đồ], copper, rubies}. Mọi nhân vật của tài khoản gửi / lấy ở Người giữ rương
  const chestOf=a=>{let c=null;try{c=a.ruong?JSON.parse(a.ruong):null;}catch(e){}c=c&&typeof c==='object'?c:{};
    return {items:(Array.isArray(c.items)?c.items:[]).map(x=>Player.cleanItem(x)).filter(Boolean),copper:Math.max(0,Math.floor(+c.copper||0)),rubies:Math.max(0,Math.floor(+c.rubies||0))};};
  const chestSize=()=>cfg('ruong_so_o')||60;
  const chestView=c=>({items:c.items,copper:c.copper,rubies:c.rubies,size:chestSize()});
  function chestMove(p,dir){
    const a0=auth(p.token);A.rules&&A.rules();
    return A.lock(()=>{
      const a=find('tai_khoan','id',a0.id)||a0,c=ownChar(a,p.charId,'active'),st=stateOf(c),P=st.player,ch=chestOf(a);
      const copper=Math.max(0,Math.floor(Number(p.copper)||0)),rubies=Math.max(0,Math.floor(Number(p.rubies)||0)),uid=p.uid?String(p.uid):'';
      if(!uid&&!copper&&!rubies)fail('RUONG_TRONG');let item=null;
      if(dir==='put'){
        if(uid){const i=P.bag.findIndex(x=>x&&x.uid===uid),it=P.bag[i],d=it&&Player.info(it);if(!d)fail('VAT_PHAM_SAI');if(d.slot==='quest')fail('KHONG_GUI_DUOC');if(ch.items.length>=chestSize())fail('RUONG_DAY');P.bag[i]=null;ch.items.push(it);item=it;}
        if(copper>P.copper)fail('KHONG_DU_TIEN');if(rubies>P.rubies)fail('KHONG_DU_HONG_NGOC');P.copper-=copper;P.rubies-=rubies;ch.copper+=copper;ch.rubies+=rubies;
      }else{
        if(uid){const i=ch.items.findIndex(x=>x.uid===uid);if(i<0)fail('VAT_PHAM_SAI');item=ch.items[i];Player.addItem(P,item);ch.items.splice(i,1);}
        if(copper>ch.copper)fail('RUONG_KHONG_DU_TIEN');if(rubies>ch.rubies)fail('RUONG_KHONG_DU_HONG_NGOC');ch.copper-=copper;ch.rubies-=rubies;P.copper+=copper;P.rubies+=rubies;
      }
      const j=JSON.stringify(ch);if(j.length>45000)fail('RUONG_DAY');
      storeState(c,st,P);a.ruong=j;A.update('tai_khoan',a);
      return {chest:chestView(ch),state:P,item};
    });
  }
  const H={
    ping:()=>({msg:'Lữ Hành API'}),
    // v10.37: bảng xếp hạng cho trang chủ (không cần đăng nhập): top 100 cấp độ, top 100 vàng, top 100 hồng ngọc.
    // Chỉ tính nhân vật đang chơi; tên trong cau_hinh.bxh_an (cách nhau dấu phẩy) bị ẩn, ví dụ nhân vật thử của quản trị. Vàng = đồng / 10 000. Code.gs giữ kết quả 10 phút.
    rank(){
      const r=(A.staticData().cau_hinh||[]).find(x=>x.khoa==='bxh_an'),hide=new Set(String(r&&r.gia_tri||'').split(',').map(x=>lower(x)).filter(Boolean));
      const all=[];
      for(const c of A.rows('nhan_vat')){
        if(c.trang_thai!=='active'&&c.trang_thai!=='merc')continue;if(hide.has(lower(c.ten)))continue;
        let P={};try{P=(JSON.parse(c.luu||'{}').player)||{};}catch(e){}
        const lv=Math.floor(Number(c.cap)||Number(P.level)||1),copper=Math.max(0,Math.floor(Number(P.copper)||0)),ruby=Math.max(0,Math.floor(Number(P.rubies)||0));
        all.push({ten:String(c.ten||''),gt:c.gioi_tinh==='f'?'f':'m',cap:lv,kn:Number(c.kinh_nghiem)||0,vang:Math.floor(copper/10000),dong:copper,hn:ruby});
      }
      const top=(f)=>all.slice().sort(f).slice(0,100).map(x=>({ten:x.ten,gt:x.gt,cap:x.cap,vang:x.vang,hn:x.hn}));
      return {at:A.now(),total:all.length,
        level:top((a,b)=>b.cap-a.cap||b.kn-a.kn||a.ten.localeCompare(b.ten)),
        gold:top((a,b)=>b.dong-a.dong||b.hn-a.hn),
        ruby:top((a,b)=>b.hn-a.hn||b.dong-a.dong)};
    },
    chest(p){const a=auth(p.token);A.rules&&A.rules();return {chest:chestView(chestOf(a))};},
    chestPut(p){return chestMove(p,'put');},
    chestTake(p){return chestMove(p,'take');},
    // kiểm tra phiên còn giữ (game gọi định kỳ): bị đăng nhập nơi khác thì báo DANG_NHAP_NOI_KHAC
    alive(p){auth(p.token);return {};},
    // Dữ liệu tĩnh: kèm mã h (băm nội dung) để trình duyệt lưu đệm; gửi lại cùng h thì chỉ trả same:true (đỡ tải ~120 KB mỗi lần vào game)
    data:p=>{const d=A.staticData(),h=String(d._h||'');if(h&&p&&p.h===h)return {same:true,h};return {data:A.hideAnswers?A.hideAnswers(d):d,h};},
    register(p){
      const username=lower(p.username),email=lower(p.email),pw=String(p.password||'');
      if(!/^[a-z0-9_]{3,20}$/.test(username))fail('TEN_DANG_NHAP_SAI');
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))fail('EMAIL_SAI');
      if(pw.length<6)fail('MAT_KHAU_NGAN');
      return A.lock(()=>{
        if(find('tai_khoan','username',username))fail('TEN_DANG_NHAP_DA_CO');
        if(find('tai_khoan','email',email))fail('EMAIL_DA_CO');
        const salt=A.uid(),a={id:'tk-'+A.uid(),username,email,muoi:salt,mat_khau:A.hash(salt+pw),tao_luc:A.now(),token:'',token_het_han:0,ma_khoi_phuc:'',ma_het_han:0};
        A.insert('tai_khoan',a);
        return {token:newToken(a),account:pub(a)};
      });
    },
    login(p){
      const key=lower(p.username),pw=String(p.password||'');
      const a=find('tai_khoan','username',key)||find('tai_khoan','email',key);
      if(!a||A.hash(a.muoi+pw)!==a.mat_khau)fail('SAI_DANG_NHAP');
      return {token:newToken(a),account:pub(a)};
    },
    logout(p){const a=auth(p.token);a.token='';a.token_cu='';a.token_het_han=0;A.update('tai_khoan',a);return {};},
    forgot(p){
      const email=lower(p.email),a=find('tai_khoan','email',email);
      if(!a)fail('KHONG_THAY_EMAIL');
      const code=String(100000+Math.floor(Math.random()*900000));
      a.ma_khoi_phuc=code;a.ma_het_han=A.now()+RESET_MIN*6e4;A.update('tai_khoan',a);
      A.mail(a.email,'Lữ Hành · Khôi phục tài khoản',`Tên đăng nhập của bạn: ${a.username}\nMã khôi phục: ${code}\nMã có hiệu lực ${RESET_MIN} phút.`);
      return {sent:true,devCode:A.devMail?code:undefined,username:A.devMail?a.username:undefined};
    },
    reset(p){
      const email=lower(p.email),a=find('tai_khoan','email',email);
      if(!a||!a.ma_khoi_phuc||String(a.ma_khoi_phuc)!==String(p.code).trim()||Number(a.ma_het_han)<A.now())fail('MA_SAI');
      if(String(p.password||'').length<6)fail('MAT_KHAU_NGAN');
      a.muoi=A.uid();a.mat_khau=A.hash(a.muoi+p.password);a.ma_khoi_phuc='';a.ma_het_han=0;
      return {token:newToken(a),account:pub(a)};
    },
    chars(p){
      const a=auth(p.token),list=where('nhan_vat','tai_khoan',a.id).filter(c=>(c.trang_thai==='active'||c.trang_thai==='merc')).map(c=>{if(c.trang_thai==='merc'){c.trang_thai='active';c.gia_danh_thue=0;c.gia_hong_ngoc=0;A.update('nhan_vat',c);}return {...charView(c),look:lookOf(c)};});
      const cs=claimSum(a.id);
      return {account:pub(a),chars:list,max:cfg('so_nhan_vat_toi_da')||5,claim:cs.copper,claimRuby:cs.ruby};
    },
    createChar(p){
      const a=auth(p.token),name=String(p.name||'').trim().replace(/\s+/g,' '),gender=p.gender==='f'?'f':'m',st=p.stats||{};
      if(name.length<2||name.length>16||!/^[\p{L}\p{N} ]+$/u.test(name))fail('TEN_NHAN_VAT_SAI');
      const keys=['strength','agility','vitality','intelligence'],vals=keys.map(k=>Number(st[k]));
      if(vals.some(v=>!Number.isInteger(v)||v<0))fail('DIEM_SAI');
      if(vals.reduce((s,v)=>s+v,0)!==(cfg('diem_khoi_tao')||50))fail('DIEM_SAI');
      return A.lock(()=>{
        const max=cfg('so_nhan_vat_toi_da')||5;
        if(where('nhan_vat','tai_khoan',a.id).filter(c=>c.trang_thai==='active'||c.trang_thai==='merc').length>=max)fail('DU_NHAN_VAT');
        if(where('nhan_vat','ten_khoa',lower(name)).some(c=>c.trang_thai!=='deleted'))fail('TEN_DA_CO');
        const c={id:'nv-'+A.uid(),tai_khoan:a.id,ten:name,ten_khoa:lower(name),gioi_tinh:gender,suc_manh:vals[0],nhanh_nhen:vals[1],suc_khoe:vals[2],tri_tue:vals[3],trang_thai:'active',gia_danh_thue:0,nguoi_mua:'',luu:'',tao_luc:A.now(),cap_nhat:A.now()};
        A.insert('nhan_vat',c);return {char:charView(c)};
      });
    },
    // v10.31: xoá nhân vật (gõ đúng tên để xác nhận); còn hàng bày ở chợ thì phải hủy trước. Đánh dấu deleted, tên được dùng lại
    delChar(p){
      const a=auth(p.token);
      return A.lock(()=>{const c=ownChar(a,p.charId);if(c.trang_thai!=='active'&&c.trang_thai!=='merc')fail('SAI_TRANG_THAI');if(String(p.name||'').trim()!==String(c.ten))fail('SAI_TEN');
        if(where('cho','nhan_vat_ban',c.id).some(r=>r.trang_thai==='mo'))fail('CON_HANG_CHO');
        c.trang_thai='deleted';c.cap_nhat=A.now();A.update('nhan_vat',c);return {id:c.id};});
    },
    load(p){
      const a=auth(p.token);
      return A.lock(()=>{const c=ownChar(a,p.charId,'active'),st=stateOf(c);if(!c.luu)storeState(c,st,st.player);return {char:charView(c),save:{player:st.player,pos:st.save.pos||null,seen:st.save.seen||[]}};});
    },
    // Đồng bộ: nhận cách sắp xếp đồ + lệnh, máy chủ tự tính kết quả (rơi đồ, tiền, gia cường…) rồi trả lại trạng thái chuẩn
    play(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const c=ownChar(a,p.charId,'active'),st=stateOf(c),C=p.save&&p.save.player;
        let R=C?Player.merge(st.player,C):st.player;const srv=st.save.srv=st.save.srv||{},now=A.now(),ops=Array.isArray(p.ops)?p.ops.slice(0,600):[];
        // Lệnh chơi được gom trên máy người chơi rồi gửi một lần (về làng, qua cầu, gặp thương nhân, bấm Lưu).
        // Gói đã nhận rồi (mạng rớt lúc chờ trả lời, gửi lại) thì không tính lần hai.
        const bid=String(p.bid||'').slice(0,40),dup=!!bid&&(srv.bids||[]).includes(bid);
        // Thời điểm từng lệnh theo đồng hồ máy chủ: không sớm hơn lần lưu trước, không muộn hơn lúc này
        const skew=Number.isFinite(+p.sentAt)&&+p.sentAt>0?now-(+p.sentAt):0;let prev=Math.max(+srv.lastAt||0,now-864e5);
        const results=dup?ops.map(()=>({ok:true,dup:true})):ops.map(op=>{
          let at=Number.isFinite(+(op&&op.at))?+op.at+skew:now;at=Math.min(now,Math.max(prev,at));prev=at;
          try{if(op&&op.lay)R=Player.relayout(R,op.lay);return {ok:true,...Player.applyOp(R,op,srv,at)};}catch(e){return {ok:false,error:String(e.message||e)};}
        });
        if(!dup&&ops.length&&C)R=Player.merge(R,C);
        if(bid&&!dup)srv.bids=[...(srv.bids||[]),bid].slice(-8);
        srv.lastAt=now;
        storeState(c,st,R,{pos:p.save&&p.save.pos,seen:p.save&&p.save.seen});
        return {state:R,results,savedAt:c.cap_nhat};
      });
    },
    save(p){return H.play({...p,ops:[]});},
    // v10.13: bỏ chức năng cho thuê nhân vật giữa người chơi (mercRegister / mercCancel / mercList / mercBuy); nhân vật đang ở trạng thái merc cũ tự về active khi mở lều
    // v10.13: Thầy đồ chấm ngay (không khóa, không ghi Sheet): trả câu sai + chữ ký; trình duyệt áp dụng op 'quiz' kèm chữ ký, máy chủ kiểm chữ ký khi nhận gói lưu
    quizCheck(p){
      const a=auth(p.token);A.rules&&A.rules();const bo=String(p.bo||''),Q=Player.QUIZ[bo];if(!Q||!Q.qs.length)fail('QUIZ');
      const c=ownChar(a,p.charId,'active'),ans=Array.isArray(p.ans)?p.ans.map(x=>String(x||'').toUpperCase()):[];const wrong=[];Q.qs.forEach((q,i)=>{if(ans[i]!==q.ans)wrong.push(i);});
      return {total:Q.qs.length,ok:Q.qs.length-wrong.length,wrong,sig:A.sign?A.sign(Player.quizKey(c.id,bo,wrong)):''};
    },
    // xem đáp án sau khi đủ manh mối (đọc trạng thái, không khóa)
    quizShow(p){
      const a=auth(p.token);const c=ownChar(a,p.charId,'active'),st=stateOf(c),bo=String(p.bo||''),Q=Player.QUIZ[bo],z=st.player.quiz&&st.player.quiz[bo];if(!Q)fail('QUIZ');if(!(z&&z.reveal))fail('QUIZ_CHUA');return {show:Q.qs.map(q=>q.ans)};
    },
    marketList(p){
      const a=auth(p.token),rows=where('cho','trang_thai','mo').filter(r=>r.loai==='do');
      const view=r=>({id:r.id,item:JSON.parse(r.vat_pham||'null'),price:Number(r.gia),ruby:Number(r.hong_ngoc)||0,mine:r.nguoi_ban===a.id,seller:r.ten_nguoi_ban||''});
      return {open:rows.filter(r=>r.trang_thai==='mo').map(view),claim:claimSum(a.id).copper,claimRuby:claimSum(a.id).ruby};
    },
    // Ký gửi: lấy món đồ ra khỏi túi nhân vật trên máy chủ
    marketSell(p){
      const a=auth(p.token),price=Math.max(0,Math.floor(Number(p.price)||0)),ruby=Math.max(0,Math.floor(Number(p.ruby)||0));
      if(!(price>=1)&&!(ruby>=1))fail('GIA_SAI');
      return A.lock(()=>{
        const c=ownChar(a,p.charId,'active'),st=stateOf(c),i=p.uid?st.player.bag.findIndex(x=>x&&x.uid===String(p.uid)):Math.floor(Number(p.i)),it=st.player.bag[i];
        if(!it||!Player.tradeable(it))fail('VAT_PHAM_SAI');
        st.player.bag[i]=null;storeState(c,st,st.player);
        const fee=(cfg('phi_cho')||0)/100,r={id:'ch-'+A.uid(),loai:'do',nguoi_ban:a.id,nhan_vat_ban:c.id,ten_nguoi_ban:c.ten,vat_pham:JSON.stringify(it),gia:price,tien_nhan:Math.floor(price*(1-fee)),hong_ngoc:ruby,hong_ngoc_nhan:Math.floor(ruby*(1-fee)),trang_thai:'mo',nguoi_mua:'',tao_luc:A.now(),ban_luc:0,da_nhan:0};
        A.insert('cho',r);return {id:r.id,state:st.player};
      });
    },
    // Hủy ký gửi: trả món đồ về túi nhân vật đã ký gửi
    marketCancel(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const r=find('cho','id',p.id);if(!r||r.nguoi_ban!==a.id||r.trang_thai!=='mo')fail('KHONG_HUY_DUOC');
        const c=ownChar(a,r.nhan_vat_ban,'active'),st=stateOf(c),it=Player.cleanItem(JSON.parse(r.vat_pham));
        if(it)Player.addItem(st.player,it);storeState(c,st,st.player);
        r.trang_thai='huy';A.update('cho',r);return {charId:c.id,state:st.player};
      });
    },
    marketBuy(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const c=ownChar(a,p.charId,'active'),r=find('cho','id',p.id);
        if(!r||r.trang_thai!=='mo')fail('DA_BAN');if(r.nguoi_ban===a.id)fail('DO_CUA_MINH');
        const st=stateOf(c),price=Number(r.gia)||0,ruby=Number(r.hong_ngoc)||0,it=Player.cleanItem(JSON.parse(r.vat_pham));
        if(st.player.copper<price)fail('KHONG_DU_TIEN');if(st.player.rubies<ruby)fail('KHONG_DU_HONG_NGOC');if(!it)fail('VAT_PHAM_SAI');
        Player.addItem(st.player,it);st.player.copper-=price;st.player.rubies-=ruby;storeState(c,st,st.player);
        r.trang_thai='da_ban';r.nguoi_mua=p.charId;r.ban_luc=A.now();A.update('cho',r);
        return {item:it,price,ruby,state:st.player};
      });
    },
    // Nhận tiền bán hàng vào một nhân vật
    claim(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const c=ownChar(a,p.charId,'active'),st=stateOf(c);let sum=0,rsum=0;
        for(const r of pendingClaims(a.id)){sum+=Number(r.tien_nhan||0);rsum+=Number(r.hong_ngoc_nhan||0);r.da_nhan=1;A.update('cho',r);}
        st.player.copper+=sum;st.player.rubies+=rsum;storeState(c,st,st.player);return {amount:sum,ruby:rsum,state:st.player};
      });
    }
  };
  // v10.12: lệnh kèm pre = gói phần chơi chưa gửi {bid,sentAt,save,ops} → chạy play trước trong cùng lượt gọi (một lượt thay vì hai)
  return {handle(action,p){try{if(!H[action])fail('KHONG_CO_LENH');p=p||{};if(typeof Player!=='undefined'){Player._sign=A.sign||null;Player._sid=String(p.charId||'');}let pre=null;if(p.pre&&typeof p.pre==='object'&&action!=='play'&&action!=='save'){const r=H.play({token:p.token,charId:p.charId,...p.pre});pre={results:r.results,savedAt:r.savedAt};}return {ok:true,...H[action](p),...(pre?{pre}:{})};}catch(e){return {ok:false,error:String(e.message||e)};}finally{if(typeof Player!=='undefined'){Player._sign=null;Player._sid='';}}}};
}
