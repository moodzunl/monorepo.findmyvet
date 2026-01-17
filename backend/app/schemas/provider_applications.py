"""
Provider application schemas.

This supports the "Upgrade to Vet/Clinic" flow:
- user submits an application (status=pending)
- team reviews and approves/rejects
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ProviderType(str, Enum):
    vet = "vet"
    clinic = "clinic"


class ProviderApplicationStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ProviderApplicationCreateRequest(BaseModel):
    provider_type: ProviderType
    data: dict[str, Any] = Field(default_factory=dict)


class ProviderApplicationDecisionRequest(BaseModel):
    decision: ProviderApplicationStatus = Field(..., description="approved|rejected")
    rejection_reason: str | None = Field(None, max_length=2000)


class ProviderApplicationOut(BaseModel):
    id: UUID
    user_id: UUID
    provider_type: ProviderType
    status: ProviderApplicationStatus
    data: dict[str, Any]
    submitted_at: datetime
    reviewed_at: datetime | None
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime


class ProviderApplicationMeResponse(BaseModel):
    application: ProviderApplicationOut | None


