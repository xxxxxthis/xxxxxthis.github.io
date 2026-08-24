(()=>{
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const base=String((window.PEPE_CONFIG||{}).apiBase||"").replace(/\/+$/,"");
  const token=()=>sessionStorage.getItem("pepe_admin_token")||"";
  let current=null;

  function ensureModal(){
    if($('#support-reply-modal')) return;
    document.body.insertAdjacentHTML('beforeend',`
      <div class="support-reply-modal" id="support-reply-modal" aria-hidden="true">
        <div class="support-reply-backdrop" data-support-modal-close></div>
        <section class="support-reply-panel" role="dialog" aria-modal="true" aria-labelledby="support-reply-title">
          <div class="support-reply-head">
            <div><small>PEPE SUPPORT CENTER</small><h2 id="support-reply-title">문의 답변</h2></div>
            <button class="support-reply-close" type="button" data-support-modal-close aria-label="닫기">×</button>
          </div>
          <div class="support-reply-meta">
            <div><small>문의번호</small><strong id="support-modal-id">-</strong></div>
            <div><small>유형</small><strong id="support-modal-category">-</strong></div>
            <div><small>작성자</small><strong id="support-modal-author">-</strong></div>
          </div>
          <div class="support-reply-subject"><small>제목</small><strong id="support-modal-subject">-</strong></div>
          <div class="support-reply-current" id="support-modal-current" hidden></div>
          <div class="support-reply-field">
            <label for="support-modal-reply"><span>운영진 답변</span><span class="support-reply-count" id="support-modal-count">0 / 3000</span></label>
            <textarea id="support-modal-reply" class="support-reply-textarea" maxlength="3000" placeholder="문의자에게 전달할 답변을 입력하세요."></textarea>
          </div>
          <div class="support-reply-field">
            <label for="support-modal-status">처리 상태</label>
            <select id="support-modal-status" class="support-reply-select">
              <option value="processing">처리중</option>
              <option value="answered" selected>답변완료</option>
              <option value="closed">종료</option>
            </select>
          </div>
          <div class="support-reply-error" id="support-modal-error"></div>
          <div class="support-reply-actions">
            <button type="button" class="support-reply-cancel" data-support-modal-close>취소</button>
            <button type="button" class="support-reply-submit" id="support-modal-submit">답변 보내기</button>
          </div>
        </section>
      </div>`);

    $('#support-modal-reply').addEventListener('input',updateCount);
    $('#support-modal-submit').addEventListener('click',submitReply);
    document.querySelectorAll('[data-support-modal-close]').forEach(x=>x.addEventListener('click',closeModal));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#support-reply-modal')?.classList.contains('open'))closeModal()});
  }

  function updateCount(){
    const v=$('#support-modal-reply')?.value||'';
    $('#support-modal-count').textContent=`${v.length} / 3000`;
  }

  async function adminApi(path,opt={}){
    const r=await fetch(base+path,{cache:'no-store',...opt,headers:{...(opt.headers||{}),Authorization:'Bearer '+token(),...(opt.body?{'Content-Type':'application/json'}:{})}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||`HTTP ${r.status}`);
    return d;
  }

  async function openModal(id){
    ensureModal();
    $('#support-modal-error').textContent='';
    try{
      const d=await adminApi('/api/admin/support');
      current=(d.rows||[]).find(x=>x.id===id)||{id};
    }catch{current={id};}
    $('#support-modal-id').textContent=current.id||id;
    $('#support-modal-category').textContent=current.category||'-';
    $('#support-modal-author').textContent=current.discordName||'미입력';
    $('#support-modal-subject').textContent=current.title||'-';
    const old=$('#support-modal-current');
    if(current.reply){old.hidden=false;old.innerHTML=`<b>현재 답변</b><br>${esc(current.reply)}`}else{old.hidden=true;old.textContent=''}
    $('#support-modal-reply').value=current.reply||'';
    $('#support-modal-status').value=current.status==='closed'?'closed':'answered';
    updateCount();
    const modal=$('#support-reply-modal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');
    setTimeout(()=>$('#support-modal-reply').focus(),0);
  }

  function closeModal(){
    const modal=$('#support-reply-modal');if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');current=null;
  }

  async function submitReply(){
    if(!current?.id)return;
    const reply=$('#support-modal-reply').value.trim();
    const status=$('#support-modal-status').value;
    const err=$('#support-modal-error');
    const btn=$('#support-modal-submit');
    err.textContent='';
    if(!reply){err.textContent='답변 내용을 입력해주세요.';return;}
    btn.disabled=true;btn.textContent='처리 중...';
    try{
      await adminApi(`/api/admin/support/${current.id}/reply`,{method:'POST',body:JSON.stringify({reply})});
      if(status!=='answered') await adminApi(`/api/admin/support/${current.id}/status`,{method:'POST',body:JSON.stringify({status})});
      closeModal();
      if(typeof window.supportInbox==='function') await window.supportInbox();
      if(typeof window.dashboard==='function') await window.dashboard();
      if(typeof window.logs==='function') await window.logs();
    }catch(e){err.textContent=e.message||'답변 처리에 실패했습니다.'}
    finally{btn.disabled=false;btn.textContent='답변 보내기'}
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-support-reply]');
    if(!btn)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    openModal(btn.dataset.supportReply);
  },true);

  ensureModal();
})();