import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { glyphlockWrite } from "@/lib/glyphlock/glyphlockWriteGateway";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Lock, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";

export default function DocumentCenter({ partner }) {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['partner-documents', partner.id],
    queryFn: async () => {
      const [allDocs, accessRows] = await Promise.all([
        base44.entities.PartnerDocument.list(),
        base44.entities.PartnerDocumentAccess.filter({ partner_id: partner.id }).catch(() => []),
      ]);
      const accessByDocument = new Map((accessRows || []).map((row) => [row.document_id, row]));
      return allDocs
        .filter((doc) => !doc.partner_id || doc.partner_id === partner.id)
        .map((doc) => ({
          ...doc,
          viewed: accessByDocument.get(doc.id)?.viewed === true,
          viewed_date: accessByDocument.get(doc.id)?.viewed_at || null,
        }));
    }
  });

  const markAsViewedMutation = useMutation({
    mutationFn: ({ docId, accessAction }) => glyphlockWrite('partner_document_access', {
      document_id: docId,
      access_action: accessAction,
      intent: `partner_document_${accessAction}`,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['partner-documents']);
    }
  });

  const handleView = async (doc) => {
    const result = await markAsViewedMutation.mutateAsync({ docId: doc.id, accessAction: 'view' });
    window.open(result.file_url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (doc) => {
    try {
      const result = await markAsViewedMutation.mutateAsync({ docId: doc.id, accessAction: 'download' });
      const link = document.createElement('a');
      link.href = result.file_url;
      link.download = doc.document_name;
      link.click();
      toast.success('Document downloaded');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const getDocTypeColor = (type) => {
    const colors = {
      agreement: 'bg-red-500/20 text-red-300 border-red-500/50',
      co_branded_material: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      program_update: 'bg-green-500/20 text-green-300 border-green-500/50',
      training: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      certification: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      invoice: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      report: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
    };
    return colors[type] || colors.agreement;
  };

  if (isLoading) {
    return <div className="text-center text-slate-400 py-12">Loading documents...</div>;
  }

  const pendingSignatures = documents.filter(d => d.requires_signature && !d.signed);
  const regularDocuments = documents.filter(d => !d.requires_signature || d.signed);

  return (
    <div className="space-y-6">
      {/* Pending Signatures Alert */}
      {pendingSignatures.length > 0 && (
        <Card className="glyph-glass-card border-2 border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
              Action Required: {pendingSignatures.length} Document(s) Need Signature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSignatures.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="font-semibold text-white">{doc.document_name}</div>
                    <div className="text-sm text-slate-400">{doc.description}</div>
                  </div>
                </div>
                <Button
                  onClick={() => handleView(doc)}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Review & Sign
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Document Library */}
      <Card className="glyph-glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-400" />
            Secure Document Center
          </CardTitle>
          <p className="text-sm text-slate-400 mt-2">
            Access agreements, co-branded materials, program updates, and partner resources.
          </p>
        </CardHeader>
        <CardContent>
          {regularDocuments.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              No documents available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {regularDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="w-6 h-6 text-blue-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{doc.document_name}</span>
                        <Badge className={`${getDocTypeColor(doc.document_type)} border text-xs`}>
                          {doc.document_type.replace('_', ' ')}
                        </Badge>
                        {doc.is_confidential && (
                          <Badge className="bg-red-500/20 text-red-300 border border-red-500/50 text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Confidential
                          </Badge>
                        )}
                        {doc.signed && (
                          <Badge className="bg-green-500/20 text-green-300 border border-green-500/50 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Signed
                          </Badge>
                        )}
                        {!doc.viewed && (
                          <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/50 text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      {doc.description && (
                        <div className="text-sm text-slate-400">{doc.description}</div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>v{doc.version}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_date).toLocaleDateString()}</span>
                        {doc.expiry_date && (
                          <>
                            <span>•</span>
                            <span>Expires: {new Date(doc.expiry_date).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(doc)}
                      className="border-blue-500/50 text-blue-300 hover:bg-blue-500/20"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}