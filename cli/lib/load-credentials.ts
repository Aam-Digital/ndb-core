import { getCredentials, type SystemCredentials } from "./credentials.js";
import { OrgRunner } from "./org-runner.js";

export async function loadCredentials(opts: {
  credentials?: string;
  org?: string;
  category?: string;
}): Promise<{
  orgs: SystemCredentials[];
  keycloak: Awaited<ReturnType<typeof getCredentials>>["keycloak"];
} | null> {
  let file: Awaited<ReturnType<typeof getCredentials>>;
  try {
    file = await getCredentials(opts.credentials);
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : String(e));
    return null;
  }

  const orgs = OrgRunner.filterOrgs(file.orgs, opts);
  if (orgs.length === 0) {
    console.error(`\nNo orgs matched ${describeFilter(opts)}.\n`);
    return null;
  }
  return { orgs, keycloak: file.keycloak };
}

function describeFilter(opts: { org?: string; category?: string }): string {
  if (opts.org) return `--org "${opts.org}"`;
  if (opts.category) return `--category "${opts.category}"`;
  return "all";
}
