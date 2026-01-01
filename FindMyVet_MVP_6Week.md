# FindMyVet — 6‑Week MVP Definition (Veterinary Booking App)

## User personas
- **Pet owner (primary demand)**
  - **Goals**: Find nearby vets fast, compare availability, book quickly, manage upcoming visits.
  - **Pain points**: Calling multiple clinics, unclear pricing/availability, last‑minute cancellations, no reminders.
  - **MVP behaviors**: Searches within a radius, books 1–2 services (e.g., exam/vaccines), expects confirmations/reminders.

- **Vet (provider user, secondary)**
  - **Goals**: Predictable schedule, fewer no‑shows, clear appointment context, reduced admin interruptions.
  - **Pain points**: Gaps in schedule, incomplete client info, double-booking, time wasted on phone calls.
  - **MVP behaviors**: Wants a clean daily view, basic control of availability, minimal data entry.

- **Clinic / practice manager (economic buyer, ops)**
  - **Goals**: Fill capacity, reduce inbound calls, standardize booking intake, basic reporting.
  - **Pain points**: Staffing constraints, inconsistent intake, missed calls, manual reminder processes.
  - **MVP behaviors**: Onboards clinicians, sets hours/services, monitors bookings/no-shows.

## MVP scope (what we will ship in 6 weeks)

## Core user journeys
- **Owner**: Discover clinic → view services & next available slots → book → receive confirmation/reminders → reschedule/cancel.
- **Clinic/Vet**: Create clinic profile → define services & availability → receive booking → manage schedule.

## Core features (MVP “must ship”)
### 1) Clinic discovery & profile
- Search clinics by **location (city/ZIP + radius)** and **basic filters** (service type, “next available”).
- Clinic profile: address + map link, hours, services offered, pricing “starting at” (optional), photos (optional), contact info, cancellation policy.

### 2) Real appointment booking (time-slot based)
- Service selection (limited list: **General exam**, **Vaccination**, **Sick visit**).
- Slot selection from clinic-defined availability.
- Booking intake: pet name, species, owner name, email, phone, notes.
- Confirmation screen + email confirmation.

### 3) Owner account (lightweight)
- Email/password or passwordless (choose one) for: upcoming appointments list, cancel/reschedule.
- Minimal profile: contact details, basic pet info.

### 4) Clinic admin portal (web)
- Create/edit clinic profile.
- Configure: business hours, blackout dates, appointment duration per service, lead time, max bookings per slot (default 1).
- Schedule view (day/week) with appointment details + ability to cancel/reschedule (manual).

### 5) Notifications (reduce no-shows)
- Email confirmations + reminder emails (e.g., 24h before).
- Statuses: booked, rescheduled, cancelled.

### 6) Operational basics
- Authentication/roles: owner vs clinic staff.
- Basic audit trail for booking changes (timestamp + actor).
- Simple support path: “Contact support” form or email alias.

## Non-features (explicitly out of scope for MVP)
- Payments, invoicing, insurance/billing integrations.
- Full medical records, prescriptions, lab results, patient history.
- Real-time two-way chat or telemedicine.
- Multi-location enterprise clinic management; complex provider credentialing.
- Marketplace bidding/price negotiation, coupons, subscriptions.
- Advanced search ranking/personalization, reviews/ratings, UGC moderation.
- Native mobile apps (iOS/Android).
- Deep integrations with practice management systems (PIMS) (can be a post‑MVP track).
- Emergency triage flows (beyond a simple “If emergency call…” banner).

## 6-week delivery plan (MVP)
### Week 1 — Foundations + booking model
- Define service catalog, appointment objects/statuses, role model.
- UX flows/wireframes for owner booking + clinic admin basics.
- Setup analytics events (search → view → slot view → booking → reminder → cancel).

### Week 2 — Clinic onboarding + availability
- Clinic admin: profile create/edit, define hours, services, slot generation rules.
- Schedule view (basic) + booking ingestion.

### Week 3 — Owner discovery + booking
- Search + clinic profile pages.
- Slot selection + booking intake form + confirmation.
- Double-booking prevention (locking/atomic booking write).

### Week 4 — Owner account + reschedule/cancel
- Owner auth + upcoming appointments.
- Cancel/reschedule flows with policy messaging.
- Clinic receives updates in admin schedule.

### Week 5 — Notifications + reliability
- Email confirmations/reminders + templates.
- Edge cases: blackout dates, lead time, fully booked states.
- Admin tools: cancel/reschedule + reason notes.

### Week 6 — Pilot readiness + metrics
- QA + bug bash; performance pass on search/booking funnel.
- Seed initial clinics (e.g., 5–15) and run a pilot in one metro area.
- Dashboard for KPI tracking + operational runbook for support.

## Success metrics (MVP)
### Activation & funnel
- **Search → clinic profile view rate**: ≥ 40% of searches result in a profile view.
- **Profile view → slot view rate**: ≥ 30%.
- **Slot view → booking completion rate**: ≥ 15–25% (baseline; calibrate after week 1–2 of pilot).
- **Time to book** (profile view → confirmation): median ≤ 3 minutes.

### Supply (clinic-side)
- **Clinic onboarding completion** (profile + availability + ≥1 service): ≥ 70%.
- **Active clinics weekly** (log in or receive/manage bookings): ≥ 60% of onboarded clinics.

### Booking quality
- **No-show rate** (proxy via clinic marking): ≤ 10–15% with reminders.
- **Cancellation rate**: track; target stable week-over-week (not necessarily “low” early).

### Retention & satisfaction
- **Owner repeat booking within 6 weeks**: ≥ 15% (pilot-dependent).
- **CSAT** (post-appointment email survey): ≥ 4.2/5 for booking experience.

### Operational
- **Support tickets per 100 bookings**: ≤ 5 (and trending down).
- **Booking failure rate** (errors/timeouts): < 1%.

## MVP acceptance criteria (what “done” means)
- Owners can reliably book, cancel, and reschedule without calling.
- Clinics can set availability and see/manage appointments without double-bookings.
- Reminders are sent and tracked.
- The funnel is instrumented end-to-end and pilot KPIs can be read weekly.

