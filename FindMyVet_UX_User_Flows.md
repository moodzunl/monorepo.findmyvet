# FindMyVet — UX User Flows (MVP+)

This document defines **detailed user flows** (happy paths, edge cases, and empty states) for:
1) Booking an in-person vet appointment  
2) Booking a home visit  
3) Emergency vet discovery

---

## Shared assumptions & UX principles
### Core objects
- **Clinic**: location-based provider; may offer in-person and/or home visit services.
- **Service**: appointment reason/type (e.g., General Exam, Vaccination, Sick Visit, Home Visit).
- **Slot**: bookable time window (may be clinic-defined).
- **Appointment status**: Draft (local), Booked, Cancelled, Rescheduled.

### Cross-flow design principles
- **Speed first**: minimize steps to confirm booking; progressively disclose details.
- **Trust**: show clear expectations (what to bring, arrival instructions, cancellation policy).
- **Error prevention**: reduce double-booking/invalid selections; confirm before destructive actions.
- **Recoverability**: always provide next best action on failure/empty.
- **Accessibility**: clear labels, large tap targets, readable time/location formats.

### Global empty states (reused patterns)
- **No results**: explain why (filters/radius/date), offer fixes (expand radius, change service, try different day).
- **No availability**: show “Next available” and alternatives (other clinics, home visit, waitlist if available later).
- **Network error**: retry, keep entered info, allow copy of confirmation details when available.
- **Not logged in**: allow guest booking if supported; otherwise offer sign-in with minimal disruption.

---

## Flow 1: Booking an in-person vet appointment

### Primary user goal
Book an in-person appointment at a clinic for a chosen service and time.

### Entry points
- Home: “Book an appointment”
- Search results: “Book”
- Clinic profile: “Book in-person”
- Rebooking: from Past appointment → “Book again”

### Happy path (end-to-end)
**Step 0 — Landing / intent**
- Screen: Home / Search landing
  - Inputs: location (current location or ZIP/city), pet type (optional), service (optional)
  - Primary CTA: “Search vets”

**Step 1 — Search results**
- Screen: Results list + map toggle (optional)
  - Each result card shows: clinic name, distance, next available slot, services tags, “Book”
  - Primary CTA: “View times” or “Book”
  - Secondary: filters (service type, distance, “next available”)

**Step 2 — Clinic profile**
- Screen: Clinic profile
  - Shows: hours, address, parking notes (optional), services offered, cancellation policy, contact
  - Primary CTA: “Select a time”

**Step 3 — Service selection**
- Screen: Choose service
  - Service list with duration + “starting at” price (optional)
  - Primary CTA: “Continue”

**Step 4 — Date/time selection**
- Screen: Calendar + available slots
  - Default: soonest day with availability
  - Primary CTA: select slot → “Continue”

**Step 5 — Details / intake**
- Screen: Appointment details form
  - Fields: owner name, email, phone; pet name; species; notes
  - Optional: “First time at this clinic?” (yes/no)
  - Primary CTA: “Review & confirm”

**Step 6 — Review & confirm**
- Screen: Summary
  - Shows: clinic, address, service, date/time, cancellation policy, contact info
  - Primary CTA: “Confirm booking”

**Step 7 — Confirmation**
- Screen: Booking confirmed
  - Shows: confirmation ID, date/time, clinic info, add-to-calendar, directions
  - CTAs: “Add to calendar”, “Manage appointment” (cancel/reschedule)
  - System: email confirmation sent

---

### Edge cases (in-person)
#### Search & discovery
- **Location permission denied**
  - Message: “We need a location to show nearby vets.”
  - CTAs: “Enter ZIP/city”, “Enable location”
- **Invalid ZIP/city**
  - Inline validation + suggestions (“Did you mean…?”)
- **Clinic temporarily closed / not accepting bookings**
  - Show disabled “Book” with label: “Call clinic” or “Unavailable online”
  - Provide alternative clinics

#### Availability & slot integrity
- **No clinics match filters**
  - Offer: clear filters, expand radius, change service, show “All clinics”
- **Clinic has no slots for next X days**
  - Show: “Next available: [date]”
  - Alternatives: other clinics with sooner times; offer “Home visit” if available; “Call clinic”
- **Slot taken while user is booking (race condition)**
  - On confirm: show non-blocking error “That time just filled up.”
  - Keep user on slot screen with next best alternatives pre-highlighted
- **Clinic changes schedule mid-flow**
  - Warn on confirm if slot no longer valid; reselect required

#### Intake & account
- **User not signed in (if auth required)**
  - Modal: “Sign in to continue”
  - Preserve entered data after sign-in
- **Email already associated**
  - Offer “Sign in” or “Continue with magic link” (if supported)
- **Phone/email invalid**
  - Inline validation; allow formatting guidance

#### Post-booking management
- **Cancel within restricted window**
  - Show policy: “Cancellations within 24h may incur a fee; confirm you want to cancel.”
  - Require explicit confirmation
- **Reschedule to same clinic, no slots**
  - Offer: keep appointment, switch clinic, switch to home visit (if available)

---

### Empty states (in-person)
- **Empty results list**
  - Title: “No vets found nearby”
  - Body: “Try expanding your distance or changing the service.”
  - CTAs: “Expand radius”, “Clear filters”, “Search another area”
- **Empty slots**
  - Title: “No times available this week”
  - Body: “Try another day or choose another clinic.”
  - CTAs: “Show next available”, “See other clinics”
- **Empty appointment list (for signed-in users)**
  - Title: “No upcoming appointments”
  - CTA: “Book an appointment”

---

## Flow 2: Booking a home visit

### Primary user goal
Book a vet to come to the user’s address, with clear eligibility and pricing expectations.

### Entry points
- Home: “Book a home visit”
- Search filters: toggle “Home visit”
- Clinic profile: “Home visit available”
- “No clinic availability” fallback: “Try a home visit”

### Happy path (end-to-end)
**Step 0 — Intent**
- Screen: Home / service chooser
  - User chooses “Home visit”

**Step 1 — Enter address & eligibility**
- Screen: Address input + service area check
  - Inputs: street address, unit, city/ZIP
  - System validates: within service radius + supported region
  - Primary CTA: “See available vets”

**Step 2 — Home-visit results**
- Screen: Results list
  - Cards show: provider/clinic name, earliest availability window, home-visit fee/starting price (if available), service area badge
  - Primary CTA: “Select time”

**Step 3 — Service selection**
- Screen: Choose home-visit service
  - Options: “Home visit — General exam”, “Vaccination”, “Sick visit”
  - May require: pet species selection to filter
  - Primary CTA: “Continue”

**Step 4 — Date/time window selection**
- Screen: Date picker + arrival window choices
  - Example windows: 9–11am, 11–1pm, 2–4pm (depending on model)
  - Primary CTA: select window → “Continue”

**Step 5 — Home details & pet info**
- Screen: Visit details
  - Fields: address confirmation, parking/access notes, gate code (optional), pet details, symptoms/notes
  - Consent checkbox: “A vet will contact you if they need more info.”
  - Primary CTA: “Review & confirm”

**Step 6 — Review & confirm**
- Screen: Summary
  - Shows: address, arrival window, provider, fees/policy (if displayed), what to expect
  - Primary CTA: “Confirm home visit”

**Step 7 — Confirmation**
- Screen: Home visit confirmed
  - Shows: arrival window, contact instructions, manage appointment
  - System: email confirmation + reminder

---

### Edge cases (home visit)
#### Eligibility & address
- **Address outside service area**
  - Message: “Home visits aren’t available at this address yet.”
  - Alternatives: in-person clinics near the address; “Search another address”
- **Address incomplete / unvalidated**
  - Suggestion list; allow manual entry with warning: “May impact arrival.”
- **Multi-unit building missing unit**
  - Prompt: “Add unit/apartment to avoid delays.”

#### Scheduling constraints
- **No windows available for selected week**
  - Offer: next available date; show in-person options; allow switching providers
- **Day-of logistics risk**
  - If user selects “ASAP” (if offered), show expectation: “Arrival time is approximate.”

#### Provider/service constraints
- **Service not offered as home visit**
  - Example: “X-rays not available at home”
  - Offer: in-person booking, show nearest clinic with that service
- **Species not supported**
  - Example: birds/exotics not supported for home visits
  - Offer: in-person clinics with that specialty

#### Intake and safety
- **Aggressive/anxious pet notes**
  - Add guidance: “Please mention temperament for safety.”
  - If extreme (clinic-defined), prompt: “Clinic may call to confirm.”

---

### Empty states (home visit)
- **No home-visit providers near address**
  - Title: “No home visits available nearby”
  - CTAs: “Book in-person instead”, “Try another address”, “Expand search radius”
- **No time windows available**
  - Title: “No time windows available”
  - CTAs: “Show next available”, “See other providers”

---

## Flow 3: Emergency vet discovery

### Primary user goal
Quickly find the most appropriate urgent/emergency care option, with clear next actions (call, directions).

### Entry points
- Home: “Emergency”
- Banner: “If this is an emergency…”
- Search filters: “Open now / Emergency”
- Post-failure fallback: “Can’t find availability? Try emergency options”

### Key UX stance (MVP-safe)
FindMyVet should **not diagnose**. It should:
- help users find **open now** urgent/emergency clinics,
- provide **call-first** guidance,
- optionally provide a lightweight “severity guidance” disclaimer (non-medical).

### Happy path (end-to-end)
**Step 0 — Emergency landing**
- Screen: Emergency
  - Prominent message: “If your pet is in immediate danger, call a local emergency clinic now.”
  - Inputs: location (current/ZIP), pet type (optional), “Open now” toggled on by default
  - Primary CTA: “Find emergency care”

**Step 1 — Emergency results**
- Screen: List with “Open now” badge
  - Each card shows: clinic name, distance, open status, phone number, address
  - Primary CTAs: “Call” and “Directions”
  - Secondary: “View details”

**Step 2 — Clinic emergency profile**
- Screen: Clinic details (emergency)
  - Shows: phone, address, hours, “Call before arriving” note, parking info (optional)
  - Primary CTA: “Call now”
  - Secondary CTA: “Get directions”

**Step 3 — Post-call state (optional)**
- Lightweight screen: “After you call”
  - Options: “Continue to directions”, “Find another clinic”

---

### Edge cases (emergency discovery)
#### Availability and trust
- **No “open now” clinics found**
  - Offer: widen radius, show “Open later today” list, show nearest regardless of open status, display “Call your regular vet” suggestion
- **Clinic open status unknown**
  - Show: “Hours not confirmed” label
  - Encourage: “Call to confirm”
- **Phone call fails / user can’t call**
  - Provide: copy phone number, show alternative clinics, show address + directions

#### Location
- **User traveling / location mismatch**
  - Provide: change-location control at top; show current location used
- **No location permission**
  - Ask for ZIP/city; keep emergency CTA functional without GPS

#### Safety disclaimers
- **User tries to book emergency online**
  - If clinic doesn’t support emergency booking: disable booking with guidance “Call now”
  - If urgent slot booking exists: still prioritize call-first; booking as secondary

---

### Empty states (emergency)
- **Empty emergency results**
  - Title: “No emergency clinics found”
  - Body: “Try expanding your search area or call your nearest clinic to confirm emergency hours.”
  - CTAs: “Expand radius”, “Show clinics regardless of open status”, “Change location”

---

## Cross-flow error handling (system-level)
- **Slow loading**
  - Skeleton UI for results and slot lists; show progress indicator for slot fetching.
- **Backend error on booking confirm**
  - Keep user on review page; show error banner; “Try again”; avoid duplicate submissions (disable CTA + spinner).
- **Duplicate booking attempt**
  - Detect same user + clinic + slot; show “You already booked this time” with link to appointment.
- **Timezone handling**
  - Always show timezone on confirmations and calendar exports if user is near borders/traveling.

---

## Suggested analytics events (UX validation)
- `search_submitted` (flow_type: in_person/home_visit/emergency)
- `results_viewed`
- `clinic_profile_viewed`
- `service_selected`
- `slot_selected` / `window_selected`
- `intake_started` / `intake_completed`
- `booking_confirmed` / `booking_failed` (reason)
- `cancel_initiated` / `cancel_confirmed`
- `reschedule_initiated` / `reschedule_confirmed`
- `emergency_call_tapped` / `directions_tapped`


