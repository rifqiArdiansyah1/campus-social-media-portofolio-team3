from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_not_found_standard_contract():
    res = client.get("/api/v1/non-existent-route-999")
    assert res.status_code == 404
    data = res.json()
    assert "detail" in data
    assert data["code"] == "NOT_FOUND"


def test_method_not_allowed_standard_contract():
    res = client.post("/health")
    assert res.status_code == 405
    data = res.json()
    assert "detail" in data
    assert data["code"] == "METHOD_NOT_ALLOWED"


def test_validation_error_contract():
    # Calling POST /api/v1/moderation/check with empty payload (triggers 422)
    res = client.post("/api/v1/moderation/check", json={})
    assert res.status_code == 422
    data = res.json()
    assert data["code"] == "VALIDATION_ERROR"
    assert "errors" in data
    assert isinstance(data["errors"], list)
