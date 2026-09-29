import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan class Tailwind; class yang bentrok dimenangkan yang terakhir. */
export function cn(...kelas: ClassValue[]) {
  return twMerge(clsx(kelas));
}
