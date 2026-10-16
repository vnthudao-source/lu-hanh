/* ================= LÕI MÁY CHỦ (dùng chung cho Apps Script và chế độ ngoại tuyến) =================
   adapter cần có: rows(bang) · insert(bang,obj) · update(bang,obj) · mail(to,tieuDe,noiDung) · hash(chuoi) · now() · uid() · staticData() · lock(fn) · rules() (nạp luật chơi)
   Bảng: tai_khoan · nhan_vat · cho
   v8: máy chủ giữ tiền, hồng ngọc, đồ của từng nhân vật. Trình duyệt chỉ gửi: sắp xếp đồ, máu/mana, vị trí và các lệnh (hạ quái, mua, bán, gia cường, nhiệm vụ, thuê lính). */
function LH_Core(A){
  const TOKEN_DAYS=30,RESET_MIN=15;
  const fail=e=>{throw Error(e);};
  const lower=s=>String(s||'').trim().toLowerCase();
  const cfg=k=>{const r=(A.staticData().cau_hinh||[]).find(x=>x.khoa===k);return r?Number(r.gia_tri):null;};
  const pub=a=>({id:a.id,username:a.username,email:a.email});
  function auth(token){
    const a=A.rows('tai_khoan').find(x=>x.token&&x.token===token);
    if(!a||Number(a.token_het_han)<A.now())fail('PHIEN_HET_HAN');
    return a;
  }
  function ownChar(a,id,status){
    const c=A.rows('nhan_vat').find(x=>x.id===id);
    if(!c||c.tai_khoan!==a.id)fail('KHONG_THAY_NHAN_VAT');
    if(status&&c.trang_thai!==status)fail('SAI_TRANG_THAI');
    return c;
  }
  const charView=c=>({id:c.id,name:c.ten,gender:c.gioi_tinh,stats:{strength:+c.suc_manh,agility:+c.nhanh_nhen,vitality:+c.suc_khoe,intelligence:+c.tri_tue},status:c.trang_thai,level:+c.cap||1,price:+c.gia_danh_thue||0,ruby:+c.gia_hong_ngoc||0,created:+c.tao_luc});
  function newToken(a){a.token=A.uid()+A.uid();a.token_het_han=A.now()+TOKEN_DAYS*864e5;A.update('tai_khoan',a);return a.token;}
  // Trạng thái nhân vật lưu trên máy chủ (cột luu): {v, player, pos, seen, srv}
  function stateOf(c){
    A.rules&&A.rules();
    let save=null;try{save=c.luu?JSON.parse(c.luu):null;}catch(e){}save=save||{};
    const ch=charView(c);
    return {save,player:save.player?Player.restore(save,ch,()=>true,null).player:Player.create(ch)};
  }
  function storeState(c,st,player,soft){
    soft=soft||{};
    const okPos=v=>v&&Number.isFinite(+v.x)&&Number.isFinite(+v.y)?{x:+v.x,y:+v.y}:null;
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
  function pendingClaims(acc){return A.rows('cho').filter(r=>r.trang_thai==='da_ban'&&r.nguoi_ban===acc&&String(r.da_nhan)!=='1');}
  const H={
    ping:()=>({msg:'Lữ Hành API'}),
    data:()=>({data:A.staticData()}),
    register(p){
      const username=lower(p.username),email=lower(p.email),pw=String(p.password||'');
      if(!/^[a-z0-9_]{3,20}$/.test(username))fail('TEN_DANG_NHAP_SAI');
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))fail('EMAIL_SAI');
      if(pw.length<6)fail('MAT_KHAU_NGAN');
      return A.lock(()=>{
        const all=A.rows('tai_khoan');
        if(all.some(a=>a.username===username))fail('TEN_DANG_NHAP_DA_CO');
        if(all.some(a=>a.email===email))fail('EMAIL_DA_CO');
        const salt=A.uid(),a={id:'tk-'+A.uid(),username,email,muoi:salt,mat_khau:A.hash(salt+pw),tao_luc:A.now(),token:'',token_het_han:0,ma_khoi_phuc:'',ma_het_han:0};
        A.insert('tai_khoan',a);
        return {token:newToken(a),account:pub(a)};
      });
    },
    login(p){
      const key=lower(p.username),pw=String(p.password||'');
      const a=A.rows('tai_khoan').find(x=>x.username===key||x.email===key);
      if(!a||A.hash(a.muoi+pw)!==a.mat_khau)fail('SAI_DANG_NHAP');
      return {token:newToken(a),account:pub(a)};
    },
    logout(p){const a=auth(p.token);a.token='';a.token_het_han=0;A.update('tai_khoan',a);return {};},
    forgot(p){
      const email=lower(p.email),a=A.rows('tai_khoan').find(x=>x.email===email);
      if(!a)fail('KHONG_THAY_EMAIL');
      const code=String(100000+Math.floor(Math.random()*900000));
      a.ma_khoi_phuc=code;a.ma_het_han=A.now()+RESET_MIN*6e4;A.update('tai_khoan',a);
      A.mail(a.email,'Lữ Hành · Khôi phục tài khoản',`Tên đăng nhập của bạn: ${a.username}\nMã khôi phục: ${code}\nMã có hiệu lực ${RESET_MIN} phút.`);
      return {sent:true,devCode:A.devMail?code:undefined,username:A.devMail?a.username:undefined};
    },
    reset(p){
      const email=lower(p.email),a=A.rows('tai_khoan').find(x=>x.email===email);
      if(!a||!a.ma_khoi_phuc||String(a.ma_khoi_phuc)!==String(p.code).trim()||Number(a.ma_het_han)<A.now())fail('MA_SAI');
      if(String(p.password||'').length<6)fail('MAT_KHAU_NGAN');
      a.muoi=A.uid();a.mat_khau=A.hash(a.muoi+p.password);a.ma_khoi_phuc='';a.ma_het_han=0;
      return {token:newToken(a),account:pub(a)};
    },
    chars(p){
      const a=auth(p.token),list=A.rows('nhan_vat').filter(c=>c.tai_khoan===a.id&&(c.trang_thai==='active'||c.trang_thai==='merc')).map(c=>({...charView(c),look:lookOf(c)}));
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
        const all=A.rows('nhan_vat'),max=cfg('so_nhan_vat_toi_da')||5;
        if(all.filter(c=>c.tai_khoan===a.id&&(c.trang_thai==='active'||c.trang_thai==='merc')).length>=max)fail('DU_NHAN_VAT');
        if(all.some(c=>c.ten_khoa===lower(name)&&c.trang_thai!=='deleted'))fail('TEN_DA_CO');
        const c={id:'nv-'+A.uid(),tai_khoan:a.id,ten:name,ten_khoa:lower(name),gioi_tinh:gender,suc_manh:vals[0],nhanh_nhen:vals[1],suc_khoe:vals[2],tri_tue:vals[3],trang_thai:'active',gia_danh_thue:0,nguoi_mua:'',luu:'',tao_luc:A.now(),cap_nhat:A.now()};
        A.insert('nhan_vat',c);return {char:charView(c)};
      });
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
        const R=C?Player.merge(st.player,C):st.player,srv=st.save.srv=st.save.srv||{},now=A.now();
        const results=(Array.isArray(p.ops)?p.ops.slice(0,60):[]).map(op=>{try{return {ok:true,...Player.applyOp(R,op,srv,now)};}catch(e){return {ok:false,error:String(e.message||e)};}});
        storeState(c,st,R,{pos:p.save&&p.save.pos,seen:p.save&&p.save.seen});
        return {state:R,results,savedAt:c.cap_nhat};
      });
    },
    save(p){return H.play({...p,ops:[]});},
    mercRegister(p){
      const a=auth(p.token),c=ownChar(a,p.charId,'active'),price=Math.max(0,Math.floor(Number(p.price)||0)),ruby=Math.max(0,Math.floor(Number(p.ruby)||0));
      if(!(price>=100)&&!(ruby>=1))fail('GIA_SAI');
      c.trang_thai='merc';c.gia_danh_thue=price;c.gia_hong_ngoc=ruby;c.cap_nhat=A.now();A.update('nhan_vat',c);return {char:charView(c)};
    },
    mercCancel(p){const a=auth(p.token),c=ownChar(a,p.charId,'merc');c.trang_thai='active';c.gia_danh_thue=0;c.gia_hong_ngoc=0;A.update('nhan_vat',c);return {char:charView(c)};},
    mercList(p){
      const a=auth(p.token);
      return {list:A.rows('nhan_vat').filter(c=>c.trang_thai==='merc'&&c.tai_khoan!==a.id).map(c=>{let eq={};try{eq=(JSON.parse(c.luu||'{}').player||{}).equipment||{};}catch(e){}return {...charView(c),equipment:eq,look:lookOf(c)};})};
    },
    mercBuy(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const b=ownChar(a,p.charId,'active'),t=A.rows('nhan_vat').find(c=>c.id===p.targetId);
        if(!t||t.trang_thai!=='merc'||t.tai_khoan===a.id)fail('LINH_KHONG_CON');
        let eq={};try{eq=(JSON.parse(t.luu||'{}').player||{}).equipment||{};}catch(e){}
        const price=Number(t.gia_danh_thue)||0,ruby=Number(t.gia_hong_ngoc)||0,fee=(cfg('phi_cho')||0)/100,st=stateOf(b);
        if(st.player.copper<price)fail('KHONG_DU_TIEN');if(st.player.rubies<ruby)fail('KHONG_DU_HONG_NGOC');if(st.player.mercs.length>=Player.MAX_MERC)fail('DU_LINH');
        Player.addMerc(st.player,{name:t.ten,gender:t.gioi_tinh,stats:charView(t).stats,equipment:eq,src:'player',from:t.id,cmd:10});
        st.player.copper-=price;st.player.rubies-=ruby;storeState(b,st,st.player);
        t.trang_thai='sold';t.nguoi_mua=p.charId;t.cap_nhat=A.now();A.update('nhan_vat',t);
        A.insert('cho',{id:'ch-'+A.uid(),loai:'linh',nguoi_ban:t.tai_khoan,nhan_vat_ban:t.id,vat_pham:'',gia:price,tien_nhan:Math.floor(price*(1-fee)),hong_ngoc:ruby,hong_ngoc_nhan:Math.floor(ruby*(1-fee)),trang_thai:'da_ban',nguoi_mua:p.charId,tao_luc:A.now(),ban_luc:A.now(),da_nhan:0});
        return {name:t.ten,price,ruby,state:st.player};
      });
    },
    marketList(p){
      const a=auth(p.token),rows=A.rows('cho').filter(r=>r.loai==='do');
      const view=r=>({id:r.id,item:JSON.parse(r.vat_pham||'null'),price:Number(r.gia),mine:r.nguoi_ban===a.id,seller:r.ten_nguoi_ban||''});
      return {open:rows.filter(r=>r.trang_thai==='mo').map(view),claim:claimSum(a.id).copper,claimRuby:claimSum(a.id).ruby};
    },
    // Ký gửi: lấy món đồ ra khỏi túi nhân vật trên máy chủ
    marketSell(p){
      const a=auth(p.token),price=Math.floor(Number(p.price));
      if(!(price>=1))fail('GIA_SAI');
      return A.lock(()=>{
        const c=ownChar(a,p.charId,'active'),st=stateOf(c),i=Math.floor(Number(p.i)),it=st.player.bag[i];
        if(!it||!Player.tradeable(it))fail('VAT_PHAM_SAI');
        st.player.bag[i]=null;storeState(c,st,st.player);
        const fee=(cfg('phi_cho')||0)/100,r={id:'ch-'+A.uid(),loai:'do',nguoi_ban:a.id,nhan_vat_ban:c.id,ten_nguoi_ban:c.ten,vat_pham:JSON.stringify(it),gia:price,tien_nhan:Math.floor(price*(1-fee)),trang_thai:'mo',nguoi_mua:'',tao_luc:A.now(),ban_luc:0,da_nhan:0};
        A.insert('cho',r);return {id:r.id,state:st.player};
      });
    },
    // Hủy ký gửi: trả món đồ về túi nhân vật đã ký gửi
    marketCancel(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const r=A.rows('cho').find(x=>x.id===p.id);if(!r||r.nguoi_ban!==a.id||r.trang_thai!=='mo')fail('KHONG_HUY_DUOC');
        const c=ownChar(a,r.nhan_vat_ban,'active'),st=stateOf(c),it=Player.cleanItem(JSON.parse(r.vat_pham));
        if(it)Player.addItem(st.player,it);storeState(c,st,st.player);
        r.trang_thai='huy';A.update('cho',r);return {charId:c.id,state:st.player};
      });
    },
    marketBuy(p){
      const a=auth(p.token);
      return A.lock(()=>{
        const c=ownChar(a,p.charId,'active'),r=A.rows('cho').find(x=>x.id===p.id);
        if(!r||r.trang_thai!=='mo')fail('DA_BAN');if(r.nguoi_ban===a.id)fail('DO_CUA_MINH');
        const st=stateOf(c),price=Number(r.gia),it=Player.cleanItem(JSON.parse(r.vat_pham));
        if(st.player.copper<price)fail('KHONG_DU_TIEN');if(!it)fail('VAT_PHAM_SAI');
        Player.addItem(st.player,it);st.player.copper-=price;storeState(c,st,st.player);
        r.trang_thai='da_ban';r.nguoi_mua=p.charId;r.ban_luc=A.now();A.update('cho',r);
        return {item:it,price,state:st.player};
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
  return {handle(action,p){try{if(!H[action])fail('KHONG_CO_LENH');return {ok:true,...H[action](p||{})};}catch(e){return {ok:false,error:String(e.message||e)};}}};
}
