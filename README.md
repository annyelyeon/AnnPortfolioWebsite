# Yelyeon — Portfolio

A static portfolio site (HTML/CSS/JS, no build step) with a built-in admin editor.
Posts and project reports are stored in **Supabase** and written in the browser at `/admin`.

```
index.html, projects.html, blog.html, thoughts.html, about.html   public pages
post.html?slug=…, project.html?slug=…                             full article pages
admin/                     login, dashboard, Markdown editor
js/config.js               your Supabase URL + anon key
js/data.js                 profile info (name, socials, skills) + sample content
js/api.js                  all database reads for the public site
supabase/schema.sql        tables, security rules, image bucket
```

Until `js/config.js` is filled in, the site shows the sample content from `js/data.js`.

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173 (and http://localhost:5173/admin/ for the editor).
Opening the HTML files directly (`file://`) won't work because the scripts are ES modules.

## Connect Supabase (one time, ~10 minutes)

1. **Create a project** at https://supabase.com → New project (the free tier is enough).
2. **Create the tables:** Dashboard → **SQL Editor** → New query → paste all of
   `supabase/schema.sql` → **Run**.
3. **Create your login:** Dashboard → **Authentication → Users → Add user → Create new user**.
   Enter your email and a strong password, and tick *Auto Confirm User*.
4. **Make that user an admin:** back in the SQL Editor, run (with your email):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
5. **Turn off public sign-ups:** Authentication → **Sign In / Providers** → disable
   *Allow new users to sign up*. (Even if left on, strangers couldn't write — only
   users in `admins` can — but there's no reason to allow it.)
6. **Paste your keys:** Project Settings → **API**. Copy the *Project URL* and the
   *anon / public* key into `js/config.js`. Never use the `service_role` key here.
7. Reload the site, go to `/admin/`, sign in, and write your first post.

## Writing

- **Dashboard** (`/admin/`): Posts and Projects tabs, each with drafts and published items.
- **Editor**: title, URL slug (filled in from the title), date, category or tech tags,
  summary, cover image, and the body in Markdown with a live preview.
- Paste or drag images straight into the editor — they upload to Supabase Storage.
- `Ctrl+S` saves, `Ctrl+B` / `Ctrl+I` for bold and italic.
- Only items with **Published** ticked appear on the site. Projects with
  **Featured** ticked appear on the home page (first 6, by *Order*).

## How security works

The anon key in `js/config.js` is public by design. What protects your content is
**Row Level Security** in `supabase/schema.sql`:

- Anyone can read rows where `published = true`.
- Only signed-in users listed in `public.admins` can read drafts, create, edit,
  delete, or upload images.
- Post bodies are sanitized (DOMPurify) before display, so Markdown can't run scripts.

## Hosting

Any static host works: GitHub Pages, Netlify, Vercel or Cloudflare Pages.
Upload the folder as-is; there's nothing to build. Content changes made in `/admin`
show up immediately without redeploying.
