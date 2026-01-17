# FindMyVet API Reference

Complete REST API reference with request/response examples.

---

## Base URL

```
https://api.findmyvet.com/api/v1
```

For local development:
```
http://localhost:8000/api/v1
```

---

## Authentication

All authenticated endpoints require a Bearer token.

For the mobile app, use a **Clerk JWT** (from `useAuth().getToken()` in the Expo app):

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 1. Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request:**
```json
{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1-555-123-4567",
    "timezone": "America/New_York"
}
```

**Response (201):**
```json
{
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "john.doe@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1-555-123-4567",
        "avatar_url": null,
        "email_verified": false,
        "phone_verified": false,
        "timezone": "America/New_York",
        "created_at": "2024-01-15T10:30:00Z"
    },
    "tokens": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
        "token_type": "bearer",
        "expires_in": 1800
    }
}
```

### POST /auth/login

**Request:**
```json
{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
}
```

**Response (200):** Same as register response.

### POST /auth/refresh

**Request:**
```json
{
    "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response (200):**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "bmV3IHJlZnJlc2ggdG9r...",
    "token_type": "bearer",
    "expires_in": 1800
}
```

### GET /auth/me

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
    "clerk_user_id": "user_2abc...",
    "internal_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "session_id": "sess_...",
    "org_id": null,
    "claims": { "...": "..." }
}
```

---

## 2. Clinic Discovery Endpoints

### POST /clinics/search

Search for veterinary clinics by location and filters.

**Request:**
```json
{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "radius_km": 15,
    "service_id": 1,
    "accepts_emergency": false,
    "home_visit_only": false,
    "open_now": true,
    "next_available_within_days": 7,
    "page": 1,
    "page_size": 20
}
```

**Response (200):**
```json
{
    "clinics": [
        {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "name": "Happy Paws Veterinary Clinic",
            "slug": "happy-paws-sf",
            "phone": "+1-415-555-1234",
            "address_line1": "123 Pet Street",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94102",
            "latitude": "37.7749295",
            "longitude": "-122.4194155",
            "distance_km": 2.3,
            "accepts_emergency": true,
            "home_visit_enabled": true,
            "logo_url": "https://cdn.findmyvet.com/clinics/770e8400/logo.jpg",
            "next_available_slot": "2024-01-16T09:00:00Z",
            "rating_average": 4.7,
            "review_count": 156,
            "is_open_now": true
        }
    ],
    "total": 45,
    "page": 1,
    "page_size": 20,
    "total_pages": 3
}
```

### GET /clinics/{slug}

Get full clinic details by URL slug.

**Response (200):**
```json
{
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "Happy Paws Veterinary Clinic",
    "slug": "happy-paws-sf",
    "description": "Full-service veterinary clinic serving San Francisco since 2010.",
    "phone": "+1-415-555-1234",
    "email": "hello@happypawsvet.com",
    "website_url": "https://happypawsvet.com",
    "logo_url": "https://cdn.findmyvet.com/clinics/770e8400/logo.jpg",
    "address_line1": "123 Pet Street",
    "address_line2": "Suite 100",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94102",
    "country": "US",
    "latitude": "37.7749295",
    "longitude": "-122.4194155",
    "timezone": "America/Los_Angeles",
    "cancellation_policy": "Please cancel at least 24 hours in advance to avoid a $25 fee.",
    "parking_notes": "Free parking available behind the building.",
    "accepts_emergency": true,
    "home_visit_enabled": true,
    "home_visit_radius_km": 15.0,
    "hours": [
        {"day_of_week": 0, "open_time": "10:00:00", "close_time": "16:00:00", "is_closed": false},
        {"day_of_week": 1, "open_time": "08:00:00", "close_time": "18:00:00", "is_closed": false},
        {"day_of_week": 2, "open_time": "08:00:00", "close_time": "18:00:00", "is_closed": false},
        {"day_of_week": 3, "open_time": "08:00:00", "close_time": "18:00:00", "is_closed": false},
        {"day_of_week": 4, "open_time": "08:00:00", "close_time": "18:00:00", "is_closed": false},
        {"day_of_week": 5, "open_time": "08:00:00", "close_time": "17:00:00", "is_closed": false},
        {"day_of_week": 6, "open_time": "09:00:00", "close_time": "14:00:00", "is_closed": false}
    ],
    "services": [
        {
            "id": 1,
            "name": "General Exam",
            "slug": "general-exam",
            "description": "Routine wellness checkup and physical examination",
            "duration_min": 30,
            "price_cents": 7500,
            "is_emergency": false,
            "supports_home_visit": true
        },
        {
            "id": 2,
            "name": "Vaccination",
            "slug": "vaccination",
            "description": "Standard vaccinations and boosters",
            "duration_min": 20,
            "price_cents": 4500,
            "is_emergency": false,
            "supports_home_visit": true
        }
    ],
    "vets": [
        {
            "id": "880e8400-e29b-41d4-a716-446655440003",
            "first_name": "Sarah",
            "last_name": "Johnson",
            "specialty": "General Practice",
            "photo_url": "https://cdn.findmyvet.com/vets/880e8400.jpg",
            "is_verified": true
        }
    ],
    "rating_average": 4.7,
    "review_count": 156,
    "is_open_now": true
}
```

### GET /clinics/{clinic_id}

Get clinic details by internal UUID (recommended for the app).

### GET /clinics/slug/{slug}

Get clinic details by slug (explicit path to avoid route ambiguity).

---

## 2b. Service Catalog & Provider Service Management

### GET /services

List the **global service catalog** (platform-managed templates).

Providers (clinics and verified freelancer vets) enable items from this catalog and set their own:
- `duration_min`
- `price_cents` (optional)
- active/inactive

**Query params:**
- `is_emergency` (optional)
- `supports_home_visit` (optional)

### Clinic Admin: manage clinic services

- `POST /clinics/{clinic_id}/services` (enable/add)
- `PATCH /clinics/{clinic_id}/services/{service_id}` (update)
- `DELETE /clinics/{clinic_id}/services/{service_id}` (disable)

### Freelancer Vets: manage vet services

- `GET /vets/{vet_id}/services` (public list)
- `GET /vets/me/services` (authenticated)
- `POST /vets/me/services` (authenticated)
- `PATCH /vets/me/services/{service_id}` (authenticated)
- `DELETE /vets/me/services/{service_id}` (authenticated)

**Access rules:**
- Only **verified freelancer vets** can manage their own menu (`vets.is_verified=true` and `vets.is_freelancer=true`).

---

## 3. Availability Endpoints

### POST /availability/slots

Get available appointment slots.

**Request:**
```json
{
    "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
    "service_id": 1,
    "start_date": "2024-01-16",
    "end_date": "2024-01-23",
    "vet_id": null,
    "slot_type": "in_person"
}
```

**Response (200):**
```json
{
    "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
    "clinic_name": "Happy Paws Veterinary Clinic",
    "service_id": 1,
    "service_name": "General Exam",
    "days": [
        {
            "date": "2024-01-16",
            "slots": [
                {
                    "id": "990e8400-e29b-41d4-a716-446655440004",
                    "slot_date": "2024-01-16",
                    "start_time": "09:00:00",
                    "end_time": "09:30:00",
                    "slot_type": "in_person",
                    "vet_id": null,
                    "vet_name": null,
                    "available_count": 1
                },
                {
                    "id": "990e8400-e29b-41d4-a716-446655440005",
                    "slot_date": "2024-01-16",
                    "start_time": "09:30:00",
                    "end_time": "10:00:00",
                    "slot_type": "in_person",
                    "vet_id": "880e8400-e29b-41d4-a716-446655440003",
                    "vet_name": "Dr. Sarah Johnson",
                    "available_count": 1
                }
            ]
        },
        {
            "date": "2024-01-17",
            "slots": []
        }
    ]
}
```

---

## 4. Appointment Endpoints

### POST /appointments

Book a new appointment.

**Headers:** `Authorization: Bearer <token>`

**Request (in-person):**
```json
{
    "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
    "slot_id": "990e8400-e29b-41d4-a716-446655440004",
    "pet_id": "660e8400-e29b-41d4-a716-446655440001",
    "service_id": 1,
    "appointment_type": "in_person",
    "owner_notes": "Buddy has been scratching his ear a lot lately."
}
```

**Request (home visit):**
```json
{
    "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
    "slot_id": "990e8400-e29b-41d4-a716-446655440010",
    "pet_id": "660e8400-e29b-41d4-a716-446655440001",
    "service_id": 10,
    "appointment_type": "home_visit",
    "owner_notes": "Annual checkup",
    "home_address_line1": "456 Home Street",
    "home_address_line2": "Apt 2B",
    "home_city": "San Francisco",
    "home_state": "CA",
    "home_postal_code": "94110",
    "home_access_notes": "Gate code: 1234. Ring doorbell."
}
```

**Response (201):**
```json
{
    "appointment": {
        "id": "aa0e8400-e29b-41d4-a716-446655440007",
        "confirmation_code": "ABCD-1234",
        "clinic": {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "name": "Happy Paws Veterinary Clinic",
            "phone": "+1-415-555-1234",
            "address_line1": "123 Pet Street",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94102"
        },
        "pet": {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "name": "Buddy",
            "species_name": "Dog",
            "breed_name": "Golden Retriever"
        },
        "vet_name": "Dr. Sarah Johnson",
        "service_name": "General Exam",
        "appointment_type": "in_person",
        "scheduled_date": "2024-01-16",
        "scheduled_start": "09:00:00",
        "scheduled_end": "09:30:00",
        "status": "booked",
        "is_emergency": false,
        "owner_notes": "Buddy has been scratching his ear a lot lately.",
        "created_at": "2024-01-15T14:30:00Z",
        "updated_at": "2024-01-15T14:30:00Z"
    },
    "message": "Appointment booked successfully! A confirmation email has been sent.",
    "add_to_calendar_url": "https://api.findmyvet.com/v1/appointments/aa0e8400/calendar.ics"
}
```

### PATCH /appointments/{id}/reschedule

**Request:**
```json
{
    "new_slot_id": "990e8400-e29b-41d4-a716-446655440006"
}
```

**Response (200):** Updated appointment object with status "rescheduled".

### POST /appointments/{id}/cancel

**Request:**
```json
{
    "reason": "Pet is feeling better, no longer needs the visit."
}
```

**Response (200):** Updated appointment object with status "cancelled_by_owner".

---

## 5. Pets Endpoints

All pets endpoints require Clerk auth.

### GET /pets

List the current user's pets.

### POST /pets

Create a pet profile for the current user.

**Request:**
```json
{
  "name": "Buddy",
  "species_name": "Dog",
  "breed_name": "Golden Retriever",
  "sex": "male",
  "notes": "Allergies: Chicken • Traits: Friendly, Playful"
}
```

## 5. Review Endpoints

### POST /reviews

Create a review for a completed appointment.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
    "appointment_id": "aa0e8400-e29b-41d4-a716-446655440007",
    "rating": 5,
    "title": "Excellent care for Buddy!",
    "body": "Dr. Johnson was incredibly thorough and patient with my nervous pup. She took the time to explain everything and made Buddy feel comfortable. Highly recommend!"
}
```

**Response (201):**
```json
{
    "id": "bb0e8400-e29b-41d4-a716-446655440008",
    "appointment_id": "aa0e8400-e29b-41d4-a716-446655440007",
    "reviewer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "first_name": "John",
        "last_initial": "D",
        "avatar_url": null
    },
    "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
    "clinic_name": "Happy Paws Veterinary Clinic",
    "vet_id": "880e8400-e29b-41d4-a716-446655440003",
    "vet_name": "Dr. Sarah Johnson",
    "rating": 5,
    "title": "Excellent care for Buddy!",
    "body": "Dr. Johnson was incredibly thorough and patient with my nervous pup...",
    "clinic_response": null,
    "clinic_responded_at": null,
    "created_at": "2024-01-16T15:30:00Z",
    "updated_at": "2024-01-16T15:30:00Z"
}
```

### GET /reviews/clinic/{clinic_id}

**Query params:** `?rating=5&sort_by=recent&page=1&page_size=20`

**Response (200):**
```json
{
    "reviews": [...],
    "total": 156,
    "page": 1,
    "page_size": 20,
    "average_rating": 4.7,
    "rating_distribution": {
        "5": 98,
        "4": 35,
        "3": 15,
        "2": 5,
        "1": 3
    }
}
```

---

## 6. Emergency Endpoints

### POST /emergency/search

Search for emergency veterinary clinics.

**Request:**
```json
{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "radius_km": 30,
    "open_now": true,
    "species_id": 1,
    "page": 1,
    "page_size": 20
}
```

**Response (200):**
```json
{
    "clinics": [
        {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "name": "SF Emergency Vet Hospital",
            "phone": "+1-415-555-9999",
            "address_line1": "456 Emergency Lane",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94103",
            "latitude": "37.7751",
            "longitude": "-122.4180",
            "distance_km": 1.2,
            "is_open_now": true,
            "opens_at": null,
            "closes_at": null,
            "hours_confirmed": true,
            "emergency_flag": "accepting_emergency",
            "emergency_message": null,
            "wait_time_estimate": "~45 minutes",
            "directions_url": "https://www.google.com/maps/dir/?api=1&destination=37.7751,-122.4180"
        }
    ],
    "total": 5,
    "search_radius_km": 30,
    "disclaimer": "This is not a substitute for professional veterinary advice. If your pet is in immediate danger, call the nearest clinic now."
}
```

### GET /emergency/guidance

**Response (200):**
```json
{
    "title": "Signs that require immediate veterinary care",
    "description": "If your pet shows any of these symptoms, please call an emergency vet immediately.",
    "call_to_action": "Call the nearest emergency clinic",
    "symptoms": [
        "Difficulty breathing or choking",
        "Severe bleeding that won't stop",
        "Inability to urinate or defecate",
        "Seizures",
        "Loss of consciousness",
        "Suspected poisoning",
        "Severe trauma (hit by car, fall, etc.)",
        "Distended or bloated abdomen",
        "Sudden collapse or inability to stand"
    ]
}
```

### POST /emergency/flags (Clinic Admin)

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
    "flag_type": "at_capacity",
    "message": "Currently experiencing high volume. Expected wait: 2-3 hours.",
    "expires_in_hours": 4
}
```

**Response (201):**
```json
{
    "id": "cc0e8400-e29b-41d4-a716-446655440009",
    "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
    "flag_type": "at_capacity",
    "message": "Currently experiencing high volume. Expected wait: 2-3 hours.",
    "started_at": "2024-01-16T18:00:00Z",
    "expires_at": "2024-01-16T22:00:00Z",
    "is_active": true,
    "created_by_name": "Admin User"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
    "detail": "Invalid date range. End date must be within 14 days of start date."
}
```

### 401 Unauthorized
```json
{
    "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
    "detail": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
    "detail": "Clinic not found"
}
```

### 409 Conflict
```json
{
    "detail": "Slot is no longer available"
}
```

### 422 Validation Error
```json
{
    "detail": [
        {
            "loc": ["body", "email"],
            "msg": "value is not a valid email address",
            "type": "value_error.email"
        }
    ]
}
```

