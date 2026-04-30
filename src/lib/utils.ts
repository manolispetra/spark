import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncate = (a?: string, n = 4) =>
  !a ? "" : `${a.slice(0, 2 + n)}…${a.slice(-n)}`;

export const fmtNum = (v: number | bigint, max = 6) => {
  const n = typeof v === "bigint" ? Number(v) : v;
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: max });
};
