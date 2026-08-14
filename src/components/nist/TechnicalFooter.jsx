/**
 * NIST Technical Footer - Federal Documentation Style
 * Replaces generic CTA with technical resources
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Mail, Github, CheckCircle, Clock } from 'lucide-react';

export default function TechnicalFooter() {
  return (
    <section className="py-16 bg-gradient-to-br from-[#0a1324] via-[#1a244b] to-[#1e293b]">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* NIST Validation Status */}
          <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="w-6 h-6 text-blue-400" />
                NIST Evaluation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-800/20 rounded-lg border border-blue-700/40">
                  <div className="text-sm text-blue-300 font-medium mb-2">Submission Tracking</div>
                  <div className="text-2xl font-bold text-white mb-1">NIST-2026-AI</div>
                  <Badge className="bg-green-600 text-white">Active</Badge>
                </div>
                <div className="text-center p-4 bg-blue-800/20 rounded-lg border border-blue-700/40">
                  <div className="text-sm text-blue-300 font-medium mb-2">Evaluation Phase</div>
                  <div className="text-2xl font-bold text-white mb-1">Pre-Submission</div>
                  <Badge className="bg-blue-600 text-white">In Progress</Badge>
                </div>
                <div className="text-center p-4 bg-blue-800/20 rounded-lg border border-blue-700/40">
                  <div className="text-sm text-blue-300 font-medium mb-2">Next Milestone</div>
                  <div className="text-2xl font-bold text-white mb-1">Jan 28, 2026</div>
                  <Badge className="bg-amber-600 text-white">Dry Run</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Documentation */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-lg">Technical Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-blue-600 text-blue-200 hover:bg-blue-900/30"
                >
                  <Github className="w-4 h-4 mr-2" />
                  View GitHub Repository
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-blue-600 text-blue-200 hover:bg-blue-900/30"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Technical Whitepaper
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-blue-600 text-blue-200 hover:bg-blue-900/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Implementation Guide
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-lg">Partnership Inquiries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl('MasterCovenant')} className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    <FileText className="w-4 h-4 mr-2" />
                    Full Technical Specification
                  </Button>
                </Link>
                <Link to={createPageUrl('Consultation')} className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact for Partnership
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Standards Compliance */}
          <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Standards Compliance Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <ComplianceItem checked label="NIST AI Risk Management Framework (AI RMF)" />
                <ComplianceItem checked label="IEEE P7001 Transparency Standards" />
                <ComplianceItem checked label="ISO/IEC 23894 AI Risk Management" />
                <ComplianceItem checked label="IP Documentation (filing details under verification)" />
                <ComplianceItem checked label="WCAG 2.1 AA Accessibility" />
                <ComplianceItem pending label="Final NIST Evaluation (Pending)" />
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="text-center pt-6 border-t border-blue-700/40">
            <p className="text-blue-200 text-sm mb-2">
              Validated by NIST • Patent-Pending Technology • Enterprise Ready
            </p>
            <div className="flex justify-center gap-6 flex-wrap text-sm">
              <Link to={createPageUrl('About')} className="text-blue-300 hover:text-blue-200 transition-colors">
                About GlyphLock
              </Link>
              <Link to={createPageUrl('MasterCovenant')} className="text-blue-300 hover:text-blue-200 transition-colors">
                Master Covenant Spec
              </Link>
              <Link to={createPageUrl('CaseStudies')} className="text-blue-300 hover:text-blue-200 transition-colors">
                Case Studies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComplianceItem({ checked, pending, label }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-blue-800/20 rounded-lg">
      {checked && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
      {pending && <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />}
      <span className="text-blue-100 text-sm">{label}</span>
    </div>
  );
}