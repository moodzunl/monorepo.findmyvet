"""
Clinic and Vet Schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import time, datetime
from uuid import UUID
from decimal import Decimal
from enum import Enum


class DayOfWeek(int, Enum):
    sunday = 0
    monday = 1
    tuesday = 2
    wednesday = 3
    thursday = 4
    friday = 5
    saturday = 6


# =============================================================================
# CLINIC SEARCH / DISCOVERY
# =============================================================================

class ClinicSearchRequest(BaseModel):
    """Search clinics by location and filters."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=25, ge=1, le=100)
    service_id: Optional[int] = None
    accepts_emergency: Optional[bool] = None
    home_visit_only: Optional[bool] = None
    open_now: Optional[bool] = None
    next_available_within_days: Optional[int] = Field(None, ge=1, le=30)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=50)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "latitude": 37.7749,
                "longitude": -122.4194,
                "radius_km": 15,
                "service_id": 1,
                "accepts_emergency": False,
                "open_now": True,
                "page": 1,
                "page_size": 20
            }
        }
    }


class ClinicHoursResponse(BaseModel):
    """Clinic operating hours for a day."""
    day_of_week: DayOfWeek
    open_time: time
    close_time: time
    is_closed: bool
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "day_of_week": 1,
                "open_time": "08:00:00",
                "close_time": "18:00:00",
                "is_closed": False
            }
        }
    }


class ServiceResponse(BaseModel):
    """Service offered by a clinic."""
    id: int
    name: str
    slug: str
    description: Optional[str]
    duration_min: int
    price_cents: Optional[int]
    is_emergency: bool
    supports_home_visit: bool
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 1,
                "name": "General Exam",
                "slug": "general-exam",
                "description": "Routine wellness checkup and physical examination",
                "duration_min": 30,
                "price_cents": 7500,
                "is_emergency": False,
                "supports_home_visit": True
            }
        }
    }


class VetSummaryResponse(BaseModel):
    """Brief vet info for clinic listing."""
    id: UUID
    first_name: str
    last_name: str
    specialty: Optional[str]
    photo_url: Optional[str]
    is_verified: bool


class ClinicSummaryResponse(BaseModel):
    """Clinic summary for search results."""
    id: UUID
    name: str
    slug: str
    phone: str
    address_line1: str
    city: str
    state: str
    postal_code: str
    latitude: Decimal
    longitude: Decimal
    distance_km: float
    accepts_emergency: bool
    home_visit_enabled: bool
    logo_url: Optional[str]
    next_available_slot: Optional[datetime]
    rating_average: Optional[float]
    review_count: int
    is_open_now: bool
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "770e8400-e29b-41d4-a716-446655440002",
                "name": "Happy Paws Veterinary Clinic",
                "slug": "happy-paws-sf",
                "phone": "+1-415-555-1234",
                "address_line1": "123 Pet Street",
                "city": "San Francisco",
                "state": "CA",
                "postal_code": "94102",
                "latitude": "37.7749295",
                "longitude": "-122.4194155",
                "distance_km": 2.3,
                "accepts_emergency": True,
                "home_visit_enabled": True,
                "logo_url": "https://cdn.findmyvet.com/clinics/770e8400/logo.jpg",
                "next_available_slot": "2024-01-16T09:00:00Z",
                "rating_average": 4.7,
                "review_count": 156,
                "is_open_now": True
            }
        }
    }


class ClinicSearchResponse(BaseModel):
    """Paginated clinic search results."""
    clinics: List[ClinicSummaryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClinicDetailResponse(BaseModel):
    """Full clinic details."""
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    phone: str
    email: Optional[EmailStr]
    website_url: Optional[str]
    logo_url: Optional[str]
    address_line1: str
    address_line2: Optional[str]
    city: str
    state: str
    postal_code: str
    country: str
    latitude: Decimal
    longitude: Decimal
    timezone: str
    cancellation_policy: Optional[str]
    parking_notes: Optional[str]
    accepts_emergency: bool
    home_visit_enabled: bool
    home_visit_radius_km: Optional[float]
    hours: List[ClinicHoursResponse]
    services: List[ServiceResponse]
    vets: List[VetSummaryResponse]
    rating_average: Optional[float]
    review_count: int
    is_open_now: bool
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "770e8400-e29b-41d4-a716-446655440002",
                "name": "Happy Paws Veterinary Clinic",
                "slug": "happy-paws-sf",
                "description": "Full-service veterinary clinic serving San Francisco since 2010.",
                "phone": "+1-415-555-1234",
                "email": "hello@happypawsvet.com",
                "website_url": "https://happypawsvet.com",
                "logo_url": "https://cdn.findmyvet.com/clinics/770e8400/logo.jpg",
                "address_line1": "123 Pet Street",
                "address_line2": "Suite 100",
                "city": "San Francisco",
                "state": "CA",
                "postal_code": "94102",
                "country": "US",
                "latitude": "37.7749295",
                "longitude": "-122.4194155",
                "timezone": "America/Los_Angeles",
                "cancellation_policy": "Please cancel at least 24 hours in advance to avoid a $25 fee.",
                "parking_notes": "Free parking available behind the building.",
                "accepts_emergency": True,
                "home_visit_enabled": True,
                "home_visit_radius_km": 15.0,
                "hours": [
                    {"day_of_week": 1, "open_time": "08:00:00", "close_time": "18:00:00", "is_closed": False}
                ],
                "services": [
                    {"id": 1, "name": "General Exam", "slug": "general-exam", "description": "Routine wellness checkup", "duration_min": 30, "price_cents": 7500, "is_emergency": False, "supports_home_visit": True}
                ],
                "vets": [
                    {"id": "880e8400-e29b-41d4-a716-446655440003", "first_name": "Sarah", "last_name": "Johnson", "specialty": "General Practice", "photo_url": None, "is_verified": True}
                ],
                "rating_average": 4.7,
                "review_count": 156,
                "is_open_now": True
            }
        }
    }


# =============================================================================
# VET DETAILS
# =============================================================================

class VetDetailResponse(BaseModel):
    """Full vet profile."""
    id: UUID
    user_id: UUID
    first_name: str
    last_name: str
    license_number: Optional[str]
    license_state: Optional[str]
    specialty: Optional[str]
    years_experience: Optional[int]
    bio: Optional[str]
    photo_url: Optional[str]
    is_verified: bool
    clinics: List[ClinicSummaryResponse]
    rating_average: Optional[float]
    review_count: int

