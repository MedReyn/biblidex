import Link from "next/link";
import BookCover from "./BookCover";
import StatusBadge from "../ui/StatusBadge";

export default function BookCard({
  href,
  title,
  author,
  coverUrl,
  status,
  meta,
}: {
  href: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  status?: string | null;
  meta?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-[20px] border border-[#31095A]/10 bg-white p-3 shadow-[0_4px_20px_rgba(49,9,90,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(49,9,90,0.09)] focus-visible:outline-none"
    >
      <BookCover src={coverUrl} alt={title} size="md" />
      <div className="mt-3 min-w-0">
        <h3 className="line-clamp-2 text-sm font-extrabold leading-5 text-[#31095A]">{title}</h3>
        {author && <p className="mt-1 line-clamp-1 text-xs text-[#31095A]/55">{author}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          {meta && <span className="text-[11px] font-semibold text-[#31095A]/45">{meta}</span>}
          {status && <StatusBadge status={status} />}
        </div>
      </div>
    </Link>
  );
}
