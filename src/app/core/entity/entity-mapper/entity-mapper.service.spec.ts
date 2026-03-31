import { EntityMapperService } from "./entity-mapper.service";
import { Entity } from "../model/entity";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { PouchDatabase } from "../../database/pouchdb/pouch-database";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "../database-entity.decorator";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { MemoryPouchDatabase } from "../../database/pouchdb/memory-pouch-database";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { SyncStateSubject } from "app/core/session/session-type";
import { DatabaseFactoryService } from "../../database/database-factory.service";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { firstValueFrom, Subject } from "rxjs";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityPermissionError } from "./entity-permission-error";
import { EntitySchemaService } from "../schema/entity-schema.service";
import type { Mock } from "vitest";
import { UpdateMetadata } from "../model/update-metadata";
import { BoundedEntityCache } from "./bounded-entity-cache";

describe("EntityMapperService", () => {
  let entityMapper: EntityMapperService;
  let testDatabase: PouchDatabase;

  const existingEntity = {
    _id: "Entity:existing-entity",
    label: "entity from database",
  };

  const existingEntity2 = {
    _id: "Entity:existing-entity2",
    label: "entity 2 from database",
  };

  beforeEach(waitForAsync(() => {
    const syncStateSubject = new SyncStateSubject();
    let dbFactory = {
      createDatabase: vi.fn(),
    };
    dbFactory.createDatabase.mockImplementation((dbName) => {
      const db = new MemoryPouchDatabase(dbName, syncStateSubject);
      db.init();
      return db;
    });

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        DatabaseResolverService,
        { provide: DatabaseFactoryService, useValue: dbFactory },
        CurrentUserSubject,
        EntityMapperService,
      ],
    });
    entityMapper = TestBed.inject(EntityMapperService);

    testDatabase = TestBed.inject(
      DatabaseResolverService,
    ).getDatabase() as MemoryPouchDatabase;

    return Promise.all([
      testDatabase.put(existingEntity),
      testDatabase.put(existingEntity2),
    ]);
  }));

  afterEach(async () => {
    await testDatabase.destroy();
  });

  function expectEntity(actualEntity, expectedEntity) {
    expect(actualEntity.getId()).toBe(expectedEntity._id);
    expect(actualEntity).toBeInstanceOf(Entity);
  }

  it("loads existing entity", async () => {
    const loadedEntity = await entityMapper.load<Entity>(
      Entity,
      existingEntity._id,
    );
    expectEntity(loadedEntity, existingEntity);
  });

  it("load multiple entities", async () => {
    const loadedEntities = await entityMapper.loadType<Entity>(Entity);
    expect(loadedEntities).toHaveLength(2);

    const entity1 = loadedEntities[0];
    const entity2 = loadedEntities[1];

    expectEntity(entity1, existingEntity);
    expectEntity(entity2, existingEntity2);
  });

  it("rejects promise when loading nonexistent entity", async () => {
    return entityMapper.load<Entity>(Entity, "nonexistent_id").catch((err) => {
      expect(err, '"not found" error not defined').toBeDefined();
    });
  });

  it("returns empty array when loading non existing entity type ", async () => {
    class TempTestEntity extends Entity {
      static override ENTITY_TYPE = "TestEntity";
    }

    const result = await entityMapper.loadType<TempTestEntity>(TempTestEntity);
    expect(result).toHaveLength(0);
  });

  it("saves new entity and loads it", async () => {
    const entity = new Entity("test1");

    await entityMapper.save(entity);
    const loadedEntity = await entityMapper.load(Entity, entity.getId());
    expectEntity(loadedEntity, entity);
  });

  it("rejects promise when saving new entity with existing entityId", async () => {
    const duplicateEntity = new Entity(existingEntity._id);

    await entityMapper
      .save<Entity>(duplicateEntity)
      .then(() => {
        throw new Error("unexpectedly succeeded to overwrite existing entity");
      })
      .catch(function (error) {
        expect(error).toBeDefined();
      });
  });

  it("saves new version of existing entity", async () => {
    const loadedEntity = await entityMapper.load(Entity, existingEntity._id);
    expect(loadedEntity.getId()).toEqual(existingEntity._id);

    await entityMapper.save<Entity>(loadedEntity);
  });

  it("removes existing entity", async () => {
    const loadedEntity = await entityMapper.load(Entity, existingEntity._id);
    await entityMapper.remove<Entity>(loadedEntity);

    await expect(
      entityMapper.load(Entity, existingEntity._id),
    ).rejects.toThrow();
  });

  it("rejects promise removing nonexistent entity", () => {
    const nonexistingEntity = new Entity("nonexistent-entity");

    return entityMapper
      .remove<Entity>(nonexistingEntity)
      .then(() => fail("unexpectedly resolved promise"))
      .catch((error) => {
        expect(error).toBeDefined();
      });
  });

  it("loads entity for id given with and without prefix", async () => {
    const testId = "t1";
    const testEntity = new Entity(testId);
    await entityMapper.save(testEntity);

    const loadedByShortId = await entityMapper.load(
      Entity,
      testEntity.getId(true),
    );
    expect(loadedByShortId).toBeDefined();
    expect(loadedByShortId.getId().startsWith(Entity.ENTITY_TYPE)).toBe(true);

    const loadedByFullId = await entityMapper.load(
      Entity,
      loadedByShortId.getId(),
    );
    expect(loadedByFullId.getId()).toBe(loadedByShortId.getId());
    expect(loadedByFullId._rev).toBe(loadedByShortId._rev);
  });

  it("publishes when an existing entity is created, updated and deleted", async () => {
    // use TestEntity to avoid catching updates of the existing Entity entities from beforeEach
    const testId = "TestEntity:test-update-event";
    const testEntity = new TestEntity(testId);

    let updatePromise = firstValueFrom(entityMapper.receiveUpdates(TestEntity));
    await entityMapper.save(testEntity);
    expect(await updatePromise).toEqual({
      type: "new",
      entity: expect.objectContaining({ _id: testId }),
    });

    let existing = await entityMapper.load<TestEntity>(TestEntity, testId);
    existing.name = "updated name";
    updatePromise = firstValueFrom(entityMapper.receiveUpdates(TestEntity));
    await entityMapper.save(existing);
    expect(await updatePromise).toEqual({
      type: "update",
      entity: expect.objectContaining({ _id: testId }),
    });

    existing = await entityMapper.load<TestEntity>(TestEntity, testId);
    updatePromise = firstValueFrom(entityMapper.receiveUpdates(TestEntity));
    await entityMapper.remove(existing);
    expect(await updatePromise).toEqual({
      type: "remove",
      entity: expect.objectContaining({ _id: testId }),
    });
  });

  it("correctly behaves when en empty array is given to the saveAll function", async () => {
    const result = await entityMapper.saveAll([]);
    expect(result).toHaveLength(0);
  });

  it("correctly saves an array of heterogeneous entities", async () => {
    const result = await entityMapper.saveAll([
      new MockEntityA("1"),
      new MockEntityA("10"),
      new MockEntityA("42"),
    ]);
    expect(result).toEqual([
      expect.objectContaining({
        ok: true,
        id: "EntityA:1",
      }),
      expect.objectContaining({
        ok: true,
        id: "EntityA:10",
      }),
      expect.objectContaining({
        ok: true,
        id: "EntityA:42",
      }),
    ]);
  });

  it("correctly saves an array of homogeneous entities", async () => {
    const result = await entityMapper.saveAll([
      new MockEntityA("1"),
      new MockEntityB("10"),
      new MockEntityA("42"),
    ]);
    expect(result).toEqual([
      expect.objectContaining({
        ok: true,
        id: "EntityA:1",
      }),
      expect.objectContaining({
        ok: true,
        id: "EntityB:10",
      }),
      expect.objectContaining({
        ok: true,
        id: "EntityA:42",
      }),
    ]);
  });

  it("sets the entityCreated property on save if it is a new entity & entityUpdated on subsequent saves", async () => {
    vi.useFakeTimers();
    const currentUser = new Entity(TEST_USER);
    TestBed.inject(CurrentUserSubject).next(currentUser);
    const id = "test_created";
    const entity = new Entity(id);

    const mockTime1 = 1;
    vi.setSystemTime(new Date(mockTime1));
    await entityMapper.save(entity);
    const createdEntity = await entityMapper.load(Entity, id);

    expect(createdEntity.created?.at.getTime()).toEqual(mockTime1);
    expect(createdEntity.created?.by).toEqual(currentUser.getId());
    expect(createdEntity.updated?.at.getTime()).toEqual(mockTime1);
    expect(createdEntity.updated?.by).toEqual(currentUser.getId());

    const mockTime2 = mockTime1 + 1;
    vi.setSystemTime(new Date(mockTime2));
    await entityMapper.save<Entity>(createdEntity);
    const updatedEntity = await entityMapper.load<Entity>(Entity, id);

    expect(updatedEntity.created?.at.getTime()).toEqual(mockTime1);
    expect(updatedEntity.updated?.at.getTime()).toEqual(mockTime2);

    vi.useRealTimers();
  });

  it("keeps explicit created.by value for anonymous creation", async () => {
    const id = "anonymous_public_form_created";
    const entity = new Entity(id);
    entity.created = new UpdateMetadata("PublicForm:form-id");

    await entityMapper.save(entity);
    const savedEntity = await entityMapper.load(Entity, id);

    expect(savedEntity.created?.by).toBe("PublicForm:form-id");
    expect(savedEntity.updated?.by).toBe("PublicForm:form-id");
  });

  @DatabaseEntity("EntityA")
  class MockEntityA extends Entity {}

  @DatabaseEntity("EntityB")
  class MockEntityB extends Entity {}
});

describe("EntityMapperService permission checks", () => {
  let entityMapper: EntityMapperService;
  let mockAbility: {
    can: Mock;
    cannot: Mock;
    initialized: boolean;
  };
  let mockDbResolver: {
    getDatabase: Mock;
    changesFeed: Subject<any>;
  };

  beforeEach(() => {
    mockAbility = {
      can: vi.fn().mockName("EntityAbility.can"),
      cannot: vi.fn().mockName("EntityAbility.cannot"),
      initialized: true,
    };
    mockAbility.cannot.mockReturnValue(false);
    mockAbility.initialized = true;

    const mockDb = {
      put: vi.fn().mockName("put").mockResolvedValue({ ok: true, rev: "1-x" }),
      putAll: vi
        .fn()
        .mockName("putAll")
        .mockResolvedValue([{ ok: true, rev: "1-x" }]),
      remove: vi.fn().mockName("remove").mockResolvedValue({ ok: true }),
    };
    mockDbResolver = {
      getDatabase: vi.fn().mockName("DatabaseResolverService.getDatabase"),
      changesFeed: new Subject(),
    };
    mockDbResolver.getDatabase.mockReturnValue(mockDb);

    TestBed.configureTestingModule({
      providers: [
        EntityMapperService,
        EntitySchemaService,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: DatabaseResolverService, useValue: mockDbResolver },
        { provide: EntityAbility, useValue: mockAbility },
        CurrentUserSubject,
      ],
    });
    entityMapper = TestBed.inject(EntityMapperService);
  });

  it("should throw EntityPermissionError when saving a new entity without create permission", async () => {
    mockAbility.cannot.mockReturnValue(true);
    const entity = new Entity("test-no-create");

    await expect(entityMapper.save(entity)).rejects.toBeInstanceOf(
      EntityPermissionError,
    );
    expect(mockAbility.cannot).toHaveBeenCalledWith("create", entity);
  });

  it("should throw EntityPermissionError when saving an existing entity without update permission", async () => {
    mockAbility.cannot.mockImplementation(
      (action: string) => action === "update",
    );
    const entity = new Entity("test-no-update");
    // simulate existing entity (not new)
    entity._rev = "1-abc";

    await expect(entityMapper.save(entity)).rejects.toBeInstanceOf(
      EntityPermissionError,
    );
    expect(mockAbility.cannot).toHaveBeenCalledWith("update", entity);
  });

  it("should throw EntityPermissionError in saveAll when any entity lacks permission", async () => {
    const allowed = new Entity("allowed");
    const denied = new Entity("denied");
    mockAbility.cannot.mockImplementation(
      (_action: string, e: Entity) => e === denied,
    );

    await expect(
      entityMapper.saveAll([allowed, denied]),
    ).rejects.toBeInstanceOf(EntityPermissionError);
  });

  it("should throw EntityPermissionError when removing an entity without delete permission", async () => {
    mockAbility.cannot.mockImplementation(
      (action: string) => action === "delete",
    );
    const entity = new Entity("test-no-delete");
    entity._rev = "1-abc";

    await expect(entityMapper.remove(entity)).rejects.toBeInstanceOf(
      EntityPermissionError,
    );
    expect(mockAbility.cannot).toHaveBeenCalledWith("delete", entity);
  });
});

describe("EntityMapperService caching", () => {
  let entityMapper: EntityMapperService;
  let mockDb: {
    get: Mock;
    getAll: Mock;
    put: Mock;
    putAll: Mock;
    remove: Mock;
  };
  let changesFeed$: Subject<any>;

  beforeEach(() => {
    mockDb = {
      get: vi.fn().mockName("get"),
      getAll: vi.fn().mockName("getAll").mockResolvedValue([]),
      put: vi.fn().mockName("put").mockResolvedValue({ ok: true, rev: "1-x" }),
      putAll: vi
        .fn()
        .mockName("putAll")
        .mockResolvedValue([{ ok: true, rev: "1-x" }]),
      remove: vi.fn().mockName("remove").mockResolvedValue({ ok: true }),
    };
    changesFeed$ = new Subject();

    const mockDbResolver = {
      getDatabase: vi.fn().mockReturnValue(mockDb),
      changesFeed: changesFeed$.asObservable(),
    };

    const mockSchemaService = {
      loadDataIntoEntity: (entity: Entity, data: any) =>
        Object.assign(entity, data),
      transformEntityToDatabaseFormat: (entity: Entity) => ({
        _id: entity.getId(),
        _rev: entity._rev,
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        EntityMapperService,
        { provide: EntitySchemaService, useValue: mockSchemaService },
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: DatabaseResolverService, useValue: mockDbResolver },
        CurrentUserSubject,
      ],
    });
    entityMapper = TestBed.inject(EntityMapperService);
  });

  it("load() caches: second call with same ID does not hit database", async () => {
    const record = { _id: "Entity:1", _rev: "1-a" };
    mockDb.get.mockResolvedValue(record);

    await entityMapper.load(Entity, "1");
    await entityMapper.load(Entity, "1");

    expect(mockDb.get).toHaveBeenCalledTimes(1);
  });

  it("loadType() populates cache: subsequent load() for same entity uses cache", async () => {
    const records = [
      { _id: "Entity:a", _rev: "1-a" },
      { _id: "Entity:b", _rev: "1-b" },
    ];
    mockDb.getAll.mockResolvedValue(records);

    await entityMapper.loadType(Entity);

    // individual load should now be served from cache
    const result = await entityMapper.load(Entity, "a");
    expect(result.getId()).toBe("Entity:a");
    expect(mockDb.get).not.toHaveBeenCalled();
  });

  it("loadType() caches: second call does not re-fetch from database", async () => {
    mockDb.getAll.mockResolvedValue([{ _id: "Entity:1", _rev: "1-a" }]);

    await entityMapper.loadType(Entity);
    await entityMapper.loadType(Entity);

    expect(mockDb.getAll).toHaveBeenCalledTimes(1);
  });

  it("save() updates cache: load after save returns updated data without DB call", async () => {
    // seed with initial load
    mockDb.get.mockResolvedValue({
      _id: "Entity:1",
      _rev: "1-a",
      label: "old",
    });
    await entityMapper.load(Entity, "1");
    mockDb.get.mockClear();

    // save updated entity
    const entity = new Entity("1");
    entity._rev = "1-a";
    mockDb.put.mockResolvedValue({ ok: true, rev: "2-b" });
    await entityMapper.save(entity);

    // load should use cache, not DB
    const loaded = await entityMapper.load(Entity, "1");
    expect(mockDb.get).not.toHaveBeenCalled();
    expect(loaded._rev).toBe("2-b");
  });

  it("remove() removes from cache: subsequent load hits database", async () => {
    mockDb.get.mockResolvedValue({ _id: "Entity:1", _rev: "1-a" });
    await entityMapper.load(Entity, "1");
    mockDb.get.mockClear();

    const entity = new Entity("1");
    entity._rev = "1-a";
    await entityMapper.remove(entity);

    // next load should go to DB since cache entry was deleted
    mockDb.get.mockResolvedValue({ _id: "Entity:1", _rev: "3-c" });
    await entityMapper.load(Entity, "1");
    expect(mockDb.get).toHaveBeenCalledTimes(1);
  });

  it("external change via changesFeed updates cached entity", async () => {
    mockDb.get.mockResolvedValue({
      _id: "Entity:1",
      _rev: "1-a",
      label: "original",
    });
    await entityMapper.load(Entity, "1");
    mockDb.get.mockClear();

    // simulate external sync change
    changesFeed$.next({ _id: "Entity:1", _rev: "2-b", label: "synced" });

    // load should use updated cache, not hit DB
    const loaded = await entityMapper.load(Entity, "1");
    expect(mockDb.get).not.toHaveBeenCalled();
    expect(loaded._rev).toBe("2-b");
  });

  it("external delete via changesFeed removes cached entity", async () => {
    mockDb.get.mockResolvedValue({ _id: "Entity:1", _rev: "1-a" });
    await entityMapper.load(Entity, "1");
    mockDb.get.mockClear();

    // simulate external deletion
    changesFeed$.next({ _id: "Entity:1", _rev: "2-b", _deleted: true });

    // next load should go to DB
    mockDb.get.mockResolvedValue({ _id: "Entity:1", _rev: "3-c" });
    await entityMapper.load(Entity, "1");
    expect(mockDb.get).toHaveBeenCalledTimes(1);
  });

  it("cache eviction triggers when exceeding maxSize", async () => {
    // replace cache with a small one
    (entityMapper as any).cache = new BoundedEntityCache(3);

    mockDb.getAll.mockResolvedValue([
      { _id: "Entity:1", _rev: "1" },
      { _id: "Entity:2", _rev: "1" },
      { _id: "Entity:3", _rev: "1" },
      { _id: "Entity:4", _rev: "1" },
    ]);

    await entityMapper.loadType(Entity);

    // cache should have been evicted (4 > 3)
    // so next loadType should re-fetch from DB
    mockDb.getAll.mockClear();
    mockDb.getAll.mockResolvedValue([{ _id: "Entity:1", _rev: "1" }]);
    await entityMapper.loadType(Entity);
    expect(mockDb.getAll).toHaveBeenCalledTimes(1);
  });

  it("loadType() reflects entities added via changesFeed when type was fully loaded", async () => {
    mockDb.getAll.mockResolvedValue([{ _id: "Entity:1", _rev: "1-a" }]);
    const result1 = await entityMapper.loadType(Entity);
    expect(result1).toHaveLength(1);

    // simulate new entity arriving via sync
    changesFeed$.next({ _id: "Entity:2", _rev: "1-b" });

    // loadType should include the new entity from cache
    const result2 = await entityMapper.loadType(Entity);
    expect(result2).toHaveLength(2);
    expect(mockDb.getAll).toHaveBeenCalledTimes(1); // no re-fetch
  });
});
