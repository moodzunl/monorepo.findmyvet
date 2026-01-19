"""
Provider Applications

POST   /api/v1/provider-applications          - Submit an application (pending)
GET    /api/v1/provider-applications/me       - Get current user's latest application
POST   /api/v1/provider-applications/{id}/decision - Approve/reject (team use; API key protected)
"""

from __future__ import annotations

import json
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.db import get_db
from app.models.user import User
from app.schemas.provider_applications import (
    ProviderApplicationCreateRequest,
    ProviderApplicationDecisionRequest,
    ProviderApplicationMeResponse,
    ProviderApplicationOut,
    ProviderApplicationStatus,
)
from app.security.current_user import get_current_user


router = APIRouter()


def _require_review_key(
    settings: Settings,
    x_provider_review_key: str | None,
) -> None:
    expected = settings.provider_review_api_key
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reviewer API key not configured.",
        )
    if not x_provider_review_key or x_provider_review_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid reviewer API key.",
        )


def _row_to_out(row: Any) -> ProviderApplicationOut:
    # `data` can be returned as dict already (asyncpg jsonb) or as string depending on driver.
    data_val = row["data"]
    if isinstance(data_val, str):
        try:
            data_val = json.loads(data_val)
        except Exception:
            data_val = {}

    return ProviderApplicationOut(
        id=row["id"],
        user_id=row["user_id"],
        provider_type=row["provider_type"],
        status=row["status"],
        data=data_val or {},
        submitted_at=row["submitted_at"],
        reviewed_at=row["reviewed_at"],
        rejection_reason=row["rejection_reason"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.post(
    "",
    response_model=ProviderApplicationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit provider application",
)
async def submit_application(
    request: ProviderApplicationCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Prevent multiple pending applications per user.
    existing = (
        await db.execute(
            text(
                """
                SELECT id
                FROM provider_applications
                WHERE user_id = :user_id AND status = 'pending'
                ORDER BY created_at DESC
                LIMIT 1
                """
            ),
            {"user_id": str(user.id)},
        )
    ).mappings().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending application.",
        )

    payload = json.dumps(request.data or {})
    row = (
        await db.execute(
            text(
                """
                INSERT INTO provider_applications (
                  user_id, provider_type, status, data, submitted_at, created_at, updated_at
                ) VALUES (
                  :user_id, :provider_type, 'pending', CAST(:data AS JSONB), NOW(), NOW(), NOW()
                )
                RETURNING
                  id, user_id, provider_type, status, data,
                  submitted_at, reviewed_at, rejection_reason,
                  created_at, updated_at
                """
            ),
            {
                "user_id": str(user.id),
                "provider_type": request.provider_type.value,
                "data": payload,
            },
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to submit application")
    await db.commit()
    return _row_to_out(row)


@router.get(
    "/me",
    response_model=ProviderApplicationMeResponse,
    summary="Get my provider application",
)
async def get_my_application(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        await db.execute(
            text(
                """
                SELECT
                  id, user_id, provider_type, status, data,
                  submitted_at, reviewed_at, rejection_reason,
                  created_at, updated_at
                FROM provider_applications
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 1
                """
            ),
            {"user_id": str(user.id)},
        )
    ).mappings().first()

    return ProviderApplicationMeResponse(application=_row_to_out(row) if row else None)


@router.post(
    "/{application_id}/decision",
    response_model=ProviderApplicationOut,
    summary="Approve/reject an application (team review)",
)
async def decide_application(
    application_id: str,
    request: ProviderApplicationDecisionRequest,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
    x_provider_review_key: Annotated[str | None, Header()] = None,
):
    _require_review_key(settings, x_provider_review_key)

    if request.decision == ProviderApplicationStatus.rejected and not request.rejection_reason:
        raise HTTPException(status_code=400, detail="rejection_reason is required when rejecting.")

    row = (
        await db.execute(
            text(
                """
                UPDATE provider_applications
                SET
                  status = :status,
                  rejection_reason = :rejection_reason,
                  reviewed_at = NOW(),
                  updated_at = NOW()
                WHERE id = :id
                RETURNING
                  id, user_id, provider_type, status, data,
                  submitted_at, reviewed_at, rejection_reason,
                  created_at, updated_at
                """
            ),
            {
                "id": application_id,
                "status": request.decision.value,
                "rejection_reason": request.rejection_reason,
            },
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.commit()
    return _row_to_out(row)


