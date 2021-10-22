import { TestBed } from "@angular/core/testing";

import {
  AbilityService,
  DatabaseRules,
  detectSubjectType,
  EntityAbility,
  EntityRule,
} from "./ability.service";
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { AppConfig } from "../app-config/app-config";
import { SessionService } from "../session/session-service/session.service";
import { Child } from "../../child-dev-project/children/model/child";
import { Note } from "../../child-dev-project/notes/model/note";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";

describe("AbilityService", () => {
  let service: AbilityService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  const mockDBEndpoint = "https://example.com/db/";
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let ability: EntityAbility;

  beforeEach(() => {
    AppConfig.settings = { database: { remote_url: mockDBEndpoint } } as any;
    mockHttpClient = jasmine.createSpyObj(["get"]);
    mockHttpClient.get.and.callFake(() => of(getRawRules() as any));
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue({
      name: "testUser",
      roles: ["user_app"],
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        {
          provide: EntityAbility,
          useValue: new EntityAbility([], {
            detectSubjectType: detectSubjectType,
          }),
        },
        { provide: SessionService, useValue: mockSessionService },
        { provide: EntityMapperService, useValue: undefined },
        EntitySchemaService,
        DynamicEntityService,
        AbilityService,
      ],
    });
    service = TestBed.inject(AbilityService);
    ability = TestBed.inject(EntityAbility);
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

  it("should update the ability with the received rules for the logged in user", async () => {
    spyOn(ability, "update");

    await service.initRules();

    expect(ability.update).toHaveBeenCalledWith(getParsedRules().user_app);
  });

  it("should update the ability with rules for all roles the logged in user has", async () => {
    spyOn(ability, "update");
    mockSessionService.getCurrentUser.and.returnValue({
      name: "testAdmin",
      roles: ["user_app", "admin_app"],
    });

    await service.initRules();

    expect(ability.update).toHaveBeenCalledWith(
      getParsedRules().user_app.concat(getParsedRules().admin_app)
    );
  });

  it("should create an ability that correctly uses the defined rules", async () => {
    await service.initRules();

    expect(ability.can("read", Child)).toBeTrue();
    expect(ability.can("create", Child)).toBeFalse();
    expect(ability.can("manage", Child)).toBeFalse();
    expect(ability.can("read", new Child())).toBeTrue();
    expect(ability.can("create", new Child())).toBeFalse();
    expect(ability.can("manage", Note)).toBeFalse();
    expect(ability.can("manage", new Note())).toBeFalse();
    expect(ability.can("create", new Note())).toBeFalse();

    mockSessionService.getCurrentUser.and.returnValue({
      name: "testAdmin",
      roles: ["user_app", "admin_app"],
    });
    await service.initRules();

    expect(ability.can("manage", Child)).toBeTrue();
    expect(ability.can("manage", new Child())).toBeTrue();
    expect(ability.can("manage", Note)).toBeTrue();
    expect(ability.can("manage", new Note())).toBeTrue();
  });

  it("should throw an error if the subject has wrong format is unknown", () => {
    mockHttpClient.get.and.returnValue(
      of({ user_app: [{ subject: Child, action: "read" }] })
    );

    return expectAsync(service.initRules()).toBeRejected();
  });

  function getRawRules(): DatabaseRules {
    return {
      user_app: [
        { subject: "Child", action: "read" },
        { subject: "Note", action: "manage", inverted: true },
      ],
      admin_app: [{ subject: "all", action: "manage" }],
    };
  }

  function getParsedRules(): { [key in string]: EntityRule[] } {
    return {
      user_app: [
        { subject: Child, action: "read" },
        { subject: Note, action: "manage", inverted: true },
      ],
      admin_app: [{ subject: "all", action: "manage" }],
    };
  }
});
