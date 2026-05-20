"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";
import { AnimatedUnderlineText } from "@/components/ui/animated-underline-text-one";

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hold for 2.8s, then fade out (fade-out takes ~0.7s)
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {/* Background glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
          </div>

          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
          >
            {/* Logo mark */}
            <motion.div
              className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-2xl shadow-purple-500/30"
              initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6, ease: "backOut" }}
            >
              <Calendar className="w-8 h-8 text-white" />
            </motion.div>

            {/* Welcome text */}
            <div className="space-y-3">
              <motion.p
                className="text-[11px] font-black uppercase tracking-[0.4em] text-purple-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                Premium Event Management
              </motion.p>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
                Welcome to{" "}
                <AnimatedUnderlineText
                  text="EventHub"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400"
                  underlineColor="#7c3aed"
                  delay={0.9}
                />
              </h1>

              <motion.p
                className="text-base sm:text-lg text-slate-400 font-medium max-w-md mx-auto"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              >
                Create, manage, and join unforgettable events in minutes.
              </motion.p>
            </div>

            {/* Loading dots */}
            <motion.div
              className="flex gap-2 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.4 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
