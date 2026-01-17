"""
Vet Endpoints

Supports:
- Public: list a vet's offered services (freelancer vets)
- Authenticated: verified freelancer vets manage their own service menu
"""

from __future__ import annotations

from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.clinics import ServiceResponse
from app.schemas.provider_services import ProviderServiceUpsertRequest, ProviderServiceUpdateRequest
from app.security.provider_access import require_verified_freelancer_vet

router = APIRouter()


@router.get(
    "/me/services",
    response_model=List[ServiceResponse],
    summary="Get my freelancer vet services",
    responses={
        200: {"description": "List of services"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be a verified freelancer vet"},
    },
)
async def get_my_vet_services(
    vet_id: UUID = Depends(require_verified_freelancer_vet),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            text(
                """
                SELECT
                  s.id, s.name, s.slug, s.description,
                  vs.duration_min,
                  vs.price_cents,
                  s.is_emergency,
                  s.supports_home_visit
                FROM vet_services vs
                JOIN services s ON s.id = vs.service_id
                WHERE vs.vet_id = :vet_id
                ORDER BY s.name
                """
            ),
            {"vet_id": str(vet_id)},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


@router.post(
    "/me/services",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add/enable a service for me (Verified freelancer vet)",
    responses={
        201: {"description": "Service enabled"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be a verified freelancer vet"},
        404: {"description": "Service not found"},
        409: {"description": "Service already enabled"},
    },
)
async def add_my_vet_service(
    request: ProviderServiceUpsertRequest,
    vet_id: UUID = Depends(require_verified_freelancer_vet),
    db: AsyncSession = Depends(get_db),
):
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

    existing = (
        await db.execute(
            text(
                """
                SELECT 1
                FROM vet_services
                WHERE vet_id = :vet_id AND service_id = :service_id
                """
            ),
            {"vet_id": str(vet_id), "service_id": request.service_id},
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Service already exists for this vet. Use PATCH to update.")

    row = (
        await db.execute(
            text(
                """
                INSERT INTO vet_services (vet_id, service_id, duration_min, price_cents, is_active, created_at)
                VALUES (:vet_id, :service_id, :duration_min, :price_cents, :is_active, NOW())
                RETURNING duration_min, price_cents
                """
            ),
            {
                "vet_id": str(vet_id),
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
    "/me/services/{service_id}",
    response_model=ServiceResponse,
    summary="Update my service (Verified freelancer vet)",
    responses={
        200: {"description": "Service updated"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be a verified freelancer vet"},
        404: {"description": "Vet service not found"},
    },
)
async def update_my_vet_service(
    service_id: int,
    request: ProviderServiceUpdateRequest,
    vet_id: UUID = Depends(require_verified_freelancer_vet),
    db: AsyncSession = Depends(get_db),
):
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

    row = (
        await db.execute(
            text(
                """
                UPDATE vet_services
                SET
                  duration_min = COALESCE(:duration_min, duration_min),
                  price_cents = COALESCE(:price_cents, price_cents),
                  is_active = COALESCE(:is_active, is_active)
                WHERE vet_id = :vet_id AND service_id = :service_id
                RETURNING duration_min, price_cents, is_active
                """
            ),
            {
                "vet_id": str(vet_id),
                "service_id": service_id,
                "duration_min": request.duration_min,
                "price_cents": request.price_cents,
                "is_active": request.is_active,
            },
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Vet service not found")
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
    "/me/services/{service_id}",
    response_model=dict,
    summary="Disable my service (Verified freelancer vet)",
)
async def disable_my_vet_service(
    service_id: int,
    vet_id: UUID = Depends(require_verified_freelancer_vet),
    db: AsyncSession = Depends(get_db),
):
    row = (
        await db.execute(
            text(
                """
                UPDATE vet_services
                SET is_active = FALSE
                WHERE vet_id = :vet_id AND service_id = :service_id
                RETURNING id
                """
            ),
            {"vet_id": str(vet_id), "service_id": service_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Vet service not found")
    await db.commit()
    return {"status": "disabled"}


@router.get(
    "/{vet_id}/services",
    response_model=List[ServiceResponse],
    summary="Get freelancer vet services",
    responses={200: {"description": "List of services"}, 404: {"description": "Vet not found"}},
)
async def get_vet_services(
    vet_id: UUID = Path(..., description="Vet ID"),
    db: AsyncSession = Depends(get_db),
):
    # NOTE: Keep this route AFTER `/me/...` routes to avoid treating `me` as a UUID.
    vet_exists = (await db.execute(text("SELECT 1 FROM vets WHERE id = :id"), {"id": str(vet_id)})).first()
    if not vet_exists:
        raise HTTPException(status_code=404, detail="Vet not found")

    rows = (
        await db.execute(
            text(
                """
                SELECT
                  s.id, s.name, s.slug, s.description,
                  vs.duration_min,
                  vs.price_cents,
                  s.is_emergency,
                  s.supports_home_visit
                FROM vet_services vs
                JOIN services s ON s.id = vs.service_id
                WHERE vs.vet_id = :vet_id AND vs.is_active = TRUE
                ORDER BY s.name
                """
            ),
            {"vet_id": str(vet_id)},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


