"""
Provider capability schemas.

Used by the frontend to decide whether the current user can manage provider features
without relying on a provider application record existing.
"""

from __future__ import annotations

from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class ClinicAdminClinic(BaseModel):
    id: UUID
    name: str


class ProviderMeResponse(BaseModel):
    has_vet_profile: bool
    vet_id: Optional[UUID] = None
    vet_is_verified: bool
    vet_is_freelancer: bool
    can_manage_vet_services: bool
    clinic_admin_clinics: list[ClinicAdminClinic]


