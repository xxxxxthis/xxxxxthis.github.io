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

function typeLabel(type) {
  return ({
    notice: "공지",
    update: "업데이트",
    minecraft: "Minecraft"
  })[type] || type;
}

function renderNotices(filter = "all") {
  const root = $("#notices-list");
  const items = filter === "all" ? noticeData : noticeData.filter(n => n.type === filter);
  root.innerHTML = "";

  if (!items.length) {
    root.innerHTML = "<p class='muted'>표시할 공지가 없습니다.</p>";
    return;
  }

  items.forEach(n => {
    const el = document.createElement("div");
    el.className = "notice-card";
    el.innerHTML = `
      <time>${n.date}</time>
      <div>
        <h3>${n.title}</h3>
        <p>${n.text}</p>
      </div>
      <span class="notice-type">${typeLabel(n.type)}</span>
    `;
    root.appendChild(el);
  });
}

async function loadNotices() {
  try {
    noticeData = await fetchJson("announcements.json");
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
    renderNotices(btn.dataset.filter);
  });
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

function getPepeToken() {
  return sessionStorage.getItem(PEPE_TOKEN_KEY) || "";
}

function clearPepeToken() {
  sessionStorage.removeItem(PEPE_TOKEN_KEY);
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
