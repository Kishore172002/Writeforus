/* Netlify Function — publish-post
   Called by admin.html after Netlify Identity login. Commits the
   post straight to GitHub (posts-data.js + a static /posts/<id>.html
   page), which Netlify's GitHub integration then auto-deploys.

   Required environment variables (set in Netlify → Site settings →
   Environment variables):
     GITHUB_TOKEN   — fine-grained PAT, Contents: Read and write, scoped to this repo only
     GITHUB_OWNER   — defaults to "Kishore172002"
     GITHUB_REPO    — defaults to "Writeforus"
     GITHUB_BRANCH  — defaults to "main"
     SITE_URL       — your live URL, e.g. https://thematerialdesk.netlify.app
*/

const { renderPostPage } = require('./_postTemplate');

const OWNER = process.env.GITHUB_OWNER || 'Kishore172002';
const REPO = process.env.GITHUB_REPO || 'Writeforus';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const SITE_URL = process.env.SITE_URL || 'https://thematerialdesk.netlify.app';
const API = 'https://api.github.com';

function toB64(str) { return Buffer.from(str, 'utf8').toString('base64'); }
function fromB64(str) { return Buffer.from(str, 'base64').toString('utf8'); }

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json'
  };
}

async function ghGet(path) {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, { headers: ghHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function ghPut(path, content, message, sha) {
  const body = { message, content: toB64(content), branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function ghDelete(path, message, sha) {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'DELETE', headers: ghHeaders(), body: JSON.stringify({ message, sha, branch: BRANCH })
  });
  if (!res.ok && res.status !== 404) throw new Error(`GitHub DELETE ${path} failed: ${res.status} ${await res.text()}`);
}

function parsePostsFile(text) {
  const vm = require('vm');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(text, sandbox);
  return sandbox.window.SITE_POSTS || [];
}

function serializePostsFile(posts) {
  return '/* Managed by the admin panel. Avoid hand-editing while the panel is in use. */\n\n' +
    'window.SITE_POSTS = ' + JSON.stringify(posts, null, 2) + ';\n';
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not authenticated — log in via the admin panel first.' }) };
  }
  if (!process.env.GITHUB_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server is missing GITHUB_TOKEN. Set it in Netlify → Site settings → Environment variables.' }) };
  }

  let payload;
  try { payload = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }
  const { action, post } = payload;
  if (!post || !post.id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing post.id' }) };
  }

  try {
    const dataFile = await ghGet('posts-data.js');
    let posts = dataFile ? parsePostsFile(fromB64(dataFile.content)) : [];

    if (action === 'delete') {
      posts = posts.filter(p => p.id !== post.id);
      await ghPut('posts-data.js', serializePostsFile(posts), `Remove post: ${post.title || post.id}`, dataFile ? dataFile.sha : undefined);
      const existingPage = await ghGet(`posts/${post.id}.html`);
      if (existingPage) await ghDelete(`posts/${post.id}.html`, `Remove static page: ${post.id}`, existingPage.sha);
      return { statusCode: 200, body: JSON.stringify({ ok: true, action: 'deleted' }) };
    }

    const idx = posts.findIndex(p => p.id === post.id);
    const isUpdate = idx > -1;
    if (isUpdate) posts[idx] = post; else posts.push(post);

    await ghPut('posts-data.js', serializePostsFile(posts), `${isUpdate ? 'Update' : 'Publish'} post: ${post.title}`, dataFile ? dataFile.sha : undefined);

    const pageHtml = renderPostPage(post, SITE_URL);
    const existingPage = await ghGet(`posts/${post.id}.html`);
    await ghPut(`posts/${post.id}.html`, pageHtml, `${existingPage ? 'Update' : 'Create'} static page: ${post.id}`, existingPage ? existingPage.sha : undefined);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        action: isUpdate ? 'updated' : 'published',
        url: `${SITE_URL.replace(/\/$/, '')}/posts/${post.id}.html`
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err.message || err) }) };
  }
};
