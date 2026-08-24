const C = window.PEPE_CONFIG || {};
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

$$("[data-discord]").forEach(a => a.href = C.discordInvite || "#");

$("#java-address").textContent = C.javaAddress || "-";
$("#bedrock-address").textContent = `${C.bedrockAddress}:${C.bedrockPort}`;

const toast = $("#toast");

function showToast(text = "복사 완료!") {
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1200);
}

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

function setDot(selector, state) {
  const el = $(selector);
  if (!el) return;
  el.classList.remove("ok","bad","loading");
  el.classList.add(state === "ok" ? "ok" : state === "bad" ? "bad" : "loading");
}

async function fetchJson(url, timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(url, {signal: controller.signal});
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

let mcOnline = false;
let discordOnline = false;

function updateOverall() {
  const text = $("#overall-state");
  if (mcOnline && discordOnline) {
    text.textContent = "All Systems Online";
    setDot("#overall-dot","ok");
  } else if (mcOnline || discordOnline) {
    text.textContent = "Partial Online";
    setDot("#overall-dot","loading");
  } else {
    text.textContent = "Status Unavailable";
    setDot("#overall-dot","bad");
  }
}

async function refreshMinecraft() {
  $("#mc-main-state").textContent = "확인 중";
  $("#player-count").textContent = "-";

  try {
    const javaUrl = `https://api.mcstatus.io/v2/status/java/${encodeURIComponent(C.javaAddress)}`;
    const bedrockTarget = `${C.bedrockAddress}:${C.bedrockPort}`;
    const bedrockUrl = `https://api.mcstatus.io/v2/status/bedrock/${encodeURIComponent(bedrockTarget)}`;

    const [java, bedrock] = await Promise.allSettled([
      fetchJson(javaUrl),
      fetchJson(bedrockUrl)
    ]);

    const j = java.status === "fulfilled" ? java.value : null;
    const b = bedrock.status === "fulfilled" ? bedrock.value : null;

    const jOnline = !!j?.online;
    const bOnline = !!b?.online;

    mcOnline = jOnline || bOnline;

    $("#java-live").textContent = jOnline ? "ONLINE" : "OFFLINE";
    $("#bedrock-live").textContent = bOnline ? "ONLINE" : "OFFLINE";
    $("#mc-main-state").textContent = mcOnline ? "ONLINE" : "OFFLINE";

    setDot("#java-dot", jOnline ? "ok" : "bad");
    setDot("#bedrock-dot", bOnline ? "ok" : "bad");

    const online = j?.players?.online ?? b?.players?.online;
    const max = j?.players?.max ?? b?.players?.max;
    $("#player-count").textContent = online == null ? "-" : `${online}/${max ?? "-"}`;
  } catch {
    mcOnline = false;
    $("#mc-main-state").textContent = "확인 실패";
    $("#java-live").textContent = "UNKNOWN";
    $("#bedrock-live").textContent = "UNKNOWN";
    setDot("#java-dot","bad");
    setDot("#bedrock-dot","bad");
  }

  updateOverall();
}

async function refreshDiscord() {
  const guildId = String(C.discordGuildId || "").trim();

  if (!guildId) {
    discordOnline = false;
    $("#discord-main-state").textContent = "설정 필요";
    $("#discord-member-count").textContent = C.fallbackDiscordMembers ?? "-";
    $("#discord-total").textContent = C.fallbackDiscordMembers ?? "-";
    $("#discord-online").textContent = C.fallbackDiscordOnline ?? "-";
    $("#discord-status-text").textContent = "config.js에 Discord Guild ID를 입력하면 실시간 인원이 표시됩니다.";
    updateOverall();
    return;
  }

  try {
    const data = await fetchJson(`https://discord.com/api/guilds/${guildId}/widget.json`);

    discordOnline = true;
    $("#discord-main-state").textContent = "ONLINE";
    $("#discord-name").textContent = data.name || "PEPE RESTAURANT";

    const online = Array.isArray(data.members) ? data.members.length : 0;
    $("#discord-online").textContent = online;
    $("#discord-member-count").textContent = online;
    $("#discord-total").textContent = C.fallbackDiscordMembers ?? "Widget";
    $("#discord-status-text").textContent = `${online}명이 현재 온라인입니다.`;
  } catch {
    discordOnline = false;
    $("#discord-main-state").textContent = "Widget OFF";
    $("#discord-total").textContent = C.fallbackDiscordMembers ?? "-";
    $("#discord-online").textContent = C.fallbackDiscordOnline ?? "-";
    $("#discord-member-count").textContent = C.fallbackDiscordMembers ?? "-";
    $("#discord-status-text").textContent = "Discord Server Widget을 켜거나 config.js에 수동 인원 값을 입력하세요.";
  }

  updateOverall();
}

async function loadStaff() {
  const root = $("#staff-list");
  try {
    let items = Array.isArray(window.PEPE_STAFF) ? window.PEPE_STAFF : null;
    if (!items) items = await fetchJson("staff.json");

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
  const items = filter === "all"
    ? noticeData
    : noticeData.filter(n => n.type === filter);

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
    noticeData = Array.isArray(window.PEPE_NOTICES)
      ? window.PEPE_NOTICES
      : await fetchJson("announcements.json");

    noticeData.sort((a,b) => String(b.date).localeCompare(String(a.date)));
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

async function refreshAll() {
  await Promise.allSettled([refreshMinecraft(), refreshDiscord()]);
}

$("#refresh-all").addEventListener("click", refreshAll);

loadStaff();
loadNotices();
refreshAll();
setInterval(refreshAll, 60000);

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add("visible");
  });
}, {threshold: .08});

document.querySelectorAll("section, article, .feature-strip").forEach(el => {
  el.classList.add("reveal");
  observer.observe(el);
});

const topBtn = $("#top-button");
window.addEventListener("scroll", () => {
  topBtn.style.display = window.scrollY > 700 ? "block" : "none";
});
topBtn.onclick = () => window.scrollTo({top:0, behavior:"smooth"});

if ("serviceWorker" in navigator && (location.protocol === "http:" || location.protocol === "https:")) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}