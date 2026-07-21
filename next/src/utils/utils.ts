import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z\s'-]/g, "")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const IS_VALID_DOMAIN = (domain: string): boolean => {
  const VALID_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com"];

  if (process.env.NODE_ENV === "development") {
    VALID_DOMAINS.push("example.com");
  }

  if(VALID_DOMAINS.includes(domain.toLowerCase())) {
    return true;
  }
  return false;
};