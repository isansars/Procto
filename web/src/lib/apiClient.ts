export type ApiClient = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function createApiClient(actorSlug: string, viewRole: string): ApiClient {
  const headers = {
    "x-actor": actorSlug,
    "x-view-role": viewRole,
    "Content-Type": "application/json",
  };

  async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {
        // ignore
      }
      throw new ApiError(message, res.status);
    }
    return (await res.json()) as T;
  }

  return {
    get: async (path) => handle(await fetch(path, { headers, cache: "no-store" })),
    post: async (path, body) =>
      handle(await fetch(path, { method: "POST", headers, body: JSON.stringify(body ?? {}) })),
  };
}
