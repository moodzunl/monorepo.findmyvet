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
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from fastapi.responses import Response
from typing import Optional
from uuid import UUID
from datetime import date, datetime, timezone

from app.schemas.appointments import (
    AppointmentCreateRequest,
    AppointmentRescheduleRequest,
    AppointmentCancelRequest,
    AppointmentResponse,
    AppointmentListResponse,
    AppointmentConfirmationResponse,
    AppointmentStatus,
    ClinicSummary,
    PetSummary,
)
from app.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.security.current_user import get_current_user
from app.models.user import User

router = APIRouter()

async def _load_appointment_response(db: AsyncSession, appointment_id: UUID) -> AppointmentResponse:
    row = (
        await db.execute(
            text(
                """
                SELECT
                  a.id,
                  a.confirmation_code,
                  a.appointment_type,
                  a.scheduled_date,
                  a.scheduled_start,
                  a.scheduled_end,
                  a.status,
                  a.is_emergency,
                  a.owner_notes,
                  a.home_address_line1,
                  a.home_address_line2,
                  a.home_city,
                  a.home_state,
                  a.home_postal_code,
                  a.home_access_notes,
                  a.created_at,
                  a.updated_at,
                  a.cancelled_at,
                  a.cancellation_reason,
                  c.id AS clinic_id,
                  c.name AS clinic_name,
                  c.phone AS clinic_phone,
                  c.address_line1 AS clinic_address_line1,
                  c.city AS clinic_city,
                  c.state AS clinic_state,
                  c.postal_code AS clinic_postal_code,
                  p.id AS pet_id,
                  p.name AS pet_name,
                  sp.name AS species_name,
                  br.name AS breed_name,
                  s.name AS service_name,
                  CASE WHEN a.vet_id IS NULL THEN NULL ELSE ('Dr. ' || COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')) END AS vet_name
                FROM appointments a
                JOIN clinics c ON c.id = a.clinic_id
                JOIN pets p ON p.id = a.pet_id
                JOIN species sp ON sp.id = p.species_id
                LEFT JOIN breeds br ON br.id = p.breed_id
                JOIN services s ON s.id = a.service_id
                LEFT JOIN vets v ON v.id = a.vet_id
                LEFT JOIN users u ON u.id = v.user_id
                WHERE a.id = :appointment_id
                """
            ),
            {"appointment_id": str(appointment_id)},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Appointment not found")

    clinic = ClinicSummary(
        id=UUID(str(row["clinic_id"])),
        name=row["clinic_name"],
        phone=row["clinic_phone"],
        address_line1=row["clinic_address_line1"],
        city=row["clinic_city"],
        state=row["clinic_state"],
        postal_code=row["clinic_postal_code"],
    )
    pet = PetSummary(
        id=UUID(str(row["pet_id"])),
        name=row["pet_name"],
        species_name=row["species_name"],
        breed_name=row["breed_name"],
    )

    return AppointmentResponse(
        id=UUID(str(row["id"])),
        confirmation_code=row["confirmation_code"],
        clinic=clinic,
        pet=pet,
        vet_name=(row["vet_name"].strip() if isinstance(row["vet_name"], str) else None),
        service_name=row["service_name"],
        appointment_type=row["appointment_type"],
        scheduled_date=row["scheduled_date"],
        scheduled_start=row["scheduled_start"],
        scheduled_end=row["scheduled_end"],
        status=row["status"],
        is_emergency=bool(row["is_emergency"]),
        owner_notes=row["owner_notes"],
        home_address_line1=row["home_address_line1"],
        home_address_line2=row["home_address_line2"],
        home_city=row["home_city"],
        home_state=row["home_state"],
        home_postal_code=row["home_postal_code"],
        home_access_notes=row["home_access_notes"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        cancelled_at=row["cancelled_at"],
        cancellation_reason=row["cancellation_reason"],
    )


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
async def create_appointment(
    request: AppointmentCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
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
    # Validate clinic exists
    clinic_exists = (await db.execute(text("SELECT 1 FROM clinics WHERE id = :id"), {"id": str(request.clinic_id)})).first()
    if not clinic_exists:
        raise HTTPException(status_code=404, detail="Clinic not found")

    # Validate pet belongs to current user
    pet = (
        await db.execute(
            text("SELECT id FROM pets WHERE id = :pet_id AND owner_id = :owner_id"),
            {"pet_id": str(request.pet_id), "owner_id": str(user.id)},
        )
    ).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Validate service exists
    service = (
        await db.execute(
            text("SELECT id, is_emergency FROM services WHERE id = :id AND is_active = TRUE"),
            {"id": request.service_id},
        )
    ).mappings().first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Lock slot and verify availability
    slot = (
        await db.execute(
            text(
                """
                SELECT id, clinic_id, vet_id, slot_date, start_time, end_time, slot_type, is_blocked, current_bookings, max_bookings, service_id
                FROM availability_slots
                WHERE id = :slot_id
                FOR UPDATE
                """
            ),
            {"slot_id": str(request.slot_id)},
        )
    ).mappings().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if str(slot["clinic_id"]) != str(request.clinic_id):
        raise HTTPException(status_code=400, detail="Slot does not belong to clinic")
    if slot["is_blocked"] or slot["current_bookings"] >= slot["max_bookings"]:
        raise HTTPException(status_code=409, detail="Slot is no longer available")
    if slot["slot_type"] != request.appointment_type.value:
        raise HTTPException(status_code=400, detail="Slot type does not match appointment type")
    if slot["service_id"] is not None and int(slot["service_id"]) != int(request.service_id):
        raise HTTPException(status_code=400, detail="Slot is not compatible with requested service")

    # Generate confirmation code via DB function
    code_row = (await db.execute(text("SELECT generate_confirmation_code() AS code"))).mappings().first()
    confirmation_code = code_row["code"] if code_row else None
    if not confirmation_code:
        raise HTTPException(status_code=500, detail="Failed to generate confirmation code")

    now = datetime.now(timezone.utc)

    appt_row = (
        await db.execute(
            text(
                """
                INSERT INTO appointments (
                  confirmation_code,
                  clinic_id,
                  slot_id,
                  owner_id,
                  pet_id,
                  vet_id,
                  service_id,
                  appointment_type,
                  scheduled_date,
                  scheduled_start,
                  scheduled_end,
                  home_address_line1,
                  home_address_line2,
                  home_city,
                  home_state,
                  home_postal_code,
                  home_access_notes,
                  owner_notes,
                  is_emergency,
                  created_at,
                  updated_at
                ) VALUES (
                  :confirmation_code,
                  :clinic_id,
                  :slot_id,
                  :owner_id,
                  :pet_id,
                  :vet_id,
                  :service_id,
                  :appointment_type,
                  :scheduled_date,
                  :scheduled_start,
                  :scheduled_end,
                  :home_address_line1,
                  :home_address_line2,
                  :home_city,
                  :home_state,
                  :home_postal_code,
                  :home_access_notes,
                  :owner_notes,
                  :is_emergency,
                  :created_at,
                  :updated_at
                )
                RETURNING id
                """
            ),
            {
                "confirmation_code": confirmation_code,
                "clinic_id": str(request.clinic_id),
                "slot_id": str(request.slot_id),
                "owner_id": str(user.id),
                "pet_id": str(request.pet_id),
                "vet_id": str(slot["vet_id"]) if slot["vet_id"] is not None else None,
                "service_id": request.service_id,
                "appointment_type": request.appointment_type.value,
                "scheduled_date": slot["slot_date"],
                "scheduled_start": slot["start_time"],
                "scheduled_end": slot["end_time"],
                "home_address_line1": request.home_address_line1,
                "home_address_line2": request.home_address_line2,
                "home_city": request.home_city,
                "home_state": request.home_state,
                "home_postal_code": request.home_postal_code,
                "home_access_notes": request.home_access_notes,
                "owner_notes": request.owner_notes,
                "is_emergency": bool(service["is_emergency"]),
                "created_at": now,
                "updated_at": now,
            },
        )
    ).mappings().first()

    if not appt_row:
        raise HTTPException(status_code=500, detail="Failed to create appointment")

    # Increment slot bookings counter
    await db.execute(
        text("UPDATE availability_slots SET current_bookings = current_bookings + 1 WHERE id = :slot_id"),
        {"slot_id": str(request.slot_id)},
    )
    await db.commit()

    appointment_id = UUID(str(appt_row["id"]))
    appt = await _load_appointment_response(db, appointment_id)

    return AppointmentConfirmationResponse(
        appointment=appt,
        message="Appointment booked successfully!",
        add_to_calendar_url=f"/api/v1/appointments/{appointment_id}/calendar.ics",
    )


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
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
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
    where = ["a.owner_id = :owner_id"]
    params: dict[str, object] = {"owner_id": str(user.id)}

    if status is not None:
        where.append("a.status = :status")
        params["status"] = status.value

    if upcoming:
        where.append("a.scheduled_date >= :today")
        params["today"] = date.today()
        where.append("a.status IN ('booked', 'rescheduled')")

    # Total count
    total_row = (
        await db.execute(
            text(f"SELECT COUNT(*)::int AS total FROM appointments a WHERE {' AND '.join(where)}"),
            params,
        )
    ).mappings().first()
    total = int(total_row["total"]) if total_row else 0

    params["limit"] = page_size
    params["offset"] = (page - 1) * page_size

    rows = (
        await db.execute(
            text(
                f"""
                SELECT a.id
                FROM appointments a
                WHERE {' AND '.join(where)}
                ORDER BY a.scheduled_date DESC, a.scheduled_start DESC
                LIMIT :limit OFFSET :offset
                """
            ),
            params,
        )
    ).mappings().all()

    appts = [await _load_appointment_response(db, UUID(str(r["id"]))) for r in rows]
    return AppointmentListResponse(appointments=appts, total=total, page=page, page_size=page_size)


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
    appointment_id: UUID = Path(..., description="Appointment ID"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get full details of a specific appointment.
    
    User must be the appointment owner or clinic staff.
    """
    owner = (
        await db.execute(
            text("SELECT owner_id FROM appointments WHERE id = :id"),
            {"id": str(appointment_id)},
        )
    ).mappings().first()
    if not owner:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if str(owner["owner_id"]) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this appointment")
    return await _load_appointment_response(db, appointment_id)


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
    confirmation_code: str = Path(..., description="Confirmation code", example="ABCD-1234"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get appointment details using the confirmation code.
    
    Useful for looking up appointments without authentication
    (e.g., from confirmation email link).
    """
    row = (
        await db.execute(
            text("SELECT id FROM appointments WHERE confirmation_code = :code"),
            {"code": confirmation_code},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return await _load_appointment_response(db, UUID(str(row["id"])))


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
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
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
    now = datetime.now(timezone.utc)

    appt = (
        await db.execute(
            text(
                """
                SELECT id, owner_id, clinic_id, slot_id, service_id, status
                FROM appointments
                WHERE id = :id
                FOR UPDATE
                """
            ),
            {"id": str(appointment_id)},
        )
    ).mappings().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if str(appt["owner_id"]) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    if appt["status"] not in ("booked", "rescheduled"):
        raise HTTPException(status_code=400, detail="Appointment cannot be rescheduled")

    new_slot = (
        await db.execute(
            text(
                """
                SELECT id, clinic_id, vet_id, slot_date, start_time, end_time, slot_type, is_blocked, current_bookings, max_bookings, service_id
                FROM availability_slots
                WHERE id = :slot_id
                FOR UPDATE
                """
            ),
            {"slot_id": str(request.new_slot_id)},
        )
    ).mappings().first()
    if not new_slot:
        raise HTTPException(status_code=404, detail="New slot not found")
    if str(new_slot["clinic_id"]) != str(appt["clinic_id"]):
        raise HTTPException(status_code=400, detail="New slot must be at the same clinic")
    if new_slot["is_blocked"] or new_slot["current_bookings"] >= new_slot["max_bookings"]:
        raise HTTPException(status_code=409, detail="New slot is no longer available")
    if new_slot["service_id"] is not None and int(new_slot["service_id"]) != int(appt["service_id"]):
        raise HTTPException(status_code=400, detail="New slot is not compatible with appointment service")

    # Release old slot counter if present
    if appt["slot_id"] is not None:
        await db.execute(
            text(
                "UPDATE availability_slots SET current_bookings = GREATEST(current_bookings - 1, 0) WHERE id = :slot_id"
            ),
            {"slot_id": str(appt["slot_id"])},
        )

    # Book new slot counter
    await db.execute(
        text("UPDATE availability_slots SET current_bookings = current_bookings + 1 WHERE id = :slot_id"),
        {"slot_id": str(request.new_slot_id)},
    )

    # Update appointment schedule fields
    await db.execute(
        text(
            """
            UPDATE appointments
            SET
              slot_id = :slot_id,
              vet_id = :vet_id,
              scheduled_date = :scheduled_date,
              scheduled_start = :scheduled_start,
              scheduled_end = :scheduled_end,
              status = 'rescheduled',
              updated_at = :updated_at
            WHERE id = :id
            """
        ),
        {
            "id": str(appointment_id),
            "slot_id": str(request.new_slot_id),
            "vet_id": str(new_slot["vet_id"]) if new_slot["vet_id"] is not None else None,
            "scheduled_date": new_slot["slot_date"],
            "scheduled_start": new_slot["start_time"],
            "scheduled_end": new_slot["end_time"],
            "updated_at": now,
        },
    )

    await db.commit()
    return await _load_appointment_response(db, appointment_id)


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
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
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
    now = datetime.now(timezone.utc)

    appt = (
        await db.execute(
            text(
                """
                SELECT id, owner_id, slot_id, status
                FROM appointments
                WHERE id = :id
                FOR UPDATE
                """
            ),
            {"id": str(appointment_id)},
        )
    ).mappings().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if str(appt["owner_id"]) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    if appt["status"] not in ("booked", "rescheduled"):
        raise HTTPException(status_code=400, detail="Appointment cannot be cancelled")

    await db.execute(
        text(
            """
            UPDATE appointments
            SET
              status = 'cancelled_by_owner',
              cancelled_by = :cancelled_by,
              cancellation_reason = :reason,
              cancelled_at = :cancelled_at,
              updated_at = :updated_at
            WHERE id = :id
            """
        ),
        {
            "id": str(appointment_id),
            "cancelled_by": str(user.id),
            "reason": request.reason,
            "cancelled_at": now,
            "updated_at": now,
        },
    )

    if appt["slot_id"] is not None:
        await db.execute(
            text(
                "UPDATE availability_slots SET current_bookings = GREATEST(current_bookings - 1, 0) WHERE id = :slot_id"
            ),
            {"slot_id": str(appt["slot_id"])},
        )

    await db.commit()
    return await _load_appointment_response(db, appointment_id)


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

