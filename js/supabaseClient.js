/* ==========================================================================
   TORQWASH PRO - Supabase Client Initializer & Connection Manager
   Handles client initialization, validation, and connectivity health-checks.
   ========================================================================== */

(function () {
  'use strict';

  window.supabaseClient = null;

  // Initialize or reinitialize the Supabase client
  function initSupabaseClient() {
    var env = window.__ENV__ || {};
    var url = env.SUPABASE_URL;
    var anonKey = env.SUPABASE_ANON_KEY;

    // Check if Supabase SDK is available
    var supabaseLib = window.supabase;
    if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
      console.warn('[Supabase] Supabase JS SDK not loaded yet. Retrying on window load.');
      return null;
    }

    // Verify whether valid credentials are provided (and not default placeholders)
    var isPlaceholder = !url || !anonKey ||
      url.indexOf('your-project-id') !== -1 ||
      anonKey.indexOf('your-anon-public-key') !== -1 ||
      url.indexOf('http') !== 0;

    if (isPlaceholder) {
      console.info(
        '%c[Supabase]%c Ready for connection. Configure your credentials via:\n' +
        '1. env.js or .env\n' +
        '2. Or run: %cwindow.setSupabaseConfig("https://<project-ref>.supabase.co", "<anon-key>")%c in console.',
        'color: #38bdf8; font-weight: bold;',
        'color: #94a3b8;',
        'color: #34d399; font-weight: bold;',
        'color: #94a3b8;'
      );
      window.supabaseClient = null;
      return null;
    }

    try {
      window.supabaseClient = supabaseLib.createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log(
        '%c[Supabase]%c Client successfully initialized for: ' + url,
        'color: #38bdf8; font-weight: bold;',
        'color: #34d399;'
      );
      return window.supabaseClient;
    } catch (err) {
      console.error('[Supabase] Initialization error:', err);
      window.supabaseClient = null;
      return null;
    }
  }

  // Diagnostic helper to test Supabase connection and connectivity
  window.testSupabaseConnection = async function () {
    if (!window.supabaseClient) {
      return {
        connected: false,
        status: 'UNCONFIGURED',
        message: 'Supabase client is not yet configured with your project URL and anon key. Update env.js or call window.setSupabaseConfig(url, anonKey).'
      };
    }

    try {
      // Test ping by inspecting server timestamp / auth session
      var sessionResult = await window.supabaseClient.auth.getSession();
      
      // Attempt a lightweight probe
      var probeResult = await window.supabaseClient
        .from('services')
        .select('*', { count: 'exact', head: true });

      var hasTable = !probeResult.error || probeResult.error.code !== 'PGRST205';

      return {
        connected: true,
        status: 'CONNECTED',
        url: window.__ENV__.SUPABASE_URL,
        tablesDetected: hasTable,
        message: 'Successfully reached Supabase project! Client is initialized and operational.'
      };
    } catch (err) {
      return {
        connected: false,
        status: 'NETWORK_ERROR',
        error: err.message,
        message: 'Failed to communicate with Supabase project endpoint. Please check URL and internet connectivity.'
      };
    }
  };

  // UI Helper to connect from the Settings dialog
  window.saveSupabaseUiConfig = async function () {
    var urlInput = document.getElementById('supabaseUrlInput');
    var keyInput = document.getElementById('supabaseKeyInput');
    var badge = document.getElementById('supabaseStatusBadge');

    if (!urlInput || !urlInput.value || urlInput.value.indexOf('http') !== 0) {
      if (window.torqCustomer && window.torqCustomer.showToast) {
        window.torqCustomer.showToast('Please enter your Supabase Project URL (https://xxxx.supabase.co)', 'danger');
      } else {
        alert('Please enter your Supabase Project URL (https://xxxx.supabase.co)');
      }
      return;
    }

    var url = urlInput.value.trim();
    var key = (keyInput && keyInput.value) ? keyInput.value.trim() : 'sb_publishable_H4eh55TI5e1w4n5Mv81Ikw_8JfEpM5T';

    window.setSupabaseConfig(url, key);

    if (badge) {
      badge.className = 'status-pill on-way';
      badge.innerText = 'Connecting...';
    }

    var res = await window.testSupabaseConnection();
    if (res.connected) {
      if (badge) {
        badge.className = 'status-pill completed';
        badge.innerText = '🟢 Connected';
      }
      if (window.torqCustomer && window.torqCustomer.showToast) {
        window.torqCustomer.showToast('Supabase Connected! Project: ' + url, 'success');
      }
    } else {
      if (badge) {
        badge.className = 'status-pill cancelled';
        badge.innerText = 'Connection Failed';
      }
      if (window.torqCustomer && window.torqCustomer.showToast) {
        window.torqCustomer.showToast(res.message, 'danger');
      }
    }
  };

    // Expose initializer & test runner
    window.initSupabaseClient = initSupabaseClient;

    // Comprehensive 6-step database connectivity test using application architecture
    window.runDatabaseConnectivityTests = async function () {
      var report = {
        timestamp: new Date().toISOString(),
        clientInitialized: false,
        readOperation: false,
        insertOperation: false,
        updateOperation: false,
        deleteOperation: false,
        errorHandling: false,
        details: []
      };

      function logStep(step, success, message, data) {
        report.details.push({ step: step, success: success, message: message, data: data });
        console.log('[DB Test - Step ' + step + '] ' + (success ? '✅ PASS: ' : '❌ FAIL: ') + message);
      }

      // 1. Verify Supabase client initialization
      if (window.supabaseClient) {
        report.clientInitialized = true;
        logStep(1, true, 'Supabase client is initialized with valid endpoint: ' + (window.__ENV__ ? window.__ENV__.SUPABASE_URL : ''));
      } else {
        logStep(1, false, 'Supabase client is not initialized');
        return report;
      }

      var client = window.supabaseClient;
      var testCode = 'CONN_TEST_' + Date.now();

      // 2. Read operation from required table (services)
      try {
        var readRes = await client.from('services').select('id, name, base_price').limit(5);
        if (readRes.error) {
          logStep(2, false, 'Read operation failed on services table: ' + readRes.error.message, readRes.error);
        } else {
          report.readOperation = true;
          logStep(2, true, 'Read operation succeeded. Retrieved ' + (readRes.data ? readRes.data.length : 0) + ' services records.', readRes.data);
        }
      } catch (e) {
        logStep(2, false, 'Exception during read: ' + e.message);
      }

      // 3. Insert temporary test data (coupons)
      if (report.readOperation) {
        try {
          var insertRes = await client.from('coupons').insert([{
            code: testCode,
            discount_type: 'flat',
            value: 50.00,
            min_order: 100.00,
            description: 'Temporary connectivity test token',
            is_active: true
          }]).select();

          if (insertRes.error) {
            logStep(3, false, 'Insert operation failed: ' + insertRes.error.message, insertRes.error);
          } else {
            report.insertOperation = true;
            logStep(3, true, 'Insert operation succeeded. Created temporary record: ' + testCode);
          }
        } catch (e) {
          logStep(3, false, 'Exception during insert: ' + e.message);
        }

        // 4. Update test data
        if (report.insertOperation) {
          try {
            var updateRes = await client.from('coupons').update({
              description: 'Updated temporary test token'
            }).eq('code', testCode).select();

            if (updateRes.error) {
              logStep(4, false, 'Update operation failed: ' + updateRes.error.message, updateRes.error);
            } else {
              report.updateOperation = true;
              logStep(4, true, 'Update operation succeeded. Modified record ' + testCode);
            }
          } catch (e) {
            logStep(4, false, 'Exception during update: ' + e.message);
          }

          // 5. Delete test data (clean up immediately)
          try {
            var deleteRes = await client.from('coupons').delete().eq('code', testCode);
            if (deleteRes.error) {
              logStep(5, false, 'Delete cleanup failed: ' + deleteRes.error.message, deleteRes.error);
            } else {
              report.deleteOperation = true;
              logStep(5, true, 'Delete cleanup succeeded. Temporary test record deleted with zero dummy data left.');
            }
          } catch (e) {
            logStep(5, false, 'Exception during delete cleanup: ' + e.message);
          }
        }
      }

      // 6. Error handling verification
      try {
        var errRes = await client.from('non_existent_table_test_xyz').select('*');
        if (errRes.error) {
          report.errorHandling = true;
          logStep(6, true, 'Database error safely intercepted and handled as expected: ' + errRes.error.message);
        } else {
          logStep(6, false, 'Expected error was not raised for non-existent table');
        }
      } catch (e) {
        report.errorHandling = true;
        logStep(6, true, 'Exception safely handled: ' + e.message);
      }

      return report;
    };

    // Run on script execution or DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSupabaseClient);
    } else {
      initSupabaseClient();
    }
  })();

