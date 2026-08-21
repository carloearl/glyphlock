import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Save, CheckCircle } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { writeEntity } from "@/lib/nups/writeEntity";

export default function VenueSettings({ user }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const activeVenue = useActiveVenue();

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ["venue-settings", activeVenue?.id],
    queryFn: () => base44.entities.Venue.filter({ id: activeVenue?.id }),
    enabled: !!activeVenue?.id,
  });

  const existing = venues[0];

  const [form, setForm] = useState(null);

  // Initialize form once data loads
  if (!form && existing) {
    setForm({
      name: existing.name || "",
      address: existing.address || "",
      city: existing.city || "",
      state: existing.state || "",
      county: existing.county || "",
      phone: existing.phone || "",
      timezone: existing.timezone || "America/Phoenix",
      minimum_age: existing.minimum_age || 21,
      nudity_level: existing.nudity_level || "topless",
      bar_enabled: existing.bar_enabled ?? true,
      vip_enabled: existing.vip_enabled ?? true,
      glyphbucks_enabled: existing.glyphbucks_enabled ?? true,
      hours_open: existing.hours_open || "20:00",
      hours_close: existing.hours_close || "04:00",
      compliance_notes: existing.compliance_notes || "",
    });
  }

  // Default form for new venue
  if (!form && !isLoading && !existing) {
    setForm({
      name: "Dream Palace",
      address: "",
      city: "",
      state: "",
      county: "",
      phone: "",
      timezone: "America/Phoenix",
      minimum_age: 21,
      nudity_level: "topless",
      bar_enabled: true,
      vip_enabled: true,
      glyphbucks_enabled: true,
      hours_open: "20:00",
      hours_close: "04:00",
      compliance_notes: "",
    });
  }

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const me = await base44.auth.me();
      const resolvedVenueId = activeVenue?.venue_id || activeVenue?.id || `VENUE-${crypto.randomUUID()}`;
      const payload = { ...data, venue_id: resolvedVenueId, status: "active" };
      const result = await writeEntity({
        entity: "Venue",
        operation: activeVenue?.id ? "update" : "create",
        id: activeVenue?.id,
        data: payload,
        actor: { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || user?._highestRole || user?.role || "External" },
        venue_id: resolvedVenueId,
        intent: activeVenue?.id ? "VENUE_SETTINGS_UPDATE" : "VENUE_CREATE",
      });
      if (!result?.ok) throw new Error(result?.block_reason || "Venue settings write was rejected.");
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (isLoading || !form) {
    return <div className="text-gray-400 text-sm p-4">Loading venue data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-white">Venue Settings</h2>
        {existing ? (
          <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded">Venue on record</span>
        ) : (
          <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded">No venue saved yet</span>
        )}
      </div>

      <Card className="bg-gray-900/50 border-cyan-500/30">
        <CardContent className="p-5 space-y-4">
          {/* Identity */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wider">Venue Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Venue Name *</label>
                <Input value={form.name} onChange={e => set("name", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white" placeholder="Dream Palace" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                <Input value={form.phone} onChange={e => set("phone", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white" placeholder="(555) 000-0000" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wider">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Street Address *</label>
                <Input value={form.address} onChange={e => set("address", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white" placeholder="123 Main St" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">City *</label>
                <Input value={form.city} onChange={e => set("city", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white" placeholder="Phoenix" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">State *</label>
                <Input value={form.state} onChange={e => set("state", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white" placeholder="AZ" maxLength={2} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">County *</label>
                <Input value={form.county} onChange={e => set("county", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white" placeholder="Maricopa" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Timezone</label>
                <Select value={form.timezone} onValueChange={v => set("timezone", v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="America/Phoenix" className="text-white">America/Phoenix (AZ)</SelectItem>
                    <SelectItem value="America/Los_Angeles" className="text-white">America/Los_Angeles (PT)</SelectItem>
                    <SelectItem value="America/Denver" className="text-white">America/Denver (MT)</SelectItem>
                    <SelectItem value="America/Chicago" className="text-white">America/Chicago (CT)</SelectItem>
                    <SelectItem value="America/New_York" className="text-white">America/New_York (ET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Operations */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wider">Operations & Compliance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Minimum Age (Section 5A)</label>
                <Select value={String(form.minimum_age)} onValueChange={v => set("minimum_age", Number(v))}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="18" className="text-white">18+</SelectItem>
                    <SelectItem value="21" className="text-white">21+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Entertainment Classification</label>
                <Select value={form.nudity_level} onValueChange={v => set("nudity_level", v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="topless" className="text-white">Topless</SelectItem>
                    <SelectItem value="full_nude" className="text-white">Full Nude</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Hours (Open / Close)</label>
                <div className="flex gap-2">
                  <Input value={form.hours_open} onChange={e => set("hours_open", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white" placeholder="20:00" />
                  <Input value={form.hours_close} onChange={e => set("hours_close", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white" placeholder="04:00" />
                </div>
              </div>
            </div>

            {/* Feature toggles */}
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { key: "bar_enabled", label: "Bar / Alcohol Service" },
                { key: "vip_enabled", label: "VIP Rooms" },
                { key: "glyphbucks_enabled", label: "GlyphBucks Currency" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => set(key, !form[key])}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    form[key]
                      ? "bg-green-500/20 border-green-500/50 text-green-400"
                      : "bg-gray-800 border-gray-700 text-gray-500"
                  }`}
                >
                  {form[key] ? "✓" : "○"} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance Notes */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Compliance Notes (internal)</label>
            <Input value={form.compliance_notes} onChange={e => set("compliance_notes", e.target.value)}
              className="bg-gray-800 border-gray-700 text-white" placeholder="License #, regulatory notes..." />
          </div>

          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={!form.name || !form.address || !form.city || !form.state || saveMutation.isPending}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold min-h-[44px]"
          >
            {saved ? (
              <><CheckCircle className="w-4 h-4 mr-2" />Saved!</>
            ) : saveMutation.isPending ? "Saving..." : (
              <><Save className="w-4 h-4 mr-2" />{existing ? "Update Venue Settings" : "Save Venue"}</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}