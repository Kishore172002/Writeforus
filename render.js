/* ============================================================
   The Living Edit — render.js
   Reads window.SITE_POSTS (from posts-data.js) and renders it
   into whichever page includes this script. No build step,
   no server required — works straight off the filesystem.
   ============================================================ */

function mdEscape(str){
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}

function formatDate(iso){
  try{
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' });
  }catch(e){ return iso; }
}

function categoryChipClass(cat){
  const map = { Laminate:'laminate', Veneer:'veneer', Louvers:'louvers', Plywood:'plywood', 'Interior Decor':'interior-decor', 'Home Improvement':'home-improvement', Fashion:'fashion', Lifestyle:'lifestyle' };
  return map[cat] || 'laminate';
}

function postThumb(post){
  if(post.image){
    return `<img class="post-card-thumb" src="${post.image}" alt="${mdEscape(post.imageAlt || post.title)}" loading="lazy">`;
  }
  return `<span class="post-card-thumb chip ${categoryChipClass(post.category)}" aria-hidden="true"></span>`;
}

function sortPostsDesc(posts){
  return [...posts].sort((a,b) => (a.date < b.date ? 1 : -1));
}

/* ---------- homepage: latest N posts ---------- */
function renderRecentPosts(containerId, count){
  const el = document.getElementById(containerId);
  if(!el || !window.SITE_POSTS) return;
  const posts = sortPostsDesc(window.SITE_POSTS).slice(0, count || 4);
  el.innerHTML = posts.map((p, i) => `
    <article class="post-card">
      <span class="index">${String(i+1).padStart(2,'0')}</span>
      <div class="post-card-body">
        <span class="tag">${mdEscape(p.category)}</span>
        <h3><a class="title-link" href="posts/${p.id}.html">${mdEscape(p.title)}</a></h3>
        <p>${mdEscape(p.excerpt)}</p>
        <div class="meta">${mdEscape(p.readTime)} · ${formatDate(p.date)}</div>
      </div>
      <a class="post-card-media" href="posts/${p.id}.html" aria-label="Read ${mdEscape(p.title)}">${postThumb(p)}</a>
    </article>
  `).join('');
}

/* ---------- blog listing with category filter ---------- */
function renderBlogList(activeCategory){
  const el = document.getElementById('blog-posts');
  if(!el || !window.SITE_POSTS) return;
  let posts = sortPostsDesc(window.SITE_POSTS);
  if(activeCategory && activeCategory !== 'All'){
    posts = posts.filter(p => p.category === activeCategory);
  }
  if(posts.length === 0){
    el.innerHTML = `<p style="color:var(--ink-soft);padding:30px 0;">No posts in this category yet.</p>`;
    return;
  }
  el.innerHTML = posts.map((p, i) => `
    <article class="post-card">
      <span class="index">${String(i+1).padStart(2,'0')}</span>
      <div class="post-card-body">
        <span class="tag">${mdEscape(p.category)}</span>
        <h3><a class="title-link" href="posts/${p.id}.html">${mdEscape(p.title)}</a></h3>
        <p>${mdEscape(p.excerpt)}</p>
        <div class="meta">${mdEscape(p.readTime)} · ${formatDate(p.date)}</div>
      </div>
      <a class="post-card-media" href="posts/${p.id}.html" aria-label="Read ${mdEscape(p.title)}">${postThumb(p)}</a>
    </article>
  `).join('');
}

function initBlogFilters(){
  const row = document.getElementById('filter-row');
  if(row && window.SITE_POSTS){
    const categories = [...new Set(window.SITE_POSTS.map(p => p.category).filter(Boolean))]
      .sort((a,b) => a.localeCompare(b));
    row.innerHTML = ['All', ...categories].map(category =>
      `<button type="button" class="tag-pill${category === 'All' ? ' active' : ''}" data-category="${mdEscape(category)}">${mdEscape(category)}</button>`
    ).join('');
  }
  const pills = document.querySelectorAll('.tag-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderBlogList(pill.dataset.category);
    });
  });
  renderBlogList('All');
}

/* ---------- single post page ---------- */
function renderSinglePost(){
  const el = document.getElementById('post-article');
  if(!el || !window.SITE_POSTS) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('post');
  const post = window.SITE_POSTS.find(p => p.id === id);

  if(!post){
    el.innerHTML = `
      <div class="lead-block" style="padding-top:10px;">
        <h1>Post not found</h1>
        <p class="lede">This article may have been unpublished or the link is out of date.</p>
        <p><a href="blog.html">← Back to the blog</a></p>
      </div>`;
    document.title = 'Post not found — The Living Edit';
    return;
  }

  document.title = post.title + ' — The Living Edit';
  const heroImg = post.image
    ? `<img src="${post.image}" alt="${mdEscape(post.imageAlt || post.title)}" style="width:100%;border-radius:3px;border:1px solid var(--line-strong);margin:22px 0 8px;">`
    : `<span class="chip ${categoryChipClass(post.category)}" style="display:block;width:100%;height:220px;border-radius:3px;margin:22px 0 8px;"></span>`;

  el.innerHTML = `
    <div class="lead-block" style="padding-bottom:0;">
      <span class="tag" style="display:inline-block;margin-bottom:14px;">${mdEscape(post.category)}</span>
      <h1 style="max-width:22ch;">${mdEscape(post.title)}</h1>
      <div class="meta" style="margin-top:16px;color:var(--ink-soft);font-size:0.85rem;">${formatDate(post.date)} · ${mdEscape(post.readTime)}</div>
    </div>
    ${heroImg}
    <div class="prose" style="max-width:70ch;padding-bottom:60px;">
      ${post.contentHtml}
    </div>
    <p style="padding-bottom:60px;"><a href="blog.html">← Back to all posts</a></p>
  `;
}
