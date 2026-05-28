# TaskFlow — Task Management Application

A production-grade, full-stack task management platform built with **Next.js**, **Flask**, and **Supabase**. Features Google OAuth authentication, real-time task collaboration, and automated Gmail email notifications.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                   Next.js + TypeScript                          │
│                    Deployed on Vercel                           │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐        │
│  │ Landing  │  │  Login Page  │  │   Dashboard         │        │
│  │  Page    │  │ (Google OAuth)│  │  ├─ Overview       │        │
│  └──────────┘  └──────┬───────┘  │  ├─ Task List      │        │
│                       │          │  ├─ Create Task     │        │
│                       │          │  └─ Task Detail     │        │
│                       ▼          └────────┬────────────┘        │
│               Supabase Auth               │                     │
│             (Google OAuth 2.0)            │ JWT Token            │
└───────────────────────┬───────────────────┼─────────────────────┘
                        │                   │
                        ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│                    Flask REST API                               │
│              Deployed on Railway/Render                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │  Auth Guard  │  │ Task Routes  │  │   Email Service  │      │
│  │ (JWT Verify) │  │  CRUD API    │  │  (Gmail SMTP)    │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                 │
│                    Supabase (PostgreSQL)                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │   profiles   │  │    tasks     │  │   auth.users     │      │
│  │  (users)     │◄─┤ (task data)  │  │  (Supabase Auth) │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
│                                                                 │
│  Row Level Security (RLS) · Triggers · Functions                │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication**: User clicks "Sign in with Google" → Supabase Auth handles OAuth 2.0 → JWT session created
2. **API Requests**: Frontend attaches JWT to all API calls → Flask backend verifies token → processes request
3. **Email Notifications**: When tasks are created/completed → Flask sends email via Gmail SMTP in background thread
4. **Data Access**: Flask uses Supabase service role key → full database access → RLS bypass for admin operations

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 + TypeScript | Server-side rendering, routing, UI |
| **Backend** | Flask (Python) | REST API, business logic, email |
| **Database** | Supabase (PostgreSQL) | Data storage, auth, RLS |
| **Authentication** | Google OAuth 2.0 via Supabase Auth | User login |
| **Email** | Gmail SMTP | Task notifications |
| **Frontend Hosting** | Vercel | Automated deployments |
| **Backend Hosting** | Railway / Render | Python app hosting |

---

## Features

- ✅ **Google OAuth Login** — One-click sign in with Google accounts
- ✅ **Task CRUD** — Create, read, update, and delete tasks
- ✅ **Task Assignment** — Assign tasks to any registered user
- ✅ **Status Tracking** — Todo → In Progress → In Review → Completed
- ✅ **Priority Levels** — Low, Medium, High, Urgent
- ✅ **Due Dates** — Set and track task deadlines
- ✅ **Email Notifications** — Gmail alerts on task assignment & completion
- ✅ **Dashboard Analytics** — Task statistics overview
- ✅ **Search & Filter** — Find tasks by status, priority, or keyword
- ✅ **Responsive Design** — Works on desktop, tablet, and mobile
- ✅ **Dark Theme** — Premium dark UI with glassmorphism effects

---

## Project Structure

```
taskflow/
├── frontend/                   # Next.js + TypeScript
│   ├── src/
│   │   ├── app/               # Pages & routes (App Router)
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # API client, utilities
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Supabase client setup
│   │   └── middleware.ts      # Auth guard
│   └── package.json
│
├── backend/                    # Flask REST API
│   ├── app/
│   │   ├── __init__.py        # App factory
│   │   ├── auth.py            # JWT verification
│   │   ├── config.py          # Environment config
│   │   ├── routes/            # API endpoints
│   │   └── services/          # Business logic & email
│   ├── requirements.txt
│   ├── wsgi.py                # Production entry point
│   └── Procfile               # Deployment config
│
├── migrations/                 # SQL migration files
│   ├── 001_create_profiles.sql
│   ├── 002_create_tasks.sql
│   ├── 003_create_rls_policies.sql
│   └── 004_create_functions.sql
│
├── .env.example               # Environment template
├── .gitignore
└── README.md
```

---

## Setup Instructions

### Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.12+
- **Supabase** account (free tier works)
- **Google Cloud Console** project with OAuth 2.0 credentials
- **Gmail** account with App Password enabled

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd taskflow

# Frontend
cd frontend
npm install

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run each migration file in order:
   - `migrations/001_create_profiles.sql`
   - `migrations/002_create_tasks.sql`
   - `migrations/003_create_rls_policies.sql`
   - `migrations/004_create_functions.sql`
3. Go to **Authentication → Providers → Google** and enable it
4. Copy your project URL, anon key, service role key, and JWT secret from **Settings → API**

### 3. Google Cloud OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `https://<project-id>.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret into Supabase Google provider settings

### 4. Gmail App Password

1. Enable 2-Step Verification on your Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new App Password for "Mail"
4. Save the 16-character password

### 5. Environment Variables

```bash
# Copy the template
cp .env.example .env

# Edit with your values
# Frontend: create frontend/.env.local with NEXT_PUBLIC_ vars
# Backend: create backend/.env with all vars
```

**Frontend (`frontend/.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

**Backend (`backend/.env`):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
FLASK_SECRET_KEY=your-secret-key
```

### 6. Run Locally

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
flask --app app run --debug --port 5000

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | ❌ | Health check |
| GET | `/api/users` | ✅ | List all users |
| GET | `/api/users/me` | ✅ | Current user profile |
| GET | `/api/tasks` | ✅ | List tasks (with filters) |
| POST | `/api/tasks` | ✅ | Create new task |
| GET | `/api/tasks/:id` | ✅ | Get task details |
| PUT | `/api/tasks/:id` | ✅ | Update task |
| PATCH | `/api/tasks/:id/status` | ✅ | Update task status |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |

### Query Parameters (GET /api/tasks)

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (todo, in_progress, in_review, completed) |
| `priority` | string | Filter by priority (low, medium, high, urgent) |
| `search` | string | Search in title and description |

---

## Database Schema

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | References auth.users |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| avatar_url | TEXT | Google profile picture |
| created_at | TIMESTAMPTZ | Account creation time |
| updated_at | TIMESTAMPTZ | Last update time |

### tasks
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| title | TEXT | Task title (required) |
| description | TEXT | Task description |
| status | ENUM | todo, in_progress, in_review, completed |
| priority | ENUM | low, medium, high, urgent |
| due_date | TIMESTAMPTZ | Task deadline |
| created_by | UUID (FK) | Creator's profile ID |
| assigned_to | UUID (FK) | Assignee's profile ID |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last update time |

---

## Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variables (NEXT_PUBLIC_*)
5. Deploy

### Backend → Railway

1. Import project in [Railway](https://railway.app)
2. Set **Root Directory** to `backend`
3. Add all environment variables
4. Railway auto-detects Procfile and deploys

### Post-Deployment

1. Update `FRONTEND_URL` in backend env to your Vercel URL
2. Update `NEXT_PUBLIC_BACKEND_URL` in frontend env to your Railway URL
3. Update Supabase Auth redirect URLs with production domains
4. Update Google OAuth redirect URI in Google Cloud Console

---

## License

MIT
