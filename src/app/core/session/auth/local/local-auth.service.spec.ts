import { LocalAuthService } from "./local-auth.service";
import { SessionInfo } from "../session-info";
import { TEST_USER } from "../../../user/demo-user-generator.service";
import { environment } from "../../../../../environments/environment";
import { SessionType } from "../../session-type";

describe("LocalAuthService", () => {
  let service: LocalAuthService;
  let testUser: SessionInfo;

  beforeEach(() => {
    service = new LocalAuthService();
  });

  it("should be created", () => {
    expect(service).toBeDefined();
  });

  it("should return saved users", () => {
    localStorage.clear();
    testUser = {
      name: TEST_USER,
      id: "101",
      roles: ["user_app"],
    };
    service.saveUser(testUser);

    expect(service.getStoredUsers()).toEqual([testUser]);

    localStorage.clear();
  });

  it("should not save user in online-only mode", () => {
    localStorage.clear();
    const originalSessionType = environment.session_type;
    environment.session_type = SessionType.online;
    testUser = { name: TEST_USER, id: "101", roles: [] };

    service.saveUser(testUser);

    expect(service.getStoredUsers()).toEqual([]);

    environment.session_type = originalSessionType;
    localStorage.clear();
  });
});
