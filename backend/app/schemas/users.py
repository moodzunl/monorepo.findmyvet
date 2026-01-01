"""
User and Pet Schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
from enum import Enum


class PetSex(str, Enum):
    male = "male"
    female = "female"
    unknown = "unknown"


# =============================================================================
# PET SCHEMAS
# =============================================================================

class PetCreate(BaseModel):
    """Create a new pet profile."""
    name: str = Field(..., min_length=1, max_length=100)
    species_id: int
    breed_id: Optional[int] = None
    date_of_birth: Optional[date] = None
    weight_kg: Optional[float] = Field(None, ge=0, le=1000)
    sex: Optional[PetSex] = None
    is_neutered: Optional[bool] = None
    notes: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Buddy",
                "species_id": 1,
                "breed_id": 5,
                "date_of_birth": "2020-06-15",
                "weight_kg": 25.5,
                "sex": "male",
                "is_neutered": True,
                "notes": "Allergic to chicken. Friendly but nervous at vet."
            }
        }
    }


class PetUpdate(BaseModel):
    """Update pet profile."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    breed_id: Optional[int] = None
    date_of_birth: Optional[date] = None
    weight_kg: Optional[float] = Field(None, ge=0, le=1000)
    sex: Optional[PetSex] = None
    is_neutered: Optional[bool] = None
    notes: Optional[str] = None


class SpeciesResponse(BaseModel):
    """Animal species."""
    id: int
    name: str


class BreedResponse(BaseModel):
    """Breed within a species."""
    id: int
    species_id: int
    name: str


class PetResponse(BaseModel):
    """Pet profile response."""
    id: UUID
    owner_id: UUID
    name: str
    species: SpeciesResponse
    breed: Optional[BreedResponse]
    date_of_birth: Optional[date]
    weight_kg: Optional[float]
    sex: Optional[PetSex]
    is_neutered: Optional[bool]
    photo_url: Optional[str]
    notes: Optional[str]
    created_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "660e8400-e29b-41d4-a716-446655440001",
                "owner_id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Buddy",
                "species": {"id": 1, "name": "Dog"},
                "breed": {"id": 5, "name": "Golden Retriever", "species_id": 1},
                "date_of_birth": "2020-06-15",
                "weight_kg": 25.5,
                "sex": "male",
                "is_neutered": True,
                "photo_url": "https://cdn.findmyvet.com/pets/660e8400.jpg",
                "notes": "Allergic to chicken. Friendly but nervous at vet.",
                "created_at": "2024-01-15T10:30:00Z"
            }
        }
    }


# =============================================================================
# USER PROFILE SCHEMAS
# =============================================================================

class UserProfileUpdate(BaseModel):
    """Update user profile."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    timezone: Optional[str] = Field(None, max_length=50)


class UserProfileResponse(BaseModel):
    """Full user profile with pets."""
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str]
    avatar_url: Optional[str]
    email_verified: bool
    phone_verified: bool
    timezone: str
    pets: List[PetResponse]
    created_at: datetime

