/**
 * Spend Intelligence Aggregator
 * Consolidates contracts + transactions by customer and flags risk signals.
 */

const BIG_SPENDER_THRESHOLD = 1000;
const MULTI_CONTRACT_THRESHOLD = 3;
const MULTI_CARD_THRESHOLD = 2;

const normalizeKey = (name) =>
  (name || '').trim().toLowerCase().replace(/\s+/g, ' ');

export function aggregateSpenders({ venueContracts = [], vipRecords = [], gbOrders = [], posTransactions = [] }) {
  const profiles = new Map();

  const upsert = (key, displayName, patch) => {
    if (!key) return;
    const existing = profiles.get(key) || {
      key,
      displayName,
      totalSpend: 0,
      contracts: [],
      transactions: [],
      paymentMethods: new Set(),
      cardsUsed: new Set(),
      lastActivity: null,
    };
    Object.assign(existing, patch(existing));
    profiles.set(key, existing);
  };

  venueContracts.forEach((c) => {
    const key = normalizeKey(c.customer_name);
    upsert(key, c.customer_name, (p) => ({
      totalSpend: p.totalSpend + (Number(c.grand_total) || Number(c.contract_amount) || 0),
      contracts: [...p.contracts, { ...c, _source: 'VenueContract' }],
      paymentMethods: new Set([...p.paymentMethods, c.payment_method].filter(Boolean)),
      cardsUsed: c.card_last_four ? new Set([...p.cardsUsed, c.card_last_four]) : p.cardsUsed,
      lastActivity: c.created_date,
    }));
  });

  vipRecords.forEach((c) => {
    const key = normalizeKey(c.customer_name || c.guest_name);
    upsert(key, c.customer_name || c.guest_name, (p) => ({
      totalSpend: p.totalSpend + (Number(c.grand_total) || 0),
      contracts: [...p.contracts, { ...c, _source: 'VIPContractRecord' }],
      paymentMethods: new Set([...p.paymentMethods, c.payment_method].filter(Boolean)),
      cardsUsed: c.card_last_four ? new Set([...p.cardsUsed, c.card_last_four]) : p.cardsUsed,
      lastActivity: c.created_date,
    }));
  });

  gbOrders.forEach((o) => {
    const key = normalizeKey(o.customer_name);
    upsert(key, o.customer_name, (p) => ({
      totalSpend: p.totalSpend + (Number(o.grand_total) || Number(o.amount) || 0),
      contracts: [...p.contracts, { ...o, _source: 'GlyphBucksOrder' }],
      paymentMethods: new Set([...p.paymentMethods, o.payment_method].filter(Boolean)),
      cardsUsed: o.card_last_four ? new Set([...p.cardsUsed, o.card_last_four]) : p.cardsUsed,
      lastActivity: o.created_date,
    }));
  });

  posTransactions.forEach((t) => {
    const key = normalizeKey(t.customer_name || t.customer_id);
    if (!key) return;
    upsert(key, t.customer_name || 'POS Customer', (p) => ({
      totalSpend: p.totalSpend + (Number(t.total) || 0),
      transactions: [...p.transactions, t],
      paymentMethods: new Set([...p.paymentMethods, t.payment_method].filter(Boolean)),
      lastActivity: t.created_date,
    }));
  });

  return Array.from(profiles.values())
    .map((p) => {
      const contractCount = p.contracts.length;
      const cardCount = p.cardsUsed.size;
      const flags = [];
      if (p.totalSpend >= BIG_SPENDER_THRESHOLD) flags.push('BIG_SPENDER');
      if (contractCount >= MULTI_CONTRACT_THRESHOLD) flags.push('MULTI_CONTRACT');
      if (cardCount >= MULTI_CARD_THRESHOLD) flags.push('MULTI_CARD');
      return {
        ...p,
        paymentMethods: Array.from(p.paymentMethods),
        cardsUsed: Array.from(p.cardsUsed),
        contractCount,
        transactionCount: p.transactions.length,
        flags,
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend);
}

export const THRESHOLDS = {
  BIG_SPENDER_THRESHOLD,
  MULTI_CONTRACT_THRESHOLD,
  MULTI_CARD_THRESHOLD,
};