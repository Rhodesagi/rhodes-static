from pydantic import BaseModel, EmailStr, HttpUrl, Field, ConfigDict
from typing import List, Optional
from datetime import datetime


# ============== User Schemas ==============

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool
    created_at: datetime


# ============== Tag Schemas ==============

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime


class TagWithBookmarks(TagResponse):
    bookmarks: List["BookmarkResponse"] = []


# ============== Bookmark Schemas ==============

class BookmarkBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    url: HttpUrl
    description: Optional[str] = Field(None, max_length=2000)


class BookmarkCreate(BookmarkBase):
    tag_ids: Optional[List[int]] = []
    tag_names: Optional[List[str]] = []


class BookmarkUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[HttpUrl] = None
    description: Optional[str] = Field(None, max_length=2000)
    tag_ids: Optional[List[int]] = None
    tag_names: Optional[List[str]] = None


class BookmarkResponse(BookmarkBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    tags: List[TagResponse] = []


# ============== Import/Export Schemas ==============

class BookmarkExport(BaseModel):
    title: str
    url: str
    description: Optional[str] = None
    tags: List[str] = []
    created_at: Optional[str] = None


class BookmarkImport(BaseModel):
    title: str = Field(..., min_length=1)
    url: str = Field(..., pattern=r'^https?://')
    description: Optional[str] = None
    tags: List[str] = []


# ============== Auth Schemas ==============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


# ============== Error Schemas ==============

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None


class ValidationError(BaseModel):
    loc: List[str]
    msg: str
    type: str


class ValidationErrorResponse(BaseModel):
    detail: List[ValidationError]
