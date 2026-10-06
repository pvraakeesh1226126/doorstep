/* ==========================================================================
   TORQWASH PRO - Client-Side Environment Variables Configurator
   Provides client-safe configuration for Supabase integration.
   DO NOT put secret keys (e.g. service_role key) in this file.
   ========================================================================== */

(function () {
  // Read existing __ENV__ or initialize
  window.__ENV__ = window.__ENV__ || {};

  // 1. Check localStorage for user-provided runtime config, or default placeholders
  var storedUrl = localStorage.getItem('TORQ_SUPABASE_URL');
  var storedKey = localStorage.getItem('TORQ_SUPABASE_ANON_KEY');

  // 2. Set environment values (prefer localStorage if user configured via console/UI)
  window.__ENV__.SUPABASE_URL = storedUrl || window.__ENV__.SUPABASE_URL || 'https://xoowgdyxtqqzxekosffd.supabase.co';
  window.__ENV__.SUPABASE_ANON_KEY = storedKey || window.__ENV__.SUPABASE_ANON_KEY || 'sb_publishable_H4eh55TI5e1w4n5Mv81Ikw_8JfEpM5T';

  // Helper method to set credentials dynamically from browser console:
  // e.g.: window.setSupabaseConfig('https://xyz.supabase.co', 'eyJhbGciOi...')
  window.setSupabaseConfig = function (url, anonKey) {
    if (!url || !anonKey) {
      console.error('[Supabase Config] Both SUPABASE_URL and SUPABASE_ANON_KEY are required.');
      return false;
    }
    localStorage.setItem('TORQ_SUPABASE_URL', url.trim());
    localStorage.setItem('TORQ_SUPABASE_ANON_KEY', anonKey.trim());
    window.__ENV__.SUPABASE_URL = url.trim();
    window.__ENV__.SUPABASE_ANON_KEY = anonKey.trim();

    if (window.initSupabaseClient) {
      window.initSupabaseClient();
    }
    console.log('[Supabase Config] Credentials saved successfully! Reinitialized client.');
    if (window.torqCustomer && window.torqCustomer.showToast) {
      window.torqCustomer.showToast('Supabase credentials configured!', 'success');
    }
    return true;
  };
})();
