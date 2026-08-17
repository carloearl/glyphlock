import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Send, CheckCircle } from 'lucide-react';

export default function VerificationIntakeForm() {
  const [formData, setFormData] = useState({
    organization_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    organization_size: '',
    industry: '',
    verification_interest: '',
    current_governance_maturity: '',
    primary_concern: '',
    documentation_ready: false,
    budget_range: '',
    timeline: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create consultation record
      const consultation = await base44.entities.Consultation.create({
        consultation_id: crypto.randomUUID(),
        ...formData,
        status: 'submitted'
      });

      let referenceId = consultation?.consultation_id;

      // Generate verification token if founding cohort or standard selected
      if (formData.verification_interest !== 'not_sure') {
        const tokenResponse = await base44.functions.invoke('generateVerificationToken', {
          organization_name: formData.organization_name,
          organization_email: formData.contact_email,
          organization_domain: formData.contact_email.split('@')[1],
          engagement_type: formData.verification_interest === 'founding_cohort' ? 'founding_cohort' : 'standard_verification'
        });

        if (tokenResponse.data.success) {
          referenceId = tokenResponse.data.token_id;
        }
      }

      // Notify GlyphLock
      const emailResult = await base44.integrations.Core.SendEmail({
        to: 'carloearl@glyphlock.com',
        subject: `New governance review request — ${formData.organization_name}`,
        body: [
          `Organization: ${formData.organization_name}`,
          `Contact: ${formData.contact_name}`,
          `Email: ${formData.contact_email}`,
          `Phone: ${formData.contact_phone || '—'}`,
          `Size: ${formData.organization_size || '—'}`,
          `Industry: ${formData.industry || '—'}`,
          `Engagement interest: ${formData.verification_interest || '—'}`,
          `Governance maturity: ${formData.current_governance_maturity || '—'}`,
          `Timeline: ${formData.timeline || '—'}`,
          '',
          'Primary concern / goal:',
          formData.primary_concern || '—',
        ].join('\n'),
      });

      console.log('[Consultation] email result', emailResult);

      setConfirmation({
        reference: referenceId,
        organization: formData.organization_name,
        email: formData.contact_email,
        submitted_at: new Date().toLocaleString(),
      });
      setSubmitted(true);
      toast.success('Request submitted successfully');
    } catch (error) {
      toast.error('Submission failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-green-900/20 border-green-500/40">
        <CardContent className="p-8 md:p-12 text-center space-y-5">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
          <h3 className="text-2xl font-bold text-green-400">Request Sent</h3>
          <p className="text-slate-300 max-w-xl mx-auto">
            Your request was sent to the GlyphLock team. Someone will follow up by email to discuss scope.
            No review has started and no findings exist until a written scope is agreed.
          </p>

          {confirmation && (
            <div className="max-w-md mx-auto text-left bg-slate-900/60 border border-green-500/30 rounded-xl p-5 space-y-3">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">Reference</span>
                <span className="text-white font-mono break-all">{confirmation.reference}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">Organization</span>
                <span className="text-white">{confirmation.organization}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">Reply to</span>
                <span className="text-white break-all">{confirmation.email}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">Sent</span>
                <span className="text-white">{confirmation.submitted_at}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500">Keep your reference number for any follow-up correspondence.</p>

          <Button
            onClick={() => { setSubmitted(false); setConfirmation(null); }}
            variant="outline"
            className="border-green-500/40 text-green-400"
          >
            Submit Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Request a governance documentation review</CardTitle>
        <p className="text-sm text-slate-400">Submitting this form starts a conversation about scope and pricing. It does not create an engagement, and nothing is reviewed or represented until a written scope is agreed.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Organization Name *</Label>
              <Input
                required
                value={formData.organization_name}
                onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Contact Name *</Label>
              <Input
                required
                value={formData.contact_name}
                onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Email *</Label>
              <Input
                required
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Phone</Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Organization Size *</Label>
              <Select value={formData.organization_size} onValueChange={(v) => setFormData({...formData, organization_size: v})}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-1000">201-1,000 employees</SelectItem>
                  <SelectItem value="1000+">1,000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Industry *</Label>
              <Input
                required
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                placeholder="e.g., Financial Services, Healthcare"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white">Engagement Interest *</Label>
            <Select value={formData.verification_interest} onValueChange={(v) => setFormData({...formData, verification_interest: v})}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select interest level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="founding_cohort">Partnership or licensing</SelectItem>
                <SelectItem value="standard_verification">Documentation review</SelectItem>
                <SelectItem value="not_sure">Not sure / exploratory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Current Governance Maturity *</Label>
            <Select value={formData.current_governance_maturity} onValueChange={(v) => setFormData({...formData, current_governance_maturity: v})}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Self-assessment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Primary Concern or Goal *</Label>
            <Textarea
              required
              value={formData.primary_concern}
              onChange={(e) => setFormData({...formData, primary_concern: e.target.value})}
              placeholder="What are you hoping to get out of a documentation review?"
              className="bg-slate-900 border-slate-700 text-white min-h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Timeline *</Label>
              <Select value={formData.timeline} onValueChange={(v) => setFormData({...formData, timeline: v})}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="1_month">Within 1 month</SelectItem>
                  <SelectItem value="3_months">Within 3 months</SelectItem>
                  <SelectItem value="6_months">Within 6 months</SelectItem>
                  <SelectItem value="exploratory">Exploratory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}