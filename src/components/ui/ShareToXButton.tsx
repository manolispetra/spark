"use client";

import { Sparkles } from "lucide-react";
import { shareToX } from "@/lib/tweets";
import { cn } from "@/lib/utils";

type Props = {
  symbol?: string;
  address?: string;
  className?: string;
  size?: "sm" | "md";
  label?: string;
};

/**
 * Picks one of 25 viral tweet templates at random and opens X compose.
 */
export default function ShareToXButton({
  symbol, address, className, size = "md", label = "Share on X",
}: Props) {
  return (
    <button
      type="button"
      onClick={() => shareToX({ symbol, address })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-soft/60 font-medium text-ink hover:border-spark-pink/50 hover:bg-spark-pink/10 transition",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-2 text-sm",
        className,
      )}
      aria-label="Share on X"
    >
      <Sparkles className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {label}
    </button>
  );
}
