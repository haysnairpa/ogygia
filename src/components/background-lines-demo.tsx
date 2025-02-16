import React from "react";
import { BackgroundLines } from "@/components/ui/background-lines";
import { AnimatedModalDemo } from "@/components/animated-modal-demo";

export function BackgroundLinesDemo() {
  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      <BackgroundLines className="absolute inset-0 flex items-center justify-center" />
      <div className="relative z-20 flex flex-col items-center text-center px-4">
        <h2 className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-1 md:py-8 font-bold tracking-tight">
          Welcome to, <br /> Ogygia AI!
        </h2>
        <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 mb-2">
          Get the best research from our best agents, that contain the best
          information from the experts. Not only one, but many.
        </p>
        <AnimatedModalDemo />
      </div>
    </div>
  );
}
