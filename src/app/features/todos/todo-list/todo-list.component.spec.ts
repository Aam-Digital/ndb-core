import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TodoListComponent } from "./todo-list.component";
import { ActivatedRoute } from "@angular/router";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { of } from "rxjs";

describe("TodoListComponent", () => {
  let component: TodoListComponent;
  let fixture: ComponentFixture<TodoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoListComponent, MockedTestingModule.withState()],
      providers: [{ provide: ActivatedRoute, useValue: { data: of([]) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
