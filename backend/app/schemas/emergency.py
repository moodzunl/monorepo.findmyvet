"""
Emergency Mode Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, time
from uuid import UUID
from decimal import Decimal
from enum import Enum


class EmergencyFlagType(str, Enum):
    accepting_emergency = "accepting_emergency"
    at_capacity = "at_capacity"
    closed_emergency = "closed_emergency"


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class EmergencySearchRequest(BaseModel):
    """Search for emergency clinics."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=50, ge=1, le=150)  # Larger radius for emergencies
    open_now: bool = Field(default=True)
    species_id: Optional[int] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=50)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "latitude": 37.7749,
                "longitude": -122.4194,
                "radius_km": 30,
                "open_now": True,
                "species_id": 1,
                "page": 1,
                "page_size": 20
            }
        }
    }


class EmergencyFlagCreateRequest(BaseModel):
    """Set emergency flag for a clinic (clinic admin only)."""
    flag_type: EmergencyFlagType
    message: Optional[str] = Field(None, max_length=500)
    expires_in_hours: Optional[int] = Field(None, ge=1, le=24)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "flag_type": "at_capacity",
                "message": "Currently experiencing high volume. Expected wait: 2-3 hours.",
                "expires_in_hours": 4
            }
        }
    }


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class EmergencyClinicResponse(BaseModel):
    """Emergency clinic result optimized for quick action."""
    id: UUID
    name: str
    phone: str  # Prominent for call-first
    address_line1: str
    city: str
    state: str
    postal_code: str
    latitude: Decimal
    longitude: Decimal
    distance_km: float
    is_open_now: bool
    opens_at: Optional[time]  # If closed, when does it open?
    closes_at: Optional[time]  # When does it close today?
    hours_confirmed: bool  # True if we have verified hours
    emergency_flag: Optional[EmergencyFlagType]
    emergency_message: Optional[str]
    wait_time_estimate: Optional[str]  # If available
    
    # Directions helper
    directions_url: str  # Google Maps URL
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "770e8400-e29b-41d4-a716-446655440002",
                "name": "SF Emergency Vet Hospital",
                "phone": "+1-415-555-9999",
                "address_line1": "456 Emergency Lane",
                "city": "San Francisco",
                "state": "CA",
                "postal_code": "94103",
                "latitude": "37.7751",
                "longitude": "-122.4180",
                "distance_km": 1.2,
                "is_open_now": True,
                "opens_at": None,
                "closes_at": None,  # 24 hours
                "hours_confirmed": True,
                "emergency_flag": "accepting_emergency",
                "emergency_message": None,
                "wait_time_estimate": "~45 minutes",
                "directions_url": "https://www.google.com/maps/dir/?api=1&destination=37.7751,-122.4180"
            }
        }
    }


class EmergencySearchResponse(BaseModel):
    """Emergency clinic search results."""
    clinics: List[EmergencyClinicResponse]
    total: int
    search_radius_km: float
    disclaimer: str = "This is not a substitute for professional veterinary advice. If your pet is in immediate danger, call the nearest clinic now."
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "clinics": [],
                "total": 5,
                "search_radius_km": 30,
                "disclaimer": "This is not a substitute for professional veterinary advice. If your pet is in immediate danger, call the nearest clinic now."
            }
        }
    }


class EmergencyFlagResponse(BaseModel):
    """Emergency flag details."""
    id: UUID
    clinic_id: UUID
    flag_type: EmergencyFlagType
    message: Optional[str]
    started_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
    created_by_name: str
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "cc0e8400-e29b-41d4-a716-446655440009",
                "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
                "flag_type": "at_capacity",
                "message": "Currently experiencing high volume. Expected wait: 2-3 hours.",
                "started_at": "2024-01-16T18:00:00Z",
                "expires_at": "2024-01-16T22:00:00Z",
                "is_active": True,
                "created_by_name": "Admin User"
            }
        }
    }


class EmergencyGuidanceResponse(BaseModel):
    """General emergency guidance (not medical advice)."""
    title: str
    description: str
    call_to_action: str
    symptoms: List[str]
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Signs that require immediate veterinary care",
                "description": "If your pet shows any of these symptoms, please call an emergency vet immediately.",
                "call_to_action": "Call the nearest emergency clinic",
                "symptoms": [
                    "Difficulty breathing or choking",
                    "Severe bleeding that won't stop",
                    "Inability to urinate or defecate",
                    "Seizures",
                    "Loss of consciousness",
                    "Suspected poisoning",
                    "Severe trauma (hit by car, fall, etc.)",
                    "Distended or bloated abdomen",
                    "Sudden collapse or inability to stand"
                ]
            }
        }
    }

