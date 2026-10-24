import assert from 'node:assert/strict'
import test, { beforeEach, afterEach } from 'node:test'
import { loadModule } from './load-module.mjs'

const { api, ApiError, tokenStore, cartSessionStore } = await loadModule('../src/lib/api/client.ts', { VITE_API_BASE_URL: '/api/v1/' })
const originalFetch = globalThis.fetch
const originalWindow = globalThis.window
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

beforeEach(() => {
  const values = new Map()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  } })
  globalThis.window = { location: { origin: 'https://marketplace.example' } }
})

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})

test('relative API URLs work with encoded filters, auth and guest cart headers', async () => {
  tokenStore.set('test-token')
  cartSessionStore.set('test-guest-session')
  globalThis.fetch = async (url, options) => {
    assert.equal(url.origin, 'https://marketplace.example')
    assert.equal(url.pathname, '/api/v1/products')
    assert.equal(url.searchParams.get('search'), 'گوشی & تلفن')
    assert.equal(url.searchParams.has('brand'), false)
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    assert.equal(options.headers['X-Cart-Session'], 'test-guest-session')
    return Response.json({ data: [] })
  }
  assert.deepEqual(await api('/products', { query: { search: 'گوشی & تلفن', brand: undefined } }), { data: [] })
})

test('malformed successful responses produce a useful error instead of null data', async () => {
  globalThis.fetch = async () => new Response('<html>proxy response</html>')
  await assert.rejects(api('/cart'), (error) => error instanceof ApiError && error.status === 200)
})

test('validation errors retain their fields and status', async () => {
  globalThis.fetch = async () => Response.json({ message: 'invalid', errors: { quantity: ['out of stock'] } }, { status: 422 })
  await assert.rejects(api('/cart/items'), (error) => error.status === 422 && error.errors.quantity[0] === 'out of stock')
})

test('network failures are distinguished from request cancellation', async () => {
  globalThis.fetch = async () => { throw new TypeError('failed to fetch') }
  await assert.rejects(api('/cart'), (error) => error instanceof ApiError && error.status === 0)
  globalThis.fetch = async () => { throw new DOMException('cancelled', 'AbortError') }
  await assert.rejects(api('/cart'), { name: 'AbortError' })
})

test('delete responses do not require a JSON body', async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 })
  assert.equal(await api('/addresses/1', { method: 'DELETE' }), undefined)
})
