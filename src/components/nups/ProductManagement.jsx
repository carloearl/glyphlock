import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProductManagement() {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: 0,
    cost: 0,
    category: "Other",
    stock_quantity: 0,
    barcode: "",
    is_active: true
  });

  const { data: products = [] } = useQuery({
    queryKey: ['pos-products'],
    queryFn: () => base44.entities.POSProduct.list()
  });

  const createProduct = useMutation({
    mutationFn: (data) => base44.entities.POSProduct.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pos-products']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => base44.entities.POSProduct.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pos-products']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => base44.entities.POSProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pos-products']);
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      price: 0,
      cost: 0,
      category: "Other",
      stock_quantity: 0,
      barcode: "",
      is_active: true
    });
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowDialog(true);
  };

  const stripHtml = (str) => (str || '').replace(/<[^>]*>/g, '').replace(/[<>"']/g, '').trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = {
      ...formData,
      name: stripHtml(formData.name),
      sku: stripHtml(formData.sku),
      barcode: stripHtml(formData.barcode),
      price: Math.max(0, parseFloat(formData.price) || 0),
      cost: Math.max(0, parseFloat(formData.cost) || 0),
      stock_quantity: Math.max(0, parseInt(formData.stock_quantity) || 0)
    };
    if (cleaned.name.length < 1) return;
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data: cleaned });
    } else {
      createProduct.mutate(cleaned);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Catalog</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      required
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value)})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                        <SelectItem value="Services">Services</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value)})}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <Label>Barcode</Label>
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
                  {editingProduct ? "Update Product" : "Create Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{product.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span>SKU: {product.sku || "N/A"}</span>
                    <span>•</span>
                    <span>Stock: {product.stock_quantity}</span>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-cyan-400">${product.price.toFixed(2)}</div>
                  {product.cost > 0 && (
                    <div className="text-sm text-gray-500">Cost: ${product.cost.toFixed(2)}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(product)}
                  className="border-cyan-500/50 hover:bg-cyan-500/10"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteProduct.mutate(product.id)}
                  className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}