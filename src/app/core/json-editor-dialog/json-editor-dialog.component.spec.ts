import { ComponentFixture, TestBed } from "@angular/core/testing";
import { JsonEditorDialogComponent } from "./json-editor-dialog.component";
import { MockedTestingModule } from "app/utils/mocked-testing.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

describe("JsonEditorDialogComponent", () => {
  let component: JsonEditorDialogComponent;
  let fixture: ComponentFixture<JsonEditorDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<JsonEditorDialogComponent>>;

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj("MatDialogRef", ["close"]);

    await TestBed.configureTestingModule({
      imports: [JsonEditorDialogComponent, MockedTestingModule.withState()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonEditorDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<
      MatDialogRef<JsonEditorDialogComponent>
    >;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize jsonData from dialog data", () => {
    const data = { value: { key: "value" } };
    component = new JsonEditorDialogComponent(data, dialogRef);
    expect(component.jsonData).toEqual(data.value);
  });

  it("should set jsonData to undefined if dialog data is not provided", () => {
    component = new JsonEditorDialogComponent(undefined, dialogRef);
    expect(component.jsonData).toBeUndefined();
  });

  it("should set jsonData to null if dialog data value is null", () => {
    const data = { value: null };
    component = new JsonEditorDialogComponent(data, dialogRef);
    expect(component.jsonData).toBeNull();
  });

  it("should update jsonData when onJsonChange is called", () => {
    const newJson = { updatedKey: "updatedValue" };
    component.onJsonChange(newJson);
    expect(component.jsonData).toEqual(newJson);
  });

  it("should update isValidJson when onJsonIsValidChange is called", () => {
    component.onJsonIsValidChange(false);
    expect(component.isValidJson).toBeFalse();

    component.onJsonIsValidChange(true);
    expect(component.isValidJson).toBeTrue();
  });

  it("should close dialog with updated jsonData when onJsonValueSave is called", () => {
    const jsonData = { key: "value" };
    component.jsonData = jsonData;
    component.onJsonValueSave();
    expect(dialogRef.close).toHaveBeenCalledWith(jsonData);
  });

  it("should close dialog with null when onJsonValueCancel is called", () => {
    component.onJsonValueCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
