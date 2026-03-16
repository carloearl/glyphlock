import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Trash2 } from 'lucide-react';

export default function HotspotPayloadConfig({ hotspotId, onPayloadSaved }) {
  const [payload, setPayload] = useState(null);
  const [payloadType, setPayloadType] = useState('url');
  const [payloadUrl, setPayloadUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hotspotId) return;
    loadPayload();
  }, [hotspotId]);

  const loadPayload = async () => {
    try {
      const payloads = await base44.entities.HotspotPayload.filter({ hotspot_id: hotspotId });
      if (payloads.length > 0) {
        setPayload(payloads[0]);
        setPayloadType(payloads[0].payload_type);
        setPayloadUrl(payloads[0].payload_url || '');
      }
    } catch (error) {
      console.error('Load payload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await base44.functions.invoke('saveHotspotData', {
        action: payload ? 'update_payload' : 'create_payload',
        payload: {
          payload_id: payload?.id,
          hotspot_id: hotspotId,
          payload_type: payloadType,
          payload_url: payloadType === 'url' ? payloadUrl : null
        }
      });

      if (response.data.success) {
        await loadPayload();
        onPayloadSaved?.(response.data.data);
      }
    } catch (error) {
      console.error('Save payload error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!payload) return;
    setSaving(true);
    try {
      await base44.entities.HotspotPayload.delete(payload.id);
      setPayload(null);
      setPayloadType('url');
      setPayloadUrl('');
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400 text-sm">Loading payload...</div>;

  return (
    <div className="bg-gray-800 p-4 rounded border border-cyan-500/30 space-y-4">
      <h4 className="text-sm font-semibold text-white">Configure Action</h4>

      <div>
        <label className="text-sm text-gray-400 block mb-2">Payload Type</label>
        <Select value={payloadType} onValueChange={setPayloadType}>
          <SelectTrigger className="bg-gray-700 text-white border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">External URL</SelectItem>
            <SelectItem value="api_trigger">API Trigger</SelectItem>
            <SelectItem value="modal_content">Modal Content</SelectItem>
            <SelectItem value="internal_route">Internal Route</SelectItem>
            <SelectItem value="analytics_event">Analytics Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {payloadType === 'url' && (
        <div>
          <label className="text-sm text-gray-400 block mb-2">HTTPS URL</label>
          <Input
            type="url"
            value={payloadUrl}
            onChange={(e) => setPayloadUrl(e.target.value)}
            placeholder="https://example.com"
            className="bg-gray-700 text-white border-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">Must start with https://</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || (payloadType === 'url' && !payloadUrl.startsWith('https://'))}
          className="bg-cyan-600 hover:bg-cyan-500"
          size="sm"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>

        {payload && (
          <Button
            onClick={handleDelete}
            disabled={saving}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}