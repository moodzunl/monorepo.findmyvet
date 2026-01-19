from fastapi.testclient import TestClient

from app.main import app
from app.db import get_db


class _FakeResult:
    def __init__(self, rows=None, first=None):
        self._rows = rows or []
        self._first = first

    def mappings(self):
        return self

    def all(self):
        return self._rows

    def first(self):
        return self._first


class _FakeDB:
    async def execute(self, sql, params=None):
        q = str(sql)
        params = params or {}

        # clinics.search
        if "FROM clinics c" in q and "SELECT" in q:
            return _FakeResult(
                rows=[
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
                        "accepts_emergency": True,
                        "home_visit_enabled": True,
                        "logo_url": None,
                    }
                ]
            )

        # reviews rating aggregate
        if "FROM reviews r" in q and "AVG" in q:
            return _FakeResult(first={"rating_average": 4.7, "review_count": 10})

        # next slot
        if "FROM availability_slots s" in q and "MIN(" in q:
            return _FakeResult(first={"next_available_slot": None})

        # global services catalog
        if "FROM services" in q and "SELECT id, name, slug" in q:
            return _FakeResult(
                rows=[
                    {
                        "id": 1,
                        "name": "General Exam",
                        "slug": "general-exam",
                        "description": "Routine exam",
                        "default_duration_min": 30,
                        "is_emergency": False,
                        "supports_home_visit": True,
                    }
                ]
            )

        # vet exists
        if "FROM vets WHERE id" in q and "SELECT 1" in q:
            return _FakeResult(first={"?": 1})

        # vet services list
        if "FROM vet_services vs" in q and "JOIN services s" in q:
            return _FakeResult(
                rows=[
                    {
                        "id": 1,
                        "name": "General Exam",
                        "slug": "general-exam",
                        "description": "Routine exam",
                        "duration_min": 30,
                        "price_cents": 9000,
                        "is_emergency": False,
                        "supports_home_visit": True,
                    }
                ]
            )

        return _FakeResult(rows=[])

    async def commit(self):
        return None

    async def refresh(self, _):
        return None


async def _override_get_db():
    yield _FakeDB()


def test_auth_me_requires_bearer():
    client = TestClient(app)
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401


def test_clinics_search_returns_shape():
    app.dependency_overrides[get_db] = _override_get_db
    client = TestClient(app)
    res = client.post(
        "/api/v1/clinics/search",
        json={"latitude": 37.7749, "longitude": -122.4194, "radius_km": 50, "page": 1, "page_size": 10},
    )
    assert res.status_code == 200
    body = res.json()
    assert "clinics" in body
    assert isinstance(body["clinics"], list)
    assert body["clinics"][0]["id"]
    assert "distance_km" in body["clinics"][0]
    app.dependency_overrides.clear()


def test_services_catalog_route_exists():
    app.dependency_overrides[get_db] = _override_get_db
    client = TestClient(app)
    res = client.get("/api/v1/services")
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body, list)
    assert body[0]["id"] == 1
    assert body[0]["price_cents"] is None
    app.dependency_overrides.clear()


def test_vet_services_public_list_shape():
    app.dependency_overrides[get_db] = _override_get_db
    client = TestClient(app)
    res = client.get("/api/v1/vets/880e8400-e29b-41d4-a716-446655440003/services")
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body, list)
    assert body[0]["id"] == 1
    assert "duration_min" in body[0]
    app.dependency_overrides.clear()


def test_vets_me_services_route_is_not_shadowed_by_vet_id_route():
    # If routing is wrong, FastAPI treats "me" as {vet_id} and returns 422 UUID error.
    client = TestClient(app)
    res = client.get("/api/v1/vets/me/services")
    assert res.status_code == 401


