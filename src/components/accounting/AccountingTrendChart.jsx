import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fmtUSD } from "@/lib/accounting/aggregateFinancials";

export default function AccountingTrendChart({ timeline = [] }) {
  if (!timeline.length) {
    return (
      <Card className="bg-gray-900/60 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-blue-400" /> Revenue vs Disbursements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600 text-center py-10">No data in selected period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/60 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Activity className="w-4 h-4 text-blue-400" /> Revenue vs Disbursements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={timeline} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickFormatter={(v) => v.slice(5)} />
            <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(v) => fmtUSD(v)}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="cash" stackId="rev" fill="#10b981" name="Cash" />
            <Bar dataKey="card" stackId="rev" fill="#3b82f6" name="Card" />
            <Line
              type="monotone"
              dataKey="disbursements"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Disbursements"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}