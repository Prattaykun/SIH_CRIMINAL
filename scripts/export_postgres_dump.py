"""Export local database to a PostgreSQL-compatible SQL dump file (postgres_dump.sql)."""

import os
import sys
import sqlite3
import json
from datetime import datetime, timezone

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

# Import Base and all models to ensure complete metadata registration
from apps.backend.app.db.base import Base
import apps.backend.app.models.user
import apps.backend.app.models.case
import apps.backend.app.models.document
import apps.backend.app.models.entity
import apps.backend.app.models.relationship
import apps.backend.app.models.processing_job
import apps.backend.app.models.alert
import apps.backend.app.models.feedback
import apps.backend.app.models.audit_log
import apps.backend.app.models.case_access
import apps.backend.app.models.extraction_run
import apps.backend.app.models.extraction_model
import apps.backend.app.models.ml
import apps.backend.app.models.analytics

def format_sql_value(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (dict, list)):
        escaped = json.dumps(val).replace("'", "''")
        return f"'{escaped}'"
    # String
    val_str = str(val)
    # If it's a numeric 0/1 representing boolean in SQLite but column is boolean
    escaped = val_str.replace("'", "''")
    return f"'{escaped}'"

def generate_pg_dump(sqlite_db_path: str, output_sql_path: str):
    print(f"Connecting to SQLite database at {sqlite_db_path}...")
    conn = sqlite3.connect(sqlite_db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Get list of existing tables in SQLite
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    existing_tables = set(row[0] for row in cur.fetchall())

    lines = []
    lines.append("--")
    lines.append("-- PostgreSQL Database Dump")
    lines.append("-- SIH 26189 AI-Assisted Criminal Network Analysis System")
    lines.append(f"-- Dump generated at: {datetime.now(timezone.utc).isoformat()}")
    lines.append("-- Source database: SQLite / sih_dev.db")
    lines.append("-- Target engine: PostgreSQL 14+ / 15+ / 16+")
    lines.append("--")
    lines.append("")
    lines.append("SET statement_timeout = 0;")
    lines.append("SET lock_timeout = 0;")
    lines.append("SET idle_in_transaction_session_timeout = 0;")
    lines.append("SET client_encoding = 'UTF8';")
    lines.append("SET standard_conforming_strings = on;")
    lines.append("SELECT pg_catalog.set_config('search_path', 'public', false);")
    lines.append("SET check_function_bodies = false;")
    lines.append("SET xmloption = content;")
    lines.append("SET client_min_messages = warning;")
    lines.append("SET row_security = off;")
    lines.append("")
    lines.append("CREATE SCHEMA IF NOT EXISTS public;")
    lines.append("")

    # Drop existing tables in reverse order for clean re-import
    sorted_tables = list(Base.metadata.sorted_tables)
    lines.append("--")
    lines.append("-- Drop existing tables (clean import)")
    lines.append("--")
    for table in reversed(sorted_tables):
        if table.name in existing_tables:
            lines.append(f"DROP TABLE IF EXISTS public.{table.name} CASCADE;")
    lines.append("")

    # Create Tables with PostgreSQL DDL
    lines.append("--")
    lines.append("-- Table Schemas (PostgreSQL Dialect DDL)")
    lines.append("--")
    for table in sorted_tables:
        if table.name in existing_tables:
            ddl = str(CreateTable(table).compile(dialect=postgresql.dialect())).strip()
            if not ddl.endswith(";"):
                ddl += ";"
            lines.append(ddl)
            lines.append("")

    # Insert Data
    lines.append("--")
    lines.append("-- Table Data Inserts")
    lines.append("--")
    
    total_rows = 0
    for table in sorted_tables:
        table_name = table.name
        if table_name not in existing_tables:
            continue

        cur.execute(f"SELECT * FROM {table_name};")
        rows = cur.fetchall()
        if not rows:
            continue

        col_names = [col[0] for col in cur.description]
        col_list_str = ", ".join(f'"{c}"' for c in col_names)

        lines.append(f"-- Data for Name: {table_name}; Type: TABLE DATA; Rows: {len(rows)}")
        
        # Batch inserts in chunks
        chunk_size = 50
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i:i + chunk_size]
            value_rows = []
            for row in chunk:
                formatted_vals = []
                for val in row:
                    formatted_vals.append(format_sql_value(val))
                value_rows.append(f"({', '.join(formatted_vals)})")

            insert_stmt = f"INSERT INTO public.{table_name} ({col_list_str}) VALUES\n  " + ",\n  ".join(value_rows) + ";"
            lines.append(insert_stmt)
            lines.append("")
        
        total_rows += len(rows)
        print(f"Exported {len(rows)} rows from {table_name}")

    conn.close()

    lines.append("--")
    lines.append(f"-- Completed PostgreSQL database dump. Total rows: {total_rows}")
    lines.append("--")
    lines.append("")

    with open(output_sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\nSuccessfully generated PostgreSQL dump at: {output_sql_path}")
    print(f"Total rows exported: {total_rows}")

if __name__ == "__main__":
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sih_dev.db")
    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "postgres_dump.sql")
    generate_pg_dump(db_path, out_path)
