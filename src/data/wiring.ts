// Wire color swatches (see .wire-dot), as full class strings for Tailwind's scanner.

/** T568A/B pair colors. */
export const t568Dot: Record<string, string> = {
  'White/Orange': 'bg-[#f97316]',
  Orange: 'bg-[#ea6a00]',
  'White/Green': 'bg-[#22c55e]',
  Blue: 'bg-[#3b82f6]',
  'White/Blue': 'bg-[#60a5fa]',
  Green: 'bg-[#16a34a]',
  'White/Brown': 'bg-[#92400e]',
  Brown: 'bg-[#78350f]',
};

/** The same pairs as StudioHub documentation abbreviates them. */
export const studiohubDot: Record<string, string> = {
  'Wht/Org': 'bg-[#f97316]',
  'Org/Wht': 'bg-[#ea6a00]',
  'Wht/Grn': 'bg-[#22c55e]',
  'Grn/Wht': 'bg-[#16a34a]',
  'Blu/Wht': 'bg-[#3b82f6]',
  'Wht/Blu': 'bg-[#60a5fa]',
  'Wht/Brn': 'bg-[#a16207]',
  'Brn/Wht': 'bg-[#92400e]',
};

/** StudioHub+ adapter band colors. */
export const bandDot = {
  green: 'bg-[#22c55e]',
  red: 'bg-[#ef4444]',
  white: 'bg-[#e5e7eb]',
} as const;

/** StudioHub+ "Plus" pinout. */
export const studiohubPlusPins: [number, string, string, string][] = [
  [1, 'Wht/Org', 'L+ / AES+', 'Left Ch. Positive / AES/EBU Positive'],
  [2, 'Org/Wht', 'L− / AES−', 'Left Ch. Negative / AES/EBU Negative'],
  [3, 'Wht/Grn', 'R+', 'Right Channel Positive'],
  [4, 'Blu/Wht', 'GND', 'Signal Ground'],
  [5, 'Wht/Blu', 'NC', 'Not Connected (spare)'],
  [6, 'Grn/Wht', 'R−', 'Right Channel Negative'],
  [7, 'Wht/Brn', '−15V DC', 'Negative DC Power (optional via Hub)'],
  [8, 'Brn/Wht', '+15V DC', 'Positive DC Power (optional via Hub)'],
];
