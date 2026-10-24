import { faNum } from '../../lib/format'

/** شمارنده‌ی صفحه‌بندی؛ فقط وقتی سرور متادیتا فرستاده باشد رندر می‌شود. */
export function Pager({
  page,
  lastPage,
  total,
  onChange,
}: {
  page: number
  lastPage: number
  total: number
  onChange: (page: number) => void
}) {
  if (lastPage <= 1) {
    return <p className="text-[11px] text-fg-subtle">مجموع {faNum(total)} مورد</p>
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="w-full text-[11px] text-fg-subtle sm:w-auto">
        صفحه {faNum(page)} از {faNum(lastPage)} • {faNum(total)} مورد
      </span>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="btn btn-secondary btn-sm"
      >
        قبلی
      </button>
      <button
        type="button"
        disabled={page >= lastPage}
        onClick={() => onChange(page + 1)}
        className="btn btn-secondary btn-sm"
      >
        بعدی
      </button>
    </div>
  )
}
