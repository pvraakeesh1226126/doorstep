#!/usr/bin/env python3
"""
TORQWASH PRO - Supabase Schema Migration & Verification Runner
Executes the approved database migration via Supabase Management API or Postgres,
and verifies tables, constraints, and relationships.
"""

import os
import sys
import json
import urllib.request
import urllib.error

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIGRATION_FILE = os.path.join(PROJECT_ROOT, "supabase", "migrations", "20261006000000_create_torqwash_schema.sql")

EXPECTED_TABLES = [
    "profiles",
    "vehicles",
    "addresses",
    "category_multipliers",
    "services",
    "addons",
    "subscription_plans",
    "user_subscriptions",
    "specialists",
    "coupons",
    "bookings",
    "booking_addons",
    "reviews",
    "complaints",
    "feedbacks",
    "notifications",
    "support_tickets"
]

def load_env():
    """Load key-value pairs from .env if present."""
    env_file = os.path.join(PROJECT_ROOT, ".env")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key and key not in os.environ:
                        os.environ[key] = val

def execute_query_via_api(project_ref, access_token, query_sql):
    """Execute raw SQL using Supabase Management API."""
    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "User-Agent": "TorqWash-Migration/1.0"
    }
    payload = json.dumps({"query": query_sql}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body) if body else []
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
            msg = err_json.get("message") or err_json.get("error") or err_body
        except Exception:
            msg = err_body
        return e.code, {"error": msg}
    except Exception as e:
        return 500, {"error": str(e)}

def verify_schema(project_ref, access_token):
    """Run verification checks on tables, foreign keys, and indexes."""
    print("\n" + "=" * 60)
    print(" 🔍 RUNNING POST-MIGRATION VERIFICATION CHECKS")
    print("=" * 60)

    # 1. Verify Tables
    table_query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """
    code, res = execute_query_via_api(project_ref, access_token, table_query)
    if code != 200:
        print(f"❌ Failed to query tables: {res}")
        return False

    existing_tables = set(row.get("table_name") for row in res) if isinstance(res, list) else set()
    print("\n[1/3] Table Verification:")
    all_tables_ok = True
    for tbl in EXPECTED_TABLES:
        if tbl in existing_tables:
            print(f"  ✅ Table created: {tbl}")
        else:
            print(f"  ❌ Missing table: {tbl}")
            all_tables_ok = False

    # 2. Verify Foreign Keys
    fk_query = """
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
    """
    code, res_fk = execute_query_via_api(project_ref, access_token, fk_query)
    print("\n[2/3] Foreign Key Relationship Verification:")
    if code == 200 and isinstance(res_fk, list):
        print(f"  Total foreign keys detected: {len(res_fk)}")
        for fk in res_fk:
            print(f"  🔗 {fk.get('table_name')}.{fk.get('column_name')} -> {fk.get('foreign_table_name')}.{fk.get('foreign_column_name')}")
    else:
        print(f"  ⚠️ Could not query foreign keys: {res_fk}")

    # 3. Verify Indexes
    idx_query = """
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname;
    """
    code, res_idx = execute_query_via_api(project_ref, access_token, idx_query)
    print("\n[3/3] High-Performance Indexes Verification:")
    if code == 200 and isinstance(res_idx, list):
        print(f"  Total custom indexes detected: {len(res_idx)}")
        for idx in res_idx:
            print(f"  ⚡ {idx.get('tablename')}: {idx.get('indexname')}")
    else:
        print(f"  ⚠️ Could not query indexes: {res_idx}")

    return all_tables_ok

def main():
    load_env()
    print("=" * 60)
    print(" TORQWASH PRO - Automated Supabase Migration Runner")
    print("=" * 60)

    if not os.path.exists(MIGRATION_FILE):
        print(f"❌ Error: Migration file not found at {MIGRATION_FILE}")
        sys.exit(1)

    with open(MIGRATION_FILE, "r") as f:
        sql_content = f.read()

    print(f"📁 Migration Script: {MIGRATION_FILE}")
    print(f"📄 Script Size: {len(sql_content)} characters ({len(sql_content.encode('utf-8'))} bytes)")

    project_ref = os.environ.get("SUPABASE_PROJECT_REF")
    access_token = os.environ.get("SUPABASE_ACCESS_TOKEN")

    if not project_ref:
        supabase_url = os.environ.get("SUPABASE_URL", "")
        if "supabase.co" in supabase_url:
            host = supabase_url.replace("https://", "").replace("http://", "").split("/")[0]
            project_ref = host.split(".")[0]

    if not project_ref or not access_token:
        print("\n⚠️ Supabase credentials required for automated API execution:")
        print("  - SUPABASE_PROJECT_REF (e.g. 'xyzabcdefghijklm')")
        print("  - SUPABASE_ACCESS_TOKEN (from https://supabase.com/dashboard/account/tokens)")
        print("\nProvide these via environment variables or .env to execute directly via project runner.")
        return False

    print(f"🚀 Executing migration on project: {project_ref}...")
    status_code, result = execute_query_via_api(project_ref, access_token, sql_content)

    if status_code in (200, 201):
        print("✅ Migration executed successfully!")
        verify_schema(project_ref, access_token)
        return True
    else:
        print(f"❌ Migration failed with status {status_code}:")
        print(json.dumps(result, indent=2))
        return False

if __name__ == "__main__":
    main()
