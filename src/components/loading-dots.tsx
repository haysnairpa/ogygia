"use client";

export function LoadingDots() {
  return (
    <div className="flex space-x-1.5 items-center">
      <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
    </div>
  );
}
