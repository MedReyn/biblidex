import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const variants = {
    primary: "bg-[#FECF4C] text-[#31095A] shadow-sm hover:brightness-[0.98]",
    secondary: "border border-[#31095A]/15 bg-white text-[#31095A] hover:bg-[#31095A]/5",
    ghost: "text-[#31095A] hover:bg-[#31095A]/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      className={[
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F837E2] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
