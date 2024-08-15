import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { TodosRelatedToEntityComponent } from "./todos-related-to-entity.component";
import { DatabaseTestingModule } from "../../../utils/database-testing.module";
import { Child } from "../../../child-dev-project/children/model/child";
import { Todo } from "../model/todo";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { Database } from "../../../core/database/database";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("TodosRelatedToEntityComponent", () => {
  let component: TodosRelatedToEntityComponent;
  let fixture: ComponentFixture<TodosRelatedToEntityComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TodosRelatedToEntityComponent, DatabaseTestingModule],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(TodosRelatedToEntityComponent);
    component = fixture.componentInstance;

    component.entity = new TestEntity();

    fixture.detectChanges();
  }));

  afterEach(() => TestBed.inject(Database).destroy());

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load data from index when having a single relation", async () => {
    const child = new Child();
    const relatedTodo = new Todo();
    relatedTodo.relatedEntities = [child.getId(), new TestEntity().getId()];
    const unrelatedTodo = new Todo();
    unrelatedTodo.relatedEntities = [new Child().getId()];
    await TestBed.inject(EntityMapperService).saveAll([
      relatedTodo,
      unrelatedTodo,
    ]);
    const indexSpy = spyOn(
      TestBed.inject(DatabaseIndexingService),
      "queryIndexDocs",
    ).and.callThrough();

    component.entity = child;
    component.property = undefined;
    component.filter = undefined;
    await component.ngOnInit();

    expect(indexSpy).toHaveBeenCalled();
    expect(component.filter).toEqual({
      relatedEntities: { $elemMatch: { $eq: child.getId() } },
    });
    expect(component.data).toEqual([relatedTodo]);
  });

  it("should load data with entity mapper when having multiple relations", async () => {
    const relatedEntitiesSchema = Todo.schema.get("relatedEntities");
    const originalRelatedEntitiesAdditional = relatedEntitiesSchema.additional;
    relatedEntitiesSchema.additional = [TestEntity.ENTITY_TYPE];
    const assignedToSchema = Todo.schema.get("assignedTo");
    const originalAssignedToAdditional = assignedToSchema.additional;
    assignedToSchema.additional = [TestEntity.ENTITY_TYPE];

    const user = new TestEntity();
    const relatedTodo = new Todo();
    relatedTodo.relatedEntities = [user.getId()];
    const relatedTodo2 = new Todo();
    relatedTodo2.assignedTo = [user.getId()];
    relatedTodo2.relatedEntities = [new TestEntity().getId()];
    const unrelatedTodo = new Todo();
    unrelatedTodo.relatedEntities = [new TestEntity().getId()];
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([relatedTodo, relatedTodo2, unrelatedTodo]);
    const loadTypeSpy = spyOn(entityMapper, "loadType").and.callThrough();

    component.entity = user;
    component.property = undefined;
    component.filter = undefined;
    await component.ngOnInit();

    expect(loadTypeSpy).toHaveBeenCalledWith(Todo);
    expect(component.data).toEqual(
      jasmine.arrayWithExactContents([
        relatedTodo,
        relatedTodo2,
        unrelatedTodo,
      ]),
    );
    expect(component.filter).toEqual({
      $or: [
        {
          assignedTo: { $elemMatch: { $eq: user.getId() } },
        },
        {
          relatedEntities: { $elemMatch: { $eq: user.getId() } },
        },
      ],
    });

    relatedEntitiesSchema.additional = originalRelatedEntitiesAdditional;
    assignedToSchema.additional = originalAssignedToAdditional;
  });
});
