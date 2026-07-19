import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const results = [];

    // DATA-1: Close joe's duplicate shift
    try {
      await base44.asServiceRole.entities.EntertainerShift.update('6a5b3e27dc9e57ee4341f20a', {
        check_out_time: '2026-07-18T08:49:42.812Z',
        status: 'checked_out',
        notes: 'Duplicate shift closed by DACO directive ID-01'
      });
      results.push('DATA-1: joe duplicate shift closed');
    } catch(e) { results.push('DATA-1 FAILED: ' + e.message); }

    // DATA-2: Set venue_id on joe's Entertainer record
    try {
      await base44.asServiceRole.entities.Entertainer.update('6a5b3e0e806f147157a868b4', {
        venue_id: 'dream_palace'
      });
      results.push('DATA-2: joe venue_id set');
    } catch(e) { results.push('DATA-2 FAILED: ' + e.message); }

    // DATA-3: Set venue_id on joe's remaining open shift
    try {
      await base44.asServiceRole.entities.EntertainerShift.update('6a5b3e2b3b55b7658fdbfd34', {
        venue_id: 'dream_palace'
      });
      results.push('DATA-3: joe shift venue_id set');
    } catch(e) { results.push('DATA-3 FAILED: ' + e.message); }

    // DATA-4: Archive 5 stub records
    const stubIds = ['69d3eb440337cbbbfa1e2f04','69d3eb440337cbbbfa1e2f05','69d3eb440337cbbbfa1e2f06','69d3eb440337cbbbfa1e2f07','69d3eb440337cbbbfa1e2f08'];
    for (const sid of stubIds) {
      try {
        await base44.asServiceRole.entities.Entertainer.update(sid, { status: 'inactive' });
        results.push('DATA-4: archived ' + sid);
      } catch(e) { results.push('DATA-4 FAILED ' + sid + ': ' + e.message); }
    }

    // DATA-5: Close 2 open demo shifts
    try {
      await base44.asServiceRole.entities.EntertainerShift.update('6a5adc96513100788073b57f', {
        check_out_time: '2026-07-18T01:53:27.183Z',
        status: 'checked_out'
      });
      results.push('DATA-5a: Nova demo shift closed');
    } catch(e) { results.push('DATA-5a FAILED: ' + e.message); }

    try {
      await base44.asServiceRole.entities.EntertainerShift.update('6a5adc9618a2ad1e7212a79d', {
        check_out_time: '2026-07-18T01:53:27.183Z',
        status: 'checked_out'
      });
      results.push('DATA-5b: Crystal demo shift closed');
    } catch(e) { results.push('DATA-5b FAILED: ' + e.message); }

    // DATA-6: Set is_demo=true on 4 demo entertainers (if field exists)
    const demoEntIds = ['6a5adc91e0034ce156375ab4','6a5adc91ef6ced77c012f1c1','6a5adc92a7be2172a5e21523','6a5adc922f8731ccf7d93535'];
    for (const did of demoEntIds) {
      try {
        await base44.asServiceRole.entities.Entertainer.update(did, { is_demo: true });
        results.push('DATA-6: is_demo set on ' + did);
      } catch(e) { results.push('DATA-6 FAILED ' + did + ': ' + e.message); }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});