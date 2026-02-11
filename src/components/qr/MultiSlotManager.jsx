import React, { useState } from 'react';
import { Plus, Trash2, Shield, Lock, Globe, Clock, MapPin, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function MultiSlotManager({ slots = [], onChange }) {
  const [expandedSlot, setExpandedSlot] = useState(null);

  const addSlot = () => {
    const newSlot = {
      id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'url',
      credential_level: 'public',
      payload_data: { content: '' },
      priority: slots.length,
      enabled: true,
      conditions: {}
    };
    onChange([...slots, newSlot]);
    setExpandedSlot(newSlot.id);
    toast.success('Slot added');
  };

  const removeSlot = (slotId) => {
    onChange(slots.filter(s => s.id !== slotId));
    toast.success('Slot removed');
  };

  const updateSlot = (slotId, updates) => {
    onChange(slots.map(s => s.id === slotId ? { ...s, ...updates } : s));
  };

  const credentialLevels = [
    { value: 'public', label: 'Public', icon: Globe, color: 'text-green-400' },
    { value: 'authenticated', label: 'Authenticated', icon: Shield, color: 'text-blue-400' },
    { value: 'admin', label: 'Admin Only', icon: Lock, color: 'text-purple-400' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Multi-Slot Payload Management</h3>
          <p className="text-sm text-gray-400">Create credential-gated payloads with priority resolution</p>
        </div>
        <Button onClick={addSlot} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
          <Plus className="w-4 h-4 mr-2" />
          Add Slot
        </Button>
      </div>

      {slots.length === 0 ? (
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="pt-12 pb-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No slots configured. Add a slot to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {slots
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))
            .map((slot, index) => {
              const CredIcon = credentialLevels.find(l => l.value === slot.credential_level)?.icon || Globe;
              const credColor = credentialLevels.find(l => l.value === slot.credential_level)?.color || 'text-gray-400';
              const isExpanded = expandedSlot === slot.id;

              return (
                <Card key={slot.id} className="bg-gray-800/50 border-gray-700 overflow-hidden">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/70 transition-all"
                    onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center text-xs font-bold text-cyan-400">
                          #{index + 1}
                        </div>
                        <CredIcon className={`w-5 h-5 ${credColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white truncate">
                            {slot.payload_data?.content || 'Empty Slot'}
                          </span>
                          {!slot.enabled && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs">Disabled</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="capitalize">{slot.type}</span>
                          <span>•</span>
                          <span className="capitalize">{slot.credential_level}</span>
                          <span>•</span>
                          <span>Priority: {slot.priority}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={slot.enabled}
                        onCheckedChange={(checked) => {
                          updateSlot(slot.id, { enabled: checked });
                          toast.success(checked ? 'Slot enabled' : 'Slot disabled');
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlot(slot.id);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-4 border-t border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Payload Type</Label>
                          <Select
                            value={slot.type}
                            onValueChange={(value) => updateSlot(slot.id, { type: value })}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              <SelectItem value="url">URL</SelectItem>
                              <SelectItem value="vcard">vCard</SelectItem>
                              <SelectItem value="wifi">WiFi</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-gray-300">Credential Level</Label>
                          <Select
                            value={slot.credential_level}
                            onValueChange={(value) => updateSlot(slot.id, { credential_level: value })}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              {credentialLevels.map(level => (
                                <SelectItem key={level.value} value={level.value}>
                                  <div className="flex items-center gap-2">
                                    <level.icon className={`w-4 h-4 ${level.color}`} />
                                    {level.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-300">Payload Content</Label>
                        <Input
                          value={slot.payload_data?.content || ''}
                          onChange={(e) => updateSlot(slot.id, {
                            payload_data: { ...slot.payload_data, content: e.target.value }
                          })}
                          placeholder="Enter payload content..."
                          className="bg-gray-900 border-gray-700 text-white mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">Priority (higher = checked first)</Label>
                        <Input
                          type="number"
                          value={slot.priority || 0}
                          onChange={(e) => updateSlot(slot.id, { priority: parseInt(e.target.value) })}
                          className="bg-gray-900 border-gray-700 text-white mt-2"
                        />
                      </div>

                      <div className="pt-4 border-t border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Optional Conditions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                            <Label className="text-gray-400 text-xs">Time Range</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="time"
                                placeholder="Start"
                                className="bg-gray-800 border-gray-700 text-white text-xs"
                                onChange={(e) => updateSlot(slot.id, {
                                  conditions: {
                                    ...slot.conditions,
                                    time_range: { ...slot.conditions?.time_range, start: e.target.value }
                                  }
                                })}
                              />
                              <Input
                                type="time"
                                placeholder="End"
                                className="bg-gray-800 border-gray-700 text-white text-xs"
                                onChange={(e) => updateSlot(slot.id, {
                                  conditions: {
                                    ...slot.conditions,
                                    time_range: { ...slot.conditions?.time_range, end: e.target.value }
                                  }
                                })}
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                            <Label className="text-gray-400 text-xs flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Geofence (optional)
                            </Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <Input
                                type="number"
                                placeholder="Lat"
                                className="bg-gray-800 border-gray-700 text-white text-xs"
                                onChange={(e) => updateSlot(slot.id, {
                                  conditions: {
                                    ...slot.conditions,
                                    geofence: { ...slot.conditions?.geofence, latitude: parseFloat(e.target.value) }
                                  }
                                })}
                              />
                              <Input
                                type="number"
                                placeholder="Lng"
                                className="bg-gray-800 border-gray-700 text-white text-xs"
                                onChange={(e) => updateSlot(slot.id, {
                                  conditions: {
                                    ...slot.conditions,
                                    geofence: { ...slot.conditions?.geofence, longitude: parseFloat(e.target.value) }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}