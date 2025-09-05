import { Button } from "./ui/button";
import { Play, ChevronDown } from "lucide-react";
import { motion } from "motion/react";

interface HeroSectionProps {
  onLoginClick: () => void;
}

export function HeroSection({ onLoginClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Main content area */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top navigation area */}
        <div className="px-6 pt-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-2xl text-slate-900">Gemeos</div>
            <div className="flex gap-4">
              <Button variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-slate-200">
                Request a Demo
              </Button>
              <Button 
                onClick={onLoginClick}
                className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white border-0"
              >
                Login / Register
              </Button>
            </div>
          </div>
        </div>

        {/* Main hero content */}
        <div className="flex-1 flex items-center px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Main headline */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-6xl md:text-7xl lg:text-8xl text-slate-900 leading-tight">
                The Future of Learning{" "}
                <span className="bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  is Personal
                </span>
              </h1>
            </motion.div>

            {/* Right side - Description */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              <p className="text-xl md:text-2xl text-slate-600 leading-relaxed">
                Our AI-powered platform transforms your educational content into adaptive, 
                interactive learning paths that engage every student.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 border-0">
                  Request a Demo
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-slate-300 text-slate-700 hover:bg-slate-100">
                  <Play className="w-5 h-5 mr-2" />
                  See How It Works
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll down indicator */}
        <motion.div 
          className="flex flex-col items-center pb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <p className="text-slate-500 text-sm mb-4">Scroll to explore</p>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="cursor-pointer"
          >
            <ChevronDown className="w-8 h-8 text-slate-400" />
          </motion.div>
        </motion.div>
      </div>

      {/* Platform Demo Preview Section */}
      <div className="relative bg-white py-20 px-6 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl mb-6 text-slate-900">Platform Demo Preview</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Experience the power of personalized learning with our interactive platform demonstration.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-slate-50 rounded-3xl shadow-xl p-8 max-w-5xl mx-auto border border-slate-200">
              <div className="aspect-video bg-gradient-to-br from-sky-100 via-cyan-100 to-teal-100 rounded-2xl flex items-center justify-center relative overflow-hidden border border-slate-200">
                <div className="text-center z-10">
                  <motion.div 
                    className="w-24 h-24 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200 shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Play className="w-12 h-12 text-sky-600" />
                  </motion.div>
                  <p className="text-slate-800 text-lg">Launch Interactive Demo</p>
                  <p className="text-slate-600 text-sm mt-2">See Gemeos in action</p>
                </div>
                
                {/* Floating UI elements for demo preview */}
                <motion.div 
                  className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200 shadow-sm"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="text-xs text-slate-700">Knowledge Analysis: 94% Complete</div>
                </motion.div>
                
                <motion.div 
                  className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200 shadow-sm"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="text-xs text-slate-700">3 Learning Paths Generated</div>
                </motion.div>
                
                <motion.div 
                  className="absolute top-1/2 right-6 bg-gradient-to-r from-amber-100 to-orange-100 backdrop-blur-sm rounded-lg p-3 border border-amber-200 shadow-sm"
                  animate={{ x: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                >
                  <div className="text-xs text-amber-800">🚀 Innovation Mode</div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}