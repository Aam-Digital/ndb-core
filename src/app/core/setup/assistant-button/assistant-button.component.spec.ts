import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AssistantButtonComponent } from "./assistant-button.component";
import {
  LoginStateSubject,
  SyncStateSubject,
} from "app/core/session/session-type";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { MatDialogRef } from "@angular/material/dialog";
import { NAVIGATOR_TOKEN } from "app/utils/di-tokens";
import { CurrentUserSubject } from "app/core/session/current-user-subject";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { SetupService } from "../setup.service";

describe("DemoAssistantButtonComponent", () => {
  let component: AssistantButtonComponent;
  let fixture: ComponentFixture<AssistantButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantButtonComponent],
      providers: [
        CurrentUserSubject,
        LoginStateSubject,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: KeycloakAuthService, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: NAVIGATOR_TOKEN, useValue: {} },
        {
          provide: SetupService,
          useValue: { detectConfigReadyState: Promise.resolve(true) },
        },
        SyncStateSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
