import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { CheckCircle, Music, Star, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function StudentExperienceSection() {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
  };

  const answers = [
    { id: "a", text: "C - E - G", correct: true },
    { id: "b", text: "C - F - A", correct: false },
    { id: "c", text: "D - F# - A", correct: false },
    { id: "d", text: "E - G# - B", correct: false }
  ];

  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl mb-6 text-slate-900">The Student Experience</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            See how Gemeos transforms learning into an engaging, interactive journey. 
            Try this sample music theory lesson below.
          </p>
        </motion.div>
        
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden shadow-xl border border-slate-200 bg-white">
            <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Music className="w-6 h-6" />
                  <h3 className="text-xl">Music Theory: Harmonized Scales</h3>
                </div>
                <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                  <Star className="w-5 h-5 fill-current text-amber-300" />
                  <span>124 XP</span>
                </div>
              </div>
              <Progress value={65} className="w-full bg-white/20" />
              <p className="text-sm mt-2 opacity-90">Lesson 3 of 8 • 65% Complete</p>
            </div>
            
            <CardContent className="p-8">
              <div className="mb-8">
                <h4 className="text-2xl mb-4 text-slate-900">Understanding Major Triads</h4>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  A major triad consists of three notes: the root, major third, and perfect fifth. 
                  Let's practice identifying the notes in a C major triad.
                </p>
                
                {/* Interactive Piano Keys Visualization */}
                <div className="bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg p-6 mb-6 border border-slate-300">
                  <div className="flex justify-center items-end space-x-1 mb-4">
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((note, index) => {
                      const isBlack = note.includes('#');
                      const isHighlighted = ['C', 'E', 'G'].includes(note);
                      return (
                        <div
                          key={note}
                          className={`
                            ${isBlack ? 'bg-slate-800 text-white h-12 w-6 -mx-1 z-10' : 'bg-white border border-slate-300 h-20 w-8 text-slate-800'}
                            ${isHighlighted ? (isBlack ? 'bg-sky-600' : 'bg-sky-100 border-sky-500') : ''}
                            flex items-end justify-center pb-2 text-xs transition-colors cursor-pointer hover:bg-slate-50
                          `}
                        >
                          {!isBlack && note}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-center text-sm text-slate-600">
                    Highlighted keys show the C major triad
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h5 className="text-lg text-slate-900">Which notes make up a C major triad?</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {answers.map((answer) => (
                    <Button
                      key={answer.id}
                      variant={selectedAnswer === answer.id ? (answer.correct ? "default" : "destructive") : "outline"}
                      className={`p-4 h-auto justify-start ${
                        showResult && answer.correct ? "bg-emerald-50 border-emerald-500 text-emerald-700 hover:bg-emerald-50" : ""
                      }`}
                      onClick={() => handleAnswerSelect(answer.id)}
                      disabled={showResult}
                    >
                      <span className="mr-3">
                        {answer.id.toUpperCase()}.
                      </span>
                      {answer.text}
                      {showResult && answer.correct && (
                        <CheckCircle className="w-5 h-5 ml-auto text-emerald-600" />
                      )}
                    </Button>
                  ))}
                </div>
                
                {showResult && (
                  <motion.div 
                    className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-800">Excellent work!</span>
                    </div>
                    <p className="text-emerald-700 text-sm">
                      That's correct! A C major triad consists of C (root), E (major third), and G (perfect fifth).
                    </p>
                  </motion.div>
                )}
                
                {showResult && (
                  <Button className="w-full mt-6 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700" size="lg">
                    Continue to Next Concept
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}