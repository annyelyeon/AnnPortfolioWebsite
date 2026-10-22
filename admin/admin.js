import { db } from "../js/api.js";
import { esc, fmtDate } from "../js/util.js";

const $ = (s) => document.querySelector(s);
const show = (id) => ["setup", "login", "dashboard"].forEach((x) => ($("#" + x).hidden = x !== id));
const loginMsg = $("#login-form .form-msg");

if (!db) show("setup");
else init();

async function init() {
  const { data: { session } } = await db.auth.getSession();
  session ? enter() : show("login");
}

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  loginMsg.textContent = "Signing in…";
  const { error } = await db.auth.signInWithPassword({ email: f.email.value, password: f.password.value });
  if (error) return (loginMsg.textContent = error.message);
  f.reset();
  loginMsg.textContent = "";
  enter();
});

$("#sign-out").addEventListener("click", async () => {
  await db.auth.signOut();
  location.reload();
});

async function enter() {
  const { data: isAdmin, error } = await db.rpc("is_admin");
  if (error || !isAdmin) {
    await db.auth.signOut();
    show("login");
    loginMsg.textContent = error ? error.message : "This account doesn't have admin access.";
    return;
  }
  $("#admin-actions").hidden = false;
  show("dashboard");
  loadTab(location.hash === "#projects" ? "projects" : "posts");
}

document.querySelectorAll("[data-tab]").forEach((b) =>
  b.addEventListener("click", () => {
    history.replaceState(null, "", "#" + b.dataset.tab);
    loadTab(b.dataset.tab);
  })
);

async function loadTab(tab) {
  document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
  const btn = $("#new-btn");
  btn.href = `edit.html?type=${tab}`;
  btn.textContent = tab === "posts" ? "+ New post" : "+ New project";

  const list = $("#admin-list");
  list.innerHTML = `<li class="muted">Loading…</li>`;
  const { data, error } = await db
    .from(tab)
    .select(tab === "posts" ? "id,title,category,published,published_at" : "id,title,featured,published,published_at")
    .order("published_at", { ascending: false, nullsFirst: true });
  if (error) return (list.innerHTML = `<li class="muted">${esc(error.message)}</li>`);
  if (!data.length) return (list.innerHTML = `<li class="muted">Nothing yet — click “${btn.textContent.slice(2)}” to write your first one.</li>`);

  list.innerHTML = data
    .map((r) => {
      const kind = tab === "posts" ? (r.category === "thoughts" ? "Thoughts" : "Blog") : r.featured ? "Featured" : "Project";
      return `
        <li><a href="edit.html?type=${tab}&id=${r.id}">
          <span class="w-date">${fmtDate(r.published_at) || "No date"}</span>
          <span class="w-title">${esc(r.title)} <small>${kind}</small></span>
          <span class="tag ${r.published ? "thoughts" : ""}">${r.published ? "Published" : "Draft"}</span>
        </a></li>`;
    })
    .join("");
}
