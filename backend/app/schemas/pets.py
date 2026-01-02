"""
Pet schemas (API requests aligned with the current onboarding UI).
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


class PetCreateRequest(BaseModel):
    """Create a pet using human-friendly species/breed names from the UI."""

    name: str = Field(..., min_length=1, max_length=100)
    species_name: str = Field(..., min_length=1, max_length=50)
    breed_name: Optional[str] = Field(None, max_length=100)
    date_of_birth: Optional[date] = None
    weight_kg: Optional[float] = Field(None, ge=0, le=1000)
    sex: Optional[str] = Field(None, description="male|female|unknown")
    is_neutered: Optional[bool] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)


class SpeciesOut(BaseModel):
    id: int
    name: str


class BreedOut(BaseModel):
    id: int
    species_id: int
    name: str


class PetOut(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    species: SpeciesOut
    breed: Optional[BreedOut]
    date_of_birth: Optional[date]
    weight_kg: Optional[float]
    sex: Optional[str]
    is_neutered: Optional[bool]
    photo_url: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class PetListResponse(BaseModel):
    pets: List[PetOut]


