import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, DollarSign } from "lucide-react";

export default function SalesReport({ transactions, products }) {
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalTransactions = transactions.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Calculate category sales
  const categorySales = {};
  transactions.forEach(transaction => {
    transaction.items?.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        categorySales[product.category] = (categorySales[product.category] || 0) + item.total;
      }
    });
  });

  // Top selling products
  const productSales = {};
  transactions.forEach(transaction => {
    transaction.items?.forEach(item => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { quantity: 0, revenue: 0 };
      }
      productSales[item.product_name].quantity += item.quantity;
      productSales[item.product_name].revenue += item.total;
    });
  });

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400 mb-1">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Total Revenue</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-cyan-400 mb-1">
              {totalTransactions}
            </div>
            <div className="text-sm text-gray-400">Total Transactions</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-1">
              ${averageTransaction.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Average Transaction</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProducts.map(([name, data], index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 font-bold">
                      {index + 1}
                    </div>
                    <span className="font-semibold">{name}</span>
                  </div>
                  <span className="text-cyan-400 font-bold">${data.revenue.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-400 pl-11">
                  {data.quantity} units sold
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Sales by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(categorySales)
              .sort((a, b) => b[1] - a[1])
              .map(([category, revenue]) => (
                <div key={category} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold">{category}</span>
                  </div>
                  <span className="text-purple-400 font-bold">${revenue.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}