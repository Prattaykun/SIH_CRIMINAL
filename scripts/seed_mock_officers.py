"""Seed named mock investigation officers and attach them to a case team."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from apps.backend.app.core.config import settings
from apps.backend.app.core.security import get_password_hash
from apps.backend.app.db.session import SessionLocal
from apps.backend.app.models.case import Case
from apps.backend.app.models.case_membership import CaseMembership, CaseRole, MembershipStatus
from apps.backend.app.models.user import User, Role

MOCK_OFFICERS = [
    ("insp_ashutosh_rawat", "ashutosh.rawat@sih.internal", "Insp. Ashutosh Rawat"),
    ("si_meera_joshi", "meera.joshi@sih.internal", "SI Meera Joshi"),
    ("asi_vikram_singh", "vikram.singh@sih.internal", "ASI Vikram Singh"),
    ("const_priya_nair", "priya.nair@sih.internal", "Const. Priya Nair"),
    ("dsp_anita_desai", "anita.desai@sih.internal", "DSP Anita Desai"),
]


def seed_mock_officers(case_number: str = "CASE-2024-SYN-666") -> None:
    db = SessionLocal()
    try:
        password = settings.DEFAULT_DEMO_PASSWORD
        hashed = get_password_hash(password)
        officer_ids: list[str] = []

        for username, email, _label in MOCK_OFFICERS:
            user = db.query(User).filter(User.username == username).first()
            if user:
                user.email = email
                user.role = Role.INVESTIGATOR.value
                user.is_active = True
                user.password_hash = hashed
            else:
                user = User(
                    username=username,
                    email=email,
                    password_hash=hashed,
                    role=Role.INVESTIGATOR.value,
                    is_active=True,
                )
                db.add(user)
            db.flush()
            officer_ids.append(user.id)

        db.commit()
        print(f"Seeded {len(officer_ids)} mock officers (password: {password})")

        case = (
            db.query(Case)
            .filter((Case.case_number == case_number) | (Case.id == case_number))
            .first()
        )
        if not case:
            print(f"Case {case_number} not found — officers created but not attached to a case.")
            return

        attached = 0
        for uid in officer_ids:
            membership = (
                db.query(CaseMembership)
                .filter(CaseMembership.case_id == case.id, CaseMembership.user_id == uid)
                .first()
            )
            if membership:
                membership.status = MembershipStatus.ACTIVE.value
                membership.case_role = CaseRole.INVESTIGATOR.value
            else:
                db.add(
                    CaseMembership(
                        case_id=case.id,
                        user_id=uid,
                        case_role=CaseRole.INVESTIGATOR.value,
                        status=MembershipStatus.ACTIVE.value,
                        assigned_at=datetime.now(timezone.utc),
                    )
                )
                attached += 1
        db.commit()
        print(f"Attached officers to {case.case_number} ({case.id}); new memberships={attached}")
    finally:
        db.close()


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "CASE-2024-SYN-666"
    if os.environ.get("APP_ENV", "development").lower() not in ("development", "demo", "dev"):
        print("Refusing to seed outside development/demo")
        sys.exit(1)
    seed_mock_officers(target)
