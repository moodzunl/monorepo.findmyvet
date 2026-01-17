"""
Provider capability endpoints.

These endpoints answer: "Is the current user a provider, and what can they manage?"
This is intentionally separate from the provider application flow, because verified
accounts may exist without a `provider_applications` record (e.g., backfilled/admin-created).
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.user import User
from app.schemas.providers import ProviderMeResponse
from app.security.current_user import get_current_user


router = APIRouter()


@router.get(
    "/me",
    response_model=ProviderMeResponse,
    summary="Get my provider capabilities",
)
async def get_provider_me(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    vet_row = (
        await db.execute(
            text(
                """
                SELECT id, is_verified, is_freelancer
                FROM vets
                WHERE user_id = :user_id
                """
            ),
            {"user_id": str(user.id)},
        )
    ).mappings().first()

    has_vet_profile = bool(vet_row)
    vet_id: UUID | None = UUID(str(vet_row["id"])) if vet_row else None
    vet_is_verified = bool(vet_row["is_verified"]) if vet_row else False
    vet_is_freelancer = bool(vet_row["is_freelancer"]) if vet_row else False
    can_manage_vet_services = bool(vet_row) and vet_is_verified and vet_is_freelancer

    clinics = (
        await db.execute(
            text(
                """
                SELECT c.id, c.name
                FROM clinic_staff cs
                JOIN clinics c ON c.id = cs.clinic_id
                WHERE cs.user_id = :user_id
                  AND cs.role = 'admin'
                  AND cs.removed_at IS NULL
                ORDER BY c.name
                """
            ),
            {"user_id": str(user.id)},
        )
    ).mappings().all()

    return ProviderMeResponse(
        has_vet_profile=has_vet_profile,
        vet_id=vet_id,
        vet_is_verified=vet_is_verified,
        vet_is_freelancer=vet_is_freelancer,
        can_manage_vet_services=can_manage_vet_services,
        clinic_admin_clinics=[{"id": UUID(str(c["id"])), "name": c["name"]} for c in clinics],
    )


