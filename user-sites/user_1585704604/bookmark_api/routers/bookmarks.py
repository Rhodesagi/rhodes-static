from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
import json
from datetime import datetime

from database import get_db
from dependencies import get_current_active_user, limiter
from models import User, Bookmark, Tag
from schemas import (
    BookmarkCreate, BookmarkUpdate, BookmarkResponse,
    BookmarkImport, BookmarkExport, TagResponse
)

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("/", response_model=List[BookmarkResponse])
@limiter.limit("100/minute")
def list_bookmarks(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    tag_ids: Optional[List[int]] = Query(None),
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's bookmarks with optional tag filtering and search."""
    query = db.query(Bookmark).filter(Bookmark.owner_id == current_user.id)
    
    # Apply tag filtering
    if tag_ids:
        for tag_id in tag_ids:
            query = query.filter(Bookmark.tags.any(Tag.id == tag_id))
    
    # Apply search filter
    if search:
        search_filter = or_(
            Bookmark.title.ilike(f"%{search}%"),
            Bookmark.description.ilike(f"%{search}%"),
            Bookmark.url.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    bookmarks = query.offset(skip).limit(limit).all()
    return bookmarks


@router.post("/", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def create_bookmark(
    request: Request,
    bookmark: BookmarkCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new bookmark."""
    # Create bookmark
    db_bookmark = Bookmark(
        title=bookmark.title,
        url=str(bookmark.url),
        description=bookmark.description,
        owner_id=current_user.id
    )
    
    # Handle tags by IDs
    if bookmark.tag_ids:
        for tag_id in bookmark.tag_ids:
            tag = db.query(Tag).filter(
                and_(Tag.id == tag_id, Tag.owner_id == current_user.id)
            ).first()
            if tag:
                db_bookmark.tags.append(tag)
    
    # Handle tags by names (create if not exists)
    if bookmark.tag_names:
        for tag_name in bookmark.tag_names:
            tag = db.query(Tag).filter(
                and_(Tag.name == tag_name.lower(), Tag.owner_id == current_user.id)
            ).first()
            if not tag:
                tag = Tag(name=tag_name.lower(), owner_id=current_user.id)
                db.add(tag)
                db.flush()
            if tag not in db_bookmark.tags:
                db_bookmark.tags.append(tag)
    
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    
    return db_bookmark


@router.get("/{bookmark_id}", response_model=BookmarkResponse)
@limiter.limit("100/minute")
def get_bookmark(
    request: Request,
    bookmark_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific bookmark by ID."""
    bookmark = db.query(Bookmark).filter(
        and_(Bookmark.id == bookmark_id, Bookmark.owner_id == current_user.id)
    ).first()
    
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    return bookmark


@router.put("/{bookmark_id}", response_model=BookmarkResponse)
@limiter.limit("30/minute")
def update_bookmark(
    request: Request,
    bookmark_id: int,
    bookmark_update: BookmarkUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a bookmark."""
    db_bookmark = db.query(Bookmark).filter(
        and_(Bookmark.id == bookmark_id, Bookmark.owner_id == current_user.id)
    ).first()
    
    if not db_bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    # Update fields
    if bookmark_update.title is not None:
        db_bookmark.title = bookmark_update.title
    if bookmark_update.url is not None:
        db_bookmark.url = str(bookmark_update.url)
    if bookmark_update.description is not None:
        db_bookmark.description = bookmark_update.description
    
    # Update tags by IDs
    if bookmark_update.tag_ids is not None:
        db_bookmark.tags = []
        for tag_id in bookmark_update.tag_ids:
            tag = db.query(Tag).filter(
                and_(Tag.id == tag_id, Tag.owner_id == current_user.id)
            ).first()
            if tag:
                db_bookmark.tags.append(tag)
    
    # Update tags by names
    if bookmark_update.tag_names is not None:
        db_bookmark.tags = []
        for tag_name in bookmark_update.tag_names:
            tag = db.query(Tag).filter(
                and_(Tag.name == tag_name.lower(), Tag.owner_id == current_user.id)
            ).first()
            if not tag:
                tag = Tag(name=tag_name.lower(), owner_id=current_user.id)
                db.add(tag)
                db.flush()
            db_bookmark.tags.append(tag)
    
    db.commit()
    db.refresh(db_bookmark)
    
    return db_bookmark


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
def delete_bookmark(
    request: Request,
    bookmark_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a bookmark."""
    db_bookmark = db.query(Bookmark).filter(
        and_(Bookmark.id == bookmark_id, Bookmark.owner_id == current_user.id)
    ).first()
    
    if not db_bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    db.delete(db_bookmark)
    db.commit()
    
    return None


@router.post("/import", response_model=dict)
@limiter.limit("10/minute")
def import_bookmarks(
    request: Request,
    bookmarks_data: List[BookmarkImport],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import bookmarks from JSON data."""
    imported_count = 0
    errors = []
    
    for idx, bookmark_data in enumerate(bookmarks_data):
        try:
            # Create bookmark
            db_bookmark = Bookmark(
                title=bookmark_data.title,
                url=bookmark_data.url,
                description=bookmark_data.description,
                owner_id=current_user.id
            )
            
            # Handle tags
            for tag_name in bookmark_data.tags:
                tag = db.query(Tag).filter(
                    and_(Tag.name == tag_name.lower(), Tag.owner_id == current_user.id)
                ).first()
                if not tag:
                    tag = Tag(name=tag_name.lower(), owner_id=current_user.id)
                    db.add(tag)
                    db.flush()
                db_bookmark.tags.append(tag)
            
            db.add(db_bookmark)
            imported_count += 1
            
        except Exception as e:
            errors.append({"index": idx, "error": str(e)})
    
    db.commit()
    
    return {
        "imported": imported_count,
        "total": len(bookmarks_data),
        "errors": errors
    }


@router.get("/export/all", response_model=List[BookmarkExport])
@limiter.limit("10/minute")
def export_bookmarks(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export all bookmarks as JSON."""
    bookmarks = db.query(Bookmark).filter(Bookmark.owner_id == current_user.id).all()
    
    export_data = []
    for bookmark in bookmarks:
        export_data.append(BookmarkExport(
            title=bookmark.title,
            url=bookmark.url,
            description=bookmark.description,
            tags=[tag.name for tag in bookmark.tags],
            created_at=bookmark.created_at.isoformat() if bookmark.created_at else None
        ))
    
    return export_data
