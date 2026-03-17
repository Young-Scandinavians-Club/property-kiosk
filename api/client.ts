import type { ApiErrorBody } from './types';

export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
}

/** Thrown on 4xx/5xx with status and parsed error body when JSON. */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: ApiErrorBody
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function parseErrorBody(res: Response, text: string): ApiErrorBody | undefined {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return undefined;
  try {
    return JSON.parse(text) as ApiErrorBody;
  } catch {
    return undefined;
  }
}

/** Options for request(). */
export interface RequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST';
  /** JSON-serialized as request body; sets Content-Type: application/json. */
  body?: TBody;
  searchParams?: Record<string, string>;
}

/**
 * Low-level request: adds Authorization, Accept, optional JSON body.
 * Throws ApiClientError on non-2xx with status and parsed error when JSON.
 */
export async function request<TResponse, TBody = unknown>(
  config: ApiClientConfig,
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { baseUrl, apiKey } = config;
  const { method = 'GET', body, searchParams } = options;

  const url = new URL(path, baseUrl);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
  };

  let bodyStr: string | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyStr = JSON.stringify(body);
  }

  const init: RequestInit = { method, headers };
  if (bodyStr !== undefined) init.body = bodyStr;
  const res = await fetch(url.toString(), init);

  const text = await res.text();

  if (!res.ok) {
    const errorBody = parseErrorBody(res, text);
    const message = errorBody?.error ?? `Request failed: ${res.status} ${res.statusText}`;
    throw new ApiClientError(message, res.status, errorBody);
  }

  if (!text) return undefined as TResponse;
  try {
    return JSON.parse(text) as TResponse;
  } catch {
    throw new ApiClientError(`Invalid JSON response: ${res.status}`, res.status);
  }
}
