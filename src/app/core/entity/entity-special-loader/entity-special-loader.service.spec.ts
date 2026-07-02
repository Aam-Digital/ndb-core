import { TestBed } from "@angular/core/testing";

import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "./entity-special-loader.service";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { HistoricalDataService } from "./historical-data/historical-data.service";
import type { Mock } from "vitest";
import { TodoService } from "#src/app/features/todos/todo.service";

type ChildrenServiceMock = {
  getChildren: Mock;
  getNotesRelatedTo: Mock;
};

type HistoricalDataServiceMock = {
  getHistoricalDataFor: Mock;
};

describe("EntitySpecialLoaderService", () => {
  let service: EntitySpecialLoaderService;

  let mockChildrenService: ChildrenServiceMock;
  let mockHistoricalDataService: HistoricalDataServiceMock;
  let mockTodoService: TodoService;

  beforeEach(() => {
    mockChildrenService = {
      getChildren: vi.fn(),
      getNotesRelatedTo: vi.fn(),
    };
    mockHistoricalDataService = {
      getHistoricalDataFor: vi.fn(),
    };
    mockTodoService = {
      getTodosFor: vi.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: HistoricalDataService, useValue: mockHistoricalDataService },
        { provide: TodoService, useValue: mockTodoService },
      ],
    });
    service = TestBed.inject(EntitySpecialLoaderService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should load via ChildrenService", async () => {
    const testData = [new TestEntity()];
    mockChildrenService.getChildren.mockResolvedValue(testData);

    const actual = await service.loadData(LoaderMethod.ChildrenService);

    expect(actual).toEqual(testData);
    expect(mockChildrenService.getChildren).toHaveBeenCalled();
  });

  it("should load notes related to an entity via ChildrenService", async () => {
    const entity = new TestEntity();
    const notes = [{ id: "note-1" }];
    mockChildrenService.getNotesRelatedTo.mockResolvedValue(notes);

    const actual = await service.loadDataFor(
      LoaderMethod.NotesRelatedToEntity,
      entity,
    );

    expect(actual).toEqual(notes);
    expect(mockChildrenService.getNotesRelatedTo).toHaveBeenCalledWith(
      entity.getId(),
    );
  });
});
