import { supabase } from './supabaseClient.js';
import { getCurrentTenant, resolveTenant } from './tenantResolver.js';

const businessDetailSelect = 'id, shop_owner_id, currencySymbol, userType, created_date, sync_id, isSync, basic_info, contact_info, website_content, website_settings, social_accounts, website_slug, custom_domain, logoPath';

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

export async function getShopOwnerIdBySlug(slug) {
  if (!slug) {
    return null;
  }

  const cleanSlug = slug.trim().toLowerCase();

  const { data, error } = await supabase
    .from('BusinessDetail')
    .select('shop_owner_id')
    .eq('website_slug', cleanSlug)
    .maybeSingle();

  if (error) {
    console.error('Failed to resolve shop owner by slug:', error);
    throw error;
  }

  if (!data?.shop_owner_id) {
    console.warn('No tenant found for slug:', cleanSlug);
    return null;
  }

  return data.shop_owner_id;
}
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

export async function fetchBusinessDetail(
  shopOwnerId = getCurrentTenant().shopOwnerId
) {
  const fallback = getCurrentTenant();


  if (!shopOwnerId) {
   
    return { data: null, source: 'not_found', error: null };
  }

  const { data, error } = await supabase
    .from('BusinessDetail')
    .select(
      'id, shop_owner_id, basic_info, contact_info, website_content, website_settings, social_accounts, website_slug, custom_domain, logoPath'
    )
    .eq('shop_owner_id', shopOwnerId)
    .limit(1);



  if (error) {
    console.error('❌ BusinessDetail lookup failed:', error);
    return { data: null, source: 'not_found', error };
  }

  const rows = Array.isArray(data) ? data : [];

 

  if (!rows.length) {
    
    return { data: null, source: 'not_found', error: null };
  }



  const normalized = normalizeBusinessDetailRecord(rows[0], fallback);



  return {
    data: normalized,
    source: 'supabase',
    error: null,
  };
}

export async function fetchBusinessDetailBySlug(slug = '') {
  const normalizedSlug = String(slug || '').trim().toLowerCase();

  if (!normalizedSlug) {
    return { data: null, source: 'not_found', error: null };
  }

  const { data, error } = await supabase
    .from('BusinessDetail')
    .select(businessDetailSelect)
    .eq('website_slug', normalizedSlug)
    .limit(1);

  if (error) {
    console.warn('BusinessDetail slug lookup failed:', error.message);
    return { data: null, source: 'not_found', error };
  }

  const matched = Array.isArray(data) ? data[0] : null;

  return matched
    ? { data: normalizeBusinessDetailRecord(matched, getCurrentTenant()), source: 'supabase', error: null }
    : { data: null, source: 'not_found', error: null };
}

function normalizeBusinessDetailRecord(record, fallback) {
  const parseJson = (value, defaultValue) => {
    if (!value) {
      return defaultValue;
    }

    if (typeof value === 'object') {
      return value;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn(
          'Failed to parse JSON:',
          value,
          error
        );

        return defaultValue;
      }
    }

    return defaultValue;
  };

  /*
   * ---------------------------------------------------------
   * Parse JSON columns
   * ---------------------------------------------------------
   */

  const basicInfo = parseJson(
    record?.basic_info,
    {}
  );

  const contactInfo = parseJson(
    record?.contact_info,
    []
  );

  const websiteContent = parseJson(
    record?.website_content,
    {}
  );

  const websiteSettings = parseJson(
    record?.website_settings,
    {}
  );

  const socialAccounts = parseJson(
    record?.social_accounts,
    []
  );

  /*
   * ---------------------------------------------------------
   * Notifications
   * ---------------------------------------------------------
   *
   * Stored inside:
   *
   * website_settings.notifications
   *
   * Example:
   *
   * {
   *   "enabled": true,
   *   "notifyApp": false,
   *   "notifyWhatsapp": true,
   *   "whatsappNumber": "03013702005"
   * }
   */

  const notifications =
    websiteSettings?.notifications &&
    typeof websiteSettings.notifications === 'object'
      ? websiteSettings.notifications
      : {};

  /*
   * ---------------------------------------------------------
   * IDs
   * ---------------------------------------------------------
   */

  const id = pickFirstDefined(
    record,
    ['id'],
    fallback?.id || ''
  );

  /*
   * IMPORTANT:
   *
   * BusinessDetail uses shop_owner_id.
   *
   * Do NOT use user_id here.
   */

  const shopOwnerId = pickFirstDefined(
    record,
    ['shop_owner_id'],
    fallback?.shopOwnerId || ''
  );

  /*
   * ---------------------------------------------------------
   * Business information
   * ---------------------------------------------------------
   */

  const businessName = pickFirstDefined(
    basicInfo,
    [
      'businessName',
      'business_name',
      'name',
    ],
    fallback?.businessName || ''
  );

  const ownerName = pickFirstDefined(
    basicInfo,
    [
      'ownerName',
      'owner_name',
    ],
    fallback?.ownerName || ''
  );

  const businessType = pickFirstDefined(
    record,
    ['userType'],
    fallback?.businessType || 'Retail Commerce'
  );

  /*
   * ---------------------------------------------------------
   * Contact information
   * ---------------------------------------------------------
   *
   * New database format:
   *
   * [
   *   {
   *     "number": "03013702005",
   *     "title": "Murad ali"
   *   },
   *   {
   *     "number": "03444025688",
   *     "title": "Whats app"
   *   }
   * ]
   *
   * Older format may still be an object, so support both.
   */

  const contactList = Array.isArray(contactInfo)
    ? contactInfo
    : [];

  const contactObject =
    contactInfo &&
    typeof contactInfo === 'object' &&
    !Array.isArray(contactInfo)
      ? contactInfo
      : {};

  const firstContactNumber =
    contactList.find(
      (item) =>
        item &&
        typeof item.number === 'string' &&
        item.number.trim()
    )?.number || '';

  const secondContactNumber =
    contactList
      .filter(
        (item) =>
          item &&
          typeof item.number === 'string' &&
          item.number.trim()
      )
      .map((item) => item.number)[1] || '';

  const phone = pickFirstDefined(
    contactObject,
    [
      'phone',
      'phone1Number',
      'phone1_number',
    ],
    firstContactNumber ||
      fallback?.phone ||
      ''
  );

  const phone2Number = pickFirstDefined(
    contactObject,
    [
      'phone2Number',
      'phone2_number',
    ],
    secondContactNumber ||
      fallback?.phone2Number ||
      ''
  );

  /*
   * ---------------------------------------------------------
   * WhatsApp
   * ---------------------------------------------------------
   *
   * Prefer the WhatsApp number saved in:
   *
   * website_settings.notifications.whatsappNumber
   *
   * Then fall back to old contact information.
   */

  const whatsapp =
    notifications.whatsappNumber ||
    pickFirstDefined(
      contactObject,
      [
        'whatsapp',
        'phone1Number',
        'phone1_number',
      ],
      phone ||
        fallback?.whatsapp ||
        ''
    );

  /*
   * ---------------------------------------------------------
   * Address / City / Email
   * ---------------------------------------------------------
   *
   * Your current database stores these in basic_info.
   */

  const address = pickFirstDefined(
    basicInfo,
    ['address'],
    fallback?.address || ''
  );

  const city = pickFirstDefined(
    basicInfo,
    ['city'],
    fallback?.city || ''
  );

  const email = pickFirstDefined(
    basicInfo,
    ['email'],
    fallback?.email || ''
  );

  /*
   * ---------------------------------------------------------
   * Currency
   * ---------------------------------------------------------
   */

  const currencySymbol = pickFirstDefined(
    basicInfo,
    ['currencySymbol'],
    websiteSettings?.currencySymbol ||
      fallback?.currencySymbol ||
      'PKR'
  );

  /*
   * ---------------------------------------------------------
   * Logo
   * ---------------------------------------------------------
   */

  const logoPath = pickFirstDefined(
    record,
    ['logoPath'],
    fallback?.logoPath || ''
  );

  const logoUrl = getPublicImageUrl(
    'logo-img',
    logoPath
  );

  /*
   * ---------------------------------------------------------
   * Website settings
   * ---------------------------------------------------------
   */

  const websiteEnabled =
    websiteSettings?.websiteEnabled !== false;

  /*
   * ---------------------------------------------------------
   * Theme
   * ---------------------------------------------------------
   */

  const themeSettings =
    websiteSettings?.theme &&
    typeof websiteSettings.theme === 'object'
      ? websiteSettings.theme
      : {};

  const theme = {
    primaryColor:
      themeSettings.primaryColor ||
      fallback?.theme?.primaryColor ||
      '#2563eb',

    secondaryColor:
      themeSettings.secondaryColor ||
      fallback?.theme?.secondaryColor ||
      '#f59e0b',

    backgroundColor:
      themeSettings.backgroundColor ||
      fallback?.theme?.backgroundColor ||
      '#ffffff',

    textColor:
      themeSettings.textColor ||
      fallback?.theme?.textColor ||
      '#0f172a',
  };

  /*
   * ---------------------------------------------------------
   * Domain / slug
   * ---------------------------------------------------------
   */

  const slug =
    record?.website_slug ||
    fallback?.slug ||
    '';

  const customDomain =
    record?.custom_domain ||
    fallback?.customDomain ||
    '';

  /*
   * ---------------------------------------------------------
   * Debug
   * ---------------------------------------------------------
   */

  

 




  return {
    ...fallback,

    /*
     * Database identity
     */
    id,

    user_id: shopOwnerId,

    shopOwnerId,

    /*
     * Business
     */
    businessName,

    ownerName,

    businessType,

    /*
     * Contact
     */
    phone,

    phone1Number: phone,

    phone2Number,

    whatsapp,

    contactList,

    address,

    city,

    email,

    /*
     * Currency
     */
    currencySymbol,

    /*
     * Logo
     */
    logoPath,

    logoUrl,

    /*
     * Website content
     */
    about_our_business:
      websiteContent?.about_our_business ||
      '',

    what_we_offer:
      websiteContent?.what_we_offer ||
      '',

    why_choose_us:
      websiteContent?.why_choose_us ||
      '',

    /*
     * Website settings
     */
    websiteEnabled,

    /*
     * Notifications
     */
    notifications: {
      enabled:
        notifications.enabled === true,

      notifyApp:
        notifications.notifyApp === true,

      notifyWhatsapp:
        notifications.notifyWhatsapp === true,

      whatsappNumber:
        notifications.whatsappNumber ||
        '',
    },

    /*
     * Theme
     */
    theme,

    primaryColor:
      theme.primaryColor,

    secondaryColor:
      theme.secondaryColor,

    backgroundColor:
      theme.backgroundColor,

    textColor:
      theme.textColor,

    /*
     * Social accounts
     */
    socialAccounts: Array.isArray(
      socialAccounts
    )
      ? socialAccounts
      : [],

    /*
     * Tenant URL
     */
    slug,

    website_slug: slug,

    customDomain,

    custom_domain:
      record?.custom_domain || '',

    /*
     * This is a real tenant record,
     * so don't keep fallback isUnknown=true.
     */
    isUnknown: false,

    source:
      fallback?.source || 'database',

    domain:
      customDomain ||
      slug ||
      fallback?.domain ||
      '',
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
    .select('id, name, price, item_code, qty, color, unit, category, image_path,created_date')
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
  const created_date = pickFirstDefined(record, ['created_date'], fallback.created_date ?? null);

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
    created_date,
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

export async function fetchQuotations(customerId = '',shopOwnerId = '') {

  if (!customerId) {
    return { data: [], source: 'private', error: null };
  }

  const { data, error } = await supabase
    .from('quotation')
    .select('*')
    .eq('customer_id', customerId)
    .eq('shop_owner_id',shopOwnerId)
    .order('created_date', { ascending: false })
    .limit(50);
  if (error) {
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
    .select('full_name, phone,city,cargo, last_quotation_no',)
    .eq('id', customerId)
    .maybeSingle();

  const customerName = profile?.full_name || 'Customer';
  const customerPhone = profile?.phone || '';
  const customerCity = profile?.city || '';
  const customerCargo = profile?.cargo || '';
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
        customer_city: customerCity,
        customer_cargo: customerCargo,
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
export async function updateQuotation({ quotationId, shopOwnerId, items = [], remarks = '' }) {
  const totalAmount = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product.price), 0);
  const { error: updateError } = await supabase
    .from('quotation')
    .update({ total_amount: totalAmount,
      remarks: remarks?.trim() || null,})
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

export async function resolveShopOwnerIdBySlugOrDomain(hostname) {
  const normalized = (hostname || '').toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '');

  if (!normalized) {
    return null;
  }

  // Priority 1: check if this exact hostname matches someone's custom_domain
  const { data: customDomainMatch } = await supabase
    .from('BusinessDetail')
    .select('shop_owner_id')
    .eq('custom_domain', normalized)
    .limit(1)
    .maybeSingle();

  if (customDomainMatch?.shop_owner_id) {
    return customDomainMatch.shop_owner_id;
  }

  // Priority 2: fall back to matching the subdomain as a website_slug
  const subdomain = normalized.split('.')[0];

  const { data: slugMatch } = await supabase
    .from('BusinessDetail')
    .select('shop_owner_id')
    .eq('website_slug', subdomain)
    .limit(1)
    .maybeSingle();

  return slugMatch?.shop_owner_id || null;
}
export function isValidUuid(value) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}
export function normalizeCustomerProfile(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id || '',
    fullName: record.full_name || '',
    phone: record.phone || '',
    email: record.email || '',
    city: record.city || '',
    cargo: record.cargo || '',
    createdAt: record.created_at || null,
    lastQuotationNo: record.last_quotation_no ?? 0,
  };
}
export async function fetchCustomerProfile(customerId) {
  if (!customerId) {
    return {
      data: null,
      error: new Error('Customer ID is required.'),
    };
  }

  const { data, error } = await supabase
    .from('customer_profile')
    .select(`
      id,
      full_name,
      phone,
      email,
       city,
      cargo,
      created_at,
      last_quotation_no
    `)
    .eq('id', customerId)
    .maybeSingle();


  if (error) {
    return {
      data: null,
      error,
    };
  }

  return {
    data: normalizeCustomerProfile(data),
    error: null,
  };
}
export async function updateCustomerProfile(
  customerId,
  {
    fullName,
    phone,
    city,
    cargo,
  }
) {
  if (!customerId) {
    return {
      data: null,
      error: new Error('Customer ID is required.'),
    };
  }

  const { data, error } = await supabase
    .from('customer_profile')
    .update({
      full_name: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      cargo: cargo.trim(),
    })
    .eq('id', customerId)
    .select(`
      id,
      full_name,
      phone,
      email,
      city,
      cargo,
      created_at,
      last_quotation_no
    `)
    .single();

  if (error) {
    return {
      data: null,
      error,
    };
  }

  return {
    data: normalizeCustomerProfile(data),
    error: null,
  };
}
export async function createCustomerProfile({
  customerId,
  email,
  fullName,
  phone,
  city,
  cargo,
}) {
  if (!customerId) {
    return {
      data: null,
      error: new Error('Customer ID is required.'),
    };
  }

  const { data, error } = await supabase
    .from('customer_profile')
    .insert({
      id: customerId,
      email: email || '',
      full_name: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      cargo: cargo.trim(),
      last_quotation_no: 0,
    })
    .select(`
      id,
      full_name,
      phone,
      email,
      city,
      cargo,
      created_at,
      last_quotation_no
    `)
    .single();

  if (error) {
    console.error(
      'Create customer profile error:',
      error
    );

    return {
      data: null,
      error,
    };
  }

  return {
    data: normalizeCustomerProfile(data),
    error: null,
  };
}