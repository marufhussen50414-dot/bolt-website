import { Gamepad2 } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-glow">
        <Gamepad2 size={20} />
      </div>
      <div className="leading-none">
        <span className="font-display text-lg font-extrabold text-white">GameHaat</span>
        <span className="font-display text-lg font-extrabold text-primary-400">BD</span>
      </div>
    </div>
  );
}
