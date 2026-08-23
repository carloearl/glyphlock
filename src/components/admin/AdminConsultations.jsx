import React, { useState } from "react";
import { glyphlockWrite } from "@/lib/glyphlock/glyphlockWriteGateway";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Mail, Phone, Building, Search, CheckCircle, Clock, XCircle } from "lucide-react";

export default function AdminConsultations({ consultations }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => glyphlockWrite('consultation_status', {
      id,
      status,
      intent: 'admin_update_consultation_status',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-consultations'] });
      toast.success('Consultation status updated');
    },
    onError: (error) => toast.error(error?.message || 'Status update failed'),
  });

  const filteredConsultations = consultations.filter(c => {
    const matchesSearch = 
      (c.contact_name || c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contact_email || c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.verification_interest || c.service_interest || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || c.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'qualified': return <CheckCircle className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'under_review': return <Clock className="w-4 h-4" />;
      case 'engagement_started': return <CheckCircle className="w-4 h-4" />;
      case 'not_qualified': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Manage Consultations</CardTitle>
          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
            {filteredConsultations.length} Results
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="not_qualified">Not Qualified</SelectItem>
              <SelectItem value="engagement_started">Engagement Started</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Consultations List */}
        <div className="space-y-4">
          {filteredConsultations.map((consultation, index) => (
            <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{consultation.contact_name || consultation.full_name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {consultation.contact_email || consultation.email}
                    </div>
                    {(consultation.contact_phone || consultation.phone) && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {consultation.contact_phone || consultation.phone}
                      </div>
                    )}
                    {(consultation.organization_name || consultation.company) && (
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {consultation.organization_name || consultation.company}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={
                    consultation.status === 'qualified'
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : ['submitted', 'under_review'].includes(consultation.status)
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                      : consultation.status === 'engagement_started'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                  }>
                    {getStatusIcon(consultation.status)}
                    <span className="ml-1">{consultation.status}</span>
                  </Badge>
                  <Badge className={
                    consultation.payment_status === 'paid'
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : consultation.payment_status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                      : consultation.payment_status === 'failed'
                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                      : 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                  }>
                    {consultation.payment_status}
                  </Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Service Interest</div>
                  <div className="text-white font-semibold">{consultation.verification_interest || consultation.service_interest}</div>
                </div>
                {consultation.preferred_date && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Preferred Date</div>
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="w-4 h-4" />
                      {new Date(consultation.preferred_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}
              </div>

              {(consultation.primary_concern || consultation.message) && (
                <div className="mb-3">
                  <div className="text-sm text-gray-400 mb-1">Message</div>
                  <p className="text-gray-300 text-sm">{consultation.primary_concern || consultation.message}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <div className="text-xs text-gray-500">
                  ID: {consultation.id.slice(0, 12)}... • Created: {new Date(consultation.created_date).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  {consultation.status === 'submitted' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: consultation.id, status: 'under_review' })}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Start Review
                    </Button>
                  )}
                  {consultation.status === 'under_review' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: consultation.id, status: 'qualified' })}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Qualify
                    </Button>
                  )}
                  {consultation.status === 'qualified' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: consultation.id, status: 'engagement_started' })}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start Engagement
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-400"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredConsultations.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No consultations found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}