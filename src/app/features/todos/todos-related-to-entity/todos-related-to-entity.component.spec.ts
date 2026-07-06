import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { DatabaseResolverService } from "../../../core/database/database-resolver.service";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { DatabaseTestingModule } from "../../../utils/database-testing.module";
import { expectArrayWithExactContents } from "../../../utils/test-utils/array-test-utils";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { Todo } from "../model/todo";
import { TodosRelatedToEntityComponent } from "./todos-related-to-entity.component";

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

    fixture.componentRef.setInput("entity", new TestEntity());

    fixture.detectChanges();
  }));

  afterEach(() => TestBed.inject(DatabaseResolverService).destroyDatabases());

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load data from index when having a single relation", async () => {
    const child = createEntityOfType("Child");
    const relatedTodo = new Todo();
    relatedTodo.relatedEntities = [child.getId(), new TestEntity().getId()];
    const unrelatedTodo = new Todo();
    unrelatedTodo.relatedEntities = [new TestEntity().getId()];
    await TestBed.inject(EntityMapperService).saveAll([
      relatedTodo,
      unrelatedTodo,
    ]);
    const indexSpy = vi
      .spyOn(TestBed.inject(DatabaseIndexingService), "queryIndexDocs")
      .mockResolvedValue([relatedTodo]);

    fixture.componentRef.setInput("entity", child);
    fixture.componentRef.setInput("property", undefined);
    fixture.componentRef.setInput("filter", undefined);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    expect(indexSpy).toHaveBeenCalled();
    expect(component.filterObj()).toEqual({
      relatedEntities: { $elemMatch: { $eq: child.getId() } },
      isActive: true,
    });
    expect(component.recordsDataSource().allRecords()).toEqual([relatedTodo]);
  });

  it("should load data with entity mapper when having multiple relations", waitForAsync(async () => {
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
    const loadTypeSpy = vi
      .spyOn(entityMapper, "loadType")
      .mockResolvedValue([relatedTodo, relatedTodo2, unrelatedTodo]);

    fixture.componentRef.setInput("entity", user);
    fixture.componentRef.setInput("property", undefined);
    fixture.componentRef.setInput("filter", undefined);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    expect(loadTypeSpy).toHaveBeenCalledWith(Todo);
    expectArrayWithExactContents(component.recordsDataSource().allRecords(), [
      relatedTodo,
      relatedTodo2,
      unrelatedTodo,
    ]);
    expect(component.filterObj()).toEqual({
      $or: [
        {
          assignedTo: { $elemMatch: { $eq: user.getId() } },
        },
        {
          relatedEntities: { $elemMatch: { $eq: user.getId() } },
        },
      ],
      isActive: true,
    });

    relatedEntitiesSchema.additional = originalRelatedEntitiesAdditional;
    assignedToSchema.additional = originalAssignedToAdditional;
  }));
});
