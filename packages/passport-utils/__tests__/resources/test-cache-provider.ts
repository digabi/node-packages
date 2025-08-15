import { CacheItem, CacheProvider } from '@node-saml/passport-saml'

const cache: { [key: string]: CacheItem } = {}

/* Simple test cache provider, InMemoryCacheProvider not working well with MultiSamlStrategy */
export class TestCacheProvider implements CacheProvider {
  saveAsync(key: string, value: string): Promise<CacheItem | null> {
    const cacheItem = { value, createdAt: new Date().getDate() }
    cache[key] = cacheItem
    return Promise.resolve(cacheItem)
  }
  getAsync(key: string): Promise<string | null> {
    const cacheItem = cache[key]
    return Promise.resolve(cacheItem?.value ?? null)
  }
  removeAsync(key: string | null): Promise<string | null> {
    if (!key) {
      Object.keys(cache).forEach(key => delete cache[key])
      return Promise.resolve(null)
    }
    const cacheItem = cache[key]
    delete cache[key]
    return Promise.resolve(cacheItem?.value ?? null)
  }
}
