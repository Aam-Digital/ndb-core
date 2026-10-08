import { TestBed } from "@angular/core/testing";

import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "./entity-special-loader.service";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { NotesService } from "../../../child-dev-project/notes/notes.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { HistoricalDataService } from "./historical-data/historical-data.service";
import type { Mock } from "vitest";
import { TodoService } from "#src/app/features/todos/todo.service";
import { AuditReferenceLoaderService } from "#src/app/features/change-history/audit-reference-loader.service";

type ChildrenServiceMock = {
  getChildren: Mock;
};

type NotesServiceMock = {
  getNotesRelatedTo: Mock;
};

type HistoricalDataServiceMock = {
  getHistoricalDataFor: Mock;
};

describe("EntitySpecialLoaderService", () => {
  let service: EntitySpecialLoaderService;

  let mockChildrenService: ChildrenServiceMock;
  let mockNotesService: NotesServiceMock;
  let mockHistoricalDataService: HistoricalDataServiceMock;
  let mockTodoService: Partial<TodoService>;
  let mockAuditReferenceLoader: Partial<AuditReferenceLoaderService>;

  beforeEach(() => {
    mockChildrenService = {
      getChildren: vi.fn(),
    };
    mockNotesService = {
      getNotesRelatedTo: vi.fn(),
    };
    mockHistoricalDataService = {
      getHistoricalDataFor: vi.fn(),
    };
    mockTodoService = {
      getTodosFor: vi.fn(),
    };
    mockAuditReferenceLoader = {
      loadPageFor: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: NotesService, useValue: mockNotesService },
        { provide: HistoricalDataService, useValue: mockHistoricalDataService },
        { provide: TodoService, useValue: mockTodoService },
        {
          provide: AuditReferenceLoaderService,
          useValue: mockAuditReferenceLoader,
        },
      ],
    });
    service = TestBed.inject(EntitySpecialLoaderService);
  });

  it("should load via ChildrenService", async () => {
    const testData = [new TestEntity()];
    mockChildrenService.getChildren.mockResolvedValue(testData);

    const actual = await service.loadData(LoaderMethod.ChildrenService);

    expect(actual).toEqual(testData);
    expect(mockChildrenService.getChildren).toHaveBeenCalled();
  });

  it("should load notes related to an entity via NotesService", async () => {
    const entity = new TestEntity();
    const notes = [{ id: "note-1" }];
    mockNotesService.getNotesRelatedTo.mockResolvedValue(notes);

    const actual = await service.loadDataFor(
      LoaderMethod.NotesRelatedToEntity,
      entity,
    );

    expect(actual).toEqual(notes);
    expect(mockNotesService.getNotesRelatedTo).toHaveBeenCalledWith(
      entity.getId(),
    );
  });
});
