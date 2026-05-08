/* ── Avatar color from name ── */
const avatarColors = ['#7c5cfc', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#f97316']

export function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}
