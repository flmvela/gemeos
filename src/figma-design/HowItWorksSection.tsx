import { Upload, Brain, Settings } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { motion } from "motion/react";

export function HowItWorksSection() {
  const steps = [
    {
      icon: Upload,
      title: "Upload Your Content",
      description: "Simply upload your existing materials - PDFs, videos, presentations, and more. Our platform supports all major educational content formats.",
      gradient: "from-sky-100 to-cyan-100"
    },
    {
      icon: Brain,
      title: "AI Generates the Curriculum",
      description: "Our advanced AI analyzes your content to automatically create structured concept maps, learning goals, and interactive exercises.",
      gradient: "from-cyan-100 to-teal-100"
    },
    {
      icon: Settings,
      title: "Manage and Personalize",
      description: "Review, edit, and customize the AI-generated curriculum. Fine-tune learning paths to match your teaching style and student needs.",
      gradient: "from-teal-100 to-emerald-100"
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
          <h2 className="text-4xl md:text-5xl mb-6 text-slate-900">How It Works</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Transform your educational content into engaging, personalized learning experiences in three simple steps.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection lines for desktop */}
          <div className="hidden md:block absolute top-1/2 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-sky-300 via-cyan-400 to-teal-400 -translate-y-1/2 z-0"></div>
          
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="relative z-10 border border-slate-200 hover:border-sky-300 transition-colors group bg-white hover:shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform border border-slate-200`}>
                      <IconComponent className="w-8 h-8 text-sky-600" />
                    </div>
                    <h3 className="text-xl mb-4 text-slate-900">{step.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{step.description}</p>
                    
                    {/* Step number */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
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