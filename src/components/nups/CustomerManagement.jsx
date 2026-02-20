import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Plus, Search, Star, Calendar, DollarSign, Eye, Edit } from "lucide-react";
import { format } from "date-fns";

export default function CustomerManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    birthday: "",
    notes: ""
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['pos-customers'],
    queryFn: () => base44.entities.POSCustomer.list('-created_date')
  });

  const createCustomer = useMutation({
    mutationFn: (data) => base44.entities.POSCustomer.create({
      customer_id: `CUST-${Date.now()}`,
      ...data,
      preferences: {
        favorite_categories: [],
        communication_preferences: {
          email: true,
          sms: false,
          phone: false
        }
      },
      tags: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-customers'] });
      setIsDialogOpen(false);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        birthday: "",
        notes: ""
      });
    }
  });

  const updateCustomer = useMutation({
    mutationFn: ({ id, data }) => base44.entities.POSCustomer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-customers'] });
      setIsDialogOpen(false);
      setSelectedCustomer(null);
    }
  });

  const stripHtml = (str) => (str || '').replace(/<[^>]*>/g, '').replace(/[<>"']/g, '').trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = {
      full_name: stripHtml(formData.full_name),
      email: (formData.email || '').trim(),
      phone: stripHtml(formData.phone),
      birthday: formData.birthday,
      notes: stripHtml(formData.notes).slice(0, 1000)
    };
    if (cleaned.full_name.length < 2) return;
    if (cleaned.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) return;
    if (selectedCustomer) {
      updateCustomer.mutate({ id: selectedCustomer.id, data: cleaned });
    } else {
      createCustomer.mutate(cleaned);
    }
  };

  const openEditDialog = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      email: customer.email || "",
      phone: customer.phone || "",
      birthday: customer.birthday || "",
      notes: customer.notes || ""
    });
    setIsDialogOpen(true);
  };

  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      active: "green",
      inactive: "gray",
      vip: "purple"
    };
    return colors[status] || "gray";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Customer Management</h2>
          <p className="text-sm text-gray-400">Manage customer profiles and relationships</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedCustomer(null);
                setFormData({
                  full_name: "",
                  email: "",
                  phone: "",
                  birthday: "",
                  notes: ""
                });
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>{selectedCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Birthday</Label>
                <Input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  {selectedCustomer ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border-gray-700 pl-10"
        />
      </div>

      {/* Customer Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-cyan-400">{customers.length}</p>
              </div>
              <User className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">VIP Customers</p>
                <p className="text-2xl font-bold text-purple-400">
                  {customers.filter(c => c.status === 'vip').length}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  ${customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-600/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg. Spent</p>
                <p className="text-2xl font-bold text-orange-400">
                  ${customers.length > 0 ? (customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{customer.full_name}</h3>
                        <Badge variant="outline" className={`border-${getStatusColor(customer.status)}-500 text-${getStatusColor(customer.status)}-400 text-xs`}>
                          {customer.status}
                        </Badge>
                        {customer.status === 'vip' && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Customer ID:</span>
                          <span className="ml-2 text-gray-300">{customer.customer_id}</span>
                        </div>
                        {customer.email && (
                          <div>
                            <span className="text-gray-400">Email:</span>
                            <span className="ml-2 text-gray-300">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div>
                            <span className="text-gray-400">Phone:</span>
                            <span className="ml-2 text-gray-300">{customer.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="grid md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div className="bg-cyan-500/10 rounded p-2">
                          <div className="text-xs text-gray-400">Total Spent</div>
                          <div className="font-semibold text-cyan-400">${(customer.total_spent || 0).toFixed(2)}</div>
                        </div>
                        <div className="bg-purple-500/10 rounded p-2">
                          <div className="text-xs text-gray-400">Visits</div>
                          <div className="font-semibold text-purple-400">{customer.visit_count || 0}</div>
                        </div>
                        <div className="bg-green-500/10 rounded p-2">
                          <div className="text-xs text-gray-400">Loyalty Points</div>
                          <div className="font-semibold text-green-400">{customer.loyalty_points || 0}</div>
                        </div>
                        {customer.last_visit && (
                          <div className="bg-orange-500/10 rounded p-2">
                            <div className="text-xs text-gray-400">Last Visit</div>
                            <div className="font-semibold text-orange-400 text-xs">
                              {format(new Date(customer.last_visit), "MMM d")}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(customer)}
                      className="border-gray-700 hover:bg-gray-700"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No customers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}