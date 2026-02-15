import React from 'react';
import { cn } from '@/lib/utils';

/**
 * GlyphLock Custom Icon Registry & Rendering System
 * ──────────────────────────────────────────────────
 * Central icon registry for the entire GlyphLock site.
 * All icons render with a dark mask so they blend seamlessly
 * into the dark/transparent cosmic background.
 *
 * Usage:
 *   <GlyphIcon type="security_shield" size={64} />
 *   <GlyphIcon type="ai_chip" size={48} glow />
 */

// ─── MASTER ICON REGISTRY ────────────────────────────────────────────
// Each key is a semantic name. Add / remove entries here to manage icons site-wide.
const ICON_URLS = {
  // ── Upload / Transfer ──
  upload_hologram:       'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/47765dd61_file_0000000019f0722f936fed79d811473b.png',
  upload_phone:          'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/377f087ca_file_000000003360722fbd6f2b87f110a7a2.png',
  upload_chip:           'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/91a5a9fd7_file_00000000515071fd90d3dd62d0e1ba01.png',
  upload:                'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/2364883d9_file_00000000552c71f8a4ac920a97956244.png',

  // ── Download / Archive ──
  download_inbox:        'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/0a08fe3b0_file_00000000d960722f8b48df20d7e6bf2b.png',
  download_chip:         'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/a37035485_file_00000000ccd871fdabbd474e0165108e.png',
  download:              'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/a37035485_file_00000000ccd871fdabbd474e0165108e.png',

  // ── Delete / Trash ──
  trash_media:           'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/ad7510dfd_file_00000000aa0c722f82f9862966fb57d5.png',
  shredder:              'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/99e7f36a3_file_00000000dd8871fd9decc08fd6ef64731.png',
  shredder_alt:          'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/19bfc2e51_file_00000000dd8871fd9decc08fd6ef6473.png',
  delete:                'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/6e5e71dc5_file_00000000dd8871fd9decc08fd6ef64732.png',

  // ── Files / Zip ──
  zip_folder:            'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/cec8a20f9_file_000000004ee4722fbc1484c8cc8d740e.png',
  attachment:            'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/98f014cc0_file_000000008fd071fd866fd75376c84b7f.png',

  // ── Arrows / Transfer ──
  crossfade:             'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/5450af203_file_00000000f33c722fb5dec270c80a3c54.png',

  // ── AI / Intelligence ──
  ai_chip:               'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/bacb502a2_file_00000000887471f5b9b90e4fdcb38211.png',
  ai_robot:              'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/20d745e6b_file_00000000776c71f582531e40b15c1392.png',

  // ── Image Lab / Creative ──
  image_editor_laptop:   'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/41bc53c4b_file_00000000e300722f9ecd6fb87eb6b392.png',
  image_editor_monitor:  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/45adc888e_file_00000000a12071f590fa53a86e016b07.png',
  image_gallery:         'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/625f9747b_file_00000000ed68722fb62c30e2dad90249.png',

  // ── Security / Shield ──
  security_monitor:      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/8f9b8b8b3_file_00000000eaa071f5bf05ac61dd0a290e.png',
  security_lock_nodes:   'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/f529f013b_file_00000000b37471f5b92b70cb030f68b5.png',
  security_folder:       'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/d15c0d38d_file_000000005eb471f58215fec734dce250.png',
  security_fingerprint:  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/d11dd3fe9_file_000000001b94722fba2d36cdec2ae9d0.png',
  security_shield:       'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/9c3e5c53c_file_00000000221071fda30d486dde3cc4dd2.png',
  security_shield_alt:   'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/ca03da803_file_00000000221071fda30d486dde3cc4dd1.png',
  security_shield_alt2:  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/49c8c5932_file_00000000221071fda30d486dde3cc4dd.png',
  security_padlock:      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/a93787ff5_file_00000000c72071fd84bbb06f32e2ffb61.png',
  security_padlock_alt:  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/436c1bea2_file_00000000c72071fd84bbb06f32e2ffb6.png',
  security_cloud:        'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/d922e2724_file_00000000bc9071fdb88821d788f25d85.png',
  security_cloud_alt:    'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/7b652f126_file_000000008b6471f89071d61754d0db392.png',
  security_orb:          'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/739a29f01_file_00000000a97471f8a0a7aeefa80225001.png',
  security_orb_alt:      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/0cea7626e_file_0000000036c071f8b0c196bb3dc559921.png',
  security_gears:        'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/7c01c8bdc_file_0000000036c071f8b0c196bb3dc55992.png',

  // ── Blockchain / Crypto ──
  blockchain:            'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/f77063c0c_file_000000008b6471f89071d61754d0db391.png',

  // ── Launch / Rocket ──
  launch:                'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/7b652f126_file_000000008b6471f89071d61754d0db392.png',
  rocket:                'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/a37035485_file_00000000ccd871fdabbd474e0165108e.png',
};

// Helper: list all available icon keys (useful for showcase / debug)
export const getIconKeys = () => Object.keys(ICON_URLS);
export const getIconUrl = (type) => ICON_URLS[type] || null;

// ─── CORE ICON COMPONENT ─────────────────────────────────────────────
// Renders each icon with a dark radial mask behind it so it blends
// seamlessly into the site's dark cosmic background.
export const GlyphIcon = ({
  type,
  size = 24,
  className = '',
  glow = false,
  animate = false,
  onClick,
  title,
  maskIntensity = 0.85, // 0-1 how dark the mask behind the icon is
}) => {
  const url = ICON_URLS[type];

  if (!url) {
    console.warn(`[GlyphIcon] Unknown icon type: "${type}". Available: ${getIconKeys().join(', ')}`);
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center relative',
        'select-none',
        animate && 'hover:scale-110 active:scale-95 transition-transform duration-300',
        onClick && 'cursor-pointer',
        glow && 'drop-shadow-[0_0_12px_rgba(87,61,255,0.6)]',
        className
      )}
      onClick={onClick}
      title={title}
      role={onClick ? 'button' : undefined}
      style={{ width: size, height: size }}
    >
      {/* Dark radial mask – blends the icon's white/light bg into site bg */}
      <span
        aria-hidden="true"
        className="absolute inset-[-25%] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(0,0,0,${maskIntensity}) 30%, rgba(0,0,0,${maskIntensity * 0.9}) 55%, transparent 75%)`,
          zIndex: 0,
        }}
      />
      <img
        src={url}
        alt={title || type}
        loading="eager"
        draggable={false}
        className="relative z-[1] w-full h-full object-contain"
        style={{
          mixBlendMode: 'screen',
          filter: glow ? 'drop-shadow(0 0 8px rgba(87,61,255,0.5))' : undefined,
        }}
      />
    </span>
  );
};

// ─── ICON BUTTON ─────────────────────────────────────────────────────
export const IconButton = ({
  type,
  size = 32,
  onClick,
  title,
  variant = 'default',
  className = '',
  disabled = false,
}) => {
  const variants = {
    default: 'border-white/20 hover:border-white/40 hover:shadow-[0_0_20px_rgba(87,61,255,0.4)]',
    danger:  'border-red-500/40 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]',
    success: 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    primary: 'border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'rounded-xl border-2 p-3 transition-all duration-300 flex items-center justify-center',
        'bg-white/5 backdrop-blur-sm',
        'active:scale-95',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none',
        variants[variant],
        className
      )}
      style={{
        minWidth: 48,
        minHeight: 48,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <GlyphIcon type={type} size={size} animate={!disabled} glow />
    </button>
  );
};

// ─── ICON BADGE ──────────────────────────────────────────────────────
export const IconBadge = ({ type, label, size = 20, className = '' }) => (
  <div
    className={cn(
      'inline-flex items-center gap-2 px-3 py-2 rounded-xl',
      'bg-white/5 border border-white/15 backdrop-blur-xl',
      className
    )}
  >
    <GlyphIcon type={type} size={size} glow />
    {label && <span className="text-sm font-semibold text-white">{label}</span>}
  </div>
);

// ─── FEATURE CARD ────────────────────────────────────────────────────
export const FeatureCard = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={cn(
      'group p-6 rounded-2xl border-2 border-white/15 bg-white/5 backdrop-blur-xl',
      'hover:border-cyan-400/60 hover:bg-white/8 transition-all duration-500',
      'hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]',
      className
    )}
  >
    <div className="flex flex-col items-center text-center space-y-4">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-2 border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(87,61,255,0.3)] group-hover:shadow-[0_0_50px_rgba(87,61,255,0.5)] transition-all duration-500 overflow-hidden">
        <GlyphIcon type={icon} size={64} animate glow />
      </div>
      <div>
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
      </div>
      {action && <div className="w-full">{action}</div>}
    </div>
  </div>
);

export default GlyphIcon;