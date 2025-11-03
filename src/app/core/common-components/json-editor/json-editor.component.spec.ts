import { ComponentFixture, TestBed } from "@angular/core/testing";
import { JsonEditorComponent } from "./json-editor.component";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "../../admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { of } from "rxjs";

describe("JsonEditorComponent", () => {
  let component: JsonEditorComponent;
  let fixture: ComponentFixture<JsonEditorComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<JsonEditorDialogComponent>>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["afterClosed"]);
    mockDialogRef.afterClosed.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [JsonEditorComponent],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open JSON editor dialog with current value", () => {
    const testValue = { test: "value" };
    component.value = testValue;
    mockDialog.open.and.returnValue(mockDialogRef);

    component.openJsonEditor();

    expect(mockDialog.open).toHaveBeenCalledWith(JsonEditorDialogComponent, {
      data: {
        value: testValue,
        closeButton: true,
      },
    });
  });

  it("should use initialValue when current value is null", () => {
    const initialValue = { default: "config" };
    component.initialValue = initialValue;
    component.value = null;
    mockDialog.open.and.returnValue(mockDialogRef);

    component.openJsonEditor();

    expect(mockDialog.open).toHaveBeenCalledWith(JsonEditorDialogComponent, {
      data: {
        value: initialValue,
        closeButton: true,
      },
    });
  });

  it("should update value when dialog returns result", () => {
    const newValue = { updated: "data" };
    mockDialogRef.afterClosed.and.returnValue(of(newValue));
    mockDialog.open.and.returnValue(mockDialogRef);
    spyOn(component, "onChange");

    component.openJsonEditor();

    expect(component.value).toEqual(newValue);
    expect(component.onChange).toHaveBeenCalledWith(newValue);
  });

  it("should not update value when dialog is cancelled", () => {
    const originalValue = { original: "value" };
    component.value = originalValue;
    mockDialogRef.afterClosed.and.returnValue(of(undefined));
    mockDialog.open.and.returnValue(mockDialogRef);
    spyOn(component, "onChange");

    component.openJsonEditor();

    expect(component.value).toEqual(originalValue);
    expect(component.onChange).not.toHaveBeenCalled();
  });
});
