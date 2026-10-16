/* ================= LÕI MÁY CHỦ (dùng chung cho Apps Script và chế độ ngoại tuyến) =================
   adapter cần có: rows(bang) · insert(bang,obj) · update(bang,obj) · mail(to,tieuDe,noiDung) · hash(chuoi) · now() · uid() · staticData() · lock(fn)
   Bảng: tai_khoan · nhan_vat · cho */
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
  const charView=c=>({id:c.id,name:c.ten,gender:c.gioi_tinh,stats:{strength:+c.suc_manh,agility:+c.nhanh_nhen,vitality:+c.suc_khoe,intelligence:+c.tri_tue},status:c.trang_thai,price:+c.gia_danh_thue||0,created:+c.tao_luc});
  function newToken(a){a.token=A.uid()+A.uid();a.token_het_han=A.now()+TOKEN_DAYS*864e5;A.update('tai_khoan',a);return a.token;}
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
      const a=auth(p.token),list=A.rows('nhan_vat').filter(c=>c.tai_khoan===a.id&&(c.trang_thai==='active'||c.trang_thai==='merc')).map(charView);
      const claim=pendingClaims(a.id).reduce((s,r)=>s+Number(r.tien_nhan||0),0);
      return {account:pub(a),chars:list,max:cfg('so_nhan_vat_toi_da')||5,claim};
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
    load(p){const a=auth(p.token),c=ownChar(a,p.charId,'active');let save=null;try{save=c.luu?JSON.parse(c.luu):null;}catch(e){}return {char:charView(c),save};},
    save(p){
      const a=auth(p.token),c=ownChar(a,p.charId,'active'),s=JSON.stringify(p.save||{});
      if(s.length>45000)fail('DU_LIEU_QUA_LON');
      c.luu=s;c.cap_nhat=A.now();A.update('nhan_vat',c);return {savedAt:c.cap_nhat};
    },
    mercRegister(p){
      const a=auth(p.token),c=ownChar(a,p.charId,'active'),price=Math.floor(Number(p.price));
      if(!(price>=100))fail('GIA_SAI');
      c.trang_thai='merc';c.gia_danh_thue=price;c.cap_nhat=A.now();A.update('nhan_vat',c);return {char:charView(c)};
    },
    mercCancel(p){const a=auth(p.token),c=ownChar(a,p.charId,'merc');c.trang_thai='active';c.gia_danh_thue=0;A.update('nhan_vat',c);return {char:charView(c)};},
    mercList(p){
      const a=auth(p.token);
      return {list:A.rows('nhan_vat').filter(c=>c.trang_thai==='merc'&&c.tai_khoan!==a.id).map(c=>{let eq={};try{eq=(JSON.parse(c.luu||'{}').player||{}).equipment||{};}catch(e){}return {...charView(c),equipment:eq};})};
    },
    mercBuy(p){
      const a=auth(p.token);ownChar(a,p.charId,'active');
      return A.lock(()=>{
        const t=A.rows('nhan_vat').find(c=>c.id===p.targetId);
        if(!t||t.trang_thai!=='merc'||t.tai_khoan===a.id)fail('LINH_KHONG_CON');
        let eq={};try{eq=(JSON.parse(t.luu||'{}').player||{}).equipment||{};}catch(e){}
        t.trang_thai='sold';t.nguoi_mua=p.charId;t.cap_nhat=A.now();A.update('nhan_vat',t);
        const price=Number(t.gia_danh_thue),fee=(cfg('phi_cho')||0)/100;
        A.insert('cho',{id:'ch-'+A.uid(),loai:'linh',nguoi_ban:t.tai_khoan,nhan_vat_ban:t.id,vat_pham:'',gia:price,tien_nhan:Math.floor(price*(1-fee)),trang_thai:'da_ban',nguoi_mua:p.charId,tao_luc:A.now(),ban_luc:A.now(),da_nhan:0});
        return {merc:{name:t.ten,gender:t.gioi_tinh,stats:charView(t).stats,equipment:eq,src:'player',from:t.id},price};
      });
    },
    marketList(p){
      const a=auth(p.token),rows=A.rows('cho').filter(r=>r.loai==='do');
      const view=r=>({id:r.id,item:JSON.parse(r.vat_pham||'null'),price:Number(r.gia),mine:r.nguoi_ban===a.id,seller:r.ten_nguoi_ban||''});
      return {open:rows.filter(r=>r.trang_thai==='mo').map(view),claim:pendingClaims(a.id).reduce((s,r)=>s+Number(r.tien_nhan||0),0)};
    },
    marketSell(p){
      const a=auth(p.token),c=ownChar(a,p.charId,'active'),price=Math.floor(Number(p.price));
      if(!(price>=1))fail('GIA_SAI');if(!p.item||!p.item.type)fail('VAT_PHAM_SAI');
      const fee=(cfg('phi_cho')||0)/100,r={id:'ch-'+A.uid(),loai:'do',nguoi_ban:a.id,nhan_vat_ban:c.id,ten_nguoi_ban:c.ten,vat_pham:JSON.stringify(p.item),gia:price,tien_nhan:Math.floor(price*(1-fee)),trang_thai:'mo',nguoi_mua:'',tao_luc:A.now(),ban_luc:0,da_nhan:0};
      A.insert('cho',r);return {id:r.id};
    },
    marketCancel(p){
      const a=auth(p.token);
      return A.lock(()=>{const r=A.rows('cho').find(x=>x.id===p.id);if(!r||r.nguoi_ban!==a.id||r.trang_thai!=='mo')fail('KHONG_HUY_DUOC');r.trang_thai='huy';A.update('cho',r);return {item:JSON.parse(r.vat_pham)};});
    },
    marketBuy(p){
      const a=auth(p.token);ownChar(a,p.charId,'active');
      return A.lock(()=>{const r=A.rows('cho').find(x=>x.id===p.id);if(!r||r.trang_thai!=='mo')fail('DA_BAN');if(r.nguoi_ban===a.id)fail('DO_CUA_MINH');r.trang_thai='da_ban';r.nguoi_mua=p.charId;r.ban_luc=A.now();A.update('cho',r);return {item:JSON.parse(r.vat_pham),price:Number(r.gia)};});
    },
    claim(p){
      const a=auth(p.token);
      return A.lock(()=>{let sum=0;for(const r of pendingClaims(a.id)){sum+=Number(r.tien_nhan||0);r.da_nhan=1;A.update('cho',r);}return {amount:sum};});
    }
  };
  return {handle(action,p){try{if(!H[action])fail('KHONG_CO_LENH');return {ok:true,...H[action](p||{})};}catch(e){return {ok:false,error:String(e.message||e)};}}};
}
