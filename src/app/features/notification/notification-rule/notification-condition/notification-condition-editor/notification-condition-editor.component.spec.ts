import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationConditionEditorComponent } from "./notification-condition-editor.component";
import { MockedTestingModule } from "app/utils/mocked-testing.module";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

describe("NotificationConditionEditorComponent", () => {
  let component: NotificationConditionEditorComponent;
  let fixture: ComponentFixture<NotificationConditionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationConditionEditorComponent,
        MockedTestingModule.withState(),
      ],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationConditionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
