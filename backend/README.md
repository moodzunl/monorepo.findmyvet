# FindMyVet Backend API

FastAPI-based REST API for the FindMyVet veterinary marketplace application.

## Tech Stack

- **Framework**: FastAPI 0.109+
- **Python**: 3.11+
- **Database**: PostgreSQL 12+ with asyncpg
- **ORM**: SQLAlchemy 2.0 (async)
- **Auth**: JWT (python-jose)
- **Validation**: Pydantic 2.5+

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings & environment config
│   ├── schemas/             # Pydantic request/response models
│   │   ├── auth.py          # Authentication schemas
│   │   ├── users.py         # User & pet schemas
│   │   ├── clinics.py       # Clinic & vet schemas
│   │   ├── appointments.py  # Booking & availability schemas
│   │   ├── reviews.py       # Review schemas
│   │   └── emergency.py     # Emergency mode schemas
│   └── routers/             # API route handlers
│       ├── auth.py          # /api/v1/auth/*
│       ├── clinics.py       # /api/v1/clinics/*
│       ├── availability.py  # /api/v1/availability/*
│       ├── appointments.py  # /api/v1/appointments/*
│       ├── reviews.py       # /api/v1/reviews/*
│       └── emergency.py     # /api/v1/emergency/*
├── requirements.txt
└── README.md
```

## Quick Start

### 1. Create virtual environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> Note: SQLAlchemy (including async usage) requires `greenlet`. It’s included in `requirements.txt`.

### 3. Set up environment

Create a `.env` file:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/findmyvet
SECRET_KEY=your-secret-key-change-in-production
DEBUG=true

# Clerk (recommended for the mobile app)
# Point this to your Clerk instance JWKS endpoint (public keys used to verify JWTs)
CLERK_JWKS_URL=https://<your-clerk-domain>/.well-known/jwks.json
# Optional but recommended: validate the token issuer and audience
CLERK_ISSUER=https://<your-clerk-domain>
CLERK_AUDIENCE=<your-jwt-template-audience-or-name>
```

### 4. Set up database

```bash
# Create database
createdb findmyvet

# Run schema
psql -d findmyvet -f ../FindMyVet_Schema.sql
```

### 5. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

### 6. Access API docs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/password |
| POST | `/logout` | Logout (revoke tokens) |
| POST | `/refresh` | Refresh access token |
| POST | `/password-reset` | Request password reset |
| POST | `/password-reset/confirm` | Confirm password reset |
| POST | `/magic-link` | Request magic link login |
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update current user profile |

### Clinics (`/api/v1/clinics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/search` | Search clinics by location |
| GET | `/{slug}` | Get clinic details |
| GET | `/{id}/services` | Get clinic services |
| GET | `/{id}/vets` | Get clinic vets |
| GET | `/vets/{id}` | Get vet details |
| GET | `/services` | List all services |
| GET | `/species` | List all species |
| GET | `/species/{id}/breeds` | List breeds for species |

### Availability (`/api/v1/availability`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/slots` | Get available slots |
| GET | `/next` | Get next available slot |
| GET | `/check/{slot_id}` | Check slot availability |

### Appointments (`/api/v1/appointments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Book new appointment |
| GET | `/` | List user's appointments |
| GET | `/{id}` | Get appointment details |
| GET | `/code/{code}` | Get by confirmation code |
| PATCH | `/{id}/reschedule` | Reschedule appointment |
| POST | `/{id}/cancel` | Cancel appointment |
| GET | `/{id}/calendar.ics` | Download calendar invite |

### Reviews (`/api/v1/reviews`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create review |
| GET | `/clinic/{id}` | Get clinic reviews |
| GET | `/vet/{id}` | Get vet reviews |
| GET | `/{id}` | Get review details |
| PATCH | `/{id}` | Update review |
| DELETE | `/{id}` | Delete review |
| POST | `/{id}/respond` | Clinic response |
| GET | `/stats/clinic/{id}` | Get review stats |

### Emergency (`/api/v1/emergency`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/search` | Search emergency clinics |
| GET | `/nearby` | Quick nearby emergency clinics |
| GET | `/guidance` | Get emergency guidance info |
| POST | `/flags` | Set emergency flag (admin) |
| DELETE | `/flags/{id}` | Remove emergency flag |
| GET | `/flags/clinic/{id}` | Get clinic's active flags |

### Billing & Monetization (`/api/v1/billing`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans` | List subscription plans |
| GET | `/subscriptions/current` | Get clinic's subscription |
| POST | `/subscriptions` | Create subscription |
| PATCH | `/subscriptions` | Update subscription (change plan) |
| POST | `/subscriptions/cancel` | Cancel subscription |
| GET | `/invoices` | List clinic invoices |
| GET | `/sessions` | List freelancer sessions |
| GET | `/sessions/stats` | Get freelancer earnings summary |
| GET | `/payouts` | List freelancer payouts |
| POST | `/payouts/request` | Request manual payout |
| GET | `/revenue/stats` | Platform revenue stats (admin) |

## Authentication

The API uses JWT Bearer tokens. For the mobile app we recommend using **Clerk-issued JWTs**.
Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Flow

1. **Login/Register** → Returns `access_token` + `refresh_token`
2. **Access token** expires in 30 minutes
3. **Refresh token** expires in 7 days
4. Use `/auth/refresh` to get a new access token

## Error Responses

All errors follow this format:

```json
{
    "detail": "Error message here"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., slot already booked)
- `422` - Validation Error
- `500` - Internal Server Error

## Development

### Running Tests

```bash
pytest
```

### Code Style

```bash
# Format
black app/

# Lint
ruff check app/
```

## License

Proprietary - FindMyVet

