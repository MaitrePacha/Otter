import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// The fluid type scale (text-step-0, text-step--1…) is a font size, not a
// colour: without this, a text colour next to it removes it. These sizes set
// no line height, so they leave leading-* classes alone.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [(value: string) => value.startsWith('step-')] }],
    },
  },
  override: {
    conflictingClassGroups: { 'font-size': [] },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
