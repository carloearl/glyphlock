import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Users, Star } from "lucide-react";

export default function LoyaltyProgram({ customers = [] }) {
  const loyaltyTiers = {
    Bronze: customers.filter(c => (c.loyalty_tier || 'Bronze') === 'Bronze').length,
    Silver: customers.filter(c => c.loyalty_tier === 'Silver').length,
    Gold: customers.filter(c => c.loyalty_tier === 'Gold').length,
    Platinum: customers.filter(c => c.loyalty_tier === 'Platinum').length
  };

  const vipCustomers = customers.filter(c => c.status === 'vip');
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);
  const topCustomers = [...customers]
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Tier Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-700/10 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-orange-400 mb-1">{loyaltyTiers.Bronze}</div>
            <div className="text-sm text-gray-400">Bronze Members</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-400/10 to-gray-600/10 border-gray-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-400 mb-1">{loyaltyTiers.Silver}</div>
            <div className="text-sm text-gray-400">Silver Members</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-700/10 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-1">{loyaltyTiers.Gold}</div>
            <div className="text-sm text-gray-400">Gold Members</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-700/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-1">{loyaltyTiers.Platinum}</div>
            <div className="text-sm text-gray-400">Platinum Members</div>
          </CardContent>
        </Card>
      </div>

      {/* Program Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{totalLoyaltyPoints.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Points Issued</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{vipCustomers.length}</div>
            <div className="text-sm text-gray-400">VIP Customers</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {customers.length > 0 ? Math.round((totalLoyaltyPoints / customers.length)) : 0}
            </div>
            <div className="text-sm text-gray-400">Avg Points/Customer</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Top Loyalty Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div key={customer.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{customer.full_name}</div>
                      <div className="text-sm text-gray-400">{customer.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Total Spent</div>
                      <div className="font-bold text-green-400">${(customer.total_spent || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Points</div>
                      <div className="font-bold text-yellow-400">{customer.loyalty_points || 0}</div>
                    </div>
                    <Badge className={
                      customer.loyalty_tier === 'Platinum' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' :
                      customer.loyalty_tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                      customer.loyalty_tier === 'Silver' ? 'bg-gray-400/20 text-gray-400 border-gray-400/50' :
                      'bg-orange-500/20 text-orange-400 border-orange-500/50'
                    }>
                      {customer.loyalty_tier || 'Bronze'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Loyalty Tier Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-700/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white">Bronze</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• 1 point per $1 spent</li>
                <li>• Birthday discount</li>
                <li>• Email newsletters</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-gray-400/10 to-gray-600/10 border border-gray-400/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-white">Silver</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• 1.5 points per $1</li>
                <li>• 10% birthday discount</li>
                <li>• Early sale access</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-700/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-white">Gold</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• 2 points per $1</li>
                <li>• 15% birthday discount</li>
                <li>• Free shipping</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-700/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white">Platinum</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• 3 points per $1</li>
                <li>• 20% birthday discount</li>
                <li>• VIP support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}