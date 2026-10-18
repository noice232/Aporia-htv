from __future__ import annotations

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.workspace import User


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Demo-safe bearer token auth.

    Reads ``Authorization: Bearer <user_id>`` and looks up the User row.
    Returns 401 if the header is missing or the user is not found.
    """
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    user_id = auth[len("Bearer "):]
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
