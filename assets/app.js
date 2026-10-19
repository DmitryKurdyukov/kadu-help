// Shared chrome for every page: language routing, top bar with language and
// theme switchers, sidebar menu and prev/next links. Languages, interface
// strings and menus live in assets/i18n.js; pages only contain their article.
//
// Language routing:
//   /?lang=de            → de/            (used by the app's Feedback button)
//   /de/tags.html?lang=fr → fr/tags.html
//   /                    → saved choice, else browser language, else English
// Codes are normalised the way the app names them: "pt-BR" → pt,
// "zh-Hant-TW" / "zh-TW" → zh-Hant, "zh-Hans-CN" → zh.

(function () {
  const DATA = window.KADU_HELP;
  const CODES = DATA.langs.map((l) => l.code);
  const LANG_KEY = "kadu-help-lang";
  const THEME_KEY = "kadu-help-theme";

  // Site root = the folder that holds assets/, wherever the site is hosted.
  const ROOT = new URL("..", document.currentScript.src).href;
  const html = document.documentElement;
  const pageLang = html.dataset.lang || null;

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode — choices still work for this visit */
    }
  }

  function normalizeLang(code) {
    if (!code) return null;
    const c = String(code).trim().replace(/_/g, "-").toLowerCase();
    if (c === "zh" || c.startsWith("zh-")) {
      return /(^|-)(hant|tw|hk|mo)(-|$)/.test(c) ? "zh-Hant" : "zh";
    }
    const base = c.split("-")[0];
    return CODES.includes(base) ? base : null;
  }

  function browserLang() {
    const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const code of list) {
      const lang = normalizeLang(code);
      if (lang) return lang;
    }
    return null;
  }

  // "/kadu-help/de/tags", "/kadu-help/de/tags.html" and "/kadu-help/de/" all resolve.
  function currentPage() {
    const last = location.pathname.split("/").pop() || "index.html";
    return last.endsWith(".html") ? last : `${last}.html`;
  }

  function safePage(page) {
    if (!page) return "index.html";
    const name = page.replace(/\.html$/, "");
    return /^[a-z0-9-]+$/.test(name) ? `${name}.html` : "index.html";
  }

  function pageUrl(lang, page) {
    return ROOT + lang + "/" + (page === "index.html" ? "" : page);
  }

  // ── Routing (runs before the page renders) ─────────────────────────────

  const params = new URLSearchParams(location.search);
  const requested = normalizeLang(params.get("lang"));

  if (!pageLang) {
    // Root router page: pick a language and go there.
    const lang = requested || normalizeLang(read(LANG_KEY)) || browserLang() || DATA.fallback;
    if (requested) write(LANG_KEY, lang);
    location.replace(pageUrl(lang, safePage(params.get("page"))) + location.hash);
    return;
  }

  if (requested && requested !== pageLang) {
    write(LANG_KEY, requested);
    location.replace(pageUrl(requested, currentPage()) + location.hash);
    return;
  }

  write(LANG_KEY, pageLang);
  if (params.has("lang")) {
    params.delete("lang");
    const query = params.toString();
    history.replaceState(null, "", location.pathname + (query ? `?${query}` : "") + location.hash);
  }

  const L = DATA.langs.find((l) => l.code === pageLang) || DATA.langs[0];

  // ── Theme ──────────────────────────────────────────────────────────────

  const savedTheme = read(THEME_KEY);
  if (savedTheme) html.dataset.theme = savedTheme;

  function isDark() {
    const forced = html.dataset.theme;
    if (forced) return forced === "dark";
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }

  const ICONS = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  };

  const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // ── Chrome ─────────────────────────────────────────────────────────────

  function renderTopbar(page) {
    const bar = document.createElement("header");
    bar.className = "topbar";
    const options = DATA.langs
      .map((l) => `<option value="${l.code}"${l.code === L.code ? " selected" : ""}>${escapeHtml(l.name)}</option>`)
      .join("");
    bar.innerHTML = `
      <button class="icon-btn menu-btn" type="button" aria-label="${escapeHtml(L.ui.menu)}">${ICONS.menu}</button>
      <a class="brand" href="index.html">
        <img src="${ROOT}assets/icon.png" alt="" width="32" height="32">
        Kadu <span>· ${escapeHtml(L.ui.brand)}</span>
      </a>
      <div class="topbar-spacer"></div>
      <label class="lang-select" title="${escapeHtml(L.ui.language)}">
        ${ICONS.globe}
        <span class="sr-only">${escapeHtml(L.ui.language)}</span>
        <select>${options}</select>
      </label>
      <button class="icon-btn theme-btn" type="button" aria-label="${escapeHtml(L.ui.theme)}"></button>
    `;
    document.body.prepend(bar);

    bar.querySelector(".lang-select select").addEventListener("change", (e) => {
      const lang = e.target.value;
      write(LANG_KEY, lang);
      location.href = pageUrl(lang, page) + location.hash;
    });

    const themeBtn = bar.querySelector(".theme-btn");
    const paintThemeBtn = () => {
      themeBtn.innerHTML = isDark() ? ICONS.sun : ICONS.moon;
    };
    paintThemeBtn();
    themeBtn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      html.dataset.theme = next;
      write(THEME_KEY, next);
      paintThemeBtn();
    });

    bar.querySelector(".menu-btn").addEventListener("click", () => {
      document.body.classList.toggle("menu-open");
    });
  }

  function renderSidebar(page) {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    sidebar.setAttribute("aria-label", L.ui.menu);

    const link = (href, text) =>
      `<li><a href="${href}"${href === page ? ' aria-current="page"' : ""}>${escapeHtml(text)}</a></li>`;

    sidebar.innerHTML =
      `<ul class="sidebar-home">${link("index.html", L.ui.home)}</ul>` +
      L.groups
        .map(
          (group) => `
          <div class="sidebar-group">
            <p class="sidebar-title">${escapeHtml(group.title)}</p>
            <ul>${group.items.map((i) => link(i.href, i.text)).join("")}</ul>
          </div>`,
        )
        .join("");

    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    backdrop.addEventListener("click", () => document.body.classList.remove("menu-open"));
    document.body.append(backdrop);
  }

  function renderPager(page) {
    const pager = document.getElementById("pager");
    if (!pager) return;

    const flat = L.groups.flatMap((g) => g.items);
    const i = flat.findIndex((item) => item.href === page);
    if (i === -1) return;

    const prev = flat[i - 1];
    const next = flat[i + 1];
    pager.innerHTML =
      (prev ? `<a class="prev" href="${prev.href}"><small>${escapeHtml(L.ui.prev)}</small><strong>${escapeHtml(prev.text)}</strong></a>` : "") +
      (next ? `<a class="next" href="${next.href}"><small>${escapeHtml(L.ui.next)}</small><strong>${escapeHtml(next.text)}</strong></a>` : "");
  }

  // Wide tables scroll inside their own box instead of the whole page.
  function wrapTables() {
    document.querySelectorAll(".article table").forEach((table) => {
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      table.replaceWith(wrap);
      wrap.append(table);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = currentPage();
    renderTopbar(page);
    renderSidebar(page);
    renderPager(page);
    wrapTables();
  });
})();
