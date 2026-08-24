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

async function refreshLiveStatus() {
  // Loading state
  setText("#overall-state", "상태 확인 중...");
  setDot("#overall-dot", "loading");
  setText("#mc-main-state", "-");
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

    // Header status card
    if (discordOnline && minecraftOnline) {
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

// ===== LIVE MINECRAFT VERSION =====
(() => {
  const el = document.querySelector("#mc-version-live");
  if (!el) return;

  const pickVersion = data =>
    data?.version ??
    data?.minecraft?.version ??
    data?.server?.version ??
    data?.java?.version ??
    data?.status?.version ??
    null;

  const updateVersion = async () => {
    try {
      const data = await apiFetch("/api/server-status");
      const version = pickVersion(data);

      el.textContent = version ? String(version) : "정보 없음";
      el.classList.toggle("online", Boolean(version));
    } catch {
      el.textContent = "확인 불가";
      el.classList.remove("online");
    }
  };

  updateVersion();
  setInterval(updateVersion, 60000);
})();
