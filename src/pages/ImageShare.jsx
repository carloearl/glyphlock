import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import InteractiveImageViewer from '@/components/glyphlock/InteractiveImageViewer';

export default function ImageShare() {
  const { assetId } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch asset for OG tags injection
    (async () => {
      try {
        const assets = await base44.entities.InteractiveImage.filter({ asset_id: assetId });
        if (assets.length > 0) {
          const assetData = assets[0];
          setAsset(assetData);

          // Inject OG meta tags into document head
          const head = document.head;
          const ogImageTag = document.createElement('meta');
          ogImageTag.setAttribute('property', 'og:image');
          ogImageTag.setAttribute('content', assetData.image_url);
          head.appendChild(ogImageTag);

          const ogTitleTag = document.createElement('meta');
          ogTitleTag.setAttribute('property', 'og:title');
          ogTitleTag.setAttribute('content', 'GlyphLock Smart Image');
          head.appendChild(ogTitleTag);

          const ogDescriptionTag = document.createElement('meta');
          ogDescriptionTag.setAttribute('property', 'og:description');
          ogDescriptionTag.setAttribute('content', 'Interactive image powered by GlyphLock');
          head.appendChild(ogDescriptionTag);

          const ogTypeTag = document.createElement('meta');
          ogTypeTag.setAttribute('property', 'og:type');
          ogTypeTag.setAttribute('content', 'website');
          head.appendChild(ogTypeTag);

          // Set document title
          document.title = 'GlyphLock Smart Image';
        }
      } catch (err) {
        console.error('OG tag injection error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [assetId]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-cyan-400">Loading...</div>
      </div>
    );
  }

  return <InteractiveImageViewer assetId={assetId} />;
}