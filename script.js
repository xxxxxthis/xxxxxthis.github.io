const C = window.PEPE_CONFIG || {};
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const toast = $("#toast");

function showToast(text = "복사 완료!") {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1200);
}

function setText(selector, value) {
  const el = $(selector);
  if (el) el.textContent = value;
}

function setDot(selector, state) {
  const el = $(selector);
  if (!el) return;
  el.classList.remove("ok", "bad", "loading");
  el.classList.add(state === "ok" ? "ok" : state === "bad" ? "bad" : "loading");
}

function formatUptime(seconds) {
  let s = Math.max(0, Number(seconds) || 0);
  const d = Math.floor(s / 86400);
  s %= 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}일 ${h}시간`;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

async function fetchJson(url, timeout = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      cache: "no-store"
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

// 기존 1.2.0 복사 버튼 그대로 유지
$$("[data-copy-target]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const target = document.getElementById(btn.dataset.copyTarget);
    const value = target?.textContent?.trim() || "";
    try {
      await navigator.clipboard.writeText(value);
      showToast();
    } catch {
      prompt("주소를 복사하세요:", value);
    }
  });
});

// GitHub Pages에서도 로딩 가능한 정적 JSON
async function loadStaff() {
  const root = $("#staff-list");
  if (!root) return;
  try {
    const items = await fetchJson("staff.json");
    root.innerHTML = "";
    items.forEach(s => {
      const el = document.createElement("article");
      el.className = "staff-card";
      el.innerHTML = `
        <div class="staff-avatar">${s.emoji || "🐸"}</div>
        <h3>${s.name}</h3>
        <span class="staff-role">${s.role || "STAFF"}</span>
        <p>${s.description || ""}</p>
      `;
      root.appendChild(el);
    });
  } catch {
    root.innerHTML = "<p>운영진 정보를 불러오지 못했습니다.</p>";
  }
}

let noticeData = [];
let noticeFilter = "all";
let noticeExpanded = false;
const NOTICE_COLLAPSED_COUNT = 5;

function typeLabel(type) {
  return ({
    notice: "공지",
    update: "업데이트",
    minecraft: "Minecraft"
  })[type] || type;
}

function typeEmoji(type) {
  return ({
    notice: "📢",
    update: "🛠️",
    minecraft: "⛏️"
  })[type] || "📌";
}

function filteredNotices() {
  return noticeFilter === "all"
    ? noticeData
    : noticeData.filter(n => n.type === noticeFilter);
}

function updateNoticeToggle(total) {
  const btn = $("#notice-toggle");
  if (!btn) return;

  if (total <= NOTICE_COLLAPSED_COUNT) {
    btn.hidden = true;
    return;
  }

  btn.hidden = false;
  btn.textContent = noticeExpanded
    ? "숨기기 ↑"
    : `더보기 +${total - NOTICE_COLLAPSED_COUNT}`;
}

function renderNotices() {
  const root = $("#notices-list");
  const items = filteredNotices();
  const visible = noticeExpanded
    ? items
    : items.slice(0, NOTICE_COLLAPSED_COUNT);

  root.innerHTML = "";

  if (!visible.length) {
    root.innerHTML = "<p class='muted'>표시할 공지가 없습니다.</p>";
    updateNoticeToggle(0);
    return;
  }

  visible.forEach(n => {
    const el = document.createElement("div");
    el.className = `notice-card notice-${n.type || "notice"}`;
    el.innerHTML = `
      <time>${n.date}</time>
      <div>
        <h3><span class="notice-icon">${typeEmoji(n.type)}</span>${n.title}</h3>
        <p>${n.text}</p>
      </div>
      <span class="notice-type notice-type-${n.type || "notice"}">${typeLabel(n.type)}</span>
    `;
    root.appendChild(el);
  });

  updateNoticeToggle(items.length);
}

async function loadNotices() {
  if (!$("#notices-list")) return;
  try {
    noticeData = await fetchJson(`announcements.json?t=${Date.now()}`);
    noticeData.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    renderNotices();
  } catch {
    $("#notices-list").innerHTML = "<p>공지사항을 불러오지 못했습니다.</p>";
  }
}

$$(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".filter").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    noticeFilter = btn.dataset.filter || "all";
    noticeExpanded = false;
    renderNotices();
  });
});

$("#notice-toggle")?.addEventListener("click", () => {
  noticeExpanded = !noticeExpanded;
  renderNotices();

  if (!noticeExpanded) {
    $("#notices")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});


let PEPE_MC_LIVE_DATA = null;
let PEPE_RANKING_KEY = "playtime";

function firstValue(obj, keys, fallback = null) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return fallback;
}

function formatStatValue(value) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "number") return value.toLocaleString("ko-KR");
  return String(value);
}

function normalizePlayers(m) {
  const raw = firstValue(m, ["players", "onlinePlayers", "playerList"], []);
  if (!Array.isArray(raw)) return [];
  return raw.map((p, i) => {
    if (typeof p === "string") return { name: p, platform: "ONLINE" };
    return {
      name: p?.name || p?.username || p?.playerName || `Player ${i + 1}`,
      platform: p?.platform || p?.edition || p?.client || "ONLINE",
      avatar: p?.avatar || p?.headUrl || p?.skinHead || ""
    };
  });
}

function rankingSource(data, key) {
  const m = data?.minecraft || {};
  const ranks = m.rankings && typeof m.rankings === "object" ? m.rankings : {};
  if (Array.isArray(ranks[key])) return ranks[key];

  // Older PEPE LIVE payload compatibility.
  const legacy = {
    playtime: ["playTime", "time"],
    kills: ["kill"],
    deaths: ["death"],
    advancements: ["achievements", "advancement"],
    weekly: ["weeklyActivity", "weekActivity", "weeklyPlaytime"]
  };
  for (const alias of legacy[key] || []) {
    if (Array.isArray(ranks[alias])) return ranks[alias];
  }
  return [];
}

function renderRanking(data, key = PEPE_RANKING_KEY) {
  const root = $("#mc-ranking-list");
  if (!root) return;
  const rows = rankingSource(data, key).slice(0, 10);
  if (!rows.length) {
    const labels = { playtime:"플레이타임", kills:"킬", deaths:"데스", advancements:"발전과제", weekly:"주간 활동" };
    root.innerHTML = `<div class="mc-empty-state">${labels[key] || "선택한"} 랭킹 데이터가 아직 없습니다.</div>`;
    return;
  }
  root.innerHTML = rows.map((r, i) => {
    const name = typeof r === "string" ? r : (r?.name || r?.username || r?.playerName || "Unknown");
    const value = typeof r === "string" ? "" : firstValue(r, ["value","score","playtime","kills","deaths","advancements","weekly","weeklyActivity","weeklyPlaytime"], "-");
    return `<div class="mc-ranking-row"><span class="mc-ranking-pos">#${i+1}</span><strong class="mc-ranking-name">${name}</strong><span class="mc-ranking-value">${formatStatValue(value)}</span></div>`;
  }).join("");
}

function renderMinecraftPortal(data) {
  PEPE_MC_LIVE_DATA = data;
  const m = data?.minecraft || {};
  const online = !!m.online;
  const tpsRaw = firstValue(m, ["tps", "tps1m", "currentTps"], null);
  const tps = typeof tpsRaw === "number" ? tpsRaw.toFixed(1) : (tpsRaw ?? "-");
  const uptimeRaw = firstValue(m, ["uptimeSeconds", "uptime", "serverUptimeSeconds"], null);
  const uptime = typeof uptimeRaw === "number" ? formatUptime(uptimeRaw) : (uptimeRaw || "-");

  setText("#mc-tps-live", tps);
  setText("#live-player-count", `${m.playersOnline ?? 0}/${m.playersMax ?? "-"}`);
  setText("#live-version", m.version || "-");
  setText("#live-tps", tps);
  setText("#live-uptime", uptime);
  setText("#mc-live-label", online ? "ONLINE" : "OFFLINE");
  setDot("#mc-live-dot", online ? "ok" : "bad");

  const playerRoot = $("#mc-player-list");
  if (playerRoot) {
    const players = normalizePlayers(m);
    if (players.length) {
      playerRoot.innerHTML = players.map(p => `<article class="mc-player-card"><div class="mc-player-avatar">${p.avatar ? `<img src="${p.avatar}" alt="" loading="lazy">` : "🙂"}</div><div><strong>${p.name}</strong><small>${String(p.platform).toUpperCase()}</small></div></article>`).join("");
    } else if (online && Number(m.playersOnline || 0) === 0) {
      playerRoot.innerHTML = '<div class="mc-empty-state">현재 접속 중인 플레이어가 없습니다.</div>';
    } else {
      playerRoot.innerHTML = '<div class="mc-empty-state">현재 표시할 플레이어 정보가 없습니다.</div>';
    }
  }

  const stats = m.stats && typeof m.stats === "object" ? m.stats : {};
  const totalPlayers = stats.totalPlayers ?? m.totalPlayers ?? null;
  const totalPlaytime = stats.totalPlaytime ?? m.totalPlaytime ?? null;
  const totalDeaths = stats.totalDeaths ?? m.totalDeaths ?? null;
  const advancements = stats.advancements ?? m.totalAdvancements ?? null;
  setText("#stat-total-players", formatStatValue(totalPlayers));
  setText("#stat-total-playtime", formatStatValue(totalPlaytime));
  setText("#stat-total-deaths", formatStatValue(totalDeaths));
  setText("#stat-advancements", formatStatValue(advancements));
  const anyStats = [totalPlayers,totalPlaytime,totalDeaths,advancements].some(v => v !== null && v !== undefined);
  setText("#stats-note", anyStats ? "PEPE MANAGER 공개 데이터 기준 · 새로고침 시 갱신" : "현재 표시할 서버 통계가 없습니다.");
  renderRanking(data, PEPE_RANKING_KEY);
}

$$('.ranking-tab').forEach(btn => btn.addEventListener('click', () => {
  $$('.ranking-tab').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  PEPE_RANKING_KEY = btn.dataset.ranking || 'playtime';
  renderRanking(PEPE_MC_LIVE_DATA, PEPE_RANKING_KEY);
}));

async function refreshLiveStatus() {
  // Loading state
  setText("#overall-state", "상태 확인 중...");
  setDot("#overall-dot", "loading");
  setText("#mc-main-state", "-");
  setText("#mc-page-version", "-");
  setText("#discord-main-state", "-");
  setText("#player-count", "-");
  setText("#discord-member-count", "-");
  setText("#java-live", "확인 중");
  setText("#bedrock-live", "확인 중");
  setDot("#java-dot", "loading");
  setDot("#bedrock-dot", "loading");

  try {
    const base = String(C.apiBase || "").replace(/\/+$/, "");
    const data = await fetchJson(`${base}/api/public/status?t=${Date.now()}`);

    if (!data?.ok) throw new Error(data?.error || "API ok=false");

    const d = data.discord || {};
    const m = data.minecraft || {};
    const discordOnline = !!d.online;
    const minecraftOnline = !!m.online;

    renderMinecraftPortal(data);

    // Header status card
    if (document.body.classList.contains("minecraft-page")) {
      setText("#overall-state", minecraftOnline ? "Server Online" : "Server Offline");
      setDot("#overall-dot", minecraftOnline ? "ok" : "bad");
    } else if (discordOnline && minecraftOnline) {
      setText("#overall-state", "All Systems Online");
      setDot("#overall-dot", "ok");
    } else if (discordOnline || minecraftOnline) {
      setText("#overall-state", "Partial Online");
      setDot("#overall-dot", "loading");
    } else {
      setText("#overall-state", "Systems Offline");
      setDot("#overall-dot", "bad");
    }

    setText("#mc-main-state", minecraftOnline ? "ONLINE" : "OFFLINE");
    setText("#discord-main-state", discordOnline ? "ONLINE" : "OFFLINE");
    setText("#player-count", `${m.playersOnline ?? 0}/${m.playersMax ?? "-"}`);
    setText("#mc-version-live", m.version || "정보 없음");
    setText("#mc-page-version", m.version || "정보 없음");
    setText("#discord-member-count", d.members ?? "-");

    // Minecraft panel
    setText("#java-live", minecraftOnline ? "ONLINE" : "OFFLINE");
    setText("#bedrock-live", minecraftOnline ? "ONLINE" : "OFFLINE");
    setDot("#java-dot", minecraftOnline ? "ok" : "bad");
    setDot("#bedrock-dot", minecraftOnline ? "ok" : "bad");



    // Discord panel
    setText("#discord-total", d.members ?? "-");
    setText("#discord-online", d.onlineMembers ?? "-");
    setText("#discord-name", d.name || "PEPE RESTAURANT");

    const onlineText = d.onlineMembers == null
      ? "온라인 인원 정보를 확인할 수 없습니다."
      : `${d.onlineMembers}명이 현재 온라인입니다.`;
    setText("#discord-status-text", onlineText);

    setText("#manager-status", d.bot?.online ? "ONLINE" : "OFFLINE");
    setText("#manager-uptime", formatUptime(d.bot?.uptimeSeconds));
    const ping = typeof d.bot?.pingMs === "number" && d.bot.pingMs >= 0
      ? `${d.bot.pingMs}ms`
      : "-";
    setText("#manager-ping", ping);

  } catch (err) {
    console.error("PEPE live API error:", err);

    setText("#overall-state", "API 연결 실패");
    setDot("#overall-dot", "bad");
    setText("#mc-main-state", "UNKNOWN");
    setText("#mc-version-live", "확인 불가");
    setText("#mc-page-version", "확인 불가");
    setText("#discord-main-state", "UNKNOWN");
    setText("#java-live", "UNKNOWN");
    setText("#bedrock-live", "UNKNOWN");
    setDot("#java-dot", "bad");
    setDot("#bedrock-dot", "bad");


    setText("#discord-status-text", "PEPE MANAGER API에 연결할 수 없습니다.");
    setText("#manager-status", "UNKNOWN");
    setText("#manager-uptime", "-");
    setText("#manager-ping", "-");
  }
}

$("#refresh-all")?.addEventListener("click", refreshLiveStatus);

loadStaff();
loadNotices();
refreshLiveStatus();

// 30초마다 PEPE MANAGER API 갱신
setInterval(refreshLiveStatus, 30 * 1000);

// 기존 UI 애니메이션 유지
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add("visible");
  });
}, { threshold: 0.08 });

document.querySelectorAll("section, article, .feature-strip").forEach(el => {
  el.classList.add("reveal");
  observer.observe(el);
});

const topBtn = $("#top-button");
window.addEventListener("scroll", () => {
  if (topBtn) topBtn.style.display = window.scrollY > 700 ? "block" : "none";
});
if (topBtn) topBtn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

// Service Worker
if ("serviceWorker" in navigator && (location.protocol === "http:" || location.protocol === "https:")) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}


// ======================================================
// VERIFIED MINECRAFT SERVER LINKS
// ======================================================
const PEPE_TOKEN_KEY = "pepe_verified_token";
const PEPE_INVITE_TOKEN_KEY = "pepe_invite_token";

function readCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

function getPepeToken() {
  return sessionStorage.getItem(PEPE_TOKEN_KEY)
    || readCookie(PEPE_INVITE_TOKEN_KEY)
    || localStorage.getItem(PEPE_INVITE_TOKEN_KEY)
    || "";
}

function clearPepeToken() {
  sessionStorage.removeItem(PEPE_TOKEN_KEY);
  localStorage.removeItem(PEPE_INVITE_TOKEN_KEY);
  document.cookie = `${PEPE_INVITE_TOKEN_KEY}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
}

function setAuthMessage(text) {
  setText("#auth-message", text || "");
}

function showServerLinks(unlocked) {
  const locked = $("#server-link-locked");
  const open = $("#server-link-unlocked");
  if (locked) locked.hidden = !!unlocked;
  if (open) open.hidden = !unlocked;
}

async function loadVerifiedServerLinks() {
  const token = getPepeToken();
  if (!token) {
    showServerLinks(false);
    return;
  }

  try {
    const base = String(C.apiBase || "").replace(/\/+$/, "");
    const r = await fetch(`${base}/api/private/server-links`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (r.status === 401 || r.status === 403) {
      clearPepeToken();
      showServerLinks(false);
      setAuthMessage("승인된 Minecraft 멤버만 주소를 확인할 수 있습니다.");
      return;
    }

    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const data = await r.json();
    setText("#java-address", data.javaAddress || "-");
    setText("#bedrock-address", data.bedrockAddress || "-");
    showServerLinks(true);
  } catch (e) {
    console.error("Verified server links:", e);
    showServerLinks(false);
    setAuthMessage("인증 서버에 연결할 수 없습니다.");
  }
}

function handleOAuthReturn() {
  const url = new URL(location.href);
  const token = url.searchParams.get("pepe_token");
  const state = url.searchParams.get("pepe_auth");

  if (token) {
    sessionStorage.setItem(PEPE_TOKEN_KEY, token);
    url.searchParams.delete("pepe_token");
    history.replaceState({}, "", url.pathname + url.search + url.hash);
    showToast("Minecraft 인증 확인 완료");
  } else if (state) {
    const message = state === "denied"
      ? "Minecraft 인증 역할이 없는 계정입니다."
      : state === "invalid"
      ? "Discord 인증 요청이 만료되었습니다."
      : "Discord 인증 중 오류가 발생했습니다.";
    setAuthMessage(message);
    url.searchParams.delete("pepe_auth");
    history.replaceState({}, "", url.pathname + url.search + url.hash);
  }
}

$("#verified-login")?.addEventListener("click", () => {
  location.href = C.authUrl || `${String(C.apiBase || "").replace(/\/+$/, "")}/auth/discord`;
});

$("#auth-logout")?.addEventListener("click", () => {
  clearPepeToken();
  showServerLinks(false);
  setAuthMessage("");
  showToast("인증 정보를 지웠습니다.");
});

handleOAuthReturn();
loadVerifiedServerLinks();


// ===== PEPE SYSTEMS POPUP =====
const PEPE_SYSTEM_INFO = {
  manager: {
    icon: "🛡️",
    kicker: "IN-HOUSE · CORE SYSTEM",
    title: "PEPE MANAGER",
    lead: "PEPE RESTAURANT의 운영을 위해 직접 설계하고 개발한 통합 관리 봇입니다.",
    body: [
      "단순한 명령어 봇이 아니라 Discord 커뮤니티와 Minecraft 서버 운영을 하나의 흐름으로 연결하는 PEPE의 핵심 시스템입니다.",
      "유저 관리, 역할 관리, Minecraft 인증, 활동 시스템, 티켓, 공지와 운영 자동화 등 서버에서 반복되는 관리 작업을 PEPE RESTAURANT 환경에 맞춰 처리합니다.",
      "웹사이트의 서버 상태와 승인 시스템도 PEPE MANAGER API와 연결되어 있으며, 공개하면 안 되는 서버 정보는 권한을 확인한 사용자에게만 전달합니다."
    ],
    tags: ["Discord 관리", "Minecraft 연동", "인증", "티켓", "활동 시스템", "운영 자동화"]
  },
  kkobung: {
    icon: "🤖",
    kicker: "PEPE ONLY · COMMUNITY BOT",
    title: "꼬붕봇",
    lead: "PEPE 커뮤니티에서 편하게 사용할 수 있는 기능을 담당하는 전용 봇입니다.",
    body: [
      "PEPE MANAGER가 운영과 관리에 집중한다면, 꼬붕봇은 커뮤니티 구성원이 직접 사용하는 편의 기능을 중심으로 움직입니다.",
      "서버 안에서 자주 사용하는 기능을 빠르게 호출할 수 있도록 구성하고, PEPE RESTAURANT의 분위기에 맞춘 전용 기능을 계속 추가할 수 있도록 분리된 봇으로 운영합니다.",
      "관리 시스템과 사용자 편의 기능을 분리해 핵심 운영 기능은 안정적으로 유지하면서 커뮤니티 기능은 자유롭게 확장할 수 있습니다."
    ],
    tags: ["PEPE 전용", "커뮤니티", "편의 기능", "확장형 봇"]
  },
  auth: {
    icon: "🔐",
    kicker: "DISCORD ↔ MINECRAFT",
    title: "인증 시스템",
    lead: "Discord 사용자와 Minecraft 플레이어를 연결해 승인된 사용자만 서버 정보를 확인하고 접속할 수 있게 합니다.",
    body: [
      "사용자가 Minecraft 인증을 요청하면 운영진이 요청을 확인해 승인하거나 거절할 수 있습니다.",
      "승인된 사용자는 Discord에서 인증 역할을 받고 Java 또는 Bedrock 닉네임을 등록할 수 있습니다.",
      "웹사이트의 Minecraft 서버 주소 역시 인증 역할이나 운영 권한을 확인한 뒤에만 표시되도록 구성되어 있습니다."
    ],
    tags: ["역할 인증", "Java", "Bedrock", "접근 제어"]
  },
  activity: {
    icon: "📊",
    kicker: "XP · LEVEL · RANKING",
    title: "활동 시스템",
    lead: "커뮤니티 활동을 XP와 레벨로 기록하고 서버 안에서의 참여를 하나의 성장 시스템으로 보여줍니다.",
    body: [
      "서버 활동에 따라 경험치를 기록하고 레벨과 랭킹을 구성해 커뮤니티 참여도를 확인할 수 있습니다.",
      "단순 숫자 집계가 아니라 PEPE RESTAURANT 안에서 꾸준히 활동하는 사용자가 자연스럽게 드러나는 구조를 목표로 합니다.",
      "운영진은 활동 데이터를 참고해 이벤트나 역할 시스템 등 다른 기능과 연계할 수 있습니다."
    ],
    tags: ["XP", "레벨", "랭킹", "커뮤니티 활동"]
  },
  ticket: {
    icon: "🎫",
    kicker: "SUPPORT · REPORT",
    title: "티켓 시스템",
    lead: "문의, 신고, 지원처럼 공개 채널에서 처리하기 어려운 요청을 별도의 공간에서 관리합니다.",
    body: [
      "사용자가 필요한 유형의 티켓을 열면 담당 운영진과 요청자 중심으로 대화를 진행할 수 있습니다.",
      "일반 문의부터 신고와 운영 지원까지 한곳에서 정리해 공개 채널의 혼잡을 줄이고 처리 과정을 명확하게 유지합니다.",
      "PEPE RESTAURANT 운영 흐름에 맞춰 필요한 티켓 종류와 담당 역할을 확장할 수 있습니다."
    ],
    tags: ["문의", "신고", "지원", "운영"]
  },
  automation: {
    icon: "⚙️",
    kicker: "SERVER WORKFLOW",
    title: "서버 전용 자동화",
    lead: "반복되는 서버 운영 작업을 PEPE RESTAURANT 전용 워크플로우로 자동 처리합니다.",
    body: [
      "역할 확인, 인증 채널 관리, 서버 상태 수집, 홈페이지 API 제공처럼 사람이 매번 확인할 필요가 없는 작업을 자동화합니다.",
      "Discord와 Minecraft, 웹사이트가 각각 따로 움직이지 않고 필요한 정보를 PEPE MANAGER를 중심으로 연결합니다.",
      "운영진이 반복 작업보다 실제 커뮤니티 관리에 집중할 수 있도록 만드는 것이 자동화 시스템의 목적입니다."
    ],
    tags: ["워크플로우", "상태 수집", "역할 관리", "웹 API"]
  }
};

(() => {
  const modal = document.querySelector("#system-modal");
  if (!modal) return;
  const icon = document.querySelector("#system-modal-icon");
  const kicker = document.querySelector("#system-modal-kicker");
  const title = document.querySelector("#system-modal-title");
  const lead = document.querySelector("#system-modal-lead");
  const body = document.querySelector("#system-modal-body");
  const tags = document.querySelector("#system-modal-tags");

  const open = key => {
    const info = PEPE_SYSTEM_INFO[key];
    if (!info) return;
    icon.textContent = info.icon;
    kicker.textContent = info.kicker;
    title.textContent = info.title;
    lead.textContent = info.lead;
    body.innerHTML = info.body.map(x => `<p>${x}</p>`).join("");
    tags.innerHTML = info.tags.map(x => `<span>${x}</span>`).join("");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };
  const close = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  document.querySelectorAll("[data-system-modal]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      open(el.dataset.systemModal);
    });
  });
  modal.querySelectorAll("[data-system-close]").forEach(el => el.addEventListener("click", close));
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
})();


// ===== PEPE MINECRAFT POPUP =====
const PEPE_MC_INFO = {
  overview: {
    icon: "⛏️",
    kicker: "PEPE MINECRAFT · SERVER",
    title: "PEPE Minecraft",
    lead: "PEPE RESTAURANT 멤버를 위한 Java + Bedrock Crossplay 서버입니다.",
    body: [
      "Discord 커뮤니티와 Minecraft 서버를 따로 운영하지 않고, PEPE MANAGER의 인증 시스템을 통해 하나의 멤버 시스템으로 연결합니다.",
      "접속 정보는 공개하지 않으며 Minecraft 인증 역할을 가진 유저나 Discord 초대 요청이 승인된 사용자에게만 제공합니다.",
      "홈페이지에서는 서버의 온라인 상태, 접속 인원, TPS와 버전을 실시간으로 확인할 수 있도록 PEPE MANAGER API와 연동되어 있습니다."
    ],
    tags: ["Java", "Bedrock", "Crossplay", "승인제", "PEPE 전용"]
  },
  crossplay: {
    icon: "🌐",
    kicker: "JAVA + BEDROCK",
    title: "Crossplay",
    lead: "서로 다른 에디션의 플레이어가 하나의 PEPE Minecraft 서버에서 함께 플레이합니다.",
    body: [
      "Java Edition과 Bedrock Edition 접속 경로를 각각 제공하며, 승인된 멤버는 홈페이지에서 자신에게 필요한 접속 정보를 확인할 수 있습니다.",
      "에디션이 달라도 같은 커뮤니티 안에서 플레이할 수 있도록 서버 환경을 구성하고 있습니다."
    ],
    tags: ["Java Edition", "Bedrock Edition", "Crossplay"]
  },
  access: {
    icon: "🔐",
    kicker: "MEMBER ACCESS",
    title: "승인제 운영",
    lead: "PEPE Minecraft는 접속 주소를 공개하는 방식이 아니라 승인된 멤버 중심으로 운영합니다.",
    body: [
      "Minecraft 인증 요청이 승인되면 Discord에 인증 역할이 지급되고 서버 접속 정보를 확인할 수 있습니다.",
      "Discord 초대 요청을 통해 운영진 승인을 받은 사용자도 홈페이지의 승인 정보를 이용해 서버 주소를 확인할 수 있습니다.",
      "서버 주소와 Discord 초대 링크는 GitHub Pages 공개 파일에 저장하지 않고 PEPE MANAGER API가 권한 확인 후 전달합니다."
    ],
    tags: ["승인제", "Discord 인증", "접근 제어", "비공개 주소"]
  },
  account: {
    icon: "🔗",
    kicker: "ACCOUNT LINK",
    title: "Minecraft 계정 연동",
    lead: "Discord 계정과 Java/Bedrock 플레이어 정보를 연결해 인증된 멤버를 구분합니다.",
    body: [
      "운영진에게 Minecraft 인증 승인을 받은 뒤 Java 또는 Bedrock 닉네임을 등록할 수 있습니다.",
      "Java와 Bedrock 계정 정보는 각각 관리할 수 있고, 운영진은 관리자 대시보드에서 인증 유저와 연결된 닉네임을 확인할 수 있습니다."
    ],
    tags: ["Discord", "Java 닉네임", "Bedrock 닉네임", "인증 역할"]
  },
  status: {
    icon: "📡",
    kicker: "LIVE SERVER STATUS",
    title: "실시간 서버 상태",
    lead: "홈페이지가 PEPE MANAGER API에서 Minecraft 상태를 직접 받아 표시합니다.",
    body: [
      "현재 서버 ONLINE/OFFLINE, 접속 인원, 최대 인원, TPS, 서버 버전과 같은 운영 정보를 실시간으로 확인할 수 있습니다.",
      "서버 주소처럼 보호해야 하는 정보와 공개해도 되는 상태 정보를 분리해 제공하도록 구성했습니다."
    ],
    tags: ["Online", "Players", "TPS", "Version", "Live API"]
  },
  "plugin-adminbridge": {
    icon: "🛠️",
    kicker: "PEPE ORIGINAL · IN-HOUSE · v1.2.0",
    title: "PepeAdminBridge",
    lead: "PEPE 관리자 도구가 게임 안의 플레이어 상태와 인벤토리를 정확하게 다룰 수 있게 이어주는 운영 전용 브리지입니다.",
    body: [
      "온라인 플레이어의 체력·최대 체력·배고픔·포화도·월드와 좌표·핑·레벨·경험치·게임모드·손에 든 아이템·플레이타임·킬·데스와 인벤토리 슬롯 정보를 state.json으로 내보냅니다.",
      "관리 도구의 request.json 요청을 받아 플레이어 강제 퇴장, 특정 슬롯 아이템 복제, 특정 슬롯 아이템 제거를 처리하고 response.json으로 결과를 돌려줍니다. 일반 유저용 명령어는 없는 백엔드 운영 플러그인입니다."
    ],
    tags: ["관리자 브리지", "플레이어 상태", "Exact Slot", "인벤토리 관리", "kick / clone / remove"]
  },
  "plugin-auth": {
    icon: "🔐",
    kicker: "PEPE ORIGINAL · IN-HOUSE · v1.2.0",
    title: "PepeAuth",
    lead: "Discord에서 승인된 Minecraft 닉네임만 서버에 들어올 수 있도록 지키는 PEPE 자체 인증 게이트입니다.",
    body: [
      "config.yml의 인증목록을 기준으로 접속자를 검사하며, 인증이 필요한 상태에서 목록에 없는 플레이어는 설정된 인증 안내 메시지와 함께 접속이 제한됩니다.",
      "운영진은 /인증관리로 인증 목록을 관리할 수 있고, pepeauth.admin과 pepeauth.bypass 권한을 통해 관리 기능과 인증 우회 예외를 제어합니다. PepeServerFeatures와 PepeServerSuite도 이 인증 정보를 활용합니다."
    ],
    tags: ["/인증관리", "Discord 인증", "접속 제한", "pepeauth.bypass", "PepeAuth 연동"]
  },
  "plugin-bedrock": {
    icon: "📱",
    kicker: "PEPE ORIGINAL · IN-HOUSE · v1.2.0",
    title: "PepeBedrock",
    lead: "Java와 Bedrock이 함께 접속하는 PEPE Crossplay 환경에서 Bedrock 플레이어를 알아보고 필요한 정보를 바로 안내합니다.",
    body: [
      "Floodgate API를 런타임에 감지해 Bedrock 플레이어 여부를 판별하고, 가능한 경우 Xbox 닉네임과 Device OS 정보를 읽어 접속 시 설정된 Bedrock 안내 메시지에 표시합니다.",
      "/베드락으로 Java·Bedrock 접속 정보를 안내하고 /플랫폼으로 현재 에디션과 Xbox 정보를 확인할 수 있습니다. 운영진은 /베드락관리와 pepebedrock.admin 권한으로 연동 상태를 관리합니다."
    ],
    tags: ["Floodgate", "Bedrock 감지", "Xbox 닉네임", "Device OS", "/베드락 · /플랫폼"]
  },
  "plugin-bridge": {
    icon: "📡",
    kicker: "PEPE ORIGINAL · IN-HOUSE · v1.1.1",
    title: "PepeBridge",
    lead: "Minecraft의 실시간 상태와 플레이 기록을 PEPE LIVE까지 이어주는 서버 데이터 브리지입니다.",
    body: [
      "서버 TPS, 현재/최대 접속 인원, 서버 버전과 가동시간을 기록하고, 온라인 플레이어의 Java/Bedrock 플랫폼 정보를 함께 plugins/PepeBridge/status.json에 내보냅니다.",
      "누적 플레이어·플레이타임·사망·발전과제 통계와 플레이타임·킬·데스·발전과제·주간 활동 TOP 10도 생성합니다. 이 데이터는 Minecraft Agent와 PEPE MANAGER를 거쳐 홈페이지의 LIVE STATUS, SERVER STATS, PEPE RANKING에 사용됩니다."
    ],
    tags: ["TPS · 접속자", "SERVER STATS", "TOP 10 랭킹", "Java / Bedrock", "PEPE LIVE"]
  },
  "plugin-core": {
    icon: "🐸",
    kicker: "PEPE ORIGINAL · IN-HOUSE · v1.2.1",
    title: "PepeCore",
    lead: "PEPE Minecraft에서 매일 쓰는 안내 명령과 서버 운영 명령을 한곳에 모은 기본 코어입니다.",
    body: [
      "/페페, /디코, /규칙, /접속자, /도움말로 서버 이용 정보를 제공하고, 플레이어 입장·퇴장 메시지도 설정에 따라 처리합니다. 기존 /help와 ? 계열 도움말도 PEPE 도움말 흐름으로 연결합니다.",
      "pepecore.admin 권한을 가진 운영진은 /플러그인, /화이트리스트, /서버저장, /서버종료로 플러그인 확인, 화이트리스트 관리, 월드 저장과 서버 종료를 수행할 수 있습니다."
    ],
    tags: ["/페페 · /도움말", "규칙 · 접속자", "화이트리스트", "서버 저장/종료", "입퇴장 메시지"]
  },
  "plugin-death": {
    icon: "💀",
    kicker: "PEPE ORIGINAL · IN-HOUSE · v1.2.0",
    title: "PepeDeath",
    lead: "야생에서 죽은 뒤 길을 잃지 않도록 마지막 사망 지점을 기억해주는 PEPE 사망 지원 시스템입니다.",
    body: [
      "플레이어가 사망하면 마지막 위치를 메모리에 기록하고, 좌표표시 설정이 켜져 있으면 사망 지점의 월드와 좌표를 알려줍니다.",
      "/사망위치로 마지막 사망 지점을 다시 확인하고 /사망복귀로 그 위치에 텔레포트할 수 있습니다. 복귀 기능은 사망복귀사용 설정과 pepedeath.back 권한으로 제어됩니다."
    ],
    tags: ["사망 위치 기록", "/사망위치", "/사망복귀", "좌표 안내", "야생 편의"]
  },
  "plugin-features": {
    icon: "📊",
    kicker: "PEPE ORIGINAL · IN-HOUSE · v1.1.0",
    title: "PepeServerFeatures",
    lead: "플레이어의 활동 기록과 인증 등급을 게임 안에서 보여주는 PEPE 야생 서버 기능 레이어입니다.",
    body: [
      "PepeAuth의 인증목록을 읽어 관리자·인증자·일반 등급을 구분하고, TAB 닉네임에 등급을 표시합니다. TAB 헤더·푸터에는 플레이타임, 킬, 데스, 인증 상태 같은 정보를 주기적으로 갱신합니다.",
      "/내정보에서 등급·인증·플레이타임·플레이어 킬·데스를 확인하고 /인증기능은 인증자 여부를 검사합니다. 레시피/루트 항목을 제외한 실제 발전과제 달성 시 서버 전체에 달성 알림도 방송합니다."
    ],
    tags: ["PepeAuth softdepend", "TAB 등급", "플레이타임 · 킬 · 데스", "발전과제 알림", "/내정보"]
  },
  "plugin-suite": {
    icon: "🖥️",
    kicker: "PEPE ORIGINAL · IN-HOUSE · v1.2.6",
    title: "PepeServerSuite",
    lead: "접속자에게 필요한 서버 정보와 인증 상태를 사이드바와 명령어로 한눈에 보여주는 PEPE 통합 UI 플러그인입니다.",
    body: [
      "플레이어별 사이드바를 생성해 접속 인원, 플레이어명, 핑, 인증 상태와 Java/Bedrock 플랫폼 정보를 표시합니다. 개인별 ON/OFF와 서버 전체 허용 상태는 sidebar-prefs.txt에 저장되어 재시작 후에도 유지됩니다.",
      "PepeAuth config.yml의 인증목록을 비동기로 읽어 인증 여부를 캐시하며 /verifystatus에서 상태와 플랫폼을 확인합니다. /discord, /rules, /serverinfo로 서버 안내를 제공하고 운영진은 /sidebarall과 /pepereload로 UI 설정을 관리합니다."
    ],
    tags: ["개인 사이드바", "PepeAuth 연동", "인증 상태", "Java / Bedrock", "/sidebar · /verifystatus"]
  }
};

(() => {
  const modal = document.querySelector("#mc-modal");
  if (!modal) return;

  const icon = document.querySelector("#mc-modal-icon");
  const kicker = document.querySelector("#mc-modal-kicker");
  const title = document.querySelector("#mc-modal-title");
  const lead = document.querySelector("#mc-modal-lead");
  const body = document.querySelector("#mc-modal-body");
  const tags = document.querySelector("#mc-modal-tags");

  const open = key => {
    const info = PEPE_MC_INFO[key];
    if (!info) return;

    icon.textContent = info.icon;
    kicker.textContent = info.kicker;
    title.textContent = info.title;
    lead.textContent = info.lead;
    body.innerHTML = info.body.map(x => `<p>${x}</p>`).join("");
    tags.innerHTML = info.tags.map(x => `<span>${x}</span>`).join("");

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const close = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  document.querySelectorAll("[data-mc-modal]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      open(el.dataset.mcModal);
    });
  });

  modal.querySelectorAll("[data-mc-close]").forEach(el => {
    el.addEventListener("click", close);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
  });
})();

// FAQ는 한 번에 하나만 열리도록 정리
document.querySelectorAll("#faq details").forEach(item => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    document.querySelectorAll("#faq details").forEach(other => {
      if (other !== item) other.open = false;
    });
  });
});

// ===== FAQ MORE / HIDE =====
(() => {
  const list = document.querySelector("#faq .faq-list");
  const toggle = document.querySelector("#faq-toggle");
  if (!list || !toggle) return;

  const COLLAPSED = 5;
  const items = [...list.querySelectorAll(":scope > details")];
  let expanded = false;

  const render = () => {
    items.forEach((item, i) => {
      item.hidden = !expanded && i >= COLLAPSED;
      if (item.hidden) item.open = false;
    });

    if (items.length <= COLLAPSED) {
      toggle.hidden = true;
      return;
    }

    toggle.hidden = false;
    toggle.textContent = expanded
      ? "숨기기 ↑"
      : `더보기 +${items.length - COLLAPSED}`;
  };

  toggle.addEventListener("click", () => {
    expanded = !expanded;
    render();
    if (!expanded) {
      document.querySelector("#faq")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });

  render();
})();

