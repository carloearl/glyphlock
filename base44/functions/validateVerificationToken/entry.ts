import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * VERIFICATION TOKEN VALIDATOR
 * Validates engagement tokens and retrieves status
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { token_id } = await req.json();

    if (!token_id) {
      return Response.json({ error: 'token_id required' }, { status: 400 });
    }

    const tokens = await base44.asServiceRole.entities.VerificationToken.filter({
      token_id
    });

    if (tokens.length === 0) {
      return Response.json({
        valid: false,
        error: 'Verification token not found'
      }, { status: 404 });
    }

    const token = tokens[0];

    return Response.json({
      valid: true,
      token,
      status: token.verification_status,
      alignment_tier: token.alignment_tier,
      credential_eligibility: token.credential_eligibility,
      session_scheduled: !!token.session_scheduled_at,
      reports_available: !!(token.verification_report_url || token.executive_brief_url)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});