"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = false,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col min-h-screen w-full transition-bg isolate",
        className
      )}
      {...props}
    >
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div
          className={cn(
            "filter blur-[10px] opacity-80 will-change-transform",
            "absolute inset-[-10%] h-[120%] w-[120%]",
            "aurora-bg animate-aurora after:animate-aurora",
            showRadialGradient &&
              "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]"
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};
