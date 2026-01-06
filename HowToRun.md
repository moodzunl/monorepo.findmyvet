### How to run FindMyVet locally

### 1) Backend (FastAPI)

#### **Prereqs**

- Python 3.11+ (3.12 works)
- Postgres running locally (or a remote Postgres)

#### **Create a venv + install deps**

```bash
cd /Users/oscarsarabia/codes/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### **Database**

- Create a database (example: `findmyvet`)
- Run the schema file:

```bash
psql -d findmyvet -f ../FindMyVet_Schema.sql
```

#### **Backend env vars**

Create `backend/.env` (values are examples):

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/findmyvet
DEBUG=true

# Clerk (JWT verification)
CLERK_JWKS_URL=https://<your-clerk-domain>/.well-known/jwks.json
CLERK_ISSUER=https://<your-clerk-domain>
CLERK_AUDIENCE=findmyvet-api
```

> Clerk JWT template: make sure your template includes at least:
>
> - `"aud": "findmyvet-api"`
> - `"email": "{{user.primary_email_address}}"`
>
> (Email is required because our DB schema requires `users.email`.)
>
> Also: the Expo app requests `getToken({ template: "backend" })`, so create a JWT template named **`backend`**
> with the claims above (and ideally `first_name`, `last_name`, `avatar_url` too).

#### **Run the backend**

```bash
cd /Users/oscarsarabia/codes/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger docs: `http://localhost:8000/docs`

---

### 2) Frontend (Expo)

#### **Install deps**

```bash
cd /Users/oscarsarabia/codes/frontend
npm install
```

#### **Frontend env vars**

Create `frontend/.env`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...

# Backend URL:
# - iOS Simulator: http://localhost:8000
# - Physical phone (Expo Go): use your Mac LAN IP, ex: http://192.168.1.94:8000
# - Android emulator: http://10.0.2.2:8000
EXPO_PUBLIC_API_URL=http://localhost:8000
```

#### **Enable Google login (Clerk)**

- In your Clerk Dashboard, enable **Google** under **User & Authentication → Social Connections**.
- Add an allowlisted redirect URL that matches the app scheme in `frontend/app.json`:
  - This app uses **`findmyvet`**, so allow something like **`findmyvet://*`** (or the exact URL you see during the OAuth redirect).
- Ensure your **Clerk JWT template** includes an email claim (see backend section above), otherwise `/api/v1/auth/me` will fail because `users.email` is required.

#### **Run Expo**

```bash
cd /Users/oscarsarabia/codes/frontend
npx expo start -c
```

---

### Notes / Common issues

- **Network request failed** on a physical phone usually means `EXPO_PUBLIC_API_URL` is pointing at `localhost` instead of your Mac LAN IP.
- If you run `git` commands from `backend/`, remember the schema file path is `../FindMyVet_Schema.sql`.
