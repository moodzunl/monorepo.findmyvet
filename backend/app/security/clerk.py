"""
Clerk JWT verification for FastAPI.

Frontend usage (Expo + @clerk/clerk-expo):
- Fetch a JWT using `const token = await getToken()` (or `getToken({ template: "backend" })`)
- Call API with header: Authorization: Bearer <token>

Backend verifies signature via Clerk JWKS (RS256) and (optionally) checks issuer/audience.
"""

from __future__ import annotations

from typing import Any
import time

import httpx
from fastapi import Depends, Header, HTTPException, status
from jose import jwk, jwt

from app.config import Settings, get_settings


_JWKS_CACHE: dict[str, Any] = {"jwks": None, "expires_at": 0.0}
_JWKS_TTL_SECONDS = 60 * 10  # 10 minutes


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header (expected: Bearer <token>)",
        )
    return parts[1].strip()


async def _get_jwks(jwks_url: str) -> dict[str, Any]:
    now = time.time()
    cached = _JWKS_CACHE.get("jwks")
    expires_at = float(_JWKS_CACHE.get("expires_at") or 0.0)

    if cached and now < expires_at:
        return cached

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        jwks = resp.json()

    # Cache regardless of content; if it's malformed we'll fail later in a consistent way.
    _JWKS_CACHE["jwks"] = jwks
    _JWKS_CACHE["expires_at"] = now + _JWKS_TTL_SECONDS
    return jwks


def _find_jwk(jwks: dict[str, Any], kid: str) -> dict[str, Any]:
    keys = jwks.get("keys")
    if not isinstance(keys, list):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid JWKS format (missing keys list)",
        )
    for k in keys:
        if isinstance(k, dict) and k.get("kid") == kid:
            return k
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token (unknown signing key)",
    )


async def verify_clerk_jwt(token: str, settings: Settings) -> dict[str, Any]:
    """
    Verify a Clerk-issued JWT (typically RS256) using Clerk JWKS.
    Returns decoded claims on success.
    """
    if not settings.clerk_jwks_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Backend not configured for Clerk auth (CLERK_JWKS_URL missing)",
        )

    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token header",
        )

    kid = header.get("kid")
    alg = header.get("alg")
    if not kid or not isinstance(kid, str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token (kid missing)")
    if alg != "RS256":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token (unsupported alg)")

    jwks = await _get_jwks(settings.clerk_jwks_url)
    jwk_data = _find_jwk(jwks, kid)

    try:
        key = jwk.construct(jwk_data)
        public_key_pem = key.to_pem().decode("utf-8")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to construct verification key from JWKS",
        )

    options = {
        "verify_aud": bool(settings.clerk_audience),
        "verify_iss": bool(settings.clerk_issuer),
    }

    try:
        claims = jwt.decode(
            token,
            public_key_pem,
            algorithms=["RS256"],
            audience=settings.clerk_audience,
            issuer=settings.clerk_issuer,
            options=options,
        )
    except Exception:
        # Keep error generic to avoid leaking auth internals.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    if not isinstance(claims, dict) or not claims.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token (sub missing)")

    return claims


async def require_clerk_auth(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """
    FastAPI dependency: verifies Clerk JWT from Authorization header and returns claims.
    """
    token = _extract_bearer_token(authorization)
    return await verify_clerk_jwt(token, settings)


