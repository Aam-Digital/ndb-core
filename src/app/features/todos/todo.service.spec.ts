import { TestBed } from "@angular/core/testing";

import { TodoService } from "./todo.service";
import { AlertService } from "../../core/alerts/alert.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { CurrentUserSubject } from "../../core/session/current-user-subject";
import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";

describe("TodoService", () => {
  let service: TodoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CurrentUserSubject,
        { provide: AlertService, useValue: null },
        { provide: EntityMapperService, useValue: null },
        { provide: DatabaseIndexingService, useValue: null },
      ],
    });
    service = TestBed.inject(TodoService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
