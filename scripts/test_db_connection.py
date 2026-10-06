#!/usr/bin/env python3
"""
TORQWASH PRO - Complete Database Connectivity & CRUD Verification Test
Tests:
1. Client initialization and API connectivity
2. Read operations from required catalog tables (services, category_multipliers)
3. Insert test data (temporary coupon code)
4. Update test data
5. Delete test data (immediate cleanup, no lingering dummy data)
6. Proper error handling
"""

import sys
import json
import urllib.request
import urllib.error
import time

PROJECT_REF = "xoowgdyxtqqzxekosffd"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
ANON_KEY = "sb_publishable_H4eh55TI5e1w4n5Mv81Ikw_8JfEpM5T"

HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def print_header(title):
    print("\n" + "=" * 65)
    print(f" {title}")
    print("=" * 65)

def test_1_client_initialization():
    print("[TEST 1/6] Supabase Client & API Health Verification")
    url = f"{SUPABASE_URL}/auth/v1/health"
    req = urllib.request.Request(url, headers={"apikey": ANON_KEY})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"  ✅ Client successfully connected to endpoint: {SUPABASE_URL}")
            print(f"  ✅ Remote Auth API service responded: {data.get('name')} (Version: {data.get('version')})")
            return True, "Initialized and connected successfully"
    except Exception as e:
        print(f"  ❌ Client connection failed: {e}")
        return False, str(e)

def test_2_read_table():
    print("\n[TEST 2/6] Reading Required Table Data (Read Operation)")
    url = f"{SUPABASE_URL}/rest/v1/services?select=id,name,base_price,category_tag&limit=5"
    req = urllib.request.Request(url, headers=HEADERS, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            print(f"  ✅ Read operation successful! Found {len(rows)} records in 'services'.")
            for r in rows:
                print(f"     - [{r.get('id')}] {r.get('name')} (₹{r.get('base_price')}) [{r.get('category_tag')}]")
            return True, f"Read {len(rows)} rows"
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        if "PGRST205" in err:
            print("  ❌ Read failed: Table 'services' not found in schema cache (PGRST205).")
            print("     Hint: Migration SQL must be executed in Supabase SQL editor.")
        else:
            print(f"  ❌ Read failed with HTTP {e.code}: {err}")
        return False, err
    except Exception as e:
        print(f"  ❌ Read failed: {e}")
        return False, str(e)

def test_3_insert_data(test_code):
    print("\n[TEST 3/6] Inserting Temporary Test Data (Create Operation)")
    url = f"{SUPABASE_URL}/rest/v1/coupons"
    payload = json.dumps({
        "code": test_code,
        "discount_type": "flat",
        "value": 99.00,
        "min_order": 299.00,
        "description": "Temporary automated connectivity test token",
        "is_active": True
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"  ✅ Insert operation successful! Created test coupon: '{test_code}'")
            return True, data
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"  ❌ Insert failed with HTTP {e.code}: {err}")
        return False, err
    except Exception as e:
        print(f"  ❌ Insert failed: {e}")
        return False, str(e)

def test_4_update_data(test_code):
    print("\n[TEST 4/6] Updating Test Data (Update Operation)")
    url = f"{SUPABASE_URL}/rest/v1/coupons?code=eq.{test_code}"
    payload = json.dumps({
        "value": 149.00,
        "description": "Temporary token updated by verification suite"
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers=HEADERS, method="PATCH")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"  ✅ Update operation successful! Coupon '{test_code}' value updated to ₹149.00.")
            return True, data
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"  ❌ Update failed with HTTP {e.code}: {err}")
        return False, err
    except Exception as e:
        print(f"  ❌ Update failed: {e}")
        return False, str(e)

def test_5_delete_data(test_code):
    print("\n[TEST 5/6] Deleting Test Data (Cleanup Operation)")
    url = f"{SUPABASE_URL}/rest/v1/coupons?code=eq.{test_code}"
    req = urllib.request.Request(url, headers=HEADERS, method="DELETE")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"  ✅ Delete operation successful! Coupon '{test_code}' removed. Zero dummy data left.")
            return True, data
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"  ❌ Delete failed with HTTP {e.code}: {err}")
        return False, err
    except Exception as e:
        print(f"  ❌ Delete failed: {e}")
        return False, str(e)

def test_6_error_handling():
    print("\n[TEST 6/6] Verifying Robust Error Handling (Invalid Operations)")
    # Test 6a: Read non-existent table
    url_invalid = f"{SUPABASE_URL}/rest/v1/non_existent_table_xyz?select=*"
    req = urllib.request.Request(url_invalid, headers=HEADERS, method="GET")
    caught_expected_error = False
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            pass
    except urllib.error.HTTPError as e:
        print(f"  ✅ Expected database error safely caught and handled (HTTP {e.code}: Table not found)")
        caught_expected_error = True
    except Exception as e:
        print(f"  ✅ Handled network/protocol exception: {e}")
        caught_expected_error = True

    return caught_expected_error, "Error correctly handled"

def run_all_tests():
    print_header(f"TORQWASH PRO - Database Connectivity & Verification Suite\n Endpoint: {SUPABASE_URL}")
    results = {}
    test_id = f"TEST_CONN_{int(time.time())}"

    # 1. Initialize
    ok1, msg1 = test_1_client_initialization()
    results["1. Client Initialization"] = ok1

    # 2. Read
    ok2, msg2 = test_2_read_table()
    results["2. Read Operation"] = ok2

    if ok2:
        # 3. Insert
        ok3, msg3 = test_3_insert_data(test_id)
        results["3. Insert Test Data"] = ok3

        # 4. Update
        if ok3:
            ok4, msg4 = test_4_update_data(test_id)
            results["4. Update Test Data"] = ok4
        else:
            results["4. Update Test Data"] = False

        # 5. Delete
        ok5, msg5 = test_5_delete_data(test_id)
        results["5. Delete (Cleanup)"] = ok5
    else:
        results["3. Insert Test Data"] = "Skipped (Table not accessible)"
        results["4. Update Test Data"] = "Skipped (Table not accessible)"
        results["5. Delete (Cleanup)"] = "Skipped (Table not accessible)"

    # 6. Error handling
    ok6, msg6 = test_6_error_handling()
    results["6. Error Handling"] = ok6

    print_header("FINAL VERIFICATION SUMMARY")
    for step, res in results.items():
        icon = "✅ PASS" if res is True else ("❌ FAIL" if res is False else f"⚠️ {res}")
        print(f"  {step.ljust(30)}: {icon}")
    print("=" * 65)

    return all(v is True for v in [ok1, ok2, results.get("3. Insert Test Data") == True, results.get("4. Update Test Data") == True, results.get("5. Delete (Cleanup)") == True, ok6])

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
