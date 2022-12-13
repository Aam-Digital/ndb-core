import {ComponentFixture, TestBed} from "@angular/core/testing";

import {TodosRelatedToEntityComponent} from "./todos-related-to-entity.component";
import {DatabaseIndexingService} from "../../../core/entity/database-indexing/database-indexing.service";
import {SessionService} from "app/core/session/session-service/session.service";

describe("TodosRelatedToEntityComponent", () => {
  let component: TodosRelatedToEntityComponent;
  let fixture: ComponentFixture<TodosRelatedToEntityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TodosRelatedToEntityComponent],
      providers: [
        {
          provide: DatabaseIndexingService,
          useValue: jasmine.createSpyObj(["createIndex", "queryIndexDocs"]),
        },
        {provide: SessionService, useValue: null},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodosRelatedToEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
