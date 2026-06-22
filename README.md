<h1 align="center">
  🖥️ DevCollab — Frontend
</h1>

<h4 align="center">The React frontend for DevCollab — a collaborative platform for developers to share, review, and improve code snippets in real time.</h4>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=for-the-badge" alt="React 19">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=for-the-badge" alt="Vite 8">
  <img src="https://img.shields.io/badge/React_Router-7-CA4245?logo=react-router&logoColor=white&style=for-the-badge" alt="React Router 7">
  <img src="https://img.shields.io/badge/Socket.io_Client-4-010101?logo=socket.io&logoColor=white&style=for-the-badge" alt="Socket.io">
  <img src="https://img.shields.io/badge/Axios-1.x-5A29E4?logo=axios&logoColor=white&style=for-the-badge" alt="Axios">
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#️-project-structure">Project Structure</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-environment-variables">Environment Variables</a> •
  <a href="#-pages--routing">Pages & Routing</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## ✨ Features

- 🔐 **Auth UI** — Login & Register forms with local, Google, and GitHub OAuth support
- 🏠 **Home Feed** — Browse all community snippets sorted by net votes; filter by language, tag, or search
- 📝 **Create Snippet** — Rich form to post code with title, description, language, and tags
- 🔍 **Snippet Detail** — Full code view with syntax highlighting, comments, voting, and AI review panel
- 💬 **Real-time Comments** — Line-specific comments that appear live via Socket.io
- 👍 **Voting** — Toggle upvote/downvote on snippets and individual comments
- 🤖 **AI Code Review** — Request an AI-generated review (summary, bugs, suggestions, complexity) right from the snippet page
- 👤 **User Profiles** — View any user's public profile, bio, avatar, reputation, and their snippets
- 🔄 **OAuth Profile Completion** — Guided username-selection flow for new OAuth users
- 🔒 **Route Guards** — Protected routes redirect unauthenticated users; incomplete OAuth profiles are redirected to the completion page
- ⚡ **Fast Dev Experience** — Powered by Vite 8 with HMR

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI framework |
| **React Router DOM** | 7 | Client-side routing & navigation |
| **Vite** | 8 | Build tool & HMR dev server |
| **Socket.io Client** | 4 | Real-time WebSocket connection to the backend |
| **Axios** | 1.x | HTTP client for REST API calls |
| **Vanilla CSS** | — | Custom styling (no CSS framework) |

---

## 🗂️ Project Structure

```
devcollab-client/
├── public/                    # Static public assets
├── src/
│   ├── api/                   # Axios instance & API helper functions
│   ├── assets/                # Images, icons, and other static assets
│   ├── components/
│   │   ├── Navbar.jsx         # Top navigation bar with auth state
│   │   └── SnippetCard.jsx    # Reusable snippet preview card
│   ├── context/
│   │   └── AuthContext.jsx    # Global auth state provider (user, loading, helpers)
│   ├── pages/
│   │   ├── Home.jsx           # Community feed with filters & search
│   │   ├── Login.jsx          # Login page (email/password + OAuth)
│   │   ├── Register.jsx       # Registration page
│   │   ├── SnippetDetail.jsx  # Full snippet view, comments, AI review
│   │   ├── CreateSnippet.jsx  # New snippet creation form
│   │   ├── CompleteProfile.jsx# OAuth username-selection step
│   │   └── Profile.jsx        # Public user profile page
│   ├── App.jsx                # Root component — routing + guards
│   ├── App.css                # Global application styles
│   ├── index.css              # CSS reset & design tokens
│   └── main.jsx               # React DOM entry point
├── index.html                 # HTML shell
├── vite.config.js             # Vite configuration
├── eslint.config.js           # ESLint configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** v8 or higher
- The [DevCollab backend](https://github.com/Punitzn/devcollab-server) running locally or deployed

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Punitzn/devcollab-client.git
cd devcollab-client

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.local.example .env.local
# Then edit .env.local with your backend URL

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Locally preview the production build |
| `npm run lint` | Run ESLint on the source files |

---

## 🔑 Environment Variables

Create a `.env.local` file in the root of this directory:

```env
# Base URL of the DevCollab backend API
VITE_API_URL=http://localhost:8000
```

> All Vite environment variables must be prefixed with `VITE_` to be accessible in the browser.

For production, set `VITE_API_URL` to your deployed backend URL (e.g. on Vercel's environment settings dashboard).

---

## 📄 Pages & Routing

| Route | Page | Auth Required | Description |
|---|---|---|---|
| `/` | `Home.jsx` | ❌ (public) | Community snippet feed |
| `/login` | `Login.jsx` | ❌ | Login with email or OAuth |
| `/register` | `Register.jsx` | ❌ | Create a new account |
| `/snippets/:id` | `SnippetDetail.jsx` | ❌ | View a snippet with comments & AI review |
| `/profile/:id` | `Profile.jsx` | ❌ | View a user's public profile |
| `/create` | `CreateSnippet.jsx` | ✅ | Create a new snippet |
| `/complete-profile` | `CompleteProfile.jsx` | ✅ (OAuth) | Set username after OAuth sign-in |

### Route Guards

- **`RequireAuth`** — Redirects to `/login` if the user is not authenticated
- **`RequireCompleteProfile`** — Redirects OAuth users to `/complete-profile` if they haven't set a username yet

---

## 🔌 Real-time (Socket.io)

The app connects to the backend Socket.io server to receive live updates. Currently used for:

- **New comments** — When any user posts a comment on a snippet, all viewers of that snippet see it appear instantly without a page refresh

The Socket.io client is initialized in the `SnippetDetail` page and connects using the same `VITE_API_URL` base.

---

## 🌐 Deployment

This frontend is deployed on **Vercel**. The root `vercel.json` (at the monorepo level) handles the build:

```json
{
  "buildCommand": "cd devcollab-client && npm install && npm run build",
  "outputDirectory": "devcollab-client/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

All routes are rewritten to `index.html` to support React Router's client-side navigation (no 404s on direct URL access).

### Deploy to Vercel Manually

```bash
npm run build
# Upload the dist/ folder to Vercel, or use the Vercel CLI:
npx vercel --prod
```

---

## 🔗 Related

- **Backend Repository** — [devcollab-server](https://github.com/Punitzn/devcollab-server)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ using React + Vite</p>
