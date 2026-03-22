import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function VIPEntertainerQuestionnaire({ contractUUID, entertainerId, venueId, roomNumber, onComplete }) {
  const [answers, setAnswers] = useState({
    room_number: roomNumber || '',
    session_start_time: '',
    session_end_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    glyphbucks_purchased_before: null,
    glyphbucks_presented_amount: '',
    services_agreed: {},
    services_other_description: '',
    manager_present_at_booking: null,
    security_notified: null,
    guest_appeared_sober: null,
    vip_contract_signed: null,
    guest_consented_biometric: null,
    third_parties_entered: null,
    third_parties_description: '',
    agreed_duration_minutes: '',
    agreed_minimum_spend: '',
    services_completed: null,
    services_not_completed_reason: '',
    unauthorized_negotiation_attempted: null,
    unauthorized_negotiation_details: '',
    glyphbucks_final_amount: '',
    entertainer_confirmed: false,
    entertainer_signature_hash: ''
  });
  const [flagged, setFlagged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const updateAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    
    if (key === 'guest_appeared_sober' && value === false) setFlagged(true);
    if (key === 'third_parties_entered' && value === true) setFlagged(true);
    if (key === 'unauthorized_negotiation_attempted' && value === true) setFlagged(true);
  };

  const toggleService = (key) => {
    setAnswers(prev => ({
      ...prev,
      services_agreed: {
        ...prev.services_agreed,
        [key]: !prev.services_agreed[key]
      }
    }));
  };

  const getFlaggedReasons = () => {
    const reasons = [];
    if (answers.guest_appeared_sober === false) reasons.push('Guest appeared impaired');
    if (answers.third_parties_entered === true) reasons.push('Third parties entered room');
    if (answers.services_completed === false) reasons.push('Services not completed');
    if (answers.unauthorized_negotiation_attempted === true) reasons.push('Unauthorized negotiation attempted');
    return reasons.join(', ');
  };

  const handleSubmit = async () => {
    if (!answers.entertainer_confirmed || !answers.entertainer_signature_hash) {
      toast.error('Please confirm accuracy and provide signature');
      return;
    }

    setSubmitting(true);
    try {
      const report = await base44.entities.VIPSessionReport.create({
        session_id: crypto.randomUUID(),
        contract_uuid: contractUUID,
        entertainer_id: entertainerId,
        venue_id: venueId,
        room_number: answers.room_number,
        session_date: new Date().toISOString(),
        status: flagged ? 'flagged' : 'complete',
        incident_flagged: flagged,
        manager_alerted: false,
        demo: false,
        answers: answers
      });

      if (flagged) {
        await base44.entities.AuditEvent.create({
          event_id: crypto.randomUUID(),
          action: 'VIP_SESSION_FLAGGED',
          entity_type: 'VIPSessionReport',
          entity_id: report.session_id,
          actor_id: entertainerId,
          venue_id: venueId,
          severity: 'WARNING',
          description: `VIP session flagged: ${getFlaggedReasons()}`,
          metadata: { contract_uuid: contractUUID, flagged_reason: getFlaggedReasons() }
        });
      }

      await base44.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        action: 'VIP_SESSION_REPORT_SUBMITTED',
        entity_type: 'VIPSessionReport',
        entity_id: report.session_id,
        actor_id: entertainerId,
        venue_id: venueId,
        severity: 'INFO',
        description: 'Entertainer submitted VIP session report'
      });

      toast.success('VIP session report submitted');
      onComplete(report);
    } catch (err) {
      toast.error('Failed to submit report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const services = [
    { key: 'private_performance_30', label: 'Private performance (30 min)' },
    { key: 'private_performance_60', label: 'Private performance (60 min)' },
    { key: 'private_performance_90', label: 'Private performance (90 min)' },
    { key: 'vip_hosting', label: 'VIP hosting / companionship' },
    { key: 'bottle_service', label: 'Bottle / beverage service' },
    { key: 'extended_session', label: 'Extended session (per hour)' },
    { key: 'special_event', label: 'Special event / celebration' },
    { key: 'other', label: 'Other (describe below)' }
  ];

  const YesNoToggle = ({ value, onChange, yesLabel = 'Yes', noLabel = 'No' }) => (
    <div className="flex gap-3">
      <Button
        type="button"
        variant={value === true ? 'default' : 'outline'}
        onClick={() => onChange(true)}
        className={`flex-1 min-h-[48px] ${value === true ? 'bg-green-600' : 'border-gray-700'}`}
      >
        {yesLabel}
      </Button>
      <Button
        type="button"
        variant={value === false ? 'default' : 'outline'}
        onClick={() => onChange(false)}
        className={`flex-1 min-h-[48px] ${value === false ? 'bg-red-600' : 'border-gray-700'}`}
      >
        {noLabel}
      </Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center mb-6">
        <FileText className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-white">VIP Session Report</h2>
        <p className="text-sm text-gray-400 mt-1">Please answer all questions accurately</p>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
        <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${(Object.values(answers).filter(Boolean).length / 20) * 100}%` }} />
      </div>

      {flagged && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-400">⚠️ This session will be flagged for manager review</p>
              <p className="text-xs text-gray-400 mt-1">Reason: {getFlaggedReasons()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form className="space-y-4">
        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q1. Stage Name</CardTitle></CardHeader>
          <CardContent>
            <Input value={answers.stage_name || ''} onChange={(e) => updateAnswer('stage_name', e.target.value)} placeholder="Your stage name for this session" className="bg-gray-800 border-gray-700" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q2. VIP Room</CardTitle></CardHeader>
          <CardContent>
            <select value={answers.room_number} onChange={(e) => updateAnswer('room_number', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
              <option value="">Select room</option>
              {['VIP-1', 'VIP-2', 'VIP-3', 'VIP-4', 'VIP-5', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q3. Session Start Time</CardTitle></CardHeader>
          <CardContent>
            <Input type="time" value={answers.session_start_time} onChange={(e) => updateAnswer('session_start_time', e.target.value)} className="bg-gray-800 border-gray-700" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q4. Session End Time</CardTitle></CardHeader>
          <CardContent>
            <Input type="time" value={answers.session_end_time} onChange={(e) => updateAnswer('session_end_time', e.target.value)} className="bg-gray-800 border-gray-700" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q5. Did guest purchase GlyphBucks before entering VIP?</CardTitle></CardHeader>
          <CardContent>
            <YesNoToggle value={answers.glyphbucks_purchased_before} onChange={(v) => updateAnswer('glyphbucks_purchased_before', v)} />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q6. Total GlyphBucks value presented by guest at session start</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" step="1" value={answers.glyphbucks_presented_amount} onChange={(e) => updateAnswer('glyphbucks_presented_amount', e.target.value)} placeholder="0" className="bg-gray-800 border-gray-700" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q7. Services agreed upon before entering room</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {services.map(s => (
              <div key={s.key} className="flex items-center gap-3 cursor-pointer" onClick={() => toggleService(s.key)}>
                <Checkbox checked={answers.services_agreed[s.key] || false} onCheckedChange={() => toggleService(s.key)} />
                <label className="text-sm text-gray-300 cursor-pointer">{s.label}</label>
              </div>
            ))}
          </CardContent>
        </Card>

        {answers.services_agreed?.other && (
          <Card className="bg-gray-900/60 border-gray-700">
            <CardHeader><CardTitle className="text-white text-sm">Q8. Describe other services agreed</CardTitle></CardHeader>
            <CardContent>
              <Input value={answers.services_other_description} onChange={(e) => updateAnswer('services_other_description', e.target.value)} placeholder="Describe other services" className="bg-gray-800 border-gray-700" />
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q9. Was a manager or staff member present during the booking agreement?</CardTitle></CardHeader>
          <CardContent>
            <YesNoToggle value={answers.manager_present_at_booking} onChange={(v) => updateAnswer('manager_present_at_booking', v)} />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q10. Was security notified of VIP session start?</CardTitle></CardHeader>
          <CardContent>
            <YesNoToggle value={answers.security_notified} onChange={(v) => updateAnswer('security_notified', v)} />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q11. Did the guest appear sober and coherent at the start of the session?</CardTitle></CardHeader>
          <CardContent>
            <YesNoToggle value={answers.guest_appeared_sober} onChange={(v) => updateAnswer('guest_appeared_sober', v)} />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q12. Did the guest sign the VIP Room Service Agreement?</CardTitle></CardHeader>
          <CardContent>
            <YesNoToggle value={answers.vip_contract_signed} onChange={(v) => updateAnswer('vip_contract_signed', v)} />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q13. Did the guest consent to photo and ID verification?</CardTitle></CardHeader>
          <CardContent>
            <YesNoToggle value={answers.guest_consented_biometric} onChange={(v) => updateAnswer('guest_consented_biometric', v)} />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q14. Did any third parties enter the VIP room during the session?</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <YesNoToggle value={answers.third_parties_entered} onChange={(v) => updateAnswer('third_parties_entered', v)} />
            {answers.third_parties_entered === true && (
              <Input value={answers.third_parties_description} onChange={(e) => updateAnswer('third_parties_description', e.target.value)} placeholder="Who entered and why?" className="bg-gray-800 border-gray-700" />
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q15. Agreed session duration (minutes)</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" value={answers.agreed_duration_minutes} onChange={(e) => updateAnswer('agreed_duration_minutes', e.target.value)} placeholder="60" className="bg-gray-800 border-gray-700" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q16. Agreed minimum spend for this session</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" step="1" value={answers.agreed_minimum_spend} onChange={(e) => updateAnswer('agreed_minimum_spend', e.target.value)} placeholder="0" className="bg-gray-800 border-gray-700" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q17. Were all agreed services completed as described in Q7?</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <YesNoToggle value={answers.services_completed} onChange={(v) => updateAnswer('services_completed', v)} />
            {answers.services_completed === false && (
              <Input value={answers.services_not_completed_reason} onChange={(e) => updateAnswer('services_not_completed_reason', e.target.value)} placeholder="What was not completed and why?" className="bg-gray-800 border-gray-700" />
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q18. Did the guest attempt to negotiate services NOT part of the original agreement?</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <YesNoToggle value={answers.unauthorized_negotiation_attempted} onChange={(v) => updateAnswer('unauthorized_negotiation_attempted', v)} />
            {answers.unauthorized_negotiation_attempted === true && (
              <Input value={answers.unauthorized_negotiation_details} onChange={(e) => updateAnswer('unauthorized_negotiation_details', e.target.value)} placeholder="Describe the request and your response" className="bg-gray-800 border-gray-700" />
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader><CardTitle className="text-white text-sm">Q19. Final GlyphBucks amount presented or redeemed at end of session</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" step="1" value={answers.glyphbucks_final_amount} onChange={(e) => updateAnswer('glyphbucks_final_amount', e.target.value)} placeholder="0" className="bg-gray-800 border-gray-700" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-green-500/30">
          <CardHeader><CardTitle className="text-white text-sm">Q20. Confirmation & Signature</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 cursor-pointer" onClick={() => updateAnswer('entertainer_confirmed', !answers.entertainer_confirmed)}>
              <Checkbox checked={answers.entertainer_confirmed} onCheckedChange={(v) => updateAnswer('entertainer_confirmed', v)} className="mt-1" />
              <label className="text-sm text-gray-300 cursor-pointer">I confirm all information in this report is accurate and complete.</label>
            </div>
            <div>
              <Label className="text-white">Digital Signature — Type your stage name</Label>
              <Input value={answers.entertainer_signature_hash} onChange={(e) => updateAnswer('entertainer_signature_hash', e.target.value)} placeholder="Your stage name" className="text-lg bg-gray-800 border-gray-700" style={{ fontFamily: 'cursive' }} />
            </div>
          </CardContent>
        </Card>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!answers.entertainer_confirmed || !answers.entertainer_signature_hash || submitting}
          className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 font-bold text-lg"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          {submitting ? 'Submitting Report...' : 'Submit VIP Session Report'}
        </Button>
      </form>
    </div>
  );
}