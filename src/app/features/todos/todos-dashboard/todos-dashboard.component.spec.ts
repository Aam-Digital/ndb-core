import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { TodosDashboardComponent } from "./todos-dashboard.component";
import { Todo } from "../model/todo";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { LoginState } from "../../../core/session/session-states/login-state.enum";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import moment from "moment";
import { UserService } from "../../../core/user/user.service";

describe("TodosDashboardComponent", () => {
  let component: TodosDashboardComponent;
  let fixture: ComponentFixture<TodosDashboardComponent>;

  const mockEntities = [
    Todo.create({ subject: "1" }),
    Todo.create({ subject: "2" }),
  ];
  let testUser: string;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TodosDashboardComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, mockEntities),
      ],
      providers: [
        {
          provide: FormDialogService,
          useValue: {
            openDialog: () => {},
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(async () => {
    testUser = TestBed.inject(UserService).getCurrentUser().name;
    fixture = TestBed.createComponent(TodosDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should not show completed todos", () => {
    const inputData = [
      Todo.create({ assignedTo: [testUser] }),
      Todo.create({
        completed: {
          completedBy: testUser,
          completedAt: new Date("2023-01-31"),
        },
        assignedTo: [testUser],
      }),
      Todo.create({ assignedTo: [testUser] }),
    ];
    const mappedData = component.dataMapper(inputData);

    expect(mappedData).toEqual([inputData[0], inputData[2]]);
  });

  it("should not todos assigned to others", () => {
    const inputData = [
      Todo.create({ assignedTo: [testUser] }),
      Todo.create({ assignedTo: ["x"] }),
    ];
    const mappedData = component.dataMapper(inputData);

    expect(mappedData).toEqual([inputData[0]]);
  });

  it("should sort data by earliest startdate or deadline", () => {
    const inputData = [
      Todo.create({
        startDate: new Date("2022-01-04"),
        deadline: moment().add(10, "days").toDate(),
        assignedTo: [testUser],
      }),
      Todo.create({
        startDate: new Date("2022-01-02"),
        assignedTo: [testUser],
      }),
      Todo.create({
        startDate: new Date("2022-01-03"),
        assignedTo: [testUser],
      }),
      Todo.create({
        deadline: new Date("2022-06-01"),
        assignedTo: [testUser],
      }),
    ];
    const mappedData = component.dataMapper(inputData);

    expect(mappedData).toEqual([
      inputData[3],
      inputData[1],
      inputData[2],
      inputData[0],
    ]);
  });
});
