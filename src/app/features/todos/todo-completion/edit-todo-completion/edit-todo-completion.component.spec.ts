import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityFormService } from "../../../../core/common-components/entity-form/entity-form.service";
import { setupCustomFormControlEditComponent } from "../../../../core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { Todo } from "../../model/todo";
import { TodoService } from "../../todo.service";
import { EditTodoCompletionComponent } from "./edit-todo-completion.component";

describe("EditTodoCompletionComponent", () => {
  let component: EditTodoCompletionComponent;
  let fixture: ComponentFixture<EditTodoCompletionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTodoCompletionComponent, FontAwesomeTestingModule],
      providers: [
        { provide: EntityFormService, useValue: null },
        { provide: TodoService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTodoCompletionComponent);
    component = fixture.componentInstance;

    component.entity = new Todo();
    setupCustomFormControlEditComponent(component);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
