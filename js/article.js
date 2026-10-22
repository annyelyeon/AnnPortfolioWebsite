import { getBySlug } from "./api.js";
import { renderMarkdown } from "./markdown.js";
import { esc, fmtDate } from "./util.js";

// <body data-type="posts"> on post.html, "projects" on project.html
const type = document.body.dataset.type;
const slug = new URLSearchParams(location.search).get("slug");
const root = document.getElementById("article");

function backLink(item) {
  if (type === "projects") return ["projects.html", "Projects"];
  return item?.category === "thoughts" ? ["thoughts.html", "Thoughts"] : ["blog.html", "Dev Blog"];
}

function render(item) {
  const [href, label] = backLink(item);
  const isPost = type === "posts";
  const meta = isPost
    ? `<span class="tag ${item.category}">${item.category === "thoughts" ? "Thoughts" : "Blog"}</span>`
    : (item.tech || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  const links = isPost
    ? ""
    : [
        item.demo_url && `<a class="btn primary" href="${esc(item.demo_url)}" target="_blank" rel="noopener">Live demo</a>`,
        item.repo_url && `<a class="btn" href="${esc(item.repo_url)}" target="_blank" rel="noopener">Source code</a>`,
      ].filter(Boolean).join("");

  document.title = `${item.title} — ${window.SITE.name}`;
  root.innerHTML = `
    <div class="section-head">
      <a class="tag" href="${href}">← ${label}</a>
      <span class="w-date">${fmtDate(item.published_at)}</span>
    </div>
    <header class="article-head">
      <h1 class="h1">${esc(item.title)}</h1>
      ${item.summary ? `<p class="lede">${esc(item.summary)}</p>` : ""}
      <div class="tags">${meta}</div>
      ${links ? `<div class="hero-actions">${links}</div>` : ""}
    </header>
    ${item.cover_url ? `<img class="article-cover" src="${esc(item.cover_url)}" alt="">` : ""}
    <div class="md">${renderMarkdown(item.content)}</div>`;
}

function notFound() {
  const [href, label] = backLink();
  root.innerHTML = `
    <h1 class="h2">Not found</h1>
    <p class="lede">This page doesn't exist or isn't published yet.</p>
    <div><a class="btn" href="${href}">Back to ${label}</a></div>`;
}

(async () => {
  if (!slug) return notFound();
  try {
    const item = await getBySlug(type, slug);
    item ? render(item) : notFound();
  } catch (err) {
    console.error(err);
    root.innerHTML = `<p class="muted">Couldn't load this page right now.</p>`;
  }
})();
