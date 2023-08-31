import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TodoDetailsComponent } from "./todo-details.component";
import { AlertService } from "../../../core/alerts/alert.service";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Todo } from "../model/todo";
import { TodoService } from "../todo.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { LoginState } from "../../../core/session/session-states/login-state.enum";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { NEVER } from "rxjs";

describe("TodoDetailsComponent", () => {
  let component: TodoDetailsComponent;
  let fixture: ComponentFixture<TodoDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TodoDetailsComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN),
      ],
      providers: [
        { provide: AlertService, useValue: null },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entity: new Todo(), columns: [] },
        },
        {
          provide: MatDialogRef,
          useValue: {
            close: () => {},
            backdropClick: () => NEVER,
            afterClosed: () => NEVER,
          },
        },
        TodoService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoDetailsComponent);
    component = fixture.componentInstance;

    component.entity = new Todo();

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should save entity with all changes when completing todo", async () => {
    const editedEntityProp = "subject";
    component.formColumns = [[{ id: editedEntityProp }]];
    component.ngOnInit();

    component.form.get(editedEntityProp).setValue("123");
    component.form.get(editedEntityProp).markAsDirty();
    await component.completeTodo();

    const savedEntity = await TestBed.inject<EntityMapperService>(
      EntityMapperService,
    ).load(Todo, component.entity.getId(true));
    expect(savedEntity.subject).toBe("123");
    expect(savedEntity.completed).toBeTruthy();
  });
});
