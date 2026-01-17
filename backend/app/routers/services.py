"""
Service catalog endpoints.

The global catalog lives in the `services` table (platform-managed templates).
Providers enable items from this catalog via `clinic_services` and `vet_services`.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.clinics import ServiceResponse

router = APIRouter()


@router.get(
    "",
    response_model=List[ServiceResponse],
    summary="List all services (global catalog)",
)
async def list_services(
    is_emergency: Optional[bool] = Query(None, description="Filter emergency services"),
    supports_home_visit: Optional[bool] = Query(None, description="Filter home visit services"),
    db: AsyncSession = Depends(get_db),
):
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

    # Shape matches `ServiceResponse` but global catalog has no provider price override.
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


