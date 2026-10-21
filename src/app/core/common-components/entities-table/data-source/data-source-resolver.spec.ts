import { Injector } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { resolveDataSource } from "./data-source-resolver";
import { InMemoryDataSource } from "./in-memory-data-source";
import { PaginatedDataSource } from "./paginated-data-source";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { environment } from "#src/environments/environment";
import { SessionType } from "#src/app/core/session/session-type";
import { Entity } from "#src/app/core/entity/model/entity";
import { LoaderMethod } from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";
import { DatabaseResolverService } from "#src/app/core/database/database-resolver.service";
import { Database } from "#src/app/core/database/database";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { TranslatableTextDatatype } from "#src/app/core/config/translatable-text.datatype";
import { TranslatableText } from "#src/app/core/config/multi-lingual-config";

class InternalTestEntity extends Entity {
  static override isInternalEntity = true;
}

class InternalTranslatedTestEntity extends Entity {
  static override isInternalEntity = true;

  @DatabaseField({ dataType: TranslatableTextDatatype.dataType })
  title: TranslatableText;
}

describe("resolveDataSource", () => {
  let injector: Injector;
  const originalSessionType = environment.session_type;
  const originalDefaultDataSource = environment.default_data_source;

  let databaseSupportsFind: boolean;

  beforeEach(() => {
    databaseSupportsFind = true;
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [
        {
          provide: DatabaseResolverService,
          useValue: {
            getDatabase: () =>
              ({ supportsFind: () => databaseSupportsFind }) as Database,
          },
        },
      ],
    });
    injector = TestBed.inject(Injector);
  });

  afterEach(() => {
    environment.session_type = originalSessionType;
    environment.default_data_source = originalDefaultDataSource;
  });

  it("should use the PaginatedDataSource in online mode without a loaderMethod", () => {
    environment.session_type = SessionType.online;

    const dataSource = resolveDataSource<Entity>(injector);

    expect(dataSource).toBeInstanceOf(PaginatedDataSource);
  });

  it("should use the InMemoryDataSource in online mode if the database does not support pagination", () => {
    // e.g. a SyncedPouchDatabase created before session_type was switched to online
    environment.session_type = SessionType.online;
    databaseSupportsFind = false;

    const dataSource = resolveDataSource<Entity>(injector, "paginated");

    expect(dataSource).toBeInstanceOf(InMemoryDataSource);
  });

  it("should use the InMemoryDataSource in online mode when a loaderMethod is given and no dataSource is set", () => {
    environment.session_type = SessionType.online;

    const dataSource = resolveDataSource<Entity>(
      injector,
      undefined,
      LoaderMethod.ChildrenService,
    );

    expect(dataSource).toBeInstanceOf(InMemoryDataSource);
  });

  it("should respect an explicitly set dataSource in online mode even if a loaderMethod is given", () => {
    environment.session_type = SessionType.online;

    const dataSource = resolveDataSource<Entity>(
      injector,
      "paginated",
      LoaderMethod.ChildrenService,
    );

    expect(dataSource).toBeInstanceOf(PaginatedDataSource);
  });

  it("should ignore a paginated system-wide default outside of online mode", () => {
    environment.session_type = SessionType.synced;
    environment.default_data_source = "paginated";

    const dataSource = resolveDataSource<Entity>(injector);

    expect(dataSource).toBeInstanceOf(InMemoryDataSource);
  });

  it("should ignore a paginated dataSource configured for a list outside of online mode", () => {
    environment.session_type = SessionType.synced;

    const dataSource = resolveDataSource<Entity>(injector, "paginated");

    expect(dataSource).toBeInstanceOf(InMemoryDataSource);
  });

  it("should use the system-wide default data source in online mode when no dataSource is configured for the list", () => {
    environment.session_type = SessionType.online;
    environment.default_data_source = "in-memory";

    const dataSource = resolveDataSource<Entity>(injector);

    expect(dataSource).toBeInstanceOf(InMemoryDataSource);
  });

  it("should let a list's own dataSource config overwrite the system-wide default", () => {
    environment.session_type = SessionType.online;
    environment.default_data_source = "in-memory";

    const dataSource = resolveDataSource<Entity>(injector, "paginated");

    expect(dataSource).toBeInstanceOf(PaginatedDataSource);
  });

  it("should ignore a paginated system-wide default when a loaderMethod is given", () => {
    environment.session_type = SessionType.online;
    environment.default_data_source = "paginated";

    const dataSource = resolveDataSource<Entity>(
      injector,
      undefined,
      LoaderMethod.ChildrenService,
    );

    expect(dataSource).toBeInstanceOf(InMemoryDataSource);
  });

  it.each([
    {
      scenario: "list an internal entity type with translated texts in memory",
      entityType: InternalTranslatedTestEntity,
      expected: InMemoryDataSource,
    },
    {
      scenario: "keep paging an internal entity type without translated texts",
      entityType: InternalTestEntity,
      expected: PaginatedDataSource,
    },
    {
      scenario: "keep paging a regular entity type",
      entityType: TestEntity,
      expected: PaginatedDataSource,
    },
    {
      scenario: "let an explicit dataSource win",
      entityType: InternalTranslatedTestEntity,
      dataSource: "paginated" as const,
      expected: PaginatedDataSource,
    },
    {
      scenario: "keep paging a loader that serves pages",
      entityType: InternalTranslatedTestEntity,
      loaderMethod: LoaderMethod.AuditRecordsRelatedToEntity,
      expected: PaginatedDataSource,
    },
  ])(
    "should $scenario when online",
    ({ entityType, dataSource, loaderMethod, expected }) => {
      environment.session_type = SessionType.online;

      const resolved = resolveDataSource<Entity>(
        injector,
        dataSource,
        loaderMethod,
        entityType,
      );

      expect(resolved).toBeInstanceOf(expected);
    },
  );

  it("should always use the InMemoryDataSource outside of online mode, regardless of loaderMethod", () => {
    environment.session_type = SessionType.mock;

    const dataSource = resolveDataSource<Entity>(
      injector,
      undefined,
      LoaderMethod.ChildrenService,
    );

    expect(dataSource).toBeInstanceOf(InMemoryDataSource);
  });
});
