type HttpError = Error & { status: number; response: { status: number } };

function throwHttpError(res: Response): never {
  const error = new Error(`HTTP ${res.status}`) as HttpError;
  error.status = res.status;
  error.response = { status: res.status };
  throw error;
}

function shouldTryAltPath(status: number): boolean {
  return status === 404 || status === 405;
}

/**
 * Standalone CouchDB client for server-side CLI/admin use.
 *
 * Deliberately *not* built on the app's {@link RemotePouchDatabase}: that class
 * is coupled to the Angular/browser runtime (Keycloak token auth, NgZone,
 * AlertService, `pouchdb-browser`, the per-user `DB_PROXY_PREFIX`). This client
 * instead targets CouchDB directly with admin Basic auth and adds admin-only
 * concerns the in-app class intentionally lacks — direct/proxied path fallback
 * and multi-org bulk operations (see {@link OrgRunner} / `runForAllOrgs`).
 */
export class Couchdb {
  private baseUrl: string;
  private authHeader: string;

  constructor(
    public url: string,
    private password: string,
    private username: string = "admin",
  ) {
    this.baseUrl = `https://${url}/db`;
    this.authHeader =
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
  }

  async get<R = unknown>(path: string, db?: string): Promise<R> {
    if (!path.startsWith("/")) path = "/" + path;
    if (db) path = `/${db}${path}`;

    const headers = { Authorization: this.authHeader };
    let res = await fetch(`${this.baseUrl}/couchdb${path}`, { headers });
    if (!res.ok) {
      res = await fetch(`${this.baseUrl}${path}`, { headers });
    }
    if (!res.ok) throwHttpError(res);
    const data = await res.json();
    return data.rows ?? data;
  }

  async getAll(prefix: string, db = "app"): Promise<unknown[]> {
    if (!prefix.includes(":")) prefix += ":";
    const body = {
      include_docs: true,
      startkey: prefix,
      endkey: prefix + "￰",
    };
    const path = `${db}/_all_docs`;

    let res = await this.post_(`${this.baseUrl}/couchdb/${path}`, body);
    if (!res.ok && shouldTryAltPath(res.status)) {
      res = await this.post_(`${this.baseUrl}/${path}`, body);
    }
    if (!res.ok) throwHttpError(res);
    const data = await res.json();
    return data?.rows.map(({ doc }: { doc: unknown }) => doc) ?? [];
  }

  async putAll(docs: unknown[], db = "app"): Promise<unknown> {
    const path = `${db}/_bulk_docs`;
    let res = await this.post_(`${this.baseUrl}/couchdb/${path}`, { docs });
    if (!res.ok && shouldTryAltPath(res.status)) {
      res = await this.post_(`${this.baseUrl}/${path}`, { docs });
    }
    if (!res.ok) throwHttpError(res);
    return res.json();
  }

  async put(
    path: string,
    data: unknown,
    db?: string,
    headers?: Record<string, string>,
  ): Promise<unknown> {
    if (!path.startsWith("/")) path = "/" + path;
    if (db) path = `/${db}${path}`;

    const opts = {
      method: "PUT",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    };
    let res = await fetch(`${this.baseUrl}/couchdb${path}`, opts);
    if (!res.ok && shouldTryAltPath(res.status)) {
      res = await fetch(`${this.baseUrl}${path}`, opts);
    }
    if (!res.ok) throwHttpError(res);
    const result = await res.json();
    return result?.docs ? result.docs : result;
  }

  async post(path: string, data: unknown): Promise<unknown> {
    if (!path.startsWith("/")) path = "/" + path;
    let res = await this.post_(`${this.baseUrl}/couchdb${path}`, data);
    if (!res.ok && shouldTryAltPath(res.status)) {
      res = await this.post_(`${this.baseUrl}${path}`, data);
    }
    if (!res.ok) throwHttpError(res);
    const result = await res.json();
    return result?.docs ? result.docs : result;
  }

  find(query: unknown, db = "app"): Promise<unknown> {
    return this.post(`/${db}/_find`, query);
  }

  private post_(url: string, data: unknown): Promise<Response> {
    return fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }
}
