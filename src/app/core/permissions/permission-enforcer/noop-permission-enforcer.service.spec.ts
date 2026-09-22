import { NoopPermissionEnforcerService } from "./noop-permission-enforcer.service";

describe("NoopPermissionEnforcerService", () => {
  let service: NoopPermissionEnforcerService;

  beforeEach(() => {
    service = new NoopPermissionEnforcerService();
  });

  it("should resolve without doing anything", async () => {
    await expect(
      service.enforcePermissionsOnLocalData([
        { subject: "all", action: "manage" },
      ]),
    ).resolves.toBeUndefined();
  });

  it("should return undefined for last enforced rules", () => {
    expect(service.getLastEnforcedRules()).toBeUndefined();
  });
});
