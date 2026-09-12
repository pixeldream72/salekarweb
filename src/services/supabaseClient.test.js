import test from 'node:test';
import assert from 'node:assert/strict';

import { getSupabaseConfig } from './supabaseClient.js';

test('returns project url and anon key from either VITE_ or direct env names', () => {
  const config = getSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example-vite.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'vite-key',
  });

  assert.equal(config.url, 'https://example-vite.supabase.co');
  assert.equal(config.anonKey, 'vite-key');
});

test('prefers direct SUPABASE_* values when they are available', () => {
  const config = getSupabaseConfig({
    SUPABASE_URL: 'https://example-direct.supabase.co',
    SUPABASE_ANON_KEY: 'direct-key',
    VITE_SUPABASE_URL: 'https://example-vite.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'vite-key',
  });

  assert.equal(config.url, 'https://example-direct.supabase.co');
  assert.equal(config.anonKey, 'direct-key');
});
