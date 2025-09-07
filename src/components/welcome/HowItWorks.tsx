import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Upload, Brain, Rocket } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: "Upload Content",
      description: "Simply upload your educational materials and let our AI analyze and structure the content for optimal learning."
    },
    {
      icon: Brain,
      title: "AI Processing",
      description: "Our advanced AI creates personalized learning paths, adaptive assessments, and interactive experiences."
    },
    {
      icon: Rocket,
      title: "Engage Students",
      description: "Students receive tailored content that adapts to their pace, style, and performance in real-time."
    }
  ];

  return (
    <section className="section-gradient-primary relative min-h-screen flex items-center justify-center px-4 text-white overflow-hidden">
      {/* Smooth transition gradients */}
      <div className="section-transition-top"></div>
      {/* Animated background shapes */}
      <motion.div
        className="absolute top-1/4 right-10 w-64 h-64 bg-gradient-to-r from-[#8b5cf6]/10 to-[#06b6d4]/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, -40, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 left-10 w-48 h-48 bg-gradient-to-r from-[#06b6d4]/10 to-[#8b5cf6]/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, 50, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-6xl mx-auto relative z-10 py-20">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your educational content into engaging, personalized learning experiences in three simple steps
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] transform -translate-y-1/2 z-0" />
          
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              
              return (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
                    {/* Step number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="text-center">
                      <motion.div
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#06b6d4]/20 to-[#8b5cf6]/20 rounded-full mb-6"
                        animate={
                          index === 0 
                            ? { y: [0, -5, 0] } 
                            : index === 1 
                            ? { scale: [1, 1.1, 1], rotate: [0, 5, 0] }
                            : { x: [0, 5, 0] }
                        }
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                      >
                        <Icon className="w-8 h-8 text-[#06b6d4]" />
                      </motion.div>
                      
                      <h3 className="text-2xl font-bold mb-4 text-white">{step.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{step.description}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="section-transition-bottom"></div>
    </section>
  );
}