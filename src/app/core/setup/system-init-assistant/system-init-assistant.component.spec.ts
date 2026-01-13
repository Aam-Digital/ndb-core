import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { SystemInitAssistantComponent } from "./system-init-assistant.component";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import {
  LoginStateSubject,
  SyncStateSubject,
} from "../../session/session-type";
import {
  LOCATION_TOKEN,
  NAVIGATOR_TOKEN,
  WINDOW_TOKEN,
} from "app/utils/di-tokens";
import { CurrentUserSubject } from "../../session/current-user-subject";
import {
  entityRegistry,
  EntityRegistry,
} from "../../entity/database-entity.decorator";
import { DemoDataInitializerService } from "../../demo-data/demo-data-initializer.service";
import {
  DemoDataService,
  DemoDataServiceConfig,
} from "../../demo-data/demo-data.service";
import { SessionManagerService } from "../../session/session-service/session-manager.service";
import { SessionSubject } from "../../session/auth/session-info";
import { MatDialogRef } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { LanguageService } from "app/core/language/language.service";
import { EntityAbility } from "app/core/permissions/ability/entity-ability";

describe("SystemInitAssistantComponent", () => {
  let component: SystemInitAssistantComponent;
  let fixture: ComponentFixture<SystemInitAssistantComponent>;
  const mockLocation = {} as Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemInitAssistantComponent, HttpClientTestingModule],
      providers: [
        CurrentUserSubject,
        DemoDataInitializerService,
        DemoDataService,
        DemoDataServiceConfig,
        LoginStateSubject,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: KeycloakAuthService, useValue: {} },
        {
          provide: MatDialogRef,
          useValue: jasmine.createSpyObj(["updateSize"]),
        },
        { provide: NAVIGATOR_TOKEN, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
        {
          provide: LanguageService,
          useValue: jasmine.createSpyObj(["getCurrentLocale"]),
        },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: EntityAbility, useValue: { can: () => true } },
        SyncStateSubject,
        SessionManagerService,
        SessionSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemInitAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should preselect use case from route param and initialize system", async () => {
    const mockConfigs = [{ id: "basic_setup" }] as any;
    spyOn(component["setupService"], "getAvailableBaseConfig").and.resolveTo(
      mockConfigs,
    );
    spyOn(component, "initializeSystem");

    (TestBed.inject(ActivatedRoute) as any).snapshot = {
      queryParamMap: new Map([["useCase", "basic_setup"]]),
    };

    await component.ngOnInit();

    expect(component.selectedUseCase()).toEqual(mockConfigs[0]);
    expect((component as any).initializeSystem).toHaveBeenCalled();
  });
});
