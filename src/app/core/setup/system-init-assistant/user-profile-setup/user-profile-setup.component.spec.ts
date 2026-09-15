import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject, of, throwError } from "rxjs";
import { UserProfileSetupComponent } from "./user-profile-setup.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { EntityConfigService } from "../../../entity/entity-config.service";
import {
  SessionInfo,
  SessionSubject,
} from "../../../session/auth/session-info";
import {
  UserAdminApiError,
  UserAdminService,
} from "../../../user/user-admin-service/user-admin.service";
import { AlertService } from "../../../alerts/alert.service";
import { SetupService } from "../../setup.service";
import { DatabaseResolverService } from "../../../database/database-resolver.service";
import { NotAvailableOfflineError } from "../../../session/not-available-offline.error";
import { KeycloakAuthService } from "../../../session/auth/keycloak/keycloak-auth.service";
import { LOCATION_TOKEN } from "app/utils/di-tokens";

class ProfileTestEntity extends Entity {
  static override ENTITY_TYPE = "ProfileTestEntity";
  static override enableUserAccounts = true;
  static override toStringAttributes = ["name"];
  static override label = "Profile";

  @DatabaseField() name: string;
}

class OtherProfileTestEntity extends Entity {
  static override ENTITY_TYPE = "OtherProfileTestEntity";
  static override enableUserAccounts = true;
  static override toStringAttributes = ["name"];
  static override label = "Other Profile";

  @DatabaseField() name: string;
}

class NonAccountTestEntity extends Entity {
  static override ENTITY_TYPE = "NonAccountTestEntity";

  @DatabaseField() name: string;
}

describe("UserProfileSetupComponent", () => {
  let component: UserProfileSetupComponent;
  let fixture: ComponentFixture<UserProfileSetupComponent>;
  let completedNotices: (string | null)[];

  let sessionInfo: BehaviorSubject<SessionInfo>;
  let mockUserAdminService: {
    canManageAccounts: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
  };
  let mockLocation: { pathname: string };
  let ensureSynced: ReturnType<typeof vi.fn>;
  let getEntityTypesSpy: ReturnType<typeof vi.spyOn>;
  let getDetailsViewConfigSpy: ReturnType<typeof vi.spyOn>;

  async function configureComponent(entityTypes: EntityConstructor[] = []) {
    sessionInfo = new BehaviorSubject<SessionInfo>({
      id: "account-1",
      name: "Test Admin",
      roles: ["account_manager"],
    });
    mockUserAdminService = {
      canManageAccounts: vi.fn().mockReturnValue(true),
      updateUser: vi.fn().mockReturnValue(of({ userUpdated: true })),
    };
    mockLocation = { pathname: "/some/path" };
    ensureSynced = vi.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [UserProfileSetupComponent, MockedTestingModule.withState()],
      providers: [
        { provide: KeycloakAuthService, useValue: {} },
        { provide: SessionSubject, useValue: sessionInfo },
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        {
          provide: DatabaseResolverService,
          useValue: { getDatabase: () => ({ ensureSynced }) },
        },
      ],
    }).compileComponents();

    getEntityTypesSpy = vi
      .spyOn(TestBed.inject(EntityRegistry), "getEntityTypes")
      .mockReturnValue(
        entityTypes.map((value) => ({ key: value.ENTITY_TYPE, value })),
      );
    getDetailsViewConfigSpy = vi
      .spyOn(TestBed.inject(EntityConfigService), "getDetailsViewConfig")
      .mockReturnValue(undefined);
    vi.spyOn(
      TestBed.inject(SetupService),
      "waitForConfigReady",
    ).mockResolvedValue(true);

    fixture = TestBed.createComponent(UserProfileSetupComponent);
    component = fixture.componentInstance;

    completedNotices = [];
    component.completed.subscribe((notice) => completedNotices.push(notice));
  }

  it("completes immediately, without resolving types, when the account already has a profile", async () => {
    await configureComponent([ProfileTestEntity]);
    sessionInfo.next({ ...sessionInfo.value, entityId: "User:demo-admin" });

    await component.ngOnInit();

    expect(component.applies()).toBe(false);
    expect(completedNotices).toEqual([null]);
    expect(getEntityTypesSpy).not.toHaveBeenCalled();
  });

  it("completes immediately when the account cannot manage accounts", async () => {
    await configureComponent([ProfileTestEntity]);
    mockUserAdminService.canManageAccounts.mockReturnValue(false);

    await component.ngOnInit();

    expect(component.applies()).toBe(false);
    expect(completedNotices).toEqual([null]);
  });

  it("completes with a notice when no configured type supports accounts", async () => {
    await configureComponent([NonAccountTestEntity]);

    await component.ngOnInit();

    expect(component.ready()).toBe(false);
    expect(completedNotices.length).toBe(1);
    expect(completedNotices[0]).toBeTruthy();
  });

  it("offers only the types with enableUserAccounts, in registry order", async () => {
    await configureComponent([
      NonAccountTestEntity,
      ProfileTestEntity,
      OtherProfileTestEntity,
    ]);

    await component.ngOnInit();

    expect(component.entityTypes()).toEqual([
      ProfileTestEntity,
      OtherProfileTestEntity,
    ]);
  });

  it("prepares a form for the single account-enabled type without a picker", async () => {
    await configureComponent([ProfileTestEntity]);

    await component.ngOnInit();

    expect(component.ready()).toBe(true);
    expect(component.selectedType()).toBe(ProfileTestEntity);
    expect(component.form()).toBeTruthy();
    expect(completedNotices).toEqual([]);
  });

  it("waits for a selection instead of auto-selecting when several types are offered", async () => {
    await configureComponent([ProfileTestEntity, OtherProfileTestEntity]);

    await component.ngOnInit();

    expect(component.selectedType()).toBeNull();
    expect(component.form()).toBeNull();

    await component.selectType(ProfileTestEntity);

    expect(component.selectedType()).toBe(ProfileTestEntity);
    expect(component.form()).toBeTruthy();
  });

  describe("the form's field groups", () => {
    it("uses the fieldGroups of the first panel's Form component, verbatim", async () => {
      await configureComponent([ProfileTestEntity]);
      const fieldGroups = [{ fields: ["name"] }];
      getDetailsViewConfigSpy.mockReturnValue({
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
      } as any);

      await component.ngOnInit();

      expect(component.fieldGroups()).toBe(fieldGroups);
    });

    it("falls back to toStringAttributes when there is no details view config", async () => {
      await configureComponent([ProfileTestEntity]);
      getDetailsViewConfigSpy.mockReturnValue(undefined);

      await component.ngOnInit();

      expect(component.fieldGroups()).toEqual([
        { fields: ProfileTestEntity.toStringAttributes },
      ]);
    });

    it("falls back to toStringAttributes when the first panel has no Form component", async () => {
      await configureComponent([ProfileTestEntity]);
      getDetailsViewConfigSpy.mockReturnValue({
        config: {
          panels: [
            { title: "Basic", components: [{ component: "RelatedEntities" }] },
          ],
        },
      } as any);

      await component.ngOnInit();

      expect(component.fieldGroups()).toEqual([
        { fields: ProfileTestEntity.toStringAttributes },
      ]);
    });
  });

  describe("saving the profile", () => {
    async function initWithFilledForm() {
      await configureComponent([ProfileTestEntity]);
      await component.ngOnInit();
      (component.form().formGroup.get("name") as any)?.setValue("Test Admin");
    }

    it("pushes the new profile to the server before linking the account", async () => {
      await initWithFilledForm();
      const calls: string[] = [];
      ensureSynced.mockImplementation(async () => {
        calls.push("sync");
      });
      mockUserAdminService.updateUser.mockImplementation(() => {
        calls.push("link");
        return of({ userUpdated: true });
      });

      await component.save();

      // linking changes the user's permission rules, and the enforcer discards
      // unsynced local data on the next login - so the profile has to be on the
      // server before that happens
      expect(calls).toEqual(["sync", "link"]);
    });

    it("does not link or reload when the new profile could not be pushed to the server", async () => {
      await initWithFilledForm();
      ensureSynced.mockRejectedValue(
        new NotAvailableOfflineError("cannot sync"),
      );
      const alertService = TestBed.inject(AlertService);
      vi.spyOn(alertService, "addWarning");

      await component.save();

      expect(mockUserAdminService.updateUser).not.toHaveBeenCalled();
      expect(mockLocation.pathname).toBe("/some/path");
      expect(alertService.addWarning).toHaveBeenCalled();
      expect(completedNotices.length).toBe(1);
      expect(completedNotices[0]).toBeTruthy();
    });

    it("links the account to the created profile and reloads the app", async () => {
      await initWithFilledForm();

      await component.save();

      expect(mockUserAdminService.updateUser).toHaveBeenCalledWith(
        "account-1",
        {
          userEntityId: component.entity().getId(),
        },
      );
      expect(mockLocation.pathname).toBe("");
      expect(completedNotices).toEqual([]);
    });

    it("does not reload and warns the user when the link was not written", async () => {
      await initWithFilledForm();
      mockUserAdminService.updateUser.mockReturnValue(
        of({ userUpdated: false }),
      );
      const alertService = TestBed.inject(AlertService);
      vi.spyOn(alertService, "addWarning");

      await component.save();

      expect(mockLocation.pathname).toBe("/some/path");
      expect(alertService.addWarning).toHaveBeenCalled();
      // persists beyond the transient toast, so the created-but-unlinked profile isn't lost
      expect(completedNotices.length).toBe(1);
      expect(completedNotices[0]).toBeTruthy();
    });

    it("does not reload when the link request fails (e.g. 403)", async () => {
      await initWithFilledForm();
      mockUserAdminService.updateUser.mockReturnValue(
        throwError(() => new UserAdminApiError(403)),
      );

      await component.save();

      expect(mockLocation.pathname).toBe("/some/path");
      expect(completedNotices.length).toBe(1);
    });
  });

  it("does not attempt to link when the user skips the step", async () => {
    await configureComponent([ProfileTestEntity]);
    await component.ngOnInit();

    component.skip();

    expect(completedNotices).toEqual([null]);
    expect(mockUserAdminService.updateUser).not.toHaveBeenCalled();
  });
});
