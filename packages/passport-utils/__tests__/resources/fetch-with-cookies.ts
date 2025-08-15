export class FetchWithCookies {
  cookieJar: Record<string, string>

  constructor() {
    this.cookieJar = {}
    this.fetch = this.fetch.bind(this)
  }

  updateCookieJar(setCookieHeader: string) {
    const cookies = setCookieHeader.split(', ')
    cookies.forEach(cookie => {
      const [name, value] = cookie.split(';')[0].split('=')
      this.cookieJar[name] = value
    })
  }

  getCookieHeader() {
    return Object.entries(this.cookieJar)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  async fetch(url: string, options: RequestInit = {}) {
    const headers = options?.headers || {}
    options = {
      ...options,
      headers: {
        ...headers,
        Cookie: this.getCookieHeader()
      }
    }

    const response = await fetch(url, options)

    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      this.updateCookieJar(setCookieHeader)
    }

    return response
  }
}
