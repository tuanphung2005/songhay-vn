type CacheEntry = {
  value: unknown
  expiresAt: number
}

type GlobalCacheState = {
  values: Map<string, CacheEntry>
  inFlight: Map<string, Promise<unknown>>
}

const globalForDataCache = globalThis as unknown as {
  __songhayDataCache?: GlobalCacheState
}

function getCacheState(): GlobalCacheState {
  if (!globalForDataCache.__songhayDataCache) {
    globalForDataCache.__songhayDataCache = {
      values: new Map<string, CacheEntry>(),
      inFlight: new Map<string, Promise<unknown>>(),
    }
  }

  return globalForDataCache.__songhayDataCache
}

export async function memoizeWithTtl<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now()
  const ttlMs = Math.max(0, ttlSeconds) * 1000
  const state = getCacheState()

  const existing = state.values.get(key)
  if (existing && existing.expiresAt > now) {
    return existing.value as T
  }

  const pending = state.inFlight.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  const loadPromise = loader()
    .then((value) => {
      state.values.set(key, {
        value,
        expiresAt: now + ttlMs,
      })
      state.inFlight.delete(key)
      return value
    })
    .catch((error) => {
      state.inFlight.delete(key)
      throw error
    })

  state.inFlight.set(key, loadPromise as Promise<unknown>)

  return loadPromise
}

export function clearDataCache(prefix?: string) {
  const state = getCacheState()

  if (!prefix) {
    state.values.clear()
    state.inFlight.clear()
    return
  }

  for (const key of state.values.keys()) {
    if (key.startsWith(prefix)) {
      state.values.delete(key)
    }
  }

  for (const key of state.inFlight.keys()) {
    if (key.startsWith(prefix)) {
      state.inFlight.delete(key)
    }
  }
}
