import { tagColor, classNames } from "../lib/utils";

type Props = {
  tags?: string[] | null;
  className?: string;
  size?: "sm" | "md";
};

export default function TagPills({ tags, className, size = "md" }: Props) {
  const list = (tags ?? []).filter(Boolean);
  if (list.length === 0) return null;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <div className={classNames("flex flex-wrap gap-1.5", className)}>
      {list.map((t) => {
        const c = tagColor(t);
        return (
          <span
            key={t}
            className={classNames(
              "inline-flex items-center gap-1 rounded-full font-semibold ring-1",
              c.bg, c.text, c.ring, pad
            )}
          >
            {t}
          </span>
        );
      })}
    </div>
  );
}
