import { AuthUser } from "../core/session/session-service/auth-user";
import { SessionService } from "../core/session/session-service/session.service";
import { PouchDatabase } from "../core/database/pouch-database";
import { LocalSession } from "../core/session/session-service/local-session";

export const TEST_USER = "test";
export const TEST_PASSWORD = "pass";

export function createLocalSession(
  andLogin?: boolean,
  user: AuthUser = { name: TEST_USER, roles: ["user_app"] },
): SessionService {
  const databaseMock: Partial<PouchDatabase> = {
    isEmpty: () => Promise.resolve(false),
    initIndexedDB: () => undefined,
    initInMemoryDB: () => undefined,
    destroy: () => Promise.resolve(),
  };
  const localSession = new LocalSession(databaseMock as PouchDatabase);
  localSession.saveUser(user, TEST_PASSWORD);
  if (andLogin === true) {
    localSession.login(TEST_USER, TEST_PASSWORD);
  }
  return localSession;
}
