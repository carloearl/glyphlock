/**
 * Technical Credentials Component
 * Badges and credibility markers
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Award, Shield, Code, Database } from 'lucide-react';

export default function TechnicalCredentials() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Technical Credentials</h2>
            <p className="text-lg text-gray-700">Battle-tested technology, federally validated</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <CredentialCard
              icon={<Shield className="w-8 h-8 text-blue-600" />}
              title="NIST Participant"
              subtitle="GenAI Challenge 2026"
              badge="Federal"
            />
            <CredentialCard
              icon={<Award className="w-8 h-8 text-purple-600" />}
              title="USPTO Patent"
              subtitle="Filing details under verification"
              badge="Pending"
            />
            <CredentialCard
              icon={<Code className="w-8 h-8 text-green-600" />}
              title="Kaggle Proven"
              subtitle="Competition-tested ML"
              badge="Validated"
            />
            <CredentialCard
              icon={<Database className="w-8 h-8 text-cyan-600" />}
              title="LoRA Fine-Tuning"
              subtitle="Gemma 2B base model"
              badge="Optimized"
            />
          </div>

          {/* Tech Stack Showcase */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-center">Technology Stack</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <TechBadge name="Python" icon="🐍" />
              <TechBadge name="PyTorch" icon="🔥" />
              <TechBadge name="Transformers" icon="🤖" />
              <TechBadge name="LoRA" icon="⚡" />
              <TechBadge name="Kaggle" icon="📊" />
              <TechBadge name="C2PA" icon="🔐" />
            </div>
          </div>

          {/* Model Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <ModelCard
              title="Text Discriminator"
              model="Google Gemma 2B"
              params="2 billion parameters"
              approach="LoRA fine-tuning"
              color="blue"
            />
            <ModelCard
              title="Image Discriminator"
              model="Vision Transformer"
              params="Custom architecture"
              approach="Forensics + ViT"
              color="purple"
            />
            <ModelCard
              title="Code Generator"
              model="Ensemble (GPT-4/Claude)"
              params="Prompt engineering"
              approach="Covenant-bound"
              color="green"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CredentialCard({ icon, title, subtitle, badge }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-300 hover:border-blue-500 hover:shadow-lg transition-all">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3" aria-hidden="true">{icon}</div>
        <h3 className="font-bold text-base md:text-lg text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-700 mb-3">{subtitle}</p>
        <Badge className="bg-blue-600 text-white font-semibold px-3 py-1">{badge}</Badge>
      </div>
    </div>
  );
}

function TechBadge({ name, icon }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-gray-50 border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-400 transition-all">
      <span className="text-2xl mb-2" aria-hidden="true">{icon}</span>
      <span className="text-xs font-bold text-gray-800">{name}</span>
    </div>
  );
}

function ModelCard({ title, model, params, approach, color }) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-400',
    purple: 'from-purple-50 to-purple-100 border-purple-400',
    green: 'from-green-50 to-green-100 border-green-400'
  };

  return (
    <div className={`p-6 rounded-lg bg-gradient-to-br ${colorClasses[color]} border-2 shadow-sm`}>
      <h4 className="font-bold text-base md:text-lg text-gray-900 mb-4">{title}</h4>
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-gray-700 font-medium">Model:</span>
          <p className="font-bold text-gray-900 mt-1">{model}</p>
        </div>
        <div>
          <span className="text-gray-700 font-medium">Scale:</span>
          <p className="font-bold text-gray-900 mt-1">{params}</p>
        </div>
        <div>
          <span className="text-gray-700 font-medium">Approach:</span>
          <p className="font-bold text-gray-900 mt-1">{approach}</p>
        </div>
      </div>
    </div>
  );
}