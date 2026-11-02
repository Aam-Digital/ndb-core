import { SessionInfo } from "../session/auth/session-info";
import { Entity } from "../entity/model/entity";
import { NotificationEvent } from "../../features/notification/model/notification-event";

/**
 * Compute new-format database names (using Keycloak UUID + dash separator).
 * Used after migration to the "indexeddb" adapter.
 */
export function computeDbNames(session: SessionInfo): {
  app: string;
  notifications: string;
} {
  return {
    app: `${session.id}-${Entity.DATABASE}`,
    notifications: `${session.id}-${NotificationEvent.DATABASE}`,
  };
}

/**
 * Compute legacy-format database names (username for app, underscore for notifications).
 * Used with the old "idb" adapter before migration.
 */
export function computeLegacyDbNames(session: SessionInfo): {
  app: string;
  notifications: string;
} {
  return {
    app: `${session.name}-${Entity.DATABASE}`,
    notifications: `${NotificationEvent.DATABASE}_${session.id}`,
  };
}

/**
 * Whether the legacy and the new app database have the same name and therefore are the same IndexedDB database.
 * This is the case if the user's token has no "username" claim, so that the session name falls back to the id.
 * Such a database cannot be migrated to another adapter, because it would have to be opened with both adapters.
 */
export function hasIdenticalLegacyAppDbName(session: SessionInfo): boolean {
  return computeLegacyDbNames(session).app === computeDbNames(session).app;
}
