import React from 'react';

// Self-contained icons
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

const UsersIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PhoneIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MapPinIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LinkedinIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const YoutubeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

// Self-contained components
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
  variant?: "default" | "ghost";
  size?: "default" | "lg";
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground"
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

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${className}`}>
    {children}
  </span>
);

export function ClosingCTASelfContained() {
  return (
    <section className="section-gradient-secondary relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Smooth transition gradient from previous section */}
      <div className="section-transition-top"></div>
      
      {/* Enhanced brand-consistent background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e1b4b] via-[#4c46a0] via-40% to-[#030213]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-60% to-[#030213]/80" />
      </div>

      {/* Flowing gradient curves */}
      <div className="absolute top-0 left-0 w-1/2 h-full opacity-50">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#06b6d4]/40 via-[#8b5cf6]/30 to-transparent rounded-full blur-3xl transform -rotate-12 scale-150" />
      </div>

      <div className="absolute bottom-0 right-0 w-2/3 h-2/3 opacity-30">
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-[#ec4899]/40 via-[#8b5cf6]/25 to-transparent rounded-full blur-3xl transform rotate-12" />
      </div>

      {/* Curved flowing lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1200 800"
      >
        <path
          d="M 0,400 Q 300,200 600,400 T 1200,300"
          stroke="url(#ctaGradient1)"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 200,600 Q 500,300 800,500 T 1200,400"
          stroke="url(#ctaGradient2)"
          strokeWidth="3"
          fill="none"
          opacity="0.4"
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
      </svg>

      {/* Animated floating shapes */}
      <div className="absolute top-1/4 right-1/3 w-32 h-32 bg-gradient-to-r from-[#06b6d4]/15 to-[#8b5cf6]/15 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-gradient-to-r from-[#8b5cf6]/15 to-[#ec4899]/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center text-white py-20">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          Ready to Build the{' '}
          <span className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
            Future of Learning?
          </span>
        </h2>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Join thousands of educators who are already transforming their classrooms with AI-powered learning
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
          <div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white px-10 py-4 text-lg shadow-2xl relative overflow-hidden group hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10">Request a Demo</span>
            </Button>
          </div>
          
          <div>
            <Button
              size="lg"
              variant="ghost"
              className="border-2 border-white/30 bg-transparent text-white hover:text-white hover:bg-white/10 backdrop-blur-sm px-10 py-4 text-lg hover:border-white/50 transition-all duration-300 hover:scale-105"
            >
              <PhoneIcon className="w-5 h-5 mr-2 text-white" />
              Schedule a Call
            </Button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6">
          <div>
            <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 text-base hover:scale-105 transition-transform duration-300 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-[#06b6d4]" />
              Quick Setup
            </Badge>
          </div>
          
          <div>
            <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 text-base hover:scale-105 transition-transform duration-300 flex items-center">
              <TrendingUpIcon className="w-5 h-5 mr-2 text-[#8b5cf6]" />
              Proven Results
            </Badge>
          </div>
          
          <div>
            <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 text-base hover:scale-105 transition-transform duration-300 flex items-center">
              <UsersIcon className="w-5 h-5 mr-2 text-[#f59e0b]" />
              Expert Support
            </Badge>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-20 pt-16 border-t border-white/10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-white/90 font-medium text-base">Company</h3>
              <div className="space-y-2 text-white/60">
                <p>© 2025 Gemeos Technologies Inc.</p>
                <div className="flex items-start gap-2">
                  <MapPinIcon className="w-4 h-4 mt-1 flex-shrink-0 text-[#06b6d4]" />
                  <div>
                    <p>Innovation District</p>
                    <p>San Francisco, CA 94103</p>
                    <p>United States</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-white/90 font-medium text-base">Contact</h3>
              <div className="space-y-3 text-white/60">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-[#8b5cf6]" />
                  <p>Tel: +1 (555) 123-4567</p>
                </div>
                <div className="flex items-center gap-2">
                  <MailIcon className="w-4 h-4 text-[#06b6d4]" />
                  <p>hello@gemeos.ai</p>
                </div>
                <div className="text-xs space-y-1">
                  <p>Business License: AI-EDU-2025-SF</p>
                  <p>Tax ID: 94-1234567</p>
                </div>
              </div>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h3 className="text-white/90 font-medium text-base">Legal</h3>
              <div className="space-y-2">
                <a
                  href="#"
                  className="block text-white/60 hover:text-white/90 hover:translate-x-1 transition-all duration-200"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="block text-white/60 hover:text-white/90 hover:translate-x-1 transition-all duration-200"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="block text-white/60 hover:text-white/90 hover:translate-x-1 transition-all duration-200"
                >
                  Cookie Policy
                </a>
                <a
                  href="#"
                  className="block text-white/60 hover:text-white/90 hover:translate-x-1 transition-all duration-200"
                >
                  Data Protection
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h3 className="text-white/90 font-medium text-base">Follow Us</h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center gap-3 text-white/60 hover:text-white/90 hover:translate-x-1 transition-all duration-200"
                >
                  <LinkedinIcon className="w-5 h-5 text-[#0077B5]" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 text-white/60 hover:text-white/90 hover:translate-x-1 transition-all duration-200"
                >
                  <YoutubeIcon className="w-5 h-5 text-[#FF0000]" />
                  <span>YouTube</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 text-white/60 hover:text-white/90 hover:translate-x-1 transition-all duration-200"
                >
                  <InstagramIcon className="w-5 h-5 text-[#E4405F]" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-white/40 text-xs">
              Built with passion for education • Transforming learning through AI • All rights reserved
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}