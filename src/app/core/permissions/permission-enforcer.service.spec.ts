import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { PermissionEnforcerService } from "./permission-enforcer.service";
import { DatabaseRule, DatabaseRules, EntityAbility } from "./permission-types";
import { SessionService } from "../session/session-service/session.service";
import { TEST_USER } from "../session/mock-session.module";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { PouchDatabase } from "../database/pouch-database";
import { Database } from "../database/database";
import { Child } from "../../child-dev-project/children/model/child";
import { School } from "../../child-dev-project/schools/model/school";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { AbilityService, detectEntityType } from "./ability.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { Permission } from "./permission";
import { Subject } from "rxjs";
import { LoginState } from "../session/session-states/login-state.enum";

describe("PermissionEnforcerService", () => {
  let service: PermissionEnforcerService;
  let mockSession: jasmine.SpyObj<SessionService>;
  const userRules: DatabaseRule[] = [
    { subject: "any", action: "manage" },
    { subject: "Child", action: "read", inverted: true },
  ];
  let database: PouchDatabase;

  beforeEach(fakeAsync(() => {
    mockSession = jasmine.createSpyObj(["getCurrentUser"], {
      loginState: new Subject(),
      syncState: new Subject(),
    });
    mockSession.getCurrentUser.and.returnValue({ name: TEST_USER, roles: [] });
    database = new PouchDatabase().initIndexedDB();

    TestBed.configureTestingModule({
      providers: [
        PermissionEnforcerService,
        EntityMapperService,
        EntitySchemaService,
        DynamicEntityService,
        AbilityService,
        {
          provide: EntityAbility,
          useValue: new EntityAbility([], {
            detectSubjectType: detectEntityType,
          }),
        },
        { provide: Database, useValue: database },
        { provide: SessionService, useValue: mockSession },
      ],
    });
    const dbRules: DatabaseRules = {};
    dbRules[TEST_USER] = userRules;
    TestBed.inject(EntityMapperService).save(new Permission(dbRules));
    tick();
    TestBed.inject(AbilityService);
    mockSession.loginState.next(LoginState.LOGGED_IN);
    service = TestBed.inject(PermissionEnforcerService);
    tick();
  }));

  afterEach(async () => {
    // await database.destroy();
    window.localStorage.removeItem(
      TEST_USER + "-" + PermissionEnforcerService.STORAGE_KEY
    );
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should write the users relevant permissions to local storage", async () => {
    await service.enforcePermissionsOnLocalData(userRules);

    const storedRules = window.localStorage.getItem(
      TEST_USER + "-" + PermissionEnforcerService.STORAGE_KEY
    );
    expect(JSON.parse(storedRules)).toEqual(userRules);
  });

  it("should remove all entities if a read restriction for this entity is defined and no rules are in local storage", async () => {
    const entityMapper = TestBed.inject(EntityMapperService);
    const child = Child.create("TestChild");
    const school = School.create({ name: "TestSchool" });
    await entityMapper.save(child);
    await entityMapper.save(school);
    const simpleQuery = {
      _id: "_design/test",
      views: {
        by_name: { map: "(doc) => doc.name ? emit(doc.name) : undefined " },
      },
    };
    const res = await database.put(simpleQuery);
    console.log("res", res);
    simpleQuery["_rev"] = res.rev;
    console.log("after", simpleQuery);
    const queryResultBefore = await database.query("test/by_name", {});
    expect(queryResultBefore.rows).toHaveSize(2);

    await service.enforcePermissionsOnLocalData(userRules);

    await expectAsync(entityMapper.load(Child, child._id)).toBeRejected();
    await expectAsync(entityMapper.load(School, school._id)).toBeResolved();
    const schoolDoc = await entityMapper.load(School, school._id);
    schoolDoc.name = "AnotherName";
    await entityMapper.save(schoolDoc);

    // TODO the `Child` documents is still found in the indices
    const queryResultAfter = await database.query("test/by_name", {
      include_docs: true,
    });
    console.log("queryresultsafter", queryResultAfter);
    expect(queryResultAfter.rows).toHaveSize(1);
  });

  it("should fail when writing deleted doc", async () => {
    const remoteDB = new PouchDatabase().initIndexedDB("remote-db");
    const child = new Child();
    const school = new School();
    await remoteDB.put(child);
    await remoteDB.put(school);
    await remoteDB.getPouchDB().sync(database.getPouchDB());
    await expectAsync(database.get(child._id)).toBeResolved();
    await expectAsync(database.get(school._id)).toBeResolved();

    await service.enforcePermissionsOnLocalData(userRules);

    await expectAsync(database.get(child._id)).toBeRejected();
    await expectAsync(database.get(school._id)).toBeResolved();

    // TODO probably some local documents have to be cleaned up first before the sync starts from the beginning
    await remoteDB.getPouchDB().sync(database.getPouchDB());
    await expectAsync(database.get(child._id)).toBeResolved();
    await expectAsync(database.get(school._id)).toBeResolved();
    await remoteDB.destroy();
    // fail();
  });
});
