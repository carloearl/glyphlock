import React from 'react';
import { cn } from '@/lib/utils';

/**
 * GlyphLock Custom Icon System
 * Production-grade cyberpunk icons with glow effects
 */

const ICON_URLS = {
  delete: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/4ed498e10_file_0000000036c071f8b0c196bb3dc55992.png',
  attachment: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/0402fdc5c_file_000000008fd071fd866fd75376c84b7f.png',
  upload: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/a05ae806b_file_00000000552c71f8a4ac920a97956244.png',
  blockchain: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/38711ae8d_file_00000000a97471f8a0a7aeefa8022500.png',
  launch: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/b59073cb6_file_00000000ccd871fdabbd474e0165108e.png',
  download: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/ce5a0097b_file_00000000515071fd90d3dd62d0e1ba01.png'
};

export const GlyphIcon = ({ 
  type, 
  size = 24, 
  className = '', 
  glow = false,
  animate = false,
  onClick,
  title
}) => {
  const url = ICON_URLS[type];
  
  if (!url) {
    console.warn(`[GlyphIcon] Unknown icon type: ${type}`);
    return null;
  }

  return (
    <img
      src={url}
      alt={title || type}
      title={title}
      onClick={onClick}
      loading="eager"
      className={cn(
        'select-none transition-all duration-300',
        animate && 'hover:scale-110 active:scale-95',
        onClick && 'cursor-pointer',
        className
      )}
      style={{ 
        width: size, 
        height: size,
        objectFit: 'contain',
        pointerEvents: onClick ? 'auto' : 'none',
        userSelect: 'none'
      }}
    />
  );
};

export const IconButton = ({ 
  type, 
  size = 32, 
  onClick, 
  title,
  variant = 'default',
  className = '',
  disabled = false 
}) => {
  const variants = {
    default: 'bg-white border-slate-300 hover:shadow-[0_0_20px_rgba(148,163,184,0.5)]',
    danger: 'bg-white border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]',
    success: 'bg-white border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    primary: 'bg-white border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'rounded-xl border-2 p-3 transition-all duration-300 flex items-center justify-center',
        'active:scale-95',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none',
        variants[variant],
        className
      )}
      style={{ 
        minWidth: 48, 
        minHeight: 48,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <GlyphIcon type={type} size={size} animate={!disabled} />
    </button>
  );
};

export const IconBadge = ({ type, label, size = 20, className = '' }) => (
  <div className={cn(
    'inline-flex items-center gap-2 px-3 py-2 rounded-xl',
    'bg-white/5 border border-white/15 backdrop-blur-xl',
    className
  )}>
    <GlyphIcon type={type} size={size} />
    {label && <span className="text-sm font-semibold text-white">{label}</span>}
  </div>
);

export const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}) => (
  <div className={cn(
    'group p-6 rounded-2xl border-2 border-white/15 bg-white/5 backdrop-blur-xl',
    'hover:border-cyan-400/60 hover:bg-white/8 transition-all duration-500',
    'hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]',
    className
  )}>
    <div className="flex flex-col items-center text-center space-y-4">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] transition-all duration-500">
        <GlyphIcon type={icon} size={64} animate />
      </div>
      <div>
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {description}
        </p>
      </div>
      {action && (
        <div className="w-full">
          {action}
        </div>
      )}
    </div>
  </div>
);

export default GlyphIcon;