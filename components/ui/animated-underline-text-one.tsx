"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedUnderlineTextProps {
  text: string;
  className?: string;
  underlineColor?: string;
  delay?: number;
}

export function AnimatedUnderlineText({
  text,
  className,
  underlineColor = "#7c3aed",
  delay = 0.4,
}: AnimatedUnderlineTextProps) {
  return (
    <span className={cn("relative inline-block", className)}>
      {text}
      <motion.span
        className="absolute bottom-0 left-0 h-[3px] md:h-[4px] rounded-full"
        style={{ backgroundColor: underlineColor }}
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{
          delay,
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      />
    </span>
  );
}
