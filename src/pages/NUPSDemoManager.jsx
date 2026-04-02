import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, RefreshCw, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NUPSDemoManager() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    tier: 'standard',
    expiresIn: 7
  });

  useEffect(() => {
    (async () => {
      try {
        const userData = await base44.auth.me();
        if (userData?.role !== 'admin') {
          navigate('/');
          return;
        }
        setUser(userData);
        await loadDemoUsers();
      } catch (err) {
        navigate('/');
      }
      setLoading(false);
    })();
  }, [navigate]);

  const loadDemoUsers = async () => {
    try {
      // In a real app, query demo users from a collection
      setDemoUsers([]);
    } catch (err) {
      toast.error('Failed to load demo users');
    }
  };

  const createDemoUser = async () => {
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    setCreating(true);
    try {
      // Create demo user via backend function
      const result = await base44.functions.invoke('createDemoUser', {
        email: formData.email,
        tier: formData.tier,
        expiresIn: formData.expiresIn
      });

      toast.success(`Demo user created: ${formData.email}`);
      setFormData({ email: '', tier: 'standard', expiresIn: 7 });
      setShowForm(false);
      await loadDemoUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to create demo user');
    } finally {
      setCreating(false);
    }
  };

  const seedDemoData = async () => {
    if (!window.confirm('Seed demo contracts and transactions? This will populate test data.')) return;

    setSeeding(true);
    try {
      await base44.functions.invoke('seedDemoContracts', { clear_existing: true });
      toast.success('Demo data seeded successfully');
      await loadDemoUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  const deleteDemoUser = async (id) => {
    if (!window.confirm('Delete this demo user?')) return;

    try {
      // Delete via backend
      await base44.functions.invoke('deleteDemoUser', { demoUserId: id });
      toast.success('Demo user deleted');
      await loadDemoUsers();
    } catch (err) {
      toast.error('Failed to delete demo user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] p-4 bg-black/95 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/NUPSGateway')} className="text-gray-600 hover:text-gray-400">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="font-bold text-white text-sm">Demo Manager</div>
              <div className="text-[10px] text-gray-500">Admin only — manage test accounts</div>
            </div>
          </div>
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20">ADMIN</Badge>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Warning */}
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-yellow-400">Demo Manager</div>
            <p className="text-sm text-yellow-300/80 mt-1">This tool creates temporary test accounts and demo data. All demo accounts expire after the configured duration.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-gray-900/50 border-white/[0.06]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Create Demo User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!showForm ? (
                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-xs h-9"
                >
                  + New Demo User
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="demo@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white/[0.05] border-white/[0.1] text-white text-xs h-8"
                  />
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-xs"
                  >
                    <option value="standard">Standard (7 days)</option>
                    <option value="extended">Extended (30 days)</option>
                    <option value="permanent">Permanent</option>
                  </select>
                  <div className="flex gap-2">
                    <Button
                      onClick={createDemoUser}
                      disabled={creating}
                      className="flex-1 bg-green-600 text-xs h-8"
                    >
                      {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                    </Button>
                    <Button
                      onClick={() => setShowForm(false)}
                      variant="outline"
                      className="flex-1 border-white/[0.1] text-xs h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-white/[0.06]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                Seed Demo Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={seedDemoData}
                disabled={seeding}
                className="w-full bg-amber-600 hover:bg-amber-500 text-xs h-9"
              >
                {seeding ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                {seeding ? 'Seeding...' : 'Seed Contracts & Transactions'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Demo Users List */}
        <Card className="bg-gray-900/50 border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Demo Users</CardTitle>
          </CardHeader>
          <CardContent>
            {demoUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-xs">No demo users created yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {demoUsers.map((du) => (
                  <div key={du.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{du.email}</div>
                      <div className="text-xs text-gray-500">Expires: {new Date(du.expiresAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                        {du.tier}
                      </Badge>
                      <button
                        onClick={() => deleteDemoUser(du.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}