import sys
from fastapi.routing import APIRoute

sys.path.insert(0, '.')

try:
    from app_ner_demo import app as demo_app
    print("app_ner_demo.py routes:")
    for route in demo_app.routes:
        if isinstance(route, APIRoute):
            print(f"{list(route.methods)} {route.path} -> {route.endpoint.__name__}")
except Exception as e:
    print(f"Error loading app_ner_demo: {e}")

try:
    sys.path.append('.')
    from apps.backend.app.main import app as main_app
    print("\napps.backend.app.main:app routes:")
    for route in main_app.routes:
        if isinstance(route, APIRoute):
            print(f"{list(route.methods)} {route.path} -> {route.endpoint.__name__}")
except Exception as e:
    print(f"Error loading apps.backend.app.main: {e}")
