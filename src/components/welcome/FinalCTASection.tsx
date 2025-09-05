import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { motion } from "motion/react";

export function FinalCTASection() {
  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl mb-6 text-slate-900">
            Ready to Build the Future of Learning?
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join forward-thinking educators who are already transforming their classrooms with Gemeos. 
            See how our AI-powered platform can revolutionize your teaching and boost student engagement.
          </p>
        </motion.div>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Button size="lg" className="px-10 py-6 text-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700">
            <Mail className="w-5 h-5 mr-2" />
            Request a Demo
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="outline" size="lg" className="px-10 py-6 text-lg border-slate-300 text-slate-700 hover:bg-slate-100">
            Schedule a Call
          </Button>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-200"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
              <div className="text-2xl">🚀</div>
            </div>
            <h4 className="mb-2 text-slate-900">Quick Setup</h4>
            <p className="text-sm text-slate-600">Get started in under 30 minutes</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
              <div className="text-2xl">🎯</div>
            </div>
            <h4 className="mb-2 text-slate-900">Proven Results</h4>
            <p className="text-sm text-slate-600">85% improvement in student engagement</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
              <div className="text-2xl">💬</div>
            </div>
            <h4 className="mb-2 text-slate-900">Expert Support</h4>
            <p className="text-sm text-slate-600">Dedicated customer success team</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
