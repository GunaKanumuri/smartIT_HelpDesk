# 🙏 SevakAI — AI That Serves Your Business

**AI-powered customer support triage for small businesses.** Every incoming message — an IT ticket, a billing question, a product complaint — gets automatically classified, prioritized, and routed the moment it arrives.

No more digging through an unsorted queue to find the one that's actually urgent.

---

## ✨ The Problem

Support volume grows faster than headcount ever will. Every unsorted inbox is the same problem: urgent messages sit next to routine ones, nobody knows what's actually on fire, and sorting by hand doesn't scale.

## 🚀 What SevakAI Does

1. **A message arrives** — through your website widget, a public form, or our API
2. **AI classifies and scores it** — ML model assigns a category and confidence; urgency detection flags High/Medium/Low
3. **Your team gets a sorted queue** — urgent tickets surface first, suggested replies ready, SLA tracked

## 🧠 Features

| Feature | Description |
|---------|-------------|
| **ML Classification** | TF-IDF + Logistic Regression, trained per business profile |
| **13 Business Sectors** | Bakery, Plumbing, Restaurant, E-Commerce, Legal, Medical, SaaS, and more |
| **Urgency Detection** | Keyword + confidence heuristic flags high-priority messages |
| **Relevance Filter** | Catches off-topic messages ("bakery gets neck pain") before they reach the classifier |
| **Duplicate/Spam Detection** | Text-similarity matching; 3+ resubmits auto-escalate |
| **Escalation Alerts** | High-urgency tickets trigger email notifications |
| **Multi-Tenant Workspaces** | Every business gets isolated data, its own login, role-based team access |
| **Custom Model Training** | Upload your past messages as CSV and train a model specific to your business |
| **Out-of-Scope Detection** | Low-confidence predictions get flagged "Needs Review" instead of silently misfiled |
| **Suggested Replies** | Category-specific canned responses for faster agent replies |
| **SLA Analytics** | Resolution time tracking, category/urgency/status breakdowns, volume trends |
| **Admin Dashboard** | Multi-user, role-based (owner/admin/agent/viewer), ticket queue, team management |
| **Embed Widget** | One `<script>` tag adds a floating support button to any website |
| **Public Status Page** | Customers check ticket status without login |

## 🏗️ Architecture

```
sevak-ai/
├── backend/                 # Python backend
│   ├── api.py              # FastAPI — public & admin REST endpoints
│   ├── config/             # Django settings (future migration)
│   │   ├── settings.py     # Django DRF configuration
│   │   └── urls.py         # Route configuration
│   ├── database/
│   │   └── repository.py   # SQLite persistence layer (multi-tenant)
│   ├── domain/             # Business logic modules
│   │   ├── active_model.py # Model resolution (preset vs custom)
│   │   ├── confidence.py   # Out-of-scope confidence thresholds
│   │   ├── custom_training.py  # Train models on uploaded CSV
│   │   ├── duplicates.py   # Text-similarity duplicate detection
│   │   ├── knowledge_base.py   # Suggested reply lookup
│   │   ├── notifications.py    # Email escalation notifications
│   │   ├── profiles.py     # Business profile registry
│   │   ├── relevance.py    # Cross-sector relevance filter
│   │   ├── sectors.py      # 13-sector registry with keywords
│   │   ├── ticket_utils.py # ML classification helper
│   │   └── urgency.py      # Keyword-based urgency scoring
│   ├── ml/
│   │   └── train_model.py  # Train preset profile classifiers
│   ├── security/
│   │   └── access.py       # Role-based permission policy
│   └── services/
│       ├── ticket_pipeline.py  # Shared pipeline (FastAPI + Streamlit)
│       └── admin_operations.py # Shared admin operations
│
├── frontend/               # Next.js web application
│   ├── src/
│   │   ├── app/           # Routes (App Router)
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── login/page.tsx         # Workspace login
│   │   │   ├── signup/page.tsx        # Workspace signup
│   │   │   ├── submit/[slug]/page.tsx # Public ticket form
│   │   │   ├── status/[slug]/[ticketId]/  # Ticket status
│   │   │   └── dashboard/            # Protected admin dashboard
│   │   │       ├── page.tsx          # Overview stats
│   │   │       ├── tickets/page.tsx  # Ticket queue & management
│   │   │       ├── analytics/page.tsx  # Charts & SLA
│   │   │       ├── users/page.tsx    # Team management
│   │   │       ├── settings/page.tsx # Integration & escalation
│   │   │       └── train/page.tsx    # Custom model training
│   │   ├── components/
│   │   │   ├── ui/         # Reusable primitives (Button, Card, etc.)
│   │   │   ├── landing/    # Landing page sections
│   │   │   └── forms/      # Auth & submission forms
│   │   ├── lib/
│   │   │   ├── api.ts      # Typed API client
│   │   │   └── auth.tsx    # Auth context provider
│   │   └── types/          # TypeScript interfaces
│   └── public/             # Static assets
│
├── storage/
│   ├── database/           # SQLite database files
│   ├── datasets/           # Training data (profiles + custom)
│   ├── knowledge_base/     # Per-profile canned responses
│   └── models/             # Trained models (profiles + custom)
│
└── tests/                  # pytest test suite
    ├── test_database.py
    ├── test_model.py
    ├── test_knowledge_base.py
    ├── test_duplicates.py
    ├── test_notifications.py
    ├── test_relevance.py
    ├── test_sectors.py
    ├── test_custom_training.py
    └── test_access.py
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend API** | Python 3.11+, FastAPI |
| **Admin Backend** | Django REST Framework |
| **Database** | SQLite (multi-tenant) |
| **ML** | scikit-learn (TF-IDF + Logistic Regression) |
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Testing** | pytest (54+ tests) |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### 1. Setup Backend

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Train the ML models
python -m backend.ml.train_model

# Start the API server
uvicorn backend.api:app --port 8001 --reload
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

The landing page loads at **http://localhost:3000**, the API runs at **http://localhost:8001**.

### 3. Use It

1. Go to `http://localhost:3000` → click **Get Started**
2. Create a workspace (business name, sector, password)
3. You're auto-logged in to the dashboard
4. Share your public form link to start receiving tickets
5. Add team members in the **Team** tab

### 4. Run Tests

```bash
pytest tests/ -v
```

## 🔗 API Endpoints

### Public (no auth)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workspace/{slug}` | Workspace info for branding |
| POST | `/api/submit` | Submit a ticket |
| GET | `/api/status/{slug}/{ticket_id}` | Customer ticket status |

### Auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/login` | Get bearer token |
| POST | `/api/admin/logout` | Invalidate session |
| GET | `/api/admin/me` | Rehydrate session |
| POST | `/api/admin/signup` | Create workspace + auto-login |

### Admin (requires bearer token)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/tickets` | List all tickets |
| PATCH | `/api/admin/tickets/{id}` | Update ticket |
| GET | `/api/admin/team` | List team members |
| POST | `/api/admin/team` | Add team member |
| PATCH | `/api/admin/team/{id}` | Update team member |
| DELETE | `/api/admin/team/{id}` | Remove team member |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/escalations` | Escalation history |
| PUT | `/api/admin/escalation-email` | Update escalation email |
| GET | `/api/admin/model` | Model information |
| PUT | `/api/admin/model/active` | Toggle model |
| POST | `/api/admin/train` | Upload + train custom model |

## 🔒 Security

- Passwords hashed with PBKDF2-HMAC-SHA256 (200,000 iterations)
- Bearer token authentication with workspace-scoped sessions
- Role-based access control (owner / admin / agent / viewer)
- Row-level security — workspaces cannot access each other's data
- CORS configured for API safety
- Audit trail for all user and ticket actions

## 🚀 Deployment

### Backend (Django API)

```bash
cd backend
cp ../.env.example ../.env   # then fill in real values

# Set DJANGO_DEBUG=0 and provide DJANGO_SECRET_KEY in .env
export DJANGO_DEBUG=0
export DJANGO_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(50))")

# Install production deps
pip install -r requirements.txt gunicorn

# Init DB + train models
python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE','sevak_ai.settings'); django.setup(); from backend.database import init_db; init_db()"
python -m backend.ml.train_model

# Run with gunicorn
gunicorn sevak_ai.wsgi:application -c gunicorn.conf.py
```

### Frontend (Next.js)

```bash
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run build
npm start
```

### Scaling checklist
- Switch to PostgreSQL when >1,000 workspaces (see `.env.example`)
- Set `CACHE_BACKEND=redis` + `REDIS_URL` for multi-worker caching
- Enable Sentry with `SENTRY_DSN` for error tracking
- Set `EMAIL_ENABLED=1` + SMTP vars when ready to send real emails
- Run `python -m pytest` in CI (see `.github/workflows/ci.yml`)

### Platform console
After deploying, visit `/console` on the frontend to see the SevakAI operator dashboard (system-wide metrics + tenant list).

## 👥 Team

Built by **Guna Kanumuri** — © 2026 SevakAI. All rights reserved.

---

**Keywords:** AI customer support, ticket triage, helpdesk automation, small business AI, machine learning, open source support system, India
