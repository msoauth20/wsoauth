# wsoauth - Microsoft OAuth2 授权工具

纯前端 + Cloudflare Pages 代理的 Microsoft OAuth2 授权工具，用于获取 Access Token 和 Refresh Token。

## 📁 项目结构

```
wsoauth/
├── index.html      ← 前端页面
├── style.css       ← 样式
├── app.js          ← 前端逻辑
├── _worker.js      ← 后端代理（Cloudflare Pages 自动加载）
└── README.md       ← 本文档
```

## 🔧 工作原理

```
浏览器 (index.html)              Cloudflare Pages              Microsoft
       │                              │                              │
       │  1. 用户点击「获取授权code」     │                              │
       │  → 跳转到微软登录页            │                              │
       │─────────────────────────────────────────────────────────────→│
       │                              │                              │
       │  2. 登录授权后微软跳回 localhost?code=xxx                     │
       │←─────────────────────────────────────────────────────────────│
       │                              │                              │
       │  3. 用户复制 code 粘贴到页面    │                              │
       │  → 前端 POST code 给后端       │                              │
       │─────────────────────────────→│                              │
       │                              │  4. 后端用 code 换 token       │
       │                              │─────────────────────────────→│
       │                              │                              │
       │                              │  5. 微软返回 token             │
       │                              │←─────────────────────────────│
       │  6. 前端展示 token             │                              │
       │←─────────────────────────────│                              │
```

前端和后端部署在同一个 Cloudflare Pages 项目中，代理地址已写死，用户无需手动填写。

---

## 🚀 部署步骤（Cloudflare Pages）

### 1. 打开 Cloudflare Dashboard

- 登录 https://dash.cloudflare.com/
- 没有账号就注册一个（免费）

### 2. 创建 Pages 项目

- 左侧菜单 → **Workers & Pages**
- 点 **Create Application**
- 选 **Pages** 标签页
- 点 **Upload assets**

### 3. 上传文件

- **Project name** 填 `wsoauth`（或你喜欢的名字）
- 点 **Create project**
- 把以下 4 个文件拖拽上传（或点击选择文件）：
  - `index.html`
  - `style.css`
  - `app.js`
  - `_worker.js`
- 点 **Deploy site**

### 4. 完成

- 部署成功后会显示访问地址：`https://wsoauth.pages.dev`
- 直接打开这个地址就能用，**不需要额外配置**

### 5. 后续更新

如果代码有更新，重新上传文件即可：
- Workers & Pages → 选择你的项目 → **Deployments** → **Upload** → 上传新文件 → **Deploy**

---

## 📖 使用说明

### 获取 Token

1. 打开 **https://msoauth.pages.dev**（或你的 Pages 地址）
2. （可选）展开 ⚙️ 高级配置，填写自己的 Client ID 和 Client Secret
3. 点击 **🚀 获取授权code**
4. 在新打开的微软登录页面完成登录授权
5. 浏览器跳转到 `http://localhost?code=xxx`，复制 URL 中的 `code` 值
6. 回到页面，粘贴 code 到输入框
7. 点击 **🔄 交换获取 Token**
8. 页面显示 Access Token 和 Refresh Token

### 刷新 Token（API 调用）

```bash
curl -X POST "https://msoauth.pages.dev/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "***"}'
```

支持自定义凭据：

```bash
curl -X POST "https://msoauth.pages.dev/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "***",
    "client_id": "你的client_id",
    "client_secret": "***"
  }'
```

---

## ⚠️ 注意事项

- **代理地址**：已写死为 `https://msoauth.pages.dev`，用户无需填写
- **Client ID**：默认使用公共 Client ID（Thunderbird），建议注册自己的 SPA 应用
- **Client Secret**：公开客户端留空；机密客户端才需要填写
- **Token 安全**：获取的 Token 请妥善保存，不要泄露给他人
- **免费额度**：Cloudflare Pages 免费版足够个人使用

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
