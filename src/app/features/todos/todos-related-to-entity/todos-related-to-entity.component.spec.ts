import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TodosRelatedToEntityComponent } from "./todos-related-to-entity.component";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { Entity } from "../../../core/entity/model/entity";

describe("TodosRelatedToEntityComponent", () => {
  let component: TodosRelatedToEntityComponent;
  let fixture: ComponentFixture<TodosRelatedToEntityComponent>;

  let mockIndexingService: jasmine.SpyObj<DatabaseIndexingService>;

  beforeEach(async () => {
    mockIndexingService = jasmine.createSpyObj([
      "generateIndexOnProperty",
      "queryIndexDocs",
    ]);
    mockIndexingService.queryIndexDocs.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [TodosRelatedToEntityComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: DatabaseIndexingService,
          useValue: mockIndexingService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodosRelatedToEntityComponent);
    component = fixture.componentInstance;

    component.entity = new Entity();

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
