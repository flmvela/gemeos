import React from 'react';

// Self-contained icons
const BrainIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ZapIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const SparklesIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

// Self-contained Badge component
const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${className}`}>
    {children}
  </span>
);

export function FutureOfLearningSelfContained() {
  return (
    <section className="section-gradient-secondary relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Smooth transition gradients */}
      <div className="section-transition-top"></div>
      
      {/* Brand-consistent gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030213] via-[#4c46a0] via-50% to-[#14112e]" />
      </div>

      {/* Abstract flowing shapes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 opacity-30 animate-pulse">
        <div className="w-full h-full bg-gradient-to-r from-[#ec4899] to-[#06b6d4] rounded-full blur-3xl" />
      </div>

      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 opacity-20 animate-pulse" style={{ animationDelay: "2s" }}>
        <div className="w-full h-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded-full blur-3xl" />
      </div>

      {/* Curved flow lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1200 800"
      >
        <path
          d="M 0,400 Q 300,200 600,400 T 1200,300"
          stroke="url(#gradient1)"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 0,500 Q 400,250 800,450 T 1200,350"
          stroke="url(#gradient2)"
          strokeWidth="3"
          fill="none"
          opacity="0.4"
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
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Main Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white px-4 py-2 text-sm flex items-center w-fit">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Next Generation Education
              </Badge>
              
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
                <span className="block">Learning</span>
                <span className="block">Deserves</span>
                <span className="block bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
                  Super AI.
                </span>
              </h2>
            </div>

            {/* Floating feature badges */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20 hover:scale-105 hover:-translate-y-1 transition-all duration-300">
                <BrainIcon className="w-5 h-5 text-[#06b6d4] mr-2" />
                <span className="text-white text-sm">AI-Powered</span>
              </div>
              
              <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20 hover:scale-105 hover:-translate-y-1 transition-all duration-300">
                <ZapIcon className="w-5 h-5 text-[#f59e0b] mr-2" />
                <span className="text-white text-sm">Lightning Fast</span>
              </div>
              
              <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20 hover:scale-105 hover:-translate-y-1 transition-all duration-300">
                <SparklesIcon className="w-5 h-5 text-[#ec4899] mr-2" />
                <span className="text-white text-sm">Personalized</span>
              </div>
            </div>
          </div>

          {/* Right Side Content */}
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-4">
                Revolutionizing Education
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                Gemeos AI transforms traditional learning into dynamic, personalized experiences. 
                Our platform adapts in real-time, creating unique pathways for every student while 
                maintaining engagement through cutting-edge interactive technologies.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-full" />
                  <span className="text-gray-300">Adaptive learning algorithms</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded-full" />
                  <span className="text-gray-300">Real-time performance insights</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#ec4899] to-[#f59e0b] rounded-full" />
                  <span className="text-gray-300">Immersive interactive content</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1 hover:scale-110 transition-transform duration-300">
                  95%
                </div>
                <div className="text-sm text-gray-400">Engagement Rate</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1 hover:scale-110 transition-transform duration-300">
                  3x
                </div>
                <div className="text-sm text-gray-400">Faster Learning</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1 hover:scale-110 transition-transform duration-300">
                  100K+
                </div>
                <div className="text-sm text-gray-400">Students</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </div>
      
      <div className="section-transition-bottom"></div>
    </section>
  );
}