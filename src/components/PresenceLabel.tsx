import { classNames } from "../lib/utils";
import { useIsOnline } from "../context/PresenceContext";

/** Renders "online" / "offline" (or custom text) reflecting real presence. */
export default function PresenceLabel({
  userId,
  onlineText = "online",
  offlineText = "offline",
  onlineClassName = "text-cyan-400",
  offlineClassName = "text-ink-500",
  className,
}: {
  userId: string | null | undefined;
  onlineText?: string;
  offlineText?: string;
  onlineClassName?: string;
  offlineClassName?: string;
  className?: string;
}) {
  const online = useIsOnline(userId);
  return (
    <span className={classNames(className, online ? onlineClassName : offlineClassName)}>
      {online ? onlineText : offlineText}
    </span>
  );
}
