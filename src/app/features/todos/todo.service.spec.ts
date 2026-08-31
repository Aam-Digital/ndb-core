import { TestBed } from "@angular/core/testing";

import { TodoService } from "./todo.service";
import { AlertService } from "../../core/alerts/alert.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { CurrentUserSubject } from "../../core/session/current-user-subject";
import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { Todo } from "./model/todo";
import { TestEntity } from "../../utils/test-utils/TestEntity";

describe("TodoService", () => {
  let service: TodoService;
  let mockIndexing: Partial<DatabaseIndexingService>;
  let mockEntityMapper: Partial<EntityMapperService>;

  beforeEach(() => {
    mockIndexing = {
      generateIndexOnProperty: vi.fn().mockResolvedValue(undefined),
      queryIndexDocs: vi.fn().mockResolvedValue([]),
    };
    mockEntityMapper = { loadType: vi.fn().mockResolvedValue([]) };

    TestBed.configureTestingModule({
      providers: [
        CurrentUserSubject,
        { provide: AlertService, useValue: null },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: DatabaseIndexingService, useValue: mockIndexing },
      ],
    });
    service = TestBed.inject(TodoService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("getTodosFor", () => {
    it("should query the index of the given relation property", async () => {
      const entity = new TestEntity("1");

      await service.getTodosFor(entity, "relatedEntities");

      expect(mockIndexing.queryIndexDocs).toHaveBeenCalledWith(
        Todo,
        "todo_index/by_relatedEntities",
        expect.objectContaining({ endkey: [entity.getId()] }),
      );
      expect(mockEntityMapper.loadType).not.toHaveBeenCalled();
    });

    it("should load all Todos if the relation property is ambiguous, because the index needs one property", async () => {
      const entity = new TestEntity("1");

      await service.getTodosFor(entity, ["assignedTo", "relatedEntities"]);

      expect(mockEntityMapper.loadType).toHaveBeenCalledWith(Todo);
      expect(mockIndexing.queryIndexDocs).not.toHaveBeenCalled();
    });

    it("should load all Todos if no relation property is given", async () => {
      await service.getTodosFor(new TestEntity("1"));

      expect(mockEntityMapper.loadType).toHaveBeenCalledWith(Todo);
      expect(mockIndexing.queryIndexDocs).not.toHaveBeenCalled();
    });
  });
});
