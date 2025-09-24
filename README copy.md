# 🚀 TezX Starter Template

Welcome to the **TezX Starter Template** — a blazing-fast, full-featured backend template built on [TezX](https://github.com/tezxjs/tezx), the lightweight web framework inspired by the best of Express, Hono, and Bun.

This starter is designed to help you spin up production-ready APIs or SSR apps in seconds.

---

## ✨ Features

- ⚡️ Ultra-fast routing & middleware
- 🔒 Built-in WebSocket & OAuth2-ready
- 🔧 Plug-and-play `ViewEngine` for SSR
- 🌱 Environment-based config support
- 🧪 Minimal, testable, and extendable codebase

---

## 📦 Tech Stack

- **Framework:** [TezX](https://github.com/tezxjs/tezx)
- **Language:** TypeScript / JavaScript
- **Template Engine (optional):** `ejs`, `pug`, `hbs`, `mustache`, or `nunjucks`
- **Runtime Support:** Node.js, Bun, Deno (via compatibility)

---

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
npm install
# or
bun install
````

### 2. Start Development Server

```bash
npm run dev
# or
bun run dev
```

### 3. Open in Browser

```bash
http://localhost:3000
```

---

## 🔐 Environment Variables

Create a `.env` file at the project root:

```bash
PORT=3000
NODE_ENV=development

# For OAuth2 templates
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
```

---

## 📁 Project Structure

```
.
├── public/             # Static files (images, js, css)
├── views/              # SSR templates (optional)
├── src/
│   ├── index.ts        # Entry point
│   └── routes/         # Route modules
├── .env
├── .gitignore
└── package.json
```

---

## 🧪 Example Commands

```bash
# Build the app
bun run build

# Start the server in production
bun start

# Run a TezX test (if added)
bun test
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

MIT © [SRAKIB17](https://github.com/SRAKIB17)

---

## 💚 Powered by

[TezX Framework](https://github.com/tezxjs/TezX) · Made with performance in mind

---