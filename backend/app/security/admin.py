"""
Admin Security Dependency
Enforces that the current user is an admin based on email whitelist.
"""
from typing import Annotated
from fastapi import Depends, HTTPException, status

from app.config import Settings, get_settings
from app.models.user import User
from app.security.current_user import get_current_user

async def require_admin(
    user: Annotated[User, Depends(get_current_user)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
    """
    Dependency that raises 403 if the authenticated user is not an admin.
    """
    if user.email != settings.admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user

