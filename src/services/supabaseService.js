import { supabase } from './supabaseClient.js';
import { getCurrentTenant, resolveTenant } from './tenantResolver.js';

export const mockProducts = [
  { id: 1, name: 'Premium Starter Kit', price: 1500, description: 'A best-selling bundle for new customers.' },
  { id: 2, name: 'Wholesale Toy Pack', price: 2200, description: 'Bulk order favorite for retail shops.' },
  { id: 3, name: 'Seasonal Promo Box', price: 1750, description: 'Ideal for campaigns and customer upsells.' },
];

export const mockCategories = [
  { id: 1, name: 'Home Essentials' },
  { id: 2, name: 'Seasonal Deals' },
  { id: 3, name: 'Wholesale Goods' },
];

function pickFirstDefined(record, keys, fallback = '') {
  if (!record || typeof record !== 'object') {
    return fallback;
  }

  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== '') {
      return record[key];
    }
  }

  return fallback;
}

async function readTenantScopedTable({
  tableName,
  selectClause,
  tenantId,
  fallbackData,
  tenantColumn = 'tenant_id',
}) {
  if (!tenantId) {
    return {
      data: fallbackData,
      source: 'demo',
      error: null,
    };
  }

  const { data, error } = await supabase
    .from(tableName)
    .select(selectClause)
    .eq(tenantColumn, tenantId)
    .limit(10);

  if (error) {
    console.warn(`Supabase tenant-scoped read failed for ${tableName}:`, error.message);
    return {
      data: fallbackData,
      source: 'demo',
      error,
    };
  }

  return {
    data: data && data.length ? data : fallbackData,
    source: 'supabase',
    error: null,
  };
}

export async function fetchBusinessDetail(shopOwnerId = getCurrentTenant().shopOwnerId) {
  const fallback = getCurrentTenant();

  if (!shopOwnerId) {
    return {
      data: null,
      source: 'not_found',
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('BusinessDetail')
    .select('id, user_id, businessName, phone1Title, phone1Number, phone2Title, phone2Number, address, city, email, logoPath, invoiceFooterNote, currencySymbol, userType')
    .eq('user_id', shopOwnerId)
    .limit(1);

  if (error) {
    console.warn('BusinessDetail lookup failed:', error.message);
    return {
      data: null,
      source: 'not_found',
      error,
    };
  }

  const rows = Array.isArray(data) ? data : [];

  if (!rows.length) {
    return {
      data: null,
      source: 'not_found',
      error: null,
    };
  }

  const matched = rows[0];

  return {
    data: normalizeBusinessDetailRecord(matched, fallback),
    source: 'supabase',
    error: null,
  };
}

function normalizeBusinessDetailRecord(record, fallback) {
   const id = pickFirstDefined(record, ['id'], fallback.id);
  const businessName = pickFirstDefined(record, ['businessName'], fallback.businessName);
  const businessType = pickFirstDefined(record, ['userType'], fallback.businessType);
  const domain = fallback.domain;
  const phone = pickFirstDefined(record, ['phone1Number'], fallback.phone);
  const phone2Number = pickFirstDefined(record, ['phone2Number'], fallback.phone2Number || '');
  const whatsapp = pickFirstDefined(record, ['phone1Number'], fallback.whatsapp);
  const address = pickFirstDefined(record, ['address'], fallback.address || '');
  const city = pickFirstDefined(record, ['city'], fallback.city || '');
  const email = pickFirstDefined(record, ['email'], fallback.email || '');
  const currencySymbol = pickFirstDefined(record, ['currencySymbol'], fallback.currencySymbol || 'PKR');
  const logoPath = pickFirstDefined(record, ['logoPath'], fallback.logoPath || '');
  const logoUrl = getPublicImageUrl('logo-img', logoPath);
 

  return {
    ...fallback,
    id,
    businessName,
    businessType,
    domain,
    phone,
    phone1Number: phone,
    phone2Number,
    whatsapp,
    address,
    city,
    email,
    currencySymbol,
    logoPath,
    logoUrl,
  };
}

function getPublicImageUrl(bucket, imagePath) {
  if (!imagePath) {
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(imagePath);
  return data?.publicUrl || null;
}

export async function fetchProducts(shopOwnerId = getCurrentTenant().shopOwnerId) {
  const resolvedShopOwnerId = shopOwnerId || resolveTenant().shopOwnerId;

  if (!resolvedShopOwnerId) {
    return {
      data: mockProducts,
      source: 'fallback',
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, item_code, qty, color, unit, category, image_path')
    .eq('shop_owner_id', resolvedShopOwnerId)
    .eq('is_delete', false)
    .limit(1000);

  if (error) {
    console.warn('Products lookup failed:', error.message);
    return {
      data: mockProducts,
      source: 'fallback',
      error,
    };
  }

  if (!Array.isArray(data) || !data.length) {
    return {
      data: mockProducts,
      source: 'fallback',
      error: null,
    };
  }

  return {
    data: data.map((record) => normalizeProductRecord(record, mockProducts[0])),
    source: 'supabase',
    error: null,
  };
}

function normalizeProductRecord(record, fallback = {}) {
  const id = pickFirstDefined(record, ['id'], fallback.id ?? 0);
  const name = pickFirstDefined(record, ['name'], fallback.name ?? 'Product');
  const price = pickFirstDefined(record, ['price'], fallback.price ?? 0);
  const itemCode = pickFirstDefined(record, ['item_code'], fallback.item_code ?? '');
  const category = pickFirstDefined(record, ['category'], fallback.category ?? '');
  const color = pickFirstDefined(record, ['color'], fallback.color ?? '');
  const qty = pickFirstDefined(record, ['qty'], fallback.qty ?? 0);
  const unit = pickFirstDefined(record, ['unit'], fallback.unit ?? '');
  const imagePath = pickFirstDefined(record, ['image_path'], fallback.image_path ?? '');
  const imageUrl = getPublicImageUrl('product-images', imagePath);

  return {
    id,
    name: String(name),
    price: Number(price),
    item_code: String(itemCode),
    category: String(category),
    color: String(color),
    qty: Number(qty),
    unit: String(unit),
    imageUrl,
  };
}

export async function fetchCategories() {
  const tenant = getCurrentTenant();

  return readTenantScopedTable({
    tableName: 'categories',
    selectClause: 'id, name, tenant_id',
    tenantId: tenant.id,
    fallbackData: mockCategories,
  });
}

export async function fetchQuotations(customerId = '') {
  if (!customerId) {
    return { data: [], source: 'private', error: null };
  }

  const { data, error } = await supabase
    .from('quotation')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_delete', false)
    .order('created_date', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('Quotations lookup failed:', error.message);
    return { data: [], source: 'error', error };
  }

  return { data: data || [], source: 'supabase', error: null };
}

export async function fetchQuotationById(quoteId, customerId = '') {
  if (!quoteId || !customerId) {
    return { data: null, source: 'private', error: null };
  }

  const { data, error } = await supabase
    .from('quotation')
    .select('*')
    .eq('id', quoteId)
    .eq('customer_id', customerId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { data: null, source: 'not_found', error };
  }

  const { data: itemsData } = await supabase
    .from('quotation_item')
    .select('*')
    .eq('quotation_id', quoteId);

  return {
    data: {
      ...data,
      items: itemsData || [],
    },
    source: 'supabase',
    error: null,
  };
}

export async function createQuotation({ shopOwnerId, customerId, customerEmail, items = [], remarks = '' }) {
  const now = Date.now();
  const totalAmount = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product.price), 0);
  const quotationId = globalThis.crypto?.randomUUID?.() ?? `Q-${Date.now()}`;

  // Fetch the customer's profile — includes name, phone, and their last quotation number
  const { data: profile } = await supabase
    .from('customer_profile')
    .select('full_name, phone, last_quotation_no')
    .eq('id', customerId)
    .maybeSingle();

  const customerName = profile?.full_name || 'Customer';
  const customerPhone = profile?.phone || '';
  const nextNumber = (profile?.last_quotation_no || 0) + 1;

  // Save the new counter value back to their profile
  await supabase
    .from('customer_profile')
    .update({ last_quotation_no: nextNumber })
    .eq('id', customerId);

  const emailPrefix = (customerEmail || 'CUS').slice(0, 3).toUpperCase();
  const quotationNo = `Q-${emailPrefix}-${String(nextNumber).padStart(4, '0')}`;

  const { data: createdQuotation, error: quotationError } = await supabase
    .from('quotation')
    .insert([
      {
        id: quotationId,
        shop_owner_id: shopOwnerId,
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        quotation_no: quotationNo,
        total_amount: totalAmount,
        status: 'pending',
        remarks,
        created_date: now,
        is_delete: false,
      },
    ])
    .select()
    .single();

  if (quotationError || !createdQuotation) {
    throw quotationError || new Error('Unable to create quotation.');
  }

  const preparedItems = items.map((item) => ({
    id: `${quotationId}-${item.product.id}`,
    shop_owner_id: shopOwnerId,
    quotation_id: quotationId,
    product_id: item.product.id,
    name: item.product.name,
    item_code: item.product.item_code,
    category: item.product.category,
    qty: item.quantity,
    color: item.product.color,
    unit: item.product.unit,
    rate: item.product.price,
    price: item.quantity * item.product.price,
  }));

  const { error: itemsError } = await supabase.from('quotation_item').insert(preparedItems);

  if (itemsError) {
    throw itemsError;
  }

  return { quotation: createdQuotation, items: preparedItems };
}
export async function updateQuotation({ quotationId, shopOwnerId, items = [] }) {
  const totalAmount = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product.price), 0);

  const { error: updateError } = await supabase
    .from('quotation')
    .update({ total_amount: totalAmount })
    .eq('id', quotationId);

  if (updateError) {
    throw updateError;
  }

  const { error: deleteError } = await supabase
    .from('quotation_item')
    .delete()
    .eq('quotation_id', quotationId);

  if (deleteError) {
    throw deleteError;
  }

  const preparedItems = items.map((item) => ({
    id: `${quotationId}-${item.product.id}`,
    shop_owner_id: shopOwnerId,
    quotation_id: quotationId,
    product_id: item.product.id,
    name: item.product.name,
    item_code: item.product.item_code,
    category: item.product.category,
    qty: item.quantity,
    color: item.product.color,
    unit: item.product.unit,
    rate: item.product.price,
    price: item.quantity * item.product.price,
  }));

  if (preparedItems.length > 0) {
    const { error: insertError } = await supabase.from('quotation_item').insert(preparedItems);

    if (insertError) {
      throw insertError;
    }
  }

  return { items: preparedItems };
}