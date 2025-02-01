import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// function to generate a random 6 digit number
export function generatePinCode() {
  return Math.floor(Math.random() * 900000) + 100000;
}
