from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_item():
    response = client.post(
        "/items/",
        json={"name": "Test Item", "description": "Test Description", "price": 100}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Item"
    assert data["price"] == 100
    assert "id" in data


def test_read_items():
    response = client.get("/items/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_read_item():
    # First create an item
    create_response = client.post(
        "/items/",
        json={"name": "Test Item 2", "description": "Test", "price": 200}
    )
    item_id = create_response.json()["id"]
    
    # Then read it
    response = client.get(f"/items/{item_id}")
    assert response.status_code == 200
    assert response.json()["id"] == item_id


def test_update_item():
    # Create an item
    create_response = client.post(
        "/items/",
        json={"name": "Original Name", "description": "Original", "price": 300}
    )
    item_id = create_response.json()["id"]
    
    # Update it
    response = client.put(
        f"/items/{item_id}",
        json={"name": "Updated Name", "price": 350}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["price"] == 350


def test_delete_item():
    # Create an item
    create_response = client.post(
        "/items/",
        json={"name": "To Delete", "description": "Will be deleted", "price": 400}
    )
    item_id = create_response.json()["id"]
    
    # Delete it
    response = client.delete(f"/items/{item_id}")
    assert response.status_code == 204
    
    # Verify it's deleted
    get_response = client.get(f"/items/{item_id}")
    assert get_response.status_code == 404


def test_item_not_found():
    response = client.get("/items/99999")
    assert response.status_code == 404

