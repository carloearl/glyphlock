import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Edit, Trash2, Package, AlertTriangle, Search, Filter,
  CheckSquare, Square, DollarSign, Tag, Layers, Save, X
} from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { writeEntity } from "@/lib/nups/writeEntity";

// ─── Config ────────────────────────────────────────────────────────────
const CATEGORIES = ["Food & Beverage", "Spirits", "Beer & Wine", "Mixers", "VIP Service", "Merchandise", "Services", "Other"];

const CAT_COLORS = {
  "Food & Beverage": "#10b981",
  "Spirits": "#f59e0b",
  "Beer & Wine": "#6366f1",
  "Mixers": "#06b6d4",
  "VIP Service": "#ec4899",
  "Merchandise": "#a855f7",
  "Services": "#3b82f6",
  "Other": "#6b7280",
};

const EMPTY_FORM = {
  name: "", sku: "", price: 0, cost: 0, category: "Other",
  stock_quantity: 0, low_stock_threshold: 10, barcode: "",
  is_active: true, taxable: true, tax_rate: 0.08
};

// ─── Product Form Dialog ────────────────────────────────────────────────
function ProductFormDialog({ open, onClose, product, onSave, loading }) {
  const [form, setForm] = useState(product || EMPTY_FORM);

  React.useEffect(() => {
    setForm(product || EMPTY_FORM);
  }, [product, open]);

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = {
      ...form,
      name: (form.name || "").replace(/<[^>]*>/g, "").trim(),
      price: Math.max(0, parseFloat(form.price) || 0),
      cost: Math.max(0, parseFloat(form.cost) || 0),
      stock_quantity: Math.max(0, parseInt(form.stock_quantity) || 0),
      low_stock_threshold: Math.max(0, parseInt(form.low_stock_threshold) || 10),
      tax_rate: form.taxable ? (parseFloat(form.tax_rate) || 0.08) : 0,
    };
    if (!cleaned.name) return;
    onSave(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-950 border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">Product Name *</Label>
              <Input value={form.name} onChange={e => f("name", e.target.value)}
                required className="bg-black/40 border-white/15 text-white h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">SKU</Label>
              <Input value={form.sku} onChange={e => f("sku", e.target.value)}
                className="bg-black/40 border-white/15 text-white h-9 mt-1" />
            </div>
          </div>

          {/* Price + Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">Price *</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <Input type="number" step="0.01" value={form.price} onChange={e => f("price", e.target.value)}
                  required className="bg-black/40 border-white/15 text-white h-9 pl-6" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Cost</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <Input type="number" step="0.01" value={form.cost} onChange={e => f("cost", e.target.value)}
                  className="bg-black/40 border-white/15 text-white h-9 pl-6" />
              </div>
            </div>
          </div>

          {/* Category + Taxable */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">Category</Label>
              <Select value={form.category} onValueChange={v => f("category", v)}>
                <SelectTrigger className="bg-black/40 border-white/15 text-white h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Tax</Label>
              <div className="flex items-center gap-2 mt-1">
                <button type="button" onClick={() => f("taxable", !form.taxable)}
                  className="flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-all w-full"
                  style={{
                    background: form.taxable ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
                    border: form.taxable ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.3)',
                    color: form.taxable ? '#4ade80' : '#f87171',
                  }}>
                  {form.taxable ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {form.taxable ? "Taxable" : "Non-Taxable"}
                </button>
              </div>
            </div>
          </div>

          {/* Tax rate (only if taxable) */}
          {form.taxable && (
            <div>
              <Label className="text-xs text-gray-400">Tax Rate (%)</Label>
              <Input type="number" step="0.001" value={(form.tax_rate * 100).toFixed(1)}
                onChange={e => f("tax_rate", parseFloat(e.target.value) / 100 || 0)}
                className="bg-black/40 border-white/15 text-white h-9 mt-1 w-32" />
            </div>
          )}

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">Stock Qty</Label>
              <Input type="number" value={form.stock_quantity} onChange={e => f("stock_quantity", e.target.value)}
                className="bg-black/40 border-white/15 text-white h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Low Stock Alert</Label>
              <Input type="number" value={form.low_stock_threshold} onChange={e => f("low_stock_threshold", e.target.value)}
                className="bg-black/40 border-white/15 text-white h-9 mt-1" />
            </div>
          </div>

          {/* Barcode */}
          <div>
            <Label className="text-xs text-gray-400">Barcode</Label>
            <Input value={form.barcode} onChange={e => f("barcode", e.target.value)}
              className="bg-black/40 border-white/15 text-white h-9 mt-1 font-mono" />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => f("is_active", !form.is_active)}
              className="flex items-center gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-lg"
              style={{
                background: form.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                border: form.is_active ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
                color: form.is_active ? '#4ade80' : '#6b7280',
              }}>
              {form.is_active ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              Active
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold">
              <Save className="w-4 h-4 mr-2" />
              {product ? "Update Product" : "Create Product"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}
              className="border-white/10 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function ProductManagement() {
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);

  const { data: products = [] } = useQuery({
    queryKey: ['pos-products', venueId],
    queryFn: () => venueId ? base44.entities.POSProduct.filter({ venue_id: venueId }) : Promise.resolve([]),
    enabled: !!venueId,
  });

  const governedProductWrite = async ({ operation, id, data, intent }) => {
    if (!venueId) throw new Error("Select an active venue before changing the product catalog.");
    const me = await base44.auth.me();
    const result = await writeEntity({
      entity: "POSProduct",
      operation,
      id,
      data: operation === "delete" ? undefined : { ...data, venue_id: venueId },
      actor: { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || "External" },
      venue_id: venueId,
      intent,
    });
    if (!result?.ok) throw new Error(result?.block_reason || `Product ${operation} was rejected.`);
    return result.value;
  };

  const createProduct = useMutation({
    mutationFn: (data) => governedProductWrite({ operation: "create", data, intent: "POS_PRODUCT_CREATE" }),
    onSuccess: () => { queryClient.invalidateQueries(['pos-products']); setShowDialog(false); },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => governedProductWrite({ operation: "update", id, data, intent: "POS_PRODUCT_UPDATE" }),
    onSuccess: () => { queryClient.invalidateQueries(['pos-products']); setShowDialog(false); setEditingProduct(null); },
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => governedProductWrite({ operation: "delete", id, intent: "POS_PRODUCT_DELETE" }),
    onSuccess: () => queryClient.invalidateQueries(['pos-products']),
  });

  // ── Filtered list ──
  const filtered = useMemo(() => products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    const matchStatus = filterStatus === "all"
      || (filterStatus === "active" && p.is_active)
      || (filterStatus === "inactive" && !p.is_active)
      || (filterStatus === "low" && p.stock_quantity <= (p.low_stock_threshold || 10));
    return matchSearch && matchCat && matchStatus;
  }), [products, search, filterCat, filterStatus]);

  // ── Low stock count ──
  const lowStockCount = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 10) && p.is_active).length;

  // ── Bulk actions ──
  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const selectAll = () => setSelected(new Set(filtered.map(p => p.id)));
  const clearSelect = () => setSelected(new Set());

  const applyBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = [...selected];
    if (bulkAction === "activate") {
      await Promise.all(ids.map(id => governedProductWrite({ operation: "update", id, data: { is_active: true }, intent: "POS_PRODUCT_BULK_ACTIVATE" })));
    } else if (bulkAction === "deactivate") {
      await Promise.all(ids.map(id => governedProductWrite({ operation: "update", id, data: { is_active: false }, intent: "POS_PRODUCT_BULK_DEACTIVATE" })));
    } else if (bulkAction === "taxable") {
      await Promise.all(ids.map(id => governedProductWrite({ operation: "update", id, data: { taxable: true, tax_rate: 0.08 }, intent: "POS_PRODUCT_BULK_TAXABLE" })));
    } else if (bulkAction === "non-taxable") {
      await Promise.all(ids.map(id => governedProductWrite({ operation: "update", id, data: { taxable: false, tax_rate: 0 }, intent: "POS_PRODUCT_BULK_NONTAXABLE" })));
    } else if (bulkAction === "delete") {
      await Promise.all(ids.map(id => governedProductWrite({ operation: "delete", id, intent: "POS_PRODUCT_BULK_DELETE" })));
    }
    queryClient.invalidateQueries(['pos-products']);
    clearSelect();
    setBulkAction(null);
  };

  const handleEdit = (product) => { setEditingProduct(product); setShowDialog(true); };
  const handleNew = () => { setEditingProduct(null); setShowDialog(true); };
  const handleSave = (data) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data });
    } else {
      createProduct.mutate(data);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Product Catalog</h2>
          <p className="text-xs text-gray-500">{products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <button onClick={() => setFilterStatus("low")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowStockCount} Low Stock
            </button>
          )}
          <button onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 20px rgba(6,182,212,0.25)' }}>
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, SKU..."
            className="pl-8 h-9 bg-black/40 border-white/10 text-white text-sm" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="h-9 w-40 bg-black/40 border-white/10 text-gray-300 text-sm">
            <Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-32 bg-black/40 border-white/10 text-gray-300 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl flex-wrap"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <span className="text-xs font-bold text-indigo-300">{selected.size} selected</span>
          <div className="flex-1" />
          <Select value={bulkAction || ""} onValueChange={setBulkAction}>
            <SelectTrigger className="h-8 w-40 bg-black/40 border-white/10 text-gray-300 text-xs">
              <SelectValue placeholder="Bulk action..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-xs">
              <SelectItem value="activate">Set Active</SelectItem>
              <SelectItem value="deactivate">Set Inactive</SelectItem>
              <SelectItem value="taxable">Mark Taxable</SelectItem>
              <SelectItem value="non-taxable">Mark Non-Taxable</SelectItem>
              <SelectItem value="delete">Delete Selected</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={applyBulkAction} disabled={!bulkAction}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-all active:scale-95"
            style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.5)' }}>
            <Save className="w-3.5 h-3.5 inline mr-1" />Apply
          </button>
          <button onClick={clearSelect} className="text-gray-500 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Column Headers ── */}
      <div className="flex items-center gap-2 px-3 text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
        <button onClick={selected.size === filtered.length ? clearSelect : selectAll}
          className="w-5 shrink-0 hover:text-white transition-colors">
          {selected.size === filtered.length && filtered.length > 0
            ? <CheckSquare className="w-4 h-4 text-indigo-400" />
            : <Square className="w-4 h-4" />}
        </button>
        <div className="flex-1">Product</div>
        <div className="w-24 text-center">Category</div>
        <div className="w-16 text-center">Stock</div>
        <div className="w-16 text-center">Tax</div>
        <div className="w-20 text-right">Price</div>
        <div className="w-16" />
      </div>

      {/* ── Product Rows ── */}
      <div className="space-y-1.5">
        {filtered.map(product => {
          const catColor = CAT_COLORS[product.category] || "#6b7280";
          const isLow = product.stock_quantity <= (product.low_stock_threshold || 10) && product.is_active;
          const margin = product.cost > 0 ? ((product.price - product.cost) / product.price * 100).toFixed(0) : null;

          return (
            <div key={product.id}
              className="flex items-center gap-2 px-3 py-3 rounded-xl group transition-all"
              style={{
                background: selected.has(product.id) ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                border: selected.has(product.id) ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
              }}>
              {/* Checkbox */}
              <button onClick={() => toggleSelect(product.id)} className="w-5 shrink-0 text-gray-600 hover:text-indigo-400 transition-colors">
                {selected.has(product.id) ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
              </button>

              {/* Icon + Name */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${catColor}18`, border: `1px solid ${catColor}30` }}>
                  <Package className="w-4 h-4" style={{ color: catColor }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm truncate">{product.name}</span>
                    {!product.is_active && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-gray-700 text-gray-500">INACTIVE</span>
                    )}
                  </div>
                  {product.sku && <div className="text-[10px] text-gray-600 font-mono">{product.sku}</div>}
                  {margin && <div className="text-[10px] text-emerald-600">{margin}% margin</div>}
                </div>
              </div>

              {/* Category */}
              <div className="w-24 text-center shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${catColor}15`, color: catColor }}>
                  {product.category}
                </span>
              </div>

              {/* Stock */}
              <div className="w-16 text-center shrink-0">
                <span className={`text-sm font-bold ${isLow ? 'text-red-400' : 'text-gray-300'}`}>
                  {product.stock_quantity}
                </span>
                {isLow && <AlertTriangle className="w-3 h-3 text-red-400 inline ml-1" />}
              </div>

              {/* Tax */}
              <div className="w-16 text-center shrink-0">
                {product.taxable !== false ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-green-500/10 text-green-400">
                    {product.tax_rate ? `${(product.tax_rate * 100).toFixed(0)}%` : "Tax"}
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-white/5 text-gray-600">Exempt</span>
                )}
              </div>

              {/* Price */}
              <div className="w-20 text-right shrink-0">
                <span className="text-base font-black text-cyan-400">${product.price?.toFixed(2)}</span>
                {product.cost > 0 && (
                  <div className="text-[10px] text-gray-600">cost ${product.cost?.toFixed(2)}</div>
                )}
              </div>

              {/* Actions */}
              <div className="w-16 flex items-center justify-end gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(product)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteProduct.mutate(product.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.15)' }}>
          <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No products found</p>
        </div>
      )}

      {/* ── Form Dialog ── */}
      <ProductFormDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditingProduct(null); }}
        product={editingProduct}
        onSave={handleSave}
        loading={createProduct.isPending || updateProduct.isPending}
      />
    </div>
  );
}