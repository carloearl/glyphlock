/**
 * Covenant Diagram Component
 * Visual comparison: Traditional AI vs GlyphLock Master Covenant
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Scale, FileCheck } from 'lucide-react';

export default function CovenantDiagram() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              What Makes GlyphLock Different?
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
              The Master Covenant: 71-clause internal governance and drafting framework for AI accountability
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Traditional Approach */}
            <Card className="border-2 border-gray-300">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Traditional AI Detection
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <ProcessStep number="1" text="Input data received" />
                  <ArrowRight className="w-5 h-5 text-gray-400 mx-auto" />
                  <ProcessStep number="2" text="Statistical pattern analysis" />
                  <ArrowRight className="w-5 h-5 text-gray-400 mx-auto" />
                  <ProcessStep number="3" text="Binary classification output" />
                  <ArrowRight className="w-5 h-5 text-gray-400 mx-auto" />
                  <ProcessStep number="4" text="No accountability trail" gray />
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-red-500">✗</span> No legal framework
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-red-500">✗</span> Limited explainability
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-red-500">✗</span> No attribution tracking
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* GlyphLock Approach */}
            <Card className="border-2 border-blue-600 shadow-lg relative overflow-hidden">
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-amber-500 text-gray-900 font-bold px-3 py-1 text-xs">UNIQUE</Badge>
              </div>
              <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50 pb-6">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Shield className="w-6 h-6 text-blue-600" />
                  GlyphLock Master Covenant
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <ProcessStep number="1" text="Input data received" blue />
                  <ArrowRight className="w-5 h-5 text-blue-400 mx-auto" />
                  <ProcessStep number="2" text="Statistical pattern analysis" blue />
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-400" />
                    <Badge variant="outline" className="text-xs">Parallel Processing</Badge>
                    <ArrowRight className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <ProcessStep number="3a" text="Legal compliance check" blue small />
                    <ProcessStep number="3b" text="Covenant verification" blue small />
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-400 mx-auto" />
                  <ProcessStep number="4" text="Dual-layer output + audit trail" blue />
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    71-clause legal framework
                  </p>
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-green-500" />
                    IP methodology documented; filing details under verification
                  </p>
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-green-500" />
                    Full accountability tracing
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Benefits */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BenefitCard
              icon="📋"
              title="Governance Controls"
              description="AI-system outputs evaluated against defined internal standards"
            />
            <BenefitCard
              icon="🔍"
              title="Explainable AI"
              description="Every decision traces to specific covenant clause"
            />
            <BenefitCard
              icon="⚖️"
              title="Legal Framework"
              description="IP filing details under verification"
            />
            <BenefitCard
              icon="🛡️"
              title="Enterprise Ready"
              description="Evidence packages designed for external evaluation and diligence"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessStep({ number, text, gray, blue, small }) {
  const bgColor = gray ? 'bg-gray-100' : blue ? 'bg-blue-50' : 'bg-white';
  const borderColor = gray ? 'border-gray-300' : blue ? 'border-blue-400' : 'border-gray-300';
  const textSize = small ? 'text-xs md:text-sm' : 'text-sm md:text-base';
  
  return (
    <div className={`p-3 md:p-4 rounded-lg border-2 ${borderColor} ${bgColor}`}>
      <div className="flex items-center gap-3">
        <span className={`font-bold text-base md:text-lg ${blue ? 'text-blue-700' : 'text-gray-700'}`}>
          {number}
        </span>
        <span className={`${textSize} font-medium text-gray-800`}>{text}</span>
      </div>
    </div>
  );
}

function BenefitCard({ icon, title, description }) {
  return (
    <div className="p-4 md:p-6 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 shadow-sm">
      <div className="text-3xl mb-3" aria-hidden="true">{icon}</div>
      <h4 className="font-bold text-gray-900 mb-2 text-sm md:text-base">{title}</h4>
      <p className="text-xs md:text-sm text-gray-800 leading-relaxed">{description}</p>
    </div>
  );
}