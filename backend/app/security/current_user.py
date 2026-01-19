"""
Current user dependency:

- Verifies Clerk JWT (already handled by `require_clerk_auth`)
- Upserts a row in `users` table using `clerk_user_id` (token sub)
- Returns the internal User model (UUID primary key)

NOTE: Because our DB schema requires `users.email NOT NULL`, your Clerk JWT template
must include an email claim, e.g.:
{
  "aud": "findmyvet-api",
  "email": "{{user.primary_email_address}}",
  "first_name": "{{user.first_name}}",
  "last_name": "{{user.last_name}}",
  "avatar_url": "{{user.image_url}}"
}
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.user import User
from app.config import Settings, get_settings
from app.security.clerk import require_clerk_auth


def _get_claim(claims: dict[str, Any], *keys: str) -> Any:
    for k in keys:
        if k in claims and claims[k] is not None:
            return claims[k]
    return None


async def upsert_user_from_clerk_claims(
    db: AsyncSession, claims: dict[str, Any], settings: Settings
) -> User:
    clerk_user_id = str(claims.get("sub") or "").strip()
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token (sub missing)")

    email = _get_claim(claims, "email", "primary_email_address")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Token missing email claim. Update your Clerk JWT template claims to include "
                '"email": "{{user.primary_email_address}}".'
            ),
        )

    first_name = _get_claim(claims, "first_name", "firstName")
    last_name = _get_claim(claims, "last_name", "lastName")
    avatar_url = _get_claim(claims, "avatar_url", "image_url")
    now = datetime.utcnow()

    # Try to find by clerk_user_id first, then by email (for linking existing rows).
    existing = (
        await db.execute(
            select(User).where((User.clerk_user_id == clerk_user_id) | (User.email == str(email)))
        )
    ).scalars().first()

    if existing:
        # If email matches an existing user that belongs to a different Clerk user, block.
        if existing.clerk_user_id and existing.clerk_user_id != clerk_user_id:
            # In local/dev environments Clerk users can be recreated, causing the same email to
            # appear under a new Clerk user id. Allow opting into "relink by email" to avoid
            # hard 409 loops during development.
            if settings.debug or settings.allow_clerk_email_relink:
                # Only write if something actually changed (avoid update spam on every request).
                values: dict[str, Any] = {}
                if existing.clerk_user_id != clerk_user_id:
                    values["clerk_user_id"] = clerk_user_id
                if existing.email != str(email):
                    values["email"] = str(email)
                if existing.first_name != first_name:
                    values["first_name"] = first_name
                if existing.last_name != last_name:
                    values["last_name"] = last_name
                if existing.avatar_url != avatar_url:
                    values["avatar_url"] = avatar_url

                if values:
                    values["updated_at"] = now
                    await db.execute(update(User).where(User.id == existing.id).values(**values))
                    await db.commit()
                    await db.refresh(existing)
                return existing

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already linked to a different account.",
            )

        # Link clerk_user_id if missing and update profile fields (only when changed).
        values: dict[str, Any] = {}
        if existing.clerk_user_id != clerk_user_id:
            values["clerk_user_id"] = clerk_user_id
        if existing.email != str(email):
            values["email"] = str(email)
        if existing.first_name != first_name:
            values["first_name"] = first_name
        if existing.last_name != last_name:
            values["last_name"] = last_name
        if existing.avatar_url != avatar_url:
            values["avatar_url"] = avatar_url

        if values:
            values["updated_at"] = now
            await db.execute(update(User).where(User.id == existing.id).values(**values))
            await db.commit()
            await db.refresh(existing)
        return existing

    # Create new user row
    user = User(
        clerk_user_id=clerk_user_id,
        email=str(email),
        first_name=first_name,
        last_name=last_name,
        avatar_url=avatar_url,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_current_user(
    claims: Annotated[dict[str, Any], Depends(require_clerk_auth)],
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
    return await upsert_user_from_clerk_claims(db, claims, settings)


