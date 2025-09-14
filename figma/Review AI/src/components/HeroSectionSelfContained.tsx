import React from 'react';

// Self-contained icons
const PlayIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
  </svg>
);

const ChevronDownIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// Self-contained Button component
const Button = ({ 
  children, 
  onClick, 
  variant = "default",
  size = "default",
  className = "",
  ...props 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  variant?: "default" | "outline";
  size?: "default" | "lg";
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
  };
  const sizes = {
    default: "h-9 px-4 py-2",
    lg: "h-12 px-6 py-3"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export function HeroSectionSelfContained() {
  return (
    <section className="section-gradient-primary relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced brand-consistent gradient system */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e1b4b] via-[#4c46a0] via-50% to-[#030213]" />
      </div>
      
      {/* Smooth transition gradient to next section */}
      <div className="section-transition-bottom"></div>

      {/* Flowing gradient curves */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-60">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#ec4899]/40 via-[#8b5cf6]/30 to-transparent rounded-full blur-3xl transform rotate-12 scale-150" />
      </div>

      <div className="absolute bottom-0 left-0 w-2/3 h-2/3 opacity-40">
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-[#06b6d4]/50 via-[#8b5cf6]/30 to-transparent rounded-full blur-3xl transform -rotate-12" />
      </div>

      {/* Curved flowing lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        viewBox="0 0 1200 800"
      >
        <path
          d="M 200,600 Q 400,200 800,400 T 1200,200"
          stroke="url(#heroGradient1)"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M 0,300 Q 300,100 600,300 T 1000,150"
          stroke="url(#heroGradient2)"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
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
      </svg>

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-white hover:scale-105 transition-transform duration-300 cursor-pointer">
            Gemeos
          </div>

          <div className="hidden md:flex space-x-8">
            {[
              "Platform",
              "Solutions", 
              "Resources",
              "About",
              "Contact",
            ].map((item) => (
              <a
                key={item}
                href="#"
                className="text-white/80 hover:text-white hover:-translate-y-0.5 transition-all duration-200"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Bold typography */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
                <span className="block">The Future</span>
                <span className="block">of Learning</span>
                <span className="block">is</span>
                <span className="block bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
                  Personal.
                </span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
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
                <PlayIcon className="w-5 h-5 mr-2" />
                See How It Works
              </Button>
            </div>
          </div>

          {/* Right side - Description text */}
          <div className="space-y-6 lg:pl-12">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
              <p className="text-xl text-white/90 leading-relaxed">
                Gemeos helps schools and teachers with AI-driven
                tools that support educators and deliver
                adaptive, personalized learning across every
                classroom.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
        <ChevronDownIcon className="w-8 h-8 text-white/70" />
      </div>
    </section>
  );
}