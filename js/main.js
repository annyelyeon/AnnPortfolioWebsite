import { listPosts, listProjects } from "./api.js";
import { esc, pad, fmtDate, postUrl, projectUrl } from "./util.js";

const S = window.SITE;

const ICONS = {
  github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
  arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3.3 8h9.4M8.7 3.3 13.3 8l-4.6 4.7"/></svg>',
};

const NAV = [
  ["index.html", "Home"],
  ["projects.html", "Projects"],
  ["blog.html", "Dev Blog"],
  ["thoughts.html", "Thoughts"],
  ["about.html", "About Me"],
];

const current = location.pathname.split("/").pop() || "index.html";

const socialLinks = () =>
  Object.entries(S.socials)
    .map(([k, url]) => `<a class="icon-link" href="${esc(url)}" target="_blank" rel="noopener" aria-label="${k}">${ICONS[k]}</a>`)
    .join("");

// ----- Header & footer -----
const header = document.getElementById("site-header");
if (header) {
  header.className = "site-header";
  header.innerHTML = `
    <div class="container">
      <a class="logo" href="index.html">${esc(S.initials)}</a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav">Menu</button>
      <nav class="nav" id="nav">
        ${NAV.map(([href, label]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
      </nav>
    </div>`;
  const btn = header.querySelector(".nav-toggle");
  const nav = header.querySelector(".nav");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
    btn.textContent = open ? "Close" : "Menu";
  });
}

const footer = document.getElementById("site-footer");
if (footer) {
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container">
      <p>© ${new Date().getFullYear()} ${esc(S.name)}. All rights reserved.</p>
      <div class="socials">${socialLinks()}</div>
    </div>`;
}

// ----- Renderers -----
function projectCard(p, i) {
  const media = p.cover_url
    ? `<img src="${esc(p.cover_url)}" alt="${esc(p.title)} preview" loading="lazy">`
    : `<span class="ph">${esc(p.title.split(/\s+/).map((w) => w[0]).join("").slice(0, 2))}</span>`;
  return `
    <a class="card" href="${projectUrl(p)}">
      <div class="card-media" style="--tint:${esc(p.tint || "#e9e4dc")}">${media}</div>
      <span class="card-num">${pad(i + 1)}</span>
      <div class="card-body">
        <h3 class="h3">${esc(p.title)}</h3>
        <p>${esc(p.summary)}</p>
        <div class="tags">${(p.tech || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      </div>
    </a>`;
}

function postItem(p) {
  const label = p.category === "thoughts" ? "Thoughts" : "Blog";
  return `
    <li><a href="${postUrl(p)}">
      <span class="w-date">${fmtDate(p.published_at)}</span>
      <span class="w-title">${esc(p.title)}</span>
      <span class="tag ${p.category}">${label}</span>
    </a></li>`;
}

// Shows a loading line, then the items, an empty message, or an error.
async function fill(el, load, render, emptyMsg) {
  const note = (msg) => {
    const tag = el.tagName === "UL" ? "li" : "p";
    el.innerHTML = `<${tag} class="muted">${msg}</${tag}>`;
  };
  note("Loading…");
  try {
    const items = await load();
    items.length ? (el.innerHTML = items.map(render).join("")) : note(emptyMsg);
  } catch (err) {
    console.error(err);
    note("Couldn't load content right now.");
  }
}

document.querySelectorAll("[data-projects]").forEach((el) => {
  const opts = { limit: Number(el.dataset.projects) || undefined, featured: "featured" in el.dataset };
  fill(el, () => listProjects(opts), projectCard, "No projects yet.");
});

document.querySelectorAll("[data-posts]").forEach((el) => {
  const opts = { limit: Number(el.dataset.posts) || undefined, category: el.dataset.category };
  fill(el, () => listPosts(opts), postItem, "Nothing here yet.");
});

document.querySelectorAll("[data-avatar]").forEach((el) => {
  el.innerHTML = S.avatar ? `<img src="${esc(S.avatar)}" alt="Portrait of ${esc(S.name)}">` : esc(S.initials);
});

document.querySelectorAll("[data-about]").forEach((el) => {
  el.innerHTML = S.aboutShort.map((t, i) => `<p class="${i === 0 ? "lede" : ""}">${esc(t)}</p>`).join("");
});

document.querySelectorAll("[data-skills]").forEach((el) => {
  el.innerHTML = S.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join("");
});

document.querySelectorAll("[data-socials]").forEach((el) => (el.innerHTML = socialLinks()));

document.querySelectorAll("[data-email]").forEach((el) => {
  el.href = `mailto:${S.email}`;
  el.innerHTML = `${ICONS.mail}<span>${esc(S.email)}</span>`;
});

document.querySelectorAll("[data-icon]").forEach((el) => el.insertAdjacentHTML("beforeend", ICONS[el.dataset.icon]));
