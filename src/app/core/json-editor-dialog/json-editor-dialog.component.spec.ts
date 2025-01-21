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

  it("should update the json data when json changed", () => {
    const json = { key: "value" };
    component.onJsonChange(json);
    expect().nothing();
  });

  it("should set json data from dialog data", () => {
    const data = { value: { foo: "bar" } };
    component = new JsonEditorDialogComponent(data, dialogRef);
    expect(component.jsonData).toEqual(data.value);
  });

  it("should set json data to empty object if dialog data is not provided", () => {
    component = new JsonEditorDialogComponent(undefined, dialogRef);
    expect(component.jsonData).toBeUndefined();
  });

  it("should set json data to empty object if dialog data value is null", () => {
    const data = { value: null };
    component = new JsonEditorDialogComponent(data, dialogRef);
    expect(component.jsonData).toBeNull();
  });
});
