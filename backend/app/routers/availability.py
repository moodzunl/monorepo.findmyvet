"""
Availability Endpoints

POST   /api/v1/availability/slots     - Get available slots for booking
GET    /api/v1/availability/next      - Get next available slot for clinic
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from uuid import UUID
from datetime import date

from app.schemas.appointments import (
    AvailabilityRequest,
    AvailabilityResponse,
    SlotResponse,
    SlotType,
)

router = APIRouter()


# =============================================================================
# AVAILABILITY QUERIES
# =============================================================================

@router.post(
    "/slots",
    response_model=AvailabilityResponse,
    summary="Get available slots",
    responses={
        200: {"description": "Available slots for date range"},
        400: {"description": "Invalid parameters"},
        404: {"description": "Clinic or service not found"},
    }
)
async def get_available_slots(request: AvailabilityRequest):
    """
    Get available appointment slots for a clinic and service.
    
    **Parameters:**
    - **clinic_id**: The clinic to check availability for
    - **service_id**: The service being booked (determines duration)
    - **start_date**: Start of date range
    - **end_date**: End of date range (max 14 days from start)
    - **vet_id**: Optional - filter by specific vet
    - **slot_type**: "in_person" or "home_visit"
    
    **Example request:**
    ```json
    {
        "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
        "service_id": 1,
        "start_date": "2024-01-16",
        "end_date": "2024-01-23",
        "slot_type": "in_person"
    }
    ```
    
    **Example response:**
    ```json
    {
        "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
        "clinic_name": "Happy Paws Veterinary Clinic",
        "service_id": 1,
        "service_name": "General Exam",
        "days": [
            {
                "date": "2024-01-16",
                "slots": [
                    {
                        "id": "990e8400-e29b-41d4-a716-446655440004",
                        "slot_date": "2024-01-16",
                        "start_time": "09:00:00",
                        "end_time": "09:30:00",
                        "slot_type": "in_person",
                        "vet_id": null,
                        "vet_name": null,
                        "available_count": 1
                    },
                    {
                        "id": "990e8400-e29b-41d4-a716-446655440005",
                        "slot_date": "2024-01-16",
                        "start_time": "09:30:00",
                        "end_time": "10:00:00",
                        "slot_type": "in_person",
                        "vet_id": "880e8400-e29b-41d4-a716-446655440003",
                        "vet_name": "Dr. Sarah Johnson",
                        "available_count": 1
                    }
                ]
            },
            {
                "date": "2024-01-17",
                "slots": []
            }
        ]
    }
    ```
    
    **Notes:**
    - Days with no availability will have an empty `slots` array
    - `available_count` shows remaining bookings for that slot
    - Slots are filtered by clinic hours and blackout dates
    """
    # TODO: Implement get available slots
    # 1. Validate clinic and service exist
    # 2. Validate date range (max 14 days)
    # 3. Get slots from availability_slots table
    # 4. Filter by: not blocked, current_bookings < max_bookings
    # 5. Filter by vet if specified
    # 6. Group by date
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get(
    "/next",
    response_model=SlotResponse,
    summary="Get next available slot",
    responses={
        200: {"description": "Next available slot"},
        404: {"description": "No availability found"},
    }
)
async def get_next_available(
    clinic_id: UUID = Query(..., description="Clinic ID"),
    service_id: int = Query(..., description="Service ID"),
    slot_type: SlotType = Query(SlotType.in_person, description="Slot type"),
    vet_id: Optional[UUID] = Query(None, description="Specific vet (optional)"),
):
    """
    Get the next available slot for quick booking.
    
    Useful for displaying "Next available: Tomorrow at 9:00 AM" on clinic cards.
    
    **Example response:**
    ```json
    {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "slot_date": "2024-01-16",
        "start_time": "09:00:00",
        "end_time": "09:30:00",
        "slot_type": "in_person",
        "vet_id": null,
        "vet_name": null,
        "available_count": 1
    }
    ```
    """
    # TODO: Implement get next available
    # 1. Query first available slot from today onwards
    # 2. Return 404 if none found within reasonable window (e.g., 30 days)
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get(
    "/check/{slot_id}",
    response_model=SlotResponse,
    summary="Check slot availability",
    responses={
        200: {"description": "Slot is available"},
        404: {"description": "Slot not found"},
        409: {"description": "Slot is no longer available"},
    }
)
async def check_slot_availability(slot_id: UUID):
    """
    Check if a specific slot is still available.
    
    Use this before confirming a booking to handle race conditions.
    Returns 409 Conflict if the slot has been booked since it was displayed.
    """
    # TODO: Implement slot availability check
    raise HTTPException(status_code=501, detail="Not implemented")

