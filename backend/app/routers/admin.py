"""
Admin Router
endpoints:
 GET /api/v1/admin/stats
 GET /api/v1/admin/users
 GET /api/v1/admin/vets
 GET /api/v1/admin/clinics
 GET /api/v1/admin/provider-applications
 POST /api/v1/admin/provider-applications/{id}/decision
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.user import User
from app.schemas.provider_applications import (
    ProviderApplicationOut,
    ProviderApplicationDecisionRequest,
    ProviderApplicationStatus,
)
from app.security.admin import require_admin
from app.routers.provider_applications import _row_to_out

router = APIRouter()

@router.get(
    "/stats",
    summary="Get platform statistics (Admin)",
)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Returns counts for dashboard widgets.
    """
    stats = {}
    
    # Total Users
    stats["users_count"] = (
        await db.execute(text("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"))
    ).scalar()
    
    # Verified Vets
    stats["vets_count"] = (
        await db.execute(text("SELECT COUNT(*) FROM vets WHERE is_verified = TRUE"))
    ).scalar()
    
    # Active Clinics
    stats["clinics_count"] = (
        await db.execute(text("SELECT COUNT(*) FROM clinics WHERE is_active = TRUE"))
    ).scalar()
    
    # Pending Applications
    stats["pending_applications"] = (
        await db.execute(text("SELECT COUNT(*) FROM provider_applications WHERE status = 'pending'"))
    ).scalar()

    return stats

@router.get(
    "/users",
    summary="List all users (Admin)",
    description="Returns a list of all users."
)
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
    limit: int = 50,
    offset: int = 0,
):
    rows = (
        await db.execute(
            text(
                """
                SELECT id, email, first_name, last_name, created_at, clerk_user_id
                FROM users
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
                """
            ),
            {"limit": limit, "offset": offset},
        )
    ).mappings().all()
    
    return [dict(row) for row in rows]

@router.get(
    "/vets",
    summary="List verified vets (Admin)",
)
async def list_vets(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
    limit: int = 50,
    offset: int = 0,
):
    rows = (
        await db.execute(
            text(
                """
                SELECT v.id, v.license_number, v.specialty, u.email, u.first_name, u.last_name
                FROM vets v
                JOIN users u ON u.id = v.user_id
                WHERE v.is_verified = TRUE
                ORDER BY v.created_at DESC
                LIMIT :limit OFFSET :offset
                """
            ),
            {"limit": limit, "offset": offset},
        )
    ).mappings().all()
    
    return [dict(row) for row in rows]

@router.get(
    "/clinics",
    summary="List active clinics (Admin)",
)
async def list_clinics(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
    limit: int = 50,
    offset: int = 0,
):
    rows = (
        await db.execute(
            text(
                """
                SELECT id, name, city, state, phone, created_at
                FROM clinics
                WHERE is_active = TRUE
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
                """
            ),
            {"limit": limit, "offset": offset},
        )
    ).mappings().all()
    
    return [dict(row) for row in rows]

@router.get(
    "/provider-applications",
    response_model=list[ProviderApplicationOut],
    summary="List provider applications (Admin)",
)
async def list_applications(
    status: ProviderApplicationStatus | None = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = """
        SELECT
          id, user_id, provider_type, status, data,
          submitted_at, reviewed_at, rejection_reason,
          created_at, updated_at
        FROM provider_applications
    """
    params = {}
    
    if status:
        query += " WHERE status = :status"
        params["status"] = status.value
    
    query += " ORDER BY created_at DESC"
    
    rows = (
        await db.execute(text(query), params)
    ).mappings().all()
    
    return [_row_to_out(row) for row in rows]

@router.post(
    "/provider-applications/{application_id}/decision",
    response_model=ProviderApplicationOut,
    summary="Approve/reject an application (Admin)",
)
async def admin_decide_application(
    application_id: str,
    request: ProviderApplicationDecisionRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if request.decision == ProviderApplicationStatus.rejected and not request.rejection_reason:
        raise HTTPException(status_code=400, detail="rejection_reason is required when rejecting.")

    now = datetime.utcnow()
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
                "now": now,
            },
        )
    ).mappings().first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
        
    await db.commit()
    return _row_to_out(row)
