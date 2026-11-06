import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotFoundComponent } from "./not-found.component";
import { RouterTestingModule } from "@angular/router/testing";
import { LOCATION_TOKEN, NAVIGATOR_TOKEN } from "../../../../utils/di-tokens";
import { Logging } from "../../../logging/logging.service";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import {
  LoginStateSubject,
  SyncStateSubject,
} from "app/core/session/session-type";
import { CurrentUserSubject } from "app/core/session/current-user-subject";
import { ConfigService } from "../../config.service";

describe("NotFoundComponent", () => {
  let fixture: ComponentFixture<NotFoundComponent>;
  let mockConfigService: {
    hasConfig: ReturnType<typeof vi.fn>;
    isSystemUninitialized: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.spyOn(Logging, "debug");
    mockConfigService = {
      hasConfig: vi.fn().mockReturnValue(false),
      isSystemUninitialized: vi.fn().mockReturnValue(true),
    };
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent, RouterTestingModule],
      providers: [
        { provide: LOCATION_TOKEN, useValue: { pathname: "/some/path" } },
        CurrentUserSubject,
        LoginStateSubject,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: KeycloakAuthService, useValue: {} },
        { provide: NAVIGATOR_TOKEN, useValue: {} },
        { provide: ConfigService, useValue: mockConfigService },
        SyncStateSubject,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
  });

  it("should call logging service with current route", () => {
    expect(Logging.debug).toHaveBeenCalledWith(
      "Could not find route: /some/path",
    );
  });

  it("should report a config that could not be loaded instead of treating the system as new", () => {
    mockConfigService.isSystemUninitialized.mockReturnValue(false);

    const newFixture = TestBed.createComponent(NotFoundComponent);
    newFixture.detectChanges();

    const text = newFixture.nativeElement.textContent;
    expect(text).toContain("could not be loaded");
    expect(text).not.toContain("No configuration available yet");
  });
});
