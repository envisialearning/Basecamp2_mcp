import { BasecampApiError } from './errors.js';

export class BasecampClient {
  constructor({ accountId, username, password, userAgent }) {
    this.baseUrl = `https://basecamp.com/${accountId}/api/v1`;
    this.auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    this.userAgent = userAgent;
  }

  async request(method, path, { body, contentType, contentLength } = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': this.auth,
      'User-Agent': this.userAgent,
    };

    let fetchBody;
    if (body !== undefined) {
      if (contentType) {
        // Binary body (e.g. file upload)
        headers['Content-Type'] = contentType;
        if (contentLength !== undefined) {
          headers['Content-Length'] = String(contentLength);
        }
        fetchBody = body;
      } else {
        headers['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(body);
      }
    }

    let response = await fetch(url, { method, headers, body: fetchBody });

    // Single retry on 429
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      response = await fetch(url, { method, headers, body: fetchBody });
    }

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.text();
      } catch {
        errorBody = '';
      }
      throw new BasecampApiError(response.status, errorBody, method, path);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  get(path) {
    return this.request('GET', path);
  }

  post(path, body, opts) {
    return this.request('POST', path, { body, ...opts });
  }

  put(path, body) {
    return this.request('PUT', path, { body });
  }

  async getAllPages(path, query = {}) {
    const results = [];
    let page = 1;

    while (true) {
      const params = new URLSearchParams({ ...query, page: String(page) });
      const separator = path.includes('?') ? '&' : '?';
      const data = await this.get(`${path}${separator}${params}`);

      if (!Array.isArray(data) || data.length === 0) break;
      results.push(...data);

      // Basecamp 2 returns 50 per page by default; partial page means last page
      if (data.length < 50) break;
      page++;
    }

    return results;
  }
}
