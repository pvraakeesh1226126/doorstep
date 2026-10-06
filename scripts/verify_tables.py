#!/usr/bin/env python3
"""
TORQWASH PRO - Post-Migration Table & REST API Verification Script
Checks all 17 approved tables via the Supabase project endpoint.
"""

import os
import sys
import json
import urllib.request
import urllib.error

PROJECT_REF = "xoowgdyxtqqzxekosffd"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
ANON_KEY = "sb_publishable_H4eh55TI5e1w4n5Mv81Ikw_8JfEpM5T"

TABLES_TO_VERIFY = [
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

def check_table(table_name):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&limit=1"
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Range": "0-0"
    }
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return True, resp.status, len(data), None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_msg)
            code = err_json.get("code")
            msg = err_json.get("message")
        except Exception:
            code = str(e.code)
            msg = err_msg
        return False, e.code, 0, f"[{code}] {msg}"
    except Exception as e:
        return False, 500, 0, str(e)

def main():
    print("=" * 65)
    print(f" TORQWASH PRO - Schema Verification for {PROJECT_REF}")
    print("=" * 65)
    print(f"Endpoint: {SUPABASE_URL}")
    print("-" * 65)

    created_count = 0
    missing_count = 0

    for idx, table in enumerate(TABLES_TO_VERIFY, 1):
        exists, status, row_count, error = check_table(table)
        if exists:
            created_count += 1
            print(f"[{idx:02d}/17] ✅ {table.ljust(22)}: CREATED (HTTP {status}, {row_count} sample rows returned)")
        else:
            missing_count += 1
            if "PGRST205" in str(error):
                print(f"[{idx:02d}/17] ❌ {table.ljust(22)}: NOT FOUND (Pending migration execution)")
            else:
                # Table might exist with strict RLS (401 or 403 or empty)
                print(f"[{idx:02d}/17] ⚠️ {table.ljust(22)}: {error}")

    print("-" * 65)
    print(f"Summary: {created_count}/{len(TABLES_TO_VERIFY)} tables active, {missing_count} pending.")
    print("=" * 65)

if __name__ == "__main__":
    main()
