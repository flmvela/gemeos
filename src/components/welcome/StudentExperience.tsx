import { motion, useInView } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

export function StudentExperience() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeKeys, setActiveKeys] = useState<number[]>([]);
  
  const pianoKeys = [
    { note: 'C', type: 'white', position: 0 },
    { note: 'C#', type: 'black', position: 1 },
    { note: 'D', type: 'white', position: 2 },
    { note: 'D#', type: 'black', position: 3 },
    { note: 'E', type: 'white', position: 4 },
    { note: 'F', type: 'white', position: 5 },
    { note: 'F#', type: 'black', position: 6 },
    { note: 'G', type: 'white', position: 7 },
    { note: 'G#', type: 'black', position: 8 },
    { note: 'A', type: 'white', position: 9 },
    { note: 'A#', type: 'black', position: 10 },
    { note: 'B', type: 'white', position: 11 },
  ];

  const sequence = [0, 2, 4, 5, 7, 9, 11]; // C major scale

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        sequence.forEach((keyIndex, sequenceIndex) => {
          setTimeout(() => {
            setActiveKeys(prev => [...prev, keyIndex]);
            setTimeout(() => {
              setActiveKeys(prev => prev.filter(k => k !== keyIndex));
            }, 500);
          }, sequenceIndex * 300);
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-white to-gray-50" ref={ref}>
      <div className="max-w-6xl mx-auto py-20">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#030213] mb-4">
            Interactive Learning Experience
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Watch how our platform makes complex concepts engaging and easy to understand
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Piano Keys Exercise */}
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200/50"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-[#030213] mb-2">Music Theory: C Major Scale</h3>
              <p className="text-gray-600">Interactive piano exercise with real-time feedback</p>
            </div>

            {/* Piano */}
            <div className="relative bg-gray-900 rounded-lg p-6 mb-6">
              <div className="flex justify-center items-end h-32 relative">
                {pianoKeys.map((key, index) => (
                  <motion.div
                    key={`${key.note}-${index}`}
                    className={`
                      ${key.type === 'white' 
                        ? 'bg-white border-2 border-gray-300 h-28 w-8 mx-px rounded-b-lg' 
                        : 'bg-gray-800 h-20 w-5 -mx-2 relative z-10 rounded-b-md'
                      }
                      ${activeKeys.includes(index) 
                        ? key.type === 'white' 
                          ? 'bg-gradient-to-b from-[#06b6d4] to-[#0891b2] border-[#06b6d4]' 
                          : 'bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed]'
                        : ''
                      }
                      cursor-pointer transition-all duration-200 shadow-lg
                    `}
                    whileHover={{ scale: key.type === 'white' ? 1.05 : 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={activeKeys.includes(index) ? 
                      { 
                        scale: [1, 1.1, 1],
                        boxShadow: key.type === 'white' 
                          ? "0 10px 30px rgba(6, 182, 212, 0.5)" 
                          : "0 10px 30px rgba(139, 92, 246, 0.5)"
                      } : {}
                    }
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      setActiveKeys(prev => prev.includes(index) 
                        ? prev.filter(k => k !== index)
                        : [...prev, index]
                      );
                      setTimeout(() => {
                        setActiveKeys(prev => prev.filter(k => k !== index));
                      }, 300);
                    }}
                  >
                    <span className={`
                      absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-medium
                      ${key.type === 'white' ? 'text-gray-700' : 'text-gray-300'}
                      ${activeKeys.includes(index) ? 'text-white' : ''}
                    `}>
                      {key.note}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* XP Badge */}
            <motion.div
              className="flex justify-center"
              animate={activeKeys.length > 0 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Badge className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white px-6 py-3 text-lg shadow-lg">
                <Trophy className="w-5 h-5 mr-2" />
                +50 XP
              </Badge>
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h3 className="text-3xl font-bold text-[#030213]">
              Gamified Learning That Motivates
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              Our platform transforms traditional lessons into interactive experiences. 
              Students earn points, unlock achievements, and progress through personalized 
              learning paths that adapt to their individual pace and style.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#06b6d4] rounded-full" />
                <span className="text-gray-700">Real-time progress tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#8b5cf6] rounded-full" />
                <span className="text-gray-700">Instant feedback and corrections</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#f59e0b] rounded-full" />
                <span className="text-gray-700">Achievement-based motivation</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}