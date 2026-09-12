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

export const mockQuotations = [
  {
    id: 'Q-1042',
    orderType: 'quotation',
    status: 'pending',
    customerName: 'Ayesha Traders',
    createdAt: '2026-09-10T10:30:00',
    updatedAt: '2026-09-10T11:15:00',
    total: 18750,
    notes: 'Awaiting confirmation on delivery timing.',
    items: [
      { productName: 'Premium Starter Kit', quantity: 2, unitPrice: 1500 },
      { productName: 'Seasonal Promo Box', quantity: 3, unitPrice: 1750 },
    ],
  },
  {
    id: 'Q-1048',
    orderType: 'quotation',
    status: 'accepted',
    customerName: 'Northside Retail',
    createdAt: '2026-09-08T14:05:00',
    updatedAt: '2026-09-09T09:20:00',
    total: 46000,
    notes: 'Order accepted and converted from quotation to sale.',
    items: [
      { productName: 'Wholesale Toy Pack', quantity: 8, unitPrice: 2200 },
      { productName: 'Premium Starter Kit', quantity: 5, unitPrice: 1500 },
    ],
  },
  {
    id: 'Q-1051',
    orderType: 'quotation',
    status: 'review',
    customerName: 'City Mart',
    createdAt: '2026-09-11T08:40:00',
    updatedAt: '2026-09-11T09:10:00',
    total: 26500,
    notes: 'Customer requested revised pack size comparison.',
    items: [
      { productName: 'Seasonal Promo Box', quantity: 4, unitPrice: 1750 },
      { productName: 'Wholesale Toy Pack', quantity: 4, unitPrice: 2200 },
    ],
  },
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

function normalizeBusinessDetailRecord(record, fallback) {
  const businessName = pickFirstDefined(record, [
    'business_name',
    'businessName',
    'BusinessName',
    'name',
    'company_name',
    'companyName',
  ], fallback.businessName);

  const businessType = pickFirstDefined(record, [
    'business_type',
    'businessType',
    'BusinessType',
    'type',
    'category',
  ], fallback.businessType);

  const domain = pickFirstDefined(record, [
    'domain',
    'website',
    'website_url',
    'site_url',
    'url',
  ], fallback.domain);

  const phone = pickFirstDefined(record, [
    'phone',
    'phone_no',
    'phone1Number',
    'phone1_number',
    'contact_number',
    'telephone',
    'phoneNumber',
    'Phone',
  ], fallback.phone);

  const phone2Number = pickFirstDefined(record, [
    'phone2Number',
    'phone_2_number',
    'secondary_phone',
    'phone2',
  ], fallback.phone2Number || '');

  const whatsapp = pickFirstDefined(record, [
    'whatsapp',
    'whatsapp_number',
    'whatsappNo',
    'mobile',
    'mobile_number',
  ], fallback.whatsapp);

  const address = pickFirstDefined(record, [
    'address',
    'street_address',
    'address_line_1',
    'location_address',
  ], fallback.address || '');

  const city = pickFirstDefined(record, [
    'city',
    'town',
    'location_city',
  ], fallback.city || '');

  const email = pickFirstDefined(record, [
    'email',
    'email_address',
    'business_email',
  ], fallback.email || '');

  const currencySymbol = pickFirstDefined(record, [
    'currency_symbol',
    'currencySymbol',
    'currency',
  ], fallback.currencySymbol || 'PKR');

  const logoPath = pickFirstDefined(record, [
    'logo_path',
    'logoPath',
    'logo_url',
    'logo',
  ], fallback.logoPath || '');

  const id = pickFirstDefined(record, ['id', 'business_id', 'BusinessID', 'uuid'], fallback.id);

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
  };
}

async function readTable(tableName, selectClause, fallbackData) {
  const { data, error } = await supabase.from(tableName).select(selectClause).limit(10);

  if (error) {
    console.warn(`Supabase read failed for ${tableName}:`, error.message);
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

export async function testSupabaseConnection() {
  const result = await readTable('products', 'id', []);

  if (result.error) {
    return {
      ok: false,
      message: result.error.message,
    };
  }

  return {
    ok: true,
    data: result.data,
    message: 'Supabase connection succeeded.',
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
    .select('id, user_id, business_name, business_type, logo_path, phone, phone2Number, address, city, email, currency_symbol, domain, name, website')
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

function normalizeProductRecord(record, fallback = {}) {
  const id = pickFirstDefined(record, ['id', 'product_id', 'ProductID'], fallback.id ?? 0);
  const name = pickFirstDefined(record, ['name', 'product_name', 'ProductName'], fallback.name ?? 'Product');
  const description = pickFirstDefined(record, ['description', 'details', 'product_description'], fallback.description ?? '');
  const price = pickFirstDefined(record, ['price', 'unit_price', 'selling_price', 'ProductPrice'], fallback.price ?? 0);

  return {
    id,
    name: String(name),
    description: String(description),
    price: Number(price),
  };
}

export async function fetchProducts(shopOwnerId = getCurrentTenant().shopOwnerId) {
  const resolvedShopOwnerId = shopOwnerId || resolveTenant().shopOwnerId;

  const candidateFilters = [
    'shop_owner_id',
    'shopOwnerId',
    'owner_id',
    'ownerId',
    'tenant_id',
    'tenantId',
    'business_id',
    'businessId',
    'business_detail_id',
    'businessDetailId',
    'user_id',
    'userId',
  ];

  if (!resolvedShopOwnerId) {
    return {
      data: mockProducts,
      source: 'fallback',
      error: null,
    };
  }

  for (const column of candidateFilters) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, description, shop_owner_id, owner_id, user_id, tenant_id, business_id, business_detail_id')
        .eq(column, resolvedShopOwnerId)
        .limit(50);

      if (!error && Array.isArray(data) && data.length) {
        return {
          data: data.map((record) => normalizeProductRecord(record, mockProducts[0])),
          source: 'supabase',
          error: null,
        };
      }
    } catch {
      // Continue to the next likely schema match.
    }
  }

  return {
    data: mockProducts,
    source: 'fallback',
    error: null,
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

function normalizeQuotationRecord(record, fallback = {}) {
  const quotationId = pickFirstDefined(record, ['id', 'quotation_id', 'quote_id', 'quotationId'], fallback.id || 'Q-0000');
  const orderId = pickFirstDefined(record, ['order_id', 'orderId'], fallback.orderId || '');
  const customerName = pickFirstDefined(record, ['customer_name', 'customerName', 'customer', 'party_name', 'partyName', 'name'], fallback.customerName || 'Customer');
  const status = pickFirstDefined(record, ['status', 'order_status', 'state'], fallback.status || 'pending');
  const total = pickFirstDefined(record, ['total', 'amount', 'grand_total', 'total_amount', 'totalAmount'], fallback.total || 0);
  const createdAt = pickFirstDefined(record, ['created_at', 'createdAt', 'date_created', 'created_date'], fallback.createdAt || new Date().toISOString());
  const updatedAt = pickFirstDefined(record, ['updated_at', 'updatedAt', 'modified_at', 'updated_date'], fallback.updatedAt || createdAt);
  const orderType = pickFirstDefined(record, ['order_type', 'orderType'], fallback.orderType || 'quotation');
  const notes = pickFirstDefined(record, ['notes', 'remarks', 'message'], fallback.notes || '');

  const items = (() => {
    const itemSource = record?.items ?? record?.order_items ?? record?.quotation_items ?? fallback.items ?? [];

    if (Array.isArray(itemSource)) {
      return itemSource.map((item) => ({
        productName: pickFirstDefined(item, ['product_name', 'productName', 'name'], 'Product'),
        quantity: Number(item?.quantity ?? item?.qty ?? 1),
        unitPrice: Number(item?.unit_price ?? item?.unitPrice ?? item?.rate ?? item?.price ?? 0),
      }));
    }

    return fallback.items ?? [];
  })();

  return {
    id: String(quotationId),
    orderId: String(orderId || quotationId),
    orderType: String(orderType).toLowerCase(),
    status: String(status).toLowerCase(),
    customerName: String(customerName),
    createdAt: String(createdAt),
    updatedAt: String(updatedAt),
    total: Number(total),
    notes: String(notes),
    items,
  };
}

async function fetchOrderItemsByOrderId(orderId) {
  if (!orderId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('order_item')
      .select('*')
      .eq('order_id', orderId)
      .limit(100);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data.map((item) => ({
      productName: pickFirstDefined(item, ['name', 'product_name', 'productName'], 'Product'),
      quantity: Number(item?.qty ?? item?.quantity ?? 1),
      unitPrice: Number(item?.rate ?? item?.unit_price ?? item?.unitPrice ?? item?.price ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function fetchQuotations(userId = '') {
  if (!userId) {
    return { data: [], source: 'private', error: null };
  }

  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('user_id', userId)
      .order('created_date', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    if (!Array.isArray(data) || !data.length) {
      return { data: mockQuotations, source: 'fallback', error: null };
    }

    const rows = await Promise.all(
      data.map(async (record) => {
        const orderRow = record.order_id
          ? await supabase.from('orders').select('*').eq('id', record.order_id).limit(1).maybeSingle()
          : { data: null };

        const orderData = orderRow?.data || {};
        const items = await fetchOrderItemsByOrderId(record.order_id || orderData.id);
        return normalizeQuotationRecord({
          ...record,
          ...orderData,
          orderId: record.order_id || orderData.id,
          customerName: record.customer_name || orderData.party_name || orderData.customer_name || 'Customer',
          status: record.status || orderData.order_status || 'pending',
          createdAt: record.created_date || orderData.created_date || new Date().toISOString(),
          updatedAt: record.updated_date || orderData.updated_date || record.created_date || new Date().toISOString(),
          total: orderData.total_amount || record.total || 0,
          items,
        }, mockQuotations[0]);
      }),
    );

    return { data: rows, source: 'supabase', error: null };
  } catch (error) {
    console.warn('quotations lookup failed, using fallback data:', error?.message || error);
    return { data: mockQuotations, source: 'fallback', error };
  }
}

export async function fetchQuotationById(quoteId, userId = '') {
  if (!quoteId || !userId) {
    return { data: null, source: 'private', error: null };
  }

  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quoteId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('No quotation record found');
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', data.order_id)
      .limit(1)
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    const items = await fetchOrderItemsByOrderId(data.order_id || orderData?.id);
    const normalized = normalizeQuotationRecord({
      ...data,
      ...orderData,
      orderId: data.order_id || orderData?.id,
      customerName: data.customer_name || orderData?.party_name || orderData?.customer_name || 'Customer',
      status: data.status || orderData?.order_status || 'pending',
      createdAt: data.created_date || orderData?.created_date || new Date().toISOString(),
      updatedAt: data.updated_date || orderData?.updated_date || data.created_date || new Date().toISOString(),
      total: orderData?.total_amount || data.total || 0,
      items,
    }, mockQuotations[0]);

    return { data: normalized, source: 'supabase', error: null };
  } catch (error) {
    console.warn('single quotation lookup failed, using fallback data:', error?.message || error);
    const fallbackQuote = mockQuotations.find((quote) => quote.id === quoteId) || mockQuotations[0];
    return { data: fallbackQuote, source: 'fallback', error };
  }
}

export async function createQuotation({
  shopOwnerId,
  customerName,
  orderPayload = {},
  items = [],
}) {
  const now = Date.now();
  const safeOrderId = orderPayload.id || `ORD-${Date.now()}`;
  const totalAmount = Number(orderPayload.total_amount ?? items.reduce((sum, item) => {
    const qty = Number(item.qty ?? item.quantity ?? 1);
    const rate = Number(item.rate ?? item.unitPrice ?? item.price ?? 0);
    return sum + qty * rate;
  }, 0));

  const { data: createdOrder, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        id: safeOrderId,
        order_type: 'quotation',
        shop_owner_id: shopOwnerId,
        party_id: orderPayload.party_id ?? null,
        party_name: customerName,
        total_amount: totalAmount,
        amount_paid: Number(orderPayload.amount_paid ?? 0),
        balance: Number(orderPayload.balance ?? Math.max(totalAmount, 0)),
        discount: Number(orderPayload.discount ?? 0),
        remarks: orderPayload.remarks ?? '',
        created_date: Number(orderPayload.created_date ?? now),
        updated_date: Number(orderPayload.updated_date ?? now),
        ...orderPayload,
      },
    ])
    .select()
    .single();

  if (orderError || !createdOrder) {
    throw orderError || new Error('Unable to create quotation order.');
  }

  const preparedItems = (items || []).map((item) => ({
    order_id: createdOrder.id,
    product_id: item.product_id ?? item.id ?? null,
    name: item.name ?? item.productName ?? 'Product',
    qty: Number(item.qty ?? item.quantity ?? 1),
    rate: Number(item.rate ?? item.unitPrice ?? item.price ?? 0),
    price: Number(item.price ?? ((Number(item.qty ?? item.quantity ?? 1)) * (Number(item.rate ?? item.unitPrice ?? item.price ?? 0)))),
  }));

  if (preparedItems.length) {
    const { error: itemError } = await supabase.from('order_item').insert(preparedItems);
    if (itemError) {
      throw itemError;
    }
  }

  const quotationId = globalThis.crypto?.randomUUID?.() ?? `Q-${Date.now()}`;

  const { data: createdQuotation, error: quotationError } = await supabase
    .from('quotations')
    .insert([
      {
        id: quotationId,
        shop_owner_id: shopOwnerId,
        order_id: createdOrder.id,
        customer_name: customerName,
        status: 'pending',
        created_date: Number(now),
        updated_date: Number(now),
      },
    ])
    .select()
    .single();

  if (quotationError || !createdQuotation) {
    throw quotationError || new Error('Unable to create quotation record.');
  }

  return {
    order: createdOrder,
    quotation: createdQuotation,
    items: preparedItems,
  };
}

export async function acceptQuotation(quoteId) {
  if (!quoteId) {
    throw new Error('A quotation ID is required.');
  }

  const quoteResult = await supabase
    .from('quotations')
    .select('order_id')
    .eq('id', quoteId)
    .limit(1)
    .maybeSingle();

  if (quoteResult.error) {
    throw quoteResult.error;
  }

  if (quoteResult.data?.order_id) {
    const { error: orderError } = await supabase
      .from('orders')
      .update({ order_type: 'sale', updated_date: Date.now() })
      .eq('id', quoteResult.data.order_id);

    if (orderError) {
      throw orderError;
    }
  }

  const { data, error } = await supabase
    .from('quotations')
    .update({ status: 'order_confirmed', updated_date: Date.now() })
    .eq('id', quoteId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function rejectQuotation(quoteId) {
  if (!quoteId) {
    throw new Error('A quotation ID is required.');
  }

  const { data, error } = await supabase
    .from('quotations')
    .update({ status: 'rejected', updated_date: Date.now() })
    .eq('id', quoteId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
