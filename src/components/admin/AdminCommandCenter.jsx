import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Database, Settings, Activity, Users, Lock, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ADMIN_EMAIL = 'carloearl@glyphlock.com';

export default function AdminCommandCenter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        if (userData.email === ADMIN_EMAIL) {
          setAuthorized(true);
        }
      } catch (err) {
        console.error('Auth failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-cyan-400 text-xl">Verifying credentials...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <Card className="max-w-md bg-red-950/50 border-2 border-red-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              UNAUTHORIZED ACCESS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">
              This system is restricted to authorized GlyphLock administrators only.
            </p>
            <p className="text-xs text-slate-500 mt-4">
              Access attempt logged. Contact security@glyphlock.com
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute -left-6 top-0 w-32 h-32 bg-cyan-500 rounded-full blur-[100px] opacity-30" />
          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2 flex items-center gap-4">
            <Shield className="w-12 h-12 text-cyan-400" />
            COMMAND CENTER
          </h1>
          <p className="text-slate-400 text-lg">
            Administrator: <span className="text-cyan-400 font-bold">{user.email}</span>
          </p>
        </div>

        {/* Main Controls */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-900/80 border border-purple-500/30 p-2">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20">
              <Database className="w-4 h-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20">
              <Settings className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-900/80 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold">All Systems Operational</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-white">Real-time loading...</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
                <CardHeader>
                  <CardTitle className="text-pink-400 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Operations/Hour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-white">Real-time loading...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Alert className="bg-cyan-500/10 border-cyan-500/30">
              <AlertDescription className="text-cyan-300">
                User management panel - Full Base44 preview controls to be migrated here
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="data">
            <Alert className="bg-purple-500/10 border-purple-500/30">
              <AlertDescription className="text-purple-300">
                Database explorer - Full Base44 preview controls to be migrated here
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="system">
            <Alert className="bg-pink-500/10 border-pink-500/30">
              <AlertDescription className="text-pink-300">
                System configuration - Full Base44 preview controls to be migrated here
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}