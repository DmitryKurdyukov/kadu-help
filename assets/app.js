// Shared chrome for every page: top bar, sidebar menu, prev/next links and
// theme toggle. Pages only contain their own article — to add a section,
// create the .html file and add one line to NAV below.

const NAV = [
  {
    title: "Записи и поиск",
    items: [
      { href: "tags.html", text: "Теги" },
      { href: "filters.html", text: "Фильтры и поиск в ленте" },
      { href: "gestures.html", text: "Скрытые жесты и кнопки" },
    ],
  },
  {
    title: "Воспоминания",
    items: [
      { href: "gallery-memories.html", text: "Воспоминания из галереи" },
      { href: "slideshow.html", text: "Слайдшоу" },
    ],
  },
  {
    title: "Приватность",
    items: [
      { href: "private-pin.html", text: "Приватные категории и PIN-код" },
      { href: "fake-pin.html", text: "Поддельный PIN" },
    ],
  },
  {
    title: "Данные",
    items: [
      { href: "storage.html", text: "Где хранятся данные" },
      { href: "export-import.html", text: "Экспорт и импорт" },
    ],
  },
];

const ICONS = {
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
};

// "/kadu-help/tags", "/kadu-help/tags.html" and "/kadu-help/" all resolve.
function currentPage() {
  const last = location.pathname.split("/").pop() || "index.html";
  return last.endsWith(".html") ? last : `${last}.html`;
}

function readTheme() {
  try {
    return localStorage.getItem("kadu-help-theme");
  } catch {
    return null;
  }
}

function writeTheme(value) {
  try {
    localStorage.setItem("kadu-help-theme", value);
  } catch {
    /* private mode — the toggle still works for this page view */
  }
}

function isDark() {
  const forced = document.documentElement.dataset.theme;
  if (forced) return forced === "dark";
  return matchMedia("(prefers-color-scheme: dark)").matches;
}

function renderTopbar() {
  const bar = document.createElement("header");
  bar.className = "topbar";
  bar.innerHTML = `
    <button class="icon-btn menu-btn" type="button" aria-label="Разделы">${ICONS.menu}</button>
    <a class="brand" href="index.html">
      <img src="assets/icon.png" alt="" width="32" height="32">
      Kadu <span>· Руководство</span>
    </a>
    <div class="topbar-spacer"></div>
    <button class="icon-btn theme-btn" type="button" aria-label="Сменить тему"></button>
  `;
  document.body.prepend(bar);

  const themeBtn = bar.querySelector(".theme-btn");
  const paintThemeBtn = () => {
    themeBtn.innerHTML = isDark() ? ICONS.sun : ICONS.moon;
  };
  paintThemeBtn();
  themeBtn.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    writeTheme(next);
    paintThemeBtn();
  });

  bar.querySelector(".menu-btn").addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
  });
}

function renderSidebar(page) {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  const link = (href, text) =>
    `<li><a href="${href}"${href === page ? ' aria-current="page"' : ""}>${text}</a></li>`;

  sidebar.innerHTML =
    `<ul class="sidebar-home">${link("index.html", "Главная")}</ul>` +
    NAV.map(
      (group) => `
        <div class="sidebar-group">
          <p class="sidebar-title">${group.title}</p>
          <ul>${group.items.map((i) => link(i.href, i.text)).join("")}</ul>
        </div>`,
    ).join("");

  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.addEventListener("click", () => document.body.classList.remove("menu-open"));
  document.body.append(backdrop);
}

function renderPager(page) {
  const pager = document.getElementById("pager");
  if (!pager) return;

  const flat = NAV.flatMap((g) => g.items);
  const i = flat.findIndex((item) => item.href === page);
  if (i === -1) return;

  const prev = flat[i - 1];
  const next = flat[i + 1];
  pager.innerHTML =
    (prev ? `<a class="prev" href="${prev.href}"><small>Назад</small><strong>${prev.text}</strong></a>` : "") +
    (next ? `<a class="next" href="${next.href}"><small>Далее</small><strong>${next.text}</strong></a>` : "");
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

const saved = readTheme();
if (saved) document.documentElement.dataset.theme = saved;

document.addEventListener("DOMContentLoaded", () => {
  const page = currentPage();
  renderTopbar();
  renderSidebar(page);
  renderPager(page);
  wrapTables();
});
