import React from 'react';

// Self-contained icons
const RouteIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const LightbulbIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const TrophyIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const BarChart3Icon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

// Self-contained Card component
const Card = ({ children, className = "", style = {}, onMouseEnter, onMouseLeave }: { 
  children: React.ReactNode; 
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}) => (
  <div 
    className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
    style={style}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </div>
);

export function PlatformPillarsSelfContained() {
  const pillars = [
    {
      icon: RouteIcon,
      title: "Adaptive Learning Paths",
      description: "AI-powered personalization that adjusts to each student's learning style, pace, and preferences.",
      color: "from-[#06b6d4] to-[#0891b2]",
      hoverColor: "group-hover:shadow-[#06b6d4]/20"
    },
    {
      icon: LightbulbIcon,
      title: "Intelligent Content Creation",
      description: "Automatically generate quizzes, exercises, and interactive materials from your existing content.",
      color: "from-[#8b5cf6] to-[#7c3aed]",
      hoverColor: "group-hover:shadow-[#8b5cf6]/20"
    },
    {
      icon: TrophyIcon,
      title: "Gamification",
      description: "Motivate students with achievements, leaderboards, and progress tracking that makes learning fun.",
      color: "from-[#f59e0b] to-[#d97706]",
      hoverColor: "group-hover:shadow-[#f59e0b]/20"
    },
    {
      icon: BarChart3Icon,
      title: "Advanced Analytics",
      description: "Comprehensive insights into learning patterns, performance metrics, and areas for improvement.",
      color: "from-[#ef4444] to-[#dc2626]",
      hoverColor: "group-hover:shadow-[#ef4444]/20"
    }
  ];

  return (
    <section className="section-gradient-primary relative min-h-screen flex items-center justify-center px-4">
      {/* Smooth transition gradients */}
      <div className="section-transition-top"></div>
      
      <div className="max-w-7xl mx-auto py-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Platform Pillars
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Four core features that make Gemeos the most powerful AI-driven learning platform
          </p>
        </div>

        {/* Connecting line similar to How It Works timeline */}
        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] via-[#ec4899] to-[#f59e0b] transform -translate-y-1/2 z-0 opacity-30" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            
            return (
              <div key={index} className="group relative">
                <Card 
                  className="h-full p-8 bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-2 relative"
                >
                  {/* Step number - positioned exactly like How It Works */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  
                  <div className="text-center">
                    
                    <div className={`
                        inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6
                        bg-gradient-to-r ${pillar.color} text-white shadow-lg
                        hover:scale-110 transition-all duration-300
                      `}>
                      <Icon className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#06b6d4] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {pillar.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Accent border - now more subtle on dark cards */}
                  <div className={`
                    absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${pillar.color} 
                    transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-lg opacity-80
                  `} />
                  
                  {/* Subtle glow effect on hover */}
                  <div className={`
                    absolute -inset-0.5 bg-gradient-to-r ${pillar.color} rounded-xl blur-sm opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10
                  `} />
                </Card>
              </div>
            );
          })}
          </div>
        </div>
      </div>
      
      <div className="section-transition-bottom"></div>
    </section>
  );
}