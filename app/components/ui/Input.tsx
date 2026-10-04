import type { InputHTMLAttributes } from "react";

export default function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        "min-h-11 w-full rounded-[14px] border border-[#31095A]/15 bg-white px-4 py-3 text-sm text-[#31095A] outline-none placeholder:text-[#31095A]/35 transition focus:border-[#31095A] focus:ring-2 focus:ring-[#FECF4C]/50 disabled:bg-[#31095A]/5",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
