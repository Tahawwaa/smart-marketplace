export const faNum = (value: number) => value.toLocaleString('fa-IR')

export function faPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return null
  return `${faNum(value)} تومان`
}

export function faPercent(part: number, whole: number) {
  if (whole <= 0 || part >= whole) return null
  return `${faNum(Math.round(((whole - part) / whole) * 100))}٪`
}
