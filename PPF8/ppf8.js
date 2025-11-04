(() => {
  const CSV_PATH = "english_recent_videos.csv";

  if (window.marked) {
    marked.setOptions({
      gfm: true,
      breaks: false,
      headerIds: false,
      mangle: false
    });
  }

  const state = {
    sessions: [],
    selectedId: null
  };

  const dom = {
    list: document.getElementById("sessionList"),
    article: document.getElementById("articlePanel")
  };

  function normalise(value) {
    return (value || "").toString().trim();
  }

  function escapeHtml(value) {
    return normalise(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderPlaceholder(message) {
    dom.article.innerHTML = `
      <div class="article-placeholder">
        <h3>${message || "Select a session"}</h3>
        <p>The article will appear here.</p>
      </div>
    `;
  }

  function setActiveItem() {
    if (!dom.list) {
      return;
    }
    const items = dom.list.querySelectorAll(".session-list__item");
    items.forEach((item) => {
      item.classList.toggle(
        "session-list__item--active",
        item.dataset.id === state.selectedId
      );
    });
  }

  function renderArticle(session) {
    if (!session || !dom.article) {
      renderPlaceholder("Select a session");
      return;
    }

    const metaParts = [];
    if (session.published) {
      metaParts.push(`<span>Published: ${escapeHtml(session.published)}</span>`);
    }
    if (session.link) {
      metaParts.push(`<a href="${session.link}" target="_blank" rel="noopener">Watch the session</a>`);
    }

    const metaBlock = metaParts.length
      ? `<div class="session-meta">${metaParts.join("")}</div>`
      : "";

    const articleHtml = window.marked
      ? marked.parse(session.article)
      : `<pre>${escapeHtml(session.article)}</pre>`;

    dom.article.innerHTML = `
      <header>
        <h2>${escapeHtml(session.title)}</h2>
        ${metaBlock}
      </header>
      <div class="article-body">
        ${articleHtml}
      </div>
    `;
  }

  function handleSelect(id) {
    const session = state.sessions.find((item) => item.id === id);
    if (!session) {
      renderPlaceholder("Select a session");
      return;
    }
    state.selectedId = id;
    setActiveItem();
    renderArticle(session);
  }

  function renderList() {
    if (!dom.list) {
      return;
    }

    dom.list.innerHTML = "";

    state.sessions.forEach((session) => {
      const item = document.createElement("li");
      item.className = "session-list__item";
      item.textContent = session.title;
      item.tabIndex = 0;
      item.dataset.id = session.id;
      item.addEventListener("click", () => handleSelect(session.id));
      item.addEventListener("keypress", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSelect(session.id);
        }
      });
      dom.list.appendChild(item);
    });

    if (state.sessions.length) {
      handleSelect(state.sessions[0].id);
    } else {
      renderPlaceholder("No sessions available");
    }
  }

  function showError(message) {
    if (dom.list) {
      dom.list.innerHTML = `<li class="session-list__item">${escapeHtml(message)}</li>`;
    }
    renderPlaceholder("Unable to load sessions");
  }

  function parseSessions(csvText) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data, errors, meta }) => {
          if (errors && errors.length) {
            console.warn("Papaparse reported issues:", errors.slice(0, 5));
          }

          if (!Array.isArray(data) || !data.length) {
            reject(new Error("No data rows were parsed from the CSV."));
            return;
          }

          const sessions = data
            .map((entry, index) => {
              const article = normalise(entry.Article);
              const title = normalise(entry.Title);

              if (!article || /^error:/i.test(article) || !title) {
                return null;
              }

              return {
                id: `session-${index}`,
                title,
                article,
                link: normalise(entry.Link),
                published: normalise(entry.Published),
                views: normalise(entry.Views)
              };
            })
            .filter(Boolean)
            .sort((a, b) => a.title.localeCompare(b.title));

          resolve(sessions);
        },
        error: (error) => reject(error)
      });
    });
  }

  function fetchCsvText(paths) {
    const queue = [...paths];

    const attempt = () => {
      if (!queue.length) {
        return Promise.reject(new Error("All CSV fetch attempts failed."));
      }

      const nextPath = queue.shift();
      return fetch(nextPath, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${nextPath}`);
          }
          return response.text();
        })
        .catch((error) => {
          console.warn(`Fetch failed for ${nextPath}:`, error);
          return attempt();
        });
    };

    return attempt();
  }

  function init() {
    if (!dom.list || !dom.article) {
      return;
    }

    if (window.location.protocol === "file:") {
      showError("Please run this page from a local web server so the CSV can be loaded.");
      return;
    }

    renderPlaceholder("Loading sessions");

    fetchCsvText([CSV_PATH, `PPF8/${CSV_PATH}`])
      .then(parseSessions)
      .then((sessions) => {
        if (!sessions.length) {
          showError("No sessions with articles were found.");
          return;
        }

        state.sessions = sessions;
        renderList();
      })
      .catch((error) => {
        console.error("Failed to load sessions", error);
        const reason = error && error.message ? ` (${error.message})` : "";
        showError(`Could not load the CSV.${reason}`);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
