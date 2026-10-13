import { useId } from 'react'
import { faNum, faPrice } from '../../lib/format'

type Point = { date: string; revenue: number; orders: number }

const WIDTH = 720
const HEIGHT = 220
const PAD_X = 8
const PAD_TOP = 16
const PAD_BOTTOM = 28

/** تاریخ ایزو را به برچسب کوتاه شمسی‌خوان تبدیل می‌کند. */
function shortDate(iso: string) {
  const [, month, day] = iso.split('-')
  return `${day}/${month}`
}

/**
 * نمودار روند درآمد.
 *
 * SVG دستی است چون پروژه عمداً بدون کتابخانه‌ی نمودار نگه داشته شده؛ مسیر با
 * مقیاس‌بندی مقدارها روی یک جعبه‌ی ثابت ساخته می‌شود و viewBox خودش
 * واکنش‌گرایی را انجام می‌دهد.
 */
export function RevenueChart({ points }: { points: Point[] }) {
  const gradientId = useId()

  if (points.length === 0) {
    return <p className="py-10 text-center text-xs text-neutral-500">داده‌ای برای نمایش نیست.</p>
  }

  const max = Math.max(...points.map((point) => point.revenue), 1)
  const innerWidth = WIDTH - PAD_X * 2
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const step = points.length > 1 ? innerWidth / (points.length - 1) : 0

  const coords = points.map((point, index) => ({
    ...point,
    x: PAD_X + index * step,
    y: PAD_TOP + innerHeight - (point.revenue / max) * innerHeight,
  }))

  const line = coords.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const baseline = PAD_TOP + innerHeight
  const area = `M ${PAD_X},${baseline} L ${coords.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' L ')} L ${coords[coords.length - 1].x.toFixed(1)},${baseline} Z`

  const total = points.reduce((sum, point) => sum + point.revenue, 0)
  const peak = points.reduce((best, point) => (point.revenue > best.revenue ? point : best), points[0])

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
        <span>
          جمع بازه: <span className="tabular-nums text-neutral-200">{faPrice(total)}</span>
        </span>
        <span>
          اوج: <span className="tabular-nums text-neutral-200">{faPrice(peak.revenue)}</span>
          {peak.revenue > 0 ? ` (${shortDate(peak.date)})` : ''}
        </span>
      </div>

      <div dir="ltr" className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-56 w-full"
          role="img"
          aria-label="نمودار روند درآمد"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(139 92 246)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              x2={WIDTH}
              y1={PAD_TOP + innerHeight * ratio}
              y2={PAD_TOP + innerHeight * ratio}
              stroke="rgb(255 255 255 / 0.06)"
              strokeWidth={1}
            />
          ))}

          <path d={area} fill={`url(#${gradientId})`} />
          <polyline
            points={line}
            fill="none"
            stroke="rgb(34 211 238)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {coords.map((point) => (
            <circle key={point.date} cx={point.x} cy={point.y} r={2.5} fill="rgb(34 211 238)">
              <title>{`${shortDate(point.date)} • ${faPrice(point.revenue)} • ${faNum(point.orders)} سفارش`}</title>
            </circle>
          ))}
        </svg>
      </div>

      <p className="mt-1 text-[11px] text-neutral-600">
        از {shortDate(points[0].date)} تا {shortDate(points[points.length - 1].date)} — بازه‌ی{' '}
        {faNum(points.length)} روزه
      </p>
    </div>
  )
}
