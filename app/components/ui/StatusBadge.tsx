import Badge from "./Badge";

const config = {
  TO_READ: { label: "À lire", tone: "accent" as const },
  READING: { label: "En cours", tone: "brand" as const },
  READ: { label: "Lu", tone: "success" as const },
  ABANDONED: { label: "Abandonné", tone: "danger" as const },
};

export default function StatusBadge({ status }: { status: string }) {
  const item = config[status as keyof typeof config] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
