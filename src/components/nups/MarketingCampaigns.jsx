import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, TrendingUp, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { writeEntity } from "@/lib/nups/writeEntity";

export default function MarketingCampaigns() {
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campaign_type: "promotion",
    discount_type: "percentage",
    discount_value: 0,
    start_date: "",
    end_date: ""
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['pos-campaigns', venueId],
    queryFn: () => venueId ? base44.entities.POSCampaign.filter({ venue_id: venueId }, '-created_date') : Promise.resolve([]),
    enabled: !!venueId,
  });

  const createCampaign = useMutation({
    mutationFn: async (data) => {
      if (!venueId) throw new Error("Select an active venue before creating a campaign.");
      const me = await base44.auth.me();
      const result = await writeEntity({
        entity: "POSCampaign",
        operation: "create",
        data: {
          campaign_id: `CAMP-${Date.now()}`,
          venue_id: venueId,
          name: data.name,
          description: data.description || "",
          type: data.campaign_type,
          status: "draft",
          target_audience: "all",
          discount_type: data.discount_type,
          discount_value: Number(data.discount_value) || 0,
          start_date: data.start_date,
          end_date: data.end_date,
        },
        actor: { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || "External" },
        venue_id: venueId,
        intent: "POS_CAMPAIGN_CREATE",
      });
      if (!result?.ok) throw new Error(result?.block_reason || "Campaign creation was rejected.");
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-campaigns'] });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        campaign_type: "promotion",
        discount_type: "percentage",
        discount_value: 0,
        start_date: "",
        end_date: ""
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createCampaign.mutate(formData);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "gray",
      active: "green",
      paused: "yellow",
      completed: "blue"
    };
    return colors[status] || "gray";
  };

  const getTypeIcon = (type) => {
    const icons = {
      discount: Target,
      loyalty: TrendingUp,
      promotion: Mail,
      birthday: Calendar,
      seasonal: Calendar
    };
    return icons[type] || Target;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Marketing Campaigns</h2>
          <p className="text-sm text-gray-400">Create and manage targeted marketing campaigns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Campaign Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>
                <div>
                  <Label>Campaign Type *</Label>
                  <Select 
                    value={formData.campaign_type} 
                    onValueChange={(value) => setFormData({...formData, campaign_type: value})}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="discount">Discount Offer</SelectItem>
                      <SelectItem value="loyalty">Loyalty Reward</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="birthday">Birthday Special</SelectItem>
                      <SelectItem value="seasonal">Seasonal Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select 
                    value={formData.discount_type} 
                    onValueChange={(value) => setFormData({...formData, discount_type: value})}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="percentage">Percentage Off</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                      <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>
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
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  Create Campaign
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Campaigns</p>
                <p className="text-2xl font-bold text-purple-400">{campaigns.length}</p>
              </div>
              <Target className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Campaigns</p>
                <p className="text-2xl font-bold text-green-400">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Reach</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {campaigns.reduce((sum, c) => sum + (c.reach_count || 0), 0)}
                </p>
              </div>
              <Mail className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-600/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-400">
                  {campaigns.reduce((sum, c) => sum + (c.conversion_count || 0), 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns.map((campaign) => {
              const campaignType = campaign.type || campaign.campaign_type || 'promotion';
              const Icon = getTypeIcon(campaignType);
              return (
                <div
                  key={campaign.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{campaign.name}</h3>
                          <Badge variant="outline" className={`border-${getStatusColor(campaign.status)}-500 text-${getStatusColor(campaign.status)}-400 text-xs`}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-gray-700">
                            {campaignType}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{campaign.description}</p>
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Start:</span>
                            <span className="ml-2 text-gray-300">
                              {format(new Date(campaign.start_date), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">End:</span>
                            <span className="ml-2 text-gray-300">
                              {format(new Date(campaign.end_date), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Reach:</span>
                            <span className="ml-2 text-cyan-400">{campaign.reach_count || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Conversions:</span>
                            <span className="ml-2 text-green-400">{campaign.conversion_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(campaign.discount_type && campaign.discount_type !== 'none') && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3">
                      <div className="text-xs text-purple-400 font-semibold mb-1">Offer Details:</div>
                      <div className="text-sm text-gray-300">
                        {campaign.discount_type === "percentage" && `${campaign.discount_value || 0}% off`}
                        {campaign.discount_type === "fixed_amount" && `$${campaign.discount_value || 0} off`}
                        {campaign.discount_type === "buy_x_get_y" && `Buy X Get Y`}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {campaigns.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No campaigns yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}