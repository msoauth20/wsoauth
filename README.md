# wsoauth - Microsoft OAuth2 授权工具

纯前端 + Cloudflare Worker 代理的 Microsoft OAuth2 授权工具，用于获取 Access Token 和 Refresh Token。

## 📁 项目结构

```
wsoauth/
├── index.html      ← 前端页面（浏览器打开）
├── style.css       ← 样式文件
├── app.js          ← 前端逻辑
├── worker.js       ← 后端代理（部署到 Cloudflare Workers）
└── README.md       ← 本文档
```

## 🔧 工作原理

```
浏览器 (index.html)              Cloudflare Worker              Microsoft
       │                              │                              │
       │  1. 用户点击「获取授权code」     │                              │
       │  → 跳转到微软登录页            │                              │
       │─────────────────────────────────────────────────────────────→│
       │                              │                              │
       │  2. 登录授权后微软跳回 localhost?code=xxx                     │
       │←─────────────────────────────────────────────────────────────│
       │                              │                              │
       │  3. 用户复制 code 粘贴到页面    │                              │
       │  → 前端 POST code 给代理       │                              │
       │─────────────────────────────→│                              │
       │                              │  4. 代理用 code 换 token       │
       │                              │─────────────────────────────→│
       │                              │                              │
       │                              │  5. 微软返回 token             │
       │                              │←─────────────────────────────│
       │  6. 前端展示 token             │                              │
       │←─────────────────────────────│                              │
```

**为什么需要代理？** 浏览器直接请求微软 token 端点会被 CORS 策略拦截，Cloudflare Worker 作为服务端中转，绕过此限制。

---

## 🚀 部署步骤

### 第一步：部署 Cloudflare Worker（后端代理）

1. **注册/登录 Cloudflare**
   - 打开 https://dash.cloudflare.com/
   - 没有账号就注册一个（免费）

2. **创建 Worker**
   - 左侧菜单 → **Workers & Pages**
   - 点 **Create Application**
   - 选 **Create Worker**
   - 给 Worker 取个名字，比如 `ms-oauth-proxy`
   - 点 **Deploy**

3. **替换代码**
   - 部署完成后点 **Edit Code**
   - **删除**编辑器里的所有默认代码
   - 打开本项目的 `worker.js` 文件，复制全部内容
   - 粘贴到编辑器中
   - 点 **Save and Deploy**

4. **获取 Worker 地址**
   - 部署成功后，页面顶部会显示你的 Worker 地址
   - 格式类似：`https://ms-oauth-proxy.你的用户名.workers.dev`
   - **复制这个地址**，后面要用

### 第二步：使用前端页面

#### 方式 A：本地直接打开（最简单）

- 双击 `index.html`，用浏览器打开
- 在页面顶部「🌐 代理服务地址」粘贴你的 Worker 地址
- 开始使用

#### 方式 B：部署到 Cloudflare Pages（可选，给别人用）

1. 把 `index.html`、`style.css`、`app.js` 三个文件上传到 GitHub 仓库
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages**
3. 连接 GitHub 仓库 → 部署
4. 得到一个 `https://xxx.pages.dev` 地址

#### 方式 C：部署到其他静态托管

- Vercel、Netlify、GitHub Pages 都可以
- 只需要托管 `index.html`、`style.css`、`app.js` 三个文件

---

## 📖 使用说明

### 获取 Token

1. 打开 `index.html` 页面
2. 填写 **代理服务地址**（你的 Cloudflare Worker URL）
3. （可选）展开 ⚙️ 高级配置，填写自己的 Client ID 和 Client Secret
4. 点击 **🚀 获取授权code**
5. 在新打开的微软登录页面完成登录授权
6. 浏览器跳转到 `http://localhost?code=xxx`，复制 URL 中的 `code` 值
7. 回到页面，粘贴 code 到输入框
8. 点击 **🔄 交换获取 Token**
9. 页面显示 Access Token 和 Refresh Token

### 刷新 Token

当 Access Token 过期后，可以用 Refresh Token 获取新的 Access Token：

```bash
curl -X POST "https://你的Worker地址/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "你的refresh_token"}'
```

支持自定义凭据：

```bash
curl -X POST "https://你的Worker地址/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "你的refresh_token",
    "client_id": "你的client_id",
    "client_secret": "你的client_secret"
  }'
```

---

## ⚠️ 注意事项

- **代理地址**：前端必须填写正确的 Worker 地址才能使用
- **Client ID**：默认使用公共 Client ID（Thunderbird），建议注册自己的
- **Client Secret**：SPA / 公开客户端留空；机密客户端才需要填写
- **Token 安全**：获取的 Token 请妥善保存，不要泄露给他人
- **免费额度**：Cloudflare Workers 免费版支持 10 万次请求/天，足够个人使用

## 📝 自定义 Client ID 注册方法

1. 打开 https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. 点 **New registration**
3. 填写：
   - **Name**：随便取名
   - **Supported account types**：选最宽松的选项
   - **Redirect URI**：Platform 选 **Single-page application**，URI 填 `http://localhost`
4. 点 **Register**
5. 复制 **Application (client) ID**
6. 回到工具页面，填入 ⚙️ 高级配置的 Client ID 中
