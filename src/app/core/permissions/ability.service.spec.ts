import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { AbilityService, DatabaseRules } from "./ability.service";
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { AppConfig } from "../app-config/app-config";
import { Ability } from "@casl/ability";
import { SessionService } from "../session/session-service/session.service";

describe("AbilityService", () => {
  let service: AbilityService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  const mockDBEndpoint = "https://example.com/db/";
  let mockAbility: jasmine.SpyObj<Ability>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(() => {
    AppConfig.settings = { database: { remote_url: mockDBEndpoint } } as any;
    mockHttpClient = jasmine.createSpyObj(["get"]);
    mockHttpClient.get.and.returnValue(of(testRules));
    mockAbility = jasmine.createSpyObj(["update"]);
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue({
      name: "testUser",
      roles: ["user_app"],
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: Ability, useValue: mockAbility },
        { provide: SessionService, useValue: mockSessionService },
      ],
    });
    service = TestBed.inject(AbilityService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should fetch the rules object from the backend", () => {
    service.initRules();

    expect(mockHttpClient.get).toHaveBeenCalledWith(mockDBEndpoint + "rules", {
      withCredentials: true,
    });
  });

  it("should update the ability with the received rules for the logged in user", fakeAsync(() => {
    service.initRules();
    tick();

    expect(mockAbility.update).toHaveBeenCalledWith(testRules.user_app);
  }));

  it("should update the ability with rules for all roles the logged in user has", fakeAsync(() => {
    mockSessionService.getCurrentUser.and.returnValue({
      name: "testAdmin",
      roles: ["user_app", "admin_app"],
    });

    service.initRules();
    tick();

    expect(mockAbility.update).toHaveBeenCalledWith(
      testRules.user_app.concat(testRules.admin_app)
    );
  }));

  const testRules: DatabaseRules = {
    user_app: [
      { subject: "Child", action: "read" },
      { subject: "Note", action: "manage", inverted: true },
    ],
    admin_app: [{ subject: "all", action: "manage" }],
  };
});
