import type { HTMLAttributes } from "react";

export default function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "rounded-[20px] border border-[#31095A]/10 bg-white shadow-[0_4px_20px_rgba(49,9,90,0.06)]",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
