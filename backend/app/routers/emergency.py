"""
Emergency Mode Endpoints

POST   /api/v1/emergency/search        - Search emergency clinics
GET    /api/v1/emergency/guidance      - Get emergency guidance info
GET    /api/v1/emergency/nearby        - Quick nearby emergency clinics
POST   /api/v1/emergency/flags         - Set emergency flag (clinic admin)
DELETE /api/v1/emergency/flags/{id}    - Remove emergency flag
GET    /api/v1/emergency/flags/clinic/{id} - Get clinic's active flags
"""
from fastapi import APIRouter, HTTPException, Query, Path, status
from typing import Optional, List
from uuid import UUID

from app.schemas.emergency import (
    EmergencySearchRequest,
    EmergencySearchResponse,
    EmergencyClinicResponse,
    EmergencyFlagCreateRequest,
    EmergencyFlagResponse,
    EmergencyGuidanceResponse,
)
from app.schemas.auth import MessageResponse

router = APIRouter()


# =============================================================================
# EMERGENCY CLINIC SEARCH
# =============================================================================

@router.post(
    "/search",
    response_model=EmergencySearchResponse,
    summary="Search emergency clinics",
    responses={
        200: {"description": "Emergency clinics found"},
        400: {"description": "Invalid search parameters"},
    }
)
async def search_emergency_clinics(request: EmergencySearchRequest):
    """
    Search for emergency veterinary clinics.
    
    Optimized for urgent situations:
    - Larger default search radius (50km)
    - Shows phone numbers prominently
    - Includes directions URLs
    - Shows current wait times if available
    
    **Example request:**
    ```json
    {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "radius_km": 30,
        "open_now": true,
        "species_id": 1
    }
    ```
    
    **Example response:**
    ```json
    {
        "clinics": [
            {
                "id": "770e8400-e29b-41d4-a716-446655440002",
                "name": "SF Emergency Vet Hospital",
                "phone": "+1-415-555-9999",
                "address_line1": "456 Emergency Lane",
                "city": "San Francisco",
                "state": "CA",
                "postal_code": "94103",
                "distance_km": 1.2,
                "is_open_now": true,
                "hours_confirmed": true,
                "emergency_flag": "accepting_emergency",
                "wait_time_estimate": "~45 minutes",
                "directions_url": "https://www.google.com/maps/dir/?api=1&destination=37.7751,-122.4180"
            }
        ],
        "total": 5,
        "search_radius_km": 30,
        "disclaimer": "This is not a substitute for professional veterinary advice. If your pet is in immediate danger, call the nearest clinic now."
    }
    ```
    
    **Priority sorting:**
    1. Open now with "accepting_emergency" flag
    2. Open now without flags
    3. Open now with "at_capacity" flag (still accepting but delayed)
    4. Closed clinics (sorted by distance)
    """
    # TODO: Implement emergency clinic search
    # 1. Filter clinics with accepts_emergency = true
    # 2. Calculate distances
    # 3. Check open status based on current time + clinic timezone
    # 4. Join with active emergency_flags
    # 5. Sort by: is_open_now DESC, emergency_flag priority, distance ASC
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get(
    "/nearby",
    response_model=List[EmergencyClinicResponse],
    summary="Quick nearby emergency clinics",
    responses={
        200: {"description": "Nearby emergency clinics (max 5)"},
    }
)
async def get_nearby_emergency_clinics(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    limit: int = Query(5, ge=1, le=10),
):
    """
    Quick endpoint to get nearest emergency clinics.
    
    Simpler than full search - just returns the N closest emergency-capable
    clinics with their phone numbers and directions.
    
    Useful for:
    - "Call nearest emergency vet" button
    - Widget showing closest options
    
    **Example:**
    ```
    GET /api/v1/emergency/nearby?latitude=37.7749&longitude=-122.4194&limit=3
    ```
    """
    # TODO: Implement quick nearby search
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# EMERGENCY GUIDANCE
# =============================================================================

@router.get(
    "/guidance",
    response_model=EmergencyGuidanceResponse,
    summary="Get emergency guidance",
)
async def get_emergency_guidance():
    """
    Get general emergency guidance information.
    
    **Important:** This is informational only, NOT medical advice.
    Always direct users to call a veterinarian for actual emergencies.
    
    **Example response:**
    ```json
    {
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
    ```
    """
    return EmergencyGuidanceResponse(
        title="Signs that require immediate veterinary care",
        description="If your pet shows any of these symptoms, please call an emergency vet immediately.",
        call_to_action="Call the nearest emergency clinic",
        symptoms=[
            "Difficulty breathing or choking",
            "Severe bleeding that won't stop",
            "Inability to urinate or defecate",
            "Seizures",
            "Loss of consciousness",
            "Suspected poisoning",
            "Severe trauma (hit by car, fall, etc.)",
            "Distended or bloated abdomen",
            "Sudden collapse or inability to stand",
            "Eye injuries",
            "Ingestion of toxic substances or foreign objects",
            "Extreme lethargy or unresponsiveness",
            "Severe vomiting or diarrhea (especially with blood)",
            "Signs of severe pain (crying, hiding, aggression)",
        ]
    )


# =============================================================================
# EMERGENCY FLAGS (Clinic Admin)
# =============================================================================

@router.post(
    "/flags",
    response_model=EmergencyFlagResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Set emergency flag",
    responses={
        201: {"description": "Flag created"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be clinic admin"},
    }
)
async def create_emergency_flag(request: EmergencyFlagCreateRequest):
    """
    Set an emergency status flag for a clinic.
    
    **Clinic admins only.**
    
    **Flag types:**
    - `accepting_emergency`: Actively accepting emergency cases
    - `at_capacity`: Still accepting but expect delays
    - `closed_emergency`: Not accepting emergency cases temporarily
    
    **Example request:**
    ```json
    {
        "flag_type": "at_capacity",
        "message": "Currently experiencing high volume. Expected wait: 2-3 hours.",
        "expires_in_hours": 4
    }
    ```
    
    **Notes:**
    - Only one flag of each type can be active per clinic
    - Flags can auto-expire after the specified hours
    - Setting a new flag of the same type replaces the old one
    """
    # TODO: Implement create emergency flag
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete(
    "/flags/{flag_id}",
    response_model=MessageResponse,
    summary="Remove emergency flag",
    responses={
        200: {"description": "Flag removed"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be clinic admin"},
        404: {"description": "Flag not found"},
    }
)
async def delete_emergency_flag(
    flag_id: UUID = Path(..., description="Emergency flag ID")
):
    """
    Remove an emergency status flag.
    
    **Clinic admins only.**
    """
    # TODO: Implement delete emergency flag
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get(
    "/flags/clinic/{clinic_id}",
    response_model=List[EmergencyFlagResponse],
    summary="Get clinic's active flags",
    responses={
        200: {"description": "Active emergency flags"},
        404: {"description": "Clinic not found"},
    }
)
async def get_clinic_emergency_flags(
    clinic_id: UUID = Path(..., description="Clinic ID")
):
    """
    Get all active emergency flags for a clinic.
    """
    # TODO: Implement get clinic emergency flags
    raise HTTPException(status_code=501, detail="Not implemented")

