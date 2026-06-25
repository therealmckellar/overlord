/**
 * Deterministic avatar color from name
 */

const AVATAR_COLORS = [
  '#D97706', '#2563EB', '#059669', '#7C3AED', '#DC2626',
  '#0891B2', '#4F46E5', '#BE185D', '#0D9488', '#7C2D12',
  '#1D4ED8', '#9333EA', '#C026D3', '#E11D48', '#EA580C',
  '#16A34A', '#2563EB', '#6366F1', '#EC4899', '#F59E0B',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}
