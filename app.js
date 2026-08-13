/**
 * Microsoft OAuth2 前端逻辑
 * - 授权跳转
 * - 通过代理服务交换 Token
 * - 复制 Token
 */

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── 跳转到微软授权页 ──
function handleAuthorize() {
  var clientId = document.getElementById('input-client-id').value.trim() || '9e5f94bc-e8a4-4e73-b8be-63364c29d753';
  var scopes = encodeURIComponent('offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send');
  var redirectUri = encodeURIComponent('http://localhost');

  var authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&response_type=code' +
    '&redirect_uri=' + redirectUri +
    '&response_mode=query' +
    '&scope=' + scopes +
    '&prompt=consent';

  window.open(authUrl, '_blank');
  document.getElementById('input-code').focus();
}

// ── 页面加载时检查 URL 中是否有 code ──
window.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var code = params.get('code');
  if (code) {
    document.getElementById('input-code').value = code;
    exchangeCode();
  }
});

// ── 通过代理交换 Token ──
async function exchangeCode() {
  var code = decodeURIComponent(document.getElementById('input-code').value.trim() || '');
  var el = document.getElementById('result');

  if (!code) {
    el.innerHTML = '<div class="error-msg">⚠️ 请输入 Authorization Code</div>';
    return;
  }

  var proxyUrl = document.getElementById('input-proxy').value.trim() || 'https://msoauth.pages.dev';

  // 去掉末尾斜杠
  proxyUrl = proxyUrl.replace(/\/+$/, '');

  var clientId = document.getElementById('input-client-id').value.trim() || '9e5f94bc-e8a4-4e73-b8be-63364c29d753';
  var clientSecret = document.getElementById('input-client-secret').value.trim();

  el.innerHTML = '<div style="color: #64b5f6;">⏳ 正在通过代理交换 Token...</div>';

  try {
    var resp = await fetch(proxyUrl + '/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        client_id: clientId,
        client_secret: clientSecret || undefined,
      }),
    });

    var data = await resp.json();

    if (!resp.ok || data.error) {
      el.innerHTML = '<div class="error-msg">❌ ' +
        escapeHTML(data.error_description || data.error || '未知错误') + '</div>';
      return;
    }

    // 成功展示 Token
    var t = data;
    el.innerHTML =
      '<div class="success-box">' +
        '<h4>✅ Token 获取成功！</h4>' +
        '<div class="token-section">' +
          '<div class="token-block">' +
            '<label>Access Token <button onclick="copyToken(\'access\')" class="copy-btn">📋 复制</button></label>' +
            '<textarea id="access-token" readonly>' + escapeHTML(t.access_token) + '</textarea>' +
          '</div>' +
          '<div class="token-block">' +
            '<label>Refresh Token <button onclick="copyToken(\'refresh\')" class="copy-btn">📋 复制</button></label>' +
            '<textarea id="refresh-token" readonly>' + escapeHTML(t.refresh_token) + '</textarea>' +
          '</div>' +
          '<div class="meta">' +
            '<span>⏱️ 有效期: <strong>' + t.expires_in + 's</strong> (' + Math.round(t.expires_in / 60) + ' 分钟)</span>' +
            '<span>🔑 类型: <strong>' + escapeHTML(t.token_type) + '</strong></span>' +
          '</div>' +
          '<div class="meta">' +
            '<span>📎 权限: <code>' + escapeHTML(t.scope) + '</code></span>' +
          '</div>' +
        '</div>' +
        '<div class="warn">⚠️ 请立即保存 Refresh Token！关闭页面后无法再次查看。</div>' +
      '</div>';
  } catch (err) {
    el.innerHTML = '<div class="error-msg">❌ 请求失败: ' + escapeHTML(err.message) +
      '<br>请检查代理地址是否正确</div>';
  }
}

// ── 复制 Token ──
function copyToken(type) {
  var el = document.getElementById(type + '-token');
  if (el) {
    navigator.clipboard.writeText(el.value);
  }
}
