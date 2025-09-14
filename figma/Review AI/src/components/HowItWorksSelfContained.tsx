import React from 'react';

// Self-contained icons
const UploadIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const BrainIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const RocketIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// Self-contained Card component
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

export function HowItWorksSelfContained() {
  const steps = [
    {
      icon: UploadIcon,
      title: "Upload Content",
      description: "Simply upload your educational materials and let our AI analyze and structure the content for optimal learning."
    },
    {
      icon: BrainIcon,
      title: "AI Processing", 
      description: "Our advanced AI creates personalized learning paths, adaptive assessments, and interactive experiences."
    },
    {
      icon: RocketIcon,
      title: "Engage Students",
      description: "Students receive tailored content that adapts to their pace, style, and performance in real-time."
    }
  ];

  return (
    <section className="section-gradient-primary relative min-h-screen flex items-center justify-center px-4 text-white overflow-hidden">
      {/* Smooth transition gradients */}
      <div className="section-transition-top"></div>
      
      {/* Animated background shapes */}
      <div className="absolute top-1/4 right-10 w-64 h-64 bg-gradient-to-r from-[#8b5cf6]/10 to-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-10 w-48 h-48 bg-gradient-to-r from-[#06b6d4]/10 to-[#8b5cf6]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="max-w-6xl mx-auto relative z-10 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your educational content into engaging, personalized learning experiences in three simple steps
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] transform -translate-y-1/2 z-0" />
          
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              
              return (
                <div key={index} className="relative">
                  <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2">
                    {/* Step number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#06b6d4]/20 to-[#8b5cf6]/20 rounded-full mb-6 hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-[#06b6d4]" />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-4 text-white">{step.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{step.description}</p>
                    </div>
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