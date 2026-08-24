const C=window.PEPE_CONFIG||{},$=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const KEY="pepe_admin_token",base=String(C.apiBase||"").replace(/\/+$/,"");
const token=()=>sessionStorage.getItem(KEY)||"";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=d=>d?new Date(d).toLocaleString("ko-KR"):"-";
const supportStatus=s=>({received:"접수됨",processing:"처리중",answered:"답변완료",closed:"종료"})[s]||s||"-";
function uptime(s){s=Number(s)||0;const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return d?`${d}일 ${h}시간`:h?`${h}시간 ${m}분`:`${m}분`}
async function api(path,opt={}){const r=await fetch(base+path,{cache:"no-store",...opt,headers:{...(opt.headers||{}),Authorization:"Bearer "+token(),...(opt.body?{"Content-Type":"application/json"}:{})}});if(r.status===401||r.status===403){sessionStorage.removeItem(KEY);location.reload();throw new Error("auth")};const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);return d}
function empty(root,text="표시할 항목이 없습니다."){root.innerHTML=`<div class="admin-empty">${text}</div>`}
async function dashboard(){
 const d=await api("/api/admin/dashboard"),s=d.stats||{},live=d.live||{},dc=live.discord||{},mc=live.minecraft||{};
 $("#admin-name").textContent=d.admin?.name||"STAFF";
 $("#stat-invite").textContent=s.invitePending??0; $("#stat-mc").textContent=s.minecraftPending??0; $("#stat-approved").textContent=s.todayApproved??0; $("#stat-denied").textContent=s.todayDenied??0; $("#stat-verified").textContent=s.verifiedMembers??0; $("#stat-linked").textContent=s.linkedMinecraftUsers??0;
 $("#nav-invite-count").textContent=s.invitePending??0; $("#nav-mc-count").textContent=s.minecraftPending??0;
 $("#live-discord").textContent=dc.online?"ONLINE":"OFFLINE"; $("#live-members").textContent=dc.members??"-"; $("#live-online").textContent=dc.onlineMembers??"-";
 $("#live-minecraft").textContent=mc.online?"ONLINE":"OFFLINE"; $("#live-players").textContent=`${mc.playersOnline??0}/${mc.playersMax??"-"}`; $("#live-tps").textContent=mc.tps??"-";
 $("#live-manager").textContent=dc.bot?.online?"ONLINE":"OFFLINE"; $("#live-ping").textContent=dc.bot?.pingMs>=0?dc.bot.pingMs+"ms":"-"; $("#live-uptime").textContent=uptime(dc.bot?.uptimeSeconds);
 try{const q=await api('/api/admin/support');const pending=(q.rows||[]).filter(x=>x.status==='received'||x.status==='processing').length;$('#stat-support').textContent=pending;$('#nav-support-count').textContent=pending}catch{$('#stat-support').textContent='-'}
}
async function supportInbox(){
 const d=await api('/api/admin/support'),root=$('#support-list');root.innerHTML='';
 const rows=d.rows||[];const pending=rows.filter(x=>x.status==='received'||x.status==='processing').length;$('#nav-support-count').textContent=pending;$('#stat-support').textContent=pending;
 if(!rows.length)return empty(root,'접수된 홈페이지 문의가 없습니다.');
 rows.forEach(x=>{const el=document.createElement('article');el.className='admin-request';el.innerHTML=`<div class="admin-request-top"><div><h3>${esc(x.title||x.id)}</h3><small>${esc(x.id)} · ${esc(x.category||'-')} · ${esc(x.discordName||'미입력')}</small></div><span class="status-${x.status==='closed'?'denied':x.status==='answered'?'approved':'pending'}">${esc(supportStatus(x.status))}</span></div><p style="white-space:pre-wrap">${esc(x.content||'')}</p><small>접수 ${fmt(x.createdAt)} · 갱신 ${fmt(x.updatedAt)}</small>${x.reply?`<p style="white-space:pre-wrap;border-left:3px solid #b8ff5a;padding-left:12px"><b>운영진 답변</b><br>${esc(x.reply)}</p>`:''}<div class="request-actions"><button class="portal-button secondary" data-support-status="${esc(x.id)}" data-value="processing">처리중</button><button class="approve-btn" data-support-reply="${esc(x.id)}">답변</button><button class="deny-btn" data-support-status="${esc(x.id)}" data-value="closed">종료</button></div>`;root.appendChild(el)});
 root.querySelectorAll('[data-support-status]').forEach(b=>b.onclick=()=>setSupportStatus(b.dataset.supportStatus,b.dataset.value));
 root.querySelectorAll('[data-support-reply]').forEach(b=>b.onclick=()=>replySupport(b.dataset.supportReply));
}
async function setSupportStatus(id,status){if(!confirm(`문의 ${id} 상태를 '${supportStatus(status)}'으로 변경할까요?`))return;await api(`/api/admin/support/${id}/status`,{method:'POST',body:JSON.stringify({status})});await Promise.all([supportInbox(),dashboard(),logs()])}
async function replySupport(id){const reply=prompt('운영진 답변을 입력하세요.');if(reply===null)return;if(!reply.trim())return alert('답변을 입력해주세요.');await api(`/api/admin/support/${id}/reply`,{method:'POST',body:JSON.stringify({reply:reply.trim()})});await Promise.all([supportInbox(),dashboard(),logs()])}
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
async function history(){const d=await api("/api/admin/invite-history"),root=$("#history-list");root.innerHTML="";if(!d.rows?.length){root.innerHTML='<tr><td colspan="5">아직 처리된 초대 요청 기록이 없습니다.</td></tr>';return}d.rows.forEach(x=>root.insertAdjacentHTML("beforeend",`<tr><td><span class="${x.status==="approved"?"status-approved":"status-denied"}">${x.status==="approved"?"승인":"거절"}</span></td><td><b>${esc(x.displayName||x.username)}</b><br><small>${esc(x.userId)}</small></td><td>${esc(x.reason||"-")}</td><td>${fmt(x.reviewedAt)}</td><td>${esc(x.reviewedBy||"-")}</td></tr>`))}
async function logs(){const d=await api("/api/admin/logs"),root=$("#admin-log-list");root.innerHTML="";if(!d.rows?.length)return empty(root,"아직 기록된 관리자 활동이 없습니다.");d.rows.forEach(x=>{const label=x.category==='minecraft_auth'?'Minecraft 인증':x.category==='support'?'홈페이지 문의':'Discord 초대';const action=x.category==='support'?(x.action==='reply'?'답변':'상태 변경'):(x.action==='approve'?'승인':'거절');const el=document.createElement("div");el.className="admin-log";el.innerHTML=`<span>${fmt(x.at)}</span><b>${esc(x.adminName||x.adminId||"-")}</b><p>${label} · ${action} → ${esc(x.targetName||x.targetId||"-")}</p>`;root.appendChild(el)})}
const loaders={dashboard,support:supportInbox,invite:invites,minecraft:mcRequests,users:mcUsers,history,logs};
function tab(name){$$(".admin-tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));$$(".admin-pane").forEach(p=>p.classList.toggle("active",p.dataset.pane===name));const b=$(`.admin-tab[data-tab="${name}"]`);$("#admin-page-title").textContent=b?b.textContent.replace(/\d+/g,"").trim():"대시보드";loaders[name]?.().catch(e=>console.error(e))}
$$(".admin-tab").forEach(b=>b.onclick=()=>tab(b.dataset.tab));
async function refreshCurrent(){const active=$(".admin-tab.active")?.dataset.tab||"dashboard";await dashboard();if(active!=="dashboard")await loaders[active]?.()}
const u=new URL(location.href),t=u.searchParams.get("pepe_admin_token"),a=u.searchParams.get("pepe_auth");
if(t){sessionStorage.setItem(KEY,t);u.searchParams.delete("pepe_admin_token");history.replaceState({},"",u.pathname+u.search);location.reload()}
if(a)$("#admin-login-error").textContent="운영진 인증에 실패했습니다.";
if(token()){$("#admin-login-view").hidden=true;$("#admin-app").hidden=false;Promise.all([dashboard(),supportInbox(),invites(),mcRequests()]).catch(console.error)}
$("#admin-login")?.addEventListener("click",()=>location.href=C.adminAuthUrl||base+"/auth/admin");
$("#admin-refresh")?.addEventListener("click",refreshCurrent);
$("#admin-logout")?.addEventListener("click",()=>{sessionStorage.removeItem(KEY);location.reload()});
$("#sync-notices")?.addEventListener("click", async () => {
  const btn = $("#sync-notices");
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = "동기화 중...";
  try {
    const d = await api("/api/admin/sync-announcements", { method: "POST" });
    btn.textContent = d.posted > 0 ? `✅ ${d.posted}건 게시` : "✅ 최신 상태";
  } catch (e) {
    console.error(e);
    btn.textContent = "❌ 동기화 실패";
  }
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = old;
  }, 1600);
});