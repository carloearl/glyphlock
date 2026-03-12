import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * MULTI-VENUE PERFORMANCE COMPARISON
 * Compare revenue across all venues
 */

export default function VenueComparison({ venueData }) {
  const chartData = [
    {
      venue: 'Dream Palace',
      revenue: venueData?.dream_palace || 0,
      bills: venueData?.dream_palace_bills || 0
    },
    {
      venue: 'Bones Cabaret',
      revenue: venueData?.bones || 0,
      bills: venueData?.bones_bills || 0
    },
    {
      venue: 'Skin Cabaret',
      revenue: venueData?.skin || 0,
      bills: venueData?.skin_bills || 0
    }
  ];

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