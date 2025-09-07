import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Users, Phone, Mail, MapPin, Linkedin, Youtube, Instagram } from 'lucide-react';

interface ClosingCTAProps {
  onRegistration: () => void;
  onLogin: () => void;
}

export function ClosingCTA({ onRegistration, onLogin }: ClosingCTAProps) {
  return (
    <section className="section-gradient-secondary relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Smooth transition gradient from previous section */}
      <div className="section-transition-top"></div>
      
      {/* Enhanced brand-consistent background - similar to Hero but darker at bottom */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e1b4b] via-[#4c46a0] via-40% to-[#030213]" />
        {/* Extra darkening gradient for the lower part */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-60% to-[#030213]/80" />
      </div>

      {/* Flowing gradient curves similar to Hero Section */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full opacity-50"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 0.5 }}
        transition={{ duration: 2, delay: 0.5 }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#06b6d4]/40 via-[#8b5cf6]/30 to-transparent rounded-full blur-3xl transform -rotate-12 scale-150" />
      </motion.div>

      <motion.div
        className="absolute bottom-0 right-0 w-2/3 h-2/3 opacity-30"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 0.3 }}
        transition={{ duration: 2, delay: 1 }}
      >
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-[#ec4899]/40 via-[#8b5cf6]/25 to-transparent rounded-full blur-3xl transform rotate-12" />
      </motion.div>

      {/* Curved flowing lines */}
      <motion.svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1200 800"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 1.5 }}
      >
        <motion.path
          d="M 0,400 Q 300,200 600,400 T 1200,300"
          stroke="url(#ctaGradient1)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 2, delay: 2 }}
        />
        <motion.path
          d="M 200,600 Q 500,300 800,500 T 1200,400"
          stroke="url(#ctaGradient2)"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 2.5, delay: 2.5 }}
        />
        <defs>
          <linearGradient
            id="ctaGradient1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient
            id="ctaGradient2"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Animated floating shapes */}
      <motion.div
        className="absolute top-1/4 right-1/3 w-32 h-32 bg-gradient-to-r from-[#06b6d4]/15 to-[#8b5cf6]/15 rounded-full blur-xl"
        animate={{ 
          x: [0, 50, -50, 0],
          y: [0, -30, 30, 0],
          scale: [1, 1.2, 0.8, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-gradient-to-r from-[#8b5cf6]/15 to-[#ec4899]/15 rounded-full blur-xl"
        animate={{ 
          x: [0, -40, 60, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.8, 1.3, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center text-white py-20">
        <motion.h2
          className="text-4xl md:text-6xl font-bold mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Ready to Build the{' '}
          <span className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
            Future of Learning?
          </span>
        </motion.h2>
        
        <motion.p
          className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Join thousands of educators who are already transforming their classrooms with AI-powered learning
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={onRegistration}
              className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white px-10 py-4 text-lg shadow-2xl relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative z-10">Request a Demo</span>
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              variant="ghost"
              onClick={onLogin}
              className="border-2 border-white/30 bg-transparent text-white hover:text-white hover:bg-white/10 backdrop-blur-sm px-10 py-4 text-lg hover:border-white/50 transition-all duration-300 !text-white"
            >
              <Phone className="w-5 h-5 mr-2 !text-white" />
              Schedule a Call
            </Button>
          </motion.div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div whileHover={{ scale: 1.05 }}>
            <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 text-base">
              <Clock className="w-5 h-5 mr-2 text-[#06b6d4]" />
              Quick Setup
            </Badge>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }}>
            <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 text-base">
              <TrendingUp className="w-5 h-5 mr-2 text-[#8b5cf6]" />
              Proven Results
            </Badge>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }}>
            <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 text-base">
              <Users className="w-5 h-5 mr-2 text-[#f59e0b]" />
              Expert Support
            </Badge>
          </motion.div>
        </motion.div>

        {/* Footer Section */}
        <motion.div
          className="mt-20 pt-16 border-t border-white/10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
            {/* Company Information */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white/90 font-medium text-base">Company</h3>
              <div className="space-y-2 text-white/60">
                <p>© 2025 Gemeos Technologies Inc.</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-[#06b6d4]" />
                  <div>
                    <p>Innovation District</p>
                    <p>San Francisco, CA 94103</p>
                    <p>United States</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white/90 font-medium text-base">Contact</h3>
              <div className="space-y-3 text-white/60">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#8b5cf6]" />
                  <p>Tel: +1 (555) 123-4567</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#06b6d4]" />
                  <p>hello@gemeos.ai</p>
                </div>
                <div className="text-xs space-y-1">
                  <p>Business License: AI-EDU-2025-SF</p>
                  <p>Tax ID: 94-1234567</p>
                </div>
              </div>
            </motion.div>

            {/* Legal Links */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white/90 font-medium text-base">Legal</h3>
              <div className="space-y-2">
                <motion.a
                  href="#"
                  className="block text-white/60 hover:text-white/90 transition-colors duration-200"
                  whileHover={{ x: 4 }}
                >
                  Privacy Policy
                </motion.a>
                <motion.a
                  href="#"
                  className="block text-white/60 hover:text-white/90 transition-colors duration-200"
                  whileHover={{ x: 4 }}
                >
                  Terms of Service
                </motion.a>
                <motion.a
                  href="#"
                  className="block text-white/60 hover:text-white/90 transition-colors duration-200"
                  whileHover={{ x: 4 }}
                >
                  Cookie Policy
                </motion.a>
                <motion.a
                  href="#"
                  className="block text-white/60 hover:text-white/90 transition-colors duration-200"
                  whileHover={{ x: 4 }}
                >
                  Data Protection
                </motion.a>
              </div>
            </motion.div>

            {/* Social Media */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white/90 font-medium text-base">Follow Us</h3>
              <div className="space-y-3">
                <motion.a
                  href="#"
                  className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors duration-200"
                  whileHover={{ x: 4 }}
                >
                  <Linkedin className="w-5 h-5 text-[#0077B5]" />
                  <span>LinkedIn</span>
                </motion.a>
                <motion.a
                  href="#"
                  className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors duration-200"
                  whileHover={{ x: 4 }}
                >
                  <Youtube className="w-5 h-5 text-[#FF0000]" />
                  <span>YouTube</span>
                </motion.a>
                <motion.a
                  href="#"
                  className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors duration-200"
                  whileHover={{ x: 4 }}
                >
                  <Instagram className="w-5 h-5 text-[#E4405F]" />
                  <span>Instagram</span>
                </motion.a>
              </div>
            </motion.div>
          </div>

          {/* Bottom Copyright */}
          <motion.div
            className="mt-12 pt-8 border-t border-white/5 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            viewport={{ once: true }}
          >
            <p className="text-white/40 text-xs">
              Built with passion for education • Transforming learning through AI • All rights reserved
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}