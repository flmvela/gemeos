import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Self-contained icons
const PlayIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const UsersIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ClockIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingUpIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

// Self-contained Button component
const Button = ({ 
  children, 
  onClick, 
  size = "default",
  className = "",
  ...props 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  size?: "default" | "lg";
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50";
  const sizes = {
    default: "h-9 px-4 py-2",
    lg: "h-12 px-6 py-3"
  };
  
  return (
    <button 
      className={`${baseClasses} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export function DemoPreviewSelfContained() {
  return (
    <section className="section-gradient-secondary relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Smooth transition gradients */}
      <div className="section-transition-top"></div>
      <div className="section-transition-bottom"></div>
      
      {/* Brand-consistent gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030213] via-[#4c46a0] via-50% to-[#030213]" />
      </div>
      
      {/* Animated background shapes */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-gradient-to-r from-[#06b6d4]/10 to-[#8b5cf6]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-gradient-to-r from-[#8b5cf6]/10 to-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-7xl mx-auto py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Experience the{' '}
            <span className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
              Platform
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how Gemeos AI transforms traditional learning into engaging, personalized experiences
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Video Preview */}
          <div className="lg:col-span-8">
            <div className="relative group cursor-pointer">
              {/* Video thumbnail container */}
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-1 shadow-2xl border border-white/10 hover:shadow-3xl transition-all duration-300">
                <div className="relative overflow-hidden rounded-xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1636772523547-5577d04e8dc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlZHVjYXRpb24lMjB0ZWNobm9sb2d5JTIwZGFzaGJvYXJkfGVufDF8fHx8MTc1NzIzMDQwMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Platform Demo Preview"
                    className="w-full h-64 md:h-80 lg:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-full blur-xl opacity-75 animate-pulse" />
                      <Button
                        size="lg"
                        className="relative bg-white/90 backdrop-blur-sm text-[#030213] hover:bg-white w-20 h-20 rounded-full shadow-2xl group-hover:shadow-[#06b6d4]/30 transition-all duration-300 hover:scale-110"
                      >
                        <PlayIcon className="w-8 h-8 fill-current ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Duration badge */}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                    4:32
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#06b6d4]/20 to-[#8b5cf6]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-4 space-y-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Watch Gemeos in Action
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                Discover how our AI-powered platform creates personalized learning experiences, 
                adapts to student needs, and delivers measurable results in just minutes.
              </p>
            </div>

            {/* Key features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/8 hover:scale-102 transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Personalized Learning</h4>
                  <p className="text-sm text-gray-400">AI adapts to each student's pace</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/8 hover:scale-102 transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Real-time Analytics</h4>
                  <p className="text-sm text-gray-400">Instant progress tracking</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/8 hover:scale-102 transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-lg flex items-center justify-center">
                  <TrendingUpIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Engagement Boost</h4>
                  <p className="text-sm text-gray-400">85% improvement in retention</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div>
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white shadow-xl hover:shadow-2xl hover:shadow-[#06b6d4]/20 transition-all duration-300 hover:scale-105"
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}