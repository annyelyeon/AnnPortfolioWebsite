import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

// Accept a pasted ".../rest/v1/" URL too — the client needs just the project origin.
const url = SUPABASE_URL.trim().replace(/\/(rest\/v1\/?)?$/, "").replace(/\/+$/, "");

// null until js/config.js is filled in — the public site then uses js/data.js.
export const db = url && SUPABASE_ANON_KEY ? createClient(url, SUPABASE_ANON_KEY.trim()) : null;

const byDateDesc = (a, b) => (b.published_at || "").localeCompare(a.published_at || "");

async function run(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function listPosts({ category, limit } = {}) {
  if (!db) {
    const list = window.POSTS.filter((p) => !category || p.category === category).sort(byDateDesc);
    return limit ? list.slice(0, limit) : list;
  }
  let q = db
    .from("posts")
    .select("slug,title,category,summary,published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (category) q = q.eq("category", category);
  if (limit) q = q.limit(limit);
  return run(q);
}

export async function listProjects({ featured, limit } = {}) {
  if (!db) {
    const list = window.PROJECTS.filter((p) => !featured || p.featured);
    return limit ? list.slice(0, limit) : list;
  }
  let q = db
    .from("projects")
    .select("slug,title,summary,tech,cover_url,tint")
    .eq("published", true)
    .order("sort_order")
    .order("published_at", { ascending: false });
  if (featured) q = q.eq("featured", true);
  if (limit) q = q.limit(limit);
  return run(q);
}

// table: "posts" | "projects"
export async function getBySlug(table, slug) {
  if (!db) {
    return (table === "posts" ? window.POSTS : window.PROJECTS).find((x) => x.slug === slug) || null;
  }
  return run(db.from(table).select("*").eq("slug", slug).eq("published", true).maybeSingle());
}
