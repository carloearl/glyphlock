import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";

export default function TestimonialsSection() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  const testimonials = [
    {
      name: "Marcus R.",
      role: "VIP Guest",
      text: "Raul took us to Dimes after checking out GlyphLock's security features. Best two clubs around — one for tech, one for nightlife. Both protected by the same system.",
      rating: 5,
      location: "Phoenix, AZ"
    },
    {
      name: "Jessica M.",
      role: "Regular Patron",
      text: "Love seeing the same security tech at Dimes that powers GlyphLock. Makes you feel safe knowing the verification system is legit. Plus the cross-promotion brings great crowds from both scenes.",
      rating: 5,
      location: "Scottsdale, AZ"
    },
    {
      name: "Tony V.",
      role: "Business Owner",
      text: "I send all my VIP clients to Dimes when they're in town. The fact they use GlyphLock's verification tech tells me they're serious about security and guest experience. Can't recommend both enough.",
      rating: 5,
      location: "Phoenix, AZ"
    },
    {
      name: "Sophia L.",
      role: "Entertainment Professional",
      text: "Working with venues that use GlyphLock makes everything smoother. Dimes has been a game-changer for our industry — professional, secure, and the tech integration is seamless.",
      rating: 5,
      location: "Tempe, AZ"
    },
    {
      name: "David K.",
      role: "Tech Enthusiast",
      text: "First saw GlyphLock's QR verification system at Dimes. Blown away by the blockchain anchoring and real-time contract signing. Now I use their tools for my own projects. The cross-pollination between venues and tech is genius.",
      rating: 5,
      location: "Phoenix, AZ"
    },
    {
      name: "Amanda P.",
      role: "Event Coordinator",
      text: "Our corporate events use GlyphLock's security infrastructure, same system Dimes runs. The reliability is unmatched. Guests from both communities appreciate the professionalism.",
      rating: 5,
      location: "Phoenix, AZ"
    }
  ];

  return (
    <div ref={containerRef} className="w-full max-w-7xl mx-auto px-4 py-20">
      
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
          TRUSTED BY THE <span className="text-blue-400">COMMUNITY</span>
        </h2>
        <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
          Real voices from businesses, creators, and guests who trust GlyphLock's security infrastructure
        </p>
      </motion.div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ 
              duration: 0.6, 
              delay: idx * 0.1,
              ease: [0.16, 1, 0.3, 1]
            }}
            whileHover={{ 
              y: -8, 
              scale: 1.02,
              boxShadow: "0 0 40px rgba(59,130,246,0.4)"
            }}
            className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border-2 border-white/10 hover:border-blue-400/50 transition-all"
          >
            {/* Quote Icon */}
            <Quote className="absolute top-4 right-4 w-8 h-8 text-blue-400/30" />

            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-blue-400 text-blue-400" />
              ))}
            </div>

            {/* Testimonial Text */}
            <p className="text-white/90 text-sm md:text-base leading-relaxed mb-6 italic">
              "{testimonial.text}"
            </p>

            {/* Author Info */}
            <div className="border-t border-white/10 pt-4">
              <p className="font-bold text-white text-base">{testimonial.name}</p>
              <p className="text-blue-400 text-sm">{testimonial.role}</p>
              <p className="text-white/60 text-xs mt-1">{testimonial.location}</p>
            </div>

            {/* Glow Effect */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, rgba(59,130,246,0.1) 0%, transparent 70%)',
                filter: 'blur(20px)'
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Footer Note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="text-center text-white/50 text-sm mt-12 italic"
      >
        Real testimonials from verified users across our security ecosystem
      </motion.p>
    </div>
  );
}