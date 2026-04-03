// Cloudflare Worker – fan_stories Proxy
// Deployment: Cloudflare Dashboard → Workers → New Worker
// Environment Variables setzen (nicht im Code!):
//   GH_TOKEN  = dein GitHub Personal Access Token
//   GH_REPO   = snailsstons/snailsstons
//   GH_BRANCH = main

const ALLOWED_ORIGIN = 'https://snailsstons.dragonschain.workers.dev';

export default {
  async fetch(request, env) {
    // CORS
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad Request', { status: 400, headers: cors });
    }

    const { member, heft, text } = body;
    if (!text || text.length < 20) {
      return new Response(JSON.stringify({ ok: false, error: 'Text zu kurz' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const path    = 'fan_stories.md';
    const apiBase = `https://api.github.com/repos/${env.GH_REPO}/contents/${path}`;
    const ghHeaders = {
      Authorization: `token ${env.GH_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'SnailsStons-Worker',
      'Content-Type': 'application/json',
    };

    // Bestehende Datei holen (SHA + Inhalt)
    let existing = '# SnailsStons – Fan Story Ideen\n';
    let sha = null;
    try {
      const r = await fetch(`${apiBase}?ref=${env.GH_BRANCH}`, { headers: ghHeaders });
      if (r.ok) {
        const j = await r.json();
        sha = j.sha;
        existing = atob(j.content.replace(/\n/g, ''));
      }
    } catch {}

    const datum = new Date().toISOString().split('T')[0];
    const entry = `\n---\n**Member:** ${(member || 'anonym').toUpperCase()}  \n**Datum:** ${datum}  \n**Heft-Bezug:** ${heft || '–'}  \n\n${text}\n`;
    const newContent = existing + entry;

    const putBody = {
      message: `Fan Story: ${member || 'anonym'} – ${datum}`,
      content: btoa(unescape(encodeURIComponent(newContent))),
      branch: env.GH_BRANCH,
    };
    if (sha) putBody.sha = sha;

    const put = await fetch(apiBase, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify(putBody),
    });

    return new Response(JSON.stringify({ ok: put.ok, status: put.status }),
      { headers: { ...cors, 'Content-Type': 'application/json' } });
  }
};
