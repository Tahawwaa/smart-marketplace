/** Keep writes ordered and discard work belonging to an unmounted session. */
export function createRequestQueue() {
  let tail: Promise<unknown> = Promise.resolve()
  let generation = 0

  return {
    invalidate() { generation += 1 },
    run<T>(request: () => Promise<T>): Promise<T> {
      const current = generation
      const check = () => {
        if (current !== generation) throw new DOMException('Session changed', 'AbortError')
      }
      const result = tail.then(async () => {
        check()
        const value = await request()
        check()
        return value
      })
      tail = result.catch(() => undefined)
      return result
    },
  }
}
