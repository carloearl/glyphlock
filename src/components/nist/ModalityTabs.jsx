/**
 * Modality Tabs Component
 * Text, Image, and Code discriminator details
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

const MODALITIES = {
  text: {
    id: 'text',
    title: 'Text Discriminator',
    subtitle: 'Detecting AI-Generated Text & Believability',
    description: 'Given a text narrative, determine: (1) Likelihood of AI generation (0-1 score), (2) Believability to general public (0-1 score)',
    approach: [
      {
        title: 'Standard ML Detection',
        details: [
          'Transformer-based linguistic analysis (Gemma 2B)',
          'Pattern recognition in writing style',
          'Semantic coherence evaluation',
          'Context-aware classification'
        ]
      },
      {
        title: 'Master Covenant Compliance',
        details: [
          '71-clause legal framework (IP filing details under verification)',
          'Accountability verification markers',
          'Attribution requirement checking',
          'Factual accuracy standards'
        ],
        highlight: true
      },
      {
        title: 'Dual-Layer Detection',
        details: [
          'Technical accuracy + Legal compliance',
          'First hybrid approach in competition',
          'Explainable AI with covenant tracing'
        ]
      }
    ],
    techStack: [
      { label: 'Base Model', value: 'Google Gemma 2B' },
      { label: 'Fine-Tuning', value: 'LoRA (Low-Rank Adaptation)' },
      { label: 'Training', value: 'Kaggle GPU (competition-proven)' },
      { label: 'Optimization', value: 'Mixed precision, gradient checkpointing' }
    ],
    metrics: [
      { name: 'AUC-ROC', target: '≥0.85' },
      { name: 'Brier Score', target: '≤0.15' },
      { name: 'Believability r', target: '≥0.75' }
    ]
  },
  image: {
    id: 'image',
    title: 'Image Discriminator',
    subtitle: 'Visual Forensics + Provenance Verification',
    description: 'Detect AI-generated images (DALL-E, Midjourney, Stable Diffusion, etc.) using multi-layer forensic analysis',
    approach: [
      {
        title: 'Visual Forensics',
        details: [
          'CNN-based artifact detection',
          'Frequency domain analysis (DCT/DFT)',
          'GAN fingerprint recognition',
          'EXIF metadata verification'
        ]
      },
      {
        title: 'Covenant Provenance Check',
        details: [
          'C2PA manifest verification',
          'Blockchain attribution lookup',
          'Digital signature validation',
          'Timestamp consistency analysis'
        ],
        highlight: true
      },
      {
        title: 'Legal-Aware Detection',
        details: [
          'First provenance + ML hybrid',
          'Attribution compliance scoring',
          'Accountability tracing'
        ]
      }
    ],
    techStack: [
      { label: 'Base Model', value: 'Vision Transformer (ViT)' },
      { label: 'Fine-Tuning', value: 'LoRA for image classification' },
      { label: 'Training Data', value: 'Multi-generator datasets' },
      { label: 'Forensics', value: 'Frequency analysis + metadata' }
    ],
    metrics: [
      { name: 'AUC-ROC', target: '≥0.90' },
      { name: 'Precision', target: '≥0.85' },
      { name: 'Recall', target: '≥0.80' }
    ]
  },
  code: {
    id: 'code',
    title: 'Code Generator',
    subtitle: 'Covenant-Bound Test Generation',
    description: 'Generate comprehensive pytest unit tests for Python code with contractual quality guarantees',
    approach: [
      {
        title: 'Standard Code Generators',
        details: [
          'Generate basic tests',
          'Achieve minimal coverage'
        ]
      },
      {
        title: 'GlyphLock Covenant-Bound',
        details: [
          'Comprehensive coverage (≥90% requirement)',
          'Security verification (contractual)',
          'Documentation completeness (legal)',
          'Traceable accountability (UNIQUE)'
        ],
        highlight: true
      },
      {
        title: 'Key Differentiator',
        details: [
          'AI contractually bound to quality standards',
          'Security-verified code patterns',
          'No malicious code generation',
          'Addresses accountability gap'
        ]
      }
    ],
    techStack: [
      { label: 'Approach', value: 'Custom prompt engineering' },
      { label: 'Framework', value: 'Master Covenant integration' },
      { label: 'Models', value: 'GPT-4, Claude, Gemma ensemble' },
      { label: 'Verification', value: 'Coverage + security analysis' }
    ],
    metrics: [
      { name: 'Coverage', target: '≥80%' },
      { name: 'False Positive', target: '≤5%' },
      { name: 'Quality Rank', target: 'Top 25%' }
    ]
  }
};

export default function ModalityTabs() {
  const [activeTab, setActiveTab] = useState('text');

  return (
    <section id="technical" className="py-16 bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
          Technical Approach by Modality
        </h2>
        <p className="text-lg md:text-xl text-gray-700 text-center mb-12 max-w-3xl mx-auto">
          Three distinct systems, one unified Master Covenant framework
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100 border-2 border-gray-300 p-1">
            <TabsTrigger value="text" className="text-sm md:text-lg py-2 md:py-3 font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-900 hover:bg-gray-200">
              📝 Text
            </TabsTrigger>
            <TabsTrigger value="image" className="text-sm md:text-lg py-2 md:py-3 font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-900 hover:bg-gray-200">
              🖼️ Image
            </TabsTrigger>
            <TabsTrigger value="code" className="text-sm md:text-lg py-2 md:py-3 font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-900 hover:bg-gray-200">
              💻 Code
            </TabsTrigger>
          </TabsList>

          {Object.entries(MODALITIES).map(([key, content]) => (
            <TabsContent key={key} value={key}>
              <ModalityCard content={content} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

function ModalityCard({ content }) {
  return (
    <Card className="p-4 md:p-8 shadow-lg border-2 border-gray-200 bg-white">
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl mb-2 text-gray-900">{content.title}</CardTitle>
        <CardDescription className="text-base md:text-lg text-gray-700">{content.subtitle}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Task Description */}
        <div className="bg-blue-50 p-4 md:p-6 rounded-lg border-l-4 border-blue-600">
          <h3 className="font-semibold text-base md:text-lg mb-2 text-gray-900">Challenge Task:</h3>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">{content.description}</p>
        </div>

        {/* Approach Details */}
        <div>
          <h3 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900">GlyphLock's Approach</h3>
          <div className="space-y-4">
            {content.approach.map((section, idx) => (
              <div key={idx} className={`p-4 md:p-6 rounded-lg border-2 ${section.highlight ? 'bg-amber-50 border-amber-500 shadow-[0_0_10px_rgba(90,0,200,0.15)]' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className="font-semibold text-base md:text-lg mb-3 flex items-center gap-2 flex-wrap text-gray-900">
                  {section.highlight && <Star className="w-5 h-5 text-amber-600 fill-amber-600" />}
                  {section.title}
                  {section.highlight && <span className="text-sm text-amber-700 font-bold ml-2">(UNIQUE)</span>}
                </h4>
                <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-800 leading-relaxed">
                  {section.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900">Technical Stack</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.techStack.map((tech) => (
              <div key={tech.label} className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <div className="text-sm text-gray-600 mb-1 font-medium">{tech.label}</div>
                <div className="font-semibold text-gray-900 text-sm md:text-base">{tech.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Target Metrics */}
        <div>
          <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900">Target Performance</h3>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {content.metrics.map((metric) => (
              <div key={metric.name} className="text-center p-3 md:p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border-2 border-blue-400 shadow-sm">
                <div className="text-2xl md:text-3xl font-bold text-blue-800 mb-2">{metric.target}</div>
                <div className="text-xs md:text-sm text-gray-900 font-bold">{metric.name}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-gray-200">
        <Button className="flex-1 bg-blue-700 text-white hover:bg-blue-800 font-semibold">
          View Code Sample
        </Button>
        <Button className="flex-1 bg-gray-700 text-white hover:bg-gray-800 font-semibold">
          Technical Documentation
        </Button>
      </CardFooter>
    </Card>
  );
}