# 🚀 TriageIQ

**AI-powered inbound message triage for small businesses.**

Every incoming support message — an IT ticket, a billing question, a product
complaint — gets automatically classified, prioritized, and routed the
moment it arrives. No more digging through an unsorted queue to find the
one that's actually urgent.

TriageIQ started as a single-purpose IT helpdesk classifier and was
generalized into a multi-tenant, business-agnostic triage engine — the
same architecture now serves any inbound-message use case, not just IT.

📄 **[Live demo landing page →](landing/index.html)** (open locally in a browser)

---

## The Problem

Support volume grows faster than headcount ever will. Every unsorted inbox
is the same problem in disguise: urgent messages sit next to routine ones,
nobody knows what's actually on fire, and sorting by hand doesn't scale.

## What TriageIQ Does

1. **A message arrives** — submitted through a business's workspace intake form.
2. **It's classified and scored** — a trained ML model assigns a category and
   confidence score; a second pass flags urgency (High/Medium/Low) from
   tone and keywords.
3. **Your team gets a sorted queue** — urgent tickets surface first, with a
   suggested reply ready to send and SLA timestamps tracked automatically.

## Features

- 🧠 **ML classification** — TF-IDF + Logistic Regression, trained per business profile
- 🏢 **Multi-tenant workspaces** — every business gets isolated data, its own login
- 🎛️ **Business-agnostic profiles** — pick IT Support or General Customer Support
  at signup, each with its own category set and trained model; adding a third
  profile only takes a new CSV and a training run, no code changes
- 🎓 **Train on your own data** — upload a CSV of real past messages + labels
  and train a workspace-specific model instead of the generic preset. This is
  the difference between "a demo classifier" and being able to honestly tell
  a real business "this is trained on your actual messages." Includes
  validation (minimum categories/examples) before training, honest accuracy
  reporting (flags when the dataset was too small for a held-out test split),
  and a one-click switch between the custom model and the preset.
- 🚩 **Urgency detection** — keyword + confidence heuristic flags high-priority messages
- 🧭 **Out-of-scope detection** — if the model's top confidence is too close
  to a random guess for that profile's number of categories, the ticket is
  labeled "Needs Review" and flagged for a human instead of silently filed
  under a confident-looking but likely-wrong category. The floor scales with
  category count (a 5-way model needs a different bar than a 3-way one) —
  see `utils/confidence.py`. The admin dashboard still shows the model's
  actual best guess so a reviewer isn't starting from nothing.
- 🔔 **Escalation on High urgency** — a High-urgency ticket triggers an
  escalation attempt to a per-workspace email (set in Admin → Escalations).
  Every attempt is logged with its outcome — sent, failed, or "SMTP not
  configured" — so the dashboard has a real audit trail even without live
  email credentials. Wire up any SMTP provider via env vars
  (`TRIAGEIQ_SMTP_HOST`, `_PORT`, `_USER`, `_PASSWORD`, `_FROM`) — see
  `utils/notifications.py`.
- 🔁 **Duplicate/spam detection** — resubmitting the same issue (text-
  similarity match, not just exact string match) against the same
  workspace within 24h doesn't spawn a new ticket; it bumps a counter on
  the existing one instead. Three or more resubmissions auto-escalates
  to High urgency — see `utils/duplicates.py`.
- 💡 **Auto-suggested replies** — editable, category-specific canned responses,
  shown to both the customer and the admin
- ⏱️ **SLA analytics** — average/median resolution time, tracked automatically,
  broken down by category
- 🔒 **Password-protected admin dashboard** — filter, reassign, resolve tickets
- 📊 **Analytics** — category, urgency, status, and "needs review" breakdowns,
  volume over time
- 🖥️ **Marketing landing page** — a real product front door (`landing/index.html`),
  including a live interactive demo of the sorting concept
- ✅ **54 automated tests** covering the database layer, both models, the
  confidence-floor logic, duplicate detection, escalation notifications, and
  the knowledge base

## Tech Stack

- Python 3.11+, Streamlit (app UI)
- scikit-learn (TF-IDF + Logistic Regression classification)
- SQLite (multi-tenant storage, PBKDF2-hashed passwords)
- pytest (test suite)
- Static HTML/CSS/JS (marketing landing page)

## Project Structure

```
TriageIQ/
├── app.py                        # Main app: workspace signup/login + ticket submission
├── pages/
│   └── 1_Admin_Dashboard.py      # Password-protected admin + analytics + SLA
├── db/
│   └── database.py               # Multi-tenant SQLite schema, auth, CRUD
├── model/
│   ├── train_model.py            # Trains one classifier per business profile
│   └── profiles/                 # Trained models + metrics (generated)
│       ├── it_support/
│       └── customer_support/
├── data/
│   ├── profiles/                 # Training data per business profile
│   │   ├── it_support.csv
│   │   └── customer_support.csv
│   └── kb/                       # Canned-response knowledge base per profile
│       ├── it_support.json
│       └── customer_support.json
├── utils/
│   ├── ticket_utils.py           # Classification helper (profile-aware)
│   ├── urgency.py                # Keyword-based urgency scoring
│   ├── profiles.py               # Central profile registry
│   ├── knowledge_base.py         # Suggested-reply lookup
│   ├── custom_training.py        # Per-workspace training on real business data
│   └── active_model.py           # Resolves preset vs. custom model per workspace
├── landing/
│   └── index.html                # Marketing landing page with live demo
├── tests/
│   ├── test_database.py
│   ├── test_model.py
│   └── test_knowledge_base.py
├── .streamlit/
│   └── secrets.toml.example
└── requirements.txt
```

## Setup

```bash
git clone <your-repo-url>
cd TriageIQ

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 1. Train the models

```bash
python model/train_model.py             # trains all profiles
python model/train_model.py it_support   # or just one
```

Reads `data/profiles/<profile>.csv`, trains a TF-IDF + Logistic Regression
pipeline per profile, and saves the model + a metrics report under
`model/profiles/<profile>/`.

| Profile | Categories | Test Accuracy |
|---|---|---|
| IT Support | Hardware, Software, Network | ~95% |
| Customer Support | Billing, Shipping & Delivery, Product Issue, Refund & Returns, Sales Inquiry | ~75% (cross-validated mean) |

*(Customer Support's lower accuracy reflects a smaller starter dataset —
~150 examples across 5 overlapping categories. More labeled data is the
single biggest lever to improve it further; see Roadmap.)*

### 2. Run the app

```bash
streamlit run app.py
```

Sign up a workspace (business name, profile, password), then use the
sidebar to open the Admin Dashboard — it's gated by whichever workspace is
logged in during the session, no separate global admin password needed.

### 3. View the landing page

Open `landing/index.html` directly in a browser — it's a static file, no
server needed. Try typing a message into the demo sorter in the hero.

### 4. Run the tests

```bash
pytest tests/ -v
```

## Deploying to Streamlit Community Cloud

1. Push this repo to GitHub (commit the trained `.pkl` files under
   `model/profiles/` so the deployed app works without retraining).
2. Connect the repo at [share.streamlit.io](https://share.streamlit.io), main file `app.py`.
3. Deploy, then update the landing page's CTA links to point at the live URL.

## How Classification Works

Each business profile has its own `Pipeline`:

1. **TF-IDF vectorizer** (unigrams + bigrams, English stop words removed).
2. **Logistic Regression** — classifies into that profile's categories with
   calibrated probabilities, used both as the confidence score shown to
   users and as an input to urgency scoring.

Urgency is a transparent, tunable heuristic (keyword signals + low-confidence
fallback) rather than a second ML model — see `utils/urgency.py`.

**Out-of-scope detection** sits on top of the raw classification: if the
top-1 confidence falls below a per-profile floor (roughly 1.75x the random-
guess baseline `1/num_categories`, bounded to 35–45%), the ticket is relabeled
"Needs Review" and the model's actual top guess is kept alongside it for the
admin — see `utils/confidence.py`. This is what stops a 22%-confidence
guess on a 5-category model from being displayed as if it were meaningful.

## Troubleshooting

**`AttributeError: 'LogisticRegression' object has no attribute 'multi_class'`
(or any other odd error loading a `.pkl` file)** — this means the trained
model files were pickled with a different scikit-learn version than the one
currently installed. scikit-learn doesn't guarantee pickle compatibility
across versions. Fix: regenerate the models locally so they match your
installed version exactly —
```bash
python model/train_model.py
```
`requirements.txt` pins an exact scikit-learn version to avoid this for new
installs, but if you ever upgrade scikit-learn later, retrain afterward.

## Roadmap

- Train a dedicated urgency classifier once there's enough labeled
  resolution-time data
- Auto-generate suggested replies for custom-trained categories (today:
  only the two preset profiles have a knowledge base)
- Email intake via IMAP, so tickets can originate from a real inbox
- Multi-user accounts per workspace, not just a single shared login
- Scheduled/automatic retraining as a workspace's custom dataset grows
