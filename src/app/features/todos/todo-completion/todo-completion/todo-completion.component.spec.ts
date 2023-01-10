import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TodoCompletionComponent } from "./todo-completion.component";
import { ConfigService } from "../../../../core/config/config.service";
import { Todo } from "../../model/todo";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("TodoCompletionComponent", () => {
  let component: TodoCompletionComponent;
  let fixture: ComponentFixture<TodoCompletionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoCompletionComponent, FontAwesomeTestingModule],
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
