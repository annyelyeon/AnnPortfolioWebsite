export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const pad = (n) => String(n).padStart(2, "0");

export const fmtDate = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

export const postUrl = (p, base = "") => `${base}post.html?slug=${encodeURIComponent(p.slug)}`;
export const projectUrl = (p, base = "") => `${base}project.html?slug=${encodeURIComponent(p.slug)}`;
