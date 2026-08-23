import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { glyphlockWrite } from "@/lib/glyphlock/glyphlockWriteGateway";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, FileText, Image, Video, Mail, Award } from "lucide-react";

export default function MarketingCollateral({ partner }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['marketing-assets'],
    queryFn: async () => {
      return glyphlockWrite('marketing_asset_list', {
        intent: 'list_partner_tier_marketing_assets',
      });
    }
  });

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || asset.asset_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getAssetIcon = (type) => {
    const icons = {
      brochure: FileText,
      presentation: FileText,
      video: Video,
      banner: Image,
      logo: Image,
      case_study: FileText,
      whitepaper: FileText,
      email_template: Mail
    };
    return icons[type] || FileText;
  };

  const getTypeColor = (type) => {
    const colors = {
      brochure: 'bg-blue-500/20 text-blue-300',
      presentation: 'bg-purple-500/20 text-purple-300',
      video: 'bg-red-500/20 text-red-300',
      banner: 'bg-green-500/20 text-green-300',
      logo: 'bg-cyan-500/20 text-cyan-300',
      case_study: 'bg-yellow-500/20 text-yellow-300',
      whitepaper: 'bg-indigo-500/20 text-indigo-300',
      email_template: 'bg-pink-500/20 text-pink-300'
    };
    return colors[type] || colors.brochure;
  };

  const handleDownload = async (asset) => {
    try {
      const result = await glyphlockWrite('marketing_asset_download', {
        asset_id: asset.id,
        intent: 'partner_marketing_asset_download',
      });

      window.open(result.file_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center text-slate-400 py-12">Loading marketing materials...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glyph-glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            Marketing Collateral Library
          </CardTitle>
          <p className="text-sm text-slate-400 mt-2">
            Download co-branded materials, presentations, and resources to help promote GlyphLock services.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search marketing materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-glow-blue"
            />
          </div>
        </CardContent>
      </Card>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <Card className="glyph-glass-card">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">No marketing materials available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const Icon = getAssetIcon(asset.asset_type);
            return (
              <Card key={asset.id} className="glyph-glass-card card-elevated-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Icon className="w-8 h-8 text-blue-400" />
                    <Badge className={getTypeColor(asset.asset_type)}>
                      {asset.asset_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg mt-3">{asset.asset_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {asset.description && (
                    <p className="text-sm text-slate-400 mb-4">{asset.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>{asset.file_format?.toUpperCase()}</span>
                    {asset.file_size && (
                      <span>{(asset.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDownload(asset)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {asset.download_count > 0 && (
                    <div className="text-center text-xs text-slate-500 mt-2">
                      Downloaded {asset.download_count} times
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}