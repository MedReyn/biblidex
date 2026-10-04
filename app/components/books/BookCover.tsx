import Image from "next/image";

export default function BookCover({
  src,
  alt,
  size = "md",
}: {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-28 w-[74px]",
    md: "h-40 w-[106px]",
    lg: "h-56 w-[148px]",
  };

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-[14px] bg-[#31095A]/5 ${sizes[size]}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 30vw, 160px" className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center p-3 text-center text-xs font-semibold text-[#31095A]/35">
          Pas de couverture
        </div>
      )}
    </div>
  );
}
