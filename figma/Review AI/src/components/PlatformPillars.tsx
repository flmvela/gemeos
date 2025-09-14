import { motion } from 'motion/react';
import { Card } from './ui/card';
import { Route, Lightbulb, Trophy, BarChart3 } from 'lucide-react';

export function PlatformPillars() {
  const pillars = [
    {
      icon: Route,
      title: "Adaptive Learning Paths",
      description: "AI-powered personalization that adjusts to each student's learning style, pace, and preferences.",
      color: "from-[#06b6d4] to-[#0891b2]",
      hoverColor: "group-hover:shadow-[#06b6d4]/20"
    },
    {
      icon: Lightbulb,
      title: "Intelligent Content Creation",
      description: "Automatically generate quizzes, exercises, and interactive materials from your existing content.",
      color: "from-[#8b5cf6] to-[#7c3aed]",
      hoverColor: "group-hover:shadow-[#8b5cf6]/20"
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Motivate students with achievements, leaderboards, and progress tracking that makes learning fun.",
      color: "from-[#f59e0b] to-[#d97706]",
      hoverColor: "group-hover:shadow-[#f59e0b]/20"
    },
    {
      icon: BarChart3,
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
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Platform Pillars
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Four core features that make Gemeos the most powerful AI-driven learning platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            
            return (
              <motion.div
                key={index}
                className="group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card 
                  className={`
                    h-full p-8 bg-white border border-gray-200/50 
                    hover:border-gray-300 transition-all duration-300 cursor-pointer
                    hover:shadow-2xl ${pillar.hoverColor}
                    transform hover:-translate-y-2
                  `}
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                  onMouseEnter={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'perspective(1000px) rotateX(5deg) rotateY(5deg) translateY(-8px)';
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
                  }}
                >
                  <div className="text-center">
                    <motion.div
                      className={`
                        inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6
                        bg-gradient-to-r ${pillar.color} text-white shadow-lg
                      `}
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, -5, 5, 0],
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Icon className="w-8 h-8" />
                    </motion.div>
                    
                    <h3 className="text-xl font-bold text-[#030213] mb-4 group-hover:bg-gradient-to-r group-hover:from-[#030213] group-hover:to-[#06b6d4] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {pillar.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Accent border */}
                  <div className={`
                    absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${pillar.color} 
                    transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-lg
                  `} />
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <div className="section-transition-bottom"></div>
    </section>
  );
}