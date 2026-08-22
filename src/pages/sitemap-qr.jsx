import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ExternalLink, FileCode } from 'lucide-react';

const QR_ROUTES = [
  { path: '/SecureQRStudio', title: 'QR Studio - Main', priority: '1.0' },
  { path: '/SecureQRStudio?tab=create', title: 'QR Studio - Create', priority: '0.9' },
  { path: '/SecureQRStudio?tab=preview', title: 'QR Studio - Preview', priority: '0.8' },
  { path: '/SecureQRStudio?tab=customize', title: 'QR Studio - Customize', priority: '0.8' },
  { path: '/SecureQRStudio?tab=hotzones', title: 'QR Studio - Hot Zones', priority: '0.8' },
  { path: '/SecureQRStudio?tab=stego', title: 'QR Studio - Steganography', priority: '0.8' },
  { path: '/SecureQRStudio?tab=security', title: 'QR Studio - Security', priority: '0.9' },
  { path: '/SecureQRStudio?tab=analytics', title: 'QR Studio - Analytics', priority: '0.7' },
  { path: '/SecureQRStudio?tab=bulk', title: 'QR Studio - Bulk Upload', priority: '0.7' }
];

export default function SitemapQr() {
  const [xml, setXml] = useState('Loading...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await base44.functions.invoke('sitemapQr');
        setXml(response.data);
      } catch (error) {
        setXml('Error loading sitemap XML');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FileCode className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">QR Generator Sitemap</h1>
        </div>
        
        <p className="text-gray-400 mb-8">
          This sitemap lists all QR Generator pages for search engine indexing. 
          The XML version is served at <code className="text-cyan-300">/sitemap-qr.xml</code>
        </p>

        {/* Visual Route List */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">QR Generator Routes</h2>
          <div className="grid gap-2">
            {QR_ROUTES.map((route) => (
              <Link 
                key={route.path}
                to={route.path}
                className="flex items-center justify-between p-3 bg-gray-900/50 border border-cyan-500/20 rounded-lg hover:border-cyan-500/50 transition-colors group"
              >
                <div>
                  <span className="text-white font-medium">{route.title}</span>
                  <span className="text-gray-500 text-sm ml-2">{route.path}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Priority: {route.priority}</span>
                  <ExternalLink className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* XML Preview */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">XML Output</h2>
          <pre className="bg-gray-900 p-6 rounded-lg text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap border border-cyan-500/20 max-h-[400px] overflow-y-auto">
            {loading ? 'Loading sitemap XML...' : xml}
          </pre>
        </div>

        <div className="mt-6 flex gap-4">
          <a 
            href="https://app.base44.com/api/apps/697a087fb354faebb72df54b/sitemapQr" 
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Raw XML
          </a>
          <Link 
            to={createPageUrl("SecureQRStudio")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
          >
            Open QR Studio
          </Link>
        </div>
      </div>
    </div>
  );
}