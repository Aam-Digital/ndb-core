import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SystemInitAssistantComponent } from "./system-init-assistant.component";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { LOCATION_TOKEN } from "app/utils/di-tokens";
import { MatDialogRef } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { LanguageService } from "app/core/language/language.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("SystemInitAssistantComponent", () => {
  let component: SystemInitAssistantComponent;
  let fixture: ComponentFixture<SystemInitAssistantComponent>;

  async function configureComponent() {
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
        { provide: LOCATION_TOKEN, useValue: { pathname: "/some/path" } },
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

  it("does not show the profile step before a base config was imported successfully", async () => {
    await configureComponent();
    vi.spyOn(
      component["setupService"],
      "initSystemWithBaseConfig",
    ).mockRejectedValue(new Error("import failed"));
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
