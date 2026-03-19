import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, Globe, User, Building2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditPanel({ onStartAudit, isProcessing }) {
  const [targetType, setTargetType] = useState('business');
  const [targetIdentifier, setTargetIdentifier] = useState('');
  const [auditMode, setAuditMode] = useState('SURFACE');
  const [notes, setNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/zip', 'application/pdf', 'application/x-zip-compressed'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only ZIP and PDF files are supported');
      return;
    }

    setUploadedFile(file);
    toast.success(`File uploaded: ${file.name}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!targetIdentifier.trim()) {
      toast.error(`Please enter a ${targetType === 'business' ? 'business identifier' : targetType === 'person' ? 'name' : 'agency name'}`);
      return;
    }

    // GLYPHLOCK: Allow flexible business identifiers (URL, name, or EIN)
    let normalizedIdentifier = targetIdentifier.trim();
    
    // If it looks like a domain, ensure URL format
    if (targetType === 'business' && normalizedIdentifier.includes('.') && !normalizedIdentifier.includes(' ')) {
      if (!normalizedIdentifier.startsWith('http')) {
        normalizedIdentifier = `https://${normalizedIdentifier}`;
      }
    }
    
    onStartAudit({
      targetType,
      targetIdentifier: normalizedIdentifier,
      auditMode,
      notes: notes.trim(),
      rawInput: uploadedFile ? uploadedFile.name : normalizedIdentifier
    });

    setTargetIdentifier('');
    setNotes('');
    setUploadedFile(null);
  };

  const auditModes = [
    { value: 'SURFACE', label: 'Surface (Light)', desc: 'Quick overview, top-level findings' },
    { value: 'CONCISE', label: 'Concise Technical', desc: 'Technical summary, core issues only' },
    { value: 'MEDIUM', label: 'Medium Report', desc: 'Balanced depth and breadth' },
    { value: 'DEEP', label: 'Deep Report', desc: 'Comprehensive analysis, all vectors' },
    { value: 'ENTERPRISE_A', label: 'Enterprise Grade A', desc: 'Executive + technical + legal' },
    { value: 'ENTERPRISE_B', label: 'Enterprise Grade B', desc: 'Full forensic + compliance' }
  ];

  return (
    <div className="bg-slate-900/60 border-2 border-purple-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4 text-cyan-300">
        <Shield className="w-5 h-5" />
        <h3 className="text-sm font-bold uppercase tracking-wider">Universal Audit Engine</h3>
      </div>

      <Tabs value={targetType} onValueChange={setTargetType} className="mb-4">
        <TabsList className="grid grid-cols-3 bg-slate-800/50 border border-slate-700 p-0.5 h-auto">
          <TabsTrigger
            value="business"
            style={{ touchAction: 'manipulation', minHeight: '48px', pointerEvents: 'auto' }}
            className="flex flex-col items-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-cyan-500/30 data-[state=active]:text-cyan-300"
          >
            <Globe className="w-4 h-4" />
            <span>Businesses</span>
          </TabsTrigger>
          <TabsTrigger
            value="person"
            style={{ touchAction: 'manipulation', minHeight: '48px', pointerEvents: 'auto' }}
            className="flex flex-col items-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-300"
          >
            <User className="w-4 h-4" />
            <span>People</span>
          </TabsTrigger>
          <TabsTrigger
            value="agency"
            style={{ touchAction: 'manipulation', minHeight: '48px', pointerEvents: 'auto' }}
            className="flex flex-col items-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-amber-500/30 data-[state=active]:text-amber-300"
          >
            <Building2 className="w-4 h-4" />
            <span>Gov Agencies</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Business Identifier *</label>
            <Input
              value={targetIdentifier}
              onChange={(e) => setTargetIdentifier(e.target.value)}
              placeholder="e.g., 'Apple Inc', 'tesla.com', or 'EIN: 94-2404110'"
              disabled={isProcessing}
              className="bg-slate-800 border-slate-700 text-white text-sm min-h-[44px]"
            />
            <div className="mt-2 space-y-1">
              <p className="text-[9px] text-cyan-400 uppercase tracking-wider">Data Sources Searched:</p>
              <div className="text-[10px] text-slate-400 space-y-0.5 pl-2">
                <div>✓ <strong>USPTO</strong> - Trademarks & Patents</div>
                <div>✓ <strong>Copyright.gov</strong> - Registered Works</div>
                <div>✓ <strong>Secretary of State</strong> - Articles of Organization</div>
                <div>✓ <strong>SEC EDGAR</strong> - Public Company Filings</div>
                <div>✓ <strong>BBB</strong> - Business Rating & Complaints</div>
                <div>✓ <strong>WHOIS</strong> - Domain Registration</div>
                <div>✓ <strong>Legal Records</strong> - Lawsuits & Judgments</div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Upload Site Files (Optional)</label>
            <div className="relative">
              <input
                type="file"
                accept=".zip,.pdf"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
                id="file-upload-business"
              />
              <label
                htmlFor="file-upload-business"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 border-2 border-dashed border-slate-600 hover:border-cyan-500/50 rounded-lg cursor-pointer transition-all text-xs text-slate-400 hover:text-cyan-300 min-h-[44px]"
              >
                <Upload className="w-4 h-4" />
                {uploadedFile ? uploadedFile.name : 'Upload ZIP/PDF for static analysis'}
              </label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="person" className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Person Name *</label>
            <Input
              value={targetIdentifier}
              onChange={(e) => setTargetIdentifier(e.target.value)}
              placeholder="e.g., 'Elon Musk', 'linkedin.com/in/username'"
              disabled={isProcessing}
              className="bg-slate-800 border-slate-700 text-white text-sm min-h-[44px]"
            />
            <div className="mt-2 space-y-1">
              <p className="text-[9px] text-purple-400 uppercase tracking-wider">Data Sources Searched:</p>
              <div className="text-[10px] text-slate-400 space-y-0.5 pl-2">
                <div>✓ <strong>LinkedIn</strong> - Professional History</div>
                <div>✓ <strong>USPTO</strong> - Patents as Inventor</div>
                <div>✓ <strong>Court Records</strong> - Legal Cases</div>
                <div>✓ <strong>News Archives</strong> - Public Mentions</div>
                <div>✓ <strong>Business Registrations</strong> - Companies Owned</div>
                <div>✓ <strong>Domain Ownership</strong> - WHOIS Search</div>
                <div>✓ <strong>Social Media</strong> - Public Profiles</div>
              </div>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-[10px] text-amber-300 leading-relaxed">
              ⚠️ Uses publicly available information only. No private database access. Results are analytical, not definitive.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="agency" className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Agency Name *</label>
            <Input
              value={targetIdentifier}
              onChange={(e) => setTargetIdentifier(e.target.value)}
              placeholder="e.g., 'FBI', 'fbi.gov', or 'Federal Bureau of Investigation'"
              disabled={isProcessing}
              className="bg-slate-800 border-slate-700 text-white text-sm min-h-[44px]"
            />
            <div className="mt-2 space-y-1">
              <p className="text-[9px] text-amber-400 uppercase tracking-wider">Data Sources Searched:</p>
              <div className="text-[10px] text-slate-400 space-y-0.5 pl-2">
                <div>✓ <strong>Official .gov Site</strong> - Legitimacy Verification</div>
                <div>✓ <strong>FOIA.gov</strong> - Freedom of Info Requests</div>
                <div>✓ <strong>OIG.gov</strong> - Inspector General Reports</div>
                <div>✓ <strong>USASpending.gov</strong> - Budget & Spending</div>
                <div>✓ <strong>Congressional Records</strong> - Oversight Hearings</div>
                <div>✓ <strong>Watchdog Organizations</strong> - Accountability Reports</div>
              </div>
            </div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <p className="text-[10px] text-cyan-300 leading-relaxed">
              ℹ️ Civic accountability audit using public records and legal databases.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Audit Mode</label>
          <Select value={auditMode} onValueChange={setAuditMode} disabled={isProcessing}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {auditModes.map(mode => (
                <SelectItem key={mode.value} value={mode.value} className="text-white">
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-slate-500 mt-1">
            {auditModes.find(m => m.value === auditMode)?.desc}
          </p>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Notes / Focus Areas (optional)</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              targetType === 'business' 
                ? 'e.g., Check login page, admin portal, payment flow...'
                : targetType === 'person'
                  ? 'e.g., Focus on legal history, public record discrepancies...'
                  : 'e.g., Focus on misconduct patterns, recent lawsuits...'
            }
            disabled={isProcessing}
            className="bg-slate-800 border-slate-700 text-white text-sm min-h-[60px] resize-none"
            rows={2}
          />
        </div>

        <Button
          type="submit"
          disabled={isProcessing || !targetIdentifier.trim()}
          className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-black text-base md:text-lg min-h-[56px] md:min-h-[64px] shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all touch-manipulation active:scale-95"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              RUNNING {targetType.toUpperCase()} AUDIT...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              RUN {auditMode} AUDIT
            </>
          )}
        </Button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Channel Capabilities</div>
        
        {targetType === 'business' && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
            <div className="text-[9px] text-cyan-400 uppercase tracking-wider mb-2">🔍 Search Coverage</div>
            <div className="text-[10px] text-slate-400 space-y-1">
              <div>✓ <strong className="text-cyan-300">Trademarks</strong> - USPTO database</div>
              <div>✓ <strong className="text-cyan-300">Copyrights</strong> - Copyright.gov registry</div>
              <div>✓ <strong className="text-cyan-300">Business Registration</strong> - Secretary of State</div>
              <div>✓ <strong className="text-cyan-300">Logos & Brand Assets</strong> - Public filings</div>
              <div>✓ <strong className="text-cyan-300">Financial Records</strong> - SEC EDGAR (if public)</div>
              <div>✓ <strong className="text-cyan-300">Legal Compliance</strong> - BBB, FTC, FCC, CFPB</div>
              <div>✓ <strong className="text-cyan-300">Domain History</strong> - WHOIS records</div>
              <div>✓ <strong className="text-cyan-300">Reputation</strong> - Reviews, scam reports</div>
            </div>
          </div>
        )}

        {targetType === 'person' && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
            <div className="text-[9px] text-purple-400 uppercase tracking-wider mb-2">🔍 Search Coverage</div>
            <div className="text-[10px] text-slate-400 space-y-1">
              <div>✓ <strong className="text-purple-300">LinkedIn</strong> - Career verification</div>
              <div>✓ <strong className="text-purple-300">USPTO</strong> - Patents as inventor</div>
              <div>✓ <strong className="text-purple-300">Court Records</strong> - Legal history</div>
              <div>✓ <strong className="text-purple-300">News Archives</strong> - Public mentions</div>
              <div>✓ <strong className="text-purple-300">Business Ownership</strong> - SOS filings</div>
              <div>✓ <strong className="text-purple-300">Domain Ownership</strong> - WHOIS</div>
              <div>✓ <strong className="text-purple-300">Social Media</strong> - Public profiles</div>
              <div className="text-amber-400 mt-2">⚠️ Public data only - no private databases</div>
            </div>
          </div>
        )}

        {targetType === 'agency' && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
            <div className="text-[9px] text-amber-400 uppercase tracking-wider mb-2">🔍 Search Coverage</div>
            <div className="text-[10px] text-slate-400 space-y-1">
              <div>✓ <strong className="text-amber-300">Official .gov Site</strong> - Verification</div>
              <div>✓ <strong className="text-amber-300">FOIA.gov</strong> - FOIA requests</div>
              <div>✓ <strong className="text-amber-300">OIG Reports</strong> - Inspector General</div>
              <div>✓ <strong className="text-amber-300">USASpending.gov</strong> - Budget data</div>
              <div>✓ <strong className="text-amber-300">Congressional Records</strong> - Oversight hearings</div>
              <div>✓ <strong className="text-amber-300">Watchdog Groups</strong> - Accountability reports</div>
              <div>✓ <strong className="text-amber-300">Legal Records</strong> - Public lawsuits</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}