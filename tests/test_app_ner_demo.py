from fastapi.testclient import TestClient
from app_ner_demo import app

client = TestClient(app)

def test_health_safe():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "ner_v4" in data["ner_model_version"]
        assert "\\" not in str(data)
        assert "/" not in str(data)
        assert "experimental" in data.get("rf_status", "")

def test_ner_success():
    with TestClient(app) as client:
        response = client.post("/ner", json={"text": "Kavita Srivastava filed a complaint in Mumbai."})
        assert response.status_code == 200
        data = response.json()
        assert "entities" in data
        texts = [e["text"] for e in data["entities"]]
        assert "Kavita Srivastava" in texts
        assert "Mumbai" in texts
        assert "\\" not in str(data)

def test_ner_empty_text():
    with TestClient(app) as client:
        response = client.post("/ner", json={"text": "   "})
        assert response.status_code == 422

def test_ner_malformed_json():
    with TestClient(app) as client:
        response = client.post("/ner", content="{bad json", headers={"Content-Type": "application/json"})
        assert response.status_code == 422
