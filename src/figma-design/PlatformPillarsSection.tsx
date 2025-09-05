import { Card, CardContent } from "./ui/card";
import { TrendingUp, Sparkles, Trophy, BarChart3 } from "lucide-react";
import { motion } from "motion/react";

export function PlatformPillarsSection() {
  const pillars = [
    {
      icon: TrendingUp,
      title: "Adaptive Learning Paths",
      description: "Our AI analyzes student performance in real-time to create unique learning journeys that adapt to each learner's pace and style.",
      gradient: "from-sky-50 to-cyan-50",
      iconColor: "text-sky-600"
    },
    {
      icon: Sparkles,
      title: "Intelligent Content Creation",
      description: "Automatically generate learning goals, interactive exercises, and personalized feedback from your existing educational materials.",
      gradient: "from-cyan-50 to-teal-50",
      iconColor: "text-cyan-600"
    },
    {
      icon: Trophy,
      title: "Engaging Gamification",
      description: "Keep students motivated with achievement badges, progress tracking, leaderboards, and interactive challenges that make learning fun.",
      gradient: "from-amber-50 to-orange-50",
      iconColor: "text-amber-600"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get deep insights into student progress, identify learning gaps, and make data-driven decisions to improve educational outcomes.",
      gradient: "from-teal-50 to-emerald-50",
      iconColor: "text-teal-600"
    }
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl mb-6 text-slate-900">Platform Pillars</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Built on cutting-edge AI technology, Gemeos delivers powerful features 
            that transform how educational content is created and consumed.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, index) => {
            const IconComponent = pillar.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border border-slate-200 hover:border-sky-300">
                  <CardContent className="p-6 text-center h-full flex flex-col">
                    <div className={`w-16 h-16 bg-gradient-to-br ${pillar.gradient} border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <IconComponent className={`w-8 h-8 ${pillar.iconColor}`} />
                    </div>
                    <h3 className="text-xl mb-4 flex-grow-0 text-slate-900">{pillar.title}</h3>
                    <p className="text-slate-600 leading-relaxed flex-grow">{pillar.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}