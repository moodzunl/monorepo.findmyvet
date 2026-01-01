"""
Billing & Monetization Schemas
- Subscription plans
- Clinic subscriptions
- Invoices
- Freelancer sessions & payouts
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from uuid import UUID
from enum import Enum


# =============================================================================
# ENUMS
# =============================================================================

class SubscriptionStatus(str, Enum):
    active = "active"
    past_due = "past_due"
    cancelled = "cancelled"
    trialing = "trialing"


class InvoiceStatus(str, Enum):
    draft = "draft"
    open = "open"
    paid = "paid"
    void = "void"
    uncollectible = "uncollectible"


class PayoutStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    paid = "paid"
    failed = "failed"


# =============================================================================
# SUBSCRIPTION PLANS
# =============================================================================

class SubscriptionPlanResponse(BaseModel):
    """Subscription plan details."""
    id: int
    name: str
    display_name: str
    price_cents: int
    billing_period: str
    features: Dict[str, Any]
    max_vets: Optional[int]
    max_bookings: Optional[int]
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 2,
                "name": "pro",
                "display_name": "Pro",
                "price_cents": 24900,
                "billing_period": "monthly",
                "features": {
                    "reminders": True,
                    "analytics": True,
                    "priority_search": False,
                    "review_requests": True
                },
                "max_vets": 10,
                "max_bookings": None
            }
        }
    }


# =============================================================================
# CLINIC SUBSCRIPTIONS
# =============================================================================

class SubscriptionCreateRequest(BaseModel):
    """Start a new clinic subscription."""
    plan_id: int
    payment_method_token: Optional[str] = None  # Stripe payment method token
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "plan_id": 2,
                "payment_method_token": "pm_1234567890"
            }
        }
    }


class SubscriptionUpdateRequest(BaseModel):
    """Change subscription plan."""
    new_plan_id: int


class SubscriptionResponse(BaseModel):
    """Clinic subscription details."""
    id: UUID
    clinic_id: UUID
    plan: SubscriptionPlanResponse
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    cancelled_at: Optional[datetime]
    trial_end: Optional[datetime]
    created_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "dd0e8400-e29b-41d4-a716-446655440010",
                "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
                "plan": {"id": 2, "name": "pro", "display_name": "Pro", "price_cents": 24900},
                "status": "active",
                "current_period_start": "2024-01-01T00:00:00Z",
                "current_period_end": "2024-02-01T00:00:00Z",
                "cancel_at_period_end": False,
                "cancelled_at": None,
                "trial_end": None,
                "created_at": "2024-01-01T00:00:00Z"
            }
        }
    }


# =============================================================================
# INVOICES
# =============================================================================

class InvoiceResponse(BaseModel):
    """Subscription invoice details."""
    id: UUID
    subscription_id: UUID
    clinic_id: UUID
    amount_cents: int
    status: InvoiceStatus
    invoice_date: date
    due_date: date
    paid_at: Optional[datetime]
    pdf_url: Optional[str]
    created_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "ee0e8400-e29b-41d4-a716-446655440011",
                "subscription_id": "dd0e8400-e29b-41d4-a716-446655440010",
                "clinic_id": "770e8400-e29b-41d4-a716-446655440002",
                "amount_cents": 24900,
                "status": "paid",
                "invoice_date": "2024-01-01",
                "due_date": "2024-01-15",
                "paid_at": "2024-01-02T10:30:00Z",
                "pdf_url": "https://invoices.stripe.com/inv_xxx/pdf",
                "created_at": "2024-01-01T00:00:00Z"
            }
        }
    }


class InvoiceListResponse(BaseModel):
    """Paginated invoice list."""
    invoices: List[InvoiceResponse]
    total: int
    page: int
    page_size: int


# =============================================================================
# FREELANCER SESSIONS
# =============================================================================

class FreelancerSessionResponse(BaseModel):
    """Freelancer session details."""
    id: UUID
    vet_id: UUID
    appointment_id: UUID
    session_date: date
    session_amount_cents: int
    platform_fee_cents: int
    vet_payout_cents: int
    payout_status: PayoutStatus
    payout_id: Optional[UUID]
    created_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "ff0e8400-e29b-41d4-a716-446655440012",
                "vet_id": "880e8400-e29b-41d4-a716-446655440003",
                "appointment_id": "aa0e8400-e29b-41d4-a716-446655440007",
                "session_date": "2024-01-16",
                "session_amount_cents": 12000,
                "platform_fee_cents": 1800,
                "vet_payout_cents": 10200,
                "payout_status": "pending",
                "payout_id": None,
                "created_at": "2024-01-16T11:00:00Z"
            }
        }
    }


class FreelancerSessionListResponse(BaseModel):
    """Paginated session list for freelancer."""
    sessions: List[FreelancerSessionResponse]
    total: int
    total_earnings_cents: int
    total_pending_cents: int
    page: int
    page_size: int


# =============================================================================
# VET PAYOUTS
# =============================================================================

class VetPayoutResponse(BaseModel):
    """Vet payout details."""
    id: UUID
    vet_id: UUID
    amount_cents: int
    session_count: int
    period_start: date
    period_end: date
    status: PayoutStatus
    paid_at: Optional[datetime]
    failure_reason: Optional[str]
    created_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "gg0e8400-e29b-41d4-a716-446655440013",
                "vet_id": "880e8400-e29b-41d4-a716-446655440003",
                "amount_cents": 45000,
                "session_count": 5,
                "period_start": "2024-01-01",
                "period_end": "2024-01-15",
                "status": "completed",
                "paid_at": "2024-01-16T00:00:00Z",
                "failure_reason": None,
                "created_at": "2024-01-15T23:59:00Z"
            }
        }
    }


class VetPayoutListResponse(BaseModel):
    """Paginated payout list for freelancer."""
    payouts: List[VetPayoutResponse]
    total: int
    total_paid_cents: int
    page: int
    page_size: int


# =============================================================================
# PLATFORM REVENUE (Admin)
# =============================================================================

class RevenueStatsResponse(BaseModel):
    """Platform revenue statistics."""
    period_start: date
    period_end: date
    total_revenue_cents: int
    booking_fees_cents: int
    subscription_revenue_cents: int
    freelancer_fees_cents: int
    transaction_count: int
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "period_start": "2024-01-01",
                "period_end": "2024-01-31",
                "total_revenue_cents": 1250000,
                "booking_fees_cents": 450000,
                "subscription_revenue_cents": 650000,
                "freelancer_fees_cents": 150000,
                "transaction_count": 1250
            }
        }
    }

