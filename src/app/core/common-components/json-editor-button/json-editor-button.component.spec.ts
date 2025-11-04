import { ComponentFixture, TestBed } from "@angular/core/testing";
import { JsonEditorButtonComponent } from "./json-editor-button.component";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "../../admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { of } from "rxjs";

describe("JsonEditorButtonComponent", () => {
  let component: JsonEditorButtonComponent;
  let fixture: ComponentFixture<JsonEditorButtonComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<JsonEditorDialogComponent>>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["afterClosed"]);
    mockDialogRef.afterClosed.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [JsonEditorButtonComponent],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonEditorButtonComponent);
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

  it("should use empty object when current value is null", () => {
    component.value = null;
    mockDialog.open.and.returnValue(mockDialogRef);

    component.openJsonEditor();

    expect(mockDialog.open).toHaveBeenCalledWith(JsonEditorDialogComponent, {
      data: {
        value: {},
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
