import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SystemInitAssistantComponent } from "./system-init-assistant.component";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { LOCATION_TOKEN } from "app/utils/di-tokens";
import { MatDialogRef } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { LanguageService } from "app/core/language/language.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { SetupService } from "../setup.service";

describe("SystemInitAssistantComponent", () => {
  let component: SystemInitAssistantComponent;
  let fixture: ComponentFixture<SystemInitAssistantComponent>;
  let mockSetupService: {
    getAvailableBaseConfig: ReturnType<typeof vi.fn>;
    initSystemWithBaseConfig: ReturnType<typeof vi.fn>;
  };

  async function configureComponent(currentLocale?: string) {
    mockSetupService = {
      getAvailableBaseConfig: vi
        .fn()
        .mockName("SetupService.getAvailableBaseConfig")
        .mockResolvedValue([]),
      initSystemWithBaseConfig: vi
        .fn()
        .mockName("SetupService.initSystemWithBaseConfig")
        .mockResolvedValue(undefined),
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
            getCurrentLocale: vi.fn().mockReturnValue(currentLocale),
            initDefaultLanguage: vi.fn(),
          },
        },
        { provide: LOCATION_TOKEN, useValue: { pathname: "/some/path" } },
        { provide: SetupService, useValue: mockSetupService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemInitAssistantComponent);
    component = fixture.componentInstance;
  }

  it("should preselect use case from route param and initialize system", async () => {
    await configureComponent();
    const mockConfigs = [{ id: "basic_setup" }] as any;
    mockSetupService.getAvailableBaseConfig.mockResolvedValue(mockConfigs);
    vi.spyOn(component, "initializeSystem");

    (TestBed.inject(ActivatedRoute) as any).snapshot = {
      queryParamMap: new Map([["useCase", "basic_setup"]]),
    };

    await component.ngOnInit();

    expect(component.selectedUseCase()).toEqual(mockConfigs[0]);
    expect(component.initializeSystem).toHaveBeenCalled();
  });

  it.each([
    ["only the languages of localised use cases", [{ locale: "de" }], ["de"]],
    [
      "every language a use case lists",
      [{ locale: ["de", "fr"] }],
      ["de", "fr"],
    ],
    [
      "every language if a use case is offered in all of them",
      [{ locale: "de" }, {}],
      ["en-US", "de", "fr"],
    ],
  ])("offers %s to choose from", async (_, useCases, expectedLocales) => {
    await configureComponent();
    mockSetupService.getAvailableBaseConfig.mockResolvedValue(useCases);

    await component.ngOnInit();

    expect(component.availableLocales().map((l) => l.id)).toEqual(
      expectedLocales,
    );
  });

  it.each([
    [
      "only use cases in other languages exist",
      [{ locale: "de" }],
      ["en-US", "de"],
    ],
    ["no use case could be loaded", [], ["en-US"]],
    ["the current language has use cases", [{ locale: "en-US" }], ["en-US"]],
  ])(
    "always lists the current language, also if %s",
    async (_, useCases, expectedLocales) => {
      await configureComponent("en-US");
      mockSetupService.getAvailableBaseConfig.mockResolvedValue(useCases);

      await component.ngOnInit();

      expect(component.availableLocales().map((l) => l.id)).toEqual(
        expectedLocales,
      );
    },
  );

  it("does not show the profile step before a base config was imported successfully", async () => {
    await configureComponent();
    mockSetupService.initSystemWithBaseConfig.mockRejectedValue(
      new Error("import failed"),
    );
    component.selectedUseCase.set({ id: "basic_setup" } as any);

    await component.initializeSystem();

    expect(component.demoInitialized()).toBe(false);
  });

  it("keeps what the profile step reported for the final screen", async () => {
    await configureComponent();

    component.onProfileStepCompleted("profile created but not linked");

    expect(component.profileStepDone()).toBe(true);
    expect(component.profileStepNotice()).toBe(
      "profile created but not linked",
    );
  });
});
