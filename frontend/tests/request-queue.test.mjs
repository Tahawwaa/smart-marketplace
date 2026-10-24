import assert from 'node:assert/strict'
import test from 'node:test'
import { loadModule } from './load-module.mjs'

const { createRequestQueue } = await loadModule('../src/lib/request-queue.ts')

test('cart writes execute in order even when later requests are faster', async () => {
  const queue = createRequestQueue()
  const events = []
  let finishFirst
  const first = queue.run(async () => {
    events.push('first started')
    await new Promise((resolve) => { finishFirst = resolve })
    events.push('first finished')
  })
  const second = queue.run(async () => { events.push('second started') })
  await Promise.resolve()
  assert.deepEqual(events, ['first started'])
  finishFirst()
  await Promise.all([first, second])
  assert.deepEqual(events, ['first started', 'first finished', 'second started'])
})

test('a failed request does not block later cart operations', async () => {
  const queue = createRequestQueue()
  const failed = queue.run(async () => { throw new Error('network unavailable') })
  const next = queue.run(async () => 42)
  await assert.rejects(failed, /network unavailable/)
  assert.equal(await next, 42)
})

test('switching users discards in-flight results and never sends queued writes', async () => {
  const queue = createRequestQueue()
  let finish
  let called = false
  const first = queue.run(() => new Promise((resolve) => { finish = resolve }))
  const queued = queue.run(async () => { called = true })
  const firstRejected = assert.rejects(first, { name: 'AbortError' })
  const queuedRejected = assert.rejects(queued, { name: 'AbortError' })
  await Promise.resolve()
  queue.invalidate()
  finish('old account data')
  await Promise.all([firstRejected, queuedRejected])
  assert.equal(called, false)
  assert.equal(await queue.run(async () => 'new account data'), 'new account data')
})
