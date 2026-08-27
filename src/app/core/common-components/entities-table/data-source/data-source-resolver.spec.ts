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

describe("resolveDataSource", () => {
  let injector: Injector;
  const originalSessionType = environment.session_type;
  const originalDefaultDataSource = environment.default_data_source;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
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
