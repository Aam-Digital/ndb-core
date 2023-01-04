import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { TodosDashboardComponent } from "./todos-dashboard.component";
import { MatTableModule } from "@angular/material/table";
import { Todo } from "../model/todo";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { LoginState } from "../../../core/session/session-states/login-state.enum";
import { DashboardModule } from "../../../core/dashboard/dashboard.module";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";

describe("TodosDashboardComponent", () => {
  let component: TodosDashboardComponent;
  let fixture: ComponentFixture<TodosDashboardComponent>;

  const mockEntities = [
    Todo.create({ subject: "1" }),
    Todo.create({ subject: "2" }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockedTestingModule.withState(LoginState.LOGGED_IN, mockEntities),
        DashboardModule,
        MatTableModule,
      ],
      declarations: [TodosDashboardComponent],
      providers: [
        {
          provide: FormDialogService,
          useValue: {
            openDialog: () => {},
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(TodosDashboardComponent);
    component = fixture.componentInstance;
    component.onInitFromDynamicConfig({});
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
