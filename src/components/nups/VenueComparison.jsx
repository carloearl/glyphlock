import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * MULTI-VENUE PERFORMANCE COMPARISON
 * Compare revenue across all venues
 */

export default function VenueComparison({ venues = [] }) {
  // venues: array of { venue_id, name, revenue, bills }
  // Parent component should pass an array of venue performance objects.
  const chartData = venues.map(v => ({
    venue: v.name || v.venue_id,
    revenue: v.revenue || 0,
    bills: v.bills || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Venue Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="venue" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
            <Bar dataKey="bills" fill="#10b981" name="Bills Issued" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}