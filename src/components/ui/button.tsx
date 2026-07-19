import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A8D8FF]/60 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[#A8D8FF] to-[#7EC8FF] text-[#1E3A5F] shadow-[0_4px_16px_rgba(91,184,255,0.35)] hover:from-[#B8E0FF] hover:to-[#8FD0FF] hover:shadow-[0_6px_24px_rgba(91,184,255,0.5)] hover:-translate-y-0.5 border border-white/70",
        secondary:
          "bg-white/90 text-[#1E3A5F] border border-[#A8D8FF]/70 shadow-[0_2px_12px_rgba(168,216,255,0.25)] hover:bg-[#E8F4FF] hover:border-[#7EC8FF] hover:shadow-[0_4px_20px_rgba(91,184,255,0.3)]",
        outline:
          "border-2 border-[#7EC8FF] text-[#1E3A5F] bg-white/50 hover:bg-[#E8F4FF] hover:shadow-[0_0_16px_rgba(126,200,255,0.4)]",
        ghost:
          "text-[#4A6FA5] hover:bg-[#E8F4FF]/80 hover:text-[#1E3A5F] rounded-2xl",
        danger:
          "bg-gradient-to-b from-[#FECACA] to-[#FCA5A5] text-[#7F1D1D] shadow-[0_4px_16px_rgba(252,165,165,0.35)] hover:from-[#FEE2E2] hover:to-[#FECACA] border border-white/60",
        purple:
          "bg-gradient-to-b from-[#C4E4FF] to-[#5BB8FF] text-white shadow-[0_4px_16px_rgba(91,184,255,0.4)] hover:shadow-[0_6px_24px_rgba(91,184,255,0.55)] border border-white/50",
        gold: "bg-gradient-to-b from-[#E0F2FE] to-[#7DD3FC] text-[#1E3A5F] shadow-[0_4px_16px_rgba(125,211,252,0.4)] border border-white/60",
        mint: "bg-gradient-to-b from-[#E0F2FE] to-[#7DD3FC] text-[#0C4A6E] shadow-[0_4px_16px_rgba(125,211,252,0.35)] border border-white/70",
        sky: "bg-gradient-to-b from-[#A8D8FF] to-[#5BB8FF] text-white shadow-[0_4px_16px_rgba(91,184,255,0.4)] hover:-translate-y-0.5 border border-white/50",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-xl px-3.5 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";
