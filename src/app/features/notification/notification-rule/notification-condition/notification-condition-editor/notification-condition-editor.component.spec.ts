import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotificationConditionEditorComponent } from "./notification-condition-editor.component";

describe("NotificationConditionEditorComponent", () => {
  let component: NotificationConditionEditorComponent;
  let fixture: ComponentFixture<NotificationConditionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationConditionEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationConditionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
