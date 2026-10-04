import type { HTMLAttributes } from "react";

type Tone = "brand" | "accent" | "success" | "warning" | "danger" | "neutral";

export default function Badge({
  tone = "neutral",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const tones = {
    brand: "bg-[#31095A] text-white",
    accent: "bg-[#FECF4C] text-[#31095A]",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-700",
    neutral: "bg-[#31095A]/5 text-[#31095A]/70",
  };

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-xs font-bold",
        tones[tone],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
