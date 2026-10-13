type Tone = 'cyan' | 'violet' | 'amber' | 'rose' | 'emerald'

/** رنگ نشان وضعیت را از معنای آن می‌گیرد، نه از نام وضعیت. */
export function statusTone(status: string): Tone {
  if (['approved', 'delivered', 'paid', 'active'].includes(status)) return 'emerald'
  if (['pending', 'processing', 'draft'].includes(status)) return 'amber'
  if (['rejected', 'cancelled', 'failed', 'suspended'].includes(status)) return 'rose'
  if (['shipped', 'confirmed'].includes(status)) return 'cyan'
  if (['refunded', 'partially_refunded'].includes(status)) return 'violet'
  return 'violet'
}

export type { Tone }
