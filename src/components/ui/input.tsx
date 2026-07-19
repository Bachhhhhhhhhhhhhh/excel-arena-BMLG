import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "ice-input flex h-12 w-full rounded-2xl border-[1.5px] border-[#A8D8FF]/80 bg-white/85 px-4 py-2 text-sm font-mono text-[#1E3A5F] shadow-[inset_0_2px_8px_rgba(168,216,255,0.15)] placeholder:text-[#7EC8FF]/90 focus:outline-none transition-all",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
