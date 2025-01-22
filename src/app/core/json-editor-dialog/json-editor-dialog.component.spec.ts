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
        { provide: MAT_DIALOG_DATA, useValue: { value: { key: "value" } } },
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

  it("should initialize jsonDataControl with provided data", () => {
    expect(component.jsonDataControl.value).toEqual({ key: "value" });
  });

  it("should save the updated JSON value when the form is valid", () => {
    component.jsonDataControl.setValue({ key: "updated value" });
    component.onJsonValueSave();
    expect(dialogRef.close).toHaveBeenCalledWith({ key: "updated value" });
  });

  it("should close dialog with null", () => {
    component.onJsonValueCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
