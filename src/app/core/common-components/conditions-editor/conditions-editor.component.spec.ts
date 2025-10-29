import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConditionsEditorComponent } from "./conditions-editor.component";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ConditionsEditorComponent", () => {
  let component: ConditionsEditorComponent;
  let fixture: ComponentFixture<ConditionsEditorComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);

    await TestBed.configureTestingModule({
      imports: [ConditionsEditorComponent, NoopAnimationsModule],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionsEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open JSON editor dialog when button is clicked", () => {
    const testValue = { status: "active" };
    component.value = testValue;

    mockDialog.open.and.returnValue({
      afterClosed: () => of({ status: "inactive" }),
    } as any);

    component.openConditionsEditor();

    expect(mockDialog.open).toHaveBeenCalled();
    const dialogConfig = mockDialog.open.calls.mostRecent().args[1] as any;
    expect(dialogConfig.data.value).toEqual(testValue);
    expect(dialogConfig.data.closeButton).toBeTrue();
  });

  it("should update value when dialog returns result", (done) => {
    const initialValue = { status: "active" };
    const newValue = { status: "inactive", priority: "high" };
    component.value = initialValue;

    mockDialog.open.and.returnValue({
      afterClosed: () => of(newValue),
    } as any);

    component.openConditionsEditor();

    setTimeout(() => {
      expect(component.value).toEqual(newValue);
      done();
    }, 100);
  });

  it("should not update value when dialog is cancelled", (done) => {
    const initialValue = { status: "active" };
    component.value = initialValue;

    mockDialog.open.and.returnValue({
      afterClosed: () => of(undefined),
    } as any);

    component.openConditionsEditor();

    setTimeout(() => {
      expect(component.value).toEqual(initialValue);
      done();
    }, 100);
  });

});
