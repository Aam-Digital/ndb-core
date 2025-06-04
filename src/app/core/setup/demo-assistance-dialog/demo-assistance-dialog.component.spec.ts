import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { DemoAssistanceDialogComponent } from "./demo-assistance-dialog.component";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import {
  LoginStateSubject,
  SyncStateSubject,
} from "../../session/session-type";
import { NAVIGATOR_TOKEN } from "app/utils/di-tokens";
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

describe("DemoAssistanceDialogComponent", () => {
  let component: DemoAssistanceDialogComponent;
  let fixture: ComponentFixture<DemoAssistanceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoAssistanceDialogComponent, HttpClientTestingModule],
      providers: [
        CurrentUserSubject,
        DemoDataInitializerService,
        DemoDataService,
        DemoDataServiceConfig,
        LoginStateSubject,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: KeycloakAuthService, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: NAVIGATOR_TOKEN, useValue: {} },
        SyncStateSubject,
        SessionManagerService,
        SessionSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoAssistanceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
