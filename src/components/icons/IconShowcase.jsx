import React from 'react';
import { GlyphIcon, IconButton, IconBadge, FeatureCard } from './GlyphIcons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Showcase component demonstrating GlyphLock custom icon usage
 * Use this as reference for implementing icons across the platform
 */
export default function IconShowcase() {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      
      {/* Basic Icons */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Basic Icons</h2>
        <div className="flex flex-wrap gap-6 items-center">
          <GlyphIcon type="delete" size={32} />
          <GlyphIcon type="attachment" size={32} glow />
          <GlyphIcon type="upload" size={40} glow animate />
          <GlyphIcon type="blockchain" size={48} glow />
          <GlyphIcon type="launch" size={40} glow animate />
          <GlyphIcon type="download" size={32} glow />
        </div>
      </section>

      {/* Icon Buttons */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Icon Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <IconButton 
            type="delete" 
            variant="danger" 
            title="Delete item"
            onClick={() => alert('Delete clicked')}
          />
          <IconButton 
            type="upload" 
            variant="primary" 
            title="Upload file"
            onClick={() => alert('Upload clicked')}
          />
          <IconButton 
            type="launch" 
            variant="success" 
            title="Launch"
            onClick={() => alert('Launch clicked')}
          />
          <IconButton 
            type="download" 
            variant="default" 
            title="Download"
            onClick={() => alert('Download clicked')}
          />
        </div>
      </section>

      {/* Icon Badges */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Icon Badges</h2>
        <div className="flex flex-wrap gap-4">
          <IconBadge type="blockchain" label="Blockchain Verified" />
          <IconBadge type="launch" label="Deploy Ready" />
          <IconBadge type="attachment" label="2 Attachments" />
        </div>
      </section>

      {/* Feature Cards */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Feature Cards</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon="upload"
            title="Upload Assets"
            description="Securely upload and manage your files with enterprise-grade encryption."
            action={
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-purple-600">
                Upload Now
              </Button>
            }
          />
          <FeatureCard
            icon="blockchain"
            title="Blockchain Proof"
            description="Traceable verification using hashes, timestamps, and recorded provenance context."
            action={
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                Verify
              </Button>
            }
          />
          <FeatureCard
            icon="launch"
            title="Deploy System"
            description="Launch your security infrastructure with one click."
            action={
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600">
                Deploy
              </Button>
            }
          />
        </div>
      </section>

      {/* Usage Examples */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Real-World Usage</h2>
        <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Implementation Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/30">
              <p className="text-sm text-cyan-300 font-mono mb-2">Delete Action:</p>
              <code className="text-xs text-slate-300">
                {`<IconButton type="delete" variant="danger" onClick={handleDelete} />`}
              </code>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/30">
              <p className="text-sm text-purple-300 font-mono mb-2">Upload Zone:</p>
              <code className="text-xs text-slate-300">
                {`<GlyphIcon type="upload" size={64} glow animate />`}
              </code>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30">
              <p className="text-sm text-emerald-300 font-mono mb-2">Launch Button:</p>
              <code className="text-xs text-slate-300">
                {`<Button><GlyphIcon type="launch" size={28} glow /> Deploy</Button>`}
              </code>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}