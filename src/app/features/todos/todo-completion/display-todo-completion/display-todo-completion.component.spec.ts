import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayTodoCompletionComponent } from "./display-todo-completion.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { User } from "../../../../core/user/user";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("DisplayTodoCompletionComponent", () => {
  let component: DisplayTodoCompletionComponent;
  let fixture: ComponentFixture<DisplayTodoCompletionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayTodoCompletionComponent, FontAwesomeTestingModule],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper([new User("test")]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayTodoCompletionComponent);
    component = fixture.componentInstance;
    component.value = {
      completedBy: `${User.ENTITY_TYPE}:test`,
      completedAt: new Date(),
    };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
