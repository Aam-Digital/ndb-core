import { TestBed } from "@angular/core/testing";
import { ConfigurableEnumService } from "../../../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { FilterService } from "../../../core/filter/filter.service";
import { Todo } from "./todo";
import {
  TODO_COMPLETED_FILTER,
  TODO_NOT_COMPLETED_FILTER,
} from "./todo-filters";

describe("Todo completion filters", () => {
  let service: FilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ConfigurableEnumService,
          useValue: { getEnumValues: vi.fn().mockReturnValue([]) },
        },
      ],
    });
    service = TestBed.inject(FilterService);
  });

  it("should separate open and completed records for all states of the completed property", () => {
    const neverCompleted = new Todo();
    const reopened = new Todo();
    reopened.completed = null;
    const completed = new Todo();
    completed.completed = { completedBy: "User:1", completedAt: new Date() };

    const isOpen = service.getFilterPredicate(TODO_NOT_COMPLETED_FILTER);
    const isCompleted = service.getFilterPredicate(TODO_COMPLETED_FILTER);

    expect([neverCompleted, reopened, completed].filter(isOpen)).toEqual([
      neverCompleted,
      reopened,
    ]);
    expect([neverCompleted, reopened, completed].filter(isCompleted)).toEqual([
      completed,
    ]);
  });
});
