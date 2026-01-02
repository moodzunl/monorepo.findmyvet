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


