import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DemoAssistantButtonComponent } from "./demo-assistant-button.component";
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

describe("DemoAssistantButtonComponent", () => {
  let component: DemoAssistantButtonComponent;
  let fixture: ComponentFixture<DemoAssistantButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoAssistantButtonComponent],
      providers: [
        CurrentUserSubject,
        LoginStateSubject,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: KeycloakAuthService, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: NAVIGATOR_TOKEN, useValue: {} },
        SyncStateSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoAssistantButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
