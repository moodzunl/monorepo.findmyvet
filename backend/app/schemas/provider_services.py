"""
Provider service management schemas.

We keep the global catalog in `services` and allow providers (clinics and freelancer vets)
to "enable" a service with provider-specific overrides like duration and price.
"""

from pydantic import BaseModel, Field
from typing import Optional


class ProviderServiceUpsertRequest(BaseModel):
    """
    Enable or update a provider-specific offering for a service in the global catalog.
    """

    service_id: int = Field(..., ge=1, description="Global service catalog id")
    duration_min: int = Field(..., ge=5, le=24 * 60, description="Duration in minutes")
    price_cents: Optional[int] = Field(None, ge=0, description="Optional starting price in cents")
    is_active: bool = Field(True, description="Whether the provider currently offers this service")


class ProviderServiceUpdateRequest(BaseModel):
    """
    Partial update for a provider-specific offering.
    """

    duration_min: Optional[int] = Field(None, ge=5, le=24 * 60, description="Duration in minutes")
    price_cents: Optional[int] = Field(None, ge=0, description="Optional starting price in cents")
    is_active: Optional[bool] = Field(None, description="Whether the provider currently offers this service")


