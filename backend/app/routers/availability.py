"""
Availability Endpoints

POST   /api/v1/availability/slots     - Get available slots for booking
GET    /api/v1/availability/next      - Get next available slot for clinic
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from uuid import UUID
from datetime import date
from datetime import timedelta

from app.schemas.appointments import (
    AvailabilityRequest,
    AvailabilityResponse,
    SlotResponse,
    SlotType,
    DayAvailabilityResponse,
)
from app.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

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
async def get_available_slots(
    request: AvailabilityRequest,
    db: AsyncSession = Depends(get_db),
):
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
    # Validate date range (max 14 days)
    if request.end_date < request.start_date:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")
    if (request.end_date - request.start_date).days > 14:
        raise HTTPException(status_code=400, detail="Date range too large (max 14 days)")

    clinic = (
        await db.execute(
            text("SELECT id, name FROM clinics WHERE id = :id"),
            {"id": str(request.clinic_id)},
        )
    ).mappings().first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    service = (
        await db.execute(
            text("SELECT id, name FROM services WHERE id = :id AND is_active = TRUE"),
            {"id": request.service_id},
        )
    ).mappings().first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    params: dict[str, object] = {
        "clinic_id": str(request.clinic_id),
        "service_id": request.service_id,
        "start_date": request.start_date,
        "end_date": request.end_date,
        "slot_type": request.slot_type.value,
    }
    vet_filter = ""
    if request.vet_id is not None:
        vet_filter = "AND s.vet_id = :vet_id"
        params["vet_id"] = str(request.vet_id)

    rows = (
        await db.execute(
            text(
                f"""
                SELECT
                  s.id,
                  s.slot_date,
                  s.start_time,
                  s.end_time,
                  s.slot_type,
                  s.vet_id,
                  CASE
                    WHEN s.vet_id IS NULL THEN NULL
                    ELSE ('Dr. ' || COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, ''))
                  END AS vet_name,
                  (s.max_bookings - s.current_bookings)::int AS available_count
                FROM availability_slots s
                LEFT JOIN vets v ON v.id = s.vet_id
                LEFT JOIN users u ON u.id = v.user_id
                WHERE s.clinic_id = :clinic_id
                  AND s.slot_date BETWEEN :start_date AND :end_date
                  AND s.is_blocked = FALSE
                  AND s.current_bookings < s.max_bookings
                  AND s.slot_type = :slot_type
                  AND (s.service_id IS NULL OR s.service_id = :service_id)
                  {vet_filter}
                ORDER BY s.slot_date, s.start_time
                """
            ),
            params,
        )
    ).mappings().all()

    slots_by_date: dict[date, list[dict]] = {}
    for r in rows:
        d = r["slot_date"]
        slots_by_date.setdefault(d, []).append(
            {
                "id": r["id"],
                "slot_date": r["slot_date"],
                "start_time": r["start_time"],
                "end_time": r["end_time"],
                "slot_type": r["slot_type"],
                "vet_id": r["vet_id"],
                "vet_name": (r["vet_name"].strip() if isinstance(r["vet_name"], str) else None),
                "available_count": r["available_count"],
            }
        )

    # Include empty days
    days: list[DayAvailabilityResponse] = []
    cur = request.start_date
    while cur <= request.end_date:
        days.append(DayAvailabilityResponse(date=cur, slots=[SlotResponse(**s) for s in slots_by_date.get(cur, [])]))
        cur = cur + timedelta(days=1)

    return AvailabilityResponse(
        clinic_id=request.clinic_id,
        clinic_name=clinic["name"],
        service_id=request.service_id,
        service_name=service["name"],
        days=days,
    )


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
    db: AsyncSession = Depends(get_db),
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
    params: dict[str, object] = {
        "clinic_id": str(clinic_id),
        "service_id": service_id,
        "slot_type": slot_type.value,
        "today": date.today(),
    }
    vet_filter = ""
    if vet_id is not None:
        vet_filter = "AND s.vet_id = :vet_id"
        params["vet_id"] = str(vet_id)

    row = (
        await db.execute(
            text(
                f"""
                SELECT
                  s.id,
                  s.slot_date,
                  s.start_time,
                  s.end_time,
                  s.slot_type,
                  s.vet_id,
                  CASE
                    WHEN s.vet_id IS NULL THEN NULL
                    ELSE ('Dr. ' || COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, ''))
                  END AS vet_name,
                  (s.max_bookings - s.current_bookings)::int AS available_count
                FROM availability_slots s
                LEFT JOIN vets v ON v.id = s.vet_id
                LEFT JOIN users u ON u.id = v.user_id
                WHERE s.clinic_id = :clinic_id
                  AND s.slot_date >= :today
                  AND s.is_blocked = FALSE
                  AND s.current_bookings < s.max_bookings
                  AND s.slot_type = :slot_type
                  AND (s.service_id IS NULL OR s.service_id = :service_id)
                  {vet_filter}
                ORDER BY s.slot_date, s.start_time
                LIMIT 1
                """
            ),
            params,
        )
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="No availability found")

    return SlotResponse(
        id=row["id"],
        slot_date=row["slot_date"],
        start_time=row["start_time"],
        end_time=row["end_time"],
        slot_type=row["slot_type"],
        vet_id=row["vet_id"],
        vet_name=(row["vet_name"].strip() if isinstance(row["vet_name"], str) else None),
        available_count=row["available_count"],
    )


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
async def check_slot_availability(
    slot_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Check if a specific slot is still available.
    
    Use this before confirming a booking to handle race conditions.
    Returns 409 Conflict if the slot has been booked since it was displayed.
    """
    row = (
        await db.execute(
            text(
                """
                SELECT
                  s.id,
                  s.slot_date,
                  s.start_time,
                  s.end_time,
                  s.slot_type,
                  s.vet_id,
                  CASE
                    WHEN s.vet_id IS NULL THEN NULL
                    ELSE ('Dr. ' || COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, ''))
                  END AS vet_name,
                  (s.max_bookings - s.current_bookings)::int AS available_count,
                  s.is_blocked,
                  s.current_bookings,
                  s.max_bookings
                FROM availability_slots s
                LEFT JOIN vets v ON v.id = s.vet_id
                LEFT JOIN users u ON u.id = v.user_id
                WHERE s.id = :slot_id
                """
            ),
            {"slot_id": str(slot_id)},
        )
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Slot not found")

    if row["is_blocked"] or row["current_bookings"] >= row["max_bookings"]:
        raise HTTPException(status_code=409, detail="Slot is no longer available")

    return SlotResponse(
        id=row["id"],
        slot_date=row["slot_date"],
        start_time=row["start_time"],
        end_time=row["end_time"],
        slot_type=row["slot_type"],
        vet_id=row["vet_id"],
        vet_name=(row["vet_name"].strip() if isinstance(row["vet_name"], str) else None),
        available_count=row["available_count"],
    )

