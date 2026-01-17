"""
Clinic Discovery Endpoints

POST   /api/v1/clinics/search         - Search clinics by location/filters
GET    /api/v1/clinics/{slug}         - Get clinic details by slug
GET    /api/v1/clinics/{id}/services  - Get clinic services
GET    /api/v1/clinics/{id}/vets      - Get clinic vets
GET    /api/v1/vets/{id}              - Get vet details
GET    /api/v1/services               - List all services
GET    /api/v1/species                - List all species
GET    /api/v1/species/{id}/breeds    - List breeds for species
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from typing import Optional, List, Annotated
from uuid import UUID
from datetime import datetime
from math import radians, sin, cos, asin, sqrt

from app.schemas.clinics import (
    ClinicSearchRequest,
    ClinicSearchResponse,
    ClinicDetailResponse,
    ServiceResponse,
    VetDetailResponse,
    VetSummaryResponse,
)
from app.schemas.provider_services import ProviderServiceUpsertRequest, ProviderServiceUpdateRequest
from app.schemas.users import SpeciesResponse, BreedResponse
from app.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.security.provider_access import require_clinic_admin

router = APIRouter()

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in km
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return r * c


async def _get_clinic_rating(db: AsyncSession, clinic_id: UUID) -> tuple[Optional[float], int]:
    row = (
        await db.execute(
            text(
                """
                SELECT
                  AVG(r.rating)::float AS rating_average,
                  COUNT(*)::int AS review_count
                FROM reviews r
                WHERE r.clinic_id = :clinic_id AND r.is_published = TRUE
                """
            ),
            {"clinic_id": str(clinic_id)},
        )
    ).mappings().first()
    if not row:
        return None, 0
    return row["rating_average"], row["review_count"] or 0


async def _get_next_available_slot(db: AsyncSession, clinic_id: UUID, service_id: Optional[int]) -> Optional[datetime]:
    params = {"clinic_id": str(clinic_id)}
    service_filter = ""
    if service_id is not None:
        params["service_id"] = service_id
        service_filter = "AND (s.service_id IS NULL OR s.service_id = :service_id)"

    row = (
        await db.execute(
            text(
                f"""
                SELECT MIN(s.slot_date + s.start_time) AS next_available_slot
                FROM availability_slots s
                WHERE s.clinic_id = :clinic_id
                  AND s.is_blocked = FALSE
                  AND s.current_bookings < s.max_bookings
                  {service_filter}
                """
            ),
            params,
        )
    ).mappings().first()
    if not row or not row["next_available_slot"]:
        return None
    return row["next_available_slot"]

async def _get_clinic_detail(db: AsyncSession, clinic_id: UUID) -> ClinicDetailResponse:
    clinic = (
        await db.execute(
            text(
                """
                SELECT
                  id, name, slug, description, phone, email, website_url, logo_url,
                  address_line1, address_line2, city, state, postal_code, country,
                  latitude, longitude, timezone, cancellation_policy, parking_notes,
                  accepts_emergency, home_visit_enabled, home_visit_radius_km
                FROM clinics
                WHERE id = :clinic_id
                """
            ),
            {"clinic_id": str(clinic_id)},
        )
    ).mappings().first()

    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    hours = (
        await db.execute(
            text(
                """
                SELECT day_of_week, open_time, close_time, is_closed
                FROM clinic_hours
                WHERE clinic_id = :clinic_id
                ORDER BY day_of_week
                """
            ),
            {"clinic_id": str(clinic_id)},
        )
    ).mappings().all()

    services = (
        await db.execute(
            text(
                """
                SELECT
                  s.id, s.name, s.slug, s.description,
                  cs.duration_min,
                  cs.price_cents,
                  s.is_emergency,
                  s.supports_home_visit
                FROM clinic_services cs
                JOIN services s ON s.id = cs.service_id
                WHERE cs.clinic_id = :clinic_id AND cs.is_active = TRUE
                ORDER BY s.name
                """
            ),
            {"clinic_id": str(clinic_id)},
        )
    ).mappings().all()

    vets = (
        await db.execute(
            text(
                """
                SELECT
                  v.id,
                  COALESCE(u.first_name, '') AS first_name,
                  COALESCE(u.last_name, '') AS last_name,
                  v.specialty,
                  v.photo_url,
                  v.is_verified
                FROM clinic_staff cs
                JOIN vets v ON v.id = cs.vet_id
                JOIN users u ON u.id = v.user_id
                WHERE cs.clinic_id = :clinic_id AND cs.vet_id IS NOT NULL AND cs.removed_at IS NULL
                ORDER BY v.is_verified DESC, u.last_name NULLS LAST
                """
            ),
            {"clinic_id": str(clinic_id)},
        )
    ).mappings().all()

    rating_average, review_count = await _get_clinic_rating(db, clinic_id)

    return ClinicDetailResponse(
        id=clinic_id,
        name=clinic["name"],
        slug=clinic["slug"],
        description=clinic["description"],
        phone=clinic["phone"],
        email=clinic["email"],
        website_url=clinic["website_url"],
        logo_url=clinic["logo_url"],
        address_line1=clinic["address_line1"],
        address_line2=clinic["address_line2"],
        city=clinic["city"],
        state=clinic["state"],
        postal_code=clinic["postal_code"],
        country=clinic["country"],
        latitude=clinic["latitude"],
        longitude=clinic["longitude"],
        timezone=clinic["timezone"],
        cancellation_policy=clinic["cancellation_policy"],
        parking_notes=clinic["parking_notes"],
        accepts_emergency=bool(clinic["accepts_emergency"]),
        home_visit_enabled=bool(clinic["home_visit_enabled"]),
        home_visit_radius_km=float(clinic["home_visit_radius_km"]) if clinic["home_visit_radius_km"] is not None else None,
        hours=[{"day_of_week": h["day_of_week"], "open_time": h["open_time"], "close_time": h["close_time"], "is_closed": h["is_closed"]} for h in hours],
        services=[dict(s) for s in services],
        vets=[dict(v) for v in vets],
        rating_average=rating_average,
        review_count=review_count,
        is_open_now=True,
    )


# =============================================================================
# CLINIC SEARCH & DISCOVERY
# =============================================================================

@router.post(
    "/search",
    response_model=ClinicSearchResponse,
    summary="Search clinics",
    responses={
        200: {"description": "Search results"},
        400: {"description": "Invalid search parameters"},
    }
)
async def search_clinics(
    request: ClinicSearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Search for veterinary clinics by location and filters.
    
    **Search parameters:**
    - **latitude/longitude**: Required. User's location.
    - **radius_km**: Search radius (default: 25km, max: 100km)
    - **service_id**: Filter by specific service
    - **accepts_emergency**: Only show emergency clinics
    - **home_visit_only**: Only show clinics offering home visits
    - **open_now**: Only show currently open clinics
    - **next_available_within_days**: Filter by next available slot
    
    **Example request:**
    ```json
    {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "radius_km": 15,
        "service_id": 1,
        "open_now": true,
        "page": 1,
        "page_size": 20
    }
    ```
    
    **Example response:**
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
                "distance_km": 2.3,
                "accepts_emergency": true,
                "home_visit_enabled": true,
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
    """
    # Basic DB-backed search (distance computed in Python). For production, move to PostGIS.
    params: dict[str, object] = {"is_active": True}
    where = ["c.is_active = :is_active"]

    if request.accepts_emergency is not None:
        where.append("c.accepts_emergency = :accepts_emergency")
        params["accepts_emergency"] = request.accepts_emergency

    if request.home_visit_only is True:
        where.append("c.home_visit_enabled = TRUE")

    if request.service_id is not None:
        where.append(
            "EXISTS (SELECT 1 FROM clinic_services cs WHERE cs.clinic_id = c.id AND cs.service_id = :service_id AND cs.is_active = TRUE)"
        )
        params["service_id"] = request.service_id

    rows = (
        await db.execute(
            text(
                f"""
                SELECT
                  c.id, c.name, c.slug, c.phone,
                  c.address_line1, c.city, c.state, c.postal_code,
                  c.latitude, c.longitude,
                  c.accepts_emergency, c.home_visit_enabled, c.logo_url
                FROM clinics c
                WHERE {" AND ".join(where)}
                """
            ),
            params,
        )
    ).mappings().all()

    # Compute distance & filter by radius
    clinics_scored = []
    for r in rows:
        dist = _haversine_km(request.latitude, request.longitude, float(r["latitude"]), float(r["longitude"]))
        if dist <= request.radius_km:
            clinics_scored.append((dist, r))

    clinics_scored.sort(key=lambda x: x[0])

    total = len(clinics_scored)
    start = (request.page - 1) * request.page_size
    end = start + request.page_size
    page_rows = clinics_scored[start:end]

    # Enrich with rating + next availability (small N so OK)
    clinics_out = []
    for dist, r in page_rows:
        clinic_id = UUID(str(r["id"]))
        rating_average, review_count = await _get_clinic_rating(db, clinic_id)
        next_slot = await _get_next_available_slot(db, clinic_id, request.service_id)

        clinics_out.append(
            {
                "id": clinic_id,
                "name": r["name"],
                "slug": r["slug"],
                "phone": r["phone"],
                "address_line1": r["address_line1"],
                "city": r["city"],
                "state": r["state"],
                "postal_code": r["postal_code"],
                "latitude": r["latitude"],
                "longitude": r["longitude"],
                "distance_km": round(dist, 2),
                "accepts_emergency": bool(r["accepts_emergency"]),
                "home_visit_enabled": bool(r["home_visit_enabled"]),
                "logo_url": r["logo_url"],
                "next_available_slot": next_slot,
                "rating_average": rating_average,
                "review_count": review_count,
                # TODO: compute from clinic_hours + timezone. For now, assume open.
                "is_open_now": True,
            }
        )

    total_pages = max(1, (total + request.page_size - 1) // request.page_size)
    return ClinicSearchResponse(
        clinics=clinics_out,
        total=total,
        page=request.page,
        page_size=request.page_size,
        total_pages=total_pages,
    )


@router.get(
    "/slug/{slug}",
    response_model=ClinicDetailResponse,
    summary="Get clinic details by slug",
    responses={200: {"description": "Clinic details"}, 404: {"description": "Clinic not found"}},
)
async def get_clinic_by_slug(
    slug: str = Path(..., description="Clinic URL slug", example="happy-paws-sf"),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(text("SELECT id FROM clinics WHERE slug = :slug"), {"slug": slug})).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return await _get_clinic_detail(db, UUID(str(row["id"])))


@router.get(
    "/{clinic_id}",
    response_model=ClinicDetailResponse,
    summary="Get clinic details by id",
    responses={
        200: {"description": "Clinic details"},
        404: {"description": "Clinic not found"},
    },
)
async def get_clinic_by_id(
    clinic_id: UUID = Path(..., description="Clinic ID"),
    db: AsyncSession = Depends(get_db),
):
    return await _get_clinic_detail(db, clinic_id)


@router.get(
    "/{clinic_id}/services",
    response_model=List[ServiceResponse],
    summary="Get clinic services",
    responses={
        200: {"description": "List of services"},
        404: {"description": "Clinic not found"},
    }
)
async def get_clinic_services(
    clinic_id: UUID = Path(..., description="Clinic ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all services offered by a specific clinic.
    
    Each service includes:
    - Service details (name, description)
    - Clinic-specific duration
    - Clinic-specific pricing (if available)
    - Whether it supports home visits
    """
    clinic_exists = (
        await db.execute(text("SELECT 1 FROM clinics WHERE id = :id"), {"id": str(clinic_id)})
    ).first()
    if not clinic_exists:
        raise HTTPException(status_code=404, detail="Clinic not found")

    rows = (
        await db.execute(
            text(
                """
                SELECT
                  s.id, s.name, s.slug, s.description,
                  cs.duration_min,
                  cs.price_cents,
                  s.is_emergency,
                  s.supports_home_visit
                FROM clinic_services cs
                JOIN services s ON s.id = cs.service_id
                WHERE cs.clinic_id = :clinic_id AND cs.is_active = TRUE
                ORDER BY s.name
                """
            ),
            {"clinic_id": str(clinic_id)},
        )
    ).mappings().all()
    return [dict(r) for r in rows]

@router.post(
    "/{clinic_id}/services",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add/enable a service for a clinic (Clinic Admin)",
    responses={
        201: {"description": "Service enabled for clinic"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be clinic admin"},
        404: {"description": "Clinic or service not found"},
        409: {"description": "Service already enabled"},
    },
)
async def add_clinic_service(
    request: ProviderServiceUpsertRequest,
    clinic_id: UUID = Depends(require_clinic_admin),
    db: AsyncSession = Depends(get_db),
):
    # Ensure clinic exists (helps return 404 vs FK error messages)
    clinic_exists = (await db.execute(text("SELECT 1 FROM clinics WHERE id = :id"), {"id": str(clinic_id)})).first()
    if not clinic_exists:
        raise HTTPException(status_code=404, detail="Clinic not found")

    # Ensure service exists and active
    svc = (
        await db.execute(
            text(
                """
                SELECT id, name, slug, description, is_emergency, supports_home_visit
                FROM services
                WHERE id = :service_id AND is_active = TRUE
                """
            ),
            {"service_id": request.service_id},
        )
    ).mappings().first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    # Prevent duplicates (unique constraint exists)
    existing = (
        await db.execute(
            text(
                """
                SELECT 1
                FROM clinic_services
                WHERE clinic_id = :clinic_id AND service_id = :service_id
                """
            ),
            {"clinic_id": str(clinic_id), "service_id": request.service_id},
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Service already exists for this clinic. Use PATCH to update.")

    row = (
        await db.execute(
            text(
                """
                INSERT INTO clinic_services (clinic_id, service_id, duration_min, price_cents, is_active, created_at)
                VALUES (:clinic_id, :service_id, :duration_min, :price_cents, :is_active, NOW())
                RETURNING duration_min, price_cents
                """
            ),
            {
                "clinic_id": str(clinic_id),
                "service_id": request.service_id,
                "duration_min": request.duration_min,
                "price_cents": request.price_cents,
                "is_active": request.is_active,
            },
        )
    ).mappings().first()
    await db.commit()

    return {
        "id": svc["id"],
        "name": svc["name"],
        "slug": svc["slug"],
        "description": svc["description"],
        "duration_min": row["duration_min"] if row else request.duration_min,
        "price_cents": row["price_cents"] if row else request.price_cents,
        "is_emergency": bool(svc["is_emergency"]),
        "supports_home_visit": bool(svc["supports_home_visit"]),
    }


@router.patch(
    "/{clinic_id}/services/{service_id}",
    response_model=ServiceResponse,
    summary="Update a clinic service (Clinic Admin)",
    responses={
        200: {"description": "Service updated"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be clinic admin"},
        404: {"description": "Clinic service not found"},
    },
)
async def update_clinic_service(
    service_id: int,
    request: ProviderServiceUpdateRequest,
    clinic_id: UUID = Depends(require_clinic_admin),
    db: AsyncSession = Depends(get_db),
):
    # Fetch service template (needed for response)
    svc = (
        await db.execute(
            text(
                """
                SELECT id, name, slug, description, is_emergency, supports_home_visit
                FROM services
                WHERE id = :service_id
                """
            ),
            {"service_id": service_id},
        )
    ).mappings().first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    # Update row (partial)
    row = (
        await db.execute(
            text(
                """
                UPDATE clinic_services
                SET
                  duration_min = COALESCE(:duration_min, duration_min),
                  price_cents = COALESCE(:price_cents, price_cents),
                  is_active = COALESCE(:is_active, is_active)
                WHERE clinic_id = :clinic_id AND service_id = :service_id
                RETURNING duration_min, price_cents, is_active
                """
            ),
            {
                "clinic_id": str(clinic_id),
                "service_id": service_id,
                "duration_min": request.duration_min,
                "price_cents": request.price_cents,
                "is_active": request.is_active,
            },
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Clinic service not found")
    await db.commit()

    return {
        "id": svc["id"],
        "name": svc["name"],
        "slug": svc["slug"],
        "description": svc["description"],
        "duration_min": row["duration_min"],
        "price_cents": row["price_cents"],
        "is_emergency": bool(svc["is_emergency"]),
        "supports_home_visit": bool(svc["supports_home_visit"]),
    }


@router.delete(
    "/{clinic_id}/services/{service_id}",
    response_model=dict,
    summary="Disable a clinic service (Clinic Admin)",
    responses={
        200: {"description": "Service disabled"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be clinic admin"},
        404: {"description": "Clinic service not found"},
    },
)
async def disable_clinic_service(
    service_id: int,
    clinic_id: UUID = Depends(require_clinic_admin),
    db: AsyncSession = Depends(get_db),
):
    row = (
        await db.execute(
            text(
                """
                UPDATE clinic_services
                SET is_active = FALSE
                WHERE clinic_id = :clinic_id AND service_id = :service_id
                RETURNING id
                """
            ),
            {"clinic_id": str(clinic_id), "service_id": service_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Clinic service not found")
    await db.commit()
    return {"status": "disabled"}


@router.get(
    "/{clinic_id}/vets",
    response_model=List[VetSummaryResponse],
    summary="Get clinic vets",
    responses={
        200: {"description": "List of veterinarians"},
        404: {"description": "Clinic not found"},
    }
)
async def get_clinic_vets(
    clinic_id: UUID = Path(..., description="Clinic ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all veterinarians at a specific clinic.
    """
    clinic_exists = (
        await db.execute(text("SELECT 1 FROM clinics WHERE id = :id"), {"id": str(clinic_id)})
    ).first()
    if not clinic_exists:
        raise HTTPException(status_code=404, detail="Clinic not found")

    rows = (
        await db.execute(
            text(
                """
                SELECT
                  v.id,
                  COALESCE(u.first_name, '') AS first_name,
                  COALESCE(u.last_name, '') AS last_name,
                  v.specialty,
                  v.photo_url,
                  v.is_verified
                FROM clinic_staff cs
                JOIN vets v ON v.id = cs.vet_id
                JOIN users u ON u.id = v.user_id
                WHERE cs.clinic_id = :clinic_id AND cs.vet_id IS NOT NULL AND cs.removed_at IS NULL
                ORDER BY v.is_verified DESC, u.last_name NULLS LAST
                """
            ),
            {"clinic_id": str(clinic_id)},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


# =============================================================================
# VET DETAILS
# =============================================================================

@router.get(
    "/vets/{vet_id}",
    response_model=VetDetailResponse,
    summary="Get vet details",
    responses={
        200: {"description": "Vet details"},
        404: {"description": "Vet not found"},
    }
)
async def get_vet_details(
    vet_id: UUID = Path(..., description="Vet ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get full veterinarian profile.
    
    Includes:
    - Professional info (license, specialty, experience)
    - Bio
    - Clinics where they practice
    - Review summary
    """
    vet = (
        await db.execute(
            text(
                """
                SELECT
                  v.id,
                  v.user_id,
                  COALESCE(u.first_name, '') AS first_name,
                  COALESCE(u.last_name, '') AS last_name,
                  v.license_number,
                  v.license_state,
                  v.specialty,
                  v.years_experience,
                  v.bio,
                  v.photo_url,
                  v.is_verified
                FROM vets v
                JOIN users u ON u.id = v.user_id
                WHERE v.id = :vet_id
                """
            ),
            {"vet_id": str(vet_id)},
        )
    ).mappings().first()
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found")

    clinics = (
        await db.execute(
            text(
                """
                SELECT
                  c.id, c.name, c.slug, c.phone,
                  c.address_line1, c.city, c.state, c.postal_code,
                  c.latitude, c.longitude,
                  c.accepts_emergency, c.home_visit_enabled, c.logo_url
                FROM clinic_staff cs
                JOIN clinics c ON c.id = cs.clinic_id
                WHERE cs.vet_id = :vet_id AND cs.removed_at IS NULL
                ORDER BY c.name
                """
            ),
            {"vet_id": str(vet_id)},
        )
    ).mappings().all()

    clinic_summaries = []
    for c in clinics:
        clinic_id = UUID(str(c["id"]))
        rating_average, review_count = await _get_clinic_rating(db, clinic_id)
        next_slot = await _get_next_available_slot(db, clinic_id, None)
        clinic_summaries.append(
            {
                "id": clinic_id,
                "name": c["name"],
                "slug": c["slug"],
                "phone": c["phone"],
                "address_line1": c["address_line1"],
                "city": c["city"],
                "state": c["state"],
                "postal_code": c["postal_code"],
                "latitude": c["latitude"],
                "longitude": c["longitude"],
                "distance_km": 0.0,
                "accepts_emergency": bool(c["accepts_emergency"]),
                "home_visit_enabled": bool(c["home_visit_enabled"]),
                "logo_url": c["logo_url"],
                "next_available_slot": next_slot,
                "rating_average": rating_average,
                "review_count": review_count,
                "is_open_now": True,
            }
        )

    return VetDetailResponse(
        id=UUID(str(vet["id"])),
        user_id=UUID(str(vet["user_id"])),
        first_name=vet["first_name"],
        last_name=vet["last_name"],
        license_number=vet["license_number"],
        license_state=vet["license_state"],
        specialty=vet["specialty"],
        years_experience=vet["years_experience"],
        bio=vet["bio"],
        photo_url=vet["photo_url"],
        is_verified=bool(vet["is_verified"]),
        clinics=clinic_summaries,
        rating_average=None,
        review_count=0,
    )


# =============================================================================
# REFERENCE DATA
# =============================================================================

@router.get(
    "/services",
    response_model=List[ServiceResponse],
    summary="List all services",
)
async def list_services(
    is_emergency: Optional[bool] = Query(None, description="Filter emergency services"),
    supports_home_visit: Optional[bool] = Query(None, description="Filter home visit services"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all available service types.
    
    Use this to populate service filter dropdowns.
    """
    where = ["is_active = TRUE"]
    params: dict[str, object] = {}
    if is_emergency is not None:
        where.append("is_emergency = :is_emergency")
        params["is_emergency"] = is_emergency
    if supports_home_visit is not None:
        where.append("supports_home_visit = :supports_home_visit")
        params["supports_home_visit"] = supports_home_visit

    rows = (
        await db.execute(
            text(
                f"""
                SELECT id, name, slug, description, default_duration_min, is_emergency, supports_home_visit
                FROM services
                WHERE {" AND ".join(where)}
                ORDER BY name
                """
            ),
            params,
        )
    ).mappings().all()

    return [
        {
            "id": r["id"],
            "name": r["name"],
            "slug": r["slug"],
            "description": r["description"],
            "duration_min": r["default_duration_min"],
            "price_cents": None,
            "is_emergency": bool(r["is_emergency"]),
            "supports_home_visit": bool(r["supports_home_visit"]),
        }
        for r in rows
    ]


@router.get(
    "/species",
    response_model=List[SpeciesResponse],
    summary="List all species",
)
async def list_species(
    db: AsyncSession = Depends(get_db),
):
    """
    List all supported pet species.
    """
    rows = (
        await db.execute(
            text("SELECT id, name FROM species WHERE is_active = TRUE ORDER BY name")
        )
    ).mappings().all()
    return [dict(r) for r in rows]


@router.get(
    "/species/{species_id}/breeds",
    response_model=List[BreedResponse],
    summary="List breeds for species",
    responses={
        200: {"description": "List of breeds"},
        404: {"description": "Species not found"},
    }
)
async def list_breeds(
    species_id: int = Path(..., description="Species ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all breeds for a specific species.
    """
    exists = (
        await db.execute(text("SELECT 1 FROM species WHERE id = :id AND is_active = TRUE"), {"id": species_id})
    ).first()
    if not exists:
        raise HTTPException(status_code=404, detail="Species not found")

    rows = (
        await db.execute(
            text("SELECT id, species_id, name FROM breeds WHERE species_id = :species_id ORDER BY name"),
            {"species_id": species_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]

