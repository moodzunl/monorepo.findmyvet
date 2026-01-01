"""
Appointment Endpoints

POST   /api/v1/appointments                    - Book new appointment
GET    /api/v1/appointments                    - List user's appointments
GET    /api/v1/appointments/{id}               - Get appointment details
GET    /api/v1/appointments/code/{code}        - Get by confirmation code
PATCH  /api/v1/appointments/{id}/reschedule    - Reschedule appointment
POST   /api/v1/appointments/{id}/cancel        - Cancel appointment
GET    /api/v1/appointments/{id}/calendar.ics  - Download calendar invite
"""
from fastapi import APIRouter, HTTPException, Query, Path, status
from fastapi.responses import Response
from typing import Optional
from uuid import UUID
from datetime import date

from app.schemas.appointments import (
    AppointmentCreateRequest,
    AppointmentRescheduleRequest,
    AppointmentCancelRequest,
    AppointmentResponse,
    AppointmentListResponse,
    AppointmentConfirmationResponse,
    AppointmentStatus,
)

router = APIRouter()


# =============================================================================
# BOOKING
# =============================================================================

@router.post(
    "",
    response_model=AppointmentConfirmationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Book new appointment",
    responses={
        201: {"description": "Appointment booked successfully"},
        400: {"description": "Invalid booking data"},
        401: {"description": "Not authenticated"},
        404: {"description": "Clinic, slot, pet, or service not found"},
        409: {"description": "Slot is no longer available"},
    }
)
async def create_appointment(request: AppointmentCreateRequest):
    """
    Book a new appointment.
    
    **Required fields:**
    - **clinic_id**: The clinic for the appointment
    - **slot_id**: The selected time slot (from availability endpoint)
    - **pet_id**: The pet for the appointment
    - **service_id**: The service being booked
    
    **Optional fields:**
    - **appointment_type**: "in_person" (default) or "home_visit"
    - **owner_notes**: Notes about symptoms or concerns
    - **home_address_***: Required if appointment_type is "home_visit"
    
    **Example request (in-person):**
    ```json
    {
        "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
        "slot_id": "990e8400-e29b-41d4-a716-446655440004",
        "pet_id": "660e8400-e29b-41d4-a716-446655440001",
        "service_id": 1,
        "appointment_type": "in_person",
        "owner_notes": "Buddy has been scratching his ear a lot lately."
    }
    ```
    
    **Example request (home visit):**
    ```json
    {
        "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
        "slot_id": "990e8400-e29b-41d4-a716-446655440010",
        "pet_id": "660e8400-e29b-41d4-a716-446655440001",
        "service_id": 10,
        "appointment_type": "home_visit",
        "owner_notes": "Annual checkup",
        "home_address_line1": "456 Home Street",
        "home_address_line2": "Apt 2B",
        "home_city": "San Francisco",
        "home_state": "CA",
        "home_postal_code": "94110",
        "home_access_notes": "Gate code: 1234. Ring doorbell."
    }
    ```
    
    **Example response:**
    ```json
    {
        "appointment": {
            "id": "aa0e8400-e29b-41d4-a716-446655440007",
            "confirmation_code": "ABCD-1234",
            "clinic": {...},
            "pet": {...},
            "service_name": "General Exam",
            "scheduled_date": "2024-01-16",
            "scheduled_start": "09:00:00",
            "scheduled_end": "09:30:00",
            "status": "booked"
        },
        "message": "Appointment booked successfully! A confirmation email has been sent.",
        "add_to_calendar_url": "https://api.findmyvet.com/v1/appointments/aa0e8400/calendar.ics"
    }
    ```
    
    **Booking flow:**
    1. Validate slot is still available (atomic check-and-book)
    2. Create appointment record
    3. Increment slot's current_bookings counter
    4. Generate confirmation code
    5. Send confirmation email
    6. Return appointment details
    """
    # TODO: Implement appointment booking
    # Use database transaction with row-level locking to prevent double-booking
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# LIST & RETRIEVE
# =============================================================================

@router.get(
    "",
    response_model=AppointmentListResponse,
    summary="List user's appointments",
    responses={
        200: {"description": "List of appointments"},
        401: {"description": "Not authenticated"},
    }
)
async def list_appointments(
    status: Optional[AppointmentStatus] = Query(None, description="Filter by status"),
    upcoming: bool = Query(True, description="Only show upcoming appointments"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=50, description="Items per page"),
):
    """
    List appointments for the authenticated user.
    
    **Filters:**
    - **status**: Filter by specific status (booked, completed, cancelled, etc.)
    - **upcoming**: If true, only show future appointments (default: true)
    
    **Example response:**
    ```json
    {
        "appointments": [
            {
                "id": "aa0e8400-e29b-41d4-a716-446655440007",
                "confirmation_code": "ABCD-1234",
                "clinic": {"name": "Happy Paws Veterinary Clinic", ...},
                "pet": {"name": "Buddy", ...},
                "service_name": "General Exam",
                "scheduled_date": "2024-01-16",
                "scheduled_start": "09:00:00",
                "status": "booked"
            }
        ],
        "total": 5,
        "page": 1,
        "page_size": 20
    }
    ```
    """
    # TODO: Implement list appointments
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Get appointment details",
    responses={
        200: {"description": "Appointment details"},
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized to view this appointment"},
        404: {"description": "Appointment not found"},
    }
)
async def get_appointment(
    appointment_id: UUID = Path(..., description="Appointment ID")
):
    """
    Get full details of a specific appointment.
    
    User must be the appointment owner or clinic staff.
    """
    # TODO: Implement get appointment
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get(
    "/code/{confirmation_code}",
    response_model=AppointmentResponse,
    summary="Get appointment by confirmation code",
    responses={
        200: {"description": "Appointment details"},
        404: {"description": "Appointment not found"},
    }
)
async def get_appointment_by_code(
    confirmation_code: str = Path(..., description="Confirmation code", example="ABCD-1234")
):
    """
    Get appointment details using the confirmation code.
    
    Useful for looking up appointments without authentication
    (e.g., from confirmation email link).
    """
    # TODO: Implement get appointment by code
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# RESCHEDULE & CANCEL
# =============================================================================

@router.patch(
    "/{appointment_id}/reschedule",
    response_model=AppointmentResponse,
    summary="Reschedule appointment",
    responses={
        200: {"description": "Appointment rescheduled"},
        400: {"description": "Cannot reschedule (policy violation)"},
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized"},
        404: {"description": "Appointment or new slot not found"},
        409: {"description": "New slot is not available"},
    }
)
async def reschedule_appointment(
    appointment_id: UUID,
    request: AppointmentRescheduleRequest,
):
    """
    Reschedule an existing appointment to a new time slot.
    
    **Example request:**
    ```json
    {
        "new_slot_id": "990e8400-e29b-41d4-a716-446655440006"
    }
    ```
    
    **Business rules:**
    - Can only reschedule appointments with status "booked"
    - New slot must be at the same clinic
    - New slot must be for a compatible service
    - Clinic's reschedule policy applies (e.g., 24-hour notice)
    
    **Flow:**
    1. Validate appointment can be rescheduled
    2. Check new slot availability
    3. Release old slot (decrement current_bookings)
    4. Book new slot
    5. Update appointment status to "rescheduled"
    6. Send reschedule notification email
    """
    # TODO: Implement reschedule
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
    summary="Cancel appointment",
    responses={
        200: {"description": "Appointment cancelled"},
        400: {"description": "Cannot cancel (policy violation or already past)"},
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized"},
        404: {"description": "Appointment not found"},
    }
)
async def cancel_appointment(
    appointment_id: UUID,
    request: AppointmentCancelRequest,
):
    """
    Cancel an existing appointment.
    
    **Example request:**
    ```json
    {
        "reason": "Pet is feeling better, no longer needs the visit."
    }
    ```
    
    **Business rules:**
    - Can only cancel appointments with status "booked" or "rescheduled"
    - Cannot cancel past appointments
    - Clinic's cancellation policy applies (e.g., fee for <24hr notice)
    
    **Flow:**
    1. Validate appointment can be cancelled
    2. Check cancellation policy (warn if fee applies)
    3. Update status to "cancelled_by_owner"
    4. Release slot (decrement current_bookings)
    5. Record cancellation reason and timestamp
    6. Send cancellation confirmation email
    """
    # TODO: Implement cancel
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# CALENDAR EXPORT
# =============================================================================

@router.get(
    "/{appointment_id}/calendar.ics",
    summary="Download calendar invite",
    responses={
        200: {"description": "iCalendar file", "content": {"text/calendar": {}}},
        404: {"description": "Appointment not found"},
    }
)
async def download_calendar_invite(
    appointment_id: UUID = Path(..., description="Appointment ID")
):
    """
    Download an iCalendar (.ics) file for the appointment.
    
    This can be imported into Google Calendar, Apple Calendar, Outlook, etc.
    
    **Example response (text/calendar):**
    ```
    BEGIN:VCALENDAR
    VERSION:2.0
    PRODID:-//FindMyVet//Appointment//EN
    BEGIN:VEVENT
    UID:aa0e8400-e29b-41d4-a716-446655440007@findmyvet.com
    DTSTART:20240116T090000
    DTEND:20240116T093000
    SUMMARY:Vet Appointment - Buddy at Happy Paws
    LOCATION:123 Pet Street, San Francisco, CA 94102
    DESCRIPTION:General Exam for Buddy\\nConfirmation: ABCD-1234
    END:VEVENT
    END:VCALENDAR
    ```
    """
    # TODO: Implement calendar export
    # Generate iCal content and return with proper content-type
    ical_content = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FindMyVet//Appointment//EN
END:VCALENDAR"""
    
    return Response(
        content=ical_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename=appointment-{appointment_id}.ics"
        }
    )

