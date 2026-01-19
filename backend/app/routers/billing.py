"""
Billing & Monetization Endpoints

SUBSCRIPTIONS (Clinic SaaS):
GET    /api/v1/billing/plans                    - List subscription plans
GET    /api/v1/billing/subscriptions/current    - Get clinic's current subscription
POST   /api/v1/billing/subscriptions            - Create subscription
PATCH  /api/v1/billing/subscriptions            - Update subscription (change plan)
POST   /api/v1/billing/subscriptions/cancel     - Cancel subscription
GET    /api/v1/billing/invoices                 - List clinic invoices

FREELANCER (Per-session):
GET    /api/v1/billing/sessions                 - List freelancer sessions
GET    /api/v1/billing/sessions/stats           - Get earnings summary
GET    /api/v1/billing/payouts                  - List freelancer payouts
POST   /api/v1/billing/payouts/request          - Request manual payout

ADMIN:
GET    /api/v1/billing/revenue/stats            - Platform revenue stats
"""
from fastapi import APIRouter, HTTPException, Query, Path, status
from typing import Optional
from uuid import UUID
from datetime import date

from app.schemas.billing import (
    SubscriptionPlanResponse,
    SubscriptionCreateRequest,
    SubscriptionUpdateRequest,
    SubscriptionResponse,
    InvoiceResponse,
    InvoiceListResponse,
    FreelancerSessionResponse,
    FreelancerSessionListResponse,
    VetPayoutResponse,
    VetPayoutListResponse,
    RevenueStatsResponse,
    PayoutStatus,
)
from app.schemas.auth import MessageResponse

router = APIRouter()


# =============================================================================
# SUBSCRIPTION PLANS
# =============================================================================

@router.get(
    "/plans",
    response_model=list[SubscriptionPlanResponse],
    summary="List subscription plans",
)
async def list_subscription_plans():
    """
    List all available subscription plans for clinics.
    
    **Example response:**
    ```json
    [
        {
            "id": 1,
            "name": "starter",
            "display_name": "Starter",
            "price_cents": 9900,
            "billing_period": "monthly",
            "features": {"reminders": true, "analytics": false},
            "max_vets": 2,
            "max_bookings": 100
        },
        {
            "id": 2,
            "name": "pro",
            "display_name": "Pro",
            "price_cents": 24900,
            ...
        }
    ]
    ```
    """
    # TODO: Implement list plans
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# CLINIC SUBSCRIPTIONS
# =============================================================================

@router.get(
    "/subscriptions/current",
    response_model=SubscriptionResponse,
    summary="Get current subscription",
    responses={
        200: {"description": "Current subscription"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be clinic admin"},
        404: {"description": "No active subscription"},
    }
)
async def get_current_subscription():
    """
    Get the current clinic's subscription details.
    
    **Requires:** Clinic admin role.
    """
    # TODO: Implement get subscription
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post(
    "/subscriptions",
    response_model=SubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create subscription",
    responses={
        201: {"description": "Subscription created"},
        400: {"description": "Invalid plan or payment method"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be clinic admin"},
        409: {"description": "Clinic already has an active subscription"},
    }
)
async def create_subscription(request: SubscriptionCreateRequest):
    """
    Start a new subscription for the clinic.
    
    **Example request:**
    ```json
    {
        "plan_id": 2,
        "payment_method_token": "pm_1234567890"
    }
    ```
    
    **Flow:**
    1. Validate plan exists and is active
    2. Create Stripe customer (if not exists)
    3. Attach payment method
    4. Create Stripe subscription
    5. Store subscription record
    """
    # TODO: Implement create subscription (integrate with Stripe)
    raise HTTPException(status_code=501, detail="Not implemented")


@router.patch(
    "/subscriptions",
    response_model=SubscriptionResponse,
    summary="Update subscription",
    responses={
        200: {"description": "Subscription updated"},
        400: {"description": "Invalid plan"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be clinic admin"},
        404: {"description": "No active subscription"},
    }
)
async def update_subscription(request: SubscriptionUpdateRequest):
    """
    Change the subscription plan (upgrade/downgrade).
    
    **Example request:**
    ```json
    {
        "new_plan_id": 3
    }
    ```
    
    Changes are prorated and take effect immediately.
    """
    # TODO: Implement update subscription
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post(
    "/subscriptions/cancel",
    response_model=SubscriptionResponse,
    summary="Cancel subscription",
    responses={
        200: {"description": "Subscription cancelled"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be clinic admin"},
        404: {"description": "No active subscription"},
    }
)
async def cancel_subscription(
    immediate: bool = Query(False, description="Cancel immediately vs at period end")
):
    """
    Cancel the clinic's subscription.
    
    - **immediate=false** (default): Cancel at end of billing period
    - **immediate=true**: Cancel immediately (no refund)
    """
    # TODO: Implement cancel subscription
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# INVOICES
# =============================================================================

@router.get(
    "/invoices",
    response_model=InvoiceListResponse,
    summary="List invoices",
    responses={
        200: {"description": "Invoice list"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be clinic admin"},
    }
)
async def list_invoices(
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    """
    List all invoices for the clinic.
    
    **Example response:**
    ```json
    {
        "invoices": [
            {
                "id": "ee0e8400...",
                "amount_cents": 24900,
                "status": "paid",
                "invoice_date": "2024-01-01",
                "pdf_url": "https://..."
            }
        ],
        "total": 12,
        "page": 1,
        "page_size": 20
    }
    ```
    """
    # TODO: Implement list invoices
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# FREELANCER SESSIONS
# =============================================================================

@router.get(
    "/sessions",
    response_model=FreelancerSessionListResponse,
    summary="List freelancer sessions",
    responses={
        200: {"description": "Session list"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be a freelancer vet"},
    }
)
async def list_freelancer_sessions(
    payout_status: Optional[PayoutStatus] = Query(None, description="Filter by payout status"),
    start_date: Optional[date] = Query(None, description="Filter from date"),
    end_date: Optional[date] = Query(None, description="Filter to date"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    """
    List sessions for the authenticated freelancer vet.
    """
    # Mock data for frontend development
    return {
        "sessions": [
            {
                "id": "ff0e8400-e29b-41d4-a716-446655440001",
                "session_date": "2026-01-18",
                "session_amount_cents": 12000,
                "platform_fee_cents": 1800,
                "vet_payout_cents": 10200,
                "payout_status": "pending"
            },
            {
                "id": "ff0e8400-e29b-41d4-a716-446655440002",
                "session_date": "2026-01-17",
                "session_amount_cents": 15000,
                "platform_fee_cents": 2250,
                "vet_payout_cents": 12750,
                "payout_status": "pending"
            }
        ],
        "total": 2,
        "total_earnings_cents": 27000,
        "total_pending_cents": 22950,
        "page": 1,
        "page_size": 20
    }


@router.get(
    "/sessions/stats",
    summary="Get earnings summary",
    responses={
        200: {"description": "Earnings statistics"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be a freelancer vet"},
    }
)
async def get_freelancer_stats():
    """
    Get earnings summary for the authenticated freelancer.
    """
    # Mock data for frontend development
    return {
        "total_sessions": 45,
        "total_earnings_cents": 540000,
        "pending_payout_cents": 45000,
        "last_payout_date": "2026-01-15",
        "last_payout_cents": 120000,
        "this_month_sessions": 8,
        "this_month_earnings_cents": 96000,
        "pending_appointments_count": 12,
        "total_cash_flow_cents": 750000
    }


# =============================================================================
# VET PAYOUTS
# =============================================================================

@router.get(
    "/payouts",
    response_model=VetPayoutListResponse,
    summary="List payouts",
    responses={
        200: {"description": "Payout list"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be a freelancer vet"},
    }
)
async def list_payouts(
    status: Optional[PayoutStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    """
    List all payouts for the authenticated freelancer.
    """
    # Mock data for frontend development
    return {
        "payouts": [
            {
                "id": "gg0e8400-e29b-41d4-a716-446655440001",
                "amount_cents": 45000,
                "session_count": 5,
                "period_start": "2026-01-01",
                "period_end": "2026-01-15",
                "status": "completed",
                "paid_at": "2026-01-16T10:00:00Z"
            },
            {
                "id": "gg0e8400-e29b-41d4-a716-446655440002",
                "amount_cents": 120000,
                "session_count": 12,
                "period_start": "2025-12-15",
                "period_end": "2025-12-31",
                "status": "completed",
                "paid_at": "2026-01-02T10:00:00Z"
            }
        ],
        "total": 2,
        "total_paid_cents": 165000,
        "page": 1,
        "page_size": 20
    }


@router.post(
    "/payouts/request",
    response_model=VetPayoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request payout",
    responses={
        201: {"description": "Payout requested"},
        400: {"description": "No pending sessions or minimum not met"},
        401: {"description": "Not authenticated"},
        403: {"description": "Must be a freelancer vet with Stripe connected"},
    }
)
async def request_payout():
    """
    Request a manual payout for all pending sessions.
    
    **Requirements:**
    - Must have Stripe Connect account set up
    - Must have at least $50 in pending earnings
    - Cannot have a payout already in processing
    
    Payouts are typically processed within 2-3 business days.
    """
    # TODO: Implement request payout (integrate with Stripe Connect)
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# ADMIN: PLATFORM REVENUE
# =============================================================================

@router.get(
    "/revenue/stats",
    response_model=RevenueStatsResponse,
    summary="Platform revenue stats (Admin)",
    responses={
        200: {"description": "Revenue statistics"},
        401: {"description": "Not authenticated"},
        403: {"description": "Admin only"},
    }
)
async def get_revenue_stats(
    start_date: date = Query(..., description="Period start"),
    end_date: date = Query(..., description="Period end"),
):
    """
    Get platform revenue statistics for a date range.
    
    **Admin only.**
    
    **Example response:**
    ```json
    {
        "period_start": "2024-01-01",
        "period_end": "2024-01-31",
        "total_revenue_cents": 1250000,
        "booking_fees_cents": 450000,
        "subscription_revenue_cents": 650000,
        "freelancer_fees_cents": 150000,
        "transaction_count": 1250
    }
    ```
    """
    # TODO: Implement revenue stats (admin only)
    raise HTTPException(status_code=501, detail="Not implemented")

