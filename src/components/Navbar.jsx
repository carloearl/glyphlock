import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronDown, User, LogOut, Terminal, Menu, X, Sparkles, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { NAV_SECTIONS } from "@/components/NavigationConfig";
import { filterUiArtifacts } from "@/lib/uiArtifactFilter";

const NAV = filterUiArtifacts(NAV_SECTIONS).map((section) => ({
  ...section,
  items: filterUiArtifacts(section.items || [])
}));

// Magnetic button effect
function MagneticButton({ children, className, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated nav item with stagger
const NavItem = ({ section, isOpen, onToggle, index, user }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative"
      onMouseEnter={() => { setIsHovered(true); onToggle(section.label); }}
      onMouseLeave={() => { setIsHovered(false); onToggle(null); }}
    >
      <motion.button
        className="group relative flex items-center gap-1.5 text-blue-100 hover:text-white transition-all duration-300 py-2.5 px-5 text-sm font-semibold uppercase tracking-wider rounded-xl overflow-hidden"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Animated gradient border - always visible, intensifies on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl p-[1.5px]"
          style={{
            background: 'linear-gradient(135deg, #00E4FF, #3B82F6, #8B5CF6, #A855F7, #00E4FF)',
            backgroundSize: '400% 100%'
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            opacity: isHovered ? 1 : 0.6
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-[1.5px] rounded-xl bg-slate-950/95 backdrop-blur-md" />
        </motion.div>

        {/* Inner glow layer */}
        <motion.div
          className="absolute inset-[2px] rounded-xl"
          animate={{
            boxShadow: isHovered 
              ? 'inset 0 0 20px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' 
              : 'inset 0 0 10px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Glassmorphism background */}
        <motion.div
          className="absolute inset-[2px] rounded-xl"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: isHovered ? 0.8 : 0.4 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.15) 50%, rgba(6,182,212,0.12) 100%)',
            backdropFilter: 'blur(12px)'
          }}
        />

        {/* Shimmer sweep effect */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            backgroundSize: '200% 100%'
          }}
          animate={{
            backgroundPosition: ['200% 0', '-200% 0'],
            opacity: isHovered ? 1 : 0
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Outer glow on hover */}
        <motion.div
          className="absolute -inset-1 rounded-xl blur-md -z-10"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.5), rgba(139,92,246,0.5))' }}
          animate={{ opacity: isHovered ? 0.6 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Glowing dot indicator */}
        <motion.span
          className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{ 
            background: 'linear-gradient(135deg, #00E4FF, #8B5CF6)',
            boxShadow: '0 0 12px #00E4FF, 0 0 24px #8B5CF6' 
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
        />
        
        <span className="relative z-10 flex items-center gap-1.5">
          {section.label}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ChevronDown size={14} className={isOpen ? 'text-cyan-400' : 'group-hover:text-cyan-300 transition-colors'} />
          </motion.div>
        </span>
      </motion.button>

      {/* Mega dropdown with blur backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(5px)" }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-80"
            style={{ zIndex: 10001 }}
          >
            <div className="relative overflow-hidden rounded-2xl">
              {/* Outer glow - Vivid Royal Blue pulsing */}
              <motion.div 
                className="absolute -inset-3 bg-gradient-to-br from-blue-500/60 via-blue-600/50 to-indigo-500/60 rounded-2xl blur-2xl"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.02, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Content container - Deep Royal Blue glass */}
              <motion.div 
                className="relative bg-gradient-to-br from-blue-950/90 via-slate-950/95 to-indigo-950/90 backdrop-blur-3xl backdrop-saturate-200 border-2 border-blue-400/50 rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.6),0_0_100px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(96,165,250,0.4),inset_0_-1px_0_rgba(59,130,246,0.2)] overflow-hidden"
                initial={{ backdropFilter: "blur(0px)" }}
                animate={{ backdropFilter: "blur(24px)" }}
                transition={{ duration: 0.3 }}
              >
                {/* Animated top glow bar */}
                <motion.div 
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  style={{
                    backgroundSize: '200% 100%',
                    boxShadow: '0 0 25px rgba(59,130,246,1), 0 0 50px rgba(59,130,246,0.5)'
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                {/* Glassmorphism layers */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"></div>

                {/* Animated grid pattern with purple gradient glow */}
                <motion.div 
                  className="absolute inset-0 opacity-25"
                  animate={{ opacity: [0.2, 0.35, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(168,85,247,0.9) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(139,92,246,0.9) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                    filter: 'drop-shadow(0 0 3px rgba(168,85,247,0.8))'
                  }}
                />
                {/* Secondary blue grid overlay */}
                <div 
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(59,130,246,0.6) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(37,99,235,0.6) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                  }}
                />

                {/* Floating particles effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-blue-400 rounded-full"
                      style={{
                        left: `${15 + i * 15}%`,
                        top: '50%',
                        boxShadow: '0 0 6px rgba(59,130,246,0.8)'
                      }}
                      animate={{
                        y: [-20, 20, -20],
                        opacity: [0.3, 0.8, 0.3],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-blue-400/60 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-blue-400/60 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-blue-400/60 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-blue-400/60 rounded-br-2xl" />

                {/* Ambient glow - Brighter */}
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 via-blue-600/25 to-indigo-500/30 blur-xl -z-10"></div>

                <div className="relative p-2">
                 {section.items.filter(item => {
                   // Filter out admin-only items for non-admin users
                   if (item.visibility === 'admin' && (!user || user.role !== 'admin')) {
                     return false;
                   }
                   return true;
                 }).map((item, idx) => (
                   <motion.div
                     key={item.page}
                     initial={{ opacity: 0, x: -30, filter: "blur(8px)" }}
                     animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                     transition={{ delay: idx * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                   >
                     <Link
                       to={createPageUrl(item.page)}
                       onClick={() => {
                         if (item.requiresAccessToken) {
                           sessionStorage.setItem("nups_access_token", crypto.randomUUID());
                         }
                       }}
                       className="group/item relative flex items-center justify-between px-4 py-3.5 rounded-lg text-blue-100 hover:text-white transition-all duration-300 overflow-hidden"
                     >
                        {/* Animated hover background sweep */}
                        <motion.div
                          className="absolute inset-0 rounded-lg"
                          initial={{ x: "-100%", opacity: 0 }}
                          whileHover={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2) 20%, rgba(59,130,246,0.3) 50%, rgba(59,130,246,0.2) 80%, transparent)'
                          }}
                        />

                        {/* Shimmer effect on hover */}
                        <motion.div
                          className="absolute inset-0 rounded-lg opacity-0 group-hover/item:opacity-100"
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                            backgroundSize: '200% 100%'
                          }}
                          animate={{
                            backgroundPosition: ['200% 0', '-200% 0']
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Hover border glow */}
                        <div className="absolute inset-0 border border-blue-400/0 group-hover/item:border-blue-400/70 group-hover/item:shadow-[0_0_20px_rgba(59,130,246,0.5),inset_0_0_20px_rgba(59,130,246,0.1)] rounded-lg transition-all duration-300"></div>

                        {/* Left accent bar with glow trail */}
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full"
                          style={{
                            background: 'linear-gradient(to bottom, #60A5FA, #3B82F6, #60A5FA)',
                            boxShadow: '0 0 20px rgba(59,130,246,1), 0 0 40px rgba(59,130,246,0.5)'
                          }}
                          whileHover={{ height: "70%" }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        />

                        <span className="relative z-10 font-semibold text-sm group-hover/item:translate-x-2 transition-transform duration-300">
                          {item.label}
                        </span>
                        
                        <motion.div
                          className="flex items-center gap-1"
                          initial={{ x: -10, opacity: 0 }}
                          whileHover={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.25 }}
                        >
                          <motion.div
                            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            style={{ boxShadow: '0 0 8px rgba(59,130,246,0.8)' }}
                          />
                          <svg
                            className="w-4 h-4 text-blue-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function Navbar({ user, onLogin, onLogout }) {
  const [openSection, setOpenSection] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  const { scrollY } = useScroll();
  const navbarY = useTransform(scrollY, [0, 100], [0, 0]);
  const navbarOpacity = useTransform(scrollY, [0, 50], [1, 0.98]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setScrolled(currentScrollY > 20);
      
      // Hide navbar on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`w-full text-white sticky top-0 transition-all duration-500 ${
        scrolled 
          ? 'bg-gradient-to-r from-blue-950/95 via-indigo-950/98 to-blue-950/95 backdrop-blur-2xl shadow-[0_4px_60px_rgba(59,130,246,0.5),0_0_100px_rgba(37,99,235,0.3)]' 
          : 'bg-gradient-to-r from-blue-950/90 via-indigo-950/95 to-blue-950/90 backdrop-blur-xl'
      }`}
      style={{ 
        zIndex: 10000, 
        pointerEvents: 'auto',
        borderBottom: scrolled ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(59,130,246,0.3)'
      }}
    >
      {/* Animated top line - Vivid Royal Blue */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px] shadow-[0_0_15px_rgba(59,130,246,0.8)]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.8) 20%, rgba(96,165,250,0.9) 50%, rgba(59,130,246,0.8) 80%, transparent)'
        }}
        animate={{
          opacity: scrolled ? 1 : 0.7
        }}
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-3 flex items-center justify-between">
        {/* Logo with hover effects */}
        <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
          <MagneticButton>
            <div className="relative">
              {/* Animated glow ring */}
              <motion.div
                className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 opacity-0 blur-lg group-hover:opacity-60"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png"
                  alt="GlyphLock Security Platform Logo"
                  className="h-10 w-auto relative z-10 group-hover:scale-110 transition-transform duration-300"
                  fetchpriority="high"
                  decoding="async"
                  width={40}
                  height={40}
                />
              </div>
            </div>
          </MagneticButton>
          
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight leading-none">
              <span className="text-white">GLYPH</span>
              <span className="text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500 bg-clip-text">LOCK</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-cyan-400 font-medium">Ecosystem</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV && NAV.map((section, idx) => (
            <NavItem
              key={section.label}
              section={section}
              index={idx}
              isOpen={openSection === section.label}
              onToggle={setOpenSection}
              user={user}
            />
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {/* CTA Button with futuristic design */}
          <Link to={createPageUrl("Consultation")}>
            <MagneticButton>
              <motion.button
                className="group relative px-6 py-2.5 rounded-full overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated border */}
                <motion.div
                  className="absolute inset-0 rounded-full p-[1px]"
                  style={{
                    background: 'linear-gradient(90deg, #00E4FF, #3B82F6, #8B5CF6, #00E4FF)',
                    backgroundSize: '300% 100%'
                  }}
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute inset-[1px] rounded-full bg-slate-950/90 backdrop-blur-sm" />
                </motion.div>
                
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/0 via-blue-500/20 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <span className="relative z-10 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cyan-300 group-hover:text-white transition-colors">
                  <Zap size={14} className="group-hover:animate-pulse" />
                  Get Started
                </span>
              </motion.button>
            </MagneticButton>
          </Link>

          {user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/30 transition-all backdrop-blur-sm"
                aria-label={`User menu for ${user.full_name || user.email}`}
              >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                    {user.full_name?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-300 max-w-[80px] truncate">{user.full_name?.split(" ")[0]}</span>
                  <ChevronDown size={14} className="text-gray-300" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_0_50px_rgba(0,228,255,0.2)] rounded-xl p-2 mt-2 w-60">
                <div className="px-3 py-2.5 mb-2 border-b border-white/10">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                </div>
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild className="text-gray-300 focus:bg-cyan-500/10 focus:text-white rounded-lg cursor-pointer mb-1">
                    <Link to={createPageUrl("CommandCenter")} className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      Command Center
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="text-gray-300 focus:bg-blue-500/10 focus:text-white rounded-lg cursor-pointer mb-1">
                  <Link to={createPageUrl("AccountSecurity")} className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10 my-1" />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-300 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <motion.button
              onClick={onLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-gray-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/5 transition-all"
              aria-label="Sign in to GlyphLock account"
            >
              Sign In
            </motion.button>
          )}
        </div>

        {/* Mobile/Tablet action cluster — always-visible Sign In + hamburger */}
        <div className="lg:hidden flex items-center gap-2">
          {!user && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onLogin}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '48px' }}
              className="px-4 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 border border-cyan-400/40"
              aria-label="Sign in to GlyphLock account"
            >
              Sign In
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minWidth: '52px', minHeight: '52px' }}
            className="relative w-14 h-14 flex items-center justify-center rounded-xl bg-white/5 border-2 border-white/10 hover:border-cyan-400/50 transition-all active:bg-cyan-500/20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
          <AnimatePresence mode="wait">
            {mobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} className="text-cyan-400" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={24} />
              </motion.div>
            )}
          </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu with staggered animations */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:hidden border-t border-white/10 bg-slate-950/98 backdrop-blur-2xl overflow-hidden"
          >
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {NAV && NAV.map((section, sectionIdx) => (
                <motion.div
                  key={section.label}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: sectionIdx * 0.1 }}
                  className="space-y-3"
                >
                  <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px #00E4FF' }} />
                    {section.label}
                  </h3>
                  <div className="grid grid-cols-1 gap-1 pl-4 border-l border-cyan-500/20">
                   {section.items && section.items.filter(item => {
                     // Filter out admin-only items for non-admin users
                     if (item.visibility === 'admin' && (!user || user.role !== 'admin')) {
                       return false;
                     }
                     return true;
                   }).map((item, itemIdx) => (
                     <motion.div
                       key={item.page}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: sectionIdx * 0.1 + itemIdx * 0.05 }}
                     >
                       <Link
                         to={createPageUrl(item.page)}
                         onClick={() => {
                           setMobileMenuOpen(false);
                           if (item.requiresAccessToken) {
                             sessionStorage.setItem("nups_access_token", crypto.randomUUID());
                           }
                         }}
                         style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                         className="text-gray-300 hover:text-white text-base py-4 px-4 block rounded-xl hover:bg-cyan-500/10 hover:border-cyan-400/30 border-2 border-transparent transition-all min-h-[56px] flex items-center font-semibold active:scale-95 active:bg-cyan-500/20"
                       >
                         {item.label}
                       </Link>
                     </motion.div>
                   ))}
                  </div>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-6 border-t border-white/10 space-y-3"
              >
                {user ? (
                  <>
                    <Link to={createPageUrl("CommandCenter")} onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                        className="w-full h-14 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-2 border-cyan-400/40 text-white font-black text-base hover:from-cyan-500/30 hover:to-violet-500/30 hover:border-cyan-400/60 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                      >
                        <Terminal className="w-5 h-5 mr-2" />
                        COMMAND CENTER
                      </Button>
                    </Link>
                    <Button 
                      onClick={onLogout} 
                      variant="ghost" 
                      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      className="w-full h-14 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-2 border-transparent hover:border-red-500/30 font-bold text-base active:scale-95"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      SIGN OUT
                    </Button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={onLogin} 
                      variant="ghost" 
                      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      className="text-white hover:bg-white/10 border-2 border-white/10 hover:border-cyan-400/40 h-14 text-base font-bold active:scale-95"
                    >
                      SIGN IN
                    </Button>
                    <Link to={createPageUrl("Consultation")} onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                        className="w-full h-14 bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-none font-black text-base shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] active:scale-95"
                      >
                        GET STARTED
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}