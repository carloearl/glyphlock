import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  Building2,
  DoorOpen,
  ExternalLink,
  LockKeyhole,
  MapPinned,
  RefreshCw,
  ServerCog,
  ShieldCheck,
} from 'lucide-react';

const PORTAL_URL =
  'https://partner.hospitality-dev-portal.us-ashburn-1.ocs.oraclecloud.com/glyphlocknups/ui/';
const INTEGRATION_OWNER_EMAIL = 'carloearl@glyphlock.com';

export default function OHIPReadiness() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [testing, setTesting] = useState(false);
  const [snapshotting, setSnapshotting] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);
  const [propertySnapshot, setPropertySnapshot] = useState(null);
  const [roomSnapshot, setRoomSnapshot] = useState(null);
  const [mappingPreview, setMappingPreview] = useState(null);
  const [accessChecking, setAccessChecking] = useState(true);
  const [ownerAuthorized, setOwnerAuthorized] = useState(false);

  const checkReadiness = useCallback(async () => {
    setChecking(true);
    setError('');

    try {
      const response = await base44.functions.invoke('ohipReadiness', {
        action: 'status',
      });
      setStatus(response?.data ?? response);
    } catch (err) {
      setStatus(null);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Unable to run the secure OHIP readiness check.',
      );
    } finally {
      setChecking(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    setTesting(true);
    setConnectionResult(null);
    setError('');

    try {
      const response = await base44.functions.invoke('ohipReadiness', {
        action: 'test',
      });
      setConnectionResult(response?.data ?? response);
    } catch (err) {
      setConnectionResult({
        ok: false,
        stage: 'invocation',
        message:
          err?.response?.data?.error ||
          err?.message ||
          'Unable to run the live OHIP connection test.',
      });
    } finally {
      setTesting(false);
    }
  }, []);

  const loadPropertySnapshot = useCallback(async () => {
    setSnapshotting(true);
    setPropertySnapshot(null);
    setError('');

    try {
      const response = await base44.functions.invoke('ohipReadiness', {
        action: 'snapshot',
      });
      setPropertySnapshot(response?.data ?? response);
    } catch (err) {
      setPropertySnapshot({
        ok: false,
        stage: 'invocation',
        message:
          err?.response?.data?.error ||
          err?.message ||
          'Unable to load the OHIP property configuration snapshot.',
      });
    } finally {
      setSnapshotting(false);
    }
  }, []);

  const loadRoomConfiguration = useCallback(async () => {
    setLoadingRooms(true);
    setRoomSnapshot(null);
    setMappingPreview(null);
    setError('');

    try {
      const response = await base44.functions.invoke('ohipReadiness', {
        action: 'rooms',
      });
      setRoomSnapshot(response?.data ?? response);
    } catch (err) {
      setRoomSnapshot({
        ok: false,
        stage: 'invocation',
        message:
          err?.response?.data?.error ||
          err?.message ||
          'Unable to load the OHIP room configuration.',
      });
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const generateMappingPreview = useCallback(() => {
    const rooms = Array.isArray(roomSnapshot?.room_configuration?.rooms)
      ? roomSnapshot.room_configuration.rooms
      : [];

    const reviewed = rooms.map((room) => {
      const roomNumber = typeof room?.room_number === 'string'
        ? room.room_number
        : '';
      const reasons = [];

      if (!roomNumber) reasons.push('Missing room number');
      if (roomNumber && !/^[A-Za-z0-9]/.test(roomNumber)) {
        reasons.push('Starts with a symbol or negative prefix');
      }
      if (roomNumber && /[^A-Za-z0-9._-]/.test(roomNumber)) {
        reasons.push('Contains unusual characters');
      }
      if (roomNumber.length > 32) reasons.push('Room number exceeds 32 characters');
      if (!room?.room_type_code) reasons.push('Missing room-type code');
      if (room?.active === false) reasons.push('Inactive in Oracle');

      return { ...room, reasons, format_clean: reasons.length === 0 };
    });

    setMappingPreview({
      hotel_id: roomSnapshot?.room_configuration?.hotel_id || null,
      scanned_count: reviewed.length,
      format_clean_count: reviewed.filter((room) => room.format_clean).length,
      review_required_count: reviewed.filter((room) => !room.format_clean).length,
      inactive_count: reviewed.filter((room) => room.active === false).length,
      review_required: reviewed.filter((room) => !room.format_clean),
      generated_at: new Date().toISOString(),
      write_enabled: false,
    });
  }, [roomSnapshot]);

  useEffect(() => {
    let cancelled = false;

    const verifyOwnerAccess = async () => {
      try {
        const currentUser = await base44.auth.me();
        const allowed =
          String(currentUser?.email || '').trim().toLowerCase() ===
          INTEGRATION_OWNER_EMAIL;

        if (cancelled) return;
        setOwnerAuthorized(allowed);
        if (allowed) await checkReadiness();
      } catch {
        if (!cancelled) setOwnerAuthorized(false);
      } finally {
        if (!cancelled) setAccessChecking(false);
      }
    };

    verifyOwnerAccess();
    return () => {
      cancelled = true;
    };
  }, [checkReadiness]);

  if (accessChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-300" />
          <p className="text-sm text-slate-300">Verifying integration-owner access…</p>
        </div>
      </main>
    );
  }

  if (!ownerAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <Card className="w-full max-w-lg border-red-500/30 bg-slate-900/90 text-slate-100">
          <CardHeader className="text-center">
            <LockKeyhole className="mx-auto mb-3 h-10 w-10 text-red-300" />
            <CardTitle>Access restricted</CardTitle>
            <CardDescription className="text-slate-400">
              This Oracle integration console is available only to the designated GlyphLock integration-owner account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => window.location.assign('/NUPSLanding')}>
              Return to NUPS
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const configured = status?.configured === true;
  const missing = Array.isArray(status?.missing_settings)
    ? status.missing_settings
    : [];

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-16 pt-24 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <div className="mb-3 flex items-center gap-2 text-cyan-300">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">
              Owner/Admin Integration Control
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Oracle Hospitality Readiness
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Secure configuration and controlled read-only validation for
            GlyphLock NUPS and the OHIP Partner Sandbox. Credentials never
            leave the server, and Oracle calls run only when you press a button.
          </p>
        </div>

        {error && (
          <Alert className="border-red-500/50 bg-red-950/40 text-red-100">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-slate-700 bg-slate-900 text-slate-100">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ServerCog className="h-5 w-5 text-cyan-300" />
                  Partner Sandbox Preflight
                </CardTitle>
                <CardDescription className="mt-2 text-slate-400">
                  Cloud account: glyphlocknups · Subscription: 107857124
                </CardDescription>
              </div>
              <Badge
                className={
                  checking
                    ? 'bg-slate-700 text-slate-100'
                    : configured
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-slate-950'
                }
              >
                {checking
                  ? 'Checking'
                  : configured
                    ? 'Configured'
                    : 'Action Required'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {checking ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                <RefreshCw className="h-5 w-5 animate-spin text-cyan-300" />
                <span>Checking server-side OHIP settings…</span>
              </div>
            ) : configured ? (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-semibold text-emerald-200">
                    All required OHIP settings are present.
                  </p>
                  <p className="mt-1 text-sm text-emerald-100/70">
                    Connection gate passed. You can now load sanitized
                    property and room configuration for the Partner Sandbox.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
                  <div>
                    <p className="font-semibold text-amber-100">
                      Complete the missing server settings.
                    </p>
                    <p className="mt-1 text-sm text-amber-100/70">
                      Secret values are intentionally never shown here.
                    </p>
                  </div>
                </div>
                {missing.length > 0 && (
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {missing.map((name) => (
                      <li
                        key={name}
                        className="rounded border border-amber-500/20 bg-slate-950/50 px-3 py-2 font-mono text-xs text-amber-100"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {status?.auth_scheme && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span className="text-slate-500">Authentication scheme:</span>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-200">
                  {status.auth_scheme}
                </Badge>
                <span className="text-slate-500">Mode:</span>
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {status.mode || 'onboarding'}
                </Badge>
              </div>
            )}

            {connectionResult && (
              <Alert
                className={
                  connectionResult.ok
                    ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-100'
                    : 'border-red-500/50 bg-red-950/40 text-red-100'
                }
              >
                {connectionResult.ok ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <span className="font-semibold">
                    {connectionResult.ok ? 'OHIP connected.' : `Stopped at ${connectionResult.stage || 'test'}.`}
                  </span>{' '}
                  {connectionResult.message}
                  {connectionResult.http_status ? ` HTTP ${connectionResult.http_status}.` : ''}
                  {connectionResult.request_id ? ` Request ID: ${connectionResult.request_id}` : ''}
                  {connectionResult.latency_ms != null ? ` ${connectionResult.latency_ms} ms.` : ''}
                </AlertDescription>
              </Alert>
            )}

            {propertySnapshot && (
              <Card className="border-cyan-500/30 bg-slate-950/70 text-slate-100">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-cyan-300" />
                    Sanitized Property Configuration
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Read-only resort-chain metadata from the Oracle Partner Sandbox.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {propertySnapshot.ok ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-200">
                          Configured hotel {propertySnapshot.property_configuration?.configured_hotel_id || 'present'}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {propertySnapshot.property_configuration?.property_count || 0} property record(s)
                        </Badge>
                      </div>
                      {(propertySnapshot.property_configuration?.properties || []).length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {propertySnapshot.property_configuration.properties.map((property) => {
                            const selected =
                              property.hotel_id === propertySnapshot.property_configuration?.configured_hotel_id;
                            return (
                              <div
                                key={property.hotel_id || `${property.chain_code}-${property.hotel_name}`}
                                className={`rounded-lg border bg-slate-900 px-3 py-3 ${
                                  selected ? 'border-emerald-500/60' : 'border-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-mono text-sm text-cyan-200">
                                    {property.hotel_id || 'No hotel code'}
                                  </p>
                                  {selected && (
                                    <Badge className="bg-emerald-600 text-white">Configured</Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-slate-300">
                                  {property.hotel_name || property.hotel_description || 'Oracle property'}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Chain {property.chain_code || property.chain_name || 'not returned'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">
                          Oracle returned HTTP 200 but no resort-chain rows were exposed for this sandbox account.
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Request ID: {propertySnapshot.request_id || 'not returned'} · {propertySnapshot.latency_ms ?? 0} ms
                      </p>
                    </div>
                  ) : (
                    <Alert className="border-red-500/50 bg-red-950/40 text-red-100">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {propertySnapshot.message || 'Oracle property snapshot failed.'}
                        {propertySnapshot.http_status ? ` HTTP ${propertySnapshot.http_status}.` : ''}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {roomSnapshot && (
              <Card className="border-violet-500/30 bg-slate-950/70 text-slate-100">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DoorOpen className="h-5 w-5 text-violet-300" />
                    Read-Only Room Configuration
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Sanitized room numbers and room-type labels for the configured sandbox hotel.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {roomSnapshot.ok ? (
                    <div className="space-y-3">
                      <Alert className="border-amber-500/60 bg-amber-950/40 text-amber-100">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <span className="font-semibold">Shared Oracle sandbox data.</span>{' '}
                          These room records may include test values created by other partners or
                          developers. They prove API access, but they must not be imported into a
                          NUPS venue or treated as production hotel inventory.
                        </AlertDescription>
                      </Alert>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="outline" className="border-violet-500/50 text-violet-200">
                          Hotel {roomSnapshot.room_configuration?.hotel_id || 'configured'}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {roomSnapshot.room_configuration?.returned_count || 0} room(s)
                        </Badge>
                        {roomSnapshot.room_configuration?.truncated && (
                          <Badge className="bg-amber-500 text-slate-950">Preview limited</Badge>
                        )}
                      </div>
                      {(roomSnapshot.room_configuration?.rooms || []).length > 0 ? (
                        <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                          {roomSnapshot.room_configuration.rooms.map((room) => (
                            <div
                              key={room.room_number}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-mono text-sm font-semibold text-violet-200">
                                  Room {room.room_number}
                                </p>
                                {room.active === false && (
                                  <Badge variant="outline" className="border-amber-500/50 text-amber-200">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-slate-300">
                                {room.room_type_code || 'Type not returned'}
                                {room.room_type_description ? ` · ${room.room_type_description}` : ''}
                              </p>
                              {room.room_name && (
                                <p className="mt-1 text-xs text-slate-500">{room.room_name}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">
                          Oracle returned HTTP 200 but no room rows were exposed for this hotel.
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Request ID: {roomSnapshot.request_id || 'not returned'} · {roomSnapshot.latency_ms ?? 0} ms
                      </p>
                    </div>
                  ) : (
                    <Alert className="border-red-500/50 bg-red-950/40 text-red-100">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {roomSnapshot.message || 'Oracle room configuration failed.'}
                        {roomSnapshot.http_status ? ` HTTP ${roomSnapshot.http_status}.` : ''}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {roomSnapshot?.ok && (
              <Card className="border-amber-500/35 bg-slate-950/80 text-slate-100">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPinned className="h-5 w-5 text-amber-300" />
                        Oracle → NUPS Mapping Readiness
                      </CardTitle>
                      <CardDescription className="mt-2 text-slate-400">
                        Analyze Oracle room formats without creating or updating any NUPS record.
                      </CardDescription>
                    </div>
                    <Badge className="bg-amber-500 text-slate-950">Preview Only</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-slate-600 bg-slate-900 text-slate-200">
                    <LockKeyhole className="h-4 w-4 text-amber-300" />
                    <AlertDescription>
                      Import is locked because <span className="font-semibold">OHIPSB02 is a shared Partner Sandbox</span>.
                      A format-clean row is only a technical candidate—not an approved production room.
                    </AlertDescription>
                  </Alert>

                  {mappingPreview ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500">Scanned</p>
                          <p className="mt-1 text-2xl font-bold text-white">{mappingPreview.scanned_count}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
                          <p className="text-xs uppercase tracking-wide text-emerald-300/70">Format-clean</p>
                          <p className="mt-1 text-2xl font-bold text-emerald-300">{mappingPreview.format_clean_count}</p>
                        </div>
                        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
                          <p className="text-xs uppercase tracking-wide text-amber-300/70">Needs review</p>
                          <p className="mt-1 text-2xl font-bold text-amber-300">{mappingPreview.review_required_count}</p>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500">Inactive</p>
                          <p className="mt-1 text-2xl font-bold text-slate-300">{mappingPreview.inactive_count}</p>
                        </div>
                      </div>

                      {mappingPreview.review_required.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-semibold text-amber-200">
                            Review sample ({Math.min(mappingPreview.review_required.length, 12)} shown)
                          </p>
                          <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                            {mappingPreview.review_required.slice(0, 12).map((room, index) => (
                              <div
                                key={`${room.room_number || 'missing'}-${index}`}
                                className="rounded-lg border border-amber-500/20 bg-slate-900 p-3"
                              >
                                <p className="font-mono text-sm text-amber-100">
                                  {room.room_number || 'Missing room number'}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {room.reasons.join(' · ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-slate-500">
                        Preview generated {new Date(mappingPreview.generated_at).toLocaleString()}.
                        Nothing was written to Base44 or Oracle.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Generate a local preview to identify unusual room numbers, missing room types,
                      and inactive records before designing the production mapping.
                    </p>
                  )}

                  <div className="rounded-lg border border-cyan-500/25 bg-cyan-950/20 p-4">
                    <p className="font-semibold text-cyan-100">Production unlock requirements</p>
                    <ul className="mt-2 grid gap-1 text-sm text-cyan-100/70 sm:grid-cols-2">
                      <li>• Hotel authorizes GlyphLock/NUPS</li>
                      <li>• Customer environment added in OHIP</li>
                      <li>• Production application and application key</li>
                      <li>• Production client credentials and gateway</li>
                      <li>• Verified production Hotel ID</li>
                      <li>• Read-only validation rerun before writes</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={generateMappingPreview}
                      className="bg-amber-500 text-slate-950 hover:bg-amber-400"
                    >
                      <MapPinned className="mr-2 h-4 w-4" />
                      {mappingPreview ? 'Regenerate Mapping Preview' : 'Generate Mapping Preview'}
                    </Button>
                    <Button
                      disabled
                      variant="outline"
                      className="border-slate-700 bg-slate-900 text-slate-500"
                    >
                      <LockKeyhole className="mr-2 h-4 w-4" />
                      Import to NUPS — Locked
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={checkReadiness}
                disabled={checking}
                className="bg-cyan-600 text-white hover:bg-cyan-500"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`}
                />
                Run Secure Check
              </Button>
              <Button
                onClick={testConnection}
                disabled={checking || testing || !configured}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <ServerCog className={`mr-2 h-4 w-4 ${testing ? 'animate-pulse' : ''}`} />
                {testing ? 'Testing Oracle…' : 'Test Live Connection'}
              </Button>
              <Button
                onClick={loadPropertySnapshot}
                disabled={checking || testing || snapshotting || !configured}
                className="bg-violet-600 text-white hover:bg-violet-500"
              >
                <Building2 className={`mr-2 h-4 w-4 ${snapshotting ? 'animate-pulse' : ''}`} />
                {snapshotting ? 'Loading Configuration…' : 'Load Property Snapshot'}
              </Button>
              <Button
                onClick={loadRoomConfiguration}
                disabled={checking || testing || snapshotting || loadingRooms || !configured}
                className="bg-indigo-600 text-white hover:bg-indigo-500"
              >
                <DoorOpen className={`mr-2 h-4 w-4 ${loadingRooms ? 'animate-pulse' : ''}`} />
                {loadingRooms ? 'Loading Rooms…' : 'Load Room Configuration'}
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800"
              >
                <a href={PORTAL_URL} target="_blank" rel="noreferrer">
                  Oracle Portal — external setup only
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Run Secure Check and Test Live Connection stay inside NUPS. The
              Oracle Portal button is only for managing Oracle applications,
              environments, subscriptions, and credentials. The live test makes
              one read-only Partner Sandbox API request. Property and room
              actions return only sanitized configuration fields; room numbers
              remain strings so leading zeroes are preserved. OAuth tokens are
              cached server-side until two minutes before expiry to avoid
              unnecessary billable token calls. No secret, token, guest,
              reservation, or raw Oracle payload reaches this page.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
