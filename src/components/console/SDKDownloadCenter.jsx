import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Download, Copy, Check, Code, Terminal, FileCode2, 
  Book, ExternalLink, Github, Package, Zap, Shield,
  Key, QrCode, BarChart3, Lock
} from "lucide-react";
import { JAVASCRIPT_SDK, PYTHON_SDK, GO_SDK, SDK_DOCS } from "@/components/sdk/SDKFiles";

// GitHub repository URLs for each SDK
const GITHUB_REPOS = {
  javascript: "https://github.com/carloearl/glyphlock",
  python: "https://github.com/carloearl/glyphlock",
  go: "https://github.com/carloearl/glyphlock"
};

// Language icons component
function LanguageIcon({ lang, className = "w-6 h-6" }) {
  const icons = {
    javascript: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>
      </svg>
    ),
    python: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
      </svg>
    ),
    go: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.07zm2.828 1.075c-.047 0-.059-.035-.035-.07l.163-.292c.023-.035.07-.07.117-.07h2.337c.047 0 .07.035.07.082l-.023.28c0 .047-.047.082-.082.082zm12.129-2.36c-.736.187-1.239.327-1.963.514-.176.046-.187.058-.34-.117-.174-.199-.303-.327-.548-.444-.737-.362-1.45-.257-2.115.175-.795.514-1.204 1.274-1.192 2.22.011.935.654 1.706 1.577 1.835.795.105 1.46-.175 1.987-.77.105-.13.198-.27.315-.434H10.47c-.245 0-.304-.152-.222-.35.152-.362.432-.97.596-1.274a.315.315 0 01.292-.187h4.253c-.023.316-.023.631-.07.947a4.983 4.983 0 01-.958 2.29c-.841 1.11-1.94 1.8-3.33 1.986-1.145.152-2.209-.07-3.143-.77-.865-.655-1.356-1.52-1.484-2.595-.152-1.274.222-2.419.993-3.424.83-1.086 1.928-1.776 3.272-2.02 1.098-.2 2.15-.07 3.096.571.62.41 1.063.97 1.356 1.648.07.105.023.164-.117.2m3.868 6.461c-1.064-.024-2.034-.328-2.852-1.029a3.665 3.665 0 01-1.262-2.255c-.21-1.32.152-2.489.947-3.529.853-1.122 1.881-1.706 3.272-1.95 1.192-.21 2.314-.095 3.33.595.923.63 1.496 1.484 1.648 2.605.198 1.578-.257 2.863-1.344 3.962-.771.783-1.718 1.273-2.805 1.495-.315.06-.63.07-.934.106zm2.78-4.72c-.011-.153-.011-.27-.034-.387-.21-1.157-1.274-1.81-2.384-1.554-1.087.245-1.788.935-2.045 2.033-.21.912.234 1.835 1.075 2.21.643.28 1.285.244 1.905-.07.923-.48 1.425-1.228 1.484-2.233z"/>
      </svg>
    )
  };
  return icons[lang] || <Code className={className} />;
}

export default function SDKDownloadCenter() {
  const [activeSDK, setActiveSDK] = useState("javascript");
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadSDK = (language) => {
    let content, filename, mimeType;
    
    switch (language) {
      case 'javascript':
        content = JAVASCRIPT_SDK;
        filename = 'glyphlock-sdk.js';
        mimeType = 'application/javascript';
        break;
      case 'python':
        content = PYTHON_SDK;
        filename = 'glyphlock.py';
        mimeType = 'text/x-python';
        break;
      case 'go':
        content = GO_SDK;
        filename = 'glyphlock.go';
        mimeType = 'text/x-go';
        break;
      default:
        return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${SDK_DOCS[language].name} SDK downloaded`);
  };

  const sdkFeatures = [
    { icon: Key, label: "Key Management", desc: "Create, rotate, and revoke API keys" },
    { icon: QrCode, label: "QR Operations", desc: "Generate, scan, and verify QR codes" },
    { icon: Shield, label: "Security Tools", desc: "Hash, encrypt, decrypt, and audit" },
    { icon: BarChart3, label: "Analytics", desc: "Usage metrics and security events" },
    { icon: Zap, label: "Auto Retry", desc: "Built-in retry with exponential backoff" },
    { icon: Lock, label: "Error Handling", desc: "Comprehensive error types and handling" }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">SDK Download Center</h1>
          <p className="text-white/70">Official client libraries for the GlyphLock Security API</p>
        </div>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
          v1.0.0 Stable
        </Badge>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {sdkFeatures.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <Card key={idx} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4 text-center">
                <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">{feature.label}</p>
                <p className="text-slate-500 text-xs mt-1">{feature.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SDK Tabs */}
      <Tabs value={activeSDK} onValueChange={setActiveSDK}>
        <TabsList className="bg-slate-900 border border-slate-800 p-1">
          {Object.entries(SDK_DOCS).map(([key, sdk]) => (
            <TabsTrigger 
              key={key} 
              value={key}
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 gap-2"
            >
              <LanguageIcon lang={key} className="w-4 h-4" />
              {sdk.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(SDK_DOCS).map(([key, sdk]) => (
          <TabsContent key={key} value={key} className="space-y-6 mt-6">
            {/* Installation & Download */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-cyan-400" />
                    Installation
                  </CardTitle>
                  <CardDescription>Install via package manager</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-slate-950 p-4 rounded-lg text-sm overflow-x-auto">
                      <code className="text-cyan-400">{sdk.installation}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(sdk.installation, `install-${key}`)}
                    >
                      {copiedCode === `install-${key}` ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button 
                      onClick={() => downloadSDK(key)}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download SDK
                    </Button>
                    <a href={GITHUB_REPOS[key]} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="border-slate-700">
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Features
                  </CardTitle>
                  <CardDescription>SDK capabilities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {sdk.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-400" />
                  Quick Start
                </CardTitle>
                <CardDescription>Get started in under 5 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                    <code className="text-slate-300 whitespace-pre">{sdk.quickstart}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(sdk.quickstart, `quickstart-${key}`)}
                  >
                    {copiedCode === `quickstart-${key}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Full SDK Source */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileCode2 className="w-5 h-5 text-blue-400" />
                      Full SDK Source
                    </CardTitle>
                    <CardDescription>Complete SDK implementation</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(
                        key === 'javascript' ? JAVASCRIPT_SDK : key === 'python' ? PYTHON_SDK : GO_SDK,
                        `full-${key}`
                      )}
                    >
                      {copiedCode === `full-${key}` ? (
                        <Check className="w-4 h-4 mr-2 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy All
                    </Button>
                    <Button size="sm" onClick={() => downloadSDK(key)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-lg text-xs overflow-auto max-h-[500px] scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
                    <code className="text-slate-400 whitespace-pre">
                      {key === 'javascript' ? JAVASCRIPT_SDK : key === 'python' ? PYTHON_SDK : GO_SDK}
                    </code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* API Reference Link */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Book className="w-10 h-10 text-cyan-400" />
            <div>
              <h3 className="text-white font-bold text-lg">API Reference Documentation</h3>
              <p className="text-slate-400">Complete API documentation with examples and schemas</p>
            </div>
          </div>
          <Link to={createPageUrl('SDKDocs')}>
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              View API Docs
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Get API Key CTA */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Key className="w-10 h-10 text-purple-400" />
            <div>
              <h3 className="text-white font-bold text-lg">Ready to Build?</h3>
              <p className="text-slate-400">Get your API key from the Command Center and start integrating</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('CommandCenter')}>
              <Button className="bg-purple-500 hover:bg-purple-600">
                <Key className="w-4 h-4 mr-2" />
                Get API Key
              </Button>
            </Link>
            <Link to={createPageUrl('SDKDocs')}>
              <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                Full API Reference
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}