import { Check, Save, ShieldCheck, Store } from 'lucide-react'
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { VendorOutletContext } from '../../components/layout/require-vendor'
import { ApiError } from '../../lib/api/client'
import { useAuth } from '../auth/auth-context'
import { updateVendorProfile } from './api'
import { VendorPageHeading, VendorStatus } from './vendor-ui'

export function VendorSettingsPage() {
  const { vendor, setVendor } = useOutletContext<VendorOutletContext>()
  const { user, setUser } = useAuth()
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true); setError(null); setSaved(false)
    try {
      const response = await updateVendorProfile({ store_name: String(form.get('store_name')).trim(), bank_sheba: String(form.get('bank_sheba') ?? '').trim() || null })
      setVendor(response.data)
      if (user) setUser({ ...user, store: { id: response.data.id, store_name: response.data.store_name, slug: response.data.slug, status: response.data.status } })
      setSaved(true)
    } catch (cause) { setError(cause instanceof ApiError ? Object.values(cause.errors ?? {})[0]?.[0] ?? cause.message : 'تنظیمات ذخیره نشد.') }
    finally { setBusy(false) }
  }
  return <div className="space-y-5"><VendorPageHeading title="تنظیمات فروشگاه" description="مشخصات عمومی و اطلاعات تسویهٔ فروشگاهتان را مدیریت کنید." />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"><form onSubmit={save} className="card space-y-5 p-5 sm:p-6"><h3 className="flex items-center gap-2 text-sm font-bold text-fg"><Store className="size-4 text-brand" />مشخصات فروشگاه</h3><label className="block text-xs text-fg-muted">نام فروشگاه<input name="store_name" required maxLength={255} defaultValue={vendor.store_name} className="input mt-2" /></label><div><p className="text-xs text-fg-muted">نشانی ویترین</p><p className="mt-2 break-all rounded-xl bg-surface-2 p-3 text-xs text-fg-subtle" dir="ltr">/products?vendor={vendor.slug}</p><p className="mt-2 text-[11px] text-fg-subtle">با تغییر نام، نشانی فعلی ویترین حفظ می‌شود.</p></div><label className="block text-xs text-fg-muted">شماره شبا (اختیاری)<input name="bank_sheba" defaultValue={vendor.bank_sheba ?? ''} placeholder="IR + ۲۴ رقم" dir="ltr" maxLength={40} className="input mt-2" autoComplete="off" /><span className="mt-2 block text-[11px] leading-6 text-fg-subtle">برای تسویه درآمد فروشگاه؛ با IR شروع می‌شود و ۲۴ رقم دارد.</span></label>{error ? <p role="alert" className="alert alert-danger">{error}</p> : null}{saved ? <p role="status" className="alert alert-success"><Check className="size-4" />تنظیمات فروشگاه ذخیره شد.</p> : null}<button disabled={busy} className="btn btn-primary btn-sm"><Save className="size-4" />{busy ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}</button></form>
    <aside className="card h-fit space-y-4 p-5"><ShieldCheck className="size-7 text-brand" /><h3 className="text-sm font-bold text-fg">وضعیت فروشندگی</h3><VendorStatus status={vendor.status} /><p className="text-xs leading-7 text-fg-muted">وضعیت تأیید و نرخ کمیسیون توسط مدیریت سامانه تعیین می‌شود. اطلاعات این بخش فقط برای فروشگاه شما ذخیره می‌شود.</p>{vendor.approved_at ? <p className="text-[11px] text-fg-subtle">تاریخ تأیید: {new Date(vendor.approved_at).toLocaleDateString('fa-IR')}</p> : null}</aside></div>
  </div>
}
