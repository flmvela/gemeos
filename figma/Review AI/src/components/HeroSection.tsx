import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Play, ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="section-gradient-primary relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced brand-consistent gradient system */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e1b4b] via-[#4c46a0] via-50% to-[#030213]" />
      </div>
      
      {/* Smooth transition gradient to next section */}
      <div className="section-transition-bottom"></div>

      {/* Flowing gradient curves inspired by the reference */}
      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full opacity-60"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 0.6 }}
        transition={{ duration: 2, delay: 0.5 }}
      >
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#ec4899]/40 via-[#8b5cf6]/30 to-transparent rounded-full blur-3xl transform rotate-12 scale-150" />
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-0 w-2/3 h-2/3 opacity-40"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 0.4 }}
        transition={{ duration: 2, delay: 1 }}
      >
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-[#06b6d4]/50 via-[#8b5cf6]/30 to-transparent rounded-full blur-3xl transform -rotate-12" />
      </motion.div>

      {/* Curved flowing lines */}
      <motion.svg
        className="absolute inset-0 w-full h-full opacity-30"
        viewBox="0 0 1200 800"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 1.5 }}
      >
        <motion.path
          d="M 200,600 Q 400,200 800,400 T 1200,200"
          stroke="url(#heroGradient1)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 2, delay: 2 }}
        />
        <motion.path
          d="M 0,300 Q 300,100 600,300 T 1000,150"
          stroke="url(#heroGradient2)"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 2.5, delay: 2.5 }}
        />
        <defs>
          <linearGradient
            id="heroGradient1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient
            id="heroGradient2"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Navigation */}
      <motion.nav
        className="absolute top-0 left-0 right-0 z-20 p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            className="text-2xl font-bold text-white"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Gemeos
          </motion.div>

          <div className="hidden md:flex space-x-8">
            {[
              "Platform",
              "Solutions",
              "Resources",
              "About",
              "Contact",
            ].map((item, index) => (
              <motion.a
                key={item}
                href="#"
                className="text-white/80 hover:text-white transition-colors duration-200"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.1 * index,
                  duration: 0.5,
                }}
                whileHover={{ y: -2 }}
              >
                {item}
              </motion.a>
            ))}
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Bold typography inspired by "Your Brand Deserves Super Sonic" */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <motion.div className="space-y-4">
              <motion.h1
                className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  The Future
                </motion.span>
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  of Learning
                </motion.span>
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                >
                  is
                </motion.span>
                <motion.span
                  className="block bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.3 }}
                >
                  Personal.
                </motion.span>
              </motion.h1>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.8 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white px-8 py-4 text-lg shadow-2xl hover:shadow-[#06b6d4]/30 transition-all duration-300 hover:scale-105"
              >
                Request a Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-8 py-4 text-lg transition-all duration-300 hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" />
                See How It Works
              </Button>
            </motion.div>
          </motion.div>

          {/* Right side - Description text */}
          <motion.div
            className="space-y-6 lg:pl-12"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <motion.div
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
              whileHover={{
                y: -5,
                boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.p
                className="text-xl text-white/90 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                Gemeos helps schools and teachers with AI-driven
                tools that support educators and deliver
                adaptive, personalized learning across every
                classroom.
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </div>



      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-8 h-8 text-white/70" />
      </motion.div>
    </section>
  );
}