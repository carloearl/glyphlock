import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Brain, TrendingUp, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AnalyticsDashboard() {
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [anomalies, setAnomalies] = useState([]);

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
      const venue_id = sessionVenue.data?.venue_id;

      const result = await base44.functions.invoke('generateAIPredictions', {
        venue_id,
        analysis_type: 'peak_hours'
      });

      setPredictions(result.data.ai_analysis);
      setAnomalies(result.data.anomalies || []);
      toast.success('AI predictions generated');
    } catch (error) {
      toast.error('Failed to generate predictions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const peak_hours_data = predictions?.peak_hours?.map(ph => ({
    hour: `${ph.hour}:00`,
    revenue: ph.predicted_revenue,
    confidence: ph.confidence * 100
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-600" />
              AI Analytics Dashboard
            </h1>
            <p className="text-slate-600 mt-1">Predictive insights powered by GPT-4</p>
          </div>
          <Button onClick={fetchPredictions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Predictions
          </Button>
        </div>

        {/* Anomaly Alerts */}
        {anomalies.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertTriangle className="h-5 w-5" />
                Fraud Anomalies Detected ({anomalies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {anomalies.slice(0, 5).map((anomaly, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-red-800 px-2 py-1 bg-red-100 rounded">
                      {anomaly.severity}
                    </span>
                    <span className="text-xs text-slate-600">{anomaly.anomaly_type}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{anomaly.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="peak-hours">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="peak-hours">Peak Hours</TabsTrigger>
            <TabsTrigger value="staffing">Staffing</TabsTrigger>
            <TabsTrigger value="fraud">Fraud Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="peak-hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Predicted Peak Hours (Next 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {peak_hours_data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={peak_hours_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Predicted Revenue ($)" />
                      <Bar dataKey="confidence" fill="#10b981" name="Confidence (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-12">Loading predictions...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staffing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Bartender Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-900 font-medium">Peak Shift (9 PM - 2 AM)</p>
                      <p className="text-3xl font-bold text-purple-700">
                        {predictions?.staffing?.bartenders?.peak_shift || 4}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">Recommended bartenders</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-900 font-medium">Slow Shift (6 PM - 9 PM)</p>
                      <p className="text-3xl font-bold text-slate-700">
                        {predictions?.staffing?.bartenders?.slow_shift || 2}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Recommended bartenders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Floor Host Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900 font-medium">Peak Shift (9 PM - 2 AM)</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {predictions?.staffing?.floor_hosts?.peak_shift || 3}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Recommended hosts</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-900 font-medium">Slow Shift (6 PM - 9 PM)</p>
                      <p className="text-3xl font-bold text-slate-700">
                        {predictions?.staffing?.floor_hosts?.slow_shift || 1}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Recommended hosts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fraud" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  AI Fraud Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {predictions?.fraud_insights || 'Generating insights...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}