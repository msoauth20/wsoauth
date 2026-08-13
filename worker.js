/**
 * Microsoft OAuth2 Token 代理 Worker (Cloudflare Workers)
 *
 * 作用：接收前端发来的 code，服务端转发给微软换 token，绕过浏览器 CORS 限制。
 *
 * 路由：
 *   POST /token   → 用 code 换 access_token / refresh_token
 *   POST /refresh → 用 refresh_token 刷新 access_token
 *   GET  /        → 简单说明页
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DEFAULT_CLIENT_ID = '9e5f94bc-e8a4-4e73-b8be-63364c29d753';
const TOKEN_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const DEFAULT_SCOPES = 'offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send';
const REDIRECT_URI = 'http://localhost';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/' || path === '/index.html') {
        return new Response(
          '<h2>🔐 Microsoft OAuth2 Token 代理</h2>' +
          '<p>此服务为前端提供 token 交换代理，解决 CORS 限制。</p>' +
          '<p>请使用配套的 index.html 前端页面。</p>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS } }
        );
      }

      if (path === '/token' && request.method === 'POST') {
        return await handleTokenExchange(request);
      }

      if (path === '/refresh' && request.method === 'POST') {
        return await handleTokenRefresh(request);
      }

      return jsonResponse({ error: 'Not Found' }, 404);
    } catch (err) {
      return jsonResponse({ error: 'Internal Error', message: err.message }, 500);
    }
  },
};

// ─────────────────────────────────────────
// POST /token — 用 authorization code 换 token
// ─────────────────────────────────────────
async function handleTokenExchange(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { code, client_id, client_secret } = body;

  if (!code) {
    return jsonResponse({ error: 'code is required' }, 400);
  }

  const clientId = client_id || DEFAULT_CLIENT_ID;

  const params = new URLSearchParams({
    client_id: clientId,
    scope: DEFAULT_SCOPES,
    code: code,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  if (client_secret && client_secret.trim()) {
    params.set('client_secret', client_secret.trim());
  }

  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await resp.json();

  if (!resp.ok) {
    return jsonResponse({
      error: data.error || 'token_exchange_failed',
      error_description: data.error_description || 'Token 交换失败',
    }, resp.status);
  }

  return jsonResponse({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
  });
}

// ─────────────────────────────────────────
// POST /refresh — 用 refresh_token 刷新 access_token
// ─────────────────────────────────────────
async function handleTokenRefresh(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { refresh_token, client_id, client_secret } = body;

  if (!refresh_token) {
    return jsonResponse({ error: 'refresh_token is required' }, 400);
  }

  const clientId = client_id || DEFAULT_CLIENT_ID;

  const params = new URLSearchParams({
    client_id: clientId,
    scope: DEFAULT_SCOPES,
    refresh_token: refresh_token,
    grant_type: 'refresh_token',
  });

  if (client_secret && client_secret.trim()) {
    params.set('client_secret', client_secret.trim());
  }

  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await resp.json();

  if (!resp.ok) {
    return jsonResponse({
      error: data.error || 'refresh_failed',
      error_description: data.error_description || '刷新 Token 失败',
    }, resp.status);
  }

  return jsonResponse({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
  });
}

// ─────────────────────────────────────────
// Helper
// ─────────────────────────────────────────
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
