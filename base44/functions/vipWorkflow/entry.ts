import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// DACO-VIP-FIRST-BUILD-20260717 — VIP contract workflow engine.
// Single authoritative server-side engine for the chain:
// Venue → Guest → Entertainer → Room → Contract → Approval → Signatures →
// Payment → POSTransaction → Receipt → Session → Audit.
// All test records are isolated: VIPContract/VIPSession mode=TEST,
// PaymentRecord/POSTransaction mode=SANDBOX + validation_run, Entertainer mode=SANDBOX, VIPGuest is_demo.
// REAL-mode contracts are rejected while VIPConfig.live_enabled=false. No live processor is ever called.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const E = base44.asServiceRole.entities;
    const body = await req.json();
    const action = body.action;
    const VENUE = body.venue_id || 'dream_palace';
    const now = () => new Date().toISOString();
    const ref = (p) => `${p}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ev = (c, a, detail) => ([...(c.audit_events || []), { action: a, actor: user.email, detail: detail || '', timestamp: now() }]);
    const err = (msg, status = 400) => Response.json({ error: msg }, { status });

    const getConfig = async () => {
      const cfgs = await E.VIPConfig.filter({ venue_id: VENUE, active: true });
      return cfgs[0] || null;
    };
    const getContract = async () => {
      if (!body.contract_record_id) throw new Error('contract_record_id required');
      return await E.VIPContract.get(body.contract_record_id);
    };
    const recompute = (c) => {
      const final = Math.max(0, (c.base_amount || 0) + (c.extensions_amount || 0) + (c.fees_amount || 0) + (c.tax_amount || 0) - (c.discount_amount || 0));
      return { final_amount: Math.round(final * 100) / 100, outstanding_balance: Math.round((final - (c.amount_collected || 0)) * 100) / 100 };
    };

    // ---------- CONFIG ----------
    if (action === 'seedConfig') {
      const existing = await getConfig();
      if (existing) return Response.json({ config: existing, created: false });
      const config = await E.VIPConfig.create({
        venue_id: VENUE, active: true, live_enabled: false,
        services: [
          { code: 'standard', name: 'Standard VIP', rates: [{ minutes: 30, amount: 300 }, { minutes: 60, amount: 500 }], extension_block_minutes: 15, extension_block_amount: 150, minimum_charge: 300 },
          { code: 'champagne', name: 'Champagne Suite', rates: [{ minutes: 60, amount: 800 }, { minutes: 120, amount: 1400 }], extension_block_minutes: 30, extension_block_amount: 350, minimum_charge: 800 }
        ],
        payment_methods: ['Cash', 'Credit Card', 'Comp'],
        card_fee_pct: 5, tax_pct: 0,
        approval_rules: { discount: true, comp: true, manual_price: true, free_extension: true, room_transfer: true, post_signature_correction: true, cancel_after_signing: true, outstanding_balance_closeout: true },
        max_discount_pct_without_owner: 25,
        signature_requirements: ['guest', 'entertainer', 'staff'],
        session_warning_minutes: 5,
        contract_terms: 'VIP suite entertainment agreement — Dream Palace. Non-refundable once the session begins. All services subject to venue policy. Extensions billed at the configured extension rate.',
        receipt_footer: 'Dream Palace — Thank you.', mode: 'REAL'
      });
      return Response.json({ config, created: true });
    }

    if (action === 'getState') {
      const config = await getConfig();
      const [rooms, entertainers, guests, contracts, sessions] = await Promise.all([
        E.VIPRoom.filter({ venue_id: VENUE }, '-created_date', 100),
        E.Entertainer.filter({ venue_id: VENUE, status: 'active' }, '-created_date', 200),
        E.VIPGuest.filter({ venue_id: VENUE }, '-created_date', 200),
        E.VIPContract.filter({ venue_id: VENUE }, '-created_date', 100),
        E.VIPSession.filter({ venue_id: VENUE, status: 'ACTIVE' }, '-created_date', 50)
      ]);
      return Response.json({ config, rooms, entertainers, guests, contracts, sessions, user: { email: user.email, role: user.role } });
    }

    // ---------- ROOMS ----------
    if (action === 'createRoom') {
      if (!body.room_number) return err('room_number required');
      const dupes = await E.VIPRoom.filter({ venue_id: VENUE, room_number: body.room_number });
      if (dupes.length) return err(`Room ${body.room_number} already exists`);
      const room = await E.VIPRoom.create({ room_number: body.room_number, room_name: body.room_name || body.room_number, venue_id: VENUE, status: 'available', rate_per_hour: body.rate_per_hour || 300, mode: 'REAL' });
      return Response.json({ room });
    }
    if (action === 'setRoomStatus') {
      const room = await E.VIPRoom.get(body.room_id);
      if (room.status === 'occupied' && body.status !== 'occupied') {
        const active = await E.VIPSession.filter({ room_id: room.id, status: 'ACTIVE' });
        if (active.length) return err('Room has an active session — close the session first');
      }
      await E.VIPRoom.update(room.id, { status: body.status, entertainer_id: null, entertainer_name: null, guest_name: null });
      return Response.json({ ok: true });
    }

    // ---------- ONBOARDING ----------
    if (action === 'onboardEntertainer') {
      const { legal_name, stage_name, phone } = body;
      if (!legal_name || !stage_name) return err('legal_name and stage_name required');
      const all = await E.Entertainer.filter({ venue_id: VENUE }, null, 500);
      const dupe = all.find(e => (e.stage_name || '').trim().toLowerCase() === stage_name.trim().toLowerCase() || (e.legal_name || '').trim().toLowerCase() === legal_name.trim().toLowerCase());
      if (dupe && !body.allow_duplicate) return err(`Possible duplicate: existing entertainer '${dupe.stage_name}' (${dupe.id}). Confirm before creating.`, 409);
      const entertainer = await E.Entertainer.create({
        legal_name, stage_name, phone: phone || '', email: body.email || '',
        venue_id: VENUE, status: 'active',
        contract_signed: !!body.policy_acknowledged, contract_status: body.policy_acknowledged ? 'VALID' : 'PENDING',
        contract_signed_date: body.policy_acknowledged ? now() : undefined,
        mode: body.live ? 'REAL' : 'SANDBOX'
      });
      return Response.json({ entertainer });
    }

    if (action === 'guestIntake') {
      const { full_name } = body;
      if (!full_name) return err('full_name required');
      let guest_id = 'G-' + crypto.randomUUID().slice(0, 20);
      if (body.id_number) {
        const data = new TextEncoder().encode(body.id_number.trim().toUpperCase());
        const hash = await crypto.subtle.digest('SHA-256', data);
        guest_id = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
        const existing = await E.VIPGuest.filter({ guest_id, venue_id: VENUE });
        if (existing.length) {
          const g = existing[0];
          if (g.status === 'banned') return err('Guest is banned', 403);
          await E.VIPGuest.update(g.id, { visit_count: (g.visit_count || 0) + 1, last_visit: now(), status: 'in_building' });
          return Response.json({ guest: { ...g, visit_count: (g.visit_count || 0) + 1 }, existing: true });
        }
      } else {
        const sameName = await E.VIPGuest.filter({ venue_id: VENUE, full_name }, null, 5);
        if (sameName.length && !body.allow_duplicate) return err(`Possible duplicate guest '${full_name}' (${sameName[0].id}). Confirm or provide ID.`, 409);
      }
      const guest = await E.VIPGuest.create({
        guest_id, full_name, phone: body.phone || '', venue_id: VENUE,
        id_type: body.id_type || undefined, id_state: body.id_state || undefined,
        id_verified: !!body.id_number, id_verified_by: body.id_number ? user.email : undefined,
        id_verified_at: body.id_number ? now() : undefined,
        status: 'in_building', first_visit: now(), last_visit: now(), visit_count: 1,
        is_demo: !body.live
      });
      return Response.json({ guest, existing: false });
    }

    if (action === 'correctGuest') {
      const guest = await E.VIPGuest.get(body.guest_record_id);
      const signedContracts = await E.VIPContract.filter({ guest_id: guest.id, terms_locked: true });
      if (signedContracts.length && !body.manager_name) return err('Guest has signed contracts — correction requires manager approval');
      const patch = {};
      for (const f of ['full_name', 'phone', 'id_state']) if (body[f] !== undefined) patch[f] = body[f];
      await E.VIPGuest.update(guest.id, patch);
      return Response.json({ ok: true });
    }

    // ---------- CONTRACT ----------
    if (action === 'createContract') {
      const config = await getConfig();
      if (!config) return err('VIP configuration missing for this venue — contract rejected');
      const mode = body.mode === 'REAL' ? 'REAL' : 'TEST';
      if (mode === 'REAL' && !config.live_enabled) return err('LIVE mode is not authorized — VIPConfig.live_enabled is false. Use TEST mode.', 403);
      if (body.client_request_id) {
        const dupes = await E.VIPContract.filter({ client_request_id: body.client_request_id });
        if (dupes.length) return Response.json({ contract: dupes[0], duplicate_blocked: true });
      }
      const svc = (config.services || []).find(s => s.code === body.service_code);
      if (!svc) return err('Unknown service type');
      const rate = (svc.rates || []).find(r => r.minutes === Number(body.duration_minutes));
      if (!rate) return err('No configured rate for that duration');
      if (!(config.payment_methods || []).includes(body.payment_method)) return err('Payment method not permitted by venue configuration');
      const [guest, entertainer, room] = await Promise.all([
        E.VIPGuest.get(body.guest_id), E.Entertainer.get(body.entertainer_id), E.VIPRoom.get(body.room_id)
      ]);
      if (!guest || guest.status === 'banned') return err('Guest unavailable or banned');
      if (!entertainer || entertainer.status !== 'active') return err('Entertainer not active');
      const entBusy = await E.VIPSession.filter({ entertainer_id: entertainer.id, status: 'ACTIVE' });
      if (entBusy.length) return err('Entertainer is in an active VIP session');
      if (room.status !== 'available') return err(`Room ${room.room_number} is ${room.status}`);
      const base = rate.amount;
      const fees = body.payment_method === 'Credit Card' ? Math.round(base * (config.card_fee_pct || 0)) / 100 : 0;
      const tax = Math.round(base * (config.tax_pct || 0)) / 100;
      const start = body.planned_start || now();
      const end = new Date(new Date(start).getTime() + Number(body.duration_minutes) * 60000).toISOString();
      const c = {
        contract_id: ref('VIP'), venue_id: VENUE, mode,
        client_request_id: body.client_request_id || crypto.randomUUID(),
        guest_id: guest.id, guest_name: guest.full_name,
        entertainer_id: entertainer.id, entertainer_stage_name: entertainer.stage_name,
        room_id: room.id, room_number: room.room_number,
        staff_id: user.id || user.email, staff_email: user.email,
        service_code: svc.code, service_name: svc.name,
        rate_source: `VIPConfig:${config.id}#${svc.code}`,
        duration_minutes: Number(body.duration_minutes),
        planned_start: start, planned_end: end,
        base_amount: base, fees_amount: fees, tax_amount: tax,
        discount_amount: 0, extensions_amount: 0, amount_collected: 0,
        payment_method: body.payment_method, payment_status: 'UNPAID',
        status: 'PENDING_SIGNATURES', terms_locked: false, signatures: {},
        adjustments: [], audit_events: [{ action: 'CONTRACT_CREATED', actor: user.email, detail: `${svc.name} ${body.duration_minutes}min room ${room.room_number}`, timestamp: now() }]
      };
      const totals = recompute(c);
      const contract = await E.VIPContract.create({ ...c, ...totals });
      return Response.json({ contract });
    }

    if (action === 'applyAdjustment') {
      const c = await getContract();
      const config = await getConfig();
      const { type, amount, reason, manager_name } = body;
      if (!['discount', 'comp', 'manual_price'].includes(type)) return err('Invalid adjustment type');
      if (c.terms_locked) return err('Terms are locked after signing — use a correction amendment');
      if ((config.approval_rules || {})[type]) {
        if (!manager_name || !reason) return err(`${type} requires approving manager name and reason`);
        if (manager_name.trim().toLowerCase() === (user.full_name || user.email).trim().toLowerCase() && user.role !== 'admin') {
          return err('Staff may not self-approve a restricted override', 403);
        }
      }
      let discount = c.discount_amount || 0;
      if (type === 'discount') {
        const pct = (Number(amount) / (c.base_amount || 1)) * 100;
        if (pct > (config.max_discount_pct_without_owner || 25) && user.role !== 'admin') return err(`Discount exceeds ${config.max_discount_pct_without_owner}% limit — owner approval required`, 403);
        discount += Number(amount);
      } else if (type === 'comp') {
        discount = (c.base_amount || 0) + (c.fees_amount || 0) + (c.tax_amount || 0) + (c.extensions_amount || 0);
      }
      const adjustments = [...(c.adjustments || []), { type, description: reason || type, original_value: c.final_amount, amount_delta: -Number(amount || discount), approved_by: manager_name || user.email, reason: reason || '', timestamp: now() }];
      const patch = { discount_amount: Math.round(discount * 100) / 100, adjustments, approving_manager: manager_name || c.approving_manager, audit_events: ev(c, 'ADJUSTMENT_' + type.toUpperCase(), `${reason || ''} approved_by=${manager_name || user.email}`) };
      const totals = recompute({ ...c, ...patch });
      await E.VIPContract.update(c.id, { ...patch, ...totals });
      return Response.json({ contract: { ...c, ...patch, ...totals } });
    }

    if (action === 'sign') {
      const c = await getContract();
      const config = await getConfig();
      const { role, name } = body;
      if (!['guest', 'entertainer', 'staff', 'manager'].includes(role)) return err('Invalid signature role');
      if (!name) return err('Signer name required');
      if (['COMPLETED', 'CANCELED', 'ACTIVE'].includes(c.status)) return err('Contract not in signable state');
      const signatures = { ...(c.signatures || {}), [role]: { name, signed_at: now(), ref: '/s/ ' + name } };
      const required = [...(config.signature_requirements || ['guest', 'entertainer', 'staff'])];
      if ((c.adjustments || []).length && !required.includes('manager')) required.push('manager');
      const allSigned = required.every(r => signatures[r]);
      const patch = {
        signatures, terms_locked: true,
        status: allSigned ? 'SIGNED' : 'PENDING_SIGNATURES',
        signed_at: allSigned ? now() : c.signed_at,
        audit_events: ev(c, 'SIGNATURE_' + role.toUpperCase(), name)
      };
      await E.VIPContract.update(c.id, patch);
      return Response.json({ contract: { ...c, ...patch }, all_signed: allSigned, required });
    }

    if (action === 'pay') {
      const c = await getContract();
      if (c.mode === 'REAL') return err('Live payment processing is not authorized before launch', 403);
      if (c.status !== 'SIGNED') return err(`Contract must be fully signed before payment (status: ${c.status})`);
      if (['PAID', 'COMP'].includes(c.payment_status)) return err('Contract already paid — duplicate charge blocked', 409);
      const amount = c.outstanding_balance ?? c.final_amount;
      if (body.simulate === 'decline') {
        const patch = { payment_status: 'FAILED', audit_events: ev(c, 'PAYMENT_DECLINED', `amount=${amount} method=${c.payment_method} (simulated decline — retry permitted)`) };
        await E.VIPContract.update(c.id, patch);
        return Response.json({ contract: { ...c, ...patch }, payment: { status: 'FAILED', retryable: true } });
      }
      const isComp = c.final_amount === 0;
      let payment_id = null, transaction_id = null;
      const receipt_id = ref('RCPT');
      if (!isComp) {
        const pr = await E.PaymentRecord.create({
          record_id: ref('PR-DP'), venue_id: VENUE, provider_code: 'manual_external',
          processor_reference: 'TEST-' + c.contract_id, approval_code: body.approval_code || 'TEST-AUTH',
          amount, currency: 'USD',
          payment_method: c.payment_method === 'Comp' ? 'Comp' : c.payment_method,
          status: 'EXTERNAL_CONFIRMED', verified_at: now(), verified_by: user.email,
          verification_method: 'manager_manual', linked_order_id: c.contract_id,
          mode: 'SANDBOX', notes: `VIP-TEST contract ${c.contract_id}`
        });
        payment_id = pr.id;
      }
      const tx = await E.POSTransaction.create({
        transaction_id: ref('TXN'), venue_id: VENUE, station: 'vip',
        items: [{ product_id: c.service_code, product_name: `${c.service_name} — ${c.duration_minutes} min — Room ${c.room_number}`, quantity: 1, price: c.base_amount, total: c.base_amount }],
        subtotal: c.base_amount, tax: c.tax_amount || 0, discount: c.discount_amount || 0,
        processing_fee: c.fees_amount || 0, total: c.final_amount,
        cash_sales: c.payment_method === 'Cash' ? c.final_amount : 0,
        card_sales: c.payment_method === 'Credit Card' ? c.final_amount : 0,
        comp_amount: isComp ? c.base_amount : 0,
        comp_authorized_by: isComp ? c.approving_manager : undefined,
        payment_method: isComp ? 'Comp' : c.payment_method, status: 'completed',
        cashier_email: user.email, cashier_name: user.full_name || user.email,
        mode: 'SANDBOX', validation_run: true, funds_settled: false,
        notes: `VIP-TEST contract ${c.contract_id} receipt ${receipt_id}`
      });
      transaction_id = tx.id;
      const patch = {
        payment_status: isComp ? 'COMP' : 'PAID', amount_collected: c.final_amount,
        outstanding_balance: 0, payment_id, transaction_id, receipt_id,
        status: 'PAID', paid_at: now(),
        audit_events: ev(c, 'PAYMENT_CONFIRMED', `amount=${c.final_amount} method=${c.payment_method} receipt=${receipt_id}`)
      };
      await E.VIPContract.update(c.id, patch);
      return Response.json({ contract: { ...c, ...patch }, receipt_id, payment_id, transaction_id });
    }

    if (action === 'activate') {
      const c = await getContract();
      if (c.status !== 'PAID') return err(`Contract must be signed and paid before activation (status: ${c.status}, payment: ${c.payment_status})`);
      const room = await E.VIPRoom.get(c.room_id);
      if (room.status !== 'available') return err(`Room ${room.room_number} is ${room.status}`);
      const busy = await E.VIPSession.filter({ entertainer_id: c.entertainer_id, status: 'ACTIVE' });
      if (busy.length) return err('Entertainer is already in an active session');
      const start = now();
      const planned_end = new Date(Date.now() + c.duration_minutes * 60000).toISOString();
      const session = await E.VIPSession.create({
        session_ref: ref('SES'), contract_id: c.id, venue_id: VENUE, mode: c.mode,
        guest_id: c.guest_id, entertainer_id: c.entertainer_id, room_id: c.room_id,
        actual_start: start, planned_end, status: 'ACTIVE'
      });
      await E.VIPRoom.update(room.id, { status: 'occupied', entertainer_id: c.entertainer_id, entertainer_name: c.entertainer_stage_name, guest_name: c.guest_name, start_time: start, end_time: planned_end });
      const patch = { status: 'ACTIVE', session_id: session.id, activated_at: start, planned_start: start, planned_end, audit_events: ev(c, 'SESSION_ACTIVATED', session.session_ref) };
      await E.VIPContract.update(c.id, patch);
      return Response.json({ contract: { ...c, ...patch }, session });
    }

    if (action === 'extend') {
      const c = await getContract();
      const config = await getConfig();
      if (c.status !== 'ACTIVE' || !c.session_id) return err('No active session to extend');
      const session = await E.VIPSession.get(c.session_id);
      const svc = (config.services || []).find(s => s.code === c.service_code);
      const blocks = Math.max(1, Number(body.blocks || 1));
      const addMinutes = blocks * (svc.extension_block_minutes || 15);
      let charge = blocks * (svc.extension_block_amount || 0);
      if (body.free) {
        if (!body.manager_name || !body.reason) return err('Free extension requires manager approval and reason');
        charge = 0;
      }
      if (charge > 0 && body.simulate === 'decline') {
        await E.VIPContract.update(c.id, { audit_events: ev(c, 'EXTENSION_PAYMENT_DECLINED', `blocks=${blocks} charge=${charge}`) });
        return Response.json({ error: 'Extension payment declined — session end time unchanged', payment: { status: 'FAILED', retryable: true } }, { status: 402 });
      }
      const new_end = new Date(new Date(session.planned_end).getTime() + addMinutes * 60000).toISOString();
      let transaction_id = c.transaction_id;
      let supplemental_receipt = null;
      if (charge > 0) {
        supplemental_receipt = ref('RCPT');
        const tx = await E.POSTransaction.create({
          transaction_id: ref('TXN'), venue_id: VENUE, station: 'vip',
          items: [{ product_id: c.service_code + '-ext', product_name: `VIP Extension ${addMinutes} min — ${c.contract_id}`, quantity: blocks, price: svc.extension_block_amount, total: charge }],
          subtotal: charge, tax: 0, discount: 0, total: charge,
          cash_sales: c.payment_method === 'Cash' ? charge : 0,
          card_sales: c.payment_method === 'Credit Card' ? charge : 0,
          payment_method: c.payment_method, status: 'completed',
          cashier_email: user.email, cashier_name: user.full_name || user.email,
          mode: 'SANDBOX', validation_run: true, funds_settled: false,
          notes: `VIP-TEST extension for ${c.contract_id} receipt ${supplemental_receipt}`
        });
        transaction_id = tx.id;
      }
      await E.VIPSession.update(session.id, { planned_end: new_end, extensions_count: (session.extensions_count || 0) + 1 });
      await E.VIPRoom.update(c.room_id, { end_time: new_end });
      const adjustments = [...(c.adjustments || []), { type: 'extension', description: `+${addMinutes} min`, amount_delta: charge, approved_by: body.manager_name || user.email, reason: body.reason || '', timestamp: now() }];
      const patchBase = { extensions_amount: (c.extensions_amount || 0) + charge, amount_collected: (c.amount_collected || 0) + charge, planned_end: new_end, adjustments, audit_events: ev(c, 'SESSION_EXTENDED', `+${addMinutes}min charge=${charge} receipt=${supplemental_receipt || 'n/a'}`) };
      const totals = recompute({ ...c, ...patchBase });
      await E.VIPContract.update(c.id, { ...patchBase, ...totals });
      return Response.json({ contract: { ...c, ...patchBase, ...totals }, session: { ...session, planned_end: new_end }, supplemental_receipt, transaction_id });
    }

    if (action === 'closeSession') {
      const c = await getContract();
      if (c.status !== 'ACTIVE' || !c.session_id) return err('No active session to close');
      if ((c.outstanding_balance || 0) > 0 && !body.manager_name) return err(`Outstanding balance $${c.outstanding_balance} — manager exception required to close`);
      const session = await E.VIPSession.get(c.session_id);
      const end = now();
      await E.VIPSession.update(session.id, { status: 'COMPLETED', actual_end: end, closed_by: user.email, close_note: body.note || '' });
      await E.VIPRoom.update(c.room_id, { status: 'cleaning', entertainer_id: null, entertainer_name: null, guest_name: null, start_time: null, end_time: null });
      const patch = { status: 'COMPLETED', completed_at: end, audit_events: ev(c, 'SESSION_CLOSED', body.manager_name ? `manager_exception=${body.manager_name}` : 'clean close') };
      await E.VIPContract.update(c.id, patch);
      return Response.json({ contract: { ...c, ...patch } });
    }

    if (action === 'cancelContract') {
      const c = await getContract();
      if (c.status === 'ACTIVE') return err('Close the active session instead of canceling');
      if (['COMPLETED', 'CANCELED'].includes(c.status)) return err('Contract already closed');
      if (c.terms_locked && (!body.manager_name || !body.reason)) return err('Canceling a signed contract requires manager approval and reason');
      const patch = { status: 'CANCELED', cancel_reason: body.reason || 'unsigned cancellation', audit_events: ev(c, 'CONTRACT_CANCELED', `${body.reason || ''} ${body.manager_name ? 'approved_by=' + body.manager_name : ''}`) };
      await E.VIPContract.update(c.id, patch);
      return Response.json({ contract: { ...c, ...patch } });
    }

    if (action === 'search') {
      const q = { venue_id: VENUE };
      for (const f of ['contract_id', 'guest_id', 'entertainer_id', 'room_id', 'status', 'payment_status', 'mode', 'receipt_id', 'transaction_id']) {
        if (body[f]) q[f] = body[f];
      }
      let results = await E.VIPContract.filter(q, '-created_date', 100);
      if (body.text) {
        const t = body.text.toLowerCase();
        results = results.filter(c => [c.contract_id, c.guest_name, c.entertainer_stage_name, c.room_number, c.receipt_id].some(v => (v || '').toLowerCase().includes(t)));
      }
      return Response.json({ results });
    }

    if (action === 'getChain') {
      const c = await getContract();
      const [session, payment, transaction] = await Promise.all([
        c.session_id ? E.VIPSession.get(c.session_id).catch(() => null) : null,
        c.payment_id ? E.PaymentRecord.get(c.payment_id).catch(() => null) : null,
        c.transaction_id ? E.POSTransaction.get(c.transaction_id).catch(() => null) : null
      ]);
      return Response.json({ contract: c, session, payment, transaction });
    }

    if (action === 'cleanupTest') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const out = {};
      out.contracts = await E.VIPContract.deleteMany({ mode: 'TEST' });
      out.sessions = await E.VIPSession.deleteMany({ mode: 'TEST' });
      out.payments = await E.PaymentRecord.deleteMany({ mode: 'SANDBOX', provider_code: 'manual_external' });
      out.transactions = await E.POSTransaction.deleteMany({ mode: 'SANDBOX', station: 'vip' });
      out.entertainers = await E.Entertainer.deleteMany({ venue_id: VENUE, mode: 'SANDBOX' });
      out.guests = await E.VIPGuest.deleteMany({ venue_id: VENUE, is_demo: true });
      // release rooms whose test sessions vanished
      const rooms = await E.VIPRoom.filter({ venue_id: VENUE });
      for (const r of rooms) {
        if (r.status !== 'available') await E.VIPRoom.update(r.id, { status: 'available', entertainer_id: null, entertainer_name: null, guest_name: null });
      }
      return Response.json({ cleaned: out });
    }

    return err('Unknown action: ' + action);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});