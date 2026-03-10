import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import Base, get_db
from auth import get_password_hash
from models import User, Bookmark, Tag

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def client():
    """Create a test client with fresh database."""
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_user(client):
    """Create a test user and return credentials."""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123"
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    return user_data


@pytest.fixture(scope="function")
def auth_token(client, test_user):
    """Get authentication token for test user."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_user["username"], "password": test_user["password"]}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture(scope="function")
def auth_headers(auth_token):
    """Get authentication headers."""
    return {"Authorization": f"Bearer {auth_token}"}


# ============== Authentication Tests ==============

class TestAuthentication:
    def test_register_user_success(self, client):
        """Test successful user registration."""
        response = client.post("/api/v1/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "password123"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@example.com"
        assert "id" in data
        assert "hashed_password" not in data

    def test_register_duplicate_username(self, client, test_user):
        """Test registration with duplicate username."""
        response = client.post("/api/v1/auth/register", json={
            "username": "testuser",
            "email": "different@example.com",
            "password": "password123"
        })
        assert response.status_code == 400
        assert "Username already registered" in response.json()["detail"]

    def test_register_duplicate_email(self, client, test_user):
        """Test registration with duplicate email."""
        response = client.post("/api/v1/auth/register", json={
            "username": "differentuser",
            "email": "test@example.com",
            "password": "password123"
        })
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    def test_register_invalid_data(self, client):
        """Test registration with invalid data."""
        # Short password
        response = client.post("/api/v1/auth/register", json={
            "username": "user",
            "email": "invalid",
            "password": "123"
        })
        assert response.status_code == 422

    def test_login_success(self, client, test_user):
        """Test successful login."""
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "testpassword123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client, test_user):
        """Test login with invalid credentials."""
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user."""
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "nonexistent", "password": "password"}
        )
        assert response.status_code == 401

    def test_get_current_user(self, client, auth_headers):
        """Test getting current user info."""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"


# ============== Bookmark Tests ==============

class TestBookmarks:
    def test_create_bookmark_success(self, client, auth_headers):
        """Test creating a bookmark."""
        response = client.post("/api/v1/bookmarks/", headers=auth_headers, json={
            "title": "Test Bookmark",
            "url": "https://example.com",
            "description": "A test bookmark"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Bookmark"
        assert data["url"] == "https://example.com/"
        assert data["description"] == "A test bookmark"
        assert "id" in data

    def test_create_bookmark_with_tags(self, client, auth_headers):
        """Test creating a bookmark with tags."""
        response = client.post("/api/v1/bookmarks/", headers=auth_headers, json={
            "title": "Tagged Bookmark",
            "url": "https://example.com/tagged",
            "description": "A tagged bookmark",
            "tag_names": ["python", "web"]
        })
        assert response.status_code == 201
        data = response.json()
        assert len(data["tags"]) == 2
        tag_names = [tag["name"] for tag in data["tags"]]
        assert "python" in tag_names
        assert "web" in tag_names

    def test_create_bookmark_unauthorized(self, client):
        """Test creating bookmark without authentication."""
        response = client.post("/api/v1/bookmarks/", json={
            "title": "Test",
            "url": "https://example.com"
        })
        assert response.status_code == 401

    def test_list_bookmarks(self, client, auth_headers):
        """Test listing bookmarks."""
        # Create some bookmarks
        for i in range(3):
            client.post("/api/v1/bookmarks/", headers=auth_headers, json={
                "title": f"Bookmark {i}",
                "url": f"https://example.com/{i}"
            })
        
        response = client.get("/api/v1/bookmarks/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_list_bookmarks_with_pagination(self, client, auth_headers):
        """Test bookmark pagination."""
        # Create bookmarks
        for i in range(5):
            client.post("/api/v1/bookmarks/", headers=auth_headers, json={
                "title": f"Bookmark {i}",
                "url": f"https://example.com/{i}"
            })
        
        # Test skip
        response = client.get("/api/v1/bookmarks/?skip=2&limit=2", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_list_bookmarks_with_search(self, client, auth_headers):
        """Test searching bookmarks."""
        client.post("/api/v1/bookmarks/", headers=auth_headers, json={
            "title": "Python Tutorial",
            "url": "https://python.org"
        })
        client.post("/api/v1/bookmarks/", headers=auth_headers, json={
            "title": "JavaScript Guide",
            "url": "https://js.org"
        })
        
        response = client.get("/api/v1/bookmarks/?search=python", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Python Tutorial"

    def test_list_bookmarks_with_tag_filter(self, client, auth_headers):
        """Test filtering bookmarks by tag."""
        # Create tag
        tag_response = client.post("/api/v1/tags/", headers=auth_headers, json={
            "name": "important"
        })
        tag_id = tag_response.json()["id"]
        
        # Create bookmarks
        client.post("/api/v1/bookmarks/", headers=auth_headers, json={
            "title": "Important Bookmark",
            "url": "https://important.com",
            "tag_ids": [tag_id]
        })
        client.post("/api/v1/bookmarks/", headers=auth_headers, json={
            "title": "Regular Bookmark",
            "url": "https://regular.com"
        })
        
        # Filter by tag
        response = client.get(f"/api/v1/bookmarks/?tag_ids={tag_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Important Bookmark"

    def test_get_bookmark(self, client, auth_headers):
        """Test getting a specific bookmark."""
        create_response = client.post("/api/v1/bookmarks/", headers=auth_headers, json={
            "title": "Test",
            "url": "https://test.com"
        })
        bookmark_id = create_response.json()["id"]
        
        response = client.get(f"/api/v1/bookmarks/{bookmark_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test"

    def test_get_nonexistent_bookmark(self, client, auth_headers):
        """Test getting a bookmark that doesn't exist."""
        response = client.get("/api/v1/bookmarks/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_update_bookmark(self, client, auth_headers):
        """Test updating a bookmark."""
        create_response = client.post("/api/v1/bookmarks/", headers=auth_headers, json={
            "title": "Original",
            "url": "https://original.com"
        })
        bookmark_id = create_response.json()["id"]
        
        response = client.put(f"/api/v1/bookmarks/{bookmark_id}", headers=auth_headers, json={
            "title": "Updated",
            "url": "https://updated.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated"
        assert data["url"] == "https://updated.com/"

    def test_update_nonexistent_bookmark(self, client, auth_headers):
        """Test updating a bookmark that doesn't exist."""
        response = client.put("/api/v1/bookmarks/99999", headers=auth_headers, json={
            "title": "Updated"
        })
        assert response.status_code == 404

    def test_delete_bookmark(self, client, auth_headers):
        """Test deleting a bookmark."""
        create_response = client.post("/api/v1/bookmarks/", headers=auth_headers, json={
            "title": "To Delete",
            "url": "https://delete.com"
        })
        bookmark_id = create_response.json()["id"]
        
        response = client.delete(f"/api/v1/bookmarks/{bookmark_id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Verify it's gone
        get_response = client.get(f"/api/v1/bookmarks/{bookmark_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_nonexistent_bookmark(self, client, auth_headers):
        """Test deleting a bookmark that doesn't exist."""
        response = client.delete("/api/v1/bookmarks/99999", headers=auth_headers)
        assert response.status_code == 404


# ============== Tag Tests ==============

class TestTags:
    def test_create_tag(self, client, auth_headers):
        """Test creating a tag."""
        response = client.post("/api/v1/tags/", headers=auth_headers, json={
            "name": "python"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "python"
        assert "id" in data

    def test_create_duplicate_tag(self, client, auth_headers):
        """Test creating duplicate tag."""
        client.post("/api/v1/tags/", headers=auth_headers, json={"name": "unique"})
        response = client.post("/api/v1/tags/", headers=auth_headers, json={"name": "unique"})
        assert response.status_code == 400

    def test_list_tags(self, client, auth_headers):
        """Test listing tags."""
        for name in ["tag1", "tag2", "tag3"]:
            client.post("/api/v1/tags/", headers=auth_headers, json={"name": name})
        
        response = client.get("/api/v1/tags/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_get_tag(self, client, auth_headers):
        """Test getting a specific tag."""
        create_response = client.post("/api/v1/tags/", headers=auth_headers, json={
            "name": "testtag"
        })
        tag_id = create_response.json()["id"]
        
        response = client.get(f"/api/v1/tags/{tag_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "testtag"

    def test_update_tag(self, client, auth_headers):
        """Test updating a tag."""
        create_response = client.post("/api/v1/tags/", headers=auth_headers, json={
            "name": "oldname"
        })
        tag_id = create_response.json()["id"]
        
        response = client.put(f"/api/v1/tags/{tag_id}", headers=auth_headers, json={
            "name": "newname"
        })
        assert response.status_code == 200
        assert response.json()["name"] == "newname"

    def test_delete_tag(self, client, auth_headers):
        """Test deleting a tag."""
        create_response = client.post("/api/v1/tags/", headers=auth_headers, json={
            "name": "todelete"
        })
        tag_id = create_response.json()["id"]
        
        response = client.delete(f"/api/v1/tags/{tag_id}", headers=auth_headers)
        assert response.status_code == 204


# ============== Import/Export Tests ==============

class TestImportExport:
    def test_export_bookmarks(self, client, auth_headers):
        """Test exporting bookmarks."""
        # Create bookmark with tags
        client.post("/api/v1/bookmarks/", headers=auth_headers, json={
            "title": "Export Test",
            "url": "https://export.com",
            "tag_names": ["export"]
        })
        
        response = client.get("/api/v1/bookmarks/export/all", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Export Test"
        assert "export" in data[0]["tags"]

    def test_import_bookmarks(self, client, auth_headers):
        """Test importing bookmarks."""
        import_data = [
            {
                "title": "Imported 1",
                "url": "https://import1.com",
                "description": "First import",
                "tags": ["imported"]
            },
            {
                "title": "Imported 2",
                "url": "https://import2.com",
                "tags": ["imported", "test"]
            }
        ]
        
        response = client.post("/api/v1/bookmarks/import", headers=auth_headers, json=import_data)
        assert response.status_code == 200
        data = response.json()
        assert data["imported"] == 2
        assert data["total"] == 2

    def test_import_with_invalid_data(self, client, auth_headers):
        """Test import with some invalid data."""
        import_data = [
            {"title": "Valid", "url": "https://valid.com"},
            {"title": "", "url": "not-a-url"}  # Invalid
        ]
        
        response = client.post("/api/v1/bookmarks/import", headers=auth_headers, json=import_data)
        assert response.status_code == 200
        data = response.json()
        assert data["imported"] == 1
        assert len(data["errors"]) == 1


# ============== Root and Health Tests ==============

class TestRootAndHealth:
    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "Bookmark Manager API" in data["message"]
        assert "version" in data

    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


# ============== Error Handling Tests ==============

class TestErrorHandling:
    def test_invalid_json(self, client):
        """Test handling of invalid JSON."""
        response = client.post(
            "/api/v1/auth/register",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

    def test_unauthorized_access(self, client):
        """Test accessing protected endpoint without auth."""
        response = client.get("/api/v1/bookmarks/")
        assert response.status_code == 401

    def test_invalid_token(self, client):
        """Test with invalid token."""
        response = client.get(
            "/api/v1/bookmarks/",
            headers={"Authorization": "Bearer invalidtoken"}
        )
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
