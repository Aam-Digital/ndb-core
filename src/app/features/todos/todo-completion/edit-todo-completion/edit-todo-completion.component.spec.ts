import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditTodoCompletionComponent } from "./edit-todo-completion.component";
import { Todo } from "../../model/todo";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityFormService } from "../../../../core/common-components/entity-form/entity-form.service";
import { TodoService } from "../../todo.service";
import { FormControl } from "@angular/forms";

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
    component.formControl = new FormControl();

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
