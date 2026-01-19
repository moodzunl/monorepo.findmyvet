"""
Provider access control helpers.

- Clinic service management is restricted to clinic admins (clinic_staff.role='admin').
- Vet service management is restricted to verified freelancer vets (vets.is_verified AND vets.is_freelancer).
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.user import User
from app.security.current_user import get_current_user


async def require_clinic_admin(
    clinic_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UUID:
    """
    Raises 403 unless the current user is an active admin staff member for the given clinic.
    """
    row = (
        await db.execute(
            text(
                """
                SELECT 1
                FROM clinic_staff cs
                WHERE cs.clinic_id = :clinic_id
                  AND cs.user_id = :user_id
                  AND cs.role = 'admin'
                  AND cs.removed_at IS NULL
                """
            ),
            {"clinic_id": str(clinic_id), "user_id": str(user.id)},
        )
    ).first()

    if not row:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinic admin access required.")
    return clinic_id


async def require_verified_freelancer_vet(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UUID:
    """
    Returns the vet_id for the current user if they are a verified freelancer vet.
    Raises 403 otherwise.
    """
    vet = (
        await db.execute(
            text(
                """
                SELECT id
                FROM vets
                WHERE user_id = :user_id AND is_verified = TRUE AND is_freelancer = TRUE
                """
            ),
            {"user_id": str(user.id)},
        )
    ).mappings().first()

    if not vet:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verified freelancer vet access required.",
        )
    return UUID(str(vet["id"]))


