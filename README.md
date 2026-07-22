# The Living Edit

Independent blog covering laminate, veneer, louvers and plywood for renovators in Salem & Chennai.

## Structure
- `index.html` — home
- `blog.html` — post listing with category filters
- `post.html` — single post template (reads `?post=<id>` from `posts-data.js`)
- `about.html`, `write-for-us.html`
- `admin.html` — content authoring panel (not linked from public nav)
- `posts-data.js` — all post content (the site's "database")
- `render.js` — shared rendering logic
- `style.css` — shared styles

## Publishing a new post
1. Open `admin.html` locally (or on the deployed site).
2. Write the post, click **Save post to this session**.
3. Click **Download posts-data.js** and replace the file in this repo with the downloaded one.
4. Commit and push (or redeploy on Netlify) — the change goes live everywhere.

Static site, no build step, no backend required.
