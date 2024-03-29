import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { DisplayTodoCompletionComponent } from "./display-todo-completion.component";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { Child } from "../../../../child-dev-project/children/model/child";

describe("DisplayTodoCompletionComponent", () => {
  let component: DisplayTodoCompletionComponent;
  let fixture: ComponentFixture<DisplayTodoCompletionComponent>;
  let entityMapper: MockEntityMapperService;

  beforeEach(async () => {
    entityMapper = mockEntityMapper();
    await TestBed.configureTestingModule({
      imports: [DisplayTodoCompletionComponent],
      providers: [{ provide: EntityMapperService, useValue: entityMapper }],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayTodoCompletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the entity in completedBy when it has full ID", fakeAsync(() => {
    const completingChild = new Child("1");
    const otherChild = new Child("2");
    entityMapper.addAll([completingChild, otherChild]);

    component.value = {
      completedBy: completingChild.getId(),
      completedAt: new Date(),
    };
    component.ngOnInit();
    tick();

    expect(component.completedBy).toEqual(completingChild);
  }));
});
