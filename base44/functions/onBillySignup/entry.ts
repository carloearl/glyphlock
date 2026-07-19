import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const TARGET_EMAIL = 'alkire2020@gmail.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const users = await base44.asServiceRole.entities.User.filter({ email: TARGET_EMAIL });
    if (!users || users.length === 0) {
      return Response.json({ status: 'waiting', message: 'User has not signed up yet' });
    }

    const user = users[0];
    if (user.access_welcome_sent) {
      return Response.json({ status: 'done', message: 'Access already granted and email sent' });
    }

    // Grant platform admin role + mark as processed
    await base44.asServiceRole.entities.User.update(user.id, {
      role: 'admin',
      access_welcome_sent: true
    });

    const subject = 'Your GlyphLock Admin Access Is Live — Login Instructions Inside';
    const body = `Hello Billy,

Your administrator access to GlyphLock NUPS has been activated. You now have full operational capabilities across the entire platform.

WHAT YOU HAVE ACCESS TO
• Owner-level (OWNER) admin rights — pre-approved, no waiting on approvals
• Every operational workspace: Front Door Register, Bar Register, VIP Command Center, Manager Console, Entertainer Check-In, Time Clock, Driver Payouts, GlyphBucks, Accounting & Reports, and the Admin Portal
• Full demo environment: everything you do runs safely against the demo venue, so you can ring sales, run payouts, and test every workflow without touching live data

HOW TO LOG IN
1. Go to the GlyphLock app and open the NUPS Kiosk screen.
2. Select the "Owner / Admin Sign In" card.
3. Sign in with this email address (Google sign-in works).
4. You'll land on the "Choose a View" page — pick any role card to enter that workspace exactly as that role sees it.

That's it — you're fully set up. Explore freely; the demo environment is completely isolated from live operations.

If anything doesn't work as expected, reach out to Carlo.

Best regards,
GlyphLock NUPS Team`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: TARGET_EMAIL,
      subject,
      body,
      from_name: 'GlyphLock NUPS'
    });

    return Response.json({ status: 'granted', emailed: TARGET_EMAIL });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});