import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-500 text-white hover:bg-blue-500/80",
        secondary:
          "border-transparent bg-white/10 text-white hover:bg-white/20",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-500/80",
        outline: "text-white/60 border-white/10",
        gold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]",
        silver: "bg-slate-300/10 text-slate-300 border-slate-300/20 shadow-[0_0_15px_rgba(203,213,225,0.1)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
