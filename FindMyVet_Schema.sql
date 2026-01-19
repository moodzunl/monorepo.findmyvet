-- ============================================================================
-- FindMyVet — PostgreSQL Database Schema
-- Veterinary Marketplace App
-- ============================================================================
-- 
-- Tables (23 total):
--   Users & Auth:      users, user_roles, auth_tokens
--   Pets:              species, breeds, pets
--   Clinics & Vets:    clinics, clinic_hours, vets, clinic_staff
--   Services:          services, clinic_services, availability_slots
--   Appointments:      appointments, appointment_status_history
--   Payments:          payment_methods, payments
--   Reviews:           reviews
--   Emergency:         emergency_flags
--   Monetization:      subscription_plans, clinic_subscriptions, subscription_invoices,
--                      freelancer_sessions, vet_payouts, platform_revenue
--
-- Run this file against a fresh PostgreSQL database (v12+).
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS & AUTHENTICATION
-- ============================================================================

-- Central user table for all roles (pet owner, vet, clinic admin)
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- External auth provider id (Clerk user id, e.g. "user_2abc..."). Keep internal UUIDs stable.
    clerk_user_id        TEXT UNIQUE,
    email               VARCHAR(255) UNIQUE NOT NULL,
    phone               VARCHAR(20),
    password_hash       VARCHAR(255),  -- NULL if OAuth/magic link
    -- Names may be missing depending on auth provider / user settings (e.g., social sign-in).
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    avatar_url          TEXT,
    email_verified_at   TIMESTAMPTZ,
    phone_verified_at   TIMESTAMPTZ,
    timezone            VARCHAR(50) DEFAULT 'America/Los_Angeles',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ  -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id) WHERE clerk_user_id IS NOT NULL;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. CLINICS
-- ============================================================================

-- Veterinary clinic / practice
CREATE TABLE clinics (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(200) NOT NULL,
    slug                    VARCHAR(200) UNIQUE NOT NULL,
    description             TEXT,
    phone                   VARCHAR(20) NOT NULL,
    email                   VARCHAR(255),
    website_url             TEXT,
    logo_url                TEXT,
    address_line1           VARCHAR(255) NOT NULL,
    address_line2           VARCHAR(255),
    city                    VARCHAR(100) NOT NULL,
    state                   VARCHAR(50) NOT NULL,
    postal_code             VARCHAR(20) NOT NULL,
    country                 VARCHAR(50) DEFAULT 'US',
    latitude                DECIMAL(10,7) NOT NULL,
    longitude               DECIMAL(10,7) NOT NULL,
    timezone                VARCHAR(50) NOT NULL,
    cancellation_policy     TEXT,
    parking_notes           TEXT,
    accepts_emergency       BOOLEAN DEFAULT FALSE,
    home_visit_enabled      BOOLEAN DEFAULT FALSE,
    home_visit_radius_km    DECIMAL(5,2),
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clinics_slug ON clinics(slug);
CREATE INDEX idx_clinics_geo ON clinics(latitude, longitude);
CREATE INDEX idx_clinics_city_state ON clinics(city, state);
CREATE INDEX idx_clinics_postal ON clinics(postal_code);
CREATE INDEX idx_clinics_active ON clinics(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 3. SPECIES & BREEDS (Reference tables)
-- ============================================================================

-- Animal species
CREATE TABLE species (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

-- Breeds per species
CREATE TABLE breeds (
    id          SERIAL PRIMARY KEY,
    species_id  INT NOT NULL REFERENCES species(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    UNIQUE(species_id, name)
);

CREATE INDEX idx_breeds_species ON breeds(species_id);

-- ============================================================================
-- 4. SERVICES (Global catalog)
-- ============================================================================

CREATE TABLE services (
    id                      SERIAL PRIMARY KEY,
    name                    VARCHAR(100) UNIQUE NOT NULL,
    slug                    VARCHAR(100) UNIQUE NOT NULL,
    description             TEXT,
    default_duration_min    INT DEFAULT 30,
    is_emergency            BOOLEAN DEFAULT FALSE,
    supports_home_visit     BOOLEAN DEFAULT FALSE,
    is_active               BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- 5. VETS
-- ============================================================================

-- Veterinarian profiles (linked to user accounts)
CREATE TABLE vets (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number          VARCHAR(100),
    license_state           VARCHAR(50),
    specialty               VARCHAR(100),
    years_experience        INT,
    bio                     TEXT,
    photo_url               TEXT,
    is_verified             BOOLEAN DEFAULT FALSE,
    -- Freelancer monetization fields
    is_freelancer           BOOLEAN DEFAULT FALSE,
    freelancer_rate_cents   INT,                          -- Their hourly/session rate
    platform_fee_percent    DECIMAL(4,2) DEFAULT 15.00,   -- FindMyVet's cut (%)
    stripe_account_id       VARCHAR(255),                 -- For payouts (Stripe Connect)
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vets_user ON vets(user_id);
CREATE INDEX idx_vets_verified ON vets(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_vets_freelancer ON vets(is_freelancer) WHERE is_freelancer = TRUE;

-- ============================================================================
-- 6. PETS
-- ============================================================================

-- Pet profiles owned by users
CREATE TABLE pets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    species_id      INT NOT NULL REFERENCES species(id),
    breed_id        INT REFERENCES breeds(id),
    date_of_birth   DATE,
    weight_kg       DECIMAL(5,2),
    sex             VARCHAR(10) CHECK (sex IN ('male', 'female', 'unknown')),
    is_neutered     BOOLEAN,
    photo_url       TEXT,
    notes           TEXT,  -- Allergies, temperament, etc.
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  -- Soft delete
);

CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_species ON pets(species_id);
CREATE INDEX idx_pets_deleted ON pets(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 7. USER ROLES
-- ============================================================================

-- Many-to-many: users can have multiple roles (owner + clinic admin, etc.)
CREATE TABLE user_roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(30) NOT NULL CHECK (role IN ('pet_owner', 'vet', 'clinic_admin', 'support')),
    clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE,  -- Required if role is 'vet' or 'clinic_admin'
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role, clinic_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_clinic ON user_roles(clinic_id) WHERE clinic_id IS NOT NULL;

-- ============================================================================
-- 7b. PROVIDER APPLICATIONS (Vet/Clinic Upgrade Requests)
-- ============================================================================
-- Users can submit an application to become a verified vet or a clinic admin.
-- Your team reviews these and approves/rejects them.
CREATE TABLE provider_applications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_type       VARCHAR(20) NOT NULL CHECK (provider_type IN ('vet', 'clinic')),
    status              VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    -- Flexible payload from the onboarding form (license, clinic details, etc.)
    data                JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_applications_user ON provider_applications(user_id);
CREATE INDEX idx_provider_applications_status ON provider_applications(status);
CREATE INDEX idx_provider_applications_submitted ON provider_applications(submitted_at DESC);

-- ============================================================================
-- 8. AUTH TOKENS
-- ============================================================================

-- Passwordless / session tokens
CREATE TABLE auth_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    token_type  VARCHAR(30) NOT NULL CHECK (token_type IN ('session', 'magic_link', 'password_reset')),
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    revoked_at  TIMESTAMPTZ
);

CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at) WHERE revoked_at IS NULL;

-- ============================================================================
-- 9. CLINIC HOURS
-- ============================================================================

-- Operating hours per day of week
CREATE TABLE clinic_hours (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday, 6=Saturday
    open_time       TIME NOT NULL,
    close_time      TIME NOT NULL,
    is_closed       BOOLEAN DEFAULT FALSE,
    UNIQUE(clinic_id, day_of_week)
);

CREATE INDEX idx_clinic_hours_clinic ON clinic_hours(clinic_id);

-- ============================================================================
-- 10. CLINIC STAFF
-- ============================================================================

-- Many-to-many: vets (and other staff) ↔ clinics
CREATE TABLE clinic_staff (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    vet_id      UUID REFERENCES vets(id) ON DELETE SET NULL,  -- NULL if non-vet staff
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(30) NOT NULL CHECK (role IN ('vet', 'admin', 'receptionist')),
    is_primary  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    removed_at  TIMESTAMPTZ,
    UNIQUE(clinic_id, user_id)
);

CREATE INDEX idx_clinic_staff_clinic ON clinic_staff(clinic_id);
CREATE INDEX idx_clinic_staff_vet ON clinic_staff(vet_id) WHERE vet_id IS NOT NULL;
CREATE INDEX idx_clinic_staff_user ON clinic_staff(user_id);
CREATE INDEX idx_clinic_staff_active ON clinic_staff(clinic_id) WHERE removed_at IS NULL;

-- ============================================================================
-- 11. CLINIC SERVICES
-- ============================================================================

-- Services offered by a specific clinic (with pricing/duration overrides)
CREATE TABLE clinic_services (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    service_id      INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    duration_min    INT NOT NULL,
    price_cents     INT,  -- "Starting at" price (optional)
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, service_id)
);

CREATE INDEX idx_clinic_services_clinic ON clinic_services(clinic_id);
CREATE INDEX idx_clinic_services_service ON clinic_services(service_id);
CREATE INDEX idx_clinic_services_active ON clinic_services(clinic_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 11b. VET SERVICES (Freelancer catalog)
-- ============================================================================
-- Services offered by a freelancer vet (with pricing/duration overrides).
-- Mirrors `clinic_services`, but scoped to a single vet.
CREATE TABLE vet_services (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vet_id          UUID NOT NULL REFERENCES vets(id) ON DELETE CASCADE,
    service_id      INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    duration_min    INT NOT NULL,
    price_cents     INT,  -- "Starting at" price (optional)
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vet_id, service_id)
);

CREATE INDEX idx_vet_services_vet ON vet_services(vet_id);
CREATE INDEX idx_vet_services_service ON vet_services(service_id);
CREATE INDEX idx_vet_services_active ON vet_services(vet_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 12. AVAILABILITY SLOTS
-- ============================================================================

-- Pre-generated or rule-based bookable slots
CREATE TABLE availability_slots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id           UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    vet_id              UUID REFERENCES vets(id) ON DELETE SET NULL,  -- NULL = any available vet
    service_id          INT REFERENCES services(id) ON DELETE SET NULL,  -- NULL = any service
    slot_date           DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    slot_type           VARCHAR(20) DEFAULT 'in_person' CHECK (slot_type IN ('in_person', 'home_visit')),
    max_bookings        INT DEFAULT 1,
    current_bookings    INT DEFAULT 0,  -- Denormalized counter for performance
    is_blocked          BOOLEAN DEFAULT FALSE,  -- Manually blocked (blackout)
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_slots_clinic_date ON availability_slots(clinic_id, slot_date);
CREATE INDEX idx_slots_vet ON availability_slots(vet_id) WHERE vet_id IS NOT NULL;
CREATE INDEX idx_slots_available ON availability_slots(clinic_id, slot_date, is_blocked) 
    WHERE is_blocked = FALSE AND current_bookings < max_bookings;

-- ============================================================================
-- 13. PAYMENT METHODS
-- ============================================================================

-- Stored payment methods (tokenized)
CREATE TABLE payment_methods (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(30) NOT NULL CHECK (provider IN ('stripe', 'square', 'paypal')),
    provider_token  VARCHAR(255) NOT NULL,
    card_last4      VARCHAR(4),
    card_brand      VARCHAR(20),  -- visa, mastercard, amex, etc.
    card_exp_month  SMALLINT,
    card_exp_year   SMALLINT,
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  -- Soft delete
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

-- ============================================================================
-- 14. APPOINTMENTS
-- ============================================================================

-- Core booking record
CREATE TABLE appointments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confirmation_code       VARCHAR(12) UNIQUE NOT NULL,
    clinic_id               UUID NOT NULL REFERENCES clinics(id),
    slot_id                 UUID REFERENCES availability_slots(id) ON DELETE SET NULL,
    owner_id                UUID NOT NULL REFERENCES users(id),
    pet_id                  UUID NOT NULL REFERENCES pets(id),
    vet_id                  UUID REFERENCES vets(id) ON DELETE SET NULL,
    service_id              INT NOT NULL REFERENCES services(id),
    appointment_type        VARCHAR(20) NOT NULL CHECK (appointment_type IN ('in_person', 'home_visit')),
    scheduled_date          DATE NOT NULL,
    scheduled_start         TIME NOT NULL,
    scheduled_end           TIME NOT NULL,
    -- Home visit address (if applicable)
    home_address_line1      VARCHAR(255),
    home_address_line2      VARCHAR(255),
    home_city               VARCHAR(100),
    home_state              VARCHAR(50),
    home_postal_code        VARCHAR(20),
    home_access_notes       TEXT,  -- Gate code, parking, etc.
    -- Notes
    owner_notes             TEXT,  -- Symptoms, concerns
    clinic_notes            TEXT,  -- Internal notes
    -- Status
    status                  VARCHAR(30) NOT NULL DEFAULT 'booked' 
                            CHECK (status IN ('booked', 'rescheduled', 'cancelled_by_owner', 
                                              'cancelled_by_clinic', 'no_show', 'completed')),
    is_emergency            BOOLEAN DEFAULT FALSE,
    -- Cancellation tracking
    cancelled_by            UUID REFERENCES users(id),
    cancellation_reason     TEXT,
    cancelled_at            TIMESTAMPTZ,
    -- Notifications
    reminder_sent_at        TIMESTAMPTZ,
    -- Timestamps
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appts_confirmation ON appointments(confirmation_code);
CREATE INDEX idx_appts_owner ON appointments(owner_id);
CREATE INDEX idx_appts_clinic_date ON appointments(clinic_id, scheduled_date);
CREATE INDEX idx_appts_vet_date ON appointments(vet_id, scheduled_date) WHERE vet_id IS NOT NULL;
CREATE INDEX idx_appts_pet ON appointments(pet_id);
CREATE INDEX idx_appts_status ON appointments(status);
CREATE INDEX idx_appts_upcoming ON appointments(scheduled_date, status) 
    WHERE status IN ('booked', 'rescheduled');

-- ============================================================================
-- 15. APPOINTMENT STATUS HISTORY
-- ============================================================================

-- Audit log for status changes
CREATE TABLE appointment_status_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id      UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    previous_status     VARCHAR(30),
    new_status          VARCHAR(30) NOT NULL,
    changed_by          UUID REFERENCES users(id),  -- NULL = system
    reason              TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appt_history_appt ON appointment_status_history(appointment_id);
CREATE INDEX idx_appt_history_created ON appointment_status_history(created_at);

-- ============================================================================
-- 16. PAYMENTS
-- ============================================================================

-- Payment transactions for appointments
CREATE TABLE payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id          UUID NOT NULL REFERENCES appointments(id),
    user_id                 UUID NOT NULL REFERENCES users(id),
    payment_method_id       UUID REFERENCES payment_methods(id),
    amount_cents            INT NOT NULL,
    currency                VARCHAR(3) DEFAULT 'USD',
    status                  VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    provider                VARCHAR(30) NOT NULL CHECK (provider IN ('stripe', 'square', 'paypal')),
    provider_payment_id     VARCHAR(255),
    provider_refund_id      VARCHAR(255),
    refund_amount_cents     INT DEFAULT 0,
    failure_reason          TEXT,
    -- Platform fee / take-rate fields
    platform_fee_cents      INT DEFAULT 0,                -- FindMyVet's cut
    clinic_payout_cents     INT,                          -- Amount paid out to clinic
    payout_status           VARCHAR(30) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
    payout_at               TIMESTAMPTZ,
    payout_reference        VARCHAR(255),                 -- Stripe transfer ID, etc.
    paid_at                 TIMESTAMPTZ,
    refunded_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payout_status ON payments(payout_status);
CREATE INDEX idx_payments_provider_id ON payments(provider_payment_id) WHERE provider_payment_id IS NOT NULL;

-- ============================================================================
-- 17. REVIEWS
-- ============================================================================

-- Post-appointment reviews (owner → clinic/vet)
CREATE TABLE reviews (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id          UUID UNIQUE NOT NULL REFERENCES appointments(id),
    reviewer_id             UUID NOT NULL REFERENCES users(id),
    clinic_id               UUID NOT NULL REFERENCES clinics(id),
    vet_id                  UUID REFERENCES vets(id),
    rating                  SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title                   VARCHAR(200),
    body                    TEXT,
    is_published            BOOLEAN DEFAULT TRUE,
    clinic_response         TEXT,
    clinic_responded_at     TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_clinic ON reviews(clinic_id);
CREATE INDEX idx_reviews_vet ON reviews(vet_id) WHERE vet_id IS NOT NULL;
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_published ON reviews(clinic_id, is_published) WHERE is_published = TRUE;

-- ============================================================================
-- 18. EMERGENCY FLAGS
-- ============================================================================

-- Real-time emergency status for clinics
CREATE TABLE emergency_flags (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    flag_type   VARCHAR(30) NOT NULL CHECK (flag_type IN ('accepting_emergency', 'at_capacity', 'closed_emergency')),
    message     TEXT,  -- Custom message (e.g., "ER wait: 2 hrs")
    started_at  TIMESTAMPTZ DEFAULT NOW(),
    expires_at  TIMESTAMPTZ,  -- Auto-clear after this time
    created_by  UUID NOT NULL REFERENCES users(id),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_flags_clinic_active ON emergency_flags(clinic_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_emergency_flags_expires ON emergency_flags(expires_at) WHERE expires_at IS NOT NULL AND is_active = TRUE;

-- ============================================================================
-- 19. SUBSCRIPTION PLANS (SaaS monetization for clinics)
-- ============================================================================

CREATE TABLE subscription_plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL,  -- 'starter', 'pro', 'plus'
    display_name    VARCHAR(100) NOT NULL,        -- 'Starter', 'Pro', 'Plus'
    price_cents     INT NOT NULL,                 -- Monthly price in cents
    billing_period  VARCHAR(20) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
    features        JSONB,                        -- Feature flags {"analytics": true, "priority_search": false}
    max_vets        INT,                          -- NULL = unlimited
    max_bookings    INT,                          -- NULL = unlimited per month
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 20. CLINIC SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE clinic_subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id               UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    plan_id                 INT NOT NULL REFERENCES subscription_plans(id),
    status                  VARCHAR(30) NOT NULL DEFAULT 'active' 
                            CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
    current_period_start    TIMESTAMPTZ NOT NULL,
    current_period_end      TIMESTAMPTZ NOT NULL,
    cancel_at_period_end    BOOLEAN DEFAULT FALSE,
    cancelled_at            TIMESTAMPTZ,
    trial_end               TIMESTAMPTZ,
    -- Payment provider references
    stripe_subscription_id  VARCHAR(255),
    stripe_customer_id      VARCHAR(255),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id)       -- One active subscription per clinic
);

CREATE INDEX idx_clinic_subs_clinic ON clinic_subscriptions(clinic_id);
CREATE INDEX idx_clinic_subs_status ON clinic_subscriptions(status);
CREATE INDEX idx_clinic_subs_period_end ON clinic_subscriptions(current_period_end);

-- ============================================================================
-- 21. SUBSCRIPTION INVOICES (billing history)
-- ============================================================================

CREATE TABLE subscription_invoices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id     UUID NOT NULL REFERENCES clinic_subscriptions(id) ON DELETE CASCADE,
    clinic_id           UUID NOT NULL REFERENCES clinics(id),
    amount_cents        INT NOT NULL,
    status              VARCHAR(30) NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    invoice_date        DATE NOT NULL,
    due_date            DATE NOT NULL,
    paid_at             TIMESTAMPTZ,
    stripe_invoice_id   VARCHAR(255),
    pdf_url             TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sub_invoices_clinic ON subscription_invoices(clinic_id);
CREATE INDEX idx_sub_invoices_status ON subscription_invoices(status);

-- ============================================================================
-- 22. FREELANCER SESSIONS (per-session tracking for freelancer vets)
-- ============================================================================

CREATE TABLE freelancer_sessions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vet_id                  UUID NOT NULL REFERENCES vets(id) ON DELETE CASCADE,
    appointment_id          UUID NOT NULL REFERENCES appointments(id),
    session_date            DATE NOT NULL,
    session_amount_cents    INT NOT NULL,           -- Total charged to pet owner
    platform_fee_cents      INT NOT NULL,           -- FindMyVet's cut
    vet_payout_cents        INT NOT NULL,           -- Amount owed to freelancer
    payout_status           VARCHAR(30) NOT NULL DEFAULT 'pending'
                            CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
    payout_id               UUID,                   -- FK to vet_payouts when batched
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_freelancer_sessions_vet ON freelancer_sessions(vet_id);
CREATE INDEX idx_freelancer_sessions_payout ON freelancer_sessions(payout_status);
CREATE INDEX idx_freelancer_sessions_date ON freelancer_sessions(session_date);

-- ============================================================================
-- 23. VET PAYOUTS (batched payouts to freelancer vets)
-- ============================================================================

CREATE TABLE vet_payouts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vet_id              UUID NOT NULL REFERENCES vets(id) ON DELETE CASCADE,
    amount_cents        INT NOT NULL,
    session_count       INT NOT NULL,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    stripe_transfer_id  VARCHAR(255),
    paid_at             TIMESTAMPTZ,
    failure_reason      TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vet_payouts_vet ON vet_payouts(vet_id);
CREATE INDEX idx_vet_payouts_status ON vet_payouts(status);

-- Add FK from freelancer_sessions to vet_payouts
ALTER TABLE freelancer_sessions
ADD CONSTRAINT fk_freelancer_sessions_payout 
FOREIGN KEY (payout_id) REFERENCES vet_payouts(id) ON DELETE SET NULL;

-- ============================================================================
-- 24. PLATFORM REVENUE (analytics/reporting)
-- ============================================================================

CREATE TABLE platform_revenue (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revenue_date    DATE NOT NULL,
    revenue_type    VARCHAR(30) NOT NULL 
                    CHECK (revenue_type IN ('booking_fee', 'subscription', 'freelancer_fee')),
    source_id       UUID,                    -- payment_id, subscription_id, or session_id
    clinic_id       UUID REFERENCES clinics(id),
    vet_id          UUID REFERENCES vets(id),
    amount_cents    INT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_revenue_date ON platform_revenue(revenue_date);
CREATE INDEX idx_platform_revenue_type ON platform_revenue(revenue_type);
CREATE INDEX idx_platform_revenue_clinic ON platform_revenue(clinic_id) WHERE clinic_id IS NOT NULL;

-- ============================================================================
-- SEED DATA: Subscription Plans
-- ============================================================================

INSERT INTO subscription_plans (name, display_name, price_cents, features, max_vets, max_bookings) VALUES
    ('starter', 'Starter', 9900, '{"reminders": true, "analytics": false, "priority_search": false}', 2, 100),
    ('pro', 'Pro', 24900, '{"reminders": true, "analytics": true, "priority_search": false, "review_requests": true}', 10, NULL),
    ('plus', 'Plus', 49900, '{"reminders": true, "analytics": true, "priority_search": true, "review_requests": true, "emergency_flags": true}', NULL, NULL);

-- ============================================================================
-- SEED DATA: Species
-- ============================================================================

INSERT INTO species (name, is_active) VALUES
    ('Dog', TRUE),
    ('Cat', TRUE),
    ('Bird', TRUE),
    ('Rabbit', TRUE),
    ('Hamster', TRUE),
    ('Guinea Pig', TRUE),
    ('Fish', TRUE),
    ('Reptile', TRUE),
    ('Ferret', TRUE),
    ('Horse', TRUE),
    ('Other', TRUE);

-- ============================================================================
-- SEED DATA: Common Dog Breeds
-- ============================================================================

INSERT INTO breeds (species_id, name)
SELECT s.id, breed.name
FROM species s
CROSS JOIN (VALUES
    ('Labrador Retriever'),
    ('German Shepherd'),
    ('Golden Retriever'),
    ('French Bulldog'),
    ('Bulldog'),
    ('Poodle'),
    ('Beagle'),
    ('Rottweiler'),
    ('German Shorthaired Pointer'),
    ('Dachshund'),
    ('Yorkshire Terrier'),
    ('Boxer'),
    ('Siberian Husky'),
    ('Australian Shepherd'),
    ('Cavalier King Charles Spaniel'),
    ('Shih Tzu'),
    ('Doberman Pinscher'),
    ('Boston Terrier'),
    ('Bernese Mountain Dog'),
    ('Pomeranian'),
    ('Mixed Breed')
) AS breed(name)
WHERE s.name = 'Dog';

-- ============================================================================
-- SEED DATA: Common Cat Breeds
-- ============================================================================

INSERT INTO breeds (species_id, name)
SELECT s.id, breed.name
FROM species s
CROSS JOIN (VALUES
    ('Domestic Shorthair'),
    ('Domestic Longhair'),
    ('Siamese'),
    ('Persian'),
    ('Maine Coon'),
    ('Ragdoll'),
    ('Bengal'),
    ('Abyssinian'),
    ('British Shorthair'),
    ('Scottish Fold'),
    ('Sphynx'),
    ('Russian Blue'),
    ('Mixed Breed')
) AS breed(name)
WHERE s.name = 'Cat';

-- ============================================================================
-- SEED DATA: Services
-- ============================================================================

INSERT INTO services (name, slug, description, default_duration_min, is_emergency, supports_home_visit, is_active) VALUES
    ('General Exam', 'general-exam', 'Routine wellness checkup and physical examination', 30, FALSE, TRUE, TRUE),
    ('Vaccination', 'vaccination', 'Standard vaccinations and boosters', 20, FALSE, TRUE, TRUE),
    ('Sick Visit', 'sick-visit', 'Evaluation and treatment for illness or injury', 30, FALSE, TRUE, TRUE),
    ('Dental Cleaning', 'dental-cleaning', 'Professional dental cleaning under anesthesia', 120, FALSE, FALSE, TRUE),
    ('Surgery Consult', 'surgery-consult', 'Pre-surgical consultation and evaluation', 45, FALSE, FALSE, TRUE),
    ('Spay/Neuter', 'spay-neuter', 'Spay or neuter surgery', 60, FALSE, FALSE, TRUE),
    ('X-Ray/Imaging', 'xray-imaging', 'Radiographs and diagnostic imaging', 45, FALSE, FALSE, TRUE),
    ('Lab Work', 'lab-work', 'Blood tests, urinalysis, and other laboratory diagnostics', 30, FALSE, FALSE, TRUE),
    ('Emergency Visit', 'emergency-visit', 'Urgent and emergency care', 60, TRUE, FALSE, TRUE),
    ('Home Visit — General', 'home-visit-general', 'In-home wellness exam and basic care', 45, FALSE, TRUE, TRUE),
    ('Home Visit — End of Life', 'home-visit-eol', 'Compassionate in-home euthanasia services', 60, FALSE, TRUE, TRUE),
    ('Grooming', 'grooming', 'Professional grooming services', 60, FALSE, FALSE, TRUE),
    ('Microchipping', 'microchipping', 'Microchip implantation for pet identification', 15, FALSE, TRUE, TRUE),
    ('Nail Trim', 'nail-trim', 'Nail trimming service', 15, FALSE, TRUE, TRUE),
    ('Follow-up Visit', 'follow-up', 'Post-treatment or post-surgery follow-up', 20, FALSE, TRUE, TRUE);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at
    BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vets_updated_at
    BEFORE UPDATE ON vets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at
    BEFORE UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function to generate confirmation codes
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS VARCHAR(12) AS $$
DECLARE
    chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- Excluding confusing chars (0, O, 1, I)
    result VARCHAR(12) := '';
    i INT;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- Format: XXXX-XXXX
    RETURN substr(result, 1, 4) || '-' || substr(result, 5, 4);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE users IS 'Central user table for all roles: pet owners, vets, clinic admins, support';
COMMENT ON TABLE clinics IS 'Veterinary clinics and practices';
COMMENT ON TABLE vets IS 'Veterinarian profiles linked to user accounts';
COMMENT ON TABLE pets IS 'Pet profiles owned by users';
COMMENT ON TABLE services IS 'Global service catalog (system-defined)';
COMMENT ON TABLE clinic_services IS 'Services offered by specific clinics with custom pricing/duration';
COMMENT ON TABLE availability_slots IS 'Bookable time slots for appointments';
COMMENT ON TABLE appointments IS 'Core booking records';
COMMENT ON TABLE payments IS 'Payment transactions for appointments';
COMMENT ON TABLE reviews IS 'Post-appointment reviews from pet owners';
COMMENT ON TABLE emergency_flags IS 'Real-time emergency status flags for clinics';
COMMENT ON TABLE subscription_plans IS 'SaaS pricing tiers for clinic subscriptions';
COMMENT ON TABLE clinic_subscriptions IS 'Active subscriptions linking clinics to plans';
COMMENT ON TABLE subscription_invoices IS 'Billing history for clinic subscriptions';
COMMENT ON TABLE freelancer_sessions IS 'Per-session tracking for freelancer vet monetization';
COMMENT ON TABLE vet_payouts IS 'Batched payouts to freelancer vets';
COMMENT ON TABLE platform_revenue IS 'Aggregated view of all FindMyVet revenue for reporting';

COMMENT ON COLUMN appointments.status IS 'booked, rescheduled, cancelled_by_owner, cancelled_by_clinic, no_show, completed';
COMMENT ON COLUMN availability_slots.current_bookings IS 'Denormalized counter - update transactionally with bookings';
COMMENT ON COLUMN clinics.home_visit_radius_km IS 'Service area radius for home visits in kilometers';
COMMENT ON COLUMN vets.is_freelancer IS 'True if vet operates independently (not clinic-employed)';
COMMENT ON COLUMN vets.platform_fee_percent IS 'FindMyVet take-rate for freelancer sessions';
COMMENT ON COLUMN payments.platform_fee_cents IS 'FindMyVet platform fee (take-rate per booking)';
COMMENT ON COLUMN payments.clinic_payout_cents IS 'Amount to be paid out to clinic (amount - platform_fee)';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

