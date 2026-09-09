import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SystemInitAssistantComponent } from "./system-init-assistant.component";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { LOCATION_TOKEN } from "app/utils/di-tokens";
import { MatDialogRef } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { LanguageService } from "app/core/language/language.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { UserEntityLinkService } from "../user-entity-link.service";
import { Entity } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { AlertService } from "../../alerts/alert.service";

class ProfileTestEntity extends Entity {
  static override ENTITY_TYPE = "ProfileTestEntity";
  static override toStringAttributes = ["name"];
  static override label = "Profile";

  @DatabaseField() name: string;
}

class OtherProfileTestEntity extends Entity {
  static override ENTITY_TYPE = "OtherProfileTestEntity";
  static override toStringAttributes = ["name"];
  static override label = "Other Profile";

  @DatabaseField() name: string;
}

describe("SystemInitAssistantComponent", () => {
  let component: SystemInitAssistantComponent;
  let fixture: ComponentFixture<SystemInitAssistantComponent>;
  let mockLocation: { pathname: string };
  let mockUserEntityLinkService: {
    shouldOfferStep: ReturnType<typeof vi.fn>;
    getUserEntityTypes: ReturnType<typeof vi.fn>;
    getProfileFieldGroups: ReturnType<typeof vi.fn>;
    linkAccountToEntity: ReturnType<typeof vi.fn>;
  };

  async function configureComponent() {
    mockLocation = { pathname: "/some/path" };
    mockUserEntityLinkService = {
      shouldOfferStep: vi.fn().mockReturnValue(false),
      getUserEntityTypes: vi.fn().mockReturnValue([]),
      getProfileFieldGroups: vi.fn().mockReturnValue([{ fields: ["name"] }]),
      linkAccountToEntity: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [SystemInitAssistantComponent, MockedTestingModule.withState()],
      providers: [
        { provide: KeycloakAuthService, useValue: {} },
        { provide: MatDialogRef, useValue: { updateSize: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: new Map() } },
        },
        {
          provide: LanguageService,
          useValue: {
            getCurrentLocale: vi.fn(),
            initDefaultLanguage: vi.fn(),
          },
        },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: UserEntityLinkService, useValue: mockUserEntityLinkService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemInitAssistantComponent);
    component = fixture.componentInstance;
  }

  it("should preselect use case from route param and initialize system", async () => {
    await configureComponent();
    const mockConfigs = [{ id: "basic_setup" }] as any;
    vi.spyOn(
      component["setupService"],
      "getAvailableBaseConfig",
    ).mockResolvedValue(mockConfigs);
    vi.spyOn(component, "initializeSystem");

    (TestBed.inject(ActivatedRoute) as any).snapshot = {
      queryParamMap: new Map([["useCase", "basic_setup"]]),
    };

    await component.ngOnInit();

    expect(component.selectedUseCase()).toEqual(mockConfigs[0]);
    expect((component as any).initializeSystem).toHaveBeenCalled();
  });

  describe("profile linking step", () => {
    it("skips the step (with no notice) when shouldOfferStep is false, e.g. demo mode or missing permission", async () => {
      await configureComponent();
      mockUserEntityLinkService.getUserEntityTypes.mockReturnValue([
        ProfileTestEntity,
      ]);

      await component["prepareProfileStep"]();

      expect(component.showProfileStep()).toBe(false);
      expect(component.profileStepReady()).toBe(true);
      expect(component.profileStepNotice()).toBeNull();
      // the type list is never even resolved when the step isn't offered at all
      expect(
        mockUserEntityLinkService.getUserEntityTypes,
      ).not.toHaveBeenCalled();
    });

    it("shows a notice and skips the step when no configured type supports accounts", async () => {
      await configureComponent();
      mockUserEntityLinkService.shouldOfferStep.mockReturnValue(true);
      mockUserEntityLinkService.getUserEntityTypes.mockReturnValue([]);

      await component["prepareProfileStep"]();

      expect(component.showProfileStep()).toBe(false);
      expect(component.profileStepReady()).toBe(true);
      expect(component.profileStepNotice()).toBeTruthy();
    });

    it("prepares a form for the single account-enabled type without a picker", async () => {
      await configureComponent();
      mockUserEntityLinkService.shouldOfferStep.mockReturnValue(true);
      mockUserEntityLinkService.getUserEntityTypes.mockReturnValue([
        ProfileTestEntity,
      ]);

      await component["prepareProfileStep"]();

      expect(component.showProfileStep()).toBe(true);
      expect(component.selectedProfileType()).toBe(ProfileTestEntity);
      expect(component.profileForm()).toBeTruthy();
    });

    it("waits for a selection instead of auto-selecting when several types are offered", async () => {
      await configureComponent();
      mockUserEntityLinkService.shouldOfferStep.mockReturnValue(true);
      mockUserEntityLinkService.getUserEntityTypes.mockReturnValue([
        ProfileTestEntity,
        OtherProfileTestEntity,
      ]);

      await component["prepareProfileStep"]();

      expect(component.showProfileStep()).toBe(true);
      expect(component.selectedProfileType()).toBeNull();
      expect(component.profileForm()).toBeNull();

      await component.onProfileTypeSelected(ProfileTestEntity);

      expect(component.selectedProfileType()).toBe(ProfileTestEntity);
      expect(component.profileForm()).toBeTruthy();
    });

    it("reloads the app only when the account link was actually written", async () => {
      await configureComponent();
      mockUserEntityLinkService.shouldOfferStep.mockReturnValue(true);
      mockUserEntityLinkService.getUserEntityTypes.mockReturnValue([
        ProfileTestEntity,
      ]);
      await component["prepareProfileStep"]();
      (component.profileForm().formGroup.get("name") as any)?.setValue(
        "Test Admin",
      );

      await component.saveProfile();

      expect(mockUserEntityLinkService.linkAccountToEntity).toHaveBeenCalled();
      expect(mockLocation.pathname).toBe("");
    });

    it("does not reload and warns the user when the link could not be written", async () => {
      await configureComponent();
      mockUserEntityLinkService.shouldOfferStep.mockReturnValue(true);
      mockUserEntityLinkService.getUserEntityTypes.mockReturnValue([
        ProfileTestEntity,
      ]);
      mockUserEntityLinkService.linkAccountToEntity.mockResolvedValue(false);
      await component["prepareProfileStep"]();
      (component.profileForm().formGroup.get("name") as any)?.setValue(
        "Test Admin",
      );

      const alertService = TestBed.inject(AlertService);
      vi.spyOn(alertService, "addWarning");

      await component.saveProfile();

      expect(mockLocation.pathname).toBe("/some/path");
      expect(alertService.addWarning).toHaveBeenCalled();
      expect(component.showProfileStep()).toBe(false);
      // persists beyond the transient toast, so the created-but-unlinked profile isn't lost
      expect(component.profileStepNotice()).toBeTruthy();
    });

    it("does not attempt to link when the user skips the step", async () => {
      await configureComponent();
      mockUserEntityLinkService.shouldOfferStep.mockReturnValue(true);
      mockUserEntityLinkService.getUserEntityTypes.mockReturnValue([
        ProfileTestEntity,
      ]);
      await component["prepareProfileStep"]();

      component.skipProfileStep();

      expect(component.showProfileStep()).toBe(false);
      expect(
        mockUserEntityLinkService.linkAccountToEntity,
      ).not.toHaveBeenCalled();
    });
  });
});
