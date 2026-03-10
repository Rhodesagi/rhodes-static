from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List

from database import get_db
from dependencies import get_current_active_user, limiter
from models import User, Tag, Bookmark
from schemas import TagCreate, TagResponse

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=List[TagResponse])
@limiter.limit("100/minute")
def list_tags(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all tags for the current user."""
    tags = db.query(Tag).filter(
        Tag.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return tags


@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def create_tag(
    request: Request,
    tag: TagCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new tag."""
    # Check if tag already exists for this user
    existing_tag = db.query(Tag).filter(
        and_(Tag.name == tag.name.lower(), Tag.owner_id == current_user.id)
    ).first()
    
    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag already exists"
        )
    
    db_tag = Tag(name=tag.name.lower(), owner_id=current_user.id)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    
    return db_tag


@router.get("/{tag_id}", response_model=TagResponse)
@limiter.limit("100/minute")
def get_tag(
    request: Request,
    tag_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific tag by ID."""
    tag = db.query(Tag).filter(
        and_(Tag.id == tag_id, Tag.owner_id == current_user.id)
    ).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    return tag


@router.put("/{tag_id}", response_model=TagResponse)
@limiter.limit("30/minute")
def update_tag(
    request: Request,
    tag_id: int,
    tag_update: TagCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a tag's name."""
    db_tag = db.query(Tag).filter(
        and_(Tag.id == tag_id, Tag.owner_id == current_user.id)
    ).first()
    
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    # Check if new name already exists
    if tag_update.name.lower() != db_tag.name:
        existing = db.query(Tag).filter(
            and_(Tag.name == tag_update.name.lower(), Tag.owner_id == current_user.id)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag with this name already exists"
            )
    
    db_tag.name = tag_update.name.lower()
    db.commit()
    db.refresh(db_tag)
    
    return db_tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
def delete_tag(
    request: Request,
    tag_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a tag."""
    db_tag = db.query(Tag).filter(
        and_(Tag.id == tag_id, Tag.owner_id == current_user.id)
    ).first()
    
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    db.delete(db_tag)
    db.commit()
    
    return None


@router.get("/{tag_id}/bookmarks", response_model=List[dict])
@limiter.limit("100/minute")
def get_tag_bookmarks(
    request: Request,
    tag_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all bookmarks with a specific tag."""
    tag = db.query(Tag).filter(
        and_(Tag.id == tag_id, Tag.owner_id == current_user.id)
    ).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    bookmarks = db.query(Bookmark).filter(
        and_(Bookmark.owner_id == current_user.id, Bookmark.tags.any(Tag.id == tag_id))
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": b.id,
            "title": b.title,
            "url": b.url,
            "description": b.description,
            "created_at": b.created_at.isoformat() if b.created_at else None
        }
        for b in bookmarks
    ]
