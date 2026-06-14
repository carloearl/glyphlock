/**
 * DACO-20260613-MOBILE-SCANNER — MobileScanner page
 *
 * Turns any Android phone/tablet (HTTPS, rear camera, Chrome) into a NUPS
 * scanner station. Three tabs: Generate QR (staff), Scan QR (door), Scan ID.
 *
 * Server-side trust authority — device never holds HMAC keys, never verifies.
 */
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ScanLine, ArrowLeft, ShieldCheck, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import QrGenerator from '@/components/scanner/QrGenerator';
import ScanTab from '@/components/scanner/ScanTab';

export default function MobileScanner() {
  const venue = useActiveVenue();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('scan');
  const [validationRun, setValidationRun] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {
        // public scanner stations may not be logged in; verify endpoints will 401.
      }
    })();
  }, []);

  const isHttps = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-black to-slate-950 text-white">
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between pt-2">
          <Link to="/FrontDoor">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" /> Front Door
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <ScanLine className="w-4 h-4" /> Mobile Scanner
          </div>
        </div>

        {/* SESSION BANNER */}
        <div className="rounded-2xl p-3 border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-xs">
            <div className="font-bold text-emerald-200 truncate">{user?.full_name || user?.email || 'Sign in required'}</div>
            <div className="text-emerald-400/80 font-mono">
              {venue?.name || 'No venue'} · {user?.role || '—'}
            </div>
          </div>
        </div>

        {/* HTTPS WARNING */}
        {!isHttps && (
          <div className="rounded-xl p-3 border border-red-500/40 bg-red-500/10 text-xs text-red-200">
            Camera requires HTTPS. This page won't work on insecure origins.
          </div>
        )}

        {/* VALIDATION-RUN TOGGLE */}
        <div className="rounded-xl p-3 border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-200">Validation run (funds-off)</div>
            <div className="text-[10px] text-amber-400/70">Quarantines scans from booked reports.</div>
          </div>
          <Switch checked={validationRun} onCheckedChange={setValidationRun} />
        </div>

        {/* TABS */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-2 bg-slate-900 border border-slate-800">
            <TabsTrigger value="scan" className="text-sm">
              <Camera className="w-4 h-4 mr-1.5" /> Scan
            </TabsTrigger>
            <TabsTrigger value="generate" className="text-sm">
              <ScanLine className="w-4 h-4 mr-1.5" /> Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-3">
            <ScanTab venueId={venue?.id} validationRun={validationRun} />
          </TabsContent>

          <TabsContent value="generate" className="mt-3">
            <QrGenerator venueId={venue?.id} />
          </TabsContent>
        </Tabs>

        <div className="text-center text-[10px] text-slate-600 pt-4 pb-8 font-mono">
          DACO-20260613-MOBILE-SCANNER · BPAAA v3.0
        </div>
      </div>
    </div>
  );
}