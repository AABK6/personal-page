(function sessionBriefs() {
  "use strict";

  const el = id => document.getElementById(id);
  const sessions = JSON.parse(el("atlas-sessions").textContent);
  const byId = new Map(sessions.map(session => [session.id, session]));
  const days = { "10": "Tuesday, 10 November", "11": "Wednesday, 11 November" };
  const themes = new Set(sessions.map(session => session.theme));
  const homeTitle = document.title;
  const editionName = el("edition-name").textContent;
  const savedKey = "ppf.atlas.public.2026.saved.v1";
  let saved = readSaved();
  let isSavedList = false;
  let filters;
  let currentId = null;
  let lastListHash = "#index";
  let listPosition = 0;
  let lastRow = null;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  }

  function normalise(value) {
    return String(value).normalize("NFKD").replace(/\p{M}/gu, "")
      .replace(/[’']/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  }

  const searchText = new Map(sessions.map(session => {
    const fields = [session.id, session.title, session.headline, session.theme, session.venue,
      session.child ? "Child Summit" : "", ...session.body.map(block => block[1])];
    const text = normalise(fields.join(" "));
    const synonym = text.includes("artificial intelligence") ? " ai" : "";
    return [session.id, ` ${text}${synonym} `];
  }));

  function readSaved() {
    try {
      const ids = JSON.parse(localStorage.getItem(savedKey) || "[]");
      return new Set((Array.isArray(ids) ? ids : []).map(String).filter(id => byId.has(id)));
    } catch {
      return new Set();
    }
  }

  function updateBookmarks() {
    const link = el("saved-link");
    link.hidden = saved.size === 0 || (isSavedList && !currentId);
    link.textContent = `Reading list (${saved.size})`;
    const button = el("bookmark");
    if (button && currentId) {
      const active = saved.has(currentId);
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "Remove from reading list" : "Save for later";
    }
  }

  function toggleBookmark() {
    if (saved.has(currentId)) saved.delete(currentId);
    else saved.add(currentId);
    try {
      localStorage.setItem(savedKey, JSON.stringify([...saved]));
    } catch {
      // The reading list still works for this visit when storage is unavailable.
    }
    updateBookmarks();
  }

  function readFilters(params) {
    const day = params.get("day");
    const theme = params.get("theme");
    return {
      query: params.get("q") || "",
      day: Object.hasOwn(days, day) ? day : "",
      // Previously shared theme and Child Summit links keep their exact selection.
      theme: themes.has(theme) ? theme : "",
      child: params.get("child") === "1"
    };
  }

  function listHash() {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.day) params.set("day", filters.day);
    if (filters.theme) params.set("theme", filters.theme);
    if (filters.child) params.set("child", "1");
    const search = params.toString();
    return `#${isSavedList ? "saved" : "index"}${search ? "?" + search : ""}`;
  }

  function hasFilters() {
    return Boolean(filters.query.trim() || filters.day || filters.theme || filters.child);
  }

  function matches(session, words) {
    if (isSavedList && !saved.has(session.id)) return false;
    if (filters.day && filters.day !== session.day) return false;
    if (filters.theme && filters.theme !== session.theme) return false;
    if (filters.child && !session.child) return false;
    const text = searchText.get(session.id);
    // Short terms such as AI and UN should not match the middle of ordinary words.
    return words.every(word => text.includes(" " + word + (word.length < 3 ? " " : "")));
  }

  function countLabel(count) {
    return `${count} ${count === 1 ? "session" : "sessions"}`;
  }

  function renderResults() {
    const words = normalise(filters.query).split(" ").filter(Boolean);
    const found = sessions.filter(session => matches(session, words));
    const filtered = hasFilters();
    const total = countLabel(found.length);
    el("result-status").textContent = total;
    el("filter-summary").hidden = !filtered;
    el("filter-description").textContent =
      [total, filters.theme, filters.child ? "Child Summit" : ""].filter(Boolean).join(" · ");

    if (found.length === 0) {
      const emptyList = isSavedList && !saved.size;
      el("results").innerHTML = emptyList
        ? '<div class="empty"><h2>Your reading list is empty</h2><a href="#index">Browse all sessions</a></div>'
        : '<div class="empty"><h2>No sessions found</h2><p>Try another name or topic.</p></div>';
      return;
    }

    el("results").innerHTML = Object.entries(days).map(([day, label]) => {
      const group = found.filter(session => session.day === day);
      if (!group.length) return "";
      const items = group.map(session => `
        <li><a class="session-row" data-session="${session.id}" href="#session/${session.id}">
          <time class="row-time" datetime="2026-11-${day}T${session.start}:00+01:00">${session.start}</time>
          <span class="row-title">${escapeHtml(session.title)}</span>
          <span class="row-arrow" aria-hidden="true">→</span>
        </a></li>`).join("");
      return `<section class="day-block" aria-labelledby="day-${day}">
        <header class="day-heading"><h2 id="day-${day}">${label}</h2>${filtered ? "" : `<span>${countLabel(group.length)}</span>`}</header>
        <ul class="session-list">${items}</ul></section>`;
    }).join("");
  }

  function keepAddress(hash) {
    if (location.hash === hash) return;
    try {
      history.replaceState(null, "", hash);
    } catch {
      // Searching and replaying still work if the browser throttles history changes.
    }
  }

  function changeFilters() {
    filters.query = el("query").value;
    filters.day = el("day").value;
    lastListHash = listHash();
    keepAddress(lastListHash);
    renderResults();
  }

  function resetFilters() {
    filters = readFilters(new URLSearchParams());
    el("query").value = "";
    el("day").value = "";
    changeFilters();
    el("query").focus({ preventScroll: true });
  }

  function secondsLabel(value) {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor(value % 3600 / 60);
    const seconds = String(value % 60).padStart(2, "0");
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
  }

  function youtubeUrl(session, second = 0) {
    return `https://www.youtube.com/watch?v=${session.video}${second ? `&t=${second}s` : ""}`;
  }

  function timeLinks(session) {
    if (!session.times.length) return "";
    const speaker = session.id === "1052" ? "Adrien Abecassis" : "";
    const ranges = { 539: "8:59–13:54", 2240: "37:20–40:07" };
    const links = session.times.map(second => {
      const label = (speaker && ranges[second]) || secondsLabel(second);
      const description = speaker ? `${speaker}, ${label}` : `Play from ${label}`;
      return `<a href="${escapeHtml(youtubeUrl(session, second))}" data-second="${second}"
        aria-label="${escapeHtml(description)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    }).join("");
    return `<div class="moments"><span>${speaker || "Jump to"}</span>${links}</div>`;
  }

  function setPlayer(session, second, autoplay) {
    const host = el("player");
    if (host.firstElementChild && host.dataset.second === String(second) && !autoplay) return;
    const frame = document.createElement("iframe");
    frame.title = `Official recording of ${session.title}`;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.src = `https://www.youtube-nocookie.com/embed/${session.video}?start=${second}&rel=0${autoplay ? "&autoplay=1" : ""}`;
    host.dataset.second = String(second);
    host.replaceChildren(frame);
    el("youtube-link").href = youtubeUrl(session, second);
  }

  function replayHash(id, open, second) {
    return `#session/${id}${open ? "/recording" : ""}${open && second ? `?t=${second}` : ""}`;
  }

  function setReplay(session, open, second = 0, autoplay = false) {
    const details = el("replay");
    details.open = open;
    el("replay-label").textContent = open ? "Close replay" : "Watch replay";
    if (open) {
      setPlayer(session, second, autoplay);
    } else {
      el("player").replaceChildren();
      delete el("player").dataset.second;
    }
  }

  function renderReader(session) {
    const title = escapeHtml(session.title);
    const date = days[session.day].split(", ")[1];
    const programme = `https://parispeaceforum.org/2026-forum-the-program/?session=${session.id}`;
    const deck = normalise(session.headline) === normalise(session.title)
      ? "" : `<p class="standfirst">${escapeHtml(session.headline)}</p>`;
    const body = session.body.map(([type, text]) => {
      const tag = type === "h3" ? "h2" : "p";
      return `<${tag}>${escapeHtml(text)}</${tag}>`;
    }).join("\n");
    el("reader").innerHTML = `
      <nav class="reader-navigation" aria-label="Back to the index">
        <a class="back-link" href="${escapeHtml(lastListHash)}"><span aria-hidden="true">←</span>${isSavedList ? "Reading list" : "Session Briefs"}</a>
      </nav>
      <article class="reader" lang="en">
        <header>
          <h1 id="reader-title" tabindex="-1">${title}</h1>
          <p class="session-meta"><span>${date} 2026</span><span>${session.start}–${session.end} CET</span><span>${escapeHtml(session.venue)}</span></p>
        </header>
        <details class="replay" id="replay">
          <summary id="replay-toggle"><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M3 2l10 6-10 6z"/></svg><span id="replay-label">Watch replay</span></summary>
          <div class="player" id="player"></div>
          <div class="replay-links">${timeLinks(session)}<a id="youtube-link" class="youtube" href="${escapeHtml(youtubeUrl(session))}" target="_blank" rel="noopener noreferrer">Replay &amp; transcript on YouTube ↗</a></div>
        </details>
        <div class="prose">${deck}${body}</div>
        <footer class="article-end"><a href="${programme}" target="_blank" rel="noopener noreferrer">Official programme entry ↗</a><button id="bookmark" type="button" aria-pressed="false">Save for later</button></footer>
      </article>`;

    el("replay-toggle").addEventListener("click", event => {
      event.preventDefault();
      const open = !el("replay").open;
      setReplay(session, open, 0, open);
      keepAddress(replayHash(session.id, open, 0));
    });
    el("bookmark").addEventListener("click", toggleBookmark);
    updateBookmarks();
  }

  function route(first = false) {
    const [path, search = ""] = (location.hash.slice(1) || "index").split("?");
    const [type, id, panel] = path.split("/");
    const session = type === "session" ? byId.get(id) : null;
    const params = new URLSearchParams(search);
    const previousId = currentId;

    if (session) {
      if (!previousId && !first) listPosition = window.scrollY;
      currentId = session.id;
      el("index").hidden = true;
      el("reader").hidden = false;
      document.title = `${session.title} · ${editionName}`;
      if (previousId !== currentId) renderReader(session);
      const replay = ["recording", "transcript", "sources"].includes(panel);
      const second = Math.floor(Number(params.get("t")));
      setReplay(session, replay, Number.isFinite(second) && second >= 0 && second < 86400 ? second : 0);
      if (previousId !== currentId) {
        if (!first) el("reader-title").focus({ preventScroll: true });
        window.scrollTo(0, 0);
      }
      return;
    }

    currentId = null;
    const oldListHash = lastListHash;
    isSavedList = type === "saved";
    filters = readFilters(params);
    lastListHash = listHash();
    el("reader").replaceChildren();
    el("reader").hidden = true;
    el("index").hidden = false;
    el("edition").hidden = isSavedList;
    el("saved-intro").hidden = !isSavedList;
    el("query").value = filters.query;
    el("day").value = filters.day;
    document.title = isSavedList ? `Reading list · ${editionName}` : homeTitle;
    renderResults();
    updateBookmarks();
    if (previousId && oldListHash === lastListHash) {
      const row = lastRow && document.querySelector(`[data-session="${lastRow}"]`);
      if (row) row.focus({ preventScroll: true });
      window.scrollTo(0, listPosition);
    } else if (!first) {
      window.scrollTo(0, 0);
    }
  }

  el("query").addEventListener("input", changeFilters);
  el("day").addEventListener("change", changeFilters);
  el("reset-filters").addEventListener("click", resetFilters);
  el("skip").addEventListener("click", event => {
    event.preventDefault();
    const target = currentId ? el("reader-title") : el("main");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  });
  document.addEventListener("click", event => {
    const link = event.target.closest?.("a");
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.dataset.session) lastRow = link.dataset.session;
    if (!link.hasAttribute("data-second") || !currentId) return;
    event.preventDefault();
    const second = Number(link.dataset.second);
    setReplay(byId.get(currentId), true, second, true);
    keepAddress(replayHash(currentId, true, second));
  });
  window.addEventListener("storage", event => {
    if (event.key !== savedKey && event.key !== null) return;
    saved = readSaved();
    updateBookmarks();
    if (isSavedList && !currentId) renderResults();
  });
  window.addEventListener("hashchange", () => route());
  el("edition-count").textContent = countLabel(sessions.length);
  route(true);
})();
