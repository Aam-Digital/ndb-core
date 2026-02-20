import { computeDbNames, computeLegacyDbNames } from "./db-name-helpers";
import { SessionInfo } from "../session/auth/session-info";

describe("db-name-helpers", () => {
  const session: SessionInfo = {
    id: "abc-123-uuid",
    name: "testuser",
    roles: ["user_app"],
  };

  describe("computeDbNames", () => {
    it("should use session.id for app DB name", () => {
      const result = computeDbNames(session);
      expect(result.app).toBe("abc-123-uuid-app");
    });

    it("should use session.id with dash for notifications DB name", () => {
      const result = computeDbNames(session);
      expect(result.notifications).toBe("abc-123-uuid-notifications");
    });
  });

  describe("computeLegacyDbNames", () => {
    it("should use session.name for app DB name", () => {
      const result = computeLegacyDbNames(session);
      expect(result.app).toBe("testuser-app");
    });

    it("should use underscore separator for notifications DB name", () => {
      const result = computeLegacyDbNames(session);
      expect(result.notifications).toBe("notifications_abc-123-uuid");
    });
  });
});
