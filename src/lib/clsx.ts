// Minimal clsx replacement to avoid an extra dependency.
export type ClassValue = string | number | null | boolean | undefined | ClassValue[];

export function clsx(input: ClassValue[]): string;
export function clsx(...input: ClassValue[]): string;
export function clsx(...args: any[]): string {
  const flat = (a: any[]): any[] => a.flatMap((x) => (Array.isArray(x) ? flat(x) : [x]));
  return flat(args)
    .filter((x) => typeof x === "string" || typeof x === "number")
    .filter(Boolean)
    .join(" ");
}

export default clsx;
