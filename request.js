const C=window.PEPE_CONFIG||{};
const $=s=>document.querySelector(s);
const KEY="pepe_invite_token";
const base=String(C.apiBase||"").replace(/\/+$/,"");

function setInviteToken(v){localStorage.setItem(KEY,v);document.cookie=`${KEY}=${encodeURIComponent(v)}; Max-Age=43200; Path=/; Secure; SameSite=Lax`}
function clearInviteToken(){localStorage.removeItem(KEY);document.cookie=`${KEY}=; Max-Age=0; Path=/; Secure; SameSite=Lax`}
function token(){const m=document.cookie.match(new RegExp(`(?:^|; )${KEY}=([^;]*)`));return m?decodeURIComponent(m[1]):(localStorage.getItem(KEY)||"")}
function statusHtml(data){
  if(data.status==="none") return '<span class="status-pending">아직 요청하지 않았습니다.</span>';
  if(data.status==="pending") return '<span class="status-pending">⏳ 운영진 승인 대기 중입니다.</span>';
  if(data.status==="denied") return '<span class="status-denied">❌ 요청이 거절되었습니다. 필요하면 내용을 수정해 다시 요청할 수 있습니다.</span>';
  if(data.status==="approved"){
    const link=data.inviteUrl||"";
    return `<span class="status-approved">✅ 초대 요청이 승인되었습니다.</span>${link?`<p>아래 링크는 승인된 본인에게만 제공됩니다.</p><div class="invite-reveal">${link}</div><p><a class="portal-button" href="${link}" target="_blank" rel="noreferrer">Discord 입장 ↗</a></p>`:""}`;
  }
  return "상태를 확인할 수 없습니다.";
}
async function check(){
  if(!token()) return;
  try{
    const r=await fetch(base+"/api/invite/status",{cache:"no-store",headers:{Authorization:"Bearer "+token()}});
    if(r.status===401){clearInviteToken();location.reload();return}
    const d=await r.json();
    $("#request-status").innerHTML=statusHtml(d);
  }catch{$("#request-status").textContent="상태 서버에 연결할 수 없습니다."}
}
const u=new URL(location.href),t=u.searchParams.get("pepe_token"),a=u.searchParams.get("pepe_auth");
if(t){setInviteToken(t);u.searchParams.delete("pepe_token");history.replaceState({},"",u.pathname+u.search);location.reload()}
if(a){$("#login-box").insertAdjacentHTML("beforeend",`<p class="status-denied">Discord 인증 실패: ${a}</p>`)}
if(token()){ $("#login-box").hidden=true; $("#request-box").hidden=false; check(); }
$("#invite-login")?.addEventListener("click",()=>location.href=C.inviteAuthUrl||base+"/auth/invite");
$("#refresh-request")?.addEventListener("click",check);
$("#submit-request")?.addEventListener("click",async()=>{
  const reason=$("#request-reason").value.trim();
  const r=await fetch(base+"/api/invite/request",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token()},body:JSON.stringify({reason})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){$("#request-status").textContent=d.error||"요청 실패";return}
  $("#request-status").innerHTML='<span class="status-pending">✅ 요청이 접수되었습니다. 운영진 승인을 기다려주세요.</span>';
  setTimeout(check,500);
});