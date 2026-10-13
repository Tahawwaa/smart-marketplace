import { cartSessionStore } from '../../lib/api/client'

/**
 * شناسه‌ی سبد مهمان. یک‌بار ساخته و در مرورگر نگه داشته می‌شود تا سبد مهمان
 * بین بازدیدها و بعد از ورود به حساب، قابل بازیابی باشد.
 */
function create(): string {
  const random = crypto.randomUUID().replace(/-/g, '')
  return `${random}${Date.now().toString(36)}`.slice(0, 40)
}

export const cartSession = {
  get(): string {
    const stored = cartSessionStore.get()
    if (stored && /^[A-Za-z0-9._-]{16,64}$/.test(stored)) return stored

    const value = create()
    cartSessionStore.set(value)
    return value
  },
}
