// Realistic Night demo dataset for NUPS DEMO mode.
// Every NUPS-touched entity, every field populated.
// Pure data — no DB calls. Consumed by writeEntity.seedDemoEcosystem.

export const DEMO_VENUE_ID = 'DEMO_VENUE_001';
export const DEMO_LOCATION_ID = 'DEMO_LOC_001';
export const DEMO_NIGHT_DATE = '2026-05-15';

// Supports hours > 23 (post-midnight shift times like 24, 27, 28) by rolling forward via Date arithmetic
const T = (h, m = 0) => {
  const d = new Date(`${DEMO_NIGHT_DATE}T00:00:00.000Z`);
  d.setUTCHours(d.getUTCHours() + h);
  d.setUTCMinutes(d.getUTCMinutes() + m);
  return d.toISOString();
};
const DATE = DEMO_NIGHT_DATE;

// ---------- STAFF (NUPSUser) ----------
export const STAFF = [
  { username: 'demo_owner',   full_name: 'Marcus Demo',     role: 'VENUE_OWNER',   pin: '1000', employee_id: 'OWN-001', phone: '555-0100', status: 'active' },
  { username: 'demo_mgr',     full_name: 'Diana Demo',      role: 'VENUE_MANAGER', pin: '1111', employee_id: 'MGR-001', phone: '555-0111', status: 'active' },
  { username: 'demo_bar',     full_name: 'Tony Demo',       role: 'BARTENDER',     pin: '2222', employee_id: 'BAR-001', phone: '555-0222', status: 'active' },
  { username: 'demo_bar2',    full_name: 'Rachel Demo',     role: 'BARTENDER',     pin: '2223', employee_id: 'BAR-002', phone: '555-0223', status: 'active' },
  { username: 'demo_host',    full_name: 'Bella Demo',      role: 'FLOOR_HOST',    pin: '3333', employee_id: 'HOST-001', phone: '555-0333', status: 'active' },
  { username: 'demo_sec',     full_name: 'Bruno Demo',      role: 'SECURITY',      pin: '4444', employee_id: 'SEC-001', phone: '555-0444', status: 'active' },
  { username: 'demo_dj',      full_name: 'DJ Phoenix',      role: 'DJ',            pin: '5555', employee_id: 'DJ-001',  phone: '555-0555', status: 'active' },
];

// ---------- ENTERTAINERS ----------
export const ENTERTAINERS = [
  { stage_name: 'Crystal', legal_name: 'Crystal Demo', phone: '555-1001', email: 'crystal@demo.test',
    date_of_birth: '1998-03-12T00:00:00.000Z', contract_signed: true, contract_signed_date: T(18),
    contract_ip_address: '10.0.0.10', contract_status: 'VALID', status: 'active',
    commission_rate: 0.5, total_earnings: 2400, vip_room_count: 2,
    emergency_contact: { name: 'Jane Doe', phone: '555-9001', relationship: 'sister' },
    schedule: [{ day: 'Friday', start_time: '20:00', end_time: '02:00' }] },
  { stage_name: 'Nova',    legal_name: 'Nova Demo',    phone: '555-1002', email: 'nova@demo.test',
    date_of_birth: '1999-07-22T00:00:00.000Z', contract_signed: true, contract_signed_date: T(18, 15),
    contract_ip_address: '10.0.0.11', contract_status: 'VALID', status: 'active',
    commission_rate: 0.5, total_earnings: 1150, vip_room_count: 1,
    emergency_contact: { name: 'Mike Doe', phone: '555-9002', relationship: 'brother' },
    schedule: [{ day: 'Friday', start_time: '21:00', end_time: '03:00' }] },
  { stage_name: 'Jade',    legal_name: 'Jade Demo',    phone: '555-1003', email: 'jade@demo.test',
    date_of_birth: '1997-11-05T00:00:00.000Z', contract_signed: true, contract_signed_date: T(18, 30),
    contract_ip_address: '10.0.0.12', contract_status: 'VALID', status: 'active',
    commission_rate: 0.5, total_earnings: 660, vip_room_count: 0,
    emergency_contact: { name: 'Lisa Doe', phone: '555-9003', relationship: 'mother' },
    schedule: [{ day: 'Friday', start_time: '22:00', end_time: '04:00' }] },
];

// ---------- POS PRODUCTS ----------
export const PRODUCTS = [
  { name: 'Domestic Beer',     sku: 'BEER-DOM',  barcode: '1000000001', price: 8,   cost: 2,   category: 'Beer & Wine',  stock_quantity: 240, low_stock_threshold: 24, supplier: 'Local Distrib', is_active: true, taxable: true, tax_rate: 0.08, description: 'Domestic bottled beer' },
  { name: 'Premium Cocktail',  sku: 'CKT-PREM',  barcode: '1000000002', price: 18,  cost: 5,   category: 'Spirits',      stock_quantity: 120, low_stock_threshold: 12, supplier: 'Top Shelf Co',  is_active: true, taxable: true, tax_rate: 0.08, description: 'House premium cocktail' },
  { name: 'Champagne Bottle',  sku: 'CHAMP-01',  barcode: '1000000003', price: 250, cost: 80,  category: 'Spirits',      stock_quantity: 48,  low_stock_threshold: 6,  supplier: 'Top Shelf Co',  is_active: true, taxable: true, tax_rate: 0.08, description: 'Mid-range champagne for VIP' },
  { name: 'VIP Room Hour',     sku: 'VIP-HR',    barcode: '1000000004', price: 300, cost: 0,   category: 'VIP Service',  stock_quantity: 999, low_stock_threshold: 0,  supplier: 'House',          is_active: true, taxable: false, tax_rate: 0,    description: 'One hour VIP room service' },
  { name: 'Energy Drink',      sku: 'ENRG-01',   barcode: '1000000005', price: 6,   cost: 1.5, category: 'Mixers',       stock_quantity: 180, low_stock_threshold: 18, supplier: 'Local Distrib', is_active: true, taxable: true, tax_rate: 0.08, description: 'Standard energy drink mixer' },
];

// ---------- POS CUSTOMERS ----------
export const CUSTOMERS = [
  { customer_id: 'DEMO-CUST-001', full_name: 'Robert Spender',  email: 'robert@demo.test',  phone: '555-2001', address: '123 Main St',   city: 'Phoenix', state: 'AZ', zip_code: '85001', total_spent: 4200, visit_count: 12, loyalty_points: 420, loyalty_tier: 'Gold',     status: 'vip',    last_visit: T(20), birthday: '1985-06-15', preferences: { favorite_categories: ['Spirits', 'VIP Service'], communication_preferences: { email: true, sms: true, phone: false } } },
  { customer_id: 'DEMO-CUST-002', full_name: 'James Regular',   email: 'james@demo.test',   phone: '555-2002', address: '456 Oak Ave',   city: 'Phoenix', state: 'AZ', zip_code: '85002', total_spent: 850,  visit_count: 4,  loyalty_points: 85,  loyalty_tier: 'Silver',   status: 'active', last_visit: T(21), birthday: '1990-11-22', preferences: { favorite_categories: ['Beer & Wine'], communication_preferences: { email: true, sms: false, phone: false } } },
  { customer_id: 'DEMO-CUST-003', full_name: 'David Newbie',    email: 'david@demo.test',   phone: '555-2003', address: '789 Pine Rd',   city: 'Mesa',    state: 'AZ', zip_code: '85201', total_spent: 120,  visit_count: 1,  loyalty_points: 12,  loyalty_tier: 'Bronze',   status: 'active', last_visit: T(22), birthday: '1995-02-08', preferences: { favorite_categories: [], communication_preferences: { email: false, sms: false, phone: false } } },
  { customer_id: 'DEMO-CUST-004', full_name: 'Anthony Platinum',email: 'anthony@demo.test', phone: '555-2004', address: '321 Elite Blvd',city: 'Scottsdale', state: 'AZ', zip_code: '85250', total_spent: 18500, visit_count: 42, loyalty_points: 1850, loyalty_tier: 'Platinum', status: 'vip', last_visit: T(22, 30), birthday: '1980-09-30', preferences: { favorite_categories: ['VIP Service', 'Spirits'], communication_preferences: { email: true, sms: true, phone: true } } },
];

// ---------- POS LOCATION ----------
export const LOCATION = {
  location_id: DEMO_LOCATION_ID, name: 'Demo Main Floor', address: '100 Demo Way', city: 'Phoenix', state: 'AZ', zip_code: '85003',
  phone: '555-0001', email: 'venue@demo.test', manager_email: 'demo_mgr@demo.test', is_active: true,
  opening_hours: { monday: 'Closed', tuesday: '20:00-02:00', wednesday: '20:00-02:00', thursday: '20:00-03:00', friday: '20:00-04:00', saturday: '20:00-04:00', sunday: 'Closed' },
  total_revenue: 4210, total_transactions: 15,
};

// ---------- POS BATCH (closed shift) ----------
export const BATCH = {
  batch_id: `DEMO-BATCH-${DATE}`, venue_id: DEMO_VENUE_ID, start_time: T(19), end_time: T(28),
  opening_cash: 500, closing_cash: 1742, total_sales: 1242, transaction_count: 15, cashier: 'demo_bar',
  status: 'closed', discrepancy: 0, notes: 'Friday night demo shift — clean close',
};

// ---------- POS TRANSACTIONS (15 — mixed cash/card, with tips) ----------
function tx(id, hour, items, payment, customerId) {
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const tip = payment === 'Cash' ? Math.round(subtotal * 0.18 * 100) / 100 : Math.round(subtotal * 0.20 * 100) / 100;
  const total = Math.round((subtotal + tax + tip) * 100) / 100;
  return {
    transaction_id: `DEMO-TX-${DATE}-${id}`, venue_id: DEMO_VENUE_ID, customer_id: customerId || null,
    location_id: DEMO_LOCATION_ID, items, subtotal, tax, discount: 0, tip, total,
    payment_method: payment, cashier: 'demo_bar', loyalty_points_earned: Math.floor(total / 10),
    loyalty_points_redeemed: 0, status: 'completed', notes: null,
  };
}
const beer = (q) => ({ product_id: 'BEER-DOM', product_name: 'Domestic Beer', quantity: q, price: 8, total: 8 * q });
const cocktail = (q) => ({ product_id: 'CKT-PREM', product_name: 'Premium Cocktail', quantity: q, price: 18, total: 18 * q });
const champagne = (q) => ({ product_id: 'CHAMP-01', product_name: 'Champagne Bottle', quantity: q, price: 250, total: 250 * q });
const energy = (q) => ({ product_id: 'ENRG-01', product_name: 'Energy Drink', quantity: q, price: 6, total: 6 * q });

export const TRANSACTIONS = [
  tx('001', 20, [beer(2)],              'Cash',        'DEMO-CUST-002'),
  tx('002', 20, [cocktail(1)],          'Credit Card', 'DEMO-CUST-001'),
  tx('003', 21, [beer(4)],              'Cash',         null),
  tx('004', 21, [cocktail(2), beer(1)], 'Credit Card', 'DEMO-CUST-002'),
  tx('005', 21, [champagne(1)],         'Credit Card', 'DEMO-CUST-001'),
  tx('006', 22, [beer(2), energy(2)],   'Cash',         null),
  tx('007', 22, [cocktail(3)],          'Debit Card',  'DEMO-CUST-003'),
  tx('008', 22, [beer(6)],              'Cash',         null),
  tx('009', 23, [cocktail(1), beer(2)], 'Credit Card', 'DEMO-CUST-004'),
  tx('010', 23, [champagne(2)],         'Credit Card', 'DEMO-CUST-004'),
  tx('011', 23, [beer(3)],              'Cash',         null),
  tx('012', 24, [cocktail(2)],          'Credit Card',  null),
  tx('013', 25, [beer(2)],              'Cash',         null),
  tx('014', 25, [energy(4), beer(1)],   'Credit Card', 'DEMO-CUST-002'),
  tx('015', 26, [cocktail(1), beer(1)], 'Cash',         null),
];

// ---------- POS Z REPORT ----------
const cashSales = TRANSACTIONS.filter(t => t.payment_method === 'Cash').reduce((s, t) => s + t.subtotal + t.tax, 0);
const cardSales = TRANSACTIONS.filter(t => t.payment_method !== 'Cash').reduce((s, t) => s + t.subtotal + t.tax, 0);
const totalSales = Math.round((cashSales + cardSales) * 100) / 100;

export const Z_REPORT = {
  report_id: `DEMO-Z-${DATE}`, venue_id: DEMO_VENUE_ID, report_date: DATE,
  start_time: T(19), end_time: T(28), cashier_name: 'demo_bar',
  opening_cash: 500, closing_cash: 1742,
  cash_sales: Math.round(cashSales * 100) / 100, card_sales: Math.round(cardSales * 100) / 100,
  total_sales: totalSales, transaction_count: 15, real_transaction_count: 0, demo_transaction_count: 15,
  vip_room_revenue: 1800, bar_revenue: totalSales - 1800, merchandise_revenue: 0,
  discrepancy: 0, batch_id: BATCH.batch_id,
  products_sold: [
    { product_name: 'Domestic Beer',    quantity: 23, total: 184 },
    { product_name: 'Premium Cocktail', quantity: 10, total: 180 },
    { product_name: 'Champagne Bottle', quantity: 3,  total: 750 },
    { product_name: 'Energy Drink',     quantity: 6,  total: 36 },
  ],
  notes: 'Demo Z-Report — Friday night realistic shift',
  expected_cash: 500 + Math.round(cashSales * 100) / 100, actual_cash: 1742,
  cash_over_short: Math.round((1742 - (500 + cashSales)) * 100) / 100,
  corrected_total_sales: totalSales, batch_discrepancy_total: 0,
  requires_review: false, reconciliation_notes: 'Clean close',
  reconciled_by: 'demo_mgr@demo.test', reconciled_at: T(28, 30),
};

// ---------- TIP PAYOUT ----------
export const TIP_PAYOUT = {
  payout_date: DATE, venue_id: DEMO_VENUE_ID, total_tips: 248,
  split_config: { bucket: 'BUCKET_1_STAFF_POOL', manager: 0.30, hostess: 0.20, asst_manager: 0.10, dj: 0.10, security_doorman_remainder: 0.30 },
  signatures: [
    { employee_id: 'MGR-001', employee_name: 'Diana Demo', pool: 'manager',  amount: 74.40, signed_at: T(28, 30) },
    { employee_id: 'HOST-001',employee_name: 'Bella Demo', pool: 'hostess',  amount: 49.60, signed_at: T(28, 31) },
    { employee_id: 'DJ-001',  employee_name: 'DJ Phoenix', pool: 'dj',       amount: 24.80, signed_at: T(28, 32) },
    { employee_id: 'SEC-001', employee_name: 'Bruno Demo', pool: 'security', amount: 74.40, signed_at: T(28, 33) },
  ],
  cashier_summary: { demo_bar: 248 }, printed_at: T(28, 35),
  manager_email: 'demo_mgr@demo.test', status: 'completed',
};

// ---------- VIP ROOMS + GUESTS + SESSIONS ----------
export const VIP_ROOMS = [
  { room_number: 'VIP-1', venue_id: DEMO_VENUE_ID, room_name: 'Skyline Suite', status: 'available', rate_per_hour: 300, surveillance_camera: 'CAM-01', has_audio: false, notes: 'Demo cleanup complete' },
  { room_number: 'VIP-2', venue_id: DEMO_VENUE_ID, room_name: 'Velvet Room',   status: 'available', rate_per_hour: 300, surveillance_camera: 'CAM-02', has_audio: false, notes: '' },
  { room_number: 'VIP-3', venue_id: DEMO_VENUE_ID, room_name: 'Diamond Lounge',status: 'cleaning',  rate_per_hour: 400, surveillance_camera: 'CAM-03', has_audio: true,  notes: 'Post-session cleaning' },
];

export const VIP_GUESTS = [
  { guest_id: 'DEMO-VG-001', venue_id: DEMO_VENUE_ID, full_name: 'Robert Spender',   phone: '555-2001', email: 'robert@demo.test',   status: 'left_building', last_visit: T(23), date_of_birth: '1985-06-15T00:00:00.000Z', id_verified: true, id_verified_by: 'demo_host@demo.test', id_verified_at: T(21), notes: 'Regular VIP' },
  { guest_id: 'DEMO-VG-002', venue_id: DEMO_VENUE_ID, full_name: 'Anthony Platinum', phone: '555-2004', email: 'anthony@demo.test', status: 'left_building', last_visit: T(25), date_of_birth: '1980-09-30T00:00:00.000Z', id_verified: true, id_verified_by: 'demo_host@demo.test', id_verified_at: T(22, 30), notes: 'Platinum tier — comped champagne' },
];

// ---------- VENUE CONTRACTS (2 — one VIP, one GlyphBucks) ----------
export const VENUE_CONTRACTS = [
  {
    contract_id: 'DEMO-VC-001', venue_id: DEMO_VENUE_ID, contract_type: 'VIP Package',
    customer_id: 'DEMO-CUST-001', customer_name: 'Robert Spender', customer_id_number: 'AZ-DL-1234567',
    customer_address: '123 Main St', customer_state: 'AZ', customer_zip: '85001',
    entertainer_id: 'DEMO-ENT-Crystal', entertainer_name: 'Crystal',
    contract_amount: 1200, glyphbucks_issued: 0, processing_surcharge: 0, waitress_tip: 50, grand_total: 1250,
    vip_session_id: 'DEMO-VIP-SESS-001', batch_id: BATCH.batch_id,
    payment_method: 'Credit Card', purchaser_card_name: 'ROBERT SPENDER', card_last_four: '4242', card_exp: '12/28', approval_code: 'AUTH-DEMO-001',
    ip_address: '10.0.0.50', is_printed: true, is_signed: true, customer_signature: 'data:demo:rsig1', signed_at: T(21, 5),
    manager_id: 'MGR-001', audit_log_id: null, status: 'fulfilled', notes: 'Demo VIP contract',
    scan_status: 'VERIFIED', scanned_at: T(21, 15), scanned_by: 'demo_mgr@demo.test',
    is_demo: true, demo_label: 'Realistic Night Demo',
  },
  {
    contract_id: 'DEMO-VC-002', venue_id: DEMO_VENUE_ID, contract_type: 'GlyphBucks Purchase',
    customer_id: 'DEMO-CUST-004', customer_name: 'Anthony Platinum', customer_id_number: 'AZ-DL-7654321',
    customer_address: '321 Elite Blvd', customer_state: 'AZ', customer_zip: '85250',
    entertainer_id: null, entertainer_name: null,
    contract_amount: 1000, glyphbucks_issued: 1000, processing_surcharge: 300, waitress_tip: 100, grand_total: 1400,
    glyphbucks_transaction_id: 'DEMO-GBT-001', batch_id: BATCH.batch_id,
    payment_method: 'Credit Card', purchaser_card_name: 'ANTHONY PLATINUM', card_last_four: '1881', card_exp: '08/29', approval_code: 'AUTH-DEMO-002',
    ip_address: '10.0.0.51', is_printed: true, is_signed: true, customer_signature: 'data:demo:asig1', signed_at: T(22, 10),
    manager_id: 'MGR-001', audit_log_id: null, status: 'fulfilled', notes: 'Demo GlyphBucks purchase — $1000 face value',
    scan_status: 'VERIFIED', scanned_at: T(22, 20), scanned_by: 'demo_mgr@demo.test',
    is_demo: true, demo_label: 'Realistic Night Demo',
  },
];

// ---------- GLYPHBUCKS ----------
export const GLYPHBUCKS_TRANSACTION = {
  transaction_id: 'DEMO-GBT-001', venue_id: DEMO_VENUE_ID, transaction_type: 'Issue', amount: 1000,
  customer_id: 'DEMO-CUST-004', customer_name: 'Anthony Platinum',
  contract_id: 'DEMO-VC-002', vip_session_id: null, pos_transaction_id: null,
  batch_id: BATCH.batch_id, cashier_id: 'demo_mgr@demo.test', audit_log_id: null,
  notes: 'GlyphBucks issued to Platinum tier customer',
  status: 'active', expires_at: T(28, 0), is_redeemable: true,
};

export const GLYPHBUCKS_BATCH = {
  batch_id: 'DEMO-GBB-001', venue_id: DEMO_VENUE_ID, transaction_id: 'DEMO-GBT-001', order_number: 'DEMO-GBO-001',
  denominations: [
    { denomination: 100, quantity: 5, total_value: 500 },
    { denomination: 50,  quantity: 6, total_value: 300 },
    { denomination: 20,  quantity: 10, total_value: 200 },
  ],
  total_face_value: 1000, surcharge_rate: 0.3, surcharge_amount: 300, total_charged: 1300,
  approval_code: 'AUTH-DEMO-002', processor_reference: 'PROC-REF-DEMO-002',
  batch_barcode: 'BC-DEMO-GBB-001', batch_barcode_url: null,
  status: 'partially_redeemed', issued_at: T(22, 10), issued_by: 'demo_mgr@demo.test',
};

function bill(serial, denom, status, redeemedBy = null, redemptionAmount = null) {
  return {
    serial_number: serial, batch_id: 'DEMO-GBB-001', transaction_id: 'DEMO-GBT-001', venue_id: DEMO_VENUE_ID,
    denomination: denom, barcode_number: `BC-${serial}`, barcode_url: null, qr_code_url: null,
    status, issued_to_customer: 'Anthony Platinum', issued_at: T(22, 10),
    redeemed_at: redeemedBy ? T(27, 0) : null,
    redeemed_by_contractor_id: redeemedBy, redemption_payout_id: redeemedBy ? 'DEMO-PAYOUT-001' : null,
    redemption_percentage: 0.5, redemption_amount: redemptionAmount,
  };
}
export const GLYPHBUCKS_BILLS = [
  bill('DEMO-GB-001', 100, 'redeemed', 'DEMO-ENT-Crystal', 50),
  bill('DEMO-GB-002', 100, 'redeemed', 'DEMO-ENT-Crystal', 50),
  bill('DEMO-GB-003', 100, 'issued'),
  bill('DEMO-GB-004', 100, 'issued'),
  bill('DEMO-GB-005', 100, 'issued'),
  bill('DEMO-GB-006', 50,  'redeemed', 'DEMO-ENT-Nova', 25),
  bill('DEMO-GB-007', 50,  'issued'),
  bill('DEMO-GB-008', 50,  'issued'),
  bill('DEMO-GB-009', 50,  'issued'),
  bill('DEMO-GB-010', 50,  'issued'),
  bill('DEMO-GB-011', 50,  'issued'),
  bill('DEMO-GB-012', 20,  'issued'),
];

export const GLYPHBUCKS_ORDER = {
  order_number: 'DEMO-GBO-001', venue_id: DEMO_VENUE_ID, status: 'signed',
  customer_name: 'Anthony Platinum', customer_id_number: 'AZ-DL-7654321',
  customer_address: '321 Elite Blvd', customer_state: 'AZ', customer_zip: '85250',
  purchaser_card_name: 'ANTHONY PLATINUM', card_last_four: '1881', card_exp: '08/29',
  card_token: 'tok_demo_xxxxxxxxxxxx', approval_code: 'AUTH-DEMO-002',
  manager_name: 'Diana Demo', hostess_name: 'Bella Demo',
  line_items: [
    { line_number: 1, room_ent_dur_id: 'VIP-1-Crystal-60min', room_fee: 300, product: 0, amount: 300 },
    { line_number: 2, room_ent_dur_id: null, room_fee: 0, product: 250, amount: 250 },
  ],
  glyphbucks_value: 1000, processing_surcharge: 300, waitress_tip: 100, grand_total: 1950,
  acknowledgments_checked: true,
  customer_signature: 'data:demo:asig1', customer_signature_hash: 'sha256:demo-asig1',
  thumbprint_url: null, thumbprint_hash: 'sha256:demo-thumb-001',
  guest_photo_url: null, id_photo_url: null, id_photo_back_url: null,
  manager_signature: 'data:demo:mgrsig', hostess_signature: 'data:demo:hostsig',
  signed_hardcopy_url: null, barcode_scan: 'BC-DEMO-GBO-001',
  ip_address: '10.0.0.51', user_agent: 'Mozilla/5.0 (Demo)',
  signed_at: T(22, 10), printed_at: T(22, 12), archived_at: null, archived_by: null,
  contract_version: 'v3-digital-02-06-2026',
};

// ---------- ENTERTAINER SHIFTS ----------
export const ENTERTAINER_SHIFTS = [
  { entertainer_id: 'DEMO-ENT-Crystal', venue_id: DEMO_VENUE_ID, check_in_time: T(20), check_out_time: T(28), location: 'VIP Area',    status: 'checked_out', shift_earnings: 2400, vip_sessions: 2 },
  { entertainer_id: 'DEMO-ENT-Nova',    venue_id: DEMO_VENUE_ID, check_in_time: T(21), check_out_time: T(27), location: 'Main Floor',  status: 'checked_out', shift_earnings: 1150, vip_sessions: 1 },
  { entertainer_id: 'DEMO-ENT-Jade',    venue_id: DEMO_VENUE_ID, check_in_time: T(22), check_out_time: T(26), location: 'Stage',       status: 'checked_out', shift_earnings: 660,  vip_sessions: 0 },
];

// ---------- VIP SESSION REPORTS ----------
export const VIP_SESSION_REPORTS = [
  { session_id: 'DEMO-VSR-001', contract_uuid: 'DEMO-VC-001', entertainer_id: 'DEMO-ENT-Crystal', venue_id: DEMO_VENUE_ID, room_number: 'VIP-1', session_date: T(21), status: 'complete', incident_flagged: false, manager_alerted: false, demo: true, answers: { q1: 'No', q2: 'No', q3: 'Yes', q4: 'No', q5: 'No', q6: 'No', q7: 'No', q8: 'No', q9: 'Yes', q10: 'No', q11: 'No', q12: 'No', q13: 'No', q14: 'No', q15: 'Yes', q16: 'No', q17: 'No', q18: 'No', q19: 'No', q20: 'No' } },
  { session_id: 'DEMO-VSR-002', contract_uuid: 'DEMO-VC-001', entertainer_id: 'DEMO-ENT-Crystal', venue_id: DEMO_VENUE_ID, room_number: 'VIP-1', session_date: T(23), status: 'complete', incident_flagged: false, manager_alerted: false, demo: true, answers: { q1: 'No', q2: 'No', q3: 'Yes', q4: 'No', q5: 'No', q6: 'No', q7: 'No', q8: 'No', q9: 'Yes', q10: 'No', q11: 'No', q12: 'No', q13: 'No', q14: 'No', q15: 'Yes', q16: 'No', q17: 'No', q18: 'No', q19: 'No', q20: 'No' } },
  { session_id: 'DEMO-VSR-003', contract_uuid: 'DEMO-VC-001', entertainer_id: 'DEMO-ENT-Nova',    venue_id: DEMO_VENUE_ID, room_number: 'VIP-2', session_date: T(24), status: 'complete', incident_flagged: false, manager_alerted: false, demo: true, answers: { q1: 'No', q2: 'No', q3: 'Yes', q4: 'No', q5: 'No', q6: 'No', q7: 'No', q8: 'No', q9: 'No',  q10: 'No', q11: 'No', q12: 'No', q13: 'No', q14: 'No', q15: 'Yes', q16: 'No', q17: 'No', q18: 'No', q19: 'No', q20: 'No' } },
];

// ---------- VIP CONTRACT RECORD ----------
export const VIP_CONTRACT_RECORDS = [
  { serial_number: 'DEMO-VCR-001', venue_id: DEMO_VENUE_ID, token: 'tkn_demo_001', record_type: 'signed_contract',
    guest_name: 'Robert Spender', room_number: 'VIP-1', booking_id: 'DEMO-VC-001', guest_record_id: 'DEMO-VG-001',
    card_last_four: '4242', card_type: 'Visa', government_id_type: 'Drivers License', government_id_state: 'AZ',
    signature_hash: 'sha256:demo-rsig1', thumbprint_hash: 'sha256:demo-rthumb', id_hash: 'sha256:demo-rid',
    contract_hash: 'sha256:demo-rcontract',
    thumbprint_url: null, guest_photo_url: null, id_photo_url: null, id_photo_back_url: null,
    signed_hardcopy_photo_url: null, hardcopy_barcode_scan: 'BC-DEMO-VCR-001',
    hardcopy_logged_at: T(21, 30), hardcopy_logged_by: 'demo_mgr@demo.test',
    ip_address: '10.0.0.50', user_agent: 'Mozilla/5.0 (Demo)',
    signed_at: T(21, 5), expires_at: T(28, 0), used: true, status: 'signed', issued_by: 'demo_mgr@demo.test',
    metadata: { demo: true, label: 'Realistic Night Demo' } },
];

// ---------- VERIFICATION MEDIA ----------
export const VERIFICATION_MEDIA = [
  { media_id: 'DEMO-VM-001', transaction_id: 'DEMO-VC-001', contract_barcode: 'BC-DEMO-VCR-001', venue_id: DEMO_VENUE_ID,
    media_type: 'signature_capture', media_url: 'https://demo.test/media/sig1.png', media_hash: 'sha256:demo-mediahash-1',
    media_size_bytes: 24500, capture_timestamp: T(21, 5), captured_by: 'demo_mgr@demo.test',
    verification_type: 'customer_signing', upload_status: 'completed', upload_verified_at: T(21, 6),
    secondary_archive_url: 'https://demo.test/archive/sig1.png',
    geolocation: { latitude: 33.4484, longitude: -112.0740, accuracy_meters: 8 },
    metadata: { device: 'tablet-01', app_version: 'demo-1.0' } },
  { media_id: 'DEMO-VM-002', transaction_id: 'DEMO-VC-002', contract_barcode: 'BC-DEMO-GBO-001', venue_id: DEMO_VENUE_ID,
    media_type: 'photo', media_url: 'https://demo.test/media/photo1.jpg', media_hash: 'sha256:demo-mediahash-2',
    media_size_bytes: 124500, capture_timestamp: T(22, 10), captured_by: 'demo_host@demo.test',
    verification_type: 'customer_receiving_bills', upload_status: 'completed', upload_verified_at: T(22, 11),
    secondary_archive_url: 'https://demo.test/archive/photo1.jpg',
    geolocation: { latitude: 33.4484, longitude: -112.0740, accuracy_meters: 8 },
    metadata: { device: 'tablet-02', app_version: 'demo-1.0' } },
];

// ---------- QR THREAT LOG ----------
export const QR_THREAT_LOG = {
  incident_id: 'DEMO-QRT-001', code_id: 'DEMO-QR-001', attack_type: 'Quishing',
  payload: 'https://malicious-demo.test/phish', threat_description: 'Demo phishing payload detected and blocked',
  resolved: true, resolution_notes: 'Blocked at gate; user redirected to safe page', severity: 'medium',
};

// ---------- DRIVER PAYOUT ----------
export const DRIVER_PAYOUT = {
  driver_name: 'Mike Driver', driver_number: '555-7000', driver_code: 'DRV-DEMO-001', venue_id: DEMO_VENUE_ID,
  session_date: DATE,
  drop_offs: [
    { guest_name: 'Robert Spender',   drop_time: T(20, 30), has_pass: true,  pass_type: 'VIP Pass', went_vip: true,  notes: '' },
    { guest_name: 'Anthony Platinum', drop_time: T(22, 0),  has_pass: true,  pass_type: 'Platinum', went_vip: true,  notes: '' },
    { guest_name: 'Walk-in #1',       drop_time: T(23, 15), has_pass: false, pass_type: '',         went_vip: false, notes: 'New customer' },
    { guest_name: 'Walk-in #2',       drop_time: T(24, 5),  has_pass: false, pass_type: '',         went_vip: false, notes: '' },
  ],
  total_drops: 4, vip_count: 2, pass_count: 2,
  base_payout: 40, incentive_bonus: 20, vip_kickback: 50, total_payout: 110,
  status: 'paid', paid_at: T(28, 45), paid_by: 'demo_mgr@demo.test', notes: 'Demo driver payout — 4 drops',
};

// ---------- PAYROLL RECORDS ----------
function payroll(ent_id, stage, legal, commissions, tips, hours, vipSessions) {
  const gross_total = commissions + tips;
  const venue_fee = Math.round(commissions * 0.15 * 100) / 100;
  const tax_withholding = Math.round(gross_total * 0.25 * 100) / 100;
  const other_deductions = 25;
  const net_payout = Math.round((gross_total - venue_fee - tax_withholding - other_deductions) * 100) / 100;
  return {
    pay_period_start: '2026-05-09', pay_period_end: DATE,
    entertainer_id: ent_id, stage_name: stage, legal_name: legal,
    gross_commissions: commissions, gross_tips: tips, gross_total,
    venue_fee, venue_fee_rate: 0.15, tax_withholding, tax_rate: 0.25,
    other_deductions, other_deductions_notes: 'Locker fee',
    net_payout, vip_sessions: vipSessions, shift_hours: hours,
    status: 'approved', paid_at: null, approved_by: 'demo_mgr@demo.test',
    notes: 'Demo payroll — Realistic Night',
  };
}
export const PAYROLL_RECORDS = [
  payroll('DEMO-ENT-Crystal', 'Crystal', 'Crystal Demo', 2000, 400, 8, 2),
  payroll('DEMO-ENT-Nova',    'Nova',    'Nova Demo',     900, 250, 6, 1),
  payroll('DEMO-ENT-Jade',    'Jade',    'Jade Demo',     480, 180, 4, 0),
];

// ---------- DAILY SETTLEMENT ----------
export const DAILY_SETTLEMENT = {
  settlement_id: `DEMO-SET-${DATE}`, venue_id: DEMO_VENUE_ID, settlement_date: DATE,
  entertainer_payouts: [
    { entertainer_id: 'DEMO-ENT-Crystal', stage_name: 'Crystal', gross_revenue: 2400, processing_fees: 72, house_commission: 360, voided_bills_deduction: 0,  net_payout: 1968 },
    { entertainer_id: 'DEMO-ENT-Nova',    stage_name: 'Nova',    gross_revenue: 1150, processing_fees: 35, house_commission: 172, voided_bills_deduction: 0,  net_payout: 943 },
    { entertainer_id: 'DEMO-ENT-Jade',    stage_name: 'Jade',    gross_revenue: 660,  processing_fees: 20, house_commission: 99,  voided_bills_deduction: 25, net_payout: 516 },
  ],
  total_gross_revenue: 4210, total_processing_fees: 127, total_house_commission: 631,
  total_net_payouts: 3427, venue_net_income: 758, reconciliation_status: 'approved',
  approved_by: 'demo_owner@demo.test', approved_at: T(28, 50),
  discrepancies: [], report_url: null,
};

// ---------- CONTRACTOR PAYOUT (GlyphBucks redemption) ----------
export const CONTRACTOR_PAYOUT = {
  payout_id: 'DEMO-PAYOUT-001', contractor_id: 'DEMO-ENT-Crystal', contractor_name: 'Crystal',
  venue_id: DEMO_VENUE_ID, payout_date: DATE, payout_type: 'glyphbucks_redemption',
  bills_redeemed: [
    { serial_number: 'DEMO-GB-001', denomination: 100, redemption_amount: 50 },
    { serial_number: 'DEMO-GB-002', denomination: 100, redemption_amount: 50 },
  ],
  total_face_value: 200, redemption_rate: 0.5, total_payout: 100,
  payment_method: 'cash', payment_reference: 'CASH-DEMO-001',
  approved_by: 'demo_mgr@demo.test', paid_by: 'demo_mgr@demo.test',
  contractor_signature: 'data:demo:crystal_sig', signature_timestamp: T(27, 0),
  status: 'paid', tax_year: 2026, notes: 'GlyphBucks 50% redemption — demo',
};

// ---------- POS CAMPAIGN ----------
export const POS_CAMPAIGN = {
  campaign_id: 'DEMO-CAMP-001', venue_id: DEMO_VENUE_ID, name: 'Friday Night VIP Promo',
  type: 'email', status: 'completed', target_audience: 'vip',
  message: '20% off VIP rooms tonight only!', discount_type: 'percentage', discount_value: 20,
  start_date: T(18), end_date: T(28),
  sent_count: 50, open_count: 32, conversion_count: 4, revenue_generated: 1800,
};

// ---------- POS INVENTORY BATCH ----------
export const POS_INVENTORY_BATCH = {
  batch_id: 'DEMO-INV-001', venue_id: DEMO_VENUE_ID, product_id: 'BEER-DOM', product_name: 'Domestic Beer',
  quantity: 240, cost_per_unit: 2, total_cost: 480, supplier: 'Local Distrib', location_id: DEMO_LOCATION_ID,
  purchase_date: '2026-05-08', expiry_date: '2026-11-08', batch_number: 'BEER-LOT-2026-05',
  status: 'in_stock', notes: 'Demo restock',
};