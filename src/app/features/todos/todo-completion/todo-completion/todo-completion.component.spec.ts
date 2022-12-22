import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TodoCompletionComponent } from "./todo-completion.component";
import { TodosModule } from "../../todos.module";
import { ConfigService } from "../../../../core/config/config.service";
import { Todo } from "../../model/todo";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("TodoCompletionComponent", () => {
  let component: TodoCompletionComponent;
  let fixture: ComponentFixture<TodoCompletionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosModule, FontAwesomeTestingModule],
      providers: [{ provide: ConfigService, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoCompletionComponent);
    component = fixture.componentInstance;
    component.entity = new Todo();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
