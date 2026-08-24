const C=window.PEPE_CONFIG||{},$=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const KEY="pepe_admin_token",base=String(C.apiBase||"").replace(/\/+$/,"");
const token=()=>sessionStorage.getItem(KEY)||"";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=d=>d?new Date(d).toLocaleString("ko-KR"):"-";
function uptime(s){s=Number(s)||0;const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return d?`${d}일 ${h}시간`:h?`${h}시간 ${m}분`:`${m}분`}
async function api(path,opt={}){const r=await fetch(base+path,{cache:"no-store",...opt,headers:{...(opt.headers||{}),Authorization:"Bearer "+token()}});if(r.status===401||r.status===403){sessionStorage.removeItem(KEY);location.reload();throw new Error("auth")};const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);return d}
function empty(root,text="표시할 항목이 없습니다."){root.innerHTML=`<div class="admin-empty">${text}</div>`}
async function dashboard(){
 const d=await api("/api/admin/dashboard"),s=d.stats||{},live=d.live||{},dc=live.discord||{},mc=live.minecraft||{};
 $("#admin-name").textContent=d.admin?.name||"STAFF";
 $("#stat-invite").textContent=s.invitePending??0; $("#stat-mc").textContent=s.minecraftPending??0; $("#stat-approved").textContent=s.todayApproved??0; $("#stat-denied").textContent=s.todayDenied??0; $("#stat-verified").textContent=s.verifiedMembers??0; $("#stat-linked").textContent=s.linkedMinecraftUsers??0;
 $("#nav-invite-count").textContent=s.invitePending??0; $("#nav-mc-count").textContent=s.minecraftPending??0;
 $("#live-discord").textContent=dc.online?"ONLINE":"OFFLINE"; $("#live-members").textContent=dc.members??"-"; $("#live-online").textContent=dc.onlineMembers??"-";
 $("#live-minecraft").textContent=mc.online?"ONLINE":"OFFLINE"; $("#live-players").textContent=`${mc.playersOnline??0}/${mc.playersMax??"-"}`; $("#live-tps").textContent=mc.tps??"-";
 $("#live-manager").textContent=dc.bot?.online?"ONLINE":"OFFLINE"; $("#live-ping").textContent=dc.bot?.pingMs>=0?dc.bot.pingMs+"ms":"-"; $("#live-uptime").textContent=uptime(dc.bot?.uptimeSeconds);
}
async function invites(){
 const d=await api("/api/admin/invite-requests"),root=$("#invite-list");root.innerHTML="";
 if(!d.requests?.length)return empty(root,"대기 중인 초대 요청이 없습니다.");
 d.requests.forEach(x=>{const el=document.createElement("article");el.className="admin-request";el.innerHTML=`<div class="admin-request-top"><div><h3>${esc(x.displayName||x.username)}</h3><small>${esc(x.username)} · ${esc(x.userId)}</small></div><span class="status-pending">대기</span></div><p>${esc(x.reason||"사유 없음")}</p><small>요청 ${fmt(x.createdAt)}</small><div class="request-actions"><button class="approve-btn" data-invite="${x.userId}" data-action="approve">승인</button><button class="deny-btn" data-invite="${x.userId}" data-action="deny">거절</button></div>`;root.appendChild(el)});
 root.querySelectorAll("[data-invite]").forEach(b=>b.onclick=()=>reviewInvite(b.dataset.invite,b.dataset.action));
}
async function reviewInvite(id,action){if(!confirm(action==="approve"?"이 요청을 승인할까요?":"이 요청을 거절할까요?"))return;await api(`/api/admin/invite-requests/${id}/${action}`,{method:"POST"});await Promise.all([invites(),dashboard(),history(),logs()])}
async function mcRequests(){
 const d=await api("/api/admin/minecraft-requests"),root=$("#mc-list");root.innerHTML="";
 if(!d.rows?.length)return empty(root,"대기 중인 Minecraft 인증 요청이 없습니다.");
 d.rows.forEach(x=>{const el=document.createElement("article");el.className="admin-request";el.innerHTML=`<div class="admin-request-top"><div><h3>${esc(x.discordTag||x.userId)}</h3><small>User ID · ${esc(x.userId)}</small></div><span class="status-pending">대기</span></div><p>요청시간 ${fmt(x.requestedAt)}</p><div class="request-actions"><button class="approve-btn" data-mc="${x.userId}" data-action="approve">인증 승인</button><button class="deny-btn" data-mc="${x.userId}" data-action="deny">거절</button></div>`;root.appendChild(el)});
 root.querySelectorAll("[data-mc]").forEach(b=>b.onclick=()=>reviewMc(b.dataset.mc,b.dataset.action));
}
async function reviewMc(id,action){if(!confirm(action==="approve"?"Minecraft 인증을 승인할까요?":"Minecraft 인증을 거절할까요?"))return;await api(`/api/admin/minecraft-requests/${id}/${action}`,{method:"POST"});await Promise.all([mcRequests(),dashboard(),mcUsers(),logs()])}
async function mcUsers(){const d=await api("/api/admin/minecraft-users"),root=$("#mc-users");root.innerHTML="";if(!d.rows?.length){root.innerHTML='<tr><td colspan="3">인증 유저가 없습니다.</td></tr>';return}d.rows.forEach(x=>root.insertAdjacentHTML("beforeend",`<tr><td><b>${esc(x.displayName)}</b><br><small>${esc(x.tag)}</small></td><td>${esc(x.java||"-")}</td><td>${esc(x.bedrock||"-")}</td></tr>`))}
async function history(){const d=await api("/api/admin/invite-history"),root=$("#history-list");root.innerHTML="";if(!d.rows?.length){root.innerHTML='<tr><td colspan="5">처리 내역이 없습니다.</td></tr>';return}d.rows.forEach(x=>root.insertAdjacentHTML("beforeend",`<tr><td><span class="${x.status==="approved"?"status-approved":"status-denied"}">${x.status==="approved"?"승인":"거절"}</span></td><td><b>${esc(x.displayName||x.username)}</b><br><small>${esc(x.userId)}</small></td><td>${esc(x.reason||"-")}</td><td>${fmt(x.reviewedAt)}</td><td>${esc(x.reviewedBy||"-")}</td></tr>`))}
async function logs(){const d=await api("/api/admin/logs"),root=$("#admin-log-list");root.innerHTML="";if(!d.rows?.length)return empty(root,"관리자 로그가 없습니다.");d.rows.forEach(x=>{const el=document.createElement("div");el.className="admin-log";el.innerHTML=`<span>${fmt(x.at)}</span><b>${esc(x.adminName||x.adminId||"-")}</b><p>${x.category==="minecraft_auth"?"Minecraft 인증":"Discord 초대"} · ${x.action==="approve"?"승인":"거절"} → ${esc(x.targetName||x.targetId||"-")}</p>`;root.appendChild(el)})}
const loaders={dashboard,invite:invites,minecraft:mcRequests,users:mcUsers,history,logs};
function tab(name){$$(".admin-tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));$$(".admin-pane").forEach(p=>p.classList.toggle("active",p.dataset.pane===name));const b=$(`.admin-tab[data-tab="${name}"]`);$("#admin-page-title").textContent=b?b.textContent.replace(/\d+/g,"").trim():"대시보드";loaders[name]?.().catch(e=>console.error(e))}
$$(".admin-tab").forEach(b=>b.onclick=()=>tab(b.dataset.tab));
async function refreshCurrent(){const active=$(".admin-tab.active")?.dataset.tab||"dashboard";await dashboard();if(active!=="dashboard")await loaders[active]?.()}
const u=new URL(location.href),t=u.searchParams.get("pepe_admin_token"),a=u.searchParams.get("pepe_auth");
if(t){sessionStorage.setItem(KEY,t);u.searchParams.delete("pepe_admin_token");history.replaceState({},"",u.pathname+u.search);location.reload()}
if(a)$("#admin-login-error").textContent="운영진 인증에 실패했습니다.";
if(token()){$("#admin-login-view").hidden=true;$("#admin-app").hidden=false;Promise.all([dashboard(),invites(),mcRequests()]).catch(console.error)}
$("#admin-login")?.addEventListener("click",()=>location.href=C.adminAuthUrl||base+"/auth/admin");
$("#admin-refresh")?.addEventListener("click",refreshCurrent);
$("#admin-logout")?.addEventListener("click",()=>{sessionStorage.removeItem(KEY);location.reload()});