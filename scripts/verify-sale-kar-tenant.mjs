import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env');
const envContents = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const envMap = {};
for (const line of envContents.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
    continue;
  }
  const [key, ...rest] = trimmed.split('=');
  envMap[key.trim()] = rest.join('=').trim();
}

const url = envMap.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = envMap.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const { data: businessRows, error: businessError } = await supabase
  .from('BusinessDetail')
  .select('id, user_id, business_name, logo_path, phone, phone2Number, address, city, email, currency_symbol, domain')
  .limit(20);

const { data: productRows, error: productError } = await supabase
  .from('products')
  .select('id, name, price, description, shop_owner_id, owner_id, user_id, tenant_id')
  .limit(20);


