(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const base = String((window.PEPE_CONFIG || {}).apiBase || "").replace(/\/+$/, "");
  const token = () => sessionStorage.getItem("pepe_admin_token") || "";
  const statusLabel = s => ({received:"접수됨",processing:"처리중",answered:"답변완료",closed:"종료"})[s] || s || "-";

  const modal = document.createElement("div");
  modal.className = "support-reply-modal";
  modal.id = "support-reply-modal";
  modal.innerHTML = `
    <div class="support-reply-backdrop" data-support-modal-close></div>
    <div class="support-reply-dialog" role="dialog" aria-modal="true" aria-labelledby="support-reply-title">
      <div class="support-reply-head">
        <div><small>PEPE SUPPORT CENTER</small><h2 id="support-reply-title">📬 문의 답변</h2></div>
        <button class="support-reply-close" type="button" data-support-modal-close aria-label="닫기">×</button>
      </div>
      <div class="support-reply-meta">
        <div><span>문의번호</span><strong id="support-modal-id">-</strong></div>
        <div><span>유형</span><strong id="support-modal-category">-</strong></div>
        <div><span>작성자</span><strong id="support-modal-author">-</strong></div>
        <div><span>제목</span><strong id="support-modal-subject">-</strong></div>
      </div>
      <div class="support-reply-current" id="support-modal-current"></div>
      <div class="support-reply-label"><span>운영진 답변</span><span class="support-reply-count" id="support-modal-count">0 / 3000</span></div>
      <textarea class="support-reply-textarea" id="support-modal-text" maxlength="3000" placeholder="답변 내용을 입력하세요."></textarea>
      <div class="support-reply-controls">
        <div></div>
        <select class="support-reply-status" id="support-modal-status">
          <option value="processing">처리중</option>
          <option value="answered" selected>답변완료</option>
          <option value="closed">종료</option>
        </select>
      </div>
      <p class="support-reply-error" id="support-modal-error"></p>
      <div class="support-reply-actions">
        <button class="support-reply-cancel" type="button" data-support-modal-close>취소</button>
        <button class="support-reply-submit" id="support-modal-submit" type="button">답변 보내기</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  let current = null;
  const text = $("#support-modal-text");
  const count = $("#support-modal-count");
  const submit = $("#support-modal-submit");
  const error = $("#support-modal-error");

  function closeModal(){
    modal.classList.remove("open");
    document.body.style.overflow = "";
    current = null;
  }

  async function adminApi(path, opt={}) {
    const r = await fetch(base + path, {
      cache: "no-store",
      ...opt,
      headers: {
        ...(opt.headers || {}),
        Authorization: "Bearer " + token(),
        ...(opt.body ? {"Content-Type":"application/json"} : {})
      }
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    return d;
  }

  async function loadTicket(id){
    const d = await adminApi("/api/admin/support");
    return (d.rows || []).find(x => x.id === id) || null;
  }

  async function openModal(id){
    error.textContent = "";
    submit.disabled = true;
    try {
      const t = await loadTicket(id);
      if (!t) throw new Error("문의 정보를 찾을 수 없습니다.");
      current = t;
      $("#support-modal-id").textContent = t.id || "-";
      $("#support-modal-category").textContent = t.category || "-";
      $("#support-modal-author").textContent = t.discordName || "미입력";
      $("#support-modal-subject").textContent = t.title || "-";
      const currentReply = $("#support-modal-current");
      if (t.reply) {
        currentReply.textContent = `기존 답변\n${t.reply}`;
        currentReply.classList.add("visible");
      } else {
        currentReply.textContent = "";
        currentReply.classList.remove("visible");
      }
      text.value = t.reply || "";
      count.textContent = `${text.value.length} / 3000`;
      $("#support-modal-status").value = t.status === "closed" ? "closed" : "answered";
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      setTimeout(() => text.focus(), 20);
    } catch (e) {
      alert(e.message || "문의 정보를 불러오지 못했습니다.");
    } finally {
      submit.disabled = false;
    }
  }

  text.addEventListener("input", () => count.textContent = `${text.value.length} / 3000`);
  modal.querySelectorAll("[data-support-modal-close]").forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("open")) closeModal(); });

  submit.addEventListener("click", async () => {
    if (!current) return;
    const reply = text.value.trim();
    const status = $("#support-modal-status").value;
    if (!reply) { error.textContent = "답변 내용을 입력해주세요."; return; }
    error.textContent = "";
    submit.disabled = true;
    submit.textContent = "전송 중...";
    try {
      await adminApi(`/api/admin/support/${encodeURIComponent(current.id)}/reply`, {method:"POST", body:JSON.stringify({reply})});
      if (status !== "answered") {
        await adminApi(`/api/admin/support/${encodeURIComponent(current.id)}/status`, {method:"POST", body:JSON.stringify({status})});
      }
      closeModal();
      if (typeof window.supportInbox === "function") await window.supportInbox();
      if (typeof window.dashboard === "function") await window.dashboard();
      if (typeof window.logs === "function") await window.logs();
    } catch (e) {
      error.textContent = e.message || "답변 전송에 실패했습니다.";
    } finally {
      submit.disabled = false;
      submit.textContent = "답변 보내기";
    }
  });

  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-support-reply]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    openModal(btn.dataset.supportReply);
  }, true);

  window.replySupport = openModal;
})();