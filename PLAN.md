# SevakAI — Product Plan (Simple & Clear)

## Our Business in One Line

> **We give small/home businesses an AI assistant that sorts their customer messages, learns from mistakes, and costs less than a part-time helper.**

---

## The 3 People in Our System

```
SevakAI (us — the platform)
    │
    ├── 👤 CLIENTS (small business owners)
    │     Bakery owner, plumber, Etsy seller, SaaS founder
    │     → They sign up, create a workspace
    │     → They invite their team members
    │     → They see dashboard with tickets + analytics
    │
    ├── 👥 TEAM (client's employees)
    │     Agents → answer tickets assigned to them
    │     Managers → see team performance, reports
    │     Owner → controls everything, pays the bill
    │
    └── 🧑 CUSTOMERS (client's customers — end users)
        → Submit a problem (no login needed)
        → Track if their ticket is being worked on
        → Get notified at every step
        → Rate how it went after resolution
```

---

## What Problem Do We Solve?

A small bakery owner wakes up to:
- 5 WhatsApp messages: *"cake ready?"*, *"delivery late"*, *"price for 2kg?"*
- 3 Instagram DMs: *"my order missing"*, *"do you deliver to MG Road?"*
- 2 missed calls
- 1 email

**They waste 1 hour every morning just sorting messages.**

SevakAI gives them ONE dashboard. All messages go there. AI sorts them instantly:
- 🔵 *"cake ready?"* → **Orders** (for the kitchen team)
- 🟢 *"delivery late"* → **Shipping** (for the delivery team)
- 🟡 *"price for 2kg?"* → **Sales** (follow up)
- 🔴 *"my order missing"* → **Urgent Shipping** (bumped to top)

**No sorting. No confusion. No missed messages.**

---

## How We Make Money (Pricing)

| Plan | Price | Who | What You Get |
|------|-------|-----|-------------|
| **Free** | $0 | Solo business | Up to 100 tickets/mo, 1 agent |
| **Starter** | $19/mo | Small team | 500 tickets, 3 agents, auto-sort |
| **Pro** | $49/mo | Growing business | Unlimited, custom AI training, analytics |
| **Enterprise** | Custom | Big orgs | Custom models, dedicated support, SLA |

> **Why so cheap?** We use ML (machine learning), not expensive AI APIs like ChatGPT. No per-message fees. No OpenAI bills.

---

## How Our AI Learns (The Smart Part)

### Step 1: We Ship Pre-Trained Models
Every new signup gets a model trained for their industry:
- Bakery → knows `"cake"`, `"delivery"`, `"order"`, `"price"`
- Plumber → knows `"leak"`, `"pipe"`, `"emergency"`, `"quote"`
- SaaS → knows `"bug"`, `"feature"`, `"billing"`, `"login"`

13 industries ready on day one.

### Step 2: Client Trains on Their Data
Client clicks "Upload Data" → uploads their old WhatsApp chats / emails as CSV
→ 30 seconds later → AI is trained on THEIR specific business.
Now it knows their products, their pricing, their customers.

### Step 3: Agent Corrects → AI Learns (Magic Loop)

```
Customer: "my payment not done for last order"
        │
        ▼
AI classifies as → SHIPPING (because it sees "order")
        │
        ▼
Agent opens ticket → sees AI guessed "Shipping"
        │
        ▼
Agent clicks → "This is actually BILLING" (one click)
        │
        ▼
System saves this correction → retrains model
        │
        ▼
Next time someone says "payment" + "order" → AI sends to BILLING ✅
```

**Every correction makes the AI smarter.**
**After 50 corrections → accuracy is 95%+ for that client.**

### Step 4: Smart Word Analysis (Not Just Keywords)

The example you gave — *"my order payment not done"*:

| Word | Matches | Score |
|------|---------|-------|
| "order" | Shipping ❌ | 1 point |
| "payment" | Billing ✅ | 2 points (stronger match) |
| "not done" | pattern = complaint | ups urgency |

**Result: Billing (High Urgency)** — correct.

How? We use **word pairs** (bigrams) like `"payment not"`, `"order payment"`, `"not done"` — these tell us more than single words. We also give more weight to words that are **uniquely tied** to a category:
- `"refund"` → almost always Billing
- `"tracking"` → almost always Shipping
- `"broken"` → almost always Product

### Step 5: Multi-Language Support

A customer types in Hinglish: *"Mera order abhi tak nahi aaya"*

1. System detects: Hindi + English mixed
2. Extracts keywords from BOTH languages:
   - `"order"` → Shipping keyword
   - `"nahi aaya"` (didn't arrive) → Shipping + urgency
3. Classifies as **Shipping (High)**
4. Agent sees original message — no translation needed

---

## Automation Features (What the Client Gets)

### 🎫 Ticket Queue — Sorted by Priority

```
┌──────────────────────────────────────────────────┐
│ 🎫 MY QUEUE                                       │
│                                                   │
│ ┌─────┬────────────┬──────────┬──────┬──────────┐ │
│ │ #   │ Message    │ Category │ Time │ Status   │ │
│ ├─────┼────────────┼──────────┼──────┼──────────┤ │
│ │  1  │ "leaking…" │ PLUMBING │ 5h   │ 🔴 OVER │ │
│ │  2  │ "need…"    │ SALES    │ 2h   │ 🟡 2h   │ │
│ │  3  │ "my bill…" │ BILLING  │ 30m  │ 🟢 8h   │ │
│ └─────┴────────────┴──────────┴──────┴──────────┘ │
│                                                   │
│ [Start] [Reassign to …] [Add Note]                │
└──────────────────────────────────────────────────┘
```

### ⏰ What Happens Automatically

| What | How |
|------|-----|
| **Sort messages** | AI puts every ticket in right department |
| **Assign to agent** | Round-robin: whoever is free gets next ticket |
| **SLA timer** | High urgency → 4hr deadline. Med → 8hr. Low → 24hr |
| **Overdue flag** | Past deadline? Ticket turns red, moves to top |
| **Rollover** | Today's unfinished tickets → top of tomorrow's queue |
| **Notify customer** | "Your ticket was opened" → "Agent is working" → "Resolved — rate us!" |
| **Re-classify** | Agent clicks "wrong category" → ticket moves + AI learns |
| **Feedback** | After resolve → customer gets a 1-click rating form |

### 📊 What Client Sees Weekly

> **"Your AI got 94% right this week. 6% were corrected by your team. It's getting smarter."**

This builds trust. They see the number go up every week.

---

## Client Experience (Step by Step)

### When a Client Signs Up

```
Step 1: Pick your industry
        🍞 Bakery  |  🔧 Plumbing  |  💻 SaaS  |  🛒 E-commerce  |  +9 more

Step 2: Create your teams (optional — can do later)
        "Orders Team", "Delivery Team", "Support Team"

Step 3: Upload your old chat data (optional — can do later)
        → Upload CSV/Excel of past conversations
        → AI trains on YOUR data in 30 seconds

Step 4: Done! Share your support link
        → https://sevakai.com/submit/your-bakery-name
        → Or embed a widget on your website
```

### When a Customer Submits a Ticket

```
Customer: "My cake was supposed to arrive at 4pm. It's 5pm now."
        │
        ▼
AI detects: Shipping complaint + urgency = High
        │
        ▼
Auto-assigned to Delivery Team → appears at TOP of their queue
        │
        ▼
Agent opens → sees AI prediction + customer info
        │
        ▼
Agent types reply → customer gets notification
        │
        ▼
Agent marks Resolved → customer gets rating form
```

### When ML Gets It Wrong

```
Customer: "I want to return the bread I ordered last week"
        │
        ▼
AI classifies as: SHIPPING (because of "return" and "order")
        │       ← WRONG. It's PRODUCT (defective item)
        ▼
Agent opens → clicks dropdown → changes to "Product/Returns"
        │
        ▼
Ticket moves to correct queue. System logs the correction.
        │
        ▼
Next retrain cycle → this correction improves the model.
```

---

## Database Structure (Clean Foundation)

```
WORKSPACE (one bakery, one plumber, one SaaS)
    │
    ├── USER (owner, admin, agent, viewer)
    │     └── role controls what they can do
    │
    ├── DEPARTMENT (Sales, Orders, Delivery, Complaints)
    │     └── client creates their own — not fixed
    │
    ├── TICKET (every incoming message)
    │     ├── status: open → viewed → working → resolved → closed
    │     ├── assigned_to: which agent
    │     ├── category: what AI predicted
    │     ├── urgency: low / medium / high / critical
    │     └── reopened_count: if customer comes back angry
    │
    ├── ACTIVITY LOG (who did what, when)
    │     └── "Agent viewed" → "Replied" → "Reclassified" → "Resolved"
    │
    ├── CUSTOMER FEEDBACK (rating + comment)
    │
    └── TRAINING DATA (corrections → retrain AI)
```

**Key rule**: Every ticket belongs to exactly ONE workspace. No client ever sees another client's data. This is enforced at database level.

---

## Can We Scale?

**Yes. Here's why:**

| Factor | How We Handle It |
|--------|-----------------|
| **100 clients** | One server. SQLite handles 100 small businesses easily. |
| **1,000 clients** | Switch to PostgreSQL. Same code, bigger DB. |
| **10,000 clients** | Add read replicas. Background workers for ML training. |
| **Cost per client** | ~$0.10/month in server cost for Free tier. ML runs on CPU. |
| **ML training** | Each client's model is tiny (~500KB). 10K clients = 5GB total. |
| **Team size to run it** | 1 backend dev + 1 ML engineer for first year. |

**Our unfair advantage**: We don't use expensive LLM APIs. Each client runs a tiny ML model we trained just for them. Cost grows linearly with clients, not exponentially.

---

## What We Build First (This Month)

### Must Have (MVP)
| Feature | Why |
|---------|-----|
| Signup / Login | Client can create an account |
| Create workspace | Pick industry, set name |
| Custom departments | Client creates their own teams |
| Submit ticket form | Customer types a message → it arrives |
| ML classification | Auto-sorts into categories |
| Agent queue | Agents see their tickets, sorted by priority |
| Re-classify | Agent corrects → system learns |
| Basic notification | Customer gets email when status changes |

### Nice to Have (Next)
- Feedback form after resolution
- SLA timers + overdue flag
- Upload CSV to train custom model
- Weekly accuracy report
- Multi-language detection
- Dashboard analytics

### Future
- Embed widget (one `<script>` tag on their website)
- Auto-retrain pipeline (nightly)
- Team performance reports
- Public API for integrations

---

## Summary (Tell This to a Client)

> *"SevakAI is like a smart assistant for your small business. When a customer messages you, it instantly figures out what the problem is — billing, delivery, product issue — and sends it to the right person. If it makes a mistake, your team corrects it with one click, and the AI learns from it. Every day it gets smarter. And it costs less than Netflix."*

---

## Summary (Tell This to an Investor)

> *"We're building the AI support agent for the 50 million small businesses that can't afford Zendesk ($150+/mo) or an in-house support team. We use lightweight ML models (not expensive LLMs), train them per-client on their own data, and charge $0–49/mo. Our learning loop — predict → human correct → retrain — means accuracy compounds over time with zero effort from the client. TAM: $5B+ in the SMB support software market."*
