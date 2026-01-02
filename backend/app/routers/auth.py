"""
Authentication Endpoints

POST   /api/v1/auth/register          - Register new user
POST   /api/v1/auth/login             - Login with email/password
POST   /api/v1/auth/logout            - Logout (revoke token)
POST   /api/v1/auth/refresh           - Refresh access token
POST   /api/v1/auth/password-reset    - Request password reset
POST   /api/v1/auth/password-reset/confirm - Confirm password reset
POST   /api/v1/auth/magic-link        - Request magic link login
POST   /api/v1/auth/magic-link/verify - Verify magic link
GET    /api/v1/auth/me                - Get current user
PATCH  /api/v1/auth/me                - Update current user
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated

from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    RefreshTokenRequest,
    MagicLinkRequest,
    TokenResponse,
    UserResponse,
    AuthResponse,
    MessageResponse,
    ClerkMeResponse,
)
from app.schemas.users import UserProfileUpdate
from app.security.clerk import require_clerk_auth
from app.security.current_user import get_current_user as get_current_user_db
from app.models.user import User

router = APIRouter()


# =============================================================================
# REGISTRATION & LOGIN
# =============================================================================

@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    responses={
        201: {"description": "User registered successfully"},
        400: {"description": "Invalid input or email already exists"},
    }
)
async def register(request: UserRegisterRequest):
    """
    Register a new user account.
    
    - **email**: Valid email address (must be unique)
    - **password**: Minimum 8 characters
    - **first_name**: User's first name
    - **last_name**: User's last name
    - **phone**: Optional phone number
    - **timezone**: User's timezone (default: America/Los_Angeles)
    
    Returns user profile and authentication tokens.
    """
    # TODO: Implement registration logic
    # 1. Validate email uniqueness
    # 2. Hash password
    # 3. Create user record
    # 4. Assign 'pet_owner' role
    # 5. Generate tokens
    # 6. Send verification email
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login with email/password",
    responses={
        200: {"description": "Login successful"},
        401: {"description": "Invalid credentials"},
    }
)
async def login(request: UserLoginRequest):
    """
    Authenticate with email and password.
    
    Returns user profile and JWT tokens (access + refresh).
    
    **Example request:**
    ```json
    {
        "email": "john.doe@example.com",
        "password": "SecurePass123!"
    }
    ```
    
    **Example response:**
    ```json
    {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "john.doe@example.com",
            "first_name": "John",
            "last_name": "Doe",
            ...
        },
        "tokens": {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
            "token_type": "bearer",
            "expires_in": 1800
        }
    }
    ```
    """
    # TODO: Implement login logic
    # 1. Find user by email
    # 2. Verify password
    # 3. Generate tokens
    # 4. Return user + tokens
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout (revoke tokens)",
    responses={
        200: {"description": "Logged out successfully"},
        401: {"description": "Not authenticated"},
    }
)
async def logout():
    """
    Logout the current user by revoking their tokens.
    
    Requires valid access token in Authorization header.
    """
    # TODO: Implement logout
    # 1. Get current user from token
    # 2. Revoke all active tokens for user
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# TOKEN MANAGEMENT
# =============================================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    responses={
        200: {"description": "Token refreshed successfully"},
        401: {"description": "Invalid or expired refresh token"},
    }
)
async def refresh_token(request: RefreshTokenRequest):
    """
    Get a new access token using a valid refresh token.
    
    **Example request:**
    ```json
    {
        "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
    }
    ```
    """
    # TODO: Implement token refresh
    # 1. Validate refresh token
    # 2. Check if revoked
    # 3. Generate new access token
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# PASSWORD RESET
# =============================================================================

@router.post(
    "/password-reset",
    response_model=MessageResponse,
    summary="Request password reset",
    responses={
        200: {"description": "Reset email sent (if account exists)"},
    }
)
async def request_password_reset(request: PasswordResetRequest):
    """
    Request a password reset email.
    
    For security, always returns success even if email doesn't exist.
    
    **Example request:**
    ```json
    {
        "email": "john.doe@example.com"
    }
    ```
    """
    # TODO: Implement password reset request
    # 1. Find user by email (silently fail if not found)
    # 2. Generate reset token
    # 3. Send reset email
    return MessageResponse(message="If an account exists with this email, a reset link has been sent.")


@router.post(
    "/password-reset/confirm",
    response_model=MessageResponse,
    summary="Confirm password reset",
    responses={
        200: {"description": "Password updated successfully"},
        400: {"description": "Invalid or expired token"},
    }
)
async def confirm_password_reset(request: PasswordResetConfirm):
    """
    Reset password using the token from the reset email.
    
    **Example request:**
    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "new_password": "NewSecurePass456!"
    }
    ```
    """
    # TODO: Implement password reset confirmation
    # 1. Validate reset token
    # 2. Update password hash
    # 3. Revoke all existing tokens
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# MAGIC LINK (PASSWORDLESS)
# =============================================================================

@router.post(
    "/magic-link",
    response_model=MessageResponse,
    summary="Request magic link login",
    responses={
        200: {"description": "Magic link sent (if account exists)"},
    }
)
async def request_magic_link(request: MagicLinkRequest):
    """
    Request a passwordless magic link login.
    
    A login link will be sent to the email address.
    """
    # TODO: Implement magic link request
    return MessageResponse(message="If an account exists with this email, a login link has been sent.")


@router.post(
    "/magic-link/verify",
    response_model=AuthResponse,
    summary="Verify magic link",
    responses={
        200: {"description": "Login successful"},
        400: {"description": "Invalid or expired link"},
    }
)
async def verify_magic_link(token: str):
    """
    Complete login using magic link token.
    """
    # TODO: Implement magic link verification
    raise HTTPException(status_code=501, detail="Not implemented")


# =============================================================================
# CURRENT USER
# =============================================================================

@router.get(
    "/me",
    response_model=ClerkMeResponse,
    summary="Get current user",
    responses={
        200: {"description": "Current user profile"},
        401: {"description": "Not authenticated"},
    }
)
async def get_current_user(
    claims: Annotated[dict, Depends(require_clerk_auth)],
    user: Annotated[User, Depends(get_current_user_db)],
):
    """
    Verify the caller using a Clerk JWT and return the decoded identity.

    Requires Authorization header:
    - `Authorization: Bearer <token>`

    In the Expo app, fetch a token via `useAuth().getToken()` (optionally with a JWT template).
    """
    return ClerkMeResponse(
        clerk_user_id=str(claims.get("sub")),
        internal_user_id=user.id,
        email=user.email,
        session_id=claims.get("sid"),
        org_id=claims.get("org_id"),
        claims=claims,
    )


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update current user",
    responses={
        200: {"description": "Profile updated successfully"},
        401: {"description": "Not authenticated"},
    }
)
async def update_current_user(request: UserProfileUpdate):
    """
    Update the authenticated user's profile.
    
    **Example request:**
    ```json
    {
        "first_name": "Jonathan",
        "phone": "+1-555-999-8888"
    }
    ```
    """
    # TODO: Implement update current user
    raise HTTPException(status_code=501, detail="Not implemented")

