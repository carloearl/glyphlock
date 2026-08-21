import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function AIInsights() {
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [forecast, setForecast] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: transactions = [] } = useQuery({
    queryKey: ['pos-transactions', venueId],
    queryFn: () => venueId ? base44.entities.POSTransaction.filter({ venue_id: venueId }, '-created_date', 100) : Promise.resolve([]),
    enabled: !!venueId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['pos-products', venueId],
    queryFn: () => venueId ? base44.entities.POSProduct.filter({ venue_id: venueId }) : Promise.resolve([]),
    enabled: !!venueId,
  });

  const generateForecast = async () => {
    setIsGenerating(true);
    
    try {
      // Prepare historical data
      const salesData = transactions.map(t => ({
        date: new Date(t.created_date).toLocaleDateString(),
        total: t.total,
        items: t.items.length
      }));

      const productPerformance = products.map(p => ({
        name: p.name,
        stock: p.stock_quantity,
        price: p.price
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI business analyst specializing in retail sales forecasting and inventory optimization.

**Historical Sales Data (last 100 transactions):**
${JSON.stringify(salesData, null, 2)}

**Current Product Inventory:**
${JSON.stringify(productPerformance, null, 2)}

Analyze this data and provide a comprehensive forecast in JSON format with:

1. "sales_forecast": {
   "next_7_days": number (predicted revenue),
   "next_30_days": number,
   "confidence": number (0-100),
   "trend": "increasing" | "stable" | "decreasing"
}

2. "top_performing_products": array of {
   "name": string,
   "predicted_sales": number,
   "growth_rate": number
} (top 5)

3. "underperforming_products": array of {
   "name": string,
   "reason": string,
   "recommendation": string
} (top 3)

4. "inventory_insights": array of {
   "product": string,
   "current_stock": number,
   "days_until_stockout": number,
   "recommended_reorder_quantity": number,
   "urgency": "low" | "medium" | "high" | "critical"
}

5. "revenue_opportunities": array of strings (actionable recommendations)

6. "daily_forecast": array of {
   "day": string (e.g., "Mon", "Tue"),
   "predicted_revenue": number,
   "predicted_transactions": number
} (next 7 days)

Be specific and data-driven in your analysis.`,
        response_json_schema: {
          type: "object",
          properties: {
            sales_forecast: {
              type: "object",
              properties: {
                next_7_days: { type: "number" },
                next_30_days: { type: "number" },
                confidence: { type: "number" },
                trend: { type: "string" }
              }
            },
            top_performing_products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  predicted_sales: { type: "number" },
                  growth_rate: { type: "number" }
                }
              }
            },
            underperforming_products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  reason: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            inventory_insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  current_stock: { type: "number" },
                  days_until_stockout: { type: "number" },
                  recommended_reorder_quantity: { type: "number" },
                  urgency: { type: "string" }
                }
              }
            },
            revenue_opportunities: {
              type: "array",
              items: { type: "string" }
            },
            daily_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  predicted_revenue: { type: "number" },
                  predicted_transactions: { type: "number" }
                }
              }
            }
          }
        }
      });

      setForecast(result);
    } catch (error) {
      console.error("Error generating forecast:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0 && !forecast) {
      generateForecast();
    }
  }, [transactions]);

  const getUrgencyColor = (urgency) => {
    const colors = {
      low: "green",
      medium: "yellow",
      high: "orange",
      critical: "red"
    };
    return colors[urgency] || "gray";
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white">AI is analyzing your sales data...</p>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-12 text-center">
          <Brain className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white">AI Sales Intelligence</h3>
          <p className="text-gray-400 mb-6">Generate AI-powered forecasts and insights</p>
          <Button onClick={generateForecast} className="bg-gradient-to-r from-blue-600 to-blue-700">
            <Brain className="w-4 h-4 mr-2" />
            Generate Forecast
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Sales Intelligence</h2>
            <p className="text-sm text-gray-400">Powered by advanced machine learning</p>
          </div>
        </div>
        <Button onClick={generateForecast} variant="outline" className="border-gray-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Forecast
        </Button>
      </div>

      {/* Sales Forecast Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-700/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-base text-white">7-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400 mb-2">
              ${forecast.sales_forecast.next_7_days.toFixed(2)}
            </div>
            <div className="flex items-center gap-2">
              {forecast.sales_forecast.trend === "increasing" ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm text-gray-400 capitalize">{forecast.sales_forecast.trend}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-700/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-base text-white">30-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              ${forecast.sales_forecast.next_30_days.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">
              Confidence: {forecast.sales_forecast.confidence}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-700/10 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-base text-white">AI Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {forecast.sales_forecast.confidence}%
            </div>
            <div className="text-sm text-gray-400">Based on historical patterns</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Forecast Chart */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">7-Day Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecast.daily_forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Line type="monotone" dataKey="predicted_revenue" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Inventory Alerts */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            AI Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {forecast.inventory_insights.map((insight, idx) => (
              <div 
                key={idx}
                className={`bg-${getUrgencyColor(insight.urgency)}-500/10 border border-${getUrgencyColor(insight.urgency)}-500/30 rounded-lg p-4`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-white">{insight.product}</div>
                    <div className="text-sm text-gray-400">
                      Current Stock: {insight.current_stock} units
                    </div>
                  </div>
                  <Badge variant="outline" className={`border-${getUrgencyColor(insight.urgency)}-500 text-${getUrgencyColor(insight.urgency)}-400`}>
                    {insight.urgency}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Days until stockout:</span>
                    <span className="ml-2 font-semibold text-white">{insight.days_until_stockout}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Reorder quantity:</span>
                    <span className="ml-2 font-semibold text-green-400">{insight.recommended_reorder_quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecast.top_performing_products.map((product, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-white">{product.name}</div>
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      +{product.growth_rate}%
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-400">
                    Predicted Sales: <span className="text-green-400 font-semibold">${product.predicted_sales.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecast.underperforming_products.map((product, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4">
                  <div className="font-semibold text-white mb-2">{product.name}</div>
                  <div className="text-sm text-gray-400 mb-2">{product.reason}</div>
                  <div className="text-sm bg-blue-500/10 border border-blue-500/30 rounded p-2">
                    <span className="text-blue-400 font-semibold">💡 </span>
                    <span className="text-gray-300">{product.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Opportunities */}
      <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white">AI Revenue Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {forecast.revenue_opportunities.map((opportunity, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-300">
                <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                <span>{opportunity}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}