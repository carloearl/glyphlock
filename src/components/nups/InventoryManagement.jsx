import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, AlertTriangle, TrendingDown, Plus, Search } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { writeEntity } from "@/lib/nups/writeEntity";

export default function InventoryManagement({ products }) {
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const venueProducts = venueId ? products.filter(p => p.venue_id === venueId) : [];
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchForm, setBatchForm] = useState({
    batch_id: `BATCH-${Date.now()}`,
    product_id: "",
    product_name: "",
    quantity: 0,
    cost_per_unit: 0,
    total_cost: 0,
    supplier: "",
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
    batch_number: "",
    status: "received"
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['pos-inventory-batches', venueId],
    queryFn: () => venueId ? base44.entities.POSInventoryBatch.filter({ venue_id: venueId }, '-created_date') : Promise.resolve([]),
    enabled: !!venueId,
  });

  const createBatch = useMutation({
    mutationFn: async (data) => {
      if (!venueId) throw new Error("Select an active venue before receiving inventory.");
      const product = venueProducts.find(p => p.id === data.product_id);
      if (!product) throw new Error("Selected product is not available for the active venue.");
      const me = await base44.auth.me();
      const actor = { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || "External" };
      const batchWrite = await writeEntity({
        entity: "POSInventoryBatch",
        operation: "create",
        data: { ...data, venue_id: venueId },
        actor,
        venue_id: venueId,
        intent: "POS_INVENTORY_BATCH_RECEIVE",
      });
      if (!batchWrite?.ok) throw new Error(batchWrite?.block_reason || "Inventory batch write was rejected.");

      const newQuantity = Number(product.stock_quantity || 0) + Number(data.quantity || 0);
      const productWrite = await writeEntity({
        entity: "POSProduct",
        operation: "update",
        id: product.id,
        data: { venue_id: venueId, stock_quantity: newQuantity },
        actor,
        venue_id: venueId,
        intent: "POS_PRODUCT_STOCK_RECEIPT",
      });
      if (!productWrite?.ok) throw new Error(productWrite?.block_reason || "Product stock update was rejected.");
      return batchWrite.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pos-inventory-batches']);
      queryClient.invalidateQueries(['pos-products']);
      setShowBatchDialog(false);
      setBatchForm({
        batch_id: `BATCH-${Date.now()}`,
        product_id: "",
        product_name: "",
        quantity: 0,
        cost_per_unit: 0,
        total_cost: 0,
        supplier: "",
        purchase_date: new Date().toISOString().split('T')[0],
        expiry_date: "",
        batch_number: "",
        status: "received"
      });
    }
  });

  const lowStockProducts = venueProducts.filter(p => 
    p.stock_quantity <= (p.low_stock_threshold || 10)
  );

  const filteredProducts = venueProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'low' && p.stock_quantity <= (p.low_stock_threshold || 10)) ||
                         (statusFilter === 'out' && p.stock_quantity === 0) ||
                         (statusFilter === 'active' && p.stock_quantity > (p.low_stock_threshold || 10));
    
    return matchesSearch && matchesStatus;
  });

  const handleProductSelect = (productId) => {
    const product = venueProducts.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setBatchForm({
        ...batchForm,
        product_id: product.id,
        product_name: product.name,
        cost_per_unit: product.cost || 0
      });
    }
  };

  const handleQuantityChange = (qty) => {
    const quantity = parseInt(qty) || 0;
    setBatchForm({
      ...batchForm,
      quantity,
      total_cost: quantity * batchForm.cost_per_unit
    });
  };

  const handleCostChange = (cost) => {
    const costPerUnit = parseFloat(cost) || 0;
    setBatchForm({
      ...batchForm,
      cost_per_unit: costPerUnit,
      total_cost: batchForm.quantity * costPerUnit
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert for Low Stock */}
      {lowStockProducts.length > 0 && (
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-600/10 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-white mb-2">Low Stock Alert</h3>
                <p className="text-sm text-gray-300 mb-3">
                  {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low on stock
                </p>
                <div className="flex flex-wrap gap-2">
                  {lowStockProducts.slice(0, 5).map(p => (
                    <Badge key={p.id} variant="outline" className="border-red-500/50 text-red-400">
                      {p.name}: {p.stock_quantity} left
                    </Badge>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <Badge variant="outline" className="border-red-500/50 text-red-400">
                      +{lowStockProducts.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Add Batch */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Inventory Management</CardTitle>
            <Button 
              onClick={() => setShowBatchDialog(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Stock Batch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="active">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{product.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        <span>SKU: {product.sku || 'N/A'}</span>
                        <span>•</span>
                        <span>Supplier: {product.supplier || 'N/A'}</span>
                        {product.location_id && (
                          <>
                            <span>•</span>
                            <span>Location: {product.location_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{product.stock_quantity}</div>
                      <div className="text-sm text-gray-400">units</div>
                    </div>
                    <div>
                      {product.stock_quantity === 0 ? (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                          Out of Stock
                        </Badge>
                      ) : product.stock_quantity <= (product.low_stock_threshold || 10) ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          In Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Batches */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Stock Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {batches.slice(0, 10).map((batch) => (
              <div key={batch.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="font-semibold text-white">{batch.product_name}</div>
                      <div className="text-sm text-gray-400">Batch: {batch.batch_id}</div>
                    </div>
                  </div>
                  <Badge className={
                    batch.status === 'in_stock' ? 'bg-green-500/20 text-green-400' :
                    batch.status === 'low' ? 'bg-yellow-500/20 text-yellow-400' :
                    batch.status === 'depleted' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }>
                    {batch.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                  <div>
                    <div className="text-gray-400">Quantity</div>
                    <div className="font-semibold text-white">{batch.quantity} units</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Cost/Unit</div>
                    <div className="font-semibold text-white">${batch.cost_per_unit?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Total Cost</div>
                    <div className="font-semibold text-green-400">${batch.total_cost?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Supplier</div>
                    <div className="font-semibold text-white">{batch.supplier || 'N/A'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Batch Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Stock Batch</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createBatch.mutate(batchForm);
          }} className="space-y-4">
            <div>
              <Label>Select Product *</Label>
              <Select value={batchForm.product_id} onValueChange={handleProductSelect}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {venueProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (Current: {p.stock_quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={batchForm.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                />
              </div>
              <div>
                <Label>Cost per Unit *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={batchForm.cost_per_unit}
                  onChange={(e) => handleCostChange(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Total Cost</Label>
              <Input
                type="text"
                value={`$${batchForm.total_cost.toFixed(2)}`}
                disabled
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Supplier</Label>
                <Input
                  value={batchForm.supplier}
                  onChange={(e) => setBatchForm({...batchForm, supplier: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Batch Number</Label>
                <Input
                  value={batchForm.batch_number}
                  onChange={(e) => setBatchForm({...batchForm, batch_number: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={batchForm.purchase_date}
                  onChange={(e) => setBatchForm({...batchForm, purchase_date: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={batchForm.expiry_date}
                  onChange={(e) => setBatchForm({...batchForm, expiry_date: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={!batchForm.product_id || createBatch.isPending}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700"
            >
              {createBatch.isPending ? "Adding..." : "Add Stock Batch"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}