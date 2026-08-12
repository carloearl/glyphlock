import React, { useState, useEffect, useRef } from 'react';
import { computeCrowdEnergyScore } from '@/lib/playlistEngine';
import { invokeDJGateway } from '@/components/mixer/automation/djGatewayClient';
import { Activity, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CrowdTab() {
  const [tips, setTips] = useState(0);
  const [votes, setVotes] = useState(0);
  const [playthrough, setPlaythrough] = useState(0.7);
  const [manual, setManual] = useState(5);
  const [useManual, setUseManual] = useState(true);
  const [history, setHistory] = useState([]);
  const [syncState, setSyncState] = useState('idle');
  const intervalRef = useRef(null);

  const currentScore = computeCrowdEnergyScore({
    tips,
    votes,
    playthrough,
    manual: useManual ? manual : null,
  });

  useEffect(() => {
    const timer = setTimeout(async () => {
      setSyncState('syncing');
      try {
        await invokeDJGateway('recordCrowdMetrics', {
          metrics: {
            energy_score: currentScore,
            tips_last_30min: tips,
            votes_last_30min: votes,
            playthrough_rate: playthrough,
            manual_slider: useManual ? manual : null,
          },
        });
        setSyncState('synced');
      } catch (_) {
        setSyncState('error');
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [currentScore, tips, votes, playthrough, manual, useManual]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setHistory(prev => {
        const next = [...prev, { time: new Date().toLocaleTimeString(), energy: currentScore }];
        return next.slice(-20);
      });
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [currentScore]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Activity className="w-5 h-5 text-green-400" /> Live Crowd Metrics
      </h3>

      <Card className="bg-slate-900/70 border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">Current Energy Score</div>
            <div className="text-right">
              <div className="text-4xl font-black text-green-400 flex items-center gap-2">
                <Zap className="w-8 h-8" /> {currentScore}/10
              </div>
              <div className={`text-[10px] font-mono ${syncState === 'error' ? 'text-red-400' : syncState === 'syncing' ? 'text-amber-400' : 'text-slate-500'}`}>
                {syncState === 'syncing' ? 'syncing to Auto-DJ…' : syncState === 'synced' ? 'Auto-DJ synced' : syncState === 'error' ? 'sync failed' : 'awaiting signal'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="flex justify-between items-center">
                Manual Override (dominant) <input type="checkbox" checked={useManual} onChange={e => setUseManual(e.target.checked)} className="w-4 h-4" />
              </Label>
              <div className="flex items-center gap-3 mt-2">
                <Slider value={[manual]} onValueChange={v => setManual(v[0])} min={0} max={10} step={1} className="flex-1" disabled={!useManual} />
                <span className="w-8 text-right font-bold text-green-400">{manual}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Tips (last 30min $)</Label>
                <Input type="number" value={tips} onChange={e => setTips(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Votes (last 30min)</Label>
                <Input type="number" value={votes} onChange={e => setVotes(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Playthrough Rate (0-1)</Label>
                <Input type="number" step="0.1" min="0" max="1" value={playthrough} onChange={e => setPlaythrough(Number(e.target.value) || 0)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/70 border-slate-700/50">
        <CardContent className="p-4">
          <div className="text-sm text-gray-400 mb-2">Energy Timeline (last {history.length} samples)</div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={10} />
                <YAxis domain={[0, 10]} stroke="#6b7280" fontSize={10} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}