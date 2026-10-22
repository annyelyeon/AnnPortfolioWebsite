import { db } from "../js/api.js";
import { renderMarkdown } from "../js/markdown.js";
import { esc, postUrl, projectUrl } from "../js/util.js";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const type = params.get("type") === "projects" ? "projects" : "posts";
let id = params.get("id");

const form = $("#editor-form");
const F = form.elements;
const status = $("#save-status");
const msg = $("#edit-msg");

let dirty = false;
let slugTouched = Boolean(id);
let coverUrl = null;

$("#back-link").href = `index.html#${type}`;

if (!db) msg.innerHTML = 'Supabase isn\'t connected yet — see <a href="index.html">the admin page</a>.';
else boot();

async function boot() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return location.replace("index.html");

  document.querySelectorAll("[data-only]").forEach((el) => (el.hidden = el.dataset.only !== type));
  F.title.placeholder = type === "posts" ? "Post title" : "Project name";

  if (id) {
    const { data, error } = await db.from(type).select("*").eq("id", id).single();
    if (error) return (msg.textContent = error.message);
    fill(data);
  } else {
    F.published_at.value = new Date().toISOString().slice(0, 10);
    setCover(null);
  }
  document.title = `${id ? "Edit" : "New"} ${type === "posts" ? "post" : "project"} — Admin`;
  msg.hidden = true;
  form.hidden = false;
  updatePreview();
  if (!id) F.title.focus();
}

// ----- Form <-> row -----
function fill(r) {
  F.title.value = r.title;
  F.slug.value = r.slug;
  F.published_at.value = r.published_at || "";
  F.summary.value = r.summary || "";
  F.content.value = r.content || "";
  F.published.checked = r.published;
  if (type === "posts") {
    F.category.value = r.category;
  } else {
    F.tech.value = (r.tech || []).join(", ");
    F.demo_url.value = r.demo_url || "";
    F.repo_url.value = r.repo_url || "";
    F.tint.value = r.tint || "#e9e4dc";
    F.sort_order.value = r.sort_order ?? 0;
    F.featured.checked = r.featured;
  }
  setCover(r.cover_url);
  afterSave(r);
}

function collect() {
  const row = {
    title: F.title.value.trim(),
    slug: F.slug.value.trim(),
    published_at: F.published_at.value || null,
    summary: F.summary.value.trim(),
    content: F.content.value,
    cover_url: coverUrl,
    published: F.published.checked,
  };
  if (type === "posts") {
    row.category = F.category.value;
  } else {
    Object.assign(row, {
      tech: F.tech.value.split(",").map((s) => s.trim()).filter(Boolean),
      demo_url: F.demo_url.value.trim() || null,
      repo_url: F.repo_url.value.trim() || null,
      tint: F.tint.value,
      sort_order: Number(F.sort_order.value) || 0,
      featured: F.featured.checked,
    });
  }
  return row;
}

function afterSave(r) {
  const view = $("#view-link");
  view.href = (type === "posts" ? postUrl : projectUrl)(r, "../");
  view.hidden = !r.published;
  $("#delete-btn").hidden = false;
  slugTouched = true;
}

// Letters and numbers in any language (so Korean titles work), joined by "-".
const slugify = (s) =>
  s.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// ----- Save / delete -----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!F.slug.value.trim()) F.slug.value = slugify(F.title.value) || `untitled-${Date.now().toString(36)}`;
  F.slug.value = slugify(F.slug.value);
  if (!F.title.value.trim()) {
    status.textContent = "Add a title first.";
    return F.title.focus();
  }
  if (!form.checkValidity()) return form.reportValidity();

  status.textContent = "Saving…";
  const row = collect();
  const query = id ? db.from(type).update(row).eq("id", id) : db.from(type).insert(row);
  const { data, error } = await query.select().single();
  if (error) {
    status.textContent = error.code === "23505" ? "That URL slug is already used — change it." : error.message;
    return;
  }
  id = data.id;
  history.replaceState(null, "", `?type=${type}&id=${id}`);
  dirty = false;
  status.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  afterSave(data);
});

$("#delete-btn").addEventListener("click", async () => {
  if (!confirm(`Delete “${F.title.value}”? This can't be undone.`)) return;
  const { error } = await db.from(type).delete().eq("id", id);
  if (error) return (status.textContent = error.message);
  dirty = false;
  location.href = `index.html#${type}`;
});

document.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === "s") { e.preventDefault(); form.requestSubmit(); }
  if (e.target === F.content && k === "b") { e.preventDefault(); format("bold"); }
  if (e.target === F.content && k === "i") { e.preventDefault(); format("italic"); }
});

window.addEventListener("beforeunload", (e) => {
  if (dirty) e.preventDefault();
});

form.addEventListener("input", (e) => {
  dirty = true;
  status.textContent = "Unsaved changes";
  if (e.target === F.title && !slugTouched) F.slug.value = slugify(F.title.value);
  if (e.target === F.slug) slugTouched = true;
  if (e.target === F.content) updatePreview();
});

// ----- Images -----
async function upload(file) {
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${type}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return db.storage.from("media").getPublicUrl(path).data.publicUrl;
}

function setCover(url) {
  coverUrl = url || null;
  $("#cover-preview").innerHTML = coverUrl ? `<img src="${esc(coverUrl)}" alt="">` : "<span>No cover</span>";
  $("#cover-remove").hidden = !coverUrl;
}

$("#cover-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  status.textContent = "Uploading cover…";
  try {
    setCover(await upload(file));
    dirty = true;
    status.textContent = "Cover uploaded — save to keep it";
  } catch (err) {
    status.textContent = `Upload failed: ${err.message}`;
  }
});

$("#cover-remove").addEventListener("click", () => {
  setCover(null);
  dirty = true;
  status.textContent = "Unsaved changes";
});

async function insertImages(files) {
  const images = [...files].filter((f) => f.type.startsWith("image/"));
  for (const file of images) {
    status.textContent = `Uploading ${file.name}…`;
    try {
      const url = await upload(file);
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "");
      insert(`\n![${alt}](${url})\n`);
      status.textContent = "Image added";
    } catch (err) {
      status.textContent = `Upload failed: ${err.message}`;
    }
  }
  return images.length;
}

$("#img-input").addEventListener("change", (e) => {
  insertImages(e.target.files);
  e.target.value = "";
});

F.content.addEventListener("paste", (e) => {
  if ([...e.clipboardData.files].some((f) => f.type.startsWith("image/"))) {
    e.preventDefault();
    insertImages(e.clipboardData.files);
  }
});
F.content.addEventListener("dragover", (e) => e.preventDefault());
F.content.addEventListener("drop", (e) => {
  if (e.dataTransfer.files.length) {
    e.preventDefault();
    insertImages(e.dataTransfer.files);
  }
});

// ----- Toolbar -----
const MD = {
  bold: ["**", "**", "bold text"],
  italic: ["_", "_", "italic text"],
  h2: ["\n## ", "", "Heading"],
  h3: ["\n### ", "", "Subheading"],
  link: ["[", "](https://)", "link text"],
  quote: ["\n> ", "", "Quote"],
  list: ["\n- ", "", "List item"],
  code: ["\n```\n", "\n```\n", "code"],
};

function format(kind) {
  const ta = F.content;
  let [before, after, placeholder] = MD[kind];
  const { selectionStart: s, selectionEnd: e, value } = ta;
  if (s === 0 || value[s - 1] === "\n") before = before.replace(/^\n/, "");
  const text = value.slice(s, e) || placeholder;
  ta.setRangeText(before + text + after, s, e, "end");
  ta.setSelectionRange(s + before.length, s + before.length + text.length);
  ta.focus();
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

function insert(text) {
  const ta = F.content;
  ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
  ta.focus();
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

document.querySelectorAll("[data-md]").forEach((b) => b.addEventListener("click", () => format(b.dataset.md)));

// ----- Preview -----
let frame;
function updatePreview() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    $("#preview").innerHTML = F.content.value.trim()
      ? renderMarkdown(F.content.value)
      : '<p class="muted">Nothing to preview yet.</p>';
  });
}

document.querySelectorAll("[data-view-btn]").forEach((b) =>
  b.addEventListener("click", () => {
    $(".editor").dataset.view = b.dataset.viewBtn;
    document.querySelectorAll("[data-view-btn]").forEach((x) => x.setAttribute("aria-selected", x === b));
  })
);
