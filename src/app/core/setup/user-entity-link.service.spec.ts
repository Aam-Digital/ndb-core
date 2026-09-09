import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { UserEntityLinkService } from "./user-entity-link.service";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { SessionSubject } from "../session/auth/session-info";
import {
  UserAdminService,
  UserAdminApiError,
} from "../user/user-admin-service/user-admin.service";
import { EntityConfigService } from "../entity/entity-config.service";
import { Entity, EntityConstructor } from "../entity/model/entity";
import { BehaviorSubject } from "rxjs";
import { SessionInfo } from "../session/auth/session-info";

class AccountEnabledEntity extends Entity {
  static override ENTITY_TYPE = "AccountEnabledEntity";
  static override enableUserAccounts = true;
  static override toStringAttributes = ["name"];
  static override label = "Profile";
}

class OtherAccountEnabledEntity extends Entity {
  static override ENTITY_TYPE = "OtherAccountEnabledEntity";
  static override enableUserAccounts = true;
  static override label = "Other Profile";
}

class NonAccountEntity extends Entity {
  static override ENTITY_TYPE = "NonAccountEntity";
}

describe("UserEntityLinkService", () => {
  let service: UserEntityLinkService;
  let sessionInfo: BehaviorSubject<SessionInfo>;
  let mockUserAdminService: any;
  let mockEntityConfigService: any;

  function setup(entityTypes: EntityConstructor[]) {
    sessionInfo = new BehaviorSubject<SessionInfo>({
      id: "account-1",
      name: "Test Admin",
      roles: ["account_manager"],
    });
    mockUserAdminService = {
      canManageAccounts: vi.fn().mockReturnValue(true),
      updateUser: vi.fn().mockReturnValue(of({ userUpdated: true })),
    };
    mockEntityConfigService = {
      getDetailsViewConfig: vi.fn().mockReturnValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        UserEntityLinkService,
        {
          provide: EntityRegistry,
          useValue: {
            getEntityTypes: () =>
              entityTypes.map((value) => ({ key: value.ENTITY_TYPE, value })),
          },
        },
        { provide: SessionSubject, useValue: sessionInfo },
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: EntityConfigService, useValue: mockEntityConfigService },
      ],
    });

    service = TestBed.inject(UserEntityLinkService);
  }

  describe("getUserEntityTypes", () => {
    it("returns only entity types with enableUserAccounts, in registry order", () => {
      setup([
        NonAccountEntity,
        AccountEnabledEntity,
        OtherAccountEnabledEntity,
      ]);

      expect(service.getUserEntityTypes()).toEqual([
        AccountEnabledEntity,
        OtherAccountEnabledEntity,
      ]);
    });

    it("returns an empty array when no type supports accounts", () => {
      setup([NonAccountEntity]);

      expect(service.getUserEntityTypes()).toEqual([]);
    });
  });

  describe("shouldOfferStep", () => {
    it("is true when the account has no linked entity and can manage accounts", () => {
      setup([]);

      expect(service.shouldOfferStep()).toBe(true);
    });

    it("is false when the account already has a linked entity (e.g. demo mode)", () => {
      setup([]);
      sessionInfo.next({ ...sessionInfo.value, entityId: "User:demo-admin" });

      expect(service.shouldOfferStep()).toBe(false);
    });

    it("is false when the account cannot manage accounts", () => {
      setup([]);
      mockUserAdminService.canManageAccounts.mockReturnValue(false);

      expect(service.shouldOfferStep()).toBe(false);
    });
  });

  describe("getProfileFieldGroups", () => {
    it("uses the fieldGroups of the first panel's Form component, verbatim", () => {
      setup([AccountEnabledEntity]);
      const fieldGroups = [{ fields: ["name", "other"] }];
      mockEntityConfigService.getDetailsViewConfig.mockReturnValue({
        config: {
          panels: [
            {
              title: "Basic",
              components: [
                { component: "Form", config: { fieldGroups } },
                { component: "RelatedEntities", config: {} },
              ],
            },
            {
              title: "More",
              components: [
                {
                  component: "Form",
                  config: { fieldGroups: [{ fields: ["ignored"] }] },
                },
              ],
            },
          ],
        },
      });

      expect(service.getProfileFieldGroups(AccountEnabledEntity)).toBe(
        fieldGroups,
      );
    });

    it("falls back to toStringAttributes when there is no details view config", () => {
      setup([AccountEnabledEntity]);
      mockEntityConfigService.getDetailsViewConfig.mockReturnValue(undefined);

      expect(service.getProfileFieldGroups(AccountEnabledEntity)).toEqual([
        { fields: AccountEnabledEntity.toStringAttributes },
      ]);
    });

    it("falls back to toStringAttributes when the first panel has no Form component", () => {
      setup([AccountEnabledEntity]);
      mockEntityConfigService.getDetailsViewConfig.mockReturnValue({
        config: {
          panels: [
            { title: "Basic", components: [{ component: "RelatedEntities" }] },
          ],
        },
      });

      expect(service.getProfileFieldGroups(AccountEnabledEntity)).toEqual([
        { fields: AccountEnabledEntity.toStringAttributes },
      ]);
    });
  });

  describe("linkAccountToEntity", () => {
    it("calls updateUser with the account id and profile entity id, returning whether it was written", async () => {
      setup([]);
      mockUserAdminService.updateUser.mockReturnValue(
        of({ userUpdated: true }),
      );

      const result = await service.linkAccountToEntity(
        "AccountEnabledEntity:1",
      );

      expect(mockUserAdminService.updateUser).toHaveBeenCalledWith(
        "account-1",
        { userEntityId: "AccountEnabledEntity:1" },
      );
      expect(result).toBe(true);
    });

    it("returns false (without throwing) when the write fails to be persisted", async () => {
      setup([]);
      mockUserAdminService.updateUser.mockReturnValue(
        of({ userUpdated: false }),
      );

      expect(await service.linkAccountToEntity("AccountEnabledEntity:1")).toBe(
        false,
      );
    });

    it("returns false (without throwing) when the account cannot manage accounts (403)", async () => {
      setup([]);
      mockUserAdminService.updateUser.mockReturnValue(
        throwError(() => new UserAdminApiError(403)),
      );

      expect(await service.linkAccountToEntity("AccountEnabledEntity:1")).toBe(
        false,
      );
    });
  });
});
