import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Route, Lightbulb, Trophy, BarChart3 } from 'lucide-react';

export function PlatformPillars() {
  const pillars = [
    {
      icon: Route,
      title: 'Adaptive Learning Paths',
      description:
        "AI-powered personalization that adjusts to each student's learning style, pace, and preferences.",
      gradient: 'from-[#06b6d4] to-[#8b5cf6]',
    },
    {
      icon: Lightbulb,
      title: 'Intelligent Content Creation',
      description:
        'Automatically generate quizzes, exercises, and interactive materials from your existing content.',
      gradient: 'from-[#8b5cf6] to-[#ec4899]',
    },
    {
      icon: Trophy,
      title: 'Gamification',
      description:
        'Motivate students with achievements, leaderboards, and progress tracking that makes learning fun.',
      gradient: 'from-[#f59e0b] to-[#d97706]',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description:
        'Comprehensive insights into learning patterns, performance metrics, and areas for improvement.',
      gradient: 'from-[#ef4444] to-[#dc2626]',
    },
  ];

  return (
    <section
      className="
        relative
        py-24
        overflow-hidden
        /* Dark hero-like backdrop */
        bg-[radial-gradient(1200px_600px_at_50%_0%,rgba(139,92,246,0.18),transparent_60%)]
        before:absolute before:inset-0 before:bg-gradient-to-b before:from-[#1e1b4b] before:via-[#1e1b4b] before:via-40% before:to-[#14112e]
        before:-z-10
      "
    >
      {/* Soft ambient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[44rem] w-[44rem] rounded-full bg-[#8b5cf6]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[36rem] w-[36rem] rounded-full bg-[#06b6d4]/20 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Platform Pillars
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
            Four core features that make Gemeos the most powerful AI-driven learning platform
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group"
              >
                <Card
                  className="
                    h-full p-8
                    bg-white/5
                    border border-white/10
                    backdrop-blur-md
                    rounded-2xl
                    shadow-[0_10px_40px_rgba(0,0,0,0.25)]
                    transition-transform duration-300 hover:-translate-y-1.5
                  "
                >
                  <div className="text-center">
                    <div
                      className={`
                        inline-flex items-center justify-center
                        w-16 h-16 rounded-xl mb-6
                        text-white shadow-lg
                        bg-gradient-to-r ${p.gradient}
                      `}
                    >
                      <Icon className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-3">
                      {p.title}
                    </h3>

                    <p className="text-white/70 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Accent underline on hover */}
                    <div
                      className={`
                        mt-6 h-1 rounded-full
                        bg-gradient-to-r ${p.gradient}
                        transform scale-x-0 group-hover:scale-x-100
                        transition-transform duration-300 origin-left
                      `}
                    />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}