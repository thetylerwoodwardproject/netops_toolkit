export const categories = [
  { id: 'net101', label: 'Networking 101', color: 'yellow' },
  { id: 'calculators', label: 'Calculators', color: 'accent' },
  { id: 'reference', label: 'Reference', color: 'green' },
  { id: 'cisco', label: 'Cisco IOS', color: 'blue' },
  { id: 'security', label: 'Security', color: 'purple' },
  { id: 'operations', label: 'Operations', color: 'orange' },
  { id: 'broadcast', label: 'Broadcast / AoIP', color: 'pink' },
] as const;

export type CategoryId = (typeof categories)[number]['id'];
export type CategoryColor = (typeof categories)[number]['color'];

export const categoryIds = categories.map((c) => c.id) as [CategoryId, ...CategoryId[]];

// Full class strings, so Tailwind's scanner sees every one of them.
export const categoryClasses: Record<CategoryColor, { dot: string; tag: string }> = {
  yellow: { dot: 'bg-yellow', tag: 'bg-yellow/10 text-yellow' },
  accent: { dot: 'bg-accent', tag: 'bg-accent/10 text-accent' },
  green: { dot: 'bg-green', tag: 'bg-green/10 text-green' },
  blue: { dot: 'bg-blue', tag: 'bg-blue/10 text-blue' },
  purple: { dot: 'bg-purple', tag: 'bg-purple/10 text-purple' },
  orange: { dot: 'bg-orange', tag: 'bg-orange/10 text-orange' },
  pink: { dot: 'bg-pink', tag: 'bg-pink/10 text-pink' },
};
