import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Mail, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareUrlPanel({ shareUrl, imageAsset }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = (platform) => {
    const title = imageAsset?.name || 'Interactive Image';
    const text = `Check out this interactive image: ${title}`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);

    const urls = {
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`,
    };

    window.open(urls[platform], '_blank', platform !== 'email' ? 'width=600,height=500' : undefined);
  };

  return (
    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <ExternalLink className="w-4 h-4 text-green-400" />
        <p className="text-sm text-green-400 font-bold">Share Link Ready</p>
      </div>

      {/* URL + Copy */}
      <div className="flex gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 px-3 py-2 bg-black/60 border border-green-500/30 rounded-lg text-xs text-white font-mono truncate"
        />
        <Button
          size="sm"
          onClick={copyToClipboard}
          className={`min-w-[70px] transition-all ${copied ? 'bg-green-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
        >
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copied ? 'Done' : 'Copy'}
        </Button>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <Button size="sm" onClick={() => shareVia('email')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9">
          <Mail className="w-3 h-3 mr-1" /> Email
        </Button>
        <Button size="sm" onClick={() => shareVia('twitter')} className="bg-sky-600 hover:bg-sky-700 text-white text-xs h-9">
          𝕏 Tweet
        </Button>
        <Button size="sm" onClick={() => shareVia('linkedin')} className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-9">
          in LinkedIn
        </Button>
        <Button size="sm" onClick={() => shareVia('whatsapp')} className="bg-green-600 hover:bg-green-700 text-white text-xs h-9">
          💬 WhatsApp
        </Button>
      </div>

      {/* Open Preview */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => window.open(shareUrl, '_blank')}
        className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs"
      >
        <ExternalLink className="w-3 h-3 mr-1" /> Open Share Preview
      </Button>

      <p className="text-[10px] text-white/30 text-center">Anyone with the link can view hotspots on all devices</p>
    </div>
  );
}