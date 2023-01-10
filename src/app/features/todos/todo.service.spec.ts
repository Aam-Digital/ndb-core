import { TestBed } from "@angular/core/testing";

import { TodoService } from "./todo.service";
import { SessionService } from "../../core/session/session-service/session.service";
import { AlertService } from "../../core/alerts/alert.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";

describe("TodoService", () => {
  let service: TodoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: null },
        { provide: AlertService, useValue: null },
        { provide: EntityMapperService, useValue: null },
      ],
    });
    service = TestBed.inject(TodoService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
