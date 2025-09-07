import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Sparkles } from 'lucide-react';

export function FutureOfLearning() {
  return (
    <section className="section-gradient-secondary relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Smooth transition gradients */}
      <div className="section-transition-top"></div>
      
      {/* Brand-consistent gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030213] via-[#4c46a0] via-50% to-[#14112e]" />
      </div>

      {/* Abstract flowing shapes */}
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 opacity-30"
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 100, 0],
          rotate: [0, 180, 360],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full bg-gradient-to-r from-[#ec4899] to-[#06b6d4] rounded-full blur-3xl" />
      </motion.div>

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 opacity-20"
        animate={{
          x: [0, -80, 120, 0],
          y: [0, 120, -80, 0],
          rotate: [360, 180, 0],
          scale: [0.8, 1.3, 1, 0.8],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded-full blur-3xl" />
      </motion.div>

      {/* Curved flow lines */}
      <motion.svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1200 800"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 1 }}
      >
        <motion.path
          d="M 0,400 Q 300,200 600,400 T 1200,300"
          stroke="url(#gradient1)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        <motion.path
          d="M 0,500 Q 400,250 800,450 T 1200,350"
          stroke="url(#gradient2)"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 2.5, delay: 1 }}
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </motion.svg>

      <div className="relative z-10 max-w-7xl mx-auto py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Main Content - Inspired by "Your Brand Deserves Super Sonic" */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white px-4 py-2 text-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Next Generation Education
              </Badge>
              
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  Learning
                </motion.span>
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  Deserves
                </motion.span>
                <motion.span
                  className="block bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  Super AI.
                </motion.span>
              </h2>
            </motion.div>

            {/* Floating feature badges */}
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="flex items-center bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Brain className="w-5 h-5 text-[#06b6d4] mr-2" />
                <span className="text-white text-sm">AI-Powered</span>
              </motion.div>
              
              <motion.div
                className="flex items-center bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Zap className="w-5 h-5 text-[#f59e0b] mr-2" />
                <span className="text-white text-sm">Lightning Fast</span>
              </motion.div>
              
              <motion.div
                className="flex items-center bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Sparkles className="w-5 h-5 text-[#ec4899] mr-2" />
                <span className="text-white text-sm">Personalized</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Side Content - Similar to the descriptive text in reference */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
              whileHover={{ y: -10, boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="text-2xl font-bold text-white mb-4">
                Revolutionizing Education
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                Gemeos AI transforms traditional learning into dynamic, personalized experiences. 
                Our platform adapts in real-time, creating unique pathways for every student while 
                maintaining engagement through cutting-edge interactive technologies.
              </p>
              
              <div className="space-y-4">
                <motion.div
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  <div className="w-2 h-2 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-full" />
                  <span className="text-gray-300">Adaptive learning algorithms</span>
                </motion.div>
                
                <motion.div
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  viewport={{ once: true }}
                >
                  <div className="w-2 h-2 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded-full" />
                  <span className="text-gray-300">Real-time performance insights</span>
                </motion.div>
                
                <motion.div
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  viewport={{ once: true }}
                >
                  <div className="w-2 h-2 bg-gradient-to-r from-[#ec4899] to-[#f59e0b] rounded-full" />
                  <span className="text-gray-300">Immersive interactive content</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="text-center">
                <motion.div
                  className="text-3xl font-bold text-white mb-1"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                >
                  95%
                </motion.div>
                <div className="text-sm text-gray-400">Engagement Rate</div>
              </div>
              
              <div className="text-center">
                <motion.div
                  className="text-3xl font-bold text-white mb-1"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  3x
                </motion.div>
                <div className="text-sm text-gray-400">Faster Learning</div>
              </div>
              
              <div className="text-center">
                <motion.div
                  className="text-3xl font-bold text-white mb-1"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  100K+
                </motion.div>
                <div className="text-sm text-gray-400">Students</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-3 bg-white rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
      
      <div className="section-transition-bottom"></div>
    </section>
  );
}