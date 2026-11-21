import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { glyphlockWrite } from '@/lib/glyphlock/glyphlockWriteGateway';
import { toast } from 'sonner';
import { Send, CheckCircle2, Code2 } from 'lucide-react';

const TIMELINE_LABELS = {
  immediate: 'Immediate / ASAP',
  '1_month': 'Within 1 month',
  '1_3_months': '1–3 months',
  '3_6_months': '3–6 months',
  flexible: 'Flexible / exploratory',
};

const BUDGET_LABELS = {
  under_5k: 'Under $5,000',
  '5k_15k': '$5,000 – $15,000',
  '15k_50k': '$15,000 – $50,000',
  '50k_plus': '$50,000+',
  not_sure: 'Need help scoping a quote',
};

export default function ProjectRequestForm({ initialEmail = '' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: initialEmail || '',
    company: '',
    project_description: '',
    timeline: '',
    budget_range: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    if (initialEmail && !formData.email) {
      setFormData((prev) => ({ ...prev, email: initialEmail }));
    }
  }, [initialEmail]);

  const sanitize = (str) => String(str || '').replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, '').trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const name = sanitize(formData.name);
    const email = String(formData.email || '').trim();
    const company = sanitize(formData.company);
    const projectDescription = sanitize(formData.project_description);
    const timeline = formData.timeline;
    const budgetRange = formData.budget_range;

    const nextErrors = {};
    if (name.length < 2) nextErrors.name = 'Name must be at least 2 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address.';
    if (!company) nextErrors.company = 'Company or organization is required.';
    if (projectDescription.length < 10) nextErrors.project_description = 'Please describe what you want built (at least 10 characters).';
    if (!timeline) nextErrors.timeline = 'Please select a target timeline.';
    if (!budgetRange) nextErrors.budget_range = 'Please select a budget range.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const timelineLabel = TIMELINE_LABELS[timeline] || timeline;
      const budgetLabel = BUDGET_LABELS[budgetRange] || budgetRange;
      const subject = `Project Request — ${company}`.slice(0, 200);
      const message = [
        `Project Request (Build Something)`,
        `Company: ${company}`,
        `Name: ${name}`,
        `Email: ${email}`,
        `Timeline: ${timelineLabel}`,
        `Budget Range: ${budgetLabel}`,
        '',
        'What they want built:',
        projectDescription,
      ].join('\n').slice(0, 2000);

      const result = await glyphlockWrite('contact_submit', {
        contact: {
          name,
          email,
          subject,
          message,
        },
        intent: 'public_project_request_submission',
      });

      if (result?.delivery_status === 'failed') {
        toast.warning('Project request saved, but the email notification could not be sent.');
      } else {
        toast.success('Project request sent to GlyphLock.');
      }

      setConfirmation({
        reference: result?.id || '',
        name,
        email,
        company,
        timeline: timelineLabel,
        budget: budgetLabel,
        delivery_status: result?.delivery_status || 'sent',
      });
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        project_description: '',
        timeline: '',
        budget_range: '',
      });
    } catch (err) {
      toast.error(err?.message || 'Could not submit your project request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card id="project-request-form" className="bg-emerald-950/30 border-emerald-400/40 backdrop-blur-xl">
        <CardContent className="p-8 md:p-12 text-center space-y-5">
          <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
          <h3 className="text-2xl font-black text-white">Project Request Received</h3>
          <p className="text-slate-300 max-w-xl mx-auto">
            Your project details have been saved and sent to our engineering team at <span className="text-cyan-200 font-semibold">sales@glyphlock.io</span>. We will follow up within 24 hours to scope your build.
          </p>

          {confirmation && (
            <div className="max-w-md mx-auto text-left bg-slate-900/70 border border-emerald-500/30 rounded-xl p-5 space-y-2.5 text-sm">
              {confirmation.reference && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Reference</span>
                  <span className="text-white font-mono break-all">{confirmation.reference}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Company</span>
                <span className="text-white">{confirmation.company}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Reply to</span>
                <span className="text-white break-all">{confirmation.email}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Timeline</span>
                <span className="text-white">{confirmation.timeline}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Budget</span>
                <span className="text-white">{confirmation.budget}</span>
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setConfirmation(null);
            }}
            variant="outline"
            className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10"
          >
            Submit Another Project Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="project-request-form" className="bg-slate-900/75 border-cyan-300/30 backdrop-blur-2xl shadow-[0_0_45px_rgba(34,211,238,.12)]">
      <CardHeader className="space-y-2">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[.2em] text-cyan-300 uppercase">
          <Code2 className="h-4 w-4" /> Software · Integrations · AI Builds
        </div>
        <CardTitle className="text-2xl md:text-3xl font-black text-white">
          Start a Software Project
        </CardTitle>
        <p className="text-sm md:text-base text-slate-300">
          Tell us what you want built — custom software, system integrations, venue operations, or AI workflows — and we will reply with a scoping plan and quote.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name" className="text-white">Name *</Label>
              <Input
                id="proj-name"
                required
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white"
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-email" className="text-white">Email *</Label>
              <Input
                id="proj-email"
                type="email"
                required
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white"
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-company" className="text-white">Company *</Label>
              <Input
                id="proj-company"
                required
                placeholder="Company or project name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white"
              />
              {errors.company && <p className="text-xs text-red-400">{errors.company}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-what" className="text-white">What do you want built? *</Label>
            <Textarea
              id="proj-what"
              required
              rows={4}
              placeholder="Describe the application, integration, workflow, or AI capability you want us to build..."
              value={formData.project_description}
              onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
              className="bg-slate-950 border-slate-700 text-white min-h-28"
            />
            {errors.project_description && <p className="text-xs text-red-400">{errors.project_description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white">Timeline *</Label>
              <Select
                value={formData.timeline}
                onValueChange={(v) => setFormData({ ...formData, timeline: v })}
              >
                <SelectTrigger aria-label="Timeline" className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="Select target timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate / ASAP</SelectItem>
                  <SelectItem value="1_month">Within 1 month</SelectItem>
                  <SelectItem value="1_3_months">1–3 months</SelectItem>
                  <SelectItem value="3_6_months">3–6 months</SelectItem>
                  <SelectItem value="flexible">Flexible / exploratory</SelectItem>
                </SelectContent>
              </Select>
              {errors.timeline && <p className="text-xs text-red-400">{errors.timeline}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-white">Budget Range *</Label>
              <Select
                value={formData.budget_range}
                onValueChange={(v) => setFormData({ ...formData, budget_range: v })}
              >
                <SelectTrigger aria-label="Budget Range" className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_5k">Under $5,000</SelectItem>
                  <SelectItem value="5k_15k">$5,000 – $15,000</SelectItem>
                  <SelectItem value="15k_50k">$15,000 – $50,000</SelectItem>
                  <SelectItem value="50k_plus">$50,000+</SelectItem>
                  <SelectItem value="not_sure">Need help scoping a quote</SelectItem>
                </SelectContent>
              </Select>
              {errors.budget_range && <p className="text-xs text-red-400">{errors.budget_range}</p>}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 font-black hover:opacity-95"
          >
            {isSubmitting ? (
              'Sending Project Request...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Project Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}