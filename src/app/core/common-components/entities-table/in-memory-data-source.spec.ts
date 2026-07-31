import { TestBed } from "@angular/core/testing";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapperProvider } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { Entity } from "../../entity/model/entity";
import { InMemoryDataSource } from "./in-memory-data-source";
import { FilterService } from "../../filter/filter.service";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { BulkOperationStateService } from "../../entity/entity-actions/bulk-operation-state.service";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { EntitySpecialLoaderService } from "../../entity/entity-special-loader/entity-special-loader.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import {
  entityRegistry,
  EntityRegistry,
} from "../../entity/database-entity.decorator";

describe("InMemoryDataSource", () => {
  let dataSource: InMemoryDataSource<Entity>;
  let entityMapper: EntityMapperService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InMemoryDataSource,
        FilterService,
        BulkOperationStateService,
        EntitySchemaService,
        ...mockEntityMapperProvider(),
        { provide: EntityRegistry, useValue: entityRegistry },
        // the table loads plain entities here, no special loader and no bulk operation involved
        { provide: EntitySpecialLoaderService, useValue: null },
        { provide: ConfigurableEnumService, useValue: {} },
        { provide: ConfirmationDialogService, useValue: {} },
      ],
    });

    dataSource = TestBed.inject(InMemoryDataSource);
    entityMapper = TestBed.inject(EntityMapperService);
    dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
    TestBed.tick();
  });

  it("should create", () => {
    expect(dataSource).toBeTruthy();
  });

  it("should add a new entity that was created after the initial loading to the table", async () => {
    const entity = new TestEntity();

    await entityMapper.save(entity);
    // flush the signal effects (allRecords -> filteredRecords -> data)
    TestBed.tick();

    expect(dataSource.data).toEqual([{ record: entity }]);
  });

  it("should remove an entity from the table when it has been deleted", async () => {
    const entity = new TestEntity();
    await entityMapper.save(entity);
    TestBed.tick();

    expect(dataSource.data).toEqual([{ record: entity }]);

    await entityMapper.remove(entity);
    TestBed.tick();

    expect(dataSource.data).toEqual([]);
  });
});
