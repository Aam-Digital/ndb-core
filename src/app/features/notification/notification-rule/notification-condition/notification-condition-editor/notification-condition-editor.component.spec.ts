import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationConditionEditorComponent } from "./notification-condition-editor.component";
import { MockedTestingModule } from "app/utils/mocked-testing.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

describe("NotificationConditionEditorComponent", () => {
  let component: NotificationConditionEditorComponent;
  let fixture: ComponentFixture<NotificationConditionEditorComponent>;
  let dialogRef: jasmine.SpyObj<
    MatDialogRef<NotificationConditionEditorComponent>
  >;

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj("MatDialogRef", ["close"]);

    await TestBed.configureTestingModule({
      imports: [
        NotificationConditionEditorComponent,
        MockedTestingModule.withState(),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationConditionEditorComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<
      MatDialogRef<NotificationConditionEditorComponent>
    >;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should close dialog when json is changed", () => {
    const json = { key: "value" };
    component.onJsonChange(json);
    expect(dialogRef.close).toHaveBeenCalledWith(json);
  });

  it("should set json data from dialog data", () => {
    const data = { value: { foo: "bar" } };
    component = new NotificationConditionEditorComponent(data, dialogRef);
    expect(component.jsonData).toEqual(data.value);
  });

  it("should set json data to empty object if dialog data is not provided", () => {
    component = new NotificationConditionEditorComponent(undefined, dialogRef);
    expect(component.jsonData).toBeUndefined();
  });

  it("should set json data to empty object if dialog data value is null", () => {
    const data = { value: null };
    component = new NotificationConditionEditorComponent(data, dialogRef);
    expect(component.jsonData).toBeNull();
  });
});
