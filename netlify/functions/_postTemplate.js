/* Shared by the Netlify Function and the one-off seed script.
   Renders a fully static, self-contained post page — no client-side
   fetch of posts-data.js required, so search engines see real HTML. */

function escapeHtml(str){
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function categoryChipClass(cat){
  const map = { Laminate: 'laminate', Veneer: 'veneer', Louvers: 'louvers', Plywood: 'plywood' };
  return map[cat] || 'laminate';
}

function renderPostPage(post, siteUrl){
  const base = (siteUrl || 'https://thematerialdesk.netlify.app').replace(/\/$/, '');
  const url = `${base}/posts/${post.id}.html`;
  const desc = escapeHtml(post.excerpt || '');
  const title = escapeHtml(post.title || '');

  const heroImg = post.image
    ? `<img src="${post.image}" alt="${title}" style="width:100%;border-radius:3px;border:1px solid var(--line-strong);margin:22px 0 8px;">`
    : `<span class="chip ${categoryChipClass(post.category)}" style="display:block;width:100%;height:220px;border-radius:3px;margin:22px 0 8px;"></span>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "datePublished": post.date,
    "dateModified": post.date,
    "author": { "@type": "Organization", "name": "The Materials Desk" },
    "publisher": { "@type": "Organization", "name": "The Materials Desk" },
    "description": post.excerpt,
    "mainEntityOfPage": url
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — The Materials Desk</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<link rel="stylesheet" href="../style.css">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>

<header class="site">
  <div class="site-header-inner">
    <div class="brand">
      <span class="name">The Materials Desk</span>
      <span class="tag">Notes on interior materials</span>
    </div>
    <nav class="primary">
      <a href="../index.html">Home</a>
      <a href="../blog.html" class="active">Blog</a>
      <a href="../about.html">About Us</a>
      <a href="../write-for-us.html">Write For Us</a>
      <a href="../contact.html">Contact Us</a>
    </nav>
  </div>
</header>
<div class="grain"></div>

<main>
  <div class="wrap">
    <article>
      <div class="lead-block" style="padding-bottom:0;">
        <span class="tag" style="display:inline-block;margin-bottom:14px;">${escapeHtml(post.category)}</span>
        <h1 style="max-width:22ch;">${title}</h1>
        <div class="meta" style="margin-top:16px;color:var(--ink-soft);font-size:0.85rem;">${escapeHtml(post.date)} · ${escapeHtml(post.readTime || '')}</div>
      </div>
      ${heroImg}
      <div class="prose" style="max-width:70ch;padding-bottom:60px;">
        ${post.contentHtml}
      </div>
      <p style="padding-bottom:60px;"><a href="../blog.html">← Back to all posts</a></p>
    </article>
  </div>
</main>

<footer class="site">
  <div class="wrap">
    <div class="footer-inner">
      <div class="col">
        <h4>The Materials Desk</h4>
        <p style="font-size:0.9rem;color:var(--ink-soft);max-width:32ch;">Independent notes on laminate, veneer, louvers and plywood, written for people renovating in Salem and Chennai.</p>
      </div>
      <div class="col">
        <h4>Site</h4>
        <a href="../index.html">Home</a>
        <a href="../blog.html">Blog</a>
        <a href="../about.html">About Us</a>
      </div>
      <div class="col">
        <h4>Get involved</h4>
        <a href="../write-for-us.html">Write For Us</a>
        <a href="../contact.html">Contact Us</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 The Materials Desk. Reader-supported, independently written.</span>
      <span>Editorial mail: hello@thematerialsdesk.example</span>
      <span><a href="../admin.html">Admin</a></span>
    </div>
  </div>
</footer>

</body>
</html>`;
}

module.exports = { renderPostPage, escapeHtml, categoryChipClass };
