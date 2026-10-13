import { api } from '../../lib/api/client'
import type { ApiItem, Payment, PaymentStartResponse } from '../../types/api'

/** یک تلاش پرداخت تازه برای سفارش می‌سازد و آدرس درگاه را برمی‌گرداند. */
export const startPayment = (orderId: number) =>
  api<PaymentStartResponse>(`/orders/${orderId}/pay`, { method: 'POST' })

/** نتیجه‌ی پرداخت را از درگاه می‌پرسد و در صورت موفقیت سفارش را تأیید می‌کند. */
export const verifyPayment = (paymentId: number) =>
  api<ApiItem<Payment>>(`/payments/${paymentId}/verify`, { method: 'POST' })

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  failed: 'ناموفق',
  refunded: 'بازگشت وجه',
}

export const paymentStatusLabel = (status: string) => PAYMENT_STATUS_LABELS[status] ?? status
