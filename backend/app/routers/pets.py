"""
Pet Endpoints

POST   /api/v1/pets          - Create a new pet for the current user
GET    /api/v1/pets          - List current user's pets
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db import get_db
from app.models.user import User
from app.security.current_user import get_current_user
from app.schemas.pets import PetCreateRequest, PetOut, PetListResponse


router = APIRouter()


async def _upsert_species(db: AsyncSession, species_name: str) -> int:
    row = (
        await db.execute(
            text("SELECT id FROM species WHERE LOWER(name) = LOWER(:name)"),
            {"name": species_name},
        )
    ).mappings().first()
    if row:
        return int(row["id"])

    created = (
        await db.execute(
            text("INSERT INTO species (name, is_active) VALUES (:name, TRUE) RETURNING id"),
            {"name": species_name},
        )
    ).mappings().first()
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create species")
    return int(created["id"])


async def _upsert_breed(db: AsyncSession, species_id: int, breed_name: str) -> int:
    row = (
        await db.execute(
            text(
                "SELECT id FROM breeds WHERE species_id = :species_id AND LOWER(name) = LOWER(:name)"
            ),
            {"species_id": species_id, "name": breed_name},
        )
    ).mappings().first()
    if row:
        return int(row["id"])

    created = (
        await db.execute(
            text(
                "INSERT INTO breeds (species_id, name) VALUES (:species_id, :name) RETURNING id"
            ),
            {"species_id": species_id, "name": breed_name},
        )
    ).mappings().first()
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create breed")
    return int(created["id"])


async def _load_pet(db: AsyncSession, pet_id: str) -> PetOut:
    row = (
        await db.execute(
            text(
                """
                SELECT
                  p.id,
                  p.owner_id,
                  p.name,
                  p.date_of_birth,
                  p.weight_kg,
                  p.sex,
                  p.is_neutered,
                  p.photo_url,
                  p.notes,
                  p.created_at,
                  p.updated_at,
                  s.id AS species_id,
                  s.name AS species_name,
                  b.id AS breed_id,
                  b.name AS breed_name
                FROM pets p
                JOIN species s ON s.id = p.species_id
                LEFT JOIN breeds b ON b.id = p.breed_id
                WHERE p.id = :pet_id AND p.deleted_at IS NULL
                """
            ),
            {"pet_id": pet_id},
        )
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Pet not found")

    breed = None
    if row["breed_id"] is not None:
        breed = {"id": row["breed_id"], "species_id": row["species_id"], "name": row["breed_name"]}

    return PetOut(
        id=row["id"],
        owner_id=row["owner_id"],
        name=row["name"],
        species={"id": row["species_id"], "name": row["species_name"]},
        breed=breed,
        date_of_birth=row["date_of_birth"],
        weight_kg=float(row["weight_kg"]) if row["weight_kg"] is not None else None,
        sex=row["sex"],
        is_neutered=row["is_neutered"],
        photo_url=row["photo_url"],
        notes=row["notes"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.post(
    "",
    response_model=PetOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create pet",
)
async def create_pet(
    request: PetCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    species_id = await _upsert_species(db, request.species_name.strip())
    breed_id = None
    if request.breed_name and request.breed_name.strip():
        breed_id = await _upsert_breed(db, species_id, request.breed_name.strip())

    created = (
        await db.execute(
            text(
                """
                INSERT INTO pets (
                  owner_id, name, species_id, breed_id, date_of_birth, weight_kg, sex,
                  is_neutered, photo_url, notes
                ) VALUES (
                  :owner_id, :name, :species_id, :breed_id, :date_of_birth, :weight_kg, :sex,
                  :is_neutered, :photo_url, :notes
                )
                RETURNING id
                """
            ),
            {
                "owner_id": str(user.id),
                "name": request.name.strip(),
                "species_id": species_id,
                "breed_id": breed_id,
                "date_of_birth": request.date_of_birth,
                "weight_kg": request.weight_kg,
                "sex": request.sex,
                "is_neutered": request.is_neutered,
                "photo_url": request.photo_url,
                "notes": request.notes,
            },
        )
    ).mappings().first()
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create pet")

    await db.commit()
    return await _load_pet(db, str(created["id"]))


@router.get(
    "",
    response_model=PetListResponse,
    summary="List pets",
)
async def list_pets(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        await db.execute(
            text(
                """
                SELECT p.id
                FROM pets p
                WHERE p.owner_id = :owner_id AND p.deleted_at IS NULL
                ORDER BY p.created_at DESC
                """
            ),
            {"owner_id": str(user.id)},
        )
    ).mappings().all()

    pets = [await _load_pet(db, str(r["id"])) for r in rows]
    return PetListResponse(pets=pets)


