"""
Appointment and Availability Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime
from uuid import UUID
from enum import Enum


class AppointmentType(str, Enum):
    in_person = "in_person"
    home_visit = "home_visit"


class AppointmentStatus(str, Enum):
    booked = "booked"
    rescheduled = "rescheduled"
    cancelled_by_owner = "cancelled_by_owner"
    cancelled_by_clinic = "cancelled_by_clinic"
    no_show = "no_show"
    completed = "completed"


class SlotType(str, Enum):
    in_person = "in_person"
    home_visit = "home_visit"


# =============================================================================
# AVAILABILITY SCHEMAS
# =============================================================================

class AvailabilityRequest(BaseModel):
    """Request available slots for a clinic."""
    clinic_id: UUID
    service_id: int
    start_date: date
    end_date: date = Field(..., description="Max 14 days from start_date")
    vet_id: Optional[UUID] = None
    slot_type: SlotType = SlotType.in_person
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
                "service_id": 1,
                "start_date": "2024-01-16",
                "end_date": "2024-01-23",
                "vet_id": None,
                "slot_type": "in_person"
            }
        }
    }


class SlotResponse(BaseModel):
    """Single available time slot."""
    id: UUID
    slot_date: date
    start_time: time
    end_time: time
    slot_type: SlotType
    vet_id: Optional[UUID]
    vet_name: Optional[str]
    available_count: int  # Remaining bookings available
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "990e8400-e29b-41d4-a716-446655440004",
                "slot_date": "2024-01-16",
                "start_time": "09:00:00",
                "end_time": "09:30:00",
                "slot_type": "in_person",
                "vet_id": "880e8400-e29b-41d4-a716-446655440003",
                "vet_name": "Dr. Sarah Johnson",
                "available_count": 1
            }
        }
    }


class DayAvailabilityResponse(BaseModel):
    """Slots grouped by day."""
    date: date
    slots: List[SlotResponse]


class AvailabilityResponse(BaseModel):
    """Available slots for date range."""
    clinic_id: UUID
    clinic_name: str
    service_id: int
    service_name: str
    days: List[DayAvailabilityResponse]
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
                "clinic_name": "Happy Paws Veterinary Clinic",
                "service_id": 1,
                "service_name": "General Exam",
                "days": [
                    {
                        "date": "2024-01-16",
                        "slots": [
                            {"id": "990e8400-e29b-41d4-a716-446655440004", "slot_date": "2024-01-16", "start_time": "09:00:00", "end_time": "09:30:00", "slot_type": "in_person", "vet_id": None, "vet_name": None, "available_count": 1},
                            {"id": "990e8400-e29b-41d4-a716-446655440005", "slot_date": "2024-01-16", "start_time": "09:30:00", "end_time": "10:00:00", "slot_type": "in_person", "vet_id": None, "vet_name": None, "available_count": 1}
                        ]
                    }
                ]
            }
        }
    }


# =============================================================================
# APPOINTMENT BOOKING SCHEMAS
# =============================================================================

class AppointmentCreateRequest(BaseModel):
    """Book a new appointment."""
    clinic_id: UUID
    slot_id: UUID
    pet_id: UUID
    service_id: int
    appointment_type: AppointmentType = AppointmentType.in_person
    owner_notes: Optional[str] = Field(None, max_length=1000)
    # Home visit fields (required if appointment_type == home_visit)
    home_address_line1: Optional[str] = Field(None, max_length=255)
    home_address_line2: Optional[str] = Field(None, max_length=255)
    home_city: Optional[str] = Field(None, max_length=100)
    home_state: Optional[str] = Field(None, max_length=50)
    home_postal_code: Optional[str] = Field(None, max_length=20)
    home_access_notes: Optional[str] = Field(None, max_length=500)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
                "slot_id": "990e8400-e29b-41d4-a716-446655440004",
                "pet_id": "660e8400-e29b-41d4-a716-446655440001",
                "service_id": 1,
                "appointment_type": "in_person",
                "owner_notes": "Buddy has been scratching his ear a lot lately."
            }
        }
    }


class AppointmentRescheduleRequest(BaseModel):
    """Reschedule an existing appointment."""
    new_slot_id: UUID
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "new_slot_id": "990e8400-e29b-41d4-a716-446655440006"
            }
        }
    }


class AppointmentCancelRequest(BaseModel):
    """Cancel an appointment."""
    reason: Optional[str] = Field(None, max_length=500)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "reason": "Pet is feeling better, no longer needs the visit."
            }
        }
    }


# =============================================================================
# APPOINTMENT RESPONSE SCHEMAS
# =============================================================================

class PetSummary(BaseModel):
    """Brief pet info for appointment."""
    id: UUID
    name: str
    species_name: str
    breed_name: Optional[str]


class ClinicSummary(BaseModel):
    """Brief clinic info for appointment."""
    id: UUID
    name: str
    phone: str
    address_line1: str
    city: str
    state: str
    postal_code: str


class AppointmentResponse(BaseModel):
    """Appointment details."""
    id: UUID
    confirmation_code: str
    clinic: ClinicSummary
    pet: PetSummary
    vet_name: Optional[str]
    service_name: str
    appointment_type: AppointmentType
    scheduled_date: date
    scheduled_start: time
    scheduled_end: time
    status: AppointmentStatus
    is_emergency: bool
    owner_notes: Optional[str]
    # Home visit address (if applicable)
    home_address_line1: Optional[str]
    home_address_line2: Optional[str]
    home_city: Optional[str]
    home_state: Optional[str]
    home_postal_code: Optional[str]
    home_access_notes: Optional[str]
    # Timestamps
    created_at: datetime
    updated_at: datetime
    cancelled_at: Optional[datetime]
    cancellation_reason: Optional[str]
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "aa0e8400-e29b-41d4-a716-446655440007",
                "confirmation_code": "ABCD-1234",
                "clinic": {
                    "id": "770e8400-e29b-41d4-a716-446655440002",
                    "name": "Happy Paws Veterinary Clinic",
                    "phone": "+1-415-555-1234",
                    "address_line1": "123 Pet Street",
                    "city": "San Francisco",
                    "state": "CA",
                    "postal_code": "94102"
                },
                "pet": {
                    "id": "660e8400-e29b-41d4-a716-446655440001",
                    "name": "Buddy",
                    "species_name": "Dog",
                    "breed_name": "Golden Retriever"
                },
                "vet_name": "Dr. Sarah Johnson",
                "service_name": "General Exam",
                "appointment_type": "in_person",
                "scheduled_date": "2024-01-16",
                "scheduled_start": "09:00:00",
                "scheduled_end": "09:30:00",
                "status": "booked",
                "is_emergency": False,
                "owner_notes": "Buddy has been scratching his ear a lot lately.",
                "home_address_line1": None,
                "home_address_line2": None,
                "home_city": None,
                "home_state": None,
                "home_postal_code": None,
                "home_access_notes": None,
                "created_at": "2024-01-15T14:30:00Z",
                "updated_at": "2024-01-15T14:30:00Z",
                "cancelled_at": None,
                "cancellation_reason": None
            }
        }
    }


class AppointmentListResponse(BaseModel):
    """Paginated list of appointments."""
    appointments: List[AppointmentResponse]
    total: int
    page: int
    page_size: int


class AppointmentConfirmationResponse(BaseModel):
    """Response after successful booking."""
    appointment: AppointmentResponse
    message: str
    add_to_calendar_url: str  # iCal URL
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "appointment": {"confirmation_code": "ABCD-1234"},
                "message": "Appointment booked successfully! A confirmation email has been sent.",
                "add_to_calendar_url": "https://api.findmyvet.com/v1/appointments/aa0e8400/calendar.ics"
            }
        }
    }

