/* ================= CHỢ PHIÊN (từ v9.3 chỉ còn trang báo) =================
   Mua bán giữa người chơi (đồ ký gửi, nhân vật cho thuê, tiền bán hàng) đã chuyển vào game: gặp Thương nhân ở làng.
   Trang này chỉ báo chỗ mới và dẫn về game, không gọi máy chủ. */
(()=>{
  const $=s=>document.querySelector(s),body=$('#chBody');if(!body)return;
  const game=String(window.LH_GAME||'').trim();
  body.innerHTML=`<div class="moved"><svg class="icon" aria-hidden="true"><use href="#i-coin"/></svg><b>Chợ phiên đã dời vào làng</b><p>Mua bán đồ, thuê nhân vật của người chơi khác, nhận tiền bán hàng: gặp <b>Thương nhân</b> ở cuối làng Thanh Mộc.</p>${game?`<a class="go" href="${game.replace(/"/g,'&quot;')}">Vào game</a>`:''}</div>`;
  const m=$('#chMode');if(m)m.textContent='Lữ Hành';
})();
