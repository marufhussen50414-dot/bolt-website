import { classNames } from "../lib/utils";
import { useIsOnline } from "../context/PresenceContext";

/**
 * A small colored dot reflecting a user's real online status.
 * Pass full positioning/size/border classes via `className` — this
 * only decides the color (green = online, gray = offline).
 */
export default function PresenceDot({ userId, className }: { userId: string | null | undefined; className: string }) {
  const online = useIsOnline(userId);
  return <span className={classNames(className, online ? "bg-success-400" : "bg-ink-500")} />;
}
