import { Couchdb } from "./couchdb-client.js";
import type { SystemCredentials } from "./credentials.js";

export interface ConnectivityResult {
  org: SystemCredentials;
  reachable: boolean;
  failureReason?: "network" | "auth";
  errorDetail?: string;
}

export interface OrgOutcome<T> {
  org: SystemCredentials;
  result: T;
}

export class OrgRunner {
  async checkConnectivity(
    orgs: SystemCredentials[],
  ): Promise<ConnectivityResult[]> {
    const results: ConnectivityResult[] = [];
    for (const org of orgs) {
      const couchdb = new Couchdb(org.url, org.password, org.username);
      try {
        const session = await couchdb.get<{ userCtx?: { name: string } }>(
          "/_session",
        );
        if (!session?.userCtx?.name) {
          results.push({ org, reachable: false, failureReason: "auth" });
        } else {
          results.push({ org, reachable: true });
        }
      } catch (e: unknown) {
        const status =
          typeof e === "object" &&
          e !== null &&
          "status" in e &&
          typeof (e as { status: unknown }).status === "number"
            ? (e as { status: number }).status
            : undefined;
        const detail =
          e instanceof Error
            ? e.message
            : typeof e === "string"
              ? e
              : JSON.stringify(e);
        results.push({
          org,
          reachable: false,
          failureReason: status === 401 || status === 403 ? "auth" : "network",
          errorDetail: status ? `HTTP ${status}: ${detail}` : detail,
        });
      }
    }
    return results;
  }

  async runForEach<T>(
    orgs: SystemCredentials[],
    callback: (couchdb: Couchdb, org: SystemCredentials) => Promise<T>,
  ): Promise<OrgOutcome<T>[]> {
    const outcomes: OrgOutcome<T>[] = [];
    for (const org of orgs) {
      const couchdb = new Couchdb(org.url, org.password, org.username);
      const result = await callback(couchdb, org);
      outcomes.push({ org, result });
    }
    return outcomes;
  }

  static filterOrgs(
    orgs: SystemCredentials[],
    options: { org?: string; category?: string },
  ): SystemCredentials[] {
    let result = orgs;
    if (options.org) {
      const names = options.org.split(",").map((s) => s.trim());
      result = result.filter(
        (c) => names.includes(c.name ?? "") || names.includes(c.url),
      );
    }
    if (options.category) {
      result = result.filter((c) => c.category === options.category);
    }
    return result;
  }

  static orgLabel(org: SystemCredentials): string {
    return org.name ? `${org.name} (${org.url})` : org.url;
  }

  /** Sort orgs by `category`, then `url`, so reports group same-category orgs together. */
  static sortByCategory(orgs: SystemCredentials[]): SystemCredentials[] {
    return [...orgs].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.url.localeCompare(b.url);
    });
  }
}

/**
 * Run a callback against every org's CouchDB, keyed by org url.
 *
 * Errors are isolated per org: a failing org is logged and recorded as an
 * `"ERROR: ..."` string in the results map so one bad org never aborts the run.
 */
export async function runForAllOrgs<R>(
  credentials: SystemCredentials[],
  callback: (couchdb: Couchdb) => Promise<R>,
): Promise<{ [key: string]: R | string }> {
  const results: { [key: string]: R | string } = {};
  for (const cred of credentials) {
    await callback(new Couchdb(cred.url, cred.password, cred.username))
      .then((res) => (results[cred.url] = res))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("ERROR processing for: " + cred.url, err);
        results[cred.url] = "ERROR: " + msg;
      });
  }
  return results;
}
