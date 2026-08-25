(()=>{
  const C=window.PEPE_CONFIG||{};
  const $=s=>document.querySelector(s);
  const $$=s=>document.querySelectorAll(s);
  const base=String(C.apiBase||"").replace(/\/+$/,"");
  const KEY="pepe_verified_token";
  const COOKIE=KEY;
  let memberData=null;
  let rankingKey="playtime";

  function readCookie(name){
    const m=document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m?decodeURIComponent(m[1]):"";
  }

  function tokenPayload(token){
    try{
      const body=String(token||"").split(".")[0];
      if(!body)return null;
      const fixed=body.replace(/-/g,"+").replace(/_/g,"/");
      const json=decodeURIComponent(atob(fixed).split("").map(c=>`%${c.charCodeAt(0).toString(16).padStart(2,"0")}`).join(""));
      return JSON.parse(json);
    }catch{return null;}
  }

  function tokenValid(token){
    if(!token)return false;
    const p=tokenPayload(token);
    if(!p?.exp)return true;
    return Number(p.exp)>Math.floor(Date.now()/1000)+5;
  }

  function saveToken(token){
    if(!tokenValid(token))return clearToken();
    sessionStorage.setItem(KEY,token);
    localStorage.setItem(KEY,token);
    const p=tokenPayload(token);
    const max=p?.exp?Math.max(0,Number(p.exp)-Math.floor(Date.now()/1000)):2592000;
    document.cookie=`${COOKIE}=${encodeURIComponent(token)}; Max-Age=${max}; Path=/; Secure; SameSite=Lax`;
  }

  function getToken(){
    const candidates=[localStorage.getItem(KEY),sessionStorage.getItem(KEY),readCookie(COOKIE)];
    const token=candidates.find(tokenValid)||"";
    if(token){
      if(localStorage.getItem(KEY)!==token||sessionStorage.getItem(KEY)!==token)saveToken(token);
      return token;
    }
    clearToken(false);
    return "";
  }

  function clearToken(broadcast=true){
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
    document.cookie=`${COOKIE}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
    if(broadcast){
      try{localStorage.setItem("pepe_auth_event",String(Date.now()));localStorage.removeItem("pepe_auth_event");}catch{}
    }
  }

  function migrateOAuthToken(){
    const url=new URL(location.href);
    const fromUrl=url.searchParams.get("pepe_token");
    const fromSession=sessionStorage.getItem(KEY);
    if(fromUrl){
      saveToken(fromUrl);
      url.searchParams.delete("pepe_token");
      history.replaceState({},"",url.pathname+url.search+url.hash);
    }else if(fromSession){
      saveToken(fromSession);
    }
  }

  function setMemberState(unlocked,name=""){
    document.body.classList.toggle("mc-member-authenticated",!!unlocked);

    const lock=$("#mc-member-lock");
    const open=$("#mc-member-open");
    if(lock)lock.hidden=!!unlocked;
    if(open)open.hidden=!unlocked;

    const who=$("#mc-member-name");
    if(who)who.textContent=name||"PEPE MEMBER";

    // 기존 접속정보 카드도 MEMBER ZONE 인증 상태와 완전히 동기화한다.
    // 인증 완료 후 Discord 인증 버튼이 다시 노출되는 모순된 UI를 방지한다.
    const serverLocked=$("#server-link-locked");
    const serverOpen=$("#server-link-unlocked");
    const legacyLogin=$("#verified-login");
    const authMessage=$("#auth-message");

    if(serverLocked)serverLocked.hidden=!!unlocked;
    if(serverOpen)serverOpen.hidden=!unlocked;
    if(legacyLogin)legacyLogin.hidden=!!unlocked;
    if(authMessage&&unlocked)authMessage.textContent="";
  }

  function fmt(v){
    if(v===undefined||v===null||v==="")return "-";
    return typeof v==="number"?v.toLocaleString("ko-KR"):String(v);
  }

  function normalizePlayers(data){
    const p=data?.players||{};
    if(Array.isArray(p.details)&&p.details.length){
      return p.details.map((x,i)=>typeof x==="string"?{name:x,platform:p.platforms?.[x]||"ONLINE"}:{name:x?.name||x?.username||x?.playerName||`Player ${i+1}`,platform:x?.platform||x?.edition||p.platforms?.[x?.name]||"ONLINE",avatar:x?.avatar||x?.headUrl||x?.skinHead||""});
    }
    return (Array.isArray(p.names)?p.names:[]).map(name=>({name,platform:p.platforms?.[name]||"ONLINE",avatar:""}));
  }

  function rankingRows(data,key){
    const ranks=data?.survival?.rankings||{};
    const aliases={playtime:["playtime","playTime","time"],kills:["kills","kill"],deaths:["deaths","death"],advancements:["advancements","achievements","advancement"],weekly:["weekly","weeklyActivity","weekActivity","weeklyPlaytime"]};
    for(const k of aliases[key]||[key])if(Array.isArray(ranks[k]))return ranks[k];
    return [];
  }

  function renderRanking(data,key=rankingKey){
    const root=$("#mc-ranking-list");if(!root)return;
    const rows=rankingRows(data,key).slice(0,10);
    if(!rows.length){root.innerHTML='<div class="mc-empty-state">아직 표시할 랭킹 데이터가 없습니다.</div>';return;}
    root.innerHTML=rows.map((r,i)=>{
      const name=typeof r==="string"?r:(r?.name||r?.username||r?.playerName||"Unknown");
      const value=typeof r==="string"?"":(r?.value??r?.score??r?.playtime??r?.kills??r?.deaths??r?.advancements??r?.weekly??"-");
      return `<div class="mc-ranking-row"><span class="mc-ranking-pos">#${i+1}</span><strong class="mc-ranking-name">${String(name)}</strong><span class="mc-ranking-value">${fmt(value)}</span></div>`;
    }).join("");
  }

  function renderPrivate(data){
    memberData=data;
    const server=data?.server||{},connection=data?.connection||{},stats=data?.survival?.stats||{};
    const players=normalizePlayers(data);
    const playerRoot=$("#mc-player-list");
    if(playerRoot){
      playerRoot.innerHTML=players.length?players.map(p=>`<article class="mc-player-card"><div class="mc-player-avatar">${p.avatar?`<img src="${p.avatar}" alt="" loading="lazy">`:"🙂"}</div><div><strong>${String(p.name)}</strong><small>${String(p.platform).toUpperCase()}</small></div></article>`).join(""):'<div class="mc-empty-state">현재 접속 중인 플레이어가 없습니다.</div>';
    }
    const values={"#stat-total-players":stats.totalPlayers,"#stat-total-playtime":stats.totalPlaytime,"#stat-total-deaths":stats.totalDeaths,"#stat-advancements":stats.advancements};
    Object.entries(values).forEach(([sel,val])=>{const el=$(sel);if(el)el.textContent=fmt(val)});
    const note=$("#stats-note");if(note)note.textContent="PEPE 인증 멤버에게만 제공되는 야생 서버 기록입니다.";
    const ja=$("#java-address"),ba=$("#bedrock-address");if(ja)ja.textContent=connection.javaAddress||"-";if(ba)ba.textContent=connection.bedrockAddress||"-";
    const tps=$("#mc-member-tps"),uptime=$("#mc-member-uptime");if(tps)tps.textContent=server.tps==null?"-":Number(server.tps).toFixed(1);if(uptime)uptime.textContent=server.uptime||"-";
    renderRanking(data,rankingKey);
  }

  async function loadMember(){
    const token=getToken();
    if(!token){memberData=null;setMemberState(false);return;}
    try{
      const r=await fetch(`${base}/api/private/minecraft?t=${Date.now()}`,{cache:"no-store",headers:{Authorization:`Bearer ${token}`}});
      if(r.status===401||r.status===403){clearToken();memberData=null;setMemberState(false);return;}
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const data=await r.json();
      setMemberState(true,data?.member?.displayName||"");
      renderPrivate(data);
    }catch(e){
      console.error("Minecraft member zone:",e);
      const msg=$("#mc-member-message");if(msg)msg.textContent="멤버 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
    }
  }

  function login(){location.href=C.authUrl||`${base}/auth/discord`;}

  migrateOAuthToken();
  $("#mc-member-login")?.addEventListener("click",login);
  $("#auth-logout")?.addEventListener("click",()=>{clearToken();memberData=null;setMemberState(false);});
  $("#mc-member-logout")?.addEventListener("click",()=>{clearToken();memberData=null;setMemberState(false);});

  $$(".ranking-tab").forEach(btn=>btn.addEventListener("click",()=>{rankingKey=btn.dataset.ranking||"playtime";if(memberData)renderRanking(memberData,rankingKey)}));

  window.addEventListener("storage",e=>{
    if(e.key===KEY||e.key==="pepe_auth_event")loadMember();
  });
  window.addEventListener("focus",loadMember);

  loadMember();
  setInterval(loadMember,30000);
  setInterval(()=>{if(memberData)renderPrivate(memberData)},3000);

  window.PEPE_MEMBER_AUTH={getToken,saveToken,clearToken,refresh:loadMember};
})();