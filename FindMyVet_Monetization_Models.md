# FindMyVet — Monetization Models (Founder Proposal)

This document captures **3 monetization models** for FindMyVet, with **pricing examples** and **when each should be activated**.

---

## Schema & API Support

All 3 monetization models are fully integrated into the database schema and REST API:

| Model | Database Tables | API Endpoints |
|-------|-----------------|---------------|
| Take-rate | `payments.platform_fee_cents`, `payments.clinic_payout_cents`, `platform_revenue` | Automatic (captured on booking) |
| Clinic SaaS | `subscription_plans`, `clinic_subscriptions`, `subscription_invoices` | `/api/v1/billing/plans`, `/subscriptions`, `/invoices` |
| Freelancer fees | `vets.is_freelancer`, `freelancer_sessions`, `vet_payouts` | `/api/v1/billing/sessions`, `/payouts` |

**Files:**
- Schema: `FindMyVet_Schema.sql` (23 tables, monetization included)
- API: `backend/app/routers/billing.py` (13 endpoints)

---

## 1) Take-rate per completed appointment (marketplace model)

### What it is
FindMyVet charges a percentage of the **clinic’s collected amount** for appointments booked through the platform (or a fixed fee per completed booking if FindMyVet does not process payments).

### Pricing examples
- **10–15% take rate** on appointment value  
  - Example: $75 exam → $7.50–$11.25
- If not processing payments: **$5–$12 per completed booking** (tier by service type)  
  - Example: General exam $6, vaccines $5, urgent $12

### When to activate
- Activate when you have **reliable demand** and a **healthy booking funnel** (e.g., 500+ monthly bookings in a metro, stable cancellation/no-show).
- Best once clinics see “found money” (filled gaps) and you can prove **incremental revenue**.

---

## 2) Clinic subscription (SaaS for hospitals/clinics)

### What it is
A monthly fee per clinic location for using scheduling, reminders, admin tooling, and inbound demand—regardless of appointment count.

### Pricing examples (per location/month)
- **Starter**: $99/mo  
  - Profile + booking + basic reminders
- **Pro**: $249/mo  
  - Multi-vet schedules, cancellation tooling, basic analytics, review requests
- **Plus**: $499/mo  
  - Advanced reporting, priority placement in search, emergency flags, limited integrations

### When to activate
- After initial PMF in 1–2 cities, when clinics **depend on FindMyVet** (e.g., 20+ active clinics, weekly usage).
- Ideal when you can prove operational ROI: **fewer calls**, **fewer no-shows**, **higher schedule utilization**.

---

## 3) Per-session fee for freelancer vets (supply expansion model)

### What it is
A fee per **completed session** booked with independent vets (home visits, pop-up clinics, overflow urgent coverage). This aligns with “per session for freelancer medics.”

### Pricing examples
- **$8–$20 platform fee per completed session**  
  - Home visits generally priced higher than in-clinic shift coverage
- Optional add-on if running payments/payouts: **3%–6% payment processing + platform**
- Optional hybrid plan: **$49/mo freelancer plan** to unlock a lower per-session fee  
  - Example: $8/session instead of $15/session

### When to activate
- When demand outstrips clinic availability (many “no slots available” searches), or when expanding into new areas without signed clinic supply.
- Works best once there’s enough consumer demand to keep freelancers busy (otherwise supply churns).

---

## Recommended rollout (founder POV)
- **Phase 1 (MVP → first city)**: Start with **take-rate per completed booking** (aligned incentives, low procurement friction).
- **Phase 2 (clinic scaling)**: Introduce **clinic subscription** for clinics getting consistent volume and wanting predictability.
- **Phase 3 (supply expansion)**: Add **freelancer per-session monetization** once home visits/overflow coverage is meaningful.


