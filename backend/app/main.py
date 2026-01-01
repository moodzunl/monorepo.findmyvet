"""
FindMyVet API - Main Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, clinics, availability, appointments, reviews, emergency, billing

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    ## FindMyVet API
    
    Veterinary marketplace API for booking appointments, discovering clinics, 
    and managing pet healthcare.
    
    ### Features
    - 🔐 **Authentication**: Register, login, password reset
    - 🏥 **Clinic Discovery**: Search clinics by location, services, availability
    - 📅 **Availability**: View and manage appointment slots
    - 📝 **Appointments**: Book, reschedule, cancel appointments
    - ⭐ **Reviews**: Read and write clinic/vet reviews
    - 🚨 **Emergency**: Find emergency vets open now
    - 💳 **Billing**: Subscriptions, invoices, freelancer payouts
    """,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(clinics.router, prefix="/api/v1/clinics", tags=["Clinics"])
app.include_router(availability.router, prefix="/api/v1/availability", tags=["Availability"])
app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["Appointments"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["Reviews"])
app.include_router(emergency.router, prefix="/api/v1/emergency", tags=["Emergency"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["Billing & Monetization"])


@app.get("/", tags=["Health"])
async def root():
    """API health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",  # TODO: Actual DB check
        "version": settings.app_version,
    }

