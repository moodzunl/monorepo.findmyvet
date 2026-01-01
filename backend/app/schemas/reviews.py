"""
Review Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class ReviewCreateRequest(BaseModel):
    """Create a review for an appointment."""
    appointment_id: UUID
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    body: Optional[str] = Field(None, max_length=2000)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "appointment_id": "aa0e8400-e29b-41d4-a716-446655440007",
                "rating": 5,
                "title": "Excellent care for Buddy!",
                "body": "Dr. Johnson was incredibly thorough and patient with my nervous pup. She took the time to explain everything and made Buddy feel comfortable. Highly recommend!"
            }
        }
    }


class ReviewUpdateRequest(BaseModel):
    """Update an existing review."""
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    body: Optional[str] = Field(None, max_length=2000)


class ClinicResponseRequest(BaseModel):
    """Clinic response to a review (for clinic admins)."""
    response: str = Field(..., max_length=1000)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "response": "Thank you so much for your kind words! We're so glad Buddy is feeling better. See you at his next checkup!"
            }
        }
    }


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class ReviewerSummary(BaseModel):
    """Brief reviewer info."""
    id: UUID
    first_name: str
    last_initial: str  # Privacy: only show initial
    avatar_url: Optional[str]


class ReviewResponse(BaseModel):
    """Review details."""
    id: UUID
    appointment_id: UUID
    reviewer: ReviewerSummary
    clinic_id: UUID
    clinic_name: str
    vet_id: Optional[UUID]
    vet_name: Optional[str]
    rating: int
    title: Optional[str]
    body: Optional[str]
    clinic_response: Optional[str]
    clinic_responded_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "bb0e8400-e29b-41d4-a716-446655440008",
                "appointment_id": "aa0e8400-e29b-41d4-a716-446655440007",
                "reviewer": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "first_name": "John",
                    "last_initial": "D",
                    "avatar_url": None
                },
                "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
                "clinic_name": "Happy Paws Veterinary Clinic",
                "vet_id": "880e8400-e29b-41d4-a716-446655440003",
                "vet_name": "Dr. Sarah Johnson",
                "rating": 5,
                "title": "Excellent care for Buddy!",
                "body": "Dr. Johnson was incredibly thorough and patient with my nervous pup...",
                "clinic_response": "Thank you so much for your kind words!",
                "clinic_responded_at": "2024-01-17T10:00:00Z",
                "created_at": "2024-01-16T15:30:00Z",
                "updated_at": "2024-01-16T15:30:00Z"
            }
        }
    }


class ReviewListResponse(BaseModel):
    """Paginated list of reviews."""
    reviews: List[ReviewResponse]
    total: int
    page: int
    page_size: int
    average_rating: Optional[float]
    rating_distribution: dict  # {"5": 45, "4": 30, "3": 10, "2": 5, "1": 2}


class ReviewStatsResponse(BaseModel):
    """Review statistics for a clinic or vet."""
    total_reviews: int
    average_rating: Optional[float]
    rating_distribution: dict
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total_reviews": 156,
                "average_rating": 4.7,
                "rating_distribution": {
                    "5": 98,
                    "4": 35,
                    "3": 15,
                    "2": 5,
                    "1": 3
                }
            }
        }
    }

