import React, { useState } from 'react';
import { ArrowRightLeft, Copy, Check, Code, Binary, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const ENCODINGS = [
  { id: 'base64', name: 'Base64', color: 'cyan' },
  { id: 'hex', name: 'Hexadecimal', color: 'purple' },
  { id: 'url', name: 'URL Encode', color: 'emerald' },
  { id: 'html', name: 'HTML Entities', color: 'amber' },
  { id: 'binary', name: 'Binary', color: 'rose' },
  { id: 'ascii', name: 'ASCII Codes', color: 'blue' },
];

const encode = (text, type) => {
  try {
    switch (type) {
      case 'base64':
        return btoa(unescape(encodeURIComponent(text)));
      case 'hex':
        return Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      case 'url':
        return encodeURIComponent(text);
      case 'html':
        return text.replace(/[&<>"']/g, char => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char]));
      case 'binary':
        return Array.from(text).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      case 'ascii':
        return Array.from(text).map(c => c.charCodeAt(0)).join(' ');
      default:
        return text;
    }
  } catch (e) {
    return 'Error: ' + e.message;
  }
};

const decode = (text, type) => {
  try {
    switch (type) {
      case 'base64':
        return decodeURIComponent(escape(atob(text)));
      case 'hex':
        return text.match(/.{1,2}/g)?.map(h => String.fromCharCode(parseInt(h, 16))).join('') || '';
      case 'url':
        return decodeURIComponent(text);
      case 'html': {
        const txt = document.createElement('textarea');
        txt.innerHTML = text;
        return txt.value;
      }
      case 'binary':
        return text.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
      case 'ascii':
        return text.split(' ').map(c => String.fromCharCode(parseInt(c))).join('');
      default:
        return text;
    }
  } catch (e) {
    return 'Error: Invalid input for decoding';
  }
};

export default function EncoderDecoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [encoding, setEncoding] = useState('base64');
  const [direction, setDirection] = useState('encode');
  const [copied, setCopied] = useState(false);

  const handleProcess = () => {
    if (direction === 'encode') {
      setOutput(encode(input, encoding));
    } else {
      setOutput(decode(input, encoding));
    }
  };

  const handleSwap = () => {
    setInput(output);
    setOutput(input);
    setDirection(d => d === 'encode' ? 'decode' : 'encode');
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-emerald-400" />
          Encoder / Decoder
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Convert text between different encoding formats
        </p>
      </div>

      {/* Encoding Selection */}
      <div className="flex flex-wrap gap-2">
        {ENCODINGS.map((enc) => (
          <button
            key={enc.id}
            onClick={() => setEncoding(enc.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              encoding === enc.id
                ? `bg-${enc.color}-500/20 border-${enc.color}-500/50 text-${enc.color}-300`
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {enc.name}
          </button>
        ))}
      </div>

      {/* Direction Toggle */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setDirection('encode')}
          variant={direction === 'encode' ? 'default' : 'outline'}
          size="sm"
          className={direction === 'encode' ? 'bg-cyan-600' : 'border-slate-600'}
        >
          Encode
        </Button>
        <Button
          onClick={() => setDirection('decode')}
          variant={direction === 'decode' ? 'default' : 'outline'}
          size="sm"
          className={direction === 'decode' ? 'bg-purple-600' : 'border-slate-600'}
        >
          Decode
        </Button>
      </div>

      {/* Input/Output */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              {direction === 'encode' ? 'Plain Text' : 'Encoded Text'}
            </label>
            <Badge variant="outline" className="text-[10px] border-slate-600">
              {input.length} chars
            </Badge>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === 'encode' ? 'Enter text to encode...' : 'Enter text to decode...'}
            className="bg-slate-900/80 border-slate-700 text-white min-h-[150px] font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              {direction === 'encode' ? 'Encoded Output' : 'Decoded Output'}
            </label>
            {output && (
              <button onClick={copyOutput} className="text-slate-500 hover:text-white">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder="Output will appear here..."
            className="bg-slate-900/80 border-slate-700 text-white min-h-[150px] font-mono text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleProcess}
          className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
        >
          {direction === 'encode' ? 'Encode' : 'Decode'}
        </Button>
        <Button
          onClick={handleSwap}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}