import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

type AnimationPhase = 'idle-bottom' | 'crawl-to-stand' | 'climb-to-walk' | 'climb-to-talk' | 'climb-to-grow' | 'celebrate';

export function MilestoneStaircase() {
  const [phase, setPhase] = useState<AnimationPhase>('idle-bottom');
  const [showLabel, setShowLabel] = useState(0);

  useEffect(() => {
    const timeline = [
      { phase: 'idle-bottom' as AnimationPhase, duration: 1000, label: 0 },
      { phase: 'crawl-to-stand' as AnimationPhase, duration: 2000, label: 1 },
      { phase: 'climb-to-walk' as AnimationPhase, duration: 2000, label: 2 },
      { phase: 'climb-to-talk' as AnimationPhase, duration: 2000, label: 3 },
      { phase: 'climb-to-grow' as AnimationPhase, duration: 2000, label: 4 },
      { phase: 'celebrate' as AnimationPhase, duration: 2000, label: 4 },
    ];

    let currentIndex = 0;
    
    const runTimeline = () => {
      if (currentIndex < timeline.length) {
        const current = timeline[currentIndex];
        setPhase(current.phase);
        setShowLabel(current.label);
        
        setTimeout(() => {
          currentIndex++;
          if (currentIndex >= timeline.length) {
            currentIndex = 0;
          }
          runTimeline();
        }, current.duration);
      }
    };

    runTimeline();
  }, []);

  // Step positions
  const steps = [
    { x: 100, y: 480, label: "3-9 months", width: 140, milestone: "Crawling" },
    { x: 200, y: 390, label: "9-12 months", width: 140, milestone: "Standing" },
    { x: 300, y: 300, label: "12-18 months", width: 140, milestone: "Walking" },
    { x: 400, y: 210, label: "18-24 months", width: 140, milestone: "Talking" },
    { x: 500, y: 120, label: "2-5 years", width: 140, milestone: "Growth" },
  ];

  // Character position based on phase
  const getCharacterPosition = () => {
    switch(phase) {
      case 'idle-bottom':
        return { x: 170, y: 480, scale: 0.6 };
      case 'crawl-to-stand':
        return { x: 270, y: 390, scale: 0.75 };
      case 'climb-to-walk':
        return { x: 370, y: 300, scale: 0.9 };
      case 'climb-to-talk':
        return { x: 470, y: 210, scale: 1.05 };
      case 'climb-to-grow':
      case 'celebrate':
        return { x: 570, y: 120, scale: 1.2 };
      default:
        return { x: 170, y: 480, scale: 0.6 };
    }
  };

  const charPos = getCharacterPosition();

  return (
    <div className="w-full h-full relative bg-white">
      <svg
        viewBox="0 0 700 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Wooden ladder steps - hand-drawn style */}
        {steps.map((step, i) => (
          <g key={i}>
            {/* Step platform */}
            <motion.rect
              x={step.x}
              y={step.y}
              width={step.width}
              height={12}
              rx={2}
              fill="#fed7aa"
              stroke="#92400e"
              strokeWidth={2.5}
              initial={{ opacity: 0, y: step.y + 20 }}
              animate={{ opacity: 1, y: step.y }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
            {/* Wood grain lines */}
            <line x1={step.x + 20} y1={step.y + 6} x2={step.x + 60} y2={step.y + 6} stroke="#d97706" strokeWidth={1} opacity={0.3} />
            <line x1={step.x + 80} y1={step.y + 6} x2={step.x + 120} y2={step.y + 6} stroke="#d97706" strokeWidth={1} opacity={0.3} />
            
            {/* Connecting vertical post (ladder side) */}
            {i < steps.length - 1 && (
              <>
                <line 
                  x1={step.x + step.width - 10} 
                  y1={step.y + 12} 
                  x2={steps[i + 1].x + steps[i + 1].width - 10} 
                  y2={steps[i + 1].y} 
                  stroke="#92400e" 
                  strokeWidth={2.5}
                  opacity={0.4}
                  strokeDasharray="5,3"
                />
              </>
            )}

            {/* Age label */}
            <motion.text
              x={step.x + step.width / 2}
              y={step.y + 35}
              textAnchor="middle"
              fill="#78350f"
              fontSize={11}
              fontFamily="Comic Sans MS, cursive"
              initial={{ opacity: 0 }}
              animate={{ opacity: showLabel >= i ? 0.7 : 0.3 }}
              transition={{ duration: 0.5 }}
            >
              {step.label}
            </motion.text>
          </g>
        ))}

        {/* Floating sparkle */}
        <motion.g
          animate={{
            y: [0, -10, 0],
            rotate: [0, 15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M 620 80 L 625 95 L 640 100 L 625 105 L 620 120 L 615 105 L 600 100 L 615 95 Z"
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={620} cy={100} r={3} fill="#fbbf24" opacity={0.6} />
        </motion.g>

        {/* Growth arrow at top */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: phase === 'celebrate' ? 1 : 0,
            y: phase === 'celebrate' ? [0, -8, 0] : 20
          }}
          transition={{
            opacity: { duration: 0.5 },
            y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <line x1={660} y1={200} x2={660} y2={100} stroke="#ea580c" strokeWidth={3} strokeLinecap="round" />
          <path d="M 652 108 L 660 95 L 668 108" stroke="#ea580c" strokeWidth={3} strokeLinecap="round" fill="none" />
          <motion.text
            x={660}
            y={85}
            textAnchor="middle"
            fill="#ea580c"
            fontSize={16}
            fontFamily="Comic Sans MS, cursive"
            fontWeight="600"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            Growth
          </motion.text>
        </motion.g>

        {/* Animated stick figure character */}
        <motion.g
          animate={{
            x: charPos.x,
            y: charPos.y,
          }}
          transition={{
            duration: 1.5,
            ease: [0.43, 0.13, 0.23, 0.96] // Custom easing for climbing
          }}
        >
          <g transform={`scale(${charPos.scale})`}>
            {/* Idle breathing at bottom */}
            {phase === 'idle-bottom' && (
              <motion.g
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Baby crawling position */}
                <circle cx={0} cy={-15} r={14} fill="none" stroke="#78350f" strokeWidth={2.5} />
                <circle cx={-4} cy={-17} r={2} fill="#78350f" />
                <circle cx={4} cy={-17} r={2} fill="#78350f" />
                <path d="M -5 -10 Q 0 -8 5 -10" stroke="#78350f" strokeWidth={2} fill="none" strokeLinecap="round" />
                <ellipse cx={0} cy={8} rx={16} ry={10} fill="none" stroke="#78350f" strokeWidth={2.5} />
                <path d="M -14 5 Q -20 8 -22 15" stroke="#78350f" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                <path d="M 14 5 Q 20 8 22 15" stroke="#78350f" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                <path d="M -8 15 L -10 22" stroke="#78350f" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                <path d="M 8 15 L 10 22" stroke="#78350f" strokeWidth={2.5} strokeLinecap="round" fill="none" />
              </motion.g>
            )}

            {/* Crawling and pulling up to stand */}
            {phase === 'crawl-to-stand' && (
              <motion.g
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                <circle cx={0} cy={-20} r={15} fill="none" stroke="#78350f" strokeWidth={2.5} />
                <circle cx={-4} cy={-22} r={2} fill="#78350f" />
                <circle cx={4} cy={-22} r={2} fill="#78350f" />
                <path d="M -5 -15 Q 0 -12 5 -15" stroke="#78350f" strokeWidth={2} fill="none" strokeLinecap="round" />
                
                {/* Body pulling up */}
                <motion.path
                  d="M 0 -5 Q 0 5 0 15"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: "M 0 -5 Q -2 5 0 18" }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                />
                
                {/* Arms reaching/pulling */}
                <motion.path
                  d="M 0 0 Q -8 -2 -15 2"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: "M 0 0 Q -8 -4 -15 0" }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.path
                  d="M 0 0 Q 8 -2 15 2"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: "M 0 0 Q 8 -4 15 0" }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse", delay: 0.3 }}
                />
                
                {/* Legs */}
                <motion.path
                  d="M 0 15 Q -3 25 -4 32"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <motion.path
                  d="M 0 15 Q 3 25 4 32"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <ellipse cx={-4} cy={35} rx={4} ry={2} fill="#78350f" />
                <ellipse cx={4} cy={35} rx={4} ry={2} fill="#78350f" />
              </motion.g>
            )}

            {/* Actively climbing to walk */}
            {phase === 'climb-to-walk' && (
              <motion.g
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
              >
                <circle cx={0} cy={-25} r={16} fill="none" stroke="#78350f" strokeWidth={2.5} />
                <circle cx={-4} cy={-27} r={2.5} fill="#78350f" />
                <circle cx={4} cy={-27} r={2.5} fill="#78350f" />
                <path d="M -6 -20 Q 0 -17 6 -20" stroke="#78350f" strokeWidth={2} fill="none" strokeLinecap="round" />
                
                <path d="M 0 -9 L 0 15" stroke="#78350f" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                
                {/* Arms climbing - hand over hand */}
                <motion.path
                  d="M 0 -5 Q -10 -12 -18 -8"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: ["M 0 -5 Q -10 -12 -18 -8", "M 0 -5 Q -10 -18 -18 -15", "M 0 -5 Q -10 -12 -18 -8"] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.path
                  d="M 0 -5 Q 10 -8 18 -5"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: ["M 0 -5 Q 10 -8 18 -5", "M 0 -5 Q 10 -15 18 -12", "M 0 -5 Q 10 -8 18 -5"] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                />
                
                {/* Legs lifting */}
                <motion.path
                  d="M 0 15 Q -4 25 -5 35"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: ["M 0 15 Q -4 25 -5 35", "M 0 15 Q -6 20 -8 28", "M 0 15 Q -4 25 -5 35"] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.path
                  d="M 0 15 Q 4 25 5 35"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: ["M 0 15 Q 4 25 5 35", "M 0 15 Q 6 20 8 28", "M 0 15 Q 4 25 5 35"] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                />
                
                <ellipse cx={-5} cy={38} rx={5} ry={2.5} fill="#78350f" />
                <ellipse cx={5} cy={38} rx={5} ry={2.5} fill="#78350f" />
              </motion.g>
            )}

            {/* Climbing to talk */}
            {phase === 'climb-to-talk' && (
              <motion.g
                animate={{ y: [3, -3, 3] }}
                transition={{ duration: 1, ease: "easeInOut", repeat: Infinity }}
              >
                <circle cx={0} cy={-28} r={17} fill="none" stroke="#78350f" strokeWidth={2.5} />
                <circle cx={-5} cy={-30} r={2.5} fill="#78350f" />
                <circle cx={5} cy={-30} r={2.5} fill="#78350f" />
                <motion.ellipse
                  cx={0}
                  cy={-22}
                  rx={4}
                  ry={3}
                  fill="none"
                  stroke="#78350f"
                  strokeWidth={2}
                  animate={{ ry: [3, 5, 3] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                
                <path d="M 0 -11 L 0 18" stroke="#78350f" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                
                {/* Arms pulling up */}
                <motion.path
                  d="M 0 -5 Q -12 -10 -20 -6"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: ["M 0 -5 Q -12 -10 -20 -6", "M 0 -5 Q -12 -15 -20 -12", "M 0 -5 Q -12 -10 -20 -6"] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.path
                  d="M 0 -5 Q 12 -10 20 -6"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: ["M 0 -5 Q 12 -10 20 -6", "M 0 -5 Q 12 -15 20 -12", "M 0 -5 Q 12 -10 20 -6"] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                />
                
                {/* Legs climbing */}
                <motion.path
                  d="M 0 18 Q -5 30 -6 40"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <motion.path
                  d="M 0 18 Q 5 30 6 40"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                
                <ellipse cx={-6} cy={43} rx={5} ry={2.5} fill="#78350f" />
                <ellipse cx={6} cy={43} rx={5} ry={2.5} fill="#78350f" />
                
                {/* Speech bubble */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <path
                    d="M 25 -35 Q 28 -40 35 -40 L 48 -40 Q 55 -40 55 -33 L 55 -23 Q 55 -16 48 -16 L 30 -16 L 25 -12 L 25 -16 Q 18 -16 18 -23 L 18 -33 Q 18 -40 25 -40"
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <text x={36} y={-25} textAnchor="middle" fill="#ea580c" fontSize={13} fontFamily="Comic Sans MS, cursive">
                    Hi!
                  </text>
                </motion.g>
              </motion.g>
            )}

            {/* Final climb to growth */}
            {(phase === 'climb-to-grow' || phase === 'celebrate') && (
              <motion.g
                animate={phase === 'celebrate' ? { y: [0, -8, 0] } : { y: [2, -2, 2] }}
                transition={phase === 'celebrate' ? 
                  { duration: 0.6, repeat: Infinity, ease: "easeInOut" } :
                  { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <circle cx={0} cy={-32} r={18} fill="none" stroke="#78350f" strokeWidth={2.5} />
                <circle cx={-5} cy={-34} r={3} fill="#78350f" />
                <circle cx={5} cy={-34} r={3} fill="#78350f" />
                <path d="M -7 -26 Q 0 -22 7 -26" stroke="#78350f" strokeWidth={2.5} fill="none" strokeLinecap="round" />
                
                <path d="M 0 -14 L 0 20" stroke="#78350f" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                
                {/* Arms raised triumphantly */}
                <motion.path
                  d="M 0 -10 Q -12 -18 -15 -28"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={phase === 'celebrate' ? { d: "M 0 -10 Q -12 -22 -15 -32" } : {}}
                  transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.path
                  d="M 0 -10 Q 12 -18 15 -28"
                  stroke="#78350f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  animate={phase === 'celebrate' ? { d: "M 0 -10 Q 12 -22 15 -32" } : {}}
                  transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse", delay: 0.2 }}
                />
                
                <path d="M 0 20 Q -6 35 -7 45" stroke="#78350f" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                <path d="M 0 20 Q 6 35 7 45" stroke="#78350f" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                
                <ellipse cx={-7} cy={48} rx={6} ry={3} fill="#78350f" />
                <ellipse cx={7} cy={48} rx={6} ry={3} fill="#78350f" />
              </motion.g>
            )}
          </g>
        </motion.g>

        {/* Current milestone label */}
        <motion.text
          key={`milestone-${showLabel}`}
          x={350}
          y={570}
          textAnchor="middle"
          fill="#78350f"
          fontSize={20}
          fontFamily="Comic Sans MS, cursive"
          fontWeight="600"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {steps[showLabel]?.milestone || "Crawling"}
        </motion.text>
      </svg>
    </div>
  );
}