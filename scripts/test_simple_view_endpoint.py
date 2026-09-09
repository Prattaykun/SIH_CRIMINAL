import os
import sys

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force synchronous sqlite driver for testing script
os.environ["DATABASE_URL"] = "sqlite:///sih_dev.db"

from fastapi.testclient import TestClient
from apps.backend.app.main import app
from apps.backend.app.db.session import SessionLocal
from apps.backend.app.models.case import Case
from apps.backend.app.api.deps import get_current_active_user

# Mock authentication
class MockUser:
    id = "test_user_id"
    email = "test@example.com"
    role = "admin"
    is_active = True
    is_superuser = True

def override_get_current_active_user():
    return MockUser()

app.dependency_overrides[get_current_active_user] = override_get_current_active_user

def main():
    client = TestClient(app)
    db = SessionLocal()
    
    try:
        cases = db.query(Case).all()
        # Group by case type
        case_by_type = {}
        for c in cases:
            case_type = getattr(c, "case_type", "investigation")
            # Only keep one per type
            if case_type not in case_by_type:
                case_by_type[case_type] = c
                
        print(f"Found {len(case_by_type)} distinct case types for testing:")
        for t, c in case_by_type.items():
            print(f"  - {t}: {c.id}")
            
        print("\n" + "="*120)
        print(f"{'Case ID':<38} | {'Type':<15} | {'Status':<10} | {'Docs':<5} | {'Entities':<8} | {'Rels':<5} | {'Events':<6} | {'Nodes':<6} | {'Insights':<8}")
        print("-" * 120)
        
        for case_type, case in case_by_type.items():
            response = client.get(f"/api/v1/cases/{case.id}/simple")
            if response.status_code != 200:
                print(f"Error fetching {case.id}: {response.status_code} - {response.text}")
                continue
                
            data = response.json()
            
            # Validations
            assert data["case_id"] == str(case.id)
            assert "title" in data
            assert "case_type" in data
            assert "summary" in data
            
            stats = data.get("stats", {})
            doc_count = stats.get("documents_processed", 0)
            ent_count = stats.get("entities_identified", 0)
            rel_count = stats.get("relationships_extracted", 0)
            insight_count = stats.get("key_insights_generated", 0)
            
            assert doc_count >= 0
            assert ent_count >= 0
            assert rel_count >= 0
            assert insight_count >= 0
            
            graph = data.get("simplified_graph", {})
            nodes = graph.get("nodes", [])
            edges = graph.get("edges", [])
            assert len(nodes) <= 8
            
            # Verify edges refer to valid nodes
            node_ids = {n["id"] for n in nodes}
            for e in edges:
                assert e["source"] in node_ids
                assert e["target"] in node_ids
                
            timeline = data.get("timeline", [])
            # Verify chronological sort (string comparison works for YYYY-MM-DD)
            dates = [ev.get("date", "") for ev in timeline]
            assert dates == sorted(dates)
            
            # Verify no duplicates
            timeline_keys = [(ev.get("title"), ev.get("description"), ev.get("date"), ev.get("time")) for ev in timeline]
            assert len(timeline_keys) == len(set(timeline_keys))
            
            # Verify summary language
            summary = data.get("summary", "")
            assert "a investigation" not in summary
            assert "victim(s)" not in summary
            assert "suspect(s)" not in summary
            assert "is/are" not in summary
            
            # Verify disclaimer if insights exist
            insights = data.get("ai_insights", [])
            disclaimer = "AI-generated observations are based on available case records and require investigator verification."
            if insights:
                disclaimer_count = insights.count(disclaimer)
                assert disclaimer_count == 1, f"Expected 1 disclaimer, found {disclaimer_count}"
            
            print(f"{case.id:<38} | {data.get('case_type'):<15} | {case.status:<10} | {doc_count:<5} | {ent_count:<8} | {rel_count:<5} | {len(timeline):<6} | {len(nodes):<6} | {len(insights):<8}")
            
        print("="*120)
        print("All validations passed!")
        
    except Exception as e:
        print(f"Validation failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
