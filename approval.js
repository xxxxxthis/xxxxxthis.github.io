const C=window.PEPE_CONFIG||{},$=s=>document.querySelector(s);
const KEY="pepe_admin_token",base=String(C.apiBase||"").replace(/\/+$/,"");
const token=()=>sessionStorage.getItem(KEY)||"";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function label(s){return s==="approved"?"승인":s==="denied"?"거절":"대기"}
function cls(s){return s==="approved"?"status-approved":s==="denied"?"status-denied":"status-pending"}
async function load(){
  const r=await fetch(base+"/api/admin/invite-requests",{cache:"no-store",headers:{Authorization:"Bearer "+token()}});
  if(r.status===401||r.status===403){sessionStorage.removeItem(KEY);location.reload();return}
  const d=await r.json(),root=$("#request-list"); root.innerHTML="";
  if(!d.requests?.length){root.innerHTML="<p>요청이 없습니다.</p>";return}
  d.requests.forEach(x=>{
    const el=document.createElement("div");el.className="request-item";
    el.innerHTML=`<div class="request-item-head"><div><b>${esc(x.displayName||x.username)}</b><br><small>${esc(x.username)} · ${esc(x.userId)}</small></div><span class="${cls(x.status)}">${label(x.status)}</span></div>
    <p>${esc(x.reason||"사유 없음")}</p><small>요청: ${esc(x.createdAt||"-")}</small>
    <div class="request-actions"><button class="approve-btn" data-id="${x.userId}" data-action="approve">승인</button><button class="deny-btn" data-id="${x.userId}" data-action="deny">거절</button></div>`;
    root.appendChild(el);
  });
  root.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>review(b.dataset.id,b.dataset.action));
}
async function review(id,action){
  const r=await fetch(`${base}/api/admin/invite-requests/${id}/${action}`,{method:"POST",headers:{Authorization:"Bearer "+token()}});
  if(!r.ok){alert("처리 실패");return} load();
}
const u=new URL(location.href),t=u.searchParams.get("pepe_admin_token"),a=u.searchParams.get("pepe_auth");
if(t){sessionStorage.setItem(KEY,t);u.searchParams.delete("pepe_admin_token");history.replaceState({},"",u.pathname+u.search);location.reload()}
if(a)$("#admin-login-box").insertAdjacentHTML("beforeend",'<p class="status-denied">운영진 인증에 실패했습니다.</p>');
if(token()){ $("#admin-login-box").hidden=true; $("#admin-panel").hidden=false; load(); }
$("#admin-login")?.addEventListener("click",()=>location.href=C.adminAuthUrl||base+"/auth/admin");
$("#refresh-list")?.addEventListener("click",load);