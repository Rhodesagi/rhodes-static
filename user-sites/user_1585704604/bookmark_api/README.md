# Bookmark Manager API

A REST API built with FastAPI for managing bookmarks with tags, authentication, and import/export functionality.

## Features

- **Authentication**: JWT-based authentication with registration and login
- **Bookmark Management**: Full CRUD operations for bookmarks
- **Tagging System**: Organize bookmarks with tags (many-to-many relationship)
- **Search & Filter**: Search bookmarks by title, URL, or description; filter by tags
- **Import/Export**: Import and export bookmarks as JSON
- **Rate Limiting**: Per-user rate limiting to prevent abuse
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Testing**: Full test suite using pytest

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info

### Bookmarks
- `GET /api/v1/bookmarks/` - List all bookmarks (with pagination, search, tag filtering)
- `POST /api/v1/bookmarks/` - Create a new bookmark
- `GET /api/v1/bookmarks/{id}` - Get a specific bookmark
- `PUT /api/v1/bookmarks/{id}` - Update a bookmark
- `DELETE /api/v1/bookmarks/{id}` - Delete a bookmark
- `GET /api/v1/bookmarks/export/all` - Export all bookmarks as JSON
- `POST /api/v1/bookmarks/import` - Import bookmarks from JSON

### Tags
- `GET /api/v1/tags/` - List all tags
- `POST /api/v1/tags/` - Create a new tag
- `GET /api/v1/tags/{id}` - Get a specific tag
- `PUT /api/v1/tags/{id}` - Update a tag
- `DELETE /api/v1/tags/{id}` - Delete a tag
- `GET /api/v1/tags/{id}/bookmarks` - Get all bookmarks with a specific tag

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8901`

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8901/docs`
- ReDoc: `http://localhost:8901/redoc`

## Testing

Run the test suite:
```bash
pytest test_main.py -v
```

## Example Usage

### Register a User
```bash
curl -X POST http://localhost:8901/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:8901/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john&password=password123"
```

### Create a Bookmark
```bash
curl -X POST http://localhost:8901/api/v1/bookmarks/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Python Docs","url":"https://python.org","tag_names":["python","docs"]}'
```

### Export Bookmarks
```bash
curl http://localhost:8901/api/v1/bookmarks/export/all \
  -H "Authorization: Bearer <token>"
```

## Database

The application uses SQLite by default. The database file (`bookmarks.db`) is created automatically on startup.

## Configuration

Configuration is handled through environment variables or a `.env` file:

- `DATABASE_URL` - Database connection URL
- `SECRET_KEY` - JWT secret key
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time
- `RATE_LIMIT_REQUESTS` - Requests per rate limit period
- `RATE_LIMIT_PERIOD` - Rate limit period in seconds
