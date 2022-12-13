import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TodoCompletionComponent } from "./todo-completion.component";
import { TodosModule } from "../../todos.module";
import { SessionService } from "../../../../core/session/session-service/session.service";

describe("TodoCompletionComponent", () => {
  let component: TodoCompletionComponent;
  let fixture: ComponentFixture<TodoCompletionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosModule],
      providers: [{ provide: SessionService, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoCompletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
