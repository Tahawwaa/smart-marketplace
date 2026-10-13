import { Lock } from 'lucide-react'
import { useState } from 'react'
import { ApiError } from '../../lib/api/client'
import { updatePassword } from '../auth/api'
import { Field, FormError, FormNotice, SubmitButton, inputClass } from './form-controls'

const EMPTY = { current_password: '', password: '', password_confirmation: '' }

export function AccountPasswordPage() {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    setSaving(true)
    setError(null)
    setDone(false)
    try {
      await updatePassword(form)
      setForm(EMPTY)
      setDone(true)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? (Object.values(cause.errors ?? {})[0]?.[0] ?? cause.message)
          : 'تغییر گذرواژه انجام نشد.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-white">
        <Lock className="size-4 text-cyan-300" /> تغییر گذرواژه
      </h2>
      <p className="mb-4 text-[11px] text-neutral-500">
        پس از تغییر گذرواژه، نشست‌های دیگر روی دستگاه‌های دیگر بسته می‌شوند و همین نشست فعال می‌ماند.
      </p>

      <div className="grid gap-3">
        <Field label="گذرواژه‌ی فعلی" required>
          <input
            type="password"
            autoComplete="current-password"
            value={form.current_password}
            onChange={(event) => setForm((current) => ({ ...current, current_password: event.target.value }))}
            className={inputClass}
          />
        </Field>
        <Field label="گذرواژه‌ی جدید" required hint="حداقل ۸ نویسه">
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className={inputClass}
          />
        </Field>
        <Field label="تکرار گذرواژه‌ی جدید" required>
          <input
            type="password"
            autoComplete="new-password"
            value={form.password_confirmation}
            onChange={(event) =>
              setForm((current) => ({ ...current, password_confirmation: event.target.value }))
            }
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-4 space-y-3">
        {done ? <FormNotice message="گذرواژه تغییر کرد." /> : null}
        <FormError message={error} />
      </div>

      <div className="mt-4">
        <SubmitButton label="تغییر گذرواژه" busy={saving} onClick={() => void submit()} />
      </div>
    </section>
  )
}
