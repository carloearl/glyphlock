import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Copy, CheckCircle2, AlertCircle, QrCode, Image, Music, Video, Download } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import SEOHead from '@/components/SEOHead';
import HelpPanel from '@/components/global/HelpPanel';

export default function VideoUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(() => localStorage.getItem('gl_last_uploaded_url') || '');
  const [fileType, setFileType] = useState(() => localStorage.getItem('gl_last_uploaded_type') || '');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [generatingQr, setGeneratingQr] = useState(false);
  const qrCanvasRef = useRef(null);

  const acceptedTypes = {
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  };

  const getFileCategory = (type) => {
    if (acceptedTypes.video.some(t => type.includes(t) || type.includes('video'))) return 'video';
    if (acceptedTypes.audio.some(t => type.includes(t) || type.includes('audio'))) return 'audio';
    if (acceptedTypes.image.some(t => type.includes(t) || type.includes('image'))) return 'image';
    return null;
  };

  const MAX_VIDEO_SIZE_MB = 2048; // 2GB
  const MAX_OTHER_SIZE_MB = 200;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const category = getFileCategory(selectedFile.type);
    if (!category) {
      toast.error('Please select an MP4, MP3, or image file');
      return;
    }

    const maxMB = category === 'video' ? MAX_VIDEO_SIZE_MB : MAX_OTHER_SIZE_MB;
    if (selectedFile.size > maxMB * 1024 * 1024) {
      toast.error(`${category.charAt(0).toUpperCase() + category.slice(1)} files must be under ${maxMB}MB`);
      return;
    }

    setFile(selectedFile);
    setFileType(category);
    setFileUrl('');
    setQrCodeUrl('');
  };

  const DRIVE_THRESHOLD_MB = 20; // Files over 20MB go to Google Drive

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const fileSizeMB = file.size / (1024 * 1024);
    const useDrive = fileSizeMB > DRIVE_THRESHOLD_MB;

    try {
      console.log(`[VideoUpload] Starting ${useDrive ? 'Google Drive' : 'standard'} upload for:`, file.name, `(${fileSizeMB.toFixed(1)}MB)`);
      
      let url;

      if (useDrive) {
        // Large file → Google Drive via backend function
        toast.info('Large file detected — uploading to Google Drive...');
        const formData = new FormData();
        formData.append('file', file);
        const response = await base44.functions.invoke('uploadToDrive', formData);
        const result = response.data;
        if (!result?.success) throw new Error(result?.error || 'Drive upload failed');
        url = result.embed_url || result.view_url || result.file_url;
        setFileUrl(url);
        localStorage.setItem('gl_last_uploaded_url', url);
        localStorage.setItem('gl_last_uploaded_type', fileType);
        localStorage.setItem('gl_last_drive_id', result.drive_file_id || '');
        toast.success('Uploaded to Google Drive!');
      } else {
        // Small file → standard Base44 upload
        const result = await base44.integrations.Core.UploadFile({ file });
        url = result?.file_url || result?.data?.file_url;
        if (!url) throw new Error('No URL returned from upload');
        setFileUrl(url);
        localStorage.setItem('gl_last_uploaded_url', url);
        localStorage.setItem('gl_last_uploaded_type', fileType);
        toast.success('File uploaded successfully!');
      }
    } catch (error) {
      console.error('[VideoUpload] Upload error:', error);
      toast.error('Upload failed: ' + (error.message || 'Unknown error'));
      setFileUrl('');
    } finally {
      setUploading(false);
    }
  };

  const generateQrCode = async () => {
    if (!fileUrl) {
      toast.error('Upload a file first to generate QR code');
      return;
    }

    setGeneratingQr(true);
    try {
      const canvas = qrCanvasRef.current;
      await QRCode.toCanvas(canvas, fileUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const qrUrl = canvas.toDataURL('image/png');
      setQrCodeUrl(qrUrl);
      toast.success('QR code generated!');
    } catch (error) {
      console.error('QR generation error:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setGeneratingQr(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fileUrl);
    toast.success('URL copied to clipboard!');
  };

  const downloadQrCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success('QR code downloaded!');
  };

  const getFileIcon = () => {
    if (fileType === 'video') return <Video className="w-5 h-5" />;
    if (fileType === 'audio') return <Music className="w-5 h-5" />;
    if (fileType === 'image') return <Image className="w-5 h-5" />;
    return <Upload className="w-5 h-5" />;
  };

  return (
    <>
    <HelpPanel
      title="Media Upload Guide"
      sections={[
        {
          title: 'How It Works',
          content: [
            { heading: 'Upload Process', text: 'Select a video (MP4, MOV), audio (MP3, WAV), or image file (PNG, JPG). Click upload. System returns a permanent URL.' },
            { heading: 'URL Usage', text: 'The returned URL is permanent and can be embedded in websites, shared via email, or converted to QR codes.' },
            { heading: 'QR Code Generation', text: 'After upload completes, click "Generate QR Code" to create a scannable code. Download the QR image for print or digital use.' }
          ]
        },
        {
          title: 'Troubleshooting',
          content: [
            { heading: 'No URL After Upload', text: 'If upload succeeds but no URL appears, check browser console for errors. Ensure file size is under 50MB. Try refreshing and re-uploading.' },
            { heading: 'File Size Limits', text: 'Maximum file size: 200MB for video, 50MB for audio/images. For larger files, compress before uploading or use external hosting.' },
            { heading: 'Supported Formats', text: 'Videos: MP4, MOV. Audio: MP3, WAV, OGG. Images: PNG, JPG, GIF, WEBP. Other formats may fail silently.' }
          ]
        }
      ]}
    />
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-900 text-white p-4 md:p-8">
      <SEOHead 
        title="Media Upload Hub - Get URLs & QR Codes | GlyphLock"
        description="Upload videos, audio, and images to get shareable URLs and QR codes instantly. Secure media hosting for MP4, MP3, and image files."
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Media Upload Hub
          </h1>
          <p className="text-slate-400 text-lg">Upload videos, audio, or images • Get URLs • Generate QR codes</p>
        </div>

        <div className="bg-slate-900/60 border-2 border-[#3B82F6]/30 rounded-2xl p-6 md:p-8 space-y-6 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
          {/* File Input */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-300 uppercase tracking-wider">
              Select Media File
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-800/60 border border-blue-500/30 rounded-lg p-3 text-center">
                <Video className="w-6 h-6 mx-auto mb-1 text-blue-400" />
                <span className="text-xs text-slate-400">MP4, MOV</span>
              </div>
              <div className="bg-slate-800/60 border border-purple-500/30 rounded-lg p-3 text-center">
                <Music className="w-6 h-6 mx-auto mb-1 text-purple-400" />
                <span className="text-xs text-slate-400">MP3, WAV</span>
              </div>
              <div className="bg-slate-800/60 border border-cyan-500/30 rounded-lg p-3 text-center">
                <Image className="w-6 h-6 mx-auto mb-1 text-cyan-400" />
                <span className="text-xs text-slate-400">PNG, JPG</span>
              </div>
            </div>
            <input
              type="file"
              accept="video/mp4,video/quicktime,audio/mpeg,audio/mp3,audio/wav,image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-300
                file:mr-4 file:py-3 file:px-6
                file:rounded-xl file:border-0
                file:text-sm file:font-bold
                file:bg-gradient-to-r file:from-cyan-600 file:to-blue-600 file:text-white
                hover:file:from-cyan-500 hover:file:to-blue-500
                file:cursor-pointer cursor-pointer file:transition-all"
            />
            {file && (
              <div className="flex items-center gap-3 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                {getFileIcon()}
                <div className="flex-1">
                  <div className="font-semibold text-emerald-400">{file.name}</div>
                  <div className="text-slate-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB • {fileType.toUpperCase()}</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 
              text-white font-bold hover:from-cyan-500 hover:to-blue-500 
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-3 transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)]
              hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span className="text-lg">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-lg">
                  Upload {fileType ? fileType.charAt(0).toUpperCase() + fileType.slice(1) : 'File'}
                  {file && file.size > DRIVE_THRESHOLD_MB * 1024 * 1024 ? ' (via Google Drive)' : ''}
                </span>
              </>
            )}
          </button>

          {/* File URL Result */}
          {fileUrl && (
            <div className="space-y-6 pt-6 border-t-2 border-slate-700/50">
              <div className="flex items-center gap-3 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-bold text-lg">Upload Successful!</span>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-300 uppercase tracking-wider">
                  File URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fileUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-slate-950/80 border-2 border-slate-700/50 rounded-lg text-sm font-mono text-slate-300 focus:border-blue-500/50 transition-colors"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    title="Copy URL"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Generate QR Code Button */}
              <button
                onClick={generateQrCode}
                disabled={generatingQr}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 
                  text-white font-bold hover:from-purple-500 hover:to-blue-500 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                {generatingQr ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    Generate QR Code
                  </>
                )}
              </button>

              {/* QR Code Display */}
              {qrCodeUrl && (
                <div className="space-y-3 bg-slate-950/60 border-2 border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                      QR Code
                    </label>
                    <button
                      onClick={downloadQrCode}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  <div className="flex justify-center bg-white p-6 rounded-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-xs text-slate-400 text-center">Scan this QR code to access your uploaded file</p>
                </div>
              )}

              {/* Preview */}
              {fileType === 'video' && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Video Preview
                  </label>
                  {fileUrl.includes('drive.google.com') ? (
                    <iframe
                      src={fileUrl}
                      className="w-full aspect-video rounded-xl border-2 border-slate-700/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={fileUrl}
                      controls
                      className="w-full rounded-xl border-2 border-slate-700/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                    />
                  )}
                </div>
              )}

              {fileType === 'audio' && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Audio Preview
                  </label>
                  <div className="bg-slate-950/60 border-2 border-purple-500/30 rounded-xl p-6">
                    <audio
                      src={fileUrl}
                      controls
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {fileType === 'image' && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Image Preview
                  </label>
                  <img
                    src={fileUrl}
                    alt="Uploaded"
                    className="w-full rounded-xl border-2 border-slate-700/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden canvas for QR generation */}
        <canvas ref={qrCanvasRef} style={{ display: 'none' }} />

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900/40 border border-blue-500/20 rounded-xl p-5">
            <Upload className="w-8 h-8 text-blue-400 mb-3 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <h3 className="font-bold text-white mb-2">Multi-Format Support</h3>
            <p className="text-sm text-slate-400">Upload videos (MP4), audio (MP3), or images (PNG, JPG)</p>
          </div>
          <div className="bg-slate-900/40 border border-purple-500/20 rounded-xl p-5">
            <QrCode className="w-8 h-8 text-purple-400 mb-3 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            <h3 className="font-bold text-white mb-2">Instant QR Codes</h3>
            <p className="text-sm text-slate-400">Generate scannable QR codes for any uploaded file</p>
          </div>
          <div className="bg-slate-900/40 border border-cyan-500/20 rounded-xl p-5">
            <Copy className="w-8 h-8 text-cyan-400 mb-3 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            <h3 className="font-bold text-white mb-2">Shareable URLs</h3>
            <p className="text-sm text-slate-400">Get permanent, secure URLs for all your media</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}