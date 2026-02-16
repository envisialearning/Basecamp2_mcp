export class BasecampApiError extends Error {
  constructor(status, body, method, path) {
    const message = `Basecamp API error ${status} ${method} ${path}`;
    super(message);
    this.name = 'BasecampApiError';
    this.status = status;
    this.body = body;
    this.method = method;
    this.path = path;
  }
}

export function formatError(error) {
  if (error instanceof BasecampApiError) {
    const detail = typeof error.body === 'string' ? error.body : JSON.stringify(error.body);
    return `Basecamp API error (${error.status}) on ${error.method} ${error.path}: ${detail}`;
  }
  return error.message || String(error);
}
