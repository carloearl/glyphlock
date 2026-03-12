import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

/**
 * PDF EXPORT FOR TRANSACTIONS
 * Generate printable transaction reports
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
    const venue_id = sessionVenue.data?.venue_id;

    const { start_date, end_date } = await req.json();

    const orders = await base44.asServiceRole.entities.DreamPalaceOrder.filter({
      venue_id,
      signed_at: { $gte: start_date, $lte: end_date }
    }, '-signed_at', 100);

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Transaction Report', 20, 20);
    doc.setFontSize(10);
    doc.text(`Venue: ${venue_id}`, 20, 30);
    doc.text(`Period: ${start_date} to ${end_date}`, 20, 36);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42);

    doc.setFontSize(9);
    let y = 55;

    orders.forEach((order, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(`${idx + 1}. ${order.order_number}`, 20, y);
      doc.text(order.customer_name, 60, y);
      doc.text(`$${order.grand_total || 0}`, 130, y);
      doc.text(new Date(order.signed_at).toLocaleDateString(), 160, y);
      y += 8;
    });

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=transactions-${start_date}-${end_date}.pdf`
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});