import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TasksRelatedToEntityComponent } from "./tasks-related-to-entity.component";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";

describe("TasksRelatedToEntityComponent", () => {
  let component: TasksRelatedToEntityComponent;
  let fixture: ComponentFixture<TasksRelatedToEntityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TasksRelatedToEntityComponent],
      providers: [
        {
          provide: DatabaseIndexingService,
          useValue: jasmine.createSpyObj(["createIndex", "queryIndexDocs"]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksRelatedToEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
