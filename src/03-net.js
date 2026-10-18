/* ================= KẾT NỐI MÁY CHỦ =================
   Dán URL Web App của Apps Script vào LH_API. Để trống = chế độ ngoại tuyến (lưu trên trình duyệt này, dùng để thử). */
const LH_API=(typeof window!=='undefined'&&window.LH_API)||'';
function sha256(s){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const b=Array.from(new TextEncoder().encode(s)),l=b.length*8;b.push(0x80);while(b.length%64!==56)b.push(0);for(let i=7;i>=0;i--)b.push(Math.floor(l/2**(i*8))&255);
  let h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];const r=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<b.length;o+=64){const w=[];for(let i=0;i<16;i++)w[i]=(b[o+i*4]<<24)|(b[o+i*4+1]<<16)|(b[o+i*4+2]<<8)|b[o+i*4+3];
    for(let i=16;i<64;i++){const s0=r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3),s1=r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
    let [a,bb,c,d,e,f,g,hh]=h;for(let i=0;i<64;i++){const t1=(hh+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&bb)^(a&c)^(bb&c)))|0;hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=bb;bb=a;a=(t1+t2)|0;}
    h=h.map((v,i)=>(v+[a,bb,c,d,e,f,g,hh][i])|0);}
  return h.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}
// Máy chủ giả trên trình duyệt: dùng chung LH_Core với Apps Script
const LocalServer=(()=>{
  const KEY='lh-offline-db';let db;
  const load=()=>{if(db)return db;try{db=JSON.parse(localStorage.getItem(KEY))||null;}catch(e){}return db=db||{tai_khoan:[],nhan_vat:[],cho:[]};};
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){}};
  const core=LH_Core({
    rows:t=>load()[t],insert:(t,o)=>{load()[t].push(o);persist();},update:(t,o)=>{const a=load()[t],i=a.findIndex(x=>x.id===o.id);if(i>=0)a[i]=o;persist();},
    mail:()=>{},devMail:true,hash:sha256,now:()=>Date.now(),uid:()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4),
    staticData:()=>GAME_DATA,lock:fn=>fn(),sign:s=>sha256('lh-local|'+s)
  });
  // đọc lại mỗi lệnh: game và Chợ phiên mở ở 2 thẻ vẫn dùng chung dữ liệu
  return {handle:(action,p)=>{db=null;return JSON.parse(JSON.stringify(core.handle(action,p)));}};
})();
const Net={
  online:!!LH_API,token:(()=>{try{return localStorage.getItem('lh-token')||'';}catch(e){return '';}})(),
  setToken(t){this.token=t||'';try{t?localStorage.setItem('lh-token',t):localStorage.removeItem('lh-token');}catch(e){}},
  async call(action,payload={}){
    const body={...payload,action,token:this.token};let r;
    // lệnh ghi mang mã riêng: gửi lại (rớt mạng, đổi GET/POST) máy chủ trả kết quả cũ, không làm hai lần
    if(!NET_SAFE.has(action)&&!body.rid)body.rid=Date.now().toString(36)+Math.random().toString(36).slice(2,10);
    if(!LH_API)r=LocalServer.handle(action,body);
    else{
      const json=JSON.stringify(body),small=json.length<1800;
      const parse=txt=>{try{return JSON.parse(txt);}catch(e){throw Error(/<html/i.test(txt)?'MAY_CHU_LOI':'Failed to fetch');}};
      // POST giống hệt bản 8.4 (không thêm tùy chọn nào: Safari thêm header là bị chặn CORS)
      // quá 25 giây (lệnh đọc) / 45 giây (lệnh ghi) không trả lời thì coi như rớt mạng (lệnh ghi có mã rid nên gửi lại không bị làm hai lần)
      const timed=pr=>Promise.race([pr,new Promise((_,no)=>setTimeout(()=>no(Error('Failed to fetch')),NET_SAFE.has(action)?25000:45000))]);
      const viaPost=async()=>parse(await timed(fetch(LH_API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:json}).then(x=>x.text())));
      // Đường dự phòng: lệnh nhỏ gửi bằng GET (?p=…) khi trình duyệt không POST được
      const viaGet=async()=>{const x=parse(await timed(fetch(LH_API+(LH_API.includes('?')?'&':'?')+'p='+encodeURIComponent(json)).then(x=>x.text())));if(x&&x.msg!==undefined&&action!=='ping')throw Error('POST_LOI');return x;};
      if(small&&Net.useGet){try{r=await viaGet();}catch(e){}}
      // mạng chập chờn (điện thoại chuyển 4G/Wi-Fi): lệnh đọc thử lại tối đa 2 lần, lệnh ghi (có mã rid) thử lại 1 lần
      for(let k=0;!r;k++){
        try{r=await viaPost();}
        catch(e){
          if(small&&(NET_SAFE.has(action)||action==='register'||action==='reset')&&netErr(e).message==='Failed to fetch'){try{r=await viaGet();Net.useGet=true;break;}catch(g){if(g.message==='POST_LOI')throw g;}}
          if(k>=2||e.message==='MAY_CHU_LOI'||(!NET_SAFE.has(action)&&(k>=1||!body.rid))){const d=await netDiag(netErr(e));LH_DIAG.net(action,d.message);throw d;}await new Promise(ok=>setTimeout(ok,900*(k+1)));
        }
      }
    }
    // cùng trình duyệt (game và Chợ phiên ở 2 thẻ) đã đăng nhập lại: dùng phiên mới rồi thử lại một lần
    if(!r.ok&&r.error==='DANG_NHAP_NOI_KHAC'&&!payload._retry){let st='';try{st=localStorage.getItem('lh-token')||'';}catch(e){}if(st&&st!==this.token){this.token=st;return this.call(action,{...payload,_retry:1});}}
    // phiên bị thay (đăng nhập ở thiết bị khác): báo cho game / Chợ phiên dừng lại
    if(!r.ok&&(r.error==='DANG_NHAP_NOI_KHAC'||(r.error==='PHIEN_HET_HAN'&&this.token))&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('lh-kicked',{detail:r.error}));
    Net.okOnce=true;LH_DIAG.net(action,r.ok?'':r.error);
    if(!r.ok){const e=Error(r.error||'LOI');throw e;}
    return r;
  }
};
/* Tiến trình chơi giữ trên máy (localStorage), mỗi nhân vật một khóa: {save, inflight:{bid,ops}, ops}
   Game ghi liên tục; chỉ gửi lên máy chủ ở các mốc lưu. Lần vào game / Chợ phiên sau, phần còn sót được gửi trước khi tải nhân vật. */
/* Nhật ký tình trạng (menu → Tình trạng): lỗi trò chơi gần đây, lần gọi máy chủ gần nhất. Giữ trên máy để chụp gửi khi cần. */
const LH_DIAG=(()=>{
  const K='lh-diag',st={err:[],net:[]};try{Object.assign(st,JSON.parse(localStorage.getItem(K)||'{}'));}catch(e){}
  const save=()=>{try{localStorage.setItem(K,JSON.stringify(st));}catch(e){}};
  const t=()=>new Date().toLocaleTimeString('vi-VN');
  return {
    error(e,where){const m=String(e&&e.message||e).slice(0,160),s=String(e&&e.stack||'').split('\n').slice(0,3).join(' | ').slice(0,300);st.err.unshift({t:t(),where,m,s});st.err=st.err.slice(0,8);save();},
    net(a,err){st.net.unshift({t:t(),a,err:err||''});st.net=st.net.slice(0,8);save();},
    get data(){return st;},clear(){st.err=[];st.net=[];save();}
  };
})();
if(typeof window!=='undefined'){window.addEventListener('error',e=>LH_DIAG.error(e.error||e.message,'trang'));window.addEventListener('unhandledrejection',e=>LH_DIAG.error(e.reason,'lệnh'));}
const LH_Local={
  key:id=>'lh-local-'+id,
  get(id){try{return JSON.parse(localStorage.getItem(this.key(id))||'null');}catch(e){return null;}},
  set(id,v){try{localStorage.setItem(this.key(id),JSON.stringify(v));return true;}catch(e){return false;}},
  clear(id){try{localStorage.removeItem(this.key(id));}catch(e){}},
  async push(id){
    const L=this.get(id);if(!L||!L.save)return false;
    let last=null;const fix=ops=>{if(ops.length&&!ops[0].lay&&last)ops[0]={...ops[0],lay:last};for(const o of ops)if(o.lay)last=o.lay;return ops;};
    try{
      do{
        if(!L.inflight)L.inflight={bid:Date.now().toString(36)+Math.random().toString(36).slice(2,8),ops:fix((L.ops||[]).splice(0,500))};
        else fix(L.inflight.ops);
        this.set(id,L);
        await Net.call('play',{charId:id,bid:L.inflight.bid,sentAt:Date.now(),save:L.save,ops:L.inflight.ops});
        L.inflight=null;this.set(id,L);
      }while((L.ops||[]).length);
    }catch(e){
      // nhân vật không còn / đang đi đánh thuê: bỏ phần lưu tạm; lỗi mạng: giữ lại, báo lỗi
      if(['KHONG_THAY_NHAN_VAT','SAI_TRANG_THAI'].includes(e.message)){this.clear(id);return false;}
      throw e;
    }
    this.clear(id);return true;
  }
};
const NET_ERR={SAI_TEN:'Tên gõ lại chưa đúng',CON_HANG_CHO:'Nhân vật còn đồ đang bày ở Chợ phiên · hủy bán trước rồi xoá',CHAP_CHON:'Mạng chập chờn hoặc máy chủ trả lời chậm · phần chơi vẫn giữ trên máy, sẽ gửi lại',CHUA_LUU:'Chưa lưu được phần chơi lên máy chủ, thử lại',DANG_CHOI:'Nhân vật đang chơi, không cho thuê được',PHIEN_HET_HAN:'Phiên đăng nhập hết hạn, hãy đăng nhập lại',TEN_DANG_NHAP_SAI:'Tên đăng nhập 3–20 ký tự: chữ thường, số, dấu _',EMAIL_SAI:'Email không hợp lệ',MAT_KHAU_NGAN:'Mật khẩu tối thiểu 6 ký tự',TEN_DANG_NHAP_DA_CO:'Tên đăng nhập đã có người dùng',EMAIL_DA_CO:'Email đã được đăng ký',SAI_DANG_NHAP:'Sai tên đăng nhập hoặc mật khẩu',KHONG_THAY_EMAIL:'Không có tài khoản dùng email này',MA_SAI:'Mã khôi phục sai hoặc hết hạn',TEN_NHAN_VAT_SAI:'Tên nhân vật 2–16 ký tự, chỉ chữ và số',DIEM_SAI:'Phải chia đủ số điểm',DU_NHAN_VAT:'Tài khoản đã đủ số nhân vật',TEN_DA_CO:'Tên nhân vật đã có người dùng',KHONG_THAY_NHAN_VAT:'Không tìm thấy nhân vật',SAI_TRANG_THAI:'Nhân vật đang đi đánh thuê',GIA_SAI:'Giá không hợp lệ',LINH_KHONG_CON:'Lính này đã có người thuê',DA_BAN:'Món này đã được bán',DO_CUA_MINH:'Đây là đồ bạn ký gửi',KHONG_HUY_DUOC:'Không hủy được',DU_LIEU_QUA_LON:'Dữ liệu lưu quá lớn',KHONG_DU_TIEN:'Nhân vật không đủ tiền',DU_LINH:'Nhân vật đã đủ lính',BAG_FULL:'Túi đồ đã đầy',VAT_PHAM_SAI:'Món đồ không hợp lệ',NHANH_QUA:'Quái chưa kịp hồi sinh',KHONG_DU_HONG_NGOC:'Nhân vật không đủ hồng ngọc',DANG_NHAP_NOI_KHAC:'Tài khoản vừa đăng nhập trên thiết bị khác',KHONG_CO_LENH:'Máy chủ chưa cập nhật bản mới',MAY_CHU_LOI:'Máy chủ Apps Script đang lỗi hoặc chưa mở quyền truy cập cho mọi người',POST_LOI:'Máy chủ có chạy nhưng không nhận lệnh: dán Code.gs mới rồi Triển khai → Quản lý triển khai → Sửa → Phiên bản mới',KHONG_TRUY_CAP:'Trình duyệt này không gọi được máy chủ: trong Apps Script, Triển khai → Quản lý triển khai → Sửa, mục "Ai có quyền truy cập" chọn "Bất kỳ ai"'};
// Không gọi được máy chủ: thử GET (lệnh ping) để biết lỗi ở đâu
//  - GET được, POST không: Code.gs mới chưa được triển khai (hoặc doPost lỗi)
//  - GET cũng không: quyền truy cập Web App chưa đặt "Bất kỳ ai" (trình duyệt điện thoại chặn cookie Google bên thứ ba)
async function netDiag(e){
  if(e.message!=='Failed to fetch'||(typeof navigator!=='undefined'&&navigator.onLine===false))return e;
  // đã gọi được máy chủ trong phiên này: lỗi lúc này là mạng chập chờn / máy chủ chậm, không phải do cài đặt
  if(Net.okOnce)return Error('CHAP_CHON');
  try{const r=await fetch(LH_API+(LH_API.includes('?')?'&':'?')+'t='+Date.now());const j=JSON.parse(await r.text());return Error(j&&j.ok?'POST_LOI':'KHONG_TRUY_CAP');}
  catch(x){return Error('KHONG_TRUY_CAP');}
}
const NET_SAFE=new Set(['ping','data','login','chars','load','alive','marketList','quizCheck','quizShow']);
// lỗi mạng mỗi trình duyệt báo một kiểu: Chrome "Failed to fetch", Safari "Load failed", Firefox "NetworkError…"
const netErr=e=>/failed to fetch|load failed|networkerror|network request failed|the internet connection/i.test(String(e&&e.message))?Error('Failed to fetch'):e;
const netMsg=e=>NET_ERR[e&&e.message]||(e&&e.message==='Failed to fetch'?'Không kết nối được máy chủ Việt Nam, kiểm tra mạng rồi thử lại':'Lỗi: '+(e&&e.message||e));
