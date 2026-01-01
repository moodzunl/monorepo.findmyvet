"""
Authentication Schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class UserRegisterRequest(BaseModel):
    """Register a new user account."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    timezone: str = Field(default="America/Los_Angeles", max_length=50)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "john.doe@example.com",
                "password": "SecurePass123!",
                "first_name": "John",
                "last_name": "Doe",
                "phone": "+1-555-123-4567",
                "timezone": "America/New_York"
            }
        }
    }


class UserLoginRequest(BaseModel):
    """Login with email and password."""
    email: EmailStr
    password: str
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "john.doe@example.com",
                "password": "SecurePass123!"
            }
        }
    }


class PasswordResetRequest(BaseModel):
    """Request password reset email."""
    email: EmailStr
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "john.doe@example.com"
            }
        }
    }


class PasswordResetConfirm(BaseModel):
    """Confirm password reset with token."""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "new_password": "NewSecurePass456!"
            }
        }
    }


class RefreshTokenRequest(BaseModel):
    """Refresh access token."""
    refresh_token: str


class MagicLinkRequest(BaseModel):
    """Request passwordless magic link login."""
    email: EmailStr


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
                "token_type": "bearer",
                "expires_in": 1800
            }
        }
    }


class UserResponse(BaseModel):
    """User profile response."""
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str]
    avatar_url: Optional[str]
    email_verified: bool
    phone_verified: bool
    timezone: str
    created_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "john.doe@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "phone": "+1-555-123-4567",
                "avatar_url": "https://cdn.findmyvet.com/avatars/550e8400.jpg",
                "email_verified": True,
                "phone_verified": False,
                "timezone": "America/New_York",
                "created_at": "2024-01-15T10:30:00Z"
            }
        }
    }


class AuthResponse(BaseModel):
    """Combined auth response with user and tokens."""
    user: UserResponse
    tokens: TokenResponse


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Password reset email sent successfully"
            }
        }
    }

