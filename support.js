const C=window.PEPE_CONFIG||{};
const base=String(C.apiBase||"").replace(/\/+$/,"");
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const stateLabel=s=>({received:"접수됨",processing:"처리중",answered:"답변완료",closed:"종료"})[s]||s||"-";
const fmt=d=>d?new Date(d).toLocaleString("ko-KR"):"-";

async function json(path,opt={}){
  const r=await fetch(base+path,{cache:"no-store",...opt,headers:{"Content-Type":"application/json",...(opt.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error||`HTTP ${r.status}`);
  return d;
}

$$('[data-support-tab]').forEach(btn=>btn.onclick=()=>{
  const name=btn.dataset.supportTab;
  $$('[data-support-tab]').forEach(x=>x.classList.toggle('active',x===btn));
  $$('[data-support-pane]').forEach(x=>x.classList.toggle('active',x.dataset.supportPane===name));
});

$('#support-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=$('#support-submit'),out=$('#support-submit-result');
  btn.disabled=true;btn.textContent='접수 중...';out.className='support-result';
  try{
    const d=await json('/api/public/support',{method:'POST',body:JSON.stringify({
      category:$('#support-category').value,
      discordName:$('#support-discord').value.trim(),
      title:$('#support-title').value.trim(),
      content:$('#support-content').value.trim()
    })});
    out.innerHTML=`<strong class="support-ok">✅ 문의가 접수되었습니다.</strong><p>문의번호 <span class="support-ticket">${esc(d.id)}</span></p><p class="support-note">이 번호를 저장해두면 문의 조회에서 처리 상태와 답변을 확인할 수 있습니다.</p>`;
    out.classList.add('show');
    $('#support-ticket-id').value=d.id||'';
    e.target.reset();
  }catch(err){
    out.innerHTML=`<strong class="support-error">❌ 문의 접수 실패</strong><p>${esc(err.message)}</p>`;out.classList.add('show');
  }finally{btn.disabled=false;btn.textContent='문의 접수하기'}
});

$('#support-lookup')?.addEventListener('click',async()=>{
  const id=$('#support-ticket-id').value.trim().toUpperCase(),out=$('#support-lookup-result');
  out.className='support-result';
  if(!/^PS-\d{8}-\d{4}$/.test(id)){out.innerHTML='<strong class="support-error">문의번호 형식이 올바르지 않습니다.</strong>';out.classList.add('show');return}
  try{
    const d=await json('/api/public/support/'+encodeURIComponent(id));
    out.innerHTML=`<div><span class="support-state">${esc(stateLabel(d.status))}</span></div><p><span class="support-ticket">${esc(d.id)}</span></p><h3>${esc(d.title)}</h3><p>유형 ${esc(d.category)} · 접수 ${esc(fmt(d.createdAt))}</p>${d.reply?`<div class="support-reply"><b>운영진 답변</b>\n${esc(d.reply)}</div>`:'<p class="support-note">아직 등록된 운영진 답변이 없습니다.</p>'}`;
    out.classList.add('show');
  }catch(err){out.innerHTML=`<strong class="support-error">❌ 조회 실패</strong><p>${esc(err.message)}</p>`;out.classList.add('show')}
});