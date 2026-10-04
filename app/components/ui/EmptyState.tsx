import Link from "next/link";
import type { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  href,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[#31095A]/15 bg-white px-6 py-10 text-center">
      {icon && <div className="mb-4">{icon}</div>}
      <h2 className="text-lg font-extrabold text-[#31095A]">{title}</h2>
      {description && <p className="mt-2 max-w-sm text-sm leading-6 text-[#31095A]/60">{description}</p>}
      {action && href && (
        <Link
          href={href}
          className="mt-5 inline-flex min-h-11 items-center rounded-[14px] bg-[#FECF4C] px-5 py-2.5 text-sm font-bold text-[#31095A] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F837E2]"
        >
          {action}
        </Link>
      )}
    </div>
  );
}
